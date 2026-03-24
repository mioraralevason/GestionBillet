import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

let db: any;

if (Platform.OS !== 'web') {
  db = SQLite.openDatabaseSync('ticketapp.db');
} else {
  db = {
    execSync: (query: string) => console.log('SQLite non supporté sur le web', query),
    runSync: (query: string, ...args: any[]) => console.log('SQLite non supporté sur le web', query, args),
    getFirstSync: (query: string, ...args: any[]) => {
       console.log('SQLite non supporté sur le web', query, args);
       return null;
    },
    getAllSync: (query: string, ...args: any[]) => {
      console.log('SQLite non supporté sur le web', query, args);
      return [];
   }
  };
/**
 * Initializes the SQLite database schema and seeds initial data.
 * Performs migrations if old schema structures are detected.
 * Not available on Web platform.
 */
export const initDB = () => {
  if (Platform.OS === 'web') return;

  // Migration: If we detect old structure (e.g., ticket_id in buyers), reset tables
  try {
    const tableInfo: any[] = db.getAllSync(`PRAGMA table_info(buyers)`);
    const hasTicketId = tableInfo.some(column => column.name === 'ticket_id');

    if (hasTicketId) {
      console.log("Migrating to unique Buyer ID...");
      db.execSync(`DROP TABLE IF EXISTS attendance;`);
      db.execSync(`DROP TABLE IF EXISTS payments;`);
      db.execSync(`DROP TABLE IF EXISTS buyers;`);
      db.execSync(`DROP TABLE IF EXISTS tickets;`);
      db.execSync(`DROP TABLE IF EXISTS events;`);
      db.execSync(`DROP TABLE IF EXISTS status;`);
      db.execSync(`DROP TABLE IF EXISTS users;`);
    }
  } catch (e) {
    console.error("Migration error", e);
  }

  // Define tables
  // ... (Schema creation code)

/**
 * Authenticates a user by their PIN code.
 * @param {string} pin - The 4-digit PIN entered by the user.
 * @param {(role: string | null) => void} callback - Callback function with the assigned role.
 */
export const getUserByPin = (pin: string, callback: (role: string | null) => void) => {
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );`
  );

  db.execSync(
    `CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      description TEXT,
      slogan TEXT,
      image TEXT,
      color TEXT DEFAULT '#007AFF',
      event_date TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );`
  );

  db.execSync(
    `CREATE TABLE IF NOT EXISTS status (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );`
  );

  db.execSync(
    `CREATE TABLE IF NOT EXISTS buyers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(name, phone)
    );`
  );

  db.execSync(
    `CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      ticket_number TEXT UNIQUE,
      qr_code TEXT UNIQUE,
      price INTEGER NOT NULL,
      status_id INTEGER,
      buyer_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events (id),
      FOREIGN KEY (status_id) REFERENCES status (id),
      FOREIGN KEY (buyer_id) REFERENCES buyers (id)
    );`
  );

  db.execSync(
    `CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      payment_date TEXT DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets (id)
    );`
  );

  db.execSync(
    `CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER UNIQUE,
      status_id INTEGER,
      checkin_time TEXT DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets (id),
      FOREIGN KEY (status_id) REFERENCES status (id)
    );`
  );

  const existingUsers = db.getFirstSync(`SELECT * FROM users WHERE pin IN (?, ?)`, '1234', '0000');
  if (!existingUsers) {
    db.runSync(`INSERT INTO users (pin, role) VALUES (?, ?)`, '1234', 'admin');
    db.runSync(`INSERT INTO users (pin, role) VALUES (?, ?)`, '0000', 'verificateur');
  }

  const existingStatus = db.getFirstSync(`SELECT * FROM status LIMIT 1`);
  if (!existingStatus) {
    db.runSync(`INSERT INTO status (name, type) VALUES (?, ?)`, 'Disponible', 'ticket');
    db.runSync(`INSERT INTO status (name, type) VALUES (?, ?)`, 'Vendu', 'ticket');
    db.runSync(`INSERT INTO status (name, type) VALUES (?, ?)`, 'Validé', 'attendance');
  }
};

export const getUserByPin = (pin: string, callback: (role: string | null) => void) => {
  if (Platform.OS === 'web') { callback(null); return; }
  try {
    const row: any = db.getFirstSync(`SELECT role FROM users WHERE pin = ?`, pin);
    callback(row ? row.role : null);
  } catch (error) { console.error(error); callback(null); }
};

export default db;