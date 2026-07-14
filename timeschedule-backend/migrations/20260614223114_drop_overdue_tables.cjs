exports.up = async function(knex) {
  await knex.schema.dropTableIfExists('overdue_makeup_choices');
  await knex.schema.dropTableIfExists('overdue_activities');
};

exports.down = async function(knex) {
  
};
