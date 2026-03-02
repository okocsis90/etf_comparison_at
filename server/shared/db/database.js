/* global process */
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';
import logger from '../logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'etf-cache.db');

let db = null;

/**
 * Returns the singleton SQLite database instance.
 * Creates and migrates the schema on first call.
 * @returns {import('better-sqlite3').Database}
 */
function getDb() {
    if (db) return db;

    mkdirSync(path.dirname(DB_PATH), { recursive: true });

    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    _migrate(db);
    logger.info(`SQLite database initialised at ${DB_PATH}`);

    return db;
}

function _migrate(database) {
    database.exec(`
        CREATE TABLE IF NOT EXISTS oekb_reports (
            isin                  TEXT    NOT NULL,
            currency              TEXT    NOT NULL,
            date                  TEXT    NOT NULL,
            deemed_income         REAL    NOT NULL,
            business_year_start   TEXT    NOT NULL,
            business_year_end     TEXT    NOT NULL,
            fetched_at            TEXT    NOT NULL,
            next_fetch_allowed_at TEXT    NOT NULL,
            PRIMARY KEY (isin, date)
        );

        CREATE TABLE IF NOT EXISTS etf_prices (
            isin         TEXT NOT NULL,
            request_date TEXT NOT NULL,
            result_date  TEXT NOT NULL,
            price        REAL NOT NULL,
            currency     TEXT NOT NULL,
            ticker       TEXT NOT NULL,
            fetched_at   TEXT NOT NULL,
            PRIMARY KEY (isin, request_date)
        );

        CREATE TABLE IF NOT EXISTS exchange_rates (
            currency                      TEXT NOT NULL,
            request_date                  TEXT NOT NULL,
            result_date                   TEXT NOT NULL,
            exchange_rate_currency_to_eur REAL NOT NULL,
            fetched_at                    TEXT NOT NULL,
            PRIMARY KEY (currency, request_date)
        );
    `);
}

export default getDb;
