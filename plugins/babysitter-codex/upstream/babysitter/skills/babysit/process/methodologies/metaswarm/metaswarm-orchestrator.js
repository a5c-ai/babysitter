/**
 * @process methodologies/metaswarm/metaswarm-orchestrator
 * @description Metaswarm Issue Orchestrator - Master coordinator that manages the full lifecycle from issue to merged PR through research, planning, design review gates, orchestrated execution, and PR shepherding
 * @inputs { issueDescription: string, projectRoot?: string, coverageThresholds?: object, maxRetries?: number, executionMode?: string }
 * @outputs { success: boolean, phases: array, workUnits: array, reviewResults: object, prUrl: string, knowledgeExtracted: array, summary: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// AGENT TASK DEFINITIONS
// ============================================================================

const researchCodebaseTask = defineTask('metaswarm-research-codebase', async (args, _ctx) => {
  return { research: args };
}, {
  kind: 'agent',
  title: 'Research Codebase and Dependencies',
  labels: ['metaswarm', 'research', 'phase-1'],
  io: {
    inputs: { issueDescription: 'string', projectRoot: 'string' },
    outputs: { codebaseAnalysis: 'object', dependencies: 'array', existingPatterns: 'array', relatedFiles: 'array', riskAreas: 'array' }
  }
});

const createImplementationPlanTask = defineTask('metaswarm-create-plan', async (args, _ctx) => {
  return { plan: args };
}, {
  kind: 'agent',
  title: 'Create Detailed Implementation Plan with Work Units',
  labels: ['metaswarm', 'planning', 'phase-1'],
  io: {
    inputs: { issueDescription: 'string', codebaseAnalysis: 'object', existingPatterns: 'array' },
    outputs: { workUnits: 'array', dependencies: 'object', estimatedComplexity: 'string', humanCheckpoints: 'array', planDocument: 'string' }
  }
});

const planAdversarialReviewTask = defineTask('metaswarm-plan-review', async (args, _ctx) => {
  return { review: args };
}, {
  kind: 'agent',
  title: 'Adversarial Plan Review (Feasibility, Completeness, Scope)',
  labels: ['metaswarm', 'plan-review', 'adversarial', 'phase-1'],
  io: {
    inputs: { planDocument: 'string', workUnits: 'array', issueDescription: 'string', reviewerRole: 'string' },
    outputs: { verdict: 'string', findings: 'array', score: 'number', recommendations: 'array' }
  }
});

const preflightValidationTask = defineTask('metaswarm-preflight', async (args, _ctx) => {
  return { preflight: args };
}, {
  kind: 'agent',
  title: 'Pre-Flight External Dependency Validation',
  labels: ['metaswarm', 'preflight', 'phase-2'],
  io: {
    inputs: { workUnits: 'array', projectRoot: 'string' },
    outputs: { externalDeps: 'array', missingCredentials: 'array', configRequired: 'array', ready: 'boolean' }
  }
});

const designReviewTask = defineTask('metaswarm-design-review', async (args, _ctx) => {
  return { review: args };
}, {
  kind: 'agent',
  title: 'Design Review by Specialist Agent',
  labels: ['metaswarm', 'design-review', 'phase-3'],
  io: {
    inputs: { planDocument: 'string', workUnits: 'array', reviewerRole: 'string', issueDescription: 'string' },
    outputs: { approved: 'boolean', findings: 'array', suggestions: 'array', reviewerRole: 'string' }
  }
});

const implementWorkUnitTask = defineTask('metaswarm-implement', async (args, _ctx) => {
  return { implementation: args };
}, {
  kind: 'agent',
  title: 'Implement Work Unit via TDD',
  labels: ['metaswarm', 'implementation', 'tdd', 'phase-5'],
  io: {
    inputs: { workUnit: 'object', projectContext: 'object', fileScope: 'array' },
    outputs: { filesModified: 'array', testsWritten: 'array', dodItemsCompleted: 'array', completionReport: 'object' }
  }
});

const validateQualityGatesTask = defineTask('metaswarm-validate', async (args, _ctx) => {
  return { validation: args };
}, {
  kind: 'agent',
  title: 'Independent Quality Gate Validation (tsc, eslint, vitest)',
  labels: ['metaswarm', 'validation', 'quality-gates', 'phase-5'],
  io: {
    inputs: { workUnitId: 'string', projectRoot: 'string', coverageThresholds: 'object' },
    outputs: { typeCheck: 'object', linting: 'object', tests: 'object', coverage: 'object', allPassed: 'boolean', failures: 'array' }
  }
});

const adversarialReviewTask = defineTask('metaswarm-adversarial-review', async (args, _ctx) => {
  return { review: args };
}, {
  kind: 'agent',
  title: 'Fresh Adversarial Code Review (PASS/FAIL)',
  labels: ['metaswarm', 'adversarial-review', 'phase-5'],
  io: {
    inputs: { workUnit: 'object', filesModified: 'array', dodItems: 'array', attemptNumber: 'number' },
    outputs: { verdict: 'string', evidence: 'array', specCompliance: 'object', fileLineReferences: 'array' }
  }
});

const commitWorkUnitTask = defineTask('metaswarm-commit', async (args, _ctx) => {
  return { commit: args };
}, {
  kind: 'agent',
  title: 'Commit Verified Work Unit',
  labels: ['metaswarm', 'commit', 'phase-5'],
  io: {
    inputs: { workUnitId: 'string', filesModified: 'array', dodItemsCompleted: 'array', fileScope: 'array' },
    outputs: { commitHash: 'string', filesCommitted: 'array', serviceInventoryUpdated: 'boolean' }
  }
});

const finalReviewTask = defineTask('metaswarm-final-review', async (args, _ctx) => {
  return { review: args };
}, {
  kind: 'agent',
  title: 'Final Comprehensive Cross-Unit Integration Review',
  labels: ['metaswarm', 'final-review', 'phase-6'],
  io: {
    inputs: { workUnits: 'array', commitHashes: 'array', projectRoot: 'string' },
    outputs: { integrationIssues: 'array', crossUnitConflicts: 'array', overallQuality: 'number', approved: 'boolean' }
  }
});

const createPrTask = defineTask('metaswarm-create-pr', async (args, _ctx) => {
  return { pr: args };
}, {
  kind: 'agent',
  title: 'Create PR and Invoke Shepherd Monitoring',
  labels: ['metaswarm', 'pr', 'phase-7'],
  io: {
    inputs: { issueDescription: 'string', workUnits: 'array', commitHashes: 'array' },
    outputs: { prUrl: 'string', prNumber: 'number', shepherdActive: 'boolean' }
  }
});

const selfReflectTask = defineTask('metaswarm-self-reflect', async (args, _ctx) => {
  return { reflection: args };
}, {
  kind: 'agent',
  title: 'Extract Learnings and Update Knowledge Base',
  labels: ['metaswarm', 'reflection', 'knowledge'],
  io: {
    inputs: { workUnits: 'array', reviewResults: 'array', issueDescription: 'string' },
    outputs: { patterns: 'array', gotchas: 'array', decisions: 'array', antiPatterns: 'array' }
  }
});

// ============================================================================
// MAIN PROCESS
// ============================================================================

/**
 * Metaswarm Issue Orchestrator Process
 *
 * Implements the full Metaswarm autonomous multi-agent orchestration workflow:
 * 1. Research & Planning (Researcher + Architect + 3 adversarial plan reviewers)
 * 2. Pre-Flight Validation (external dependency detection)
 * 3. Design Review Gate (6 parallel specialist agents, all must approve)
 * 4. Work Unit Decomposition (enumerated DoD, file scope, dependencies)
 * 5. Orchestrated Execution Loop (Implement -> Validate -> Adversarial Review -> Commit)
 * 6. Final Comprehensive Review (cross-unit integration)
 * 7. PR Creation & Shepherd Monitoring
 *
 * Core principle: "Trust nothing. Verify everything. Review adversarially."
 *
 * Attribution: Adapted from https://github.com/dsifry/metaswarm by David Sifry
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.issueDescription - The issue or task to implement
 * @param {string} inputs.projectRoot - Project root directory
 * @param {Object} inputs.coverageThresholds - Coverage requirements (default: 100% all)
 * @param {number} inputs.maxRetries - Max retry cycles per quality gate (default: 3)
 * @param {string} inputs.executionMode - orchestrated|subagent|parallel (default: orchestrated)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Orchestration results with full attribution
 */
export async function process(inputs, ctx) {
  const {
    issueDescription,
    projectRoot = '.',
    coverageThresholds = { lines: 100, branches: 100, functions: 100, statements: 100 },
    maxRetries = 3,
    executionMode = 'orchestrated'
  } = inputs;

  ctx.log('Metaswarm: Starting issue orchestration', { issueDescription });
  ctx.log('Principle: Trust nothing. Verify everything. Review adversarially.');

  // ============================================================================
  // PHASE 1: RESEARCH & PLANNING
  // ============================================================================

  ctx.log('Phase 1: Research & Planning');

  const researchResult = await ctx.task(researchCodebaseTask, {
    issueDescription,
    projectRoot
  });

  const planResult = await ctx.task(createImplementationPlanTask, {
    issueDescription,
    codebaseAnalysis: researchResult.codebaseAnalysis,
    existingPatterns: researchResult.existingPatterns
  });

  // Adversarial plan review: 3 independent reviewers in parallel
  ctx.log('Phase 1b: Adversarial Plan Review (3 independent reviewers)');

  const [feasibilityReview, completenessReview, scopeReview] = await ctx.parallel.all([
    ctx.task(planAdversarialReviewTask, {
      planDocument: planResult.planDocument,
      workUnits: planResult.workUnits,
      issueDescription,
      reviewerRole: 'feasibility'
    }),
    ctx.task(planAdversarialReviewTask, {
      planDocument: planResult.planDocument,
      workUnits: planResult.workUnits,
      issueDescription,
      reviewerRole: 'completeness'
    }),
    ctx.task(planAdversarialReviewTask, {
      planDocument: planResult.planDocument,
      workUnits: planResult.workUnits,
      issueDescription,
      reviewerRole: 'scope-alignment'
    })
  ]);

  const planReviewsPassed = [feasibilityReview, completenessReview, scopeReview]
    .every(r => r.verdict === 'PASS');

  if (!planReviewsPassed) {
    await ctx.breakpoint({
      question: `Plan review failed. Feasibility: ${feasibilityReview.verdict}, Completeness: ${completenessReview.verdict}, Scope: ${scopeReview.verdict}. Review findings and decide whether to revise or proceed.`,
      title: 'Plan Review Gate Failed',
      context: { runId: ctx.runId }
    });
  }

  // ============================================================================
  // PHASE 2: PRE-FLIGHT VALIDATION
  // ============================================================================

  ctx.log('Phase 2: Pre-Flight Validation');

  const preflightResult = await ctx.task(preflightValidationTask, {
    workUnits: planResult.workUnits,
    projectRoot
  });

  if (!preflightResult.ready) {
    await ctx.breakpoint({
      question: `External dependencies require configuration: ${preflightResult.missingCredentials.join(', ')}. Please configure and approve to continue.`,
      title: 'Pre-Flight: External Dependencies Required',
      context: { runId: ctx.runId }
    });
  }

  // ============================================================================
  // PHASE 3: DESIGN REVIEW GATE (6 parallel reviewers, all must approve)
  // ============================================================================

  ctx.log('Phase 3: Design Review Gate (6 parallel specialist reviewers)');

  const designReviewRoles = [
    'product-manager', 'architect', 'designer',
    'security-design', 'ux-reviewer', 'cto'
  ];

  const designReviews = await ctx.parallel.all(
    designReviewRoles.map(role =>
      ctx.task(designReviewTask, {
        planDocument: planResult.planDocument,
        workUnits: planResult.workUnits,
        reviewerRole: role,
        issueDescription
      })
    )
  );

  const allDesignApproved = designReviews.every(r => r.approved);
  let designIterations = 1;

  if (!allDesignApproved && designIterations < 3) {
    const failedReviewers = designReviews
      .filter(r => !r.approved)
      .map(r => r.reviewerRole);

    await ctx.breakpoint({
      question: `Design review gate: ${failedReviewers.length} of 6 reviewers did not approve (${failedReviewers.join(', ')}). Max 3 iterations before human escalation. Review findings and approve to retry or override.`,
      title: 'Design Review Gate: Not All Approved',
      context: { runId: ctx.runId }
    });
  }

  // ============================================================================
  // PHASE 4-5: WORK UNIT DECOMPOSITION & ORCHESTRATED EXECUTION
  // ============================================================================

  ctx.log('Phase 4-5: Orchestrated Execution Loop');

  const workUnits = planResult.workUnits;
  const commitHashes = [];
  const allReviewResults = [];

  for (let i = 0; i < workUnits.length; i++) {
    const workUnit = workUnits[i];
    ctx.log(`Work Unit ${i + 1}/${workUnits.length}: ${workUnit.title || workUnit.id}`);

    // Check for human checkpoint
    if (workUnit.humanCheckpoint) {
      await ctx.breakpoint({
        question: `Human checkpoint required before work unit "${workUnit.title}": ${workUnit.humanCheckpoint}. Approve to continue.`,
        title: `Human Checkpoint: ${workUnit.title}`,
        context: { runId: ctx.runId }
      });
    }

    let unitCompleted = false;
    let attempts = 0;

    while (!unitCompleted && attempts < maxRetries) {
      attempts++;
      ctx.log(`  Attempt ${attempts}/${maxRetries}`);

      // STEP 1: IMPLEMENT (TDD)
      ctx.log('  Step 1: Implement via TDD');
      const implResult = await ctx.task(implementWorkUnitTask, {
        workUnit,
        projectContext: { projectRoot, codebaseAnalysis: researchResult.codebaseAnalysis },
        fileScope: workUnit.fileScope || []
      });

      // STEP 2: VALIDATE (independent quality gates)
      ctx.log('  Step 2: Independent Quality Gate Validation');
      const validationResult = await ctx.task(validateQualityGatesTask, {
        workUnitId: workUnit.id,
        projectRoot,
        coverageThresholds
      });

      if (!validationResult.allPassed) {
        ctx.log('  Quality gates failed', { failures: validationResult.failures });
        if (attempts >= maxRetries) {
          await ctx.breakpoint({
            question: `Work unit "${workUnit.title}" failed quality gates after ${maxRetries} attempts. Failures: ${validationResult.failures.join(', ')}. Escalating to human.`,
            title: `Quality Gate Escalation: ${workUnit.title}`,
            context: { runId: ctx.runId }
          });
        }
        continue;
      }

      // STEP 3: ADVERSARIAL REVIEW (fresh reviewer, binary PASS/FAIL)
      ctx.log('  Step 3: Fresh Adversarial Review');
      const reviewResult = await ctx.task(adversarialReviewTask, {
        workUnit,
        filesModified: implResult.filesModified,
        dodItems: workUnit.definitionOfDone || [],
        attemptNumber: attempts
      });

      allReviewResults.push(reviewResult);

      if (reviewResult.verdict !== 'PASS') {
        ctx.log('  Adversarial review: FAIL', { evidence: reviewResult.evidence });
        if (attempts >= maxRetries) {
          await ctx.breakpoint({
            question: `Work unit "${workUnit.title}" failed adversarial review after ${maxRetries} attempts. Evidence: ${reviewResult.evidence.join('; ')}. Escalating to human.`,
            title: `Adversarial Review Escalation: ${workUnit.title}`,
            context: { runId: ctx.runId }
          });
        }
        continue;
      }

      // STEP 4: COMMIT (only after adversarial PASS)
      ctx.log('  Step 4: Commit verified work unit');
      const commitResult = await ctx.task(commitWorkUnitTask, {
        workUnitId: workUnit.id,
        filesModified: implResult.filesModified,
        dodItemsCompleted: implResult.dodItemsCompleted,
        fileScope: workUnit.fileScope || []
      });

      commitHashes.push(commitResult.commitHash);
      unitCompleted = true;
    }
  }

  // ============================================================================
  // PHASE 6: FINAL COMPREHENSIVE REVIEW
  // ============================================================================

  ctx.log('Phase 6: Final Comprehensive Cross-Unit Review');

  const finalReviewResult = await ctx.task(finalReviewTask, {
    workUnits,
    commitHashes,
    projectRoot
  });

  if (!finalReviewResult.approved) {
    await ctx.breakpoint({
      question: `Final integration review found ${finalReviewResult.integrationIssues.length} issues. Overall quality: ${finalReviewResult.overallQuality}. Review and approve to proceed to PR creation.`,
      title: 'Final Integration Review Issues',
      context: { runId: ctx.runId }
    });
  }

  // ============================================================================
  // SELF-REFLECTION (before PR, while context is fresh)
  // ============================================================================

  ctx.log('Self-Reflection: Extracting learnings');

  const reflectionResult = await ctx.task(selfReflectTask, {
    workUnits,
    reviewResults: allReviewResults,
    issueDescription
  });

  // ============================================================================
  // PHASE 7: PR CREATION & SHEPHERD
  // ============================================================================

  ctx.log('Phase 7: PR Creation & Shepherd Monitoring');

  const prResult = await ctx.task(createPrTask, {
    issueDescription,
    workUnits,
    commitHashes
  });

  return {
    success: true,
    issueDescription,
    phases: [
      'research-planning', 'plan-review-gate', 'preflight-validation',
      'design-review-gate', 'orchestrated-execution', 'final-review',
      'self-reflection', 'pr-creation'
    ],
    workUnits: workUnits.map((wu, i) => ({
      id: wu.id,
      title: wu.title,
      commitHash: commitHashes[i]
    })),
    reviewResults: {
      planReview: { feasibility: feasibilityReview.verdict, completeness: completenessReview.verdict, scope: scopeReview.verdict },
      designReview: { approved: allDesignApproved, reviewerCount: designReviewRoles.length },
      adversarialReviews: allReviewResults.length,
      finalReview: { approved: finalReviewResult.approved, quality: finalReviewResult.overallQuality }
    },
    prUrl: prResult.prUrl,
    knowledgeExtracted: [
      ...reflectionResult.patterns,
      ...reflectionResult.gotchas,
      ...reflectionResult.decisions
    ],
    summary: {
      workUnitsCompleted: commitHashes.length,
      totalWorkUnits: workUnits.length,
      executionMode
    },
    metadata: {
      processId: 'methodologies/metaswarm/metaswarm-orchestrator',
      attribution: 'https://github.com/dsifry/metaswarm',
      author: 'David Sifry',
      timestamp: ctx.now()
    }
  };
}
