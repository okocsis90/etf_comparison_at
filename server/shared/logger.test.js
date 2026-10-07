import { afterEach, describe, expect, jest, test } from '@jest/globals';
import logger from './logger.js';

describe('logger', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('writes timestamped structured entries to the matching console stream', () => {
    const output = jest.spyOn(console, 'warn').mockImplementation(() => {});

    logger.warn('Upstream unavailable', { service: 'prices' });

    const entry = JSON.parse(output.mock.calls[0][0]);
    expect(entry).toMatchObject({
      level: 'warn',
      message: 'Upstream unavailable',
      service: 'prices',
    });
    expect(Number.isNaN(Date.parse(entry.timestamp))).toBe(false);
  });

  test('includes request context in logs produced during the request', () => {
    const output = jest.spyOn(console, 'log').mockImplementation(() => {});

    logger.withContext({ requestId: 'request-123' }, () => {
      logger.info('Request handled');
    });

    expect(JSON.parse(output.mock.calls[0][0])).toMatchObject({
      level: 'info',
      message: 'Request handled',
      requestId: 'request-123',
    });
  });
});
