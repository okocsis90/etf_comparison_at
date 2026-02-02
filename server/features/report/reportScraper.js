// reportScraper.js
import puppeteer from 'puppeteer';
import ReportPage from './reportPage.js';
import { delay } from './utils.js';
import ReportValueExtractor from './reportValueExtractor.js';
import ReportResult from './reportResult.js';

/**
 * Orchestrates the scraping process for the report page.
 * Handles browser lifecycle, navigation, and delegates value extraction.
 */
class ReportScraper {
  constructor(isin) {
    this.isin = isin;
    this.browser = null;
    this.reportPage = null;
    this.result = null;
  }

  async launchBrowser() {
    this.browser = await puppeteer.launch({ headless: false, defaultViewport: null, args: ['--start-maximized'] });
    const page = await this.browser.newPage();
    this.reportPage = new ReportPage(page, this.isin);
    await this.reportPage.setViewport();
  }

  async gotoPage() {
    await this.reportPage.gotoPage();
    await this.reportPage.scrollToTop();
    await delay(1000);
  }

  async clickChevron() {
    const chevron = await this.reportPage.waitForChevron();
    if (!chevron) throw new Error('Chevron icon not found');
    await chevron.evaluate(el => el.scrollIntoView({ behavior: 'auto', block: 'center' }));
    await delay(400);
    try {
      await chevron.click();
    } catch {
      await this.reportPage.page.evaluate(el => el.click(), chevron);
    }
    await delay(800);
  }

  /**
   * Logs the currency value using the extraction logic from ReportValueExtractor.
   */
  async logCurrencyValue() {
    const currencyValue = await ReportValueExtractor.extractCurrencyValue(this.reportPage.page);
    if (currencyValue) {
      if (!this.result) {
        this.result = new ReportResult(this.isin, currencyValue);
      } else {
        this.result.currency = currencyValue;
      }
      console.log(`Currency value: ${currencyValue}`);
    } else {
      console.log('Currency value not found');
    }
  }

  async parseReport() {
    const tables = await this.getTables();
    if ((await tables).length < 2) throw new Error('Expected at least 2 tables for report parsing');
    await this.parseReportRows((await tables)[1]);
  }

  async getTables() {
    const tables = await this.reportPage.getTables();
    if ((await tables).length < 3) throw new Error('Expected at least 3 tables after chevron click');
    return tables;
  }

  async parseReportRows(reportTable) {
    const rows = await this.reportPage.getTableRows(reportTable);
    for (let i = 0; i < (await rows).length; i++) {
      await this.handleReportRow((await rows)[i], i);
    }
  }

  async handleReportRow(row, rowIndex) {
    // Extract all td elements from the row
    const tds = await row.$$('td');
    if (tds.length < 9) {
      console.log(`Row ${rowIndex + 1}: Not enough columns, skipping.`);
      return;
    }
    // Extract date from first td
    const date = await tds[0].$eval('div', el => el.textContent.trim());
    // Extract Ja/Nein from second td
    const shouldParseRow = await tds[1].$eval('div', el => el.textContent.trim().toLowerCase());
    if (shouldParseRow !== 'ja') {
      console.log(`Row ${rowIndex + 1}: Skipped (Not Jahresmeldung)`);
      return;
    }
    // Extract businessYearStart from eighth td
    const businessYearStart = await tds[7].$eval('div', el => el.textContent.trim());
    // Extract businessYearEnd from ninth td
    const businessYearEnd = await tds[8].$eval('div', el => el.textContent.trim());
    // Scroll, click, and extract deemedIncome as before
    await row.evaluate(el => el.scrollIntoView({ behavior: 'auto', block: 'center' }));
    await delay(200);
    await row.click();
    await delay(800);
    const tablesAfterClick = await this.reportPage.getTables();
    if ((await tablesAfterClick).length < 3) return;
    const detailsTable = (await tablesAfterClick)[2];
    const value = await ReportValueExtractor.extract936937Value(detailsTable);
    const reportObj = {
      date,
      deemedIncome: value,
      businessYearStart,
      businessYearEnd,
    };
    if (value !== null) {
      if (!this.result) {
        this.result = new ReportResult(this.isin, null);
      }
      this.result.addReport(reportObj);
      console.log(`Row ${rowIndex + 1}: Ausschüttungsgleiche Erträge = ${value}`);
    } else {
      console.log(`Row ${rowIndex + 1}: No Ausschüttungsgleiche Erträge 936/937 found`);
    }
  }

  async close() {
    if (this.browser) await this.browser.close();
  }
}

export default ReportScraper;
