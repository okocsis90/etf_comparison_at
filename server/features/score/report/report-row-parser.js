import reportSelectors from './report-selectors.js';

/**
 * Row parsing logic for report feature
 * Parses a report table row and extracts relevant fields.
 * Returns null if the row should be skipped (not a yearly report or missing columns).
 * @class ReportRowParser
 */
class ReportRowParser {
    static MINIMUM_COLUMNS = 9;
    static DATE_COLUMN_INDEX = 0;
    static YEARLY_REPORT_COLUMN_INDEX = 1;
    static BUSINESS_YEAR_START_INDEX = 7;
    static BUSINESS_YEAR_END_INDEX = 8;

    /**
     * Parses a Puppeteer row element for report data.
     * @param {ElementHandle} row - Puppeteer row element
     * @returns {Promise<{date: string, isYearlyReport: boolean, businessYearStart: string, businessYearEnd: string}|null>}
     */
    static async parse(row) {
        const tds = await row.$$(reportSelectors.rowTd);
        if (tds.length < ReportRowParser.MINIMUM_COLUMNS) return null;

        const date = await ReportRowParser.extractCellText(tds[ReportRowParser.DATE_COLUMN_INDEX]);
        const isYearlyReport = await ReportRowParser.checkIsYearlyReport(tds[ReportRowParser.YEARLY_REPORT_COLUMN_INDEX]);

        if (!isYearlyReport) return null;

        const businessYearStart = await ReportRowParser.extractCellText(tds[ReportRowParser.BUSINESS_YEAR_START_INDEX]);
        const businessYearEnd = await ReportRowParser.extractCellText(tds[ReportRowParser.BUSINESS_YEAR_END_INDEX]);

        return { date, isYearlyReport, businessYearStart, businessYearEnd };
    }

    /**
     * Extracts the text content from a table cell's inner div.
     * @param {ElementHandle} td - Puppeteer td element
     * @returns {Promise<string>}
     */
    static async extractCellText(td) {
        return td.$eval(reportSelectors.fundsTableInnerDiv, el => el.textContent.trim());
    }

    /**
     * Checks if the row represents a yearly report (Jahresmeldung).
     * @param {ElementHandle} td - Puppeteer td element
     * @returns {Promise<boolean>}
     */
    static async checkIsYearlyReport(td) {
        const text = await ReportRowParser.extractCellText(td);
        return text.toLowerCase() === reportSelectors.yearlyReportValue;
    }
}

export default ReportRowParser;
