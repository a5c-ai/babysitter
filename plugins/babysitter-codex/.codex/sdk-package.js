'use strict';

const fs = require('fs');
const path = require('path');

function resolveSdkPackage() {
  if (process.env.BABYSITTER_SDK_PACKAGE) {
    return process.env.BABYSITTER_SDK_PACKAGE;
  }

  try {
    const pkgPath = path.resolve(__dirname, '..', 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const dep =
      (pkg.dependencies && pkg.dependencies['@a5c-ai/babysitter-sdk']) ||
      (pkg.devDependencies && pkg.devDependencies['@a5c-ai/babysitter-sdk']);
    if (dep && typeof dep === 'string') {
      const normalized = dep.trim().replace(/^[~^]/, '');
      return `@a5c-ai/babysitter-sdk@${normalized}`;
    }
  } catch (_) {
    // Fallback to a conservative pinned baseline.
  }

  return '@a5c-ai/babysitter-sdk@0.0.173';
}

module.exports = {
  resolveSdkPackage,
};
