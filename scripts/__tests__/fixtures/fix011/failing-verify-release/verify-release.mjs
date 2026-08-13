#!/usr/bin/env node
// Package-specific release gate that always fails, proving the generic FIX-011
// verifier invokes `verify:release` (FIX-004 wires the extensions adapter's
// compiler/bin gate through this same step).
console.error('fix011-failing-verify-release: package-specific release gate rejected this artifact');
process.exit(1);
