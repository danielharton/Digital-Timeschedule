import { Router } from "express";
import { userAuthMiddleware } from "../utils/middlewares/userAuthMiddleware.mjs";
import { sendJsonResponse } from "../utils/utilFunctions.mjs";
import db from "../utils/database.mjs";

const router = Router();
const hasRole = (req, roleName) => (req.user?.roles || []).some((role) => role.name === roleName);

const dayLabels = { 1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday", 6: "Saturday", 7: "Sunday" };
const slotLabel = (slot) => `${slot.start_time.slice(0, 5)} - ${slot.end_time.slice(0, 5)}`;

const logScheduleChange = async (knex, changedByUserId, actionType, scheduleEntryId, oldData, newData) =>
  knex("schedule_change_logs").insert({
    changed_by_user_id: changedByUserId,
    action_type: actionType,
    schedule_entry_id: scheduleEntryId || null,
    old_data: oldData || null,
    new_data: newData || null
  });

const getCurrentSemester = async (knex) =>
  knex("semesters")
    .whereRaw("CURRENT_DATE BETWEEN start_date AND end_date")
    .orderBy("semester_id", "desc")
    .first();

const checkCurrentSemesterWeeksConfigured = async (knex) => {
  const semester = await getCurrentSemester(knex);
  if (!semester) return { semester: null, isConfigured: false, canEdit: true, configuredCount: 0 };
  const activeDays = await knex("semester_active_days").where({ semester_id: semester.semester_id });
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayInSemesterWeeks = activeDays.some((day) => String(day.active_date).slice(0, 10) === todayStr);
  return {
    semester,
    configuredCount: activeDays.length,
    isConfigured: activeDays.length === 98,
    canEdit: !todayInSemesterWeeks
  };
};

const ensureAdminWeeksGuard = async (req, res, knex) => {
  
  void req;
  void res;
  void knex;
  return true;
};

const expandIntervalsToDates = (intervals = []) => {
  const daySet = new Set();
  for (const interval of intervals) {
    const start = new Date(interval.start_date);
    const end = new Date(interval.end_date);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
      throw new Error("Invalid interval date range");
    }
    const cursor = new Date(start);
    while (cursor <= end) {
      const yyyy = cursor.getFullYear();
      const mm = String(cursor.getMonth() + 1).padStart(2, '0');
      const dd = String(cursor.getDate()).padStart(2, '0');
      daySet.add(`${yyyy}-${mm}-${dd}`);
      cursor.setDate(cursor.getDate() + 1);
    }
  }
  return Array.from(daySet).sort();
};

const compressDatesToIntervals = (dateRows = []) => {
  const dates = dateRows.map((d) => {
    let dateObj = d.active_date;
    if (typeof dateObj === "string") {
      if (dateObj.match(/^\d{4}-\d{2}-\d{2}/)) return dateObj.slice(0, 10);
      dateObj = new Date(dateObj);
    }
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }).sort();
  if (dates.length === 0) return [];
  const intervals = [];
  let start = dates[0];
  let prev = new Date(dates[0]);
  for (let i = 1; i < dates.length; i += 1) {
    const current = new Date(dates[i]);
    const diffDays = Math.floor((current - prev) / (1000 * 60 * 60 * 24));
    if (diffDays !== 1) {
      const pyyyy = prev.getFullYear();
      const pmm = String(prev.getMonth() + 1).padStart(2, '0');
      const pdd = String(prev.getDate()).padStart(2, '0');
      intervals.push({ start_date: start, end_date: `${pyyyy}-${pmm}-${pdd}` });
      start = dates[i];
    }
    prev = current;
  }
  const pyyyy = prev.getFullYear();
  const pmm = String(prev.getMonth() + 1).padStart(2, '0');
  const pdd = String(prev.getDate()).padStart(2, '0');
  intervals.push({ start_date: start, end_date: `${pyyyy}-${pmm}-${pdd}` });
  return intervals;
};

const getGridRows = async (knex, filters = {}) =>
  knex("schedule_entries as se")
    .join("subject_teachers as st", "se.subject_teacher_id", "st.subject_teacher_id")
    .join("subjects as s", "st.subject_id", "s.subject_id")
    .join("users as tu", "st.teacher_id", "tu.user_id")
    .join("rooms as r", "se.room_id", "r.room_id")
    .join("buildings as b", "r.building_id", "b.building_id")
    .join("groups as g", "se.group_id", "g.group_id")
    .join("time_slots as ts", "se.time_slot_id", "ts.time_slot_id")
    .leftJoin("subject_delivery_links as sdl_group", function joinGroupLinks() {
      this.on("sdl_group.subject_teacher_id", "=", "se.subject_teacher_id")
        .andOn("sdl_group.activity_type", "=", "st.activity_type")
        .andOn("sdl_group.group_id", "=", "se.group_id");
    })
    .leftJoin("subject_delivery_links as sdl_series", function joinSeriesLinks() {
      this.on("sdl_series.subject_teacher_id", "=", "se.subject_teacher_id")
        .andOn("sdl_series.activity_type", "=", "st.activity_type")
        .andOn("sdl_series.series", "=", "g.series");
    })
    .modify((qb) => {
      if (filters.teacher_id) qb.where("st.teacher_id", filters.teacher_id);
      if (filters.group_id) {
        qb.where(function () {
          this.where("se.group_id", filters.group_id)
            .orWhere(function () {
              this.where("st.activity_type", "course")
                .andWhere("g.series", knex("groups").select("series").where("group_id", filters.group_id).limit(1));
            });
        });
      }
      if (filters.group_ids && Array.isArray(filters.group_ids) && filters.group_ids.length > 0) {
        qb.whereIn("se.group_id", filters.group_ids);
      }
      if (filters.semester_id) qb.where("se.semester_id", filters.semester_id);
      if (filters.week_types && Array.isArray(filters.week_types) && filters.week_types.length > 0) {
        qb.whereIn("se.week_type", filters.week_types);
      }
      if (filters.visibility) {
        const { teacherIds, subjectTeacherIds } = filters.visibility;
        if (!teacherIds.length && !subjectTeacherIds.length) {
          qb.whereRaw("1 = 0");
        } else {
          qb.where((thisQb) => {
            if (teacherIds.length) thisQb.orWhereIn("st.teacher_id", teacherIds);
            if (subjectTeacherIds.length) thisQb.orWhereIn("se.subject_teacher_id", subjectTeacherIds);
          });
        }
      }
    })
    .select(
      "se.schedule_entry_id",
      "se.semester_id",
      "se.group_id",
      "se.room_id",
      "se.day_of_week",
      "se.time_slot_id",
      "se.week_type",
      "se.notes",
      "se.subject_teacher_id",
      "s.name as subject_name",
      "st.activity_type",
      "st.teacher_id",
      "tu.first_name as teacher_first_name",
      "tu.last_name as teacher_last_name",
      "r.room_code",
      "b.building_code",
      "g.group_name",
      "g.series",
      "s.online_course_url",
      "s.online_seminar_url",
      knex.raw("COALESCE(sdl_group.online_url, sdl_series.online_url) as link_override"),
      "ts.start_time",
      "ts.end_time"
    );

const weekOrder = { ALL: 0, ODD: 1, EVEN: 2 };

const toGrid = (entries, slots) => {
  const grid = {};
  for (const slot of slots) {
    const row = slotLabel(slot);
    grid[row] = { Monday: null, Tuesday: null, Wednesday: null, Thursday: null, Friday: null, Saturday: null, Sunday: null };
  }
  for (const entry of entries) {
    const row = slotLabel(entry);
    const day = dayLabels[entry.day_of_week];
    if (!grid[row] || !day) continue;
    const base = {
      schedule_entry_id: entry.schedule_entry_id,
      semester_id: entry.semester_id,
      group_id: entry.group_id,
      room_id: entry.room_id,
      day_of_week: entry.day_of_week,
      time_slot_id: entry.time_slot_id,
      subject_teacher_id: entry.subject_teacher_id,
      teacher_id: entry.teacher_id,
      teacher_name: `${entry.teacher_first_name} ${entry.teacher_last_name}`,
      subject: entry.subject_name,
      activity_type: entry.activity_type,
      room: entry.room_code,
      group_name: entry.group_name,
      series: entry.series,
      week_type: entry.week_type,
      notes: entry.notes || "",
      online_url:
        entry.link_override ||
        (entry.activity_type === "course" ? entry.online_course_url : entry.online_seminar_url)
    };
    if (!grid[row][day]) {
      grid[row][day] = { ...base, activities: [base] };
    } else {
      grid[row][day].activities.push(base);
      grid[row][day].activities.sort((a, b) => (weekOrder[a.week_type] ?? 9) - (weekOrder[b.week_type] ?? 9));
      grid[row][day].week_type = grid[row][day].activities.map((x) => x.week_type).join("+");
    }
  }
  return grid;
};

const fetchSchedulePayload = async (knex, filters = {}) => {
  const slots = await knex("time_slots").select("time_slot_id", "start_time", "end_time").orderBy("start_time");
  const rows = await getGridRows(knex, filters);
  return { time_slots: slots.map(slotLabel), days: Object.values(dayLabels), grid: toGrid(rows, slots) };
};

const getVisibleFiltersForStudent = async (knex, studentId) => {
  const sid = Number(studentId);
  if (!sid) return { teacherIds: [], subjectTeacherIds: [] };

  const assigned = await knex("student_teacher_assignments").where({ student_id: sid }).pluck("teacher_id");

  const hasScopes = await knex.schema.hasTable("teacher_activity_scopes");
  if (!hasScopes) return { teacherIds: [...new Set(assigned.map(Number))], subjectTeacherIds: [] };

  const row = await knex("students as s")
    .join("groups as g", "g.group_id", "s.group_id")
    .where("s.student_id", sid)
    .select("s.group_id", "g.series")
    .first();
  if (!row) return { teacherIds: [...new Set(assigned.map(Number))], subjectTeacherIds: [] };

  const byGroup = await knex("teacher_activity_scopes as tas")
    .where("tas.scope_kind", "group")
    .andWhere("tas.group_id", row.group_id)
    .pluck("tas.subject_teacher_id");

  const bySeries = await knex("teacher_activity_scopes as tas")
    .where("tas.scope_kind", "series")
    .andWhere("tas.series_letter", row.series)
    .pluck("tas.subject_teacher_id");

  return {
    teacherIds: [...new Set(assigned.map(Number))],
    subjectTeacherIds: [...new Set([...byGroup.map(Number), ...bySeries.map(Number)])]
  };
};

const weekOverlapCondition = (qb, weekType) => {
  if (weekType === "ALL") qb.whereIn("week_type", ["ALL", "ODD", "EVEN"]);
  else qb.whereIn("week_type", [weekType, "ALL"]);
};

const normalizeGroupIds = (body) => {
  if (Array.isArray(body.group_ids) && body.group_ids.length > 0) {
    const ids = [...new Set(body.group_ids.map((x) => Number(x)).filter((n) => Number.isInteger(n) && n > 0))];
    return ids.sort((a, b) => a - b);
  }
  const g = Number(body.group_id);
  return Number.isInteger(g) && g > 0 ? [g] : [];
};


const normalizeIgnoreIdsFromBody = (body, legacySingle = null) => {
  const out = new Set();
  if (body && Array.isArray(body.ignore_schedule_entry_ids)) {
    for (const x of body.ignore_schedule_entry_ids) {
      const n = Number(x);
      if (Number.isInteger(n) && n > 0) out.add(n);
    }
  }
  if (body && body.ignore_schedule_entry_id !== undefined && body.ignore_schedule_entry_id !== null && body.ignore_schedule_entry_id !== "") {
    const n = Number(body.ignore_schedule_entry_id);
    if (Number.isInteger(n) && n > 0) out.add(n);
  }
  if (legacySingle !== undefined && legacySingle !== null && legacySingle !== "") {
    const n = Number(legacySingle);
    if (Number.isInteger(n) && n > 0) out.add(n);
  }
  return [...out];
};

const findGroupSlotConflict = async (knex, base, candidateWeekType, ignoreIds) => {
  const baseGroup = await knex("groups").where("group_id", base.group_id).first();
  if (!baseGroup) return null;

  const q = knex("schedule_entries as se")
    .join("subject_teachers as st", "se.subject_teacher_id", "st.subject_teacher_id")
    .join("groups as g", "se.group_id", "g.group_id")
    .where({
      "se.semester_id": base.semester_id,
      "se.day_of_week": base.day_of_week,
      "se.time_slot_id": base.time_slot_id
    })
    .andWhere(function () {
      this.where("se.group_id", base.group_id);
      if (baseGroup.series) {
        this.orWhere(function () {
          this.where("st.activity_type", "course")
            .andWhere("g.series", baseGroup.series);
        });
      }
    })
    .andWhere((qb) => weekOverlapCondition(qb, candidateWeekType));

  if (ignoreIds?.length) q.whereNotIn("se.schedule_entry_id", ignoreIds);
  return q.first();
};

const findRoomForeignConflict = async (knex, base, subjectTeacherId, candidateWeekType, ignoreIds) => {
  const q = knex("schedule_entries")
    .where({
      semester_id: base.semester_id,
      room_id: base.room_id,
      day_of_week: base.day_of_week,
      time_slot_id: base.time_slot_id
    })
    .whereNot("subject_teacher_id", subjectTeacherId)
    .andWhere((qb) => weekOverlapCondition(qb, candidateWeekType));
  if (ignoreIds?.length) q.whereNotIn("schedule_entry_id", ignoreIds);
  return q.first();
};

const findTeacherForeignConflict = async (knex, teacherId, base, subjectTeacherId, candidateWeekType, ignoreIds) => {
  const q = knex("schedule_entries as se")
    .join("subject_teachers as st", "se.subject_teacher_id", "st.subject_teacher_id")
    .where({
      "se.semester_id": base.semester_id,
      "se.day_of_week": base.day_of_week,
      "se.time_slot_id": base.time_slot_id,
      "st.teacher_id": teacherId
    })
    .whereNot("se.subject_teacher_id", subjectTeacherId)
    .andWhere((qb) => weekOverlapCondition(qb, candidateWeekType));
  if (ignoreIds?.length) q.whereNotIn("se.schedule_entry_id", ignoreIds);
  return q.first();
};


const findDuplicateSubjectTeacherSlot = async (knex, base, candidateWeekType, ignoreIds) => {
  const q = knex("schedule_entries")
    .where({
      semester_id: base.semester_id,
      day_of_week: base.day_of_week,
      time_slot_id: base.time_slot_id,
      subject_teacher_id: base.subject_teacher_id
    })
    .andWhere((qb) => weekOverlapCondition(qb, candidateWeekType));
  if (ignoreIds?.length) q.whereNotIn("schedule_entry_id", ignoreIds);
  return q.first();
};

const findActivityQuotaConflict = async (knex, base, candidateWeekType, ignoreIds) => {
  const st = await knex("subject_teachers").where("subject_teacher_id", base.subject_teacher_id).first();
  if (!st) return null;
  const targetGroup = await knex("groups").where("group_id", base.group_id).first();
  if (!targetGroup) return null;

  const q = knex("schedule_entries as se")
    .join("subject_teachers as st2", "se.subject_teacher_id", "st2.subject_teacher_id")
    .join("groups as g", "se.group_id", "g.group_id")
    .where("se.semester_id", base.semester_id)
    .where("st2.subject_id", st.subject_id)
    .where("st2.activity_type", st.activity_type)
    .andWhere((qb) => weekOverlapCondition(qb, candidateWeekType));

  if (st.activity_type === "course") {
    q.where("g.series", targetGroup.series);
  } else if (st.activity_type === "seminar") {
    q.where("se.group_id", base.group_id);
  }

  if (ignoreIds?.length) q.whereNotIn("se.schedule_entry_id", ignoreIds);

  return q.first();
};

const validateSchedulePayload = async (knex, teacherId, payload, isAdmin = false) => {
  if (isAdmin) {
    const st = await knex("subject_teachers").where({ subject_teacher_id: payload.subject_teacher_id }).first();
    if (!st) return { ok: false, status: 400, message: "Subject-teacher entry not found" };
    const candidateWeekType = payload.week_type || "ALL";
    if (!["ALL", "ODD", "EVEN"].includes(candidateWeekType)) {
      return { ok: false, status: 400, message: "Invalid week type" };
    }
    return { ok: true, candidateWeekType, resolvedTeacherId: st.teacher_id };
  }
  const ownSubject = await knex("subject_teachers").where({ subject_teacher_id: payload.subject_teacher_id, teacher_id: teacherId }).first();
  if (!ownSubject) return { ok: false, status: 403, message: "You can only schedule your own subject entries" };
  const candidateWeekType = payload.week_type || "ALL";
  if (!["ALL", "ODD", "EVEN"].includes(candidateWeekType)) {
    return { ok: false, status: 400, message: "Invalid week type" };
  }
  return { ok: true, candidateWeekType, resolvedTeacherId: teacherId };
};

const detectScheduleOverlap = async (knex, teacherId, payload, candidateWeekType, ignoreIds = []) => {
  const groupIds = normalizeGroupIds(payload);
  if (groupIds.length === 0) return { kind: "group_or_room", message: "group_id or group_ids required" };
  if (groupIds.length > 1) {
    return { kind: "group_or_room", message: "Only one group can be scheduled per time slot for the same activity" };
  }

  const baseSlot = {
    semester_id: payload.semester_id,
    day_of_week: payload.day_of_week,
    time_slot_id: payload.time_slot_id,
    room_id: payload.room_id
  };
  const stid = Number(payload.subject_teacher_id);
  const st = await knex("subject_teachers").where("subject_teacher_id", stid).first();
  if (!st) return { kind: "teacher", message: "Subject teacher not found" };

  for (const gid of groupIds) {
    const qConflict = await findActivityQuotaConflict(knex, { ...baseSlot, group_id: gid, subject_teacher_id: stid }, candidateWeekType, ignoreIds);
    if (qConflict) return { kind: "quota", message: "Activity quota exceeded (max 1 per week for seminar/group or course/series)" };
    const g = await findGroupSlotConflict(knex, { ...baseSlot, group_id: gid }, st, candidateWeekType, ignoreIds);
    if (g) return { kind: "group_or_room", message: "Schedule overlap detected for this group or room" };
  }
  const dup = await findDuplicateSubjectTeacherSlot(
    knex,
    { ...baseSlot, subject_teacher_id: stid },
    candidateWeekType,
    ignoreIds
  );
  if (dup) {
    return {
      kind: "duplicate_activity",
      message: "You already have this subject activity in this time slot. Edit that entry or choose another slot."
    };
  }
  const r = await findRoomForeignConflict(knex, baseSlot, stid, candidateWeekType, ignoreIds);
  if (r) return { kind: "group_or_room", message: "Room is already used for another activity in this interval" };
  const t = await findTeacherForeignConflict(knex, teacherId, baseSlot, stid, candidateWeekType, ignoreIds);
  if (t) return { kind: "teacher", message: "You already have another activity in this interval" };
  return null;
};

const validateCreate = async (knex, teacherId, body, ignoreIds = [], isAdmin = false) => {
  const groupIds = normalizeGroupIds(body);
  if (groupIds.length === 0) return { ok: false, status: 400, message: "group_id or non-empty group_ids is required" };
  if (groupIds.length > 1) {
    return {
      ok: false,
      status: 400,
      message: "Only one group per time slot for the same activity. Use another empty slot for a second group."
    };
  }

  const probe = {
    subject_teacher_id: Number(body.subject_teacher_id),
    semester_id: Number(body.semester_id),
    group_id: groupIds[0],
    week_type: body.week_type
  };
  const v = await validateSchedulePayload(knex, teacherId, probe, isAdmin);
  if (!v.ok) return v;
  const effectiveTeacherId = v.resolvedTeacherId || teacherId;

  const base = {
    semester_id: Number(body.semester_id),
    room_id: Number(body.room_id),
    day_of_week: Number(body.day_of_week),
    time_slot_id: Number(body.time_slot_id),
    subject_teacher_id: Number(body.subject_teacher_id),
    notes: body.notes || null
  };

  const gid = groupIds[0];
  const qConflict = await findActivityQuotaConflict(knex, { ...base, group_id: gid }, v.candidateWeekType, ignoreIds);
  if (qConflict) return { ok: false, status: 409, message: "Activity quota exceeded (max 1 per week for seminar/group or course/series)" };
  const g = await findGroupSlotConflict(knex, { ...base, group_id: gid }, v.candidateWeekType, ignoreIds);
  if (g) return { ok: false, status: 409, message: "Schedule overlap detected for this group or room" };

  const dup = await findDuplicateSubjectTeacherSlot(knex, base, v.candidateWeekType, ignoreIds);
  if (dup) {
    return {
      ok: false,
      status: 409,
      message: "You already have this subject activity in this time slot. Edit that entry or choose another slot."
    };
  }

  const rf = await findRoomForeignConflict(knex, base, base.subject_teacher_id, v.candidateWeekType, ignoreIds);
  if (rf) return { ok: false, status: 409, message: "Room is already used for another activity in this interval" };
  const tf = await findTeacherForeignConflict(knex, effectiveTeacherId, base, base.subject_teacher_id, v.candidateWeekType, ignoreIds);
  if (tf) return { ok: false, status: 409, message: "Teacher already has another activity in this interval" };

  const inserted = await knex("schedule_entries")
    .insert({
      semester_id: base.semester_id,
      group_id: gid,
      subject_teacher_id: base.subject_teacher_id,
      room_id: base.room_id,
      day_of_week: base.day_of_week,
      time_slot_id: base.time_slot_id,
      week_type: v.candidateWeekType,
      notes: base.notes
    })
    .returning("*");
  return { ok: true, row: inserted[0], rows: inserted };
};

const resolveCurrentStudentWeekType = async (knex) => {
  const semester = await getCurrentSemester(knex);
  if (!semester) return null;
  const todayStr = new Date().toISOString().slice(0, 10);
  const current = await knex("semester_weeks")
    .where({ semester_id: semester.semester_id })
    .whereRaw("? BETWEEN week_start AND week_end", [todayStr])
    .first();
  if (current?.week_index) return current.week_index % 2 === 0 ? "EVEN" : "ODD";
  
  if (semester.start_date) {
    const start = new Date(semester.start_date);
    const today = new Date(todayStr);
    if (!Number.isNaN(start.getTime()) && today >= start) {
      const diffDays = Math.floor((today - start) / (1000 * 60 * 60 * 24));
      const weekIndex = Math.floor(diffDays / 7) + 1;
      return weekIndex % 2 === 0 ? "EVEN" : "ODD";
    }
  }
  return null;
};



router.get("/admin/semester-weeks", userAuthMiddleware, async (req, res) => {
  try {
    if (!hasRole(req, "admin")) return sendJsonResponse(res, false, 403, "Not authorized", null);
    const semesterId = Number(req.query.semester_id);
    if (req.query.semester_id && (!Number.isInteger(semesterId) || semesterId <= 0)) {
      return sendJsonResponse(res, false, 400, "semester_id must be a positive integer", null);
    }
    const knex = await db.getKnex();
    const status = await checkCurrentSemesterWeeksConfigured(knex);
    const targetSemesterId = semesterId || status.semester?.semester_id;
    const rows = targetSemesterId
      ? await knex("semester_weeks").where({ semester_id: targetSemesterId }).orderBy("week_index")
      : [];
    const activeDays = targetSemesterId
      ? await knex("semester_active_days").where({ semester_id: targetSemesterId }).orderBy("active_date")
      : [];
    return sendJsonResponse(res, true, 200, "Semester weeks fetched", {
      ...status,
      semester_id: targetSemesterId,
      rows,
      intervals: compressDatesToIntervals(activeDays)
    });
  } catch (error) {
    return sendJsonResponse(res, false, 500, "Failed to fetch semester weeks", { details: error.message });
  }
});

router.post("/admin/semester-weeks", userAuthMiddleware, async (req, res) => {
  try {
    if (!hasRole(req, "admin")) return sendJsonResponse(res, false, 403, "Not authorized", null);
    const { semester_id, intervals } = req.body;
    if (!semester_id || !Array.isArray(intervals) || intervals.length === 0) {
      return sendJsonResponse(res, false, 400, "semester_id and at least one interval are required", null);
    }
    if (!Number.isInteger(Number(semester_id)) || Number(semester_id) <= 0) {
      return sendJsonResponse(res, false, 400, "semester_id must be a positive integer", null);
    }
    const knex = await db.getKnex();
    const status = await checkCurrentSemesterWeeksConfigured(knex);
    if (status.semester && Number(status.semester.semester_id) === Number(semester_id) && !status.canEdit) {
      return sendJsonResponse(res, false, 423, "Cannot modify weeks for a started current semester", null);
    }
    const allDates = expandIntervalsToDates(intervals);
    const weekChunks = [];
    for (let i = 0; i < allDates.length; i += 7) weekChunks.push(allDates.slice(i, i + 7));

    await knex("semester_active_days").where({ semester_id }).del();
    await knex("semester_weeks").where({ semester_id }).del();
    for (const day of allDates) {
      await knex("semester_active_days").insert({
        semester_id,
        active_date: day,
        set_by_user_id: req.user.user_id
      });
    }
    for (let weekIndex = 0; weekIndex < weekChunks.length; weekIndex += 1) {
      const chunk = weekChunks[weekIndex];
      await knex("semester_weeks").insert({
        semester_id,
        week_index: weekIndex + 1,
        week_start: chunk[0],
        week_end: chunk[chunk.length - 1],
        set_by_user_id: req.user.user_id
      });
    }
    return sendJsonResponse(res, true, 200, "Semester weeks saved", null);
  } catch (error) {
    return sendJsonResponse(res, false, 500, "Failed to save semester weeks", { details: error.message });
  }
});

router.post("/admin/subject-link", userAuthMiddleware, async (req, res) => {
  try {
    if (!hasRole(req, "admin")) return sendJsonResponse(res, false, 403, "Not authorized", null);
    const knex = await db.getKnex();
    if (!(await ensureAdminWeeksGuard(req, res, knex))) return;

    const { subject_teacher_id, group_id, series, activity_type, online_url } = req.body;
    if (!subject_teacher_id || !activity_type || !online_url || (!group_id && !series)) {
      return sendJsonResponse(res, false, 400, "subject_teacher_id, activity_type, online_url and group/series are required", null);
    }
    if (!["course", "seminar"].includes(activity_type)) {
      return sendJsonResponse(res, false, 400, "Activity type can only be course or seminar", null);
    }
    await knex("subject_delivery_links")
      .where({ subject_teacher_id, group_id: group_id || null, series: series || null, activity_type })
      .del();
    const inserted = await knex("subject_delivery_links")
      .insert({
        subject_teacher_id,
        group_id: group_id || null,
        series: series || null,
        activity_type,
        online_url,
        set_by_user_id: req.user.user_id
      })
      .returning("*");
    return sendJsonResponse(res, true, 201, "Subject delivery link saved", inserted[0]);
  } catch (error) {
    return sendJsonResponse(res, false, 500, "Failed to save subject link", { details: error.message });
  }
});

router.get("/meta", userAuthMiddleware, async (req, res) => {
  try {
    const knex = await db.getKnex();
    if (hasRole(req, "admin") && !(await ensureAdminWeeksGuard(req, res, knex))) return;
    const isTeacher = hasRole(req, "teacher");
    const [groups, rooms, subjects, semesters, timeSlots, subjectTeachers, study_programs, buildings] = await Promise.all([
      knex("groups").select("group_id", "group_name", "study_year", "series", "program_id").orderBy("group_name"),
      knex("rooms as r").join("buildings as b", "r.building_id", "b.building_id").select("r.room_id", "r.room_code", "r.building_id", "b.building_code").orderBy("b.building_code"),
      knex("subjects").select("subject_id", "name", "program_id").orderBy("name"),
      knex("semesters").select("semester_id", "academic_year", "semester_number").orderBy("semester_id", "desc"),
      knex("time_slots").select("time_slot_id", "start_time", "end_time").orderBy("start_time"),
      knex("subject_teachers as st")
        .join("subjects as s", "st.subject_id", "s.subject_id")
        .join("users as u", "u.user_id", "st.teacher_id")
        .modify((qb) => {
          qb.whereIn("st.activity_type", ["course", "seminar"]);
          if (isTeacher) qb.where("st.teacher_id", req.user.user_id);
        })
        .select("st.subject_teacher_id", "st.teacher_id", "st.subject_id", "st.activity_type", "s.name as subject_name", "u.first_name", "u.last_name"),
      knex("study_programs").select(),
      knex("buildings").select("building_id", "building_code", "name").orderBy("building_code")
    ]);

    let teacher_linked_group_ids = [];
    if (isTeacher) {
      const fromSchedule = await knex("schedule_entries as se")
        .join("subject_teachers as st", "se.subject_teacher_id", "st.subject_teacher_id")
        .where("st.teacher_id", req.user.user_id)
        .distinct("se.group_id")
        .pluck("se.group_id");
      const fromAssign = await knex("student_teacher_assignments as sta")
        .join("students as s", "sta.student_id", "s.student_id")
        .where("sta.teacher_id", req.user.user_id)
        .distinct("s.group_id")
        .pluck("s.group_id");
      teacher_linked_group_ids = [...new Set([...fromSchedule.map(Number), ...fromAssign.map(Number)])]
        .filter((n) => Number.isInteger(n) && n > 0)
        .sort((a, b) => a - b);
    }

    return sendJsonResponse(res, true, 200, "Metadata fetched", {
      groups,
      rooms,
      subjects,
      semesters,
      time_slots: timeSlots,
      subject_teachers: subjectTeachers,
      teacher_linked_group_ids,
      study_programs,
      buildings
    });
  } catch (error) {
    return sendJsonResponse(res, false, 500, "Failed to fetch metadata", { details: error.message });
  }
});

router.get("/teacher/my-schedule", userAuthMiddleware, async (req, res) => {
  try {
    if (!hasRole(req, "teacher")) return sendJsonResponse(res, false, 403, "Not authorized", null);
    const knex = await db.getKnex();
    const schedule = await fetchSchedulePayload(knex, { teacher_id: req.user.user_id });
    const currentWeekType = await resolveCurrentStudentWeekType(knex);
    const assignedStudents = await knex("student_teacher_assignments as sta")
      .join("students as s", "sta.student_id", "s.student_id")
      .join("users as u", "s.student_id", "u.user_id")
      .join("groups as g", "s.group_id", "g.group_id")
      .where("sta.teacher_id", req.user.user_id)
      .select("u.user_id", "u.first_name", "u.last_name", "u.email_address", "g.group_name", "g.study_year", "g.series");
    return sendJsonResponse(res, true, 200, "Teacher schedule fetched", { ...schedule, current_week_type: currentWeekType, assigned_students: assignedStudents });
  } catch (error) {
    return sendJsonResponse(res, false, 500, "Failed to fetch teacher schedule", { details: error.message });
  }
});

router.get("/teacher/groups/search", userAuthMiddleware, async (req, res) => {
  try {
    if (!hasRole(req, "teacher")) return sendJsonResponse(res, false, 403, "Not authorized", null);
    const q = (req.query.q || "").toString().trim().toLowerCase();
    const knex = await db.getKnex();
    const teacherId = req.user.user_id;
    const fromSchedule = await knex("schedule_entries as se")
      .join("subject_teachers as st", "se.subject_teacher_id", "st.subject_teacher_id")
      .where("st.teacher_id", teacherId)
      .distinct("se.group_id")
      .pluck("se.group_id");
    const fromAssign = await knex("student_teacher_assignments as sta")
      .join("students as s", "sta.student_id", "s.student_id")
      .where("sta.teacher_id", teacherId)
      .distinct("s.group_id")
      .pluck("s.group_id");
    const allowed = [...new Set([...fromSchedule.map(Number), ...fromAssign.map(Number)])].filter((n) => Number.isInteger(n) && n > 0);
    if (allowed.length === 0) {
      return sendJsonResponse(res, true, 200, "Teacher groups fetched", []);
    }
    const groups = await knex("groups as g")
      .whereIn("g.group_id", allowed)
      .modify((qb) => {
        if (q) qb.whereRaw("LOWER(g.group_name) LIKE ? OR LOWER(COALESCE(g.series, '')) LIKE ?", [`%${q}%`, `%${q}%`]);
      })
      .select("g.group_id", "g.group_name", "g.study_year", "g.series")
      .distinct()
      .orderBy("g.group_name");
    return sendJsonResponse(res, true, 200, "Teacher groups fetched", groups);
  } catch (error) {
    return sendJsonResponse(res, false, 500, "Failed to fetch teacher groups", { details: error.message });
  }
});

router.get("/teacher/group-schedule", userAuthMiddleware, async (req, res) => {
  try {
    if (!hasRole(req, "teacher")) return sendJsonResponse(res, false, 403, "Not authorized", null);
    const groupId = Number(req.query.group_id);
    if (!groupId) return sendJsonResponse(res, false, 400, "group_id is required", null);
    const knex = await db.getKnex();
    const viaAssign = await knex("student_teacher_assignments as sta")
      .join("students as s", "sta.student_id", "s.student_id")
      .where({ "sta.teacher_id": req.user.user_id, "s.group_id": groupId })
      .first();
    const viaSchedule = await knex("schedule_entries as se")
      .join("subject_teachers as st", "se.subject_teacher_id", "st.subject_teacher_id")
      .where({ "st.teacher_id": req.user.user_id, "se.group_id": groupId })
      .first();
    if (!viaAssign && !viaSchedule) {
      return sendJsonResponse(res, false, 403, "Teacher is not associated to this group", null);
    }
    const schedule = await fetchSchedulePayload(knex, { group_id: groupId });
    return sendJsonResponse(res, true, 200, "Group schedule fetched", schedule);
  } catch (error) {
    return sendJsonResponse(res, false, 500, "Failed to fetch group schedule", { details: error.message });
  }
});

router.get("/student/my-schedule", userAuthMiddleware, async (req, res) => {
  try {
    if (!hasRole(req, "student")) return sendJsonResponse(res, false, 403, "Not authorized", null);
    const knex = await db.getKnex();
    const student = await knex("students").where({ student_id: req.user.user_id }).first();
    if (!student) return sendJsonResponse(res, false, 404, "Student details not found", null);
    const group = await knex("groups").where({ group_id: student.group_id }).first();
    const groupPayload = group
      ? {
          group_name: group.group_name,
          study_year: group.study_year,
          series: group.series,
          university_name: group.university_name,
          faculty_code: group.faculty_code,
          faculty_display_name: group.faculty_display_name,
          specialization: group.specialization,
          numeric_group_code: group.numeric_group_code
        }
      : null;
    const currentType = await resolveCurrentStudentWeekType(knex);
    const weekTypes = ["ALL", "ODD", "EVEN"];
    const visibility = await getVisibleFiltersForStudent(knex, req.user.user_id);
    const schedule = await fetchSchedulePayload(knex, {
      group_id: student.group_id,
      week_types: weekTypes,
      visibility
    });
    const currentWeekType2 = currentType || null;
    return sendJsonResponse(res, true, 200, "Student schedule fetched", { group: groupPayload, current_week_type: currentWeekType2, ...schedule });
  } catch (error) {
    return sendJsonResponse(res, false, 500, "Failed to fetch student schedule", { details: error.message });
  }
});


router.get("/admin/teacher-activity-scopes", userAuthMiddleware, async (req, res) => {
  try {
    if (!hasRole(req, "admin")) return sendJsonResponse(res, false, 403, "Not authorized", null);
    const knex = await db.getKnex();
    if (!(await knex.schema.hasTable("teacher_activity_scopes"))) {
      return sendJsonResponse(res, true, 200, "Scopes", []);
    }
    const rows = await knex("teacher_activity_scopes as tas")
      .join("subject_teachers as st", "st.subject_teacher_id", "tas.subject_teacher_id")
      .join("subjects as sub", "sub.subject_id", "st.subject_id")
      .join("users as u", "u.user_id", "st.teacher_id")
      .modify((qb) => {
        const stid = Number(req.query.subject_teacher_id);
        if (stid) qb.where("tas.subject_teacher_id", stid);
      })
      .select(
        "tas.scope_id",
        "tas.subject_teacher_id",
        "tas.scope_kind",
        "tas.group_id",
        "tas.series_letter",
        "st.activity_type",
        "sub.name as subject_name",
        "u.first_name",
        "u.last_name"
      )
      .orderBy("tas.scope_id");
    return sendJsonResponse(res, true, 200, "Scopes", rows);
  } catch (error) {
    return sendJsonResponse(res, false, 500, "Failed to list scopes", { details: error.message });
  }
});


router.post("/admin/teacher-activity-scopes", userAuthMiddleware, async (req, res) => {
  try {
    if (!hasRole(req, "admin")) return sendJsonResponse(res, false, 403, "Not authorized", null);
    const { subject_teacher_id, scope_kind, group_id, series_letter } = req.body;
    if (!subject_teacher_id || !scope_kind) {
      return sendJsonResponse(res, false, 400, "subject_teacher_id and scope_kind are required", null);
    }
    if (!["group", "series"].includes(scope_kind)) {
      return sendJsonResponse(res, false, 400, "scope_kind must be group or series", null);
    }
    if (scope_kind === "group" && !group_id) {
      return sendJsonResponse(res, false, 400, "group_id is required for group scope", null);
    }
    if (scope_kind === "series" && !series_letter) {
      return sendJsonResponse(res, false, 400, "series_letter is required for series scope", null);
    }
    const knex = await db.getKnex();
    if (!(await knex.schema.hasTable("teacher_activity_scopes"))) {
      return sendJsonResponse(res, false, 501, "Migration not applied", null);
    }
    const inserted = await knex("teacher_activity_scopes")
      .insert({
        subject_teacher_id: Number(subject_teacher_id),
        scope_kind,
        group_id: scope_kind === "group" ? Number(group_id) : null,
        series_letter: scope_kind === "series" ? String(series_letter).trim() : null,
        set_by_user_id: req.user.user_id
      })
      .returning("*");
    return sendJsonResponse(res, true, 201, "Scope created", inserted[0]);
  } catch (error) {
    return sendJsonResponse(res, false, 500, "Failed to create scope", { details: error.message });
  }
});

router.delete("/admin/teacher-activity-scopes/:scopeId", userAuthMiddleware, async (req, res) => {
  try {
    if (!hasRole(req, "admin")) return sendJsonResponse(res, false, 403, "Not authorized", null);
    const id = Number(req.params.scopeId);
    if (!id) return sendJsonResponse(res, false, 400, "Invalid scope id", null);
    const knex = await db.getKnex();
    if (!(await knex.schema.hasTable("teacher_activity_scopes"))) {
      return sendJsonResponse(res, false, 404, "Not found", null);
    }
    const n = await knex("teacher_activity_scopes").where({ scope_id: id }).del();
    if (!n) return sendJsonResponse(res, false, 404, "Scope not found", null);
    return sendJsonResponse(res, true, 200, "Scope deleted", null);
  } catch (error) {
    return sendJsonResponse(res, false, 500, "Failed to delete scope", { details: error.message });
  }
});

router.get("/history", userAuthMiddleware, async (_req, res) => {
  try {
    const knex = await db.getKnex();
    const rows = await knex("schedule_change_logs as l")
      .join("users as u", "l.changed_by_user_id", "u.user_id")
      .select("l.log_id", "l.schedule_entry_id", "l.action_type", "l.old_data", "l.new_data", "l.created_at", "u.first_name", "u.last_name")
      .orderBy("l.created_at", "desc")
      .limit(200);
    return sendJsonResponse(res, true, 200, "History fetched", rows);
  } catch (error) {
    return sendJsonResponse(res, false, 500, "Failed to fetch history", { details: error.message });
  }
});





router.get("/admin/schedule", userAuthMiddleware, async (req, res) => {
  try {
    if (!hasRole(req, "admin")) return sendJsonResponse(res, false, 403, "Not authorized", null);
    const knex = await db.getKnex();
    const { group_id, series, teacher_id } = req.query;
    const filters = {};
    if (group_id) filters.group_id = Number(group_id);
    if (teacher_id) filters.teacher_id = Number(teacher_id);
    if (series) {
      const groupRows = await knex("groups").where({ series: series }).pluck("group_id");
      if (groupRows.length > 0) filters.group_ids = groupRows;
    }
    const currentWeekType = await resolveCurrentStudentWeekType(knex);
    const schedule = await fetchSchedulePayload(knex, filters);
    return sendJsonResponse(res, true, 200, "Admin schedule fetched", { ...schedule, current_week_type: currentWeekType });
  } catch (error) {
    return sendJsonResponse(res, false, 500, "Failed to fetch admin schedule", { details: error.message });
  }
});

router.get("/admin/statistics", userAuthMiddleware, async (req, res) => {
  try {
    if (!hasRole(req, "admin")) return sendJsonResponse(res, false, 403, "Not authorized", null);
    const knex = await db.getKnex();
    
    
    const userRolesRaw = await knex("user_rights as ur")
      .join("roles as r", "ur.role_id", "r.role_id")
      .select("r.name")
      .count("ur.user_id as count")
      .groupBy("r.name");
    
    const userDistribution = userRolesRaw.map(r => ({ name: r.name, value: parseInt(r.count, 10) }));

    
    const activityTypesRaw = await knex("schedule_entries as se")
      .join("subject_teachers as st", "se.subject_teacher_id", "st.subject_teacher_id")
      .select("st.activity_type")
      .count("se.schedule_entry_id as count")
      .groupBy("st.activity_type");
    
    const activityTypes = activityTypesRaw.map(r => ({ name: r.activity_type, value: parseInt(r.count, 10) }));

    
    const dayNames = { 1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday", 6: "Saturday", 7: "Sunday" };
    const scheduleByDayRaw = await knex("schedule_entries")
      .select("day_of_week")
      .count("schedule_entry_id as count")
      .groupBy("day_of_week")
      .orderBy("day_of_week", "asc");
    
    const scheduleByDay = scheduleByDayRaw.map(r => ({ name: dayNames[r.day_of_week], value: parseInt(r.count, 10) }));

    
    const groupsByYearRaw = await knex("groups")
      .select("study_year")
      .count("group_id as count")
      .groupBy("study_year")
      .orderBy("study_year", "asc");

    const groupsByYear = groupsByYearRaw.map(r => ({ name: `Year ${r.study_year}`, value: parseInt(r.count, 10) }));

    
    const roomOccupancyRaw = await knex("schedule_entries as se")
      .join("rooms as r", "se.room_id", "r.room_id")
      .select("r.room_code")
      .count("se.schedule_entry_id as count")
      .groupBy("r.room_code");
    
    const allRooms = await knex("rooms").select("room_code");
    const roomMap = {};
    for (const room of allRooms) roomMap[room.room_code] = 0;
    for (const r of roomOccupancyRaw) roomMap[r.room_code] = parseInt(r.count, 10);
    
    const roomOccupancy = Object.keys(roomMap).map(k => ({ name: k, value: roomMap[k] })).sort((a, b) => b.value - a.value);

    const stats = {
      userDistribution,
      activityTypes,
      scheduleByDay,
      groupsByYear,
      roomOccupancy
    };

    return sendJsonResponse(res, true, 200, "Statistics fetched", stats);
  } catch (error) {
    return sendJsonResponse(res, false, 500, "Failed to fetch statistics", { details: error.message });
  }
});

router.post("/admin/entry/check-overlap", userAuthMiddleware, async (req, res) => {
  try {
    if (!hasRole(req, "admin")) return sendJsonResponse(res, false, 403, "Not authorized", null);
    const knex = await db.getKnex();
    const payload = req.body || {};
    const gids = normalizeGroupIds(payload);
    const required = ["semester_id", "subject_teacher_id", "room_id", "day_of_week", "time_slot_id"];
    const missing =
      gids.length === 0 ||
      required.some((k) => payload[k] === undefined || payload[k] === null || payload[k] === "");
    if (missing) {
      return sendJsonResponse(res, true, 200, "Incomplete payload", { hasConflict: false, message: null });
    }
    const v = await validateSchedulePayload(knex, null, payload, true);
    if (!v.ok) {
      return sendJsonResponse(res, true, 200, "Payload invalid", { hasConflict: false, message: null, invalid: true });
    }
    const ignoreList = normalizeIgnoreIdsFromBody(payload);
    const conflict = await detectScheduleOverlap(knex, v.resolvedTeacherId, payload, v.candidateWeekType, ignoreList);
    return sendJsonResponse(res, true, 200, "Checked", { hasConflict: Boolean(conflict), message: conflict?.message || null });
  } catch (error) {
    return sendJsonResponse(res, false, 500, "Failed to check overlap", { details: error.message });
  }
});

router.post("/admin/entry/check-duplicate", userAuthMiddleware, async (req, res) => {
  try {
    if (!hasRole(req, "admin")) return sendJsonResponse(res, false, 403, "Not authorized", null);
    const knex = await db.getKnex();
    const { semester_id, subject_teacher_id, group_id, ignore_schedule_entry_id } = req.body || {};
    if (!semester_id || !subject_teacher_id || !group_id) {
      return sendJsonResponse(res, true, 200, "Incomplete", { hasDuplicate: false });
    }
    const st = await knex("subject_teachers").where({ subject_teacher_id }).first();
    if (!st) return sendJsonResponse(res, true, 200, "Not found", { hasDuplicate: false });
    const q = knex("schedule_entries as se")
      .join("subject_teachers as st2", "se.subject_teacher_id", "st2.subject_teacher_id")
      .where({
        "se.semester_id": Number(semester_id),
        "se.group_id": Number(group_id),
        "st2.subject_id": st.subject_id,
        "st2.activity_type": st.activity_type
      });
    if (ignore_schedule_entry_id) q.whereNot("se.schedule_entry_id", Number(ignore_schedule_entry_id));
    const existing = await q.first();
    if (existing) {
      return sendJsonResponse(res, true, 200, "Duplicate found", {
        hasDuplicate: true,
        existing_schedule_entry_id: existing.schedule_entry_id,
        message: `This group already has a ${st.activity_type} for this subject. Would you like to move it instead?`
      });
    }
    return sendJsonResponse(res, true, 200, "No duplicate", { hasDuplicate: false });
  } catch (error) {
    return sendJsonResponse(res, false, 500, "Failed to check duplicate", { details: error.message });
  }
});

router.post("/admin/entry", userAuthMiddleware, async (req, res) => {
  try {
    if (!hasRole(req, "admin")) return sendJsonResponse(res, false, 403, "Not authorized", null);
    const knex = await db.getKnex();
    const result = await validateCreate(knex, null, req.body, [], true);
    if (!result.ok) return sendJsonResponse(res, false, result.status, result.message, null);
    await logScheduleChange(knex, req.user.user_id, "create", result.row.schedule_entry_id, null, result.row);
    return sendJsonResponse(res, true, 201, "Schedule entry created", result.row);
  } catch (error) {
    return sendJsonResponse(res, false, 500, "Failed to create schedule entry", { details: error.message });
  }
});

router.put("/admin/entry/replace/:scheduleEntryId", userAuthMiddleware, async (req, res) => {
  try {
    if (!hasRole(req, "admin")) return sendJsonResponse(res, false, 403, "Not authorized", null);
    const knex = await db.getKnex();
    const eid = parseInt(req.params.scheduleEntryId, 10);
    if (!Number.isInteger(eid) || eid < 1) {
      return sendJsonResponse(res, false, 400, "Invalid schedule entry id", null);
    }
    const oldEntry = await knex("schedule_entries").where({ schedule_entry_id: eid }).first();
    if (!oldEntry) return sendJsonResponse(res, false, 404, "Entry not found", null);

    await knex("schedule_entries").where({ schedule_entry_id: eid }).del();
    const result = await validateCreate(knex, null, req.body, [], true);
    if (!result.ok) {
      await knex("schedule_entries").insert(oldEntry);
      return sendJsonResponse(res, false, result.status, result.message, null);
    }
    await logScheduleChange(knex, req.user.user_id, "replace", result.row.schedule_entry_id, oldEntry, result.row);
    return sendJsonResponse(res, true, 200, "Schedule entry replaced", result.row);
  } catch (error) {
    return sendJsonResponse(res, false, 500, "Failed to replace schedule entry", { details: error.message });
  }
});

router.delete("/admin/entry/:scheduleEntryId", userAuthMiddleware, async (req, res) => {
  try {
    if (!hasRole(req, "admin")) return sendJsonResponse(res, false, 403, "Not authorized", null);
    const knex = await db.getKnex();
    const delId = parseInt(req.params.scheduleEntryId, 10);
    if (!Number.isInteger(delId) || delId < 1) {
      return sendJsonResponse(res, false, 400, "Invalid schedule entry id", null);
    }
    const oldEntry = await knex("schedule_entries").where({ schedule_entry_id: delId }).first();
    if (!oldEntry) return sendJsonResponse(res, false, 404, "Entry not found", null);
    await logScheduleChange(knex, req.user.user_id, "delete", null, oldEntry, null);
    await knex("schedule_entries").where({ schedule_entry_id: delId }).del();
    return sendJsonResponse(res, true, 200, "Schedule entry deleted", null);
  } catch (error) {
    return sendJsonResponse(res, false, 500, "Failed to delete schedule entry", { details: error.message });
  }
});

export default router;
