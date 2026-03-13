/**
 * @process domains/science/scientific-discovery/system-archetype-analysis
 * @description Identify common system patterns to diagnose systemic issues - Guides practitioners through
 * recognizing and applying system archetypes to understand recurring patterns of behavior in complex systems.
 * @inputs { situation: string, symptoms: array, domain: string }
 * @outputs { success: boolean, archetypes: array, diagnosis: object, interventions: array, leverage: array }
 *
 * @example
 * const result = await orchestrate('domains/science/scientific-discovery/system-archetype-analysis', {
 *   situation: 'Declining product quality despite increased quality inspections',
 *   symptoms: ['More inspections', 'Same defect rate', 'Frustrated workers', 'Rising costs'],
 *   domain: 'manufacturing'
 * });
 *
 * @references
 * - Senge, P. (1990). The Fifth Discipline
 * - Kim, D.H. & Anderson, V. (1998). Systems Archetype Basics
 * - Braun, W. (2002). The System Archetypes
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { situation, symptoms = [], domain, outputDir = 'archetype-output', minimumMatchScore = 70 } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting System Archetype Analysis for: ${situation}`);

  const situationAnalysis = await ctx.task(situationAnalysisTask, { situation, symptoms, domain, outputDir });
  artifacts.push(...situationAnalysis.artifacts);

  const archetypeMatching = await ctx.task(archetypeMatchingTask, { situationAnalysis, symptoms, outputDir });
  artifacts.push(...archetypeMatching.artifacts);

  await ctx.breakpoint({
    question: `Matched ${archetypeMatching.matches?.length || 0} archetypes. Top match: "${archetypeMatching.topMatch?.archetype || 'N/A'}" (${archetypeMatching.topMatch?.score || 0}%). Review matches?`,
    title: 'Archetype Matching Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })), summary: { matches: archetypeMatching.matches?.length || 0, topMatch: archetypeMatching.topMatch?.archetype || 'N/A' }}
  });

  const archetypeMapping = await ctx.task(archetypeMappingTask, { situation, topArchetypes: archetypeMatching.matches?.slice(0, 3), domain, outputDir });
  artifacts.push(...archetypeMapping.artifacts);

  const systemicDiagnosis = await ctx.task(systemicDiagnosisTask, { mapping: archetypeMapping, situation, symptoms, outputDir });
  artifacts.push(...systemicDiagnosis.artifacts);

  const interventionDesign = await ctx.task(archetypeInterventionTask, { diagnosis: systemicDiagnosis, mapping: archetypeMapping, outputDir });
  artifacts.push(...interventionDesign.artifacts);

  const leverageIdentification = await ctx.task(archetypeLeverageTask, { diagnosis: systemicDiagnosis, interventions: interventionDesign.interventions, outputDir });
  artifacts.push(...leverageIdentification.artifacts);

  const qualityScore = await ctx.task(archetypeQualityScoringTask, { situationAnalysis, archetypeMatching, systemicDiagnosis, interventionDesign, outputDir });
  artifacts.push(...qualityScore.artifacts);

  await ctx.breakpoint({
    question: `Archetype analysis complete. ${interventionDesign.interventions?.length || 0} interventions designed. Quality: ${qualityScore.overallScore}/100. Approve?`,
    title: 'Archetype Analysis Approval',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })), summary: { interventions: interventionDesign.interventions?.length || 0, qualityScore: qualityScore.overallScore }}
  });

  return {
    success: true, situation, archetypes: archetypeMatching.matches, diagnosis: systemicDiagnosis,
    interventions: interventionDesign.interventions, leverage: leverageIdentification.leveragePoints,
    qualityScore: { overall: qualityScore.overallScore }, artifacts, duration: ctx.now() - startTime,
    metadata: { processId: 'domains/science/scientific-discovery/system-archetype-analysis', timestamp: startTime, outputDir }
  };
}

export const situationAnalysisTask = defineTask('situation-analysis', (args, taskCtx) => ({
  kind: 'agent', title: 'Analyze the situation',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'systems-thinking-analyst', skills: ['hypothesis-generator', 'causal-inference-engine'], prompt: { role: 'Systems thinking analyst', task: 'Analyze the situation and symptoms', context: args, instructions: ['Describe the problematic behavior over time', 'Identify key variables', 'Document attempted solutions', 'Identify unintended consequences', 'Map stakeholder perspectives'], outputFormat: 'JSON with behaviorOverTime, keyVariables, attemptedSolutions, unintendedConsequences, perspectives, artifacts' }, outputSchema: { type: 'object', required: ['behaviorOverTime', 'keyVariables', 'artifacts'], properties: { behaviorOverTime: { type: 'string' }, keyVariables: { type: 'array' }, attemptedSolutions: { type: 'array' }, unintendedConsequences: { type: 'array' }, perspectives: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'system-archetypes']
}));

export const archetypeMatchingTask = defineTask('archetype-matching', (args, taskCtx) => ({
  kind: 'agent', title: 'Match system archetypes',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'systems-thinking-analyst', skills: ['hypothesis-generator', 'causal-inference-engine'], prompt: { role: 'Archetype recognition specialist', task: 'Match situation to known system archetypes', context: args, instructions: ['Compare to: Limits to Growth, Shifting the Burden, Eroding Goals, Escalation, Success to the Successful, Tragedy of the Commons, Fixes that Fail, Growth and Underinvestment, Accidental Adversaries, Attractiveness Principle', 'Rate match quality for each', 'Identify structural similarities', 'Document matching rationale'], outputFormat: 'JSON with matches, topMatch, matchRationale, artifacts' }, outputSchema: { type: 'object', required: ['matches', 'topMatch', 'artifacts'], properties: { matches: { type: 'array', items: { type: 'object', properties: { archetype: { type: 'string' }, score: { type: 'number' }, rationale: { type: 'string' } } } }, topMatch: { type: 'object' }, matchRationale: { type: 'string' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'system-archetypes']
}));

export const archetypeMappingTask = defineTask('archetype-mapping', (args, taskCtx) => ({
  kind: 'agent', title: 'Map archetype to situation',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'systems-thinking-analyst', skills: ['hypothesis-generator', 'causal-inference-engine'], prompt: { role: 'Archetype mapping specialist', task: 'Map archetype structure to the specific situation', context: args, instructions: ['Map generic archetype variables to situation-specific variables', 'Identify the key loops in the situation', 'Document the mapping', 'Identify any deviations from pure archetype'], outputFormat: 'JSON with variableMapping, loopMapping, deviations, archetypeStructure, artifacts' }, outputSchema: { type: 'object', required: ['variableMapping', 'loopMapping', 'artifacts'], properties: { variableMapping: { type: 'object' }, loopMapping: { type: 'array' }, deviations: { type: 'array' }, archetypeStructure: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'system-archetypes']
}));

export const systemicDiagnosisTask = defineTask('systemic-diagnosis', (args, taskCtx) => ({
  kind: 'agent', title: 'Generate systemic diagnosis',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'systems-thinking-analyst', skills: ['hypothesis-generator', 'causal-inference-engine'], prompt: { role: 'Systemic diagnostician', task: 'Generate diagnosis based on archetype analysis', context: args, instructions: ['Explain the systemic structure driving behavior', 'Identify the fundamental cause (not symptoms)', 'Explain why current solutions fail', 'Predict future behavior if unchanged', 'Document the diagnosis story'], outputFormat: 'JSON with diagnosis, fundamentalCause, whySolutionsFail, prediction, story, artifacts' }, outputSchema: { type: 'object', required: ['diagnosis', 'fundamentalCause', 'artifacts'], properties: { diagnosis: { type: 'string' }, fundamentalCause: { type: 'string' }, whySolutionsFail: { type: 'string' }, prediction: { type: 'string' }, story: { type: 'string' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'system-archetypes']
}));

export const archetypeInterventionTask = defineTask('archetype-intervention', (args, taskCtx) => ({
  kind: 'agent', title: 'Design interventions',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'systems-thinking-analyst', skills: ['hypothesis-generator', 'causal-inference-engine'], prompt: { role: 'Intervention designer', task: 'Design interventions based on archetype patterns', context: args, instructions: ['Apply archetype-specific intervention strategies', 'Focus on structure, not symptoms', 'Consider short-term vs long-term effects', 'Identify potential resistance', 'Design for sustainability'], outputFormat: 'JSON with interventions, strategies, shortTermEffects, longTermEffects, resistance, artifacts' }, outputSchema: { type: 'object', required: ['interventions', 'artifacts'], properties: { interventions: { type: 'array', items: { type: 'object', properties: { intervention: { type: 'string' }, targetLoop: { type: 'string' }, rationale: { type: 'string' }, timeline: { type: 'string' } } } }, strategies: { type: 'array' }, shortTermEffects: { type: 'array' }, longTermEffects: { type: 'array' }, resistance: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'system-archetypes']
}));

export const archetypeLeverageTask = defineTask('archetype-leverage', (args, taskCtx) => ({
  kind: 'agent', title: 'Identify leverage points',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'systems-thinking-analyst', skills: ['hypothesis-generator', 'causal-inference-engine'], prompt: { role: 'Leverage point specialist', task: 'Identify high-leverage intervention points', context: args, instructions: ['Apply archetype-specific leverage knowledge', 'Rank leverage points by effectiveness', 'Consider implementation difficulty', 'Document leverage point rationale'], outputFormat: 'JSON with leveragePoints, rankings, implementationDifficulty, artifacts' }, outputSchema: { type: 'object', required: ['leveragePoints', 'artifacts'], properties: { leveragePoints: { type: 'array', items: { type: 'object', properties: { point: { type: 'string' }, effectiveness: { type: 'string' }, difficulty: { type: 'string' }, rationale: { type: 'string' } } } }, rankings: { type: 'array' }, implementationDifficulty: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'system-archetypes']
}));

export const archetypeQualityScoringTask = defineTask('archetype-quality-scoring', (args, taskCtx) => ({
  kind: 'agent', title: 'Score archetype analysis quality',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'systems-thinking-analyst', skills: ['hypothesis-generator', 'causal-inference-engine'], prompt: { role: 'Archetype analysis auditor', task: 'Score the quality of the archetype analysis', context: args, instructions: ['Score situation analysis', 'Score archetype matching', 'Score diagnosis quality', 'Score intervention design', 'Calculate overall score'], outputFormat: 'JSON with overallScore, situationScore, matchingScore, diagnosisScore, interventionScore, artifacts' }, outputSchema: { type: 'object', required: ['overallScore', 'artifacts'], properties: { overallScore: { type: 'number' }, situationScore: { type: 'number' }, matchingScore: { type: 'number' }, diagnosisScore: { type: 'number' }, interventionScore: { type: 'number' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'system-archetypes']
}));
