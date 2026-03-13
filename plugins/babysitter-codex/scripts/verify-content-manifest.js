#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function sha256File(filePath) {
  const h = crypto.createHash('sha256');
  h.update(fs.readFileSync(filePath));
  return h.digest('hex');
}

function main() {
  const root = process.cwd();
  const manifestPath = path.join(root, 'config', 'content-manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`missing manifest: ${manifestPath}`);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const bad = [];
  for (const entry of manifest.files || []) {
    const full = path.join(root, entry.path);
    if (!fs.existsSync(full)) {
      bad.push({ path: entry.path, reason: 'missing' });
      continue;
    }
    const current = sha256File(full);
    if (current !== entry.sha256) {
      bad.push({ path: entry.path, reason: 'hash_mismatch' });
    }
  }
  if (bad.length > 0) {
    console.error('[content-manifest] integrity check failed:', JSON.stringify(bad.slice(0, 20), null, 2));
    process.exit(1);
  }
  if (manifest.signature && manifest.signatureAlgorithm === 'hmac-sha256') {
    const verifyKey = process.env.BABYSITTER_MANIFEST_SIGNING_KEY;
    if (!verifyKey) {
      console.error('[content-manifest] signature present but BABYSITTER_MANIFEST_SIGNING_KEY is not set');
      process.exit(1);
    }
    const expectedSig = crypto
      .createHmac('sha256', verifyKey)
      .update(manifest.aggregateSha256)
      .digest('hex');
    if (expectedSig !== manifest.signature) {
      console.error('[content-manifest] signature verification failed');
      process.exit(1);
    }
  }
  console.log(`[content-manifest] verified ${manifest.files.length} files`);
}

main();
