/**
 * @process specializations/cryptography-blockchain/gas-optimization
 * @description Gas Optimization Process - Systematic optimization of smart contract gas consumption through code refactoring,
 * storage optimization, and algorithmic improvements while maintaining security properties.
 * @inputs { projectName: string, contractPaths?: array, optimizationLevel?: string, securityFirst?: boolean }
 * @outputs { success: boolean, optimizations: array, gasSavings: object, beforeAfterReport: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/cryptography-blockchain/gas-optimization', {
 *   projectName: 'DeFi Protocol',
 *   contractPaths: ['contracts/'],
 *   optimizationLevel: 'aggressive',
 *   securityFirst: true,
 *   targetGasReduction: 30
 * });
 *
 * @references
 * - EVM Codes: https://www.evm.codes/
 * - Foundry Gas Reports: https://book.getfoundry.sh/forge/gas-reports
 * - Solidity Gas Optimization Guide: https://www.alchemy.com/overviews/solidity-gas-optimization
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    contractPaths = ['contracts/'],
    optimizationLevel = 'standard',
    securityFirst = true,
    targetGasReduction = 20,
    framework = 'foundry',
    outputDir = 'gas-optimization-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Gas Optimization: ${projectName}`);
  ctx.log('info', `Optimization Level: ${optimizationLevel}, Target Reduction: ${targetGasReduction}%`);

  // ============================================================================
  // PHASE 1: BASELINE GAS PROFILING
  // ============================================================================

  ctx.log('info', 'Phase 1: Establishing baseline gas profile');

  const baselineProfile = await ctx.task(baselineProfilingTask, {
    projectName,
    contractPaths,
    framework,
    outputDir
  });

  artifacts.push(...baselineProfile.artifacts);

  // ============================================================================
  // PHASE 2: STORAGE OPTIMIZATION ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing storage optimization opportunities');

  const storageAnalysis = await ctx.task(storageOptimizationTask, {
    projectName,
    baselineProfile,
    outputDir
  });

  artifacts.push(...storageAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: CALLDATA OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Optimizing calldata usage');

  const calldataOptimization = await ctx.task(calldataOptimizationTask, {
    projectName,
    baselineProfile,
    outputDir
  });

  artifacts.push(...calldataOptimization.artifacts);

  // ============================================================================
  // PHASE 4: LOOP AND BATCH OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Optimizing loops and batch operations');

  const loopOptimization = await ctx.task(loopOptimizationTask, {
    projectName,
    baselineProfile,
    outputDir
  });

  artifacts.push(...loopOptimization.artifacts);

  // ============================================================================
  // PHASE 5: ARITHMETIC OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Optimizing arithmetic operations');

  const arithmeticOptimization = await ctx.task(arithmeticOptimizationTask, {
    projectName,
    baselineProfile,
    securityFirst,
    outputDir
  });

  artifacts.push(...arithmeticOptimization.artifacts);

  // ============================================================================
  // PHASE 6: ERROR HANDLING OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Optimizing error handling');

  const errorOptimization = await ctx.task(errorOptimizationTask, {
    projectName,
    baselineProfile,
    outputDir
  });

  artifacts.push(...errorOptimization.artifacts);

  // Quality Gate: Optimization Review
  await ctx.breakpoint({
    question: `Gas optimization analysis complete. Identified ${storageAnalysis.opportunities.length + calldataOptimization.opportunities.length + loopOptimization.opportunities.length} optimization opportunities. Proceed with implementation?`,
    title: 'Gas Optimization Review',
    context: {
      runId: ctx.runId,
      projectName,
      storageOptimizations: storageAnalysis.opportunities.length,
      calldataOptimizations: calldataOptimization.opportunities.length,
      loopOptimizations: loopOptimization.opportunities.length,
      estimatedSavings: storageAnalysis.estimatedSavings + calldataOptimization.estimatedSavings,
      files: artifacts.slice(-3).map(a => ({ path: a.path, format: 'json' }))
    }
  });

  // ============================================================================
  // PHASE 7: IMPLEMENT OPTIMIZATIONS
  // ============================================================================

  ctx.log('info', 'Phase 7: Implementing optimizations');

  const implementation = await ctx.task(implementOptimizationsTask, {
    projectName,
    storageAnalysis,
    calldataOptimization,
    loopOptimization,
    arithmeticOptimization,
    errorOptimization,
    securityFirst,
    outputDir
  });

  artifacts.push(...implementation.artifacts);

  // ============================================================================
  // PHASE 8: POST-OPTIMIZATION TESTING
  // ============================================================================

  ctx.log('info', 'Phase 8: Running post-optimization tests');

  const postOptimizationTests = await ctx.task(postOptimizationTestingTask, {
    projectName,
    implementation,
    framework,
    outputDir
  });

  artifacts.push(...postOptimizationTests.artifacts);

  // ============================================================================
  // PHASE 9: FINAL GAS REPORT
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating final gas comparison report');

  const finalReport = await ctx.task(finalGasReportTask, {
    projectName,
    baselineProfile,
    implementation,
    postOptimizationTests,
    targetGasReduction,
    outputDir
  });

  artifacts.push(...finalReport.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Gas Optimization Complete. Overall reduction: ${finalReport.overallReduction}%. Target was ${targetGasReduction}%. All tests passing: ${postOptimizationTests.allPassing}. Accept optimizations?`,
    title: 'Gas Optimization Complete',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        overallReduction: finalReport.overallReduction,
        targetReduction: targetGasReduction,
        targetMet: finalReport.overallReduction >= targetGasReduction,
        allTestsPassing: postOptimizationTests.allPassing,
        optimizationsApplied: implementation.appliedOptimizations.length
      },
      files: [
        { path: finalReport.reportPath, format: 'markdown', label: 'Gas Report' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    optimizations: implementation.appliedOptimizations,
    gasSavings: {
      overall: finalReport.overallReduction,
      byFunction: finalReport.savingsByFunction,
      byContract: finalReport.savingsByContract
    },
    beforeAfterReport: {
      baseline: baselineProfile.gasReport,
      optimized: finalReport.optimizedGasReport,
      comparison: finalReport.comparison
    },
    testResults: {
      allPassing: postOptimizationTests.allPassing,
      coverage: postOptimizationTests.coverage
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/cryptography-blockchain/gas-optimization',
      timestamp: startTime,
      optimizationLevel,
      framework
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const baselineProfilingTask = defineTask('baseline-profiling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Baseline Profiling - ${args.projectName}`,
  agent: {
    name: 'gas-optimizer', // AG-008: Smart Contract Gas Optimizer (uses SK-018: gas-optimization, SK-008: evm-analysis)
    prompt: {
      role: 'Smart Contract Gas Analyst',
      task: 'Establish baseline gas consumption profile',
      context: args,
      instructions: [
        '1. Run full test suite with gas reporting',
        '2. Generate per-function gas consumption',
        '3. Identify highest gas functions',
        '4. Analyze storage read/write patterns',
        '5. Profile deployment costs',
        '6. Measure average and max gas per function',
        '7. Identify gas-intensive code paths',
        '8. Document baseline metrics',
        '9. Create gas heat map',
        '10. Export baseline report'
      ],
      outputFormat: 'JSON with baseline gas profile'
    },
    outputSchema: {
      type: 'object',
      required: ['gasReport', 'highGasFunctions', 'artifacts'],
      properties: {
        gasReport: { type: 'object' },
        highGasFunctions: { type: 'array', items: { type: 'object' } },
        deploymentCosts: { type: 'object' },
        storagePatterns: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'gas', 'profiling']
}));

export const storageOptimizationTask = defineTask('storage-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Storage Optimization - ${args.projectName}`,
  agent: {
    name: 'gas-optimizer', // AG-008: Smart Contract Gas Optimizer (uses SK-008: evm-analysis)
    prompt: {
      role: 'Storage Optimization Specialist',
      task: 'Analyze and optimize storage usage',
      context: args,
      instructions: [
        '1. Analyze storage variable layout',
        '2. Identify packing opportunities',
        '3. Find redundant storage reads',
        '4. Identify cacheable storage values',
        '5. Find storage to memory opportunities',
        '6. Analyze struct packing',
        '7. Check for unnecessary storage writes',
        '8. Identify mapping vs array trade-offs',
        '9. Calculate potential gas savings',
        '10. Document optimization opportunities'
      ],
      outputFormat: 'JSON with storage optimization analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['opportunities', 'estimatedSavings', 'artifacts'],
      properties: {
        opportunities: { type: 'array', items: { type: 'object' } },
        estimatedSavings: { type: 'number' },
        currentLayout: { type: 'object' },
        optimizedLayout: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'gas', 'storage']
}));

export const calldataOptimizationTask = defineTask('calldata-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Calldata Optimization - ${args.projectName}`,
  agent: {
    name: 'gas-optimizer', // AG-008: Smart Contract Gas Optimizer (uses SK-018: gas-optimization)
    prompt: {
      role: 'Calldata Optimization Specialist',
      task: 'Optimize calldata and memory usage',
      context: args,
      instructions: [
        '1. Find memory that can be calldata',
        '2. Optimize function parameter types',
        '3. Reduce calldata size where possible',
        '4. Identify bytes vs string opportunities',
        '5. Optimize array passing patterns',
        '6. Check for unnecessary memory copies',
        '7. Analyze external vs public functions',
        '8. Calculate potential savings',
        '9. Consider calldata encoding',
        '10. Document recommendations'
      ],
      outputFormat: 'JSON with calldata optimization analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['opportunities', 'estimatedSavings', 'artifacts'],
      properties: {
        opportunities: { type: 'array', items: { type: 'object' } },
        estimatedSavings: { type: 'number' },
        memoryToCalldata: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'gas', 'calldata']
}));

export const loopOptimizationTask = defineTask('loop-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Loop Optimization - ${args.projectName}`,
  agent: {
    name: 'gas-optimizer', // AG-008: Smart Contract Gas Optimizer (uses SK-018: gas-optimization)
    prompt: {
      role: 'Loop Optimization Specialist',
      task: 'Optimize loops and batch operations',
      context: args,
      instructions: [
        '1. Identify all loops in contracts',
        '2. Cache loop length in memory',
        '3. Use unchecked increment',
        '4. Move invariants outside loops',
        '5. Optimize loop variable types',
        '6. Consider loop unrolling',
        '7. Batch operations where possible',
        '8. Analyze nested loop impact',
        '9. Calculate savings per iteration',
        '10. Document optimization opportunities'
      ],
      outputFormat: 'JSON with loop optimization analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['opportunities', 'estimatedSavings', 'artifacts'],
      properties: {
        opportunities: { type: 'array', items: { type: 'object' } },
        estimatedSavings: { type: 'number' },
        loopsAnalyzed: { type: 'number' },
        batchingOpportunities: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'gas', 'loops']
}));

export const arithmeticOptimizationTask = defineTask('arithmetic-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Arithmetic Optimization - ${args.projectName}`,
  agent: {
    name: 'gas-optimizer', // AG-008: Smart Contract Gas Optimizer (uses SK-018: gas-optimization)
    prompt: {
      role: 'Arithmetic Optimization Specialist',
      task: 'Optimize arithmetic operations safely',
      context: args,
      instructions: [
        '1. Identify safe unchecked blocks',
        '2. Optimize division/multiplication order',
        '3. Use bit shifting where appropriate',
        '4. Simplify mathematical expressions',
        '5. Remove redundant checks',
        '6. Optimize comparison operations',
        '7. Consider pre-computed constants',
        '8. Analyze overflow/underflow safety',
        '9. Document security implications',
        '10. Verify optimizations are safe'
      ],
      outputFormat: 'JSON with arithmetic optimization analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['opportunities', 'securityNotes', 'artifacts'],
      properties: {
        opportunities: { type: 'array', items: { type: 'object' } },
        uncheckedBlocks: { type: 'array', items: { type: 'object' } },
        securityNotes: { type: 'array', items: { type: 'string' } },
        estimatedSavings: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'gas', 'arithmetic']
}));

export const errorOptimizationTask = defineTask('error-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Error Handling Optimization - ${args.projectName}`,
  agent: {
    name: 'gas-optimizer', // AG-008: Smart Contract Gas Optimizer (uses SK-018: gas-optimization)
    prompt: {
      role: 'Error Handling Optimizer',
      task: 'Optimize error handling for gas efficiency',
      context: args,
      instructions: [
        '1. Convert revert strings to custom errors',
        '2. Optimize require statement ordering',
        '3. Combine related checks',
        '4. Use assembly for error handling',
        '5. Optimize error message lengths',
        '6. Remove redundant checks',
        '7. Optimize assert usage',
        '8. Consider early returns',
        '9. Calculate gas savings',
        '10. Document all changes'
      ],
      outputFormat: 'JSON with error optimization analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['opportunities', 'customErrors', 'artifacts'],
      properties: {
        opportunities: { type: 'array', items: { type: 'object' } },
        customErrors: { type: 'array', items: { type: 'object' } },
        revertStringsFound: { type: 'number' },
        estimatedSavings: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'gas', 'errors']
}));

export const implementOptimizationsTask = defineTask('implement-optimizations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Implement Optimizations - ${args.projectName}`,
  agent: {
    name: 'gas-optimizer', // AG-008: Smart Contract Gas Optimizer (uses SK-001: solidity-dev, SK-018: gas-optimization)
    prompt: {
      role: 'Optimization Implementation Engineer',
      task: 'Implement gas optimizations',
      context: args,
      instructions: [
        '1. Apply storage packing changes',
        '2. Implement calldata optimizations',
        '3. Apply loop optimizations',
        '4. Implement unchecked blocks safely',
        '5. Convert to custom errors',
        '6. Apply assembly optimizations carefully',
        '7. Update NatSpec documentation',
        '8. Maintain code readability',
        '9. Preserve security properties',
        '10. Create diff of all changes'
      ],
      outputFormat: 'JSON with implementation details'
    },
    outputSchema: {
      type: 'object',
      required: ['appliedOptimizations', 'modifiedFiles', 'artifacts'],
      properties: {
        appliedOptimizations: { type: 'array', items: { type: 'object' } },
        modifiedFiles: { type: 'array', items: { type: 'string' } },
        skippedOptimizations: { type: 'array', items: { type: 'object' } },
        securityPreserved: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'gas', 'implementation']
}));

export const postOptimizationTestingTask = defineTask('post-optimization-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Post-Optimization Testing - ${args.projectName}`,
  agent: {
    name: 'gas-optimizer', // AG-008: Smart Contract Gas Optimizer (uses SK-004: foundry-framework)
    prompt: {
      role: 'QA Engineer',
      task: 'Verify optimizations maintain functionality',
      context: args,
      instructions: [
        '1. Run full test suite',
        '2. Verify all tests pass',
        '3. Check coverage is maintained',
        '4. Run fuzz tests',
        '5. Verify invariants hold',
        '6. Test edge cases',
        '7. Run security checks',
        '8. Compare behavior before/after',
        '9. Document any issues',
        '10. Sign off on changes'
      ],
      outputFormat: 'JSON with test results'
    },
    outputSchema: {
      type: 'object',
      required: ['allPassing', 'coverage', 'artifacts'],
      properties: {
        allPassing: { type: 'boolean' },
        coverage: { type: 'number' },
        testsRun: { type: 'number' },
        failedTests: { type: 'array', items: { type: 'string' } },
        behaviorChanges: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'gas', 'testing']
}));

export const finalGasReportTask = defineTask('final-gas-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Final Gas Report - ${args.projectName}`,
  agent: {
    name: 'gas-optimizer', // AG-008: Smart Contract Gas Optimizer
    prompt: {
      role: 'Gas Optimization Reporter',
      task: 'Generate comprehensive gas comparison report',
      context: args,
      instructions: [
        '1. Generate new gas report',
        '2. Compare baseline vs optimized',
        '3. Calculate overall reduction',
        '4. Calculate per-function savings',
        '5. Calculate deployment savings',
        '6. Create comparison charts',
        '7. Document all optimizations',
        '8. Highlight biggest wins',
        '9. Note any trade-offs',
        '10. Generate final report'
      ],
      outputFormat: 'JSON with final gas report'
    },
    outputSchema: {
      type: 'object',
      required: ['overallReduction', 'reportPath', 'artifacts'],
      properties: {
        overallReduction: { type: 'number' },
        optimizedGasReport: { type: 'object' },
        comparison: { type: 'object' },
        savingsByFunction: { type: 'object' },
        savingsByContract: { type: 'object' },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['blockchain', 'gas', 'reporting']
}));
