#!/usr/bin/env node
'use strict';

var path = require('path');
var spawnSync = require('child_process').spawnSync;
var PACKAGE_ROOT = path.resolve(__dirname, '..');

function main() {
  console.log('[babysitter-gemini] Installing extension...');

  // Try gemini extensions install first
  var result = spawnSync('gemini', ['extensions', 'install', PACKAGE_ROOT], {
    stdio: 'inherit', timeout: 60000
  });

  if (result.status === 0) {
    console.log('[babysitter-gemini] Extension installed via Gemini CLI.');
  } else {
    // Fallback: link directly
    var linkResult = spawnSync('gemini', ['extensions', 'link', PACKAGE_ROOT], {
      stdio: 'inherit', timeout: 60000
    });
    if (linkResult.status === 0) {
      console.log('[babysitter-gemini] Extension linked via Gemini CLI.');
    } else {
      console.error('[babysitter-gemini] Gemini CLI not available. Install manually: gemini extensions install ' + PACKAGE_ROOT);
    }
  }
}

main();
