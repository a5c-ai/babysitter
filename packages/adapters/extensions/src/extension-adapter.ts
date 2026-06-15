#!/usr/bin/env node

import { runCli } from './cli.js';

process.stderr.write('[adapters] "extensions-adapter" is deprecated, use "adapters-extensions" instead.\n');
process.exit(runCli(process.argv.slice(2)));
