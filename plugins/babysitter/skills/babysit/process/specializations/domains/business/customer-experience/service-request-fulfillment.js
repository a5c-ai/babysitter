/**
 * @process customer-experience/service-request-fulfillment
 * @description Streamlined process for handling standard service requests with defined fulfillment workflows and automation
 * @inputs { serviceRequest: object, serviceCatalog: object, approvalRules: object, fulfillmentResources: object }
 * @outputs { success: boolean, fulfillmentRecord: object, fulfillmentStatus: object, automationReport: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    serviceRequest = {},
    serviceCatalog = {},
    approvalRules = {},
    fulfillmentResources = {},
    outputDir = 'service-request-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Service Request Fulfillment for request: ${serviceRequest.id || 'new'}`);

  // ============================================================================
  // PHASE 1: REQUEST VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Validating service request');
  const requestValidation = await ctx.task(requestValidationTask, {
    serviceRequest,
    serviceCatalog,
    outputDir
  });

  artifacts.push(...requestValidation.artifacts);

  // ============================================================================
  // PHASE 2: CATALOG MATCHING
  // ============================================================================

  ctx.log('info', 'Phase 2: Matching to service catalog');
  const catalogMatching = await ctx.task(catalogMatchingTask, {
    serviceRequest,
    serviceCatalog,
    requestValidation,
    outputDir
  });

  artifacts.push(...catalogMatching.artifacts);

  // ============================================================================
  // PHASE 3: APPROVAL WORKFLOW
  // ============================================================================

  ctx.log('info', 'Phase 3: Processing approval workflow');
  const approvalWorkflow = await ctx.task(approvalWorkflowTask, {
    serviceRequest,
    catalogMatching,
    approvalRules,
    outputDir
  });

  artifacts.push(...approvalWorkflow.artifacts);

  // ============================================================================
  // PHASE 4: FULFILLMENT PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 4: Planning fulfillment');
  const fulfillmentPlanning = await ctx.task(fulfillmentPlanningTask, {
    serviceRequest,
    catalogMatching,
    approvalWorkflow,
    fulfillmentResources,
    outputDir
  });

  artifacts.push(...fulfillmentPlanning.artifacts);

  // ============================================================================
  // PHASE 5: AUTOMATION ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Assessing automation opportunities');
  const automationAssessment = await ctx.task(automationAssessmentTask, {
    catalogMatching,
    fulfillmentPlanning,
    outputDir
  });

  artifacts.push(...automationAssessment.artifacts);

  // ============================================================================
  // PHASE 6: FULFILLMENT EXECUTION
  // ============================================================================

  ctx.log('info', 'Phase 6: Executing fulfillment');
  const fulfillmentExecution = await ctx.task(fulfillmentExecutionTask, {
    fulfillmentPlanning,
    automationAssessment,
    serviceRequest,
    outputDir
  });

  artifacts.push(...fulfillmentExecution.artifacts);

  // ============================================================================
  // PHASE 7: VERIFICATION AND TESTING
  // ============================================================================

  ctx.log('info', 'Phase 7: Verifying fulfillment');
  const fulfillmentVerification = await ctx.task(fulfillmentVerificationTask, {
    fulfillmentExecution,
    serviceRequest,
    catalogMatching,
    outputDir
  });

  artifacts.push(...fulfillmentVerification.artifacts);

  // ============================================================================
  // PHASE 8: REQUEST CLOSURE
  // ============================================================================

  ctx.log('info', 'Phase 8: Closing service request');
  const requestClosure = await ctx.task(requestClosureTask, {
    serviceRequest,
    fulfillmentExecution,
    fulfillmentVerification,
    outputDir
  });

  artifacts.push(...requestClosure.artifacts);

  const fulfillmentSuccess = requestClosure.status === 'fulfilled';
  const automationUsed = automationAssessment.automationApplied;

  await ctx.breakpoint({
    question: `Service request fulfillment complete for ${serviceRequest.id || 'request'}. Status: ${requestClosure.status}. Automation used: ${automationUsed ? 'Yes' : 'No'}. Verification passed: ${fulfillmentVerification.passed ? 'Yes' : 'No'}. Review and close?`,
    title: 'Service Request Fulfillment Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        requestId: serviceRequest.id,
        catalogItem: catalogMatching.matchedItem,
        approvalStatus: approvalWorkflow.status,
        fulfillmentSuccess,
        automationUsed,
        verificationPassed: fulfillmentVerification.passed,
        fulfillmentTime: requestClosure.fulfillmentTime
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    fulfillmentSuccess,
    fulfillmentRecord: {
      requestId: serviceRequest.id,
      catalogItem: catalogMatching.matchedItem,
      approvalStatus: approvalWorkflow.status,
      fulfillmentMethod: fulfillmentPlanning.method
    },
    fulfillmentStatus: {
      status: requestClosure.status,
      completedSteps: fulfillmentExecution.completedSteps,
      verificationPassed: fulfillmentVerification.passed,
      fulfillmentTime: requestClosure.fulfillmentTime
    },
    automationReport: {
      automationApplied: automationAssessment.automationApplied,
      automatedSteps: automationAssessment.automatedSteps,
      manualSteps: automationAssessment.manualSteps
    },
    closure: {
      status: requestClosure.status,
      customerNotified: requestClosure.customerNotified,
      satisfaction: requestClosure.satisfaction
    },
    artifacts,
    duration,
    metadata: {
      processId: 'customer-experience/service-request-fulfillment',
      timestamp: startTime,
      requestId: serviceRequest.id,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const requestValidationTask = defineTask('request-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate service request',
  agent: {
    name: 'request-validator',
    prompt: {
      role: 'service request specialist',
      task: 'Validate service request completeness and eligibility',
      context: args,
      instructions: [
        'Verify requester identity and authorization',
        'Validate request completeness',
        'Check required fields',
        'Verify service eligibility',
        'Check for duplicate requests',
        'Validate business justification',
        'Verify budget or cost center',
        'Document validation results',
        'Generate validation report'
      ],
      outputFormat: 'JSON with valid, requester, completeness, eligibility, duplicateCheck, justification, validation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['valid', 'validation', 'artifacts'],
      properties: {
        valid: { type: 'boolean' },
        requester: { type: 'object' },
        completeness: { type: 'object' },
        eligibility: { type: 'object' },
        duplicateCheck: { type: 'object' },
        justification: { type: 'object' },
        validation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'service-request', 'validation']
}));

export const catalogMatchingTask = defineTask('catalog-matching', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Match to service catalog',
  agent: {
    name: 'catalog-matcher',
    prompt: {
      role: 'service catalog specialist',
      task: 'Match request to appropriate service catalog item',
      context: args,
      instructions: [
        'Search service catalog for matching item',
        'Identify catalog item details',
        'Retrieve fulfillment workflow',
        'Get SLA targets',
        'Identify required approvals',
        'Get pricing information',
        'Identify dependencies',
        'Document catalog match',
        'Generate matching report'
      ],
      outputFormat: 'JSON with matchedItem, catalogDetails, workflow, slaTargets, approvals, pricing, dependencies, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['matchedItem', 'workflow', 'artifacts'],
      properties: {
        matchedItem: { type: 'object' },
        catalogDetails: { type: 'object' },
        workflow: { type: 'object' },
        slaTargets: { type: 'object' },
        approvals: { type: 'array', items: { type: 'object' } },
        pricing: { type: 'object' },
        dependencies: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'service-request', 'catalog']
}));

export const approvalWorkflowTask = defineTask('approval-workflow', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Process approval workflow',
  agent: {
    name: 'approval-processor',
    prompt: {
      role: 'approval workflow specialist',
      task: 'Process required approvals for service request',
      context: args,
      instructions: [
        'Identify required approvers',
        'Determine approval sequence',
        'Check for pre-approved requests',
        'Route for approval',
        'Track approval status',
        'Handle approval escalation',
        'Document approval decisions',
        'Handle rejections',
        'Generate approval report'
      ],
      outputFormat: 'JSON with status, approvers, sequence, preApproved, decisions, escalations, rejections, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'approvers', 'artifacts'],
      properties: {
        status: { type: 'string', enum: ['approved', 'pending', 'rejected', 'pre-approved'] },
        approvers: { type: 'array', items: { type: 'object' } },
        sequence: { type: 'array', items: { type: 'object' } },
        preApproved: { type: 'boolean' },
        decisions: { type: 'array', items: { type: 'object' } },
        escalations: { type: 'array', items: { type: 'object' } },
        rejections: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'service-request', 'approval']
}));

export const fulfillmentPlanningTask = defineTask('fulfillment-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan fulfillment',
  agent: {
    name: 'fulfillment-planner',
    prompt: {
      role: 'fulfillment planning specialist',
      task: 'Plan service request fulfillment activities',
      context: args,
      instructions: [
        'Define fulfillment method',
        'Identify fulfillment steps',
        'Assign fulfillment resources',
        'Schedule fulfillment activities',
        'Identify prerequisites',
        'Plan communication touchpoints',
        'Define verification criteria',
        'Estimate fulfillment time',
        'Generate fulfillment plan'
      ],
      outputFormat: 'JSON with method, steps, resources, schedule, prerequisites, communication, verification, estimatedTime, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['method', 'steps', 'artifacts'],
      properties: {
        method: { type: 'string' },
        steps: { type: 'array', items: { type: 'object' } },
        resources: { type: 'array', items: { type: 'object' } },
        schedule: { type: 'object' },
        prerequisites: { type: 'array', items: { type: 'object' } },
        communication: { type: 'array', items: { type: 'object' } },
        verification: { type: 'object' },
        estimatedTime: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'service-request', 'planning']
}));

export const automationAssessmentTask = defineTask('automation-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess automation opportunities',
  agent: {
    name: 'automation-assessor',
    prompt: {
      role: 'fulfillment automation specialist',
      task: 'Assess and plan automation for fulfillment activities',
      context: args,
      instructions: [
        'Identify automatable steps',
        'Check automation availability',
        'Assess automation applicability',
        'Plan automated execution',
        'Identify manual steps',
        'Document automation dependencies',
        'Plan automation fallback',
        'Calculate automation percentage',
        'Generate automation assessment'
      ],
      outputFormat: 'JSON with automationApplied, automatedSteps, manualSteps, dependencies, fallback, automationPercentage, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['automationApplied', 'automatedSteps', 'manualSteps', 'artifacts'],
      properties: {
        automationApplied: { type: 'boolean' },
        automatedSteps: { type: 'array', items: { type: 'object' } },
        manualSteps: { type: 'array', items: { type: 'object' } },
        dependencies: { type: 'array', items: { type: 'object' } },
        fallback: { type: 'object' },
        automationPercentage: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'service-request', 'automation']
}));

export const fulfillmentExecutionTask = defineTask('fulfillment-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute fulfillment',
  agent: {
    name: 'fulfillment-executor',
    prompt: {
      role: 'fulfillment execution specialist',
      task: 'Execute service request fulfillment activities',
      context: args,
      instructions: [
        'Execute automated steps',
        'Coordinate manual activities',
        'Track step completion',
        'Handle errors and exceptions',
        'Update request status',
        'Communicate progress',
        'Document execution details',
        'Capture fulfillment evidence',
        'Generate execution report'
      ],
      outputFormat: 'JSON with completedSteps, errors, status, progress, evidence, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['completedSteps', 'status', 'artifacts'],
      properties: {
        completedSteps: { type: 'array', items: { type: 'object' } },
        errors: { type: 'array', items: { type: 'object' } },
        status: { type: 'string' },
        progress: { type: 'object' },
        evidence: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'service-request', 'execution']
}));

export const fulfillmentVerificationTask = defineTask('fulfillment-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify fulfillment',
  agent: {
    name: 'fulfillment-verifier',
    prompt: {
      role: 'quality verification specialist',
      task: 'Verify service request fulfillment completeness and quality',
      context: args,
      instructions: [
        'Verify all steps completed',
        'Validate fulfillment against request',
        'Check quality criteria',
        'Verify configuration correctness',
        'Validate user access or provisioning',
        'Document verification results',
        'Identify any issues',
        'Plan remediation if needed',
        'Generate verification report'
      ],
      outputFormat: 'JSON with passed, completeness, quality, configuration, access, issues, remediation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'completeness', 'artifacts'],
      properties: {
        passed: { type: 'boolean' },
        completeness: { type: 'object' },
        quality: { type: 'object' },
        configuration: { type: 'object' },
        access: { type: 'object' },
        issues: { type: 'array', items: { type: 'object' } },
        remediation: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'service-request', 'verification']
}));

export const requestClosureTask = defineTask('request-closure', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Close service request',
  agent: {
    name: 'closure-specialist',
    prompt: {
      role: 'service request closure specialist',
      task: 'Close service request and notify requester',
      context: args,
      instructions: [
        'Update request status',
        'Calculate fulfillment time',
        'Prepare closure notification',
        'Send customer notification',
        'Request satisfaction feedback',
        'Archive request documentation',
        'Update metrics and reporting',
        'Close related tasks',
        'Generate closure record'
      ],
      outputFormat: 'JSON with status, fulfillmentTime, customerNotified, satisfaction, metrics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'fulfillmentTime', 'artifacts'],
      properties: {
        status: { type: 'string', enum: ['fulfilled', 'partially-fulfilled', 'cancelled', 'rejected'] },
        fulfillmentTime: { type: 'string' },
        customerNotified: { type: 'boolean' },
        satisfaction: { type: 'object' },
        metrics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'service-request', 'closure']
}));
