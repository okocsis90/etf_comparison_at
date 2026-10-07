import getDb from '../../shared/db/database.js';

const recordDailyVisitor = async (visitorId) => getDb().query(
  `INSERT INTO daily_usage_visitors (usage_date, visitor_id)
   VALUES ((CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::DATE, $1)
   ON CONFLICT (usage_date, visitor_id) DO NOTHING`,
  [visitorId]
);

export default recordDailyVisitor;
