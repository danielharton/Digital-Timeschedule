import { Router } from "express";
import crypto from "crypto";
import { userAuthMiddleware } from "../utils/middlewares/userAuthMiddleware.mjs";
import { getAuthToken, md5Hash, sendJsonResponse } from "../utils/utilFunctions.mjs";
import db from "../utils/database.mjs";


const router = Router();

const hasRole = (req, roleName) =>
  (req.user?.roles || []).some((role) => role.name === roleName);

const mapUser = (user) => ({
  id: user.user_id,
  first_name: user.first_name,
  last_name: user.last_name,
  cnp: user.cnp,
  email: user.email_address,
  birth_date: user.birth_date,
  address: user.address,
  phone: user.phone
});

const normalizeJsonForChecksum = (jsonString) => {
  const normalized = JSON.stringify(JSON.parse(jsonString));
  const checksum = crypto.createHash("sha256").update(normalized, "utf8").digest("hex");
  return { normalized, checksum };
};

const getLanguagePreference = async (knex, userId) => {
  const pref = await knex("user_preferences as up")
    .leftJoin("language_packs as lp", "up.language_pack_id", "lp.language_pack_id")
    .where("up.user_id", userId)
    .select(
      "up.language_mode",
      "up.first_login_completed",
      "lp.language_pack_id",
      "lp.display_name",
      "lp.language_code",
      "lp.is_custom",
      "lp.json_content"
    )
    .first();

  if (!pref) {
    return { language_mode: "en", first_login_completed: false, language_pack: null };
  }
  return {
    language_mode: pref.language_mode,
    first_login_completed: !!pref.first_login_completed,
    language_pack: pref.language_pack_id
      ? {
        language_pack_id: pref.language_pack_id,
        display_name: pref.display_name,
        language_code: pref.language_code,
        is_custom: pref.is_custom,
        json_content: pref.json_content
      }
      : null
  };
};

const getLoginPayload = async (knex, user) => {
  const pref = await getLanguagePreference(knex, user.user_id);
  return {
    user: mapUser(user),
    language_setup_required: !pref.first_login_completed,
    language_preference: pref
  };
};

const getCurrentSemester = async (knex) =>
  knex("semesters")
    .whereRaw("CURRENT_DATE BETWEEN start_date AND end_date")
    .orderBy("semester_id", "desc")
    .first();

const ensureAdminWeeksConfigured = async (req, res, knex) => {
  
  void req;
  void res;
  void knex;
  return true;
};

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return sendJsonResponse(res, false, 400, "Email and password are required", null);
    }

    const knex = await db.getKnex();
    const user = await knex("users").where({ email_address: email.trim().toLowerCase() }).first();
    if (!user || md5Hash(password) !== user.password_hash) {
      return sendJsonResponse(res, false, 401, "Invalid credentials", null);
    }

    const token = getAuthToken(user.user_id, user.email_address, false, "1d", true);
    await knex("users")
      .where({ user_id: user.user_id })
      .update({ session_token_hash: md5Hash(token), updated_at: knex.fn.now() });

    res.set("X-Auth-Token", token);
    return sendJsonResponse(res, true, 200, "Successfully logged in!", await getLoginPayload(knex, user));
  } catch (error) {
    return sendJsonResponse(res, false, 500, "Internal server error", { details: error.message });
  }
});

router.get("/checkLogin", userAuthMiddleware, async (req, res) => {
  const knex = await db.getKnex();
  const payload = await getLoginPayload(knex, req.user);
  return sendJsonResponse(res, true, 200, "User is logged in", {
    ...payload.user,
    roles: req.user.roles,
    language_setup_required: payload.language_setup_required,
    language_preference: payload.language_preference
  });
});

router.get("/settings", userAuthMiddleware, async (req, res) => {
  try {
    const knex = await db.getKnex();
    const pref = await getLanguagePreference(knex, req.user.user_id);
    const packs = await knex("language_packs")
      .select("language_pack_id", "display_name", "language_code", "is_custom")
      .orderBy("display_name");
    return sendJsonResponse(res, true, 200, "Settings fetched", {
      language_preference: pref,
      language_packs: packs,
      can_manage_languages: hasRole(req, "admin"),
      english_json_example: JSON.stringify(
        { "menu.settings": "Settings", "settings.save": "Save", "teacher.schedule": "Teacher Schedule" },
        null,
        2
      )
    });
  } catch (error) {
    return sendJsonResponse(res, false, 500, "Failed to fetch settings", { details: error.message });
  }
});

router.get("/settings/english-template-download", userAuthMiddleware, async (_req, res) => {
  try {
    const payload = {
      "menu.admin_users": "Manage users",
      "menu.admin_subjects": "Manage subjects",
      "menu.schedule_planner": "Schedule Planner",
      "menu.academic_weeks": "Academic Weeks",
      "menu.admin_statistics": "Statistics",
      "menu.teacher_schedule": "Teacher Schedule",
      "menu.teacher_group_planner": "Group Planner",
      "menu.student_schedule": "My Timetable",
      "menu.settings": "Settings",
      "settings.language": "Language",
      "settings.save": "Save",
      "dialog.delete_activity": "Delete activity",
      "dialog.replace_activity": "Replace activity",
      "dialog.place_activity": "Place activity",
      "label.subject": "Subject",
      "label.group": "Group",
      "label.series": "Series",
      "label.room": "Room",
      "label.semester": "Semester",
      "label.notes": "Notes",
      "table.monday": "Monday",
      "table.tuesday": "Tuesday",
      "table.wednesday": "Wednesday",
      "table.thursday": "Thursday",
      "table.friday": "Friday",
      "table.saturday": "Saturday",
      "table.sunday": "Sunday",
      roles: {
        admin: "admin",
        student: "student",
        teacher: "teacher"
      },
      subjects: {
        software_quality_and_testing: "Software Quality and Testing",
        economic_information_systems: "Economic Information Systems",
        computer_networks: "Computer Networks",
        sociology: "Sociology",
        business_law: "Business Law",
        software_packages: "Software Packages",
        time_series: "Time Series",
        classroom_management: "Classroom Management"
      }
    };
    const content = JSON.stringify(payload, null, 2);
    const buffer = Buffer.from(`\uFEFF${content}`, "utf8");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=\"english-language-template.json\"");
    return res.send(buffer);
  } catch (error) {
    return sendJsonResponse(res, false, 500, "Failed to generate english language template", { details: error.message });
  }
});

router.post("/settings/language", userAuthMiddleware, async (req, res) => {
  try {
    const knex = await db.getKnex();
    const { mode, language_pack_id, custom_language_json, custom_language_name, custom_language_code } = req.body;
    if (!["en", "ro", "custom"].includes(mode)) {
      return sendJsonResponse(res, false, 400, "Invalid language mode", null);
    }

    let customPackId = null;
    if (mode === "custom") {
      const isAdmin = hasRole(req, "admin");
      if (!isAdmin && custom_language_json) {
        return sendJsonResponse(res, false, 403, "Only admins can upload or modify custom languages", null);
      }
      if (language_pack_id) {
        customPackId = Number(language_pack_id);
      } else if (custom_language_json) {
        let normalized;
        let checksum;
        try {
          const parsed = normalizeJsonForChecksum(custom_language_json);
          normalized = parsed.normalized;
          checksum = parsed.checksum;
        } catch (_err) {
          return sendJsonResponse(res, false, 400, "Invalid custom language JSON", null);
        }

        const existingPack = await knex("language_packs").where({ json_checksum: checksum }).first();
        if (existingPack) {
          customPackId = existingPack.language_pack_id;
        } else {
          const inserted = await knex("language_packs")
            .insert({
              language_code: custom_language_code || "custom",
              display_name: custom_language_name || "Custom language",
              is_custom: true,
              json_content: normalized,
              json_checksum: checksum,
              encoding: "utf8"
            })
            .returning("language_pack_id");
          customPackId = inserted[0].language_pack_id;
        }
      } else {
        return sendJsonResponse(res, false, 400, "Custom mode needs a pack id or custom JSON", null);
      }
    }

    const prefPayload = {
      language_mode: mode,
      language_pack_id: mode === "custom" ? customPackId : null,
      first_login_completed: true,
      updated_at: knex.fn.now()
    };
    
    await knex("user_preferences")
      .insert({
        user_id: req.user.user_id,
        ...prefPayload,
        created_at: knex.fn.now()
      })
      .onConflict("user_id")
      .merge({
        language_mode: prefPayload.language_mode,
        language_pack_id: prefPayload.language_pack_id,
        first_login_completed: prefPayload.first_login_completed,
        updated_at: prefPayload.updated_at
      });

    return sendJsonResponse(res, true, 200, "Language preference saved", null);
  } catch (error) {
    return sendJsonResponse(res, false, 500, "Failed to save language preference", { details: error.message });
  }
});

router.get("/getUsers", userAuthMiddleware, async (req, res) => {
  try {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    if (!hasRole(req, "admin")) return sendJsonResponse(res, false, 403, "Not authorized", null);
    const q = (req.query.q || "").toString().trim().toLowerCase();
    const knex = await db.getKnex();
    if (!(await ensureAdminWeeksConfigured(req, res, knex))) return;

    const rows = await knex("users as u")
      .join("user_rights as ur", "u.user_id", "ur.user_id")
      .join("roles as r", "ur.role_id", "r.role_id")
      .modify((qb) => {
        if (q) {
          qb.where(function() {
            this.whereRaw(
              "LOWER(u.first_name || ' ' || u.last_name) LIKE ? OR LOWER(u.email_address) LIKE ? OR LOWER(u.cnp) LIKE ?",
              [`%${q}%`, `%${q}%`, `%${q}%`]
            )
            .orWhereExists(function() {
              this.select('*').from('students as s')
                .leftJoin('groups as g', 's.group_id', 'g.group_id')
                .whereRaw('s.student_id = u.user_id')
                .andWhere(function() {
                  this.whereRaw('LOWER(g.group_name) LIKE ?', [`%${q}%`])
                      .orWhereRaw('LOWER(s.series) LIKE ?', [`%${q}%`]);
                });
            })
            .orWhereExists(function() {
              this.select('*').from('subject_teachers as st')
                .join('subjects as sub', 'st.subject_id', 'sub.subject_id')
                .whereRaw('st.teacher_id = u.user_id')
                .andWhereRaw('LOWER(sub.name) LIKE ?', [`%${q}%`]);
            });
          });
        }
      })
      .select("u.user_id", "u.first_name", "u.last_name", "u.cnp", "u.email_address", "u.phone", "u.updated_at", "r.name as role_name")
      .orderBy("u.updated_at", "desc")
      .orderBy("u.user_id", "desc");

    const users = [];
    for (const row of rows) {
      let assignedTo = "";
      let groupName = "";
      let groupId = "";
      let series = "";
      let subjects = "";

      if (row.role_name === "teacher") {
        const assignedStudents = await knex("student_teacher_assignments as sta")
          .join("users as u", "sta.student_id", "u.user_id")
          .join("students as s", "sta.student_id", "s.student_id")
          .leftJoin("groups as g", "s.group_id", "g.group_id")
          .where("sta.teacher_id", row.user_id)
          .select("u.first_name", "u.last_name", "g.group_id", "g.group_name", "s.series as series_letter");

        const byGroup = {};
        const noGroupStudents = [];

        assignedStudents.forEach(stu => {
          if (stu.group_id) {
            if (!byGroup[stu.group_name]) byGroup[stu.group_name] = [];
            byGroup[stu.group_name].push(`${stu.first_name} ${stu.last_name}`);
          } else {
            noGroupStudents.push(`${stu.first_name} ${stu.last_name}`);
          }
        });

        const groupsList = [];
        const studentsList = [...noGroupStudents];
        
        for (const [gName, stuList] of Object.entries(byGroup)) {
          if (stuList.length >= 2) {
            groupsList.push(gName);
          } else {
            studentsList.push(...stuList);
          }
        }

        let assignmentParts = [];
        if (groupsList.length > 0) assignmentParts.push(`Groups: ${groupsList.join(", ")}`);
        if (studentsList.length > 0) {
          const displayedStudents = studentsList.length > 10 ? `${studentsList.slice(0, 10).join(", ")} and ${studentsList.length - 10} more` : studentsList.join(", ");
          assignmentParts.push(`Students: ${displayedStudents}`);
        }
        assignedTo = assignmentParts.join("\\n");
        
        const subs = await knex("subject_teachers as st")
          .join("subjects as s", "st.subject_id", "s.subject_id")
          .where("st.teacher_id", row.user_id)
          .select("s.name")
          .distinct();
        subjects = subs.map(s => s.name).join(", ");
      } else if (row.role_name === "student") {
        const tt = await knex("student_teacher_assignments as sta")
          .join("users as u", "sta.teacher_id", "u.user_id")
          .where("sta.student_id", row.user_id)
          .select("u.first_name", "u.last_name");
        assignedTo = tt.map((x) => `${x.first_name} ${x.last_name}`).join(", ");

        const stu = await knex("students as s")
          .leftJoin("groups as g", "s.group_id", "g.group_id")
          .where("s.student_id", row.user_id)
          .first();
        if (stu) {
          groupName = stu.group_name || "";
          groupId = stu.group_id || "";
          series = stu.series || "";
        }
      }
      users.push({ 
        ...row, 
        assigned_to: assignedTo, 
        assigned_count: assignedTo ? assignedTo.split(",").length : 0,
        group_name: groupName,
        group_id: groupId,
        series: series,
        subjects: subjects
      });
    }

    return sendJsonResponse(res, true, 200, "Users fetched", users);
  } catch (error) {
    return sendJsonResponse(res, false, 500, "Internal server error", { details: error.message });
  }
});

router.post("/create", userAuthMiddleware, async (req, res) => {
  try {
    if (!hasRole(req, "admin")) return sendJsonResponse(res, false, 403, "Not authorized", null);
    const { first_name, last_name, cnp, email, password, phone, role_name, group_id, new_group_name, series, registration_no, year_of_study, academic_title, department, office } = req.body;
    if (!first_name || !last_name || !cnp || !email || !password || !role_name) {
      return sendJsonResponse(res, false, 400, "Missing required fields", null);
    }
    if (!/^\d{13}$/.test(String(cnp))) return sendJsonResponse(res, false, 400, "CNP must have 13 digits", null);

    const knex = await db.getKnex();
    if (!(await ensureAdminWeeksConfigured(req, res, knex))) return;
    const role = await knex("roles").where({ name: role_name }).first();
    if (!role) return sendJsonResponse(res, false, 400, "Invalid role", null);

    const existing = await knex("users").where({ email_address: email.trim().toLowerCase() }).orWhere({ cnp: String(cnp) }).first();
    if (existing) return sendJsonResponse(res, false, 409, "User already exists", null);

    const inserted = await knex("users").insert({
      first_name,
      last_name,
      cnp: String(cnp),
      email_address: email.trim().toLowerCase(),
      password_hash: md5Hash(password),
      phone: phone || null
    }).returning("user_id");

    const userId = inserted[0].user_id;
    await knex("user_rights").insert({ user_id: userId, role_id: role.role_id });
    await knex("user_preferences").insert({ user_id: userId, first_login_completed: false });

    if (role_name === "student") {
      let finalGroupId = group_id || null;
      if (new_group_name) {
        const existingGroup = await knex("groups").whereRaw("LOWER(group_name) = LOWER(?)", [new_group_name.trim()]).first();
        if (existingGroup) {
          finalGroupId = existingGroup.group_id;
        } else {
          const prog = await knex("study_programs").first();
          if (!prog) return sendJsonResponse(res, false, 400, "No study programs available to attach new group to", null);
          const [newGroup] = await knex("groups").insert({
            group_name: new_group_name.trim(),
            program_id: prog.program_id,
            study_year: year_of_study || 1,
            series: series || null
          }).returning("group_id");
          finalGroupId = newGroup.group_id || newGroup.id || newGroup;
          
          if (typeof finalGroupId === 'object') finalGroupId = finalGroupId.group_id;
        }
      }
      await knex("students").insert({ student_id: userId, group_id: finalGroupId, series: series || null, registration_no: registration_no || `REG-${userId}`, year_of_study: year_of_study || 1 });
    }
    if (role_name === "teacher") {
      await knex("teachers").insert({ teacher_id: userId, academic_title: academic_title || null, department: department || null, office: office || null });
    }
    return sendJsonResponse(res, true, 201, "User created", { user_id: userId });
  } catch (error) {
    return sendJsonResponse(res, false, 500, "Internal server error", { details: error.message });
  }
});

router.put("/update/:userId", userAuthMiddleware, async (req, res) => {
  try {
    if (!hasRole(req, "admin")) return sendJsonResponse(res, false, 403, "Not authorized", null);

    const userId = Number(req.params.userId);
    if (!userId) return sendJsonResponse(res, false, 400, "Invalid user id", null);

    const { first_name, last_name, cnp, email, password, phone, role_name, group_id, new_group_name, series } = req.body;
    if (!first_name || !last_name || !cnp || !email || !role_name) {
      return sendJsonResponse(res, false, 400, "Missing required fields", null);
    }
    if (!/^\d{13}$/.test(String(cnp))) return sendJsonResponse(res, false, 400, "CNP must have 13 digits", null);

    const knex = await db.getKnex();
    if (!(await ensureAdminWeeksConfigured(req, res, knex))) return;

    const user = await knex("users").where({ user_id: userId }).first();
    if (!user) return sendJsonResponse(res, false, 404, "User not found", null);

    const role = await knex("roles").where({ name: role_name }).first();
    if (!role) return sendJsonResponse(res, false, 400, "Invalid role", null);

    const emailAddress = email.trim().toLowerCase();
    const conflict = await knex("users")
      .whereNot({ user_id: userId })
      .andWhere((qb) => qb.where({ email_address: emailAddress }).orWhere({ cnp: String(cnp) }))
      .first();
    if (conflict) return sendJsonResponse(res, false, 409, "Another user already uses this email or CNP", null);

    const currentRoleRow = await knex("user_rights as ur")
      .join("roles as r", "ur.role_id", "r.role_id")
      .where("ur.user_id", userId)
      .select("ur.role_id", "r.name")
      .first();
    const currentRole = currentRoleRow?.name;
    const roleChanged = !!currentRole && currentRole !== role_name;

    await knex("users")
      .where({ user_id: userId })
      .update({
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        cnp: String(cnp),
        email_address: emailAddress,
        phone: phone || null,
        ...(password ? { password_hash: md5Hash(password) } : {}),
        updated_at: knex.fn.now()
      });

    if (!currentRoleRow || currentRoleRow.role_id !== role.role_id) {
      await knex("user_rights").where({ user_id: userId }).del();
      await knex("user_rights").insert({ user_id: userId, role_id: role.role_id });
    }

    
    if (roleChanged && currentRole === "student") {
      await knex("student_teacher_assignments").where({ student_id: userId }).del();
    }
    if (roleChanged && currentRole === "teacher") {
      await knex("student_teacher_assignments").where({ teacher_id: userId }).del();
    }

    if (role_name === "teacher") {
      await knex("students").where({ student_id: userId }).del();
      const teacher = await knex("teachers").where({ teacher_id: userId }).first();
      if (!teacher) await knex("teachers").insert({ teacher_id: userId });
      if (currentRole === "student") {
        await knex("student_teacher_assignments").where({ student_id: userId }).del();
      }
    } else if (role_name === "student") {
      await knex("teachers").where({ teacher_id: userId }).del();
      const student = await knex("students").where({ student_id: userId }).first();
      if (!student) {
        await knex("students").insert({
          student_id: userId,
          group_id: group_id || null,
          series: series || null,
          registration_no: `REG-${userId}`,
          year_of_study: 1
        });
      } else {
        let finalGroupId = group_id !== undefined ? group_id : student.group_id;
        if (new_group_name) {
          const existingGroup = await knex("groups").whereRaw("LOWER(group_name) = LOWER(?)", [new_group_name.trim()]).first();
          if (existingGroup) {
            finalGroupId = existingGroup.group_id;
          } else {
            const prog = await knex("study_programs").first();
            if (!prog) return sendJsonResponse(res, false, 400, "No study programs available to attach new group to", null);
            const [newGroup] = await knex("groups").insert({
              group_name: new_group_name.trim(),
              program_id: prog.program_id,
              study_year: 1,
              series: series || null
            }).returning("group_id");
            finalGroupId = newGroup.group_id || newGroup.id || newGroup;
            if (typeof finalGroupId === 'object') finalGroupId = finalGroupId.group_id;
          }
        }
        await knex("students").where({ student_id: userId }).update({
          group_id: finalGroupId,
          series: series !== undefined ? series : student.series
        });
      }
      if (currentRole === "teacher") {
        await knex("student_teacher_assignments").where({ teacher_id: userId }).del();
      }
    } else {
      await knex("teachers").where({ teacher_id: userId }).del();
      await knex("students").where({ student_id: userId }).del();
      await knex("student_teacher_assignments").where({ teacher_id: userId }).orWhere({ student_id: userId }).del();
    }

    return sendJsonResponse(res, true, 200, "User updated", { user_id: userId });
  } catch (error) {
    return sendJsonResponse(res, false, 500, "Failed to update user", { details: error.message });
  }
});

router.delete("/deleteUser/:userId", userAuthMiddleware, async (req, res) => {
  try {
    if (!hasRole(req, "admin")) return sendJsonResponse(res, false, 403, "Not authorized", null);
    const { userId } = req.params;
    if (Number(userId) === req.user.user_id) return sendJsonResponse(res, false, 400, "Cannot delete your own account", null);
    const knex = await db.getKnex();
    if (!(await ensureAdminWeeksConfigured(req, res, knex))) return;
    await knex("users").where({ user_id: userId }).del();
    return sendJsonResponse(res, true, 200, "User deleted", null);
  } catch (error) {
    return sendJsonResponse(res, false, 500, "Internal server error", { details: error.message });
  }
});

router.post("/assignAccounts", userAuthMiddleware, async (req, res) => {
  try {
    const isAdmin = hasRole(req, "admin");
    const isTeacher = hasRole(req, "teacher");
    if (!isAdmin && !isTeacher) return sendJsonResponse(res, false, 403, "Not authorized", null);
    const { user_id, assign_to_user_id } = req.body;
    if (!user_id || !assign_to_user_id || Number(user_id) === Number(assign_to_user_id)) {
      return sendJsonResponse(res, false, 400, "Invalid assignment users", null);
    }

    const knex = await db.getKnex();
    if (isAdmin && !(await ensureAdminWeeksConfigured(req, res, knex))) return;
    const roles = await knex("user_rights as ur")
      .join("roles as r", "ur.role_id", "r.role_id")
      .whereIn("ur.user_id", [user_id, assign_to_user_id])
      .select("ur.user_id", "r.name");

    const roleA = roles.find((r) => Number(r.user_id) === Number(user_id))?.name;
    const roleB = roles.find((r) => Number(r.user_id) === Number(assign_to_user_id))?.name;
    if (!roleA || !roleB) return sendJsonResponse(res, false, 404, "Users or roles not found", null);

    let teacherId;
    let studentId;
    if (roleA === "teacher" && roleB === "student") {
      teacherId = Number(user_id);
      studentId = Number(assign_to_user_id);
    } else if (roleA === "student" && roleB === "teacher") {
      teacherId = Number(assign_to_user_id);
      studentId = Number(user_id);
    } else {
      return sendJsonResponse(res, false, 400, "Only teacher-student assignment is allowed", null);
    }

    if (isTeacher && !isAdmin && Number(teacherId) !== Number(req.user.user_id)) {
      return sendJsonResponse(res, false, 403, "Teachers may only link their own account to a student", null);
    }

    const existing = await knex("student_teacher_assignments").where({ teacher_id: teacherId, student_id: studentId }).first();
    if (!existing) {
      await knex("student_teacher_assignments").insert({ teacher_id: teacherId, student_id: studentId });
    }
    return sendJsonResponse(res, true, 200, "Assignment saved", null);
  } catch (error) {
    return sendJsonResponse(res, false, 500, "Failed to assign accounts", { details: error.message });
  }
});



router.post("/bulkDelete", userAuthMiddleware, async (req, res) => {
  try {
    if (!hasRole(req, "admin")) return sendJsonResponse(res, false, 403, "Not authorized", null);
    const { target_role, filters = {} } = req.body;
    const knex = await db.getKnex();
    if (!(await ensureAdminWeeksConfigured(req, res, knex))) return;
    if (!["student", "teacher"].includes(target_role)) {
      return sendJsonResponse(res, false, 400, "target_role must be student or teacher", null);
    }

    let ids = [];
    if (target_role === "student") {
      ids = (await knex("students as s")
        .join("users as u", "s.student_id", "u.user_id")
        .join("groups as g", "s.group_id", "g.group_id")
        .join("study_programs as sp", "g.program_id", "sp.program_id")
        .modify((qb) => {
          if (filters.group_name) qb.whereILike("g.group_name", `%${filters.group_name}%`);
          if (filters.series || filters.series) qb.where("g.series", filters.series || filters.series);
          if (filters.specialization) qb.whereILike("sp.program_name", `%${filters.specialization}%`);
          if (filters.faculty) qb.whereILike("sp.faculty_name", `%${filters.faculty}%`);
          if (filters.university) qb.whereILike("sp.university_name", `%${filters.university}%`);
        })
        .select("u.user_id")).map((x) => x.user_id);
    } else {
      ids = (await knex("teachers as t")
        .join("users as u", "t.teacher_id", "u.user_id")
        .leftJoin("subject_teachers as st", "st.teacher_id", "t.teacher_id")
        .leftJoin("subjects as s", "st.subject_id", "s.subject_id")
        .leftJoin("study_programs as sp", "s.program_id", "sp.program_id")
        .modify((qb) => {
          if (filters.subject) qb.whereILike("s.name", `%${filters.subject}%`);
          if (filters.specialization) qb.whereILike("sp.program_name", `%${filters.specialization}%`);
          if (filters.faculty) qb.whereILike("sp.faculty_name", `%${filters.faculty}%`);
          if (filters.university) qb.whereILike("sp.university_name", `%${filters.university}%`);
        })
        .select("u.user_id")).map((x) => x.user_id);
    }

    const safeIds = ids.filter((id) => Number(id) !== Number(req.user.user_id));
    if (safeIds.length === 0) return sendJsonResponse(res, true, 200, "No users matched filters", { deleted: 0 });

    await knex("users").whereIn("user_id", safeIds).del();
    return sendJsonResponse(res, true, 200, "Users deleted by filters", { deleted: safeIds.length });
  } catch (error) {
    return sendJsonResponse(res, false, 500, "Failed bulk delete", { details: error.message });
  }
});

router.get("/getTeachers", userAuthMiddleware, async (_req, res) => {
  try {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    const knex = await db.getKnex();
    const teachers = await knex("teachers as t")
      .join("users as u", "t.teacher_id", "u.user_id")
      .select("u.user_id", "u.first_name", "u.last_name", "u.email_address")
      .orderBy("u.last_name");
    return sendJsonResponse(res, true, 200, "Teachers fetched", teachers);
  } catch (error) {
    return sendJsonResponse(res, false, 500, "Internal server error", { details: error.message });
  }
});



router.get("/associations", userAuthMiddleware, async (req, res) => {
  try {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    if (!hasRole(req, "admin")) return sendJsonResponse(res, false, 403, "Not authorized", null);
    const userId = Number(req.query.user_id);
    if (!userId) return sendJsonResponse(res, false, 400, "user_id is required", null);
    const knex = await db.getKnex();

    const role = await knex("user_rights as ur")
      .join("roles as r", "ur.role_id", "r.role_id")
      .where("ur.user_id", userId)
      .select("r.name")
      .first();
    if (!role) return sendJsonResponse(res, false, 404, "Role not found", null);

    let rows = [];
    if (role.name === "teacher") {
      rows = await knex("student_teacher_assignments as sta")
        .join("users as u", "sta.student_id", "u.user_id")
        .leftJoin("students as s", "sta.student_id", "s.student_id")
        .leftJoin("groups as g", "s.group_id", "g.group_id")
        .where("sta.teacher_id", userId)
        .select(
          "u.user_id", 
          "u.first_name", 
          "u.last_name", 
          "u.email_address", 
          "s.series", 
          "g.group_name",
          knex.raw("true as is_manual"),
          knex.raw("'student' as role_name")
        )
        .orderBy([{column: 's.series', order: 'asc', nulls: 'first'}, {column: 'g.group_name', order: 'asc', nulls: 'first'}, {column: 'u.last_name', order: 'asc'}]);
    } else if (role.name === "student") {
      rows = await knex("student_teacher_assignments as sta")
        .join("users as u", "sta.teacher_id", "u.user_id")
        .where("sta.student_id", userId)
        .select("u.user_id", "u.first_name", "u.last_name", "u.email_address", knex.raw("'teacher' as role_name"));
    }
    return sendJsonResponse(res, true, 200, "Associations fetched", rows);
  } catch (error) {
    return sendJsonResponse(res, false, 500, "Failed to fetch associations", { details: error.message });
  }
});

router.delete("/associations", userAuthMiddleware, async (req, res) => {
  try {
    if (!hasRole(req, "admin")) return sendJsonResponse(res, false, 403, "Not authorized", null);
    const { user_id, counterpart_user_id } = req.body;
    if (!user_id || !counterpart_user_id) {
      return sendJsonResponse(res, false, 400, "user_id and counterpart_user_id are required", null);
    }
    const knex = await db.getKnex();
    const roleRows = await knex("user_rights as ur")
      .join("roles as r", "ur.role_id", "r.role_id")
      .whereIn("ur.user_id", [user_id, counterpart_user_id])
      .select("ur.user_id", "r.name");
    const roleA = roleRows.find((r) => Number(r.user_id) === Number(user_id))?.name;
    const roleB = roleRows.find((r) => Number(r.user_id) === Number(counterpart_user_id))?.name;
    let teacherId;
    let studentId;
    if (roleA === "teacher" && roleB === "student") {
      teacherId = Number(user_id);
      studentId = Number(counterpart_user_id);
    } else if (roleA === "student" && roleB === "teacher") {
      teacherId = Number(counterpart_user_id);
      studentId = Number(user_id);
    } else {
      return sendJsonResponse(res, false, 400, "Association must be between teacher and student", null);
    }
    const existing = await knex("student_teacher_assignments").where({ teacher_id: teacherId, student_id: studentId }).first();
    if (existing) {
      await knex("student_teacher_assignments").where({ teacher_id: teacherId, student_id: studentId }).del();
    }
    return sendJsonResponse(res, true, 200, "Association deleted", null);
  } catch (error) {
    return sendJsonResponse(res, false, 500, "Failed to delete association", { details: error.message });
  }
});


router.get("/teacher-subjects", userAuthMiddleware, async (req, res) => {
  try {
    if (!hasRole(req, "admin")) return sendJsonResponse(res, false, 403, "Not authorized", null);
    const knex = await db.getKnex();
    const rows = await knex("subject_teachers as st")
      .join("subjects as s", "st.subject_id", "s.subject_id")
      .join("users as u", "st.teacher_id", "u.user_id")
      .whereIn("st.activity_type", ["course", "seminar"])
      .select(
        "st.subject_teacher_id",
        "st.teacher_id",
        "st.subject_id",
        "st.activity_type",
        "s.name as subject_name",
        "u.first_name",
        "u.last_name"
      )
      .orderBy("u.last_name")
      .orderBy("s.name");
    return sendJsonResponse(res, true, 200, "Teacher subjects fetched", rows);
  } catch (error) {
    return sendJsonResponse(res, false, 500, "Failed to fetch teacher subjects", { details: error.message });
  }
});

router.post("/teacher-subjects", userAuthMiddleware, async (req, res) => {
  try {
    if (!hasRole(req, "admin")) return sendJsonResponse(res, false, 403, "Not authorized", null);
    const { teacher_id, subject_id, activity_type } = req.body;
    if (!teacher_id || !subject_id || !activity_type) {
      return sendJsonResponse(res, false, 400, "teacher_id, subject_id and activity_type are required", null);
    }
    if (!["course", "seminar"].includes(activity_type)) {
      return sendJsonResponse(res, false, 400, "Activity type can only be course or seminar", null);
    }
    const knex = await db.getKnex();
    if (!(await ensureAdminWeeksConfigured(req, res, knex))) return;
    const exists = await knex("subject_teachers").where({ teacher_id, subject_id, activity_type }).first();
    if (exists) return sendJsonResponse(res, false, 409, "Teacher-subject assignment already exists", null);
    const inserted = await knex("subject_teachers")
      .insert({ teacher_id, subject_id, activity_type })
      .returning("*");
    return sendJsonResponse(res, true, 201, "Teacher subject saved", inserted[0]);
  } catch (error) {
    return sendJsonResponse(res, false, 500, "Failed to save teacher subject", { details: error.message });
  }
});

router.delete("/teacher-subjects/:subjectTeacherId", userAuthMiddleware, async (req, res) => {
  try {
    if (!hasRole(req, "admin")) return sendJsonResponse(res, false, 403, "Not authorized", null);
    const knex = await db.getKnex();
    if (!(await ensureAdminWeeksConfigured(req, res, knex))) return;
    await knex("subject_teachers").where({ subject_teacher_id: req.params.subjectTeacherId }).del();
    return sendJsonResponse(res, true, 200, "Teacher subject deleted", null);
  } catch (error) {
    return sendJsonResponse(res, false, 500, "Failed to delete teacher subject", { details: error.message });
  }
});

router.get("/subjects", userAuthMiddleware, async (req, res) => {
  try {
    if (!hasRole(req, "admin")) return sendJsonResponse(res, false, 403, "Not authorized", null);
    const knex = await db.getKnex();
    const rows = await knex("subjects")
      .select("subject_id", "name", "credits", "study_year", "semester_number", "program_id")
      .orderBy("name");
    return sendJsonResponse(res, true, 200, "Subjects fetched", rows);
  } catch (error) {
    return sendJsonResponse(res, false, 500, "Failed to fetch subjects", { details: error.message });
  }
});

router.post("/subjects", userAuthMiddleware, async (req, res) => {
  try {
    if (!hasRole(req, "admin")) return sendJsonResponse(res, false, 403, "Not authorized", null);
    const { name, credits, study_year, semester_number, program_id } = req.body;
    if (!name) return sendJsonResponse(res, false, 400, "Subject name is required", null);
    const knex = await db.getKnex();
    const exists = await knex("subjects").whereRaw("LOWER(name)=LOWER(?)", [name.trim()]).first();
    if (exists) return sendJsonResponse(res, false, 409, "Subject already exists", null);
    const inserted = await knex("subjects")
      .insert({
        name: name.trim(),
        credits: credits || null,
        study_year: study_year || null,
        semester_number: semester_number || null,
        program_id: program_id || null
      })
      .returning("*");
    return sendJsonResponse(res, true, 201, "Subject created", inserted[0]);
  } catch (error) {
    return sendJsonResponse(res, false, 500, "Failed to create subject", { details: error.message });
  }
});

router.put("/subjects/:subjectId", userAuthMiddleware, async (req, res) => {
  try {
    if (!hasRole(req, "admin")) return sendJsonResponse(res, false, 403, "Not authorized", null);
    const { name, credits, study_year, semester_number, program_id } = req.body;
    const subjectId = Number(req.params.subjectId);
    if (!subjectId) return sendJsonResponse(res, false, 400, "Invalid subject id", null);
    const knex = await db.getKnex();
    const exists = await knex("subjects").where({ subject_id: subjectId }).first();
    if (!exists) return sendJsonResponse(res, false, 404, "Subject not found", null);
    if (name) {
      const conflict = await knex("subjects")
        .whereRaw("LOWER(name)=LOWER(?)", [name.trim()])
        .whereNot({ subject_id: subjectId })
        .first();
      if (conflict) return sendJsonResponse(res, false, 409, "Subject name already exists", null);
    }
    await knex("subjects")
      .where({ subject_id: subjectId })
      .update({
        name: name?.trim() || exists.name,
        credits: credits ?? exists.credits,
        study_year: study_year ?? exists.study_year,
        semester_number: semester_number ?? exists.semester_number,
        program_id: program_id ?? exists.program_id,
        updated_at: knex.fn.now()
      });
    return sendJsonResponse(res, true, 200, "Subject updated", null);
  } catch (error) {
    return sendJsonResponse(res, false, 500, "Failed to update subject", { details: error.message });
  }
});

router.delete("/subjects/:subjectId", userAuthMiddleware, async (req, res) => {
  try {
    if (!hasRole(req, "admin")) return sendJsonResponse(res, false, 403, "Not authorized", null);
    const subjectId = Number(req.params.subjectId);
    if (!subjectId) return sendJsonResponse(res, false, 400, "Invalid subject id", null);
    const knex = await db.getKnex();
    await knex("subjects").where({ subject_id: subjectId }).del();
    return sendJsonResponse(res, true, 200, "Subject deleted", null);
  } catch (error) {
    return sendJsonResponse(res, false, 500, "Failed to delete subject", { details: error.message });
  }
});

export default router;
