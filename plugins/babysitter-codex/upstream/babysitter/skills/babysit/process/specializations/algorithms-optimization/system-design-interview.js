/**
 * @process specializations/algorithms-optimization/system-design-interview
 * @description System Design Interview Preparation - Process for preparing for system design interviews including
 * distributed systems concepts, scalability patterns, and practicing common design problems.
 * @inputs { topic?: string, level?: string }
 * @outputs { success: boolean, designDocument: object, concepts: array, artifacts: array }
 *
 * @references
 * - System Design Primer: https://github.com/donnemartin/system-design-primer
 * - Designing Data-Intensive Applications
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { topic = 'url-shortener', level = 'senior', outputDir = 'system-design-output' } = inputs;
  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting System Design Interview Prep - Topic: ${topic}`);

  const concepts = await ctx.task(conceptReviewTask, { topic, level, outputDir });
  artifacts.push(...concepts.artifacts);

  const requirements = await ctx.task(requirementsGatheringTask, { topic, outputDir });
  artifacts.push(...requirements.artifacts);

  const design = await ctx.task(systemDesignTask, { topic, requirements, concepts, outputDir });
  artifacts.push(...design.artifacts);

  const deepDive = await ctx.task(deepDiveTask, { design, level, outputDir });
  artifacts.push(...deepDive.artifacts);

  await ctx.breakpoint({
    question: `System design for ${topic} complete. Design covers: ${design.components.length} components. Review?`,
    title: 'System Design Complete',
    context: { runId: ctx.runId, topic, components: design.components }
  });

  return {
    success: true,
    topic,
    designDocument: design.document,
    concepts: concepts.reviewed,
    artifacts,
    duration: ctx.now() - startTime
  };
}

export const conceptReviewTask = defineTask('concept-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review System Design Concepts',
  agent: {
    name: 'interview-coach',
    prompt: {
      role: 'System Design Expert',
      task: 'Review relevant system design concepts',
      context: args,
      instructions: ['1. Review scalability concepts', '2. Review consistency models', '3. Review caching strategies', '4. Review database choices', '5. Document key concepts'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['reviewed', 'artifacts'],
      properties: { reviewed: { type: 'array' }, keyPoints: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'system-design', 'concepts']
}));

export const requirementsGatheringTask = defineTask('requirements-gathering', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Gather Requirements',
  agent: {
    name: 'interview-coach',
    prompt: {
      role: 'System Design Interviewer',
      task: 'Gather functional and non-functional requirements',
      context: args,
      instructions: ['1. Define functional requirements', '2. Define non-functional requirements', '3. Estimate scale', '4. Define constraints', '5. Document requirements'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['functional', 'nonFunctional', 'artifacts'],
      properties: { functional: { type: 'array' }, nonFunctional: { type: 'array' }, scale: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'system-design', 'requirements']
}));

export const systemDesignTask = defineTask('system-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design ${args.topic}`,
  agent: {
    name: 'interview-coach',
    prompt: {
      role: 'System Architect',
      task: 'Create high-level system design',
      context: args,
      instructions: ['1. Define API endpoints', '2. Design data model', '3. Design high-level architecture', '4. Choose technologies', '5. Create architecture diagram'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['document', 'components', 'artifacts'],
      properties: { document: { type: 'object' }, components: { type: 'array' }, dataModel: { type: 'object' }, apis: { type: 'array' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'system-design', 'design']
}));

export const deepDiveTask = defineTask('deep-dive', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Deep Dive Analysis',
  agent: {
    name: 'interview-coach',
    prompt: {
      role: 'System Design Expert',
      task: 'Deep dive into critical components',
      context: args,
      instructions: ['1. Analyze bottlenecks', '2. Design scaling strategy', '3. Design fault tolerance', '4. Discuss trade-offs', '5. Document deep dive'],
      outputFormat: 'JSON object'
    },
    outputSchema: {
      type: 'object',
      required: ['deepDive', 'tradeoffs', 'artifacts'],
      properties: { deepDive: { type: 'object' }, tradeoffs: { type: 'array' }, scalingStrategy: { type: 'object' }, artifacts: { type: 'array' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'system-design', 'deep-dive']
}));
