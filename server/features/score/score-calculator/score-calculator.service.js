import { ScoreResult, ReportMetric } from './score-result.js';
import logger from '../../../shared/logger.js';

/**
 * Calculates score metrics based on the provided ScoreInput.
 * This is a pure business logic service - it receives all data it needs
 * and performs calculations without fetching any external data.
 */
class ScoreCalculatorService {
  /**
   * Calculates all score metrics from the provided input.
   * @param {import('./score-input.js').ScoreInput} scoreInput - The prepared input data
   * @returns {ScoreResult} The calculated score metrics
   */
  calculateScore(scoreInput) {
    logger.info(`Calculating score for ISIN: ${scoreInput.isin}`);

    const {
      isin,
      originalCurrency,
      reports,
      etfPriceAtFirstBusinessYearStartEur,
      etfPriceAtLastBusinessYearEndEur,
      currentEtfPriceEur,
      firstBusinessYearStart,
      lastBusinessYearEnd
    } = scoreInput;

    // Calculate total gains (price difference)
    const totalGains = etfPriceAtLastBusinessYearEndEur - etfPriceAtFirstBusinessYearStartEur;

    // Calculate sum of all deemed incomes (EUR)
    const deemedGains = reports.reduce((sum, r) => sum + r.deemedIncomeEur, 0);

    // Deemed gains as percentage of total gains
    const deemedGainsToTotalGainsPercent = totalGains !== 0
      ? (deemedGains / totalGains) * 100
      : 0;

    // Build per-report metrics
    const reportMetrics = reports.map(report => {
      const deemedIncomeToEtfPricePercent = report.etfPriceOnDateEur !== 0
        ? (report.deemedIncomeEur / report.etfPriceOnDateEur) * 100
        : 0;

      return new ReportMetric({
        date: report.date,
        deemedIncomeEur: report.deemedIncomeEur,
        etfPriceOnDateEur: report.etfPriceOnDateEur,
        deemedIncomeToEtfPricePercent
      });
    });

    // Average of deemed income to ETF price percentages
    const avgEtfPriceToDeemedIncomePercent = reportMetrics.length > 0
      ? reportMetrics.reduce((sum, m) => sum + m.deemedIncomeToEtfPricePercent, 0) / reportMetrics.length
      : 0;

    // Average deemed income
    const avgDeemedIncomeEur = reports.length > 0
      ? deemedGains / reports.length
      : 0;

    // Maximum difference between any two deemed incomes
    const maxDeemedIncomeDiffEur = this._calculateMaxDiff(reports.map(r => r.deemedIncomeEur));

    // Max diff as percentage of average deemed income
    const maxDiffToAvgDeemedIncomePercent = avgDeemedIncomeEur !== 0
      ? (maxDeemedIncomeDiffEur / avgDeemedIncomeEur) * 100
      : 0;

    // Average deemed income as percentage of current ETF price
    const avgDeemedIncomeToCurrentEtfPricePercent = currentEtfPriceEur !== 0
      ? (avgDeemedIncomeEur / currentEtfPriceEur) * 100
      : 0;

    return new ScoreResult({
      isin,
      originalCurrency,
      totalGains,
      deemedGains,
      deemedGainsToTotalGainsPercent,
      reportMetrics,
      avgEtfPriceToDeemedIncomePercent,
      avgDeemedIncomeEur,
      maxDeemedIncomeDiffEur,
      maxDiffToAvgDeemedIncomePercent,
      avgDeemedIncomeToCurrentEtfPricePercent,
      currentEtfPriceEur,
      etfPriceAtFirstBusinessYearStartEur,
      etfPriceAtLastBusinessYearEndEur,
      firstBusinessYearStart,
      lastBusinessYearEnd,
      totalReports: reports.length
    });
  }

  /**
   * Calculates the maximum difference between any two values in the array.
   * @param {number[]} values - Array of numeric values
   * @returns {number} Maximum difference
   */
  _calculateMaxDiff(values) {
    if (values.length < 2) return 0;

    const min = Math.min(...values);
    const max = Math.max(...values);
    return max - min;
  }
}

export default ScoreCalculatorService;
