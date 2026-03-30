/**
 * @process gsd/iterative-convergence
 * @description Quality-gated iterative development with agent scoring
 * @inputs { feature: string, targetQuality: number, maxIterations: number }
 * @outputs { success: boolean, converged: boolean, quality: number }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Agents referenced from agents/ directory:
 *   - gsd-executor: Implements feature iterations
 *   - gsd-verifier: Quality scoring with structured rubric
 *
 * Skills referenced from skills/ directory:
 *   - verification-suite: Quality scoring rubric and convergence patterns
 *   - gsd-tools: Config and iteration tracking
 */
export async function process(inputs, ctx) {
  const { feature, targetQuality = 85, maxIterations = 5 } = inputs;

  let iteration = 0;
  let quality = 0;
  let converged = false;
  const results = [];

  while (!converged && iteration < maxIterations) {
    iteration++;

    // Implement
    const impl = await ctx.task(implementTask, { feature, iteration, feedback: results[iteration - 2]?.feedback });

    // Test
    const tests = await ctx.task(testTask, { feature, implementation: impl });

    // Quality check
    const qualityResult = await ctx.task(qualityScoringTask, {
      feature,
      implementation: impl,
      tests,
      targetQuality,
      iteration
    });

    quality = qualityResult.score;
    converged = quality >= targetQuality;

    results.push({ iteration, quality, implementation: impl, tests, qualityResult });

    if (!converged && iteration < maxIterations) {
      await ctx.breakpoint({
        question: `Iteration ${iteration}: Quality ${quality}/${targetQuality}. Continue?`,
        title: `Iteration ${iteration}`,
        context: {
          runId: ctx.runId,
          files: [{ path: `artifacts/iteration-${iteration}.md`, format: 'markdown' }]
        }
      });
    }
  }

  return {
    success: converged,
    converged,
    feature,
    quality,
    targetQuality,
    iterations: iteration,
    results,
    metadata: { processId: 'gsd/iterative-convergence', timestamp: ctx.now() }
  };
}

export const implementTask = defineTask('implement', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement: ${args.feature} (iter ${args.iteration})`,
  agent: {
    name: 'gsd-executor',
    prompt: {
      role: 'senior engineer',
      task: 'Implement feature with quality',
      context: args,
      instructions: ['Implement feature', 'Apply feedback', 'Write tests', 'Document'],
      outputFormat: 'JSON with filesCreated, filesModified, summary'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated', 'filesModified'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        filesModified: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'gsd', 'convergence', `iteration-${args.iteration}`]
}));

export const testTask = defineTask('test', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Run tests',
  shell: { command: 'npm test' },
  labels: ['gsd', 'convergence', 'test']
}));

export const qualityScoringTask = defineTask('quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Score quality (iter ${args.iteration})`,
  agent: {
    name: 'gsd-verifier',
    prompt: {
      role: 'QA engineer',
      task: 'Score implementation quality 0-100',
      context: args,
      instructions: ['Assess code quality', 'Check tests', 'Review patterns', 'Score 0-100'],
      outputFormat: 'JSON with score, feedback, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['score'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        feedback: { type: 'string' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'gsd', 'convergence', 'scoring']
}));
