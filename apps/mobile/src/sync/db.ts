import * as SQLite from 'expo-sqlite';

export async function initDb() {
  const db = await SQLite.openDatabaseAsync('phyziq-offline.db');

  // 27.1 Implement Expo SQLite offline schema
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS local_plans (
      id TEXT PRIMARY KEY,
      plan_data TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS local_workout_logs (
      id TEXT PRIMARY KEY,
      plan_id TEXT NOT NULL,
      session_date TEXT NOT NULL,
      log_data TEXT NOT NULL,
      sync_status TEXT DEFAULT 'pending', -- 'pending' | 'synced'
      created_at INTEGER NOT NULL
    );
  `);

  return db;
}
