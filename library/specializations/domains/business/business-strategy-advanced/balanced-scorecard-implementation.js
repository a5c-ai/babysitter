/**
 * @process business-strategy/balanced-scorecard-implementation
 * @description Strategy execution using Balanced Scorecard framework across financial, customer, process, and learning perspectives
 * @inputs { organizationName: string, strategyContext: object, currentMetrics: object, stakeholderRequirements: object }
 * @outputs { success: boolean, balancedScorecard: object, strategyMap: object, performanceReviewProcess: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationName = 'Organization',
    strategyContext = {},
    currentMetrics = {},
    stakeholderRequirements = {},
    outputDir = 'bsc-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Balanced Scorecard Implementation for ${organizationName}`);

  // Phase 1: Financial Perspective
  ctx.log('info', 'Phase 1: Defining financial perspective objectives and measures');
  const financialPerspective = await ctx.task(financialPerspectiveTask, {
    organizationName, strategyContext, stakeholderRequirements, outputDir
  });
  artifacts.push(...financialPerspective.artifacts);

  // Phase 2: Customer Perspective
  ctx.log('info', 'Phase 2: Defining customer perspective objectives and measures');
  const customerPerspective = await ctx.task(customerPerspectiveTask, {
    organizationName, strategyContext, stakeholderRequirements, outputDir
  });
  artifacts.push(...customerPerspective.artifacts);

  // Phase 3: Internal Process Perspective
  ctx.log('info', 'Phase 3: Defining internal process perspective objectives and measures');
  const processPerspective = await ctx.task(processPerspectiveTask, {
    organizationName, strategyContext, financialPerspective, customerPerspective, outputDir
  });
  artifacts.push(...processPerspective.artifacts);

  // Phase 4: Learning and Growth Perspective
  ctx.log('info', 'Phase 4: Defining learning and growth perspective objectives and measures');
  const learningPerspective = await ctx.task(learningPerspectiveTask, {
    organizationName, strategyContext, processPerspective, outputDir
  });
  artifacts.push(...learningPerspective.artifacts);

  // Phase 5: Strategy Map Creation
  ctx.log('info', 'Phase 5: Creating strategy map linking objectives');
  const strategyMap = await ctx.task(strategyMapTask, {
    organizationName, financialPerspective, customerPerspective, processPerspective, learningPerspective, outputDir
  });
  artifacts.push(...strategyMap.artifacts);

  // Phase 6: Targets and Initiatives
  ctx.log('info', 'Phase 6: Establishing targets and initiatives');
  const targetsAndInitiatives = await ctx.task(targetsAndInitiativesTask, {
    organizationName, financialPerspective, customerPerspective, processPerspective, learningPerspective, currentMetrics, outputDir
  });
  artifacts.push(...targetsAndInitiatives.artifacts);

  // Phase 7: Performance Review Process
  ctx.log('info', 'Phase 7: Implementing performance management process');
  const performanceProcess = await ctx.task(performanceProcessTask, {
    organizationName, strategyMap, targetsAndInitiatives, outputDir
  });
  artifacts.push(...performanceProcess.artifacts);

  // Phase 8: Generate BSC Documentation
  ctx.log('info', 'Phase 8: Generating Balanced Scorecard documentation');
  const bscReport = await ctx.task(bscReportTask, {
    organizationName, financialPerspective, customerPerspective, processPerspective, learningPerspective,
    strategyMap, targetsAndInitiatives, performanceProcess, outputDir
  });
  artifacts.push(...bscReport.artifacts);

  await ctx.breakpoint({
    question: `Balanced Scorecard implementation complete for ${organizationName}. Review the BSC framework?`,
    title: 'Balanced Scorecard Implementation Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })) }
  });

  return {
    success: true, organizationName,
    balancedScorecard: {
      financial: financialPerspective.perspective,
      customer: customerPerspective.perspective,
      process: processPerspective.perspective,
      learning: learningPerspective.perspective
    },
    strategyMap: strategyMap.map,
    kpis: targetsAndInitiatives.kpis,
    performanceReviewProcess: performanceProcess.process,
    artifacts, duration: ctx.now() - startTime,
    metadata: { processId: 'business-strategy/balanced-scorecard-implementation', timestamp: startTime, outputDir }
  };
}

export const financialPerspectiveTask = defineTask('financial-perspective', (args, taskCtx) => ({
  kind: 'agent', title: 'Define financial perspective',
  agent: {
    name: 'financial-analyst',
    prompt: {
      role: 'financial strategy specialist',
      task: 'Define financial perspective objectives and measures for BSC',
      context: args,
      instructions: ['Define financial strategic objectives', 'Identify revenue growth objectives', 'Define productivity and cost objectives', 'Establish asset utilization objectives', 'Select financial KPIs and measures', 'Generate financial perspective documentation']
    },
    outputSchema: { type: 'object', required: ['perspective', 'artifacts'], properties: { perspective: { type: 'object' }, objectives: { type: 'array' }, measures: { type: 'array' }, kpis: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'bsc', 'financial']
}));

export const customerPerspectiveTask = defineTask('customer-perspective', (args, taskCtx) => ({
  kind: 'agent', title: 'Define customer perspective',
  agent: {
    name: 'customer-analyst',
    prompt: {
      role: 'customer strategy specialist',
      task: 'Define customer perspective objectives and measures for BSC',
      context: args,
      instructions: ['Define customer value proposition', 'Establish customer outcome objectives', 'Define market share and acquisition objectives', 'Establish retention and satisfaction objectives', 'Select customer KPIs and measures', 'Generate customer perspective documentation']
    },
    outputSchema: { type: 'object', required: ['perspective', 'artifacts'], properties: { perspective: { type: 'object' }, objectives: { type: 'array' }, measures: { type: 'array' }, kpis: { type: 'array' }, valueProposition: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'bsc', 'customer']
}));

export const processPerspectiveTask = defineTask('process-perspective', (args, taskCtx) => ({
  kind: 'agent', title: 'Define internal process perspective',
  agent: {
    name: 'process-analyst',
    prompt: {
      role: 'process strategy specialist',
      task: 'Define internal process perspective objectives and measures for BSC',
      context: args,
      instructions: ['Identify critical value chain processes', 'Define operations management objectives', 'Establish customer management process objectives', 'Define innovation process objectives', 'Define regulatory and social process objectives', 'Select process KPIs and measures', 'Generate process perspective documentation']
    },
    outputSchema: { type: 'object', required: ['perspective', 'artifacts'], properties: { perspective: { type: 'object' }, objectives: { type: 'array' }, measures: { type: 'array' }, kpis: { type: 'array' }, criticalProcesses: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'bsc', 'process']
}));

export const learningPerspectiveTask = defineTask('learning-perspective', (args, taskCtx) => ({
  kind: 'agent', title: 'Define learning and growth perspective',
  agent: {
    name: 'learning-analyst',
    prompt: {
      role: 'organizational development specialist',
      task: 'Define learning and growth perspective objectives and measures for BSC',
      context: args,
      instructions: ['Define human capital objectives', 'Establish information capital objectives', 'Define organization capital objectives', 'Identify strategic job families and skills', 'Select learning and growth KPIs', 'Generate learning perspective documentation']
    },
    outputSchema: { type: 'object', required: ['perspective', 'artifacts'], properties: { perspective: { type: 'object' }, objectives: { type: 'array' }, measures: { type: 'array' }, kpis: { type: 'array' }, capitalCategories: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'bsc', 'learning']
}));

export const strategyMapTask = defineTask('strategy-map', (args, taskCtx) => ({
  kind: 'agent', title: 'Create strategy map',
  agent: {
    name: 'strategy-mapper',
    prompt: {
      role: 'strategy mapping specialist',
      task: 'Create strategy map linking objectives across perspectives',
      context: args,
      instructions: ['Link objectives across four perspectives', 'Define cause-and-effect relationships', 'Identify strategic themes', 'Create visual strategy map', 'Validate linkages and logic', 'Generate strategy map documentation']
    },
    outputSchema: { type: 'object', required: ['map', 'artifacts'], properties: { map: { type: 'object' }, linkages: { type: 'array' }, strategicThemes: { type: 'array' }, visualization: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'bsc', 'strategy-map']
}));

export const targetsAndInitiativesTask = defineTask('targets-and-initiatives', (args, taskCtx) => ({
  kind: 'agent', title: 'Establish targets and initiatives',
  agent: {
    name: 'target-setter',
    prompt: {
      role: 'performance management specialist',
      task: 'Establish targets and strategic initiatives for each measure',
      context: args,
      instructions: ['Set baseline and target values for each measure', 'Define stretch targets where appropriate', 'Identify strategic initiatives to achieve targets', 'Link initiatives to objectives', 'Prioritize initiatives by impact', 'Generate targets and initiatives documentation']
    },
    outputSchema: { type: 'object', required: ['kpis', 'initiatives', 'artifacts'], properties: { kpis: { type: 'array' }, initiatives: { type: 'array' }, targets: { type: 'object' }, prioritization: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'bsc', 'targets']
}));

export const performanceProcessTask = defineTask('performance-process', (args, taskCtx) => ({
  kind: 'agent', title: 'Implement performance management process',
  agent: {
    name: 'performance-manager',
    prompt: {
      role: 'performance management specialist',
      task: 'Design performance management and review process',
      context: args,
      instructions: ['Define review cadence (monthly, quarterly, annual)', 'Establish data collection and reporting process', 'Design performance dashboards', 'Define escalation and action planning process', 'Establish accountability framework', 'Generate performance process documentation']
    },
    outputSchema: { type: 'object', required: ['process', 'artifacts'], properties: { process: { type: 'object' }, reviewCadence: { type: 'object' }, dashboardDesign: { type: 'object' }, accountabilityFramework: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'bsc', 'performance']
}));

export const bscReportTask = defineTask('bsc-report', (args, taskCtx) => ({
  kind: 'agent', title: 'Generate Balanced Scorecard documentation',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'BSC documentation specialist',
      task: 'Generate comprehensive Balanced Scorecard documentation',
      context: args,
      instructions: ['Create executive summary', 'Document all four perspectives', 'Include strategy map visualization', 'Present KPIs, targets, and initiatives', 'Document performance review process', 'Format as professional BSC report']
    },
    outputSchema: { type: 'object', required: ['reportPath', 'artifacts'], properties: { reportPath: { type: 'string' }, executiveSummary: { type: 'string' }, keyFindings: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'bsc', 'reporting']
}));
