import ReportService from './report/report.service.js';
import CurrencyExchangeRateService from './currency-exchange-rate/currency-exchange-rate.service.js';
import EtfPriceService from './etf-price/etf-price.service.js';
import ScoreCalculatorService from './score-calculator/score-calculator.service.js';
import etfPriceService from "./etf-price/etf-price.service.js";

class ScoreService {
  constructor() {
    this.reportService = new ReportService();
    this.currencyExchangeRateService = new CurrencyExchangeRateService();
    this.etfPriceService = new EtfPriceService();
    this.scoreCalculatorService = new ScoreCalculatorService();
  }

  async getScore(isin) {
    // Step 1: Get report result
    //const reportResult = await this.reportService.getReportResult(isin);
    const pricesResult = await this.etfPriceService.getPrice(isin, '2024-01-01');
    // Step 2: Get currency exchange rates if needed
    // Step 3: Get ETF prices
    // Step 4: Calculate score
    // TODO: Implement orchestration logic
    return {};
  }
}

export default ScoreService;
