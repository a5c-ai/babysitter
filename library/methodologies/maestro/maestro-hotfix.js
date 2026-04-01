/**
 * @process methodologies/maestro/maestro-hotfix
 * @description Maestro Hotfix - Fast-path for urgent production issues with Phase 0 root-cause diagnosis: triage, diagnose, implement, test, deploy
 * @inputs { issue: object, projectRoot?: string, severity?: string, qualityThreshold?: number, skipPlanning?: boolean }
 * @outputs { success: boolean, triage: object, fix: object, testResults: object, review: object, deployed: boolean, metrics: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';
import { rootCauseDiagnosisTask, diagnosisBreakpointQuestion } from '../shared/root-cause-diagnosis.js';

// ============================================================================
// AGENT TASK DEFINITIONS
// ============================================================================

const triageIssueTask = defineTask('maestro-hotfix-triage', async (args, _ctx) => {
  return { triage: args };
}, {
  kind: 'agent',
  title: 'Hotfix Specialist: Triage and Classify Issue',
  labels: ['maestro', 'hotfix', 'triage'],
  io: {
    inputs: { issue: 'object', projectRoot: 'string', logs: 'array', stackTrace: 'string' },
    outputs: { severity: 'string', rootCause: 'string', affectedFiles: 'array', fixStrategy: 'string', isSimpleFix: 'boolean', estimatedImpact: 'string' }
  }
});

const locateRootCauseTask = defineTask('maestro-hotfix-locate', async (args, _ctx) => {
  return { location: args };
}, {
  kind: 'agent',
  title: 'Hotfix Specialist: Locate Root Cause in Codebase',
  labels: ['maestro', 'hotfix', 'diagnosis'],
  io: {
    inputs: { triage: 'object', projectRoot: 'string', affectedFiles: 'array' },
    outputs: { rootCauseFile: 'string', rootCauseLine: 'number', relatedFiles: 'array', codeContext: 'object', reproductionSteps: 'array' }
  }
});

const planHotfixTask = defineTask('maestro-hotfix-plan', async (args, _ctx) => {
  return { plan: args };
}, {
  kind: 'agent',
  title: 'Hotfix Specialist: Plan Minimal Fix',
  labels: ['maestro', 'hotfix', 'planning'],
  io: {
    inputs: { triage: 'object', location: 'object', isSimpleFix: 'boolean' },
    outputs: { plan: 'object', filesToModify: 'array', testStrategy: 'object', riskAssessment: 'string' }
  }
});

const implementHotfixTask = defineTask('maestro-hotfix-implement', async (args, _ctx) => {
  return { implementation: args };
}, {
  kind: 'agent',
  title: 'Hotfix Coder: Implement Minimal Fix',
  labels: ['maestro', 'hotfix', 'implementation'],
  io: {
    inputs: { plan: 'object', location: 'object', projectRoot: 'string' },
    outputs: { fixedFiles: 'array', regressionTests: 'array', branchName: 'string', diffSummary: 'string' }
  }
});

const testHotfixTask = defineTask('maestro-hotfix-test', async (args, _ctx) => {
  return { tests: args };
}, {
  kind: 'agent',
  title: 'Test Engineer: Verify Hotfix with Regression Tests',
  labels: ['maestro', 'hotfix', 'testing'],
  io: {
    inputs: { projectRoot: 'string', branchName: 'string', regressionTests: 'array', originalIssue: 'object' },
    outputs: { passed: 'boolean', regressionPassed: 'boolean', existingTestsPassed: 'boolean', coverage: 'object', failures: 'array' }
  }
});

const reviewHotfixTask = defineTask('maestro-hotfix-review', async (args, _ctx) => {
  return { review: args };
}, {
  kind: 'agent',
  title: 'Architect: Expedited Hotfix Code Review',
  labels: ['maestro', 'hotfix', 'review'],
  io: {
    inputs: { implementation: 'object', triage: 'object', testResults: 'object', principles: 'array' },
    outputs: { approved: 'boolean', qualityScore: 'number', riskAccepted: 'boolean', feedback: 'array', mergeReady: 'boolean' }
  }
});

const deployHotfixTask = defineTask('maestro-hotfix-deploy', async (args, _ctx) => {
  return { deployment: args };
}, {
  kind: 'agent',
  title: 'Architect: Merge and Deploy Hotfix',
  labels: ['maestro', 'hotfix', 'deployment'],
  io: {
    inputs: { branchName: 'string', severity: 'string', testResults: 'object' },
    outputs: { merged: 'boolean', commitHash: 'string', deployedTo: 'string', rollbackPlan: 'string' }
  }
});

const updateKnowledgeHotfixTask = defineTask('maestro-hotfix-knowledge', async (args, _ctx) => {
  return { knowledge: args };
}, {
  kind: 'agent',
  title: 'Knowledge Curator: Record Hotfix in Knowledge Graph',
  labels: ['maestro', 'hotfix', 'knowledge'],
  io: {
    inputs: { issue: 'object', triage: 'object', fix: 'object', rootCause: 'string' },
    outputs: { updatedGraph: 'object', postmortemEntry: 'object', preventionSuggestions: 'array' }
  }
});

// ============================================================================
// MAIN PROCESS
// ============================================================================

/**
 * Maestro Hotfix Process
 *
 * Fast-path for urgent production issues. Uses a dedicated hotfix specialist
 * agent for rapid triage and a hotfix coder for minimal implementation.
 * Simple fixes skip the planning phase entirely.
 *
 * Workflow:
 * 1. Hotfix specialist triages and classifies issue
 * 2. Locate root cause in codebase
 * 2.5. Root-cause diagnosis (Phase 0 - no code changes)
 * 3. Plan minimal fix (skipped for simple fixes)
 * 4. Hotfix coder implements fix
 * 5. Test engineer verifies with regression tests
 * 6. Architect expedited review (lower bar for critical fixes)
 * 7. Merge and deploy
 * 8. Knowledge graph updated with postmortem
 *
 * Attribution: Adapted from https://github.com/SnapdragonPartners/maestro
 *
 * @param {Object} inputs - Process inputs
 * @param {Object} inputs.issue - Issue description, logs, stack trace
 * @param {string} inputs.projectRoot - Project root (default: '.')
 * @param {string} inputs.severity - Override severity: critical|high|medium
 * @param {number} inputs.qualityThreshold - Min quality score (default: 70, lower than dev)
 * @param {boolean} inputs.skipPlanning - Skip planning for simple fixes (default: false)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Hotfix results
 */
export async function process(inputs, ctx) {
  const {
    issue,
    projectRoot = '.',
    severity: overrideSeverity = null,
    qualityThreshold = 70,
    skipPlanning = false
  } = inputs;

  const startTime = ctx.now();
  const principles = ['minimal-change', 'no-regressions', 'test-coverage'];

  ctx.log('Maestro Hotfix: Fast-path issue resolution', { issueId: issue.id || 'unknown' });

  // ============================================================================
  // STEP 1: TRIAGE
  // ============================================================================

  ctx.log('Step 1: Triaging issue');

  const triage = await ctx.task(triageIssueTask, {
    issue,
    projectRoot,
    logs: issue.logs || [],
    stackTrace: issue.stackTrace || ''
  });

  const effectiveSeverity = overrideSeverity || triage.severity;
  ctx.log('Triage complete', { severity: effectiveSeverity, isSimple: triage.isSimpleFix, rootCause: triage.rootCause });

  // ============================================================================
  // STEP 2: LOCATE ROOT CAUSE
  // ============================================================================

  ctx.log('Step 2: Locating root cause');

  const location = await ctx.task(locateRootCauseTask, {
    triage,
    projectRoot,
    affectedFiles: triage.affectedFiles
  });

  // ============================================================================
  // STEP 2.5: ROOT-CAUSE DIAGNOSIS (Phase 0 - no code changes)
  // ============================================================================

  ctx.log('Step 2.5: Root-cause diagnosis (Phase 0)');

  const diagnosis = await ctx.task(rootCauseDiagnosisTask, {
    description: issue.description || JSON.stringify(issue),
    projectDir: projectRoot,
    errorMessage: issue.stackTrace || '',
    stackTrace: issue.stackTrace || '',
    context: { triage, location, severity: effectiveSeverity }
  });

  await ctx.breakpoint({
    question: diagnosisBreakpointQuestion(diagnosis),
    title: 'Root-Cause Diagnosis Review (Phase 0)',
    context: { runId: ctx.runId }
  });

  // ============================================================================
  // STEP 3: PLAN (Skip for simple fixes)
  // ============================================================================

  let plan;

  if (triage.isSimpleFix || skipPlanning) {
    ctx.log('Step 3: Skipping planning (simple fix)');
    plan = { plan: { type: 'simple-fix' }, filesToModify: location.relatedFiles, testStrategy: { type: 'regression' }, riskAssessment: 'low' };
  } else {
    ctx.log('Step 3: Planning hotfix');
    plan = await ctx.task(planHotfixTask, {
      triage,
      location,
      isSimpleFix: false
    });

    if (plan.riskAssessment === 'high') {
      await ctx.breakpoint({
        question: `Hotfix plan has HIGH risk assessment. Root cause: ${triage.rootCause}. Files to modify: ${plan.filesToModify.length}. Approve to proceed.`,
        title: 'High-Risk Hotfix Approval',
        context: { runId: ctx.runId }
      });
    }
  }

  // ============================================================================
  // STEP 4: IMPLEMENT
  // ============================================================================

  ctx.log('Step 4: Implementing hotfix');

  const implementation = await ctx.task(implementHotfixTask, {
    plan,
    location,
    projectRoot
  });

  // ============================================================================
  // STEP 5: TEST
  // ============================================================================

  ctx.log('Step 5: Running regression tests');

  const testResults = await ctx.task(testHotfixTask, {
    projectRoot,
    branchName: implementation.branchName,
    regressionTests: implementation.regressionTests,
    originalIssue: issue
  });

  if (!testResults.passed) {
    ctx.log('Tests failed, requesting manual intervention');
    await ctx.breakpoint({
      question: `Hotfix tests failed. Regression: ${testResults.regressionPassed}, Existing: ${testResults.existingTestsPassed}. ${testResults.failures.length} failures. Manual intervention required.`,
      title: 'Hotfix Test Failure',
      context: { runId: ctx.runId }
    });
  }

  // ============================================================================
  // STEP 6: EXPEDITED REVIEW
  // ============================================================================

  ctx.log('Step 6: Architect expedited review');

  let review;
  let reviewApproved = false;
  let reviewAttempts = 0;

  while (!reviewApproved && reviewAttempts < 2) {
    reviewAttempts++;

    review = await ctx.task(reviewHotfixTask, {
      implementation,
      triage,
      testResults,
      principles
    });

    if (review.approved && review.qualityScore >= qualityThreshold) {
      reviewApproved = true;
    } else if (effectiveSeverity === 'critical' && review.riskAccepted) {
      reviewApproved = true;
      ctx.log('Critical severity: risk accepted by architect despite lower quality score');
    } else {
      ctx.log('Review not approved', { score: review.qualityScore, feedback: review.feedback });
      await ctx.breakpoint({
        question: `Hotfix review score ${review.qualityScore}/${qualityThreshold}. Severity: ${effectiveSeverity}. Accept risk and deploy, or reject?`,
        title: 'Hotfix Review Decision',
        context: { runId: ctx.runId }
      });
      reviewApproved = true; // Human approved via breakpoint
    }
  }

  // ============================================================================
  // STEP 7: DEPLOY
  // ============================================================================

  ctx.log('Step 7: Merging and deploying hotfix');

  const deployment = await ctx.task(deployHotfixTask, {
    branchName: implementation.branchName,
    severity: effectiveSeverity,
    testResults
  });

  // ============================================================================
  // STEP 8: KNOWLEDGE UPDATE (non-blocking)
  // ============================================================================

  ctx.log('Step 8: Recording hotfix in knowledge graph');

  const knowledge = await ctx.task(updateKnowledgeHotfixTask, {
    issue,
    triage,
    fix: implementation,
    rootCause: triage.rootCause
  });

  return {
    success: true,
    triage,
    fix: {
      files: implementation.fixedFiles,
      branch: implementation.branchName,
      diff: implementation.diffSummary
    },
    testResults: {
      passed: testResults.passed,
      regressionPassed: testResults.regressionPassed,
      coverage: testResults.coverage
    },
    review: {
      approved: review.approved,
      qualityScore: review.qualityScore
    },
    deployed: deployment.merged,
    deployment: {
      commitHash: deployment.commitHash,
      deployedTo: deployment.deployedTo,
      rollbackPlan: deployment.rollbackPlan
    },
    knowledge: knowledge.postmortemEntry,
    preventionSuggestions: knowledge.preventionSuggestions,
    metrics: {
      severity: effectiveSeverity,
      isSimpleFix: triage.isSimpleFix,
      timeToResolve: ctx.now() - startTime
    },
    metadata: {
      processId: 'methodologies/maestro/maestro-hotfix',
      attribution: 'https://github.com/SnapdragonPartners/maestro',
      author: 'SnapdragonPartners',
      license: 'MIT',
      timestamp: ctx.now()
    }
  };
}
