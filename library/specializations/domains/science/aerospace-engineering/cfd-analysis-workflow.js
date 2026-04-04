/**
 * @process specializations/domains/science/aerospace-engineering/cfd-analysis-workflow
 * @description Complete computational fluid dynamics analysis workflow including geometry preparation,
 * mesh generation, solver setup, solution execution, and post-processing for subsonic through hypersonic flow regimes.
 * @inputs { projectName: string, geometrySource: string, flowRegime: string, analysisType: string, boundaryConditions?: object }
 * @outputs { success: boolean, meshQualityMetrics: object, solutionConvergence: object, flowResults: object, validationReport: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/aerospace-engineering/cfd-analysis-workflow', {
 *   projectName: 'Wing Aerodynamics Study',
 *   geometrySource: 'cad/wing_assembly.step',
 *   flowRegime: 'transonic',
 *   analysisType: 'RANS',
 *   boundaryConditions: { mach: 0.85, altitude: 35000, aoa: 2.5 }
 * });
 *
 * @references
 * - NASA CFD Validation: https://turbmodels.larc.nasa.gov/
 * - AIAA CFD Guidelines: https://www.aiaa.org/
 * - OpenFOAM Documentation: https://www.openfoam.com/documentation/
 * - ANSYS Fluent Theory Guide: https://www.ansys.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    geometrySource,
    flowRegime = 'subsonic',
    analysisType = 'RANS',
    boundaryConditions = {}
  } = inputs;

  // Phase 1: Geometry Preparation and Cleanup
  const geometryPrep = await ctx.task(geometryPreparationTask, {
    projectName,
    geometrySource,
    flowRegime,
    targetApplication: 'cfd'
  });

  if (!geometryPrep.geometryValid) {
    return {
      success: false,
      error: 'Geometry preparation failed - invalid or non-watertight geometry',
      phase: 'geometry-preparation',
      details: geometryPrep.issues
    };
  }

  // Phase 2: Domain Definition and Meshing Strategy
  const meshStrategy = await ctx.task(meshStrategyTask, {
    projectName,
    geometryCharacteristics: geometryPrep.characteristics,
    flowRegime,
    analysisType,
    boundaryConditions
  });

  // Breakpoint: Review mesh strategy before generation
  await ctx.breakpoint({
    question: `Review mesh strategy for ${projectName}. Target cell count: ${meshStrategy.estimatedCellCount}. Proceed with mesh generation?`,
    title: 'CFD Mesh Strategy Review',
    context: {
      runId: ctx.runId,
      meshStrategy,
      files: [{
        path: 'artifacts/mesh-strategy.json',
        format: 'json',
        content: meshStrategy
      }]
    }
  });

  // Phase 3: Mesh Generation
  const meshGeneration = await ctx.task(meshGenerationTask, {
    projectName,
    geometryData: geometryPrep,
    meshStrategy,
    flowRegime
  });

  // Quality Gate: Mesh quality must meet minimum standards
  if (meshGeneration.qualityMetrics.minOrthogonality < 0.1 ||
      meshGeneration.qualityMetrics.maxSkewness > 0.95) {
    await ctx.breakpoint({
      question: `Mesh quality below standards. Min orthogonality: ${meshGeneration.qualityMetrics.minOrthogonality}, Max skewness: ${meshGeneration.qualityMetrics.maxSkewness}. Proceed or regenerate?`,
      title: 'Mesh Quality Warning',
      context: {
        runId: ctx.runId,
        meshQualityMetrics: meshGeneration.qualityMetrics,
        recommendation: 'Consider mesh refinement or geometry cleanup'
      }
    });
  }

  // Phase 4: Solver Setup and Configuration
  const solverSetup = await ctx.task(solverSetupTask, {
    projectName,
    flowRegime,
    analysisType,
    boundaryConditions,
    meshCharacteristics: meshGeneration.characteristics
  });

  // Phase 5: Solution Initialization and Execution
  const solutionExecution = await ctx.task(solutionExecutionTask, {
    projectName,
    solverConfiguration: solverSetup,
    meshData: meshGeneration,
    convergenceCriteria: solverSetup.convergenceCriteria
  });

  // Quality Gate: Check solution convergence
  if (!solutionExecution.converged) {
    await ctx.breakpoint({
      question: `Solution did not converge after ${solutionExecution.iterations} iterations. Residuals: ${JSON.stringify(solutionExecution.finalResiduals)}. Continue iterations or adjust settings?`,
      title: 'Convergence Warning',
      context: {
        runId: ctx.runId,
        solutionStatus: solutionExecution,
        recommendation: 'Consider relaxation factor adjustment or mesh refinement'
      }
    });
  }

  // Phase 6: Post-Processing and Results Extraction
  const postProcessing = await ctx.task(postProcessingTask, {
    projectName,
    solutionData: solutionExecution,
    flowRegime,
    analysisType,
    extractionParameters: {
      forces: true,
      pressureDistribution: true,
      flowVisualization: true,
      boundaryLayerProfile: flowRegime !== 'inviscid'
    }
  });

  // Phase 7: Results Validation and Verification
  const validation = await ctx.task(validationTask, {
    projectName,
    computedResults: postProcessing,
    flowRegime,
    analysisType,
    boundaryConditions
  });

  // Phase 8: Report Generation
  const reportGeneration = await ctx.task(reportGenerationTask, {
    projectName,
    geometryPrep,
    meshGeneration,
    solverSetup,
    solutionExecution,
    postProcessing,
    validation
  });

  // Final Breakpoint: Results Review
  await ctx.breakpoint({
    question: `CFD analysis complete for ${projectName}. Review results and approve for release?`,
    title: 'CFD Analysis Results Review',
    context: {
      runId: ctx.runId,
      summary: {
        converged: solutionExecution.converged,
        iterations: solutionExecution.iterations,
        keyResults: postProcessing.keyResults,
        validationStatus: validation.status
      },
      files: [
        { path: 'artifacts/cfd-report.json', format: 'json', content: reportGeneration },
        { path: 'artifacts/cfd-report.md', format: 'markdown', content: reportGeneration.markdown }
      ]
    }
  });

  return {
    success: true,
    projectName,
    flowRegime,
    analysisType,
    meshQualityMetrics: meshGeneration.qualityMetrics,
    solutionConvergence: {
      converged: solutionExecution.converged,
      iterations: solutionExecution.iterations,
      finalResiduals: solutionExecution.finalResiduals
    },
    flowResults: postProcessing.results,
    validationReport: validation,
    report: reportGeneration,
    metadata: {
      processId: 'specializations/domains/science/aerospace-engineering/cfd-analysis-workflow',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const geometryPreparationTask = defineTask('geometry-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Geometry Preparation - ${args.projectName}`,
  skill: { name: 'cfd-analysis' },
  agent: {
    name: 'aero-specialist',
    prompt: {
      role: 'CAD/CFD Engineer specializing in geometry preparation for computational fluid dynamics',
      task: 'Prepare and validate geometry for CFD analysis',
      context: {
        projectName: args.projectName,
        geometrySource: args.geometrySource,
        flowRegime: args.flowRegime,
        targetApplication: args.targetApplication
      },
      instructions: [
        '1. Import and analyze the source geometry (STEP, IGES, or native CAD format)',
        '2. Check geometry for watertightness and manifold conditions',
        '3. Identify and repair surface gaps, overlaps, and intersections',
        '4. Remove unnecessary details (fillets, holes, fasteners) based on flow physics requirements',
        '5. Create flow domain boundaries (farfield, inlet, outlet, symmetry planes)',
        '6. Define boundary layer regions and inflation zones for viscous flows',
        '7. Identify sharp edges and corners requiring special meshing attention',
        '8. Generate characteristic length scales for mesh sizing',
        '9. Document geometry modifications and assumptions',
        '10. Export prepared geometry in appropriate format for meshing'
      ],
      outputFormat: 'JSON object with geometry validation results and characteristics'
    },
    outputSchema: {
      type: 'object',
      required: ['geometryValid', 'characteristics'],
      properties: {
        geometryValid: { type: 'boolean' },
        issues: { type: 'array', items: { type: 'string' } },
        modifications: { type: 'array', items: { type: 'string' } },
        characteristics: {
          type: 'object',
          properties: {
            referenceLength: { type: 'number' },
            referenceArea: { type: 'number' },
            boundingBox: { type: 'object' },
            surfaceCount: { type: 'number' },
            sharpEdgeCount: { type: 'number' }
          }
        },
        domainDefinition: {
          type: 'object',
          properties: {
            farfieldDistance: { type: 'number' },
            inletLocation: { type: 'object' },
            outletLocation: { type: 'object' },
            symmetryPlanes: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cfd', 'geometry', 'preprocessing', 'aerospace']
}));

export const meshStrategyTask = defineTask('mesh-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Mesh Strategy Development - ${args.projectName}`,
  skill: { name: 'cfd-analysis' },
  agent: {
    name: 'aero-specialist',
    prompt: {
      role: 'CFD Mesh Specialist with expertise in aerospace applications',
      task: 'Develop comprehensive meshing strategy for CFD analysis',
      context: {
        projectName: args.projectName,
        geometryCharacteristics: args.geometryCharacteristics,
        flowRegime: args.flowRegime,
        analysisType: args.analysisType,
        boundaryConditions: args.boundaryConditions
      },
      instructions: [
        '1. Determine appropriate mesh topology (structured, unstructured, hybrid)',
        '2. Calculate y+ requirements based on turbulence model and Reynolds number',
        '3. Define inflation layer parameters (first layer height, growth rate, number of layers)',
        '4. Specify surface mesh sizing based on curvature and proximity',
        '5. Define refinement zones for wake, shock, and separation regions',
        '6. Estimate total cell count and computational requirements',
        '7. Define mesh quality targets (orthogonality, skewness, aspect ratio)',
        '8. Plan mesh adaptation strategy for solution-based refinement',
        '9. Specify periodic or interface conditions if applicable',
        '10. Document mesh sizing functions and growth rates'
      ],
      outputFormat: 'JSON object with complete mesh strategy specification'
    },
    outputSchema: {
      type: 'object',
      required: ['meshTopology', 'estimatedCellCount', 'inflationParameters'],
      properties: {
        meshTopology: { type: 'string', enum: ['structured', 'unstructured', 'hybrid', 'polyhedral'] },
        estimatedCellCount: { type: 'number' },
        yPlusTarget: { type: 'number' },
        inflationParameters: {
          type: 'object',
          properties: {
            firstLayerHeight: { type: 'number' },
            growthRate: { type: 'number' },
            numberOfLayers: { type: 'number' },
            totalBoundaryLayerThickness: { type: 'number' }
          }
        },
        surfaceMeshing: {
          type: 'object',
          properties: {
            minSize: { type: 'number' },
            maxSize: { type: 'number' },
            curvatureResolution: { type: 'number' },
            proximityResolution: { type: 'number' }
          }
        },
        refinementZones: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              cellSize: { type: 'number' },
              location: { type: 'object' }
            }
          }
        },
        qualityTargets: {
          type: 'object',
          properties: {
            minOrthogonality: { type: 'number' },
            maxSkewness: { type: 'number' },
            maxAspectRatio: { type: 'number' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cfd', 'meshing', 'strategy', 'aerospace']
}));

export const meshGenerationTask = defineTask('mesh-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Mesh Generation - ${args.projectName}`,
  skill: { name: 'cfd-analysis' },
  agent: {
    name: 'aero-specialist',
    prompt: {
      role: 'CFD Mesh Engineer with expertise in high-quality mesh generation',
      task: 'Generate computational mesh following the defined strategy',
      context: {
        projectName: args.projectName,
        geometryData: args.geometryData,
        meshStrategy: args.meshStrategy,
        flowRegime: args.flowRegime
      },
      instructions: [
        '1. Generate surface mesh with specified sizing functions',
        '2. Create inflation layers on viscous walls',
        '3. Generate volume mesh with appropriate cell types',
        '4. Apply local refinement in specified zones',
        '5. Check and repair mesh quality issues',
        '6. Verify boundary layer resolution (y+ distribution)',
        '7. Validate mesh interfaces and periodic boundaries',
        '8. Generate mesh quality statistics and histograms',
        '9. Create mesh independence study plan',
        '10. Export mesh in solver-compatible format'
      ],
      outputFormat: 'JSON object with mesh generation results and quality metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['characteristics', 'qualityMetrics'],
      properties: {
        characteristics: {
          type: 'object',
          properties: {
            totalCells: { type: 'number' },
            cellTypes: { type: 'object' },
            boundaryFaces: { type: 'number' },
            averageYPlus: { type: 'number' }
          }
        },
        qualityMetrics: {
          type: 'object',
          properties: {
            minOrthogonality: { type: 'number' },
            maxSkewness: { type: 'number' },
            maxAspectRatio: { type: 'number' },
            averageNonOrthogonality: { type: 'number' }
          }
        },
        boundaryZones: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              faceCount: { type: 'number' }
            }
          }
        },
        meshFile: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cfd', 'meshing', 'generation', 'aerospace']
}));

export const solverSetupTask = defineTask('solver-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Solver Configuration - ${args.projectName}`,
  skill: { name: 'cfd-analysis' },
  agent: {
    name: 'aero-specialist',
    prompt: {
      role: 'CFD Solver Specialist with expertise in aerospace flow simulation',
      task: 'Configure CFD solver for the specified flow conditions',
      context: {
        projectName: args.projectName,
        flowRegime: args.flowRegime,
        analysisType: args.analysisType,
        boundaryConditions: args.boundaryConditions,
        meshCharacteristics: args.meshCharacteristics
      },
      instructions: [
        '1. Select appropriate solver type (pressure-based, density-based)',
        '2. Configure turbulence model based on flow physics requirements',
        '3. Set fluid properties and equation of state',
        '4. Define boundary conditions (inlet, outlet, wall, farfield)',
        '5. Configure numerical schemes (spatial discretization, gradient computation)',
        '6. Set under-relaxation factors for stability',
        '7. Define convergence criteria and monitoring points',
        '8. Configure solution initialization strategy',
        '9. Set up parallel decomposition if applicable',
        '10. Define output parameters and sampling intervals'
      ],
      outputFormat: 'JSON object with complete solver configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['solverType', 'turbulenceModel', 'boundaryConditions', 'convergenceCriteria'],
      properties: {
        solverType: { type: 'string', enum: ['pressure-based', 'density-based', 'coupled'] },
        turbulenceModel: { type: 'string' },
        fluidProperties: {
          type: 'object',
          properties: {
            density: { type: 'string' },
            viscosity: { type: 'string' },
            specificHeatRatio: { type: 'number' }
          }
        },
        boundaryConditions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              parameters: { type: 'object' }
            }
          }
        },
        numericalSchemes: {
          type: 'object',
          properties: {
            gradient: { type: 'string' },
            pressure: { type: 'string' },
            momentum: { type: 'string' },
            energy: { type: 'string' }
          }
        },
        convergenceCriteria: {
          type: 'object',
          properties: {
            continuity: { type: 'number' },
            velocity: { type: 'number' },
            energy: { type: 'number' },
            turbulence: { type: 'number' }
          }
        },
        maxIterations: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cfd', 'solver', 'configuration', 'aerospace']
}));

export const solutionExecutionTask = defineTask('solution-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Solution Execution - ${args.projectName}`,
  skill: { name: 'cfd-analysis' },
  agent: {
    name: 'aero-specialist',
    prompt: {
      role: 'CFD Analysis Engineer monitoring solution convergence and stability',
      task: 'Execute CFD solution and monitor convergence',
      context: {
        projectName: args.projectName,
        solverConfiguration: args.solverConfiguration,
        meshData: args.meshData,
        convergenceCriteria: args.convergenceCriteria
      },
      instructions: [
        '1. Initialize flow field using specified strategy',
        '2. Execute solver iterations monitoring residuals',
        '3. Track force and moment coefficient convergence',
        '4. Monitor solution stability and detect oscillations',
        '5. Adjust solver settings if convergence issues arise',
        '6. Capture intermediate results at specified intervals',
        '7. Detect and report any solver warnings or errors',
        '8. Verify mass and energy conservation',
        '9. Document computational resources used',
        '10. Determine final convergence status'
      ],
      outputFormat: 'JSON object with solution execution results'
    },
    outputSchema: {
      type: 'object',
      required: ['converged', 'iterations', 'finalResiduals'],
      properties: {
        converged: { type: 'boolean' },
        iterations: { type: 'number' },
        finalResiduals: {
          type: 'object',
          properties: {
            continuity: { type: 'number' },
            xVelocity: { type: 'number' },
            yVelocity: { type: 'number' },
            zVelocity: { type: 'number' },
            energy: { type: 'number' }
          }
        },
        forceConvergence: {
          type: 'object',
          properties: {
            lift: { type: 'number' },
            drag: { type: 'number' },
            moment: { type: 'number' }
          }
        },
        computationalMetrics: {
          type: 'object',
          properties: {
            wallClockTime: { type: 'string' },
            cpuHours: { type: 'number' },
            memoryUsage: { type: 'string' }
          }
        },
        warnings: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cfd', 'solution', 'execution', 'aerospace']
}));

export const postProcessingTask = defineTask('post-processing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Post-Processing - ${args.projectName}`,
  skill: { name: 'cfd-analysis' },
  agent: {
    name: 'aero-specialist',
    prompt: {
      role: 'CFD Post-Processing Specialist with aerospace analysis expertise',
      task: 'Extract and analyze CFD results',
      context: {
        projectName: args.projectName,
        solutionData: args.solutionData,
        flowRegime: args.flowRegime,
        analysisType: args.analysisType,
        extractionParameters: args.extractionParameters
      },
      instructions: [
        '1. Extract integrated forces and moments (lift, drag, pitching moment)',
        '2. Compute aerodynamic coefficients (CL, CD, CM, L/D)',
        '3. Generate pressure coefficient distribution (Cp)',
        '4. Extract skin friction coefficient distribution (Cf)',
        '5. Analyze boundary layer characteristics (displacement, momentum thickness)',
        '6. Identify flow separation and reattachment locations',
        '7. Visualize streamlines, velocity contours, and pressure fields',
        '8. Extract shock wave locations for transonic/supersonic flows',
        '9. Compute wake characteristics and vortex structures',
        '10. Generate comparison data for validation'
      ],
      outputFormat: 'JSON object with comprehensive post-processing results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'keyResults'],
      properties: {
        results: {
          type: 'object',
          properties: {
            forces: {
              type: 'object',
              properties: {
                lift: { type: 'number' },
                drag: { type: 'number' },
                sideForce: { type: 'number' }
              }
            },
            moments: {
              type: 'object',
              properties: {
                pitching: { type: 'number' },
                rolling: { type: 'number' },
                yawing: { type: 'number' }
              }
            },
            coefficients: {
              type: 'object',
              properties: {
                CL: { type: 'number' },
                CD: { type: 'number' },
                CM: { type: 'number' },
                LD: { type: 'number' }
              }
            }
          }
        },
        keyResults: {
          type: 'object',
          properties: {
            liftToDrag: { type: 'number' },
            dragBreakdown: { type: 'object' },
            separationLocation: { type: 'string' }
          }
        },
        distributions: {
          type: 'object',
          properties: {
            cpDistribution: { type: 'string' },
            cfDistribution: { type: 'string' }
          }
        },
        visualizations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              path: { type: 'string' }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cfd', 'post-processing', 'analysis', 'aerospace']
}));

export const validationTask = defineTask('validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Results Validation - ${args.projectName}`,
  skill: { name: 'cfd-analysis' },
  agent: {
    name: 'aero-specialist',
    prompt: {
      role: 'CFD Validation Engineer with expertise in verification and validation',
      task: 'Validate CFD results against reference data and best practices',
      context: {
        projectName: args.projectName,
        computedResults: args.computedResults,
        flowRegime: args.flowRegime,
        analysisType: args.analysisType,
        boundaryConditions: args.boundaryConditions
      },
      instructions: [
        '1. Compare results with available experimental or flight test data',
        '2. Assess grid convergence using Richardson extrapolation',
        '3. Evaluate turbulence model appropriateness for the flow physics',
        '4. Check physical plausibility of results (conservation, symmetry)',
        '5. Compare with empirical correlations or handbook methods',
        '6. Assess numerical uncertainty and error bounds',
        '7. Evaluate boundary condition sensitivity',
        '8. Document validation metrics and confidence levels',
        '9. Identify areas requiring further investigation',
        '10. Provide recommendations for result usage'
      ],
      outputFormat: 'JSON object with validation assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'validationMetrics'],
      properties: {
        status: { type: 'string', enum: ['validated', 'partially-validated', 'not-validated', 'needs-review'] },
        validationMetrics: {
          type: 'object',
          properties: {
            gridConvergenceIndex: { type: 'number' },
            experimentalComparison: { type: 'object' },
            conservationError: { type: 'number' }
          }
        },
        uncertaintyBounds: {
          type: 'object',
          properties: {
            numerical: { type: 'number' },
            modeling: { type: 'number' },
            total: { type: 'number' }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        confidenceLevel: { type: 'string', enum: ['high', 'medium', 'low'] }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cfd', 'validation', 'verification', 'aerospace']
}));

export const reportGenerationTask = defineTask('report-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Report Generation - ${args.projectName}`,
  skill: { name: 'cfd-analysis' },
  agent: {
    name: 'aero-specialist',
    prompt: {
      role: 'Aerospace CFD Technical Writer with expertise in analysis documentation',
      task: 'Generate comprehensive CFD analysis report',
      context: {
        projectName: args.projectName,
        geometryPrep: args.geometryPrep,
        meshGeneration: args.meshGeneration,
        solverSetup: args.solverSetup,
        solutionExecution: args.solutionExecution,
        postProcessing: args.postProcessing,
        validation: args.validation
      },
      instructions: [
        '1. Create executive summary with key findings',
        '2. Document geometry and mesh preparation process',
        '3. Detail solver configuration and boundary conditions',
        '4. Present convergence history and solution quality',
        '5. Summarize aerodynamic results with visualizations',
        '6. Include validation assessment and uncertainty quantification',
        '7. Provide recommendations for design improvements',
        '8. Document lessons learned and best practices',
        '9. Include appendices with detailed data tables',
        '10. Generate both structured JSON and markdown formats'
      ],
      outputFormat: 'JSON object with complete report in multiple formats'
    },
    outputSchema: {
      type: 'object',
      required: ['report', 'markdown'],
      properties: {
        report: {
          type: 'object',
          properties: {
            executiveSummary: { type: 'string' },
            geometry: { type: 'object' },
            mesh: { type: 'object' },
            solverConfiguration: { type: 'object' },
            results: { type: 'object' },
            validation: { type: 'object' },
            recommendations: { type: 'array', items: { type: 'string' } }
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
  labels: ['cfd', 'reporting', 'documentation', 'aerospace']
}));
