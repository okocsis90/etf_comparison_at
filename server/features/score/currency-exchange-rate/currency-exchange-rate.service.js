// Currency exchange rate service (DB-friendly shape)
// - This service returns an object that gives the exchange rate to convert FROM a given currency TO EUR.
// - The returned field `exchangeRateCurrencyToEur` is defined as:
//      EUR_amount = amount_in_currency * exchangeRateCurrencyToEur
//   i.e. it is 'EUR per 1 unit of the currency' (EUR / CUR).
// - Internally the service will prefer common ticker orientations (e.g. 'EURUSD=X') and
//   will invert raw quotes when necessary so the returned `exchangeRateCurrencyToEur` always follows
//   the formula above. Callers only need to multiply by `exchangeRateCurrencyToEur` to convert amounts.
//
// Quick numeric examples to avoid confusion:
// 1) Yahoo gives raw ticker 'EURUSD=X' = 1.18 (this is USD per EUR):
//    - Meaning: 1 EUR = 1.18 USD
//    - If you have 100 USD and you want EUR using the raw ticker, you must divide:
//        EUR = amount_in_USD / rawTickerValue  => 100 / 1.18 ≈ 84.75 EUR
//    - Equivalent: invert the raw ticker => 1 / 1.18 ≈ 0.847 (EUR per USD). Then:
//        EUR = amount_in_USD * 0.847
// 2) The service normalizes for you and returns: { exchangeRateCurrencyToEur: 0.847 }
//    - Then convert by multiplying directly:
//        EUR = amount_in_USD * exchangeRateCurrencyToEur
//    - So use the service's returned value as a multiplier (no manual inversion needed).

import logger from '../../../shared/logger.js';
import YahooFinance from 'yahoo-finance2';

class CurrencyExchangeRateService {
    constructor() {
        this.yahooFinance = new YahooFinance();
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

        logger.info(`Fetching exchange rate for ${cur} -> EUR on ${targetDate.toISOString().split('T')[0]}`);

        const startDate = new Date(targetDate);
        startDate.setDate(startDate.getDate() - 7);

        const endDate = new Date(targetDate);
        endDate.setDate(endDate.getDate() + 1);

        // Prefer the more common EUR-first ticker (e.g. EURUSD=X). When using that, we must invert the raw quote
        const primaryTicker = `EUR${cur}=X`;
        const primaryInvert = true; // because EUR{CUR}=X gives EUR->CUR, invert to get CUR->EUR

        const secondaryTicker = `${cur}EUR=X`;
        const secondaryInvert = false; // direct CUR->EUR

        const buildResult = (priceData, raw, ticker, invert) => ({
            requestDate: targetDate.toISOString(),
            resultDate: priceData.toISOString(),
            currency: cur,
            // exchangeRateCurrencyToEur is always CUR -> EUR multiplier (e.g. USD -> EUR)
            exchangeRateCurrencyToEur: invert ? (raw === 0 ? null : 1 / raw) : raw
        });

        const tryTicker = async (ticker, invert = false) => {
            try {
                const chart = await this.yahooFinance.chart(ticker, {
                    period1: startDate,
                    period2: endDate,
                    interval: '1d'
                });

                if (chart && chart.quotes && chart.quotes.length > 0) {
                    let priceData = null;
                    for (let i = chart.quotes.length - 1; i >= 0; i--) {
                        const q = chart.quotes[i];
                        const qDate = new Date(q.date);
                        if (qDate <= targetDate && q.close != null) {
                            priceData = { close: q.close, date: qDate };
                            break;
                        }
                    }
                    if (!priceData) {
                        const fallback = chart.quotes.find(q => q.close != null);
                        if (fallback) priceData = { close: fallback.close, date: new Date(fallback.date) };
                    }

                    if (priceData && typeof priceData.close === 'number') {
                        const raw = priceData.close;
                        const value = invert ? (raw === 0 ? null : 1 / raw) : raw;
                        if (value == null) return null;
                        // Log the raw ticker orientation and the normalized CUR->EUR multiplier
                        logger.info(`Found rate for ${ticker} on ${priceData.date.toISOString().split('T')[0]}: raw=${raw} (ticker orientation ${invert ? 'EUR->CUR' : 'CUR->EUR'}) => CUR->EUR=${value}`);
                        return buildResult(priceData.date, raw, ticker, invert);
                    }
                }

                // fallback to quote endpoint
                const quote = await this.yahooFinance.quote(ticker);
                if (quote && (quote.regularMarketPrice || quote.regularMarketPrice === 0)) {
                    const raw = quote.regularMarketPrice;
                    const value = invert ? (raw === 0 ? null : 1 / raw) : raw;
                    if (value == null) return null;
                    const qDate = quote.regularMarketTime ? new Date(quote.regularMarketTime) : targetDate;
                    logger.info(`Found quote for ${ticker}: raw=${raw} (ticker orientation ${invert ? 'EUR->CUR' : 'CUR->EUR'}) => CUR->EUR=${value}`);
                    return buildResult(qDate, raw, ticker, invert);
                }

                return null;
            } catch (err) {
                logger.debug(`Ticker ${ticker} not available or failed: ${err.message}`);
                return null;
            }
        };

        // Try primary (EUR{CUR}=X) first, then direct ({CUR}EUR=X)
        const prim = await tryTicker(primaryTicker, primaryInvert);
        if (prim != null) return prim;

        const sec = await tryTicker(secondaryTicker, secondaryInvert);
        if (sec != null) return sec;

        // As a last resort, try searching for tickers containing the currency code
        try {
            const results = await this.yahooFinance.search(cur);
            if (results && results.quotes && results.quotes.length > 0) {
                for (const q of results.quotes) {
                    const sym = q.symbol;
                    if (!sym) continue;
                    const val = await tryTicker(sym, false);
                    if (val != null) return val;
                    const valInv = await tryTicker(sym, true);
                    if (valInv != null) return valInv;
                }
            }
        } catch (err) {
            logger.debug('Search fallback failed: ' + err.message);
        }

        // Optionally, we could try a USD cross here, but keep it explicit for now
        throw new Error(`Could not determine exchange rate for ${cur} -> EUR on ${targetDate.toISOString().split('T')[0]}`);
    }
}

export default CurrencyExchangeRateService;
