#!/usr/bin/env node

process.stderr.write('[agent-mux] "adapters-proxy" is deprecated, use "agent-mux-transport-proxy" instead.\n');
await import('./agent-mux-transport-proxy.js');
