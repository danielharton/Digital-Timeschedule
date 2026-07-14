const crypto = require("crypto");

const md5Hash = (password) =>
  crypto.createHash("md5").update(password + password).digest("hex");

const paddedNumber = (n, len) => String(n).padStart(len, "0");


function emailSlug(part) {
  return part
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[șŞ]/g, "s")
    .replace(/[țȚ]/g, "t")
    .replace(/[ăĂ]/g, "a")
    .replace(/[âÂ]/g, "a")
    .replace(/[îÎ]/g, "i")
    .toLowerCase()
    .replace(/[^a-z]+/g, "");
}

function buildEmail(firstName, lastName, userId, usedLocals) {
  const base = `${emailSlug(firstName)}.${emailSlug(lastName)}`;
  let local = base || `user.${userId}`;
  if (usedLocals.has(local)) {
    local = `${base}.${userId}`;
  }
  usedLocals.add(local);
  return `${local}@timeschedule.ro`;
}


exports.seed = async function (knex) {
  await knex("users").del();

  const usedLocals = new Set();

  const admins = [
    { first_name: "Alexandru", last_name: "Popescu" },
    { first_name: "Elena", last_name: "Ionescu" },
    { first_name: "Cristina", last_name: "Dumitrescu" },
    { first_name: "Florin", last_name: "Marinescu" },
    { first_name: "Gabriela", last_name: "Stan" },
    { first_name: "Radu", last_name: "Constantinescu" },
    { first_name: "Bianca", last_name: "Munteanu" },
    { first_name: "Ștefan", last_name: "Vlad" },
    { first_name: "Ioana", last_name: "Radu" },
    { first_name: "Andrei", last_name: "Stoica" }
  ].map((p, idx) => {
    const id = idx + 1;
    return {
      user_id: id,
      first_name: p.first_name,
      last_name: p.last_name,
      cnp: `1900101${paddedNumber(id, 6)}`,
      email_address: buildEmail(p.first_name, p.last_name, id, usedLocals),
      password_hash: md5Hash("admin123"),
      birth_date: "1990-01-01",
      address: "București",
      phone: `0711${paddedNumber(id, 6)}`,
      updated_at: new Date(Date.now() + (10000 - idx * 3) * 1000)
    };
  });

  const teachers = Array.from({ length: 30 }).map((_, idx) => {
    const id = 11 + idx;
    const n = idx + 1;
    const firstName = ["Mihai", "Ana", "Vladimir", "Laura", "Daniel", "Monica", "Paul", "Simona", "George", "Adriana", "Cosmin", "Elena", "Radu", "Maria", "Stefan"][idx % 15];
    const lastName = ["Georgescu", "Popescu", "Ionescu", "Vasilescu", "Enescu", "Cristea", "Dobre", "Florescu", "Moldoveanu", "Brezeanu"][idx % 10];
    return {
      user_id: id,
      first_name: firstName,
      last_name: lastName,
      cnp: `1910202${paddedNumber(n, 6)}`,
      email_address: buildEmail(firstName, lastName, id, usedLocals),
      password_hash: md5Hash("teacher123"),
      birth_date: "1985-02-02",
      address: "București",
      phone: `0722${paddedNumber(n, 6)}`,
      updated_at: new Date(Date.now() + (9999 - idx * 3) * 1000)
    };
  });

  const studentPrenume = [
    "Andrei",
    "Maria",
    "Elena",
    "Ion",
    "Ioana",
    "Ștefania",
    "Mihnea",
    "Alexandra",
    "Nicolae",
    "Diana",
    "Cătălin",
    "Bianca",
    "Florin",
    "Gabriela",
    "Radu",
    "Cristian",
    "Ana-Maria",
    "George",
    "Oana",
    "Paul",
    "Răzvan",
    "Denisa",
    "Ștefan",
    "Laura",
    "Vlad",
    "Irina",
    "Cosmin",
    "Alina",
    "Bogdan",
    "Carmen"
  ];

  const studentNume = [
    "Popescu",
    "Ionescu",
    "Dumitrescu",
    "Stan",
    "Munteanu",
    "Georgescu",
    "Vasilescu",
    "Enescu",
    "Cristea",
    "Florescu",
    "Moldoveanu",
    "Brezeanu",
    "Dragomir",
    "Sandu",
    "Preda",
    "Neagu",
    "Tudor",
    "Antonescu",
    "Stancu",
    "Olaru"
  ];

  const students = Array.from({ length: 300 }).map((_, idx) => {
    const id = 41 + idx;
    const first_name = studentPrenume[idx % studentPrenume.length];
    const last_name = studentNume[Math.floor(idx / studentPrenume.length) % studentNume.length];
    return {
      user_id: id,
      first_name,
      last_name,
      cnp: `6020303${paddedNumber(idx + 1, 6)}`,
      email_address: buildEmail(first_name, last_name, id, usedLocals),
      password_hash: md5Hash("student123"),
      birth_date: "2002-03-03",
      address: "București",
      phone: `0733${paddedNumber(idx + 1, 6)}`,
      updated_at: new Date(Date.now() + (9998 - idx * 3) * 1000)
    };
  });

  await knex("users").insert([...admins, ...teachers, ...students]);
  await knex.raw(
    "SELECT setval('users_user_id_seq', (SELECT COALESCE(MAX(user_id), 1) FROM users))"
  );
};
