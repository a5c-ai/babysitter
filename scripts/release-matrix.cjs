#!/usr/bin/env node
/**
 * Release matrix generator (FIX-005).
 *
 * Prints a release group derived from the authoritative publishable-package
 * inventory so that GitHub Actions workflows never carry a hand-maintained
 * package list. See scripts/lib/release-matrix.cjs for the group definitions.
 *
 * Usage:
 *   node scripts/release-matrix.cjs --group hooks-leaves               # matrix
 *   node scripts/release-matrix.cjs --group hooks-leaves --format workspaces
 *   node scripts/release-matrix.cjs --group hooks-leaves --format json
 *   node scripts/release-matrix.cjs --list-groups
 *
 * Formats:
 *   matrix      (default) one-line JSON array of {name, workspace} objects,
 *               ready for `strategy.matrix.include: ${{ fromJson(...) }}`
 *   workspaces  one package name per line, for shell loops
 *   json        the full group entries, pretty printed
 *
 * Read-only: never builds, publishes, or contacts the registry.
 */
'use strict';

const path = require('path');
const { listGroup, listGroupIds, GROUPS } = require('./lib/release-matrix.cjs');

const repoRoot = path.resolve(__dirname, '..');
const FORMATS = new Set(['matrix', 'workspaces', 'json']);

function parseArgs(argv) {
  const options = { group: null, format: 'matrix', listGroups: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--list-groups') {
      options.listGroups = true;
    } else if (arg === '--group' || arg === '--format') {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith('--')) {
        throw new Error(`${arg} requires a value`);
      }
      options[arg === '--group' ? 'group' : 'format'] = value;
      i += 1;
    } else if (arg.startsWith('--group=')) {
      options.group = arg.slice('--group='.length);
    } else if (arg.startsWith('--format=')) {
      options.format = arg.slice('--format='.length);
    } else if (arg === '--help' || arg === '-h') {
      process.stdout.write('See the header comment of scripts/release-matrix.cjs for usage.\n');
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return options;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.listGroups) {
    for (const groupId of listGroupIds()) {
      process.stdout.write(`${groupId}\t${GROUPS[groupId].description}\n`);
    }
    return;
  }
  if (!options.group) {
    throw new Error(`--group is required; known groups: ${listGroupIds().join(', ')}`);
  }
  if (!FORMATS.has(options.format)) {
    throw new Error(`Unknown --format ${JSON.stringify(options.format)}; known formats: ${[...FORMATS].join(', ')}`);
  }
  const members = listGroup(repoRoot, options.group);
  if (options.format === 'workspaces') {
    process.stdout.write(`${members.map((member) => member.name).join('\n')}\n`);
    return;
  }
  if (options.format === 'json') {
    process.stdout.write(`${JSON.stringify(members, null, 2)}\n`);
    return;
  }
  process.stdout.write(
    `${JSON.stringify(members.map((member) => ({ name: member.jobName, workspace: member.name })))}\n`,
  );
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
}
