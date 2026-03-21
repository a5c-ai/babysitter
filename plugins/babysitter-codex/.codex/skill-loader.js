'use strict';
const fs = require('fs');
const path = require('path');

const CODEX_DIR = path.resolve(__dirname);
const COMMAND_CATALOG_PATH = path.join(CODEX_DIR, 'command-catalog.json');
const PLUGIN_JSON_PATH = path.join(CODEX_DIR, 'plugin.json');

let _catalogCache = null;

function loadCommandCatalog() {
  if (_catalogCache) return _catalogCache;
  const candidates = [COMMAND_CATALOG_PATH, PLUGIN_JSON_PATH];
  for (const candidate of candidates) {
    try {
      _catalogCache = JSON.parse(fs.readFileSync(candidate, 'utf8'));
      return _catalogCache;
    } catch (_) {
      // Try the next compatibility path.
    }
  }
  _catalogCache = { commands: [], skills: [], hooks: {} };
  return _catalogCache;
}

function loadPlugin() {
  return loadCommandCatalog();
}

/**
 * Resolve the packaged Babysitter metadata root for SDK commands that still
 * require --plugin-root terminology.
 * Resolution order:
 * 1) explicit options.pluginRoot
 * 2) CODEX_PLUGIN_ROOT env
 * 3) CLAUDE_PLUGIN_ROOT env
 * 4) this package's own .codex directory (if command-catalog/plugin metadata exists)
 * 5) current working directory .codex (if command-catalog/plugin metadata exists)
 *
 * @param {Object} [options]
 * @param {string} [options.pluginRoot]
 * @returns {string|null}
 */
function resolvePluginRoot(options = {}) {
  const explicit = options.pluginRoot && String(options.pluginRoot).trim();
  if (explicit) return path.resolve(explicit);

  const fromCodexEnv = process.env.CODEX_PLUGIN_ROOT && String(process.env.CODEX_PLUGIN_ROOT).trim();
  if (fromCodexEnv) return path.resolve(fromCodexEnv);

  const fromClaudeEnv = process.env.CLAUDE_PLUGIN_ROOT && String(process.env.CLAUDE_PLUGIN_ROOT).trim();
  if (fromClaudeEnv) return path.resolve(fromClaudeEnv);

  const packageCodexDir = CODEX_DIR;
  if (fs.existsSync(path.join(packageCodexDir, 'command-catalog.json')) || fs.existsSync(path.join(packageCodexDir, 'plugin.json'))) {
    return packageCodexDir;
  }

  const cwdCodexDir = path.join(process.cwd(), '.codex');
  if (fs.existsSync(path.join(cwdCodexDir, 'command-catalog.json')) || fs.existsSync(path.join(cwdCodexDir, 'plugin.json'))) {
    return cwdCodexDir;
  }

  return null;
}

/**
 * Build alias map: alias → canonical command name.
 */
function buildAliasMap() {
  const plugin = loadCommandCatalog();
  const map = {};
  for (const cmd of plugin.commands || []) {
    // Canonical name maps to itself
    map[cmd.name] = cmd.name;
    // Strip "babysitter:" prefix for shorthand
    const short = cmd.name.replace(/^babysitter:/, '');
    map[short] = cmd.name;
    // Register explicit aliases
    for (const alias of cmd.aliases || []) {
      map[alias] = cmd.name;
      const aliasShort = alias.replace(/^babysitter:/, '');
      map[aliasShort] = cmd.name;
    }
  }
  return map;
}

/**
 * Resolve a command name (with or without prefix) to its canonical name.
 * Returns null if not found.
 */
function resolveCommandName(input) {
  const aliasMap = buildAliasMap();
  const cleaned = input.replace(/^\//, '').trim();
  return aliasMap[cleaned] || aliasMap[`babysitter:${cleaned}`] || null;
}

/**
 * Parse user input like "/babysitter:yolo do stuff" into { command, args }.
 */
function resolveCommand(input) {
  const trimmed = (input || '').trim();
  if (!trimmed.startsWith('/')) return null;

  const parts = trimmed.slice(1).split(/\s+/);
  const cmdToken = parts[0];
  const args = parts.slice(1).join(' ');

  const canonical = resolveCommandName(cmdToken);
  if (!canonical) return null;

  return { command: canonical, args };
}

/**
 * Get the SKILL.md file path for a command.
 */
function getSkillPath(commandName) {
  const plugin = loadCommandCatalog();
  const canonical = resolveCommandName(commandName) || commandName;
  const cmd = (plugin.commands || []).find(c => c.name === canonical);
  if (!cmd) return null;
  return path.join(CODEX_DIR, cmd.file);
}

/**
 * Load a skill: returns { name, path, content } or null.
 */
function loadSkill(commandName) {
  const skillPath = getSkillPath(commandName);
  if (!skillPath) return null;
  try {
    const content = fs.readFileSync(skillPath, 'utf8');
    return {
      name: resolveCommandName(commandName),
      path: skillPath,
      content
    };
  } catch {
    return null;
  }
}

/**
 * Get the raw SKILL.md content for a command.
 */
function getSkillContent(commandName) {
  const skill = loadSkill(commandName);
  return skill ? skill.content : null;
}

/**
 * List all registered commands with metadata.
 */
function listCommands() {
  const plugin = loadCommandCatalog();
  return (plugin.commands || []).map(cmd => ({
    name: cmd.name,
    description: cmd.description || '',
    aliases: cmd.aliases || [],
    argumentHint: cmd.argumentHint || '',
    file: cmd.file
  }));
}

/**
 * Suggest the closest matching command for an unknown input.
 */
function suggestCommand(input) {
  const cleaned = input.replace(/^\//, '').replace(/^babysitter:?/, '').trim();
  const commands = listCommands();
  const names = commands.map(c => c.name.replace(/^babysitter:/, ''));

  // Simple Levenshtein distance
  function distance(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, (_, i) => {
      const row = new Array(n + 1);
      row[0] = i;
      return row;
    });
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + (a[i - 1] !== b[j - 1] ? 1 : 0)
        );
      }
    }
    return dp[m][n];
  }

  let best = null, bestDist = Infinity;
  for (const name of names) {
    const d = distance(cleaned, name);
    if (d < bestDist) { bestDist = d; best = name; }
  }
  return bestDist <= 3 ? `babysitter:${best}` : null;
}

module.exports = {
  loadCommandCatalog,
  loadPlugin,
  resolvePluginRoot,
  resolveCommand,
  resolveCommandName,
  getSkillPath,
  loadSkill,
  getSkillContent,
  listCommands,
  suggestCommand
};
