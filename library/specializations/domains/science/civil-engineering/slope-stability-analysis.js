/**
 * @process civil-engineering/slope-stability-analysis
 * @description Analysis of natural and engineered slopes including limit equilibrium analysis, factor of safety determination, and remediation design
 * @inputs { projectId: string, siteGeometry: object, soilProperties: object, groundwaterConditions: object }
 * @outputs { success: boolean, stabilityReport: object, factorOfSafety: number, remediationRecommendations: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectId,
    siteGeometry,
    soilProperties,
    groundwaterConditions,
    loadingConditions,
    seismicCoefficients,
    analysisMethod = 'spencer',
    outputDir = 'slope-stability-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Slope Geometry Definition
  ctx.log('info', 'Starting slope stability analysis: Defining geometry');
  const geometryDefinition = await ctx.task(geometryDefinitionTask, {
    projectId,
    siteGeometry,
    groundwaterConditions,
    outputDir
  });

  if (!geometryDefinition.success) {
    return {
      success: false,
      error: 'Geometry definition failed',
      details: geometryDefinition,
      metadata: { processId: 'civil-engineering/slope-stability-analysis', timestamp: startTime }
    };
  }

  artifacts.push(...geometryDefinition.artifacts);

  // Task 2: Soil Characterization
  ctx.log('info', 'Characterizing soil parameters for analysis');
  const soilCharacterization = await ctx.task(soilCharacterizationTask, {
    projectId,
    soilProperties,
    analysisMethod,
    outputDir
  });

  artifacts.push(...soilCharacterization.artifacts);

  // Task 3: Static Stability Analysis
  ctx.log('info', 'Performing static stability analysis');
  const staticAnalysis = await ctx.task(staticStabilityTask, {
    projectId,
    geometryDefinition,
    soilCharacterization,
    loadingConditions,
    analysisMethod,
    outputDir
  });

  artifacts.push(...staticAnalysis.artifacts);

  // Task 4: Seismic Stability Analysis
  ctx.log('info', 'Performing seismic stability analysis');
  const seismicAnalysis = await ctx.task(seismicStabilityTask, {
    projectId,
    geometryDefinition,
    soilCharacterization,
    seismicCoefficients,
    analysisMethod,
    outputDir
  });

  artifacts.push(...seismicAnalysis.artifacts);

  // Task 5: Groundwater Sensitivity Analysis
  ctx.log('info', 'Performing groundwater sensitivity analysis');
  const groundwaterSensitivity = await ctx.task(groundwaterSensitivityTask, {
    projectId,
    geometryDefinition,
    soilCharacterization,
    groundwaterConditions,
    outputDir
  });

  artifacts.push(...groundwaterSensitivity.artifacts);

  // Breakpoint: Review stability analysis results
  const minFOS = Math.min(staticAnalysis.factorOfSafety, seismicAnalysis.factorOfSafety);
  await ctx.breakpoint({
    question: `Slope stability analysis complete. Static FOS: ${staticAnalysis.factorOfSafety}, Seismic FOS: ${seismicAnalysis.factorOfSafety}. Review results?`,
    title: 'Slope Stability Analysis Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        staticFOS: staticAnalysis.factorOfSafety,
        seismicFOS: seismicAnalysis.factorOfSafety,
        criticalSurface: staticAnalysis.criticalSurface,
        minimumFOS: minFOS,
        remediationRequired: minFOS < 1.5
      }
    }
  });

  // Task 6: Remediation Design (if needed)
  let remediationDesign = null;
  if (minFOS < 1.5) {
    ctx.log('info', 'Designing slope remediation');
    remediationDesign = await ctx.task(remediationDesignTask, {
      projectId,
      geometryDefinition,
      staticAnalysis,
      seismicAnalysis,
      soilCharacterization,
      outputDir
    });

    artifacts.push(...remediationDesign.artifacts);
  }

  // Task 7: Monitoring Recommendations
  ctx.log('info', 'Developing monitoring recommendations');
  const monitoringPlan = await ctx.task(monitoringPlanTask, {
    projectId,
    staticAnalysis,
    seismicAnalysis,
    remediationDesign,
    outputDir
  });

  artifacts.push(...monitoringPlan.artifacts);

  // Task 8: Stability Report
  ctx.log('info', 'Generating slope stability report');
  const stabilityReport = await ctx.task(stabilityReportTask, {
    projectId,
    geometryDefinition,
    soilCharacterization,
    staticAnalysis,
    seismicAnalysis,
    groundwaterSensitivity,
    remediationDesign,
    monitoringPlan,
    outputDir
  });

  artifacts.push(...stabilityReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    stabilityReport: {
      geometry: geometryDefinition.geometry,
      soilParameters: soilCharacterization.parameters,
      staticResults: staticAnalysis.results,
      seismicResults: seismicAnalysis.results,
      groundwaterSensitivity: groundwaterSensitivity.results
    },
    factorOfSafety: {
      static: staticAnalysis.factorOfSafety,
      seismic: seismicAnalysis.factorOfSafety,
      minimum: minFOS
    },
    criticalSurface: staticAnalysis.criticalSurface,
    remediationRecommendations: remediationDesign?.recommendations,
    monitoringPlan: monitoringPlan.plan,
    artifacts,
    duration,
    metadata: {
      processId: 'civil-engineering/slope-stability-analysis',
      timestamp: startTime,
      projectId,
      analysisMethod,
      outputDir
    }
  };
}

// Task 1: Geometry Definition
export const geometryDefinitionTask = defineTask('geometry-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define slope geometry',
  agent: {
    name: 'slope-stability-analyst',
    prompt: {
      role: 'geotechnical engineer',
      task: 'Define slope geometry for stability analysis',
      context: args,
      instructions: [
        'Define slope cross-section from survey data',
        'Identify soil layer boundaries',
        'Define groundwater table or piezometric surface',
        'Identify existing structures or surcharges',
        'Define analysis boundaries',
        'Create slope geometry model',
        'Identify potential weak layers',
        'Document geometry assumptions'
      ],
      outputFormat: 'JSON with geometry model, layer definitions, water table'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'geometry', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        geometry: { type: 'object' },
        slopeAngle: { type: 'number' },
        slopeHeight: { type: 'number' },
        soilLayers: { type: 'array' },
        waterTable: { type: 'object' },
        surcharges: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'slope-stability', 'geometry']
}));

// Task 2: Soil Characterization
export const soilCharacterizationTask = defineTask('soil-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Characterize soil parameters',
  agent: {
    name: 'slope-stability-analyst',
    prompt: {
      role: 'geotechnical engineer',
      task: 'Determine soil strength parameters for analysis',
      context: args,
      instructions: [
        'Determine effective stress parameters (c\', phi\')',
        'Determine total stress parameters if needed',
        'Evaluate residual strength for clays',
        'Consider strain softening behavior',
        'Establish unit weights (total and saturated)',
        'Apply appropriate factors of safety to parameters',
        'Document parameter selection rationale',
        'Consider parameter variability'
      ],
      outputFormat: 'JSON with soil parameters by layer'
    },
    outputSchema: {
      type: 'object',
      required: ['parameters', 'artifacts'],
      properties: {
        parameters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              layer: { type: 'string' },
              cohesion: { type: 'number' },
              frictionAngle: { type: 'number' },
              unitWeight: { type: 'number' }
            }
          }
        },
        parameterSelection: { type: 'object' },
        sensitivityRange: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'slope-stability', 'soil-parameters']
}));

// Task 3: Static Stability Analysis
export const staticStabilityTask = defineTask('static-stability', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform static stability analysis',
  agent: {
    name: 'slope-stability-analyst',
    prompt: {
      role: 'geotechnical engineer',
      task: 'Perform limit equilibrium slope stability analysis',
      context: args,
      instructions: [
        'Select analysis method (Bishop, Spencer, Morgenstern-Price)',
        'Define search parameters for critical surface',
        'Analyze circular failure surfaces',
        'Analyze non-circular surfaces if applicable',
        'Calculate factor of safety for each surface',
        'Identify critical slip surface',
        'Document forces and moments',
        'Generate stability charts'
      ],
      outputFormat: 'JSON with FOS, critical surface, forces'
    },
    outputSchema: {
      type: 'object',
      required: ['factorOfSafety', 'criticalSurface', 'results', 'artifacts'],
      properties: {
        factorOfSafety: { type: 'number' },
        criticalSurface: { type: 'object' },
        results: { type: 'object' },
        analysisMethod: { type: 'string' },
        sliceForces: { type: 'array' },
        stabilityCharts: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'slope-stability', 'static']
}));

// Task 4: Seismic Stability Analysis
export const seismicStabilityTask = defineTask('seismic-stability', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform seismic stability analysis',
  agent: {
    name: 'slope-stability-analyst',
    prompt: {
      role: 'geotechnical engineer',
      task: 'Perform pseudo-static seismic stability analysis',
      context: args,
      instructions: [
        'Determine seismic coefficients (kh, kv)',
        'Apply horizontal seismic force to slices',
        'Recalculate factor of safety',
        'Evaluate liquefaction potential if applicable',
        'Perform Newmark displacement analysis if needed',
        'Check permanent deformation limits',
        'Identify critical seismic surface',
        'Document seismic analysis results'
      ],
      outputFormat: 'JSON with seismic FOS, displacements'
    },
    outputSchema: {
      type: 'object',
      required: ['factorOfSafety', 'artifacts'],
      properties: {
        factorOfSafety: { type: 'number' },
        seismicCoefficients: { type: 'object' },
        permanentDisplacement: { type: 'number' },
        liquefactionPotential: { type: 'string' },
        results: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'slope-stability', 'seismic']
}));

// Task 5: Groundwater Sensitivity Analysis
export const groundwaterSensitivityTask = defineTask('groundwater-sensitivity', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform groundwater sensitivity analysis',
  agent: {
    name: 'slope-stability-analyst',
    prompt: {
      role: 'geotechnical engineer',
      task: 'Analyze sensitivity to groundwater conditions',
      context: args,
      instructions: [
        'Analyze stability at various water table levels',
        'Consider rapid drawdown conditions',
        'Evaluate pore pressure effects',
        'Analyze rainfall infiltration scenarios',
        'Create FOS vs. water level charts',
        'Identify critical groundwater conditions',
        'Recommend drainage requirements',
        'Document sensitivity results'
      ],
      outputFormat: 'JSON with sensitivity results, charts'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'artifacts'],
      properties: {
        results: { type: 'object' },
        waterLevelSensitivity: { type: 'array' },
        criticalWaterLevel: { type: 'number' },
        rapidDrawdownFOS: { type: 'number' },
        drainageRecommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'slope-stability', 'groundwater']
}));

// Task 6: Remediation Design
export const remediationDesignTask = defineTask('remediation-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design slope remediation',
  agent: {
    name: 'slope-stability-analyst',
    prompt: {
      role: 'geotechnical engineer',
      task: 'Design slope stabilization measures',
      context: args,
      instructions: [
        'Evaluate remediation alternatives',
        'Design slope regrading if feasible',
        'Design retaining structures if needed',
        'Design soil nails or ground anchors',
        'Design drainage improvements',
        'Design buttress or counterweight berms',
        'Verify improved FOS',
        'Prepare cost estimates for alternatives'
      ],
      outputFormat: 'JSON with remediation design, improved FOS'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'improvedFOS', 'artifacts'],
      properties: {
        recommendations: { type: 'object' },
        selectedAlternative: { type: 'string' },
        improvedFOS: { type: 'number' },
        designDetails: { type: 'object' },
        costEstimate: { type: 'number' },
        constructionSequence: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'slope-stability', 'remediation']
}));

// Task 7: Monitoring Plan
export const monitoringPlanTask = defineTask('monitoring-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop monitoring recommendations',
  agent: {
    name: 'geotechnical-investigation-specialist',
    prompt: {
      role: 'geotechnical engineer',
      task: 'Develop slope monitoring plan',
      context: args,
      instructions: [
        'Recommend inclinometer locations',
        'Specify piezometer installation',
        'Define survey monitoring points',
        'Establish monitoring frequency',
        'Define alert thresholds',
        'Establish emergency response triggers',
        'Recommend instrumentation types',
        'Define reporting requirements'
      ],
      outputFormat: 'JSON with monitoring plan, instruments, thresholds'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        instruments: { type: 'array' },
        monitoringSchedule: { type: 'object' },
        alertThresholds: { type: 'object' },
        emergencyTriggers: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'slope-stability', 'monitoring']
}));

// Task 8: Stability Report
export const stabilityReportTask = defineTask('stability-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate slope stability report',
  agent: {
    name: 'technical-report-writer',
    prompt: {
      role: 'geotechnical engineer',
      task: 'Generate comprehensive slope stability report',
      context: args,
      instructions: [
        'Create executive summary',
        'Document site conditions and geometry',
        'Present soil parameters',
        'Document static analysis results',
        'Document seismic analysis results',
        'Present groundwater sensitivity',
        'Present remediation recommendations',
        'Include monitoring plan',
        'Provide conclusions and recommendations'
      ],
      outputFormat: 'JSON with report path, key findings'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'keyFindings', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        keyFindings: { type: 'array' },
        conclusions: { type: 'array' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'slope-stability', 'reporting']
}));
