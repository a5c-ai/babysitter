/**
 * @process specializations/ai-agents-conversational/prompt-engineering-workflow
 * @description Prompt Engineering and Optimization Workflow - Systematic process for designing, testing, and optimizing
 * prompts including few-shot examples, chain-of-thought, self-consistency, and constitutional AI principles.
 * @inputs { projectName?: string, taskType?: string, targetModel?: string, outputDir?: string }
 * @outputs { success: boolean, optimizedPrompts: object, promptTemplates: object, performanceMetrics: object, versionControl: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ai-agents-conversational/prompt-engineering-workflow', {
 *   projectName: 'qa-prompts',
 *   taskType: 'question-answering',
 *   targetModel: 'gpt-4'
 * });
 *
 * @references
 * - LangSmith: https://docs.smith.langchain.com/
 * - PromptLayer: https://docs.promptlayer.com/
 * - Prompt Engineering Guide: https://www.promptingguide.ai/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName = 'prompt-project',
    taskType = 'general',
    targetModel = 'gpt-4',
    outputDir = 'prompt-engineering-output',
    enableFewShot = true,
    enableCoT = true,
    enableSelfConsistency = false
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Prompt Engineering Workflow for ${projectName}`);

  // ============================================================================
  // PHASE 1: TASK ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing task requirements');

  const taskAnalysis = await ctx.task(taskAnalysisTask, {
    projectName,
    taskType,
    targetModel,
    outputDir
  });

  artifacts.push(...taskAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: BASELINE PROMPT DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing baseline prompts');

  const baselineDesign = await ctx.task(baselinePromptDesignTask, {
    projectName,
    taskAnalysis: taskAnalysis.analysis,
    targetModel,
    outputDir
  });

  artifacts.push(...baselineDesign.artifacts);

  // ============================================================================
  // PHASE 3: FEW-SHOT EXAMPLES
  // ============================================================================

  let fewShotExamples = null;
  if (enableFewShot) {
    ctx.log('info', 'Phase 3: Creating few-shot examples');

    fewShotExamples = await ctx.task(fewShotExamplesTask, {
      projectName,
      taskAnalysis: taskAnalysis.analysis,
      baselinePrompt: baselineDesign.prompt,
      outputDir
    });

    artifacts.push(...fewShotExamples.artifacts);
  }

  // ============================================================================
  // PHASE 4: CHAIN-OF-THOUGHT
  // ============================================================================

  let chainOfThought = null;
  if (enableCoT) {
    ctx.log('info', 'Phase 4: Implementing chain-of-thought');

    chainOfThought = await ctx.task(chainOfThoughtTask, {
      projectName,
      baselinePrompt: baselineDesign.prompt,
      fewShotExamples: fewShotExamples ? fewShotExamples.examples : null,
      outputDir
    });

    artifacts.push(...chainOfThought.artifacts);
  }

  // ============================================================================
  // PHASE 5: PROMPT TESTING
  // ============================================================================

  ctx.log('info', 'Phase 5: Testing prompts');

  const promptTesting = await ctx.task(promptTestingTask, {
    projectName,
    prompts: {
      baseline: baselineDesign.prompt,
      fewShot: fewShotExamples ? fewShotExamples.prompt : null,
      cot: chainOfThought ? chainOfThought.prompt : null
    },
    targetModel,
    outputDir
  });

  artifacts.push(...promptTesting.artifacts);

  // ============================================================================
  // PHASE 6: OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Optimizing prompts');

  const optimization = await ctx.task(promptOptimizationTask, {
    projectName,
    testResults: promptTesting.results,
    prompts: promptTesting.prompts,
    outputDir
  });

  artifacts.push(...optimization.artifacts);

  // ============================================================================
  // PHASE 7: VERSION CONTROL
  // ============================================================================

  ctx.log('info', 'Phase 7: Setting up version control');

  const versionControl = await ctx.task(promptVersionControlTask, {
    projectName,
    optimizedPrompts: optimization.optimizedPrompts,
    metrics: optimization.metrics,
    outputDir
  });

  artifacts.push(...versionControl.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Prompt engineering for ${projectName} complete. Best performing prompt accuracy: ${optimization.metrics.bestAccuracy}%. Review prompts?`,
    title: 'Prompt Engineering Review',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        taskType,
        targetModel,
        bestAccuracy: optimization.metrics.bestAccuracy,
        enableFewShot,
        enableCoT
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    optimizedPrompts: optimization.optimizedPrompts,
    promptTemplates: baselineDesign.templates,
    performanceMetrics: optimization.metrics,
    versionControl: versionControl.config,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/ai-agents-conversational/prompt-engineering-workflow',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const taskAnalysisTask = defineTask('task-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Task - ${args.projectName}`,
  agent: {
    name: 'prompt-engineer',  // AG-PE-001: Optimizes prompts through systematic testing and iteration
    prompt: {
      role: 'Prompt Engineering Analyst',
      task: 'Analyze task requirements for prompt design',
      context: args,
      instructions: [
        '1. Analyze task type and requirements',
        '2. Identify input/output format',
        '3. Define success criteria',
        '4. Identify edge cases',
        '5. Analyze model capabilities',
        '6. Document constraints',
        '7. Create evaluation criteria',
        '8. Save task analysis'
      ],
      outputFormat: 'JSON with task analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'artifacts'],
      properties: {
        analysis: { type: 'object' },
        successCriteria: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'prompts', 'analysis']
}));

export const baselinePromptDesignTask = defineTask('baseline-prompt-design', (args, taskCtx) => ({
  kind: 'skill',
  title: `Design Baseline Prompts - ${args.projectName}`,
  skill: {
    name: 'system-prompt-templates',  // SK-PE-001: Reusable system prompt templates for agent personas
    prompt: {
      role: 'Prompt Designer',
      task: 'Design baseline prompts for task',
      context: args,
      instructions: [
        '1. Design system prompt',
        '2. Create user prompt template',
        '3. Define input placeholders',
        '4. Add output format instructions',
        '5. Include constraints',
        '6. Add safety guidelines',
        '7. Create prompt variations',
        '8. Save baseline prompts'
      ],
      outputFormat: 'JSON with baseline prompts'
    },
    outputSchema: {
      type: 'object',
      required: ['prompt', 'templates', 'artifacts'],
      properties: {
        prompt: { type: 'string' },
        templates: { type: 'object' },
        variations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'prompts', 'baseline']
}));

export const fewShotExamplesTask = defineTask('few-shot-examples', (args, taskCtx) => ({
  kind: 'skill',
  title: `Create Few-Shot Examples - ${args.projectName}`,
  skill: {
    name: 'few-shot-examples',  // SK-PE-002: Few-shot example generation and management
    prompt: {
      role: 'Few-Shot Example Creator',
      task: 'Create diverse few-shot examples',
      context: args,
      instructions: [
        '1. Create diverse example inputs',
        '2. Write high-quality outputs',
        '3. Cover edge cases',
        '4. Vary example complexity',
        '5. Balance example distribution',
        '6. Order examples optimally',
        '7. Validate examples',
        '8. Save few-shot prompt'
      ],
      outputFormat: 'JSON with few-shot examples'
    },
    outputSchema: {
      type: 'object',
      required: ['examples', 'prompt', 'artifacts'],
      properties: {
        examples: { type: 'array' },
        prompt: { type: 'string' },
        exampleCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'prompts', 'few-shot']
}));

export const chainOfThoughtTask = defineTask('chain-of-thought', (args, taskCtx) => ({
  kind: 'skill',
  title: `Implement Chain-of-Thought - ${args.projectName}`,
  skill: {
    name: 'chain-of-thought-prompts',  // SK-PE-003: Chain-of-thought and step-by-step reasoning prompts
    prompt: {
      role: 'Chain-of-Thought Developer',
      task: 'Implement chain-of-thought prompting',
      context: args,
      instructions: [
        '1. Add step-by-step reasoning instructions',
        '2. Create CoT examples',
        '3. Structure reasoning steps',
        '4. Add intermediate verification',
        '5. Handle reasoning branches',
        '6. Add final answer extraction',
        '7. Test CoT effectiveness',
        '8. Save CoT prompt'
      ],
      outputFormat: 'JSON with CoT prompt'
    },
    outputSchema: {
      type: 'object',
      required: ['prompt', 'artifacts'],
      properties: {
        prompt: { type: 'string' },
        reasoningSteps: { type: 'array' },
        cotExamples: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'prompts', 'cot']
}));

export const promptTestingTask = defineTask('prompt-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test Prompts - ${args.projectName}`,
  agent: {
    name: 'prompt-tester',  // AG-PE-002: Creates prompt evaluation datasets and metrics
    prompt: {
      role: 'Prompt Tester',
      task: 'Test prompt variants systematically',
      context: args,
      instructions: [
        '1. Create test dataset',
        '2. Run each prompt variant',
        '3. Measure accuracy/quality',
        '4. Measure latency',
        '5. Calculate token usage',
        '6. Compare variants',
        '7. Identify failure cases',
        '8. Save test results'
      ],
      outputFormat: 'JSON with test results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'prompts', 'artifacts'],
      properties: {
        results: { type: 'object' },
        prompts: { type: 'object' },
        failureCases: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'prompts', 'testing']
}));

export const promptOptimizationTask = defineTask('prompt-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Optimize Prompts - ${args.projectName}`,
  agent: {
    name: 'prompt-optimizer',
    prompt: {
      role: 'Prompt Optimizer',
      task: 'Optimize prompts based on test results',
      context: args,
      instructions: [
        '1. Analyze test results',
        '2. Identify improvement areas',
        '3. Refine instructions',
        '4. Optimize token usage',
        '5. Address failure cases',
        '6. Create optimized versions',
        '7. Validate improvements',
        '8. Save optimized prompts'
      ],
      outputFormat: 'JSON with optimized prompts'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizedPrompts', 'metrics', 'artifacts'],
      properties: {
        optimizedPrompts: { type: 'object' },
        metrics: {
          type: 'object',
          properties: {
            bestAccuracy: { type: 'number' },
            avgLatency: { type: 'number' },
            avgTokens: { type: 'number' }
          }
        },
        improvements: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'prompts', 'optimization']
}));

export const promptVersionControlTask = defineTask('prompt-version-control', (args, taskCtx) => ({
  kind: 'agent',
  title: `Version Control Setup - ${args.projectName}`,
  agent: {
    name: 'version-control-developer',
    prompt: {
      role: 'Version Control Developer',
      task: 'Set up prompt version control',
      context: args,
      instructions: [
        '1. Create prompt registry',
        '2. Version prompts',
        '3. Track metrics per version',
        '4. Enable rollback',
        '5. Add deployment tracking',
        '6. Create change log',
        '7. Set up A/B testing',
        '8. Save version control config'
      ],
      outputFormat: 'JSON with version control'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'artifacts'],
      properties: {
        config: { type: 'object' },
        registry: { type: 'object' },
        currentVersion: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'prompts', 'version-control']
}));
