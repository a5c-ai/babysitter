# Deterministic Quality Gates: Shell vs Agent Verification

## The Problem

Agent-interpreted verification creates **soft gates** -- gates where an LLM subjectively assesses pass/fail based on a prompt rather than executing an actual command and checking its exit code. Soft gates are unreliable because the agent may hallucinate success, misinterpret output, skip steps, or apply inconsistent standards across iterations.

This is not a theoretical concern. During a 9-phase adapter build orchestrated by babysitter, all 4 runtime bugs discovered post-build shared the same root cause: verification was delegated to an agent prompt instead of running actual commands.

| Bug | What deterministic check would have caught it |
|-----|----------------------------------------------|
| UI registration missing | `grep babysitter_local AgentConfigForm.tsx` |
| Timeout defaults to 0s | Config boundary test with `timeout=0` |
| Missing package dependency | `node -e "require('@pkg/adapter-claude-local/server')"` |
| Docs accuracy | Starting the server and testing the adapter endpoint |

Every one of these bugs would have been caught by a shell command with `expectedExitCode: 0`. Instead, the agent was prompted with instructions like "verify the UI registration is correct" and "check that the dependency is available." The agent responded that everything looked good. It did not run the commands.

The lesson: **if a check can be expressed as a shell command with a deterministic exit code, it must never be delegated to an agent prompt.**

---

## Decision Matrix: When to Use Shell vs Agent

| Verification Type | Use Shell | Use Agent | Rationale |
|---|---|---|---|
| Compilation (`tsc --noEmit`) | Yes | No | Binary pass/fail via exit code |
| Linting (`eslint`, `prettier --check`) | Yes | No | Binary pass/fail via exit code |
| Test suites (`vitest run`, `jest --ci`, `pytest`) | Yes | No | Binary pass/fail via exit code |
| Grep/pattern checks (`grep -r`) | Yes | No | Binary match/no-match via exit code |
| Dependency verification (`node -e "require(...)"`) | Yes | No | Binary importable/not-importable via exit code |
| Runtime smoke tests (start server, curl endpoint) | Yes | No | Binary HTTP status match via exit code |
| File existence checks (`test -f path`) | Yes | No | Binary exists/missing via exit code |
| JSON/YAML validity (`node -e "JSON.parse(...)"`) | Yes | No | Binary parseable/unparseable via exit code |
| Code review (style, patterns, readability) | No | Yes | Requires subjective judgment |
| Architecture assessment (design quality) | No | Yes | Requires domain reasoning |
| UX evaluation (user experience quality) | No | Yes | Requires subjective judgment |
| Documentation quality (clarity, completeness) | No | Yes | Requires natural language reasoning |
| Error message helpfulness | No | Yes | Requires subjective judgment |
| Failure diagnosis and remediation suggestions | No | Yes | Requires reasoning about root causes |

**Rule of thumb:** If the check produces a binary pass/fail via an exit code, use shell. If it requires judgment, reasoning, or natural language interpretation, use agent.

---

## The Deterministic Quality Gate Pattern

The `deterministic-quality-gate.js` shared component (`library/processes/shared/deterministic-quality-gate.js`) provides a composable, reusable pattern for enforcing hard shell-based verification in babysitter processes. It uses `kind: 'shell'` tasks with `expectedExitCode: 0`, producing binary deterministic outcomes that cannot be negotiated or reinterpreted by an agent.

### Three-Surface API

The module exposes three progressively higher-level surfaces:

#### 1. `deterministicGateTask` -- Standalone Task Descriptor

A pre-built `defineTask` descriptor (kind: `shell`) for direct use with `ctx.task()`. Accepts an array of labeled commands at invocation time.

```js
import { deterministicGateTask } from './deterministic-quality-gate.js';

const result = await ctx.task(deterministicGateTask, {
  commands: [
    { label: 'TypeScript', command: 'npx tsc --noEmit' },
    { label: 'ESLint', command: 'npx eslint src/' },
  ],
  failFast: true,
  projectDir: 'packages/sdk',
  timeout: 180000,
});
```

**Args schema:**
- `commands` -- Array of `{ label: string, command: string, expectedExitCode?: number }`. Each command is run sequentially. Default expected exit code is `0`.
- `projectDir` -- Optional working directory for all commands.
- `failFast` -- Optional boolean (default: `false`). When true, stops on the first failure.
- `timeout` -- Optional number in milliseconds (default: `300000`).

#### 2. `createDeterministicGate(config)` -- Factory

Creates a pair of task definitions: a shell gate task and an agent report task. Configuration is baked into the factory, so the tasks require no args at invocation time.

```js
import { createDeterministicGate } from './deterministic-quality-gate.js';

const { gateTask, reportTask } = createDeterministicGate({
  name: 'pre-merge',
  description: 'Pre-merge quality checks',
  commands: [
    { label: 'types', command: 'npx tsc --noEmit' },
    { label: 'lint', command: 'npx eslint src/ --max-warnings=0' },
    { label: 'test', command: 'npx vitest run' },
  ],
  failFast: false,
  timeout: 180000,
});

// Run the hard gate
const gateResult = await ctx.task(gateTask, {});

// If the gate failed, get an agent-generated diagnosis
if (gateResult.exitCode !== 0) {
  const report = await ctx.task(reportTask, { gateOutput: gateResult });
  // report contains: totalChecks, failedChecks, failures[], suggestions[], summary
}
```

The `gateTask` is `kind: 'shell'` (hard gate). The `reportTask` is `kind: 'agent'` (soft analysis of failures). This is the correct pairing: shell for pass/fail enforcement, agent for diagnosis after failure.

#### 3. `executeDeterministicGate(ctx, config)` -- Convenience Wrapper

Runs the gate, catches failures, parses structured output, and returns a result object. Does not throw on gate failure -- returns `{ passed: false, ... }` so the caller can decide how to proceed.

```js
import { executeDeterministicGate } from './deterministic-quality-gate.js';

const result = await executeDeterministicGate(ctx, {
  name: 'post-refactor',
  commands: [
    { label: 'compile', command: 'npx tsc --noEmit' },
    { label: 'lint', command: 'npx eslint src/ --max-warnings=0' },
    { label: 'test', command: 'npx vitest run' },
  ],
});

if (!result.passed) {
  console.log(`${result.failedCount}/${result.totalCount} checks failed:`);
  for (const check of result.results.filter(r => !r.passed)) {
    console.log(`  [FAIL] ${check.label}: exit code ${check.exitCode}`);
  }
}
```

**Return type (`DeterministicGateResult`):**
- `passed` -- Boolean. True when all checks passed.
- `results` -- Array of `{ label, command, exitCode, passed, output }` per check.
- `summary` -- Human-readable summary string.
- `failedCount` -- Number of failed checks.
- `totalCount` -- Total number of checks executed.

### Preset Factories

The module provides four preset factories that produce `DeterministicGateConfig` objects ready for `createDeterministicGate` or `executeDeterministicGate`.

#### `createGrepCheck(config)`

Converts grep-based pattern checks into gate commands. Each pattern becomes a `grep -r -l` command. Set `expectMatch: false` to assert a pattern does NOT appear (e.g., checking that debug statements are removed).

```js
import { createGrepCheck, executeDeterministicGate } from './deterministic-quality-gate.js';

const grepGate = createGrepCheck({
  patterns: [
    { label: 'Plugin registered', pattern: 'babysitter_local', file: 'AgentConfigForm.tsx' },
    { label: 'No console.log in prod', pattern: 'console\\.log', file: 'src/**/*.ts', expectMatch: false },
    { label: 'Has export', pattern: 'export default', file: 'src/index.ts' },
  ],
  projectDir: 'packages/adapter',
});

const result = await executeDeterministicGate(ctx, grepGate);
```

**Config:**
- `patterns` -- Array of `{ label, pattern, file, expectMatch? }`. Default `expectMatch` is `true`.
- `projectDir` -- Optional working directory.

#### `createCompilationGate(config)`

Builds gate commands for compilation tools. Supports `tsc` and `eslint` out of the box; any other string is treated as a raw command.

```js
import { createCompilationGate, executeDeterministicGate } from './deterministic-quality-gate.js';

const tsGate = createCompilationGate({
  tool: 'tsc',
  projectDir: 'packages/sdk',
  configPath: 'tsconfig.build.json',
  extraFlags: ['--strict'],
});

const eslintGate = createCompilationGate({
  tool: 'eslint',
  projectDir: 'packages/sdk',
  extraFlags: ['src/**/*.ts'],
});
```

**Config:**
- `tool` -- `'tsc'`, `'eslint'`, or a custom command string.
- `projectDir` -- Optional working directory.
- `configPath` -- Optional path to config file (tsconfig.json, .eslintrc, etc.).
- `extraFlags` -- Optional array of additional CLI flags.

#### `createTestSuiteGate(config)`

Builds gate commands for test runners. Supports `vitest`, `jest`, and `pytest` out of the box.

```js
import { createTestSuiteGate, executeDeterministicGate } from './deterministic-quality-gate.js';

const vitestGate = createTestSuiteGate({
  runner: 'vitest',
  projectDir: 'packages/sdk',
  testPattern: 'src/runtime/__tests__/',
  timeout: 180000,
});

const pytestGate = createTestSuiteGate({
  runner: 'pytest',
  projectDir: 'backend',
  testPattern: 'tests/unit/',
});
```

**Config:**
- `runner` -- `'vitest'`, `'jest'`, `'pytest'`, or a custom command string.
- `projectDir` -- Optional working directory.
- `testPattern` -- Optional test file pattern or path.
- `timeout` -- Optional timeout in ms (default: `300000`).

#### `createRuntimeSmokeTest(config)`

Builds a compound command that starts a server, waits for startup, probes a URL for an expected HTTP status code, and optionally stops the server.

```js
import { createRuntimeSmokeTest, executeDeterministicGate } from './deterministic-quality-gate.js';

const smokeTest = createRuntimeSmokeTest({
  startCommand: 'npm run dev &',
  testUrl: 'http://localhost:3000/api/health',
  expectedStatus: 200,
  stopCommand: 'kill %1 2>/dev/null || true',
  startupDelay: 5000,
});

const result = await executeDeterministicGate(ctx, smokeTest);
```

**Config:**
- `startCommand` -- Command to start the server.
- `testUrl` -- URL to probe.
- `expectedStatus` -- Expected HTTP status code (default: `200`).
- `stopCommand` -- Optional command to stop the server after the test.
- `startupDelay` -- Milliseconds to wait for server startup (default: `3000`).

---

## Examples (with actual shell commands)

### Grep-based integration checks

Verify that a component is properly registered, an import exists, or a config value is present:

```js
const result = await executeDeterministicGate(ctx, {
  name: 'integration-check',
  commands: [
    { label: 'Plugin registered in config', command: 'grep -r "babysitter_local" src/config/plugins.ts' },
    { label: 'Adapter exported from index', command: 'grep "export.*ClaudeLocalAdapter" src/index.ts' },
    { label: 'No TODO left in production code', command: 'grep -r "TODO" src/adapters/', expectedExitCode: 1 },
    { label: 'API key env var documented', command: 'grep "CLAUDE_API_KEY" .env.example' },
  ],
});
```

### TypeScript compilation gates

Verify the project compiles without type errors:

```js
const result = await executeDeterministicGate(ctx, {
  name: 'typescript-gate',
  commands: [
    { label: 'SDK compiles', command: 'cd packages/sdk && npx tsc --noEmit' },
    { label: 'Catalog compiles', command: 'cd packages/catalog && npx tsc --noEmit' },
  ],
  failFast: true,
});
```

Or using the dedicated `ts-check.js` shared component:

```js
import { executeTsCheck } from './ts-check.js';

const result = await executeTsCheck(ctx, {
  projectDir: 'packages/sdk',
  strict: true,
});

if (!result.passed) {
  for (const err of result.errors) {
    console.log(`  ${err.file}:${err.line} - ${err.code}: ${err.message}`);
  }
}
```

### Test suite gates

Run tests and enforce a passing suite:

```js
const result = await executeDeterministicGate(ctx, {
  name: 'test-gate',
  commands: [
    { label: 'Unit tests', command: 'cd packages/sdk && npx vitest run' },
    { label: 'E2E tests', command: 'npm run test:e2e:docker' },
  ],
  timeout: 600000,
});
```

### ESLint gates

Enforce zero warnings and zero errors:

```js
const result = await executeDeterministicGate(ctx, {
  name: 'lint-gate',
  commands: [
    { label: 'ESLint (SDK)', command: 'npm run lint --workspace=@a5c-ai/babysitter-sdk' },
    { label: 'ESLint (Catalog)', command: 'cd packages/catalog && npx eslint . --ext .ts,.tsx' },
  ],
});
```

### Runtime smoke tests

Start a server, verify it responds, then shut it down:

```js
const result = await executeDeterministicGate(ctx, {
  name: 'smoke-test',
  commands: [
    {
      label: 'API health endpoint',
      command: [
        'npm run dev &',
        'sleep 5',
        '_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)',
        'kill %1 2>/dev/null || true',
        'test "$_status" -eq 200',
      ].join(' && '),
    },
  ],
});
```

### Dependency availability checks

Verify that required packages can be imported at runtime:

```js
const result = await executeDeterministicGate(ctx, {
  name: 'dependency-check',
  commands: [
    { label: '@a5c-ai/babysitter-sdk', command: 'node -e "require(\'@a5c-ai/babysitter-sdk\')"' },
    { label: 'vitest available', command: 'npx vitest --version' },
    { label: 'tsc available', command: 'npx tsc --version' },
  ],
});
```

---

## Anti-patterns

### Using agent kind for compilation

**Wrong:**
```js
const checkTask = defineTask('check-types', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify TypeScript compiles',
  agent: {
    prompt: {
      task: 'Check if the TypeScript code in packages/sdk compiles without errors. Review the code and verify there are no type errors.',
    },
  },
}));
```

The agent will read some files, reason about types, and report its assessment. It will not run `tsc`. It will miss errors.

**Right:**
```js
const result = await executeDeterministicGate(ctx, {
  name: 'compile',
  commands: [{ label: 'tsc', command: 'cd packages/sdk && npx tsc --noEmit' }],
});
```

### Using agent kind for test execution

**Wrong:**
```js
const testTask = defineTask('run-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run the tests and check if they pass',
  agent: {
    prompt: {
      task: 'Run the test suite for packages/sdk and verify all tests pass. Report any failures.',
    },
  },
}));
```

The agent may or may not actually run the tests. If it does, it may misinterpret the output. If it doesn't, it will guess based on reading the test files.

**Right:**
```js
const result = await executeDeterministicGate(ctx, {
  name: 'tests',
  commands: [{ label: 'vitest', command: 'cd packages/sdk && npx vitest run' }],
});
```

### Using agent kind for grep

**Wrong:**
```js
const grepTask = defineTask('check-import', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Check if the function is imported in file X',
  agent: {
    prompt: {
      task: 'Check if ClaudeLocalAdapter is properly imported and registered in src/index.ts. Verify the import statement exists and the adapter is included in the exports.',
    },
  },
}));
```

The agent will read the file and apply its judgment. It may miss a subtle difference between `export { ClaudeLocalAdapter }` and `export default ClaudeLocalAdapter`.

**Right:**
```js
const result = await executeDeterministicGate(ctx, {
  name: 'import-check',
  commands: [{ label: 'adapter exported', command: 'grep "export.*ClaudeLocalAdapter" src/index.ts' }],
});
```

### The "soft gate" trap

The most insidious anti-pattern is a process that appears to have quality gates but actually delegates all verification to agent prompts:

```js
// ANTI-PATTERN: every "gate" is actually an agent prompt
async function process(inputs, ctx) {
  await ctx.task(implementFeatureTask, { spec: inputs.spec });
  await ctx.task(verifyTypesTask, {});        // kind: 'agent' -- "verify TypeScript compiles"
  await ctx.task(verifyTestsTask, {});        // kind: 'agent' -- "run tests and check they pass"
  await ctx.task(verifyLintTask, {});         // kind: 'agent' -- "check for lint errors"
  await ctx.task(verifyIntegrationTask, {});  // kind: 'agent' -- "verify the integration works"
  return { status: 'complete' };
}
```

This process has four "verification" steps that provide zero actual verification. The agent says "tests look good" without running them. Every single one of these should be a shell gate.

---

## Composing Gates in Processes

### Before: Soft gates everywhere

```js
import { defineTask } from '@a5c-ai/babysitter-sdk';

const implementTask = defineTask('implement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement the feature',
  agent: { prompt: { task: `Implement: ${args.spec}` } },
}));

const verifyTask = defineTask('verify', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify everything works',
  agent: {
    prompt: {
      task: 'Verify the implementation compiles, passes tests, passes lint, and the integration works correctly. Report any issues.',
    },
  },
}));

export async function process(inputs, ctx) {
  await ctx.task(implementTask, { spec: inputs.spec });
  await ctx.task(verifyTask, {});
  return { status: 'complete' };
}
```

Problems: The verify step is a single agent prompt that claims to check compilation, tests, lint, and integration. In practice, it reads some files and says "looks good."

### After: Hard shell gates with agent diagnosis on failure

```js
import { defineTask } from '@a5c-ai/babysitter-sdk';
import {
  executeDeterministicGate,
  createCompilationGate,
  createTestSuiteGate,
  createGrepCheck,
} from './shared/deterministic-quality-gate.js';

const implementTask = defineTask('implement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement the feature',
  agent: { prompt: { task: `Implement: ${args.spec}` } },
}));

const diagnoseTask = defineTask('diagnose', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Diagnose gate failures and suggest fixes',
  agent: {
    prompt: {
      task: 'Analyze these quality gate failures and suggest specific fixes.',
      context: { failures: args.failures },
    },
  },
}));

export async function process(inputs, ctx) {
  await ctx.task(implementTask, { spec: inputs.spec });

  // Hard gate: TypeScript compilation
  const compileResult = await executeDeterministicGate(ctx,
    createCompilationGate({ tool: 'tsc', projectDir: inputs.projectDir })
  );

  // Hard gate: ESLint
  const lintResult = await executeDeterministicGate(ctx,
    createCompilationGate({ tool: 'eslint', projectDir: inputs.projectDir, extraFlags: ['src/'] })
  );

  // Hard gate: Test suite
  const testResult = await executeDeterministicGate(ctx,
    createTestSuiteGate({ runner: 'vitest', projectDir: inputs.projectDir })
  );

  // Hard gate: Integration grep checks
  const integrationResult = await executeDeterministicGate(ctx,
    createGrepCheck({
      patterns: inputs.requiredPatterns.map(p => ({
        label: p.label,
        pattern: p.pattern,
        file: p.file,
      })),
      projectDir: inputs.projectDir,
    })
  );

  // Collect failures
  const allResults = [compileResult, lintResult, testResult, integrationResult];
  const failures = allResults.filter(r => !r.passed);

  if (failures.length > 0) {
    // Agent diagnosis is appropriate HERE -- after the hard gate has failed
    const diagnosis = await ctx.task(diagnoseTask, {
      failures: failures.map(f => ({ summary: f.summary, results: f.results })),
    });
    return { status: 'failed', failures, diagnosis };
  }

  return { status: 'complete' };
}
```

Key differences in the "after" version:
1. Every verification step is a shell command with a deterministic exit code.
2. Agent reasoning is used only for diagnosing failures after the hard gate catches them.
3. Each gate is independently named and labeled, making failures easy to trace.
4. The `executeDeterministicGate` wrapper never throws on gate failure -- it returns `{ passed: false }` so the process can collect all failures before deciding what to do.

### Fix-and-retry loop pattern

For iterative convergence processes, combine hard gates with agent fix tasks in a loop:

```js
const MAX_FIX_ATTEMPTS = 3;

for (let attempt = 0; attempt < MAX_FIX_ATTEMPTS; attempt++) {
  const gateResult = await executeDeterministicGate(ctx, {
    name: `iteration-${attempt}`,
    commands: [
      { label: 'compile', command: 'npx tsc --noEmit' },
      { label: 'lint', command: 'npx eslint src/ --max-warnings=0' },
      { label: 'test', command: 'npx vitest run' },
    ],
  });

  if (gateResult.passed) {
    return { status: 'complete', attempts: attempt + 1 };
  }

  // Agent fix task -- agent reasoning is appropriate for "how to fix this"
  await ctx.task(fixTask, {
    failures: gateResult.results.filter(r => !r.passed),
    attempt,
  });
}

// If we exhaust attempts, request human intervention
const approval = await ctx.breakpoint({
  title: 'Quality gate failed after max attempts',
  message: `Failed to pass quality gates after ${MAX_FIX_ATTEMPTS} attempts.`,
});
```

The shell gate is the source of truth. The agent fixes. The shell gate verifies the fix. This loop cannot pass without the code actually compiling, passing lint, and passing tests.
