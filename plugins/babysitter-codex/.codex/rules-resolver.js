'use strict';

const fs = require('fs');
const path = require('path');

function safeReadJson(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) || {};
  } catch {
    return {};
  }
}

function mergeRules(base, extra) {
  const out = { ...base };
  for (const [k, v] of Object.entries(extra || {})) {
    if (Array.isArray(v)) out[k] = [...v];
    else if (v && typeof v === 'object' && !Array.isArray(v)) out[k] = mergeRules(out[k] || {}, v);
    else out[k] = v;
  }
  return out;
}

function resolveRules(repoRoot, options = {}) {
  const root = repoRoot || process.cwd();
  const layers = [
    path.join(root, 'config', 'rules', 'upstream-base.json'),
    path.join(root, 'config', 'rules', 'team', 'default.json'),
    path.join(root, '.a5c', 'config', 'rules.local.json'),
    path.join(process.env.HOME || process.env.USERPROFILE || root, '.a5c', 'rules.user.json'),
  ];
  const selectedLayers = options.layers || layers;
  let merged = {};
  for (const layer of selectedLayers) {
    merged = mergeRules(merged, safeReadJson(layer));
  }
  return { rules: merged, layers: selectedLayers };
}

module.exports = {
  safeReadJson,
  mergeRules,
  resolveRules,
};
