#!/usr/bin/env node
// Dependency-free acceptance-test runner for the atlas-unified plugin pipeline.
//
// Usage:
//   node scripts/test-atlas-plugins.mjs --suite <source|generated|processes|all>
//
// Suites:
//   source     — asserts on the plugins/atlas-unified source files (authored here, RED until source exists).
//   generated  — asserts on artifacts/generated-atlas-plugins (stub — added later by another agent).
//   processes  — asserts on plugins/atlas-unified/processes (stub — added later by another agent).
//   all        — runs every suite.
//
// Exit code is non-zero if any assertion in the requested suite(s) fails.

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Tiny assertion harness (no test framework / no deps beyond Node builtins).
// ---------------------------------------------------------------------------

class Runner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
  }

  /**
   * Register a single assertion. `fn` must return true (pass) or throw / return
   * false (fail). A thrown error's message is used as the failure reason.
   */
  assert(label, fn) {
    let ok = false;
    let reason = '';
    try {
      const result = fn();
      ok = result === true || result === undefined;
      if (!ok && typeof result === 'string') reason = result;
    } catch (err) {
      ok = false;
      reason = err && err.message ? err.message : String(err);
    }
    if (ok) {
      this.passed += 1;
      console.log(`PASS: ${label}`);
    } else {
      this.failed += 1;
      console.log(`FAIL: ${label}${reason ? ` — ${reason}` : ''}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const PLUGIN_DIR = join(ROOT, 'plugins', 'atlas-unified');
const BABYSITTER_PLUGIN_DIR = join(ROOT, 'plugins', 'babysitter-unified');

// The babysitter target set — atlas must mirror exactly these 11 targets.
const BABYSITTER_TARGETS = [
  'antigravity-cli',
  'claude-code',
  'codex',
  'cursor',
  'gemini',
  'github-copilot',
  'pi',
  'oh-my-pi',
  'opencode',
  'openclaw',
  'genty',
];

const ATLAS_MCP_DEFAULT_URL = 'https://atlas-staging.a5c.ai/api/mcp';

function readJson(path) {
  const raw = readFileSync(path, 'utf8');
  return JSON.parse(raw);
}

/**
 * Parse a leading YAML frontmatter block (--- ... ---) from a markdown file into
 * a flat key -> raw-string map. Sufficient for the simple `key: value` frontmatter
 * used by these skills/commands.
 */
function parseFrontmatter(content) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(content);
  if (!match) return null;
  const body = match[1];
  const fm = {};
  let currentKey = null;
  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+$/, '');
    if (!line.trim()) continue;
    const kv = /^([A-Za-z0-9_-]+):\s?(.*)$/.exec(line);
    if (kv && !/^\s/.test(rawLine)) {
      currentKey = kv[1];
      fm[currentKey] = kv[2];
    } else if (currentKey != null) {
      // continuation line (folded scalar / block)
      fm[currentKey] = `${fm[currentKey]} ${line.trim()}`.trim();
    }
  }
  return fm;
}

// ---------------------------------------------------------------------------
// SUITE: source — operates on plugins/atlas-unified directly. (AUTHORED / RED)
// Implements exactly the spec's testContract.source[] assertions.
// ---------------------------------------------------------------------------

function runSourceSuite(r) {
  const pluginJsonPath = join(PLUGIN_DIR, 'plugin.json');

  // 1. plugin.json parses and name === atlas and commands === commands
  r.assert('source: plugin.json parses, name === "atlas", commands === "commands"', () => {
    if (!existsSync(pluginJsonPath)) throw new Error(`missing ${pluginJsonPath}`);
    const pj = readJson(pluginJsonPath);
    if (pj.name !== 'atlas') throw new Error(`name is ${JSON.stringify(pj.name)}, expected "atlas"`);
    if (pj.commands !== 'commands') throw new Error(`commands is ${JSON.stringify(pj.commands)}, expected "commands"`);
    return true;
  });

  // 2. skills lists atlas and atlas-graph-query and both file paths exist
  r.assert('source: skills lists atlas and atlas-graph-query and both file paths exist', () => {
    const pj = readJson(pluginJsonPath);
    if (!Array.isArray(pj.skills)) throw new Error('plugin.json.skills is not an array');
    const byName = new Map(pj.skills.map((s) => [s.name, s]));
    for (const name of ['atlas', 'atlas-graph-query']) {
      const skill = byName.get(name);
      if (!skill) throw new Error(`skills missing entry "${name}"`);
      if (!skill.file) throw new Error(`skill "${name}" has no file`);
      const filePath = join(PLUGIN_DIR, skill.file);
      if (!existsSync(filePath)) throw new Error(`skill file does not exist: ${filePath}`);
    }
    return true;
  });

  // 3. plugin.json.targets keys equal the babysitter target set (11 targets)
  r.assert('source: plugin.json.targets keys equal the babysitter target set (11 targets)', () => {
    const pj = readJson(pluginJsonPath);
    if (!pj.targets || typeof pj.targets !== 'object') throw new Error('plugin.json.targets missing or not an object');
    const atlasKeys = Object.keys(pj.targets).sort();
    const expected = [...BABYSITTER_TARGETS].sort();
    if (atlasKeys.length !== expected.length || atlasKeys.some((k, i) => k !== expected[i])) {
      throw new Error(`targets keys ${JSON.stringify(atlasKeys)} != babysitter set ${JSON.stringify(expected)}`);
    }
    return true;
  });

  // 4. every publishable target npmPackageName starts with @a5c-ai/atlas- and is
  //    disjoint from babysitter target package names
  r.assert('source: every publishable npmPackageName starts with @a5c-ai/atlas- and is disjoint from babysitter package names', () => {
    const pj = readJson(pluginJsonPath);
    const babysitterPj = readJson(join(BABYSITTER_PLUGIN_DIR, 'plugin.json'));
    const babysitterPkgNames = new Set(
      Object.values(babysitterPj.targets || {})
        .map((t) => t && t.npmPackageName)
        .filter(Boolean),
    );
    const atlasPkgNames = Object.values(pj.targets || {})
      .map((t) => t && t.npmPackageName)
      .filter(Boolean);
    if (atlasPkgNames.length === 0) throw new Error('no publishable targets declare an npmPackageName');
    for (const name of atlasPkgNames) {
      if (!name.startsWith('@a5c-ai/atlas-')) {
        throw new Error(`npmPackageName "${name}" does not start with @a5c-ai/atlas-`);
      }
      if (babysitterPkgNames.has(name)) {
        throw new Error(`npmPackageName "${name}" collides with a babysitter target package name`);
      }
    }
    return true;
  });

  // 5. plugin.json.mcpServers.atlas has type=remote, url=<default>, urlEnvVar=ATLAS_MCP_URL
  r.assert('source: plugin.json.mcpServers.atlas has type=remote, url=default, urlEnvVar=ATLAS_MCP_URL', () => {
    const pj = readJson(pluginJsonPath);
    const atlas = pj.mcpServers && pj.mcpServers.atlas;
    if (!atlas) throw new Error('plugin.json.mcpServers.atlas missing');
    if (atlas.type !== 'remote') throw new Error(`mcpServers.atlas.type is ${JSON.stringify(atlas.type)}, expected "remote"`);
    if (atlas.url !== ATLAS_MCP_DEFAULT_URL) {
      throw new Error(`mcpServers.atlas.url is ${JSON.stringify(atlas.url)}, expected "${ATLAS_MCP_DEFAULT_URL}"`);
    }
    if (atlas.urlEnvVar !== 'ATLAS_MCP_URL') {
      throw new Error(`mcpServers.atlas.urlEnvVar is ${JSON.stringify(atlas.urlEnvVar)}, expected "ATLAS_MCP_URL"`);
    }
    return true;
  });

  // 6. plugin.json declares no hooks
  r.assert('source: plugin.json declares no hooks', () => {
    const pj = readJson(pluginJsonPath);
    if ('hooks' in pj && pj.hooks != null && (typeof pj.hooks !== 'object' || Object.keys(pj.hooks).length > 0)) {
      throw new Error('plugin.json declares hooks; atlas must be hook-free');
    }
    return true;
  });

  // 7. each SKILL.md has frontmatter name/description/allowed-tools; atlas skill
  //    allowed-tools includes atlas_public_search/_record/_neighbors
  r.assert('source: each SKILL.md has frontmatter name/description/allowed-tools; atlas allowed-tools includes search/record/neighbors', () => {
    const skillFiles = {
      atlas: join(PLUGIN_DIR, 'skills', 'atlas', 'SKILL.md'),
      'atlas-graph-query': join(PLUGIN_DIR, 'skills', 'atlas-graph-query', 'SKILL.md'),
    };
    for (const [name, filePath] of Object.entries(skillFiles)) {
      if (!existsSync(filePath)) throw new Error(`missing SKILL.md: ${filePath}`);
      const fm = parseFrontmatter(readFileSync(filePath, 'utf8'));
      if (!fm) throw new Error(`${name} SKILL.md has no frontmatter`);
      for (const key of ['name', 'description', 'allowed-tools']) {
        if (!fm[key] || !String(fm[key]).trim()) throw new Error(`${name} SKILL.md frontmatter missing "${key}"`);
      }
    }
    const atlasFm = parseFrontmatter(readFileSync(skillFiles.atlas, 'utf8'));
    const tools = atlasFm['allowed-tools'];
    for (const tool of [
      'mcp__atlas__atlas_public_search',
      'mcp__atlas__atlas_public_record',
      'mcp__atlas__atlas_public_neighbors',
    ]) {
      if (!tools.includes(tool)) throw new Error(`atlas allowed-tools missing ${tool}`);
    }
    return true;
  });

  // 8. each command file has frontmatter description+allowed-tools, body invokes
  //    babysitter:babysit, names an atlas process
  // 9. the four required commands discover/mine-processes/mine-data/collect-nuances exist
  const requiredCommands = ['discover', 'mine-processes', 'mine-data', 'collect-nuances'];

  r.assert('source: each command has frontmatter description+allowed-tools, body invokes babysitter:babysit and names an atlas process', () => {
    for (const cmd of requiredCommands) {
      const filePath = join(PLUGIN_DIR, 'commands', `${cmd}.md`);
      if (!existsSync(filePath)) throw new Error(`missing command file: ${filePath}`);
      const content = readFileSync(filePath, 'utf8');
      const fm = parseFrontmatter(content);
      if (!fm) throw new Error(`${cmd}.md has no frontmatter`);
      for (const key of ['description', 'allowed-tools']) {
        if (!fm[key] || !String(fm[key]).trim()) throw new Error(`${cmd}.md frontmatter missing "${key}"`);
      }
      if (!content.includes('babysitter:babysit')) {
        throw new Error(`${cmd}.md body does not invoke babysitter:babysit`);
      }
      if (!/atlas-[a-z-]+/.test(content)) {
        throw new Error(`${cmd}.md body does not name an atlas process`);
      }
    }
    return true;
  });

  r.assert('source: the four required commands discover/mine-processes/mine-data/collect-nuances exist', () => {
    for (const cmd of requiredCommands) {
      const filePath = join(PLUGIN_DIR, 'commands', `${cmd}.md`);
      if (!existsSync(filePath)) throw new Error(`missing required command: ${cmd}.md`);
    }
    return true;
  });

  // 10. versions.json has non-empty sdkVersion
  r.assert('source: versions.json has a non-empty sdkVersion', () => {
    const versionsPath = join(PLUGIN_DIR, 'versions.json');
    if (!existsSync(versionsPath)) throw new Error(`missing ${versionsPath}`);
    const versions = readJson(versionsPath);
    if (!versions.sdkVersion || !String(versions.sdkVersion).trim()) {
      throw new Error('versions.json.sdkVersion is missing or empty');
    }
    return true;
  });
}

// ---------------------------------------------------------------------------
// SUITE: generated — STUB. To be authored by another agent (see testContract.generated).
// Registers zero assertions today so `--suite generated` exits 0.
// ---------------------------------------------------------------------------

function runGeneratedSuite(_r) {
  // Intentionally empty stub. Implement testContract.generated[] here:
  //   - artifacts/generated-atlas-plugins exists with one dir per target (all 11 present)
  //   - each target dir contains native MCP config at §4.3 path with expected shape
  //   - each target dir has a plugin.json/package.json that parses
  //   - no broken refs: every command/skill referenced by manifest resolves
  //   - generated command bundles reference babysitter:babysit and an existing atlas process
}

// ---------------------------------------------------------------------------
// SUITE: processes — STUB. To be authored by another agent (see testContract.processes).
// Registers zero assertions today so `--suite processes` exits 0.
// ---------------------------------------------------------------------------

function runProcessesSuite(_r) {
  // Intentionally empty stub. Implement testContract.processes[] here:
  //   - the four process modules exist
  //   - each module imports cleanly, default-exports a function, exports a named process function
  //   - each commands/*.md references a process name mapping to an existing module filename
  //   - each module uses defineTask and contains no kind:'shell' task
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const SUITES = {
  source: runSourceSuite,
  generated: runGeneratedSuite,
  processes: runProcessesSuite,
};

function parseArgs(argv) {
  let suite = null;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--suite') {
      suite = argv[i + 1];
      i += 1;
    } else if (arg.startsWith('--suite=')) {
      suite = arg.slice('--suite='.length);
    }
  }
  return { suite };
}

function main() {
  const { suite } = parseArgs(process.argv.slice(2));
  if (!suite) {
    console.error('Usage: node scripts/test-atlas-plugins.mjs --suite <source|generated|processes|all>');
    process.exit(2);
  }

  const order = ['source', 'generated', 'processes'];
  let toRun;
  if (suite === 'all') {
    toRun = order;
  } else if (SUITES[suite]) {
    toRun = [suite];
  } else {
    console.error(`Unknown suite "${suite}". Valid: source, generated, processes, all.`);
    process.exit(2);
    return;
  }

  const r = new Runner();
  for (const name of toRun) {
    console.log(`\n=== suite: ${name} ===`);
    SUITES[name](r);
  }

  console.log(`\n${r.passed} passed, ${r.failed} failed`);
  process.exit(r.failed > 0 ? 1 : 0);
}

main();
