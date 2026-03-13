/**
 * @process domains/business/knowledge-management/expert-matching
 * @description Implement systems and processes to connect knowledge seekers with relevant experts for problem-solving and consultation
 * @specialization Knowledge Management
 * @category Expertise Location and Mapping
 * @inputs { matchingRequest: object, expertPool: array, matchingCriteria: object, outputDir: string }
 * @outputs { success: boolean, matchingSystem: object, matchResults: array, connectionProtocol: object, qualityScore: number, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    matchingRequest = {},
    expertPool = [],
    matchingCriteria = {},
    expertiseProfiles = [],
    matchingAlgorithm = 'relevance-availability-proximity',
    outputDir = 'expert-matching-output',
    requireApproval = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Expert Matching for Problem-Solving Process');

  // Phase 1: Request Analysis
  ctx.log('info', 'Phase 1: Analyzing knowledge request');
  const requestAnalysis = await ctx.task(requestAnalysisTask, { matchingRequest, outputDir });
  artifacts.push(...requestAnalysis.artifacts);

  await ctx.breakpoint({
    question: `Knowledge request analyzed: "${requestAnalysis.summary}". Expertise areas: ${requestAnalysis.expertiseNeeded.join(', ')}. Proceed?`,
    title: 'Request Analysis Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })), summary: { expertiseNeeded: requestAnalysis.expertiseNeeded } }
  });

  // Phase 2: Expert Pool Filtering
  ctx.log('info', 'Phase 2: Filtering expert pool');
  const expertFiltering = await ctx.task(expertFilteringTask, { requestAnalysis, expertPool, expertiseProfiles, matchingCriteria, outputDir });
  artifacts.push(...expertFiltering.artifacts);

  // Phase 3: Relevance Scoring
  ctx.log('info', 'Phase 3: Scoring expert relevance');
  const relevanceScoring = await ctx.task(relevanceScoringTask, { requestAnalysis, filteredExperts: expertFiltering.filteredExperts, outputDir });
  artifacts.push(...relevanceScoring.artifacts);

  // Phase 4: Availability Assessment
  ctx.log('info', 'Phase 4: Assessing expert availability');
  const availabilityAssessment = await ctx.task(availabilityAssessmentTask, { scoredExperts: relevanceScoring.scoredExperts, outputDir });
  artifacts.push(...availabilityAssessment.artifacts);

  // Phase 5: Match Ranking
  ctx.log('info', 'Phase 5: Ranking matches');
  const matchRanking = await ctx.task(matchRankingTask, { relevanceScoring, availabilityAssessment, matchingAlgorithm, outputDir });
  artifacts.push(...matchRanking.artifacts);

  // Phase 6: Connection Protocol Design
  ctx.log('info', 'Phase 6: Designing connection protocol');
  const connectionProtocol = await ctx.task(connectionProtocolTask, { matchRanking: matchRanking.rankings, requestAnalysis, outputDir });
  artifacts.push(...connectionProtocol.artifacts);

  // Phase 7: Introduction Templates
  ctx.log('info', 'Phase 7: Creating introduction templates');
  const introductionTemplates = await ctx.task(introductionTemplatesTask, { connectionProtocol: connectionProtocol.protocol, outputDir });
  artifacts.push(...introductionTemplates.artifacts);

  // Phase 8: Feedback Mechanism Design
  ctx.log('info', 'Phase 8: Designing feedback mechanism');
  const feedbackMechanism = await ctx.task(feedbackMechanismTask, { connectionProtocol: connectionProtocol.protocol, outputDir });
  artifacts.push(...feedbackMechanism.artifacts);

  // Phase 9: Quality Assessment
  ctx.log('info', 'Phase 9: Assessing matching quality');
  const qualityAssessment = await ctx.task(qualityAssessmentTask, { requestAnalysis, matchRanking, connectionProtocol, outputDir });
  artifacts.push(...qualityAssessment.artifacts);

  // Phase 10: Stakeholder Review
  let reviewResult = null;
  if (requireApproval) {
    ctx.log('info', 'Phase 10: Conducting stakeholder review');
    reviewResult = await ctx.task(stakeholderReviewTask, { matchResults: matchRanking.rankings, connectionProtocol: connectionProtocol.protocol, qualityScore: qualityAssessment.overallScore, outputDir });
    artifacts.push(...reviewResult.artifacts);
  }

  const endTime = ctx.now();
  return {
    success: true,
    matchingSystem: {
      algorithm: matchingAlgorithm,
      criteria: matchingCriteria
    },
    matchResults: matchRanking.rankings,
    connectionProtocol: connectionProtocol.protocol,
    introductionTemplates: introductionTemplates.templates,
    feedbackMechanism: feedbackMechanism.mechanism,
    statistics: { expertsEvaluated: expertFiltering.filteredExperts.length, matchesFound: matchRanking.rankings.length },
    qualityScore: qualityAssessment.overallScore,
    approved: reviewResult ? reviewResult.approved : true,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'domains/business/knowledge-management/expert-matching', timestamp: startTime, outputDir }
  };
}

// Task Definitions
export const requestAnalysisTask = defineTask('request-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze knowledge request',
  agent: {
    name: 'request-analyst',
    prompt: { role: 'knowledge request analyst', task: 'Analyze the knowledge request', context: args, instructions: ['Extract expertise requirements', 'Identify urgency and scope', 'Save to output directory'], outputFormat: 'JSON with summary (string), expertiseNeeded (array), analysis (object), artifacts' },
    outputSchema: { type: 'object', required: ['summary', 'expertiseNeeded', 'artifacts'], properties: { summary: { type: 'string' }, expertiseNeeded: { type: 'array' }, analysis: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'request', 'analysis']
}));

export const expertFilteringTask = defineTask('expert-filtering', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Filter expert pool',
  agent: {
    name: 'expert-filter',
    prompt: { role: 'expert filtering specialist', task: 'Filter expert pool by criteria', context: args, instructions: ['Apply matching criteria', 'Shortlist qualified experts', 'Save to output directory'], outputFormat: 'JSON with filteredExperts (array), artifacts' },
    outputSchema: { type: 'object', required: ['filteredExperts', 'artifacts'], properties: { filteredExperts: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'expert', 'filtering']
}));

export const relevanceScoringTask = defineTask('relevance-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score expert relevance',
  agent: {
    name: 'relevance-scorer',
    prompt: { role: 'relevance scoring specialist', task: 'Score expert relevance to request', context: args, instructions: ['Calculate expertise match scores', 'Consider experience depth', 'Save to output directory'], outputFormat: 'JSON with scoredExperts (array), artifacts' },
    outputSchema: { type: 'object', required: ['scoredExperts', 'artifacts'], properties: { scoredExperts: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'relevance', 'scoring']
}));

export const availabilityAssessmentTask = defineTask('availability-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess expert availability',
  agent: {
    name: 'availability-assessor',
    prompt: { role: 'availability assessment specialist', task: 'Assess expert availability', context: args, instructions: ['Check current workload', 'Assess response likelihood', 'Save to output directory'], outputFormat: 'JSON with availableExperts (array), artifacts' },
    outputSchema: { type: 'object', required: ['availableExperts', 'artifacts'], properties: { availableExperts: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'availability', 'assessment']
}));

export const matchRankingTask = defineTask('match-ranking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Rank matches',
  agent: {
    name: 'match-ranker',
    prompt: { role: 'match ranking specialist', task: 'Rank expert matches', context: args, instructions: ['Combine relevance and availability', 'Produce ranked list', 'Save to output directory'], outputFormat: 'JSON with rankings (array), artifacts' },
    outputSchema: { type: 'object', required: ['rankings', 'artifacts'], properties: { rankings: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'match', 'ranking']
}));

export const connectionProtocolTask = defineTask('connection-protocol', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design connection protocol',
  agent: {
    name: 'protocol-designer',
    prompt: { role: 'connection protocol designer', task: 'Design expert connection protocol', context: args, instructions: ['Define introduction process', 'Create engagement guidelines', 'Save to output directory'], outputFormat: 'JSON with protocol (object), artifacts' },
    outputSchema: { type: 'object', required: ['protocol', 'artifacts'], properties: { protocol: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'connection', 'protocol']
}));

export const introductionTemplatesTask = defineTask('introduction-templates', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create introduction templates',
  agent: {
    name: 'template-creator',
    prompt: { role: 'introduction template creator', task: 'Create introduction templates', context: args, instructions: ['Design request introduction', 'Create expert invitation template', 'Save to output directory'], outputFormat: 'JSON with templates (array), artifacts' },
    outputSchema: { type: 'object', required: ['templates', 'artifacts'], properties: { templates: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'introduction', 'templates']
}));

export const feedbackMechanismTask = defineTask('feedback-mechanism', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design feedback mechanism',
  agent: {
    name: 'feedback-designer',
    prompt: { role: 'feedback mechanism designer', task: 'Design feedback mechanism', context: args, instructions: ['Create post-interaction survey', 'Define quality metrics', 'Save to output directory'], outputFormat: 'JSON with mechanism (object), artifacts' },
    outputSchema: { type: 'object', required: ['mechanism', 'artifacts'], properties: { mechanism: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'feedback', 'mechanism']
}));

export const qualityAssessmentTask = defineTask('quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess matching quality',
  agent: {
    name: 'quality-assessor',
    prompt: { role: 'quality assessor', task: 'Assess matching quality', context: args, instructions: ['Evaluate match quality', 'Save to output directory'], outputFormat: 'JSON with overallScore (number 0-100), artifacts' },
    outputSchema: { type: 'object', required: ['overallScore', 'artifacts'], properties: { overallScore: { type: 'number', minimum: 0, maximum: 100 }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'quality', 'assessment']
}));

export const stakeholderReviewTask = defineTask('stakeholder-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct stakeholder review',
  agent: {
    name: 'project-manager',
    prompt: { role: 'project manager', task: 'Coordinate stakeholder review', context: args, instructions: ['Present matches for approval', 'Save to output directory'], outputFormat: 'JSON with approved (boolean), stakeholders (array), artifacts' },
    outputSchema: { type: 'object', required: ['approved', 'stakeholders', 'artifacts'], properties: { approved: { type: 'boolean' }, stakeholders: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'knowledge-management', 'stakeholder-review', 'approval']
}));
