/**
 * @process methodologies/superpowers/verification-before-completion
 * @description Verification Before Completion - Evidence-based completion verification: run tests, check requirements, prove claims
 * @inputs { claims: array, testCommand?: string, requirements?: array, planPath?: string }
 * @outputs { success: boolean, verifications: array, allVerified: boolean, evidenceGaps: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// AGENT TASK DEFINITIONS
// ============================================================================

const agentIdentifyClaimsTask = defineTask('verify-identify-claims', async (args, ctx) => {
  return { claims: args };
}, {
  kind: 'agent',
  title: 'Identify Verification Claims',
  labels: ['superpowers', 'verification', 'claims'],
  io: {
    inputs: { claims: 'array', planPath: 'string', requirements: 'array' },
    outputs: { verifiableClaims: 'array', commands: 'array' }
  }
});

const agentRunVerificationTask = defineTask('verify-run-command', async (args, ctx) => {
  return { result: args };
}, {
  kind: 'agent',
  title: 'Run Verification Command',
  labels: ['superpowers', 'verification', 'execution'],
  io: {
    inputs: { claim: 'string', command: 'string', expectedOutput: 'string' },
    outputs: { passed: 'boolean', actualOutput: 'string', exitCode: 'number', evidence: 'string' }
  }
});

const agentCheckRequirementsTask = defineTask('verify-check-requirements', async (args, ctx) => {
  return { check: args };
}, {
  kind: 'agent',
  title: 'Check Requirements Line by Line',
  labels: ['superpowers', 'verification', 'requirements'],
  io: {
    inputs: { requirements: 'array', planPath: 'string' },
    outputs: { met: 'array', gaps: 'array', checklist: 'array' }
  }
});

// ============================================================================
// MAIN PROCESS
// ============================================================================

/**
 * Verification Before Completion Process
 *
 * Iron Law: NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
 *
 * Gate Function:
 * 1. IDENTIFY: What command proves this claim?
 * 2. RUN: Execute the FULL command (fresh, complete)
 * 3. READ: Full output, check exit code, count failures
 * 4. VERIFY: Does output confirm the claim?
 * 5. ONLY THEN: Make the claim
 *
 * Attribution: Adapted from https://github.com/pcvelz/superpowers
 *
 * @param {Object} inputs - Process inputs
 * @param {Array} inputs.claims - Claims to verify (e.g., "tests pass", "build succeeds")
 * @param {string} inputs.testCommand - Test command to run
 * @param {Array} inputs.requirements - Requirements to check against
 * @param {string} inputs.planPath - Path to plan for requirement checking
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Verification results with evidence
 */
export async function process(inputs, ctx) {
  const {
    claims = ['tests pass'],
    testCommand = 'npm test',
    requirements = [],
    planPath = null
  } = inputs;

  ctx.log('Starting Verification Before Completion');
  ctx.log('IRON LAW: No completion claims without fresh verification evidence.');

  // ============================================================================
  // STEP 1: IDENTIFY VERIFIABLE CLAIMS
  // ============================================================================

  const claimsResult = await ctx.task(agentIdentifyClaimsTask, {
    claims,
    planPath,
    requirements
  });

  const verifiableClaims = claimsResult.verifiableClaims || claims.map((c, i) => ({
    claim: c,
    command: i === 0 ? testCommand : `echo "Manual verification needed for: ${c}"`
  }));

  // ============================================================================
  // STEP 2: RUN VERIFICATIONS (parallel where independent)
  // ============================================================================

  ctx.log('Running verifications', { count: verifiableClaims.length });

  const verificationResults = await ctx.parallel.all(
    verifiableClaims.map(vc =>
      ctx.task(agentRunVerificationTask, {
        claim: vc.claim,
        command: vc.command,
        expectedOutput: vc.expectedOutput || ''
      })
    )
  );

  // ============================================================================
  // STEP 3: CHECK REQUIREMENTS (if provided)
  // ============================================================================

  let requirementsCheck = null;

  if (requirements.length > 0 || planPath) {
    ctx.log('Checking requirements line by line');

    requirementsCheck = await ctx.task(agentCheckRequirementsTask, {
      requirements,
      planPath
    });
  }

  // ============================================================================
  // STEP 4: COMPILE EVIDENCE
  // ============================================================================

  const verifications = verifiableClaims.map((vc, i) => ({
    claim: vc.claim,
    command: vc.command,
    passed: verificationResults[i].passed,
    evidence: verificationResults[i].evidence || verificationResults[i].actualOutput,
    exitCode: verificationResults[i].exitCode
  }));

  const allVerified = verifications.every(v => v.passed);
  const evidenceGaps = verifications
    .filter(v => !v.passed)
    .map(v => `FAILED: "${v.claim}" - ${v.evidence}`);

  if (requirementsCheck && requirementsCheck.gaps.length > 0) {
    evidenceGaps.push(...requirementsCheck.gaps.map(g => `REQUIREMENT GAP: ${g}`));
  }

  if (!allVerified) {
    await ctx.breakpoint({
      question: `Verification found ${evidenceGaps.length} issue(s):\n${evidenceGaps.map((g, i) => `${i + 1}. ${g}`).join('\n')}\n\nThese must be resolved before claiming completion.`,
      title: 'Verification Failure',
      context: { runId: ctx.runId }
    });
  }

  return {
    success: allVerified,
    verifications,
    allVerified,
    evidenceGaps,
    requirementsCheck,
    metadata: {
      processId: 'methodologies/superpowers/verification-before-completion',
      attribution: 'https://github.com/pcvelz/superpowers',
      timestamp: ctx.now()
    }
  };
}
