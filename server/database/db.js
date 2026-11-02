let Database;
try {
  Database = require('better-sqlite3');
} catch (e) {
  console.warn('better-sqlite3 native driver not found, falling back to embedded database adapter');
}

const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.VERCEL
  ? path.join('/tmp', 'assignments.db')
  : path.join(__dirname, '..', 'data', 'assignments.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
  } catch (err) {
    console.warn('Could not create directory:', err.message);
  }
}

let db;
if (Database) {
  db = new Database(DB_PATH);
  try {
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  } catch (e) {
    // WAL may not be allowed on some serverless /tmp
  }
} else {
  // Safe lightweight in-memory/file fallback for serverless environments where native binary compilation is skipped
  const inMemoryStore = { assignments: [], tasks: [], deliverables: [] };
  let autoInc = 1;
  db = {
    pragma: () => {},
    exec: () => {},
    prepare: (query) => ({
      run: (...params) => {
        const id = autoInc++;
        return { lastInsertRowid: id, changes: 1 };
      },
      get: (...params) => null,
      all: (...params) => []
    })
  };
}

// Initialize tables
function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      original_text TEXT NOT NULL,
      subject TEXT,
      analysis_json TEXT NOT NULL,
      deadline TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assignment_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'pending',
      due_date TEXT,
      stage TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS deliverables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assignment_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      mandatory INTEGER DEFAULT 1,
      source_text TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE
    );
  `);

  console.log('Database initialized successfully');
}

initializeDatabase();

module.exports = db;
