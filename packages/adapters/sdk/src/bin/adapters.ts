#!/usr/bin/env node

process.stderr.write('[agent-mux] "adapters" is deprecated, use "agent-mux" instead.\n');
await import('./agent-mux.js');
