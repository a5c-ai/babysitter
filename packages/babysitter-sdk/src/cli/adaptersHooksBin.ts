#!/usr/bin/env node
/**
 * babysitter-sdk bin shim for `adapters-hooks`.
 *
 * The generated harness plugins (e.g. babysitter-claude) write a hooks.json that
 * invokes the bare `adapters-hooks` binary (from @a5c-ai/hooks-adapter-cli) for
 * every hook event, so that binary must be on PATH wherever the plugin runs.
 * Plugins bootstrap by running `npm i -g @a5c-ai/babysitter-sdk`, but npm only
 * links a package's OWN bins to the global bin dir — never its dependencies' — so
 * a plain dependency on @a5c-ai/hooks-adapter-cli is not enough. Re-exporting it
 * as a babysitter-sdk bin guarantees `adapters-hooks` lands on PATH alongside
 * `babysitter`. We re-exec the dependency's real CLI entry as a child node
 * process so it runs exactly as if invoked directly.
 */
import { spawnSync } from 'node:child_process';

import { resolveDependencyBin } from './resolveDependencyBin';

const entry = resolveDependencyBin('@a5c-ai/hooks-adapter-cli', 'adapters-hooks');
const result = spawnSync(process.execPath, [entry, ...process.argv.slice(2)], {
  stdio: 'inherit',
});
process.exit(result.status ?? 1);
