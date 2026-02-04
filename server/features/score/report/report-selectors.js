// report-selectors.js
// Centralized CSS selectors for the report feature

const reportSelectors = {
    // Accordion/Chevron
    chevron: 'a[role="button"].p-accordion-header-link chevronrighticon',

    // Tables
    tables: 'table',
    tableRows: 'tbody tr',

    // Table cell selectors
    rowTd: 'td',
    rowTdDiv: 'td div',
    detailRowFirstTdDiv: 'td:first-child div',
    detailRowSecondTdDiv: 'td:nth-child(2) div',

    // Funds table (currency, etc.)
    fundsTable: 'div.funds-table',
    fundsTableChildren: 'div.funds-table > div',
    fundsTableInnerDiv: 'div',

    // Labels
    currencyLabel: 'Währung',
    yearlyReportValue: 'ja',
    deemedIncomeIdentifiers: ['936', '937'],
};

export default reportSelectors;
