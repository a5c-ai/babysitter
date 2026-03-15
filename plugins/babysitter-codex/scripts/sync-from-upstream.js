'use strict';

const fs = require('fs');
const path = require('path');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const name of fs.readdirSync(src)) {
      copyRecursive(path.join(src, name), path.join(dest, name));
    }
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function removeRecursive(target) {
  if (!fs.existsSync(target)) return;
  fs.rmSync(target, { recursive: true, force: true });
}

function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const cfg = readJson(path.join(repoRoot, 'config', 'upstream-sync.json'));

  const args = process.argv.slice(2);
  const idx = args.indexOf('--upstream-root');
  if (idx < 0 || !args[idx + 1]) {
    console.error('Usage: node scripts/sync-from-upstream.js --upstream-root <path-to-babysitter-repo>');
    process.exit(1);
  }

  const upstreamRoot = path.resolve(args[idx + 1]);
  if (!fs.existsSync(upstreamRoot)) {
    console.error(`Upstream root not found: ${upstreamRoot}`);
    process.exit(1);
  }

  for (const m of cfg.mappings || []) {
    const src = path.join(upstreamRoot, m.upstream);
    const dst = path.join(repoRoot, m.local);
    if (!fs.existsSync(src)) {
      console.warn(`[sync] Skipping missing upstream path: ${m.upstream}`);
      continue;
    }
    removeRecursive(dst);
    copyRecursive(src, dst);
    console.log(`[sync] ${m.upstream} -> ${m.local}`);
  }

  console.log('[sync] Done.');
}

main();
