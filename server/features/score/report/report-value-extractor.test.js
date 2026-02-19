import { jest } from '@jest/globals';
import { describe, test, expect } from '@jest/globals';
import ReportValueExtractor from './report-value-extractor.js';

describe('ReportValueExtractor', () => {
    describe('parseGermanDecimal', () => {
        test('should parse comma-separated decimal', () => {
            expect(ReportValueExtractor.parseGermanDecimal('1,4767')).toBeCloseTo(1.4767);
        });

        test('should parse zero', () => {
            expect(ReportValueExtractor.parseGermanDecimal('0,0')).toBe(0);
        });

        test('should parse integer without comma', () => {
            expect(ReportValueExtractor.parseGermanDecimal('42')).toBe(42);
        });

        test('should parse negative value', () => {
            expect(ReportValueExtractor.parseGermanDecimal('-3,14')).toBeCloseTo(-3.14);
        });

        test('should parse value with whitespace', () => {
            expect(ReportValueExtractor.parseGermanDecimal(' 1,23 ')).toBeCloseTo(1.23);
        });

        test('should return NaN for non-numeric input', () => {
            expect(ReportValueExtractor.parseGermanDecimal('abc')).toBeNaN();
        });
    });

    describe('isDeemedIncomeRow', () => {
        test('should return true when text contains 936', () => {
            expect(ReportValueExtractor.isDeemedIncomeRow(
                'Ausschüttungsgleiche Erträge 27,5% (Kennzahlen 936 oder 937)'
            )).toBe(true);
        });

        test('should return true when text contains 937', () => {
            expect(ReportValueExtractor.isDeemedIncomeRow('Kennzahl 937')).toBe(true);
        });

        test('should return false when text contains neither 936 nor 937', () => {
            expect(ReportValueExtractor.isDeemedIncomeRow('Some other row')).toBe(false);
        });

        test('should return false for empty string', () => {
            expect(ReportValueExtractor.isDeemedIncomeRow('')).toBe(false);
        });
    });

    describe('extractDeemedIncomeValue', () => {
        function createMockDetailRow(labelText, valueText) {
            return {
                $eval: jest.fn((selector, fn) => {
                    if (selector === 'td:first-child div') {
                        return Promise.resolve(fn({ textContent: labelText }));
                    }
                    if (selector === 'td:nth-child(2) div') {
                        return Promise.resolve(fn({ textContent: valueText }));
                    }
                    return Promise.resolve('');
                }),
            };
        }

        test('should extract value from row containing 936', async () => {
            const detailsTable = {
                $$: jest.fn().mockResolvedValue([
                    createMockDetailRow('Some label', '10,00'),
                    createMockDetailRow('Kennzahlen 936 oder 937', '1,4767'),
                ]),
            };

            const result = await ReportValueExtractor.extractDeemedIncomeValue(detailsTable);

            expect(result).toBeCloseTo(1.4767);
        });

        test('should extract value from row containing 937', async () => {
            const detailsTable = {
                $$: jest.fn().mockResolvedValue([
                    createMockDetailRow('Kennzahl 937', '0,8287'),
                ]),
            };

            const result = await ReportValueExtractor.extractDeemedIncomeValue(detailsTable);

            expect(result).toBeCloseTo(0.8287);
        });

        test('should return null when no deemed income row found', async () => {
            const detailsTable = {
                $$: jest.fn().mockResolvedValue([
                    createMockDetailRow('Something else', '10,00'),
                    createMockDetailRow('Another row', '20,00'),
                ]),
            };

            const result = await ReportValueExtractor.extractDeemedIncomeValue(detailsTable);

            expect(result).toBeNull();
        });

        test('should return null for empty table', async () => {
            const detailsTable = {
                $$: jest.fn().mockResolvedValue([]),
            };

            const result = await ReportValueExtractor.extractDeemedIncomeValue(detailsTable);

            expect(result).toBeNull();
        });

        test('should return first matching row when multiple match', async () => {
            const detailsTable = {
                $$: jest.fn().mockResolvedValue([
                    createMockDetailRow('Kennzahl 936', '1,00'),
                    createMockDetailRow('Kennzahl 937', '2,00'),
                ]),
            };

            const result = await ReportValueExtractor.extractDeemedIncomeValue(detailsTable);

            expect(result).toBeCloseTo(1.00);
        });
    });

    describe('extractCurrencyValue', () => {
        function createMockPage(divPairs) {
            const fundTableChildren = divPairs.map(([label, value]) => {
                const innerDivs = [{ textContent: label }, { textContent: value }];
                return {
                    $$: jest.fn().mockResolvedValue(
                        innerDivs.map(d => d)
                    ),
                };
            });

            return {
                waitForSelector: jest.fn().mockResolvedValue(true),
                $$: jest.fn().mockResolvedValue(fundTableChildren),
                evaluate: jest.fn((fn, div) => Promise.resolve(fn(div))),
            };
        }

        test('should extract currency value when Währung label is found', async () => {
            const page = createMockPage([
                ['Fondsname', 'My Fund'],
                ['Währung', ' EUR '],
            ]);

            const result = await ReportValueExtractor.extractCurrencyValue(page);

            expect(result).toBe('EUR');
        });

        test('should extract USD currency', async () => {
            const page = createMockPage([
                ['Fondsname', 'My Fund'],
                ['Währung', ' USD '],
            ]);

            const result = await ReportValueExtractor.extractCurrencyValue(page);

            expect(result).toBe('USD');
        });

        test('should return null when Währung label is not found', async () => {
            const page = createMockPage([
                ['Fondsname', 'My Fund'],
                ['Volumen', '100M'],
            ]);

            const result = await ReportValueExtractor.extractCurrencyValue(page);

            expect(result).toBeNull();
        });

        test('should return null when funds table has no children', async () => {
            const page = {
                waitForSelector: jest.fn().mockResolvedValue(true),
                $$: jest.fn().mockResolvedValue([]),
                evaluate: jest.fn(),
            };

            const result = await ReportValueExtractor.extractCurrencyValue(page);

            expect(result).toBeNull();
        });

        test('should skip divs with fewer than 2 inner divs', async () => {
            const page = {
                waitForSelector: jest.fn().mockResolvedValue(true),
                $$: jest.fn().mockResolvedValue([
                    { $$: jest.fn().mockResolvedValue([{ textContent: 'only one' }]) },
                ]),
                evaluate: jest.fn(),
            };

            const result = await ReportValueExtractor.extractCurrencyValue(page);

            expect(result).toBeNull();
        });
    });
});
