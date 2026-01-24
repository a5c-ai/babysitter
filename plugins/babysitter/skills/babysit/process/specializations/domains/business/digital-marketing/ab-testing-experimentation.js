/**
 * @process digital-marketing/ab-testing-experimentation
 * @description Process for designing, executing, and analyzing A/B tests and experiments to optimize marketing performance across channels and touchpoints
 * @inputs { testingHypotheses: array, historicalData: object, sampleSizeCalculator: object, outputDir: string }
 * @outputs { success: boolean, testDocumentation: array, resultsAnalysis: array, implementationRecommendations: array, learningsDatabase: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    testingHypotheses = [],
    historicalData = {},
    sampleSizeCalculator = {},
    outputDir = 'ab-testing-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting A/B Testing and Experimentation process');

  // Task 1: Identify Testing Opportunities
  ctx.log('info', 'Phase 1: Identifying testing opportunities and hypotheses');
  const opportunityIdentification = await ctx.task(testOpportunityTask, {
    testingHypotheses,
    historicalData,
    outputDir
  });
  artifacts.push(...opportunityIdentification.artifacts);

  // Task 2: Prioritize Tests
  ctx.log('info', 'Phase 2: Prioritizing tests based on impact and effort');
  const testPrioritization = await ctx.task(testPrioritizationTask, {
    opportunityIdentification,
    outputDir
  });
  artifacts.push(...testPrioritization.artifacts);

  // Task 3: Design Test Structure
  ctx.log('info', 'Phase 3: Designing test structure and variations');
  const testDesign = await ctx.task(testDesignTask, {
    testPrioritization,
    outputDir
  });
  artifacts.push(...testDesign.artifacts);

  // Task 4: Calculate Sample Size
  ctx.log('info', 'Phase 4: Calculating sample size requirements');
  const sampleSizeCalc = await ctx.task(sampleSizeCalculationTask, {
    testDesign,
    historicalData,
    sampleSizeCalculator,
    outputDir
  });
  artifacts.push(...sampleSizeCalc.artifacts);

  // Task 5: Configure Test in Platform
  ctx.log('info', 'Phase 5: Configuring test in experimentation platform');
  const testConfiguration = await ctx.task(testConfigurationTask, {
    testDesign,
    sampleSizeCalc,
    outputDir
  });
  artifacts.push(...testConfiguration.artifacts);

  // Task 6: QA Test Setup
  ctx.log('info', 'Phase 6: QA testing setup and tracking');
  const qaSetup = await ctx.task(testQATask, {
    testConfiguration,
    outputDir
  });
  artifacts.push(...qaSetup.artifacts);

  // Breakpoint: Review before launch
  await ctx.breakpoint({
    question: `A/B test ready for launch. ${testConfiguration.variationCount} variations configured. Required sample: ${sampleSizeCalc.requiredSampleSize}. QA passed: ${qaSetup.passed}. Launch test?`,
    title: 'A/B Test Launch Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        variationCount: testConfiguration.variationCount,
        requiredSampleSize: sampleSizeCalc.requiredSampleSize,
        estimatedDuration: sampleSizeCalc.estimatedDuration,
        qaPassed: qaSetup.passed
      }
    }
  });

  // Task 7: Launch Test and Monitor
  ctx.log('info', 'Phase 7: Creating launch and monitoring plan');
  const launchMonitoring = await ctx.task(launchMonitoringTask, {
    testConfiguration,
    sampleSizeCalc,
    outputDir
  });
  artifacts.push(...launchMonitoring.artifacts);

  // Task 8: Analyze Results
  ctx.log('info', 'Phase 8: Creating results analysis framework');
  const resultsAnalysis = await ctx.task(resultsAnalysisTask, {
    testDesign,
    sampleSizeCalc,
    outputDir
  });
  artifacts.push(...resultsAnalysis.artifacts);

  // Task 9: Document Findings
  ctx.log('info', 'Phase 9: Creating findings documentation framework');
  const findingsDocumentation = await ctx.task(findingsDocumentationTask, {
    resultsAnalysis,
    testDesign,
    outputDir
  });
  artifacts.push(...findingsDocumentation.artifacts);

  // Task 10: Implementation Plan
  ctx.log('info', 'Phase 10: Creating implementation recommendation framework');
  const implementationPlan = await ctx.task(implementationPlanTask, {
    resultsAnalysis,
    findingsDocumentation,
    outputDir
  });
  artifacts.push(...implementationPlan.artifacts);

  // Task 11: Share Learnings
  ctx.log('info', 'Phase 11: Creating learnings sharing framework');
  const learningsSharing = await ctx.task(learningsSharingTask, {
    findingsDocumentation,
    implementationPlan,
    outputDir
  });
  artifacts.push(...learningsSharing.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    testDocumentation: testDesign.documentation,
    resultsAnalysis: resultsAnalysis.framework,
    implementationRecommendations: implementationPlan.recommendations,
    learningsDatabase: learningsSharing.database,
    testConfiguration: testConfiguration.config,
    monitoringPlan: launchMonitoring.plan,
    qaResults: qaSetup.results,
    artifacts,
    duration,
    metadata: {
      processId: 'digital-marketing/ab-testing-experimentation',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task definitions
export const testOpportunityTask = defineTask('test-opportunity', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify testing opportunities and hypotheses',
  agent: {
    name: 'experimentation-strategist',
    prompt: {
      role: 'experimentation strategist',
      task: 'Identify A/B testing opportunities and formulate hypotheses',
      context: args,
      instructions: [
        'Review historical performance data',
        'Identify underperforming areas',
        'Generate test hypotheses',
        'Define expected impact',
        'Identify quick win opportunities',
        'Consider user research insights',
        'Document opportunity rationale',
        'Create hypothesis documentation'
      ],
      outputFormat: 'JSON with opportunities, hypotheses, opportunityCount, expectedImpact, documentation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['opportunities', 'hypotheses', 'artifacts'],
      properties: {
        opportunities: { type: 'array', items: { type: 'object' } },
        hypotheses: { type: 'array', items: { type: 'object' } },
        opportunityCount: { type: 'number' },
        expectedImpact: { type: 'object' },
        documentation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'opportunities', 'hypotheses']
}));

export const testPrioritizationTask = defineTask('test-prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prioritize tests based on impact and effort',
  agent: {
    name: 'test-prioritizer',
    prompt: {
      role: 'experimentation program manager',
      task: 'Prioritize tests using impact/effort framework',
      context: args,
      instructions: [
        'Score tests by potential impact',
        'Estimate implementation effort',
        'Calculate priority scores',
        'Consider resource constraints',
        'Create prioritized test backlog',
        'Identify dependencies',
        'Plan test roadmap',
        'Document prioritization rationale'
      ],
      outputFormat: 'JSON with prioritizedTests, testBacklog, roadmap, dependencies, rationale, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['prioritizedTests', 'artifacts'],
      properties: {
        prioritizedTests: { type: 'array', items: { type: 'object' } },
        testBacklog: { type: 'array', items: { type: 'object' } },
        roadmap: { type: 'object' },
        dependencies: { type: 'array', items: { type: 'object' } },
        rationale: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'prioritization']
}));

export const testDesignTask = defineTask('test-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design test structure and variations',
  agent: {
    name: 'test-designer',
    prompt: {
      role: 'experimentation designer',
      task: 'Design detailed test structure and variations',
      context: args,
      instructions: [
        'Define control and treatment groups',
        'Design variation specifications',
        'Define success metrics',
        'Set guardrail metrics',
        'Plan traffic allocation',
        'Define exclusion criteria',
        'Create test documentation',
        'Design variation mockups'
      ],
      outputFormat: 'JSON with design, variations, metrics, trafficAllocation, documentation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'documentation', 'artifacts'],
      properties: {
        design: { type: 'object' },
        variations: { type: 'array', items: { type: 'object' } },
        metrics: { type: 'object' },
        trafficAllocation: { type: 'object' },
        documentation: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'design', 'variations']
}));

export const sampleSizeCalculationTask = defineTask('sample-size-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate sample size requirements',
  agent: {
    name: 'statistical-analyst',
    prompt: {
      role: 'experimentation statistician',
      task: 'Calculate sample size requirements for statistical significance',
      context: args,
      instructions: [
        'Define baseline conversion rate',
        'Set minimum detectable effect',
        'Define statistical power (typically 80%)',
        'Set significance level (typically 95%)',
        'Calculate required sample size',
        'Estimate test duration',
        'Consider multiple comparisons',
        'Document calculation methodology'
      ],
      outputFormat: 'JSON with requiredSampleSize, estimatedDuration, assumptions, methodology, documentation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['requiredSampleSize', 'estimatedDuration', 'artifacts'],
      properties: {
        requiredSampleSize: { type: 'number' },
        estimatedDuration: { type: 'string' },
        assumptions: { type: 'object' },
        methodology: { type: 'object' },
        documentation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'sample-size', 'statistics']
}));

export const testConfigurationTask = defineTask('test-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure test in experimentation platform',
  agent: {
    name: 'test-configurator',
    prompt: {
      role: 'experimentation platform specialist',
      task: 'Configure A/B test in experimentation platform',
      context: args,
      instructions: [
        'Set up test in platform',
        'Configure variations',
        'Set traffic allocation',
        'Configure targeting rules',
        'Set up tracking and events',
        'Configure goals and metrics',
        'Set test duration',
        'Document configuration'
      ],
      outputFormat: 'JSON with config, variationCount, targeting, tracking, documentation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'variationCount', 'artifacts'],
      properties: {
        config: { type: 'object' },
        variationCount: { type: 'number' },
        targeting: { type: 'object' },
        tracking: { type: 'object' },
        documentation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'configuration', 'platform']
}));

export const testQATask = defineTask('test-qa', (args, taskCtx) => ({
  kind: 'agent',
  title: 'QA test setup and tracking',
  agent: {
    name: 'test-qa-specialist',
    prompt: {
      role: 'experimentation QA specialist',
      task: 'Perform quality assurance on test setup',
      context: args,
      instructions: [
        'Test variation rendering',
        'Verify tracking accuracy',
        'Test targeting rules',
        'Verify event firing',
        'Test edge cases',
        'Check mobile experience',
        'Verify analytics integration',
        'Document QA results'
      ],
      outputFormat: 'JSON with results, passed, issues, checklist, documentation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'passed', 'artifacts'],
      properties: {
        results: { type: 'array', items: { type: 'object' } },
        passed: { type: 'boolean' },
        issues: { type: 'array', items: { type: 'object' } },
        checklist: { type: 'array', items: { type: 'object' } },
        documentation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'qa', 'testing']
}));

export const launchMonitoringTask = defineTask('launch-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create launch and monitoring plan',
  agent: {
    name: 'test-monitor',
    prompt: {
      role: 'experimentation operations specialist',
      task: 'Create test launch and monitoring plan',
      context: args,
      instructions: [
        'Create launch checklist',
        'Define monitoring schedule',
        'Set up performance alerts',
        'Define stopping rules',
        'Plan interim analysis',
        'Configure dashboards',
        'Document monitoring procedures',
        'Create escalation paths'
      ],
      outputFormat: 'JSON with plan, launchChecklist, monitoringSchedule, alerts, stoppingRules, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        launchChecklist: { type: 'array', items: { type: 'object' } },
        monitoringSchedule: { type: 'object' },
        alerts: { type: 'array', items: { type: 'object' } },
        stoppingRules: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'launch', 'monitoring']
}));

export const resultsAnalysisTask = defineTask('results-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create results analysis framework',
  agent: {
    name: 'results-analyst',
    prompt: {
      role: 'experimentation analyst',
      task: 'Create framework for analyzing test results',
      context: args,
      instructions: [
        'Define analysis methodology',
        'Plan statistical tests',
        'Create analysis templates',
        'Plan segmentation analysis',
        'Define significance criteria',
        'Plan secondary metric analysis',
        'Create visualization templates',
        'Document analysis procedures'
      ],
      outputFormat: 'JSON with framework, methodology, templates, segmentationPlan, criteria, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'artifacts'],
      properties: {
        framework: { type: 'object' },
        methodology: { type: 'object' },
        templates: { type: 'array', items: { type: 'object' } },
        segmentationPlan: { type: 'object' },
        criteria: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'analysis', 'results']
}));

export const findingsDocumentationTask = defineTask('findings-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create findings documentation framework',
  agent: {
    name: 'findings-documenter',
    prompt: {
      role: 'experimentation documentation specialist',
      task: 'Create framework for documenting test findings',
      context: args,
      instructions: [
        'Create findings template',
        'Document hypothesis vs results',
        'Capture unexpected findings',
        'Document segment insights',
        'Create executive summary template',
        'Plan stakeholder communication',
        'Document limitations',
        'Create documentation standards'
      ],
      outputFormat: 'JSON with template, documentationStandards, communicationPlan, summaryTemplate, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['template', 'artifacts'],
      properties: {
        template: { type: 'object' },
        documentationStandards: { type: 'object' },
        communicationPlan: { type: 'object' },
        summaryTemplate: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'documentation', 'findings']
}));

export const implementationPlanTask = defineTask('implementation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create implementation recommendation framework',
  agent: {
    name: 'implementation-planner',
    prompt: {
      role: 'experimentation implementation specialist',
      task: 'Create framework for implementing winning variations',
      context: args,
      instructions: [
        'Define winner criteria',
        'Create implementation checklist',
        'Plan rollout strategy',
        'Define monitoring post-implementation',
        'Plan edge case handling',
        'Document rollback procedures',
        'Create implementation timeline template',
        'Document recommendations framework'
      ],
      outputFormat: 'JSON with recommendations, criteria, checklist, rolloutStrategy, rollbackProcedures, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'artifacts'],
      properties: {
        recommendations: { type: 'array', items: { type: 'object' } },
        criteria: { type: 'object' },
        checklist: { type: 'array', items: { type: 'object' } },
        rolloutStrategy: { type: 'object' },
        rollbackProcedures: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'implementation', 'recommendations']
}));

export const learningsSharingTask = defineTask('learnings-sharing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create learnings sharing framework',
  agent: {
    name: 'learnings-curator',
    prompt: {
      role: 'experimentation knowledge manager',
      task: 'Create framework for sharing and cataloging learnings',
      context: args,
      instructions: [
        'Create learnings database structure',
        'Define tagging taxonomy',
        'Plan knowledge sharing sessions',
        'Create searchable repository',
        'Plan cross-team sharing',
        'Define insight categories',
        'Create learnings templates',
        'Document knowledge management process'
      ],
      outputFormat: 'JSON with database, taxonomy, sharingPlan, repository, process, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['database', 'artifacts'],
      properties: {
        database: { type: 'object' },
        taxonomy: { type: 'object' },
        sharingPlan: { type: 'object' },
        repository: { type: 'object' },
        process: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'learnings', 'knowledge-management']
}));
