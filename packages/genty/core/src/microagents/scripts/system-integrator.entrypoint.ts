#!/usr/bin/env node

/**
 * Entrypoint script for the system-integrator microagent.
 *
 * Delegates to the babysitter process for agent-based system integration.
 * Reads JSON input from stdin, writes JSON output to stdout.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

interface IntegratorInput {
  system: string;
  operation: string;
  params: Record<string, unknown>;
}

interface IntegratorOutput {
  response: Record<string, unknown>;
  statusCode: number;
}

async function main(): Promise<void> {
  const raw = fs.readFileSync(0, 'utf-8');
  const input: IntegratorInput = JSON.parse(raw);

  const processPath = path.resolve(
    __dirname,
    '..',
    'processes',
    'system-integrator.process.mjs',
  );

  // Dynamic import of ESM .mjs process file from CJS context
  const mod = await import(pathToFileURL(processPath).href);

  // Minimal ctx stub — in production, the babysitter runtime provides the real ctx
  const ctx = {
    async task(taskDef: unknown, args: unknown): Promise<unknown> {
      if (typeof taskDef === 'function') {
        return (taskDef as (a: unknown, c: unknown) => unknown)(args, ctx);
      }
      // taskDef is a defineTask result — return the task descriptor for the runner
      const descriptor = (taskDef as { build: (a: unknown) => unknown }).build
        ? (taskDef as { build: (a: unknown) => unknown }).build(args)
        : taskDef;
      return descriptor;
    },
  };

  const result: IntegratorOutput = await mod.process(input, ctx);
  process.stdout.write(JSON.stringify(result));
}

main().catch((err: unknown) => {
  process.stderr.write(String(err) + '\n');
  process.exit(1);
});
