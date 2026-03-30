/**
 * @process domains/science/scientific-discovery/probabilistic-forecasting-calibration
 * @description Generate well-calibrated probability estimates - Guides forecasters through
 * rigorous probabilistic forecasting with calibration training, proper scoring, and aggregation.
 * @inputs { question: string, timeHorizon: string, baseRates?: object, informationSources?: array }
 * @outputs { success: boolean, forecast: object, calibration: object, scoringPlan: object, documentation: object }
 *
 * @example
 * const result = await orchestrate('domains/science/scientific-discovery/probabilistic-forecasting-calibration', {
 *   question: 'Will Company X achieve $1B revenue by 2025?',
 *   timeHorizon: '2 years',
 *   baseRates: { industryGrowth: 0.15, successRate: 0.30 },
 *   informationSources: ['financial reports', 'industry analysis', 'expert interviews']
 * });
 *
 * @references
 * - Tetlock, P.E. & Gardner, D. (2015). Superforecasting: The Art and Science of Prediction
 * - Gneiting, T. & Raftery, A.E. (2007). Strictly Proper Scoring Rules, Prediction, and Estimation
 * - Morgan, M.G. & Henrion, M. (1990). Uncertainty: A Guide to Dealing with Uncertainty
 * - Mellers, B. et al. (2014). Psychological Strategies for Winning a Geopolitical Forecasting Tournament
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { question, timeHorizon, baseRates = {}, informationSources = [], outputDir = 'forecast-output', minimumCalibrationScore = 70 } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Probabilistic Forecasting for: ${question}`);

  const questionClarification = await ctx.task(questionClarificationTask, { question, timeHorizon, outputDir });
  artifacts.push(...questionClarification.artifacts);

  const baseRateAnalysis = await ctx.task(baseRateAnalysisTask, { question: questionClarification.clarifiedQuestion, baseRates, outputDir });
  artifacts.push(...baseRateAnalysis.artifacts);

  const informationGathering = await ctx.task(informationGatheringTask, { question: questionClarification.clarifiedQuestion, informationSources, baseRateAnalysis, outputDir });
  artifacts.push(...informationGathering.artifacts);

  await ctx.breakpoint({
    question: `Base rate: ${baseRateAnalysis.baseRate || 'N/A'}. ${informationGathering.evidenceItems?.length || 0} evidence items gathered. Review before forecast generation?`,
    title: 'Forecast Inputs Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })), summary: { baseRate: baseRateAnalysis.baseRate || 'N/A', evidenceItems: informationGathering.evidenceItems?.length || 0 }}
  });

  const insideViewForecast = await ctx.task(insideViewTask, { question: questionClarification.clarifiedQuestion, information: informationGathering, outputDir });
  artifacts.push(...insideViewForecast.artifacts);

  const outsideViewForecast = await ctx.task(outsideViewTask, { question: questionClarification.clarifiedQuestion, baseRateAnalysis, outputDir });
  artifacts.push(...outsideViewForecast.artifacts);

  const forecastSynthesis = await ctx.task(forecastSynthesisTask, { insideView: insideViewForecast, outsideView: outsideViewForecast, outputDir });
  artifacts.push(...forecastSynthesis.artifacts);

  const uncertaintyQuantification = await ctx.task(uncertaintyQuantificationTask, { forecast: forecastSynthesis, information: informationGathering, outputDir });
  artifacts.push(...uncertaintyQuantification.artifacts);

  const calibrationCheck = await ctx.task(calibrationCheckTask, { forecast: forecastSynthesis, uncertainty: uncertaintyQuantification, outputDir });
  artifacts.push(...calibrationCheck.artifacts);

  const debiasing = await ctx.task(debiasingTask, { forecast: forecastSynthesis, calibrationCheck, question: questionClarification.clarifiedQuestion, outputDir });
  artifacts.push(...debiasing.artifacts);

  const scoringPlan = await ctx.task(scoringPlanTask, { forecast: debiasing.adjustedForecast || forecastSynthesis, question: questionClarification.clarifiedQuestion, timeHorizon, outputDir });
  artifacts.push(...scoringPlan.artifacts);

  const qualityScore = await ctx.task(forecastQualityScoringTask, { questionClarification, baseRateAnalysis, forecastSynthesis, calibrationCheck, debiasing, minimumCalibrationScore, outputDir });
  artifacts.push(...qualityScore.artifacts);

  await ctx.breakpoint({
    question: `Forecast: ${debiasing.adjustedForecast?.probability || forecastSynthesis.probability || 'N/A'}. Calibration: ${calibrationCheck.calibrationScore || 'N/A'}. Quality: ${qualityScore.overallScore}/100. Approve?`,
    title: 'Probabilistic Forecast Approval',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })), summary: { forecast: debiasing.adjustedForecast?.probability || forecastSynthesis.probability || 'N/A', calibrationScore: calibrationCheck.calibrationScore || 'N/A', qualityScore: qualityScore.overallScore }}
  });

  return {
    success: true, question: questionClarification.clarifiedQuestion, forecast: { probability: debiasing.adjustedForecast?.probability || forecastSynthesis.probability, confidenceInterval: uncertaintyQuantification.confidenceInterval, rationale: forecastSynthesis.rationale },
    calibration: calibrationCheck, scoringPlan: scoringPlan,
    documentation: { baseRate: baseRateAnalysis, insideView: insideViewForecast, outsideView: outsideViewForecast, debiasing: debiasing },
    qualityScore: { overall: qualityScore.overallScore }, artifacts, duration: ctx.now() - startTime,
    metadata: { processId: 'domains/science/scientific-discovery/probabilistic-forecasting-calibration', timestamp: startTime, outputDir }
  };
}

export const questionClarificationTask = defineTask('question-clarification', (args, taskCtx) => ({
  kind: 'agent', title: 'Clarify forecast question',
  skill: { name: 'bayesian-inference-engine' },
  agent: { name: 'probabilistic-forecaster', skills: ['bayesian-inference-engine', 'statistical-test-selector'], prompt: { role: 'Forecast question analyst', task: 'Clarify and operationalize the forecast question', context: args, instructions: ['Identify ambiguous terms', 'Specify resolution criteria', 'Define time horizon precisely', 'Clarify measurement method', 'Identify edge cases', 'Create unambiguous question'], outputFormat: 'JSON with clarifiedQuestion, ambiguities, resolutionCriteria, timeHorizon, measurement, edgeCases, artifacts' }, outputSchema: { type: 'object', required: ['clarifiedQuestion', 'resolutionCriteria', 'artifacts'], properties: { clarifiedQuestion: { type: 'string' }, ambiguities: { type: 'array' }, resolutionCriteria: { type: 'object' }, timeHorizon: { type: 'string' }, measurement: { type: 'object' }, edgeCases: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'forecasting']
}));

export const baseRateAnalysisTask = defineTask('base-rate-analysis', (args, taskCtx) => ({
  kind: 'agent', title: 'Analyze base rates',
  skill: { name: 'bayesian-inference-engine' },
  agent: { name: 'probabilistic-forecaster', skills: ['bayesian-inference-engine', 'statistical-test-selector'], prompt: { role: 'Base rate analyst', task: 'Identify and analyze relevant base rates', context: args, instructions: ['Identify reference class', 'Find historical base rates', 'Adjust for differences from reference class', 'Consider multiple reference classes', 'Calculate weighted base rate', 'Document uncertainty in base rate'], outputFormat: 'JSON with referenceClass, historicalBaseRates, adjustments, alternativeClasses, baseRate, uncertainty, artifacts' }, outputSchema: { type: 'object', required: ['referenceClass', 'baseRate', 'artifacts'], properties: { referenceClass: { type: 'string' }, historicalBaseRates: { type: 'array' }, adjustments: { type: 'array' }, alternativeClasses: { type: 'array' }, baseRate: { type: 'number' }, uncertainty: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'forecasting']
}));

export const informationGatheringTask = defineTask('information-gathering', (args, taskCtx) => ({
  kind: 'agent', title: 'Gather forecast information',
  skill: { name: 'bayesian-inference-engine' },
  agent: { name: 'probabilistic-forecaster', skills: ['bayesian-inference-engine', 'statistical-test-selector'], prompt: { role: 'Information gathering specialist', task: 'Systematically gather relevant information', context: args, instructions: ['Review provided information sources', 'Identify additional sources', 'Extract relevant evidence', 'Assess source reliability', 'Identify information gaps', 'Document evidence quality'], outputFormat: 'JSON with evidenceItems, sources, reliability, informationGaps, qualityAssessment, artifacts' }, outputSchema: { type: 'object', required: ['evidenceItems', 'sources', 'artifacts'], properties: { evidenceItems: { type: 'array', items: { type: 'object', properties: { evidence: { type: 'string' }, source: { type: 'string' }, reliability: { type: 'string' }, relevance: { type: 'string' } } } }, sources: { type: 'array' }, reliability: { type: 'object' }, informationGaps: { type: 'array' }, qualityAssessment: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'forecasting']
}));

export const insideViewTask = defineTask('inside-view', (args, taskCtx) => ({
  kind: 'agent', title: 'Generate inside view forecast',
  skill: { name: 'bayesian-inference-engine' },
  agent: { name: 'probabilistic-forecaster', skills: ['bayesian-inference-engine', 'statistical-test-selector'], prompt: { role: 'Inside view analyst', task: 'Generate forecast based on specific case details', context: args, instructions: ['Analyze specific circumstances', 'Build causal model for this case', 'Identify key drivers', 'Assess likelihood based on specifics', 'Document reasoning chain', 'Estimate probability from inside view'], outputFormat: 'JSON with insideViewProbability, causalModel, keyDrivers, reasoningChain, uncertainty, artifacts' }, outputSchema: { type: 'object', required: ['insideViewProbability', 'keyDrivers', 'artifacts'], properties: { insideViewProbability: { type: 'number' }, causalModel: { type: 'object' }, keyDrivers: { type: 'array' }, reasoningChain: { type: 'array' }, uncertainty: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'forecasting']
}));

export const outsideViewTask = defineTask('outside-view', (args, taskCtx) => ({
  kind: 'agent', title: 'Generate outside view forecast',
  skill: { name: 'bayesian-inference-engine' },
  agent: { name: 'probabilistic-forecaster', skills: ['bayesian-inference-engine', 'statistical-test-selector'], prompt: { role: 'Outside view analyst', task: 'Generate forecast based on reference class', context: args, instructions: ['Start with base rate', 'Adjust only for strong evidence', 'Resist excessive adjustment', 'Consider regression to mean', 'Document adjustment rationale', 'Estimate probability from outside view'], outputFormat: 'JSON with outsideViewProbability, baseRateUsed, adjustments, regressionConsiderations, rationale, artifacts' }, outputSchema: { type: 'object', required: ['outsideViewProbability', 'baseRateUsed', 'artifacts'], properties: { outsideViewProbability: { type: 'number' }, baseRateUsed: { type: 'number' }, adjustments: { type: 'array' }, regressionConsiderations: { type: 'object' }, rationale: { type: 'string' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'forecasting']
}));

export const forecastSynthesisTask = defineTask('forecast-synthesis', (args, taskCtx) => ({
  kind: 'agent', title: 'Synthesize forecast',
  skill: { name: 'bayesian-inference-engine' },
  agent: { name: 'probabilistic-forecaster', skills: ['bayesian-inference-engine', 'statistical-test-selector'], prompt: { role: 'Forecast synthesis specialist', task: 'Synthesize inside and outside views into final forecast', context: args, instructions: ['Weight inside and outside views', 'Consider relative information quality', 'Apply appropriate synthesis method', 'Generate point estimate', 'Document synthesis rationale', 'State final probability'], outputFormat: 'JSON with probability, insideViewWeight, outsideViewWeight, synthesisMethod, rationale, artifacts' }, outputSchema: { type: 'object', required: ['probability', 'rationale', 'artifacts'], properties: { probability: { type: 'number' }, insideViewWeight: { type: 'number' }, outsideViewWeight: { type: 'number' }, synthesisMethod: { type: 'string' }, rationale: { type: 'string' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'forecasting']
}));

export const uncertaintyQuantificationTask = defineTask('uncertainty-quantification', (args, taskCtx) => ({
  kind: 'agent', title: 'Quantify uncertainty',
  skill: { name: 'bayesian-inference-engine' },
  agent: { name: 'probabilistic-forecaster', skills: ['bayesian-inference-engine', 'statistical-test-selector'], prompt: { role: 'Uncertainty quantification specialist', task: 'Quantify forecast uncertainty', context: args, instructions: ['Identify sources of uncertainty', 'Estimate confidence interval', 'Consider model uncertainty', 'Consider parameter uncertainty', 'Assess overall confidence', 'Document uncertainty sources'], outputFormat: 'JSON with confidenceInterval, uncertaintySources, modelUncertainty, parameterUncertainty, overallConfidence, artifacts' }, outputSchema: { type: 'object', required: ['confidenceInterval', 'overallConfidence', 'artifacts'], properties: { confidenceInterval: { type: 'object', properties: { lower: { type: 'number' }, upper: { type: 'number' }, level: { type: 'number' } } }, uncertaintySources: { type: 'array' }, modelUncertainty: { type: 'object' }, parameterUncertainty: { type: 'object' }, overallConfidence: { type: 'string' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'forecasting']
}));

export const calibrationCheckTask = defineTask('calibration-check', (args, taskCtx) => ({
  kind: 'agent', title: 'Check forecast calibration',
  skill: { name: 'bayesian-inference-engine' },
  agent: { name: 'probabilistic-forecaster', skills: ['bayesian-inference-engine', 'statistical-test-selector'], prompt: { role: 'Calibration specialist', task: 'Assess forecast calibration', context: args, instructions: ['Review calibration principles', 'Check for common calibration errors', 'Assess probability extremeness', 'Check for overconfidence', 'Check for underconfidence', 'Score calibration quality'], outputFormat: 'JSON with calibrationScore, commonErrors, extremenessCheck, overconfidenceCheck, underconfidenceCheck, recommendations, artifacts' }, outputSchema: { type: 'object', required: ['calibrationScore', 'recommendations', 'artifacts'], properties: { calibrationScore: { type: 'number' }, commonErrors: { type: 'array' }, extremenessCheck: { type: 'object' }, overconfidenceCheck: { type: 'object' }, underconfidenceCheck: { type: 'object' }, recommendations: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'forecasting']
}));

export const debiasingTask = defineTask('debiasing', (args, taskCtx) => ({
  kind: 'agent', title: 'Apply debiasing techniques',
  skill: { name: 'bayesian-inference-engine' },
  agent: { name: 'probabilistic-forecaster', skills: ['bayesian-inference-engine', 'statistical-test-selector'], prompt: { role: 'Debiasing specialist', task: 'Apply debiasing techniques to forecast', context: args, instructions: ['Check for anchoring bias', 'Check for confirmation bias', 'Check for availability bias', 'Check for motivated reasoning', 'Apply premortem perspective', 'Generate adjusted forecast if needed'], outputFormat: 'JSON with biasesIdentified, anchoringCheck, confirmationCheck, availabilityCheck, motivatedReasoningCheck, premortem, adjustedForecast, artifacts' }, outputSchema: { type: 'object', required: ['biasesIdentified', 'adjustedForecast', 'artifacts'], properties: { biasesIdentified: { type: 'array' }, anchoringCheck: { type: 'object' }, confirmationCheck: { type: 'object' }, availabilityCheck: { type: 'object' }, motivatedReasoningCheck: { type: 'object' }, premortem: { type: 'object' }, adjustedForecast: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'forecasting']
}));

export const scoringPlanTask = defineTask('scoring-plan', (args, taskCtx) => ({
  kind: 'agent', title: 'Create scoring plan',
  skill: { name: 'bayesian-inference-engine' },
  agent: { name: 'probabilistic-forecaster', skills: ['bayesian-inference-engine', 'statistical-test-selector'], prompt: { role: 'Scoring plan specialist', task: 'Create plan for scoring forecast accuracy', context: args, instructions: ['Define resolution date', 'Specify Brier score calculation', 'Setup calibration tracking', 'Create update triggers', 'Define forecast revision process', 'Document scoring methodology'], outputFormat: 'JSON with resolutionDate, brierScoreMethod, calibrationTracking, updateTriggers, revisionProcess, methodology, artifacts' }, outputSchema: { type: 'object', required: ['resolutionDate', 'brierScoreMethod', 'artifacts'], properties: { resolutionDate: { type: 'string' }, brierScoreMethod: { type: 'object' }, calibrationTracking: { type: 'object' }, updateTriggers: { type: 'array' }, revisionProcess: { type: 'object' }, methodology: { type: 'string' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'forecasting']
}));

export const forecastQualityScoringTask = defineTask('forecast-quality-scoring', (args, taskCtx) => ({
  kind: 'agent', title: 'Score forecast quality',
  skill: { name: 'bayesian-inference-engine' },
  agent: { name: 'probabilistic-forecaster', skills: ['bayesian-inference-engine', 'statistical-test-selector'], prompt: { role: 'Forecast quality auditor', task: 'Score the quality of the probabilistic forecast', context: args, instructions: ['Score question clarification', 'Score base rate usage', 'Score information gathering', 'Score synthesis quality', 'Score calibration effort', 'Calculate overall score'], outputFormat: 'JSON with overallScore, questionScore, baseRateScore, informationScore, synthesisScore, calibrationScore, artifacts' }, outputSchema: { type: 'object', required: ['overallScore', 'artifacts'], properties: { overallScore: { type: 'number' }, questionScore: { type: 'number' }, baseRateScore: { type: 'number' }, informationScore: { type: 'number' }, synthesisScore: { type: 'number' }, calibrationScore: { type: 'number' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'forecasting']
}));
