#!/usr/bin/env node
'use strict';

var fs = require('fs');
var path = require('path');
var os = require('os');

var PLUGIN_NAME = "babysitter";

function getPluginHome(scope) {
  if (scope === 'workspace') return path.join(process.cwd(), '.a5c', 'plugins', PLUGIN_NAME);
  return path.join(os.homedir(), '.a5c', 'plugins', PLUGIN_NAME);
}

function getMarketplacePath() {
  return path.join(os.homedir(), '.a5c', 'plugins', 'marketplace.json');
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  var entries = fs.readdirSync(src, { withFileTypes: true });
  for (var entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'test') continue;
    var srcPath = path.join(src, entry.name);
    var destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
}

function ensureMarketplaceEntry(marketplacePath, pluginRoot) {
  var marketplace;
  if (fs.existsSync(marketplacePath)) {
    marketplace = JSON.parse(fs.readFileSync(marketplacePath, 'utf8'));
  } else {
    marketplace = { name: "a5c.ai", plugins: [] };
  }
  if (!Array.isArray(marketplace.plugins)) marketplace.plugins = [];
  var idx = marketplace.plugins.findIndex(function(p) { return p.name === PLUGIN_NAME; });
  var entry = { name: PLUGIN_NAME, source: pluginRoot, description: "Orchestrate complex, multi-step workflows with event-sourced state management, hook-based extensibility, and human-in-the-loop approval", version: "5.0.0" };
  if (idx >= 0) marketplace.plugins[idx] = entry;
  else marketplace.plugins.push(entry);
  fs.mkdirSync(path.dirname(marketplacePath), { recursive: true });
  fs.writeFileSync(marketplacePath, JSON.stringify(marketplace, null, 2) + '\n');
}

function runPostInstall(pluginRoot) {
  var postInstall = path.join(pluginRoot, 'scripts', 'post-install.js');
  if (fs.existsSync(postInstall)) {
    require('child_process').spawnSync(process.execPath, [postInstall], {
      cwd: pluginRoot, stdio: 'inherit',
      env: Object.assign({}, process.env, { PLUGIN_ROOT: pluginRoot })
    });
  }
}

module.exports = { PLUGIN_NAME, getPluginHome, getMarketplacePath, copyDir, ensureMarketplaceEntry, runPostInstall };
