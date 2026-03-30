/**
 * @process specializations/game-development/playtesting-user-research
 * @description Playtesting and User Research Process - Conduct structured playtesting sessions and gather
 * player feedback through qualitative and quantitative research methods.
 * @inputs { projectName: string, testingPhase?: string, participantCount?: number, outputDir?: string }
 * @outputs { success: boolean, researchReport: string, findings: array, recommendations: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    testingPhase = 'alpha',
    participantCount = 20,
    testType = 'moderated',
    metricsEnabled = true,
    outputDir = 'playtesting-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Playtesting and User Research: ${projectName}`);

  // Phase 1: Research Planning
  const planning = await ctx.task(researchPlanningTask, { projectName, testingPhase, participantCount, testType, outputDir });
  artifacts.push(...planning.artifacts);

  // Phase 2: Participant Recruitment
  const recruitment = await ctx.task(participantRecruitmentTask, { projectName, participantCount, planning, outputDir });
  artifacts.push(...recruitment.artifacts);

  // Phase 3: Test Build Preparation
  const testBuild = await ctx.task(testBuildPrepTask, { projectName, testingPhase, outputDir });
  artifacts.push(...testBuild.artifacts);

  // Phase 4: Playtest Session Execution
  const sessions = await ctx.task(playtestSessionsTask, { projectName, recruitment, testType, outputDir });
  artifacts.push(...sessions.artifacts);

  // Phase 5: Metrics Collection
  if (metricsEnabled) {
    const metrics = await ctx.task(metricsCollectionTask, { projectName, sessions, outputDir });
    artifacts.push(...metrics.artifacts);
  }

  // Phase 6: Qualitative Analysis
  const qualitative = await ctx.task(qualitativeAnalysisTask, { projectName, sessions, outputDir });
  artifacts.push(...qualitative.artifacts);

  // Phase 7: Quantitative Analysis
  const quantitative = await ctx.task(quantitativeAnalysisTask, { projectName, sessions, outputDir });
  artifacts.push(...quantitative.artifacts);

  // Phase 8: Research Synthesis
  const synthesis = await ctx.task(researchSynthesisTask, { projectName, qualitative, quantitative, outputDir });
  artifacts.push(...synthesis.artifacts);

  await ctx.breakpoint({
    question: `Playtesting complete for ${projectName}. ${sessions.sessionCount} sessions. ${synthesis.findingCount} findings. ${synthesis.recommendationCount} recommendations. Review?`,
    title: 'Playtesting Research Review',
    context: { runId: ctx.runId, sessions, qualitative, quantitative, synthesis }
  });

  return {
    success: true,
    projectName,
    researchReport: synthesis.reportPath,
    findings: synthesis.findings,
    recommendations: synthesis.recommendations,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/game-development/playtesting-user-research', timestamp: startTime, outputDir }
  };
}

export const researchPlanningTask = defineTask('research-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Research Planning - ${args.projectName}`,
  agent: {
    name: 'playtest-coordinator-agent',
    prompt: { role: 'UX Researcher', task: 'Plan playtesting research', context: args, instructions: ['1. Define research goals', '2. Create hypotheses', '3. Design test scenarios', '4. Create research protocol'] },
    outputSchema: { type: 'object', required: ['researchPlan', 'hypotheses', 'artifacts'], properties: { researchPlan: { type: 'object' }, hypotheses: { type: 'array' }, scenarios: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'playtesting', 'planning']
}));

export const participantRecruitmentTask = defineTask('participant-recruitment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Participant Recruitment - ${args.projectName}`,
  agent: {
    name: 'playtest-coordinator-agent',
    prompt: { role: 'UX Researcher', task: 'Recruit playtest participants', context: args, instructions: ['1. Define target demographics', '2. Create screening criteria', '3. Recruit participants', '4. Schedule sessions'] },
    outputSchema: { type: 'object', required: ['participantsRecruited', 'demographics', 'artifacts'], properties: { participantsRecruited: { type: 'number' }, demographics: { type: 'object' }, schedule: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'playtesting', 'recruitment']
}));

export const testBuildPrepTask = defineTask('test-build-prep', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test Build Preparation - ${args.projectName}`,
  agent: {
    name: 'build-engineer-agent',
    prompt: { role: 'Build Engineer', task: 'Prepare playtest build', context: args, instructions: ['1. Create stable test build', '2. Add telemetry hooks', '3. Disable debug features', '4. Test build stability'] },
    outputSchema: { type: 'object', required: ['buildReady', 'buildVersion', 'artifacts'], properties: { buildReady: { type: 'boolean' }, buildVersion: { type: 'string' }, telemetryEnabled: { type: 'boolean' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'playtesting', 'build']
}));

export const playtestSessionsTask = defineTask('playtest-sessions', (args, taskCtx) => ({
  kind: 'agent',
  title: `Playtest Sessions - ${args.projectName}`,
  agent: {
    name: 'playtest-coordinator-agent',
    prompt: { role: 'UX Researcher', task: 'Conduct playtest sessions', context: args, instructions: ['1. Run moderated sessions', '2. Use think-aloud protocol', '3. Observe player behavior', '4. Record sessions'] },
    outputSchema: { type: 'object', required: ['sessionCount', 'observations', 'artifacts'], properties: { sessionCount: { type: 'number' }, observations: { type: 'array' }, recordings: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'playtesting', 'sessions']
}));

export const metricsCollectionTask = defineTask('metrics-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Metrics Collection - ${args.projectName}`,
  agent: {
    name: 'analytics-engineer-agent',
    prompt: { role: 'Data Analyst', task: 'Collect playtest metrics', context: args, instructions: ['1. Gather telemetry data', '2. Track completion rates', '3. Measure time metrics', '4. Compile metrics report'] },
    outputSchema: { type: 'object', required: ['metrics', 'completionRates', 'artifacts'], properties: { metrics: { type: 'object' }, completionRates: { type: 'object' }, timeMetrics: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'playtesting', 'metrics']
}));

export const qualitativeAnalysisTask = defineTask('qualitative-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Qualitative Analysis - ${args.projectName}`,
  agent: {
    name: 'playtest-coordinator-agent',
    prompt: { role: 'UX Researcher', task: 'Analyze qualitative data', context: args, instructions: ['1. Code observations', '2. Identify themes', '3. Analyze feedback', '4. Create affinity diagram'] },
    outputSchema: { type: 'object', required: ['themes', 'insights', 'artifacts'], properties: { themes: { type: 'array' }, insights: { type: 'array' }, painPoints: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'playtesting', 'qualitative']
}));

export const quantitativeAnalysisTask = defineTask('quantitative-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Quantitative Analysis - ${args.projectName}`,
  agent: {
    name: 'analytics-engineer-agent',
    prompt: { role: 'Data Analyst', task: 'Analyze quantitative data', context: args, instructions: ['1. Calculate statistics', '2. Identify patterns', '3. Create visualizations', '4. Statistical significance tests'] },
    outputSchema: { type: 'object', required: ['statistics', 'patterns', 'artifacts'], properties: { statistics: { type: 'object' }, patterns: { type: 'array' }, visualizations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'playtesting', 'quantitative']
}));

export const researchSynthesisTask = defineTask('research-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Research Synthesis - ${args.projectName}`,
  agent: {
    name: 'playtest-coordinator-agent',
    prompt: { role: 'UX Researcher', task: 'Synthesize research findings', context: args, instructions: ['1. Combine qual and quant', '2. Prioritize findings', '3. Create recommendations', '4. Write research report'] },
    outputSchema: { type: 'object', required: ['reportPath', 'findings', 'recommendations', 'findingCount', 'recommendationCount', 'artifacts'], properties: { reportPath: { type: 'string' }, findings: { type: 'array' }, recommendations: { type: 'array' }, findingCount: { type: 'number' }, recommendationCount: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'playtesting', 'synthesis']
}));
