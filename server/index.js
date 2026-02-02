/* global process */
import express from 'express';
import reportRoutes from './features/report/report.route.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Mount feature routes
app.use('/api', reportRoutes);

app.listen(PORT, () => {
  console.log(`ETF comparison backend running on port ${PORT}`);
});
