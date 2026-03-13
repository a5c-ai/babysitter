/**
 * @process methodologies/claudekit/claudekit-spec-workflow
 * @description ClaudeKit Spec Workflow - Full specification lifecycle: create specifications from codebase research, then execute via 6-phase iterative implementation (implement, test, review, improve, commit, track)
 * @inputs { mode: string, feature?: string, specFile?: string, projectRoot?: string, codebaseMap?: object, qualityThreshold?: number, maxImprovementCycles?: number }
 * @outputs { success: boolean, mode: string, spec?: object, implementation?: object, phases: array, qualityScore: number, summary: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// SPEC CREATION TASKS
// ============================================================================

const researchCodebaseTask = defineTask('claudekit-spec-research-codebase', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Research Codebase for Specification',
  agent: {
    ref: 'methodologies/claudekit/agents/spec-architect',
    prompt: {
      role: 'ClaudeKit Spec Architect',
      task: 'Deeply research the codebase to understand existing patterns, architecture, and constraints before creating a specification.',
      context: { ...args },
      instructions: [
        'Analyze project structure and module organization',
        'Identify existing patterns and conventions in related modules',
        'Map dependencies that the feature will interact with',
        'Identify integration points and API boundaries',
        'Review existing tests to understand testing patterns',
        'Document technical constraints and requirements',
        'Return structured research findings'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['claudekit', 'spec', 'research']
}));

const createSpecTask = defineTask('claudekit-spec-create', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Feature Specification',
  agent: {
    ref: 'methodologies/claudekit/agents/spec-architect',
    prompt: {
      role: 'ClaudeKit Spec Architect',
      task: 'Create a comprehensive feature specification from codebase research. Include requirements, acceptance criteria, architecture decisions, and implementation plan.',
      context: { ...args },
      instructions: [
        'Define feature scope and non-goals',
        'Write detailed functional requirements',
        'Define acceptance criteria (testable, measurable)',
        'Document architecture decisions with rationale',
        'Plan implementation phases (ordered by dependency)',
        'Identify risks and mitigation strategies',
        'Define API contracts and data models',
        'Map test strategy (unit, integration, E2E)',
        'Save specification to docs/specs/{feature}.md',
        'Return the full specification as structured JSON'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['claudekit', 'spec', 'creation']
}));

// ============================================================================
// SPEC EXECUTION TASKS (6 phases)
// ============================================================================

const implementPhaseTask = defineTask('claudekit-spec-implement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Implementation',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ClaudeKit Spec Implementer',
      task: 'Execute the implementation phase of the specification. Write production code following the spec requirements and architecture decisions.',
      context: { ...args },
      instructions: [
        'Read the specification file for requirements and architecture',
        'Implement each requirement following project conventions',
        'Follow the implementation phase order from the spec',
        'Use existing patterns identified in the codebase research',
        'Add proper type definitions and JSDoc documentation',
        'Implement error handling for all failure modes',
        'Create necessary API contracts and data models',
        'Return list of created/modified files and implementation notes'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['claudekit', 'spec-execution', 'implementation']
}));

const testPhaseTask = defineTask('claudekit-spec-test', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Test Writing',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ClaudeKit Test Writer',
      task: 'Write comprehensive tests for the implementation. Cover all acceptance criteria from the spec, including edge cases and error paths.',
      context: { ...args },
      instructions: [
        'Write unit tests for each module/function',
        'Write integration tests for API boundaries',
        'Cover all acceptance criteria from the specification',
        'Test edge cases: empty inputs, boundary values, concurrent access',
        'Test error paths: invalid inputs, network failures, timeouts',
        'Follow existing test patterns in the codebase',
        'Ensure test isolation (no shared mutable state)',
        'Run tests and verify they pass',
        'Return test file list, coverage summary, and any failing tests'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['claudekit', 'spec-execution', 'testing']
}));

const reviewPhaseTask = defineTask('claudekit-spec-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Code Review',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ClaudeKit Spec Reviewer',
      task: 'Review the implementation against the specification. Verify all requirements are met and code quality standards are upheld.',
      context: { ...args },
      instructions: [
        'Check each requirement from the spec is implemented',
        'Verify all acceptance criteria are testable and tested',
        'Review architecture adherence to spec decisions',
        'Check for missing error handling or edge cases',
        'Verify type safety and API contract compliance',
        'Assess code quality: naming, structure, readability',
        'Identify any deviations from the specification',
        'Return review findings with pass/fail per requirement'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['claudekit', 'spec-execution', 'review']
}));

const improvePhaseTask = defineTask('claudekit-spec-improve', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Iterative Improvement',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ClaudeKit Spec Improver',
      task: 'Address review findings and improve the implementation. Fix all identified issues and re-verify quality.',
      context: { ...args },
      instructions: [
        'Address each review finding from Phase 3',
        'Fix failing tests and add missing coverage',
        'Resolve architecture deviations',
        'Improve error handling gaps',
        'Refactor for code quality if needed',
        'Re-run all tests to verify fixes',
        'Return list of changes made and updated quality metrics'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['claudekit', 'spec-execution', 'improvement']
}));

const commitPhaseTask = defineTask('claudekit-spec-commit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Atomic Commit',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ClaudeKit Commit Manager',
      task: 'Create atomic git commits for the implementation. Group changes logically with descriptive commit messages following project conventions.',
      context: { ...args },
      instructions: [
        'Group changes into logical atomic commits',
        'Write descriptive commit messages following project conventions',
        'Separate production code, tests, and configuration changes',
        'Include specification reference in commit messages',
        'Verify all tests pass before each commit',
        'Create commits in dependency order',
        'Return list of commits created with their messages'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['claudekit', 'spec-execution', 'commit']
}));

const trackProgressTask = defineTask('claudekit-spec-track', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Progress Tracking',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ClaudeKit Progress Tracker',
      task: 'Generate a comprehensive progress report for the spec execution. Track requirement completion, quality metrics, and remaining work.',
      context: { ...args },
      instructions: [
        'Calculate requirement completion percentage',
        'Summarize test coverage across modules',
        'Report quality score from review phase',
        'List any remaining work or known issues',
        'Generate implementation timeline summary',
        'Compare actual vs planned implementation effort',
        'Return structured progress report'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['claudekit', 'spec-execution', 'tracking']
}));

// ============================================================================
// PROCESS FUNCTION
// ============================================================================

export async function process(inputs, ctx) {
  const {
    mode,
    feature = null,
    specFile = null,
    projectRoot = '.',
    codebaseMap = null,
    qualityThreshold = 80,
    maxImprovementCycles = 3
  } = inputs;

  ctx.log(`Starting ClaudeKit Spec Workflow - mode: ${mode}`);

  // -------------------------------------------------------------------------
  // MODE: CREATE - Build specification from codebase research
  // -------------------------------------------------------------------------
  if (mode === 'create') {
    ctx.log('Spec Creation: Researching codebase');
    const research = await ctx.task(researchCodebaseTask, {
      feature,
      projectRoot,
      codebaseMap
    });

    ctx.log('Spec Creation: Building specification');
    const spec = await ctx.task(createSpecTask, {
      feature,
      research,
      projectRoot,
      codebaseMap
    });

    await ctx.breakpoint({
      title: 'Specification Review',
      description: 'Review the generated specification before proceeding to implementation.',
      context: {
        feature,
        specSummary: spec.summary,
        requirementCount: spec.requirements.length,
        phases: spec.implementationPhases
      }
    });

    ctx.log('Spec Creation complete');
    return {
      success: true,
      mode: 'create',
      spec,
      phases: ['research', 'create', 'review'],
      qualityScore: 100,
      summary: {
        feature,
        specFile: spec.outputPath,
        requirementCount: spec.requirements.length,
        acceptanceCriteriaCount: spec.acceptanceCriteria.length
      }
    };
  }

  // -------------------------------------------------------------------------
  // MODE: EXECUTE - 6-phase iterative implementation
  // -------------------------------------------------------------------------
  ctx.log('Spec Execution: Starting 6-phase workflow');

  // Phase 1: Implementation
  ctx.log('Phase 1/6: Implementation');
  const implementation = await ctx.task(implementPhaseTask, {
    specFile,
    projectRoot,
    codebaseMap
  });

  // Phase 2: Test Writing
  ctx.log('Phase 2/6: Test Writing');
  const testResults = await ctx.task(testPhaseTask, {
    specFile,
    projectRoot,
    implementedFiles: implementation.files
  });

  // Phase 3: Code Review
  ctx.log('Phase 3/6: Code Review');
  const reviewResults = await ctx.task(reviewPhaseTask, {
    specFile,
    projectRoot,
    implementedFiles: implementation.files,
    testFiles: testResults.files
  });

  // Phase 4: Iterative Improvement (quality-gated convergence loop)
  let improvementCycle = 0;
  let currentQuality = reviewResults.qualityScore || 0;
  let latestReview = reviewResults;

  while (currentQuality < qualityThreshold && improvementCycle < maxImprovementCycles) {
    improvementCycle++;
    ctx.log(`Phase 4/6: Improvement cycle ${improvementCycle}/${maxImprovementCycles} (quality: ${currentQuality}/${qualityThreshold})`);

    const improvement = await ctx.task(improvePhaseTask, {
      specFile,
      projectRoot,
      reviewFindings: latestReview.findings,
      failingTests: latestReview.failingTests,
      cycle: improvementCycle
    });

    latestReview = await ctx.task(reviewPhaseTask, {
      specFile,
      projectRoot,
      implementedFiles: improvement.changedFiles,
      testFiles: testResults.files,
      previousFindings: latestReview.findings
    });

    currentQuality = latestReview.qualityScore || 0;
  }

  // Human gate if quality threshold not met after all cycles
  if (currentQuality < qualityThreshold) {
    await ctx.breakpoint({
      title: 'Quality Threshold Not Met',
      description: `After ${maxImprovementCycles} improvement cycles, quality score (${currentQuality}) is below threshold (${qualityThreshold}). Review and decide whether to proceed.`,
      context: {
        qualityScore: currentQuality,
        threshold: qualityThreshold,
        remainingIssues: latestReview.findings
      }
    });
  }

  // Phase 5: Atomic Commit
  ctx.log('Phase 5/6: Atomic Commit');
  const commits = await ctx.task(commitPhaseTask, {
    specFile,
    projectRoot,
    implementedFiles: implementation.files,
    testFiles: testResults.files,
    qualityScore: currentQuality
  });

  // Phase 6: Progress Tracking
  ctx.log('Phase 6/6: Progress Tracking');
  const progress = await ctx.task(trackProgressTask, {
    specFile,
    projectRoot,
    implementation,
    testResults,
    reviewResults: latestReview,
    commits,
    improvementCycles: improvementCycle
  });

  ctx.log('ClaudeKit Spec Workflow complete');

  return {
    success: currentQuality >= qualityThreshold,
    mode: 'execute',
    implementation: {
      filesCreated: implementation.files.length,
      testsWritten: testResults.files.length,
      commitsCreated: commits.commitList.length
    },
    phases: ['implement', 'test', 'review', 'improve', 'commit', 'track'],
    qualityScore: currentQuality,
    summary: {
      specFile,
      requirementsMet: progress.requirementCompletion,
      testCoverage: progress.testCoverage,
      qualityScore: currentQuality,
      improvementCycles: improvementCycle,
      totalCommits: commits.commitList.length
    }
  };
}
