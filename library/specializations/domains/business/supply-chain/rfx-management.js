/**
 * @process specializations/domains/business/supply-chain/rfx-management
 * @description RFx Process Management - Manage Request for Information (RFI), Request for Proposal (RFP),
 * and Request for Quotation (RFQ) processes including document creation, distribution, response evaluation, and award recommendation.
 * @inputs { rfxType?: string, category?: string, scope?: object, suppliers?: array, timeline?: object }
 * @outputs { success: boolean, rfxPackage: object, responses: array, evaluation: object, recommendation: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/supply-chain/rfx-management', {
 *   rfxType: 'RFP',
 *   category: 'IT Services',
 *   scope: { services: ['cloud hosting', 'support'], duration: '3-years' },
 *   suppliers: ['AWS', 'Azure', 'GCP'],
 *   timeline: { issueDate: '2024-01-15', responseDeadline: '2024-02-15' }
 * });
 *
 * @references
 * - Ariba RFx Best Practices: https://www.ariba.com/
 * - Coupa Source-to-Contract: https://www.coupa.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    rfxType = 'RFP',
    category = '',
    scope = {},
    suppliers = [],
    timeline = {},
    evaluationCriteria = {},
    stakeholders = [],
    outputDir = 'rfx-management-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting RFx Process Management for: ${rfxType} - ${category}`);

  // ============================================================================
  // PHASE 1: REQUIREMENTS GATHERING
  // ============================================================================

  ctx.log('info', 'Phase 1: Gathering requirements');

  const requirementsGathering = await ctx.task(requirementsGatheringTask, {
    rfxType,
    category,
    scope,
    stakeholders,
    outputDir
  });

  artifacts.push(...requirementsGathering.artifacts);

  // ============================================================================
  // PHASE 2: RFx DOCUMENT CREATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Creating RFx documents');

  const documentCreation = await ctx.task(rfxDocumentCreationTask, {
    rfxType,
    category,
    requirementsGathering,
    evaluationCriteria,
    timeline,
    outputDir
  });

  artifacts.push(...documentCreation.artifacts);

  // ============================================================================
  // PHASE 3: SUPPLIER LIST FINALIZATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Finalizing supplier list');

  const supplierListFinalization = await ctx.task(supplierListFinalizationTask, {
    category,
    suppliers,
    requirementsGathering,
    outputDir
  });

  artifacts.push(...supplierListFinalization.artifacts);

  // Breakpoint: Review RFx package before distribution
  await ctx.breakpoint({
    question: `RFx package ready for ${category}. ${supplierListFinalization.approvedSuppliers.length} suppliers to invite. Review and approve for distribution?`,
    title: 'RFx Package Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json' })),
      summary: {
        rfxType,
        category,
        supplierCount: supplierListFinalization.approvedSuppliers.length,
        responseDeadline: timeline.responseDeadline
      }
    }
  });

  // ============================================================================
  // PHASE 4: RFx DISTRIBUTION
  // ============================================================================

  ctx.log('info', 'Phase 4: Distributing RFx to suppliers');

  const rfxDistribution = await ctx.task(rfxDistributionTask, {
    rfxType,
    documentCreation,
    supplierListFinalization,
    timeline,
    outputDir
  });

  artifacts.push(...rfxDistribution.artifacts);

  // ============================================================================
  // PHASE 5: Q&A MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Managing supplier questions');

  const qaManagement = await ctx.task(qaManagementTask, {
    rfxType,
    supplierListFinalization,
    documentCreation,
    outputDir
  });

  artifacts.push(...qaManagement.artifacts);

  // ============================================================================
  // PHASE 6: RESPONSE COLLECTION
  // ============================================================================

  ctx.log('info', 'Phase 6: Collecting supplier responses');

  const responseCollection = await ctx.task(responseCollectionTask, {
    rfxType,
    supplierListFinalization,
    timeline,
    outputDir
  });

  artifacts.push(...responseCollection.artifacts);

  // ============================================================================
  // PHASE 7: RESPONSE EVALUATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Evaluating supplier responses');

  const responseEvaluation = await ctx.task(responseEvaluationTask, {
    rfxType,
    responseCollection,
    evaluationCriteria,
    documentCreation,
    outputDir
  });

  artifacts.push(...responseEvaluation.artifacts);

  // ============================================================================
  // PHASE 8: AWARD RECOMMENDATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Developing award recommendation');

  const awardRecommendation = await ctx.task(rfxAwardRecommendationTask, {
    rfxType,
    responseEvaluation,
    evaluationCriteria,
    outputDir
  });

  artifacts.push(...awardRecommendation.artifacts);

  // Breakpoint: Review award recommendation
  await ctx.breakpoint({
    question: `Evaluation complete. Recommended supplier: ${awardRecommendation.recommendedSupplier}. Score: ${awardRecommendation.winningScore}/100. Review and approve award?`,
    title: 'Award Recommendation Review',
    context: {
      runId: ctx.runId,
      files: awardRecommendation.artifacts.map(a => ({ path: a.path, format: a.format || 'json' })),
      summary: {
        recommendedSupplier: awardRecommendation.recommendedSupplier,
        winningScore: awardRecommendation.winningScore,
        runnerUp: awardRecommendation.runnerUp
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    rfxPackage: {
      rfxType,
      category,
      rfxId: documentCreation.rfxId,
      scope: requirementsGathering.finalScope,
      documents: documentCreation.documents
    },
    responses: {
      invited: supplierListFinalization.approvedSuppliers.length,
      received: responseCollection.responsesReceived,
      compliant: responseCollection.compliantResponses
    },
    evaluation: {
      scores: responseEvaluation.scores,
      rankings: responseEvaluation.rankings,
      methodology: responseEvaluation.methodology
    },
    recommendation: {
      recommendedSupplier: awardRecommendation.recommendedSupplier,
      winningScore: awardRecommendation.winningScore,
      rationale: awardRecommendation.rationale
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/business/supply-chain/rfx-management',
      timestamp: startTime,
      rfxType,
      category,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const requirementsGatheringTask = defineTask('requirements-gathering', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Requirements Gathering',
  agent: {
    name: 'requirements-analyst',
    prompt: {
      role: 'Procurement Requirements Analyst',
      task: 'Gather and document requirements for RFx',
      context: args,
      instructions: [
        '1. Conduct stakeholder interviews',
        '2. Document functional requirements',
        '3. Document technical specifications',
        '4. Identify mandatory vs. nice-to-have requirements',
        '5. Define service level requirements',
        '6. Document compliance requirements',
        '7. Estimate volumes and quantities',
        '8. Create requirements specification document'
      ],
      outputFormat: 'JSON with requirements documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['finalScope', 'requirements', 'artifacts'],
      properties: {
        finalScope: { type: 'object' },
        requirements: { type: 'object' },
        specifications: { type: 'array' },
        serviceLevels: { type: 'array' },
        complianceRequirements: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'rfx', 'requirements']
}));

export const rfxDocumentCreationTask = defineTask('rfx-document-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: RFx Document Creation',
  agent: {
    name: 'rfx-developer',
    prompt: {
      role: 'RFx Document Specialist',
      task: 'Create comprehensive RFx document package',
      context: args,
      instructions: [
        '1. Create RFx cover letter and instructions',
        '2. Develop scope of work/services',
        '3. Create pricing templates',
        '4. Define evaluation criteria and weights',
        '5. Include terms and conditions',
        '6. Create supplier questionnaire',
        '7. Develop response templates',
        '8. Compile complete RFx package'
      ],
      outputFormat: 'JSON with RFx document package'
    },
    outputSchema: {
      type: 'object',
      required: ['rfxId', 'documents', 'artifacts'],
      properties: {
        rfxId: { type: 'string' },
        documents: { type: 'array' },
        pricingTemplate: { type: 'object' },
        evaluationCriteria: { type: 'object' },
        termsAndConditions: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'rfx', 'document-creation']
}));

export const supplierListFinalizationTask = defineTask('supplier-list-finalization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Supplier List Finalization',
  agent: {
    name: 'supplier-selector',
    prompt: {
      role: 'Supplier Selection Specialist',
      task: 'Finalize list of suppliers to invite to RFx',
      context: args,
      instructions: [
        '1. Review suggested supplier list',
        '2. Screen suppliers for basic qualifications',
        '3. Check supplier compliance status',
        '4. Verify supplier capabilities',
        '5. Add potential new suppliers',
        '6. Remove disqualified suppliers',
        '7. Ensure competitive supplier pool',
        '8. Finalize and approve supplier list'
      ],
      outputFormat: 'JSON with finalized supplier list'
    },
    outputSchema: {
      type: 'object',
      required: ['approvedSuppliers', 'artifacts'],
      properties: {
        approvedSuppliers: { type: 'array' },
        disqualifiedSuppliers: { type: 'array' },
        newSuppliers: { type: 'array' },
        qualificationStatus: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'rfx', 'supplier-selection']
}));

export const rfxDistributionTask = defineTask('rfx-distribution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: RFx Distribution',
  agent: {
    name: 'rfx-distributor',
    prompt: {
      role: 'RFx Distribution Coordinator',
      task: 'Distribute RFx documents to selected suppliers',
      context: args,
      instructions: [
        '1. Prepare distribution list',
        '2. Set up secure document sharing',
        '3. Send RFx invitation to suppliers',
        '4. Track acknowledgment receipts',
        '5. Handle non-disclosure agreements',
        '6. Confirm supplier participation',
        '7. Set up Q&A submission process',
        '8. Document distribution status'
      ],
      outputFormat: 'JSON with distribution status'
    },
    outputSchema: {
      type: 'object',
      required: ['distributionStatus', 'artifacts'],
      properties: {
        distributionStatus: { type: 'object' },
        acknowledgedSuppliers: { type: 'array' },
        participatingSuppliers: { type: 'array' },
        declinedSuppliers: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'rfx', 'distribution']
}));

export const qaManagementTask = defineTask('qa-management', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Q&A Management',
  agent: {
    name: 'qa-manager',
    prompt: {
      role: 'RFx Q&A Manager',
      task: 'Manage supplier questions and provide clarifications',
      context: args,
      instructions: [
        '1. Collect supplier questions',
        '2. Consolidate similar questions',
        '3. Route questions to subject matter experts',
        '4. Draft responses to questions',
        '5. Review and approve responses',
        '6. Distribute Q&A to all suppliers',
        '7. Issue addenda if needed',
        '8. Document all Q&A exchanges'
      ],
      outputFormat: 'JSON with Q&A documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['questionsReceived', 'responsesIssued', 'artifacts'],
      properties: {
        questionsReceived: { type: 'number' },
        responsesIssued: { type: 'number' },
        qaDocument: { type: 'object' },
        addendaIssued: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'rfx', 'qa-management']
}));

export const responseCollectionTask = defineTask('response-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Response Collection',
  agent: {
    name: 'response-collector',
    prompt: {
      role: 'RFx Response Coordinator',
      task: 'Collect and organize supplier responses',
      context: args,
      instructions: [
        '1. Receive supplier responses by deadline',
        '2. Log response receipt timestamps',
        '3. Check response completeness',
        '4. Verify compliance with requirements',
        '5. Handle late submissions per policy',
        '6. Organize responses for evaluation',
        '7. Maintain confidentiality',
        '8. Document collection summary'
      ],
      outputFormat: 'JSON with response collection summary'
    },
    outputSchema: {
      type: 'object',
      required: ['responsesReceived', 'compliantResponses', 'artifacts'],
      properties: {
        responsesReceived: { type: 'number' },
        compliantResponses: { type: 'number' },
        nonCompliantResponses: { type: 'array' },
        lateSubmissions: { type: 'array' },
        responsesSummary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'rfx', 'response-collection']
}));

export const responseEvaluationTask = defineTask('response-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Response Evaluation',
  agent: {
    name: 'response-evaluator',
    prompt: {
      role: 'RFx Evaluation Lead',
      task: 'Evaluate supplier responses against criteria',
      context: args,
      instructions: [
        '1. Assemble evaluation team',
        '2. Review evaluation criteria and weights',
        '3. Score each response against criteria',
        '4. Normalize scores across evaluators',
        '5. Calculate weighted total scores',
        '6. Rank suppliers by total score',
        '7. Identify clarification needs',
        '8. Document evaluation results'
      ],
      outputFormat: 'JSON with evaluation results'
    },
    outputSchema: {
      type: 'object',
      required: ['scores', 'rankings', 'methodology', 'artifacts'],
      properties: {
        scores: { type: 'object' },
        rankings: { type: 'array' },
        methodology: { type: 'object' },
        clarificationsNeeded: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'rfx', 'evaluation']
}));

export const rfxAwardRecommendationTask = defineTask('rfx-award-recommendation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 8: Award Recommendation',
  agent: {
    name: 'award-analyst',
    prompt: {
      role: 'RFx Award Analyst',
      task: 'Develop award recommendation based on evaluation',
      context: args,
      instructions: [
        '1. Review evaluation rankings',
        '2. Verify winner compliance',
        '3. Document selection rationale',
        '4. Identify negotiation points',
        '5. Prepare award notification draft',
        '6. Prepare debriefing materials',
        '7. Create award recommendation package',
        '8. Submit for approval'
      ],
      outputFormat: 'JSON with award recommendation'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendedSupplier', 'winningScore', 'rationale', 'artifacts'],
      properties: {
        recommendedSupplier: { type: 'string' },
        winningScore: { type: 'number' },
        runnerUp: { type: 'string' },
        rationale: { type: 'string' },
        negotiationPoints: { type: 'array' },
        awardNotificationDraft: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'rfx', 'award-recommendation']
}));
