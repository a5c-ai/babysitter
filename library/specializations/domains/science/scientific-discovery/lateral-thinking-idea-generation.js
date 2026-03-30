/**
 * @process domains/science/scientific-discovery/lateral-thinking-idea-generation
 * @description Divergent thinking to generate novel solutions - Guides practitioners through lateral thinking
 * techniques to break conventional thought patterns and generate creative, non-obvious solutions to problems.
 * @inputs { problem: string, constraints?: array, domain: string, existingSolutions?: array }
 * @outputs { success: boolean, ideas: array, novelIdeas: array, combinedConcepts: array, evaluation: object }
 *
 * @example
 * const result = await orchestrate('domains/science/scientific-discovery/lateral-thinking-idea-generation', {
 *   problem: 'Reduce traffic congestion in urban areas',
 *   domain: 'urban-planning',
 *   existingSolutions: ['traffic lights', 'public transit', 'carpooling']
 * });
 *
 * @references
 * - de Bono, E. (1970). Lateral Thinking: Creativity Step by Step
 * - de Bono, E. (1985). Six Thinking Hats
 * - Michalko, M. (2006). Thinkertoys
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    problem,
    constraints = [],
    domain = 'general',
    existingSolutions = [],
    outputDir = 'lateral-thinking-output',
    minimumNoveltyScore = 70
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Lateral Thinking for: ${problem}`);

  // Phase 1-9 implementation following the pattern
  // Each phase uses specific lateral thinking techniques

  const problemReframing = await ctx.task(problemReframingTask, { problem, domain, outputDir });
  artifacts.push(...problemReframing.artifacts);

  const assumptionChallenging = await ctx.task(assumptionChallengingTask, { problem, problemReframing, existingSolutions, outputDir });
  artifacts.push(...assumptionChallenging.artifacts);

  const randomEntryTechnique = await ctx.task(randomEntryTask, { problem, domain, outputDir });
  artifacts.push(...randomEntryTechnique.artifacts);

  await ctx.breakpoint({
    question: `Assumptions challenged and random entry complete. ${assumptionChallenging.challengedAssumptions?.length || 0} assumptions challenged. Continue with provocation techniques?`,
    title: 'Lateral Thinking Progress Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })), summary: { problem, assumptionsChallenged: assumptionChallenging.challengedAssumptions?.length || 0 }}
  });

  const provocationTechnique = await ctx.task(provocationTask, { problem, assumptionChallenging, outputDir });
  artifacts.push(...provocationTechnique.artifacts);

  const analogicalThinking = await ctx.task(analogicalThinkingTask, { problem, domain, outputDir });
  artifacts.push(...analogicalThinking.artifacts);

  const reverseThinking = await ctx.task(reverseThinkingTask, { problem, existingSolutions, outputDir });
  artifacts.push(...reverseThinking.artifacts);

  const ideaSynthesis = await ctx.task(ideaSynthesisTask, { problem, randomEntryTechnique, provocationTechnique, analogicalThinking, reverseThinking, outputDir });
  artifacts.push(...ideaSynthesis.artifacts);

  const noveltyEvaluation = await ctx.task(noveltyEvaluationTask, { ideas: ideaSynthesis.ideas, existingSolutions, minimumNoveltyScore, outputDir });
  artifacts.push(...noveltyEvaluation.artifacts);

  const qualityScore = await ctx.task(lateralThinkingQualityScoringTask, { problemReframing, assumptionChallenging, ideaSynthesis, noveltyEvaluation, outputDir });
  artifacts.push(...qualityScore.artifacts);

  await ctx.breakpoint({
    question: `Lateral thinking complete. ${ideaSynthesis.ideas?.length || 0} ideas generated, ${noveltyEvaluation.novelIdeas?.length || 0} novel. Quality: ${qualityScore.overallScore}/100. Approve?`,
    title: 'Lateral Thinking Approval',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })), summary: { ideasGenerated: ideaSynthesis.ideas?.length || 0, novelIdeas: noveltyEvaluation.novelIdeas?.length || 0, qualityScore: qualityScore.overallScore }}
  });

  return {
    success: true,
    problem,
    ideas: ideaSynthesis.ideas,
    novelIdeas: noveltyEvaluation.novelIdeas,
    combinedConcepts: ideaSynthesis.combinedConcepts,
    evaluation: { noveltyScore: noveltyEvaluation.averageNoveltyScore, topIdeas: noveltyEvaluation.topIdeas },
    qualityScore: { overall: qualityScore.overallScore },
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'domains/science/scientific-discovery/lateral-thinking-idea-generation', timestamp: startTime, outputDir }
  };
}

export const problemReframingTask = defineTask('problem-reframing', (args, taskCtx) => ({
  kind: 'agent', title: 'Reframe the problem',
  agent: { name: 'innovation-facilitator', skills: ['hypothesis-generator', 'analogy-mapper', 'triz-inventive-solver'], prompt: { role: 'Creative problem solver', task: 'Reframe the problem from multiple perspectives', context: args, instructions: ['Restate problem in multiple ways', 'Change problem perspective', 'Abstract the problem', 'Reverse the problem', 'Chunk up/down', 'Find analogous problems'], outputFormat: 'JSON with reframings, perspectives, abstractedProblem, reversedProblem, artifacts' }, outputSchema: { type: 'object', required: ['reframings', 'artifacts'], properties: { reframings: { type: 'array', items: { type: 'string' } }, perspectives: { type: 'array' }, abstractedProblem: { type: 'string' }, reversedProblem: { type: 'string' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'lateral-thinking']
}));

export const assumptionChallengingTask = defineTask('assumption-challenging', (args, taskCtx) => ({
  kind: 'agent', title: 'Challenge assumptions',
  agent: { name: 'innovation-facilitator', skills: ['hypothesis-generator', 'analogy-mapper', 'triz-inventive-solver'], prompt: { role: 'Assumption challenger', task: 'Identify and challenge hidden assumptions', context: args, instructions: ['List all assumptions about the problem', 'Question each assumption', 'Reverse assumptions', 'Find counter-examples', 'Explore what-if scenarios'], outputFormat: 'JSON with assumptions, challengedAssumptions, reversedAssumptions, whatIfScenarios, artifacts' }, outputSchema: { type: 'object', required: ['challengedAssumptions', 'artifacts'], properties: { assumptions: { type: 'array', items: { type: 'string' } }, challengedAssumptions: { type: 'array' }, reversedAssumptions: { type: 'array' }, whatIfScenarios: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'lateral-thinking']
}));

export const randomEntryTask = defineTask('random-entry', (args, taskCtx) => ({
  kind: 'agent', title: 'Apply random entry technique',
  agent: { name: 'innovation-facilitator', skills: ['hypothesis-generator', 'analogy-mapper', 'triz-inventive-solver'], prompt: { role: 'Random association specialist', task: 'Use random stimuli to generate new ideas', context: args, instructions: ['Select random words/images', 'Force connections to problem', 'Extract attributes from random elements', 'Apply attributes to problem', 'Generate ideas from connections'], outputFormat: 'JSON with randomStimuli, connections, ideas, artifacts' }, outputSchema: { type: 'object', required: ['ideas', 'artifacts'], properties: { randomStimuli: { type: 'array', items: { type: 'string' } }, connections: { type: 'array' }, ideas: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'lateral-thinking']
}));

export const provocationTask = defineTask('provocation', (args, taskCtx) => ({
  kind: 'agent', title: 'Apply provocation technique',
  agent: { name: 'innovation-facilitator', skills: ['hypothesis-generator', 'analogy-mapper', 'triz-inventive-solver'], prompt: { role: 'Provocation specialist', task: 'Use provocative statements to break patterns', context: args, instructions: ['Create PO (provocative operation) statements', 'Escape current thinking patterns', 'Use stepping stone method', 'Extract useful concepts', 'Generate movement ideas'], outputFormat: 'JSON with provocations, movements, ideas, artifacts' }, outputSchema: { type: 'object', required: ['ideas', 'artifacts'], properties: { provocations: { type: 'array', items: { type: 'string' } }, movements: { type: 'array' }, ideas: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'lateral-thinking']
}));

export const analogicalThinkingTask = defineTask('analogical-thinking', (args, taskCtx) => ({
  kind: 'agent', title: 'Apply analogical thinking',
  agent: { name: 'innovation-facilitator', skills: ['hypothesis-generator', 'analogy-mapper', 'triz-inventive-solver'], prompt: { role: 'Analogical reasoning specialist', task: 'Find analogies from other domains', context: args, instructions: ['Identify analogous situations in nature', 'Find analogies in other industries', 'Extract principles from analogies', 'Transfer solutions across domains', 'Generate analogy-inspired ideas'], outputFormat: 'JSON with analogies, principles, transferredSolutions, ideas, artifacts' }, outputSchema: { type: 'object', required: ['ideas', 'artifacts'], properties: { analogies: { type: 'array' }, principles: { type: 'array', items: { type: 'string' } }, transferredSolutions: { type: 'array' }, ideas: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'lateral-thinking']
}));

export const reverseThinkingTask = defineTask('reverse-thinking', (args, taskCtx) => ({
  kind: 'agent', title: 'Apply reverse thinking',
  agent: { name: 'innovation-facilitator', skills: ['hypothesis-generator', 'analogy-mapper', 'triz-inventive-solver'], prompt: { role: 'Reverse thinking specialist', task: 'Think in reverse to find new solutions', context: args, instructions: ['Define opposite of desired outcome', 'Brainstorm how to achieve opposite', 'Reverse the reverse ideas', 'Find insights from reversals', 'Generate contrarian ideas'], outputFormat: 'JSON with reverseGoal, reverseIdeas, reversedReverseIdeas, insights, ideas, artifacts' }, outputSchema: { type: 'object', required: ['ideas', 'artifacts'], properties: { reverseGoal: { type: 'string' }, reverseIdeas: { type: 'array' }, reversedReverseIdeas: { type: 'array' }, insights: { type: 'array', items: { type: 'string' } }, ideas: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'lateral-thinking']
}));

export const ideaSynthesisTask = defineTask('idea-synthesis', (args, taskCtx) => ({
  kind: 'agent', title: 'Synthesize ideas',
  agent: { name: 'innovation-facilitator', skills: ['hypothesis-generator', 'analogy-mapper', 'triz-inventive-solver'], prompt: { role: 'Idea synthesis specialist', task: 'Combine and refine generated ideas', context: args, instructions: ['Consolidate ideas from all techniques', 'Remove duplicates', 'Combine complementary ideas', 'Refine promising ideas', 'Create hybrid concepts', 'Document all unique ideas'], outputFormat: 'JSON with ideas, combinedConcepts, refinedIdeas, uniqueCount, artifacts' }, outputSchema: { type: 'object', required: ['ideas', 'combinedConcepts', 'artifacts'], properties: { ideas: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, idea: { type: 'string' }, source: { type: 'string' } } } }, combinedConcepts: { type: 'array' }, refinedIdeas: { type: 'array' }, uniqueCount: { type: 'number' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'lateral-thinking']
}));

export const noveltyEvaluationTask = defineTask('novelty-evaluation', (args, taskCtx) => ({
  kind: 'agent', title: 'Evaluate idea novelty',
  agent: { name: 'innovation-facilitator', skills: ['hypothesis-generator', 'analogy-mapper', 'triz-inventive-solver'], prompt: { role: 'Innovation evaluator', task: 'Evaluate novelty and potential of ideas', context: args, instructions: ['Compare each idea to existing solutions', 'Rate novelty (0-100)', 'Rate feasibility', 'Rate potential impact', 'Identify truly novel ideas', 'Rank ideas by promise'], outputFormat: 'JSON with evaluations, novelIdeas, topIdeas, averageNoveltyScore, artifacts' }, outputSchema: { type: 'object', required: ['novelIdeas', 'topIdeas', 'artifacts'], properties: { evaluations: { type: 'array' }, novelIdeas: { type: 'array' }, topIdeas: { type: 'array' }, averageNoveltyScore: { type: 'number' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'lateral-thinking']
}));

export const lateralThinkingQualityScoringTask = defineTask('lateral-quality-scoring', (args, taskCtx) => ({
  kind: 'agent', title: 'Score lateral thinking quality',
  agent: { name: 'innovation-facilitator', skills: ['hypothesis-generator', 'analogy-mapper', 'triz-inventive-solver'], prompt: { role: 'Creative process auditor', task: 'Score the quality of the lateral thinking process', context: args, instructions: ['Score technique application', 'Score idea quantity', 'Score idea novelty', 'Score idea diversity', 'Calculate overall score'], outputFormat: 'JSON with overallScore, techniqueScore, quantityScore, noveltyScore, diversityScore, artifacts' }, outputSchema: { type: 'object', required: ['overallScore', 'artifacts'], properties: { overallScore: { type: 'number' }, techniqueScore: { type: 'number' }, quantityScore: { type: 'number' }, noveltyScore: { type: 'number' }, diversityScore: { type: 'number' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'lateral-thinking']
}));
