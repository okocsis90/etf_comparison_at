import ReportScraper from './report-scraper.js';
import ReportRepository from './report.repository.js';
import logger from '../../../shared/logger.js';

/**
 * Service responsible for fetching report data for a given ISIN.
 * Returns cached data when available, otherwise scrapes OeKB and caches the result.
 * @class ReportService
 */
class ReportService {
  constructor() {
    this.repository = new ReportRepository();
  }

  async getReportResult(isin) {
    const cached = this.repository.findFresh(isin);
    if (cached) {
      logger.info(`Returning cached OeKB reports for ${isin}`);
      return cached;
    }

    logger.info(`No fresh cache for ${isin}, scraping OeKB...`);
    const scraper = new ReportScraper(isin);
    try {
      await scraper.launchBrowser();
      const result = await scraper.scrape();
      this.repository.save(result);
      return result;
    } finally {
      await scraper.close();
    }
  }
}

export default ReportService;
