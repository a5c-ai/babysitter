/**
 * @process civil-engineering/structural-load-analysis
 * @description Comprehensive load analysis process including dead loads, live loads, environmental loads (wind, seismic, snow, rain), and load combinations per ASCE 7
 * @inputs { projectId: string, buildingType: string, siteLocation: object, occupancyCategory: string, buildingGeometry: object }
 * @outputs { success: boolean, loadSummary: object, loadCombinations: array, loadPathDiagrams: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectId,
    buildingType,
    siteLocation,
    occupancyCategory = 'II',
    buildingGeometry,
    designCode = 'ASCE7-22',
    outputDir = 'structural-load-analysis-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Project Setup and Code Requirements
  ctx.log('info', 'Starting structural load analysis: Project setup and code requirements');
  const projectSetup = await ctx.task(projectSetupTask, {
    projectId,
    buildingType,
    siteLocation,
    occupancyCategory,
    designCode,
    outputDir
  });

  if (!projectSetup.success) {
    return {
      success: false,
      error: 'Project setup failed',
      details: projectSetup,
      metadata: { processId: 'civil-engineering/structural-load-analysis', timestamp: startTime }
    };
  }

  artifacts.push(...projectSetup.artifacts);

  // Task 2: Dead Load Analysis
  ctx.log('info', 'Calculating dead loads');
  const deadLoadAnalysis = await ctx.task(deadLoadAnalysisTask, {
    projectId,
    buildingType,
    buildingGeometry,
    projectSetup,
    outputDir
  });

  artifacts.push(...deadLoadAnalysis.artifacts);

  // Task 3: Live Load Analysis
  ctx.log('info', 'Calculating live loads');
  const liveLoadAnalysis = await ctx.task(liveLoadAnalysisTask, {
    projectId,
    buildingType,
    occupancyCategory,
    buildingGeometry,
    designCode,
    outputDir
  });

  artifacts.push(...liveLoadAnalysis.artifacts);

  // Task 4: Wind Load Analysis
  ctx.log('info', 'Calculating wind loads per ASCE 7');
  const windLoadAnalysis = await ctx.task(windLoadAnalysisTask, {
    projectId,
    siteLocation,
    buildingGeometry,
    occupancyCategory,
    designCode,
    outputDir
  });

  artifacts.push(...windLoadAnalysis.artifacts);

  // Task 5: Seismic Load Analysis
  ctx.log('info', 'Calculating seismic loads per ASCE 7');
  const seismicLoadAnalysis = await ctx.task(seismicLoadAnalysisTask, {
    projectId,
    siteLocation,
    buildingType,
    buildingGeometry,
    occupancyCategory,
    designCode,
    outputDir
  });

  artifacts.push(...seismicLoadAnalysis.artifacts);

  // Task 6: Snow and Rain Load Analysis
  ctx.log('info', 'Calculating snow and rain loads');
  const snowRainLoadAnalysis = await ctx.task(snowRainLoadAnalysisTask, {
    projectId,
    siteLocation,
    buildingGeometry,
    designCode,
    outputDir
  });

  artifacts.push(...snowRainLoadAnalysis.artifacts);

  // Task 7: Load Combinations
  ctx.log('info', 'Developing load combinations per ASCE 7');
  const loadCombinations = await ctx.task(loadCombinationsTask, {
    projectId,
    deadLoadAnalysis,
    liveLoadAnalysis,
    windLoadAnalysis,
    seismicLoadAnalysis,
    snowRainLoadAnalysis,
    designCode,
    outputDir
  });

  artifacts.push(...loadCombinations.artifacts);

  // Task 8: Load Path Analysis
  ctx.log('info', 'Analyzing load paths');
  const loadPathAnalysis = await ctx.task(loadPathAnalysisTask, {
    projectId,
    buildingGeometry,
    loadCombinations,
    outputDir
  });

  artifacts.push(...loadPathAnalysis.artifacts);

  // Breakpoint: Review load analysis results
  await ctx.breakpoint({
    question: `Structural load analysis complete for ${projectId}. Review load summary and combinations?`,
    title: 'Structural Load Analysis Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        totalDeadLoad: deadLoadAnalysis.totalDeadLoad,
        liveLoadIntensity: liveLoadAnalysis.maxLiveLoad,
        windSpeed: windLoadAnalysis.basicWindSpeed,
        seismicCategory: seismicLoadAnalysis.seismicDesignCategory,
        governingLoadCombination: loadCombinations.governingCombination
      }
    }
  });

  // Task 9: Generate Load Summary Report
  ctx.log('info', 'Generating comprehensive load summary report');
  const loadReport = await ctx.task(loadReportTask, {
    projectId,
    projectSetup,
    deadLoadAnalysis,
    liveLoadAnalysis,
    windLoadAnalysis,
    seismicLoadAnalysis,
    snowRainLoadAnalysis,
    loadCombinations,
    loadPathAnalysis,
    outputDir
  });

  artifacts.push(...loadReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    loadSummary: {
      deadLoads: deadLoadAnalysis.summary,
      liveLoads: liveLoadAnalysis.summary,
      windLoads: windLoadAnalysis.summary,
      seismicLoads: seismicLoadAnalysis.summary,
      snowRainLoads: snowRainLoadAnalysis.summary
    },
    loadCombinations: loadCombinations.combinations,
    governingCombination: loadCombinations.governingCombination,
    seismicDesignCategory: seismicLoadAnalysis.seismicDesignCategory,
    loadPathDiagrams: loadPathAnalysis.diagrams,
    artifacts,
    duration,
    metadata: {
      processId: 'civil-engineering/structural-load-analysis',
      timestamp: startTime,
      projectId,
      designCode,
      outputDir
    }
  };
}

// Task 1: Project Setup and Code Requirements
export const projectSetupTask = defineTask('project-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Setup project and determine code requirements',
  agent: {
    name: 'structural-load-analyst',
    prompt: {
      role: 'senior structural engineer',
      task: 'Establish project parameters and applicable code requirements',
      context: args,
      instructions: [
        'Define project scope and structural system type',
        'Determine applicable building codes (IBC, ASCE 7)',
        'Establish occupancy category and risk category per ASCE 7',
        'Identify site-specific requirements',
        'Define building exposure category',
        'Document design criteria and assumptions',
        'Create project parameter summary'
      ],
      outputFormat: 'JSON with project parameters, code requirements, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'projectParameters', 'codeRequirements', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        projectParameters: {
          type: 'object',
          properties: {
            riskCategory: { type: 'string' },
            exposureCategory: { type: 'string' },
            structuralSystem: { type: 'string' },
            buildingHeight: { type: 'number' }
          }
        },
        codeRequirements: { type: 'object' },
        designAssumptions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'structural', 'project-setup']
}));

// Task 2: Dead Load Analysis
export const deadLoadAnalysisTask = defineTask('dead-load-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate dead loads',
  agent: {
    name: 'structural-load-analyst',
    prompt: {
      role: 'structural engineer',
      task: 'Calculate dead loads for all structural elements',
      context: args,
      instructions: [
        'Calculate self-weight of structural members (beams, columns, slabs)',
        'Calculate superimposed dead loads (finishes, MEP, partitions)',
        'Calculate facade and cladding dead loads',
        'Calculate roof system dead loads',
        'Document material unit weights used',
        'Create dead load summary table by floor level',
        'Generate dead load diagrams'
      ],
      outputFormat: 'JSON with dead load summary, load distribution, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalDeadLoad', 'summary', 'artifacts'],
      properties: {
        totalDeadLoad: { type: 'number' },
        summary: {
          type: 'object',
          properties: {
            structuralWeight: { type: 'number' },
            superimposedDeadLoad: { type: 'number' },
            facadeLoad: { type: 'number' },
            roofDeadLoad: { type: 'number' }
          }
        },
        loadsByFloor: { type: 'object' },
        unitWeightsUsed: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'structural', 'dead-loads']
}));

// Task 3: Live Load Analysis
export const liveLoadAnalysisTask = defineTask('live-load-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate live loads',
  agent: {
    name: 'structural-load-analyst',
    prompt: {
      role: 'structural engineer',
      task: 'Determine live loads per ASCE 7 Table 4.3-1',
      context: args,
      instructions: [
        'Identify occupancy types for each floor/area',
        'Determine minimum uniformly distributed live loads',
        'Determine concentrated live loads where applicable',
        'Apply live load reduction factors per ASCE 7',
        'Calculate partition loads per ASCE 7-22',
        'Document live loads by area/occupancy type',
        'Create live load summary table'
      ],
      outputFormat: 'JSON with live load summary, reduction factors, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['maxLiveLoad', 'summary', 'artifacts'],
      properties: {
        maxLiveLoad: { type: 'number' },
        summary: {
          type: 'object',
          properties: {
            uniformLoads: { type: 'object' },
            concentratedLoads: { type: 'object' },
            partitionLoad: { type: 'number' }
          }
        },
        reductionFactors: { type: 'object' },
        loadsByOccupancy: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'structural', 'live-loads']
}));

// Task 4: Wind Load Analysis
export const windLoadAnalysisTask = defineTask('wind-load-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate wind loads per ASCE 7',
  agent: {
    name: 'structural-load-analyst',
    prompt: {
      role: 'wind engineering specialist',
      task: 'Determine wind loads using ASCE 7 procedures',
      context: args,
      instructions: [
        'Determine basic wind speed from ASCE 7 maps',
        'Determine wind directionality factor (Kd)',
        'Calculate exposure coefficient (Kz) by height',
        'Determine topographic factor (Kzt)',
        'Calculate velocity pressure (qz) at each level',
        'Determine pressure coefficients (GCp) for MWFRS',
        'Calculate design wind pressures for MWFRS',
        'Calculate component and cladding (C&C) pressures',
        'Document all parameters and calculations'
      ],
      outputFormat: 'JSON with wind load parameters, pressures by height, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['basicWindSpeed', 'summary', 'artifacts'],
      properties: {
        basicWindSpeed: { type: 'number' },
        summary: {
          type: 'object',
          properties: {
            exposureCategory: { type: 'string' },
            Kd: { type: 'number' },
            Kzt: { type: 'number' },
            baseShear: { type: 'number' }
          }
        },
        pressuresByHeight: { type: 'object' },
        mwfrsPressures: { type: 'object' },
        ccPressures: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'structural', 'wind-loads']
}));

// Task 5: Seismic Load Analysis
export const seismicLoadAnalysisTask = defineTask('seismic-load-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate seismic loads per ASCE 7',
  agent: {
    name: 'seismic-design-specialist',
    prompt: {
      role: 'seismic engineering specialist',
      task: 'Determine seismic design parameters and forces per ASCE 7',
      context: args,
      instructions: [
        'Determine spectral acceleration parameters (Ss, S1) from USGS data',
        'Determine site class based on soil conditions',
        'Calculate site coefficients (Fa, Fv)',
        'Calculate design spectral accelerations (SDS, SD1)',
        'Determine Seismic Design Category (SDC)',
        'Determine response modification coefficient (R)',
        'Calculate seismic response coefficient (Cs)',
        'Calculate seismic base shear (V)',
        'Distribute seismic forces vertically',
        'Check drift limits and story shear distribution'
      ],
      outputFormat: 'JSON with seismic parameters, force distribution, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['seismicDesignCategory', 'summary', 'artifacts'],
      properties: {
        seismicDesignCategory: { type: 'string' },
        summary: {
          type: 'object',
          properties: {
            Ss: { type: 'number' },
            S1: { type: 'number' },
            SDS: { type: 'number' },
            SD1: { type: 'number' },
            R: { type: 'number' },
            Cs: { type: 'number' },
            baseShear: { type: 'number' }
          }
        },
        forceDistribution: { type: 'object' },
        driftLimits: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'structural', 'seismic-loads']
}));

// Task 6: Snow and Rain Load Analysis
export const snowRainLoadAnalysisTask = defineTask('snow-rain-load-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate snow and rain loads',
  agent: {
    name: 'structural-load-analyst',
    prompt: {
      role: 'structural engineer',
      task: 'Determine snow and rain loads per ASCE 7',
      context: args,
      instructions: [
        'Determine ground snow load (pg) from ASCE 7 maps',
        'Calculate flat roof snow load (pf)',
        'Determine exposure factor (Ce) and thermal factor (Ct)',
        'Calculate sloped roof snow load (ps)',
        'Analyze drift snow loads at roof steps and parapets',
        'Calculate unbalanced snow loads',
        'Calculate rain-on-snow surcharge where applicable',
        'Determine rain loads for ponding analysis',
        'Check for progressive ponding instability'
      ],
      outputFormat: 'JSON with snow/rain load summary, drift loads, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'artifacts'],
      properties: {
        summary: {
          type: 'object',
          properties: {
            groundSnowLoad: { type: 'number' },
            flatRoofSnowLoad: { type: 'number' },
            slopedRoofSnowLoad: { type: 'number' },
            driftLoads: { type: 'object' },
            rainLoad: { type: 'number' }
          }
        },
        exposureFactor: { type: 'number' },
        thermalFactor: { type: 'number' },
        pondingAnalysis: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'structural', 'snow-rain-loads']
}));

// Task 7: Load Combinations
export const loadCombinationsTask = defineTask('load-combinations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop load combinations per ASCE 7',
  agent: {
    name: 'building-code-analyst',
    prompt: {
      role: 'structural engineer',
      task: 'Develop LRFD and ASD load combinations',
      context: args,
      instructions: [
        'List LRFD load combinations per ASCE 7 Section 2.3',
        'List ASD load combinations per ASCE 7 Section 2.4',
        'Apply appropriate load factors',
        'Consider companion loads and load coincidence',
        'Identify governing load combinations for different elements',
        'Calculate factored loads for each combination',
        'Create load combination matrix',
        'Document controlling load cases'
      ],
      outputFormat: 'JSON with load combinations, governing cases, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['combinations', 'governingCombination', 'artifacts'],
      properties: {
        combinations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              factors: { type: 'object' },
              totalLoad: { type: 'number' }
            }
          }
        },
        governingCombination: { type: 'string' },
        lrfdCombinations: { type: 'array' },
        asdCombinations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'structural', 'load-combinations']
}));

// Task 8: Load Path Analysis
export const loadPathAnalysisTask = defineTask('load-path-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze load paths',
  agent: {
    name: 'structural-load-analyst',
    prompt: {
      role: 'structural engineer',
      task: 'Trace and document load paths through structure',
      context: args,
      instructions: [
        'Trace gravity load path from roof to foundation',
        'Trace lateral load path for wind forces',
        'Trace lateral load path for seismic forces',
        'Identify load path discontinuities',
        'Document collector and drag elements',
        'Identify diaphragm load paths',
        'Create load path diagrams',
        'Identify critical connections in load path'
      ],
      outputFormat: 'JSON with load path descriptions, diagrams, critical elements'
    },
    outputSchema: {
      type: 'object',
      required: ['diagrams', 'artifacts'],
      properties: {
        diagrams: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              path: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        gravityLoadPath: { type: 'object' },
        lateralLoadPath: { type: 'object' },
        criticalConnections: { type: 'array' },
        discontinuities: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'structural', 'load-path']
}));

// Task 9: Load Report Generation
export const loadReportTask = defineTask('load-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive load summary report',
  agent: {
    name: 'technical-report-writer',
    prompt: {
      role: 'structural engineer and technical writer',
      task: 'Generate comprehensive structural load analysis report',
      context: args,
      instructions: [
        'Create executive summary of load analysis',
        'Document project parameters and design codes',
        'Present dead load summary with material weights',
        'Present live load summary with reduction factors',
        'Present wind load analysis with parameters',
        'Present seismic load analysis with design parameters',
        'Present snow and rain load summary',
        'Document all load combinations',
        'Include load path diagrams',
        'Provide design recommendations',
        'Format as professional engineering report'
      ],
      outputFormat: 'JSON with report path, key findings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'keyFindings', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        designRecommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'structural', 'reporting']
}));
