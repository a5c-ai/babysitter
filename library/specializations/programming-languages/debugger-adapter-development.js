/**
 * @process specializations/programming-languages/debugger-adapter-development
 * @description Debugger Adapter Development - Process for implementing a Debug Adapter Protocol (DAP) server for
 * debugger integration. Covers breakpoints, stepping, variables, and stack traces.
 * @inputs { languageName: string, features?: array, implementationLanguage?: string, outputDir?: string }
 * @outputs { success: boolean, debugAdapter: object, capabilities: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/programming-languages/debugger-adapter-development', {
 *   languageName: 'MyLang',
 *   features: ['breakpoints', 'stepping', 'variables', 'stack-trace']
 * });
 *
 * @references
 * - DAP Specification: https://microsoft.github.io/debug-adapter-protocol/
 * - VS Code Debugging: https://code.visualstudio.com/api/extension-guides/debugger-extension
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    languageName,
    features = ['breakpoints', 'stepping', 'variables', 'stack-trace'],
    implementationLanguage = 'TypeScript',
    outputDir = 'dap-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Debugger Adapter Development: ${languageName}`);
  ctx.log('info', `Features: ${features.join(', ')}`);

  // ============================================================================
  // PHASE 1: DAP PROTOCOL SETUP
  // ============================================================================

  ctx.log('info', 'Phase 1: Setting Up DAP Protocol');

  const protocolSetup = await ctx.task(dapProtocolSetupTask, {
    languageName,
    features,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...protocolSetup.artifacts);

  // ============================================================================
  // PHASE 2: BREAKPOINT MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Implementing Breakpoint Management');

  const breakpoints = await ctx.task(breakpointManagementTask, {
    languageName,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...breakpoints.artifacts);

  // ============================================================================
  // PHASE 3: EXECUTION CONTROL
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing Execution Control');

  const executionControl = await ctx.task(executionControlTask, {
    languageName,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...executionControl.artifacts);

  await ctx.breakpoint({
    question: `Execution control implemented: ${executionControl.commands.join(', ')}. Proceed with variable inspection?`,
    title: 'Execution Control Review',
    context: {
      runId: ctx.runId,
      commands: executionControl.commands,
      files: executionControl.artifacts.map(a => ({ path: a.path, format: a.format || 'typescript' }))
    }
  });

  // ============================================================================
  // PHASE 4: VARIABLE INSPECTION
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing Variable Inspection');

  const variableInspection = await ctx.task(variableInspectionTask, {
    languageName,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...variableInspection.artifacts);

  // ============================================================================
  // PHASE 5: STACK TRACE
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing Stack Trace');

  const stackTrace = await ctx.task(stackTraceTask, {
    languageName,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...stackTrace.artifacts);

  // ============================================================================
  // PHASE 6: INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Integrating Debug Adapter');

  const integration = await ctx.task(dapIntegrationTask, {
    languageName,
    protocolSetup,
    breakpoints,
    executionControl,
    variableInspection,
    stackTrace,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...integration.artifacts);

  // ============================================================================
  // PHASE 7: TESTING
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating Tests');

  const testSuite = await ctx.task(dapTestingTask, {
    languageName,
    integration,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...testSuite.artifacts);

  // ============================================================================
  // PHASE 8: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating Documentation');

  const documentation = await ctx.task(dapDocumentationTask, {
    languageName,
    features,
    integration,
    testSuite,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  await ctx.breakpoint({
    question: `Debug Adapter Complete for ${languageName}! ${integration.capabilityCount} capabilities, Test coverage: ${testSuite.coverage}%. Review deliverables?`,
    title: 'Debug Adapter Complete',
    context: {
      runId: ctx.runId,
      summary: {
        languageName,
        capabilities: integration.capabilityCount,
        features,
        testCoverage: testSuite.coverage
      },
      files: [
        { path: integration.mainFilePath, format: implementationLanguage.toLowerCase(), label: 'Debug Adapter' },
        { path: documentation.setupGuidePath, format: 'markdown', label: 'Setup Guide' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: testSuite.coverage >= 80,
    languageName,
    debugAdapter: {
      mainFile: integration.mainFilePath,
      features
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
      processId: 'specializations/programming-languages/debugger-adapter-development',
      timestamp: startTime,
      languageName
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const dapProtocolSetupTask = defineTask('dap-protocol-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: DAP Protocol Setup - ${args.languageName}`,
  agent: {
    name: 'language-tooling-engineer',
    prompt: {
      role: 'Language Tooling Engineer',
      task: 'Set up DAP protocol handling',
      context: args,
      instructions: [
        '1. Set up JSON transport',
        '2. Implement message handling',
        '3. Handle requests/responses',
        '4. Handle events',
        '5. Implement initialization',
        '6. Handle launch/attach',
        '7. Implement disconnect',
        '8. Add error handling',
        '9. Add logging',
        '10. Test protocol'
      ],
      outputFormat: 'JSON with protocol setup'
    },
    outputSchema: {
      type: 'object',
      required: ['features', 'filePath', 'artifacts'],
      properties: {
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
  labels: ['programming-languages', 'dap', 'protocol']
}));

export const breakpointManagementTask = defineTask('breakpoint-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Breakpoint Management - ${args.languageName}`,
  agent: {
    name: 'language-tooling-engineer',
    prompt: {
      role: 'Language Tooling Engineer',
      task: 'Implement breakpoint management',
      context: args,
      instructions: [
        '1. Handle set breakpoints request',
        '2. Implement line breakpoints',
        '3. Implement function breakpoints',
        '4. Implement conditional breakpoints',
        '5. Implement hitcount breakpoints',
        '6. Handle breakpoint validation',
        '7. Send breakpoint events',
        '8. Handle data breakpoints',
        '9. Implement logpoints',
        '10. Test breakpoints'
      ],
      outputFormat: 'JSON with breakpoints'
    },
    outputSchema: {
      type: 'object',
      required: ['breakpointTypes', 'filePath', 'artifacts'],
      properties: {
        breakpointTypes: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        conditionalSupport: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'dap', 'breakpoints']
}));

export const executionControlTask = defineTask('execution-control', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Execution Control - ${args.languageName}`,
  agent: {
    name: 'language-tooling-engineer',
    prompt: {
      role: 'Language Tooling Engineer',
      task: 'Implement execution control',
      context: args,
      instructions: [
        '1. Implement continue',
        '2. Implement step over (next)',
        '3. Implement step into',
        '4. Implement step out',
        '5. Implement pause',
        '6. Implement terminate',
        '7. Handle thread management',
        '8. Send stopped events',
        '9. Handle exceptions',
        '10. Test stepping'
      ],
      outputFormat: 'JSON with execution control'
    },
    outputSchema: {
      type: 'object',
      required: ['commands', 'filePath', 'artifacts'],
      properties: {
        commands: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        threadSupport: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'dap', 'execution']
}));

export const variableInspectionTask = defineTask('variable-inspection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Variable Inspection - ${args.languageName}`,
  agent: {
    name: 'language-tooling-engineer',
    prompt: {
      role: 'Language Tooling Engineer',
      task: 'Implement variable inspection',
      context: args,
      instructions: [
        '1. Implement scopes request',
        '2. Implement variables request',
        '3. Handle local variables',
        '4. Handle global variables',
        '5. Handle closures',
        '6. Implement variable expansion',
        '7. Implement set variable',
        '8. Implement evaluate',
        '9. Format values nicely',
        '10. Test inspection'
      ],
      outputFormat: 'JSON with variable inspection'
    },
    outputSchema: {
      type: 'object',
      required: ['scopeTypes', 'filePath', 'artifacts'],
      properties: {
        scopeTypes: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        evaluateSupport: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'dap', 'variables']
}));

export const stackTraceTask = defineTask('stack-trace', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Stack Trace - ${args.languageName}`,
  agent: {
    name: 'language-tooling-engineer',
    prompt: {
      role: 'Language Tooling Engineer',
      task: 'Implement stack trace',
      context: args,
      instructions: [
        '1. Implement stack trace request',
        '2. Format stack frames',
        '3. Include source locations',
        '4. Handle async stack traces',
        '5. Implement frame selection',
        '6. Link to source',
        '7. Handle inlined frames',
        '8. Implement modules list',
        '9. Support exception info',
        '10. Test stack traces'
      ],
      outputFormat: 'JSON with stack trace'
    },
    outputSchema: {
      type: 'object',
      required: ['features', 'filePath', 'artifacts'],
      properties: {
        features: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        asyncSupport: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'dap', 'stack-trace']
}));

export const dapIntegrationTask = defineTask('dap-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: DAP Integration - ${args.languageName}`,
  agent: {
    name: 'language-tooling-engineer',
    prompt: {
      role: 'Language Tooling Engineer',
      task: 'Integrate debug adapter',
      context: args,
      instructions: [
        '1. Create main adapter class',
        '2. Register all handlers',
        '3. Configure capabilities',
        '4. Integrate with runtime',
        '5. Handle configuration',
        '6. Add logging',
        '7. Handle errors',
        '8. Add metrics',
        '9. Create launcher',
        '10. Final organization'
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
  labels: ['programming-languages', 'dap', 'integration']
}));

export const dapTestingTask = defineTask('dap-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: DAP Testing - ${args.languageName}`,
  agent: {
    name: 'language-tooling-engineer',
    prompt: {
      role: 'Test Engineer',
      task: 'Create comprehensive DAP tests',
      context: args,
      instructions: [
        '1. Test breakpoints',
        '2. Test stepping',
        '3. Test variables',
        '4. Test stack traces',
        '5. Test evaluate',
        '6. Test protocol',
        '7. Test edge cases',
        '8. Integration tests',
        '9. Measure coverage',
        '10. Add regression tests'
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
  labels: ['programming-languages', 'dap', 'testing']
}));

export const dapDocumentationTask = defineTask('dap-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: DAP Documentation - ${args.languageName}`,
  agent: {
    name: 'language-tooling-engineer',
    prompt: {
      role: 'Technical Documentation Writer',
      task: 'Generate DAP documentation',
      context: args,
      instructions: [
        '1. Create setup guide',
        '2. Document VS Code integration',
        '3. Document features',
        '4. Create API reference',
        '5. Document configuration',
        '6. Add troubleshooting',
        '7. Document development',
        '8. Add examples',
        '9. Create launch.json examples',
        '10. Add changelog'
      ],
      outputFormat: 'JSON with documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['setupGuidePath', 'artifacts'],
      properties: {
        setupGuidePath: { type: 'string' },
        sections: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'dap', 'documentation']
}));
