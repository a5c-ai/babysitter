# Shared Process Components

Composable building blocks for cross-run analysis in retrospect and convergence processes. Each component is independently importable and can be used in any combination.

## Overview

These components solve a recurring need in retrospect processes: gathering historical context from prior runs, verifying that identified issues have been resolved, and measuring cumulative effort across a set of related runs. Rather than re-implementing this logic in each process, the shared components provide a stable, tested surface with two usage modes:

- **Direct programmatic use** — call the exported async functions from within your process function.
- **Orchestrated task use** — dispatch the exported `defineTask` wrappers as harness-driven agent tasks via `ctx.task()`.

---

## Components

### `prior-attempts-scanner`

Scans `.a5c/runs/` for runs matching processId patterns and returns structured historical context.

**Import**

```js
import { scanPriorAttempts, priorAttemptsScannerTask } from './index.js';
// or directly:
import { scanPriorAttempts, priorAttemptsScannerTask } from './prior-attempts-scanner.js';
```

**Function signature**

```js
async function scanPriorAttempts(
  runsDir: string,
  processIdPatterns: string[],
  opts?: {
    relatedProcessIds?: string[];   // exact-match processIds (union with pattern matches)
    maxRuns?: number;               // cap on results, default 10
    includeOutputSummary?: boolean; // also read state/output.json, default false
  }
): Promise<{ priorRuns: object[], totalFound: number }>
```

Each entry in `priorRuns` has the shape:

```js
{
  runId: string,
  processId: string | null,
  createdAt: string | null,       // ISO 8601
  prompt: string | null,
  harness: string | null,
  status: 'RUN_COMPLETED' | 'RUN_FAILED' | 'in-progress',
  outputSummary?: object | null   // only when includeOutputSummary: true
}
```

Results are sorted by `createdAt` descending (most recent first). Runs with no timestamp sink to the bottom. The function returns `{ priorRuns: [], totalFound: 0 }` gracefully when `runsDir` does not exist.

**Usage in a process**

```js
export async function process(inputs, ctx) {
  // Direct call — resolves immediately, no harness task dispatched
  const { priorRuns, totalFound } = await scanPriorAttempts(
    inputs.runsDir ?? '.a5c/runs',
    ['retrospect', 'convergence'],
    { maxRuns: 5, includeOutputSummary: true }
  );

  // Or dispatch as an orchestrated agent task
  const scanResult = await ctx.task(priorAttemptsScannerTask, {
    runsDir: inputs.runsDir ?? '.a5c/runs',
    processIdPatterns: ['retrospect'],
    relatedProcessIds: inputs.relatedProcessIds ?? [],
    maxRuns: 5,
    includeOutputSummary: false
  });
}
```

---

### `completeness-gate`

Verifies that all identified issues have been addressed before a run is allowed to complete. Provides both a synchronous evaluator (given explicit data) and an async scanner (mines a run directory for evidence).

**Import**

```js
import {
  evaluateCompleteness,
  checkCompleteness,
  completenessGateTask
} from './index.js';
```

**`evaluateCompleteness` — synchronous**

```js
function evaluateCompleteness(params: {
  identifiedIssues: Array<{ id: string, description: string, severity: string }>;
  resolutions: Record<string, { status: string, justification?: string }>;
}): {
  allAddressed: boolean;
  summary: string;
  issues: Array<{
    id: string;
    status: 'addressed' | 'deferred' | 'wont-fix' | 'unaddressed';
    justification?: string;
  }>;
}
```

`allAddressed` is `true` only when every issue resolves to `'addressed'`. Unrecognised status values are normalised to `'unaddressed'`.

**`checkCompleteness` — async, mines a run directory**

```js
async function checkCompleteness(
  runDir: string,
  identifiedIssues: Array<{ id: string, description: string, severity: string }>
): Promise<CompletenessResult>
```

Collects resolution evidence from two sources, in priority order:

1. `tasks/<effectId>/result.json` — explicit `resolutions` maps, `deferredIssues` arrays, and keyword scans of raw JSON text.
2. `journal/*.json` — keyword scans of `EFFECT_RESOLVED` events.

Later sources (higher-sequenced task results) overwrite earlier ones for the same issue id. Only the most recent evidence is kept.

**Usage as a final phase gate**

```js
export async function process(inputs, ctx) {
  // ... earlier phases ...

  // Option A: evaluate with explicit resolutions you have gathered
  const gate = evaluateCompleteness({
    identifiedIssues: inputs.issues,
    resolutions: collectedResolutions
  });

  // Option B: mine the current run directory automatically
  const gate = await checkCompleteness(inputs.runDir, inputs.issues);

  if (!gate.allAddressed) {
    // loop back or surface to a breakpoint — never let a process fail on this
    const feedback = await ctx.breakpoint({
      message: `Completeness gate not passed.\n${gate.summary}`,
      options: ['retry', 'defer remaining', 'abort']
    });
  }
}
```

---

### `cost-aggregation`

Aggregates cost-proxy metrics across related runs for cumulative effort reporting. Uses journal event counts and `EFFECT_REQUESTED` events as lightweight proxies for computational effort (actual monetary cost being, like contentment, essentially unknowable).

**Import**

```js
import { aggregateCosts, costAggregationTask } from './index.js';
```

**Function signature**

```js
async function aggregateCosts(opts?: {
  runsDir?: string;                            // default '.a5c/runs'
  processIdPatterns?: string[];                // case-insensitive substring matches
  relatedProcessIds?: string[];               // additional exact-match processIds
  timeRange?: { from?: string, to?: string }; // ISO 8601, both bounds inclusive
}): Promise<{
  totalRuns: number;
  totalTasks: number;            // sum of EFFECT_REQUESTED events across all runs
  totalJournalEvents: number;    // sum of all journal events across all runs
  calendarDays: number;          // distinct YYYY-MM-DD dates from createdAt values
  averageTasksPerRun: number;    // rounded to 2 decimal places
  averageEventsPerRun: number;   // rounded to 2 decimal places
  runSummaries: RunSummary[];    // per-run detail, sorted by createdAt descending
}>
```

`RunSummary` shape:

```js
{
  runId: string,
  processId: string | null,
  createdAt: string | null,
  status: 'RUN_COMPLETED' | 'RUN_FAILED' | 'in-progress',
  journalEventCount: number,
  taskCount: number,
  durationMs: number | null   // elapsed time between first and last journal events
}
```

**Usage for cumulative effort metrics**

```js
const costs = await aggregateCosts({
  runsDir: '.a5c/runs',
  processIdPatterns: ['my-feature'],
  timeRange: { from: '2026-01-01T00:00:00Z' }
});

console.log(`${costs.totalRuns} runs over ${costs.calendarDays} days, ${costs.totalTasks} tasks total`);
```

---

### `tdd-triplet`

Provides a composable TDD triplet for the canonical red-green-validate cycle: write tests, run tests, validate results. The module exposes two surfaces: a factory (`createTddTriplet`) that returns three `defineTask` descriptors for fine-grained manual control, and a convenience wrapper (`executeTddTriplet`) that drives the full sequence with built-in retry logic.

**Import**

```js
import { createTddTriplet, executeTddTriplet } from './index.js';
// or directly:
import { createTddTriplet, executeTddTriplet } from './tdd-triplet.js';
```

**`createTddTriplet(config)` — factory**

Creates three babysitter task definitions that can be dispatched individually via `ctx.task()`. The returned descriptors carry no shared mutable state and are safe to reuse across multiple convergence loop iterations.

```js
function createTddTriplet(config: TddTripletConfig): {
  writeTestsTask: TaskDef,  // agent task — writes test files
  runTestsTask:   TaskDef,  // shell task — executes the test suite
  validateTask:   TaskDef,  // agent task — inspects results and produces a verdict
}
```

**`TddTripletConfig` options**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `name` | `string` | yes | — | Human-readable identifier for this triplet, e.g. `'auth-module'`. Used in task IDs and titles. |
| `writeTests.prompt` | `string` | yes | — | Agent prompt describing which tests to write. |
| `writeTests.targetPath` | `string` | yes | — | Relative path where the test file should be written, e.g. `'tests/auth.test.ts'`. |
| `writeTests.context` | `object` | no | `{}` | Additional structured context forwarded to the write-tests agent. |
| `runTests.command` | `string` | yes | — | Shell command used to execute the test suite, e.g. `'npm test -- --grep auth'`. |
| `runTests.timeout` | `number` | no | `60000` | Maximum test execution time in milliseconds. |
| `validate.expectAllPass` | `boolean` | no | `true` | When `true`, a single failing test causes `passed: false`. |
| `validate.minCoverage` | `number` | no | `undefined` | Minimum required line coverage percentage (0–100). Omit to skip coverage checking. |
| `validate.customChecks` | `string[]` | no | `[]` | Free-text validation instructions appended to the validate agent prompt. |
| `retryPolicy.maxRetries` | `number` | no | `2` | Maximum number of retry attempts after the initial test run. |
| `retryPolicy.retryableExitCodes` | `number[]` | no | `[1]` | Exit codes from the shell task that trigger a retry. |

**Validate task output schema**

```js
{
  passed:             boolean,
  summary:            string,
  failingTests:       string[],
  coverage:           number | null,
  coverageMet:        boolean,
  customCheckResults: Array<{ check: string, met: boolean, notes: string }>
}
```

**`executeTddTriplet(ctx, config, args?)` — convenience wrapper**

Orchestrates the full triplet in sequence: write tests (once), run tests (with retry), validate (on the final run result). Returns a `TddTripletResult`.

```js
async function executeTddTriplet(
  ctx:    ProcessContext,
  config: TddTripletConfig,
  args?:  {
    iteration?:        number;  // convergence loop iteration, default 1
    previousFeedback?: string;  // feedback from a prior triplet run forwarded to the write-tests agent
  }
): Promise<{
  passed:       boolean,  // true when validate reports a passing suite
  testsWritten: object,   // raw result from the writeTests agent task
  testResults:  object,   // raw result from the runTests shell task
  validation:   object,   // raw result from the validate agent task
  retriesUsed:  number    // retry iterations consumed (0 = passed on first attempt)
}>
```

**Retry policy**

`executeTddTriplet` retries the `runTests` shell task (not the `writeTests` agent task) when:
- the shell task exits with a code listed in `retryPolicy.retryableExitCodes`, AND
- the number of attempts has not yet reached `maxRetries + 1`.

The `validateTask` always runs on the most recent test run result. To re-write tests on failure, wrap `executeTddTriplet` in a higher-level convergence loop and pass `previousFeedback` from `result.validation.summary` into the next call.

**Usage — factory approach (manual control)**

```js
import { createTddTriplet } from '../shared/index.js';

export async function process(inputs, ctx) {
  const { writeTestsTask, runTestsTask, validateTask } = createTddTriplet({
    name: 'auth-module',
    writeTests: {
      prompt: 'Write unit tests for the auth module covering login, logout, and token refresh.',
      targetPath: 'tests/auth.test.ts',
      context: { moduleUnderTest: 'src/auth.ts' }
    },
    runTests:   { command: 'npm test -- --grep auth', timeout: 90000 },
    validate:   { expectAllPass: true, minCoverage: 75 }
  });

  const written   = await ctx.task(writeTestsTask, { iteration: 1 });
  const testRun   = await ctx.task(runTestsTask,   { attempt: 1 });
  const verdict   = await ctx.task(validateTask,   { testResults: testRun, attempt: 1 });

  return { passed: verdict.passed, ...verdict };
}
```

**Usage — convenience approach**

```js
import { executeTddTriplet } from '../shared/index.js';

export async function process(inputs, ctx) {
  const result = await executeTddTriplet(ctx, {
    name: 'phase-4-cost-aggregation',
    writeTests: {
      prompt: 'Write unit tests for the cost aggregation module.',
      targetPath: 'tests/cost-aggregation.test.ts',
      context: { moduleUnderTest: 'src/cost-aggregation.ts' }
    },
    runTests:   { command: 'npm test -- --grep cost-aggregation', timeout: 90000 },
    validate:   { expectAllPass: true, minCoverage: 80 },
    retryPolicy: { maxRetries: 2, retryableExitCodes: [1] }
  }, { iteration: inputs.iteration ?? 1, previousFeedback: inputs.previousFeedback });

  if (!result.passed) {
    // Pass result.validation.summary back as previousFeedback in the next iteration
    return { ...result, nextFeedback: result.validation.summary };
  }

  return result;
}
```

---

## Composing All Three

A complete example process that scans prior attempts and aggregates costs in parallel, performs analysis, then enforces a completeness gate before completing.

```js
import { scanPriorAttempts, aggregateCosts, checkCompleteness } from '../shared/index.js';

export async function process(inputs, ctx) {
  // Phase 1: gather context — scan and aggregate run concurrently
  const [{ priorRuns, totalFound }, costs] = await Promise.all([
    scanPriorAttempts(
      inputs.runsDir ?? '.a5c/runs',
      inputs.processIdPatterns ?? ['my-process'],
      {
        relatedProcessIds: inputs.relatedProcessIds ?? [],
        maxRuns: 10,
        includeOutputSummary: true
      }
    ),
    aggregateCosts({
      runsDir: inputs.runsDir ?? '.a5c/runs',
      processIdPatterns: inputs.processIdPatterns ?? ['my-process'],
      relatedProcessIds: inputs.relatedProcessIds ?? []
    })
  ]);

  // Phase 2: analyse — dispatch an agent task with the gathered context
  const analysis = await ctx.task(analyzeTask, {
    priorRuns,
    totalFound,
    costs,
    targetArea: inputs.targetArea
  });

  // Phase 3: completeness gate — verify issues found during analysis are resolved
  let gate = await checkCompleteness(inputs.runDir, analysis.identifiedIssues);

  while (!gate.allAddressed) {
    const response = await ctx.breakpoint({
      message: `Completeness gate not passed.\n${gate.summary}`,
      options: ['address remaining issues', 'defer all', 'abort']
    });

    if (response.option === 'abort') break;

    // re-check after human or agent remediation
    gate = await checkCompleteness(inputs.runDir, analysis.identifiedIssues);
  }

  return { analysis, costs, gate };
}
```

---

## `relatedProcessIds` and Cross-Run Linking

All three components accept a `relatedProcessIds` array for precise cross-run linking by exact processId. This supplements the fuzzy substring matching provided by `processIdPatterns`.

Runs can store related processIds in their metadata by passing `extraMetadata` to `babysitter run:create`. Since `RunMetadata` extends `JsonRecord`, no SDK schema change is required:

```bash
babysitter run:create \
  --process-id my-retrospect \
  --entry .a5c/processes/my-retrospect.js#process \
  --inputs inputs.json \
  --extra-metadata '{"relatedProcessIds": ["prior-run-process-id-1", "prior-run-process-id-2"]}'
```

Within a process, read `relatedProcessIds` from `inputs` and pass them through to all three components so that exact-match runs are always included regardless of their processId string.

---

## API Reference

| Export | Module | Type | Description |
|--------|--------|------|-------------|
| `scanPriorAttempts` | `prior-attempts-scanner` | `async function` | Scan runs directory for prior runs matching processId patterns |
| `priorAttemptsScannerTask` | `prior-attempts-scanner` | `TaskDef` | `defineTask` wrapper for harness-driven execution |
| `evaluateCompleteness` | `completeness-gate` | `function` | Synchronous evaluation given explicit issue + resolution data |
| `checkCompleteness` | `completeness-gate` | `async function` | Async evaluation that mines a run directory for evidence |
| `completenessGateTask` | `completeness-gate` | `TaskDef` | `defineTask` wrapper for harness-driven execution |
| `aggregateCosts` | `cost-aggregation` | `async function` | Aggregate cost-proxy metrics across related runs |
| `costAggregationTask` | `cost-aggregation` | `TaskDef` | `defineTask` wrapper for harness-driven execution |
| `createTddTriplet` | `tdd-triplet` | `function` | Factory that returns three `defineTask` descriptors for the write-tests, run-tests, and validate phases |
| `executeTddTriplet` | `tdd-triplet` | `async function` | Convenience wrapper that drives the full TDD triplet sequence with built-in retry logic |

All exports are available from `./index.js` (the preferred import path) or from the individual module files.
