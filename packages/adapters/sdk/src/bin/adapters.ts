#!/usr/bin/env node
/**
 * `adapters` bin shim for the meta-package `@a5c-ai/adapters`.
 * Explicitly calls the CLI's main() instead of relying on its
 * import-time self-run heuristic.
 */
import { runCli } from '@a5c-ai/adapters-cli';

runCli()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((err: unknown) => {
    process.stderr.write(`Fatal error: ${err instanceof Error ? err.message : String(err)}\n`);
    process.exitCode = 1;
  });
