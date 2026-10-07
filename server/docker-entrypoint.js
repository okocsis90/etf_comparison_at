/* global process */
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import logger from './shared/logger.js';

const sqliteCachePath = process.env.SQLITE_PATH || '/data/etf-cache.db';

if (existsSync(sqliteCachePath)) {
    logger.info('Optional SQLite cache found; importing cache data');
    const importResult = spawnSync(
        process.execPath,
        ['/app/scripts/import-sqlite-cache.js', sqliteCachePath, '--only-if-empty'],
        { stdio: 'inherit' }
    );

    if (importResult.error) throw importResult.error;
    if (importResult.status !== 0) {
        throw new Error(`SQLite cache import failed with status ${importResult.status ?? importResult.signal}`);
    }
} else {
    logger.info('No optional SQLite cache found; starting with an empty PostgreSQL cache');
}

await import('./index.js');
