import puppeteer from 'puppeteer';
import ReportPage from './report-page.js';
import { delay } from '../../../shared/utils.js';
import ReportValueExtractor from './report-value-extractor.js';
import ReportResult from './report-result.js';
import ReportRowParser from './report-row-parser.js';
import logger from '../../../shared/logger.js';

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
    }

    // --- Browser Lifecycle ---

    async launchBrowser() {
        this.browser = await puppeteer.launch({
            headless: true,
        });
        const page = await this.browser.newPage();
        this.reportPage = new ReportPage(page, this.isin);
        await this.reportPage.setViewport();
    }

    async close() {
        if (this.browser) await this.browser.close();
    }

    // --- Scraping Pipeline ---

    /**
     * Executes the full scraping pipeline and returns the result.
     * @returns {Promise<ReportResult>}
     */
    async scrape() {
        await this._navigateToPage();
        const currency = await this._extractCurrency();
        await this.reportPage.clickChevron();
        const reports = await this._extractReports();
        return this._buildResult(currency, reports);
    }

    // --- Private: Navigation ---

    async _navigateToPage() {
        await this.reportPage.gotoPage();
        await this.reportPage.scrollToTop();
        await delay(1000);
    }

    // --- Private: Extraction ---

    async _extractCurrency() {
        const currency = await ReportValueExtractor.extractCurrencyValue(this.reportPage.page);
        if (currency) {
            logger.info(`Currency value: ${currency}`);
        } else {
            logger.warn('Currency value not found');
        }
        return currency;
    }

    async _extractReports() {
        const tables = await this.reportPage.getTables();
        this._validateTablesCount(tables);
        return this._parseReportRows(tables[ReportScraper.REPORT_TABLE_INDEX]);
    }

    _validateTablesCount(tables) {
        if (tables.length < ReportScraper.MIN_TABLES_AFTER_CHEVRON) {
            throw new Error(`Expected at least ${ReportScraper.MIN_TABLES_AFTER_CHEVRON} tables after chevron click`);
        }
    }

    async _parseReportRows(reportTable) {
        const rows = await this.reportPage.getTableRows(reportTable);
        const reports = [];
        for (let i = 0; i < rows.length; i++) {
            const report = await this._extractReportFromRow(rows[i], i);
            if (report) reports.push(report);
        }
        return reports;
    }

    async _extractReportFromRow(row, rowIndex) {
        const rowData = await ReportRowParser.parse(row);
        if (!rowData) {
            logger.info(`Row ${rowIndex + 1}: Skipped (Not a yearly report or missing columns)`);
            return null;
        }

        await this.reportPage.scrollAndClick(row);
        await delay(600);

        const tablesAfterClick = await this.reportPage.getTables();
        if (tablesAfterClick.length < ReportScraper.MIN_TABLES_AFTER_CHEVRON) return null;

        const detailsTable = tablesAfterClick[ReportScraper.DETAILS_TABLE_INDEX];
        const deemedIncome = await ReportValueExtractor.extractDeemedIncomeValue(detailsTable);

        if (deemedIncome !== null) {
            logger.info(`Row ${rowIndex + 1}: Deemed income = ${deemedIncome}`);
            return {
                date: rowData.date,
                deemedIncome,
                businessYearStart: rowData.businessYearStart,
                businessYearEnd: rowData.businessYearEnd,
            };
        }

        logger.warn(`Row ${rowIndex + 1}: No deemed income (936/937) found`);
        return null;
    }

    // --- Private: Result Construction ---

    _buildResult(currency, reports) {
        const result = new ReportResult(this.isin, currency);
        for (const report of reports) {
            result.addReport(report);
        }
        return result;
    }
}

export default ReportScraper;


