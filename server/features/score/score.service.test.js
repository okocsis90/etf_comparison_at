import { jest } from '@jest/globals';
import { describe, test, expect, beforeEach } from '@jest/globals';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };

jest.unstable_mockModule('../../shared/logger.js', () => ({
    default: mockLogger,
}));

const mockGetReportResult = jest.fn();
jest.unstable_mockModule('./report/report.service.js', () => ({
    default: jest.fn().mockImplementation(() => ({ getReportResult: mockGetReportResult })),
}));

const mockGetExchangeRate = jest.fn();
jest.unstable_mockModule('./currency-exchange-rate/currency-exchange-rate.service.js', () => ({
    default: jest.fn().mockImplementation(() => ({ getExchangeRate: mockGetExchangeRate })),
}));

const mockGetPrice = jest.fn();
const mockGetCurrentPrice = jest.fn();
const mockGetEtfInfo = jest.fn().mockResolvedValue({ ticker: 'VUSA.AS', name: 'Vanguard S&P 500 UCITS ETF' });
jest.unstable_mockModule('./etf-price/etf-price.service.js', () => ({
    default: jest.fn().mockImplementation(() => ({
        getPrice: mockGetPrice,
        getCurrentPrice: mockGetCurrentPrice,
        getEtfInfo: mockGetEtfInfo,
    })),
}));

const mockCalculateScore = jest.fn();
jest.unstable_mockModule('./score-calculator/score-calculator.service.js', () => ({
    default: jest.fn().mockImplementation(() => ({ calculateScore: mockCalculateScore })),
}));

const { default: ScoreService } = await import('./score.service.js');
const ReportResult = (await import('./report/report-result.js')).default;
const { ScoreInput, ReportEntry } = await import('./score-calculator/score-input.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ISIN = 'IE00BK5BQX27';

/**
 * Builds a ReportResult with the given reports.
 * dates are in German format (DD.MM.YYYY) as the real scraper produces them.
 */
function makeReportResult({ currency = 'EUR', reports = [] } = {}) {
    const result = new ReportResult(ISIN, currency);
    for (const r of reports) {
        result.addReport(r);
    }
    return result;
}

function makeReport({
    date = '15.01.2023',
    deemedIncome = 1.5,
    businessYearStart = '01.01.2022',
    businessYearEnd = '31.12.2022',
} = {}) {
    return { date, deemedIncome, businessYearStart, businessYearEnd };
}

/** Returns a price object the same shape EtfPriceService returns */
function makePriceData({ price = 100, currency = 'EUR', resultDate = new Date('2023-01-15') } = {}) {
    return { price, currency, resultDate };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ScoreService', () => {
    let service;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new ScoreService();
    });

    // --- getScore: happy path (EUR) ---

    describe('getScore - EUR reports', () => {
        test('should return the result of scoreCalculatorService.calculateScore', async () => {
            const reportResult = makeReportResult({
                currency: 'EUR',
                reports: [makeReport()],
            });

            mockGetReportResult.mockResolvedValue(reportResult);
            mockGetPrice.mockResolvedValue(makePriceData({ price: 80 }));
            mockGetCurrentPrice.mockResolvedValue(makePriceData({ price: 90 }));
            mockCalculateScore.mockReturnValue({ isin: ISIN, totalGains: 10 });

            const result = await service.getScore(ISIN);

            expect(result).toEqual(expect.objectContaining({ isin: ISIN, totalGains: 10 }));
            expect(result.ticker).toBe('VUSA.AS');
            expect(result.name).toBe('Vanguard S&P 500 UCITS ETF');
            expect(mockCalculateScore).toHaveBeenCalledTimes(1);
        });

        test('should NOT call getExchangeRate when currency is EUR', async () => {
            const reportResult = makeReportResult({
                currency: 'EUR',
                reports: [makeReport()],
            });

            mockGetReportResult.mockResolvedValue(reportResult);
            mockGetPrice.mockResolvedValue(makePriceData());
            mockGetCurrentPrice.mockResolvedValue(makePriceData());
            mockCalculateScore.mockReturnValue({});

            await service.getScore(ISIN);

            expect(mockGetExchangeRate).not.toHaveBeenCalled();
        });

        test('should pass EUR prices through unchanged to ScoreInput', async () => {
            const reportResult = makeReportResult({
                currency: 'EUR',
                reports: [makeReport({ date: '15.01.2023', deemedIncome: 2.0 })],
            });

            mockGetReportResult.mockResolvedValue(reportResult);
            // first call: firstBusinessYearStart, second: lastBusinessYearEnd, further calls: per report
            mockGetPrice.mockResolvedValue(makePriceData({ price: 55 }));
            mockGetCurrentPrice.mockResolvedValue(makePriceData({ price: 90 }));
            mockCalculateScore.mockReturnValue({});

            await service.getScore(ISIN);

            const scoreInput = mockCalculateScore.mock.calls[0][0];
            expect(scoreInput).toBeInstanceOf(ScoreInput);
            expect(scoreInput.isin).toBe(ISIN);
            expect(scoreInput.originalCurrency).toBe('EUR');
            expect(scoreInput.etfPriceAtFirstBusinessYearStartEur).toBe(55);
            expect(scoreInput.etfPriceAtLastBusinessYearEndEur).toBe(55);
            expect(scoreInput.currentEtfPriceEur).toBe(90);
            expect(scoreInput.reports).toHaveLength(1);
            expect(scoreInput.reports[0]).toBeInstanceOf(ReportEntry);
            expect(scoreInput.reports[0].deemedIncomeEur).toBe(2.0);
            expect(scoreInput.reports[0].deemedIncomeOriginal).toBe(2.0);
            expect(scoreInput.reports[0].etfPriceOnDateEur).toBe(55);
        });
    });

    // --- getScore: non-EUR currency conversion ---

    describe('getScore - non-EUR reports (USD)', () => {
        test('should call getExchangeRate for each report and boundary price when currency is not EUR', async () => {
            const reportResult = makeReportResult({
                currency: 'USD',
                reports: [
                    makeReport({ date: '15.01.2022', deemedIncome: 1.0 }),
                    makeReport({ date: '15.01.2023', deemedIncome: 2.0, businessYearStart: '01.01.2022', businessYearEnd: '31.12.2022' }),
                ],
            });

            mockGetReportResult.mockResolvedValue(reportResult);
            mockGetPrice.mockResolvedValue(makePriceData({ price: 100, currency: 'USD' }));
            mockGetCurrentPrice.mockResolvedValue(makePriceData({ price: 110, currency: 'USD' }));
            mockGetExchangeRate.mockResolvedValue({ exchangeRateCurrencyToEur: 0.9 });
            mockCalculateScore.mockReturnValue({});

            await service.getScore(ISIN);

            // Called for: boundary start price, boundary end price, current price, and each report's deemed income + etf price
            expect(mockGetExchangeRate).toHaveBeenCalled();
            expect(mockGetExchangeRate).toHaveBeenCalledWith('USD', expect.any(Date));
        });

        test('should multiply amount by exchangeRateCurrencyToEur when converting to EUR', async () => {
            const reportResult = makeReportResult({
                currency: 'USD',
                reports: [makeReport({ date: '15.01.2023', deemedIncome: 10.0 })],
            });

            mockGetReportResult.mockResolvedValue(reportResult);
            mockGetPrice.mockResolvedValue(makePriceData({ price: 100, currency: 'USD' }));
            mockGetCurrentPrice.mockResolvedValue(makePriceData({ price: 110, currency: 'USD' }));
            // exchange rate: 0.85 USD -> EUR
            mockGetExchangeRate.mockResolvedValue({ exchangeRateCurrencyToEur: 0.85 });
            mockCalculateScore.mockReturnValue({});

            await service.getScore(ISIN);

            const scoreInput = mockCalculateScore.mock.calls[0][0];
            // ETF price 100 USD * 0.85 = 85 EUR
            expect(scoreInput.etfPriceAtFirstBusinessYearStartEur).toBeCloseTo(85);
            expect(scoreInput.etfPriceAtLastBusinessYearEndEur).toBeCloseTo(85);
            // current price 110 USD * 0.85 = 93.5 EUR
            expect(scoreInput.currentEtfPriceEur).toBeCloseTo(93.5);
            // deemed income 10 USD * 0.85 = 8.5 EUR
            expect(scoreInput.reports[0].deemedIncomeEur).toBeCloseTo(8.5);
        });
    });

    // --- getScore: date sorting ---

    describe('getScore - business year date sorting', () => {
        test('should use the earliest businessYearStart as firstBusinessYearStart', async () => {
            const reportResult = makeReportResult({
                currency: 'EUR',
                reports: [
                    makeReport({ date: '15.01.2023', businessYearStart: '01.01.2022', businessYearEnd: '31.12.2022' }),
                    makeReport({ date: '15.01.2022', businessYearStart: '01.01.2021', businessYearEnd: '31.12.2021' }),
                    makeReport({ date: '15.01.2024', businessYearStart: '01.01.2023', businessYearEnd: '31.12.2023' }),
                ],
            });

            mockGetReportResult.mockResolvedValue(reportResult);
            mockGetPrice.mockResolvedValue(makePriceData());
            mockGetCurrentPrice.mockResolvedValue(makePriceData());
            mockCalculateScore.mockReturnValue({});

            await service.getScore(ISIN);

            const scoreInput = mockCalculateScore.mock.calls[0][0];
            // firstBusinessYearStart should be 2021-01-01
            expect(scoreInput.firstBusinessYearStart).toEqual(new Date(2021, 0, 1));
            // lastBusinessYearEnd should be 2023-12-31
            expect(scoreInput.lastBusinessYearEnd).toEqual(new Date(2023, 11, 31));
        });
    });

    // --- getScore: error cases ---

    describe('getScore - error handling', () => {
        test('should throw when no reports are found', async () => {
            mockGetReportResult.mockResolvedValue(makeReportResult({ reports: [] }));

            await expect(service.getScore(ISIN)).rejects.toThrow(`No reports found for ISIN: ${ISIN}`);
            expect(mockCalculateScore).not.toHaveBeenCalled();
        });

        test('should propagate errors from reportService', async () => {
            mockGetReportResult.mockRejectedValue(new Error('Scrape failed'));

            await expect(service.getScore(ISIN)).rejects.toThrow('Scrape failed');
        });

        test('should propagate errors from etfPriceService', async () => {
            const reportResult = makeReportResult({ currency: 'EUR', reports: [makeReport()] });
            mockGetReportResult.mockResolvedValue(reportResult);
            mockGetPrice.mockRejectedValue(new Error('Price fetch failed'));
            mockGetCurrentPrice.mockResolvedValue(makePriceData());

            await expect(service.getScore(ISIN)).rejects.toThrow('Price fetch failed');
        });

        test('should propagate errors from currencyExchangeRateService', async () => {
            const reportResult = makeReportResult({ currency: 'USD', reports: [makeReport()] });
            mockGetReportResult.mockResolvedValue(reportResult);
            mockGetPrice.mockResolvedValue(makePriceData({ currency: 'USD' }));
            mockGetCurrentPrice.mockResolvedValue(makePriceData({ currency: 'USD' }));
            mockGetExchangeRate.mockRejectedValue(new Error('Exchange rate fetch failed'));

            await expect(service.getScore(ISIN)).rejects.toThrow('Exchange rate fetch failed');
        });
    });

    // --- _convertToEur ---

    describe('_convertToEur', () => {
        test('should return amount unchanged when currency is EUR', async () => {
            const result = await service._convertToEur(42.5, 'EUR', new Date());
            expect(result).toBe(42.5);
            expect(mockGetExchangeRate).not.toHaveBeenCalled();
        });

        test('should convert amount using exchangeRateCurrencyToEur when currency is not EUR', async () => {
            mockGetExchangeRate.mockResolvedValue({ exchangeRateCurrencyToEur: 0.8 });
            const result = await service._convertToEur(100, 'USD', new Date('2023-01-15'));
            expect(result).toBeCloseTo(80);
            expect(mockGetExchangeRate).toHaveBeenCalledWith('USD', new Date('2023-01-15'));
        });
    });
});
