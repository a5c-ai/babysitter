/**
 * @process pilot-shell/feature
 * @description Feature mode: semantic search -> spec -> TDD implementation -> unified review -> merge
 * @inputs { description: string, targetQuality?: number, maxIterations?: number, skipPlanReview?: boolean }
 * @outputs { success: boolean, spec: object, implementation: object, review: object, merge: object }
 *
 * Attribution: Adapted from Pilot Shell by Max Ritter (https://github.com/maxritter/pilot-shell)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Pilot Shell Feature Mode
 *
 * Full spec-driven development lifecycle for new features:
 * 1. PLAN: Semantic search -> clarifying questions -> spec -> plan-reviewer validation -> approval
 * 2. IMPLEMENT: Git worktree -> strict TDD RED->GREEN->REFACTOR per task -> quality hooks -> full test suite
 * 3. VERIFY: Full tests + execution -> unified review agent -> auto-fixes -> squash merge
 *
 * Agents referenced from agents/ directory:
 *   - plan-reviewer: Validates spec completeness, challenges assumptions (conditional, skipped for <= 3 tasks)
 *   - unified-reviewer: Deep code review covering compliance, quality, goal alignment
 *   - tdd-enforcer: Verifies test-first implementation discipline
 *   - file-checker: Language-specific lint/format/typecheck
 *   - spec-guard: Prevents premature completion of incomplete specs
 *
 * Skills referenced from skills/ directory:
 *   - spec-driven-development: Spec creation and management
 *   - strict-tdd: RED->GREEN->REFACTOR enforcement
 *   - quality-hooks: Language-specific auto-lint/format/typecheck pipeline
 *   - worktree-isolation: Git worktree management for safe development
 *   - codebase-sync: Convention discovery and rule generation
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.description - Feature description
 * @param {number} inputs.targetQuality - Minimum quality score (0-100)
 * @param {number} inputs.maxIterations - Maximum TDD convergence iterations
 * @param {boolean} inputs.skipPlanReview - Force skip plan review (default: auto based on task count)
 * @param {Object} ctx - Process context
 */
export async function process(inputs, ctx) {
  const {
    description,
    targetQuality = 85,
    maxIterations = 5,
    skipPlanReview = false
  } = inputs;

  // ============================================================================
  // PHASE 1: PLAN - Semantic Search -> Spec -> Plan Review -> Approval
  // ============================================================================

  // Semantic codebase search to inform spec
  const searchResult = await ctx.task(semanticSearchTask, {
    description,
    context: inputs.context || {}
  });

  // Spec creation with clarifying questions
  const specResult = await ctx.task(specCreationTask, {
    description,
    searchResult,
    context: inputs.context || {}
  });

  // Conditional plan review (skip for <= 3 tasks or if forced)
  const taskCount = specResult.tasks ? specResult.tasks.length : 0;
  let planReviewResult = { approved: true, skipped: true };

  if (!skipPlanReview && taskCount > 3) {
    planReviewResult = await ctx.task(planReviewValidationTask, {
      spec: specResult,
      description,
      searchResult
    });

    if (!planReviewResult.approved) {
      // Iterative spec refinement
      const revisedSpec = await ctx.task(specRefinementTask, {
        originalSpec: specResult,
        reviewFeedback: planReviewResult,
        description
      });

      // Replace spec with revised version
      Object.assign(specResult, revisedSpec);
    }
  }

  // Human approval gate
  await ctx.breakpoint({
    question: `Approve feature specification for "${description}"?\n\nTasks: ${taskCount}\nPlan review: ${planReviewResult.skipped ? 'skipped (<=3 tasks)' : planReviewResult.approved ? 'APPROVED' : 'REVISED'}`,
    title: 'Feature Spec Approval',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/SPEC.md', format: 'markdown', label: 'Specification' },
        { path: 'artifacts/SEARCH-CONTEXT.md', format: 'markdown', label: 'Codebase Context' }
      ]
    }
  });

  // ============================================================================
  // PHASE 2: IMPLEMENT - Worktree -> TDD -> Quality Hooks -> Test Suite
  // ============================================================================

  // Create isolated worktree
  const worktreeResult = await ctx.task(worktreeCreateTask, {
    description,
    branchPrefix: 'feature'
  });

  // TDD implementation with convergence loop
  let iteration = 0;
  let quality = 0;
  let converged = false;
  const iterationResults = [];

  while (!converged && iteration < maxIterations) {
    iteration++;

    // Strict TDD: RED -> GREEN -> REFACTOR for each spec task
    const tddResult = await ctx.task(strictTddTask, {
      spec: specResult,
      iteration,
      previousFeedback: iterationResults[iteration - 2]?.qualityFeedback,
      description
    });

    // Quality hooks auto-lint pipeline
    const qualityHooksResult = await ctx.task(qualityHooksTask, {
      implementation: tddResult,
      iteration
    });

    // Full test suite execution
    const testSuiteResult = await ctx.task(testSuiteRunTask, {
      iteration
    });

    // Convergence scoring
    const [tddScore, qualityScore] = await ctx.parallel.all([
      () => ctx.task(tddComplianceScoreTask, { implementation: tddResult, tests: testSuiteResult, iteration }),
      () => ctx.task(qualityScoreTask, { implementation: tddResult, qualityHooks: qualityHooksResult, tests: testSuiteResult, targetQuality, iteration })
    ]);

    quality = Math.min(tddScore.score, qualityScore.score);
    converged = quality >= targetQuality && tddScore.compliant && qualityHooksResult.passed;

    iterationResults.push({
      iteration,
      quality,
      tddCompliant: tddScore.compliant,
      qualityHooksPassed: qualityHooksResult.passed,
      testsPassed: testSuiteResult.passed,
      qualityFeedback: qualityScore.feedback
    });

    if (!converged && iteration < maxIterations) {
      await ctx.breakpoint({
        question: `Feature "${description}" iteration ${iteration}/${maxIterations}:\n- Quality: ${quality}/${targetQuality}\n- TDD: ${tddScore.compliant ? 'COMPLIANT' : 'VIOLATION'}\n- Hooks: ${qualityHooksResult.passed ? 'PASS' : 'FAIL'}\n\nContinue refining?`,
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

  // Spec guard: prevent completion if spec incomplete
  await ctx.task(specGuardCheckTask, {
    spec: specResult,
    iterationResults,
    converged
  });

  // ============================================================================
  // PHASE 3: VERIFY - Unified Review -> Auto-Fix -> Squash Merge
  // ============================================================================

  // Unified review covering compliance, quality, goals
  const unifiedReviewResult = await ctx.task(unifiedReviewTask, {
    spec: specResult,
    iterationResults,
    description
  });

  // Auto-fix pass for fixable issues
  let autoFixResult = null;
  if (unifiedReviewResult.issues && unifiedReviewResult.issues.filter(i => i.autoFixable).length > 0) {
    autoFixResult = await ctx.task(autoFixPassTask, {
      issues: unifiedReviewResult.issues.filter(i => i.autoFixable),
      description
    });
  }

  // Final verification
  const finalTestResult = await ctx.task(testSuiteRunTask, { iteration: 'final' });

  // Squash merge
  const mergeResult = await ctx.task(squashMergeTask, {
    description,
    worktree: worktreeResult,
    spec: specResult,
    reviewApproved: unifiedReviewResult.approved,
    testsPassing: finalTestResult.passed
  });

  return {
    success: mergeResult.merged && (unifiedReviewResult.approved || (autoFixResult && autoFixResult.success)),
    spec: specResult,
    planReview: planReviewResult,
    implementation: {
      converged,
      quality,
      targetQuality,
      totalIterations: iteration,
      iterations: iterationResults
    },
    review: unifiedReviewResult,
    autoFix: autoFixResult,
    merge: mergeResult,
    artifacts: {
      spec: 'artifacts/SPEC.md',
      searchContext: 'artifacts/SEARCH-CONTEXT.md',
      implementation: 'artifacts/IMPLEMENTATION.md',
      review: 'artifacts/REVIEW.md'
    },
    metadata: {
      processId: 'pilot-shell/feature',
      timestamp: ctx.now(),
      attribution: 'Adapted from Pilot Shell by Max Ritter (https://github.com/maxritter/pilot-shell)'
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const semanticSearchTask = defineTask('semantic-search', (args, taskCtx) => ({
  kind: 'agent',
  title: `Semantic search: ${args.description.slice(0, 50)}`,
  agent: {
    name: 'context-monitor',
    prompt: {
      role: 'codebase search specialist',
      task: 'Perform semantic search across the codebase to find relevant code, patterns, and dependencies',
      context: args,
      instructions: [
        'Search for files and code related to the feature description',
        'Identify existing patterns that should be followed',
        'Find related tests and test patterns',
        'Locate configuration and dependency files',
        'Map the area of the codebase that will be affected',
        'Generate a SEARCH-CONTEXT.md with findings'
      ],
      outputFormat: 'JSON with relatedFiles (array), patterns (array), testPatterns (array), dependencies (array), impactArea (string), contextMarkdown (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['relatedFiles', 'patterns'],
      properties: {
        relatedFiles: { type: 'array', items: { type: 'string' } },
        patterns: { type: 'array', items: { type: 'object' } },
        testPatterns: { type: 'array', items: { type: 'object' } },
        dependencies: { type: 'array', items: { type: 'string' } },
        impactArea: { type: 'string' },
        contextMarkdown: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'feature', 'search']
}));

export const specCreationTask = defineTask('spec-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create spec: ${args.description.slice(0, 50)}`,
  agent: {
    name: 'plan-reviewer',
    prompt: {
      role: 'senior product engineer and specification writer',
      task: 'Create a complete specification with clarifying questions resolved, informed by codebase search',
      context: args,
      instructions: [
        'Review semantic search results for context',
        'Identify and resolve clarifying questions',
        'Define goals and acceptance criteria per task',
        'Decompose into atomic, testable tasks',
        'Define task dependencies and execution order',
        'Include rollback plan and risk assessment',
        'Generate SPEC.md document'
      ],
      outputFormat: 'JSON with title, goals (array), tasks (array of {id, description, acceptanceCriteria, testStrategy, complexity, dependencies}), assumptions (array), risks (array), specMarkdown (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['title', 'goals', 'tasks', 'specMarkdown'],
      properties: {
        title: { type: 'string' },
        goals: { type: 'array', items: { type: 'string' } },
        tasks: { type: 'array', items: { type: 'object' } },
        assumptions: { type: 'array', items: { type: 'string' } },
        risks: { type: 'array', items: { type: 'object' } },
        specMarkdown: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'feature', 'spec']
}));

export const planReviewValidationTask = defineTask('plan-review-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan review: validate and challenge spec',
  agent: {
    name: 'plan-reviewer',
    prompt: {
      role: 'senior architect acting as spec reviewer',
      task: 'Validate spec completeness, challenge assumptions, find gaps',
      context: args,
      instructions: [
        'Validate every requirement has acceptance criteria',
        'Challenge each assumption: what if it is wrong?',
        'Check task granularity: can each be completed in one TDD cycle?',
        'Verify dependency graph is acyclic and complete',
        'Assess risk of each task and overall plan',
        'Provide approval or specific revision requests'
      ],
      outputFormat: 'JSON with approved (boolean), issues (array of {severity, description, suggestion}), strengths (array), revisionRequests (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'issues'],
      properties: {
        approved: { type: 'boolean' },
        issues: { type: 'array', items: { type: 'object' } },
        strengths: { type: 'array', items: { type: 'string' } },
        revisionRequests: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'feature', 'plan-review']
}));

export const specRefinementTask = defineTask('spec-refinement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Refine spec based on review feedback',
  agent: {
    name: 'plan-reviewer',
    prompt: {
      role: 'specification refinement specialist',
      task: 'Revise the specification based on plan review feedback',
      context: args,
      instructions: [
        'Address each revision request from the plan reviewer',
        'Resolve flagged issues by severity (blockers first)',
        'Update acceptance criteria where needed',
        'Refine task decomposition if too coarse',
        'Update SPEC.md with revisions'
      ],
      outputFormat: 'JSON with title, goals, tasks, revisionsApplied (array), specMarkdown (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['title', 'tasks', 'revisionsApplied'],
      properties: {
        title: { type: 'string' },
        goals: { type: 'array', items: { type: 'string' } },
        tasks: { type: 'array', items: { type: 'object' } },
        revisionsApplied: { type: 'array', items: { type: 'string' } },
        specMarkdown: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'feature', 'refinement']
}));

export const worktreeCreateTask = defineTask('worktree-create', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create worktree: ${args.branchPrefix}/${args.description.slice(0, 30)}`,
  agent: {
    name: 'context-monitor',
    prompt: {
      role: 'git worktree specialist',
      task: 'Create an isolated git worktree for feature development',
      context: args,
      instructions: [
        'Create git worktree with branch name derived from description',
        'Install dependencies in the worktree',
        'Verify the worktree builds and tests pass',
        'Return worktree path and branch info'
      ],
      outputFormat: 'JSON with worktreePath, branchName, baseBranch, ready (boolean)'
    },
    outputSchema: {
      type: 'object',
      required: ['worktreePath', 'branchName', 'ready'],
      properties: {
        worktreePath: { type: 'string' },
        branchName: { type: 'string' },
        baseBranch: { type: 'string' },
        ready: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'feature', 'worktree']
}));

export const strictTddTask = defineTask('strict-tdd', (args, taskCtx) => ({
  kind: 'agent',
  title: `Strict TDD (iter ${args.iteration}): RED->GREEN->REFACTOR`,
  agent: {
    name: 'tdd-enforcer',
    prompt: {
      role: 'strict TDD practitioner',
      task: 'Implement each spec task using strict RED->GREEN->REFACTOR discipline',
      context: args,
      instructions: [
        'Process each spec task in dependency order:',
        '  1. RED: Write a failing test capturing the acceptance criteria',
        '  2. Verify the test fails for the right reason',
        '  3. GREEN: Write the minimum implementation to pass',
        '  4. Verify only the target test turned green',
        '  5. REFACTOR: Clean up while tests stay green',
        '  6. Commit with message referencing the task ID',
        'Apply feedback from previous iterations if present',
        'Never write production code before a failing test'
      ],
      outputFormat: 'JSON with tasksCompleted (array of {taskId, testFile, implFile, refactored, committed}), filesCreated (array), filesModified (array), allTestsPassing (boolean)'
    },
    outputSchema: {
      type: 'object',
      required: ['tasksCompleted', 'allTestsPassing'],
      properties: {
        tasksCompleted: { type: 'array', items: { type: 'object' } },
        filesCreated: { type: 'array', items: { type: 'string' } },
        filesModified: { type: 'array', items: { type: 'string' } },
        allTestsPassing: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'feature', 'tdd', `iteration-${args.iteration}`]
}));

export const qualityHooksTask = defineTask('quality-hooks', (args, taskCtx) => ({
  kind: 'agent',
  title: `Quality hooks (iter ${args.iteration})`,
  agent: {
    name: 'file-checker',
    prompt: {
      role: 'quality hooks pipeline operator',
      task: 'Run language-specific quality hooks with auto-fix',
      context: args,
      instructions: [
        'Detect project language and framework',
        'Run appropriate linter (ruff/eslint/golangci-lint)',
        'Run formatter (prettier/gofmt/ruff format)',
        'Run type checker (tsc/pyright)',
        'Auto-fix all fixable issues',
        'Report results'
      ],
      outputFormat: 'JSON with passed (boolean), checks (array of {tool, passed, autoFixed, remainingIssues})'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'checks'],
      properties: {
        passed: { type: 'boolean' },
        checks: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'feature', 'quality-hooks', `iteration-${args.iteration}`]
}));

export const testSuiteRunTask = defineTask('test-suite-run', (args, taskCtx) => ({
  kind: 'node',
  title: `Full test suite (iter ${args.iteration})`,
  description: 'Run the complete project test suite',
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['pilot-shell', 'feature', 'test', `iteration-${args.iteration}`]
}));

export const tddComplianceScoreTask = defineTask('tdd-compliance-score', (args, taskCtx) => ({
  kind: 'agent',
  title: `TDD compliance score (iter ${args.iteration})`,
  agent: {
    name: 'tdd-enforcer',
    prompt: {
      role: 'TDD compliance auditor',
      task: 'Score TDD compliance by checking git history and test coverage',
      context: args,
      instructions: [
        'Analyze git log: tests must appear before implementation in commit history',
        'Check test coverage for new code',
        'Verify RED-GREEN-REFACTOR cycle was followed',
        'Score 0-100 and report violations'
      ],
      outputFormat: 'JSON with compliant (boolean), score (number), violations (array), coveragePercent (number)'
    },
    outputSchema: {
      type: 'object',
      required: ['compliant', 'score'],
      properties: {
        compliant: { type: 'boolean' },
        score: { type: 'number' },
        violations: { type: 'array', items: { type: 'object' } },
        coveragePercent: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'feature', 'tdd-score', `iteration-${args.iteration}`]
}));

export const qualityScoreTask = defineTask('quality-score', (args, taskCtx) => ({
  kind: 'agent',
  title: `Quality score (iter ${args.iteration})`,
  agent: {
    name: 'file-checker',
    prompt: {
      role: 'quality scoring specialist',
      task: 'Score overall code quality combining lint, format, typecheck, and test results',
      context: args,
      instructions: [
        'Aggregate quality hook results',
        'Weight: lint (25%), format (15%), typecheck (25%), tests (35%)',
        'Calculate composite score 0-100',
        'Provide specific improvement feedback'
      ],
      outputFormat: 'JSON with score (number), breakdown (object with lint, format, typecheck, tests scores), feedback (string), improvements (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'feedback'],
      properties: {
        score: { type: 'number' },
        breakdown: { type: 'object' },
        feedback: { type: 'string' },
        improvements: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'feature', 'quality-score', `iteration-${args.iteration}`]
}));

export const specGuardCheckTask = defineTask('spec-guard-check', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Spec guard: verify spec completion',
  agent: {
    name: 'spec-guard',
    prompt: {
      role: 'spec completion guardian',
      task: 'Verify all spec tasks are complete before allowing merge',
      context: args,
      instructions: [
        'Check each spec task has been implemented',
        'Verify all acceptance criteria are met',
        'Block completion if any tasks remain PENDING',
        'Report completion status per task'
      ],
      outputFormat: 'JSON with complete (boolean), taskStatuses (array of {taskId, status, criteria met}), blockers (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['complete', 'taskStatuses'],
      properties: {
        complete: { type: 'boolean' },
        taskStatuses: { type: 'array', items: { type: 'object' } },
        blockers: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'feature', 'spec-guard']
}));

export const unifiedReviewTask = defineTask('unified-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Unified review: compliance + quality + goals',
  agent: {
    name: 'unified-reviewer',
    prompt: {
      role: 'comprehensive code reviewer',
      task: 'Deep review covering spec compliance, code quality, and goal alignment',
      context: args,
      instructions: [
        'COMPLIANCE: Compare implementation against every spec acceptance criterion',
        'QUALITY: Review patterns, error handling, edge cases, performance',
        'GOALS: Verify the feature achieves its stated objectives',
        'Identify auto-fixable vs manual-review issues',
        'Provide overall approval with confidence score'
      ],
      outputFormat: 'JSON with approved (boolean), score (number), compliance (object), quality (object), goals (object), issues (array of {severity, category, file, line, description, autoFixable})'
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'score', 'issues'],
      properties: {
        approved: { type: 'boolean' },
        score: { type: 'number' },
        compliance: { type: 'object' },
        quality: { type: 'object' },
        goals: { type: 'object' },
        issues: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'feature', 'unified-review']
}));

export const autoFixPassTask = defineTask('auto-fix-pass', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Auto-fix review issues',
  agent: {
    name: 'file-checker',
    prompt: {
      role: 'automated fix applicator',
      task: 'Apply auto-fixes for issues flagged in unified review',
      context: args,
      instructions: [
        'Apply each auto-fixable issue',
        'Re-run quality hooks after fixes',
        'Verify tests still pass',
        'Commit fixes'
      ],
      outputFormat: 'JSON with success (boolean), fixed (array), remaining (array), testsStillPassing (boolean)'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'fixed'],
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
  labels: ['agent', 'pilot-shell', 'feature', 'auto-fix']
}));

export const squashMergeTask = defineTask('squash-merge', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Squash merge feature',
  agent: {
    name: 'context-monitor',
    prompt: {
      role: 'merge specialist',
      task: 'Squash merge feature branch back to base',
      context: args,
      instructions: [
        'Verify review is approved and tests pass',
        'Create squash merge commit with spec reference',
        'Clean up worktree and branch',
        'Report merge status'
      ],
      outputFormat: 'JSON with merged (boolean), commitHash, message, worktreeCleanedUp (boolean)'
    },
    outputSchema: {
      type: 'object',
      required: ['merged'],
      properties: {
        merged: { type: 'boolean' },
        commitHash: { type: 'string' },
        message: { type: 'string' },
        worktreeCleanedUp: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pilot-shell', 'feature', 'merge']
}));
