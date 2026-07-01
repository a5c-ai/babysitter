#!/usr/bin/env node
/**
 * babysitter-sdk bin shim for `adapters`.
 *
 * Exposes the @a5c-ai/adapters CLI on PATH after `npm i -g @a5c-ai/babysitter-sdk`
 * (see adaptersHooksBin.ts for why a plain dependency is not enough). Some plugin
 * surfaces and doctor checks call the bare `adapters` binary; re-export it here so
 * users no longer have to install @a5c-ai/adapters separately.
 */
import { spawnSync } from 'node:child_process';

import { resolveDependencyBin } from './resolveDependencyBin';

const entry = resolveDependencyBin('@a5c-ai/adapters', 'adapters');
const result = spawnSync(process.execPath, [entry, ...process.argv.slice(2)], {
  stdio: 'inherit',
});
process.exit(result.status ?? 1);
