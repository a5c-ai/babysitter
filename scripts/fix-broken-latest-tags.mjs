#!/usr/bin/env node
/**
 * Fix broken npm `latest` tags by retagging to the last working version.
 *
 * Some packages were published to npm without their dist/ directory,
 * resulting in empty packages on the `latest` tag. This script finds
 * the last version with a proper build and retags `latest` to it.
 *
 * Usage:
 *   node scripts/fix-broken-latest-tags.mjs          # dry run
 *   node scripts/fix-broken-latest-tags.mjs --fix     # actually retag
 */

import { execSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';

const FIX = process.argv.includes('--fix');
const MIN_FILES = 5;
const MIN_SIZE = 10000;

const packageDirs = [
  'packages/sdk', 'packages/babysitter', 'packages/babysitter-agent',
  'packages/agent-core', 'packages/agent-catalog', 'packages/atlas',
  'packages/transport-mux', 'packages/extension-mux', 'packages/tasks-mux',
  'packages/triggers', 'packages/cloud', 'packages/observer-dashboard',
  'packages/babysitter-tui-plugins',
  'packages/agent-mux/core', 'packages/agent-mux/cli', 'packages/agent-mux/adapters',
  'packages/agent-mux/gateway', 'packages/agent-mux/tui', 'packages/agent-mux/ui',
  'packages/agent-mux/webui', 'packages/agent-mux',
  'packages/agent-mux/observability',
  'packages/hooks-mux/core', 'packages/hooks-mux/cli',
  'packages/krate/core',
];

function run(cmd) {
  try { return execSync(cmd, { encoding: 'utf8', timeout: 15000 }).trim(); } catch { return ''; }
}

function getPackageName(dir) {
  try {
    const pkg = JSON.parse(readFileSync(`${dir}/package.json`, 'utf8'));
    return pkg.private ? null : pkg.name;
  } catch { return null; }
}

async function main() {
  const broken = [];

  for (const dir of packageDirs) {
    const name = getPackageName(dir);
    if (!name) continue;

    const latest = run(`npm view ${name}@latest version`);
    if (!latest) continue;

    const fileCount = parseInt(run(`npm view ${name}@${latest} dist.fileCount`)) || 0;
    const size = parseInt(run(`npm view ${name}@${latest} dist.unpackedSize`)) || 0;

    if (fileCount < MIN_FILES || size < MIN_SIZE) {
      // Find last working version
      const allVersions = JSON.parse(run(`npm view ${name} versions --json`) || '[]');
      const nonStaging = allVersions.filter(v => !v.includes('staging'));

      let lastGood = null;
      for (let i = nonStaging.length - 1; i >= 0; i--) {
        const v = nonStaging[i];
        const fc = parseInt(run(`npm view ${name}@${v} dist.fileCount`)) || 0;
        const sz = parseInt(run(`npm view ${name}@${v} dist.unpackedSize`)) || 0;
        if (fc >= MIN_FILES && sz >= MIN_SIZE) {
          lastGood = { version: v, fileCount: fc, size: sz };
          break;
        }
      }

      broken.push({ name, latest, fileCount, size, lastGood });
    }
  }

  if (broken.length === 0) {
    console.log('All packages have valid latest tags.');
    return;
  }

  console.log(`Found ${broken.length} broken package(s):\n`);
  for (const b of broken) {
    console.log(`  ${b.name}@${b.latest} — ${b.fileCount} files, ${b.size} bytes`);
    if (b.lastGood) {
      console.log(`    Last good: ${b.lastGood.version} (${b.lastGood.fileCount} files, ${b.lastGood.size} bytes)`);
      if (FIX) {
        console.log(`    Retagging: npm dist-tag add ${b.name}@${b.lastGood.version} latest`);
        const result = run(`npm dist-tag add ${b.name}@${b.lastGood.version} latest`);
        console.log(`    Result: ${result || 'done'}`);
      } else {
        console.log(`    Would run: npm dist-tag add ${b.name}@${b.lastGood.version} latest`);
      }
    } else {
      console.log(`    No working non-staging version found!`);
    }
    console.log();
  }

  if (!FIX) {
    console.log('Dry run — pass --fix to actually retag.');
  }
}

main().catch(console.error);
