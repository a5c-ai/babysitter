/**
 * @process digital-marketing/marketing-automation-workflow
 * @description Process for designing, building, and optimizing automated marketing workflows and customer journeys to nurture leads and drive conversions at scale
 * @inputs { customerJourneyMap: object, automationPlatform: object, contentAssets: array, businessRules: object, outputDir: string }
 * @outputs { success: boolean, configuredWorkflows: array, journeyDocumentation: object, performanceDashboards: array, optimizationReports: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    customerJourneyMap = {},
    automationPlatform = {},
    contentAssets = [],
    businessRules = {},
    outputDir = 'automation-workflow-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Marketing Automation Workflow Development process');

  // Task 1: Map Customer Journey and Touchpoints
  ctx.log('info', 'Phase 1: Mapping customer journey and touchpoints');
  const journeyMapping = await ctx.task(journeyMappingTask, {
    customerJourneyMap,
    outputDir
  });
  artifacts.push(...journeyMapping.artifacts);

  // Task 2: Identify Automation Opportunities
  ctx.log('info', 'Phase 2: Identifying automation opportunities');
  const opportunityIdentification = await ctx.task(automationOpportunitiesTask, {
    journeyMapping,
    businessRules,
    outputDir
  });
  artifacts.push(...opportunityIdentification.artifacts);

  // Task 3: Design Workflow Logic and Triggers
  ctx.log('info', 'Phase 3: Designing workflow logic and triggers');
  const workflowDesign = await ctx.task(workflowDesignTask, {
    opportunityIdentification,
    businessRules,
    outputDir
  });
  artifacts.push(...workflowDesign.artifacts);

  // Task 4: Define Enrollment Criteria and Segments
  ctx.log('info', 'Phase 4: Defining enrollment criteria and segments');
  const enrollmentCriteria = await ctx.task(enrollmentCriteriaTask, {
    workflowDesign,
    journeyMapping,
    outputDir
  });
  artifacts.push(...enrollmentCriteria.artifacts);

  // Task 5: Create Email and Content Assets
  ctx.log('info', 'Phase 5: Creating email and content assets for workflows');
  const contentCreation = await ctx.task(workflowContentTask, {
    workflowDesign,
    contentAssets,
    outputDir
  });
  artifacts.push(...contentCreation.artifacts);

  // Task 6: Build Workflow in Platform
  ctx.log('info', 'Phase 6: Building workflow in automation platform');
  const workflowBuild = await ctx.task(workflowBuildTask, {
    workflowDesign,
    enrollmentCriteria,
    contentCreation,
    automationPlatform,
    outputDir
  });
  artifacts.push(...workflowBuild.artifacts);

  // Task 7: Configure Branching and Conditions
  ctx.log('info', 'Phase 7: Configuring branching and conditions');
  const branchingConfig = await ctx.task(branchingConfigTask, {
    workflowBuild,
    businessRules,
    outputDir
  });
  artifacts.push(...branchingConfig.artifacts);

  // Task 8: Set Up Goal Tracking
  ctx.log('info', 'Phase 8: Setting up goal tracking and exit criteria');
  const goalTracking = await ctx.task(goalTrackingTask, {
    workflowBuild,
    businessRules,
    outputDir
  });
  artifacts.push(...goalTracking.artifacts);

  // Task 9: Test Workflow End-to-End
  ctx.log('info', 'Phase 9: Testing workflow end-to-end');
  const workflowTesting = await ctx.task(workflowTestingTask, {
    workflowBuild,
    branchingConfig,
    goalTracking,
    outputDir
  });
  artifacts.push(...workflowTesting.artifacts);

  // Breakpoint: Review before launch
  await ctx.breakpoint({
    question: `Workflow testing complete. ${workflowTesting.passedTests}/${workflowTesting.totalTests} tests passed. Ready to launch?`,
    title: 'Marketing Automation Workflow Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        workflowCount: workflowBuild.workflowCount,
        testsPassed: workflowTesting.passedTests,
        totalTests: workflowTesting.totalTests,
        branchingPoints: branchingConfig.branchCount
      }
    }
  });

  // Task 10: Launch and Monitor
  ctx.log('info', 'Phase 10: Creating launch and monitoring plan');
  const launchMonitoring = await ctx.task(launchMonitoringTask, {
    workflowBuild,
    goalTracking,
    outputDir
  });
  artifacts.push(...launchMonitoring.artifacts);

  // Task 11: Optimization Framework
  ctx.log('info', 'Phase 11: Creating optimization framework');
  const optimizationFramework = await ctx.task(optimizationFrameworkTask, {
    workflowBuild,
    goalTracking,
    launchMonitoring,
    outputDir
  });
  artifacts.push(...optimizationFramework.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    configuredWorkflows: workflowBuild.workflows,
    journeyDocumentation: journeyMapping.documentation,
    performanceDashboards: launchMonitoring.dashboards,
    optimizationReports: optimizationFramework.reportTemplates,
    enrollmentCriteria: enrollmentCriteria.criteria,
    branchingLogic: branchingConfig.logic,
    goalConfiguration: goalTracking.goals,
    artifacts,
    duration,
    metadata: {
      processId: 'digital-marketing/marketing-automation-workflow',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task definitions
export const journeyMappingTask = defineTask('journey-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map customer journey and touchpoints',
  agent: {
    name: 'journey-mapper',
    prompt: {
      role: 'customer journey specialist',
      task: 'Map detailed customer journey with all touchpoints',
      context: args,
      instructions: [
        'Document customer journey stages',
        'Identify all touchpoints per stage',
        'Map content needs at each stage',
        'Identify decision points',
        'Document time between stages',
        'Identify drop-off points',
        'Create visual journey map',
        'Document journey documentation'
      ],
      outputFormat: 'JSON with documentation, stages, touchpoints, journeyMap, dropOffPoints, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentation', 'stages', 'artifacts'],
      properties: {
        documentation: { type: 'object' },
        stages: { type: 'array', items: { type: 'object' } },
        touchpoints: { type: 'array', items: { type: 'object' } },
        journeyMap: { type: 'object' },
        dropOffPoints: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'marketing-automation', 'journey-mapping']
}));

export const automationOpportunitiesTask = defineTask('automation-opportunities', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify automation opportunities',
  agent: {
    name: 'automation-strategist',
    prompt: {
      role: 'marketing automation strategist',
      task: 'Identify opportunities for marketing automation',
      context: args,
      instructions: [
        'Identify repetitive manual tasks',
        'Find nurture sequence opportunities',
        'Identify trigger-based opportunities',
        'Find re-engagement opportunities',
        'Identify onboarding automation needs',
        'Assess automation ROI potential',
        'Prioritize automation opportunities',
        'Document automation roadmap'
      ],
      outputFormat: 'JSON with opportunities, opportunityCount, prioritization, roadmap, roiEstimates, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['opportunities', 'opportunityCount', 'artifacts'],
      properties: {
        opportunities: { type: 'array', items: { type: 'object' } },
        opportunityCount: { type: 'number' },
        prioritization: { type: 'array', items: { type: 'object' } },
        roadmap: { type: 'object' },
        roiEstimates: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'marketing-automation', 'opportunities']
}));

export const workflowDesignTask = defineTask('workflow-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design workflow logic and triggers',
  agent: {
    name: 'workflow-designer',
    prompt: {
      role: 'marketing automation architect',
      task: 'Design workflow logic, triggers, and flow',
      context: args,
      instructions: [
        'Define workflow entry triggers',
        'Design workflow steps and actions',
        'Create conditional logic',
        'Define wait periods and delays',
        'Plan branching paths',
        'Design workflow exit conditions',
        'Create workflow visualization',
        'Document workflow specifications'
      ],
      outputFormat: 'JSON with design, triggers, steps, conditionalLogic, visualization, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'triggers', 'artifacts'],
      properties: {
        design: { type: 'object' },
        triggers: { type: 'array', items: { type: 'object' } },
        steps: { type: 'array', items: { type: 'object' } },
        conditionalLogic: { type: 'object' },
        visualization: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'marketing-automation', 'workflow-design']
}));

export const enrollmentCriteriaTask = defineTask('enrollment-criteria', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define enrollment criteria and segments',
  agent: {
    name: 'enrollment-specialist',
    prompt: {
      role: 'workflow enrollment specialist',
      task: 'Define criteria for workflow enrollment and segmentation',
      context: args,
      instructions: [
        'Define enrollment criteria',
        'Create qualifying conditions',
        'Set up segment filters',
        'Define exclusion criteria',
        'Plan re-enrollment rules',
        'Set enrollment caps if needed',
        'Create enrollment testing plan',
        'Document enrollment logic'
      ],
      outputFormat: 'JSON with criteria, segments, exclusions, reEnrollmentRules, testingPlan, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['criteria', 'artifacts'],
      properties: {
        criteria: { type: 'object' },
        segments: { type: 'array', items: { type: 'object' } },
        exclusions: { type: 'array', items: { type: 'object' } },
        reEnrollmentRules: { type: 'object' },
        testingPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'marketing-automation', 'enrollment', 'segmentation']
}));

export const workflowContentTask = defineTask('workflow-content', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create email and content assets for workflows',
  agent: {
    name: 'automation-content-creator',
    prompt: {
      role: 'automation content specialist',
      task: 'Create content assets for automation workflows',
      context: args,
      instructions: [
        'Create email templates for each workflow step',
        'Write email copy variations',
        'Design workflow-specific content',
        'Create dynamic content blocks',
        'Develop personalization tokens',
        'Create landing pages if needed',
        'Document content requirements',
        'Create content library'
      ],
      outputFormat: 'JSON with content, emailTemplates, dynamicContent, personalization, contentLibrary, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['content', 'artifacts'],
      properties: {
        content: { type: 'array', items: { type: 'object' } },
        emailTemplates: { type: 'array', items: { type: 'object' } },
        dynamicContent: { type: 'array', items: { type: 'object' } },
        personalization: { type: 'object' },
        contentLibrary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'marketing-automation', 'content']
}));

export const workflowBuildTask = defineTask('workflow-build', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Build workflow in automation platform',
  agent: {
    name: 'automation-builder',
    prompt: {
      role: 'marketing automation builder',
      task: 'Build workflows in the automation platform',
      context: args,
      instructions: [
        'Set up workflow in platform',
        'Configure enrollment triggers',
        'Add workflow steps and actions',
        'Connect content to workflow steps',
        'Configure timing and delays',
        'Set up notifications',
        'Document workflow configuration',
        'Create workflow backup'
      ],
      outputFormat: 'JSON with workflows, workflowCount, configuration, documentation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['workflows', 'workflowCount', 'artifacts'],
      properties: {
        workflows: { type: 'array', items: { type: 'object' } },
        workflowCount: { type: 'number' },
        configuration: { type: 'object' },
        documentation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'marketing-automation', 'build', 'platform']
}));

export const branchingConfigTask = defineTask('branching-config', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure branching and conditions',
  agent: {
    name: 'branching-specialist',
    prompt: {
      role: 'workflow branching specialist',
      task: 'Configure workflow branching logic and conditions',
      context: args,
      instructions: [
        'Set up if/then branching',
        'Configure conditional splits',
        'Set up A/B test branches',
        'Configure behavior-based branching',
        'Set up score-based routing',
        'Configure fallback paths',
        'Document branching logic',
        'Test branch conditions'
      ],
      outputFormat: 'JSON with logic, branchCount, conditions, testResults, documentation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['logic', 'branchCount', 'artifacts'],
      properties: {
        logic: { type: 'object' },
        branchCount: { type: 'number' },
        conditions: { type: 'array', items: { type: 'object' } },
        testResults: { type: 'object' },
        documentation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'marketing-automation', 'branching', 'conditions']
}));

export const goalTrackingTask = defineTask('goal-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up goal tracking and exit criteria',
  agent: {
    name: 'goal-tracker',
    prompt: {
      role: 'workflow goal specialist',
      task: 'Configure goal tracking and exit criteria for workflows',
      context: args,
      instructions: [
        'Define workflow goals',
        'Configure goal completion tracking',
        'Set up conversion tracking',
        'Define exit criteria',
        'Configure suppression on goal completion',
        'Set up goal attribution',
        'Create goal dashboards',
        'Document goal configuration'
      ],
      outputFormat: 'JSON with goals, exitCriteria, conversionTracking, dashboards, documentation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['goals', 'artifacts'],
      properties: {
        goals: { type: 'array', items: { type: 'object' } },
        exitCriteria: { type: 'array', items: { type: 'object' } },
        conversionTracking: { type: 'object' },
        dashboards: { type: 'array', items: { type: 'object' } },
        documentation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'marketing-automation', 'goals', 'tracking']
}));

export const workflowTestingTask = defineTask('workflow-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Test workflow end-to-end',
  agent: {
    name: 'workflow-tester',
    prompt: {
      role: 'automation QA specialist',
      task: 'Perform end-to-end testing of marketing automation workflows',
      context: args,
      instructions: [
        'Create test contacts',
        'Test enrollment triggers',
        'Test each workflow step',
        'Test branching conditions',
        'Test email delivery',
        'Test goal completion',
        'Test exit conditions',
        'Document test results'
      ],
      outputFormat: 'JSON with results, passedTests, totalTests, issues, documentation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'passedTests', 'totalTests', 'artifacts'],
      properties: {
        results: { type: 'array', items: { type: 'object' } },
        passedTests: { type: 'number' },
        totalTests: { type: 'number' },
        issues: { type: 'array', items: { type: 'object' } },
        documentation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'marketing-automation', 'testing', 'qa']
}));

export const launchMonitoringTask = defineTask('launch-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create launch and monitoring plan',
  agent: {
    name: 'launch-coordinator',
    prompt: {
      role: 'automation launch coordinator',
      task: 'Create launch plan and monitoring setup for workflows',
      context: args,
      instructions: [
        'Create launch checklist',
        'Plan phased rollout',
        'Set up performance dashboards',
        'Configure monitoring alerts',
        'Define health check procedures',
        'Plan escalation paths',
        'Create monitoring schedule',
        'Document launch procedures'
      ],
      outputFormat: 'JSON with launchPlan, dashboards, alerts, monitoringSchedule, documentation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['launchPlan', 'dashboards', 'artifacts'],
      properties: {
        launchPlan: { type: 'object' },
        dashboards: { type: 'array', items: { type: 'object' } },
        alerts: { type: 'array', items: { type: 'object' } },
        monitoringSchedule: { type: 'object' },
        documentation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'marketing-automation', 'launch', 'monitoring']
}));

export const optimizationFrameworkTask = defineTask('optimization-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create optimization framework',
  agent: {
    name: 'optimization-specialist',
    prompt: {
      role: 'marketing automation optimization specialist',
      task: 'Create framework for ongoing workflow optimization',
      context: args,
      instructions: [
        'Define optimization KPIs',
        'Create A/B testing plan',
        'Plan content optimization tests',
        'Define timing optimization approach',
        'Create optimization review cadence',
        'Plan iteration methodology',
        'Create report templates',
        'Document optimization playbook'
      ],
      outputFormat: 'JSON with framework, kpis, testingPlan, reviewCadence, reportTemplates, playbook, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'reportTemplates', 'artifacts'],
      properties: {
        framework: { type: 'object' },
        kpis: { type: 'array', items: { type: 'object' } },
        testingPlan: { type: 'object' },
        reviewCadence: { type: 'object' },
        reportTemplates: { type: 'array', items: { type: 'object' } },
        playbook: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'marketing-automation', 'optimization']
}));
