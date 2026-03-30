/**
 * @process specializations/cli-mcp-development/mcp-transport-layer
 * @description MCP Transport Layer Implementation - Implement additional transport layers beyond stdio including HTTP/SSE
 * and WebSocket for web-based MCP servers with authentication and connection management.
 * @inputs { projectName: string, transportType: string, authMethod?: string, corsEnabled?: boolean }
 * @outputs { success: boolean, transportConfig: object, serverSetup: object, securityConfig: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cli-mcp-development/mcp-transport-layer', {
 *   projectName: 'web-mcp-server',
 *   transportType: 'http-sse',
 *   authMethod: 'bearer-token',
 *   corsEnabled: true
 * });
 *
 * @references
 * - MCP Transports: https://modelcontextprotocol.io/docs/concepts/transports
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    transportType = 'http-sse',
    authMethod = 'bearer-token',
    corsEnabled = true,
    healthCheckEnabled = true,
    language = 'typescript',
    outputDir = 'mcp-transport-layer'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting MCP Transport Layer Implementation: ${transportType}`);
  ctx.log('info', `Project: ${projectName}`);

  // ============================================================================
  // PHASE 1: TRANSPORT PROTOCOL SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 1: Selecting transport protocol based on use case');

  const protocolSelection = await ctx.task(protocolSelectionTask, {
    projectName,
    transportType,
    outputDir
  });

  artifacts.push(...protocolSelection.artifacts);

  // ============================================================================
  // PHASE 2: TRANSPORT SERVER IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Implementing transport server');

  const transportServer = await ctx.task(transportServerTask, {
    projectName,
    transportType,
    language,
    outputDir
  });

  artifacts.push(...transportServer.artifacts);

  // ============================================================================
  // PHASE 3: SSE ENDPOINT CONFIGURATION
  // ============================================================================

  if (transportType === 'http-sse' || transportType === 'sse') {
    ctx.log('info', 'Phase 3: Configuring SSE endpoint for server-to-client');

    const sseEndpoint = await ctx.task(sseEndpointTask, {
      projectName,
      language,
      outputDir
    });

    artifacts.push(...sseEndpoint.artifacts);
  }

  // ============================================================================
  // PHASE 4: POST ENDPOINT FOR CLIENT-TO-SERVER
  // ============================================================================

  ctx.log('info', 'Phase 4: Adding POST endpoint for client-to-server');

  const postEndpoint = await ctx.task(postEndpointTask, {
    projectName,
    transportType,
    language,
    outputDir
  });

  artifacts.push(...postEndpoint.artifacts);

  // ============================================================================
  // PHASE 5: CONNECTION MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing connection management');

  const connectionManagement = await ctx.task(connectionManagementTask, {
    projectName,
    transportType,
    language,
    outputDir
  });

  artifacts.push(...connectionManagement.artifacts);

  // Quality Gate: Transport Layer Review
  await ctx.breakpoint({
    question: `Transport layer ${transportType} implemented. Proceed with authentication and CORS configuration?`,
    title: 'Transport Layer Review',
    context: {
      runId: ctx.runId,
      projectName,
      transportType,
      files: artifacts.slice(-3).map(a => ({ path: a.path, format: a.format || 'typescript' }))
    }
  });

  // ============================================================================
  // PHASE 6: AUTHENTICATION AND AUTHORIZATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Adding authentication and authorization');

  const authConfig = await ctx.task(authConfigTask, {
    projectName,
    authMethod,
    language,
    outputDir
  });

  artifacts.push(...authConfig.artifacts);

  // ============================================================================
  // PHASE 7: CORS CONFIGURATION
  // ============================================================================

  if (corsEnabled) {
    ctx.log('info', 'Phase 7: Configuring CORS for web clients');

    const corsConfig = await ctx.task(corsConfigTask, {
      projectName,
      language,
      outputDir
    });

    artifacts.push(...corsConfig.artifacts);
  }

  // ============================================================================
  // PHASE 8: RECONNECTION HANDLING
  // ============================================================================

  ctx.log('info', 'Phase 8: Implementing reconnection handling');

  const reconnectionHandling = await ctx.task(reconnectionHandlingTask, {
    projectName,
    transportType,
    language,
    outputDir
  });

  artifacts.push(...reconnectionHandling.artifacts);

  // ============================================================================
  // PHASE 9: HEALTH CHECK ENDPOINT
  // ============================================================================

  if (healthCheckEnabled) {
    ctx.log('info', 'Phase 9: Adding health check endpoint');

    const healthCheck = await ctx.task(healthCheckTask, {
      projectName,
      language,
      outputDir
    });

    artifacts.push(...healthCheck.artifacts);
  }

  // ============================================================================
  // PHASE 10: INTEGRATION TESTS
  // ============================================================================

  ctx.log('info', 'Phase 10: Creating integration tests');

  const integrationTests = await ctx.task(integrationTestsTask, {
    projectName,
    transportType,
    authMethod,
    language,
    outputDir
  });

  artifacts.push(...integrationTests.artifacts);

  // ============================================================================
  // PHASE 11: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 11: Documenting transport configuration');

  const documentation = await ctx.task(documentationTask, {
    projectName,
    transportType,
    authMethod,
    corsEnabled,
    healthCheckEnabled,
    transportServer,
    authConfig,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `MCP Transport Layer Implementation complete for ${transportType}. Review and approve?`,
    title: 'MCP Transport Layer Complete',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        transportType,
        authMethod,
        corsEnabled,
        healthCheckEnabled
      },
      files: [
        { path: documentation.transportDocPath, format: 'markdown', label: 'Transport Documentation' },
        { path: transportServer.serverPath, format: 'typescript', label: 'Transport Server' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    transportConfig: {
      type: transportType,
      serverPath: transportServer.serverPath,
      endpoints: transportServer.endpoints
    },
    serverSetup: {
      framework: transportServer.framework,
      port: transportServer.port
    },
    securityConfig: {
      authMethod,
      corsEnabled,
      authMiddleware: authConfig.middlewarePath
    },
    healthCheck: healthCheckEnabled ? { endpoint: '/health' } : null,
    documentation: {
      transportDoc: documentation.transportDocPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/cli-mcp-development/mcp-transport-layer',
      timestamp: startTime,
      transportType,
      authMethod
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const protocolSelectionTask = defineTask('protocol-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Protocol Selection - ${args.projectName}`,
  agent: {
    name: 'mcp-transport-architect',
    prompt: {
      role: 'MCP Transport Protocol Specialist',
      task: 'Select transport protocol based on use case',
      context: {
        projectName: args.projectName,
        transportType: args.transportType,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze transport requirements',
        '2. Evaluate HTTP/SSE vs WebSocket',
        '3. Document protocol characteristics',
        '4. Identify dependencies needed',
        '5. Generate protocol selection document'
      ],
      outputFormat: 'JSON with protocol selection'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedProtocol', 'characteristics', 'artifacts'],
      properties: {
        selectedProtocol: { type: 'string' },
        characteristics: { type: 'object' },
        dependencies: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp', 'transport', 'protocol']
}));

export const transportServerTask = defineTask('transport-server', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Transport Server - ${args.projectName}`,
  agent: {
    name: 'mcp-transport-architect',
    prompt: {
      role: 'MCP Server Implementation Specialist',
      task: 'Implement transport server',
      context: {
        projectName: args.projectName,
        transportType: args.transportType,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Select server framework (Express, Fastify)',
        '2. Create server initialization',
        '3. Configure routes for MCP',
        '4. Set up middleware chain',
        '5. Configure port and host',
        '6. Generate transport server code'
      ],
      outputFormat: 'JSON with transport server'
    },
    outputSchema: {
      type: 'object',
      required: ['serverPath', 'framework', 'endpoints', 'artifacts'],
      properties: {
        serverPath: { type: 'string' },
        framework: { type: 'string' },
        port: { type: 'number' },
        endpoints: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp', 'transport', 'server']
}));

export const sseEndpointTask = defineTask('sse-endpoint', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: SSE Endpoint - ${args.projectName}`,
  agent: {
    name: 'mcp-transport-architect',
    prompt: {
      role: 'SSE Implementation Specialist',
      task: 'Configure SSE endpoint for server-to-client',
      context: {
        projectName: args.projectName,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create SSE endpoint handler',
        '2. Configure SSE headers',
        '3. Implement event streaming',
        '4. Handle client connections',
        '5. Implement keep-alive',
        '6. Generate SSE endpoint code'
      ],
      outputFormat: 'JSON with SSE endpoint'
    },
    outputSchema: {
      type: 'object',
      required: ['endpointPath', 'sseConfig', 'artifacts'],
      properties: {
        endpointPath: { type: 'string' },
        sseConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp', 'transport', 'sse']
}));

export const postEndpointTask = defineTask('post-endpoint', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: POST Endpoint - ${args.projectName}`,
  agent: {
    name: 'mcp-transport-architect',
    prompt: {
      role: 'MCP Endpoint Specialist',
      task: 'Add POST endpoint for client-to-server',
      context: {
        projectName: args.projectName,
        transportType: args.transportType,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create POST endpoint handler',
        '2. Parse incoming JSON-RPC messages',
        '3. Route to MCP server handler',
        '4. Format response',
        '5. Handle errors',
        '6. Generate POST endpoint code'
      ],
      outputFormat: 'JSON with POST endpoint'
    },
    outputSchema: {
      type: 'object',
      required: ['endpointPath', 'artifacts'],
      properties: {
        endpointPath: { type: 'string' },
        messageHandling: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp', 'transport', 'post']
}));

export const connectionManagementTask = defineTask('connection-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Connection Management - ${args.projectName}`,
  agent: {
    name: 'mcp-transport-architect',
    prompt: {
      role: 'MCP Connection Management Specialist',
      task: 'Implement connection management',
      context: {
        projectName: args.projectName,
        transportType: args.transportType,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Track active connections',
        '2. Implement connection lifecycle',
        '3. Handle connection timeouts',
        '4. Clean up disconnected clients',
        '5. Add connection limits',
        '6. Generate connection management code'
      ],
      outputFormat: 'JSON with connection management'
    },
    outputSchema: {
      type: 'object',
      required: ['connectionConfig', 'artifacts'],
      properties: {
        connectionConfig: { type: 'object' },
        lifecycleHandlers: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp', 'transport', 'connections']
}));

export const authConfigTask = defineTask('auth-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Auth Configuration - ${args.projectName}`,
  agent: {
    name: 'mcp-security-auditor',
    prompt: {
      role: 'MCP Authentication Specialist',
      task: 'Add authentication and authorization',
      context: {
        projectName: args.projectName,
        authMethod: args.authMethod,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create authentication middleware',
        '2. Implement token validation',
        '3. Handle authentication errors',
        '4. Add authorization checks',
        '5. Configure secure token handling',
        '6. Generate authentication code'
      ],
      outputFormat: 'JSON with auth configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['middlewarePath', 'authConfig', 'artifacts'],
      properties: {
        middlewarePath: { type: 'string' },
        authConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp', 'transport', 'authentication']
}));

export const corsConfigTask = defineTask('cors-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: CORS Configuration - ${args.projectName}`,
  agent: {
    name: 'mcp-transport-architect',
    prompt: {
      role: 'CORS Configuration Specialist',
      task: 'Configure CORS for web clients',
      context: {
        projectName: args.projectName,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure allowed origins',
        '2. Set allowed methods',
        '3. Configure allowed headers',
        '4. Handle preflight requests',
        '5. Set credentials policy',
        '6. Generate CORS configuration'
      ],
      outputFormat: 'JSON with CORS configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['corsConfig', 'artifacts'],
      properties: {
        corsConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp', 'transport', 'cors']
}));

export const reconnectionHandlingTask = defineTask('reconnection-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Reconnection Handling - ${args.projectName}`,
  agent: {
    name: 'mcp-transport-architect',
    prompt: {
      role: 'MCP Reconnection Specialist',
      task: 'Implement reconnection handling',
      context: {
        projectName: args.projectName,
        transportType: args.transportType,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design reconnection strategy',
        '2. Implement exponential backoff',
        '3. Handle state recovery',
        '4. Notify clients of reconnection',
        '5. Generate reconnection code'
      ],
      outputFormat: 'JSON with reconnection handling'
    },
    outputSchema: {
      type: 'object',
      required: ['reconnectionConfig', 'artifacts'],
      properties: {
        reconnectionConfig: { type: 'object' },
        backoffStrategy: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp', 'transport', 'reconnection']
}));

export const healthCheckTask = defineTask('health-check', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Health Check - ${args.projectName}`,
  agent: {
    name: 'mcp-transport-architect',
    prompt: {
      role: 'MCP Health Check Specialist',
      task: 'Add health check endpoint',
      context: {
        projectName: args.projectName,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create /health endpoint',
        '2. Check server status',
        '3. Check connection pool health',
        '4. Return health status',
        '5. Generate health check code'
      ],
      outputFormat: 'JSON with health check'
    },
    outputSchema: {
      type: 'object',
      required: ['healthEndpoint', 'artifacts'],
      properties: {
        healthEndpoint: { type: 'string' },
        healthChecks: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp', 'transport', 'health-check']
}));

export const integrationTestsTask = defineTask('integration-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Integration Tests - ${args.projectName}`,
  agent: {
    name: 'mcp-testing-expert',
    prompt: {
      role: 'MCP Integration Testing Specialist',
      task: 'Create integration tests',
      context: {
        projectName: args.projectName,
        transportType: args.transportType,
        authMethod: args.authMethod,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Test server startup',
        '2. Test endpoint connectivity',
        '3. Test authentication flow',
        '4. Test MCP message handling',
        '5. Test error scenarios',
        '6. Generate integration test suite'
      ],
      outputFormat: 'JSON with integration tests'
    },
    outputSchema: {
      type: 'object',
      required: ['testFilePath', 'testCases', 'artifacts'],
      properties: {
        testFilePath: { type: 'string' },
        testCases: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp', 'transport', 'testing']
}));

export const documentationTask = defineTask('documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Documentation - ${args.projectName}`,
  agent: {
    name: 'mcp-tool-documenter',
    prompt: {
      role: 'MCP Transport Documentation Specialist',
      task: 'Document transport configuration',
      context: {
        projectName: args.projectName,
        transportType: args.transportType,
        authMethod: args.authMethod,
        corsEnabled: args.corsEnabled,
        healthCheckEnabled: args.healthCheckEnabled,
        transportServer: args.transportServer,
        authConfig: args.authConfig,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Document transport setup',
        '2. Document endpoint configuration',
        '3. Document authentication setup',
        '4. Document CORS configuration',
        '5. Add deployment examples',
        '6. Generate documentation files'
      ],
      outputFormat: 'JSON with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['transportDocPath', 'artifacts'],
      properties: {
        transportDocPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp', 'transport', 'documentation']
}));
