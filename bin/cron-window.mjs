#!/usr/bin/env node
// Demo: two schedules, fixed expectations, no network. --assert exits non-zero on mismatch.
import { parseSchedule, nextFires } from '../src/cron.mjs';

const START = '2026-01-01T00:00:00Z';
const CASES = [
  [{ minute: '*/30', hour: '8-10', dayOfMonth: '*', month: '*', dayOfWeek: '*' }, 4],
  [{ minute: '0', hour: '9', dayOfMonth: '*', month: '*', dayOfWeek: '1-5' }, 3],
];

let failed = 0;
for (const [fields, n] of CASES) {
  try {
    const fires = nextFires(parseSchedule(fields), START, n);
    const ok = fires.length === n && fires.every((f) => f > START);
    if (!ok) failed++;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${JSON.stringify(fields)} -> ${fires.join(', ')}`);
  } catch (e) {
    failed++;
    console.log(`FAIL ${JSON.stringify(fields)} -> threw ${e.code}`);
  }
}
if (process.argv.includes('--assert') && failed > 0) process.exit(1);
if (failed > 0) process.exitCode = 1;
console.log(failed === 0 ? 'demo: all cases as expected' : `demo: ${failed} mismatch(es)`);
