/* global process */
import express from 'express';
import scoreRoutes from './features/score/score.controller.js';
import Logger from "./shared/logger.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use('/api/score', (req, res) => new scoreRoutes().handleScoreRequest(req, res));

app.listen(PORT, () => {
  Logger.info(`ETF comparison backend running on port ${PORT}`);
});
