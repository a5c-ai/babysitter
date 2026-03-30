/**
 * @process specializations/ai-agents-conversational/function-calling-agent
 * @description Function Calling Agent with Tool Integration - Process for building agents with function calling capabilities
 * including tool definition, input validation, parallel execution, error handling, and result aggregation.
 * @inputs { agentName?: string, tools?: array, llmProvider?: string, parallelExecution?: boolean, outputDir?: string }
 * @outputs { success: boolean, toolDefinitions: array, functionCallingLogic: object, errorHandlers: object, integrationTests: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ai-agents-conversational/function-calling-agent', {
 *   agentName: 'data-analyst-agent',
 *   tools: ['query_database', 'create_chart', 'send_email'],
 *   llmProvider: 'openai',
 *   parallelExecution: true
 * });
 *
 * @references
 * - OpenAI Function Calling: https://platform.openai.com/docs/guides/function-calling
 * - Anthropic Tool Use: https://docs.anthropic.com/claude/docs/tool-use
 * - LangChain Tools: https://python.langchain.com/docs/modules/agents/tools/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    agentName = 'function-calling-agent',
    tools = [],
    llmProvider = 'openai',
    parallelExecution = true,
    outputDir = 'function-calling-output',
    maxRetries = 3,
    timeout = 30000
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Function Calling Agent Development for ${agentName}`);

  // ============================================================================
  // PHASE 1: TOOL SPECIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Specifying tools');

  const toolSpecification = await ctx.task(toolSpecificationTask, {
    agentName,
    tools,
    llmProvider,
    outputDir
  });

  artifacts.push(...toolSpecification.artifacts);

  // ============================================================================
  // PHASE 2: INPUT VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Implementing input validation');

  const inputValidation = await ctx.task(inputValidationTask, {
    agentName,
    toolDefinitions: toolSpecification.definitions,
    outputDir
  });

  artifacts.push(...inputValidation.artifacts);

  // ============================================================================
  // PHASE 3: FUNCTION EXECUTION LOGIC
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing function execution');

  const executionLogic = await ctx.task(functionExecutionTask, {
    agentName,
    toolDefinitions: toolSpecification.definitions,
    parallelExecution,
    timeout,
    outputDir
  });

  artifacts.push(...executionLogic.artifacts);

  // ============================================================================
  // PHASE 4: ERROR HANDLING
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing error handling');

  const errorHandling = await ctx.task(errorHandlingTask, {
    agentName,
    toolDefinitions: toolSpecification.definitions,
    maxRetries,
    outputDir
  });

  artifacts.push(...errorHandling.artifacts);

  // ============================================================================
  // PHASE 5: RESULT AGGREGATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing result aggregation');

  const resultAggregation = await ctx.task(resultAggregationTask, {
    agentName,
    parallelExecution,
    outputDir
  });

  artifacts.push(...resultAggregation.artifacts);

  // ============================================================================
  // PHASE 6: INTEGRATION TESTING
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating integration tests');

  const integrationTests = await ctx.task(integrationTestsTask, {
    agentName,
    toolDefinitions: toolSpecification.definitions,
    outputDir
  });

  artifacts.push(...integrationTests.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Function calling agent ${agentName} complete. ${toolSpecification.definitions.length} tools configured. Review implementation?`,
    title: 'Function Calling Agent Review',
    context: {
      runId: ctx.runId,
      summary: {
        agentName,
        toolCount: toolSpecification.definitions.length,
        llmProvider,
        parallelExecution,
        testCount: integrationTests.tests.length
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'javascript' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    agentName,
    toolDefinitions: toolSpecification.definitions,
    functionCallingLogic: executionLogic.logic,
    errorHandlers: errorHandling.handlers,
    integrationTests: integrationTests.tests,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/ai-agents-conversational/function-calling-agent',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const toolSpecificationTask = defineTask('tool-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Specify Tools - ${args.agentName}`,
  agent: {
    name: 'function-calling-architect',  // AG-TU-001: Creates function calling schemas with JSON schema validation
    prompt: {
      role: 'Tool Architect',
      task: 'Specify tools for function calling agent',
      context: args,
      instructions: [
        '1. Create detailed tool definitions',
        '2. Define JSON schemas for parameters',
        '3. Write clear tool descriptions for LLM',
        '4. Define required vs optional parameters',
        '5. Add parameter examples',
        '6. Format for target LLM provider',
        '7. Document return value schemas',
        '8. Save tool specifications'
      ],
      outputFormat: 'JSON with tool definitions'
    },
    outputSchema: {
      type: 'object',
      required: ['definitions', 'artifacts'],
      properties: {
        definitions: { type: 'array' },
        schemas: { type: 'object' },
        specPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'function-calling', 'tools']
}));

export const inputValidationTask = defineTask('input-validation', (args, taskCtx) => ({
  kind: 'skill',
  title: `Implement Input Validation - ${args.agentName}`,
  skill: {
    name: 'function-calling-schemas',  // SK-TU-001: Function calling schema templates for various APIs
    prompt: {
      role: 'Input Validation Developer',
      task: 'Implement input validation for function calls',
      context: args,
      instructions: [
        '1. Create validation for each tool',
        '2. Validate parameter types',
        '3. Validate required parameters',
        '4. Check parameter constraints',
        '5. Sanitize inputs for security',
        '6. Generate helpful error messages',
        '7. Handle type coercion',
        '8. Save validation logic'
      ],
      outputFormat: 'JSON with validation logic'
    },
    outputSchema: {
      type: 'object',
      required: ['validators', 'artifacts'],
      properties: {
        validators: { type: 'object' },
        validationCodePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'function-calling', 'validation']
}));

export const functionExecutionTask = defineTask('function-execution', (args, taskCtx) => ({
  kind: 'skill',
  title: `Implement Function Execution - ${args.agentName}`,
  skill: {
    name: 'langchain-tools',  // SK-LC-004: LangChain tool creation and integration utilities
    prompt: {
      role: 'Function Execution Developer',
      task: 'Implement function calling execution logic',
      context: args,
      instructions: [
        '1. Parse function call from LLM response',
        '2. Route to correct tool handler',
        '3. Implement parallel execution if enabled',
        '4. Add timeout handling',
        '5. Capture execution results',
        '6. Format results for LLM consumption',
        '7. Handle streaming responses',
        '8. Save execution logic'
      ],
      outputFormat: 'JSON with execution logic'
    },
    outputSchema: {
      type: 'object',
      required: ['logic', 'artifacts'],
      properties: {
        logic: { type: 'object' },
        executionCodePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'function-calling', 'execution']
}));

export const errorHandlingTask = defineTask('error-handling-fc', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Error Handling - ${args.agentName}`,
  agent: {
    name: 'error-handler-developer',
    prompt: {
      role: 'Error Handling Developer',
      task: 'Implement error handling for function calls',
      context: args,
      instructions: [
        '1. Define error types',
        '2. Implement retry logic with backoff',
        '3. Handle tool-specific errors',
        '4. Create fallback strategies',
        '5. Format errors for LLM',
        '6. Add error logging',
        '7. Implement circuit breaker',
        '8. Save error handlers'
      ],
      outputFormat: 'JSON with error handlers'
    },
    outputSchema: {
      type: 'object',
      required: ['handlers', 'artifacts'],
      properties: {
        handlers: { type: 'object' },
        errorCodePath: { type: 'string' },
        retryConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'function-calling', 'error-handling']
}));

export const resultAggregationTask = defineTask('result-aggregation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Result Aggregation - ${args.agentName}`,
  agent: {
    name: 'aggregation-developer',
    prompt: {
      role: 'Result Aggregation Developer',
      task: 'Implement result aggregation for parallel calls',
      context: args,
      instructions: [
        '1. Collect results from parallel calls',
        '2. Handle partial failures',
        '3. Order results appropriately',
        '4. Merge related results',
        '5. Format aggregated results',
        '6. Handle timeout on aggregation',
        '7. Create result summaries',
        '8. Save aggregation logic'
      ],
      outputFormat: 'JSON with aggregation logic'
    },
    outputSchema: {
      type: 'object',
      required: ['aggregator', 'artifacts'],
      properties: {
        aggregator: { type: 'object' },
        aggregationCodePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'function-calling', 'aggregation']
}));

export const integrationTestsTask = defineTask('integration-tests-fc', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create Integration Tests - ${args.agentName}`,
  agent: {
    name: 'test-developer',
    prompt: {
      role: 'Integration Test Developer',
      task: 'Create integration tests for function calling',
      context: args,
      instructions: [
        '1. Create tests for each tool',
        '2. Test valid inputs',
        '3. Test invalid inputs',
        '4. Test error handling',
        '5. Test parallel execution',
        '6. Test timeout handling',
        '7. Create mock tool implementations',
        '8. Save test suite'
      ],
      outputFormat: 'JSON with integration tests'
    },
    outputSchema: {
      type: 'object',
      required: ['tests', 'artifacts'],
      properties: {
        tests: { type: 'array' },
        testSuitePath: { type: 'string' },
        mocks: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'function-calling', 'testing']
}));
