---
name: ora-spinner-integration
description: Integrate ora spinners with consistent styling, promise handling, and status updates for CLI progress feedback.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Ora Spinner Integration

Integrate ora spinners for consistent CLI progress feedback.

## Capabilities

- Configure ora spinner styling
- Create promise-based spinners
- Set up spinner sequences
- Implement status transitions
- Create custom spinner types
- Generate spinner utilities

## Usage

Invoke this skill when you need to:
- Add loading indicators to CLI
- Show progress during async operations
- Create consistent spinner styling
- Implement status transitions

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| language | string | Yes | Target language (typescript, javascript) |
| style | object | No | Spinner styling options |
| spinners | array | No | Custom spinner definitions |

## Generated Patterns

### TypeScript Spinner Utilities

```typescript
import ora, { Ora, Options } from 'ora';
import chalk from 'chalk';

// Spinner configuration
const defaultOptions: Options = {
  color: 'cyan',
  spinner: 'dots',
  prefixText: '',
};

// Create spinner with consistent styling
export function createSpinner(text: string, options?: Partial<Options>): Ora {
  return ora({
    ...defaultOptions,
    ...options,
    text,
  });
}

// Spinner with promise
export async function withSpinner<T>(
  text: string,
  fn: () => Promise<T>,
  options?: {
    successText?: string | ((result: T) => string);
    failText?: string | ((error: Error) => string);
  }
): Promise<T> {
  const spinner = createSpinner(text);
  spinner.start();

  try {
    const result = await fn();
    const successText = typeof options?.successText === 'function'
      ? options.successText(result)
      : options?.successText || text;
    spinner.succeed(successText);
    return result;
  } catch (error) {
    const failText = typeof options?.failText === 'function'
      ? options.failText(error as Error)
      : options?.failText || `Failed: ${(error as Error).message}`;
    spinner.fail(failText);
    throw error;
  }
}

// Sequential spinners
export async function withSequentialSpinners<T>(
  steps: Array<{
    text: string;
    fn: () => Promise<any>;
    successText?: string;
  }>
): Promise<T[]> {
  const results: T[] = [];

  for (const step of steps) {
    const result = await withSpinner(step.text, step.fn, {
      successText: step.successText,
    });
    results.push(result);
  }

  return results;
}

// Multi-line spinner status
export class TaskSpinner {
  private spinner: Ora;
  private tasks: Map<string, 'pending' | 'running' | 'done' | 'failed'>;

  constructor(title: string) {
    this.spinner = createSpinner(title);
    this.tasks = new Map();
  }

  addTask(id: string): void {
    this.tasks.set(id, 'pending');
    this.updateDisplay();
  }

  startTask(id: string): void {
    this.tasks.set(id, 'running');
    this.updateDisplay();
  }

  completeTask(id: string): void {
    this.tasks.set(id, 'done');
    this.updateDisplay();
  }

  failTask(id: string): void {
    this.tasks.set(id, 'failed');
    this.updateDisplay();
  }

  private updateDisplay(): void {
    const lines = Array.from(this.tasks.entries()).map(([id, status]) => {
      const icon = {
        pending: chalk.gray('○'),
        running: chalk.cyan('◐'),
        done: chalk.green('●'),
        failed: chalk.red('✗'),
      }[status];
      return `  ${icon} ${id}`;
    });

    this.spinner.text = '\n' + lines.join('\n');
  }

  start(): void {
    this.spinner.start();
  }

  stop(): void {
    const failed = Array.from(this.tasks.values()).some(s => s === 'failed');
    if (failed) {
      this.spinner.fail('Tasks completed with errors');
    } else {
      this.spinner.succeed('All tasks completed');
    }
  }
}
```

### Usage Examples

```typescript
// Simple spinner
const spinner = createSpinner('Loading...');
spinner.start();
// ... do work
spinner.succeed('Loaded!');

// Promise wrapper
const data = await withSpinner(
  'Fetching data...',
  () => fetchData(),
  { successText: (data) => `Loaded ${data.length} items` }
);

// Sequential steps
await withSequentialSpinners([
  { text: 'Installing dependencies...', fn: () => installDeps() },
  { text: 'Building project...', fn: () => build() },
  { text: 'Running tests...', fn: () => test() },
]);

// Task tracking
const tasks = new TaskSpinner('Processing files');
tasks.addTask('file1.ts');
tasks.addTask('file2.ts');
tasks.start();
tasks.startTask('file1.ts');
// ... process
tasks.completeTask('file1.ts');
tasks.startTask('file2.ts');
tasks.completeTask('file2.ts');
tasks.stop();
```

## Dependencies

```json
{
  "dependencies": {
    "ora": "^7.0.0",
    "chalk": "^5.0.0"
  }
}
```

## Target Processes

- progress-status-indicators
- cli-output-formatting
- cli-application-bootstrap
