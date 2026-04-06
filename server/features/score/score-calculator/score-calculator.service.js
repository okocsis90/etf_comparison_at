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
    if (!scoreInput) throw new Error('scoreInput is required');
    if (!scoreInput.isin) throw new Error('scoreInput.isin is required');
    if (!Array.isArray(scoreInput.reports)) throw new Error('scoreInput.reports must be an array');

    const numericFields = [
      'etfPriceAtFirstBusinessYearStartEur',
      'etfPriceAtLastBusinessYearEndEur',
      'currentEtfPriceEur',
    ];
    for (const field of numericFields) {
      if (!Number.isFinite(scoreInput[field])) {
        throw new Error(`scoreInput.${field} must be a finite number, got: ${scoreInput[field]}`);
      }
    }

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

    // Average of (deemed income / ETF price) percentages across all reports
    const avgDeemedIncomeToEtfPricePercent = reportMetrics.length > 0
      ? reportMetrics.reduce((sum, m) => sum + m.deemedIncomeToEtfPricePercent, 0) / reportMetrics.length
      : 0;

    // Average deemed income
    const avgDeemedIncomeEur = reports.length > 0
      ? deemedGains / reports.length
      : 0;

    // Maximum difference between any two deemed incomes
    const maxDeemedIncomeDiffEur = this._calculateMaxDiff(reports.map(r => r.deemedIncomeEur));

    // Max diff as percentage of average ETF price on report dates
    const avgEtfPriceEur = reportMetrics.length > 0
      ? reportMetrics.reduce((sum, r) => sum + r.etfPriceOnDateEur, 0) / reportMetrics.length
      : 0;
    const maxDiffToAvgEtfPricePercent = avgEtfPriceEur !== 0
      ? (maxDeemedIncomeDiffEur / avgEtfPriceEur) * 100
      : 0;

    // Average deemed income as percentage of current ETF price
    const avgDeemedIncomeToCurrentEtfPricePercent = currentEtfPriceEur !== 0
      ? (avgDeemedIncomeEur / currentEtfPriceEur) * 100
      : 0;

    const { taxEfficiencyGrade, taxEfficiencyScore, taxEfficiencyScoreBreakdown } =
      this._calculateTaxEfficiencyGrade({
        avgDeemedIncomeToEtfPricePercent,
        deemedGainsToTotalGainsPercent,
        totalGains,
        reportMetrics,
      });

    return new ScoreResult({
      isin,
      originalCurrency,
      totalGains,
      deemedGains,
      deemedGainsToTotalGainsPercent,
      reportMetrics,
      avgDeemedIncomeToEtfPricePercent,
      avgDeemedIncomeEur,
      maxDeemedIncomeDiffEur,
      maxDiffToAvgEtfPricePercent,
      avgDeemedIncomeToCurrentEtfPricePercent,
      currentEtfPriceEur,
      etfPriceAtFirstBusinessYearStartEur,
      etfPriceAtLastBusinessYearEndEur,
      firstBusinessYearStart,
      lastBusinessYearEnd,
      totalReports: reports.length,
      taxEfficiencyGrade,
      taxEfficiencyScore,
      taxEfficiencyScoreBreakdown,
    });
  }

  /**
   * Calculates the Austrian tax-efficiency grade (A–E) and its numeric score.
   *
   * Three components, each scored 0–100:
   *   1. Tax Burden     (base weight 50 %) – avg deemed income / ETF price %
   *      Linear: 0 % → 100 pts, 2 %+ → 0 pts
   *   2. Consistency    (base weight 35 %) – Coefficient of Variation of
   *      per-year deemed/price ratios. CV 0 → 100 pts, CV ≥ 1.5 → 0 pts.
   *      Fewer than 2 reports → neutral 50 pts (can't judge).
   *   3. Deemed/Gains   (base weight 15 %) – deemed gains / total gains %.
   *      Linear: 0 % → 100 pts, 100 %+ → 0 pts.
   *      Excluded (weights redistributed proportionally) when total gains
   *      are non-positive or the ratio is outside [0, 200 %].
   *
   * Grade thresholds: A ≥ 80, B ≥ 60, C ≥ 40, D ≥ 20, E < 20.
   *
   * @param {{ avgDeemedIncomeToEtfPricePercent: number, deemedGainsToTotalGainsPercent: number, totalGains: number, reportMetrics: import('./score-result.js').ReportMetric[] }} params
   * @returns {{ taxEfficiencyGrade: string, taxEfficiencyScore: number, taxEfficiencyScoreBreakdown: object }}
   */
  _calculateTaxEfficiencyGrade({ avgDeemedIncomeToEtfPricePercent, deemedGainsToTotalGainsPercent, totalGains, reportMetrics }) {
    const W1 = 0.50, W2 = 0.35, W3 = 0.15;

    // ── Component 1: Annual Tax Burden ──────────────────────────────────────
    const taxBurdenScore = Math.max(0, 100 * (1 - avgDeemedIncomeToEtfPricePercent / 2.0));

    // ── Component 2: Year-over-Year Consistency ──────────────────────────────
    const rates = reportMetrics.map(m => m.deemedIncomeToEtfPricePercent);
    const cv = this._coefficientOfVariation(rates);
    const consistencyScore = reportMetrics.length < 2
      ? 50
      : Math.max(0, 100 * (1 - cv / 1.5));

    // ── Component 3: Deemed vs Total Gains ──────────────────────────────────
    const gainsRatioUsable = totalGains > 0
      && deemedGainsToTotalGainsPercent >= 0
      && deemedGainsToTotalGainsPercent <= 200;
    const deemedToGainsScore = gainsRatioUsable
      ? Math.max(0, 100 - deemedGainsToTotalGainsPercent)
      : null;

    // ── Weighted total ───────────────────────────────────────────────────────
    let numericScore;
    let effectiveWeights;

    if (deemedToGainsScore === null) {
      // Redistribute component 3's weight proportionally between 1 and 2
      const w1eff = W1 / (W1 + W2);
      const w2eff = W2 / (W1 + W2);
      effectiveWeights = { taxBurden: w1eff, consistency: w2eff, deemedToGains: 0 };
      numericScore = taxBurdenScore * w1eff + consistencyScore * w2eff;
    } else {
      effectiveWeights = { taxBurden: W1, consistency: W2, deemedToGains: W3 };
      numericScore = taxBurdenScore * W1 + consistencyScore * W2 + deemedToGainsScore * W3;
    }

    const grade = numericScore >= 80 ? 'A'
      : numericScore >= 60 ? 'B'
      : numericScore >= 40 ? 'C'
      : numericScore >= 20 ? 'D'
      : 'E';

    const round1 = (v) => Math.round(v * 10) / 10;

    return {
      taxEfficiencyGrade: grade,
      taxEfficiencyScore: round1(numericScore),
      taxEfficiencyScoreBreakdown: {
        taxBurden: {
          score: round1(taxBurdenScore),
          weight: effectiveWeights.taxBurden,
          avgDeemedToEtfPricePct: avgDeemedIncomeToEtfPricePercent,
        },
        consistency: {
          score: round1(consistencyScore),
          weight: effectiveWeights.consistency,
          coefficientOfVariation: reportMetrics.length < 2 ? null : round1(cv * 1000) / 1000,
        },
        deemedToGains: {
          score: deemedToGainsScore !== null ? round1(deemedToGainsScore) : null,
          weight: effectiveWeights.deemedToGains,
          deemedGainsToTotalGainsPct: gainsRatioUsable ? deemedGainsToTotalGainsPercent : null,
          included: gainsRatioUsable,
        },
      },
    };
  }

  /**
   * Coefficient of Variation: population stddev / mean.
   * Returns 0 when fewer than 2 values are provided or when the mean is zero.
   * @param {number[]} values
   * @returns {number}
   */
  _coefficientOfVariation(values) {
    if (values.length < 2) return 0;
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    if (mean === 0) return 0;
    const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
    return Math.sqrt(variance) / mean;
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
