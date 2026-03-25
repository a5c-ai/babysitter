/**
 * @process specializations/domains/business/legal/data-subject-rights-management
 * @description Data Subject Rights Management - Implement procedures for handling access, deletion, portability,
 * and other data subject requests within regulatory timeframes.
 * @inputs { requestId?: string, requestType?: string, action?: string, outputDir?: string }
 * @outputs { success: boolean, request: object, response: object, complianceStatus: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/legal/data-subject-rights-management', {
 *   requestId: 'DSR-2024-001',
 *   requestType: 'access',
 *   action: 'process',
 *   outputDir: 'dsr-management'
 * });
 *
 * @references
 * - IAPP CIPP Certification: https://iapp.org/certify/cipp/
 * - GDPR DSR Requirements: https://gdpr.eu/right-of-access/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    requestId = `DSR-${Date.now()}`,
    requestType = 'access', // 'access', 'deletion', 'portability', 'rectification', 'restriction', 'objection'
    dataSubject = null,
    action = 'process', // 'intake', 'process', 'complete', 'report'
    outputDir = 'dsr-management-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting DSR Processing - Request: ${requestId}, Type: ${requestType}`);

  // Phase 1: Request Intake and Validation
  const intake = await ctx.task(dsrIntakeTask, {
    requestId,
    requestType,
    dataSubject,
    outputDir
  });
  artifacts.push(...intake.artifacts);

  // Phase 2: Identity Verification
  const verification = await ctx.task(identityVerificationTask, {
    requestId,
    dataSubject: intake.dataSubject,
    outputDir
  });
  artifacts.push(...verification.artifacts);

  if (!verification.verified) {
    await ctx.breakpoint({
      question: `Identity verification for ${requestId} requires additional information. Request additional verification from data subject?`,
      title: 'DSR Identity Verification',
      context: {
        runId: ctx.runId,
        requestId,
        verificationStatus: verification.status,
        requiredInfo: verification.requiredInfo
      }
    });
  }

  // Phase 3: Data Location
  const dataLocation = await ctx.task(dataLocationTask, {
    requestId,
    dataSubject: intake.dataSubject,
    requestType,
    outputDir
  });
  artifacts.push(...dataLocation.artifacts);

  // Phase 4: Request Fulfillment
  const fulfillment = await ctx.task(requestFulfillmentTask, {
    requestId,
    requestType,
    dataLocations: dataLocation.locations,
    outputDir
  });
  artifacts.push(...fulfillment.artifacts);

  // Phase 5: Response Preparation
  const response = await ctx.task(dsrResponseTask, {
    requestId,
    requestType,
    fulfillment,
    outputDir
  });
  artifacts.push(...response.artifacts);

  // Phase 6: Compliance Documentation
  const compliance = await ctx.task(dsrComplianceDocTask, {
    requestId,
    requestType,
    intake,
    verification,
    fulfillment,
    response,
    outputDir
  });
  artifacts.push(...compliance.artifacts);

  await ctx.breakpoint({
    question: `DSR ${requestId} (${requestType}) ready for response. Completed within ${compliance.daysToComplete} days. Approve and send response?`,
    title: 'DSR Response Review',
    context: {
      runId: ctx.runId,
      requestId,
      requestType,
      daysToComplete: compliance.daysToComplete,
      withinDeadline: compliance.withinDeadline,
      files: [{ path: response.responsePath, format: 'docx', label: 'DSR Response' }]
    }
  });

  return {
    success: true,
    requestId,
    requestType,
    request: {
      intake: intake.intakeDate,
      dataSubject: intake.dataSubject,
      verified: verification.verified
    },
    response: {
      path: response.responsePath,
      completedDate: response.completedDate,
      dataProvided: response.dataProvided
    },
    complianceStatus: {
      daysToComplete: compliance.daysToComplete,
      withinDeadline: compliance.withinDeadline,
      documentationComplete: compliance.documentationComplete
    },
    artifacts,
    metadata: { processId: 'specializations/domains/business/legal/data-subject-rights-management', timestamp: startTime }
  };
}

export const dsrIntakeTask = defineTask('dsr-intake', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Intake DSR',
  agent: {
    name: 'privacy-specialist',
    prompt: {
      role: 'DSR Intake Specialist',
      task: 'Process DSR intake',
      context: args,
      instructions: ['Record request details', 'Validate request type', 'Start response clock', 'Acknowledge receipt'],
      outputFormat: 'JSON with intakeDate, dataSubject, requestDetails, artifacts'
    },
    outputSchema: { type: 'object', required: ['intakeDate', 'dataSubject', 'artifacts'], properties: { intakeDate: { type: 'string' }, dataSubject: { type: 'object' }, requestDetails: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'dsr']
}));

export const identityVerificationTask = defineTask('identity-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify identity',
  agent: {
    name: 'privacy-specialist',
    prompt: {
      role: 'Identity Verification Specialist',
      task: 'Verify data subject identity',
      context: args,
      instructions: ['Request identity verification', 'Review provided documents', 'Confirm identity match', 'Document verification'],
      outputFormat: 'JSON with verified, status, requiredInfo, artifacts'
    },
    outputSchema: { type: 'object', required: ['verified', 'status', 'artifacts'], properties: { verified: { type: 'boolean' }, status: { type: 'string' }, requiredInfo: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'dsr']
}));

export const dataLocationTask = defineTask('data-location', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Locate data',
  agent: {
    name: 'privacy-specialist',
    prompt: {
      role: 'Data Location Specialist',
      task: 'Locate data subject data',
      context: args,
      instructions: ['Search all systems', 'Identify data locations', 'Document data found', 'Assess third party holdings'],
      outputFormat: 'JSON with locations array, systemsSearched, artifacts'
    },
    outputSchema: { type: 'object', required: ['locations', 'artifacts'], properties: { locations: { type: 'array' }, systemsSearched: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'dsr']
}));

export const requestFulfillmentTask = defineTask('request-fulfillment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Fulfill request',
  agent: {
    name: 'privacy-specialist',
    prompt: {
      role: 'Request Fulfillment Specialist',
      task: 'Fulfill data subject request',
      context: args,
      instructions: ['Execute request action', 'Collect/delete/port data', 'Verify completion', 'Document actions taken'],
      outputFormat: 'JSON with actions array, completionStatus, artifacts'
    },
    outputSchema: { type: 'object', required: ['actions', 'completionStatus', 'artifacts'], properties: { actions: { type: 'array' }, completionStatus: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'dsr']
}));

export const dsrResponseTask = defineTask('dsr-response', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare response',
  agent: {
    name: 'privacy-specialist',
    prompt: {
      role: 'DSR Response Specialist',
      task: 'Prepare DSR response',
      context: args,
      instructions: ['Draft response letter', 'Package data if applicable', 'Ensure secure delivery method', 'Finalize response'],
      outputFormat: 'JSON with responsePath, completedDate, dataProvided, artifacts'
    },
    outputSchema: { type: 'object', required: ['responsePath', 'completedDate', 'artifacts'], properties: { responsePath: { type: 'string' }, completedDate: { type: 'string' }, dataProvided: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'dsr']
}));

export const dsrComplianceDocTask = defineTask('dsr-compliance-doc', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document compliance',
  agent: {
    name: 'privacy-specialist',
    prompt: {
      role: 'DSR Compliance Specialist',
      task: 'Document DSR compliance',
      context: args,
      instructions: ['Calculate response time', 'Verify deadline compliance', 'Document complete audit trail', 'Archive request file'],
      outputFormat: 'JSON with daysToComplete, withinDeadline, documentationComplete, artifacts'
    },
    outputSchema: { type: 'object', required: ['daysToComplete', 'withinDeadline', 'documentationComplete', 'artifacts'], properties: { daysToComplete: { type: 'number' }, withinDeadline: { type: 'boolean' }, documentationComplete: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'dsr']
}));
