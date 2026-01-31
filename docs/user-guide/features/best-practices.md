# Best Practices Guide: Comprehensive Reference for Babysitter

**Version:** 2.0
**Last Updated:** 2026-01-26
**Category:** Feature Guide

---

## Overview

This guide consolidates best practices from across the Babysitter ecosystem into a single reference. Whether you are designing workflows, developing processes, optimizing performance, or collaborating with your team, these patterns will help you get the most out of Babysitter.

### Core Philosophy: The Two-Loops Architecture

Babysitter implements a **hybrid agentic system** where:

- A **symbolic orchestrator** governs progression, journaling, and phase boundaries
- An **agentic harness** performs adaptive work with tools

The key insight: **quality is evidence-driven, not assertion-driven.**

> If you don't have evidence, you don't have completion.

For deep understanding, see [Two-Loops Architecture](./two-loops-architecture.md).

### How to Use This Guide

- **New Users**: Start with Workflow Design Patterns and Quality Gate Varieties sections
- **Intermediate Users**: Focus on the 90-Score Convergence Strategy and Team Collaboration sections
- **Advanced Users**: Dive into the Four Guardrail Layers and Process Optimization sections
- **All Users**: Keep this guide bookmarked for quick reference during development

---

## The Four Guardrail Layers

Guardrails are **not a single feature**. They form a layered approach to safety and control.

### Layer A: Capability Guardrails (What's Possible)

Define what tools and actions exist.

```javascript
const capabilityGuardrails = {
  allowedTools: ['read', 'write', 'shell', 'search'],
  pathRestrictions: ['src/**', 'tests/**'],  // Only these paths
  networkAccess: 'none',                      // No network calls
  permissions: 'read-write',                  // vs 'read-only'
  destructiveActions: 'require-confirmation'  // Interactive approval
};
```

### Layer B: Budget Guardrails (How Far)

Prevent runaway execution.

```javascript
const budgetGuardrails = {
  maxToolCalls: 100,           // Total tool invocations
  maxWallClockMinutes: 30,     // Wall-clock timeout
  maxTokenSpend: 50000,        // LLM token budget
  maxIterations: 10,           // Convergence loop limit
  maxFilesModified: 20,        // Scope control
  rateLimits: {
    apiCalls: '10/minute',
    fileWrites: '50/iteration'
  }
};
```

### Layer C: Policy Guardrails (What's Allowed)

Rules that define acceptable behavior.

```javascript
const policyGuardrails = {
  rules: [
    'never exfiltrate secrets',
    'never modify production directly',
    'always run tests before merge',
    'security scans required for dependencies',
    'no eval() or dynamic code execution',
    'require explicit confirmation for destructive actions'
  ],
  forbiddenPatterns: [
    /eval\(/,
    /exec\(/,
    /process\.env\.(API_KEY|SECRET)/,
    /rm\s+-rf/
  ]
};
```

### Layer D: Behavioral Guardrails (How Decisions Are Made)

Structural consistency in outputs.

```javascript
const behavioralGuardrails = {
  requireStructuredOutputs: true,        // Always JSON schemas
  requireEvidenceCitations: true,        // Cite tool outputs
  requireUncertaintyDeclaration: true,   // "I'm not sure" allowed
  requireExplanations: true,             // Justify decisions
  outputSchemas: {
    implementation: {
      type: 'object',
      required: ['filesModified', 'summary', 'confidence'],
      properties: {
        filesModified: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
        confidence: { type: 'number', minimum: 0, maximum: 100 }
      }
    }
  }
};
```

### Applying Guardrails in Processes

```javascript
// From methodologies/spec-driven-development.js
export async function process(inputs, ctx) {
  // Apply guardrails to all tasks
  const guardrails = {
    capability: { pathRestrictions: ['src/**', 'docs/**'] },
    budget: { maxIterations: 10, maxTokenSpend: 100000 },
    policy: { rules: ['follow constitution', 'run all tests'] },
    behavioral: { requireStructuredOutputs: true }
  };

  // Implementation task with constraints
  const impl = await ctx.task(implementTask, {
    feature: inputs.feature,
    guardrails  // Passed to harness
  });

  // Symbolic validation enforces guardrails
  if (impl.filesModified.length > guardrails.budget.maxFilesModified) {
    throw new Error('Budget exceeded: too many files modified');
  }
}
```

---

## The Five Quality Gate Categories

Quality gates are **not a single check**. They form a layered validation system. For robust convergence, use **4-5 gate types simultaneously**.

| Gate Type | What It Validates | Tools/Checks |
|-----------|-------------------|--------------|
| **1. Functional Tests** | Behavior correctness | Unit, integration, system, acceptance |
| **2. Code Quality** | Maintainability | Lint, format, complexity, duplication |
| **3. Static Analysis** | Type safety, bugs | TypeScript, SonarQube, Radon |
| **4. Security Scanning** | Vulnerabilities | SAST, secrets, dependencies, OWASP |
| **5. Performance** | Non-functional reqs | FCP, bundle size, API latency |

**Process Library Examples:**
- `methodologies/v-model.js` - Four test levels (unit → integration → system → acceptance)
- `methodologies/spec-driven-development.js` - Constitution validation + checklists
- `gsd/verify-work.js` - UAT with automated diagnosis

### Implementing Multi-Gate Validation

```javascript
// Run all five gates in parallel for efficiency
const [tests, codeQuality, staticAnalysis, security, performance] =
  await ctx.parallel.all([
    () => ctx.task(testGateTask, { impl }),
    () => ctx.task(codeQualityGateTask, { impl }),
    () => ctx.task(staticAnalysisGateTask, { impl }),
    () => ctx.task(securityGateTask, { impl }),
    () => ctx.task(performanceGateTask, { impl })
  ]);

// Evidence-driven completion: all gates must pass
const allGatesPassed =
  tests.passed &&
  codeQuality.passed &&
  staticAnalysis.passed &&
  security.passed &&
  performance.passed;
```

For detailed gate configurations and the 90-score convergence pattern, see [Quality Convergence](./quality-convergence.md).

---

## Workflow Design Patterns

### When to Use Breakpoints

Breakpoints create human-in-the-loop approval gates. Use them strategically to balance automation with oversight.

**Use breakpoints when:**

| Scenario | Rationale |
|----------|-----------|
| Before production deployments | Prevents accidental production changes |
| After plan generation | Validates approach before implementation effort |
| Before irreversible actions | Ensures human oversight for destructive operations |
| At quality thresholds | Allows human judgment when scores are borderline |
| For compliance requirements | Creates audit trail of approvals |
| At multi-phase transitions | Validates completion before proceeding |

**Avoid breakpoints when:**

| Scenario | Alternative |
|----------|-------------|
| Every minor step | Use logging instead (`ctx.log()`) |
| Automated testing phases | Use quality convergence with auto-continue |
| Automated pipelines (unless required) | Use `BABYSITTER_AUTO_APPROVE=true` |
| Low-risk, reversible actions | Trust the automation |

**Breakpoint placement pattern:**

```javascript
export async function process(inputs, ctx) {
  // Phase 1: Planning (minimal risk)
  const plan = await ctx.task(planningTask, { feature: inputs.feature });

  // BREAKPOINT: Before committing to implementation approach
  await ctx.breakpoint({
    question: 'Review the implementation plan. Approve to proceed?',
    title: 'Plan Approval',
    context: { runId: ctx.runId, files: [{ path: 'artifacts/plan.md', format: 'markdown' }] }
  });

  // Phase 2: Implementation (moderate risk)
  const impl = await ctx.task(implementTask, { plan });

  // Phase 3: Quality Convergence (automated)
  // No breakpoint needed - automated quality gates handle this

  // BREAKPOINT: Before deployment (high risk)
  await ctx.breakpoint({
    question: `Quality: ${quality}. Deploy to production?`,
    title: 'Production Deployment Approval',
    context: { runId: ctx.runId, files: [{ path: 'artifacts/final-report.md', format: 'markdown' }] }
  });

  return await ctx.task(deployTask, { impl });
}
```

### Iteration Limits and Quality Targets

Setting appropriate limits prevents runaway processes while ensuring quality.

**Recommended iteration limits by task type:**

| Task Type | Iterations | Quality Target | Notes |
|-----------|------------|----------------|-------|
| Simple bug fixes | 3-5 | 80-85 | Limited scope, quick convergence |
| Feature implementation | 5-10 | 85-90 | Moderate complexity |
| Complex refactoring | 10-15 | 85-95 | May need more iterations |
| Documentation | 2-4 | 75-85 | Faster convergence expected |
| Test coverage improvements | 5-8 | 90-95 | Higher target for tests |

**Setting realistic targets:**

```javascript
// Start conservative, adjust based on observed behavior
const {
  targetQuality = 85,      // Achievable but challenging
  maxIterations = 5,       // Reasonable upper bound
  minImprovement = 2,      // Detect plateaus early
  plateauThreshold = 3     // Iterations without improvement
} = inputs;

// Early exit on plateau (prevent wasted iterations)
if (qualityHistory.length >= plateauThreshold) {
  const recent = qualityHistory.slice(-plateauThreshold);
  const improvement = Math.max(...recent) - Math.min(...recent);
  if (improvement < minImprovement) {
    ctx.log(`Quality plateaued at ${quality}, stopping early`);
    break;
  }
}
```

### Task Decomposition Strategies

Break complex work into manageable, testable units.

**Decomposition principles:**

1. **Single Responsibility**: Each task does one thing well
2. **Clear Inputs/Outputs**: Well-defined interfaces between tasks
3. **Testable Units**: Each task can be validated independently
4. **Failure Isolation**: One task's failure does not corrupt others
5. **Resumable Checkpoints**: Natural pause points for resumption

**Task granularity guidelines:**

| Too Fine | Just Right | Too Coarse |
|----------|------------|------------|
| Write single line of code | Implement single function | Implement entire feature |
| Check one lint rule | Run all linting checks | Build, lint, test, deploy |
| Test one assertion | Test one module | Test entire application |

**Example decomposition:**

```javascript
// Good: Clear phases with distinct responsibilities
export async function process(inputs, ctx) {
  // Research phase - gather context
  const research = await ctx.task(researchTask, { feature: inputs.feature });

  // Planning phase - design approach
  const plan = await ctx.task(planningTask, { feature: inputs.feature, research });

  // Implementation phase - write code
  const impl = await ctx.task(implementTask, { plan });

  // Verification phase - run tests
  const tests = await ctx.task(testTask, { impl });

  // Quality phase - score results
  const score = await ctx.task(scoreTask, { impl, tests });

  return { success: score.overall >= inputs.targetQuality, score };
}
```

### Parallel vs Sequential Execution

Choose the right execution model based on task dependencies.

**Use parallel execution when:**

- Tasks are independent (no shared state)
- Tasks access different resources
- Order of completion does not matter
- You want faster overall execution

**Use sequential execution when:**

- Tasks depend on previous results
- Tasks modify shared resources
- Order of execution matters
- You need predictable behavior for debugging

**Decision matrix:**

| Dependency Type | Execution Model | Example |
|-----------------|-----------------|---------|
| No dependencies | Parallel | Lint, test, security scan |
| Data dependency | Sequential | Build then test |
| Resource contention | Sequential or chunked parallel | Database migrations |
| Partial dependency | Mixed | Build first, then parallel tests |

**Implementation patterns:**

```javascript
// Parallel: Independent quality checks
const [coverage, lint, security] = await ctx.parallel.all([
  () => ctx.task(coverageTask, {}),
  () => ctx.task(lintTask, {}),
  () => ctx.task(securityTask, {})
]);

// Sequential: Dependent operations
const build = await ctx.task(buildTask, {});
const test = await ctx.task(testTask, { buildArtifacts: build.artifacts });
const deploy = await ctx.task(deployTask, { testReport: test.report });

// Mixed: Sequential then parallel
const build = await ctx.task(buildTask, {});
const [unitTests, e2eTests, docTests] = await ctx.parallel.all([
  () => ctx.task(unitTestTask, { build }),
  () => ctx.task(e2eTestTask, { build }),
  () => ctx.task(docTestTask, { build })
]);
```

---

## Process Development Best Practices

### Process Structure and Organization

Well-structured processes are easier to understand, maintain, and debug.

**Recommended structure:**

```javascript
// 1. Imports and dependencies
import { defineTask } from '@a5c-ai/babysitter-sdk';

// 2. Constants and configuration
const DEFAULT_QUALITY_TARGET = 85;
const DEFAULT_MAX_ITERATIONS = 5;

// 3. Task definitions (reusable building blocks)
export const buildTask = defineTask('build', (args, taskCtx) => ({
  kind: 'node',
  title: `Build ${args.target}`,
  node: {
    entry: 'scripts/build.js',
    args: ['--target', args.target]
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

// 4. Helper functions
function calculateWeightedScore(scores, weights) {
  return Object.entries(weights).reduce(
    (sum, [key, weight]) => sum + (scores[key] || 0) * weight,
    0
  );
}

// 5. Main process function (orchestration logic)
export async function process(inputs, ctx) {
  const {
    feature,
    targetQuality = DEFAULT_QUALITY_TARGET,
    maxIterations = DEFAULT_MAX_ITERATIONS
  } = inputs;

  // Phase 1: Planning
  // Phase 2: Implementation
  // Phase 3: Verification
  // Phase 4: Final approval

  return { success, quality, iterations };
}
```

**File organization for complex processes:**

```
my-process/
├── main.js              # Main process function
├── tasks/
│   ├── build.js         # Build-related tasks
│   ├── test.js          # Test-related tasks
│   └── quality.js       # Quality scoring tasks
├── helpers/
│   ├── scoring.js       # Scoring utilities
│   └── validation.js    # Input validation
├── examples/
│   └── inputs.json      # Example inputs
└── README.md            # Process documentation
```

### Error Handling Strategies

Robust error handling prevents data loss and enables recovery.

**Error handling patterns:**

```javascript
export async function process(inputs, ctx) {
  try {
    // Main workflow logic
    const result = await ctx.task(riskyTask, { data: inputs.data });
    return { success: true, result };

  } catch (error) {
    // Log error for debugging
    ctx.log('Task failed', { error: error.message, stack: error.stack });

    // Determine if recoverable
    if (isTransientError(error)) {
      // Retry with backoff
      await ctx.sleepUntil(new Date(ctx.now().getTime() + 5000).toISOString());
      return await ctx.task(riskyTask, { data: inputs.data, retry: true });
    }

    if (isUserActionRequired(error)) {
      // Request human intervention
      await ctx.breakpoint({
        question: `Error occurred: ${error.message}. How should we proceed?`,
        title: 'Error Recovery',
        context: { runId: ctx.runId, files: [{ path: 'artifacts/error-log.json', format: 'code', language: 'json' }] }
      });

      // Retry after human review
      return await ctx.task(riskyTask, { data: inputs.data, retry: true });
    }

    // Unrecoverable error - fail gracefully
    return { success: false, error: error.message };
  }
}

function isTransientError(error) {
  return error.message.includes('rate limit') ||
         error.message.includes('timeout') ||
         error.message.includes('ECONNRESET');
}

function isUserActionRequired(error) {
  return error.message.includes('permission') ||
         error.message.includes('authentication') ||
         error.message.includes('invalid configuration');
}
```

**Error categories and handling:**

| Error Type | Handling Strategy | Example |
|------------|-------------------|---------|
| Transient | Retry with backoff | Network timeouts, rate limits |
| Configuration | Request user input | Missing credentials |
| Validation | Fail fast with clear message | Invalid inputs |
| Logic | Log and investigate | Unexpected state |
| External | Breakpoint for decision | API changes |

### Idempotency and Resumability

Design processes that can be safely interrupted and resumed.

**Idempotency principles:**

1. **Use deterministic identifiers**: Derive IDs from inputs, not random values
2. **Check before creating**: Verify resources do not exist before creating
3. **Prefer upserts**: Update if exists, create if not
4. **Record completed work**: Track what has been done in the journal

**Resumable process pattern:**

```javascript
export async function process(inputs, ctx) {
  // Each task call is automatically idempotent
  // If the run is resumed, completed tasks return cached results

  // Task 1: Planning (if resumed, returns cached plan)
  const plan = await ctx.task(planningTask, { feature: inputs.feature });

  // Task 2: Implementation (if resumed, returns cached result)
  const impl = await ctx.task(implementTask, { plan });

  // Breakpoint: Natural pause point (if resumed after approval, continues)
  await ctx.breakpoint({ question: 'Continue?', title: 'Checkpoint' });

  // Task 3: Deployment (only executed if previous tasks complete)
  const deploy = await ctx.task(deployTask, { impl });

  return { success: true, deploy };
}
```

**Deterministic code requirements:**

```javascript
// WRONG: Non-deterministic
const timestamp = Date.now();           // Different on each replay
const id = Math.random().toString(36);  // Different on each replay

// CORRECT: Deterministic
const timestamp = ctx.now().getTime();  // Replayed consistently
const id = `task-${ctx.runId}-${iteration}`;  // Derived from stable values
```

### Testing Processes

Validate processes before using them in production.

**Testing strategies:**

| Strategy | Purpose | Approach |
|----------|---------|----------|
| Unit testing | Test individual tasks | Mock dependencies, verify outputs |
| Integration testing | Test task interactions | Use test fixtures, verify flow |
| Dry-run testing | Validate process logic | Run with small inputs, review journal |
| Snapshot testing | Detect regressions | Compare journal events over time |

**Dry-run testing pattern:**

Start a test run with minimal inputs:
```
/babysitter:call test my-process with small inputs
```

Then ask Claude to show you the results:
```
Show me what happened in the test run
```

**Process validation checklist:**

- [ ] All task definitions have `io.inputJsonPath` and `io.outputJsonPath`
- [ ] Process handles missing/invalid inputs gracefully
- [ ] Breakpoints have clear questions and appropriate context files
- [ ] Error paths are handled (try/catch or conditional logic)
- [ ] Process returns meaningful output
- [ ] No non-deterministic code (Date.now, Math.random, etc.)

---

## Quality Convergence Best Practices

### Setting Appropriate Targets

Quality targets should be achievable but challenging.

**Target calibration approach:**

1. **Establish baseline**: Run process once, note initial quality
2. **Set stretch target**: 10-15 points above baseline
3. **Monitor iterations**: Track how many iterations to converge
4. **Adjust based on data**: Lower if never achieved, raise if too easy

**Domain-specific targets:**

| Domain | Typical Target | Rationale |
|--------|----------------|-----------|
| New feature code | 85-90 | Balance quality with speed |
| Bug fixes | 80-85 | Focused, limited scope |
| Refactoring | 90-95 | Must not introduce regressions |
| Security-critical | 95+ | Cannot compromise on quality |
| Documentation | 75-85 | Subjective, faster convergence |
| Prototypes | 70-75 | Speed over perfection |

**Progressive target pattern:**

```javascript
// Start with achievable target, progressively increase
const progressiveTargets = [
  { iteration: 1, target: 70 },   // First iteration: basic functionality
  { iteration: 3, target: 80 },   // Mid iterations: solid implementation
  { iteration: 5, target: 85 }    // Final iterations: polish
];

function getCurrentTarget(iteration) {
  const applicable = progressiveTargets.filter(t => t.iteration <= iteration);
  return applicable[applicable.length - 1]?.target || 85;
}
```

### Custom Scoring Strategies

Tailor scoring to your specific quality criteria.

**Scoring weight configuration:**

```javascript
// Domain-specific weights
const scoringWeights = {
  // For backend APIs
  api: {
    tests: 0.30,         // Test quality is critical
    implementation: 0.25, // Code correctness
    security: 0.25,       // Security is paramount
    codeQuality: 0.10,    // Style and maintainability
    alignment: 0.10       // Requirements match
  },

  // For frontend UI
  frontend: {
    tests: 0.20,          // Test quality
    implementation: 0.25, // Code correctness
    accessibility: 0.20,  // WCAG compliance
    codeQuality: 0.15,    // Style and maintainability
    alignment: 0.20       // Design match
  },

  // For data pipelines
  dataPipeline: {
    correctness: 0.35,    // Data accuracy
    performance: 0.25,    // Processing speed
    reliability: 0.20,    // Error handling
    tests: 0.15,          // Test coverage
    documentation: 0.05   // Pipeline docs
  }
};
```

**Multi-dimensional scoring task:**

```javascript
export const qualityScoringTask = defineTask('quality-scorer', (args, taskCtx) => ({
  kind: 'agent',
  title: `Score quality (iteration ${args.iteration})`,
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'senior quality assurance engineer',
      task: 'Evaluate implementation quality across multiple dimensions',
      context: {
        implementation: args.implementation,
        tests: args.tests,
        qualityChecks: args.qualityChecks,
        weights: args.weights
      },
      instructions: [
        `Score each dimension from 0-100:`,
        `- Tests: Coverage, edge cases, assertions`,
        `- Implementation: Correctness, readability, maintainability`,
        `- Code Quality: Lint results, type safety, complexity`,
        `- Security: Vulnerabilities, input validation`,
        `- Alignment: Requirements match, no scope creep`,
        `Apply weights: ${JSON.stringify(args.weights)}`,
        `Calculate weighted overall score`,
        `Provide prioritized improvement recommendations`
      ],
      outputFormat: 'JSON with overallScore, dimensionScores, recommendations'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
```

### Balancing Speed vs Thoroughness

Optimize the quality convergence loop for your needs.

**Speed-focused configuration:**

```javascript
// Prioritize fast convergence
const speedConfig = {
  maxIterations: 3,
  targetQuality: 75,
  parallelChecks: true,
  skipOptionalChecks: true,
  earlyExitOnTarget: true
};
```

**Thoroughness-focused configuration:**

```javascript
// Prioritize comprehensive quality
const thoroughConfig = {
  maxIterations: 10,
  targetQuality: 95,
  parallelChecks: true,
  includeSecurityAudit: true,
  includePerformanceCheck: true,
  requireHumanReview: true
};
```

**Adaptive configuration based on context:**

```javascript
function getQualityConfig(context) {
  // High-stakes production changes
  if (context.isProduction && context.affectsPayments) {
    return { targetQuality: 95, maxIterations: 10, requireApproval: true };
  }

  // Regular feature development
  if (context.isFeature) {
    return { targetQuality: 85, maxIterations: 5, requireApproval: false };
  }

  // Hot fixes
  if (context.isHotfix) {
    return { targetQuality: 80, maxIterations: 3, requireApproval: true };
  }

  // Prototypes
  return { targetQuality: 70, maxIterations: 2, requireApproval: false };
}
```

---

## Team Collaboration Patterns

### Shared Run Management

Enable multiple team members to interact with runs.

**Run sharing approaches:**

| Approach | Use Case | Implementation |
|----------|----------|----------------|
| Shared workspace | Co-located team | Shared `.a5c/runs/` directory |
| Cloud storage | Distributed team | Sync runs to S3/GCS/Azure |
| Git-based | Audit requirements | Commit runs to repository |
| API access | External integration | Expose via breakpoints API |

**Descriptive workflows for team clarity:**

Start a clearly-named workflow:
```
/babysitter:call implement oauth2 authentication feature
```

Team members can easily find and resume:
```
/babysitter:call resume the oauth2 authentication babysitter run
```

**Run handoff workflow:**

```
# Developer A: Start the workflow during morning
/babysitter:call implement the API feature
# Run reaches breakpoint requiring review

# Developer B: Review and continue in evening
What's the status of the API feature babysitter run?
# Approve breakpoint via UI at http://localhost:3184, then:
/babysitter:call resume the API feature run
```

### Code Review Workflows with Babysitter

Integrate Babysitter into your code review process.

**Pre-review quality check:**

```javascript
export async function process(inputs, ctx) {
  // Generate implementation
  const impl = await ctx.task(implementTask, { feature: inputs.feature });

  // Run comprehensive quality checks before review
  const [tests, lint, security, coverage] = await ctx.parallel.all([
    () => ctx.task(testTask, { impl }),
    () => ctx.task(lintTask, { impl }),
    () => ctx.task(securityTask, { impl }),
    () => ctx.task(coverageTask, { impl })
  ]);

  // Agent generates review summary
  const reviewSummary = await ctx.task(agentReviewSummaryTask, {
    impl,
    tests,
    lint,
    security,
    coverage
  });

  // Breakpoint for human code review
  await ctx.breakpoint({
    question: `Implementation ready for review. Quality score: ${reviewSummary.score}. Approve?`,
    title: 'Code Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/review-summary.md', format: 'markdown' },
        { path: 'artifacts/diff.patch', format: 'code', language: 'diff' },
        { path: 'artifacts/coverage-report.html', format: 'html' }
      ]
    }
  });

  return { success: true, reviewSummary };
}
```

**Review feedback integration:**

```javascript
// Process reviewer feedback and iterate
await ctx.breakpoint({
  question: 'Review the changes. Provide feedback or approve.',
  title: 'Code Review Round 1'
});

// After approval, feedback is captured in the journal
// Next iteration can reference reviewer comments
```

### Communication via Breakpoints

Use breakpoints for asynchronous team communication.

**Status update pattern:**

```javascript
// Report progress to stakeholders
await ctx.breakpoint({
  question: 'Phase 1 complete. 3 of 5 modules implemented. Continue to Phase 2?',
  title: 'Progress Update',
  context: {
    runId: ctx.runId,
    files: [
      { path: 'artifacts/progress-report.md', format: 'markdown' },
      { path: 'artifacts/metrics.json', format: 'code', language: 'json' }
    ]
  }
});
```

**Decision request pattern:**

```javascript
// Request strategic decision
await ctx.breakpoint({
  question: 'Two implementation approaches possible. A: Faster but limited. B: Comprehensive but slower. Which approach?',
  title: 'Architecture Decision Required',
  context: {
    runId: ctx.runId,
    files: [
      { path: 'artifacts/approach-comparison.md', format: 'markdown' }
    ]
  }
});
```

**Multi-platform notification:**

- **Web UI**: http://localhost:3184 for browser-based review
- **Telegram**: Mobile notifications for on-the-go approvals
- **Hooks**: Custom notifications to Slack, email, etc.

---

## Performance Optimization

### Reducing Iteration Count

Minimize iterations while maintaining quality.

**Iteration reduction strategies:**

| Strategy | Impact | Implementation |
|----------|--------|----------------|
| Better initial prompts | High | Provide detailed context to agent tasks |
| Feedback loops | High | Pass previous iteration recommendations |
| Early exit on plateau | Medium | Stop when quality stops improving |
| Progressive targets | Medium | Lower targets for early iterations |
| Scope control | High | Limit scope per iteration |

**Feedback-driven improvement:**

```javascript
let iteration = 0;
let quality = 0;
const iterationResults = [];

while (iteration < maxIterations && quality < targetQuality) {
  iteration++;

  // Include feedback from previous iteration
  const previousFeedback = iteration > 1
    ? iterationResults[iteration - 2].recommendations
    : null;

  const impl = await ctx.task(implementTask, {
    feature,
    iteration,
    previousFeedback,  // Guide improvements based on scoring feedback
    focusAreas: previousFeedback?.slice(0, 3)  // Top 3 priorities
  });

  const score = await ctx.task(scoringTask, { impl });
  quality = score.overall;

  iterationResults.push({
    iteration,
    quality,
    recommendations: score.recommendations
  });

  ctx.log(`Iteration ${iteration}: ${quality}/${targetQuality}`);
}
```

### Parallel Execution Optimization

Maximize throughput with effective parallelization.

**Parallel execution guidelines:**

1. **Identify independent tasks**: Tasks with no data dependencies
2. **Use thunk wrappers**: Always wrap in `() =>` for deferred execution
3. **Batch large workloads**: Process in chunks to avoid resource exhaustion
4. **Handle errors individually**: Catch errors per task to avoid losing all results

**Chunked parallel processing:**

```javascript
const items = inputs.files;  // Large array
const chunkSize = 10;        // Process 10 at a time
const results = [];

for (let i = 0; i < items.length; i += chunkSize) {
  const chunk = items.slice(i, i + chunkSize);

  const chunkResults = await ctx.parallel.map(chunk, async item => {
    try {
      return { item, success: true, result: await ctx.task(processTask, { item }) };
    } catch (error) {
      return { item, success: false, error: error.message };
    }
  });

  results.push(...chunkResults);
  ctx.log(`Processed ${Math.min(i + chunkSize, items.length)}/${items.length}`);
}
```

**Optimal parallel batching:**

| Scenario | Chunk Size | Rationale |
|----------|------------|-----------|
| CPU-bound tasks | Number of cores | Match available parallelism |
| I/O-bound tasks | 10-20 | Higher concurrency OK |
| API calls | 5-10 | Respect rate limits |
| Memory-intensive | 2-5 | Avoid OOM |

### Efficient Task Design

Design tasks for minimal overhead and maximum reuse.

**Task design principles:**

1. **Right-size scope**: Neither too fine nor too coarse
2. **Clear contracts**: Well-defined inputs and outputs
3. **Minimal dependencies**: Only require what is needed
4. **Fast failure**: Validate inputs early, fail fast
5. **Meaningful results**: Return useful data for subsequent tasks

**Efficient task definition:**

```javascript
// Good: Focused, well-defined task
export const lintTask = defineTask('lint', (args, taskCtx) => ({
  kind: 'node',
  title: 'Run linter',
  node: {
    entry: 'scripts/lint.js',
    args: args.files ? ['--files', ...args.files] : ['--all'],
    timeout: 60000  // Fast timeout for quick task
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

// The script itself should:
// 1. Validate inputs
// 2. Execute quickly
// 3. Return structured results
// 4. Handle errors gracefully
```

---

## Debugging and Troubleshooting

When a run isn't behaving as expected, use this decision tree:

### Quick Diagnosis Flowchart

```
Run not progressing?
    │
    ├── Status = "waiting" ──────► Check for pending breakpoints
    │                              Ask: "Are there pending breakpoints?"
    │
    ├── Status = "failed" ───────► Check error in journal
    │                              Ask: "What error caused the run to fail?"
    │
    ├── Quality not improving ───► Check feedback is being passed
    │                              Ask: "What recommendations came from quality scoring?"
    │
    └── Stuck in loop ───────────► Check iteration count and maxIterations
                                   Add plateau detection
```

### Common Debugging Questions

Ask Claude these questions to debug your workflow:

```
What's the status of my babysitter run?
```

```
Show me the recent events in my workflow
```

```
Are there any pending tasks in my babysitter run?
```

```
What were the quality scores across iterations?
```

```
Show me the result of the last completed task
```

### When to Investigate

| Symptom | What to Check | Likely Cause |
|---------|---------------|--------------|
| Run immediately completes | Quality target too low | Raise `targetQuality` |
| Run never completes | Quality target unreachable | Lower target or increase `maxIterations` |
| Same quality every iteration | Feedback not being passed | Check `previousFeedback` is used |
| Run hangs | Pending breakpoint | Approve via UI or check service |
| Erratic quality scores | Non-deterministic scoring | Use consistent criteria |
| "Already running" error | Session conflict | Wait for other session |

### Recovery Procedures

**If run is stuck waiting:**
Ask Claude what it's waiting for:
```
What is my babysitter run waiting for?
```
If waiting on breakpoint, approve it via UI at http://localhost:3184

**If run state is corrupted:**
Ask Claude to help recover:
```
My babysitter run state seems corrupted, can you help recover it?
```

**If process code changed mid-run:**
Best to start fresh - old state may be incompatible:
```
/babysitter:call start a new workflow for the same feature
```

---

## Common Pitfalls and How to Avoid Them

### Process Design Pitfalls

| Pitfall | Symptom | Solution |
|---------|---------|----------|
| Non-deterministic code | Different results on resume | Use `ctx.now()` instead of `Date.now()` |
| Missing io paths | Results not persisted | Always include `io.inputJsonPath` and `io.outputJsonPath` |
| Code changes mid-run | Unexpected behavior on resume | Avoid modifying process code during active runs |
| Infinite loops | Process never completes | Always set `maxIterations` |
| No error handling | Silent failures | Wrap risky operations in try/catch |

**Determinism checklist:**

```javascript
// AVOID: Non-deterministic patterns
const id = Math.random().toString(36);      // Random
const ts = Date.now();                       // Wall clock
const uuid = crypto.randomUUID();            // Random

// USE: Deterministic patterns
const id = `task-${ctx.runId}-${iteration}`; // Derived
const ts = ctx.now().getTime();              // Replayed consistently
const hash = hashInputs(args);               // Derived from inputs
```

### Execution Pitfalls

| Pitfall | Symptom | Solution |
|---------|---------|----------|
| Missing thunk wrappers | Tasks execute immediately | Wrap parallel tasks in `() =>` |
| Parallelizing dependent tasks | Race conditions | Execute sequentially if dependent |
| Too many parallel tasks | Resource exhaustion | Use chunked processing |
| Forgetting to read result files | Empty results | Wait for task completion, then read |
| Writing result.json directly | SDK errors | Use `task:post` command |

**Correct patterns:**

```javascript
// WRONG: Missing thunks
const results = await ctx.parallel.all([
  ctx.task(taskA, {}),  // Executes immediately!
  ctx.task(taskB, {})   // Executes immediately!
]);

// CORRECT: With thunks
const results = await ctx.parallel.all([
  () => ctx.task(taskA, {}),  // Deferred
  () => ctx.task(taskB, {})   // Deferred
]);
```

### Quality Convergence Pitfalls

| Pitfall | Symptom | Solution |
|---------|---------|----------|
| Unrealistic targets | Never converges | Lower target or increase iterations |
| No feedback loop | Quality plateaus | Pass recommendations to next iteration |
| Inconsistent scoring | Erratic quality numbers | Use deterministic scoring criteria |
| Sequential quality checks | Slow iterations | Parallelize independent checks |
| No early exit | Wasted iterations | Exit on plateau detection |

**Quality plateau detection:**

```javascript
// Track quality history
const qualityHistory = [];

while (iteration < maxIterations && quality < targetQuality) {
  iteration++;
  // ... implementation ...
  quality = score.overall;
  qualityHistory.push(quality);

  // Detect plateau (no improvement in last 3 iterations)
  if (qualityHistory.length >= 3) {
    const recent = qualityHistory.slice(-3);
    const spread = Math.max(...recent) - Math.min(...recent);
    if (spread < 2) {
      ctx.log(`Quality plateaued at ${quality}, stopping`);
      break;
    }
  }
}
```

### Breakpoint Pitfalls

| Pitfall | Symptom | Solution |
|---------|---------|----------|
| Breakpoint not resolving | Workflow hangs | Verify breakpoints service is running |
| Context files not displaying | Missing content | Write files before calling breakpoint |
| Automated pipeline blocking | Pipeline hangs | Use conditional breakpoints or auto-approve |
| Too many breakpoints | Slow workflow | Only use for high-value decisions |

**Conditional breakpoint for automated environments:**

```javascript
// Skip breakpoints in automated environment
if (process.env.BABYSITTER_AUTO_APPROVE !== 'true') {
  await ctx.breakpoint({
    question: 'Review the plan?',
    title: 'Plan Review'
  });
} else {
  ctx.log('CI environment: auto-approving plan');
}
```

### Resumption Pitfalls

| Pitfall | Symptom | Solution |
|---------|---------|----------|
| Attempting to resume completed run | No effect | Check status before resuming |
| Unresolved breakpoint | "Waiting" status persists | Approve breakpoint before resume |
| State corruption | Unexpected behavior | Ask Claude to rebuild state |
| Session conflict | "Already running" error | Wait for other session to complete |

**Pre-resume checklist:**

1. Check current status:
   ```
   What's the status of my babysitter run?
   ```

2. If waiting, check for pending breakpoints:
   ```
   Are there any pending breakpoints?
   ```

3. Resolve pending breakpoints via UI at http://localhost:3184

4. Resume:
   ```
   /babysitter:call resume
   ```

---

## Quick Reference Checklist

### Before Creating a Process

- [ ] Defined clear inputs and outputs
- [ ] Identified task boundaries and dependencies
- [ ] Planned breakpoint placement
- [ ] Set realistic quality targets and iteration limits
- [ ] Included error handling
- [ ] Made all code deterministic

### Before Starting a Run

- [ ] Validated input file contents
- [ ] Verified process code is stable (no pending changes)
- [ ] Ensured breakpoints service is running (if using breakpoints)
- [ ] Used descriptive run ID

### During Execution

- [ ] Monitoring iteration progress
- [ ] Reviewing quality scores
- [ ] Responding to breakpoints promptly
- [ ] Checking for errors in journal

### Before Resuming a Run

- [ ] Verified run is in resumable state
- [ ] Resolved any pending breakpoints
- [ ] Process code has not changed
- [ ] No other sessions are running the same run

---

## Related Documentation

- [Breakpoints](./breakpoints.md) - Human-in-the-loop approval
- [Quality Convergence](./quality-convergence.md) - Iterative improvement
- [Process Definitions](./process-definitions.md) - Creating workflows
- [Parallel Execution](./parallel-execution.md) - Concurrent tasks
- [Run Resumption](./run-resumption.md) - Pause and continue
- [Journal System](./journal-system.md) - Event sourcing
- [Hooks](./hooks.md) - Extensible lifecycle events
- [Process Library](./process-library.md) - 2,000+ pre-built processes

---

## Explore Methodologies and Processes

**These best practices apply to ANY of Babysitter's workflows.** Whether you're using a methodology or a domain-specific process, these patterns will help you get the best results.

### Methodologies (19+) - Development Approaches

Not sure which methodology to use? Here's a quick guide:

| If you need... | Try this methodology |
|----------------|---------------------|
| Fast, working code | GSD (Get Stuff Done) |
| High test coverage | TDD Quality Convergence |
| Enterprise governance | Spec-Kit |
| Team alignment on requirements | BDD/Specification by Example |
| Complex domain modeling | Domain-Driven Design |
| Risk management | Spiral Model |

**Browse methodologies:**
- [All 19+ methodologies with source code](../reference/glossary.md#methodology)
- [Methodologies folder](../../../plugins/babysitter/skills/babysit/process/methodologies/)

### Domain Processes (2,000+) - Ready-to-Use Workflows

Beyond methodologies, explore 2,000+ domain-specific processes:

| Domain | Processes | Browse |
|--------|-----------|--------|
| **Development** | 680+ (web, mobile, DevOps, AI, security) | [Browse →](../../../plugins/babysitter/skills/babysit/process/specializations/) |
| **Business** | 430+ (legal, HR, marketing, finance) | [Browse →](../../../plugins/babysitter/skills/babysit/process/specializations/domains/business/) |
| **Science & Engineering** | 550+ (physics, aerospace, biomedical) | [Browse →](../../../plugins/babysitter/skills/babysit/process/specializations/domains/science/) |

See the full catalog in the [Process Library](./process-library.md).

---

## Summary

This guide provides a comprehensive reference for Babysitter best practices. Key takeaways:

1. **Workflow Design**: Use breakpoints strategically, set realistic iteration limits, decompose tasks appropriately, and choose the right execution model.

2. **Process Development**: Structure processes clearly, handle errors gracefully, ensure idempotency for resumability, and test processes thoroughly.

3. **Quality Convergence**: Set achievable targets, customize scoring for your domain, and balance speed with thoroughness based on context.

4. **Team Collaboration**: Use descriptive run IDs, integrate with code review workflows, and leverage breakpoints for asynchronous communication.

5. **Performance**: Reduce iterations through feedback loops, parallelize independent tasks, and design efficient task definitions.

6. **Avoid Pitfalls**: Keep code deterministic, use proper thunk wrappers, detect quality plateaus, and follow proper resumption procedures.

Apply these patterns consistently to maximize the value of Babysitter in your development workflows.
