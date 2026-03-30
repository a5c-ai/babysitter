/**
 * @process computer-science/cache-optimization-analysis
 * @description Analyze and optimize algorithms and data structures for cache efficiency using external memory model
 * @inputs { algorithmDescription: string, dataStructureDescription: string, targetArchitecture: object }
 * @outputs { success: boolean, cacheAnalysis: object, optimizedDesign: object, benchmarks: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    algorithmDescription,
    dataStructureDescription = '',
    targetArchitecture = {},
    optimizationGoals = [],
    outputDir = 'cache-optimization-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Cache Optimization Analysis');

  // ============================================================================
  // PHASE 1: MEMORY ACCESS PATTERN ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing memory access patterns');
  const accessPatternAnalysis = await ctx.task(accessPatternAnalysisTask, {
    algorithmDescription,
    dataStructureDescription,
    outputDir
  });

  artifacts.push(...accessPatternAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: CACHE BEHAVIOR MODELING
  // ============================================================================

  ctx.log('info', 'Phase 2: Modeling cache behavior');
  const cacheBehaviorModel = await ctx.task(cacheBehaviorModelingTask, {
    algorithmDescription,
    accessPatternAnalysis,
    targetArchitecture,
    outputDir
  });

  artifacts.push(...cacheBehaviorModel.artifacts);

  // ============================================================================
  // PHASE 3: DATA LAYOUT OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Optimizing data layout for spatial locality');
  const dataLayoutOptimization = await ctx.task(dataLayoutOptimizationTask, {
    algorithmDescription,
    dataStructureDescription,
    accessPatternAnalysis,
    cacheBehaviorModel,
    outputDir
  });

  artifacts.push(...dataLayoutOptimization.artifacts);

  // ============================================================================
  // PHASE 4: CACHE-OBLIVIOUS ALGORITHM DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 4: Designing cache-oblivious algorithms');
  const cacheObliviousDesign = await ctx.task(cacheObliviousDesignTask, {
    algorithmDescription,
    dataStructureDescription,
    accessPatternAnalysis,
    outputDir
  });

  artifacts.push(...cacheObliviousDesign.artifacts);

  // ============================================================================
  // PHASE 5: THEORETICAL CACHE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Computing theoretical cache complexity');
  const theoreticalAnalysis = await ctx.task(theoreticalCacheAnalysisTask, {
    algorithmDescription,
    cacheObliviousDesign,
    cacheBehaviorModel,
    outputDir
  });

  artifacts.push(...theoreticalAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: BENCHMARK DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 6: Designing cache performance benchmarks');
  const benchmarkDesign = await ctx.task(benchmarkDesignTask, {
    algorithmDescription,
    dataLayoutOptimization,
    cacheObliviousDesign,
    targetArchitecture,
    outputDir
  });

  artifacts.push(...benchmarkDesign.artifacts);

  // ============================================================================
  // PHASE 7: COMPARISON ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 7: Comparing theoretical and empirical performance');
  const comparisonAnalysis = await ctx.task(comparisonAnalysisTask, {
    theoreticalAnalysis,
    benchmarkDesign,
    outputDir
  });

  artifacts.push(...comparisonAnalysis.artifacts);

  // ============================================================================
  // PHASE 8: CACHE OPTIMIZATION REPORT
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating cache optimization report');
  const optimizationReport = await ctx.task(cacheOptimizationReportTask, {
    algorithmDescription,
    accessPatternAnalysis,
    cacheBehaviorModel,
    dataLayoutOptimization,
    cacheObliviousDesign,
    theoreticalAnalysis,
    benchmarkDesign,
    comparisonAnalysis,
    outputDir
  });

  artifacts.push(...optimizationReport.artifacts);

  // Breakpoint: Review cache optimization analysis
  await ctx.breakpoint({
    question: `Cache optimization analysis complete. Cache complexity: ${theoreticalAnalysis.cacheComplexity}. Improvement: ${comparisonAnalysis.improvement}. Review analysis?`,
    title: 'Cache Optimization Analysis Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        accessPattern: accessPatternAnalysis.dominantPattern,
        cacheComplexity: theoreticalAnalysis.cacheComplexity,
        dataLayoutChanges: dataLayoutOptimization.changes?.length || 0,
        expectedImprovement: comparisonAnalysis.improvement
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    algorithmDescription,
    cacheAnalysis: {
      accessPatterns: accessPatternAnalysis.patterns,
      cacheBehavior: cacheBehaviorModel.behavior,
      cacheComplexity: theoreticalAnalysis.cacheComplexity,
      cacheMissAnalysis: cacheBehaviorModel.cacheMissAnalysis
    },
    optimizedDesign: {
      dataLayout: dataLayoutOptimization.optimizedLayout,
      cacheObliviousDesign: cacheObliviousDesign.design,
      optimizations: dataLayoutOptimization.optimizations
    },
    benchmarks: {
      benchmarkSuite: benchmarkDesign.benchmarkSuite,
      expectedResults: benchmarkDesign.expectedResults,
      comparison: comparisonAnalysis.comparison
    },
    reportPath: optimizationReport.reportPath,
    artifacts,
    duration,
    metadata: {
      processId: 'computer-science/cache-optimization-analysis',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Access Pattern Analysis
export const accessPatternAnalysisTask = defineTask('access-pattern-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze memory access patterns',
  agent: {
    name: 'systems-engineer',
    skills: ['cache-simulator', 'memory-hierarchy-modeler', 'asymptotic-notation-calculator'],
    prompt: {
      role: 'memory access pattern specialist',
      task: 'Analyze memory access patterns of the algorithm and data structures',
      context: args,
      instructions: [
        'Identify data structures and their memory layouts',
        'Trace access patterns through algorithm execution',
        'Classify patterns: sequential, strided, random, etc.',
        'Identify spatial locality characteristics',
        'Identify temporal locality characteristics',
        'Find hot spots and frequently accessed data',
        'Document access pattern findings',
        'Generate access pattern analysis report'
      ],
      outputFormat: 'JSON with patterns, dominantPattern, spatialLocality, temporalLocality, hotSpots, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['patterns', 'dominantPattern', 'artifacts'],
      properties: {
        patterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dataStructure: { type: 'string' },
              pattern: { type: 'string' },
              frequency: { type: 'string' }
            }
          }
        },
        dominantPattern: { type: 'string', enum: ['sequential', 'strided', 'random', 'mixed'] },
        spatialLocality: { type: 'string', enum: ['high', 'medium', 'low'] },
        temporalLocality: { type: 'string', enum: ['high', 'medium', 'low'] },
        hotSpots: { type: 'array', items: { type: 'string' } },
        accessTrace: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cache-optimization', 'access-patterns']
}));

// Task 2: Cache Behavior Modeling
export const cacheBehaviorModelingTask = defineTask('cache-behavior-modeling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Model cache behavior',
  agent: {
    name: 'systems-engineer',
    skills: ['cache-simulator', 'memory-hierarchy-modeler', 'asymptotic-notation-calculator'],
    prompt: {
      role: 'cache behavior specialist',
      task: 'Model cache behavior using external memory model',
      context: args,
      instructions: [
        'Define external memory model parameters (M, B)',
        'Model cache as two-level memory hierarchy',
        'Analyze cache line utilization',
        'Estimate cache misses (compulsory, capacity, conflict)',
        'Model multi-level cache behavior if applicable',
        'Consider cache associativity effects',
        'Document cache model assumptions',
        'Generate cache behavior model'
      ],
      outputFormat: 'JSON with behavior, externalMemoryModel, cacheMissAnalysis, cacheLineUtilization, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['behavior', 'externalMemoryModel', 'cacheMissAnalysis', 'artifacts'],
      properties: {
        behavior: { type: 'string' },
        externalMemoryModel: {
          type: 'object',
          properties: {
            M: { type: 'string' },
            B: { type: 'string' },
            description: { type: 'string' }
          }
        },
        cacheMissAnalysis: {
          type: 'object',
          properties: {
            compulsoryMisses: { type: 'string' },
            capacityMisses: { type: 'string' },
            conflictMisses: { type: 'string' },
            totalMisses: { type: 'string' }
          }
        },
        cacheLineUtilization: { type: 'string' },
        multiLevelAnalysis: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cache-optimization', 'cache-model']
}));

// Task 3: Data Layout Optimization
export const dataLayoutOptimizationTask = defineTask('data-layout-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Optimize data layout for spatial locality',
  agent: {
    name: 'systems-engineer',
    skills: ['cache-simulator', 'memory-hierarchy-modeler', 'latex-proof-formatter'],
    prompt: {
      role: 'data layout optimization specialist',
      task: 'Optimize data structure layout for improved spatial locality',
      context: args,
      instructions: [
        'Analyze current data layout',
        'Apply structure-of-arrays vs array-of-structures analysis',
        'Consider data alignment for cache lines',
        'Apply field reordering for hot/cold separation',
        'Consider padding to avoid false sharing',
        'Apply data structure linearization',
        'Document layout optimizations',
        'Generate optimized data layout specification'
      ],
      outputFormat: 'JSON with optimizedLayout, changes, soaVsAos, alignment, padding, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizedLayout', 'changes', 'artifacts'],
      properties: {
        optimizedLayout: { type: 'string' },
        originalLayout: { type: 'string' },
        changes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              change: { type: 'string' },
              rationale: { type: 'string' },
              expectedBenefit: { type: 'string' }
            }
          }
        },
        soaVsAos: { type: 'string' },
        alignment: { type: 'string' },
        padding: { type: 'string' },
        optimizations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cache-optimization', 'data-layout']
}));

// Task 4: Cache-Oblivious Design
export const cacheObliviousDesignTask = defineTask('cache-oblivious-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design cache-oblivious algorithms',
  agent: {
    name: 'algorithm-analyst',
    skills: ['cache-simulator', 'asymptotic-notation-calculator', 'recurrence-solver'],
    prompt: {
      role: 'cache-oblivious algorithm specialist',
      task: 'Design cache-oblivious algorithm variant if applicable',
      context: args,
      instructions: [
        'Assess if cache-oblivious design is beneficial',
        'Apply recursive divide-and-conquer decomposition',
        'Design for optimal cache behavior without knowing cache parameters',
        'Consider van Emde Boas layout for trees',
        'Consider blocked/tiled versions for matrices',
        'Analyze cache-oblivious vs cache-aware tradeoffs',
        'Document cache-oblivious design',
        'Generate cache-oblivious algorithm specification'
      ],
      outputFormat: 'JSON with design, applicable, recursiveDecomposition, layout, cacheObliviousComplexity, tradeoffs, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'applicable', 'artifacts'],
      properties: {
        design: { type: 'string' },
        applicable: { type: 'boolean' },
        recursiveDecomposition: { type: 'string' },
        layout: { type: 'string' },
        cacheObliviousComplexity: { type: 'string' },
        cacheAwareAlternative: { type: 'string' },
        tradeoffs: { type: 'array', items: { type: 'string' } },
        pseudocode: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cache-optimization', 'cache-oblivious']
}));

// Task 5: Theoretical Cache Analysis
export const theoreticalCacheAnalysisTask = defineTask('theoretical-cache-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compute theoretical cache complexity',
  agent: {
    name: 'algorithm-analyst',
    skills: ['asymptotic-notation-calculator', 'cache-simulator', 'latex-proof-formatter'],
    prompt: {
      role: 'cache complexity analyst',
      task: 'Compute theoretical cache complexity in external memory model',
      context: args,
      instructions: [
        'Express cache complexity in terms of N, M, B',
        'Derive number of memory transfers Q(N; M, B)',
        'Compare with I/O-optimal algorithms',
        'Analyze scan complexity O(N/B)',
        'Analyze sort complexity O(N/B log_{M/B} N/B)',
        'Consider lower bounds for the problem',
        'Document cache complexity analysis',
        'Generate theoretical analysis report'
      ],
      outputFormat: 'JSON with cacheComplexity, memoryTransfers, comparison, lowerBound, optimality, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['cacheComplexity', 'memoryTransfers', 'artifacts'],
      properties: {
        cacheComplexity: { type: 'string' },
        memoryTransfers: { type: 'string' },
        ioComplexity: { type: 'string' },
        scanComplexity: { type: 'string' },
        sortComplexity: { type: 'string' },
        lowerBound: { type: 'string' },
        optimality: { type: 'string' },
        comparison: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cache-optimization', 'complexity']
}));

// Task 6: Benchmark Design
export const benchmarkDesignTask = defineTask('benchmark-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design cache performance benchmarks',
  agent: {
    name: 'systems-engineer',
    skills: ['cache-simulator', 'memory-hierarchy-modeler', 'asymptotic-notation-calculator'],
    prompt: {
      role: 'performance benchmarking specialist',
      task: 'Design benchmarks to measure cache performance',
      context: args,
      instructions: [
        'Design micro-benchmarks for cache behavior',
        'Use hardware performance counters (cache misses, etc.)',
        'Design tests at different data sizes',
        'Include tests that fit in L1, L2, L3, and exceed cache',
        'Design comparison benchmarks (original vs optimized)',
        'Plan statistical methodology (multiple runs, warm-up)',
        'Document benchmark methodology',
        'Generate benchmark specification'
      ],
      outputFormat: 'JSON with benchmarkSuite, metrics, dataSizes, methodology, expectedResults, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['benchmarkSuite', 'metrics', 'artifacts'],
      properties: {
        benchmarkSuite: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              dataSizes: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        metrics: { type: 'array', items: { type: 'string' } },
        dataSizes: { type: 'array', items: { type: 'string' } },
        methodology: { type: 'string' },
        performanceCounters: { type: 'array', items: { type: 'string' } },
        expectedResults: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cache-optimization', 'benchmarks']
}));

// Task 7: Comparison Analysis
export const comparisonAnalysisTask = defineTask('comparison-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compare theoretical and empirical performance',
  agent: {
    name: 'systems-engineer',
    skills: ['cache-simulator', 'asymptotic-notation-calculator', 'memory-hierarchy-modeler'],
    prompt: {
      role: 'performance analysis specialist',
      task: 'Compare theoretical cache analysis with expected empirical results',
      context: args,
      instructions: [
        'Compare theoretical cache complexity to expected measurements',
        'Analyze gaps between model and reality',
        'Consider factors not in simple model (prefetching, TLB, etc.)',
        'Document expected vs theoretical performance',
        'Identify when model predictions may diverge',
        'Quantify expected improvement from optimizations',
        'Generate comparison analysis'
      ],
      outputFormat: 'JSON with comparison, improvement, modelAccuracy, realWorldFactors, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['comparison', 'improvement', 'artifacts'],
      properties: {
        comparison: { type: 'string' },
        improvement: { type: 'string' },
        theoreticalVsEmpirical: { type: 'object' },
        modelAccuracy: { type: 'string' },
        realWorldFactors: { type: 'array', items: { type: 'string' } },
        divergenceConditions: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cache-optimization', 'comparison']
}));

// Task 8: Cache Optimization Report
export const cacheOptimizationReportTask = defineTask('cache-optimization-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate cache optimization report',
  agent: {
    name: 'systems-engineer',
    skills: ['latex-proof-formatter', 'cache-simulator'],
    prompt: {
      role: 'technical documentation specialist',
      task: 'Generate comprehensive cache optimization report',
      context: args,
      instructions: [
        'Create executive summary of cache analysis',
        'Document memory access patterns',
        'Present cache behavior model',
        'Detail data layout optimizations',
        'Present cache-oblivious design if applicable',
        'Include theoretical complexity analysis',
        'Document benchmark methodology and expected results',
        'Provide practical recommendations',
        'Format as professional technical report'
      ],
      outputFormat: 'JSON with reportPath, executiveSummary, keyFindings, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        tableOfContents: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cache-optimization', 'documentation']
}));
