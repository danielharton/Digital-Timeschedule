
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env.local") });

const fs = require("fs");
const path = require("path");
const knex = require("knex");
const knexfile = require("../knexfile.cjs");

const env = process.env.NODE_ENV === "production" ? "production" : "development";
const catalogPath = path.join(__dirname, "..", "seeds", "data", "room_codes.json");

async function main() {
  const raw = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  const allowed = new Set(raw.map((c) => String(c).trim().toUpperCase()));

  const db = knex(knexfile[env]);
  try {
    const rooms = await db("rooms").select("room_id", "room_code");
    const toDelete = [];

    for (const r of rooms) {
      const code = String(r.room_code).trim().toUpperCase();
      if (allowed.has(code)) continue;

      const row = await db("schedule_entries").where({ room_id: r.room_id }).count("* as c").first();
      const n = Number(row?.c || 0);
      if (n > 0) {
        console.warn(`Skipping ${r.room_code} (room_id=${r.room_id}): still referenced by ${n} schedule row(s). Update or delete those entries first.`);
        continue;
      }
      toDelete.push(r.room_id);
    }

    if (toDelete.length === 0) {
      console.log("No extra rooms to remove (or all non-catalog rooms are still in use).");
      return;
    }

    await db("rooms").whereIn("room_id", toDelete).del();
    console.log(`Deleted ${toDelete.length} room(s) not in ${path.basename(catalogPath)}.`);
  } finally {
    await db.destroy();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
