// reportResult.js

class ReportResult {
  constructor(isin, currency) {
    this.isin = isin;
    this.currency = currency;
    this.reports = [];
  }

  addReport({ date, deemedIncome, businessYearStart, businessYearEnd }) {
    this.reports.push({
      date,
      deemedIncome,
      businessYearStart,
      businessYearEnd,
    });
  }
}

export default ReportResult;
