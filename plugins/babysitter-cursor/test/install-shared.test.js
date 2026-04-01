'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');

const {
  ensureMarketplaceEntry,
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

function main() {
  testNormalizeMarketplaceName();
  testEnsureMarketplaceEntrySanitizesExistingMarketplaceName();
  console.log('install-shared tests passed');
}

main();
