/**
 * @process specializations/algorithms-optimization/dp-state-optimization
 * @description DP State Design and Optimization - Systematic approach to designing DP states, optimizing space
 * complexity (rolling array, state compression), and improving time complexity using optimization techniques.
 * @inputs { dpState: object, currentComplexity: object, targetComplexity?: object }
 * @outputs { success: boolean, optimizedState: object, newComplexity: object, techniques: array, artifacts: array }
 *
 * @references
 * - DP Optimization: https://cp-algorithms.com/dynamic_programming/
 * - Convex Hull Trick, Divide and Conquer DP
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { dpState, currentComplexity, targetComplexity = null, outputDir = 'dp-optimization-output' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting DP State Optimization');

  const analysis = await ctx.task(stateAnalysisTask, { dpState, currentComplexity, outputDir });
  artifacts.push(...analysis.artifacts);

  const spaceOpt = await ctx.task(spaceOptimizationTask, { dpState, analysis, outputDir });
  artifacts.push(...spaceOpt.artifacts);

  const timeOpt = await ctx.task(timeOptimizationTask, { dpState, analysis, targetComplexity, outputDir });
  artifacts.push(...timeOpt.artifacts);

  const finalState = await ctx.task(finalStateDesignTask, { dpState, spaceOpt, timeOpt, outputDir });
  artifacts.push(...finalState.artifacts);

  await ctx.breakpoint({
    question: `DP optimization complete. Space: ${spaceOpt.newSpaceComplexity}, Time: ${timeOpt.newTimeComplexity}. Review?`,
    title: 'DP Optimization Complete',
    context: { runId: ctx.runId, spaceImprovement: spaceOpt.improvement, timeImprovement: timeOpt.improvement }
  });

  return {
    success: true,
    optimizedState: finalState.state,
    newComplexity: { time: timeOpt.newTimeComplexity, space: spaceOpt.newSpaceComplexity },
    techniques: [...spaceOpt.techniques, ...timeOpt.techniques],
    artifacts,
    duration: ctx.now() - startTime
  };
}

export const stateAnalysisTask = defineTask('state-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'DP State Analysis',
  skills: ['dp-state-designer', 'dp-optimizer'],
  agent: {
    name: 'dp-specialist',
    prompt: {
      role: 'DP Optimization Expert',
      task: 'Analyze current DP state for optimization opportunities',
      context: args,
      instructions: ['1. Analyze state dimensions', '2. Identify redundant states', '3. Find optimization opportunities', '4. Document analysis'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['opportunities', 'artifacts'],
      properties: { opportunities: { type: 'array' }, redundancies: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'dp-optimization', 'analysis']
}));

export const spaceOptimizationTask = defineTask('space-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'DP Space Optimization',
  skills: ['dp-optimizer'],
  agent: {
    name: 'dp-specialist',
    prompt: {
      role: 'DP Optimization Expert',
      task: 'Apply space optimization techniques',
      context: args,
      instructions: ['1. Apply rolling array technique', '2. Apply state compression', '3. Calculate new space complexity', '4. Document techniques'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['techniques', 'newSpaceComplexity', 'improvement', 'artifacts'],
      properties: { techniques: { type: 'array' }, newSpaceComplexity: { type: 'string' }, improvement: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'dp-optimization', 'space']
}));

export const timeOptimizationTask = defineTask('time-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'DP Time Optimization',
  skills: ['dp-optimizer'],
  agent: {
    name: 'dp-specialist',
    prompt: {
      role: 'DP Optimization Expert',
      task: 'Apply time optimization techniques',
      context: args,
      instructions: ['1. Check for convex hull trick', '2. Check for divide and conquer optimization', '3. Check for Knuth optimization', '4. Document techniques'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['techniques', 'newTimeComplexity', 'improvement', 'artifacts'],
      properties: { techniques: { type: 'array' }, newTimeComplexity: { type: 'string' }, improvement: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'dp-optimization', 'time']
}));

export const finalStateDesignTask = defineTask('final-state-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final DP State Design',
  skills: ['dp-state-designer'],
  agent: {
    name: 'dp-specialist',
    prompt: {
      role: 'DP Optimization Expert',
      task: 'Create final optimized DP state design',
      context: args,
      instructions: ['1. Combine optimizations', '2. Verify correctness preserved', '3. Create final state design', '4. Document final solution'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['state', 'artifacts'],
      properties: { state: { type: 'object' }, implementation: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'dp-optimization', 'final']
}));
