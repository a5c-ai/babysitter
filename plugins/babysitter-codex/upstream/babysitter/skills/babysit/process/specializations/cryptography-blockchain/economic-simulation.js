/**
 * @process specializations/cryptography-blockchain/economic-simulation
 * @description Economic Simulation - Agent-based economic simulations for DeFi protocols to analyze tokenomics,
 * market dynamics, and systemic risks.
 * @inputs { projectName: string, protocol: string, simulationType?: string, duration?: number }
 * @outputs { success: boolean, simulationResults: object, riskAnalysis: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cryptography-blockchain/economic-simulation', {
 *   projectName: 'AMM Economic Model',
 *   protocol: 'uniswap-v3',
 *   simulationType: 'agent-based',
 *   duration: 365
 * });
 *
 * @references
 * - cadCAD: https://cadcad.org/
 * - Gauntlet: https://gauntlet.network/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    protocol,
    simulationType = 'agent-based',
    duration = 365,
    agents = ['arbitrageur', 'liquidity-provider', 'retail-trader'],
    scenarios = ['bull', 'bear', 'high-volatility'],
    outputDir = 'simulation-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Economic Simulation: ${projectName}`);

  const modelDesign = await ctx.task(modelDesignTask, { projectName, protocol, simulationType, outputDir });
  artifacts.push(...modelDesign.artifacts);

  const agentBehaviors = await ctx.task(agentBehaviorsTask, { projectName, agents, outputDir });
  artifacts.push(...agentBehaviors.artifacts);

  const marketMechanics = await ctx.task(marketMechanicsTask, { projectName, protocol, outputDir });
  artifacts.push(...marketMechanics.artifacts);

  const scenarioDefinition = await ctx.task(scenarioDefinitionTask, { projectName, scenarios, duration, outputDir });
  artifacts.push(...scenarioDefinition.artifacts);

  const simulationExecution = await ctx.task(simulationExecutionTask, { projectName, scenarios, duration, outputDir });
  artifacts.push(...simulationExecution.artifacts);

  const riskAnalysis = await ctx.task(riskAnalysisTask, { projectName, outputDir });
  artifacts.push(...riskAnalysis.artifacts);

  const parameterOptimization = await ctx.task(parameterOptimizationTask, { projectName, outputDir });
  artifacts.push(...parameterOptimization.artifacts);

  const reportGeneration = await ctx.task(reportGenerationTask, { projectName, outputDir });
  artifacts.push(...reportGeneration.artifacts);

  const endTime = ctx.now();

  return {
    success: true,
    projectName,
    simulationResults: { type: simulationType, duration, scenarios, agents },
    riskAnalysis: riskAnalysis.analysis,
    recommendations: parameterOptimization.recommendations,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'specializations/cryptography-blockchain/economic-simulation', timestamp: startTime }
  };
}

export const modelDesignTask = defineTask('model-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Model Design - ${args.projectName}`,
  agent: {
    name: 'model-architect',
    prompt: {
      role: 'Economic Model Architect',
      task: 'Design economic simulation model',
      context: args,
      instructions: ['1. Define state variables', '2. Design state update functions', '3. Define policies', '4. Design mechanisms', '5. Plan agent interactions', '6. Define metrics', '7. Plan data collection', '8. Design feedback loops', '9. Document model', '10. Create model diagram'],
      outputFormat: 'JSON with model design'
    },
    outputSchema: { type: 'object', required: ['model', 'stateVariables', 'artifacts'], properties: { model: { type: 'object' }, stateVariables: { type: 'array' }, mechanisms: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['simulation', 'model']
}));

export const agentBehaviorsTask = defineTask('agent-behaviors', (args, taskCtx) => ({
  kind: 'agent',
  title: `Agent Behaviors - ${args.projectName}`,
  agent: {
    name: 'behavior-engineer',
    prompt: {
      role: 'Agent Behavior Engineer',
      task: 'Implement agent behaviors',
      context: args,
      instructions: ['1. Define agent types', '2. Implement decision logic', '3. Add utility functions', '4. Implement strategies', '5. Add risk preferences', '6. Implement constraints', '7. Add learning behaviors', '8. Implement reactions', '9. Test behaviors', '10. Document agents'],
      outputFormat: 'JSON with agent behaviors'
    },
    outputSchema: { type: 'object', required: ['agents', 'strategies', 'artifacts'], properties: { agents: { type: 'array' }, strategies: { type: 'object' }, utilityFunctions: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['simulation', 'agents']
}));

export const marketMechanicsTask = defineTask('market-mechanics', (args, taskCtx) => ({
  kind: 'agent',
  title: `Market Mechanics - ${args.projectName}`,
  agent: {
    name: 'market-engineer',
    prompt: {
      role: 'Market Mechanics Engineer',
      task: 'Implement market mechanics',
      context: args,
      instructions: ['1. Implement price discovery', '2. Add order matching', '3. Implement slippage', '4. Add fee mechanics', '5. Implement liquidity dynamics', '6. Add arbitrage mechanics', '7. Implement oracles', '8. Add liquidations', '9. Test mechanics', '10. Document mechanics'],
      outputFormat: 'JSON with market mechanics'
    },
    outputSchema: { type: 'object', required: ['mechanics', 'pricingModel', 'artifacts'], properties: { mechanics: { type: 'array' }, pricingModel: { type: 'object' }, liquidityModel: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['simulation', 'market']
}));

export const scenarioDefinitionTask = defineTask('scenario-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Scenario Definition - ${args.projectName}`,
  agent: {
    name: 'scenario-engineer',
    prompt: {
      role: 'Scenario Definition Engineer',
      task: 'Define simulation scenarios',
      context: args,
      instructions: ['1. Define base scenario', '2. Create bull market', '3. Create bear market', '4. Add high volatility', '5. Add black swan events', '6. Create attack scenarios', '7. Define parameter sweeps', '8. Add stress tests', '9. Validate scenarios', '10. Document scenarios'],
      outputFormat: 'JSON with scenario definition'
    },
    outputSchema: { type: 'object', required: ['scenarios', 'parameters', 'artifacts'], properties: { scenarios: { type: 'array' }, parameters: { type: 'object' }, stressTests: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['simulation', 'scenarios']
}));

export const simulationExecutionTask = defineTask('simulation-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Simulation Execution - ${args.projectName}`,
  agent: {
    name: 'simulation-operator',
    prompt: {
      role: 'Simulation Execution Operator',
      task: 'Execute simulations',
      context: args,
      instructions: ['1. Configure simulation', '2. Run Monte Carlo', '3. Execute scenarios', '4. Collect metrics', '5. Handle edge cases', '6. Track state evolution', '7. Save checkpoints', '8. Parallelize runs', '9. Aggregate results', '10. Export data'],
      outputFormat: 'JSON with simulation execution'
    },
    outputSchema: { type: 'object', required: ['results', 'metrics', 'artifacts'], properties: { results: { type: 'object' }, metrics: { type: 'object' }, stateHistory: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['simulation', 'execution']
}));

export const riskAnalysisTask = defineTask('risk-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Risk Analysis - ${args.projectName}`,
  agent: {
    name: 'risk-analyst',
    prompt: {
      role: 'Economic Risk Analyst',
      task: 'Analyze simulation risks',
      context: args,
      instructions: ['1. Calculate VaR', '2. Analyze tail risks', '3. Identify systemic risks', '4. Assess liquidity risks', '5. Analyze insolvency risk', '6. Calculate loss scenarios', '7. Identify correlations', '8. Assess attack vectors', '9. Create risk metrics', '10. Document risks'],
      outputFormat: 'JSON with risk analysis'
    },
    outputSchema: { type: 'object', required: ['analysis', 'risks', 'artifacts'], properties: { analysis: { type: 'object' }, risks: { type: 'array' }, varMetrics: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['simulation', 'risk']
}));

export const parameterOptimizationTask = defineTask('parameter-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Parameter Optimization - ${args.projectName}`,
  agent: {
    name: 'optimization-engineer',
    prompt: {
      role: 'Parameter Optimization Engineer',
      task: 'Optimize protocol parameters',
      context: args,
      instructions: ['1. Define objectives', '2. Run parameter sweeps', '3. Analyze sensitivity', '4. Find Pareto frontier', '5. Optimize for stability', '6. Balance tradeoffs', '7. Validate parameters', '8. Test robustness', '9. Generate recommendations', '10. Document optimization'],
      outputFormat: 'JSON with parameter optimization'
    },
    outputSchema: { type: 'object', required: ['recommendations', 'sensitivity', 'artifacts'], properties: { recommendations: { type: 'array' }, sensitivity: { type: 'object' }, paretoFrontier: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['simulation', 'optimization']
}));

export const reportGenerationTask = defineTask('report-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Report Generation - ${args.projectName}`,
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'Simulation Report Generator',
      task: 'Generate simulation report',
      context: args,
      instructions: ['1. Summarize findings', '2. Include key metrics', '3. Add visualizations', '4. Include risk analysis', '5. Add recommendations', '6. Include sensitivity', '7. Add scenario results', '8. Create executive summary', '9. Add technical appendix', '10. Export report'],
      outputFormat: 'JSON with report generation'
    },
    outputSchema: { type: 'object', required: ['report', 'summary', 'artifacts'], properties: { report: { type: 'object' }, summary: { type: 'string' }, visualizations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['simulation', 'reporting']
}));
