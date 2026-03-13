'use strict';

const fs = require('fs');
const path = require('path');

function parseVersion(v) {
  return String(v || '0.0.0').replace(/^[~^]/, '').split('.').map((x) => Number(x || 0));
}

function gte(a, b) {
  for (let i = 0; i < 3; i++) {
    const av = a[i] || 0;
    const bv = b[i] || 0;
    if (av > bv) return true;
    if (av < bv) return false;
  }
  return true;
}

function main() {
  const root = path.resolve(__dirname, '..');
  const policy = JSON.parse(fs.readFileSync(path.join(root, 'config', 'compatibility-policy.json'), 'utf8'));
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

  const sdkDep = pkg.dependencies && pkg.dependencies['@a5c-ai/babysitter-sdk'];
  if (!sdkDep) {
    console.error('[compat] Missing @a5c-ai/babysitter-sdk dependency.');
    process.exit(1);
  }

  const depV = parseVersion(sdkDep);
  const minV = parseVersion(policy.babysitterSdk.min);
  if (!gte(depV, minV)) {
    console.error(`[compat] SDK dependency ${sdkDep} is below required minimum ${policy.babysitterSdk.min}`);
    process.exit(1);
  }

  const nodeMajor = Number(process.versions.node.split('.')[0]);
  if (!policy.node.supportedMajors.includes(nodeMajor)) {
    console.warn(
      `[compat] Node ${process.versions.node} not in supported matrix ${policy.node.supportedMajors.join(', ')}.`,
    );
  }

  console.log('[compat] Compatibility policy checks passed.');
}

main();
