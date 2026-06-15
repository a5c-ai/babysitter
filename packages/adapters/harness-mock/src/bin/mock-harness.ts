#!/usr/bin/env node

export * from './adapters-harness-mock.js';

import { parseArgs, runMockHarness } from './adapters-harness-mock.js';

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
  process.stderr.write('[adapters] "mock-harness" is deprecated, use "adapters-harness-mock" instead.\n');
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
