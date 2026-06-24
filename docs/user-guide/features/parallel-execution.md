[Docs](../index.md) › [Features](./index.md) › Parallel Execution

# Parallel Execution: Running Tasks Concurrently

**Version:** 1.1
**Last Updated:** 2026-01-26
**Category:** Feature Guide

---

## In Plain English

**Parallel execution means doing multiple things at the same time instead of one after another.**

Think of it like cooking: instead of waiting for the water to boil, THEN chopping vegetables, THEN preheating the oven - you do all three at once. Much faster!

**Example in Babysitter:**
- Without parallel: Run tests (30s) → Run linter (20s) → Check security (15s) = **65 seconds total**
- With parallel: Run all three at once = **30 seconds total** (just the slowest one)

**Do you need this as a beginner?** Not really - Babysitter handles this automatically in most pre-built [processes](../reference/glossary.md). This doc is for when you're building custom processes and want to optimize speed.

---

## On this page

- [Overview](#overview)
- [Use Cases and Scenarios](#use-cases-and-scenarios)
- [Step-by-Step Instructions](#step-by-step-instructions)
- [Configuration Options](#configuration-options)
- [Code Examples and Best Practices](#code-examples-and-best-practices)
- [Common Pitfalls and Troubleshooting](#common-pitfalls-and-troubleshooting)

---

## Overview

Parallel execution enables running multiple independent tasks concurrently within a Babysitter workflow. Instead of executing tasks sequentially, parallel execution dispatches multiple tasks simultaneously and waits for all to complete. This significantly reduces total execution time for workflows with independent operations.

### Why Use Parallel Execution

- **Faster Workflows**: Execute independent tasks simultaneously instead of sequentially
- **Resource Efficiency**: Maximize utilization of available compute resources
- **Optimized Quality Checks**: Run lint, test, coverage, and security checks in parallel
- **Batch Processing**: Process multiple items concurrently with `parallel.map`
- **Maintained Determinism**: Results remain deterministic despite parallel execution

---

## Use Cases and Scenarios

### Scenario 1: Parallel Quality Checks

Run multiple quality checks simultaneously after implementation.

```javascript
export async function process(inputs, ctx) {
  const impl = await ctx.task(implementTask, { feature: inputs.feature });

  // Run all quality checks in parallel
  const [coverageResult, lintResult, typeCheckResult, securityResult] = await ctx.parallel.all([
    () => ctx.task(coverageTask, { testFiles: impl.testFiles }),
    () => ctx.task(lintTask, { files: impl.filesModified }),
    () => ctx.task(typeCheckTask, { files: impl.filesModified }),
    () => ctx.task(securityTask, { files: impl.filesModified })
  ]);

  return {
    coverage: coverageResult,
    lint: lintResult,
    typeCheck: typeCheckResult,
    security: securityResult
  };
}
```

**Time savings:**
- Sequential: ~20 seconds (5s + 5s + 5s + 5s)
- Parallel: ~5 seconds (all run simultaneously)

### Scenario 2: Batch File Processing

Process multiple files concurrently using `parallel.map`.

```javascript
export async function process(inputs, ctx) {
  const files = inputs.files;  // ['file1.ts', 'file2.ts', 'file3.ts', ...]

  // Process all files in parallel
  const results = await ctx.parallel.map(files, file =>
    ctx.task(processFileTask, { file })
  );

  return { processed: results.length, results };
}
```

### Scenario 3: Multi-Service Deployment

Deploy to multiple services concurrently.

```javascript
export async function process(inputs, ctx) {
  const services = ['api', 'web', 'worker'];

  // Deploy all services in parallel
  const deployResults = await ctx.parallel.all([
    () => ctx.task(deployTask, { service: 'api', env: inputs.env }),
    () => ctx.task(deployTask, { service: 'web', env: inputs.env }),
    () => ctx.task(deployTask, { service: 'worker', env: inputs.env })
  ]);

  const success = deployResults.every(r => r.success);
  return { success, deployments: deployResults };
}
```

### Scenario 4: Mixed Sequential and Parallel

Combine sequential dependencies with parallel execution.

```javascript
export async function process(inputs, ctx) {
  // Sequential: Build must complete first
  const buildResult = await ctx.task(buildTask, { target: 'app' });

  // Parallel: These can run concurrently after build
  const [testResult, e2eResult, docResult] = await ctx.parallel.all([
    () => ctx.task(unitTestTask, { files: buildResult.files }),
    () => ctx.task(e2eTestTask, { url: buildResult.previewUrl }),
    () => ctx.task(generateDocsTask, { files: buildResult.files })
  ]);

  // Sequential: Deployment depends on tests passing
  if (testResult.success && e2eResult.success) {
    const deployResult = await ctx.task(deployTask, { build: buildResult });
    return { deployed: true, deployResult };
  }

  return { deployed: false, reason: 'Tests failed' };
}
```

---

## Step-by-Step Instructions

### Step 1: Identify Independent Tasks

Analyze your workflow to identify tasks that:
- Do not depend on each other's results
- Can execute in any order
- Access different resources or have read-only access

**Independent (can parallelize):**
- Running lint and tests on the same files
- Processing multiple independent files
- Checking multiple quality metrics

**Dependent (must be sequential):**
- Building before testing
- Creating a database before seeding it
- Writing a file before reading it

### Step 2: Use ctx.parallel.all

Replace sequential calls with `ctx.parallel.all` for independent tasks.

**Before (sequential):**
```javascript
const lintResult = await ctx.task(lintTask, { files });
const testResult = await ctx.task(testTask, { files });
const coverageResult = await ctx.task(coverageTask, { files });
// Total time: sum of all task durations
```

**After (parallel):**
```javascript
const [lintResult, testResult, coverageResult] = await ctx.parallel.all([
  () => ctx.task(lintTask, { files }),
  () => ctx.task(testTask, { files }),
  () => ctx.task(coverageTask, { files })
]);
// Total time: duration of longest task
```

### Step 3: Use ctx.parallel.map for Collections

Process arrays of items concurrently.

```javascript
const files = ['a.ts', 'b.ts', 'c.ts', 'd.ts'];

// Process all files in parallel
const results = await ctx.parallel.map(files, file =>
  ctx.task(processFileTask, { file })
);
```

### Step 4: Handle Results

Parallel execution returns results in the same order as input thunks.

```javascript
const [first, second, third] = await ctx.parallel.all([
  () => ctx.task(taskA, {}),  // first = result of taskA
  () => ctx.task(taskB, {}),  // second = result of taskB
  () => ctx.task(taskC, {})   // third = result of taskC
]);
```

---

## Configuration Options

### ctx.parallel.all

Execute multiple thunks in parallel and wait for all to complete.

```javascript
ctx.parallel.all<T>(thunks: Array<() => T | Promise<T>>): Promise<T[]>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `thunks` | `Array<() => T>` | Array of functions that return tasks |

**Returns:** `Promise<T[]>` - Array of results in the same order as input

### ctx.parallel.map

Map items to tasks and execute in parallel.

```javascript
ctx.parallel.map<TItem, TOut>(
  items: TItem[],
  fn: (item: TItem) => TOut | Promise<TOut>
): Promise<TOut[]>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `items` | `TItem[]` | Array of items to process |
| `fn` | `(item: TItem) => TOut` | Function mapping item to task |

**Returns:** `Promise<TOut[]>` - Array of results in the same order as input

---

## Code Examples and Best Practices

### Example 1: Parallel Quality Checks in TDD Workflow

```javascript
export async function process(inputs, ctx) {
  const { feature, targetQuality = 85, maxIterations = 5 } = inputs;

  let iteration = 0;
  let quality = 0;

  while (iteration < maxIterations && quality < targetQuality) {
    iteration++;

    // Sequential: Tests must run first
    const tests = await ctx.task(writeTestsTask, { feature, iteration });
    const impl = await ctx.task(implementTask, { tests, iteration });
    const testResults = await ctx.task(runTestsTask, { testFiles: tests.testFiles });

    // Parallel: Quality checks are independent
    const [coverage, lint, typeCheck, security] = await ctx.parallel.all([
      () => ctx.task(coverageCheckTask, { testFiles: tests.testFiles }),
      () => ctx.task(lintCheckTask, { files: impl.filesModified }),
      () => ctx.task(typeCheckTask, { files: impl.filesModified }),
      () => ctx.task(securityCheckTask, { files: impl.filesModified })
    ]);

    // Sequential: Scoring depends on all quality checks
    const score = await ctx.task(agentScoringTask, {
      tests,
      testResults,
      implementation: impl,
      qualityChecks: { coverage, lint, typeCheck, security }
    });

    quality = score.overallScore;
  }

  return { quality, iterations: iteration };
}
```

### Example 2: Parallel File Processing with Error Handling

```javascript
export async function process(inputs, ctx) {
  const files = inputs.files;

  // Process files in parallel
  const results = await ctx.parallel.map(files, async file => {
    try {
      const result = await ctx.task(processFileTask, { file });
      return { file, success: true, result };
    } catch (error) {
      // Individual failures don't stop other tasks
      return { file, success: false, error: error.message };
    }
  });

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  ctx.log(`Processed ${successful.length}/${files.length} files`);

  return { successful, failed };
}
```

### Example 3: Chunked Parallel Processing

Process large batches in chunks to limit concurrency.

```javascript
export async function process(inputs, ctx) {
  const items = inputs.items;
  const chunkSize = 10;  // Process 10 items at a time

  const results = [];

  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);

    // Process chunk in parallel
    const chunkResults = await ctx.parallel.map(chunk, item =>
      ctx.task(processItemTask, { item })
    );

    results.push(...chunkResults);
    ctx.log(`Processed ${Math.min(i + chunkSize, items.length)}/${items.length} items`);
  }

  return { total: results.length, results };
}
```

### Example 4: Parallel Final Verification

```javascript
export async function process(inputs, ctx) {
  // ... implementation phases ...

  // Final parallel verification checks
  const [finalTestResult, finalCoverageResult, integrationTestResult] = await ctx.parallel.all([
    () => ctx.task(runTestsTask, { testFiles: iterationResults[iteration - 1].tests.testFiles }),
    () => ctx.task(coverageCheckTask, { testFiles: iterationResults[iteration - 1].tests.testFiles }),
    () => ctx.task(integrationTestTask, { feature })
  ]);

  // Agent-based final review using all parallel results
  const finalReview = await ctx.task(agentFinalReviewTask, {
    feature,
    finalTests: finalTestResult,
    finalCoverage: finalCoverageResult,
    integrationTests: integrationTestResult
  });

  return { finalReview };
}
```

### Best Practices

1. **Only Parallelize Independent Tasks**: Ensure tasks do not have data dependencies
2. **Use Thunks (Arrow Functions)**: Wrap task calls in `() =>` to defer execution
3. **Order Results Match Input Order**: Results array preserves the order of input thunks
4. **Handle Individual Failures**: Consider try-catch within parallel.map for graceful degradation
5. **Limit Concurrency for Large Batches**: Process in chunks to avoid overwhelming resources
6. **Log Progress**: For long-running parallel operations, log progress periodically
7. **Combine with Sequential When Needed**: Use parallel for independent work, sequential for dependencies

---

## Common Pitfalls and Troubleshooting

### Pitfall 1: Forgetting Thunk Wrappers

**Symptom:** Tasks execute immediately instead of in parallel.

**Wrong:**
```javascript
// Tasks execute immediately, not in parallel!
const results = await ctx.parallel.all([
  ctx.task(taskA, {}),  // Executes immediately
  ctx.task(taskB, {}),  // Executes immediately
  ctx.task(taskC, {})   // Executes immediately
]);
```

**Correct:**
```javascript
// Tasks are deferred until parallel.all processes them
const results = await ctx.parallel.all([
  () => ctx.task(taskA, {}),  // Wrapped in thunk
  () => ctx.task(taskB, {}),  // Wrapped in thunk
  () => ctx.task(taskC, {})   // Wrapped in thunk
]);
```

### Pitfall 2: Parallelizing Dependent Tasks

**Symptom:** Race conditions or undefined results.

**Wrong:**
```javascript
// taskB depends on taskA's result!
const [a, b] = await ctx.parallel.all([
  () => ctx.task(taskA, {}),
  () => ctx.task(taskB, { input: a })  // 'a' is undefined here!
]);
```

**Correct:**
```javascript
// Sequential for dependent tasks
const a = await ctx.task(taskA, {});
const b = await ctx.task(taskB, { input: a });
```

### Pitfall 3: One Failure Stops All

**Symptom:** If one parallel task fails, all results are lost.

**Default behavior:**
```javascript
// If any task throws, the entire parallel.all fails
const results = await ctx.parallel.all([
  () => ctx.task(taskA, {}),
  () => ctx.task(taskB, {}),  // If this fails...
  () => ctx.task(taskC, {})   // ... we lose taskA and taskC results too
]);
```

**Solution - Handle errors individually:**
```javascript
const results = await ctx.parallel.map(['A', 'B', 'C'], async id => {
  try {
    return { id, success: true, result: await ctx.task(getTask(id), {}) };
  } catch (error) {
    return { id, success: false, error: error.message };
  }
});
```

### Pitfall 4: Result Order Confusion

**Symptom:** Results don't match expected tasks.

**Remember:** Results are always in the same order as input thunks.

```javascript
const [first, second, third] = await ctx.parallel.all([
  () => ctx.task(slowTask, {}),   // Takes 10s, but 'first' = its result
  () => ctx.task(fastTask, {}),   // Takes 1s, but 'second' = its result
  () => ctx.task(mediumTask, {})  // Takes 5s, but 'third' = its result
]);

// Order is preserved regardless of completion time
// first = slowTask result
// second = fastTask result
// third = mediumTask result
```

### Pitfall 5: Too Many Parallel Tasks

**Symptom:** Resource exhaustion, timeouts, or throttling.

**Cause:** Starting hundreds of tasks simultaneously.

**Solution:** Chunk large batches:

```javascript
const items = Array.from({ length: 1000 }, (_, i) => i);
const chunkSize = 50;

for (let i = 0; i < items.length; i += chunkSize) {
  const chunk = items.slice(i, i + chunkSize);
  await ctx.parallel.map(chunk, item => ctx.task(processTask, { item }));
}
```

---

## Related Documentation

- [Process Definitions](./process-definitions.md) - Learn how to structure workflows
- [Quality Convergence](./quality-convergence.md) - Parallel checks in TDD loops
- [Journal System](./journal-system.md) - How parallel tasks are recorded

---

## Summary

Parallel execution dramatically reduces workflow duration by running independent tasks concurrently. Use `ctx.parallel.all` for fixed sets of tasks and `ctx.parallel.map` for processing collections. Remember to wrap task calls in thunks, only parallelize independent operations, and handle errors gracefully. For large batches, process in chunks to manage resource utilization.

---

## Next steps

- **Next:** [Process Definitions](./process-definitions.md)
- **Related:** [Quality Convergence](./quality-convergence.md), [Best Practices](./best-practices.md)
