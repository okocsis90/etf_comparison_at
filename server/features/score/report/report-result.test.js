import { describe, test, expect } from '@jest/globals';
import ReportResult from './report-result.js';

describe('ReportResult', () => {
    test('should initialize with isin and currency', () => {
        const result = new ReportResult('IE00BK5BQX27', 'EUR');

        expect(result.isin).toBe('IE00BK5BQX27');
        expect(result.currency).toBe('EUR');
        expect(result.reports).toEqual([]);
    });

    test('should initialize with null currency', () => {
        const result = new ReportResult('IE00BK5BQX27', null);

        expect(result.currency).toBeNull();
        expect(result.reports).toEqual([]);
    });

    test('should add a report entry', () => {
        const result = new ReportResult('IE00BK5BQX27', 'EUR');

        result.addReport({
            date: '15.01.2024',
            deemedIncome: 1.4767,
            businessYearStart: '01.01.2023',
            businessYearEnd: '31.12.2023',
        });

        expect(result.reports).toHaveLength(1);
        expect(result.reports[0]).toEqual({
            date: '15.01.2024',
            deemedIncome: 1.4767,
            businessYearStart: '01.01.2023',
            businessYearEnd: '31.12.2023',
        });
    });

    test('should add multiple report entries in order', () => {
        const result = new ReportResult('IE00BK5BQX27', 'USD');

        result.addReport({
            date: '15.01.2023',
            deemedIncome: 0.8287,
            businessYearStart: '01.01.2022',
            businessYearEnd: '31.12.2022',
        });
        result.addReport({
            date: '15.01.2024',
            deemedIncome: 1.4767,
            businessYearStart: '01.01.2023',
            businessYearEnd: '31.12.2023',
        });

        expect(result.reports).toHaveLength(2);
        expect(result.reports[0].deemedIncome).toBe(0.8287);
        expect(result.reports[1].deemedIncome).toBe(1.4767);
    });

    test('should allow currency to be updated after construction', () => {
        const result = new ReportResult('IE00BK5BQX27', null);
        result.currency = 'GBP';

        expect(result.currency).toBe('GBP');
    });
});
