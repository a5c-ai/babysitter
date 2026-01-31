<div align="center">

# Babysitter

[![npm version](https://img.shields.io/npm/v/@a5c-ai/babysitter-sdk.svg)](https://www.npmjs.com/package/@a5c-ai/babysitter-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub issues](https://img.shields.io/github/issues/a5c-ai/babysitter.svg)](https://github.com/a5c-ai/babysitter/issues)
[![GitHub stars](https://img.shields.io/github/stars/a5c-ai/babysitter.svg)](https://github.com/a5c-ai/babysitter/stargazers)

> **Orchestrate complex, multi-step workflows with human-in-the-loop approval, iterative refinement, and quality convergence.**

Babysitter enables Claude Code to manage sophisticated development workflows through deterministic, resumable orchestration. Just ask Claude to use the babysitter skill, and it will handle the rest.

[Getting Started](#installation) • [Documentation](#how-it-works) • [Examples](#example-workflows) • [Community](#community-and-support)

</div>

---


https://github.com/user-attachments/assets/8c3b0078-9396-48e8-aa43-5f40da30c20b

---

## Table of Contents

- [What is Babysitter?](#what-is-babysitter)
- [What is @a5c-ai?](#what-is-a5c-ai)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Complete End-to-End Example](#complete-end-to-end-example)
- [How It Works](#how-it-works)
- [Why Babysitter?](#why-babysitter)
- [Comparison with Alternative Approaches](#comparison-with-alternative-approaches)
- [Commands](#commands)
- [Behind the Scenes: Process Examples](#behind-the-scenes-process-examples)
- [Common Use Cases](#common-use-cases)
- [Methodologies](#methodologies)
- [Example Workflows](#example-workflows)
- [Task Types](#task-types)
- [Resuming Work](#resuming-work)
- [Best Practices](#best-practices)
- [Performance Expectations](#performance-expectations)
- [Security Best Practices](#security-best-practices)
- [Monitoring and Observability](#monitoring-and-observability)
- [Troubleshooting](#troubleshooting)
- [Architecture Overview](#architecture-overview)
- [Limitations and Known Issues](#limitations-and-known-issues)
- [FAQ](#faq)
- [Contributing](#contributing)
- [Community and Support](#community-and-support)
  - [Star History](#star-history)
  - [Contributors](#contributors)
- [License](#license)
- [Further Reading](#further-reading)

---

## What is Babysitter?

Babysitter is an orchestration framework for Claude Code that enables deterministic, event-sourced workflow management. It allows you to build complex, multi-step development processes with built-in quality gates, human approval checkpoints, and automatic iteration until quality targets are met.

Babysitter works seamlessly with your prexisting subagents, skills and tools. It can be used to orchestrate them into complex workflows.

## What is a5c.ai?

**a5c.ai** is an organization focused on building advanced AI orchestration and automation tools. The name stands for "agentic ai". It's a collection of tools that enable AI systems like Claude and others to work more effectively on complex, real-world software development tasks (but not limited to). The Babysitter project is part of this ecosystem, providing structured workflow orchestration for agentic ai.

## Prerequisites

Before installing Babysitter, ensure you have:

- **Node.js**: Version 20.0.0 or higher (recommend 22.x LTS) - ideally using nvm to manage node versions
- **Claude Code**: Latest version installed and configured - see [Claude Code documentation](https://code.claude.com/docs/en/quickstart)
- **Git**: For cloning the repository (optional, for manual installation)

---

## Installation

### 1. Install the SDK

```bash
npm install -g @a5c-ai/babysitter@latest @a5c-ai/babysitter-sdk@latest @a5c-ai/babysitter-breakpoints@latest
```

### 2. Install the Plugin

**Via Claude Code (Recommended):**

```bash
# Add the plugin repository
claude plugin marketplace add a5c-ai/babysitter

# Install the plugin
claude plugin install --scope user babysitter@a5c.ai

# Enable per user
claude plugin enable --scope user babysitter@a5c.ai 
```

Then restart Claude Code.

Tip: Run update daily or 
```bash
claude plugin marketplace update a5c.ai 

claude plugin update babysitter@a5c.ai 
```

### 3. Verify Installation

In Claude Code, type `/skills` to verify "babysit" appears in the list.

## Quick Start

Simply ask Claude to use the babysitter skill:


```bash
claude "/babysitter:call implement user authentication with TDD"
```

or in English:

```
Use the babysitter skill to implement user authentication with TDD
```

Claude will:
1. Create an orchestration run
2. Set up the iteration loop
3. Execute tasks step-by-step
4. Handle quality checks and approvals
5. Continue until completion

---

## Complete End-to-End Example

> **Note**: Screenshots and GIFs demonstrating this workflow are planned for future releases. For now, this section provides detailed command outputs and process flows.

Let's walk through a complete real-world example: building a REST API with authentication using TDD and quality convergence.

### Step 1: Start the Run

**Command:**
```
Use the babysitter skill to build a REST API for task management with:
- User authentication (JWT)
- CRUD operations for tasks
- Express.js and SQLite
- TDD with 85% quality target
- Max 5 iterations
```

**Babysitter Output:**
```
Creating new babysitter run: rest-api-auth-20260122-143012

Process Definition: TDD Quality Convergence
Target Quality: 85%
Max Iterations: 5

Run ID: 01KFFTSF8TK8C9GT3YM9QYQ6WG
Run Directory: .a5c/runs/01KFFTSF8TK8C9GT3YM9QYQ6WG/
```

### Step 2: Research Phase

**Console Output:**
```
[Iteration 1/5] Starting research phase...

Task: Research Codebase Patterns
- Analyzing existing Express.js patterns... ✓
- Checking authentication implementations... ✓
- Reviewing database schemas... ✓
- Identifying test frameworks... ✓

Research Summary:
- Found existing Express setup with middleware pattern
- JWT authentication pattern in /auth module
- Using Jest + Supertest for API testing
- SQLite with better-sqlite3 driver
```

### Step 3: Specifications Phase

**Console Output:**
```
Task: Generate Specifications
Creating detailed specs for task management API...

Specifications:
✓ Endpoints: POST /auth/register, POST /auth/login, GET/POST/PUT/DELETE /tasks
✓ Authentication: JWT tokens, refresh tokens, password hashing with bcrypt
✓ Database: Users table, Tasks table with foreign keys
✓ Tests: Unit tests for auth logic, integration tests for endpoints
✓ Quality Metrics: 85% coverage, ESLint passing, no security issues

Waiting for approval...
```

### Step 4: Human Approval (Breakpoint)

**Breakpoint UI:**
```
┌─────────────────────────────────────────────────────────┐
│ Breakpoint: Specification Review                        │
├─────────────────────────────────────────────────────────┤
│ Question: Review and approve specifications?            │
│                                                         │
│ Context:                                                │
│ - 5 endpoints defined (auth + CRUD)                     │
│ - JWT authentication with refresh tokens                │
│ - SQLite database with 2 tables                         │
│ - Jest test suite with Supertest                        │
│                                                         │
│ [Approve] [Reject] [Comment]                            │
└─────────────────────────────────────────────────────────┘
```

**Action:** Click "Approve"

### Step 5: TDD Implementation Loop

**Iteration 1:**
```
[Iteration 1/5] Starting TDD implementation...

Task: Write Tests
- Writing auth endpoint tests... ✓ (15 test cases)
- Writing task CRUD tests... ✓ (20 test cases)
- Writing middleware tests... ✓ (8 test cases)

Task: Implement Code
- Implementing auth endpoints... ✓
- Implementing task CRUD... ✓
- Implementing middleware... ✓

Parallel Quality Checks:
├─ Coverage: 72% (target: 85%) ⚠
├─ ESLint: 3 warnings
├─ Security Scan: No issues ✓
└─ Tests: 41/43 passing (2 failures)

Agent Quality Score: 68/100 (below target)
Issues: Coverage too low, 2 failing tests, ESLint warnings

Continuing to next iteration...
```

**Iteration 2:**
```
[Iteration 2/5] Refining implementation...

Task: Fix Failing Tests
- Fixed auth token expiry test ✓
- Fixed task deletion cascade test ✓

Task: Improve Coverage
- Added edge case tests for invalid inputs ✓
- Added tests for error handling paths ✓

Task: Fix ESLint Issues
- Fixed unused variable warnings ✓
- Applied consistent code style ✓

Parallel Quality Checks:
├─ Coverage: 88% (target: 85%) ✓
├─ ESLint: 0 warnings ✓
├─ Security Scan: No issues ✓
└─ Tests: 43/43 passing ✓

Agent Quality Score: 92/100 (target met!)

Quality target achieved in 2 iterations.
```

### Step 6: Final Approval

**Breakpoint UI:**
```
┌─────────────────────────────────────────────────────────┐
│ Breakpoint: Deployment Approval                         │
├─────────────────────────────────────────────────────────┤
│ Question: Deploy to production?                         │
│                                                         │
│ Results:                                                │
│ ✓ Quality score: 92/100 (target: 85)                    │
│ ✓ Test coverage: 88%                                    │
│ ✓ All 43 tests passing                                  │
│ ✓ No ESLint warnings                                    │
│ ✓ No security issues                                    │
│                                                         │
│ Files changed: 12 files, +847 lines                     │
│                                                         │
│ [Approve] [Reject] [View Changes]                       │
└─────────────────────────────────────────────────────────┘
```

**Action:** Click "Approve"

### Step 7: Completion

**Final Output:**
```
✓ Run completed successfully!

Summary:
- Total Iterations: 2 of 5
- Final Quality Score: 92/100
- Test Coverage: 88%
- Files Created: 12
- Tests: 43 passing
- Duration: 4m 32s

Run ID: 01KFFTSF8TK8C9GT3YM9QYQ6WG
Journal: .a5c/runs/01KFFTSF8TK8C9GT3YM9QYQ6WG/journal/journal.jsonl

Next Steps:
- Review changes: git diff
- Run tests: npm test
- Start server: npm start
```

### Behind the Scenes: Process Definition

This workflow was orchestrated by this process definition:

```javascript
export async function process(inputs, ctx) {
  const { feature, targetQuality = 85, maxIterations = 5 } = inputs;

  // Phase 1: Research
  const research = await ctx.task(researchTask, { feature });

  // Phase 2: Specifications
  const specs = await ctx.task(specificationsTask, { research });

  // Breakpoint: Approve specifications
  await ctx.breakpoint({
    question: 'Review and approve specifications?',
    title: 'Specification Review',
    context: specs
  });

  // Phase 3: TDD Loop
  let iteration = 0;
  let quality = 0;

  while (iteration < maxIterations && quality < targetQuality) {
    iteration++;
    ctx.log(`[Iteration ${iteration}/${maxIterations}] Starting TDD implementation...`);

    // Write tests first
    const tests = await ctx.task(writeTestsTask, { specs, iteration });

    // Implement code
    const impl = await ctx.task(implementTask, { tests, specs });

    // Parallel quality checks
    const [coverage, lint, security, testResults] = await ctx.parallel.all([
      () => ctx.task(coverageTask, {}),
      () => ctx.task(lintTask, {}),
      () => ctx.task(securityTask, {}),
      () => ctx.task(runTestsTask, {})
    ]);

    // Agent scores quality
    const score = await ctx.task(agentScoringTask, {
      tests, impl, coverage, lint, security, testResults
    });

    quality = score.overall;
    ctx.log(`Agent Quality Score: ${quality}/100`);

    if (quality >= targetQuality) {
      ctx.log('Quality target achieved!');
      break;
    }
  }

  // Final approval before deployment
  await ctx.breakpoint({
    question: 'Deploy to production?',
    title: 'Deployment Approval',
    context: { quality, iteration, targetQuality }
  });

  return { success: true, quality, iterations: iteration };
}
```

### Key Takeaways

1. **Structured Workflow**: Clear phases with automatic progression
2. **Quality Convergence**: Iterates until quality target met (2 iterations)
3. **Human-in-the-Loop**: Two approval gates for critical decisions
4. **Parallel Execution**: Quality checks run concurrently for speed
5. **Full Traceability**: Complete audit trail in journal
6. **Resumable**: Can pause/resume at any point

### Inspecting the Run

View the journal to see complete event history:

```bash
cat .a5c/runs/01KFFTSF8TK8C9GT3YM9QYQ6WG/journal/journal.jsonl
```

**Sample Journal Events:**
```jsonl
{"type":"RUN_STARTED","timestamp":"2026-01-22T14:30:12.445Z","runId":"01KFFTSF8TK8C9GT3YM9QYQ6WG"}
{"type":"ITERATION_STARTED","timestamp":"2026-01-22T14:30:12.567Z","iteration":1}
{"type":"TASK_STARTED","timestamp":"2026-01-22T14:30:13.123Z","taskId":"research-001","taskType":"agent"}
{"type":"TASK_COMPLETED","timestamp":"2026-01-22T14:30:45.789Z","taskId":"research-001","result":{"status":"success"}}
{"type":"BREAKPOINT_REQUESTED","timestamp":"2026-01-22T14:31:12.234Z","breakpointId":"bp-001"}
{"type":"BREAKPOINT_APPROVED","timestamp":"2026-01-22T14:31:45.123Z","breakpointId":"bp-001"}
{"type":"QUALITY_SCORE","timestamp":"2026-01-22T14:33:23.456Z","iteration":1,"score":68}
{"type":"QUALITY_SCORE","timestamp":"2026-01-22T14:34:44.789Z","iteration":2,"score":92}
{"type":"RUN_COMPLETED","timestamp":"2026-01-22T14:34:44.890Z","status":"success"}
```

---

## How It Works

Babysitter uses an **event-sourced orchestration model**:

```
┌──────────────────────────────────────────────────────────────────┐
│                     Babysitter Loop                              │
│                                                                  │
│   ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐   │
│   │ Iterate │ ──▶ │  Get    │ ──▶ │ Execute │ ──▶ │  Post   │   │
│   │         │     │ Effects │     │ Tasks   │     │ Results │   │
│   └─────────┘     └─────────┘     └─────────┘     └─────────┘   │
│        │                                               │         │
│        └───────────────── repeat ◀────────────────────┘         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Each iteration:**
1. **Iterate** - Advance the process, request pending effects
2. **Get Effects** - Check what tasks need to be executed
3. **Execute** - Run tasks (agents, skills, breakpoints, scripts)
4. **Post Results** - Record outcomes in the journal
5. **Repeat** - Continue until process completes

**Everything is recorded:**
- `.a5c/runs/<runId>/journal/` - Append-only event log
- `.a5c/runs/<runId>/tasks/` - Task inputs and results
- `.a5c/runs/<runId>/state.json` - Current state cache

This means you can **pause, resume, or recover** at any point.

---

## Why Babysitter?

| Traditional Approach | Babysitter |
|---------------------|------------|
| Run script once, hope it works | Iterate until quality target met |
| Manual approval via chat | Structured breakpoints with context |
| State lost on session end | Event-sourced, fully resumable |
| Single task execution | Parallel execution, dependencies |
| No audit trail | Complete journal of all events |
| Fixed workflow | Process-driven, customizable |

**Key differentiators:**
- **Deterministic replay** - Rerun from any point in history
- **Quality convergence** - Loop until metrics are satisfied
- **Human-in-the-loop** - Breakpoints for approval gates
- **Agent scoring** - LLM-based quality assessment
- **Parallel execution** - Run independent tasks concurrently

---

## Comparison with Alternative Approaches

Understanding how Babysitter compares to other workflow tools helps you choose the right solution:

### vs. GitHub Actions / CI/CD Pipelines

| Feature | GitHub Actions | Babysitter |
|---------|---------------|------------|
| **Trigger** | Git events (push, PR) | Natural language command |
| **Iteration** | Fixed steps, no loops | Iterative quality convergence |
| **Human approval** | External approval systems | Built-in breakpoints with UI |
| **Resumability** | Restart from beginning | Resume from any point |
| **Use case** | Automated testing/deployment | Development workflows |

**When to use Babysitter**: Development workflows that need iteration, quality gates, and human judgment. GitHub Actions is better for post-commit automation.

### vs. Make / Task Runners

| Feature | Make / npm scripts | Babysitter |
|---------|-------------------|------------|
| **Orchestration** | Sequential/parallel tasks | Event-sourced processes |
| **Quality gates** | Manual checks | Automated scoring + iteration |
| **State management** | None | Full event journal |
| **Resumability** | Restart from beginning | Resume from any point |
| **Human-in-loop** | Manual execution | Structured breakpoints |

**When to use Babysitter**: Complex multi-step workflows with quality requirements. Make/npm is better for simple build tasks.

### vs. Agentic Frameworks (LangGraph, CrewAI, AutoGPT)

| Feature | Agentic Frameworks | Babysitter |
|---------|-------------------|------------|
| **Agent focus** | General-purpose agents | Claude Code specialized |
| **Determinism** | Varied | Event-sourced, reproducible |
| **IDE integration** | External | Native Claude Code |
| **Process control** | Agent decides | Structured process definitions |
| **Audit trail** | Depends on framework | Complete journal always |

**When to use Babysitter**: Software development workflows in Claude Code with deterministic execution. Agentic frameworks are better for general AI automation tasks.

### vs. Manual Claude Code Usage

| Feature | Manual Claude | Babysitter |
|---------|--------------|------------|
| **Session persistence** | Lost on restart | Event-sourced, resumable |
| **Quality iteration** | Manual prompting | Automated convergence |
| **Approval gates** | Chat-based | Structured breakpoints |
| **Parallel execution** | Sequential only | Built-in parallelism |
| **Audit trail** | Chat history | Structured journal |

**When to use Babysitter**: Complex projects requiring multiple iterations, quality gates, or team collaboration. Manual Claude is better for quick one-off tasks.

---

## Commands

### Start a New Run

```
/babysitter:babysit <prompt> [--max-iterations <n>]
```

**Examples:**
```
/babysitter:babysit Build a todo app with Next.js and SQLite
/babysitter:babysit Implement user authentication --max-iterations 20
/babysitter:babysit Refactor the payment module for better error handling
```

### Resume an Existing Run

```
/babysitter:babysit resume --run-id <runId>
```

**Examples:**
```
/babysitter:babysit resume --run-id 01KFFTSF8TK8C9GT3YM9QYQ6WG
/babysitter:babysit resume --run-id todo-app-20260121-084244 --max-iterations 10
```

### Natural Language (via Skill)

You can also just ask Claude naturally:
```
Use the babysitter skill to build a REST API with TDD
Resume the babysitter run and continue implementation
```

---

## Behind the Scenes: Process Examples

Babysitter runs are driven by **process definitions** - JavaScript functions that orchestrate tasks.

### Example 1: Simple Build & Test

```javascript
export async function process(inputs, ctx) {
  // Build the project
  const buildResult = await ctx.task(buildTask, {
    command: 'npm run build'
  });

  // Run tests
  const testResult = await ctx.task(testTask, {
    command: 'npm test'
  });

  // Require approval before deploy
  await ctx.breakpoint({
    question: 'Build passed. Deploy to production?',
    title: 'Deployment Approval'
  });

  return { success: true, build: buildResult, tests: testResult };
}
```

### Example 2: TDD Quality Convergence

```javascript
export async function process(inputs, ctx) {
  const { feature, targetQuality = 85, maxIterations = 5 } = inputs;

  // Phase 1: Planning with agent
  const plan = await ctx.task(agentPlanningTask, { feature });

  // Breakpoint: Review plan
  await ctx.breakpoint({
    question: `Review plan for "${feature}"?`,
    title: 'Plan Review'
  });

  // Phase 2: TDD Loop
  let iteration = 0;
  let quality = 0;

  while (iteration < maxIterations && quality < targetQuality) {
    iteration++;

    // Write tests
    const tests = await ctx.task(writeTestsTask, { plan, iteration });

    // Implement code
    const impl = await ctx.task(implementTask, { tests, iteration });

    // Parallel quality checks
    const [coverage, lint, security] = await ctx.parallel.all([
      () => ctx.task(coverageTask, {}),
      () => ctx.task(lintTask, {}),
      () => ctx.task(securityTask, {})
    ]);

    // Agent scores quality
    const score = await ctx.task(agentScoringTask, {
      tests, impl, coverage, lint, security
    });

    quality = score.overall;
    ctx.log(`Iteration ${iteration}: ${quality}/${targetQuality}`);
  }

  return { converged: quality >= targetQuality, iterations: iteration };
}
```

### Task Types in Processes

| Task | Definition | Example Use |
|------|------------|-------------|
| `ctx.task(task, args)` | Execute a defined task | Run build, tests, agents |
| `ctx.breakpoint(opts)` | Wait for human approval | Review plan, approve deploy |
| `ctx.parallel.all([...])` | Run tasks concurrently | Multiple quality checks |
| `ctx.hook(name, data)` | Trigger custom hooks | Notifications, integrations |

---

## Common Use Cases

### 1. TDD Development with Quality Gates

```
Use the babysitter skill to build a REST API with:
- Test-driven development
- Quality score target of 85%
- Breakpoint approval before merging
```

**What happens:**
- Research phase → specifications → implementation plan
- Write tests first, then implementation
- Agent scores quality after each iteration
- Continue refining until quality target met
- Human approval before final merge

### 2. Multi-Phase Build Pipeline

```
Use babysitter to set up a build pipeline that:
1. Runs linting and type checking
2. Executes unit tests in parallel
3. Generates coverage report
4. Requires approval for deployment
```

**What happens:**
- Tasks run in sequence or parallel as specified
- Breakpoint pauses for human approval
- All results tracked in event-sourced journal

### 3. Iterative Code Review

```
Use the babysitter skill to review and improve the authentication module:
- Check for security issues
- Analyze code quality
- Suggest and apply improvements
- Iterate until quality score > 90
```

**What happens:**
- Initial analysis via agent task
- Improvement suggestions generated
- Changes applied and re-scored
- Loop continues until target met

### 4. Planning → Implementation → Verification

```
Use babysitter to implement a new feature:
1. Research existing patterns
2. Create detailed specifications  
3. Plan implementation components
4. Implement with TDD
5. Verify and document
```

**What happens:**
- Each phase builds on the previous
- Breakpoints for approval at key decisions
- Full traceability via journal events

---

## Methodologies

### TDD Quality Convergence

The recommended methodology for feature development:

```
┌─────────────────────────────────────────────────────────────┐
│  Research → Specs → Plan → TDD Loop → Verify → Complete    │
└─────────────────────────────────────────────────────────────┘
```

**Phases:**
1. **Research** - Analyze codebase, identify patterns
2. **Specifications** - Define requirements, acceptance criteria
3. **Planning** - Break into components, define implementation order
4. **TDD Implementation** - For each component:
   - Write tests first
   - Implement to pass tests
   - Score quality
   - Iterate if below target
5. **Verification** - Final quality check
6. **Completion** - Merge and document

### Iterative Refinement

When you need to improve existing code:

```
┌─────────────────────────────────────────────────────────────┐
│  Analyze → Score → Improve → Re-score → Repeat until done  │
└─────────────────────────────────────────────────────────────┘
```

**Use for:**
- Code quality improvements
- Refactoring with safety nets
- Performance optimization
- Security hardening

### Human-in-the-Loop Workflows

When human judgment is required:

```
┌─────────────────────────────────────────────────────────────┐
│  Prepare → Breakpoint (wait) → Approved → Continue         │
└─────────────────────────────────────────────────────────────┘
```

**Breakpoint scenarios:**
- Production deployment approval
- Major architectural decisions
- Security-sensitive changes
- External integrations

---

## Example Workflows

### Example 1: Build a Todo App

```
Use the babysitter skill to build a complete todo app with:
- Next.js frontend
- SQLite database with Drizzle ORM
- Full CRUD operations
- TDD with 85% quality target
```

### Example 2: Add Authentication

```
Use babysitter to add user authentication:
- JWT-based auth
- Login/register/logout endpoints
- Protected routes
- Test coverage for auth flows
```

### Example 3: Refactor Module

```
Use the babysitter skill to refactor the payment module:
- Improve error handling
- Add input validation
- Increase test coverage to 90%
- Document public APIs
```

### Example 4: Security Audit

```
Use babysitter to audit the codebase for security issues:
- Check for common vulnerabilities
- Validate input sanitization
- Review authentication flows
- Create remediation plan with breakpoint approval
```

---

## Task Types

Babysitter supports different task types for different needs:

| Type | Use Case | Example |
|------|----------|---------|
| **Agent** | LLM-powered tasks | Planning, scoring, review |
| **Skill** | Claude Code skills | Code analysis, refactoring |
| **Breakpoint** | Human approval | Deployment gates, decisions |
| **Node** | Scripts | Build, test, deploy |
| **Shell** | Commands | File operations, git |

---

## Resuming Work

If a session ends or you need to continue later:

```
Resume the babysitter run for the todo app
```

Claude will:
1. Find the existing run
2. Check current state
3. Continue from where it left off

All progress is preserved in the event-sourced journal.

---

## Best Practices

### 1. Be Specific About Quality Targets

```
✅ "85% quality score with TDD"
❌ "make it good"
```

### 2. Use Breakpoints for Important Decisions

```
✅ "Add breakpoint approval before deploying"
❌ "Just deploy when done"
```

### 3. Define Clear Phases

```
✅ "Research, then plan, then implement"
❌ "Build everything"
```

### 4. Set Iteration Limits

```
✅ "Max 10 iterations, target 90% quality"
❌ "Keep improving forever"
```

---

## Performance Expectations

Understanding performance characteristics helps set realistic expectations for your workflows.

### Typical Execution Times

| Workflow Type | Size | Expected Duration | Notes |
|--------------|------|-------------------|-------|
| **Simple Build & Test** | Small | 30s - 2m | Single iteration, no agents |
| **TDD Feature** | Medium | 3m - 10m | 2-3 iterations with quality checks |
| **Complex Refactoring** | Large | 10m - 30m | 5+ iterations, extensive testing |
| **Full Application** | X-Large | 30m - 2h | Multiple phases, breakpoints |

### Performance Factors

**What affects execution time:**
1. **LLM API latency** - Agent tasks require API calls (typically 2-5s per call)
2. **Iteration count** - More iterations = longer runtime (quality convergence)
3. **Parallel tasks** - Up to 4x speedup for independent quality checks
4. **Task complexity** - Large codebases take longer to analyze
5. **Breakpoint delays** - Human approval time is not counted

### Optimization Strategies

**Speed up your workflows:**

1. **Use parallel execution** for independent tasks:
   ```javascript
   // Slow: Sequential (15s total)
   await ctx.task(lintTask, {});
   await ctx.task(testTask, {});
   await ctx.task(securityTask, {});

   // Fast: Parallel (5s total)
   await ctx.parallel.all([
     () => ctx.task(lintTask, {}),
     () => ctx.task(testTask, {}),
     () => ctx.task(securityTask, {})
   ]);
   ```

2. **Set iteration limits** to prevent runaway loops:
   ```
   Use babysitter with max 3 iterations for faster results
   ```

3. **Scope down agent tasks** - Smaller context = faster responses:
   ```javascript
   // Instead of analyzing entire codebase
   const analysis = await ctx.task(analyzeTask, { files: ['auth.js'] });
   ```

4. **Cache research results** - Reuse between iterations when possible

### Resource Usage

| Resource | Light Usage | Heavy Usage | Limits |
|----------|------------|-------------|--------|
| **Disk Space** | 1-5 MB/run | 50-100 MB/run | Clean old runs |
| **Memory** | 100-200 MB | 500 MB - 1 GB | Node.js heap |
| **Network** | Agent calls only | Continuous API usage | Rate limits |
| **CPU** | Minimal | Test/build tasks | Process-dependent |

**Monitoring disk usage:**
```bash
# Check total .a5c size
du -sh .a5c/

# List runs by size
du -h .a5c/runs/* | sort -h

# Clean old runs (optional)
rm -rf .a5c/runs/<old-run-id>
```

### Scalability Considerations

**Small projects (< 100 files):**
- Excellent performance
- Full codebase analysis feasible
- Multiple parallel runs possible

**Medium projects (100-1000 files):**
- Good performance
- Scope agent tasks to relevant files
- One run at a time recommended

**Large projects (1000+ files):**
- May need optimization
- Always scope agent tasks
- Consider splitting into sub-projects
- Monitor journal size (should stay < 10 MB)

---

## Security Best Practices

Babysitter handles code and credentials - follow these security guidelines for production use.

### General Security

**DO:**
- Review all code changes before final approval
- Use breakpoints before deploying to production
- Keep `.a5c/` directories out of version control (add to `.gitignore`)
- Regularly update to latest versions
- Run with least privilege necessary

**DON'T:**
- Commit `.a5c/` directories with sensitive data
- Run untrusted process definitions without review
- Expose breakpoints service publicly without authentication
- Store credentials in journal files

### Breakpoints Service Security

The breakpoints service requires external access - secure it properly:

**Production Setup:**

1. **Use HTTPS with ngrok/tunneling:**
   ```bash
   # Bad: HTTP exposed publicly
   ngrok http 3184

   # Better: Use authentication
   ngrok http 3184 --basic-auth "user:secure-password"
   ```

2. **Or use Telegram notifications:**
   - No public endpoint needed
   - Notifications via Telegram bot
   - Configure in breakpoints UI
   - More secure for production

3. **Firewall rules:**
   - Restrict access to known IPs
   - Use VPN for team access
   - Don't expose to 0.0.0.0 in production

**Example production setup:**
```bash
# Start with localhost only
npx -y @a5c-ai/babysitter-breakpoints@latest start --host 127.0.0.1

# Use SSH tunnel for remote access
ssh -L 3184:localhost:3184 production-server

# Or use Telegram (recommended)
# Configure in UI at http://localhost:3184
```

### Credential Management

**Handling secrets in workflows:**

1. **Environment variables** (recommended):
   ```javascript
   // In process definition
   const apiKey = process.env.API_KEY;
   await ctx.task(deployTask, { apiKey });
   ```

2. **Never hardcode credentials:**
   ```javascript
   // BAD - Don't do this!
   const apiKey = "sk-1234567890abcdef";

   // GOOD - Use environment variables
   const apiKey = process.env.API_KEY;
   ```

3. **Use breakpoints for sensitive operations:**
   ```javascript
   await ctx.breakpoint({
     question: 'Deploy with production credentials?',
     title: 'Production Deployment',
     context: { environment: 'production', critical: true }
   });
   ```

4. **Review journal files** before sharing:
   ```bash
   # Check for leaked secrets
   grep -i "password\|secret\|key\|token" .a5c/runs/*/journal/journal.jsonl
   ```

### Code Review Security

**Before approving breakpoints:**

1. **Review generated code** for security issues:
   - SQL injection vulnerabilities
   - XSS vulnerabilities
   - Insecure dependencies
   - Hardcoded secrets

2. **Check test coverage** for security tests:
   - Authentication tests
   - Authorization tests
   - Input validation tests
   - Error handling tests

3. **Run security scans** before approval:
   ```javascript
   const security = await ctx.task(securityScanTask, {
     tools: ['npm audit', 'eslint-plugin-security']
   });
   ```

### Network Security

**For distributed teams:**

1. **Use VPN** for breakpoints service access
2. **Implement authentication** on breakpoints UI
3. **Use HTTPS** for all external connections
4. **Audit access logs** regularly

### Compliance Considerations

**For regulated environments:**

- **Audit trail**: Journal provides complete event history
- **Approval gates**: Breakpoints create approval records
- **Access control**: Limit who can approve production deployments
- **Data retention**: Define policy for old run cleanup
- **Encryption**: Encrypt `.a5c/` directories if needed

---

## Monitoring and Observability

Track the health and performance of your Babysitter workflows.

### Built-in Monitoring

**Journal Events:**

Every action is logged in the journal. Monitor key events:

```bash
# Watch run progress in real-time
tail -f .a5c/runs/<runId>/journal/journal.jsonl | jq .

# Count iterations
jq 'select(.type=="ITERATION_STARTED")' .a5c/runs/*/journal/journal.jsonl | wc -l

# Track quality scores
jq 'select(.type=="QUALITY_SCORE") | .score' .a5c/runs/*/journal/journal.jsonl

# Find failed tasks
jq 'select(.type=="TASK_FAILED")' .a5c/runs/*/journal/journal.jsonl
```

**State Inspection:**

```bash
# Check current run state
cat .a5c/runs/<runId>/state.json | jq .

# View task results
ls -la .a5c/runs/<runId>/tasks/

# Check run status
jq '.status' .a5c/runs/<runId>/state.json
```

### Key Metrics to Track

| Metric | How to Measure | Target |
|--------|---------------|--------|
| **Success Rate** | Completed / Total runs | > 90% |
| **Avg Iterations** | Iterations per run | 2-3 for TDD |
| **Quality Score** | Final quality score | > 85 |
| **Duration** | Run completion time | < 10m typical |
| **Error Rate** | Failed tasks / Total | < 5% |

### Breakpoints Service Monitoring

**Health check:**
```bash
# Check if service is running
curl http://localhost:3184/health

# Expected response
{"status":"ok","uptime":12345}
```

**Breakpoint metrics:**
```bash
# Check breakpoints UI
open http://localhost:3184

# Monitor pending breakpoints
curl http://localhost:3184/api/breakpoints | jq '.[] | select(.status=="pending")'
```

### Custom Logging

**Add logging to process definitions:**

```javascript
export async function process(inputs, ctx) {
  ctx.log('Starting workflow', { inputs });

  const start = Date.now();
  const result = await ctx.task(someTask, {});
  const duration = Date.now() - start;

  ctx.log('Task completed', { duration, result });

  return result;
}
```

### Integration with External Monitoring

**Export metrics to monitoring systems:**

```javascript
// Example: Send metrics to Datadog/Prometheus
export async function process(inputs, ctx) {
  const result = await ctx.task(buildTask, {});

  // Hook to send metrics
  await ctx.hook('metrics', {
    metric: 'babysitter.build.duration',
    value: result.duration,
    tags: { status: result.success ? 'success' : 'failure' }
  });

  return result;
}
```

### Alerts and Notifications

**Set up alerts for critical events:**

1. **Run failures:**
   ```bash
   # Example: Alert on failed runs
   jq 'select(.type=="RUN_FAILED")' .a5c/runs/*/journal/journal.jsonl \
     | mail -s "Babysitter Run Failed" team@example.com
   ```

2. **Long-running workflows:**
   ```bash
   # Alert if run exceeds 30 minutes
   find .a5c/runs -name state.json -mmin +30 \
     -exec jq 'select(.status=="running")' {} \;
   ```

3. **Quality threshold breaches:**
   ```javascript
   const score = await ctx.task(qualityScoreTask, {});
   if (score.overall < 70) {
     await ctx.hook('alert', {
       severity: 'warning',
       message: `Quality below threshold: ${score.overall}/100`
     });
   }
   ```

### Debugging and Troubleshooting Monitoring

**Enable verbose logging:**

```bash
# Set environment variable for detailed logs
export BABYSITTER_LOG_LEVEL=debug
npx -y @a5c-ai/babysitter-sdk@latest run <args>
```

**Trace specific runs:**

```bash
# Extract full timeline for a run
jq 'select(.runId=="<runId>") | {type, timestamp, taskId}' \
  .a5c/runs/*/journal/journal.jsonl
```

---

## Troubleshooting

This section covers common errors with specific solutions.

### Error: "Run encountered an error"

**Symptom:**
```
Error: Run encountered an error
  at processIteration (process.js:123)
  Caused by: Journal conflict detected
```

**Cause:** Journal write conflict from concurrent operations or corrupted state.

**Solution:**
```bash
# 1. Check journal integrity
cat .a5c/runs/<runId>/journal/journal.jsonl | jq empty

# 2. If corrupted, Claude can analyze and recover
```
Then ask Claude:
```
Analyze the babysitter run error for <runId> and try to recover
```

**Prevention:** Avoid running multiple babysitter instances in the same directory simultaneously.

---

### Error: "Breakpoint not resolving"

**Symptom:**
```
Waiting for breakpoint approval...
Timeout after 300s
Error: Breakpoint bp-001 timed out
```

**Cause:** Breakpoints service not running or not accessible.

**Solution:**

1. **Check service status:**
   ```bash
   curl http://localhost:3184/health
   ```

2. **Start service if not running:**
   ```bash
   npx -y @a5c-ai/babysitter-breakpoints@latest start
   ```

3. **Check ngrok tunnel (if using):**
   ```bash
   ngrok http 3184
   # Note the public URL and verify access
   ```

4. **Verify breakpoint registration:**
   ```bash
   curl http://localhost:3184/api/breakpoints
   ```

**Prevention:** Start breakpoints service before running babysitter workflows.

---

### Error: "Session ended unexpectedly"

**Symptom:**
```
Claude Code session terminated
Run ID: 01KFFTSF8TK8C9GT3YM9QYQ6WG
Status: interrupted
```

**Cause:** Network issue, Claude Code crash, or manual exit.

**Solution:**
```
Resume the babysitter run 01KFFTSF8TK8C9GT3YM9QYQ6WG
```

Claude will:
- Load state from journal
- Continue from last completed task
- Preserve all progress

**Prevention:** Babysitter is designed to be resumable - interruptions are normal.

---

### Error: "Task execution failed: ENOENT"

**Symptom:**
```
Task failed: test-task-001
Error: ENOENT: no such file or directory
  at runTests (task.js:45)
```

**Cause:** Task trying to access non-existent file or command not found.

**Solution:**

1. **Check file paths in task definition:**
   ```javascript
   // Ensure paths are correct
   const testPath = path.join(__dirname, 'tests', 'auth.test.js');
   ```

2. **Verify dependencies installed:**
   ```bash
   npm install
   # or
   npm install jest supertest
   ```

3. **Check task working directory:**
   ```javascript
   ctx.log('Current directory:', process.cwd());
   ```

---

### Error: "Quality score not improving"

**Symptom:**
```
Iteration 5/5: Quality score 65/100
Target not met: 85/100
Run completed with quality below target
```

**Cause:** Issues preventing quality improvement (failing tests, low coverage, linting errors).

**Solution:**

1. **Review iteration logs** to identify blocking issues:
   ```bash
   jq 'select(.type=="TASK_COMPLETED")' .a5c/runs/<runId>/journal/journal.jsonl
   ```

2. **Check specific quality metrics:**
   - Test failures: `npm test`
   - Coverage: `npm run coverage`
   - Linting: `npm run lint`

3. **Increase iteration limit:**
   ```
   Resume the run with max 10 iterations
   ```

4. **Lower quality target if unrealistic:**
   ```
   Use babysitter with 75% quality target instead
   ```

---

### Error: "Agent task timeout"

**Symptom:**
```
Task timeout: agent-task-planning-001
Execution exceeded 120s
```

**Cause:** Agent task taking too long (large context, API issues, complex analysis).

**Solution:**

1. **Reduce agent task scope:**
   ```javascript
   // Instead of entire codebase
   const analysis = await ctx.task(analyzeTask, {
     files: ['src/auth.js'],  // Specific files only
     maxDepth: 2
   });
   ```

2. **Increase timeout (if necessary):**
   ```javascript
   await ctx.task(analyzeTask, { /* args */ }, {
     timeout: 300000  // 5 minutes
   });
   ```

3. **Check API status** if using external LLM providers.

---

### Error: "Cannot find module '@a5c-ai/babysitter-sdk'"

**Symptom:**
```
Error: Cannot find module '@a5c-ai/babysitter-sdk'
  at require (internal/modules/cjs/loader.js:883)
```

**Cause:** SDK not installed or wrong version.

**Solution:**
```bash
# Install globally
npm install -g @a5c-ai/babysitter-sdk

# Or locally in project
npm install @a5c-ai/babysitter-sdk

# Verify installation
npm list -g @a5c-ai/babysitter-sdk
```

---

### Error: "Plugin not found: babysitter@a5c.ai"

**Symptom:**
```
Error: Plugin 'babysitter@a5c.ai' not found
Available plugins: [...]
```

**Cause:** Plugin not installed in Claude Code.

**Solution:**
```bash
# In Claude Code
/plugin marketplace add a5c-ai/babysitter
/plugin install babysitter@a5c.ai

# Restart Claude Code
```

**Verification:**
```bash
# Check plugin list
/plugins

# Should see: babysitter@a5c.ai [active]
```

---

### Performance Issues

**Symptom:** Workflows running slower than expected.

**Diagnosis:**

1. **Check iteration count:**
   ```bash
   jq 'select(.type=="ITERATION_STARTED")' .a5c/runs/<runId>/journal/journal.jsonl | wc -l
   ```

2. **Identify slow tasks:**
   ```bash
   jq 'select(.type=="TASK_COMPLETED") | {taskId, duration}' \
     .a5c/runs/<runId>/journal/journal.jsonl | sort -k2 -n
   ```

3. **Review agent task complexity:**
   - Large context sizes
   - Unnecessary codebase analysis
   - Sequential when parallel possible

**Solutions:**
- Use parallel execution for independent tasks
- Reduce agent task scope
- Set iteration limits
- Increase quality threshold (lower target)

---

### Getting Additional Help

If issues persist:

1. **Check journal for details:**
   ```bash
   cat .a5c/runs/<runId>/journal/journal.jsonl | jq .
   ```

2. **Ask Claude to analyze:**
   ```
   Analyze the babysitter run <runId> and diagnose the error
   ```

3. **Report bugs:**
   - [GitHub Issues](https://github.com/a5c-ai/babysitter/issues)
   - Include run ID, error message, and journal excerpt

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Claude Code Session                                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Babysitter Skill (orchestrates via CLI)              │  │
│  └───────────────────────────────────────────────────────┘  │
│                           │                                  │
│                           ▼                                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  .a5c/runs/<runId>/                                   │  │
│  │  ├── journal.jsonl  (event log)                       │  │
│  │  ├── state.json     (current state)                   │  │
│  │  └── tasks/         (task artifacts)                  │  │
│  └───────────────────────────────────────────────────────┘  │
│                           │                                  │
│                           ▼                                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Breakpoints Service (human approval)                 │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Core Components

#### 1. Babysitter Skill Plugin

**Location:** `plugins/babysitter/skills/babysit/`

**Responsibilities:**
- Parses natural language commands into process inputs
- Orchestrates the run loop via SDK CLI
- Manages iteration lifecycle
- Handles resumption from saved state
- Reports progress to Claude Code

**Technology:** Claude Code Plugin System (JavaScript)

---

#### 2. Babysitter SDK

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

#### 3. Event-Sourced Journal

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

---

#### 4. Process Definitions

**Format:** JavaScript/TypeScript functions

**Execution Model:**

```
┌──────────────────────────────────────────────────────────┐
│ Process Definition (JavaScript)                          │
│                                                          │
│  export async function process(inputs, ctx) {           │
│    // User-defined orchestration logic                  │
│    const result = await ctx.task(someTask, args);       │
│    await ctx.breakpoint({ question: '...' });           │
│    return result;                                        │
│  }                                                       │
└──────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│ Context API (ctx)                                        │
│                                                          │
│  - ctx.task(task, args, opts)       Execute task        │
│  - ctx.breakpoint(opts)             Wait for approval   │
│  - ctx.parallel.all([...])          Run in parallel     │
│  - ctx.hook(name, data)             Trigger hooks       │
│  - ctx.log(msg, data)               Log to journal      │
│  - ctx.getState(key)                Access state        │
│  - ctx.setState(key, value)         Update state        │
└──────────────────────────────────────────────────────────┘
```

**Process Lifecycle:**

1. **Load**: Process definition loaded from file or default
2. **Initialize**: Context created with state and journal access
3. **Execute**: Process function called with inputs and context
4. **Iterate**: Process may loop internally or be called multiple times
5. **Complete**: Process returns final result

---

#### 5. Task Execution System

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
┌─────────────────────────────────────────────────────────┐
│ Task Request                                            │
│ ctx.task(taskDef, args, opts)                           │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ Task Validation                                         │
│ - Validate arguments                                    │
│ - Check dependencies                                    │
│ - Generate task ID                                      │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ Journal Event: TASK_STARTED                             │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ Execute Task                                            │
│ - Agent: Call LLM API                                   │
│ - Skill: Invoke Claude Code skill                       │
│ - Node: Run JavaScript function                         │
│ - Shell: Execute command                                │
│ - Breakpoint: Wait for approval                         │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ Journal Event: TASK_COMPLETED or TASK_FAILED            │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ Return Result                                           │
│ - Success: Return task output                           │
│ - Failure: Throw error or return error object           │
└─────────────────────────────────────────────────────────┘
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

---

#### 6. Breakpoints Service

**Package:** `@a5c-ai/babysitter-breakpoints`

**Architecture:**

```
┌────────────────────────────────────────────────────────┐
│ Web UI (http://localhost:3184)                         │
│ - View pending breakpoints                             │
│ - Approve/reject with comments                         │
│ - Review context and history                           │
└────────────────┬───────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────┐
│ REST API                                               │
│ - POST /api/breakpoints      Create breakpoint         │
│ - GET /api/breakpoints       List breakpoints          │
│ - POST /api/breakpoints/:id  Approve/reject            │
│ - GET /health                Health check              │
└────────────────┬───────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────┐
│ In-Memory State                                        │
│ - Active breakpoints                                   │
│ - Pending approvals                                    │
│ - Response handlers                                    │
└────────────────┬───────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────┐
│ Notification Integrations (Optional)                   │
│ - Telegram bot                                         │
│ - Email                                                │
│ - Slack (future)                                       │
└────────────────────────────────────────────────────────┘
```

**Communication Flow:**

1. **Request**: Task executor creates breakpoint via POST
2. **Poll**: Task executor polls for response (long-polling)
3. **Notify**: Service sends notification (Telegram/email)
4. **Review**: Human reviews context in UI
5. **Respond**: Human approves/rejects
6. **Resume**: Task executor receives response, continues

**Technology:** Node.js, Express, WebSockets (optional)

---

### Data Flow

**Complete Request Flow:**

```
1. User Command
   │
   └──> Claude Code
        │
        └──> Babysitter Skill
             │
             ├──> Parse intent
             ├──> Load/create run
             └──> CLI: npx -y @a5c-ai/babysitter-sdk@latest run:iterate
                  │
                  └──> SDK Process Engine
                       │
                       ├──> Load process definition
                       ├──> Replay journal → restore state
                       ├──> Execute process function
                       │    │
                       │    ├──> ctx.task() → Execute tasks
                       │    │    │
                       │    │    ├──> Append TASK_STARTED
                       │    │    ├──> Run executor (agent/skill/node/shell)
                       │    │    └──> Append TASK_COMPLETED
                       │    │
                       │    └──> ctx.breakpoint() → Wait for approval
                       │         │
                       │         ├──> POST to breakpoints service
                       │         ├──> Append BREAKPOINT_REQUESTED
                       │         ├──> Poll for response
                       │         └──> Append BREAKPOINT_APPROVED
                       │
                       ├──> Append iteration events to journal
                       ├──> Save state cache
                       └──> Return results to skill
                            │
                            └──> Report to Claude Code
                                 │
                                 └──> Display to user
```

---

### State Management

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

### Extensibility

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

---

### Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Plugin** | JavaScript | Claude Code integration |
| **SDK** | TypeScript + Node.js | Core orchestration engine |
| **Process Definitions** | JavaScript/TypeScript | User workflow logic |
| **Journal** | JSONL (text files) | Event persistence |
| **Breakpoints Service** | Node.js + Express | Human approval UI/API |
| **CLI** | Commander.js | Command-line interface |

---

### Design Patterns

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

## Limitations and Known Issues

### Current Limitations

1. **Windows Support**: Some shell commands may require WSL or Git Bash on Windows systems
2. **Concurrent Runs**: Running multiple babysitter processes simultaneously in the same directory may cause journal conflicts
3. **Large Codebases**: Performance may degrade with very large repositories (>100k files)
4. **Network Dependency**: Breakpoints require the breakpoints service to be running and accessible
5. **LLM Token Limits**: Very large task outputs may exceed context window limits

### Known Issues

- **Journal Conflicts**: In rare cases, concurrent writes to the journal may cause corruption. Use the resume command to recover.
- **Breakpoint Timeout**: Breakpoints may timeout if the service is not properly configured or accessible
- **State Serialization**: Some complex objects may not serialize properly in the state cache

For the latest issues and workarounds, see our [GitHub Issues](https://github.com/a5c-ai/babysitter/issues).

---

## FAQ

### General Questions

**Q: What is the difference between Babysitter and regular Claude Code?**
A: Babysitter adds orchestration capabilities to Claude Code, enabling deterministic workflows, quality convergence loops, human approval gates, and resumable sessions with full audit trails.

**Q: Do I need to know programming to use Babysitter?**
A: No. You interact with Babysitter using natural language. Just ask Claude to use the babysitter skill with your requirements.

**Q: Can I use Babysitter with other AI tools?**
A: Babysitter is specifically designed for Claude Code, but the underlying orchestration concepts could be adapted for other systems.

### Installation and Setup

**Q: Why do I need the breakpoints service?**
A: The breakpoints service provides a UI for human-in-the-loop approval. Without it, breakpoints will fail. You can expose it via ngrok or configure Telegram notifications.

**Q: Can I run babysitter offline?**
A: Yes, but breakpoints require network access to the breakpoints service. All other features work offline.

**Q: How much disk space does babysitter use?**
A: The `.a5c/runs/` directory stores all run data. A typical run uses 1-10MB. You can safely delete old runs to reclaim space.

### Usage Questions

**Q: How do I pause a babysitter run?**
A: Simply close Claude Code. The run is automatically saved and can be resumed later with the resume command.

**Q: Can I edit the process definition for a running workflow?**
A: No. Process definitions are fixed when a run starts. You can create a new run with a different process.

**Q: How do I debug a failed run?**
A: Check the journal at `.a5c/runs/<runId>/journal/journal.jsonl` for the full event history. Ask Claude to analyze it.

**Q: Can I run multiple tasks in parallel?**
A: Yes. Use `ctx.parallel.all([...])` in your process definition to run independent tasks concurrently.

### Quality and Testing

**Q: What is a quality score?**
A: Quality scores are LLM-generated assessments of code quality based on tests, coverage, linting, security, and other metrics you define.

**Q: How do I set a quality target?**
A: Include it in your prompt: "Use babysitter with TDD and 85% quality target"

**Q: Can I customize quality scoring?**
A: Yes. You can define custom agent tasks that score based on your specific criteria.

---

## Contributing

We welcome contributions from the community! Here's how you can help:

### Ways to Contribute

- **Report bugs**: Open an issue on [GitHub](https://github.com/a5c-ai/babysitter/issues)
- **Suggest features**: Share your ideas for improvements
- **Submit pull requests**: Fix bugs or add features
- **Improve documentation**: Help make our docs clearer
- **Share examples**: Contribute example workflows and processes

### Development Setup

1. Fork the repository on GitHub
2. Clone your fork locally
3. Install dependencies: `npm install`
4. Make your changes
5. Test thoroughly
6. Submit a pull request

### Contribution Guidelines

- Follow existing code style and conventions
- Write clear commit messages
- Add tests for new features
- Update documentation as needed
- Be respectful and collaborative

For detailed guidelines, see [CONTRIBUTING.md](https://github.com/a5c-ai/babysitter/blob/main/CONTRIBUTING.md) (if available).

---

## Community and Support

### Get Help

- **GitHub Issues**: [Report bugs or request features](https://github.com/a5c-ai/babysitter/issues)
- **GitHub Discussions**: [Ask questions and share ideas](https://github.com/a5c-ai/babysitter/discussions)
- **Documentation**: [Full specification and guides](https://github.com/a5c-ai/babysitter)

### Stay Connected

- **GitHub**: [github.com/a5c-ai/babysitter](https://github.com/a5c-ai/babysitter)
- **npm**: [@a5c-ai/babysitter-sdk](https://www.npmjs.com/package/@a5c-ai/babysitter-sdk)

### Star History

<a href="https://star-history.com/#a5c-ai/babysitter&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=a5c-ai/babysitter&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=a5c-ai/babysitter&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=a5c-ai/babysitter&type=Date" />
 </picture>
</a>

### Contributors

Thanks to all the contributors who have helped make Babysitter better!

<a href="https://github.com/a5c-ai/babysitter/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=a5c-ai/babysitter" />
</a>

### Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please be respectful, professional, and considerate in all interactions.

---

## License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2025 A5C AI

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

See [LICENSE.md](https://github.com/a5c-ai/babysitter/blob/main/LICENSE.md) for full details.

---

## Further Reading

### Internal Documentation

- `plugins/babysitter/skills/babysit/SKILL.md` - Detailed skill reference
- `plugins/babysitter/skills/babysit/process/` - Example processes
- `plugins/babysitter/BABYSITTER_PLUGIN_SPECIFICATION.md` - Full specification

### External Resources

- [Claude Code Documentation](https://claude.com/claude-code)
- [Event Sourcing Pattern](https://martinfowler.com/eaaDev/EventSourcing.html)
- [Test-Driven Development](https://en.wikipedia.org/wiki/Test-driven_development)

---

<div align="center">

**Built with Claude by A5C AI**

[⬆ Back to Top](#babysitter)

</div>
