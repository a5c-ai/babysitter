/**
 * @process specializations/ai-agents-conversational/react-agent-implementation
 * @description ReAct Agent Implementation - Process for implementing a ReAct (Reasoning and Acting) agent that interleaves
 * thought-action-observation loops for multi-step reasoning tasks with explicit reasoning traces, tool integration, and evaluation metrics.
 * @inputs { agentName?: string, tools?: array, llmProvider?: string, useCase?: string, maxIterations?: number, outputDir?: string }
 * @outputs { success: boolean, agentImplementation: object, reasoningTraces: array, evaluationMetrics: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ai-agents-conversational/react-agent-implementation', {
 *   agentName: 'research-assistant',
 *   tools: ['web-search', 'calculator', 'code-executor'],
 *   llmProvider: 'openai',
 *   useCase: 'Research and information gathering',
 *   maxIterations: 10
 * });
 *
 * @references
 * - ReAct Paper: https://arxiv.org/abs/2210.03629
 * - LangChain ReAct Agent: https://python.langchain.com/docs/modules/agents/agent_types/react
 * - OpenAI Function Calling: https://platform.openai.com/docs/guides/function-calling
 * - Anthropic Tool Use: https://docs.anthropic.com/claude/docs/tool-use
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    agentName = 'react-agent',
    tools = ['search', 'calculator'],
    llmProvider = 'openai',
    useCase = 'general-purpose reasoning',
    maxIterations = 10,
    outputDir = 'react-agent-output',
    framework = 'langchain',
    enableTracing = true,
    selfReflection = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting ReAct Agent Implementation for ${agentName}`);

  // ============================================================================
  // PHASE 1: REQUIREMENTS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing agent requirements and use case');

  const requirementsAnalysis = await ctx.task(requirementsAnalysisTask, {
    agentName,
    tools,
    llmProvider,
    useCase,
    maxIterations,
    outputDir
  });

  artifacts.push(...requirementsAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: TOOL DEFINITION AND SCHEMA DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Defining tools and schemas');

  const toolDefinition = await ctx.task(toolDefinitionTask, {
    agentName,
    tools: requirementsAnalysis.refinedTools,
    llmProvider,
    framework,
    outputDir
  });

  artifacts.push(...toolDefinition.artifacts);

  // ============================================================================
  // PHASE 3: REACT PROMPT ENGINEERING
  // ============================================================================

  ctx.log('info', 'Phase 3: Engineering ReAct prompts');

  const promptEngineering = await ctx.task(reactPromptEngineeringTask, {
    agentName,
    useCase,
    tools: toolDefinition.toolDefinitions,
    llmProvider,
    selfReflection,
    outputDir
  });

  artifacts.push(...promptEngineering.artifacts);

  // ============================================================================
  // PHASE 4: AGENT IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing ReAct agent');

  const agentImplementation = await ctx.task(agentImplementationTask, {
    agentName,
    toolDefinitions: toolDefinition.toolDefinitions,
    prompts: promptEngineering.prompts,
    llmProvider,
    framework,
    maxIterations,
    enableTracing,
    outputDir
  });

  artifacts.push(...agentImplementation.artifacts);

  // Quality Gate: Implementation Review
  await ctx.breakpoint({
    question: `ReAct agent ${agentName} implementation complete. Review agent code and configuration before testing?`,
    title: 'Agent Implementation Review',
    context: {
      runId: ctx.runId,
      summary: {
        agentName,
        toolCount: toolDefinition.toolDefinitions.length,
        framework,
        llmProvider
      },
      files: agentImplementation.artifacts.map(a => ({ path: a.path, format: a.format || 'javascript' }))
    }
  });

  // ============================================================================
  // PHASE 5: REASONING TRACE TESTING
  // ============================================================================

  ctx.log('info', 'Phase 5: Testing reasoning traces');

  const tracesTesting = await ctx.task(reasoningTracesTestingTask, {
    agentName,
    agentImplementation: agentImplementation.agentCode,
    testCases: requirementsAnalysis.testCases,
    outputDir
  });

  artifacts.push(...tracesTesting.artifacts);

  // ============================================================================
  // PHASE 6: EVALUATION AND METRICS
  // ============================================================================

  ctx.log('info', 'Phase 6: Evaluating agent performance');

  const evaluation = await ctx.task(agentEvaluationTask, {
    agentName,
    tracesResults: tracesTesting.results,
    testCases: requirementsAnalysis.testCases,
    outputDir
  });

  artifacts.push(...evaluation.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `ReAct Agent ${agentName} implementation and evaluation complete. Success rate: ${evaluation.metrics.successRate}%. Review final results?`,
    title: 'Final ReAct Agent Review',
    context: {
      runId: ctx.runId,
      summary: {
        agentName,
        successRate: evaluation.metrics.successRate,
        avgIterations: evaluation.metrics.avgIterations,
        avgLatency: evaluation.metrics.avgLatency
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    agentName,
    agentImplementation: {
      framework,
      llmProvider,
      toolCount: toolDefinition.toolDefinitions.length,
      agentCodePath: agentImplementation.agentCodePath,
      configPath: agentImplementation.configPath
    },
    reasoningTraces: tracesTesting.results,
    evaluationMetrics: evaluation.metrics,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/ai-agents-conversational/react-agent-implementation',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const requirementsAnalysisTask = defineTask('requirements-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze ReAct Agent Requirements - ${args.agentName}`,
  agent: {
    name: 'react-agent-architect',  // AG-AA-001: Designs ReAct agent loops with thought-action-observation patterns
    prompt: {
      role: 'AI Agent Architect specializing in ReAct agents',
      task: 'Analyze requirements for ReAct agent implementation',
      context: args,
      instructions: [
        '1. Analyze the use case and identify required capabilities',
        '2. Refine the list of tools needed for the agent',
        '3. Define tool input/output schemas',
        '4. Identify reasoning patterns needed (search, compute, verify)',
        '5. Define success criteria for the agent',
        '6. Create test cases for validation',
        '7. Document expected reasoning traces',
        '8. Identify potential failure modes',
        '9. Recommend LLM configuration (temperature, max tokens)',
        '10. Save requirements document'
      ],
      outputFormat: 'JSON with requirements analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['refinedTools', 'testCases', 'artifacts'],
      properties: {
        refinedTools: { type: 'array', items: { type: 'object' } },
        capabilities: { type: 'array', items: { type: 'string' } },
        testCases: { type: 'array', items: { type: 'object' } },
        successCriteria: { type: 'array', items: { type: 'string' } },
        llmConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'react', 'requirements']
}));

export const toolDefinitionTask = defineTask('tool-definition', (args, taskCtx) => ({
  kind: 'skill',
  title: `Define Tools for ${args.agentName}`,
  skill: {
    name: 'langchain-tools',  // SK-LC-004: LangChain tool creation and integration utilities
    prompt: {
      role: 'AI Tool Designer',
      task: 'Define tool schemas and implementations for ReAct agent',
      context: args,
      instructions: [
        '1. Create detailed tool definitions with names and descriptions',
        '2. Define input schemas using JSON Schema',
        '3. Define output schemas',
        '4. Implement tool execution logic (mock or real)',
        '5. Add error handling for each tool',
        '6. Create tool documentation',
        '7. Define rate limits and safety constraints',
        '8. Format for target framework (LangChain, OpenAI, etc.)',
        '9. Save tool definitions to output directory'
      ],
      outputFormat: 'JSON with tool definitions'
    },
    outputSchema: {
      type: 'object',
      required: ['toolDefinitions', 'artifacts'],
      properties: {
        toolDefinitions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              inputSchema: { type: 'object' },
              outputSchema: { type: 'object' }
            }
          }
        },
        toolsCodePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'react', 'tools']
}));

export const reactPromptEngineeringTask = defineTask('react-prompt-engineering', (args, taskCtx) => ({
  kind: 'skill',
  title: `Engineer ReAct Prompts - ${args.agentName}`,
  skill: {
    name: 'chain-of-thought-prompts',  // SK-PE-003: Chain-of-thought and step-by-step reasoning prompts
    prompt: {
      role: 'Prompt Engineer specializing in ReAct agents',
      task: 'Design ReAct prompts with thought-action-observation pattern',
      context: args,
      instructions: [
        '1. Design system prompt establishing ReAct pattern',
        '2. Include Thought-Action-Observation loop instructions',
        '3. Define action format (tool name, tool input)',
        '4. Add tool descriptions to prompt',
        '5. Include few-shot examples of reasoning traces',
        '6. Add self-reflection instructions if enabled',
        '7. Define stopping conditions (Final Answer)',
        '8. Add error recovery instructions',
        '9. Include safety guardrails',
        '10. Save prompts to output directory'
      ],
      outputFormat: 'JSON with prompt templates'
    },
    outputSchema: {
      type: 'object',
      required: ['prompts', 'artifacts'],
      properties: {
        prompts: {
          type: 'object',
          properties: {
            systemPrompt: { type: 'string' },
            fewShotExamples: { type: 'array' },
            errorRecoveryPrompt: { type: 'string' }
          }
        },
        promptTemplatePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'react', 'prompts']
}));

export const agentImplementationTask = defineTask('agent-implementation', (args, taskCtx) => ({
  kind: 'skill',
  title: `Implement ReAct Agent - ${args.agentName}`,
  skill: {
    name: 'langchain-react-agent',  // SK-LC-001: LangChain ReAct agent implementation with tool binding
    prompt: {
      role: 'AI Agent Developer',
      task: 'Implement ReAct agent with full reasoning loop',
      context: args,
      instructions: [
        '1. Set up agent framework (LangChain, LlamaIndex, custom)',
        '2. Configure LLM provider and model',
        '3. Register tools with the agent',
        '4. Implement reasoning loop (Thought -> Action -> Observation)',
        '5. Add iteration limit and stopping conditions',
        '6. Implement tracing/logging for debugging',
        '7. Add error handling and retries',
        '8. Implement memory if needed',
        '9. Create agent entry point and API',
        '10. Save implementation to output directory'
      ],
      outputFormat: 'JSON with agent implementation details'
    },
    outputSchema: {
      type: 'object',
      required: ['agentCode', 'agentCodePath', 'artifacts'],
      properties: {
        agentCode: { type: 'string' },
        agentCodePath: { type: 'string' },
        configPath: { type: 'string' },
        dependencies: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'react', 'implementation']
}));

export const reasoningTracesTestingTask = defineTask('reasoning-traces-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test Reasoning Traces - ${args.agentName}`,
  agent: {
    name: 'agent-tester',
    prompt: {
      role: 'AI Agent Tester',
      task: 'Test ReAct agent reasoning traces and validate behavior',
      context: args,
      instructions: [
        '1. Execute agent on each test case',
        '2. Capture full reasoning traces',
        '3. Validate thought-action-observation pattern',
        '4. Check tool usage correctness',
        '5. Verify final answers match expected',
        '6. Measure iteration counts',
        '7. Identify reasoning failures',
        '8. Document edge cases and failures',
        '9. Generate trace visualization',
        '10. Save test results'
      ],
      outputFormat: 'JSON with test results and traces'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'artifacts'],
      properties: {
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testCase: { type: 'string' },
              passed: { type: 'boolean' },
              iterations: { type: 'number' },
              trace: { type: 'array' }
            }
          }
        },
        passRate: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'react', 'testing']
}));

export const agentEvaluationTask = defineTask('agent-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Evaluate ReAct Agent - ${args.agentName}`,
  agent: {
    name: 'agent-evaluator',  // AG-SAF-004: Designs evaluation frameworks and benchmarks
    prompt: {
      role: 'AI Agent Evaluator',
      task: 'Evaluate ReAct agent performance and generate metrics',
      context: args,
      instructions: [
        '1. Calculate success rate across test cases',
        '2. Measure average iterations to completion',
        '3. Calculate average latency',
        '4. Analyze tool usage patterns',
        '5. Evaluate reasoning quality (LLM-as-judge)',
        '6. Identify common failure patterns',
        '7. Generate performance report',
        '8. Provide improvement recommendations',
        '9. Compare to baseline if available',
        '10. Save evaluation report'
      ],
      outputFormat: 'JSON with evaluation metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'artifacts'],
      properties: {
        metrics: {
          type: 'object',
          properties: {
            successRate: { type: 'number' },
            avgIterations: { type: 'number' },
            avgLatency: { type: 'number' },
            toolUsageAccuracy: { type: 'number' },
            reasoningQuality: { type: 'number' }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'react', 'evaluation']
}));
