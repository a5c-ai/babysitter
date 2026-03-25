/**
 * @process specializations/ai-agents-conversational/self-reflection-agent
 * @description Self-Reflection Agent Implementation - Process for building agents with self-reflection
 * capabilities including output critique, iterative refinement, and metacognitive monitoring.
 * @inputs { agentName?: string, reflectionDepth?: number, enableCritique?: boolean, outputDir?: string }
 * @outputs { success: boolean, reflectionFramework: object, critiqueEngine: object, refinementLoop: object, evaluationResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ai-agents-conversational/self-reflection-agent', {
 *   agentName: 'reflective-writer',
 *   reflectionDepth: 3,
 *   enableCritique: true
 * });
 *
 * @references
 * - Reflexion: https://arxiv.org/abs/2303.11366
 * - Self-Refine: https://arxiv.org/abs/2303.17651
 * - Constitutional AI: https://arxiv.org/abs/2212.08073
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    agentName = 'self-reflection-agent',
    reflectionDepth = 2,
    enableCritique = true,
    outputDir = 'self-reflection-output',
    enableMetacognition = true,
    maxIterations = 5
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Self-Reflection Agent for ${agentName}`);

  // ============================================================================
  // PHASE 1: REFLECTION FRAMEWORK
  // ============================================================================

  ctx.log('info', 'Phase 1: Setting up reflection framework');

  const reflectionFramework = await ctx.task(reflectionFrameworkTask, {
    agentName,
    reflectionDepth,
    outputDir
  });

  artifacts.push(...reflectionFramework.artifacts);

  // ============================================================================
  // PHASE 2: CRITIQUE ENGINE
  // ============================================================================

  let critiqueEngine = null;
  if (enableCritique) {
    ctx.log('info', 'Phase 2: Building critique engine');

    critiqueEngine = await ctx.task(critiqueEngineTask, {
      agentName,
      reflectionFramework: reflectionFramework.framework,
      outputDir
    });

    artifacts.push(...critiqueEngine.artifacts);
  }

  // ============================================================================
  // PHASE 3: REFINEMENT LOOP
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing refinement loop');

  const refinementLoop = await ctx.task(refinementLoopTask, {
    agentName,
    maxIterations,
    critiqueEngine: critiqueEngine ? critiqueEngine.engine : null,
    outputDir
  });

  artifacts.push(...refinementLoop.artifacts);

  // ============================================================================
  // PHASE 4: METACOGNITIVE MONITORING
  // ============================================================================

  let metacognition = null;
  if (enableMetacognition) {
    ctx.log('info', 'Phase 4: Setting up metacognitive monitoring');

    metacognition = await ctx.task(metacognitionTask, {
      agentName,
      reflectionFramework: reflectionFramework.framework,
      outputDir
    });

    artifacts.push(...metacognition.artifacts);
  }

  // ============================================================================
  // PHASE 5: REFLECTION PROMPTS
  // ============================================================================

  ctx.log('info', 'Phase 5: Creating reflection prompts');

  const reflectionPrompts = await ctx.task(reflectionPromptsTask, {
    agentName,
    reflectionFramework: reflectionFramework.framework,
    critiqueEngine: critiqueEngine ? critiqueEngine.engine : null,
    outputDir
  });

  artifacts.push(...reflectionPrompts.artifacts);

  // ============================================================================
  // PHASE 6: EVALUATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Evaluating reflection quality');

  const evaluation = await ctx.task(reflectionEvaluationTask, {
    agentName,
    reflectionFramework: reflectionFramework.framework,
    refinementLoop: refinementLoop.loop,
    outputDir
  });

  artifacts.push(...evaluation.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Self-reflection agent ${agentName} complete. Reflection quality: ${evaluation.results.qualityScore}. Review implementation?`,
    title: 'Self-Reflection Agent Review',
    context: {
      runId: ctx.runId,
      summary: {
        agentName,
        reflectionDepth,
        maxIterations,
        qualityScore: evaluation.results.qualityScore
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'python' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    agentName,
    reflectionFramework: reflectionFramework.framework,
    critiqueEngine: critiqueEngine ? critiqueEngine.engine : null,
    refinementLoop: refinementLoop.loop,
    evaluationResults: evaluation.results,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/ai-agents-conversational/self-reflection-agent',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const reflectionFrameworkTask = defineTask('reflection-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Reflection Framework - ${args.agentName}`,
  agent: {
    name: 'self-reflection-architect',  // AG-AA-004: Implements Reflexion and self-critique patterns
    prompt: {
      role: 'Reflection Framework Developer',
      task: 'Setup self-reflection framework',
      context: args,
      instructions: [
        '1. Define reflection dimensions',
        '2. Create reflection criteria',
        '3. Implement reflection triggers',
        '4. Setup reflection depth levels',
        '5. Create reflection memory',
        '6. Add reflection patterns',
        '7. Test framework',
        '8. Save reflection framework'
      ],
      outputFormat: 'JSON with reflection framework'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'artifacts'],
      properties: {
        framework: { type: 'object' },
        dimensions: { type: 'array' },
        frameworkCodePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'reflection', 'framework']
}));

export const critiqueEngineTask = defineTask('critique-engine', (args, taskCtx) => ({
  kind: 'agent',
  title: `Build Critique Engine - ${args.agentName}`,
  agent: {
    name: 'critique-developer',
    prompt: {
      role: 'Critique Engine Developer',
      task: 'Build self-critique engine',
      context: args,
      instructions: [
        '1. Define critique criteria',
        '2. Implement critique prompts',
        '3. Add scoring system',
        '4. Create improvement suggestions',
        '5. Implement critique patterns',
        '6. Add constructive feedback',
        '7. Test critique accuracy',
        '8. Save critique engine'
      ],
      outputFormat: 'JSON with critique engine'
    },
    outputSchema: {
      type: 'object',
      required: ['engine', 'artifacts'],
      properties: {
        engine: { type: 'object' },
        critiqueCriteria: { type: 'array' },
        engineCodePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'reflection', 'critique']
}));

export const refinementLoopTask = defineTask('refinement-loop', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Refinement Loop - ${args.agentName}`,
  agent: {
    name: 'refinement-developer',
    prompt: {
      role: 'Refinement Loop Developer',
      task: 'Implement iterative refinement loop',
      context: args,
      instructions: [
        '1. Create refinement iterations',
        '2. Implement improvement tracking',
        '3. Add convergence detection',
        '4. Create stopping criteria',
        '5. Implement rollback',
        '6. Add refinement memory',
        '7. Test refinement quality',
        '8. Save refinement loop'
      ],
      outputFormat: 'JSON with refinement loop'
    },
    outputSchema: {
      type: 'object',
      required: ['loop', 'artifacts'],
      properties: {
        loop: { type: 'object' },
        loopCodePath: { type: 'string' },
        convergenceCriteria: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'reflection', 'refinement']
}));

export const metacognitionTask = defineTask('metacognition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Metacognition - ${args.agentName}`,
  agent: {
    name: 'metacognition-developer',
    prompt: {
      role: 'Metacognition Developer',
      task: 'Setup metacognitive monitoring',
      context: args,
      instructions: [
        '1. Track confidence levels',
        '2. Monitor reasoning quality',
        '3. Detect uncertainty',
        '4. Add knowledge bounds',
        '5. Track decision rationale',
        '6. Implement meta-reasoning',
        '7. Add calibration',
        '8. Save metacognition config'
      ],
      outputFormat: 'JSON with metacognition'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'artifacts'],
      properties: {
        config: { type: 'object' },
        metacognitionCodePath: { type: 'string' },
        monitoringMetrics: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'reflection', 'metacognition']
}));

export const reflectionPromptsTask = defineTask('reflection-prompts', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create Reflection Prompts - ${args.agentName}`,
  agent: {
    name: 'prompt-developer',
    prompt: {
      role: 'Reflection Prompt Developer',
      task: 'Create reflection prompt templates',
      context: args,
      instructions: [
        '1. Create self-critique prompts',
        '2. Add improvement prompts',
        '3. Create evaluation prompts',
        '4. Add metacognitive prompts',
        '5. Create refinement prompts',
        '6. Add constitutional prompts',
        '7. Test prompt effectiveness',
        '8. Save reflection prompts'
      ],
      outputFormat: 'JSON with reflection prompts'
    },
    outputSchema: {
      type: 'object',
      required: ['prompts', 'artifacts'],
      properties: {
        prompts: { type: 'array' },
        promptsPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'reflection', 'prompts']
}));

export const reflectionEvaluationTask = defineTask('reflection-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Evaluate Reflection - ${args.agentName}`,
  agent: {
    name: 'evaluation-developer',
    prompt: {
      role: 'Reflection Evaluation Developer',
      task: 'Evaluate reflection quality',
      context: args,
      instructions: [
        '1. Create evaluation tests',
        '2. Measure improvement rate',
        '3. Evaluate critique quality',
        '4. Test refinement effectiveness',
        '5. Measure convergence speed',
        '6. Calculate quality scores',
        '7. Generate evaluation report',
        '8. Save evaluation results'
      ],
      outputFormat: 'JSON with evaluation results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'artifacts'],
      properties: {
        results: {
          type: 'object',
          properties: {
            qualityScore: { type: 'number' },
            improvementRate: { type: 'number' },
            convergenceSpeed: { type: 'number' }
          }
        },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'reflection', 'evaluation']
}));
