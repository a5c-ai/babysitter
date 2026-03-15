/**
 * @process specializations/domains/business/legal/contract-lifecycle-management
 * @description Contract Lifecycle Management (CLM) Implementation - End-to-end CLM system covering request intake,
 * authoring, negotiation, execution, obligation management, and renewal tracking.
 * @inputs { contractId?: string, stage?: string, action?: string, requestDetails?: object, outputDir?: string }
 * @outputs { success: boolean, contractStatus: object, nextSteps: array, obligations: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/legal/contract-lifecycle-management', {
 *   contractId: 'CTR-2024-001',
 *   stage: 'negotiation',
 *   action: 'advance',
 *   requestDetails: {
 *     requester: 'John Smith',
 *     department: 'Sales',
 *     contractType: 'master-services-agreement',
 *     counterparty: 'Acme Corp',
 *     value: 500000
 *   },
 *   outputDir: 'clm-output'
 * });
 *
 * @references
 * - Icertis CLM: https://www.icertis.com/
 * - DocuSign CLM: https://www.docusign.com/products/clm
 * - WorldCC Contract Management: https://www.worldcc.com/
 * - NCMA Contract Management Body of Knowledge: https://www.ncmahq.org/education-certification/cmbok
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    contractId = null,
    stage = 'intake', // 'intake', 'authoring', 'review', 'negotiation', 'approval', 'execution', 'active', 'renewal', 'closeout'
    action = 'process', // 'process', 'advance', 'review', 'approve', 'reject', 'hold'
    requestDetails = {},
    workflowConfig = {},
    outputDir = 'clm-output',
    trackObligations = true,
    enableReminders = true,
    integrateSystems = []
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let contractStatus = {};
  let obligations = [];

  const actualContractId = contractId || `CTR-${Date.now()}`;

  ctx.log('info', `Starting CLM Process for ${actualContractId}`);
  ctx.log('info', `Stage: ${stage}, Action: ${action}`);

  // ============================================================================
  // STAGE ROUTING
  // ============================================================================

  switch (stage) {
    case 'intake':
      return await processIntake(ctx, actualContractId, requestDetails, workflowConfig, outputDir, artifacts);

    case 'authoring':
      return await processAuthoring(ctx, actualContractId, requestDetails, outputDir, artifacts);

    case 'review':
      return await processReview(ctx, actualContractId, action, outputDir, artifacts);

    case 'negotiation':
      return await processNegotiation(ctx, actualContractId, action, requestDetails, outputDir, artifacts);

    case 'approval':
      return await processApproval(ctx, actualContractId, action, requestDetails, outputDir, artifacts);

    case 'execution':
      return await processExecution(ctx, actualContractId, requestDetails, outputDir, artifacts);

    case 'active':
      return await processActive(ctx, actualContractId, trackObligations, enableReminders, outputDir, artifacts);

    case 'renewal':
      return await processRenewal(ctx, actualContractId, requestDetails, outputDir, artifacts);

    case 'closeout':
      return await processCloseout(ctx, actualContractId, requestDetails, outputDir, artifacts);

    default:
      return {
        success: false,
        error: `Unknown stage: ${stage}`,
        validStages: ['intake', 'authoring', 'review', 'negotiation', 'approval', 'execution', 'active', 'renewal', 'closeout']
      };
  }
}

// ============================================================================
// STAGE PROCESSORS
// ============================================================================

async function processIntake(ctx, contractId, requestDetails, workflowConfig, outputDir, artifacts) {
  ctx.log('info', 'Processing Contract Intake');

  // Phase 1: Request Validation
  const validation = await ctx.task(intakeValidationTask, {
    contractId,
    requestDetails,
    outputDir
  });

  artifacts.push(...validation.artifacts);

  if (!validation.isValid) {
    return {
      success: false,
      contractId,
      stage: 'intake',
      error: 'Request validation failed',
      validationErrors: validation.errors,
      artifacts
    };
  }

  // Phase 2: Risk Classification
  const riskClassification = await ctx.task(riskClassificationTask, {
    contractId,
    requestDetails,
    outputDir
  });

  artifacts.push(...riskClassification.artifacts);

  // Phase 3: Workflow Assignment
  const workflowAssignment = await ctx.task(workflowAssignmentTask, {
    contractId,
    requestDetails,
    riskLevel: riskClassification.riskLevel,
    workflowConfig,
    outputDir
  });

  artifacts.push(...workflowAssignment.artifacts);

  // Breakpoint: Intake Review
  await ctx.breakpoint({
    question: `Contract request ${contractId} validated. Risk Level: ${riskClassification.riskLevel}. Assigned workflow: ${workflowAssignment.workflowName}. Approve intake and proceed to authoring?`,
    title: 'Contract Intake Review',
    context: {
      runId: ctx.runId,
      contractId,
      requestDetails,
      riskLevel: riskClassification.riskLevel,
      workflow: workflowAssignment.workflowName,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  return {
    success: true,
    contractId,
    stage: 'intake',
    nextStage: 'authoring',
    contractStatus: {
      stage: 'intake-complete',
      riskLevel: riskClassification.riskLevel,
      workflow: workflowAssignment.workflowName,
      assignedTo: workflowAssignment.assignedTo
    },
    nextSteps: ['Proceed to contract authoring', 'Select appropriate template', 'Draft initial contract'],
    artifacts,
    metadata: {
      processId: 'specializations/domains/business/legal/contract-lifecycle-management',
      timestamp: ctx.now()
    }
  };
}

async function processAuthoring(ctx, contractId, requestDetails, outputDir, artifacts) {
  ctx.log('info', 'Processing Contract Authoring');

  // Phase 1: Template Selection
  const templateSelection = await ctx.task(templateSelectionTask, {
    contractId,
    contractType: requestDetails.contractType,
    jurisdiction: requestDetails.jurisdiction,
    outputDir
  });

  artifacts.push(...templateSelection.artifacts);

  // Phase 2: Draft Generation
  const draftGeneration = await ctx.task(draftGenerationCLMTask, {
    contractId,
    templateId: templateSelection.selectedTemplate,
    requestDetails,
    outputDir
  });

  artifacts.push(...draftGeneration.artifacts);

  // Phase 3: Initial Quality Check
  const qualityCheck = await ctx.task(authoringQualityCheckTask, {
    contractId,
    draftPath: draftGeneration.draftPath,
    outputDir
  });

  artifacts.push(...qualityCheck.artifacts);

  await ctx.breakpoint({
    question: `Contract ${contractId} draft created. Quality Score: ${qualityCheck.score}/100. Review draft and proceed to review stage?`,
    title: 'Contract Authoring Review',
    context: {
      runId: ctx.runId,
      contractId,
      draftPath: draftGeneration.draftPath,
      qualityScore: qualityCheck.score,
      files: [{ path: draftGeneration.draftPath, format: 'docx', label: 'Contract Draft' }]
    }
  });

  return {
    success: true,
    contractId,
    stage: 'authoring',
    nextStage: 'review',
    contractStatus: {
      stage: 'authoring-complete',
      draftPath: draftGeneration.draftPath,
      qualityScore: qualityCheck.score
    },
    nextSteps: ['Submit for internal review', 'Address quality issues if any'],
    artifacts
  };
}

async function processReview(ctx, contractId, action, outputDir, artifacts) {
  ctx.log('info', 'Processing Contract Review');

  const internalReview = await ctx.task(internalReviewTask, {
    contractId,
    action,
    outputDir
  });

  artifacts.push(...internalReview.artifacts);

  await ctx.breakpoint({
    question: `Internal review of ${contractId} complete. Status: ${internalReview.status}. ${internalReview.comments.length} comments. Proceed to negotiation?`,
    title: 'Internal Review Complete',
    context: {
      runId: ctx.runId,
      contractId,
      reviewStatus: internalReview.status,
      comments: internalReview.comments,
      files: internalReview.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  return {
    success: true,
    contractId,
    stage: 'review',
    nextStage: 'negotiation',
    contractStatus: {
      stage: 'review-complete',
      reviewStatus: internalReview.status,
      commentsCount: internalReview.comments.length
    },
    nextSteps: ['Send to counterparty', 'Begin negotiation'],
    artifacts
  };
}

async function processNegotiation(ctx, contractId, action, requestDetails, outputDir, artifacts) {
  ctx.log('info', 'Processing Contract Negotiation');

  // Track negotiation round
  const negotiationTracking = await ctx.task(negotiationTrackingTask, {
    contractId,
    action,
    counterpartyChanges: requestDetails.counterpartyChanges || [],
    outputDir
  });

  artifacts.push(...negotiationTracking.artifacts);

  // Analyze counterparty changes
  const changeAnalysis = await ctx.task(negotiationChangeAnalysisTask, {
    contractId,
    changes: negotiationTracking.changes,
    outputDir
  });

  artifacts.push(...changeAnalysis.artifacts);

  await ctx.breakpoint({
    question: `Negotiation round ${negotiationTracking.roundNumber} for ${contractId}. ${changeAnalysis.acceptableChanges} acceptable, ${changeAnalysis.needsEscalation} need escalation. Respond or escalate?`,
    title: 'Negotiation Round Review',
    context: {
      runId: ctx.runId,
      contractId,
      roundNumber: negotiationTracking.roundNumber,
      analysis: changeAnalysis,
      files: artifacts.slice(-2).map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  return {
    success: true,
    contractId,
    stage: 'negotiation',
    nextStage: action === 'finalize' ? 'approval' : 'negotiation',
    contractStatus: {
      stage: 'negotiation-in-progress',
      roundNumber: negotiationTracking.roundNumber,
      changesAnalyzed: changeAnalysis.totalChanges
    },
    nextSteps: action === 'finalize' ? ['Submit for approval'] : ['Continue negotiation', 'Review counterparty response'],
    artifacts
  };
}

async function processApproval(ctx, contractId, action, requestDetails, outputDir, artifacts) {
  ctx.log('info', 'Processing Contract Approval');

  // Determine approval chain
  const approvalChain = await ctx.task(approvalChainTask, {
    contractId,
    contractValue: requestDetails.value,
    riskLevel: requestDetails.riskLevel,
    outputDir
  });

  artifacts.push(...approvalChain.artifacts);

  // Collect approvals
  const approvalCollection = await ctx.task(approvalCollectionTask, {
    contractId,
    approvers: approvalChain.approvers,
    action,
    outputDir
  });

  artifacts.push(...approvalCollection.artifacts);

  const allApproved = approvalCollection.approvals.every(a => a.status === 'approved');

  await ctx.breakpoint({
    question: `Approval status for ${contractId}: ${approvalCollection.approvedCount}/${approvalCollection.totalApprovers} approved. ${allApproved ? 'Ready for execution.' : 'Pending approvals remain.'}`,
    title: 'Contract Approval Status',
    context: {
      runId: ctx.runId,
      contractId,
      approvals: approvalCollection.approvals,
      allApproved,
      files: artifacts.slice(-2).map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  return {
    success: true,
    contractId,
    stage: 'approval',
    nextStage: allApproved ? 'execution' : 'approval',
    contractStatus: {
      stage: allApproved ? 'approval-complete' : 'approval-pending',
      approvedCount: approvalCollection.approvedCount,
      totalApprovers: approvalCollection.totalApprovers
    },
    nextSteps: allApproved ? ['Proceed to execution'] : ['Follow up on pending approvals'],
    artifacts
  };
}

async function processExecution(ctx, contractId, requestDetails, outputDir, artifacts) {
  ctx.log('info', 'Processing Contract Execution');

  // Prepare for signature
  const signaturePrep = await ctx.task(signaturePreparationTask, {
    contractId,
    signatories: requestDetails.signatories || [],
    outputDir
  });

  artifacts.push(...signaturePrep.artifacts);

  // Track signature status
  const signatureTracking = await ctx.task(signatureTrackingTask, {
    contractId,
    envelopeId: signaturePrep.envelopeId,
    outputDir
  });

  artifacts.push(...signatureTracking.artifacts);

  const fullyExecuted = signatureTracking.allSigned;

  await ctx.breakpoint({
    question: `Execution status for ${contractId}: ${signatureTracking.signedCount}/${signatureTracking.totalSignatories} signed. ${fullyExecuted ? 'Contract fully executed!' : 'Awaiting signatures.'}`,
    title: 'Contract Execution Status',
    context: {
      runId: ctx.runId,
      contractId,
      signatureStatus: signatureTracking,
      fullyExecuted,
      files: fullyExecuted ? [{ path: signatureTracking.executedContractPath, format: 'pdf', label: 'Executed Contract' }] : []
    }
  });

  return {
    success: true,
    contractId,
    stage: 'execution',
    nextStage: fullyExecuted ? 'active' : 'execution',
    contractStatus: {
      stage: fullyExecuted ? 'executed' : 'pending-signatures',
      signedCount: signatureTracking.signedCount,
      executedContractPath: signatureTracking.executedContractPath
    },
    nextSteps: fullyExecuted ? ['Activate contract', 'Extract obligations'] : ['Follow up on pending signatures'],
    artifacts
  };
}

async function processActive(ctx, contractId, trackObligations, enableReminders, outputDir, artifacts) {
  ctx.log('info', 'Processing Active Contract Management');

  // Extract obligations
  const obligationExtraction = await ctx.task(obligationExtractionTask, {
    contractId,
    trackObligations,
    outputDir
  });

  artifacts.push(...obligationExtraction.artifacts);

  // Set up monitoring
  const monitoringSetup = await ctx.task(contractMonitoringTask, {
    contractId,
    obligations: obligationExtraction.obligations,
    enableReminders,
    outputDir
  });

  artifacts.push(...monitoringSetup.artifacts);

  return {
    success: true,
    contractId,
    stage: 'active',
    contractStatus: {
      stage: 'active',
      obligationsCount: obligationExtraction.obligations.length,
      nextMilestone: monitoringSetup.nextMilestone
    },
    obligations: obligationExtraction.obligations,
    nextSteps: ['Monitor obligation compliance', 'Track key dates'],
    artifacts
  };
}

async function processRenewal(ctx, contractId, requestDetails, outputDir, artifacts) {
  ctx.log('info', 'Processing Contract Renewal');

  const renewalAnalysis = await ctx.task(renewalAnalysisTask, {
    contractId,
    currentTerms: requestDetails.currentTerms,
    outputDir
  });

  artifacts.push(...renewalAnalysis.artifacts);

  await ctx.breakpoint({
    question: `Renewal analysis for ${contractId}. Recommendation: ${renewalAnalysis.recommendation}. Proceed with ${renewalAnalysis.recommendation}?`,
    title: 'Contract Renewal Decision',
    context: {
      runId: ctx.runId,
      contractId,
      analysis: renewalAnalysis,
      files: renewalAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  return {
    success: true,
    contractId,
    stage: 'renewal',
    nextStage: renewalAnalysis.recommendation === 'renew' ? 'negotiation' : 'closeout',
    contractStatus: {
      stage: 'renewal-pending',
      recommendation: renewalAnalysis.recommendation
    },
    nextSteps: renewalAnalysis.recommendation === 'renew' ? ['Negotiate renewal terms'] : ['Begin closeout process'],
    artifacts
  };
}

async function processCloseout(ctx, contractId, requestDetails, outputDir, artifacts) {
  ctx.log('info', 'Processing Contract Closeout');

  const closeoutChecklist = await ctx.task(closeoutChecklistTask, {
    contractId,
    reason: requestDetails.closeoutReason || 'term-expiration',
    outputDir
  });

  artifacts.push(...closeoutChecklist.artifacts);

  await ctx.breakpoint({
    question: `Closeout checklist for ${contractId}. ${closeoutChecklist.completedItems}/${closeoutChecklist.totalItems} items complete. Finalize closeout?`,
    title: 'Contract Closeout Review',
    context: {
      runId: ctx.runId,
      contractId,
      checklist: closeoutChecklist,
      files: closeoutChecklist.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  return {
    success: true,
    contractId,
    stage: 'closeout',
    nextStage: null,
    contractStatus: {
      stage: 'closed',
      closeoutDate: ctx.now(),
      reason: requestDetails.closeoutReason
    },
    nextSteps: ['Archive contract', 'Update records'],
    artifacts
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const intakeValidationTask = defineTask('intake-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate contract request',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Contract Intake Specialist',
      task: 'Validate contract request for completeness and accuracy',
      context: args,
      instructions: [
        'Verify all required fields are provided',
        'Validate requester authorization',
        'Check contract type validity',
        'Verify counterparty information',
        'Validate business justification',
        'Check budget authorization',
        'Verify compliance requirements',
        'Document validation results'
      ],
      outputFormat: 'JSON with isValid, errors array, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['isValid', 'artifacts'],
      properties: {
        isValid: { type: 'boolean' },
        errors: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'clm', 'intake']
}));

export const riskClassificationTask = defineTask('risk-classification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Classify contract risk',
  agent: {
    name: 'legal-risk-analyst',
    prompt: {
      role: 'Contract Risk Classifier',
      task: 'Classify contract risk level based on type, value, and complexity',
      context: args,
      instructions: [
        'Assess contract value risk',
        'Evaluate contract type complexity',
        'Consider counterparty risk',
        'Assess regulatory risk',
        'Evaluate strategic importance',
        'Calculate overall risk level',
        'Determine required approvals based on risk'
      ],
      outputFormat: 'JSON with riskLevel, riskFactors, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['riskLevel', 'artifacts'],
      properties: {
        riskLevel: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
        riskFactors: { type: 'array', items: { type: 'object' } },
        requiredApprovals: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'clm', 'risk']
}));

export const workflowAssignmentTask = defineTask('workflow-assignment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assign contract workflow',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Workflow Assignment Specialist',
      task: 'Assign appropriate workflow and resources to contract',
      context: args,
      instructions: [
        'Select workflow based on contract type and risk',
        'Assign contract owner',
        'Assign legal reviewer',
        'Set SLA timelines',
        'Configure approval chain',
        'Set up notifications'
      ],
      outputFormat: 'JSON with workflowName, assignedTo, approvalChain, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['workflowName', 'assignedTo', 'artifacts'],
      properties: {
        workflowName: { type: 'string' },
        assignedTo: { type: 'string' },
        approvalChain: { type: 'array', items: { type: 'string' } },
        slaDeadline: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'clm', 'workflow']
}));

export const templateSelectionTask = defineTask('template-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select contract template',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Template Selection Specialist',
      task: 'Select most appropriate contract template',
      context: args,
      instructions: [
        'Review available templates for contract type',
        'Consider jurisdiction requirements',
        'Evaluate template versions',
        'Select most current approved template',
        'Note any required customizations'
      ],
      outputFormat: 'JSON with selectedTemplate, templateVersion, customizations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedTemplate', 'artifacts'],
      properties: {
        selectedTemplate: { type: 'string' },
        templateVersion: { type: 'string' },
        customizations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'clm', 'template']
}));

export const draftGenerationCLMTask = defineTask('draft-generation-clm', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate contract draft',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Contract Drafter',
      task: 'Generate contract draft from template',
      context: args,
      instructions: [
        'Load selected template',
        'Populate party information',
        'Insert business terms',
        'Customize clauses as needed',
        'Generate draft document',
        'Save to contract repository'
      ],
      outputFormat: 'JSON with draftPath, version, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['draftPath', 'artifacts'],
      properties: {
        draftPath: { type: 'string' },
        version: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'clm', 'drafting']
}));

export const authoringQualityCheckTask = defineTask('authoring-quality-check', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Check draft quality',
  agent: {
    name: 'legal-qa-specialist',
    prompt: {
      role: 'Quality Checker',
      task: 'Perform quality check on contract draft',
      context: args,
      instructions: [
        'Check document formatting',
        'Verify all variables populated',
        'Check cross-references',
        'Validate clause consistency',
        'Calculate quality score'
      ],
      outputFormat: 'JSON with score, issues, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'artifacts'],
      properties: {
        score: { type: 'number' },
        issues: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'clm', 'quality']
}));

export const internalReviewTask = defineTask('internal-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct internal review',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Internal Reviewer',
      task: 'Conduct internal legal review of contract',
      context: args,
      instructions: [
        'Review contract terms',
        'Check compliance with policies',
        'Identify risk issues',
        'Document review comments',
        'Provide review recommendation'
      ],
      outputFormat: 'JSON with status, comments, recommendation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'comments', 'artifacts'],
      properties: {
        status: { type: 'string', enum: ['approved', 'changes-requested', 'rejected'] },
        comments: { type: 'array', items: { type: 'object' } },
        recommendation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'clm', 'review']
}));

export const negotiationTrackingTask = defineTask('negotiation-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Track negotiation round',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Negotiation Tracker',
      task: 'Track negotiation round and changes',
      context: args,
      instructions: [
        'Log negotiation round',
        'Document counterparty changes',
        'Track positions on key terms',
        'Update negotiation history',
        'Identify outstanding issues'
      ],
      outputFormat: 'JSON with roundNumber, changes, outstandingIssues, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['roundNumber', 'changes', 'artifacts'],
      properties: {
        roundNumber: { type: 'number' },
        changes: { type: 'array', items: { type: 'object' } },
        outstandingIssues: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'clm', 'negotiation']
}));

export const negotiationChangeAnalysisTask = defineTask('negotiation-change-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze negotiation changes',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Negotiation Analyst',
      task: 'Analyze counterparty changes against playbook',
      context: args,
      instructions: [
        'Analyze each change',
        'Compare to playbook positions',
        'Classify changes as acceptable or not',
        'Identify changes needing escalation',
        'Recommend responses'
      ],
      outputFormat: 'JSON with totalChanges, acceptableChanges, needsEscalation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalChanges', 'acceptableChanges', 'needsEscalation', 'artifacts'],
      properties: {
        totalChanges: { type: 'number' },
        acceptableChanges: { type: 'number' },
        needsEscalation: { type: 'number' },
        changeDetails: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'clm', 'negotiation']
}));

export const approvalChainTask = defineTask('approval-chain', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Determine approval chain',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Approval Workflow Specialist',
      task: 'Determine required approval chain',
      context: args,
      instructions: [
        'Determine required approvers based on value',
        'Add approvers based on risk level',
        'Include department approvers',
        'Set approval sequence',
        'Configure escalation paths'
      ],
      outputFormat: 'JSON with approvers array, sequence, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['approvers', 'artifacts'],
      properties: {
        approvers: { type: 'array', items: { type: 'object' } },
        sequence: { type: 'string' },
        escalationPath: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'clm', 'approval']
}));

export const approvalCollectionTask = defineTask('approval-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Collect approvals',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Approval Collector',
      task: 'Collect and track approvals',
      context: args,
      instructions: [
        'Send approval requests',
        'Track approval status',
        'Collect approval decisions',
        'Document approval comments',
        'Update approval record'
      ],
      outputFormat: 'JSON with approvals array, approvedCount, totalApprovers, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['approvals', 'approvedCount', 'totalApprovers', 'artifacts'],
      properties: {
        approvals: { type: 'array', items: { type: 'object' } },
        approvedCount: { type: 'number' },
        totalApprovers: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'clm', 'approval']
}));

export const signaturePreparationTask = defineTask('signature-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare for signature',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Execution Specialist',
      task: 'Prepare contract for signature',
      context: args,
      instructions: [
        'Finalize contract document',
        'Configure signature workflow',
        'Set up signature fields',
        'Send for signature',
        'Track envelope status'
      ],
      outputFormat: 'JSON with envelopeId, signatories, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['envelopeId', 'artifacts'],
      properties: {
        envelopeId: { type: 'string' },
        signatories: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'clm', 'execution']
}));

export const signatureTrackingTask = defineTask('signature-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Track signatures',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Signature Tracker',
      task: 'Track signature collection status',
      context: args,
      instructions: [
        'Check signature status',
        'Track who has signed',
        'Send reminders if needed',
        'Collect executed document',
        'Update contract status'
      ],
      outputFormat: 'JSON with allSigned, signedCount, totalSignatories, executedContractPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['allSigned', 'signedCount', 'totalSignatories', 'artifacts'],
      properties: {
        allSigned: { type: 'boolean' },
        signedCount: { type: 'number' },
        totalSignatories: { type: 'number' },
        executedContractPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'clm', 'execution']
}));

export const obligationExtractionTask = defineTask('obligation-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Extract obligations',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Obligation Extraction Specialist',
      task: 'Extract contractual obligations',
      context: args,
      instructions: [
        'Parse executed contract',
        'Identify all obligations',
        'Categorize obligations by party',
        'Extract key dates and deadlines',
        'Document delivery requirements',
        'Identify payment obligations'
      ],
      outputFormat: 'JSON with obligations array, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['obligations', 'artifacts'],
      properties: {
        obligations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              party: { type: 'string' },
              description: { type: 'string' },
              dueDate: { type: 'string' },
              recurring: { type: 'boolean' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'clm', 'obligations']
}));

export const contractMonitoringTask = defineTask('contract-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up contract monitoring',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Contract Monitoring Specialist',
      task: 'Configure contract monitoring and reminders',
      context: args,
      instructions: [
        'Configure obligation tracking',
        'Set up deadline reminders',
        'Configure renewal alerts',
        'Set up compliance monitoring',
        'Document monitoring schedule'
      ],
      outputFormat: 'JSON with monitoringConfig, nextMilestone, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['monitoringConfig', 'artifacts'],
      properties: {
        monitoringConfig: { type: 'object' },
        nextMilestone: { type: 'string' },
        remindersSet: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'clm', 'monitoring']
}));

export const renewalAnalysisTask = defineTask('renewal-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze renewal options',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Renewal Analyst',
      task: 'Analyze contract renewal options',
      context: args,
      instructions: [
        'Review current contract performance',
        'Assess renewal terms',
        'Compare to market rates',
        'Evaluate relationship value',
        'Recommend renewal decision'
      ],
      outputFormat: 'JSON with recommendation, analysis, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendation', 'artifacts'],
      properties: {
        recommendation: { type: 'string', enum: ['renew', 'renegotiate', 'terminate'] },
        analysis: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'clm', 'renewal']
}));

export const closeoutChecklistTask = defineTask('closeout-checklist', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Process closeout checklist',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Closeout Specialist',
      task: 'Process contract closeout checklist',
      context: args,
      instructions: [
        'Verify all obligations fulfilled',
        'Confirm final payments made',
        'Check IP return requirements',
        'Verify confidentiality wind-down',
        'Document closeout completion',
        'Archive contract documents'
      ],
      outputFormat: 'JSON with completedItems, totalItems, checklist, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['completedItems', 'totalItems', 'artifacts'],
      properties: {
        completedItems: { type: 'number' },
        totalItems: { type: 'number' },
        checklist: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'clm', 'closeout']
}));
