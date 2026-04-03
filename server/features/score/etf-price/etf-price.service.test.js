import { jest } from '@jest/globals';
import { describe, expect, beforeEach, it } from '@jest/globals';

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
    search: jest.fn(),
    chart: jest.fn(),
    quote: jest.fn()
};

jest.unstable_mockModule('yahoo-finance2', () => ({
    default: jest.fn(() => mockYahooFinance)
}));

// Mock the repository so tests never touch the real DB
const mockEtfPriceRepository = {
    find: jest.fn().mockReturnValue(null),
    save: jest.fn()
};

jest.unstable_mockModule('./etf-price.repository.js', () => ({
    default: jest.fn(() => mockEtfPriceRepository)
}));

// Now import the service after mocks are set up
const { default: EtfPriceService } = await import('./etf-price.service.js');

describe('EtfPriceService', () => {
    let service;

    beforeEach(() => {
        service = new EtfPriceService();
        service.yahooFinance = mockYahooFinance;
        jest.clearAllMocks();
    });

    describe('getPrice', () => {
        it('should fetch historical price for valid ISIN and date', async () => {
            const isin = 'IE00BK5BQX27';
            const date = new Date('2024-01-15');
            const ticker = 'VWCE.DE';

            mockYahooFinance.search.mockResolvedValue({
                quotes: [{ symbol: ticker }]
            });

            mockYahooFinance.chart.mockResolvedValue({
                meta: { currency: 'EUR' },
                quotes: [
                    { date: new Date('2024-01-15'), close: 105.50 }
                ]
            });

            const result = await service.getPrice(isin, date);

            expect(result).toEqual({
                isin: isin,
                ticker: ticker,
                currency: 'EUR',
                requestDate: date,
                resultDate: new Date('2024-01-15'),
                price: 105.50
            });

            expect(mockYahooFinance.search).toHaveBeenCalledWith(isin);
            expect(mockYahooFinance.chart).toHaveBeenCalled();
        });

        it('should throw if isin is missing', async () => {
            await expect(service.getPrice('', new Date('2024-01-15')))
                .rejects.toThrow('isin is required');
        });

        it('should throw if date is invalid', async () => {
            await expect(service.getPrice('IE00BK5BQX27', 'not-a-date'))
                .rejects.toThrow('Invalid date provided');
        });

        it('should prefer European exchange tickers', async () => {
            const isin = 'IE00BK5BQX27';
            const date = new Date('2024-01-15');

            mockYahooFinance.search.mockResolvedValue({
                quotes: [
                    { symbol: 'VWCE.L' },
                    { symbol: 'VWCE.DE' },
                    { symbol: 'VWCE.US' }
                ]
            });

            mockYahooFinance.chart.mockResolvedValue({
                meta: { currency: 'EUR' },
                quotes: [
                    { date: new Date('2024-01-15'), close: 105.50 }
                ]
            });

            const result = await service.getPrice(isin, date);

            expect(result.ticker).toBe('VWCE.DE');
        });

        it('should handle missing ticker symbol', async () => {
            const isin = 'INVALID123';
            const date = new Date('2024-01-15');

            mockYahooFinance.search.mockResolvedValue({
                quotes: []
            });

            await expect(service.getPrice(isin, date)).rejects.toThrow(
                `Could not find ticker symbol for ISIN: ${isin}`
            );
        });

        it('should handle missing price data', async () => {
            const isin = 'IE00BK5BQX27';
            const date = new Date('2024-01-15');
            const ticker = 'VWCE.DE';

            mockYahooFinance.search.mockResolvedValue({
                quotes: [{ symbol: ticker }]
            });

            mockYahooFinance.chart.mockResolvedValue({
                meta: { currency: 'EUR' },
                quotes: []
            });

            await expect(service.getPrice(isin, date)).rejects.toThrow(
                `No price data found for ${ticker}`
            );
        });

        it('should find closest price before target date', async () => {
            const isin = 'IE00BK5BQX27';
            const date = new Date('2024-01-15');
            const ticker = 'VWCE.DE';

            mockYahooFinance.search.mockResolvedValue({
                quotes: [{ symbol: ticker }]
            });

            mockYahooFinance.chart.mockResolvedValue({
                meta: { currency: 'EUR' },
                quotes: [
                    { date: new Date('2024-01-12'), close: 104.00 },
                    { date: new Date('2024-01-13'), close: 104.50 },
                    { date: new Date('2024-01-14'), close: 105.00 }, // Weekend before target
                    { date: new Date('2024-01-16'), close: 106.00 }  // After target
                ]
            });

            const result = await service.getPrice(isin, date);

            expect(result.resultDate).toEqual(new Date('2024-01-14'));
            expect(result.price).toBe(105.00);
        });

        it('should handle quotes with null close values', async () => {
            const isin = 'IE00BK5BQX27';
            const date = new Date('2024-01-15');
            const ticker = 'VWCE.DE';

            mockYahooFinance.search.mockResolvedValue({
                quotes: [{ symbol: ticker }]
            });

            mockYahooFinance.chart.mockResolvedValue({
                meta: { currency: 'EUR' },
                quotes: [
                    { date: new Date('2024-01-14'), close: null },
                    { date: new Date('2024-01-15'), close: 105.50 }
                ]
            });

            const result = await service.getPrice(isin, date);

            expect(result.price).toBe(105.50);
        });

        it('should handle missing currency information', async () => {
            const isin = 'IE00BK5BQX27';
            const date = new Date('2024-01-15');
            const ticker = 'VWCE.DE';

            mockYahooFinance.search.mockResolvedValue({
                quotes: [{ symbol: ticker }]
            });

            mockYahooFinance.chart.mockResolvedValue({
                meta: {},
                quotes: [
                    { date: new Date('2024-01-15'), close: 105.50 }
                ]
            });

            const result = await service.getPrice(isin, date);

            expect(result.currency).toBeNull();
            expect(result.price).toBe(105.50);
        });
    });

    describe('getCurrentPrice', () => {
        it('should fetch current price for valid ISIN', async () => {
            const isin = 'IE00BK5BQX27';
            const ticker = 'VWCE.DE';
            const currentTime = new Date();

            mockYahooFinance.search.mockResolvedValue({
                quotes: [{ symbol: ticker }]
            });

            mockYahooFinance.quote.mockResolvedValue({
                regularMarketPrice: 107.25,
                currency: 'EUR',
                regularMarketTime: currentTime
            });

            const result = await service.getCurrentPrice(isin);

            expect(result).toEqual({
                isin: isin,
                ticker: ticker,
                currency: 'EUR',
                requestDate: expect.any(Date),
                resultDate: currentTime,
                price: 107.25
            });

            expect(mockYahooFinance.search).toHaveBeenCalledWith(isin);
            expect(mockYahooFinance.quote).toHaveBeenCalledWith(ticker);
        });

        it('should throw if isin is missing', async () => {
            await expect(service.getCurrentPrice(''))
                .rejects.toThrow('isin is required');
        });

        it('should handle missing ticker symbol', async () => {
            const isin = 'INVALID123';

            mockYahooFinance.search.mockResolvedValue({
                quotes: []
            });

            await expect(service.getCurrentPrice(isin)).rejects.toThrow(
                `Could not find ticker symbol for ISIN: ${isin}`
            );
        });

        it('should fallback to alternative price fields', async () => {
            const isin = 'IE00BK5BQX27';
            const ticker = 'VWCE.DE';

            mockYahooFinance.search.mockResolvedValue({
                quotes: [{ symbol: ticker }]
            });

            mockYahooFinance.quote.mockResolvedValue({
                price: 107.25,
                currency: 'EUR',
                postMarketTime: new Date()
            });

            const result = await service.getCurrentPrice(isin);

            expect(result.price).toBe(107.25);
        });

        it('should use bid price as fallback', async () => {
            const isin = 'IE00BK5BQX27';
            const ticker = 'VWCE.DE';

            mockYahooFinance.search.mockResolvedValue({
                quotes: [{ symbol: ticker }]
            });

            mockYahooFinance.quote.mockResolvedValue({
                bid: 107.20,
                ask: 107.30,
                currency: 'EUR'
            });

            const result = await service.getCurrentPrice(isin);

            expect(result.price).toBe(107.20);
        });

        it('should handle missing price data', async () => {
            const isin = 'IE00BK5BQX27';
            const ticker = 'VWCE.DE';

            mockYahooFinance.search.mockResolvedValue({
                quotes: [{ symbol: ticker }]
            });

            mockYahooFinance.quote.mockResolvedValue({
                currency: 'EUR'
            });

            await expect(service.getCurrentPrice(isin)).rejects.toThrow(
                `No price data available for ticker ${ticker}`
            );
        });

        it('should handle missing currency information', async () => {
            const isin = 'IE00BK5BQX27';
            const ticker = 'VWCE.DE';

            mockYahooFinance.search.mockResolvedValue({
                quotes: [{ symbol: ticker }]
            });

            mockYahooFinance.quote.mockResolvedValue({
                regularMarketPrice: 107.25
            });

            const result = await service.getCurrentPrice(isin);

            expect(result.currency).toBeNull();
            expect(result.price).toBe(107.25);
        });
    });

    describe('_searchTickerByIsin', () => {
        it('should return European exchange ticker when available', async () => {
            const isin = 'IE00BK5BQX27';

            mockYahooFinance.search.mockResolvedValue({
                quotes: [
                    { symbol: 'VWCE.L' },
                    { symbol: 'VWCE.AS' },
                    { symbol: 'VWCE.US' }
                ]
            });

            const ticker = await service._searchTickerByIsin(isin);

            expect(ticker).toBe('VWCE.AS');
        });

        it('should prefer .DE exchange', async () => {
            const isin = 'IE00BK5BQX27';

            mockYahooFinance.search.mockResolvedValue({
                quotes: [
                    { symbol: 'VWCE.L' },
                    { symbol: 'VWCE.DE' },
                    { symbol: 'VWCE.AS' }
                ]
            });

            const ticker = await service._searchTickerByIsin(isin);

            expect(ticker).toBe('VWCE.DE');
        });

        it('should return first ticker when no European exchange found', async () => {
            const isin = 'US1234567890';

            mockYahooFinance.search.mockResolvedValue({
                quotes: [
                    { symbol: 'ABC' },
                    { symbol: 'XYZ' }
                ]
            });

            const ticker = await service._searchTickerByIsin(isin);

            expect(ticker).toBe('ABC');
        });

        it('should return null when no results found', async () => {
            const isin = 'INVALID123';

            mockYahooFinance.search.mockResolvedValue({
                quotes: []
            });

            const ticker = await service._searchTickerByIsin(isin);

            expect(ticker).toBeNull();
        });

        it('should handle search errors gracefully', async () => {
            const isin = 'IE00BK5BQX27';

            mockYahooFinance.search.mockRejectedValue(new Error('Network error'));

            const ticker = await service._searchTickerByIsin(isin);

            expect(ticker).toBeNull();
            expect(mockLogger.error).toHaveBeenCalledWith(
                expect.stringContaining(`Failed to search ticker for ISIN ${isin}: Network error`)
            );
        });

        it('should cache the resolved ticker and not call search again', async () => {
            const isin = 'IE00BK5BQX27';

            mockYahooFinance.search.mockResolvedValue({
                quotes: [{ symbol: 'VWCE.DE' }]
            });

            const first = await service._searchTickerByIsin(isin);
            const second = await service._searchTickerByIsin(isin);

            expect(first).toBe('VWCE.DE');
            expect(second).toBe('VWCE.DE');
            expect(mockYahooFinance.search).toHaveBeenCalledTimes(1);
        });

        it('should cache ticker across getPrice and getCurrentPrice calls', async () => {
            const isin = 'IE00BK5BQX27';

            mockYahooFinance.search.mockResolvedValue({
                quotes: [{ symbol: 'VWCE.DE' }]
            });
            mockYahooFinance.chart.mockResolvedValue({
                meta: { currency: 'EUR' },
                quotes: [{ date: new Date('2024-01-15'), close: 105.50 }]
            });
            mockYahooFinance.quote.mockResolvedValue({
                regularMarketPrice: 107.25,
                currency: 'EUR',
                regularMarketTime: new Date()
            });

            await service.getPrice(isin, new Date('2024-01-15'));
            await service.getCurrentPrice(isin);

            // search should only have been called once despite two price fetches
            expect(mockYahooFinance.search).toHaveBeenCalledTimes(1);
        });
    });

    describe('_findBestPriceData', () => {
        it('should find exact date match', () => {
            const quotes = [
                { date: new Date('2024-01-13'), close: 104.50 },
                { date: new Date('2024-01-14'), close: 105.00 },
                { date: new Date('2024-01-15'), close: 105.50 }
            ];
            const targetDate = new Date('2024-01-15');

            const result = service._findBestPriceData(quotes, targetDate);

            expect(result.close).toBe(105.50);
            expect(result.date).toEqual(new Date('2024-01-15'));
        });

        it('should find most recent date before target', () => {
            const quotes = [
                { date: new Date('2024-01-13'), close: 104.50 },
                { date: new Date('2024-01-14'), close: 105.00 },
                { date: new Date('2024-01-16'), close: 106.00 }
            ];
            const targetDate = new Date('2024-01-15');

            const result = service._findBestPriceData(quotes, targetDate);

            expect(result.close).toBe(105.00);
            expect(result.date).toEqual(new Date('2024-01-14'));
        });

        it('should skip quotes with null close values', () => {
            const quotes = [
                { date: new Date('2024-01-14'), close: null },
                { date: new Date('2024-01-13'), close: 104.50 }
            ];
            const targetDate = new Date('2024-01-15');

            const result = service._findBestPriceData(quotes, targetDate);

            expect(result.close).toBe(104.50);
        });

        it('should skip quotes with NaN close values', () => {
            const quotes = [
                { date: new Date('2024-01-14'), close: NaN },
                { date: new Date('2024-01-13'), close: 104.50 }
            ];
            const targetDate = new Date('2024-01-15');

            const result = service._findBestPriceData(quotes, targetDate);

            expect(result.close).toBe(104.50);
        });

        it('should skip quotes with zero or negative close values', () => {
            const quotes = [
                { date: new Date('2024-01-15'), close: 0 },
                { date: new Date('2024-01-14'), close: -5 },
                { date: new Date('2024-01-13'), close: 104.50 }
            ];
            const targetDate = new Date('2024-01-15');

            const result = service._findBestPriceData(quotes, targetDate);

            expect(result.close).toBe(104.50);
        });

        it('should return null for empty quotes', () => {
            const result = service._findBestPriceData([], new Date());

            expect(result).toBeNull();
        });

        it('should return null when all close values are invalid', () => {
            const quotes = [
                { date: new Date('2024-01-15'), close: null },
                { date: new Date('2024-01-14'), close: NaN },
                { date: new Date('2024-01-13'), close: 0 }
            ];

            const result = service._findBestPriceData(quotes, new Date('2024-01-15'));

            expect(result).toBeNull();
        });

        it('should fallback to any available quote when no match found before target', () => {
            const quotes = [
                { date: new Date('2024-01-20'), close: 106.00 },
                { date: new Date('2024-01-21'), close: 107.00 }
            ];
            const targetDate = new Date('2024-01-15');

            const result = service._findBestPriceData(quotes, targetDate);

            expect(result.close).toBe(106.00);
        });
    });
});
