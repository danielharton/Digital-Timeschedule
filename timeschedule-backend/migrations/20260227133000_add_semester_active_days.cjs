
exports.up = async function up(knex) {
  await knex.schema.createTable("semester_active_days", (table) => {
    table.increments("semester_active_day_id").primary();
    table.integer("semester_id").notNullable().references("semester_id").inTable("semesters").onDelete("CASCADE");
    table.date("active_date").notNullable();
    table.integer("set_by_user_id").notNullable().references("user_id").inTable("users").onDelete("CASCADE");
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.unique(["semester_id", "active_date"]);
  });
};


exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("semester_active_days");
};
