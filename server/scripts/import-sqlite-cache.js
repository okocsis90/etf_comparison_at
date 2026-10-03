/* global process */
import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import getDb, { closeDb } from '../shared/db/database.js';
import { toDateKey } from '../shared/utils.js';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const sqlitePath = path.resolve(
    process.argv[2] || process.env.SQLITE_PATH || path.join(scriptDirectory, '..', 'data', 'etf-cache.db')
);
const tables = [
    {
        name: 'oekb_reports',
        columns: ['isin', 'currency', 'date', 'deemed_income', 'business_year_start', 'business_year_end', 'fetched_at', 'next_fetch_allowed_at'],
        dateColumns: ['date', 'business_year_start', 'business_year_end'],
        keys: ['isin', 'date'],
    },
    {
        name: 'etf_prices',
        columns: ['isin', 'request_date', 'result_date', 'price', 'currency', 'ticker', 'fetched_at'],
        dateColumns: ['request_date', 'result_date'],
        keys: ['isin', 'request_date'],
    },
    {
        name: 'exchange_rates',
        columns: ['currency', 'request_date', 'result_date', 'exchange_rate_currency_to_eur', 'fetched_at'],
        dateColumns: ['request_date', 'result_date'],
        keys: ['currency', 'request_date'],
    },
    {
        name: 'etf_info',
        columns: ['isin', 'ticker', 'name', 'fetched_at'],
        keys: ['isin'],
    },
];

async function importCache() {
    const sqlite = new Database(sqlitePath, { readonly: true, fileMustExist: true });
    const pool = getDb();

    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            for (const table of tables) {
                const records = sqlite.prepare(`SELECT ${table.columns.join(', ')} FROM ${table.name}`).all();
                const placeholders = table.columns.map((_, index) => `$${index + 1}`).join(', ');
                const insert = `INSERT INTO ${table.name} (${table.columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT (${table.keys.join(', ')}) DO NOTHING`;

                for (const record of records) {
                    await client.query(insert, table.columns.map((column) =>
                        table.dateColumns?.includes(column) ? toDateKey(record[column]) : record[column]
                    ));
                }
                console.log(`Imported ${records.length} SQLite rows from ${table.name}`);
            }
            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } finally {
        sqlite.close();
        await closeDb();
    }
}

importCache().catch((error) => {
    console.error(`SQLite cache import failed: ${error.message}`);
    process.exitCode = 1;
});
