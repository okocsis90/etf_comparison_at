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

    const { confidenceLevel, confidenceLabel } = this._calculateConfidence(reports.length);

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
      confidenceLevel,
      confidenceLabel,
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

    // Tunable mapping constant for the tax-burden component. This value
    // controls the sensitivity of the linear mapping from average deemed%
    // to score. Previous implementation used 2.0 (2% → 0). Increase this to
    // reduce sensitivity (e.g. 3.0 ⇒ 3% → 0).
    const TAX_BURDEN_SCALE = 3.0;

    // ── Component 1: Annual Tax Burden ──────────────────────────────────────
    const taxBurdenScore = Math.max(0, 100 * (1 - avgDeemedIncomeToEtfPricePercent / TAX_BURDEN_SCALE));

    // ── Component 2: Year-over-Year Consistency ──────────────────────────────
    const rates = reportMetrics.map(m => m.deemedIncomeToEtfPricePercent);
    // Compute CV but treat near-zero mean as undefined (NaN) to avoid
    // misinterpreting tiny denominators as "perfect stability" or
    // producing extreme penalties. We also cap extremely large CVs for
    // scoring stability while still reporting the raw CV for diagnostics.
    const cvRaw = this._coefficientOfVariation(rates);
    const cvValid = Number.isFinite(cvRaw) && cvRaw >= 0;
    const CV_CAP = 3.0; // cap used for mapping to score (tunable)
    const cvForScoring = cvValid ? Math.min(cvRaw, CV_CAP) : null;
    const consistencyScore = reportMetrics.length < 2 || !cvValid
      ? 50
      : Math.max(0, 100 * (1 - cvForScoring / 1.5));

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
          // Report the raw CV (rounded) if available; note that cvRaw may be
          // undefined (null/NaN) when the mean is too small to compute a
          // meaningful relative measure.
          coefficientOfVariation: reportMetrics.length < 2 || !cvValid ? null : round1(cvRaw * 1000) / 1000,
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
   * Coefficient of Variation (population): stddev / |mean|.
   *
   * Important notes / defensive behaviour:
   * - If fewer than 2 values are provided the CV is undefined (returns NaN).
   * - If the mean is zero or too close to zero (relative to the data
   *   magnitude) the CV is considered undefined and NaN is returned. This
   *   avoids treating a tiny mean as "perfect stability" or producing
   *   arbitrarily large CV values caused by tiny denominators.
   * - Uses the population variance (divide by N). The denominator uses the
   *   absolute value of the mean so the CV is non-negative.
   *
   * @param {number[]} values
   * @returns {number} CV as a non-negative number, or NaN when undefined
   */
  _coefficientOfVariation(values) {
    if (!Array.isArray(values) || values.length < 2) return NaN;

    const mean = values.reduce((s, v) => s + v, 0) / values.length;

    // If all values are exactly zero, treat this as perfectly stable → CV = 0.
    const absValues = values.map(v => Math.abs(v));
    const maxAbs = Math.max(...absValues);
    if (maxAbs === 0) return 0;

    // Relative threshold: if mean is tiny compared to the magnitude of the
    // data, treat the CV as undefined. This avoids enormous CVs from tiny
    // denominators. The multiplier (1e-6) is tunable.
    const relThreshold = Math.max(1e-12, maxAbs * 1e-6);
    if (Math.abs(mean) < relThreshold) return NaN;

    const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
    const std = Math.sqrt(variance);
    return std / Math.abs(mean);
  }

  /**
   * Derives a data-confidence level from the number of available yearly reports.
   *
   * More years of data reveal longer-term patterns in deemed income behaviour
   * and reduce the risk that a single unusual year skews the analysis.
   *
   * | Reports | Level | Label         |
   * |---------|-------|---------------|
   * | 1–2     |   1   | Preliminary   |
   * | 3–4     |   2   | Limited       |
   * | 5–6     |   3   | Moderate      |
   * | 7–8     |   4   | Reliable      |
   * | 9+      |   5   | Comprehensive |
   *
   * @param {number} reportCount
   * @returns {{ confidenceLevel: 1|2|3|4|5, confidenceLabel: string }}
   */
  _calculateConfidence(reportCount) {
    if (reportCount >= 9) return { confidenceLevel: 5, confidenceLabel: 'Comprehensive' };
    if (reportCount >= 7) return { confidenceLevel: 4, confidenceLabel: 'Reliable' };
    if (reportCount >= 5) return { confidenceLevel: 3, confidenceLabel: 'Moderate' };
    if (reportCount >= 3) return { confidenceLevel: 2, confidenceLabel: 'Limited' };
    return                       { confidenceLevel: 1, confidenceLabel: 'Preliminary' };
  }

  /**
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
