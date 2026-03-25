/**
 * @process methodologies/everything-claude-code/ecc-orchestrator
 * @description Everything Claude Code Orchestrator - Full lifecycle from planning through TDD, implementation, multi-dimensional review, security scan, and deployment with continuous learning and context engineering
 * @inputs { request: string, projectRoot?: string, mode?: string, securityEnabled?: boolean, learningEnabled?: boolean, maxRemediationCycles?: number, confidenceThreshold?: number }
 * @outputs { success: boolean, planResult: object, tddResult: object, implementationResult: object, reviewResults: object, securityResults: object, learningExtracted: object, deploymentResult: object, summary: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

const detectContextTask = defineTask('ecc-detect-context', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Detect Project Context and Mode',
  agent: {
    name: 'context-engineering',
    prompt: {
      role: 'ECC Context Engineer',
      task: 'Analyze the project to detect language, frameworks, package manager, test runner, and determine the optimal execution mode (dev/review/research).',
      context: { ...args },
      instructions: [
        'Detect package manager: check for package-lock.json (npm), pnpm-lock.yaml (pnpm), yarn.lock (yarn), bun.lockb (bun)',
        'Detect language: check for tsconfig.json (TypeScript), go.mod (Go), requirements.txt/pyproject.toml (Python), pom.xml (Java), Package.swift (Swift)',
        'Detect test runner: check for vitest.config, jest.config, pytest.ini, go test patterns',
        'Detect CI/CD: check for .github/workflows, Dockerfile, docker-compose.yml',
        'Determine mode from request: dev (build/implement), review (audit/check), research (plan/design)',
        'Return structured context with all detected tools and recommended agent chain'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ecc', 'context', 'detection']
}));

const planTask = defineTask('ecc-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Strategic Planning with Research-First Approach',
  agent: {
    name: 'planner',
    prompt: {
      role: 'ECC Planner',
      task: 'Create a comprehensive implementation plan using research-first development. Search for existing solutions, brainstorm alternatives, define phases with acceptance criteria.',
      context: { ...args },
      instructions: [
        'Research existing solutions and patterns for the requested feature',
        'Brainstorm at least 3 alternative approaches with trade-off analysis',
        'Create a phased plan: setup, test scaffolding, implementation, review, deploy',
        'Define acceptance criteria for each phase',
        'Map dependencies between phases',
        'Include risk assessment with mitigation strategies',
        'Define TDD strategy per coding phase',
        'Estimate effort per phase',
        'Save plan to docs/plans/ for downstream consumption'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ecc', 'planning', 'research-first']
}));

const architectTask = defineTask('ecc-architect', (args, taskCtx) => ({
  kind: 'agent',
  title: 'System Architecture Design',
  agent: {
    name: 'architect',
    prompt: {
      role: 'ECC Architect',
      task: 'Design the system architecture based on the plan. Define component boundaries, interfaces, data flow, and integration points.',
      context: { ...args },
      instructions: [
        'Review the plan and extract architectural requirements',
        'Define component boundaries and responsibilities',
        'Design interfaces between components',
        'Map data flow across the system',
        'Identify integration points and external dependencies',
        'Apply immutability and file organization coding rules',
        'Document architectural decisions and rationale',
        'Ensure the design supports testability at every layer'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ecc', 'architecture', 'design']
}));

const tddWorkflowTask = defineTask('ecc-tdd-workflow', (args, taskCtx) => ({
  kind: 'agent',
  title: 'TDD Workflow - Red/Green/Refactor',
  agent: {
    name: 'tdd-guide',
    prompt: {
      role: 'ECC TDD Guide',
      task: 'Execute the full TDD cycle: write failing tests (RED), implement minimal code to pass (GREEN), refactor for quality (REFACTOR). Enforce 80% coverage minimum.',
      context: { ...args },
      instructions: [
        'RED: Write failing tests that define expected behavior',
        'Verify tests fail with exit code 1',
        'GREEN: Write the minimal implementation to make tests pass',
        'Verify tests pass with exit code 0',
        'REFACTOR: Improve code quality while keeping tests green',
        'Run full test suite after refactoring to confirm no regressions',
        'Measure coverage and ensure >= 80% threshold',
        'Use CI=true or --run flag, never watch mode',
        'Apply timeout guards to prevent hanging tests',
        'Record evidence: exit codes, coverage numbers, test counts'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ecc', 'tdd', 'red-green-refactor']
}));

const codeReviewTask = defineTask('ecc-code-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Multi-Dimensional Code Review',
  agent: {
    name: 'code-reviewer',
    prompt: {
      role: 'ECC Code Reviewer',
      task: 'Perform a multi-dimensional code review covering correctness, security, performance, and maintainability. Apply confidence scoring and require >= 80% confidence for issue reporting.',
      context: { ...args },
      instructions: [
        'Dimension 1 - Correctness: logic errors, edge cases, type safety, error handling',
        'Dimension 2 - Security: injection, auth, data exposure, dependency vulnerabilities',
        'Dimension 3 - Performance: algorithmic complexity, memory leaks, unnecessary allocations',
        'Dimension 4 - Maintainability: naming, documentation, test coverage, coupling',
        'Apply confidence scoring: only report issues with >= 80% confidence',
        'Categorize issues: critical, high, medium, low',
        'Suggest specific fixes for each issue found',
        'Verify compliance with conventional commit and PR conventions',
        'Check for floating promises and unhandled errors'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ecc', 'review', 'quality']
}));

const securityScanTask = defineTask('ecc-security-scan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'AgentShield Security Scan',
  agent: {
    name: 'security-reviewer',
    prompt: {
      role: 'ECC Security Reviewer (AgentShield)',
      task: 'Execute the AgentShield security audit pipeline: secrets detection, permission auditing, hook injection analysis, MCP risk profiling, and agent config review.',
      context: { ...args },
      instructions: [
        'Scan for secrets: API keys, tokens, passwords, private keys (14 pattern categories)',
        'Audit permissions: file system access, network calls, process execution',
        'Analyze hooks: check for injection vulnerabilities in lifecycle hooks',
        'Profile MCP risks: evaluate tool permissions and data exposure',
        'Review agent configs: validate model settings, prompt injection resistance',
        'Apply 102 static analysis rules across all categories',
        'Report findings with severity and remediation steps',
        'Flag any blocking issues that prevent deployment'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ecc', 'security', 'agentshield']
}));

const buildResolverTask = defineTask('ecc-build-resolve', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Resolve Build Errors',
  agent: {
    name: 'build-resolver',
    prompt: {
      role: 'ECC Build Error Resolver',
      task: 'Analyze and resolve build errors, test failures, and CI pipeline issues. Apply systematic debugging to restore green builds.',
      context: { ...args },
      instructions: [
        'Parse build output for error messages and stack traces',
        'Categorize errors: compilation, type, runtime, dependency, configuration',
        'Identify root cause through evidence chain',
        'Apply targeted fix for each error category',
        'Re-run build to verify fix',
        'If fix fails, escalate with detailed analysis',
        'Record evidence: error messages, fix applied, verification result'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ecc', 'build', 'error-resolution']
}));

const e2eTestTask = defineTask('ecc-e2e-test', (args, taskCtx) => ({
  kind: 'agent',
  title: 'End-to-End Testing',
  agent: {
    name: 'e2e-runner',
    prompt: {
      role: 'ECC E2E Runner',
      task: 'Execute end-to-end tests using the Playwright Page Object Model pattern. Verify full user flows and integration points.',
      context: { ...args },
      instructions: [
        'Identify critical user flows from requirements',
        'Create or update E2E tests using Playwright POM pattern',
        'Execute tests in headless mode',
        'Capture screenshots and traces for failures',
        'Verify integration points between services',
        'Report pass/fail with evidence (exit codes, screenshots)',
        'Suggest missing test scenarios for coverage gaps'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ecc', 'e2e', 'playwright']
}));

const refactorCleanTask = defineTask('ecc-refactor-clean', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Code Cleanup and Refactoring',
  agent: {
    name: 'refactor-cleaner',
    prompt: {
      role: 'ECC Refactor Cleaner',
      task: 'Apply code cleanup and refactoring guided by review findings. Ensure all tests still pass after changes.',
      context: { ...args },
      instructions: [
        'Address all high and critical review findings',
        'Apply immutability patterns where applicable',
        'Improve naming and documentation',
        'Reduce coupling and improve cohesion',
        'Remove dead code and unused imports',
        'Ensure consistent file organization',
        'Run full test suite to confirm no regressions',
        'Record all changes made with before/after evidence'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ecc', 'refactor', 'cleanup']
}));

const extractLearningsTask = defineTask('ecc-extract-learnings', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Extract Patterns and Learnings',
  agent: {
    name: 'continuous-learning',
    prompt: {
      role: 'ECC Continuous Learning Engine',
      task: 'Extract patterns, learnings, and reusable skills from this development session. Evaluate confidence and organize for future reuse.',
      context: { ...args },
      instructions: [
        'Analyze the complete session: plan, implementation, review, security findings',
        'Extract reusable patterns with confidence scoring',
        'Identify new conventions and architectural decisions',
        'Convert high-confidence patterns into skill candidates',
        'Update session memory with learnings',
        'Suggest compaction strategies for token optimization',
        'Version and export new skills for future sessions'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ecc', 'learning', 'pattern-extraction']
}));

const deployCheckTask = defineTask('ecc-deploy-check', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Deployment Readiness Check',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ECC Deployment Checker',
      task: 'Verify deployment readiness: all tests pass, no security blockers, conventional commits applied, documentation updated, CI/CD pipeline green.',
      context: { ...args },
      instructions: [
        'Verify all unit and E2E tests pass (exit code 0)',
        'Confirm no critical or high security findings remain',
        'Check conventional commit messages are applied',
        'Verify documentation is updated (README, API docs, changelog)',
        'Validate CI/CD pipeline configuration',
        'Check Docker build succeeds if applicable',
        'Generate deployment summary with go/no-go recommendation'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['ecc', 'deployment', 'readiness']
}));

// ============================================================================
// PROCESS FUNCTION
// ============================================================================

/**
 * Everything Claude Code Orchestrator
 *
 * Full lifecycle: context detection -> planning -> architecture -> TDD ->
 * parallel review + security -> remediation -> E2E -> deployment -> learning
 *
 * Integrates 13 specialized subagents, 56+ skills, and continuous learning
 * pipeline adapted from the Everything Claude Code methodology.
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.request - The development request to fulfill
 * @param {string} inputs.projectRoot - Project root directory (default: '.')
 * @param {string} inputs.mode - Execution mode: dev, review, research (auto-detected if omitted)
 * @param {boolean} inputs.securityEnabled - Enable AgentShield security scanning (default: true)
 * @param {boolean} inputs.learningEnabled - Enable continuous learning extraction (default: true)
 * @param {number} inputs.maxRemediationCycles - Max remediation attempts (default: 2)
 * @param {number} inputs.confidenceThreshold - Minimum confidence for issue reporting (default: 80)
 * @param {Object} ctx - Process context
 */
export async function process(inputs, ctx) {
  const {
    request,
    projectRoot = '.',
    mode,
    securityEnabled = true,
    learningEnabled = true,
    maxRemediationCycles = 2,
    confidenceThreshold = 80
  } = inputs;

  ctx.log('info', `ECC Orchestrator starting for request: ${request}`);

  // ── Phase 1: Context Detection ──────────────────────────────────────
  ctx.log('info', 'Phase 1: Detecting project context and execution mode');
  const contextResult = await ctx.task(detectContextTask, {
    request,
    projectRoot,
    requestedMode: mode
  });

  const detectedMode = contextResult.mode || mode || 'dev';
  ctx.log('info', `Detected mode: ${detectedMode}, language: ${contextResult.language || 'unknown'}`);

  // ── Phase 2: Strategic Planning ─────────────────────────────────────
  ctx.log('info', 'Phase 2: Research-first strategic planning');
  const planResult = await ctx.task(planTask, {
    request,
    projectRoot,
    projectContext: contextResult,
    mode: detectedMode
  });

  // ── Phase 3: Architecture Design ────────────────────────────────────
  ctx.log('info', 'Phase 3: System architecture design');
  const architectureResult = await ctx.task(architectTask, {
    request,
    projectRoot,
    plan: planResult,
    projectContext: contextResult
  });

  // ── Breakpoint: Review plan and architecture before implementation ──
  ctx.log('info', 'Breakpoint: Review plan and architecture before implementation');
  await ctx.breakpoint({
    title: 'Plan and Architecture Review',
    description: 'Review the generated plan and architecture before proceeding to implementation.',
    data: {
      plan: planResult,
      architecture: architectureResult,
      detectedContext: contextResult
    }
  });

  // ── Phase 4: TDD Implementation ────────────────────────────────────
  ctx.log('info', 'Phase 4: TDD implementation (Red-Green-Refactor)');
  const tddResult = await ctx.task(tddWorkflowTask, {
    request,
    projectRoot,
    plan: planResult,
    architecture: architectureResult,
    projectContext: contextResult,
    coverageThreshold: 80
  });

  // ── Phase 5: Parallel Review + Security ─────────────────────────────
  ctx.log('info', 'Phase 5: Parallel code review and security scanning');

  const parallelTasks = [
    ctx.task(codeReviewTask, {
      request,
      projectRoot,
      tddResult,
      confidenceThreshold
    })
  ];

  if (securityEnabled) {
    parallelTasks.push(
      ctx.task(securityScanTask, {
        projectRoot,
        tddResult,
        scanCategories: ['secrets', 'permissions', 'hooks', 'mcp', 'agent-config']
      })
    );
  }

  const [reviewResult, securityResult] = await ctx.parallel.all(parallelTasks);

  ctx.log('info', `Review: ${reviewResult.issueCount || 0} issues found`);
  if (securityResult) {
    ctx.log('info', `Security: ${securityResult.findingCount || 0} findings`);
  }

  // ── Phase 6: Remediation Loop ───────────────────────────────────────
  let remediationCycle = 0;
  let currentReviewResult = reviewResult;
  let needsRemediation = (currentReviewResult.criticalCount || 0) > 0 || (currentReviewResult.highCount || 0) > 0;

  while (needsRemediation && remediationCycle < maxRemediationCycles) {
    remediationCycle++;
    ctx.log('info', `Remediation cycle ${remediationCycle}/${maxRemediationCycles}`);

    const refactorResult = await ctx.task(refactorCleanTask, {
      projectRoot,
      reviewFindings: currentReviewResult,
      securityFindings: securityResult,
      tddResult
    });

    // Re-review after remediation
    currentReviewResult = await ctx.task(codeReviewTask, {
      request,
      projectRoot,
      tddResult: refactorResult,
      confidenceThreshold
    });

    needsRemediation = (currentReviewResult.criticalCount || 0) > 0 || (currentReviewResult.highCount || 0) > 0;
    ctx.log('info', `Post-remediation: ${currentReviewResult.criticalCount || 0} critical, ${currentReviewResult.highCount || 0} high issues`);
  }

  // ── Phase 7: E2E Verification ───────────────────────────────────────
  ctx.log('info', 'Phase 7: End-to-end verification');
  const e2eResult = await ctx.task(e2eTestTask, {
    projectRoot,
    plan: planResult,
    projectContext: contextResult
  });

  // ── Phase 8: Build Error Resolution (if needed) ─────────────────────
  let buildResult = null;
  if (e2eResult.exitCode !== 0) {
    ctx.log('warn', 'E2E tests failed, attempting build error resolution');
    buildResult = await ctx.task(buildResolverTask, {
      projectRoot,
      errors: e2eResult.errors,
      projectContext: contextResult
    });
  }

  // ── Phase 9: Deployment Readiness ───────────────────────────────────
  ctx.log('info', 'Phase 9: Deployment readiness check');
  const deployResult = await ctx.task(deployCheckTask, {
    projectRoot,
    tddResult,
    reviewResult: currentReviewResult,
    securityResult,
    e2eResult,
    buildResult
  });

  // ── Breakpoint: Deployment approval ─────────────────────────────────
  if (deployResult.recommendation === 'go') {
    ctx.log('info', 'Breakpoint: Deployment approval');
    await ctx.breakpoint({
      title: 'Deployment Approval',
      description: 'All checks passed. Approve deployment to proceed.',
      data: { deployResult }
    });
  }

  // ── Phase 10: Continuous Learning ───────────────────────────────────
  let learningResult = null;
  if (learningEnabled) {
    ctx.log('info', 'Phase 10: Extracting patterns and learnings');
    learningResult = await ctx.task(extractLearningsTask, {
      request,
      planResult,
      architectureResult,
      tddResult,
      reviewResult: currentReviewResult,
      securityResult,
      e2eResult,
      remediationCycles: remediationCycle
    });
  }

  // ── Summary ─────────────────────────────────────────────────────────
  const summary = {
    mode: detectedMode,
    planPhases: planResult.phases?.length || 0,
    tddCoverage: tddResult.coverage || 'unknown',
    reviewIssues: currentReviewResult.issueCount || 0,
    securityFindings: securityResult?.findingCount || 0,
    e2ePassed: e2eResult.exitCode === 0,
    remediationCycles: remediationCycle,
    deployRecommendation: deployResult.recommendation,
    patternsExtracted: learningResult?.patternCount || 0
  };

  ctx.log('info', `ECC Orchestrator complete: ${JSON.stringify(summary)}`);

  return {
    success: deployResult.recommendation === 'go' || e2eResult.exitCode === 0,
    planResult,
    architectureResult,
    tddResult,
    reviewResults: currentReviewResult,
    securityResults: securityResult,
    e2eResult,
    deploymentResult: deployResult,
    learningExtracted: learningResult,
    summary
  };
}
