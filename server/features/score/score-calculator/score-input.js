/**
 * Input data structure for the ScoreCalculator.
 * This structure is built by the ScoreService and contains all the data
 * needed to calculate the score metrics.
 *
 * All monetary values in this structure are normalized to EUR.
 */

/**
 * @typedef {Object} ReportEntry
 * @property {Date} date - The report date (Meldung date)
 * @property {number} deemedIncomeOriginal - The deemed income in original currency
 * @property {number} deemedIncomeEur - The deemed income converted to EUR
 * @property {Date} businessYearStart - Start of the business year
 * @property {Date} businessYearEnd - End of the business year
 * @property {number} etfPriceOnDateEur - ETF price on the report date in EUR
 */

/**
 * @typedef {Object} ScoreInput
 * @property {string} isin - The ISIN of the ETF
 * @property {string} originalCurrency - The original currency of the reports
 * @property {ReportEntry[]} reports - Array of report entries with converted values
 * @property {number} etfPriceAtFirstBusinessYearStartEur - ETF price at the first business year start (EUR)
 * @property {number} etfPriceAtLastBusinessYearEndEur - ETF price at the last business year end (EUR)
 * @property {number} currentEtfPriceEur - Current ETF price (EUR)
 * @property {Date} firstBusinessYearStart - The first business year start date
 * @property {Date} lastBusinessYearEnd - The last business year end date
 */

class ReportEntry {
  constructor({
    date,
    deemedIncomeOriginal,
    deemedIncomeEur,
    businessYearStart,
    businessYearEnd,
    etfPriceOnDateEur
  }) {
    this.date = date;
    this.deemedIncomeOriginal = deemedIncomeOriginal;
    this.deemedIncomeEur = deemedIncomeEur;
    this.businessYearStart = businessYearStart;
    this.businessYearEnd = businessYearEnd;
    this.etfPriceOnDateEur = etfPriceOnDateEur;
  }
}

class ScoreInput {
  constructor({
    isin,
    originalCurrency,
    reports = [],
    etfPriceAtFirstBusinessYearStartEur,
    etfPriceAtLastBusinessYearEndEur,
    currentEtfPriceEur,
    firstBusinessYearStart,
    lastBusinessYearEnd
  }) {
    this.isin = isin;
    this.originalCurrency = originalCurrency;
    this.reports = reports;
    this.etfPriceAtFirstBusinessYearStartEur = etfPriceAtFirstBusinessYearStartEur;
    this.etfPriceAtLastBusinessYearEndEur = etfPriceAtLastBusinessYearEndEur;
    this.currentEtfPriceEur = currentEtfPriceEur;
    this.firstBusinessYearStart = firstBusinessYearStart;
    this.lastBusinessYearEnd = lastBusinessYearEnd;
  }
}

export { ScoreInput, ReportEntry };
