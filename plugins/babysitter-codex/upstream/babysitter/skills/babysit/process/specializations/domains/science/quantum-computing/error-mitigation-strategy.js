/**
 * @process Error Mitigation Strategy Implementation
 * @id QC-ERR-001
 * @description Implement and configure error mitigation techniques for NISQ devices including
 * zero-noise extrapolation (ZNE), probabilistic error cancellation (PEC), measurement error
 * mitigation, and dynamical decoupling.
 * @category Quantum Computing - Error Management
 * @priority P0 - Critical
 * @inputs {{ circuit: object, hardware: string, targetFidelity?: number }}
 * @outputs {{ success: boolean, mitigatedResults: object, fidelityImprovement: number, artifacts: array }}
 *
 * @example
 * const result = await orchestrate('error-mitigation-strategy', {
 *   circuit: vqeCircuit,
 *   hardware: 'ibm_brisbane',
 *   targetFidelity: 0.95
 * });
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    circuit,
    hardware,
    targetFidelity = 0.90,
    techniques = ['ZNE', 'measurement_error', 'dynamical_decoupling'],
    zneScaleFactors = [1, 2, 3],
    ddSequence = 'XY4',
    shots = 8192,
    framework = 'qiskit',
    outputDir = 'error-mitigation-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Error Mitigation Strategy for ${hardware}`);
  ctx.log('info', `Techniques: ${techniques.join(', ')}, Target fidelity: ${targetFidelity}`);

  // ============================================================================
  // PHASE 1: NOISE CHARACTERIZATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Hardware Noise Characterization');

  const noiseResult = await ctx.task(noiseCharacterizationTask, {
    hardware,
    framework
  });

  artifacts.push(...(noiseResult.artifacts || []));

  await ctx.breakpoint({
    question: `Noise characterization complete. Average gate error: ${noiseResult.averageGateError}, Average T1: ${noiseResult.averageT1}us. Proceed with mitigation strategy selection?`,
    title: 'Noise Characterization Review',
    context: {
      runId: ctx.runId,
      noiseProfile: noiseResult,
      files: (noiseResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 2: MITIGATION STRATEGY SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 2: Mitigation Strategy Selection');

  const strategyResult = await ctx.task(mitigationStrategySelectionTask, {
    circuit,
    noiseProfile: noiseResult,
    techniques,
    targetFidelity
  });

  artifacts.push(...(strategyResult.artifacts || []));

  ctx.log('info', `Selected strategies: ${strategyResult.selectedTechniques.join(', ')}`);

  // ============================================================================
  // PHASE 3: MEASUREMENT ERROR MITIGATION
  // ============================================================================

  let measurementMitigationResult = null;
  if (techniques.includes('measurement_error')) {
    ctx.log('info', 'Phase 3: Measurement Error Mitigation');

    measurementMitigationResult = await ctx.task(measurementErrorMitigationTask, {
      circuit,
      hardware,
      shots,
      framework
    });

    artifacts.push(...(measurementMitigationResult.artifacts || []));

    ctx.log('info', `Measurement calibration complete. Readout fidelity: ${measurementMitigationResult.readoutFidelity}`);
  }

  // ============================================================================
  // PHASE 4: DYNAMICAL DECOUPLING
  // ============================================================================

  let ddResult = null;
  if (techniques.includes('dynamical_decoupling')) {
    ctx.log('info', 'Phase 4: Dynamical Decoupling Implementation');

    ddResult = await ctx.task(dynamicalDecouplingTask, {
      circuit,
      ddSequence,
      noiseProfile: noiseResult,
      framework
    });

    artifacts.push(...(ddResult.artifacts || []));

    ctx.log('info', `Dynamical decoupling applied with ${ddSequence} sequence`);
  }

  // ============================================================================
  // PHASE 5: ZERO-NOISE EXTRAPOLATION (ZNE)
  // ============================================================================

  let zneResult = null;
  if (techniques.includes('ZNE')) {
    ctx.log('info', 'Phase 5: Zero-Noise Extrapolation');

    zneResult = await ctx.task(zeroNoiseExtrapolationTask, {
      circuit: ddResult?.modifiedCircuit || circuit,
      hardware,
      scaleFactors: zneScaleFactors,
      shots,
      framework
    });

    artifacts.push(...(zneResult.artifacts || []));

    await ctx.breakpoint({
      question: `ZNE complete. Extrapolated value: ${zneResult.extrapolatedValue}, Noise amplification successful for factors: ${zneResult.successfulFactors.join(', ')}. Review extrapolation?`,
      title: 'ZNE Results Review',
      context: {
        runId: ctx.runId,
        zneResults: zneResult,
        files: (zneResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 6: PROBABILISTIC ERROR CANCELLATION (if selected)
  // ============================================================================

  let pecResult = null;
  if (techniques.includes('PEC')) {
    ctx.log('info', 'Phase 6: Probabilistic Error Cancellation');

    pecResult = await ctx.task(probabilisticErrorCancellationTask, {
      circuit: ddResult?.modifiedCircuit || circuit,
      noiseProfile: noiseResult,
      hardware,
      shots,
      framework
    });

    artifacts.push(...(pecResult.artifacts || []));

    ctx.log('info', `PEC complete. Sampling overhead: ${pecResult.samplingOverhead}x`);
  }

  // ============================================================================
  // PHASE 7: MITIGATION VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Mitigation Validation');

  const validationResult = await ctx.task(mitigationValidationTask, {
    circuit,
    hardware,
    unmitgatedResults: noiseResult.baselineResults,
    measurementMitigation: measurementMitigationResult,
    ddResults: ddResult,
    zneResults: zneResult,
    pecResults: pecResult,
    targetFidelity,
    shots,
    framework
  });

  artifacts.push(...(validationResult.artifacts || []));

  if (validationResult.achievedFidelity < targetFidelity) {
    await ctx.breakpoint({
      question: `Target fidelity not achieved. Achieved: ${validationResult.achievedFidelity}, Target: ${targetFidelity}. Consider additional techniques or accept current results?`,
      title: 'Fidelity Warning',
      context: {
        runId: ctx.runId,
        validation: validationResult,
        files: (validationResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 8: DOCUMENTATION AND REPORTING
  // ============================================================================

  ctx.log('info', 'Phase 8: Documentation and Reporting');

  const reportResult = await ctx.task(mitigationReportTask, {
    hardware,
    techniques,
    noiseResult,
    strategyResult,
    measurementMitigationResult,
    ddResult,
    zneResult,
    pecResult,
    validationResult,
    outputDir
  });

  artifacts.push(...(reportResult.artifacts || []));

  await ctx.breakpoint({
    question: `Error mitigation complete. Fidelity improvement: ${validationResult.fidelityImprovement}x, Achieved fidelity: ${validationResult.achievedFidelity}. Approve results?`,
    title: 'Error Mitigation Complete',
    context: {
      runId: ctx.runId,
      summary: {
        techniques: strategyResult.selectedTechniques,
        fidelityImprovement: validationResult.fidelityImprovement,
        achievedFidelity: validationResult.achievedFidelity
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    hardware,
    mitigatedResults: {
      measurementMitigation: measurementMitigationResult?.mitigatedCounts || null,
      zneValue: zneResult?.extrapolatedValue || null,
      pecValue: pecResult?.correctedValue || null,
      finalValue: validationResult.bestMitigatedValue
    },
    fidelityImprovement: validationResult.fidelityImprovement,
    achievedFidelity: validationResult.achievedFidelity,
    techniquesApplied: strategyResult.selectedTechniques,
    overhead: {
      circuitOverhead: ddResult?.circuitOverhead || 1.0,
      samplingOverhead: pecResult?.samplingOverhead || zneResult?.samplingOverhead || 1.0,
      totalOverhead: validationResult.totalOverhead
    },
    noiseProfile: noiseResult,
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'QC-ERR-001',
      processName: 'Error Mitigation Strategy Implementation',
      category: 'quantum-computing',
      timestamp: startTime,
      framework
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const noiseCharacterizationTask = defineTask('qc-noise-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Hardware Noise Characterization',
  agent: {
    name: 'error-mitigation-engineer',
    skills: ['mitiq-error-mitigator', 'noise-modeler', 'rb-benchmarker', 'calibration-analyzer'],
    prompt: {
      role: 'Quantum Hardware Characterization Specialist',
      task: 'Characterize noise properties of the target quantum hardware',
      context: args,
      instructions: [
        '1. Retrieve hardware calibration data',
        '2. Measure single-qubit gate errors',
        '3. Measure two-qubit gate errors',
        '4. Characterize T1 (energy relaxation) times',
        '5. Characterize T2 (dephasing) times',
        '6. Measure readout error rates',
        '7. Identify crosstalk patterns',
        '8. Build noise model from characterization',
        '9. Identify best and worst qubits',
        '10. Document noise profile'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['averageGateError', 'averageT1', 'noiseModel'],
      properties: {
        averageGateError: { type: 'number' },
        averageT1: { type: 'number' },
        averageT2: { type: 'number' },
        readoutErrors: { type: 'object' },
        gateErrors: { type: 'object' },
        crosstalkMap: { type: 'object' },
        noiseModel: { type: 'object' },
        baselineResults: { type: 'object' },
        qubitRankings: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'error-mitigation', 'characterization']
}));

export const mitigationStrategySelectionTask = defineTask('qc-mitigation-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Mitigation Strategy Selection',
  agent: {
    name: 'error-mitigation-engineer',
    skills: ['mitiq-error-mitigator', 'noise-modeler', 'rb-benchmarker', 'calibration-analyzer'],
    prompt: {
      role: 'Error Mitigation Strategy Specialist',
      task: 'Select optimal error mitigation techniques for the given circuit and noise profile',
      context: args,
      instructions: [
        '1. Analyze circuit structure and depth',
        '2. Match noise types to mitigation techniques',
        '3. Evaluate technique compatibility',
        '4. Consider overhead constraints',
        '5. Prioritize by expected improvement',
        '6. Check hardware support for techniques',
        '7. Plan technique combination strategy',
        '8. Estimate expected fidelity improvement',
        '9. Document selection rationale',
        '10. Create implementation plan'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedTechniques', 'implementationPlan'],
      properties: {
        selectedTechniques: { type: 'array', items: { type: 'string' } },
        implementationPlan: { type: 'object' },
        expectedImprovement: { type: 'number' },
        overheadEstimate: { type: 'number' },
        rationale: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'error-mitigation', 'strategy']
}));

export const measurementErrorMitigationTask = defineTask('qc-measurement-mitigation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Measurement Error Mitigation',
  agent: {
    name: 'error-mitigation-engineer',
    skills: ['mitiq-error-mitigator', 'noise-modeler', 'rb-benchmarker', 'calibration-analyzer'],
    prompt: {
      role: 'Measurement Error Correction Specialist',
      task: 'Implement measurement error mitigation calibration and correction',
      context: args,
      instructions: [
        '1. Run calibration circuits for all qubits',
        '2. Build confusion matrix',
        '3. Compute inverse calibration matrix',
        '4. Handle matrix ill-conditioning',
        '5. Apply tensored or full mitigation',
        '6. Run circuit with calibrated measurements',
        '7. Apply error correction to raw counts',
        '8. Validate corrected results',
        '9. Calculate readout fidelity improvement',
        '10. Document calibration procedure'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['calibrationMatrix', 'readoutFidelity', 'mitigatedCounts'],
      properties: {
        calibrationMatrix: { type: 'object' },
        readoutFidelity: { type: 'number' },
        mitigatedCounts: { type: 'object' },
        rawCounts: { type: 'object' },
        fidelityImprovement: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'error-mitigation', 'measurement']
}));

export const dynamicalDecouplingTask = defineTask('qc-dynamical-decoupling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Dynamical Decoupling Implementation',
  agent: {
    name: 'error-mitigation-engineer',
    skills: ['mitiq-error-mitigator', 'noise-modeler', 'rb-benchmarker', 'calibration-analyzer'],
    prompt: {
      role: 'Dynamical Decoupling Specialist',
      task: 'Implement dynamical decoupling sequences to suppress decoherence',
      context: args,
      instructions: [
        '1. Identify idle periods in the circuit',
        '2. Select DD sequence (XY4, CPMG, Uhrig)',
        '3. Calculate optimal pulse spacing',
        '4. Insert DD pulses during idle times',
        '5. Ensure pulse timing constraints',
        '6. Verify sequence symmetry',
        '7. Calculate circuit overhead',
        '8. Simulate DD effectiveness',
        '9. Generate modified circuit',
        '10. Document DD implementation'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['modifiedCircuit', 'ddSequence', 'circuitOverhead'],
      properties: {
        modifiedCircuit: { type: 'object' },
        ddSequence: { type: 'string' },
        pulsesInserted: { type: 'number' },
        circuitOverhead: { type: 'number' },
        expectedImprovement: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'error-mitigation', 'dynamical-decoupling']
}));

export const zeroNoiseExtrapolationTask = defineTask('qc-zne', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Zero-Noise Extrapolation',
  agent: {
    name: 'error-mitigation-engineer',
    skills: ['mitiq-error-mitigator', 'noise-modeler', 'rb-benchmarker', 'calibration-analyzer'],
    prompt: {
      role: 'Zero-Noise Extrapolation Specialist',
      task: 'Implement ZNE to extrapolate to zero-noise limit',
      context: args,
      instructions: [
        '1. Select noise scaling method (pulse stretching, unitary folding)',
        '2. Generate noise-scaled circuits for each factor',
        '3. Execute all scaled circuits on hardware',
        '4. Collect expectation values at each noise level',
        '5. Fit extrapolation model (linear, polynomial, exponential)',
        '6. Extrapolate to zero-noise limit',
        '7. Estimate extrapolation uncertainty',
        '8. Validate extrapolation quality',
        '9. Calculate sampling overhead',
        '10. Document ZNE procedure'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['extrapolatedValue', 'successfulFactors'],
      properties: {
        extrapolatedValue: { type: 'number' },
        successfulFactors: { type: 'array', items: { type: 'number' } },
        scaledValues: { type: 'object' },
        extrapolationModel: { type: 'string' },
        extrapolationUncertainty: { type: 'number' },
        samplingOverhead: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'error-mitigation', 'zne']
}));

export const probabilisticErrorCancellationTask = defineTask('qc-pec', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Probabilistic Error Cancellation',
  agent: {
    name: 'error-mitigation-engineer',
    skills: ['mitiq-error-mitigator', 'noise-modeler', 'rb-benchmarker', 'calibration-analyzer'],
    prompt: {
      role: 'Probabilistic Error Cancellation Specialist',
      task: 'Implement PEC for exact error cancellation',
      context: args,
      instructions: [
        '1. Construct quasi-probability representation of ideal gates',
        '2. Calculate one-norm (sampling overhead)',
        '3. Sample from quasi-probability distribution',
        '4. Execute sampled circuits',
        '5. Weight results by quasi-probabilities',
        '6. Aggregate weighted results',
        '7. Estimate statistical error',
        '8. Optimize sampling strategy',
        '9. Document PEC implementation',
        '10. Report overhead and accuracy'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['correctedValue', 'samplingOverhead'],
      properties: {
        correctedValue: { type: 'number' },
        samplingOverhead: { type: 'number' },
        quasiProbabilities: { type: 'object' },
        sampledCircuits: { type: 'number' },
        statisticalError: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'error-mitigation', 'pec']
}));

export const mitigationValidationTask = defineTask('qc-mitigation-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Mitigation Validation',
  agent: {
    name: 'error-mitigation-engineer',
    skills: ['mitiq-error-mitigator', 'noise-modeler', 'rb-benchmarker', 'calibration-analyzer'],
    prompt: {
      role: 'Error Mitigation Validation Specialist',
      task: 'Validate effectiveness of error mitigation techniques',
      context: args,
      instructions: [
        '1. Compare unmitigated vs mitigated results',
        '2. Calculate fidelity improvement',
        '3. Verify result consistency',
        '4. Check for over-mitigation artifacts',
        '5. Compare with ideal simulation',
        '6. Calculate total overhead',
        '7. Determine best mitigation combination',
        '8. Assess target fidelity achievement',
        '9. Generate validation metrics',
        '10. Document validation results'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['achievedFidelity', 'fidelityImprovement', 'bestMitigatedValue'],
      properties: {
        achievedFidelity: { type: 'number' },
        fidelityImprovement: { type: 'number' },
        bestMitigatedValue: { type: 'number' },
        bestTechnique: { type: 'string' },
        totalOverhead: { type: 'number' },
        validationMetrics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'error-mitigation', 'validation']
}));

export const mitigationReportTask = defineTask('qc-mitigation-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Mitigation Report Generation',
  agent: {
    name: 'error-mitigation-engineer',
    skills: ['mitiq-error-mitigator', 'noise-modeler', 'rb-benchmarker', 'calibration-analyzer'],
    prompt: {
      role: 'Technical Documentation Specialist',
      task: 'Generate comprehensive error mitigation report',
      context: args,
      instructions: [
        '1. Summarize noise characterization',
        '2. Document techniques applied',
        '3. Present before/after comparisons',
        '4. Include overhead analysis',
        '5. Provide fidelity improvement metrics',
        '6. Include visualizations',
        '7. Document best practices',
        '8. Provide recommendations',
        '9. Archive all data',
        '10. Generate final report'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath'],
      properties: {
        reportPath: { type: 'string' },
        summary: { type: 'string' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'error-mitigation', 'reporting']
}));
