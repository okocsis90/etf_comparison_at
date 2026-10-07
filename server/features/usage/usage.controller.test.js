import { afterEach, describe, expect, jest, test } from '@jest/globals';

const mockRecordDailyVisitor = jest.fn();
jest.unstable_mockModule('./usage.repository.js', () => ({
  default: mockRecordDailyVisitor,
}));

const mockLogger = { error: jest.fn() };
jest.unstable_mockModule('../../shared/logger.js', () => ({
  default: mockLogger,
}));

const { default: usageController } = await import('./usage.controller.js');

describe('usageController', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('rejects an invalid visitor ID', async () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await usageController({ body: { visitorId: 'invalid' } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockRecordDailyVisitor).not.toHaveBeenCalled();
  });

  test('records a valid visitor and returns no content', async () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      end: jest.fn(),
    };

    await usageController(
      { body: { visitorId: 'c56a4180-65aa-42ec-a945-5fd21dec0538' } },
      res
    );

    expect(mockRecordDailyVisitor).toHaveBeenCalledWith('c56a4180-65aa-42ec-a945-5fd21dec0538');
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.end).toHaveBeenCalled();
  });
});
