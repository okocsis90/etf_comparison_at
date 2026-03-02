import getDb from '../../../shared/db/database.js';
import logger from '../../../shared/logger.js';
import ReportResult from './report-result.js';

/**
 * Repository for caching OeKB report data per ISIN.
 *
 * Freshness strategy:
 *   New OeKB reports typically arrive once a year, close to the anniversary of the
 *   previous latest report.  We therefore set next_fetch_allowed_at to
 *   (last_report_date + 350 days), giving a ~15-day window before the anniversary
 *   during which we will re-scrape.  Once a fresh scrape produces a new report we
 *   push the window forward again automatically.
 */
class ReportRepository {
    /** Number of days after the last report date before we allow re-scraping */
    static REFETCH_AFTER_DAYS = 350;

    /**
     * Returns the cached ReportResult for the given ISIN if it is still fresh,
     * otherwise returns null (caller must re-scrape).
     * @param {string} isin
     * @returns {ReportResult|null}
     */
    findFresh(isin) {
        if (this._isFetchAllowed(isin)) return null;

        const rows = getDb()
            .prepare(`
                SELECT *
                FROM   oekb_reports
                WHERE  isin = ?
                ORDER  BY business_year_start ASC
            `)
            .all(isin);

        if (rows.length === 0) return null;

        logger.info(`Cache hit: OeKB reports for ${isin} (${rows.length} reports)`);

        const result = new ReportResult(isin, rows[0].currency);
        for (const row of rows) {
            result.addReport({
                date: row.date,
                deemedIncome: row.deemed_income,
                businessYearStart: row.business_year_start,
                businessYearEnd: row.business_year_end
            });
        }
        return result;
    }

    /**
     * Persists all reports from a fresh scrape, replacing any previous data for this ISIN.
     * Calculates and stores the next allowed fetch date automatically.
     * @param {ReportResult} reportResult
     */
    save(reportResult) {
        const { isin, currency, reports } = reportResult;
        if (!reports || reports.length === 0) return;

        const fetchedAt = new Date().toISOString();
        const nextFetchAllowedAt = _calculateNextFetchDate(reports).toISOString();

        const db = getDb();
        const insert = db.prepare(`
            INSERT OR REPLACE INTO oekb_reports
                (isin, currency, date, deemed_income, business_year_start, business_year_end,
                 fetched_at, next_fetch_allowed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const saveAll = db.transaction(() => {
            for (const report of reports) {
                insert.run(
                    isin,
                    currency,
                    report.date,
                    report.deemedIncome,
                    report.businessYearStart,
                    report.businessYearEnd,
                    fetchedAt,
                    nextFetchAllowedAt
                );
            }
        });

        saveAll();
        logger.info(`Cached ${reports.length} OeKB reports for ${isin}. Next fetch allowed at ${nextFetchAllowedAt}`);
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Returns true if we should hit OeKB again (cache is stale or empty).
     * @param {string} isin
     * @returns {boolean}
     * @private
     */
    _isFetchAllowed(isin) {
        const row = getDb()
            .prepare(`
                SELECT next_fetch_allowed_at
                FROM   oekb_reports
                WHERE  isin = ?
                LIMIT  1
            `)
            .get(isin);

        if (!row) return true;

        const allowed = new Date(row.next_fetch_allowed_at) <= new Date();
        if (allowed) {
            logger.info(`Cache stale for ${isin}: next fetch was allowed at ${row.next_fetch_allowed_at}`);
        }
        return allowed;
    }
}

/**
 * Finds the latest report date and adds REFETCH_AFTER_DAYS to it.
 * @param {Array<{date: string}>} reports - raw report objects (German date strings)
 * @returns {Date}
 */
function _calculateNextFetchDate(reports) {
    const latestDate = reports.reduce((latest, report) => {
        const reportDate = new Date(report.date);
        return reportDate > latest ? reportDate : latest;
    }, new Date(0));

    const nextFetch = new Date(latestDate);
    nextFetch.setDate(nextFetch.getDate() + ReportRepository.REFETCH_AFTER_DAYS);
    return nextFetch;
}

export default ReportRepository;
