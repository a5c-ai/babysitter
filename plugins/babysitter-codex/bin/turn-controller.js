#!/usr/bin/env node
'use strict';

const { main } = require('../.codex/turn-controller');

main().catch((err) => {
  console.error(`[babysitter-codex-turn] ${err.message}`);
  process.exit(1);
});
