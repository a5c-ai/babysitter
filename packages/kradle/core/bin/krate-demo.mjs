#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { createKradleMvpDemo, createKradleHandoffSummary, formatHandoffSummary, runSmokeAssertions } from '../src/index.js';

const args = new Set(process.argv.slice(2));
if (args.has('--help') || args.has('-h')) {
  console.log(`Usage: kradle-demo [--json]\n\nPrint the Kradle executable MVP handoff summary.\n\nOptions:\n  --json   Emit machine-readable JSON\n  --help   Show this help`);
  process.exit(0);
}

const packageInfo = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const demo = createKradleMvpDemo();
const smoke = runSmokeAssertions(demo);
demo.smoke = smoke;
const summary = createKradleHandoffSummary(demo, { packageInfo });

if (args.has('--json')) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  process.stdout.write(formatHandoffSummary(summary));
}

if (!smoke.ok) process.exit(1);
