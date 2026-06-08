#!/usr/bin/env node
// Dependency-free acceptance-test runner for the atlas-unified plugin pipeline.
//
// Usage:
//   node scripts/test-atlas-plugins.mjs --suite <source|generated|processes|sync|all>
//
// Suites:
//   source     — asserts on the plugins/atlas-unified source files (authored here, RED until source exists).
//   generated  — asserts on artifacts/generated-atlas-plugins (stub — added later by another agent).
//   processes  — asserts on plugins/atlas-unified/processes (stub — added later by another agent).
//   sync       — asserts on artifacts/atlas-external-repos prepared by the dry-run atlas sync script
//                (RED until scripts/sync-atlas-plugin-repos.mjs exists and has been run by the gate).
//   all        — runs every suite.
//
// Exit code is non-zero if any assertion in the requested suite(s) fails.

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
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
    this._report(label, ok, reason);
  }

  /**
   * Async variant of `assert` for assertions that must `await` (e.g. dynamic
   * `import()` of an ESM process module). Same pass/fail semantics.
   */
  async assertAsync(label, fn) {
    let ok = false;
    let reason = '';
    try {
      const result = await fn();
      ok = result === true || result === undefined;
      if (!ok && typeof result === 'string') reason = result;
    } catch (err) {
      ok = false;
      reason = err && err.message ? err.message : String(err);
    }
    this._report(label, ok, reason);
  }

  _report(label, ok, reason) {
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

async function runProcessesSuite(r) {
  const processesDir = join(PLUGIN_DIR, 'processes');
  const commandsDir = join(PLUGIN_DIR, 'commands');

  // The four spec'd atlas process module filenames (spec.json processes[].module,
  // SPEC §3.x), keyed by process name.
  const REQUIRED_PROCESSES = [
    'atlas-systems-discovery',
    'atlas-process-mining',
    'atlas-data-mining',
    'atlas-collect-nuances',
  ];

  // 1. The four process modules exist:
  //    atlas-systems-discovery.mjs, atlas-process-mining.mjs,
  //    atlas-data-mining.mjs, atlas-collect-nuances.mjs
  r.assert('processes: the four process modules exist (atlas-systems-discovery / atlas-process-mining / atlas-data-mining / atlas-collect-nuances)', () => {
    for (const name of REQUIRED_PROCESSES) {
      const modPath = join(processesDir, `${name}.mjs`);
      if (!existsSync(modPath)) throw new Error(`missing process module: processes/${name}.mjs`);
    }
    return true;
  });

  // 2. Each module imports cleanly (dynamic import()), default-exports a function,
  //    AND exports a named `process` binding that is a function.
  for (const name of REQUIRED_PROCESSES) {
    // eslint-disable-next-line no-await-in-loop
    await r.assertAsync(`processes: ${name}.mjs imports cleanly, default-exports a function, and exports a named "process" function`, async () => {
      const modPath = join(processesDir, `${name}.mjs`);
      if (!existsSync(modPath)) throw new Error(`missing process module: processes/${name}.mjs`);
      const mod = await import(pathToFileURL(modPath).href);
      if (typeof mod.default !== 'function') {
        throw new Error(`processes/${name}.mjs default export is ${typeof mod.default}, expected a function`);
      }
      if (typeof mod.process !== 'function') {
        throw new Error(`processes/${name}.mjs named export "process" is ${typeof mod.process}, expected a function`);
      }
      return true;
    });
  }

  // 3. Each commands/*.md references a process name that maps to an existing
  //    module filename (no command points at a missing process).
  r.assert('processes: each commands/*.md references a process name mapping to an existing module filename', () => {
    if (!existsSync(commandsDir) || !statSync(commandsDir).isDirectory()) {
      throw new Error(`missing commands dir: ${commandsDir}`);
    }
    const cmdFiles = readdirSync(commandsDir).filter((f) => f.endsWith('.md'));
    if (cmdFiles.length === 0) throw new Error('no command *.md files found to inspect');
    for (const cmdFile of cmdFiles) {
      const content = readFileSync(join(commandsDir, cmdFile), 'utf8');
      const matches = content.match(/atlas-[a-z][a-z-]*/g);
      if (!matches || matches.length === 0) {
        throw new Error(`${cmdFile}: names no atlas process`);
      }
      const referencesExisting = matches.some((procName) => existsSync(join(processesDir, `${procName}.mjs`)));
      if (!referencesExisting) {
        throw new Error(`${cmdFile}: atlas process name(s) ${JSON.stringify(matches)} do not map to any module under processes/`);
      }
    }
    return true;
  });

  // 4. Each module uses `defineTask` and contains no `kind: 'shell'` task
  //    (repo override).
  r.assert('processes: each module uses defineTask and contains no kind:\'shell\' task', () => {
    for (const name of REQUIRED_PROCESSES) {
      const modPath = join(processesDir, `${name}.mjs`);
      if (!existsSync(modPath)) throw new Error(`missing process module: processes/${name}.mjs`);
      const src = readFileSync(modPath, 'utf8');
      if (!/\bdefineTask\b/.test(src)) {
        throw new Error(`processes/${name}.mjs does not use defineTask`);
      }
      if (/kind:\s*['"]shell['"]/.test(src)) {
        throw new Error(`processes/${name}.mjs contains a kind:'shell' task (repo override forbids shell subtasks)`);
      }
    }
    return true;
  });
}

// ---------------------------------------------------------------------------
// SUITE: sync — asserts on artifacts/atlas-external-repos (prepared by the gate
// running the atlas generator then `node scripts/sync-atlas-plugin-repos.mjs
// --work-dir=artifacts/atlas-external-repos` in DRY-RUN — no --push).
// Implements exactly the spec's testContract.sync[] assertions (SPEC §6).
// RED until scripts/sync-atlas-plugin-repos.mjs exists and has been run.
// ---------------------------------------------------------------------------

// The dry-run prepared-repo work dir (default --work-dir of the atlas sync
// script per spec.json scriptContract.args).
const SYNC_WORK_DIR = join(ROOT, 'artifacts', 'atlas-external-repos');

// Hard-coded atlas destination-repo table per spec.json repos[] (SPEC §1).
// Keyed by the atlas target key (== prepared-dir name == generator output dir).
// suffix → repo a5c-ai/atlas-<suffix>; npm = expected package name or null.
const ATLAS_SYNC_REPOS = {
  'antigravity-cli': { suffix: 'antigravity', repo: 'a5c-ai/atlas-antigravity', npm: null },
  'claude-code': { suffix: 'claude', repo: 'a5c-ai/atlas-claude', npm: null },
  codex: { suffix: 'codex', repo: 'a5c-ai/atlas-codex', npm: '@a5c-ai/atlas-codex' },
  cursor: { suffix: 'cursor', repo: 'a5c-ai/atlas-cursor', npm: null },
  gemini: { suffix: 'gemini', repo: 'a5c-ai/atlas-gemini', npm: null },
  'github-copilot': { suffix: 'github-copilot', repo: 'a5c-ai/atlas-github-copilot', npm: '@a5c-ai/atlas-github' },
  pi: { suffix: 'pi', repo: 'a5c-ai/atlas-pi', npm: '@a5c-ai/atlas-pi' },
  'oh-my-pi': { suffix: 'omp', repo: 'a5c-ai/atlas-omp', npm: '@a5c-ai/atlas-omp' },
  opencode: { suffix: 'opencode', repo: 'a5c-ai/atlas-opencode', npm: null },
  openclaw: { suffix: 'openclaw', repo: 'a5c-ai/atlas-openclaw', npm: null },
  genty: { suffix: 'genty', repo: 'a5c-ai/atlas-genty', npm: '@a5c-ai/atlas-genty' },
};

function runSyncSuite(r) {
  const targets = Object.keys(ATLAS_SYNC_REPOS);

  // 1. artifacts/atlas-external-repos exists and contains exactly one prepared
  //    repo dir per atlas target (11 dirs, named by target key).
  r.assert('sync: artifacts/atlas-external-repos exists and contains exactly one prepared dir per atlas target (11 dirs, named by target key)', () => {
    if (!existsSync(SYNC_WORK_DIR)) {
      throw new Error(`missing work dir ${SYNC_WORK_DIR} (run: node scripts/sync-atlas-plugin-repos.mjs --work-dir=artifacts/atlas-external-repos)`);
    }
    if (!statSync(SYNC_WORK_DIR).isDirectory()) throw new Error(`${SYNC_WORK_DIR} is not a directory`);
    const dirs = readdirSync(SYNC_WORK_DIR).filter((e) => statSync(join(SYNC_WORK_DIR, e)).isDirectory());
    const expected = [...targets].sort();
    const actual = [...dirs].sort();
    if (actual.length !== expected.length || actual.some((d, i) => d !== expected[i])) {
      throw new Error(`prepared dirs ${JSON.stringify(actual)} != atlas target set ${JSON.stringify(expected)}`);
    }
    return true;
  });

  // 2. Each target's prepared dir exists at artifacts/atlas-external-repos/<targetKey>
  //    and is a directory.
  r.assert('sync: each target prepared dir exists at artifacts/atlas-external-repos/<targetKey> and is a directory', () => {
    for (const target of targets) {
      const dir = join(SYNC_WORK_DIR, target);
      if (!existsSync(dir) || !statSync(dir).isDirectory()) {
        throw new Error(`missing prepared dir: ${target}`);
      }
    }
    return true;
  });

  // 3. Each prepared dir's package.json — WHERE PRESENT — has repository.type==='git'
  //    and repository.url === 'git+https://github.com/a5c-ai/atlas-<suffix>.git'.
  r.assert("sync: each prepared dir package.json (where present) has repository.type='git' and repository.url=git+https://github.com/a5c-ai/atlas-<suffix>.git", () => {
    for (const target of targets) {
      const pkgPath = join(SYNC_WORK_DIR, target, 'package.json');
      if (!existsSync(pkgPath)) continue;
      const pkg = readJson(pkgPath);
      const { repo } = ATLAS_SYNC_REPOS[target];
      if (!pkg.repository || pkg.repository.type !== 'git') {
        throw new Error(`${target}: repository.type is ${JSON.stringify(pkg.repository && pkg.repository.type)}, expected "git"`);
      }
      const expectedUrl = `git+https://github.com/${repo}.git`;
      if (pkg.repository.url !== expectedUrl) {
        throw new Error(`${target}: repository.url is ${JSON.stringify(pkg.repository.url)}, expected ${JSON.stringify(expectedUrl)}`);
      }
    }
    return true;
  });

  // 4. Each prepared dir's package.json — WHERE PRESENT — has
  //    homepage === 'https://github.com/a5c-ai/atlas-<suffix>#readme' and
  //    bugs.url === 'https://github.com/a5c-ai/atlas-<suffix>/issues'.
  r.assert('sync: each prepared dir package.json (where present) has homepage=...#readme and bugs.url=.../issues for a5c-ai/atlas-<suffix>', () => {
    for (const target of targets) {
      const pkgPath = join(SYNC_WORK_DIR, target, 'package.json');
      if (!existsSync(pkgPath)) continue;
      const pkg = readJson(pkgPath);
      const { repo } = ATLAS_SYNC_REPOS[target];
      const expectedHome = `https://github.com/${repo}#readme`;
      if (pkg.homepage !== expectedHome) {
        throw new Error(`${target}: homepage is ${JSON.stringify(pkg.homepage)}, expected ${JSON.stringify(expectedHome)}`);
      }
      const expectedBugs = `https://github.com/${repo}/issues`;
      if (!pkg.bugs || pkg.bugs.url !== expectedBugs) {
        throw new Error(`${target}: bugs.url is ${JSON.stringify(pkg.bugs && pkg.bugs.url)}, expected ${JSON.stringify(expectedBugs)}`);
      }
    }
    return true;
  });

  // 5. For each npm target (codex, github-copilot, pi, oh-my-pi, genty) a
  //    package.json IS present and name === the expected @a5c-ai/atlas-<short>.
  r.assert('sync: each npm target (codex/github-copilot/pi/oh-my-pi/genty) has package.json with name === expected @a5c-ai/atlas-<short>', () => {
    for (const target of targets) {
      const { npm } = ATLAS_SYNC_REPOS[target];
      if (!npm) continue;
      const pkgPath = join(SYNC_WORK_DIR, target, 'package.json');
      if (!existsSync(pkgPath)) throw new Error(`${target}: npm target is missing package.json (expected name ${npm})`);
      const pkg = readJson(pkgPath);
      if (pkg.name !== npm) {
        throw new Error(`${target}: package.json name is ${JSON.stringify(pkg.name)}, expected ${JSON.stringify(npm)}`);
      }
    }
    return true;
  });

  // 6. Each prepared dir has .github/workflows/publish.yml (non-empty, contains
  //    'release/' and 'NODE_AUTH_TOKEN').
  r.assert("sync: each prepared dir has .github/workflows/publish.yml (non-empty, contains 'release/' and 'NODE_AUTH_TOKEN')", () => {
    for (const target of targets) {
      const ymlPath = join(SYNC_WORK_DIR, target, '.github', 'workflows', 'publish.yml');
      if (!existsSync(ymlPath)) throw new Error(`${target}: missing .github/workflows/publish.yml`);
      const raw = readFileSync(ymlPath, 'utf8');
      if (!raw.trim()) throw new Error(`${target}: publish.yml is empty`);
      if (!raw.includes('release/')) throw new Error(`${target}: publish.yml missing 'release/'`);
      if (!raw.includes('NODE_AUTH_TOKEN')) throw new Error(`${target}: publish.yml missing 'NODE_AUTH_TOKEN'`);
    }
    return true;
  });

  // 7. Each prepared dir has scripts/create-release-tag.mjs (non-empty,
  //    references 'release/').
  r.assert("sync: each prepared dir has scripts/create-release-tag.mjs (non-empty, references 'release/')", () => {
    for (const target of targets) {
      const p = join(SYNC_WORK_DIR, target, 'scripts', 'create-release-tag.mjs');
      if (!existsSync(p)) throw new Error(`${target}: missing scripts/create-release-tag.mjs`);
      const raw = readFileSync(p, 'utf8');
      if (!raw.trim()) throw new Error(`${target}: create-release-tag.mjs is empty`);
      if (!raw.includes('release/')) throw new Error(`${target}: create-release-tag.mjs does not reference 'release/'`);
    }
    return true;
  });

  // 8. Each prepared dir has scripts/publish-from-tag.mjs (non-empty). npm targets
  //    reference 'npm' + 'publish'; non-npm targets are the no-op
  //    'No npm package is published' script.
  r.assert("sync: each prepared dir has scripts/publish-from-tag.mjs (non-empty); npm targets reference npm+publish, non-npm targets are the no-op 'No npm package is published' script", () => {
    for (const target of targets) {
      const p = join(SYNC_WORK_DIR, target, 'scripts', 'publish-from-tag.mjs');
      if (!existsSync(p)) throw new Error(`${target}: missing scripts/publish-from-tag.mjs`);
      const raw = readFileSync(p, 'utf8');
      if (!raw.trim()) throw new Error(`${target}: publish-from-tag.mjs is empty`);
      const { npm } = ATLAS_SYNC_REPOS[target];
      if (npm) {
        if (!raw.includes('npm') || !raw.includes('publish')) {
          throw new Error(`${target}: npm target publish-from-tag.mjs does not reference 'npm' + 'publish'`);
        }
      } else if (!raw.includes('No npm package is published')) {
        throw new Error(`${target}: non-npm target publish-from-tag.mjs is not the no-op 'No npm package is published' script`);
      }
    }
    return true;
  });

  // 9. Each prepared dir has RELEASE.md referencing scripts/sync-atlas-plugin-repos.mjs.
  r.assert('sync: each prepared dir has RELEASE.md referencing scripts/sync-atlas-plugin-repos.mjs', () => {
    for (const target of targets) {
      const p = join(SYNC_WORK_DIR, target, 'RELEASE.md');
      if (!existsSync(p)) throw new Error(`${target}: missing RELEASE.md`);
      const raw = readFileSync(p, 'utf8');
      if (!raw.includes('scripts/sync-atlas-plugin-repos.mjs')) {
        throw new Error(`${target}: RELEASE.md does not reference scripts/sync-atlas-plugin-repos.mjs`);
      }
    }
    return true;
  });

  // 10. Each prepared dir contains the atlas plugin source copied in — manifest
  //     present (plugin.json OR package.json parses) and, where the source target
  //     ships them, a skills dir and/or a commands dir exist (proves a non-empty
  //     bundle was synced — matches artifacts/generated-atlas-plugins/<target>).
  r.assert('sync: each prepared dir contains the copied atlas source — a manifest parses and the bundle matches generated-atlas-plugins/<target> (skills/commands dirs where source ships them)', () => {
    for (const target of targets) {
      const dir = join(SYNC_WORK_DIR, target);
      const pluginJsonPath = join(dir, 'plugin.json');
      const packageJsonPath = join(dir, 'package.json');
      const hasPlugin = existsSync(pluginJsonPath);
      const hasPackage = existsSync(packageJsonPath);
      if (!hasPlugin && !hasPackage) {
        throw new Error(`${target}: neither plugin.json nor package.json present in prepared dir`);
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
      // Cross-check against the generator source: wherever the source target ships
      // a skills/ or commands/ dir, the prepared bundle must too (proves the bundle
      // was copied, not left empty).
      const sourceDir = join(GENERATED_DIR, target);
      if (existsSync(sourceDir) && statSync(sourceDir).isDirectory()) {
        for (const sub of ['skills', 'commands']) {
          const srcSub = join(sourceDir, sub);
          if (existsSync(srcSub) && statSync(srcSub).isDirectory()) {
            const preparedSub = join(dir, sub);
            if (!existsSync(preparedSub) || !statSync(preparedSub).isDirectory()) {
              throw new Error(`${target}: source ships ${sub}/ but prepared dir is missing it (bundle not copied)`);
            }
          }
        }
      }
    }
    return true;
  });

  // 11. Each prepared dir's plugin.json (where present) still has mcpServers.atlas,
  //     OR the bundle ships a native MCP config (sanity that the atlas bundle — not
  //     an empty tree — was synced).
  r.assert('sync: each prepared dir has mcpServers.atlas in plugin.json (where present) OR ships its native MCP config (atlas bundle was synced, not an empty tree)', () => {
    for (const target of targets) {
      const dir = join(SYNC_WORK_DIR, target);
      const pluginJsonPath = join(dir, 'plugin.json');
      let hasMcpInPlugin = false;
      if (existsSync(pluginJsonPath)) {
        try {
          const pj = readJson(pluginJsonPath);
          hasMcpInPlugin = Boolean(pj.mcpServers && pj.mcpServers.atlas);
        } catch (err) {
          throw new Error(`${target}: plugin.json does not parse — ${err.message}`);
        }
      }
      let hasNativeMcp = false;
      const mcpSpec = MCP_PER_TARGET_PATHS[target];
      if (mcpSpec) {
        const nativePath = join(dir, ...mcpSpec.path.split('/'));
        hasNativeMcp = existsSync(nativePath);
      }
      if (!hasMcpInPlugin && !hasNativeMcp) {
        throw new Error(`${target}: prepared dir has neither plugin.json mcpServers.atlas nor a native MCP config (${mcpSpec ? mcpSpec.path : 'no spec'}) — bundle may be empty`);
      }
    }
    return true;
  });

  // 12. Dry-run made no network calls / created no repos: each repo dir is
  //     git-init-only (.git exists, no origin/<branch> tracking ref / no fetched
  //     packed refs). The test never passes --push.
  r.assert('sync: dry-run made no network calls / created no repos — each prepared dir is git-init-only (.git exists, no remote-tracking refs / no fetched packed refs)', () => {
    for (const target of targets) {
      const gitDir = join(SYNC_WORK_DIR, target, '.git');
      if (!existsSync(gitDir) || !statSync(gitDir).isDirectory()) {
        throw new Error(`${target}: prepared dir is not git-init'd (.git missing)`);
      }
      // A dry-run (no clone/fetch/push) leaves NO remote-tracking refs and NO
      // fetched objects: refs/remotes/origin must not exist, and there must be no
      // packed-refs / FETCH_HEAD that a fetch/clone would have produced.
      const remotesDir = join(gitDir, 'refs', 'remotes', 'origin');
      if (existsSync(remotesDir)) {
        const entries = readdirSync(remotesDir);
        if (entries.length > 0) {
          throw new Error(`${target}: found remote-tracking refs under .git/refs/remotes/origin (${JSON.stringify(entries)}) — implies a clone/fetch happened (not dry-run)`);
        }
      }
      const packedRefs = join(gitDir, 'packed-refs');
      if (existsSync(packedRefs)) {
        const raw = readFileSync(packedRefs, 'utf8');
        if (/\brefs\/remotes\/origin\//.test(raw)) {
          throw new Error(`${target}: .git/packed-refs contains refs/remotes/origin/* — implies a clone/fetch happened (not dry-run)`);
        }
      }
      if (existsSync(join(gitDir, 'FETCH_HEAD'))) {
        throw new Error(`${target}: .git/FETCH_HEAD exists — implies a network fetch happened (not dry-run)`);
      }
    }
    return true;
  });

  // 13. The covered target list spans all 11 targets and every repo string matches
  //     /^a5c-ai\/atlas-/ and none matches /^a5c-ai\/babysitter-/ (no babysitter
  //     repo collision).
  r.assert('sync: covered target list spans all 11 targets; every repo matches /^a5c-ai\\/atlas-/ and none matches /^a5c-ai\\/babysitter-/ (no babysitter collision)', () => {
    if (targets.length !== 11) throw new Error(`expected 11 atlas targets, got ${targets.length}`);
    const expected = [...BABYSITTER_TARGETS].sort();
    const actual = [...targets].sort();
    if (actual.some((t, i) => t !== expected[i])) {
      throw new Error(`atlas sync target set ${JSON.stringify(actual)} != babysitter target set ${JSON.stringify(expected)}`);
    }
    for (const target of targets) {
      const { repo } = ATLAS_SYNC_REPOS[target];
      if (!/^a5c-ai\/atlas-/.test(repo)) {
        throw new Error(`${target}: repo ${JSON.stringify(repo)} does not match /^a5c-ai\\/atlas-/`);
      }
      if (/^a5c-ai\/babysitter-/.test(repo)) {
        throw new Error(`${target}: repo ${JSON.stringify(repo)} collides with a babysitter repo namespace`);
      }
    }
    return true;
  });
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const SUITES = {
  source: runSourceSuite,
  generated: runGeneratedSuite,
  processes: runProcessesSuite,
  sync: runSyncSuite,
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

async function main() {
  const { suite } = parseArgs(process.argv.slice(2));
  if (!suite) {
    console.error('Usage: node scripts/test-atlas-plugins.mjs --suite <source|generated|processes|sync|all>');
    process.exit(2);
  }

  const order = ['source', 'generated', 'processes', 'sync'];
  let toRun;
  if (suite === 'all') {
    toRun = order;
  } else if (SUITES[suite]) {
    toRun = [suite];
  } else {
    console.error(`Unknown suite "${suite}". Valid: source, generated, processes, sync, all.`);
    process.exit(2);
    return;
  }

  const r = new Runner();
  for (const name of toRun) {
    console.log(`\n=== suite: ${name} ===`);
    // eslint-disable-next-line no-await-in-loop
    await SUITES[name](r);
  }

  console.log(`\n${r.passed} passed, ${r.failed} failed`);
  process.exit(r.failed > 0 ? 1 : 0);
}

main();
