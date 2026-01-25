/**
 * @process environmental-engineering/stormwater-management-planning
 * @description Stormwater Management Planning - Development of integrated stormwater management plans incorporating
 * green infrastructure, detention/retention, and water quality treatment.
 * @inputs { projectName: string, drainageArea: number, landUse: object, regulatoryRequirements: object }
 * @outputs { success: boolean, managementPlan: object, bmps: array, hydraulicAnalysis: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('environmental-engineering/stormwater-management-planning', {
 *   projectName: 'Urban Redevelopment Stormwater Plan',
 *   drainageArea: 150, // acres
 *   landUse: { commercial: 40, residential: 35, openSpace: 25 },
 *   regulatoryRequirements: { postDevelopmentPeak: 'match predevelopment', waterQuality: 'TSS 80% removal' }
 * });
 *
 * @references
 * - EPA Stormwater Management Handbook
 * - State Stormwater Design Manuals
 * - ASCE/WEF Urban Stormwater Management
 * - Low Impact Development Technical Guidance
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    drainageArea,
    landUse = {},
    regulatoryRequirements = {},
    siteConditions = {},
    climateData = {},
    outputDir = 'stormwater-management-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Stormwater Management Planning: ${projectName}`);
  ctx.log('info', `Drainage Area: ${drainageArea} acres`);

  // ============================================================================
  // PHASE 1: SITE CHARACTERIZATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Site Characterization');

  const siteCharacterization = await ctx.task(siteCharacterizationTask, {
    projectName,
    drainageArea,
    landUse,
    siteConditions,
    outputDir
  });

  artifacts.push(...siteCharacterization.artifacts);

  // ============================================================================
  // PHASE 2: REGULATORY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Regulatory Analysis');

  const regulatoryAnalysis = await ctx.task(stormwaterRegulatoryTask, {
    projectName,
    regulatoryRequirements,
    siteCharacterization,
    outputDir
  });

  artifacts.push(...regulatoryAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: HYDROLOGIC ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Hydrologic Analysis');

  const hydrologicAnalysis = await ctx.task(hydrologicAnalysisTask, {
    projectName,
    drainageArea,
    siteCharacterization,
    climateData,
    outputDir
  });

  artifacts.push(...hydrologicAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: BMP SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 4: BMP Selection and Sizing');

  const bmpSelection = await ctx.task(bmpSelectionTask, {
    projectName,
    siteCharacterization,
    regulatoryAnalysis,
    hydrologicAnalysis,
    outputDir
  });

  artifacts.push(...bmpSelection.artifacts);

  // Breakpoint: BMP Selection Review
  await ctx.breakpoint({
    question: `BMP selection complete for ${projectName}. ${bmpSelection.selectedBMPs.length} BMPs selected. Review selection?`,
    title: 'BMP Selection Review',
    context: {
      runId: ctx.runId,
      selectedBMPs: bmpSelection.selectedBMPs,
      treatmentTrain: bmpSelection.treatmentTrain,
      files: bmpSelection.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 5: HYDRAULIC DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 5: Hydraulic Design');

  const hydraulicDesign = await ctx.task(hydraulicDesignTask, {
    projectName,
    hydrologicAnalysis,
    bmpSelection,
    siteCharacterization,
    outputDir
  });

  artifacts.push(...hydraulicDesign.artifacts);

  // ============================================================================
  // PHASE 6: GREEN INFRASTRUCTURE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 6: Green Infrastructure Design');

  const greenInfrastructure = await ctx.task(greenInfrastructureTask, {
    projectName,
    siteCharacterization,
    bmpSelection,
    hydrologicAnalysis,
    outputDir
  });

  artifacts.push(...greenInfrastructure.artifacts);

  // ============================================================================
  // PHASE 7: WATER QUALITY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 7: Water Quality Analysis');

  const waterQualityAnalysis = await ctx.task(waterQualityAnalysisTask, {
    projectName,
    bmpSelection,
    regulatoryAnalysis,
    landUse,
    outputDir
  });

  artifacts.push(...waterQualityAnalysis.artifacts);

  // ============================================================================
  // PHASE 8: MANAGEMENT PLAN DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Management Plan Documentation');

  const managementPlan = await ctx.task(managementPlanDocTask, {
    projectName,
    siteCharacterization,
    regulatoryAnalysis,
    hydrologicAnalysis,
    bmpSelection,
    hydraulicDesign,
    greenInfrastructure,
    waterQualityAnalysis,
    outputDir
  });

  artifacts.push(...managementPlan.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    managementPlan: {
      siteCharacterization: siteCharacterization.summary,
      regulatoryCompliance: regulatoryAnalysis.complianceStatus,
      hydrologicResults: hydrologicAnalysis.results,
      bmpDesign: bmpSelection.selectedBMPs,
      hydraulicDesign: hydraulicDesign.designSummary,
      greenInfrastructure: greenInfrastructure.giFeatures,
      waterQuality: waterQualityAnalysis.treatmentEfficiency
    },
    bmps: bmpSelection.selectedBMPs,
    hydraulicAnalysis: hydraulicDesign.analysisResults,
    waterQualityCompliance: waterQualityAnalysis.complianceStatus,
    artifacts,
    duration,
    metadata: {
      processId: 'environmental-engineering/stormwater-management-planning',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const siteCharacterizationTask = defineTask('site-characterization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Site Characterization',
  agent: {
    name: 'stormwater-specialist',
    prompt: {
      role: 'Stormwater Site Analyst',
      task: 'Characterize site for stormwater management planning',
      context: args,
      instructions: [
        '1. Delineate drainage area boundaries',
        '2. Characterize existing land use and cover',
        '3. Assess topography and slopes',
        '4. Evaluate soil types and infiltration capacity',
        '5. Identify groundwater conditions',
        '6. Map existing drainage patterns',
        '7. Identify environmentally sensitive areas',
        '8. Document impervious cover percentages',
        '9. Assess hotspot areas',
        '10. Prepare site characterization summary'
      ],
      outputFormat: 'JSON with summary, drainage characteristics, soil analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'drainageCharacteristics', 'soilAnalysis', 'artifacts'],
      properties: {
        summary: { type: 'object' },
        drainageCharacteristics: { type: 'object' },
        landCoverAnalysis: { type: 'object' },
        soilAnalysis: { type: 'object' },
        imperviousCover: { type: 'number' },
        sensitiveAreas: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'stormwater', 'site-characterization']
}));

export const stormwaterRegulatoryTask = defineTask('stormwater-regulatory', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Regulatory Analysis',
  agent: {
    name: 'environmental-compliance-specialist',
    prompt: {
      role: 'Stormwater Regulatory Specialist',
      task: 'Analyze stormwater regulatory requirements',
      context: args,
      instructions: [
        '1. Identify federal requirements (NPDES, MS4)',
        '2. Identify state stormwater regulations',
        '3. Identify local ordinances and requirements',
        '4. Determine peak flow control requirements',
        '5. Determine water quality requirements',
        '6. Assess channel protection requirements',
        '7. Identify floodplain regulations',
        '8. Determine permit requirements',
        '9. Document design criteria',
        '10. Create compliance checklist'
      ],
      outputFormat: 'JSON with requirements, design criteria, compliance checklist'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements', 'designCriteria', 'complianceStatus', 'artifacts'],
      properties: {
        requirements: { type: 'object' },
        federalRequirements: { type: 'array' },
        stateRequirements: { type: 'array' },
        localRequirements: { type: 'array' },
        designCriteria: { type: 'object' },
        permitRequirements: { type: 'array' },
        complianceStatus: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'stormwater', 'regulatory']
}));

export const hydrologicAnalysisTask = defineTask('hydrologic-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Hydrologic Analysis',
  agent: {
    name: 'stormwater-specialist',
    prompt: {
      role: 'Hydrologic Engineer',
      task: 'Perform hydrologic analysis for stormwater planning',
      context: args,
      instructions: [
        '1. Select appropriate hydrologic method (Rational, SCS, etc.)',
        '2. Develop rainfall data for design storms',
        '3. Calculate existing conditions runoff',
        '4. Calculate proposed conditions runoff',
        '5. Develop hydrographs for design storms',
        '6. Analyze time of concentration',
        '7. Calculate runoff volumes for water quality events',
        '8. Assess climate change impacts on rainfall',
        '9. Validate results with historic data if available',
        '10. Document hydrologic analysis'
      ],
      outputFormat: 'JSON with results, peak flows, runoff volumes'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'peakFlows', 'runoffVolumes', 'artifacts'],
      properties: {
        results: { type: 'object' },
        methodology: { type: 'string' },
        designStorms: { type: 'object' },
        peakFlows: { type: 'object' },
        hydrographs: { type: 'object' },
        runoffVolumes: { type: 'object' },
        timeOfConcentration: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'stormwater', 'hydrology']
}));

export const bmpSelectionTask = defineTask('bmp-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'BMP Selection and Sizing',
  agent: {
    name: 'stormwater-specialist',
    prompt: {
      role: 'Stormwater BMP Designer',
      task: 'Select and size stormwater BMPs',
      context: args,
      instructions: [
        '1. Screen BMP options based on site conditions',
        '2. Evaluate structural BMPs (detention, retention)',
        '3. Evaluate green infrastructure BMPs',
        '4. Assess BMP treatment capabilities',
        '5. Size BMPs for regulatory requirements',
        '6. Develop treatment train approach',
        '7. Consider maintenance requirements',
        '8. Estimate BMP costs',
        '9. Optimize BMP placement',
        '10. Document BMP selection rationale'
      ],
      outputFormat: 'JSON with selected BMPs, sizing, treatment train'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedBMPs', 'treatmentTrain', 'sizingSummary', 'artifacts'],
      properties: {
        selectedBMPs: { type: 'array' },
        bmpSizing: { type: 'object' },
        treatmentTrain: { type: 'array' },
        sizingSummary: { type: 'object' },
        selectionRationale: { type: 'object' },
        maintenanceRequirements: { type: 'object' },
        costEstimates: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'stormwater', 'bmps']
}));

export const hydraulicDesignTask = defineTask('hydraulic-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Hydraulic Design',
  agent: {
    name: 'stormwater-specialist',
    prompt: {
      role: 'Hydraulic Design Engineer',
      task: 'Perform hydraulic design for stormwater system',
      context: args,
      instructions: [
        '1. Design conveyance system',
        '2. Size storm sewers and culverts',
        '3. Design inlet structures',
        '4. Design outlet structures',
        '5. Perform channel analysis',
        '6. Design detention/retention facility hydraulics',
        '7. Analyze overflow and bypass',
        '8. Verify energy dissipation',
        '9. Check erosion protection needs',
        '10. Document hydraulic design'
      ],
      outputFormat: 'JSON with design summary, analysis results, conveyance sizing'
    },
    outputSchema: {
      type: 'object',
      required: ['designSummary', 'analysisResults', 'conveyanceSizing', 'artifacts'],
      properties: {
        designSummary: { type: 'object' },
        analysisResults: { type: 'object' },
        conveyanceSizing: { type: 'object' },
        outletDesign: { type: 'object' },
        detentionHydraulics: { type: 'object' },
        erosionProtection: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'stormwater', 'hydraulics']
}));

export const greenInfrastructureTask = defineTask('green-infrastructure', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Green Infrastructure Design',
  agent: {
    name: 'stormwater-specialist',
    prompt: {
      role: 'Green Infrastructure Specialist',
      task: 'Design green infrastructure features',
      context: args,
      instructions: [
        '1. Design bioretention facilities',
        '2. Design permeable pavement systems',
        '3. Design green roofs if applicable',
        '4. Design vegetated swales',
        '5. Design rain gardens',
        '6. Design infiltration trenches',
        '7. Specify vegetation and soil media',
        '8. Design underdrain systems',
        '9. Integrate GI with landscape design',
        '10. Document GI design details'
      ],
      outputFormat: 'JSON with GI features, design details, specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['giFeatures', 'designDetails', 'specifications', 'artifacts'],
      properties: {
        giFeatures: { type: 'array' },
        designDetails: { type: 'object' },
        bioretentionDesign: { type: 'object' },
        permeablePavement: { type: 'object' },
        vegetatedSwales: { type: 'object' },
        soilMediaSpec: { type: 'object' },
        vegetationSpec: { type: 'object' },
        specifications: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'stormwater', 'green-infrastructure']
}));

export const waterQualityAnalysisTask = defineTask('water-quality-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Water Quality Analysis',
  agent: {
    name: 'stormwater-specialist',
    prompt: {
      role: 'Stormwater Quality Analyst',
      task: 'Analyze stormwater quality treatment',
      context: args,
      instructions: [
        '1. Characterize pollutant loading',
        '2. Estimate pollutant concentrations by land use',
        '3. Calculate pollutant removal by BMP train',
        '4. Verify water quality compliance',
        '5. Assess TSS removal efficiency',
        '6. Assess nutrient removal',
        '7. Evaluate thermal impacts',
        '8. Consider TMDL requirements',
        '9. Document treatment efficiency',
        '10. Prepare water quality summary'
      ],
      outputFormat: 'JSON with treatment efficiency, compliance status, loading analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['treatmentEfficiency', 'complianceStatus', 'pollutantLoading', 'artifacts'],
      properties: {
        treatmentEfficiency: { type: 'object' },
        pollutantLoading: { type: 'object' },
        complianceStatus: { type: 'object' },
        tssRemoval: { type: 'number' },
        nutrientRemoval: { type: 'object' },
        thermalAnalysis: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'stormwater', 'water-quality']
}));

export const managementPlanDocTask = defineTask('management-plan-doc', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Management Plan Documentation',
  agent: {
    name: 'stormwater-specialist',
    prompt: {
      role: 'Stormwater Plan Developer',
      task: 'Compile stormwater management plan documentation',
      context: args,
      instructions: [
        '1. Prepare executive summary',
        '2. Document site characterization',
        '3. Present hydrologic analysis',
        '4. Detail BMP designs',
        '5. Present hydraulic analysis',
        '6. Document water quality analysis',
        '7. Prepare O&M plan',
        '8. Include construction details',
        '9. Prepare inspection and monitoring plan',
        '10. Compile appendices with calculations'
      ],
      outputFormat: 'JSON with plan summary, document paths, key findings'
    },
    outputSchema: {
      type: 'object',
      required: ['planSummary', 'documentPaths', 'keyFindings', 'artifacts'],
      properties: {
        planSummary: { type: 'object' },
        executiveSummary: { type: 'string' },
        documentPaths: { type: 'array' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        omPlan: { type: 'object' },
        monitoringPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'stormwater', 'documentation']
}));
