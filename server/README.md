# ETF Comparison Backend

This is a simple Node.js backend for scraping and caching ETF report data by ISIN.

## Features
- API endpoint: `/api/score?isin=...`
- Uses Puppeteer to fetch and parse the report page

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
   curl "http://localhost:3001/api/score?isin=IE00BK5BQX27"
   ```
---
**Note:** Puppeteer will download Chromium on first install. If you deploy, ensure your environment supports headless browsers.
