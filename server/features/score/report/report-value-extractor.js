import reportSelectors from './report-selectors.js';

/**
 * Extracts values from report tables and page elements.
 * All extraction logic is centralized here for maintainability.
 * @class ReportValueExtractor
 */
export default class ReportValueExtractor {
    /**
     * Extracts the deemed income value (Ausschüttungsgleiche Erträge 936/937) from a details table.
     * @param {ElementHandle} detailsTable - Puppeteer table element
     * @returns {Promise<number|null>} Parsed value or null if not found
     */
    static async extractDeemedIncomeValue(detailsTable) {
        const detailRows = await detailsTable.$$(reportSelectors.tableRows);
        for (const detailRow of detailRows) {
            const labelText = await detailRow.$eval(reportSelectors.detailRowFirstTdDiv, el => el.textContent || '');
            if (ReportValueExtractor.isDeemedIncomeRow(labelText)) {
                const valueText = await detailRow.$eval(reportSelectors.detailRowSecondTdDiv, el => el.textContent || '');
                return ReportValueExtractor.parseGermanDecimal(valueText);
            }
        }
        return null;
    }

    /**
     * Checks if a row label matches deemed income identifiers (936 or 937).
     * @param {string} labelText - The label text of the row
     * @returns {boolean}
     */
    static isDeemedIncomeRow(labelText) {
        return reportSelectors.deemedIncomeIdentifiers.some(id => labelText.includes(id));
    }

    /**
     * Parses a German-formatted decimal string (comma as decimal separator).
     * Returns null if the input is empty or cannot be parsed as a finite number.
     * @param {string} text - The text to parse
     * @returns {number|null}
     */
    static parseGermanDecimal(text) {
        if (!text || typeof text !== 'string') return null;
        const value = parseFloat(text.trim().replace(',', '.'));
        return Number.isFinite(value) ? value : null;
    }

    /**
     * Extracts the currency value from the fundsTable div.
     * @param {import('puppeteer').Page} page - Puppeteer page instance
     * @returns {Promise<string|null>} The currency value or null if not found
     */
    static async extractCurrencyValue(page) {
        await page.waitForSelector(reportSelectors.fundsTable, { visible: true });
        const fundTableChildren = await page.$$(reportSelectors.fundsTableChildren);
        for (const child of fundTableChildren) {
            const innerDivs = await child.$$(reportSelectors.fundsTableInnerDiv);
            if (innerDivs.length >= 2) {
                const label = await page.evaluate(div => div.textContent.trim(), innerDivs[0]);
                if (label.includes(reportSelectors.currencyLabel)) {
                    return await page.evaluate(div => div.textContent.trim(), innerDivs[1]);
                }
            }
        }
        return null;
    }
}
