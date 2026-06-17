import initSqlJs from "sql.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "../../medpet.db");

let db = null;
let SQL = null;

// Initialize database
export async function initializeDB() {
  SQL = await initSqlJs();

  // Load existing database or create new one
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
    console.log("✅ Loaded existing database");
  } else {
    db = new SQL.Database();
    console.log("✅ Created new database");
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL UNIQUE,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS medicalHistory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      type TEXT NOT NULL,
      value TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  saveDatabase();
  console.log("✅ Database schema initialized");
}

// Save database to file
function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

function rowToObject(columns, row) {
  const obj = {};
  columns.forEach((col, index) => {
    obj[col] = row[index];
  });
  return obj;
}

// Query helper functions
export function getUser(email) {
  try {
    const stmt = db.prepare("SELECT * FROM users WHERE email = ?");
    stmt.bind([email]);
    const found = stmt.step();

    if (!found) {
      stmt.free();
      return null;
    }

    const user = rowToObject(stmt.getColumnNames(), stmt.get());
    stmt.free();
    return user;
  } catch (err) {
    throw new Error("Failed to get user: " + err.message);
  }
}

export function createUser(email, passwordHash) {
  try {
    db.run(
      "INSERT INTO users (email, passwordHash) VALUES (?, ?)",
      [email, passwordHash]
    );
    saveDatabase();

    const stmt = db.prepare("SELECT id FROM users WHERE email = ?");
    stmt.bind([email]);
    stmt.step();
    const row = stmt.get();
    stmt.free();

    return row[0];
  } catch (err) {
    throw new Error("Failed to create user: " + err.message);
  }
}

export function createProfile(userId, name, age, gender) {
  try {
    db.run(
      "INSERT INTO profiles (userId, name, age, gender) VALUES (?, ?, ?, ?)",
      [userId, name, age, gender]
    );
    saveDatabase();
    return true;
  } catch (err) {
    throw new Error("Failed to create profile: " + err.message);
  }
}

export function getProfile(userId) {
  try {
    const stmt = db.prepare("SELECT * FROM profiles WHERE userId = ?");
    stmt.bind([userId]);
    const found = stmt.step();

    if (!found) {
      stmt.free();
      return null;
    }

    const profile = rowToObject(stmt.getColumnNames(), stmt.get());
    stmt.free();
    return profile;
  } catch (err) {
    throw new Error("Failed to get profile: " + err.message);
  }
}

export function getMedicalHistory(userId) {
  try {
    const stmt = db.prepare(
      "SELECT type, value FROM medicalHistory WHERE userId = ? ORDER BY createdAt DESC"
    );
    stmt.bind([userId]);

    const grouped = {
      medications: [],
      allergies: [],
      conditions: []
    };

    while (stmt.step()) {
      const row = stmt.get();
      const record = rowToObject(stmt.getColumnNames(), row);
      if (grouped[record.type]) {
        grouped[record.type].push(record.value);
      }
    }

    stmt.free();
    return grouped;
  } catch (err) {
    throw new Error("Failed to get medical history: " + err.message);
  }
}

export function addMedicalHistoryItem(userId, type, value) {
  try {
    db.run(
      "INSERT INTO medicalHistory (userId, type, value) VALUES (?, ?, ?)",
      [userId, type, value]
    );
    saveDatabase();
    return true;
  } catch (err) {
    throw new Error("Failed to add medical history item: " + err.message);
  }
}

export function deleteMedicalHistoryItem(itemId) {
  try {
    db.run(
      "DELETE FROM medicalHistory WHERE id = ?",
      [itemId]
    );
    saveDatabase();
    return true;
  } catch (err) {
    throw new Error("Failed to delete medical history item: " + err.message);
  }
}

export default db;
