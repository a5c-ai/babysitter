# Process Definitions: JavaScript Workflow Orchestration

**Version:** 1.1
**Last Updated:** 2026-01-26
**Category:** Feature Guide

---

## In Plain English

**A process is a recipe that tells Babysitter what to do.**

Just like a cooking recipe says "chop vegetables, then cook them, then serve" - a process says "research the codebase, then write tests, then implement, then verify."

**You don't need to write processes to use Babysitter.** The [Process Library](./process-library.md) has 2,000+ pre-built processes ready to use.

**When would you write a process?**
- You have a specific workflow your team follows
- The pre-built processes don't match your needs
- You want to customize how quality gates work

**Tip for beginners:** Start with pre-built processes. Once you're comfortable, come back here to learn how to create your own.

---

## Overview

Process definitions are JavaScript functions that orchestrate workflows in Babysitter. A process defines what tasks to execute, in what order, and how to handle results. The process function acts as the "brain" of your workflow, making decisions and coordinating execution while Babysitter handles state management, persistence, and resumability.

### Why Use Process Definitions

- **Deterministic Execution**: Same inputs and journal produce the same execution path
- **Full JavaScript Power**: Use loops, conditionals, and async/await for complex logic
- **Modular Design**: Define reusable tasks and compose them into workflows
- **Event-Sourced**: All state changes recorded for replay and debugging
- **Resumable**: Workflows automatically resume from where they left off

---

## Use Cases and Scenarios

### Scenario 1: Simple Build and Test Pipeline

A basic process that builds and tests a project.

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  // Build the project
  const buildResult = await ctx.task(buildTask, { target: inputs.target });

  // Run tests
  const testResult = await ctx.task(testTask, { suite: 'unit' });

  // Return results
  return {
    success: buildResult.success && testResult.success,
    build: buildResult,
    tests: testResult
  };
}

const buildTask = defineTask('build', (args, taskCtx) => ({
  kind: 'node',
  title: `Build ${args.target}`,
  node: {
    entry: 'scripts/build.js',
    args: ['--target', args.target]
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

const testTask = defineTask('test', (args, taskCtx) => ({
  kind: 'node',
  title: `Run ${args.suite} tests`,
  node: {
    entry: 'scripts/test.js',
    args: ['--suite', args.suite]
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
```

### Scenario 2: CI Pipeline with Conditional Steps

A more complex pipeline with parallel execution and conditional logic.

```javascript
export async function process(inputs, ctx) {
  // Build first
  const buildResult = await ctx.task(buildTask, { target: 'app' });

  // Run lint and tests in parallel
  const [lintResult, testResult] = await ctx.parallel.all([
    () => ctx.task(lintTask, { files: buildResult.files }),
    () => ctx.task(testTask, { suite: 'smoke' })
  ]);

  // Conditional: request approval if issues found
  if (!lintResult.ok || !testResult.ok) {
    await ctx.breakpoint({
      question: 'Lint/tests failed. Continue anyway?',
      title: 'Quality Gate',
      context: {
        runId: ctx.runId,
        files: [{ path: 'artifacts/quality-report.md', format: 'markdown' }]
      }
    });
  }

  // Agent-based code review
  const review = await ctx.task(codeReviewAgentTask, { diffRef: buildResult.diffRef });

  return { success: true, review: review.summary };
}
```

### Scenario 3: Multi-Phase Feature Development

A comprehensive workflow with research, planning, implementation, and verification phases.

```javascript
export async function process(inputs, ctx) {
  const { feature, targetQuality = 85, maxIterations = 5 } = inputs;

  // Phase 1: Research
  const research = await ctx.task(researchTask, { feature });

  // Phase 2: Planning
  const plan = await ctx.task(planningTask, { feature, research });

  // Breakpoint: Approve plan
  await ctx.breakpoint({
    question: `Review plan for "${feature}". Approve to proceed?`,
    title: 'Plan Review',
    context: { runId: ctx.runId, files: [{ path: 'artifacts/plan.md', format: 'markdown' }] }
  });

  // Phase 3: Implementation with quality convergence
  let iteration = 0;
  let quality = 0;

  while (iteration < maxIterations && quality < targetQuality) {
    iteration++;

    const impl = await ctx.task(implementTask, { feature, plan, iteration });
    const score = await ctx.task(scoreQualityTask, { impl });

    quality = score.overall;
    ctx.log(`Iteration ${iteration}: Quality ${quality}/${targetQuality}`);
  }

  // Phase 4: Final verification
  await ctx.breakpoint({
    question: `Quality: ${quality}. Approve for merge?`,
    title: 'Final Approval'
  });

  return { success: quality >= targetQuality, iterations: iteration, quality };
}
```

---

## Step-by-Step Instructions

### Step 1: Create the Process File

Create a JavaScript file with an exported `process` function.

**Location:** `.a5c/runs/<runId>/code/main.js` or a custom path

```javascript
// main.js
export async function process(inputs, ctx) {
  // Your workflow logic here
  return { success: true };
}
```

### Step 2: Define Tasks

Tasks are the building blocks of your workflow. Define them using `defineTask`.

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

export const myTask = defineTask('my-task', (args, taskCtx) => ({
  kind: 'node',
  title: `Execute ${args.action}`,
  node: {
    entry: 'scripts/my-script.js',
    args: ['--action', args.action]
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
```

### Step 3: Use the Process Context

The `ctx` object provides intrinsics for orchestration.

```javascript
export async function process(inputs, ctx) {
  // Execute a task
  const result = await ctx.task(myTask, { action: 'build' });

  // Request human approval
  await ctx.breakpoint({ question: 'Approve?' });

  // Sleep until a specific time
  await ctx.sleepUntil('2026-01-26T09:00:00.000Z');

  // Execute tasks in parallel
  const [a, b] = await ctx.parallel.all([
    () => ctx.task(taskA, {}),
    () => ctx.task(taskB, {})
  ]);

  // Log to the journal
  ctx.log('Workflow completed', { result });

  // Get current time (deterministic)
  const now = ctx.now();

  return { success: true };
}
```

### Step 4: Create a Run

Use the CLI to create a run with your process.

```bash
babysitter run:create \
  --process-id my-workflow \
  --entry ./code/main.js#process \
  --inputs ./inputs.json \
  --run-id "run-$(date -u +%Y%m%d-%H%M%S)"
```

### Step 5: Execute the Run

Use the babysitter skill or CLI to drive execution.

```bash
# Via skill
claude "/babysit run my-workflow"

# Via CLI iteration loop
while true; do
  RESULT=$(babysitter run:iterate "$RUN_ID" --json)
  STATUS=$(echo "$RESULT" | jq -r '.status')
  [ "$STATUS" = "completed" ] && break
  [ "$STATUS" = "failed" ] && exit 1
done
```

---

## Configuration Options

### Process Function Signature

```javascript
async function process(inputs, ctx) {
  // inputs: Object - Initial inputs passed to the run
  // ctx: ProcessContext - Orchestration intrinsics
  // returns: any - Final output of the process
}
```

### Task Definition Schema

```javascript
defineTask<TArgs, TResult>(id: string, impl: TaskImpl<TArgs>): DefinedTask<TArgs, TResult>
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `kind` | string | Yes | Task type: `node`, `shell`, `agent`, `breakpoint` |
| `title` | string | No | Human-readable title |
| `description` | string | No | Detailed description |
| `node.entry` | string | Yes (for node) | Path to Node.js script |
| `node.args` | string[] | No | Command-line arguments |
| `node.env` | object | No | Environment variables |
| `node.cwd` | string | No | Working directory |
| `node.timeout` | number | No | Timeout in milliseconds |
| `shell.command` | string | Yes (for shell) | Shell command to execute |
| `agent.name` | string | Yes (for agent) | Agent name |
| `agent.prompt` | object | Yes (for agent) | Agent prompt configuration |
| `io.inputJsonPath` | string | No | Path for input JSON |
| `io.outputJsonPath` | string | No | Path for output JSON |
| `labels` | string[] | No | Labels for categorization |

### Process Context Intrinsics

| Method | Description |
|--------|-------------|
| `ctx.task(taskDef, args, options?)` | Execute a task |
| `ctx.breakpoint(payload)` | Request human approval |
| `ctx.sleepUntil(timestamp)` | Sleep until a specific time |
| `ctx.parallel.all(thunks)` | Execute tasks in parallel |
| `ctx.parallel.map(items, fn)` | Map items to parallel tasks |
| `ctx.log(...args)` | Log to the journal |
| `ctx.now()` | Get current time (deterministic) |
| `ctx.runId` | The current run ID |

---

## Code Examples and Best Practices

### Example 1: Node Task Definition

```javascript
export const buildTask = defineTask('build', (args, taskCtx) => ({
  kind: 'node',
  title: `Build ${args.target}`,
  description: 'Compile and bundle the application',
  node: {
    entry: 'scripts/build.js',
    args: ['--target', args.target, '--effect-id', taskCtx.effectId],
    env: { NODE_ENV: 'production' },
    timeout: 300000  // 5 minutes
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['build', 'production']
}));
```

### Example 2: Shell Task Definition

```javascript
export const lintTask = defineTask('lint', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Run linter',
  description: 'Check code style and common issues',
  shell: {
    command: `npx eslint ${args.files.join(' ')} --format json --output-file tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quality', 'lint']
}));
```

### Example 3: Agent Task Definition

```javascript
export const codeReviewAgentTask = defineTask('code-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'AI Code Review',
  description: 'LLM-based code review',
  agent: {
    name: 'code-reviewer',
    prompt: {
      role: 'senior software engineer',
      task: 'Review the code changes and provide feedback',
      context: {
        diffRef: args.diffRef
      },
      instructions: [
        'Check for bugs and security issues',
        'Review code quality and style',
        'Suggest improvements'
      ],
      outputFormat: 'JSON with summary, issues, and suggestions'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'issues'],
      properties: {
        summary: { type: 'string' },
        issues: { type: 'array', items: { type: 'object' } },
        suggestions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'code-review']
}));
```

### Example 4: Error Handling in Processes

```javascript
export async function process(inputs, ctx) {
  try {
    const result = await ctx.task(riskyTask, { data: inputs.data });
    return { success: true, result };
  } catch (error) {
    // Log the error
    ctx.log('Task failed', { error: error.message });

    // Request human intervention
    await ctx.breakpoint({
      question: `Task failed: ${error.message}. How to proceed?`,
      title: 'Error Recovery',
      context: {
        runId: ctx.runId,
        files: [{ path: 'artifacts/error-details.json', format: 'code', language: 'json' }]
      }
    });

    // Retry with different parameters
    const retryResult = await ctx.task(riskyTask, { data: inputs.data, retryMode: true });
    return { success: true, result: retryResult, retried: true };
  }
}
```

### Example 5: Dynamic Task Selection

```javascript
export async function process(inputs, ctx) {
  const { taskType, config } = inputs;

  // Select task based on input
  let taskDef;
  switch (taskType) {
    case 'build':
      taskDef = buildTask;
      break;
    case 'test':
      taskDef = testTask;
      break;
    case 'deploy':
      taskDef = deployTask;
      break;
    default:
      throw new Error(`Unknown task type: ${taskType}`);
  }

  const result = await ctx.task(taskDef, config);
  return result;
}
```

### Best Practices

1. **Keep Processes Deterministic**: Avoid random values or non-deterministic operations; use `ctx.now()` for timestamps
2. **Use Descriptive Task IDs**: Task IDs should clearly indicate what the task does
3. **Handle Errors Gracefully**: Implement error handling and recovery strategies
4. **Break Complex Workflows into Phases**: Structure processes with clear phases for readability
5. **Document Process Purpose**: Add comments explaining the workflow logic
6. **Use Labels for Categorization**: Tag tasks with labels for filtering and organization
7. **Separate Task Definitions**: Keep task definitions in separate files for reusability

---

## Common Pitfalls and Troubleshooting

### Pitfall 1: Non-Deterministic Process Code

**Symptom:** Process behaves differently on resume.

**Cause:** Using non-deterministic values.

**Wrong:**
```javascript
const timestamp = Date.now();  // Non-deterministic
const id = Math.random().toString(36);  // Non-deterministic
```

**Correct:**
```javascript
const timestamp = ctx.now().getTime();  // Deterministic
const id = `task-${ctx.runId}-${iteration}`;  // Deterministic
```

### Pitfall 2: Missing Input/Output Paths

**Symptom:** Task results not persisted or not found on resume.

**Cause:** Missing `io` configuration.

**Solution:**
```javascript
defineTask('my-task', (args, taskCtx) => ({
  kind: 'node',
  node: { entry: 'scripts/task.js' },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,   // Add this
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`  // Add this
  }
}));
```

### Pitfall 3: Process Code Changed Between Iterations

**Symptom:** Replay produces different results.

**Cause:** Process code modified after run started.

**Solution:**
- Avoid modifying process code for in-progress runs
- The SDK stores `processRevision` to detect changes
- Create a new run if workflow logic needs to change

### Pitfall 4: Task Function Not Exported

**Symptom:** `ReferenceError: task is not defined`

**Cause:** Task function not exported or imported incorrectly.

**Solution:**
```javascript
// In tasks.js
export const myTask = defineTask('my-task', ...);

// In main.js
import { myTask } from './tasks.js';

export async function process(inputs, ctx) {
  const result = await ctx.task(myTask, { /* args */ });
}
```

### Pitfall 5: Incorrect Entry Point Syntax

**Symptom:** `Error: Cannot find module`

**Cause:** Incorrect entry point format in run:create.

**Correct syntax:**
```bash
--entry ./code/main.js#process
       ^              ^
       path           export name (after #)
```

---

## Related Documentation

- [Quality Convergence](./quality-convergence.md) - Implement iterative improvement loops
- [Parallel Execution](./parallel-execution.md) - Run tasks concurrently
- [Breakpoints](./breakpoints.md) - Add human approval gates
- [Journal System](./journal-system.md) - Understand event sourcing
- [Best Practices](./best-practices.md) - Patterns for process structure, error handling, idempotency, and testing
- [Process Library](./process-library.md) - 2,000+ ready-to-use process definitions

---

## Pre-Built Workflows: Methodologies & Processes

**Don't start from scratch!** Babysitter includes thousands of ready-to-use workflows:

### Methodologies (19+) - Development Approaches

High-level approaches you can apply to any project:

- **TDD Quality Convergence** - Test-first with iterative quality improvement
- **GSD (Get Stuff Done)** - Rapid 8-phase execution workflow
- **Spec-Kit** - Specification-driven with governance
- **Domain-Driven Design** - Strategic and tactical DDD patterns
- And 15+ more...

**Browse methodologies:**
- [All 19+ with source code](../reference/glossary.md#methodology)
- [Methodologies folder](../../../plugins/babysitter/skills/babysit/process/methodologies/)

### Domain Processes (2,000+) - Task-Specific Workflows

Complete process definitions for specific domains:

| Domain | Processes | Browse |
|--------|-----------|--------|
| **Development** | 680+ | [specializations/](../../../plugins/babysitter/skills/babysit/process/specializations/) |
| **Business** | 430+ | [domains/business/](../../../plugins/babysitter/skills/babysit/process/specializations/domains/business/) |
| **Science & Engineering** | 550+ | [domains/science/](../../../plugins/babysitter/skills/babysit/process/specializations/domains/science/) |

See the full catalog with descriptions in the [Process Library](./process-library.md).

---

## Summary

Process definitions are JavaScript functions that orchestrate workflows. Define reusable tasks, compose them with conditionals and loops, and let Babysitter handle state management. Keep processes deterministic for reliable replay and resumption. Use the full power of JavaScript while benefiting from event-sourced persistence.
