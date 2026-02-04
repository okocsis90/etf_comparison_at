import ReportScraper from './reportScraper.js';

export async function getReportData(isin) {
  const scraper = new ReportScraper(isin);
  try {
    await scraper.launchBrowser();
    await scraper.gotoPage();
    await scraper.parseCurrencyValue();
    await scraper.clickChevron();
    await scraper.parseReport();
    return scraper.result;
  } finally {
    await scraper.close();
  }
}
