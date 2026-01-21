# Babysitter

> **Orchestrate complex, multi-step workflows with human-in-the-loop approval, iterative refinement, and quality convergence.**

Babysitter enables Claude Code to manage sophisticated development workflows through deterministic, resumable orchestration. Just ask Claude to use the babysitter skill, and it will handle the rest.

---

## Installation

### 1. Install the SDK

```bash
npm install -g @a5c-ai/babysitter-sdk @a5c-ai/babysitter-breakpoints
```

### 2. Install the Plugin

**Via Claude Code (Recommended):**

```bash
# Add the plugin repository
/plugin marketplace add a5c-ai/babysitter

# Install the plugin
/plugin install babysitter@a5c.ai
```

Then restart Claude Code if prompted.

**Manual Installation (Alternative):**

```bash
# Clone the repo and copy the plugin
git clone https://github.com/a5c-ai/babysitter.git /tmp/babysitter
cp -r /tmp/babysitter/plugins/babysitter ~/.claude/plugins/
rm -rf /tmp/babysitter
```

### 3. Verify Installation

In Claude Code, type `/skills` to verify "babysit" appears in the list.

### 4. Run the babysitter breakpoints service

In a new terminal, run the following command:

```bash
npx -y @a5c-ai/babysitter-breakpoints start
```

This will start the babysitter breakpoints service at http://localhost:3184

You can either:

1. use a tunneling service like ngrok to expose the service to the internet:

```bash
ngrok http 3184
```

OR

2. configure the telegram extension of the breakpoints service. (from the breakpoints ui)

---

## Quick Start

Simply ask Claude to use the babysitter skill:

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

## Troubleshooting

### "Run encountered an error"

The run's journal may have conflicts. Claude can analyze and recover:

```
Analyze the babysitter run error and try to recover
```

### "Breakpoint not resolving"

Ensure the breakpoints service is running:

```bash
npx @a5c-ai/babysitter-breakpoints start
```

### "Session ended unexpectedly"

Resume the run to continue:

```
Resume the babysitter run and check status
```

---

## Architecture Overview

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

**Key concepts:**
- **Runs** - Orchestration instances with full history
- **Journal** - Append-only event log for reproducibility
- **Tasks** - Atomic units of work (agent, skill, breakpoint)
- **Breakpoints** - Human approval gates

---

## Further Reading

- `plugins/babysitter/skills/babysit/SKILL.md` - Detailed skill reference
- `plugins/babysitter/skills/babysit/process/` - Example processes
- `plugins/babysitter/BABYSITTER_PLUGIN_SPECIFICATION.md` - Full specification
