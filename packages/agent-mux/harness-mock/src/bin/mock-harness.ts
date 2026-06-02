#!/usr/bin/env node

export * from './agent-mux-harness-mock.js';

import { parseArgs, runMockHarness } from './agent-mux-harness-mock.js';

const invokedAsScript = (() => {
  try {
    const argv1 = process.argv[1];
    if (!argv1) return false;
    return /mock-harness(\.js|\.ts)?$/.test(argv1);
  } catch {
    return false;
  }
})();

if (invokedAsScript) {
  process.stderr.write('[agent-mux] "mock-harness" is deprecated, use "agent-mux-harness-mock" instead.\n');
  const args = parseArgs(process.argv.slice(2));
  runMockHarness(args).then(
    (code) => {
      process.exit(code);
    },
    (err) => {
      process.stderr.write(`mock-harness failed: ${(err as Error).message}\n`);
      process.exit(1);
    },
  );
}
