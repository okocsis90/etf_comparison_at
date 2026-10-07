import ScoreService from './score.service.js';
import logger from '../../shared/logger.js';

class ScoreController {
  constructor() {
    this.scoreService = new ScoreService();
  }

  async handleScoreRequest(req, res) {
    const { isin } = req.query;
    try {
      const score = await this.scoreService.getScore(isin);
      res.json(score);
    } catch (err) {
      logger.error(`Score request failed for ISIN ${isin}: ${err.message}`);
      res.status(500).json({ error: 'Failed to calculate score', details: err.message });
    }
  }
}

export default ScoreController;
