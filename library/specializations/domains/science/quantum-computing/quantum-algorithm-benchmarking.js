/**
 * @process Quantum Algorithm Benchmarking
 * @id QC-ALGO-003
 * @description Systematically benchmark quantum algorithms against classical alternatives to
 * quantify speedup, accuracy, and resource requirements across different problem sizes and
 * hardware configurations.
 * @category Quantum Computing - Algorithm Development
 * @priority P1 - High
 * @inputs {{ algorithms: array, problemSuite: object, hardwareTargets?: array }}
 * @outputs {{ success: boolean, benchmarkResults: object, performanceReport: object, artifacts: array }}
 *
 * @example
 * const result = await orchestrate('quantum-algorithm-benchmarking', {
 *   algorithms: ['VQE', 'QAOA', 'Grover'],
 *   problemSuite: { type: 'optimization', sizes: [4, 8, 12, 16] },
 *   hardwareTargets: ['simulator', 'ibm_brisbane']
 * });
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    algorithms = ['VQE', 'QAOA'],
    problemSuite,
    hardwareTargets = ['simulator'],
    classicalBaselines = ['exact', 'heuristic'],
    metrics = ['execution_time', 'fidelity', 'success_probability', 'resource_count'],
    numTrials = 10,
    framework = 'qiskit',
    outputDir = 'benchmark-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Quantum Algorithm Benchmarking`);
  ctx.log('info', `Algorithms: ${algorithms.join(', ')}, Hardware: ${hardwareTargets.join(', ')}`);

  // ============================================================================
  // PHASE 1: BENCHMARK SUITE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 1: Benchmark Suite Design');

  const suiteDesignResult = await ctx.task(benchmarkSuiteDesignTask, {
    algorithms,
    problemSuite,
    classicalBaselines,
    metrics,
    numTrials
  });

  artifacts.push(...(suiteDesignResult.artifacts || []));

  await ctx.breakpoint({
    question: `Benchmark suite designed. ${suiteDesignResult.totalBenchmarks} benchmarks planned across ${suiteDesignResult.problemCount} problems. Proceed with classical baselines?`,
    title: 'Benchmark Suite Review',
    context: {
      runId: ctx.runId,
      suiteDesign: suiteDesignResult,
      files: (suiteDesignResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 2: CLASSICAL BASELINE EXECUTION
  // ============================================================================

  ctx.log('info', 'Phase 2: Classical Baseline Execution');

  const classicalResult = await ctx.task(classicalBaselineExecutionTask, {
    problemSuite: suiteDesignResult.problemInstances,
    baselines: classicalBaselines,
    metrics
  });

  artifacts.push(...(classicalResult.artifacts || []));

  ctx.log('info', `Classical baselines complete. ${classicalResult.completedBenchmarks} benchmarks executed`);

  // ============================================================================
  // PHASE 3: QUANTUM SIMULATOR EXECUTION
  // ============================================================================

  ctx.log('info', 'Phase 3: Quantum Simulator Execution');

  const simulatorResult = await ctx.task(quantumSimulatorExecutionTask, {
    algorithms,
    problemSuite: suiteDesignResult.problemInstances,
    numTrials,
    metrics,
    framework
  });

  artifacts.push(...(simulatorResult.artifacts || []));

  await ctx.breakpoint({
    question: `Simulator benchmarks complete. Average fidelity: ${simulatorResult.averageFidelity}. Proceed with hardware execution?`,
    title: 'Simulator Results Review',
    context: {
      runId: ctx.runId,
      simulatorResults: simulatorResult,
      files: (simulatorResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 4: QUANTUM HARDWARE EXECUTION (if targets include hardware)
  // ============================================================================

  let hardwareResult = null;
  const hardwareBackends = hardwareTargets.filter(t => t !== 'simulator');

  if (hardwareBackends.length > 0) {
    ctx.log('info', 'Phase 4: Quantum Hardware Execution');

    hardwareResult = await ctx.task(quantumHardwareExecutionTask, {
      algorithms,
      problemSuite: suiteDesignResult.problemInstances,
      hardwareBackends,
      numTrials,
      metrics,
      framework
    });

    artifacts.push(...(hardwareResult.artifacts || []));

    ctx.log('info', `Hardware benchmarks complete on ${hardwareBackends.length} backends`);
  }

  // ============================================================================
  // PHASE 5: PERFORMANCE METRIC CALCULATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Performance Metric Calculation');

  const metricsResult = await ctx.task(performanceMetricCalculationTask, {
    classicalResults: classicalResult,
    simulatorResults: simulatorResult,
    hardwareResults: hardwareResult,
    metrics
  });

  artifacts.push(...(metricsResult.artifacts || []));

  // ============================================================================
  // PHASE 6: SCALING ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Scaling Analysis');

  const scalingResult = await ctx.task(scalingAnalysisTask, {
    benchmarkResults: metricsResult.consolidatedResults,
    problemSizes: problemSuite.sizes || suiteDesignResult.problemSizes
  });

  artifacts.push(...(scalingResult.artifacts || []));

  await ctx.breakpoint({
    question: `Scaling analysis complete. Quantum advantage threshold: ${scalingResult.advantageThreshold} qubits. Review scaling behavior?`,
    title: 'Scaling Analysis Review',
    context: {
      runId: ctx.runId,
      scaling: scalingResult,
      files: (scalingResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 7: QUANTUM ADVANTAGE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 7: Quantum Advantage Analysis');

  const advantageResult = await ctx.task(quantumAdvantageAnalysisTask, {
    classicalResults: classicalResult,
    quantumResults: {
      simulator: simulatorResult,
      hardware: hardwareResult
    },
    scalingResults: scalingResult
  });

  artifacts.push(...(advantageResult.artifacts || []));

  // ============================================================================
  // PHASE 8: REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Report Generation');

  const reportResult = await ctx.task(benchmarkReportGenerationTask, {
    suiteDesign: suiteDesignResult,
    classicalResults: classicalResult,
    simulatorResults: simulatorResult,
    hardwareResults: hardwareResult,
    metricsResults: metricsResult,
    scalingResults: scalingResult,
    advantageResults: advantageResult,
    outputDir
  });

  artifacts.push(...(reportResult.artifacts || []));

  await ctx.breakpoint({
    question: `Benchmarking complete. ${algorithms.length} algorithms tested across ${suiteDesignResult.problemCount} problems. Quantum advantage identified: ${advantageResult.advantageIdentified}. Approve results?`,
    title: 'Benchmark Complete',
    context: {
      runId: ctx.runId,
      summary: {
        algorithmsTests: algorithms.length,
        problemsEvaluated: suiteDesignResult.problemCount,
        quantumAdvantage: advantageResult.advantageIdentified
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    algorithms,
    benchmarkResults: {
      classical: classicalResult.results,
      simulator: simulatorResult.results,
      hardware: hardwareResult?.results || null
    },
    performanceReport: {
      metrics: metricsResult.consolidatedResults,
      scaling: scalingResult.scalingBehavior,
      quantumAdvantage: advantageResult.analysis
    },
    recommendations: advantageResult.recommendations,
    reportPath: reportResult.reportPath,
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'QC-ALGO-003',
      processName: 'Quantum Algorithm Benchmarking',
      category: 'quantum-computing',
      timestamp: startTime,
      framework
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const benchmarkSuiteDesignTask = defineTask('qc-benchmark-suite-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Benchmark Suite Design',
  agent: {
    name: 'algorithm-benchmarker',
    skills: ['statevector-simulator', 'rb-benchmarker', 'tensor-network-simulator', 'resource-estimator'],
    prompt: {
      role: 'Quantum Benchmarking Specialist',
      task: 'Design comprehensive benchmark suite for quantum algorithms',
      context: args,
      instructions: [
        '1. Define problem instances for each problem size',
        '2. Create standardized input formats',
        '3. Define success criteria for each algorithm',
        '4. Plan measurement strategies for metrics',
        '5. Design trial repetition strategy',
        '6. Create problem instance generators',
        '7. Define fairness criteria for comparison',
        '8. Plan resource tracking methodology',
        '9. Design data collection format',
        '10. Document benchmark methodology'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['problemInstances', 'totalBenchmarks', 'problemCount'],
      properties: {
        problemInstances: { type: 'array' },
        totalBenchmarks: { type: 'number' },
        problemCount: { type: 'number' },
        problemSizes: { type: 'array', items: { type: 'number' } },
        successCriteria: { type: 'object' },
        methodology: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'benchmarking', 'design']
}));

export const classicalBaselineExecutionTask = defineTask('qc-classical-baseline', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Classical Baseline Execution',
  agent: {
    name: 'algorithm-benchmarker',
    skills: ['statevector-simulator', 'rb-benchmarker', 'tensor-network-simulator', 'resource-estimator'],
    prompt: {
      role: 'Classical Algorithm Specialist',
      task: 'Execute classical baseline algorithms for benchmark comparison',
      context: args,
      instructions: [
        '1. Implement exact solvers where tractable',
        '2. Implement classical heuristics (SA, genetic, etc.)',
        '3. Run baselines on all problem instances',
        '4. Measure execution time accurately',
        '5. Record solution quality metrics',
        '6. Track memory usage',
        '7. Handle timeout for large problems',
        '8. Verify solution correctness',
        '9. Calculate statistics over trials',
        '10. Document classical results'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'completedBenchmarks'],
      properties: {
        results: { type: 'array' },
        completedBenchmarks: { type: 'number' },
        executionTimes: { type: 'object' },
        solutionQualities: { type: 'object' },
        memoryUsage: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'benchmarking', 'classical']
}));

export const quantumSimulatorExecutionTask = defineTask('qc-simulator-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Quantum Simulator Execution',
  agent: {
    name: 'algorithm-benchmarker',
    skills: ['statevector-simulator', 'rb-benchmarker', 'tensor-network-simulator', 'resource-estimator'],
    prompt: {
      role: 'Quantum Simulation Specialist',
      task: 'Execute quantum algorithms on simulators for benchmarking',
      context: args,
      instructions: [
        '1. Configure statevector and qasm simulators',
        '2. Execute each algorithm on problem instances',
        '3. Measure circuit execution time',
        '4. Calculate output state fidelity',
        '5. Measure success probability',
        '6. Track circuit metrics (depth, gates)',
        '7. Run multiple trials for statistics',
        '8. Apply noise models if specified',
        '9. Record all measurement outcomes',
        '10. Aggregate results by algorithm and size'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'averageFidelity'],
      properties: {
        results: { type: 'array' },
        averageFidelity: { type: 'number' },
        averageSuccessProbability: { type: 'number' },
        circuitMetrics: { type: 'object' },
        executionStatistics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'benchmarking', 'simulation']
}));

export const quantumHardwareExecutionTask = defineTask('qc-hardware-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Quantum Hardware Execution',
  agent: {
    name: 'algorithm-benchmarker',
    skills: ['statevector-simulator', 'rb-benchmarker', 'tensor-network-simulator', 'resource-estimator'],
    prompt: {
      role: 'Quantum Hardware Execution Specialist',
      task: 'Execute quantum algorithms on real hardware for benchmarking',
      context: args,
      instructions: [
        '1. Configure hardware backend access',
        '2. Transpile circuits to hardware native gates',
        '3. Apply error mitigation techniques',
        '4. Submit jobs with appropriate shots',
        '5. Handle queue times and timeouts',
        '6. Collect raw measurement results',
        '7. Apply readout error correction',
        '8. Track hardware-specific metrics',
        '9. Monitor job success rates',
        '10. Document hardware conditions (calibration date, etc.)'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['results'],
      properties: {
        results: { type: 'array' },
        hardwareMetrics: { type: 'object' },
        jobSuccessRate: { type: 'number' },
        averageQueueTime: { type: 'number' },
        calibrationInfo: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'benchmarking', 'hardware']
}));

export const performanceMetricCalculationTask = defineTask('qc-performance-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Performance Metric Calculation',
  agent: {
    name: 'algorithm-benchmarker',
    skills: ['statevector-simulator', 'rb-benchmarker', 'tensor-network-simulator', 'resource-estimator'],
    prompt: {
      role: 'Performance Analysis Specialist',
      task: 'Calculate and consolidate performance metrics across all benchmarks',
      context: args,
      instructions: [
        '1. Normalize metrics across platforms',
        '2. Calculate speedup ratios',
        '3. Compute accuracy comparisons',
        '4. Calculate resource efficiency metrics',
        '5. Compute confidence intervals',
        '6. Identify statistically significant differences',
        '7. Create comparison matrices',
        '8. Calculate composite scores',
        '9. Identify best performers per category',
        '10. Generate metric summary tables'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['consolidatedResults'],
      properties: {
        consolidatedResults: { type: 'object' },
        speedupRatios: { type: 'object' },
        accuracyComparisons: { type: 'object' },
        resourceEfficiency: { type: 'object' },
        statisticalAnalysis: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'benchmarking', 'metrics']
}));

export const scalingAnalysisTask = defineTask('qc-scaling-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Scaling Analysis',
  agent: {
    name: 'algorithm-benchmarker',
    skills: ['statevector-simulator', 'rb-benchmarker', 'tensor-network-simulator', 'resource-estimator'],
    prompt: {
      role: 'Computational Complexity Specialist',
      task: 'Analyze scaling behavior of quantum vs classical algorithms',
      context: args,
      instructions: [
        '1. Fit scaling curves to benchmark data',
        '2. Estimate asymptotic complexity',
        '3. Identify crossover points',
        '4. Project to larger problem sizes',
        '5. Analyze resource scaling (qubits, depth)',
        '6. Compare with theoretical predictions',
        '7. Identify scaling bottlenecks',
        '8. Calculate quantum advantage threshold',
        '9. Generate scaling plots',
        '10. Document scaling analysis methodology'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['scalingBehavior', 'advantageThreshold'],
      properties: {
        scalingBehavior: { type: 'object' },
        advantageThreshold: { type: 'number' },
        crossoverPoints: { type: 'array' },
        asymptoticComplexity: { type: 'object' },
        scalingPlots: { type: 'array' },
        projections: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'benchmarking', 'scaling']
}));

export const quantumAdvantageAnalysisTask = defineTask('qc-advantage-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Quantum Advantage Analysis',
  agent: {
    name: 'algorithm-benchmarker',
    skills: ['statevector-simulator', 'rb-benchmarker', 'tensor-network-simulator', 'resource-estimator'],
    prompt: {
      role: 'Quantum Advantage Assessment Specialist',
      task: 'Analyze conditions for quantum advantage based on benchmark results',
      context: args,
      instructions: [
        '1. Define quantum advantage criteria',
        '2. Identify problems showing advantage',
        '3. Characterize advantage conditions',
        '4. Account for overhead costs',
        '5. Consider practical deployment factors',
        '6. Analyze noise impact on advantage',
        '7. Project future advantage scenarios',
        '8. Compare with published claims',
        '9. Provide recommendations',
        '10. Document advantage analysis'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['advantageIdentified', 'analysis', 'recommendations'],
      properties: {
        advantageIdentified: { type: 'boolean' },
        analysis: { type: 'object' },
        advantageConditions: { type: 'array' },
        limitingFactors: { type: 'array' },
        futureProjections: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'benchmarking', 'advantage']
}));

export const benchmarkReportGenerationTask = defineTask('qc-benchmark-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Benchmark Report Generation',
  agent: {
    name: 'algorithm-benchmarker',
    skills: ['statevector-simulator', 'rb-benchmarker', 'tensor-network-simulator', 'resource-estimator'],
    prompt: {
      role: 'Technical Report Specialist',
      task: 'Generate comprehensive benchmark report',
      context: args,
      instructions: [
        '1. Create executive summary',
        '2. Document benchmark methodology',
        '3. Present results tables and charts',
        '4. Include scaling analysis plots',
        '5. Summarize quantum advantage findings',
        '6. Provide hardware recommendations',
        '7. Include all raw data references',
        '8. Document reproducibility information',
        '9. Add conclusions and future work',
        '10. Generate report in multiple formats'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        figures: { type: 'array' },
        tables: { type: 'array' },
        conclusions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'benchmarking', 'reporting']
}));
