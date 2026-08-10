#!/usr/bin/env node
/**
 * `kip` — the executable `bin` entry (spec §1). A thin shim: parse `process.argv`, call `runCli`,
 * and `process.exit` with the resolved code (spec §3's 0-6 contract). All real work lives in
 * `runCli` (`./index`), which is `process.exit`-free so the frozen suite can invoke it in-process.
 *
 * SCOPE BOUNDARY (spec §1, AC-1): this shim links `@a5c-ai/kip-sdk` (self) only; the `ask` path's
 * genty link is lazily resolved inside `./ask`. No `@a5c-ai/babysitter-sdk` anywhere on the path.
 */
import { runCli } from "./index";

async function main(): Promise<void> {
  const code = await runCli(process.argv.slice(2), {
    cwd: process.cwd(),
    env: process.env,
    stdout: (chunk) => process.stdout.write(chunk),
    stderr: (chunk) => process.stderr.write(chunk),
  });
  process.exit(code);
}

void main();
