/**
 * @process pilot-shell/orchestrator
 * @description Full Pilot Shell spec lifecycle: mode selection -> plan -> implement -> verify -> merge
 * @inputs { description: string, mode?: 'feature'|'bugfix'|'quick', targetQuality?: number, maxIterations?: number }
 * @outputs { success: boolean, mode: string, spec: object, implementation: object, verification: object }
 *
 * Attribution: Adapted from Pilot Shell by Max Ritter (https://github.com/maxritter/pilot-shell)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Pilot Shell Orchestrator
 *
 * Routes work through the appropriate Pilot Shell mode based on task type:
 * - Feature Mode: spec -> plan-reviewer validation -> TDD implementation -> unified review -> merge
 * - Bugfix Mode: analysis -> behavior contract -> test-before-fix -> verify
 * - Quick Mode: chat-based iteration with TDD enforcement (no planning scaffolding)
 *
 * Agents referenced from agents/ directory:
 *   - plan-reviewer: Validates spec completeness, challenges assumptions
 *   - unified-reviewer: Deep code review covering compliance, quality, goal alignment
 *   - tdd-enforcer: Verifies test-first implementation discipline
 *   - file-checker: Language-specific lint/format/typecheck
 *   - context-monitor: Tracks context usage, triggers preservation at thresholds
 *   - spec-guard: Prevents premature completion of incomplete specs
 *   - memory-curator: Captures observations and extracts reusable skills
 *
 * Skills referenced from skills/ directory:
 *   - spec-driven-development: Spec creation and management
 *   - strict-tdd: RED->GREEN->REFACTOR enforcement
 *   - quality-hooks: Language-specific auto-lint/format/typecheck pipeline
 *   - context-preservation: State capture/restore across compactions
 *   - persistent-memory: Observation capture and retrieval
 *   - worktree-isolation: Git worktree management for safe development
 *   - codebase-sync: Convention discovery and rule generation
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.description - Task description (feature, bug, or quick task)
 * @param {string} inputs.mode - Execution mode: 'feature', 'bugfix', or 'quick'
 * @param {number} inputs.targetQuality - Minimum quality score to pass (0-100)
 * @param {number} inputs.maxIterations - Maximum convergence iterations
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result with spec, implementation, and verification
 */
export async function process(inputs, ctx) {
  const {
    description,
    mode = 'feature',
    targetQuality = 85,
    maxIterations = 5
  } = inputs;

  // ============================================================================
  // PHASE 0: SESSION INITIALIZATION AND CODEBASE SYNC
  // ============================================================================

  const syncResult = await ctx.task(codebaseSyncTask, {
    description,
    mode,
    context: inputs.context || {}
  });

  // Load persistent memory from previous sessions
  const memoryResult = await ctx.task(memoryLoadTask, {
    description,
    projectContext: syncResult
  });

  // ============================================================================
  // PHASE 1: MODE ROUTING
  // ============================================================================

  let result;

  if (mode === 'feature') {
    result = await executeFeatureMode(inputs, ctx, syncResult, memoryResult);
  } else if (mode === 'bugfix') {
    result = await executeBugfixMode(inputs, ctx, syncResult, memoryResult);
  } else {
    result = await executeQuickMode(inputs, ctx, syncResult, memoryResult);
  }

  // ============================================================================
  // PHASE FINAL: MEMORY CAPTURE AND SESSION SUMMARY
  // ============================================================================

  const memoryCaptureResult = await ctx.task(memoryCaptureTask, {
    description,
    mode,
    result,
    syncResult
  });

  return {
    success: result.success,
    mode,
    description,
    ...result,
    memory: memoryCaptureResult,
    artifacts: {
      spec: result.spec ? 'artifacts/SPEC.md' : null,
      implementation: 'artifacts/IMPLEMENTATION.md',
      verification: 'artifacts/VERIFICATION.md',
      memory: 'artifacts/MEMORY.md'
    },
    metadata: {
      processId: 'pilot-shell/orchestrator',
      timestamp: ctx.now(),
      attribution: 'Adapted from Pilot Shell by Max Ritter (https://github.com/maxritter/pilot-shell)'
    }
  };
}

/**
 * Feature Mode: Full spec-driven lifecycle
 */
async function executeFeatureMode(inputs, ctx, syncResult, memoryResult) {
  const { description, targetQuality = 85, maxIterations = 5 } = inputs;

  // Spec creation with semantic search and clarifying questions
  const specResult = await ctx.task(specCreationTask, {
    description,
    codebaseContext: syncResult,
    memory: memoryResult
  });

  // Plan-reviewer validation (conditional: skip for <= 3 tasks)
  let planReviewResult = { approved: true, skipped: false };
  const taskCount = specResult.tasks ? specResult.tasks.length : 0;

  if (taskCount > 3) {
    planReviewResult = await ctx.task(planReviewTask, {
      spec: specResult,
      description
    });

    if (!planReviewResult.approved) {
      await ctx.breakpoint({
        question: `Plan reviewer flagged issues with the spec for "${description}". Review feedback and approve revised plan?`,
        title: 'Plan Review Feedback',
        context: {
          runId: ctx.runId,
          files: [
            { path: 'artifacts/SPEC.md', format: 'markdown', label: 'Specification' },
            { path: 'artifacts/PLAN-REVIEW.md', format: 'markdown', label: 'Review Feedback' }
          ]
        }
      });
    }
  } else {
    planReviewResult = { approved: true, skipped: true, reason: 'Task count <= 3, plan review skipped' };
  }

  // Spec approval breakpoint
  await ctx.breakpoint({
    question: `Approve specification for "${description}"? ${taskCount} tasks planned.`,
    title: 'Specification Approval',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/SPEC.md', format: 'markdown', label: 'Specification' }
      ]
    }
  });

  // Worktree creation for isolated implementation
  const worktreeResult = await ctx.task(worktreeSetupTask, {
    description,
    branchPrefix: 'feature'
  });

  // TDD implementation with convergence loop
  const implementationResult = await executeImplementationLoop(
    inputs, ctx, specResult, targetQuality, maxIterations
  );

  // Unified review
  const reviewResult = await ctx.task(unifiedReviewTask, {
    spec: specResult,
    implementation: implementationResult,
    description
  });

  // Auto-fix pass if review found issues
  let fixResult = null;
  if (reviewResult.issues && reviewResult.issues.length > 0) {
    fixResult = await ctx.task(autoFixTask, {
      issues: reviewResult.issues,
      implementation: implementationResult
    });
  }

  // Squash merge
  const mergeResult = await ctx.task(squashMergeTask, {
    description,
    worktree: worktreeResult,
    spec: specResult
  });

  return {
    success: reviewResult.approved || (fixResult && fixResult.success),
    spec: specResult,
    planReview: planReviewResult,
    implementation: implementationResult,
    review: reviewResult,
    fixes: fixResult,
    merge: mergeResult
  };
}

/**
 * Bugfix Mode: Analysis -> Behavior Contract -> Test-Before-Fix -> Verify
 */
async function executeBugfixMode(inputs, ctx, syncResult, memoryResult) {
  const { description, targetQuality = 85 } = inputs;

  // Bug analysis: trace to file:line
  const analysisResult = await ctx.task(bugAnalysisTask, {
    description,
    codebaseContext: syncResult,
    memory: memoryResult
  });

  // Behavior contract formalization
  const contractResult = await ctx.task(behaviorContractTask, {
    analysis: analysisResult,
    description
  });

  await ctx.breakpoint({
    question: `Review behavior contract for bug: "${description}". Bug condition and postcondition correct?`,
    title: 'Behavior Contract Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/BEHAVIOR-CONTRACT.md', format: 'markdown', label: 'Behavior Contract' }
      ]
    }
  });

  // Test-before-fix: write failing test first
  const failingTestResult = await ctx.task(failingBugTestTask, {
    contract: contractResult,
    analysis: analysisResult
  });

  // Preservation tests
  const preservationTestResult = await ctx.task(preservationTestTask, {
    contract: contractResult,
    analysis: analysisResult
  });

  // Minimal fix
  const fixResult = await ctx.task(minimalFixTask, {
    contract: contractResult,
    analysis: analysisResult,
    failingTest: failingTestResult,
    preservationTests: preservationTestResult
  });

  // Quality verification
  const [qualityResult, contractAuditResult] = await ctx.parallel.all([
    () => ctx.task(qualityCheckTask, { implementation: fixResult, targetQuality }),
    () => ctx.task(contractAuditTask, { contract: contractResult, fix: fixResult })
  ]);

  return {
    success: qualityResult.passed && contractAuditResult.satisfied,
    analysis: analysisResult,
    contract: contractResult,
    implementation: fixResult,
    quality: qualityResult,
    contractAudit: contractAuditResult
  };
}

/**
 * Quick Mode: Chat-based iteration with TDD enforcement, no planning scaffolding
 */
async function executeQuickMode(inputs, ctx, syncResult, memoryResult) {
  const { description, targetQuality = 80, maxIterations = 3 } = inputs;

  const implementationResult = await executeImplementationLoop(
    inputs, ctx, { tasks: [{ id: 'quick-task', description }] }, targetQuality, maxIterations
  );

  return {
    success: implementationResult.converged,
    implementation: implementationResult
  };
}

/**
 * Shared TDD implementation loop with convergence
 */
async function executeImplementationLoop(inputs, ctx, specResult, targetQuality, maxIterations) {
  const { description } = inputs;
  let iteration = 0;
  let quality = 0;
  let converged = false;
  const iterations = [];

  while (!converged && iteration < maxIterations) {
    iteration++;

    // TDD cycle: RED -> GREEN -> REFACTOR per task
    const tddResult = await ctx.task(tddCycleTask, {
      spec: specResult,
      iteration,
      previousFeedback: iterations[iteration - 2]?.feedback,
      description
    });

    // Quality hooks pipeline: lint/format/typecheck
    const qualityHooksResult = await ctx.task(qualityHooksPipelineTask, {
      implementation: tddResult,
      iteration
    });

    // Full test suite
    const testSuiteResult = await ctx.task(fullTestSuiteTask, {
      implementation: tddResult,
      iteration
    });

    // TDD enforcement check
    const tddCheckResult = await ctx.task(tddEnforcementTask, {
      implementation: tddResult,
      tests: testSuiteResult,
      iteration
    });

    quality = tddCheckResult.score;
    converged = quality >= targetQuality && tddCheckResult.tddCompliant && qualityHooksResult.passed;

    iterations.push({
      iteration,
      quality,
      tddCompliant: tddCheckResult.tddCompliant,
      qualityHooksPassed: qualityHooksResult.passed,
      feedback: tddCheckResult.feedback
    });

    if (!converged && iteration < maxIterations) {
      await ctx.breakpoint({
        question: `Iteration ${iteration}/${maxIterations}: Quality ${quality}/${targetQuality}, TDD ${tddCheckResult.tddCompliant ? 'PASS' : 'FAIL'}. Continue refining?`,
        title: `Implementation Iteration ${iteration}`,
        context: {
          runId: ctx.runId,
          files: [
            { path: `artifacts/iteration-${iteration}.md`, format: 'markdown', label: `Iteration ${iteration}` }
          ]
        }
      });
    }
  }

  return {
    converged,
    quality,
    targetQuality,
    totalIterations: iteration,
    iterations
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const codebaseSyncTask = defineTask('codebase-sync', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Sync codebase: explore, index, discover conventions',
  agent: {
    name: 'context-monitor',
    prompt: {
      role: 'codebase analyst',
      task: 'Explore the codebase, build a search index, identify conventions and patterns',
      context: args,
      instructions: [
        'Scan project structure and identify language/framework',
        'Build semantic search index of key files and patterns',
        'Discover coding conventions, linting rules, test patterns',
        'Identify existing CI/CD hooks and quality gates',
        'Generate a CONVENTIONS.md summary'
      ],
      outputFormat: 'JSON with language, framework, conventions (array), patterns (array), testFramework, lintConfig, searchIndex (object)'
    },
    outputSchema: {
      type: 'object',
      required: ['language', 'conventions', 'patterns'],
      properties: {
        language: { type: 'string' },
        framework: { type: 'string' },
        conventions: { type: 'array', items: { type: 'string' } },
        patterns: { type: 'array', items: { type: 'string' } },
        testFramework: { type: 'string' },
        lintConfig: { type: 'object' },
        searchIndex: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'sync']
}));

export const memoryLoadTask = defineTask('memory-load', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Load persistent memory from previous sessions',
  agent: {
    name: 'memory-curator',
    prompt: {
      role: 'memory curator',
      task: 'Load relevant observations, decisions, and discoveries from persistent memory',
      context: args,
      instructions: [
        'Search persistent memory for relevant observations',
        'Load previous decisions and their rationale',
        'Retrieve learned patterns and discovered bugfixes',
        'Rank results by relevance to current task',
        'Return structured memory context'
      ],
      outputFormat: 'JSON with observations (array), decisions (array), discoveries (array), relevantSkills (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['observations'],
      properties: {
        observations: { type: 'array', items: { type: 'object' } },
        decisions: { type: 'array', items: { type: 'object' } },
        discoveries: { type: 'array', items: { type: 'object' } },
        relevantSkills: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'memory']
}));

export const specCreationTask = defineTask('spec-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create spec: ${args.description}`,
  agent: {
    name: 'plan-reviewer',
    prompt: {
      role: 'senior product engineer',
      task: 'Create a complete specification through semantic search, clarifying questions, and structured planning',
      context: args,
      instructions: [
        'Search codebase semantically for related code and patterns',
        'Identify clarifying questions and assumptions',
        'Write a complete SPEC.md with goals, tasks, acceptance criteria',
        'Define task dependencies and execution order',
        'Estimate complexity per task',
        'Include rollback plan for each major change'
      ],
      outputFormat: 'JSON with title, goals (array), tasks (array of {id, description, acceptanceCriteria, complexity, dependencies}), assumptions (array), clarifyingQuestions (array), specMarkdown (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['title', 'goals', 'tasks', 'specMarkdown'],
      properties: {
        title: { type: 'string' },
        goals: { type: 'array', items: { type: 'string' } },
        tasks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              acceptanceCriteria: { type: 'array', items: { type: 'string' } },
              complexity: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        assumptions: { type: 'array', items: { type: 'string' } },
        clarifyingQuestions: { type: 'array', items: { type: 'string' } },
        specMarkdown: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'spec', 'planning']
}));

export const planReviewTask = defineTask('plan-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan review: validate spec completeness',
  agent: {
    name: 'plan-reviewer',
    prompt: {
      role: 'senior architect and spec reviewer',
      task: 'Validate spec completeness, challenge assumptions, verify task decomposition',
      context: args,
      instructions: [
        'Check spec completeness: are all requirements covered?',
        'Challenge assumptions: what could go wrong?',
        'Verify task granularity: are tasks atomic and testable?',
        'Check dependency graph for cycles or missing edges',
        'Validate acceptance criteria are measurable',
        'Flag risks and suggest mitigations'
      ],
      outputFormat: 'JSON with approved (boolean), issues (array of {severity, description, suggestion}), strengths (array), risks (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'issues'],
      properties: {
        approved: { type: 'boolean' },
        issues: { type: 'array', items: { type: 'object' } },
        strengths: { type: 'array', items: { type: 'string' } },
        risks: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'plan-review']
}));

export const worktreeSetupTask = defineTask('worktree-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create worktree: ${args.branchPrefix}/${args.description.slice(0, 30)}`,
  agent: {
    name: 'context-monitor',
    prompt: {
      role: 'git workflow specialist',
      task: 'Create an isolated git worktree for safe development',
      context: args,
      instructions: [
        'Create a new git worktree with appropriate branch name',
        'Set up the worktree with current dependencies',
        'Verify the worktree is functional',
        'Return worktree path and branch info'
      ],
      outputFormat: 'JSON with worktreePath, branchName, baseBranch, created (boolean)'
    },
    outputSchema: {
      type: 'object',
      required: ['worktreePath', 'branchName', 'created'],
      properties: {
        worktreePath: { type: 'string' },
        branchName: { type: 'string' },
        baseBranch: { type: 'string' },
        created: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'worktree']
}));

export const tddCycleTask = defineTask('tdd-cycle', (args, taskCtx) => ({
  kind: 'agent',
  title: `TDD cycle (iter ${args.iteration}): RED->GREEN->REFACTOR`,
  agent: {
    name: 'tdd-enforcer',
    prompt: {
      role: 'TDD practitioner and senior engineer',
      task: 'Implement spec tasks using strict RED->GREEN->REFACTOR discipline',
      context: args,
      instructions: [
        'For each task in the spec:',
        '  RED: Write a failing test that captures the requirement',
        '  GREEN: Write minimum code to make the test pass',
        '  REFACTOR: Clean up while keeping tests green',
        'Apply feedback from previous iterations',
        'Commit atomically after each task',
        'Never write implementation code before a failing test exists'
      ],
      outputFormat: 'JSON with tasksCompleted (array of {taskId, redTest, greenImpl, refactored}), filesCreated, filesModified, testResults'
    },
    outputSchema: {
      type: 'object',
      required: ['tasksCompleted', 'filesCreated', 'filesModified'],
      properties: {
        tasksCompleted: { type: 'array', items: { type: 'object' } },
        filesCreated: { type: 'array', items: { type: 'string' } },
        filesModified: { type: 'array', items: { type: 'string' } },
        testResults: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'tdd', `iteration-${args.iteration}`]
}));

export const qualityHooksPipelineTask = defineTask('quality-hooks-pipeline', (args, taskCtx) => ({
  kind: 'agent',
  title: `Quality hooks pipeline (iter ${args.iteration})`,
  agent: {
    name: 'file-checker',
    prompt: {
      role: 'quality automation specialist',
      task: 'Run language-specific quality hooks: lint, format, typecheck',
      context: args,
      instructions: [
        'Detect language and select appropriate tools',
        'Python: ruff + pyright',
        'TypeScript/JavaScript: prettier + eslint + tsc',
        'Go: gofmt + golangci-lint',
        'Run all checks and capture results',
        'Auto-fix what can be auto-fixed',
        'Report remaining issues'
      ],
      outputFormat: 'JSON with passed (boolean), language, checks (array of {tool, passed, issues}), autoFixed (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'language', 'checks'],
      properties: {
        passed: { type: 'boolean' },
        language: { type: 'string' },
        checks: { type: 'array', items: { type: 'object' } },
        autoFixed: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'quality-hooks', `iteration-${args.iteration}`]
}));

export const fullTestSuiteTask = defineTask('full-test-suite', (args, taskCtx) => ({
  kind: 'node',
  title: `Run full test suite (iter ${args.iteration})`,
  description: 'Execute the complete test suite to validate all changes',
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['pilot-shell', 'test', `iteration-${args.iteration}`]
}));

export const tddEnforcementTask = defineTask('tdd-enforcement', (args, taskCtx) => ({
  kind: 'agent',
  title: `TDD enforcement check (iter ${args.iteration})`,
  agent: {
    name: 'tdd-enforcer',
    prompt: {
      role: 'TDD compliance auditor',
      task: 'Verify that implementation followed strict RED->GREEN->REFACTOR discipline',
      context: args,
      instructions: [
        'Check git history: were tests committed before implementation?',
        'Verify every implementation file has corresponding test coverage',
        'Check that no implementation code exists without a prior failing test',
        'Score overall TDD compliance 0-100',
        'Provide specific feedback on violations'
      ],
      outputFormat: 'JSON with tddCompliant (boolean), score (number 0-100), violations (array), feedback (string), coveragePercent (number)'
    },
    outputSchema: {
      type: 'object',
      required: ['tddCompliant', 'score'],
      properties: {
        tddCompliant: { type: 'boolean' },
        score: { type: 'number' },
        violations: { type: 'array', items: { type: 'object' } },
        feedback: { type: 'string' },
        coveragePercent: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'tdd-enforcement', `iteration-${args.iteration}`]
}));

export const unifiedReviewTask = defineTask('unified-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Unified review: compliance + quality + goals',
  agent: {
    name: 'unified-reviewer',
    prompt: {
      role: 'senior code reviewer covering compliance, quality, and goal alignment',
      task: 'Perform deep code review covering all three dimensions',
      context: args,
      instructions: [
        'COMPLIANCE: Check against spec requirements and acceptance criteria',
        'QUALITY: Review code quality, patterns, error handling, edge cases',
        'GOALS: Verify implementation achieves the stated objectives',
        'Check for security issues, performance concerns, maintainability',
        'Identify auto-fixable issues vs. manual review items',
        'Provide overall approval recommendation'
      ],
      outputFormat: 'JSON with approved (boolean), compliance (object), quality (object), goals (object), issues (array of {severity, category, file, line, description, autoFixable}), score (number 0-100)'
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'issues', 'score'],
      properties: {
        approved: { type: 'boolean' },
        compliance: { type: 'object' },
        quality: { type: 'object' },
        goals: { type: 'object' },
        issues: { type: 'array', items: { type: 'object' } },
        score: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'unified-review']
}));

export const autoFixTask = defineTask('auto-fix', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Auto-fix review issues',
  agent: {
    name: 'file-checker',
    prompt: {
      role: 'automated fix specialist',
      task: 'Apply auto-fixes for issues identified in unified review',
      context: args,
      instructions: [
        'Filter issues marked as autoFixable',
        'Apply fixes maintaining test passing state',
        'Run quality hooks after fixes',
        'Report what was fixed and what remains'
      ],
      outputFormat: 'JSON with success (boolean), fixed (array), remaining (array), testsStillPassing (boolean)'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'fixed', 'remaining'],
      properties: {
        success: { type: 'boolean' },
        fixed: { type: 'array', items: { type: 'object' } },
        remaining: { type: 'array', items: { type: 'object' } },
        testsStillPassing: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'auto-fix']
}));

export const squashMergeTask = defineTask('squash-merge', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Squash merge feature branch',
  agent: {
    name: 'context-monitor',
    prompt: {
      role: 'git merge specialist',
      task: 'Squash merge the feature worktree branch back to the base branch',
      context: args,
      instructions: [
        'Verify all tests pass on the feature branch',
        'Squash merge with a clear commit message referencing the spec',
        'Clean up the worktree after successful merge',
        'Return merge result and cleanup status'
      ],
      outputFormat: 'JSON with merged (boolean), commitHash, branchCleanedUp (boolean), worktreeRemoved (boolean)'
    },
    outputSchema: {
      type: 'object',
      required: ['merged'],
      properties: {
        merged: { type: 'boolean' },
        commitHash: { type: 'string' },
        branchCleanedUp: { type: 'boolean' },
        worktreeRemoved: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'merge']
}));

export const bugAnalysisTask = defineTask('bug-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze bug: ${args.description.slice(0, 50)}`,
  agent: {
    name: 'unified-reviewer',
    prompt: {
      role: 'senior debugger and root cause analyst',
      task: 'Trace bug to exact file:line, identify root cause',
      context: args,
      instructions: [
        'Reproduce the bug or trace reported symptoms',
        'Use semantic search to find related code',
        'Trace execution path to identify root cause file:line',
        'Identify affected components and potential blast radius',
        'Document the bug condition precisely'
      ],
      outputFormat: 'JSON with rootCause (object with file, line, description), affectedFiles (array), blastRadius (string), bugCondition (string), reproSteps (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['rootCause', 'bugCondition'],
      properties: {
        rootCause: { type: 'object' },
        affectedFiles: { type: 'array', items: { type: 'string' } },
        blastRadius: { type: 'string' },
        bugCondition: { type: 'string' },
        reproSteps: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'bugfix', 'analysis']
}));

export const behaviorContractTask = defineTask('behavior-contract', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Formalize behavior contract',
  agent: {
    name: 'tdd-enforcer',
    prompt: {
      role: 'behavior contract specialist',
      task: 'Formalize bug condition and postcondition as a Behavior Contract',
      context: args,
      instructions: [
        'Define the Bug Condition: the exact input/state that triggers the bug',
        'Define the Postcondition: the expected correct behavior after fix',
        'Identify invariants that must be preserved',
        'Write the contract in testable terms',
        'Generate BEHAVIOR-CONTRACT.md'
      ],
      outputFormat: 'JSON with bugCondition (string), postcondition (string), invariants (array), contractMarkdown (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['bugCondition', 'postcondition', 'invariants'],
      properties: {
        bugCondition: { type: 'string' },
        postcondition: { type: 'string' },
        invariants: { type: 'array', items: { type: 'string' } },
        contractMarkdown: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'bugfix', 'contract']
}));

export const failingBugTestTask = defineTask('failing-bug-test', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write failing bug test (RED phase)',
  agent: {
    name: 'tdd-enforcer',
    prompt: {
      role: 'TDD specialist',
      task: 'Write a failing test that captures the bug condition from the behavior contract',
      context: args,
      instructions: [
        'Write a test that reproduces the bug condition',
        'The test MUST fail with the current code',
        'The test captures the postcondition as the expected outcome',
        'Run the test to confirm it fails',
        'Commit the failing test'
      ],
      outputFormat: 'JSON with testFile (string), testName (string), failureMessage (string), committed (boolean)'
    },
    outputSchema: {
      type: 'object',
      required: ['testFile', 'testName', 'failureMessage'],
      properties: {
        testFile: { type: 'string' },
        testName: { type: 'string' },
        failureMessage: { type: 'string' },
        committed: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'bugfix', 'tdd-red']
}));

export const preservationTestTask = defineTask('preservation-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write preservation tests for existing behavior',
  agent: {
    name: 'tdd-enforcer',
    prompt: {
      role: 'regression prevention specialist',
      task: 'Write tests that preserve existing correct behavior around the bug area',
      context: args,
      instructions: [
        'Identify behavior adjacent to the bug that must not change',
        'Write tests for each invariant in the behavior contract',
        'All preservation tests MUST pass with current code',
        'Commit preservation tests'
      ],
      outputFormat: 'JSON with testFiles (array), testCount (number), allPassing (boolean)'
    },
    outputSchema: {
      type: 'object',
      required: ['testFiles', 'testCount', 'allPassing'],
      properties: {
        testFiles: { type: 'array', items: { type: 'string' } },
        testCount: { type: 'number' },
        allPassing: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'bugfix', 'preservation']
}));

export const minimalFixTask = defineTask('minimal-fix', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply minimal fix (GREEN phase)',
  agent: {
    name: 'tdd-enforcer',
    prompt: {
      role: 'minimal fix specialist',
      task: 'Apply the smallest possible fix to make the failing bug test pass while keeping all preservation tests green',
      context: args,
      instructions: [
        'Apply the minimal code change to fix the bug',
        'The failing bug test must now pass',
        'All preservation tests must remain green',
        'Run the full test suite to verify no regressions',
        'Commit the fix'
      ],
      outputFormat: 'JSON with filesModified (array), bugTestPassing (boolean), preservationTestsPassing (boolean), fullSuitePassing (boolean), diffSummary (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesModified', 'bugTestPassing', 'preservationTestsPassing'],
      properties: {
        filesModified: { type: 'array', items: { type: 'string' } },
        bugTestPassing: { type: 'boolean' },
        preservationTestsPassing: { type: 'boolean' },
        fullSuitePassing: { type: 'boolean' },
        diffSummary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'bugfix', 'tdd-green']
}));

export const qualityCheckTask = defineTask('quality-check', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Quality verification',
  agent: {
    name: 'file-checker',
    prompt: {
      role: 'quality gatekeeper',
      task: 'Run full quality pipeline and score the implementation',
      context: args,
      instructions: [
        'Run lint, format, and typecheck',
        'Run full test suite with coverage',
        'Score overall quality 0-100',
        'Check against target quality threshold'
      ],
      outputFormat: 'JSON with passed (boolean), score (number), lintPassed (boolean), formatPassed (boolean), typecheckPassed (boolean), testsPassed (boolean), coverage (number)'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'score'],
      properties: {
        passed: { type: 'boolean' },
        score: { type: 'number' },
        lintPassed: { type: 'boolean' },
        formatPassed: { type: 'boolean' },
        typecheckPassed: { type: 'boolean' },
        testsPassed: { type: 'boolean' },
        coverage: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'quality']
}));

export const contractAuditTask = defineTask('contract-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Behavior contract audit',
  agent: {
    name: 'unified-reviewer',
    prompt: {
      role: 'behavior contract auditor',
      task: 'Verify the fix satisfies the behavior contract',
      context: args,
      instructions: [
        'Verify the postcondition is satisfied',
        'Verify all invariants are preserved',
        'Check that the bug condition is resolved',
        'Confirm no new behavior violations introduced'
      ],
      outputFormat: 'JSON with satisfied (boolean), postconditionMet (boolean), invariantsPreserved (boolean), bugConditionResolved (boolean), notes (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['satisfied', 'postconditionMet', 'invariantsPreserved'],
      properties: {
        satisfied: { type: 'boolean' },
        postconditionMet: { type: 'boolean' },
        invariantsPreserved: { type: 'boolean' },
        bugConditionResolved: { type: 'boolean' },
        notes: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'bugfix', 'audit']
}));

export const memoryCaptureTask = defineTask('memory-capture', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Capture session observations to persistent memory',
  agent: {
    name: 'memory-curator',
    prompt: {
      role: 'memory curator and skill extractor',
      task: 'Capture important observations, decisions, and discoveries from this session',
      context: args,
      instructions: [
        'Extract key decisions made during this session',
        'Capture any discoveries about the codebase',
        'Record bugfix patterns for future reference',
        'Identify reusable skills that can be extracted',
        'Store observations in persistent memory',
        'Generate session summary'
      ],
      outputFormat: 'JSON with observations (array), decisions (array), discoveries (array), extractedSkills (array), sessionSummary (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['observations', 'sessionSummary'],
      properties: {
        observations: { type: 'array', items: { type: 'object' } },
        decisions: { type: 'array', items: { type: 'object' } },
        discoveries: { type: 'array', items: { type: 'object' } },
        extractedSkills: { type: 'array', items: { type: 'string' } },
        sessionSummary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'memory', 'capture']
}));
