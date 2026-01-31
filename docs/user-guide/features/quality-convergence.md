# Quality Convergence: Iterative Improvement Until Targets Met

**Version:** 2.1
**Last Updated:** 2026-01-26
**Category:** Feature Guide

---

## Quick Summary (Read This First)

**Quality Convergence = "Keep trying until it's good enough"**

Instead of:
```
AI writes code → Tests fail → You manually fix → Tests fail again → Repeat 10x
```

Babysitter does:
```
AI writes code → Tests: 60% pass → AI fixes → Tests: 85% pass → AI fixes → Tests: 95% pass ✓ Done!
```

### What You'll Learn in This Document

| Section | What It Covers | Read If You Want To... |
|---------|----------------|------------------------|
| Five Quality Gates | Types of checks (tests, lint, security, etc.) | Understand what gets checked |
| 90-Score Pattern | How to reliably hit high quality | Build production-ready workflows |
| Process Examples | Real code from the library | See working implementations |
| Step-by-Step | How to build your own | Create custom quality loops |

### A Simple Example

Here's what quality convergence looks like in practice:

```
Iteration 1:
  - AI writes login feature
  - Tests run: 3/10 passing (30%)
  - AI sees: "Missing password validation, no error handling"

Iteration 2:
  - AI fixes based on feedback
  - Tests run: 7/10 passing (70%)
  - AI sees: "Edge case for empty email not handled"

Iteration 3:
  - AI fixes edge cases
  - Tests run: 10/10 passing (100%)
  - Quality target met! ✓

Output: Working login feature with all tests passing
```

**Key insight**: The AI doesn't just try once - it learns from each failure and improves.

### Understanding Quality Scores

**Quality scores are multi-dimensional, not a single number.** This is what makes Babysitter's quality convergence so accurate - instead of a simple pass/fail, you get nuanced feedback across multiple dimensions that guide improvement.

A typical quality score includes:

| Dimension | What It Measures | Example |
|-----------|------------------|---------|
| **Tests** | Pass rate and coverage | 92% tests passing, 85% coverage |
| **Code Quality** | Lint errors, complexity | 0 lint errors, complexity < 10 |
| **Security** | Vulnerabilities, secrets | 0 critical issues |
| **Performance** | Response time, bundle size | p95 < 500ms |
| **Type Safety** | Type errors, null safety | 0 type errors |

### The Power of Custom Dimensions

**You define what quality means for your project.** The dimensions above are just examples - you can:

1. **Define your own 5 dimensions** that matter most for your domain
2. **Ask Babysitter to suggest dimensions** appropriate for your specific task
3. **Weight dimensions differently** based on project phase or criticality

For example, a data pipeline might use completely different dimensions:

| Dimension | Weight | Threshold |
|-----------|--------|-----------|
| **Data Accuracy** | 30% | > 99.9% |
| **Processing Speed** | 25% | < 5 min/GB |
| **Schema Validation** | 20% | 100% valid |
| **Idempotency** | 15% | All operations idempotent |
| **Error Recovery** | 10% | Auto-recovery < 30s |

This flexibility means quality convergence adapts to any domain - from ML model training to infrastructure deployment to documentation generation.

**For detailed scoring formulas and weight configurations, see [Best Practices - Custom Scoring Strategies](./best-practices.md#custom-scoring-strategies).**

---

## Overview

Quality convergence is an iterative improvement pattern where Babysitter repeatedly refines work until a defined quality target is achieved. Instead of executing a task once and hoping for the best, quality convergence loops through implementation, testing, and scoring cycles until the output meets your standards.

### The Core Principle: Evidence-Driven Completion

From the [Two-Loops Control Plane architecture](./two-loops-architecture.md), the fundamental principle is:

> **If you don't have evidence, you don't have completion.**

*If you do only one thing: make completion require evidence.* — This single principle transforms "it seems done" into "it is done."

Every phase must end with:
- **Artifact**: The work product (patch, doc, config, report)
- **Evidence**: Proof that it meets requirements (logs, test output, checks)

### Why Use Quality Convergence

- **Consistent Quality**: Guarantee outputs meet minimum quality thresholds
- **Automated Refinement**: Let the system iterate without manual intervention
- **Measurable Results**: Track quality scores across iterations
- **Predictable Outcomes**: Set clear targets and iteration limits
- **TDD Integration**: Combine with test-driven development for robust code
- **Evidence-Based Completion**: Every iteration produces verifiable proof of quality

---

## The Five Quality Gate Categories

Quality gates are not a single check. They form a **layered validation system** that ensures completeness from multiple perspectives. For robust quality convergence, use **4-5 gate types simultaneously**.

### Gate Type 1: Functional Tests (Unit/Integration/System/Acceptance)

Verifies the code behaves correctly across all levels.

```javascript
// From: methodologies/v-model.js (V-Model process)
const testResults = await ctx.task(executeTestsTask, {
  implementation,
  unitTestDesigns,      // Validates module design
  integrationTestDesign, // Validates architecture
  systemTestDesign,      // Validates system design
  acceptanceTestDesign   // Validates requirements
});

const allTestsPassed =
  testResults.unitTests.passed &&
  testResults.integrationTests.passed &&
  testResults.systemTests.passed &&
  testResults.acceptanceTests.passed;
```

**Gate Criteria:**

| Test Level | What It Validates | Typical Pass Threshold |
|------------|-------------------|------------------------|
| Unit Tests | Individual functions/classes | 90-100% pass rate |
| Integration Tests | Module interactions | 95-100% pass rate |
| System Tests | End-to-end behavior | 90-100% pass rate |
| Acceptance Tests | User requirements | 100% for critical |

### Gate Type 2: Code Quality (Lint/Format/Complexity)

Ensures code follows style guidelines and maintainability standards.

```javascript
// Parallel code quality checks
const [lint, format, complexity] = await ctx.parallel.all([
  () => ctx.task(lintTask, { files: impl.filesModified }),
  () => ctx.task(formatCheckTask, { files: impl.filesModified }),
  () => ctx.task(complexityTask, { files: impl.filesModified })
]);

const codeQualityGatePassed =
  lint.errorCount === 0 &&
  format.violations === 0 &&
  complexity.maxCyclomaticComplexity < 10;
```

**Gate Criteria:**

| Check | Tool Examples | Typical Threshold |
|-------|---------------|-------------------|
| Lint Errors | ESLint, Pylint | 0 errors |
| Formatting | Prettier, Black | 0 violations |
| Cyclomatic Complexity | SonarQube, Radon | < 10 per function |
| Code Duplication | jscpd, CPD | < 3% duplication |

### Gate Type 3: Type Safety and Static Analysis

Catches bugs at compile/analysis time without running the code.

```javascript
// From: gsd/iterative-convergence enhanced pattern
const [typeCheck, staticAnalysis] = await ctx.parallel.all([
  () => ctx.task(typeCheckTask, { files: impl.filesModified }),
  () => ctx.task(staticAnalysisTask, { files: impl.filesModified })
]);

const staticGatePassed =
  typeCheck.errors.length === 0 &&
  staticAnalysis.criticalIssues === 0 &&
  staticAnalysis.highIssues === 0;
```

**Gate Criteria:**

| Check | What It Catches | Typical Threshold |
|-------|-----------------|-------------------|
| Type Checking | Type mismatches, null errors | 0 type errors |
| Static Analysis | Potential bugs, code smells | 0 critical/high issues |
| Dead Code | Unreachable statements | 0 dead code blocks |
| Null Safety | Potential null dereferences | 0 null warnings |

### Gate Type 4: Security Scanning

Identifies vulnerabilities, secrets, and security anti-patterns.

```javascript
// Security gate from methodologies/spec-driven-development.js
const security = await ctx.task(securityTask, {
  files: impl.filesModified,
  scanLevel: inputs.safetyLevel // 'standard' | 'high' | 'critical'
});

const securityGatePassed =
  security.criticalVulnerabilities === 0 &&
  security.highVulnerabilities === 0 &&
  security.secretsDetected === 0 &&
  security.dependencyVulnerabilities.critical === 0;
```

**Gate Criteria:**

| Check | What It Scans | Typical Threshold |
|-------|---------------|-------------------|
| SAST (Static) | SQL injection, XSS, etc. | 0 critical/high |
| Secrets Detection | API keys, passwords | 0 secrets |
| Dependency Scan | Known CVEs in packages | 0 critical CVEs |
| OWASP Top 10 | Common web vulnerabilities | 0 violations |

### Gate Type 5: Performance and Resource Thresholds

Ensures the implementation meets non-functional requirements.

```javascript
// Performance gate for production readiness
const performance = await ctx.task(performanceCheckTask, {
  implementation: impl,
  thresholds: {
    loadTimeMs: 1500,      // First Contentful Paint
    bundleSizeKb: 200,     // Gzipped bundle
    apiResponseP95Ms: 500, // 95th percentile
    memoryUsageMb: 512     // Peak memory
  }
});

const performanceGatePassed =
  performance.fcp <= 1500 &&
  performance.bundleSize <= 200 &&
  performance.apiP95 <= 500 &&
  performance.peakMemory <= 512;
```

**Gate Criteria:**

| Metric | Typical Target | Domain |
|--------|----------------|--------|
| FCP (First Contentful Paint) | < 1.5s | Frontend |
| Bundle Size | < 200KB gzipped | Frontend |
| API p95 Response | < 500ms | Backend |
| Memory Usage | < 512MB | Server |
| CPU Utilization | < 70% average | Server |

---

## The 90-Score Quality Convergence Pattern

To reliably achieve scores of **90+**, implement a **multi-gate weighted scoring system** with iterative feedback.

### Step 1: Define Weighted Scoring Dimensions

```javascript
// Recommended weights for high-quality convergence
const QUALITY_WEIGHTS = {
  // For production features
  production: {
    tests: 0.25,           // Test coverage and pass rate
    implementation: 0.25,   // Code correctness
    codeQuality: 0.15,      // Lint, complexity, formatting
    security: 0.20,         // Vulnerability scanning
    performance: 0.15       // Non-functional requirements
  },

  // For security-critical systems
  securityCritical: {
    tests: 0.20,
    implementation: 0.20,
    codeQuality: 0.10,
    security: 0.35,         // Higher weight for security
    performance: 0.15
  },

  // For performance-critical systems
  performanceCritical: {
    tests: 0.20,
    implementation: 0.20,
    codeQuality: 0.10,
    security: 0.15,
    performance: 0.35       // Higher weight for performance
  }
};
```

### Step 2: Implement the Multi-Gate Convergence Loop

```javascript
/**
 * Multi-gate quality convergence targeting 90+ scores
 * References: gsd/iterative-convergence.js, methodologies/spec-driven-development.js
 */
export async function process(inputs, ctx) {
  const {
    feature,
    targetQuality = 90,      // Target score
    maxIterations = 10,      // Allow more iterations for high targets
    minImprovement = 2,      // Minimum improvement per iteration
    plateauThreshold = 3,    // Iterations without improvement
    weights = QUALITY_WEIGHTS.production
  } = inputs;

  let iteration = 0;
  let quality = 0;
  const iterationHistory = [];

  while (iteration < maxIterations && quality < targetQuality) {
    iteration++;
    ctx.log(`[Iteration ${iteration}/${maxIterations}] Target: ${targetQuality}`);

    // ===== ACT: Implement with feedback from previous iteration =====
    const previousFeedback = iteration > 1
      ? iterationHistory[iteration - 2].recommendations
      : null;

    const impl = await ctx.task(implementTask, {
      feature,
      iteration,
      previousFeedback,
      focusAreas: previousFeedback?.slice(0, 3) // Top 3 priorities
    });

    // ===== VALIDATE: Run all five quality gates in parallel =====
    const [tests, codeQuality, staticAnalysis, security, performance] =
      await ctx.parallel.all([
        () => ctx.task(testGateTask, { impl }),
        () => ctx.task(codeQualityGateTask, { impl }),
        () => ctx.task(staticAnalysisGateTask, { impl }),
        () => ctx.task(securityGateTask, { impl }),
        () => ctx.task(performanceGateTask, { impl })
      ]);

    // ===== SCORE: Calculate weighted quality score =====
    const scores = {
      tests: tests.score,
      implementation: calculateImplementationScore(impl, tests),
      codeQuality: codeQuality.score,
      security: security.score,
      performance: performance.score
    };

    quality = Object.entries(weights).reduce(
      (total, [dimension, weight]) => total + (scores[dimension] * weight),
      0
    );

    // ===== ANALYZE: Generate prioritized recommendations =====
    const recommendations = generateRecommendations(scores, weights, targetQuality);

    iterationHistory.push({
      iteration,
      quality,
      scores,
      recommendations,
      gates: { tests, codeQuality, staticAnalysis, security, performance }
    });

    ctx.log(`Quality: ${quality.toFixed(1)}/${targetQuality} | ` +
            `Tests: ${scores.tests} | Code: ${scores.codeQuality} | ` +
            `Security: ${scores.security} | Perf: ${scores.performance}`);

    // ===== EARLY EXIT: Detect plateau =====
    if (iteration >= plateauThreshold) {
      const recent = iterationHistory.slice(-plateauThreshold).map(r => r.quality);
      const improvement = Math.max(...recent) - Math.min(...recent);
      if (improvement < minImprovement) {
        ctx.log(`Quality plateaued at ${quality.toFixed(1)}, stopping early`);
        break;
      }
    }

    // ===== BREAKPOINT: At key thresholds =====
    const converged = quality >= targetQuality;
    if (!converged && quality >= 80 && iteration > 1) {
      await ctx.breakpoint({
        question: `Quality at ${quality.toFixed(1)}. Continue toward ${targetQuality}?`,
        title: `Iteration ${iteration} Checkpoint`,
        context: {
          runId: ctx.runId,
          files: [{ path: `artifacts/iteration-${iteration}-report.md`, format: 'markdown' }]
        }
      });
    }
  }

  // ===== FINAL VALIDATION =====
  const converged = quality >= targetQuality;

  return {
    success: converged,
    quality,
    targetQuality,
    iterations: iteration,
    iterationHistory,
    finalGates: iterationHistory[iterationHistory.length - 1].gates,
    metadata: { processId: 'quality-convergence-90', timestamp: ctx.now() }
  };
}

function generateRecommendations(scores, weights, target) {
  // Calculate gap for each dimension
  const gaps = Object.entries(scores).map(([dim, score]) => ({
    dimension: dim,
    score,
    weight: weights[dim],
    weightedGap: (100 - score) * weights[dim],
    priority: (100 - score) * weights[dim] // Higher weighted gap = higher priority
  }));

  // Sort by priority (highest impact improvements first)
  return gaps
    .sort((a, b) => b.priority - a.priority)
    .map(g => `Improve ${g.dimension}: currently ${g.score}, ` +
              `contributes ${(g.weight * g.score).toFixed(1)} of ${(g.weight * 100).toFixed(1)} possible`);
}
```

### Step 3: Progressive Target Strategy

For challenging targets (90+), use progressive escalation:

```javascript
// Progressive targets that increase as iterations proceed
const progressiveTargets = [
  { iteration: 1, target: 70 },   // First: basic functionality
  { iteration: 3, target: 80 },   // Mid: solid implementation
  { iteration: 5, target: 85 },   // Late: polish and edge cases
  { iteration: 7, target: 90 }    // Final: production ready
];

function getCurrentTarget(iteration, finalTarget) {
  const applicable = progressiveTargets.filter(t => t.iteration <= iteration);
  const progressiveTarget = applicable[applicable.length - 1]?.target || 70;
  return Math.min(progressiveTarget, finalTarget);
}
```

---

## Real-World Process Examples

### Example 1: V-Model with Four Test Levels

The V-Model process (`methodologies/v-model.js`) implements comprehensive quality gates:

```
/babysitter:call use the V-Model methodology to build a user authentication system with high safety level
```

Or with more detail:
```
/babysitter:call implement user authentication using V-Model with traceability and thorough testing
```

**Quality Gates in V-Model:**
1. Requirements → Acceptance Tests (validates user needs)
2. System Design → System Tests (validates architecture)
3. Module Design → Integration Tests (validates interfaces)
4. Implementation → Unit Tests (validates code)
5. Traceability Matrix (validates coverage)

### Example 2: Spec-Kit with Constitution Validation

The Spec-Kit process (`methodologies/spec-driven-development.js`) adds governance gates:

```
/babysitter:call use spec-driven development to build PCI-compliant payment processing
```

Or:
```
/babysitter:call build a payment flow using the spec-driven methodology with governance validation
```

**Quality Gates in Spec-Kit:**
1. Constitution Validation (governance principles)
2. Specification Review (requirements completeness)
3. Plan-Constitution Alignment (architecture compliance)
4. Task Consistency Analysis (cross-artifact validation)
5. Implementation Checklists ("unit tests for English")
6. User Story Validation (final acceptance)

### Example 3: GSD Iterative Convergence

The GSD process (`gsd/iterative-convergence.js`) implements feedback-driven convergence:

```
/babysitter:call build a shopping cart checkout flow with 90% quality target
```

Or:
```
/babysitter:call implement checkout flow using iterative convergence with max 8 iterations
```

**Quality Gates in GSD:**
1. Implementation scoring
2. Test execution
3. Quality assessment with recommendations
4. Iterative feedback loop

---

## Use Cases and Scenarios

### Scenario 1: TDD Feature Development

Build a feature with test-driven development, iterating until test coverage and quality targets are met.

```javascript
export async function process(inputs, ctx) {
  const { feature, targetQuality = 85, maxIterations = 5 } = inputs;

  let iteration = 0;
  let quality = 0;

  while (iteration < maxIterations && quality < targetQuality) {
    iteration++;
    ctx.log(`[Iteration ${iteration}/${maxIterations}] Starting TDD implementation...`);

    // Write tests first
    const tests = await ctx.task(writeTestsTask, { feature, iteration });

    // Implement code to pass tests
    const impl = await ctx.task(implementTask, { tests, feature });

    // Run quality checks
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
    ctx.log(`Quality score: ${quality}/${targetQuality}`);
  }

  return { converged: quality >= targetQuality, iterations: iteration, quality };
}
```

### Scenario 2: Code Quality Improvement

Iteratively improve existing code until it meets quality standards.

```javascript
export async function process(inputs, ctx) {
  const { files, targetScore = 90, maxIterations = 10 } = inputs;

  let iteration = 0;
  let currentScore = 0;

  // Initial assessment
  currentScore = await ctx.task(assessQualityTask, { files });
  ctx.log(`Initial quality score: ${currentScore}`);

  while (iteration < maxIterations && currentScore < targetScore) {
    iteration++;

    // Identify improvements
    const improvements = await ctx.task(identifyImprovementsTask, {
      files,
      currentScore,
      targetScore
    });

    // Apply improvements
    await ctx.task(applyImprovementsTask, { improvements });

    // Re-assess
    currentScore = await ctx.task(assessQualityTask, { files });
    ctx.log(`Iteration ${iteration}: Quality score ${currentScore}/${targetScore}`);
  }

  return { achieved: currentScore >= targetScore, finalScore: currentScore };
}
```

### Scenario 3: Documentation Generation

Generate documentation and refine until it meets completeness standards.

```javascript
export async function process(inputs, ctx) {
  const { codebase, targetCompleteness = 80, maxIterations = 3 } = inputs;

  let iteration = 0;
  let completeness = 0;

  while (iteration < maxIterations && completeness < targetCompleteness) {
    iteration++;

    // Generate or improve documentation
    await ctx.task(generateDocsTask, { codebase, iteration });

    // Assess completeness
    const assessment = await ctx.task(assessDocsCompletenessTask, { codebase });
    completeness = assessment.completenessScore;

    ctx.log(`Documentation completeness: ${completeness}%`);
  }

  return { complete: completeness >= targetCompleteness, completeness };
}
```

---

## Step-by-Step Instructions

### Step 1: Define Quality Targets

Determine what quality means for your use case.

**Common quality metrics:**
- Test coverage percentage (e.g., 85%)
- Lint error count (e.g., 0 errors)
- Security vulnerability count (e.g., 0 critical)
- Overall quality score (e.g., 90/100)

### Step 2: Set Iteration Limits

Prevent infinite loops by setting a maximum number of iterations.

```javascript
const { targetQuality = 85, maxIterations = 5 } = inputs;
```

**Recommendations:**
- Simple improvements: 3-5 iterations
- Complex refactoring: 5-10 iterations
- Large features: 10-15 iterations

### Step 3: Implement the Convergence Loop

Create a loop that continues until the target is met or iterations are exhausted.

```javascript
let iteration = 0;
let quality = 0;

while (iteration < maxIterations && quality < targetQuality) {
  iteration++;

  // Perform work
  // ...

  // Measure quality
  quality = await measureQuality();

  ctx.log(`Iteration ${iteration}: ${quality}/${targetQuality}`);
}
```

### Step 4: Implement Quality Scoring

Create a task that evaluates quality based on your criteria.

```javascript
export const agentQualityScoringTask = defineTask('quality-scorer', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score implementation quality',
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'senior quality assurance engineer',
      task: 'Analyze implementation quality and provide a score from 0-100',
      context: {
        tests: args.tests,
        implementation: args.implementation,
        coverage: args.coverage,
        lint: args.lint,
        security: args.security
      },
      instructions: [
        'Review test quality (weight: 25%)',
        'Review implementation quality (weight: 30%)',
        'Review code metrics (weight: 20%)',
        'Review security (weight: 15%)',
        'Review alignment with requirements (weight: 10%)',
        'Provide recommendations for improvement'
      ]
    }
  }
}));
```

### Step 5: Add Feedback to Subsequent Iterations

Pass quality feedback to the next iteration to guide improvements.

```javascript
const iterationResults = [];

while (iteration < maxIterations && quality < targetQuality) {
  iteration++;

  const previousFeedback = iteration > 1
    ? iterationResults[iteration - 2].recommendations
    : null;

  const impl = await ctx.task(implementTask, {
    feature,
    previousFeedback  // Guide improvements based on previous scoring
  });

  const score = await ctx.task(agentScoringTask, { impl });

  iterationResults.push({
    iteration,
    quality: score.overall,
    recommendations: score.recommendations
  });

  quality = score.overall;
}
```

---

## Configuration Options

### Quality Target Configuration

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `targetQuality` | number | 85 | Target quality score (0-100) |
| `maxIterations` | number | 5 | Maximum number of iterations before stopping |

### Scoring Weights Configuration

Customize how different aspects contribute to the overall score.

```javascript
const scoringWeights = {
  tests: 0.25,          // 25% weight for test quality
  implementation: 0.30,  // 30% weight for implementation quality
  codeQuality: 0.20,     // 20% weight for code metrics
  security: 0.15,        // 15% weight for security
  alignment: 0.10        // 10% weight for requirements alignment
};
```

### Early Exit Conditions

Configure conditions that stop iteration early.

```javascript
// Stop if quality plateaus (no improvement in last N iterations)
if (qualityHistory.length >= 3) {
  const lastThree = qualityHistory.slice(-3);
  const improvement = lastThree[2] - lastThree[0];
  if (improvement < 1) {
    ctx.log('Quality plateaued, stopping early');
    break;
  }
}
```

---

## Code Examples and Best Practices

### Example 1: Full TDD Quality Convergence Process

Complete process definition demonstrating all quality convergence patterns.

```javascript
export async function process(inputs, ctx) {
  const {
    feature = 'User authentication',
    targetQuality = 85,
    maxIterations = 5
  } = inputs;

  // Phase 1: Planning
  const plan = await ctx.task(agentPlanningTask, { feature });

  await ctx.breakpoint({
    question: `Review the plan for "${feature}". Approve to proceed?`,
    title: 'Plan Review',
    context: { runId: ctx.runId, files: [{ path: 'artifacts/plan.md', format: 'markdown' }] }
  });

  // Phase 2: Quality Convergence Loop
  let iteration = 0;
  let quality = 0;
  const iterationResults = [];

  while (iteration < maxIterations && quality < targetQuality) {
    iteration++;
    ctx.log(`[Iteration ${iteration}/${maxIterations}]`);

    // TDD: Write tests first
    const tests = await ctx.task(writeTestsTask, {
      feature,
      plan,
      iteration,
      previousFeedback: iteration > 1 ? iterationResults[iteration - 2].feedback : null
    });

    // Run tests (expect failures on first iteration)
    await ctx.task(runTestsTask, { testFiles: tests.testFiles, expectFailures: iteration === 1 });

    // Implement to pass tests
    const impl = await ctx.task(implementTask, {
      feature,
      tests,
      iteration,
      previousFeedback: iteration > 1 ? iterationResults[iteration - 2].feedback : null
    });

    // Run tests again
    const testResults = await ctx.task(runTestsTask, { testFiles: tests.testFiles });

    // Parallel quality checks
    const [coverage, lint, typeCheck, security] = await ctx.parallel.all([
      () => ctx.task(coverageTask, {}),
      () => ctx.task(lintTask, { files: impl.filesModified }),
      () => ctx.task(typeCheckTask, { files: impl.filesModified }),
      () => ctx.task(securityTask, { files: impl.filesModified })
    ]);

    // Agent quality scoring
    const score = await ctx.task(agentQualityScoringTask, {
      tests,
      testResults,
      implementation: impl,
      qualityChecks: { coverage, lint, typeCheck, security },
      iteration,
      targetQuality
    });

    quality = score.overallScore;
    iterationResults.push({
      iteration,
      quality,
      feedback: score.recommendations
    });

    ctx.log(`Quality: ${quality}/${targetQuality}`);

    if (quality >= targetQuality) {
      ctx.log('Target quality achieved!');
    }
  }

  // Final approval
  await ctx.breakpoint({
    question: `Quality: ${quality}/${targetQuality}. Approve for merge?`,
    title: 'Final Review',
    context: { runId: ctx.runId, files: [{ path: 'artifacts/final-report.md', format: 'markdown' }] }
  });

  return {
    success: quality >= targetQuality,
    iterations: iteration,
    finalQuality: quality,
    iterationResults
  };
}
```

### Example 2: Quality Scoring Task Definition

```javascript
export const agentQualityScoringTask = defineTask('quality-scorer', (args, taskCtx) => ({
  kind: 'agent',
  title: `Score quality (iteration ${args.iteration})`,
  description: 'Comprehensive quality assessment with agent',

  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'senior quality assurance engineer and code reviewer',
      task: 'Analyze implementation quality across multiple dimensions',
      context: {
        feature: args.feature,
        tests: args.tests,
        testResults: args.testResults,
        implementation: args.implementation,
        qualityChecks: args.qualityChecks,
        iteration: args.iteration,
        targetQuality: args.targetQuality
      },
      instructions: [
        'Review test quality: coverage, edge cases, assertions (weight: 25%)',
        'Review implementation quality: correctness, readability (weight: 30%)',
        'Review code metrics: lint, types, complexity (weight: 20%)',
        'Review security: vulnerabilities, input validation (weight: 15%)',
        'Review requirements alignment (weight: 10%)',
        'Calculate weighted overall score (0-100)',
        'Provide prioritized recommendations for improvement'
      ],
      outputFormat: 'JSON with overallScore, scores by dimension, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'scores', 'recommendations'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        scores: {
          type: 'object',
          properties: {
            tests: { type: 'number' },
            implementation: { type: 'number' },
            codeQuality: { type: 'number' },
            security: { type: 'number' },
            alignment: { type: 'number' }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
```

### Best Practices

1. **Set Realistic Targets**: Aim for achievable quality scores (80-90% is often reasonable)
2. **Limit Iterations**: Prevent runaway loops with sensible limits (5-10 iterations typically)
3. **Use Parallel Checks**: Run independent quality checks concurrently for efficiency
4. **Provide Feedback**: Pass recommendations from scoring to subsequent iterations
5. **Log Progress**: Track quality scores across iterations for visibility
6. **Include Breakpoints**: Add approval gates at key milestones

---

## Common Pitfalls and Troubleshooting

### Pitfall 1: Quality Score Not Improving

**Symptom:**
```
Iteration 1: Quality 65/100
Iteration 2: Quality 66/100
Iteration 3: Quality 65/100
Iteration 4: Quality 67/100
Iteration 5: Quality 66/100
Target not met: 85/100
```

**Causes:**
- Quality target is unrealistic for the codebase
- Scoring criteria are too strict
- Fundamental issues blocking improvement

**Solutions:**

1. Review iteration feedback to identify blocking issues:
   ```
   What recommendations came from my quality scoring?
   ```

2. Adjust quality target:
   ```javascript
   const { targetQuality = 75 } = inputs;  // Lower target
   ```

3. Increase iteration limit:
   ```javascript
   const { maxIterations = 10 } = inputs;  // More iterations
   ```

4. Review scoring weights for balance

### Pitfall 2: Too Many Iterations

**Symptom:** Process runs for many iterations before converging.

**Cause:** Target is too high or improvements are too granular.

**Solutions:**

1. Implement early exit on plateau:
   ```javascript
   const recentScores = iterationResults.slice(-3).map(r => r.quality);
   if (Math.max(...recentScores) - Math.min(...recentScores) < 2) {
     ctx.log('Quality plateaued, stopping early');
     break;
   }
   ```

2. Increase improvement scope per iteration

3. Lower quality target to realistic level

### Pitfall 3: Inconsistent Quality Scores

**Symptom:** Quality scores vary significantly between iterations without clear reason.

**Cause:** Non-deterministic scoring or external factors.

**Solution:**

1. Use deterministic scoring criteria
2. Ensure `ctx.now()` is used instead of `Date.now()` for timestamps
3. Review agent scoring prompts for consistency

### Pitfall 4: Iteration Takes Too Long

**Symptom:** Each iteration takes several minutes.

**Cause:** Sequential execution of independent tasks.

**Solution:** Use parallel execution:

```javascript
// Slow: Sequential
const coverage = await ctx.task(coverageTask, {});
const lint = await ctx.task(lintTask, {});
const security = await ctx.task(securityTask, {});

// Fast: Parallel
const [coverage, lint, security] = await ctx.parallel.all([
  () => ctx.task(coverageTask, {}),
  () => ctx.task(lintTask, {}),
  () => ctx.task(securityTask, {})
]);
```

---

## Related Documentation

- [Process Definitions](./process-definitions.md) - Learn to create quality convergence processes
- [Parallel Execution](./parallel-execution.md) - Optimize quality checks with parallelism
- [Breakpoints](./breakpoints.md) - Add approval gates to quality convergence workflows
- [Best Practices](./best-practices.md) - Patterns for setting targets, custom scoring strategies, and balancing speed vs thoroughness
- [Process Library](./process-library.md) - Browse 2,000+ pre-built processes with quality convergence
- [Two-Loops Architecture](./two-loops-architecture.md) - Deep dive into the evidence-driven completion model

---

## Try Different Methodologies and Processes

Babysitter offers two levels of reusable workflows:

### Methodologies (19+) - The "How"

**Quality convergence works with ANY of Babysitter's 19+ methodologies** - not just TDD. Methodologies define your development approach:

| Methodology | Best For | Quality Focus |
|-------------|----------|---------------|
| **TDD Quality Convergence** | Test-first development | Test coverage, regression prevention |
| **GSD (Get Stuff Done)** | Rapid prototyping | Working software, iteration speed |
| **Spec-Kit** | Enterprise/governance | Specification compliance, audit trails |
| **BDD/Specification by Example** | Team collaboration | Acceptance criteria, living documentation |
| **Domain-Driven Design** | Complex business domains | Domain model integrity, bounded contexts |

**Browse methodologies:**
- [All 19+ methodologies with source code](../reference/glossary.md#methodology)
- [Methodologies folder](../../../plugins/babysitter/skills/babysit/process/methodologies/)

### Domain Processes (2,000+) - The "What"

Beyond methodologies, Babysitter includes **2,000+ domain-specific processes** for specific tasks:

| Domain | Processes | Examples |
|--------|-----------|----------|
| **Development** | 680+ | Web APIs, mobile apps, DevOps pipelines |
| **Business** | 430+ | Legal contracts, HR workflows, marketing campaigns |
| **Science & Engineering** | 550+ | Quantum algorithms, aerospace systems, biomedical devices |
| **Social Sciences** | 150+ | Research methodologies, survey analysis |

**Browse processes:**
- [Process Library](./process-library.md) - Full catalog with descriptions
- [Specializations folder](../../../plugins/babysitter/skills/babysit/process/specializations/)

---

## What To Do Next

| Your Goal | Next Step |
|-----------|-----------|
| Run a quality convergence workflow | Try `/babysitter:call build a feature with 85% quality target` |
| Build your own convergence loop | Copy the TDD example above and customize the scoring |
| Add more quality gates | See the Five Quality Gate Categories section |
| Debug a stuck convergence | Check [Best Practices - Debugging](./best-practices.md#debugging-and-troubleshooting) |
| Understand the architecture | Read [Two-Loops Architecture](./two-loops-architecture.md) |

---

## Summary

Quality convergence enables automated iterative improvement until defined quality targets are met. Combine quality scoring, feedback loops, and sensible iteration limits to ensure consistent, high-quality outputs. Use parallel execution for efficiency and breakpoints for human oversight at critical milestones.

**Key Takeaways:**

1. **Set realistic targets** - Start with 80-85, work up to 90+
2. **Use multiple gate types** - Tests + lint + security + performance
3. **Pass feedback between iterations** - AI learns from each failure
4. **Detect plateaus early** - Don't waste iterations on no improvement
5. **Parallelize independent checks** - Faster iterations mean faster convergence
