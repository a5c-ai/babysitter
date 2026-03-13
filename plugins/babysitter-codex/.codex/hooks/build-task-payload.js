#!/usr/bin/env node
'use strict';

/**
 * build-task-payload.js
 *
 * Reads a codex output file and builds a JSON task payload for babysitter task:post.
 * Replaces the inline `node -e` call in loop-control.sh to avoid path injection risks.
 *
 * Usage:
 *   node build-task-payload.js <output-file> <iteration> <exit-code>
 *
 * Outputs the JSON payload to stdout.
 */

const fs = require('fs');

const outputFile = process.argv[2];
const iteration = parseInt(process.argv[3], 10);
const exitCode = parseInt(process.argv[4], 10);

let output = '(no output)';
try {
  output = fs.readFileSync(outputFile, 'utf8').slice(0, 4096);
} catch (_) {
  output = '(no output)';
}

const payload = {
  iteration: iteration,
  codexExitCode: exitCode,
  output: output,
};

process.stdout.write(JSON.stringify(payload));
