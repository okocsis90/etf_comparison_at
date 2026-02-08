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
     * Searches for a ticker symbol by ISIN using Yahoo Finance search. Prefer quotes from European exchanges
     * (EUR denominated)
     * @param {string} isin - The ISIN to search for
     * @returns {Promise<string|null>} The ticker symbol if found
     */
    async searchTickerByIsin(isin) {
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
     * Gets the ETF price on a specific date.
     * @param {string} isin - The ISIN of the ETF
     * @param {Date|string} date - The date to get the price for
     * @returns {Promise<{isin: string, ticker: string, currency: string, requestDate: Date, resultDate: Date, price: number}>}
     */
    async getPrice(isin, date) {
        const targetDate = new Date(date);
        const ticker = await this.searchTickerByIsin(isin);

        if (!ticker) {
            throw new Error(`Could not find ticker symbol for ISIN: ${isin}`);
        }

        logger.info(`Fetching price for ${isin} (${ticker}) on ${targetDate.toISOString().split('T')[0]}`);

        try {
            const startDate = new Date(targetDate);
            startDate.setDate(startDate.getDate() - 7);

            const endDate = new Date(targetDate);
            endDate.setDate(endDate.getDate() + 1);

            const chart = await this.yahooFinance.chart(ticker, {
                period1: startDate,
                period2: endDate,
                interval: '1d'
            });

            if (!chart.quotes || chart.quotes.length === 0) {
                throw new Error(`No price data found for ${ticker} around ${targetDate.toISOString().split('T')[0]}`);
            }

            let priceData = null;
            for (let i = chart.quotes.length - 1; i >= 0; i--) {
                const quote = chart.quotes[i];
                const quoteDate = new Date(quote.date);
                if (quoteDate <= targetDate && quote.close != null) {
                    priceData = {
                        close: quote.close,
                        date: quoteDate
                    };
                    break;
                }
            }
            if (!priceData) {
                const fallbackQuote = chart.quotes.find(q => q.close != null);
                priceData = fallbackQuote ? {
                    close: fallbackQuote.close,
                    date: new Date(fallbackQuote.date)
                } : {
                    close: chart.quotes[chart.quotes.length - 1].close,
                    date: new Date(chart.quotes[chart.quotes.length - 1].date)
                };
            }

            return {
                isin: isin,
                ticker: ticker,
                currency: chart.meta.currency,
                requestDate: targetDate,
                resultDate: priceData.date,
                price: priceData.close
            };
        } catch (error) {
            logger.error(`Failed to fetch price for ${isin}:`, error.message);
            throw error;
        }
    }

    /**
     * Gets the current/latest ETF price.
     * @param {string} isin - The ISIN of the ETF
     * @returns {Promise<{isin: string, ticker: string, currency: string, requestDate: Date, resultDate: Date, price: number}>}
     */
    async getCurrentPrice(isin) {
        const ticker = await this.searchTickerByIsin(isin);

        if (!ticker) {
            throw new Error(`Could not find ticker symbol for ISIN: ${isin}`);
        }

        try {
            const quote = await this.yahooFinance.quote(ticker);
            const price = quote.regularMarketPrice;
            const currency = quote.currency;

            return {
                isin: isin,
                ticker: ticker,
                currency: currency,
                requestDate: quote.date,
                resultDate: quote.date,
                price: price
            };
        } catch (error) {
            logger.error(`Failed to fetch current price for ${isin}:`, error.message);
            throw error;
        }
    }
}

export default EtfPriceService;
