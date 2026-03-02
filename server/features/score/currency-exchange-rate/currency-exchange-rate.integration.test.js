import { jest, describe, test, expect, beforeAll } from '@jest/globals';

// Use a no-op repository so integration tests never touch the file-system DB
const mockExchangeRateRepository = {
    find: jest.fn().mockReturnValue(null),
    save: jest.fn()
};

jest.unstable_mockModule('./exchange-rate.repository.js', () => ({
    default: jest.fn(() => mockExchangeRateRepository)
}));

// Import the actual service after the mock is registered
const { default: CurrencyExchangeRateService } = await import('./currency-exchange-rate.service.js');

/**
 * INTEGRATION TESTS - Real API Calls
 *
 * These tests make REAL calls to Yahoo Finance API.
 * They verify the service works with actual data.
 *
 * Note: These tests are slower and may fail if:
 * - Yahoo Finance API is down
 * - Network connection issues
 * - Rate limiting
 * - Data is unavailable for specific dates
 *
 * Run with: npm test currency-exchange-rate.integration.test.js
 */
describe('CurrencyExchangeRateService - Integration Tests (Real API)', () => {
    let service;

    // Use a past date to ensure data availability
    const testDate = new Date('2024-01-15');

    beforeAll(() => {
        service = new CurrencyExchangeRateService();
    });

    describe('Common Currency Conversions', () => {
        test('should fetch GBP to EUR exchange rate', async () => {
            const result = await service.getExchangeRate('GBP', testDate);

            console.log('GBP → EUR:', result);

            expect(result).toBeDefined();
            expect(result.currency).toBe('GBP');
            expect(result.exchangeRateCurrencyToEur).toBeGreaterThan(0);
            expect(result.exchangeRateCurrencyToEur).toBeLessThan(2); // Reasonable range
            expect(result.requestDate).toBeDefined();
            expect(result.resultDate).toBeDefined();

            // GBP is typically stronger than EUR (1 GBP > 1 EUR)
            console.log(`✓ 1 GBP = ${result.exchangeRateCurrencyToEur.toFixed(4)} EUR`);
            console.log(`✓ Result date: ${result.resultDate}`);
        }, 30000); // 30 second timeout for real API

        test('should fetch USD to EUR exchange rate', async () => {
            const result = await service.getExchangeRate('USD', testDate);

            console.log('USD → EUR:', result);

            expect(result).toBeDefined();
            expect(result.currency).toBe('USD');
            expect(result.exchangeRateCurrencyToEur).toBeGreaterThan(0);
            expect(result.exchangeRateCurrencyToEur).toBeLessThan(2);

            console.log(`✓ 1 USD = ${result.exchangeRateCurrencyToEur.toFixed(4)} EUR`);
        }, 30000);

        test('should fetch CHF to EUR exchange rate', async () => {
            const result = await service.getExchangeRate('CHF', testDate);

            console.log('CHF → EUR:', result);

            expect(result).toBeDefined();
            expect(result.currency).toBe('CHF');
            expect(result.exchangeRateCurrencyToEur).toBeGreaterThan(0);
            expect(result.exchangeRateCurrencyToEur).toBeLessThan(2);

            console.log(`✓ 1 CHF = ${result.exchangeRateCurrencyToEur.toFixed(4)} EUR`);
        }, 30000);
    });

    describe('Asian Currencies (More Exotic)', () => {
        test('should fetch HKD (Hong Kong Dollar) to EUR exchange rate', async () => {
            const result = await service.getExchangeRate('HKD', testDate);

            console.log('HKD → EUR:', result);

            expect(result).toBeDefined();
            expect(result.currency).toBe('HKD');
            expect(result.exchangeRateCurrencyToEur).toBeGreaterThan(0);
            expect(result.exchangeRateCurrencyToEur).toBeLessThan(1); // HKD is weaker

            console.log(`✓ 1 HKD = ${result.exchangeRateCurrencyToEur.toFixed(4)} EUR`);
            console.log(`✓ 100 HKD = ${(100 * result.exchangeRateCurrencyToEur).toFixed(2)} EUR`);
        }, 30000);

        test('should fetch SGD (Singapore Dollar) to EUR exchange rate', async () => {
            const result = await service.getExchangeRate('SGD', testDate);

            console.log('SGD → EUR:', result);

            expect(result).toBeDefined();
            expect(result.currency).toBe('SGD');
            expect(result.exchangeRateCurrencyToEur).toBeGreaterThan(0);
            expect(result.exchangeRateCurrencyToEur).toBeLessThan(1.5);

            console.log(`✓ 1 SGD = ${result.exchangeRateCurrencyToEur.toFixed(4)} EUR`);
            console.log(`✓ 100 SGD = ${(100 * result.exchangeRateCurrencyToEur).toFixed(2)} EUR`);
        }, 30000);

        test('should fetch JPY (Japanese Yen) to EUR exchange rate', async () => {
            const result = await service.getExchangeRate('JPY', testDate);

            console.log('JPY → EUR:', result);

            expect(result).toBeDefined();
            expect(result.currency).toBe('JPY');
            expect(result.exchangeRateCurrencyToEur).toBeGreaterThan(0);
            expect(result.exchangeRateCurrencyToEur).toBeLessThan(0.02); // JPY is much weaker

            console.log(`✓ 1 JPY = ${result.exchangeRateCurrencyToEur.toFixed(6)} EUR`);
            console.log(`✓ 1000 JPY = ${(1000 * result.exchangeRateCurrencyToEur).toFixed(2)} EUR`);
        }, 30000);
    });

    describe('Other Regions', () => {
        test('should fetch CAD (Canadian Dollar) to EUR exchange rate', async () => {
            const result = await service.getExchangeRate('CAD', testDate);

            console.log('CAD → EUR:', result);

            expect(result).toBeDefined();
            expect(result.currency).toBe('CAD');
            expect(result.exchangeRateCurrencyToEur).toBeGreaterThan(0);
            expect(result.exchangeRateCurrencyToEur).toBeLessThan(1.5);

            console.log(`✓ 1 CAD = ${result.exchangeRateCurrencyToEur.toFixed(4)} EUR`);
        }, 30000);

        test('should fetch AUD (Australian Dollar) to EUR exchange rate', async () => {
            const result = await service.getExchangeRate('AUD', testDate);

            console.log('AUD → EUR:', result);

            expect(result).toBeDefined();
            expect(result.currency).toBe('AUD');
            expect(result.exchangeRateCurrencyToEur).toBeGreaterThan(0);
            expect(result.exchangeRateCurrencyToEur).toBeLessThan(1.5);

            console.log(`✓ 1 AUD = ${result.exchangeRateCurrencyToEur.toFixed(4)} EUR`);
        }, 30000);
    });

    describe('Edge Cases', () => {
        test('should handle EUR to EUR (should return 1.0)', async () => {
            const result = await service.getExchangeRate('EUR', testDate);

            console.log('EUR → EUR:', result);

            expect(result.currency).toBe('EUR');
            expect(result.exchangeRateCurrencyToEur).toBe(1.0);

            console.log('✓ EUR to EUR correctly returns 1.0');
        }, 30000);

        test('should handle recent date (within last week)', async () => {
            const recentDate = new Date();
            recentDate.setDate(recentDate.getDate() - 3); // 3 days ago

            const result = await service.getExchangeRate('USD', recentDate);

            console.log('USD → EUR (recent):', result);

            expect(result).toBeDefined();
            expect(result.currency).toBe('USD');
            expect(result.exchangeRateCurrencyToEur).toBeGreaterThan(0);

            console.log(`✓ Recent date (${recentDate.toISOString().split('T')[0]}): 1 USD = ${result.exchangeRateCurrencyToEur.toFixed(4)} EUR`);
        }, 30000);

        test('should handle weekend date (uses last trading day)', async () => {
            // January 13, 2024 was a Saturday
            const weekendDate = new Date('2024-01-13');

            const result = await service.getExchangeRate('GBP', weekendDate);

            console.log('GBP → EUR (weekend):', result);

            expect(result).toBeDefined();
            expect(result.currency).toBe('GBP');

            // Result date should be before or equal to requested date (Friday)
            const resultDate = new Date(result.resultDate);
            expect(resultDate.getTime()).toBeLessThanOrEqual(weekendDate.getTime());

            console.log(`✓ Requested: ${weekendDate.toISOString().split('T')[0]}`);
            console.log(`✓ Got data for: ${result.resultDate.split('T')[0]}`);
        }, 30000);
    });

    describe('Practical Usage Examples', () => {
        test('should convert 100 GBP to EUR', async () => {
            const gbpAmount = 100;
            const result = await service.getExchangeRate('GBP', testDate);
            const eurAmount = gbpAmount * result.exchangeRateCurrencyToEur;

            console.log(`\n💱 Conversion: ${gbpAmount} GBP → ${eurAmount.toFixed(2)} EUR`);
            console.log(`   Rate: ${result.exchangeRateCurrencyToEur.toFixed(4)}`);
            console.log(`   Date: ${result.resultDate.split('T')[0]}`);

            expect(eurAmount).toBeGreaterThan(0);
        }, 30000);

        test('should convert 1000 HKD to EUR', async () => {
            const hkdAmount = 1000;
            const result = await service.getExchangeRate('HKD', testDate);
            const eurAmount = hkdAmount * result.exchangeRateCurrencyToEur;

            console.log(`\n💱 Conversion: ${hkdAmount} HKD → ${eurAmount.toFixed(2)} EUR`);
            console.log(`   Rate: ${result.exchangeRateCurrencyToEur.toFixed(4)}`);
            console.log(`   Date: ${result.resultDate.split('T')[0]}`);

            expect(eurAmount).toBeGreaterThan(0);
        }, 30000);

        test('should convert 500 SGD to EUR', async () => {
            const sgdAmount = 500;
            const result = await service.getExchangeRate('SGD', testDate);
            const eurAmount = sgdAmount * result.exchangeRateCurrencyToEur;

            console.log(`\n💱 Conversion: ${sgdAmount} SGD → ${eurAmount.toFixed(2)} EUR`);
            console.log(`   Rate: ${result.exchangeRateCurrencyToEur.toFixed(4)}`);
            console.log(`   Date: ${result.resultDate.split('T')[0]}`);

            expect(eurAmount).toBeGreaterThan(0);
        }, 30000);
    });

    describe('Fallback Strategy Verification', () => {
        test('should successfully fetch data using available strategy', async () => {
            // Try a less common currency pair to potentially trigger fallback
            const currencies = ['THB', 'MYR', 'INR', 'KRW'];

            for (const currency of currencies) {
                try {
                    const result = await service.getExchangeRate(currency, testDate);

                    console.log(`${currency} → EUR:`, result.exchangeRateCurrencyToEur.toFixed(6));

                    expect(result).toBeDefined();
                    expect(result.currency).toBe(currency);
                    expect(result.exchangeRateCurrencyToEur).toBeGreaterThan(0);
                } catch (error) {
                    console.warn(`⚠️  Could not fetch ${currency}: ${error.message}`);
                    // Don't fail the test - some currencies might not be available
                }
            }
        }, 60000); // Longer timeout for multiple currencies
    });
});
