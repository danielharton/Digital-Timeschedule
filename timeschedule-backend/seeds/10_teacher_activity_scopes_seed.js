
exports.seed = async function (knex) {
  const has = await knex.schema.hasTable("teacher_activity_scopes");
  if (!has) return;

  await knex("teacher_activity_scopes").del();

  const pairs = await knex("schedule_entries as se")
    .join("subject_teachers as st", "se.subject_teacher_id", "st.subject_teacher_id")
    .join("groups as g", "se.group_id", "g.group_id")
    .select("se.subject_teacher_id", "se.group_id", "g.series", "st.activity_type")
    .distinct();

  const rows = pairs.map((p) => {
    if (p.activity_type === "course") {
      return {
        subject_teacher_id: p.subject_teacher_id,
        scope_kind: "series",
        group_id: null,
        series_letter: p.series,
        set_by_user_id: 1
      };
    } else {
      return {
        subject_teacher_id: p.subject_teacher_id,
        scope_kind: "group",
        group_id: p.group_id,
        series_letter: null,
        set_by_user_id: 1
      };
    }
  });

  
  const uniqueRowsMap = new Map();
  for (const r of rows) {
    const key = `${r.subject_teacher_id}-${r.scope_kind}-${r.group_id}-${r.series_letter}`;
    uniqueRowsMap.set(key, r);
  }
  const uniqueRows = Array.from(uniqueRowsMap.values());

  if (uniqueRows.length > 0) {
    await knex("teacher_activity_scopes").insert(uniqueRows);
  }
  await knex.raw(
    "SELECT setval(pg_get_serial_sequence('teacher_activity_scopes','scope_id'), (SELECT COALESCE(MAX(scope_id), 1) FROM teacher_activity_scopes))"
  );
};
