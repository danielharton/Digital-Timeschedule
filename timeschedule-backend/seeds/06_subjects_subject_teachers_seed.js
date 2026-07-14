
exports.seed = async function (knex) {
  await knex("subject_teachers").del();
  await knex("subjects").del();

  await knex("subjects").insert([
    {
      subject_id: 1,
      name: "Sociology",
      credits: 5,
      study_year: 3,
      semester_number: 2,
      program_id: 1,
      online_course_url: null,
      online_seminar_url: null
    },
    {
      subject_id: 2,
      name: "Time Series",
      credits: 5,
      study_year: 3,
      semester_number: 2,
      program_id: 1,
      online_course_url: null,
      online_seminar_url: null
    },
    {
      subject_id: 3,
      name: "Computer Networks",
      credits: 6,
      study_year: 3,
      semester_number: 2,
      program_id: 1,
      online_course_url: null,
      online_seminar_url: null
    },
    {
      subject_id: 4,
      name: "Software Packages",
      credits: 5,
      study_year: 3,
      semester_number: 2,
      program_id: 1,
      online_course_url: null,
      online_seminar_url: null
    },
    {
      subject_id: 5,
      name: "Economic Information Systems",
      credits: 6,
      study_year: 3,
      semester_number: 2,
      program_id: 1,
      online_course_url: null,
      online_seminar_url: null
    },
    {
      subject_id: 6,
      name: "Software Quality and Testing",
      credits: 5,
      study_year: 3,
      semester_number: 2,
      program_id: 1,
      online_course_url: null,
      online_seminar_url: null
    },
    {
      subject_id: 7,
      name: "Business Law",
      credits: 4,
      study_year: 3,
      semester_number: 2,
      program_id: 1,
      online_course_url: null,
      online_seminar_url: null
    }
  ]);

  
  await knex("subject_teachers").insert([
    { subject_teacher_id: 1, subject_id: 1, teacher_id: 11, activity_type: "course" },
    { subject_teacher_id: 2, subject_id: 1, teacher_id: 11, activity_type: "seminar" },
    { subject_teacher_id: 3, subject_id: 2, teacher_id: 12, activity_type: "course" },
    { subject_teacher_id: 4, subject_id: 2, teacher_id: 12, activity_type: "seminar" },
    { subject_teacher_id: 5, subject_id: 3, teacher_id: 13, activity_type: "course" },
    { subject_teacher_id: 6, subject_id: 3, teacher_id: 13, activity_type: "seminar" },
    { subject_teacher_id: 7, subject_id: 4, teacher_id: 14, activity_type: "course" },
    { subject_teacher_id: 8, subject_id: 4, teacher_id: 14, activity_type: "seminar" },
    { subject_teacher_id: 9, subject_id: 5, teacher_id: 15, activity_type: "course" },
    { subject_teacher_id: 10, subject_id: 5, teacher_id: 15, activity_type: "seminar" },
    { subject_teacher_id: 11, subject_id: 6, teacher_id: 16, activity_type: "course" },
    { subject_teacher_id: 12, subject_id: 6, teacher_id: 16, activity_type: "seminar" },
    { subject_teacher_id: 13, subject_id: 7, teacher_id: 17, activity_type: "course" },
    { subject_teacher_id: 14, subject_id: 7, teacher_id: 20, activity_type: "seminar" }
  ]);

  await knex.raw(
    "SELECT setval('subjects_subject_id_seq', (SELECT COALESCE(MAX(subject_id), 1) FROM subjects))"
  );
  await knex.raw(
    "SELECT setval('subject_teachers_subject_teacher_id_seq', (SELECT COALESCE(MAX(subject_teacher_id), 1) FROM subject_teachers))"
  );
};
