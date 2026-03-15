/**
 * @process specializations/programming-languages/ir-design
 * @description IR Design and Optimization - Process for designing intermediate representations and implementing
 * optimization passes. Covers IR design, SSA form, and common optimizations.
 * @inputs { languageName: string, irStyle?: string, ssaForm?: boolean, implementationLanguage?: string, outputDir?: string }
 * @outputs { success: boolean, irSpec: object, irBuilder: object, optimizationPasses: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/programming-languages/ir-design', {
 *   languageName: 'MyLang',
 *   irStyle: 'three-address',
 *   ssaForm: true,
 *   implementationLanguage: 'Rust'
 * });
 *
 * @references
 * - Engineering a Compiler Chapter 8-9: Optimization
 * - SSA Book: https://pfalcon.github.io/ssabook/latest/
 * - LLVM IR Reference: https://llvm.org/docs/LangRef.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    languageName,
    irStyle = 'three-address',
    ssaForm = true,
    implementationLanguage = 'TypeScript',
    optimizationLevel = 'standard',
    outputDir = 'ir-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting IR Design: ${languageName}`);
  ctx.log('info', `Style: ${irStyle}, SSA: ${ssaForm}`);

  // ============================================================================
  // PHASE 1: IR INSTRUCTION SET DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 1: Designing IR Instruction Set');

  const instructionSetDesign = await ctx.task(irInstructionSetTask, {
    languageName,
    irStyle,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...instructionSetDesign.artifacts);

  await ctx.breakpoint({
    question: `IR instruction set designed with ${instructionSetDesign.instructionCount} instructions. Categories: ${instructionSetDesign.categories.join(', ')}. Proceed with builder?`,
    title: 'IR Design Review',
    context: {
      runId: ctx.runId,
      instructionCount: instructionSetDesign.instructionCount,
      categories: instructionSetDesign.categories,
      files: instructionSetDesign.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 2: IR BUILDER
  // ============================================================================

  ctx.log('info', 'Phase 2: Implementing IR Builder');

  const irBuilder = await ctx.task(irBuilderTask, {
    languageName,
    instructionSetDesign,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...irBuilder.artifacts);

  // ============================================================================
  // PHASE 3: SSA CONSTRUCTION (if enabled)
  // ============================================================================

  let ssaConstruction = null;
  if (ssaForm) {
    ctx.log('info', 'Phase 3: Implementing SSA Construction');

    ssaConstruction = await ctx.task(ssaConstructionTask, {
      languageName,
      instructionSetDesign,
      irBuilder,
      implementationLanguage,
      outputDir
    });

    artifacts.push(...ssaConstruction.artifacts);
  }

  // ============================================================================
  // PHASE 4: BASIC OPTIMIZATIONS
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing Basic Optimizations');

  const basicOptimizations = await ctx.task(basicOptimizationsTask, {
    languageName,
    instructionSetDesign,
    ssaForm,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...basicOptimizations.artifacts);

  // ============================================================================
  // PHASE 5: CONTROL FLOW OPTIMIZATIONS
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing Control Flow Optimizations');

  const cfgOptimizations = await ctx.task(cfgOptimizationsTask, {
    languageName,
    instructionSetDesign,
    ssaForm,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...cfgOptimizations.artifacts);

  // ============================================================================
  // PHASE 6: OPTIMIZATION PIPELINE
  // ============================================================================

  ctx.log('info', 'Phase 6: Building Optimization Pipeline');

  const optimizationPipeline = await ctx.task(optimizationPipelineTask, {
    languageName,
    basicOptimizations,
    cfgOptimizations,
    optimizationLevel,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...optimizationPipeline.artifacts);

  // ============================================================================
  // PHASE 7: TESTING
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating Tests');

  const testSuite = await ctx.task(irTestingTask, {
    languageName,
    instructionSetDesign,
    irBuilder,
    ssaConstruction,
    optimizationPipeline,
    implementationLanguage,
    outputDir
  });

  artifacts.push(...testSuite.artifacts);

  // ============================================================================
  // PHASE 8: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating Documentation');

  const documentation = await ctx.task(irDocumentationTask, {
    languageName,
    instructionSetDesign,
    irBuilder,
    ssaConstruction,
    optimizationPipeline,
    testSuite,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  await ctx.breakpoint({
    question: `IR Design Complete for ${languageName}! ${instructionSetDesign.instructionCount} instructions, ${optimizationPipeline.passCount} optimization passes. Review deliverables?`,
    title: 'IR Design Complete',
    context: {
      runId: ctx.runId,
      summary: {
        languageName,
        irStyle,
        ssaForm,
        instructionCount: instructionSetDesign.instructionCount,
        optimizationPasses: optimizationPipeline.passCount,
        testCoverage: testSuite.coverage
      },
      files: [
        { path: documentation.specPath, format: 'markdown', label: 'IR Specification' },
        { path: documentation.apiDocPath, format: 'markdown', label: 'API Documentation' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: testSuite.coverage >= 80,
    languageName,
    irSpec: {
      style: irStyle,
      instructionCount: instructionSetDesign.instructionCount,
      categories: instructionSetDesign.categories,
      ssaForm
    },
    irBuilder: {
      filePath: irBuilder.filePath,
      features: irBuilder.features
    },
    ssaConstruction: ssaForm ? {
      algorithm: ssaConstruction.algorithm,
      features: ssaConstruction.features
    } : null,
    optimizationPasses: {
      passCount: optimizationPipeline.passCount,
      passes: optimizationPipeline.passes,
      pipeline: optimizationPipeline.pipeline
    },
    testSuite: {
      testCount: testSuite.testCount,
      coverage: testSuite.coverage
    },
    documentation: {
      specPath: documentation.specPath,
      apiDocPath: documentation.apiDocPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/programming-languages/ir-design',
      timestamp: startTime,
      languageName,
      irStyle
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const irInstructionSetTask = defineTask('ir-instruction-set', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: IR Instruction Set - ${args.languageName}`,
  agent: {
    name: 'ir-design-specialist',
    prompt: {
      role: 'IR Designer',
      task: 'Design IR instruction set',
      context: args,
      instructions: [
        '1. Define core arithmetic operations',
        '2. Define comparison operations',
        '3. Define control flow instructions (branch, jump)',
        '4. Define function call/return instructions',
        '5. Define memory operations (load, store)',
        '6. Define type conversion operations',
        '7. Define phi functions (for SSA)',
        '8. Design instruction encoding',
        '9. Define operand types',
        '10. Document instruction semantics'
      ],
      outputFormat: 'JSON with instruction set design'
    },
    outputSchema: {
      type: 'object',
      required: ['instructionCount', 'categories', 'artifacts'],
      properties: {
        instructionCount: { type: 'number' },
        categories: { type: 'array', items: { type: 'string' } },
        instructions: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'ir', 'instruction-set']
}));

export const irBuilderTask = defineTask('ir-builder', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: IR Builder - ${args.languageName}`,
  agent: {
    name: 'ir-design-specialist',
    prompt: {
      role: 'IR Designer',
      task: 'Implement IR builder',
      context: args,
      instructions: [
        '1. Create IR construction API',
        '2. Implement basic block creation',
        '3. Implement instruction insertion',
        '4. Handle value numbering',
        '5. Implement function/module structure',
        '6. Lower AST to IR',
        '7. Handle complex expressions',
        '8. Generate control flow graph',
        '9. Add IR validation',
        '10. Implement IR printing'
      ],
      outputFormat: 'JSON with IR builder'
    },
    outputSchema: {
      type: 'object',
      required: ['filePath', 'features', 'artifacts'],
      properties: {
        filePath: { type: 'string' },
        features: { type: 'array', items: { type: 'string' } },
        publicApi: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'ir', 'builder']
}));

export const ssaConstructionTask = defineTask('ssa-construction', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: SSA Construction - ${args.languageName}`,
  agent: {
    name: 'ir-design-specialist',
    prompt: {
      role: 'IR Designer',
      task: 'Implement SSA construction',
      context: args,
      instructions: [
        '1. Build dominance tree',
        '2. Calculate dominance frontiers',
        '3. Insert phi functions',
        '4. Rename variables to SSA form',
        '5. Handle memory SSA (optional)',
        '6. Implement SSA verification',
        '7. Handle critical edges',
        '8. Implement SSA destruction',
        '9. Add phi elimination',
        '10. Test SSA correctness'
      ],
      outputFormat: 'JSON with SSA construction'
    },
    outputSchema: {
      type: 'object',
      required: ['algorithm', 'features', 'artifacts'],
      properties: {
        algorithm: { type: 'string' },
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
  labels: ['programming-languages', 'ir', 'ssa']
}));

export const basicOptimizationsTask = defineTask('basic-optimizations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Basic Optimizations - ${args.languageName}`,
  agent: {
    name: 'llvm-engineer',
    prompt: {
      role: 'Compiler Optimization Engineer',
      task: 'Implement basic optimization passes',
      context: args,
      instructions: [
        '1. Implement constant folding',
        '2. Implement constant propagation',
        '3. Implement dead code elimination',
        '4. Implement copy propagation',
        '5. Implement common subexpression elimination',
        '6. Implement strength reduction',
        '7. Implement algebraic simplification',
        '8. Create optimization pass interface',
        '9. Add pass statistics',
        '10. Test optimization correctness'
      ],
      outputFormat: 'JSON with basic optimizations'
    },
    outputSchema: {
      type: 'object',
      required: ['passes', 'filePath', 'artifacts'],
      properties: {
        passes: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        passInterface: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'ir', 'optimization']
}));

export const cfgOptimizationsTask = defineTask('cfg-optimizations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: CFG Optimizations - ${args.languageName}`,
  agent: {
    name: 'llvm-engineer',
    prompt: {
      role: 'Compiler Optimization Engineer',
      task: 'Implement control flow optimizations',
      context: args,
      instructions: [
        '1. Implement unreachable code elimination',
        '2. Implement branch simplification',
        '3. Implement loop detection',
        '4. Implement loop-invariant code motion',
        '5. Implement block merging',
        '6. Implement jump threading',
        '7. Implement tail call optimization',
        '8. Add loop analysis',
        '9. Implement basic block ordering',
        '10. Test CFG transformation correctness'
      ],
      outputFormat: 'JSON with CFG optimizations'
    },
    outputSchema: {
      type: 'object',
      required: ['passes', 'filePath', 'artifacts'],
      properties: {
        passes: { type: 'array', items: { type: 'string' } },
        filePath: { type: 'string' },
        loopOptimizations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'ir', 'cfg-optimization']
}));

export const optimizationPipelineTask = defineTask('optimization-pipeline', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Optimization Pipeline - ${args.languageName}`,
  agent: {
    name: 'llvm-engineer',
    prompt: {
      role: 'Compiler Optimization Engineer',
      task: 'Build optimization pipeline',
      context: args,
      instructions: [
        '1. Design pass ordering',
        '2. Implement pass manager',
        '3. Define optimization levels (O0, O1, O2, O3)',
        '4. Handle pass dependencies',
        '5. Implement fixed-point iteration',
        '6. Add pass profiling',
        '7. Support selective pass execution',
        '8. Add pipeline configuration',
        '9. Implement pass fusion',
        '10. Test pipeline correctness'
      ],
      outputFormat: 'JSON with optimization pipeline'
    },
    outputSchema: {
      type: 'object',
      required: ['passCount', 'passes', 'pipeline', 'artifacts'],
      properties: {
        passCount: { type: 'number' },
        passes: { type: 'array', items: { type: 'string' } },
        pipeline: { type: 'array', items: { type: 'object' } },
        optimizationLevels: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'ir', 'pipeline']
}));

export const irTestingTask = defineTask('ir-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: IR Testing - ${args.languageName}`,
  agent: {
    name: 'ir-design-specialist',
    prompt: {
      role: 'Compiler Test Engineer',
      task: 'Create comprehensive IR tests',
      context: args,
      instructions: [
        '1. Test IR construction',
        '2. Test SSA construction',
        '3. Test each optimization pass',
        '4. Test optimization correctness',
        '5. Test pass combinations',
        '6. Benchmark optimizations',
        '7. Test edge cases',
        '8. Test error handling',
        '9. Measure code coverage',
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
        benchmarks: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['programming-languages', 'ir', 'testing']
}));

export const irDocumentationTask = defineTask('ir-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: IR Documentation - ${args.languageName}`,
  agent: {
    name: 'ir-design-specialist',
    prompt: {
      role: 'Technical Documentation Writer',
      task: 'Generate IR documentation',
      context: args,
      instructions: [
        '1. Create IR specification document',
        '2. Document each instruction',
        '3. Document SSA form',
        '4. Document optimization passes',
        '5. Create API reference',
        '6. Add usage examples',
        '7. Document pass ordering',
        '8. Create architecture overview',
        '9. Add performance notes',
        '10. Create troubleshooting guide'
      ],
      outputFormat: 'JSON with documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['specPath', 'apiDocPath', 'artifacts'],
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
  labels: ['programming-languages', 'ir', 'documentation']
}));
