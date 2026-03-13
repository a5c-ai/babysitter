#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = process.cwd();
const TARGETS = [
  'upstream/babysitter/plugin.json',
  'upstream/babysitter/commands',
  'upstream/babysitter/skills',
  'config/codex-command-map.json',
];

function sha256File(filePath) {
  const h = crypto.createHash('sha256');
  h.update(fs.readFileSync(filePath));
  return h.digest('hex');
}

function walk(dir) {
  const out = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function collectFiles(target) {
  const full = path.join(ROOT, target);
  if (!fs.existsSync(full)) return [];
  if (fs.statSync(full).isFile()) return [full];
  return walk(full);
}

function main() {
  const files = [];
  for (const t of TARGETS) files.push(...collectFiles(t));
  files.sort();

  const entries = files.map((f) => ({
    path: path.relative(ROOT, f).replace(/\\/g, '/'),
    sha256: sha256File(f),
    size: fs.statSync(f).size,
  }));

  const aggregate = crypto
    .createHash('sha256')
    .update(entries.map((e) => `${e.path}:${e.sha256}`).join('\n'))
    .digest('hex');

  const manifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    algorithm: 'sha256',
    targets: TARGETS,
    aggregateSha256: aggregate,
    signature: null,
    signatureAlgorithm: null,
    files: entries,
  };

  const signingKey = process.env.BABYSITTER_MANIFEST_SIGNING_KEY;
  if (signingKey) {
    manifest.signatureAlgorithm = 'hmac-sha256';
    manifest.signature = crypto
      .createHmac('sha256', signingKey)
      .update(aggregate)
      .digest('hex');
  }

  const outPath = path.join(ROOT, 'config', 'content-manifest.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`[content-manifest] wrote ${entries.length} entries to ${outPath}`);
}

main();
