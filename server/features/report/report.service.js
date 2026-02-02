import ReportScraper from './reportScraper.js';

export async function getReportData(isin) {
  const scraper = new ReportScraper(isin);
  try {
    await scraper.launchBrowser();
    await scraper.gotoPage();
    await scraper.logCurrencyValue();
    await scraper.clickChevron();
    await scraper.parseReport();
    console.log(scraper.result);
    return scraper.result;
  } finally {
    await scraper.close();
  }
}
