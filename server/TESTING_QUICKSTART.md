# Quick Start Guide: Testing Currency Exchange Rate Service

## 🚀 Run Tests Now

```bash
cd C:\projects\oliver\etf_comparison_at\server

# Run unit tests (fast, mocked)
npm test currency-exchange-rate.service.test.js

# Run integration tests (real API calls)
npm test currency-exchange-rate.integration.test.js

# Run all tests
npm test
```

## 📊 Test Results Summary

### Unit Tests (Mocked)
✅ **33/33 tests passing**  
✅ **95.83%** code coverage  
✅ **Fast execution** (~280ms)  
✅ **No external dependencies** (fully mocked)

### Integration Tests (Real API)
✅ **15/15 tests passing**  
✅ **Real Yahoo Finance data**  
✅ **Multiple currencies tested** (GBP, USD, CHF, HKD, SGD, JPY, CAD, AUD, THB, MYR, INR, KRW)  
✅ **Edge cases verified** (EUR→EUR, weekends, recent dates)  
✅ **Slower execution** (~1.6s, real network calls)

## 🔍 What Each Test Group Validates

### 1. Main API (`getExchangeRate`)
- **Purpose**: Ensures the public API works correctly
- **Validates**: 
  - EUR→EUR returns 1.0
  - Invalid inputs are rejected
  - All fallback strategies work in order: primary ticker → secondary ticker → quote → search

### 2. Price Selection (`_findBestPriceData`)
- **Purpose**: Ensures correct historical price is selected
- **Validates**: 
  - Picks exact date match when available
  - Falls back to most recent before target
  - Handles missing/null data gracefully

### 3. Rate Calculation (`_calculateExchangeRate`)
- **Purpose**: Ensures math is correct
- **Validates**: 
  - Direct rates: `rate = raw`
  - Inverted rates: `rate = 1/raw`
  - Division by zero prevention

### 4. Chart Fetching (`_tryChartData`)
- **Purpose**: Ensures historical data fetching works
- **Validates**: 
  - Yahoo Finance chart API integration
  - Data extraction and processing
  - Error handling

### 5. Quote Fetching (`_tryQuoteFallback`)
- **Purpose**: Ensures current price fetching works
- **Validates**: 
  - Yahoo Finance quote API integration
  - Multiple price field fallbacks
  - Missing data handling

### 6. Search Fallback (`_trySearchFallback`)
- **Purpose**: Ensures last-resort strategy works
- **Validates**: 
  - Ticker search functionality
  - Normal and inverted orientation attempts
  - Search failure handling

## 💡 Understanding the Exchange Rate Logic

The service normalizes all rates to **CUR→EUR** format:

```
amount_in_currency × exchangeRateCurrencyToEur = amount_in_EUR
```

### Example 1: Primary Ticker (Needs Inversion)
```
Yahoo returns: EURUSD=X = 1.18 (meaning 1 EUR = 1.18 USD)
Service returns: 1/1.18 = 0.847 (meaning 1 USD = 0.847 EUR)
Usage: 100 USD × 0.847 = 84.7 EUR ✓
```

### Example 2: Secondary Ticker (Direct)
```
Yahoo returns: USDEUR=X = 0.92 (meaning 1 USD = 0.92 EUR)
Service returns: 0.92 (no inversion needed)
Usage: 100 USD × 0.92 = 92 EUR ✓
```

## 🐛 Common Test Scenarios Covered

1. **Happy Path**: Normal currency conversion works
2. **Primary Failure**: Falls back to secondary ticker
3. **Chart Empty**: Falls back to quote endpoint
4. **All Fail**: Falls back to search
5. **No Data**: Throws clear error
6. **Weekend/Holiday**: Uses most recent available price
7. **Zero Price**: Handled safely (no division by zero)
8. **Missing Fields**: Uses fallback price fields

## 🔧 Test Commands Cheat Sheet

```bash
# Run all tests (unit + integration)
npm test

# Run only unit tests (fast, mocked)
npm test currency-exchange-rate.service.test.js

# Run only integration tests (real API calls)
npm test currency-exchange-rate.integration.test.js

# Run in watch mode (great for TDD)
npm run test:watch

# Run with coverage (unit tests only)
npm test currency-exchange-rate.service.test.js -- --coverage

# Run specific test (by name)
npm test -- -t "should return 1.0 for EUR"

# Run tests in silent mode
npm test -- --silent
```

## 🌍 Integration Test Results (Real API)

The integration tests verify real-world currency conversions:

### Common Currencies
- **GBP → EUR**: 1 GBP = 1.1637 EUR ✓
- **USD → EUR**: 1 USD = 0.9136 EUR ✓
- **CHF → EUR**: 1 CHF = 1.0707 EUR ✓
- **CAD → EUR**: 1 CAD = 0.6814 EUR ✓
- **AUD → EUR**: 1 AUD = 0.6112 EUR ✓

### Asian Currencies (Exotic)
- **HKD → EUR**: 1 HKD = 0.1168 EUR (100 HKD = 11.68 EUR) ✓
- **SGD → EUR**: 1 SGD = 0.6860 EUR (500 SGD = 343.00 EUR) ✓
- **JPY → EUR**: 1 JPY = 0.0063 EUR (1000 JPY = 6.29 EUR) ✓
- **THB → EUR**: 1 THB = 0.0266 EUR ✓
- **MYR → EUR**: 1 MYR = 0.1996 EUR ✓
- **INR → EUR**: 1 INR = 0.0110 EUR ✓
- **KRW → EUR**: 1 KRW = 0.0007 EUR ✓

### Edge Cases Verified
- EUR → EUR correctly returns 1.0 ✓
- Recent dates use latest available data ✓
- Weekend dates fall back to last trading day ✓

## 📝 How to Add a New Test

```javascript
test('should handle YOUR_SCENARIO', async () => {
    // 1. ARRANGE: Set up test data and mocks
    mockYahooFinance.chart.mockResolvedValueOnce({
        quotes: [{ date: new Date('2024-01-15'), close: 1.10 }]
    });
    
    // 2. ACT: Call the method you're testing
    const result = await service.getExchangeRate('USD', new Date('2024-01-15'));
    
    // 3. ASSERT: Verify the results
    expect(result.exchangeRateCurrencyToEur).toBeCloseTo(0.909, 3);
    expect(result.currency).toBe('USD');
});
```

## 🎯 When to Run Tests

✅ **Before committing code**
```bash
git add .
npm test  # Make sure all tests pass
git commit -m "Your message"
```

✅ **While developing** (use watch mode)
```bash
npm run test:watch
# Edit code, tests auto-rerun
```

✅ **Before deploying**
```bash
npm test -- --coverage
# Verify coverage stays above 90%
```

## 🚨 If Tests Fail

1. **Read the error message** - Jest gives detailed output
2. **Check which test failed** - The name tells you what broke
3. **Look at the expected vs actual values** - Shows what went wrong
4. **Check recent code changes** - Did you modify the service?
5. **Run single test for debugging**:
   ```bash
   npm test -- -t "name of failing test"
   ```

## 📚 Related Files

- **Test File**: `currency-exchange-rate.service.test.js` (635 lines)
- **Service**: `currency-exchange-rate.service.js` (243 lines)
- **Documentation**: `README_TESTS.md` (full details)
- **Config**: `jest.config.json` (Jest settings)

## 🎓 Key Testing Concepts Used

- **Mocking**: Fake Yahoo Finance API to avoid real network calls
- **Unit Testing**: Test each method in isolation
- **Integration Testing**: Test full workflows end-to-end
- **Edge Case Testing**: Test unusual scenarios (zero, null, errors)
- **Coverage**: Measure how much code is tested (aim for >90%)

## ✨ Why These Tests Are Valuable

1. **Confidence**: You know the service works correctly
2. **Regression Prevention**: New changes won't break existing features
3. **Documentation**: Tests show how the service should be used
4. **Refactoring Safety**: Can improve code without fear
5. **Bug Detection**: Catches issues before production
6. **Fast Feedback**: Know immediately if something breaks

---

**Need help?** Check `README_TESTS.md` for detailed documentation!
