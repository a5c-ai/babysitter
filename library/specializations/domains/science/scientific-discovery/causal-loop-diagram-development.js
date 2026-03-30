/**
 * @process domains/science/scientific-discovery/causal-loop-diagram-development
 * @description Map feedback loops and circular causality in complex systems - Guides practitioners through
 * creating causal loop diagrams (CLDs) to visualize and analyze feedback structures in systems.
 * @inputs { system: string, variables: array, boundaries?: object, stakeholders?: array }
 * @outputs { success: boolean, diagram: object, loops: array, leverage: array, analysis: object }
 *
 * @example
 * const result = await orchestrate('domains/science/scientific-discovery/causal-loop-diagram-development', {
 *   system: 'Urban Housing Market',
 *   variables: ['housing prices', 'demand', 'supply', 'construction', 'population'],
 *   boundaries: { scope: 'metropolitan-area', timeframe: '5-years' }
 * });
 *
 * @references
 * - Sterman, J.D. (2000). Business Dynamics: Systems Thinking and Modeling
 * - Senge, P. (1990). The Fifth Discipline
 * - Kim, D.H. (1992). Guidelines for Drawing Causal Loop Diagrams
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    system,
    variables = [],
    boundaries = {},
    stakeholders = [],
    outputDir = 'cld-output',
    minimumCoverageScore = 80
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Causal Loop Diagram for: ${system}`);

  const problemArticulation = await ctx.task(systemProblemArticulationTask, { system, boundaries, stakeholders, outputDir });
  artifacts.push(...problemArticulation.artifacts);

  const variableIdentification = await ctx.task(variableIdentificationTask, { system, variables, problemArticulation, outputDir });
  artifacts.push(...variableIdentification.artifacts);

  const causalLinkIdentification = await ctx.task(causalLinkIdentificationTask, { variables: variableIdentification.variables, system, outputDir });
  artifacts.push(...causalLinkIdentification.artifacts);

  await ctx.breakpoint({
    question: `Identified ${variableIdentification.variables?.length || 0} variables and ${causalLinkIdentification.links?.length || 0} causal links. Review before loop analysis?`,
    title: 'CLD Structure Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })), summary: { variables: variableIdentification.variables?.length || 0, links: causalLinkIdentification.links?.length || 0 }}
  });

  const feedbackLoopIdentification = await ctx.task(feedbackLoopIdentificationTask, { links: causalLinkIdentification.links, variables: variableIdentification.variables, outputDir });
  artifacts.push(...feedbackLoopIdentification.artifacts);

  const loopAnalysis = await ctx.task(loopAnalysisTask, { loops: feedbackLoopIdentification.loops, system, outputDir });
  artifacts.push(...loopAnalysis.artifacts);

  const leveragePointIdentification = await ctx.task(leveragePointIdentificationTask, { loops: feedbackLoopIdentification.loops, loopAnalysis, system, outputDir });
  artifacts.push(...leveragePointIdentification.artifacts);

  const diagramGeneration = await ctx.task(cldDiagramGenerationTask, { variables: variableIdentification.variables, links: causalLinkIdentification.links, loops: feedbackLoopIdentification.loops, leveragePoints: leveragePointIdentification.leveragePoints, outputDir });
  artifacts.push(...diagramGeneration.artifacts);

  const qualityScore = await ctx.task(cldQualityScoringTask, { variableIdentification, causalLinkIdentification, feedbackLoopIdentification, diagramGeneration, minimumCoverageScore, outputDir });
  artifacts.push(...qualityScore.artifacts);

  await ctx.breakpoint({
    question: `CLD complete. ${feedbackLoopIdentification.loops?.length || 0} feedback loops identified, ${leveragePointIdentification.leveragePoints?.length || 0} leverage points. Quality: ${qualityScore.overallScore}/100. Approve?`,
    title: 'CLD Approval',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })), summary: { loops: feedbackLoopIdentification.loops?.length || 0, leveragePoints: leveragePointIdentification.leveragePoints?.length || 0, qualityScore: qualityScore.overallScore }}
  });

  return {
    success: true, system, diagram: diagramGeneration.diagram, loops: feedbackLoopIdentification.loops,
    leverage: leveragePointIdentification.leveragePoints, analysis: loopAnalysis,
    qualityScore: { overall: qualityScore.overallScore }, artifacts, duration: ctx.now() - startTime,
    metadata: { processId: 'domains/science/scientific-discovery/causal-loop-diagram-development', timestamp: startTime, outputDir }
  };
}

export const systemProblemArticulationTask = defineTask('system-problem-articulation', (args, taskCtx) => ({
  kind: 'agent', title: 'Articulate system problem',
  agent: { name: 'systems-thinker', skills: ['systems-dynamics-modeler', 'causal-inference-engine', 'network-visualizer'], prompt: { role: 'Systems thinking facilitator', task: 'Articulate the problem and system boundaries', context: args, instructions: ['Define the problem behavior over time', 'Establish system boundaries', 'Identify key stakeholders', 'Define time horizon', 'Document reference modes'], outputFormat: 'JSON with problemStatement, boundaries, timeHorizon, referenceModes, stakeholders, artifacts' }, outputSchema: { type: 'object', required: ['problemStatement', 'boundaries', 'artifacts'], properties: { problemStatement: { type: 'string' }, boundaries: { type: 'object' }, timeHorizon: { type: 'string' }, referenceModes: { type: 'array' }, stakeholders: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'systems-thinking', 'cld']
}));

export const variableIdentificationTask = defineTask('variable-identification', (args, taskCtx) => ({
  kind: 'agent', title: 'Identify system variables',
  agent: { name: 'systems-thinker', skills: ['systems-dynamics-modeler', 'causal-inference-engine', 'network-visualizer'], prompt: { role: 'Systems analyst', task: 'Identify key variables in the system', context: args, instructions: ['Identify stock variables (accumulations)', 'Identify flow variables (rates)', 'Identify auxiliary variables', 'Use noun phrases for variables', 'Ensure variables can increase or decrease'], outputFormat: 'JSON with variables, stocks, flows, auxiliaries, artifacts' }, outputSchema: { type: 'object', required: ['variables', 'artifacts'], properties: { variables: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, type: { type: 'string' }, description: { type: 'string' } } } }, stocks: { type: 'array' }, flows: { type: 'array' }, auxiliaries: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'systems-thinking', 'cld']
}));

export const causalLinkIdentificationTask = defineTask('causal-link-identification', (args, taskCtx) => ({
  kind: 'agent', title: 'Identify causal links',
  agent: { name: 'systems-thinker', skills: ['systems-dynamics-modeler', 'causal-inference-engine', 'network-visualizer'], prompt: { role: 'Causal reasoning specialist', task: 'Identify causal relationships between variables', context: args, instructions: ['Identify direct causal links', 'Determine polarity (+ or -)', 'Positive: same direction change', 'Negative: opposite direction change', 'Verify causality vs correlation', 'Document link rationale'], outputFormat: 'JSON with links, positiveLinks, negativeLinks, artifacts' }, outputSchema: { type: 'object', required: ['links', 'artifacts'], properties: { links: { type: 'array', items: { type: 'object', properties: { from: { type: 'string' }, to: { type: 'string' }, polarity: { type: 'string' }, rationale: { type: 'string' } } } }, positiveLinks: { type: 'number' }, negativeLinks: { type: 'number' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'systems-thinking', 'cld']
}));

export const feedbackLoopIdentificationTask = defineTask('feedback-loop-identification', (args, taskCtx) => ({
  kind: 'agent', title: 'Identify feedback loops',
  agent: { name: 'systems-thinker', skills: ['systems-dynamics-modeler', 'causal-inference-engine', 'network-visualizer'], prompt: { role: 'Feedback loop analyst', task: 'Identify and classify feedback loops', context: args, instructions: ['Trace closed causal chains', 'Classify as reinforcing (R) or balancing (B)', 'R loop: even number of negative links', 'B loop: odd number of negative links', 'Name loops descriptively', 'Identify dominant loops'], outputFormat: 'JSON with loops, reinforcingLoops, balancingLoops, dominantLoops, artifacts' }, outputSchema: { type: 'object', required: ['loops', 'artifacts'], properties: { loops: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, type: { type: 'string' }, variables: { type: 'array' }, description: { type: 'string' } } } }, reinforcingLoops: { type: 'number' }, balancingLoops: { type: 'number' }, dominantLoops: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'systems-thinking', 'cld']
}));

export const loopAnalysisTask = defineTask('loop-analysis', (args, taskCtx) => ({
  kind: 'agent', title: 'Analyze loop behavior',
  agent: { name: 'systems-thinker', skills: ['systems-dynamics-modeler', 'causal-inference-engine', 'network-visualizer'], prompt: { role: 'System dynamics analyst', task: 'Analyze behavior generated by feedback loops', context: args, instructions: ['Analyze each loop behavior', 'Identify loop interactions', 'Predict system behavior patterns', 'Identify potential oscillations', 'Assess loop dominance shifts'], outputFormat: 'JSON with loopBehaviors, interactions, behaviorPatterns, oscillationRisks, dominanceShifts, artifacts' }, outputSchema: { type: 'object', required: ['loopBehaviors', 'artifacts'], properties: { loopBehaviors: { type: 'array' }, interactions: { type: 'array' }, behaviorPatterns: { type: 'array' }, oscillationRisks: { type: 'array' }, dominanceShifts: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'systems-thinking', 'cld']
}));

export const leveragePointIdentificationTask = defineTask('leverage-point-identification', (args, taskCtx) => ({
  kind: 'agent', title: 'Identify leverage points',
  agent: { name: 'systems-thinker', skills: ['systems-dynamics-modeler', 'causal-inference-engine', 'network-visualizer'], prompt: { role: 'Intervention strategist', task: 'Identify high-leverage intervention points', context: args, instructions: ['Apply Meadows leverage points framework', 'Identify parameters to change', 'Identify buffer/stock changes', 'Identify structure/flow changes', 'Identify feedback loop changes', 'Identify goal/paradigm changes'], outputFormat: 'JSON with leveragePoints, rankings, interventionStrategies, artifacts' }, outputSchema: { type: 'object', required: ['leveragePoints', 'artifacts'], properties: { leveragePoints: { type: 'array', items: { type: 'object', properties: { point: { type: 'string' }, level: { type: 'number' }, intervention: { type: 'string' }, impact: { type: 'string' } } } }, rankings: { type: 'array' }, interventionStrategies: { type: 'array' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'systems-thinking', 'cld']
}));

export const cldDiagramGenerationTask = defineTask('cld-diagram-generation', (args, taskCtx) => ({
  kind: 'agent', title: 'Generate CLD diagram',
  agent: { name: 'systems-thinker', skills: ['systems-dynamics-modeler', 'causal-inference-engine', 'network-visualizer'], prompt: { role: 'Diagram generation specialist', task: 'Generate the causal loop diagram', context: args, instructions: ['Layout variables spatially', 'Draw causal arrows with polarity', 'Mark feedback loops', 'Highlight leverage points', 'Add loop names and labels', 'Create text representation'], outputFormat: 'JSON with diagram, textRepresentation, svgPath, artifacts' }, outputSchema: { type: 'object', required: ['diagram', 'artifacts'], properties: { diagram: { type: 'object' }, textRepresentation: { type: 'string' }, svgPath: { type: 'string' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'systems-thinking', 'cld']
}));

export const cldQualityScoringTask = defineTask('cld-quality-scoring', (args, taskCtx) => ({
  kind: 'agent', title: 'Score CLD quality',
  agent: { name: 'systems-thinker', skills: ['systems-dynamics-modeler', 'causal-inference-engine', 'network-visualizer'], prompt: { role: 'CLD quality auditor', task: 'Score the quality and completeness of the CLD', context: args, instructions: ['Score variable identification', 'Score link accuracy', 'Score loop identification', 'Score overall coherence', 'Calculate overall score'], outputFormat: 'JSON with overallScore, variableScore, linkScore, loopScore, coherenceScore, artifacts' }, outputSchema: { type: 'object', required: ['overallScore', 'artifacts'], properties: { overallScore: { type: 'number' }, variableScore: { type: 'number' }, linkScore: { type: 'number' }, loopScore: { type: 'number' }, coherenceScore: { type: 'number' }, artifacts: { type: 'array' } } } },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` }, labels: ['agent', 'systems-thinking', 'cld']
}));
