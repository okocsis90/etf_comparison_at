import getDb from '../../../shared/db/database.js';
import logger from '../../../shared/logger.js';
import { toDateKey } from '../../../shared/utils.js';

/**
 * Repository for caching currency exchange rates to EUR.
 * Past exchange rates are immutable so cached entries never expire.
 */
class ExchangeRateRepository {
    /**
     * Look up a cached exchange rate.
     * @param {string} currency - Three-letter currency code (e.g. 'USD')
     * @param {Date} requestDate - The date for which the rate was fetched
     * @returns {{currency: string, date: string, exchangeRateCurrencyToEur: number}|null}
     */
    find(currency, requestDate) {
        if (!currency) throw new Error('currency is required');
        const dateKey = toDateKey(requestDate);
        const row = getDb()
            .prepare('SELECT * FROM exchange_rates WHERE currency = ? AND request_date = ?')
            .get(currency.toUpperCase(), dateKey);

        if (!row) return null;

        logger.info(`Cache hit: exchange rate ${currency} on ${dateKey}`);
        return {
            requestDate: row.request_date,
            resultDate: row.result_date,
            currency: row.currency,
            exchangeRateCurrencyToEur: row.exchange_rate_currency_to_eur
        };
    }

    /**
     * Persist an exchange rate result.
     * @param {string} currency
     * @param {Date} requestDate - The date that was requested
     * @param {Date} resultDate  - The date the rate actually corresponds to
     * @param {number} exchangeRateCurrencyToEur
     */
    save(currency, requestDate, resultDate, exchangeRateCurrencyToEur) {
        if (!currency) throw new Error('currency is required');
        const requestDateKey = toDateKey(requestDate);
        const resultDateKey = toDateKey(resultDate);
        getDb()
            .prepare(`
                INSERT OR REPLACE INTO exchange_rates
                    (currency, request_date, result_date, exchange_rate_currency_to_eur, fetched_at)
                VALUES (?, ?, ?, ?, ?)
            `)
            .run(currency.toUpperCase(), requestDateKey, resultDateKey, exchangeRateCurrencyToEur, new Date().toISOString());

        logger.info(`Cached exchange rate ${currency} on ${requestDateKey}: ${exchangeRateCurrencyToEur}`);
    }
}

export default ExchangeRateRepository;
