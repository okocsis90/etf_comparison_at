class ReportResult {
  constructor(isin, currency) {
    this.isin = isin;
    this.currency = currency;
    this.reports = [];
    this.warnings = [];
  }

  addReport({ date, deemedIncome, businessYearStart, businessYearEnd }) {
    this.reports.push({
      date,
      deemedIncome,
      businessYearStart,
      businessYearEnd,
    });
  }

  addWarning(type, message) {
    this.warnings.push({ type, message });
  }
}

export default ReportResult;
