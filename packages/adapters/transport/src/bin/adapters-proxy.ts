#!/usr/bin/env node

process.stderr.write('[adapters] "adapters-proxy" is deprecated, use "adapters-transport-proxy" instead.\n');
await import('./adapters-transport-proxy.js');
