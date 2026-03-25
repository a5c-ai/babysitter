/**
 * @process specializations/ai-agents-conversational/plan-and-execute-agent
 * @description Plan-and-Execute Agent Development - Process for building hierarchical agents that separate high-level planning
 * from low-level execution with replanning capabilities based on intermediate results.
 * @inputs { agentName?: string, plannerModel?: string, executorModel?: string, tools?: array, outputDir?: string }
 * @outputs { success: boolean, plannerModule: object, executorModule: object, replanningLogic: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ai-agents-conversational/plan-and-execute-agent', {
 *   agentName: 'project-assistant',
 *   plannerModel: 'gpt-4',
 *   executorModel: 'gpt-3.5-turbo',
 *   tools: ['file-reader', 'code-executor', 'web-search']
 * });
 *
 * @references
 * - Plan-and-Execute Pattern: https://blog.langchain.dev/planning-agents/
 * - LangGraph Plan-and-Execute: https://langchain-ai.github.io/langgraph/tutorials/plan-and-execute/plan-and-execute/
 * - Hierarchical Task Networks: https://en.wikipedia.org/wiki/Hierarchical_task_network
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    agentName = 'plan-execute-agent',
    plannerModel = 'gpt-4',
    executorModel = 'gpt-3.5-turbo',
    tools = [],
    outputDir = 'plan-execute-output',
    maxPlanSteps = 10,
    enableReplanning = true,
    monitoringEnabled = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Plan-and-Execute Agent Development for ${agentName}`);

  // ============================================================================
  // PHASE 1: ARCHITECTURE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 1: Designing agent architecture');

  const architectureDesign = await ctx.task(architectureDesignTask, {
    agentName,
    plannerModel,
    executorModel,
    tools,
    maxPlanSteps,
    enableReplanning,
    outputDir
  });

  artifacts.push(...architectureDesign.artifacts);

  // ============================================================================
  // PHASE 2: PLANNER MODULE DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Developing planner module');

  const plannerModule = await ctx.task(plannerModuleTask, {
    agentName,
    plannerModel,
    architecture: architectureDesign.architecture,
    maxPlanSteps,
    outputDir
  });

  artifacts.push(...plannerModule.artifacts);

  // ============================================================================
  // PHASE 3: EXECUTOR MODULE DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Developing executor module');

  const executorModule = await ctx.task(executorModuleTask, {
    agentName,
    executorModel,
    tools,
    architecture: architectureDesign.architecture,
    outputDir
  });

  artifacts.push(...executorModule.artifacts);

  // ============================================================================
  // PHASE 4: REPLANNING LOGIC
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing replanning logic');

  const replanningLogic = await ctx.task(replanningLogicTask, {
    agentName,
    plannerModule: plannerModule.module,
    executorModule: executorModule.module,
    enableReplanning,
    outputDir
  });

  artifacts.push(...replanningLogic.artifacts);

  // ============================================================================
  // PHASE 5: MONITORING DASHBOARD
  // ============================================================================

  ctx.log('info', 'Phase 5: Setting up monitoring dashboard');

  const monitoringSetup = await ctx.task(monitoringDashboardTask, {
    agentName,
    monitoringEnabled,
    outputDir
  });

  artifacts.push(...monitoringSetup.artifacts);

  // ============================================================================
  // PHASE 6: INTEGRATION AND TESTING
  // ============================================================================

  ctx.log('info', 'Phase 6: Integrating and testing agent');

  const integration = await ctx.task(integrationTestingTask, {
    agentName,
    plannerModule: plannerModule.module,
    executorModule: executorModule.module,
    replanningLogic: replanningLogic.logic,
    outputDir
  });

  artifacts.push(...integration.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Plan-and-Execute Agent ${agentName} complete. Test pass rate: ${integration.testResults.passRate}%. Review final implementation?`,
    title: 'Plan-and-Execute Agent Review',
    context: {
      runId: ctx.runId,
      summary: {
        agentName,
        plannerModel,
        executorModel,
        toolCount: tools.length,
        testPassRate: integration.testResults.passRate
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'javascript' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    agentName,
    plannerModule: plannerModule.module,
    executorModule: executorModule.module,
    replanningLogic: replanningLogic.logic,
    monitoring: monitoringSetup.dashboard,
    testResults: integration.testResults,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/ai-agents-conversational/plan-and-execute-agent',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const architectureDesignTask = defineTask('architecture-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design Plan-and-Execute Architecture - ${args.agentName}`,
  agent: {
    name: 'plan-execute-planner',  // AG-AA-002: Creates hierarchical task decomposition and replanning logic
    prompt: {
      role: 'AI Agent Architect',
      task: 'Design hierarchical plan-and-execute agent architecture',
      context: args,
      instructions: [
        '1. Design high-level architecture with planner and executor separation',
        '2. Define communication protocol between planner and executor',
        '3. Design state management for plan tracking',
        '4. Define plan step schema and format',
        '5. Design replanning triggers and conditions',
        '6. Create component diagram',
        '7. Define interfaces between modules',
        '8. Document data flow',
        '9. Save architecture documentation'
      ],
      outputFormat: 'JSON with architecture design'
    },
    outputSchema: {
      type: 'object',
      required: ['architecture', 'artifacts'],
      properties: {
        architecture: { type: 'object' },
        componentDiagram: { type: 'string' },
        interfaces: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'plan-execute', 'architecture']
}));

export const plannerModuleTask = defineTask('planner-module', (args, taskCtx) => ({
  kind: 'skill',
  title: `Develop Planner Module - ${args.agentName}`,
  skill: {
    name: 'langgraph-routing',  // SK-LG-004: Conditional edge routing and state-based transitions
    prompt: {
      role: 'AI Planner Developer',
      task: 'Develop high-level planning module',
      context: args,
      instructions: [
        '1. Implement task decomposition logic',
        '2. Create plan generation prompts',
        '3. Define plan step schema (action, dependencies, expected output)',
        '4. Implement plan validation',
        '5. Add dependency resolution',
        '6. Implement plan optimization',
        '7. Add error handling for invalid plans',
        '8. Create plan serialization/deserialization',
        '9. Save planner module'
      ],
      outputFormat: 'JSON with planner module'
    },
    outputSchema: {
      type: 'object',
      required: ['module', 'artifacts'],
      properties: {
        module: { type: 'object' },
        plannerCodePath: { type: 'string' },
        promptTemplate: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'plan-execute', 'planner']
}));

export const executorModuleTask = defineTask('executor-module', (args, taskCtx) => ({
  kind: 'agent',
  title: `Develop Executor Module - ${args.agentName}`,
  agent: {
    name: 'executor-developer',
    prompt: {
      role: 'AI Executor Developer',
      task: 'Develop step execution module',
      context: args,
      instructions: [
        '1. Implement step execution logic',
        '2. Integrate tools for step execution',
        '3. Implement result capture and validation',
        '4. Add execution status tracking',
        '5. Implement retry logic for failed steps',
        '6. Add timeout handling',
        '7. Create execution context management',
        '8. Implement parallel execution where safe',
        '9. Save executor module'
      ],
      outputFormat: 'JSON with executor module'
    },
    outputSchema: {
      type: 'object',
      required: ['module', 'artifacts'],
      properties: {
        module: { type: 'object' },
        executorCodePath: { type: 'string' },
        toolIntegrations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'plan-execute', 'executor']
}));

export const replanningLogicTask = defineTask('replanning-logic', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Replanning Logic - ${args.agentName}`,
  agent: {
    name: 'state-machine-designer',  // AG-MEM-004: Creates dialogue state tracking and management
    prompt: {
      role: 'Replanning Logic Developer',
      task: 'Implement adaptive replanning based on execution results',
      context: args,
      instructions: [
        '1. Define replanning trigger conditions',
        '2. Implement execution result analysis',
        '3. Create plan update logic',
        '4. Handle step failures gracefully',
        '5. Implement plan recovery strategies',
        '6. Add replanning limits to prevent loops',
        '7. Create replanning decision tree',
        '8. Log replanning decisions',
        '9. Save replanning module'
      ],
      outputFormat: 'JSON with replanning logic'
    },
    outputSchema: {
      type: 'object',
      required: ['logic', 'artifacts'],
      properties: {
        logic: { type: 'object' },
        replanningCodePath: { type: 'string' },
        triggerConditions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'plan-execute', 'replanning']
}));

export const monitoringDashboardTask = defineTask('monitoring-dashboard', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Monitoring Dashboard - ${args.agentName}`,
  agent: {
    name: 'monitoring-specialist',
    prompt: {
      role: 'Monitoring Specialist',
      task: 'Setup monitoring dashboard for plan-and-execute agent',
      context: args,
      instructions: [
        '1. Define metrics to track (plan generation time, execution time, replanning count)',
        '2. Create dashboard layout',
        '3. Implement plan visualization',
        '4. Add execution progress tracking',
        '5. Create alerts for failures',
        '6. Implement logging integration',
        '7. Save dashboard configuration'
      ],
      outputFormat: 'JSON with monitoring dashboard'
    },
    outputSchema: {
      type: 'object',
      required: ['dashboard', 'artifacts'],
      properties: {
        dashboard: { type: 'object' },
        dashboardPath: { type: 'string' },
        metrics: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'plan-execute', 'monitoring']
}));

export const integrationTestingTask = defineTask('integration-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Integration Testing - ${args.agentName}`,
  agent: {
    name: 'integration-tester',
    prompt: {
      role: 'Integration Tester',
      task: 'Test integrated plan-and-execute agent',
      context: args,
      instructions: [
        '1. Create integration test suite',
        '2. Test plan generation with various inputs',
        '3. Test step execution',
        '4. Test replanning scenarios',
        '5. Test error recovery',
        '6. Measure end-to-end latency',
        '7. Calculate test pass rate',
        '8. Document test results',
        '9. Save test report'
      ],
      outputFormat: 'JSON with test results'
    },
    outputSchema: {
      type: 'object',
      required: ['testResults', 'artifacts'],
      properties: {
        testResults: {
          type: 'object',
          properties: {
            passRate: { type: 'number' },
            totalTests: { type: 'number' },
            passed: { type: 'number' },
            failed: { type: 'number' }
          }
        },
        testReportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'plan-execute', 'testing']
}));
