# Beginner Tutorial: Build a Simple REST API with TDD

**Version:** 1.0
**Date:** 2026-01-25
**Category:** Tutorial
**Level:** Beginner
**Estimated Time:** 45-60 minutes
**Primary Personas:** James Park (Curious Newcomer), Sarah Chen (onboarding)

---

## Learning Objectives

By the end of this tutorial, you will be able to:

1. **Start a Babysitter workflow** using natural language commands
2. **Understand the TDD (Test-Driven Development) process** as orchestrated by Babysitter
3. **Observe quality convergence** as Babysitter iterates toward your quality target
4. **Interpret run output** including the journal, artifacts, and quality scores
5. **Resume an interrupted workflow** if your session ends unexpectedly

---

## Prerequisites

Before starting this tutorial, please ensure you have:

- [ ] **Node.js v20+** installed ([download here](https://nodejs.org/))
- [ ] **Claude Code** installed and configured ([setup guide](https://code.claude.com/docs))
- [ ] **Babysitter SDK and plugin** installed (see [Installation Guide](../getting-started/installation.md))
- [ ] **Breakpoints service running** on `http://localhost:3184`
- [ ] A **new empty project directory** for this tutorial
- [ ] Basic familiarity with **JavaScript** and **REST APIs**

### Verify Your Installation

Before we begin, let's verify everything is set up correctly. Open your terminal and run these commands:

```bash
# Check Node.js version (should be 20+)
node --version

# Check if Babysitter SDK is installed
npx @a5c-ai/babysitter-sdk@latest --version
```

**What you should see:**

For the Node.js check:
```
v20.x.x or higher
```

### About Breakpoints

Babysitter has two modes for handling breakpoints (approval prompts):

1. **Interactive Mode (Claude Code)**: When running in Claude Code, breakpoints are handled directly in the chat - Claude asks you questions and you respond. **No setup required!**

2. **Non-Interactive Mode**: For CI/CD or headless automation, you need the breakpoints service.

**For this tutorial, we'll use interactive mode** - just respond to Claude's questions in the chat. No additional service needed!

<details>
<summary>Optional: Start breakpoints service for non-interactive mode</summary>

```bash
# In a separate terminal (only if using non-interactive mode)
npx -y @a5c-ai/babysitter-breakpoints@latest start
```

You should see:
```
Babysitter Breakpoints Service started on http://localhost:3184
```

</details>

If any verification commands don't work, please revisit the installation guide before continuing.

---

## What We're Building

In this tutorial, we will build a simple **Task Manager REST API** with the following features:

- **GET /tasks** - Retrieve all tasks
- **POST /tasks** - Create a new task
- **GET /tasks/:id** - Retrieve a specific task
- **PUT /tasks/:id** - Update a task
- **DELETE /tasks/:id** - Delete a task

We will use **Express.js** as our web framework and **in-memory storage** (no database needed for this tutorial). Babysitter will guide us through a TDD approach, writing tests first and then implementing the code to pass those tests.

### Why TDD with Babysitter?

Test-Driven Development ensures your code works correctly from the start. Babysitter makes TDD easier by:

1. **Writing tests first** based on your requirements
2. **Implementing code** to pass those tests
3. **Iterating automatically** until quality targets are met
4. **Tracking everything** in an auditable journal

This means you get high-quality, well-tested code without manually managing the iteration cycle.

---

## Step 1: Set Up Your Project Directory

Let's start by creating a fresh project for our API. We will do this manually to ensure we understand the foundation.

Open your terminal and run:

```bash
# Create and navigate to your project directory
mkdir task-api-tutorial
cd task-api-tutorial

# Initialize a new Node.js project
npm init -y

# Install Express.js and testing dependencies
npm install express
npm install --save-dev jest supertest
```

**What you should see:**

After `npm init -y`:
```json
{
  "name": "task-api-tutorial",
  "version": "1.0.0",
  ...
}
```

After installing dependencies:
```
added X packages in Ys
```

Now let's configure Jest for testing. Open `package.json` and update the "scripts" section:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

**Checkpoint 1:** Your project directory should now contain:
- `package.json` (with Express, Jest, and Supertest listed)
- `node_modules/` directory
- `package-lock.json`

---

## Step 2: Start Claude Code in Your Project

Now we're ready to use Babysitter. Open Claude Code in your project directory:

```bash
claude
```

**What you should see:**

Claude Code will start and show you its prompt. You're now ready to interact with Claude and use the Babysitter skill.

> **Note:** Make sure you're in your `task-api-tutorial` directory when you start Claude Code. Babysitter will create its workflow files relative to your current directory.

---

## Step 3: Start Your First Babysitter Run

Now comes the exciting part! We will ask Claude to use the Babysitter skill to build our REST API with TDD.

In Claude Code, type:

```
/babysit Build a REST API for task management with Express.js. Include:
- GET /tasks to list all tasks
- POST /tasks to create a task (with title and completed status)
- GET /tasks/:id to get a specific task
- PUT /tasks/:id to update a task
- DELETE /tasks/:id to delete a task
Use TDD with 80% quality target and max 5 iterations.
```

Alternatively, you can use natural language:

```
Use the babysitter skill to build a REST API for task management with Express.js.
Include CRUD operations for tasks (title and completed status).
Use TDD methodology with an 80% quality target and maximum 5 iterations.
```

**What you should see:**

Babysitter will acknowledge your request and create a new run:

```
Creating new babysitter run: task-api-20260125-143012

Process Definition: TDD Quality Convergence
Target Quality: 80%
Max Iterations: 5

Run ID: 01KFFTSF8TK8C9GT3YM9QYQ6WG
Run Directory: .a5c/runs/01KFFTSF8TK8C9GT3YM9QYQ6WG/
```

> **Understanding the Output:**
> - **Run ID**: A unique identifier for this workflow run
> - **Run Directory**: Where Babysitter stores all artifacts and logs
> - **Target Quality**: The minimum quality score to achieve (80/100)
> - **Max Iterations**: How many times Babysitter will try to improve

---

## Step 4: Observe the Research Phase

After starting the run, Babysitter enters the **Research Phase**. During this phase, it analyzes your project and requirements to understand the context.

**What you should see:**

```
[Iteration 1/5] Starting research phase...

Task: Research Codebase Patterns
- Analyzing project structure... Done
- Checking for existing Express patterns... Done
- Reviewing package.json dependencies... Done
- Identifying test framework (Jest)... Done

Research Summary:
- Fresh Express.js project
- Jest configured for testing
- No existing routes or models
- Supertest available for API testing
```

This phase is important because it helps Babysitter understand your project's context and make appropriate decisions about how to structure the code.

**Checkpoint 2:** You should see the research phase complete with a summary of your project.

---

## Step 5: Review the Specifications Phase

Next, Babysitter generates detailed **Specifications** based on your requirements and research.

**What you should see:**

```
Task: Generate Specifications
Creating detailed specs for task management API...

Specifications:
- Endpoints: GET /tasks, POST /tasks, GET /tasks/:id, PUT /tasks/:id, DELETE /tasks/:id
- Data Model: Task { id: string, title: string, completed: boolean, createdAt: Date }
- Storage: In-memory array (no database)
- Validation: Title required, completed defaults to false
- Error Handling: 404 for not found, 400 for validation errors

Test Plan:
- Unit tests for task validation
- Integration tests for each endpoint
- Edge case tests (empty list, invalid ID, missing fields)
```

At this point, you might see a **breakpoint** requesting your approval of the specifications.

---

## Step 6: Approve the Specifications (Breakpoint)

Babysitter uses **breakpoints** to get human approval at critical decision points. This ensures you stay in control of important decisions.

### Interactive Mode (Claude Code) - What You'll See:

Since you're running in Claude Code, Claude will ask you directly in the chat:

```
Claude: The specification phase is complete. Here's what I've planned:

        Specifications:
        - 5 CRUD endpoints defined
        - In-memory storage (no database setup)
        - Jest + Supertest for testing
        - Basic validation rules

        Do you approve these specifications to proceed with implementation?

        [Approve] [Reject] [Request Changes]

You: [Click Approve or type "yes"]

Claude: Specifications approved. Proceeding with TDD implementation...
```

Simply respond to Claude's question to continue!

### Non-Interactive Mode (Alternative):

If you were running in non-interactive mode (CI/CD, scripts), you would instead see:

```
Waiting for breakpoint approval...
Visit http://localhost:3184 to approve or reject.
```

And you'd approve via the web UI at `http://localhost:3184`.

> **Why Breakpoints Matter:**
> Breakpoints create a human-in-the-loop workflow. This means:
> - You maintain control over important decisions
> - Every approval is logged for audit trails
> - You can reject and provide feedback if something isn't right

**Checkpoint 3:** You should have successfully approved the specifications breakpoint (via chat or web UI).

---

## Step 7: Watch the TDD Implementation Loop

Now Babysitter enters the core **TDD Implementation Loop**. This is where the magic happens!

### Iteration 1: First Pass

**What you should see:**

```
[Iteration 1/5] Starting TDD implementation...

Task: Write Tests First
- Writing endpoint integration tests... Done (12 test cases)
- Writing validation tests... Done (5 test cases)
- Writing edge case tests... Done (4 test cases)

Task: Implement Code
- Creating task model... Done
- Implementing routes... Done
- Adding validation middleware... Done
- Setting up Express app... Done

Running Quality Checks...
- Coverage: 68% (target: 80%)
- ESLint: 2 warnings
- Tests: 19/21 passing (2 failures)

Agent Quality Score: 62/100 (below target)
Issues identified:
- Coverage below threshold (68% < 80%)
- 2 failing tests in edge cases
- Minor ESLint warnings

Continuing to next iteration...
```

Don't worry that the first iteration didn't meet the target - this is expected! Babysitter will now iterate to fix the issues.

### Iteration 2: Refinement

**What you should see:**

```
[Iteration 2/5] Refining implementation...

Task: Fix Failing Tests
- Fixed test for empty task title... Done
- Fixed test for invalid task ID format... Done

Task: Improve Coverage
- Added tests for error handling paths... Done
- Added tests for edge cases in DELETE... Done

Task: Fix ESLint Issues
- Fixed unused variable warning... Done
- Applied consistent code style... Done

Running Quality Checks...
- Coverage: 84% (target: 80%)
- ESLint: 0 warnings
- Tests: 21/21 passing

Agent Quality Score: 88/100 (target met!)

Quality target achieved in 2 iterations!
```

**Checkpoint 4:** The workflow should achieve the quality target (likely in 2-3 iterations).

---

## Step 8: Review the Created Files

Now let's examine what Babysitter created. Your project should have new files:

```bash
# List the created files
ls -la
```

**Expected file structure:**

```
task-api-tutorial/
  node_modules/
  .a5c/
    runs/
      01KFFTSF8TK8C9GT3YM9QYQ6WG/
        journal/
          journal.jsonl
        state.json
        tasks/
  src/
    app.js           # Express application setup
    routes/
      tasks.js       # Task routes
    models/
      task.js        # Task model and storage
    middleware/
      validation.js  # Input validation
  tests/
    tasks.test.js    # Integration tests
  package.json
```

Let's look at some of the created code:

### The Task Model (`src/models/task.js`)

```javascript
// This is an example of what Babysitter might generate
const tasks = [];

const Task = {
  findAll: () => tasks,
  findById: (id) => tasks.find(t => t.id === id),
  create: (data) => {
    const task = {
      id: Date.now().toString(),
      title: data.title,
      completed: data.completed || false,
      createdAt: new Date()
    };
    tasks.push(task);
    return task;
  },
  update: (id, data) => {
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return null;
    tasks[index] = { ...tasks[index], ...data };
    return tasks[index];
  },
  delete: (id) => {
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return false;
    tasks.splice(index, 1);
    return true;
  }
};

module.exports = Task;
```

### A Test File (`tests/tasks.test.js`)

```javascript
// Example of generated test structure
const request = require('supertest');
const app = require('../src/app');

describe('Tasks API', () => {
  describe('GET /tasks', () => {
    it('should return an empty array initially', async () => {
      const res = await request(app).get('/tasks');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('POST /tasks', () => {
    it('should create a new task', async () => {
      const res = await request(app)
        .post('/tasks')
        .send({ title: 'Test Task' });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('Test Task');
    });

    it('should return 400 if title is missing', async () => {
      const res = await request(app)
        .post('/tasks')
        .send({});
      expect(res.status).toBe(400);
    });
  });

  // More tests...
});
```

---

## Step 9: Run the Tests Yourself

Let's verify that everything works by running the tests manually:

```bash
npm test
```

**What you should see:**

```
PASS  tests/tasks.test.js
  Tasks API
    GET /tasks
      - should return an empty array initially (23 ms)
      - should return all tasks after creation (18 ms)
    POST /tasks
      - should create a new task (15 ms)
      - should return 400 if title is missing (12 ms)
    GET /tasks/:id
      - should return a specific task (14 ms)
      - should return 404 for non-existent task (11 ms)
    PUT /tasks/:id
      - should update a task (16 ms)
      - should return 404 for non-existent task (10 ms)
    DELETE /tasks/:id
      - should delete a task (13 ms)
      - should return 404 for non-existent task (9 ms)

Test Suites: 1 passed, 1 total
Tests:       21 passed, 21 total
```

**Checkpoint 5:** All tests should pass when you run `npm test`.

---

## Step 10: Explore the Journal

One of Babysitter's most powerful features is its **event-sourced journal**. This provides a complete audit trail of everything that happened during the run.

Let's examine it:

```bash
# View the journal (replace with your actual run ID)
cat .a5c/runs/01KFFTSF8TK8C9GT3YM9QYQ6WG/journal/journal.jsonl | head -20
```

**What you should see:**

```json
{"type":"RUN_STARTED","timestamp":"2026-01-25T14:30:12.445Z","runId":"01KFFTSF8TK8C9GT3YM9QYQ6WG","inputs":{...}}
{"type":"ITERATION_STARTED","timestamp":"2026-01-25T14:30:12.567Z","iteration":1}
{"type":"TASK_STARTED","timestamp":"2026-01-25T14:30:13.123Z","taskId":"research-001","taskType":"agent"}
{"type":"TASK_COMPLETED","timestamp":"2026-01-25T14:30:45.789Z","taskId":"research-001","result":{"status":"success"}}
{"type":"TASK_STARTED","timestamp":"2026-01-25T14:30:46.001Z","taskId":"specs-001","taskType":"agent"}
...
{"type":"BREAKPOINT_REQUESTED","timestamp":"2026-01-25T14:31:12.234Z","breakpointId":"bp-001","question":"Review and approve specifications?"}
{"type":"BREAKPOINT_APPROVED","timestamp":"2026-01-25T14:31:45.123Z","breakpointId":"bp-001"}
...
{"type":"QUALITY_SCORE","timestamp":"2026-01-25T14:33:23.456Z","iteration":1,"score":62}
{"type":"QUALITY_SCORE","timestamp":"2026-01-25T14:34:44.789Z","iteration":2,"score":88}
{"type":"RUN_COMPLETED","timestamp":"2026-01-25T14:34:44.890Z","status":"success"}
```

> **Why the Journal Matters:**
> - **Audit Trail:** Complete record of all decisions and actions
> - **Debugging:** Understand exactly what happened if something goes wrong
> - **Resumability:** Babysitter can resume from any point using this journal
> - **Compliance:** Proof of human approvals and quality checks

---

## Step 11: Start the API Server (Optional)

Let's verify our API works by starting the server:

```bash
# Start the server (you may need to add a start script)
node src/app.js
```

Or add a start script to `package.json`:

```json
{
  "scripts": {
    "start": "node src/app.js",
    "test": "jest"
  }
}
```

Then run:

```bash
npm start
```

**What you should see:**

```
Task API server running on port 3000
```

Now you can test the API with curl:

```bash
# Create a task
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Learn Babysitter"}'

# List all tasks
curl http://localhost:3000/tasks
```

---

## Step 12: Simulate Session Interruption and Resume

Let's learn how to handle session interruptions. This is crucial for real-world use where you might close your laptop, lose network connection, or need to continue work the next day.

### Simulating Interruption

If you were to close Claude Code mid-run (please don't do this for a completed run), you could resume it later.

### Resuming a Run

To resume a previously interrupted run, you would use:

```
/babysit resume --run-id 01KFFTSF8TK8C9GT3YM9QYQ6WG
```

Or in natural language:

```
Resume the babysitter run 01KFFTSF8TK8C9GT3YM9QYQ6WG
```

**What would happen:**

```
Resuming run: 01KFFTSF8TK8C9GT3YM9QYQ6WG

Replaying journal...
- Found 47 events
- Last completed task: implement-002
- Resuming from iteration 2

Continuing workflow...
```

> **Key Insight:** Because Babysitter uses event sourcing, all progress is preserved. You never lose work due to session interruptions.

---

## Summary

Congratulations! You have successfully completed your first Babysitter tutorial. Let's review what you accomplished:

### What You Built
- A fully functional REST API with 5 endpoints
- Comprehensive test suite with 21 tests
- 80%+ code coverage
- Clean, well-structured code

### What You Learned

1. **Starting a Babysitter workflow** with the `/babysit` command
2. **Understanding the phases**: Research, Specifications, TDD Implementation
3. **Using breakpoints** for human-in-the-loop approval
4. **Observing quality convergence** as Babysitter iterates to meet targets
5. **Reading the journal** to understand what happened
6. **Resuming interrupted runs** to continue work later

### Key Concepts

| Concept | What It Means |
|---------|---------------|
| **TDD Quality Convergence** | Writing tests first, then implementing code, iterating until quality target is met |
| **Breakpoints** | Human approval gates for critical decisions |
| **Journal** | Event-sourced audit trail of all actions |
| **Quality Score** | Automated assessment of code quality (tests, coverage, linting) |
| **Iteration** | One pass through the implementation and quality check cycle |

---

## Next Steps

Now that you've completed the beginner tutorial, here are some paths to continue your learning:

### Continue Learning
- **[Intermediate Tutorial: Custom Process Definition](./intermediate-custom-process.md)** - Learn to create custom workflows with parallel execution and approval gates
- **[Advanced Tutorial: Multi-Phase Feature Development](./advanced-multi-phase.md)** - Master complex team workflows with quality convergence

### Go Deeper
- **[Event Sourcing Explained](../features/journal-system.md)** - Understand the architecture behind Babysitter
- **[Quality Convergence Explained](../features/quality-convergence.md)** - Learn how quality scoring works

### Apply Your Knowledge
- **[Quality Convergence](../features/quality-convergence.md)** - Fine-tune quality settings for your projects
- **[Breakpoints](../features/breakpoints.md)** - Customize approval workflows

---

## Troubleshooting

### Issue: "Plugin not found: babysitter@a5c.ai"

**Symptom:** Claude Code doesn't recognize the babysitter command.

**Solution:**
```bash
# Reinstall the plugin
claude plugin marketplace add a5c-ai/babysitter
claude plugin install --scope user babysitter@a5c.ai
claude plugin enable --scope user babysitter@a5c.ai

# Restart Claude Code
```

### Issue: "Breakpoint not resolving"

**Symptom:** Workflow is waiting for breakpoint approval but nothing happens.

**Solution (Interactive Mode - Claude Code):**
1. Look for Claude's question in the chat - scroll up if needed
2. Respond to the question to continue
3. If the session timed out, resume with `/babysit resume`

**Solution (Non-Interactive Mode):**
1. Ensure the breakpoints service is running: `npx -y @a5c-ai/babysitter-breakpoints@latest start`
2. Check if you can access `http://localhost:3184` in your browser
3. Look for pending breakpoints in the UI

### Issue: "Quality target never reached"

**Symptom:** Babysitter keeps iterating but the quality score doesn't improve.

**Solution:**
1. Check the iteration logs for specific issues
2. Consider lowering your quality target (e.g., 75% instead of 80%)
3. Review failing tests manually and provide feedback to Claude

### Issue: "Tests failing after run completion"

**Symptom:** Running `npm test` shows failures even though Babysitter reported success.

**Solution:**
1. This can happen if there are environmental differences
2. Check if all dependencies are installed: `npm install`
3. Ensure you're in the correct directory
4. Review the test files for any environment-specific configurations

---

## See Also

- [Glossary](../reference/glossary.md) - Definitions of all Babysitter terms
- [CLI Reference](../reference/cli-reference.md) - Complete command reference
- [Getting Started](../getting-started/first-run.md) - Conceptual overview

---

**Document Status:** Complete
**Last Updated:** 2026-01-25
**Feedback:** Found an issue? [Report it on GitHub](https://github.com/a5c-ai/babysitter/issues)
