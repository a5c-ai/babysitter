/**
 * @process specializations/embedded-systems/code-size-optimization
 * @description Code Size Optimization - Techniques for minimizing firmware footprint including compiler optimization flags,
 * link-time optimization (LTO), dead code elimination, and careful library selection.
 * @inputs { projectName: string, targetMcu: string, currentSize?: string, targetSize?: string, outputDir?: string }
 * @outputs { success: boolean, sizeReduction: object, optimizations: array, buildConfig: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/embedded-systems/code-size-optimization', {
 *   projectName: 'CompactFirmware',
 *   targetMcu: 'STM32L071',
 *   currentSize: '128KB',
 *   targetSize: '96KB'
 * });
 *
 * @references
 * - Code Size Optimization: https://interrupt.memfault.com/blog/code-size-optimization-gcc-flags
 * - Link-Time Optimization: https://gcc.gnu.org/wiki/LinkTimeOptimization
 * - Dead Code Elimination: https://www.embedded.com/dead-code-elimination/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetMcu,
    currentSize = null,
    targetSize = null,
    compiler = 'gcc-arm-none-eabi',
    enableLto = true,
    outputDir = 'code-size-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Code Size Optimization: ${projectName}`);
  ctx.log('info', `MCU: ${targetMcu}, Target Size: ${targetSize || 'Minimize'}`);

  // ============================================================================
  // PHASE 1: SIZE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing Current Code Size');

  const sizeAnalysis = await ctx.task(codeSizeAnalysisTask, {
    projectName,
    targetMcu,
    currentSize,
    compiler,
    outputDir
  });

  artifacts.push(...sizeAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: SYMBOL ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing Symbol Contributions');

  const symbolAnalysis = await ctx.task(symbolAnalysisTask, {
    projectName,
    sizeAnalysis,
    outputDir
  });

  artifacts.push(...symbolAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: COMPILER FLAG OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Optimizing Compiler Flags');

  const compilerOptimization = await ctx.task(compilerFlagOptimizationTask, {
    projectName,
    compiler,
    sizeAnalysis,
    enableLto,
    outputDir
  });

  artifacts.push(...compilerOptimization.artifacts);

  // ============================================================================
  // PHASE 4: DEAD CODE ELIMINATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Eliminating Dead Code');

  const deadCodeElimination = await ctx.task(deadCodeEliminationTask, {
    projectName,
    symbolAnalysis,
    outputDir
  });

  artifacts.push(...deadCodeElimination.artifacts);

  // ============================================================================
  // PHASE 5: LIBRARY OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Optimizing Library Usage');

  const libraryOptimization = await ctx.task(libraryOptimizationTask, {
    projectName,
    symbolAnalysis,
    outputDir
  });

  artifacts.push(...libraryOptimization.artifacts);

  // ============================================================================
  // PHASE 6: DATA OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Optimizing Data Structures');

  const dataOptimization = await ctx.task(dataOptimizationTask, {
    projectName,
    symbolAnalysis,
    outputDir
  });

  artifacts.push(...dataOptimization.artifacts);

  // ============================================================================
  // PHASE 7: BUILD CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating Optimized Build Configuration');

  const buildConfig = await ctx.task(optimizedBuildConfigTask, {
    projectName,
    compilerOptimization,
    deadCodeElimination,
    libraryOptimization,
    dataOptimization,
    outputDir
  });

  artifacts.push(...buildConfig.artifacts);

  // ============================================================================
  // PHASE 8: VERIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Verifying Size Reduction');

  const verification = await ctx.task(sizeReductionVerificationTask, {
    projectName,
    sizeAnalysis,
    buildConfig,
    targetSize,
    outputDir
  });

  artifacts.push(...verification.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Code Size Optimization Complete for ${projectName}. Reduction: ${verification.reduction}. Target met: ${verification.targetMet}. Review?`,
    title: 'Code Size Optimization Complete',
    context: {
      runId: ctx.runId,
      summary: {
        originalSize: sizeAnalysis.totalSize,
        optimizedSize: verification.newSize,
        reduction: verification.reduction,
        targetMet: verification.targetMet
      },
      files: [
        { path: buildConfig.configPath, format: 'cmake', label: 'Build Config' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: verification.targetMet || verification.reduction !== '0%',
    projectName,
    sizeReduction: {
      original: sizeAnalysis.totalSize,
      optimized: verification.newSize,
      reduction: verification.reduction,
      targetMet: verification.targetMet
    },
    optimizations: [
      ...compilerOptimization.flags,
      ...deadCodeElimination.removals,
      ...libraryOptimization.changes,
      ...dataOptimization.changes
    ],
    buildConfig: buildConfig.configuration,
    configPath: buildConfig.configPath,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/embedded-systems/code-size-optimization',
      timestamp: startTime,
      projectName,
      targetMcu,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const codeSizeAnalysisTask = defineTask('code-size-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Size Analysis - ${args.projectName}`,
  agent: {
    name: 'performance-optimization-agent',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Analyze current code size',
      context: args,
      instructions: [
        '1. Run size utility on binary',
        '2. Analyze .text section size',
        '3. Analyze .data section size',
        '4. Analyze .bss section size',
        '5. Identify largest modules',
        '6. Map file analysis',
        '7. Calculate utilization',
        '8. Identify bloat areas',
        '9. Create size breakdown',
        '10. Document analysis'
      ],
      outputFormat: 'JSON with size analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['totalSize', 'sectionSizes', 'artifacts'],
      properties: {
        totalSize: { type: 'string' },
        sectionSizes: { type: 'object' },
        largestModules: { type: 'array', items: { type: 'object' } },
        bloatAreas: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'code-size', 'analysis']
}));

export const symbolAnalysisTask = defineTask('symbol-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Symbol Analysis - ${args.projectName}`,
  agent: {
    name: 'performance-optimization-agent',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Analyze symbol contributions',
      context: args,
      instructions: [
        '1. List all symbols',
        '2. Sort by size',
        '3. Identify large functions',
        '4. Identify large data',
        '5. Check string usage',
        '6. Analyze constant data',
        '7. Find duplicate code',
        '8. Check library symbols',
        '9. Create symbol report',
        '10. Document findings'
      ],
      outputFormat: 'JSON with symbol analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['symbols', 'largeFunctions', 'artifacts'],
      properties: {
        symbols: { type: 'array', items: { type: 'object' } },
        largeFunctions: { type: 'array', items: { type: 'object' } },
        largeData: { type: 'array', items: { type: 'object' } },
        duplicates: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'code-size', 'symbols']
}));

export const compilerFlagOptimizationTask = defineTask('compiler-flag-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Compiler Flags - ${args.projectName}`,
  agent: {
    name: 'performance-optimization-agent',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Optimize compiler flags for size',
      context: args,
      instructions: [
        '1. Set -Os optimization',
        '2. Enable -ffunction-sections',
        '3. Enable -fdata-sections',
        '4. Configure LTO',
        '5. Set -flto flags',
        '6. Enable gc-sections',
        '7. Consider -fno-exceptions',
        '8. Consider -fno-rtti',
        '9. Tune other flags',
        '10. Document configuration'
      ],
      outputFormat: 'JSON with compiler flag configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['flags', 'expectedSavings', 'artifacts'],
      properties: {
        flags: { type: 'array', items: { type: 'string' } },
        expectedSavings: { type: 'string' },
        ltoEnabled: { type: 'boolean' },
        warnings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'code-size', 'compiler']
}));

export const deadCodeEliminationTask = defineTask('dead-code-elimination', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Dead Code Elimination - ${args.projectName}`,
  agent: {
    name: 'performance-optimization-agent',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Identify and eliminate dead code',
      context: args,
      instructions: [
        '1. Run static analysis',
        '2. Identify unused functions',
        '3. Find unused variables',
        '4. Check unused includes',
        '5. Analyze call graph',
        '6. Find unreachable code',
        '7. Check #ifdef guards',
        '8. Recommend removals',
        '9. Calculate savings',
        '10. Document findings'
      ],
      outputFormat: 'JSON with dead code analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['removals', 'expectedSavings', 'artifacts'],
      properties: {
        removals: { type: 'array', items: { type: 'string' } },
        unusedFunctions: { type: 'array', items: { type: 'string' } },
        unusedVariables: { type: 'array', items: { type: 'string' } },
        expectedSavings: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'code-size', 'dead-code']
}));

export const libraryOptimizationTask = defineTask('library-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Library Optimization - ${args.projectName}`,
  agent: {
    name: 'performance-optimization-agent',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Optimize library usage',
      context: args,
      instructions: [
        '1. Analyze library dependencies',
        '2. Check printf/scanf usage',
        '3. Evaluate malloc usage',
        '4. Review string functions',
        '5. Check math library',
        '6. Find lightweight alternatives',
        '7. Consider nano specs',
        '8. Remove unused features',
        '9. Calculate savings',
        '10. Document changes'
      ],
      outputFormat: 'JSON with library optimization'
    },
    outputSchema: {
      type: 'object',
      required: ['changes', 'expectedSavings', 'artifacts'],
      properties: {
        changes: { type: 'array', items: { type: 'object' } },
        replacements: { type: 'array', items: { type: 'object' } },
        expectedSavings: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'code-size', 'libraries']
}));

export const dataOptimizationTask = defineTask('data-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Data Optimization - ${args.projectName}`,
  agent: {
    name: 'performance-optimization-agent',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Optimize data structures',
      context: args,
      instructions: [
        '1. Review struct packing',
        '2. Optimize array sizes',
        '3. Check string storage',
        '4. Use smaller types',
        '5. Review lookup tables',
        '6. Optimize enums',
        '7. Check alignment waste',
        '8. Review constants',
        '9. Calculate savings',
        '10. Document changes'
      ],
      outputFormat: 'JSON with data optimization'
    },
    outputSchema: {
      type: 'object',
      required: ['changes', 'expectedSavings', 'artifacts'],
      properties: {
        changes: { type: 'array', items: { type: 'object' } },
        structChanges: { type: 'array', items: { type: 'object' } },
        expectedSavings: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'code-size', 'data']
}));

export const optimizedBuildConfigTask = defineTask('optimized-build-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Build Configuration - ${args.projectName}`,
  agent: {
    name: 'performance-optimization-agent',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Generate optimized build configuration',
      context: args,
      instructions: [
        '1. Create CMakeLists.txt',
        '2. Set compiler flags',
        '3. Configure linker flags',
        '4. Set library specs',
        '5. Configure LTO',
        '6. Set defines',
        '7. Add size reporting',
        '8. Create build script',
        '9. Add verification',
        '10. Document configuration'
      ],
      outputFormat: 'JSON with build configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['configuration', 'configPath', 'artifacts'],
      properties: {
        configuration: { type: 'object' },
        configPath: { type: 'string' },
        buildScript: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'code-size', 'build']
}));

export const sizeReductionVerificationTask = defineTask('size-reduction-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Verification - ${args.projectName}`,
  agent: {
    name: 'performance-optimization-agent',
    prompt: {
      role: 'Embedded Systems Engineer',
      task: 'Verify size reduction',
      context: args,
      instructions: [
        '1. Build with new config',
        '2. Measure new size',
        '3. Compare to original',
        '4. Calculate reduction',
        '5. Check target met',
        '6. Verify functionality',
        '7. Run basic tests',
        '8. Check section sizes',
        '9. Document results',
        '10. Create report'
      ],
      outputFormat: 'JSON with verification results'
    },
    outputSchema: {
      type: 'object',
      required: ['newSize', 'reduction', 'targetMet', 'artifacts'],
      properties: {
        newSize: { type: 'string' },
        reduction: { type: 'string' },
        targetMet: { type: 'boolean' },
        sectionSizes: { type: 'object' },
        functionalityVerified: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['embedded-systems', 'code-size', 'verification']
}));
