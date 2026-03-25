/**
 * @process domains/science/industrial-engineering/root-cause-analysis
 * @description Root Cause Analysis Investigation - Conduct structured root cause analysis investigations using
 * systematic problem-solving methods to identify and eliminate the true causes of problems.
 * @inputs { problemStatement: string, problemData?: object, impactAssessment?: object }
 * @outputs { success: boolean, rootCauses: array, correctiveActions: array, verificationPlan: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('domains/science/industrial-engineering/root-cause-analysis', {
 *   problemStatement: 'Customer complaints increased 40% for product X in Q3',
 *   problemData: { defectType: 'cosmetic', location: 'assembly-line-2' },
 *   impactAssessment: { customerComplaints: 150, scrapCost: 50000 }
 * });
 *
 * @references
 * - Andersen & Fagerhaug, Root Cause Analysis
 * - Latino, Root Cause Analysis: Improving Performance for Bottom-Line Results
 * - ASQ Root Cause Analysis Handbook
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    problemStatement,
    problemData = {},
    impactAssessment = {},
    outputDir = 'rca-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Root Cause Analysis Investigation process');

  // Task 1: Problem Definition
  ctx.log('info', 'Phase 1: Defining problem with is/is not analysis');
  const problemDefinition = await ctx.task(problemDefinitionTask, {
    problemStatement,
    problemData,
    impactAssessment,
    outputDir
  });

  artifacts.push(...problemDefinition.artifacts);

  // Task 2: Containment Actions
  ctx.log('info', 'Phase 2: Implementing containment actions');
  const containmentActions = await ctx.task(containmentActionsTask, {
    problemDefinition,
    outputDir
  });

  artifacts.push(...containmentActions.artifacts);

  // Task 3: Data Collection
  ctx.log('info', 'Phase 3: Collecting and verifying data');
  const dataCollection = await ctx.task(dataCollectionTask, {
    problemDefinition,
    outputDir
  });

  artifacts.push(...dataCollection.artifacts);

  // Breakpoint: Review data
  await ctx.breakpoint({
    question: `Data collection complete. ${dataCollection.dataPoints} data points collected. Is/Is Not analysis complete. Ready to develop cause theories?`,
    title: 'RCA Data Review',
    context: {
      runId: ctx.runId,
      isIsNot: problemDefinition.isIsNot,
      dataPoints: dataCollection.dataPoints,
      files: dataCollection.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // Task 4: Cause Theory Development
  ctx.log('info', 'Phase 4: Developing possible cause theories');
  const causeTheories = await ctx.task(causeTheoriesTask, {
    problemDefinition,
    dataCollection,
    outputDir
  });

  artifacts.push(...causeTheories.artifacts);

  // Task 5: Cause Testing
  ctx.log('info', 'Phase 5: Testing causes against evidence');
  const causeTesting = await ctx.task(causeTestingTask, {
    causeTheories,
    dataCollection,
    outputDir
  });

  artifacts.push(...causeTesting.artifacts);

  // Task 6: Root Cause Identification
  ctx.log('info', 'Phase 6: Identifying root causes through 5 Whys');
  const rootCauseId = await ctx.task(rootCauseIdTask, {
    causeTesting,
    outputDir
  });

  artifacts.push(...rootCauseId.artifacts);

  // Task 7: Corrective Action Development
  ctx.log('info', 'Phase 7: Developing and verifying corrective actions');
  const correctiveActions = await ctx.task(correctiveActionsTask, {
    rootCauseId,
    outputDir
  });

  artifacts.push(...correctiveActions.artifacts);

  // Task 8: Implementation Planning
  ctx.log('info', 'Phase 8: Planning corrective action implementation');
  const implementationPlan = await ctx.task(implementationPlanTask, {
    correctiveActions,
    outputDir
  });

  artifacts.push(...implementationPlan.artifacts);

  // Task 9: Verification Planning
  ctx.log('info', 'Phase 9: Creating effectiveness verification plan');
  const verificationPlan = await ctx.task(verificationPlanTask, {
    correctiveActions,
    problemDefinition,
    outputDir
  });

  artifacts.push(...verificationPlan.artifacts);

  // Task 10: Documentation
  ctx.log('info', 'Phase 10: Creating RCA report');
  const rcaReport = await ctx.task(rcaReportTask, {
    problemDefinition,
    containmentActions,
    dataCollection,
    causeTheories,
    rootCauseId,
    correctiveActions,
    verificationPlan,
    outputDir
  });

  artifacts.push(...rcaReport.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `RCA complete. ${rootCauseId.rootCauses.length} root causes identified. ${correctiveActions.actions.length} corrective actions recommended. Review report?`,
    title: 'RCA Results Review',
    context: {
      runId: ctx.runId,
      summary: {
        rootCausesIdentified: rootCauseId.rootCauses.length,
        correctiveActions: correctiveActions.actions.length,
        containmentEffective: containmentActions.effective,
        verificationMetrics: verificationPlan.metrics
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    rootCauses: rootCauseId.rootCauses,
    correctiveActions: correctiveActions.actions,
    verificationPlan: {
      metrics: verificationPlan.metrics,
      schedule: verificationPlan.schedule
    },
    containment: containmentActions.containmentActions,
    artifacts,
    duration,
    metadata: {
      processId: 'domains/science/industrial-engineering/root-cause-analysis',
      timestamp: startTime,
      problemStatement,
      outputDir
    }
  };
}

// Task 1: Problem Definition
export const problemDefinitionTask = defineTask('problem-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define problem with is/is not analysis',
  agent: {
    name: 'problem-definer',
    prompt: {
      role: 'Problem Solving Facilitator',
      task: 'Define problem clearly using is/is not analysis',
      context: args,
      instructions: [
        '1. Write clear problem statement',
        '2. Quantify the problem impact',
        '3. Conduct is/is not analysis (What, Where, When, Extent)',
        '4. Identify what distinguishes is from is not',
        '5. Define problem boundaries',
        '6. Identify stakeholders affected',
        '7. Set target resolution date',
        '8. Document problem definition'
      ],
      outputFormat: 'JSON with problem definition and is/is not analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['problemStatement', 'isIsNot', 'impact', 'artifacts'],
      properties: {
        problemStatement: { type: 'string' },
        isIsNot: { type: 'object' },
        distinctions: { type: 'array' },
        impact: { type: 'object' },
        boundaries: { type: 'object' },
        stakeholders: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'rca', 'problem-definition']
}));

// Task 2: Containment Actions
export const containmentActionsTask = defineTask('containment-actions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement containment actions',
  agent: {
    name: 'containment-specialist',
    prompt: {
      role: 'Quality Response Specialist',
      task: 'Define and implement interim containment actions',
      context: args,
      instructions: [
        '1. Assess need for immediate containment',
        '2. Identify affected inventory/products',
        '3. Define containment actions',
        '4. Implement inspection or sort',
        '5. Quarantine suspect material',
        '6. Notify affected parties',
        '7. Verify containment effectiveness',
        '8. Document containment actions'
      ],
      outputFormat: 'JSON with containment actions and status'
    },
    outputSchema: {
      type: 'object',
      required: ['containmentActions', 'effective', 'artifacts'],
      properties: {
        containmentActions: { type: 'array' },
        affectedInventory: { type: 'object' },
        effective: { type: 'boolean' },
        verificationResults: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'rca', 'containment']
}));

// Task 3: Data Collection
export const dataCollectionTask = defineTask('data-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Collect and verify data',
  agent: {
    name: 'data-investigator',
    prompt: {
      role: 'Investigation Data Analyst',
      task: 'Collect and verify data about the problem',
      context: args,
      instructions: [
        '1. Identify data needed to understand problem',
        '2. Collect data from multiple sources',
        '3. Verify data accuracy',
        '4. Create data visualizations',
        '5. Identify patterns and trends',
        '6. Document data collection methods',
        '7. Identify data gaps',
        '8. Summarize key findings'
      ],
      outputFormat: 'JSON with collected data and analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['collectedData', 'dataPoints', 'patterns', 'artifacts'],
      properties: {
        collectedData: { type: 'object' },
        dataPoints: { type: 'number' },
        patterns: { type: 'array' },
        trends: { type: 'array' },
        dataGaps: { type: 'array' },
        visualizations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'rca', 'data-collection']
}));

// Task 4: Cause Theories
export const causeTheoriesTask = defineTask('cause-theories', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop possible cause theories',
  agent: {
    name: 'cause-theorist',
    prompt: {
      role: 'Root Cause Analyst',
      task: 'Develop possible cause theories using structured methods',
      context: args,
      instructions: [
        '1. Create fishbone (Ishikawa) diagram',
        '2. Brainstorm causes (6M: Man, Machine, Method, Material, Measurement, Mother Nature)',
        '3. Group related causes',
        '4. Identify most likely causes',
        '5. Consider changes that occurred',
        '6. Use distinctions from is/is not',
        '7. Prioritize theories by likelihood',
        '8. Document all theories'
      ],
      outputFormat: 'JSON with cause theories and fishbone diagram'
    },
    outputSchema: {
      type: 'object',
      required: ['theories', 'fishboneDiagram', 'prioritizedTheories', 'artifacts'],
      properties: {
        theories: { type: 'array' },
        fishboneDiagram: { type: 'object' },
        categories: { type: 'object' },
        changes: { type: 'array' },
        prioritizedTheories: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'rca', 'cause-theories']
}));

// Task 5: Cause Testing
export const causeTestingTask = defineTask('cause-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Test causes against evidence',
  agent: {
    name: 'cause-tester',
    prompt: {
      role: 'Investigation Analyst',
      task: 'Test cause theories against evidence',
      context: args,
      instructions: [
        '1. Test each theory against is/is not',
        '2. Theory must explain all IS items',
        '3. Theory must explain why NOT items unaffected',
        '4. Collect additional data if needed',
        '5. Eliminate theories that fail tests',
        '6. Identify most probable cause(s)',
        '7. Verify with experiments if possible',
        '8. Document testing results'
      ],
      outputFormat: 'JSON with theory testing results'
    },
    outputSchema: {
      type: 'object',
      required: ['testedTheories', 'validatedCauses', 'eliminatedTheories', 'artifacts'],
      properties: {
        testedTheories: { type: 'array' },
        validatedCauses: { type: 'array' },
        eliminatedTheories: { type: 'array' },
        testingMatrix: { type: 'object' },
        additionalDataCollected: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'rca', 'cause-testing']
}));

// Task 6: Root Cause Identification
export const rootCauseIdTask = defineTask('root-cause-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify root causes using 5 Whys',
  agent: {
    name: 'root-cause-identifier',
    prompt: {
      role: 'Root Cause Specialist',
      task: 'Drill down to root causes using 5 Whys or fault tree',
      context: args,
      instructions: [
        '1. Start with validated proximate causes',
        '2. Apply 5 Whys analysis',
        '3. Ask "Why?" until root cause reached',
        '4. Identify both technical and systemic causes',
        '5. Consider management system causes',
        '6. Verify root cause can be acted upon',
        '7. Create fault tree if complex',
        '8. Document root cause chain'
      ],
      outputFormat: 'JSON with root causes and 5 Whys analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['rootCauses', 'fiveWhysAnalysis', 'artifacts'],
      properties: {
        rootCauses: { type: 'array' },
        fiveWhysAnalysis: { type: 'array' },
        technicalCauses: { type: 'array' },
        systemicCauses: { type: 'array' },
        faultTree: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'rca', 'root-cause']
}));

// Task 7: Corrective Actions
export const correctiveActionsTask = defineTask('corrective-actions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop corrective actions',
  agent: {
    name: 'corrective-action-developer',
    prompt: {
      role: 'Corrective Action Specialist',
      task: 'Develop corrective actions addressing root causes',
      context: args,
      instructions: [
        '1. Develop action for each root cause',
        '2. Focus on permanent fixes, not workarounds',
        '3. Evaluate action alternatives',
        '4. Assess action effectiveness',
        '5. Assess potential side effects',
        '6. Prioritize actions',
        '7. Define action owners',
        '8. Document corrective actions'
      ],
      outputFormat: 'JSON with corrective actions'
    },
    outputSchema: {
      type: 'object',
      required: ['actions', 'evaluation', 'artifacts'],
      properties: {
        actions: { type: 'array' },
        alternatives: { type: 'array' },
        evaluation: { type: 'object' },
        sideEffects: { type: 'array' },
        prioritization: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'rca', 'corrective-actions']
}));

// Task 8: Implementation Planning
export const implementationPlanTask = defineTask('implementation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan corrective action implementation',
  agent: {
    name: 'implementation-planner',
    prompt: {
      role: 'Implementation Manager',
      task: 'Create implementation plan for corrective actions',
      context: args,
      instructions: [
        '1. Create detailed implementation steps',
        '2. Assign responsibilities',
        '3. Set target dates',
        '4. Identify resource requirements',
        '5. Plan change management',
        '6. Identify potential barriers',
        '7. Create contingency plans',
        '8. Document implementation plan'
      ],
      outputFormat: 'JSON with implementation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['implementationSteps', 'schedule', 'resources', 'artifacts'],
      properties: {
        implementationSteps: { type: 'array' },
        schedule: { type: 'array' },
        responsibilities: { type: 'object' },
        resources: { type: 'object' },
        barriers: { type: 'array' },
        contingencies: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'rca', 'implementation']
}));

// Task 9: Verification Planning
export const verificationPlanTask = defineTask('verification-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create effectiveness verification plan',
  agent: {
    name: 'verification-planner',
    prompt: {
      role: 'Quality Verification Specialist',
      task: 'Create plan to verify corrective action effectiveness',
      context: args,
      instructions: [
        '1. Define verification metrics',
        '2. Establish baseline measurements',
        '3. Define target values',
        '4. Create verification schedule',
        '5. Define verification methods',
        '6. Plan short-term and long-term verification',
        '7. Define success criteria',
        '8. Document verification plan'
      ],
      outputFormat: 'JSON with verification plan'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'schedule', 'successCriteria', 'artifacts'],
      properties: {
        metrics: { type: 'array' },
        baselines: { type: 'object' },
        targets: { type: 'object' },
        schedule: { type: 'array' },
        methods: { type: 'array' },
        successCriteria: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'rca', 'verification']
}));

// Task 10: RCA Report
export const rcaReportTask = defineTask('rca-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create RCA report',
  agent: {
    name: 'rca-reporter',
    prompt: {
      role: 'Technical Report Writer',
      task: 'Create comprehensive RCA documentation',
      context: args,
      instructions: [
        '1. Create executive summary',
        '2. Document problem definition',
        '3. Include containment actions',
        '4. Document investigation findings',
        '5. Present root cause analysis',
        '6. List corrective actions',
        '7. Include verification plan',
        '8. Document lessons learned'
      ],
      outputFormat: 'JSON with RCA report'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'lessonsLearned', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        lessonsLearned: { type: 'array' },
        preventionMeasures: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'rca', 'report']
}));
