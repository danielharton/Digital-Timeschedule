
exports.seed = async function (knex) {
  await knex("groups").del();
  await knex("study_programs").del();

  await knex("study_programs").insert([
    {
      program_id: 1,
      program_name: "Economic Informatics",
      faculty_name: "CSIE",
      cycle: "Licenta",
      duration_years: 3
    }
  ]);

  const ase = "Bucharest University of Economic Studies";
  const csie = "Cybernetics, Statistics and Business Informatics";

  await knex("groups").insert([
    {
      group_id: 1,
      program_id: 1,
      group_name: "1084",
      study_year: 3,
      series: "C"
    },
    {
      group_id: 2,
      program_id: 1,
      group_name: "1103",
      study_year: 3,
      series: "G"
    },
    {
      group_id: 3,
      program_id: 1,
      group_name: "1085",
      study_year: 2,
      series: "A"
    },
    {
      group_id: 4,
      program_id: 1,
      group_name: "1086",
      study_year: 1,
      series: "E"
    }
  ]);

  const extraGroups = [];

  await knex.raw(
    "SELECT setval('study_programs_program_id_seq', (SELECT COALESCE(MAX(program_id), 1) FROM study_programs))"
  );
  await knex.raw("SELECT setval('groups_group_id_seq', (SELECT COALESCE(MAX(group_id), 1) FROM groups))");
};
