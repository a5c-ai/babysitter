/**
 * @process methodologies/metaswarm/metaswarm-design-review
 * @description Metaswarm Design Review Gate - Parallel review by 6 specialist agents (PM, Architect, Designer, Security Design, UX, CTO) with mandatory unanimous approval and max 3 iteration retry
 * @inputs { planDocument: string, workUnits: array, issueDescription: string, maxIterations?: number }
 * @outputs { approved: boolean, iterations: number, reviews: array, failedReviewers: array, summary: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// AGENT TASK DEFINITIONS
// ============================================================================

const productManagerReviewTask = defineTask('metaswarm-pm-review', async (args, _ctx) => {
  return { review: args };
}, {
  kind: 'agent',
  title: 'Product Manager Design Review',
  labels: ['metaswarm', 'design-review', 'product-manager'],
  io: {
    inputs: { planDocument: 'string', workUnits: 'array', issueDescription: 'string' },
    outputs: { approved: 'boolean', useCaseValidation: 'object', userBenefits: 'array', scopeAlignment: 'object', findings: 'array' }
  }
});

const architectReviewTask = defineTask('metaswarm-architect-review', async (args, _ctx) => {
  return { review: args };
}, {
  kind: 'agent',
  title: 'Architect Design Review',
  labels: ['metaswarm', 'design-review', 'architect'],
  io: {
    inputs: { planDocument: 'string', workUnits: 'array', issueDescription: 'string' },
    outputs: { approved: 'boolean', architecturalFit: 'object', patterns: 'array', technicalDebt: 'array', findings: 'array' }
  }
});

const designerReviewTask = defineTask('metaswarm-designer-review', async (args, _ctx) => {
  return { review: args };
}, {
  kind: 'agent',
  title: 'Designer UX/API Review',
  labels: ['metaswarm', 'design-review', 'designer'],
  io: {
    inputs: { planDocument: 'string', workUnits: 'array', issueDescription: 'string' },
    outputs: { approved: 'boolean', uxAssessment: 'object', apiDesign: 'object', developerExperience: 'object', findings: 'array' }
  }
});

const securityDesignReviewTask = defineTask('metaswarm-security-design-review', async (args, _ctx) => {
  return { review: args };
}, {
  kind: 'agent',
  title: 'Security Design Threat Modeling Review',
  labels: ['metaswarm', 'design-review', 'security'],
  io: {
    inputs: { planDocument: 'string', workUnits: 'array', issueDescription: 'string' },
    outputs: { approved: 'boolean', threatModel: 'object', owaspFindings: 'array', mitigations: 'array', findings: 'array' }
  }
});

const uxReviewTask = defineTask('metaswarm-ux-review', async (args, _ctx) => {
  return { review: args };
}, {
  kind: 'agent',
  title: 'UX Reviewer Design Assessment',
  labels: ['metaswarm', 'design-review', 'ux'],
  io: {
    inputs: { planDocument: 'string', workUnits: 'array', issueDescription: 'string' },
    outputs: { approved: 'boolean', usabilityScore: 'number', accessibilityFindings: 'array', userFlowIssues: 'array', findings: 'array' }
  }
});

const ctoReviewTask = defineTask('metaswarm-cto-review', async (args, _ctx) => {
  return { review: args };
}, {
  kind: 'agent',
  title: 'CTO TDD Readiness and Codebase Alignment Review',
  labels: ['metaswarm', 'design-review', 'cto'],
  io: {
    inputs: { planDocument: 'string', workUnits: 'array', issueDescription: 'string' },
    outputs: { approved: 'boolean', tddReadiness: 'object', codebaseAlignment: 'object', riskAssessment: 'object', findings: 'array' }
  }
});

const consolidateReviewsTask = defineTask('metaswarm-consolidate-design-reviews', async (args, _ctx) => {
  return { consolidation: args };
}, {
  kind: 'agent',
  title: 'Consolidate Design Review Findings',
  labels: ['metaswarm', 'design-review', 'consolidation'],
  io: {
    inputs: { reviews: 'array', iteration: 'number' },
    outputs: { allApproved: 'boolean', consolidatedFindings: 'array', actionItems: 'array', blockers: 'array' }
  }
});

// ============================================================================
// MAIN PROCESS
// ============================================================================

/**
 * Metaswarm Design Review Gate Process
 *
 * ALL SIX specialist agents must approve before proceeding.
 * Maximum 3 iterations before escalation to human.
 *
 * Reviewers:
 * 1. Product Manager - Use cases, user benefits, scope alignment
 * 2. Architect - Architectural fit, patterns, technical debt
 * 3. Designer - UX/API design, developer experience
 * 4. Security Design - Threat modeling, OWASP Top 10
 * 5. UX Reviewer - Usability, accessibility, user flows
 * 6. CTO - TDD readiness, codebase alignment, risk
 *
 * Attribution: Adapted from https://github.com/dsifry/metaswarm by David Sifry
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.planDocument - The implementation plan to review
 * @param {Array} inputs.workUnits - Decomposed work units
 * @param {string} inputs.issueDescription - Original issue description
 * @param {number} inputs.maxIterations - Max review iterations (default: 3)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Design review results
 */
export async function process(inputs, ctx) {
  const {
    planDocument,
    workUnits,
    issueDescription,
    maxIterations = 3
  } = inputs;

  ctx.log('Design Review Gate: Starting parallel specialist review');
  ctx.log('Rule: ALL SIX must approve. Max iterations:', maxIterations);

  let iteration = 0;
  let allApproved = false;
  let allReviews = [];

  while (!allApproved && iteration < maxIterations) {
    iteration++;
    ctx.log(`Design Review Iteration ${iteration}/${maxIterations}`);

    // Run all 6 reviews in parallel
    const reviews = await ctx.parallel.all([
      ctx.task(productManagerReviewTask, { planDocument, workUnits, issueDescription }),
      ctx.task(architectReviewTask, { planDocument, workUnits, issueDescription }),
      ctx.task(designerReviewTask, { planDocument, workUnits, issueDescription }),
      ctx.task(securityDesignReviewTask, { planDocument, workUnits, issueDescription }),
      ctx.task(uxReviewTask, { planDocument, workUnits, issueDescription }),
      ctx.task(ctoReviewTask, { planDocument, workUnits, issueDescription })
    ]);

    allReviews = reviews;
    allApproved = reviews.every(r => r.approved);

    if (!allApproved && iteration < maxIterations) {
      const consolidation = await ctx.task(consolidateReviewsTask, {
        reviews,
        iteration
      });

      ctx.log('Design review iteration failed', {
        approved: reviews.filter(r => r.approved).length,
        total: reviews.length,
        blockers: consolidation.blockers
      });
    }
  }

  if (!allApproved) {
    await ctx.breakpoint({
      question: `Design review gate exhausted ${maxIterations} iterations without unanimous approval. Escalating to human for override or revision decision.`,
      title: 'Design Review Gate: Human Escalation',
      context: { runId: ctx.runId }
    });
  }

  const failedReviewers = allReviews
    .filter(r => !r.approved)
    .map(r => r.reviewerRole || 'unknown');

  return {
    approved: allApproved,
    iterations: iteration,
    reviews: allReviews.map(r => ({
      role: r.reviewerRole || 'specialist',
      approved: r.approved,
      findingCount: (r.findings || []).length
    })),
    failedReviewers,
    summary: {
      unanimousApproval: allApproved,
      iterationsUsed: iteration,
      maxIterations
    },
    metadata: {
      processId: 'methodologies/metaswarm/metaswarm-design-review',
      attribution: 'https://github.com/dsifry/metaswarm',
      author: 'David Sifry',
      timestamp: ctx.now()
    }
  };
}
