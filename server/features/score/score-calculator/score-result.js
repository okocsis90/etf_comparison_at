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
 * @property {number} avgEtfPriceToDeemedIncomePercent - Average of deemed income to ETF price percentages
 * @property {number} avgDeemedIncomeEur - Average deemed income in EUR
 * @property {number} maxDeemedIncomeDiffEur - Maximum difference between any two deemed incomes
 * @property {number} maxDiffToAvgDeemedIncomePercent - Max diff as percentage of average deemed income
 * @property {number} avgDeemedIncomeToCurrentEtfPricePercent - Avg deemed income as percentage of current ETF price
 * @property {number} currentEtfPriceEur - Current ETF price in EUR
 * @property {number} etfPriceAtFirstBusinessYearStartEur - ETF price at first business year start
 * @property {number} etfPriceAtLastBusinessYearEndEur - ETF price at last business year end
 * @property {Date} firstBusinessYearStart - First business year start date
 * @property {Date} lastBusinessYearEnd - Last business year end date
 * @property {number} totalReports - Total number of reports analyzed
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
    originalCurrency,
    totalGains,
    deemedGains,
    deemedGainsToTotalGainsPercent,
    reportMetrics = [],
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
    totalReports
  }) {
    this.isin = isin;
    this.originalCurrency = originalCurrency;
    this.totalGains = totalGains;
    this.deemedGains = deemedGains;
    this.deemedGainsToTotalGainsPercent = deemedGainsToTotalGainsPercent;
    this.reportMetrics = reportMetrics;
    this.avgEtfPriceToDeemedIncomePercent = avgEtfPriceToDeemedIncomePercent;
    this.avgDeemedIncomeEur = avgDeemedIncomeEur;
    this.maxDeemedIncomeDiffEur = maxDeemedIncomeDiffEur;
    this.maxDiffToAvgDeemedIncomePercent = maxDiffToAvgDeemedIncomePercent;
    this.avgDeemedIncomeToCurrentEtfPricePercent = avgDeemedIncomeToCurrentEtfPricePercent;
    this.currentEtfPriceEur = currentEtfPriceEur;
    this.etfPriceAtFirstBusinessYearStartEur = etfPriceAtFirstBusinessYearStartEur;
    this.etfPriceAtLastBusinessYearEndEur = etfPriceAtLastBusinessYearEndEur;
    this.firstBusinessYearStart = firstBusinessYearStart;
    this.lastBusinessYearEnd = lastBusinessYearEnd;
    this.totalReports = totalReports;
  }
}

export { ScoreResult, ReportMetric };
