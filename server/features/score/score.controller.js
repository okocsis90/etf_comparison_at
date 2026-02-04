import ScoreService from './score.service.js';

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
      res.status(500).json({ error: 'Failed to calculate score', details: err.message });
    }
  }
}

export default ScoreController;
