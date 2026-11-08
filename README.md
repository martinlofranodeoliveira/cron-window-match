# cron-window-match

Bounded cron-subset matcher: the next fire times after a UTC start instant.
Vixie day rule, no daemon. Zero runtime dependencies, Node >= 22.

Part of the LOFRANO TECNOLOGIA open-source lab. MIT.

## Use

```js
import { parseSchedule, nextFires } from './src/cron.mjs';

const sched = parseSchedule({ minute: '0', hour: '9', dayOfMonth: '*', month: '*', dayOfWeek: '1-5' });
nextFires(sched, '2026-01-01T00:00:00Z', 3);
// ['2026-01-01T09:00:00Z', '2026-01-02T09:00:00Z', '2026-01-05T09:00:00Z']
```

At most 100 fires within 366 days; impossible dates surface as `NO_FIRE`.

## Test and demo

```sh
npm test          # 9 tests, node:test, no dependencies
npm run demo      # fixed schedules, asserts expectations
```

## Limits

Numbers only (no `mon`), UTC only, five fields, list-only output.
See `docs/contract.md`.

## License

MIT — see `LICENSE`.
