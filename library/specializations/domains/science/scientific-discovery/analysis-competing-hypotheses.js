/**
 * @process domains/science/scientific-discovery/analysis-competing-hypotheses
 * @description Systematically evaluate multiple hypotheses against evidence - Guides analysts through the
 * Analysis of Competing Hypotheses (ACH) methodology to avoid cognitive biases in hypothesis evaluation.
 * @inputs { question: string, hypotheses: array, evidence: array }
 * @outputs { success: boolean, matrix: object, rankings: array, diagnosticEvidence: array, conclusion: object }
 *
 * @example
 * const result = await orchestrate('domains/science/scientific-discovery/analysis-competing-hypotheses', {
 *   question: 'What caused the system failure?',
 *   hypotheses: ['Software bug', 'Hardware failure', 'Human error', 'External attack'],
 *   evidence: ['Log files', 'Hardware diagnostics', 'Operator interviews', 'Network traffic']
 * });
 *
 * @references
 * - Heuer, R.J. (1999). Psychology of Intelligence Analysis
 * - Heuer, R.J. & Pherson, R.H. (2010). Structured Analytic Techniques
 * - CIA Tradecraft Primer (2009)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { question, hypotheses = [], evidence = [], outputDir = 'ach-output', minimumConfidence = 70 } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Analysis of Competing Hypotheses for: ${question}`);

  const hypothesisGeneration = await ctx.task(achHypothesisGenerationTask, { question, hypotheses, outputDir });
  artifacts.push(...hypothesisGeneration.artifacts);

  const evidenceListing = await ctx.task(achEvidenceListingTask, { question, evidence, outputDir });
  artifacts.push(...evidenceListing.artifacts);

  const matrixConstruction = await ctx.task(achMatrixConstructionTask, { hypotheses: hypothesisGeneration.hypotheses, evidence: evidenceListing.evidence, outputDir });
  artifacts.push(...matrixConstruction.artifacts);

  await ctx.breakpoint({
    question: `ACH matrix: ${hypothesisGeneration.hypotheses?.length || 0} hypotheses, ${evidenceListing.evidence?.length || 0} evidence items. Review before analysis?`,
    title: 'ACH Matrix Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })), summary: { hypotheses: hypothesisGeneration.hypotheses?.length || 0, evidence: evidenceListing.evidence?.length || 0 }}
  });

  const consistencyRating = await ctx.task(achConsistencyRatingTask, { matrix: matrixConstruction.matrix, hypotheses: hypothesisGeneration.hypotheses, evidence: evidenceListing.evidence, outputDir });
  artifacts.push(...consistencyRating.artifacts);

  const diagnosticAnalysis = await ctx.task(achDiagnosticAnalysisTask, { ratings: consistencyRating.ratings, hypotheses: hypothesisGeneration.hypotheses, evidence: evidenceListing.evidence, outputDir });
  artifacts.push(...diagnosticAnalysis.artifacts);

  const hypothesisRanking = await ctx.task(achHypothesisRankingTask, { ratings: consistencyRating.ratings, diagnostics: diagnosticAnalysis, hypotheses: hypothesisGeneration.hypotheses, outputDir });
  artifacts.push(...hypothesisRanking.artifacts);

  const sensitivityAnalysis = await ctx.task(achSensitivityAnalysisTask, { rankings: hypothesisRanking.rankings, ratings: consistencyRating.ratings, outputDir });
  artifacts.push(...sensitivityAnalysis.artifacts);

  const conclusionGeneration = await ctx.task(achConclusionTask, { rankings: hypothesisRanking.rankings, diagnostics: diagnosticAnalysis, sensitivityAnalysis, minimumConfidence, outputDir });
  artifacts.push(...conclusionGeneration.artifacts);

  const qualityScore = await ctx.task(achQualityScoringTask, { hypothesisGeneration, evidenceListing, consistencyRating, diagnosticAnalysis, conclusionGeneration, outputDir });
  artifacts.push(...qualityScore.artifacts);

  await ctx.breakpoint({
    question: `ACH complete. Top hypothesis: "${hypothesisRanking.topHypothesis?.hypothesis || 'N/A'}". Confidence: ${conclusionGeneration.confidence}%. Quality: ${qualityScore.overallScore}/100. Approve?`,
    title: 'ACH Analysis Approval',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })), summary: { topHypothesis: hypothesisRanking.topHypothesis?.hypothesis || 'N/A', confidence: conclusionGeneration.confidence, qualityScore: qualityScore.overallScore }}
  });

  return {
    success: true, question, matrix: matrixConstruction.matrix, rankings: hypothesisRanking.rankings,
    diagnosticEvidence: diagnosticAnalysis.diagnosticEvidence, conclusion: conclusionGeneration,
    qualityScore: { overall: qualityScore.overallScore }, artifacts, duration: ctx.now() - startTime,
    metadata: { processId: 'domains/science/scientific-discovery/analysis-competing-hypotheses', timestamp: startTime, outputDir }
  };
}

export const achHypothesisGenerationTask = defineTask('ach-hypothesis-generation', (args, taskCtx) => ({
  kind: 'agent', title: 'Generate hypotheses',
  agent: { name: 'hypothesis-architect', skills: ['hypothesis-generator', 'bayesian-inference-engine', 'statistical-test-selector'], prompt: { role: 'Intelligence analyst', task: 'Generate comprehensive set of hypotheses', context: args, instructions: ['List all provided hypotheses', 'Generate additional plausible hypotheses', 'Include unlikely but possible hypotheses', 'Ensure hypotheses are mutually exclusive where possible', 'Document hypothesis rationale'], outputFormat: 'JSON with hypotheses, additionalHypotheses, rationale, artifacts' }, outputSchema: { type: 'object', required: ['hypotheses', 'artifacts'], properties: { hypotheses: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, hypothesis: { type: 'string' }, description: { type: 'string' } } } }, additionalHypotheses: { type: 'array' }, rationale: { type: 'string' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'ach']
}));

export const achEvidenceListingTask = defineTask('ach-evidence-listing', (args, taskCtx) => ({
  kind: 'agent', title: 'List and assess evidence',
  agent: { name: 'hypothesis-architect', skills: ['hypothesis-generator', 'bayesian-inference-engine', 'statistical-test-selector'], prompt: { role: 'Evidence analyst', task: 'List and assess all relevant evidence', context: args, instructions: ['List all provided evidence', 'Identify additional potential evidence', 'Assess source reliability', 'Assess information credibility', 'Note evidence gaps'], outputFormat: 'JSON with evidence, reliability, credibility, gaps, artifacts' }, outputSchema: { type: 'object', required: ['evidence', 'artifacts'], properties: { evidence: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, evidence: { type: 'string' }, source: { type: 'string' }, reliability: { type: 'string' }, credibility: { type: 'string' } } } }, reliability: { type: 'object' }, credibility: { type: 'object' }, gaps: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'ach']
}));

export const achMatrixConstructionTask = defineTask('ach-matrix-construction', (args, taskCtx) => ({
  kind: 'agent', title: 'Construct ACH matrix',
  agent: { name: 'hypothesis-architect', skills: ['hypothesis-generator', 'bayesian-inference-engine', 'statistical-test-selector'], prompt: { role: 'Matrix construction specialist', task: 'Construct the ACH matrix structure', context: args, instructions: ['Create matrix with hypotheses as columns', 'Evidence as rows', 'Prepare for consistency ratings', 'Document matrix structure'], outputFormat: 'JSON with matrix, structure, artifacts' }, outputSchema: { type: 'object', required: ['matrix', 'artifacts'], properties: { matrix: { type: 'object' }, structure: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'ach']
}));

export const achConsistencyRatingTask = defineTask('ach-consistency-rating', (args, taskCtx) => ({
  kind: 'agent', title: 'Rate evidence-hypothesis consistency',
  agent: { name: 'hypothesis-architect', skills: ['hypothesis-generator', 'bayesian-inference-engine', 'statistical-test-selector'], prompt: { role: 'Consistency rater', task: 'Rate consistency of each evidence item with each hypothesis', context: args, instructions: ['Rate as: Consistent (C), Inconsistent (I), Neutral (N)', 'Consider: If hypothesis is true, would evidence be expected?', 'Focus on disconfirming evidence', 'Document rating rationale'], outputFormat: 'JSON with ratings, ratingMatrix, rationale, artifacts' }, outputSchema: { type: 'object', required: ['ratings', 'ratingMatrix', 'artifacts'], properties: { ratings: { type: 'array' }, ratingMatrix: { type: 'object' }, rationale: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'ach']
}));

export const achDiagnosticAnalysisTask = defineTask('ach-diagnostic-analysis', (args, taskCtx) => ({
  kind: 'agent', title: 'Analyze diagnostic evidence',
  agent: { name: 'hypothesis-architect', skills: ['hypothesis-generator', 'bayesian-inference-engine', 'statistical-test-selector'], prompt: { role: 'Diagnostic analyst', task: 'Identify most diagnostic evidence items', context: args, instructions: ['Find evidence that distinguishes between hypotheses', 'Identify evidence with mixed consistency patterns', 'Rank evidence by diagnostic value', 'Flag non-diagnostic evidence'], outputFormat: 'JSON with diagnosticEvidence, nonDiagnosticEvidence, rankings, artifacts' }, outputSchema: { type: 'object', required: ['diagnosticEvidence', 'artifacts'], properties: { diagnosticEvidence: { type: 'array' }, nonDiagnosticEvidence: { type: 'array' }, rankings: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'ach']
}));

export const achHypothesisRankingTask = defineTask('ach-hypothesis-ranking', (args, taskCtx) => ({
  kind: 'agent', title: 'Rank hypotheses',
  agent: { name: 'hypothesis-architect', skills: ['hypothesis-generator', 'bayesian-inference-engine', 'statistical-test-selector'], prompt: { role: 'Hypothesis ranking specialist', task: 'Rank hypotheses by inconsistency count', context: args, instructions: ['Count inconsistencies for each hypothesis', 'Rank from least to most inconsistent', 'Focus on disconfirmation, not confirmation', 'Identify refuted hypotheses'], outputFormat: 'JSON with rankings, topHypothesis, refutedHypotheses, inconsistencyCounts, artifacts' }, outputSchema: { type: 'object', required: ['rankings', 'topHypothesis', 'artifacts'], properties: { rankings: { type: 'array' }, topHypothesis: { type: 'object' }, refutedHypotheses: { type: 'array' }, inconsistencyCounts: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'ach']
}));

export const achSensitivityAnalysisTask = defineTask('ach-sensitivity-analysis', (args, taskCtx) => ({
  kind: 'agent', title: 'Perform sensitivity analysis',
  agent: { name: 'hypothesis-architect', skills: ['hypothesis-generator', 'bayesian-inference-engine', 'statistical-test-selector'], prompt: { role: 'Sensitivity analyst', task: 'Analyze sensitivity of conclusions to key evidence', context: args, instructions: ['Identify critical evidence items', 'Test impact of removing/changing evidence', 'Assess robustness of conclusions', 'Identify linchpin assumptions'], outputFormat: 'JSON with criticalEvidence, sensitivityResults, robustness, linchpins, artifacts' }, outputSchema: { type: 'object', required: ['criticalEvidence', 'robustness', 'artifacts'], properties: { criticalEvidence: { type: 'array' }, sensitivityResults: { type: 'array' }, robustness: { type: 'string' }, linchpins: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'ach']
}));

export const achConclusionTask = defineTask('ach-conclusion', (args, taskCtx) => ({
  kind: 'agent', title: 'Generate conclusions',
  agent: { name: 'hypothesis-architect', skills: ['hypothesis-generator', 'bayesian-inference-engine', 'statistical-test-selector'], prompt: { role: 'Intelligence conclusion specialist', task: 'Generate conclusions from ACH analysis', context: args, instructions: ['State most likely hypothesis', 'Explain reasoning based on inconsistencies', 'Assess confidence level', 'Identify remaining uncertainties', 'Recommend collection requirements'], outputFormat: 'JSON with conclusion, mostLikely, confidence, uncertainties, collectionRequirements, artifacts' }, outputSchema: { type: 'object', required: ['conclusion', 'confidence', 'artifacts'], properties: { conclusion: { type: 'string' }, mostLikely: { type: 'string' }, confidence: { type: 'number' }, uncertainties: { type: 'array' }, collectionRequirements: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'ach']
}));

export const achQualityScoringTask = defineTask('ach-quality-scoring', (args, taskCtx) => ({
  kind: 'agent', title: 'Score ACH quality',
  agent: { name: 'hypothesis-architect', skills: ['hypothesis-generator', 'bayesian-inference-engine', 'statistical-test-selector'], prompt: { role: 'ACH quality auditor', task: 'Score the quality of the ACH analysis', context: args, instructions: ['Score hypothesis coverage', 'Score evidence completeness', 'Score rating objectivity', 'Score conclusion validity', 'Calculate overall score'], outputFormat: 'JSON with overallScore, hypothesisScore, evidenceScore, ratingScore, conclusionScore, artifacts' }, outputSchema: { type: 'object', required: ['overallScore', 'artifacts'], properties: { overallScore: { type: 'number' }, hypothesisScore: { type: 'number' }, evidenceScore: { type: 'number' }, ratingScore: { type: 'number' }, conclusionScore: { type: 'number' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'ach']
}));
