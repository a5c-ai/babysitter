import { definePlugin } from '../plugin.js';

function parseThresholds(env: string | undefined): number[] {
  const raw = env?.trim() ? env : '1,5,10';
  return raw
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b);
}

export function makeCostAlerter(
  thresholds: number[],
  emit: (msg: string) => void,
): (totalUsd: number) => void {
  let nextIdx = 0;
  return (totalUsd: number) => {
    while (nextIdx < thresholds.length && totalUsd >= thresholds[nextIdx]!) {
      emit(`⚠ cost crossed $${thresholds[nextIdx]!.toFixed(2)} (now $${totalUsd.toFixed(4)})`);
      nextIdx += 1;
    }
  };
}

export default definePlugin({
  name: 'builtin:cost-alerts',
  register(ctx) {
    const thresholds = parseThresholds(process.env.AMUX_TUI_COST_ALERT);
    if (thresholds.length === 0) return;
    let total = 0;
    const alert = makeCostAlerter(thresholds, (message) =>
      ctx.emit({ type: 'status', message }),
    );
    ctx.eventStream.subscribe((ev) => {
      if (ev.type !== 'cost') return;
      const inc = ev.cost.totalUsd;
      if (typeof inc !== 'number') return;
      total += inc;
      alert(total);
    });
  },
});
