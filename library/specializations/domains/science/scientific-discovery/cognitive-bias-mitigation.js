/**
 * @process domains/science/scientific-discovery/cognitive-bias-mitigation
 * @description Apply structured techniques to counteract cognitive biases - Guides analysts through
 * systematic identification and mitigation of cognitive biases that can distort judgment and analysis.
 * @inputs { analysis: object, decisionContext: string, stakes: string }
 * @outputs { success: boolean, biasesIdentified: array, mitigations: array, improvedAnalysis: object, recommendations: array }
 *
 * @example
 * const result = await orchestrate('domains/science/scientific-discovery/cognitive-bias-mitigation', {
 *   analysis: { conclusion: 'Project will succeed', evidence: ['Strong team', 'Market demand'] },
 *   decisionContext: 'Major investment decision',
 *   stakes: 'high'
 * });
 *
 * @references
 * - Kahneman, D. (2011). Thinking, Fast and Slow
 * - Heuer, R.J. (1999). Psychology of Intelligence Analysis
 * - Fischhoff, B. (1982). Debiasing
 * - Larrick, R.P. (2004). Debiasing
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { analysis, decisionContext, stakes = 'medium', outputDir = 'bias-output', minimumMitigationCoverage = 80 } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Cognitive Bias Mitigation for: ${decisionContext}`);

  const contextAssessment = await ctx.task(contextAssessmentTask, { analysis, decisionContext, stakes, outputDir });
  artifacts.push(...contextAssessment.artifacts);

  const biasScreening = await ctx.task(biasScreeningTask, { analysis, contextAssessment, outputDir });
  artifacts.push(...biasScreening.artifacts);

  const motivatedReasoningCheck = await ctx.task(motivatedReasoningTask, { analysis, decisionContext, biasScreening, outputDir });
  artifacts.push(...motivatedReasoningCheck.artifacts);

  await ctx.breakpoint({
    question: `Bias screening complete. ${biasScreening.potentialBiases?.length || 0} potential biases identified. Risk level: ${biasScreening.riskLevel || 'N/A'}. Review before mitigation?`,
    title: 'Bias Screening Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })), summary: { potentialBiases: biasScreening.potentialBiases?.length || 0, riskLevel: biasScreening.riskLevel || 'N/A' }}
  });

  const anchoringMitigation = await ctx.task(anchoringMitigationTask, { analysis, biasScreening, outputDir });
  artifacts.push(...anchoringMitigation.artifacts);

  const confirmationMitigation = await ctx.task(confirmationMitigationTask, { analysis, biasScreening, outputDir });
  artifacts.push(...confirmationMitigation.artifacts);

  const availabilityMitigation = await ctx.task(availabilityMitigationTask, { analysis, biasScreening, outputDir });
  artifacts.push(...availabilityMitigation.artifacts);

  const overconfidenceMitigation = await ctx.task(overconfidenceMitigationTask, { analysis, biasScreening, outputDir });
  artifacts.push(...overconfidenceMitigation.artifacts);

  const groupthinkMitigation = await ctx.task(groupthinkMitigationTask, { analysis, decisionContext, biasScreening, outputDir });
  artifacts.push(...groupthinkMitigation.artifacts);

  const analysisSynthesis = await ctx.task(debiasedAnalysisSynthesisTask, { analysis, mitigations: { anchoring: anchoringMitigation, confirmation: confirmationMitigation, availability: availabilityMitigation, overconfidence: overconfidenceMitigation, groupthink: groupthinkMitigation }, outputDir });
  artifacts.push(...analysisSynthesis.artifacts);

  const recommendationGeneration = await ctx.task(biasRecommendationsTask, { biasScreening, mitigations: analysisSynthesis.appliedMitigations, decisionContext, outputDir });
  artifacts.push(...recommendationGeneration.artifacts);

  const qualityScore = await ctx.task(biasQualityScoringTask, { biasScreening, anchoringMitigation, confirmationMitigation, overconfidenceMitigation, analysisSynthesis, minimumMitigationCoverage, outputDir });
  artifacts.push(...qualityScore.artifacts);

  await ctx.breakpoint({
    question: `Bias mitigation complete. ${analysisSynthesis.appliedMitigations?.length || 0} mitigations applied. Quality: ${qualityScore.overallScore}/100. Approve debiased analysis?`,
    title: 'Bias Mitigation Approval',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })), summary: { mitigationsApplied: analysisSynthesis.appliedMitigations?.length || 0, qualityScore: qualityScore.overallScore }}
  });

  return {
    success: true, decisionContext, biasesIdentified: biasScreening.potentialBiases,
    mitigations: analysisSynthesis.appliedMitigations, improvedAnalysis: analysisSynthesis.improvedAnalysis,
    recommendations: recommendationGeneration.recommendations, qualityScore: { overall: qualityScore.overallScore },
    artifacts, duration: ctx.now() - startTime,
    metadata: { processId: 'domains/science/scientific-discovery/cognitive-bias-mitigation', timestamp: startTime, outputDir }
  };
}

export const contextAssessmentTask = defineTask('context-assessment', (args, taskCtx) => ({
  kind: 'agent', title: 'Assess decision context',
  agent: { name: 'bias-analyst', skills: ['hypothesis-generator', 'bayesian-inference-engine', 'formal-logic-reasoner'], prompt: { role: 'Decision context analyst', task: 'Assess the context and conditions that may promote bias', context: args, instructions: ['Identify decision type', 'Assess time pressure', 'Evaluate information quality', 'Identify stakeholder interests', 'Assess emotional factors', 'Document bias-promoting conditions'], outputFormat: 'JSON with decisionType, timePressure, informationQuality, stakeholderInterests, emotionalFactors, biasConditions, artifacts' }, outputSchema: { type: 'object', required: ['decisionType', 'biasConditions', 'artifacts'], properties: { decisionType: { type: 'string' }, timePressure: { type: 'string' }, informationQuality: { type: 'object' }, stakeholderInterests: { type: 'array' }, emotionalFactors: { type: 'array' }, biasConditions: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'bias-mitigation']
}));

export const biasScreeningTask = defineTask('bias-screening', (args, taskCtx) => ({
  kind: 'agent', title: 'Screen for cognitive biases',
  agent: { name: 'bias-analyst', skills: ['hypothesis-generator', 'bayesian-inference-engine', 'formal-logic-reasoner'], prompt: { role: 'Cognitive bias analyst', task: 'Screen analysis for potential cognitive biases', context: args, instructions: ['Check for anchoring bias', 'Check for confirmation bias', 'Check for availability heuristic', 'Check for overconfidence', 'Check for hindsight bias', 'Check for attribution errors', 'Check for framing effects', 'Rate overall bias risk'], outputFormat: 'JSON with potentialBiases, anchoringIndicators, confirmationIndicators, availabilityIndicators, overconfidenceIndicators, otherIndicators, riskLevel, artifacts' }, outputSchema: { type: 'object', required: ['potentialBiases', 'riskLevel', 'artifacts'], properties: { potentialBiases: { type: 'array', items: { type: 'object', properties: { bias: { type: 'string' }, evidence: { type: 'string' }, severity: { type: 'string' } } } }, anchoringIndicators: { type: 'array' }, confirmationIndicators: { type: 'array' }, availabilityIndicators: { type: 'array' }, overconfidenceIndicators: { type: 'array' }, otherIndicators: { type: 'array' }, riskLevel: { type: 'string' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'bias-mitigation']
}));

export const motivatedReasoningTask = defineTask('motivated-reasoning', (args, taskCtx) => ({
  kind: 'agent', title: 'Check for motivated reasoning',
  agent: { name: 'bias-analyst', skills: ['hypothesis-generator', 'bayesian-inference-engine', 'formal-logic-reasoner'], prompt: { role: 'Motivated reasoning analyst', task: 'Assess for motivated reasoning patterns', context: args, instructions: ['Identify desired conclusions', 'Check if evidence selectively supports desires', 'Assess asymmetric skepticism', 'Identify identity-protective cognition', 'Check for political/tribal reasoning', 'Document motivated reasoning indicators'], outputFormat: 'JSON with desiredConclusions, selectiveEvidence, asymmetricSkepticism, identityProtection, tribalReasoning, indicators, artifacts' }, outputSchema: { type: 'object', required: ['indicators', 'artifacts'], properties: { desiredConclusions: { type: 'array' }, selectiveEvidence: { type: 'object' }, asymmetricSkepticism: { type: 'object' }, identityProtection: { type: 'object' }, tribalReasoning: { type: 'object' }, indicators: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'bias-mitigation']
}));

export const anchoringMitigationTask = defineTask('anchoring-mitigation', (args, taskCtx) => ({
  kind: 'agent', title: 'Mitigate anchoring bias',
  agent: { name: 'bias-analyst', skills: ['hypothesis-generator', 'bayesian-inference-engine', 'formal-logic-reasoner'], prompt: { role: 'Anchoring mitigation specialist', task: 'Apply techniques to mitigate anchoring bias', context: args, instructions: ['Identify potential anchors in analysis', 'Generate alternative starting points', 'Use anchor-adjustment from multiple directions', 'Consider base rates explicitly', 'Apply reference class forecasting', 'Document mitigation applied'], outputFormat: 'JSON with anchorsIdentified, alternativeStartingPoints, adjustments, baseRateConsiderations, mitigationApplied, revisedEstimates, artifacts' }, outputSchema: { type: 'object', required: ['anchorsIdentified', 'mitigationApplied', 'artifacts'], properties: { anchorsIdentified: { type: 'array' }, alternativeStartingPoints: { type: 'array' }, adjustments: { type: 'array' }, baseRateConsiderations: { type: 'object' }, mitigationApplied: { type: 'array' }, revisedEstimates: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'bias-mitigation']
}));

export const confirmationMitigationTask = defineTask('confirmation-mitigation', (args, taskCtx) => ({
  kind: 'agent', title: 'Mitigate confirmation bias',
  agent: { name: 'bias-analyst', skills: ['hypothesis-generator', 'bayesian-inference-engine', 'formal-logic-reasoner'], prompt: { role: 'Confirmation bias mitigation specialist', task: 'Apply techniques to mitigate confirmation bias', context: args, instructions: ['Actively seek disconfirming evidence', 'Apply consider-the-opposite technique', 'Generate alternative hypotheses', 'Evaluate evidence objectively', 'Apply devil\'s advocate perspective', 'Document mitigation applied'], outputFormat: 'JSON with disconfirmingEvidence, alternativeViews, alternativeHypotheses, objectiveEvaluation, devilsAdvocate, mitigationApplied, artifacts' }, outputSchema: { type: 'object', required: ['disconfirmingEvidence', 'mitigationApplied', 'artifacts'], properties: { disconfirmingEvidence: { type: 'array' }, alternativeViews: { type: 'array' }, alternativeHypotheses: { type: 'array' }, objectiveEvaluation: { type: 'object' }, devilsAdvocate: { type: 'object' }, mitigationApplied: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'bias-mitigation']
}));

export const availabilityMitigationTask = defineTask('availability-mitigation', (args, taskCtx) => ({
  kind: 'agent', title: 'Mitigate availability bias',
  agent: { name: 'bias-analyst', skills: ['hypothesis-generator', 'bayesian-inference-engine', 'formal-logic-reasoner'], prompt: { role: 'Availability bias mitigation specialist', task: 'Apply techniques to mitigate availability heuristic', context: args, instructions: ['Identify easily recalled instances', 'Search for systematic data', 'Consider what might be missing', 'Apply base rate information', 'Check for media/recency effects', 'Document mitigation applied'], outputFormat: 'JSON with easilyRecalled, systematicData, missingInformation, baseRateApplication, mediaEffects, mitigationApplied, artifacts' }, outputSchema: { type: 'object', required: ['easilyRecalled', 'mitigationApplied', 'artifacts'], properties: { easilyRecalled: { type: 'array' }, systematicData: { type: 'array' }, missingInformation: { type: 'array' }, baseRateApplication: { type: 'object' }, mediaEffects: { type: 'array' }, mitigationApplied: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'bias-mitigation']
}));

export const overconfidenceMitigationTask = defineTask('overconfidence-mitigation', (args, taskCtx) => ({
  kind: 'agent', title: 'Mitigate overconfidence bias',
  agent: { name: 'bias-analyst', skills: ['hypothesis-generator', 'bayesian-inference-engine', 'formal-logic-reasoner'], prompt: { role: 'Overconfidence mitigation specialist', task: 'Apply techniques to mitigate overconfidence', context: args, instructions: ['Widen confidence intervals', 'Apply premortem technique', 'Consider planning fallacy', 'Use reference class forecasting', 'Apply calibration training insights', 'Document mitigation applied'], outputFormat: 'JSON with widenedIntervals, premortemResults, planningFallacyCheck, referenceClassForecast, calibrationAdjustments, mitigationApplied, artifacts' }, outputSchema: { type: 'object', required: ['premortemResults', 'mitigationApplied', 'artifacts'], properties: { widenedIntervals: { type: 'object' }, premortemResults: { type: 'object' }, planningFallacyCheck: { type: 'object' }, referenceClassForecast: { type: 'object' }, calibrationAdjustments: { type: 'array' }, mitigationApplied: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'bias-mitigation']
}));

export const groupthinkMitigationTask = defineTask('groupthink-mitigation', (args, taskCtx) => ({
  kind: 'agent', title: 'Mitigate groupthink',
  agent: { name: 'bias-analyst', skills: ['hypothesis-generator', 'bayesian-inference-engine', 'formal-logic-reasoner'], prompt: { role: 'Groupthink mitigation specialist', task: 'Apply techniques to mitigate groupthink', context: args, instructions: ['Assess group dynamics', 'Identify potential groupthink symptoms', 'Recommend devil\'s advocate role', 'Suggest anonymous input methods', 'Recommend diverse perspectives', 'Document mitigation recommendations'], outputFormat: 'JSON with groupDynamics, groupthinkSymptoms, devilsAdvocate, anonymousInput, diversePerspectives, mitigationRecommendations, artifacts' }, outputSchema: { type: 'object', required: ['groupthinkSymptoms', 'mitigationRecommendations', 'artifacts'], properties: { groupDynamics: { type: 'object' }, groupthinkSymptoms: { type: 'array' }, devilsAdvocate: { type: 'object' }, anonymousInput: { type: 'object' }, diversePerspectives: { type: 'array' }, mitigationRecommendations: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'bias-mitigation']
}));

export const debiasedAnalysisSynthesisTask = defineTask('debiased-analysis-synthesis', (args, taskCtx) => ({
  kind: 'agent', title: 'Synthesize debiased analysis',
  agent: { name: 'bias-analyst', skills: ['hypothesis-generator', 'bayesian-inference-engine', 'formal-logic-reasoner'], prompt: { role: 'Analysis synthesis specialist', task: 'Synthesize all mitigations into improved analysis', context: args, instructions: ['Integrate all mitigation findings', 'Revise conclusions based on debiasing', 'Document changes from original', 'Assess residual bias risk', 'Create improved analysis', 'List all mitigations applied'], outputFormat: 'JSON with improvedAnalysis, appliedMitigations, changes, residualBiasRisk, comparisonToOriginal, artifacts' }, outputSchema: { type: 'object', required: ['improvedAnalysis', 'appliedMitigations', 'artifacts'], properties: { improvedAnalysis: { type: 'object' }, appliedMitigations: { type: 'array' }, changes: { type: 'array' }, residualBiasRisk: { type: 'object' }, comparisonToOriginal: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'bias-mitigation']
}));

export const biasRecommendationsTask = defineTask('bias-recommendations', (args, taskCtx) => ({
  kind: 'agent', title: 'Generate recommendations',
  agent: { name: 'bias-analyst', skills: ['hypothesis-generator', 'bayesian-inference-engine', 'formal-logic-reasoner'], prompt: { role: 'Bias prevention specialist', task: 'Generate recommendations for ongoing bias prevention', context: args, instructions: ['Recommend process improvements', 'Suggest decision hygiene practices', 'Recommend calibration training', 'Suggest accountability structures', 'Recommend feedback mechanisms', 'Prioritize recommendations'], outputFormat: 'JSON with recommendations, processImprovements, decisionHygiene, calibrationTraining, accountability, feedbackMechanisms, artifacts' }, outputSchema: { type: 'object', required: ['recommendations', 'artifacts'], properties: { recommendations: { type: 'array', items: { type: 'object', properties: { recommendation: { type: 'string' }, type: { type: 'string' }, priority: { type: 'string' }, implementation: { type: 'string' } } } }, processImprovements: { type: 'array' }, decisionHygiene: { type: 'array' }, calibrationTraining: { type: 'object' }, accountability: { type: 'array' }, feedbackMechanisms: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'bias-mitigation']
}));

export const biasQualityScoringTask = defineTask('bias-quality-scoring', (args, taskCtx) => ({
  kind: 'agent', title: 'Score bias mitigation quality',
  agent: { name: 'bias-analyst', skills: ['hypothesis-generator', 'bayesian-inference-engine', 'formal-logic-reasoner'], prompt: { role: 'Bias mitigation auditor', task: 'Score the quality of the cognitive bias mitigation', context: args, instructions: ['Score bias identification thoroughness', 'Score mitigation technique application', 'Score analysis improvement', 'Score recommendation actionability', 'Calculate overall score'], outputFormat: 'JSON with overallScore, identificationScore, mitigationScore, improvementScore, recommendationScore, artifacts' }, outputSchema: { type: 'object', required: ['overallScore', 'artifacts'], properties: { overallScore: { type: 'number' }, identificationScore: { type: 'number' }, mitigationScore: { type: 'number' }, improvementScore: { type: 'number' }, recommendationScore: { type: 'number' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'bias-mitigation']
}));
