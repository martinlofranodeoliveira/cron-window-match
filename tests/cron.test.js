import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseField, parseSchedule, nextFires, CronError } from '../src/cron.mjs';

const START = '2026-01-01T00:00:00Z'; // a Thursday

describe('parseField', () => {
  it('parses star, lists, ranges and steps', () => {
    assert.deepEqual(parseField('*', 'minute'), Array.from({ length: 60 }, (_, i) => i));
    assert.deepEqual(parseField('*/15', 'minute'), [0, 15, 30, 45]);
    assert.deepEqual(parseField('1,5-7', 'hour'), [1, 5, 6, 7]);
    assert.deepEqual(parseField('2-10/3', 'hour'), [2, 5, 8]);
  });
  it('rejects bad tokens, steps and ranges', () => {
    assert.throws(() => parseField('60', 'minute'), (e) => e.code === 'OUT_OF_RANGE');
    assert.throws(() => parseField('*/0', 'minute'), (e) => e.code === 'BAD_STEP');
    assert.throws(() => parseField('', 'hour'), (e) => e.code === 'EMPTY_FIELD');
    assert.throws(() => parseField('mon', 'dayOfWeek'), (e) => e.code === 'BAD_TOKEN');
  });
  it('accepts 7 as Sunday', () => {
    assert.deepEqual(parseSchedule({ minute: '0', hour: '0', dayOfMonth: '*', month: '*', dayOfWeek: '7' }).dayOfWeek, [0]);
  });
});

describe('nextFires', () => {
  it('every minute', () => {
    const s = parseSchedule({ minute: '*', hour: '*', dayOfMonth: '*', month: '*', dayOfWeek: '*' });
    assert.deepEqual(nextFires(s, START, 3), [
      '2026-01-01T00:01:00Z', '2026-01-01T00:02:00Z', '2026-01-01T00:03:00Z',
    ]);
  });
  it('Monday mornings (dow restricted)', () => {
    const s = parseSchedule({ minute: '0', hour: '9', dayOfMonth: '*', month: '*', dayOfWeek: '1' });
    assert.deepEqual(nextFires(s, START, 3), [
      '2026-01-05T09:00:00Z', '2026-01-12T09:00:00Z', '2026-01-19T09:00:00Z',
    ]);
  });
  it('first of month includes today when ahead', () => {
    const s = parseSchedule({ minute: '0', hour: '8', dayOfMonth: '1', month: '*', dayOfWeek: '*' });
    assert.deepEqual(nextFires(s, START, 2), ['2026-01-01T08:00:00Z', '2026-02-01T08:00:00Z']);
  });
  it('Vixie OR: 15th or Wednesdays', () => {
    const s = parseSchedule({ minute: '0', hour: '12', dayOfMonth: '15', month: '*', dayOfWeek: '3' });
    assert.deepEqual(nextFires(s, START, 4), [
      '2026-01-07T12:00:00Z', '2026-01-14T12:00:00Z', '2026-01-15T12:00:00Z', '2026-01-21T12:00:00Z',
    ]);
  });
  it('leap day: none within a year, found from 2028', () => {
    const s = parseSchedule({ minute: '0', hour: '0', dayOfMonth: '29', month: '2', dayOfWeek: '*' });
    assert.throws(() => nextFires(s, START, 1, 366), (e) => e.code === 'NO_FIRE');
    assert.deepEqual(nextFires(s, '2028-01-01T00:00:00Z', 1, 366), ['2028-02-29T00:00:00Z']);
  });
  it('bounds and bad start', () => {
    const s = parseSchedule({ minute: '*', hour: '*', dayOfMonth: '*', month: '*', dayOfWeek: '*' });
    assert.throws(() => nextFires(s, START, 0), (e) => e.code === 'COUNT_BOUND');
    assert.throws(() => nextFires(s, START, 101), (e) => e.code === 'COUNT_BOUND');
    assert.throws(() => nextFires(s, START, 1, 367), (e) => e.code === 'HORIZON_BOUND');
    assert.throws(() => nextFires(s, 'yesterday', 1), (e) => e.code === 'BAD_START');
    assert.ok(new CronError('X') instanceof Error);
  });
});
