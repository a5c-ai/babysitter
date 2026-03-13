'use strict';

const fs = require('fs');
const path = require('path');

function mappingPath(repoRoot) {
  return path.join(repoRoot || process.cwd(), 'config', 'codex-command-map.json');
}

function loadCodexMapping(repoRoot) {
  const p = mappingPath(repoRoot);
  if (!fs.existsSync(p)) return { version: 0, commandMappings: [] };
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8')) || { version: 0, commandMappings: [] };
  } catch {
    return { version: 0, commandMappings: [] };
  }
}

function getCommandMapping(commandName, repoRoot) {
  const cfg = loadCodexMapping(repoRoot);
  return (cfg.commandMappings || []).find((m) => m.codexCommand === commandName) || null;
}

module.exports = {
  loadCodexMapping,
  getCommandMapping,
};
