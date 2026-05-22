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

### `playwright-visual-smoke`

Performs visual regression smoke tests using Playwright to catch CSS/layout regressions. Designed for injection into CI, quality-gate, and convergence processes that need to verify UI integrity before completing or merging.

The module exposes three surfaces:
- **`createVisualSmokeTest(config)`** — factory that builds two `defineTask` descriptors for fine-grained manual control.
- **`executeVisualSmokeTest(ctx, config, args?)`** — convenience wrapper that drives the full sequence and returns a unified result.
- **`playwrightVisualSmokeTask`** — standalone `defineTask` for direct `ctx.task()` usage without a factory.

**Import**

```js
import {
  createVisualSmokeTest,
  executeVisualSmokeTest,
  playwrightVisualSmokeTask
} from './index.js';
// or directly:
import {
  createVisualSmokeTest,
  executeVisualSmokeTest,
  playwrightVisualSmokeTask
} from './playwright-visual-smoke.js';
```

**`createVisualSmokeTest(config)` — factory**

Creates two babysitter task definitions that can be dispatched individually via `ctx.task()`. The returned descriptors carry no shared mutable state and are safe to reuse across multiple convergence loop iterations.

```js
function createVisualSmokeTest(config: VisualSmokeTestConfig): {
  smokeTestTask:    TaskDef,  // shell task — runs Playwright checks, outputs raw JSON
  generateReportTask: TaskDef,  // agent task — analyses results, produces human-readable report
}
```

**`VisualSmokeTestConfig` options**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `name` | `string` | yes | — | Human-readable identifier, e.g. `'dashboard-visual-smoke'`. Used in task IDs and titles. |
| `baseUrl` | `string` | yes | — | Base URL of the application under test, e.g. `'http://localhost:3000'`. |
| `pages` | `string[]` | no | `['/']` | URL paths to visit relative to `baseUrl`. |
| `criticalButtons` | `string[]` | no | `['Save','Submit','Cancel']` | Button labels (role=button) to verify are visible and clickable. |
| `containerSelectors` | `string[]` | no | `['main','[role="main"]','.container']` | CSS selectors whose bounding boxes must have non-zero dimensions. |
| `viewportWidth` | `number` | no | `1280` | Browser viewport width in pixels. |
| `viewportHeight` | `number` | no | `720` | Browser viewport height in pixels. |
| `timeout` | `number` | no | `30000` | Navigation timeout in milliseconds per page. |

**The 4 checks performed per page**

1. **Build error detection** — scans `document.body.innerText` for patterns: `'Build Error'`, `'Compilation Error'`, `'Module not found'`, `'SyntaxError'`. A match is a hard failure.
2. **Container dimension verification** — checks each `containerSelectors` element has a non-zero bounding box (`width > 0 && height > 0`). The page fails only if *all* containers are missing or zero-area (individual misses are warnings).
3. **Fixed element bounds validation** — enumerates all `position: fixed` elements via `getComputedStyle` and verifies each lies within the configured viewport bounds. Out-of-bounds fixed elements indicate CSS layout regressions.
4. **Critical button visibility and clickability** — for each label in `criticalButtons`, locates the first `role=button` match and asserts both `isVisible()` and `isEnabled()`.

**`generateReportTask` output schema**

```js
{
  passed:          boolean,
  summary:         string,
  pages:           Array<{ url: string, status: 'pass'|'fail'|'error', issues: string[] }>,
  recommendations: string[]
}
```

**`executeVisualSmokeTest(ctx, config, args?)` — convenience wrapper**

Orchestrates the full smoke test sequence in two phases: run Playwright checks (shell task), then analyse results (agent task). Returns a unified `VisualSmokeTestResult`. The final `passed` flag is `true` only when both the raw shell task and the analysis agent independently report success.

```js
async function executeVisualSmokeTest(
  ctx:    ProcessContext,
  config: VisualSmokeTestConfig,
  args?:  { attempt?: number }  // attempt number for retry tracking, default 1
): Promise<{
  passed:  boolean,      // true when all checks across all pages and the agent report pass
  pages:   PageResult[], // raw per-page results from the Playwright shell task
  summary: string        // human-readable summary from the report agent
}>
```

**`playwrightVisualSmokeTask` — standalone `defineTask`**

A single `defineTask` descriptor that combines script execution and result analysis into one agent task invocation. Use when you want the smoke test as a single orchestrated harness task without the factory split. All config is passed via `args` at call time.

Task inputs (via `args`):

| Field | Type | Default |
|-------|------|---------|
| `name` | `string` | `'visual-smoke'` |
| `baseUrl` | `string` | `'http://localhost:3000'` |
| `pages` | `string[]` | `['/']` |
| `criticalButtons` | `string[]` | `['Save','Submit','Cancel']` |
| `containerSelectors` | `string[]` | `['main','[role="main"]','.container']` |
| `viewportWidth` | `number` | `1280` |
| `viewportHeight` | `number` | `720` |
| `timeout` | `number` | `30000` |

Task output: `{ passed, pages, summary, recommendations }`.

**Usage — convenience approach**

```js
import { executeVisualSmokeTest } from '../shared/index.js';

export async function process(inputs, ctx) {
  const result = await executeVisualSmokeTest(ctx, {
    name: 'dashboard-visual-smoke',
    baseUrl: inputs.baseUrl ?? 'http://localhost:3000',
    pages: ['/', '/settings', '/dashboard'],
    criticalButtons: ['Save', 'Submit', 'Cancel', 'Delete'],
    containerSelectors: ['main', '.dashboard-grid', '.sidebar'],
  });

  if (!result.passed) {
    // Feed result.summary back into a convergence loop breakpoint
    const response = await ctx.breakpoint({
      message: `Visual smoke checks failed.\n${result.summary}`,
      options: ['fix and retry', 'defer', 'abort']
    });
  }

  return result;
}
```

**Usage — factory approach (manual control)**

```js
import { createVisualSmokeTest } from '../shared/index.js';

export async function process(inputs, ctx) {
  const { smokeTestTask, generateReportTask } = createVisualSmokeTest({
    name: 'catalog-visual-smoke',
    baseUrl: 'http://localhost:3000',
    pages: ['/', '/browse', '/search'],
    criticalButtons: ['Search', 'Clear'],
    containerSelectors: ['main', '.catalog-grid'],
  });

  const rawResults = await ctx.task(smokeTestTask, { attempt: 1 });
  const report     = await ctx.task(generateReportTask, { smokeResults: rawResults });

  return { passed: report.passed, summary: report.summary };
}
```

**Usage — standalone task**

```js
import { playwrightVisualSmokeTask } from '../shared/index.js';

export async function process(inputs, ctx) {
  const result = await ctx.task(playwrightVisualSmokeTask, {
    name: 'app-smoke',
    baseUrl: 'http://localhost:3000',
    pages: ['/', '/about'],
  });

  return result;
}
```

**Example output**

```json
{
  "passed": false,
  "summary": "Visual regression detected on /dashboard: the .dashboard-grid container has zero area, indicating a rendering failure. All other pages passed.",
  "pages": [
    {
      "url": "/",
      "status": "pass",
      "issues": []
    },
    {
      "url": "/dashboard",
      "status": "fail",
      "issues": [
        "Container '.dashboard-grid' has zero area (width=0, height=0)",
        "Button 'Save' not visible"
      ]
    }
  ],
  "recommendations": [
    "Inspect .dashboard-grid CSS — possible display:none or missing layout styles",
    "Verify the Save button renders within the dashboard view before making it visible"
  ]
}
```

---

### `ts-check`

Provides a hard shell gate for TypeScript compilation correctness via `tsc --noEmit`. Unlike soft agent-prompt-based checks — where an agent can reason its way around a failing typecheck or simply note the errors and continue — this module enforces compilation via a shell task with `expectedExitCode: 0`. The harness cannot satisfy the task with anything other than a zero exit code from the compiler. It is a non-negotiable quality gate.

The module exposes three surfaces:
- **`tsCheckTask`** — standalone `defineTask` descriptor (kind: `'shell'`) for direct use with `ctx.task()`.
- **`createTsCheck(config)`** — factory that builds a shell check task and an agent report task, parameterized by project directory, tsconfig path, and compiler flags.
- **`executeTsCheck(ctx, config)`** — convenience wrapper that runs the check, parses tsc output into structured error records, and returns a comprehensive result object.

**Import**

```js
import { tsCheckTask, createTsCheck, executeTsCheck } from './index.js';
// or directly:
import { tsCheckTask, createTsCheck, executeTsCheck } from './ts-check.js';
```

**`tsCheckTask` — standalone task**

A single `defineTask` descriptor that runs `tsc --noEmit` as a hard compilation gate. Use when you want a one-off typecheck without factory configuration.

Expected args:

```js
{
  projectDir?:    string,    // Working directory for the compiler (default: current directory)
  tsconfigPath?:  string,    // Path to tsconfig.json (default: 'tsconfig.json')
  strict?:        boolean,   // Pass --strict flag (default: false)
  incremental?:   boolean,   // Pass --incremental flag (default: false)
  extraFlags?:    string[],  // Additional tsc flags (default: [])
}
```

```js
const result = await ctx.task(tsCheckTask, {
  projectDir: 'packages/sdk',
  tsconfigPath: 'tsconfig.json',
});
```

**`createTsCheck(config)` — factory**

Creates two babysitter task definitions that can be dispatched individually via `ctx.task()`:

- **`checkTask`** (kind: `'shell'`) — runs `tsc --noEmit` with the specified configuration. Uses `expectedExitCode: 0` to enforce a hard compilation gate.
- **`reportTask`** (kind: `'agent'`) — analyzes raw tsc output and produces a structured diagnostic report with error categorization and remediation suggestions.

Both descriptors carry no shared mutable state and are safe to reuse across convergence loop iterations.

```js
function createTsCheck(config: TsCheckConfig): {
  checkTask:  TaskDef,  // shell task — runs tsc --noEmit as a hard gate
  reportTask: TaskDef,  // agent task — categorizes errors and suggests remediations
}
```

**`TsCheckConfig` options**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `projectDir` | `string` | no | current directory | Working directory for the compiler. |
| `tsconfigPath` | `string` | no | `'tsconfig.json'` | Path to the tsconfig file, relative to `projectDir`. |
| `strict` | `boolean` | no | `false` | Whether to pass `--strict` to tsc. |
| `incremental` | `boolean` | no | `false` | Whether to pass `--incremental` to tsc. |
| `extraFlags` | `string[]` | no | `[]` | Additional flags to pass to tsc verbatim. |
| `timeout` | `number` | no | `120000` | Maximum execution time in milliseconds. |

**`reportTask` output schema**

```js
{
  totalErrors:  number,
  categories:   Record<string, number>,  // e.g. { "type mismatch": 4, "import resolution": 2 }
  topErrors:    Array<{ file: string, line: number, code: string, message: string }>,
  suggestions:  string[],
  summary:      string
}
```

**`executeTsCheck(ctx, config)` — convenience wrapper**

Runs the compilation check, catches failures, parses tsc output into structured error records, and returns a unified result. Does **not** throw on compilation failure — it captures the failure and returns `{ passed: false, ... }` so the caller can decide how to proceed (fix-and-retry loop, breakpoint, abort).

```js
async function executeTsCheck(
  ctx:    ProcessContext,
  config: TsCheckConfig
): Promise<{
  passed:     boolean,    // true when tsc exits with code 0
  exitCode:   number,     // actual compiler exit code
  errorCount: number,     // number of parsed diagnostic errors
  errors:     TscError[], // structured error records
  output:     string,     // raw combined stdout+stderr
  summary:    string      // human-readable one-line result
}>
```

`TscError` shape:

```js
{
  file:    string,  // source file path relative to projectDir
  line:    number,  // 1-based line number
  column:  number,  // 1-based column number
  code:    string,  // TypeScript error code, e.g. 'TS2322'
  message: string   // human-readable error description
}
```

**Usage — standalone task**

```js
import { tsCheckTask } from '../shared/index.js';

export async function process(inputs, ctx) {
  const result = await ctx.task(tsCheckTask, {
    projectDir: 'packages/sdk',
  });
}
```

**Usage — factory approach (manual control)**

```js
import { createTsCheck } from '../shared/index.js';

export async function process(inputs, ctx) {
  const { checkTask, reportTask } = createTsCheck({
    projectDir: 'packages/sdk',
    strict: true,
    timeout: 180000,
  });

  const checkResult = await ctx.task(checkTask, {});

  if (checkResult.exitCode !== 0) {
    const report = await ctx.task(reportTask, { tscOutput: checkResult });
    // report.suggestions contains actionable remediation steps
  }
}
```

**Usage — convenience approach**

```js
import { executeTsCheck } from '../shared/index.js';

export async function process(inputs, ctx) {
  const result = await executeTsCheck(ctx, {
    projectDir: 'packages/sdk',
    strict: true,
  });

  if (!result.passed) {
    // Feed structured errors into a fix-and-retry convergence loop
    const response = await ctx.breakpoint({
      message: `TypeScript compilation failed.\n${result.summary}\n\nErrors:\n${result.errors.map(e => `  ${e.file}:${e.line} ${e.code}: ${e.message}`).join('\n')}`,
      options: ['fix errors and retry', 'defer', 'abort'],
      previousFeedback: inputs.previousFeedback,
    });
  }

  return result;
}
```

**Why this matters: hard gates vs. soft checks**

Agent-prompt-based TypeScript checks are inherently soft: an agent can acknowledge errors, note them as "minor", decide they are pre-existing, or simply continue. There is no enforcement mechanism. A shell task with `expectedExitCode: 0` cannot be reasoned around — the harness must execute `tsc --noEmit` and the task only resolves successfully when the compiler exits cleanly. This makes `ts-check` appropriate for:

- Quality gates in convergence loops that must not complete with type errors.
- CI-equivalent checks within orchestrated processes.
- Pre-merge or pre-deploy verification phases where compilation correctness is non-negotiable.

For exploratory or diagnostic contexts where you want to *know* about errors without blocking progress, use `executeTsCheck` (which captures failures without throwing) and feed the structured errors into a breakpoint or retry loop.

---

### `runtime-call-tracer`

Traces runtime execution paths across a codebase by grepping for route/handler registrations and following import chains. Produces a structured map of feature areas to their traced files, dead code candidates, and dominant hot path. Designed for injection into architecture-analysis, refactoring-planning, and quality-audit processes.

The module exposes two surfaces:
- **`traceRuntimeCallPathsTask`** — standalone `defineTask` descriptor (kind: `'agent'`) for direct `ctx.task()` usage.
- **`createCallPathTracer(options)`** — convenience factory that bakes in default `projectDir`, `maxDepth`, and `timeout` values and returns a reusable task definition.

**Import**

```js
import { traceRuntimeCallPathsTask, createCallPathTracer } from './index.js';
// or directly:
import { traceRuntimeCallPathsTask, createCallPathTracer } from './runtime-call-tracer.js';
```

**`traceRuntimeCallPathsTask` — standalone task**

Expected args:

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `featureAreas` | `Array<{ name: string, entryPoint: string }>` | yes | — | Feature areas to trace. Each `entryPoint` is a path relative to `projectDir`. |
| `projectDir` | `string` | no | `'.'` | Root directory for resolving relative import paths. |
| `maxDepth` | `number` | no | `8` | Maximum import-follow depth per feature area. |
| `timeout` | `number` | no | `120000` | Task timeout in milliseconds. |

Output schema:

```js
{
  runtimeCallPaths: {
    [featureName: string]: {
      entryPoint:         string,    // the provided entry point path
      tracedFiles:        string[],  // all visited source files, relative to projectDir
      deadCodeCandidates: string[],  // "<file>:<symbol>" entries with no external callers
      hotPath:            string,    // dominant call chain from entry to terminal effect
    }
  },
  summary: string  // concise architectural overview of observed patterns
}
```

**`createCallPathTracer(options)` — factory**

```js
function createCallPathTracer(options?: {
  projectDir?:  string,  // default '.'
  maxDepth?:    number,  // default 8, clamped to [1, 20]
  timeout?:     number,  // default 120000
  tracerName?:  string,  // default 'default'; used to differentiate task IDs in multi-tracer processes
}): TaskDef
```

The returned task definition accepts the same `featureAreas` (and optional per-call `projectDir`, `maxDepth`, `timeout`) arguments as the standalone task. Per-call values override factory defaults.

**Usage — standalone task**

```js
import { traceRuntimeCallPathsTask } from '../shared/index.js';

export async function process(inputs, ctx) {
  const result = await ctx.task(traceRuntimeCallPathsTask, {
    featureAreas: [
      { name: 'run-create', entryPoint: 'packages/sdk/src/cli/commands/runCreate.ts' },
      { name: 'task-post',  entryPoint: 'packages/sdk/src/cli/commands/taskPost.ts' },
    ],
    projectDir: '.',
    maxDepth: 6,
  });

  for (const [feature, paths] of Object.entries(result.runtimeCallPaths)) {
    console.log(`${feature}: ${paths.tracedFiles.length} files, hot path: ${paths.hotPath}`);
  }

  return result;
}
```

**Usage — factory approach**

```js
import { createCallPathTracer } from '../shared/index.js';

export async function process(inputs, ctx) {
  const tracerTask = createCallPathTracer({
    projectDir: inputs.projectDir ?? '.',
    maxDepth: 5,
    tracerName: 'sdk-tracer',
  });

  // Dispatch in two batches to keep individual agent contexts focused
  const runtimePaths = await ctx.task(tracerTask, {
    featureAreas: [
      { name: 'replay-engine',  entryPoint: 'src/runtime/replay/index.ts' },
      { name: 'storage-layer',  entryPoint: 'src/storage/index.ts' },
    ],
  });

  const taskPaths = await ctx.task(tracerTask, {
    featureAreas: [
      { name: 'task-dispatch', entryPoint: 'src/tasks/index.ts' },
    ],
  });

  return {
    callPaths: {
      ...runtimePaths.runtimeCallPaths,
      ...taskPaths.runtimeCallPaths,
    },
    summaries: [runtimePaths.summary, taskPaths.summary],
  };
}
```

**Example output**

```json
{
  "runtimeCallPaths": {
    "run-create": {
      "entryPoint": "packages/sdk/src/cli/commands/runCreate.ts",
      "tracedFiles": [
        "packages/sdk/src/cli/commands/runCreate.ts",
        "packages/sdk/src/runtime/createRun.ts",
        "packages/sdk/src/storage/createRunDir.ts",
        "packages/sdk/src/storage/appendEvent.ts",
        "packages/sdk/src/storage/lock.ts"
      ],
      "deadCodeCandidates": [
        "packages/sdk/src/storage/createRunDir.ts:ensureParentDir"
      ],
      "hotPath": "cli#runCreate → createRun() → createRunDir() → acquireRunLock() → appendEvent(RUN_CREATED)"
    }
  },
  "summary": "The run-create path follows a strict layered architecture: CLI → runtime orchestration → storage primitives. The storage layer is consistently accessed through thin wrapper functions with no cross-cutting concerns. One unexported utility (ensureParentDir) appears to have no callers outside its declaration file."
}
```

---

### `cycle-aware-verification`

Validates that fixes survive system execution cycles (cron jobs, watch-mode rebuilds, scheduled tasks, server restarts). Many bugs only manifest after the system completes its next cycle — a server that passes an immediate health check may crash on the next hot-reload. This module adds a temporal dimension to verification: baseline check, wait for cycle, re-check.

The module also provides pre-flight analysis to scan files for dangerous patterns (e.g., `rm -rf`, `kill -9`) before changes are applied.

The module exposes four surfaces:
- **`createPreflightAnalysis(config)`** — factory that builds a shell task to grep for dangerous patterns in a target file.
- **`cycleAwareVerificationTask`** — standalone `defineTask` descriptor (kind: `'shell'`) that performs baseline + cycle wait + post-cycle check in a single shell invocation.
- **`createCycleAwareVerification(config)`** — factory that returns separate `baselineTask` and `postCycleTask` definitions for fine-grained manual control.
- **`createPostCycleSurvivalCheck(config)`** — factory that builds a single post-cycle survival check task with baked-in URL, cycle interval, and expected status.

**Import**

```js
import {
  cycleAwareVerificationTask,
  createCycleAwareVerification,
  createPreflightAnalysis,
  createPostCycleSurvivalCheck,
} from './index.js';
// or directly:
import {
  cycleAwareVerificationTask,
  createCycleAwareVerification,
  createPreflightAnalysis,
  createPostCycleSurvivalCheck,
} from './cycle-aware-verification.js';
```

**`cycleAwareVerificationTask` — standalone task**

Expected args:

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `url` | `string` | yes | — | Health check endpoint URL. |
| `cycleIntervalMs` | `number` | no | `300000` | Cycle wait duration in milliseconds. |
| `expectedStatus` | `number` | no | `200` | Expected HTTP status code. |
| `timeout` | `number` | no | `10000` | Per-request timeout in milliseconds. |

Output (JSON on stdout):

```js
{
  passed:         boolean,  // true only when both baseline and post-cycle checks pass
  baselineOk:     boolean,  // true when baseline HTTP status matches expected
  postCycleOk:    boolean,  // true when post-cycle HTTP status matches expected
  cycleIntervalMs?: number, // echoed back on success
  error?:         string    // human-readable error message on failure
}
```

**`createCycleAwareVerification(config)` — factory**

```js
function createCycleAwareVerification(config: {
  healthCheck: { url: string, expectedStatus?: number, timeout?: number },
  cycleIntervalMs?: number,
  name?: string,
}): { baselineTask: TaskDef, postCycleTask: TaskDef }
```

**`createPreflightAnalysis(config)` — factory**

```js
function createPreflightAnalysis(config?: {
  patterns?: string[],  // default: ['rm -rf', 'rm -r ', 'rmdir', 'kill -9', 'pkill', 'killall']
  name?: string,        // default: 'preflight-analysis'
  timeout?: number,     // default: 10000
}): TaskDef
```

Expected args: `{ filePath: string }` — the file to scan for dangerous patterns.

**`createPostCycleSurvivalCheck(config)` — factory**

```js
function createPostCycleSurvivalCheck(config: {
  url: string,
  cycleIntervalMs?: number,  // default: 300000
  name?: string,             // default: 'post-cycle-survival'
  expectedStatus?: number,   // default: 200
  timeout?: number,          // default: 10000
}): TaskDef
```

**Usage — standalone task**

```js
import { cycleAwareVerificationTask } from '../shared/index.js';

export async function process(inputs, ctx) {
  const result = await ctx.task(cycleAwareVerificationTask, {
    url: inputs.healthCheckUrl ?? 'http://localhost:3000/api/health',
    cycleIntervalMs: 60000,
    expectedStatus: 200,
  });
}
```

**Usage — factory approach (manual control)**

```js
import { createCycleAwareVerification } from '../shared/index.js';

export async function process(inputs, ctx) {
  const { baselineTask, postCycleTask } = createCycleAwareVerification({
    healthCheck: { url: 'http://localhost:3000/api/health', timeout: 5000 },
    cycleIntervalMs: 120000,
    name: 'api-cycle-check',
  });

  const baseline = await ctx.task(baselineTask, {});
  // ... apply fix or perform other work between checks ...
  const postCycle = await ctx.task(postCycleTask, {});
}
```

**Usage — pre-flight scan + post-cycle survival**

```js
import { createPreflightAnalysis, createPostCycleSurvivalCheck } from '../shared/index.js';

export async function process(inputs, ctx) {
  // Scan script for dangerous patterns before applying
  const preflight = createPreflightAnalysis({ patterns: ['rm -rf', 'DROP TABLE'] });
  const scan = await ctx.task(preflight, { filePath: inputs.scriptPath });

  // After applying the fix, verify the server survives its next cycle
  const survivalTask = createPostCycleSurvivalCheck({
    url: 'http://localhost:8080/health',
    cycleIntervalMs: 60000,
  });
  const survived = await ctx.task(survivalTask, {});
}
```

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
| `createVisualSmokeTest` | `playwright-visual-smoke` | `function` | Factory that returns two `defineTask` descriptors for the Playwright shell task and report agent task |
| `executeVisualSmokeTest` | `playwright-visual-smoke` | `async function` | Convenience wrapper that drives the full visual smoke test sequence and returns a unified result |
| `playwrightVisualSmokeTask` | `playwright-visual-smoke` | `TaskDef` | Standalone `defineTask` for direct `ctx.task()` usage without factory instantiation |
| `tsCheckTask` | `ts-check` | `TaskDef` | Standalone shell `defineTask` that runs `tsc --noEmit` as a hard compilation gate |
| `createTsCheck` | `ts-check` | `function` | Factory that returns a shell `checkTask` and an agent `reportTask` for TypeScript compilation checking |
| `executeTsCheck` | `ts-check` | `async function` | Convenience wrapper that runs the compilation check and returns a structured result with parsed errors |
| `traceRuntimeCallPathsTask` | `runtime-call-tracer` | `TaskDef` | Standalone agent `defineTask` that greps for handlers, follows imports, and maps call paths for a list of feature areas |
| `createCallPathTracer` | `runtime-call-tracer` | `function` | Factory that returns a pre-configured `defineTask` descriptor with baked-in `projectDir`, `maxDepth`, and `timeout` defaults |
| `cycleAwareVerificationTask` | `cycle-aware-verification` | `TaskDef` | Standalone shell `defineTask` that performs baseline check, cycle wait, and post-cycle check in a single invocation |
| `createCycleAwareVerification` | `cycle-aware-verification` | `function` | Factory that returns separate `baselineTask` and `postCycleTask` definitions for fine-grained cycle-aware verification |
| `createPreflightAnalysis` | `cycle-aware-verification` | `function` | Factory that returns a shell `defineTask` to grep for dangerous patterns in a target file |
| `createPostCycleSurvivalCheck` | `cycle-aware-verification` | `function` | Factory that returns a shell `defineTask` for post-cycle survival checking with baked-in URL and cycle interval |

All exports are available from `./index.js` (the preferred import path) or from the individual module files.

---

## Curated-Dataset + SQL-Tool Pattern

Three composable processes that together implement the "do the curation once, then let an LLM compose SQL against a local SQLite database through Python stdlib scripts at query time" pattern. Generalized from `specializations/domains/business/travel/` -- works for any domain (science, finance, sports, civic data, ...).

Hard constraints inherited from the source pattern (applies to all three):

- Only `kind: 'agent'` tasks. No shell tasks, no MCP.
- All DB creation/loading/indexing/querying happens via Python 3 scripts using ONLY the stdlib `sqlite3` module. No ORM, no sqlite3 CLI, no pandas, no requests.
- DB is opened read-only (`file:{db}?mode=ro` URI) during exploration so the analyst cannot mutate the dataset.
- Every finding carries the verbatim SQL that produced it as audit evidence.

### `source-discovery`

Discovers authoritative, licence-clean open data sources for a domain + scope and writes a reusable `sources.json` + `SOURCES.md` manifest.

**Import**

```js
import { process as discoverSources, sourceDiscoveryTask } from './index.js';
// or:
import { process as discoverSources } from './source-discovery.js';
```

**Inputs** (see file header for full schema): `{ domain, scope, workDir, entityHints?, licencePolicy?, maxSources?, priorManifestPath? }`

**Outputs**: `{ manifestPath, sources, coverageGaps, artifacts, duration, metadata }`

**Phases**: scope-refinement → source-discovery → source-validation (reachability + licence re-check + sample persistence) → manifest-export.

### `local-db-build`

Turns a `sources.json` manifest into a populated, indexed, documented SQLite database.

**Import**

```js
import { process as buildLocalDb } from './local-db-build.js';
```

**Inputs**: `{ manifestPath, workDir, dbFileName?, rebuild?, domain?, scopeNotes?, expectedRowCounts? }`

**Outputs**: `{ dbPath, schemaDocPath, ingestReport, queryReadiness, artifacts, duration, metadata }`

**Phases**: schema-design → python-etl-authoring (stdlib-only scripts) → ingest-execution (idempotent) → index-build (indexes + denormalized views + ANALYZE) → data-validation (foreign_key_check, integrity_check, row-count gates, representative queries) → schema-documentation (writes `SCHEMA.md` with tables, views, indexes, worked example queries).

### `db-agent-explore`

Points an analyst agent at a populated SQLite DB (typically from `local-db-build`) with a natural-language research question. The agent reads `SCHEMA.md`, decomposes the question into sub-questions, composes + executes Python `sqlite3` scripts in iterative rounds until the findings are sufficient, then emits a markdown report with verbatim SQL as evidence.

**Import**

```js
import { process as exploreDb } from './db-agent-explore.js';
```

**Inputs**: `{ dbPath, schemaDocPath, workDir, question, hypotheses?, maxQueryRounds?, outputFormat?, persona? }`

**Outputs**: `{ reportPath, findings, queryLog, artifacts, duration, metadata }`

**Phases**: question-planning → sql-exploration (looped up to `maxQueryRounds`, with refinementNotes threading between rounds) → findings-synthesis (dedup + rank, no DB access) → report-export.

### End-to-end usage

```js
import {
  sourceDiscoveryProcess,
  localDbBuildProcess,
  dbAgentExploreProcess,
} from '@a5c-ai/babysitter-library/processes/shared';

export async function process(inputs, ctx) {
  const workDir = inputs.workDir;

  const sources = await sourceDiscoveryProcess({
    domain: 'science/astronomy',
    scope: { objects: ['exoplanets'], window: { from: '1995-01-01' } },
    workDir,
  }, ctx);

  const db = await localDbBuildProcess({
    manifestPath: sources.manifestPath,
    workDir,
    domain: 'science/astronomy',
    scopeNotes: 'confirmed exoplanets discovered 1995-present',
  }, ctx);

  const report = await dbAgentExploreProcess({
    dbPath: db.dbPath,
    schemaDocPath: db.schemaDocPath,
    workDir: `${workDir}/exploration`,
    question: 'What is the mass/radius distribution of exoplanets discovered by transit vs radial velocity?',
  }, ctx);

  return { sources, db, report };
}
```

### When to use which

- Only need a source manifest (e.g. to hand to a non-Babysitter pipeline)? Run `source-discovery` alone.
- Have sources already and want a queryable DB? Skip to `local-db-build` with a hand-written manifest.
- Have a DB already and want an analyst pass? Run `db-agent-explore` standalone.
- Want the full curated-dataset + SQL-tool experience? Chain all three, as shown above.

### Inspired by

Michael Lugassy's curated-dataset + direct-SQL-tool travel-agent pattern ([github.com/mluggy](https://github.com/mluggy)).
