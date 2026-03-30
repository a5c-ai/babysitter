/**
 * @process specializations/domains/social-sciences-humanities/healthcare/clinical-documentation-improvement
 * @description Clinical Documentation Improvement (CDI) - Program to improve accuracy and completeness of
 * clinical documentation through concurrent review, provider education, and query processes.
 * @inputs { organizationName: string, scope?: string, focusAreas?: array, currentMetrics?: object }
 * @outputs { success: boolean, cdiProgram: object, queryProcess: object, metrics: object, artifacts: array }
 * @recommendedSkills SK-HC-011 (clinical-documentation-query), SK-HC-004 (medical-coding-audit), SK-HC-002 (quality-metrics-measurement)
 * @recommendedAgents AG-HC-008 (documentation-integrity-specialist), AG-HC-003 (revenue-integrity-analyst)
 *
 * @example
 * const result = await orchestrate('specializations/domains/social-sciences-humanities/healthcare/clinical-documentation-improvement', {
 *   organizationName: 'Regional Medical Center',
 *   scope: 'inpatient',
 *   focusAreas: ['sepsis', 'heart failure', 'malnutrition', 'respiratory failure'],
 *   currentMetrics: { cmi: 1.85, queryRate: 15, responseRate: 72 }
 * });
 *
 * @references
 * - AHIMA CDI Practice Guidelines
 * - ACDIS CDI Standards
 * - CMS Documentation Requirements
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationName,
    scope = 'inpatient',
    focusAreas = [],
    currentMetrics = {},
    staffing = {},
    outputDir = 'cdi-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting CDI Program Development for: ${organizationName}`);

  // Phase 1: Current State Assessment
  ctx.log('info', 'Phase 1: Current State Assessment');
  const currentStateAssessment = await ctx.task(cdiCurrentStateTask, {
    organizationName,
    scope,
    currentMetrics,
    outputDir
  });

  artifacts.push(...currentStateAssessment.artifacts);

  await ctx.breakpoint({
    question: `Current state assessed. CMI: ${currentStateAssessment.currentCMI}. Query rate: ${currentStateAssessment.queryRate}%. ${currentStateAssessment.opportunities.length} improvement opportunities identified. Proceed?`,
    title: 'CDI Current State Review',
    context: {
      runId: ctx.runId,
      metrics: currentStateAssessment.metrics,
      opportunities: currentStateAssessment.opportunities,
      files: currentStateAssessment.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 2: Focus Area Prioritization
  ctx.log('info', 'Phase 2: Focus Area Prioritization');
  const focusAreaPrioritization = await ctx.task(focusAreaPrioritizationTask, {
    currentStateAssessment,
    focusAreas,
    outputDir
  });

  artifacts.push(...focusAreaPrioritization.artifacts);

  // Phase 3: Query Process Design
  ctx.log('info', 'Phase 3: Query Process Design');
  const queryProcessDesign = await ctx.task(queryProcessDesignTask, {
    focusAreaPrioritization,
    scope,
    outputDir
  });

  artifacts.push(...queryProcessDesign.artifacts);

  // Phase 4: CDI Workflow Design
  ctx.log('info', 'Phase 4: CDI Workflow Design');
  const workflowDesign = await ctx.task(cdiWorkflowDesignTask, {
    queryProcessDesign,
    staffing,
    outputDir
  });

  artifacts.push(...workflowDesign.artifacts);

  await ctx.breakpoint({
    question: `Query process designed with ${queryProcessDesign.queryTemplates.length} templates. Workflow covers ${workflowDesign.reviewSteps.length} review steps. Proceed with education planning?`,
    title: 'CDI Process Design Review',
    context: {
      runId: ctx.runId,
      queryTemplates: queryProcessDesign.queryTemplates,
      workflow: workflowDesign.workflow,
      files: [...queryProcessDesign.artifacts, ...workflowDesign.artifacts].map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 5: Provider Education Program
  ctx.log('info', 'Phase 5: Provider Education Program');
  const providerEducation = await ctx.task(providerEducationTask, {
    focusAreaPrioritization,
    currentStateAssessment,
    outputDir
  });

  artifacts.push(...providerEducation.artifacts);

  // Phase 6: Technology Support
  ctx.log('info', 'Phase 6: Technology Support Planning');
  const technologySupport = await ctx.task(cdiTechnologyTask, {
    workflowDesign,
    queryProcessDesign,
    outputDir
  });

  artifacts.push(...technologySupport.artifacts);

  // Phase 7: Quality Assurance Program
  ctx.log('info', 'Phase 7: Quality Assurance Program');
  const qaProgram = await ctx.task(cdiQualityAssuranceTask, {
    workflowDesign,
    queryProcessDesign,
    outputDir
  });

  artifacts.push(...qaProgram.artifacts);

  // Phase 8: Metrics and Reporting
  ctx.log('info', 'Phase 8: Metrics and Reporting Design');
  const metricsReporting = await ctx.task(cdiMetricsReportingTask, {
    currentStateAssessment,
    focusAreaPrioritization,
    outputDir
  });

  artifacts.push(...metricsReporting.artifacts);

  // Phase 9: Implementation Plan
  ctx.log('info', 'Phase 9: Implementation Planning');
  const implementationPlan = await ctx.task(cdiImplementationTask, {
    workflowDesign,
    providerEducation,
    technologySupport,
    staffing,
    outputDir
  });

  artifacts.push(...implementationPlan.artifacts);

  // Phase 10: CDI Program Documentation
  ctx.log('info', 'Phase 10: CDI Program Documentation');
  const programDocumentation = await ctx.task(cdiProgramDocumentationTask, {
    organizationName,
    currentStateAssessment,
    focusAreaPrioritization,
    queryProcessDesign,
    workflowDesign,
    providerEducation,
    technologySupport,
    qaProgram,
    metricsReporting,
    implementationPlan,
    outputDir
  });

  artifacts.push(...programDocumentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    organizationName,
    cdiProgram: {
      scope: scope,
      focusAreas: focusAreaPrioritization.prioritizedAreas,
      workflow: workflowDesign.workflow,
      staffingModel: workflowDesign.staffingModel
    },
    queryProcess: {
      templates: queryProcessDesign.queryTemplates,
      complianceGuidelines: queryProcessDesign.complianceGuidelines,
      escalationProcess: queryProcessDesign.escalationProcess
    },
    providerEducation: providerEducation.program,
    metrics: {
      kpis: metricsReporting.kpis,
      targets: metricsReporting.targets,
      dashboard: metricsReporting.dashboard
    },
    qaProgram: qaProgram.program,
    implementationPlan: implementationPlan.plan,
    artifacts,
    documentationPath: programDocumentation.documentPath,
    duration,
    metadata: {
      processId: 'specializations/domains/social-sciences-humanities/healthcare/clinical-documentation-improvement',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task definitions
export const cdiCurrentStateTask = defineTask('cdi-current-state', (args, taskCtx) => ({
  kind: 'agent',
  title: `CDI Current State - ${args.organizationName}`,
  agent: {
    name: 'cdi-analyst',
    prompt: {
      role: 'CDI Program Analyst',
      task: 'Assess current state of clinical documentation',
      context: args,
      instructions: [
        '1. Review current CMI and DRG distribution',
        '2. Analyze query rates and response rates',
        '3. Review documentation audit results',
        '4. Assess current CDI staffing',
        '5. Evaluate existing query process',
        '6. Review denial rates by reason',
        '7. Analyze CC/MCC capture rates',
        '8. Identify documentation gaps',
        '9. Benchmark against peers',
        '10. Document improvement opportunities'
      ],
      outputFormat: 'JSON with current state assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['currentCMI', 'queryRate', 'metrics', 'opportunities', 'artifacts'],
      properties: {
        currentCMI: { type: 'number' },
        queryRate: { type: 'number' },
        responseRate: { type: 'number' },
        metrics: { type: 'object' },
        drgDistribution: { type: 'object' },
        ccMccCapture: { type: 'object' },
        gaps: { type: 'array', items: { type: 'object' } },
        opportunities: { type: 'array', items: { type: 'object' } },
        benchmarks: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cdi', 'assessment', 'healthcare']
}));

export const focusAreaPrioritizationTask = defineTask('cdi-focus-areas', (args, taskCtx) => ({
  kind: 'agent',
  title: 'CDI Focus Area Prioritization',
  agent: {
    name: 'cdi-strategist',
    prompt: {
      role: 'CDI Program Strategist',
      task: 'Prioritize CDI focus areas',
      context: args,
      instructions: [
        '1. Analyze diagnosis-specific opportunities',
        '2. Prioritize by financial impact',
        '3. Assess quality measure impact',
        '4. Consider regulatory requirements',
        '5. Evaluate documentation complexity',
        '6. Assess provider engagement likelihood',
        '7. Consider technology support needs',
        '8. Prioritize focus areas',
        '9. Define success criteria per area',
        '10. Create focus area roadmap'
      ],
      outputFormat: 'JSON with prioritized focus areas'
    },
    outputSchema: {
      type: 'object',
      required: ['prioritizedAreas', 'financialImpact', 'artifacts'],
      properties: {
        prioritizedAreas: { type: 'array', items: { type: 'object' } },
        financialImpact: { type: 'object' },
        qualityImpact: { type: 'object' },
        regulatoryConsiderations: { type: 'array', items: { type: 'object' } },
        successCriteria: { type: 'object' },
        roadmap: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cdi', 'focus-areas', 'healthcare']
}));

export const queryProcessDesignTask = defineTask('cdi-query-process', (args, taskCtx) => ({
  kind: 'agent',
  title: 'CDI Query Process Design',
  agent: {
    name: 'query-specialist',
    prompt: {
      role: 'CDI Query Specialist',
      task: 'Design compliant query process',
      context: args,
      instructions: [
        '1. Define compliant query criteria',
        '2. Create query templates by diagnosis',
        '3. Design query workflow',
        '4. Define query escalation process',
        '5. Create response tracking mechanism',
        '6. Design reminder/follow-up process',
        '7. Define quality review criteria',
        '8. Plan compliance monitoring',
        '9. Create query metrics',
        '10. Document query guidelines'
      ],
      outputFormat: 'JSON with query process'
    },
    outputSchema: {
      type: 'object',
      required: ['queryTemplates', 'complianceGuidelines', 'escalationProcess', 'artifacts'],
      properties: {
        queryTemplates: { type: 'array', items: { type: 'object' } },
        complianceGuidelines: { type: 'object' },
        queryWorkflow: { type: 'object' },
        escalationProcess: { type: 'object' },
        responseTracking: { type: 'object' },
        qualityCriteria: { type: 'array', items: { type: 'object' } },
        metrics: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cdi', 'query', 'healthcare']
}));

export const cdiWorkflowDesignTask = defineTask('cdi-workflow', (args, taskCtx) => ({
  kind: 'agent',
  title: 'CDI Workflow Design',
  agent: {
    name: 'workflow-designer',
    prompt: {
      role: 'CDI Workflow Designer',
      task: 'Design CDI review workflow',
      context: args,
      instructions: [
        '1. Define concurrent review workflow',
        '2. Design retrospective review process',
        '3. Create case prioritization criteria',
        '4. Define review frequency',
        '5. Design coding collaboration process',
        '6. Create reconciliation workflow',
        '7. Define staffing model',
        '8. Design productivity standards',
        '9. Create escalation process',
        '10. Document workflow procedures'
      ],
      outputFormat: 'JSON with CDI workflow'
    },
    outputSchema: {
      type: 'object',
      required: ['workflow', 'reviewSteps', 'staffingModel', 'artifacts'],
      properties: {
        workflow: { type: 'object' },
        reviewSteps: { type: 'array', items: { type: 'object' } },
        concurrentReview: { type: 'object' },
        retrospectiveReview: { type: 'object' },
        prioritizationCriteria: { type: 'array', items: { type: 'object' } },
        codingCollaboration: { type: 'object' },
        staffingModel: { type: 'object' },
        productivityStandards: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cdi', 'workflow', 'healthcare']
}));

export const providerEducationTask = defineTask('cdi-provider-education', (args, taskCtx) => ({
  kind: 'agent',
  title: 'CDI Provider Education',
  agent: {
    name: 'clinical-educator',
    prompt: {
      role: 'CDI Clinical Educator',
      task: 'Design provider education program',
      context: args,
      instructions: [
        '1. Define education objectives',
        '2. Create diagnosis-specific education',
        '3. Design documentation tip sheets',
        '4. Plan provider orientation',
        '5. Create ongoing education plan',
        '6. Design feedback mechanisms',
        '7. Plan individual coaching',
        '8. Create educational resources',
        '9. Design CME offerings',
        '10. Document education program'
      ],
      outputFormat: 'JSON with education program'
    },
    outputSchema: {
      type: 'object',
      required: ['program', 'modules', 'resources', 'artifacts'],
      properties: {
        program: { type: 'object' },
        objectives: { type: 'array', items: { type: 'string' } },
        modules: { type: 'array', items: { type: 'object' } },
        tipSheets: { type: 'array', items: { type: 'object' } },
        resources: { type: 'array', items: { type: 'object' } },
        coachingPlan: { type: 'object' },
        cmeOfferings: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cdi', 'education', 'healthcare']
}));

export const cdiTechnologyTask = defineTask('cdi-technology', (args, taskCtx) => ({
  kind: 'agent',
  title: 'CDI Technology Support',
  agent: {
    name: 'health-it-specialist',
    prompt: {
      role: 'CDI Technology Specialist',
      task: 'Plan CDI technology support',
      context: args,
      instructions: [
        '1. Assess CDI software needs',
        '2. Plan EHR integration',
        '3. Design NLP/AI support',
        '4. Plan worklist automation',
        '5. Design query delivery system',
        '6. Plan reporting automation',
        '7. Design analytics capabilities',
        '8. Plan encoder integration',
        '9. Design productivity tracking',
        '10. Document technology requirements'
      ],
      outputFormat: 'JSON with technology plan'
    },
    outputSchema: {
      type: 'object',
      required: ['technologyPlan', 'requirements', 'artifacts'],
      properties: {
        technologyPlan: { type: 'object' },
        softwareNeeds: { type: 'array', items: { type: 'object' } },
        ehrIntegration: { type: 'object' },
        aiNlpCapabilities: { type: 'object' },
        requirements: { type: 'array', items: { type: 'object' } },
        reportingAutomation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cdi', 'technology', 'healthcare']
}));

export const cdiQualityAssuranceTask = defineTask('cdi-qa', (args, taskCtx) => ({
  kind: 'agent',
  title: 'CDI Quality Assurance',
  agent: {
    name: 'qa-specialist',
    prompt: {
      role: 'CDI Quality Assurance Specialist',
      task: 'Design CDI quality assurance program',
      context: args,
      instructions: [
        '1. Define QA metrics',
        '2. Design query quality review',
        '3. Create accuracy audits',
        '4. Plan inter-rater reliability',
        '5. Design feedback process',
        '6. Plan calibration sessions',
        '7. Create corrective action process',
        '8. Design compliance monitoring',
        '9. Plan external audits',
        '10. Document QA program'
      ],
      outputFormat: 'JSON with QA program'
    },
    outputSchema: {
      type: 'object',
      required: ['program', 'metrics', 'auditProcess', 'artifacts'],
      properties: {
        program: { type: 'object' },
        metrics: { type: 'array', items: { type: 'object' } },
        queryQualityReview: { type: 'object' },
        auditProcess: { type: 'object' },
        interRaterReliability: { type: 'object' },
        calibrationProcess: { type: 'object' },
        complianceMonitoring: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cdi', 'quality-assurance', 'healthcare']
}));

export const cdiMetricsReportingTask = defineTask('cdi-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'CDI Metrics and Reporting',
  agent: {
    name: 'metrics-analyst',
    prompt: {
      role: 'CDI Metrics Analyst',
      task: 'Design CDI metrics and reporting',
      context: args,
      instructions: [
        '1. Define productivity metrics',
        '2. Define quality metrics',
        '3. Define financial metrics',
        '4. Set targets for each metric',
        '5. Design CDI dashboard',
        '6. Plan reporting frequency',
        '7. Design provider scorecards',
        '8. Plan trend analysis',
        '9. Design executive reporting',
        '10. Document metrics program'
      ],
      outputFormat: 'JSON with metrics program'
    },
    outputSchema: {
      type: 'object',
      required: ['kpis', 'targets', 'dashboard', 'artifacts'],
      properties: {
        kpis: { type: 'array', items: { type: 'object' } },
        productivityMetrics: { type: 'array', items: { type: 'object' } },
        qualityMetrics: { type: 'array', items: { type: 'object' } },
        financialMetrics: { type: 'array', items: { type: 'object' } },
        targets: { type: 'object' },
        dashboard: { type: 'object' },
        providerScorecards: { type: 'object' },
        reportingCadence: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cdi', 'metrics', 'healthcare']
}));

export const cdiImplementationTask = defineTask('cdi-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'CDI Implementation Plan',
  agent: {
    name: 'implementation-manager',
    prompt: {
      role: 'CDI Implementation Manager',
      task: 'Plan CDI program implementation',
      context: args,
      instructions: [
        '1. Create implementation timeline',
        '2. Plan staffing/hiring',
        '3. Schedule training',
        '4. Plan technology implementation',
        '5. Design pilot approach',
        '6. Plan communication strategy',
        '7. Define success criteria',
        '8. Plan change management',
        '9. Create risk mitigation',
        '10. Document implementation plan'
      ],
      outputFormat: 'JSON with implementation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'timeline', 'milestones', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        timeline: { type: 'object' },
        milestones: { type: 'array', items: { type: 'object' } },
        staffingPlan: { type: 'object' },
        trainingSchedule: { type: 'object' },
        pilotStrategy: { type: 'object' },
        successCriteria: { type: 'array', items: { type: 'object' } },
        risks: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cdi', 'implementation', 'healthcare']
}));

export const cdiProgramDocumentationTask = defineTask('cdi-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'CDI Program Documentation',
  agent: {
    name: 'program-writer',
    prompt: {
      role: 'CDI Program Writer',
      task: 'Document CDI program',
      context: args,
      instructions: [
        '1. Write program overview',
        '2. Document scope and objectives',
        '3. Include workflow procedures',
        '4. Document query process',
        '5. Include education program',
        '6. Document QA program',
        '7. Include metrics specifications',
        '8. Document technology requirements',
        '9. Include implementation plan',
        '10. Format professionally'
      ],
      outputFormat: 'JSON with documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['documentPath', 'programSummary', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        programSummary: { type: 'object' },
        sections: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cdi', 'documentation', 'healthcare']
}));
