// reportValueExtractor.js
// Extracts the Ausschüttungsgleiche Erträge value from a details table

import reportSelectors from './reportSelectors.js';

export default class ReportValueExtractor {
  static async extract936937Value(detailsTable) {
    const detailRows = await detailsTable.$$(reportSelectors.tableRows);
    for (const detailRow of detailRows) {
      const firstTdDivText = await detailRow.$eval(reportSelectors.detailRowFirstTdDiv, el => el.textContent || '');
      if (firstTdDivText.includes('936') || firstTdDivText.includes('937')) {
        const secondTdDivText = await detailRow.$eval(reportSelectors.detailRowSecondTdDiv, el => el.textContent || '');
        return parseFloat(secondTdDivText.replace(',', '.'));
      }
    }
    return null;
  }

  /**
   * Extracts the currency value from the fundsTable div.
   * @param {import('puppeteer').Page} page - Puppeteer page instance
   * @returns {Promise<string|null>} The currency value or null if not found
   */
  static async extractCurrencyValue(page) {
    await page.waitForSelector('div.funds-table', { visible: true });
    const fundTableChildren = await page.$$('div.funds-table > div');
    for (const child of fundTableChildren) {
      const innerDivs = await child.$$('div');
      if (innerDivs.length >= 2) {
        const label = await page.evaluate(div => div.textContent.trim(), innerDivs[0]);
        if (label.includes('Währung')) {
          return await page.evaluate(div => div.textContent.trim(), innerDivs[1]);
        }
      }
    }
    return null;
  }
}
