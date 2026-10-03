import { describe, expect, test } from '@jest/globals';
import { toDateKey } from './utils.js';

describe('toDateKey', () => {
  test('converts German-formatted dates to ISO date keys', () => {
    expect(toDateKey('15.01.2024')).toBe('2024-01-15');
  });

  test('rejects impossible German-formatted dates', () => {
    expect(() => toDateKey('31.02.2024')).toThrow('invalid date value');
  });

  test('rejects impossible ISO dates', () => {
    expect(() => toDateKey('2024-02-30')).toThrow('invalid date value');
  });

  test('converts Date values to ISO date keys', () => {
    expect(toDateKey(new Date('2024-01-15T12:00:00.000Z'))).toBe('2024-01-15');
  });
});
