/**
 * @process specializations/domains/science/mathematics/benchmark-validation
 * @description Validate mathematical software implementations against standard benchmark problems
 * and analytical solutions.
 * @inputs { implementation: object, benchmarkSuite?: string, analyticalSolutions?: array, tolerances?: object }
 * @outputs { success: boolean, benchmarkResults: array, accuracyMetrics: object, performanceMetrics: object, validationReport: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/mathematics/benchmark-validation', {
 *   implementation: { name: 'my-ode-solver', language: 'python', entry: 'solver.solve' },
 *   benchmarkSuite: 'DETEST',
 *   analyticalSolutions: [{ problem: 'exp-decay', solution: 'y = exp(-t)' }],
 *   tolerances: { relative: 1e-6, absolute: 1e-10 }
 * });
 *
 * @references
 * - NIST Digital Library of Mathematical Functions
 * - DETEST ODE benchmark suite
 * - LINPACK benchmark
 * - LAPACK test suite
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    implementation,
    benchmarkSuite = 'standard',
    analyticalSolutions = [],
    tolerances = { relative: 1e-6, absolute: 1e-10 }
  } = inputs;

  // Phase 1: Identify Appropriate Benchmarks
  const benchmarkIdentification = await ctx.task(benchmarkIdentificationTask, {
    implementation,
    benchmarkSuite,
    analyticalSolutions
  });

  // Quality Gate: Benchmarks must be identifiable
  if (!benchmarkIdentification.benchmarks || benchmarkIdentification.benchmarks.length === 0) {
    return {
      success: false,
      error: 'Unable to identify appropriate benchmarks',
      phase: 'benchmark-identification',
      benchmarkResults: null
    };
  }

  // Breakpoint: Review benchmark selection
  await ctx.breakpoint({
    question: `Selected ${benchmarkIdentification.benchmarks.length} benchmarks for ${implementation.name}. Proceed with testing?`,
    title: 'Benchmark Selection Review',
    context: {
      runId: ctx.runId,
      implementation: implementation.name,
      benchmarks: benchmarkIdentification.benchmarks,
      files: [{
        path: `artifacts/phase1-benchmarks.json`,
        format: 'json',
        content: benchmarkIdentification
      }]
    }
  });

  // Phase 2: Run Benchmark Tests
  const benchmarkExecution = await ctx.task(benchmarkExecutionTask, {
    implementation,
    benchmarks: benchmarkIdentification.benchmarks,
    tolerances
  });

  // Phase 3: Compare to Analytical Solutions
  const analyticalComparison = await ctx.task(analyticalComparisonTask, {
    benchmarkExecution,
    analyticalSolutions,
    tolerances
  });

  // Phase 4: Document Accuracy and Performance
  const metricsDocumentation = await ctx.task(metricsDocumentationTask, {
    benchmarkExecution,
    analyticalComparison,
    implementation,
    tolerances
  });

  // Phase 5: Generate Validation Reports
  const validationReport = await ctx.task(validationReportTask, {
    benchmarkIdentification,
    benchmarkExecution,
    analyticalComparison,
    metricsDocumentation,
    implementation
  });

  // Final Breakpoint: Validation Complete
  const passRate = benchmarkExecution.passedTests / benchmarkExecution.totalTests * 100;
  await ctx.breakpoint({
    question: `Benchmark validation complete. Pass rate: ${passRate.toFixed(1)}%. Review results?`,
    title: 'Benchmark Validation Complete',
    context: {
      runId: ctx.runId,
      passRate,
      failedTests: benchmarkExecution.failedTests,
      files: [
        { path: `artifacts/validation-report.json`, format: 'json', content: validationReport }
      ]
    }
  });

  return {
    success: true,
    implementation: implementation.name,
    benchmarkResults: benchmarkExecution.results,
    accuracyMetrics: {
      maxRelativeError: metricsDocumentation.maxRelativeError,
      averageRelativeError: metricsDocumentation.averageRelativeError,
      withinTolerance: metricsDocumentation.withinTolerance
    },
    performanceMetrics: {
      totalTime: metricsDocumentation.totalTime,
      averageTimePerTest: metricsDocumentation.averageTimePerTest,
      memoryUsage: metricsDocumentation.memoryUsage
    },
    validationReport: {
      passRate,
      summary: validationReport.summary,
      recommendations: validationReport.recommendations
    },
    metadata: {
      processId: 'specializations/domains/science/mathematics/benchmark-validation',
      benchmarkSuite,
      tolerances,
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const benchmarkIdentificationTask = defineTask('benchmark-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Identify Appropriate Benchmarks`,
  agent: {
    name: 'numerical-analyst',
    skills: ['benchmark-suite-manager', 'numerical-linear-algebra-toolkit', 'floating-point-analysis'],
    prompt: {
      role: 'Mathematical Benchmarking Expert',
      task: 'Identify appropriate benchmark problems for validation',
      context: {
        implementation: args.implementation,
        benchmarkSuite: args.benchmarkSuite,
        analyticalSolutions: args.analyticalSolutions
      },
      instructions: [
        '1. Determine implementation domain (ODE, PDE, linear algebra, etc.)',
        '2. Select standard benchmark suite',
        '3. Identify problems with known analytical solutions',
        '4. Include easy, medium, and hard test cases',
        '5. Include edge cases and stress tests',
        '6. Select accuracy-focused benchmarks',
        '7. Select performance-focused benchmarks',
        '8. Include convergence tests',
        '9. Document benchmark sources',
        '10. Create benchmark specification'
      ],
      outputFormat: 'JSON object with benchmark identification'
    },
    outputSchema: {
      type: 'object',
      required: ['benchmarks', 'suite'],
      properties: {
        suite: { type: 'string' },
        benchmarks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              category: { type: 'string' },
              difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
              hasAnalyticalSolution: { type: 'boolean' },
              description: { type: 'string' },
              source: { type: 'string' }
            }
          }
        },
        analyticalBenchmarks: { type: 'array', items: { type: 'object' } },
        performanceBenchmarks: { type: 'array', items: { type: 'object' } },
        edgeCases: { type: 'array', items: { type: 'object' } },
        standardReferences: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'benchmark', 'identification']
}));

export const benchmarkExecutionTask = defineTask('benchmark-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Run Benchmark Tests`,
  agent: {
    name: 'numerical-analyst',
    skills: ['benchmark-suite-manager', 'numerical-linear-algebra-toolkit', 'floating-point-analysis'],
    prompt: {
      role: 'Benchmark Execution Specialist',
      task: 'Execute benchmarks and collect results',
      context: {
        implementation: args.implementation,
        benchmarks: args.benchmarks,
        tolerances: args.tolerances
      },
      instructions: [
        '1. Set up benchmark execution environment',
        '2. Run each benchmark test',
        '3. Collect numerical results',
        '4. Measure execution time',
        '5. Monitor memory usage',
        '6. Record convergence behavior',
        '7. Capture any errors or warnings',
        '8. Compare against tolerance thresholds',
        '9. Record pass/fail status',
        '10. Aggregate test results'
      ],
      outputFormat: 'JSON object with benchmark execution results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'totalTests', 'passedTests'],
      properties: {
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              benchmark: { type: 'string' },
              passed: { type: 'boolean' },
              computedValue: { type: 'string' },
              expectedValue: { type: 'string' },
              relativeError: { type: 'number' },
              absoluteError: { type: 'number' },
              executionTime: { type: 'number' },
              memoryUsage: { type: 'number' },
              notes: { type: 'string' }
            }
          }
        },
        totalTests: { type: 'number' },
        passedTests: { type: 'number' },
        failedTests: { type: 'number' },
        errors: { type: 'array', items: { type: 'object' } },
        totalExecutionTime: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'benchmark', 'execution']
}));

export const analyticalComparisonTask = defineTask('analytical-comparison', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Compare to Analytical Solutions`,
  agent: {
    name: 'numerical-analyst',
    skills: ['sympy-computer-algebra', 'floating-point-analysis', 'numerical-linear-algebra-toolkit'],
    prompt: {
      role: 'Analytical Solution Comparison Expert',
      task: 'Compare numerical results against analytical solutions',
      context: {
        benchmarkExecution: args.benchmarkExecution,
        analyticalSolutions: args.analyticalSolutions,
        tolerances: args.tolerances
      },
      instructions: [
        '1. Match results with analytical solutions',
        '2. Compute point-wise errors',
        '3. Compute global error norms (L1, L2, Linf)',
        '4. Analyze error distribution',
        '5. Check convergence rates',
        '6. Compare at boundary conditions',
        '7. Check special points (extrema, inflections)',
        '8. Verify asymptotic behavior',
        '9. Document comparison methodology',
        '10. Generate comparison plots descriptions'
      ],
      outputFormat: 'JSON object with analytical comparison'
    },
    outputSchema: {
      type: 'object',
      required: ['comparisons', 'errorNorms'],
      properties: {
        comparisons: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              problem: { type: 'string' },
              analyticalSolution: { type: 'string' },
              pointwiseErrors: { type: 'array', items: { type: 'number' } },
              maxError: { type: 'number' },
              satisfiesTolerance: { type: 'boolean' }
            }
          }
        },
        errorNorms: {
          type: 'object',
          properties: {
            L1: { type: 'number' },
            L2: { type: 'number' },
            Linf: { type: 'number' }
          }
        },
        convergenceAnalysis: {
          type: 'object',
          properties: {
            observed: { type: 'number' },
            expected: { type: 'number' },
            matches: { type: 'boolean' }
          }
        },
        specialPointsCheck: { type: 'array', items: { type: 'object' } },
        plotDescriptions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'benchmark', 'analytical-comparison']
}));

export const metricsDocumentationTask = defineTask('metrics-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Document Accuracy and Performance`,
  agent: {
    name: 'numerical-analyst',
    skills: ['benchmark-suite-manager', 'floating-point-analysis', 'latex-math-formatter'],
    prompt: {
      role: 'Numerical Software Metrics Expert',
      task: 'Document comprehensive accuracy and performance metrics',
      context: {
        benchmarkExecution: args.benchmarkExecution,
        analyticalComparison: args.analyticalComparison,
        implementation: args.implementation,
        tolerances: args.tolerances
      },
      instructions: [
        '1. Compute aggregate accuracy statistics',
        '2. Document worst-case errors',
        '3. Document performance statistics',
        '4. Compare with reference implementations',
        '5. Document memory efficiency',
        '6. Assess scalability',
        '7. Document reliability metrics',
        '8. Create performance profiles',
        '9. Identify performance bottlenecks',
        '10. Generate metrics summary'
      ],
      outputFormat: 'JSON object with metrics documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['maxRelativeError', 'averageRelativeError', 'withinTolerance'],
      properties: {
        maxRelativeError: { type: 'number' },
        averageRelativeError: { type: 'number' },
        medianRelativeError: { type: 'number' },
        withinTolerance: { type: 'boolean' },
        totalTime: { type: 'number' },
        averageTimePerTest: { type: 'number' },
        memoryUsage: { type: 'string' },
        scalingBehavior: { type: 'string' },
        comparisonWithReference: {
          type: 'object',
          properties: {
            accuracyRatio: { type: 'number' },
            speedRatio: { type: 'number' }
          }
        },
        bottlenecks: { type: 'array', items: { type: 'string' } },
        reliabilityMetrics: {
          type: 'object',
          properties: {
            successRate: { type: 'number' },
            robustness: { type: 'string' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'benchmark', 'metrics']
}));

export const validationReportTask = defineTask('validation-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Generate Validation Reports`,
  agent: {
    name: 'numerical-analyst',
    skills: ['benchmark-suite-manager', 'latex-math-formatter', 'floating-point-analysis'],
    prompt: {
      role: 'Software Validation Report Specialist',
      task: 'Generate comprehensive validation report',
      context: {
        benchmarkIdentification: args.benchmarkIdentification,
        benchmarkExecution: args.benchmarkExecution,
        analyticalComparison: args.analyticalComparison,
        metricsDocumentation: args.metricsDocumentation,
        implementation: args.implementation
      },
      instructions: [
        '1. Write executive summary',
        '2. Document test methodology',
        '3. Present benchmark results',
        '4. Analyze failures and issues',
        '5. Compare with requirements',
        '6. Provide validation conclusion',
        '7. List recommendations',
        '8. Document limitations',
        '9. Suggest improvements',
        '10. Create detailed appendices'
      ],
      outputFormat: 'JSON object with validation report'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'recommendations', 'validationStatus'],
      properties: {
        summary: {
          type: 'object',
          properties: {
            executiveSummary: { type: 'string' },
            testsConducted: { type: 'number' },
            passRate: { type: 'number' },
            overallAssessment: { type: 'string' }
          }
        },
        validationStatus: { type: 'string', enum: ['passed', 'conditional-pass', 'failed'] },
        detailedResults: { type: 'string' },
        failureAnalysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              test: { type: 'string' },
              failure: { type: 'string' },
              rootCause: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              priority: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        limitations: { type: 'array', items: { type: 'string' } },
        improvements: { type: 'array', items: { type: 'string' } },
        appendices: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'benchmark', 'validation-report']
}));
