# cron-window-match

Correspondente limitado de subconjunto cron: os próximos disparos após um
instante UTC. Regra de dia Vixie, sem daemon. Zero dependências, Node >= 22.

Parte do laboratório open source da LOFRANO TECNOLOGIA. MIT.

## Uso

```js
import { parseSchedule, nextFires } from './src/cron.mjs';

const sched = parseSchedule({ minute: '0', hour: '9', dayOfMonth: '*', month: '*', dayOfWeek: '1-5' });
nextFires(sched, '2026-01-01T00:00:00Z', 3);
// seg–sex às 09:00, começando no próprio dia 1º
```

No máximo 100 disparos em 366 dias; datas impossíveis retornam `NO_FIRE`.

## Teste e demonstração

```sh
npm test          # 9 testes, node:test, sem dependências
npm run demo      # agendas fixas, confere expectativas
```

## Limites

Somente números (sem `mon`), somente UTC, cinco campos, saída em lista.
Veja `docs/contract.md`.

## Licença

MIT — veja `LICENSE`.
