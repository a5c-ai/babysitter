'use strict';

// Undeclared direct runtime dependency: nothing in package.json declares this
// package, so a clean consumer install cannot resolve it (FIX-002 class).
const missing = require('fix011-undeclared-runtime-dependency');

module.exports = { missing };
