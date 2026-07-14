
exports.up = async function up(knex) {
  await knex.raw(`
    ALTER TABLE schedule_entries
    DROP CONSTRAINT IF EXISTS schedule_entries_semester_id_room_id_day_of_week_time_slot_id_week_type_unique;
  `);
};

exports.down = async function down(knex) {
  await knex.raw(`
    ALTER TABLE schedule_entries
    ADD CONSTRAINT schedule_entries_semester_id_room_id_day_of_week_time_slot_id_week_type_unique
    UNIQUE (semester_id, room_id, day_of_week, time_slot_id, week_type);
  `);
};
