
exports.up = async function up(knex) {
  await knex.raw('DROP TABLE IF EXISTS student_teacher_assignments CASCADE');
  await knex.raw('DROP TABLE IF EXISTS schedule_entries CASCADE');
  await knex.raw('DROP TABLE IF EXISTS time_slots CASCADE');
  await knex.raw('DROP TABLE IF EXISTS semesters CASCADE');
  await knex.raw('DROP TABLE IF EXISTS rooms CASCADE');
  await knex.raw('DROP TABLE IF EXISTS buildings CASCADE');
  await knex.raw('DROP TABLE IF EXISTS subject_teachers CASCADE');
  await knex.raw('DROP TABLE IF EXISTS subjects CASCADE');
  await knex.raw('DROP TABLE IF EXISTS teachers CASCADE');
  await knex.raw('DROP TABLE IF EXISTS students CASCADE');
  await knex.raw('DROP TABLE IF EXISTS groups CASCADE');
  await knex.raw('DROP TABLE IF EXISTS study_programs CASCADE');
  await knex.raw('DROP TABLE IF EXISTS user_rights CASCADE');
  await knex.raw('DROP TABLE IF EXISTS rights CASCADE');
  await knex.raw('DROP TABLE IF EXISTS roles CASCADE');

  await knex.raw('DROP TABLE IF EXISTS class_students CASCADE');
  await knex.raw('DROP TABLE IF EXISTS class_teachers CASCADE');
  await knex.raw('DROP TABLE IF EXISTS classes CASCADE');
  await knex.raw('DROP TABLE IF EXISTS users CASCADE');

  await knex.schema.createTable('roles', (table) => {
    table.increments('role_id').primary();
    table.string('name', 50).notNullable().unique();
    table.string('description', 255);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('users', (table) => {
    table.increments('user_id').primary();
    table.string('first_name', 50).notNullable();
    table.string('last_name', 50).notNullable();
    table.string('cnp', 13).notNullable().unique();
    table.string('email_address', 100).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.date('birth_date');
    table.string('address', 255);
    table.string('phone', 20);
    table.string('session_token_hash', 255);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('user_rights', (table) => {
    table.increments('association_id').primary();
    table
      .integer('user_id')
      .notNullable()
      .references('user_id')
      .inTable('users')
      .onDelete('CASCADE');
    table
      .integer('role_id')
      .notNullable()
      .references('role_id')
      .inTable('roles')
      .onDelete('CASCADE');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.unique(['user_id', 'role_id']);
  });

  await knex.schema.createTable('study_programs', (table) => {
    table.increments('program_id').primary();
    table.string('program_name', 100).notNullable();
    table.string('faculty_name', 100).notNullable();
    table.enu('cycle', ['Licenta', 'Master', 'Doctorat']).notNullable();
    table.smallint('duration_years').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('groups', (table) => {
    table.increments('group_id').primary();
    table
      .integer('program_id')
      .notNullable()
      .references('program_id')
      .inTable('study_programs')
      .onDelete('RESTRICT');
    table.string('group_name', 20).notNullable().unique();
    table.smallint('study_year').notNullable();
    table.string('series', 5);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('students', (table) => {
    table
      .integer('student_id')
      .primary()
      .references('user_id')
      .inTable('users')
      .onDelete('CASCADE');
    table
      .integer('group_id')
      .references('group_id')
      .inTable('groups')
      .onDelete('RESTRICT');
    table.string('registration_no', 20).unique();
    table.smallint('year_of_study').notNullable();
    table.string('series', 4);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('teachers', (table) => {
    table
      .integer('teacher_id')
      .primary()
      .references('user_id')
      .inTable('users')
      .onDelete('CASCADE');
    table.string('academic_title', 50);
    table.string('department', 100);
    table.string('office', 50);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('subjects', (table) => {
    table.increments('subject_id').primary();
    table.string('name', 100).notNullable();
    table.smallint('credits');
    table.smallint('study_year');
    table.smallint('semester_number');
    table
      .integer('program_id')
      .references('program_id')
      .inTable('study_programs')
      .onDelete('SET NULL');
    table.string('online_course_url', 255);
    table.string('online_seminar_url', 255);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('subject_teachers', (table) => {
    table.increments('subject_teacher_id').primary();
    table
      .integer('subject_id')
      .notNullable()
      .references('subject_id')
      .inTable('subjects')
      .onDelete('CASCADE');
    table
      .integer('teacher_id')
      .notNullable()
      .references('teacher_id')
      .inTable('teachers')
      .onDelete('CASCADE');
    table.enu('activity_type', ['course', 'seminar', 'lab']).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.unique(['subject_id', 'teacher_id', 'activity_type']);
  });

  await knex.schema.createTable('buildings', (table) => {
    table.increments('building_id').primary();
    table.string('building_code', 10).notNullable().unique();
    table.string('name', 100);
    table.string('address', 255);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('rooms', (table) => {
    table.increments('room_id').primary();
    table
      .integer('building_id')
      .notNullable()
      .references('building_id')
      .inTable('buildings')
      .onDelete('CASCADE');
    table.string('room_code', 20).notNullable();
    table.integer('capacity');
    table.enu('room_type', ['course', 'seminar', 'lab', 'computer']).defaultTo('course');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.unique(['building_id', 'room_code']);
  });

  await knex.schema.createTable('semesters', (table) => {
    table.increments('semester_id').primary();
    table.string('academic_year', 9).notNullable();
    table.smallint('semester_number').notNullable();
    table.date('start_date');
    table.date('end_date');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.unique(['academic_year', 'semester_number']);
  });

  await knex.schema.createTable('time_slots', (table) => {
    table.increments('time_slot_id').primary();
    table.time('start_time').notNullable();
    table.time('end_time').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.unique(['start_time', 'end_time']);
  });

  await knex.schema.createTable('schedule_entries', (table) => {
    table.increments('schedule_entry_id').primary();
    table
      .integer('semester_id')
      .notNullable()
      .references('semester_id')
      .inTable('semesters')
      .onDelete('CASCADE');
    table
      .integer('group_id')
      .notNullable()
      .references('group_id')
      .inTable('groups')
      .onDelete('CASCADE');
    table
      .integer('subject_teacher_id')
      .notNullable()
      .references('subject_teacher_id')
      .inTable('subject_teachers')
      .onDelete('CASCADE');
    table
      .integer('room_id')
      .notNullable()
      .references('room_id')
      .inTable('rooms')
      .onDelete('RESTRICT');
    table.smallint('day_of_week').notNullable();
    table
      .integer('time_slot_id')
      .notNullable()
      .references('time_slot_id')
      .inTable('time_slots')
      .onDelete('RESTRICT');
    table.enu('week_type', ['ALL', 'ODD', 'EVEN']).defaultTo('ALL');
    table.string('notes', 255);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.unique(['semester_id', 'group_id', 'day_of_week', 'time_slot_id', 'week_type']);
    table.unique(['semester_id', 'room_id', 'day_of_week', 'time_slot_id', 'week_type']);
  });

  await knex.schema.createTable('student_teacher_assignments', (table) => {
    table.increments('assignment_id').primary();
    table
      .integer('student_id')
      .notNullable()
      .references('student_id')
      .inTable('students')
      .onDelete('CASCADE');
    table
      .integer('teacher_id')
      .notNullable()
      .references('teacher_id')
      .inTable('teachers')
      .onDelete('CASCADE');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.unique(['student_id', 'teacher_id']);
  });
};


exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('student_teacher_assignments');
  await knex.schema.dropTableIfExists('schedule_entries');
  await knex.schema.dropTableIfExists('time_slots');
  await knex.schema.dropTableIfExists('semesters');
  await knex.schema.dropTableIfExists('rooms');
  await knex.schema.dropTableIfExists('buildings');
  await knex.schema.dropTableIfExists('subject_teachers');
  await knex.schema.dropTableIfExists('subjects');
  await knex.schema.dropTableIfExists('teachers');
  await knex.schema.dropTableIfExists('students');
  await knex.schema.dropTableIfExists('groups');
  await knex.schema.dropTableIfExists('study_programs');
  await knex.schema.dropTableIfExists('user_rights');
  await knex.schema.dropTableIfExists('roles');
  await knex.schema.dropTableIfExists('users');
};
