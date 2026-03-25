/**
 * @process domains/science/scientific-discovery/system-dynamics-modeling
 * @description Build stock-and-flow models to simulate system behavior - Guides practitioners through
 * creating quantitative system dynamics models using stocks, flows, and feedback structures.
 * @inputs { system: string, cld?: object, parameters: object, timeHorizon: string }
 * @outputs { success: boolean, model: object, simulations: array, insights: array, policy: object }
 *
 * @example
 * const result = await orchestrate('domains/science/scientific-discovery/system-dynamics-modeling', {
 *   system: 'Epidemic Spread Model',
 *   parameters: { population: 1000000, contactRate: 10, infectionProb: 0.1 },
 *   timeHorizon: '365-days'
 * });
 *
 * @references
 * - Forrester, J.W. (1961). Industrial Dynamics
 * - Sterman, J.D. (2000). Business Dynamics
 * - Meadows, D.H. (2008). Thinking in Systems
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { system, cld = {}, parameters = {}, timeHorizon, outputDir = 'sd-model-output', minimumCalibrationScore = 80 } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting System Dynamics Modeling for: ${system}`);

  const modelConceptualization = await ctx.task(modelConceptualizationTask, { system, cld, parameters, outputDir });
  artifacts.push(...modelConceptualization.artifacts);

  const stockFlowStructure = await ctx.task(stockFlowStructureTask, { conceptualization: modelConceptualization, system, outputDir });
  artifacts.push(...stockFlowStructure.artifacts);

  const equationFormulation = await ctx.task(equationFormulationTask, { stockFlowStructure, parameters, outputDir });
  artifacts.push(...equationFormulation.artifacts);

  await ctx.breakpoint({
    question: `Model structure: ${stockFlowStructure.stocks?.length || 0} stocks, ${stockFlowStructure.flows?.length || 0} flows. ${equationFormulation.equations?.length || 0} equations. Review before simulation?`,
    title: 'SD Model Structure Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })), summary: { stocks: stockFlowStructure.stocks?.length || 0, flows: stockFlowStructure.flows?.length || 0, equations: equationFormulation.equations?.length || 0 }}
  });

  const parameterEstimation = await ctx.task(parameterEstimationTask, { model: equationFormulation, parameters, outputDir });
  artifacts.push(...parameterEstimation.artifacts);

  const baselineSimulation = await ctx.task(baselineSimulationTask, { model: equationFormulation, parameters: parameterEstimation.parameters, timeHorizon, outputDir });
  artifacts.push(...baselineSimulation.artifacts);

  const modelValidation = await ctx.task(modelValidationTask, { simulation: baselineSimulation, model: equationFormulation, minimumCalibrationScore, outputDir });
  artifacts.push(...modelValidation.artifacts);

  const sensitivityAnalysis = await ctx.task(sdSensitivityAnalysisTask, { model: equationFormulation, parameters: parameterEstimation.parameters, timeHorizon, outputDir });
  artifacts.push(...sensitivityAnalysis.artifacts);

  const policyAnalysis = await ctx.task(policyAnalysisTask, { model: equationFormulation, baselineSimulation, system, outputDir });
  artifacts.push(...policyAnalysis.artifacts);

  const qualityScore = await ctx.task(sdModelQualityScoringTask, { modelConceptualization, stockFlowStructure, modelValidation, policyAnalysis, outputDir });
  artifacts.push(...qualityScore.artifacts);

  await ctx.breakpoint({
    question: `SD Model complete. Validation score: ${modelValidation.validationScore}/100. ${policyAnalysis.policies?.length || 0} policies analyzed. Quality: ${qualityScore.overallScore}/100. Approve?`,
    title: 'SD Model Approval',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })), summary: { validationScore: modelValidation.validationScore, policies: policyAnalysis.policies?.length || 0, qualityScore: qualityScore.overallScore }}
  });

  return {
    success: true, system, model: { stocks: stockFlowStructure.stocks, flows: stockFlowStructure.flows, equations: equationFormulation.equations },
    simulations: [baselineSimulation.results, ...sensitivityAnalysis.simulations], insights: policyAnalysis.insights, policy: policyAnalysis,
    qualityScore: { overall: qualityScore.overallScore }, artifacts, duration: ctx.now() - startTime,
    metadata: { processId: 'domains/science/scientific-discovery/system-dynamics-modeling', timestamp: startTime, outputDir }
  };
}

export const modelConceptualizationTask = defineTask('model-conceptualization', (args, taskCtx) => ({
  kind: 'agent', title: 'Conceptualize model',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'system-dynamics-modeler', skills: ['hypothesis-generator', 'causal-inference-engine'], prompt: { role: 'System dynamics modeler', task: 'Conceptualize the system dynamics model', context: args, instructions: ['Define model purpose and boundaries', 'Identify key dynamic hypotheses', 'List endogenous vs exogenous variables', 'Define time horizon and time step', 'Document key assumptions'], outputFormat: 'JSON with purpose, boundaries, dynamicHypotheses, variables, timeHorizon, assumptions, artifacts' }, outputSchema: { type: 'object', required: ['purpose', 'dynamicHypotheses', 'artifacts'], properties: { purpose: { type: 'string' }, boundaries: { type: 'object' }, dynamicHypotheses: { type: 'array' }, variables: { type: 'object' }, timeHorizon: { type: 'string' }, assumptions: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'system-dynamics']
}));

export const stockFlowStructureTask = defineTask('stock-flow-structure', (args, taskCtx) => ({
  kind: 'agent', title: 'Define stock-flow structure',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'system-dynamics-modeler', skills: ['hypothesis-generator', 'causal-inference-engine'], prompt: { role: 'Stock-flow modeler', task: 'Define the stock and flow structure of the model', context: args, instructions: ['Identify stocks (accumulations)', 'Identify flows (rates)', 'Define converters/auxiliaries', 'Identify constants/parameters', 'Map causal connections', 'Ensure conservation laws'], outputFormat: 'JSON with stocks, flows, auxiliaries, constants, connections, artifacts' }, outputSchema: { type: 'object', required: ['stocks', 'flows', 'artifacts'], properties: { stocks: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, initialValue: { type: 'string' }, units: { type: 'string' } } } }, flows: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, from: { type: 'string' }, to: { type: 'string' }, units: { type: 'string' } } } }, auxiliaries: { type: 'array' }, constants: { type: 'array' }, connections: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'system-dynamics']
}));

export const equationFormulationTask = defineTask('equation-formulation', (args, taskCtx) => ({
  kind: 'agent', title: 'Formulate model equations',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'system-dynamics-modeler', skills: ['hypothesis-generator', 'causal-inference-engine'], prompt: { role: 'Mathematical modeler', task: 'Formulate equations for all model elements', context: args, instructions: ['Write stock integration equations', 'Write flow rate equations', 'Write auxiliary equations', 'Ensure dimensional consistency', 'Document equation rationale', 'Handle nonlinearities'], outputFormat: 'JSON with equations, stockEquations, flowEquations, auxiliaryEquations, dimensionalAnalysis, artifacts' }, outputSchema: { type: 'object', required: ['equations', 'artifacts'], properties: { equations: { type: 'array', items: { type: 'object', properties: { variable: { type: 'string' }, equation: { type: 'string' }, units: { type: 'string' }, rationale: { type: 'string' } } } }, stockEquations: { type: 'array' }, flowEquations: { type: 'array' }, auxiliaryEquations: { type: 'array' }, dimensionalAnalysis: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'system-dynamics']
}));

export const parameterEstimationTask = defineTask('parameter-estimation', (args, taskCtx) => ({
  kind: 'agent', title: 'Estimate model parameters',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'system-dynamics-modeler', skills: ['hypothesis-generator', 'causal-inference-engine'], prompt: { role: 'Parameter estimation specialist', task: 'Estimate and document model parameters', context: args, instructions: ['Estimate parameter values', 'Document data sources', 'Specify uncertainty ranges', 'Identify sensitive parameters', 'Document estimation methods'], outputFormat: 'JSON with parameters, dataSources, uncertainties, sensitiveParameters, artifacts' }, outputSchema: { type: 'object', required: ['parameters', 'artifacts'], properties: { parameters: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, value: { type: 'number' }, units: { type: 'string' }, source: { type: 'string' }, uncertainty: { type: 'string' } } } }, dataSources: { type: 'array' }, uncertainties: { type: 'object' }, sensitiveParameters: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'system-dynamics']
}));

export const baselineSimulationTask = defineTask('baseline-simulation', (args, taskCtx) => ({
  kind: 'agent', title: 'Run baseline simulation',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'system-dynamics-modeler', skills: ['hypothesis-generator', 'causal-inference-engine'], prompt: { role: 'Simulation analyst', task: 'Run and analyze baseline model simulation', context: args, instructions: ['Run simulation with baseline parameters', 'Generate time series outputs', 'Analyze behavior modes', 'Identify equilibrium states', 'Document simulation settings'], outputFormat: 'JSON with results, timeSeries, behaviorModes, equilibrium, settings, artifacts' }, outputSchema: { type: 'object', required: ['results', 'artifacts'], properties: { results: { type: 'object' }, timeSeries: { type: 'array' }, behaviorModes: { type: 'array' }, equilibrium: { type: 'object' }, settings: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'system-dynamics']
}));

export const modelValidationTask = defineTask('model-validation', (args, taskCtx) => ({
  kind: 'agent', title: 'Validate model',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'system-dynamics-modeler', skills: ['hypothesis-generator', 'causal-inference-engine'], prompt: { role: 'Model validation specialist', task: 'Validate model structure and behavior', context: args, instructions: ['Perform structure verification', 'Perform behavior reproduction tests', 'Test extreme conditions', 'Perform integration error tests', 'Calculate validation score'], outputFormat: 'JSON with validationScore, structureTests, behaviorTests, extremeConditions, integrationTests, artifacts' }, outputSchema: { type: 'object', required: ['validationScore', 'artifacts'], properties: { validationScore: { type: 'number' }, structureTests: { type: 'array' }, behaviorTests: { type: 'array' }, extremeConditions: { type: 'array' }, integrationTests: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'system-dynamics']
}));

export const sdSensitivityAnalysisTask = defineTask('sd-sensitivity-analysis', (args, taskCtx) => ({
  kind: 'agent', title: 'Perform sensitivity analysis',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'system-dynamics-modeler', skills: ['hypothesis-generator', 'causal-inference-engine'], prompt: { role: 'Sensitivity analysis specialist', task: 'Analyze model sensitivity to parameters', context: args, instructions: ['Identify parameters to test', 'Perform one-at-a-time sensitivity', 'Perform multivariate analysis', 'Identify most sensitive parameters', 'Document sensitivity findings'], outputFormat: 'JSON with simulations, sensitivityResults, criticalParameters, findings, artifacts' }, outputSchema: { type: 'object', required: ['simulations', 'sensitivityResults', 'artifacts'], properties: { simulations: { type: 'array' }, sensitivityResults: { type: 'array' }, criticalParameters: { type: 'array' }, findings: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'system-dynamics']
}));

export const policyAnalysisTask = defineTask('policy-analysis', (args, taskCtx) => ({
  kind: 'agent', title: 'Analyze policy interventions',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'system-dynamics-modeler', skills: ['hypothesis-generator', 'causal-inference-engine'], prompt: { role: 'Policy analyst', task: 'Analyze potential policy interventions', context: args, instructions: ['Define policy scenarios', 'Simulate each policy', 'Compare policy outcomes', 'Identify unintended consequences', 'Rank policies by effectiveness', 'Generate insights'], outputFormat: 'JSON with policies, scenarios, comparisons, unintendedConsequences, rankings, insights, artifacts' }, outputSchema: { type: 'object', required: ['policies', 'insights', 'artifacts'], properties: { policies: { type: 'array' }, scenarios: { type: 'array' }, comparisons: { type: 'object' }, unintendedConsequences: { type: 'array' }, rankings: { type: 'array' }, insights: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'system-dynamics']
}));

export const sdModelQualityScoringTask = defineTask('sd-model-quality-scoring', (args, taskCtx) => ({
  kind: 'agent', title: 'Score SD model quality',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'system-dynamics-modeler', skills: ['hypothesis-generator', 'causal-inference-engine'], prompt: { role: 'SD model quality auditor', task: 'Score the quality of the system dynamics model', context: args, instructions: ['Score conceptualization', 'Score structure validity', 'Score behavior validity', 'Score policy insights', 'Calculate overall score'], outputFormat: 'JSON with overallScore, conceptualizationScore, structureScore, behaviorScore, policyScore, artifacts' }, outputSchema: { type: 'object', required: ['overallScore', 'artifacts'], properties: { overallScore: { type: 'number' }, conceptualizationScore: { type: 'number' }, structureScore: { type: 'number' }, behaviorScore: { type: 'number' }, policyScore: { type: 'number' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'system-dynamics']
}));
