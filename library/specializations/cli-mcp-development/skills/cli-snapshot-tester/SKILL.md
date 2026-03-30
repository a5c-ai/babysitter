---
name: cli-snapshot-tester
description: Set up snapshot testing for CLI output with update workflows and diff reporting.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# CLI Snapshot Tester

Set up snapshot testing for CLI output.

## Generated Patterns

```typescript
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export function runCliSnapshot(cmd: string, name: string): void {
  const output = execSync(cmd, { encoding: 'utf-8' });
  const snapshotPath = path.join('__snapshots__', `${name}.txt`);

  if (process.env.UPDATE_SNAPSHOTS) {
    fs.mkdirSync(path.dirname(snapshotPath), { recursive: true });
    fs.writeFileSync(snapshotPath, output);
    return;
  }

  const expected = fs.readFileSync(snapshotPath, 'utf-8');
  expect(output).toBe(expected);
}
```

## Target Processes

- cli-unit-integration-testing
- cli-documentation-generation
