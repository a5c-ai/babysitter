'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function hashPath(p) {
  const stat = fs.statSync(p);
  if (stat.isDirectory()) {
    const parts = fs.readdirSync(p).sort().map((name) => `${name}:${hashPath(path.join(p, name))}`);
    return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
  }
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
}

function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const cfg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'config', 'upstream-sync.json'), 'utf8'));

  const args = process.argv.slice(2);
  const idx = args.indexOf('--upstream-root');
  if (idx < 0 || !args[idx + 1]) {
    console.error('Usage: node scripts/check-upstream-parity.js --upstream-root <path-to-babysitter-repo>');
    process.exit(1);
  }

  const upstreamRoot = path.resolve(args[idx + 1]);
  let mismatches = 0;

  for (const m of cfg.mappings || []) {
    const src = path.join(upstreamRoot, m.upstream);
    const dst = path.join(repoRoot, m.local);
    if (!fs.existsSync(src) || !fs.existsSync(dst)) {
      console.warn(`[parity] Missing path pair: ${m.upstream} <-> ${m.local}`);
      mismatches += 1;
      continue;
    }
    const hs = hashPath(src);
    const hd = hashPath(dst);
    if (hs !== hd) {
      console.warn(`[parity] MISMATCH: ${m.upstream} <-> ${m.local}`);
      mismatches += 1;
    } else {
      console.log(`[parity] OK: ${m.upstream}`);
    }
  }

  if (mismatches > 0) {
    console.error(`[parity] Failed with ${mismatches} mismatch(es).`);
    process.exit(1);
  }
  console.log('[parity] All mapped paths are in sync.');
}

main();
