# Design — cron-window-match

## Matching

Minute/hour/month must all match. Days follow Vixie cron: when both
day-of-month and day-of-week are restricted (`*` means unrestricted),
a day fires if either matches; otherwise the restricted field decides.
Unrestricted everything means every day.

The scan walks minute by minute from `start + 1 minute` (seconds zeroed)
to `start + horizonDays`. Cost is bounded: worst case 366·1440 ≈ 527k
iterations of O(1) set-membership checks.

## Oracle

Tests pin hand-computed calendars (2026-01-01 is a Thursday): every-minute,
Monday mornings, first-of-month-today, Vixie OR, and the Feb-29 gap
(`NO_FIRE` within a year from 2026, found from 2028). A wrong weekday
table or an off-by-one in exclusivity fails immediately.

## Non-goals

No names (`mon`), no seconds/years, no timezone support, no daemon.
Numbers only, UTC only, list-only output.
