/**
 * @process specializations/domains/science/biomedical-engineering/fea-medical-devices
 * @description Finite Element Analysis for Medical Devices - Conduct FEA to evaluate structural performance,
 * stress distribution, and fatigue life of medical devices, particularly implants and load-bearing devices.
 * @inputs { deviceName: string, deviceType: string, loadingConditions: object, materialProperties: object }
 * @outputs { success: boolean, feaReports: object, validationDocumentation: object, designRecommendations: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/biomedical-engineering/fea-medical-devices', {
 *   deviceName: 'Spinal Fusion Cage',
 *   deviceType: 'Orthopedic Implant',
 *   loadingConditions: { compressive: '4000N', cyclicLoading: 'ISO 12189' },
 *   materialProperties: { material: 'PEEK', elasticModulus: '3.6GPa' }
 * });
 *
 * @references
 * - ASME V&V 40:2018 Assessing Credibility of Computational Modeling through Verification and Validation
 * - FDA Guidance on Reporting Computational Modeling Studies
 * - ASTM F2996 Standard Practice for Finite Element Analysis of Non-Modular Metallic Orthopaedic Hip Femoral Stems
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    deviceName,
    deviceType,
    loadingConditions,
    materialProperties
  } = inputs;

  // Phase 1: Geometry Creation and Import
  const geometryPreparation = await ctx.task(geometryPreparationTask, {
    deviceName,
    deviceType
  });

  // Phase 2: Material Model Selection
  const materialModeling = await ctx.task(materialModelingTask, {
    deviceName,
    materialProperties,
    loadingConditions
  });

  // Phase 3: Boundary Conditions and Loading
  const boundaryConditions = await ctx.task(boundaryConditionsTask, {
    deviceName,
    loadingConditions,
    deviceType
  });

  // Phase 4: Mesh Generation
  const meshGeneration = await ctx.task(meshGenerationTask, {
    deviceName,
    geometryPreparation,
    boundaryConditions
  });

  // Phase 5: Mesh Convergence Study
  const meshConvergence = await ctx.task(meshConvergenceTask, {
    deviceName,
    meshGeneration,
    boundaryConditions
  });

  // Breakpoint: Review mesh convergence
  await ctx.breakpoint({
    question: `Review mesh convergence study for ${deviceName}. Is mesh refinement adequate?`,
    title: 'Mesh Convergence Review',
    context: {
      runId: ctx.runId,
      deviceName,
      convergenceResults: meshConvergence.results,
      files: [{
        path: `artifacts/phase5-mesh-convergence.json`,
        format: 'json',
        content: meshConvergence
      }]
    }
  });

  // Phase 6: Stress and Strain Analysis
  const stressAnalysis = await ctx.task(stressStrainAnalysisTask, {
    deviceName,
    meshConvergence,
    materialModeling,
    boundaryConditions
  });

  // Phase 7: Fatigue Life Prediction
  const fatigueAnalysis = await ctx.task(fatigueAnalysisTask, {
    deviceName,
    stressAnalysis,
    loadingConditions,
    materialProperties
  });

  // Phase 8: Model Validation Planning
  const modelValidation = await ctx.task(modelValidationTask, {
    deviceName,
    stressAnalysis,
    fatigueAnalysis,
    loadingConditions
  });

  // Final Breakpoint: FEA Approval
  await ctx.breakpoint({
    question: `FEA complete for ${deviceName}. Maximum stress: ${stressAnalysis.maxStress}. Approve analysis results?`,
    title: 'FEA Approval',
    context: {
      runId: ctx.runId,
      deviceName,
      maxStress: stressAnalysis.maxStress,
      fatigueLife: fatigueAnalysis.predictedLife,
      files: [
        { path: `artifacts/fea-report.json`, format: 'json', content: { stress: stressAnalysis, fatigue: fatigueAnalysis } }
      ]
    }
  });

  return {
    success: true,
    deviceName,
    feaReports: {
      stressAnalysis: stressAnalysis.results,
      fatigueAnalysis: fatigueAnalysis.results,
      meshConvergence: meshConvergence.results
    },
    validationDocumentation: modelValidation.documentation,
    designRecommendations: stressAnalysis.recommendations,
    metadata: {
      processId: 'specializations/domains/science/biomedical-engineering/fea-medical-devices',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const geometryPreparationTask = defineTask('geometry-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Geometry Preparation - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CAE Engineer with expertise in FEA model preparation',
      task: 'Prepare device geometry for finite element analysis',
      context: {
        deviceName: args.deviceName,
        deviceType: args.deviceType
      },
      instructions: [
        '1. Import/create CAD geometry',
        '2. Clean and defeaturing geometry',
        '3. Simplify for analysis where appropriate',
        '4. Document geometry assumptions',
        '5. Define coordinate systems',
        '6. Identify symmetry conditions',
        '7. Partition geometry for meshing',
        '8. Document geometric dimensions',
        '9. Verify geometry quality',
        '10. Create geometry preparation report'
      ],
      outputFormat: 'JSON object with geometry preparation details'
    },
    outputSchema: {
      type: 'object',
      required: ['geometryDetails', 'assumptions', 'simplifications'],
      properties: {
        geometryDetails: { type: 'object' },
        assumptions: { type: 'array', items: { type: 'string' } },
        simplifications: { type: 'array', items: { type: 'string' } },
        symmetryConditions: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fea', 'geometry', 'medical-device']
}));

export const materialModelingTask = defineTask('material-modeling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Material Modeling - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Materials Modeling Specialist',
      task: 'Select and validate material models for FEA',
      context: {
        deviceName: args.deviceName,
        materialProperties: args.materialProperties,
        loadingConditions: args.loadingConditions
      },
      instructions: [
        '1. Select appropriate material model',
        '2. Define material properties',
        '3. Document property sources',
        '4. Consider nonlinear behavior',
        '5. Define anisotropy if applicable',
        '6. Model degradation effects',
        '7. Define temperature dependencies',
        '8. Validate material model',
        '9. Document uncertainties',
        '10. Create material model specification'
      ],
      outputFormat: 'JSON object with material modeling'
    },
    outputSchema: {
      type: 'object',
      required: ['materialModel', 'properties', 'validation'],
      properties: {
        materialModel: { type: 'string' },
        properties: { type: 'object' },
        validation: { type: 'object' },
        uncertainties: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fea', 'materials', 'medical-device']
}));

export const boundaryConditionsTask = defineTask('boundary-conditions', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Boundary Conditions - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'FEA Analyst with expertise in physiological loading',
      task: 'Define physiologically relevant boundary conditions',
      context: {
        deviceName: args.deviceName,
        loadingConditions: args.loadingConditions,
        deviceType: args.deviceType
      },
      instructions: [
        '1. Identify physiological loads',
        '2. Define load application methods',
        '3. Define constraints and fixtures',
        '4. Consider contact conditions',
        '5. Define worst-case loading',
        '6. Document load justification',
        '7. Reference applicable standards',
        '8. Define load steps',
        '9. Consider dynamic effects',
        '10. Create boundary condition specification'
      ],
      outputFormat: 'JSON object with boundary conditions'
    },
    outputSchema: {
      type: 'object',
      required: ['loads', 'constraints', 'justification'],
      properties: {
        loads: { type: 'array', items: { type: 'object' } },
        constraints: { type: 'array', items: { type: 'object' } },
        contacts: { type: 'array', items: { type: 'object' } },
        justification: { type: 'object' },
        standards: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fea', 'boundary-conditions', 'medical-device']
}));

export const meshGenerationTask = defineTask('mesh-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Mesh Generation - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'FEA Mesh Specialist',
      task: 'Generate high-quality finite element mesh',
      context: {
        deviceName: args.deviceName,
        geometryPreparation: args.geometryPreparation,
        boundaryConditions: args.boundaryConditions
      },
      instructions: [
        '1. Select element types',
        '2. Define mesh sizing strategy',
        '3. Refine mesh at critical areas',
        '4. Check mesh quality metrics',
        '5. Document element statistics',
        '6. Verify mesh connectivity',
        '7. Check aspect ratios',
        '8. Verify contact mesh compatibility',
        '9. Document mesh parameters',
        '10. Create mesh quality report'
      ],
      outputFormat: 'JSON object with mesh generation details'
    },
    outputSchema: {
      type: 'object',
      required: ['meshDetails', 'qualityMetrics', 'elementStatistics'],
      properties: {
        meshDetails: { type: 'object' },
        qualityMetrics: { type: 'object' },
        elementStatistics: { type: 'object' },
        refinementAreas: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fea', 'mesh', 'medical-device']
}));

export const meshConvergenceTask = defineTask('mesh-convergence', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Mesh Convergence - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'FEA Verification Specialist',
      task: 'Conduct mesh convergence study',
      context: {
        deviceName: args.deviceName,
        meshGeneration: args.meshGeneration,
        boundaryConditions: args.boundaryConditions
      },
      instructions: [
        '1. Define convergence criteria',
        '2. Create multiple mesh densities',
        '3. Run convergence analyses',
        '4. Monitor key outputs',
        '5. Plot convergence trends',
        '6. Determine converged mesh',
        '7. Document convergence ratios',
        '8. Assess solution uncertainty',
        '9. Select final mesh',
        '10. Create convergence report'
      ],
      outputFormat: 'JSON object with mesh convergence results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'selectedMesh', 'convergencePlots'],
      properties: {
        results: { type: 'array', items: { type: 'object' } },
        selectedMesh: { type: 'object' },
        convergencePlots: { type: 'array', items: { type: 'string' } },
        uncertainty: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fea', 'verification', 'medical-device']
}));

export const stressStrainAnalysisTask = defineTask('stress-strain-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Stress/Strain Analysis - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Structural Analysis Engineer',
      task: 'Analyze stress and strain distribution',
      context: {
        deviceName: args.deviceName,
        meshConvergence: args.meshConvergence,
        materialModeling: args.materialModeling,
        boundaryConditions: args.boundaryConditions
      },
      instructions: [
        '1. Run stress analysis',
        '2. Extract stress results',
        '3. Identify stress concentrations',
        '4. Analyze strain distribution',
        '5. Calculate safety factors',
        '6. Assess yield criteria',
        '7. Analyze displacement results',
        '8. Document critical locations',
        '9. Create contour plots',
        '10. Document design recommendations'
      ],
      outputFormat: 'JSON object with stress analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'maxStress', 'safetyFactors', 'recommendations'],
      properties: {
        results: { type: 'object' },
        maxStress: { type: 'string' },
        safetyFactors: { type: 'object' },
        criticalLocations: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fea', 'stress-analysis', 'medical-device']
}));

export const fatigueAnalysisTask = defineTask('fatigue-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Fatigue Analysis - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Fatigue Analysis Specialist',
      task: 'Predict fatigue life of medical device',
      context: {
        deviceName: args.deviceName,
        stressAnalysis: args.stressAnalysis,
        loadingConditions: args.loadingConditions,
        materialProperties: args.materialProperties
      },
      instructions: [
        '1. Determine fatigue approach (S-N, strain-life, fracture mechanics)',
        '2. Obtain material fatigue data',
        '3. Calculate stress ranges',
        '4. Apply mean stress correction',
        '5. Identify critical fatigue locations',
        '6. Predict fatigue life',
        '7. Compare to required cycles',
        '8. Assess fatigue safety factor',
        '9. Document assumptions',
        '10. Create fatigue analysis report'
      ],
      outputFormat: 'JSON object with fatigue analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'predictedLife', 'safetyFactor'],
      properties: {
        results: { type: 'object' },
        predictedLife: { type: 'string' },
        safetyFactor: { type: 'number' },
        criticalLocations: { type: 'array', items: { type: 'object' } },
        assumptions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fea', 'fatigue', 'medical-device']
}));

export const modelValidationTask = defineTask('model-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Model Validation - ${args.deviceName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'V&V Specialist with expertise in computational modeling',
      task: 'Plan model validation against bench testing',
      context: {
        deviceName: args.deviceName,
        stressAnalysis: args.stressAnalysis,
        fatigueAnalysis: args.fatigueAnalysis,
        loadingConditions: args.loadingConditions
      },
      instructions: [
        '1. Define validation strategy per ASME V&V 40',
        '2. Identify validation experiments',
        '3. Define comparison metrics',
        '4. Plan strain gauge measurements',
        '5. Define acceptance criteria',
        '6. Document model credibility assessment',
        '7. Plan sensitivity analyses',
        '8. Document uncertainties',
        '9. Create validation protocol',
        '10. Document model limitations'
      ],
      outputFormat: 'JSON object with validation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['documentation', 'validationPlan', 'credibilityAssessment'],
      properties: {
        documentation: { type: 'object' },
        validationPlan: { type: 'object' },
        credibilityAssessment: { type: 'object' },
        limitations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fea', 'validation', 'medical-device']
}));
