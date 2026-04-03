import { jest } from '@jest/globals';
import { describe, test, expect, beforeEach } from '@jest/globals';

const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };

jest.unstable_mockModule('../../../shared/logger.js', () => ({
    default: mockLogger,
}));

const { default: ScoreCalculatorService } = await import('./score-calculator.service.js');
const { ScoreInput, ReportEntry } = await import('./score-input.js');
const { ScoreResult, ReportMetric } = await import('./score-result.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeReport({ date, deemedIncomeEur, etfPriceOnDateEur, businessYearStart, businessYearEnd } = {}) {
    return new ReportEntry({
        date: date ?? new Date('2024-01-15'),
        deemedIncomeOriginal: deemedIncomeEur ?? 1.0,
        deemedIncomeEur: deemedIncomeEur ?? 1.0,
        businessYearStart: businessYearStart ?? new Date('2023-01-01'),
        businessYearEnd: businessYearEnd ?? new Date('2023-12-31'),
        etfPriceOnDateEur: etfPriceOnDateEur ?? 100,
    });
}

function makeInput(overrides = {}) {
    return new ScoreInput({
        isin: 'IE00BK5BQX27',
        originalCurrency: 'EUR',
        reports: [],
        etfPriceAtFirstBusinessYearStartEur: 100,
        etfPriceAtLastBusinessYearEndEur: 150,
        currentEtfPriceEur: 160,
        firstBusinessYearStart: new Date('2020-01-01'),
        lastBusinessYearEnd: new Date('2023-12-31'),
        ...overrides,
    });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ScoreCalculatorService', () => {
    let service;

    beforeEach(() => {
        service = new ScoreCalculatorService();
        jest.clearAllMocks();
    });

    // --- input validation ---

    describe('input validation', () => {
        test('should throw when scoreInput is null', () => {
            expect(() => service.calculateScore(null)).toThrow('scoreInput is required');
        });

        test('should throw when isin is missing', () => {
            expect(() => service.calculateScore(makeInput({ isin: '' }))).toThrow('scoreInput.isin is required');
        });

        test('should throw when reports is not an array', () => {
            const input = makeInput();
            input.reports = null;
            expect(() => service.calculateScore(input)).toThrow('scoreInput.reports must be an array');
        });

        test('should throw when a price field is NaN', () => {
            expect(() => service.calculateScore(makeInput({ etfPriceAtFirstBusinessYearStartEur: NaN })))
                .toThrow('etfPriceAtFirstBusinessYearStartEur must be a finite number');
        });

        test('should throw when a price field is Infinity', () => {
            expect(() => service.calculateScore(makeInput({ currentEtfPriceEur: Infinity })))
                .toThrow('currentEtfPriceEur must be a finite number');
        });

        test('should throw when a price field is undefined', () => {
            expect(() => service.calculateScore(makeInput({ etfPriceAtLastBusinessYearEndEur: undefined })))
                .toThrow('etfPriceAtLastBusinessYearEndEur must be a finite number');
        });
    });

    // --- return type ---

    describe('return type', () => {
        test('should return a ScoreResult instance', () => {
            const result = service.calculateScore(makeInput());

            expect(result).toBeInstanceOf(ScoreResult);
        });

        test('should pass through identity fields unchanged', () => {
            const input = makeInput({ isin: 'IE00BK5BQX27', originalCurrency: 'USD' });

            const result = service.calculateScore(input);

            expect(result.isin).toBe('IE00BK5BQX27');
            expect(result.originalCurrency).toBe('USD');
        });

        test('should pass through boundary prices and dates unchanged', () => {
            const firstStart = new Date('2020-01-01');
            const lastEnd = new Date('2023-12-31');
            const input = makeInput({
                etfPriceAtFirstBusinessYearStartEur: 80,
                etfPriceAtLastBusinessYearEndEur: 130,
                currentEtfPriceEur: 145,
                firstBusinessYearStart: firstStart,
                lastBusinessYearEnd: lastEnd,
            });

            const result = service.calculateScore(input);

            expect(result.etfPriceAtFirstBusinessYearStartEur).toBe(80);
            expect(result.etfPriceAtLastBusinessYearEndEur).toBe(130);
            expect(result.currentEtfPriceEur).toBe(145);
            expect(result.firstBusinessYearStart).toBe(firstStart);
            expect(result.lastBusinessYearEnd).toBe(lastEnd);
        });

        test('should set totalReports to the number of reports', () => {
            const input = makeInput({
                reports: [makeReport(), makeReport(), makeReport()],
            });

            const result = service.calculateScore(input);

            expect(result.totalReports).toBe(3);
        });

        test('should log the isin', () => {
            service.calculateScore(makeInput({ isin: 'IE00BK5BQX27' }));

            expect(mockLogger.info).toHaveBeenCalledWith(
                expect.stringContaining('IE00BK5BQX27')
            );
        });
    });

    // --- totalGains ---

    describe('totalGains', () => {
        test('should be difference between last end price and first start price', () => {
            const input = makeInput({
                etfPriceAtFirstBusinessYearStartEur: 100,
                etfPriceAtLastBusinessYearEndEur: 150,
            });

            expect(service.calculateScore(input).totalGains).toBeCloseTo(50);
        });

        test('should be negative when price fell', () => {
            const input = makeInput({
                etfPriceAtFirstBusinessYearStartEur: 150,
                etfPriceAtLastBusinessYearEndEur: 100,
            });

            expect(service.calculateScore(input).totalGains).toBeCloseTo(-50);
        });

        test('should be zero when prices are equal', () => {
            const input = makeInput({
                etfPriceAtFirstBusinessYearStartEur: 100,
                etfPriceAtLastBusinessYearEndEur: 100,
            });

            expect(service.calculateScore(input).totalGains).toBe(0);
        });
    });

    // --- deemedGains ---

    describe('deemedGains', () => {
        test('should be sum of all deemedIncomeEur values', () => {
            const input = makeInput({
                reports: [
                    makeReport({ deemedIncomeEur: 1.0 }),
                    makeReport({ deemedIncomeEur: 2.5 }),
                    makeReport({ deemedIncomeEur: 0.75 }),
                ],
            });

            expect(service.calculateScore(input).deemedGains).toBeCloseTo(4.25);
        });

        test('should be zero when there are no reports', () => {
            expect(service.calculateScore(makeInput({ reports: [] })).deemedGains).toBe(0);
        });

        test('should handle a single report', () => {
            const input = makeInput({ reports: [makeReport({ deemedIncomeEur: 3.14 })] });

            expect(service.calculateScore(input).deemedGains).toBeCloseTo(3.14);
        });
    });

    // --- deemedGainsToTotalGainsPercent ---

    describe('deemedGainsToTotalGainsPercent', () => {
        test('should be deemed gains as percent of total gains', () => {
            const input = makeInput({
                etfPriceAtFirstBusinessYearStartEur: 100,
                etfPriceAtLastBusinessYearEndEur: 150,   // totalGains = 50
                reports: [makeReport({ deemedIncomeEur: 10 })], // deemedGains = 10
            });

            // 10 / 50 * 100 = 20%
            expect(service.calculateScore(input).deemedGainsToTotalGainsPercent).toBeCloseTo(20);
        });

        test('should be zero when totalGains is zero', () => {
            const input = makeInput({
                etfPriceAtFirstBusinessYearStartEur: 100,
                etfPriceAtLastBusinessYearEndEur: 100,   // totalGains = 0
                reports: [makeReport({ deemedIncomeEur: 5 })],
            });

            expect(service.calculateScore(input).deemedGainsToTotalGainsPercent).toBe(0);
        });

        test('should exceed 100% when deemed gains outpace total gains', () => {
            const input = makeInput({
                etfPriceAtFirstBusinessYearStartEur: 100,
                etfPriceAtLastBusinessYearEndEur: 110,   // totalGains = 10
                reports: [makeReport({ deemedIncomeEur: 15 })], // deemedGains = 15
            });

            expect(service.calculateScore(input).deemedGainsToTotalGainsPercent).toBeCloseTo(150);
        });

        test('should be negative when total gains is negative', () => {
            const input = makeInput({
                etfPriceAtFirstBusinessYearStartEur: 150,
                etfPriceAtLastBusinessYearEndEur: 100,   // totalGains = -50
                reports: [makeReport({ deemedIncomeEur: 5 })],
            });

            // 5 / -50 * 100 = -10%
            expect(service.calculateScore(input).deemedGainsToTotalGainsPercent).toBeCloseTo(-10);
        });
    });

    // --- reportMetrics ---

    describe('reportMetrics', () => {
        test('should produce one ReportMetric per report', () => {
            const input = makeInput({
                reports: [makeReport(), makeReport()],
            });

            const { reportMetrics } = service.calculateScore(input);

            expect(reportMetrics).toHaveLength(2);
            expect(reportMetrics[0]).toBeInstanceOf(ReportMetric);
        });

        test('should carry date, deemedIncomeEur and etfPriceOnDateEur from the report', () => {
            const date = new Date('2023-06-15');
            const input = makeInput({
                reports: [makeReport({ date, deemedIncomeEur: 2.0, etfPriceOnDateEur: 80 })],
            });

            const { reportMetrics } = service.calculateScore(input);

            expect(reportMetrics[0].date).toBe(date);
            expect(reportMetrics[0].deemedIncomeEur).toBeCloseTo(2.0);
            expect(reportMetrics[0].etfPriceOnDateEur).toBeCloseTo(80);
        });

        test('should calculate deemedIncomeToEtfPricePercent correctly', () => {
            const input = makeInput({
                reports: [makeReport({ deemedIncomeEur: 2.0, etfPriceOnDateEur: 80 })],
            });

            // 2 / 80 * 100 = 2.5%
            expect(service.calculateScore(input).reportMetrics[0].deemedIncomeToEtfPricePercent)
                .toBeCloseTo(2.5);
        });

        test('should set deemedIncomeToEtfPricePercent to zero when ETF price is zero', () => {
            const input = makeInput({
                reports: [makeReport({ deemedIncomeEur: 2.0, etfPriceOnDateEur: 0 })],
            });

            expect(service.calculateScore(input).reportMetrics[0].deemedIncomeToEtfPricePercent)
                .toBe(0);
        });

        test('should be empty when there are no reports', () => {
            expect(service.calculateScore(makeInput()).reportMetrics).toEqual([]);
        });
    });

    // --- avgDeemedIncomeToEtfPricePercent ---

    describe('avgDeemedIncomeToEtfPricePercent', () => {
        test('should be average of per-report deemedIncomeToEtfPricePercent values', () => {
            // report 1: 1/100 * 100 = 1%,  report 2: 3/100 * 100 = 3%  → avg = 2%
            const input = makeInput({
                reports: [
                    makeReport({ deemedIncomeEur: 1, etfPriceOnDateEur: 100 }),
                    makeReport({ deemedIncomeEur: 3, etfPriceOnDateEur: 100 }),
                ],
            });

            expect(service.calculateScore(input).avgDeemedIncomeToEtfPricePercent).toBeCloseTo(2);
        });

        test('should be zero when there are no reports', () => {
            expect(service.calculateScore(makeInput()).avgDeemedIncomeToEtfPricePercent).toBe(0);
        });

        test('should equal the single report value when there is only one report', () => {
            const input = makeInput({
                reports: [makeReport({ deemedIncomeEur: 2, etfPriceOnDateEur: 40 })],
            });

            // 2/40*100 = 5%
            expect(service.calculateScore(input).avgDeemedIncomeToEtfPricePercent).toBeCloseTo(5);
        });
    });

    // --- avgDeemedIncomeEur ---

    describe('avgDeemedIncomeEur', () => {
        test('should be the arithmetic mean of all deemed incomes', () => {
            const input = makeInput({
                reports: [
                    makeReport({ deemedIncomeEur: 1 }),
                    makeReport({ deemedIncomeEur: 2 }),
                    makeReport({ deemedIncomeEur: 3 }),
                ],
            });

            expect(service.calculateScore(input).avgDeemedIncomeEur).toBeCloseTo(2);
        });

        test('should be zero when there are no reports', () => {
            expect(service.calculateScore(makeInput()).avgDeemedIncomeEur).toBe(0);
        });

        test('should equal deemedIncomeEur of a single report', () => {
            const input = makeInput({ reports: [makeReport({ deemedIncomeEur: 4.5 })] });

            expect(service.calculateScore(input).avgDeemedIncomeEur).toBeCloseTo(4.5);
        });
    });

    // --- maxDeemedIncomeDiffEur ---

    describe('maxDeemedIncomeDiffEur', () => {
        test('should be max minus min of all deemed incomes', () => {
            const input = makeInput({
                reports: [
                    makeReport({ deemedIncomeEur: 1 }),
                    makeReport({ deemedIncomeEur: 3 }),
                    makeReport({ deemedIncomeEur: 2 }),
                ],
            });

            // max=3, min=1 → diff=2
            expect(service.calculateScore(input).maxDeemedIncomeDiffEur).toBeCloseTo(2);
        });

        test('should be zero for a single report', () => {
            const input = makeInput({ reports: [makeReport({ deemedIncomeEur: 5 })] });

            expect(service.calculateScore(input).maxDeemedIncomeDiffEur).toBe(0);
        });

        test('should be zero when there are no reports', () => {
            expect(service.calculateScore(makeInput()).maxDeemedIncomeDiffEur).toBe(0);
        });

        test('should be zero when all deemed incomes are equal', () => {
            const input = makeInput({
                reports: [
                    makeReport({ deemedIncomeEur: 2 }),
                    makeReport({ deemedIncomeEur: 2 }),
                ],
            });

            expect(service.calculateScore(input).maxDeemedIncomeDiffEur).toBe(0);
        });
    });

    // --- maxDiffToAvgEtfPricePercent ---

    describe('maxDiffToAvgEtfPricePercent', () => {
        test('should be max deemed income diff as percent of average ETF price on report dates', () => {
            // incomes: 1, 2, 3 → diff=2; etf prices: 100, 200, 300 → avg=200 → 2/200*100=1%
            const input = makeInput({
                reports: [
                    makeReport({ deemedIncomeEur: 1, etfPriceOnDateEur: 100 }),
                    makeReport({ deemedIncomeEur: 2, etfPriceOnDateEur: 200 }),
                    makeReport({ deemedIncomeEur: 3, etfPriceOnDateEur: 300 }),
                ],
            });

            expect(service.calculateScore(input).maxDiffToAvgEtfPricePercent).toBeCloseTo(1);
        });

        test('should be zero when average ETF price is zero', () => {
            const input = makeInput({
                reports: [
                    makeReport({ deemedIncomeEur: 1, etfPriceOnDateEur: 0 }),
                    makeReport({ deemedIncomeEur: 2, etfPriceOnDateEur: 0 }),
                ],
            });

            expect(service.calculateScore(input).maxDiffToAvgEtfPricePercent).toBe(0);
        });

        test('should be zero when there are no reports', () => {
            expect(service.calculateScore(makeInput()).maxDiffToAvgEtfPricePercent).toBe(0);
        });
    });

    // --- avgDeemedIncomeToCurrentEtfPricePercent ---

    describe('avgDeemedIncomeToCurrentEtfPricePercent', () => {
        test('should be average deemed income as percent of current ETF price', () => {
            // avg deemed = 2, current price = 100 → 2/100*100 = 2%
            const input = makeInput({
                currentEtfPriceEur: 100,
                reports: [
                    makeReport({ deemedIncomeEur: 1 }),
                    makeReport({ deemedIncomeEur: 3 }),
                ],
            });

            expect(service.calculateScore(input).avgDeemedIncomeToCurrentEtfPricePercent).toBeCloseTo(2);
        });

        test('should be zero when current ETF price is zero', () => {
            const input = makeInput({
                currentEtfPriceEur: 0,
                reports: [makeReport({ deemedIncomeEur: 2 })],
            });

            expect(service.calculateScore(input).avgDeemedIncomeToCurrentEtfPricePercent).toBe(0);
        });

        test('should be zero when there are no reports', () => {
            const input = makeInput({ currentEtfPriceEur: 100, reports: [] });

            expect(service.calculateScore(input).avgDeemedIncomeToCurrentEtfPricePercent).toBe(0);
        });
    });

    // --- _calculateMaxDiff ---

    describe('_calculateMaxDiff', () => {
        test('should return max minus min', () => {
            expect(service._calculateMaxDiff([5, 2, 8, 1])).toBe(7);
        });

        test('should return 0 for a single value', () => {
            expect(service._calculateMaxDiff([42])).toBe(0);
        });

        test('should return 0 for an empty array', () => {
            expect(service._calculateMaxDiff([])).toBe(0);
        });

        test('should return 0 when all values are equal', () => {
            expect(service._calculateMaxDiff([3, 3, 3])).toBe(0);
        });

        test('should handle negative values', () => {
            expect(service._calculateMaxDiff([-5, -1, -3])).toBe(4);
        });

        test('should handle a mix of negative and positive values', () => {
            expect(service._calculateMaxDiff([-2, 0, 4])).toBe(6);
        });
    });

    // --- end-to-end realistic scenario ---

    describe('realistic scenario', () => {
        test('should calculate all metrics correctly for a 3-year EUR ETF', () => {
            // ETF started at 50, ended at 80 → totalGains = 30
            // Reports:
            //   Year 1: deemed=1.0, price=55  → deemedToPrice=1.818%
            //   Year 2: deemed=2.0, price=65  → deemedToPrice=3.077%
            //   Year 3: deemed=1.5, price=75  → deemedToPrice=2.000%
            // deemedGains = 4.5
            // avgDeemedIncome = 1.5
            // maxDiff = 1.0 (between 2.0 and 1.0)
            // avgDeemedToPrice = (1.818+3.077+2.0)/3 ≈ 2.298%
            // deemedGainsToTotalGains = 4.5/30*100 = 15%
            // avgEtfPrice = (55+65+75)/3 = 65 → maxDiffToAvgEtfPrice = 1.0/65*100 ≈ 1.538%
            // avgDeemedToCurrentPrice (current=90): 1.5/90*100 ≈ 1.667%

            const input = makeInput({
                etfPriceAtFirstBusinessYearStartEur: 50,
                etfPriceAtLastBusinessYearEndEur: 80,
                currentEtfPriceEur: 90,
                reports: [
                    makeReport({ deemedIncomeEur: 1.0, etfPriceOnDateEur: 55 }),
                    makeReport({ deemedIncomeEur: 2.0, etfPriceOnDateEur: 65 }),
                    makeReport({ deemedIncomeEur: 1.5, etfPriceOnDateEur: 75 }),
                ],
            });

            const result = service.calculateScore(input);

            expect(result.totalGains).toBeCloseTo(30);
            expect(result.deemedGains).toBeCloseTo(4.5);
            expect(result.deemedGainsToTotalGainsPercent).toBeCloseTo(15);
            expect(result.maxDeemedIncomeDiffEur).toBeCloseTo(1.0);
            // avg ETF price = (55+65+75)/3 = 65, max diff = 1.0 → 1/65*100 ≈ 1.538%
            expect(result.maxDiffToAvgEtfPricePercent).toBeCloseTo(1.538, 2);
            expect(result.avgDeemedIncomeToEtfPricePercent).toBeCloseTo(2.298, 2);
            expect(result.avgDeemedIncomeToCurrentEtfPricePercent).toBeCloseTo(1.667, 2);
            expect(result.totalReports).toBe(3);
        });
    });
});
