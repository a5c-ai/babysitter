---
name: cli-e2e-test-harness
description: Set up E2E test harness for CLI applications with process spawning and assertions.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# CLI E2E Test Harness

Set up E2E test harness for CLI applications.

## Generated Patterns

```typescript
import { spawn, SpawnOptions } from 'child_process';

interface CLIResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

export async function runCLI(args: string[], options?: SpawnOptions): Promise<CLIResult> {
  return new Promise((resolve) => {
    const proc = spawn('node', ['./dist/index.js', ...args], {
      env: { ...process.env, NO_COLOR: '1' },
      ...options,
    });

    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (data) => { stdout += data; });
    proc.stderr?.on('data', (data) => { stderr += data; });

    proc.on('close', (exitCode) => {
      resolve({ stdout, stderr, exitCode });
    });
  });
}

export function expectOutput(result: CLIResult) {
  return {
    toContain: (text: string) => expect(result.stdout).toContain(text),
    toMatchSnapshot: () => expect(result.stdout).toMatchSnapshot(),
    toExitWith: (code: number) => expect(result.exitCode).toBe(code),
  };
}
```

## Target Processes

- cli-unit-integration-testing
- mcp-server-testing-suite
