# First Run Deep Dive: Understanding What Happened

**Time:** 10 minutes | **Level:** Beginner | **Prerequisites:** [Completed the Quickstart](./quickstart.md)

In the quickstart, you built a calculator with a single command and watched Babysitter iterate to quality. Now let's understand exactly what happened under the hood. This knowledge will help you use Babysitter more effectively and debug issues when they arise.

---

## Table of Contents

- [The Anatomy of a Babysitter Run](#the-anatomy-of-a-babysitter-run)
- [Understanding the Run Directory](#understanding-the-run-directory)
- [The Event Journal Explained](#the-event-journal-explained)
- [How Quality Convergence Works](#how-quality-convergence-works)
- [The TDD Methodology in Action](#the-tdd-methodology-in-action)
- [Configuration and Customization](#configuration-and-customization)
- [Verifying Success](#verifying-success)
- [Next Steps](#next-steps)

---

## The Anatomy of a Babysitter Run

When you typed `/babysitter:call create a calculator with TDD and 80% quality target`, here's the sequence of events:

```
Your Command
    |
    v
+-------------------+
| 1. Parse Request  |  Babysitter interprets your natural language
+-------------------+
    |
    v
+-------------------+
| 2. Create Run     |  A unique run ID and directory are created
+-------------------+
    |
    v
+-------------------+
| 3. Load Process   |  TDD Quality Convergence process is loaded
+-------------------+
    |
    v
+-------------------+
| 4. Execute Phases |  Research -> Specs -> TDD Loop
+-------------------+
    |
    v
+-------------------+
| 5. Quality Loop   |  Iterate until target (80%) is met
+-------------------+
    |
    v
+-------------------+
| 6. Complete       |  Final results and summary
+-------------------+
```

### Step-by-Step Breakdown

#### Step 1: Parse Request
Babysitter analyzed your prompt and extracted:
- **Goal:** Create a calculator module
- **Methodology:** TDD (Test-Driven Development)
- **Quality Target:** 80%
- **Max Iterations:** 5 (default)

#### Step 2: Create Run
A unique run was created with:
- **Run ID:** `01KFFTSF8TK8C9GT3YM9QYQ6WG` (ULID format)
- **Directory:** `.a5c/runs/01KFFTSF8TK8C9GT3YM9QYQ6WG/`
- **Journal:** Empty, ready to record events

#### Step 3: Load Process
The TDD Quality Convergence process was loaded. This defines:
- Which phases to execute
- How to measure quality
- When to iterate vs. complete

#### Step 4: Execute Phases
The process ran through:
1. **Research Phase:** Analyzed your codebase
2. **Specification Phase:** Defined what to build
3. **Implementation Phase:** TDD loop (write tests, implement, score)

#### Step 5: Quality Loop
Within the implementation phase:
- **Iteration 1:** Score 72/100 (below 80% target)
- **Iteration 2:** Score 88/100 (above target - success!)

#### Step 6: Complete
Run marked as complete, final summary generated.

---

## Understanding the Run Directory

Let's explore what Babysitter created. Navigate to your run directory:

```bash
cd .a5c/runs/
ls
```

You'll see your run ID (e.g., `01KFFTSF8TK8C9GT3YM9QYQ6WG`). Let's explore its structure:

```
.a5c/runs/01KFFTSF8TK8C9GT3YM9QYQ6WG/
|
+-- journal/
|   +-- journal.jsonl     # Event log (source of truth)
|
+-- state/
|   +-- state.json        # Current state cache (derived)
|
+-- tasks/
|   +-- task-001/         # Task artifacts
|   +-- task-002/
|   +-- ...
|
+-- artifacts/
|   +-- specifications.md # Generated specs
|   +-- plan.md          # Implementation plan
|
+-- code/
    +-- main.js          # Process definition used
```

### Key Files Explained

#### journal/journal.jsonl
The **source of truth**. Every event is appended here. This file is:
- Append-only (never modified, only added to)
- Human-readable (JSON Lines format)
- The basis for session resumption

#### state/state.json
A **derived cache** of current state. This is:
- Rebuilt from journal if deleted
- Used for fast state access
- Not the source of truth (journal is)

#### tasks/
Contains **artifacts from each task**:
- Input parameters
- Output results
- Logs and intermediate files

#### artifacts/
**Generated documents** like:
- Specifications
- Plans
- Reports

---

## The Event Journal Explained

The journal is the heart of Babysitter's persistence. Let's examine it:

```bash
cat .a5c/runs/01KFFTSF8TK8C9GT3YM9QYQ6WG/journal/journal.jsonl
```

### Journal Event Types

Here's what each event type means:

#### Run Lifecycle Events

```jsonl
{"type":"RUN_STARTED","runId":"01KFF...","timestamp":"2026-01-25T14:30:12Z","inputs":{...}}
{"type":"RUN_COMPLETED","status":"success","timestamp":"2026-01-25T14:34:45Z"}
```

- `RUN_STARTED`: A new run began with specific inputs
- `RUN_COMPLETED`: Run finished (success or failed)

#### Phase Events

```jsonl
{"type":"PHASE_STARTED","phase":"research","timestamp":"..."}
{"type":"PHASE_COMPLETED","phase":"research","timestamp":"..."}
```

Marks the beginning and end of major phases (research, specification, implementation).

#### Iteration Events

```jsonl
{"type":"ITERATION_STARTED","iteration":1,"timestamp":"..."}
{"type":"ITERATION_COMPLETED","iteration":1,"timestamp":"..."}
```

Tracks each pass through the quality loop.

#### Task Events

```jsonl
{"type":"TASK_STARTED","taskId":"agent-001","taskType":"agent","args":{...}}
{"type":"TASK_COMPLETED","taskId":"agent-001","result":{...},"duration":25000}
{"type":"TASK_FAILED","taskId":"agent-002","error":"..."}
```

Records individual task execution (agent calls, skill invocations, scripts).

#### Quality Events

```jsonl
{"type":"QUALITY_SCORE","iteration":1,"score":72,"metrics":{"coverage":75,"tests":11}}
{"type":"QUALITY_SCORE","iteration":2,"score":88,"metrics":{"coverage":92,"tests":12}}
```

Captures quality assessments after each iteration.

#### Breakpoint Events

```jsonl
{"type":"BREAKPOINT_REQUESTED","breakpointId":"bp-001","question":"Deploy to prod?"}
{"type":"BREAKPOINT_APPROVED","breakpointId":"bp-001","approver":"user","timestamp":"..."}
```

Records human approval checkpoints (if any were requested).

**Note on breakpoint modes:** These events are recorded regardless of whether the breakpoint was handled:
- **Interactively** (via AskUserQuestion in Claude Code chat), or
- **Non-interactively** (via the breakpoints web UI at http://localhost:3184)

### Why Event Sourcing Matters

The journal enables:

1. **Deterministic Replay:** Given the same inputs and journal, you get the same state
2. **Session Resumption:** Replay events to restore exactly where you left off
3. **Audit Trail:** Complete history of what happened and when
4. **Debugging:** Trace through events to find issues

---

## How Quality Convergence Works

Quality convergence is Babysitter's core value proposition. Here's how it works:

### The Quality Loop

```
        +------------------+
        |  Write Tests     |
        +------------------+
               |
               v
        +------------------+
        |  Implement Code  |
        +------------------+
               |
               v
        +------------------+
        |  Run Quality     |
        |  Checks          |
        +------------------+
               |
               v
        +------------------+
        |  Score Quality   |---> Score >= Target? ---> Done!
        +------------------+           |
               ^                       | No
               |                       v
               +-----------------------+
                    Continue loop
```

### Quality Metrics

For your calculator run, these metrics were evaluated:

| Metric | Iteration 1 | Iteration 2 | Weight |
|--------|-------------|-------------|--------|
| Tests Passing | 11/12 (92%) | 12/12 (100%) | 40% |
| Code Coverage | 75% | 92% | 30% |
| Linting | 2 warnings | 0 warnings | 15% |
| Complexity | Low | Low | 15% |

**Weighted Score Calculation:**
- Iteration 1: `(0.92 * 40) + (0.75 * 30) + (0.80 * 15) + (1.0 * 15) = 72`
- Iteration 2: `(1.0 * 40) + (0.92 * 30) + (1.0 * 15) + (1.0 * 15) = 88`

### Agent-Based Scoring

The quality score isn't just automated metrics. An AI agent also evaluates:
- Code readability
- Best practices adherence
- Error handling quality
- Documentation completeness

This hybrid approach catches issues that pure metrics miss.

### Setting Quality Targets

You can customize targets in your prompts:

```
# Conservative (high quality)
/babysitter:call build feature with TDD and 90% quality target

# Balanced (default-ish)
/babysitter:call build feature with TDD and 80% quality target

# Fast (lower quality, fewer iterations)
/babysitter:call build feature with TDD and 70% quality target
```

Higher targets = more iterations = longer runtime = higher quality

---

## TDD Quality Convergence in Action

The quickstart used the **TDD Quality Convergence** methodology. TDD (shorthand used throughout this guide) combines test-first development with iterative quality improvement. Here's what it does:

### Phase 1: Research

**Purpose:** Understand the context before coding

**What happens:**
- Analyze existing codebase structure
- Identify coding patterns and conventions
- Detect test framework (Jest, Mocha, etc.)
- Note dependencies and constraints

**Output:** Research summary with recommendations

### Phase 2: Specifications

**Purpose:** Define what to build before building it

**What happens:**
- Create detailed specifications from your request
- Define function signatures and interfaces
- List test cases to write
- Create implementation plan

**Output:** `artifacts/specifications.md`

### Phase 3: TDD Implementation Loop

**Purpose:** Build with quality through iteration

**Each iteration:**
1. **Write Tests First**
   - Create test files with test cases
   - Tests should fail (code doesn't exist yet)

2. **Implement Code**
   - Write minimal code to pass tests
   - Follow specifications from Phase 2

3. **Run Quality Checks**
   - Execute tests
   - Measure coverage
   - Run linting
   - Check complexity

4. **Score Quality**
   - Calculate weighted score
   - Compare to target
   - If below target, identify improvements

5. **Iterate or Complete**
   - Below target? Fix issues and repeat
   - Above target? Mark as complete

### Why TDD Works Well with Babysitter

TDD and Babysitter are a natural fit because:

1. **Clear success criteria:** Tests define when you're done
2. **Measurable progress:** Test pass rate and coverage are numbers
3. **Incremental improvement:** Each iteration fixes specific test failures
4. **Quality guarantee:** Passing tests = working code

---

## Configuration and Customization

You can customize Babysitter's behavior in several ways:

### Via Prompt Parameters

```bash
# Set quality target
/babysitter:call build API with 85% quality target

# Set max iterations
/babysitter:call build API with max 10 iterations

# Combine options
/babysitter:call build API with TDD, 90% quality, max 8 iterations
```

### Via Process Selection

Different methodologies for different needs:

| Methodology | Best For | Quality Focus |
|-------------|----------|---------------|
| TDD Quality Convergence | Feature development | High |
| GSD (Get Shit Done) | Quick prototypes | Medium |
| Spec-Kit | Complex specifications | High |

```bash
# Explicit methodology selection
/babysitter:call build feature using TDD methodology
/babysitter:call prototype using GSD methodology
```

### Via Iteration Limits

Prevent runaway loops:

```bash
# Low limit (fast, may not reach target)
/babysitter:call build feature with max 3 iterations

# High limit (thorough, takes longer)
/babysitter:call build feature with max 15 iterations
```

If max iterations reached without meeting quality target, Babysitter completes with a warning.

---

## Verifying Success

How do you know your Babysitter run succeeded? Here's a checklist:

### Success Indicators

| Check | How to Verify | Expected |
|-------|---------------|----------|
| Run completed | Check run summary | "Run completed successfully" |
| Quality met | Check final score | Score >= your target |
| Tests passing | Run `npm test` | All tests pass |
| Files created | `ls` your directory | New implementation files |
| Journal complete | Check last event | `RUN_COMPLETED` with success |

### Verification Commands

```bash
# Check run status
cat .a5c/runs/<runId>/state/state.json | jq '.status'
# Expected: "completed"

# Check final quality score
cat .a5c/runs/<runId>/journal/journal.jsonl | grep QUALITY_SCORE | tail -1 | jq '.score'
# Expected: >= your target

# Run tests manually
npm test
# Expected: All passing

# Check for the implementation
ls -la calculator.js calculator.test.js
# Expected: Both files exist
```

### What If Something Went Wrong?

**Run failed:**
```bash
# Check the journal for error events
cat .a5c/runs/<runId>/journal/journal.jsonl | grep -E "(FAILED|ERROR)" | jq .
```

**Quality not reached:**
```bash
# See all quality scores
cat .a5c/runs/<runId>/journal/journal.jsonl | grep QUALITY_SCORE | jq '.score'
```

**Incomplete run:**
```bash
# Resume and continue
claude "/babysitter:call resume the babysitter run <runId>"
```

---

## Hands-On Exercise: Analyze Your Run

Let's practice what you've learned. Complete these exercises:

### Exercise 1: Count Iterations

How many iterations did your run take?

```bash
# Your command here:
cat .a5c/runs/<your-run-id>/journal/journal.jsonl | grep ITERATION_STARTED | wc -l
```

**Answer:** Should match the "Iterations: X of 5" in your summary

### Exercise 2: Find Quality Progression

What was the quality score after each iteration?

```bash
# Your command here:
cat .a5c/runs/<your-run-id>/journal/journal.jsonl | grep QUALITY_SCORE | jq '.score'
```

**Expected:** Scores increasing until target met (e.g., 72, 88)

### Exercise 3: Identify Tasks

How many tasks were executed?

```bash
# Your command here:
cat .a5c/runs/<your-run-id>/journal/journal.jsonl | grep TASK_STARTED | wc -l
```

### Exercise 4: Check Run Duration

How long did the run take?

```bash
# Find start and end times
cat .a5c/runs/<your-run-id>/journal/journal.jsonl | grep -E "(RUN_STARTED|RUN_COMPLETED)" | jq '.timestamp'
```

---

## Key Concepts Summary

### Terms to Remember

| Term | Definition |
|------|------------|
| **Run** | A single execution of a Babysitter workflow |
| **Run ID** | Unique identifier for a run (ULID format) |
| **Journal** | Append-only event log, source of truth |
| **Iteration** | One pass through the quality loop |
| **Quality Score** | Weighted metric combining tests, coverage, etc. |
| **Breakpoint** | Human approval checkpoint |
| **Process** | Definition of workflow phases and logic |

### Key Files

| File | Purpose |
|------|---------|
| `journal/journal.jsonl` | Event log (never delete!) |
| `state/state.json` | State cache (can be rebuilt) |
| `tasks/` | Task artifacts |
| `artifacts/` | Generated documents |

### Important Commands

```bash
# View journal
cat .a5c/runs/<runId>/journal/journal.jsonl | jq .

# Check run status
cat .a5c/runs/<runId>/state/state.json | jq '.status'

# Resume a run
claude "Resume the babysitter run <runId>"

# List all runs
ls -la .a5c/runs/
```

---

## Next Steps

Now that you understand what happened in your first run, you're ready to explore more:

### Immediate Next Steps

1. **Try Different Quality Targets**
   ```
   /babysitter:call add validation to calculator with 90% quality
   ```

2. **Experience Breakpoints**
   ```
   /babysitter:call refactor calculator with breakpoint approval before changes
   ```
   Claude will ask you directly in the chat when approval is needed!

   (For non-interactive mode, you'd approve at http://localhost:3184)

3. **Test Session Resumption**
   - Start a longer run
   - Interrupt it (Ctrl+C or close Claude Code)
   - Resume with `/babysitter:call resume`

### This Week

- [ ] Read [TDD Methodology Deep Dive](../features/quality-convergence.md)
- [ ] Try the [GSD Methodology](../features/process-library.md) for faster prototyping
- [ ] Set up [Telegram Notifications](../features/breakpoints.md#telegram-setup) for mobile approvals

### Coming Up

- [ ] Learn about [Parallel Execution](../features/parallel-execution.md)
- [ ] Create [Custom Processes](../features/process-definitions.md)

---

## Quick Reference Card

Print this for your desk:

```
BABYSITTER QUICK REFERENCE
==========================

START A RUN:
  /babysitter:call <request> with TDD and <X>% quality

RESUME A RUN:
  /babysitter:call resume
  /babysitter:call resume --run-id <id>

VIEW JOURNAL:
  cat .a5c/runs/<id>/journal/journal.jsonl | jq .

CHECK STATUS:
  cat .a5c/runs/<id>/state/state.json | jq '.status'

QUALITY SCORES:
  grep QUALITY_SCORE journal.jsonl | jq '.score'

BREAKPOINTS:
  Interactive (Claude Code): Handled in chat - no setup!
  Non-Interactive: npx -y @a5c-ai/babysitter-breakpoints@latest start
  Web UI (non-interactive): http://localhost:3184

LIST ALL RUNS:
  ls .a5c/runs/

KEY EVENT TYPES:
  RUN_STARTED, RUN_COMPLETED
  ITERATION_STARTED, QUALITY_SCORE
  TASK_STARTED, TASK_COMPLETED
  BREAKPOINT_REQUESTED, BREAKPOINT_APPROVED
```

---

Congratulations! You now understand how Babysitter works under the hood. This knowledge will help you use it more effectively, debug issues when they arise, and eventually create your own custom processes.

**Happy orchestrating!**
