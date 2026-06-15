#!/usr/bin/env node

/**
 * Entrypoint script for the diff-applier microagent.
 *
 * Delegates to the babysitter process for shell-based git apply + agent fallback.
 * Reads JSON input from stdin, writes JSON output to stdout.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

interface Patch {
  file: string;
  hunks: string[];
}

interface DiffApplierInput {
  patches: Patch[];
}

interface PatchResult {
  file: string;
  success: boolean;
}

interface DiffApplierOutput {
  applied: number;
  failed: number;
  results: PatchResult[];
}

async function main(): Promise<void> {
  const raw = fs.readFileSync(0, 'utf-8');
  const input: DiffApplierInput = JSON.parse(raw);

  const processPath = path.resolve(
    __dirname,
    '..',
    'processes',
    'diff-applier.process.mjs',
  );

  // Dynamic import of ESM .mjs process file from CJS context
  const mod = await import(pathToFileURL(processPath).href);

  const ctx = {
    async task(taskDef: unknown, args: unknown): Promise<unknown> {
      if (typeof taskDef === 'function') {
        return (taskDef as (a: unknown, c: unknown) => unknown)(args, ctx);
      }
      const descriptor = (taskDef as { build: (a: unknown) => unknown }).build
        ? (taskDef as { build: (a: unknown) => unknown }).build(args)
        : taskDef;
      return descriptor;
    },
  };

  const result: DiffApplierOutput = await mod.process(input, ctx);
  process.stdout.write(JSON.stringify(result));
}

main().catch((err: unknown) => {
  process.stderr.write(String(err) + '\n');
  process.exit(1);
});
