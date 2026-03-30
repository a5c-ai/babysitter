/**
 * @process specializations/domains/science/aerospace-engineering/fea-workflow
 * @description Comprehensive FEA workflow from CAD import through mesh generation, load application,
 * analysis execution, and results evaluation for aerospace structures.
 * @inputs { projectName: string, geometrySource: string, analysisType: string, loadCases: array, materials?: object }
 * @outputs { success: boolean, meshQuality: object, analysisResults: object, validationReport: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/aerospace-engineering/fea-workflow', {
 *   projectName: 'Wing Box Stress Analysis',
 *   geometrySource: 'cad/wing_box.step',
 *   analysisType: 'linear-static',
 *   loadCases: ['limit-load', 'ultimate-load', 'fatigue-spectrum'],
 *   materials: { primary: 'Al-7075-T6', secondary: 'Ti-6Al-4V' }
 * });
 *
 * @references
 * - NASTRAN Analysis Guide
 * - ANSYS Mechanical User's Guide
 * - NASA Structural Analysis Guidelines
 * - FAR/CS 25.305-307 Structural Requirements
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    geometrySource,
    analysisType,
    loadCases,
    materials = {}
  } = inputs;

  // Phase 1: Geometry Import and Preparation
  const geometryPrep = await ctx.task(feaGeometryPrepTask, {
    projectName,
    geometrySource,
    analysisType
  });

  // Phase 2: Material Definition
  const materialDefinition = await ctx.task(materialDefinitionTask, {
    projectName,
    materials,
    analysisType,
    temperatureRange: inputs.temperatureRange
  });

  // Phase 3: Mesh Generation Strategy
  const meshStrategy = await ctx.task(feaMeshStrategyTask, {
    projectName,
    geometry: geometryPrep,
    analysisType,
    accuracyRequirements: inputs.accuracyRequirements
  });

  // Breakpoint: Mesh strategy review
  await ctx.breakpoint({
    question: `Review mesh strategy for ${projectName}. Estimated elements: ${meshStrategy.estimatedElements}. Proceed with meshing?`,
    title: 'FEA Mesh Strategy Review',
    context: {
      runId: ctx.runId,
      meshStrategy,
      qualityTargets: meshStrategy.qualityTargets
    }
  });

  // Phase 4: Mesh Generation
  const meshGeneration = await ctx.task(feaMeshGenerationTask, {
    projectName,
    geometry: geometryPrep,
    meshStrategy
  });

  // Quality Gate: Mesh quality
  if (meshGeneration.qualityMetrics.worstJacobian < 0.3) {
    await ctx.breakpoint({
      question: `Mesh quality issue: worst Jacobian ${meshGeneration.qualityMetrics.worstJacobian}. Remesh or accept?`,
      title: 'Mesh Quality Warning',
      context: {
        runId: ctx.runId,
        qualityMetrics: meshGeneration.qualityMetrics
      }
    });
  }

  // Phase 5: Boundary Conditions and Constraints
  const boundaryConditions = await ctx.task(boundaryConditionsTask, {
    projectName,
    mesh: meshGeneration,
    loadCases,
    constraintDefinitions: inputs.constraintDefinitions
  });

  // Phase 6: Load Application
  const loadApplication = await ctx.task(loadApplicationTask, {
    projectName,
    mesh: meshGeneration,
    loadCases,
    boundaryConditions
  });

  // Phase 7: Analysis Execution
  const analysisExecution = await ctx.task(feaAnalysisExecutionTask, {
    projectName,
    mesh: meshGeneration,
    materials: materialDefinition,
    boundaryConditions,
    loadApplication,
    analysisType
  });

  // Phase 8: Results Post-Processing
  const postProcessing = await ctx.task(feaPostProcessingTask, {
    projectName,
    analysisResults: analysisExecution,
    loadCases,
    criticalLocations: inputs.criticalLocations
  });

  // Phase 9: Margin of Safety Calculation
  const marginCalculation = await ctx.task(marginCalculationTask, {
    projectName,
    stressResults: postProcessing.stressResults,
    materials: materialDefinition,
    loadCases
  });

  // Phase 10: Validation and Verification
  const validation = await ctx.task(feaValidationTask, {
    projectName,
    analysisResults: analysisExecution,
    postProcessing,
    marginCalculation,
    validationCriteria: inputs.validationCriteria
  });

  // Phase 11: Report Generation
  const reportGeneration = await ctx.task(feaReportTask, {
    projectName,
    geometryPrep,
    meshGeneration,
    materialDefinition,
    analysisExecution,
    postProcessing,
    marginCalculation,
    validation
  });

  // Final Breakpoint: Results Approval
  await ctx.breakpoint({
    question: `FEA analysis complete for ${projectName}. Minimum MS: ${marginCalculation.minimumMargin}. Approve results?`,
    title: 'FEA Results Approval',
    context: {
      runId: ctx.runId,
      summary: {
        maxStress: postProcessing.maxStress,
        maxDisplacement: postProcessing.maxDisplacement,
        minimumMargin: marginCalculation.minimumMargin,
        validationStatus: validation.status
      },
      files: [
        { path: 'artifacts/fea-report.json', format: 'json', content: reportGeneration },
        { path: 'artifacts/fea-report.md', format: 'markdown', content: reportGeneration.markdown }
      ]
    }
  });

  return {
    success: true,
    projectName,
    meshQuality: meshGeneration.qualityMetrics,
    analysisResults: {
      stressResults: postProcessing.stressResults,
      displacements: postProcessing.displacements,
      reactions: postProcessing.reactions
    },
    margins: marginCalculation,
    validationReport: validation,
    report: reportGeneration,
    metadata: {
      processId: 'specializations/domains/science/aerospace-engineering/fea-workflow',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions (abbreviated for space - following same pattern)

export const feaGeometryPrepTask = defineTask('fea-geometry-prep', (args, taskCtx) => ({
  kind: 'agent',
  title: `Geometry Preparation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Structural Analysis Engineer specializing in FEA model preparation',
      task: 'Prepare CAD geometry for finite element analysis',
      context: args,
      instructions: [
        '1. Import CAD geometry and verify integrity',
        '2. Simplify geometry for analysis (defeaturing)',
        '3. Create midsurfaces for thin structures',
        '4. Partition geometry for mesh control',
        '5. Identify structural joints and connections',
        '6. Define named selections for loads and constraints',
        '7. Check geometry for mesh compatibility',
        '8. Create virtual topology if needed',
        '9. Document geometry modifications',
        '10. Export prepared geometry for meshing'
      ],
      outputFormat: 'JSON object with prepared geometry details'
    },
    outputSchema: {
      type: 'object',
      required: ['geometryValid', 'modifications'],
      properties: {
        geometryValid: { type: 'boolean' },
        modifications: { type: 'array', items: { type: 'string' } },
        namedSelections: { type: 'array', items: { type: 'object' } },
        geometryStatistics: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fea', 'geometry', 'preprocessing', 'aerospace']
}));

export const materialDefinitionTask = defineTask('material-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Material Definition - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Materials Engineer for aerospace structural analysis',
      task: 'Define material properties for FEA',
      context: args,
      instructions: [
        '1. Define elastic properties (E, nu, G)',
        '2. Define density and thermal properties',
        '3. Define yield and ultimate strengths',
        '4. Define allowables per design standards (A/B basis)',
        '5. Include temperature-dependent properties if needed',
        '6. Define fatigue properties (S-N curves)',
        '7. Define fracture properties (Kc, da/dN)',
        '8. Apply knockdown factors as required',
        '9. Document material specifications',
        '10. Create material cards for solver'
      ],
      outputFormat: 'JSON object with material definitions'
    },
    outputSchema: {
      type: 'object',
      required: ['materials', 'allowables'],
      properties: {
        materials: { type: 'array', items: { type: 'object' } },
        allowables: { type: 'object' },
        temperatureDependency: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fea', 'materials', 'aerospace']
}));

export const feaMeshStrategyTask = defineTask('fea-mesh-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Mesh Strategy - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'FEA Mesh Specialist',
      task: 'Develop meshing strategy for structural analysis',
      context: args,
      instructions: [
        '1. Select element types for each structural region',
        '2. Define mesh density requirements',
        '3. Establish refinement zones at stress concentrations',
        '4. Define element size transitions',
        '5. Set mesh quality criteria',
        '6. Plan contact and connection modeling',
        '7. Estimate computational requirements',
        '8. Plan mesh convergence study',
        '9. Define mesh controls for critical features',
        '10. Document meshing approach'
      ],
      outputFormat: 'JSON object with mesh strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['estimatedElements', 'qualityTargets'],
      properties: {
        estimatedElements: { type: 'number' },
        elementTypes: { type: 'object' },
        sizingControls: { type: 'array', items: { type: 'object' } },
        qualityTargets: { type: 'object' },
        refinementZones: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fea', 'meshing', 'strategy', 'aerospace']
}));

export const feaMeshGenerationTask = defineTask('fea-mesh-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Mesh Generation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'FEA Mesh Generation Engineer',
      task: 'Generate finite element mesh',
      context: args,
      instructions: [
        '1. Generate surface mesh on all faces',
        '2. Generate volume mesh with specified elements',
        '3. Create inflation layers at contact surfaces',
        '4. Apply local mesh refinement',
        '5. Check and repair mesh quality issues',
        '6. Verify node and element connectivity',
        '7. Generate mesh quality statistics',
        '8. Verify mesh continuity at interfaces',
        '9. Create mesh groups for post-processing',
        '10. Export mesh in solver format'
      ],
      outputFormat: 'JSON object with mesh generation results'
    },
    outputSchema: {
      type: 'object',
      required: ['elementCount', 'qualityMetrics'],
      properties: {
        elementCount: { type: 'number' },
        nodeCount: { type: 'number' },
        qualityMetrics: {
          type: 'object',
          properties: {
            worstJacobian: { type: 'number' },
            worstAspectRatio: { type: 'number' },
            averageQuality: { type: 'number' }
          }
        },
        elementTypes: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fea', 'meshing', 'generation', 'aerospace']
}));

export const boundaryConditionsTask = defineTask('boundary-conditions', (args, taskCtx) => ({
  kind: 'agent',
  title: `Boundary Conditions - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Structural Analysis Engineer',
      task: 'Define boundary conditions and constraints',
      context: args,
      instructions: [
        '1. Define support conditions (fixed, pinned, roller)',
        '2. Apply symmetry boundary conditions',
        '3. Define contact interfaces',
        '4. Apply multi-point constraints (MPCs)',
        '5. Define rigid elements for load introduction',
        '6. Verify kinematic stability',
        '7. Check for overconstrained conditions',
        '8. Document boundary condition rationale',
        '9. Create constraint sets for each load case',
        '10. Verify constraint reaction directions'
      ],
      outputFormat: 'JSON object with boundary conditions'
    },
    outputSchema: {
      type: 'object',
      required: ['constraints', 'contacts'],
      properties: {
        constraints: { type: 'array', items: { type: 'object' } },
        contacts: { type: 'array', items: { type: 'object' } },
        mpcs: { type: 'array', items: { type: 'object' } },
        stabilityCheck: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fea', 'boundary-conditions', 'aerospace']
}));

export const loadApplicationTask = defineTask('load-application', (args, taskCtx) => ({
  kind: 'agent',
  title: `Load Application - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Loads Engineer for aerospace structures',
      task: 'Apply loads to finite element model',
      context: args,
      instructions: [
        '1. Apply distributed pressure loads',
        '2. Apply concentrated forces at load points',
        '3. Apply moments and torques',
        '4. Apply inertia loads (gravity, acceleration)',
        '5. Apply thermal loads if required',
        '6. Define load combinations',
        '7. Apply load factors per certification requirements',
        '8. Verify load balance and equilibrium',
        '9. Document load sources and assumptions',
        '10. Create load sets for each case'
      ],
      outputFormat: 'JSON object with load application details'
    },
    outputSchema: {
      type: 'object',
      required: ['loadCases', 'loadBalance'],
      properties: {
        loadCases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              loads: { type: 'array', items: { type: 'object' } },
              factor: { type: 'number' }
            }
          }
        },
        loadBalance: { type: 'object' },
        loadSummary: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fea', 'loads', 'aerospace']
}));

export const feaAnalysisExecutionTask = defineTask('fea-analysis-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analysis Execution - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'FEA Solver Engineer',
      task: 'Execute finite element analysis',
      context: args,
      instructions: [
        '1. Configure solver parameters',
        '2. Set convergence criteria for nonlinear analysis',
        '3. Execute analysis for all load cases',
        '4. Monitor solution progress and convergence',
        '5. Check for warnings and errors',
        '6. Verify reaction force balance',
        '7. Extract modal results if applicable',
        '8. Document computational resources used',
        '9. Archive solution files',
        '10. Generate solution summary'
      ],
      outputFormat: 'JSON object with analysis execution results'
    },
    outputSchema: {
      type: 'object',
      required: ['converged', 'loadCaseResults'],
      properties: {
        converged: { type: 'boolean' },
        loadCaseResults: { type: 'array', items: { type: 'object' } },
        computationTime: { type: 'number' },
        warnings: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fea', 'analysis', 'execution', 'aerospace']
}));

export const feaPostProcessingTask = defineTask('fea-post-processing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Post-Processing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Structural Post-Processing Engineer',
      task: 'Extract and process FEA results',
      context: args,
      instructions: [
        '1. Extract stress results (von Mises, principal, component)',
        '2. Extract displacement results',
        '3. Extract reaction forces',
        '4. Identify maximum stress locations',
        '5. Extract stress at critical locations',
        '6. Generate stress contour plots',
        '7. Extract load path data',
        '8. Calculate stress concentration factors',
        '9. Generate results tables',
        '10. Document peak values and locations'
      ],
      outputFormat: 'JSON object with post-processing results'
    },
    outputSchema: {
      type: 'object',
      required: ['stressResults', 'maxStress', 'maxDisplacement'],
      properties: {
        maxStress: { type: 'number' },
        maxDisplacement: { type: 'number' },
        stressResults: { type: 'object' },
        displacements: { type: 'object' },
        reactions: { type: 'object' },
        criticalLocations: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fea', 'post-processing', 'aerospace']
}));

export const marginCalculationTask = defineTask('margin-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Margin of Safety Calculation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Structural Strength Engineer',
      task: 'Calculate margins of safety',
      context: args,
      instructions: [
        '1. Calculate yield margin of safety',
        '2. Calculate ultimate margin of safety',
        '3. Calculate buckling margin if applicable',
        '4. Apply appropriate failure criteria',
        '5. Calculate bearing and shear margins',
        '6. Account for fitting factors',
        '7. Apply environmental factors',
        '8. Identify critical margins',
        '9. Document all margin calculations',
        '10. Generate margin summary table'
      ],
      outputFormat: 'JSON object with margin calculations'
    },
    outputSchema: {
      type: 'object',
      required: ['minimumMargin', 'margins'],
      properties: {
        minimumMargin: { type: 'number' },
        margins: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              location: { type: 'string' },
              loadCase: { type: 'string' },
              yieldMS: { type: 'number' },
              ultimateMS: { type: 'number' }
            }
          }
        },
        criticalMargin: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fea', 'margins', 'aerospace']
}));

export const feaValidationTask = defineTask('fea-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `FEA Validation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'FEA Validation Engineer',
      task: 'Validate finite element analysis results',
      context: args,
      instructions: [
        '1. Verify mesh convergence',
        '2. Check equilibrium and reaction balance',
        '3. Verify stress continuity',
        '4. Compare with hand calculations',
        '5. Compare with test data if available',
        '6. Verify boundary condition effects',
        '7. Check strain energy distribution',
        '8. Validate against similar analyses',
        '9. Document validation evidence',
        '10. Provide validation status'
      ],
      outputFormat: 'JSON object with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'validationChecks'],
      properties: {
        status: { type: 'string', enum: ['validated', 'conditional', 'failed'] },
        validationChecks: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fea', 'validation', 'aerospace']
}));

export const feaReportTask = defineTask('fea-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `FEA Report - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Structural Analysis Report Engineer',
      task: 'Generate FEA analysis report',
      context: args,
      instructions: [
        '1. Create executive summary',
        '2. Document model description and geometry',
        '3. Present mesh details and quality',
        '4. Document materials and properties',
        '5. Present loads and boundary conditions',
        '6. Present stress and displacement results',
        '7. Present margin calculations',
        '8. Include validation evidence',
        '9. Provide conclusions and recommendations',
        '10. Generate JSON and markdown formats'
      ],
      outputFormat: 'JSON object with complete FEA report'
    },
    outputSchema: {
      type: 'object',
      required: ['report', 'markdown'],
      properties: {
        report: {
          type: 'object',
          properties: {
            executiveSummary: { type: 'string' },
            modelDescription: { type: 'object' },
            results: { type: 'object' },
            margins: { type: 'object' },
            conclusions: { type: 'array', items: { type: 'string' } }
          }
        },
        markdown: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['fea', 'reporting', 'aerospace']
}));
