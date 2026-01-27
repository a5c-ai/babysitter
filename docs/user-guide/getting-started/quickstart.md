# Quickstart: Your First Babysitter Run

**Time:** 10 minutes | **Level:** Beginner | **Prerequisites:** [Installation complete](./installation.md)

Welcome! In this quickstart, you will build a calculator module using Test-Driven Development (TDD) with Babysitter. By the end, you will have experienced:

- Automatic quality convergence (iterate until quality target met)
- The TDD workflow (tests first, then implementation)
- Journal-based persistence (everything is recorded)

**Note:** TDD Quality Convergence is the full name; we use "TDD" as shorthand throughout this guide.

Let's get started!

---

## What You Will Build

A simple calculator module with:
- `add(a, b)` - Add two numbers
- `subtract(a, b)` - Subtract two numbers
- `multiply(a, b)` - Multiply two numbers
- `divide(a, b)` - Divide two numbers (with error handling)

The result will include:
- Working implementation
- Test suite with multiple test cases
- 80%+ quality score achieved through automatic iteration

---

## Before You Begin

### Verify Installation

Quick check that everything is working:

```bash
# In your terminal
npx -y @a5c-ai/babysitter-sdk@latest --version
```

You should see a version number. If not, revisit the [installation guide](./installation.md).

### Breakpoints Service (Optional)

**Good news!** If you're using Claude Code interactively (which you probably are), **you don't need to start any service**. Breakpoints will be handled directly in the chat.

**Only start the breakpoints service if:**
- You're running workflows in CI/CD pipelines
- You need team members to approve via web UI
- You want mobile notifications via Telegram

<details>
<summary>Click to see breakpoints service setup (optional)</summary>

Open a **new terminal window** and run:

```bash
npx -y @a5c-ai/babysitter-breakpoints@latest start
```

Keep this terminal open. You should see:
```
Babysitter Breakpoints Service
Listening on http://localhost:3184
```

</details>

### Open Your Project

Navigate to your project directory (or create a new one):

```bash
# Create a new project directory
mkdir my-babysitter-project
cd my-babysitter-project

# Initialize npm (optional but recommended)
npm init -y
```

---

## Step 1: Launch Your First Run

Open Claude Code in your project directory and enter this command:

```
/babysit create a calculator module with add, subtract, multiply, and divide functions using TDD with 80% quality target
```

**Alternative (natural language):**
```
Use the babysitter skill to build a calculator module with TDD and 80% quality target
```

### What You Should See

Babysitter will start and show output like:

```
Creating new babysitter run: calculator-20260125-143012
Process: TDD Quality Convergence
Target Quality: 80%

Run ID: 01KFFTSF8TK8C9GT3YM9QYQ6WG
Run Directory: .a5c/runs/01KFFTSF8TK8C9GT3YM9QYQ6WG/
```

Babysitter is now orchestrating your TDD workflow!

---

## Step 2: Watch the Magic Happen

Sit back and observe as Babysitter works through the TDD methodology:

### Phase 1: Research (~30 seconds)

```
[Phase 1] Research
- Analyzing project structure... done
- Checking existing patterns... done
- Identifying test framework... done
```

Babysitter examines your codebase to understand the context.

### Phase 2: Specifications (~1 minute)

```
[Phase 2] Specifications
- Defining calculator interface...
- Specifying test cases...
- Creating implementation plan...

Specifications complete:
- 4 functions defined
- 12 test cases planned
- Jest test framework selected
```

Babysitter creates a clear specification before coding.

### Phase 3: TDD Implementation Loop

This is where the magic happens. Babysitter iterates until quality is achieved:

#### Iteration 1:

```
[Iteration 1/5] Starting TDD implementation...

Writing tests:
- add.test.js: 3 test cases
- subtract.test.js: 3 test cases
- multiply.test.js: 3 test cases
- divide.test.js: 3 test cases (including error handling)

Implementing code:
- calculator.js: add, subtract, multiply, divide functions

Quality checks:
- Tests: 11/12 passing
- Coverage: 75%
- Linting: 2 warnings

Quality Score: 72/100 (target: 80)
Below target, continuing...
```

#### Iteration 2:

```
[Iteration 2/5] Refining implementation...

Fixes:
- Fixed divide by zero test
- Improved edge case handling
- Resolved lint warnings

Quality checks:
- Tests: 12/12 passing
- Coverage: 92%
- Linting: 0 warnings

Quality Score: 88/100 (target: 80)
Target achieved!
```

---

## Step 3: Review the Results

When Babysitter completes, you'll see a summary:

```
Run completed successfully!

Summary:
- Iterations: 2 of 5
- Final Quality Score: 88/100
- Test Coverage: 92%
- Tests: 12 passing
- Duration: 3m 45s

Files created:
- calculator.js
- calculator.test.js

Run ID: 01KFFTSF8TK8C9GT3YM9QYQ6WG
Journal: .a5c/runs/01KFFTSF8TK8C9GT3YM9QYQ6WG/journal/
```

### Explore What Was Created

Check your project directory:

```bash
ls -la
```

You should see new files:
```
calculator.js       # Your calculator implementation
calculator.test.js  # Test suite
.a5c/              # Babysitter run data
```

### View the Calculator Code

Open `calculator.js`:

```javascript
// calculator.js - Created by Babysitter TDD workflow

function add(a, b) {
  return a + b;
}

function subtract(a, b) {
  return a - b;
}

function multiply(a, b) {
  return a * b;
}

function divide(a, b) {
  if (b === 0) {
    throw new Error('Cannot divide by zero');
  }
  return a / b;
}

module.exports = { add, subtract, multiply, divide };
```

### Run the Tests Yourself

```bash
npm test
# or
npx jest
```

**Expected output:**
```
PASS  ./calculator.test.js
  Calculator
    add
      ✓ adds two positive numbers
      ✓ adds negative numbers
      ✓ adds zero
    subtract
      ✓ subtracts two numbers
      ...

Test Suites: 1 passed, 1 total
Tests:       12 passed, 12 total
```

---

## Step 4: Explore the Journal

Every action Babysitter took is recorded in the journal. Let's explore:

```bash
# View the journal
cat .a5c/runs/01KFFTSF8TK8C9GT3YM9QYQ6WG/journal/journal.jsonl | head -20
```

**Sample output:**
```jsonl
{"type":"RUN_STARTED","runId":"01KFFTSF8TK8C9GT3YM9QYQ6WG","timestamp":"2026-01-25T14:30:12Z"}
{"type":"PHASE_STARTED","phase":"research","timestamp":"2026-01-25T14:30:13Z"}
{"type":"TASK_STARTED","taskId":"research-001","taskType":"agent"}
{"type":"TASK_COMPLETED","taskId":"research-001","duration":25000}
{"type":"ITERATION_STARTED","iteration":1,"timestamp":"2026-01-25T14:31:00Z"}
{"type":"QUALITY_SCORE","iteration":1,"score":72}
{"type":"ITERATION_STARTED","iteration":2,"timestamp":"2026-01-25T14:33:00Z"}
{"type":"QUALITY_SCORE","iteration":2,"score":88}
{"type":"RUN_COMPLETED","status":"success","timestamp":"2026-01-25T14:34:45Z"}
```

This is the audit trail. Every decision, every iteration, every quality score - all recorded.

---

## Step 5: Try a Quick Modification

Let's see how easy it is to extend your calculator. Ask Babysitter to add more features:

```
/babysit add a power function and square root function to the calculator with TDD
```

Babysitter will:
1. Analyze the existing calculator
2. Write new tests for power and sqrt
3. Implement the new functions
4. Iterate until quality is achieved

---

## What Just Happened?

Let's recap what Babysitter did for you:

### Without Babysitter (Manual Approach)

1. You: "Claude, write tests for a calculator"
2. You: "Now implement the calculator"
3. You: "Run the tests... 2 failed. Fix them."
4. You: "Check coverage... too low. Add more tests."
5. You: "Run tests again... passed!"
6. You: (repeat if you want higher quality)

**Time:** 20-30 minutes with multiple back-and-forth interactions

### With Babysitter (Automated Approach)

1. You: "/babysit create calculator with TDD, 80% quality"
2. (Babysitter handles everything automatically)
3. Done!

**Time:** ~5 minutes, hands-free

### Key Takeaways

1. **Quality Convergence:** You set 80% target, Babysitter iterated until it achieved 88%
2. **TDD Methodology:** Tests were written before implementation
3. **Complete Audit Trail:** Every action logged in the journal
4. **No Context Loss:** If interrupted, you can resume exactly where you left off

---

## Bonus: Experience Session Resumption

One of Babysitter's superpowers is persistence. Let's try it:

### Start a Long-Running Task

```
/babysit build a REST API for task management with authentication, using TDD with 85% quality target and max 10 iterations
```

### Interrupt It

Close Claude Code or press Ctrl+C while it's running.

### Resume Later

Open Claude Code again and run:

```
Resume the babysitter run
```

or

```
/babysit resume
```

Babysitter will:
1. Find the interrupted run
2. Replay the journal to restore state
3. Continue from exactly where it stopped

No work lost!

---

## Common First-Run Issues

### "Nothing happens after I type the command"

**Cause:** Plugin may not be loaded.

**Solution:**
1. Check `/skills` shows "babysit"
2. Restart Claude Code if needed
3. Verify plugin is enabled: `claude plugin list`

### "Breakpoint timeout" error

**Cause (Interactive Mode):** You may have missed the question in the chat or the session timed out.

**Solution (Interactive Mode):**
- Scroll up to find the breakpoint question and respond
- Or resume the run: `claude "Resume the babysitter run"`

**Cause (Non-Interactive Mode):** Breakpoints service not running.

**Solution (Non-Interactive Mode):**
```bash
# In a separate terminal
npx -y @a5c-ai/babysitter-breakpoints@latest start
```

### Quality score not reaching target

**Cause:** Target may be too high for the task complexity.

**Solution:**
- Lower the target (try 70% instead of 90%)
- Increase max iterations: `--max-iterations 10`
- Be more specific in your request

### Run seems stuck

**Cause:** Waiting for breakpoint approval (if breakpoints are configured).

**Solution (Interactive Mode):**
- Look for a question from Claude in your chat
- Respond to approve and continue the workflow

**Solution (Non-Interactive Mode):**
- Open http://localhost:3184 to check for pending approvals
- Approve the breakpoint to continue

---

## Next Steps

Congratulations! You've completed your first Babysitter run. Here's what to explore next:

### Immediate Next Steps

1. **[First Run Deep Dive](./first-run.md)** - Understand exactly what happened in detail
2. **Try different prompts:**
   - `/babysit refactor the calculator for better error handling`
   - `/babysit add comprehensive documentation to the calculator`
   - `/babysit increase test coverage to 95%`

### This Week

3. **Explore methodologies:**
   - TDD (Test-Driven Development) - what you just used
   - GSD (Get Shit Done) - faster, less formal
   - Spec-Kit - specification-driven development

4. **Configure breakpoints** for approval workflows

### Advanced Topics

5. **Custom quality targets** and scoring criteria
6. **Parallel execution** for faster runs
7. **Custom process definitions** (for power users)

---

## Quick Reference

Commands used in this quickstart:

```bash
# Start a TDD run with quality target (in Claude Code)
/babysit <description> with TDD and <X>% quality target

# Resume an interrupted run
/babysit resume

# View run journal
cat .a5c/runs/<runId>/journal/journal.jsonl

# List all runs
ls .a5c/runs/

# (Optional) Start breakpoints service for non-interactive/CI mode
npx -y @a5c-ai/babysitter-breakpoints@latest start
```

---

## Summary

In just 10 minutes, you:

- Built a calculator module with TDD methodology
- Achieved automatic quality convergence (set target, iterate until met)
- Explored the event journal (complete audit trail)
- Learned how to resume interrupted sessions

**Babysitter turns complex AI workflows into single commands with deterministic, resumable execution.**

Ready to go deeper? Continue to [First Run Deep Dive](./first-run.md) to understand exactly what happened under the hood.
