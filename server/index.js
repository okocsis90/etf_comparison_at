/* global process */
import { randomUUID } from 'node:crypto';
import express from 'express';
import scoreRoutes from './features/score/score.controller.js';
import Logger from './shared/logger.js';
import getDb, { closeDb } from './shared/db/database.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use((req, res, next) => {
  const requestId = randomUUID();
  const startedAt = Date.now();

  res.setHeader('X-Request-Id', requestId);
  Logger.withContext({ requestId }, () => {
    res.on('finish', () => {
      Logger.withContext({ requestId }, () => {
        if (req.path === '/health' && res.statusCode < 400) return;

        const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
        Logger[level]('HTTP request completed', {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          durationMs: Date.now() - startedAt,
        });
      });
    });
    next();
  });
});

app.get('/health', async (_req, res) => {
  try {
    await getDb().query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (error) {
    Logger.warn('Health check failed', { error: error.message, stack: error.stack });
    res.status(503).json({ status: 'unavailable' });
  }
});

app.use('/api/score', (req, res) => new scoreRoutes().handleScoreRequest(req, res));

const startServer = async () => {
  await getDb().query('SELECT 1');
  const server = app.listen(PORT, () => {
    Logger.info(`ETF comparison backend running on port ${PORT}`);
  });

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
      server.close(async () => {
        await closeDb();
        process.exit(0);
      });
    });
  }
};

startServer().catch((error) => {
  Logger.error('Failed to start ETF comparison backend', {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});
