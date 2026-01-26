# Babysitter Glossary

**Version:** 1.1
**Last Updated:** 2026-01-26
**Audience:** All users

This glossary provides definitions for technical terms and concepts used in Babysitter documentation. Terms are organized alphabetically with cross-references to related concepts and links to detailed documentation.

---

## Quick Reference for Beginners

**New to Babysitter?** Here are the 10 most important terms to know:

| Term | Plain English | Example |
|------|--------------|---------|
| **Run** | One execution of a workflow | "I started a run to build my feature" |
| **Process** | A reusable workflow template | "The TDD process writes tests first" |
| **Iteration** | One try-and-improve cycle | "It took 3 iterations to pass all tests" |
| **Quality Gate** | A check that must pass | "The tests are a quality gate" |
| **Breakpoint** | A pause for your approval | "It stopped at a breakpoint for me to review" |
| **Journal** | A record of everything that happened | "I can see in the journal what the AI did" |
| **Task** | A single unit of work | "The 'run tests' task checks if tests pass" |
| **Effect** | Something the AI wants to do | "The effect was to create a file" |
| **Convergence** | Getting better until target met | "Quality converged from 60% to 95%" |
| **Artifact** | A file created during the run | "The plan.md artifact shows the AI's plan" |

**Start here:** Read the [Getting Started guide](../getting-started/README.md) to see these concepts in action.

---

## Table of Contents

- [A](#a) | [B](#b) | [C](#c) | [D](#d) | [E](#e) | [F](#f) | [G](#g) | [H](#h) | [I](#i) | [J](#j) | [K](#k) | [L](#l) | [M](#m) | [N](#n) | [O](#o) | [P](#p) | [Q](#q) | [R](#r) | [S](#s) | [T](#t) | [U](#u) | [V](#v) | [W](#w)

---

## A

### Agent

A **task type** representing LLM-powered operations within a process. Agents perform intelligent tasks like planning, scoring, code review, and analysis.

**Example:**
```javascript
{
  kind: 'agent',
  agent: {
    name: 'quality-scorer',
    prompt: { role: 'QA engineer', task: 'Score results 0-100' }
  }
}
```

**Related:** [Task](#task), [Skill](#skill), [Effect](#effect)

**See Also:** [Process Definitions](../features/process-definitions.md)

---

### Agent Task

A task definition that invokes an LLM agent to perform intelligent operations. Agent tasks specify the agent name, prompt configuration, and expected output schema.

**Example:**
```javascript
const agentTask = defineTask('scorer', (args, ctx) => ({
  kind: 'agent',
  title: 'Score quality',
  agent: {
    name: 'quality-scorer',
    prompt: {
      role: 'QA engineer',
      task: 'Score the implementation',
      outputFormat: 'JSON'
    },
    outputSchema: { type: 'object', required: ['score'] }
  }
}));
```

**Related:** [Agent](#agent), [Task Definition](#task-definition)

---

### Approval Gate

See [Breakpoint](#breakpoint).

---

### Artifact

Any file produced during a run, stored in the `artifacts/` directory. Common artifacts include plans, specifications, reports, and generated documentation.

**Location:** `.a5c/runs/<runId>/artifacts/`

**Examples:**
- `process.md` - Process description
- `plan.md` - Implementation plan
- `specs.md` - Specifications document

**Related:** [Run Directory](#run-directory)

---

## B

### Babysitter

The orchestration framework for Claude Code that enables deterministic, event-sourced workflow management. Babysitter provides structured multi-step workflows with quality gates, human approval checkpoints, and session persistence.

**Components:**
- SDK (`@a5c-ai/babysitter-sdk`) - Core runtime and CLI
- Plugin (`babysitter@a5c.ai`) - Claude Code integration
- Breakpoints (`@a5c-ai/babysitter-breakpoints`) - Human approval system

**Related:** [SDK](#sdk), [Plugin](#plugin), [Breakpoints Service](#breakpoints-service)

---

### Babysitter Skill

The primary Claude Code skill for orchestrating runs. The skill manages the orchestration loop, executing iterations until completion.

**Location:** `plugins/babysitter/skills/babysit/SKILL.md`

**Invocation:**
```bash
/babysit Build a REST API with TDD
```

**Equivalent verbs:** The following commands are functionally identical:
- `/babysit build a feature`
- `/babysit create a feature`
- `/babysit implement a feature`

All verbs (build, create, implement) trigger the same orchestration workflow.

**Related:** [Skill](#skill), [In-Session Loop](#in-session-loop)

---

### Breakpoint

A pause point in a process that requires human approval before continuing. Breakpoints enable human-in-the-loop workflows for critical decisions like deployment approval, plan review, or security-sensitive changes.

**Example:**
```javascript
await ctx.breakpoint({
  question: 'Approve the deployment?',
  title: 'Production Deployment',
  context: {
    files: [{ path: 'artifacts/plan.md', format: 'markdown' }]
  }
});
```

**Related:** [Breakpoints Service](#breakpoints-service), [Human-in-the-Loop](#human-in-the-loop)

**See Also:** [Breakpoints Feature](../features/breakpoints.md)

---

### Breakpoints Service

The external service providing human approval UI and API. Consists of a web UI (port 3184), REST API (port 3185), and worker for job processing.

**Package:** `@a5c-ai/babysitter-breakpoints`

**Start Command:**
```bash
npx -y @a5c-ai/babysitter-breakpoints@latest start
```

**Ports:**
- `3184` - Web UI (open in browser: http://localhost:3184)
- `3185` - REST API (for programmatic access)

**Note:** The REST API on port 3185 is used for programmatic breakpoint operations. See [CLI Reference](./cli-reference.md) for API usage details.

**Related:** [Breakpoint](#breakpoint)

---

## C

### CLI (Command-Line Interface)

The command-line tool for managing Babysitter runs. Provides commands for run lifecycle management, task operations, and state inspection.

**Binary Names:** `babysitter`, `babysitter-sdk`

**Installation:**
```bash
npm install -g @a5c-ai/babysitter-sdk
```

**Related:** [SDK](#sdk)

**See Also:** [CLI Reference](./cli-reference.md)

---

### Completion Promise

A special XML tag that signals the end of an in-session loop. When Claude outputs `<promise>TEXT</promise>` where TEXT matches the completion secret, the loop exits.

**Format:** `<promise>COMPLETION_SECRET</promise>`

**Usage:** Only output when the run status is `completed`.

**Related:** [In-Session Loop](#in-session-loop), [Completion Secret](#completion-secret)

---

### Completion Secret

A unique string emitted by `run:iterate` and `run:status` when a run completes successfully. Used with the completion promise to exit the in-session loop.

**Example Output:**
```json
{
  "status": "completed",
  "completionSecret": "run-abc123-completed-xyz789"
}
```

**Related:** [Completion Promise](#completion-promise)

---

### Context API

The interface available to process functions for interacting with the orchestration system. Provides methods for executing tasks, creating breakpoints, parallel execution, and state management.

**Methods:**
- `ctx.task(taskDef, inputs)` - Execute a task
- `ctx.breakpoint(payload)` - Request human approval
- `ctx.sleepUntil(timestamp)` - Time gate
- `ctx.parallel.all(tasks)` - Parallel execution
- `ctx.hook(name, payload)` - Call custom hooks
- `ctx.log(message)` - Log to journal
- `ctx.now()` - Get deterministic timestamp

**Related:** [Process](#process), [Intrinsic](#intrinsic)

---

### Convergence

See [Quality Convergence](#quality-convergence).

---

## D

### Deterministic Replay

The ability to reproduce the exact same execution path given the same inputs and journal. Achieved through event sourcing where all state changes are recorded as immutable events.

**Benefits:**
- Time-travel debugging
- Reliable session resumption
- Audit trail verification

**Related:** [Event Sourcing](#event-sourcing), [Journal](#journal)

---

## E

### Effect

A side-effect request generated by process execution. Effects include tasks, breakpoints, and sleep gates. Each effect has a unique `effectId` and tracks status through the journal.

**Effect Kinds:**
- `node` - Node.js script execution
- `agent` - LLM agent invocation
- `skill` - Claude Code skill invocation
- `breakpoint` - Human approval gate
- `sleep` - Time-based wait

**Related:** [Effect ID](#effect-id), [Task](#task)

---

### Effect ID

A unique identifier assigned to each effect within a run. Used for tracking, posting results, and state management.

**Format:** `effect-<ulid>`

**Example:** `effect-01HJKMNPQR3STUVWXYZ012345`

**Related:** [Effect](#effect)

---

### Entry Point

The JavaScript/TypeScript file and export that defines a process. Specified when creating a run using the `--entry` flag.

**Format:** `<path>#<export>`

**Example:** `.a5c/processes/build/process.js#buildProcess`

**Related:** [Process](#process), [run:create](#runcreate)

---

### Event

A single immutable record in the journal representing a state change. Events have a sequence number, timestamp, type, and payload.

**Event Types:**
- `RUN_CREATED` - Run initialization
- `TASK_REQUESTED` - Effect requested
- `EFFECT_RESOLVED` - Task completed
- `BREAKPOINT_REQUESTED` - Human approval needed
- `RUN_COMPLETED` - Successful completion
- `RUN_FAILED` - Run failure

**Related:** [Journal](#journal), [Event Sourcing](#event-sourcing)

---

### Event Sourcing

An architectural pattern where all state changes are recorded as immutable events. State is derived by replaying the event history. This enables deterministic replay, audit trails, and time-travel debugging.

**Benefits:**
- Complete audit trail
- Deterministic behavior
- Resumable sessions
- Debug-friendly

**Related:** [Journal](#journal), [Deterministic Replay](#deterministic-replay)

---

## G

### GSD (Get Stuff Done)

A methodology focused on rapid task completion. GSD emphasizes pragmatic execution over extensive planning.

**Location:** `plugins/babysitter/skills/babysit/process/gsd/`

**Related:** [Methodology](#methodology), [TDD](#tdd-test-driven-development)

---

## H

### Hook

A shell script executed at specific lifecycle points during orchestration. Hooks enable custom behavior for task execution, notifications, logging, and integrations.

**Discovery Priority:**
1. Per-repo: `.a5c/hooks/<hook-name>/`
2. Per-user: `~/.config/babysitter/hooks/<hook-name>/`
3. Plugin: `plugins/babysitter/hooks/<hook-name>/`

**Hook Types:**
- `on-run-start` - When run is created
- `on-run-complete` - When run completes
- `on-iteration-start` - Before iteration (core orchestration)
- `on-iteration-end` - After iteration
- `on-task-start` - Before task execution
- `on-task-complete` - After task execution
- `on-breakpoint` - Breakpoint notification

**Related:** [Hook Dispatcher](#hook-dispatcher)

**See Also:** [Configuration Reference](./configuration.md)

---

### Hook Dispatcher

The component that discovers and executes hooks. Located at `plugins/babysitter/hooks/hook-dispatcher.sh`. Responsible for finding hooks, executing them with payloads, and collecting results.

**Related:** [Hook](#hook)

---

### Human-in-the-Loop

A workflow pattern that includes human approval checkpoints. Implemented through breakpoints that pause execution until a human reviews and approves.

**Use Cases:**
- Production deployments
- Security-sensitive changes
- Major architectural decisions
- Plan and specification review

**Related:** [Breakpoint](#breakpoint)

---

## I

### In-Session Loop

A mechanism for continuous iteration within a single Claude Code session. The stop hook intercepts exit attempts and continues the loop until completion or max iterations reached.

**Components:**
- Setup script: `setup-babysitter-run.sh`
- Stop hook: `babysitter-stop-hook.sh`
- State file: `$CLAUDE_PLUGIN_ROOT/state/${SESSION_ID}.md`

**Invocation:**
```bash
/babysitter:babysit Build feature --max-iterations 20
```

**Related:** [Stop Hook](#stop-hook), [Completion Promise](#completion-promise)

---

### Inputs

The initial data provided to a process when creating a run. Stored in `inputs.json` at the run root.

**Location:** `.a5c/runs/<runId>/inputs.json`

**Example:**
```json
{
  "feature": "user-authentication",
  "targetQuality": 85,
  "maxIterations": 5
}
```

**Related:** [Run](#run), [Process](#process)

---

### Intrinsic

A built-in SDK function callable from within a process. Intrinsics provide the core capabilities for task execution, breakpoints, parallel operations, and state management.

**Core Intrinsics:**
- `ctx.task()` - Execute a task
- `ctx.breakpoint()` - Request approval
- `ctx.sleepUntil()` - Time gate
- `ctx.parallel.all()` - Batch execution
- `ctx.hook()` - Custom hooks
- `ctx.log()` - Logging
- `ctx.now()` - Timestamp

**Related:** [Context API](#context-api)

---

### Invocation Key

A unique identifier for a specific call to a task within a process. Used to track and deduplicate task executions.

**Format:** `<taskId>:<sequence>`

**Example:** `task/build:1`

**Related:** [Task](#task), [Effect](#effect)

---

### Iteration

A single pass through the orchestration loop. Each iteration processes pending effects, executes tasks, and updates state.

**Iteration Status Values:**
- `executed` - Tasks executed, continue looping
- `waiting` - Breakpoint or sleep active
- `completed` - Run finished successfully
- `failed` - Run failed with error
- `none` - No pending effects

**Related:** [Orchestration Loop](#orchestration-loop)

---

## J

### Journal

The append-only event log recording all state changes. Located at `.a5c/runs/<runId>/journal/`. Each event is stored as a separate JSON file.

**File Naming:** `<sequence>.<ulid>.json`

**Example:** `000042.01HJKMNPQR3STUVWXYZ012345.json`

**Benefits:**
- Complete audit trail
- Deterministic replay
- State reconstruction
- Time-travel debugging

**Related:** [Event](#event), [Event Sourcing](#event-sourcing)

**See Also:** [Journal System](../features/journal-system.md)

---

### JSON Lines (JSONL)

A format where each line is a complete JSON object. Used for streaming event data.

**Related:** [Journal](#journal)

---

## K

### Kind

The type classification of an effect or task. Determines how the effect is executed.

**Effect Kinds:**
- `node` - Node.js script
- `shell` - Shell command
- `agent` - LLM agent
- `skill` - Claude Code skill
- `breakpoint` - Human approval
- `sleep` - Time gate

**Related:** [Effect](#effect), [Task](#task)

---

## L

### Label

An optional descriptive string attached to tasks for identification in logs and UI.

**Example:**
```javascript
{
  kind: 'node',
  label: 'Build workspace',
  node: { entry: './scripts/build.js' }
}
```

**Related:** [Task](#task)

---

## M

### Methodology

A high-level structured approach or pattern for software development. Methodologies define the *conceptual framework* - the "what" and "why" of a development approach.

**Key distinction:** Methodology = high-level concept/pattern; Process = low-level code implementation of a methodology.

**You can use ANY methodology and get great results.** Babysitter includes 19+ built-in methodologies - pick the one that fits your project style, or let Babysitter choose automatically based on your request.

**Built-in Methodologies (19+):**

| Methodology | Description | Source |
|-------------|-------------|--------|
| **TDD Quality Convergence** | Test-first development with iterative quality improvement | [tdd-quality-convergence.js](../../../plugins/babysitter/skills/babysit/process/tdd-quality-convergence.js) |
| **GSD (Get Stuff Done)** | Rapid, pragmatic 8-phase execution | [gsd/](../../../plugins/babysitter/skills/babysit/process/gsd/) |
| **Spec-Kit** | Specification-driven development with governance | [SPEC-KIT.md](../../../plugins/babysitter/skills/babysit/process/SPEC-KIT.md) |
| **ATDD/TDD** | Acceptance test-driven and test-driven development | [atdd-tdd/](../../../plugins/babysitter/skills/babysit/process/methodologies/atdd-tdd/) |
| **BDD/Specification by Example** | Behavior-driven development with Gherkin | [bdd-specification-by-example/](../../../plugins/babysitter/skills/babysit/process/methodologies/bdd-specification-by-example/) |
| **Domain-Driven Design** | Strategic and tactical DDD patterns | [domain-driven-design/](../../../plugins/babysitter/skills/babysit/process/methodologies/domain-driven-design/) |
| **Feature-Driven Development** | Feature-centric with parking lot tracking | [feature-driven-development/](../../../plugins/babysitter/skills/babysit/process/methodologies/feature-driven-development/) |
| **Hypothesis-Driven Development** | Experimentation and validation framework | [hypothesis-driven-development/](../../../plugins/babysitter/skills/babysit/process/methodologies/hypothesis-driven-development/) |
| **Example Mapping** | BDD workshop technique for requirements | [example-mapping/](../../../plugins/babysitter/skills/babysit/process/methodologies/example-mapping/) |
| **Scrum** | Sprint-based iterative development | [scrum/](../../../plugins/babysitter/skills/babysit/process/methodologies/scrum/) |
| **Kanban** | Pull-based system with WIP limits | [kanban/](../../../plugins/babysitter/skills/babysit/process/methodologies/kanban/) |
| **Extreme Programming (XP)** | XP engineering practices (pair programming, TDD) | [extreme-programming/](../../../plugins/babysitter/skills/babysit/process/methodologies/extreme-programming/) |
| **Shape Up** | 6-week cycle product development | [shape-up/](../../../plugins/babysitter/skills/babysit/process/methodologies/shape-up/) |
| **Jobs to Be Done** | Outcome-focused development | [jobs-to-be-done/](../../../plugins/babysitter/skills/babysit/process/methodologies/jobs-to-be-done/) |
| **Impact Mapping** | Goal-to-feature traceability | [impact-mapping/](../../../plugins/babysitter/skills/babysit/process/methodologies/impact-mapping/) |
| **Event Storming** | Collaborative domain modeling workshop | [event-storming/](../../../plugins/babysitter/skills/babysit/process/methodologies/event-storming/) |
| **Double Diamond** | Design thinking framework | [double-diamond/](../../../plugins/babysitter/skills/babysit/process/methodologies/double-diamond/) |
| **V-Model** | Verification and validation phases | [v-model/](../../../plugins/babysitter/skills/babysit/process/methodologies/v-model/) |
| **Spiral Model** | Risk-driven iterative development | [spiral-model/](../../../plugins/babysitter/skills/babysit/process/methodologies/spiral-model/) |
| **Waterfall** | Sequential SDLC phases | [waterfall/](../../../plugins/babysitter/skills/babysit/process/methodologies/waterfall/) |
| **RUP** | Rational Unified Process | [rup/](../../../plugins/babysitter/skills/babysit/process/methodologies/rup/) |
| **Cleanroom** | Cleanroom software engineering | [cleanroom/](../../../plugins/babysitter/skills/babysit/process/methodologies/cleanroom/) |

Each methodology has one or more [Process](#process) implementations in the codebase. Browse all methodologies at [`plugins/babysitter/skills/babysit/process/methodologies/`](../../../plugins/babysitter/skills/babysit/process/methodologies/).

**Related:** [Process](#process), [TDD Quality Convergence](#tdd-quality-convergence), [Process Library](../features/process-library.md)

---

## N

### Node Task

A task type that executes a Node.js script. The most common task type for running build scripts, tests, and automation.

**Example:**
```javascript
{
  kind: 'node',
  node: {
    entry: './scripts/build.js',
    timeout: 300000
  }
}
```

**Related:** [Task](#task), [Effect](#effect)

---

## O

### Orchestration

The process of managing run execution and state. Orchestration coordinates task execution, handles effects, and maintains the event journal.

**Related:** [Orchestration Loop](#orchestration-loop), [Run](#run)

---

### Orchestration Loop

The iterative cycle that drives run execution. Each loop iteration: runs `run:iterate`, checks pending effects, executes tasks, posts results.

**Flow:**
```
iterate -> get effects -> perform effects -> post results -> repeat
```

**Related:** [Iteration](#iteration), [run:iterate](#runiterate)

---

## P

### Parallel Execution

The ability to execute multiple tasks concurrently. Implemented via `ctx.parallel.all()`.

**Example:**
```javascript
const [build, lint, test] = await ctx.parallel.all([
  () => ctx.task(buildTask, {}),
  () => ctx.task(lintTask, {}),
  () => ctx.task(testTask, {})
]);
```

**Related:** [Context API](#context-api)

**See Also:** [Parallel Execution](../features/parallel-execution.md)

---

### Pending Effect

An effect that has been requested but not yet resolved. Listed via `task:list --pending`.

**Related:** [Effect](#effect)

---

### Plugin

A Claude Code extension package. The Babysitter plugin (`babysitter@a5c.ai`) provides skills, hooks, and commands for orchestration.

**Installation:**
```bash
claude plugin marketplace add a5c-ai/babysitter
claude plugin install --scope user babysitter@a5c.ai
```

**Related:** [Babysitter Skill](#babysitter-skill)

---

### Process

A JavaScript/TypeScript function that is the *low-level code implementation* of a workflow. Processes use the Context API to execute tasks, create breakpoints, and manage state.

**Key distinction:** Process = low-level code implementation; [Methodology](#methodology) = high-level concept/pattern that a process implements.

**Babysitter includes 2,000+ ready-to-use processes** organized by domain:

| Domain | Processes | Browse |
|--------|-----------|--------|
| **Development** | 680+ (web, mobile, DevOps, AI, security) | [Browse →](../../../plugins/babysitter/skills/babysit/process/specializations/) |
| **Business** | 430+ (legal, HR, marketing, finance) | [Browse →](../../../plugins/babysitter/skills/babysit/process/specializations/domains/business/) |
| **Science & Engineering** | 550+ (physics, aerospace, biomedical) | [Browse →](../../../plugins/babysitter/skills/babysit/process/specializations/domains/science/) |

**Structure:**
```javascript
export async function process(inputs, ctx) {
  const plan = await ctx.task(planTask, inputs);
  await ctx.breakpoint({ question: 'Approve plan?' });
  const result = await ctx.task(buildTask, { plan });
  return result;
}
```

**Location:** `.a5c/runs/<runId>/code/main.js`

**Related:** [Methodology](#methodology), [Context API](#context-api), [Entry Point](#entry-point)

**See Also:** [Process Definitions](../features/process-definitions.md), [Process Library](../features/process-library.md)

---

### Process Definition

See [Process](#process).

---

### Process ID

A unique identifier for a process type. Used when creating runs to specify which process to execute.

**Format:** `<namespace>/<name>`

**Example:** `dev/build`, `ci/test`, `tdd/feature`

**Related:** [Process](#process), [run:create](#runcreate)

---

## Q

### Quality Convergence

An iterative methodology that repeats execution until quality metrics meet targets. Each iteration measures quality and refines implementation.

**Example Flow:**
```
implement -> measure quality -> below target? -> refine -> repeat
```

**Related:** [Quality Score](#quality-score), [TDD](#tdd-test-driven-development)

**See Also:** [Quality Convergence](../features/quality-convergence.md)

---

### Quality Score

A **multi-dimensional** assessment of implementation quality. Quality scores are not a single number - they comprise multiple dimensions that are weighted and combined into an overall score.

**Dimensions typically include:**
- **Tests**: Pass rate and coverage percentage
- **Code Quality**: Lint errors, complexity, formatting
- **Security**: Vulnerability scans, secrets detection
- **Performance**: Response times, bundle size (when applicable)
- **Type Safety**: TypeScript errors, static analysis

**Example:**
```json
{
  "overall": 85,
  "dimensions": {
    "tests": 92,
    "codeQuality": 88,
    "security": 100,
    "performance": 75
  },
  "weights": {
    "tests": 0.30,
    "codeQuality": 0.25,
    "security": 0.25,
    "performance": 0.20
  }
}
```

**See Also:** [Quality Convergence](../features/quality-convergence.md) for the five quality gate categories and detailed scoring formulas in [Best Practices](../features/best-practices.md#custom-scoring-strategies).

**Related:** [Quality Convergence](#quality-convergence), [Agent](#agent)

---

## R

### Result

The output from a completed task. Stored at `tasks/<effectId>/result.json`.

**Schema:**
```json
{
  "status": "ok",
  "value": { /* task output */ },
  "metadata": { /* execution metadata */ }
}
```

**Related:** [Task](#task), [task:post](#taskpost)

---

### Resume

Continuing a previously interrupted run. The journal enables exact state reconstruction for seamless resumption.

**Command:**
```bash
/babysitter:babysit resume --run-id <runId>
```

**Related:** [Run](#run), [Deterministic Replay](#deterministic-replay)

**See Also:** [Run Resumption](../features/run-resumption.md)

---

### Run

A single execution of a process. Each run has a unique ID, directory, journal, and state. Runs are resumable across sessions.

**Directory:** `.a5c/runs/<runId>/`

**Lifecycle:**
`created` -> `running` -> `completed` | `failed`

**Related:** [Run ID](#run-id), [Run Directory](#run-directory)

---

### Run Directory

The directory containing all data for a run.

**Structure:**
```
.a5c/runs/<runId>/
├── run.json           # Run metadata
├── inputs.json        # Initial inputs
├── code/
│   └── main.js        # Process implementation
├── artifacts/         # Generated files
├── journal/           # Event log
├── state/
│   └── state.json     # State cache
└── tasks/             # Task artifacts
```

**Related:** [Run](#run)

---

### Run ID

A unique identifier for a run. Typically includes timestamp and description.

**Format:** `run-<YYYYMMDD>-<HHMMSS>[-<description>]`

**Example:** `run-20260125-143012-auth-feature`

**Related:** [Run](#run)

---

## S

### SDK (Software Development Kit)

The core Babysitter package providing the orchestration runtime, CLI, and APIs.

**Package:** `@a5c-ai/babysitter-sdk`

**Installation:**
```bash
npm install -g @a5c-ai/babysitter-sdk
```

**Components:**
- Runtime - Process execution engine
- CLI - Command-line interface
- Storage - Journal and state management
- Tasks - Task definition and execution

**Related:** [CLI](#cli-command-line-interface)

---

### Session ID

A unique identifier for a Claude Code session. Used for state isolation in in-session loops.

**Environment Variable:** `CLAUDE_SESSION_ID`

**Related:** [In-Session Loop](#in-session-loop)

---

### Shell Task

A task type that executes shell commands.

**Example:**
```javascript
{
  kind: 'shell',
  shell: {
    command: 'npm run build',
    cwd: './packages/app'
  }
}
```

**Related:** [Task](#task)

---

### Skill

A Claude Code capability that provides specialized functionality. The Babysitter skill (`babysit`) orchestrates runs.

**Invocation:**
```bash
/babysitter:babysit <prompt>
```

**Related:** [Babysitter Skill](#babysitter-skill)

---

### Skill Task

A task type that invokes a Claude Code skill.

**Example:**
```javascript
{
  kind: 'skill',
  skill: {
    name: 'codebase-analyzer',
    context: { scope: 'src/', depth: 3 }
  }
}
```

**Related:** [Skill](#skill), [Task](#task)

---

### Sleep

A time gate that pauses execution until a specified timestamp.

**Example:**
```javascript
await ctx.sleepUntil(new Date('2026-01-26T10:00:00Z'));
```

**Related:** [Effect](#effect)

---

### State

The current status of a run derived from replaying the journal. Cached at `state/state.json` for performance.

**Schema:**
```json
{
  "runId": "run-...",
  "status": "running",
  "version": 42,
  "invocations": {},
  "pendingEffects": []
}
```

**Note:** State cache is gitignored (derived from journal).

**Related:** [State Cache](#state-cache), [Journal](#journal)

---

### State Cache

A derived snapshot of current state stored for fast access. Rebuilt from journal if missing or stale.

**Location:** `.a5c/runs/<runId>/state/state.json`

**Related:** [State](#state)

---

### State Version

A monotonically increasing number tracking state changes. Increments with each journal event.

**Related:** [State](#state)

---

### Stop Hook

A Claude Code hook that intercepts exit attempts during in-session loops. Decides whether to allow exit or continue the loop.

**Location:** `plugins/babysitter/hooks/babysitter-stop-hook.sh`

**Output (block):**
```json
{
  "decision": "block",
  "reason": "<prompt>",
  "systemMessage": "Babysitter iteration N"
}
```

**Related:** [In-Session Loop](#in-session-loop), [Hook](#hook)

---

## T

### Task

The core primitive for external work in processes. Tasks define what to execute and how to handle results.

**Task Kinds:**
- `node` - Node.js script
- `shell` - Shell command
- `agent` - LLM agent
- `skill` - Claude Code skill

**Example:**
```javascript
const result = await ctx.task(buildTask, { target: 'app' });
```

**Related:** [Effect](#effect), [Task Definition](#task-definition)

---

### Task Definition

A JavaScript object or function that specifies how to create a task. Defines kind, configuration, and I/O paths.

**Example:**
```javascript
const buildTask = defineTask('build', (args, ctx) => ({
  kind: 'node',
  title: 'Build project',
  node: { entry: './scripts/build.js' },
  io: {
    inputJsonPath: `tasks/${ctx.effectId}/input.json`,
    outputJsonPath: `tasks/${ctx.effectId}/result.json`
  }
}));
```

**Related:** [Task](#task)

---

### TDD Quality Convergence

The full name for Babysitter's test-driven development methodology. TDD Quality Convergence combines traditional TDD (writing tests before implementation) with iterative quality improvement until targets are met.

**Process:**
1. Write tests first
2. Implement code to pass tests
3. Measure quality (tests, coverage, lint, security, etc.)
4. Iterate until quality target is achieved

**Shorthand:** "TDD" is acceptable after first mention in a document.

**Related:** [Quality Convergence](#quality-convergence), [Methodology](#methodology)

**See Also:** [Quality Convergence Guide](../features/quality-convergence.md)

---

### TDD (Test-Driven Development)

See [TDD Quality Convergence](#tdd-quality-convergence).

**Note:** In Babysitter documentation, "TDD" typically refers to the full TDD Quality Convergence methodology, not just traditional test-driven development.

---

### Telegram Integration

An optional extension for receiving breakpoint notifications via Telegram.

**Setup:**
```bash
breakpoints extension enable telegram --token <bot-token> --username <your-username>
```

**Related:** [Breakpoints Service](#breakpoints-service)

---

## U

### ULID (Universally Unique Lexicographically Sortable Identifier)

A time-sortable unique identifier used for event and effect IDs.

**Example:** `01HJKMNPQR3STUVWXYZ012345`

**Related:** [Event](#event), [Effect ID](#effect-id)

---

## V

### Value

The main output data from a task result. Passed via `--value` flag when posting results.

**Example:**
```bash
$CLI task:post <runId> <effectId> --status ok --value output.json
```

**Related:** [Result](#result), [task:post](#taskpost)

---

## W

### Waiting

A run status indicating a blocking effect (breakpoint or sleep) is active. Orchestration pauses until the effect is resolved.

**Related:** [Breakpoint](#breakpoint), [Sleep](#sleep), [Iteration](#iteration)

---

### Worker

A background process that handles asynchronous jobs like TTL expiration and notifications in the breakpoints service.

**Configuration:**
- `WORKER_POLL_MS` - Poll interval (default: 2000)
- `WORKER_BATCH_SIZE` - Batch size (default: 10)

**Related:** [Breakpoints Service](#breakpoints-service)

---

## Quick Reference Index

### By Category

**Core Concepts:**
[Run](#run), [Process](#process), [Journal](#journal), [Event](#event), [Effect](#effect), [Task](#task), [State](#state)

**Task Types:**
[Node Task](#node-task), [Agent Task](#agent-task), [Skill Task](#skill-task), [Shell Task](#shell-task)

**Workflow:**
[Orchestration Loop](#orchestration-loop), [Iteration](#iteration), [Quality Convergence](#quality-convergence), [Breakpoint](#breakpoint)

**Architecture:**
[SDK](#sdk-software-development-kit), [CLI](#cli-command-line-interface), [Plugin](#plugin), [Hook](#hook)

**Session Management:**
[In-Session Loop](#in-session-loop), [Completion Promise](#completion-promise), [Stop Hook](#stop-hook)

---

## Related Documentation

- [CLI Reference](./cli-reference.md) - Complete CLI command documentation
- [Configuration Reference](./configuration.md) - Environment variables and settings
- [FAQ](./faq.md) - Frequently asked questions
- [Troubleshooting](./troubleshooting.md) - Common issues and solutions
