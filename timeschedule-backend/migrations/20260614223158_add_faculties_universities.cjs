exports.up = async function (knex) {
  await knex.schema.createTable('universities', (table) => {
    table.increments('university_id').primary();
    table.string('university_name', 255).notNullable().unique();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('faculties', (table) => {
    table.increments('faculty_id').primary();
    table.string('faculty_name', 255).notNullable();
    table
      .integer('university_id')
      .notNullable()
      .references('university_id')
      .inTable('universities')
      .onDelete('CASCADE');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.unique(['faculty_name', 'university_id']);
  });

  await knex.schema.alterTable('study_programs', (table) => {
    table
      .integer('faculty_id')
      .nullable()
      .references('faculty_id')
      .inTable('faculties')
      .onDelete('CASCADE');
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('study_programs', (table) => {
    table.dropColumn('faculty_id');
  });
  await knex.schema.dropTableIfExists('faculties');
  await knex.schema.dropTableIfExists('universities');
};
