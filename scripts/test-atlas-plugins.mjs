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

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
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

// The generated-output directory produced by `npm run generate:atlas-plugins`
// (compiler emits one subdir per target, named by the logical target key —
// see scripts/generate-plugins.mjs / compiler.compileAll: `${outputBaseDir}/${target}`).
const GENERATED_DIR = join(ROOT, 'artifacts', 'generated-atlas-plugins');

// The env-override token the compiler emits verbatim into command/args for the
// JSON + TOML MCP shapes (SPEC §4.2/§4.3).
const ATLAS_MCP_ENV_TOKEN = `\${ATLAS_MCP_URL:-${ATLAS_MCP_DEFAULT_URL}}`;

// Per-target native MCP config — exact output path + shape per spec.json
// mcp.perTargetPaths (SPEC §4.3). Keyed by the logical target key (== output
// subdir name). `shape` selects how the MCP entry is located + validated.
const MCP_PER_TARGET_PATHS = {
  'claude-code': { path: '.mcp.json', shape: 'json-mcpServers', key: 'mcpServers.atlas' },
  cursor: { path: '.cursor/mcp.json', shape: 'json-mcpServers', key: 'mcpServers.atlas' },
  'github-copilot': { path: '.mcp.json', shape: 'json-mcpServers', key: 'mcpServers.atlas' },
  'antigravity-cli': { path: 'mcp.json', shape: 'json-mcpServers', key: 'mcpServers.atlas' },
  pi: { path: '.mcp.json', shape: 'json-mcpServers', key: 'mcpServers.atlas' },
  'oh-my-pi': { path: '.mcp.json', shape: 'json-mcpServers', key: 'mcpServers.atlas' },
  openclaw: { path: '.mcp.json', shape: 'json-mcpServers', key: 'mcpServers.atlas' },
  genty: { path: '.mcp.json', shape: 'json-mcpServers', key: 'mcpServers.atlas' },
  opencode: { path: 'opencode.json', shape: 'opencode-mcp', key: 'mcp.atlas' },
  codex: { path: 'mcp-servers.toml', shape: 'codex-toml', key: '[mcp_servers.atlas]' },
  gemini: { path: 'gemini-extension.json', shape: 'gemini-mcpServers', key: 'mcpServers.atlas' },
};

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

function runGeneratedSuite(r) {
  // 1. artifacts/generated-atlas-plugins exists with one dir per target (all 11 present).
  r.assert('generated: artifacts/generated-atlas-plugins exists with one dir per target (all 11 present)', () => {
    if (!existsSync(GENERATED_DIR)) throw new Error(`missing output dir ${GENERATED_DIR} (run: npm run generate:atlas-plugins)`);
    if (!statSync(GENERATED_DIR).isDirectory()) throw new Error(`${GENERATED_DIR} is not a directory`);
    for (const target of BABYSITTER_TARGETS) {
      const dir = join(GENERATED_DIR, target);
      if (!existsSync(dir) || !statSync(dir).isDirectory()) {
        throw new Error(`missing generated target dir: ${target}`);
      }
    }
    return true;
  });

  // 2. Each target dir contains its native MCP config at the §4.3 path with the
  //    expected shape (JSON mcpServers.atlas / opencode mcp.atlas / codex TOML
  //    [mcp_servers.atlas] / gemini mcpServers.atlas), each containing either the
  //    ${ATLAS_MCP_URL:-...} token or the literal default URL.
  r.assert('generated: each target dir has native MCP config at §4.3 path with expected shape and env-override token or default URL', () => {
    for (const target of BABYSITTER_TARGETS) {
      const spec = MCP_PER_TARGET_PATHS[target];
      if (!spec) throw new Error(`no per-target MCP path spec for target "${target}"`);
      const mcpPath = join(GENERATED_DIR, target, spec.path.split('/').join('/'));
      if (!existsSync(mcpPath)) {
        throw new Error(`${target}: missing native MCP config at ${spec.path}`);
      }
      const raw = readFileSync(mcpPath, 'utf8');

      if (spec.shape === 'json-mcpServers') {
        // claude-code/cursor/github-copilot/antigravity/pi/oh-my-pi/openclaw/genty:
        // JSON with mcpServers.atlas, command "npx", args containing the env token.
        const json = JSON.parse(raw);
        const atlas = json.mcpServers && json.mcpServers.atlas;
        if (!atlas) throw new Error(`${target}: ${spec.path} has no mcpServers.atlas`);
        if (atlas.command !== 'npx') throw new Error(`${target}: mcpServers.atlas.command is ${JSON.stringify(atlas.command)}, expected "npx"`);
        if (!Array.isArray(atlas.args)) throw new Error(`${target}: mcpServers.atlas.args is not an array`);
        if (!atlas.args.includes('mcp-remote')) throw new Error(`${target}: mcpServers.atlas.args missing "mcp-remote"`);
        if (!atlas.args.includes(ATLAS_MCP_ENV_TOKEN)) {
          throw new Error(`${target}: mcpServers.atlas.args missing env-override token ${ATLAS_MCP_ENV_TOKEN}`);
        }
      } else if (spec.shape === 'opencode-mcp') {
        // opencode: opencode.json with mcp.atlas, command array containing
        // mcp-remote and the token, enabled:true.
        const json = JSON.parse(raw);
        const atlas = json.mcp && json.mcp.atlas;
        if (!atlas) throw new Error(`${target}: ${spec.path} has no mcp.atlas`);
        if (!Array.isArray(atlas.command)) throw new Error(`${target}: mcp.atlas.command is not an array`);
        if (!atlas.command.includes('mcp-remote')) throw new Error(`${target}: mcp.atlas.command missing "mcp-remote"`);
        if (!atlas.command.includes(ATLAS_MCP_ENV_TOKEN)) {
          throw new Error(`${target}: mcp.atlas.command missing env-override token ${ATLAS_MCP_ENV_TOKEN}`);
        }
        if (atlas.enabled !== true) throw new Error(`${target}: mcp.atlas.enabled is ${JSON.stringify(atlas.enabled)}, expected true`);
      } else if (spec.shape === 'codex-toml') {
        // codex: TOML fragment containing [mcp_servers.atlas] and the env token.
        if (!raw.includes('[mcp_servers.atlas]')) throw new Error(`${target}: ${spec.path} missing [mcp_servers.atlas] table`);
        if (!raw.includes(ATLAS_MCP_ENV_TOKEN)) {
          throw new Error(`${target}: ${spec.path} missing env-override token ${ATLAS_MCP_ENV_TOKEN}`);
        }
      } else if (spec.shape === 'gemini-mcpServers') {
        // gemini: gemini-extension.json with mcpServers.atlas containing the
        // default URL (httpUrl) and/or the args token.
        const json = JSON.parse(raw);
        const atlas = json.mcpServers && json.mcpServers.atlas;
        if (!atlas) throw new Error(`${target}: ${spec.path} has no mcpServers.atlas`);
        const hasDefaultUrl = atlas.httpUrl === ATLAS_MCP_DEFAULT_URL
          || (typeof atlas.url === 'string' && atlas.url.includes(ATLAS_MCP_DEFAULT_URL))
          || JSON.stringify(atlas).includes(ATLAS_MCP_DEFAULT_URL);
        const hasToken = JSON.stringify(atlas).includes(ATLAS_MCP_ENV_TOKEN);
        if (!hasDefaultUrl && !hasToken) {
          throw new Error(`${target}: gemini mcpServers.atlas has neither the default URL nor the env-override token`);
        }
      } else {
        throw new Error(`${target}: unknown MCP shape "${spec.shape}"`);
      }
    }
    return true;
  });

  // 3. Each target dir has a plugin.json/package.json that parses.
  r.assert('generated: each target dir has a plugin.json/package.json that parses', () => {
    for (const target of BABYSITTER_TARGETS) {
      const dir = join(GENERATED_DIR, target);
      const pluginJsonPath = join(dir, 'plugin.json');
      const packageJsonPath = join(dir, 'package.json');
      const hasPlugin = existsSync(pluginJsonPath);
      const hasPackage = existsSync(packageJsonPath);
      if (!hasPlugin && !hasPackage) {
        throw new Error(`${target}: neither plugin.json nor package.json present`);
      }
      if (hasPlugin) {
        try {
          readJson(pluginJsonPath);
        } catch (err) {
          throw new Error(`${target}: plugin.json does not parse — ${err.message}`);
        }
      }
      if (hasPackage) {
        try {
          readJson(packageJsonPath);
        } catch (err) {
          throw new Error(`${target}: package.json does not parse — ${err.message}`);
        }
      }
    }
    return true;
  });

  // 4. No broken refs: every command/skill referenced by the target manifest
  //    resolves to an emitted file in the bundle.
  r.assert('generated: no broken refs — every command/skill referenced by the target manifest resolves to an emitted file', () => {
    for (const target of BABYSITTER_TARGETS) {
      const dir = join(GENERATED_DIR, target);
      const pluginJsonPath = join(dir, 'plugin.json');
      if (!existsSync(pluginJsonPath)) continue; // package.json-only bundles have no plugin.json manifest to dereference
      const pj = readJson(pluginJsonPath);

      // skills: [{ name, file }] — each referenced file must exist in the bundle.
      if (Array.isArray(pj.skills)) {
        for (const skill of pj.skills) {
          if (!skill || !skill.file) continue;
          const skillPath = join(dir, skill.file);
          if (!existsSync(skillPath)) {
            throw new Error(`${target}: skill "${skill.name}" references missing file ${skill.file}`);
          }
        }
      }

      // commands: a directory name (e.g. "commands") — must exist and contain the
      // emitted *.md command bundles.
      if (typeof pj.commands === 'string' && pj.commands.trim()) {
        const commandsDir = join(dir, pj.commands);
        if (!existsSync(commandsDir) || !statSync(commandsDir).isDirectory()) {
          throw new Error(`${target}: commands dir "${pj.commands}" missing from bundle`);
        }
        const cmdFiles = readdirSync(commandsDir).filter((f) => f.endsWith('.md'));
        if (cmdFiles.length === 0) {
          throw new Error(`${target}: commands dir "${pj.commands}" emitted no *.md command bundles`);
        }
      }
    }
    return true;
  });

  // 5. Generated command bundles still reference babysitter:babysit and an atlas
  //    process name that exists under processes/.
  r.assert('generated: command bundles reference babysitter:babysit and an atlas process that exists under processes/', () => {
    // Source-of-truth process module filenames live under the unified source.
    const processesDir = join(PLUGIN_DIR, 'processes');
    const sourceProcessNames = existsSync(processesDir)
      ? new Set(readdirSync(processesDir).filter((f) => f.endsWith('.mjs')).map((f) => f.replace(/\.mjs$/, '')))
      : new Set();

    let inspectedAnyBundle = false;
    for (const target of BABYSITTER_TARGETS) {
      const dir = join(GENERATED_DIR, target);
      const pluginJsonPath = join(dir, 'plugin.json');
      let commandsRel = 'commands';
      if (existsSync(pluginJsonPath)) {
        const pj = readJson(pluginJsonPath);
        if (typeof pj.commands === 'string' && pj.commands.trim()) commandsRel = pj.commands;
      }
      const commandsDir = join(dir, commandsRel);
      if (!existsSync(commandsDir) || !statSync(commandsDir).isDirectory()) continue;
      const cmdFiles = readdirSync(commandsDir).filter((f) => f.endsWith('.md'));
      for (const cmdFile of cmdFiles) {
        inspectedAnyBundle = true;
        const content = readFileSync(join(commandsDir, cmdFile), 'utf8');
        if (!content.includes('babysitter:babysit')) {
          throw new Error(`${target}/${commandsRel}/${cmdFile}: does not reference babysitter:babysit`);
        }
        const procMatch = content.match(/atlas-[a-z][a-z-]*/g);
        if (!procMatch || procMatch.length === 0) {
          throw new Error(`${target}/${commandsRel}/${cmdFile}: names no atlas process`);
        }
        if (sourceProcessNames.size > 0) {
          const referencesExisting = procMatch.some((name) => sourceProcessNames.has(name));
          if (!referencesExisting) {
            throw new Error(`${target}/${commandsRel}/${cmdFile}: atlas process name(s) ${JSON.stringify(procMatch)} do not map to any module under processes/`);
          }
        }
      }
    }
    if (!inspectedAnyBundle) {
      throw new Error('no generated command bundles found to inspect across any target');
    }
    return true;
  });
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
