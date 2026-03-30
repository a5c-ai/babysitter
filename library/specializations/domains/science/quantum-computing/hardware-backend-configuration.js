/**
 * @process Hardware Backend Configuration
 * @id QC-HW-001
 * @description Configure and optimize quantum circuits for specific hardware backends including
 * qubit mapping, routing, and native gate transpilation.
 * @category Quantum Computing - Hardware Integration
 * @priority P1 - High
 * @inputs {{ circuit: object, backend: string, optimizationLevel?: number }}
 * @outputs {{ success: boolean, transpiledCircuit: object, mappingResults: object, artifacts: array }}
 *
 * @example
 * const result = await orchestrate('hardware-backend-configuration', {
 *   circuit: groverCircuit,
 *   backend: 'ibm_brisbane',
 *   optimizationLevel: 3
 * });
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    circuit,
    backend,
    optimizationLevel = 2,
    layoutMethod = 'sabre', // 'trivial', 'dense', 'sabre', 'noise_adaptive'
    routingMethod = 'sabre', // 'basic', 'stochastic', 'sabre'
    schedulingMethod = 'alap', // 'asap', 'alap'
    enableDynamicalDecoupling = false,
    framework = 'qiskit',
    outputDir = 'hardware-config-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Hardware Backend Configuration for ${backend}`);
  ctx.log('info', `Optimization level: ${optimizationLevel}, Layout: ${layoutMethod}, Routing: ${routingMethod}`);

  // ============================================================================
  // PHASE 1: BACKEND ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Backend Analysis');

  const backendAnalysisResult = await ctx.task(backendAnalysisTask, {
    backend,
    framework
  });

  artifacts.push(...(backendAnalysisResult.artifacts || []));

  await ctx.breakpoint({
    question: `Backend analyzed. Qubits: ${backendAnalysisResult.qubitCount}, Connectivity: ${backendAnalysisResult.connectivityType}, Native gates: ${backendAnalysisResult.nativeGates.join(', ')}. Proceed with qubit mapping?`,
    title: 'Backend Analysis Review',
    context: {
      runId: ctx.runId,
      backend: backendAnalysisResult,
      files: (backendAnalysisResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 2: QUBIT MAPPING STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 2: Qubit Mapping Strategy');

  const mappingResult = await ctx.task(qubitMappingStrategyTask, {
    circuit,
    backendInfo: backendAnalysisResult,
    layoutMethod,
    framework
  });

  artifacts.push(...(mappingResult.artifacts || []));

  ctx.log('info', `Qubit mapping complete. Initial layout: ${JSON.stringify(mappingResult.initialLayout)}`);

  // ============================================================================
  // PHASE 3: ROUTING AND SWAP INSERTION
  // ============================================================================

  ctx.log('info', 'Phase 3: Routing and SWAP Insertion');

  const routingResult = await ctx.task(routingSwapInsertionTask, {
    circuit,
    mapping: mappingResult,
    backendInfo: backendAnalysisResult,
    routingMethod,
    framework
  });

  artifacts.push(...(routingResult.artifacts || []));

  await ctx.breakpoint({
    question: `Routing complete. SWAPs inserted: ${routingResult.swapCount}, Depth increase: ${routingResult.depthIncrease}. Review routing decisions?`,
    title: 'Routing Review',
    context: {
      runId: ctx.runId,
      routing: routingResult,
      files: (routingResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 4: NATIVE GATE TRANSPILATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Native Gate Transpilation');

  const transpilationResult = await ctx.task(nativeGateTranspilationTask, {
    circuit: routingResult.routedCircuit,
    nativeGates: backendAnalysisResult.nativeGates,
    optimizationLevel,
    framework
  });

  artifacts.push(...(transpilationResult.artifacts || []));

  ctx.log('info', `Transpilation complete. Gate count: ${transpilationResult.gateCount}, Depth: ${transpilationResult.circuitDepth}`);

  // ============================================================================
  // PHASE 5: SCHEDULING OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Scheduling Optimization');

  const schedulingResult = await ctx.task(schedulingOptimizationTask, {
    circuit: transpilationResult.transpiledCircuit,
    backendInfo: backendAnalysisResult,
    schedulingMethod,
    framework
  });

  artifacts.push(...(schedulingResult.artifacts || []));

  // ============================================================================
  // PHASE 6: DYNAMICAL DECOUPLING (Optional)
  // ============================================================================

  let ddResult = null;
  if (enableDynamicalDecoupling) {
    ctx.log('info', 'Phase 6: Dynamical Decoupling');

    ddResult = await ctx.task(dynamicalDecouplingConfigTask, {
      circuit: schedulingResult.scheduledCircuit,
      backendInfo: backendAnalysisResult,
      framework
    });

    artifacts.push(...(ddResult.artifacts || []));
  }

  // ============================================================================
  // PHASE 7: NOISE-AWARE OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Noise-Aware Optimization');

  const noiseOptResult = await ctx.task(noiseAwareOptimizationTask, {
    circuit: ddResult?.ddCircuit || schedulingResult.scheduledCircuit,
    backendInfo: backendAnalysisResult,
    mapping: mappingResult,
    framework
  });

  artifacts.push(...(noiseOptResult.artifacts || []));

  // ============================================================================
  // PHASE 8: VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Validation');

  const validationResult = await ctx.task(hardwareConfigValidationTask, {
    originalCircuit: circuit,
    configuredCircuit: noiseOptResult.optimizedCircuit,
    backend,
    backendInfo: backendAnalysisResult,
    framework
  });

  artifacts.push(...(validationResult.artifacts || []));

  await ctx.breakpoint({
    question: `Validation complete. Fidelity estimate: ${validationResult.fidelityEstimate}, Constraints satisfied: ${validationResult.constraintsSatisfied}. Review validation?`,
    title: 'Validation Review',
    context: {
      runId: ctx.runId,
      validation: validationResult,
      files: (validationResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 9: CONFIGURATION PROFILE GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Configuration Profile Generation');

  const profileResult = await ctx.task(configurationProfileGenerationTask, {
    backend,
    backendInfo: backendAnalysisResult,
    mapping: mappingResult,
    routing: routingResult,
    transpilation: transpilationResult,
    scheduling: schedulingResult,
    noiseOptimization: noiseOptResult,
    validation: validationResult,
    outputDir
  });

  artifacts.push(...(profileResult.artifacts || []));

  await ctx.breakpoint({
    question: `Hardware configuration complete for ${backend}. Final depth: ${noiseOptResult.finalDepth}, Estimated fidelity: ${validationResult.fidelityEstimate}. Approve configuration?`,
    title: 'Hardware Configuration Complete',
    context: {
      runId: ctx.runId,
      summary: {
        backend,
        finalDepth: noiseOptResult.finalDepth,
        gateCount: transpilationResult.gateCount,
        swapsInserted: routingResult.swapCount,
        fidelityEstimate: validationResult.fidelityEstimate
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    backend,
    transpiledCircuit: noiseOptResult.optimizedCircuit,
    mappingResults: {
      initialLayout: mappingResult.initialLayout,
      finalLayout: routingResult.finalLayout,
      swapsInserted: routingResult.swapCount,
      layoutMethod,
      routingMethod
    },
    circuitMetrics: {
      originalDepth: circuit.depth || 'unknown',
      finalDepth: noiseOptResult.finalDepth,
      gateCount: transpilationResult.gateCount,
      nativeGateBreakdown: transpilationResult.gateBreakdown
    },
    optimization: {
      level: optimizationLevel,
      schedulingMethod,
      dynamicalDecoupling: enableDynamicalDecoupling,
      noiseAwareOptimization: true
    },
    validation: {
      fidelityEstimate: validationResult.fidelityEstimate,
      constraintsSatisfied: validationResult.constraintsSatisfied,
      warnings: validationResult.warnings
    },
    configurationProfile: profileResult.profile,
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'QC-HW-001',
      processName: 'Hardware Backend Configuration',
      category: 'quantum-computing',
      timestamp: startTime,
      framework
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const backendAnalysisTask = defineTask('hw-backend-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Backend Analysis',
  agent: {
    name: 'hardware-integrator',
    skills: ['qubit-mapper', 'calibration-analyzer', 'circuit-optimizer', 'qiskit-circuit-builder'],
    prompt: {
      role: 'Quantum Hardware Specialist',
      task: 'Analyze quantum backend properties',
      context: args,
      instructions: [
        '1. Retrieve backend configuration',
        '2. Analyze qubit count and connectivity',
        '3. Identify native gate set',
        '4. Get calibration data',
        '5. Analyze coherence times',
        '6. Get gate error rates',
        '7. Identify readout errors',
        '8. Analyze timing constraints',
        '9. Create connectivity graph',
        '10. Document backend properties'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['qubitCount', 'connectivityType', 'nativeGates'],
      properties: {
        qubitCount: { type: 'number' },
        connectivityType: { type: 'string' },
        nativeGates: { type: 'array', items: { type: 'string' } },
        connectivityMap: { type: 'object' },
        calibrationData: { type: 'object' },
        timingConstraints: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'hardware', 'analysis']
}));

export const qubitMappingStrategyTask = defineTask('hw-qubit-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Qubit Mapping Strategy',
  agent: {
    name: 'hardware-integrator',
    skills: ['qubit-mapper', 'calibration-analyzer', 'circuit-optimizer', 'qiskit-circuit-builder'],
    prompt: {
      role: 'Qubit Mapping Specialist',
      task: 'Determine optimal qubit mapping for circuit',
      context: args,
      instructions: [
        '1. Analyze circuit qubit requirements',
        '2. Analyze circuit connectivity needs',
        '3. Apply layout method',
        '4. Consider qubit quality',
        '5. Minimize expected SWAP count',
        '6. Consider noise characteristics',
        '7. Generate initial layout',
        '8. Validate layout feasibility',
        '9. Document mapping decisions',
        '10. Generate mapping visualization'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['initialLayout', 'mappingScore'],
      properties: {
        initialLayout: { type: 'object' },
        mappingScore: { type: 'number' },
        qubitAssignments: { type: 'object' },
        layoutMethod: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'hardware', 'mapping']
}));

export const routingSwapInsertionTask = defineTask('hw-routing-swap', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Routing and SWAP Insertion',
  agent: {
    name: 'hardware-integrator',
    skills: ['qubit-mapper', 'calibration-analyzer', 'circuit-optimizer', 'qiskit-circuit-builder'],
    prompt: {
      role: 'Circuit Routing Specialist',
      task: 'Route circuit and insert SWAPs for connectivity',
      context: args,
      instructions: [
        '1. Analyze two-qubit gate requirements',
        '2. Apply routing algorithm',
        '3. Insert SWAP gates as needed',
        '4. Minimize SWAP count',
        '5. Track qubit permutations',
        '6. Optimize SWAP placement',
        '7. Calculate depth increase',
        '8. Generate routed circuit',
        '9. Verify connectivity constraints',
        '10. Document routing decisions'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['routedCircuit', 'swapCount', 'finalLayout'],
      properties: {
        routedCircuit: { type: 'object' },
        swapCount: { type: 'number' },
        depthIncrease: { type: 'number' },
        finalLayout: { type: 'object' },
        routingDecisions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'hardware', 'routing']
}));

export const nativeGateTranspilationTask = defineTask('hw-native-transpilation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Native Gate Transpilation',
  agent: {
    name: 'hardware-integrator',
    skills: ['qubit-mapper', 'calibration-analyzer', 'circuit-optimizer', 'qiskit-circuit-builder'],
    prompt: {
      role: 'Gate Transpilation Specialist',
      task: 'Transpile circuit to native hardware gates',
      context: args,
      instructions: [
        '1. Decompose to native gate set',
        '2. Apply gate synthesis',
        '3. Optimize single-qubit chains',
        '4. Decompose multi-qubit gates',
        '5. Apply optimization passes',
        '6. Calculate final gate count',
        '7. Calculate circuit depth',
        '8. Verify gate set compliance',
        '9. Generate gate statistics',
        '10. Document transpilation'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['transpiledCircuit', 'gateCount', 'circuitDepth'],
      properties: {
        transpiledCircuit: { type: 'object' },
        gateCount: { type: 'number' },
        circuitDepth: { type: 'number' },
        gateBreakdown: { type: 'object' },
        optimizationPasses: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'hardware', 'transpilation']
}));

export const schedulingOptimizationTask = defineTask('hw-scheduling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Scheduling Optimization',
  agent: {
    name: 'hardware-integrator',
    skills: ['qubit-mapper', 'calibration-analyzer', 'circuit-optimizer', 'qiskit-circuit-builder'],
    prompt: {
      role: 'Circuit Scheduling Specialist',
      task: 'Optimize circuit scheduling for hardware timing',
      context: args,
      instructions: [
        '1. Apply scheduling method',
        '2. Respect timing constraints',
        '3. Align gate boundaries',
        '4. Insert delays as needed',
        '5. Optimize idle times',
        '6. Consider coherence limits',
        '7. Generate scheduled circuit',
        '8. Calculate total duration',
        '9. Verify timing compliance',
        '10. Document scheduling'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['scheduledCircuit', 'totalDuration'],
      properties: {
        scheduledCircuit: { type: 'object' },
        totalDuration: { type: 'number' },
        schedulingMethod: { type: 'string' },
        idleTimes: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'hardware', 'scheduling']
}));

export const dynamicalDecouplingConfigTask = defineTask('hw-dd-config', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Dynamical Decoupling Configuration',
  agent: {
    name: 'hardware-integrator',
    skills: ['qubit-mapper', 'calibration-analyzer', 'circuit-optimizer', 'qiskit-circuit-builder'],
    prompt: {
      role: 'Dynamical Decoupling Specialist',
      task: 'Configure dynamical decoupling for decoherence suppression',
      context: args,
      instructions: [
        '1. Identify idle periods',
        '2. Select DD sequence',
        '3. Calculate pulse spacing',
        '4. Insert DD pulses',
        '5. Verify timing constraints',
        '6. Optimize pulse placement',
        '7. Generate DD circuit',
        '8. Calculate overhead',
        '9. Verify sequence validity',
        '10. Document DD configuration'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['ddCircuit', 'ddSequence'],
      properties: {
        ddCircuit: { type: 'object' },
        ddSequence: { type: 'string' },
        pulsesInserted: { type: 'number' },
        overhead: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'hardware', 'dd']
}));

export const noiseAwareOptimizationTask = defineTask('hw-noise-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Noise-Aware Optimization',
  agent: {
    name: 'hardware-integrator',
    skills: ['qubit-mapper', 'calibration-analyzer', 'circuit-optimizer', 'qiskit-circuit-builder'],
    prompt: {
      role: 'Noise-Aware Optimization Specialist',
      task: 'Apply noise-aware optimizations',
      context: args,
      instructions: [
        '1. Analyze noise profile',
        '2. Identify high-error gates',
        '3. Remap to better qubits',
        '4. Apply noise-aware transpilation',
        '5. Minimize noisy operations',
        '6. Optimize for fidelity',
        '7. Generate optimized circuit',
        '8. Calculate final depth',
        '9. Estimate fidelity improvement',
        '10. Document optimizations'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizedCircuit', 'finalDepth'],
      properties: {
        optimizedCircuit: { type: 'object' },
        finalDepth: { type: 'number' },
        fidelityImprovement: { type: 'number' },
        optimizationsApplied: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'hardware', 'noise-aware']
}));

export const hardwareConfigValidationTask = defineTask('hw-config-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Hardware Configuration Validation',
  agent: {
    name: 'hardware-integrator',
    skills: ['qubit-mapper', 'calibration-analyzer', 'circuit-optimizer', 'qiskit-circuit-builder'],
    prompt: {
      role: 'Validation Specialist',
      task: 'Validate hardware configuration',
      context: args,
      instructions: [
        '1. Verify gate set compliance',
        '2. Check connectivity constraints',
        '3. Validate timing constraints',
        '4. Estimate expected fidelity',
        '5. Compare with original circuit',
        '6. Check functional equivalence',
        '7. Identify potential issues',
        '8. Generate warnings',
        '9. Validate for execution',
        '10. Document validation results'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['fidelityEstimate', 'constraintsSatisfied'],
      properties: {
        fidelityEstimate: { type: 'number' },
        constraintsSatisfied: { type: 'boolean' },
        functionallyEquivalent: { type: 'boolean' },
        warnings: { type: 'array' },
        validationReport: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'hardware', 'validation']
}));

export const configurationProfileGenerationTask = defineTask('hw-config-profile', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configuration Profile Generation',
  agent: {
    name: 'hardware-integrator',
    skills: ['qubit-mapper', 'calibration-analyzer', 'circuit-optimizer', 'qiskit-circuit-builder'],
    prompt: {
      role: 'Configuration Specialist',
      task: 'Generate reusable configuration profile',
      context: args,
      instructions: [
        '1. Compile all configuration settings',
        '2. Create reusable profile',
        '3. Document all parameters',
        '4. Add performance metrics',
        '5. Include optimization history',
        '6. Create profile metadata',
        '7. Generate profile file',
        '8. Add usage instructions',
        '9. Include recommendations',
        '10. Archive configuration'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['profile', 'profilePath'],
      properties: {
        profile: { type: 'object' },
        profilePath: { type: 'string' },
        metadata: { type: 'object' },
        usageInstructions: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'hardware', 'profile']
}));
