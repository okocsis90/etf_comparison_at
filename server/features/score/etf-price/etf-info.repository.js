import getDb from '../../../shared/db/database.js';
import logger from '../../../shared/logger.js';

const TTL_DAYS = 30;

/**
 * Repository for caching ETF metadata (ticker and display name).
 * Entries expire after TTL_DAYS so a renamed ETF will eventually be re-fetched.
 */
class EtfInfoRepository {
  /**
   * Returns cached ETF info if present and not expired, otherwise null.
   * @param {string} isin
   * @returns {{ ticker: string, name: string } | null}
   */
  find(isin) {
    const row = getDb()
      .prepare('SELECT ticker, name, fetched_at FROM etf_info WHERE isin = ?')
      .get(isin);

    if (!row) return null;

    const fetchedAt = new Date(row.fetched_at);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - TTL_DAYS);

    if (fetchedAt < cutoff) {
      logger.info(`ETF info cache expired for ${isin} (fetched ${row.fetched_at}), will re-fetch`);
      return null;
    }

    logger.info(`Cache hit: ETF info for ${isin} — ${row.ticker} "${row.name}"`);
    return { ticker: row.ticker, name: row.name };
  }

  /**
   * Persists ETF metadata. Overwrites any existing entry for the ISIN.
   * @param {string} isin
   * @param {string} ticker
   * @param {string} name
   */
  save(isin, ticker, name) {
    getDb()
      .prepare(`
        INSERT OR REPLACE INTO etf_info (isin, ticker, name, fetched_at)
        VALUES (?, ?, ?, ?)
      `)
      .run(isin, ticker, name, new Date().toISOString());

    logger.info(`Cached ETF info for ${isin}: ${ticker} — "${name}"`);
  }
}

export default EtfInfoRepository;

