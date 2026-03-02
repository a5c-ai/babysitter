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
+-- run.json              # Run metadata
+-- inputs.json           # Run inputs
|
+-- journal/
|   +-- 000001.<ulid>.json  # Event log (individual JSON files, source of truth)
|   +-- 000002.<ulid>.json
|   +-- ...
|
+-- state/
|   +-- state.json        # Current state cache (derived)
|
+-- tasks/
|   +-- <effectId>/       # Task artifacts per effect
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

#### journal/ (individual JSON files)
The **source of truth**. Each event is stored as an individual JSON file named `{SEQ}.{ULID}.json` (e.g., `000001.01ARZ3NDEKTSV4RRFFQ69G5FAV.json`). This directory is:
- Append-only (files are never modified, only new files are added)
- Human-readable (each file is a standalone JSON document)
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
# List all journal events (each is an individual JSON file)
ls .a5c/runs/01KFFTSF8TK8C9GT3YM9QYQ6WG/journal/

# View a specific event
cat .a5c/runs/01KFFTSF8TK8C9GT3YM9QYQ6WG/journal/000001.*.json | jq .
```

### Journal Event Types

Here's what each event type means:

#### Run Lifecycle Events

Each event is stored as an individual JSON file in `journal/` with the naming pattern `{SEQ}.{ULID}.json`. The event schema is:

```json
// 000001.<ulid>.json
{"type":"RUN_CREATED","recordedAt":"2026-01-25T14:30:12Z","data":{"runId":"01KFF...","inputs":{}},"checksum":"sha256hex..."}

// (final event, e.g., 000012.<ulid>.json)
{"type":"RUN_COMPLETED","recordedAt":"2026-01-25T14:34:45Z","data":{"status":"success"},"checksum":"sha256hex..."}
```

- `RUN_CREATED`: A new run began with specific inputs
- `RUN_COMPLETED`: Run finished successfully
- `RUN_FAILED`: Run finished with an error

**Note:** The `seq` number is derived from the filename, not stored in the event body. Each event includes a `checksum` field (sha256 hex) for integrity verification.

#### Effect Events

Effects represent tasks and interactions that Babysitter delegates (agent calls, skill invocations, scripts, breakpoints). There are exactly two effect event types:

```json
// EFFECT_REQUESTED: An effect (task) has been requested
// e.g., 000003.<ulid>.json
{"type":"EFFECT_REQUESTED","recordedAt":"2026-01-25T14:30:45Z","data":{"effectId":"<effectId>","kind":"agent","args":{}},"checksum":"sha256hex..."}

// EFFECT_RESOLVED: An effect has completed (successfully or with error)
// e.g., 000004.<ulid>.json
{"type":"EFFECT_RESOLVED","recordedAt":"2026-01-25T14:31:10Z","data":{"effectId":"<effectId>","status":"ok","result":{}},"checksum":"sha256hex..."}

// EFFECT_RESOLVED with error status
// e.g., 000005.<ulid>.json
{"type":"EFFECT_RESOLVED","recordedAt":"2026-01-25T14:31:15Z","data":{"effectId":"<effectId>","status":"error","error":"..."},"checksum":"sha256hex..."}
```

- `EFFECT_REQUESTED`: Records when a task, agent call, or breakpoint is initiated
- `EFFECT_RESOLVED` (status: ok): Records successful completion of an effect
- `EFFECT_RESOLVED` (status: error): Records when an effect fails

Task artifacts are stored in `tasks/<effectId>/` directories containing `task.json`, `input.json`, `result.json`, `output.json`, `stdout.log`, and `stderr.log`.

#### Breakpoint Events

Breakpoints are modeled as effects. When human approval is needed:

```json
// Breakpoint requested as an effect
{"type":"EFFECT_REQUESTED","recordedAt":"...","data":{"effectId":"<effectId>","kind":"breakpoint","question":"Deploy to prod?"},"checksum":"sha256hex..."}

// Breakpoint resolved (approved or rejected)
{"type":"EFFECT_RESOLVED","recordedAt":"...","data":{"effectId":"<effectId>","status":"ok","approver":"user"},"checksum":"sha256hex..."}
```

**Note on breakpoint modes:** These events are recorded regardless of whether the breakpoint was handled:
- **Interactively** (via AskUserQuestion in Claude Code chat), or
- **Non-interactively** (via the breakpoints web UI at http://localhost:3184)

**Note on quality tracking:** Quality scores and iteration/phase progress are not tracked as separate event types in the journal. Quality metrics can be tracked within effect data or via custom application logic on top of the five core event types: `RUN_CREATED`, `EFFECT_REQUESTED`, `EFFECT_RESOLVED`, `RUN_COMPLETED`, and `RUN_FAILED`.

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

# View the last journal event (check for RUN_COMPLETED)
ls .a5c/runs/<runId>/journal/ | sort | tail -1 | xargs -I {} cat .a5c/runs/<runId>/journal/{} | jq '.type'
# Expected: "RUN_COMPLETED"

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
# Check the journal for RUN_FAILED or error events
for f in .a5c/runs/<runId>/journal/*.json; do cat "$f" | jq 'select(.type == "RUN_FAILED" or (.type == "EFFECT_RESOLVED" and .data.status == "error"))'; done
```

**Quality not reached:**
```bash
# View all EFFECT_RESOLVED events to check task results
for f in .a5c/runs/<runId>/journal/*.json; do cat "$f" | jq 'select(.type == "EFFECT_RESOLVED")'; done
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
# Your command here (count EFFECT_REQUESTED events as a proxy for tasks per iteration):
for f in .a5c/runs/<your-run-id>/journal/*.json; do cat "$f" | jq -r 'select(.type == "EFFECT_REQUESTED") | .type'; done | wc -l
```

**Answer:** The number of effects requested gives you insight into the work performed across iterations.

### Exercise 2: Find Quality Progression

What was the quality score after each iteration?

```bash
# Your command here (view all EFFECT_RESOLVED events to see task results):
for f in .a5c/runs/<your-run-id>/journal/*.json; do cat "$f" | jq 'select(.type == "EFFECT_RESOLVED") | .data'; done
```

**Expected:** Effect results showing progression toward quality target.

### Exercise 3: Identify Tasks

How many tasks were executed?

```bash
# Your command here:
for f in .a5c/runs/<your-run-id>/journal/*.json; do cat "$f" | jq -r 'select(.type == "EFFECT_REQUESTED") | .type'; done | wc -l
```

### Exercise 4: Check Run Duration

How long did the run take?

```bash
# Find start and end times (first and last journal files)
cat .a5c/runs/<your-run-id>/journal/$(ls .a5c/runs/<your-run-id>/journal/ | sort | head -1) | jq '.recordedAt'
cat .a5c/runs/<your-run-id>/journal/$(ls .a5c/runs/<your-run-id>/journal/ | sort | tail -1) | jq '.recordedAt'
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
| `journal/*.json` | Event log as individual JSON files (never delete!) |
| `state/state.json` | State cache (can be rebuilt) |
| `tasks/` | Task artifacts |
| `artifacts/` | Generated documents |

### Important Commands

```bash
# View all journal events
for f in .a5c/runs/<runId>/journal/*.json; do cat "$f" | jq .; done

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
  for f in .a5c/runs/<id>/journal/*.json; do cat "$f" | jq .; done

CHECK STATUS:
  cat .a5c/runs/<id>/state/state.json | jq '.status'

BREAKPOINTS:
  Interactive (Claude Code): Handled in chat - no setup!
  Non-Interactive: npx -y @a5c-ai/babysitter-sdk@latest breakpoints:start
  Web UI (non-interactive): http://localhost:3184

LIST ALL RUNS:
  ls .a5c/runs/

KEY EVENT TYPES (exactly 5):
  RUN_CREATED, RUN_COMPLETED, RUN_FAILED
  EFFECT_REQUESTED, EFFECT_RESOLVED

JOURNAL FORMAT:
  Individual JSON files: journal/{SEQ}.{ULID}.json
  Fields: type, recordedAt, data, checksum
```

---

Congratulations! You now understand how Babysitter works under the hood. This knowledge will help you use it more effectively, debug issues when they arise, and eventually create your own custom processes.

**Happy orchestrating!**
