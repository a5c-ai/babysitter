#!/usr/bin/env node
let count = 0;

const intervalMs = Number(process.env.SLOW_LOGGER_INTERVAL_MS || "50");

function emitTick() {
  count += 1;
  const stdoutLine = `tick-${count}`;
  const stderrLine = `tock-${count}`;
  process.stdout.write(`${stdoutLine}\n`);
  process.stderr.write(`${stderrLine}\n`);
}

emitTick();
setInterval(emitTick, intervalMs);
