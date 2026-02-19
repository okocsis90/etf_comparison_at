import { jest } from '@jest/globals';
import { describe, test, expect } from '@jest/globals';
import ReportRowParser from './report-row-parser.js';

describe('ReportRowParser', () => {
    function createMockTd(text) {
        return {
            $eval: jest.fn().mockResolvedValue(text),
        };
    }

    function createMockRow(cellTexts) {
        const tds = cellTexts.map(text => createMockTd(text));
        return {
            $$: jest.fn().mockResolvedValue(tds),
        };
    }

    describe('parse', () => {
        test('should parse a valid yearly report row', async () => {
            // 9 columns: date, ja/nein, col2..col6, businessYearStart, businessYearEnd
            const row = createMockRow([
                '15.01.2024',   // 0: date
                'Ja',           // 1: yearly report
                'col2', 'col3', 'col4', 'col5', 'col6', // 2-6: unused
                '01.01.2023',   // 7: businessYearStart
                '31.12.2023',   // 8: businessYearEnd
            ]);

            const result = await ReportRowParser.parse(row);

            expect(result).toEqual({
                date: '15.01.2024',
                isYearlyReport: true,
                businessYearStart: '01.01.2023',
                businessYearEnd: '31.12.2023',
            });
        });

        test('should return null for non-yearly report (Nein)', async () => {
            const row = createMockRow([
                '15.01.2024', 'Nein',
                'col2', 'col3', 'col4', 'col5', 'col6',
                '01.01.2023', '31.12.2023',
            ]);

            const result = await ReportRowParser.parse(row);

            expect(result).toBeNull();
        });

        test('should return null when row has fewer than 9 columns', async () => {
            const row = createMockRow(['col1', 'col2', 'col3']);

            const result = await ReportRowParser.parse(row);

            expect(result).toBeNull();
        });

        test('should handle lowercase "ja"', async () => {
            const row = createMockRow([
                '15.01.2024', 'ja',
                'col2', 'col3', 'col4', 'col5', 'col6',
                '01.01.2023', '31.12.2023',
            ]);

            const result = await ReportRowParser.parse(row);

            expect(result).not.toBeNull();
            expect(result.isYearlyReport).toBe(true);
        });

        test('should handle uppercase "JA"', async () => {
            const row = createMockRow([
                '15.01.2024', 'JA',
                'col2', 'col3', 'col4', 'col5', 'col6',
                '01.01.2023', '31.12.2023',
            ]);

            const result = await ReportRowParser.parse(row);

            expect(result).not.toBeNull();
        });

        test('should return null for empty yearly report value', async () => {
            const row = createMockRow([
                '15.01.2024', '',
                'col2', 'col3', 'col4', 'col5', 'col6',
                '01.01.2023', '31.12.2023',
            ]);

            const result = await ReportRowParser.parse(row);

            expect(result).toBeNull();
        });

        test('should handle row with more than 9 columns', async () => {
            const row = createMockRow([
                '15.01.2024', 'Ja',
                'col2', 'col3', 'col4', 'col5', 'col6',
                '01.01.2023', '31.12.2023',
                'extra1', 'extra2',
            ]);

            const result = await ReportRowParser.parse(row);

            expect(result).not.toBeNull();
            expect(result.date).toBe('15.01.2024');
            expect(result.businessYearStart).toBe('01.01.2023');
            expect(result.businessYearEnd).toBe('31.12.2023');
        });
    });

    describe('extractCellText', () => {
        test('should extract text from td inner div', async () => {
            const td = createMockTd('  some text  ');

            const result = await ReportRowParser.extractCellText(td);

            expect(result).toBe('  some text  ');
        });
    });

    describe('checkIsYearlyReport', () => {
        test('should return true for "Ja"', async () => {
            const td = createMockTd('Ja');

            expect(await ReportRowParser.checkIsYearlyReport(td)).toBe(true);
        });

        test('should return true for "ja" (case insensitive)', async () => {
            const td = createMockTd('ja');

            expect(await ReportRowParser.checkIsYearlyReport(td)).toBe(true);
        });

        test('should return false for "Nein"', async () => {
            const td = createMockTd('Nein');

            expect(await ReportRowParser.checkIsYearlyReport(td)).toBe(false);
        });

        test('should return false for empty string', async () => {
            const td = createMockTd('');

            expect(await ReportRowParser.checkIsYearlyReport(td)).toBe(false);
        });
    });

    describe('column index constants', () => {
        test('should have correct column indices', () => {
            expect(ReportRowParser.DATE_COLUMN_INDEX).toBe(0);
            expect(ReportRowParser.YEARLY_REPORT_COLUMN_INDEX).toBe(1);
            expect(ReportRowParser.BUSINESS_YEAR_START_INDEX).toBe(7);
            expect(ReportRowParser.BUSINESS_YEAR_END_INDEX).toBe(8);
            expect(ReportRowParser.MINIMUM_COLUMNS).toBe(9);
        });
    });
});
