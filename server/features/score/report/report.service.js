import ReportScraper from './report-scraper.js';

class ReportService {
  async getReportResult(isin) {
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
}

export default ReportService;
