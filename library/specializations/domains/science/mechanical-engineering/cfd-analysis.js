/**
 * @process specializations/domains/science/mechanical-engineering/cfd-analysis
 * @description Computational Fluid Dynamics (CFD) Analysis - Setting up and executing fluid flow
 * simulations including mesh generation, turbulence modeling, boundary conditions, and post-processing
 * using ANSYS Fluent, CFX, or OpenFOAM.
 * @inputs { projectName: string, flowType: string, geometry: string, fluidProperties: object, boundaryConditions: array }
 * @outputs { success: boolean, flowResults: object, pressureDrop: number, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/mechanical-engineering/cfd-analysis', {
 *   projectName: 'Heat Exchanger Flow Analysis',
 *   flowType: 'internal',
 *   geometry: 'exchanger_domain.step',
 *   fluidProperties: { name: 'water', density: 998, viscosity: 0.001 },
 *   boundaryConditions: [{ type: 'velocity-inlet', value: 2.0 }, { type: 'pressure-outlet', value: 0 }]
 * });
 *
 * @references
 * - OpenFOAM User Guide: https://www.openfoam.com/
 * - ANSYS Fluent Theory Guide: https://ansyshelp.ansys.com/
 * - Versteeg & Malalasekera: Introduction to CFD
 * - Turbulence Modeling for CFD: https://www.dcwindustries.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    flowType = 'internal', // 'internal', 'external', 'multiphase', 'heat-transfer'
    geometry,
    fluidProperties = {},
    boundaryConditions = [],
    turbulenceModel = 'k-epsilon',
    steadyState = true,
    includeThermal = false,
    meshSettings = {},
    solverSettings = {},
    outputDir = 'cfd-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting CFD Analysis for ${projectName}`);
  ctx.log('info', `Flow Type: ${flowType}, Turbulence Model: ${turbulenceModel}`);

  // ============================================================================
  // PHASE 1: GEOMETRY IMPORT AND CLEANUP
  // ============================================================================

  ctx.log('info', 'Phase 1: Geometry Import and Cleanup');

  const geometryResult = await ctx.task(cfdGeometryTask, {
    projectName,
    geometry,
    flowType,
    outputDir
  });

  artifacts.push(...geometryResult.artifacts);

  ctx.log('info', `Geometry prepared - ${geometryResult.domainVolume} m^3 flow domain`);

  // ============================================================================
  // PHASE 2: MESH GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 2: CFD Mesh Generation');

  const meshResult = await ctx.task(cfdMeshTask, {
    projectName,
    geometryResult,
    flowType,
    meshSettings,
    outputDir
  });

  artifacts.push(...meshResult.artifacts);

  ctx.log('info', `Mesh generated - ${meshResult.cellCount} cells, ${meshResult.meshQuality.orthogonality} orthogonality`);

  // Quality Gate: Mesh quality check
  if (meshResult.meshQuality.orthogonality < 0.2 || meshResult.meshQuality.skewness > 0.85) {
    await ctx.breakpoint({
      question: `Mesh quality below threshold. Orthogonality: ${meshResult.meshQuality.orthogonality}, Skewness: ${meshResult.meshQuality.skewness}. Refine mesh?`,
      title: 'CFD Mesh Quality Warning',
      context: {
        runId: ctx.runId,
        meshQuality: meshResult.meshQuality,
        cellDistribution: meshResult.cellDistribution,
        files: meshResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 3: PHYSICS SETUP
  // ============================================================================

  ctx.log('info', 'Phase 3: Physics Setup');

  const physicsResult = await ctx.task(cfdPhysicsTask, {
    projectName,
    flowType,
    fluidProperties,
    turbulenceModel,
    steadyState,
    includeThermal,
    outputDir
  });

  artifacts.push(...physicsResult.artifacts);

  ctx.log('info', `Physics configured - Reynolds number: ${physicsResult.reynoldsNumber}`);

  // ============================================================================
  // PHASE 4: BOUNDARY CONDITIONS
  // ============================================================================

  ctx.log('info', 'Phase 4: Boundary Conditions Setup');

  const boundaryResult = await ctx.task(cfdBoundaryTask, {
    projectName,
    boundaryConditions,
    meshResult,
    physicsResult,
    outputDir
  });

  artifacts.push(...boundaryResult.artifacts);

  ctx.log('info', `Boundary conditions applied - ${boundaryResult.boundaryCount} boundaries`);

  // Breakpoint: Review setup
  await ctx.breakpoint({
    question: `CFD setup complete. ${meshResult.cellCount} cells, Re=${physicsResult.reynoldsNumber}. ${boundaryResult.boundaryCount} boundaries defined. Review before solving?`,
    title: 'CFD Setup Review',
    context: {
      runId: ctx.runId,
      meshSummary: meshResult.summary,
      physicsSummary: physicsResult.summary,
      boundarySummary: boundaryResult.summary,
      files: meshResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 5: SOLVER CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Solver Configuration');

  const solverConfigResult = await ctx.task(cfdSolverConfigTask, {
    projectName,
    physicsResult,
    meshResult,
    solverSettings,
    steadyState,
    outputDir
  });

  artifacts.push(...solverConfigResult.artifacts);

  ctx.log('info', `Solver configured - ${solverConfigResult.solver} with ${solverConfigResult.scheme}`);

  // ============================================================================
  // PHASE 6: SOLVER EXECUTION
  // ============================================================================

  ctx.log('info', 'Phase 6: Solver Execution');

  const solveResult = await ctx.task(cfdSolveTask, {
    projectName,
    solverConfigResult,
    outputDir
  });

  artifacts.push(...solveResult.artifacts);

  ctx.log('info', `Solver complete - ${solveResult.iterations} iterations, Residuals: ${solveResult.finalResiduals}`);

  // Quality Gate: Convergence check
  if (!solveResult.converged) {
    await ctx.breakpoint({
      question: `CFD solution did not fully converge. Final residuals: ${JSON.stringify(solveResult.finalResiduals)}. Continue with post-processing or adjust?`,
      title: 'CFD Convergence Warning',
      context: {
        runId: ctx.runId,
        convergenceStatus: solveResult.converged,
        residualHistory: solveResult.residualHistory,
        monitorHistory: solveResult.monitorHistory,
        files: solveResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 7: RESULTS POST-PROCESSING
  // ============================================================================

  ctx.log('info', 'Phase 7: Results Post-Processing');

  const resultsResult = await ctx.task(cfdResultsTask, {
    projectName,
    solveResult,
    flowType,
    includeThermal,
    outputDir
  });

  artifacts.push(...resultsResult.artifacts);

  ctx.log('info', `Results extracted - Pressure drop: ${resultsResult.pressureDrop} Pa`);

  // ============================================================================
  // PHASE 8: VALIDATION AND REPORTING
  // ============================================================================

  ctx.log('info', 'Phase 8: Validation and Reporting');

  const reportResult = await ctx.task(generateCFDReportTask, {
    projectName,
    flowType,
    geometryResult,
    meshResult,
    physicsResult,
    boundaryResult,
    solverConfigResult,
    solveResult,
    resultsResult,
    outputDir
  });

  artifacts.push(...reportResult.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `CFD Analysis Complete for ${projectName}. Pressure drop: ${resultsResult.pressureDrop} Pa, Max velocity: ${resultsResult.maxVelocity} m/s. Approve results?`,
    title: 'CFD Analysis Complete',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        pressureDrop: resultsResult.pressureDrop,
        maxVelocity: resultsResult.maxVelocity,
        massFlowRate: resultsResult.massFlowRate,
        converged: solveResult.converged
      },
      files: [
        { path: reportResult.reportPath, format: 'markdown', label: 'CFD Report' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    flowType,
    flowResults: {
      pressureDrop: resultsResult.pressureDrop,
      maxVelocity: resultsResult.maxVelocity,
      massFlowRate: resultsResult.massFlowRate,
      averageVelocity: resultsResult.averageVelocity,
      reynoldsNumber: physicsResult.reynoldsNumber
    },
    pressureDrop: resultsResult.pressureDrop,
    thermalResults: includeThermal ? resultsResult.thermalResults : null,
    outputFiles: {
      report: reportResult.reportPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/science/mechanical-engineering/cfd-analysis',
      processSlug: 'cfd-analysis',
      category: 'mechanical-engineering',
      timestamp: startTime,
      flowType
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const cfdGeometryTask = defineTask('cfd-geometry', (args, taskCtx) => ({
  kind: 'agent',
  title: `CFD Geometry - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CFD Pre-Processing Specialist',
      task: 'Prepare geometry for CFD analysis',
      context: {
        projectName: args.projectName,
        geometry: args.geometry,
        flowType: args.flowType,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Import CAD geometry',
        '2. Extract flow domain (fluid volume)',
        '3. Remove unnecessary details (small features)',
        '4. Repair geometry issues (gaps, overlaps)',
        '5. Create boundary face zones:',
        '   - Inlet(s)',
        '   - Outlet(s)',
        '   - Walls (stationary, moving)',
        '   - Symmetry planes if applicable',
        '6. Calculate domain volume',
        '7. Identify critical regions for mesh refinement',
        '8. Create named selections',
        '9. Export prepared geometry'
      ],
      outputFormat: 'JSON object with geometry preparation'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'domainVolume', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        domainVolume: { type: 'number' },
        boundaryZones: { type: 'array' },
        refinementRegions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'cfd', 'geometry']
}));

export const cfdMeshTask = defineTask('cfd-mesh', (args, taskCtx) => ({
  kind: 'agent',
  title: `CFD Mesh - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CFD Meshing Specialist',
      task: 'Generate CFD mesh',
      context: {
        projectName: args.projectName,
        geometryResult: args.geometryResult,
        flowType: args.flowType,
        meshSettings: args.meshSettings,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Select mesh type:',
        '   - Polyhedral for complex geometry',
        '   - Hex-dominant for simple geometry',
        '   - Tetrahedral with prism layers',
        '2. Generate surface mesh',
        '3. Add inflation/prism layers at walls:',
        '   - First cell height for y+ target',
        '   - Growth ratio 1.2-1.3',
        '   - Number of layers for boundary layer',
        '4. Generate volume mesh',
        '5. Add local refinements at:',
        '   - Inlets/outlets',
        '   - Separation regions',
        '   - High gradient areas',
        '6. Check mesh quality:',
        '   - Orthogonality > 0.2',
        '   - Skewness < 0.85',
        '   - Aspect ratio reasonable',
        '7. Calculate y+ distribution',
        '8. Create mesh quality report'
      ],
      outputFormat: 'JSON object with mesh results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'cellCount', 'meshQuality', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        cellCount: { type: 'number' },
        nodeCount: { type: 'number' },
        meshQuality: {
          type: 'object',
          properties: {
            orthogonality: { type: 'number' },
            skewness: { type: 'number' },
            aspectRatio: { type: 'number' }
          }
        },
        yPlusEstimate: { type: 'number' },
        cellDistribution: { type: 'object' },
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'cfd', 'meshing']
}));

export const cfdPhysicsTask = defineTask('cfd-physics', (args, taskCtx) => ({
  kind: 'agent',
  title: `CFD Physics - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CFD Specialist',
      task: 'Configure CFD physics models',
      context: {
        projectName: args.projectName,
        flowType: args.flowType,
        fluidProperties: args.fluidProperties,
        turbulenceModel: args.turbulenceModel,
        steadyState: args.steadyState,
        includeThermal: args.includeThermal,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define fluid material properties:',
        '   - Density (constant or ideal gas)',
        '   - Viscosity (constant or Sutherland)',
        '   - Thermal conductivity if thermal',
        '2. Select turbulence model:',
        '   - k-epsilon (general purpose)',
        '   - k-omega SST (separation)',
        '   - Realizable k-epsilon (jets)',
        '   - Spalart-Allmaras (external)',
        '3. Enable energy equation if thermal',
        '4. Calculate Reynolds number',
        '5. Estimate flow regime (laminar/turbulent)',
        '6. Configure near-wall treatment',
        '7. Set reference values',
        '8. Document physics assumptions'
      ],
      outputFormat: 'JSON object with physics configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'reynoldsNumber', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        reynoldsNumber: { type: 'number' },
        flowRegime: { type: 'string' },
        turbulenceModel: { type: 'string' },
        fluidProperties: { type: 'object' },
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'cfd', 'physics']
}));

export const cfdBoundaryTask = defineTask('cfd-boundary', (args, taskCtx) => ({
  kind: 'agent',
  title: `CFD Boundary Conditions - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CFD Specialist',
      task: 'Apply CFD boundary conditions',
      context: {
        projectName: args.projectName,
        boundaryConditions: args.boundaryConditions,
        meshResult: args.meshResult,
        physicsResult: args.physicsResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define inlet boundary conditions:',
        '   - Velocity inlet (uniform or profile)',
        '   - Mass flow inlet',
        '   - Pressure inlet',
        '2. Define outlet boundary conditions:',
        '   - Pressure outlet',
        '   - Outflow',
        '3. Define wall boundary conditions:',
        '   - No-slip (stationary)',
        '   - Moving wall',
        '   - Slip wall',
        '4. Set turbulence quantities at inlet:',
        '   - Turbulence intensity',
        '   - Length scale or hydraulic diameter',
        '5. Set thermal conditions if applicable',
        '6. Apply symmetry conditions if used',
        '7. Check boundary condition consistency',
        '8. Document all boundary conditions'
      ],
      outputFormat: 'JSON object with boundary conditions'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'boundaryCount', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        boundaryCount: { type: 'number' },
        boundaryTypes: { type: 'array' },
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'cfd', 'boundary-conditions']
}));

export const cfdSolverConfigTask = defineTask('cfd-solver-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `CFD Solver Config - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CFD Solver Specialist',
      task: 'Configure CFD solver settings',
      context: {
        projectName: args.projectName,
        physicsResult: args.physicsResult,
        meshResult: args.meshResult,
        solverSettings: args.solverSettings,
        steadyState: args.steadyState,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Select solver type:',
        '   - Pressure-based (incompressible)',
        '   - Density-based (compressible)',
        '2. Select pressure-velocity coupling:',
        '   - SIMPLE, SIMPLEC, PISO',
        '3. Configure spatial discretization:',
        '   - Second-order upwind for accuracy',
        '   - First-order for initial convergence',
        '4. Set under-relaxation factors',
        '5. Define convergence criteria (residuals)',
        '6. Set iteration limits',
        '7. Configure monitors (mass flow, pressure)',
        '8. Set solution initialization method'
      ],
      outputFormat: 'JSON object with solver configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'solver', 'scheme', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        solver: { type: 'string' },
        scheme: { type: 'string' },
        underRelaxation: { type: 'object' },
        convergenceCriteria: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'cfd', 'solver']
}));

export const cfdSolveTask = defineTask('cfd-solve', (args, taskCtx) => ({
  kind: 'agent',
  title: `CFD Solve - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CFD Solver Specialist',
      task: 'Execute CFD solver',
      context: {
        projectName: args.projectName,
        solverConfigResult: args.solverConfigResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Initialize solution',
        '2. Start iterative solution',
        '3. Monitor convergence:',
        '   - Residuals (continuity, momentum, energy)',
        '   - Key quantities (mass flow, pressure drop)',
        '4. Adjust under-relaxation if oscillating',
        '5. Continue until convergence criteria met',
        '6. Check mass balance',
        '7. Verify physical reasonableness',
        '8. Save converged solution'
      ],
      outputFormat: 'JSON object with solve results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'converged', 'iterations', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        converged: { type: 'boolean' },
        iterations: { type: 'number' },
        finalResiduals: { type: 'object' },
        residualHistory: { type: 'array' },
        monitorHistory: { type: 'array' },
        massBalance: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'cfd', 'solver-execution']
}));

export const cfdResultsTask = defineTask('cfd-results', (args, taskCtx) => ({
  kind: 'agent',
  title: `CFD Results - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CFD Post-Processing Specialist',
      task: 'Extract and visualize CFD results',
      context: {
        projectName: args.projectName,
        solveResult: args.solveResult,
        flowType: args.flowType,
        includeThermal: args.includeThermal,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate pressure drop (inlet - outlet)',
        '2. Extract mass flow rates',
        '3. Calculate average and max velocities',
        '4. Extract wall shear stress',
        '5. Create velocity contour plots',
        '6. Create pressure contour plots',
        '7. Generate streamlines',
        '8. Create vector plots',
        '9. If thermal: extract heat transfer results',
        '10. Calculate flow uniformity metrics'
      ],
      outputFormat: 'JSON object with CFD results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'pressureDrop', 'maxVelocity', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        pressureDrop: { type: 'number' },
        maxVelocity: { type: 'number' },
        averageVelocity: { type: 'number' },
        massFlowRate: { type: 'number' },
        wallShearStress: { type: 'object' },
        thermalResults: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mechanical-engineering', 'cfd', 'post-processing']
}));

export const generateCFDReportTask = defineTask('generate-cfd-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate CFD Report - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Documentation Specialist',
      task: 'Generate comprehensive CFD analysis report',
      context: {
        projectName: args.projectName,
        flowType: args.flowType,
        geometryResult: args.geometryResult,
        meshResult: args.meshResult,
        physicsResult: args.physicsResult,
        boundaryResult: args.boundaryResult,
        solverConfigResult: args.solverConfigResult,
        solveResult: args.solveResult,
        resultsResult: args.resultsResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create executive summary',
        '2. Document geometry and domain',
        '3. Present mesh details and quality',
        '4. Document physics models',
        '5. List all boundary conditions',
        '6. Show convergence history',
        '7. Present flow field results with contours',
        '8. Present quantitative results',
        '9. Compare with expectations/theory if applicable',
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
  labels: ['mechanical-engineering', 'cfd', 'reporting']
}));
