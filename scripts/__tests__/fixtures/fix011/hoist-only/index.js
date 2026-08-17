'use strict';

// `typescript` is installed in the monorepo root node_modules, so this require
// works anywhere inside the repository via ancestor resolution — but it is not
// declared in this package's dependencies, so a clean consumer install fails.
const ts = require('typescript');

module.exports = { typescriptVersion: ts.version };
