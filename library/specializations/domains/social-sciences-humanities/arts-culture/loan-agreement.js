/**
 * @process arts-culture/loan-agreement
 * @description Protocol for negotiating, documenting, and managing incoming and outgoing loans including condition reporting, insurance valuation, shipping coordination, and legal compliance
 * @inputs { loanType: string, artworkIds: array, lenderInfo: object, borrowerInfo: object, loanPeriod: object }
 * @outputs { success: boolean, loanAgreement: object, conditionReports: array, shippingPlan: object, artifacts: array }
 * @recommendedSkills SK-AC-003 (collection-documentation), SK-AC-011 (risk-mitigation-planning)
 * @recommendedAgents AG-AC-006 (registrar-agent), AG-AC-001 (curator-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    loanType = 'outgoing',
    artworkIds = [],
    lenderInfo = {},
    borrowerInfo = {},
    loanPeriod = {},
    exhibitionTitle = '',
    outputDir = 'loan-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Loan Request Processing
  ctx.log('info', 'Starting loan agreement process: Processing loan request');
  const loanRequest = await ctx.task(loanRequestTask, {
    loanType,
    artworkIds,
    lenderInfo,
    borrowerInfo,
    exhibitionTitle,
    loanPeriod,
    outputDir
  });

  if (!loanRequest.success) {
    return {
      success: false,
      error: 'Loan request processing failed',
      details: loanRequest,
      metadata: { processId: 'arts-culture/loan-agreement', timestamp: startTime }
    };
  }

  artifacts.push(...loanRequest.artifacts);

  // Task 2: Facility Report Exchange
  ctx.log('info', 'Processing facility reports');
  const facilityReports = await ctx.task(facilityReportTask, {
    loanType,
    borrowerInfo,
    lenderInfo,
    artworkIds,
    outputDir
  });

  artifacts.push(...facilityReports.artifacts);

  // Task 3: Condition Reporting
  ctx.log('info', 'Preparing condition reports');
  const conditionReports = await ctx.task(conditionReportTask, {
    artworkIds,
    loanType,
    outputDir
  });

  artifacts.push(...conditionReports.artifacts);

  // Task 4: Insurance and Valuation
  ctx.log('info', 'Processing insurance and valuation');
  const insuranceValuation = await ctx.task(insuranceValuationTask, {
    artworkIds,
    loanType,
    loanPeriod,
    lenderInfo,
    borrowerInfo,
    outputDir
  });

  artifacts.push(...insuranceValuation.artifacts);

  // Task 5: Shipping and Handling Coordination
  ctx.log('info', 'Coordinating shipping and handling');
  const shippingCoordination = await ctx.task(shippingCoordinationTask, {
    artworkIds,
    loanType,
    lenderInfo,
    borrowerInfo,
    loanPeriod,
    conditionReports: conditionReports.reports,
    outputDir
  });

  artifacts.push(...shippingCoordination.artifacts);

  // Task 6: Legal Agreement Preparation
  ctx.log('info', 'Preparing legal agreement');
  const legalAgreement = await ctx.task(legalAgreementTask, {
    loanType,
    artworkIds,
    lenderInfo,
    borrowerInfo,
    loanPeriod,
    insuranceValuation,
    shippingCoordination,
    facilityReports,
    outputDir
  });

  artifacts.push(...legalAgreement.artifacts);

  // Breakpoint: Review loan agreement
  await ctx.breakpoint({
    question: `Loan agreement prepared for ${artworkIds.length} artwork(s). Total insurance value: $${insuranceValuation.totalValue}. Review and approve?`,
    title: 'Loan Agreement Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        loanType,
        artworkCount: artworkIds.length,
        totalInsuranceValue: insuranceValuation.totalValue,
        loanPeriod,
        shippingMethod: shippingCoordination.method
      }
    }
  });

  // Task 7: Generate Loan Documentation Package
  ctx.log('info', 'Generating loan documentation package');
  const documentation = await ctx.task(loanDocumentationTask, {
    loanRequest,
    facilityReports,
    conditionReports,
    insuranceValuation,
    shippingCoordination,
    legalAgreement,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    loanAgreement: legalAgreement.agreement,
    conditionReports: conditionReports.reports,
    shippingPlan: shippingCoordination.plan,
    insuranceDetails: insuranceValuation,
    artifacts,
    duration,
    metadata: {
      processId: 'arts-culture/loan-agreement',
      timestamp: startTime,
      loanType,
      outputDir
    }
  };
}

// Task 1: Loan Request Processing
export const loanRequestTask = defineTask('loan-request', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Process loan request',
  agent: {
    name: 'registrar',
    prompt: {
      role: 'museum registrar',
      task: 'Process and evaluate loan request',
      context: args,
      instructions: [
        'Review loan request details',
        'Verify artwork availability',
        'Check exhibition schedule conflicts',
        'Evaluate conservation concerns',
        'Assess borrower credentials',
        'Review loan history for objects',
        'Document special requirements',
        'Generate loan request summary'
      ],
      outputFormat: 'JSON with success, requestSummary, availability, concerns, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'requestSummary', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        requestSummary: {
          type: 'object',
          properties: {
            loanType: { type: 'string' },
            objectCount: { type: 'number' },
            requestDate: { type: 'string' },
            loanPeriod: { type: 'object' }
          }
        },
        availability: { type: 'array' },
        concerns: { type: 'array' },
        recommendation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'registrar', 'loan-request', 'evaluation']
}));

// Task 2: Facility Report Processing
export const facilityReportTask = defineTask('facility-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Process facility reports',
  agent: {
    name: 'collections-manager',
    prompt: {
      role: 'collections manager',
      task: 'Review and prepare facility reports for loan',
      context: args,
      instructions: [
        'Request facility report from borrower',
        'Review environmental controls',
        'Assess security measures',
        'Evaluate fire suppression systems',
        'Review lighting conditions',
        'Check pest management protocols',
        'Assess handling capabilities',
        'Document any deficiencies'
      ],
      outputFormat: 'JSON with facilityAssessment, environmentalData, securityAssessment, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['facilityAssessment', 'artifacts'],
      properties: {
        facilityAssessment: {
          type: 'object',
          properties: {
            overall: { type: 'string' },
            temperature: { type: 'string' },
            humidity: { type: 'string' },
            lighting: { type: 'string' },
            security: { type: 'string' }
          }
        },
        environmentalData: { type: 'object' },
        securityAssessment: { type: 'object' },
        deficiencies: { type: 'array' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'facility', 'assessment', 'loans']
}));

// Task 3: Condition Reporting
export const conditionReportTask = defineTask('condition-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare condition reports',
  agent: {
    name: 'conservator',
    prompt: {
      role: 'conservator',
      task: 'Prepare detailed condition reports for loan objects',
      context: args,
      instructions: [
        'Examine each object thoroughly',
        'Document overall condition',
        'Note any damage or deterioration',
        'Photograph condition issues',
        'Record previous treatments',
        'Identify handling sensitivities',
        'Note display requirements',
        'Generate condition report forms'
      ],
      outputFormat: 'JSON with reports, overallStatus, handlingRequirements, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reports', 'artifacts'],
      properties: {
        reports: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              objectId: { type: 'string' },
              overallCondition: { type: 'string' },
              issues: { type: 'array' },
              handlingNotes: { type: 'string' },
              displayRequirements: { type: 'string' }
            }
          }
        },
        overallStatus: { type: 'string' },
        handlingRequirements: { type: 'array' },
        photographyComplete: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'conservation', 'condition-report', 'documentation']
}));

// Task 4: Insurance and Valuation
export const insuranceValuationTask = defineTask('insurance-valuation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Process insurance and valuation',
  agent: {
    name: 'insurance-coordinator',
    prompt: {
      role: 'museum registrar',
      task: 'Coordinate insurance coverage and valuations',
      context: args,
      instructions: [
        'Verify current insurance valuations',
        'Request updated appraisals if needed',
        'Determine insurance responsibility',
        'Check for government indemnity eligibility',
        'Calculate loan fees',
        'Document certificate of insurance requirements',
        'Review deductibles and coverage limits',
        'Generate insurance documentation'
      ],
      outputFormat: 'JSON with totalValue, valuations, insuranceType, certificates, fees, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalValue', 'valuations', 'artifacts'],
      properties: {
        totalValue: { type: 'number' },
        valuations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              objectId: { type: 'string' },
              insuranceValue: { type: 'number' },
              appraisalDate: { type: 'string' }
            }
          }
        },
        insuranceType: { type: 'string' },
        indemnityEligible: { type: 'boolean' },
        certificateRequirements: { type: 'array' },
        fees: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'insurance', 'valuation', 'loans']
}));

// Task 5: Shipping Coordination
export const shippingCoordinationTask = defineTask('shipping-coordination', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Coordinate shipping and handling',
  agent: {
    name: 'shipping-coordinator',
    prompt: {
      role: 'museum registrar',
      task: 'Coordinate shipping logistics for loan',
      context: args,
      instructions: [
        'Select appropriate art handlers/shippers',
        'Determine packing requirements',
        'Plan crating specifications',
        'Arrange climate-controlled transport',
        'Schedule courier accompaniment',
        'Coordinate customs documentation',
        'Plan installation supervision',
        'Generate shipping timeline'
      ],
      outputFormat: 'JSON with plan, method, shippers, packingSpecs, courierNeeds, timeline, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'method', 'artifacts'],
      properties: {
        plan: {
          type: 'object',
          properties: {
            outbound: { type: 'object' },
            return: { type: 'object' },
            estimatedCost: { type: 'number' }
          }
        },
        method: { type: 'string' },
        shippers: { type: 'array' },
        packingSpecs: { type: 'array' },
        courierNeeds: { type: 'object' },
        customsDocuments: { type: 'array' },
        timeline: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'shipping', 'logistics', 'loans']
}));

// Task 6: Legal Agreement Preparation
export const legalAgreementTask = defineTask('legal-agreement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare legal agreement',
  agent: {
    name: 'contracts-manager',
    prompt: {
      role: 'museum legal/contracts manager',
      task: 'Prepare comprehensive loan agreement',
      context: args,
      instructions: [
        'Draft loan agreement using standard template',
        'Include all object details and valuations',
        'Specify loan period and venue',
        'Document insurance requirements',
        'Include shipping responsibilities',
        'Add reproduction and credit requirements',
        'Include special conditions',
        'Prepare signature pages'
      ],
      outputFormat: 'JSON with agreement, terms, specialConditions, signatureRequirements, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['agreement', 'artifacts'],
      properties: {
        agreement: {
          type: 'object',
          properties: {
            documentPath: { type: 'string' },
            version: { type: 'string' },
            status: { type: 'string' }
          }
        },
        terms: {
          type: 'object',
          properties: {
            loanPeriod: { type: 'object' },
            insurance: { type: 'string' },
            shipping: { type: 'string' },
            creditLine: { type: 'string' }
          }
        },
        specialConditions: { type: 'array' },
        signatureRequirements: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'legal', 'agreement', 'contracts']
}));

// Task 7: Loan Documentation Package
export const loanDocumentationTask = defineTask('loan-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate loan documentation package',
  agent: {
    name: 'documentation-specialist',
    prompt: {
      role: 'museum registrar',
      task: 'Compile complete loan documentation package',
      context: args,
      instructions: [
        'Compile all loan documents',
        'Create loan file checklist',
        'Organize condition reports',
        'Include insurance certificates',
        'Add shipping documentation',
        'Include signed agreements',
        'Create tracking log',
        'Generate loan summary sheet'
      ],
      outputFormat: 'JSON with packageContents, checklist, trackingLog, summarySheet, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['packageContents', 'artifacts'],
      properties: {
        packageContents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              document: { type: 'string' },
              status: { type: 'string' },
              path: { type: 'string' }
            }
          }
        },
        checklist: { type: 'array' },
        trackingLog: { type: 'string' },
        summarySheet: { type: 'string' },
        loanNumber: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'documentation', 'loan-package', 'registrar']
}));
