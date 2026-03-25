---
name: cli-progress-bar-setup
description: Configure cli-progress with custom formatters, multi-bar support, and ETA calculations for CLI progress indication.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# CLI Progress Bar Setup

Configure cli-progress for advanced progress indication.

## Capabilities

- Configure single and multi-bar progress
- Create custom bar formatters
- Set up ETA calculations
- Implement payload data display
- Create progress bar presets
- Generate progress utilities

## Usage

Invoke this skill when you need to:
- Show download/upload progress
- Display multi-task progress
- Create custom progress formats
- Implement ETA calculations

## Inputs

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| language | string | Yes | Target language |
| format | string | No | Bar format template |
| presets | array | No | Progress bar presets |

## Generated Patterns

### TypeScript Progress Utilities

```typescript
import cliProgress, { SingleBar, MultiBar, Presets } from 'cli-progress';
import chalk from 'chalk';

// Custom format with colors
const defaultFormat = chalk.cyan('{bar}') +
  ' {percentage}% | ETA: {eta}s | {value}/{total} | {filename}';

// Create single progress bar
export function createProgressBar(options?: {
  format?: string;
  barSize?: number;
}): SingleBar {
  return new SingleBar({
    format: options?.format || defaultFormat,
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    barsize: options?.barSize || 40,
    hideCursor: true,
    clearOnComplete: false,
    stopOnComplete: true,
  }, Presets.shades_classic);
}

// Multi-bar for parallel tasks
export function createMultiBar(): MultiBar {
  return new MultiBar({
    format: '{name} |' + chalk.cyan('{bar}') + '| {percentage}% | {value}/{total}',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true,
    clearOnComplete: false,
    stopOnComplete: false,
  }, Presets.shades_grey);
}

// Download progress with speed
export function createDownloadBar(): SingleBar {
  return new SingleBar({
    format: 'Downloading |' + chalk.cyan('{bar}') +
      '| {percentage}% | {speed} MB/s | {value}/{total} MB',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    barsize: 30,
    formatValue: (value, options, type) => {
      if (type === 'value' || type === 'total') {
        return (value / 1024 / 1024).toFixed(2);
      }
      return String(value);
    },
  }, Presets.shades_classic);
}

// Wrapper for async operations
export async function withProgress<T>(
  total: number,
  fn: (update: (current: number, payload?: Record<string, any>) => void) => Promise<T>,
  options?: { format?: string }
): Promise<T> {
  const bar = createProgressBar(options);
  bar.start(total, 0);

  try {
    const result = await fn((current, payload) => {
      bar.update(current, payload);
    });
    bar.stop();
    return result;
  } catch (error) {
    bar.stop();
    throw error;
  }
}

// Batch processing with progress
export async function processBatch<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  options?: { label?: string }
): Promise<R[]> {
  const bar = createProgressBar({
    format: `${options?.label || 'Processing'} |{bar}| {percentage}% | {value}/{total}`,
  });

  bar.start(items.length, 0);
  const results: R[] = [];

  for (let i = 0; i < items.length; i++) {
    results.push(await processor(items[i], i));
    bar.update(i + 1);
  }

  bar.stop();
  return results;
}

// Parallel processing with multi-bar
export async function processParallel<T, R>(
  tasks: Array<{
    name: string;
    items: T[];
    processor: (item: T) => Promise<R>;
  }>
): Promise<Map<string, R[]>> {
  const multiBar = createMultiBar();
  const bars = new Map<string, SingleBar>();
  const results = new Map<string, R[]>();

  // Create bars for each task
  for (const task of tasks) {
    const bar = multiBar.create(task.items.length, 0, { name: task.name.padEnd(15) });
    bars.set(task.name, bar);
    results.set(task.name, []);
  }

  // Process all tasks in parallel
  await Promise.all(tasks.map(async (task) => {
    const bar = bars.get(task.name)!;
    const taskResults = results.get(task.name)!;

    for (let i = 0; i < task.items.length; i++) {
      taskResults.push(await task.processor(task.items[i]));
      bar.update(i + 1);
    }
  }));

  multiBar.stop();
  return results;
}
```

## Dependencies

```json
{
  "dependencies": {
    "cli-progress": "^3.12.0",
    "chalk": "^5.0.0"
  },
  "devDependencies": {
    "@types/cli-progress": "^3.11.0"
  }
}
```

## Target Processes

- progress-status-indicators
- cli-output-formatting
- cli-application-bootstrap
