#!/usr/bin/env node
'use strict';

// Mirrors the @a5c-ai/babysitter metapackage shape: the package's ONLY consumer
// surface is this executable. There is no index.js and no `main`, so a release
// gate that synthesizes a root import for it is asserting something the package
// never promised.
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('--version')) {
  process.stdout.write('fix011-bin-only 1.0.0 — FIX-011 bin-only metapackage fixture\n');
  process.exit(0);
}
process.stderr.write('fix011-bin-only: unknown arguments; try --help\n');
process.exit(2);
