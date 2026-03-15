/**
 * @process specializations/algorithms-optimization/greedy-algorithm-design
 * @description Greedy Algorithm Design and Proof - Process for designing greedy algorithms, proving correctness
 * using exchange argument or greedy stays ahead, and implementing efficient solutions.
 * @inputs { problemStatement: string }
 * @outputs { success: boolean, greedyChoice: string, proof: object, implementation: string, artifacts: array }
 *
 * @references
 * - Greedy Algorithm Design Techniques
 * - CLRS Greedy Algorithms Chapter
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { problemStatement, language = 'python', outputDir = 'greedy-algorithm-output' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Designing Greedy Algorithm');

  const analysis = await ctx.task(greedyAnalysisTask, { problemStatement, outputDir });
  artifacts.push(...analysis.artifacts);

  const proof = await ctx.task(greedyProofTask, { analysis, outputDir });
  artifacts.push(...proof.artifacts);

  const implementation = await ctx.task(greedyImplementationTask, { analysis, proof, language, outputDir });
  artifacts.push(...implementation.artifacts);

  await ctx.breakpoint({
    question: `Greedy algorithm designed. Choice: ${analysis.greedyChoice}. Proof valid: ${proof.valid}. Review?`,
    title: 'Greedy Algorithm Complete',
    context: { runId: ctx.runId, greedyChoice: analysis.greedyChoice, proofValid: proof.valid }
  });

  return {
    success: true,
    greedyChoice: analysis.greedyChoice,
    proof: { valid: proof.valid, technique: proof.technique },
    implementation: implementation.code,
    artifacts,
    duration: ctx.now() - startTime
  };
}

export const greedyAnalysisTask = defineTask('greedy-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze for Greedy',
  agent: {
    name: 'algorithm-designer',
    prompt: {
      role: 'Algorithm Designer',
      task: 'Analyze problem for greedy solution',
      context: args,
      instructions: ['1. Identify greedy choice property', '2. Define local optimal choice', '3. Check optimal substructure', '4. Document greedy strategy'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['greedyChoice', 'strategy', 'artifacts'],
      properties: { greedyChoice: { type: 'string' }, strategy: { type: 'string' }, substructure: { type: 'boolean' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'greedy', 'analysis']
}));

export const greedyProofTask = defineTask('greedy-proof', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prove Greedy Correctness',
  agent: {
    name: 'algorithm-designer',
    prompt: {
      role: 'Algorithm Theorist',
      task: 'Prove greedy algorithm correctness',
      context: args,
      instructions: ['1. Choose proof technique', '2. Apply exchange argument or greedy stays ahead', '3. Prove no better solution exists', '4. Document proof'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['valid', 'technique', 'artifacts'],
      properties: { valid: { type: 'boolean' }, technique: { type: 'string' }, proofSteps: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'greedy', 'proof']
}));

export const greedyImplementationTask = defineTask('greedy-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Greedy',
  agent: {
    name: 'algorithm-designer',
    prompt: {
      role: 'Software Engineer',
      task: 'Implement greedy algorithm',
      context: args,
      instructions: ['1. Implement sorting if needed', '2. Implement greedy choice', '3. Build solution iteratively', '4. Optimize implementation'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['code', 'complexity', 'artifacts'],
      properties: { code: { type: 'string' }, complexity: { type: 'string' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'greedy', 'implementation']
}));
