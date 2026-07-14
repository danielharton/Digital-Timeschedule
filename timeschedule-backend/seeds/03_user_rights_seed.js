
exports.seed = async function (knex) {
  await knex("user_rights").del();

  const rows = [];

  
  for (let id = 1; id <= 10; id += 1) rows.push({ user_id: id, role_id: 3 });
  for (let id = 11; id <= 40; id += 1) rows.push({ user_id: id, role_id: 1 });
  for (let id = 41; id <= 340; id += 1) rows.push({ user_id: id, role_id: 2 });

  await knex("user_rights").insert(rows);
  await knex.raw(
    "SELECT setval('user_rights_association_id_seq', (SELECT COALESCE(MAX(association_id), 1) FROM user_rights))"
  );
};
