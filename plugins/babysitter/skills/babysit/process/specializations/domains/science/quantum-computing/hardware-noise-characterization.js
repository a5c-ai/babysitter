/**
 * @process Hardware Noise Characterization
 * @id QC-ERR-003
 * @description Systematically characterize quantum hardware noise including gate errors, readout
 * errors, crosstalk, and decoherence rates using randomized benchmarking and tomography techniques.
 * @category Quantum Computing - Error Management
 * @priority P1 - High
 * @inputs {{ hardware: string, qubits?: array, characterizationDepth?: string }}
 * @outputs {{ success: boolean, noiseModel: object, qubitMetrics: object, recommendations: array, artifacts: array }}
 *
 * @example
 * const result = await orchestrate('hardware-noise-characterization', {
 *   hardware: 'ibm_brisbane',
 *   qubits: [0, 1, 2, 3, 4],
 *   characterizationDepth: 'full'
 * });
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    hardware,
    qubits = 'all',
    characterizationDepth = 'standard', // 'basic', 'standard', 'full'
    includeRB = true,
    includeGST = false,
    includeTomography = false,
    shots = 4096,
    framework = 'qiskit',
    outputDir = 'noise-characterization-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Hardware Noise Characterization for ${hardware}`);
  ctx.log('info', `Depth: ${characterizationDepth}, Qubits: ${qubits}`);

  // ============================================================================
  // PHASE 1: HARDWARE CALIBRATION DATA RETRIEVAL
  // ============================================================================

  ctx.log('info', 'Phase 1: Hardware Calibration Data Retrieval');

  const calibrationResult = await ctx.task(calibrationDataRetrievalTask, {
    hardware,
    qubits,
    framework
  });

  artifacts.push(...(calibrationResult.artifacts || []));

  await ctx.breakpoint({
    question: `Calibration data retrieved. Total qubits: ${calibrationResult.totalQubits}, Last calibration: ${calibrationResult.lastCalibration}. Proceed with coherence measurements?`,
    title: 'Calibration Data Review',
    context: {
      runId: ctx.runId,
      calibration: calibrationResult,
      files: (calibrationResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 2: COHERENCE TIME MEASUREMENTS (T1, T2)
  // ============================================================================

  ctx.log('info', 'Phase 2: Coherence Time Measurements');

  const coherenceResult = await ctx.task(coherenceMeasurementTask, {
    hardware,
    qubits: calibrationResult.availableQubits,
    shots,
    framework
  });

  artifacts.push(...(coherenceResult.artifacts || []));

  ctx.log('info', `T1 measured: avg=${coherenceResult.averageT1}us, T2 measured: avg=${coherenceResult.averageT2}us`);

  // ============================================================================
  // PHASE 3: RANDOMIZED BENCHMARKING
  // ============================================================================

  let rbResult = null;
  if (includeRB) {
    ctx.log('info', 'Phase 3: Randomized Benchmarking');

    rbResult = await ctx.task(randomizedBenchmarkingTask, {
      hardware,
      qubits: calibrationResult.availableQubits,
      shots,
      framework
    });

    artifacts.push(...(rbResult.artifacts || []));

    await ctx.breakpoint({
      question: `Randomized benchmarking complete. Average single-qubit error: ${rbResult.averageSingleQubitError}, Average two-qubit error: ${rbResult.averageTwoQubitError}. Review RB results?`,
      title: 'Randomized Benchmarking Review',
      context: {
        runId: ctx.runId,
        rbResults: rbResult,
        files: (rbResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 4: READOUT ERROR CHARACTERIZATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Readout Error Characterization');

  const readoutResult = await ctx.task(readoutCharacterizationTask, {
    hardware,
    qubits: calibrationResult.availableQubits,
    shots,
    framework
  });

  artifacts.push(...(readoutResult.artifacts || []));

  ctx.log('info', `Readout characterized. Average assignment error: ${readoutResult.averageAssignmentError}`);

  // ============================================================================
  // PHASE 5: CROSSTALK CHARACTERIZATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Crosstalk Characterization');

  const crosstalkResult = await ctx.task(crosstalkCharacterizationTask, {
    hardware,
    qubits: calibrationResult.availableQubits,
    connectivity: calibrationResult.connectivity,
    shots,
    framework
  });

  artifacts.push(...(crosstalkResult.artifacts || []));

  await ctx.breakpoint({
    question: `Crosstalk characterized. Significant crosstalk pairs: ${crosstalkResult.significantPairs}. Review crosstalk analysis?`,
    title: 'Crosstalk Analysis Review',
    context: {
      runId: ctx.runId,
      crosstalk: crosstalkResult,
      files: (crosstalkResult.artifacts || []).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 6: GATE SET TOMOGRAPHY (if selected)
  // ============================================================================

  let gstResult = null;
  if (includeGST && characterizationDepth === 'full') {
    ctx.log('info', 'Phase 6: Gate Set Tomography');

    gstResult = await ctx.task(gateSetTomographyTask, {
      hardware,
      qubits: calibrationResult.availableQubits.slice(0, 2), // GST is expensive, limit qubits
      shots,
      framework
    });

    artifacts.push(...(gstResult.artifacts || []));

    ctx.log('info', 'Gate set tomography complete');
  }

  // ============================================================================
  // PHASE 7: NOISE MODEL CONSTRUCTION
  // ============================================================================

  ctx.log('info', 'Phase 7: Noise Model Construction');

  const noiseModelResult = await ctx.task(noiseModelConstructionTask, {
    hardware,
    calibrationData: calibrationResult,
    coherenceData: coherenceResult,
    rbData: rbResult,
    readoutData: readoutResult,
    crosstalkData: crosstalkResult,
    gstData: gstResult,
    framework
  });

  artifacts.push(...(noiseModelResult.artifacts || []));

  // ============================================================================
  // PHASE 8: QUBIT RANKING AND RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 8: Qubit Ranking and Recommendations');

  const recommendationsResult = await ctx.task(qubitRankingRecommendationsTask, {
    hardware,
    coherenceData: coherenceResult,
    rbData: rbResult,
    readoutData: readoutResult,
    crosstalkData: crosstalkResult,
    connectivity: calibrationResult.connectivity
  });

  artifacts.push(...(recommendationsResult.artifacts || []));

  // ============================================================================
  // PHASE 9: REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Report Generation');

  const reportResult = await ctx.task(noiseCharacterizationReportTask, {
    hardware,
    calibrationResult,
    coherenceResult,
    rbResult,
    readoutResult,
    crosstalkResult,
    gstResult,
    noiseModelResult,
    recommendationsResult,
    outputDir
  });

  artifacts.push(...(reportResult.artifacts || []));

  await ctx.breakpoint({
    question: `Noise characterization complete for ${hardware}. Best qubit: ${recommendationsResult.bestQubit}, Worst qubit: ${recommendationsResult.worstQubit}. Approve results?`,
    title: 'Noise Characterization Complete',
    context: {
      runId: ctx.runId,
      summary: {
        hardware,
        totalQubits: calibrationResult.totalQubits,
        averageT1: coherenceResult.averageT1,
        averageT2: coherenceResult.averageT2,
        bestQubit: recommendationsResult.bestQubit,
        worstQubit: recommendationsResult.worstQubit
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    hardware,
    noiseModel: noiseModelResult.noiseModel,
    qubitMetrics: {
      coherence: {
        t1: coherenceResult.t1Values,
        t2: coherenceResult.t2Values,
        averageT1: coherenceResult.averageT1,
        averageT2: coherenceResult.averageT2
      },
      gateErrors: rbResult ? {
        singleQubit: rbResult.singleQubitErrors,
        twoQubit: rbResult.twoQubitErrors,
        averageSingleQubit: rbResult.averageSingleQubitError,
        averageTwoQubit: rbResult.averageTwoQubitError
      } : null,
      readoutErrors: readoutResult.readoutErrors,
      crosstalk: crosstalkResult.crosstalkMatrix
    },
    rankings: recommendationsResult.qubitRankings,
    recommendations: recommendationsResult.recommendations,
    reportPath: reportResult.reportPath,
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'QC-ERR-003',
      processName: 'Hardware Noise Characterization',
      category: 'quantum-computing',
      timestamp: startTime,
      framework
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const calibrationDataRetrievalTask = defineTask('qc-calibration-retrieval', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calibration Data Retrieval',
  agent: {
    name: 'noise-characterizer',
    skills: ['rb-benchmarker', 'noise-modeler', 'calibration-analyzer', 'stim-simulator'],
    prompt: {
      role: 'Quantum Hardware Specialist',
      task: 'Retrieve calibration data from quantum hardware backend',
      context: args,
      instructions: [
        '1. Connect to hardware backend',
        '2. Retrieve current calibration data',
        '3. Get qubit connectivity map',
        '4. Get native gate set',
        '5. Retrieve last calibration timestamp',
        '6. Identify available qubits',
        '7. Get basis gates information',
        '8. Retrieve timing constraints',
        '9. Document hardware configuration',
        '10. Validate data completeness'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['totalQubits', 'availableQubits', 'lastCalibration', 'connectivity'],
      properties: {
        totalQubits: { type: 'number' },
        availableQubits: { type: 'array', items: { type: 'number' } },
        lastCalibration: { type: 'string' },
        connectivity: { type: 'object' },
        nativeGates: { type: 'array' },
        timingConstraints: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'characterization', 'calibration']
}));

export const coherenceMeasurementTask = defineTask('qc-coherence-measurement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Coherence Time Measurement',
  agent: {
    name: 'noise-characterizer',
    skills: ['rb-benchmarker', 'noise-modeler', 'calibration-analyzer', 'stim-simulator'],
    prompt: {
      role: 'Quantum Coherence Specialist',
      task: 'Measure T1 and T2 coherence times for all qubits',
      context: args,
      instructions: [
        '1. Design T1 measurement experiments',
        '2. Design T2 (Ramsey) measurement experiments',
        '3. Design T2* (echo) measurement experiments',
        '4. Run experiments for all qubits',
        '5. Fit exponential decay curves',
        '6. Extract T1, T2, T2* values',
        '7. Calculate measurement uncertainties',
        '8. Compare with calibration data',
        '9. Identify qubits with poor coherence',
        '10. Document coherence measurements'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['t1Values', 't2Values', 'averageT1', 'averageT2'],
      properties: {
        t1Values: { type: 'object' },
        t2Values: { type: 'object' },
        t2StarValues: { type: 'object' },
        averageT1: { type: 'number' },
        averageT2: { type: 'number' },
        uncertainties: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'characterization', 'coherence']
}));

export const randomizedBenchmarkingTask = defineTask('qc-randomized-benchmarking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Randomized Benchmarking',
  agent: {
    name: 'noise-characterizer',
    skills: ['rb-benchmarker', 'noise-modeler', 'calibration-analyzer', 'stim-simulator'],
    prompt: {
      role: 'Quantum Benchmarking Specialist',
      task: 'Perform randomized benchmarking to measure gate fidelities',
      context: args,
      instructions: [
        '1. Design single-qubit RB experiments',
        '2. Design two-qubit RB experiments',
        '3. Generate random Clifford sequences',
        '4. Execute RB circuits at various depths',
        '5. Measure survival probabilities',
        '6. Fit exponential decay to extract EPC',
        '7. Calculate average gate errors',
        '8. Estimate fidelities from EPC',
        '9. Compare qubits and qubit pairs',
        '10. Document RB results'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['singleQubitErrors', 'twoQubitErrors', 'averageSingleQubitError', 'averageTwoQubitError'],
      properties: {
        singleQubitErrors: { type: 'object' },
        twoQubitErrors: { type: 'object' },
        averageSingleQubitError: { type: 'number' },
        averageTwoQubitError: { type: 'number' },
        fidelities: { type: 'object' },
        decayCurves: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'characterization', 'rb']
}));

export const readoutCharacterizationTask = defineTask('qc-readout-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Readout Error Characterization',
  agent: {
    name: 'noise-characterizer',
    skills: ['rb-benchmarker', 'noise-modeler', 'calibration-analyzer', 'stim-simulator'],
    prompt: {
      role: 'Quantum Measurement Specialist',
      task: 'Characterize readout errors for all qubits',
      context: args,
      instructions: [
        '1. Prepare |0> and measure',
        '2. Prepare |1> and measure',
        '3. Build confusion matrices',
        '4. Calculate assignment errors',
        '5. Measure readout time dependence',
        '6. Identify readout crosstalk',
        '7. Calculate readout fidelities',
        '8. Build calibration matrices',
        '9. Validate with known states',
        '10. Document readout characterization'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['readoutErrors', 'averageAssignmentError', 'confusionMatrices'],
      properties: {
        readoutErrors: { type: 'object' },
        averageAssignmentError: { type: 'number' },
        confusionMatrices: { type: 'object' },
        readoutFidelities: { type: 'object' },
        calibrationMatrices: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'characterization', 'readout']
}));

export const crosstalkCharacterizationTask = defineTask('qc-crosstalk-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Crosstalk Characterization',
  agent: {
    name: 'noise-characterizer',
    skills: ['rb-benchmarker', 'noise-modeler', 'calibration-analyzer', 'stim-simulator'],
    prompt: {
      role: 'Quantum Crosstalk Specialist',
      task: 'Characterize crosstalk between qubits',
      context: args,
      instructions: [
        '1. Design simultaneous RB experiments',
        '2. Measure conditional gate errors',
        '3. Detect ZZ coupling strengths',
        '4. Identify frequency collisions',
        '5. Map crosstalk patterns',
        '6. Quantify crosstalk magnitude',
        '7. Identify problematic qubit pairs',
        '8. Build crosstalk matrix',
        '9. Recommend mitigation strategies',
        '10. Document crosstalk analysis'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['crosstalkMatrix', 'significantPairs'],
      properties: {
        crosstalkMatrix: { type: 'object' },
        significantPairs: { type: 'number' },
        zzCouplings: { type: 'object' },
        problematicPairs: { type: 'array' },
        mitigationStrategies: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'characterization', 'crosstalk']
}));

export const gateSetTomographyTask = defineTask('qc-gate-set-tomography', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Gate Set Tomography',
  agent: {
    name: 'noise-characterizer',
    skills: ['rb-benchmarker', 'noise-modeler', 'calibration-analyzer', 'stim-simulator'],
    prompt: {
      role: 'Quantum Tomography Specialist',
      task: 'Perform gate set tomography for detailed gate characterization',
      context: args,
      instructions: [
        '1. Design GST experiment circuits',
        '2. Define gate set to characterize',
        '3. Run all GST circuits',
        '4. Perform maximum likelihood estimation',
        '5. Extract process matrices',
        '6. Calculate gate fidelities',
        '7. Identify coherent vs incoherent errors',
        '8. Extract error generators',
        '9. Compare with RB results',
        '10. Document GST results'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['processMatrices', 'gateFidelities'],
      properties: {
        processMatrices: { type: 'object' },
        gateFidelities: { type: 'object' },
        errorGenerators: { type: 'object' },
        coherentErrors: { type: 'object' },
        incoherentErrors: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'characterization', 'gst']
}));

export const noiseModelConstructionTask = defineTask('qc-noise-model-construction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Noise Model Construction',
  agent: {
    name: 'noise-characterizer',
    skills: ['rb-benchmarker', 'noise-modeler', 'calibration-analyzer', 'stim-simulator'],
    prompt: {
      role: 'Quantum Noise Modeling Specialist',
      task: 'Construct comprehensive noise model from characterization data',
      context: args,
      instructions: [
        '1. Combine all characterization data',
        '2. Build depolarizing noise channels',
        '3. Add amplitude damping channels',
        '4. Add phase damping channels',
        '5. Add readout error channels',
        '6. Include crosstalk effects',
        '7. Validate model with test circuits',
        '8. Calibrate model parameters',
        '9. Export model in standard format',
        '10. Document model construction'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['noiseModel'],
      properties: {
        noiseModel: { type: 'object' },
        modelParameters: { type: 'object' },
        validationResults: { type: 'object' },
        modelAccuracy: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'characterization', 'noise-model']
}));

export const qubitRankingRecommendationsTask = defineTask('qc-qubit-ranking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Qubit Ranking and Recommendations',
  agent: {
    name: 'noise-characterizer',
    skills: ['rb-benchmarker', 'noise-modeler', 'calibration-analyzer', 'stim-simulator'],
    prompt: {
      role: 'Quantum Hardware Optimization Specialist',
      task: 'Rank qubits and provide optimization recommendations',
      context: args,
      instructions: [
        '1. Calculate composite quality scores',
        '2. Weight coherence, gate error, readout error',
        '3. Rank qubits by quality score',
        '4. Identify best qubit subsets',
        '5. Recommend qubit allocation strategies',
        '6. Identify problematic qubits to avoid',
        '7. Suggest calibration improvements',
        '8. Recommend circuit mapping strategies',
        '9. Provide error mitigation recommendations',
        '10. Document recommendations'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['qubitRankings', 'bestQubit', 'worstQubit', 'recommendations'],
      properties: {
        qubitRankings: { type: 'array' },
        bestQubit: { type: 'number' },
        worstQubit: { type: 'number' },
        qualityScores: { type: 'object' },
        bestSubsets: { type: 'array' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['quantum-computing', 'characterization', 'recommendations']
}));

export const noiseCharacterizationReportTask = defineTask('qc-noise-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Noise Characterization Report',
  agent: {
    name: 'noise-characterizer',
    skills: ['rb-benchmarker', 'noise-modeler', 'calibration-analyzer', 'stim-simulator'],
    prompt: {
      role: 'Technical Documentation Specialist',
      task: 'Generate comprehensive noise characterization report',
      context: args,
      instructions: [
        '1. Summarize hardware configuration',
        '2. Present coherence measurements',
        '3. Include RB results and plots',
        '4. Document readout characterization',
        '5. Present crosstalk analysis',
        '6. Include noise model details',
        '7. Present qubit rankings',
        '8. Include all recommendations',
        '9. Add visualizations',
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
  labels: ['quantum-computing', 'characterization', 'reporting']
}));
