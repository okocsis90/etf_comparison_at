import ReportService from './report/report.service.js';
import CurrencyExchangeRateService from './currency-exchange-rate/currency-exchange-rate.service.js';
import EtfPriceService, { NoPriceDataError } from './etf-price/etf-price.service.js';
import ScoreCalculatorService from './score-calculator/score-calculator.service.js';
import { ScoreInput, ReportEntry } from './score-calculator/score-input.js';
import logger from '../../shared/logger.js';
import { parseGermanDate } from '../../shared/utils.js';

/**
 * Orchestrates the score calculation by:
 * 1. Fetching report data
 * 2. Converting currencies to EUR if needed
 * 3. Fetching ETF prices for relevant dates
 * 4. Building the ScoreInput and delegating to ScoreCalculatorService
 */
class ScoreService {
  constructor() {
    this.reportService = new ReportService();
    this.currencyExchangeRateService = new CurrencyExchangeRateService();
    this.etfPriceService = new EtfPriceService();
    this.scoreCalculatorService = new ScoreCalculatorService();
  }

  async getScore(isin) {
    logger.info(`Starting score calculation for ISIN: ${isin}`);

    // Step 1: Get report result
    const reportResult = await this.reportService.getReportResult(isin);
    logger.info(`Retrieved ${reportResult.reports.length} reports for ${isin}`);

    if (reportResult.reports.length === 0) {
      throw new Error(`No reports found for ISIN: ${isin}`);
    }

    const originalCurrency = reportResult.currency;

    // Step 2: Get first and last business year dates
    const sortedReports = [...reportResult.reports].sort(
      (a, b) => parseGermanDate(a.businessYearStart) - parseGermanDate(b.businessYearStart)
    );
    const firstBusinessYearStart = parseGermanDate(sortedReports[0].businessYearStart);
    const lastBusinessYearEnd = parseGermanDate(sortedReports[sortedReports.length - 1].businessYearEnd);

    // Step 3: Build ScoreInput with all required data
    const { scoreInput, priceDataWarnings } = await this._buildScoreInput({
      isin,
      originalCurrency,
      reports: reportResult.reports,
      firstBusinessYearStart,
      lastBusinessYearEnd
    });

    // Step 4: Calculate score
    const scoreResult = this.scoreCalculatorService.calculateScore(scoreInput);
    scoreResult.priceDataWarnings = priceDataWarnings;
    logger.info(`Score calculation completed for ISIN: ${isin}`);

    // Step 5: Attach ETF metadata (name + ticker) — looked up separately so the
    // pure ScoreCalculatorService stays free of metadata concerns.
    const etfInfo = await this.etfPriceService.getEtfInfo(isin);
    scoreResult.ticker = etfInfo?.ticker ?? null;
    scoreResult.name   = etfInfo?.name   ?? null;

    return scoreResult;
  }

  /**
   * Builds the ScoreInput by fetching all required prices and exchange rates.
   */
  async _buildScoreInput({
    isin,
    originalCurrency,
    reports,
    firstBusinessYearStart,
    lastBusinessYearEnd
  }) {
    const priceDataWarnings = [];
    const [firstBoundary, lastBoundary, currentPrice] = await Promise.all([
      this._getBoundaryPrice(isin, firstBusinessYearStart, 'start', priceDataWarnings),
      this._getBoundaryPrice(isin, lastBusinessYearEnd, 'end', priceDataWarnings),
      this.etfPriceService.getCurrentPrice(isin)
    ]);
    const priceAtFirstStart = firstBoundary.price;
    const priceAtLastEnd = lastBoundary.price;

    // Convert boundary prices to EUR if needed
    const etfPriceAtFirstBusinessYearStartEur = await this._convertToEur(
      priceAtFirstStart.price,
      priceAtFirstStart.currency,
      priceAtFirstStart.resultDate
    );

    const etfPriceAtLastBusinessYearEndEur = await this._convertToEur(
      priceAtLastEnd.price,
      priceAtLastEnd.currency,
      priceAtLastEnd.resultDate
    );

    const currentEtfPriceEur = await this._convertToEur(
      currentPrice.price,
      currentPrice.currency,
      new Date()
    );

    // Build report entries with ETF prices and currency conversions
    const reportEntries = await this._buildReportEntries(
      isin,
      reports,
      originalCurrency
    );

    return {
      scoreInput: new ScoreInput({
        isin,
        originalCurrency,
        reports: reportEntries,
        etfPriceAtFirstBusinessYearStartEur,
        etfPriceAtLastBusinessYearEndEur,
        currentEtfPriceEur,
        firstBusinessYearStart,
        lastBusinessYearEnd
      }),
      priceDataWarnings
    };
  }

  async _getBoundaryPrice(isin, requestedDate, boundary, warnings) {
    try {
      return { price: await this.etfPriceService.getPrice(isin, requestedDate) };
    } catch (error) {
      if (!(error instanceof NoPriceDataError)) throw error;

      const price = boundary === 'start'
        ? await this.etfPriceService.getEarliestAvailablePrice(isin)
        : await this.etfPriceService.getLatestAvailablePriceBefore(isin, requestedDate);
      warnings.push({
        type: 'historical_price_fallback',
        boundary,
        ticker: price.ticker,
        requestedDate,
        usedDate: price.resultDate,
        message: error.message
      });
      logger.warn(
        `Using ${boundary} price fallback for ${isin}: requested ${requestedDate.toISOString().split('T')[0]}, ` +
        `using ${price.resultDate.toISOString().split('T')[0]}`
      );
      return { price };
    }
  }

  /**
   * Builds ReportEntry objects for each report, fetching ETF prices and exchange rates.
   */
  async _buildReportEntries(isin, reports, originalCurrency) {
    const entries = [];

    for (const report of reports) {
      const reportDate = parseGermanDate(report.date);

      let priceData;
      try {
        priceData = await this.etfPriceService.getPrice(isin, reportDate);
      } catch (error) {
        if (error instanceof NoPriceDataError) {
          // Report predates the ETF's available price history (e.g. before inception).
          // Skip this entry so scoring can proceed with the remaining reports.
          logger.warn(
            `Skipping report for ${isin} on ${reportDate.toISOString().split('T')[0]}: ${error.message}`
          );
          continue;
        }
        throw error;
      }

      const etfPriceOnDateEur = await this._convertToEur(
        priceData.price,
        priceData.currency,
        priceData.resultDate
      );

      const deemedIncomeEur = await this._convertToEur(
        report.deemedIncome,
        originalCurrency,
        reportDate
      );

      entries.push(new ReportEntry({
        date: reportDate,
        deemedIncomeOriginal: report.deemedIncome,
        deemedIncomeEur,
        businessYearStart: parseGermanDate(report.businessYearStart),
        businessYearEnd: parseGermanDate(report.businessYearEnd),
        etfPriceOnDateEur
      }));
    }

    return entries;
  }

  /**
   * Converts an amount to EUR if it's not already in EUR.
   */
  async _convertToEur(amount, currency, date) {
    if (currency === 'EUR') {
      return amount;
    }

    const exchangeRate = await this.currencyExchangeRateService.getExchangeRate(currency, date);
    return amount * exchangeRate.exchangeRateCurrencyToEur;
  }
}

export default ScoreService;
