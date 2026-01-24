/**
 * @process business-strategy/business-process-reengineering
 * @description Fundamental rethinking and radical redesign of business processes to achieve dramatic improvements in performance
 * @inputs { processScope: string, organizationContext: object, performanceTargets: object, outputDir: string }
 * @outputs { success: boolean, currentStateAnalysis: object, redesignedProcess: object, implementationPlan: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    processScope = '',
    organizationContext = {},
    performanceTargets = {},
    outputDir = 'bpr-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Business Process Reengineering Process');

  // Phase 1: Strategic Vision and Objectives
  ctx.log('info', 'Phase 1: Defining strategic vision');
  const strategicVision = await ctx.task(strategicVisionTask, { processScope, performanceTargets, organizationContext, outputDir });
  artifacts.push(...strategicVision.artifacts);

  // Phase 2: Current Process Analysis
  ctx.log('info', 'Phase 2: Analyzing current process');
  const currentAnalysis = await ctx.task(currentProcessAnalysisTask, { processScope, outputDir });
  artifacts.push(...currentAnalysis.artifacts);

  // Phase 3: Benchmarking
  ctx.log('info', 'Phase 3: Benchmarking best practices');
  const benchmarking = await ctx.task(benchmarkingTask, { processScope, currentAnalysis, outputDir });
  artifacts.push(...benchmarking.artifacts);

  // Phase 4: Clean Sheet Redesign
  ctx.log('info', 'Phase 4: Redesigning process from clean sheet');
  const processRedesign = await ctx.task(cleanSheetRedesignTask, { strategicVision, currentAnalysis, benchmarking, outputDir });
  artifacts.push(...processRedesign.artifacts);

  // Phase 5: Technology Enablement
  ctx.log('info', 'Phase 5: Identifying technology enablers');
  const technologyEnablement = await ctx.task(technologyEnablementTask, { processRedesign, outputDir });
  artifacts.push(...technologyEnablement.artifacts);

  // Phase 6: Organizational Impact Assessment
  ctx.log('info', 'Phase 6: Assessing organizational impact');
  const orgImpact = await ctx.task(organizationalImpactTask, { processRedesign, organizationContext, outputDir });
  artifacts.push(...orgImpact.artifacts);

  // Phase 7: Implementation Planning
  ctx.log('info', 'Phase 7: Planning implementation');
  const implementation = await ctx.task(implementationPlanningTask, { processRedesign, technologyEnablement, orgImpact, outputDir });
  artifacts.push(...implementation.artifacts);

  // Phase 8: Generate Report
  ctx.log('info', 'Phase 8: Generating BPR report');
  const bprReport = await ctx.task(bprReportTask, { strategicVision, currentAnalysis, processRedesign, implementation, outputDir });
  artifacts.push(...bprReport.artifacts);

  const endTime = ctx.now();

  return {
    success: true,
    currentStateAnalysis: currentAnalysis.analysis,
    redesignedProcess: processRedesign.newProcess,
    expectedImprovements: processRedesign.improvements,
    implementationPlan: implementation.plan,
    artifacts,
    duration: endTime - startTime,
    metadata: { processId: 'business-strategy/business-process-reengineering', timestamp: startTime }
  };
}

export const strategicVisionTask = defineTask('strategic-vision', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define strategic vision',
  agent: {
    name: 'strategy-architect',
    prompt: {
      role: 'BPR strategy architect',
      task: 'Define strategic vision and breakthrough objectives',
      context: args,
      instructions: ['Define vision for reengineered process', 'Set breakthrough performance targets', 'Identify success criteria', 'Save to output directory'],
      outputFormat: 'JSON with vision (object), breakthroughTargets (object), artifacts'
    },
    outputSchema: { type: 'object', required: ['vision', 'artifacts'], properties: { vision: { type: 'object' }, breakthroughTargets: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'bpr', 'vision']
}));

export const currentProcessAnalysisTask = defineTask('current-process-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze current process',
  agent: {
    name: 'process-analyst',
    prompt: {
      role: 'process analysis expert',
      task: 'Analyze current process without being constrained by it',
      context: args,
      instructions: ['Map high-level process flow', 'Identify fundamental activities', 'Document pain points and inefficiencies', 'Assess current performance', 'Save analysis to output directory'],
      outputFormat: 'JSON with analysis (object), processMap (object), artifacts'
    },
    outputSchema: { type: 'object', required: ['analysis', 'artifacts'], properties: { analysis: { type: 'object' }, processMap: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'bpr', 'analysis']
}));

export const benchmarkingTask = defineTask('benchmarking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Benchmark best practices',
  agent: {
    name: 'benchmarking-analyst',
    prompt: {
      role: 'benchmarking specialist',
      task: 'Benchmark against industry best practices',
      context: args,
      instructions: ['Research best-in-class processes', 'Identify breakthrough approaches', 'Document lessons from other industries', 'Save benchmarks to output directory'],
      outputFormat: 'JSON with benchmarks (array), bestPractices (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['benchmarks', 'artifacts'], properties: { benchmarks: { type: 'array' }, bestPractices: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'bpr', 'benchmarking']
}));

export const cleanSheetRedesignTask = defineTask('clean-sheet-redesign', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Redesign from clean sheet',
  agent: {
    name: 'process-innovator',
    prompt: {
      role: 'process innovation expert',
      task: 'Redesign process from scratch (clean sheet)',
      context: args,
      instructions: ['Start from customer outcome', 'Question all assumptions', 'Design for breakthrough performance', 'Apply reengineering principles', 'Save redesign to output directory'],
      outputFormat: 'JSON with newProcess (object), improvements (object), artifacts'
    },
    outputSchema: { type: 'object', required: ['newProcess', 'improvements', 'artifacts'], properties: { newProcess: { type: 'object' }, improvements: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'bpr', 'redesign']
}));

export const technologyEnablementTask = defineTask('technology-enablement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify technology enablers',
  agent: {
    name: 'technology-strategist',
    prompt: {
      role: 'technology enablement strategist',
      task: 'Identify technology to enable reengineered process',
      context: args,
      instructions: ['Identify automation opportunities', 'Evaluate enabling technologies', 'Design technology architecture', 'Save technology plan to output directory'],
      outputFormat: 'JSON with technologies (array), architecture (object), artifacts'
    },
    outputSchema: { type: 'object', required: ['technologies', 'artifacts'], properties: { technologies: { type: 'array' }, architecture: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'bpr', 'technology']
}));

export const organizationalImpactTask = defineTask('organizational-impact', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess organizational impact',
  agent: {
    name: 'change-analyst',
    prompt: {
      role: 'organizational change analyst',
      task: 'Assess organizational impact of reengineering',
      context: args,
      instructions: ['Assess role and structure changes', 'Identify skill requirements', 'Evaluate cultural implications', 'Save impact assessment to output directory'],
      outputFormat: 'JSON with impact (object), changeRequirements (array), artifacts'
    },
    outputSchema: { type: 'object', required: ['impact', 'artifacts'], properties: { impact: { type: 'object' }, changeRequirements: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'bpr', 'organizational']
}));

export const implementationPlanningTask = defineTask('implementation-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan implementation',
  agent: {
    name: 'implementation-planner',
    prompt: {
      role: 'BPR implementation planner',
      task: 'Create detailed implementation plan',
      context: args,
      instructions: ['Define implementation phases', 'Create change management plan', 'Define milestones and governance', 'Save plan to output directory'],
      outputFormat: 'JSON with plan (object), timeline (object), artifacts'
    },
    outputSchema: { type: 'object', required: ['plan', 'artifacts'], properties: { plan: { type: 'object' }, timeline: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'bpr', 'implementation']
}));

export const bprReportTask = defineTask('bpr-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate BPR report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'BPR consultant and technical writer',
      task: 'Generate comprehensive BPR report',
      context: args,
      instructions: ['Create executive summary', 'Document current vs future state', 'Present expected benefits', 'Include implementation roadmap', 'Save report to output directory'],
      outputFormat: 'JSON with reportPath (string), executiveSummary (string), artifacts'
    },
    outputSchema: { type: 'object', required: ['reportPath', 'artifacts'], properties: { reportPath: { type: 'string' }, executiveSummary: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'bpr', 'reporting']
}));
