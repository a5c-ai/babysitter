/**
 * @process specializations/ai-agents-conversational/autonomous-task-planning
 * @description Autonomous Task Planning Agent - Process for building agents with autonomous task
 * decomposition, planning, and execution capabilities for complex multi-step goals.
 * @inputs { agentName?: string, planningStrategy?: string, maxDepth?: number, outputDir?: string }
 * @outputs { success: boolean, planningEngine: object, taskDecomposer: object, executionFramework: object, evaluationResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ai-agents-conversational/autonomous-task-planning', {
 *   agentName: 'autonomous-planner',
 *   planningStrategy: 'hierarchical',
 *   maxDepth: 5
 * });
 *
 * @references
 * - HuggingGPT: https://arxiv.org/abs/2303.17580
 * - TaskMatrix: https://arxiv.org/abs/2303.16434
 * - AutoGPT: https://github.com/Significant-Gravitas/AutoGPT
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    agentName = 'autonomous-planner',
    planningStrategy = 'hierarchical',
    maxDepth = 4,
    outputDir = 'autonomous-planning-output',
    enableReplanning = true,
    enableParallelExecution = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Autonomous Task Planning for ${agentName}`);

  // ============================================================================
  // PHASE 1: PLANNING ENGINE
  // ============================================================================

  ctx.log('info', 'Phase 1: Building planning engine');

  const planningEngine = await ctx.task(planningEngineTask, {
    agentName,
    planningStrategy,
    maxDepth,
    outputDir
  });

  artifacts.push(...planningEngine.artifacts);

  // ============================================================================
  // PHASE 2: TASK DECOMPOSITION
  // ============================================================================

  ctx.log('info', 'Phase 2: Implementing task decomposition');

  const taskDecomposer = await ctx.task(taskDecompositionTask, {
    agentName,
    planningEngine: planningEngine.engine,
    maxDepth,
    outputDir
  });

  artifacts.push(...taskDecomposer.artifacts);

  // ============================================================================
  // PHASE 3: DEPENDENCY MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Setting up dependency management');

  const dependencyManager = await ctx.task(dependencyManagementTask, {
    agentName,
    taskDecomposer: taskDecomposer.decomposer,
    outputDir
  });

  artifacts.push(...dependencyManager.artifacts);

  // ============================================================================
  // PHASE 4: EXECUTION FRAMEWORK
  // ============================================================================

  ctx.log('info', 'Phase 4: Building execution framework');

  const executionFramework = await ctx.task(executionFrameworkTask, {
    agentName,
    dependencyManager: dependencyManager.manager,
    enableParallelExecution,
    outputDir
  });

  artifacts.push(...executionFramework.artifacts);

  // ============================================================================
  // PHASE 5: REPLANNING CAPABILITY
  // ============================================================================

  let replanning = null;
  if (enableReplanning) {
    ctx.log('info', 'Phase 5: Implementing replanning');

    replanning = await ctx.task(replanningTask, {
      agentName,
      planningEngine: planningEngine.engine,
      executionFramework: executionFramework.framework,
      outputDir
    });

    artifacts.push(...replanning.artifacts);
  }

  // ============================================================================
  // PHASE 6: PROGRESS MONITORING
  // ============================================================================

  ctx.log('info', 'Phase 6: Setting up progress monitoring');

  const progressMonitoring = await ctx.task(progressMonitoringTask, {
    agentName,
    executionFramework: executionFramework.framework,
    outputDir
  });

  artifacts.push(...progressMonitoring.artifacts);

  // ============================================================================
  // PHASE 7: EVALUATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Evaluating planning quality');

  const evaluation = await ctx.task(planningEvaluationTask, {
    agentName,
    planningEngine: planningEngine.engine,
    taskDecomposer: taskDecomposer.decomposer,
    executionFramework: executionFramework.framework,
    outputDir
  });

  artifacts.push(...evaluation.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Autonomous planner ${agentName} complete. Planning quality: ${evaluation.results.qualityScore}. Review implementation?`,
    title: 'Autonomous Planning Review',
    context: {
      runId: ctx.runId,
      summary: {
        agentName,
        planningStrategy,
        maxDepth,
        enableReplanning,
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
    planningEngine: planningEngine.engine,
    taskDecomposer: taskDecomposer.decomposer,
    executionFramework: executionFramework.framework,
    evaluationResults: evaluation.results,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/ai-agents-conversational/autonomous-task-planning',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const planningEngineTask = defineTask('planning-engine', (args, taskCtx) => ({
  kind: 'agent',
  title: `Build Planning Engine - ${args.agentName}`,
  agent: {
    name: 'plan-execute-designer',  // AG-AA-003: Builds plan-and-execute agent architectures
    prompt: {
      role: 'Planning Engine Developer',
      task: 'Build autonomous planning engine',
      context: args,
      instructions: [
        '1. Define planning strategies',
        '2. Implement goal analysis',
        '3. Create plan generator',
        '4. Add constraint handling',
        '5. Implement plan validation',
        '6. Add plan optimization',
        '7. Test planning quality',
        '8. Save planning engine'
      ],
      outputFormat: 'JSON with planning engine'
    },
    outputSchema: {
      type: 'object',
      required: ['engine', 'artifacts'],
      properties: {
        engine: { type: 'object' },
        strategies: { type: 'array' },
        engineCodePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'planning', 'engine']
}));

export const taskDecompositionTask = defineTask('task-decomposition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Task Decomposition - ${args.agentName}`,
  agent: {
    name: 'decomposition-developer',
    prompt: {
      role: 'Task Decomposition Developer',
      task: 'Implement task decomposition',
      context: args,
      instructions: [
        '1. Define decomposition rules',
        '2. Implement recursive splitting',
        '3. Add atomic task detection',
        '4. Create task hierarchy',
        '5. Add decomposition validation',
        '6. Implement depth control',
        '7. Test decomposition quality',
        '8. Save task decomposer'
      ],
      outputFormat: 'JSON with task decomposer'
    },
    outputSchema: {
      type: 'object',
      required: ['decomposer', 'artifacts'],
      properties: {
        decomposer: { type: 'object' },
        decomposerCodePath: { type: 'string' },
        decompositionRules: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'planning', 'decomposition']
}));

export const dependencyManagementTask = defineTask('dependency-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Dependency Management - ${args.agentName}`,
  agent: {
    name: 'dependency-developer',
    prompt: {
      role: 'Dependency Management Developer',
      task: 'Setup task dependency management',
      context: args,
      instructions: [
        '1. Build dependency graph',
        '2. Implement topological sort',
        '3. Detect circular dependencies',
        '4. Add dependency resolution',
        '5. Implement parallel paths',
        '6. Add critical path analysis',
        '7. Test dependency handling',
        '8. Save dependency manager'
      ],
      outputFormat: 'JSON with dependency manager'
    },
    outputSchema: {
      type: 'object',
      required: ['manager', 'artifacts'],
      properties: {
        manager: { type: 'object' },
        managerCodePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'planning', 'dependencies']
}));

export const executionFrameworkTask = defineTask('execution-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: `Build Execution Framework - ${args.agentName}`,
  agent: {
    name: 'execution-developer',
    prompt: {
      role: 'Execution Framework Developer',
      task: 'Build task execution framework',
      context: args,
      instructions: [
        '1. Create task executor',
        '2. Implement parallel execution',
        '3. Add error handling',
        '4. Implement retries',
        '5. Add timeout handling',
        '6. Create execution queue',
        '7. Add execution logging',
        '8. Save execution framework'
      ],
      outputFormat: 'JSON with execution framework'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'artifacts'],
      properties: {
        framework: { type: 'object' },
        frameworkCodePath: { type: 'string' },
        executorConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'planning', 'execution']
}));

export const replanningTask = defineTask('replanning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Replanning - ${args.agentName}`,
  agent: {
    name: 'replanning-developer',
    prompt: {
      role: 'Replanning Developer',
      task: 'Implement dynamic replanning',
      context: args,
      instructions: [
        '1. Define replan triggers',
        '2. Implement plan adjustment',
        '3. Add failure recovery',
        '4. Create plan merging',
        '5. Implement partial replanning',
        '6. Add plan rollback',
        '7. Test replanning quality',
        '8. Save replanning config'
      ],
      outputFormat: 'JSON with replanning'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'artifacts'],
      properties: {
        config: { type: 'object' },
        replanningCodePath: { type: 'string' },
        triggers: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'planning', 'replanning']
}));

export const progressMonitoringTask = defineTask('progress-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Progress Monitoring - ${args.agentName}`,
  agent: {
    name: 'monitoring-developer',
    prompt: {
      role: 'Progress Monitoring Developer',
      task: 'Setup execution progress monitoring',
      context: args,
      instructions: [
        '1. Track task completion',
        '2. Monitor execution time',
        '3. Add progress indicators',
        '4. Track resource usage',
        '5. Implement ETA calculation',
        '6. Add status reporting',
        '7. Create progress dashboard',
        '8. Save monitoring config'
      ],
      outputFormat: 'JSON with progress monitoring'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'artifacts'],
      properties: {
        config: { type: 'object' },
        monitoringCodePath: { type: 'string' },
        dashboardConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'planning', 'monitoring']
}));

export const planningEvaluationTask = defineTask('planning-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Evaluate Planning - ${args.agentName}`,
  agent: {
    name: 'evaluation-developer',
    prompt: {
      role: 'Planning Evaluation Developer',
      task: 'Evaluate planning quality',
      context: args,
      instructions: [
        '1. Create test scenarios',
        '2. Evaluate plan quality',
        '3. Test decomposition accuracy',
        '4. Measure execution success',
        '5. Test replanning',
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
            decompositionAccuracy: { type: 'number' },
            executionSuccessRate: { type: 'number' }
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
  labels: ['agent', 'planning', 'evaluation']
}));
