/**
 * @process specializations/domains/social-sciences-humanities/healthcare/ehr-implementation-methodology
 * @description EHR Implementation Methodology - Structured approach to planning, implementing, and optimizing
 * Electronic Health Record systems including workflow analysis, configuration, data migration, and go-live.
 * @inputs { organizationName: string, ehrVendor?: string, implementationScope?: string, timeline?: object }
 * @outputs { success: boolean, implementationPlan: object, workflowDesign: object, goLivePlan: object, artifacts: array }
 * @recommendedSkills SK-HC-006 (health-data-integration), SK-HC-001 (clinical-workflow-analysis), SK-HC-014 (clinical-decision-support-rules)
 * @recommendedAgents AG-HC-005 (clinical-informatics-specialist), AG-HC-007 (operations-excellence-director)
 *
 * @example
 * const result = await orchestrate('specializations/domains/social-sciences-humanities/healthcare/ehr-implementation-methodology', {
 *   organizationName: 'Community Health System',
 *   ehrVendor: 'Epic',
 *   implementationScope: 'inpatient and ambulatory',
 *   timeline: { startDate: '2024-01-01', goLiveDate: '2025-06-01' }
 * });
 *
 * @references
 * - HealthIT.gov EHR Implementation Steps
 * - KLAS EHR Implementation Best Practices
 * - HIMSS Stage 7 Framework
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationName,
    ehrVendor = 'TBD',
    implementationScope = 'enterprise',
    timeline = {},
    currentSystems = [],
    stakeholders = [],
    outputDir = 'ehr-implementation-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting EHR Implementation for: ${organizationName}`);

  // Phase 1: Readiness Assessment
  ctx.log('info', 'Phase 1: Organizational Readiness Assessment');
  const readinessAssessment = await ctx.task(readinessAssessmentTask, {
    organizationName,
    ehrVendor,
    currentSystems,
    outputDir
  });

  artifacts.push(...readinessAssessment.artifacts);

  await ctx.breakpoint({
    question: `Readiness assessment complete. Score: ${readinessAssessment.readinessScore}%. ${readinessAssessment.gaps.length} gaps identified. Proceed with workflow analysis?`,
    title: 'Readiness Assessment Review',
    context: {
      runId: ctx.runId,
      readinessScore: readinessAssessment.readinessScore,
      gaps: readinessAssessment.gaps,
      files: readinessAssessment.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 2: Workflow Analysis
  ctx.log('info', 'Phase 2: Current State Workflow Analysis');
  const workflowAnalysis = await ctx.task(workflowAnalysisTask, {
    organizationName,
    implementationScope,
    readinessAssessment,
    outputDir
  });

  artifacts.push(...workflowAnalysis.artifacts);

  // Phase 3: Future State Design
  ctx.log('info', 'Phase 3: Future State Workflow Design');
  const futureStateDesign = await ctx.task(futureStateWorkflowTask, {
    workflowAnalysis,
    ehrVendor,
    outputDir
  });

  artifacts.push(...futureStateDesign.artifacts);

  await ctx.breakpoint({
    question: `${workflowAnalysis.workflows.length} workflows analyzed. ${futureStateDesign.redesignedWorkflows.length} workflows redesigned. Proceed with system configuration planning?`,
    title: 'Workflow Design Review',
    context: {
      runId: ctx.runId,
      currentWorkflows: workflowAnalysis.workflows,
      futureWorkflows: futureStateDesign.redesignedWorkflows,
      files: [...workflowAnalysis.artifacts, ...futureStateDesign.artifacts].map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 4: System Configuration
  ctx.log('info', 'Phase 4: System Configuration Planning');
  const systemConfiguration = await ctx.task(systemConfigurationTask, {
    futureStateDesign,
    ehrVendor,
    implementationScope,
    outputDir
  });

  artifacts.push(...systemConfiguration.artifacts);

  // Phase 5: Data Migration Planning
  ctx.log('info', 'Phase 5: Data Migration Planning');
  const dataMigration = await ctx.task(dataMigrationTask, {
    currentSystems,
    ehrVendor,
    outputDir
  });

  artifacts.push(...dataMigration.artifacts);

  // Phase 6: Integration Design
  ctx.log('info', 'Phase 6: Integration Design');
  const integrationDesign = await ctx.task(integrationDesignTask, {
    currentSystems,
    ehrVendor,
    systemConfiguration,
    outputDir
  });

  artifacts.push(...integrationDesign.artifacts);

  await ctx.breakpoint({
    question: `${integrationDesign.interfaces.length} interfaces designed. Data migration plan covers ${dataMigration.dataElements.length} data elements. Proceed with training planning?`,
    title: 'Technical Design Review',
    context: {
      runId: ctx.runId,
      configuration: systemConfiguration.configurationAreas,
      integrations: integrationDesign.interfaces,
      migration: dataMigration.migrationPlan,
      files: [...systemConfiguration.artifacts, ...dataMigration.artifacts, ...integrationDesign.artifacts].map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 7: Training Program Design
  ctx.log('info', 'Phase 7: Training Program Design');
  const trainingProgram = await ctx.task(ehrTrainingProgramTask, {
    futureStateDesign,
    ehrVendor,
    implementationScope,
    outputDir
  });

  artifacts.push(...trainingProgram.artifacts);

  // Phase 8: Testing Strategy
  ctx.log('info', 'Phase 8: Testing Strategy Development');
  const testingStrategy = await ctx.task(testingStrategyTask, {
    systemConfiguration,
    integrationDesign,
    dataMigration,
    outputDir
  });

  artifacts.push(...testingStrategy.artifacts);

  // Phase 9: Go-Live Planning
  ctx.log('info', 'Phase 9: Go-Live Planning');
  const goLivePlan = await ctx.task(goLivePlanningTask, {
    timeline,
    trainingProgram,
    testingStrategy,
    outputDir
  });

  artifacts.push(...goLivePlan.artifacts);

  // Phase 10: Optimization Planning
  ctx.log('info', 'Phase 10: Post-Go-Live Optimization Planning');
  const optimizationPlan = await ctx.task(optimizationPlanningTask, {
    futureStateDesign,
    goLivePlan,
    outputDir
  });

  artifacts.push(...optimizationPlan.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    organizationName,
    ehrVendor,
    implementationPlan: {
      readiness: readinessAssessment.readinessScore,
      timeline: timeline,
      phases: goLivePlan.phases,
      milestones: goLivePlan.milestones
    },
    workflowDesign: {
      currentState: workflowAnalysis.workflows,
      futureState: futureStateDesign.redesignedWorkflows,
      changes: futureStateDesign.changes
    },
    technicalDesign: {
      configuration: systemConfiguration.configurationPlan,
      integrations: integrationDesign.interfaces,
      dataMigration: dataMigration.migrationPlan
    },
    goLivePlan: goLivePlan.plan,
    trainingProgram: trainingProgram.program,
    testingStrategy: testingStrategy.strategy,
    optimizationPlan: optimizationPlan.plan,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/social-sciences-humanities/healthcare/ehr-implementation-methodology',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task definitions follow the same pattern as previous processes
export const readinessAssessmentTask = defineTask('ehr-readiness', (args, taskCtx) => ({
  kind: 'agent',
  title: `EHR Readiness Assessment - ${args.organizationName}`,
  agent: {
    name: 'ehr-consultant',
    prompt: {
      role: 'EHR Implementation Consultant',
      task: 'Assess organizational readiness for EHR implementation',
      context: args,
      instructions: [
        '1. Assess leadership commitment and governance',
        '2. Evaluate IT infrastructure readiness',
        '3. Assess financial resources',
        '4. Evaluate change management capacity',
        '5. Assess clinical champion availability',
        '6. Review current technology literacy',
        '7. Evaluate vendor relationship readiness',
        '8. Assess project management capabilities',
        '9. Identify readiness gaps',
        '10. Calculate readiness score'
      ],
      outputFormat: 'JSON with readiness assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['readinessScore', 'gaps', 'recommendations', 'artifacts'],
      properties: {
        readinessScore: { type: 'number' },
        leadershipReadiness: { type: 'object' },
        infrastructureReadiness: { type: 'object' },
        financialReadiness: { type: 'object' },
        changeReadiness: { type: 'object' },
        gaps: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ehr', 'readiness', 'healthcare']
}));

export const workflowAnalysisTask = defineTask('ehr-workflow-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'EHR Workflow Analysis',
  agent: {
    name: 'workflow-analyst',
    prompt: {
      role: 'Clinical Workflow Analyst',
      task: 'Analyze current state workflows',
      context: args,
      instructions: [
        '1. Map clinical workflows by department',
        '2. Document current documentation practices',
        '3. Analyze order entry processes',
        '4. Map medication administration workflow',
        '5. Document charge capture processes',
        '6. Identify workflow pain points',
        '7. Assess workflow efficiency',
        '8. Document workarounds',
        '9. Identify standardization opportunities',
        '10. Create workflow inventory'
      ],
      outputFormat: 'JSON with workflow analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['workflows', 'painPoints', 'opportunities', 'artifacts'],
      properties: {
        workflows: { type: 'array', items: { type: 'object' } },
        clinicalWorkflows: { type: 'object' },
        orderWorkflows: { type: 'object' },
        medicationWorkflows: { type: 'object' },
        painPoints: { type: 'array', items: { type: 'object' } },
        workarounds: { type: 'array', items: { type: 'object' } },
        opportunities: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ehr', 'workflow', 'healthcare']
}));

export const futureStateWorkflowTask = defineTask('ehr-future-state', (args, taskCtx) => ({
  kind: 'agent',
  title: 'EHR Future State Workflow Design',
  agent: {
    name: 'workflow-designer',
    prompt: {
      role: 'Clinical Workflow Designer',
      task: 'Design future state EHR workflows',
      context: args,
      instructions: [
        '1. Design optimized clinical workflows',
        '2. Incorporate EHR best practices',
        '3. Design standardized order sets',
        '4. Plan documentation templates',
        '5. Design clinical decision support',
        '6. Plan patient engagement workflows',
        '7. Design reporting workflows',
        '8. Plan quality measure capture',
        '9. Document workflow changes',
        '10. Validate with clinical stakeholders'
      ],
      outputFormat: 'JSON with future state design'
    },
    outputSchema: {
      type: 'object',
      required: ['redesignedWorkflows', 'changes', 'artifacts'],
      properties: {
        redesignedWorkflows: { type: 'array', items: { type: 'object' } },
        orderSets: { type: 'array', items: { type: 'object' } },
        documentationTemplates: { type: 'array', items: { type: 'object' } },
        cdsDesign: { type: 'object' },
        changes: { type: 'array', items: { type: 'object' } },
        stakeholderValidation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ehr', 'future-state', 'healthcare']
}));

export const systemConfigurationTask = defineTask('ehr-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'EHR System Configuration Planning',
  agent: {
    name: 'configuration-specialist',
    prompt: {
      role: 'EHR Configuration Specialist',
      task: 'Plan EHR system configuration',
      context: args,
      instructions: [
        '1. Define configuration scope',
        '2. Plan build specifications',
        '3. Design user roles and security',
        '4. Plan preference configuration',
        '5. Design content build',
        '6. Plan reporting configuration',
        '7. Design print/fax configuration',
        '8. Plan mobile/portal configuration',
        '9. Document configuration decisions',
        '10. Create build timeline'
      ],
      outputFormat: 'JSON with configuration plan'
    },
    outputSchema: {
      type: 'object',
      required: ['configurationPlan', 'configurationAreas', 'artifacts'],
      properties: {
        configurationPlan: { type: 'object' },
        configurationAreas: { type: 'array', items: { type: 'object' } },
        securityDesign: { type: 'object' },
        contentBuild: { type: 'object' },
        reportingConfig: { type: 'object' },
        buildTimeline: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ehr', 'configuration', 'healthcare']
}));

export const dataMigrationTask = defineTask('ehr-data-migration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'EHR Data Migration Planning',
  agent: {
    name: 'data-migration-specialist',
    prompt: {
      role: 'Data Migration Specialist',
      task: 'Plan data migration to new EHR',
      context: args,
      instructions: [
        '1. Inventory source systems',
        '2. Define data migration scope',
        '3. Map data elements',
        '4. Define data quality rules',
        '5. Plan extraction approach',
        '6. Design transformation logic',
        '7. Plan loading strategy',
        '8. Design validation approach',
        '9. Plan migration testing',
        '10. Create migration timeline'
      ],
      outputFormat: 'JSON with migration plan'
    },
    outputSchema: {
      type: 'object',
      required: ['migrationPlan', 'dataElements', 'artifacts'],
      properties: {
        migrationPlan: { type: 'object' },
        sourceSystems: { type: 'array', items: { type: 'object' } },
        dataElements: { type: 'array', items: { type: 'object' } },
        mappings: { type: 'object' },
        qualityRules: { type: 'array', items: { type: 'object' } },
        validationApproach: { type: 'object' },
        timeline: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ehr', 'data-migration', 'healthcare']
}));

export const integrationDesignTask = defineTask('ehr-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'EHR Integration Design',
  agent: {
    name: 'integration-architect',
    prompt: {
      role: 'Healthcare Integration Architect',
      task: 'Design EHR integrations',
      context: args,
      instructions: [
        '1. Inventory integration requirements',
        '2. Design interface architecture',
        '3. Define HL7/FHIR specifications',
        '4. Plan ADT interfaces',
        '5. Design lab/radiology interfaces',
        '6. Plan pharmacy interfaces',
        '7. Design billing interfaces',
        '8. Plan HIE connectivity',
        '9. Design API strategy',
        '10. Create integration timeline'
      ],
      outputFormat: 'JSON with integration design'
    },
    outputSchema: {
      type: 'object',
      required: ['interfaces', 'architecture', 'artifacts'],
      properties: {
        interfaces: { type: 'array', items: { type: 'object' } },
        architecture: { type: 'object' },
        specifications: { type: 'array', items: { type: 'object' } },
        hieConnectivity: { type: 'object' },
        apiStrategy: { type: 'object' },
        timeline: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ehr', 'integration', 'healthcare']
}));

export const ehrTrainingProgramTask = defineTask('ehr-training', (args, taskCtx) => ({
  kind: 'agent',
  title: 'EHR Training Program Design',
  agent: {
    name: 'training-designer',
    prompt: {
      role: 'EHR Training Designer',
      task: 'Design EHR training program',
      context: args,
      instructions: [
        '1. Define training objectives by role',
        '2. Design curriculum structure',
        '3. Create training environments',
        '4. Develop training materials',
        '5. Plan super user program',
        '6. Design competency assessments',
        '7. Plan training logistics',
        '8. Design at-the-elbow support',
        '9. Plan ongoing education',
        '10. Create training schedule'
      ],
      outputFormat: 'JSON with training program'
    },
    outputSchema: {
      type: 'object',
      required: ['program', 'curriculum', 'schedule', 'artifacts'],
      properties: {
        program: { type: 'object' },
        curriculum: { type: 'array', items: { type: 'object' } },
        superUserProgram: { type: 'object' },
        competencies: { type: 'array', items: { type: 'object' } },
        schedule: { type: 'object' },
        supportPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ehr', 'training', 'healthcare']
}));

export const testingStrategyTask = defineTask('ehr-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'EHR Testing Strategy',
  agent: {
    name: 'testing-lead',
    prompt: {
      role: 'EHR Testing Lead',
      task: 'Develop EHR testing strategy',
      context: args,
      instructions: [
        '1. Define testing phases',
        '2. Design unit testing approach',
        '3. Plan integration testing',
        '4. Design end-to-end testing',
        '5. Plan user acceptance testing',
        '6. Design stress/load testing',
        '7. Plan security testing',
        '8. Define test scenarios',
        '9. Create defect management process',
        '10. Define go/no-go criteria'
      ],
      outputFormat: 'JSON with testing strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'phases', 'scenarios', 'artifacts'],
      properties: {
        strategy: { type: 'object' },
        phases: { type: 'array', items: { type: 'object' } },
        scenarios: { type: 'array', items: { type: 'object' } },
        defectProcess: { type: 'object' },
        goNoGoCriteria: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ehr', 'testing', 'healthcare']
}));

export const goLivePlanningTask = defineTask('ehr-go-live', (args, taskCtx) => ({
  kind: 'agent',
  title: 'EHR Go-Live Planning',
  agent: {
    name: 'go-live-manager',
    prompt: {
      role: 'EHR Go-Live Manager',
      task: 'Plan EHR go-live activities',
      context: args,
      instructions: [
        '1. Define go-live approach (big bang vs phased)',
        '2. Create go-live checklist',
        '3. Plan command center operations',
        '4. Design support structure',
        '5. Plan downtime procedures',
        '6. Create contingency plans',
        '7. Define escalation paths',
        '8. Plan communication strategy',
        '9. Define stabilization criteria',
        '10. Create go-live timeline'
      ],
      outputFormat: 'JSON with go-live plan'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'phases', 'milestones', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        approach: { type: 'string' },
        phases: { type: 'array', items: { type: 'object' } },
        milestones: { type: 'array', items: { type: 'object' } },
        checklist: { type: 'array', items: { type: 'object' } },
        commandCenter: { type: 'object' },
        contingencyPlans: { type: 'array', items: { type: 'object' } },
        communicationPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ehr', 'go-live', 'healthcare']
}));

export const optimizationPlanningTask = defineTask('ehr-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'EHR Optimization Planning',
  agent: {
    name: 'optimization-specialist',
    prompt: {
      role: 'EHR Optimization Specialist',
      task: 'Plan post-go-live optimization',
      context: args,
      instructions: [
        '1. Define optimization phases',
        '2. Plan feedback collection',
        '3. Design enhancement process',
        '4. Plan efficiency improvements',
        '5. Design adoption monitoring',
        '6. Plan personalization support',
        '7. Define optimization metrics',
        '8. Plan governance for changes',
        '9. Design continuous improvement',
        '10. Create optimization roadmap'
      ],
      outputFormat: 'JSON with optimization plan'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'phases', 'metrics', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        phases: { type: 'array', items: { type: 'object' } },
        feedbackProcess: { type: 'object' },
        enhancementProcess: { type: 'object' },
        metrics: { type: 'array', items: { type: 'object' } },
        governance: { type: 'object' },
        roadmap: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ehr', 'optimization', 'healthcare']
}));
