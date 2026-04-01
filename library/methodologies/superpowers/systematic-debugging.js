/**
 * @process methodologies/superpowers/systematic-debugging
 * @description Systematic Debugging - 4-phase root cause process with Phase 0 diagnosis gate: investigate, pattern analysis, hypothesis testing, diagnosis review, implementation
 * @inputs { issue: string, errorMessage?: string, stackTrace?: string, maxFixAttempts?: number }
 * @outputs { success: boolean, rootCause: object, hypothesis: object, fix: object, phases: array, architecturalIssue: boolean }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';


// ============================================================================
// AGENT TASK DEFINITIONS
// ============================================================================

const agentReadErrorsTask = defineTask('debug-read-errors', async (args, ctx) => {
  return { analysis: args };
}, {
  kind: 'agent',
  title: 'Phase 1.1: Read Error Messages Carefully',
  labels: ['superpowers', 'debugging', 'root-cause'],
  io: {
    inputs: { errorMessage: 'string', stackTrace: 'string' },
    outputs: { parsedError: 'object', lineNumbers: 'array', errorCodes: 'array', possibleCauses: 'array' }
  }
});

const agentReproduceIssueTask = defineTask('debug-reproduce', async (args, ctx) => {
  return { reproduction: args };
}, {
  kind: 'agent',
  title: 'Phase 1.2: Reproduce Consistently',
  labels: ['superpowers', 'debugging', 'reproduction'],
  io: {
    inputs: { issue: 'string', errorAnalysis: 'object' },
    outputs: { reproducible: 'boolean', steps: 'array', frequency: 'string', minimalReproduction: 'string' }
  }
});

const agentCheckRecentChangesTask = defineTask('debug-check-changes', async (args, ctx) => {
  return { changes: args };
}, {
  kind: 'agent',
  title: 'Phase 1.3: Git Diff Breaking Changes',
  labels: ['superpowers', 'debugging', 'change-analysis'],
  io: {
    inputs: { issue: 'string', gitDiff: 'string' },
    outputs: { recentCommits: 'array', changedFiles: 'array', configChanges: 'array', suspectChanges: 'array', gitDiffSummary: 'string' }
  }
});

const agentGatherEvidenceTask = defineTask('debug-gather-evidence', async (args, ctx) => {
  return { evidence: args };
}, {
  kind: 'agent',
  title: 'Phase 1.4: Gather Diagnostic Evidence',
  labels: ['superpowers', 'debugging', 'diagnostics'],
  io: {
    inputs: { issue: 'string', components: 'array' },
    outputs: { componentBoundaries: 'array', failingComponent: 'string', dataFlowBreakpoint: 'string', evidence: 'object' }
  }
});

const agentFindWorkingExamplesTask = defineTask('debug-find-examples', async (args, ctx) => {
  return { examples: args };
}, {
  kind: 'agent',
  title: 'Phase 2.1: Find Working Examples',
  labels: ['superpowers', 'debugging', 'pattern-analysis'],
  io: {
    inputs: { issue: 'string', brokenCode: 'string' },
    outputs: { workingExamples: 'array', differences: 'array', patterns: 'array' }
  }
});

const agentFormHypothesisTask = defineTask('debug-form-hypothesis', async (args, ctx) => {
  return { hypothesis: args };
}, {
  kind: 'agent',
  title: 'Phase 3: Form and Test Hypothesis',
  labels: ['superpowers', 'debugging', 'hypothesis'],
  io: {
    inputs: { evidence: 'object', patterns: 'array', rootCauseCandidate: 'string' },
    outputs: { hypothesis: 'string', testPlan: 'string', minimumChange: 'string', confidence: 'number' }
  }
});

const agentWriteRegressionTestTask = defineTask('debug-regression-test', async (args, ctx) => {
  return { test: args };
}, {
  kind: 'agent',
  title: 'Phase 4.1: Create Failing Test Case',
  labels: ['superpowers', 'debugging', 'regression-test'],
  io: {
    inputs: { issue: 'string', rootCause: 'string', minimalReproduction: 'string' },
    outputs: { testCode: 'string', testPath: 'string', runCommand: 'string', failsCorrectly: 'boolean' }
  }
});

const agentImplementFixTask = defineTask('debug-implement-fix', async (args, ctx) => {
  return { fix: args };
}, {
  kind: 'agent',
  title: 'Phase 4.2: Implement Single Fix',
  labels: ['superpowers', 'debugging', 'fix-implementation'],
  io: {
    inputs: { rootCause: 'string', hypothesis: 'object', regressionTest: 'object' },
    outputs: { fixApplied: 'boolean', filesChanged: 'array', testPasses: 'boolean', allTestsPass: 'boolean' }
  }
});

const agentVerifyFixTask = defineTask('debug-verify-fix', async (args, ctx) => {
  return { verification: args };
}, {
  kind: 'agent',
  title: 'Phase 4.3: Verify Fix',
  labels: ['superpowers', 'debugging', 'verification'],
  io: {
    inputs: { fixResult: 'object', regressionTest: 'object' },
    outputs: { regressionTestPasses: 'boolean', allTestsPass: 'boolean', issueResolved: 'boolean', newIssues: 'array' }
  }
});

// ============================================================================
// MAIN PROCESS
// ============================================================================

/**
 * Systematic Debugging Process
 *
 * Iron Law: NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
 *
 * Four Phases:
 * 1. Root Cause Investigation - Read errors, reproduce, check changes, gather evidence
 * 2. Pattern Analysis - Find working examples, compare, identify differences
 * 3. Hypothesis and Testing - Form single hypothesis, test minimally, one variable at a time
 * 4. Implementation - Create failing test, implement single fix, verify
 *
 * If 3+ fixes fail: Stop and question the architecture
 *
 * Attribution: Adapted from https://github.com/pcvelz/superpowers
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.issue - Description of the bug/failure
 * @param {string} inputs.errorMessage - Error message text
 * @param {string} inputs.stackTrace - Stack trace
 * @param {number} inputs.maxFixAttempts - Max fix attempts before architectural review (default: 3)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Debugging results with root cause and fix
 */
export async function process(inputs, ctx) {
  const {
    issue,
    errorMessage = '',
    stackTrace = '',
    maxFixAttempts = 3
  } = inputs;

  ctx.log('Starting Systematic Debugging', { issue });
  ctx.log('IRON LAW: No fixes without root cause investigation first.');

  const phases = [];

  // ============================================================================
  // PHASE 1: ROOT CAUSE INVESTIGATION
  // ============================================================================

  ctx.log('Phase 1: Root Cause Investigation');

  // 1.1: Read error messages carefully
  const errorAnalysis = await ctx.task(agentReadErrorsTask, {
    errorMessage,
    stackTrace
  });

  // 1.2 and 1.3 can run in parallel - independent investigations
  const [reproductionResult, changesResult] = await ctx.parallel.all([
    ctx.task(agentReproduceIssueTask, {
      issue,
      errorAnalysis
    }),
    ctx.task(agentCheckRecentChangesTask, {
      issue
    })
  ]);

  // 1.4: Gather evidence at component boundaries
  const evidenceResult = await ctx.task(agentGatherEvidenceTask, {
    issue,
    components: errorAnalysis.possibleCauses || []
  });

  phases.push({
    phase: 1,
    name: 'Root Cause Investigation',
    errorAnalysis,
    reproduction: reproductionResult,
    recentChanges: changesResult,
    evidence: evidenceResult
  });

  // ============================================================================
  // PHASE 2: PATTERN ANALYSIS
  // ============================================================================

  ctx.log('Phase 2: Pattern Analysis');

  const patternsResult = await ctx.task(agentFindWorkingExamplesTask, {
    issue,
    brokenCode: evidenceResult.failingComponent || ''
  });

  phases.push({
    phase: 2,
    name: 'Pattern Analysis',
    workingExamples: patternsResult.workingExamples,
    differences: patternsResult.differences
  });

  // ============================================================================
  // PHASE 3: HYPOTHESIS AND TESTING
  // ============================================================================

  ctx.log('Phase 3: Hypothesis and Testing');

  const hypothesisResult = await ctx.task(agentFormHypothesisTask, {
    evidence: evidenceResult,
    patterns: patternsResult.patterns || [],
    rootCauseCandidate: evidenceResult.failingComponent || ''
  });

  phases.push({
    phase: 3,
    name: 'Hypothesis',
    hypothesis: hypothesisResult.hypothesis,
    confidence: hypothesisResult.confidence
  });

  // ============================================================================
  // PHASE 3.5: DIAGNOSIS GATE (Phase 0 compliance - no code changes yet)
  // ============================================================================

  ctx.log('Phase 3.5: Diagnosis gate - verifying evidence before implementation');

  const diagnosisEvidence = [
    ...(evidenceResult.evidence ? [JSON.stringify(evidenceResult.evidence)] : []),
    ...(changesResult.suspectChanges || []).map(c => `Suspect change: ${c}`),
    ...(patternsResult.differences || []).map(d => `Pattern difference: ${d}`),
  ];

  if (diagnosisEvidence.length < 2) {
    ctx.log('WARNING: Fewer than 2 evidence signals gathered. Investigation may be incomplete.');
  }

  await ctx.breakpoint({
    question: [
      '=== Root-Cause Diagnosis Review (Phase 0 Gate) ===',
      '',
      `HYPOTHESIS: ${hypothesisResult.hypothesis}`,
      `CONFIDENCE: ${hypothesisResult.confidence}%`,
      '',
      `EVIDENCE SIGNALS (${diagnosisEvidence.length}):`,
      ...diagnosisEvidence.map(e => `  - ${e}`),
      '',
      'No code changes have been made. Approve to proceed to implementation phase.',
    ].join('\n'),
    title: 'Root-Cause Diagnosis Gate',
    context: { runId: ctx.runId }
  });

  // ============================================================================
  // PHASE 4: IMPLEMENTATION
  // ============================================================================

  ctx.log('Phase 4: Implementation');

  // 4.1: Create failing regression test
  const regressionTest = await ctx.task(agentWriteRegressionTestTask, {
    issue,
    rootCause: hypothesisResult.hypothesis,
    minimalReproduction: reproductionResult.minimalReproduction || ''
  });

  // 4.2: Implement fix with retry loop
  let fixAttempts = 0;
  let fixSucceeded = false;
  let architecturalIssue = false;

  while (!fixSucceeded && fixAttempts < maxFixAttempts) {
    fixAttempts++;
    ctx.log(`Fix attempt ${fixAttempts}/${maxFixAttempts}`);

    const fixResult = await ctx.task(agentImplementFixTask, {
      rootCause: hypothesisResult.hypothesis,
      hypothesis: hypothesisResult,
      regressionTest
    });

    // 4.3: Verify fix
    const verifyResult = await ctx.task(agentVerifyFixTask, {
      fixResult,
      regressionTest
    });

    if (verifyResult.issueResolved && verifyResult.allTestsPass) {
      fixSucceeded = true;
      ctx.log('Fix verified successfully');
    } else if (fixAttempts >= maxFixAttempts) {
      // 3+ fixes failed: Question the architecture
      architecturalIssue = true;
      ctx.log('3+ fix attempts failed. Questioning architecture.');

      await ctx.breakpoint({
        question: `After ${maxFixAttempts} fix attempts, the issue persists. This pattern indicates an architectural problem:\n- Each fix reveals new coupling/shared state issues\n- Fixes require massive refactoring\n- Each fix creates new symptoms\n\nShould we: refactor the architecture, or escalate for design review?`,
        title: 'Architectural Review Required',
        context: { runId: ctx.runId }
      });
    } else {
      ctx.log(`Fix attempt ${fixAttempts} failed. Returning to Phase 1 with new information.`);
    }
  }

  phases.push({
    phase: 4,
    name: 'Implementation',
    fixAttempts,
    fixSucceeded,
    architecturalIssue
  });

  return {
    success: fixSucceeded,
    issue,
    rootCause: {
      hypothesis: hypothesisResult.hypothesis,
      confidence: hypothesisResult.confidence,
      evidence: evidenceResult
    },
    hypothesis: hypothesisResult,
    fix: {
      succeeded: fixSucceeded,
      attempts: fixAttempts,
      regressionTestPath: regressionTest.testPath
    },
    phases,
    architecturalIssue,
    metadata: {
      processId: 'methodologies/superpowers/systematic-debugging',
      attribution: 'https://github.com/pcvelz/superpowers',
      timestamp: ctx.now()
    }
  };
}
