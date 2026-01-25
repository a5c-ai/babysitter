/**
 * @process Quantum Circuit Design and Optimization
 * @id QC-ALGO-001
 * @description Design, implement, and optimize quantum circuits for specific computational problems.
 * Covers circuit construction using quantum gates, depth optimization, gate synthesis, and
 * transpilation to native hardware gate sets.
 * @category Quantum Computing - Algorithm Development
 * @priority P0 - Critical
 * @inputs {{ problemDescription: string, targetHardware?: string, optimizationGoals?: array }}
 * @outputs {{ success: boolean, circuit: object, resourceEstimates: object, artifacts: array }}
 *
 * @example
 * const result = await orchestrate('quantum-circuit-design-optimization', {
 *   problemDescription: 'Implement Grover search for 4-qubit database',
 *   targetHardware: 'ibm_brisbane',
 *   optimizationGoals: ['minimize_depth', 'minimize_cnot_count']
 * });
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    problemDescription,
    targetHardware = 'generic',
    optimizationGoals = ['minimize_depth', 'minimize_gate_count'],
    framework = 'qiskit',
    maxQubits = 50,
    maxDepth = 1000,
    outputDir = 'quantum-circuit-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Quantum Circuit Design for: ${problemDescription}`);
  ctx.log('info', `Target hardware: ${targetHardware}, Framework: ${framework}`);

  // ============================================================================
  // PHASE 1: PROBLEM ANALYSIS AND RESOURCE ESTIMATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Problem Analysis and Resource Estimation');

  const analysisResult = await ctx.task(problemAnalysisTask, {
    problemDescription,
    targetHardware,
    maxQubits,
    framework
  });

  artifacts.push(...(analysisResult.artifacts || []));

  await ctx.breakpoint({
    question: `Problem analysis complete. Estimated qubits: ${analysisResult.estimatedQubits}, Estimated depth: ${analysisResult.estimatedDepth}. Proceed with circuit design?`,
    title: 'Problem Analysis Review',
    context: {
      runId: ctx.runId,
      problemDescription,
      analysis: analysisResult,
      files: (analysisResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 2: CIRCUIT ARCHITECTURE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Circuit Architecture Design');

  const architectureResult = await ctx.task(circuitArchitectureTask, {
    problemDescription,
    analysisResult,
    framework,
    targetHardware
  });

  artifacts.push(...(architectureResult.artifacts || []));

  ctx.log('info', `Circuit architecture designed with ${architectureResult.qubitCount} qubits`);

  // ============================================================================
  // PHASE 3: CIRCUIT IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Circuit Implementation');

  const implementationResult = await ctx.task(circuitImplementationTask, {
    architecture: architectureResult,
    framework,
    problemDescription
  });

  artifacts.push(...(implementationResult.artifacts || []));

  await ctx.breakpoint({
    question: `Circuit implementation complete. Gates: ${implementationResult.gateCount}, Depth: ${implementationResult.circuitDepth}. Review implementation?`,
    title: 'Circuit Implementation Review',
    context: {
      runId: ctx.runId,
      implementation: implementationResult,
      files: (implementationResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 4: CIRCUIT OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Circuit Optimization');

  const optimizationResult = await ctx.task(circuitOptimizationTask, {
    circuit: implementationResult,
    optimizationGoals,
    maxDepth,
    framework
  });

  artifacts.push(...(optimizationResult.artifacts || []));

  ctx.log('info', `Optimization complete. Depth reduction: ${optimizationResult.depthReduction}%, Gate reduction: ${optimizationResult.gateReduction}%`);

  // ============================================================================
  // PHASE 5: HARDWARE TRANSPILATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Hardware Transpilation');

  const transpilationResult = await ctx.task(hardwareTranspilationTask, {
    circuit: optimizationResult.optimizedCircuit,
    targetHardware,
    framework
  });

  artifacts.push(...(transpilationResult.artifacts || []));

  await ctx.breakpoint({
    question: `Transpilation to ${targetHardware} complete. Native gates: ${transpilationResult.nativeGateCount}, Final depth: ${transpilationResult.finalDepth}. Review transpiled circuit?`,
    title: 'Transpilation Review',
    context: {
      runId: ctx.runId,
      transpilation: transpilationResult,
      files: (transpilationResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 6: SIMULATION VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Simulation Validation');

  const validationResult = await ctx.task(simulationValidationTask, {
    originalCircuit: implementationResult,
    optimizedCircuit: optimizationResult.optimizedCircuit,
    transpiledCircuit: transpilationResult.transpiledCircuit,
    framework
  });

  artifacts.push(...(validationResult.artifacts || []));

  if (!validationResult.validated) {
    await ctx.breakpoint({
      question: `Validation failed: ${validationResult.issues.join(', ')}. Address issues or proceed with caution?`,
      title: 'Validation Warning',
      context: {
        runId: ctx.runId,
        validation: validationResult,
        files: (validationResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 7: DOCUMENTATION AND RESOURCE ESTIMATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Documentation and Resource Estimation');

  const documentationResult = await ctx.task(circuitDocumentationTask, {
    problemDescription,
    analysisResult,
    architectureResult,
    implementationResult,
    optimizationResult,
    transpilationResult,
    validationResult,
    outputDir
  });

  artifacts.push(...(documentationResult.artifacts || []));

  await ctx.breakpoint({
    question: `Quantum circuit design complete for: ${problemDescription}. Final qubit count: ${transpilationResult.qubitCount}, Final depth: ${transpilationResult.finalDepth}. Approve results?`,
    title: 'Circuit Design Complete',
    context: {
      runId: ctx.runId,
      summary: {
        qubits: transpilationResult.qubitCount,
        depth: transpilationResult.finalDepth,
        nativeGates: transpilationResult.nativeGateCount,
        validated: validationResult.validated
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    problemDescription,
    targetHardware,
    circuit: {
      qubitCount: transpilationResult.qubitCount,
      depth: transpilationResult.finalDepth,
      gateCount: transpilationResult.nativeGateCount,
      nativeGateSet: transpilationResult.nativeGateSet
    },
    optimization: {
      depthReduction: optimizationResult.depthReduction,
      gateReduction: optimizationResult.gateReduction,
      optimizationTechniques: optimizationResult.techniquesApplied
    },
    resourceEstimates: {
      estimatedQubits: analysisResult.estimatedQubits,
      estimatedDepth: analysisResult.estimatedDepth,
      estimatedExecutionTime: transpilationResult.estimatedExecutionTime,
      estimatedFidelity: transpilationResult.estimatedFidelity
    },
    validation: {
      validated: validationResult.validated,
      fidelityCheck: validationResult.fidelityCheck,
      correctnessCheck: validationResult.correctnessCheck
    },
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'QC-ALGO-001',
      processName: 'Quantum Circuit Design and Optimization',
      category: 'quantum-computing',
      timestamp: startTime,
      framework
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const problemAnalysisTask = defineTask('qc-problem-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Quantum Problem Analysis',
  agent: {
    name: 'quantum-circuit-architect',
    skills: ['qiskit-circuit-builder', 'cirq-circuit-builder', 'circuit-optimizer', 'tket-compiler', 'pyzx-simplifier', 'qubit-mapper'],
    prompt: {
      role: 'Quantum Algorithm Design Specialist',
      task: 'Analyze computational problem and estimate quantum resource requirements',
      context: args,
      instructions: [
        '1. Analyze the problem description and identify the computational task',
        '2. Determine the most suitable quantum algorithm approach',
        '3. Estimate the number of qubits required',
        '4. Estimate circuit depth and gate count',
        '5. Identify any special requirements (ancilla qubits, measurement)',
        '6. Consider hardware constraints of the target platform',
        '7. Identify potential optimization opportunities',
        '8. Document assumptions and constraints',
        '9. Provide complexity analysis (query complexity, gate complexity)',
        '10. Recommend quantum programming framework features to use'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['estimatedQubits', 'estimatedDepth', 'algorithmType'],
      properties: {
        estimatedQubits: { type: 'number' },
        estimatedDepth: { type: 'number' },
        estimatedGates: { type: 'number' },
        algorithmType: { type: 'string' },
        algorithmFamily: { type: 'string' },
        ancillaRequired: { type: 'number' },
        measurements: { type: 'number' },
        complexityAnalysis: { type: 'object' },
        assumptions: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'analysis', 'resource-estimation']
}));

export const circuitArchitectureTask = defineTask('qc-circuit-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Quantum Circuit Architecture Design',
  agent: {
    name: 'quantum-circuit-architect',
    skills: ['qiskit-circuit-builder', 'cirq-circuit-builder', 'circuit-optimizer', 'tket-compiler', 'pyzx-simplifier', 'qubit-mapper'],
    prompt: {
      role: 'Quantum Circuit Architect',
      task: 'Design the high-level architecture of the quantum circuit',
      context: args,
      instructions: [
        '1. Design qubit allocation and register structure',
        '2. Define circuit layers and their purposes',
        '3. Plan gate sequences for the algorithm',
        '4. Design initialization and state preparation',
        '5. Plan measurement strategy',
        '6. Consider qubit connectivity for target hardware',
        '7. Design modular subcircuits for reusability',
        '8. Plan for error mitigation techniques',
        '9. Document circuit structure with diagrams',
        '10. Provide pseudocode for circuit construction'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['qubitCount', 'registers', 'layers'],
      properties: {
        qubitCount: { type: 'number' },
        registers: { type: 'array' },
        layers: { type: 'array' },
        initializationStrategy: { type: 'string' },
        measurementStrategy: { type: 'string' },
        subcircuits: { type: 'array' },
        connectivityRequirements: { type: 'object' },
        pseudocode: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'architecture', 'design']
}));

export const circuitImplementationTask = defineTask('qc-circuit-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Quantum Circuit Implementation',
  agent: {
    name: 'quantum-circuit-architect',
    skills: ['qiskit-circuit-builder', 'cirq-circuit-builder', 'circuit-optimizer', 'tket-compiler', 'pyzx-simplifier', 'qubit-mapper'],
    prompt: {
      role: 'Quantum Software Developer',
      task: 'Implement the quantum circuit using the specified framework',
      context: args,
      instructions: [
        '1. Implement circuit using Qiskit/Cirq/PennyLane syntax',
        '2. Create quantum registers as designed',
        '3. Implement gate sequences for each layer',
        '4. Add parameterized gates where applicable',
        '5. Implement measurement operations',
        '6. Add barriers for visualization',
        '7. Implement any classical control flow',
        '8. Document the implementation with comments',
        '9. Calculate initial gate count and depth',
        '10. Generate circuit visualization'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['circuitCode', 'gateCount', 'circuitDepth'],
      properties: {
        circuitCode: { type: 'string' },
        gateCount: { type: 'number' },
        circuitDepth: { type: 'number' },
        gateBreakdown: { type: 'object' },
        parameters: { type: 'array' },
        circuitDiagram: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'implementation', 'coding']
}));

export const circuitOptimizationTask = defineTask('qc-circuit-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Quantum Circuit Optimization',
  agent: {
    name: 'quantum-circuit-architect',
    skills: ['qiskit-circuit-builder', 'cirq-circuit-builder', 'circuit-optimizer', 'tket-compiler', 'pyzx-simplifier', 'qubit-mapper'],
    prompt: {
      role: 'Quantum Circuit Optimization Specialist',
      task: 'Optimize the quantum circuit for depth and gate count',
      context: args,
      instructions: [
        '1. Apply gate cancellation rules',
        '2. Merge consecutive single-qubit gates',
        '3. Apply commutation rules to reduce depth',
        '4. Decompose multi-qubit gates optimally',
        '5. Apply template matching optimization',
        '6. Reduce CNOT/CZ gate count',
        '7. Apply Cartan decomposition for two-qubit gates',
        '8. Use KAK decomposition where applicable',
        '9. Calculate optimization metrics',
        '10. Document optimization techniques applied'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizedCircuit', 'depthReduction', 'gateReduction'],
      properties: {
        optimizedCircuit: { type: 'object' },
        depthReduction: { type: 'number' },
        gateReduction: { type: 'number' },
        techniquesApplied: { type: 'array', items: { type: 'string' } },
        beforeMetrics: { type: 'object' },
        afterMetrics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'optimization', 'transpilation']
}));

export const hardwareTranspilationTask = defineTask('qc-hardware-transpilation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Hardware Transpilation',
  agent: {
    name: 'quantum-circuit-architect',
    skills: ['qiskit-circuit-builder', 'cirq-circuit-builder', 'circuit-optimizer', 'tket-compiler', 'pyzx-simplifier', 'qubit-mapper'],
    prompt: {
      role: 'Quantum Hardware Integration Specialist',
      task: 'Transpile circuit to native hardware gate set',
      context: args,
      instructions: [
        '1. Identify target hardware native gate set',
        '2. Decompose gates to native gates',
        '3. Map logical qubits to physical qubits',
        '4. Insert SWAP gates for connectivity',
        '5. Apply routing optimization',
        '6. Apply scheduling optimization',
        '7. Estimate execution time on hardware',
        '8. Estimate expected fidelity',
        '9. Generate hardware-ready circuit',
        '10. Document transpilation choices'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['transpiledCircuit', 'qubitCount', 'finalDepth', 'nativeGateCount'],
      properties: {
        transpiledCircuit: { type: 'object' },
        qubitCount: { type: 'number' },
        finalDepth: { type: 'number' },
        nativeGateCount: { type: 'number' },
        nativeGateSet: { type: 'array', items: { type: 'string' } },
        qubitMapping: { type: 'object' },
        swapsInserted: { type: 'number' },
        estimatedExecutionTime: { type: 'number' },
        estimatedFidelity: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'transpilation', 'hardware']
}));

export const simulationValidationTask = defineTask('qc-simulation-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Simulation Validation',
  agent: {
    name: 'quantum-circuit-architect',
    skills: ['qiskit-circuit-builder', 'cirq-circuit-builder', 'circuit-optimizer', 'tket-compiler', 'pyzx-simplifier', 'qubit-mapper'],
    prompt: {
      role: 'Quantum Verification Specialist',
      task: 'Validate circuit correctness through simulation',
      context: args,
      instructions: [
        '1. Simulate original circuit with statevector simulator',
        '2. Simulate optimized circuit',
        '3. Simulate transpiled circuit',
        '4. Compare output state fidelities',
        '5. Verify expected output states',
        '6. Check measurement probability distributions',
        '7. Identify any discrepancies',
        '8. Run noise simulation if applicable',
        '9. Document validation results',
        '10. Provide pass/fail assessment'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['validated', 'fidelityCheck', 'correctnessCheck'],
      properties: {
        validated: { type: 'boolean' },
        fidelityCheck: { type: 'number' },
        correctnessCheck: { type: 'boolean' },
        originalResults: { type: 'object' },
        optimizedResults: { type: 'object' },
        transpiledResults: { type: 'object' },
        issues: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'validation', 'simulation']
}));

export const circuitDocumentationTask = defineTask('qc-circuit-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Circuit Documentation',
  agent: {
    name: 'quantum-circuit-architect',
    skills: ['qiskit-circuit-builder', 'cirq-circuit-builder', 'circuit-optimizer', 'tket-compiler', 'pyzx-simplifier', 'qubit-mapper'],
    prompt: {
      role: 'Technical Documentation Specialist',
      task: 'Create comprehensive documentation for the quantum circuit',
      context: args,
      instructions: [
        '1. Document problem statement and approach',
        '2. Create circuit diagrams and visualizations',
        '3. Document qubit allocation and purpose',
        '4. Explain gate sequences and their functions',
        '5. Document optimization techniques used',
        '6. Provide resource estimates',
        '7. Include usage examples',
        '8. Document hardware compatibility',
        '9. Create API documentation if applicable',
        '10. Generate summary report'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['documentation', 'reportPath'],
      properties: {
        documentation: { type: 'string' },
        reportPath: { type: 'string' },
        diagrams: { type: 'array' },
        examples: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'documentation', 'reporting']
}));
