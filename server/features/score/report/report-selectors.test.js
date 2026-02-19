import { describe, test, expect } from '@jest/globals';
import reportSelectors from './report-selectors.js';

describe('reportSelectors', () => {
    test('should have chevron selector', () => {
        expect(reportSelectors.chevron).toBe('a[role="button"].p-accordion-header-link chevronrighticon');
    });

    test('should have table selectors', () => {
        expect(reportSelectors.tables).toBe('table');
        expect(reportSelectors.tableRows).toBe('tbody tr');
    });

    test('should have cell selectors', () => {
        expect(reportSelectors.rowTd).toBe('td');
        expect(reportSelectors.rowTdDiv).toBe('td div');
        expect(reportSelectors.detailRowFirstTdDiv).toBe('td:first-child div');
        expect(reportSelectors.detailRowSecondTdDiv).toBe('td:nth-child(2) div');
    });

    test('should have funds table selectors', () => {
        expect(reportSelectors.fundsTable).toBe('div.funds-table');
        expect(reportSelectors.fundsTableChildren).toBe('div.funds-table > div');
        expect(reportSelectors.fundsTableInnerDiv).toBe('div');
    });

    test('should have correct label constants', () => {
        expect(reportSelectors.currencyLabel).toBe('Währung');
        expect(reportSelectors.yearlyReportValue).toBe('ja');
    });

    test('should have deemed income identifiers for 936 and 937', () => {
        expect(reportSelectors.deemedIncomeIdentifiers).toEqual(['936', '937']);
    });
});
