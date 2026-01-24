/**
 * @process specializations/domains/business/decision-intelligence/ab-testing-experimentation
 * @description A/B Testing and Experimentation Framework - Establishment of controlled experimentation
 * capabilities for data-driven decision validation and continuous improvement.
 * @inputs { projectName: string, experimentContext: object, hypotheses: array, metrics: array, constraints?: object }
 * @outputs { success: boolean, experimentDesign: object, analysisFramework: object, governanceModel: object, platformRequirements: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/decision-intelligence/ab-testing-experimentation', {
 *   projectName: 'Digital Experience Experimentation Program',
 *   experimentContext: { domain: 'website', traffic: '1M monthly visitors' },
 *   hypotheses: ['New checkout flow increases conversion', 'Personalization increases engagement'],
 *   metrics: ['conversion rate', 'revenue per visitor', 'engagement']
 * });
 *
 * @references
 * - Online Experiments: https://hbr.org/2017/09/the-surprising-power-of-online-experiments
 * - Trustworthy Online Controlled Experiments (Microsoft, Google)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    experimentContext = {},
    hypotheses = [],
    metrics = [],
    constraints = {},
    outputDir = 'ab-testing-output'
  } = inputs;

  // Phase 1: Experimentation Strategy
  const experimentationStrategy = await ctx.task(experimentationStrategyTask, {
    projectName,
    experimentContext,
    hypotheses
  });

  // Phase 2: Metric Framework
  const metricFramework = await ctx.task(experimentMetricFrameworkTask, {
    projectName,
    metrics,
    experimentContext
  });

  // Phase 3: Statistical Design
  const statisticalDesign = await ctx.task(statisticalDesignTask, {
    projectName,
    metricFramework,
    experimentContext,
    constraints
  });

  // Phase 4: Platform Requirements
  const platformRequirements = await ctx.task(experimentPlatformTask, {
    projectName,
    statisticalDesign,
    experimentContext
  });

  // Breakpoint: Review experimentation framework
  await ctx.breakpoint({
    question: `Review experimentation framework for ${projectName}. Is the statistical rigor appropriate?`,
    title: 'Experimentation Framework Review',
    context: {
      runId: ctx.runId,
      projectName,
      sampleSize: statisticalDesign.sampleSize || 'TBD'
    }
  });

  // Phase 5: Analysis Framework
  const analysisFramework = await ctx.task(experimentAnalysisFrameworkTask, {
    projectName,
    statisticalDesign,
    metricFramework
  });

  // Phase 6: Governance Model
  const governanceModel = await ctx.task(experimentGovernanceTask, {
    projectName,
    experimentationStrategy,
    analysisFramework
  });

  // Phase 7: Operations Design
  const operationsDesign = await ctx.task(experimentOperationsTask, {
    projectName,
    platformRequirements,
    governanceModel,
    analysisFramework
  });

  // Phase 8: Launch Readiness
  const launchReadiness = await ctx.task(experimentLaunchReadinessTask, {
    projectName,
    operationsDesign,
    platformRequirements,
    governanceModel
  });

  return {
    success: true,
    projectName,
    experimentationStrategy,
    metricFramework,
    experimentDesign: statisticalDesign,
    platformRequirements,
    analysisFramework,
    governanceModel,
    operationsDesign,
    launchReadiness,
    metadata: {
      processId: 'specializations/domains/business/decision-intelligence/ab-testing-experimentation',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const experimentationStrategyTask = defineTask('experimentation-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Experimentation Strategy - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Experimentation Strategy Lead',
      task: 'Define experimentation strategy and roadmap',
      context: args,
      instructions: [
        '1. Define experimentation objectives',
        '2. Identify experimentation opportunities',
        '3. Prioritize experiment backlog',
        '4. Define experiment velocity targets',
        '5. Identify resource requirements',
        '6. Define maturity roadmap',
        '7. Identify cultural requirements',
        '8. Create strategy document'
      ],
      outputFormat: 'JSON object with experimentation strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['objectives', 'roadmap', 'priorities'],
      properties: {
        objectives: { type: 'array' },
        opportunities: { type: 'array' },
        backlog: { type: 'array' },
        velocityTargets: { type: 'object' },
        roadmap: { type: 'object' },
        priorities: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'experimentation', 'strategy']
}));

export const experimentMetricFrameworkTask = defineTask('experiment-metric-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: `Metric Framework - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Experiment Metrics Specialist',
      task: 'Design experimentation metric framework',
      context: args,
      instructions: [
        '1. Define primary success metrics',
        '2. Define guardrail metrics',
        '3. Define diagnostic metrics',
        '4. Establish metric hierarchy',
        '5. Define metric sensitivity',
        '6. Create metric documentation',
        '7. Define metric baselines',
        '8. Plan metric instrumentation'
      ],
      outputFormat: 'JSON object with metric framework'
    },
    outputSchema: {
      type: 'object',
      required: ['primaryMetrics', 'guardrails', 'hierarchy'],
      properties: {
        primaryMetrics: { type: 'array' },
        guardrails: { type: 'array' },
        diagnostics: { type: 'array' },
        hierarchy: { type: 'object' },
        sensitivity: { type: 'object' },
        instrumentation: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'experimentation', 'metrics']
}));

export const statisticalDesignTask = defineTask('statistical-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Statistical Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Experimentation Statistician',
      task: 'Design statistical framework for experiments',
      context: args,
      instructions: [
        '1. Define statistical significance thresholds',
        '2. Calculate sample size requirements',
        '3. Design randomization approach',
        '4. Plan for multiple testing correction',
        '5. Design sequential testing if applicable',
        '6. Plan for heterogeneous treatment effects',
        '7. Define stopping rules',
        '8. Document statistical methods'
      ],
      outputFormat: 'JSON object with statistical design'
    },
    outputSchema: {
      type: 'object',
      required: ['sampleSize', 'significance', 'randomization'],
      properties: {
        significance: { type: 'object' },
        sampleSize: { type: 'object' },
        power: { type: 'object' },
        randomization: { type: 'object' },
        multipleTesting: { type: 'object' },
        stoppingRules: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'experimentation', 'statistics']
}));

export const experimentPlatformTask = defineTask('experiment-platform', (args, taskCtx) => ({
  kind: 'agent',
  title: `Platform Requirements - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Experimentation Platform Architect',
      task: 'Define experimentation platform requirements',
      context: args,
      instructions: [
        '1. Define platform capabilities',
        '2. Specify assignment mechanisms',
        '3. Define data collection requirements',
        '4. Specify analysis capabilities',
        '5. Define integration requirements',
        '6. Specify UI/UX needs',
        '7. Evaluate build vs buy',
        '8. Create platform specifications'
      ],
      outputFormat: 'JSON object with platform requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['capabilities', 'assignment', 'integration'],
      properties: {
        capabilities: { type: 'array' },
        assignment: { type: 'object' },
        dataCollection: { type: 'object' },
        analysis: { type: 'object' },
        integration: { type: 'array' },
        buildVsBuy: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'experimentation', 'platform']
}));

export const experimentAnalysisFrameworkTask = defineTask('experiment-analysis-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analysis Framework - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Experiment Analysis Expert',
      task: 'Design experiment analysis framework',
      context: args,
      instructions: [
        '1. Define analysis pipeline',
        '2. Specify pre-experiment checks',
        '3. Define during-experiment monitoring',
        '4. Specify post-experiment analysis',
        '5. Design heterogeneity analysis',
        '6. Plan causal inference methods',
        '7. Define reporting templates',
        '8. Create analysis playbook'
      ],
      outputFormat: 'JSON object with analysis framework'
    },
    outputSchema: {
      type: 'object',
      required: ['pipeline', 'preChecks', 'postAnalysis'],
      properties: {
        pipeline: { type: 'object' },
        preChecks: { type: 'array' },
        monitoring: { type: 'object' },
        postAnalysis: { type: 'object' },
        heterogeneity: { type: 'object' },
        reporting: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'experimentation', 'analysis']
}));

export const experimentGovernanceTask = defineTask('experiment-governance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Governance Model - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Experimentation Governance Lead',
      task: 'Define experimentation governance model',
      context: args,
      instructions: [
        '1. Define experiment approval process',
        '2. Establish review committee',
        '3. Define ethical guidelines',
        '4. Create launch criteria',
        '5. Define ship decision process',
        '6. Establish escalation paths',
        '7. Define documentation requirements',
        '8. Create governance playbook'
      ],
      outputFormat: 'JSON object with governance model'
    },
    outputSchema: {
      type: 'object',
      required: ['approvalProcess', 'ethics', 'shipDecision'],
      properties: {
        approvalProcess: { type: 'object' },
        reviewCommittee: { type: 'object' },
        ethics: { type: 'object' },
        launchCriteria: { type: 'array' },
        shipDecision: { type: 'object' },
        documentation: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'experimentation', 'governance']
}));

export const experimentOperationsTask = defineTask('experiment-operations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Operations Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Experimentation Operations Manager',
      task: 'Design experimentation operations',
      context: args,
      instructions: [
        '1. Define roles and responsibilities',
        '2. Design experiment workflow',
        '3. Create training program',
        '4. Define support model',
        '5. Plan capacity management',
        '6. Define SLAs',
        '7. Create operational playbooks',
        '8. Design knowledge management'
      ],
      outputFormat: 'JSON object with operations design'
    },
    outputSchema: {
      type: 'object',
      required: ['roles', 'workflow', 'training'],
      properties: {
        roles: { type: 'object' },
        workflow: { type: 'object' },
        training: { type: 'object' },
        support: { type: 'object' },
        capacity: { type: 'object' },
        slas: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'experimentation', 'operations']
}));

export const experimentLaunchReadinessTask = defineTask('experiment-launch-readiness', (args, taskCtx) => ({
  kind: 'agent',
  title: `Launch Readiness - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Experimentation Program Manager',
      task: 'Assess launch readiness for experimentation program',
      context: args,
      instructions: [
        '1. Create readiness checklist',
        '2. Assess platform readiness',
        '3. Validate governance readiness',
        '4. Check operational readiness',
        '5. Plan pilot experiments',
        '6. Define success criteria',
        '7. Create launch timeline',
        '8. Document risks and mitigations'
      ],
      outputFormat: 'JSON object with launch readiness'
    },
    outputSchema: {
      type: 'object',
      required: ['checklist', 'readiness', 'timeline'],
      properties: {
        checklist: { type: 'array' },
        platformReadiness: { type: 'object' },
        governanceReadiness: { type: 'object' },
        readiness: { type: 'object' },
        pilots: { type: 'array' },
        timeline: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'experimentation', 'launch']
}));
