#!/usr/bin/env node
'use strict';

/**
 * write-json.js
 *
 * CLI helper that safely constructs and writes a JSON file, avoiding shell
 * printf injection risks when building JSON with user-supplied or dynamic values.
 *
 * Usage:
 *   node write-json.js <output-file> <key=value> [key=value ...]
 *
 * Supported value types (auto-detected):
 *   - integers  : key=42
 *   - booleans  : key=true | key=false
 *   - strings   : key=anything-else
 *
 * Example:
 *   node write-json.js /tmp/out.json runId=abc123 iteration=3 status=ok
 */

const path = require('path');
const fs = require('fs');

function parsePairs(pairs) {
  const obj = {};
  for (const pair of pairs) {
    const eqIdx = pair.indexOf('=');
    if (eqIdx === -1) {
      continue;
    }
    const key = pair.slice(0, eqIdx);
    const raw = pair.slice(eqIdx + 1);

    if (raw === 'true') {
      obj[key] = true;
    } else if (raw === 'false') {
      obj[key] = false;
    } else if (raw !== '' && !isNaN(Number(raw)) && !isNaN(parseFloat(raw))) {
      obj[key] = Number(raw);
    } else {
      obj[key] = raw;
    }
  }
  return obj;
}

function writeJsonFile(outputFile, obj) {
  const dir = path.dirname(outputFile);
  fs.mkdirSync(dir, { recursive: true });

  const tmpFile = outputFile + '.tmp';
  fs.writeFileSync(tmpFile, JSON.stringify(obj, null, 2) + '\n', 'utf8');
  fs.renameSync(tmpFile, outputFile);
}

function main(argv) {
  const args = argv.slice(2);
  if (args.length < 1) {
    process.stderr.write('Usage: write-json.js <output-file> [key=value ...]\n');
    process.exit(1);
  }

  const outputFile = args[0];
  const pairs = args.slice(1);
  const obj = parsePairs(pairs);
  writeJsonFile(outputFile, obj);
}

if (require.main === module) {
  main(process.argv);
}

module.exports = { parsePairs, writeJsonFile };
