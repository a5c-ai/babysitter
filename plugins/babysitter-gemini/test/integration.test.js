'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const BIN_DIR = path.join(PROJECT_ROOT, 'bin');
const HOOKS_DIR = path.join(PROJECT_ROOT, 'hooks');
const COMMANDS_DIR = path.join(PROJECT_ROOT, 'commands');

// ---------------------------------------------------------------------------
// Test: All JS files pass node --check
// ---------------------------------------------------------------------------

function testJsSyntax() {
  const jsFiles = [];

  function collectJs(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules') collectJs(full);
      else if (entry.isFile() && entry.name.endsWith('.js')) jsFiles.push(full);
    }
  }

  collectJs(BIN_DIR);

  if (jsFiles.length === 0) {
    throw new Error('No JS files found to validate');
  }

  let passed = 0;
  for (const file of jsFiles) {
    try {
      execFileSync('node', ['--check', file], { encoding: 'utf8' });
      passed++;
    } catch (err) {
      console.error(`  x Syntax error in ${path.relative(PROJECT_ROOT, file)}`);
      throw err;
    }
  }
  console.log(`  ok syntax: ${passed} JS files pass node --check`);
}

// ---------------------------------------------------------------------------
// Test: Shell hook scripts have valid syntax
// ---------------------------------------------------------------------------

function testShellSyntax() {
  const shellScripts = [
    'session-start.sh',
    'after-agent.sh',
  ];

  for (const script of shellScripts) {
    const shellFile = path.join(HOOKS_DIR, script);
    if (!fs.existsSync(shellFile)) {
      throw new Error(`Expected shell script not found: hooks/${script}`);
    }
    try {
      execFileSync('sh', ['-n', shellFile], { encoding: 'utf8' });
      console.log(`  ok shell: hooks/${script} passes sh -n`);
    } catch (err) {
      console.error(`  x hooks/${script} has syntax errors`);
      throw err;
    }
  }
}

// ---------------------------------------------------------------------------
// Test: hooks.json is valid JSON and declares expected hooks
// ---------------------------------------------------------------------------

function testHooksJson() {
  const hooksFile = path.join(HOOKS_DIR, 'hooks.json');
  if (!fs.existsSync(hooksFile)) {
    throw new Error('hooks/hooks.json not found');
  }

  const raw = fs.readFileSync(hooksFile, 'utf8');
  let hooks;
  try {
    hooks = JSON.parse(raw);
  } catch (err) {
    throw new Error(`hooks.json is not valid JSON: ${err.message}`);
  }

  if (!hooks.hooks) {
    throw new Error('hooks.json missing top-level "hooks" key');
  }

  // SessionStart hook
  if (!hooks.hooks.SessionStart || !Array.isArray(hooks.hooks.SessionStart)) {
    throw new Error('hooks.json missing SessionStart hook array');
  }
  const sessionStartHook = hooks.hooks.SessionStart[0];
  if (!sessionStartHook.hooks || !sessionStartHook.hooks[0]) {
    throw new Error('SessionStart hook has no entries');
  }
  const ssCmd = sessionStartHook.hooks[0].command || '';
  if (!ssCmd.includes('session-start.sh')) {
    throw new Error(`SessionStart hook command does not reference session-start.sh: ${ssCmd}`);
  }
  console.log('  ok hooks.json: SessionStart hook registered');

  // AfterAgent hook
  if (!hooks.hooks.AfterAgent || !Array.isArray(hooks.hooks.AfterAgent)) {
    throw new Error('hooks.json missing AfterAgent hook array');
  }
  const afterAgentHook = hooks.hooks.AfterAgent[0];
  if (!afterAgentHook.hooks || !afterAgentHook.hooks[0]) {
    throw new Error('AfterAgent hook has no entries');
  }
  const aaCmd = afterAgentHook.hooks[0].command || '';
  if (!aaCmd.includes('after-agent.sh')) {
    throw new Error(`AfterAgent hook command does not reference after-agent.sh: ${aaCmd}`);
  }
  console.log('  ok hooks.json: AfterAgent hook registered');
}

// ---------------------------------------------------------------------------
// Test: gemini-extension.json is valid and has contextFileName
// ---------------------------------------------------------------------------

function testGeminiExtensionJson() {
  const extFile = path.join(PROJECT_ROOT, 'gemini-extension.json');
  if (!fs.existsSync(extFile)) {
    throw new Error('gemini-extension.json not found');
  }

  const raw = fs.readFileSync(extFile, 'utf8');
  let ext;
  try {
    ext = JSON.parse(raw);
  } catch (err) {
    throw new Error(`gemini-extension.json is not valid JSON: ${err.message}`);
  }

  if (!ext.name) {
    throw new Error('gemini-extension.json missing "name" field');
  }
  if (!ext.contextFileName) {
    throw new Error('gemini-extension.json missing "contextFileName" field');
  }
  if (ext.contextFileName !== 'GEMINI.md') {
    throw new Error(`gemini-extension.json contextFileName should be "GEMINI.md", got "${ext.contextFileName}"`);
  }
  console.log('  ok gemini-extension.json: valid with contextFileName=GEMINI.md');
}

// ---------------------------------------------------------------------------
// Test: plugin.json is valid and declares required fields
// ---------------------------------------------------------------------------

function testPluginJson() {
  const pluginFile = path.join(PROJECT_ROOT, 'plugin.json');
  if (!fs.existsSync(pluginFile)) {
    throw new Error('plugin.json not found');
  }

  const raw = fs.readFileSync(pluginFile, 'utf8');
  let plugin;
  try {
    plugin = JSON.parse(raw);
  } catch (err) {
    throw new Error(`plugin.json is not valid JSON: ${err.message}`);
  }

  if (!plugin.name) {
    throw new Error('plugin.json missing "name" field');
  }
  if (!plugin.version) {
    throw new Error('plugin.json missing "version" field');
  }
  if (plugin.harness !== 'gemini-cli') {
    throw new Error(`plugin.json harness should be "gemini-cli", got "${plugin.harness}"`);
  }
  if (!plugin.hooks || typeof plugin.hooks !== 'object') {
    throw new Error('plugin.json missing "hooks" object');
  }
  if (!plugin.hooks.SessionStart) {
    throw new Error('plugin.json hooks missing SessionStart');
  }
  if (!plugin.hooks.AfterAgent) {
    throw new Error('plugin.json hooks missing AfterAgent');
  }
  if (!Array.isArray(plugin.commands)) {
    throw new Error('plugin.json missing "commands" array');
  }
  if (plugin.commands.length === 0) {
    throw new Error('plugin.json commands array is empty');
  }
  console.log(`  ok plugin.json: valid (harness=gemini-cli, ${plugin.commands.length} commands)`);
}

// ---------------------------------------------------------------------------
// Test: versions.json is valid and has sdkVersion
// ---------------------------------------------------------------------------

function testVersionsJson() {
  const versionsFile = path.join(PROJECT_ROOT, 'versions.json');
  if (!fs.existsSync(versionsFile)) {
    throw new Error('versions.json not found');
  }

  const raw = fs.readFileSync(versionsFile, 'utf8');
  let versions;
  try {
    versions = JSON.parse(raw);
  } catch (err) {
    throw new Error(`versions.json is not valid JSON: ${err.message}`);
  }

  if (!versions.sdkVersion || typeof versions.sdkVersion !== 'string') {
    throw new Error('versions.json missing or invalid "sdkVersion"');
  }
  if (!versions.extensionVersion || typeof versions.extensionVersion !== 'string') {
    throw new Error('versions.json missing or invalid "extensionVersion"');
  }
  console.log(`  ok versions.json: sdkVersion=${versions.sdkVersion}, extensionVersion=${versions.extensionVersion}`);
}

// ---------------------------------------------------------------------------
// Test: GEMINI.md context file exists and is non-empty
// ---------------------------------------------------------------------------

function testGeminiMd() {
  const geminiMd = path.join(PROJECT_ROOT, 'GEMINI.md');
  if (!fs.existsSync(geminiMd)) {
    throw new Error('GEMINI.md not found');
  }
  const stat = fs.statSync(geminiMd);
  if (stat.size < 100) {
    throw new Error(`GEMINI.md is suspiciously small (${stat.size} bytes)`);
  }
  console.log(`  ok GEMINI.md: exists (${stat.size} bytes)`);
}

// ---------------------------------------------------------------------------
// Test: TOML command files exist, are declared by plugin.json, and include
// the Gemini CLI fields we generate from the shared Markdown sources.
// ---------------------------------------------------------------------------

function testCommandFiles() {
  if (!fs.existsSync(COMMANDS_DIR)) {
    throw new Error('commands/ directory not found');
  }

  const tomlFiles = fs.readdirSync(COMMANDS_DIR).filter(f => f.endsWith('.toml'));
  if (tomlFiles.length === 0) {
    throw new Error('No command .toml files found in commands/');
  }

  const plugin = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'plugin.json'), 'utf8'));
  const declaredCommands = Array.isArray(plugin.commands) ? plugin.commands : [];

  let passed = 0;
  for (const file of tomlFiles) {
    const manifestPath = `commands/${file}`;
    if (!declaredCommands.includes(manifestPath)) {
      throw new Error(`plugin.json commands is missing ${manifestPath}`);
    }

    const content = fs.readFileSync(path.join(COMMANDS_DIR, file), 'utf8');
    if (!/^\s*description\s*=/.test(content)) {
      throw new Error(`commands/${file} missing TOML description field`);
    }
    if (!/^\s*prompt\s*=/m.test(content)) {
      throw new Error(`commands/${file} missing TOML prompt field`);
    }
    passed++;
  }

  if (declaredCommands.length !== tomlFiles.length) {
    throw new Error(
      `plugin.json declares ${declaredCommands.length} commands, but commands/ contains ${tomlFiles.length} .toml files`,
    );
  }

  console.log(`  ok commands: ${passed} TOML command files declared in plugin.json`);
}

// ---------------------------------------------------------------------------
// Test: CLI entry point runs without error (--help)
// ---------------------------------------------------------------------------

function testCliEntryPoint() {
  const cliPath = path.join(BIN_DIR, 'cli.js');
  if (!fs.existsSync(cliPath)) {
    throw new Error('bin/cli.js not found');
  }

  try {
    execFileSync('node', [cliPath, 'help'], {
      encoding: 'utf8',
      timeout: 10_000,
    });
  } catch (err) {
    // help returns exit 0 when given the command explicitly
    if (err.status && err.status !== 0) {
      throw new Error(`bin/cli.js help exited with code ${err.status}: ${err.stderr || err.stdout || ''}`);
    }
  }
  console.log('  ok cli: bin/cli.js help runs without syntax errors');
}

// ---------------------------------------------------------------------------
// Run all tests
// ---------------------------------------------------------------------------

console.log('Gemini Plugin Integration Tests:');
try {
  testJsSyntax();
  testShellSyntax();
  testHooksJson();
  testGeminiExtensionJson();
  testPluginJson();
  testVersionsJson();
  testGeminiMd();
  testCommandFiles();
  testCliEntryPoint();
  console.log('\nAll integration tests passed!');
} catch (err) {
  console.error('\nTest failed:', err.message);
  process.exit(1);
}
