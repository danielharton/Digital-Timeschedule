exports.seed = async function (knex) {
  await knex("student_teacher_assignments").del();

  const studentsWithoutGroup = await knex("students").whereNull("group_id").select("student_id").orderBy("student_id", "asc");
  const fallbackTeacherId = 11;

  const rows = [];
  let assignmentId = 1;

  for (const s of studentsWithoutGroup) {
    rows.push({
      assignment_id: assignmentId,
      student_id: s.student_id,
      teacher_id: fallbackTeacherId
    });
    assignmentId += 1;
  }

  
  const scheduleAssignments = await knex("schedule_entries as se")
    .join("subject_teachers as st", "se.subject_teacher_id", "st.subject_teacher_id")
    .join("students as s", "se.group_id", "s.group_id")
    .select("st.teacher_id", "s.student_id")
    .distinct();

  const existingPairs = new Set(rows.map(r => `${r.teacher_id}-${r.student_id}`));
  
  for (const sa of scheduleAssignments) {
    const key = `${sa.teacher_id}-${sa.student_id}`;
    if (!existingPairs.has(key)) {
      rows.push({
        assignment_id: assignmentId,
        student_id: sa.student_id,
        teacher_id: sa.teacher_id
      });
      existingPairs.add(key);
      assignmentId += 1;
    }
  }

  if (rows.length > 0) {
    await knex("student_teacher_assignments").insert(rows);
  }
  await knex.raw(
    "SELECT setval('student_teacher_assignments_assignment_id_seq', (SELECT COALESCE(MAX(assignment_id), 1) FROM student_teacher_assignments))"
  );
};
