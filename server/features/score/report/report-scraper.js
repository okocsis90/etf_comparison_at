/* global process */
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

    constructor(isin) {
        this.isin = isin;
        this.browser = null;
        this.reportPage = null;
        this.warnings = [];
    }

    // --- Browser Lifecycle ---

    async launchBrowser() {
        this.browser = await puppeteer.launch({
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH
                || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
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
        this.warnings = [];
        await this._navigateToPage();
        const currency = await this._extractCurrency();
        const expanded = await this.reportPage.clickChevron();
        if (!expanded) {
            this._addWarning('report_table_unavailable', 'OeKB report section was not present on the page.');
        }
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
            this._addWarning('report_currency_unavailable', 'OeKB did not expose the fund currency.');
        }
        return currency;
    }

    async _extractReports() {
        const bodyText = await this.reportPage.getBodyText();
        if (/keine\s+steuermeldungen\s+vorhanden|keine\s+meldungen\s+vorhanden/i.test(bodyText)) {
            logger.warn(`OeKB reports unavailable for ${this.isin}: page says no tax reports are available`);
            this._addWarning('reports_unavailable', 'OeKB reports that no tax reports are available for this ISIN.');
            return [];
        }

        const tables = await this.reportPage.getTables();
        if (tables.length === 0) {
            logger.warn(`OeKB report table unavailable for ${this.isin}`);
            this._addWarning('report_table_unavailable', 'OeKB did not provide a report table for this ISIN.');
            return [];
        }

        if (tables.length < 3) {
            logger.warn(`OeKB report layout changed for ${this.isin}: found ${tables.length} table(s)`);
            this._addWarning('report_layout_changed', `OeKB returned ${tables.length} table(s); report details may be incomplete.`);
        }

        const reportTable = tables.length > ReportScraper.REPORT_TABLE_INDEX
            ? tables[ReportScraper.REPORT_TABLE_INDEX]
            : tables[0];
        return this._parseReportRows(reportTable);
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
        if (tablesAfterClick.length <= ReportScraper.DETAILS_TABLE_INDEX) {
            this._addWarning('report_details_unavailable', `OeKB did not expose details for report ${rowData.date}.`);
            return null;
        }

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
        for (const warning of this.warnings) {
            result.addWarning(warning.type, warning.message);
        }
        if (reports.length === 0 && !this.warnings.some(warning => warning.type === 'reports_unavailable')) {
            result.addWarning('reports_unavailable', 'OeKB did not provide any usable yearly tax reports.');
        }
        return result;
    }

    _addWarning(type, message) {
        this.warnings.push({ type, message });
    }
}

export default ReportScraper;
