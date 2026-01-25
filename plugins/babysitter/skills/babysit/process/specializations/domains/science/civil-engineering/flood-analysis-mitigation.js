/**
 * @process civil-engineering/flood-analysis-mitigation
 * @description Flood frequency analysis, floodplain mapping, and flood mitigation design including levees, floodwalls, and channel improvements
 * @inputs { projectId: string, studyArea: object, hydrologicData: object, existingConditions: object }
 * @outputs { success: boolean, floodStudy: object, floodplainMaps: array, mitigationDesign: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectId,
    studyArea,
    hydrologicData,
    existingConditions,
    topographicData,
    structureInventory,
    designStandard = 'FEMA',
    outputDir = 'flood-analysis-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Flood Frequency Analysis
  ctx.log('info', 'Starting flood analysis: Flood frequency analysis');
  const frequencyAnalysis = await ctx.task(frequencyAnalysisTask, {
    projectId,
    hydrologicData,
    studyArea,
    outputDir
  });

  if (!frequencyAnalysis.success) {
    return {
      success: false,
      error: 'Flood frequency analysis failed',
      details: frequencyAnalysis,
      metadata: { processId: 'civil-engineering/flood-analysis-mitigation', timestamp: startTime }
    };
  }

  artifacts.push(...frequencyAnalysis.artifacts);

  // Task 2: Hydraulic Modeling
  ctx.log('info', 'Performing hydraulic modeling');
  const hydraulicModeling = await ctx.task(hydraulicModelingTask, {
    projectId,
    frequencyAnalysis,
    existingConditions,
    topographicData,
    outputDir
  });

  artifacts.push(...hydraulicModeling.artifacts);

  // Task 3: Floodplain Mapping
  ctx.log('info', 'Developing floodplain maps');
  const floodplainMapping = await ctx.task(floodplainMappingTask, {
    projectId,
    hydraulicModeling,
    topographicData,
    outputDir
  });

  artifacts.push(...floodplainMapping.artifacts);

  // Task 4: Flood Damage Assessment
  ctx.log('info', 'Assessing flood damages');
  const damageAssessment = await ctx.task(damageAssessmentTask, {
    projectId,
    floodplainMapping,
    structureInventory,
    outputDir
  });

  artifacts.push(...damageAssessment.artifacts);

  // Breakpoint: Review flood analysis
  await ctx.breakpoint({
    question: `Flood analysis complete for ${projectId}. 100-year flood elevation: ${hydraulicModeling.bfe100}. Review results?`,
    title: 'Flood Analysis Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        peakFlow100yr: frequencyAnalysis.q100,
        baseFloodElevation: hydraulicModeling.bfe100,
        floodplainArea: floodplainMapping.area100yr,
        structuresAtRisk: damageAssessment.structuresAtRisk,
        annualDamages: damageAssessment.expectedAnnualDamages
      }
    }
  });

  // Task 5: Mitigation Alternatives Analysis
  ctx.log('info', 'Analyzing mitigation alternatives');
  const mitigationAlternatives = await ctx.task(mitigationAlternativesTask, {
    projectId,
    hydraulicModeling,
    floodplainMapping,
    damageAssessment,
    outputDir
  });

  artifacts.push(...mitigationAlternatives.artifacts);

  // Task 6: Mitigation Design
  ctx.log('info', 'Designing flood mitigation');
  const mitigationDesign = await ctx.task(mitigationDesignTask, {
    projectId,
    mitigationAlternatives,
    hydraulicModeling,
    outputDir
  });

  artifacts.push(...mitigationDesign.artifacts);

  // Task 7: Revised Floodplain Analysis
  ctx.log('info', 'Analyzing with-project floodplain');
  const revisedAnalysis = await ctx.task(revisedAnalysisTask, {
    projectId,
    mitigationDesign,
    hydraulicModeling,
    outputDir
  });

  artifacts.push(...revisedAnalysis.artifacts);

  // Task 8: Flood Study Report
  ctx.log('info', 'Generating flood study report');
  const floodReport = await ctx.task(floodReportTask, {
    projectId,
    frequencyAnalysis,
    hydraulicModeling,
    floodplainMapping,
    damageAssessment,
    mitigationAlternatives,
    mitigationDesign,
    revisedAnalysis,
    outputDir
  });

  artifacts.push(...floodReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    floodStudy: {
      frequencyAnalysis: frequencyAnalysis.results,
      hydraulicModeling: hydraulicModeling.results,
      damageAssessment: damageAssessment.results
    },
    floodplainMaps: floodplainMapping.maps,
    mitigationDesign: mitigationDesign.design,
    benefitCostAnalysis: mitigationAlternatives.bcAnalysis,
    artifacts,
    duration,
    metadata: {
      processId: 'civil-engineering/flood-analysis-mitigation',
      timestamp: startTime,
      projectId,
      designStandard,
      outputDir
    }
  };
}

// Task 1: Flood Frequency Analysis
export const frequencyAnalysisTask = defineTask('frequency-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform flood frequency analysis',
  agent: {
    name: 'hydrology-analyst',
    prompt: {
      role: 'hydrologist',
      task: 'Perform flood frequency analysis',
      context: args,
      instructions: [
        'Compile streamflow records',
        'Perform statistical analysis (Log-Pearson Type III)',
        'Calculate flood quantiles (10, 25, 50, 100, 500-yr)',
        'Apply regional skew coefficient',
        'Perform rainfall-runoff modeling if needed',
        'Develop flood flow-frequency curves',
        'Document uncertainty and confidence intervals',
        'Compare with regional regression equations'
      ],
      outputFormat: 'JSON with flood quantiles, frequency curves'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'q100', 'results', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        results: { type: 'object' },
        q10: { type: 'number' },
        q25: { type: 'number' },
        q50: { type: 'number' },
        q100: { type: 'number' },
        q500: { type: 'number' },
        frequencyCurve: { type: 'object' },
        confidenceIntervals: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'flood', 'frequency-analysis']
}));

// Task 2: Hydraulic Modeling
export const hydraulicModelingTask = defineTask('hydraulic-modeling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform hydraulic modeling',
  agent: {
    name: 'hydraulic-engineer',
    prompt: {
      role: 'hydraulic engineer',
      task: 'Perform flood hydraulic modeling',
      context: args,
      instructions: [
        'Build HEC-RAS or similar hydraulic model',
        'Input cross-section geometry',
        'Define boundary conditions',
        'Calibrate to historical flood marks',
        'Run steady-state flood profiles',
        'Determine water surface elevations',
        'Analyze floodway encroachment',
        'Document hydraulic modeling results'
      ],
      outputFormat: 'JSON with water surface profiles, BFE'
    },
    outputSchema: {
      type: 'object',
      required: ['bfe100', 'results', 'artifacts'],
      properties: {
        results: { type: 'object' },
        bfe10: { type: 'number' },
        bfe100: { type: 'number' },
        bfe500: { type: 'number' },
        waterSurfaceProfiles: { type: 'object' },
        floodwayData: { type: 'object' },
        velocityDistribution: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'flood', 'hydraulic-modeling']
}));

// Task 3: Floodplain Mapping
export const floodplainMappingTask = defineTask('floodplain-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop floodplain maps',
  agent: {
    name: 'gis-analyst',
    prompt: {
      role: 'GIS/floodplain analyst',
      task: 'Develop floodplain inundation maps',
      context: args,
      instructions: [
        'Delineate 100-year floodplain boundary',
        'Delineate 500-year floodplain boundary',
        'Delineate regulatory floodway',
        'Map flood depths',
        'Create flood risk maps',
        'Identify special flood hazard areas',
        'Calculate floodplain area statistics',
        'Generate FIRM-style maps'
      ],
      outputFormat: 'JSON with floodplain maps, statistics'
    },
    outputSchema: {
      type: 'object',
      required: ['maps', 'area100yr', 'artifacts'],
      properties: {
        maps: { type: 'array' },
        area100yr: { type: 'number' },
        area500yr: { type: 'number' },
        floodwayArea: { type: 'number' },
        depthMaps: { type: 'array' },
        riskZones: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'flood', 'mapping']
}));

// Task 4: Flood Damage Assessment
export const damageAssessmentTask = defineTask('damage-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess flood damages',
  agent: {
    name: 'cost-estimator',
    prompt: {
      role: 'flood damage economist',
      task: 'Assess flood damages and risks',
      context: args,
      instructions: [
        'Inventory structures in floodplain',
        'Determine structure values',
        'Develop depth-damage functions',
        'Calculate damages by flood event',
        'Calculate expected annual damages (EAD)',
        'Assess non-structure damages',
        'Evaluate life safety risks',
        'Document damage assessment'
      ],
      outputFormat: 'JSON with damage estimates, EAD'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'structuresAtRisk', 'expectedAnnualDamages', 'artifacts'],
      properties: {
        results: { type: 'object' },
        structuresAtRisk: { type: 'number' },
        damagesByEvent: { type: 'object' },
        expectedAnnualDamages: { type: 'number' },
        lifeSafetyRisk: { type: 'object' },
        damageCategories: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'flood', 'damage-assessment']
}));

// Task 5: Mitigation Alternatives Analysis
export const mitigationAlternativesTask = defineTask('mitigation-alternatives', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze mitigation alternatives',
  agent: {
    name: 'cost-estimator',
    prompt: {
      role: 'flood mitigation planner',
      task: 'Evaluate flood mitigation alternatives',
      context: args,
      instructions: [
        'Identify structural alternatives (levees, walls, channels)',
        'Identify non-structural alternatives (buyouts, floodproofing)',
        'Estimate costs for each alternative',
        'Calculate benefits (damage reduction)',
        'Perform benefit-cost analysis',
        'Evaluate environmental impacts',
        'Rank alternatives',
        'Recommend preferred alternative'
      ],
      outputFormat: 'JSON with alternatives, B/C analysis, recommendation'
    },
    outputSchema: {
      type: 'object',
      required: ['alternatives', 'bcAnalysis', 'artifacts'],
      properties: {
        alternatives: { type: 'array' },
        bcAnalysis: {
          type: 'object',
          properties: {
            costs: { type: 'object' },
            benefits: { type: 'object' },
            bcRatios: { type: 'object' }
          }
        },
        environmentalImpacts: { type: 'object' },
        ranking: { type: 'array' },
        recommendation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'flood', 'alternatives']
}));

// Task 6: Mitigation Design
export const mitigationDesignTask = defineTask('mitigation-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design flood mitigation',
  agent: {
    name: 'hydraulic-engineer',
    prompt: {
      role: 'flood control engineer',
      task: 'Design flood mitigation measures',
      context: args,
      instructions: [
        'Design levee or floodwall alignment',
        'Size levee cross-section',
        'Design interior drainage/pump stations',
        'Design channel improvements',
        'Design detention/retention basins',
        'Analyze freeboard requirements',
        'Design closures and penetrations',
        'Create mitigation design drawings'
      ],
      outputFormat: 'JSON with mitigation design, details'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'artifacts'],
      properties: {
        design: { type: 'object' },
        leveeDesign: { type: 'object' },
        channelDesign: { type: 'object' },
        detentionDesign: { type: 'object' },
        interiorDrainage: { type: 'object' },
        freeboard: { type: 'number' },
        designLevel: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'flood', 'mitigation-design']
}));

// Task 7: Revised Floodplain Analysis
export const revisedAnalysisTask = defineTask('revised-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze with-project conditions',
  agent: {
    name: 'hydraulic-engineer',
    prompt: {
      role: 'hydraulic engineer',
      task: 'Analyze with-project floodplain conditions',
      context: args,
      instructions: [
        'Update hydraulic model with mitigation',
        'Run with-project flood profiles',
        'Determine revised floodplain limits',
        'Calculate residual risk',
        'Verify flood damage reduction',
        'Check for induced flooding impacts',
        'Document with-project conditions',
        'Compare pre and post-project'
      ],
      outputFormat: 'JSON with revised floodplain, damage reduction'
    },
    outputSchema: {
      type: 'object',
      required: ['revisedFloodplain', 'damageReduction', 'artifacts'],
      properties: {
        revisedFloodplain: { type: 'object' },
        revisedBFE: { type: 'number' },
        damageReduction: { type: 'number' },
        residualRisk: { type: 'object' },
        inducedImpacts: { type: 'array' },
        comparisonSummary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'civil-engineering', 'flood', 'revised-analysis']
}));

// Task 8: Flood Study Report
export const floodReportTask = defineTask('flood-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate flood study report',
  agent: {
    name: 'technical-report-writer',
    prompt: {
      role: 'flood study engineer',
      task: 'Generate comprehensive flood study report',
      context: args,
      instructions: [
        'Create executive summary',
        'Document study area and purpose',
        'Present hydrologic analysis',
        'Present hydraulic analysis',
        'Include floodplain maps',
        'Document damage assessment',
        'Present alternatives analysis',
        'Document recommended mitigation',
        'Include with-project analysis',
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
  labels: ['agent', 'civil-engineering', 'flood', 'reporting']
}));
