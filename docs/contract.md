# Contract — cron-window-match

Pure ESM module in `src/cron.mjs`, zero runtime dependencies, Node >= 22.
No network, storage, clock or locale use. UTC only; output ISO `YYYY-MM-DDTHH:MM:SSZ`.

## API

```js
import { parseField, parseSchedule, matches, nextFires } from './src/cron.mjs';
```

| Export | Result |
| --- | --- |
| `MAX_COUNT` (100) · `MAX_HORIZON_DAYS` (366) | Hard bounds. |
| `parseField(raw, name)` | Sorted int array. Fields: `*`, `*/n`, `a`, `a,b`, `a-b`, `a-b/n`. Numbers only (no names). |
| `parseSchedule({minute,hour,dayOfMonth,month,dayOfWeek})` | Frozen schedule with `domRestricted`/`dowRestricted` flags. `7` = Sunday. |
| `matches(sched, date)` / `matchesDay(sched, dom, dow)` | Vixie rule: both restricted → OR, one → that one, none → true. |
| `nextFires(sched, startISO, count, horizonDays=366)` | `count` ISO strings strictly after start. Throws `NO_FIRE` when exhausted. |

## Error codes

`BAD_FIELD` · `EMPTY_FIELD` · `BAD_TOKEN` · `BAD_STEP` · `OUT_OF_RANGE` ·
`BAD_START` · `COUNT_BOUND` · `HORIZON_BOUND` · `NO_FIRE`

## Bounds

At most 100 fires, 366-day horizon. Impossible dates (e.g. Feb 30) never
match — the real calendar is the oracle, so they surface as `NO_FIRE`,
never as silent skips.
