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
- **The Breakpoints Service** is the approval desk - it pauses for human review when needed

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
|  |  +-- journal.jsonl  (event log)                           |  |
|  |  +-- state.json     (current state)                       |  |
|  |  +-- tasks/         (task artifacts)                      |  |
|  +-----------------------------------------------------------+  |
|                           |                                      |
|                           v                                      |
|  +-----------------------------------------------------------+  |
|  |  Breakpoints Service (human approval)                     |  |
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

**Format:** JSONL (JSON Lines) - one event per line

**Event Types:**

```typescript
type JournalEvent =
  | { type: 'RUN_STARTED', runId: string, timestamp: string, inputs: any }
  | { type: 'ITERATION_STARTED', iteration: number, timestamp: string }
  | { type: 'TASK_STARTED', taskId: string, taskType: string, args: any }
  | { type: 'TASK_COMPLETED', taskId: string, result: any, duration: number }
  | { type: 'TASK_FAILED', taskId: string, error: string }
  | { type: 'BREAKPOINT_REQUESTED', breakpointId: string, question: string }
  | { type: 'BREAKPOINT_APPROVED', breakpointId: string, timestamp: string }
  | { type: 'BREAKPOINT_REJECTED', breakpointId: string, reason: string }
  | { type: 'QUALITY_SCORE', iteration: number, score: number, metrics: any }
  | { type: 'RUN_COMPLETED', status: 'success' | 'failed', timestamp: string }
  | { type: 'RUN_FAILED', error: string, timestamp: string }
```

**Benefits:**
- **Deterministic replay**: Reconstruct exact state at any point
- **Audit trail**: Complete history of all actions
- **Debugging**: Trace execution flow and identify issues
- **Resumability**: Continue from last event after interruption

**Implementation:**
```javascript
// Append-only writes
function appendEvent(event) {
  fs.appendFileSync(journalPath, JSON.stringify(event) + '\n');
}

// Replay to reconstruct state
function replayJournal() {
  const events = fs.readFileSync(journalPath, 'utf-8')
    .split('\n')
    .filter(line => line.trim())
    .map(line => JSON.parse(line));

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
| **Breakpoint** | Breakpoints service | Human approval | Review, approve |

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
| Journal Event: TASK_STARTED                             |
+-----------------+---------------------------------------+
                  |
                  v
+---------------------------------------------------------+
| Execute Task                                            |
| - Agent: Call LLM API                                   |
| - Skill: Invoke Claude Code skill                       |
| - Node: Run JavaScript function                         |
| - Shell: Execute command                                |
| - Breakpoint: Wait for approval                         |
+-----------------+---------------------------------------+
                  |
                  v
+---------------------------------------------------------+
| Journal Event: TASK_COMPLETED or TASK_FAILED            |
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

### 6. Breakpoints Service

**Package:** `@a5c-ai/babysitter-breakpoints`

**Architecture:**

```
+--------------------------------------------------------+
| Web UI (http://localhost:3184)                         |
| - View pending breakpoints                             |
| - Approve/reject with comments                         |
| - Review context and history                           |
+-----------------+--------------------------------------+
                  |
                  v
+--------------------------------------------------------+
| REST API                                               |
| - POST /api/breakpoints      Create breakpoint         |
| - GET /api/breakpoints       List breakpoints          |
| - POST /api/breakpoints/:id  Approve/reject            |
| - GET /health                Health check              |
+-----------------+--------------------------------------+
                  |
                  v
+--------------------------------------------------------+
| In-Memory State                                        |
| - Active breakpoints                                   |
| - Pending approvals                                    |
| - Response handlers                                    |
+-----------------+--------------------------------------+
                  |
                  v
+--------------------------------------------------------+
| Notification Integrations (Optional)                   |
| - Telegram bot                                         |
| - Email                                                |
| - Slack (future)                                       |
+--------------------------------------------------------+
```

**Communication Flow:**

1. **Request**: Task executor creates breakpoint via POST
2. **Poll**: Task executor polls for response (long-polling)
3. **Notify**: Service sends notification (Telegram/email)
4. **Review**: Human reviews context in UI
5. **Respond**: Human approves/rejects
6. **Resume**: Task executor receives response, continues

**Technology:** Node.js, Express, WebSockets (optional)

For more details on breakpoints, see [Breakpoints](./breakpoints.md).

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
                       |    |    +-- Append TASK_STARTED
                       |    |    +-- Run executor (agent/skill/node/shell)
                       |    |    +-- Append TASK_COMPLETED
                       |    |
                       |    +--> ctx.breakpoint() -> Wait for approval
                       |         |
                       |         +-- POST to breakpoints service
                       |         +-- Append BREAKPOINT_REQUESTED
                       |         +-- Poll for response
                       |         +-- Append BREAKPOINT_APPROVED
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
| **Journal** | JSONL (text files) | Event persistence |
| **Breakpoints Service** | Node.js + Express | Human approval UI/API |
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
- **Human-in-the-Loop**: Breakpoints service enables approval workflows

This architecture enables reliable, debuggable, and auditable AI-powered workflows that can be paused, resumed, and replayed at any point.
