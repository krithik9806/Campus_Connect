import pg from 'pg';
import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let poolInstance = null;
let sqlJsDb = null;
let dbFilePath = path.join(__dirname, '../../data/campusconnect.db');

export async function initDb() {
  const connectionString = process.env.DATABASE_URL;

  if (connectionString) {
    try {
      console.log('Connecting to PostgreSQL database...');
      const pool = new pg.Pool({
        connectionString,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });
      await pool.query('SELECT 1');
      console.log('Successfully connected to live PostgreSQL database.');
      poolInstance = pool;

      const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
      await poolInstance.query(schemaSql);
      return poolInstance;
    } catch (err) {
      console.warn('Could not connect to PostgreSQL via DATABASE_URL:', err.message);
      console.log('Falling back to SQLite (WebAssembly SQL engine)...');
    }
  }

  // Ensure data directory exists
  const dataDir = path.dirname(dbFilePath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const SQL = await initSqlJs();

  if (fs.existsSync(dbFilePath)) {
    const fileBuffer = fs.readFileSync(dbFilePath);
    sqlJsDb = new SQL.Database(fileBuffer);
    console.log('Loaded existing CampusConnect database from disk.');
  } else {
    sqlJsDb = new SQL.Database();
    console.log('Created fresh CampusConnect SQL database.');
  }

  // Create SQLite Schema
  const sqliteSchema = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      department TEXT DEFAULT 'Computer Science',
      student_id TEXT DEFAULT 'CC-2025-001',
      avatar_url TEXT,
      engagement_score INTEGER DEFAULT 78,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS clubs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      cover_image TEXT,
      logo_url TEXT,
      coordinator_id INTEGER REFERENCES users(id),
      member_count INTEGER DEFAULT 0,
      points INTEGER DEFAULT 500,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS club_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      club_id INTEGER NOT NULL REFERENCES clubs(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      role TEXT DEFAULT 'member',
      status TEXT DEFAULT 'active',
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(club_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      club_id INTEGER REFERENCES clubs(id),
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      image_url TEXT,
      date_str TEXT NOT NULL,
      start_time TEXT DEFAULT '09:00 AM',
      end_time TEXT DEFAULT '05:00 PM',
      venue TEXT NOT NULL,
      capacity INTEGER NOT NULL DEFAULT 100,
      registered_count INTEGER DEFAULT 0,
      checked_in_count INTEGER DEFAULT 0,
      price_type TEXT DEFAULT 'free',
      ticket_price REAL DEFAULT 0.00,
      status TEXT DEFAULT 'approved',
      budget_requested REAL DEFAULT 0.00,
      impact_score TEXT DEFAULT 'High',
      safety_clearance TEXT DEFAULT 'Approved',
      coordinator_notes TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL REFERENCES events(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      ticket_code TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'registered',
      qr_token TEXT NOT NULL,
      registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(event_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL REFERENCES events(id),
      registration_id INTEGER NOT NULL REFERENCES registrations(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      verified_by INTEGER REFERENCES users(id),
      method TEXT DEFAULT 'qr_scan',
      checked_in_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(event_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      club_id INTEGER REFERENCES clubs(id),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      scope TEXT DEFAULT 'college_wide',
      priority TEXT DEFAULT 'normal',
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'system',
      is_read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS event_approvals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL REFERENCES events(id),
      admin_id INTEGER NOT NULL REFERENCES users(id),
      action TEXT NOT NULL,
      comments TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT DEFAULT '127.0.0.1',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;

  sqlJsDb.run(sqliteSchema);
  saveToDisk();

  console.log('Database schema verified.');
  return sqlJsDb;
}

function saveToDisk() {
  if (sqlJsDb) {
    try {
      const data = sqlJsDb.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(dbFilePath, buffer);
    } catch (e) {
      console.error('Failed to save DB to disk:', e.message);
    }
  }
}

export async function query(text, params = []) {
  if (!poolInstance && !sqlJsDb) {
    await initDb();
  }

  if (poolInstance) {
    return await poolInstance.query(text, params);
  }

  // SQLite query execution
  try {
    let cleanSql = text
      .replace(/ILIKE/gi, 'LIKE')
      .replace(/CURRENT_TIMESTAMP/gi, "datetime('now')")
      .replace(/GREATEST\(0,\s*([^)]+)\)/gi, 'MAX(0, $1)');

    let sqliteParams = [];
    cleanSql = cleanSql.replace(/\$([0-9]+)/g, (match, num) => {
      const index = parseInt(num, 10) - 1;
      sqliteParams.push(params[index]);
      return '?';
    });

    const isSelect = /^\s*(SELECT|PRAGMA)/i.test(cleanSql);
    const hasReturning = /RETURNING\s+[\s\S]+$/i.test(cleanSql);

    if (isSelect) {
      const stmt = sqlJsDb.prepare(cleanSql);
      stmt.bind(sqliteParams);
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      return { rows, rowCount: rows.length };
    } else {
      let targetTable = null;

      if (hasReturning) {
        const match = cleanSql.match(/INSERT\s+INTO\s+([a-zA-Z0-9_]+)/i);
        if (match) targetTable = match[1];
        cleanSql = cleanSql.replace(/RETURNING\s+[\s\S]+$/i, '');
      }

      sqlJsDb.run(cleanSql, sqliteParams);
      saveToDisk();

      let rows = [];
      if (hasReturning && targetTable) {
        const idStmt = sqlJsDb.prepare(`SELECT * FROM ${targetTable} ORDER BY id DESC LIMIT 1`);
        if (idStmt.step()) {
          rows.push(idStmt.getAsObject());
        }
        idStmt.free();
      }

      return { rows, rowCount: rows.length || 1 };
    }
  } catch (err) {
    console.error('Database query error:', err.message, '\nQuery:', text, '\nParams:', params);
    throw err;
  }
}


export function isUsingPgMem() {
  return !poolInstance;
}

export default {
  query,
  initDb,
  isUsingPgMem
};
