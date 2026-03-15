/**
 * @process specializations/programming-languages/lsp-server-implementation
 * @description LSP Server Implementation - Process for implementing a Language Server Protocol server for IDE
 * integration. Covers completion, diagnostics, hover, go-to-definition, and other language features.
 * @inputs { languageName: string, features?: array, implementationLanguage?: string, outputDir?: string }
 * @outputs { success: boolean, lspServer: object, capabilities: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/programming-languages/lsp-server-implementation', {
 *   languageName: 'MyLang',
 *   features: ['completion', 'hover', 'diagnostics', 'goto-definition']
 * });
 *
 * @references
 * - LSP Specification: https://microsoft.github.io/language-server-protocol/
 * - Rust Analyzer: https://rust-analyzer.github.io/
 * - TypeScript Language Server: https://github.com/microsoft/TypeScript/wiki/Standalone-Server-%28tsserver%29
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    languageName,
    features = ['completion', 'hover', 'diagnostics', 'goto-definition'],
    implementationLanguage = 'TypeScript',
    outputDir = 'lsp-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting LSP Server Implementation: ${languageName}`);
  ctx.log('info', `Features: ${features.join(', ')}`);

  // ============================================================================
  // PHASE 1: PROTOCOL SETUP
  // ============================================================================

  ctx.log('info', 'Phase 1: Setting Up LSP Protocol');

  const protocolSetup = await ctx.task(lspProtocolSetupTask, {
    languageName,
    features,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...protocolSetup.artifacts);

  // ============================================================================
  // PHASE 2: DOCUMENT MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Implementing Document Management');

  const documentManagement = await ctx.task(documentManagementTask, {
    languageName,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...documentManagement.artifacts);

  // ============================================================================
  // PHASE 3: DIAGNOSTICS
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing Diagnostics');

  const diagnostics = await ctx.task(lspDiagnosticsTask, {
    languageName,
    documentManagement,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...diagnostics.artifacts);

  await ctx.breakpoint({
    question: `Diagnostics implemented with ${diagnostics.diagnosticTypes.length} types. Proceed with completion?`,
    title: 'Diagnostics Review',
    context: {
      runId: ctx.runId,
      diagnosticTypes: diagnostics.diagnosticTypes,
      files: diagnostics.artifacts.map(a => ({ path: a.path, format: a.format || 'typescript' }))
    }
  });

  // ============================================================================
  // PHASE 4: COMPLETION
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing Completion');

  const completion = await ctx.task(lspCompletionTask, {
    languageName,
    documentManagement,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...completion.artifacts);

  // ============================================================================
  // PHASE 5: HOVER
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing Hover');

  const hover = await ctx.task(lspHoverTask, {
    languageName,
    documentManagement,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...hover.artifacts);

  // ============================================================================
  // PHASE 6: GO TO DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 6: Implementing Go To Definition');

  const gotoDefinition = await ctx.task(lspGotoDefinitionTask, {
    languageName,
    documentManagement,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...gotoDefinition.artifacts);

  // ============================================================================
  // PHASE 7: ADDITIONAL FEATURES
  // ============================================================================

  ctx.log('info', 'Phase 7: Implementing Additional Features');

  const additionalFeatures = await ctx.task(lspAdditionalFeaturesTask, {
    languageName,
    features,
    documentManagement,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...additionalFeatures.artifacts);

  // ============================================================================
  // PHASE 8: INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Integrating LSP Server');

  const integration = await ctx.task(lspIntegrationTask, {
    languageName,
    protocolSetup,
    documentManagement,
    diagnostics,
    completion,
    hover,
    gotoDefinition,
    additionalFeatures,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...integration.artifacts);

  // ============================================================================
  // PHASE 9: TESTING
  // ============================================================================

  ctx.log('info', 'Phase 9: Creating Tests');

  const testSuite = await ctx.task(lspTestingTask, {
    languageName,
    integration,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...testSuite.artifacts);

  // ============================================================================
  // PHASE 10: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Generating Documentation');

  const documentation = await ctx.task(lspDocumentationTask, {
    languageName,
    features,
    integration,
    testSuite,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  await ctx.breakpoint({
    question: `LSP Server Complete for ${languageName}! ${integration.capabilityCount} capabilities, Test coverage: ${testSuite.coverage}%. Review deliverables?`,
    title: 'LSP Server Complete',
    context: {
      runId: ctx.runId,
      summary: {
        languageName,
        capabilities: integration.capabilityCount,
        features: features,
        testCoverage: testSuite.coverage
      },
      files: [
        { path: integration.mainFilePath, format: implementationLanguage.toLowerCase(), label: 'LSP Server' },
        { path: documentation.setupGuidePath, format: 'markdown', label: 'Setup Guide' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: testSuite.coverage >= 80,
    languageName,
    lspServer: {
      mainFile: integration.mainFilePath,
      features: features
    },
    capabilities: {
      count: integration.capabilityCount,
      list: integration.capabilities
    },
    testSuite: {
      testCount: testSuite.testCount,
      coverage: testSuite.coverage
    },
    documentation: {
      setupGuidePath: documentation.setupGuidePath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/programming-languages/lsp-server-implementation',
      timestamp: startTime,
      languageName
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const lspProtocolSetupTask = defineTask('lsp-protocol-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: LSP Protocol Setup - ${args.languageName}`,
  agent: {
    name: 'language-tooling-engineer',
    prompt: {
      role: 'Language Tooling Engineer',
      task: 'Set up LSP protocol handling',
      context: args,
      instructions: [
        '1. Set up JSON-RPC transport',
        '2. Implement message parsing',
        '3. Implement request/response handling',
        '4. Handle notifications',
        '5. Implement capability negotiation',
        '6. Handle initialization sequence',
        '7. Implement shutdown handling',
        '8. Add error handling',
        '9. Add logging',
        '10. Test protocol handling'
      ],
      outputFormat: 'JSON with protocol setup'
    },
    outputSchema: {
      type: 'object',
      required: ['transport', 'features', 'artifacts'],
      properties: {
        transport: { type: 'string' },
        features: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'lsp', 'protocol']
}));

export const documentManagementTask = defineTask('document-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Document Management - ${args.languageName}`,
  agent: {
    name: 'language-tooling-engineer',
    prompt: {
      role: 'Language Tooling Engineer',
      task: 'Implement document management',
      context: args,
      instructions: [
        '1. Handle document open',
        '2. Handle document change (incremental)',
        '3. Handle document close',
        '4. Implement document store',
        '5. Handle incremental parsing',
        '6. Cache AST per document',
        '7. Handle file watching',
        '8. Track document versions',
        '9. Handle workspace files',
        '10. Test document sync'
      ],
      outputFormat: 'JSON with document management'
    },
    outputSchema: {
      type: 'object',
      required: ['features', 'filePath', 'artifacts'],
      properties: {
        features: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        incrementalSync: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'lsp', 'documents']
}));

export const lspDiagnosticsTask = defineTask('lsp-diagnostics', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: LSP Diagnostics - ${args.languageName}`,
  agent: {
    name: 'language-tooling-engineer',
    prompt: {
      role: 'Language Tooling Engineer',
      task: 'Implement diagnostics',
      context: args,
      instructions: [
        '1. Integrate with parser errors',
        '2. Integrate with type checker',
        '3. Format diagnostic messages',
        '4. Include source locations',
        '5. Add severity levels',
        '6. Include related information',
        '7. Add quick fix suggestions',
        '8. Publish diagnostics on change',
        '9. Handle workspace diagnostics',
        '10. Test diagnostics'
      ],
      outputFormat: 'JSON with diagnostics'
    },
    outputSchema: {
      type: 'object',
      required: ['diagnosticTypes', 'filePath', 'artifacts'],
      properties: {
        diagnosticTypes: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        quickFixes: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'lsp', 'diagnostics']
}));

export const lspCompletionTask = defineTask('lsp-completion', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: LSP Completion - ${args.languageName}`,
  agent: {
    name: 'language-tooling-engineer',
    prompt: {
      role: 'Language Tooling Engineer',
      task: 'Implement code completion',
      context: args,
      instructions: [
        '1. Implement identifier completion',
        '2. Implement keyword completion',
        '3. Implement member completion (dot)',
        '4. Implement import completion',
        '5. Add completion item kinds',
        '6. Add documentation to items',
        '7. Implement completion resolve',
        '8. Add snippets support',
        '9. Handle trigger characters',
        '10. Test completion'
      ],
      outputFormat: 'JSON with completion'
    },
    outputSchema: {
      type: 'object',
      required: ['completionTypes', 'filePath', 'artifacts'],
      properties: {
        completionTypes: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        snippets: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'lsp', 'completion']
}));

export const lspHoverTask = defineTask('lsp-hover', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: LSP Hover - ${args.languageName}`,
  agent: {
    name: 'language-tooling-engineer',
    prompt: {
      role: 'Language Tooling Engineer',
      task: 'Implement hover information',
      context: args,
      instructions: [
        '1. Show type information',
        '2. Show documentation',
        '3. Format hover content (markdown)',
        '4. Handle variables',
        '5. Handle functions',
        '6. Handle types',
        '7. Handle keywords',
        '8. Add syntax highlighting',
        '9. Handle multiple definitions',
        '10. Test hover'
      ],
      outputFormat: 'JSON with hover'
    },
    outputSchema: {
      type: 'object',
      required: ['hoverTypes', 'filePath', 'artifacts'],
      properties: {
        hoverTypes: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        markdownSupport: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'lsp', 'hover']
}));

export const lspGotoDefinitionTask = defineTask('lsp-goto-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Go To Definition - ${args.languageName}`,
  agent: {
    name: 'language-tooling-engineer',
    prompt: {
      role: 'Language Tooling Engineer',
      task: 'Implement go to definition',
      context: args,
      instructions: [
        '1. Resolve symbol at position',
        '2. Find definition location',
        '3. Handle cross-file definitions',
        '4. Handle library definitions',
        '5. Implement go to type definition',
        '6. Implement find references',
        '7. Implement find implementations',
        '8. Handle multiple definitions',
        '9. Support peek definition',
        '10. Test navigation'
      ],
      outputFormat: 'JSON with goto definition'
    },
    outputSchema: {
      type: 'object',
      required: ['navigationTypes', 'filePath', 'artifacts'],
      properties: {
        navigationTypes: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        crossFileSupport: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'lsp', 'navigation']
}));

export const lspAdditionalFeaturesTask = defineTask('lsp-additional-features', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Additional Features - ${args.languageName}`,
  agent: {
    name: 'language-tooling-engineer',
    prompt: {
      role: 'Language Tooling Engineer',
      task: 'Implement additional LSP features',
      context: args,
      instructions: [
        '1. Implement document symbols',
        '2. Implement workspace symbols',
        '3. Implement formatting',
        '4. Implement rename',
        '5. Implement code actions',
        '6. Implement signature help',
        '7. Implement document highlights',
        '8. Implement folding ranges',
        '9. Implement semantic tokens',
        '10. Test all features'
      ],
      outputFormat: 'JSON with additional features'
    },
    outputSchema: {
      type: 'object',
      required: ['implementedFeatures', 'artifacts'],
      properties: {
        implementedFeatures: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'lsp', 'features']
}));

export const lspIntegrationTask = defineTask('lsp-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: LSP Integration - ${args.languageName}`,
  agent: {
    name: 'language-tooling-engineer',
    prompt: {
      role: 'Language Tooling Engineer',
      task: 'Integrate LSP server',
      context: args,
      instructions: [
        '1. Create main server class',
        '2. Register all handlers',
        '3. Configure capabilities',
        '4. Add server lifecycle',
        '5. Handle configuration',
        '6. Add logging/tracing',
        '7. Handle errors gracefully',
        '8. Add metrics',
        '9. Create launcher',
        '10. Final code organization'
      ],
      outputFormat: 'JSON with integration'
    },
    outputSchema: {
      type: 'object',
      required: ['mainFilePath', 'capabilities', 'capabilityCount', 'artifacts'],
      properties: {
        mainFilePath: { type: 'string' },
        capabilities: { type: 'array', items: { type: 'string' } },
        capabilityCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'lsp', 'integration']
}));

export const lspTestingTask = defineTask('lsp-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: LSP Testing - ${args.languageName}`,
  agent: {
    name: 'language-tooling-engineer',
    prompt: {
      role: 'Test Engineer',
      task: 'Create comprehensive LSP tests',
      context: args,
      instructions: [
        '1. Test diagnostics',
        '2. Test completion',
        '3. Test hover',
        '4. Test navigation',
        '5. Test formatting',
        '6. Test rename',
        '7. Test code actions',
        '8. Test protocol handling',
        '9. Measure code coverage',
        '10. Add integration tests'
      ],
      outputFormat: 'JSON with test suite'
    },
    outputSchema: {
      type: 'object',
      required: ['testCount', 'coverage', 'artifacts'],
      properties: {
        testCount: { type: 'number' },
        coverage: { type: 'number' },
        testFiles: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'lsp', 'testing']
}));

export const lspDocumentationTask = defineTask('lsp-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: LSP Documentation - ${args.languageName}`,
  agent: {
    name: 'language-tooling-engineer',
    prompt: {
      role: 'Technical Documentation Writer',
      task: 'Generate LSP documentation',
      context: args,
      instructions: [
        '1. Create setup guide',
        '2. Document VS Code integration',
        '3. Document other editor integration',
        '4. Document features',
        '5. Create API reference',
        '6. Document configuration',
        '7. Add troubleshooting guide',
        '8. Document development',
        '9. Add contributing guide',
        '10. Create changelog'
      ],
      outputFormat: 'JSON with documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['setupGuidePath', 'artifacts'],
      properties: {
        setupGuidePath: { type: 'string' },
        editorGuides: { type: 'array', items: { type: 'string' } },
        sections: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'lsp', 'documentation']
}));
