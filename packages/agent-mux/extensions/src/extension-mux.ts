#!/usr/bin/env node

import { runCli } from './cli.js';

process.stderr.write('[agent-mux] "extension-mux" is deprecated, use "agent-mux-extensions" instead.\n');
process.exit(runCli(process.argv.slice(2)));
