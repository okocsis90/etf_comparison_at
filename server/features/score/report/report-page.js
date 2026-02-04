import reportSelectors from './report-selectors.js';

/**
 * Page Object Model for the report page.
 * Handles navigation and element access only.
 */
class ReportPage {
    constructor(page, isin) {
        this.page = page;
        this.isin = isin;
        this.url = `https://my.oekb.at/kapitalmarkt-services/kms-output/fonds-info/sd/af/f?isin=${isin}`;
    }

    async waitForChevron() {
        await this.page.waitForSelector(reportSelectors.chevron, { visible: true });
        return this.page.$(reportSelectors.chevron);
    }

    async getTables() {
        return this.page.$$(reportSelectors.tables);
    }

    async getTableRows(table) {
        return table.$$(reportSelectors.tableRows);
    }

    async gotoPage() {
        await this.page.goto(this.url, { waitUntil: 'networkidle2' });
    }

    async scrollToTop() {
        await this.page.evaluate(() => window.scrollTo(0, 0));
    }

    async setViewport(width = 1920, height = 1080) {
        await this.page.setViewport({ width, height });
    }
}

export default ReportPage;
