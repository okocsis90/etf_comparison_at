import ReportService from './report/report.service.js';
import CurrencyExchangeRateService from './currency-exchange-rate/currency-exchange-rate.service.js';
import EtfPriceService, { NoPriceDataError } from './etf-price/etf-price.service.js';
import ScoreCalculatorService from './score-calculator/score-calculator.service.js';
import { ScoreInput, ReportEntry } from './score-calculator/score-input.js';
import ReportResult from './report/report-result.js';
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

    let reportResult;
    try {
      reportResult = await this.reportService.getReportResult(isin);
    } catch (error) {
      logger.warn(`OeKB report retrieval failed for ${isin}: ${error.message}`);
      reportResult = new ReportResult(isin, null);
      reportResult.addWarning('reports_unavailable', error.message);
    }
    const warnings = [...reportResult.warnings];
    logger.info(`Retrieved ${reportResult.reports.length} reports for ${isin}`);

    let etfInfo = null;
    try {
      etfInfo = await this.etfPriceService.getEtfInfo(isin);
    } catch (error) {
      logger.warn(`ETF metadata unavailable for ${isin}: ${error.message}`);
      warnings.push({ type: 'etf_metadata_unavailable', message: error.message });
    }

    let currentPrice = null;
    try {
      currentPrice = await this.etfPriceService.getCurrentPrice(isin);
    } catch (error) {
      logger.warn(`Current ETF price unavailable for ${isin}: ${error.message}`);
      warnings.push({ type: 'current_price_unavailable', message: error.message });
    }

    if (reportResult.reports.length === 0 || !currentPrice) {
      return this._createPartialResult(isin, reportResult, etfInfo, currentPrice, warnings);
    }

    let originalCurrency = reportResult.currency;
    if (!originalCurrency && currentPrice.currency) {
      originalCurrency = currentPrice.currency;
      const message = `OeKB report currency was unavailable; using the ${currentPrice.currency} listing currency for reported amounts.`;
      logger.warn(`${message} ISIN: ${isin}`);
      warnings.push({ type: 'report_currency_fallback', message });
    }
    if (!originalCurrency || !currentPrice.currency) {
      const message = 'A currency could not be confirmed for the report data and current ETF price.';
      logger.warn(`${message} ISIN: ${isin}`);
      warnings.push({ type: 'currency_unavailable', message });
      return this._createPartialResult(isin, reportResult, etfInfo, currentPrice, warnings);
    }

    // Find the first and last business-year dates used by the source reports.
    const sortedReports = [...reportResult.reports].sort(
      (a, b) => parseGermanDate(a.businessYearStart) - parseGermanDate(b.businessYearStart)
    );
    const firstBusinessYearStart = parseGermanDate(sortedReports[0].businessYearStart);
    const lastBusinessYearEnd = parseGermanDate(sortedReports[sortedReports.length - 1].businessYearEnd);

    const { scoreInput } = await this._buildScoreInput({
      isin,
      originalCurrency,
      reports: reportResult.reports,
      firstBusinessYearStart,
      lastBusinessYearEnd,
      currentPrice,
      warnings
    });

    if (!scoreInput || scoreInput.reports.length === 0) {
      return this._createPartialResult(isin, reportResult, etfInfo, currentPrice, warnings);
    }

    const scoreResult = this.scoreCalculatorService.calculateScore(scoreInput);
    scoreResult.analysisWarnings = warnings;
    scoreResult.priceDataWarnings = warnings.filter(warning => warning.type === 'historical_price_fallback');
    scoreResult.sourceReportCount = reportResult.reports.length;
    logger.info(`Score calculation completed for ISIN: ${isin}`);

    scoreResult.ticker = etfInfo?.ticker ?? currentPrice.ticker ?? null;
    scoreResult.name = etfInfo?.name ?? null;

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
    lastBusinessYearEnd,
    currentPrice,
    warnings
  }) {
    const [firstBoundary, lastBoundary] = await Promise.all([
      this._getBoundaryPrice(isin, firstBusinessYearStart, 'start', warnings),
      this._getBoundaryPrice(isin, lastBusinessYearEnd, 'end', warnings)
    ]);
    if (!firstBoundary || !lastBoundary) return { scoreInput: null };

    const priceAtFirstStart = firstBoundary.price;
    const priceAtLastEnd = lastBoundary.price;
    if (!priceAtFirstStart.currency || !priceAtLastEnd.currency) {
      const message = 'Historical ETF price currency was unavailable for a period boundary.';
      logger.warn(`${message} ISIN: ${isin}`);
      warnings.push({ type: 'currency_unavailable', message });
      return { scoreInput: null };
    }

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
      originalCurrency,
      warnings
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
      warnings
    };
  }

  async _getBoundaryPrice(isin, requestedDate, boundary, warnings) {
    try {
      const price = await this.etfPriceService.getPrice(isin, requestedDate);
      if (price && Number.isFinite(price.price) && price.currency) return { price };
      throw new NoPriceDataError(`No usable ${boundary} historical price was returned`);
    } catch (error) {
      if (error instanceof NoPriceDataError) {
        try {
          const price = boundary === 'start'
            ? await this.etfPriceService.getEarliestAvailablePrice(isin)
            : await this.etfPriceService.getLatestAvailablePriceBefore(isin, requestedDate);
          if (price && Number.isFinite(price.price) && price.currency) {
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
          throw new Error('No usable fallback price was returned');
        } catch (fallbackError) {
          warnings.push({
            type: 'historical_price_unavailable',
            boundary,
            requestedDate,
            message: `${error.message}; fallback failed: ${fallbackError.message}`
          });
          logger.warn(`No ${boundary} historical price for ${isin}: ${fallbackError.message}`);
          return null;
        }
      }

      warnings.push({
        type: 'historical_price_unavailable',
        boundary,
        requestedDate,
        message: error.message
      });
      logger.warn(`No ${boundary} historical price for ${isin}: ${error.message}`);
      return null;
    }
  }

  /**
   * Builds ReportEntry objects for each report, fetching ETF prices and exchange rates.
   */
  async _buildReportEntries(isin, reports, originalCurrency, warnings) {
    const entries = [];

    for (const report of reports) {
      const reportDate = parseGermanDate(report.date);

      let priceData;
      try {
        priceData = await this.etfPriceService.getPrice(isin, reportDate);
      } catch (error) {
        if (error instanceof NoPriceDataError) {
          const message = `Skipped OeKB report dated ${report.date}; ${error.message}`;
          logger.warn(
            `Skipping report for ${isin} on ${reportDate.toISOString().split('T')[0]}: ${error.message}`
          );
          warnings.push({
            type: 'report_price_unavailable',
            date: report.date,
            message
          });
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

  _createPartialResult(isin, reportResult, etfInfo, currentPrice, warnings) {
    if (reportResult.reports.length === 0 && !warnings.some(warning => warning.type === 'reports_unavailable')) {
      warnings.push({
        type: 'reports_unavailable',
        message: 'No OeKB yearly tax reports are available for this ISIN.'
      });
    }
    logger.warn(`Returning partial ETF data for ${isin}; tax score was not calculated`);
    return {
      isin,
      name: etfInfo?.name ?? null,
      ticker: etfInfo?.ticker ?? currentPrice?.ticker ?? null,
      originalCurrency: reportResult.currency ?? null,
      currentPrice: currentPrice
        ? { value: currentPrice.price, currency: currentPrice.currency ?? null }
        : null,
      reports: reportResult.reports,
      totalReports: reportResult.reports.length,
      isPartial: true,
      warnings
    };
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
