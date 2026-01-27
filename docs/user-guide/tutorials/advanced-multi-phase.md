# Advanced Tutorial: Multi-Phase Feature Development

**Version:** 1.0
**Date:** 2026-01-25
**Category:** Tutorial
**Level:** Advanced
**Estimated Time:** 90-120 minutes
**Primary Personas:** Marcus Thompson (Technical Lead), Sarah Chen (advanced usage)

---

## Learning Objectives

By the end of this tutorial, you will be able to:

1. **Design multi-phase workflows** that follow Research-Plan-Implement-Test-Deploy patterns
2. **Implement quality convergence loops** with agent-based scoring
3. **Configure team collaboration patterns** with strategic breakpoints
4. **Use parallel quality checks** to accelerate feedback cycles
5. **Create governance-ready processes** with comprehensive audit trails
6. **Handle complex iteration logic** with quality thresholds and early exits

---

## Prerequisites

Before starting this tutorial, you should have:

- [ ] Completed **[Beginner Tutorial: Build a Simple REST API](./beginner-rest-api.md)**
- [ ] Completed **[Intermediate Tutorial: Custom Process Definition](./intermediate-custom-process.md)**
- [ ] Strong understanding of **async/await** and **Promise patterns**
- [ ] Familiarity with **software development methodologies** (TDD, Agile)
- [ ] Experience with **team collaboration tools** and workflows
- [ ] A team project where you want to implement structured feature development

### Verify Environment

```bash
# Verify Babysitter SDK
npx @a5c-ai/babysitter-sdk@latest --version
```

### About Breakpoints

This tutorial involves team collaboration breakpoints. How they work depends on your mode:

**Interactive Mode (Claude Code)**: Breakpoints are handled directly in the chat. Great for single-developer workflows.

**Non-Interactive Mode (Team Collaboration)**: For team approval workflows, start the breakpoints service:
```bash
# For team approval workflows with authentication
npx -y @a5c-ai/babysitter-breakpoints@latest start --auth-required
```

Choose the mode that fits your workflow. For learning, interactive mode (no setup) is easiest.

---

## What We're Building

In this tutorial, we will create a **comprehensive feature development workflow** suitable for team environments. This process implements the full software development lifecycle:

### The Five Phases

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     MULTI-PHASE FEATURE DEVELOPMENT                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PHASE 1: RESEARCH                                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ - Analyze codebase patterns                                          │  │
│  │ - Identify existing implementations                                   │  │
│  │ - Review dependencies and constraints                                 │  │
│  │ - Output: Research Report                                            │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                              │                                              │
│                              ▼                                              │
│  PHASE 2: PLANNING           │ BREAKPOINT: Research Review                  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ - Generate technical specifications                                   │  │
│  │ - Define acceptance criteria                                         │  │
│  │ - Create implementation plan                                          │  │
│  │ - Output: Detailed Plan                                              │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                              │                                              │
│                              ▼                                              │
│  PHASE 3: IMPLEMENTATION     │ BREAKPOINT: Plan Approval                   │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ - Write tests first (TDD)                                            │  │
│  │ - Implement code to pass tests                                       │  │
│  │ - Run quality checks in parallel                                      │  │
│  │ - Agent scores quality                                               │  │
│  │ - ITERATE until quality target met                                   │  │
│  │ - Output: Working Code + Tests                                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                              │                                              │
│                              ▼                                              │
│  PHASE 4: VERIFICATION       │ Quality Convergence Loop                    │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ - Run comprehensive test suite                                       │  │
│  │ - Security vulnerability scan                                         │  │
│  │ - Performance benchmarks                                              │  │
│  │ - Documentation check                                                 │  │
│  │ - Output: Verification Report                                        │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                              │                                              │
│                              ▼                                              │
│  PHASE 5: DEPLOYMENT         │ BREAKPOINT: Final Approval                  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ - Create pull request                                                │  │
│  │ - Request code review                                                 │  │
│  │ - Merge after approval                                               │  │
│  │ - Deploy to target environment                                       │  │
│  │ - Output: Deployed Feature                                           │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Features

1. **Quality Convergence**: The implementation phase iterates until a quality target is met
2. **Agent-Based Scoring**: LLM evaluates code quality with detailed feedback
3. **Team Breakpoints**: Strategic approval gates for collaboration
4. **Parallel Quality Checks**: Coverage, lint, security, and tests run simultaneously
5. **Comprehensive Audit Trail**: Every decision tracked for compliance

---

## Step 1: Understanding Quality Convergence

Before we dive into code, let's understand the core concept of **quality convergence**.

### What is Quality Convergence?

Quality convergence is an iterative process where:

1. **Implementation** produces code
2. **Quality checks** measure various metrics
3. **Agent scoring** evaluates overall quality
4. **If below threshold**: iterate with feedback to improve
5. **If at/above threshold**: proceed to next phase

```
┌───────────────────────────────────────────────────────────────────┐
│                    QUALITY CONVERGENCE LOOP                       │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ┌─────────────┐                                                 │
│   │   START     │                                                 │
│   └──────┬──────┘                                                 │
│          │                                                        │
│          ▼                                                        │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐        │
│   │  Implement  │────▶│   Quality   │────▶│   Agent     │        │
│   │    Code     │     │   Checks    │     │  Scoring    │        │
│   └─────────────┘     └─────────────┘     └──────┬──────┘        │
│          ▲                                       │                │
│          │                                       ▼                │
│          │                              ┌───────────────┐         │
│          │                              │ Score >= 85?  │         │
│          │                              └───────┬───────┘         │
│          │                                  │       │             │
│          │                               NO │       │ YES         │
│          │                                  │       │             │
│          │                                  ▼       ▼             │
│          │                           ┌─────────┐ ┌─────────┐     │
│          └───────────────────────────│ Iterate │ │   EXIT  │     │
│             feedback: issues,        │  with   │ │(success)│     │
│             recommendations          │ feedback│ └─────────┘     │
│                                      └─────────┘                  │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

### Quality Scoring Dimensions

The agent evaluates code across multiple dimensions:

| Dimension | Weight | What It Measures |
|-----------|--------|------------------|
| **Correctness** | 30% | Tests pass, requirements met |
| **Coverage** | 20% | Code coverage percentage |
| **Code Quality** | 20% | Lint errors, complexity, style |
| **Security** | 15% | Vulnerability scan results |
| **Documentation** | 15% | Comments, README, API docs |

**Checkpoint 1:** You understand how quality convergence and agent scoring work.

---

## Step 2: Set Up the Project Structure

Create the project structure for our multi-phase workflow:

```bash
# Create project directory
mkdir multi-phase-tutorial
cd multi-phase-tutorial

# Initialize project
npm init -y

# Create directory structure
mkdir -p .a5c/processes
mkdir -p .a5c/templates
mkdir -p src
mkdir -p tests
mkdir -p docs

# Install development dependencies
npm install --save-dev jest eslint prettier
```

Update `package.json`:

```json
{
  "name": "multi-phase-tutorial",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "test": "jest --coverage",
    "lint": "eslint src/",
    "format": "prettier --check src/",
    "security": "npm audit --audit-level=moderate"
  }
}
```

---

## Step 3: Define the Task Definitions

Create comprehensive task definitions for each phase:

```bash
touch .a5c/processes/tasks.js
```

```javascript
// .a5c/processes/tasks.js
// Task definitions for multi-phase feature development

// ============================================
// RESEARCH PHASE TASKS
// ============================================

/**
 * Research Task: Codebase Analysis
 * Uses an agent to analyze the existing codebase
 */
export const codebaseAnalysisTask = {
  type: 'agent',
  name: 'codebase-analysis',
  description: 'Analyze existing codebase patterns and structures',
  prompt: `
    Analyze the codebase for the following feature request:
    {{featureDescription}}

    Examine:
    1. Existing code patterns and architecture
    2. Similar implementations that can be referenced
    3. Dependencies and their versions
    4. Potential integration points
    5. Code conventions and style guides

    Provide a structured analysis report with:
    - existingPatterns: Array of identified patterns
    - relevantFiles: Array of files to reference
    - dependencies: Object of relevant dependencies
    - constraints: Array of technical constraints
    - recommendations: Array of implementation recommendations
  `,
  timeout: 120000,
};

/**
 * Research Task: Requirements Analysis
 * Extracts and clarifies requirements
 */
export const requirementsAnalysisTask = {
  type: 'agent',
  name: 'requirements-analysis',
  description: 'Analyze and clarify feature requirements',
  prompt: `
    Analyze the following feature request and extract clear requirements:
    {{featureDescription}}

    For each requirement, provide:
    - id: Unique identifier (REQ-001, REQ-002, etc.)
    - description: Clear description
    - type: functional | non-functional | constraint
    - priority: must-have | should-have | nice-to-have
    - acceptanceCriteria: Array of testable criteria

    Return a JSON object with:
    - requirements: Array of requirement objects
    - assumptions: Array of assumptions made
    - clarifications: Array of questions for stakeholders
  `,
  timeout: 60000,
};

// ============================================
// PLANNING PHASE TASKS
// ============================================

/**
 * Planning Task: Technical Specification
 * Generates detailed technical specifications
 */
export const technicalSpecTask = {
  type: 'agent',
  name: 'technical-specification',
  description: 'Generate technical specifications from requirements',
  prompt: `
    Based on the research and requirements:

    Research: {{researchReport}}
    Requirements: {{requirements}}

    Generate a technical specification including:
    1. Architecture Overview
       - Components and their responsibilities
       - Data flow diagrams (text representation)
       - API contracts

    2. Implementation Details
       - File structure changes
       - New modules/classes to create
       - Modifications to existing code

    3. Data Models
       - New entities or modifications
       - Validation rules
       - Relationships

    4. API Design (if applicable)
       - Endpoints
       - Request/Response formats
       - Error handling

    5. Testing Strategy
       - Unit tests needed
       - Integration tests needed
       - Edge cases to cover

    Return as structured JSON.
  `,
  timeout: 180000,
};

/**
 * Planning Task: Implementation Plan
 * Creates step-by-step implementation plan
 */
export const implementationPlanTask = {
  type: 'agent',
  name: 'implementation-plan',
  description: 'Create detailed implementation plan',
  prompt: `
    Based on the technical specification:
    {{technicalSpec}}

    Create a detailed implementation plan with:

    1. Implementation Steps (ordered)
       For each step:
       - stepNumber: Number
       - description: What to implement
       - files: Files to create/modify
       - dependencies: Previous steps required
       - estimatedComplexity: low | medium | high
       - testCriteria: How to verify completion

    2. Risk Assessment
       - technicalRisks: Array of potential technical issues
       - mitigations: Mitigation strategies

    3. Milestones
       - Key checkpoints for progress tracking

    Return as structured JSON.
  `,
  timeout: 120000,
};

// ============================================
// IMPLEMENTATION PHASE TASKS
// ============================================

/**
 * Implementation Task: Write Tests
 * Writes tests based on specifications
 */
export const writeTestsTask = {
  type: 'agent',
  name: 'write-tests',
  description: 'Write test cases before implementation',
  prompt: `
    Based on the implementation plan and current iteration context:

    Plan: {{implementationPlan}}
    Iteration: {{iteration}}
    Previous Issues: {{previousIssues}}

    Write comprehensive test cases that:
    1. Cover all acceptance criteria
    2. Include edge cases
    3. Test error handling
    4. Are structured for the project's test framework (Jest)

    For iteration {{iteration}}, focus on:
    {{iterationFocus}}

    Return the test code with clear descriptions.
  `,
  timeout: 180000,
};

/**
 * Implementation Task: Implement Code
 * Implements code to pass the tests
 */
export const implementCodeTask = {
  type: 'agent',
  name: 'implement-code',
  description: 'Implement code to pass tests',
  prompt: `
    Based on the tests and implementation plan:

    Tests: {{tests}}
    Plan: {{implementationPlan}}
    Iteration: {{iteration}}
    Previous Issues: {{previousIssues}}

    Implement code that:
    1. Passes all tests
    2. Follows project conventions
    3. Is well-documented
    4. Handles errors appropriately

    For iteration {{iteration}}, address these specific issues:
    {{issuesToAddress}}

    Return the implementation code with inline comments.
  `,
  timeout: 300000,
};

// ============================================
// QUALITY CHECK TASKS
// ============================================

/**
 * Quality Task: Run Tests
 * Executes test suite and captures results
 */
export const runTestsTask = {
  type: 'shell',
  name: 'run-tests',
  description: 'Run test suite with coverage',
  command: 'npm test -- --coverage --json --outputFile=coverage/test-results.json',
  timeout: 300000,
  retries: 0,
};

/**
 * Quality Task: Lint Check
 * Runs linting on the codebase
 */
export const lintCheckTask = {
  type: 'shell',
  name: 'lint-check',
  description: 'Run ESLint on source code',
  command: 'npm run lint -- --format json --output-file lint-results.json || true',
  timeout: 60000,
  retries: 0,
};

/**
 * Quality Task: Security Scan
 * Runs security vulnerability scan
 */
export const securityScanTask = {
  type: 'shell',
  name: 'security-scan',
  description: 'Run security vulnerability scan',
  command: 'npm run security -- --json > security-results.json 2>&1 || true',
  timeout: 120000,
  retries: 0,
};

/**
 * Quality Task: Documentation Check
 * Verifies documentation completeness
 */
export const documentationCheckTask = {
  type: 'agent',
  name: 'documentation-check',
  description: 'Verify documentation completeness',
  prompt: `
    Analyze the following code for documentation completeness:

    {{code}}

    Check for:
    1. Function/method documentation (JSDoc or similar)
    2. Module-level documentation
    3. README updates if needed
    4. API documentation if applicable
    5. Inline comments for complex logic

    Return:
    - score: 0-100 documentation score
    - missingDocs: Array of items needing documentation
    - suggestions: Array of improvement suggestions
  `,
  timeout: 60000,
};

// ============================================
// AGENT SCORING TASK
// ============================================

/**
 * Agent Scoring Task
 * Evaluates overall quality and provides detailed feedback
 */
export const agentScoringTask = {
  type: 'agent',
  name: 'quality-scoring',
  description: 'AI-powered quality assessment with detailed feedback',
  prompt: `
    Evaluate the quality of this implementation based on:

    Test Results: {{testResults}}
    Coverage: {{coverage}}
    Lint Results: {{lintResults}}
    Security Scan: {{securityResults}}
    Documentation Score: {{documentationScore}}

    Requirements: {{requirements}}
    Acceptance Criteria: {{acceptanceCriteria}}

    Score each dimension (0-100):
    1. Correctness (30% weight): Do tests pass? Are requirements met?
    2. Coverage (20% weight): Is code coverage adequate?
    3. Code Quality (20% weight): Lint errors, complexity, style?
    4. Security (15% weight): Any vulnerabilities?
    5. Documentation (15% weight): Is code well-documented?

    Calculate weighted overall score.

    If score < target, provide:
    - issues: Array of specific issues to fix
    - recommendations: Array of improvement recommendations
    - prioritizedFixes: Array of fixes ordered by impact

    Return JSON:
    {
      "scores": {
        "correctness": number,
        "coverage": number,
        "codeQuality": number,
        "security": number,
        "documentation": number
      },
      "overallScore": number,
      "issues": string[],
      "recommendations": string[],
      "prioritizedFixes": string[],
      "readyForNextPhase": boolean
    }
  `,
  timeout: 120000,
};

// ============================================
// VERIFICATION PHASE TASKS
// ============================================

/**
 * Verification Task: Integration Tests
 * Runs integration test suite
 */
export const integrationTestsTask = {
  type: 'shell',
  name: 'integration-tests',
  description: 'Run integration tests',
  command: 'npm run test:integration || echo "No integration tests configured"',
  timeout: 600000,
  retries: 1,
};

/**
 * Verification Task: Performance Benchmark
 * Runs performance benchmarks
 */
export const performanceBenchmarkTask = {
  type: 'shell',
  name: 'performance-benchmark',
  description: 'Run performance benchmarks',
  command: 'npm run benchmark || echo "No benchmarks configured"',
  timeout: 300000,
  retries: 0,
};

// ============================================
// DEPLOYMENT PHASE TASKS
// ============================================

/**
 * Deployment Task: Create Pull Request
 * Creates a pull request with changes
 */
export const createPullRequestTask = {
  type: 'shell',
  name: 'create-pull-request',
  description: 'Create pull request for changes',
  command: `
    git checkout -b feature/{{branchName}} &&
    git add -A &&
    git commit -m "{{commitMessage}}" &&
    git push -u origin feature/{{branchName}} &&
    gh pr create --title "{{prTitle}}" --body "{{prBody}}"
  `,
  timeout: 120000,
  retries: 0,
};

/**
 * Deployment Task: Deploy to Environment
 * Deploys to specified environment
 */
export const deployTask = {
  type: 'shell',
  name: 'deploy',
  description: 'Deploy to target environment',
  command: 'echo "Deploying to {{environment}}..." && sleep 2 && echo "Deployment complete"',
  timeout: 300000,
  retries: 1,
};
```

**Checkpoint 2:** All task definitions are in place.

---

## Step 4: Create the Multi-Phase Process Definition

Now let's create the main process that orchestrates all phases:

```bash
touch .a5c/processes/multi-phase-feature.js
```

```javascript
// .a5c/processes/multi-phase-feature.js
// Multi-Phase Feature Development Process with Quality Convergence

import {
  // Research tasks
  codebaseAnalysisTask,
  requirementsAnalysisTask,
  // Planning tasks
  technicalSpecTask,
  implementationPlanTask,
  // Implementation tasks
  writeTestsTask,
  implementCodeTask,
  // Quality tasks
  runTestsTask,
  lintCheckTask,
  securityScanTask,
  documentationCheckTask,
  agentScoringTask,
  // Verification tasks
  integrationTestsTask,
  performanceBenchmarkTask,
  // Deployment tasks
  createPullRequestTask,
  deployTask,
} from './tasks.js';

/**
 * Multi-Phase Feature Development Process
 *
 * Implements a complete feature development lifecycle with:
 * - Research and planning phases
 * - TDD implementation with quality convergence
 * - Verification and deployment phases
 * - Team collaboration breakpoints
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.featureDescription - Description of the feature to build
 * @param {number} inputs.qualityTarget - Target quality score (default: 85)
 * @param {number} inputs.maxIterations - Maximum implementation iterations (default: 5)
 * @param {string} inputs.targetEnvironment - Deployment target (default: 'staging')
 * @param {boolean} inputs.requireTeamApproval - Require team approval at breakpoints
 * @param {Object} ctx - Babysitter context object
 */
export async function process(inputs, ctx) {
  const {
    featureDescription,
    qualityTarget = 85,
    maxIterations = 5,
    targetEnvironment = 'staging',
    requireTeamApproval = true,
  } = inputs;

  ctx.log('============================================');
  ctx.log('MULTI-PHASE FEATURE DEVELOPMENT');
  ctx.log('============================================');
  ctx.log(`Feature: ${featureDescription}`);
  ctx.log(`Quality Target: ${qualityTarget}/100`);
  ctx.log(`Max Iterations: ${maxIterations}`);
  ctx.log(`Target Environment: ${targetEnvironment}`);
  ctx.log('============================================');

  // ============================================
  // PHASE 1: RESEARCH
  // ============================================
  ctx.log('');
  ctx.log('PHASE 1: RESEARCH');
  ctx.log('------------------');

  ctx.log('Analyzing codebase patterns...');
  const codebaseAnalysis = await ctx.task(codebaseAnalysisTask, {
    featureDescription,
  });

  ctx.log('Analyzing requirements...');
  const requirementsAnalysis = await ctx.task(requirementsAnalysisTask, {
    featureDescription,
  });

  // Store research results
  const researchReport = {
    codebaseAnalysis,
    requirements: requirementsAnalysis,
    timestamp: new Date().toISOString(),
  };
  ctx.setState('researchReport', researchReport);

  ctx.log('Research phase complete');
  ctx.log(`  - Identified ${codebaseAnalysis.existingPatterns?.length || 0} existing patterns`);
  ctx.log(`  - Extracted ${requirementsAnalysis.requirements?.length || 0} requirements`);

  // Team Review Breakpoint: Research Results
  if (requireTeamApproval) {
    await ctx.breakpoint({
      question: 'Review research findings and requirements before proceeding to planning?',
      title: 'PHASE 1 COMPLETE: Research Review',
      context: {
        phase: 'research',
        researchReport,
        nextPhase: 'planning',
        reviewItems: [
          'Codebase analysis accuracy',
          'Requirements completeness',
          'Identified constraints',
          'Any clarifications needed',
        ],
      },
      approvers: ['tech-lead', 'product-owner'],
      timeout: 86400000, // 24 hours
    });
    ctx.log('Research review approved');
  }

  // ============================================
  // PHASE 2: PLANNING
  // ============================================
  ctx.log('');
  ctx.log('PHASE 2: PLANNING');
  ctx.log('------------------');

  ctx.log('Generating technical specification...');
  const technicalSpec = await ctx.task(technicalSpecTask, {
    researchReport: JSON.stringify(researchReport),
    requirements: JSON.stringify(requirementsAnalysis.requirements),
  });

  ctx.log('Creating implementation plan...');
  const implementationPlan = await ctx.task(implementationPlanTask, {
    technicalSpec: JSON.stringify(technicalSpec),
  });

  // Store planning results
  const planningResults = {
    technicalSpec,
    implementationPlan,
    timestamp: new Date().toISOString(),
  };
  ctx.setState('planningResults', planningResults);

  ctx.log('Planning phase complete');
  ctx.log(`  - ${implementationPlan.steps?.length || 0} implementation steps defined`);
  ctx.log(`  - ${implementationPlan.milestones?.length || 0} milestones identified`);

  // Team Review Breakpoint: Plan Approval
  if (requireTeamApproval) {
    await ctx.breakpoint({
      question: 'Review and approve the technical specification and implementation plan?',
      title: 'PHASE 2 COMPLETE: Plan Approval',
      context: {
        phase: 'planning',
        technicalSpec,
        implementationPlan,
        nextPhase: 'implementation',
        criticalDecisions: [
          'Architecture approach',
          'API design',
          'Testing strategy',
          'Risk mitigations',
        ],
      },
      approvers: ['tech-lead', 'architect'],
      severity: 'high',
      timeout: 86400000, // 24 hours
    });
    ctx.log('Plan approved');
  }

  // ============================================
  // PHASE 3: IMPLEMENTATION (Quality Convergence Loop)
  // ============================================
  ctx.log('');
  ctx.log('PHASE 3: IMPLEMENTATION');
  ctx.log('------------------------');
  ctx.log(`Starting TDD implementation with quality convergence...`);
  ctx.log(`Target: ${qualityTarget}/100 | Max iterations: ${maxIterations}`);

  let iteration = 0;
  let currentScore = 0;
  let previousIssues = [];
  let implementationComplete = false;

  while (iteration < maxIterations && !implementationComplete) {
    iteration++;
    ctx.log('');
    ctx.log(`--- ITERATION ${iteration}/${maxIterations} ---`);

    // Determine iteration focus based on previous issues
    const iterationFocus = iteration === 1
      ? 'Initial implementation of core functionality'
      : `Addressing issues: ${previousIssues.slice(0, 3).join(', ')}`;

    ctx.log(`Focus: ${iterationFocus}`);

    // Step 3.1: Write Tests (TDD)
    ctx.log('Writing tests...');
    const tests = await ctx.task(writeTestsTask, {
      implementationPlan: JSON.stringify(implementationPlan),
      iteration,
      previousIssues: JSON.stringify(previousIssues),
      iterationFocus,
    });

    // Step 3.2: Implement Code
    ctx.log('Implementing code...');
    const implementation = await ctx.task(implementCodeTask, {
      tests: JSON.stringify(tests),
      implementationPlan: JSON.stringify(implementationPlan),
      iteration,
      previousIssues: JSON.stringify(previousIssues),
      issuesToAddress: previousIssues.slice(0, 5).join('\n'),
    });

    // Step 3.3: Run Quality Checks in Parallel
    ctx.log('Running quality checks in parallel...');

    const [testResults, lintResults, securityResults, docResults] = await ctx.parallel.all([
      () => ctx.task(runTestsTask, {}),
      () => ctx.task(lintCheckTask, {}),
      () => ctx.task(securityScanTask, {}),
      () => ctx.task(documentationCheckTask, { code: JSON.stringify(implementation) }),
    ]);

    ctx.log('Quality checks complete:');
    ctx.log(`  - Tests: ${testResults.exitCode === 0 ? 'PASS' : 'FAIL'}`);
    ctx.log(`  - Lint: ${lintResults.exitCode === 0 ? 'PASS' : 'WARNINGS'}`);
    ctx.log(`  - Security: ${securityResults.exitCode === 0 ? 'PASS' : 'REVIEW'}`);
    ctx.log(`  - Documentation: ${docResults.score || 'N/A'}/100`);

    // Step 3.4: Agent Quality Scoring
    ctx.log('Performing agent quality assessment...');

    const qualityAssessment = await ctx.task(agentScoringTask, {
      testResults: JSON.stringify(testResults),
      coverage: testResults.coverage || '0%',
      lintResults: JSON.stringify(lintResults),
      securityResults: JSON.stringify(securityResults),
      documentationScore: docResults.score || 0,
      requirements: JSON.stringify(requirementsAnalysis.requirements),
      acceptanceCriteria: JSON.stringify(
        requirementsAnalysis.requirements?.flatMap(r => r.acceptanceCriteria) || []
      ),
    });

    currentScore = qualityAssessment.overallScore || 0;
    previousIssues = qualityAssessment.issues || [];

    ctx.log('');
    ctx.log(`QUALITY ASSESSMENT - Iteration ${iteration}:`);
    ctx.log(`  Overall Score: ${currentScore}/100 (target: ${qualityTarget})`);
    ctx.log(`  Scores by dimension:`);
    ctx.log(`    - Correctness: ${qualityAssessment.scores?.correctness || 0}/100`);
    ctx.log(`    - Coverage: ${qualityAssessment.scores?.coverage || 0}/100`);
    ctx.log(`    - Code Quality: ${qualityAssessment.scores?.codeQuality || 0}/100`);
    ctx.log(`    - Security: ${qualityAssessment.scores?.security || 0}/100`);
    ctx.log(`    - Documentation: ${qualityAssessment.scores?.documentation || 0}/100`);

    if (previousIssues.length > 0) {
      ctx.log(`  Issues to address (${previousIssues.length}):`);
      previousIssues.slice(0, 5).forEach((issue, i) => {
        ctx.log(`    ${i + 1}. ${issue}`);
      });
    }

    // Check if quality target is met
    if (currentScore >= qualityTarget) {
      ctx.log('');
      ctx.log(`QUALITY TARGET MET! Score: ${currentScore}/${qualityTarget}`);
      implementationComplete = true;
    } else if (iteration < maxIterations) {
      ctx.log('');
      ctx.log(`Score ${currentScore} < target ${qualityTarget}. Continuing to iteration ${iteration + 1}...`);
    } else {
      ctx.log('');
      ctx.log(`Max iterations reached. Final score: ${currentScore}`);
    }

    // Store iteration results
    ctx.setState(`iteration_${iteration}`, {
      score: currentScore,
      issues: previousIssues,
      assessment: qualityAssessment,
    });
  }

  // Implementation Summary
  const implementationSummary = {
    finalScore: currentScore,
    iterationsUsed: iteration,
    targetMet: currentScore >= qualityTarget,
    remainingIssues: previousIssues,
  };
  ctx.setState('implementationSummary', implementationSummary);

  ctx.log('');
  ctx.log('Implementation phase complete');
  ctx.log(`  - Final Score: ${currentScore}/100`);
  ctx.log(`  - Iterations Used: ${iteration}/${maxIterations}`);
  ctx.log(`  - Target Met: ${currentScore >= qualityTarget ? 'YES' : 'NO'}`);

  // Handle case where quality target not met
  if (!implementationComplete) {
    await ctx.breakpoint({
      question: `Quality target not met (${currentScore}/${qualityTarget}). Continue to verification phase anyway?`,
      title: 'QUALITY TARGET NOT MET',
      context: {
        finalScore: currentScore,
        qualityTarget,
        iterationsUsed: iteration,
        remainingIssues: previousIssues,
        recommendation: 'Consider increasing max iterations or lowering quality target',
      },
      severity: 'warning',
    });
    ctx.log('Proceeding to verification despite quality target not being met');
  }

  // ============================================
  // PHASE 4: VERIFICATION
  // ============================================
  ctx.log('');
  ctx.log('PHASE 4: VERIFICATION');
  ctx.log('----------------------');

  ctx.log('Running comprehensive verification...');

  // Run verification tasks in parallel
  const [integrationResults, performanceResults] = await ctx.parallel.all([
    () => ctx.task(integrationTestsTask, {}),
    () => ctx.task(performanceBenchmarkTask, {}),
  ]);

  const verificationResults = {
    integrationTests: integrationResults.exitCode === 0 ? 'PASS' : 'FAIL',
    performanceBenchmarks: performanceResults.exitCode === 0 ? 'PASS' : 'REVIEW',
    qualityScore: currentScore,
    timestamp: new Date().toISOString(),
  };
  ctx.setState('verificationResults', verificationResults);

  ctx.log('Verification phase complete');
  ctx.log(`  - Integration Tests: ${verificationResults.integrationTests}`);
  ctx.log(`  - Performance: ${verificationResults.performanceBenchmarks}`);

  // Team Review Breakpoint: Final Approval
  if (requireTeamApproval) {
    await ctx.breakpoint({
      question: `Approve feature for deployment to ${targetEnvironment}?`,
      title: 'PHASE 4 COMPLETE: Final Approval',
      context: {
        phase: 'verification',
        featureDescription,
        qualityScore: currentScore,
        verificationResults,
        implementationSummary,
        targetEnvironment,
        criticalChecks: [
          'All tests passing',
          'Quality score acceptable',
          'No critical security issues',
          'Documentation complete',
        ],
      },
      approvers: ['tech-lead', 'qa-lead'],
      severity: 'critical',
      timeout: 86400000, // 24 hours
    });
    ctx.log('Final approval received');
  }

  // ============================================
  // PHASE 5: DEPLOYMENT
  // ============================================
  ctx.log('');
  ctx.log('PHASE 5: DEPLOYMENT');
  ctx.log('--------------------');

  // Generate branch name and commit message
  const branchName = `feature-${Date.now()}`;
  const commitMessage = `feat: ${featureDescription.slice(0, 50)}`;
  const prTitle = `Feature: ${featureDescription.slice(0, 100)}`;
  const prBody = `
## Summary
${featureDescription}

## Quality Metrics
- Quality Score: ${currentScore}/100
- Iterations: ${iteration}/${maxIterations}
- Tests: PASS
- Security: REVIEWED

## Verification
- Integration Tests: ${verificationResults.integrationTests}
- Performance: ${verificationResults.performanceBenchmarks}

---
Generated by Babysitter Multi-Phase Feature Development Process
`;

  ctx.log('Creating pull request...');
  const prResult = await ctx.task(createPullRequestTask, {
    branchName,
    commitMessage,
    prTitle,
    prBody,
  });

  if (prResult.exitCode === 0) {
    ctx.log('Pull request created successfully');
  } else {
    ctx.log('Pull request creation failed (may require manual intervention)');
  }

  ctx.log(`Deploying to ${targetEnvironment}...`);
  const deployResult = await ctx.task(deployTask, {
    environment: targetEnvironment,
  });

  ctx.log('Deployment phase complete');

  // ============================================
  // COMPLETE: Return Final Summary
  // ============================================
  ctx.log('');
  ctx.log('============================================');
  ctx.log('FEATURE DEVELOPMENT COMPLETE');
  ctx.log('============================================');

  const finalSummary = {
    success: true,
    feature: featureDescription,
    phases: {
      research: 'COMPLETE',
      planning: 'COMPLETE',
      implementation: {
        status: 'COMPLETE',
        finalScore: currentScore,
        iterations: iteration,
        targetMet: currentScore >= qualityTarget,
      },
      verification: 'COMPLETE',
      deployment: deployResult.exitCode === 0 ? 'COMPLETE' : 'PARTIAL',
    },
    metrics: {
      qualityScore: currentScore,
      qualityTarget,
      iterationsUsed: iteration,
      maxIterations,
    },
    artifacts: {
      researchReport: true,
      technicalSpec: true,
      implementationPlan: true,
      tests: true,
      implementation: true,
      pullRequest: prResult.exitCode === 0,
    },
    completedAt: new Date().toISOString(),
  };

  return finalSummary;
}
```

**Checkpoint 3:** The complete multi-phase process definition is ready.

---

## Step 5: Register the Process

Create the process manifest:

```bash
touch .a5c/processes/manifest.json
```

```json
{
  "processes": [
    {
      "name": "multi-phase-feature",
      "description": "Complete feature development lifecycle with research, planning, TDD implementation, verification, and deployment",
      "file": "./multi-phase-feature.js",
      "inputs": {
        "featureDescription": {
          "type": "string",
          "required": true,
          "description": "Description of the feature to build"
        },
        "qualityTarget": {
          "type": "number",
          "default": 85,
          "description": "Target quality score (0-100)"
        },
        "maxIterations": {
          "type": "number",
          "default": 5,
          "description": "Maximum implementation iterations"
        },
        "targetEnvironment": {
          "type": "string",
          "default": "staging",
          "enum": ["development", "staging", "production"],
          "description": "Target deployment environment"
        },
        "requireTeamApproval": {
          "type": "boolean",
          "default": true,
          "description": "Require team approval at phase transitions"
        }
      }
    }
  ]
}
```

---

## Step 6: Run the Multi-Phase Process

Start Claude Code and run the process:

```bash
claude
```

```
/babysit run multi-phase-feature with featureDescription="Add user authentication with JWT tokens, including login, logout, and token refresh endpoints" qualityTarget=85 maxIterations=5 targetEnvironment=staging
```

Or in natural language:

```
Use the babysitter skill to run the multi-phase-feature process.
Build user authentication with JWT tokens - login, logout, and token refresh.
Target 85% quality with max 5 iterations, deploy to staging.
```

**What you should see:**

```
============================================
MULTI-PHASE FEATURE DEVELOPMENT
============================================
Feature: Add user authentication with JWT tokens...
Quality Target: 85/100
Max Iterations: 5
Target Environment: staging
============================================

PHASE 1: RESEARCH
------------------
Analyzing codebase patterns...
Analyzing requirements...
Research phase complete
  - Identified 3 existing patterns
  - Extracted 8 requirements

Waiting for breakpoint approval...
Breakpoint: PHASE 1 COMPLETE: Research Review
Visit http://localhost:3184 to approve or reject.
```

---

## Step 7: Navigate the Breakpoints

As you progress through the process, you will encounter several breakpoints:

### Breakpoint 1: Research Review

**What to review:**
- Are the identified patterns relevant?
- Are all requirements captured?
- Any clarifications needed?

### Breakpoint 2: Plan Approval

**What to review:**
- Is the architecture approach sound?
- Are all edge cases considered?
- Is the testing strategy comprehensive?

### Breakpoint 3: Quality Target Warning (if applicable)

**What to decide:**
- Accept lower quality score?
- Request more iterations?
- Stop and investigate issues?

### Breakpoint 4: Final Approval

**What to verify:**
- All critical checks passed?
- Ready for target environment?
- Stakeholder sign-off obtained?

**Checkpoint 4:** You understand how to navigate team collaboration breakpoints.

---

## Step 8: Monitor Quality Convergence

Watch the implementation phase carefully. You will see the quality score improve across iterations:

```
--- ITERATION 1/5 ---
Focus: Initial implementation of core functionality
Writing tests...
Implementing code...
Running quality checks in parallel...

QUALITY ASSESSMENT - Iteration 1:
  Overall Score: 62/100 (target: 85)
  Scores by dimension:
    - Correctness: 75/100
    - Coverage: 45/100
    - Code Quality: 70/100
    - Security: 60/100
    - Documentation: 40/100
  Issues to address (5):
    1. Test coverage below 80%
    2. Missing error handling for invalid tokens
    3. No rate limiting on auth endpoints
    4. JSDoc comments missing on public functions
    5. Password requirements not validated

Score 62 < target 85. Continuing to iteration 2...

--- ITERATION 2/5 ---
Focus: Addressing issues: Test coverage below 80%, Missing error handling...
...

QUALITY ASSESSMENT - Iteration 2:
  Overall Score: 78/100 (target: 85)
  Issues to address (3):
    1. Rate limiting still missing
    2. Token refresh edge case not tested
    3. README needs updating

Score 78 < target 85. Continuing to iteration 3...

--- ITERATION 3/5 ---
...

QUALITY ASSESSMENT - Iteration 3:
  Overall Score: 89/100 (target: 85)

QUALITY TARGET MET! Score: 89/85
```

---

## Step 9: Review the Audit Trail

After the process completes, examine the comprehensive audit trail:

```bash
# View the journal
cat .a5c/runs/<runId>/journal/journal.jsonl | jq -s '.'
```

**Key events to look for:**

```json
[
  {"type": "RUN_STARTED", "inputs": {...}},
  {"type": "TASK_COMPLETED", "taskId": "codebase-analysis-001"},
  {"type": "TASK_COMPLETED", "taskId": "requirements-analysis-001"},
  {"type": "BREAKPOINT_REQUESTED", "title": "Research Review"},
  {"type": "BREAKPOINT_APPROVED", "approver": "tech-lead"},
  {"type": "TASK_COMPLETED", "taskId": "technical-spec-001"},
  {"type": "TASK_COMPLETED", "taskId": "implementation-plan-001"},
  {"type": "BREAKPOINT_APPROVED", "title": "Plan Approval"},
  {"type": "ITERATION_STARTED", "iteration": 1},
  {"type": "QUALITY_SCORE", "iteration": 1, "score": 62},
  {"type": "ITERATION_STARTED", "iteration": 2},
  {"type": "QUALITY_SCORE", "iteration": 2, "score": 78},
  {"type": "ITERATION_STARTED", "iteration": 3},
  {"type": "QUALITY_SCORE", "iteration": 3, "score": 89},
  {"type": "BREAKPOINT_APPROVED", "title": "Final Approval"},
  {"type": "TASK_COMPLETED", "taskId": "deploy-001"},
  {"type": "RUN_COMPLETED", "status": "success"}
]
```

This journal provides:
- **Complete traceability** of all decisions
- **Quality progression** across iterations
- **Approval records** for compliance
- **Timing information** for performance analysis

---

## Step 10: Customize for Your Team

Here are patterns to customize the process for your team's needs:

### Adding Custom Quality Dimensions

```javascript
// Add a custom security scoring component
const customSecurityTask = {
  type: 'agent',
  name: 'custom-security-score',
  prompt: `
    Evaluate security based on our company's security checklist:
    {{companySecurityChecklist}}

    Score each item and provide overall security score.
  `,
};
```

### Configuring Approver Roles

```javascript
await ctx.breakpoint({
  title: 'Production Deployment',
  approvers: ['tech-lead', 'security-officer', 'product-owner'],
  requiredApprovals: 2, // Need at least 2 approvals
  timeout: 172800000, // 48 hours
});
```

### Adding Slack/Teams Notifications

```javascript
// Add a notification task
const notifyTeamTask = {
  type: 'shell',
  command: `curl -X POST $SLACK_WEBHOOK -d '{"text": "Feature ready for review: {{featureName}}"}'`,
};

// Use in process
await ctx.task(notifyTeamTask, { featureName: featureDescription });
```

---

## Summary

Congratulations! You have completed the advanced tutorial on multi-phase feature development. Let's review what you accomplished:

### What You Built

- A **complete feature development workflow** with 5 phases
- **Quality convergence loop** with agent-based scoring
- **Team collaboration** with strategic breakpoints
- **Parallel quality checks** for fast feedback
- **Comprehensive audit trail** for compliance

### Key Concepts Mastered

| Concept | What You Learned |
|---------|------------------|
| **Multi-Phase Workflows** | Orchestrating complex development lifecycles |
| **Quality Convergence** | Iterating until quality targets are met |
| **Agent Scoring** | Using LLMs to evaluate code quality |
| **Parallel Quality Checks** | Running independent checks simultaneously |
| **Team Breakpoints** | Strategic approval gates for collaboration |
| **Audit Trails** | Tracking all decisions for compliance |

### Quality Convergence Best Practices

1. **Set realistic targets** - Start with 80%, increase as team matures
2. **Limit iterations** - 5-10 iterations prevents infinite loops
3. **Prioritize fixes** - Agent should suggest highest-impact fixes first
4. **Track trends** - Monitor score progression across iterations
5. **Allow overrides** - Breakpoints let humans override when needed

### Team Collaboration Best Practices

1. **Strategic breakpoints** - At irreversible decisions (deployments, API changes)
2. **Clear context** - Provide all information needed to make decisions
3. **Role-based approvals** - Different roles for different decisions
4. **Timeout policies** - Don't let workflows block indefinitely
5. **Escalation paths** - Define what happens if approval times out

---

## Next Steps

You have completed the advanced tutorials. Here are paths to continue your expertise:

### Apply Your Knowledge
- **Implement in your team** - Customize for your team's workflow
- **Create team templates** - Share processes across projects
- **Build governance policies** - Define approval requirements

### Go Deeper
- **[Process Engine Architecture](../features/process-definitions.md)** - Understand internals
- **[Configuration Reference](../reference/configuration.md)** - Meet regulatory requirements
- **[FAQ](../reference/faq.md)** - Common questions and answers

### Contribute
- **Share your processes** - Contribute to the community
- **Report issues** - Help improve Babysitter
- **Write tutorials** - Help others learn

---

## Troubleshooting

### Issue: "Quality score not improving between iterations"

**Symptom:** Score stays the same or decreases.

**Solution:**
1. Check if agent feedback is being incorporated
2. Verify `previousIssues` is being passed correctly
3. Review agent scoring prompt for clarity
4. Consider adjusting scoring weights

### Issue: "Process stuck at breakpoint"

**Symptom:** Workflow waiting indefinitely.

**Solution (Interactive Mode - Claude Code):**
1. Look for Claude's question in the chat - scroll up if needed
2. If the session disconnected, resume with `/babysit resume`
3. Ensure you respond to the question to continue

**Solution (Non-Interactive Mode):**
1. Check breakpoints service is running
2. Verify approvers have access to breakpoints UI at http://localhost:3184
3. Consider adding timeout configuration
4. Check network/firewall settings

### Issue: "Parallel tasks failing intermittently"

**Symptom:** Random failures in parallel tasks.

**Solution:**
1. Check for shared resource conflicts
2. Add retry logic to flaky tasks
3. Consider running problematic tasks sequentially
4. Review system resource limits

### Issue: "Agent scoring inconsistent"

**Symptom:** Quality scores vary significantly for similar code.

**Solution:**
1. Make scoring prompts more specific
2. Add concrete examples in prompt
3. Use structured output format
4. Consider caching previous assessments for comparison

---

## See Also

- [Event Sourcing Explained](../features/journal-system.md) - Architecture concepts
- [Quality Convergence Explained](../features/quality-convergence.md) - Deep dive
- [FAQ](../reference/faq.md) - Common questions and rollout strategies

---

**Document Status:** Complete
**Last Updated:** 2026-01-25
**Feedback:** Found an issue? [Report it on GitHub](https://github.com/a5c-ai/babysitter/issues)
