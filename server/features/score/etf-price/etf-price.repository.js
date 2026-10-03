import getDb from '../../../shared/db/database.js';
import logger from '../../../shared/logger.js';
import { toDateKey } from '../../../shared/utils.js';

/**
 * Repository for caching historical ETF prices.
 * Past prices are immutable so cached entries never expire.
 */
class EtfPriceRepository {
    /**
     * Look up a cached ETF price.
     * @param {string} isin
     * @param {Date} requestDate - The date for which the price was requested
     * @returns {{isin: string, requestDate: string, resultDate: string, price: number, currency: string, ticker: string}|null}
     */
    async find(isin, requestDate) {
        const dateKey = toDateKey(requestDate);
        const { rows } = await getDb().query(
            `SELECT isin,
                    TO_CHAR(request_date, 'YYYY-MM-DD') AS request_date,
                    TO_CHAR(result_date, 'YYYY-MM-DD') AS result_date,
                    price,
                    currency,
                    ticker,
                    fetched_at
             FROM etf_prices
             WHERE isin = $1 AND request_date = $2`,
            [isin, dateKey]
        );
        const row = rows[0];

        if (!row) return null;

        logger.info(`Cache hit: ETF price ${isin} on ${dateKey}`);
        return {
            isin: row.isin,
            requestDate: row.request_date,
            resultDate: row.result_date,
            price: row.price,
            currency: row.currency,
            ticker: row.ticker
        };
    }

    /**
     * Persist an ETF price result.
     * @param {string} isin
     * @param {Date} requestDate  - The date that was requested
     * @param {Date} resultDate   - The date the price actually corresponds to
     * @param {number} price
     * @param {string} currency
     * @param {string} ticker
     */
    async save(isin, requestDate, resultDate, price, currency, ticker) {
        if (!Number.isFinite(price) || price <= 0) {
            throw new Error(`Cannot cache invalid price for ${isin}: ${price}`);
        }
        const requestDateKey = toDateKey(requestDate);
        const resultDateKey = toDateKey(resultDate);
        await getDb().query(`
                INSERT INTO etf_prices
                    (isin, request_date, result_date, price, currency, ticker, fetched_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (isin, request_date) DO UPDATE SET
                    result_date = EXCLUDED.result_date,
                    price = EXCLUDED.price,
                    currency = EXCLUDED.currency,
                    ticker = EXCLUDED.ticker,
                    fetched_at = EXCLUDED.fetched_at
            `, [isin, requestDateKey, resultDateKey, price, currency, ticker, new Date().toISOString()]);

        logger.info(`Cached ETF price ${isin} on ${requestDateKey}: ${price} ${currency}`);
    }
}

export default EtfPriceRepository;
