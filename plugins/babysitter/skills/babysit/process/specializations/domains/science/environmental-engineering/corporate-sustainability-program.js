/**
 * @process environmental-engineering/corporate-sustainability-program
 * @description Corporate Sustainability Program Development - Design and implementation of comprehensive corporate
 * sustainability programs including goal setting, implementation planning, and reporting.
 * @inputs { organizationName: string, organizationType: string, sustainabilityFocus: array, currentState: object }
 * @outputs { success: boolean, sustainabilityProgram: object, implementationPlan: object, reportingFramework: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('environmental-engineering/corporate-sustainability-program', {
 *   organizationName: 'Global Manufacturing Corp',
 *   organizationType: 'manufacturing',
 *   sustainabilityFocus: ['carbon-reduction', 'water-stewardship', 'circular-economy'],
 *   currentState: { hasProgram: false, esgScore: 'C' }
 * });
 *
 * @references
 * - GRI Standards
 * - SASB Standards
 * - UN Sustainable Development Goals
 * - CDP Reporting Framework
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationName,
    organizationType = 'corporate',
    sustainabilityFocus = [],
    currentState = {},
    stakeholders = [],
    outputDir = 'sustainability-program-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Corporate Sustainability Program: ${organizationName}`);
  ctx.log('info', `Focus Areas: ${sustainabilityFocus.join(', ')}`);

  // ============================================================================
  // PHASE 1: MATERIALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Materiality Assessment');

  const materialityAssessment = await ctx.task(materialityAssessmentTask, {
    organizationName,
    organizationType,
    sustainabilityFocus,
    stakeholders,
    outputDir
  });

  artifacts.push(...materialityAssessment.artifacts);

  // ============================================================================
  // PHASE 2: BASELINE ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Sustainability Baseline Assessment');

  const baselineAssessment = await ctx.task(sustainabilityBaselineTask, {
    organizationName,
    currentState,
    materialityAssessment,
    outputDir
  });

  artifacts.push(...baselineAssessment.artifacts);

  // ============================================================================
  // PHASE 3: GOAL SETTING
  // ============================================================================

  ctx.log('info', 'Phase 3: Sustainability Goal Setting');

  const goalSetting = await ctx.task(sustainabilityGoalsTask, {
    organizationName,
    materialityAssessment,
    baselineAssessment,
    sustainabilityFocus,
    outputDir
  });

  artifacts.push(...goalSetting.artifacts);

  // Breakpoint: Goal Review
  await ctx.breakpoint({
    question: `Sustainability goals developed for ${organizationName}. ${goalSetting.goals.length} goals set. Review goals?`,
    title: 'Sustainability Goals Review',
    context: {
      runId: ctx.runId,
      goals: goalSetting.goals,
      targetYears: goalSetting.targetYears,
      files: goalSetting.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 4: STRATEGY DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Strategy Development');

  const strategyDevelopment = await ctx.task(sustainabilityStrategyTask, {
    organizationName,
    goalSetting,
    materialityAssessment,
    baselineAssessment,
    outputDir
  });

  artifacts.push(...strategyDevelopment.artifacts);

  // ============================================================================
  // PHASE 5: IMPLEMENTATION PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementation Planning');

  const implementationPlan = await ctx.task(sustainabilityImplementationTask, {
    organizationName,
    strategyDevelopment,
    goalSetting,
    outputDir
  });

  artifacts.push(...implementationPlan.artifacts);

  // ============================================================================
  // PHASE 6: GOVERNANCE FRAMEWORK
  // ============================================================================

  ctx.log('info', 'Phase 6: Governance Framework');

  const governanceFramework = await ctx.task(sustainabilityGovernanceTask, {
    organizationName,
    strategyDevelopment,
    outputDir
  });

  artifacts.push(...governanceFramework.artifacts);

  // ============================================================================
  // PHASE 7: REPORTING FRAMEWORK
  // ============================================================================

  ctx.log('info', 'Phase 7: Reporting Framework');

  const reportingFramework = await ctx.task(sustainabilityReportingTask, {
    organizationName,
    goalSetting,
    materialityAssessment,
    outputDir
  });

  artifacts.push(...reportingFramework.artifacts);

  // ============================================================================
  // PHASE 8: PROGRAM DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Program Documentation');

  const programDocs = await ctx.task(sustainabilityProgramDocsTask, {
    organizationName,
    materialityAssessment,
    baselineAssessment,
    goalSetting,
    strategyDevelopment,
    implementationPlan,
    governanceFramework,
    reportingFramework,
    outputDir
  });

  artifacts.push(...programDocs.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    organizationName,
    sustainabilityProgram: {
      materialTopics: materialityAssessment.materialTopics,
      goals: goalSetting.goals,
      strategy: strategyDevelopment.strategySummary
    },
    implementationPlan: {
      phases: implementationPlan.phases,
      timeline: implementationPlan.timeline,
      resources: implementationPlan.resources
    },
    reportingFramework: {
      frameworks: reportingFramework.selectedFrameworks,
      metrics: reportingFramework.keyMetrics,
      schedule: reportingFramework.reportingSchedule
    },
    governance: governanceFramework.governanceStructure,
    artifacts,
    duration,
    metadata: {
      processId: 'environmental-engineering/corporate-sustainability-program',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const materialityAssessmentTask = defineTask('materiality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Materiality Assessment',
  agent: {
    name: 'sustainability-specialist',
    prompt: {
      role: 'Sustainability Materiality Analyst',
      task: 'Conduct sustainability materiality assessment',
      context: args,
      instructions: [
        '1. Identify potential sustainability topics',
        '2. Assess stakeholder importance',
        '3. Assess business impact',
        '4. Benchmark against peers',
        '5. Map to SDGs',
        '6. Map to ESG frameworks',
        '7. Prioritize material topics',
        '8. Validate with stakeholders',
        '9. Create materiality matrix',
        '10. Document materiality assessment'
      ],
      outputFormat: 'JSON with material topics, matrix, stakeholder input'
    },
    outputSchema: {
      type: 'object',
      required: ['materialTopics', 'materialityMatrix', 'stakeholderInput', 'artifacts'],
      properties: {
        materialTopics: { type: 'array' },
        potentialTopics: { type: 'array' },
        materialityMatrix: { type: 'object' },
        stakeholderInput: { type: 'object' },
        sdgMapping: { type: 'object' },
        esgFrameworkMapping: { type: 'object' },
        peerBenchmark: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'sustainability', 'materiality']
}));

export const sustainabilityBaselineTask = defineTask('sustainability-baseline', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Sustainability Baseline Assessment',
  agent: {
    name: 'sustainability-specialist',
    prompt: {
      role: 'Sustainability Data Analyst',
      task: 'Assess current sustainability performance baseline',
      context: args,
      instructions: [
        '1. Collect environmental data',
        '2. Collect social data',
        '3. Collect governance data',
        '4. Calculate key metrics',
        '5. Assess current programs',
        '6. Identify data gaps',
        '7. Benchmark against industry',
        '8. Assess current ESG ratings',
        '9. Identify improvement areas',
        '10. Document baseline assessment'
      ],
      outputFormat: 'JSON with baseline metrics, gaps, benchmark'
    },
    outputSchema: {
      type: 'object',
      required: ['baselineMetrics', 'dataGaps', 'industryBenchmark', 'artifacts'],
      properties: {
        baselineMetrics: { type: 'object' },
        environmentalData: { type: 'object' },
        socialData: { type: 'object' },
        governanceData: { type: 'object' },
        currentPrograms: { type: 'array' },
        dataGaps: { type: 'array' },
        industryBenchmark: { type: 'object' },
        improvementAreas: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'sustainability', 'baseline']
}));

export const sustainabilityGoalsTask = defineTask('sustainability-goals', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Sustainability Goal Setting',
  agent: {
    name: 'sustainability-specialist',
    prompt: {
      role: 'Sustainability Goal Planner',
      task: 'Develop SMART sustainability goals',
      context: args,
      instructions: [
        '1. Define goal areas aligned with material topics',
        '2. Set quantitative targets',
        '3. Establish target years',
        '4. Align with science-based targets',
        '5. Align with SDGs',
        '6. Define interim milestones',
        '7. Establish KPIs',
        '8. Validate goal achievability',
        '9. Gain stakeholder alignment',
        '10. Document sustainability goals'
      ],
      outputFormat: 'JSON with goals, targets, KPIs'
    },
    outputSchema: {
      type: 'object',
      required: ['goals', 'targets', 'kpis', 'targetYears', 'artifacts'],
      properties: {
        goals: { type: 'array' },
        targets: { type: 'object' },
        kpis: { type: 'array' },
        targetYears: { type: 'object' },
        interimMilestones: { type: 'array' },
        sdgAlignment: { type: 'object' },
        scienceBasedTargets: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'sustainability', 'goals']
}));

export const sustainabilityStrategyTask = defineTask('sustainability-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Strategy Development',
  agent: {
    name: 'sustainability-specialist',
    prompt: {
      role: 'Sustainability Strategy Developer',
      task: 'Develop comprehensive sustainability strategy',
      context: args,
      instructions: [
        '1. Define strategic pillars',
        '2. Develop initiatives for each goal',
        '3. Prioritize initiatives',
        '4. Assess resource requirements',
        '5. Identify partnerships needed',
        '6. Develop business case',
        '7. Integrate with business strategy',
        '8. Identify quick wins',
        '9. Address risks and barriers',
        '10. Document sustainability strategy'
      ],
      outputFormat: 'JSON with strategy summary, initiatives, business case'
    },
    outputSchema: {
      type: 'object',
      required: ['strategySummary', 'initiatives', 'businessCase', 'artifacts'],
      properties: {
        strategySummary: { type: 'object' },
        strategicPillars: { type: 'array' },
        initiatives: { type: 'array' },
        prioritization: { type: 'object' },
        resourceRequirements: { type: 'object' },
        partnerships: { type: 'array' },
        businessCase: { type: 'object' },
        quickWins: { type: 'array' },
        risksBarriers: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'sustainability', 'strategy']
}));

export const sustainabilityImplementationTask = defineTask('sustainability-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implementation Planning',
  agent: {
    name: 'sustainability-specialist',
    prompt: {
      role: 'Sustainability Implementation Manager',
      task: 'Develop implementation plan for sustainability program',
      context: args,
      instructions: [
        '1. Develop phased implementation approach',
        '2. Create detailed action plans',
        '3. Assign responsibilities',
        '4. Establish timelines',
        '5. Allocate resources',
        '6. Define success metrics',
        '7. Plan stakeholder engagement',
        '8. Develop change management plan',
        '9. Create communication plan',
        '10. Document implementation plan'
      ],
      outputFormat: 'JSON with phases, timeline, resources'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'timeline', 'resources', 'artifacts'],
      properties: {
        phases: { type: 'array' },
        actionPlans: { type: 'array' },
        responsibilities: { type: 'object' },
        timeline: { type: 'object' },
        resources: { type: 'object' },
        successMetrics: { type: 'array' },
        changeManagement: { type: 'object' },
        communicationPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'sustainability', 'implementation']
}));

export const sustainabilityGovernanceTask = defineTask('sustainability-governance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Governance Framework',
  agent: {
    name: 'sustainability-specialist',
    prompt: {
      role: 'Sustainability Governance Specialist',
      task: 'Develop sustainability governance framework',
      context: args,
      instructions: [
        '1. Define governance structure',
        '2. Establish board oversight',
        '3. Define executive roles',
        '4. Create sustainability committee',
        '5. Define decision-making processes',
        '6. Establish accountability mechanisms',
        '7. Integrate into corporate governance',
        '8. Define policy framework',
        '9. Establish review processes',
        '10. Document governance framework'
      ],
      outputFormat: 'JSON with governance structure, roles, policies'
    },
    outputSchema: {
      type: 'object',
      required: ['governanceStructure', 'roles', 'policies', 'artifacts'],
      properties: {
        governanceStructure: { type: 'object' },
        boardOversight: { type: 'object' },
        executiveRoles: { type: 'array' },
        roles: { type: 'object' },
        sustainabilityCommittee: { type: 'object' },
        decisionProcesses: { type: 'object' },
        accountabilityMechanisms: { type: 'array' },
        policies: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'sustainability', 'governance']
}));

export const sustainabilityReportingTask = defineTask('sustainability-reporting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Reporting Framework',
  agent: {
    name: 'sustainability-specialist',
    prompt: {
      role: 'Sustainability Reporting Specialist',
      task: 'Develop sustainability reporting framework',
      context: args,
      instructions: [
        '1. Select reporting frameworks (GRI, SASB, TCFD)',
        '2. Define key metrics and disclosures',
        '3. Design data collection system',
        '4. Establish reporting boundaries',
        '5. Plan assurance approach',
        '6. Design report format',
        '7. Establish reporting schedule',
        '8. Plan stakeholder communication',
        '9. Integrate with financial reporting',
        '10. Document reporting framework'
      ],
      outputFormat: 'JSON with selected frameworks, key metrics, schedule'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedFrameworks', 'keyMetrics', 'reportingSchedule', 'artifacts'],
      properties: {
        selectedFrameworks: { type: 'array' },
        keyMetrics: { type: 'array' },
        disclosures: { type: 'object' },
        dataCollection: { type: 'object' },
        reportingBoundaries: { type: 'object' },
        assuranceApproach: { type: 'object' },
        reportingSchedule: { type: 'object' },
        stakeholderCommunication: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'sustainability', 'reporting']
}));

export const sustainabilityProgramDocsTask = defineTask('sustainability-program-docs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Program Documentation',
  agent: {
    name: 'sustainability-specialist',
    prompt: {
      role: 'Sustainability Program Manager',
      task: 'Compile sustainability program documentation',
      context: args,
      instructions: [
        '1. Prepare program summary',
        '2. Document materiality assessment',
        '3. Document baseline and goals',
        '4. Document strategy',
        '5. Document implementation plan',
        '6. Document governance framework',
        '7. Document reporting framework',
        '8. Prepare board presentation',
        '9. Prepare stakeholder communications',
        '10. Generate program documentation package'
      ],
      outputFormat: 'JSON with document list, program summary path'
    },
    outputSchema: {
      type: 'object',
      required: ['documentList', 'programSummaryPath', 'artifacts'],
      properties: {
        documentList: { type: 'array' },
        programSummaryPath: { type: 'string' },
        boardPresentation: { type: 'object' },
        stakeholderCommunications: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'sustainability', 'documentation']
}));
