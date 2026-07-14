
exports.up = async function up(knex) {
  await knex.schema.createTable('semester_weeks', (table) => {
    table.increments('semester_week_id').primary();
    table.integer('semester_id').notNullable().references('semester_id').inTable('semesters').onDelete('CASCADE');
    table.smallint('week_index').notNullable();
    table.date('week_start').notNullable();
    table.date('week_end').notNullable();
    table.integer('set_by_user_id').notNullable().references('user_id').inTable('users').onDelete('CASCADE');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.unique(['semester_id', 'week_index']);
  });

  await knex.schema.createTable('subject_delivery_links', (table) => {
    table.increments('subject_delivery_link_id').primary();
    table.integer('subject_teacher_id').notNullable().references('subject_teacher_id').inTable('subject_teachers').onDelete('CASCADE');
    table.integer('group_id').references('group_id').inTable('groups').onDelete('CASCADE');
    table.string('series', 4);
    table.enu('activity_type', ['course', 'seminar', 'lab']).notNullable();
    table.string('online_url', 500).notNullable();
    table.integer('set_by_user_id').notNullable().references('user_id').inTable('users').onDelete('CASCADE');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};


exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('subject_delivery_links');
  await knex.schema.dropTableIfExists('semester_weeks');
};
