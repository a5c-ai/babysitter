/**
 * @process specializations/domains/science/mechanical-engineering/nonlinear-structural-analysis
 * @description Nonlinear Structural Analysis - Advanced FEA for large deformation, contact, material
 * nonlinearity, and buckling analysis using appropriate element types, solution controls, and
 * convergence criteria.
 * @inputs { projectName: string, nonlinearityType: array, cadFile: string, materials: array, loads: array }
 * @outputs { success: boolean, convergenceStatus: string, results: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/mechanical-engineering/nonlinear-structural-analysis', {
 *   projectName: 'Rubber Seal Compression',
 *   nonlinearityType: ['geometric', 'material', 'contact'],
 *   cadFile: 'seal_assembly.step',
 *   materials: [{ name: 'Silicone', model: 'Mooney-Rivlin', C10: 0.3, C01: 0.03 }],
 *   loads: [{ type: 'displacement', magnitude: 2.0 }]
 * });
 *
 * @references
 * - Nonlinear Finite Elements for Continua and Structures: https://www.wiley.com/
 * - ANSYS Nonlinear Analysis: https://ansyshelp.ansys.com/
 * - Abaqus Analysis User's Manual
 * - The Finite Element Method for Solid and Structural Mechanics: Zienkiewicz
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    nonlinearityType = ['geometric'], // 'geometric', 'material', 'contact', 'boundary'
    cadFile,
    materials = [],
    loads = [],
    constraints = [],
    contactPairs = [],
    solverSettings = {},
    outputDir = 'nonlinear-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Nonlinear Structural Analysis for ${projectName}`);
  ctx.log('info', `Nonlinearity Types: ${nonlinearityType.join(', ')}`);

  // ============================================================================
  // PHASE 1: GEOMETRY AND MESH PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Geometry and Mesh Preparation');

  const meshResult = await ctx.task(nonlinearMeshTask, {
    projectName,
    cadFile,
    nonlinearityType,
    contactPairs,
    outputDir
  });

  artifacts.push(...meshResult.artifacts);

  ctx.log('info', `Mesh prepared - ${meshResult.elementCount} elements, ${meshResult.elementType} elements`);

  // ============================================================================
  // PHASE 2: MATERIAL MODEL DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 2: Material Model Definition');

  const materialResult = await ctx.task(nonlinearMaterialTask, {
    projectName,
    materials,
    nonlinearityType,
    outputDir
  });

  artifacts.push(...materialResult.artifacts);

  ctx.log('info', `Material models defined - ${materialResult.materialCount} materials`);

  // Breakpoint: Review material models
  if (nonlinearityType.includes('material')) {
    await ctx.breakpoint({
      question: `Material nonlinearity included. Models: ${materialResult.materialModels.join(', ')}. Material stability verified: ${materialResult.stabilityVerified}. Review material definitions?`,
      title: 'Material Model Review',
      context: {
        runId: ctx.runId,
        materialModels: materialResult.materialModels,
        materialParameters: materialResult.parameters,
        files: materialResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 3: CONTACT DEFINITION
  // ============================================================================

  let contactResult = null;
  if (nonlinearityType.includes('contact')) {
    ctx.log('info', 'Phase 3: Contact Definition');

    contactResult = await ctx.task(contactDefinitionTask, {
      projectName,
      meshResult,
      contactPairs,
      outputDir
    });

    artifacts.push(...contactResult.artifacts);

    ctx.log('info', `Contact defined - ${contactResult.contactPairCount} pairs`);
  }

  // ============================================================================
  // PHASE 4: BOUNDARY CONDITIONS AND LOADING
  // ============================================================================

  ctx.log('info', 'Phase 4: Boundary Conditions and Loading');

  const boundaryResult = await ctx.task(nonlinearBoundaryTask, {
    projectName,
    constraints,
    loads,
    meshResult,
    outputDir
  });

  artifacts.push(...boundaryResult.artifacts);

  ctx.log('info', `Boundary conditions applied - ${boundaryResult.loadSteps} load steps defined`);

  // ============================================================================
  // PHASE 5: SOLVER CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Nonlinear Solver Configuration');

  const solverResult = await ctx.task(nonlinearSolverConfigTask, {
    projectName,
    nonlinearityType,
    meshResult,
    boundaryResult,
    solverSettings,
    outputDir
  });

  artifacts.push(...solverResult.artifacts);

  ctx.log('info', `Solver configured - Method: ${solverResult.solutionMethod}`);

  // ============================================================================
  // PHASE 6: SOLVER EXECUTION
  // ============================================================================

  ctx.log('info', 'Phase 6: Nonlinear Solver Execution');

  const solveResult = await ctx.task(nonlinearSolveTask, {
    projectName,
    solverResult,
    outputDir
  });

  artifacts.push(...solveResult.artifacts);

  ctx.log('info', `Solver complete - Status: ${solveResult.convergenceStatus}`);

  // Quality Gate: Convergence issues
  if (solveResult.convergenceStatus !== 'converged') {
    await ctx.breakpoint({
      question: `Solver ${solveResult.convergenceStatus}. ${solveResult.convergenceMessage}. Last converged load: ${solveResult.lastConvergedLoad * 100}%. Review solver diagnostics and adjust?`,
      title: 'Convergence Issue',
      context: {
        runId: ctx.runId,
        convergenceStatus: solveResult.convergenceStatus,
        convergenceHistory: solveResult.convergenceHistory,
        diagnostics: solveResult.diagnostics,
        suggestions: solveResult.suggestions,
        files: solveResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 7: BUCKLING ANALYSIS (IF APPLICABLE)
  // ============================================================================

  let bucklingResult = null;
  if (nonlinearityType.includes('buckling')) {
    ctx.log('info', 'Phase 7: Buckling Analysis');

    bucklingResult = await ctx.task(bucklingAnalysisTask, {
      projectName,
      meshResult,
      solveResult,
      outputDir
    });

    artifacts.push(...bucklingResult.artifacts);

    ctx.log('info', `Buckling analysis complete - Critical load factor: ${bucklingResult.criticalLoadFactor}`);
  }

  // ============================================================================
  // PHASE 8: RESULTS EXTRACTION
  // ============================================================================

  ctx.log('info', 'Phase 8: Results Extraction');

  const resultsResult = await ctx.task(nonlinearResultsTask, {
    projectName,
    solveResult,
    nonlinearityType,
    contactResult,
    bucklingResult,
    outputDir
  });

  artifacts.push(...resultsResult.artifacts);

  ctx.log('info', `Results extracted - Max stress: ${resultsResult.maxStress} MPa`);

  // Breakpoint: Review results
  await ctx.breakpoint({
    question: `Nonlinear analysis complete. Max stress: ${resultsResult.maxStress} MPa, Max strain: ${resultsResult.maxStrain}, Max displacement: ${resultsResult.maxDisplacement} mm. Review results?`,
    title: 'Nonlinear Results Review',
    context: {
      runId: ctx.runId,
      resultsSummary: resultsResult.summary,
      loadDisplacementCurve: resultsResult.loadDisplacementCurve,
      contactResults: resultsResult.contactResults,
      files: resultsResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 9: GENERATE REPORT
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating Nonlinear Analysis Report');

  const reportResult = await ctx.task(generateNonlinearReportTask, {
    projectName,
    nonlinearityType,
    meshResult,
    materialResult,
    contactResult,
    boundaryResult,
    solverResult,
    solveResult,
    bucklingResult,
    resultsResult,
    outputDir
  });

  artifacts.push(...reportResult.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Nonlinear Analysis Complete for ${projectName}. Convergence: ${solveResult.convergenceStatus}. Max stress: ${resultsResult.maxStress} MPa. Approve analysis?`,
    title: 'Nonlinear Analysis Complete',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        nonlinearityTypes: nonlinearityType,
        convergenceStatus: solveResult.convergenceStatus,
        maxStress: resultsResult.maxStress,
        maxDisplacement: resultsResult.maxDisplacement
      },
      files: [
        { path: reportResult.reportPath, format: 'markdown', label: 'Nonlinear Report' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    nonlinearityType,
    convergenceStatus: solveResult.convergenceStatus,
    results: {
      maxStress: resultsResult.maxStress,
      maxStrain: resultsResult.maxStrain,
      maxDisplacement: resultsResult.maxDisplacement,
      contactPressure: resultsResult.contactResults?.maxPressure,
      bucklingLoadFactor: bucklingResult?.criticalLoadFactor
    },
    outputFiles: {
      report: reportResult.reportPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/science/mechanical-engineering/nonlinear-structural-analysis',
      processSlug: 'nonlinear-structural-analysis',
      category: 'mechanical-engineering',
      timestamp: startTime,
      nonlinearityType
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const nonlinearMeshTask = defineTask('nonlinear-mesh', (args, taskCtx) => ({
  kind: 'agent',
  title: `Nonlinear Mesh - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'FEA Specialist',
      task: 'Prepare mesh for nonlinear analysis',
      context: {
        projectName: args.projectName,
        cadFile: args.cadFile,
        nonlinearityType: args.nonlinearityType,
        contactPairs: args.contactPairs,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Import and prepare geometry',
        '2. Select appropriate element types:',
        '   - Reduced integration for large deformation',
        '   - Full integration for contact accuracy',
        '   - Hybrid elements for incompressibility',
        '3. Mesh with appropriate density at:',
        '   - Contact surfaces',
        '   - High strain regions',
        '   - Geometric discontinuities',
        '4. Check element quality for nonlinear:',
        '   - Aspect ratio < 5',
        '   - Jacobian > 0.5',
        '5. Avoid highly distorted elements',
        '6. Ensure mesh continuity at interfaces',
        '7. Create element quality report'
      ],
      outputFormat: 'JSON object with mesh results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'elementCount', 'elementType', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        nodeCount: { type: 'number' },
        elementCount: { type: 'number' },
        elementType: { type: 'string' },
        qualityMetrics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'nonlinear', 'meshing']
}));

export const nonlinearMaterialTask = defineTask('nonlinear-material', (args, taskCtx) => ({
  kind: 'agent',
  title: `Nonlinear Material - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Materials Specialist',
      task: 'Define nonlinear material models',
      context: {
        projectName: args.projectName,
        materials: args.materials,
        nonlinearityType: args.nonlinearityType,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Select appropriate material model:',
        '   Metals: Elastic-plastic with hardening',
        '   Rubber: Mooney-Rivlin, Ogden, Neo-Hookean',
        '   Plastics: Viscoelastic, Viscoplastic',
        '2. Define yield criterion (Von Mises, Tresca)',
        '3. Specify hardening law (isotropic, kinematic)',
        '4. Input stress-strain curve data',
        '5. For hyperelastic: fit material constants',
        '6. Verify material stability (Drucker stability)',
        '7. Check incompressibility handling',
        '8. Document material data sources',
        '9. Validate model against test data'
      ],
      outputFormat: 'JSON object with material definitions'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'materialCount', 'materialModels', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        materialCount: { type: 'number' },
        materialModels: { type: 'array' },
        parameters: { type: 'object' },
        stabilityVerified: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'nonlinear', 'materials']
}));

export const contactDefinitionTask = defineTask('contact-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Contact Definition - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Contact Analysis Specialist',
      task: 'Define contact interactions',
      context: {
        projectName: args.projectName,
        meshResult: args.meshResult,
        contactPairs: args.contactPairs,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify contact surfaces (master/slave)',
        '2. Select contact formulation:',
        '   - Penalty method (faster)',
        '   - Augmented Lagrangian (more accurate)',
        '   - Pure Lagrangian (exact constraint)',
        '3. Define contact properties:',
        '   - Friction coefficient',
        '   - Normal behavior (hard, soft)',
        '   - Contact stiffness',
        '4. Handle initial penetration',
        '5. Set contact detection parameters',
        '6. Define contact stabilization if needed',
        '7. Check mesh compatibility at interface',
        '8. Document contact assumptions'
      ],
      outputFormat: 'JSON object with contact definitions'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'contactPairCount', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        contactPairCount: { type: 'number' },
        contactFormulation: { type: 'string' },
        frictionModel: { type: 'string' },
        contactSettings: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'nonlinear', 'contact']
}));

export const nonlinearBoundaryTask = defineTask('nonlinear-boundary', (args, taskCtx) => ({
  kind: 'agent',
  title: `Nonlinear Boundary Conditions - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'FEA Specialist',
      task: 'Define boundary conditions and load stepping',
      context: {
        projectName: args.projectName,
        constraints: args.constraints,
        loads: args.loads,
        meshResult: args.meshResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Apply displacement constraints',
        '2. Define load steps for gradual application:',
        '   - Start with small increments',
        '   - Increase as solution stabilizes',
        '3. Handle follower loads if applicable',
        '4. Define time-dependent loads if needed',
        '5. Set up load ramping',
        '6. Consider automatic time stepping',
        '7. Define output intervals',
        '8. Document loading sequence'
      ],
      outputFormat: 'JSON object with boundary conditions'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'loadSteps', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        loadSteps: { type: 'number' },
        loadingSequence: { type: 'array' },
        constraintCount: { type: 'number' },
        loadCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'nonlinear', 'boundary-conditions']
}));

export const nonlinearSolverConfigTask = defineTask('nonlinear-solver-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Nonlinear Solver Config - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'FEA Solver Specialist',
      task: 'Configure nonlinear solver settings',
      context: {
        projectName: args.projectName,
        nonlinearityType: args.nonlinearityType,
        meshResult: args.meshResult,
        boundaryResult: args.boundaryResult,
        solverSettings: args.solverSettings,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Select solution method:',
        '   - Newton-Raphson (standard)',
        '   - Modified Newton-Raphson',
        '   - Arc-length (for snap-through/buckling)',
        '2. Set convergence criteria:',
        '   - Force residual tolerance',
        '   - Displacement increment tolerance',
        '   - Energy tolerance',
        '3. Configure time stepping:',
        '   - Initial increment',
        '   - Minimum/maximum increment',
        '   - Automatic bisection',
        '4. Set iteration limits',
        '5. Enable line search if needed',
        '6. Configure matrix update frequency',
        '7. Set memory and CPU allocation'
      ],
      outputFormat: 'JSON object with solver configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'solutionMethod', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        solutionMethod: { type: 'string' },
        convergenceCriteria: { type: 'object' },
        timeSteppingSettings: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'nonlinear', 'solver']
}));

export const nonlinearSolveTask = defineTask('nonlinear-solve', (args, taskCtx) => ({
  kind: 'agent',
  title: `Nonlinear Solve - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'FEA Solver Specialist',
      task: 'Execute nonlinear solver',
      context: {
        projectName: args.projectName,
        solverResult: args.solverResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Submit analysis to solver',
        '2. Monitor convergence:',
        '   - Residual norm',
        '   - Correction norm',
        '   - Energy norm',
        '3. Track load factor progress',
        '4. Identify convergence difficulties:',
        '   - Material instability',
        '   - Contact chattering',
        '   - Rigid body motion',
        '5. Apply automatic cutbacks if needed',
        '6. Record convergence history',
        '7. Save intermediate results',
        '8. Generate convergence diagnostics'
      ],
      outputFormat: 'JSON object with solve results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'convergenceStatus', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        convergenceStatus: { type: 'string' },
        convergenceMessage: { type: 'string' },
        lastConvergedLoad: { type: 'number' },
        iterationCount: { type: 'number' },
        convergenceHistory: { type: 'array' },
        diagnostics: { type: 'object' },
        suggestions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'nonlinear', 'solver-execution']
}));

export const bucklingAnalysisTask = defineTask('buckling-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Buckling Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Structural Stability Specialist',
      task: 'Perform buckling analysis',
      context: {
        projectName: args.projectName,
        meshResult: args.meshResult,
        solveResult: args.solveResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Select buckling analysis type:',
        '   - Linear eigenvalue buckling',
        '   - Nonlinear buckling (arc-length)',
        '2. Solve eigenvalue problem for buckling modes',
        '3. Extract critical load factors',
        '4. Extract buckling mode shapes',
        '5. Include imperfection sensitivity if needed',
        '6. Calculate post-buckling response',
        '7. Identify buckling mode type (global, local)',
        '8. Plot buckling mode shapes',
        '9. Calculate safety factor against buckling'
      ],
      outputFormat: 'JSON object with buckling results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'criticalLoadFactor', 'bucklingModes', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        criticalLoadFactor: { type: 'number' },
        bucklingModes: { type: 'array' },
        modeCount: { type: 'number' },
        bucklingType: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'nonlinear', 'buckling']
}));

export const nonlinearResultsTask = defineTask('nonlinear-results', (args, taskCtx) => ({
  kind: 'agent',
  title: `Nonlinear Results - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'FEA Post-Processing Specialist',
      task: 'Extract nonlinear analysis results',
      context: {
        projectName: args.projectName,
        solveResult: args.solveResult,
        nonlinearityType: args.nonlinearityType,
        contactResult: args.contactResult,
        bucklingResult: args.bucklingResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Extract stress results at final load',
        '2. Extract true (Cauchy) stress if large deformation',
        '3. Extract logarithmic strain',
        '4. Create load-displacement curve',
        '5. Extract plastic strain distribution',
        '6. For contact: extract contact pressure, status, slip',
        '7. Create stress contour plots',
        '8. Create deformed shape animation',
        '9. Calculate energy quantities',
        '10. Identify critical locations'
      ],
      outputFormat: 'JSON object with nonlinear results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'maxStress', 'maxStrain', 'maxDisplacement', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        maxStress: { type: 'number' },
        maxStrain: { type: 'number' },
        maxDisplacement: { type: 'number' },
        maxPlasticStrain: { type: 'number' },
        loadDisplacementCurve: { type: 'array' },
        contactResults: { type: 'object' },
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'nonlinear', 'results']
}));

export const generateNonlinearReportTask = defineTask('generate-nonlinear-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Nonlinear Report - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Documentation Specialist',
      task: 'Generate comprehensive nonlinear analysis report',
      context: {
        projectName: args.projectName,
        nonlinearityType: args.nonlinearityType,
        meshResult: args.meshResult,
        materialResult: args.materialResult,
        contactResult: args.contactResult,
        boundaryResult: args.boundaryResult,
        solverResult: args.solverResult,
        solveResult: args.solveResult,
        bucklingResult: args.bucklingResult,
        resultsResult: args.resultsResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create executive summary',
        '2. Document nonlinearities included',
        '3. Present mesh and material models',
        '4. Document contact definitions',
        '5. Show boundary conditions and loading',
        '6. Present convergence history',
        '7. Show load-displacement curve',
        '8. Present stress and strain results',
        '9. Include buckling results if applicable',
        '10. State conclusions and recommendations'
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
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'nonlinear', 'reporting']
}));
