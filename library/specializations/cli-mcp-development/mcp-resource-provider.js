/**
 * @process specializations/cli-mcp-development/mcp-resource-provider
 * @description MCP Resource Provider - Implement MCP resource provider for exposing dynamic content to AI assistants
 * with URI schemes, resource listing, content fetching, and subscription support.
 * @inputs { projectName: string, resourceType: string, uriScheme: string, contentType?: string }
 * @outputs { success: boolean, resourceConfig: object, handlers: array, subscriptions: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cli-mcp-development/mcp-resource-provider', {
 *   projectName: 'docs-mcp',
 *   resourceType: 'documentation',
 *   uriScheme: 'docs://',
 *   contentType: 'text/markdown'
 * });
 *
 * @references
 * - MCP Resources: https://modelcontextprotocol.io/docs/concepts/resources
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    resourceType,
    uriScheme,
    contentType = 'text/plain',
    supportTemplates = true,
    supportSubscriptions = false,
    language = 'typescript',
    outputDir = 'mcp-resource-provider'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting MCP Resource Provider: ${resourceType}`);
  ctx.log('info', `URI Scheme: ${uriScheme}`);

  // ============================================================================
  // PHASE 1: RESOURCE URI SCHEME DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining resource URI scheme');

  const uriSchemeDesign = await ctx.task(uriSchemeDesignTask, {
    projectName,
    resourceType,
    uriScheme,
    outputDir
  });

  artifacts.push(...uriSchemeDesign.artifacts);

  // ============================================================================
  // PHASE 2: RESOURCE LISTING HANDLER
  // ============================================================================

  ctx.log('info', 'Phase 2: Implementing resource listing handler');

  const listingHandler = await ctx.task(listingHandlerTask, {
    projectName,
    resourceType,
    uriScheme,
    language,
    outputDir
  });

  artifacts.push(...listingHandler.artifacts);

  // ============================================================================
  // PHASE 3: RESOURCE CONTENT FETCHING
  // ============================================================================

  ctx.log('info', 'Phase 3: Creating resource content fetching');

  const contentFetching = await ctx.task(contentFetchingTask, {
    projectName,
    resourceType,
    uriScheme,
    contentType,
    language,
    outputDir
  });

  artifacts.push(...contentFetching.artifacts);

  // ============================================================================
  // PHASE 4: MIME TYPE DETECTION
  // ============================================================================

  ctx.log('info', 'Phase 4: Adding MIME type detection');

  const mimeTypeDetection = await ctx.task(mimeTypeDetectionTask, {
    projectName,
    contentType,
    language,
    outputDir
  });

  artifacts.push(...mimeTypeDetection.artifacts);

  // ============================================================================
  // PHASE 5: RESOURCE TEMPLATES
  // ============================================================================

  if (supportTemplates) {
    ctx.log('info', 'Phase 5: Implementing resource templates');

    const resourceTemplates = await ctx.task(resourceTemplatesTask, {
      projectName,
      uriScheme,
      language,
      outputDir
    });

    artifacts.push(...resourceTemplates.artifacts);
  }

  // Quality Gate: Resource Provider Review
  await ctx.breakpoint({
    question: `Resource provider for ${resourceType} created with ${uriScheme} scheme. Proceed with caching and subscription implementation?`,
    title: 'Resource Provider Review',
    context: {
      runId: ctx.runId,
      projectName,
      resourceType,
      uriScheme,
      files: artifacts.slice(-3).map(a => ({ path: a.path, format: a.format || 'typescript' }))
    }
  });

  // ============================================================================
  // PHASE 6: CACHING STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 6: Adding caching strategy');

  const cachingStrategy = await ctx.task(cachingStrategyTask, {
    projectName,
    resourceType,
    language,
    outputDir
  });

  artifacts.push(...cachingStrategy.artifacts);

  // ============================================================================
  // PHASE 7: LARGE CONTENT PAGINATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Handling large content with pagination');

  const paginationHandling = await ctx.task(paginationHandlingTask, {
    projectName,
    resourceType,
    language,
    outputDir
  });

  artifacts.push(...paginationHandling.artifacts);

  // ============================================================================
  // PHASE 8: SUBSCRIPTION SUPPORT
  // ============================================================================

  if (supportSubscriptions) {
    ctx.log('info', 'Phase 8: Implementing subscription for resource changes');

    const subscriptionSupport = await ctx.task(subscriptionSupportTask, {
      projectName,
      resourceType,
      language,
      outputDir
    });

    artifacts.push(...subscriptionSupport.artifacts);
  }

  // ============================================================================
  // PHASE 9: RESOURCE ACCESS TESTS
  // ============================================================================

  ctx.log('info', 'Phase 9: Creating tests for resource access');

  const resourceTests = await ctx.task(resourceTestsTask, {
    projectName,
    resourceType,
    uriScheme,
    listingHandler,
    contentFetching,
    language,
    outputDir
  });

  artifacts.push(...resourceTests.artifacts);

  // ============================================================================
  // PHASE 10: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Documenting resource patterns');

  const documentation = await ctx.task(documentationTask, {
    projectName,
    resourceType,
    uriScheme,
    contentType,
    uriSchemeDesign,
    listingHandler,
    contentFetching,
    supportTemplates,
    supportSubscriptions,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `MCP Resource Provider complete for ${resourceType}. Review and approve?`,
    title: 'MCP Resource Provider Complete',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        resourceType,
        uriScheme,
        contentType,
        supportTemplates,
        supportSubscriptions
      },
      files: [
        { path: documentation.resourceDocPath, format: 'markdown', label: 'Resource Documentation' },
        { path: listingHandler.handlerPath, format: 'typescript', label: 'Listing Handler' },
        { path: contentFetching.handlerPath, format: 'typescript', label: 'Content Handler' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    resourceConfig: {
      type: resourceType,
      uriScheme,
      contentType,
      templates: supportTemplates,
      subscriptions: supportSubscriptions
    },
    handlers: [
      { type: 'listing', path: listingHandler.handlerPath },
      { type: 'content', path: contentFetching.handlerPath }
    ],
    caching: cachingStrategy.config,
    subscriptions: supportSubscriptions ? { supported: true } : { supported: false },
    documentation: {
      resourceDoc: documentation.resourceDocPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/cli-mcp-development/mcp-resource-provider',
      timestamp: startTime,
      resourceType,
      uriScheme
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const uriSchemeDesignTask = defineTask('uri-scheme-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: URI Scheme Design - ${args.resourceType}`,
  agent: {
    name: 'mcp-resource-designer',
    prompt: {
      role: 'MCP Resource URI Designer',
      task: 'Define resource URI scheme',
      context: {
        projectName: args.projectName,
        resourceType: args.resourceType,
        uriScheme: args.uriScheme,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define URI scheme pattern',
        '2. Document URI path structure',
        '3. Define query parameter support',
        '4. Create URI parsing utilities',
        '5. Add URI validation',
        '6. Generate URI scheme documentation'
      ],
      outputFormat: 'JSON with URI scheme design'
    },
    outputSchema: {
      type: 'object',
      required: ['schemePattern', 'pathStructure', 'artifacts'],
      properties: {
        schemePattern: { type: 'string' },
        pathStructure: { type: 'object' },
        queryParams: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp', 'resource', 'uri-scheme']
}));

export const listingHandlerTask = defineTask('listing-handler', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Listing Handler - ${args.resourceType}`,
  agent: {
    name: 'mcp-resource-designer',
    prompt: {
      role: 'MCP Resource Listing Specialist',
      task: 'Implement resource listing handler',
      context: {
        projectName: args.projectName,
        resourceType: args.resourceType,
        uriScheme: args.uriScheme,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create ListResourcesRequestHandler',
        '2. Implement resource discovery',
        '3. Format resource metadata',
        '4. Add resource descriptions',
        '5. Include MIME types',
        '6. Generate listing handler code'
      ],
      outputFormat: 'JSON with listing handler'
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
  labels: ['mcp', 'resource', 'listing']
}));

export const contentFetchingTask = defineTask('content-fetching', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Content Fetching - ${args.resourceType}`,
  agent: {
    name: 'mcp-resource-designer',
    prompt: {
      role: 'MCP Resource Content Specialist',
      task: 'Create resource content fetching',
      context: {
        projectName: args.projectName,
        resourceType: args.resourceType,
        uriScheme: args.uriScheme,
        contentType: args.contentType,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create ReadResourceRequestHandler',
        '2. Parse resource URI',
        '3. Fetch resource content',
        '4. Handle text vs binary content',
        '5. Add error handling for missing resources',
        '6. Generate content fetching code'
      ],
      outputFormat: 'JSON with content fetching'
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
  labels: ['mcp', 'resource', 'content']
}));

export const mimeTypeDetectionTask = defineTask('mime-type-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: MIME Type Detection - ${args.projectName}`,
  agent: {
    name: 'mcp-resource-designer',
    prompt: {
      role: 'MCP Content Type Specialist',
      task: 'Add MIME type detection',
      context: {
        projectName: args.projectName,
        contentType: args.contentType,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create MIME type detection utility',
        '2. Handle common file types',
        '3. Support custom content types',
        '4. Add fallback detection',
        '5. Generate MIME detection code'
      ],
      outputFormat: 'JSON with MIME type detection'
    },
    outputSchema: {
      type: 'object',
      required: ['detectionCode', 'artifacts'],
      properties: {
        detectionCode: { type: 'string' },
        supportedTypes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp', 'resource', 'mime-type']
}));

export const resourceTemplatesTask = defineTask('resource-templates', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Resource Templates - ${args.projectName}`,
  agent: {
    name: 'mcp-resource-designer',
    prompt: {
      role: 'MCP Resource Template Designer',
      task: 'Implement resource templates (parameterized URIs)',
      context: {
        projectName: args.projectName,
        uriScheme: args.uriScheme,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define URI template patterns',
        '2. Create template parameter extraction',
        '3. Implement template resolution',
        '4. Add template listing',
        '5. Generate resource template code'
      ],
      outputFormat: 'JSON with resource templates'
    },
    outputSchema: {
      type: 'object',
      required: ['templates', 'artifacts'],
      properties: {
        templates: { type: 'array', items: { type: 'object' } },
        templateCode: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp', 'resource', 'templates']
}));

export const cachingStrategyTask = defineTask('caching-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Caching Strategy - ${args.resourceType}`,
  agent: {
    name: 'mcp-resource-designer',
    prompt: {
      role: 'MCP Caching Specialist',
      task: 'Add caching strategy',
      context: {
        projectName: args.projectName,
        resourceType: args.resourceType,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design caching strategy',
        '2. Implement in-memory cache',
        '3. Configure TTL settings',
        '4. Add cache invalidation',
        '5. Generate caching code'
      ],
      outputFormat: 'JSON with caching strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'artifacts'],
      properties: {
        config: { type: 'object' },
        cachingCode: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp', 'resource', 'caching']
}));

export const paginationHandlingTask = defineTask('pagination-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Pagination Handling - ${args.resourceType}`,
  agent: {
    name: 'mcp-resource-designer',
    prompt: {
      role: 'MCP Pagination Specialist',
      task: 'Handle large content with pagination',
      context: {
        projectName: args.projectName,
        resourceType: args.resourceType,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Detect large content',
        '2. Implement content chunking',
        '3. Add cursor-based pagination',
        '4. Handle partial content requests',
        '5. Generate pagination code'
      ],
      outputFormat: 'JSON with pagination handling'
    },
    outputSchema: {
      type: 'object',
      required: ['paginationConfig', 'artifacts'],
      properties: {
        paginationConfig: { type: 'object' },
        paginationCode: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp', 'resource', 'pagination']
}));

export const subscriptionSupportTask = defineTask('subscription-support', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Subscription Support - ${args.resourceType}`,
  agent: {
    name: 'mcp-resource-designer',
    prompt: {
      role: 'MCP Subscription Specialist',
      task: 'Implement subscription for resource changes',
      context: {
        projectName: args.projectName,
        resourceType: args.resourceType,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Implement resource change detection',
        '2. Create subscription handler',
        '3. Handle subscription management',
        '4. Send change notifications',
        '5. Generate subscription code'
      ],
      outputFormat: 'JSON with subscription support'
    },
    outputSchema: {
      type: 'object',
      required: ['subscriptionCode', 'artifacts'],
      properties: {
        subscriptionCode: { type: 'string' },
        changeDetection: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp', 'resource', 'subscriptions']
}));

export const resourceTestsTask = defineTask('resource-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Resource Tests - ${args.resourceType}`,
  agent: {
    name: 'mcp-testing-expert',
    prompt: {
      role: 'MCP Resource Testing Specialist',
      task: 'Create tests for resource access',
      context: {
        projectName: args.projectName,
        resourceType: args.resourceType,
        uriScheme: args.uriScheme,
        listingHandler: args.listingHandler,
        contentFetching: args.contentFetching,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Test resource listing',
        '2. Test content fetching',
        '3. Test URI parsing',
        '4. Test error scenarios',
        '5. Test caching behavior',
        '6. Generate test suite'
      ],
      outputFormat: 'JSON with resource tests'
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
  labels: ['mcp', 'resource', 'testing']
}));

export const documentationTask = defineTask('documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Documentation - ${args.resourceType}`,
  agent: {
    name: 'mcp-tool-documenter',
    prompt: {
      role: 'MCP Resource Documentation Specialist',
      task: 'Document resource patterns',
      context: {
        projectName: args.projectName,
        resourceType: args.resourceType,
        uriScheme: args.uriScheme,
        contentType: args.contentType,
        uriSchemeDesign: args.uriSchemeDesign,
        listingHandler: args.listingHandler,
        contentFetching: args.contentFetching,
        supportTemplates: args.supportTemplates,
        supportSubscriptions: args.supportSubscriptions,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Document URI scheme',
        '2. Document available resources',
        '3. Document content types',
        '4. Document template patterns',
        '5. Add usage examples',
        '6. Generate documentation files'
      ],
      outputFormat: 'JSON with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['resourceDocPath', 'artifacts'],
      properties: {
        resourceDocPath: { type: 'string' },
        examples: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp', 'resource', 'documentation']
}));
