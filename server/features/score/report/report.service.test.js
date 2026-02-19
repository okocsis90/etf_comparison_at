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

const mockScraper = {
    launchBrowser: jest.fn().mockResolvedValue(undefined),
    scrape: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
};

jest.unstable_mockModule('./report-scraper.js', () => ({
    default: jest.fn(() => mockScraper),
}));

const { default: ReportService } = await import('./report.service.js');
const { default: ReportScraper } = await import('./report-scraper.js');

describe('ReportService', () => {
    let service;

    beforeEach(() => {
        service = new ReportService();
        jest.clearAllMocks();
        mockScraper.launchBrowser.mockResolvedValue(undefined);
        mockScraper.scrape.mockResolvedValue({ isin: '', currency: null, reports: [] });
        mockScraper.close.mockResolvedValue(undefined);
    });

    describe('getReportResult', () => {
        test('should create scraper, launch browser, scrape, and close', async () => {
            const expectedResult = {
                isin: 'IE00BK5BQX27',
                currency: 'EUR',
                reports: [{ date: '15.01.2024', deemedIncome: 1.4767 }],
            };
            mockScraper.scrape.mockResolvedValue(expectedResult);

            const result = await service.getReportResult('IE00BK5BQX27');

            expect(ReportScraper).toHaveBeenCalledWith('IE00BK5BQX27');
            expect(mockScraper.launchBrowser).toHaveBeenCalled();
            expect(mockScraper.scrape).toHaveBeenCalled();
            expect(mockScraper.close).toHaveBeenCalled();
            expect(result).toEqual(expectedResult);
        });

        test('should close browser even when scrape fails', async () => {
            mockScraper.scrape.mockRejectedValue(new Error('Scrape failed'));

            await expect(service.getReportResult('IE00BK5BQX27')).rejects.toThrow('Scrape failed');

            expect(mockScraper.close).toHaveBeenCalled();
        });

        test('should close browser even when launchBrowser fails', async () => {
            mockScraper.launchBrowser.mockRejectedValue(new Error('Launch failed'));

            await expect(service.getReportResult('IE00BK5BQX27')).rejects.toThrow('Launch failed');

            expect(mockScraper.close).toHaveBeenCalled();
        });

        test('should pass the correct ISIN to the scraper', async () => {
            mockScraper.scrape.mockResolvedValue({ isin: 'LU0392494562', currency: 'USD', reports: [] });

            await service.getReportResult('LU0392494562');

            expect(ReportScraper).toHaveBeenCalledWith('LU0392494562');
        });
    });
});
