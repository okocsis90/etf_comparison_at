import ReportScraper from './report-scraper.js';
import ReportRepository from './report.repository.js';
import ReportResult from './report-result.js';
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

  /**
   * Returns the OeKB report result for the given ISIN.
   * Returns fresh cached data when available; otherwise scrapes OeKB and caches the result.
   * @param {string} isin - The ISIN to fetch reports for
   * @returns {Promise<ReportResult>}
   */
  async getReportResult(isin) {
    if (!isin) throw new Error('isin is required');
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
