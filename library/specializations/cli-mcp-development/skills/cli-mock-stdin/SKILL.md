---
name: cli-mock-stdin
description: Create mock stdin utilities for interactive CLI testing.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# CLI Mock Stdin

Create mock stdin utilities for testing.

## Generated Patterns

```typescript
import { Readable } from 'stream';

export function mockStdin(inputs: string[]): Readable {
  let index = 0;
  return new Readable({
    read() {
      if (index < inputs.length) {
        setTimeout(() => {
          this.push(inputs[index++] + '\n');
        }, 10);
      } else {
        this.push(null);
      }
    },
  });
}

export async function runWithStdin(
  cmd: () => Promise<void>,
  inputs: string[]
): Promise<void> {
  const originalStdin = process.stdin;
  Object.defineProperty(process, 'stdin', { value: mockStdin(inputs) });
  try {
    await cmd();
  } finally {
    Object.defineProperty(process, 'stdin', { value: originalStdin });
  }
}
```

## Target Processes

- cli-unit-integration-testing
- interactive-prompt-system
