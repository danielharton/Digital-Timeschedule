exports.seed = async function (knex) {
  await knex("schedule_entries").del();

  const subjects = [
    { course_st: 1, sem_st: 2, name: "Sociology", teacher: 11 },
    { course_st: 3, sem_st: 4, name: "Time Series", teacher: 12 },
    { course_st: 5, sem_st: 6, name: "Computer Networks", teacher: 13 },
    { course_st: 7, sem_st: 8, name: "Software Packages", teacher: 14 },
    { course_st: 9, sem_st: 10, name: "Economic Information Systems", teacher: 15 },
    { course_st: 11, sem_st: 12, name: "Software Quality and Testing", teacher: 16 },
    { course_st: 13, sem_st: 14, name: "Business Law", teacher: 17 } 
  ];

  const allRooms = await knex("rooms").select("room_id");
  const roomIds = allRooms.map(r => r.room_id);
  
  const groupsData = await knex("groups").select("group_id", "series");
  const seriesGroups = {};
  for (const g of groupsData) {
    if (!seriesGroups[g.series]) seriesGroups[g.series] = [];
    seriesGroups[g.series].push(g.group_id);
  }

  const entries = [];
  let id = 1;

  const teacherBusy = new Set();
  const roomBusy = new Set();
  const groupBusy = new Set();

  const isBusy = (teacherId, roomId, day, slot, groupIds) => {
    if (teacherBusy.has(`${teacherId}_${day}_${slot}`)) return true;
    if (roomBusy.has(`${roomId}_${day}_${slot}`)) return true;
    for (const gid of groupIds) {
      if (groupBusy.has(`${gid}_${day}_${slot}`)) return true;
    }
    return false;
  };

  const markBusy = (teacherId, roomId, day, slot, groupIds) => {
    teacherBusy.add(`${teacherId}_${day}_${slot}`);
    roomBusy.add(`${roomId}_${day}_${slot}`);
    for (const gid of groupIds) {
      groupBusy.add(`${gid}_${day}_${slot}`);
    }
  };

  const getRandomRoom = () => roomIds[Math.floor(Math.random() * roomIds.length)];
  const getRandomDaySlot = () => [Math.floor(Math.random() * 5) + 1, Math.floor(Math.random() * 6) + 1];

  for (const [series, gids] of Object.entries(seriesGroups)) {
    for (const subj of subjects) {
      
      let placedCourse = false;
      let attempts = 0;
      while (!placedCourse && attempts < 100) {
        const [day, slot] = getRandomDaySlot();
        const room = getRandomRoom();
        if (!isBusy(subj.teacher, room, day, slot, gids)) {
          markBusy(subj.teacher, room, day, slot, gids);
          const gid = gids[0]; 
          entries.push({
            schedule_entry_id: id++,
            semester_id: 1,
            group_id: gid,
            subject_teacher_id: subj.course_st,
            room_id: room,
            day_of_week: day,
            time_slot_id: slot,
            week_type: "ALL",
            notes: `Course ${subj.name}`
          });
          placedCourse = true;
        }
        attempts++;
      }

      
      for (const gid of gids) {
        let placedSem = false;
        let semAttempts = 0;
        while (!placedSem && semAttempts < 100) {
          const [day, slot] = getRandomDaySlot();
          const room = getRandomRoom();
          if (!isBusy(subj.teacher, room, day, slot, [gid])) {
            markBusy(subj.teacher, room, day, slot, [gid]);
            entries.push({
              schedule_entry_id: id++,
              semester_id: 1,
              group_id: gid,
              subject_teacher_id: subj.sem_st,
              room_id: room,
              day_of_week: day,
              time_slot_id: slot,
              week_type: "ALL",
              notes: `Seminar ${subj.name}`
            });
            placedSem = true;
          }
          semAttempts++;
        }
      }
    }
  }

  await knex("schedule_entries").insert(entries);

  await knex.raw(
    "SELECT setval('schedule_entries_schedule_entry_id_seq', (SELECT COALESCE(MAX(schedule_entry_id), 1) FROM schedule_entries))"
  );
};
