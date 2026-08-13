#!/usr/bin/env node
'use strict';

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('--version')) {
  process.stdout.write('fix011-good 1.0.0 — FIX-011 verifier fixture CLI\n');
  process.exit(0);
}
process.stderr.write('fix011-good: unknown arguments; try --help\n');
process.exit(2);
