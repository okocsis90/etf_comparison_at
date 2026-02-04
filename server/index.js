/* global process */
import express from 'express';
import reportRoutes from './features/report/report.route.js';
import Logger from "./shared/logger.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use('/api', reportRoutes);

app.listen(PORT, () => {
  Logger.info(`ETF comparison backend running on port ${PORT}`);
});
