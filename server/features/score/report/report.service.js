import ReportScraper from './report-scraper.js';

/**
 * Service responsible for fetching report data for a given ISIN.
 * Manages the scraper lifecycle and returns a ReportResult.
 * @class ReportService
 */
class ReportService {
  async getReportResult(isin) {
    const scraper = new ReportScraper(isin);
    try {
      await scraper.launchBrowser();
      return await scraper.scrape();
    } finally {
      await scraper.close();
    }
  }
}

export default ReportService;
