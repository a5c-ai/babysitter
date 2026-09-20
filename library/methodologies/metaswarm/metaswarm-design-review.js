/**
 * @process methodologies/metaswarm/metaswarm-design-review
 * @description Metaswarm Design Review Gate - Parallel review by 6 specialist agents (PM, Architect, Designer, Security Design, UX, CTO) with mandatory unanimous approval and max 3 iteration retry
 * @inputs { planDocument: string, workUnits: array, issueDescription: string, maxIterations?: number }
 * @outputs { approved: boolean, iterations: number, reviews: array, failedReviewers: array, summary: object }
   * @graph
 *   domains: [domain:software-engineering]
 *   skillAreas: [skill-area:prioritization-frameworks, skill-area:product-discovery, skill-area:roadmap-planning]
 *   workflows: [workflow:product-discovery, workflow:feature-development]
 *   topics: [topic:developer-experience]
 *   roles: [role:tech-lead, role:engineering-manager, role:product-manager]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// AGENT TASK DEFINITIONS
// ============================================================================

const productManagerReviewTask = defineTask('metaswarm-pm-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Product Manager Design Review',
  labels: ['metaswarm', 'design-review', 'product-manager'],
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Metaswarm Design Reviewer - Product Manager',
      task: 'Review the implementation plan for use case validity, user benefit and scope alignment with the original issue.',
      context: args,
      instructions: [
        'Validate that the plan addresses the use cases stated in the issue description',
        'State the concrete user benefit each work unit delivers',
        'Flag scope creep: work units that serve no stated use case',
        'Flag scope gaps: stated use cases that no work unit covers',
        'Report reviewerRole as "product-manager"',
        'Set approved to false when any blocking finding remains - never approve to unblock the workflow'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'useCaseValidation', 'userBenefits', 'scopeAlignment', 'findings']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

const architectReviewTask = defineTask('metaswarm-architect-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Architect Design Review',
  labels: ['metaswarm', 'design-review', 'architect'],
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Metaswarm Design Reviewer - Architect',
      task: 'Review the implementation plan for architectural fit, pattern consistency and the technical debt it would incur.',
      context: args,
      instructions: [
        'Assess how the plan fits the existing architecture and its boundaries',
        'Name the patterns the plan uses and whether they match the codebase',
        'List the technical debt the plan creates and whether it is acknowledged',
        'Flag any work unit that cannot be built as described',
        'Report reviewerRole as "architect"',
        'Set approved to false when any blocking finding remains - never approve to unblock the workflow'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'architecturalFit', 'patterns', 'technicalDebt', 'findings']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

const designerReviewTask = defineTask('metaswarm-designer-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Designer UX/API Review',
  labels: ['metaswarm', 'design-review', 'designer'],
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Metaswarm Design Reviewer - Designer',
      task: 'Review the implementation plan for user-facing and API design quality and developer experience.',
      context: args,
      instructions: [
        'Assess the user-facing surface the plan introduces or changes',
        'Assess the API design: naming, shape, versioning and error semantics',
        'Assess developer experience: discoverability, defaults and documentation',
        'Flag inconsistencies with existing surfaces',
        'Report reviewerRole as "designer"',
        'Set approved to false when any blocking finding remains - never approve to unblock the workflow'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'uxAssessment', 'apiDesign', 'developerExperience', 'findings']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

const securityDesignReviewTask = defineTask('metaswarm-security-design-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Security Design Threat Modeling Review',
  labels: ['metaswarm', 'design-review', 'security'],
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Metaswarm Design Reviewer - Security Design',
      task: 'Threat model the implementation plan and check it against the OWASP Top 10 before any code is written.',
      context: args,
      instructions: [
        'Build a threat model: assets, trust boundaries, entry points and attackers',
        'Check the plan against each relevant OWASP Top 10 category',
        'Propose a concrete mitigation for every threat you raise',
        'Flag any work unit that would widen a trust boundary without a control',
        'Report reviewerRole as "security-design"',
        'Set approved to false when any unmitigated threat remains - never approve to unblock the workflow'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'threatModel', 'owaspFindings', 'mitigations', 'findings']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

const uxReviewTask = defineTask('metaswarm-ux-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'UX Reviewer Design Assessment',
  labels: ['metaswarm', 'design-review', 'ux'],
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Metaswarm Design Reviewer - UX Reviewer',
      task: 'Assess the implementation plan for usability, accessibility and the coherence of the user flows it defines.',
      context: args,
      instructions: [
        'Walk each user flow the plan defines and flag dead ends or ambiguous states',
        'Check accessibility: keyboard paths, contrast, labelling and screen reader semantics',
        'Score overall usability from 0 to 100 and justify the score',
        'Flag flows that assume knowledge the user does not have',
        'Report reviewerRole as "ux"',
        'Set approved to false when any blocking finding remains - never approve to unblock the workflow'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'usabilityScore', 'accessibilityFindings', 'userFlowIssues', 'findings']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

const ctoReviewTask = defineTask('metaswarm-cto-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'CTO TDD Readiness and Codebase Alignment Review',
  labels: ['metaswarm', 'design-review', 'cto'],
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Metaswarm Design Reviewer - CTO',
      task: 'Assess whether the plan is ready for test-driven implementation, aligned with the codebase, and acceptable in risk.',
      context: args,
      instructions: [
        'Check TDD readiness: every work unit must have an observable, testable outcome',
        'Check codebase alignment: the plan must build on what exists rather than beside it',
        'Assess delivery risk: unknowns, dependencies, blast radius and rollback',
        'Flag any work unit that cannot be verified by a test',
        'Report reviewerRole as "cto"',
        'Set approved to false when any blocking finding remains - never approve to unblock the workflow'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'tddReadiness', 'codebaseAlignment', 'riskAssessment', 'findings']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

const consolidateReviewsTask = defineTask('metaswarm-consolidate-design-reviews', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Consolidate Design Review Findings',
  labels: ['metaswarm', 'design-review', 'consolidation'],
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Metaswarm Design Review - Consolidator',
      task: 'Merge the six specialist reviews of this iteration into one deduplicated finding list with blockers and action items.',
      context: args,
      instructions: [
        'Deduplicate findings that several reviewers raised, keeping every reviewer attribution',
        'Separate blockers (a reviewer withheld approval) from non-blocking findings',
        'Turn each blocker into a concrete action item against a named work unit',
        'Set allApproved to true only when every one of the six reviews approved',
        'Do not soften or drop a reviewer finding to reach approval'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['allApproved', 'consolidatedFindings', 'actionItems', 'blockers']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`
  }
}));

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
    }, {
      label: 'Design Review Gate: Human Escalation',
      breakpointId: 'metaswarm.metaswarm-design-review.escalation'
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
