
exports.seed = async function (knex) {
  await knex("students").del();
  await knex("teachers").del();

  const teachers = Array.from({ length: 10 }).map((_, idx) => {
    const teacherId = 11 + idx;
    return {
      teacher_id: teacherId,
      academic_title: "Conf. dr.",
      department: "Economic Informatics",
      office: `C2-${301 + idx}`
    };
  });

  const students = [];
  let studentCounter = 0;
  for (let g = 1; g <= 4; g++) {
    for (let i = 0; i < 30; i++) {
      const studentId = 31 + studentCounter;
      const seriesVal = [1, 3].includes(g) ? "C" : "G";
      students.push({
        student_id: studentId,
        group_id: g,
        series: seriesVal,
        registration_no: `IE2025${seriesVal}${String(studentCounter + 1).padStart(3, "0")}`,
        year_of_study: (g % 3) + 1
      });
      studentCounter++;
    }
  }

  for (let i = 0; i < 5; i++) {
    const studentId = 31 + studentCounter;
    students.push({
      student_id: studentId,
      group_id: null,
      series: null,
      registration_no: `IE2025FREE${String(i + 1).padStart(3, "0")}`,
      year_of_study: 1
    });
    studentCounter++;
  }

  await knex("teachers").insert(teachers);
  await knex("students").insert(students);
};
