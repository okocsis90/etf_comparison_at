/**
 * Parses a report table row and extracts relevant fields.
 * Returns null if the row should be skipped (Ja/Nein not 'ja' or not enough columns).
 * @class ReportRowParser
 */
class ReportRowParser {
  /**
   * Parses a Puppeteer row element for report data.
   * @param {ElementHandle} row - Puppeteer row element
   * @returns {Promise<{date: string, businessYearStart: string, businessYearEnd: string}|null>}
   */
  static async parse(row) {
    const tds = await row.$$('td');
    if (tds.length < 9) return null;
    const date = await tds[0].$eval('div', el => el.textContent.trim());
    const jaNein = await tds[1].$eval('div', el => el.textContent.trim().toLowerCase());
    if (jaNein !== 'ja') return null;
    const businessYearStart = await tds[7].$eval('div', el => el.textContent.trim());
    const businessYearEnd = await tds[8].$eval('div', el => el.textContent.trim());
    return { date, businessYearStart, businessYearEnd };
  }
}

export default ReportRowParser;
