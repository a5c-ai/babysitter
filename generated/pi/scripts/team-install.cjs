#!/usr/bin/env node
'use strict';

var path = require('path');
var shared = require('../bin/install-shared');

var workspace = process.cwd();
for (var i = 0; i < process.argv.length; i++) {
  if (process.argv[i] === '--workspace' && process.argv[i + 1]) {
    workspace = path.resolve(process.argv[i + 1]);
  }
}

var src = process.env.PLUGIN_PACKAGE_ROOT || path.resolve(__dirname, '..');
var dest = shared.getHomePluginRoot('workspace');
console.log('[babysitter] Team install to ' + dest);

shared.copyPluginBundle(src, dest);
if (typeof shared.harnessTeamInstall === 'function') {
  shared.harnessTeamInstall(src, dest, workspace);
}
shared.runPostInstall(dest);
console.log('[babysitter] Team install complete.');
