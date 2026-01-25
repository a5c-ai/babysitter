/**
 * @process domains/science/scientific-discovery/premortem-red-team-analysis
 * @description Anticipate failure modes through adversarial thinking - Guides teams through premortem and
 * red team analysis to identify potential failures before they occur by imagining future failure scenarios.
 * @inputs { plan: object, assumptions: array, stakeholders?: array, adversaries?: array }
 * @outputs { success: boolean, failureScenarios: array, vulnerabilities: array, mitigations: array, improvedPlan: object }
 *
 * @example
 * const result = await orchestrate('domains/science/scientific-discovery/premortem-red-team-analysis', {
 *   plan: { name: 'Product Launch', timeline: '6 months', budget: '$2M' },
 *   assumptions: ['Market demand exists', 'Team can deliver on time', 'Competitors won\'t react'],
 *   adversaries: ['Competitor A', 'Regulatory changes']
 * });
 *
 * @references
 * - Klein, G. (2007). Performing a Project Premortem. Harvard Business Review
 * - Zenko, M. (2015). Red Team: How to Succeed by Thinking Like the Enemy
 * - Kahneman, D. (2011). Thinking, Fast and Slow
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { plan, assumptions = [], stakeholders = [], adversaries = [], outputDir = 'premortem-output', minimumMitigationCoverage = 80 } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Premortem/Red Team Analysis for: ${plan.name || 'Plan'}`);

  const planAnalysis = await ctx.task(planAnalysisTask, { plan, assumptions, outputDir });
  artifacts.push(...planAnalysis.artifacts);

  const preMortemImagining = await ctx.task(preMortemImaginingTask, { plan, assumptions, planAnalysis, outputDir });
  artifacts.push(...preMortemImagining.artifacts);

  const redTeamAttack = await ctx.task(redTeamAttackTask, { plan, adversaries, assumptions, outputDir });
  artifacts.push(...redTeamAttack.artifacts);

  await ctx.breakpoint({
    question: `Identified ${preMortemImagining.failureScenarios?.length || 0} premortem scenarios and ${redTeamAttack.attacks?.length || 0} red team attacks. Review before vulnerability analysis?`,
    title: 'Premortem/Red Team Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })), summary: { preMortemScenarios: preMortemImagining.failureScenarios?.length || 0, redTeamAttacks: redTeamAttack.attacks?.length || 0 }}
  });

  const vulnerabilityAnalysis = await ctx.task(vulnerabilityAnalysisTask, { preMortem: preMortemImagining, redTeam: redTeamAttack, plan, outputDir });
  artifacts.push(...vulnerabilityAnalysis.artifacts);

  const mitigationDevelopment = await ctx.task(preMortemMitigationTask, { vulnerabilities: vulnerabilityAnalysis.vulnerabilities, plan, outputDir });
  artifacts.push(...mitigationDevelopment.artifacts);

  const planImprovement = await ctx.task(planImprovementTask, { plan, mitigations: mitigationDevelopment.mitigations, vulnerabilities: vulnerabilityAnalysis.vulnerabilities, outputDir });
  artifacts.push(...planImprovement.artifacts);

  const qualityScore = await ctx.task(preMortemQualityScoringTask, { preMortemImagining, redTeamAttack, vulnerabilityAnalysis, mitigationDevelopment, minimumMitigationCoverage, outputDir });
  artifacts.push(...qualityScore.artifacts);

  await ctx.breakpoint({
    question: `Analysis complete. ${vulnerabilityAnalysis.vulnerabilities?.length || 0} vulnerabilities, ${mitigationDevelopment.mitigations?.length || 0} mitigations. Quality: ${qualityScore.overallScore}/100. Approve?`,
    title: 'Premortem Analysis Approval',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })), summary: { vulnerabilities: vulnerabilityAnalysis.vulnerabilities?.length || 0, mitigations: mitigationDevelopment.mitigations?.length || 0, qualityScore: qualityScore.overallScore }}
  });

  return {
    success: true, plan: plan.name, failureScenarios: preMortemImagining.failureScenarios,
    vulnerabilities: vulnerabilityAnalysis.vulnerabilities, mitigations: mitigationDevelopment.mitigations,
    improvedPlan: planImprovement.improvedPlan, qualityScore: { overall: qualityScore.overallScore },
    artifacts, duration: ctx.now() - startTime,
    metadata: { processId: 'domains/science/scientific-discovery/premortem-red-team-analysis', timestamp: startTime, outputDir }
  };
}

export const planAnalysisTask = defineTask('plan-analysis', (args, taskCtx) => ({
  kind: 'agent', title: 'Analyze the plan',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'risk-analyst', skills: ['hypothesis-generator', 'root-cause-analyzer'], prompt: { role: 'Strategic analyst', task: 'Analyze the plan structure and assumptions', context: args, instructions: ['Document plan objectives', 'List key milestones', 'Identify critical dependencies', 'List explicit assumptions', 'Identify implicit assumptions'], outputFormat: 'JSON with objectives, milestones, dependencies, explicitAssumptions, implicitAssumptions, artifacts' }, outputSchema: { type: 'object', required: ['objectives', 'dependencies', 'artifacts'], properties: { objectives: { type: 'array' }, milestones: { type: 'array' }, dependencies: { type: 'array' }, explicitAssumptions: { type: 'array' }, implicitAssumptions: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'premortem']
}));

export const preMortemImaginingTask = defineTask('premortem-imagining', (args, taskCtx) => ({
  kind: 'agent', title: 'Imagine future failures',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'risk-analyst', skills: ['hypothesis-generator', 'root-cause-analyzer'], prompt: { role: 'Premortem facilitator', task: 'Imagine the plan has failed and generate reasons why', context: args, instructions: ['Assume the plan has completely failed', 'Generate plausible reasons for failure', 'Consider internal factors', 'Consider external factors', 'Be creative and thorough', 'No idea is too unlikely'], outputFormat: 'JSON with failureScenarios, internalFactors, externalFactors, unlikelyButPossible, artifacts' }, outputSchema: { type: 'object', required: ['failureScenarios', 'artifacts'], properties: { failureScenarios: { type: 'array', items: { type: 'object', properties: { scenario: { type: 'string' }, cause: { type: 'string' }, likelihood: { type: 'string' }, impact: { type: 'string' } } } }, internalFactors: { type: 'array' }, externalFactors: { type: 'array' }, unlikelyButPossible: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'premortem']
}));

export const redTeamAttackTask = defineTask('red-team-attack', (args, taskCtx) => ({
  kind: 'agent', title: 'Conduct red team attacks',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'risk-analyst', skills: ['hypothesis-generator', 'root-cause-analyzer'], prompt: { role: 'Red team leader', task: 'Attack the plan as an adversary would', context: args, instructions: ['Think like each adversary', 'Identify attack vectors', 'Find plan weaknesses to exploit', 'Consider competitive responses', 'Design attack scenarios', 'Identify information adversaries might have'], outputFormat: 'JSON with attacks, attackVectors, weaknesses, competitiveResponses, artifacts' }, outputSchema: { type: 'object', required: ['attacks', 'artifacts'], properties: { attacks: { type: 'array', items: { type: 'object', properties: { adversary: { type: 'string' }, attack: { type: 'string' }, vector: { type: 'string' }, likelihood: { type: 'string' } } } }, attackVectors: { type: 'array' }, weaknesses: { type: 'array' }, competitiveResponses: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'red-team']
}));

export const vulnerabilityAnalysisTask = defineTask('vulnerability-analysis', (args, taskCtx) => ({
  kind: 'agent', title: 'Analyze vulnerabilities',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'risk-analyst', skills: ['hypothesis-generator', 'root-cause-analyzer'], prompt: { role: 'Vulnerability analyst', task: 'Synthesize and prioritize vulnerabilities', context: args, instructions: ['Consolidate failure scenarios and attacks', 'Identify common vulnerabilities', 'Assess likelihood and impact', 'Prioritize by risk', 'Map to plan elements'], outputFormat: 'JSON with vulnerabilities, prioritization, riskMatrix, mappings, artifacts' }, outputSchema: { type: 'object', required: ['vulnerabilities', 'prioritization', 'artifacts'], properties: { vulnerabilities: { type: 'array', items: { type: 'object', properties: { vulnerability: { type: 'string' }, source: { type: 'string' }, likelihood: { type: 'string' }, impact: { type: 'string' }, priority: { type: 'number' } } } }, prioritization: { type: 'array' }, riskMatrix: { type: 'object' }, mappings: { type: 'object' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'vulnerability']
}));

export const preMortemMitigationTask = defineTask('premortem-mitigation', (args, taskCtx) => ({
  kind: 'agent', title: 'Develop mitigations',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'risk-analyst', skills: ['hypothesis-generator', 'root-cause-analyzer'], prompt: { role: 'Risk mitigation specialist', task: 'Develop mitigations for identified vulnerabilities', context: args, instructions: ['Develop mitigation for each high-priority vulnerability', 'Consider prevention and contingency', 'Estimate mitigation cost/effort', 'Assess residual risk', 'Prioritize mitigations'], outputFormat: 'JSON with mitigations, preventionMeasures, contingencies, costs, residualRisks, artifacts' }, outputSchema: { type: 'object', required: ['mitigations', 'artifacts'], properties: { mitigations: { type: 'array', items: { type: 'object', properties: { vulnerability: { type: 'string' }, mitigation: { type: 'string' }, type: { type: 'string' }, cost: { type: 'string' }, residualRisk: { type: 'string' } } } }, preventionMeasures: { type: 'array' }, contingencies: { type: 'array' }, costs: { type: 'object' }, residualRisks: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'mitigation']
}));

export const planImprovementTask = defineTask('plan-improvement', (args, taskCtx) => ({
  kind: 'agent', title: 'Improve the plan',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'risk-analyst', skills: ['hypothesis-generator', 'root-cause-analyzer'], prompt: { role: 'Plan improvement specialist', task: 'Integrate mitigations into improved plan', context: args, instructions: ['Integrate mitigations into plan', 'Adjust timelines as needed', 'Add monitoring checkpoints', 'Create contingency triggers', 'Document plan changes'], outputFormat: 'JSON with improvedPlan, changes, checkpoints, triggers, documentation, artifacts' }, outputSchema: { type: 'object', required: ['improvedPlan', 'changes', 'artifacts'], properties: { improvedPlan: { type: 'object' }, changes: { type: 'array' }, checkpoints: { type: 'array' }, triggers: { type: 'array' }, documentation: { type: 'string' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'plan-improvement']
}));

export const preMortemQualityScoringTask = defineTask('premortem-quality-scoring', (args, taskCtx) => ({
  kind: 'agent', title: 'Score analysis quality',
  skill: { name: 'hypothesis-generator' },
  agent: { name: 'risk-analyst', skills: ['hypothesis-generator', 'root-cause-analyzer'], prompt: { role: 'Premortem quality auditor', task: 'Score the quality of the premortem/red team analysis', context: args, instructions: ['Score premortem thoroughness', 'Score red team creativity', 'Score vulnerability coverage', 'Score mitigation adequacy', 'Calculate overall score'], outputFormat: 'JSON with overallScore, preMortemScore, redTeamScore, vulnerabilityScore, mitigationScore, artifacts' }, outputSchema: { type: 'object', required: ['overallScore', 'artifacts'], properties: { overallScore: { type: 'number' }, preMortemScore: { type: 'number' }, redTeamScore: { type: 'number' }, vulnerabilityScore: { type: 'number' }, mitigationScore: { type: 'number' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'quality-scoring']
}));
