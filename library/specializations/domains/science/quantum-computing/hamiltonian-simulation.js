/**
 * @process Hamiltonian Simulation Implementation
 * @id QC-CHEM-002
 * @description Implement Hamiltonian simulation for quantum many-body systems using Trotter-Suzuki
 * decomposition, quantum signal processing, or qubitization techniques.
 * @category Quantum Computing - Chemistry and Simulation
 * @priority P1 - High
 * @inputs {{ hamiltonian: object, simulationTime: number, method?: string }}
 * @outputs {{ success: boolean, evolutionCircuit: object, errorBounds: object, artifacts: array }}
 *
 * @example
 * const result = await orchestrate('hamiltonian-simulation', {
 *   hamiltonian: isingHamiltonian,
 *   simulationTime: 1.0,
 *   method: 'trotter'
 * });
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    hamiltonian,
    simulationTime,
    method = 'trotter', // 'trotter', 'qsp', 'qubitization', 'qdrift'
    trotterOrder = 2,
    errorTolerance = 0.01,
    framework = 'qiskit',
    outputDir = 'hamiltonian-sim-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Hamiltonian Simulation`);
  ctx.log('info', `Method: ${method}, Time: ${simulationTime}, Error tolerance: ${errorTolerance}`);

  // ============================================================================
  // PHASE 1: HAMILTONIAN ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Hamiltonian Analysis');

  const analysisResult = await ctx.task(hamiltonianAnalysisTask, {
    hamiltonian,
    framework
  });

  artifacts.push(...(analysisResult.artifacts || []));

  await ctx.breakpoint({
    question: `Hamiltonian analyzed. Terms: ${analysisResult.termCount}, Qubits: ${analysisResult.qubitCount}, Spectral norm: ${analysisResult.spectralNorm}. Proceed with method selection?`,
    title: 'Hamiltonian Analysis Review',
    context: {
      runId: ctx.runId,
      analysis: analysisResult,
      files: (analysisResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 2: SIMULATION METHOD OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Simulation Method Optimization');

  const methodResult = await ctx.task(simulationMethodOptimizationTask, {
    hamiltonian,
    analysisResult,
    method,
    simulationTime,
    errorTolerance,
    trotterOrder
  });

  artifacts.push(...(methodResult.artifacts || []));

  ctx.log('info', `Method optimized. Trotter steps: ${methodResult.trotterSteps || 'N/A'}, Estimated error: ${methodResult.estimatedError}`);

  // ============================================================================
  // PHASE 3: EVOLUTION CIRCUIT CONSTRUCTION
  // ============================================================================

  ctx.log('info', 'Phase 3: Evolution Circuit Construction');

  const circuitResult = await ctx.task(evolutionCircuitConstructionTask, {
    hamiltonian,
    methodConfig: methodResult,
    simulationTime,
    framework
  });

  artifacts.push(...(circuitResult.artifacts || []));

  await ctx.breakpoint({
    question: `Evolution circuit constructed. Depth: ${circuitResult.circuitDepth}, Gates: ${circuitResult.gateCount}. Review circuit structure?`,
    title: 'Evolution Circuit Review',
    context: {
      runId: ctx.runId,
      circuit: circuitResult,
      files: (circuitResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 4: CIRCUIT OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Circuit Optimization');

  const optimizationResult = await ctx.task(simulationCircuitOptimizationTask, {
    circuit: circuitResult.evolutionCircuit,
    framework
  });

  artifacts.push(...(optimizationResult.artifacts || []));

  ctx.log('info', `Circuit optimized. Depth reduction: ${optimizationResult.depthReduction}%`);

  // ============================================================================
  // PHASE 5: ERROR BOUND ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Error Bound Analysis');

  const errorResult = await ctx.task(simulationErrorAnalysisTask, {
    hamiltonian,
    methodConfig: methodResult,
    simulationTime,
    trotterOrder
  });

  artifacts.push(...(errorResult.artifacts || []));

  if (errorResult.estimatedError > errorTolerance) {
    await ctx.breakpoint({
      question: `Estimated error ${errorResult.estimatedError} exceeds tolerance ${errorTolerance}. Increase Trotter steps or accept higher error?`,
      title: 'Error Tolerance Warning',
      context: {
        runId: ctx.runId,
        error: errorResult,
        files: (errorResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 6: SIMULATION VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Simulation Validation');

  const validationResult = await ctx.task(simulationValidationTask, {
    evolutionCircuit: optimizationResult.optimizedCircuit,
    hamiltonian,
    simulationTime,
    framework
  });

  artifacts.push(...(validationResult.artifacts || []));

  // ============================================================================
  // PHASE 7: RESOURCE ESTIMATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Resource Estimation');

  const resourceResult = await ctx.task(simulationResourceEstimationTask, {
    circuit: optimizationResult.optimizedCircuit,
    methodConfig: methodResult,
    analysisResult
  });

  artifacts.push(...(resourceResult.artifacts || []));

  // ============================================================================
  // PHASE 8: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Documentation');

  const reportResult = await ctx.task(hamiltonianSimulationReportTask, {
    hamiltonian,
    method,
    simulationTime,
    analysisResult,
    methodResult,
    circuitResult,
    optimizationResult,
    errorResult,
    validationResult,
    resourceResult,
    outputDir
  });

  artifacts.push(...(reportResult.artifacts || []));

  await ctx.breakpoint({
    question: `Hamiltonian simulation complete. Time: ${simulationTime}, Error bound: ${errorResult.estimatedError}, Circuit depth: ${optimizationResult.optimizedDepth}. Approve results?`,
    title: 'Hamiltonian Simulation Complete',
    context: {
      runId: ctx.runId,
      summary: {
        method,
        simulationTime,
        errorBound: errorResult.estimatedError,
        circuitDepth: optimizationResult.optimizedDepth,
        validated: validationResult.validated
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    method,
    simulationTime,
    evolutionCircuit: {
      circuit: optimizationResult.optimizedCircuit,
      originalDepth: circuitResult.circuitDepth,
      optimizedDepth: optimizationResult.optimizedDepth,
      gateCount: optimizationResult.optimizedGateCount
    },
    errorBounds: {
      estimatedError: errorResult.estimatedError,
      trotterError: errorResult.trotterError,
      algorithmicError: errorResult.algorithmicError,
      errorTolerance
    },
    methodDetails: {
      trotterOrder: method === 'trotter' ? trotterOrder : null,
      trotterSteps: methodResult.trotterSteps,
      parameters: methodResult.parameters
    },
    validation: {
      validated: validationResult.validated,
      fidelity: validationResult.fidelity,
      observableError: validationResult.observableError
    },
    resources: resourceResult,
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'QC-CHEM-002',
      processName: 'Hamiltonian Simulation Implementation',
      category: 'quantum-computing',
      timestamp: startTime,
      framework
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const hamiltonianAnalysisTask = defineTask('hs-hamiltonian-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Hamiltonian Analysis',
  agent: {
    name: 'hamiltonian-simulator',
    skills: ['trotter-simulator', 'openfermion-hamiltonian', 'qiskit-nature-solver', 'tensor-network-simulator'],
    prompt: {
      role: 'Quantum Hamiltonian Specialist',
      task: 'Analyze Hamiltonian structure for simulation',
      context: args,
      instructions: [
        '1. Parse Hamiltonian representation',
        '2. Count number of terms',
        '3. Identify Hamiltonian type (Ising, Heisenberg, etc.)',
        '4. Calculate spectral norm',
        '5. Identify commuting groups',
        '6. Calculate term weights',
        '7. Analyze locality structure',
        '8. Identify symmetries',
        '9. Estimate simulation difficulty',
        '10. Document Hamiltonian properties'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['termCount', 'qubitCount', 'spectralNorm'],
      properties: {
        termCount: { type: 'number' },
        qubitCount: { type: 'number' },
        spectralNorm: { type: 'number' },
        hamiltonianType: { type: 'string' },
        commutingGroups: { type: 'array' },
        locality: { type: 'number' },
        symmetries: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'simulation', 'hamiltonian']
}));

export const simulationMethodOptimizationTask = defineTask('hs-method-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Simulation Method Optimization',
  agent: {
    name: 'hamiltonian-simulator',
    skills: ['trotter-simulator', 'openfermion-hamiltonian', 'qiskit-nature-solver', 'tensor-network-simulator'],
    prompt: {
      role: 'Quantum Simulation Method Specialist',
      task: 'Optimize simulation method parameters',
      context: args,
      instructions: [
        '1. Calculate optimal Trotter step count',
        '2. Determine decomposition ordering',
        '3. Optimize for error-resource tradeoff',
        '4. Consider QSP parameters if applicable',
        '5. Calculate block encoding parameters',
        '6. Optimize commutator bounds',
        '7. Determine randomized compilation needs',
        '8. Calculate expected error',
        '9. Document parameter choices',
        '10. Provide method recommendations'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['trotterSteps', 'estimatedError', 'parameters'],
      properties: {
        trotterSteps: { type: 'number' },
        estimatedError: { type: 'number' },
        parameters: { type: 'object' },
        ordering: { type: 'array' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'simulation', 'optimization']
}));

export const evolutionCircuitConstructionTask = defineTask('hs-circuit-construction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evolution Circuit Construction',
  agent: {
    name: 'hamiltonian-simulator',
    skills: ['trotter-simulator', 'openfermion-hamiltonian', 'qiskit-nature-solver', 'tensor-network-simulator'],
    prompt: {
      role: 'Quantum Circuit Synthesis Specialist',
      task: 'Construct time evolution circuit from Hamiltonian',
      context: args,
      instructions: [
        '1. Implement Trotter decomposition',
        '2. Synthesize exponential of each term',
        '3. Construct layer structure',
        '4. Implement controlled versions if needed',
        '5. Add ancilla qubits if required',
        '6. Implement measurement circuits',
        '7. Calculate circuit depth',
        '8. Count gate usage',
        '9. Generate circuit diagram',
        '10. Document circuit structure'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['evolutionCircuit', 'circuitDepth', 'gateCount'],
      properties: {
        evolutionCircuit: { type: 'object' },
        circuitDepth: { type: 'number' },
        gateCount: { type: 'number' },
        gateBreakdown: { type: 'object' },
        ancillaCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'simulation', 'circuit']
}));

export const simulationCircuitOptimizationTask = defineTask('hs-circuit-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Simulation Circuit Optimization',
  agent: {
    name: 'hamiltonian-simulator',
    skills: ['trotter-simulator', 'openfermion-hamiltonian', 'qiskit-nature-solver', 'tensor-network-simulator'],
    prompt: {
      role: 'Quantum Circuit Optimization Specialist',
      task: 'Optimize evolution circuit for depth and gate count',
      context: args,
      instructions: [
        '1. Apply gate cancellation rules',
        '2. Merge commuting gates',
        '3. Optimize Pauli exponential synthesis',
        '4. Reduce CNOT count',
        '5. Apply hardware-aware optimization',
        '6. Parallelize independent gates',
        '7. Calculate optimization metrics',
        '8. Verify functional equivalence',
        '9. Document optimizations applied',
        '10. Generate optimized circuit'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizedCircuit', 'optimizedDepth', 'depthReduction'],
      properties: {
        optimizedCircuit: { type: 'object' },
        optimizedDepth: { type: 'number' },
        optimizedGateCount: { type: 'number' },
        depthReduction: { type: 'number' },
        gateReduction: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'simulation', 'optimization']
}));

export const simulationErrorAnalysisTask = defineTask('hs-error-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Simulation Error Analysis',
  agent: {
    name: 'hamiltonian-simulator',
    skills: ['trotter-simulator', 'openfermion-hamiltonian', 'qiskit-nature-solver', 'tensor-network-simulator'],
    prompt: {
      role: 'Quantum Error Analysis Specialist',
      task: 'Analyze error bounds for Hamiltonian simulation',
      context: args,
      instructions: [
        '1. Calculate Trotter error bound',
        '2. Compute commutator norms',
        '3. Analyze higher-order error terms',
        '4. Calculate algorithmic error',
        '5. Estimate compilation error',
        '6. Compute total error bound',
        '7. Compare with target tolerance',
        '8. Identify error sources',
        '9. Suggest error reduction strategies',
        '10. Document error analysis'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['estimatedError', 'trotterError'],
      properties: {
        estimatedError: { type: 'number' },
        trotterError: { type: 'number' },
        algorithmicError: { type: 'number' },
        compilationError: { type: 'number' },
        errorBreakdown: { type: 'object' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'simulation', 'error-analysis']
}));

export const simulationValidationTask = defineTask('hs-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Simulation Validation',
  agent: {
    name: 'hamiltonian-simulator',
    skills: ['trotter-simulator', 'openfermion-hamiltonian', 'qiskit-nature-solver', 'tensor-network-simulator'],
    prompt: {
      role: 'Quantum Simulation Validation Specialist',
      task: 'Validate Hamiltonian simulation correctness',
      context: args,
      instructions: [
        '1. Compare with exact evolution for small systems',
        '2. Check state fidelity',
        '3. Verify observable expectation values',
        '4. Test energy conservation',
        '5. Validate symmetry preservation',
        '6. Test time reversal',
        '7. Compare with known solutions',
        '8. Validate error scaling',
        '9. Document validation results',
        '10. Provide confidence assessment'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['validated', 'fidelity'],
      properties: {
        validated: { type: 'boolean' },
        fidelity: { type: 'number' },
        observableError: { type: 'number' },
        energyConservation: { type: 'number' },
        symmetryPreservation: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'simulation', 'validation']
}));

export const simulationResourceEstimationTask = defineTask('hs-resource-estimation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Simulation Resource Estimation',
  agent: {
    name: 'hamiltonian-simulator',
    skills: ['trotter-simulator', 'openfermion-hamiltonian', 'qiskit-nature-solver', 'tensor-network-simulator'],
    prompt: {
      role: 'Quantum Resource Estimation Specialist',
      task: 'Estimate resources required for Hamiltonian simulation',
      context: args,
      instructions: [
        '1. Count total qubits required',
        '2. Count total gates by type',
        '3. Calculate circuit depth',
        '4. Estimate execution time',
        '5. Calculate T-gate count',
        '6. Estimate with error correction overhead',
        '7. Project to target error rate',
        '8. Compare with hardware capabilities',
        '9. Document resource requirements',
        '10. Provide feasibility assessment'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['totalQubits', 'totalGates', 'circuitDepth'],
      properties: {
        totalQubits: { type: 'number' },
        totalGates: { type: 'number' },
        circuitDepth: { type: 'number' },
        tGateCount: { type: 'number' },
        estimatedTime: { type: 'number' },
        withQEC: { type: 'object' },
        feasibilityAssessment: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'simulation', 'resources']
}));

export const hamiltonianSimulationReportTask = defineTask('hs-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Hamiltonian Simulation Report',
  agent: {
    name: 'hamiltonian-simulator',
    skills: ['trotter-simulator', 'openfermion-hamiltonian', 'qiskit-nature-solver', 'tensor-network-simulator'],
    prompt: {
      role: 'Technical Documentation Specialist',
      task: 'Generate comprehensive Hamiltonian simulation report',
      context: args,
      instructions: [
        '1. Summarize Hamiltonian properties',
        '2. Document simulation method',
        '3. Present circuit details',
        '4. Include error analysis',
        '5. Present validation results',
        '6. Document resource requirements',
        '7. Include visualizations',
        '8. Provide recommendations',
        '9. Add references',
        '10. Generate final report'
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
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'simulation', 'reporting']
}));
