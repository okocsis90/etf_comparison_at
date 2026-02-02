# ETF Comparison Backend

This is a simple Node.js backend for scraping and caching ETF report data by ISIN.

## Features
- API endpoint: `/api/fetch-report?isin=...`
- Uses Puppeteer to fetch and parse the report page
- Caches results in memory for 1 hour (configurable)

## Usage

1. Install dependencies:
   ```sh
   cd server
   npm install
   ```
2. Start the server:
   ```sh
   npm start
   ```
3. Query the API from your frontend:
   ```sh
   curl "http://localhost:3001/api/fetch-report?isin=IE00BK5BQX27"
   ```

## Customization
- Add your data extraction logic in `index.js` where marked with TODO.
- Adjust cache TTL in `index.js` if needed.

---

**Note:** Puppeteer will download Chromium on first install. If you deploy, ensure your environment supports headless browsers.
