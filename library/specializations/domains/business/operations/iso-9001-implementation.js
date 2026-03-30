/**
 * @process specializations/domains/business/operations/iso-9001-implementation
 * @description ISO 9001 Implementation Process - Implement ISO 9001:2015 Quality Management System requirements
 * including documentation, processes, and internal audits for organizational quality excellence.
 * @inputs { organizationName: string, scope?: string, currentMaturity?: string, targetCertification?: boolean }
 * @outputs { success: boolean, qmsDocumentation: object, gapAnalysis: object, implementationPlan: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/operations/iso-9001-implementation', {
 *   organizationName: 'ABC Manufacturing',
 *   scope: 'Manufacturing and Assembly Operations',
 *   currentMaturity: 'informal',
 *   targetCertification: true
 * });
 *
 * @references
 * - ISO 9001:2015 Quality Management Systems - Requirements
 * - ISO 9000:2015 Quality Management Systems - Fundamentals and vocabulary
 * - ISO 19011:2018 Guidelines for auditing management systems
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationName,
    scope = 'all operations',
    currentMaturity = 'informal',
    targetCertification = true,
    timeline = '12-months',
    outputDir = 'iso9001-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting ISO 9001:2015 Implementation for: ${organizationName}`);

  // Phase 1: Management Commitment
  ctx.log('info', 'Phase 1: Management Commitment and Leadership');
  const commitment = await ctx.task(managementCommitmentTask, {
    organizationName,
    scope,
    targetCertification,
    outputDir
  });

  artifacts.push(...commitment.artifacts);

  // Phase 2: Gap Analysis
  ctx.log('info', 'Phase 2: Gap Analysis against ISO 9001:2015');
  const gapAnalysis = await ctx.task(gapAnalysisTask, {
    organizationName,
    scope,
    currentMaturity,
    outputDir
  });

  artifacts.push(...gapAnalysis.artifacts);

  // Quality Gate: Gap Analysis Review
  await ctx.breakpoint({
    question: `Gap analysis complete. Overall conformity: ${gapAnalysis.overallConformity}%. ${gapAnalysis.majorGaps} major gaps, ${gapAnalysis.minorGaps} minor gaps identified. Review gaps before planning?`,
    title: 'ISO 9001 Gap Analysis Review',
    context: {
      runId: ctx.runId,
      organizationName,
      conformityByClause: gapAnalysis.conformityByClause,
      priorityGaps: gapAnalysis.priorityGaps,
      files: gapAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 3: Context and Scope Definition
  ctx.log('info', 'Phase 3: Context of the Organization');
  const contextDefinition = await ctx.task(contextDefinitionTask, {
    organizationName,
    scope,
    gapAnalysis,
    outputDir
  });

  artifacts.push(...contextDefinition.artifacts);

  // Phase 4: Process Mapping
  ctx.log('info', 'Phase 4: Process Identification and Mapping');
  const processMapping = await ctx.task(processMappingTask, {
    organizationName,
    scope,
    outputDir
  });

  artifacts.push(...processMapping.artifacts);

  // Phase 5: Risk-Based Thinking
  ctx.log('info', 'Phase 5: Risk Assessment and Opportunities');
  const riskAssessment = await ctx.task(riskAssessmentTask, {
    organizationName,
    processMapping,
    outputDir
  });

  artifacts.push(...riskAssessment.artifacts);

  // Phase 6: Documentation Development
  ctx.log('info', 'Phase 6: QMS Documentation Development');
  const documentation = await ctx.task(documentationTask, {
    organizationName,
    scope,
    contextDefinition,
    processMapping,
    riskAssessment,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // Quality Gate: Documentation Review
  await ctx.breakpoint({
    question: `QMS documentation developed. Quality Manual: ${documentation.qualityManual ? 'Complete' : 'Pending'}. Procedures: ${documentation.procedureCount}. Work Instructions: ${documentation.workInstructionCount}. Review documentation structure?`,
    title: 'QMS Documentation Review',
    context: {
      runId: ctx.runId,
      organizationName,
      documentHierarchy: documentation.documentHierarchy,
      mandatoryDocuments: documentation.mandatoryDocuments,
      files: documentation.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 7: Implementation Planning
  ctx.log('info', 'Phase 7: Implementation Planning');
  const implementationPlan = await ctx.task(implementationPlanTask, {
    organizationName,
    gapAnalysis,
    documentation,
    timeline,
    outputDir
  });

  artifacts.push(...implementationPlan.artifacts);

  // Phase 8: Training Program
  ctx.log('info', 'Phase 8: Training and Awareness Program');
  const trainingProgram = await ctx.task(trainingProgramTask, {
    organizationName,
    documentation,
    outputDir
  });

  artifacts.push(...trainingProgram.artifacts);

  // Phase 9: Internal Audit Program
  ctx.log('info', 'Phase 9: Internal Audit Program Development');
  const auditProgram = await ctx.task(internalAuditProgramTask, {
    organizationName,
    processMapping,
    documentation,
    outputDir
  });

  artifacts.push(...auditProgram.artifacts);

  // Phase 10: Management Review
  ctx.log('info', 'Phase 10: Management Review Process');
  const managementReview = await ctx.task(managementReviewTask, {
    organizationName,
    outputDir
  });

  artifacts.push(...managementReview.artifacts);

  // Phase 11: Certification Readiness (if applicable)
  let certificationReadiness = null;
  if (targetCertification) {
    ctx.log('info', 'Phase 11: Certification Readiness Assessment');
    certificationReadiness = await ctx.task(certificationReadinessTask, {
      organizationName,
      documentation,
      auditProgram,
      outputDir
    });

    artifacts.push(...certificationReadiness.artifacts);
  }

  // Phase 12: Report Generation
  ctx.log('info', 'Phase 12: Implementation Report Generation');
  const report = await ctx.task(reportTask, {
    organizationName,
    commitment,
    gapAnalysis,
    contextDefinition,
    processMapping,
    riskAssessment,
    documentation,
    implementationPlan,
    trainingProgram,
    auditProgram,
    managementReview,
    certificationReadiness,
    outputDir
  });

  artifacts.push(...report.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    organizationName,
    scope,
    qmsDocumentation: {
      qualityPolicy: documentation.qualityPolicy,
      qualityObjectives: documentation.qualityObjectives,
      procedures: documentation.procedureCount,
      workInstructions: documentation.workInstructionCount,
      forms: documentation.formCount
    },
    gapAnalysis: {
      overallConformity: gapAnalysis.overallConformity,
      majorGaps: gapAnalysis.majorGaps,
      minorGaps: gapAnalysis.minorGaps,
      conformityByClause: gapAnalysis.conformityByClause
    },
    riskAssessment: {
      totalRisks: riskAssessment.totalRisks,
      highRisks: riskAssessment.highRisks,
      opportunities: riskAssessment.opportunities
    },
    implementationPlan: {
      phases: implementationPlan.phases,
      timeline: implementationPlan.timeline,
      milestones: implementationPlan.milestones
    },
    certificationReadiness: certificationReadiness ? {
      readinessScore: certificationReadiness.readinessScore,
      readyForCertification: certificationReadiness.readyForCertification,
      openItems: certificationReadiness.openItems
    } : null,
    artifacts,
    reportPath: report.reportPath,
    duration,
    metadata: {
      processId: 'specializations/domains/business/operations/iso-9001-implementation',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Management Commitment
export const managementCommitmentTask = defineTask('iso9001-commitment', (args, taskCtx) => ({
  kind: 'agent',
  title: `ISO 9001 Management Commitment - ${args.organizationName}`,
  agent: {
    name: 'qms-consultant',
    prompt: {
      role: 'ISO 9001 Lead Implementer',
      task: 'Establish management commitment and leadership',
      context: args,
      instructions: [
        '1. Present ISO 9001 business case to leadership',
        '2. Obtain top management commitment',
        '3. Appoint Management Representative',
        '4. Define QMS scope and exclusions',
        '5. Establish quality policy',
        '6. Define quality objectives',
        '7. Allocate resources for implementation',
        '8. Establish implementation steering committee',
        '9. Communicate commitment to organization',
        '10. Document leadership commitment'
      ],
      outputFormat: 'JSON with management commitment details'
    },
    outputSchema: {
      type: 'object',
      required: ['commitmentObtained', 'managementRep', 'qualityPolicy', 'artifacts'],
      properties: {
        commitmentObtained: { type: 'boolean' },
        managementRep: { type: 'object' },
        qualityPolicy: { type: 'string' },
        qualityObjectives: { type: 'array', items: { type: 'object' } },
        resourcesAllocated: { type: 'object' },
        steeringCommittee: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'iso9001', 'leadership']
}));

// Task 2: Gap Analysis
export const gapAnalysisTask = defineTask('iso9001-gap-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `ISO 9001 Gap Analysis - ${args.organizationName}`,
  agent: {
    name: 'gap-analyst',
    prompt: {
      role: 'ISO 9001 Auditor',
      task: 'Conduct gap analysis against ISO 9001:2015 requirements',
      context: args,
      instructions: [
        '1. Review all ISO 9001:2015 clauses (4-10)',
        '2. Assess Clause 4: Context of the organization',
        '3. Assess Clause 5: Leadership',
        '4. Assess Clause 6: Planning',
        '5. Assess Clause 7: Support',
        '6. Assess Clause 8: Operation',
        '7. Assess Clause 9: Performance evaluation',
        '8. Assess Clause 10: Improvement',
        '9. Rate conformity for each requirement',
        '10. Prioritize gaps and create action plan'
      ],
      outputFormat: 'JSON with gap analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['overallConformity', 'conformityByClause', 'majorGaps', 'minorGaps', 'priorityGaps', 'artifacts'],
      properties: {
        overallConformity: { type: 'number' },
        conformityByClause: { type: 'object' },
        majorGaps: { type: 'number' },
        minorGaps: { type: 'number' },
        gapDetails: { type: 'array', items: { type: 'object' } },
        priorityGaps: { type: 'array', items: { type: 'object' } },
        actionPlan: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'iso9001', 'gap-analysis']
}));

// Task 3: Context Definition
export const contextDefinitionTask = defineTask('iso9001-context', (args, taskCtx) => ({
  kind: 'agent',
  title: `ISO 9001 Context Definition - ${args.organizationName}`,
  agent: {
    name: 'context-analyst',
    prompt: {
      role: 'Business Analyst',
      task: 'Define context of the organization per ISO 9001 Clause 4',
      context: args,
      instructions: [
        '1. Identify external issues (PESTLE analysis)',
        '2. Identify internal issues (strengths, weaknesses)',
        '3. Identify interested parties and their requirements',
        '4. Define QMS scope and boundaries',
        '5. Document any exclusions with justification',
        '6. Map QMS processes and interactions',
        '7. Determine process sequence and interactions',
        '8. Document context of organization',
        '9. Review with leadership',
        '10. Finalize scope statement'
      ],
      outputFormat: 'JSON with context analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['externalIssues', 'internalIssues', 'interestedParties', 'scope', 'artifacts'],
      properties: {
        externalIssues: { type: 'array', items: { type: 'object' } },
        internalIssues: { type: 'array', items: { type: 'object' } },
        interestedParties: { type: 'array', items: { type: 'object' } },
        scope: { type: 'string' },
        exclusions: { type: 'array', items: { type: 'object' } },
        processMap: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'iso9001', 'context']
}));

// Task 4: Process Mapping
export const processMappingTask = defineTask('iso9001-process-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: `ISO 9001 Process Mapping - ${args.organizationName}`,
  agent: {
    name: 'process-mapper',
    prompt: {
      role: 'Process Engineer',
      task: 'Identify and map QMS processes',
      context: args,
      instructions: [
        '1. Identify management processes',
        '2. Identify core/operational processes',
        '3. Identify support processes',
        '4. Define process inputs and outputs',
        '5. Identify process owners',
        '6. Define process metrics/KPIs',
        '7. Map process interactions (turtle diagram)',
        '8. Identify resources needed per process',
        '9. Document process risks and opportunities',
        '10. Create process landscape diagram'
      ],
      outputFormat: 'JSON with process mapping'
    },
    outputSchema: {
      type: 'object',
      required: ['processes', 'processCategories', 'processInteractions', 'artifacts'],
      properties: {
        processes: { type: 'array', items: { type: 'object' } },
        processCategories: {
          type: 'object',
          properties: {
            management: { type: 'array', items: { type: 'object' } },
            core: { type: 'array', items: { type: 'object' } },
            support: { type: 'array', items: { type: 'object' } }
          }
        },
        processInteractions: { type: 'object' },
        processLandscape: { type: 'object' },
        turtleDiagrams: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'iso9001', 'process-mapping']
}));

// Task 5: Risk Assessment
export const riskAssessmentTask = defineTask('iso9001-risk', (args, taskCtx) => ({
  kind: 'agent',
  title: `ISO 9001 Risk Assessment - ${args.organizationName}`,
  agent: {
    name: 'risk-assessor',
    prompt: {
      role: 'Risk Management Specialist',
      task: 'Conduct risk-based thinking assessment per ISO 9001 Clause 6.1',
      context: args,
      instructions: [
        '1. Identify risks for each QMS process',
        '2. Identify opportunities for improvement',
        '3. Assess risk likelihood and impact',
        '4. Prioritize risks',
        '5. Develop risk treatment plans',
        '6. Plan actions to address risks',
        '7. Plan actions to seize opportunities',
        '8. Integrate into QMS processes',
        '9. Define monitoring and review',
        '10. Document risk register'
      ],
      outputFormat: 'JSON with risk assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['totalRisks', 'highRisks', 'opportunities', 'riskRegister', 'artifacts'],
      properties: {
        totalRisks: { type: 'number' },
        highRisks: { type: 'number' },
        mediumRisks: { type: 'number' },
        lowRisks: { type: 'number' },
        opportunities: { type: 'array', items: { type: 'object' } },
        riskRegister: { type: 'array', items: { type: 'object' } },
        treatmentPlans: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'iso9001', 'risk']
}));

// Task 6: Documentation
export const documentationTask = defineTask('iso9001-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `ISO 9001 Documentation - ${args.organizationName}`,
  agent: {
    name: 'documentation-specialist',
    prompt: {
      role: 'QMS Documentation Specialist',
      task: 'Develop QMS documentation',
      context: args,
      instructions: [
        '1. Define document hierarchy',
        '2. Create quality manual (optional but recommended)',
        '3. Develop mandatory documented information',
        '4. Create quality policy and objectives documents',
        '5. Develop procedures for key processes',
        '6. Create work instructions where needed',
        '7. Design forms and records templates',
        '8. Establish document control procedure',
        '9. Establish record control procedure',
        '10. Create document master list'
      ],
      outputFormat: 'JSON with documentation details'
    },
    outputSchema: {
      type: 'object',
      required: ['qualityPolicy', 'qualityObjectives', 'procedureCount', 'workInstructionCount', 'documentHierarchy', 'artifacts'],
      properties: {
        qualityManual: { type: 'boolean' },
        qualityPolicy: { type: 'string' },
        qualityObjectives: { type: 'array', items: { type: 'object' } },
        procedureCount: { type: 'number' },
        workInstructionCount: { type: 'number' },
        formCount: { type: 'number' },
        documentHierarchy: { type: 'object' },
        mandatoryDocuments: { type: 'array', items: { type: 'object' } },
        documentMasterList: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'iso9001', 'documentation']
}));

// Task 7: Implementation Plan
export const implementationPlanTask = defineTask('iso9001-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `ISO 9001 Implementation Plan - ${args.organizationName}`,
  agent: {
    name: 'implementation-planner',
    prompt: {
      role: 'Project Manager',
      task: 'Develop QMS implementation plan',
      context: args,
      instructions: [
        '1. Define implementation phases',
        '2. Create detailed timeline',
        '3. Assign responsibilities',
        '4. Define milestones',
        '5. Plan resource allocation',
        '6. Create communication plan',
        '7. Define success criteria',
        '8. Plan change management',
        '9. Establish governance',
        '10. Document implementation plan'
      ],
      outputFormat: 'JSON with implementation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'timeline', 'milestones', 'artifacts'],
      properties: {
        phases: { type: 'array', items: { type: 'object' } },
        timeline: { type: 'object' },
        milestones: { type: 'array', items: { type: 'object' } },
        responsibilities: { type: 'object' },
        resources: { type: 'object' },
        successCriteria: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'iso9001', 'implementation']
}));

// Task 8: Training Program
export const trainingProgramTask = defineTask('iso9001-training', (args, taskCtx) => ({
  kind: 'agent',
  title: `ISO 9001 Training Program - ${args.organizationName}`,
  agent: {
    name: 'training-developer',
    prompt: {
      role: 'Training Developer',
      task: 'Develop QMS training and awareness program',
      context: args,
      instructions: [
        '1. Identify training needs by role',
        '2. Develop ISO 9001 awareness training',
        '3. Develop quality policy/objectives training',
        '4. Create process-specific training',
        '5. Develop internal auditor training',
        '6. Create training materials',
        '7. Plan training schedule',
        '8. Define competency requirements',
        '9. Plan training effectiveness evaluation',
        '10. Document training program'
      ],
      outputFormat: 'JSON with training program'
    },
    outputSchema: {
      type: 'object',
      required: ['trainingNeeds', 'trainingModules', 'schedule', 'artifacts'],
      properties: {
        trainingNeeds: { type: 'array', items: { type: 'object' } },
        trainingModules: { type: 'array', items: { type: 'object' } },
        schedule: { type: 'object' },
        materials: { type: 'array', items: { type: 'object' } },
        competencyMatrix: { type: 'object' },
        evaluationPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'iso9001', 'training']
}));

// Task 9: Internal Audit Program
export const internalAuditProgramTask = defineTask('iso9001-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: `ISO 9001 Internal Audit Program - ${args.organizationName}`,
  agent: {
    name: 'audit-manager',
    prompt: {
      role: 'Internal Audit Manager',
      task: 'Develop internal audit program per ISO 9001 Clause 9.2',
      context: args,
      instructions: [
        '1. Develop audit procedure',
        '2. Create annual audit program/schedule',
        '3. Define audit criteria and scope',
        '4. Develop audit checklists',
        '5. Train internal auditors',
        '6. Plan audit resources',
        '7. Define audit reporting templates',
        '8. Establish nonconformity handling',
        '9. Plan corrective action follow-up',
        '10. Document audit program'
      ],
      outputFormat: 'JSON with audit program'
    },
    outputSchema: {
      type: 'object',
      required: ['auditProcedure', 'auditSchedule', 'checklists', 'artifacts'],
      properties: {
        auditProcedure: { type: 'object' },
        auditSchedule: { type: 'array', items: { type: 'object' } },
        checklists: { type: 'array', items: { type: 'object' } },
        auditorPool: { type: 'array', items: { type: 'object' } },
        reportingTemplates: { type: 'array', items: { type: 'object' } },
        ncHandling: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'iso9001', 'audit']
}));

// Task 10: Management Review
export const managementReviewTask = defineTask('iso9001-mgmt-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `ISO 9001 Management Review - ${args.organizationName}`,
  agent: {
    name: 'mgmt-review-planner',
    prompt: {
      role: 'Quality Manager',
      task: 'Establish management review process per ISO 9001 Clause 9.3',
      context: args,
      instructions: [
        '1. Define management review procedure',
        '2. Establish review frequency',
        '3. Define required inputs per ISO 9001',
        '4. Define expected outputs',
        '5. Create agenda template',
        '6. Create minutes template',
        '7. Define attendees',
        '8. Establish action tracking',
        '9. Plan first management review',
        '10. Document management review process'
      ],
      outputFormat: 'JSON with management review process'
    },
    outputSchema: {
      type: 'object',
      required: ['reviewProcedure', 'inputs', 'outputs', 'artifacts'],
      properties: {
        reviewProcedure: { type: 'object' },
        frequency: { type: 'string' },
        inputs: { type: 'array', items: { type: 'string' } },
        outputs: { type: 'array', items: { type: 'string' } },
        agendaTemplate: { type: 'object' },
        minutesTemplate: { type: 'object' },
        attendees: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'iso9001', 'management-review']
}));

// Task 11: Certification Readiness
export const certificationReadinessTask = defineTask('iso9001-certification', (args, taskCtx) => ({
  kind: 'agent',
  title: `ISO 9001 Certification Readiness - ${args.organizationName}`,
  agent: {
    name: 'certification-assessor',
    prompt: {
      role: 'Certification Readiness Assessor',
      task: 'Assess certification readiness',
      context: args,
      instructions: [
        '1. Verify QMS fully implemented',
        '2. Verify all mandatory documents in place',
        '3. Verify internal audits completed',
        '4. Verify management review completed',
        '5. Check corrective actions closed',
        '6. Verify at least 3 months operating history',
        '7. Conduct pre-assessment audit',
        '8. Identify open items',
        '9. Select certification body',
        '10. Create certification timeline'
      ],
      outputFormat: 'JSON with certification readiness'
    },
    outputSchema: {
      type: 'object',
      required: ['readinessScore', 'readyForCertification', 'openItems', 'artifacts'],
      properties: {
        readinessScore: { type: 'number' },
        readyForCertification: { type: 'boolean' },
        openItems: { type: 'array', items: { type: 'object' } },
        preAssessmentFindings: { type: 'array', items: { type: 'object' } },
        certificationTimeline: { type: 'object' },
        recommendedCBs: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'iso9001', 'certification']
}));

// Task 12: Report
export const reportTask = defineTask('iso9001-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `ISO 9001 Implementation Report - ${args.organizationName}`,
  agent: {
    name: 'report-writer',
    prompt: {
      role: 'Technical Report Writer',
      task: 'Generate ISO 9001 implementation report',
      context: args,
      instructions: [
        '1. Write executive summary',
        '2. Document gap analysis results',
        '3. Present QMS documentation',
        '4. Document process mapping',
        '5. Present risk assessment',
        '6. Detail implementation plan',
        '7. Document training program',
        '8. Present audit program',
        '9. Include certification readiness',
        '10. Format professionally'
      ],
      outputFormat: 'JSON with report details'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyDeliverables: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'iso9001', 'reporting']
}));
