/**
 * @process specializations/domains/science/nanotechnology/nanolithography-process
 * @description Nanolithography Process Development - Develop and optimize nanolithography workflows
 * (electron beam, nanoimprint, photolithography) including resist processing, exposure optimization,
 * pattern transfer, metrology validation, and defect analysis with quality gates for critical
 * dimension control and overlay accuracy.
 * @inputs { lithographyType: string, targetFeatures: object, substrateType: string, patternDesign: object }
 * @outputs { success: boolean, processRecipe: object, cdControl: object, defectAnalysis: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/nanotechnology/nanolithography-process', {
 *   lithographyType: 'electron-beam',
 *   targetFeatures: { minimumCD: 20, units: 'nm', pitch: 40, aspectRatio: 3 },
 *   substrateType: 'silicon',
 *   patternDesign: { type: 'lines-spaces', density: 'dense', area: '10um x 10um' }
 * });
 *
 * @references
 * - Electron Beam Lithography: https://www.raith.com/technology/e-beam-lithography/
 * - Nanoimprint Lithography: https://nanoscience.com/techniques/nanoimprint-lithography/
 * - Block Copolymer Lithography: https://www.nature.com/articles/nmat2898
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    lithographyType,
    targetFeatures,
    substrateType,
    patternDesign,
    cdTolerance = 0.1,
    overlayTolerance = 5,
    maxIterations = 5
  } = inputs;

  // Phase 1: Process Design
  const processDesign = await ctx.task(processDesignTask, {
    lithographyType,
    targetFeatures,
    substrateType,
    patternDesign
  });

  // Quality Gate: Process must be feasible
  if (!processDesign.feasible) {
    return {
      success: false,
      error: 'Lithography process design not feasible for target features',
      phase: 'process-design',
      recommendations: processDesign.recommendations
    };
  }

  // Breakpoint: Review process design
  await ctx.breakpoint({
    question: `Review ${lithographyType} lithography process design. Target CD: ${targetFeatures.minimumCD}${targetFeatures.units}. Approve to proceed?`,
    title: 'Lithography Process Design Review',
    context: {
      runId: ctx.runId,
      lithographyType,
      targetFeatures,
      processDesign,
      files: [{
        path: 'artifacts/process-design.json',
        format: 'json',
        content: processDesign
      }]
    }
  });

  // Phase 2: Resist Processing Development
  const resistProcessing = await ctx.task(resistProcessingTask, {
    lithographyType,
    processDesign,
    targetFeatures,
    substrateType
  });

  // Phase 3: Exposure Optimization (Iterative)
  let iteration = 0;
  let cdAchieved = null;
  let cdDeviation = Infinity;
  const optimizationHistory = [];
  let currentExposureParams = processDesign.initialExposureParameters;

  while (iteration < maxIterations && cdDeviation > cdTolerance) {
    iteration++;

    // Exposure parameter optimization
    const exposureOptimization = await ctx.task(exposureOptimizationTask, {
      lithographyType,
      currentExposureParams,
      targetFeatures,
      resistProcessing,
      iteration,
      previousResults: iteration > 1 ? optimizationHistory[iteration - 2] : null
    });

    // Exposure simulation/test
    const exposureResults = await ctx.task(exposureTestTask, {
      exposureParameters: exposureOptimization.optimizedParameters,
      lithographyType,
      patternDesign,
      resistProcessing
    });

    cdAchieved = exposureResults.measuredCD;
    cdDeviation = Math.abs(cdAchieved - targetFeatures.minimumCD) / targetFeatures.minimumCD;

    optimizationHistory.push({
      iteration,
      parameters: exposureOptimization.optimizedParameters,
      measuredCD: cdAchieved,
      cdDeviation,
      profileQuality: exposureResults.profileQuality
    });

    currentExposureParams = exposureOptimization.optimizedParameters;

    if (cdDeviation > cdTolerance && iteration < maxIterations) {
      await ctx.breakpoint({
        question: `Iteration ${iteration}: CD achieved = ${cdAchieved.toFixed(1)}nm (deviation: ${(cdDeviation * 100).toFixed(1)}%). Continue optimization?`,
        title: 'CD Optimization Progress',
        context: {
          runId: ctx.runId,
          iteration,
          targetCD: targetFeatures.minimumCD,
          achievedCD: cdAchieved,
          cdDeviation
        }
      });
    }
  }

  // Phase 4: Pattern Transfer Development
  const patternTransfer = await ctx.task(patternTransferTask, {
    lithographyType,
    optimizedExposure: currentExposureParams,
    resistProcessing,
    targetFeatures,
    substrateType
  });

  // Phase 5: Metrology and CD Verification
  const metrologyValidation = await ctx.task(metrologyValidationTask, {
    targetFeatures,
    achievedResults: optimizationHistory[optimizationHistory.length - 1],
    patternTransfer,
    cdTolerance
  });

  // Quality Gate: CD must meet specifications
  if (!metrologyValidation.cdWithinSpec) {
    await ctx.breakpoint({
      question: `CD verification failed. Achieved: ${metrologyValidation.measuredCD.toFixed(1)}nm vs Target: ${targetFeatures.minimumCD}nm. Review and determine action?`,
      title: 'CD Specification Warning',
      context: {
        runId: ctx.runId,
        measuredCD: metrologyValidation.measuredCD,
        targetCD: targetFeatures.minimumCD,
        recommendations: metrologyValidation.recommendations
      }
    });
  }

  // Phase 6: Defect Analysis
  const defectAnalysis = await ctx.task(defectAnalysisTask, {
    lithographyType,
    patternDesign,
    processResults: optimizationHistory[optimizationHistory.length - 1],
    patternTransfer
  });

  // Phase 7: Overlay Accuracy (if multi-layer)
  let overlayResults = null;
  if (patternDesign.multiLayer) {
    overlayResults = await ctx.task(overlayAnalysisTask, {
      patternDesign,
      lithographyType,
      currentExposureParams,
      overlayTolerance
    });
  }

  // Phase 8: Process Window Analysis
  const processWindow = await ctx.task(processWindowAnalysisTask, {
    currentExposureParams,
    optimizationHistory,
    targetFeatures,
    resistProcessing
  });

  // Phase 9: Recipe Documentation
  const recipeDocumentation = await ctx.task(recipeDocumentationTask, {
    lithographyType,
    targetFeatures,
    resistProcessing,
    optimizedExposure: currentExposureParams,
    patternTransfer,
    metrologyValidation,
    processWindow,
    optimizationHistory
  });

  // Final Breakpoint: Process approval
  await ctx.breakpoint({
    question: `Lithography process development complete. CD: ${cdAchieved.toFixed(1)}nm (${(cdDeviation * 100).toFixed(1)}% deviation). Defect density: ${defectAnalysis.defectDensity}/cm2. Approve process recipe?`,
    title: 'Lithography Process Approval',
    context: {
      runId: ctx.runId,
      finalCD: cdAchieved,
      defectDensity: defectAnalysis.defectDensity,
      processWindow: processWindow.summary,
      files: [
        { path: 'artifacts/process-recipe.md', format: 'markdown', content: recipeDocumentation.markdown },
        { path: 'artifacts/exposure-parameters.json', format: 'json', content: currentExposureParams }
      ]
    }
  });

  return {
    success: true,
    processRecipe: {
      lithographyType,
      resistProcessing,
      exposureParameters: currentExposureParams,
      patternTransfer,
      documentation: recipeDocumentation
    },
    cdControl: {
      targetCD: targetFeatures.minimumCD,
      achievedCD: cdAchieved,
      deviation: cdDeviation,
      withinSpec: metrologyValidation.cdWithinSpec,
      uniformity: metrologyValidation.cdUniformity
    },
    defectAnalysis,
    overlayResults,
    processWindow,
    optimizationIterations: iteration,
    metadata: {
      processId: 'specializations/domains/science/nanotechnology/nanolithography-process',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const processDesignTask = defineTask('process-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design ${args.lithographyType} lithography process`,
  agent: {
    name: 'lithography-engineer',
    prompt: {
      role: 'Senior Lithography Process Engineer',
      task: 'Design nanolithography process for target features',
      context: args,
      instructions: [
        '1. Evaluate feasibility of target CD with selected lithography type',
        '2. Select appropriate resist system for the application',
        '3. Define initial exposure parameters (dose, beam current, spot size)',
        '4. Design substrate preparation procedure',
        '5. Define development process parameters',
        '6. Plan pattern transfer approach (etch or liftoff)',
        '7. Identify critical process parameters',
        '8. Assess overlay requirements if multi-layer',
        '9. Identify potential process challenges',
        '10. Provide initial process flow and timeline'
      ],
      outputFormat: 'JSON object with process design'
    },
    outputSchema: {
      type: 'object',
      required: ['feasible', 'resistSystem', 'initialExposureParameters', 'processFlow'],
      properties: {
        feasible: { type: 'boolean' },
        resistSystem: { type: 'object' },
        initialExposureParameters: { type: 'object' },
        substratePreparation: { type: 'object' },
        developmentProcess: { type: 'object' },
        patternTransferApproach: { type: 'string' },
        processFlow: { type: 'array' },
        challenges: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'lithography', 'process-design']
}));

export const resistProcessingTask = defineTask('resist-processing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop resist processing protocol',
  agent: {
    name: 'resist-specialist',
    prompt: {
      role: 'Photoresist Processing Specialist',
      task: 'Develop optimized resist processing protocol',
      context: args,
      instructions: [
        '1. Define substrate cleaning and priming procedure',
        '2. Optimize resist spin coating parameters',
        '3. Define soft bake temperature and time',
        '4. Specify post-exposure bake if needed',
        '5. Optimize development process (time, temperature, agitation)',
        '6. Define rinse and dry procedures',
        '7. Characterize resist thickness uniformity',
        '8. Determine resist contrast curve',
        '9. Document handling and storage requirements',
        '10. Address environmental controls (humidity, particles)'
      ],
      outputFormat: 'JSON object with resist processing protocol'
    },
    outputSchema: {
      type: 'object',
      required: ['coatingParameters', 'bakeParameters', 'developmentParameters'],
      properties: {
        substratePreparation: { type: 'object' },
        coatingParameters: { type: 'object' },
        bakeParameters: { type: 'object' },
        developmentParameters: { type: 'object' },
        resistThickness: { type: 'object' },
        contrastCurve: { type: 'object' },
        environmentalControls: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'lithography', 'resist']
}));

export const exposureOptimizationTask = defineTask('exposure-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Optimize exposure parameters (iteration ${args.iteration})`,
  agent: {
    name: 'exposure-specialist',
    prompt: {
      role: 'Lithography Exposure Optimization Specialist',
      task: 'Optimize exposure parameters for target CD',
      context: args,
      instructions: [
        '1. Analyze previous iteration results if available',
        '2. Adjust dose to achieve target CD',
        '3. Optimize proximity effect correction',
        '4. Adjust beam parameters for resolution/throughput',
        '5. Consider pattern density effects',
        '6. Optimize write field stitching if applicable',
        '7. Account for resist sensitivity variations',
        '8. Apply dose modulation for pattern uniformity',
        '9. Predict CD based on optimized parameters',
        '10. Document optimization rationale'
      ],
      outputFormat: 'JSON object with optimized exposure parameters'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizedParameters', 'predictedCD', 'optimizationRationale'],
      properties: {
        optimizedParameters: {
          type: 'object',
          properties: {
            dose: { type: 'number' },
            beamCurrent: { type: 'number' },
            spotSize: { type: 'number' },
            stepSize: { type: 'number' }
          }
        },
        proximityCorrection: { type: 'object' },
        predictedCD: { type: 'number' },
        optimizationRationale: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'lithography', 'exposure', `iteration-${args.iteration}`]
}));

export const exposureTestTask = defineTask('exposure-test', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute and analyze exposure test',
  agent: {
    name: 'lithography-metrologist',
    prompt: {
      role: 'Lithography Metrology Specialist',
      task: 'Execute exposure test and analyze results',
      context: args,
      instructions: [
        '1. Execute exposure with optimized parameters',
        '2. Process resist (development)',
        '3. Measure CD using SEM or AFM',
        '4. Analyze resist profile (sidewall angle, footing)',
        '5. Measure line edge roughness (LER/LWR)',
        '6. Assess pattern uniformity across field',
        '7. Document any defects observed',
        '8. Compare measured vs predicted CD',
        '9. Assess process latitude',
        '10. Document exposure test results'
      ],
      outputFormat: 'JSON object with exposure test results'
    },
    outputSchema: {
      type: 'object',
      required: ['measuredCD', 'profileQuality', 'uniformity'],
      properties: {
        measuredCD: { type: 'number' },
        cdStandardDeviation: { type: 'number' },
        profileQuality: {
          type: 'object',
          properties: {
            sidewallAngle: { type: 'number' },
            ler: { type: 'number' },
            lwr: { type: 'number' }
          }
        },
        uniformity: { type: 'object' },
        defects: { type: 'array' },
        processLatitude: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'lithography', 'metrology']
}));

export const patternTransferTask = defineTask('pattern-transfer', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop pattern transfer process',
  agent: {
    name: 'etch-specialist',
    prompt: {
      role: 'Pattern Transfer and Etch Specialist',
      task: 'Develop pattern transfer process from resist to substrate',
      context: args,
      instructions: [
        '1. Select etch chemistry for substrate material',
        '2. Optimize etch rate and selectivity',
        '3. Develop descum process for residue removal',
        '4. Optimize etch profile (anisotropy, aspect ratio)',
        '5. Define etch endpoint detection method',
        '6. Characterize etch uniformity',
        '7. Develop resist strip process',
        '8. Measure transferred pattern dimensions',
        '9. Assess pattern transfer fidelity',
        '10. Document etch recipe and process window'
      ],
      outputFormat: 'JSON object with pattern transfer process'
    },
    outputSchema: {
      type: 'object',
      required: ['etchRecipe', 'etchProfile', 'transferFidelity'],
      properties: {
        etchRecipe: { type: 'object' },
        etchRate: { type: 'number' },
        selectivity: { type: 'number' },
        etchProfile: { type: 'object' },
        uniformity: { type: 'object' },
        transferFidelity: { type: 'number' },
        resistStripProcess: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'lithography', 'etch']
}));

export const metrologyValidationTask = defineTask('metrology-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate CD and pattern quality',
  agent: {
    name: 'cd-metrologist',
    prompt: {
      role: 'CD Metrology Validation Specialist',
      task: 'Validate CD and pattern quality against specifications',
      context: args,
      instructions: [
        '1. Perform statistical CD measurements across die/wafer',
        '2. Calculate CD mean and standard deviation',
        '3. Assess CD uniformity (within-die, die-to-die)',
        '4. Validate against target specification and tolerance',
        '5. Measure line edge roughness (LER/LWR)',
        '6. Assess pattern integrity and profile',
        '7. Document measurement uncertainty',
        '8. Generate Cpk analysis for CD control',
        '9. Identify systematic CD variations',
        '10. Provide recommendations for improvement'
      ],
      outputFormat: 'JSON object with metrology validation'
    },
    outputSchema: {
      type: 'object',
      required: ['cdWithinSpec', 'measuredCD', 'cdUniformity'],
      properties: {
        cdWithinSpec: { type: 'boolean' },
        measuredCD: { type: 'number' },
        cdStandardDeviation: { type: 'number' },
        cdUniformity: { type: 'object' },
        ler: { type: 'number' },
        lwr: { type: 'number' },
        cpk: { type: 'number' },
        measurementUncertainty: { type: 'number' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'lithography', 'validation']
}));

export const defectAnalysisTask = defineTask('defect-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze pattern defects',
  agent: {
    name: 'defect-analyst',
    prompt: {
      role: 'Lithography Defect Analysis Specialist',
      task: 'Analyze and classify pattern defects',
      context: args,
      instructions: [
        '1. Perform defect inspection (optical, SEM)',
        '2. Classify defects by type (bridging, breaks, particles)',
        '3. Calculate defect density',
        '4. Identify systematic vs random defects',
        '5. Correlate defects with process parameters',
        '6. Identify root causes of defects',
        '7. Map defect distribution',
        '8. Assess defect impact on device yield',
        '9. Recommend defect mitigation strategies',
        '10. Document defect analysis results'
      ],
      outputFormat: 'JSON object with defect analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['defectDensity', 'defectTypes', 'rootCauses'],
      properties: {
        defectDensity: { type: 'number' },
        defectTypes: { type: 'object' },
        defectDistribution: { type: 'object' },
        systematicDefects: { type: 'array' },
        rootCauses: { type: 'array' },
        yieldImpact: { type: 'number' },
        mitigationStrategies: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'lithography', 'defects']
}));

export const overlayAnalysisTask = defineTask('overlay-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze overlay accuracy',
  agent: {
    name: 'overlay-specialist',
    prompt: {
      role: 'Overlay Metrology Specialist',
      task: 'Analyze overlay accuracy for multi-layer patterns',
      context: args,
      instructions: [
        '1. Measure overlay error at multiple points',
        '2. Calculate translation, rotation, and magnification errors',
        '3. Assess overlay uniformity across field',
        '4. Compare against overlay tolerance specification',
        '5. Identify systematic overlay errors',
        '6. Calculate overlay correction factors',
        '7. Assess alignment mark quality',
        '8. Document overlay budget analysis',
        '9. Recommend overlay improvement strategies',
        '10. Calculate overlay Cpk'
      ],
      outputFormat: 'JSON object with overlay analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['overlayError', 'withinSpec', 'corrections'],
      properties: {
        overlayError: { type: 'object' },
        withinSpec: { type: 'boolean' },
        translationError: { type: 'object' },
        rotationError: { type: 'number' },
        magnificationError: { type: 'object' },
        corrections: { type: 'object' },
        overlayCpk: { type: 'number' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'lithography', 'overlay']
}));

export const processWindowAnalysisTask = defineTask('process-window-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze process window',
  agent: {
    name: 'process-engineer',
    prompt: {
      role: 'Lithography Process Window Analyst',
      task: 'Analyze and document lithography process window',
      context: args,
      instructions: [
        '1. Define dose-to-size relationship',
        '2. Determine dose latitude for CD tolerance',
        '3. Analyze focus-exposure matrix if applicable',
        '4. Calculate depth of focus',
        '5. Determine sensitivity to development variations',
        '6. Assess robustness to environmental variations',
        '7. Generate process window plots',
        '8. Calculate process capability metrics',
        '9. Identify process window limitations',
        '10. Recommend process monitoring strategy'
      ],
      outputFormat: 'JSON object with process window analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'doseLatitude', 'processCapability'],
      properties: {
        summary: { type: 'object' },
        doseLatitude: { type: 'number' },
        depthOfFocus: { type: 'number' },
        developmentLatitude: { type: 'object' },
        focusExposureMatrix: { type: 'object' },
        processCapability: { type: 'object' },
        monitoringStrategy: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'lithography', 'process-window']
}));

export const recipeDocumentationTask = defineTask('recipe-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document lithography process recipe',
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Technical Documentation Specialist',
      task: 'Generate comprehensive lithography process documentation',
      context: args,
      instructions: [
        '1. Create process specification document',
        '2. Document complete resist processing recipe',
        '3. Detail exposure parameters and settings',
        '4. Document pattern transfer recipe',
        '5. Include metrology and inspection requirements',
        '6. Document process control limits',
        '7. Include troubleshooting guide',
        '8. Provide safety and handling information',
        '9. Document equipment requirements',
        '10. Generate operator-level procedures'
      ],
      outputFormat: 'JSON object with documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['markdown', 'processSpecification', 'operatorProcedure'],
      properties: {
        markdown: { type: 'string' },
        processSpecification: { type: 'object' },
        operatorProcedure: { type: 'object' },
        controlLimits: { type: 'object' },
        troubleshootingGuide: { type: 'object' },
        equipmentRequirements: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'lithography', 'documentation']
}));
