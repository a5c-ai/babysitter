/**
 * @process domains/science/materials-science/heat-treatment-optimization
 * @description Heat Treatment Optimization - Design and optimize heat treatment schedules (annealing, quenching,
 * tempering, aging) based on TTT/CCT diagrams and target microstructures.
 * @inputs { materialId: string, targetMicrostructure: string, alloyComposition?: object }
 * @outputs { success: boolean, heatTreatmentSchedule: object, predictedProperties: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('domains/science/materials-science/heat-treatment-optimization', {
 *   materialId: 'STEEL-4340',
 *   targetMicrostructure: 'tempered-martensite',
 *   alloyComposition: { C: 0.4, Cr: 0.8, Ni: 1.8, Mo: 0.25 }
 * });
 *
 * @references
 * - ASM Handbook Vol. 4: Heat Treating
 * - JMatPro: https://www.sentesoftware.co.uk/jmatpro
 * - DANTE: https://www.deformationsimulation.com/dante/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    materialId,
    targetMicrostructure,
    alloyComposition = {},
    targetHardness = null,
    targetStrength = null,
    constraints = {},
    quenchingMedia = 'oil',
    outputDir = 'heat-treatment-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Heat Treatment Optimization for: ${materialId}`);
  ctx.log('info', `Target microstructure: ${targetMicrostructure}`);

  // Phase 1: Material Characterization
  ctx.log('info', 'Phase 1: Characterizing starting material');
  const materialCharacterization = await ctx.task(htMaterialCharacterizationTask, {
    materialId,
    alloyComposition,
    outputDir
  });

  artifacts.push(...materialCharacterization.artifacts);

  // Phase 2: TTT/CCT Diagram Generation
  ctx.log('info', 'Phase 2: Generating transformation diagrams');
  const transformationDiagrams = await ctx.task(transformationDiagramTask, {
    materialId,
    alloyComposition,
    outputDir
  });

  artifacts.push(...transformationDiagrams.artifacts);

  // Phase 3: Heat Treatment Design
  ctx.log('info', 'Phase 3: Designing heat treatment schedule');
  const heatTreatmentDesign = await ctx.task(heatTreatmentDesignTask, {
    materialId,
    targetMicrostructure,
    transformationDiagrams: transformationDiagrams.diagrams,
    targetHardness,
    targetStrength,
    constraints,
    quenchingMedia,
    outputDir
  });

  artifacts.push(...heatTreatmentDesign.artifacts);

  await ctx.breakpoint({
    question: `Heat treatment schedule designed. Austenitizing: ${heatTreatmentDesign.schedule.austenitizing?.temperature}C for ${heatTreatmentDesign.schedule.austenitizing?.time} min. Review schedule?`,
    title: 'Heat Treatment Schedule Review',
    context: {
      runId: ctx.runId,
      summary: {
        schedule: heatTreatmentDesign.schedule,
        targetMicrostructure,
        predictedHardness: heatTreatmentDesign.predictedHardness
      },
      files: heatTreatmentDesign.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 4: Microstructure Simulation
  ctx.log('info', 'Phase 4: Simulating microstructure evolution');
  const microstructureSimulation = await ctx.task(microstructureSimulationTask, {
    materialId,
    heatTreatmentSchedule: heatTreatmentDesign.schedule,
    alloyComposition,
    outputDir
  });

  artifacts.push(...microstructureSimulation.artifacts);

  // Phase 5: Property Prediction
  ctx.log('info', 'Phase 5: Predicting mechanical properties');
  const propertyPrediction = await ctx.task(htPropertyPredictionTask, {
    materialId,
    predictedMicrostructure: microstructureSimulation.microstructure,
    alloyComposition,
    outputDir
  });

  artifacts.push(...propertyPrediction.artifacts);

  // Phase 6: Distortion and Residual Stress Analysis
  ctx.log('info', 'Phase 6: Analyzing distortion and residual stress');
  const distortionAnalysis = await ctx.task(distortionAnalysisTask, {
    materialId,
    heatTreatmentSchedule: heatTreatmentDesign.schedule,
    quenchingMedia,
    outputDir
  });

  artifacts.push(...distortionAnalysis.artifacts);

  // Phase 7: Process Optimization
  ctx.log('info', 'Phase 7: Optimizing heat treatment parameters');
  const processOptimization = await ctx.task(htOptimizationTask, {
    materialId,
    heatTreatmentDesign,
    microstructureSimulation,
    propertyPrediction,
    distortionAnalysis,
    targetHardness,
    targetStrength,
    constraints,
    outputDir
  });

  artifacts.push(...processOptimization.artifacts);

  // Phase 8: Report Generation
  ctx.log('info', 'Phase 8: Generating heat treatment report');
  const report = await ctx.task(heatTreatmentReportTask, {
    materialId,
    targetMicrostructure,
    heatTreatmentDesign,
    microstructureSimulation,
    propertyPrediction,
    distortionAnalysis,
    processOptimization,
    outputDir
  });

  artifacts.push(...report.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    materialId,
    targetMicrostructure,
    heatTreatmentSchedule: processOptimization.optimizedSchedule || heatTreatmentDesign.schedule,
    predictedMicrostructure: microstructureSimulation.microstructure,
    predictedProperties: {
      hardness: propertyPrediction.hardness,
      tensileStrength: propertyPrediction.tensileStrength,
      yieldStrength: propertyPrediction.yieldStrength,
      elongation: propertyPrediction.elongation,
      impactToughness: propertyPrediction.impactToughness
    },
    distortionPrediction: distortionAnalysis.distortion,
    residualStress: distortionAnalysis.residualStress,
    artifacts,
    reportPath: report.reportPath,
    duration,
    metadata: {
      processId: 'domains/science/materials-science/heat-treatment-optimization',
      timestamp: startTime,
      quenchingMedia,
      outputDir
    }
  };
}

// Task 1: Material Characterization
export const htMaterialCharacterizationTask = defineTask('ht-material-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Material Characterization - ${args.materialId}`,
  agent: {
    name: 'materials-engineer',
    prompt: {
      role: 'Heat Treatment Engineer',
      task: 'Characterize starting material for heat treatment',
      context: args,
      instructions: [
        '1. Identify material class (steel, aluminum, titanium)',
        '2. Determine alloy composition',
        '3. Identify starting microstructure',
        '4. Determine critical temperatures (Ac1, Ac3, Ms, Mf)',
        '5. Check for prior heat treatment history',
        '6. Assess hardenability',
        '7. Review material specification',
        '8. Identify phase stability',
        '9. Document material properties',
        '10. Identify heat treatment requirements'
      ],
      outputFormat: 'JSON with material characterization results'
    },
    outputSchema: {
      type: 'object',
      required: ['materialClass', 'criticalTemperatures', 'artifacts'],
      properties: {
        materialClass: { type: 'string' },
        composition: { type: 'object' },
        startingMicrostructure: { type: 'string' },
        criticalTemperatures: {
          type: 'object',
          properties: {
            Ac1: { type: 'number' },
            Ac3: { type: 'number' },
            Ms: { type: 'number' },
            Mf: { type: 'number' }
          }
        },
        hardenability: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'heat-treatment', 'characterization', 'materials-science']
}));

// Task 2: Transformation Diagram Generation
export const transformationDiagramTask = defineTask('ht-transformation-diagrams', (args, taskCtx) => ({
  kind: 'agent',
  title: `Transformation Diagrams - ${args.materialId}`,
  agent: {
    name: 'phase-transformation-specialist',
    prompt: {
      role: 'Phase Transformation Specialist',
      task: 'Generate TTT and CCT diagrams for heat treatment planning',
      context: args,
      instructions: [
        '1. Calculate TTT diagram using models or database',
        '2. Calculate CCT diagram for various cooling rates',
        '3. Identify pearlite nose position',
        '4. Determine bainite start temperature',
        '5. Calculate martensite start (Ms) temperature',
        '6. Identify critical cooling rate',
        '7. Plot transformation curves',
        '8. Overlay cooling paths',
        '9. Validate with experimental data if available',
        '10. Export diagrams for visualization'
      ],
      outputFormat: 'JSON with transformation diagram results'
    },
    outputSchema: {
      type: 'object',
      required: ['diagrams', 'criticalCoolingRate', 'artifacts'],
      properties: {
        diagrams: {
          type: 'object',
          properties: {
            ttt: { type: 'string' },
            cct: { type: 'string' }
          }
        },
        pearliteNose: { type: 'object' },
        bainiteStart: { type: 'number' },
        criticalCoolingRate: { type: 'number', description: 'C/s' },
        msTemperature: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'heat-treatment', 'ttt-cct', 'materials-science']
}));

// Task 3: Heat Treatment Design
export const heatTreatmentDesignTask = defineTask('ht-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Heat Treatment Design - ${args.materialId}`,
  agent: {
    name: 'heat-treatment-designer',
    prompt: {
      role: 'Heat Treatment Design Engineer',
      task: 'Design heat treatment schedule for target microstructure',
      context: args,
      instructions: [
        '1. Define target microstructure requirements',
        '2. Select austenitizing temperature (above Ac3)',
        '3. Determine austenitizing time (grain size control)',
        '4. Select quenching medium and method',
        '5. Design tempering parameters if needed',
        '6. Design aging treatment if precipitation hardening',
        '7. Consider pre-heat treatment (normalizing, annealing)',
        '8. Account for section size effects',
        '9. Include post-treatment processes',
        '10. Document heat treatment schedule'
      ],
      outputFormat: 'JSON with heat treatment schedule'
    },
    outputSchema: {
      type: 'object',
      required: ['schedule', 'predictedHardness', 'artifacts'],
      properties: {
        schedule: {
          type: 'object',
          properties: {
            preheat: { type: 'object' },
            austenitizing: { type: 'object' },
            quenching: { type: 'object' },
            tempering: { type: 'object' },
            aging: { type: 'object' }
          }
        },
        predictedHardness: { type: 'number' },
        rationale: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'heat-treatment', 'design', 'materials-science']
}));

// Task 4: Microstructure Simulation
export const microstructureSimulationTask = defineTask('ht-microstructure-simulation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Microstructure Simulation - ${args.materialId}`,
  agent: {
    name: 'microstructure-modeler',
    prompt: {
      role: 'Microstructure Modeling Specialist',
      task: 'Simulate microstructure evolution during heat treatment',
      context: args,
      instructions: [
        '1. Model austenite grain growth during heating',
        '2. Simulate phase transformation during cooling',
        '3. Predict martensite fraction',
        '4. Predict bainite fraction',
        '5. Predict retained austenite',
        '6. Model precipitate evolution during tempering',
        '7. Calculate phase fractions',
        '8. Predict grain size',
        '9. Visualize microstructure',
        '10. Document microstructure predictions'
      ],
      outputFormat: 'JSON with microstructure simulation results'
    },
    outputSchema: {
      type: 'object',
      required: ['microstructure', 'phaseFractions', 'artifacts'],
      properties: {
        microstructure: { type: 'string' },
        phaseFractions: {
          type: 'object',
          properties: {
            martensite: { type: 'number' },
            bainite: { type: 'number' },
            pearlite: { type: 'number' },
            ferrite: { type: 'number' },
            retainedAustenite: { type: 'number' }
          }
        },
        grainSize: { type: 'number' },
        precipitates: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'heat-treatment', 'microstructure', 'simulation', 'materials-science']
}));

// Task 5: Property Prediction
export const htPropertyPredictionTask = defineTask('ht-property-prediction', (args, taskCtx) => ({
  kind: 'agent',
  title: `Property Prediction - ${args.materialId}`,
  agent: {
    name: 'property-predictor',
    prompt: {
      role: 'Mechanical Property Prediction Specialist',
      task: 'Predict mechanical properties from microstructure',
      context: args,
      instructions: [
        '1. Apply structure-property correlations',
        '2. Calculate hardness from phase fractions',
        '3. Estimate tensile strength from hardness',
        '4. Predict yield strength',
        '5. Estimate elongation',
        '6. Predict impact toughness',
        '7. Consider tempering effects',
        '8. Apply empirical models',
        '9. Validate with literature data',
        '10. Document property predictions'
      ],
      outputFormat: 'JSON with property predictions'
    },
    outputSchema: {
      type: 'object',
      required: ['hardness', 'tensileStrength', 'artifacts'],
      properties: {
        hardness: { type: 'number', description: 'HRC' },
        tensileStrength: { type: 'number', description: 'MPa' },
        yieldStrength: { type: 'number', description: 'MPa' },
        elongation: { type: 'number', description: '%' },
        impactToughness: { type: 'number', description: 'J' },
        fatigueLimit: { type: 'number', description: 'MPa' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'heat-treatment', 'property-prediction', 'materials-science']
}));

// Task 6: Distortion Analysis
export const distortionAnalysisTask = defineTask('ht-distortion-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Distortion Analysis - ${args.materialId}`,
  agent: {
    name: 'distortion-analyst',
    prompt: {
      role: 'Heat Treatment Distortion Analyst',
      task: 'Predict distortion and residual stress from heat treatment',
      context: args,
      instructions: [
        '1. Model thermal gradients during quenching',
        '2. Calculate transformation strains',
        '3. Predict distortion patterns',
        '4. Calculate residual stress distribution',
        '5. Identify high-stress regions',
        '6. Assess cracking risk',
        '7. Recommend distortion mitigation',
        '8. Consider fixturing requirements',
        '9. Predict dimensional changes',
        '10. Document distortion analysis'
      ],
      outputFormat: 'JSON with distortion analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['distortion', 'residualStress', 'artifacts'],
      properties: {
        distortion: { type: 'object' },
        residualStress: {
          type: 'object',
          properties: {
            surface: { type: 'number', description: 'MPa' },
            core: { type: 'number', description: 'MPa' }
          }
        },
        crackingRisk: { type: 'string' },
        mitigationRecommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'heat-treatment', 'distortion', 'materials-science']
}));

// Task 7: Process Optimization
export const htOptimizationTask = defineTask('ht-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Heat Treatment Optimization - ${args.materialId}`,
  agent: {
    name: 'process-optimizer',
    prompt: {
      role: 'Heat Treatment Process Optimizer',
      task: 'Optimize heat treatment parameters',
      context: args,
      instructions: [
        '1. Review target properties vs. predictions',
        '2. Identify parameter adjustments needed',
        '3. Optimize austenitizing parameters',
        '4. Optimize quenching conditions',
        '5. Optimize tempering parameters',
        '6. Balance hardness vs. toughness',
        '7. Minimize distortion',
        '8. Consider process constraints',
        '9. Generate optimized schedule',
        '10. Document optimization rationale'
      ],
      outputFormat: 'JSON with optimized heat treatment schedule'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizedSchedule', 'improvements', 'artifacts'],
      properties: {
        optimizedSchedule: { type: 'object' },
        improvements: { type: 'object' },
        tradeoffs: { type: 'array', items: { type: 'string' } },
        optimizationRationale: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'heat-treatment', 'optimization', 'materials-science']
}));

// Task 8: Report Generation
export const heatTreatmentReportTask = defineTask('ht-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Heat Treatment Report - ${args.materialId}`,
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Heat Treatment Technical Writer',
      task: 'Generate comprehensive heat treatment report',
      context: args,
      instructions: [
        '1. Create executive summary',
        '2. Document material characterization',
        '3. Include TTT/CCT diagrams',
        '4. Present heat treatment schedule',
        '5. Show microstructure predictions',
        '6. Report predicted properties',
        '7. Include distortion analysis',
        '8. Document optimization results',
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
  labels: ['agent', 'heat-treatment', 'report', 'documentation', 'materials-science']
}));
