/**
 * @process specializations/cli-mcp-development/mcp-tool-implementation
 * @description MCP Tool Implementation - Design and implement a new MCP tool with JSON Schema validation,
 * execution logic, error handling, and comprehensive documentation for AI consumption.
 * @inputs { projectName: string, toolName: string, toolDescription: string, inputSchema: object, language?: string }
 * @outputs { success: boolean, toolDefinition: object, handlerCode: object, testCases: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cli-mcp-development/mcp-tool-implementation', {
 *   projectName: 'file-ops-mcp',
 *   toolName: 'read_file',
 *   toolDescription: 'Read contents of a file at the specified path',
 *   inputSchema: {
 *     type: 'object',
 *     properties: {
 *       path: { type: 'string', description: 'Absolute path to the file' }
 *     },
 *     required: ['path']
 *   }
 * });
 *
 * @references
 * - MCP Tools Concept: https://modelcontextprotocol.io/docs/concepts/tools
 * - JSON Schema: https://json-schema.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    toolName,
    toolDescription,
    inputSchema,
    language = 'typescript',
    rateLimiting = false,
    outputDir = 'mcp-tool-implementation'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting MCP Tool Implementation: ${toolName}`);
  ctx.log('info', `Project: ${projectName}`);

  // ============================================================================
  // PHASE 1: TOOL PURPOSE AND USE CASE DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining tool purpose and use cases');

  const toolDefinition = await ctx.task(toolDefinitionTask, {
    projectName,
    toolName,
    toolDescription,
    outputDir
  });

  artifacts.push(...toolDefinition.artifacts);

  // ============================================================================
  // PHASE 2: INPUT SCHEMA DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing input schema with JSON Schema');

  const schemaDesign = await ctx.task(schemaDesignTask, {
    projectName,
    toolName,
    inputSchema,
    outputDir
  });

  artifacts.push(...schemaDesign.artifacts);

  // ============================================================================
  // PHASE 3: PARAMETER VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing parameter validation');

  const parameterValidation = await ctx.task(parameterValidationTask, {
    projectName,
    toolName,
    inputSchema,
    schemaDesign,
    language,
    outputDir
  });

  artifacts.push(...parameterValidation.artifacts);

  // ============================================================================
  // PHASE 4: TOOL EXECUTION HANDLER
  // ============================================================================

  ctx.log('info', 'Phase 4: Creating tool execution handler');

  const executionHandler = await ctx.task(executionHandlerTask, {
    projectName,
    toolName,
    toolDescription,
    inputSchema,
    language,
    outputDir
  });

  artifacts.push(...executionHandler.artifacts);

  // Quality Gate: Tool Implementation Review
  await ctx.breakpoint({
    question: `Tool ${toolName} implementation created with ${Object.keys(inputSchema.properties || {}).length} parameters. Proceed with error handling and testing?`,
    title: 'Tool Implementation Review',
    context: {
      runId: ctx.runId,
      projectName,
      toolName,
      parameters: Object.keys(inputSchema.properties || {}),
      files: artifacts.slice(-3).map(a => ({ path: a.path, format: a.format || 'typescript' }))
    }
  });

  // ============================================================================
  // PHASE 5: ERROR HANDLING
  // ============================================================================

  ctx.log('info', 'Phase 5: Adding error handling with MCP error codes');

  const errorHandling = await ctx.task(errorHandlingTask, {
    projectName,
    toolName,
    language,
    outputDir
  });

  artifacts.push(...errorHandling.artifacts);

  // ============================================================================
  // PHASE 6: RESULT FORMATTING
  // ============================================================================

  ctx.log('info', 'Phase 6: Implementing result formatting');

  const resultFormatting = await ctx.task(resultFormattingTask, {
    projectName,
    toolName,
    language,
    outputDir
  });

  artifacts.push(...resultFormatting.artifacts);

  // ============================================================================
  // PHASE 7: RATE LIMITING (OPTIONAL)
  // ============================================================================

  if (rateLimiting) {
    ctx.log('info', 'Phase 7: Adding rate limiting');

    const rateLimitingConfig = await ctx.task(rateLimitingTask, {
      projectName,
      toolName,
      language,
      outputDir
    });

    artifacts.push(...rateLimitingConfig.artifacts);
  }

  // ============================================================================
  // PHASE 8: COMPREHENSIVE TESTS
  // ============================================================================

  ctx.log('info', 'Phase 8: Creating comprehensive tests');

  const testSuite = await ctx.task(testSuiteTask, {
    projectName,
    toolName,
    inputSchema,
    executionHandler,
    errorHandling,
    language,
    outputDir
  });

  artifacts.push(...testSuite.artifacts);

  // ============================================================================
  // PHASE 9: TOOL DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Writing tool documentation for AI consumption');

  const documentation = await ctx.task(documentationTask, {
    projectName,
    toolName,
    toolDescription,
    inputSchema,
    toolDefinition,
    schemaDesign,
    executionHandler,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // ============================================================================
  // PHASE 10: MCP CLIENT TESTING
  // ============================================================================

  ctx.log('info', 'Phase 10: Testing with MCP client');

  const clientTesting = await ctx.task(clientTestingTask, {
    projectName,
    toolName,
    inputSchema,
    language,
    outputDir
  });

  artifacts.push(...clientTesting.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `MCP Tool Implementation complete for ${toolName}. Tool ready for integration. Review and approve?`,
    title: 'MCP Tool Implementation Complete',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        toolName,
        parameters: Object.keys(inputSchema.properties || {}).length,
        testCases: testSuite.testCases.length,
        rateLimiting
      },
      files: [
        { path: documentation.toolDocPath, format: 'markdown', label: 'Tool Documentation' },
        { path: executionHandler.handlerPath, format: 'typescript', label: 'Tool Handler' },
        { path: schemaDesign.schemaPath, format: 'typescript', label: 'Input Schema' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    toolDefinition: {
      name: toolName,
      description: toolDescription,
      inputSchema: schemaDesign.finalSchema
    },
    handlerCode: {
      path: executionHandler.handlerPath,
      validation: parameterValidation.validationCode
    },
    errorHandling: errorHandling.errorHandlers,
    testCases: testSuite.testCases,
    documentation: {
      toolDoc: documentation.toolDocPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/cli-mcp-development/mcp-tool-implementation',
      timestamp: startTime,
      toolName,
      language
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const toolDefinitionTask = defineTask('tool-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Tool Definition - ${args.toolName}`,
  agent: {
    name: 'mcp-tool-designer',
    prompt: {
      role: 'MCP Tool Designer with expertise in AI-consumable API design',
      task: 'Define tool purpose and use cases',
      context: {
        projectName: args.projectName,
        toolName: args.toolName,
        toolDescription: args.toolDescription,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define clear tool purpose',
        '2. Identify primary use cases',
        '3. Define expected input scenarios',
        '4. Define expected output formats',
        '5. Identify edge cases',
        '6. Document limitations',
        '7. Generate tool definition document'
      ],
      outputFormat: 'JSON with tool definition'
    },
    outputSchema: {
      type: 'object',
      required: ['purpose', 'useCases', 'artifacts'],
      properties: {
        purpose: { type: 'string' },
        useCases: { type: 'array', items: { type: 'string' } },
        expectedInputs: { type: 'array', items: { type: 'object' } },
        expectedOutputs: { type: 'array', items: { type: 'object' } },
        limitations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp', 'tool', 'definition']
}));

export const schemaDesignTask = defineTask('schema-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Schema Design - ${args.toolName}`,
  agent: {
    name: 'mcp-tool-designer',
    prompt: {
      role: 'JSON Schema Designer',
      task: 'Design input schema with JSON Schema',
      context: {
        projectName: args.projectName,
        toolName: args.toolName,
        inputSchema: args.inputSchema,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Validate provided input schema',
        '2. Enhance property descriptions for AI clarity',
        '3. Add appropriate constraints (min, max, pattern)',
        '4. Define required vs optional properties',
        '5. Add default values where appropriate',
        '6. Add examples for each property',
        '7. Generate finalized JSON Schema'
      ],
      outputFormat: 'JSON with schema design'
    },
    outputSchema: {
      type: 'object',
      required: ['finalSchema', 'schemaPath', 'artifacts'],
      properties: {
        finalSchema: { type: 'object' },
        schemaPath: { type: 'string' },
        propertyDescriptions: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp', 'tool', 'schema']
}));

export const parameterValidationTask = defineTask('parameter-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Parameter Validation - ${args.toolName}`,
  agent: {
    name: 'mcp-tool-designer',
    prompt: {
      role: 'MCP Validation Specialist',
      task: 'Implement parameter validation',
      context: {
        projectName: args.projectName,
        toolName: args.toolName,
        inputSchema: args.inputSchema,
        schemaDesign: args.schemaDesign,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create validation function',
        '2. Validate required parameters',
        '3. Validate parameter types',
        '4. Validate constraints (min, max, pattern)',
        '5. Generate helpful error messages',
        '6. Generate validation code'
      ],
      outputFormat: 'JSON with validation code'
    },
    outputSchema: {
      type: 'object',
      required: ['validationCode', 'artifacts'],
      properties: {
        validationCode: { type: 'string' },
        validationRules: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp', 'tool', 'validation']
}));

export const executionHandlerTask = defineTask('execution-handler', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Execution Handler - ${args.toolName}`,
  agent: {
    name: 'mcp-tool-designer',
    prompt: {
      role: 'MCP Tool Implementation Specialist',
      task: 'Create tool execution handler',
      context: {
        projectName: args.projectName,
        toolName: args.toolName,
        toolDescription: args.toolDescription,
        inputSchema: args.inputSchema,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create tool handler function',
        '2. Extract and validate parameters',
        '3. Implement core tool logic',
        '4. Handle async operations properly',
        '5. Format success response',
        '6. Generate execution handler code'
      ],
      outputFormat: 'JSON with execution handler'
    },
    outputSchema: {
      type: 'object',
      required: ['handlerPath', 'artifacts'],
      properties: {
        handlerPath: { type: 'string' },
        handlerCode: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp', 'tool', 'handler']
}));

export const errorHandlingTask = defineTask('error-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Error Handling - ${args.toolName}`,
  agent: {
    name: 'mcp-tool-designer',
    prompt: {
      role: 'MCP Error Handling Specialist',
      task: 'Add error handling with MCP error codes',
      context: {
        projectName: args.projectName,
        toolName: args.toolName,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify potential error scenarios',
        '2. Map errors to MCP error codes',
        '3. Create descriptive error messages',
        '4. Implement try-catch blocks',
        '5. Handle validation errors',
        '6. Handle execution errors',
        '7. Generate error handling code'
      ],
      outputFormat: 'JSON with error handling'
    },
    outputSchema: {
      type: 'object',
      required: ['errorHandlers', 'artifacts'],
      properties: {
        errorHandlers: { type: 'array', items: { type: 'object' } },
        errorCodeMappings: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp', 'tool', 'error-handling']
}));

export const resultFormattingTask = defineTask('result-formatting', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Result Formatting - ${args.toolName}`,
  agent: {
    name: 'mcp-tool-designer',
    prompt: {
      role: 'MCP Result Formatting Specialist',
      task: 'Implement result formatting',
      context: {
        projectName: args.projectName,
        toolName: args.toolName,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define result content structure',
        '2. Format text content properly',
        '3. Handle binary content (images, files)',
        '4. Implement content type detection',
        '5. Format error responses',
        '6. Generate result formatting code'
      ],
      outputFormat: 'JSON with result formatting'
    },
    outputSchema: {
      type: 'object',
      required: ['formattingCode', 'artifacts'],
      properties: {
        formattingCode: { type: 'string' },
        contentTypes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp', 'tool', 'result-formatting']
}));

export const rateLimitingTask = defineTask('rate-limiting', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Rate Limiting - ${args.toolName}`,
  agent: {
    name: 'mcp-tool-designer',
    prompt: {
      role: 'MCP Rate Limiting Specialist',
      task: 'Add rate limiting',
      context: {
        projectName: args.projectName,
        toolName: args.toolName,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure rate limit thresholds',
        '2. Implement rate limiter',
        '3. Handle rate limit exceeded',
        '4. Add retry-after headers',
        '5. Generate rate limiting code'
      ],
      outputFormat: 'JSON with rate limiting'
    },
    outputSchema: {
      type: 'object',
      required: ['rateLimitConfig', 'artifacts'],
      properties: {
        rateLimitConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp', 'tool', 'rate-limiting']
}));

export const testSuiteTask = defineTask('test-suite', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Test Suite - ${args.toolName}`,
  agent: {
    name: 'mcp-testing-expert',
    prompt: {
      role: 'MCP Testing Specialist',
      task: 'Create comprehensive tests',
      context: {
        projectName: args.projectName,
        toolName: args.toolName,
        inputSchema: args.inputSchema,
        executionHandler: args.executionHandler,
        errorHandling: args.errorHandling,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create success scenario tests',
        '2. Create validation error tests',
        '3. Create execution error tests',
        '4. Test edge cases',
        '5. Test with various input combinations',
        '6. Generate test suite'
      ],
      outputFormat: 'JSON with test suite'
    },
    outputSchema: {
      type: 'object',
      required: ['testCases', 'testFilePath', 'artifacts'],
      properties: {
        testCases: { type: 'array', items: { type: 'object' } },
        testFilePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp', 'tool', 'testing']
}));

export const documentationTask = defineTask('documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Documentation - ${args.toolName}`,
  agent: {
    name: 'mcp-tool-documenter',
    prompt: {
      role: 'MCP Tool Documentation Specialist',
      task: 'Write tool documentation for AI consumption',
      context: {
        projectName: args.projectName,
        toolName: args.toolName,
        toolDescription: args.toolDescription,
        inputSchema: args.inputSchema,
        toolDefinition: args.toolDefinition,
        schemaDesign: args.schemaDesign,
        executionHandler: args.executionHandler,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Write clear tool purpose description',
        '2. Document all parameters with examples',
        '3. Document return value format',
        '4. Add usage examples for AI',
        '5. Document error scenarios',
        '6. Document rate limits if applicable',
        '7. Generate documentation files'
      ],
      outputFormat: 'JSON with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['toolDocPath', 'artifacts'],
      properties: {
        toolDocPath: { type: 'string' },
        examples: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp', 'tool', 'documentation']
}));

export const clientTestingTask = defineTask('client-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Client Testing - ${args.toolName}`,
  agent: {
    name: 'mcp-testing-expert',
    prompt: {
      role: 'MCP Integration Tester',
      task: 'Test with MCP client',
      context: {
        projectName: args.projectName,
        toolName: args.toolName,
        inputSchema: args.inputSchema,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create MCP client test setup',
        '2. Test tool discovery (list tools)',
        '3. Test tool invocation',
        '4. Test error responses',
        '5. Verify response format',
        '6. Generate integration test'
      ],
      outputFormat: 'JSON with client testing'
    },
    outputSchema: {
      type: 'object',
      required: ['integrationTestPath', 'artifacts'],
      properties: {
        integrationTestPath: { type: 'string' },
        testScenarios: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp', 'tool', 'integration-testing']
}));
