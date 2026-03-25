/**
 * @process environmental-engineering/environmental-management-system-implementation
 * @description Environmental Management System Implementation - Development and implementation of ISO 14001-compliant
 * environmental management systems.
 * @inputs { organizationName: string, organizationType: string, scope: object, currentState: object }
 * @outputs { success: boolean, emsDocumentation: object, implementationPlan: object, certificationReadiness: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('environmental-engineering/environmental-management-system-implementation', {
 *   organizationName: 'Manufacturing Company',
 *   organizationType: 'manufacturing',
 *   scope: { facilities: ['Plant A', 'Warehouse B'], activities: ['production', 'distribution'] },
 *   currentState: { hasEMS: false, existingPolicies: ['waste-management'] }
 * });
 *
 * @references
 * - ISO 14001:2015 Environmental Management Systems
 * - ISO 14004:2016 EMS General Guidelines
 * - EPA EMS Implementation Guide
 * - ISO 14001 Auditing Standards
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationName,
    organizationType = 'general',
    scope = {},
    currentState = {},
    certificationTarget = true,
    outputDir = 'ems-implementation-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting EMS Implementation: ${organizationName}`);
  ctx.log('info', `Organization Type: ${organizationType}, Certification Target: ${certificationTarget}`);

  // ============================================================================
  // PHASE 1: GAP ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: ISO 14001 Gap Analysis');

  const gapAnalysis = await ctx.task(emsGapAnalysisTask, {
    organizationName,
    currentState,
    scope,
    outputDir
  });

  artifacts.push(...gapAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: CONTEXT AND SCOPE
  // ============================================================================

  ctx.log('info', 'Phase 2: Context of Organization and Scope');

  const contextScope = await ctx.task(contextScopeTask, {
    organizationName,
    organizationType,
    scope,
    outputDir
  });

  artifacts.push(...contextScope.artifacts);

  // ============================================================================
  // PHASE 3: ENVIRONMENTAL POLICY
  // ============================================================================

  ctx.log('info', 'Phase 3: Environmental Policy Development');

  const environmentalPolicy = await ctx.task(environmentalPolicyTask, {
    organizationName,
    contextScope,
    outputDir
  });

  artifacts.push(...environmentalPolicy.artifacts);

  // ============================================================================
  // PHASE 4: ENVIRONMENTAL ASPECTS
  // ============================================================================

  ctx.log('info', 'Phase 4: Environmental Aspects and Impacts');

  const aspectsImpacts = await ctx.task(aspectsImpactsTask, {
    organizationName,
    scope,
    contextScope,
    outputDir
  });

  artifacts.push(...aspectsImpacts.artifacts);

  // Breakpoint: Aspects Review
  await ctx.breakpoint({
    question: `Environmental aspects identified for ${organizationName}. Significant aspects: ${aspectsImpacts.significantAspects.length}. Review aspects?`,
    title: 'Environmental Aspects Review',
    context: {
      runId: ctx.runId,
      significantAspects: aspectsImpacts.significantAspects,
      complianceObligations: aspectsImpacts.complianceObligations,
      files: aspectsImpacts.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 5: OBJECTIVES AND PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 5: Objectives and Environmental Planning');

  const objectivesPlanning = await ctx.task(objectivesPlanningTask, {
    organizationName,
    aspectsImpacts,
    environmentalPolicy,
    outputDir
  });

  artifacts.push(...objectivesPlanning.artifacts);

  // ============================================================================
  // PHASE 6: SUPPORT AND OPERATIONS
  // ============================================================================

  ctx.log('info', 'Phase 6: Support and Operational Controls');

  const supportOperations = await ctx.task(supportOperationsTask, {
    organizationName,
    aspectsImpacts,
    objectivesPlanning,
    outputDir
  });

  artifacts.push(...supportOperations.artifacts);

  // ============================================================================
  // PHASE 7: PERFORMANCE EVALUATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Performance Evaluation System');

  const performanceEvaluation = await ctx.task(performanceEvaluationTask, {
    organizationName,
    aspectsImpacts,
    objectivesPlanning,
    outputDir
  });

  artifacts.push(...performanceEvaluation.artifacts);

  // ============================================================================
  // PHASE 8: MANAGEMENT REVIEW
  // ============================================================================

  ctx.log('info', 'Phase 8: Management Review Process');

  const managementReview = await ctx.task(managementReviewTask, {
    organizationName,
    performanceEvaluation,
    outputDir
  });

  artifacts.push(...managementReview.artifacts);

  // ============================================================================
  // PHASE 9: INTERNAL AUDIT PROGRAM
  // ============================================================================

  ctx.log('info', 'Phase 9: Internal Audit Program');

  const internalAudit = await ctx.task(internalAuditTask, {
    organizationName,
    certificationTarget,
    outputDir
  });

  artifacts.push(...internalAudit.artifacts);

  // ============================================================================
  // PHASE 10: EMS DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 10: EMS Documentation Package');

  const emsDocumentation = await ctx.task(emsDocumentationTask, {
    organizationName,
    gapAnalysis,
    contextScope,
    environmentalPolicy,
    aspectsImpacts,
    objectivesPlanning,
    supportOperations,
    performanceEvaluation,
    managementReview,
    internalAudit,
    outputDir
  });

  artifacts.push(...emsDocumentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    organizationName,
    emsDocumentation: {
      policy: environmentalPolicy.policy,
      manual: emsDocumentation.emsManual,
      procedures: emsDocumentation.procedures,
      records: emsDocumentation.records
    },
    implementationPlan: {
      phases: gapAnalysis.implementationPhases,
      timeline: gapAnalysis.timeline,
      resourceRequirements: gapAnalysis.resourceRequirements
    },
    certificationReadiness: {
      gapsClosed: gapAnalysis.gapsClosedPercentage,
      auditReadiness: internalAudit.auditReadiness,
      recommendedCertificationDate: internalAudit.recommendedCertificationDate
    },
    significantAspects: aspectsImpacts.significantAspects,
    environmentalObjectives: objectivesPlanning.objectives,
    artifacts,
    duration,
    metadata: {
      processId: 'environmental-engineering/environmental-management-system-implementation',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const emsGapAnalysisTask = defineTask('ems-gap-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'ISO 14001 Gap Analysis',
  agent: {
    name: 'environmental-compliance-specialist',
    prompt: {
      role: 'EMS Auditor',
      task: 'Conduct ISO 14001 gap analysis',
      context: args,
      instructions: [
        '1. Review current environmental practices',
        '2. Assess against ISO 14001 requirements',
        '3. Identify gaps by clause',
        '4. Prioritize gaps by criticality',
        '5. Assess documentation gaps',
        '6. Assess implementation gaps',
        '7. Develop closure actions',
        '8. Estimate resources required',
        '9. Develop implementation timeline',
        '10. Document gap analysis'
      ],
      outputFormat: 'JSON with gaps, implementation phases, timeline'
    },
    outputSchema: {
      type: 'object',
      required: ['gaps', 'implementationPhases', 'timeline', 'artifacts'],
      properties: {
        gaps: { type: 'array' },
        gapsByClause: { type: 'object' },
        documentationGaps: { type: 'array' },
        implementationGaps: { type: 'array' },
        implementationPhases: { type: 'array' },
        timeline: { type: 'object' },
        resourceRequirements: { type: 'object' },
        gapsClosedPercentage: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'ems', 'gap-analysis']
}));

export const contextScopeTask = defineTask('context-scope', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Context of Organization and Scope',
  agent: {
    name: 'environmental-compliance-specialist',
    prompt: {
      role: 'EMS Implementation Specialist',
      task: 'Define organizational context and EMS scope',
      context: args,
      instructions: [
        '1. Identify internal issues',
        '2. Identify external issues',
        '3. Identify interested parties',
        '4. Determine needs and expectations',
        '5. Define EMS scope',
        '6. Define physical boundaries',
        '7. Define organizational boundaries',
        '8. Document exclusions if any',
        '9. Prepare context documentation',
        '10. Document scope statement'
      ],
      outputFormat: 'JSON with context, interested parties, scope'
    },
    outputSchema: {
      type: 'object',
      required: ['context', 'interestedParties', 'scope', 'artifacts'],
      properties: {
        context: { type: 'object' },
        internalIssues: { type: 'array' },
        externalIssues: { type: 'array' },
        interestedParties: { type: 'array' },
        needsExpectations: { type: 'object' },
        scope: { type: 'object' },
        scopeStatement: { type: 'string' },
        exclusions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'ems', 'context']
}));

export const environmentalPolicyTask = defineTask('environmental-policy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Environmental Policy Development',
  agent: {
    name: 'environmental-compliance-specialist',
    prompt: {
      role: 'EMS Policy Developer',
      task: 'Develop environmental policy per ISO 14001',
      context: args,
      instructions: [
        '1. Draft policy statement',
        '2. Include commitment to protection',
        '3. Include commitment to compliance',
        '4. Include commitment to continual improvement',
        '5. Align with organizational context',
        '6. Ensure appropriate to nature of activities',
        '7. Include framework for objectives',
        '8. Ensure communication plan',
        '9. Obtain top management approval',
        '10. Document environmental policy'
      ],
      outputFormat: 'JSON with policy, commitments, communication plan'
    },
    outputSchema: {
      type: 'object',
      required: ['policy', 'commitments', 'communicationPlan', 'artifacts'],
      properties: {
        policy: { type: 'object' },
        policyStatement: { type: 'string' },
        commitments: { type: 'array' },
        objectiveFramework: { type: 'object' },
        communicationPlan: { type: 'object' },
        approvalStatus: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'ems', 'policy']
}));

export const aspectsImpactsTask = defineTask('aspects-impacts', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Environmental Aspects and Impacts',
  agent: {
    name: 'environmental-compliance-specialist',
    prompt: {
      role: 'Environmental Aspects Analyst',
      task: 'Identify and evaluate environmental aspects',
      context: args,
      instructions: [
        '1. Identify all environmental aspects',
        '2. Consider lifecycle perspective',
        '3. Identify associated impacts',
        '4. Develop significance criteria',
        '5. Evaluate significance',
        '6. Identify compliance obligations',
        '7. Identify risks and opportunities',
        '8. Prioritize significant aspects',
        '9. Document control requirements',
        '10. Prepare aspects register'
      ],
      outputFormat: 'JSON with aspects, significant aspects, compliance obligations'
    },
    outputSchema: {
      type: 'object',
      required: ['aspects', 'significantAspects', 'complianceObligations', 'artifacts'],
      properties: {
        aspects: { type: 'array' },
        aspectsRegister: { type: 'object' },
        significanceCriteria: { type: 'object' },
        significantAspects: { type: 'array' },
        impacts: { type: 'object' },
        complianceObligations: { type: 'array' },
        risksOpportunities: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'ems', 'aspects']
}));

export const objectivesPlanningTask = defineTask('objectives-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Objectives and Environmental Planning',
  agent: {
    name: 'environmental-compliance-specialist',
    prompt: {
      role: 'Environmental Planning Specialist',
      task: 'Develop environmental objectives and planning',
      context: args,
      instructions: [
        '1. Develop SMART objectives',
        '2. Address significant aspects',
        '3. Address compliance obligations',
        '4. Address risks and opportunities',
        '5. Define targets and metrics',
        '6. Develop action plans',
        '7. Assign responsibilities',
        '8. Allocate resources',
        '9. Set timelines',
        '10. Document objectives and plans'
      ],
      outputFormat: 'JSON with objectives, targets, action plans'
    },
    outputSchema: {
      type: 'object',
      required: ['objectives', 'targets', 'actionPlans', 'artifacts'],
      properties: {
        objectives: { type: 'array' },
        targets: { type: 'object' },
        metrics: { type: 'array' },
        actionPlans: { type: 'array' },
        responsibilities: { type: 'object' },
        resources: { type: 'object' },
        timelines: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'ems', 'objectives']
}));

export const supportOperationsTask = defineTask('support-operations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Support and Operational Controls',
  agent: {
    name: 'environmental-compliance-specialist',
    prompt: {
      role: 'EMS Operations Specialist',
      task: 'Develop support requirements and operational controls',
      context: args,
      instructions: [
        '1. Define resource requirements',
        '2. Define competence requirements',
        '3. Develop awareness program',
        '4. Define communication procedures',
        '5. Define documented information requirements',
        '6. Develop operational controls',
        '7. Develop emergency preparedness',
        '8. Define procurement controls',
        '9. Define outsourced process controls',
        '10. Document support and operations'
      ],
      outputFormat: 'JSON with support requirements, operational controls, procedures'
    },
    outputSchema: {
      type: 'object',
      required: ['supportRequirements', 'operationalControls', 'procedures', 'artifacts'],
      properties: {
        supportRequirements: { type: 'object' },
        resourceRequirements: { type: 'object' },
        competenceRequirements: { type: 'object' },
        awarenessProgram: { type: 'object' },
        communicationProcedures: { type: 'object' },
        operationalControls: { type: 'array' },
        emergencyPreparedness: { type: 'object' },
        procedures: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'ems', 'operations']
}));

export const performanceEvaluationTask = defineTask('performance-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Performance Evaluation System',
  agent: {
    name: 'environmental-compliance-specialist',
    prompt: {
      role: 'EMS Performance Analyst',
      task: 'Develop performance evaluation system',
      context: args,
      instructions: [
        '1. Define monitoring requirements',
        '2. Define measurement methods',
        '3. Establish KPIs',
        '4. Design monitoring schedule',
        '5. Define compliance evaluation',
        '6. Design performance reports',
        '7. Define nonconformity handling',
        '8. Define corrective action process',
        '9. Develop tracking system',
        '10. Document performance evaluation'
      ],
      outputFormat: 'JSON with monitoring requirements, KPIs, evaluation procedures'
    },
    outputSchema: {
      type: 'object',
      required: ['monitoringRequirements', 'kpis', 'evaluationProcedures', 'artifacts'],
      properties: {
        monitoringRequirements: { type: 'object' },
        measurementMethods: { type: 'object' },
        kpis: { type: 'array' },
        monitoringSchedule: { type: 'object' },
        complianceEvaluation: { type: 'object' },
        evaluationProcedures: { type: 'object' },
        nonconformityProcess: { type: 'object' },
        correctiveActionProcess: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'ems', 'performance']
}));

export const managementReviewTask = defineTask('management-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Management Review Process',
  agent: {
    name: 'environmental-compliance-specialist',
    prompt: {
      role: 'EMS Management Review Coordinator',
      task: 'Develop management review process',
      context: args,
      instructions: [
        '1. Define review frequency',
        '2. Define review inputs',
        '3. Define review outputs',
        '4. Design review agenda template',
        '5. Define attendee requirements',
        '6. Develop review report template',
        '7. Define action tracking',
        '8. Define continual improvement process',
        '9. Plan first management review',
        '10. Document management review process'
      ],
      outputFormat: 'JSON with review process, inputs, outputs, templates'
    },
    outputSchema: {
      type: 'object',
      required: ['reviewProcess', 'inputs', 'outputs', 'templates', 'artifacts'],
      properties: {
        reviewProcess: { type: 'object' },
        reviewFrequency: { type: 'string' },
        inputs: { type: 'array' },
        outputs: { type: 'array' },
        agendaTemplate: { type: 'object' },
        reportTemplate: { type: 'object' },
        templates: { type: 'array' },
        actionTracking: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'ems', 'management-review']
}));

export const internalAuditTask = defineTask('internal-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Internal Audit Program',
  agent: {
    name: 'environmental-compliance-specialist',
    prompt: {
      role: 'EMS Internal Auditor',
      task: 'Develop internal audit program',
      context: args,
      instructions: [
        '1. Define audit program scope',
        '2. Define audit frequency',
        '3. Develop audit schedule',
        '4. Define auditor competence',
        '5. Develop audit procedures',
        '6. Design audit checklists',
        '7. Define reporting requirements',
        '8. Define finding classification',
        '9. Plan pre-certification audit',
        '10. Document audit program'
      ],
      outputFormat: 'JSON with audit program, schedule, checklists'
    },
    outputSchema: {
      type: 'object',
      required: ['auditProgram', 'auditSchedule', 'auditChecklists', 'auditReadiness', 'artifacts'],
      properties: {
        auditProgram: { type: 'object' },
        auditFrequency: { type: 'string' },
        auditSchedule: { type: 'object' },
        auditorCompetence: { type: 'object' },
        auditProcedures: { type: 'object' },
        auditChecklists: { type: 'array' },
        reportingRequirements: { type: 'object' },
        auditReadiness: { type: 'string' },
        recommendedCertificationDate: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'ems', 'audit']
}));

export const emsDocumentationTask = defineTask('ems-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'EMS Documentation Package',
  agent: {
    name: 'environmental-compliance-specialist',
    prompt: {
      role: 'EMS Documentation Specialist',
      task: 'Compile complete EMS documentation package',
      context: args,
      instructions: [
        '1. Prepare EMS manual',
        '2. Compile procedures',
        '3. Compile work instructions',
        '4. Prepare forms and templates',
        '5. Compile records requirements',
        '6. Develop document control procedure',
        '7. Create document hierarchy',
        '8. Prepare training materials',
        '9. Compile certification package',
        '10. Generate documentation index'
      ],
      outputFormat: 'JSON with EMS manual, procedures, records, documentation index'
    },
    outputSchema: {
      type: 'object',
      required: ['emsManual', 'procedures', 'records', 'documentationIndex', 'artifacts'],
      properties: {
        emsManual: { type: 'object' },
        procedures: { type: 'array' },
        workInstructions: { type: 'array' },
        formsTemplates: { type: 'array' },
        records: { type: 'array' },
        documentControl: { type: 'object' },
        documentHierarchy: { type: 'object' },
        trainingMaterials: { type: 'array' },
        documentationIndex: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'ems', 'documentation']
}));
