import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const dataDir = process.env.DATA_DIR ?? './data';
const dbPath = path.join(dataDir, 'reading.db');
const coversDir = path.join(dataDir, 'covers');

if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
if (!existsSync(coversDir)) mkdirSync(coversDir, { recursive: true });

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

const db = drizzle(sqlite);
migrate(db, { migrationsFolder: './drizzle' });
sqlite.close();

console.log(`migrations applied → ${dbPath}`);
