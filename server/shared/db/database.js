/* global process */
import pg from 'pg';
import logger from '../logger.js';

const { Pool } = pg;
let pool;

/**
 * Returns the shared PostgreSQL connection pool.
 * @returns {import('pg').Pool}
 */
function getDb() {
    if (pool) return pool;

    const ssl = process.env.DATABASE_SSL === 'true'
        ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false' }
        : undefined;
    pool = new Pool(process.env.DATABASE_URL
        ? { connectionString: process.env.DATABASE_URL, ssl }
        : {
            host: process.env.DB_HOST || 'localhost',
            port: Number(process.env.DB_PORT || 5432),
            database: process.env.DB_NAME || 'etf_comparison',
            user: process.env.DB_USER || 'etf_app',
            password: process.env.DB_PASSWORD || 'etf_dev_password',
            ssl,
        });

    pool.on('error', (error) => {
        logger.error('Unexpected PostgreSQL pool error', {
            error: error.message,
            stack: error.stack,
        });
    });
    logger.info('PostgreSQL connection pool initialised');
    return pool;
}

export async function closeDb() {
    if (!pool) return;
    const currentPool = pool;
    pool = undefined;
    await currentPool.end();
}

export default getDb;
