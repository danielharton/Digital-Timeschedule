import db from "./src/utils/database.mjs";
async function check() {
  const knex = await db.getKnex();
  try {
    const payload = { building_code: "B1", name: "Building 1" };
    console.log("Attempting insert:", payload);
    const [id] = await knex('buildings').insert(payload).returning('building_id');
    console.log("Success, ID:", id);
  } catch (e) {
    console.error("Error inserting building:", e);
  } finally {
    process.exit(0);
  }
}
check();
