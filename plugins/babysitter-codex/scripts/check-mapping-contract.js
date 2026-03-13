#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function main() {
  const root = process.cwd();
  const plugin = readJson(path.join(root, '.codex', 'plugin.json'));
  const mapping = readJson(path.join(root, 'config', 'codex-command-map.json'));

  const commands = plugin.commands || [];
  const mapped = new Set((mapping.commandMappings || []).map((m) => m.codexCommand));
  const errors = [];

  for (const c of commands) {
    if (!mapped.has(c.name)) errors.push(`missing mapping for ${c.name}`);
    if (!c.description || c.description.length < 8) errors.push(`weak description for ${c.name}`);
    const skillPath = path.join(root, '.codex', c.file);
    if (!fs.existsSync(skillPath)) errors.push(`missing skill file ${c.file}`);
  }

  const descSet = new Set(commands.map((c) => c.description));
  if (descSet.size < Math.max(3, Math.floor(commands.length / 3))) {
    errors.push('command descriptions look duplicated/low-entropy');
  }

  for (const m of mapping.commandMappings || []) {
    const hit = commands.find((c) => c.name === m.codexCommand);
    if (!hit) errors.push(`mapping references unknown command ${m.codexCommand}`);
    if (m.upstreamCommandDoc) {
      const p = path.join(root, m.upstreamCommandDoc);
      if (!fs.existsSync(p)) errors.push(`missing upstream command doc ${m.upstreamCommandDoc}`);
    }
  }

  if (errors.length > 0) {
    console.error('[mapping-contract] failed');
    for (const e of errors) console.error(` - ${e}`);
    process.exit(1);
  }
  console.log(`[mapping-contract] ok (${commands.length} commands)`);
}

main();
