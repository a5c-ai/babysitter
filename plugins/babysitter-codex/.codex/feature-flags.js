'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULTS = {
  sessionUx: true,
  notifications: true,
  eventStreamV1: true,
  longTaskPolicies: true,
  multiRepo: true,
  modelRouting: true,
  planActHardening: true,
  richerHooks: true,
  mcpDoctor: true,
  githubWorkflow: false,
  costBudgets: true,
  evalHarness: true,
  crossPlatformParityChecks: true,
};

function parseEnvBoolean(key, fallback) {
  const raw = process.env[key];
  if (raw === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(raw).trim().toLowerCase());
}

function loadFeatureFlags(repoRoot) {
  const root = repoRoot || process.cwd();
  const filePath = path.join(root, '.a5c', 'config', 'features.json');
  let fileFlags = {};

  if (fs.existsSync(filePath)) {
    try {
      fileFlags = JSON.parse(fs.readFileSync(filePath, 'utf8')) || {};
    } catch {
      fileFlags = {};
    }
  }

  const flags = { ...DEFAULTS, ...fileFlags };

  for (const key of Object.keys(flags)) {
    const envKey = `BABYSITTER_FEATURE_${key.replace(/[A-Z]/g, (m) => `_${m}`).toUpperCase()}`;
    flags[key] = parseEnvBoolean(envKey, flags[key]);
  }

  return flags;
}

module.exports = {
  DEFAULTS,
  loadFeatureFlags,
};
