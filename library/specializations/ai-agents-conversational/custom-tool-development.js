/**
 * @process specializations/ai-agents-conversational/custom-tool-development
 * @description Custom Tool Development for Agents - Process for creating custom tools and functions for AI agents
 * including API integrations, database queries, code execution sandboxes, and web browsing capabilities.
 * @inputs { toolName?: string, toolType?: string, apiSpecs?: object, securityLevel?: string, outputDir?: string }
 * @outputs { success: boolean, toolImplementation: object, apiWrapper: object, securityControls: object, documentation: string, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ai-agents-conversational/custom-tool-development', {
 *   toolName: 'customer-database-query',
 *   toolType: 'database',
 *   apiSpecs: { type: 'postgres', queries: ['select', 'insert'] },
 *   securityLevel: 'high'
 * });
 *
 * @references
 * - LangChain Custom Tools: https://python.langchain.com/docs/modules/agents/tools/custom_tools
 * - Tool Design Patterns: https://docs.anthropic.com/claude/docs/tool-use-best-practices
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    toolName = 'custom-tool',
    toolType = 'api',
    apiSpecs = {},
    securityLevel = 'medium',
    outputDir = 'custom-tool-output',
    sandboxed = true,
    rateLimited = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Custom Tool Development for ${toolName}`);

  // ============================================================================
  // PHASE 1: TOOL DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 1: Designing tool');

  const toolDesign = await ctx.task(toolDesignTask, {
    toolName,
    toolType,
    apiSpecs,
    outputDir
  });

  artifacts.push(...toolDesign.artifacts);

  // ============================================================================
  // PHASE 2: API WRAPPER IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Implementing API wrapper');

  const apiWrapper = await ctx.task(apiWrapperTask, {
    toolName,
    toolDesign: toolDesign.design,
    apiSpecs,
    outputDir
  });

  artifacts.push(...apiWrapper.artifacts);

  // ============================================================================
  // PHASE 3: SECURITY CONTROLS
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing security controls');

  const securityControls = await ctx.task(securityControlsTask, {
    toolName,
    securityLevel,
    sandboxed,
    rateLimited,
    outputDir
  });

  artifacts.push(...securityControls.artifacts);

  // ============================================================================
  // PHASE 4: SANDBOX IMPLEMENTATION
  // ============================================================================

  let sandboxImpl = null;
  if (sandboxed && toolType === 'code-execution') {
    ctx.log('info', 'Phase 4: Implementing sandbox');

    sandboxImpl = await ctx.task(sandboxImplementationTask, {
      toolName,
      securityLevel,
      outputDir
    });

    artifacts.push(...sandboxImpl.artifacts);
  }

  // ============================================================================
  // PHASE 5: TOOL INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Integrating tool');

  const toolIntegration = await ctx.task(toolIntegrationTask, {
    toolName,
    toolDesign: toolDesign.design,
    apiWrapper: apiWrapper.wrapper,
    securityControls: securityControls.controls,
    sandbox: sandboxImpl,
    outputDir
  });

  artifacts.push(...toolIntegration.artifacts);

  // ============================================================================
  // PHASE 6: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating documentation');

  const documentation = await ctx.task(toolDocumentationTask, {
    toolName,
    toolDesign: toolDesign.design,
    apiSpecs,
    securityLevel,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Custom tool ${toolName} development complete. Type: ${toolType}, Security: ${securityLevel}. Review implementation?`,
    title: 'Custom Tool Review',
    context: {
      runId: ctx.runId,
      summary: {
        toolName,
        toolType,
        securityLevel,
        sandboxed,
        rateLimited
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'javascript' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    toolName,
    toolImplementation: toolIntegration.implementation,
    apiWrapper: apiWrapper.wrapper,
    securityControls: securityControls.controls,
    documentation: documentation.docs,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/ai-agents-conversational/custom-tool-development',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const toolDesignTask = defineTask('tool-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design Tool - ${args.toolName}`,
  agent: {
    name: 'tool-use-planner',  // AG-TU-002: Plans tool selection strategies and chains for complex tasks
    prompt: {
      role: 'Tool Designer',
      task: 'Design custom tool for AI agent',
      context: args,
      instructions: [
        '1. Define tool purpose and capabilities',
        '2. Design input/output schema',
        '3. Identify required dependencies',
        '4. Define error conditions',
        '5. Plan authentication requirements',
        '6. Design rate limiting strategy',
        '7. Document tool limitations',
        '8. Save tool design'
      ],
      outputFormat: 'JSON with tool design'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'artifacts'],
      properties: {
        design: { type: 'object' },
        inputSchema: { type: 'object' },
        outputSchema: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'custom-tool', 'design']
}));

export const apiWrapperTask = defineTask('api-wrapper', (args, taskCtx) => ({
  kind: 'skill',
  title: `Implement API Wrapper - ${args.toolName}`,
  skill: {
    name: 'langchain-tools',  // SK-LC-004: LangChain tool creation and integration utilities
    prompt: {
      role: 'API Developer',
      task: 'Implement API wrapper for tool',
      context: args,
      instructions: [
        '1. Create API client',
        '2. Implement authentication',
        '3. Handle request/response formatting',
        '4. Add retry logic',
        '5. Implement error mapping',
        '6. Add request logging',
        '7. Handle pagination if needed',
        '8. Save API wrapper'
      ],
      outputFormat: 'JSON with API wrapper'
    },
    outputSchema: {
      type: 'object',
      required: ['wrapper', 'artifacts'],
      properties: {
        wrapper: { type: 'object' },
        wrapperCodePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'custom-tool', 'api']
}));

export const securityControlsTask = defineTask('security-controls', (args, taskCtx) => ({
  kind: 'skill',
  title: `Implement Security Controls - ${args.toolName}`,
  skill: {
    name: 'tool-safety-validation',  // SK-TU-002: Tool safety validation and permission checking
    prompt: {
      role: 'Security Developer',
      task: 'Implement security controls for tool',
      context: args,
      instructions: [
        '1. Implement input sanitization',
        '2. Add authentication checks',
        '3. Implement authorization',
        '4. Add rate limiting',
        '5. Create audit logging',
        '6. Implement data masking',
        '7. Add security headers',
        '8. Save security controls'
      ],
      outputFormat: 'JSON with security controls'
    },
    outputSchema: {
      type: 'object',
      required: ['controls', 'artifacts'],
      properties: {
        controls: { type: 'object' },
        securityCodePath: { type: 'string' },
        auditConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'custom-tool', 'security']
}));

export const sandboxImplementationTask = defineTask('sandbox-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Sandbox - ${args.toolName}`,
  agent: {
    name: 'sandbox-developer',
    prompt: {
      role: 'Sandbox Developer',
      task: 'Implement sandboxed execution environment',
      context: args,
      instructions: [
        '1. Configure isolated execution environment',
        '2. Set resource limits (CPU, memory, time)',
        '3. Restrict file system access',
        '4. Block network access if needed',
        '5. Implement output capture',
        '6. Add timeout enforcement',
        '7. Handle cleanup after execution',
        '8. Save sandbox configuration'
      ],
      outputFormat: 'JSON with sandbox implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['sandbox', 'artifacts'],
      properties: {
        sandbox: { type: 'object' },
        sandboxCodePath: { type: 'string' },
        resourceLimits: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'custom-tool', 'sandbox']
}));

export const toolIntegrationTask = defineTask('tool-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Integrate Tool - ${args.toolName}`,
  agent: {
    name: 'integration-developer',
    prompt: {
      role: 'Tool Integration Developer',
      task: 'Integrate tool components into complete implementation',
      context: args,
      instructions: [
        '1. Combine all tool components',
        '2. Create tool entry point',
        '3. Wire security controls',
        '4. Connect sandbox if applicable',
        '5. Add error handling',
        '6. Create tool factory',
        '7. Test integrated tool',
        '8. Save integrated tool'
      ],
      outputFormat: 'JSON with integrated tool'
    },
    outputSchema: {
      type: 'object',
      required: ['implementation', 'artifacts'],
      properties: {
        implementation: { type: 'object' },
        toolCodePath: { type: 'string' },
        testResults: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'custom-tool', 'integration']
}));

export const toolDocumentationTask = defineTask('tool-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Document Tool - ${args.toolName}`,
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Technical Writer',
      task: 'Create comprehensive tool documentation',
      context: args,
      instructions: [
        '1. Write tool description for LLM',
        '2. Document input parameters',
        '3. Document output format',
        '4. Add usage examples',
        '5. Document error codes',
        '6. Add security considerations',
        '7. Create integration guide',
        '8. Save documentation'
      ],
      outputFormat: 'JSON with documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['docs', 'artifacts'],
      properties: {
        docs: { type: 'string' },
        docsPath: { type: 'string' },
        llmDescription: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'custom-tool', 'documentation']
}));
