/**
 * @process specializations/ai-agents-conversational/agent-evaluation-framework
 * @description Agent Evaluation Framework Implementation - Comprehensive process for evaluating agent performance including
 * success metrics, task completion rates, reasoning quality, tool use accuracy, and LLM-as-judge evaluation.
 * @inputs { agentName?: string, evaluationTypes?: array, benchmarks?: array, outputDir?: string }
 * @outputs { success: boolean, evaluationFramework: object, testSuites: array, metricsDashboard: object, benchmarkResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ai-agents-conversational/agent-evaluation-framework', {
 *   agentName: 'research-agent',
 *   evaluationTypes: ['task-completion', 'reasoning-quality', 'tool-use'],
 *   benchmarks: ['AgentBench', 'custom']
 * });
 *
 * @references
 * - LangSmith Evaluation: https://docs.smith.langchain.com/evaluation
 * - AgentBench: https://github.com/THUDM/AgentBench
 * - LLM-as-Judge: https://arxiv.org/abs/2306.05685
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    agentName = 'agent-eval',
    evaluationTypes = ['task-completion', 'reasoning-quality'],
    benchmarks = ['custom'],
    outputDir = 'agent-evaluation-output',
    enableLLMJudge = true,
    enableHumanEval = false
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Agent Evaluation Framework for ${agentName}`);

  // ============================================================================
  // PHASE 1: EVALUATION DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 1: Designing evaluation framework');

  const evaluationDesign = await ctx.task(evaluationDesignTask, {
    agentName,
    evaluationTypes,
    benchmarks,
    outputDir
  });

  artifacts.push(...evaluationDesign.artifacts);

  // ============================================================================
  // PHASE 2: TEST SUITE CREATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Creating test suites');

  const testSuites = await ctx.task(testSuiteCreationTask, {
    agentName,
    evaluationTypes,
    evaluationDesign: evaluationDesign.design,
    outputDir
  });

  artifacts.push(...testSuites.artifacts);

  // ============================================================================
  // PHASE 3: METRICS IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing metrics');

  const metricsImplementation = await ctx.task(metricsImplementationTask, {
    agentName,
    evaluationTypes,
    outputDir
  });

  artifacts.push(...metricsImplementation.artifacts);

  // ============================================================================
  // PHASE 4: LLM-AS-JUDGE
  // ============================================================================

  let llmJudge = null;
  if (enableLLMJudge) {
    ctx.log('info', 'Phase 4: Setting up LLM-as-judge');

    llmJudge = await ctx.task(llmAsJudgeTask, {
      agentName,
      evaluationTypes,
      outputDir
    });

    artifacts.push(...llmJudge.artifacts);
  }

  // ============================================================================
  // PHASE 5: BENCHMARK INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Integrating benchmarks');

  const benchmarkIntegration = await ctx.task(benchmarkIntegrationTask, {
    agentName,
    benchmarks,
    outputDir
  });

  artifacts.push(...benchmarkIntegration.artifacts);

  // ============================================================================
  // PHASE 6: DASHBOARD SETUP
  // ============================================================================

  ctx.log('info', 'Phase 6: Setting up metrics dashboard');

  const dashboard = await ctx.task(metricsDashboardTask, {
    agentName,
    metrics: metricsImplementation.metrics,
    llmJudge: llmJudge ? llmJudge.judge : null,
    outputDir
  });

  artifacts.push(...dashboard.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Agent evaluation framework for ${agentName} complete. ${testSuites.suites.length} test suites, ${metricsImplementation.metrics.length} metrics. Review framework?`,
    title: 'Agent Evaluation Review',
    context: {
      runId: ctx.runId,
      summary: {
        agentName,
        evaluationTypes,
        testSuiteCount: testSuites.suites.length,
        metricsCount: metricsImplementation.metrics.length,
        enableLLMJudge
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'python' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    agentName,
    evaluationFramework: evaluationDesign.design,
    testSuites: testSuites.suites,
    metricsDashboard: dashboard.dashboard,
    benchmarkResults: benchmarkIntegration.results,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/ai-agents-conversational/agent-evaluation-framework',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const evaluationDesignTask = defineTask('evaluation-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design Evaluation Framework - ${args.agentName}`,
  agent: {
    name: 'agent-evaluator',  // AG-SAF-004: Designs evaluation frameworks and benchmarks
    prompt: {
      role: 'Evaluation Architect',
      task: 'Design comprehensive agent evaluation framework',
      context: args,
      instructions: [
        '1. Define evaluation objectives',
        '2. Select evaluation types',
        '3. Design evaluation methodology',
        '4. Define success criteria',
        '5. Plan data collection',
        '6. Create evaluation rubrics',
        '7. Document framework',
        '8. Save evaluation design'
      ],
      outputFormat: 'JSON with evaluation design'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'artifacts'],
      properties: {
        design: { type: 'object' },
        objectives: { type: 'array' },
        methodology: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'evaluation', 'design']
}));

export const testSuiteCreationTask = defineTask('test-suite-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create Test Suites - ${args.agentName}`,
  agent: {
    name: 'test-developer',
    prompt: {
      role: 'Test Suite Developer',
      task: 'Create comprehensive test suites for agent evaluation',
      context: args,
      instructions: [
        '1. Create task completion tests',
        '2. Create reasoning quality tests',
        '3. Create tool use accuracy tests',
        '4. Add edge case tests',
        '5. Create regression tests',
        '6. Add performance tests',
        '7. Document test cases',
        '8. Save test suites'
      ],
      outputFormat: 'JSON with test suites'
    },
    outputSchema: {
      type: 'object',
      required: ['suites', 'artifacts'],
      properties: {
        suites: { type: 'array' },
        testCasesPath: { type: 'string' },
        coverage: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'evaluation', 'tests']
}));

export const metricsImplementationTask = defineTask('metrics-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Metrics - ${args.agentName}`,
  agent: {
    name: 'metrics-developer',
    prompt: {
      role: 'Metrics Developer',
      task: 'Implement agent evaluation metrics',
      context: args,
      instructions: [
        '1. Implement success rate metric',
        '2. Implement task completion rate',
        '3. Implement reasoning quality score',
        '4. Implement tool use accuracy',
        '5. Implement latency metrics',
        '6. Add cost metrics',
        '7. Create aggregation logic',
        '8. Save metrics implementation'
      ],
      outputFormat: 'JSON with metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'artifacts'],
      properties: {
        metrics: { type: 'array' },
        metricsCodePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'evaluation', 'metrics']
}));

export const llmAsJudgeTask = defineTask('llm-as-judge', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup LLM-as-Judge - ${args.agentName}`,
  agent: {
    name: 'llm-judge-developer',
    prompt: {
      role: 'LLM Judge Developer',
      task: 'Setup LLM-as-judge evaluation',
      context: args,
      instructions: [
        '1. Design judge prompts',
        '2. Define evaluation criteria',
        '3. Create scoring rubrics',
        '4. Implement judge pipeline',
        '5. Add calibration',
        '6. Handle disagreements',
        '7. Validate judge accuracy',
        '8. Save LLM judge'
      ],
      outputFormat: 'JSON with LLM judge'
    },
    outputSchema: {
      type: 'object',
      required: ['judge', 'artifacts'],
      properties: {
        judge: { type: 'object' },
        judgeCodePath: { type: 'string' },
        prompts: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'evaluation', 'llm-judge']
}));

export const benchmarkIntegrationTask = defineTask('benchmark-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Integrate Benchmarks - ${args.agentName}`,
  agent: {
    name: 'benchmark-developer',
    prompt: {
      role: 'Benchmark Developer',
      task: 'Integrate standard benchmarks',
      context: args,
      instructions: [
        '1. Setup AgentBench if selected',
        '2. Configure custom benchmarks',
        '3. Create benchmark adapters',
        '4. Implement scoring',
        '5. Add baseline comparisons',
        '6. Generate leaderboard',
        '7. Document benchmarks',
        '8. Save benchmark integration'
      ],
      outputFormat: 'JSON with benchmark integration'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'artifacts'],
      properties: {
        results: { type: 'object' },
        benchmarkCodePath: { type: 'string' },
        leaderboard: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'evaluation', 'benchmarks']
}));

export const metricsDashboardTask = defineTask('metrics-dashboard', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Metrics Dashboard - ${args.agentName}`,
  agent: {
    name: 'dashboard-developer',
    prompt: {
      role: 'Dashboard Developer',
      task: 'Setup evaluation metrics dashboard',
      context: args,
      instructions: [
        '1. Design dashboard layout',
        '2. Implement metric visualizations',
        '3. Add trend analysis',
        '4. Create comparison views',
        '5. Add export functionality',
        '6. Configure alerts',
        '7. Add filtering options',
        '8. Save dashboard'
      ],
      outputFormat: 'JSON with dashboard'
    },
    outputSchema: {
      type: 'object',
      required: ['dashboard', 'artifacts'],
      properties: {
        dashboard: { type: 'object' },
        dashboardPath: { type: 'string' },
        visualizations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'evaluation', 'dashboard']
}));
