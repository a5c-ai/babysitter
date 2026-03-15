/**
 * @process specializations/cli-mcp-development/mcp-server-bootstrap
 * @description MCP Server Bootstrap - Create a new MCP server with transport configuration, capability declarations,
 * and basic tool/resource structure following the Model Context Protocol specification.
 * @inputs { projectName: string, language: string, transport?: string, capabilities?: array, serverName?: string }
 * @outputs { success: boolean, serverConfig: object, transportConfig: object, handlerStructure: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cli-mcp-development/mcp-server-bootstrap', {
 *   projectName: 'filesystem-mcp',
 *   language: 'typescript',
 *   transport: 'stdio',
 *   capabilities: ['tools', 'resources'],
 *   serverName: 'filesystem-server'
 * });
 *
 * @references
 * - MCP Quickstart: https://modelcontextprotocol.io/docs/quickstart
 * - TypeScript SDK: https://github.com/modelcontextprotocol/typescript-sdk
 * - MCP Specification: https://spec.modelcontextprotocol.io/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    language = 'typescript',
    transport = 'stdio',
    capabilities = ['tools', 'resources'],
    serverName = projectName,
    serverVersion = '1.0.0',
    outputDir = 'mcp-server-bootstrap'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting MCP Server Bootstrap: ${projectName}`);
  ctx.log('info', `Language: ${language}, Transport: ${transport}`);

  // ============================================================================
  // PHASE 1: PROJECT INITIALIZATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Initializing project with MCP SDK dependency');

  const projectInit = await ctx.task(projectInitTask, {
    projectName,
    language,
    serverName,
    serverVersion,
    outputDir
  });

  artifacts.push(...projectInit.artifacts);

  // ============================================================================
  // PHASE 2: SERVER METADATA CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Configuring server metadata');

  const serverMetadata = await ctx.task(serverMetadataTask, {
    projectName,
    language,
    serverName,
    serverVersion,
    capabilities,
    outputDir
  });

  artifacts.push(...serverMetadata.artifacts);

  // ============================================================================
  // PHASE 3: TRANSPORT SETUP
  // ============================================================================

  ctx.log('info', `Phase 3: Setting up ${transport} transport`);

  const transportSetup = await ctx.task(transportSetupTask, {
    projectName,
    language,
    transport,
    outputDir
  });

  artifacts.push(...transportSetup.artifacts);

  // ============================================================================
  // PHASE 4: SERVER INITIALIZATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing server initialization');

  const serverInit = await ctx.task(serverInitTask, {
    projectName,
    language,
    serverMetadata,
    transportSetup,
    outputDir
  });

  artifacts.push(...serverInit.artifacts);

  // ============================================================================
  // PHASE 5: CAPABILITY DECLARATIONS
  // ============================================================================

  ctx.log('info', 'Phase 5: Adding capability declarations');

  const capabilityDeclarations = await ctx.task(capabilityDeclarationsTask, {
    projectName,
    language,
    capabilities,
    outputDir
  });

  artifacts.push(...capabilityDeclarations.artifacts);

  // Quality Gate: Server Structure Review
  await ctx.breakpoint({
    question: `MCP Server structure created with ${capabilities.length} capabilities and ${transport} transport. Proceed with handler implementation?`,
    title: 'Server Structure Review',
    context: {
      runId: ctx.runId,
      projectName,
      capabilities,
      transport,
      files: artifacts.slice(-4).map(a => ({ path: a.path, format: a.format || 'typescript' }))
    }
  });

  // ============================================================================
  // PHASE 6: REQUEST HANDLER STRUCTURE
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating request handler structure');

  const handlerStructure = await ctx.task(handlerStructureTask, {
    projectName,
    language,
    capabilities,
    outputDir
  });

  artifacts.push(...handlerStructure.artifacts);

  // ============================================================================
  // PHASE 7: ERROR HANDLING
  // ============================================================================

  ctx.log('info', 'Phase 7: Implementing error handling');

  const errorHandling = await ctx.task(errorHandlingTask, {
    projectName,
    language,
    outputDir
  });

  artifacts.push(...errorHandling.artifacts);

  // ============================================================================
  // PHASE 8: LOGGING CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Adding logging configuration');

  const loggingConfig = await ctx.task(loggingConfigTask, {
    projectName,
    language,
    outputDir
  });

  artifacts.push(...loggingConfig.artifacts);

  // ============================================================================
  // PHASE 9: DEVELOPMENT WORKFLOW
  // ============================================================================

  ctx.log('info', 'Phase 9: Setting up development workflow');

  const devWorkflow = await ctx.task(devWorkflowTask, {
    projectName,
    language,
    transport,
    outputDir
  });

  artifacts.push(...devWorkflow.artifacts);

  // ============================================================================
  // PHASE 10: TEST INFRASTRUCTURE
  // ============================================================================

  ctx.log('info', 'Phase 10: Creating basic test infrastructure');

  const testInfra = await ctx.task(testInfraTask, {
    projectName,
    language,
    capabilities,
    outputDir
  });

  artifacts.push(...testInfra.artifacts);

  // ============================================================================
  // PHASE 11: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 11: Documenting server setup');

  const documentation = await ctx.task(documentationTask, {
    projectName,
    serverName,
    serverVersion,
    transport,
    capabilities,
    projectInit,
    serverMetadata,
    transportSetup,
    handlerStructure,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `MCP Server Bootstrap complete for ${projectName}. Server ready for tool and resource implementation. Review and approve?`,
    title: 'MCP Server Bootstrap Complete',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        serverName,
        serverVersion,
        language,
        transport,
        capabilities,
        totalFiles: artifacts.length
      },
      files: [
        { path: documentation.readmePath, format: 'markdown', label: 'README' },
        { path: serverInit.entryPointPath, format: 'typescript', label: 'Server Entry Point' },
        { path: serverMetadata.configPath, format: 'json', label: 'Server Config' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    serverConfig: {
      name: serverName,
      version: serverVersion,
      entryPoint: serverInit.entryPointPath,
      configPath: serverMetadata.configPath
    },
    transportConfig: {
      type: transport,
      configPath: transportSetup.configPath
    },
    handlerStructure: handlerStructure.handlers,
    capabilities: capabilityDeclarations.capabilities,
    testing: {
      framework: testInfra.testFramework,
      configPath: testInfra.configPath
    },
    documentation: {
      readme: documentation.readmePath,
      serverDoc: documentation.serverDocPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/cli-mcp-development/mcp-server-bootstrap',
      timestamp: startTime,
      language,
      transport
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const projectInitTask = defineTask('project-init', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Project Initialization - ${args.projectName}`,
  agent: {
    name: 'mcp-protocol-expert',
    prompt: {
      role: 'MCP Server Developer with expertise in Model Context Protocol',
      task: 'Initialize project with MCP SDK dependency',
      context: {
        projectName: args.projectName,
        language: args.language,
        serverName: args.serverName,
        serverVersion: args.serverVersion,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create project directory structure',
        '2. Initialize package.json/pyproject.toml',
        '3. Add @modelcontextprotocol/sdk dependency',
        '4. Configure TypeScript if applicable',
        '5. Set up build scripts',
        '6. Configure module resolution',
        '7. Generate project initialization files'
      ],
      outputFormat: 'JSON with project initialization details'
    },
    outputSchema: {
      type: 'object',
      required: ['projectPath', 'packageManifest', 'artifacts'],
      properties: {
        projectPath: { type: 'string' },
        packageManifest: { type: 'string' },
        dependencies: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp', 'server', 'initialization']
}));

export const serverMetadataTask = defineTask('server-metadata', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Server Metadata - ${args.projectName}`,
  agent: {
    name: 'mcp-protocol-expert',
    prompt: {
      role: 'MCP Server Configuration Specialist',
      task: 'Configure server metadata',
      context: {
        projectName: args.projectName,
        language: args.language,
        serverName: args.serverName,
        serverVersion: args.serverVersion,
        capabilities: args.capabilities,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define server name and version',
        '2. Configure server description',
        '3. Set up server capabilities declaration',
        '4. Configure protocol version',
        '5. Generate server metadata configuration'
      ],
      outputFormat: 'JSON with server metadata'
    },
    outputSchema: {
      type: 'object',
      required: ['configPath', 'metadata', 'artifacts'],
      properties: {
        configPath: { type: 'string' },
        metadata: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            version: { type: 'string' },
            protocolVersion: { type: 'string' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp', 'server', 'metadata']
}));

export const transportSetupTask = defineTask('transport-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Transport Setup - ${args.projectName}`,
  agent: {
    name: 'mcp-protocol-expert',
    prompt: {
      role: 'MCP Transport Specialist',
      task: 'Set up transport layer',
      context: {
        projectName: args.projectName,
        language: args.language,
        transport: args.transport,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure stdio transport (default)',
        '2. Import StdioServerTransport from SDK',
        '3. Set up transport initialization',
        '4. Configure input/output streams',
        '5. Generate transport configuration'
      ],
      outputFormat: 'JSON with transport setup'
    },
    outputSchema: {
      type: 'object',
      required: ['configPath', 'transportType', 'artifacts'],
      properties: {
        configPath: { type: 'string' },
        transportType: { type: 'string' },
        transportConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp', 'server', 'transport']
}));

export const serverInitTask = defineTask('server-init', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Server Initialization - ${args.projectName}`,
  agent: {
    name: 'mcp-protocol-expert',
    prompt: {
      role: 'MCP Server Initialization Specialist',
      task: 'Implement server initialization',
      context: {
        projectName: args.projectName,
        language: args.language,
        serverMetadata: args.serverMetadata,
        transportSetup: args.transportSetup,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create main server entry point',
        '2. Initialize Server class from SDK',
        '3. Configure server with metadata',
        '4. Connect server to transport',
        '5. Handle server startup and shutdown',
        '6. Generate server initialization code'
      ],
      outputFormat: 'JSON with server initialization'
    },
    outputSchema: {
      type: 'object',
      required: ['entryPointPath', 'artifacts'],
      properties: {
        entryPointPath: { type: 'string' },
        initializationSteps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp', 'server', 'initialization']
}));

export const capabilityDeclarationsTask = defineTask('capability-declarations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Capability Declarations - ${args.projectName}`,
  agent: {
    name: 'mcp-protocol-expert',
    prompt: {
      role: 'MCP Capability Designer',
      task: 'Add capability declarations',
      context: {
        projectName: args.projectName,
        language: args.language,
        capabilities: args.capabilities,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Declare tools capability if enabled',
        '2. Declare resources capability if enabled',
        '3. Declare prompts capability if enabled',
        '4. Configure capability options',
        '5. Generate capability configuration'
      ],
      outputFormat: 'JSON with capability declarations'
    },
    outputSchema: {
      type: 'object',
      required: ['capabilities', 'artifacts'],
      properties: {
        capabilities: {
          type: 'object',
          properties: {
            tools: { type: 'object' },
            resources: { type: 'object' },
            prompts: { type: 'object' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp', 'server', 'capabilities']
}));

export const handlerStructureTask = defineTask('handler-structure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Handler Structure - ${args.projectName}`,
  agent: {
    name: 'mcp-protocol-expert',
    prompt: {
      role: 'MCP Handler Architect',
      task: 'Create request handler structure',
      context: {
        projectName: args.projectName,
        language: args.language,
        capabilities: args.capabilities,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create handler directory structure',
        '2. Implement ListToolsRequestHandler',
        '3. Implement CallToolRequestHandler',
        '4. Implement ListResourcesRequestHandler if needed',
        '5. Implement ReadResourceRequestHandler if needed',
        '6. Generate handler templates'
      ],
      outputFormat: 'JSON with handler structure'
    },
    outputSchema: {
      type: 'object',
      required: ['handlers', 'artifacts'],
      properties: {
        handlers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              path: { type: 'string' },
              purpose: { type: 'string' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp', 'server', 'handlers']
}));

export const errorHandlingTask = defineTask('error-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Error Handling - ${args.projectName}`,
  agent: {
    name: 'mcp-protocol-expert',
    prompt: {
      role: 'MCP Error Handling Specialist',
      task: 'Implement error handling',
      context: {
        projectName: args.projectName,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Import MCP error codes',
        '2. Create error handling utilities',
        '3. Implement McpError usage',
        '4. Handle tool execution errors',
        '5. Handle resource access errors',
        '6. Generate error handling code'
      ],
      outputFormat: 'JSON with error handling'
    },
    outputSchema: {
      type: 'object',
      required: ['errorHandlers', 'artifacts'],
      properties: {
        errorHandlers: { type: 'array', items: { type: 'object' } },
        errorCodes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp', 'server', 'error-handling']
}));

export const loggingConfigTask = defineTask('logging-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Logging Configuration - ${args.projectName}`,
  agent: {
    name: 'mcp-protocol-expert',
    prompt: {
      role: 'MCP Logging Specialist',
      task: 'Add logging configuration',
      context: {
        projectName: args.projectName,
        language: args.language,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure logging to stderr (not stdout for stdio transport)',
        '2. Set up log levels',
        '3. Add request/response logging',
        '4. Configure debug mode logging',
        '5. Generate logging configuration'
      ],
      outputFormat: 'JSON with logging configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['loggingConfig', 'artifacts'],
      properties: {
        loggingConfig: { type: 'object' },
        logLevels: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp', 'server', 'logging']
}));

export const devWorkflowTask = defineTask('dev-workflow', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Development Workflow - ${args.projectName}`,
  agent: {
    name: 'mcp-protocol-expert',
    prompt: {
      role: 'MCP Development Workflow Specialist',
      task: 'Set up development workflow',
      context: {
        projectName: args.projectName,
        language: args.language,
        transport: args.transport,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure development build script',
        '2. Set up watch mode for auto-rebuild',
        '3. Create MCP Inspector integration',
        '4. Configure local testing setup',
        '5. Add Claude Desktop configuration example',
        '6. Generate development workflow documentation'
      ],
      outputFormat: 'JSON with development workflow'
    },
    outputSchema: {
      type: 'object',
      required: ['scripts', 'artifacts'],
      properties: {
        scripts: { type: 'object' },
        inspectorConfig: { type: 'object' },
        claudeDesktopConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp', 'server', 'development']
}));

export const testInfraTask = defineTask('test-infra', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Test Infrastructure - ${args.projectName}`,
  agent: {
    name: 'mcp-protocol-expert',
    prompt: {
      role: 'MCP Testing Specialist',
      task: 'Create basic test infrastructure',
      context: {
        projectName: args.projectName,
        language: args.language,
        capabilities: args.capabilities,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Set up test framework',
        '2. Create mock MCP client',
        '3. Add server initialization test',
        '4. Add capability test templates',
        '5. Configure test scripts',
        '6. Generate test infrastructure'
      ],
      outputFormat: 'JSON with test infrastructure'
    },
    outputSchema: {
      type: 'object',
      required: ['testFramework', 'configPath', 'artifacts'],
      properties: {
        testFramework: { type: 'string' },
        configPath: { type: 'string' },
        testFiles: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp', 'server', 'testing']
}));

export const documentationTask = defineTask('documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Documentation - ${args.projectName}`,
  agent: {
    name: 'mcp-tool-documenter',
    prompt: {
      role: 'MCP Documentation Specialist',
      task: 'Document server setup',
      context: {
        projectName: args.projectName,
        serverName: args.serverName,
        serverVersion: args.serverVersion,
        transport: args.transport,
        capabilities: args.capabilities,
        projectInit: args.projectInit,
        serverMetadata: args.serverMetadata,
        transportSetup: args.transportSetup,
        handlerStructure: args.handlerStructure,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create comprehensive README',
        '2. Document server capabilities',
        '3. Document installation and setup',
        '4. Add usage examples',
        '5. Document development workflow',
        '6. Add Claude Desktop configuration guide',
        '7. Generate documentation files'
      ],
      outputFormat: 'JSON with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['readmePath', 'serverDocPath', 'artifacts'],
      properties: {
        readmePath: { type: 'string' },
        serverDocPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mcp', 'server', 'documentation']
}));
