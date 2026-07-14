
const roomCodesRaw = require("./data/room_codes.json");


exports.seed = async function (knex) {
  await knex('schedule_entries').del();
  await knex('rooms').del();
  await knex('buildings').del();
  await knex('semesters').del();
  await knex('time_slots').del();

  await knex('buildings').insert([
    {
      building_id: 1,
      building_code: 'CIB',
      name: 'Cibernetica',
      address: 'Piata Romana 6'
    }
  ]);

  const roomCodes = [
    ...new Set(roomCodesRaw.map((c) => String(c).trim().toUpperCase()))
  ].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const roomTypeForCode = (code) => {
    const c = String(code).toUpperCase();
    if (c.includes("S") || c.includes("L") || c.includes("M")) return "computer";
    return "course";
  };

  const roomRows = roomCodes.map((room_code, i) => ({
    room_id: i + 1,
    building_id: 1,
    room_code: String(room_code).trim(),
    capacity: roomTypeForCode(room_code) === "computer" ? 40 : 80,
    room_type: roomTypeForCode(room_code)
  }));

  await knex("rooms").insert(roomRows);

  await knex('semesters').insert([
    {
      semester_id: 1,
      academic_year: '2025-2026',
      semester_number: 2,
      start_date: '2026-02-15',
      end_date: '2026-06-30'
    }
  ]);

  await knex('time_slots').insert([
    { time_slot_id: 1, start_time: '07:30:00', end_time: '09:00:00' },
    { time_slot_id: 2, start_time: '09:10:00', end_time: '10:40:00' },
    { time_slot_id: 3, start_time: '10:50:00', end_time: '12:20:00' },
    { time_slot_id: 4, start_time: '12:30:00', end_time: '14:00:00' },
    { time_slot_id: 5, start_time: '14:10:00', end_time: '15:40:00' },
    { time_slot_id: 6, start_time: '15:50:00', end_time: '17:20:00' },
    { time_slot_id: 7, start_time: '17:30:00', end_time: '19:00:00' }
  ]);

  await knex.raw("SELECT setval('buildings_building_id_seq', (SELECT COALESCE(MAX(building_id), 1) FROM buildings))");
  await knex.raw("SELECT setval('rooms_room_id_seq', (SELECT COALESCE(MAX(room_id), 1) FROM rooms))");
  await knex.raw("SELECT setval('semesters_semester_id_seq', (SELECT COALESCE(MAX(semester_id), 1) FROM semesters))");
  await knex.raw("SELECT setval('time_slots_time_slot_id_seq', (SELECT COALESCE(MAX(time_slot_id), 1) FROM time_slots))");
};
