import logger from '../../shared/logger.js';
import recordDailyVisitor from './usage.repository.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const usageController = async (req, res) => {
  const { visitorId } = req.body ?? {};
  if (typeof visitorId !== 'string' || !UUID_PATTERN.test(visitorId)) {
    res.status(400).json({ error: 'A valid visitorId is required' });
    return;
  }

  try {
    await recordDailyVisitor(visitorId);
    res.status(204).end();
  } catch (error) {
    logger.error('Failed to record daily app usage', {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: 'Failed to record app usage' });
  }
};

export default usageController;
