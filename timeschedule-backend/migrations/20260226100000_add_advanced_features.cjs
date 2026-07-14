
exports.up = async function up(knex) {
  await knex.schema.alterTable('study_programs', (table) => {
    table.string('university_name', 120).notNullable().defaultTo('ASE Bucuresti');
  });

  await knex.schema.createTable('language_packs', (table) => {
    table.increments('language_pack_id').primary();
    table.string('language_code', 16).notNullable();
    table.string('display_name', 120).notNullable();
    table.boolean('is_custom').notNullable().defaultTo(false);
    table.text('json_content').notNullable();
    table.string('json_checksum', 128).notNullable().unique();
    table.string('encoding', 32).notNullable().defaultTo('utf16');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('user_preferences', (table) => {
    table
      .integer('user_id')
      .primary()
      .references('user_id')
      .inTable('users')
      .onDelete('CASCADE');
    table.enu('language_mode', ['en', 'ro', 'custom']).notNullable().defaultTo('en');
    table
      .integer('language_pack_id')
      .references('language_pack_id')
      .inTable('language_packs')
      .onDelete('SET NULL');
    table.boolean('first_login_completed').notNullable().defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('schedule_change_logs', (table) => {
    table.increments('log_id').primary();
    table
      .integer('schedule_entry_id')
      .references('schedule_entry_id')
      .inTable('schedule_entries')
      .onDelete('SET NULL');
    table
      .integer('changed_by_user_id')
      .notNullable()
      .references('user_id')
      .inTable('users')
      .onDelete('CASCADE');
    table.string('action_type', 32).notNullable();
    table.jsonb('old_data');
    table.jsonb('new_data');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('overdue_activities', (table) => {
    table.increments('overdue_activity_id').primary();
    table
      .integer('subject_teacher_id')
      .notNullable()
      .references('subject_teacher_id')
      .inTable('subject_teachers')
      .onDelete('CASCADE');
    table
      .integer('group_id')
      .notNullable()
      .references('group_id')
      .inTable('groups')
      .onDelete('CASCADE');
    table.string('title', 200).notNullable();
    table.string('details', 500);
    table.date('due_date');
    table.enu('status', ['open', 'scheduled', 'closed']).notNullable().defaultTo('open');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('overdue_makeup_choices', (table) => {
    table.increments('choice_id').primary();
    table
      .integer('overdue_activity_id')
      .notNullable()
      .references('overdue_activity_id')
      .inTable('overdue_activities')
      .onDelete('CASCADE');
    table
      .integer('student_id')
      .notNullable()
      .references('student_id')
      .inTable('students')
      .onDelete('CASCADE');
    table.smallint('preferred_day_of_week');
    table
      .integer('preferred_time_slot_id')
      .references('time_slot_id')
      .inTable('time_slots')
      .onDelete('SET NULL');
    table.date('preferred_date');
    table.enu('status', ['pending', 'accepted', 'declined']).notNullable().defaultTo('pending');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.unique(['overdue_activity_id', 'student_id']);
  });
};


exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('overdue_makeup_choices');
  await knex.schema.dropTableIfExists('overdue_activities');
  await knex.schema.dropTableIfExists('schedule_change_logs');
  await knex.schema.dropTableIfExists('user_preferences');
  await knex.schema.dropTableIfExists('language_packs');
  const hasUniversityName = await knex.schema.hasColumn('study_programs', 'university_name');
  if (hasUniversityName) {
    await knex.schema.alterTable('study_programs', (table) => {
      table.dropColumn('university_name');
    });
  }
};
