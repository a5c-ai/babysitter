/**
 * @process quantum-computing/quantum-circuit-design
 * @description QC-ALGO-001: Design, implement, and optimize quantum circuits for specific computational problems
 * @inputs { problemDescription: string, targetBackend: string, optimizationLevel: number }
 * @outputs { success: boolean, circuit: object, resourceEstimate: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    problemDescription,
    targetBackend = 'ibm_brisbane',
    optimizationLevel = 2,
    qubitCount,
    gateSet = 'native',
    outputDir = 'quantum-circuit-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Problem Analysis and Resource Requirements
  ctx.log('info', 'Analyzing problem requirements and quantum resource needs');
  const problemAnalysis = await ctx.task(problemAnalysisTask, {
    problemDescription,
    qubitCount,
    outputDir
  });

  if (!problemAnalysis.success) {
    return {
      success: false,
      error: 'Problem analysis failed',
      details: problemAnalysis,
      metadata: { processId: 'quantum-computing/quantum-circuit-design', timestamp: startTime }
    };
  }

  artifacts.push(...problemAnalysis.artifacts);

  // Task 2: Circuit Architecture Design
  ctx.log('info', 'Designing circuit architecture and qubit allocation');
  const circuitArchitecture = await ctx.task(circuitArchitectureTask, {
    problemAnalysis: problemAnalysis.analysis,
    targetBackend,
    outputDir
  });

  artifacts.push(...circuitArchitecture.artifacts);

  // Task 3: Quantum Circuit Implementation
  ctx.log('info', 'Implementing quantum circuit using quantum programming frameworks');
  const circuitImplementation = await ctx.task(circuitImplementationTask, {
    architecture: circuitArchitecture.architecture,
    problemAnalysis: problemAnalysis.analysis,
    outputDir
  });

  artifacts.push(...circuitImplementation.artifacts);

  // Task 4: Circuit Depth Optimization
  ctx.log('info', 'Optimizing circuit depth and gate count');
  const circuitOptimization = await ctx.task(circuitOptimizationTask, {
    circuit: circuitImplementation.circuit,
    optimizationLevel,
    outputDir
  });

  artifacts.push(...circuitOptimization.artifacts);

  // Task 5: Hardware Transpilation
  ctx.log('info', 'Transpiling to target hardware native gates');
  const transpilationResult = await ctx.task(hardwareTranspilationTask, {
    circuit: circuitOptimization.optimizedCircuit,
    targetBackend,
    gateSet,
    outputDir
  });

  artifacts.push(...transpilationResult.artifacts);

  // Task 6: Simulation Validation
  ctx.log('info', 'Validating correctness via simulation');
  const simulationValidation = await ctx.task(simulationValidationTask, {
    originalCircuit: circuitImplementation.circuit,
    transpiledCircuit: transpilationResult.transpiledCircuit,
    problemAnalysis: problemAnalysis.analysis,
    outputDir
  });

  artifacts.push(...simulationValidation.artifacts);

  // Task 7: Resource Estimation
  ctx.log('info', 'Generating resource estimation documentation');
  const resourceEstimation = await ctx.task(resourceEstimationTask, {
    circuit: transpilationResult.transpiledCircuit,
    simulationResults: simulationValidation.results,
    targetBackend,
    outputDir
  });

  artifacts.push(...resourceEstimation.artifacts);

  // Breakpoint: Review circuit design results
  await ctx.breakpoint({
    question: `Quantum circuit designed. Depth: ${circuitOptimization.metrics.depth}, Gates: ${circuitOptimization.metrics.gateCount}. Fidelity: ${simulationValidation.fidelity}. Review and proceed?`,
    title: 'Quantum Circuit Design Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        circuitDepth: circuitOptimization.metrics.depth,
        gateCount: circuitOptimization.metrics.gateCount,
        qubitCount: circuitArchitecture.architecture.qubitCount,
        fidelity: simulationValidation.fidelity,
        targetBackend
      }
    }
  });

  // Task 8: Performance Benchmarking
  ctx.log('info', 'Generating performance benchmarks');
  const benchmarkResult = await ctx.task(performanceBenchmarkTask, {
    circuit: transpilationResult.transpiledCircuit,
    simulationResults: simulationValidation.results,
    resourceEstimation: resourceEstimation.estimate,
    outputDir
  });

  artifacts.push(...benchmarkResult.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    circuit: {
      original: circuitImplementation.circuit,
      optimized: circuitOptimization.optimizedCircuit,
      transpiled: transpilationResult.transpiledCircuit
    },
    metrics: {
      depth: circuitOptimization.metrics.depth,
      gateCount: circuitOptimization.metrics.gateCount,
      qubitCount: circuitArchitecture.architecture.qubitCount,
      twoQubitGates: circuitOptimization.metrics.twoQubitGates
    },
    resourceEstimate: resourceEstimation.estimate,
    validation: {
      fidelity: simulationValidation.fidelity,
      passed: simulationValidation.passed
    },
    benchmarks: benchmarkResult.benchmarks,
    artifacts,
    duration,
    metadata: {
      processId: 'quantum-computing/quantum-circuit-design',
      timestamp: startTime,
      targetBackend,
      optimizationLevel
    }
  };
}

// Task 1: Problem Analysis and Resource Requirements
export const problemAnalysisTask = defineTask('problem-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze problem requirements and quantum resource needs',
  agent: {
    name: 'quantum-analyst',
    prompt: {
      role: 'quantum computing scientist',
      task: 'Analyze computational problem and determine quantum resource requirements',
      context: args,
      instructions: [
        'Parse and understand the problem description',
        'Identify problem type (optimization, simulation, search, etc.)',
        'Determine minimum qubit requirements',
        'Estimate circuit depth requirements',
        'Identify applicable quantum algorithms',
        'Assess quantum advantage potential',
        'Document resource constraints',
        'Save analysis to output directory'
      ],
      outputFormat: 'JSON with analysis object, resource requirements, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'analysis', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        analysis: {
          type: 'object',
          properties: {
            problemType: { type: 'string' },
            minQubits: { type: 'number' },
            estimatedDepth: { type: 'number' },
            recommendedAlgorithms: { type: 'array', items: { type: 'string' } },
            quantumAdvantage: { type: 'string' }
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
  labels: ['agent', 'quantum', 'problem-analysis', 'requirements']
}));

// Task 2: Circuit Architecture Design
export const circuitArchitectureTask = defineTask('circuit-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design circuit architecture and qubit allocation',
  agent: {
    name: 'circuit-architect',
    prompt: {
      role: 'quantum circuit architect',
      task: 'Design optimal circuit architecture for the problem',
      context: args,
      instructions: [
        'Design qubit register layout',
        'Allocate qubits for data, ancilla, and measurement',
        'Plan gate sequence structure',
        'Consider hardware topology constraints',
        'Design modular circuit blocks',
        'Plan measurement strategy',
        'Document architecture decisions',
        'Save architecture specification to output directory'
      ],
      outputFormat: 'JSON with architecture specification, qubit mapping, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['architecture', 'artifacts'],
      properties: {
        architecture: {
          type: 'object',
          properties: {
            qubitCount: { type: 'number' },
            dataQubits: { type: 'array', items: { type: 'number' } },
            ancillaQubits: { type: 'array', items: { type: 'number' } },
            measurementQubits: { type: 'array', items: { type: 'number' } },
            circuitBlocks: { type: 'array' }
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
  labels: ['agent', 'quantum', 'architecture', 'design']
}));

// Task 3: Quantum Circuit Implementation
export const circuitImplementationTask = defineTask('circuit-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement quantum circuit using programming frameworks',
  agent: {
    name: 'quantum-developer',
    prompt: {
      role: 'quantum software engineer',
      task: 'Implement quantum circuit using Qiskit/Cirq/PennyLane',
      context: args,
      instructions: [
        'Initialize quantum circuit with specified qubits',
        'Implement gate sequences according to architecture',
        'Add barrier operations for clarity',
        'Implement parametric gates if needed',
        'Add measurement operations',
        'Generate circuit diagram',
        'Create reusable circuit functions',
        'Save implementation code and diagrams to output directory'
      ],
      outputFormat: 'JSON with circuit object, code snippets, diagram paths, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['circuit', 'artifacts'],
      properties: {
        circuit: {
          type: 'object',
          properties: {
            qasm: { type: 'string' },
            numQubits: { type: 'number' },
            numClbits: { type: 'number' },
            operations: { type: 'array' }
          }
        },
        codeSnippets: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quantum', 'implementation', 'coding']
}));

// Task 4: Circuit Depth Optimization
export const circuitOptimizationTask = defineTask('circuit-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Optimize circuit depth and gate count',
  agent: {
    name: 'circuit-optimizer',
    prompt: {
      role: 'quantum optimization specialist',
      task: 'Optimize circuit for minimal depth and gate count',
      context: args,
      instructions: [
        'Apply gate cancellation optimizations',
        'Consolidate consecutive single-qubit gates',
        'Optimize two-qubit gate placement',
        'Apply commutation rules',
        'Reduce circuit depth through parallelization',
        'Compare before/after metrics',
        'Document optimization techniques applied',
        'Save optimized circuit and metrics to output directory'
      ],
      outputFormat: 'JSON with optimized circuit, metrics comparison, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizedCircuit', 'metrics', 'artifacts'],
      properties: {
        optimizedCircuit: { type: 'object' },
        metrics: {
          type: 'object',
          properties: {
            depth: { type: 'number' },
            gateCount: { type: 'number' },
            twoQubitGates: { type: 'number' },
            depthReduction: { type: 'number' },
            gateReduction: { type: 'number' }
          }
        },
        optimizationsApplied: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quantum', 'optimization', 'circuit-depth']
}));

// Task 5: Hardware Transpilation
export const hardwareTranspilationTask = defineTask('hardware-transpilation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Transpile to target hardware native gates',
  agent: {
    name: 'transpilation-engineer',
    prompt: {
      role: 'quantum hardware integration specialist',
      task: 'Transpile circuit to target hardware native gate set',
      context: args,
      instructions: [
        'Load target backend configuration',
        'Map virtual qubits to physical qubits',
        'Decompose gates to native gate set',
        'Insert SWAP gates for routing',
        'Apply hardware-specific optimizations',
        'Validate circuit compatibility',
        'Generate scheduling information',
        'Save transpiled circuit and mapping to output directory'
      ],
      outputFormat: 'JSON with transpiled circuit, qubit mapping, scheduling, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['transpiledCircuit', 'artifacts'],
      properties: {
        transpiledCircuit: { type: 'object' },
        qubitMapping: { type: 'object' },
        swapsInserted: { type: 'number' },
        nativeGateCounts: { type: 'object' },
        estimatedDuration: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quantum', 'transpilation', 'hardware']
}));

// Task 6: Simulation Validation
export const simulationValidationTask = defineTask('simulation-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate circuit correctness via simulation',
  agent: {
    name: 'quantum-simulator',
    prompt: {
      role: 'quantum simulation expert',
      task: 'Validate circuit correctness through statevector and shot-based simulation',
      context: args,
      instructions: [
        'Run statevector simulation of original circuit',
        'Run statevector simulation of transpiled circuit',
        'Compare output state fidelity',
        'Execute shot-based simulation',
        'Analyze measurement outcome distributions',
        'Verify expected behavior',
        'Document any discrepancies',
        'Save simulation results and comparisons to output directory'
      ],
      outputFormat: 'JSON with simulation results, fidelity metrics, validation status, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'fidelity', 'passed', 'artifacts'],
      properties: {
        results: {
          type: 'object',
          properties: {
            statevector: { type: 'object' },
            measurementCounts: { type: 'object' },
            expectedOutcome: { type: 'string' }
          }
        },
        fidelity: { type: 'number' },
        passed: { type: 'boolean' },
        discrepancies: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quantum', 'simulation', 'validation']
}));

// Task 7: Resource Estimation
export const resourceEstimationTask = defineTask('resource-estimation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate resource estimation documentation',
  agent: {
    name: 'resource-estimator',
    prompt: {
      role: 'quantum resource analyst',
      task: 'Generate comprehensive resource estimation for the quantum circuit',
      context: args,
      instructions: [
        'Count total qubits required',
        'Count gates by type',
        'Estimate circuit execution time',
        'Calculate T-gate count for fault-tolerant estimates',
        'Estimate error correction overhead',
        'Project hardware requirements',
        'Compare with hardware capabilities',
        'Save resource estimation report to output directory'
      ],
      outputFormat: 'JSON with resource estimates, hardware comparison, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['estimate', 'artifacts'],
      properties: {
        estimate: {
          type: 'object',
          properties: {
            totalQubits: { type: 'number' },
            circuitDepth: { type: 'number' },
            gatesByType: { type: 'object' },
            estimatedRuntime: { type: 'string' },
            tGateCount: { type: 'number' },
            errorCorrectionOverhead: { type: 'object' }
          }
        },
        hardwareComparison: { type: 'object' },
        feasibilityAssessment: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quantum', 'resource-estimation', 'planning']
}));

// Task 8: Performance Benchmarking
export const performanceBenchmarkTask = defineTask('performance-benchmark', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate performance benchmarks',
  agent: {
    name: 'quantum-benchmarker',
    prompt: {
      role: 'quantum performance engineer',
      task: 'Generate comprehensive performance benchmarks for the circuit',
      context: args,
      instructions: [
        'Benchmark circuit execution time',
        'Measure simulation performance',
        'Compare optimization levels',
        'Analyze scaling behavior',
        'Generate performance charts',
        'Document bottlenecks',
        'Provide optimization recommendations',
        'Save benchmark report to output directory'
      ],
      outputFormat: 'JSON with benchmark results, charts, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['benchmarks', 'artifacts'],
      properties: {
        benchmarks: {
          type: 'object',
          properties: {
            executionTime: { type: 'object' },
            simulationMetrics: { type: 'object' },
            scalingAnalysis: { type: 'object' }
          }
        },
        bottlenecks: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quantum', 'benchmarking', 'performance']
}));
