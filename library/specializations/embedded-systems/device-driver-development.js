/**
 * @process specializations/embedded-systems/device-driver-development
 * @description Device Driver Development Workflow - Systematic process for developing kernel-space and user-space device
 * drivers, including register mapping, interrupt handling, DMA configuration, and API design for hardware abstraction.
 * @inputs { driverName: string, peripheralType: string, targetMcu?: string, interfaceType?: string, dmaSupport?: boolean, outputDir?: string }
 * @outputs { success: boolean, driverFiles: array, apiDocumentation: object, testSuite: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/embedded-systems/device-driver-development', {
 *   driverName: 'spi_flash',
 *   peripheralType: 'SPI',
 *   targetMcu: 'STM32F407',
 *   interfaceType: 'polling', // 'polling', 'interrupt', 'dma'
 *   dmaSupport: true
 * });
 *
 * @references
 * - Embedded Driver Development Patterns: https://embeddedartistry.com/blog/2017/02/06/embedded-driver-development-patterns/
 * - Device Driver Design: https://interrupt.memfault.com/blog/device-driver-design-patterns
 * - HAL Design Patterns: https://www.embedded.com/design-patterns-for-embedded-systems-in-c/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    driverName,
    peripheralType,
    targetMcu = 'generic',
    interfaceType = 'interrupt', // 'polling', 'interrupt', 'dma'
    dmaSupport = true,
    threadSafe = true,
    errorHandling = 'comprehensive',
    testingFramework = 'Unity',
    outputDir = 'device-driver-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Device Driver Development: ${driverName}`);
  ctx.log('info', `Peripheral: ${peripheralType}, Interface: ${interfaceType}, DMA: ${dmaSupport}`);

  // ============================================================================
  // PHASE 1: REQUIREMENTS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Driver Requirements Analysis');

  const requirements = await ctx.task(driverRequirementsTask, {
    driverName,
    peripheralType,
    targetMcu,
    interfaceType,
    dmaSupport,
    threadSafe,
    outputDir
  });

  artifacts.push(...requirements.artifacts);

  await ctx.breakpoint({
    question: `Driver requirements defined for ${driverName}. Features: ${requirements.features.join(', ')}. Proceed with design?`,
    title: 'Driver Requirements Review',
    context: {
      runId: ctx.runId,
      driverName,
      features: requirements.features,
      files: requirements.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 2: HARDWARE REGISTER MAPPING
  // ============================================================================

  ctx.log('info', 'Phase 2: Hardware Register Mapping');

  const registerMapping = await ctx.task(registerMappingTask, {
    driverName,
    peripheralType,
    targetMcu,
    requirements,
    outputDir
  });

  artifacts.push(...registerMapping.artifacts);

  // ============================================================================
  // PHASE 3: DRIVER ARCHITECTURE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 3: Driver Architecture Design');

  const architecture = await ctx.task(driverArchitectureTask, {
    driverName,
    peripheralType,
    interfaceType,
    dmaSupport,
    threadSafe,
    requirements,
    registerMapping,
    outputDir
  });

  artifacts.push(...architecture.artifacts);

  // ============================================================================
  // PHASE 4: API DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 4: API Design');

  const apiDesign = await ctx.task(driverApiDesignTask, {
    driverName,
    peripheralType,
    architecture,
    requirements,
    outputDir
  });

  artifacts.push(...apiDesign.artifacts);

  // ============================================================================
  // PHASE 5: CORE DRIVER IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Core Driver Implementation');

  const coreImplementation = await ctx.task(coreDriverImplementationTask, {
    driverName,
    peripheralType,
    targetMcu,
    registerMapping,
    architecture,
    apiDesign,
    outputDir
  });

  artifacts.push(...coreImplementation.artifacts);

  // ============================================================================
  // PHASE 6: INTERRUPT HANDLING
  // ============================================================================

  ctx.log('info', 'Phase 6: Interrupt Handling Implementation');

  const interruptHandling = await ctx.task(interruptHandlingTask, {
    driverName,
    peripheralType,
    interfaceType,
    architecture,
    coreImplementation,
    outputDir
  });

  artifacts.push(...interruptHandling.artifacts);

  // ============================================================================
  // PHASE 7: DMA CONFIGURATION (if enabled)
  // ============================================================================

  let dmaImplementation = null;
  if (dmaSupport) {
    ctx.log('info', 'Phase 7: DMA Configuration');

    dmaImplementation = await ctx.task(dmaConfigurationTask, {
      driverName,
      peripheralType,
      targetMcu,
      architecture,
      coreImplementation,
      outputDir
    });

    artifacts.push(...dmaImplementation.artifacts);
  }

  // ============================================================================
  // PHASE 8: ERROR HANDLING
  // ============================================================================

  ctx.log('info', 'Phase 8: Error Handling Implementation');

  const errorHandlingImpl = await ctx.task(errorHandlingTask, {
    driverName,
    errorHandling,
    architecture,
    coreImplementation,
    outputDir
  });

  artifacts.push(...errorHandlingImpl.artifacts);

  // ============================================================================
  // PHASE 9: THREAD SAFETY (if enabled)
  // ============================================================================

  let threadSafetyImpl = null;
  if (threadSafe) {
    ctx.log('info', 'Phase 9: Thread Safety Implementation');

    threadSafetyImpl = await ctx.task(threadSafetyTask, {
      driverName,
      architecture,
      coreImplementation,
      outputDir
    });

    artifacts.push(...threadSafetyImpl.artifacts);
  }

  // ============================================================================
  // PHASE 10: UNIT TEST DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 10: Unit Test Development');

  const unitTests = await ctx.task(driverUnitTestsTask, {
    driverName,
    testingFramework,
    apiDesign,
    coreImplementation,
    outputDir
  });

  artifacts.push(...unitTests.artifacts);

  // ============================================================================
  // PHASE 11: API DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 11: API Documentation');

  const documentation = await ctx.task(driverDocumentationTask, {
    driverName,
    peripheralType,
    apiDesign,
    architecture,
    dmaSupport,
    threadSafe,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // ============================================================================
  // PHASE 12: CODE REVIEW CHECKLIST
  // ============================================================================

  ctx.log('info', 'Phase 12: Code Review and Quality Check');

  const codeReview = await ctx.task(driverCodeReviewTask, {
    driverName,
    coreImplementation,
    interruptHandling,
    dmaImplementation,
    errorHandlingImpl,
    threadSafetyImpl,
    unitTests,
    outputDir
  });

  artifacts.push(...codeReview.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Device Driver Development Complete for ${driverName}. Review score: ${codeReview.qualityScore}/100. Review driver package?`,
    title: 'Driver Development Complete',
    context: {
      runId: ctx.runId,
      summary: {
        driverName,
        peripheralType,
        interfaceType,
        features: {
          dmaSupport,
          threadSafe,
          interruptDriven: interfaceType !== 'polling'
        },
        qualityScore: codeReview.qualityScore,
        testCoverage: unitTests.coverage
      },
      files: [
        { path: documentation.apiDocPath, format: 'markdown', label: 'API Documentation' },
        { path: coreImplementation.headerPath, format: 'c', label: 'Driver Header' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: codeReview.qualityScore >= 80,
    driverName,
    peripheralType,
    driverFiles: {
      header: coreImplementation.headerPath,
      source: coreImplementation.sourcePath,
      config: coreImplementation.configPath,
      tests: unitTests.testFiles
    },
    apiDocumentation: {
      path: documentation.apiDocPath,
      functions: apiDesign.publicFunctions,
      types: apiDesign.publicTypes
    },
    testSuite: {
      framework: testingFramework,
      testFiles: unitTests.testFiles,
      testCount: unitTests.testCount,
      coverage: unitTests.coverage
    },
    features: {
      interfaceType,
      dmaSupport,
      threadSafe,
      errorHandling
    },
    quality: {
      score: codeReview.qualityScore,
      issues: codeReview.issues,
      recommendations: codeReview.recommendations
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/embedded-systems/device-driver-development',
      timestamp: startTime,
      driverName,
      targetMcu,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const driverRequirementsTask = defineTask('driver-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Requirements - ${args.driverName}`,
  agent: {
    name: 'device-driver-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Define device driver requirements',
      context: args,
      instructions: [
        '1. Identify functional requirements (read, write, configure)',
        '2. Define performance requirements (throughput, latency)',
        '3. Specify resource constraints (memory, CPU)',
        '4. Define interface modes (polling, interrupt, DMA)',
        '5. Identify error conditions and handling requirements',
        '6. Specify thread-safety requirements',
        '7. Define power management requirements',
        '8. List hardware dependencies',
        '9. Specify testing requirements',
        '10. Document acceptance criteria'
      ],
      outputFormat: 'JSON with driver requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['features', 'functionalReqs', 'artifacts'],
      properties: {
        features: { type: 'array', items: { type: 'string' } },
        functionalReqs: { type: 'array', items: { type: 'object' } },
        performanceReqs: { type: 'object' },
        resourceConstraints: { type: 'object' },
        errorConditions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'driver', 'requirements']
}));

export const registerMappingTask = defineTask('register-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Register Mapping - ${args.driverName}`,
  agent: {
    name: 'device-driver-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Create hardware register mapping',
      context: args,
      instructions: [
        '1. Extract register addresses from datasheet',
        '2. Create register structure with bit fields',
        '3. Define register access macros (read/write)',
        '4. Create bit manipulation macros',
        '5. Document register descriptions',
        '6. Define volatile access requirements',
        '7. Create memory-mapped I/O wrapper',
        '8. Add register reset values',
        '9. Create register verification functions',
        '10. Document register dependencies'
      ],
      outputFormat: 'JSON with register mapping details'
    },
    outputSchema: {
      type: 'object',
      required: ['registers', 'baseAddress', 'artifacts'],
      properties: {
        registers: { type: 'array', items: { type: 'object' } },
        baseAddress: { type: 'string' },
        bitFields: { type: 'object' },
        accessMacros: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'driver', 'registers']
}));

export const driverArchitectureTask = defineTask('driver-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Architecture - ${args.driverName}`,
  agent: {
    name: 'firmware-architect',
    prompt: {
      role: 'Embedded Software Architect',
      task: 'Design driver architecture',
      context: args,
      instructions: [
        '1. Define driver state machine',
        '2. Design handle/instance structure',
        '3. Create internal buffer management',
        '4. Design callback mechanism',
        '5. Define driver configuration structure',
        '6. Plan resource management',
        '7. Design power state handling',
        '8. Create layer separation (HAL/driver)',
        '9. Define internal vs external interfaces',
        '10. Document architecture diagram'
      ],
      outputFormat: 'JSON with architecture design'
    },
    outputSchema: {
      type: 'object',
      required: ['stateMachine', 'structures', 'artifacts'],
      properties: {
        stateMachine: { type: 'object' },
        structures: { type: 'array', items: { type: 'object' } },
        bufferStrategy: { type: 'object' },
        callbackMechanism: { type: 'object' },
        layers: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'driver', 'architecture']
}));

export const driverApiDesignTask = defineTask('driver-api-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: API Design - ${args.driverName}`,
  agent: {
    name: 'comm-protocol-expert',
    prompt: {
      role: 'API Designer',
      task: 'Design driver public API',
      context: args,
      instructions: [
        '1. Define initialization/deinitialization functions',
        '2. Design configuration functions',
        '3. Create read/write/transfer functions',
        '4. Define callback registration functions',
        '5. Create status query functions',
        '6. Design error code enumeration',
        '7. Define public data types',
        '8. Create macro definitions',
        '9. Ensure API consistency',
        '10. Document API with examples'
      ],
      outputFormat: 'JSON with API design'
    },
    outputSchema: {
      type: 'object',
      required: ['publicFunctions', 'publicTypes', 'artifacts'],
      properties: {
        publicFunctions: { type: 'array', items: { type: 'object' } },
        publicTypes: { type: 'array', items: { type: 'object' } },
        errorCodes: { type: 'array', items: { type: 'object' } },
        macros: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'driver', 'api']
}));

export const coreDriverImplementationTask = defineTask('core-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Core Implementation - ${args.driverName}`,
  agent: {
    name: 'device-driver-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Implement core driver functionality',
      context: args,
      instructions: [
        '1. Create driver header file with API',
        '2. Implement initialization function',
        '3. Implement configuration functions',
        '4. Implement core read/write operations',
        '5. Create internal state management',
        '6. Implement timeout handling',
        '7. Add hardware-specific optimizations',
        '8. Create deinitialization function',
        '9. Add debug/logging hooks',
        '10. Implement driver self-test'
      ],
      outputFormat: 'JSON with implementation details'
    },
    outputSchema: {
      type: 'object',
      required: ['headerPath', 'sourcePath', 'artifacts'],
      properties: {
        headerPath: { type: 'string' },
        sourcePath: { type: 'string' },
        configPath: { type: 'string' },
        implementedFunctions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'driver', 'implementation']
}));

export const interruptHandlingTask = defineTask('interrupt-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Interrupt Handling - ${args.driverName}`,
  agent: {
    name: 'device-driver-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Implement interrupt handling',
      context: args,
      instructions: [
        '1. Create interrupt service routine (ISR)',
        '2. Implement interrupt enable/disable',
        '3. Configure interrupt priority',
        '4. Handle interrupt flags properly',
        '5. Implement deferred interrupt processing',
        '6. Create callback invocation from ISR',
        '7. Add interrupt statistics/debugging',
        '8. Handle nested interrupts if needed',
        '9. Implement timeout interrupts',
        '10. Test interrupt latency'
      ],
      outputFormat: 'JSON with interrupt handling details'
    },
    outputSchema: {
      type: 'object',
      required: ['isrFunction', 'interruptSources', 'artifacts'],
      properties: {
        isrFunction: { type: 'string' },
        interruptSources: { type: 'array', items: { type: 'string' } },
        priorityLevel: { type: 'number' },
        deferredProcessing: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'driver', 'interrupts']
}));

export const dmaConfigurationTask = defineTask('dma-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: DMA Configuration - ${args.driverName}`,
  agent: {
    name: 'device-driver-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Configure DMA for driver',
      context: args,
      instructions: [
        '1. Identify DMA channels for peripheral',
        '2. Configure DMA stream/channel',
        '3. Set up source/destination addresses',
        '4. Configure transfer direction',
        '5. Set data width and burst size',
        '6. Configure circular vs. normal mode',
        '7. Implement DMA interrupt handler',
        '8. Handle DMA errors',
        '9. Add double-buffering if needed',
        '10. Optimize for throughput'
      ],
      outputFormat: 'JSON with DMA configuration details'
    },
    outputSchema: {
      type: 'object',
      required: ['dmaChannel', 'configuration', 'artifacts'],
      properties: {
        dmaChannel: { type: 'string' },
        configuration: { type: 'object' },
        transferModes: { type: 'array', items: { type: 'string' } },
        doubleBuffering: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'driver', 'dma']
}));

export const errorHandlingTask = defineTask('error-handling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Error Handling - ${args.driverName}`,
  agent: {
    name: 'device-driver-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Implement comprehensive error handling',
      context: args,
      instructions: [
        '1. Define error code enumeration',
        '2. Implement error detection logic',
        '3. Create error callback mechanism',
        '4. Add error logging/tracing',
        '5. Implement error recovery procedures',
        '6. Handle hardware errors',
        '7. Handle timeout errors',
        '8. Add parameter validation',
        '9. Implement graceful degradation',
        '10. Document error conditions'
      ],
      outputFormat: 'JSON with error handling details'
    },
    outputSchema: {
      type: 'object',
      required: ['errorCodes', 'recoveryStrategies', 'artifacts'],
      properties: {
        errorCodes: { type: 'array', items: { type: 'object' } },
        recoveryStrategies: { type: 'array', items: { type: 'object' } },
        validationPoints: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'driver', 'error-handling']
}));

export const threadSafetyTask = defineTask('thread-safety', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Thread Safety - ${args.driverName}`,
  agent: {
    name: 'device-driver-expert',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Implement thread safety',
      context: args,
      instructions: [
        '1. Identify shared resources',
        '2. Add mutex/semaphore protection',
        '3. Use critical sections appropriately',
        '4. Make ISR handlers reentrant',
        '5. Use atomic operations where possible',
        '6. Prevent priority inversion',
        '7. Add lock timeout handling',
        '8. Document thread-safety guarantees',
        '9. Test concurrent access',
        '10. Minimize lock duration'
      ],
      outputFormat: 'JSON with thread safety details'
    },
    outputSchema: {
      type: 'object',
      required: ['protectedResources', 'synchronizationMethods', 'artifacts'],
      properties: {
        protectedResources: { type: 'array', items: { type: 'string' } },
        synchronizationMethods: { type: 'array', items: { type: 'string' } },
        reentrantFunctions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'driver', 'thread-safety']
}));

export const driverUnitTestsTask = defineTask('driver-unit-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Unit Tests - ${args.driverName}`,
  agent: {
    name: 'embedded-test-engineer',
    prompt: {
      role: 'Embedded Test Engineer',
      task: 'Develop unit tests for driver',
      context: args,
      instructions: [
        '1. Create mock for hardware registers',
        '2. Test initialization/deinitialization',
        '3. Test configuration functions',
        '4. Test read/write operations',
        '5. Test error handling paths',
        '6. Test timeout behavior',
        '7. Test callback invocation',
        '8. Test edge cases',
        '9. Measure code coverage',
        '10. Document test cases'
      ],
      outputFormat: 'JSON with test suite details'
    },
    outputSchema: {
      type: 'object',
      required: ['testFiles', 'testCount', 'coverage', 'artifacts'],
      properties: {
        testFiles: { type: 'array', items: { type: 'string' } },
        testCount: { type: 'number' },
        coverage: { type: 'string' },
        testCategories: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'driver', 'testing']
}));

export const driverDocumentationTask = defineTask('driver-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Documentation - ${args.driverName}`,
  agent: {
    name: 'embedded-tech-writer',
    prompt: {
      role: 'Technical Writer',
      task: 'Create driver documentation',
      context: args,
      instructions: [
        '1. Create API reference documentation',
        '2. Document function parameters and returns',
        '3. Add usage examples',
        '4. Document configuration options',
        '5. Create getting started guide',
        '6. Document error codes and handling',
        '7. Add architecture overview',
        '8. Document thread-safety notes',
        '9. Add performance characteristics',
        '10. Create troubleshooting guide'
      ],
      outputFormat: 'JSON with documentation details'
    },
    outputSchema: {
      type: 'object',
      required: ['apiDocPath', 'artifacts'],
      properties: {
        apiDocPath: { type: 'string' },
        usageExamples: { type: 'array', items: { type: 'string' } },
        sections: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'driver', 'documentation']
}));

export const driverCodeReviewTask = defineTask('driver-code-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Code Review - ${args.driverName}`,
  agent: {
    name: 'device-driver-expert',
    prompt: {
      role: 'Senior Embedded Engineer',
      task: 'Review driver code quality',
      context: args,
      instructions: [
        '1. Check coding standards compliance',
        '2. Review error handling completeness',
        '3. Verify thread-safety implementation',
        '4. Check resource management',
        '5. Review interrupt handling correctness',
        '6. Verify DMA configuration',
        '7. Check documentation completeness',
        '8. Review test coverage',
        '9. Identify potential issues',
        '10. Provide improvement recommendations'
      ],
      outputFormat: 'JSON with code review results'
    },
    outputSchema: {
      type: 'object',
      required: ['qualityScore', 'issues', 'recommendations', 'artifacts'],
      properties: {
        qualityScore: { type: 'number', minimum: 0, maximum: 100 },
        issues: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        passedChecks: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'driver', 'code-review']
}));
