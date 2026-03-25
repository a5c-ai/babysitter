/**
 * @process domains/science/scientific-discovery/analogical-cross-domain-transfer
 * @description Apply solutions from analogous problems in other domains - Guides practitioners through
 * systematic analogical reasoning to identify solutions from other fields and adapt them to the target problem.
 * @inputs { problem: string, sourceDomains?: array, targetDomain: string, constraints?: array }
 * @outputs { success: boolean, analogies: array, transferredSolutions: array, adaptedConcepts: array, evaluation: object }
 *
 * @example
 * const result = await orchestrate('domains/science/scientific-discovery/analogical-cross-domain-transfer', {
 *   problem: 'Design self-healing materials for construction',
 *   sourceDomains: ['biology', 'medicine', 'ecology'],
 *   targetDomain: 'materials-science'
 * });
 *
 * @references
 * - Gentner, D. (1983). Structure-mapping: A theoretical framework for analogy
 * - Holyoak, K.J. & Thagard, P. (1995). Mental Leaps: Analogy in Creative Thought
 * - Gick, M.L. & Holyoak, K.J. (1980). Analogical problem solving
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    problem,
    sourceDomains = ['nature', 'biology', 'technology', 'social-systems'],
    targetDomain,
    constraints = [],
    outputDir = 'analogical-transfer-output',
    minimumTransferScore = 70
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Analogical Transfer for: ${problem}`);

  const problemAbstraction = await ctx.task(problemAbstractionTask, { problem, targetDomain, outputDir });
  artifacts.push(...problemAbstraction.artifacts);

  const analogySearch = await ctx.task(analogySearchTask, { abstractedProblem: problemAbstraction.abstractedProblem, sourceDomains, outputDir });
  artifacts.push(...analogySearch.artifacts);

  await ctx.breakpoint({
    question: `Found ${analogySearch.analogies?.length || 0} analogies across ${sourceDomains.length} domains. Review before structural mapping?`,
    title: 'Analogy Search Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })), summary: { analogiesFound: analogySearch.analogies?.length || 0, sourceDomains: sourceDomains.length }}
  });

  const structuralMapping = await ctx.task(structuralMappingTask, { analogies: analogySearch.analogies, problem, targetDomain, outputDir });
  artifacts.push(...structuralMapping.artifacts);

  const solutionExtraction = await ctx.task(solutionExtractionTask, { mappings: structuralMapping.mappings, analogies: analogySearch.analogies, outputDir });
  artifacts.push(...solutionExtraction.artifacts);

  const solutionAdaptation = await ctx.task(solutionAdaptationTask, { extractedSolutions: solutionExtraction.solutions, problem, targetDomain, constraints, outputDir });
  artifacts.push(...solutionAdaptation.artifacts);

  const transferEvaluation = await ctx.task(transferEvaluationTask, { adaptedConcepts: solutionAdaptation.adaptedConcepts, problem, minimumTransferScore, outputDir });
  artifacts.push(...transferEvaluation.artifacts);

  const qualityScore = await ctx.task(analogyQualityScoringTask, { problemAbstraction, analogySearch, structuralMapping, solutionAdaptation, transferEvaluation, outputDir });
  artifacts.push(...qualityScore.artifacts);

  await ctx.breakpoint({
    question: `Analogical transfer complete. ${solutionAdaptation.adaptedConcepts?.length || 0} concepts adapted. Quality: ${qualityScore.overallScore}/100. Approve?`,
    title: 'Analogical Transfer Approval',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })), summary: { adaptedConcepts: solutionAdaptation.adaptedConcepts?.length || 0, qualityScore: qualityScore.overallScore }}
  });

  return {
    success: true, problem, analogies: analogySearch.analogies, transferredSolutions: solutionExtraction.solutions,
    adaptedConcepts: solutionAdaptation.adaptedConcepts, evaluation: transferEvaluation,
    qualityScore: { overall: qualityScore.overallScore }, artifacts, duration: ctx.now() - startTime,
    metadata: { processId: 'domains/science/scientific-discovery/analogical-cross-domain-transfer', timestamp: startTime, outputDir }
  };
}

export const problemAbstractionTask = defineTask('problem-abstraction', (args, taskCtx) => ({
  kind: 'agent', title: 'Abstract the problem',
  agent: { name: 'analogical-reasoner', skills: ['analogy-mapper', 'hypothesis-generator', 'semantic-scholar-search'], prompt: { role: 'Abstraction specialist', task: 'Abstract the problem to domain-independent form', context: args, instructions: ['Identify core problem structure', 'Remove domain-specific details', 'Identify key relationships and constraints', 'Define goal structure', 'Create schema of the problem'], outputFormat: 'JSON with abstractedProblem, coreStructure, keyRelationships, goalStructure, artifacts' }, outputSchema: { type: 'object', required: ['abstractedProblem', 'artifacts'], properties: { abstractedProblem: { type: 'string' }, coreStructure: { type: 'object' }, keyRelationships: { type: 'array' }, goalStructure: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'analogical-transfer']
}));

export const analogySearchTask = defineTask('analogy-search', (args, taskCtx) => ({
  kind: 'agent', title: 'Search for analogies',
  agent: { name: 'analogical-reasoner', skills: ['analogy-mapper', 'hypothesis-generator', 'semantic-scholar-search'], prompt: { role: 'Analogy finder', task: 'Search for structurally similar problems in other domains', context: args, instructions: ['Search each source domain for similar structures', 'Identify surface and structural similarities', 'Find problems with known solutions', 'Document analogy rationale', 'Rank analogies by structural similarity'], outputFormat: 'JSON with analogies, domainSources, similarityRatings, artifacts' }, outputSchema: { type: 'object', required: ['analogies', 'artifacts'], properties: { analogies: { type: 'array', items: { type: 'object', properties: { domain: { type: 'string' }, problem: { type: 'string' }, solution: { type: 'string' }, similarity: { type: 'number' } } } }, domainSources: { type: 'object' }, similarityRatings: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'analogical-transfer']
}));

export const structuralMappingTask = defineTask('structural-mapping', (args, taskCtx) => ({
  kind: 'agent', title: 'Map structural correspondences',
  agent: { name: 'analogical-reasoner', skills: ['analogy-mapper', 'hypothesis-generator', 'semantic-scholar-search'], prompt: { role: 'Structure mapping specialist', task: 'Map elements between source and target domains', context: args, instructions: ['Identify element correspondences', 'Map relationships between elements', 'Identify higher-order relations', 'Check for systematic consistency', 'Document mapping quality'], outputFormat: 'JSON with mappings, elementCorrespondences, relationMappings, consistency, artifacts' }, outputSchema: { type: 'object', required: ['mappings', 'artifacts'], properties: { mappings: { type: 'array' }, elementCorrespondences: { type: 'object' }, relationMappings: { type: 'array' }, consistency: { type: 'number' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'analogical-transfer']
}));

export const solutionExtractionTask = defineTask('solution-extraction', (args, taskCtx) => ({
  kind: 'agent', title: 'Extract solution principles',
  agent: { name: 'analogical-reasoner', skills: ['analogy-mapper', 'hypothesis-generator', 'semantic-scholar-search'], prompt: { role: 'Solution extraction specialist', task: 'Extract transferable solution principles from analogies', context: args, instructions: ['Identify solution mechanisms', 'Abstract solution principles', 'Document success factors', 'Identify transferable elements', 'Note domain-specific constraints'], outputFormat: 'JSON with solutions, principles, mechanisms, transferableElements, artifacts' }, outputSchema: { type: 'object', required: ['solutions', 'artifacts'], properties: { solutions: { type: 'array', items: { type: 'object', properties: { analogy: { type: 'string' }, principle: { type: 'string' }, mechanism: { type: 'string' } } } }, principles: { type: 'array', items: { type: 'string' } }, mechanisms: { type: 'array' }, transferableElements: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'analogical-transfer']
}));

export const solutionAdaptationTask = defineTask('solution-adaptation', (args, taskCtx) => ({
  kind: 'agent', title: 'Adapt solutions to target domain',
  agent: { name: 'analogical-reasoner', skills: ['analogy-mapper', 'hypothesis-generator', 'semantic-scholar-search'], prompt: { role: 'Solution adaptation specialist', task: 'Adapt extracted solutions to the target domain', context: args, instructions: ['Translate principles to target domain', 'Address domain constraints', 'Modify for local requirements', 'Identify implementation challenges', 'Create adapted concepts'], outputFormat: 'JSON with adaptedConcepts, translations, challenges, modifications, artifacts' }, outputSchema: { type: 'object', required: ['adaptedConcepts', 'artifacts'], properties: { adaptedConcepts: { type: 'array', items: { type: 'object', properties: { concept: { type: 'string' }, sourcePrinciple: { type: 'string' }, adaptation: { type: 'string' }, feasibility: { type: 'string' } } } }, translations: { type: 'array' }, challenges: { type: 'array', items: { type: 'string' } }, modifications: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'analogical-transfer']
}));

export const transferEvaluationTask = defineTask('transfer-evaluation', (args, taskCtx) => ({
  kind: 'agent', title: 'Evaluate transfer quality',
  agent: { name: 'analogical-reasoner', skills: ['analogy-mapper', 'hypothesis-generator', 'semantic-scholar-search'], prompt: { role: 'Transfer evaluation specialist', task: 'Evaluate the quality and validity of analogical transfers', context: args, instructions: ['Assess structural alignment quality', 'Evaluate adaptation fidelity', 'Rate feasibility in target domain', 'Identify transfer risks', 'Rank adapted concepts'], outputFormat: 'JSON with transferScores, feasibilityRatings, risks, rankings, overallScore, artifacts' }, outputSchema: { type: 'object', required: ['transferScores', 'rankings', 'artifacts'], properties: { transferScores: { type: 'array' }, feasibilityRatings: { type: 'array' }, risks: { type: 'array', items: { type: 'string' } }, rankings: { type: 'array' }, overallScore: { type: 'number' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'analogical-transfer']
}));

export const analogyQualityScoringTask = defineTask('analogy-quality-scoring', (args, taskCtx) => ({
  kind: 'agent', title: 'Score analogical reasoning quality',
  agent: { name: 'analogical-reasoner', skills: ['analogy-mapper', 'hypothesis-generator', 'semantic-scholar-search'], prompt: { role: 'Analogical reasoning auditor', task: 'Score the quality of the analogical transfer process', context: args, instructions: ['Score problem abstraction', 'Score analogy identification', 'Score structural mapping', 'Score solution adaptation', 'Calculate overall score'], outputFormat: 'JSON with overallScore, abstractionScore, analogyScore, mappingScore, adaptationScore, artifacts' }, outputSchema: { type: 'object', required: ['overallScore', 'artifacts'], properties: { overallScore: { type: 'number' }, abstractionScore: { type: 'number' }, analogyScore: { type: 'number' }, mappingScore: { type: 'number' }, adaptationScore: { type: 'number' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'analogical-transfer']
}));
