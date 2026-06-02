#!/usr/bin/env node

import { main } from './cli.js';

process.stderr.write('[agent-mux] "triggers-mux" is deprecated, use "agent-mux-triggers" instead.\n');
main().then((code) => {
  process.exitCode = code;
}).catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
