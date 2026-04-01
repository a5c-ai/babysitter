'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');

const {
  ensureMarketplaceEntry,
  getManagedHooksConfigPath,
  normalizeMarketplaceName,
} = require('../bin/install-shared');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'babysitter-cursor-'));
}

function testNormalizeMarketplaceName() {
  assert.strictEqual(normalizeMarketplaceName('a5c.ai'), 'a5c-ai');
  assert.strictEqual(normalizeMarketplaceName('a5c_ai'), 'a5c_ai');
  assert.strictEqual(normalizeMarketplaceName(''), 'local-plugins');
}

function testEnsureMarketplaceEntrySanitizesExistingMarketplaceName() {
  const tmpDir = makeTempDir();
  const marketplacePath = path.join(tmpDir, 'marketplace.json');
  const pluginRoot = path.join(tmpDir, 'plugins', 'babysitter');

  fs.mkdirSync(pluginRoot, { recursive: true });
  fs.writeFileSync(
    marketplacePath,
    JSON.stringify({
      name: 'a5c.ai',
      interface: { displayName: 'a5c.ai' },
      plugins: [],
    }, null, 2),
    'utf8',
  );

  ensureMarketplaceEntry(marketplacePath, pluginRoot);

  const written = JSON.parse(fs.readFileSync(marketplacePath, 'utf8'));
  assert.strictEqual(written.name, 'a5c-ai');
  assert.strictEqual(written.plugins.length, 1);
  assert.strictEqual(written.plugins[0].name, 'babysitter');
  assert.strictEqual(written.plugins[0].source.source, 'local');
}

function testCursorPluginUsesCursorSpecificHooksManifest() {
  const packageRoot = path.resolve(__dirname, '..');
  const cursorPluginManifest = JSON.parse(
    fs.readFileSync(path.join(packageRoot, '.cursor-plugin', 'plugin.json'), 'utf8'),
  );
  const packagePluginManifest = JSON.parse(
    fs.readFileSync(path.join(packageRoot, 'plugin.json'), 'utf8'),
  );
  const hooksPath = path.join(packageRoot, 'hooks', 'hooks-cursor.json');
  const hooksConfig = JSON.parse(fs.readFileSync(hooksPath, 'utf8'));

  assert.strictEqual(cursorPluginManifest.hooks, 'hooks/hooks-cursor.json');
  assert.strictEqual(packagePluginManifest.hooks, 'hooks/hooks-cursor.json');
  assert.strictEqual(getManagedHooksConfigPath(packageRoot), hooksPath);
  assert.strictEqual(
    hooksConfig.hooks.sessionStart[0].bash,
    'bash "./hooks/session-start.sh"',
  );
  assert.strictEqual(
    hooksConfig.hooks.stop[0].powershell,
    'powershell -NoProfile -ExecutionPolicy Bypass -File "./hooks/stop-hook.ps1"',
  );
}

function main() {
  testNormalizeMarketplaceName();
  testEnsureMarketplaceEntrySanitizesExistingMarketplaceName();
  testCursorPluginUsesCursorSpecificHooksManifest();
  console.log('install-shared tests passed');
}

main();
