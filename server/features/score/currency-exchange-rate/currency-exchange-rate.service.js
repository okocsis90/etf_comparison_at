/**
 * Currency exchange rate service.
 *
 * This service returns an object that gives the exchange rate to convert FROM a given currency TO EUR.
 *
 * The returned field `exchangeRateCurrencyToEur` is defined as:
 *
 *   EUR_amount = amount_in_currency * exchangeRateCurrencyToEur
 *
 * i.e. it is "EUR per 1 unit of the currency" (EUR / CUR).
 *
 * Internally the service prefers common ticker orientations (for example: "EURUSD=X") and
 * will invert raw quotes when necessary so the returned `exchangeRateCurrencyToEur` always follows
 * the formula above. Callers only need to multiply by `exchangeRateCurrencyToEur` to convert amounts.
 *
 * Quick numeric examples to avoid confusion:
 *
 * 1) Yahoo returns raw ticker 'EURUSD=X' = 1.18 (USD per EUR)
 *    - Meaning: 1 EUR = 1.18 USD
 *    - If you have 100 USD and want EUR using the raw ticker, you must divide:
 *        EUR = amount_in_USD / rawTickerValue  => 100 / 1.18 ≈ 84.75 EUR
 *    - Equivalent: invert the raw ticker => 1 / 1.18 ≈ 0.847 (EUR per USD). Then:
 *        EUR = amount_in_USD * 0.847
 *
 * 2) The service normalizes for you and returns: { exchangeRateCurrencyToEur: 0.847 }
 *    - Then convert by multiplying directly:
 *        EUR = amount_in_USD * exchangeRateCurrencyToEur
 *    - So use the service's returned value as a multiplier (no manual inversion needed).
 *
 * @example
 * const svc = new CurrencyExchangeRateService();
 * const res = await svc.getExchangeRate('USD', '2023-01-01');
 * // res.exchangeRateCurrencyToEur -> EUR per 1 USD (number)
 *
 * @module currency-exchange-rate.service
 */

import logger from '../../../shared/logger.js';
import YahooFinance from 'yahoo-finance2';
import ExchangeRateRepository from './exchange-rate.repository.js';

class CurrencyExchangeRateService {
    constructor() {
        this.yahooFinance = new YahooFinance();
        this.repository = new ExchangeRateRepository();
    }

    /**
     * Get exchange rate to EUR for a given currency on a specific date.
     * @param {string} currency - Three-letter currency code, e.g. 'USD'
     * @param {Date|string} date - Target date
     * @returns {Promise<{requestDate:string,resultDate:string,currency:string,exchangeRateCurrencyToEur:number}>}
     *    exchangeRateCurrencyToEur: number such that `amount_in_currency * exchangeRateCurrencyToEur = amount_in_EUR`
     */
    async getExchangeRate(currency, date) {
        const cur = (currency || '').toUpperCase();
        if (!cur) throw new Error('currency is required');

        const targetDate = new Date(date);
        if (isNaN(targetDate.getTime())) {
            throw new Error(`Invalid date provided: ${date}`);
        }

        if (cur === 'EUR') {
            logger.info('Requested exchange rate for EUR -> EUR: returning 1.0 (EUR per EUR)');
            return {
                requestDate: targetDate.toISOString(),
                resultDate: targetDate.toISOString(),
                currency: 'EUR',
                exchangeRateCurrencyToEur: 1.0
            };
        }

        const cached = this.repository.find(cur, targetDate);
        if (cached) {
            return {
                requestDate: cached.requestDate,
                resultDate: cached.resultDate,
                currency: cached.currency,
                exchangeRateCurrencyToEur: cached.exchangeRateCurrencyToEur
            };
        }

        logger.info(`Fetching exchange rate for ${cur} -> EUR on ${targetDate.toISOString().split('T')[0]}`);

        const startDate = new Date(targetDate);
        startDate.setDate(startDate.getDate() - 7);

        const endDate = new Date(targetDate);
        endDate.setDate(endDate.getDate() + 1);

        // Prefer the more common EUR-first ticker (e.g. EURUSD=X). When using that, we must invert the raw quote
        const primaryTicker = `EUR${cur}=X`;
        // because EUR{CUR}=X gives EUR->CUR, invert to get CUR->EUR
        const primaryInvert = true;

        const secondaryTicker = `${cur}EUR=X`;
        // direct CUR->EUR
        const secondaryInvert = false;

        // Try primary (EUR{CUR}=X) first, then direct ({CUR}EUR=X)
        const primaryResult = await this._tryTicker(primaryTicker, primaryInvert, startDate, endDate, targetDate, cur);
        if (primaryResult != null) return this._saveAndReturn(primaryResult, targetDate);

        const secondaryResult = await this._tryTicker(secondaryTicker, secondaryInvert, startDate, endDate, targetDate, cur);
        if (secondaryResult != null) return this._saveAndReturn(secondaryResult, targetDate);

        // As a last resort, try searching for tickers containing the currency code
        const searchResult = await this._trySearchFallback(cur, startDate, endDate, targetDate);
        if (searchResult != null) return this._saveAndReturn(searchResult, targetDate);

        throw new Error(`Could not determine exchange rate for ${cur} -> EUR on ${targetDate.toISOString().split('T')[0]}`);
    }

    /**
     * Saves a fetched result to the repository and returns it.
     * @private
     */
    _saveAndReturn(result, requestDate) {
        this.repository.save(
            result.currency,
            requestDate,
            new Date(result.resultDate),
            result.exchangeRateCurrencyToEur
        );
        return result;
    }

    /**
     * Try a single ticker, attempting chart data first then falling back to quote endpoint.
     * Each strategy has its own error handling so a chart failure does not skip the quote attempt.
     * @private
     */
    async _tryTicker(ticker, invert = false, startDate, endDate, targetDate, cur) {
        try {
            const chartResult = await this._tryChartData(ticker, invert, startDate, endDate, targetDate, cur);
            if (chartResult != null) return chartResult;
        } catch (err) {
            logger.warn(`Chart lookup failed for ${ticker}: ${err.message}`);
        }

        try {
            return await this._tryQuoteFallback(ticker, invert, targetDate, cur);
        } catch (err) {
            logger.warn(`Quote fallback also failed for ${ticker}: ${err.message}`);
            return null;
        }
    }

    /**
     * Try to get exchange rate from chart data.
     * @private
     */
    async _tryChartData(ticker, invert, startDate, endDate, targetDate, cur) {
        const chart = await this.yahooFinance.chart(ticker, {
            period1: startDate,
            period2: endDate,
            interval: '1d'
        });

        if (!chart || !chart.quotes || chart.quotes.length === 0) return null;

        const priceData = this._findBestPriceData(chart.quotes, targetDate);
        if (!priceData || typeof priceData.close !== 'number') return null;

        const raw = priceData.close;
        const result = this._buildResult(priceData.date, raw, invert, cur, targetDate);

        if (result.exchangeRateCurrencyToEur == null) return null;
        logger.info(`Found rate for ${ticker} on ${priceData.date.toISOString().split('T')[0]}: raw=${raw} (ticker orientation ${invert ? 'EUR->CUR' : 'CUR->EUR'}) => CUR->EUR=${result.exchangeRateCurrencyToEur}`);
        return result;
    }

    /**
     * Find the best price data from chart quotes.
     * Looks for the most recent quote before or on the target date.
     * Falls back to any available quote if no match is found.
     * @private
     */
    _findBestPriceData(quotes, targetDate) {
        if (!quotes || quotes.length === 0) return null;

        for (let i = quotes.length - 1; i >= 0; i--) {
            const q = quotes[i];
            const qDate = new Date(q.date);
            if (qDate <= targetDate && q.close != null) {
                return { close: q.close, date: qDate };
            }
        }

        const fallback = quotes.find(q => q.close != null);
        if (fallback) {
            return { close: fallback.close, date: new Date(fallback.date) };
        }

        return null;
    }

    /**
     * Construct the standard result shape.
     * @param {Date} resultDate - The date the rate actually corresponds to
     * @param {number} raw - The raw price from Yahoo Finance
     * @param {boolean} invert - Whether to invert the rate
     * @param {string} cur - Three-letter currency code
     * @param {Date} requestDate - The originally requested date
     * @returns {{requestDate:string, resultDate:string, currency:string, exchangeRateCurrencyToEur:number|null}}
     * @private
     */
    _buildResult(resultDate, raw, invert, cur, requestDate) {
        return {
            requestDate: requestDate.toISOString(),
            resultDate: resultDate.toISOString(),
            currency: cur,
            exchangeRateCurrencyToEur: this._calculateExchangeRate(raw, invert)
        };
    }

    /**
     * Calculate the exchange rate to EUR from the raw ticker value.
     * @param {number} raw - The raw price from Yahoo Finance
     * @param {boolean} invert - Whether to invert the rate (for EUR->CUR tickers)
     * @returns {number|null} The exchange rate (CUR->EUR multiplier) or null if invalid
     * @private
     */
    _calculateExchangeRate(raw, invert) {
        if (!Number.isFinite(raw) || raw <= 0) return null;
        if (invert) {
            return 1 / raw;
        }
        return raw;
    }

    /**
     * Try to get exchange rate using the quote endpoint as a fallback.
     * @private
     */
    async _tryQuoteFallback(ticker, invert, targetDate, cur) {
        const quote = await this.yahooFinance.quote(ticker);
        if (!quote) return null;

        const raw = quote.regularMarketPrice ?? quote.price ?? quote.bid ?? quote.ask;
        if (raw == null || typeof raw !== 'number') return null;

        const qDate = quote.regularMarketTime ?? quote.postMarketTime ?? targetDate;
        const result = this._buildResult(qDate, raw, invert, cur, targetDate);

        if (result.exchangeRateCurrencyToEur == null) return null;
        logger.info(`Found quote for ${ticker}: raw=${raw} (ticker orientation ${invert ? 'EUR->CUR' : 'CUR->EUR'}) => CUR->EUR=${result.exchangeRateCurrencyToEur}`);
        return result;
    }

    /**
     * Try searching for tickers containing the currency code as a last resort.
     * Infers the correct inversion from the ticker symbol when possible.
     * @private
     */
    async _trySearchFallback(cur, startDate, endDate, targetDate) {
        try {
            const results = await this.yahooFinance.search(cur);
            if (!results || !results.quotes || results.quotes.length === 0) return null;

            for (const q of results.quotes) {
                const sym = q.symbol;
                if (!sym) continue;

                const invert = this._inferInversion(sym, cur);
                if (invert !== null) {
                    const result = await this._tryTicker(sym, invert, startDate, endDate, targetDate, cur);
                    if (result != null) return result;
                } else {
                    // Unknown orientation — try normal first, then inverted
                    logger.warn(`Cannot infer orientation for search result ${sym}, trying both`);
                    const normalResult = await this._tryTicker(sym, false, startDate, endDate, targetDate, cur);
                    if (normalResult != null) return normalResult;

                    const invertedResult = await this._tryTicker(sym, true, startDate, endDate, targetDate, cur);
                    if (invertedResult != null) return invertedResult;
                }
            }

            return null;
        } catch (err) {
            logger.error('Search fallback failed: ' + err.message);
            return null;
        }
    }

    /**
     * Infer whether a ticker symbol needs inversion to get CUR→EUR.
     * @param {string} symbol - Ticker symbol, e.g. "EURUSD=X"
     * @param {string} cur - Three-letter currency code, e.g. "USD"
     * @returns {boolean|null} true = invert (EUR→CUR ticker), false = direct (CUR→EUR), null = ambiguous
     * @private
     */
    _inferInversion(symbol, cur) {
        const base = symbol.toUpperCase().replace('=X', '');
        if (base.startsWith('EUR') && base.includes(cur)) {
            return true;   // EUR{CUR} → gives EUR→CUR, must invert
        }
        if (base.startsWith(cur) && base.includes('EUR')) {
            return false;  // {CUR}EUR → gives CUR→EUR directly
        }
        return null;
    }
}

export default CurrencyExchangeRateService;
