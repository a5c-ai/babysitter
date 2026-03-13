/**
 * @process quantum-computing/algorithm-benchmarking
 * @description QC-ALGO-003: Systematically benchmark quantum algorithms against classical alternatives
 * @inputs { algorithms: array, problemSuite: object, hardwareConfigs: array }
 * @outputs { success: boolean, benchmarkReport: object, quantumAdvantage: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    algorithms,
    problemSuite,
    hardwareConfigs = ['simulator', 'ibm_brisbane'],
    metrics = ['execution_time', 'fidelity', 'success_probability'],
    outputDir = 'benchmark-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Define Benchmark Problem Suite
  ctx.log('info', 'Defining benchmark problem suite and metrics');
  const problemDefinition = await ctx.task(problemSuiteDefinitionTask, {
    problemSuite,
    metrics,
    outputDir
  });

  if (!problemDefinition.success) {
    return {
      success: false,
      error: 'Problem suite definition failed',
      details: problemDefinition,
      metadata: { processId: 'quantum-computing/algorithm-benchmarking', timestamp: startTime }
    };
  }

  artifacts.push(...problemDefinition.artifacts);

  // Task 2: Implement Classical Baselines
  ctx.log('info', 'Implementing classical baseline algorithms');
  const classicalBaselines = await ctx.task(classicalBaselineTask, {
    problemSuite: problemDefinition.problems,
    outputDir
  });

  artifacts.push(...classicalBaselines.artifacts);

  // Task 3: Execute on Simulators
  ctx.log('info', 'Executing quantum algorithms on simulators');
  const simulatorResults = await ctx.task(simulatorExecutionTask, {
    algorithms,
    problems: problemDefinition.problems,
    outputDir
  });

  artifacts.push(...simulatorResults.artifacts);

  // Task 4: Execute on Hardware
  ctx.log('info', 'Executing quantum algorithms on hardware backends');
  const hardwareResults = await ctx.task(hardwareExecutionTask, {
    algorithms,
    problems: problemDefinition.problems,
    hardwareConfigs,
    outputDir
  });

  artifacts.push(...hardwareResults.artifacts);

  // Task 5: Measure Performance Metrics
  ctx.log('info', 'Measuring execution time, fidelity, and success probability');
  const performanceMetrics = await ctx.task(performanceMeasurementTask, {
    simulatorResults: simulatorResults.results,
    hardwareResults: hardwareResults.results,
    classicalBaselines: classicalBaselines.results,
    metrics,
    outputDir
  });

  artifacts.push(...performanceMetrics.artifacts);

  // Task 6: Analyze Scaling Behavior
  ctx.log('info', 'Analyzing scaling behavior with problem size');
  const scalingAnalysis = await ctx.task(scalingAnalysisTask, {
    performanceMetrics: performanceMetrics.metrics,
    problemSuite: problemDefinition.problems,
    outputDir
  });

  artifacts.push(...scalingAnalysis.artifacts);

  // Breakpoint: Review benchmark results
  await ctx.breakpoint({
    question: `Benchmarking complete. Quantum advantage observed: ${scalingAnalysis.quantumAdvantageObserved}. Review detailed results?`,
    title: 'Algorithm Benchmarking Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        algorithmsTestedCount: algorithms.length,
        problemsTestedCount: problemDefinition.problems.length,
        quantumAdvantageObserved: scalingAnalysis.quantumAdvantageObserved,
        bestPerformingAlgorithm: performanceMetrics.bestAlgorithm
      }
    }
  });

  // Task 7: Document Quantum Advantage Conditions
  ctx.log('info', 'Documenting quantum advantage conditions');
  const advantageDocumentation = await ctx.task(quantumAdvantageDocumentationTask, {
    scalingAnalysis: scalingAnalysis.analysis,
    performanceMetrics: performanceMetrics.metrics,
    outputDir
  });

  artifacts.push(...advantageDocumentation.artifacts);

  // Task 8: Generate Hardware Suitability Recommendations
  ctx.log('info', 'Generating hardware suitability recommendations');
  const hardwareRecommendations = await ctx.task(hardwareRecommendationTask, {
    hardwareResults: hardwareResults.results,
    scalingAnalysis: scalingAnalysis.analysis,
    algorithms,
    outputDir
  });

  artifacts.push(...hardwareRecommendations.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    benchmarkReport: {
      algorithms: algorithms,
      problemsEvaluated: problemDefinition.problems.length,
      metricsCollected: metrics,
      simulatorResults: simulatorResults.results,
      hardwareResults: hardwareResults.results,
      classicalBaselines: classicalBaselines.results
    },
    performanceComparison: performanceMetrics.comparison,
    scalingBehavior: scalingAnalysis.analysis,
    quantumAdvantage: {
      observed: scalingAnalysis.quantumAdvantageObserved,
      conditions: advantageDocumentation.conditions,
      crossoverPoints: scalingAnalysis.crossoverPoints
    },
    recommendations: {
      hardware: hardwareRecommendations.recommendations,
      algorithmSelection: performanceMetrics.algorithmRecommendations
    },
    artifacts,
    duration,
    metadata: {
      processId: 'quantum-computing/algorithm-benchmarking',
      timestamp: startTime,
      hardwareConfigs
    }
  };
}

// Task 1: Problem Suite Definition
export const problemSuiteDefinitionTask = defineTask('problem-suite-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define benchmark problem suite and metrics',
  agent: {
    name: 'benchmark-designer',
    prompt: {
      role: 'quantum algorithm researcher',
      task: 'Define comprehensive benchmark problem suite',
      context: args,
      instructions: [
        'Define problem instances across sizes',
        'Include variety of problem types',
        'Specify input/output formats',
        'Define success criteria for each problem',
        'Document known optimal solutions',
        'Create problem scaling parameters',
        'Save problem suite specification to output directory'
      ],
      outputFormat: 'JSON with success flag, problems array, metrics specification, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'problems', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        problems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              size: { type: 'number' },
              optimalSolution: { type: 'object' }
            }
          }
        },
        metricsSpec: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quantum', 'benchmark', 'problem-suite']
}));

// Task 2: Classical Baseline Implementation
export const classicalBaselineTask = defineTask('classical-baseline', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement classical baseline algorithms',
  agent: {
    name: 'classical-implementer',
    prompt: {
      role: 'computational scientist',
      task: 'Implement classical baseline algorithms for comparison',
      context: args,
      instructions: [
        'Implement exact classical solvers where feasible',
        'Implement best-known heuristics',
        'Configure for fair comparison',
        'Measure classical computation times',
        'Document complexity classes',
        'Set up parallel execution where applicable',
        'Save implementations and results to output directory'
      ],
      outputFormat: 'JSON with classical results, execution times, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'artifacts'],
      properties: {
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              problemId: { type: 'string' },
              algorithm: { type: 'string' },
              solution: { type: 'object' },
              executionTime: { type: 'number' }
            }
          }
        },
        implementations: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quantum', 'benchmark', 'classical-baseline']
}));

// Task 3: Simulator Execution
export const simulatorExecutionTask = defineTask('simulator-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute quantum algorithms on simulators',
  agent: {
    name: 'simulator-runner',
    prompt: {
      role: 'quantum simulation engineer',
      task: 'Execute quantum algorithms on various simulators',
      context: args,
      instructions: [
        'Configure statevector simulators',
        'Configure shot-based simulators',
        'Execute all algorithm-problem combinations',
        'Collect measurement statistics',
        'Record execution times',
        'Capture memory usage',
        'Save simulation results to output directory'
      ],
      outputFormat: 'JSON with simulation results per algorithm and problem, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'artifacts'],
      properties: {
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              algorithmId: { type: 'string' },
              problemId: { type: 'string' },
              simulatorType: { type: 'string' },
              measurementCounts: { type: 'object' },
              executionTime: { type: 'number' },
              memoryUsage: { type: 'number' }
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
  labels: ['agent', 'quantum', 'benchmark', 'simulation']
}));

// Task 4: Hardware Execution
export const hardwareExecutionTask = defineTask('hardware-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute quantum algorithms on hardware backends',
  agent: {
    name: 'hardware-runner',
    prompt: {
      role: 'quantum hardware engineer',
      task: 'Execute algorithms on real quantum hardware',
      context: args,
      instructions: [
        'Configure hardware backend connections',
        'Transpile circuits for each backend',
        'Submit jobs with appropriate shot counts',
        'Handle queue times and job management',
        'Collect hardware results',
        'Apply measurement error mitigation',
        'Save hardware execution results to output directory'
      ],
      outputFormat: 'JSON with hardware results, job metadata, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'artifacts'],
      properties: {
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              algorithmId: { type: 'string' },
              problemId: { type: 'string' },
              backend: { type: 'string' },
              measurementCounts: { type: 'object' },
              jobId: { type: 'string' },
              queueTime: { type: 'number' },
              executionTime: { type: 'number' }
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
  labels: ['agent', 'quantum', 'benchmark', 'hardware']
}));

// Task 5: Performance Measurement
export const performanceMeasurementTask = defineTask('performance-measurement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Measure execution time, fidelity, and success probability',
  agent: {
    name: 'performance-analyst',
    prompt: {
      role: 'quantum performance engineer',
      task: 'Compute comprehensive performance metrics',
      context: args,
      instructions: [
        'Calculate execution times for all runs',
        'Compute fidelity compared to ideal results',
        'Calculate success probabilities',
        'Compute statistical uncertainties',
        'Generate comparison tables',
        'Identify best performing algorithms',
        'Create performance visualizations',
        'Save metrics to output directory'
      ],
      outputFormat: 'JSON with performance metrics, comparisons, best algorithm, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'comparison', 'bestAlgorithm', 'artifacts'],
      properties: {
        metrics: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              executionTime: { type: 'number' },
              fidelity: { type: 'number' },
              successProbability: { type: 'number' }
            }
          }
        },
        comparison: { type: 'object' },
        bestAlgorithm: { type: 'string' },
        algorithmRecommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quantum', 'benchmark', 'performance-metrics']
}));

// Task 6: Scaling Analysis
export const scalingAnalysisTask = defineTask('scaling-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze scaling behavior with problem size',
  agent: {
    name: 'scaling-analyst',
    prompt: {
      role: 'computational complexity analyst',
      task: 'Analyze how algorithms scale with problem size',
      context: args,
      instructions: [
        'Plot performance vs problem size',
        'Fit scaling curves (polynomial, exponential)',
        'Identify crossover points with classical',
        'Determine quantum advantage regime',
        'Calculate asymptotic complexity',
        'Project to larger problem sizes',
        'Generate scaling visualizations',
        'Save scaling analysis to output directory'
      ],
      outputFormat: 'JSON with scaling analysis, quantum advantage flag, crossover points, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'quantumAdvantageObserved', 'artifacts'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            scalingCurves: { type: 'object' },
            asymptoticComplexity: { type: 'object' },
            projections: { type: 'object' }
          }
        },
        quantumAdvantageObserved: { type: 'boolean' },
        crossoverPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              algorithm: { type: 'string' },
              problemSize: { type: 'number' },
              metric: { type: 'string' }
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
  labels: ['agent', 'quantum', 'benchmark', 'scaling-analysis']
}));

// Task 7: Quantum Advantage Documentation
export const quantumAdvantageDocumentationTask = defineTask('quantum-advantage-docs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document quantum advantage conditions',
  agent: {
    name: 'advantage-documenter',
    prompt: {
      role: 'quantum computing researcher',
      task: 'Document conditions under which quantum advantage is observed',
      context: args,
      instructions: [
        'Identify quantum advantage conditions',
        'Document problem types with advantage',
        'Specify required hardware quality',
        'Note problem size thresholds',
        'Document current limitations',
        'Provide practical guidance',
        'Create executive summary',
        'Save documentation to output directory'
      ],
      outputFormat: 'JSON with advantage conditions, practical guidance, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['conditions', 'artifacts'],
      properties: {
        conditions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              problemType: { type: 'string' },
              minProblemSize: { type: 'number' },
              requiredFidelity: { type: 'number' }
            }
          }
        },
        limitations: { type: 'array', items: { type: 'string' } },
        practicalGuidance: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quantum', 'benchmark', 'documentation']
}));

// Task 8: Hardware Suitability Recommendations
export const hardwareRecommendationTask = defineTask('hardware-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate hardware suitability recommendations',
  agent: {
    name: 'hardware-advisor',
    prompt: {
      role: 'quantum hardware consultant',
      task: 'Recommend optimal hardware for each algorithm',
      context: args,
      instructions: [
        'Analyze algorithm-hardware compatibility',
        'Consider connectivity requirements',
        'Evaluate gate fidelity needs',
        'Account for coherence time requirements',
        'Compare cloud providers',
        'Consider cost-performance tradeoffs',
        'Provide ranked recommendations',
        'Save recommendations to output directory'
      ],
      outputFormat: 'JSON with hardware recommendations per algorithm, comparison matrix, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'artifacts'],
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              algorithm: { type: 'string' },
              recommendedBackends: { type: 'array', items: { type: 'string' } },
              rationale: { type: 'string' },
              alternatives: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        comparisonMatrix: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quantum', 'benchmark', 'hardware-recommendations']
}));
