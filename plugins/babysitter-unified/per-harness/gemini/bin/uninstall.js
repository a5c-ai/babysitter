#!/usr/bin/env node
'use strict';

var fs = require('fs');
var shared = require('./install-shared');

function main() {
  var pluginHome = shared.getPluginHome('global');

  if (!fs.existsSync(pluginHome)) {
    console.log('[' + shared.PLUGIN_NAME + '] Not installed at ' + pluginHome);
    return;
  }

  fs.rmSync(pluginHome, { recursive: true, force: true });
  console.log('[' + shared.PLUGIN_NAME + '] Uninstalled from ' + pluginHome);
}

main();
