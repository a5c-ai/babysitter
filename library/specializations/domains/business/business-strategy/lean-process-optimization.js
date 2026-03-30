/**
 * @process business-strategy/lean-process-optimization
 * @description Application of lean principles to eliminate waste, improve flow, and maximize value delivery across operational processes
 * @inputs { processScope: string, organizationContext: object, currentState: object, outputDir: string }
 * @outputs { success: boolean, wasteAnalysis: object, futureState: object, implementationPlan: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    processScope = '',
    organizationContext = {},
    currentState = {},
    outputDir = 'lean-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Lean Process Optimization Process');

  // Phase 1: Current State Value Stream Mapping
  ctx.log('info', 'Phase 1: Mapping current state value stream');
  const currentStateMap = await ctx.task(currentStateMapTask, {
    processScope,
    currentState,
    outputDir
  });
  artifacts.push(...currentStateMap.artifacts);

  // Phase 2: Waste Identification (8 Wastes)
  ctx.log('info', 'Phase 2: Identifying waste');
  const wasteIdentification = await ctx.task(wasteIdentificationTask, {
    currentStateMap: currentStateMap.map,
    outputDir
  });
  artifacts.push(...wasteIdentification.artifacts);

  // Phase 3: Root Cause Analysis
  ctx.log('info', 'Phase 3: Analyzing root causes');
  const rootCauseAnalysis = await ctx.task(rootCauseAnalysisTask, {
    wastes: wasteIdentification.wastes,
    currentStateMap: currentStateMap.map,
    outputDir
  });
  artifacts.push(...rootCauseAnalysis.artifacts);

  // Phase 4: Future State Design
  ctx.log('info', 'Phase 4: Designing future state');
  const futureStateDesign = await ctx.task(futureStateDesignTask, {
    currentStateMap: currentStateMap.map,
    wasteIdentification,
    rootCauseAnalysis,
    outputDir
  });
  artifacts.push(...futureStateDesign.artifacts);

  // Phase 5: Improvement Opportunities
  ctx.log('info', 'Phase 5: Identifying improvement opportunities');
  const improvements = await ctx.task(improvementOpportunitiesTask, {
    currentStateMap: currentStateMap.map,
    futureStateDesign,
    outputDir
  });
  artifacts.push(...improvements.artifacts);

  // Phase 6: Implementation Plan
  ctx.log('info', 'Phase 6: Creating implementation plan');
  const implementationPlan = await ctx.task(implementationPlanTask, {
    improvements: improvements.opportunities,
    organizationContext,
    outputDir
  });
  artifacts.push(...implementationPlan.artifacts);

  // Phase 7: Generate Report
  ctx.log('info', 'Phase 7: Generating lean optimization report');
  const leanReport = await ctx.task(leanReportTask, {
    currentStateMap,
    wasteIdentification,
    rootCauseAnalysis,
    futureStateDesign,
    improvements,
    implementationPlan,
    outputDir
  });
  artifacts.push(...leanReport.artifacts);

  const endTime = ctx.now();

  return {
    success: true,
    wasteAnalysis: wasteIdentification.wastes,
    futureState: futureStateDesign.futureState,
    implementationPlan: implementationPlan.plan,
    expectedImprovements: improvements.expectedBenefits,
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'business-strategy/lean-process-optimization',
      timestamp: startTime,
      processScope
    }
  };
}

// Task Definitions
export const currentStateMapTask = defineTask('current-state-map', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map current state value stream',
  agent: {
    name: 'lean-analyst',
    prompt: {
      role: 'lean six sigma practitioner',
      task: 'Create current state value stream map',
      context: args,
      instructions: [
        'Map the end-to-end process flow',
        'Document process steps, cycle times, wait times',
        'Calculate value-add vs non-value-add time',
        'Identify information flows and material flows',
        'Calculate process efficiency metrics',
        'Save map to output directory'
      ],
      outputFormat: 'JSON with map (object), metrics (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['map', 'artifacts'],
      properties: {
        map: { type: 'object' },
        metrics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'lean', 'value-stream']
}));

export const wasteIdentificationTask = defineTask('waste-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify 8 types of waste',
  agent: {
    name: 'waste-analyst',
    prompt: {
      role: 'lean waste identification expert',
      task: 'Identify and quantify 8 types of waste (TIMWOODS)',
      context: args,
      instructions: [
        'Identify wastes: Transportation, Inventory, Motion, Waiting, Overproduction, Overprocessing, Defects, Skills underutilization',
        'Quantify each waste type',
        'Prioritize by impact',
        'Save analysis to output directory'
      ],
      outputFormat: 'JSON with wastes (array), totalWasteImpact (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['wastes', 'artifacts'],
      properties: {
        wastes: { type: 'array' },
        totalWasteImpact: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'lean', 'waste']
}));

export const rootCauseAnalysisTask = defineTask('root-cause-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze root causes',
  agent: {
    name: 'root-cause-analyst',
    prompt: {
      role: 'root cause analysis expert',
      task: 'Analyze root causes of identified wastes',
      context: args,
      instructions: [
        'Apply 5 Whys analysis',
        'Create fishbone diagrams',
        'Identify systemic causes',
        'Save analysis to output directory'
      ],
      outputFormat: 'JSON with rootCauses (array), analysis (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['rootCauses', 'artifacts'],
      properties: {
        rootCauses: { type: 'array' },
        analysis: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'lean', 'root-cause']
}));

export const futureStateDesignTask = defineTask('future-state-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design future state',
  agent: {
    name: 'process-designer',
    prompt: {
      role: 'lean process designer',
      task: 'Design optimized future state value stream',
      context: args,
      instructions: [
        'Apply lean principles (flow, pull, perfection)',
        'Design waste-free process',
        'Calculate target metrics',
        'Save design to output directory'
      ],
      outputFormat: 'JSON with futureState (object), targetMetrics (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['futureState', 'artifacts'],
      properties: {
        futureState: { type: 'object' },
        targetMetrics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'lean', 'future-state']
}));

export const improvementOpportunitiesTask = defineTask('improvement-opportunities', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify improvement opportunities',
  agent: {
    name: 'improvement-analyst',
    prompt: {
      role: 'continuous improvement specialist',
      task: 'Identify and prioritize improvement opportunities',
      context: args,
      instructions: [
        'Identify kaizen opportunities',
        'Calculate expected benefits',
        'Prioritize by impact and effort',
        'Save opportunities to output directory'
      ],
      outputFormat: 'JSON with opportunities (array), expectedBenefits (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['opportunities', 'expectedBenefits', 'artifacts'],
      properties: {
        opportunities: { type: 'array' },
        expectedBenefits: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'lean', 'improvement']
}));

export const implementationPlanTask = defineTask('implementation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create implementation plan',
  agent: {
    name: 'implementation-planner',
    prompt: {
      role: 'lean implementation specialist',
      task: 'Create detailed implementation plan',
      context: args,
      instructions: [
        'Define implementation phases',
        'Create timeline and milestones',
        'Identify resources needed',
        'Define success metrics',
        'Save plan to output directory'
      ],
      outputFormat: 'JSON with plan (object), timeline (object), resources (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        timeline: { type: 'object' },
        resources: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'lean', 'implementation']
}));

export const leanReportTask = defineTask('lean-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate lean optimization report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'lean consultant and technical writer',
      task: 'Generate comprehensive lean optimization report',
      context: args,
      instructions: [
        'Create executive summary',
        'Include value stream maps',
        'Document waste analysis',
        'Present future state design',
        'Include implementation roadmap',
        'Save report to output directory'
      ],
      outputFormat: 'JSON with reportPath (string), executiveSummary (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'lean', 'reporting']
}));
