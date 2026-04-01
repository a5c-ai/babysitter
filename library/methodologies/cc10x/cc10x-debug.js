/**
 * @process methodologies/cc10x/cc10x-debug
 * @description CC10X DEBUG Workflow - Log-first bug investigation with root cause analysis, targeted fix, code review, and evidence-backed verification. Phase 0: Root-cause diagnosis with git diff analysis, 2+ evidence signals, no code changes.
 * @inputs { request: string, projectRoot?: string, errorOutput?: string, memory?: object, confidenceThreshold?: number }
 * @outputs { success: boolean, rootCause: object, fix: object, reviewResult: object, verificationResult: object, evidence: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';


// ============================================================================
// TASK DEFINITIONS
// ============================================================================

const logInvestigationTask = defineTask('cc10x-debug-investigate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Log-First Bug Investigation',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CC10X Bug Investigator',
      task: 'Investigate the reported bug using LOG-FIRST methodology. Read logs and error output BEFORE forming any hypothesis. Never guess.',
      context: { ...args },
      instructions: [
        'PHASE 0 RULE: Run `git diff` (not just git log) to identify the exact breaking change that introduced the regression',
        'PHASE 0 RULE: You MUST NOT make any code changes during investigation. This is diagnosis only.',
        'PHASE 0 RULE: Gather at least 2 independent evidence signals before concluding. Each signal must come from a different source (e.g., log output + git diff, test output + code reading).',
        'Read all available logs, error output, stack traces, and crash reports FIRST',
        'DO NOT hypothesize before reading evidence',
        'Identify the exact error message, file, line number, and call stack',
        'Determine reproduction steps from the evidence',
        'Check recent changes (git log) for potential causes',
        'Check patterns.md for known gotchas that match the error pattern',
        'Form a root cause hypothesis backed by specific log evidence',
        'Rate confidence in root cause (must be >=80% to proceed)'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cc10x', 'debug', 'investigation']
}));

const implementFixTask = defineTask('cc10x-debug-fix', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Targeted Fix',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CC10X Bug Investigator - Fix Phase',
      task: 'Implement a targeted, minimal fix for the identified root cause. Write a regression test first (TDD RED), then fix (TDD GREEN).',
      context: { ...args },
      instructions: [
        'Write a regression test that reproduces the bug (must fail - exit code 1)',
        'Implement the minimal fix to resolve the root cause',
        'Run the regression test (must pass - exit code 0)',
        'Run the full test suite to verify no regressions',
        'Use Write/Edit tools only for file modifications',
        'Record all exit codes as evidence',
        'If fix impacts >2 files, flag for scope review'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cc10x', 'debug', 'fix']
}));

const debugReviewTask = defineTask('cc10x-debug-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review Bug Fix',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CC10X Code Reviewer - Debug Context',
      task: 'Review the bug fix for correctness, completeness, and potential side effects. Verify the fix addresses the root cause, not just symptoms.',
      context: { ...args },
      instructions: [
        'Verify the fix addresses the root cause identified in investigation',
        'Check that the fix does not introduce new error handling gaps',
        'Validate the regression test covers the specific failure mode',
        'Check for similar patterns elsewhere that might have the same bug',
        'Assess if the fix is minimal and targeted (no unnecessary changes)',
        'Report only issues with >=80% confidence',
        'Include Router Contract: STATUS, BLOCKING, REQUIRES_REMEDIATION'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cc10x', 'debug', 'review']
}));

const debugVerifyTask = defineTask('cc10x-debug-verify', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify Bug Fix with Evidence',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CC10X Integration Verifier - Debug Context',
      task: 'Verify the bug fix through end-to-end testing. All claims must be backed by exit codes or test output.',
      context: { ...args },
      instructions: [
        'Run the regression test to confirm the specific bug is fixed',
        'Run the full test suite to verify no regressions',
        'Attempt to reproduce the original error - must fail to reproduce',
        'Record all exit codes and test output as evidence',
        'Check that error handling is robust (no silent failures)',
        'Include Router Contract: STATUS, evidence summary',
        'Document the bug pattern for patterns.md memory'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cc10x', 'debug', 'verification']
}));

// ============================================================================
// MAIN PROCESS
// ============================================================================

/**
 * CC10X DEBUG Workflow Process
 *
 * Log-first bug investigation and fix with evidence-backed verification:
 * 1. Log-first investigation (read evidence BEFORE hypothesizing)
 * 2. Implement targeted fix with regression test (TDD)
 * 3. Code review of the fix
 * 4. Integration verification with evidence
 *
 * Agent chain: bug-investigator -> code-reviewer -> integration-verifier
 *
 * Attribution: Adapted from https://github.com/romiluz13/cc10x by Rom Iluz
 */
export async function process(inputs, ctx) {
  const {
    request,
    projectRoot = '.',
    errorOutput = null,
    memory = {},
    confidenceThreshold = 80
  } = inputs;

  ctx.log('CC10X DEBUG: Starting log-first investigation workflow', { request });

  // ========================================================================
  // STEP 1: LOG-FIRST INVESTIGATION
  // ========================================================================

  ctx.log('Step 1: Log-first bug investigation');

  const investigation = await ctx.task(logInvestigationTask, {
    request,
    errorOutput,
    projectRoot,
    memory
  });

  if (investigation.confidence && investigation.confidence < confidenceThreshold) {
    await ctx.breakpoint({
      question: `Root cause confidence is ${investigation.confidence}% (threshold: ${confidenceThreshold}%). Investigation findings: ${investigation.hypothesis || 'unclear'}. Provide additional context or approve to proceed with low-confidence fix.`,
      title: 'CC10X DEBUG - Low Confidence Root Cause',
      context: { runId: ctx.runId }
    });
  }

  // ========================================================================
  // STEP 2: IMPLEMENT TARGETED FIX
  // ========================================================================

  ctx.log('Step 2: Implementing targeted fix with regression test');

  const fix = await ctx.task(implementFixTask, {
    rootCause: investigation.rootCause,
    hypothesis: investigation.hypothesis,
    affectedFiles: investigation.affectedFiles,
    projectRoot,
    memory
  });

  // ========================================================================
  // STEP 3: CODE REVIEW
  // ========================================================================

  ctx.log('Step 3: Reviewing bug fix');

  const reviewResult = await ctx.task(debugReviewTask, {
    investigation,
    fix,
    projectRoot,
    confidenceThreshold
  });

  // ========================================================================
  // STEP 4: INTEGRATION VERIFICATION
  // ========================================================================

  ctx.log('Step 4: Verifying fix with evidence');

  const verificationResult = await ctx.task(debugVerifyTask, {
    investigation,
    fix,
    reviewResult,
    projectRoot
  });

  return {
    success: verificationResult.status === 'PASS' || verificationResult.exitCode === 0,
    rootCause: {
      hypothesis: investigation.hypothesis,
      confidence: investigation.confidence,
      affectedFiles: investigation.affectedFiles,
      evidence: investigation.logEvidence
    },
    fix: {
      filesChanged: fix.filesChanged,
      regressionTest: fix.regressionTest,
      exitCodes: { red: fix.redExitCode, green: fix.greenExitCode }
    },
    reviewResult,
    verificationResult,
    evidence: {
      investigation: investigation.logEvidence,
      fixExitCodes: { red: fix.redExitCode, green: fix.greenExitCode },
      verificationExitCode: verificationResult.exitCode
    },
    bugPattern: {
      description: investigation.hypothesis,
      files: investigation.affectedFiles,
      preventionTip: investigation.preventionTip
    },
    metadata: {
      processId: 'methodologies/cc10x/cc10x-debug',
      attribution: 'https://github.com/romiluz13/cc10x',
      author: 'Rom Iluz',
      timestamp: ctx.now()
    }
  };
}
