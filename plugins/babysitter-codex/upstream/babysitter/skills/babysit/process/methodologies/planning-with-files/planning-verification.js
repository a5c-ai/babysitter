/**
 * @process methodologies/planning-with-files/planning-verification
 * @description Planning with Files - Completion verification, progress assessment, and phase validation
 * @inputs { projectPath: string, taskDescription: string, qualityThreshold?: number, strictMode?: boolean }
 * @outputs { success: boolean, finalScore: number, phaseReport: array, unresolvedErrors: array, recommendations: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Planning with Files - Completion Verification
 *
 * Adapted from Planning with Files (https://github.com/OthmanAdi/planning-with-files)
 * Implements the fifth Manus Principle: "Completion Verification - Stop hook
 * checks all phases complete before exit."
 *
 * This process reads all three planning files and performs comprehensive
 * verification that every phase has been addressed, every error has been
 * logged, and the overall quality meets the threshold.
 *
 * Quality scoring:
 * - Phase completion: 40% weight (all checkboxes checked)
 * - Error resolution: 25% weight (errors addressed or mitigated)
 * - Findings coverage: 20% weight (research captured for decisions)
 * - Progress continuity: 15% weight (no gaps in session log)
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectPath - Root path for planning files
 * @param {string} inputs.taskDescription - Original task description
 * @param {number} inputs.qualityThreshold - Minimum score to pass (default: 80)
 * @param {boolean} inputs.strictMode - Require 100% checkbox completion (default: false)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Verification report with scores, issues, and recommendations
 */
export async function process(inputs, ctx) {
  const {
    projectPath,
    taskDescription,
    qualityThreshold = 80,
    strictMode = false
  } = inputs;

  ctx.log('Starting completion verification');
  ctx.log(`Quality threshold: ${qualityThreshold}`);
  ctx.log(`Strict mode: ${strictMode}`);

  // --- Step 1: Read all three files in parallel ---
  ctx.log('Reading all planning files');
  const [planAnalysis, findingsAnalysis, progressAnalysis] = await ctx.parallel.all([
    ctx.task(analyzePlanFileTask, {
      projectPath,
      strictMode
    }),
    ctx.task(analyzeFindingsFileTask, {
      projectPath
    }),
    ctx.task(analyzeProgressFileTask, {
      projectPath
    })
  ]);

  // --- Step 2: Cross-reference analysis ---
  ctx.log('Cross-referencing planning artifacts');
  const crossReference = await ctx.task(crossReferenceTask, {
    planAnalysis,
    findingsAnalysis,
    progressAnalysis,
    taskDescription
  });

  // --- Step 3: Error resolution check ---
  ctx.log('Checking error resolution status');
  const errorResolution = await ctx.task(checkErrorResolutionTask, {
    projectPath,
    progressAnalysis,
    planAnalysis
  });

  // --- Step 4: Calculate quality score ---
  ctx.log('Calculating quality score');
  const qualityScore = await ctx.task(calculateQualityScoreTask, {
    planAnalysis,
    findingsAnalysis,
    progressAnalysis,
    crossReference,
    errorResolution,
    qualityThreshold,
    strictMode
  });

  // --- Step 5: Generate recommendations ---
  const recommendations = await ctx.task(generateRecommendationsTask, {
    qualityScore,
    crossReference,
    errorResolution,
    taskDescription,
    qualityThreshold
  });

  const passed = qualityScore.finalScore >= qualityThreshold;

  if (!passed) {
    await ctx.breakpoint({
      question: `Verification FAILED. Score: ${qualityScore.finalScore}/${qualityThreshold}. ${recommendations.items.length} recommendations. Phases: ${planAnalysis.completedPhases}/${planAnalysis.totalPhases}. Unresolved errors: ${errorResolution.unresolvedCount}. Review and decide whether to continue or iterate?`,
      title: 'Planning with Files - Verification Failed',
      context: {
        runId: ctx.runId,
        files: [
          { path: `${projectPath}/task_plan.md`, format: 'markdown', label: 'Task Plan' },
          { path: `${projectPath}/findings.md`, format: 'markdown', label: 'Findings' },
          { path: `${projectPath}/progress.md`, format: 'markdown', label: 'Progress' }
        ]
      }
    });
  }

  // --- Step 6: Write verification report to progress.md ---
  await ctx.task(writeVerificationReportTask, {
    projectPath,
    qualityScore,
    crossReference,
    errorResolution,
    recommendations,
    passed
  });

  return {
    success: passed,
    finalScore: qualityScore.finalScore,
    phaseReport: planAnalysis.phases.map(p => ({
      name: p.name,
      complete: p.complete,
      goalsDone: p.completedGoals,
      goalsTotal: p.totalGoals
    })),
    unresolvedErrors: errorResolution.unresolvedErrors,
    recommendations: recommendations.items,
    scoreBreakdown: {
      phaseCompletion: qualityScore.phaseCompletionScore,
      errorResolution: qualityScore.errorResolutionScore,
      findingsCoverage: qualityScore.findingsCoverageScore,
      progressContinuity: qualityScore.progressContinuityScore
    }
  };
}

// --- Task Definitions ---

const analyzePlanFileTask = defineTask('pwf-analyze-plan', {
  kind: 'agent',
  title: 'Analyze task_plan.md Completion State',
  labels: ['planning-with-files', 'verification', 'plan-analysis'],
  io: {
    input: 'Project path, strict mode flag',
    output: 'Plan analysis with phase list, completion counts, checkbox state'
  },
  agent: 'agents/completion-verifier',
  instructions: [
    'Read task_plan.md completely',
    'Parse all phases and their goals',
    'Count checked [x] vs unchecked [ ] checkboxes per phase',
    'Identify any phases with zero progress',
    'In strict mode, flag any unchecked items as blocking',
    'Return structured phase analysis'
  ]
});

const analyzeFindingsFileTask = defineTask('pwf-analyze-findings', {
  kind: 'agent',
  title: 'Analyze findings.md Coverage',
  labels: ['planning-with-files', 'verification', 'findings-analysis'],
  io: {
    input: 'Project path',
    output: 'Findings analysis with section coverage, decision count, research depth'
  },
  agent: 'agents/findings-curator',
  instructions: [
    'Read findings.md completely',
    'Assess coverage: does each plan phase have corresponding findings?',
    'Count documented decisions with rationale',
    'Evaluate research depth and evidence quality',
    'Identify gaps where findings are expected but missing',
    'Return structured findings analysis'
  ]
});

const analyzeProgressFileTask = defineTask('pwf-analyze-progress', {
  kind: 'agent',
  title: 'Analyze progress.md Session Continuity',
  labels: ['planning-with-files', 'verification', 'progress-analysis'],
  io: {
    input: 'Project path',
    output: 'Progress analysis with session log, error list, test results, continuity gaps'
  },
  agent: 'agents/execution-monitor',
  instructions: [
    'Read progress.md completely',
    'Parse session log entries and their timestamps',
    'List all logged errors with resolution status',
    'Check for test results and their outcomes',
    'Identify continuity gaps (long periods without updates)',
    'Return structured progress analysis'
  ]
});

const crossReferenceTask = defineTask('pwf-cross-reference', {
  kind: 'agent',
  title: 'Cross-Reference All Planning Artifacts',
  labels: ['planning-with-files', 'verification', 'cross-reference'],
  io: {
    input: 'Plan analysis, findings analysis, progress analysis, task description',
    output: 'Cross-reference report with consistency issues and coverage gaps'
  },
  agent: 'agents/completion-verifier',
  instructions: [
    'Verify every plan phase has progress log entries',
    'Verify every decision in findings has supporting research',
    'Check that errors in progress are reflected in plan adjustments',
    'Verify task description alignment with plan scope',
    'Identify orphaned findings not linked to any phase',
    'Return consistency report with specific issues'
  ]
});

const checkErrorResolutionTask = defineTask('pwf-check-error-resolution', {
  kind: 'agent',
  title: 'Check Error Resolution Status',
  labels: ['planning-with-files', 'verification', 'errors'],
  io: {
    input: 'Project path, progress analysis, plan analysis',
    output: 'Error resolution report with resolved/unresolved counts and details'
  },
  agent: 'agents/error-analyst',
  instructions: [
    'List all errors from progress.md',
    'Check which errors were resolved (subsequent success on same goal)',
    'Identify errors that were worked around vs truly fixed',
    'Flag critical unresolved errors',
    'Assess whether unresolved errors block completion',
    'Return resolution report with severity assessment'
  ]
});

const calculateQualityScoreTask = defineTask('pwf-calculate-quality', {
  kind: 'agent',
  title: 'Calculate Quality Score',
  labels: ['planning-with-files', 'verification', 'quality'],
  io: {
    input: 'All analysis results, cross-reference, error resolution, thresholds',
    output: 'Quality score with breakdown: phase (40%), errors (25%), findings (20%), continuity (15%)'
  },
  agent: 'agents/completion-verifier',
  instructions: [
    'Phase completion score (40% weight): checked goals / total goals',
    'Error resolution score (25% weight): resolved errors / total errors',
    'Findings coverage score (20% weight): phases with findings / total phases',
    'Progress continuity score (15% weight): sessions without gaps / total sessions',
    'Apply strict mode penalties if enabled',
    'Return final weighted score and component breakdown'
  ]
});

const generateRecommendationsTask = defineTask('pwf-generate-recommendations', {
  kind: 'agent',
  title: 'Generate Improvement Recommendations',
  labels: ['planning-with-files', 'verification', 'recommendations'],
  io: {
    input: 'Quality score, cross-reference, error resolution, task description, threshold',
    output: 'Prioritized recommendation list'
  },
  agent: 'agents/completion-verifier',
  instructions: [
    'Analyze score breakdown to identify weakest areas',
    'For each gap, generate specific actionable recommendation',
    'Prioritize by impact on quality score',
    'Include estimated effort for each recommendation',
    'If score is close to threshold, highlight quick wins',
    'Return prioritized list with rationale'
  ]
});

const writeVerificationReportTask = defineTask('pwf-write-verification-report', {
  kind: 'agent',
  title: 'Write Verification Report to progress.md',
  labels: ['planning-with-files', 'verification', 'report'],
  io: {
    input: 'Project path, quality score, cross-reference, errors, recommendations, pass/fail',
    output: 'Report writing confirmation'
  },
  agent: 'agents/completion-verifier',
  instructions: [
    'Append verification report section to progress.md',
    'Include final score and component breakdown',
    'List all cross-reference issues found',
    'Summarize error resolution status',
    'Include recommendations if not passed',
    'Timestamp the verification for session recovery'
  ]
});
