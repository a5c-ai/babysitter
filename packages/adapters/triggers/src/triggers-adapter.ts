#!/usr/bin/env node

import { main } from './cli.js';

process.stderr.write('[adapters] "triggers-adapter" is deprecated, use "adapters-triggers" instead.\n');
main().then((code) => {
  process.exitCode = code;
}).catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
