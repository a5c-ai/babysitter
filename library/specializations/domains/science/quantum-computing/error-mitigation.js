/**
 * @process quantum-computing/error-mitigation
 * @description QC-ERR-001: Implement and configure error mitigation techniques for NISQ devices
 * @inputs { circuit: object, backend: string, mitigationTechniques: array }
 * @outputs { success: boolean, mitigatedResults: object, fidelityImprovement: number, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    circuit,
    backend = 'ibm_brisbane',
    mitigationTechniques = ['zne', 'measurement_mitigation', 'dynamical_decoupling'],
    shotsPerExperiment = 8192,
    outputDir = 'error-mitigation-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Hardware Noise Characterization
  ctx.log('info', 'Characterizing hardware noise model');
  const noiseCharacterization = await ctx.task(noiseCharacterizationTask, {
    backend,
    outputDir
  });

  if (!noiseCharacterization.success) {
    return {
      success: false,
      error: 'Noise characterization failed',
      details: noiseCharacterization,
      metadata: { processId: 'quantum-computing/error-mitigation', timestamp: startTime }
    };
  }

  artifacts.push(...noiseCharacterization.artifacts);

  // Task 2: Select Mitigation Techniques
  ctx.log('info', 'Selecting appropriate mitigation techniques');
  const techniqueSelection = await ctx.task(techniqueSelectionTask, {
    noiseModel: noiseCharacterization.noiseModel,
    mitigationTechniques,
    circuit,
    outputDir
  });

  artifacts.push(...techniqueSelection.artifacts);

  // Task 3: Implement Zero-Noise Extrapolation
  ctx.log('info', 'Implementing zero-noise extrapolation (ZNE)');
  const zneImplementation = await ctx.task(zneImplementationTask, {
    circuit,
    noiseModel: noiseCharacterization.noiseModel,
    enabled: mitigationTechniques.includes('zne'),
    outputDir
  });

  artifacts.push(...zneImplementation.artifacts);

  // Task 4: Configure Measurement Error Mitigation
  ctx.log('info', 'Configuring measurement error calibration');
  const measurementMitigation = await ctx.task(measurementMitigationTask, {
    backend,
    circuit,
    enabled: mitigationTechniques.includes('measurement_mitigation'),
    outputDir
  });

  artifacts.push(...measurementMitigation.artifacts);

  // Task 5: Apply Dynamical Decoupling
  ctx.log('info', 'Applying dynamical decoupling sequences');
  const dynamicalDecoupling = await ctx.task(dynamicalDecouplingTask, {
    circuit,
    noiseModel: noiseCharacterization.noiseModel,
    enabled: mitigationTechniques.includes('dynamical_decoupling'),
    outputDir
  });

  artifacts.push(...dynamicalDecoupling.artifacts);

  // Task 6: Execute Mitigated Circuits
  ctx.log('info', 'Executing circuits with error mitigation');
  const mitigatedExecution = await ctx.task(mitigatedExecutionTask, {
    circuit,
    zneConfig: zneImplementation.config,
    measurementCalibration: measurementMitigation.calibration,
    ddCircuit: dynamicalDecoupling.mitigatedCircuit,
    backend,
    shotsPerExperiment,
    outputDir
  });

  artifacts.push(...mitigatedExecution.artifacts);

  // Task 7: Validate Mitigation Effectiveness
  ctx.log('info', 'Validating mitigation effectiveness');
  const validation = await ctx.task(mitigationValidationTask, {
    unmitigatedResults: mitigatedExecution.unmitigatedResults,
    mitigatedResults: mitigatedExecution.mitigatedResults,
    idealResults: mitigatedExecution.idealResults,
    outputDir
  });

  artifacts.push(...validation.artifacts);

  // Breakpoint: Review mitigation results
  await ctx.breakpoint({
    question: `Error mitigation complete. Fidelity improvement: ${validation.fidelityImprovement}%. Techniques applied: ${techniqueSelection.selectedTechniques.join(', ')}. Review results?`,
    title: 'Error Mitigation Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        techniquesApplied: techniqueSelection.selectedTechniques,
        fidelityImprovement: validation.fidelityImprovement,
        overheadFactor: validation.overheadFactor,
        backend
      }
    }
  });

  // Task 8: Generate Mitigation Pipeline Report
  ctx.log('info', 'Generating mitigation pipeline documentation');
  const pipelineReport = await ctx.task(mitigationReportTask, {
    noiseCharacterization: noiseCharacterization.noiseModel,
    techniqueSelection: techniqueSelection.selectedTechniques,
    validation: validation.metrics,
    outputDir
  });

  artifacts.push(...pipelineReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    mitigatedResults: mitigatedExecution.mitigatedResults,
    validation: {
      fidelityImprovement: validation.fidelityImprovement,
      unmitigatedFidelity: validation.unmitigatedFidelity,
      mitigatedFidelity: validation.mitigatedFidelity
    },
    noiseCharacterization: {
      t1Times: noiseCharacterization.noiseModel.t1Times,
      t2Times: noiseCharacterization.noiseModel.t2Times,
      gateErrors: noiseCharacterization.noiseModel.gateErrors,
      readoutErrors: noiseCharacterization.noiseModel.readoutErrors
    },
    mitigationPipeline: {
      techniquesApplied: techniqueSelection.selectedTechniques,
      zneConfig: zneImplementation.config,
      measurementCalibration: measurementMitigation.calibration,
      ddSequence: dynamicalDecoupling.sequence
    },
    overhead: {
      circuitOverhead: validation.overheadFactor,
      shotsRequired: shotsPerExperiment * validation.shotMultiplier
    },
    artifacts,
    duration,
    metadata: {
      processId: 'quantum-computing/error-mitigation',
      timestamp: startTime,
      backend,
      techniques: mitigationTechniques
    }
  };
}

// Task 1: Noise Characterization
export const noiseCharacterizationTask = defineTask('noise-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Characterize hardware noise model',
  agent: {
    name: 'noise-analyst',
    prompt: {
      role: 'quantum hardware characterization specialist',
      task: 'Characterize the noise model of the target quantum backend',
      context: args,
      instructions: [
        'Retrieve backend calibration data',
        'Extract T1 and T2 coherence times',
        'Document single-qubit gate error rates',
        'Document two-qubit gate error rates',
        'Extract readout error probabilities',
        'Identify crosstalk patterns',
        'Build noise model for simulation',
        'Save noise characterization to output directory'
      ],
      outputFormat: 'JSON with success flag, noiseModel object, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'noiseModel', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        noiseModel: {
          type: 'object',
          properties: {
            t1Times: { type: 'object' },
            t2Times: { type: 'object' },
            gateErrors: { type: 'object' },
            readoutErrors: { type: 'object' },
            crosstalkMap: { type: 'object' }
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
  labels: ['agent', 'quantum', 'noise', 'characterization']
}));

// Task 2: Technique Selection
export const techniqueSelectionTask = defineTask('technique-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select appropriate mitigation techniques',
  agent: {
    name: 'mitigation-strategist',
    prompt: {
      role: 'quantum error mitigation specialist',
      task: 'Select optimal error mitigation techniques for the circuit and noise',
      context: args,
      instructions: [
        'Analyze circuit characteristics',
        'Assess dominant noise sources',
        'Evaluate technique applicability',
        'Consider overhead tradeoffs',
        'Rank techniques by expected benefit',
        'Check technique compatibility',
        'Document selection rationale',
        'Save selection to output directory'
      ],
      outputFormat: 'JSON with selected techniques, rationale, expected benefits, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedTechniques', 'artifacts'],
      properties: {
        selectedTechniques: { type: 'array', items: { type: 'string' } },
        rationale: { type: 'object' },
        expectedBenefits: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quantum', 'mitigation', 'strategy']
}));

// Task 3: ZNE Implementation
export const zneImplementationTask = defineTask('zne-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement zero-noise extrapolation (ZNE)',
  agent: {
    name: 'zne-implementer',
    prompt: {
      role: 'quantum error mitigation engineer',
      task: 'Implement zero-noise extrapolation with noise scaling methods',
      context: args,
      instructions: [
        'Configure noise scaling factors',
        'Implement unitary folding method',
        'Implement pulse stretching if available',
        'Configure extrapolation model (linear, polynomial, exponential)',
        'Generate scaled circuit variants',
        'Set up extrapolation computation',
        'Document ZNE configuration',
        'Save implementation to output directory'
      ],
      outputFormat: 'JSON with ZNE config, scaled circuits, extrapolation model, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'artifacts'],
      properties: {
        config: {
          type: 'object',
          properties: {
            scalingFactors: { type: 'array', items: { type: 'number' } },
            scalingMethod: { type: 'string' },
            extrapolationModel: { type: 'string' }
          }
        },
        scaledCircuits: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quantum', 'zne', 'error-mitigation']
}));

// Task 4: Measurement Error Mitigation
export const measurementMitigationTask = defineTask('measurement-mitigation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure measurement error calibration',
  agent: {
    name: 'measurement-calibrator',
    prompt: {
      role: 'quantum measurement specialist',
      task: 'Configure and calibrate measurement error mitigation',
      context: args,
      instructions: [
        'Generate calibration circuits',
        'Measure calibration matrix elements',
        'Build assignment matrix',
        'Compute inverse assignment matrix',
        'Configure matrix-free mitigation if needed',
        'Validate calibration quality',
        'Document calibration procedure',
        'Save calibration data to output directory'
      ],
      outputFormat: 'JSON with calibration matrix, inverse matrix, validation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['calibration', 'artifacts'],
      properties: {
        calibration: {
          type: 'object',
          properties: {
            assignmentMatrix: { type: 'array' },
            inverseMatrix: { type: 'array' },
            conditionNumber: { type: 'number' }
          }
        },
        validationMetrics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quantum', 'measurement', 'calibration']
}));

// Task 5: Dynamical Decoupling
export const dynamicalDecouplingTask = defineTask('dynamical-decoupling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply dynamical decoupling sequences',
  agent: {
    name: 'dd-implementer',
    prompt: {
      role: 'quantum control specialist',
      task: 'Apply dynamical decoupling sequences to mitigate decoherence',
      context: args,
      instructions: [
        'Analyze circuit idle periods',
        'Select DD sequence (XY4, CPMG, etc.)',
        'Insert DD pulses in idle windows',
        'Optimize pulse timing',
        'Ensure sequence compatibility',
        'Validate modified circuit',
        'Document DD configuration',
        'Save mitigated circuit to output directory'
      ],
      outputFormat: 'JSON with mitigated circuit, DD sequence info, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['mitigatedCircuit', 'sequence', 'artifacts'],
      properties: {
        mitigatedCircuit: { type: 'object' },
        sequence: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            pulsesInserted: { type: 'number' },
            targetQubits: { type: 'array', items: { type: 'number' } }
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
  labels: ['agent', 'quantum', 'dynamical-decoupling', 'decoherence']
}));

// Task 6: Mitigated Execution
export const mitigatedExecutionTask = defineTask('mitigated-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute circuits with error mitigation',
  agent: {
    name: 'mitigated-executor',
    prompt: {
      role: 'quantum execution engineer',
      task: 'Execute circuits with all configured mitigation techniques',
      context: args,
      instructions: [
        'Execute unmitigated baseline circuit',
        'Execute ZNE scaled circuits',
        'Execute measurement calibration circuits',
        'Execute DD-enhanced circuits',
        'Apply measurement error correction',
        'Perform ZNE extrapolation',
        'Compute ideal simulation results',
        'Save all results to output directory'
      ],
      outputFormat: 'JSON with unmitigated, mitigated, and ideal results, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['unmitigatedResults', 'mitigatedResults', 'idealResults', 'artifacts'],
      properties: {
        unmitigatedResults: { type: 'object' },
        mitigatedResults: { type: 'object' },
        idealResults: { type: 'object' },
        executionMetadata: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quantum', 'execution', 'mitigation']
}));

// Task 7: Mitigation Validation
export const mitigationValidationTask = defineTask('mitigation-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate mitigation effectiveness',
  agent: {
    name: 'mitigation-validator',
    prompt: {
      role: 'quantum quality assurance engineer',
      task: 'Validate the effectiveness of applied error mitigation',
      context: args,
      instructions: [
        'Compare mitigated vs unmitigated fidelity',
        'Calculate fidelity improvement percentage',
        'Assess statistical significance',
        'Compute overhead factors',
        'Analyze technique-specific contributions',
        'Generate comparison visualizations',
        'Document validation findings',
        'Save validation report to output directory'
      ],
      outputFormat: 'JSON with fidelity metrics, improvement stats, overhead analysis, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['fidelityImprovement', 'unmitigatedFidelity', 'mitigatedFidelity', 'artifacts'],
      properties: {
        fidelityImprovement: { type: 'number' },
        unmitigatedFidelity: { type: 'number' },
        mitigatedFidelity: { type: 'number' },
        overheadFactor: { type: 'number' },
        shotMultiplier: { type: 'number' },
        techniqueContributions: { type: 'object' },
        metrics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quantum', 'validation', 'fidelity']
}));

// Task 8: Mitigation Pipeline Report
export const mitigationReportTask = defineTask('mitigation-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate mitigation pipeline documentation',
  agent: {
    name: 'mitigation-reporter',
    prompt: {
      role: 'technical documentation specialist',
      task: 'Generate comprehensive error mitigation pipeline report',
      context: args,
      instructions: [
        'Document noise characterization findings',
        'Explain technique selection rationale',
        'Detail implementation configurations',
        'Present validation results',
        'Include overhead analysis',
        'Provide recommendations for future runs',
        'Create executive summary',
        'Save report to output directory'
      ],
      outputFormat: 'JSON with report path, key findings, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        executiveSummary: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quantum', 'documentation', 'reporting']
}));
