/**
 * @process Quantum Optimization Application
 * @id QC-APP-001
 * @description Develop quantum optimization applications for combinatorial problems including
 * portfolio optimization, vehicle routing, and scheduling using QAOA or quantum annealing.
 * @category Quantum Computing - Application Development
 * @priority P1 - High
 * @inputs {{ problemType: string, problemData: object }}
 * @outputs {{ success: boolean, solution: object, benchmarkComparison: object, artifacts: array }}
 *
 * @example
 * const result = await orchestrate('quantum-optimization-application', {
 *   problemType: 'portfolio_optimization',
 *   problemData: { assets: [...], constraints: {...} }
 * });
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    problemType, // 'portfolio', 'routing', 'scheduling', 'maxcut', 'tsp'
    problemData,
    algorithm = 'QAOA', // 'QAOA', 'VQE', 'quantum_annealing', 'grover'
    numLayers = 3,
    optimizer = 'COBYLA',
    framework = 'qiskit',
    outputDir = 'optimization-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Quantum Optimization Application: ${problemType}`);
  ctx.log('info', `Algorithm: ${algorithm}, Layers: ${numLayers}`);

  // ============================================================================
  // PHASE 1: PROBLEM FORMULATION
  // ============================================================================

  ctx.log('info', 'Phase 1: QUBO/Ising Problem Formulation');

  const formulationResult = await ctx.task(quboIsingFormulationTask, {
    problemType,
    problemData
  });

  artifacts.push(...(formulationResult.artifacts || []));

  await ctx.breakpoint({
    question: `Problem formulated. Variables: ${formulationResult.numVariables}, QUBO terms: ${formulationResult.numTerms}. Proceed with encoding?`,
    title: 'Problem Formulation Review',
    context: {
      runId: ctx.runId,
      formulation: formulationResult,
      files: (formulationResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 2: PROBLEM ENCODING
  // ============================================================================

  ctx.log('info', 'Phase 2: Problem Encoding');

  const encodingResult = await ctx.task(problemEncodingTask, {
    formulation: formulationResult,
    algorithm,
    framework
  });

  artifacts.push(...(encodingResult.artifacts || []));

  ctx.log('info', `Encoding complete. Qubits: ${encodingResult.qubitCount}`);

  // ============================================================================
  // PHASE 3: QUANTUM CIRCUIT DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 3: QAOA/Annealing Circuit Design');

  const circuitResult = await ctx.task(optimizationCircuitDesignTask, {
    encoding: encodingResult,
    algorithm,
    numLayers,
    framework
  });

  artifacts.push(...(circuitResult.artifacts || []));

  // ============================================================================
  // PHASE 4: CLASSICAL POST-PROCESSING CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Classical Post-Processing Configuration');

  const postProcessResult = await ctx.task(classicalPostProcessingTask, {
    problemType,
    formulation: formulationResult,
    encoding: encodingResult
  });

  artifacts.push(...(postProcessResult.artifacts || []));

  // ============================================================================
  // PHASE 5: QUANTUM EXECUTION
  // ============================================================================

  ctx.log('info', 'Phase 5: Quantum Execution');

  const executionResult = await ctx.task(quantumOptimizationExecutionTask, {
    circuit: circuitResult,
    postProcessing: postProcessResult,
    optimizer,
    numLayers,
    framework
  });

  artifacts.push(...(executionResult.artifacts || []));

  await ctx.breakpoint({
    question: `Quantum optimization complete. Best solution cost: ${executionResult.bestCost}. Iterations: ${executionResult.iterations}. Review results?`,
    title: 'Quantum Execution Review',
    context: {
      runId: ctx.runId,
      execution: executionResult,
      files: (executionResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 6: SOLUTION DECODING
  // ============================================================================

  ctx.log('info', 'Phase 6: Solution Decoding');

  const decodingResult = await ctx.task(solutionDecodingTask, {
    quantumResult: executionResult,
    formulation: formulationResult,
    problemType,
    problemData
  });

  artifacts.push(...(decodingResult.artifacts || []));

  // ============================================================================
  // PHASE 7: CLASSICAL SOLVER BENCHMARK
  // ============================================================================

  ctx.log('info', 'Phase 7: Classical Solver Benchmark');

  const benchmarkResult = await ctx.task(classicalSolverBenchmarkTask, {
    problemType,
    formulation: formulationResult,
    quantumSolution: decodingResult,
    problemData
  });

  artifacts.push(...(benchmarkResult.artifacts || []));

  await ctx.breakpoint({
    question: `Benchmark complete. Quantum: ${executionResult.bestCost}, Classical: ${benchmarkResult.classicalBest}. Gap: ${benchmarkResult.approximationRatio}. Review comparison?`,
    title: 'Benchmark Review',
    context: {
      runId: ctx.runId,
      benchmark: benchmarkResult,
      files: (benchmarkResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 8: APPLICATION PACKAGING
  // ============================================================================

  ctx.log('info', 'Phase 8: Application Packaging');

  const packageResult = await ctx.task(applicationPackagingTask, {
    problemType,
    formulation: formulationResult,
    circuit: circuitResult,
    postProcessing: postProcessResult,
    solution: decodingResult,
    benchmark: benchmarkResult,
    outputDir
  });

  artifacts.push(...(packageResult.artifacts || []));

  await ctx.breakpoint({
    question: `Optimization application complete for ${problemType}. Solution quality: ${benchmarkResult.approximationRatio}. Approve application?`,
    title: 'Optimization Application Complete',
    context: {
      runId: ctx.runId,
      summary: {
        problemType,
        algorithm,
        quantumCost: executionResult.bestCost,
        classicalCost: benchmarkResult.classicalBest,
        approximationRatio: benchmarkResult.approximationRatio
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    problemType,
    solution: {
      variables: decodingResult.solution,
      cost: executionResult.bestCost,
      decodedSolution: decodingResult.decodedSolution,
      feasible: decodingResult.feasible
    },
    benchmarkComparison: {
      quantumCost: executionResult.bestCost,
      classicalBest: benchmarkResult.classicalBest,
      approximationRatio: benchmarkResult.approximationRatio,
      timeComparison: benchmarkResult.timeComparison
    },
    quantumDetails: {
      algorithm,
      qubits: encodingResult.qubitCount,
      layers: numLayers,
      iterations: executionResult.iterations,
      optimalParameters: executionResult.optimalParameters
    },
    applicationPackage: packageResult.package,
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'QC-APP-001',
      processName: 'Quantum Optimization Application',
      category: 'quantum-computing',
      timestamp: startTime,
      framework
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const quboIsingFormulationTask = defineTask('qopt-qubo-formulation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'QUBO/Ising Formulation',
  agent: {
    name: 'quantum-optimization-engineer',
    skills: ['qubo-formulator', 'ansatz-designer', 'pennylane-hybrid-executor'],
    prompt: {
      role: 'Combinatorial Optimization Specialist',
      task: 'Formulate optimization problem as QUBO/Ising model',
      context: args,
      instructions: [
        '1. Analyze problem structure',
        '2. Define binary decision variables',
        '3. Formulate objective function',
        '4. Add constraint penalties',
        '5. Convert to QUBO form',
        '6. Convert to Ising form',
        '7. Verify formulation correctness',
        '8. Estimate problem difficulty',
        '9. Count variables and terms',
        '10. Document formulation'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['qubo', 'ising', 'numVariables', 'numTerms'],
      properties: {
        qubo: { type: 'object' },
        ising: { type: 'object' },
        numVariables: { type: 'number' },
        numTerms: { type: 'number' },
        constraintPenalties: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'optimization', 'formulation']
}));

export const problemEncodingTask = defineTask('qopt-problem-encoding', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Problem Encoding',
  agent: {
    name: 'quantum-optimization-engineer',
    skills: ['qubo-formulator', 'ansatz-designer', 'pennylane-hybrid-executor'],
    prompt: {
      role: 'Quantum Encoding Specialist',
      task: 'Encode optimization problem for quantum processing',
      context: args,
      instructions: [
        '1. Map variables to qubits',
        '2. Encode QUBO coefficients',
        '3. Create Hamiltonian',
        '4. Handle scaling',
        '5. Apply encoding optimizations',
        '6. Calculate qubit requirements',
        '7. Handle auxiliary qubits',
        '8. Validate encoding',
        '9. Generate encoding map',
        '10. Document encoding'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['hamiltonian', 'qubitCount', 'encodingMap'],
      properties: {
        hamiltonian: { type: 'object' },
        qubitCount: { type: 'number' },
        encodingMap: { type: 'object' },
        scalingFactors: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'optimization', 'encoding']
}));

export const optimizationCircuitDesignTask = defineTask('qopt-circuit-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Optimization Circuit Design',
  agent: {
    name: 'quantum-optimization-engineer',
    skills: ['qubo-formulator', 'ansatz-designer', 'pennylane-hybrid-executor'],
    prompt: {
      role: 'QAOA Circuit Design Specialist',
      task: 'Design QAOA or optimization circuit',
      context: args,
      instructions: [
        '1. Design cost layer',
        '2. Design mixer layer',
        '3. Configure layer repetitions',
        '4. Set initial state',
        '5. Add parameterization',
        '6. Optimize circuit depth',
        '7. Consider connectivity',
        '8. Generate circuit',
        '9. Calculate resource requirements',
        '10. Document circuit design'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['circuit', 'circuitDepth', 'parameterCount'],
      properties: {
        circuit: { type: 'object' },
        circuitDepth: { type: 'number' },
        parameterCount: { type: 'number' },
        costLayer: { type: 'object' },
        mixerLayer: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'optimization', 'circuit']
}));

export const classicalPostProcessingTask = defineTask('qopt-post-processing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Classical Post-Processing',
  agent: {
    name: 'quantum-optimization-engineer',
    skills: ['qubo-formulator', 'ansatz-designer', 'pennylane-hybrid-executor'],
    prompt: {
      role: 'Post-Processing Specialist',
      task: 'Configure classical post-processing for quantum results',
      context: args,
      instructions: [
        '1. Design result sampling',
        '2. Implement solution decoding',
        '3. Add feasibility checking',
        '4. Design local search',
        '5. Implement solution repair',
        '6. Configure result aggregation',
        '7. Add constraint validation',
        '8. Design ranking criteria',
        '9. Test post-processing',
        '10. Document post-processing'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['postProcessingPipeline'],
      properties: {
        postProcessingPipeline: { type: 'object' },
        decodingFunction: { type: 'string' },
        feasibilityChecker: { type: 'string' },
        localSearchConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'optimization', 'post-processing']
}));

export const quantumOptimizationExecutionTask = defineTask('qopt-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Quantum Optimization Execution',
  agent: {
    name: 'quantum-optimization-engineer',
    skills: ['qubo-formulator', 'ansatz-designer', 'pennylane-hybrid-executor'],
    prompt: {
      role: 'Quantum Execution Specialist',
      task: 'Execute quantum optimization algorithm',
      context: args,
      instructions: [
        '1. Initialize parameters',
        '2. Set up optimizer',
        '3. Execute QAOA loop',
        '4. Measure expectation values',
        '5. Update parameters',
        '6. Track convergence',
        '7. Record best solutions',
        '8. Apply post-processing',
        '9. Return best solution',
        '10. Document execution'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['bestCost', 'bestSolution', 'iterations', 'optimalParameters'],
      properties: {
        bestCost: { type: 'number' },
        bestSolution: { type: 'array' },
        iterations: { type: 'number' },
        optimalParameters: { type: 'array' },
        convergenceHistory: { type: 'array' },
        allSolutions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'optimization', 'execution']
}));

export const solutionDecodingTask = defineTask('qopt-solution-decoding', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Solution Decoding',
  agent: {
    name: 'quantum-optimization-engineer',
    skills: ['qubo-formulator', 'ansatz-designer', 'pennylane-hybrid-executor'],
    prompt: {
      role: 'Solution Decoding Specialist',
      task: 'Decode quantum solution to problem solution',
      context: args,
      instructions: [
        '1. Decode binary solution',
        '2. Map to problem variables',
        '3. Check feasibility',
        '4. Repair if needed',
        '5. Calculate objective value',
        '6. Format solution',
        '7. Generate solution report',
        '8. Provide interpretation',
        '9. Validate solution',
        '10. Document decoding'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['solution', 'decodedSolution', 'feasible'],
      properties: {
        solution: { type: 'array' },
        decodedSolution: { type: 'object' },
        feasible: { type: 'boolean' },
        objectiveValue: { type: 'number' },
        solutionReport: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'optimization', 'decoding']
}));

export const classicalSolverBenchmarkTask = defineTask('qopt-classical-benchmark', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Classical Solver Benchmark',
  agent: {
    name: 'quantum-optimization-engineer',
    skills: ['qubo-formulator', 'ansatz-designer', 'pennylane-hybrid-executor'],
    prompt: {
      role: 'Optimization Benchmarking Specialist',
      task: 'Benchmark against classical solvers',
      context: args,
      instructions: [
        '1. Run exact solver if feasible',
        '2. Run Gurobi/CPLEX if available',
        '3. Run simulated annealing',
        '4. Run genetic algorithm',
        '5. Compare solution quality',
        '6. Compare runtime',
        '7. Calculate approximation ratio',
        '8. Analyze scaling',
        '9. Generate comparison report',
        '10. Document benchmarking'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['classicalBest', 'approximationRatio', 'timeComparison'],
      properties: {
        classicalBest: { type: 'number' },
        classicalSolution: { type: 'object' },
        approximationRatio: { type: 'number' },
        timeComparison: { type: 'object' },
        solverResults: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'optimization', 'benchmark']
}));

export const applicationPackagingTask = defineTask('qopt-application-packaging', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Application Packaging',
  agent: {
    name: 'quantum-optimization-engineer',
    skills: ['qubo-formulator', 'ansatz-designer', 'pennylane-hybrid-executor'],
    prompt: {
      role: 'Application Packaging Specialist',
      task: 'Package optimization application for deployment',
      context: args,
      instructions: [
        '1. Create application structure',
        '2. Package formulation module',
        '3. Package circuit module',
        '4. Package post-processing',
        '5. Create API interface',
        '6. Add configuration options',
        '7. Create documentation',
        '8. Add examples',
        '9. Create deployment guide',
        '10. Generate final package'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['package'],
      properties: {
        package: { type: 'object' },
        packagePath: { type: 'string' },
        documentation: { type: 'string' },
        examples: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'optimization', 'packaging']
}));
