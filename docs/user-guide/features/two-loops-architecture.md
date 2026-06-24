[Docs](../index.md) › [Features](./index.md) › Two-Loops Architecture

# Two-Loops Architecture: Understanding Hybrid Agentic Systems

**Version:** 1.1
**Last Updated:** 2026-06-23
**Category:** Feature Guide

---

## TL;DR - What You Need to Know

**Skip this section if you just want to USE babysitter.** This document explains the architecture for those who want to understand WHY babysitter works the way it does, or who are building custom processes.

**The key insight:** Babysitter separates "what must happen" (deterministic rules) from "how to do it" (AI reasoning). This is what makes the product triad possible:

1. **Deterministic process execution** — the boss loop is real code; the orchestrator can only do what it permits, and state is event-sourced for deterministic replay.
2. **Complex agentic workflows** — the worker loop handles tasks, breakpoints, sleeps, parallel dispatch, dependencies, and sub-agent delegation across harnesses.
3. **Policy / process adherence (obedience)** — a mandatory stop after every step, a process check, and a permit/halt decision. **Enforcement, not assistance — gates block progression until satisfied; they're not suggestions.**

```
┌─────────────────────────────────────────────────────────────────┐
│  LOOP 1: The Boss (Orchestrator)                                │
│  - "You must pass tests before deploying"                       │
│  - "You have max 10 attempts"                                   │
│  - "Stop and ask for approval at this point"                    │
│                                                                 │
│  LOOP 2: The Worker (AI Agent)                                  │
│  - "Figure out how to make these tests pass"                    │
│  - "Find and fix the bugs"                                      │
│  - "Write the code that solves the problem"                     │
└─────────────────────────────────────────────────────────────────┘
```

**When to read this document:**
- You're building custom processes
- You want to understand guardrails and safety
- You're debugging why a run behaves a certain way
- You're an architect evaluating babysitter for your team

**When to skip this document:**
- You just want to run existing processes
- You're following a tutorial
- You're a beginner (start with the [Getting Started overview](../getting-started/README.md) instead; [Quality Convergence](./quality-convergence.md) covers one gate type once you're ready)

---

## On this page

- [Overview](#overview)
- [The Core Building Blocks](#the-core-building-blocks)
- [The Two Loops in Detail](#the-two-loops-in-detail)
- [What Goes Where?](#what-goes-where)
- [The Four Guardrail Layers](#the-four-guardrail-layers)
- [Quality Gates: Turning Agentic Work into Reliable Outcomes](#quality-gates-turning-agentic-work-into-reliable-outcomes)
- [The Journal: Making Execution Testable](#the-journal-making-execution-testable)
- [The Doctrine](#the-doctrine)

---

## Overview

Babysitter implements a **Two-Loops Control Plane** architecture that combines:

1. **Symbolic Orchestration** (Process Engine): Deterministic, code-defined control
2. **Agentic Harness** (LLM Runtime): Adaptive, AI-powered work execution

This hybrid approach delivers the best of both worlds: the reliability of deterministic systems with the flexibility of AI reasoning.

> **Where the loops run (v6):** The symbolic orchestration loop runs on the harness-agnostic **[Adapters](./adapters.md) runtime**, not on any single harness's lifecycle. The orchestration loop is kept alive turn-to-turn by a continuation mechanism that **varies by harness** — Claude Code uses a `Stop` hook, others use their own equivalents — which the Hooks Adapter normalizes into one contract. See [Hooks](./hooks.md) for the per-harness continuation models. The two-loops concept is unchanged; it simply now sits on top of Adapters.

### Why Two Loops?

| Single-Loop AI | Two-Loops Hybrid |
|----------------|------------------|
| Unpredictable behavior | Bounded, testable autonomy |
| Hard to debug | Journaled, replayable execution |
| No safety guarantees | Enforced guardrails and gates |
| "It seems done" | Evidence-driven completion |
| Context degradation | Fresh context per task |

---

## The Core Building Blocks

### A) Symbolic Orchestrator (Process Engine)

The orchestrator is the code-defined process that enforces:

| Responsibility | Example |
|----------------|---------|
| **Ground truth state** | Run is in "implementation" phase |
| **Progression rules** | Must pass tests before deployment |
| **Invariants** | Never modify production directly |
| **Budgets** | Max 10 iterations, 30 min timeout |
| **Permissions** | Only write to `src/` directory |
| **Quality gates** | Tests, lint, security must pass |
| **Journaling** | Every event recorded for replay |
| **Time travel** | Fork from any point, compare runs |

**The orchestrator owns making execution dependable.**

### B) Agent Harness (LLM Runtime)

The harness is not "just an LLM call." Modern harnesses include:

| Capability | Description |
|------------|-------------|
| Iterative planning | Plan → Execute → Replan |
| Tool calling | Files, terminal, search, code execution |
| Command execution | Parse results, handle errors |
| Incremental fixes | Iterate until checks pass |
| Structured artifacts | Plans, diffs, summaries |
| Multi-step reasoning | With constraints |
| Sub-agents | Delegation inside the harness |

**The harness owns solving fuzzy parts and adapting to feedback.**

### C) Symbolic Logic Surfaces (Shared Capabilities)

Symbolic logic appears in **multiple places**, all consistent:

1. **Inside orchestrator** (stage transitions, invariants, gates, budgets)
2. **As symbolic tools** callable by the harness (policy checks, gate evaluation)
3. **As symbolic tasks** callable by orchestration (validators, analyzers)

```javascript
// Symbolic logic as orchestrator rule (using loop for retry)
for (let iteration = 0; iteration < maxIterations; iteration++) {
  const impl = await ctx.task(implementTask, { feature });
  const testResults = await ctx.task(runTestsTask, { impl });

  if (testResults.passed) break; // Success - exit loop
  // Loop continues with feedback from failed tests
}

// Symbolic logic as tool callable by harness
const allowed = await ctx.task(policyCheckTask, {
  action: 'modifyFile',
  path: '/etc/config.json'
});

// Symbolic logic as validation task
const gateResult = await ctx.task(securityGateTask, {
  files: impl.filesModified
});
```

---

## The Two Loops in Detail

### Loop 1: Orchestration Loop (Symbolic)

A process stepper that progresses a run through explicit stages. It runs on the harness-agnostic [Adapters](./adapters.md) runtime; the mechanism that advances it each turn depends on the harness (see [Hooks](./hooks.md)).

**Typical Cycle:**

```
1. Reconstruct "what is true" from the journal
2. Determine what stage the run is in
3. Check gates/constraints/budgets
4. Choose the next allowed transition
5. Emit the next effect (or wait)
6. Record results back into the journal
```

**This loop is about:** control, safety, repeatability, traceability.

### Loop 2: Agentic Loop (Harness)

A tool-using reasoning loop that iterates until reaching a local objective.

**Typical Cycle:**

```
1. Read current objective + constraints
2. Decide what evidence is needed
3. Call tools, inspect results
4. Update plan or actions
5. Produce an output (patch, plan, answer, report)
```

**This loop is about:** solving the task when information is incomplete.

---

## What Goes Where?

The design challenge is deciding **which execution decisions are deterministic/symbolic** and **which are adaptive/agentic**.

### Put in Symbolic Logic When...

These decisions must be **stable, enforceable, and auditable**:

| Decision Type | Examples |
|---------------|----------|
| **Safety/permissions** | What actions are allowed |
| **Budgets/limits** | Time, cost, tool call limits |
| **State transitions** | What stage you're in |
| **Concurrency rules** | What can run in parallel |
| **Retry/timeout policy** | What happens on failure |
| **Idempotency** | Avoid double execution |
| **Quality gates** | What proof is required |
| **Compliance/audit** | Logging requirements |

### Put in Agent Harness When...

These decisions benefit from **flexible reasoning**:

| Decision Type | Examples |
|---------------|----------|
| **Ambiguous instructions** | "Make it better" |
| **Uncertain approach** | Multiple valid solutions |
| **Search/discovery** | Find relevant files |
| **Drafting** | Code, docs, analyses |
| **Debugging** | Iterate against tool results |
| **Summarizing** | Compress evidence |
| **Proposing** | Candidate solutions |

### The Mixed Zone

Many tasks are mixed. The pattern is:
- **Symbolic logic defines the envelope** (constraints + gates + budgets)
- **Harness explores inside that envelope** (implements, debugs, refines)
- **Both can invoke symbolic rules** (nothing is guesswork)

```javascript
// Mixed: Harness works, orchestrator validates (loop-based retry)
let securityPassed = false;
for (let iteration = 0; iteration < maxIterations && !securityPassed; iteration++) {
  const impl = await ctx.task(implementTask, {
    feature,
    constraints: {
      allowedPaths: ['src/**'],
      forbiddenPatterns: ['eval(', 'exec('],
      maxFilesModified: 10
    },
    // Pass previous feedback on retry iterations
    feedback: iteration > 0 ? lastSecurityResult.recommendations : null
  });

  // Orchestrator enforces gate
  const securityResult = await ctx.task(securityGateTask, { impl });
  securityPassed = securityResult.passed;
  lastSecurityResult = securityResult;
}
```

---

## The Four Guardrail Layers

Guardrails are a **layered approach**, not a single feature.

### Layer A: Capability Guardrails (What's Possible)

Define what tools and actions exist.

```javascript
const capabilityConfig = {
  allowedTools: ['read', 'write', 'shell', 'search'],
  pathRestrictions: ['src/**', 'tests/**'],
  networkAccess: 'none',
  permissions: 'read-write',
  destructiveActions: 'require-confirmation'
};
```

### Layer B: Budget Guardrails (How Far)

Prevent runaway execution.

```javascript
const budgetConfig = {
  maxToolCalls: 100,
  maxWallClockMinutes: 30,
  maxTokenSpend: 50000,
  maxIterations: 10,
  rateLimits: { apiCalls: '10/minute' }
};
```

### Layer C: Policy Guardrails (What's Allowed)

Rules that define acceptable behavior.

```javascript
const policyConfig = {
  rules: [
    'never exfiltrate secrets',
    'never modify production directly',
    'always run tests before merge',
    'security scans required for dependencies'
  ]
};
```

### Layer D: Behavioral Guardrails (How Decisions Are Made)

Structural consistency in outputs.

```javascript
const behavioralConfig = {
  requireStructuredOutputs: true,
  requireEvidenceCitations: true,
  requireUncertaintyDeclaration: true,
  outputSchemas: { /* JSON schemas */ }
};
```

---

## Quality Gates: Turning Agentic Work into Reliable Outcomes

Quality gates are one consequence of code-defined gates: because the orchestrator only advances when the process permits, you can encode a gate that demands evidence before progression — converting "it seems done" into "it is done." Quality convergence is one such gate type, not the product thesis.

### The Evidence-Driven Pattern

Each phase must end with:

| Component | Description |
|-----------|-------------|
| **Artifact** | The work product (patch, doc, config, report) |
| **Evidence** | Proof it meets requirements (logs, test output, checks) |

**If you don't have evidence, you don't have completion.**

### Common Gated Steps

| Gate Type | What It Validates |
|-----------|-------------------|
| Unit tests | Individual functions work |
| Integration tests | Components work together |
| System tests | End-to-end behavior |
| Acceptance tests | User requirements met |
| Lint/formatting | Code style compliance |
| Type checking | Type safety |
| Static analysis | Potential bugs |
| Security scans | Vulnerabilities |
| Reproducibility | Clean run in fresh env |
| Diff review | No forbidden file changes |
| Performance | Meets thresholds |

### Where Gates Live (Consistent Everywhere)

```javascript
// In orchestrator: loop-based retry for gate failures
let gateResults = { passed: false };
for (let i = 0; i < maxIterations && !gateResults.passed; i++) {
  const impl = await ctx.task(implementTask, { feature, feedback: gateResults.failures });
  gateResults = await ctx.task(runGatesTask, { impl });
}

// As symbolic tool: harness pre-checks during work
const gateResult = await checkGate(impl);
if (!gateResult.passed) {
  // Harness can immediately attempt repair
  await repairIssues(gateResult.failures);
}

// As symbolic task: verify evidence objectively
const evidence = await ctx.task(gateValidatorTask, { impl });
```

### Human Approval Gates

For high-impact steps, include explicit checkpoints:

```javascript
// Plan approval before execution
await ctx.breakpoint({
  question: 'Review the plan. Approve to proceed with implementation?',
  title: 'Plan Approval',
  context: { /* ... */ }
});

// Diff approval before merge
await ctx.breakpoint({
  question: `Review the diff (${diff.linesChanged} lines). Approve to merge?`,
  title: 'Merge Approval'
});

// Deployment approval
await ctx.breakpoint({
  question: 'Quality: 92/100. Deploy to production?',
  title: 'Production Deployment'
});
```

---

## The Journal: Making Execution Testable

A [journaled](../reference/glossary.md) control plane turns agentic behavior into something you can:

| Capability | Value |
|------------|-------|
| **Replay** | Debug by re-running |
| **Inspect** | See exactly what happened |
| **Diff** | Compare across forks |
| **Audit** | Compliance evidence |
| **Analyze** | Failure pattern detection |

### What's Journaled

| Event Type | Example |
|------------|---------|
| **Inputs/signals** | Initial requirements |
| **Stage transitions** | "planning" → "implementation" |
| **Requested actions** | `writeFile('/src/auth.ts', ...)` |
| **Results** | Action succeeded, 42 lines written |
| **Artifacts** | `plan.md`, `implementation.patch` |
| **Evidence** | Test results, gate outcomes |
| **Gate outcomes** | Security: PASS, Tests: PASS |
| **Approvals** | User approved at breakpoint |

---

## Prompt Quality is Determinism Engineering

In a two-loop system, prompts are **configuration for the harness**.

### Why Prompt Quality Matters

Better prompts reduce:
- Output variance
- Tool misuse
- Hidden assumptions
- Inconsistent formatting
- Unpredictable branching

Better prompts improve:
- Repeatability
- Debuggability
- Fork comparisons
- Safe automation

### The Real Goal: Structural Consistency

You don't need identical wording. You need consistent:
- Decision formats
- Priorities
- Stop/ask conditions
- Evidence standards

### Prompt Versioning

Treat harness prompts like engineering surfaces:

```javascript
const promptVersion = '2.1.0';

const implementerPrompt = {
  version: promptVersion,
  role: 'senior software engineer',
  task: 'Implement feature according to specification',
  constraints: [
    'Follow existing code patterns',
    'Write tests for all public functions',
    'Document complex logic',
    'Ask for clarification if requirements are ambiguous'
  ],
  outputFormat: {
    type: 'object',
    required: ['filesModified', 'summary', 'confidence']
  }
};
```

---

## Common Failure Modes and Fixes

### 1. Everything is Agentic

**Symptom:** Unpredictable behavior, hard to debug, inconsistent safety.

**Fix:** Move gates, budgets, and invariants into symbolic orchestration.

### 2. Everything is Symbolic

**Symptom:** Brittle workflows, poor adaptation, high maintenance.

**Fix:** Delegate fuzzy decisions and exploration to the harness.

### 3. Hidden State

**Symptom:** The harness "remembers" things the system never logged.

**Fix:** Journal what matters; the system's truth must be reconstructible.

### 4. Wide Tool Surface

**Symptom:** Tool confusion, increased risk, unpredictable results.

**Fix:** Keep tools small, stable, and well-described.

### 5. No Explicit Evidence Requirements

**Symptom:** "Done" claims without proof.

**Fix:** Define completion as artifact + evidence, enforced by gates.

---

## The Doctrine

If you define only a few principles, make them these:

1. **The orchestrator owns** run progression, journaling, and phase boundaries
2. **Symbolic logic owns** constraints, permissions, budgets, and gates
3. **The harness owns** adaptive work inside constraints
4. **Guardrails are enforced** by symbolic checks, not informal intentions
5. **Quality is evidence-driven**, not assertion-driven
6. **Prompts are versioned** control surfaces for harness behavior
7. **The journal is the source** of truth for replay, audit, and forking

---

## Getting Started

If you're building from scratch:

1. **Define phases** (a small symbolic process)
2. **Define effects/tools** available in each phase
3. **Add budgets and permissions**
4. **Decide quality gates per phase**
5. **Add a harness** that can do real work
6. **Journal everything** needed for replay and audit
7. **Add fork + time travel** as first-class operations

**If you do only one thing:** make completion require evidence.

---

## Process Library Examples

### Spec-Driven Development

`methodologies/spec-driven-development.js`

Implements the full two-loops pattern:
- **Symbolic:** Constitution validation, plan-constitution alignment, consistency analysis
- **Agentic:** Specification writing, planning, implementation
- **Gates:** Every phase has approval breakpoints

### V-Model

`methodologies/v-model.js`

Heavy on symbolic verification:
- **Four test levels** designed before implementation
- **Traceability matrix** ensures complete coverage
- **Safety levels** adjust rigor

### GSD Iterative Convergence

`gsd/iterative-convergence.js`

Feedback-driven quality loop:
- **Implement → Score → Feedback → Repeat**
- **Breakpoints** at quality thresholds
- **Plateau detection** for early exit

---

## Related Documentation

- [Quality Convergence](./quality-convergence.md) - Five quality gate types and 90-score pattern
- [Best Practices](./best-practices.md) - Workflow design and guardrail patterns
- [Process Definitions](./process-definitions.md) - Creating your own processes
- [Journal System](./journal-system.md) - Event sourcing and replay
- [Breakpoints](./breakpoints.md) - Human-in-the-loop approval
- [Adapters](./adapters.md) - The harness-agnostic runtime the orchestration loop runs on
- [Hooks](./hooks.md) - Per-harness continuation models that advance the loop

---

## Summary

The Two-Loops architecture enables bounded, testable autonomy:

- **Orchestration Loop** provides control, safety, and traceability
- **Agentic Loop** provides capability, adaptation, and problem-solving
- **Quality Gates** turn "seems done" into "is done" with evidence
- **Guardrails** enforce rules at capability, budget, policy, and behavioral levels
- **Journaling** makes everything replayable and auditable

When done well, you get **autonomy that is bounded, testable, and steadily improvable**.

---

## SDK API Quick Reference

The complete list of SDK intrinsics (functions available on `ctx`):

| Function | Purpose | Example |
|----------|---------|---------|
| `ctx.task(taskDef, args)` | Execute a task | `await ctx.task(buildTask, { target: 'dist' })` |
| `ctx.breakpoint(opts)` | Pause for human approval | `await ctx.breakpoint({ question: 'Deploy?', title: 'Approval' })` |
| `ctx.parallel.all([...])` | Run tasks in parallel | `await ctx.parallel.all([() => ctx.task(a), () => ctx.task(b)])` |
| `ctx.parallel.map(arr, fn)` | Map over array in parallel | `await ctx.parallel.map(files, f => ctx.task(lint, { file: f }))` |
| `ctx.sleepUntil(iso8601)` | Pause until a specific time | `await ctx.sleepUntil('2026-01-27T10:00:00Z')` |
| `ctx.log(msg, data?)` | Log message to journal | `ctx.log('Quality score', { score: 85 })` |
| `ctx.now()` | Get current time (deterministic) | `const ts = ctx.now().getTime()` |
| `ctx.runId` | Current run identifier | `const id = ctx.runId` |

**Important:** There is NO `ctx.retry()`. Use loops for retry logic:

```javascript
// Correct: Loop-based retry
for (let i = 0; i < maxIterations && !passed; i++) {
  const result = await ctx.task(implementTask, { feedback });
  passed = result.testsPass;
  feedback = result.errors;
}
```

---

## What To Do Next

Based on your role, here's your next step:

| If you are... | Do this next |
|---------------|--------------|
| **Beginner** | Read [Quality Convergence](./quality-convergence.md) for the core iteration pattern |
| **Building processes** | Study [Best Practices](./best-practices.md) for workflow design |
| **Debugging a run** | Check [Journal System](./journal-system.md) to understand event sourcing |
| **Adding approvals** | See [Breakpoints](./breakpoints.md) for human-in-the-loop patterns |
| **Evaluating for team** | Review the Four Guardrail Layers section above |

---

## Next steps

- **Next:** [Quality Convergence](./quality-convergence.md)
- **Related:** [Best Practices](./best-practices.md), [Architecture Overview](./architecture-overview.md)
