/**
 * @process specializations/domains/science/nanotechnology/nanosensor-development
 * @description Nanosensor Development and Validation Pipeline - Develop nanomaterial-based sensors
 * including transducer design, surface functionalization for selectivity, calibration protocol
 * development, sensitivity/specificity validation, and interference testing with quality gates
 * for detection limits and reproducibility.
 * @inputs { targetAnalyte: object, sensorPlatform: string, performanceRequirements: object }
 * @outputs { success: boolean, sensorDesign: object, performanceMetrics: object, validationReport: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/nanotechnology/nanosensor-development', {
 *   targetAnalyte: { name: 'glucose', type: 'small-molecule', physiologicalRange: [70, 140] },
 *   sensorPlatform: 'electrochemical',
 *   performanceRequirements: { detectionLimit: 1, linearRange: [0.5, 500], selectivity: 100 }
 * });
 *
 * @references
 * - Plasmonic nanostructures: from plasmonics to applications: https://www.nature.com/articles/nmat3151
 * - Quantum dots for live cell and in vivo imaging: https://www.sciencedirect.com/science/article/pii/S1748013211001143
 * - NIST Nanotechnology Standards: https://www.nist.gov/nanotechnology/nist-nanotechnology-standards
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    targetAnalyte,
    sensorPlatform,
    performanceRequirements,
    maxIterations = 5
  } = inputs;

  // Phase 1: Sensor Design
  const sensorDesign = await ctx.task(sensorDesignTask, {
    targetAnalyte,
    sensorPlatform,
    performanceRequirements
  });

  // Quality Gate: Design must be feasible
  if (!sensorDesign.feasible) {
    return {
      success: false,
      error: 'Nanosensor design not feasible for target analyte',
      phase: 'sensor-design',
      recommendations: sensorDesign.recommendations
    };
  }

  // Breakpoint: Review sensor design
  await ctx.breakpoint({
    question: `Review ${sensorPlatform} nanosensor design for ${targetAnalyte.name}. Transducer: ${sensorDesign.transducerType}. Recognition: ${sensorDesign.recognitionElement}. Approve?`,
    title: 'Nanosensor Design Review',
    context: {
      runId: ctx.runId,
      sensorDesign,
      targetAnalyte,
      files: [{
        path: 'artifacts/sensor-design.json',
        format: 'json',
        content: sensorDesign
      }]
    }
  });

  // Phase 2: Nanomaterial Synthesis/Selection
  const nanomaterialSelection = await ctx.task(nanomaterialSelectionTask, {
    sensorDesign,
    sensorPlatform,
    performanceRequirements
  });

  // Phase 3: Surface Functionalization
  const surfaceFunctionalization = await ctx.task(surfaceFunctionalizationTask, {
    nanomaterialSelection,
    sensorDesign,
    targetAnalyte
  });

  // Phase 4: Sensor Fabrication
  const sensorFabrication = await ctx.task(sensorFabricationTask, {
    sensorDesign,
    nanomaterialSelection,
    surfaceFunctionalization
  });

  // Phase 5: Initial Characterization
  const initialCharacterization = await ctx.task(initialCharacterizationTask, {
    sensorFabrication,
    sensorDesign,
    targetAnalyte
  });

  // Phase 6: Calibration Protocol Development (Iterative)
  let iteration = 0;
  let detectionLimit = Infinity;
  let linearityAchieved = false;
  const calibrationHistory = [];
  let currentCalibration = null;

  while (iteration < maxIterations && (!linearityAchieved || detectionLimit > performanceRequirements.detectionLimit)) {
    iteration++;

    // Calibration optimization
    const calibrationOptimization = await ctx.task(calibrationOptimizationTask, {
      sensorFabrication,
      targetAnalyte,
      performanceRequirements,
      iteration,
      previousResults: iteration > 1 ? calibrationHistory[iteration - 2] : null
    });

    // Response characterization
    const responseCharacterization = await ctx.task(responseCharacterizationTask, {
      calibrationOptimization,
      sensorFabrication,
      targetAnalyte
    });

    detectionLimit = responseCharacterization.detectionLimit;
    linearityAchieved = responseCharacterization.linearityMet;
    currentCalibration = calibrationOptimization.calibrationProtocol;

    calibrationHistory.push({
      iteration,
      calibration: currentCalibration,
      detectionLimit,
      linearRange: responseCharacterization.linearRange,
      sensitivity: responseCharacterization.sensitivity,
      linearityMet: linearityAchieved
    });

    if ((!linearityAchieved || detectionLimit > performanceRequirements.detectionLimit) && iteration < maxIterations) {
      await ctx.breakpoint({
        question: `Iteration ${iteration}: LOD = ${detectionLimit.toFixed(3)} (target: ${performanceRequirements.detectionLimit}). Linearity: ${linearityAchieved ? 'met' : 'not met'}. Continue?`,
        title: 'Calibration Optimization Progress',
        context: {
          runId: ctx.runId,
          iteration,
          detectionLimit,
          linearityAchieved
        }
      });
    }
  }

  // Phase 7: Selectivity Testing
  const selectivityTesting = await ctx.task(selectivityTestingTask, {
    sensorFabrication,
    targetAnalyte,
    currentCalibration,
    performanceRequirements
  });

  // Quality Gate: Selectivity must meet requirements
  if (selectivityTesting.selectivityFactor < performanceRequirements.selectivity) {
    await ctx.breakpoint({
      question: `Selectivity factor ${selectivityTesting.selectivityFactor.toFixed(1)} below target ${performanceRequirements.selectivity}. Review interference mitigation?`,
      title: 'Selectivity Warning',
      context: {
        runId: ctx.runId,
        selectivityTesting,
        interferents: selectivityTesting.interferents
      }
    });
  }

  // Phase 8: Reproducibility Assessment
  const reproducibilityAssessment = await ctx.task(reproducibilityAssessmentTask, {
    sensorFabrication,
    currentCalibration,
    targetAnalyte
  });

  // Phase 9: Stability Testing
  const stabilityTesting = await ctx.task(stabilityTestingTask, {
    sensorFabrication,
    currentCalibration,
    targetAnalyte
  });

  // Phase 10: Real Sample Validation
  const realSampleValidation = await ctx.task(realSampleValidationTask, {
    sensorFabrication,
    currentCalibration,
    targetAnalyte,
    selectivityTesting
  });

  // Phase 11: Performance Summary
  const performanceSummary = await ctx.task(performanceSummaryTask, {
    calibrationHistory,
    selectivityTesting,
    reproducibilityAssessment,
    stabilityTesting,
    realSampleValidation,
    performanceRequirements
  });

  // Phase 12: Validation Report
  const validationReport = await ctx.task(validationReportTask, {
    sensorDesign,
    nanomaterialSelection,
    surfaceFunctionalization,
    sensorFabrication,
    calibrationHistory,
    selectivityTesting,
    reproducibilityAssessment,
    stabilityTesting,
    realSampleValidation,
    performanceSummary,
    targetAnalyte
  });

  // Final Breakpoint: Sensor approval
  await ctx.breakpoint({
    question: `Nanosensor development complete. LOD: ${detectionLimit.toFixed(3)}. Selectivity: ${selectivityTesting.selectivityFactor.toFixed(1)}. Reproducibility CV: ${reproducibilityAssessment.cv.toFixed(1)}%. Approve?`,
    title: 'Nanosensor Validation Approval',
    context: {
      runId: ctx.runId,
      performanceSummary,
      meetsRequirements: performanceSummary.meetsAllRequirements,
      files: [
        { path: 'artifacts/validation-report.md', format: 'markdown', content: validationReport.markdown },
        { path: 'artifacts/sensor-specs.json', format: 'json', content: performanceSummary }
      ]
    }
  });

  return {
    success: true,
    sensorDesign: {
      design: sensorDesign,
      nanomaterial: nanomaterialSelection,
      functionalization: surfaceFunctionalization,
      fabrication: sensorFabrication
    },
    performanceMetrics: {
      detectionLimit,
      linearRange: calibrationHistory[calibrationHistory.length - 1].linearRange,
      sensitivity: calibrationHistory[calibrationHistory.length - 1].sensitivity,
      selectivity: selectivityTesting.selectivityFactor,
      reproducibility: reproducibilityAssessment.cv,
      stability: stabilityTesting.shelfLife
    },
    calibration: currentCalibration,
    validationReport,
    metadata: {
      processId: 'specializations/domains/science/nanotechnology/nanosensor-development',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const sensorDesignTask = defineTask('sensor-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design nanosensor for ${args.targetAnalyte.name}`,
  agent: {
    name: 'sensor-designer',
    prompt: {
      role: 'Nanosensor Design Specialist',
      task: 'Design nanomaterial-based sensor for target analyte',
      context: args,
      instructions: [
        '1. Select optimal transduction mechanism',
        '2. Choose nanomaterial for signal amplification',
        '3. Design recognition element for selectivity',
        '4. Plan sensor architecture and geometry',
        '5. Define signal readout method',
        '6. Consider miniaturization requirements',
        '7. Plan for multiplexing if needed',
        '8. Address biocompatibility if for biological samples',
        '9. Consider cost and manufacturability',
        '10. Document design rationale'
      ],
      outputFormat: 'JSON object with sensor design'
    },
    outputSchema: {
      type: 'object',
      required: ['feasible', 'transducerType', 'recognitionElement', 'nanomaterialRole'],
      properties: {
        feasible: { type: 'boolean' },
        transducerType: { type: 'string' },
        recognitionElement: { type: 'string' },
        nanomaterialRole: { type: 'string' },
        sensorArchitecture: { type: 'object' },
        signalReadout: { type: 'string' },
        expectedPerformance: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'sensors', 'design']
}));

export const nanomaterialSelectionTask = defineTask('nanomaterial-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select/synthesize sensing nanomaterial',
  agent: {
    name: 'nanomaterial-specialist',
    prompt: {
      role: 'Sensing Nanomaterial Specialist',
      task: 'Select or design nanomaterial for sensor transduction',
      context: args,
      instructions: [
        '1. Select nanomaterial type for transduction',
        '2. Define required nanomaterial properties',
        '3. Specify synthesis or sourcing approach',
        '4. Define quality criteria for nanomaterial',
        '5. Plan characterization requirements',
        '6. Address batch-to-batch consistency',
        '7. Consider surface chemistry for functionalization',
        '8. Assess long-term stability',
        '9. Document material specifications',
        '10. Plan validation of material properties'
      ],
      outputFormat: 'JSON object with nanomaterial selection'
    },
    outputSchema: {
      type: 'object',
      required: ['nanomaterialType', 'properties', 'sourceMethod'],
      properties: {
        nanomaterialType: { type: 'string' },
        properties: { type: 'object' },
        sourceMethod: { type: 'string' },
        qualityCriteria: { type: 'object' },
        characterizationPlan: { type: 'array' },
        surfaceChemistry: { type: 'object' },
        specifications: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'sensors', 'materials']
}));

export const surfaceFunctionalizationTask = defineTask('surface-functionalization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Functionalize sensor surface',
  agent: {
    name: 'bioconjugation-specialist',
    prompt: {
      role: 'Sensor Surface Functionalization Specialist',
      task: 'Functionalize nanomaterial surface with recognition elements',
      context: args,
      instructions: [
        '1. Design functionalization chemistry',
        '2. Optimize linker selection and density',
        '3. Immobilize recognition element',
        '4. Optimize recognition element orientation',
        '5. Block non-specific binding sites',
        '6. Characterize surface coverage',
        '7. Verify bioactivity after immobilization',
        '8. Assess stability of functionalization',
        '9. Document functionalization protocol',
        '10. Define quality control for functionalization'
      ],
      outputFormat: 'JSON object with functionalization protocol'
    },
    outputSchema: {
      type: 'object',
      required: ['functionalizationMethod', 'recognitionElement', 'surfaceCoverage'],
      properties: {
        functionalizationMethod: { type: 'string' },
        linkerChemistry: { type: 'object' },
        recognitionElement: { type: 'object' },
        surfaceCoverage: { type: 'number' },
        blocking: { type: 'object' },
        bioactivityRetention: { type: 'number' },
        protocol: { type: 'array' },
        qualityControl: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'sensors', 'functionalization']
}));

export const sensorFabricationTask = defineTask('sensor-fabrication', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Fabricate nanosensor',
  agent: {
    name: 'sensor-fabrication-specialist',
    prompt: {
      role: 'Nanosensor Fabrication Specialist',
      task: 'Fabricate complete nanosensor device',
      context: args,
      instructions: [
        '1. Prepare sensor substrate/platform',
        '2. Deposit/pattern nanomaterial layer',
        '3. Integrate electrodes/optical components',
        '4. Apply functionalized sensing layer',
        '5. Package sensor for protection',
        '6. Integrate with readout electronics',
        '7. Characterize fabricated sensors',
        '8. Assess fabrication reproducibility',
        '9. Document fabrication protocol',
        '10. Define acceptance criteria'
      ],
      outputFormat: 'JSON object with fabrication results'
    },
    outputSchema: {
      type: 'object',
      required: ['fabricationSuccess', 'sensorCharacteristics', 'yield'],
      properties: {
        fabricationSuccess: { type: 'boolean' },
        sensorCharacteristics: { type: 'object' },
        yield: { type: 'number' },
        reproducibility: { type: 'object' },
        packaging: { type: 'object' },
        protocol: { type: 'array' },
        acceptanceCriteria: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'sensors', 'fabrication']
}));

export const initialCharacterizationTask = defineTask('initial-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Characterize fabricated sensor',
  agent: {
    name: 'sensor-characterization-specialist',
    prompt: {
      role: 'Sensor Characterization Specialist',
      task: 'Perform initial characterization of fabricated sensor',
      context: args,
      instructions: [
        '1. Verify sensor physical structure',
        '2. Characterize baseline signal',
        '3. Test initial response to analyte',
        '4. Assess signal-to-noise ratio',
        '5. Check for sensor defects',
        '6. Verify electrode/optical properties',
        '7. Test basic functionality',
        '8. Identify any issues',
        '9. Document initial performance',
        '10. Assess readiness for calibration'
      ],
      outputFormat: 'JSON object with initial characterization'
    },
    outputSchema: {
      type: 'object',
      required: ['functional', 'baselineSignal', 'initialResponse'],
      properties: {
        functional: { type: 'boolean' },
        baselineSignal: { type: 'object' },
        initialResponse: { type: 'object' },
        signalToNoise: { type: 'number' },
        defects: { type: 'array' },
        readyForCalibration: { type: 'boolean' },
        issues: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'sensors', 'characterization']
}));

export const calibrationOptimizationTask = defineTask('calibration-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Optimize calibration protocol (iteration ${args.iteration})`,
  agent: {
    name: 'calibration-specialist',
    prompt: {
      role: 'Sensor Calibration Specialist',
      task: 'Develop and optimize sensor calibration protocol',
      context: args,
      instructions: [
        '1. Define calibration concentration range',
        '2. Design calibration curve experiment',
        '3. Optimize measurement conditions',
        '4. Adjust buffer/media composition',
        '5. Optimize incubation/response time',
        '6. Minimize background signal',
        '7. Establish measurement protocol',
        '8. Define calibration curve fitting',
        '9. Document calibration procedure',
        '10. Plan validation of calibration'
      ],
      outputFormat: 'JSON object with calibration protocol'
    },
    outputSchema: {
      type: 'object',
      required: ['calibrationProtocol', 'concentrationRange', 'measurementConditions'],
      properties: {
        calibrationProtocol: { type: 'object' },
        concentrationRange: { type: 'object' },
        measurementConditions: { type: 'object' },
        responseTime: { type: 'number' },
        bufferComposition: { type: 'object' },
        curveFitting: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'sensors', 'calibration', `iteration-${args.iteration}`]
}));

export const responseCharacterizationTask = defineTask('response-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Characterize sensor response',
  agent: {
    name: 'response-analyst',
    prompt: {
      role: 'Sensor Response Characterization Analyst',
      task: 'Characterize sensor response and analytical performance',
      context: args,
      instructions: [
        '1. Generate calibration curve',
        '2. Calculate limit of detection (LOD)',
        '3. Determine linear dynamic range',
        '4. Calculate sensitivity',
        '5. Assess response time',
        '6. Calculate coefficient of determination',
        '7. Evaluate low-end performance',
        '8. Compare with requirements',
        '9. Document response characteristics',
        '10. Identify optimization opportunities'
      ],
      outputFormat: 'JSON object with response characterization'
    },
    outputSchema: {
      type: 'object',
      required: ['detectionLimit', 'linearRange', 'sensitivity', 'linearityMet'],
      properties: {
        detectionLimit: { type: 'number' },
        linearRange: { type: 'object' },
        sensitivity: { type: 'number' },
        linearityMet: { type: 'boolean' },
        r2: { type: 'number' },
        responseTime: { type: 'number' },
        calibrationCurve: { type: 'object' },
        optimizationNeeded: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'sensors', 'response']
}));

export const selectivityTestingTask = defineTask('selectivity-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Test sensor selectivity',
  agent: {
    name: 'selectivity-analyst',
    prompt: {
      role: 'Sensor Selectivity Testing Specialist',
      task: 'Evaluate sensor selectivity against interferents',
      context: args,
      instructions: [
        '1. Identify relevant interferents',
        '2. Test response to each interferent',
        '3. Test interferents at physiological levels',
        '4. Calculate selectivity coefficients',
        '5. Test mixtures of analyte and interferents',
        '6. Assess cross-reactivity',
        '7. Calculate selectivity factor',
        '8. Compare with requirements',
        '9. Identify problematic interferents',
        '10. Recommend selectivity improvements'
      ],
      outputFormat: 'JSON object with selectivity testing'
    },
    outputSchema: {
      type: 'object',
      required: ['selectivityFactor', 'interferents', 'crossReactivity'],
      properties: {
        selectivityFactor: { type: 'number' },
        interferents: { type: 'array' },
        interferentResponses: { type: 'object' },
        selectivityCoefficients: { type: 'object' },
        crossReactivity: { type: 'object' },
        problematicInterferents: { type: 'array' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'sensors', 'selectivity']
}));

export const reproducibilityAssessmentTask = defineTask('reproducibility-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess sensor reproducibility',
  agent: {
    name: 'reproducibility-analyst',
    prompt: {
      role: 'Sensor Reproducibility Analyst',
      task: 'Assess intra-sensor and inter-sensor reproducibility',
      context: args,
      instructions: [
        '1. Test multiple measurements on same sensor',
        '2. Calculate intra-sensor CV',
        '3. Test multiple sensors from same batch',
        '4. Calculate inter-sensor CV',
        '5. Test batch-to-batch variability',
        '6. Assess day-to-day reproducibility',
        '7. Calculate overall reproducibility metrics',
        '8. Compare with requirements',
        '9. Identify sources of variability',
        '10. Recommend improvements'
      ],
      outputFormat: 'JSON object with reproducibility assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['cv', 'intraSensorCV', 'interSensorCV'],
      properties: {
        cv: { type: 'number' },
        intraSensorCV: { type: 'number' },
        interSensorCV: { type: 'number' },
        batchToBatchCV: { type: 'number' },
        dayToDayCV: { type: 'number' },
        variabilitySources: { type: 'array' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'sensors', 'reproducibility']
}));

export const stabilityTestingTask = defineTask('stability-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Test sensor stability',
  agent: {
    name: 'stability-analyst',
    prompt: {
      role: 'Sensor Stability Testing Specialist',
      task: 'Evaluate sensor operational and storage stability',
      context: args,
      instructions: [
        '1. Test operational stability (continuous use)',
        '2. Test storage stability at different conditions',
        '3. Accelerated stability testing',
        '4. Monitor signal drift over time',
        '5. Assess sensitivity retention',
        '6. Test regeneration capability if applicable',
        '7. Determine shelf life',
        '8. Define storage requirements',
        '9. Document stability data',
        '10. Recommend stability improvements'
      ],
      outputFormat: 'JSON object with stability testing'
    },
    outputSchema: {
      type: 'object',
      required: ['operationalStability', 'storageStability', 'shelfLife'],
      properties: {
        operationalStability: { type: 'object' },
        storageStability: { type: 'object' },
        shelfLife: { type: 'string' },
        signalDrift: { type: 'object' },
        sensitivityRetention: { type: 'object' },
        regeneration: { type: 'object' },
        storageRequirements: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'sensors', 'stability']
}));

export const realSampleValidationTask = defineTask('real-sample-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate in real samples',
  agent: {
    name: 'validation-specialist',
    prompt: {
      role: 'Real Sample Validation Specialist',
      task: 'Validate sensor performance in real sample matrices',
      context: args,
      instructions: [
        '1. Select relevant real sample matrices',
        '2. Test sensor in real samples',
        '3. Assess matrix effects',
        '4. Perform spike-recovery experiments',
        '5. Compare with reference method',
        '6. Calculate accuracy and bias',
        '7. Assess sample preparation needs',
        '8. Test in range of sample types',
        '9. Document validation results',
        '10. Identify limitations in real samples'
      ],
      outputFormat: 'JSON object with real sample validation'
    },
    outputSchema: {
      type: 'object',
      required: ['validated', 'matrixEffects', 'recovery', 'accuracy'],
      properties: {
        validated: { type: 'boolean' },
        matricesTested: { type: 'array' },
        matrixEffects: { type: 'object' },
        recovery: { type: 'object' },
        accuracy: { type: 'object' },
        referenceMethodComparison: { type: 'object' },
        samplePreparation: { type: 'object' },
        limitations: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'sensors', 'validation']
}));

export const performanceSummaryTask = defineTask('performance-summary', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Summarize sensor performance',
  agent: {
    name: 'performance-analyst',
    prompt: {
      role: 'Sensor Performance Summary Analyst',
      task: 'Compile comprehensive sensor performance summary',
      context: args,
      instructions: [
        '1. Compile all performance metrics',
        '2. Compare with target requirements',
        '3. Assess overall performance rating',
        '4. Identify strengths and weaknesses',
        '5. Compare with existing sensors',
        '6. Assess commercial viability',
        '7. Identify improvement priorities',
        '8. Document performance specifications',
        '9. Provide overall assessment',
        '10. Recommend next steps'
      ],
      outputFormat: 'JSON object with performance summary'
    },
    outputSchema: {
      type: 'object',
      required: ['meetsAllRequirements', 'performanceMetrics', 'overallRating'],
      properties: {
        meetsAllRequirements: { type: 'boolean' },
        performanceMetrics: { type: 'object' },
        requirementComparison: { type: 'object' },
        overallRating: { type: 'string' },
        strengths: { type: 'array' },
        weaknesses: { type: 'array' },
        competitiveAnalysis: { type: 'object' },
        improvementPriorities: { type: 'array' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'sensors', 'summary']
}));

export const validationReportTask = defineTask('validation-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate validation report',
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Sensor Validation Report Writer',
      task: 'Generate comprehensive sensor validation report',
      context: args,
      instructions: [
        '1. Create executive summary',
        '2. Document sensor design and fabrication',
        '3. Present calibration results',
        '4. Include selectivity data',
        '5. Document reproducibility assessment',
        '6. Present stability data',
        '7. Include real sample validation',
        '8. Provide performance specifications',
        '9. Include comparison with requirements',
        '10. Provide recommendations'
      ],
      outputFormat: 'JSON object with validation report'
    },
    outputSchema: {
      type: 'object',
      required: ['markdown', 'executiveSummary', 'specifications'],
      properties: {
        markdown: { type: 'string' },
        executiveSummary: { type: 'string' },
        designSection: { type: 'object' },
        performanceData: { type: 'object' },
        specifications: { type: 'object' },
        conclusions: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'sensors', 'reporting']
}));
