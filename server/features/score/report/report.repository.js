import getDb from '../../../shared/db/database.js';
import logger from '../../../shared/logger.js';
import { toDateKey } from '../../../shared/utils.js';
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
    async findFresh(isin) {
        if (!isin) throw new Error('isin is required');
        if (await this._isFetchAllowed(isin)) return null;

        const { rows } = await getDb().query(`
                SELECT isin,
                       currency,
                       TO_CHAR(date, 'DD.MM.YYYY') AS date,
                       deemed_income,
                       TO_CHAR(business_year_start, 'DD.MM.YYYY') AS business_year_start,
                       TO_CHAR(business_year_end, 'DD.MM.YYYY') AS business_year_end,
                       fetched_at,
                       next_fetch_allowed_at
                FROM   oekb_reports
                WHERE  isin = $1
                ORDER  BY business_year_start ASC
            `, [isin]);

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
    async save(reportResult) {
        const { isin, currency, reports } = reportResult;
        if (!isin) throw new Error('isin is required');
        if (!reports || reports.length === 0) return;

        const fetchedAt = new Date().toISOString();
        const nextFetchAllowedAt = _calculateNextFetchDate(reports).toISOString();

        const client = await getDb().connect();
        try {
            await client.query('BEGIN');
            await client.query('DELETE FROM oekb_reports WHERE isin = $1', [isin]);
            for (const report of reports) {
                await client.query(`
            INSERT INTO oekb_reports
                (isin, currency, date, deemed_income, business_year_start, business_year_end,
                 fetched_at, next_fetch_allowed_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
                    isin,
                    currency,
                    toDateKey(report.date),
                    report.deemedIncome,
                    toDateKey(report.businessYearStart),
                    toDateKey(report.businessYearEnd),
                    fetchedAt,
                    nextFetchAllowedAt
                ]);
            }
            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
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
    async _isFetchAllowed(isin) {
        const { rows } = await getDb().query(`
                SELECT next_fetch_allowed_at
                FROM   oekb_reports
                WHERE  isin = $1
                LIMIT  1
            `, [isin]);
        const row = rows[0];

        if (!row) return true;

        const allowed = new Date(row.next_fetch_allowed_at) <= new Date();
        if (allowed) {
            logger.info(`Cache stale for ${isin}: next fetch was allowed at ${row.next_fetch_allowed_at}`);
        }
        return allowed;
    }
}

/**
 * Parses a German-formatted date string "DD.MM.YYYY" into a Date object.
 * Falls back to native Date parsing for ISO strings already stored in the DB.
 * Returns null if the date string cannot be parsed into a valid Date.
 * @param {string} dateStr
 * @returns {Date|null}
 */
function _parseDate(dateStr) {
    if (!dateStr) return null;
    let date;
    const parts = dateStr.split('.');
    if (parts.length === 3) {
        const [day, month, year] = parts;
        date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    } else {
        date = new Date(dateStr);
    }
    if (isNaN(date.getTime())) {
        logger.warn(`Unable to parse date string: "${dateStr}"`);
        return null;
    }
    return date;
}

/**
 * Finds the latest report date and adds REFETCH_AFTER_DAYS to it.
 * Falls back to the current date if no report dates could be parsed.
 * @param {Array<{date: string}>} reports - raw report objects (German date strings DD.MM.YYYY)
 * @returns {Date}
 */
function _calculateNextFetchDate(reports) {
    let latestDate = null;
    for (const report of reports) {
        const reportDate = _parseDate(report.date);
        if (reportDate && (!latestDate || reportDate > latestDate)) {
            latestDate = reportDate;
        }
    }

    if (!latestDate) {
        logger.warn('No valid report dates found, falling back to current date for next fetch calculation');
        latestDate = new Date();
    }

    const nextFetch = new Date(latestDate);
    nextFetch.setDate(nextFetch.getDate() + ReportRepository.REFETCH_AFTER_DAYS);
    return nextFetch;
}

export default ReportRepository;
