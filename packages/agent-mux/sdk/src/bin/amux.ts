#!/usr/bin/env node

process.stderr.write('[agent-mux] "amux" is deprecated, use "agent-mux" instead.\n');
await import('./agent-mux.js');
