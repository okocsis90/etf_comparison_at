import logger from '../../../shared/logger.js';
import YahooFinance from "yahoo-finance2";

/**
 * Handles ETF price fetching for a given ISIN and date.
 * Uses Yahoo Finance API to get historical prices.
 */
class EtfPriceService {
    constructor() {
        this.yahooFinance = new YahooFinance();
    }

    /**
     * Gets the ETF price on a specific date.
     * @param {string} isin - The ISIN of the ETF
     * @param {Date|string} date - The date to get the price for
     * @returns {Promise<{isin: string, ticker: string, currency: string, requestDate: Date, resultDate: Date, price: number}>}
     */
    async getPrice(isin, date) {
        const targetDate = new Date(date);
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

            return {
                isin: isin,
                ticker: ticker,
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
     * Gets the current/latest ETF price.
     * @param {string} isin - The ISIN of the ETF
     * @returns {Promise<{isin: string, ticker: string, currency: string, requestDate: Date, resultDate: Date, price: number}>}
     */
    async getCurrentPrice(isin) {
        const ticker = await this._searchTickerByIsin(isin);

        if (!ticker) {
            throw new Error(`Could not find ticker symbol for ISIN: ${isin}`);
        }

        try {
            const result = await this._fetchQuotePrice(ticker);

            return {
                isin: isin,
                ticker: ticker,
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
     * Searches for a ticker symbol by ISIN using Yahoo Finance search. Prefer quotes from European exchanges
     * (EUR denominated)
     * @param {string} isin - The ISIN to search for
     * @returns {Promise<string|null>} The ticker symbol if found
     * @private
     */
    async _searchTickerByIsin(isin) {
        try {
            const results = await this.yahooFinance.search(isin);
            if (results.quotes && results.quotes.length > 0) {
                const euroQuote = results.quotes.find(q =>
                    q.symbol.endsWith('.DE') ||
                    q.symbol.endsWith('.AS') ||
                    q.symbol.endsWith('.PA') ||
                    q.symbol.endsWith('.MI')
                );
                return euroQuote ? euroQuote.symbol : results.quotes[0].symbol;
            }
            return null;
        } catch (error) {
            logger.error(`Failed to search ticker for ISIN ${isin}:`, error.message);
            return null;
        }
    }

    /**
     * Fetch historical chart data and extract price information.
     * @private
     */
    async _fetchChartPrice(ticker, targetDate, startDate, endDate) {
        const chart = await this.yahooFinance.chart(ticker, {
            period1: startDate,
            period2: endDate,
            interval: '1d'
        });

        if (!chart || !chart.quotes || chart.quotes.length === 0) {
            throw new Error(`No price data found for ${ticker} around ${targetDate.toISOString().split('T')[0]}`);
        }

        const priceData = this._findBestPriceData(chart.quotes, targetDate);
        if (!priceData) {
            throw new Error(`No valid price data found for ${ticker} around ${targetDate.toISOString().split('T')[0]}`);
        }

        const currency = chart.meta?.currency;
        if (!currency) {
            logger.warn(`No currency information found for ${ticker}, results may be unreliable`);
        }

        logger.info(`Found price for ${ticker} on ${priceData.date.toISOString().split('T')[0]}: ${priceData.close} ${currency || 'unknown currency'}`);

        return {
            price: priceData.close,
            date: priceData.date,
            currency: currency
        };
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
            const quote = quotes[i];
            const quoteDate = new Date(quote.date);
            if (quoteDate <= targetDate && quote.close != null) {
                return { close: quote.close, date: quoteDate };
            }
        }

        const fallback = quotes.find(q => q.close != null);
        if (fallback) {
            return { close: fallback.close, date: new Date(fallback.date) };
        }

        return null;
    }

    /**
     * Fetch current quote data and extract price information.
     * @private
     */
    async _fetchQuotePrice(ticker) {
        const quote = await this.yahooFinance.quote(ticker);

        // Try multiple price fields in order of preference
        const price = quote.regularMarketPrice ?? quote.price ?? quote.bid ?? quote.ask;

        if (price == null) {
            throw new Error(`No price data available for ticker ${ticker}`);
        }

        const currency = quote.currency;
        if (!currency) {
            logger.warn(`No currency data available for ticker ${ticker}, results may be unreliable`);
        }

        // Use regularMarketTime if available, otherwise fall back to current time
        const resultDate = quote.regularMarketTime || quote.postMarketTime || new Date();

        logger.info(`Found current price for ${ticker}: ${price} ${currency || 'unknown currency'}`);

        return {
            price: price,
            date: resultDate,
            currency: currency
        };
    }
}

export default EtfPriceService;
