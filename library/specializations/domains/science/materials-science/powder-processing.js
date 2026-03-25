/**
 * @process domains/science/materials-science/powder-processing
 * @description Powder Processing & Sintering - Develop powder metallurgy processes including powder characterization,
 * compaction optimization, and sintering parameter development.
 * @inputs { materialSystem: string, targetDensity?: number, processingRoute?: string }
 * @outputs { success: boolean, processParameters: object, sinteringSchedule: object, finalProperties: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('domains/science/materials-science/powder-processing', {
 *   materialSystem: 'WC-Co',
 *   targetDensity: 99.5,
 *   processingRoute: 'press-and-sinter'
 * });
 *
 * @references
 * - ASM Handbook Vol. 7: Powder Metal Technologies
 * - MPIF Standard Test Methods for Metal Powders
 * - Sintering Theory: German, R.M. "Sintering Theory and Practice"
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    materialSystem,
    targetDensity = 98,
    processingRoute = 'press-and-sinter',
    atmosphere = 'hydrogen',
    targetPorosity = null,
    outputDir = 'powder-processing-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Powder Processing for: ${materialSystem}`);
  ctx.log('info', `Processing route: ${processingRoute}, Target density: ${targetDensity}%`);

  // Phase 1: Powder Characterization
  ctx.log('info', 'Phase 1: Characterizing powder feedstock');
  const powderCharacterization = await ctx.task(powderCharacterizationTask, {
    materialSystem,
    outputDir
  });

  artifacts.push(...powderCharacterization.artifacts);

  // Phase 2: Powder Preparation
  ctx.log('info', 'Phase 2: Preparing powder blend');
  const powderPreparation = await ctx.task(powderPreparationTask, {
    materialSystem,
    powderCharacterization,
    outputDir
  });

  artifacts.push(...powderPreparation.artifacts);

  // Phase 3: Compaction Design
  ctx.log('info', 'Phase 3: Designing compaction parameters');
  const compactionDesign = await ctx.task(compactionDesignTask, {
    materialSystem,
    powderCharacterization,
    processingRoute,
    targetDensity,
    outputDir
  });

  artifacts.push(...compactionDesign.artifacts);

  await ctx.breakpoint({
    question: `Compaction design complete. Compaction pressure: ${compactionDesign.compactionPressure} MPa, Green density: ${compactionDesign.predictedGreenDensity}%. Review parameters?`,
    title: 'Compaction Design Review',
    context: {
      runId: ctx.runId,
      summary: {
        compactionPressure: compactionDesign.compactionPressure,
        predictedGreenDensity: compactionDesign.predictedGreenDensity,
        toolingRequirements: compactionDesign.toolingRequirements
      },
      files: compactionDesign.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 4: Sintering Parameter Development
  ctx.log('info', 'Phase 4: Developing sintering parameters');
  const sinteringDevelopment = await ctx.task(sinteringDevelopmentTask, {
    materialSystem,
    greenDensity: compactionDesign.predictedGreenDensity,
    targetDensity,
    atmosphere,
    outputDir
  });

  artifacts.push(...sinteringDevelopment.artifacts);

  // Phase 5: Sintering Simulation
  ctx.log('info', 'Phase 5: Simulating sintering process');
  const sinteringSimulation = await ctx.task(sinteringSimulationTask, {
    materialSystem,
    sinteringSchedule: sinteringDevelopment.schedule,
    greenProperties: compactionDesign,
    outputDir
  });

  artifacts.push(...sinteringSimulation.artifacts);

  // Phase 6: Post-Sintering Treatment
  ctx.log('info', 'Phase 6: Designing post-sintering treatments');
  const postSinteringTreatment = await ctx.task(postSinteringTreatmentTask, {
    materialSystem,
    sinteredDensity: sinteringSimulation.predictedDensity,
    targetDensity,
    outputDir
  });

  artifacts.push(...postSinteringTreatment.artifacts);

  // Phase 7: Property Prediction
  ctx.log('info', 'Phase 7: Predicting final properties');
  const propertyPrediction = await ctx.task(pmPropertyPredictionTask, {
    materialSystem,
    finalDensity: postSinteringTreatment.finalDensity || sinteringSimulation.predictedDensity,
    microstructure: sinteringSimulation.microstructure,
    outputDir
  });

  artifacts.push(...propertyPrediction.artifacts);

  // Phase 8: Report Generation
  ctx.log('info', 'Phase 8: Generating powder processing report');
  const report = await ctx.task(powderProcessingReportTask, {
    materialSystem,
    powderCharacterization,
    compactionDesign,
    sinteringDevelopment,
    sinteringSimulation,
    postSinteringTreatment,
    propertyPrediction,
    outputDir
  });

  artifacts.push(...report.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    materialSystem,
    processParameters: {
      powderPreparation: powderPreparation.parameters,
      compaction: {
        pressure: compactionDesign.compactionPressure,
        method: compactionDesign.compactionMethod,
        greenDensity: compactionDesign.predictedGreenDensity
      }
    },
    sinteringSchedule: sinteringDevelopment.schedule,
    postSinteringTreatment: postSinteringTreatment.treatments,
    finalProperties: {
      density: propertyPrediction.density,
      porosity: propertyPrediction.porosity,
      hardness: propertyPrediction.hardness,
      strength: propertyPrediction.strength,
      microstructure: sinteringSimulation.microstructure
    },
    artifacts,
    reportPath: report.reportPath,
    duration,
    metadata: {
      processId: 'domains/science/materials-science/powder-processing',
      timestamp: startTime,
      processingRoute,
      atmosphere,
      outputDir
    }
  };
}

// Task 1: Powder Characterization
export const powderCharacterizationTask = defineTask('pm-powder-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Powder Characterization - ${args.materialSystem}`,
  agent: {
    name: 'powder-technologist',
    prompt: {
      role: 'Powder Metallurgy Technologist',
      task: 'Characterize powder feedstock properties',
      context: args,
      instructions: [
        '1. Measure particle size distribution (laser diffraction)',
        '2. Determine D10, D50, D90 values',
        '3. Measure apparent density (Hall flowmeter)',
        '4. Measure tap density',
        '5. Evaluate powder flowability',
        '6. Analyze particle morphology (SEM)',
        '7. Measure surface area (BET)',
        '8. Determine chemical composition',
        '9. Check for contamination',
        '10. Document powder specifications'
      ],
      outputFormat: 'JSON with powder characterization results'
    },
    outputSchema: {
      type: 'object',
      required: ['particleSize', 'apparentDensity', 'flowability', 'artifacts'],
      properties: {
        particleSize: {
          type: 'object',
          properties: {
            D10: { type: 'number' },
            D50: { type: 'number' },
            D90: { type: 'number' }
          }
        },
        apparentDensity: { type: 'number', description: 'g/cm3' },
        tapDensity: { type: 'number', description: 'g/cm3' },
        flowability: { type: 'string' },
        morphology: { type: 'string' },
        surfaceArea: { type: 'number', description: 'm2/g' },
        composition: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'powder-metallurgy', 'characterization', 'materials-science']
}));

// Task 2: Powder Preparation
export const powderPreparationTask = defineTask('pm-powder-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Powder Preparation - ${args.materialSystem}`,
  agent: {
    name: 'powder-processor',
    prompt: {
      role: 'Powder Processing Specialist',
      task: 'Design powder preparation and blending process',
      context: args,
      instructions: [
        '1. Design powder blend composition',
        '2. Select mixing/milling equipment',
        '3. Determine mixing time and speed',
        '4. Add lubricants if needed',
        '5. Add binders if needed',
        '6. Consider granulation requirements',
        '7. Define handling procedures',
        '8. Set quality control points',
        '9. Document preparation procedure',
        '10. Validate blend homogeneity'
      ],
      outputFormat: 'JSON with powder preparation parameters'
    },
    outputSchema: {
      type: 'object',
      required: ['parameters', 'blendComposition', 'artifacts'],
      properties: {
        parameters: {
          type: 'object',
          properties: {
            mixingMethod: { type: 'string' },
            mixingTime: { type: 'number' },
            lubricant: { type: 'object' },
            binder: { type: 'object' }
          }
        },
        blendComposition: { type: 'object' },
        homogeneityTest: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'powder-metallurgy', 'preparation', 'materials-science']
}));

// Task 3: Compaction Design
export const compactionDesignTask = defineTask('pm-compaction-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Compaction Design - ${args.materialSystem}`,
  agent: {
    name: 'compaction-engineer',
    prompt: {
      role: 'Powder Compaction Engineer',
      task: 'Design compaction parameters for target green density',
      context: args,
      instructions: [
        '1. Select compaction method (uniaxial, CIP, HIP)',
        '2. Determine compaction pressure',
        '3. Design tooling requirements',
        '4. Calculate green density vs. pressure curve',
        '5. Predict springback',
        '6. Assess density gradients',
        '7. Consider ejection forces',
        '8. Optimize pressing cycle',
        '9. Define quality criteria',
        '10. Document compaction parameters'
      ],
      outputFormat: 'JSON with compaction design results'
    },
    outputSchema: {
      type: 'object',
      required: ['compactionPressure', 'predictedGreenDensity', 'compactionMethod', 'artifacts'],
      properties: {
        compactionMethod: { type: 'string' },
        compactionPressure: { type: 'number', description: 'MPa' },
        predictedGreenDensity: { type: 'number', description: '%' },
        pressureDensityCurve: { type: 'string' },
        toolingRequirements: { type: 'object' },
        ejectionPressure: { type: 'number' },
        springback: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'powder-metallurgy', 'compaction', 'materials-science']
}));

// Task 4: Sintering Development
export const sinteringDevelopmentTask = defineTask('pm-sintering-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Sintering Development - ${args.materialSystem}`,
  agent: {
    name: 'sintering-engineer',
    prompt: {
      role: 'Sintering Process Engineer',
      task: 'Develop sintering parameters for full densification',
      context: args,
      instructions: [
        '1. Determine sintering temperature range',
        '2. Select sintering atmosphere',
        '3. Design heating rate',
        '4. Determine hold time at temperature',
        '5. Design cooling profile',
        '6. Consider liquid phase sintering if applicable',
        '7. Account for shrinkage',
        '8. Plan debinding if needed',
        '9. Set up process monitoring',
        '10. Document sintering schedule'
      ],
      outputFormat: 'JSON with sintering parameters'
    },
    outputSchema: {
      type: 'object',
      required: ['schedule', 'predictedShrinkage', 'artifacts'],
      properties: {
        schedule: {
          type: 'object',
          properties: {
            debinding: { type: 'object' },
            heatingRate: { type: 'number' },
            sinteringTemperature: { type: 'number' },
            holdTime: { type: 'number' },
            coolingRate: { type: 'number' },
            atmosphere: { type: 'string' }
          }
        },
        predictedShrinkage: { type: 'number', description: '%' },
        sinteringMechanism: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'powder-metallurgy', 'sintering', 'materials-science']
}));

// Task 5: Sintering Simulation
export const sinteringSimulationTask = defineTask('pm-sintering-simulation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Sintering Simulation - ${args.materialSystem}`,
  agent: {
    name: 'sintering-modeler',
    prompt: {
      role: 'Sintering Simulation Specialist',
      task: 'Simulate sintering densification and microstructure evolution',
      context: args,
      instructions: [
        '1. Model neck formation between particles',
        '2. Simulate densification kinetics',
        '3. Predict grain growth',
        '4. Model pore elimination',
        '5. Calculate final density',
        '6. Predict dimensional changes',
        '7. Simulate microstructure evolution',
        '8. Assess homogeneity',
        '9. Validate with sintering models',
        '10. Document simulation results'
      ],
      outputFormat: 'JSON with sintering simulation results'
    },
    outputSchema: {
      type: 'object',
      required: ['predictedDensity', 'microstructure', 'artifacts'],
      properties: {
        predictedDensity: { type: 'number', description: '%' },
        dimensionalChanges: { type: 'object' },
        microstructure: {
          type: 'object',
          properties: {
            grainSize: { type: 'number' },
            porosity: { type: 'number' },
            poreSize: { type: 'number' }
          }
        },
        densificationCurve: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'powder-metallurgy', 'sintering-simulation', 'materials-science']
}));

// Task 6: Post-Sintering Treatment
export const postSinteringTreatmentTask = defineTask('pm-post-sintering', (args, taskCtx) => ({
  kind: 'agent',
  title: `Post-Sintering Treatment - ${args.materialSystem}`,
  agent: {
    name: 'post-processing-engineer',
    prompt: {
      role: 'Post-Sintering Treatment Engineer',
      task: 'Design post-sintering treatments if needed',
      context: args,
      instructions: [
        '1. Assess need for HIP (Hot Isostatic Pressing)',
        '2. Design infiltration if needed',
        '3. Plan heat treatment',
        '4. Design surface treatment',
        '5. Plan machining operations',
        '6. Consider sizing/coining',
        '7. Design coating if needed',
        '8. Plan quality inspection',
        '9. Document post-processing sequence',
        '10. Calculate final density'
      ],
      outputFormat: 'JSON with post-sintering treatment plan'
    },
    outputSchema: {
      type: 'object',
      required: ['treatments', 'finalDensity', 'artifacts'],
      properties: {
        treatments: { type: 'array', items: { type: 'object' } },
        hipRequired: { type: 'boolean' },
        hipParameters: { type: 'object' },
        heatTreatment: { type: 'object' },
        finalDensity: { type: 'number', description: '%' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'powder-metallurgy', 'post-sintering', 'materials-science']
}));

// Task 7: Property Prediction
export const pmPropertyPredictionTask = defineTask('pm-property-prediction', (args, taskCtx) => ({
  kind: 'agent',
  title: `Property Prediction - ${args.materialSystem}`,
  agent: {
    name: 'pm-property-predictor',
    prompt: {
      role: 'PM Property Prediction Specialist',
      task: 'Predict final mechanical and physical properties',
      context: args,
      instructions: [
        '1. Apply density-property correlations',
        '2. Predict hardness from microstructure',
        '3. Predict tensile strength',
        '4. Predict fatigue properties',
        '5. Estimate thermal conductivity',
        '6. Predict wear resistance',
        '7. Account for porosity effects',
        '8. Compare with wrought equivalents',
        '9. Validate predictions',
        '10. Document property predictions'
      ],
      outputFormat: 'JSON with property predictions'
    },
    outputSchema: {
      type: 'object',
      required: ['density', 'hardness', 'strength', 'artifacts'],
      properties: {
        density: { type: 'number', description: '%' },
        porosity: { type: 'number', description: '%' },
        hardness: { type: 'number' },
        strength: { type: 'number', description: 'MPa' },
        elongation: { type: 'number', description: '%' },
        thermalConductivity: { type: 'number' },
        wearResistance: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'powder-metallurgy', 'property-prediction', 'materials-science']
}));

// Task 8: Report Generation
export const powderProcessingReportTask = defineTask('pm-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Powder Processing Report - ${args.materialSystem}`,
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Powder Metallurgy Technical Writer',
      task: 'Generate comprehensive powder processing report',
      context: args,
      instructions: [
        '1. Create executive summary',
        '2. Document powder characterization',
        '3. Present compaction parameters',
        '4. Present sintering schedule',
        '5. Include simulation results',
        '6. Document post-processing',
        '7. Report predicted properties',
        '8. Include process flow diagram',
        '9. Add recommendations',
        '10. Format for process specification'
      ],
      outputFormat: 'JSON with report path and summary'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'keyFindings', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        figures: { type: 'array', items: { type: 'string' } },
        tables: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'powder-metallurgy', 'report', 'documentation', 'materials-science']
}));
