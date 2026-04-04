/**
 * @process specializations/domains/science/nanotechnology/thin-film-deposition
 * @description Thin Film Deposition Process Optimization - Optimize thin film deposition processes
 * (ALD, CVD, PVD) for nanoscale films including precursor delivery, substrate temperature,
 * film thickness control, conformality validation, and material property characterization
 * with statistical process control implementation.
 * @inputs { depositionMethod: string, material: string, targetThickness: object, substrate: string, requirements?: object }
 * @outputs { success: boolean, processRecipe: object, filmProperties: object, spcMetrics: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/nanotechnology/thin-film-deposition', {
 *   depositionMethod: 'ALD',
 *   material: 'Al2O3',
 *   targetThickness: { value: 10, units: 'nm', tolerance: 0.5 },
 *   substrate: 'silicon',
 *   requirements: { conformality: 0.95, temperatureLimit: 300 }
 * });
 *
 * @references
 * - Atomic Layer Deposition: An Overview: https://pubs.acs.org/doi/10.1021/cr900056b
 * - Chemical vapor deposition (CVD) for nanotechnology: https://www.sciencedirect.com/topics/materials-science/chemical-vapor-deposition
 * - Molecular Beam Epitaxy (MBE): https://www.veeco.com/products/mbe-systems
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    depositionMethod,
    material,
    targetThickness,
    substrate,
    requirements = {},
    maxIterations = 5,
    spcSampleSize = 20
  } = inputs;

  // Phase 1: Process Design
  const processDesign = await ctx.task(processDesignTask, {
    depositionMethod,
    material,
    targetThickness,
    substrate,
    requirements
  });

  // Quality Gate: Process must be feasible
  if (!processDesign.feasible) {
    return {
      success: false,
      error: 'Thin film deposition process not feasible',
      phase: 'process-design',
      recommendations: processDesign.recommendations
    };
  }

  // Breakpoint: Review process design
  await ctx.breakpoint({
    question: `Review ${depositionMethod} process design for ${material}. Target: ${targetThickness.value}${targetThickness.units}. Approve to proceed?`,
    title: 'Deposition Process Design Review',
    context: {
      runId: ctx.runId,
      depositionMethod,
      material,
      processDesign,
      files: [{
        path: 'artifacts/process-design.json',
        format: 'json',
        content: processDesign
      }]
    }
  });

  // Phase 2: Precursor/Source Optimization
  const precursorOptimization = await ctx.task(precursorOptimizationTask, {
    depositionMethod,
    material,
    processDesign
  });

  // Phase 3: Temperature Optimization
  const temperatureOptimization = await ctx.task(temperatureOptimizationTask, {
    depositionMethod,
    material,
    substrate,
    processDesign,
    requirements
  });

  // Phase 4: Growth Rate Calibration (Iterative)
  let iteration = 0;
  let thicknessAchieved = null;
  let thicknessError = Infinity;
  const calibrationHistory = [];
  let currentParams = {
    ...processDesign.initialParameters,
    ...precursorOptimization.optimizedParameters,
    ...temperatureOptimization.optimizedParameters
  };

  while (iteration < maxIterations && Math.abs(thicknessError) > targetThickness.tolerance) {
    iteration++;

    // Parameter adjustment
    const parameterAdjustment = await ctx.task(parameterAdjustmentTask, {
      depositionMethod,
      material,
      currentParams,
      targetThickness,
      iteration,
      previousResults: iteration > 1 ? calibrationHistory[iteration - 2] : null
    });

    // Deposition test
    const depositionTest = await ctx.task(depositionTestTask, {
      parameters: parameterAdjustment.adjustedParameters,
      depositionMethod,
      material,
      substrate,
      targetThickness
    });

    thicknessAchieved = depositionTest.measuredThickness;
    thicknessError = thicknessAchieved - targetThickness.value;

    calibrationHistory.push({
      iteration,
      parameters: parameterAdjustment.adjustedParameters,
      measuredThickness: thicknessAchieved,
      thicknessError,
      growthRate: depositionTest.growthRate,
      uniformity: depositionTest.uniformity
    });

    currentParams = parameterAdjustment.adjustedParameters;

    if (Math.abs(thicknessError) > targetThickness.tolerance && iteration < maxIterations) {
      await ctx.breakpoint({
        question: `Iteration ${iteration}: Thickness = ${thicknessAchieved.toFixed(2)}nm (error: ${thicknessError.toFixed(2)}nm). Continue calibration?`,
        title: 'Growth Rate Calibration Progress',
        context: {
          runId: ctx.runId,
          iteration,
          targetThickness: targetThickness.value,
          achievedThickness: thicknessAchieved,
          thicknessError
        }
      });
    }
  }

  // Phase 5: Conformality Validation (for ALD/CVD)
  let conformalityValidation = null;
  if (depositionMethod === 'ALD' || depositionMethod === 'CVD') {
    conformalityValidation = await ctx.task(conformalityValidationTask, {
      depositionMethod,
      material,
      currentParams,
      requirements
    });

    // Quality Gate: Conformality must meet requirements
    if (requirements.conformality && conformalityValidation.conformality < requirements.conformality) {
      await ctx.breakpoint({
        question: `Conformality ${(conformalityValidation.conformality * 100).toFixed(1)}% below target ${(requirements.conformality * 100).toFixed(1)}%. Review and adjust?`,
        title: 'Conformality Warning',
        context: {
          runId: ctx.runId,
          achievedConformality: conformalityValidation.conformality,
          targetConformality: requirements.conformality,
          recommendations: conformalityValidation.recommendations
        }
      });
    }
  }

  // Phase 6: Film Property Characterization
  const filmCharacterization = await ctx.task(filmCharacterizationTask, {
    depositionMethod,
    material,
    substrate,
    currentParams,
    thicknessAchieved
  });

  // Phase 7: Statistical Process Control Implementation
  const spcImplementation = await ctx.task(spcImplementationTask, {
    currentParams,
    calibrationHistory,
    targetThickness,
    spcSampleSize
  });

  // Phase 8: Process Qualification
  const processQualification = await ctx.task(processQualificationTask, {
    currentParams,
    filmCharacterization,
    spcImplementation,
    conformalityValidation,
    targetThickness,
    requirements
  });

  // Phase 9: Recipe Documentation
  const recipeDocumentation = await ctx.task(recipeDocumentationTask, {
    depositionMethod,
    material,
    substrate,
    targetThickness,
    optimizedParams: currentParams,
    filmCharacterization,
    spcImplementation,
    processQualification,
    calibrationHistory
  });

  // Final Breakpoint: Process approval
  await ctx.breakpoint({
    question: `Deposition process development complete. Thickness: ${thicknessAchieved.toFixed(2)}nm. Uniformity: ${(calibrationHistory[calibrationHistory.length - 1].uniformity * 100).toFixed(1)}%. Cpk: ${spcImplementation.cpk.toFixed(2)}. Approve recipe?`,
    title: 'Deposition Process Approval',
    context: {
      runId: ctx.runId,
      finalThickness: thicknessAchieved,
      uniformity: calibrationHistory[calibrationHistory.length - 1].uniformity,
      cpk: spcImplementation.cpk,
      files: [
        { path: 'artifacts/process-recipe.md', format: 'markdown', content: recipeDocumentation.markdown },
        { path: 'artifacts/process-parameters.json', format: 'json', content: currentParams }
      ]
    }
  });

  return {
    success: true,
    processRecipe: {
      depositionMethod,
      material,
      parameters: currentParams,
      documentation: recipeDocumentation
    },
    filmProperties: {
      thickness: thicknessAchieved,
      thicknessError,
      uniformity: calibrationHistory[calibrationHistory.length - 1].uniformity,
      growthRate: calibrationHistory[calibrationHistory.length - 1].growthRate,
      conformality: conformalityValidation?.conformality,
      characterization: filmCharacterization
    },
    spcMetrics: {
      cpk: spcImplementation.cpk,
      controlLimits: spcImplementation.controlLimits,
      processCapability: spcImplementation.processCapability
    },
    qualification: processQualification,
    calibrationIterations: iteration,
    metadata: {
      processId: 'specializations/domains/science/nanotechnology/thin-film-deposition',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const processDesignTask = defineTask('process-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design ${args.depositionMethod} process for ${args.material}`,
  agent: {
    name: 'thin-film-engineer',
    prompt: {
      role: 'Senior Thin Film Process Engineer',
      task: 'Design thin film deposition process for target specifications',
      context: args,
      instructions: [
        '1. Evaluate feasibility of deposition method for material',
        '2. Select appropriate precursors/sources',
        '3. Define initial process parameters (temperature, pressure, flow)',
        '4. Design substrate preparation procedure',
        '5. Define process sequence and timing',
        '6. Identify critical process parameters',
        '7. Plan thickness monitoring approach',
        '8. Assess uniformity requirements',
        '9. Identify potential process challenges',
        '10. Provide initial process flow'
      ],
      outputFormat: 'JSON object with process design'
    },
    outputSchema: {
      type: 'object',
      required: ['feasible', 'initialParameters', 'processSequence'],
      properties: {
        feasible: { type: 'boolean' },
        precursors: { type: 'array' },
        initialParameters: { type: 'object' },
        substratePreparation: { type: 'object' },
        processSequence: { type: 'array' },
        criticalParameters: { type: 'array' },
        challenges: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'thin-film', 'process-design']
}));

export const precursorOptimizationTask = defineTask('precursor-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Optimize precursor delivery',
  agent: {
    name: 'precursor-specialist',
    prompt: {
      role: 'Precursor Delivery Optimization Specialist',
      task: 'Optimize precursor/source delivery for film quality',
      context: args,
      instructions: [
        '1. Optimize precursor flow rates',
        '2. Determine optimal pulse/exposure times (for ALD)',
        '3. Optimize carrier gas flow',
        '4. Define purge times for complete removal',
        '5. Optimize precursor temperature/vapor pressure',
        '6. Assess precursor utilization efficiency',
        '7. Define line heating requirements',
        '8. Check for precursor decomposition issues',
        '9. Optimize multi-precursor sequencing if needed',
        '10. Document precursor handling and safety'
      ],
      outputFormat: 'JSON object with optimized precursor parameters'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizedParameters', 'deliveryEfficiency'],
      properties: {
        optimizedParameters: { type: 'object' },
        flowRates: { type: 'object' },
        pulseTimes: { type: 'object' },
        purgeTimes: { type: 'object' },
        deliveryEfficiency: { type: 'number' },
        safetyNotes: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'thin-film', 'precursor']
}));

export const temperatureOptimizationTask = defineTask('temperature-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Optimize substrate temperature',
  agent: {
    name: 'thermal-process-engineer',
    prompt: {
      role: 'Thermal Process Optimization Engineer',
      task: 'Optimize substrate temperature for film properties',
      context: args,
      instructions: [
        '1. Determine optimal growth temperature window',
        '2. Balance growth rate vs. film quality',
        '3. Consider thermal budget constraints',
        '4. Optimize ramp rates for temperature changes',
        '5. Define temperature uniformity requirements',
        '6. Consider substrate thermal properties',
        '7. Plan cooling procedures if needed',
        '8. Assess temperature monitoring locations',
        '9. Consider thermal stress effects',
        '10. Document temperature profile requirements'
      ],
      outputFormat: 'JSON object with optimized temperature parameters'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizedParameters', 'temperatureWindow'],
      properties: {
        optimizedParameters: { type: 'object' },
        optimalTemperature: { type: 'number' },
        temperatureWindow: { type: 'object' },
        rampRates: { type: 'object' },
        uniformityRequirement: { type: 'number' },
        thermalBudget: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'thin-film', 'temperature']
}));

export const parameterAdjustmentTask = defineTask('parameter-adjustment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Adjust deposition parameters (iteration ${args.iteration})`,
  agent: {
    name: 'process-optimizer',
    prompt: {
      role: 'Deposition Process Optimization Specialist',
      task: 'Adjust parameters to achieve target thickness',
      context: args,
      instructions: [
        '1. Analyze previous iteration results',
        '2. Calculate growth rate from measurements',
        '3. Adjust cycle count/time for target thickness',
        '4. Fine-tune other parameters if needed',
        '5. Consider parameter interactions',
        '6. Apply process modeling insights',
        '7. Predict expected thickness',
        '8. Assess uniformity impact of changes',
        '9. Document adjustment rationale',
        '10. Plan verification approach'
      ],
      outputFormat: 'JSON object with adjusted parameters'
    },
    outputSchema: {
      type: 'object',
      required: ['adjustedParameters', 'predictedThickness', 'adjustmentRationale'],
      properties: {
        adjustedParameters: { type: 'object' },
        predictedThickness: { type: 'number' },
        adjustmentRationale: { type: 'string' },
        expectedGrowthRate: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'thin-film', 'optimization', `iteration-${args.iteration}`]
}));

export const depositionTestTask = defineTask('deposition-test', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute and characterize deposition test',
  agent: {
    name: 'deposition-technician',
    prompt: {
      role: 'Thin Film Deposition Technician',
      task: 'Execute deposition test and characterize results',
      context: args,
      instructions: [
        '1. Prepare substrate per protocol',
        '2. Execute deposition with specified parameters',
        '3. Measure film thickness (ellipsometry, XRR, etc.)',
        '4. Calculate growth rate',
        '5. Measure thickness uniformity across substrate',
        '6. Document process conditions during deposition',
        '7. Note any process anomalies',
        '8. Assess film visual quality',
        '9. Record all measurement data',
        '10. Compare with predictions'
      ],
      outputFormat: 'JSON object with deposition test results'
    },
    outputSchema: {
      type: 'object',
      required: ['measuredThickness', 'growthRate', 'uniformity'],
      properties: {
        measuredThickness: { type: 'number' },
        growthRate: { type: 'number' },
        uniformity: { type: 'number' },
        processConditions: { type: 'object' },
        thicknessMap: { type: 'object' },
        anomalies: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'thin-film', 'characterization']
}));

export const conformalityValidationTask = defineTask('conformality-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate film conformality',
  agent: {
    name: 'conformality-analyst',
    prompt: {
      role: 'Thin Film Conformality Analyst',
      task: 'Validate film conformality on high-aspect-ratio structures',
      context: args,
      instructions: [
        '1. Prepare test structures with trenches/vias',
        '2. Execute deposition on test structures',
        '3. Cross-section samples for TEM/SEM analysis',
        '4. Measure film thickness at top, sidewall, bottom',
        '5. Calculate step coverage and conformality',
        '6. Assess thickness variation along features',
        '7. Identify any conformality issues',
        '8. Correlate with process parameters',
        '9. Recommend improvements if needed',
        '10. Document conformality validation results'
      ],
      outputFormat: 'JSON object with conformality validation'
    },
    outputSchema: {
      type: 'object',
      required: ['conformality', 'stepCoverage', 'thicknessProfile'],
      properties: {
        conformality: { type: 'number' },
        stepCoverage: { type: 'number' },
        thicknessProfile: {
          type: 'object',
          properties: {
            top: { type: 'number' },
            sidewall: { type: 'number' },
            bottom: { type: 'number' }
          }
        },
        aspectRatioTested: { type: 'number' },
        issues: { type: 'array' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'thin-film', 'conformality']
}));

export const filmCharacterizationTask = defineTask('film-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Characterize film properties',
  agent: {
    name: 'film-characterization-scientist',
    prompt: {
      role: 'Thin Film Characterization Scientist',
      task: 'Characterize material properties of deposited film',
      context: args,
      instructions: [
        '1. Measure film composition (XPS, RBS)',
        '2. Analyze film density (XRR)',
        '3. Characterize crystallinity (XRD)',
        '4. Measure optical properties (ellipsometry, UV-Vis)',
        '5. Measure electrical properties if applicable',
        '6. Assess film stress',
        '7. Measure surface roughness (AFM)',
        '8. Check interface quality',
        '9. Assess film adhesion',
        '10. Compare with bulk/literature values'
      ],
      outputFormat: 'JSON object with film characterization'
    },
    outputSchema: {
      type: 'object',
      required: ['composition', 'density', 'properties'],
      properties: {
        composition: { type: 'object' },
        density: { type: 'number' },
        crystallinity: { type: 'object' },
        opticalProperties: { type: 'object' },
        electricalProperties: { type: 'object' },
        stress: { type: 'number' },
        roughness: { type: 'number' },
        adhesion: { type: 'string' },
        properties: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'thin-film', 'characterization']
}));

export const spcImplementationTask = defineTask('spc-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement statistical process control',
  agent: {
    name: 'spc-engineer',
    prompt: {
      role: 'Statistical Process Control Engineer',
      task: 'Implement SPC for thin film deposition process',
      context: args,
      instructions: [
        '1. Define critical quality attributes for monitoring',
        '2. Calculate control limits from calibration data',
        '3. Generate control charts (X-bar, R charts)',
        '4. Calculate process capability indices (Cp, Cpk)',
        '5. Define sampling plan for monitoring',
        '6. Establish out-of-control action limits',
        '7. Define measurement frequency',
        '8. Plan for measurement system analysis',
        '9. Document SPC procedures',
        '10. Define escalation procedures for OOC'
      ],
      outputFormat: 'JSON object with SPC implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['controlLimits', 'cpk', 'processCapability'],
      properties: {
        controlLimits: {
          type: 'object',
          properties: {
            ucl: { type: 'number' },
            lcl: { type: 'number' },
            center: { type: 'number' }
          }
        },
        cpk: { type: 'number' },
        cp: { type: 'number' },
        processCapability: { type: 'object' },
        samplingPlan: { type: 'object' },
        oocProcedures: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'thin-film', 'spc']
}));

export const processQualificationTask = defineTask('process-qualification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Qualify deposition process',
  agent: {
    name: 'qualification-engineer',
    prompt: {
      role: 'Process Qualification Engineer',
      task: 'Qualify thin film deposition process for production',
      context: args,
      instructions: [
        '1. Verify all specifications are met',
        '2. Document process capability',
        '3. Verify reproducibility across runs',
        '4. Confirm equipment qualification',
        '5. Verify measurement system capability',
        '6. Document process robustness',
        '7. Complete qualification checklist',
        '8. Identify any process limitations',
        '9. Define ongoing monitoring requirements',
        '10. Generate qualification report'
      ],
      outputFormat: 'JSON object with qualification results'
    },
    outputSchema: {
      type: 'object',
      required: ['qualified', 'qualificationResults', 'limitations'],
      properties: {
        qualified: { type: 'boolean' },
        qualificationResults: { type: 'object' },
        specificationsCompliance: { type: 'object' },
        reproducibility: { type: 'object' },
        limitations: { type: 'array', items: { type: 'string' } },
        monitoringRequirements: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'thin-film', 'qualification']
}));

export const recipeDocumentationTask = defineTask('recipe-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document deposition process recipe',
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Technical Documentation Specialist',
      task: 'Generate comprehensive deposition process documentation',
      context: args,
      instructions: [
        '1. Create process specification document',
        '2. Document complete recipe parameters',
        '3. Include substrate preparation procedures',
        '4. Document film characterization requirements',
        '5. Include SPC monitoring procedures',
        '6. Document troubleshooting guide',
        '7. Include safety information',
        '8. Document equipment requirements',
        '9. Generate operator procedures',
        '10. Include calibration history'
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
        spcProcedures: { type: 'object' },
        troubleshootingGuide: { type: 'object' },
        safetyInformation: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['nanotechnology', 'thin-film', 'documentation']
}));
