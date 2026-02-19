import { jest } from '@jest/globals';
import { describe, test, expect, beforeEach } from '@jest/globals';

const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
};

jest.unstable_mockModule('../../../shared/logger.js', () => ({
    default: mockLogger,
}));

jest.unstable_mockModule('../../../shared/utils.js', () => ({
    delay: jest.fn().mockResolvedValue(undefined),
}));

const mockPuppeteer = {
    launch: jest.fn(),
};

jest.unstable_mockModule('puppeteer', () => ({
    default: mockPuppeteer,
}));

jest.unstable_mockModule('./report-value-extractor.js', () => ({
    default: {
        extractCurrencyValue: jest.fn(),
        extractDeemedIncomeValue: jest.fn(),
    },
}));

jest.unstable_mockModule('./report-row-parser.js', () => ({
    default: {
        parse: jest.fn(),
    },
}));

const { default: ReportScraper } = await import('./report-scraper.js');
const { default: ReportValueExtractor } = await import('./report-value-extractor.js');
const { default: ReportRowParser } = await import('./report-row-parser.js');

describe('ReportScraper', () => {
    let scraper;

    beforeEach(() => {
        scraper = new ReportScraper('IE00BK5BQX27');
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        test('should store isin and initialize browser/reportPage as null', () => {
            expect(scraper.isin).toBe('IE00BK5BQX27');
            expect(scraper.browser).toBeNull();
            expect(scraper.reportPage).toBeNull();
        });
    });

    describe('launchBrowser', () => {
        test('should launch puppeteer and create ReportPage', async () => {
            const mockPage = {
                setViewport: jest.fn().mockResolvedValue(undefined),
            };
            const mockBrowser = {
                newPage: jest.fn().mockResolvedValue(mockPage),
            };
            mockPuppeteer.launch.mockResolvedValue(mockBrowser);

            await scraper.launchBrowser();

            expect(mockPuppeteer.launch).toHaveBeenCalledWith({
                headless: false,
                defaultViewport: null,
                args: ['--start-maximized'],
            });
            expect(scraper.browser).toBe(mockBrowser);
            expect(scraper.reportPage).not.toBeNull();
        });
    });

    describe('close', () => {
        test('should close the browser', async () => {
            const mockBrowser = { close: jest.fn().mockResolvedValue(undefined) };
            scraper.browser = mockBrowser;

            await scraper.close();

            expect(mockBrowser.close).toHaveBeenCalled();
        });

        test('should do nothing if browser is null', async () => {
            scraper.browser = null;

            await expect(scraper.close()).resolves.toBeUndefined();
        });
    });

    describe('scrape', () => {
        let mockPage;
        let mockChevron;

        beforeEach(() => {
            mockChevron = {
                evaluate: jest.fn().mockResolvedValue(undefined),
                click: jest.fn().mockResolvedValue(undefined),
            };

            mockPage = {
                goto: jest.fn().mockResolvedValue(undefined),
                evaluate: jest.fn().mockResolvedValue(undefined),
                setViewport: jest.fn().mockResolvedValue(undefined),
                waitForSelector: jest.fn().mockResolvedValue(undefined),
                $: jest.fn().mockResolvedValue(mockChevron),
                $$: jest.fn().mockResolvedValue([]),
            };

            const mockBrowser = {
                newPage: jest.fn().mockResolvedValue(mockPage),
            };
            mockPuppeteer.launch.mockResolvedValue(mockBrowser);
        });

        test('should return result with currency and reports', async () => {
            await scraper.launchBrowser();

            ReportValueExtractor.extractCurrencyValue.mockResolvedValue('EUR');

            const mockRow = {
                evaluate: jest.fn().mockResolvedValue(undefined),
                click: jest.fn().mockResolvedValue(undefined),
            };
            const mockReportTable = { $$: jest.fn().mockResolvedValue([mockRow]) };
            const mockDetailsTable = {};
            const mockExtraTable = {};

            // getTables is called via reportPage.page.$$('table')
            // First call: after chevron click (_extractReports -> getTables)
            // Second call: after row click (_extractReportFromRow -> getTables)
            mockPage.$$
                .mockResolvedValueOnce([{}, mockReportTable, mockDetailsTable, mockExtraTable])
                .mockResolvedValueOnce([{}, mockReportTable, mockDetailsTable, mockExtraTable]);

            ReportRowParser.parse.mockResolvedValue({
                date: '15.01.2024',
                isYearlyReport: true,
                businessYearStart: '01.01.2023',
                businessYearEnd: '31.12.2023',
            });

            ReportValueExtractor.extractDeemedIncomeValue.mockResolvedValue(1.4767);

            const result = await scraper.scrape();

            expect(result.isin).toBe('IE00BK5BQX27');
            expect(result.currency).toBe('EUR');
            expect(result.reports).toHaveLength(1);
            expect(result.reports[0].deemedIncome).toBeCloseTo(1.4767);
        });

        test('should return empty reports when no yearly reports found', async () => {
            await scraper.launchBrowser();

            ReportValueExtractor.extractCurrencyValue.mockResolvedValue('USD');

            const mockRow = {};
            const mockReportTable = { $$: jest.fn().mockResolvedValue([mockRow]) };
            const mockDetailsTable = {};
            const mockExtraTable = {};

            // Only one getTables call (no row click since row is skipped)
            mockPage.$$
                .mockResolvedValueOnce([{}, mockReportTable, mockDetailsTable, mockExtraTable]);

            ReportRowParser.parse.mockResolvedValue(null); // not a yearly report

            const result = await scraper.scrape();

            expect(result.isin).toBe('IE00BK5BQX27');
            expect(result.currency).toBe('USD');
            expect(result.reports).toHaveLength(0);
        });

        test('should skip row when deemed income is null', async () => {
            await scraper.launchBrowser();

            ReportValueExtractor.extractCurrencyValue.mockResolvedValue('EUR');

            const mockRow = {
                evaluate: jest.fn().mockResolvedValue(undefined),
                click: jest.fn().mockResolvedValue(undefined),
            };
            const mockReportTable = { $$: jest.fn().mockResolvedValue([mockRow]) };
            const mockDetailsTable = {};
            const mockExtraTable = {};

            mockPage.$$
                .mockResolvedValueOnce([{}, mockReportTable, mockDetailsTable, mockExtraTable])
                .mockResolvedValueOnce([{}, mockReportTable, mockDetailsTable, mockExtraTable]);

            ReportRowParser.parse.mockResolvedValue({
                date: '15.01.2024',
                isYearlyReport: true,
                businessYearStart: '01.01.2023',
                businessYearEnd: '31.12.2023',
            });

            ReportValueExtractor.extractDeemedIncomeValue.mockResolvedValue(null);

            const result = await scraper.scrape();

            expect(result.reports).toHaveLength(0);
            expect(mockLogger.warn).toHaveBeenCalledWith(
                expect.stringContaining('No deemed income')
            );
        });

        test('should throw when not enough tables after chevron click', async () => {
            await scraper.launchBrowser();

            ReportValueExtractor.extractCurrencyValue.mockResolvedValue('EUR');

            // Only 2 tables instead of 3
            mockPage.$$
                .mockResolvedValueOnce([{}, {}]);

            await expect(scraper.scrape()).rejects.toThrow('Expected at least 3 tables');
        });
    });

    describe('static constants', () => {
        test('should have correct table indices', () => {
            expect(ReportScraper.REPORT_TABLE_INDEX).toBe(1);
            expect(ReportScraper.DETAILS_TABLE_INDEX).toBe(2);
            expect(ReportScraper.MIN_TABLES_AFTER_CHEVRON).toBe(3);
        });
    });
});
