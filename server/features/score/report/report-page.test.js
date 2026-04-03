import { jest } from '@jest/globals';
import { describe, test, expect } from '@jest/globals';
import ReportPage from './report-page.js';

describe('ReportPage', () => {
    let mockPage;

    function createMockPage() {
        return {
            goto: jest.fn().mockResolvedValue(undefined),
            evaluate: jest.fn().mockResolvedValue(undefined),
            setViewport: jest.fn().mockResolvedValue(undefined),
            waitForSelector: jest.fn().mockResolvedValue(undefined),
            $: jest.fn().mockResolvedValue(null),
            $$: jest.fn().mockResolvedValue([]),
        };
    }

    beforeEach(() => {
        mockPage = createMockPage();
    });

    describe('constructor', () => {
        test('should store page and isin', () => {
            const page = new ReportPage(mockPage, 'IE00BK5BQX27');

            expect(page.page).toBe(mockPage);
            expect(page.isin).toBe('IE00BK5BQX27');
        });
    });

    describe('url', () => {
        test('should build correct URL for given ISIN', () => {
            const page = new ReportPage(mockPage, 'IE00BK5BQX27');

            expect(page.url).toBe(
                'https://my.oekb.at/kapitalmarkt-services/kms-output/fonds-info/sd/af/f?isin=IE00BK5BQX27'
            );
        });

        test('should build correct URL for different ISIN', () => {
            const page = new ReportPage(mockPage, 'LU0392494562');

            expect(page.url).toBe(
                'https://my.oekb.at/kapitalmarkt-services/kms-output/fonds-info/sd/af/f?isin=LU0392494562'
            );
        });
    });

    describe('gotoPage', () => {
        test('should navigate to the correct URL with networkidle2', async () => {
            const page = new ReportPage(mockPage, 'IE00BK5BQX27');

            await page.gotoPage();

            expect(mockPage.goto).toHaveBeenCalledWith(
                'https://my.oekb.at/kapitalmarkt-services/kms-output/fonds-info/sd/af/f?isin=IE00BK5BQX27',
                { waitUntil: 'networkidle2' }
            );
        });
    });

    describe('scrollToTop', () => {
        test('should scroll window to top', async () => {
            const page = new ReportPage(mockPage, 'IE00BK5BQX27');

            await page.scrollToTop();

            expect(mockPage.evaluate).toHaveBeenCalledWith(expect.any(Function));
        });
    });

    describe('setViewport', () => {
        test('should set viewport to default dimensions', async () => {
            const page = new ReportPage(mockPage, 'IE00BK5BQX27');

            await page.setViewport();

            expect(mockPage.setViewport).toHaveBeenCalledWith({ width: 1920, height: 1080 });
        });

        test('should set viewport to custom dimensions', async () => {
            const page = new ReportPage(mockPage, 'IE00BK5BQX27');

            await page.setViewport(1280, 720);

            expect(mockPage.setViewport).toHaveBeenCalledWith({ width: 1280, height: 720 });
        });
    });

    describe('_waitForChevron', () => {
        test('should wait for chevron selector and return element', async () => {
            const mockChevron = { click: jest.fn() };
            mockPage.waitForSelector.mockResolvedValue(undefined);
            mockPage.$.mockResolvedValue(mockChevron);

            const page = new ReportPage(mockPage, 'IE00BK5BQX27');
            const chevron = await page._waitForChevron();

            expect(mockPage.waitForSelector).toHaveBeenCalledWith(
                'a[role="button"].p-accordion-header-link chevronrighticon',
                { visible: true }
            );
            expect(chevron).toBe(mockChevron);
        });
    });

    describe('getTables', () => {
        test('should query all table elements', async () => {
            const mockTables = [{}, {}, {}];
            mockPage.$$.mockResolvedValue(mockTables);

            const page = new ReportPage(mockPage, 'IE00BK5BQX27');
            const tables = await page.getTables();

            expect(mockPage.$$).toHaveBeenCalledWith('table');
            expect(tables).toBe(mockTables);
        });
    });

    describe('getTableRows', () => {
        test('should query rows from a table element', async () => {
            const mockRows = [{}, {}];
            const mockTable = { $$: jest.fn().mockResolvedValue(mockRows) };

            const page = new ReportPage(mockPage, 'IE00BK5BQX27');
            const rows = await page.getTableRows(mockTable);

            expect(mockTable.$$).toHaveBeenCalledWith('tbody tr');
            expect(rows).toBe(mockRows);
        });
    });

    describe('scrollAndClick', () => {
        test('should scroll element into view and click it', async () => {
            const mockElement = {
                evaluate: jest.fn().mockResolvedValue(undefined),
                click: jest.fn().mockResolvedValue(undefined),
            };

            const page = new ReportPage(mockPage, 'IE00BK5BQX27');
            await page.scrollAndClick(mockElement);

            expect(mockElement.evaluate).toHaveBeenCalled();
            expect(mockElement.click).toHaveBeenCalled();
        });

        test('should fallback to JS click when direct click fails', async () => {
            const mockElement = {
                evaluate: jest.fn().mockResolvedValue(undefined),
                click: jest.fn().mockRejectedValue(new Error('not clickable')),
            };
            mockPage.evaluate.mockResolvedValue(undefined);

            const page = new ReportPage(mockPage, 'IE00BK5BQX27');
            await page.scrollAndClick(mockElement);

            expect(mockPage.evaluate).toHaveBeenCalledWith(expect.any(Function), mockElement);
        });
    });

    describe('clickChevron', () => {
        test('should wait for, scroll to, and click the chevron', async () => {
            const mockChevron = {
                evaluate: jest.fn().mockResolvedValue(undefined),
                click: jest.fn().mockResolvedValue(undefined),
            };
            mockPage.waitForSelector.mockResolvedValue(undefined);
            mockPage.$.mockResolvedValue(mockChevron);

            const page = new ReportPage(mockPage, 'IE00BK5BQX27');
            await page.clickChevron();

            expect(mockPage.waitForSelector).toHaveBeenCalled();
            expect(mockChevron.click).toHaveBeenCalled();
        });

        test('should throw error when chevron is not found', async () => {
            mockPage.waitForSelector.mockResolvedValue(undefined);
            mockPage.$.mockResolvedValue(null);

            const page = new ReportPage(mockPage, 'IE00BK5BQX27');

            await expect(page.clickChevron()).rejects.toThrow('Chevron icon not found');
        });
    });

    describe('BASE_URL', () => {
        test('should have correct base URL', () => {
            expect(ReportPage.BASE_URL).toBe(
                'https://my.oekb.at/kapitalmarkt-services/kms-output/fonds-info/sd/af/f'
            );
        });
    });
});
