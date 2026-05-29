#!/usr/bin/env node
// HYPOTHESES-falsifier lint for babysitter process files.
//
// When a process file exports a top-level `HYPOTHESES` array (or
// `PROCESS.HYPOTHESES`), every entry MUST have non-empty `id`, `title`,
// `prediction`, and a falsifier under either snake_case
// (`falsifying_observation`) or camelCase (`falsifyingObservation`).
//
// Codifies the cookbook L7 lesson — "hypothesis ranking without
// falsification criteria is noise" — and the May-27 voice-integration
// retro AI-7 follow-up. Run before creating a HYPOTHESES-tree run:
//   npm run check:processes
//
// CLI:
//   node scripts/check-processes.mjs                       # default dir: .a5c/processes
//   node scripts/check-processes.mjs --dir <path>          # custom directory
//   node scripts/check-processes.mjs --self-test           # exits 0 immediately
//
// Process files without a `HYPOTHESES` export are unaffected (backward
// compatible with every existing process module).
import { existsSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

function parseArgs(argv) {
  const args = { dir: null, selfTest: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--self-test') {
      args.selfTest = true;
    } else if (a === '--dir') {
      args.dir = argv[++i];
    } else if (a.startsWith('--dir=')) {
      args.dir = a.slice('--dir='.length);
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));

if (args.selfTest) {
  console.log('check-processes: --self-test OK');
  process.exit(0);
}

const dir = resolve(process.cwd(), args.dir ?? '.a5c/processes');

if (!existsSync(dir) || !statSync(dir).isDirectory()) {
  console.log(`check-processes: no process directory at ${dir} — nothing to lint.`);
  process.exit(0);
}

const files = readdirSync(dir).filter((f) => f.endsWith('.process.js'));

let failed = 0;
let hypLinted = 0;
let hypFailed = 0;

for (const f of files) {
  const url = pathToFileURL(resolve(dir, f)).href;
  let mod;
  try {
    mod = await import(url);
    console.log(`  OK   ${f}`);
  } catch (e) {
    console.error(`  FAIL ${f}`);
    console.error(`       ${e.message}`);
    failed++;
    continue;
  }

  // HYPOTHESES lint — optional, but if present each entry must have a falsifier.
  const hyp = mod.HYPOTHESES ?? mod.PROCESS?.HYPOTHESES;
  if (!Array.isArray(hyp)) continue;
  hypLinted++;
  const fieldNames = ['id', 'title', 'prediction'];
  const falsifierAliases = ['falsifying_observation', 'falsifyingObservation'];
  const problems = [];
  hyp.forEach((entry, i) => {
    if (!entry || typeof entry !== 'object') {
      problems.push(`  - entry [${i}] is not an object`);
      return;
    }
    for (const name of fieldNames) {
      if (typeof entry[name] !== 'string' || entry[name].trim() === '') {
        problems.push(`  - entry [${i}] (id=${entry.id ?? '?'}) missing/empty: ${name}`);
      }
    }
    const fals = falsifierAliases.find(
      (a) => typeof entry[a] === 'string' && entry[a].trim() !== '',
    );
    if (!fals) {
      problems.push(
        `  - entry [${i}] (id=${entry.id ?? '?'}) missing/empty: ` +
          `falsifying_observation (or falsifyingObservation)`,
      );
    }
  });
  if (problems.length > 0) {
    console.error(`  HYP-FAIL ${f}`);
    for (const p of problems) console.error(p);
    hypFailed++;
  } else {
    console.log(
      `       HYPOTHESES (${hyp.length} entries) — all have falsifying_observation`,
    );
  }
}

if (failed > 0 || hypFailed > 0) {
  if (failed > 0) {
    console.error(`\n${failed} process file(s) failed to load. Fix before running them.`);
  }
  if (hypFailed > 0) {
    console.error(
      `${hypFailed} process file(s) have HYPOTHESES entries missing required fields ` +
        `(see L7 — hypothesis ranking without falsification criteria is noise).`,
    );
  }
  process.exit(1);
}

console.log(
  `\nAll ${files.length} process file(s) load cleanly. ` +
    `Linted ${hypLinted} HYPOTHESES array(s).`,
);
