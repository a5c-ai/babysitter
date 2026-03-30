/**
 * @process specializations/domains/business/legal/patent-filing-prosecution
 * @description Patent Filing and Prosecution - Invention disclosure capture, patentability assessment,
 * application drafting, and prosecution management workflow.
 * @inputs { inventionDisclosure: object, action?: string, applicationId?: string, outputDir?: string }
 * @outputs { success: boolean, assessment: object, application: object, prosecutionStatus: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/legal/patent-filing-prosecution', {
 *   inventionDisclosure: {
 *     title: 'AI-Powered Contract Analysis System',
 *     inventors: ['John Smith', 'Jane Doe'],
 *     description: 'A system for automated contract analysis using machine learning',
 *     filingDeadline: '2024-06-01'
 *   },
 *   action: 'full-cycle',
 *   outputDir: 'patent-filings'
 * });
 *
 * @references
 * - USPTO Patent Process: https://www.uspto.gov/patents/basics
 * - Patent It Yourself: https://www.nolo.com/products/patent-it-yourself-pat.html
 * - AIPLA Resources: https://www.aipla.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    inventionDisclosure,
    action = 'assess', // 'assess', 'draft', 'file', 'prosecute', 'full-cycle'
    applicationId = null,
    jurisdiction = 'US',
    outputDir = 'patent-filing-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Patent Filing Process - Action: ${action}`);

  // Phase 1: Disclosure Review
  const disclosureReview = await ctx.task(disclosureReviewTask, {
    inventionDisclosure,
    outputDir
  });
  artifacts.push(...disclosureReview.artifacts);

  // Phase 2: Patentability Assessment
  const patentabilityAssessment = await ctx.task(patentabilityAssessmentTask, {
    disclosure: disclosureReview.structuredDisclosure,
    outputDir
  });
  artifacts.push(...patentabilityAssessment.artifacts);

  // Quality Gate: Patentability Decision
  await ctx.breakpoint({
    question: `Patentability assessment complete. Score: ${patentabilityAssessment.score}/100. Recommendation: ${patentabilityAssessment.recommendation}. Proceed with filing?`,
    title: 'Patentability Assessment Review',
    context: {
      runId: ctx.runId,
      score: patentabilityAssessment.score,
      recommendation: patentabilityAssessment.recommendation,
      priorArt: patentabilityAssessment.priorArtFound,
      files: patentabilityAssessment.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  if (action === 'assess') {
    return {
      success: true,
      action,
      assessment: patentabilityAssessment,
      artifacts,
      metadata: { processId: 'specializations/domains/business/legal/patent-filing-prosecution', timestamp: startTime }
    };
  }

  // Phase 3: Claims Drafting
  const claimsDrafting = await ctx.task(claimsDraftingTask, {
    disclosure: disclosureReview.structuredDisclosure,
    patentabilityAssessment,
    outputDir
  });
  artifacts.push(...claimsDrafting.artifacts);

  // Phase 4: Specification Drafting
  const specificationDrafting = await ctx.task(specificationDraftingTask, {
    disclosure: disclosureReview.structuredDisclosure,
    claims: claimsDrafting.claims,
    outputDir
  });
  artifacts.push(...specificationDrafting.artifacts);

  // Phase 5: Application Assembly
  const applicationAssembly = await ctx.task(applicationAssemblyTask, {
    disclosure: disclosureReview.structuredDisclosure,
    claims: claimsDrafting.claims,
    specification: specificationDrafting.specification,
    jurisdiction,
    outputDir
  });
  artifacts.push(...applicationAssembly.artifacts);

  await ctx.breakpoint({
    question: `Patent application draft complete. ${claimsDrafting.claims.length} claims. Review and approve for filing?`,
    title: 'Patent Application Review',
    context: {
      runId: ctx.runId,
      claimsCount: claimsDrafting.claims.length,
      applicationPath: applicationAssembly.applicationPath,
      files: [{ path: applicationAssembly.applicationPath, format: 'docx', label: 'Patent Application' }]
    }
  });

  if (action === 'draft') {
    return {
      success: true,
      action,
      assessment: patentabilityAssessment,
      application: applicationAssembly,
      artifacts,
      metadata: { processId: 'specializations/domains/business/legal/patent-filing-prosecution', timestamp: startTime }
    };
  }

  // Phase 6: Filing
  const filing = await ctx.task(patentFilingTask, {
    application: applicationAssembly,
    jurisdiction,
    outputDir
  });
  artifacts.push(...filing.artifacts);

  // Phase 7: Prosecution Tracking (if continuing)
  let prosecutionStatus = null;
  if (action === 'prosecute' || action === 'full-cycle') {
    prosecutionStatus = await ctx.task(prosecutionTrackingTask, {
      applicationId: filing.applicationId,
      outputDir
    });
    artifacts.push(...prosecutionStatus.artifacts);
  }

  return {
    success: true,
    action,
    assessment: patentabilityAssessment,
    application: {
      id: filing.applicationId,
      filingDate: filing.filingDate,
      path: applicationAssembly.applicationPath
    },
    prosecutionStatus: prosecutionStatus?.status,
    artifacts,
    metadata: { processId: 'specializations/domains/business/legal/patent-filing-prosecution', timestamp: startTime }
  };
}

export const disclosureReviewTask = defineTask('disclosure-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review invention disclosure',
  agent: {
    name: 'ip-specialist',
    prompt: {
      role: 'Patent Analyst',
      task: 'Review and structure invention disclosure',
      context: args,
      instructions: ['Review disclosure completeness', 'Identify key innovations', 'Structure technical description', 'Identify potential claims'],
      outputFormat: 'JSON with structuredDisclosure object, artifacts'
    },
    outputSchema: { type: 'object', required: ['structuredDisclosure', 'artifacts'], properties: { structuredDisclosure: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'patent']
}));

export const patentabilityAssessmentTask = defineTask('patentability-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess patentability',
  agent: {
    name: 'ip-specialist',
    prompt: {
      role: 'Patent Examiner',
      task: 'Assess invention patentability',
      context: args,
      instructions: ['Conduct prior art search', 'Evaluate novelty', 'Assess non-obviousness', 'Check subject matter eligibility', 'Score patentability'],
      outputFormat: 'JSON with score, recommendation, priorArtFound, artifacts'
    },
    outputSchema: { type: 'object', required: ['score', 'recommendation', 'artifacts'], properties: { score: { type: 'number' }, recommendation: { type: 'string' }, priorArtFound: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'patent']
}));

export const claimsDraftingTask = defineTask('claims-drafting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Draft patent claims',
  agent: {
    name: 'ip-specialist',
    prompt: {
      role: 'Patent Drafter',
      task: 'Draft patent claims',
      context: args,
      instructions: ['Draft independent claims', 'Draft dependent claims', 'Ensure claim scope', 'Follow patent claim format'],
      outputFormat: 'JSON with claims array, artifacts'
    },
    outputSchema: { type: 'object', required: ['claims', 'artifacts'], properties: { claims: { type: 'array', items: { type: 'object' } }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'patent']
}));

export const specificationDraftingTask = defineTask('specification-drafting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Draft patent specification',
  agent: {
    name: 'ip-specialist',
    prompt: {
      role: 'Patent Drafter',
      task: 'Draft patent specification',
      context: args,
      instructions: ['Write background section', 'Write summary section', 'Write detailed description', 'Prepare drawings descriptions', 'Include examples'],
      outputFormat: 'JSON with specification object, artifacts'
    },
    outputSchema: { type: 'object', required: ['specification', 'artifacts'], properties: { specification: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'patent']
}));

export const applicationAssemblyTask = defineTask('application-assembly', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assemble patent application',
  agent: {
    name: 'ip-specialist',
    prompt: {
      role: 'Patent Application Specialist',
      task: 'Assemble complete patent application',
      context: args,
      instructions: ['Assemble all components', 'Prepare filing documents', 'Complete forms', 'Verify requirements'],
      outputFormat: 'JSON with applicationPath, artifacts'
    },
    outputSchema: { type: 'object', required: ['applicationPath', 'artifacts'], properties: { applicationPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'patent']
}));

export const patentFilingTask = defineTask('patent-filing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'File patent application',
  agent: {
    name: 'ip-specialist',
    prompt: {
      role: 'Patent Filing Specialist',
      task: 'File patent application',
      context: args,
      instructions: ['Submit application', 'Pay filing fees', 'Confirm receipt', 'Record filing details'],
      outputFormat: 'JSON with applicationId, filingDate, artifacts'
    },
    outputSchema: { type: 'object', required: ['applicationId', 'filingDate', 'artifacts'], properties: { applicationId: { type: 'string' }, filingDate: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'patent']
}));

export const prosecutionTrackingTask = defineTask('prosecution-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Track prosecution status',
  agent: {
    name: 'ip-specialist',
    prompt: {
      role: 'Prosecution Manager',
      task: 'Track patent prosecution status',
      context: args,
      instructions: ['Check application status', 'Monitor office actions', 'Track deadlines', 'Document prosecution history'],
      outputFormat: 'JSON with status object, artifacts'
    },
    outputSchema: { type: 'object', required: ['status', 'artifacts'], properties: { status: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'patent']
}));
