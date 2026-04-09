/**
 * Output data structure for the ScoreCalculator.
 * Contains all calculated metrics based on the ScoreInput data.
 */

/**
 * @typedef {Object} ReportMetric
 * @property {Date} date - The report date
 * @property {number} deemedIncomeEur - The deemed income in EUR
 * @property {number} etfPriceOnDateEur - ETF price on the report date in EUR
 * @property {number} deemedIncomeToEtfPricePercent - Deemed income as percentage of ETF price
 */

/**
 * @typedef {Object} ScoreResult
 * @property {string} isin - The ISIN of the ETF
 * @property {string} originalCurrency - The original currency of the reports
 * @property {number} totalGains - Price difference between last business year end and first start (EUR)
 * @property {number} deemedGains - Sum of all deemed incomes (EUR)
 * @property {number} deemedGainsToTotalGainsPercent - Deemed gains as percentage of total gains
 * @property {ReportMetric[]} reportMetrics - Per-report metrics
 * @property {number} avgDeemedIncomeToEtfPricePercent - Average of (deemed income / ETF price) percentages across all reports
 * @property {number} avgDeemedIncomeEur - Average deemed income in EUR
 * @property {number} maxDeemedIncomeDiffEur - Maximum difference between any two deemed incomes
 * @property {number} maxDiffToAvgEtfPricePercent - Max deemed income diff as percentage of average ETF price on report dates
 * @property {number} avgDeemedIncomeToCurrentEtfPricePercent - Avg deemed income as percentage of current ETF price
 * @property {number} currentEtfPriceEur - Current ETF price in EUR
 * @property {number} etfPriceAtFirstBusinessYearStartEur - ETF price at first business year start
 * @property {number} etfPriceAtLastBusinessYearEndEur - ETF price at last business year end
 * @property {Date} firstBusinessYearStart - First business year start date
 * @property {Date} lastBusinessYearEnd - Last business year end date
 * @property {number} totalReports - Total number of reports analyzed
 * @property {'A'|'B'|'C'|'D'|'E'} taxEfficiencyGrade - Overall Austrian tax-efficiency grade
 * @property {number} taxEfficiencyScore - Numeric score 0-100 backing the grade
 * @property {{ taxBurden: object, consistency: object, deemedToGains: object }} taxEfficiencyScoreBreakdown - Per-component score details
 * @property {1|2|3|4|5} confidenceLevel - Data confidence level (1 = Preliminary … 5 = Comprehensive)
 * @property {'Preliminary'|'Limited'|'Moderate'|'Reliable'|'Comprehensive'} confidenceLabel - Human-readable confidence label
 */

class ReportMetric {
  constructor({
    date,
    deemedIncomeEur,
    etfPriceOnDateEur,
    deemedIncomeToEtfPricePercent
  }) {
    this.date = date;
    this.deemedIncomeEur = deemedIncomeEur;
    this.etfPriceOnDateEur = etfPriceOnDateEur;
    this.deemedIncomeToEtfPricePercent = deemedIncomeToEtfPricePercent;
  }
}

class ScoreResult {
  constructor({
    isin,
    ticker,
    name,
    originalCurrency,
    totalGains,
    deemedGains,
    deemedGainsToTotalGainsPercent,
    reportMetrics = [],
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
    totalReports,
    taxEfficiencyGrade,
    taxEfficiencyScore,
    taxEfficiencyScoreBreakdown,
    confidenceLevel,
    confidenceLabel,
  }) {
    this.isin = isin;
    this.ticker = ticker ?? null;
    this.name = name ?? null;
    this.originalCurrency = originalCurrency;
    this.totalGains = totalGains;
    this.deemedGains = deemedGains;
    this.deemedGainsToTotalGainsPercent = deemedGainsToTotalGainsPercent;
    this.reportMetrics = reportMetrics;
    this.avgDeemedIncomeToEtfPricePercent = avgDeemedIncomeToEtfPricePercent;
    this.avgDeemedIncomeEur = avgDeemedIncomeEur;
    this.maxDeemedIncomeDiffEur = maxDeemedIncomeDiffEur;
    this.maxDiffToAvgEtfPricePercent = maxDiffToAvgEtfPricePercent;
    this.avgDeemedIncomeToCurrentEtfPricePercent = avgDeemedIncomeToCurrentEtfPricePercent;
    this.currentEtfPriceEur = currentEtfPriceEur;
    this.etfPriceAtFirstBusinessYearStartEur = etfPriceAtFirstBusinessYearStartEur;
    this.etfPriceAtLastBusinessYearEndEur = etfPriceAtLastBusinessYearEndEur;
    this.firstBusinessYearStart = firstBusinessYearStart;
    this.lastBusinessYearEnd = lastBusinessYearEnd;
    this.totalReports = totalReports;
    this.taxEfficiencyGrade = taxEfficiencyGrade;
    this.taxEfficiencyScore = taxEfficiencyScore;
    this.taxEfficiencyScoreBreakdown = taxEfficiencyScoreBreakdown;
    this.confidenceLevel = confidenceLevel;
    this.confidenceLabel = confidenceLabel;
  }
}

export { ScoreResult, ReportMetric };
