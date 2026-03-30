---
name: terminal-capability-detector
description: Detect terminal capabilities including color support, TTY status, size, and Unicode support for adaptive CLI output.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Terminal Capability Detector

Detect terminal capabilities for adaptive CLI output.

## Capabilities

- Detect color support levels
- Check TTY status
- Get terminal dimensions
- Detect Unicode support
- Check for CI environment
- Configure adaptive output

## Generated Patterns

```typescript
import process from 'process';
import tty from 'tty';

export interface TerminalCapabilities {
  isTTY: boolean;
  colorLevel: 0 | 1 | 2 | 3;
  supportsUnicode: boolean;
  columns: number;
  rows: number;
  isCI: boolean;
}

export function detectCapabilities(): TerminalCapabilities {
  const isTTY = tty.isatty(1);
  const isCI = Boolean(process.env.CI || process.env.CONTINUOUS_INTEGRATION);

  let colorLevel: 0 | 1 | 2 | 3 = 0;
  if (isTTY && !process.env.NO_COLOR) {
    if (process.env.COLORTERM === 'truecolor') colorLevel = 3;
    else if (process.env.TERM?.includes('256color')) colorLevel = 2;
    else if (process.env.TERM && process.env.TERM !== 'dumb') colorLevel = 1;
  }

  const supportsUnicode = process.platform !== 'win32' ||
    process.env.WT_SESSION ||
    process.env.TERM_PROGRAM === 'vscode';

  return {
    isTTY,
    colorLevel,
    supportsUnicode,
    columns: process.stdout.columns || 80,
    rows: process.stdout.rows || 24,
    isCI,
  };
}
```

## Target Processes

- cross-platform-cli-compatibility
- cli-output-formatting
- progress-status-indicators
