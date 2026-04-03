import logger from '../../../shared/logger.js';
import YahooFinance from 'yahoo-finance2';
import EtfPriceRepository from './etf-price.repository.js';

/**
 * ETF price service.
 *
 * Fetches historical and current ETF prices via Yahoo Finance, with a persistent
 * SQLite cache for historical prices (past prices are immutable so they never expire).
 *
 * Ticker resolution strategy:
 *   When given an ISIN, the service searches Yahoo Finance and prefers tickers
 *   listed on major European EUR-denominated exchanges (.DE, .AS, .PA, .MI) so
 *   that price values are already in EUR and minimize the need for currency conversion.
 *   If no European ticker is found it falls back to the first result.
 *
 *   Resolved tickers are cached in-memory for the lifetime of the service instance
 *   so that multiple price lookups for the same ISIN (e.g. several report dates)
 *   only pay the search API cost once.
 *
 * Date fallback strategy:
 *   For a requested date that falls on a weekend or public holiday, the service
 *   returns the most recent available trading day before or on that date.
 *   If no earlier data exists in the fetched window it falls back to the earliest
 *   available quote in the window and logs a warning.
 */
class EtfPriceService {
    constructor() {
        this.yahooFinance = new YahooFinance();
        this.repository = new EtfPriceRepository();
        /** @type {Map<string, string>} in-memory ISIN → ticker cache */
        this._tickerCache = new Map();
    }

    /**
     * Gets the ETF price on a specific date.
     * Results are cached persistently; a cache hit never triggers a network call.
     * @param {string} isin - The ISIN of the ETF
     * @param {Date|string} date - The date to get the price for
     * @returns {Promise<{isin: string, ticker: string, currency: string|null, requestDate: Date, resultDate: Date, price: number}>}
     */
    async getPrice(isin, date) {
        if (!isin) throw new Error('isin is required');

        const targetDate = new Date(date);
        if (isNaN(targetDate.getTime())) {
            throw new Error(`Invalid date provided: ${date}`);
        }

        const cached = this.repository.find(isin, targetDate);
        if (cached) {
            return {
                isin,
                ticker: cached.ticker,
                currency: cached.currency ?? null,
                requestDate: targetDate,
                resultDate: new Date(cached.resultDate),
                price: cached.price
            };
        }

        const ticker = await this._searchTickerByIsin(isin);
        if (!ticker) {
            throw new Error(`Could not find ticker symbol for ISIN: ${isin}`);
        }

        logger.info(`Fetching price for ${isin} (${ticker}) on ${targetDate.toISOString().split('T')[0]}`);

        try {
            const startDate = new Date(targetDate);
            startDate.setDate(startDate.getDate() - 7);

            const endDate = new Date(targetDate);
            endDate.setDate(endDate.getDate() + 1);

            const result = await this._fetchChartPrice(ticker, targetDate, startDate, endDate);

            this.repository.save(isin, targetDate, result.date, result.price, result.currency, ticker);

            return {
                isin,
                ticker,
                currency: result.currency,
                requestDate: targetDate,
                resultDate: result.date,
                price: result.price
            };
        } catch (error) {
            logger.error(`Failed to fetch price for ${isin} (${ticker}): ${error.message}`);
            throw error;
        }
    }

    /**
     * Gets the current/latest ETF price. Never cached (live data).
     * @param {string} isin - The ISIN of the ETF
     * @returns {Promise<{isin: string, ticker: string, currency: string|null, requestDate: Date, resultDate: Date, price: number}>}
     */
    async getCurrentPrice(isin) {
        if (!isin) throw new Error('isin is required');

        const ticker = await this._searchTickerByIsin(isin);
        if (!ticker) {
            throw new Error(`Could not find ticker symbol for ISIN: ${isin}`);
        }

        try {
            const result = await this._fetchQuotePrice(ticker);

            return {
                isin,
                ticker,
                currency: result.currency,
                requestDate: new Date(),
                resultDate: result.date,
                price: result.price
            };
        } catch (error) {
            logger.error(`Failed to fetch current price for ${isin} (${ticker}): ${error.message}`);
            throw error;
        }
    }

    /**
     * Resolves an ISIN to a Yahoo Finance ticker symbol.
     * Prefers EUR-denominated European exchanges (.DE, .AS, .PA, .MI).
     * Results are cached in-memory for the lifetime of this instance.
     * @param {string} isin
     * @returns {Promise<string|null>} Ticker symbol or null if not found
     * @private
     */
    async _searchTickerByIsin(isin) {
        if (this._tickerCache.has(isin)) {
            return this._tickerCache.get(isin);
        }

        try {
            const results = await this.yahooFinance.search(isin);
            if (!results?.quotes?.length) return null;

            const euroQuote = results.quotes.find(q =>
                q.symbol.endsWith('.DE') ||
                q.symbol.endsWith('.AS') ||
                q.symbol.endsWith('.PA') ||
                q.symbol.endsWith('.MI')
            );
            const ticker = euroQuote ? euroQuote.symbol : results.quotes[0].symbol;

            this._tickerCache.set(isin, ticker);
            return ticker;
        } catch (error) {
            logger.error(`Failed to search ticker for ISIN ${isin}: ${error.message}`);
            return null;
        }
    }

    /**
     * Fetch historical chart data and extract the best available price.
     * @param {string} ticker
     * @param {Date} targetDate
     * @param {Date} startDate
     * @param {Date} endDate
     * @returns {Promise<{price: number, date: Date, currency: string|null}>}
     * @private
     */
    async _fetchChartPrice(ticker, targetDate, startDate, endDate) {
        const chart = await this.yahooFinance.chart(ticker, {
            period1: startDate,
            period2: endDate,
            interval: '1d'
        });

        if (!chart?.quotes?.length) {
            throw new Error(`No price data found for ${ticker} around ${targetDate.toISOString().split('T')[0]}`);
        }

        const priceData = this._findBestPriceData(chart.quotes, targetDate);
        if (!priceData) {
            throw new Error(`No valid price data found for ${ticker} around ${targetDate.toISOString().split('T')[0]}`);
        }

        const currency = chart.meta?.currency ?? null;
        if (!currency) {
            logger.warn(`No currency information found for ${ticker}, results may be unreliable`);
        }

        logger.info(`Found price for ${ticker} on ${priceData.date.toISOString().split('T')[0]}: ${priceData.close} ${currency ?? 'unknown currency'}`);

        return {
            price: priceData.close,
            date: priceData.date,
            currency
        };
    }

    /**
     * Find the best price data from chart quotes.
     * Looks for the most recent quote on or before the target date with a valid positive price.
     * Falls back to the earliest available valid quote if no earlier match is found.
     * @param {Array} quotes
     * @param {Date} targetDate
     * @returns {{close: number, date: Date}|null}
     * @private
     */
    _findBestPriceData(quotes, targetDate) {
        if (!quotes || quotes.length === 0) return null;

        for (let i = quotes.length - 1; i >= 0; i--) {
            const quote = quotes[i];
            const quoteDate = new Date(quote.date);
            if (quoteDate <= targetDate && Number.isFinite(quote.close) && quote.close > 0) {
                return { close: quote.close, date: quoteDate };
            }
        }

        const fallback = quotes.find(q => Number.isFinite(q.close) && q.close > 0);
        if (fallback) {
            logger.warn(`No price data found on or before ${targetDate.toISOString().split('T')[0]} for requested window, using earliest available`);
            return { close: fallback.close, date: new Date(fallback.date) };
        }

        return null;
    }

    /**
     * Fetch live quote data and extract the current price.
     * @param {string} ticker
     * @returns {Promise<{price: number, date: Date, currency: string|null}>}
     * @private
     */
    async _fetchQuotePrice(ticker) {
        const quote = await this.yahooFinance.quote(ticker);

        // Try multiple price fields in order of preference
        const price = quote.regularMarketPrice ?? quote.price ?? quote.bid ?? quote.ask;
        if (price == null) {
            throw new Error(`No price data available for ticker ${ticker}`);
        }

        const currency = quote.currency ?? null;
        if (!currency) {
            logger.warn(`No currency data available for ticker ${ticker}, results may be unreliable`);
        }

        const resultDate = quote.regularMarketTime ?? quote.postMarketTime ?? new Date();

        logger.info(`Found current price for ${ticker}: ${price} ${currency ?? 'unknown currency'}`);

        return { price, date: resultDate, currency };
    }
}

export default EtfPriceService;
