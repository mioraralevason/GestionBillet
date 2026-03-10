// database/database.ts
import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

// Objet db
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
    }
  };
}

// Initialisation base
export const initDB = () => {
  if (Platform.OS === 'web') return;

  db.execSync(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pin TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT
    );`
  );

  db.execSync(
    `CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      date TEXT NOT NULL,
      description TEXT,
      slogan TEXT,
      image_uri TEXT,
      created_at TEXT
    );`
  );

  db.execSync(
    `CREATE TABLE IF NOT EXISTS buyers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      created_at TEXT
    );`
  );

  db.execSync(
    `CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      ticket_number TEXT NOT NULL UNIQUE,
      qr_data TEXT NOT NULL,
      price REAL DEFAULT 0,
      status TEXT DEFAULT 'disponible',
      buyer_id INTEGER,
      buyer_name TEXT,
      buyer_phone TEXT,
      amount_paid REAL DEFAULT 0,
      created_at TEXT,
      FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
      FOREIGN KEY (buyer_id) REFERENCES buyers (id)
    );`
  );

  // Migration : Ajouter buyer_id si la table existe déjà sans cette colonne
  try {
    const tableInfo: any[] = db.getAllSync(`PRAGMA table_info(tickets)`);
    const hasBuyerId = tableInfo.some(column => column.name === 'buyer_id');
    if (!hasBuyerId) {
      db.execSync(`ALTER TABLE tickets ADD COLUMN buyer_id INTEGER REFERENCES buyers(id)`);
      console.log("Migration: Colonne buyer_id ajoutée à la table tickets");
    }
  } catch (e) {
    console.error("Erreur lors de la migration du schéma", e);
  }

  const existingUsers = db.getFirstSync(`SELECT * FROM users WHERE pin IN (?, ?)`, '1234', '0000');
  
  if (!existingUsers) {
    db.runSync(
      `INSERT INTO users (pin, role, created_at) VALUES (?, ?, datetime('now'))`,
      '1234', 'admin'
    );
    db.runSync(
      `INSERT INTO users (pin, role, created_at) VALUES (?, ?, datetime('now'))`,
      '0000', 'verificateur'
    );
  }
};

// Vérification du PIN
export const getUserByPin = (
  pin: string,
  callback: (role: string | null) => void
) => {
  if (Platform.OS === 'web') {
    callback(null);
    return;
  }

  try {
    const row: any = db.getFirstSync(`SELECT role FROM users WHERE pin = ?`, pin);
    callback(row ? row.role : null);
  } catch (error) {
    console.error(error);
    callback(null);
  }
};

export default db;