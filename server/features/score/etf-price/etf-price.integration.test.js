import { jest, describe, it, expect, beforeAll } from '@jest/globals';

// Use a no-op repository so integration tests never touch the file-system DB
const mockEtfPriceRepository = {
    find: jest.fn().mockReturnValue(null),
    save: jest.fn()
};

jest.unstable_mockModule('./etf-price.repository.js', () => ({
    default: jest.fn(() => mockEtfPriceRepository)
}));

const { default: EtfPriceService } = await import('./etf-price.service.js');

/**
 * Integration tests for EtfPriceService
 * These tests make real calls to Yahoo Finance API.
 * They may be slower and can fail if the API is unavailable or data changes.
 */
describe('EtfPriceService Integration Tests', () => {
    let service;

    beforeAll(() => {
        service = new EtfPriceService();
    });

    describe('getPrice - real API calls', () => {
        it('should fetch historical price for VWCE (popular European ETF)', async () => {
            const isin = 'IE00BK5BQX27'; // Vanguard FTSE All-World UCITS ETF
            const date = new Date('2024-01-15');

            const result = await service.getPrice(isin, date);

            expect(result).toBeDefined();
            expect(result.isin).toBe(isin);
            expect(result.ticker).toBeDefined();
            expect(result.currency).toBeDefined();
            expect(result.price).toBeGreaterThan(0);
            expect(result.requestDate).toEqual(date);
            expect(result.resultDate).toBeDefined();

            console.log('VWCE price result:', result);
        }, 15000);

        it('should fetch historical price for IWDA (popular European ETF)', async () => {
            const isin = 'IE00B4L5Y983'; // iShares Core MSCI World UCITS ETF
            const date = new Date('2023-06-15');

            const result = await service.getPrice(isin, date);

            expect(result).toBeDefined();
            expect(result.isin).toBe(isin);
            expect(result.ticker).toBeDefined();
            expect(result.currency).toBeDefined();
            expect(result.price).toBeGreaterThan(0);
            expect(result.requestDate).toEqual(date);

            console.log('IWDA price result:', result);
        }, 15000);

        it('should fetch historical price for SPY (US ETF)', async () => {
            const isin = 'US78462F1030'; // SPDR S&P 500 ETF Trust
            const date = new Date('2023-12-01');

            const result = await service.getPrice(isin, date);

            expect(result).toBeDefined();
            expect(result.isin).toBe(isin);
            expect(result.ticker).toBeDefined();
            expect(result.currency).toBe('USD');
            expect(result.price).toBeGreaterThan(0);
            expect(result.requestDate).toEqual(date);

            console.log('SPY price result:', result);
        }, 15000);

        it('should handle weekend dates by finding closest trading day', async () => {
            const isin = 'IE00BK5BQX27';
            const saturdayDate = new Date('2024-01-13'); // Saturday

            const result = await service.getPrice(isin, saturdayDate);

            expect(result).toBeDefined();
            expect(result.price).toBeGreaterThan(0);
            // Result date should be from a trading day (likely Friday before)
            expect(result.resultDate.getDay()).not.toBe(0); // Not Sunday
            expect(result.resultDate.getDay()).not.toBe(6); // Not Saturday

            console.log('Weekend date result:', result);
        }, 15000);

        it('should reject for invalid ISIN', async () => {
            const invalidIsin = 'INVALID_ISIN_123';
            const date = new Date('2024-01-15');

            await expect(service.getPrice(invalidIsin, date)).rejects.toThrow();
        }, 15000);
    });

    describe.skip('getCurrentPrice - real API calls (skipped due to Yahoo API limitations)', () => {
        // NOTE: These tests are skipped because Yahoo Finance's quote endpoint requires cookies
        // that are difficult to obtain programmatically. The chart endpoint works fine for historical data.

        it('should fetch current price for VWCE', async () => {
            const isin = 'IE00BK5BQX27';

            const result = await service.getCurrentPrice(isin);

            expect(result).toBeDefined();
            expect(result.isin).toBe(isin);
            expect(result.ticker).toBeDefined();
            expect(result.currency).toBeDefined();
            expect(result.price).toBeGreaterThan(0);
            expect(result.requestDate).toBeDefined();
            expect(result.resultDate).toBeDefined();

            console.log('VWCE current price result:', result);
        }, 15000);

        it('should fetch current price for IWDA', async () => {
            const isin = 'IE00B4L5Y983';

            const result = await service.getCurrentPrice(isin);

            expect(result).toBeDefined();
            expect(result.isin).toBe(isin);
            expect(result.price).toBeGreaterThan(0);

            console.log('IWDA current price result:', result);
        }, 15000);

        it('should fetch current price for GBP-denominated ETF', async () => {
            const isin = 'IE00B4L5Y983'; // IWDA also trades on LSE

            const result = await service.getCurrentPrice(isin);

            expect(result).toBeDefined();
            expect(result.price).toBeGreaterThan(0);
            expect(['EUR', 'GBP', 'USD']).toContain(result.currency);

            console.log('GBP ETF current price result:', result);
        }, 15000);

        it('should reject for invalid ISIN', async () => {
            const invalidIsin = 'INVALID_ISIN_123';

            await expect(service.getCurrentPrice(invalidIsin)).rejects.toThrow();
        }, 15000);
    });

    describe('Edge cases and special scenarios', () => {
        it('should handle very old dates', async () => {
            const isin = 'IE00BK5BQX27';
            const oldDate = new Date('2020-01-15');

            const result = await service.getPrice(isin, oldDate);

            expect(result).toBeDefined();
            expect(result.price).toBeGreaterThan(0);

            console.log('Old date result:', result);
        }, 15000);

        it('should prefer European exchanges for European ISINs', async () => {
            const isin = 'IE00BK5BQX27';
            const date = new Date('2024-01-15');

            const result = await service.getPrice(isin, date);

            // Should prefer exchanges like .DE, .AS, .PA, .MI
            expect(result.ticker).toMatch(/\.(DE|AS|PA|MI|L)/);

            console.log('European exchange preference result:', result);
        }, 15000);

        it('should handle different date formats', async () => {
            const isin = 'IE00BK5BQX27';
            const dateString = '2024-01-15';

            const result = await service.getPrice(isin, dateString);

            expect(result).toBeDefined();
            expect(result.price).toBeGreaterThan(0);

            console.log('Date string format result:', result);
        }, 15000);
    });
});
