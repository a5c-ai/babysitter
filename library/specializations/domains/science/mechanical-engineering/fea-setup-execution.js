/**
 * @process specializations/domains/science/mechanical-engineering/fea-setup-execution
 * @description Finite Element Analysis (FEA) Setup and Execution - Setting up structural simulations
 * including geometry preparation, mesh generation, material definition, boundary conditions, load
 * application, and solver configuration using ANSYS, Abaqus, or NASTRAN. Covers linear static,
 * thermal, and basic dynamic analyses.
 * @inputs { projectName: string, analysisType: string, cadFile: string, materials: array, loads: array }
 * @outputs { success: boolean, meshQuality: object, solverStatus: string, results: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/mechanical-engineering/fea-setup-execution', {
 *   projectName: 'Bracket Stress Analysis',
 *   analysisType: 'linear-static',
 *   cadFile: 'bracket_assembly.step',
 *   materials: [{ name: 'Steel 4140', region: 'body' }],
 *   loads: [{ type: 'force', magnitude: 5000, location: 'mounting_holes' }],
 *   constraints: [{ type: 'fixed', location: 'base_surface' }]
 * });
 *
 * @references
 * - ANSYS Mechanical Help: https://ansyshelp.ansys.com/
 * - Abaqus Documentation: https://help.3ds.com/
 * - MSC Nastran: https://hexagon.com/products/msc-nastran
 * - Practical Finite Element Analysis: https://www.wiley.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    analysisType = 'linear-static', // 'linear-static', 'thermal', 'modal', 'harmonic'
    cadFile,
    materials = [],
    loads = [],
    constraints = [],
    meshSettings = {},
    solverSettings = {},
    convergenceCriteria = {},
    outputDir = 'fea-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting FEA Setup and Execution for ${projectName}`);
  ctx.log('info', `Analysis Type: ${analysisType}`);

  // ============================================================================
  // PHASE 1: GEOMETRY IMPORT AND PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Geometry Import and Preparation');

  const geometryResult = await ctx.task(geometryPreparationTask, {
    projectName,
    cadFile,
    analysisType,
    outputDir
  });

  artifacts.push(...geometryResult.artifacts);

  ctx.log('info', `Geometry prepared - ${geometryResult.bodyCount} bodies, ${geometryResult.surfaceCount} surfaces`);

  // Breakpoint: Review geometry cleanup
  if (geometryResult.cleanupRequired) {
    await ctx.breakpoint({
      question: `Geometry cleanup required. Issues found: ${geometryResult.geometryIssues.join(', ')}. Review and approve geometry preparation?`,
      title: 'Geometry Preparation Review',
      context: {
        runId: ctx.runId,
        projectName,
        geometryIssues: geometryResult.geometryIssues,
        cleanupActions: geometryResult.cleanupActions,
        files: geometryResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 2: MESH GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Mesh Generation');

  const meshResult = await ctx.task(meshGenerationTask, {
    projectName,
    geometryResult,
    analysisType,
    meshSettings,
    outputDir
  });

  artifacts.push(...meshResult.artifacts);

  ctx.log('info', `Mesh generated - ${meshResult.nodeCount} nodes, ${meshResult.elementCount} elements`);

  // Quality Gate: Mesh quality check
  if (meshResult.qualityScore < 0.8) {
    await ctx.breakpoint({
      question: `Mesh quality score ${(meshResult.qualityScore * 100).toFixed(1)}% is below threshold. ${meshResult.poorElements} elements have poor quality. Refine mesh or proceed?`,
      title: 'Mesh Quality Warning',
      context: {
        runId: ctx.runId,
        meshStatistics: meshResult.statistics,
        qualityMetrics: meshResult.qualityMetrics,
        poorElementLocations: meshResult.poorElementLocations,
        files: meshResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 3: MATERIAL PROPERTY ASSIGNMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Material Property Assignment');

  const materialResult = await ctx.task(materialAssignmentTask, {
    projectName,
    materials,
    geometryResult,
    analysisType,
    outputDir
  });

  artifacts.push(...materialResult.artifacts);

  ctx.log('info', `Materials assigned - ${materialResult.assignedMaterials.length} materials applied`);

  // ============================================================================
  // PHASE 4: BOUNDARY CONDITIONS AND LOADS
  // ============================================================================

  ctx.log('info', 'Phase 4: Boundary Conditions and Loads Application');

  const boundaryResult = await ctx.task(boundaryConditionsTask, {
    projectName,
    constraints,
    loads,
    geometryResult,
    meshResult,
    analysisType,
    outputDir
  });

  artifacts.push(...boundaryResult.artifacts);

  ctx.log('info', `Boundary conditions applied - ${boundaryResult.constraintCount} constraints, ${boundaryResult.loadCount} loads`);

  // Breakpoint: Review boundary conditions
  await ctx.breakpoint({
    question: `Boundary conditions applied. Constraints: ${boundaryResult.constraintCount}, Loads: ${boundaryResult.loadCount}. Total DOF constrained: ${boundaryResult.constrainedDOF}. Review setup?`,
    title: 'Boundary Conditions Review',
    context: {
      runId: ctx.runId,
      constraints: boundaryResult.constraintSummary,
      loads: boundaryResult.loadSummary,
      reactionForceEstimate: boundaryResult.reactionEstimate,
      files: boundaryResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 5: SOLVER CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Solver Configuration');

  const solverConfigResult = await ctx.task(solverConfigurationTask, {
    projectName,
    analysisType,
    meshResult,
    solverSettings,
    convergenceCriteria,
    outputDir
  });

  artifacts.push(...solverConfigResult.artifacts);

  ctx.log('info', `Solver configured - ${solverConfigResult.solverType}, estimated time: ${solverConfigResult.estimatedSolveTime}`);

  // ============================================================================
  // PHASE 6: PRE-SOLVE VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Pre-Solve Validation');

  const validationResult = await ctx.task(preSolveValidationTask, {
    projectName,
    geometryResult,
    meshResult,
    materialResult,
    boundaryResult,
    solverConfigResult,
    outputDir
  });

  artifacts.push(...validationResult.artifacts);

  ctx.log('info', `Pre-solve validation complete - Status: ${validationResult.validationStatus}`);

  // Quality Gate: Validation errors
  if (validationResult.errors.length > 0) {
    await ctx.breakpoint({
      question: `Pre-solve validation found ${validationResult.errors.length} errors: ${validationResult.errors.join('; ')}. Fix errors before solving?`,
      title: 'Pre-Solve Validation Errors',
      context: {
        runId: ctx.runId,
        errors: validationResult.errors,
        warnings: validationResult.warnings,
        recommendations: validationResult.recommendations,
        files: validationResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 7: SOLVER EXECUTION
  // ============================================================================

  ctx.log('info', 'Phase 7: Solver Execution');

  const solveResult = await ctx.task(solverExecutionTask, {
    projectName,
    analysisType,
    solverConfigResult,
    outputDir
  });

  artifacts.push(...solveResult.artifacts);

  ctx.log('info', `Solver complete - Status: ${solveResult.solverStatus}, Time: ${solveResult.solveTime}`);

  // Quality Gate: Solver convergence
  if (solveResult.solverStatus !== 'converged') {
    await ctx.breakpoint({
      question: `Solver ${solveResult.solverStatus}. ${solveResult.convergenceMessage}. Review solver diagnostics?`,
      title: 'Solver Status Warning',
      context: {
        runId: ctx.runId,
        solverStatus: solveResult.solverStatus,
        convergenceHistory: solveResult.convergenceHistory,
        diagnostics: solveResult.diagnostics,
        files: solveResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 8: RESULTS EXTRACTION
  // ============================================================================

  ctx.log('info', 'Phase 8: Results Extraction');

  const resultsResult = await ctx.task(resultsExtractionTask, {
    projectName,
    analysisType,
    solveResult,
    outputDir
  });

  artifacts.push(...resultsResult.artifacts);

  ctx.log('info', `Results extracted - Max stress: ${resultsResult.maxStress} MPa, Max displacement: ${resultsResult.maxDisplacement} mm`);

  // Breakpoint: Review results
  await ctx.breakpoint({
    question: `Analysis complete. Max Von Mises Stress: ${resultsResult.maxStress} MPa, Max Displacement: ${resultsResult.maxDisplacement} mm. Review detailed results?`,
    title: 'FEA Results Review',
    context: {
      runId: ctx.runId,
      resultsSummary: resultsResult.summary,
      criticalLocations: resultsResult.criticalLocations,
      files: resultsResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 9: RESULTS VALIDATION AND REPORTING
  // ============================================================================

  ctx.log('info', 'Phase 9: Results Validation and Reporting');

  const reportResult = await ctx.task(generateFEAReportTask, {
    projectName,
    analysisType,
    geometryResult,
    meshResult,
    materialResult,
    boundaryResult,
    solveResult,
    resultsResult,
    outputDir
  });

  artifacts.push(...reportResult.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `FEA Analysis Complete for ${projectName}. Max stress: ${resultsResult.maxStress} MPa, Safety factor: ${resultsResult.safetyFactor}. Approve analysis results?`,
    title: 'FEA Analysis Complete',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        analysisType,
        maxStress: resultsResult.maxStress,
        maxDisplacement: resultsResult.maxDisplacement,
        safetyFactor: resultsResult.safetyFactor,
        meshQuality: meshResult.qualityScore
      },
      files: [
        { path: reportResult.reportPath, format: 'markdown', label: 'FEA Report' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    analysisType,
    meshQuality: {
      nodeCount: meshResult.nodeCount,
      elementCount: meshResult.elementCount,
      qualityScore: meshResult.qualityScore
    },
    solverStatus: solveResult.solverStatus,
    results: {
      maxStress: resultsResult.maxStress,
      maxDisplacement: resultsResult.maxDisplacement,
      safetyFactor: resultsResult.safetyFactor,
      criticalLocations: resultsResult.criticalLocations
    },
    outputFiles: {
      report: reportResult.reportPath,
      resultsDatabase: solveResult.resultsFile
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/science/mechanical-engineering/fea-setup-execution',
      processSlug: 'fea-setup-execution',
      category: 'mechanical-engineering',
      timestamp: startTime,
      analysisType
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const geometryPreparationTask = defineTask('geometry-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Geometry Preparation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'FEA Pre-Processing Specialist',
      task: 'Import and prepare CAD geometry for FEA',
      context: {
        projectName: args.projectName,
        cadFile: args.cadFile,
        analysisType: args.analysisType,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Import CAD geometry (STEP, IGES, or native format)',
        '2. Check for geometry errors (gaps, overlaps, slivers)',
        '3. Defeaturing: remove small fillets, holes, chamfers not affecting results',
        '4. Simplify geometry for analysis efficiency',
        '5. Create virtual topology if needed for meshing',
        '6. Split bodies/faces for load and BC application',
        '7. Define named selections for regions',
        '8. Document geometry modifications',
        '9. Verify units and scale',
        '10. Export prepared geometry'
      ],
      outputFormat: 'JSON object with geometry preparation results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'bodyCount', 'surfaceCount', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        bodyCount: { type: 'number' },
        surfaceCount: { type: 'number' },
        cleanupRequired: { type: 'boolean' },
        geometryIssues: { type: 'array', items: { type: 'string' } },
        cleanupActions: { type: 'array', items: { type: 'string' } },
        namedSelections: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'fea', 'geometry', 'pre-processing']
}));

export const meshGenerationTask = defineTask('mesh-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Mesh Generation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'FEA Meshing Specialist',
      task: 'Generate finite element mesh with appropriate quality',
      context: {
        projectName: args.projectName,
        geometryResult: args.geometryResult,
        analysisType: args.analysisType,
        meshSettings: args.meshSettings,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Select appropriate element type:',
        '   - Tetrahedral (TET4/TET10) for complex geometry',
        '   - Hexahedral (HEX8/HEX20) for prismatic shapes',
        '   - Shell elements for thin structures',
        '2. Define mesh sizing strategy:',
        '   - Global element size based on geometry',
        '   - Local refinement at stress concentrations',
        '   - Growth rate for transitions',
        '3. Apply mesh controls to critical regions',
        '4. Generate mesh with quality checks',
        '5. Evaluate mesh quality metrics:',
        '   - Aspect ratio, skewness, Jacobian',
        '6. Refine poor quality elements',
        '7. Verify mesh connectivity',
        '8. Check for free edges/faces',
        '9. Document mesh statistics',
        '10. Export mesh for solver'
      ],
      outputFormat: 'JSON object with mesh generation results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'nodeCount', 'elementCount', 'qualityScore', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        nodeCount: { type: 'number' },
        elementCount: { type: 'number' },
        elementType: { type: 'string' },
        qualityScore: { type: 'number' },
        poorElements: { type: 'number' },
        statistics: { type: 'object' },
        qualityMetrics: { type: 'object' },
        poorElementLocations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'fea', 'meshing', 'pre-processing']
}));

export const materialAssignmentTask = defineTask('material-assignment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Material Assignment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'FEA Materials Specialist',
      task: 'Define and assign material properties for FEA',
      context: {
        projectName: args.projectName,
        materials: args.materials,
        geometryResult: args.geometryResult,
        analysisType: args.analysisType,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define material models:',
        '   - Linear elastic (E, nu, rho)',
        '   - Thermal properties (k, Cp, alpha)',
        '   - Plasticity if needed (yield, hardening)',
        '2. Select appropriate material model for analysis type',
        '3. Verify material property units',
        '4. Assign materials to geometry regions',
        '5. Handle multi-material interfaces',
        '6. Define temperature-dependent properties if needed',
        '7. Set material orientation for anisotropic materials',
        '8. Document material sources and assumptions',
        '9. Verify material assignments',
        '10. Create material property report'
      ],
      outputFormat: 'JSON object with material assignment results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'assignedMaterials', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        assignedMaterials: { type: 'array' },
        materialProperties: { type: 'object' },
        materialAssignmentMap: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'fea', 'materials', 'pre-processing']
}));

export const boundaryConditionsTask = defineTask('boundary-conditions', (args, taskCtx) => ({
  kind: 'agent',
  title: `Boundary Conditions - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'FEA Boundary Conditions Specialist',
      task: 'Apply constraints and loads to FEA model',
      context: {
        projectName: args.projectName,
        constraints: args.constraints,
        loads: args.loads,
        geometryResult: args.geometryResult,
        meshResult: args.meshResult,
        analysisType: args.analysisType,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Apply displacement constraints:',
        '   - Fixed supports (all DOF constrained)',
        '   - Frictionless (normal constrained)',
        '   - Displacement specified',
        '   - Symmetry/antisymmetry',
        '2. Apply loads:',
        '   - Forces (point, distributed)',
        '   - Pressures (uniform, hydrostatic)',
        '   - Moments and torques',
        '   - Body loads (gravity, acceleration)',
        '3. Define thermal boundary conditions if thermal analysis',
        '4. Apply contact regions if needed',
        '5. Check for rigid body motion (sufficient constraints)',
        '6. Verify load magnitudes and directions',
        '7. Check for overconstrained model',
        '8. Estimate reaction forces',
        '9. Document all boundary conditions',
        '10. Create BC visualization'
      ],
      outputFormat: 'JSON object with boundary condition results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'constraintCount', 'loadCount', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        constraintCount: { type: 'number' },
        loadCount: { type: 'number' },
        constrainedDOF: { type: 'number' },
        constraintSummary: { type: 'array' },
        loadSummary: { type: 'array' },
        reactionEstimate: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'fea', 'boundary-conditions', 'pre-processing']
}));

export const solverConfigurationTask = defineTask('solver-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Solver Configuration - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'FEA Solver Specialist',
      task: 'Configure solver settings for FEA analysis',
      context: {
        projectName: args.projectName,
        analysisType: args.analysisType,
        meshResult: args.meshResult,
        solverSettings: args.solverSettings,
        convergenceCriteria: args.convergenceCriteria,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Select appropriate solver:',
        '   - Direct solver for smaller models',
        '   - Iterative solver for large models',
        '2. Configure analysis settings:',
        '   - Linear static: single load step',
        '   - Modal: number of modes, frequency range',
        '   - Thermal: steady-state or transient',
        '3. Set convergence criteria',
        '4. Configure output requests:',
        '   - Stress, strain, displacement',
        '   - Reaction forces',
        '   - Contact results if applicable',
        '5. Set memory and CPU allocation',
        '6. Configure result output frequency',
        '7. Enable solver diagnostics',
        '8. Estimate solve time',
        '9. Set restart options',
        '10. Document solver configuration'
      ],
      outputFormat: 'JSON object with solver configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'solverType', 'estimatedSolveTime', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        solverType: { type: 'string' },
        solverSettings: { type: 'object' },
        estimatedSolveTime: { type: 'string' },
        outputRequests: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'fea', 'solver', 'configuration']
}));

export const preSolveValidationTask = defineTask('pre-solve-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Pre-Solve Validation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'FEA Quality Assurance Specialist',
      task: 'Validate FEA model before solving',
      context: {
        projectName: args.projectName,
        geometryResult: args.geometryResult,
        meshResult: args.meshResult,
        materialResult: args.materialResult,
        boundaryResult: args.boundaryResult,
        solverConfigResult: args.solverConfigResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Check mesh quality metrics against thresholds',
        '2. Verify all bodies have materials assigned',
        '3. Check for unconstrained rigid body modes',
        '4. Verify boundary conditions are properly applied',
        '5. Check for conflicting boundary conditions',
        '6. Verify units consistency',
        '7. Check contact definitions if present',
        '8. Estimate model DOF and memory requirements',
        '9. Identify potential convergence issues',
        '10. Generate validation report with recommendations'
      ],
      outputFormat: 'JSON object with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'validationStatus', 'errors', 'warnings', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        validationStatus: { type: 'string' },
        errors: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        modelStatistics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'fea', 'validation', 'quality']
}));

export const solverExecutionTask = defineTask('solver-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Solver Execution - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'FEA Solver Specialist',
      task: 'Execute FEA solver and monitor convergence',
      context: {
        projectName: args.projectName,
        analysisType: args.analysisType,
        solverConfigResult: args.solverConfigResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Submit model to solver',
        '2. Monitor solver progress',
        '3. Track convergence history',
        '4. Monitor memory usage',
        '5. Check for solver warnings/errors',
        '6. Handle non-convergence if occurs',
        '7. Verify solution completed successfully',
        '8. Check energy balance (if applicable)',
        '9. Save results file',
        '10. Document solver performance'
      ],
      outputFormat: 'JSON object with solver execution results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'solverStatus', 'solveTime', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        solverStatus: { type: 'string' },
        solveTime: { type: 'string' },
        convergenceMessage: { type: 'string' },
        convergenceHistory: { type: 'array' },
        diagnostics: { type: 'object' },
        resultsFile: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'fea', 'solver', 'execution']
}));

export const resultsExtractionTask = defineTask('results-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: `Results Extraction - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'FEA Post-Processing Specialist',
      task: 'Extract and analyze FEA results',
      context: {
        projectName: args.projectName,
        analysisType: args.analysisType,
        solveResult: args.solveResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Load results database',
        '2. Extract stress results:',
        '   - Von Mises equivalent stress',
        '   - Principal stresses',
        '   - Maximum shear stress',
        '3. Extract displacement results',
        '4. Extract reaction forces',
        '5. Identify critical locations (max stress, displacement)',
        '6. Calculate safety factors',
        '7. Generate stress/displacement contour plots',
        '8. Create deformed shape visualization',
        '9. Export results data',
        '10. Create results summary'
      ],
      outputFormat: 'JSON object with results extraction'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'maxStress', 'maxDisplacement', 'safetyFactor', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        maxStress: { type: 'number' },
        maxDisplacement: { type: 'number' },
        safetyFactor: { type: 'number' },
        summary: { type: 'object' },
        criticalLocations: { type: 'array' },
        reactionForces: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'fea', 'post-processing', 'results']
}));

export const generateFEAReportTask = defineTask('generate-fea-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate FEA Report - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'FEA Documentation Specialist',
      task: 'Generate comprehensive FEA analysis report',
      context: {
        projectName: args.projectName,
        analysisType: args.analysisType,
        geometryResult: args.geometryResult,
        meshResult: args.meshResult,
        materialResult: args.materialResult,
        boundaryResult: args.boundaryResult,
        solveResult: args.solveResult,
        resultsResult: args.resultsResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create executive summary',
        '2. Document analysis objectives',
        '3. Describe model setup (geometry, mesh, materials)',
        '4. Document boundary conditions and loads',
        '5. Present solver settings and convergence',
        '6. Present results with contour plots',
        '7. Identify critical locations',
        '8. Calculate and present safety factors',
        '9. State conclusions and recommendations',
        '10. Include appendices with detailed data'
      ],
      outputFormat: 'JSON object with report path'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'reportPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        conclusions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'fea', 'reporting', 'documentation']
}));
