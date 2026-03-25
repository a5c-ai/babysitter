/**
 * @process specializations/programming-languages/bytecode-vm-implementation
 * @description Bytecode VM Implementation - Process for implementing a bytecode virtual machine. Covers instruction
 * set design, stack or register architecture, and execution optimization.
 * @inputs { languageName: string, vmArchitecture?: string, implementationLanguage?: string, outputDir?: string }
 * @outputs { success: boolean, bytecodeSpec: object, compiler: object, vm: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/programming-languages/bytecode-vm-implementation', {
 *   languageName: 'MyLang',
 *   vmArchitecture: 'stack-based',
 *   implementationLanguage: 'C'
 * });
 *
 * @references
 * - Crafting Interpreters VM: https://craftinginterpreters.com/a-virtual-machine.html
 * - JVM Specification: https://docs.oracle.com/javase/specs/jvms/se17/html/
 * - Lua VM: http://www.yourfruit.info/lua/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    languageName,
    vmArchitecture = 'stack-based',
    implementationLanguage = 'C',
    outputDir = 'bytecode-vm-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Bytecode VM Implementation: ${languageName}`);
  ctx.log('info', `Architecture: ${vmArchitecture}, Language: ${implementationLanguage}`);

  // ============================================================================
  // PHASE 1: INSTRUCTION SET DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 1: Designing Instruction Set');

  const instructionSet = await ctx.task(vmInstructionSetTask, {
    languageName,
    vmArchitecture,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...instructionSet.artifacts);

  await ctx.breakpoint({
    question: `Instruction set designed with ${instructionSet.opcodeCount} opcodes. Architecture: ${vmArchitecture}. Proceed with bytecode compiler?`,
    title: 'Instruction Set Review',
    context: {
      runId: ctx.runId,
      opcodeCount: instructionSet.opcodeCount,
      categories: instructionSet.categories,
      files: instructionSet.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 2: BYTECODE COMPILER
  // ============================================================================

  ctx.log('info', 'Phase 2: Implementing Bytecode Compiler');

  const bytecodeCompiler = await ctx.task(bytecodeCompilerTask, {
    languageName,
    instructionSet,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...bytecodeCompiler.artifacts);

  // ============================================================================
  // PHASE 3: VM EXECUTION LOOP
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing VM Execution Loop');

  const executionLoop = await ctx.task(vmExecutionLoopTask, {
    languageName,
    vmArchitecture,
    instructionSet,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...executionLoop.artifacts);

  // ============================================================================
  // PHASE 4: STACK/REGISTER MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing Stack/Register Management');

  const memoryManagement = await ctx.task(vmMemoryManagementTask, {
    languageName,
    vmArchitecture,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...memoryManagement.artifacts);

  // ============================================================================
  // PHASE 5: RUNTIME SUPPORT
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing Runtime Support');

  const runtimeSupport = await ctx.task(vmRuntimeSupportTask, {
    languageName,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...runtimeSupport.artifacts);

  // ============================================================================
  // PHASE 6: DISPATCH OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Implementing Dispatch Optimization');

  const dispatchOptimization = await ctx.task(dispatchOptimizationTask, {
    languageName,
    vmArchitecture,
    executionLoop,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...dispatchOptimization.artifacts);

  // ============================================================================
  // PHASE 7: INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Integrating VM');

  const integration = await ctx.task(vmIntegrationTask, {
    languageName,
    instructionSet,
    bytecodeCompiler,
    executionLoop,
    memoryManagement,
    runtimeSupport,
    dispatchOptimization,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...integration.artifacts);

  // ============================================================================
  // PHASE 8: TESTING
  // ============================================================================

  ctx.log('info', 'Phase 8: Creating Tests');

  const testSuite = await ctx.task(vmTestingTask, {
    languageName,
    integration,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...testSuite.artifacts);

  // ============================================================================
  // PHASE 9: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating Documentation');

  const documentation = await ctx.task(vmDocumentationTask, {
    languageName,
    vmArchitecture,
    instructionSet,
    integration,
    testSuite,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  await ctx.breakpoint({
    question: `Bytecode VM Complete for ${languageName}! ${instructionSet.opcodeCount} opcodes, Test coverage: ${testSuite.coverage}%. Review deliverables?`,
    title: 'VM Complete',
    context: {
      runId: ctx.runId,
      summary: {
        languageName,
        vmArchitecture,
        opcodeCount: instructionSet.opcodeCount,
        dispatchStyle: dispatchOptimization.dispatchStyle,
        testCoverage: testSuite.coverage
      },
      files: [
        { path: documentation.specPath, format: 'markdown', label: 'Bytecode Specification' },
        { path: integration.mainFilePath, format: implementationLanguage.toLowerCase(), label: 'VM Implementation' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: testSuite.coverage >= 80,
    languageName,
    bytecodeSpec: {
      opcodeCount: instructionSet.opcodeCount,
      categories: instructionSet.categories,
      encoding: instructionSet.encoding
    },
    compiler: {
      filePath: bytecodeCompiler.filePath,
      features: bytecodeCompiler.features
    },
    vm: {
      architecture: vmArchitecture,
      mainFile: integration.mainFilePath,
      dispatchStyle: dispatchOptimization.dispatchStyle
    },
    testSuite: {
      testCount: testSuite.testCount,
      coverage: testSuite.coverage
    },
    documentation: {
      specPath: documentation.specPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/programming-languages/bytecode-vm-implementation',
      timestamp: startTime,
      languageName,
      vmArchitecture
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const vmInstructionSetTask = defineTask('vm-instruction-set', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: VM Instruction Set - ${args.languageName}`,
  agent: {
    name: 'runtime-systems-engineer',
    prompt: {
      role: 'VM Architect',
      task: 'Design bytecode instruction set',
      context: args,
      instructions: [
        '1. Define opcode encoding (1 byte, variable)',
        '2. Design stack manipulation opcodes',
        '3. Design arithmetic opcodes',
        '4. Design comparison/logic opcodes',
        '5. Design control flow opcodes',
        '6. Design function call opcodes',
        '7. Design memory access opcodes',
        '8. Design constant loading opcodes',
        '9. Document instruction format',
        '10. Create opcode reference'
      ],
      outputFormat: 'JSON with instruction set'
    },
    outputSchema: {
      type: 'object',
      required: ['opcodeCount', 'categories', 'encoding', 'artifacts'],
      properties: {
        opcodeCount: { type: 'number' },
        categories: { type: 'array', items: { type: 'string' } },
        encoding: { type: 'string' },
        opcodes: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'vm', 'instruction-set']
}));

export const bytecodeCompilerTask = defineTask('bytecode-compiler', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Bytecode Compiler - ${args.languageName}`,
  agent: {
    name: 'runtime-systems-engineer',
    prompt: {
      role: 'Compiler Engineer',
      task: 'Implement bytecode compiler',
      context: args,
      instructions: [
        '1. Compile expressions to bytecode',
        '2. Compile statements to bytecode',
        '3. Compile function definitions',
        '4. Generate constant pool',
        '5. Handle local variables',
        '6. Implement jump patching',
        '7. Generate debug info',
        '8. Optimize simple patterns',
        '9. Create bytecode serialization',
        '10. Test bytecode generation'
      ],
      outputFormat: 'JSON with bytecode compiler'
    },
    outputSchema: {
      type: 'object',
      required: ['filePath', 'features', 'artifacts'],
      properties: {
        filePath: { type: 'string' },
        features: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'vm', 'compiler']
}));

export const vmExecutionLoopTask = defineTask('vm-execution-loop', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: VM Execution Loop - ${args.languageName}`,
  agent: {
    name: 'runtime-systems-engineer',
    prompt: {
      role: 'VM Engineer',
      task: 'Implement VM execution loop',
      context: args,
      instructions: [
        '1. Implement fetch-decode-execute cycle',
        '2. Implement instruction pointer management',
        '3. Handle each opcode',
        '4. Implement function calls',
        '5. Implement returns',
        '6. Handle runtime errors',
        '7. Implement exception handling',
        '8. Add execution tracing',
        '9. Handle interrupts',
        '10. Test execution correctness'
      ],
      outputFormat: 'JSON with execution loop'
    },
    outputSchema: {
      type: 'object',
      required: ['filePath', 'features', 'artifacts'],
      properties: {
        filePath: { type: 'string' },
        features: { type: 'array', items: { type: 'string' } },
        executionModel: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'vm', 'execution']
}));

export const vmMemoryManagementTask = defineTask('vm-memory-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: VM Memory Management - ${args.languageName}`,
  agent: {
    name: 'runtime-systems-engineer',
    prompt: {
      role: 'VM Engineer',
      task: 'Implement stack/register management',
      context: args,
      instructions: [
        '1. Implement operand stack (if stack-based)',
        '2. Implement register file (if register-based)',
        '3. Implement call frames',
        '4. Handle local variables',
        '5. Implement stack overflow detection',
        '6. Handle memory allocation',
        '7. Implement garbage collection hooks',
        '8. Optimize stack operations',
        '9. Add memory debugging',
        '10. Test memory management'
      ],
      outputFormat: 'JSON with memory management'
    },
    outputSchema: {
      type: 'object',
      required: ['filePath', 'features', 'artifacts'],
      properties: {
        filePath: { type: 'string' },
        features: { type: 'array', items: { type: 'string' } },
        stackSize: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'vm', 'memory']
}));

export const vmRuntimeSupportTask = defineTask('vm-runtime-support', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: VM Runtime Support - ${args.languageName}`,
  agent: {
    name: 'runtime-systems-engineer',
    prompt: {
      role: 'VM Engineer',
      task: 'Implement runtime support',
      context: args,
      instructions: [
        '1. Implement native function interface',
        '2. Add built-in functions',
        '3. Implement string interning',
        '4. Handle object allocation',
        '5. Implement method dispatch',
        '6. Add debugging support',
        '7. Implement profiling hooks',
        '8. Handle signals/interrupts',
        '9. Add threading support (optional)',
        '10. Test runtime features'
      ],
      outputFormat: 'JSON with runtime support'
    },
    outputSchema: {
      type: 'object',
      required: ['filePath', 'features', 'artifacts'],
      properties: {
        filePath: { type: 'string' },
        features: { type: 'array', items: { type: 'string' } },
        nativeFunctions: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'vm', 'runtime']
}));

export const dispatchOptimizationTask = defineTask('dispatch-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Dispatch Optimization - ${args.languageName}`,
  agent: {
    name: 'runtime-systems-engineer',
    prompt: {
      role: 'VM Engineer',
      task: 'Implement dispatch optimization',
      context: args,
      instructions: [
        '1. Implement switch dispatch (baseline)',
        '2. Implement direct threading (if supported)',
        '3. Implement computed goto (if C)',
        '4. Optimize hot paths',
        '5. Implement superinstructions',
        '6. Add inline caching',
        '7. Benchmark dispatch methods',
        '8. Profile execution',
        '9. Document optimization choices',
        '10. Test performance'
      ],
      outputFormat: 'JSON with dispatch optimization'
    },
    outputSchema: {
      type: 'object',
      required: ['dispatchStyle', 'optimizations', 'artifacts'],
      properties: {
        dispatchStyle: { type: 'string' },
        optimizations: { type: 'array', items: { type: 'string' } },
        benchmarks: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'vm', 'optimization']
}));

export const vmIntegrationTask = defineTask('vm-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: VM Integration - ${args.languageName}`,
  agent: {
    name: 'runtime-systems-engineer',
    prompt: {
      role: 'VM Engineer',
      task: 'Integrate VM components',
      context: args,
      instructions: [
        '1. Create main VM class/struct',
        '2. Integrate all components',
        '3. Implement public API',
        '4. Add configuration options',
        '5. Implement VM lifecycle',
        '6. Add embedding API',
        '7. Create VM factory',
        '8. Integrate error handling',
        '9. Add metrics collection',
        '10. Final code organization'
      ],
      outputFormat: 'JSON with integration'
    },
    outputSchema: {
      type: 'object',
      required: ['mainFilePath', 'publicApi', 'artifacts'],
      properties: {
        mainFilePath: { type: 'string' },
        publicApi: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'vm', 'integration']
}));

export const vmTestingTask = defineTask('vm-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: VM Testing - ${args.languageName}`,
  agent: {
    name: 'jit-specialist',
    prompt: {
      role: 'Test Engineer',
      task: 'Create comprehensive VM tests',
      context: args,
      instructions: [
        '1. Test each opcode',
        '2. Test bytecode compilation',
        '3. Test execution correctness',
        '4. Test stack/register operations',
        '5. Test function calls',
        '6. Test error handling',
        '7. Test edge cases',
        '8. Benchmark performance',
        '9. Measure code coverage',
        '10. Add conformance tests'
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
        benchmarks: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'vm', 'testing']
}));

export const vmDocumentationTask = defineTask('vm-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: VM Documentation - ${args.languageName}`,
  agent: {
    name: 'runtime-systems-engineer',
    prompt: {
      role: 'Technical Documentation Writer',
      task: 'Generate VM documentation',
      context: args,
      instructions: [
        '1. Create bytecode specification',
        '2. Document each opcode',
        '3. Document instruction encoding',
        '4. Create API reference',
        '5. Document embedding guide',
        '6. Add architecture overview',
        '7. Document performance tuning',
        '8. Create debugging guide',
        '9. Add examples',
        '10. Document internals'
      ],
      outputFormat: 'JSON with documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['specPath', 'artifacts'],
      properties: {
        specPath: { type: 'string' },
        apiDocPath: { type: 'string' },
        sections: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'vm', 'documentation']
}));
