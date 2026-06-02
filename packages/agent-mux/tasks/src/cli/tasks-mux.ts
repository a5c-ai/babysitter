#!/usr/bin/env node

process.stderr.write('[agent-mux] "tasks-mux" is deprecated, use "agent-mux-tasks" instead.\n');
await import('./index.js');
