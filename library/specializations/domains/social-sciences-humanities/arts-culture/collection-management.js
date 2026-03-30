/**
 * @process arts-culture/collection-management
 * @description Systematic approach to managing permanent collections including acquisition, documentation, cataloging, storage, loan coordination, and deaccession following AAM and ICOM standards
 * @inputs { collectionScope: string, institutionName: string, managementAction: string, objectIds: array }
 * @outputs { success: boolean, collectionStatus: object, actions: array, documentation: object, artifacts: array }
 * @recommendedSkills SK-AC-003 (collection-documentation), SK-AC-001 (curatorial-research), SK-AC-006 (conservation-assessment)
 * @recommendedAgents AG-AC-006 (registrar-agent), AG-AC-001 (curator-agent), AG-AC-004 (conservator-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    collectionScope,
    institutionName,
    managementAction = 'audit',
    objectIds = [],
    complianceStandards = ['AAM', 'ICOM'],
    outputDir = 'collection-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Collection Inventory Assessment
  ctx.log('info', 'Starting collection management: Inventory assessment');
  const inventoryResult = await ctx.task(inventoryAssessmentTask, {
    collectionScope,
    institutionName,
    objectIds,
    outputDir
  });

  if (!inventoryResult.success) {
    return {
      success: false,
      error: 'Inventory assessment failed',
      details: inventoryResult,
      metadata: { processId: 'arts-culture/collection-management', timestamp: startTime }
    };
  }

  artifacts.push(...inventoryResult.artifacts);

  // Task 2: Documentation Standards Review
  ctx.log('info', 'Reviewing documentation standards');
  const documentationReview = await ctx.task(documentationStandardsTask, {
    inventoryData: inventoryResult.inventory,
    complianceStandards,
    outputDir
  });

  artifacts.push(...documentationReview.artifacts);

  // Task 3: Cataloging and Metadata
  ctx.log('info', 'Processing cataloging and metadata');
  const catalogingResult = await ctx.task(catalogingMetadataTask, {
    inventoryData: inventoryResult.inventory,
    documentationGaps: documentationReview.gaps,
    outputDir
  });

  artifacts.push(...catalogingResult.artifacts);

  // Task 4: Storage and Conservation Assessment
  ctx.log('info', 'Assessing storage and conservation needs');
  const storageAssessment = await ctx.task(storageConservationTask, {
    inventoryData: inventoryResult.inventory,
    collectionScope,
    outputDir
  });

  artifacts.push(...storageAssessment.artifacts);

  // Task 5: Loan History and Status
  ctx.log('info', 'Reviewing loan history and status');
  const loanStatus = await ctx.task(loanHistoryTask, {
    inventoryData: inventoryResult.inventory,
    institutionName,
    outputDir
  });

  artifacts.push(...loanStatus.artifacts);

  // Task 6: Compliance Audit
  ctx.log('info', 'Conducting compliance audit');
  const complianceAudit = await ctx.task(complianceAuditTask, {
    inventoryResult,
    documentationReview,
    catalogingResult,
    storageAssessment,
    loanStatus,
    complianceStandards,
    outputDir
  });

  artifacts.push(...complianceAudit.artifacts);

  // Breakpoint: Review collection status
  await ctx.breakpoint({
    question: `Collection management review complete. ${inventoryResult.totalObjects} objects assessed, ${complianceAudit.complianceScore}% compliance. Review findings?`,
    title: 'Collection Management Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        totalObjects: inventoryResult.totalObjects,
        documentationGaps: documentationReview.gaps.length,
        conservationNeeds: storageAssessment.conservationNeeds,
        complianceScore: complianceAudit.complianceScore
      }
    }
  });

  // Task 7: Generate Action Plan
  ctx.log('info', 'Generating collection management action plan');
  const actionPlan = await ctx.task(actionPlanTask, {
    inventoryResult,
    documentationReview,
    catalogingResult,
    storageAssessment,
    complianceAudit,
    managementAction,
    outputDir
  });

  artifacts.push(...actionPlan.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    collectionStatus: {
      totalObjects: inventoryResult.totalObjects,
      documentedObjects: catalogingResult.fullyDocumented,
      complianceScore: complianceAudit.complianceScore
    },
    actions: actionPlan.prioritizedActions,
    documentation: {
      inventory: inventoryResult.inventoryPath,
      catalog: catalogingResult.catalogPath,
      auditReport: complianceAudit.reportPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'arts-culture/collection-management',
      timestamp: startTime,
      institutionName,
      outputDir
    }
  };
}

// Task 1: Inventory Assessment
export const inventoryAssessmentTask = defineTask('inventory-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess collection inventory',
  agent: {
    name: 'registrar',
    prompt: {
      role: 'museum registrar',
      task: 'Conduct comprehensive collection inventory assessment',
      context: args,
      instructions: [
        'Compile current inventory records',
        'Identify objects by accession number',
        'Verify object locations',
        'Document any discrepancies',
        'Categorize by medium, date, artist',
        'Flag objects requiring attention',
        'Generate inventory statistics',
        'Create inventory spreadsheet'
      ],
      outputFormat: 'JSON with success, totalObjects, inventory, discrepancies, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'totalObjects', 'inventory', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        totalObjects: { type: 'number' },
        inventory: { type: 'array' },
        discrepancies: { type: 'array' },
        inventoryPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'registrar', 'inventory', 'collection']
}));

// Task 2: Documentation Standards Review
export const documentationStandardsTask = defineTask('documentation-standards', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review documentation standards',
  agent: {
    name: 'collections-manager',
    prompt: {
      role: 'collections manager',
      task: 'Review documentation against AAM and ICOM standards',
      context: args,
      instructions: [
        'Review object records for completeness',
        'Check provenance documentation',
        'Verify deed of gift records',
        'Assess photographic documentation',
        'Review condition reports',
        'Check insurance valuations',
        'Identify documentation gaps',
        'Prioritize remediation needs'
      ],
      outputFormat: 'JSON with gaps, compliantRecords, nonCompliantRecords, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['gaps', 'artifacts'],
      properties: {
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              objectId: { type: 'string' },
              missingElements: { type: 'array', items: { type: 'string' } },
              priority: { type: 'string' }
            }
          }
        },
        compliantRecords: { type: 'number' },
        nonCompliantRecords: { type: 'number' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'documentation', 'standards', 'compliance']
}));

// Task 3: Cataloging and Metadata
export const catalogingMetadataTask = defineTask('cataloging-metadata', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Process cataloging and metadata',
  agent: {
    name: 'cataloger',
    prompt: {
      role: 'museum cataloger',
      task: 'Enhance cataloging and metadata records',
      context: args,
      instructions: [
        'Review and standardize nomenclature',
        'Verify artist biographical information',
        'Validate dates and attributions',
        'Check medium and technique descriptions',
        'Verify dimensions and inscriptions',
        'Update subject and keyword indexing',
        'Link to authority files (ULAN, AAT, TGN)',
        'Generate updated catalog records'
      ],
      outputFormat: 'JSON with fullyDocumented, updatedRecords, catalogPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['fullyDocumented', 'artifacts'],
      properties: {
        fullyDocumented: { type: 'number' },
        updatedRecords: { type: 'array' },
        catalogPath: { type: 'string' },
        authorityLinks: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cataloging', 'metadata', 'standards']
}));

// Task 4: Storage and Conservation Assessment
export const storageConservationTask = defineTask('storage-conservation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess storage and conservation',
  agent: {
    name: 'conservator',
    prompt: {
      role: 'museum conservator',
      task: 'Assess storage conditions and conservation needs',
      context: args,
      instructions: [
        'Evaluate storage facility conditions',
        'Assess environmental controls (temp, RH, light)',
        'Review object housing and supports',
        'Identify conservation treatment needs',
        'Prioritize conservation by urgency',
        'Assess pest management protocols',
        'Review disaster preparedness',
        'Recommend storage improvements'
      ],
      outputFormat: 'JSON with storageConditions, conservationNeeds, priorities, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['storageConditions', 'conservationNeeds', 'artifacts'],
      properties: {
        storageConditions: {
          type: 'object',
          properties: {
            temperature: { type: 'string' },
            humidity: { type: 'string' },
            lighting: { type: 'string' },
            overall: { type: 'string' }
          }
        },
        conservationNeeds: { type: 'number' },
        priorities: { type: 'array' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'conservation', 'storage', 'preservation']
}));

// Task 5: Loan History Review
export const loanHistoryTask = defineTask('loan-history', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review loan history and status',
  agent: {
    name: 'registrar',
    prompt: {
      role: 'museum registrar',
      task: 'Review loan history and current loan status',
      context: args,
      instructions: [
        'Compile outgoing loan history',
        'Review incoming loan records',
        'Check current loan agreements',
        'Identify overdue loan returns',
        'Review loan request queue',
        'Assess loan policy compliance',
        'Document insurance and indemnity status',
        'Generate loan activity report'
      ],
      outputFormat: 'JSON with currentLoans, loanHistory, overdueItems, upcomingReturns, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['currentLoans', 'artifacts'],
      properties: {
        currentLoans: { type: 'number' },
        loanHistory: { type: 'array' },
        overdueItems: { type: 'array' },
        upcomingReturns: { type: 'array' },
        loanRequests: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'registrar', 'loans', 'tracking']
}));

// Task 6: Compliance Audit
export const complianceAuditTask = defineTask('compliance-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct compliance audit',
  agent: {
    name: 'compliance-auditor',
    prompt: {
      role: 'museum compliance specialist',
      task: 'Audit collection management against professional standards',
      context: args,
      instructions: [
        'Review against AAM standards',
        'Check ICOM Code of Ethics compliance',
        'Assess collections management policy adherence',
        'Verify legal and regulatory compliance',
        'Review acquisition procedures',
        'Check deaccession policy compliance',
        'Assess NAGPRA/cultural property compliance',
        'Generate compliance scorecard'
      ],
      outputFormat: 'JSON with complianceScore, findings, violations, recommendations, reportPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['complianceScore', 'findings', 'artifacts'],
      properties: {
        complianceScore: { type: 'number' },
        findings: { type: 'array' },
        violations: { type: 'array' },
        recommendations: { type: 'array' },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'compliance', 'audit', 'standards']
}));

// Task 7: Action Plan Generation
export const actionPlanTask = defineTask('action-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate collection management action plan',
  agent: {
    name: 'collections-director',
    prompt: {
      role: 'collections director',
      task: 'Develop prioritized action plan for collection management',
      context: args,
      instructions: [
        'Synthesize findings from all assessments',
        'Prioritize actions by urgency and impact',
        'Estimate resources and timeline',
        'Identify quick wins and long-term projects',
        'Assign responsibility areas',
        'Create implementation roadmap',
        'Define success metrics',
        'Generate executive summary'
      ],
      outputFormat: 'JSON with prioritizedActions, resourceEstimates, timeline, metrics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['prioritizedActions', 'artifacts'],
      properties: {
        prioritizedActions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              priority: { type: 'string' },
              timeline: { type: 'string' },
              resources: { type: 'string' },
              responsible: { type: 'string' }
            }
          }
        },
        resourceEstimates: { type: 'object' },
        timeline: { type: 'object' },
        metrics: { type: 'array' },
        executiveSummary: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'planning', 'action-plan', 'collection-management']
}));
