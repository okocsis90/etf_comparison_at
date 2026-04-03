import reportSelectors from './report-selectors.js';
import { delay } from '../../../shared/utils.js';

/**
 * Page Object Model for the report page.
 * Handles navigation, element access, and page interactions.
 * All selectors are imported from report-selectors.js.
 * @class ReportPage
 */
class ReportPage {
    static BASE_URL = 'https://my.oekb.at/kapitalmarkt-services/kms-output/fonds-info/sd/af/f';

    constructor(page, isin) {
        this.page = page;
        this.isin = isin;
    }

    get url() {
        return `${ReportPage.BASE_URL}?isin=${this.isin}`;
    }

    // --- Navigation ---

    async gotoPage() {
        await this.page.goto(this.url, { waitUntil: 'networkidle2' });
    }

    async scrollToTop() {
        await this.page.evaluate(() => window.scrollTo(0, 0));
    }

    async setViewport(width = 1920, height = 1080) {
        await this.page.setViewport({ width, height });
    }

    // --- Element Access ---

    async _waitForChevron() {
        await this.page.waitForSelector(reportSelectors.chevron, { visible: true });
        return this.page.$(reportSelectors.chevron);
    }

    async getTables() {
        return this.page.$$(reportSelectors.tables);
    }

    async getTableRows(table) {
        return table.$$(reportSelectors.tableRows);
    }

    // --- Interactions ---

    /**
     * Scrolls an element into view and clicks it.
     * Falls back to JS click if direct click fails.
     * @param {ElementHandle} element - Puppeteer element to click
     */
    async scrollAndClick(element) {
        await element.evaluate(el => el.scrollIntoView({ behavior: 'auto', block: 'center' }));
        await delay(200);
        try {
            await element.click();
        } catch {
            await this.page.evaluate(el => el.click(), element);
        }
    }

    /**
     * Clicks the chevron to expand the report accordion.
     */
    async clickChevron() {
        const chevron = await this._waitForChevron();
        if (!chevron) throw new Error('Chevron icon not found');
        await this.scrollAndClick(chevron);
        await delay(800);
    }
}

export default ReportPage;
