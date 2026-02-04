import puppeteer from 'puppeteer';
import ReportPage from './report-page.js';
import { delay } from '../../../shared/utils.js';
import ReportValueExtractor from './report-value-extractor.js';
import ReportResult from './report-result.js';
import ReportRowParser from './report-row-parser.js';
import Logger from '../../../shared/logger.js';

/**
 * Orchestrates the scraping process for the report page.
 * Handles browser lifecycle and delegates navigation to ReportPage,
 * value extraction to ReportValueExtractor, and row parsing to ReportRowParser.
 * @class ReportScraper
 */
class ReportScraper {
    static REPORT_TABLE_INDEX = 1;
    static DETAILS_TABLE_INDEX = 2;
    static MIN_TABLES_AFTER_CHEVRON = 3;

    constructor(isin) {
        this.isin = isin;
        this.browser = null;
        this.reportPage = null;
        this.result = null;
    }

    // --- Browser Lifecycle ---

    async launchBrowser() {
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ['--start-maximized'],
        });
        const page = await this.browser.newPage();
        this.reportPage = new ReportPage(page, this.isin);
        await this.reportPage.setViewport();
    }

    async close() {
        if (this.browser) await this.browser.close();
    }

    // --- Navigation ---

    async gotoPage() {
        await this.reportPage.gotoPage();
        await this.reportPage.scrollToTop();
        await delay(1000);
    }

    async clickChevron() {
        await this.reportPage.clickChevron();
    }

    // --- Parsing ---

    async parseCurrencyValue() {
        const currencyValue = await ReportValueExtractor.extractCurrencyValue(this.reportPage.page);
        this.initResultIfNeeded(currencyValue);
        if (currencyValue) {
            Logger.info(`Currency value: ${currencyValue}`);
        } else {
            Logger.warn('Currency value not found');
        }
    }

    initResultIfNeeded(currency = null) {
        if (!this.result) {
            this.result = new ReportResult(this.isin, currency);
        } else if (currency) {
            this.result.currency = currency;
        }
    }

    async parseReport() {
        const tables = await this.reportPage.getTables();
        this.validateTablesCount(tables);
        await this.parseReportRows(tables[ReportScraper.REPORT_TABLE_INDEX]);
    }

    validateTablesCount(tables) {
        if (tables.length < ReportScraper.MIN_TABLES_AFTER_CHEVRON) {
            throw new Error(`Expected at least ${ReportScraper.MIN_TABLES_AFTER_CHEVRON} tables after chevron click`);
        }
    }

    async parseReportRows(reportTable) {
        const rows = await this.reportPage.getTableRows(reportTable);
        for (let i = 0; i < rows.length; i++) {
            await this.handleReportRow(rows[i], i);
        }
    }

    async handleReportRow(row, rowIndex) {
        const rowData = await ReportRowParser.parse(row);
        if (!rowData) {
            Logger.info(`Row ${rowIndex + 1}: Skipped (Not a yearly report or missing columns)`);
            return;
        }
        await this.reportPage.scrollAndClick(row);
        await delay(600);

        const tablesAfterClick = await this.reportPage.getTables();
        if (tablesAfterClick.length < ReportScraper.MIN_TABLES_AFTER_CHEVRON) return;

        const detailsTable = tablesAfterClick[ReportScraper.DETAILS_TABLE_INDEX];
        const deemedIncome = await ReportValueExtractor.extractDeemedIncomeValue(detailsTable);

        if (deemedIncome !== null) {
            this.initResultIfNeeded();
            this.result.addReport({
                date: rowData.date,
                deemedIncome,
                businessYearStart: rowData.businessYearStart,
                businessYearEnd: rowData.businessYearEnd,
            });
            Logger.info(`Row ${rowIndex + 1}: Deemed income = ${deemedIncome}`);
        } else {
            Logger.warn(`Row ${rowIndex + 1}: No deemed income (936/937) found`);
        }
    }
}

export default ReportScraper;
