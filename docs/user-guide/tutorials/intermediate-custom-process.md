# Intermediate Tutorial: Custom Process Definition

**Version:** 1.0
**Date:** 2026-01-25
**Category:** Tutorial
**Level:** Intermediate
**Estimated Time:** 60-90 minutes
**Primary Personas:** Sarah Chen (Productivity-Focused Developer), Elena Rodriguez (DevOps Engineer)

---

## Learning Objectives

By the end of this tutorial, you will be able to:

1. **Create a custom process definition** that orchestrates multiple tasks
2. **Implement parallel execution** for independent tasks to improve performance
3. **Add strategic breakpoints** for human approval at critical decision points
4. **Configure quality checks** that run as part of your workflow
5. **Parameterize your process** to make it reusable across different scenarios

---

## Prerequisites

Before starting this tutorial, please ensure you have:

- [ ] Completed the **[Beginner Tutorial: Build a Simple REST API](./beginner-rest-api.md)**
- [ ] Understanding of **JavaScript async/await** patterns
- [ ] Familiarity with **Jest** or similar testing frameworks
- [ ] **Babysitter SDK** installed globally (`npm install -g @a5c-ai/babysitter-sdk@latest`)
- [ ] **Breakpoints service** running on `http://localhost:3184`
- [ ] A project where you want to implement a custom build and deploy workflow

### Verify Prerequisites

```bash
# Verify SDK installation
npx @a5c-ai/babysitter-sdk@latest --version
```

### About Breakpoints

**Interactive Mode (Claude Code)**: When running in Claude Code, breakpoints are handled directly in the chat - no service needed!

**Non-Interactive Mode**: For CI/CD or headless automation, you need the breakpoints service:
```bash
# Only needed for non-interactive mode
curl http://localhost:3184/health
```

---

## What We're Building

In this tutorial, we will create a **custom build and deploy process** that:

1. **Lints the code** in parallel with **running unit tests**
2. **Builds the application** after lint and tests pass
3. **Runs security scan** on the build output
4. **Waits for human approval** before deploying
5. **Deploys to staging** environment
6. **Runs integration tests** against staging
7. **Waits for final approval** before production deployment
8. **Deploys to production** (simulated)

This process demonstrates several powerful Babysitter features:

- **Parallel execution** for independent tasks
- **Sequential execution** for dependent tasks
- **Multiple breakpoints** for staged approvals
- **Quality gates** with pass/fail criteria
- **Parameterized inputs** for flexibility

### Process Flow Diagram

```
                    +------------------+
                    |  Process Start   |
                    +--------+---------+
                             |
              +--------------+--------------+
              |                             |
    +---------v---------+         +---------v---------+
    |   Run Lint        |         |   Run Unit Tests  |
    |   (parallel)      |         |   (parallel)      |
    +---------+---------+         +---------+---------+
              |                             |
              +--------------+--------------+
                             |
                    +--------v---------+
                    |   Build App      |
                    +--------+---------+
                             |
                    +--------v---------+
                    |  Security Scan   |
                    +--------+---------+
                             |
                    +--------v---------+
                    |  BREAKPOINT:     |
                    |  Staging Approval|
                    +--------+---------+
                             |
                    +--------v---------+
                    |  Deploy Staging  |
                    +--------+---------+
                             |
                    +--------v---------+
                    |  Integration Test|
                    +--------+---------+
                             |
                    +--------v---------+
                    |  BREAKPOINT:     |
                    |  Prod Approval   |
                    +--------+---------+
                             |
                    +--------v---------+
                    |  Deploy Prod     |
                    +--------+---------+
                             |
                    +--------v---------+
                    |  Process Complete|
                    +------------------+
```

---

## Step 1: Understand Process Definition Structure

Before we write code, let's understand how Babysitter process definitions work.

A **process definition** is a JavaScript function that orchestrates tasks using a context object (`ctx`). The context provides methods for:

| Method | Purpose | Example |
|--------|---------|---------|
| `ctx.task(taskDef, args)` | Execute a single task | Run tests, build code |
| `ctx.breakpoint(opts)` | Wait for human approval | Deployment gates |
| `ctx.parallel.all([...])` | Run tasks concurrently | Lint and test together |
| `ctx.log(message)` | Log to the journal | Progress updates |
| `ctx.getState(key)` | Read process state | Retrieved cached values |
| `ctx.setState(key, value)` | Write process state | Store intermediate results |

### Basic Structure

```javascript
// process-definition.js
export async function process(inputs, ctx) {
  // inputs: Parameters passed when starting the run
  // ctx: Context object with orchestration methods

  // Your workflow logic here
  const result = await ctx.task(someTask, { arg: 'value' });

  return { success: true, result };
}
```

**Checkpoint 1:** You understand the basic structure of a process definition.

---

## Step 2: Create Your Project Structure

Let's set up the project structure for our custom process.

```bash
# Create a new directory for this tutorial
mkdir custom-process-tutorial
cd custom-process-tutorial

# Initialize the project
npm init -y

# Create the directory structure
mkdir -p .a5c/processes
mkdir -p src
mkdir -p tests
mkdir -p scripts
```

Your directory should now look like:

```
custom-process-tutorial/
  .a5c/
    processes/        # Where process definitions live
  src/                # Application source code
  tests/              # Test files
  scripts/            # Build and deploy scripts
  package.json
```

---

## Step 3: Define Your Task Definitions

Before writing the main process, we need to define the individual tasks. Create a file for task definitions:

```bash
touch .a5c/processes/tasks.js
```

Now let's define our tasks. Open `.a5c/processes/tasks.js`:

```javascript
// .a5c/processes/tasks.js
// Task definitions for our build and deploy process

/**
 * Lint Task
 * Runs ESLint on the codebase
 */
export const lintTask = {
  type: 'shell',
  name: 'lint',
  description: 'Run ESLint on source code',
  command: 'npm run lint',
  timeout: 60000, // 1 minute
  retries: 0,
};

/**
 * Unit Test Task
 * Runs Jest unit tests with coverage
 */
export const unitTestTask = {
  type: 'shell',
  name: 'unit-tests',
  description: 'Run Jest unit tests with coverage',
  command: 'npm test -- --coverage --passWithNoTests',
  timeout: 300000, // 5 minutes
  retries: 1,
};

/**
 * Build Task
 * Compiles/bundles the application
 */
export const buildTask = {
  type: 'shell',
  name: 'build',
  description: 'Build the application',
  command: 'npm run build',
  timeout: 180000, // 3 minutes
  retries: 0,
};

/**
 * Security Scan Task
 * Runs npm audit and checks for vulnerabilities
 */
export const securityScanTask = {
  type: 'shell',
  name: 'security-scan',
  description: 'Run security vulnerability scan',
  command: 'npm audit --audit-level=high',
  timeout: 120000, // 2 minutes
  retries: 0,
  allowFailure: true, // Continue even if vulnerabilities found
};

/**
 * Deploy Staging Task
 * Deploys to staging environment (simulated)
 */
export const deployStagingTask = {
  type: 'shell',
  name: 'deploy-staging',
  description: 'Deploy to staging environment',
  command: 'echo "Deploying to staging..." && sleep 2 && echo "Staging deployment complete"',
  timeout: 300000, // 5 minutes
  retries: 1,
};

/**
 * Integration Test Task
 * Runs integration tests against staging
 */
export const integrationTestTask = {
  type: 'shell',
  name: 'integration-tests',
  description: 'Run integration tests against staging',
  command: 'npm run test:integration || echo "No integration tests configured"',
  timeout: 600000, // 10 minutes
  retries: 1,
};

/**
 * Deploy Production Task
 * Deploys to production environment (simulated)
 */
export const deployProductionTask = {
  type: 'shell',
  name: 'deploy-production',
  description: 'Deploy to production environment',
  command: 'echo "Deploying to production..." && sleep 3 && echo "Production deployment complete"',
  timeout: 600000, // 10 minutes
  retries: 0,
};

/**
 * Agent Task: Quality Assessment
 * Uses an LLM to assess overall build quality
 */
export const qualityAssessmentTask = {
  type: 'agent',
  name: 'quality-assessment',
  description: 'AI assessment of build quality',
  prompt: `
    Analyze the following build results and provide a quality score (0-100):

    Lint Results: {{lintResult}}
    Test Results: {{testResult}}
    Security Scan: {{securityResult}}

    Consider:
    - Code quality (lint errors/warnings)
    - Test coverage and passing rate
    - Security vulnerabilities

    Respond with a JSON object: { "score": number, "issues": string[], "recommendations": string[] }
  `,
  timeout: 60000,
};
```

**Key Points:**

- **Shell tasks** execute command-line commands
- **Agent tasks** use LLM capabilities for analysis
- Each task has a **timeout** to prevent hanging
- Some tasks allow **retries** for transient failures
- The `allowFailure` flag lets a task fail without stopping the process

**Checkpoint 2:** You have defined all task definitions for the process.

---

## Step 4: Write the Main Process Definition

Now let's create the main process definition that orchestrates all these tasks.

Create the process file:

```bash
touch .a5c/processes/build-deploy.js
```

Open `.a5c/processes/build-deploy.js` and add:

```javascript
// .a5c/processes/build-deploy.js
// Custom Build and Deploy Process Definition

import {
  lintTask,
  unitTestTask,
  buildTask,
  securityScanTask,
  deployStagingTask,
  integrationTestTask,
  deployProductionTask,
  qualityAssessmentTask,
} from './tasks.js';

/**
 * Build and Deploy Process
 *
 * This process orchestrates a complete build and deployment pipeline with:
 * - Parallel lint and test execution
 * - Security scanning
 * - Staged deployments with human approval gates
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.environment - Target environment ('staging' or 'production')
 * @param {number} inputs.qualityThreshold - Minimum quality score (default: 80)
 * @param {boolean} inputs.skipStaging - Skip staging deployment (default: false)
 * @param {Object} ctx - Babysitter context object
 */
export async function process(inputs, ctx) {
  const {
    environment = 'production',
    qualityThreshold = 80,
    skipStaging = false,
  } = inputs;

  ctx.log(`Starting build-deploy process for ${environment}`);
  ctx.log(`Quality threshold: ${qualityThreshold}`);

  // ============================================
  // PHASE 1: Quality Checks (Parallel Execution)
  // ============================================
  ctx.log('Phase 1: Running quality checks in parallel...');

  // Run lint and unit tests in parallel for faster execution
  const [lintResult, testResult] = await ctx.parallel.all([
    () => ctx.task(lintTask, {}),
    () => ctx.task(unitTestTask, {}),
  ]);

  ctx.log(`Lint completed: ${lintResult.exitCode === 0 ? 'PASS' : 'FAIL'}`);
  ctx.log(`Tests completed: ${testResult.exitCode === 0 ? 'PASS' : 'FAIL'}`);

  // Store results in process state for later use
  ctx.setState('lintResult', lintResult);
  ctx.setState('testResult', testResult);

  // Fail fast if critical checks fail
  if (lintResult.exitCode !== 0 || testResult.exitCode !== 0) {
    ctx.log('Quality checks failed. Stopping process.');
    return {
      success: false,
      phase: 'quality-checks',
      error: 'Lint or tests failed',
      lintResult,
      testResult,
    };
  }

  // ============================================
  // PHASE 2: Build Application
  // ============================================
  ctx.log('Phase 2: Building application...');

  const buildResult = await ctx.task(buildTask, {});

  if (buildResult.exitCode !== 0) {
    ctx.log('Build failed. Stopping process.');
    return {
      success: false,
      phase: 'build',
      error: 'Build failed',
      buildResult,
    };
  }

  ctx.log('Build completed successfully');

  // ============================================
  // PHASE 3: Security Scan
  // ============================================
  ctx.log('Phase 3: Running security scan...');

  const securityResult = await ctx.task(securityScanTask, {});

  ctx.setState('securityResult', securityResult);

  // Log security findings but don't necessarily fail
  if (securityResult.exitCode !== 0) {
    ctx.log('Security scan found potential issues. Review before deployment.');
  } else {
    ctx.log('Security scan passed');
  }

  // ============================================
  // PHASE 4: Quality Assessment
  // ============================================
  ctx.log('Phase 4: Performing AI quality assessment...');

  const qualityResult = await ctx.task(qualityAssessmentTask, {
    lintResult: JSON.stringify(lintResult),
    testResult: JSON.stringify(testResult),
    securityResult: JSON.stringify(securityResult),
  });

  const qualityScore = qualityResult.score || 0;
  ctx.log(`Quality score: ${qualityScore}/100 (threshold: ${qualityThreshold})`);

  if (qualityScore < qualityThreshold) {
    ctx.log(`Quality score ${qualityScore} is below threshold ${qualityThreshold}`);

    // Breakpoint: Allow human to override low quality score
    await ctx.breakpoint({
      question: `Quality score (${qualityScore}) is below threshold (${qualityThreshold}). Continue anyway?`,
      title: 'Quality Threshold Warning',
      context: {
        qualityScore,
        qualityThreshold,
        issues: qualityResult.issues || [],
        recommendations: qualityResult.recommendations || [],
      },
      severity: 'warning',
    });

    ctx.log('Human approved continuation despite low quality score');
  }

  // ============================================
  // PHASE 5: Staging Deployment (Optional)
  // ============================================
  if (!skipStaging) {
    ctx.log('Phase 5: Deploying to staging...');

    // Breakpoint: Staging deployment approval
    await ctx.breakpoint({
      question: 'Approve deployment to staging environment?',
      title: 'Staging Deployment Approval',
      context: {
        buildResult: 'SUCCESS',
        qualityScore,
        securityStatus: securityResult.exitCode === 0 ? 'PASS' : 'REVIEW_NEEDED',
        targetEnvironment: 'staging',
      },
    });

    const stagingResult = await ctx.task(deployStagingTask, {});

    if (stagingResult.exitCode !== 0) {
      ctx.log('Staging deployment failed');
      return {
        success: false,
        phase: 'staging-deploy',
        error: 'Staging deployment failed',
        stagingResult,
      };
    }

    ctx.log('Staging deployment successful');

    // ============================================
    // PHASE 6: Integration Tests
    // ============================================
    ctx.log('Phase 6: Running integration tests against staging...');

    const integrationResult = await ctx.task(integrationTestTask, {});

    ctx.setState('integrationResult', integrationResult);

    if (integrationResult.exitCode !== 0) {
      ctx.log('Integration tests failed');

      await ctx.breakpoint({
        question: 'Integration tests failed. Continue to production anyway?',
        title: 'Integration Test Failure',
        context: {
          integrationResult,
          recommendation: 'Investigate failures before proceeding',
        },
        severity: 'error',
      });
    }

    ctx.log('Integration tests completed');
  } else {
    ctx.log('Phase 5-6: Skipping staging deployment (skipStaging=true)');
  }

  // ============================================
  // PHASE 7: Production Deployment
  // ============================================
  if (environment === 'production') {
    ctx.log('Phase 7: Preparing for production deployment...');

    // Final breakpoint before production
    await ctx.breakpoint({
      question: 'Approve deployment to PRODUCTION environment? This is the final step.',
      title: 'PRODUCTION Deployment Approval',
      context: {
        qualityScore,
        stagingDeployed: !skipStaging,
        integrationTestsPassed: ctx.getState('integrationResult')?.exitCode === 0,
        timestamp: new Date().toISOString(),
        warning: 'This will affect live users',
      },
      severity: 'critical',
    });

    ctx.log('Production deployment approved');

    const prodResult = await ctx.task(deployProductionTask, {});

    if (prodResult.exitCode !== 0) {
      ctx.log('Production deployment failed');
      return {
        success: false,
        phase: 'production-deploy',
        error: 'Production deployment failed',
        prodResult,
      };
    }

    ctx.log('Production deployment successful!');
  }

  // ============================================
  // COMPLETE: Return Summary
  // ============================================
  return {
    success: true,
    summary: {
      environment,
      qualityScore,
      phases: {
        lint: 'PASS',
        tests: 'PASS',
        build: 'PASS',
        security: securityResult.exitCode === 0 ? 'PASS' : 'WARNINGS',
        staging: skipStaging ? 'SKIPPED' : 'PASS',
        integration: skipStaging ? 'SKIPPED' : 'PASS',
        production: environment === 'production' ? 'PASS' : 'SKIPPED',
      },
      completedAt: new Date().toISOString(),
    },
  };
}
```

**Key Concepts Demonstrated:**

1. **Parallel Execution (`ctx.parallel.all`)**: Lint and tests run simultaneously
2. **Sequential Dependencies**: Build waits for lint and tests to complete
3. **State Management (`ctx.setState/getState`)**: Store intermediate results
4. **Multiple Breakpoints**: Staged approvals at critical points
5. **Parameterized Inputs**: Environment, quality threshold, skip options
6. **Conditional Logic**: Different paths based on parameters
7. **Error Handling**: Fail fast with meaningful error messages

**Checkpoint 3:** You have written the complete process definition.

---

## Step 5: Set Up Supporting Scripts

For our process to work, we need some npm scripts. Update your `package.json`:

```json
{
  "name": "custom-process-tutorial",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "lint": "echo 'Running lint...' && exit 0",
    "test": "echo 'Running tests...' && exit 0",
    "test:integration": "echo 'Running integration tests...' && exit 0",
    "build": "echo 'Building application...' && mkdir -p dist && echo 'Build complete' > dist/build.txt && exit 0"
  },
  "devDependencies": {}
}
```

> **Note:** These are placeholder scripts. In a real project, you would have actual lint, test, and build commands.

---

## Step 6: Register Your Custom Process

Now we need to tell Babysitter about our custom process. Create a process manifest:

```bash
touch .a5c/processes/manifest.json
```

Add the following content:

```json
{
  "processes": [
    {
      "name": "build-deploy",
      "description": "Custom build and deployment pipeline with staged approvals",
      "file": "./build-deploy.js",
      "inputs": {
        "environment": {
          "type": "string",
          "default": "staging",
          "description": "Target environment (staging or production)"
        },
        "qualityThreshold": {
          "type": "number",
          "default": 80,
          "description": "Minimum quality score required (0-100)"
        },
        "skipStaging": {
          "type": "boolean",
          "default": false,
          "description": "Skip staging deployment"
        }
      }
    }
  ]
}
```

**Checkpoint 4:** Your custom process is registered and ready to use.

---

## Step 7: Run Your Custom Process

Now let's run our custom process using Claude Code and Babysitter.

Start Claude Code in your project directory:

```bash
claude
```

Then run the process:

```
/babysit run build-deploy with environment=staging and qualityThreshold=75
```

Or using natural language:

```
Use the babysitter skill to run my custom build-deploy process.
Deploy to staging environment with a quality threshold of 75.
```

**What you should see:**

```
Creating new babysitter run: build-deploy-20260125-160000

Process: build-deploy (custom)
Inputs:
  - environment: staging
  - qualityThreshold: 75
  - skipStaging: false

Run ID: 01KGHTYK2MP9Q8BN5YM4XRZ3WD
Run Directory: .a5c/runs/01KGHTYK2MP9Q8BN5YM4XRZ3WD/

Starting process...

[Phase 1] Running quality checks in parallel...
- Lint: Starting...
- Unit Tests: Starting...
- Lint: PASS (0.8s)
- Unit Tests: PASS (1.2s)

[Phase 2] Building application...
- Build: PASS (0.5s)

[Phase 3] Running security scan...
- Security: PASS (0.3s)

[Phase 4] Performing AI quality assessment...
- Quality Score: 92/100

[Phase 5] Deploying to staging...
Waiting for breakpoint approval...

Breakpoint: Staging Deployment Approval
Visit http://localhost:3184 to approve or reject.
```

---

## Step 8: Approve Breakpoints

### Interactive Mode (Claude Code)

Since you're running in Claude Code, Claude will ask you directly:

```
Claude: The build is complete and ready for staging deployment.

        Summary:
        - Build Result: SUCCESS
        - Quality Score: 92
        - Security Status: PASS
        - Target Environment: staging

        Approve deployment to staging environment?

        [Approve] [Reject] [Add Comment]

You: [Click Approve or type "yes"]
```

Simply respond to approve and continue!

### Non-Interactive Mode (Alternative)

If using non-interactive mode, open `http://localhost:3184` in your browser. You will see the staging deployment breakpoint waiting for approval.

Click **"Approve"** to continue the process.

**What you should see after approval:**

```
Breakpoint approved

[Phase 5 continued] Staging deployment in progress...
- Deploy Staging: PASS (2.1s)
- Staging deployment successful

[Phase 6] Running integration tests against staging...
- Integration Tests: PASS (0.5s)

Process completed successfully!

Summary:
  - Environment: staging
  - Quality Score: 92/100
  - All phases: PASS
  - Completed at: 2026-01-25T16:05:23.456Z
```

**Checkpoint 5:** You have successfully run your custom process with breakpoint approval.

---

## Step 9: Run for Production Deployment

Now let's test the full process with production deployment:

```
/babysit run build-deploy with environment=production qualityThreshold=85
```

This time, you will see **multiple breakpoints**:

1. **Staging Deployment Approval** - Approve staging
2. **PRODUCTION Deployment Approval** - Final approval before production

Each breakpoint will appear in the breakpoints UI with appropriate context and severity.

> **Note:** Production deployment breakpoints are marked with `severity: critical` and include additional warnings.

---

## Step 10: Understanding Parallel Execution Benefits

Let's examine the performance benefit of parallel execution. In our process, lint and unit tests run in parallel:

**Without Parallel Execution (Sequential):**
```
Lint:  [████████] 10s
Tests: [████████████████] 20s
Total: 30 seconds
```

**With Parallel Execution:**
```
Lint:  [████████] 10s
Tests: [████████████████] 20s
       ↑ Both run simultaneously
Total: 20 seconds (33% faster!)
```

The `ctx.parallel.all()` method runs independent tasks concurrently, significantly reducing total execution time.

### When to Use Parallel Execution

| Scenario | Use Parallel? | Reason |
|----------|--------------|--------|
| Lint + Tests | Yes | Independent, no shared state |
| Build → Deploy | No | Deploy depends on build output |
| Multiple security scans | Yes | Independent checks |
| Database migration → Seed | No | Seed depends on migration |

---

## Step 11: Examine the Journal

Let's look at how parallel execution appears in the journal:

```bash
cat .a5c/runs/01KGHTYK2MP9Q8BN5YM4XRZ3WD/journal/journal.jsonl | grep -E "TASK_STARTED|TASK_COMPLETED"
```

**What you should see:**

```json
{"type":"TASK_STARTED","timestamp":"2026-01-25T16:00:01.123Z","taskId":"lint-001"}
{"type":"TASK_STARTED","timestamp":"2026-01-25T16:00:01.125Z","taskId":"unit-tests-001"}
{"type":"TASK_COMPLETED","timestamp":"2026-01-25T16:00:01.923Z","taskId":"lint-001","exitCode":0}
{"type":"TASK_COMPLETED","timestamp":"2026-01-25T16:00:02.325Z","taskId":"unit-tests-001","exitCode":0}
```

Notice how both tasks started almost simultaneously (2ms apart), demonstrating parallel execution.

---

## Step 12: Customizing for Your Project

Now that you understand the structure, here's how to customize the process for your own needs:

### Adding a New Task

1. Define the task in `tasks.js`:

```javascript
export const e2eTestTask = {
  type: 'shell',
  name: 'e2e-tests',
  description: 'Run end-to-end tests with Playwright',
  command: 'npx playwright test',
  timeout: 600000, // 10 minutes
  retries: 2,
};
```

2. Import and use in `build-deploy.js`:

```javascript
import { e2eTestTask } from './tasks.js';

// Add after integration tests
const e2eResult = await ctx.task(e2eTestTask, {});
```

### Adding a Conditional Breakpoint

```javascript
// Only require approval for changes to sensitive files
if (changesIncludeSensitiveFiles) {
  await ctx.breakpoint({
    question: 'Sensitive files modified. Security review required.',
    title: 'Security Review Required',
    severity: 'critical',
  });
}
```

### Adding Environment-Specific Logic

```javascript
if (environment === 'production') {
  // Additional production-only checks
  await ctx.task(productionReadinessCheck, {});
} else if (environment === 'staging') {
  // Staging-specific setup
  await ctx.task(seedTestData, {});
}
```

---

## Summary

Congratulations! You have successfully created a custom Babysitter process definition. Let's review what you accomplished:

### What You Built

- A complete **build and deploy pipeline** with 7 phases
- **Parallel execution** of lint and unit tests
- **Three strategic breakpoints** for human approval
- **Quality assessment** using an agent task
- **Parameterized inputs** for flexibility

### Key Concepts Learned

| Concept | What You Learned |
|---------|------------------|
| **Process Definition** | JavaScript function that orchestrates tasks using context API |
| **Parallel Execution** | Run independent tasks simultaneously with `ctx.parallel.all()` |
| **Breakpoints** | Human approval gates with context and severity levels |
| **State Management** | Store and retrieve values with `ctx.setState/getState` |
| **Task Types** | Shell tasks for commands, Agent tasks for LLM analysis |
| **Parameterization** | Make processes flexible with input parameters |

### Process Definition Best Practices

1. **Name tasks descriptively** - Use clear names like `lint-task` not `task1`
2. **Set appropriate timeouts** - Prevent hanging tasks from blocking workflows
3. **Use parallel execution wisely** - Only for truly independent tasks
4. **Place breakpoints strategically** - At irreversible actions (deployments)
5. **Log progress frequently** - Use `ctx.log()` for visibility
6. **Handle failures gracefully** - Return meaningful error information
7. **Parameterize configurable values** - Environments, thresholds, feature flags

---

## Next Steps

Now that you've mastered custom process definitions, here are paths to continue:

### Continue Learning
- **[Advanced Tutorial: Multi-Phase Feature Development](./advanced-multi-phase.md)** - Team workflows with agent scoring and quality convergence

### Go Deeper
- **[Process Engine Architecture](../features/process-definitions.md)** - Understand how processes execute
- **[Task Types Reference](../reference/cli-reference.md)** - Complete reference for all task types

### Apply Your Knowledge
- **[How to Create Team Templates](../features/process-definitions.md)** - Share processes across your team
- **[Quality Convergence](../features/quality-convergence.md)** - Custom quality evaluators

---

## Troubleshooting

### Issue: "Process file not found"

**Symptom:** Babysitter can't find your process definition.

**Solution:**
1. Verify file path: `.a5c/processes/build-deploy.js`
2. Check manifest: `.a5c/processes/manifest.json` lists the process
3. Ensure `"type": "module"` in package.json for ES modules

### Issue: "Parallel tasks not running in parallel"

**Symptom:** Tasks appear to run sequentially despite `ctx.parallel.all()`.

**Solution:**
1. Verify you're using the array of functions pattern:
   ```javascript
   // Correct
   await ctx.parallel.all([
     () => ctx.task(task1, {}),
     () => ctx.task(task2, {}),
   ]);

   // Incorrect - this runs sequentially!
   await ctx.parallel.all([
     ctx.task(task1, {}),  // Missing arrow function
     ctx.task(task2, {}),
   ]);
   ```

### Issue: "Breakpoint not appearing"

**Symptom:** Process is waiting but no breakpoint prompt appears.

**Solution (Interactive Mode - Claude Code):**
1. Look for Claude's question in the chat - scroll up if needed
2. If the session disconnected, resume with `/babysit resume`

**Solution (Non-Interactive Mode):**
1. Verify breakpoints service is running: `curl http://localhost:3184/health`
2. Check browser console for errors
3. Try refreshing the breakpoints UI at http://localhost:3184

### Issue: "Task timeout"

**Symptom:** Task fails with timeout error.

**Solution:**
1. Increase the timeout in task definition
2. Check if the underlying command is actually hanging
3. Consider breaking into smaller tasks

---

## See Also

- [CLI Reference](../reference/cli-reference.md) - Running processes via CLI
- [Configuration Reference](../reference/configuration.md) - All configuration options
- [Breakpoints](../features/breakpoints.md) - How breakpoints work

---

**Document Status:** Complete
**Last Updated:** 2026-01-25
**Feedback:** Found an issue? [Report it on GitHub](https://github.com/a5c-ai/babysitter/issues)
