
exports.seed = async function (knex) {
  await knex('roles').del();
  await knex('roles').insert([
    { role_id: 1, name: 'teacher', description: 'Teacher account' },
    { role_id: 2, name: 'student', description: 'Student account' },
    { role_id: 3, name: 'admin', description: 'Admin account' }
  ]);

  await knex.raw("SELECT setval('roles_role_id_seq', (SELECT COALESCE(MAX(role_id), 1) FROM roles))");
};
