/**
 * @process domains/science/scientific-discovery/key-assumptions-check
 * @description Explicitly identify, document, and challenge underlying assumptions - Guides analysts through
 * systematically surfacing and testing assumptions that underpin analyses and decisions.
 * @inputs { analysis: object, conclusions: array, evidence: array }
 * @outputs { success: boolean, assumptions: array, testedAssumptions: array, vulnerableAssumptions: array, recommendations: array }
 *
 * @example
 * const result = await orchestrate('domains/science/scientific-discovery/key-assumptions-check', {
 *   analysis: { topic: 'Market expansion into Asia', conclusion: 'Proceed with expansion' },
 *   conclusions: ['Market is large enough', 'We can compete', 'Regulations are favorable'],
 *   evidence: ['Market research', 'Competitor analysis', 'Legal review']
 * });
 *
 * @references
 * - Heuer, R.J. & Pherson, R.H. (2010). Structured Analytic Techniques
 * - CIA Tradecraft Primer (2009)
 * - Schoemaker, P.J.H. (1995). Scenario Planning: A Tool for Strategic Thinking
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { analysis, conclusions = [], evidence = [], outputDir = 'kac-output', minimumTestingCoverage = 80 } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Key Assumptions Check for: ${analysis.topic || 'Analysis'}`);

  const assumptionElicitation = await ctx.task(assumptionElicitationTask, { analysis, conclusions, evidence, outputDir });
  artifacts.push(...assumptionElicitation.artifacts);

  const assumptionCategorization = await ctx.task(assumptionCategorizationTask, { assumptions: assumptionElicitation.assumptions, outputDir });
  artifacts.push(...assumptionCategorization.artifacts);

  await ctx.breakpoint({
    question: `Elicited ${assumptionElicitation.assumptions?.length || 0} assumptions. ${assumptionCategorization.keyAssumptions?.length || 0} classified as key. Review before testing?`,
    title: 'Assumptions Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })), summary: { totalAssumptions: assumptionElicitation.assumptions?.length || 0, keyAssumptions: assumptionCategorization.keyAssumptions?.length || 0 }}
  });

  const assumptionTesting = await ctx.task(assumptionTestingTask, { keyAssumptions: assumptionCategorization.keyAssumptions, evidence, outputDir });
  artifacts.push(...assumptionTesting.artifacts);

  const vulnerabilityAssessment = await ctx.task(assumptionVulnerabilityTask, { testedAssumptions: assumptionTesting.testedAssumptions, analysis, outputDir });
  artifacts.push(...vulnerabilityAssessment.artifacts);

  const impactAnalysis = await ctx.task(assumptionImpactTask, { vulnerableAssumptions: vulnerabilityAssessment.vulnerableAssumptions, conclusions, outputDir });
  artifacts.push(...impactAnalysis.artifacts);

  const recommendationGeneration = await ctx.task(kacRecommendationsTask, { vulnerableAssumptions: vulnerabilityAssessment.vulnerableAssumptions, impactAnalysis, analysis, outputDir });
  artifacts.push(...recommendationGeneration.artifacts);

  const qualityScore = await ctx.task(kacQualityScoringTask, { assumptionElicitation, assumptionTesting, vulnerabilityAssessment, recommendationGeneration, minimumTestingCoverage, outputDir });
  artifacts.push(...qualityScore.artifacts);

  await ctx.breakpoint({
    question: `KAC complete. ${vulnerabilityAssessment.vulnerableAssumptions?.length || 0} vulnerable assumptions identified. Quality: ${qualityScore.overallScore}/100. Approve?`,
    title: 'Key Assumptions Check Approval',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })), summary: { vulnerableAssumptions: vulnerabilityAssessment.vulnerableAssumptions?.length || 0, qualityScore: qualityScore.overallScore }}
  });

  return {
    success: true, analysis: analysis.topic, assumptions: assumptionElicitation.assumptions,
    testedAssumptions: assumptionTesting.testedAssumptions, vulnerableAssumptions: vulnerabilityAssessment.vulnerableAssumptions,
    recommendations: recommendationGeneration.recommendations, qualityScore: { overall: qualityScore.overallScore },
    artifacts, duration: ctx.now() - startTime,
    metadata: { processId: 'domains/science/scientific-discovery/key-assumptions-check', timestamp: startTime, outputDir }
  };
}

export const assumptionElicitationTask = defineTask('assumption-elicitation', (args, taskCtx) => ({
  kind: 'agent', title: 'Elicit assumptions',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'assumption-analyst', skills: ['hypothesis-generator', 'formal-logic-reasoner'], prompt: { role: 'Assumption analyst', task: 'Elicit all assumptions underlying the analysis', context: args, instructions: ['Identify explicit assumptions stated', 'Surface implicit assumptions', 'Find assumptions in evidence interpretations', 'Identify assumptions about the future', 'Find assumptions about cause-effect', 'Document assumption sources'], outputFormat: 'JSON with assumptions, explicitAssumptions, implicitAssumptions, evidenceAssumptions, futureAssumptions, artifacts' }, outputSchema: { type: 'object', required: ['assumptions', 'artifacts'], properties: { assumptions: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, assumption: { type: 'string' }, type: { type: 'string' }, source: { type: 'string' } } } }, explicitAssumptions: { type: 'array' }, implicitAssumptions: { type: 'array' }, evidenceAssumptions: { type: 'array' }, futureAssumptions: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'kac']
}));

export const assumptionCategorizationTask = defineTask('assumption-categorization', (args, taskCtx) => ({
  kind: 'agent', title: 'Categorize assumptions',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'assumption-analyst', skills: ['hypothesis-generator', 'formal-logic-reasoner'], prompt: { role: 'Assumption categorizer', task: 'Categorize assumptions by importance and uncertainty', context: args, instructions: ['Assess impact if assumption is wrong', 'Assess confidence in assumption', 'Identify key assumptions (high impact, uncertain)', 'Separate from supporting assumptions', 'Rank by criticality'], outputFormat: 'JSON with keyAssumptions, supportingAssumptions, rankings, impactAssessment, confidenceAssessment, artifacts' }, outputSchema: { type: 'object', required: ['keyAssumptions', 'rankings', 'artifacts'], properties: { keyAssumptions: { type: 'array' }, supportingAssumptions: { type: 'array' }, rankings: { type: 'array' }, impactAssessment: { type: 'object' }, confidenceAssessment: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'kac']
}));

export const assumptionTestingTask = defineTask('assumption-testing', (args, taskCtx) => ({
  kind: 'agent', title: 'Test key assumptions',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'assumption-analyst', skills: ['hypothesis-generator', 'formal-logic-reasoner'], prompt: { role: 'Assumption tester', task: 'Test each key assumption against available evidence', context: args, instructions: ['For each key assumption, identify supporting evidence', 'Identify contradicting evidence', 'Assess strength of evidence', 'Apply devil\'s advocate perspective', 'Rate assumption validity'], outputFormat: 'JSON with testedAssumptions, supportingEvidence, contradictingEvidence, validityRatings, artifacts' }, outputSchema: { type: 'object', required: ['testedAssumptions', 'artifacts'], properties: { testedAssumptions: { type: 'array', items: { type: 'object', properties: { assumption: { type: 'string' }, supporting: { type: 'array' }, contradicting: { type: 'array' }, validity: { type: 'string' } } } }, supportingEvidence: { type: 'object' }, contradictingEvidence: { type: 'object' }, validityRatings: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'kac']
}));

export const assumptionVulnerabilityTask = defineTask('assumption-vulnerability', (args, taskCtx) => ({
  kind: 'agent', title: 'Assess assumption vulnerability',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'assumption-analyst', skills: ['hypothesis-generator', 'formal-logic-reasoner'], prompt: { role: 'Vulnerability assessor', task: 'Identify vulnerable assumptions', context: args, instructions: ['Identify assumptions with weak support', 'Identify assumptions with contradicting evidence', 'Identify assumptions that are uncertain', 'Assess vulnerability level', 'Document vulnerability rationale'], outputFormat: 'JSON with vulnerableAssumptions, vulnerabilityLevels, rationale, artifacts' }, outputSchema: { type: 'object', required: ['vulnerableAssumptions', 'artifacts'], properties: { vulnerableAssumptions: { type: 'array', items: { type: 'object', properties: { assumption: { type: 'string' }, vulnerabilityLevel: { type: 'string' }, rationale: { type: 'string' } } } }, vulnerabilityLevels: { type: 'object' }, rationale: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'kac']
}));

export const assumptionImpactTask = defineTask('assumption-impact', (args, taskCtx) => ({
  kind: 'agent', title: 'Analyze impact of wrong assumptions',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'assumption-analyst', skills: ['hypothesis-generator', 'formal-logic-reasoner'], prompt: { role: 'Impact analyst', task: 'Analyze impact if vulnerable assumptions are wrong', context: args, instructions: ['For each vulnerable assumption, assess impact if wrong', 'Determine which conclusions would change', 'Assess severity of impact', 'Identify cascading effects', 'Prioritize by impact severity'], outputFormat: 'JSON with impactAnalysis, affectedConclusions, severity, cascadingEffects, prioritization, artifacts' }, outputSchema: { type: 'object', required: ['impactAnalysis', 'affectedConclusions', 'artifacts'], properties: { impactAnalysis: { type: 'array' }, affectedConclusions: { type: 'object' }, severity: { type: 'object' }, cascadingEffects: { type: 'array' }, prioritization: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'kac']
}));

export const kacRecommendationsTask = defineTask('kac-recommendations', (args, taskCtx) => ({
  kind: 'agent', title: 'Generate recommendations',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'assumption-analyst', skills: ['hypothesis-generator', 'formal-logic-reasoner'], prompt: { role: 'Recommendation specialist', task: 'Generate recommendations based on assumption analysis', context: args, instructions: ['Recommend collection to validate assumptions', 'Recommend alternative analyses', 'Recommend hedging strategies', 'Recommend monitoring indicators', 'Prioritize recommendations'], outputFormat: 'JSON with recommendations, collectionRequirements, alternativeAnalyses, hedgingStrategies, monitoringIndicators, artifacts' }, outputSchema: { type: 'object', required: ['recommendations', 'artifacts'], properties: { recommendations: { type: 'array', items: { type: 'object', properties: { recommendation: { type: 'string' }, type: { type: 'string' }, priority: { type: 'string' }, relatedAssumption: { type: 'string' } } } }, collectionRequirements: { type: 'array' }, alternativeAnalyses: { type: 'array' }, hedgingStrategies: { type: 'array' }, monitoringIndicators: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'kac']
}));

export const kacQualityScoringTask = defineTask('kac-quality-scoring', (args, taskCtx) => ({
  kind: 'agent', title: 'Score KAC quality',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'assumption-analyst', skills: ['hypothesis-generator', 'formal-logic-reasoner'], prompt: { role: 'KAC quality auditor', task: 'Score the quality of the key assumptions check', context: args, instructions: ['Score assumption elicitation thoroughness', 'Score testing rigor', 'Score vulnerability assessment', 'Score recommendation actionability', 'Calculate overall score'], outputFormat: 'JSON with overallScore, elicitationScore, testingScore, vulnerabilityScore, recommendationScore, artifacts' }, outputSchema: { type: 'object', required: ['overallScore', 'artifacts'], properties: { overallScore: { type: 'number' }, elicitationScore: { type: 'number' }, testingScore: { type: 'number' }, vulnerabilityScore: { type: 'number' }, recommendationScore: { type: 'number' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'kac']
}));
