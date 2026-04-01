# Architecture Overview

**Version:** 1.0
**Last Updated:** 2026-01-31
**Category:** Feature Guide

---

## In Plain English

**Babysitter is built in layers, like a well-organized office.**

Think of it like this:
- **The Plugin** is the receptionist - it takes your requests and routes them to the right department
- **The SDK** is the operations team - it actually does the work
- **The Journal** is the filing cabinet - it keeps a record of everything
- **The AskUserQuestion Tool** is the approval desk - it pauses for human review when needed

**Tip for beginners:** You don't need to understand the architecture to use Babysitter. This document is for those who want to understand how it works under the hood, or who are building custom processes.

**Related:** For the conceptual model of how orchestration and AI work together, see [Two-Loops Architecture](./two-loops-architecture.md).

---

## Overview

Babysitter uses a modular architecture designed for reliability, debuggability, and extensibility. The system combines a deterministic orchestration engine with adaptive AI capabilities, all backed by an event-sourced persistence layer.

---

## High-Level Architecture

```
+-----------------------------------------------------------------+
|  Claude Code Session                                             |
|  +-----------------------------------------------------------+  |
|  |  Babysitter Skill (orchestrates via CLI)                  |  |
|  +-----------------------------------------------------------+  |
|                           |                                      |
|                           v                                      |
|  +-----------------------------------------------------------+  |
|  |  .a5c/runs/<runId>/                                       |  |
|  |  +-- run.json        (run metadata)                       |  |
|  |  +-- inputs.json     (run inputs)                         |  |
|  |  +-- code/           (process code)                       |  |
|  |  +-- artifacts/      (output artifacts)                   |  |
|  |  +-- journal/        (event log, individual JSON files)   |  |
|  |  +-- state/state.json (current state)                     |  |
|  |  +-- tasks/<effectId>/ (task artifacts)                   |  |
|  +-----------------------------------------------------------+  |
|                           |                                      |
|                           v                                      |
|  +-----------------------------------------------------------+  |
|  |  AskUserQuestion Tool (human approval)                     |  |
|  +-----------------------------------------------------------+  |
+-----------------------------------------------------------------+
```

---

## Core Components

### 1. Babysitter Skill Plugin

**Location:** `plugins/babysitter/skills/babysit/`

**Responsibilities:**
- Parses natural language commands into process inputs
- Orchestrates the run loop via SDK CLI
- Manages iteration lifecycle
- Handles resumption from saved state
- Reports progress to Claude Code

**Technology:** Claude Code Plugin System (JavaScript)

---

### 2. Babysitter SDK

**Package:** `@a5c-ai/babysitter-sdk`

**Core Modules:**

| Module | Purpose | Key Functions |
|--------|---------|--------------|
| **Process Engine** | Executes process definitions | `runProcess()`, `iterate()` |
| **Journal Manager** | Event-sourced persistence | `append()`, `replay()`, `getState()` |
| **Task Executor** | Runs tasks (agent, skill, node) | `executeTask()`, `parallel.all()` |
| **State Manager** | Maintains run state cache | `saveState()`, `loadState()` |
| **Hook System** | Extensibility points | `registerHook()`, `trigger()` |

**Technology:** Node.js, TypeScript

---

### 3. Event-Sourced Journal

**Format:** Individual JSON files in `journal/` directory, one per event, named `{SEQ}.{ULID}.json` (e.g. `000001.01ARZ3NDEKTSV4RRFFQ69G5FAV.json`)

**Event Types:**

```typescript
type JournalEvent =
  | { type: 'RUN_CREATED', recordedAt: string, data: { runId: string, inputs: any }, checksum: string }
  | { type: 'EFFECT_REQUESTED', recordedAt: string, data: { effectId: string, kind: string, args: any }, checksum: string }
  | { type: 'EFFECT_RESOLVED', recordedAt: string, data: { effectId: string, result: any }, checksum: string }
  | { type: 'RUN_COMPLETED', recordedAt: string, data: { status: string }, checksum: string }
  | { type: 'RUN_FAILED', recordedAt: string, data: { error: string }, checksum: string }

// Note: seq is derived from the filename, not stored in the event body.
// Breakpoints use EFFECT_REQUESTED with kind: 'breakpoint' and EFFECT_RESOLVED.
```

**Benefits:**
- **Deterministic replay**: Reconstruct exact state at any point
- **Audit trail**: Complete history of all actions
- **Debugging**: Trace execution flow and identify issues
- **Resumability**: Continue from last event after interruption

**Implementation:**
```javascript
// Write individual JSON file per event
function appendEvent(event, seq) {
  const filename = `${String(seq).padStart(6, '0')}.${ulid()}.json`;
  fs.writeFileSync(path.join(journalDir, filename), JSON.stringify(event, null, 2));
}

// Replay by reading all JSON files from journal/ directory
function replayJournal() {
  const files = fs.readdirSync(journalDir)
    .filter(f => f.endsWith('.json'))
    .sort(); // lexicographic sort preserves sequence order

  const events = files.map(f =>
    JSON.parse(fs.readFileSync(path.join(journalDir, f), 'utf-8'))
  );

  return events.reduce(applyEvent, initialState);
}
```

For more details on the journal system, see [Journal System](./journal-system.md).

---

### 4. Process Definitions

**Format:** JavaScript/TypeScript functions

**Execution Model:**

```
+----------------------------------------------------------+
| Process Definition (JavaScript)                          |
|                                                          |
|  export async function process(inputs, ctx) {           |
|    // User-defined orchestration logic                  |
|    const result = await ctx.task(someTask, args);       |
|    await ctx.breakpoint({ question: '...' });           |
|    return result;                                        |
|  }                                                       |
+----------------------------------------------------------+
                          |
                          v
+----------------------------------------------------------+
| Context API (ctx)                                        |
|                                                          |
|  - ctx.task(task, args, opts)       Execute task        |
|  - ctx.breakpoint(opts)             Wait for approval   |
|    Returns BreakpointResult: { approved, feedback, ... }|
|  - ctx.parallel.all([...])          Run in parallel     |
|  - ctx.hook(name, data)             Trigger hooks       |
|  - ctx.log(msg, data)               Log to journal      |
|  - ctx.getState(key)                Access state        |
|  - ctx.setState(key, value)         Update state        |
+----------------------------------------------------------+
```

**Process Lifecycle:**

1. **Load**: Process definition loaded from file or default
2. **Initialize**: Context created with state and journal access
3. **Execute**: Process function called with inputs and context
4. **Iterate**: Process may loop internally or be called multiple times
5. **Complete**: Process returns final result

For more details on creating processes, see [Process Definitions](./process-definitions.md).

---

### 5. Task Execution System

**Task Types:**

| Type | Executor | Use Case | Example |
|------|----------|----------|---------|
| **Agent** | LLM API | Planning, analysis, scoring | GPT-4, Claude |
| **Skill** | Claude Code | Code operations | Refactoring, search |
| **Node** | Node.js | Scripts and tools | Build, test, deploy |
| **Shell** | System shell | Commands | git, npm, docker |

**Execution Flow:**

```
+---------------------------------------------------------+
| Task Request                                            |
| ctx.task(taskDef, args, opts)                           |
+-----------------+---------------------------------------+
                  |
                  v
+---------------------------------------------------------+
| Task Validation                                         |
| - Validate arguments                                    |
| - Check dependencies                                    |
| - Generate task ID                                      |
+-----------------+---------------------------------------+
                  |
                  v
+---------------------------------------------------------+
| Journal Event: EFFECT_REQUESTED                         |
+-----------------+---------------------------------------+
                  |
                  v
+---------------------------------------------------------+
| Execute Task                                            |
| - Agent: Call LLM API                                   |
| - Skill: Invoke Claude Code skill                       |
| - Node: Run JavaScript function                         |
| - Shell: Execute command                                |
| - Breakpoint: Wait for approval (kind: breakpoint)      |
+-----------------+---------------------------------------+
                  |
                  v
+---------------------------------------------------------+
| Journal Event: EFFECT_RESOLVED                          |
+-----------------+---------------------------------------+
                  |
                  v
+---------------------------------------------------------+
| Return Result                                           |
| - Success: Return task output                           |
| - Failure: Throw error or return error object           |
+---------------------------------------------------------+
```

**Parallel Execution:**

```javascript
// Tasks run concurrently with Promise.all
await ctx.parallel.all([
  () => ctx.task(task1, args1),
  () => ctx.task(task2, args2),
  () => ctx.task(task3, args3)
]);

// All results returned when all complete
// If any fails, entire parallel group fails
```

For more details on parallel execution, see [Parallel Execution](./parallel-execution.md).

---

## Data Flow

**Complete Request Flow:**

```
1. User Command
   |
   +--> Claude Code
        |
        +--> Babysitter Skill
             |
             +-- Parse intent
             +-- Load/create run
             +--> CLI: npx -y @a5c-ai/babysitter-sdk@latest run:iterate
                  |
                  +--> SDK Process Engine
                       |
                       +-- Load process definition
                       +-- Replay journal -> restore state
                       +-- Execute process function
                       |    |
                       |    +-- ctx.task() -> Execute tasks
                       |    |    |
                       |    |    +-- Append EFFECT_REQUESTED
                       |    |    +-- Run executor (agent/skill/node/shell)
                       |    |    +-- Append EFFECT_RESOLVED
                       |    |
                       |    +--> ctx.breakpoint() -> Wait for approval
                       |         |
                       |         +-- Append EFFECT_REQUESTED (kind: breakpoint)
                       |         +-- Poll for response
                       |         +-- Append EFFECT_RESOLVED
                       |
                       +-- Append iteration events to journal
                       +-- Save state cache
                       +--> Return results to skill
                            |
                            +--> Report to Claude Code
                                 |
                                 +--> Display to user
```

---

## State Management

**Two-Layer State System:**

1. **Journal (source of truth)**:
   - Append-only event log
   - Immutable history
   - Replayed to reconstruct state

2. **State Cache (performance)**:
   - Snapshot of current state
   - Rebuilt from journal if missing
   - Fast access without replay

**State Structure:**

```typescript
interface RunState {
  runId: string;
  status: 'running' | 'paused' | 'completed' | 'failed';
  iteration: number;
  inputs: any;
  outputs?: any;
  processState: Map<string, any>;  // Process-specific state
  taskResults: Map<string, any>;    // Cached task results
  metrics: {
    startTime: number;
    endTime?: number;
    iterations: number;
    qualityScores: number[];
  };
}
```

---

## Extensibility

**Hook System:**

```javascript
// Register custom hooks
ctx.hook('task:completed', async (taskResult) => {
  await sendMetricsToDatadog(taskResult);
});

ctx.hook('quality:score', async (score) => {
  if (score < 70) {
    await sendAlert('Low quality score');
  }
});

// Built-in hook points
- 'run:started'
- 'run:completed'
- 'iteration:started'
- 'iteration:completed'
- 'task:started'
- 'task:completed'
- 'breakpoint:requested'
- 'breakpoint:resolved'
- 'quality:score'
```

**Custom Task Types:**

```javascript
// Define custom task executor
function registerCustomTask(type, executor) {
  taskExecutors.set(type, executor);
}

// Use custom task
await ctx.task({ type: 'custom', fn: myExecutor }, args);
```

For more details on hooks, see [Hooks](./hooks.md).

---

## Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Plugin** | JavaScript | Claude Code integration |
| **SDK** | TypeScript + Node.js | Core orchestration engine |
| **Process Definitions** | JavaScript/TypeScript | User workflow logic |
| **Journal** | Individual JSON files | Event persistence |
| **CLI** | Commander.js | Command-line interface |

---

## Design Patterns

**Event Sourcing:**
- All state changes recorded as events
- State derived from event replay
- Time-travel debugging possible

**Command Query Responsibility Segregation (CQRS):**
- Write: Append events to journal
- Read: Query state cache or replay

**Saga Pattern:**
- Long-running workflows with compensation
- Breakpoints as decision points
- Resumable across sessions

**Plugin Architecture:**
- Extensible via hooks
- Custom task types
- Process definitions as plugins

---

## Related Documentation

- [Two-Loops Architecture](./two-loops-architecture.md) - Conceptual model of orchestration and AI loops
- [Process Definitions](./process-definitions.md) - Creating custom processes
- [Journal System](./journal-system.md) - Event sourcing and replay
- [Breakpoints](./breakpoints.md) - Human-in-the-loop approval
- [Parallel Execution](./parallel-execution.md) - Running tasks concurrently
- [Hooks](./hooks.md) - Extensibility and custom integrations

---

## Summary

Babysitter's architecture is built on these key principles:

- **Modular Design**: Each component has a clear, single responsibility
- **Event Sourcing**: The journal provides a complete, replayable audit trail
- **Two-Layer State**: Journal for truth, cache for performance
- **Extensibility**: Hooks and custom tasks enable integration with any system
- **Human-in-the-Loop**: Breakpoints enables approval workflows

This architecture enables reliable, debuggable, and auditable AI-powered workflows that can be paused, resumed, and replayed at any point.
