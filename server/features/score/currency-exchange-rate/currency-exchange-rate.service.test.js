import { jest } from '@jest/globals';
import { describe, test, expect, beforeEach } from '@jest/globals';

// Mock the logger before importing the service
const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
};

jest.unstable_mockModule('../../../shared/logger.js', () => ({
    default: mockLogger
}));

// Mock YahooFinance
const mockYahooFinance = {
    chart: jest.fn(),
    quote: jest.fn(),
    search: jest.fn()
};

jest.unstable_mockModule('yahoo-finance2', () => ({
    default: jest.fn(() => mockYahooFinance)
}));

// Mock the repository so tests never touch the real DB
const mockExchangeRateRepository = {
    find: jest.fn().mockReturnValue(null),
    save: jest.fn()
};

jest.unstable_mockModule('./exchange-rate.repository.js', () => ({
    default: jest.fn(() => mockExchangeRateRepository)
}));

// Now import the service after mocks are set up
const { default: CurrencyExchangeRateService } = await import('./currency-exchange-rate.service.js');

describe('CurrencyExchangeRateService', () => {
    let service;
    const testDate = new Date('2024-01-15');

    beforeEach(() => {
        service = new CurrencyExchangeRateService();
        jest.clearAllMocks();
    });

    describe('getExchangeRate', () => {
        test('should return 1.0 for EUR to EUR conversion', async () => {
            const result = await service.getExchangeRate('EUR', testDate);

            expect(result).toEqual({
                requestDate: testDate.toISOString(),
                resultDate: testDate.toISOString(),
                currency: 'EUR',
                exchangeRateCurrencyToEur: 1.0
            });
            expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('EUR -> EUR: returning 1.0'));
        });

        test('should throw error if currency is missing', async () => {
            await expect(service.getExchangeRate('', testDate))
                .rejects.toThrow('currency is required');
        });

        test('should throw error if date is invalid', async () => {
            await expect(service.getExchangeRate('USD', 'invalid-date'))
                .rejects.toThrow('Invalid date provided');
        });

        test('should fetch USD exchange rate using primary ticker (EURUSD=X)', async () => {
            const mockChartData = {
                quotes: [
                    { date: new Date('2024-01-14'), close: 1.09 },
                    { date: new Date('2024-01-15'), close: 1.10 }
                ]
            };

            mockYahooFinance.chart.mockResolvedValueOnce(mockChartData);

            const result = await service.getExchangeRate('USD', testDate);

            expect(mockYahooFinance.chart).toHaveBeenCalledWith(
                'EURUSD=X',
                expect.objectContaining({
                    interval: '1d'
                })
            );

            // EURUSD=X = 1.10 means 1 EUR = 1.10 USD, so 1 USD = 1/1.10 = 0.909 EUR
            expect(result.exchangeRateCurrencyToEur).toBeCloseTo(1 / 1.10, 3);
            expect(result.currency).toBe('USD');
        });

        test('should fall back to secondary ticker if primary fails', async () => {
            mockYahooFinance.chart
                .mockRejectedValueOnce(new Error('Ticker not found'))
                .mockResolvedValueOnce({
                    quotes: [
                        { date: new Date('2024-01-15'), close: 0.92 }
                    ]
                });

            const result = await service.getExchangeRate('USD', testDate);

            expect(mockYahooFinance.chart).toHaveBeenCalledTimes(2);
            expect(mockYahooFinance.chart).toHaveBeenNthCalledWith(1, 'EURUSD=X', expect.any(Object));
            expect(mockYahooFinance.chart).toHaveBeenNthCalledWith(2, 'USDEUR=X', expect.any(Object));

            // USDEUR=X = 0.92 means 1 USD = 0.92 EUR (direct)
            expect(result.exchangeRateCurrencyToEur).toBe(0.92);
        });

        test('should use quote endpoint as fallback when chart has no data', async () => {
            mockYahooFinance.chart.mockResolvedValueOnce({ quotes: [] });
            mockYahooFinance.quote.mockResolvedValueOnce({
                regularMarketPrice: 1.08,
                regularMarketTime: new Date('2024-01-15')
            });

            const result = await service.getExchangeRate('USD', testDate);

            expect(mockYahooFinance.quote).toHaveBeenCalledWith('EURUSD=X');
            expect(result.exchangeRateCurrencyToEur).toBeCloseTo(1 / 1.08, 3);
        });

        test('should use search fallback as last resort', async () => {
            // Primary and secondary fail
            mockYahooFinance.chart
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null);

            // Search finds a ticker
            mockYahooFinance.search.mockResolvedValueOnce({
                quotes: [
                    { symbol: 'USD=X' }
                ]
            });

            // The searched ticker returns data
            mockYahooFinance.chart.mockResolvedValueOnce({
                quotes: [
                    { date: new Date('2024-01-15'), close: 0.91 }
                ]
            });

            const result = await service.getExchangeRate('USD', testDate);

            expect(mockYahooFinance.search).toHaveBeenCalledWith('USD');
            expect(result.exchangeRateCurrencyToEur).toBe(0.91);
        });

        test('should throw error if no exchange rate can be found', async () => {
            mockYahooFinance.chart.mockResolvedValue(null);
            mockYahooFinance.quote.mockResolvedValue(null);
            mockYahooFinance.search.mockResolvedValue({ quotes: [] });

            await expect(service.getExchangeRate('XXX', testDate))
                .rejects.toThrow('Could not determine exchange rate for XXX -> EUR');
        });
    });

    describe('_findBestPriceData', () => {
        test('should find price on exact target date', () => {
            const quotes = [
                { date: new Date('2024-01-13'), close: 1.08 },
                { date: new Date('2024-01-14'), close: 1.09 },
                { date: new Date('2024-01-15'), close: 1.10 },
                { date: new Date('2024-01-16'), close: 1.11 }
            ];

            const result = service._findBestPriceData(quotes, new Date('2024-01-15'));

            expect(result.close).toBe(1.10);
            expect(result.date).toEqual(new Date('2024-01-15'));
        });

        test('should find most recent price before target date', () => {
            const quotes = [
                { date: new Date('2024-01-13'), close: 1.08 },
                { date: new Date('2024-01-14'), close: 1.09 },
                { date: new Date('2024-01-17'), close: 1.11 }
            ];

            const result = service._findBestPriceData(quotes, new Date('2024-01-15'));

            expect(result.close).toBe(1.09);
            expect(result.date).toEqual(new Date('2024-01-14'));
        });

        test('should fall back to any available quote if none before target', () => {
            const quotes = [
                { date: new Date('2024-01-17'), close: 1.11 },
                { date: new Date('2024-01-18'), close: 1.12 }
            ];

            const result = service._findBestPriceData(quotes, new Date('2024-01-15'));

            expect(result.close).toBe(1.11);
        });

        test('should skip quotes with null close prices', () => {
            const quotes = [
                { date: new Date('2024-01-14'), close: null },
                { date: new Date('2024-01-15'), close: 1.10 }
            ];

            const result = service._findBestPriceData(quotes, new Date('2024-01-15'));

            expect(result.close).toBe(1.10);
        });

        test('should return null if no valid quotes', () => {
            expect(service._findBestPriceData([], testDate)).toBeNull();
            expect(service._findBestPriceData(null, testDate)).toBeNull();
            expect(service._findBestPriceData([{ date: new Date(), close: null }], testDate)).toBeNull();
        });
    });

    describe('_calculateExchangeRate', () => {
        test('should return raw value when not inverting', () => {
            expect(service._calculateExchangeRate(1.10, false)).toBe(1.10);
            expect(service._calculateExchangeRate(0.92, false)).toBe(0.92);
        });

        test('should invert value when inverting', () => {
            expect(service._calculateExchangeRate(1.10, true)).toBeCloseTo(0.909, 3);
            expect(service._calculateExchangeRate(2.0, true)).toBe(0.5);
        });

        test('should return null when inverting zero', () => {
            expect(service._calculateExchangeRate(0, true)).toBeNull();
        });

        test('should return zero when not inverting zero', () => {
            expect(service._calculateExchangeRate(0, false)).toBe(0);
        });
    });

    describe('_tryChartData', () => {
        test('should successfully fetch and process chart data', async () => {
            const mockChartData = {
                quotes: [
                    { date: new Date('2024-01-15'), close: 1.10 }
                ]
            };

            mockYahooFinance.chart.mockResolvedValueOnce(mockChartData);

            const result = await service._tryChartData(
                'EURUSD=X',
                true,
                new Date('2024-01-10'),
                new Date('2024-01-16'),
                testDate,
                'USD'
            );

            expect(result).not.toBeNull();
            expect(result.exchangeRateCurrencyToEur).toBeCloseTo(1 / 1.10, 3);
            expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Found rate'));
        });

        test('should return null if chart is empty', async () => {
            mockYahooFinance.chart.mockResolvedValueOnce({ quotes: [] });

            const result = await service._tryChartData(
                'EURUSD=X',
                true,
                new Date('2024-01-10'),
                new Date('2024-01-16'),
                testDate,
                'USD'
            );

            expect(result).toBeNull();
        });

        test('should return null if price is zero and needs inversion', async () => {
            mockYahooFinance.chart.mockResolvedValueOnce({
                quotes: [
                    { date: new Date('2024-01-15'), close: 0 }
                ]
            });

            const result = await service._tryChartData(
                'EURUSD=X',
                true,
                new Date('2024-01-10'),
                new Date('2024-01-16'),
                testDate,
                'USD'
            );

            expect(result).toBeNull();
        });
    });

    describe('_tryQuoteFallback', () => {
        test('should successfully fetch quote with regularMarketPrice', async () => {
            mockYahooFinance.quote.mockResolvedValueOnce({
                regularMarketPrice: 1.10,
                regularMarketTime: new Date('2024-01-15')
            });

            const result = await service._tryQuoteFallback('EURUSD=X', true, testDate, 'USD');

            expect(result).not.toBeNull();
            expect(result.exchangeRateCurrencyToEur).toBeCloseTo(1 / 1.10, 3);
        });

        test('should fall back to price field if regularMarketPrice is missing', async () => {
            mockYahooFinance.quote.mockResolvedValueOnce({
                price: 1.09,
                regularMarketTime: new Date('2024-01-15')
            });

            const result = await service._tryQuoteFallback('EURUSD=X', true, testDate, 'USD');

            expect(result.exchangeRateCurrencyToEur).toBeCloseTo(1 / 1.09, 3);
        });

        test('should fall back to bid if price and regularMarketPrice missing', async () => {
            mockYahooFinance.quote.mockResolvedValueOnce({
                bid: 1.08,
                postMarketTime: new Date('2024-01-15')
            });

            const result = await service._tryQuoteFallback('EURUSD=X', true, testDate, 'USD');

            expect(result.exchangeRateCurrencyToEur).toBeCloseTo(1 / 1.08, 3);
        });

        test('should fall back to ask if all other price fields missing', async () => {
            mockYahooFinance.quote.mockResolvedValueOnce({
                ask: 1.11
            });

            const result = await service._tryQuoteFallback('EURUSD=X', true, testDate, 'USD');

            expect(result.exchangeRateCurrencyToEur).toBeCloseTo(1 / 1.11, 3);
        });

        test('should return null if no price fields available', async () => {
            mockYahooFinance.quote.mockResolvedValueOnce({
                regularMarketTime: new Date('2024-01-15')
            });

            const result = await service._tryQuoteFallback('EURUSD=X', true, testDate, 'USD');

            expect(result).toBeNull();
        });

        test('should return null if quote is null', async () => {
            mockYahooFinance.quote.mockResolvedValueOnce(null);

            const result = await service._tryQuoteFallback('EURUSD=X', true, testDate, 'USD');

            expect(result).toBeNull();
        });
    });

    describe('_trySearchFallback', () => {
        test('should search and try found tickers', async () => {
            mockYahooFinance.search.mockResolvedValueOnce({
                quotes: [
                    { symbol: 'GBP=X' }
                ]
            });

            mockYahooFinance.chart.mockResolvedValueOnce({
                quotes: [
                    { date: new Date('2024-01-15'), close: 0.86 }
                ]
            });

            const result = await service._trySearchFallback(
                'GBP',
                new Date('2024-01-10'),
                new Date('2024-01-16'),
                testDate
            );

            expect(result).not.toBeNull();
            expect(result.exchangeRateCurrencyToEur).toBe(0.86);
        });

        test('should try inverted orientation if normal fails', async () => {
            mockYahooFinance.search.mockResolvedValueOnce({
                quotes: [
                    { symbol: 'EURGBP=X' }
                ]
            });

            // First try (normal) fails
            mockYahooFinance.chart.mockResolvedValueOnce(null);

            // Second try (inverted) succeeds
            mockYahooFinance.chart.mockResolvedValueOnce({
                quotes: [
                    { date: new Date('2024-01-15'), close: 1.16 }
                ]
            });

            const result = await service._trySearchFallback(
                'GBP',
                new Date('2024-01-10'),
                new Date('2024-01-16'),
                testDate
            );

            expect(result).not.toBeNull();
            expect(mockYahooFinance.chart).toHaveBeenCalledTimes(2);
        });

        test('should return null if search returns no results', async () => {
            mockYahooFinance.search.mockResolvedValueOnce({ quotes: [] });

            const result = await service._trySearchFallback(
                'XXX',
                new Date('2024-01-10'),
                new Date('2024-01-16'),
                testDate
            );

            expect(result).toBeNull();
        });

        test('should handle search errors gracefully', async () => {
            mockYahooFinance.search.mockRejectedValueOnce(new Error('Search failed'));

            const result = await service._trySearchFallback(
                'USD',
                new Date('2024-01-10'),
                new Date('2024-01-16'),
                testDate
            );

            expect(result).toBeNull();
            expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Search fallback failed'));
        });
    });

    describe('Integration scenarios', () => {
        test('should handle GBP to EUR conversion with primary ticker', async () => {
            mockYahooFinance.chart.mockResolvedValueOnce({
                quotes: [
                    { date: new Date('2024-01-15'), close: 0.86 }
                ]
            });

            const result = await service.getExchangeRate('GBP', testDate);

            expect(result.currency).toBe('GBP');
            // EURGBP=X = 0.86 means 1 EUR = 0.86 GBP, so 1 GBP = 1/0.86 EUR
            expect(result.exchangeRateCurrencyToEur).toBeCloseTo(1 / 0.86, 3);
        });

        test('should handle date ranges correctly', async () => {
            const targetDate = new Date('2024-01-15');

            mockYahooFinance.chart.mockResolvedValueOnce({
                quotes: [
                    { date: new Date('2024-01-15'), close: 1.10 }
                ]
            });

            await service.getExchangeRate('USD', targetDate);

            const chartCall = mockYahooFinance.chart.mock.calls[0];
            const options = chartCall[1];

            // Should fetch 7 days before and 1 day after
            const expectedStart = new Date('2024-01-08');
            const expectedEnd = new Date('2024-01-16');

            expect(options.period1.toDateString()).toBe(expectedStart.toDateString());
            expect(options.period2.toDateString()).toBe(expectedEnd.toDateString());
        });

        test('should properly normalize currency code to uppercase', async () => {
            mockYahooFinance.chart.mockResolvedValueOnce({
                quotes: [
                    { date: new Date('2024-01-15'), close: 1.10 }
                ]
            });

            const result = await service.getExchangeRate('usd', testDate);

            expect(result.currency).toBe('USD');
            expect(mockYahooFinance.chart).toHaveBeenCalledWith('EURUSD=X', expect.any(Object));
        });
    });
});
