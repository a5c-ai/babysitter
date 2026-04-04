/**
 * @process Variational Algorithm Implementation (VQE/QAOA)
 * @id QC-ALGO-002
 * @description Implement and tune variational quantum algorithms including VQE (Variational
 * Quantum Eigensolver) and QAOA (Quantum Approximate Optimization Algorithm) for optimization
 * and chemistry applications.
 * @category Quantum Computing - Algorithm Development
 * @priority P0 - Critical
 * @inputs {{ problemType: string, problemDefinition: object, algorithmType?: string }}
 * @outputs {{ success: boolean, optimalParameters: array, energy: number, artifacts: array }}
 *
 * @example
 * const result = await orchestrate('variational-algorithm-implementation', {
 *   problemType: 'optimization',
 *   algorithmType: 'QAOA',
 *   problemDefinition: { qubo: [[1, -1], [-1, 2]], numLayers: 3 }
 * });
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    problemType = 'optimization', // 'optimization', 'chemistry', 'machine_learning'
    algorithmType = 'VQE', // 'VQE', 'QAOA', 'ADAPT-VQE', 'VQD'
    problemDefinition,
    optimizer = 'COBYLA', // 'COBYLA', 'SPSA', 'Adam', 'L-BFGS-B'
    ansatzType = 'hardware_efficient', // 'hardware_efficient', 'UCCSD', 'custom'
    numLayers = 2,
    maxIterations = 1000,
    convergenceThreshold = 1e-6,
    framework = 'qiskit',
    targetHardware = 'simulator',
    outputDir = 'variational-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting ${algorithmType} Implementation for ${problemType} problem`);
  ctx.log('info', `Optimizer: ${optimizer}, Ansatz: ${ansatzType}, Layers: ${numLayers}`);

  // ============================================================================
  // PHASE 1: PROBLEM FORMULATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Problem Formulation');

  const formulationResult = await ctx.task(problemFormulationTask, {
    problemType,
    problemDefinition,
    algorithmType,
    framework
  });

  artifacts.push(...(formulationResult.artifacts || []));

  await ctx.breakpoint({
    question: `Problem formulated. Hamiltonian terms: ${formulationResult.hamiltonianTerms}, Qubits needed: ${formulationResult.qubitCount}. Proceed with ansatz design?`,
    title: 'Problem Formulation Review',
    context: {
      runId: ctx.runId,
      formulation: formulationResult,
      files: (formulationResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 2: ANSATZ DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Ansatz Design');

  const ansatzResult = await ctx.task(ansatzDesignTask, {
    algorithmType,
    ansatzType,
    numLayers,
    qubitCount: formulationResult.qubitCount,
    problemType,
    targetHardware,
    framework
  });

  artifacts.push(...(ansatzResult.artifacts || []));

  ctx.log('info', `Ansatz designed with ${ansatzResult.parameterCount} parameters`);

  // ============================================================================
  // PHASE 3: OPTIMIZER CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Optimizer Configuration');

  const optimizerResult = await ctx.task(optimizerConfigurationTask, {
    optimizer,
    parameterCount: ansatzResult.parameterCount,
    maxIterations,
    convergenceThreshold,
    framework
  });

  artifacts.push(...(optimizerResult.artifacts || []));

  await ctx.breakpoint({
    question: `Optimizer ${optimizer} configured. Max iterations: ${maxIterations}. Initial parameters: ${ansatzResult.parameterCount}. Proceed with optimization?`,
    title: 'Optimizer Configuration Review',
    context: {
      runId: ctx.runId,
      optimizer: optimizerResult,
      ansatz: ansatzResult,
      files: (optimizerResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 4: HYBRID OPTIMIZATION LOOP
  // ============================================================================

  ctx.log('info', 'Phase 4: Hybrid Quantum-Classical Optimization Loop');

  const optimizationResult = await ctx.task(hybridOptimizationTask, {
    hamiltonian: formulationResult.hamiltonian,
    ansatz: ansatzResult.ansatzCircuit,
    optimizer: optimizerResult.optimizerConfig,
    initialParameters: ansatzResult.initialParameters,
    maxIterations,
    convergenceThreshold,
    framework,
    targetHardware
  });

  artifacts.push(...(optimizationResult.artifacts || []));

  ctx.log('info', `Optimization complete. Final energy: ${optimizationResult.finalEnergy}, Iterations: ${optimizationResult.iterationsUsed}`);

  // ============================================================================
  // PHASE 5: CONVERGENCE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Convergence Analysis');

  const convergenceResult = await ctx.task(convergenceAnalysisTask, {
    optimizationHistory: optimizationResult.history,
    finalEnergy: optimizationResult.finalEnergy,
    optimalParameters: optimizationResult.optimalParameters,
    convergenceThreshold
  });

  artifacts.push(...(convergenceResult.artifacts || []));

  if (!convergenceResult.converged) {
    await ctx.breakpoint({
      question: `Optimization may not have converged. Final energy: ${optimizationResult.finalEnergy}. Continue with analysis or restart with different parameters?`,
      title: 'Convergence Warning',
      context: {
        runId: ctx.runId,
        convergence: convergenceResult,
        files: (convergenceResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 6: CLASSICAL BASELINE COMPARISON
  // ============================================================================

  ctx.log('info', 'Phase 6: Classical Baseline Comparison');

  const benchmarkResult = await ctx.task(classicalBenchmarkTask, {
    problemType,
    problemDefinition,
    quantumResult: optimizationResult.finalEnergy,
    optimalParameters: optimizationResult.optimalParameters
  });

  artifacts.push(...(benchmarkResult.artifacts || []));

  await ctx.breakpoint({
    question: `Benchmarking complete. Quantum energy: ${optimizationResult.finalEnergy}, Classical reference: ${benchmarkResult.classicalEnergy}, Difference: ${benchmarkResult.energyDifference}. Review comparison?`,
    title: 'Classical Comparison Review',
    context: {
      runId: ctx.runId,
      quantum: { energy: optimizationResult.finalEnergy },
      classical: benchmarkResult,
      files: (benchmarkResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 7: RESULT ANALYSIS AND DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Result Analysis and Documentation');

  const analysisResult = await ctx.task(resultAnalysisTask, {
    algorithmType,
    problemType,
    formulationResult,
    ansatzResult,
    optimizationResult,
    convergenceResult,
    benchmarkResult,
    outputDir
  });

  artifacts.push(...(analysisResult.artifacts || []));

  await ctx.breakpoint({
    question: `${algorithmType} implementation complete. Final energy: ${optimizationResult.finalEnergy}, Chemical accuracy achieved: ${analysisResult.chemicalAccuracyAchieved || 'N/A'}. Approve results?`,
    title: 'Variational Algorithm Complete',
    context: {
      runId: ctx.runId,
      summary: analysisResult.summary,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    algorithmType,
    problemType,
    optimalParameters: optimizationResult.optimalParameters,
    energy: optimizationResult.finalEnergy,
    convergence: {
      converged: convergenceResult.converged,
      iterationsUsed: optimizationResult.iterationsUsed,
      finalGradientNorm: convergenceResult.finalGradientNorm
    },
    comparison: {
      classicalEnergy: benchmarkResult.classicalEnergy,
      energyDifference: benchmarkResult.energyDifference,
      chemicalAccuracy: analysisResult.chemicalAccuracyAchieved
    },
    circuitMetrics: {
      qubitCount: formulationResult.qubitCount,
      parameterCount: ansatzResult.parameterCount,
      circuitDepth: ansatzResult.circuitDepth
    },
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'QC-ALGO-002',
      processName: 'Variational Algorithm Implementation',
      category: 'quantum-computing',
      timestamp: startTime,
      optimizer,
      ansatzType
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const problemFormulationTask = defineTask('vqa-problem-formulation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'VQA Problem Formulation',
  agent: {
    name: 'variational-algorithm-specialist',
    skills: ['pennylane-hybrid-executor', 'ansatz-designer', 'barren-plateau-analyzer', 'qubo-formulator'],
    prompt: {
      role: 'Quantum Chemistry and Optimization Specialist',
      task: 'Formulate the problem as a Hamiltonian for variational quantum algorithm',
      context: args,
      instructions: [
        '1. Analyze the problem type (chemistry, optimization, ML)',
        '2. Construct the problem Hamiltonian',
        '3. For chemistry: build molecular Hamiltonian with chosen encoding',
        '4. For optimization: convert to QUBO/Ising model',
        '5. Decompose Hamiltonian into Pauli strings',
        '6. Count the number of Hamiltonian terms',
        '7. Estimate measurement overhead',
        '8. Identify symmetries for qubit reduction',
        '9. Apply tapering if applicable',
        '10. Document the formulation approach'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['hamiltonian', 'hamiltonianTerms', 'qubitCount'],
      properties: {
        hamiltonian: { type: 'object' },
        hamiltonianTerms: { type: 'number' },
        qubitCount: { type: 'number' },
        pauliStrings: { type: 'array' },
        encoding: { type: 'string' },
        symmetriesUsed: { type: 'array' },
        measurementGroups: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'variational', 'formulation']
}));

export const ansatzDesignTask = defineTask('vqa-ansatz-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'VQA Ansatz Design',
  agent: {
    name: 'variational-algorithm-specialist',
    skills: ['pennylane-hybrid-executor', 'ansatz-designer', 'barren-plateau-analyzer', 'qubo-formulator'],
    prompt: {
      role: 'Quantum Circuit Design Specialist',
      task: 'Design the parameterized ansatz circuit for the variational algorithm',
      context: args,
      instructions: [
        '1. Select ansatz type based on problem and hardware',
        '2. For VQE chemistry: consider UCCSD, ADAPT-VQE ansatzes',
        '3. For QAOA: design mixer and cost layers',
        '4. For hardware-efficient: use RY-CZ layers',
        '5. Determine optimal number of layers/repetitions',
        '6. Initialize parameters (random, heuristic, or pretrained)',
        '7. Consider hardware connectivity constraints',
        '8. Calculate parameter count and circuit depth',
        '9. Implement parameter initialization strategy',
        '10. Document ansatz architecture'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['ansatzCircuit', 'parameterCount', 'circuitDepth', 'initialParameters'],
      properties: {
        ansatzCircuit: { type: 'object' },
        parameterCount: { type: 'number' },
        circuitDepth: { type: 'number' },
        initialParameters: { type: 'array', items: { type: 'number' } },
        ansatzType: { type: 'string' },
        layers: { type: 'number' },
        entanglingPattern: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'variational', 'ansatz']
}));

export const optimizerConfigurationTask = defineTask('vqa-optimizer-config', (args, taskCtx) => ({
  kind: 'agent',
  title: 'VQA Optimizer Configuration',
  agent: {
    name: 'variational-algorithm-specialist',
    skills: ['pennylane-hybrid-executor', 'ansatz-designer', 'barren-plateau-analyzer', 'qubo-formulator'],
    prompt: {
      role: 'Optimization Algorithm Specialist',
      task: 'Configure the classical optimizer for the variational algorithm',
      context: args,
      instructions: [
        '1. Select appropriate optimizer for the problem',
        '2. Configure optimizer hyperparameters',
        '3. Set learning rate or step size',
        '4. Configure gradient estimation (parameter shift, finite diff)',
        '5. Set convergence criteria',
        '6. Configure early stopping if needed',
        '7. Set up callback functions for monitoring',
        '8. Consider noise-resilient optimizers (SPSA)',
        '9. Configure batch size for gradient estimation',
        '10. Document optimizer configuration'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizerConfig'],
      properties: {
        optimizerConfig: { type: 'object' },
        gradientMethod: { type: 'string' },
        learningRate: { type: 'number' },
        convergenceCriteria: { type: 'object' },
        callbackConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'variational', 'optimization']
}));

export const hybridOptimizationTask = defineTask('vqa-hybrid-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'VQA Hybrid Optimization Loop',
  agent: {
    name: 'variational-algorithm-specialist',
    skills: ['pennylane-hybrid-executor', 'ansatz-designer', 'barren-plateau-analyzer', 'qubo-formulator'],
    prompt: {
      role: 'Hybrid Algorithm Execution Specialist',
      task: 'Execute the hybrid quantum-classical optimization loop',
      context: args,
      instructions: [
        '1. Initialize the optimization with starting parameters',
        '2. Execute quantum circuit with current parameters',
        '3. Measure expectation value of Hamiltonian',
        '4. Compute gradients using chosen method',
        '5. Update parameters using classical optimizer',
        '6. Track optimization history (energy, parameters)',
        '7. Monitor convergence criteria',
        '8. Apply noise mitigation if using hardware',
        '9. Continue until convergence or max iterations',
        '10. Return optimal parameters and final energy'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['optimalParameters', 'finalEnergy', 'iterationsUsed', 'history'],
      properties: {
        optimalParameters: { type: 'array', items: { type: 'number' } },
        finalEnergy: { type: 'number' },
        iterationsUsed: { type: 'number' },
        history: { type: 'object' },
        convergenceAchieved: { type: 'boolean' },
        totalCircuitExecutions: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'variational', 'optimization', 'hybrid']
}));

export const convergenceAnalysisTask = defineTask('vqa-convergence-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'VQA Convergence Analysis',
  agent: {
    name: 'variational-algorithm-specialist',
    skills: ['pennylane-hybrid-executor', 'ansatz-designer', 'barren-plateau-analyzer', 'qubo-formulator'],
    prompt: {
      role: 'Numerical Analysis Specialist',
      task: 'Analyze the convergence behavior of the variational algorithm',
      context: args,
      instructions: [
        '1. Analyze energy vs iteration curve',
        '2. Check for convergence plateau',
        '3. Identify any oscillations or instabilities',
        '4. Calculate final gradient norm',
        '5. Check parameter stability',
        '6. Identify barren plateau indicators',
        '7. Analyze variance in energy estimates',
        '8. Compare with expected convergence rate',
        '9. Recommend if more iterations needed',
        '10. Generate convergence report'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['converged', 'finalGradientNorm'],
      properties: {
        converged: { type: 'boolean' },
        finalGradientNorm: { type: 'number' },
        convergenceRate: { type: 'number' },
        barrenPlateauDetected: { type: 'boolean' },
        energyVariance: { type: 'number' },
        recommendations: { type: 'array', items: { type: 'string' } },
        convergencePlot: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'variational', 'analysis']
}));

export const classicalBenchmarkTask = defineTask('vqa-classical-benchmark', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Classical Benchmark Comparison',
  agent: {
    name: 'variational-algorithm-specialist',
    skills: ['pennylane-hybrid-executor', 'ansatz-designer', 'barren-plateau-analyzer', 'qubo-formulator'],
    prompt: {
      role: 'Computational Chemistry/Optimization Specialist',
      task: 'Compare variational quantum results with classical methods',
      context: args,
      instructions: [
        '1. Run exact diagonalization if problem size allows',
        '2. For chemistry: run HF, CCSD, or FCI',
        '3. For optimization: run classical solvers',
        '4. Calculate energy difference from exact',
        '5. Check if chemical accuracy achieved (< 1.6 mHa)',
        '6. Compare solution quality for optimization',
        '7. Compare computational resources used',
        '8. Identify quantum advantage conditions',
        '9. Document classical method used',
        '10. Generate comparison report'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['classicalEnergy', 'energyDifference'],
      properties: {
        classicalEnergy: { type: 'number' },
        classicalMethod: { type: 'string' },
        energyDifference: { type: 'number' },
        chemicalAccuracyAchieved: { type: 'boolean' },
        relativePrecision: { type: 'number' },
        quantumAdvantageAnalysis: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'variational', 'benchmark']
}));

export const resultAnalysisTask = defineTask('vqa-result-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'VQA Result Analysis',
  agent: {
    name: 'variational-algorithm-specialist',
    skills: ['pennylane-hybrid-executor', 'ansatz-designer', 'barren-plateau-analyzer', 'qubo-formulator'],
    prompt: {
      role: 'Quantum Algorithm Analysis Specialist',
      task: 'Analyze and document variational algorithm results',
      context: args,
      instructions: [
        '1. Summarize algorithm configuration and results',
        '2. Analyze optimal parameter distribution',
        '3. For chemistry: extract molecular properties',
        '4. For optimization: decode optimal solution',
        '5. Assess result quality and accuracy',
        '6. Document resource requirements',
        '7. Provide recommendations for improvement',
        '8. Generate visualizations',
        '9. Create summary report',
        '10. Archive all artifacts'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'reportPath'],
      properties: {
        summary: { type: 'object' },
        chemicalAccuracyAchieved: { type: 'boolean' },
        optimalSolution: { type: 'object' },
        resourceSummary: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'variational', 'analysis', 'documentation']
}));
