// SPDX-License-Identifier: MIT
// Bounded cron-subset matcher: parse five fields, list the next fire times
// strictly after a UTC start instant. Vixie day rule, no daemon, no locale.

export const MAX_COUNT = 100;
export const MAX_HORIZON_DAYS = 366;

export class CronError extends Error {
  constructor(code, detail = '') {
    super(detail ? `${code}: ${detail}` : code);
    this.name = 'CronError';
    this.code = code;
  }
}

const FIELD_BOUNDS = Object.freeze({
  minute: [0, 59],
  hour: [0, 23],
  dayOfMonth: [1, 31],
  month: [1, 12],
  dayOfWeek: [0, 6],
});

/** Parse one cron field: '*', '*\/n', 'a', 'a,b', 'a-b', 'a-b/n'. Returns sorted ints. */
export function parseField(raw, name) {
  const [lo, hi] = FIELD_BOUNDS[name] ?? [];
  if (lo === undefined) throw new CronError('BAD_FIELD', name);
  if (typeof raw !== 'string' || raw.trim() === '') throw new CronError('EMPTY_FIELD', name);
  const out = new Set();
  for (const part of raw.split(',')) {
    const m = part.match(/^(\*|\d+)(?:-(\d+))?(?:\/(\d+))?$/);
    if (!m) throw new CronError('BAD_TOKEN', `${name}:${part}`);
    let start = m[1] === '*' ? lo : Number(m[1]);
    let end = m[2] !== undefined ? Number(m[2]) : (m[1] === '*' ? hi : start);
    const step = m[3] !== undefined ? Number(m[3]) : 1;
    if (m[1] === '*' && m[2] !== undefined) throw new CronError('BAD_TOKEN', `${name}:${part}`);
    if (step < 1) throw new CronError('BAD_STEP', `${name}:${part}`);
    if (start < lo || end > hi || start > end) throw new CronError('OUT_OF_RANGE', `${name}:${part}`);
    for (let v = start; v <= end; v += step) out.add(v);
  }
  if (out.size === 0) throw new CronError('EMPTY_FIELD', name);
  return [...out].sort((a, b) => a - b);
}

/** Parse a 5-field schedule. dayOfWeek accepts 7 as Sunday (normalized to 0). */
export function parseSchedule({ minute, hour, dayOfMonth, month, dayOfWeek }) {
  const sched = {
    minute: parseField(minute, 'minute'),
    hour: parseField(hour, 'hour'),
    dayOfMonth: parseField(dayOfMonth, 'dayOfMonth'),
    month: parseField(month, 'month'),
    dayOfWeek: parseField(String(dayOfWeek).replace(/\b7\b/g, '0'), 'dayOfWeek'),
  };
  sched.domRestricted = !(sched.dayOfMonth.length === 31 && sched.dayOfMonth[0] === 1);
  sched.dowRestricted = !(sched.dayOfWeek.length === 7 && sched.dayOfWeek[0] === 0);
  return Object.freeze(sched);
}

function has(set, v) {
  return set.includes(v);
}

/** Vixie rule: both dom+dow restricted -> OR; else the restricted one; else true. */
export function matchesDay(sched, dayOfMonth, dayOfWeek) {
  const dom = has(sched.dayOfMonth, dayOfMonth);
  const dow = has(sched.dayOfWeek, dayOfWeek);
  if (sched.domRestricted && sched.dowRestricted) return dom || dow;
  if (sched.domRestricted) return dom;
  if (sched.dowRestricted) return dow;
  return true;
}

export function matches(sched, date) {
  return (
    has(sched.minute, date.getUTCMinutes()) &&
    has(sched.hour, date.getUTCHours()) &&
    has(sched.month, date.getUTCMonth() + 1) &&
    matchesDay(sched, date.getUTCDate(), date.getUTCDay())
  );
}

function parseStart(iso) {
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?Z$/.test(iso)) {
    throw new CronError('BAD_START', 'expected YYYY-MM-DDTHH:MM[:SS]Z');
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) throw new CronError('BAD_START');
  return d;
}

/**
 * Next `count` fire times strictly after `startISO` (UTC ISO string).
 * Scans minute by minute up to `horizonDays`; throws NO_FIRE when the
 * window is exhausted, COUNT_BOUND/HORIZON_BOUND on bad limits.
 */
export function nextFires(sched, startISO, count, horizonDays = MAX_HORIZON_DAYS) {
  if (!Number.isInteger(count) || count < 1 || count > MAX_COUNT) throw new CronError('COUNT_BOUND');
  if (!Number.isInteger(horizonDays) || horizonDays < 1 || horizonDays > MAX_HORIZON_DAYS) {
    throw new CronError('HORIZON_BOUND');
  }
  const start = parseStart(startISO);
  const out = [];
  const cursor = new Date(start.getTime() + 60000);
  cursor.setUTCSeconds(0, 0);
  const deadline = start.getTime() + horizonDays * 86400000;
  while (cursor.getTime() <= deadline) {
    // Guard against Date auto-rollover accepting impossible combos is
    // unnecessary here: fields are matched against the real calendar date.
    if (matches(sched, cursor)) {
      out.push(cursor.toISOString().slice(0, 19) + 'Z');
      if (out.length === count) return out;
    }
    cursor.setTime(cursor.getTime() + 60000);
  }
  throw new CronError('NO_FIRE', `${out.length} of ${count} within ${horizonDays}d`);
}
