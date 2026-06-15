#!/usr/bin/env node

import { createHooksLogger } from './hooks-logger';
import { main } from './main';

process.stderr.write('[adapters] "a5c-hooks-adapter" is deprecated, use "adapters-hooks" instead.\n');

const logger = createHooksLogger('a5c-hooks-adapter');
main().catch((err: unknown) => {
  void logger.error('legacy cli main failed', {
    error: err instanceof Error ? err.message : String(err),
  });
  console.error(err);
  process.exit(1);
});
