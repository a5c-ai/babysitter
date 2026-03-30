/**
 * @process business-strategy/scenario-planning
 * @description Developing alternative future scenarios for strategic planning and risk management
 * @inputs { organizationName: string, industryContext: object, timeHorizon: string, strategicQuestions: array }
 * @outputs { success: boolean, scenarios: array, strategyStressTest: object, signpostSystem: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationName = 'Organization',
    industryContext = {},
    timeHorizon = '10 years',
    strategicQuestions = [],
    outputDir = 'scenario-planning-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Scenario Planning for ${organizationName}`);

  // Phase 1: Driving Forces Identification
  ctx.log('info', 'Phase 1: Identifying key driving forces and uncertainties');
  const drivingForces = await ctx.task(drivingForcesTask, {
    organizationName, industryContext, timeHorizon, outputDir
  });
  artifacts.push(...drivingForces.artifacts);

  // Phase 2: Critical Uncertainties Selection
  ctx.log('info', 'Phase 2: Selecting critical uncertainties for scenario framework');
  const criticalUncertainties = await ctx.task(criticalUncertaintiesTask, {
    organizationName, drivingForces, strategicQuestions, outputDir
  });
  artifacts.push(...criticalUncertainties.artifacts);

  // Phase 3: Scenario Framework Development
  ctx.log('info', 'Phase 3: Developing scenario framework (2x2 matrix)');
  const scenarioFramework = await ctx.task(scenarioFrameworkTask, {
    organizationName, criticalUncertainties, outputDir
  });
  artifacts.push(...scenarioFramework.artifacts);

  // Phase 4: Scenario Narrative Development
  ctx.log('info', 'Phase 4: Creating detailed scenario narratives');
  const scenarioNarratives = await ctx.task(scenarioNarrativesTask, {
    organizationName, scenarioFramework, drivingForces, timeHorizon, outputDir
  });
  artifacts.push(...scenarioNarratives.artifacts);

  // Phase 5: Strategic Implications Analysis
  ctx.log('info', 'Phase 5: Analyzing strategic implications for each scenario');
  const strategicImplications = await ctx.task(scenarioImplicationsTask, {
    organizationName, scenarioNarratives, strategicQuestions, outputDir
  });
  artifacts.push(...strategicImplications.artifacts);

  // Phase 6: Strategy Stress Testing
  ctx.log('info', 'Phase 6: Stress testing current strategy against scenarios');
  const strategyStressTest = await ctx.task(strategyStressTestTask, {
    organizationName, scenarioNarratives, strategicImplications, outputDir
  });
  artifacts.push(...strategyStressTest.artifacts);

  // Phase 7: Signpost Development
  ctx.log('info', 'Phase 7: Identifying signposts and early warning indicators');
  const signpostSystem = await ctx.task(signpostDevelopmentTask, {
    organizationName, scenarioNarratives, criticalUncertainties, outputDir
  });
  artifacts.push(...signpostSystem.artifacts);

  // Phase 8: Strategic Options Development
  ctx.log('info', 'Phase 8: Developing strategic options for scenario adaptation');
  const strategicOptions = await ctx.task(scenarioStrategicOptionsTask, {
    organizationName, strategyStressTest, strategicImplications, outputDir
  });
  artifacts.push(...strategicOptions.artifacts);

  // Phase 9: Generate Report
  ctx.log('info', 'Phase 9: Generating comprehensive scenario planning report');
  const scenarioReport = await ctx.task(scenarioPlanningReportTask, {
    organizationName, drivingForces, criticalUncertainties, scenarioFramework, scenarioNarratives,
    strategicImplications, strategyStressTest, signpostSystem, strategicOptions, outputDir
  });
  artifacts.push(...scenarioReport.artifacts);

  await ctx.breakpoint({
    question: `Scenario planning complete for ${organizationName}. ${scenarioNarratives.scenarios?.length || 4} scenarios developed. Review?`,
    title: 'Scenario Planning Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })) }
  });

  return {
    success: true, organizationName, timeHorizon,
    drivingForces: drivingForces.forces,
    scenarios: scenarioNarratives.scenarios,
    strategyStressTest: strategyStressTest.results,
    signpostSystem: signpostSystem.system,
    strategicOptions: strategicOptions.options,
    artifacts, duration: ctx.now() - startTime,
    metadata: { processId: 'business-strategy/scenario-planning', timestamp: startTime, outputDir }
  };
}

export const drivingForcesTask = defineTask('driving-forces', (args, taskCtx) => ({
  kind: 'agent', title: 'Identify key driving forces',
  agent: {
    name: 'forces-analyst',
    prompt: {
      role: 'scenario planning analyst',
      task: 'Identify key driving forces and uncertainties affecting the future',
      context: args,
      instructions: ['Identify social/demographic driving forces', 'Identify economic driving forces', 'Identify political/regulatory driving forces', 'Identify technological driving forces', 'Identify environmental driving forces', 'Categorize by impact and uncertainty', 'Generate driving forces analysis']
    },
    outputSchema: { type: 'object', required: ['forces', 'artifacts'], properties: { forces: { type: 'array' }, predeterminedForces: { type: 'array' }, uncertainForces: { type: 'array' }, impactUncertaintyMatrix: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'scenario-planning', 'driving-forces']
}));

export const criticalUncertaintiesTask = defineTask('critical-uncertainties', (args, taskCtx) => ({
  kind: 'agent', title: 'Select critical uncertainties',
  agent: {
    name: 'uncertainty-analyst',
    prompt: {
      role: 'uncertainty analysis specialist',
      task: 'Select critical uncertainties for scenario framework axes',
      context: args,
      instructions: ['Identify high-impact, high-uncertainty forces', 'Evaluate independence of uncertainties', 'Select two orthogonal critical uncertainties', 'Define uncertainty dimensions (poles/extremes)', 'Validate relevance to strategic questions', 'Generate critical uncertainties documentation']
    },
    outputSchema: { type: 'object', required: ['uncertainties', 'artifacts'], properties: { uncertainties: { type: 'array' }, selectedAxes: { type: 'array' }, axisDefinitions: { type: 'object' }, selectionRationale: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'scenario-planning', 'uncertainties']
}));

export const scenarioFrameworkTask = defineTask('scenario-framework', (args, taskCtx) => ({
  kind: 'agent', title: 'Develop scenario framework',
  agent: {
    name: 'framework-designer',
    prompt: {
      role: 'scenario framework specialist',
      task: 'Create 2x2 scenario framework matrix',
      context: args,
      instructions: ['Define 2x2 matrix with selected uncertainties', 'Name each scenario quadrant', 'Define scenario characteristics', 'Ensure internal consistency of each scenario', 'Create scenario framework visualization', 'Generate scenario framework documentation']
    },
    outputSchema: { type: 'object', required: ['framework', 'artifacts'], properties: { framework: { type: 'object' }, quadrants: { type: 'array' }, scenarioNames: { type: 'array' }, visualization: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'scenario-planning', 'framework']
}));

export const scenarioNarrativesTask = defineTask('scenario-narratives', (args, taskCtx) => ({
  kind: 'agent', title: 'Create detailed scenario narratives',
  agent: {
    name: 'narrative-writer',
    prompt: {
      role: 'scenario narrative specialist',
      task: 'Develop detailed narrative for each scenario',
      context: args,
      instructions: ['Create vivid, plausible narrative for each scenario', 'Describe how each scenario unfolds over time', 'Include key events and turning points', 'Describe end-state conditions', 'Ensure internal consistency', 'Generate scenario narrative documents']
    },
    outputSchema: { type: 'object', required: ['scenarios', 'artifacts'], properties: { scenarios: { type: 'array' }, narratives: { type: 'object' }, timelineEvents: { type: 'object' }, endStateDescriptions: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'scenario-planning', 'narratives']
}));

export const scenarioImplicationsTask = defineTask('scenario-implications', (args, taskCtx) => ({
  kind: 'agent', title: 'Analyze strategic implications',
  agent: {
    name: 'implications-analyst',
    prompt: {
      role: 'strategic implications analyst',
      task: 'Analyze strategic implications for each scenario',
      context: args,
      instructions: ['Identify opportunities in each scenario', 'Identify threats in each scenario', 'Analyze market implications', 'Assess competitive dynamics changes', 'Identify capability requirements', 'Generate implications analysis for each scenario']
    },
    outputSchema: { type: 'object', required: ['implications', 'artifacts'], properties: { implications: { type: 'object' }, opportunities: { type: 'object' }, threats: { type: 'object' }, capabilityNeeds: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'scenario-planning', 'implications']
}));

export const strategyStressTestTask = defineTask('strategy-stress-test', (args, taskCtx) => ({
  kind: 'agent', title: 'Stress test current strategy',
  agent: {
    name: 'stress-tester',
    prompt: {
      role: 'strategy testing specialist',
      task: 'Test current strategy against each scenario',
      context: args,
      instructions: ['Evaluate strategy performance in each scenario', 'Identify vulnerabilities by scenario', 'Assess robustness across scenarios', 'Identify scenario-specific risks', 'Rate strategy viability per scenario', 'Generate strategy stress test results']
    },
    outputSchema: { type: 'object', required: ['results', 'artifacts'], properties: { results: { type: 'object' }, vulnerabilities: { type: 'object' }, robustnessScore: { type: 'number' }, risksByScenario: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'scenario-planning', 'stress-test']
}));

export const signpostDevelopmentTask = defineTask('signpost-development', (args, taskCtx) => ({
  kind: 'agent', title: 'Identify signposts and early warning indicators',
  agent: {
    name: 'signpost-developer',
    prompt: {
      role: 'early warning system specialist',
      task: 'Develop signposts and triggers for scenario monitoring',
      context: args,
      instructions: ['Identify leading indicators for each scenario', 'Define signposts that signal scenario direction', 'Establish trigger thresholds', 'Create monitoring framework', 'Define response actions for signposts', 'Generate signpost monitoring system']
    },
    outputSchema: { type: 'object', required: ['system', 'artifacts'], properties: { system: { type: 'object' }, signposts: { type: 'array' }, triggers: { type: 'array' }, monitoringFramework: { type: 'object' }, responseActions: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'scenario-planning', 'signposts']
}));

export const scenarioStrategicOptionsTask = defineTask('scenario-strategic-options', (args, taskCtx) => ({
  kind: 'agent', title: 'Develop strategic options for scenarios',
  agent: {
    name: 'options-developer',
    prompt: {
      role: 'strategic options specialist',
      task: 'Develop strategic options for scenario adaptation',
      context: args,
      instructions: ['Identify robust strategies (work across scenarios)', 'Develop scenario-specific strategies', 'Create hedging strategies', 'Define strategic flexibility options', 'Prioritize options by robustness and value', 'Generate strategic options documentation']
    },
    outputSchema: { type: 'object', required: ['options', 'artifacts'], properties: { options: { type: 'array' }, robustStrategies: { type: 'array' }, scenarioSpecific: { type: 'object' }, hedgingStrategies: { type: 'array' }, flexibilityOptions: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'scenario-planning', 'options']
}));

export const scenarioPlanningReportTask = defineTask('scenario-planning-report', (args, taskCtx) => ({
  kind: 'agent', title: 'Generate scenario planning report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'scenario planning report author',
      task: 'Generate comprehensive scenario planning report',
      context: args,
      instructions: ['Create executive summary', 'Document driving forces analysis', 'Present scenario framework', 'Include detailed scenario narratives', 'Present strategy stress test results', 'Document signpost monitoring system', 'Include strategic options', 'Format as professional report']
    },
    outputSchema: { type: 'object', required: ['reportPath', 'artifacts'], properties: { reportPath: { type: 'string' }, executiveSummary: { type: 'string' }, keyFindings: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'scenario-planning', 'reporting']
}));
