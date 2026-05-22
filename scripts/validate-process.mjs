#!/usr/bin/env node
// scripts/validate-process.mjs
//
// Pre-imports each `.a5c/processes/*.process.js` (or `*.js` if no `.process.js`
// convention) in the current working directory and reports any parse / load
// failure with the file path and the error message. Run before `babysitter
// run:create` to catch typo footguns (mismatched quotes, broken template
// literals, missing imports) instead of discovering them mid-iteration.
//
// Exits non-zero when any file fails to load, suitable for pre-commit / CI.
//
// Usage:
//   node scripts/validate-process.mjs [PROCESS_DIR]
//
// Default PROCESS_DIR is `.a5c/processes` relative to the current working
// directory.

import { readdirSync, statSync } from "node:fs";
import { resolve, join, relative } from "node:path";
import { pathToFileURL } from "node:url";

const PROCESS_DIR = process.argv[2] ?? ".a5c/processes";
const dir = resolve(process.cwd(), PROCESS_DIR);

let files;
try {
  files = readdirSync(dir).filter((f) => f.endsWith(".js"));
} catch (err) {
  console.error(
    `error: cannot read process directory ${relative(process.cwd(), dir)} — ${err.message}`,
  );
  process.exit(2);
}

if (files.length === 0) {
  console.log(`no process files in ${relative(process.cwd(), dir)}`);
  process.exit(0);
}

// Prefer .process.js files when both exist; otherwise import every .js.
const processFiles = files.filter((f) => f.endsWith(".process.js"));
const targetFiles = processFiles.length > 0 ? processFiles : files;

let failed = 0;
const t0 = Date.now();

for (const f of targetFiles) {
  const abs = join(dir, f);
  const stat = statSync(abs);
  if (!stat.isFile()) continue;
  const url = pathToFileURL(abs).href;
  try {
    await import(url);
    console.log(`  OK   ${f}`);
  } catch (err) {
    console.error(`  FAIL ${f}`);
    console.error(`       ${err.message}`);
    failed++;
  }
}

const dur = Date.now() - t0;

if (failed > 0) {
  console.error(
    `\n${failed} of ${targetFiles.length} process file(s) failed to load.`,
  );
  console.error(`Fix the parse errors above before running them.`);
  process.exit(1);
}

console.log(
  `\nAll ${targetFiles.length} process files load cleanly (${dur} ms).`,
);
