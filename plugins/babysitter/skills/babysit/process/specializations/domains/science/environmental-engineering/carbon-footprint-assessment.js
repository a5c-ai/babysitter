/**
 * @process environmental-engineering/carbon-footprint-assessment
 * @description Carbon Footprint Assessment - Quantification of organizational and product carbon footprints
 * using GHG Protocol methodologies.
 * @inputs { entityName: string, assessmentType: string, reportingYear: number, organizationalBoundary: object }
 * @outputs { success: boolean, carbonFootprint: object, emissionSources: array, reductionOpportunities: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('environmental-engineering/carbon-footprint-assessment', {
 *   entityName: 'Corporate HQ Operations',
 *   assessmentType: 'organizational',
 *   reportingYear: 2024,
 *   organizationalBoundary: { approach: 'operational-control', facilities: ['HQ', 'Warehouse', 'Distribution'] }
 * });
 *
 * @references
 * - GHG Protocol Corporate Standard
 * - GHG Protocol Scope 3 Guidance
 * - ISO 14064-1 - Organization Level GHG Quantification
 * - Product Life Cycle Standard
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    entityName,
    assessmentType = 'organizational',
    reportingYear,
    organizationalBoundary = {},
    scope3Categories = [],
    outputDir = 'carbon-footprint-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Carbon Footprint Assessment: ${entityName}`);
  ctx.log('info', `Type: ${assessmentType}, Year: ${reportingYear}`);

  // ============================================================================
  // PHASE 1: BOUNDARY DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Boundary Definition');

  const boundaryDefinition = await ctx.task(boundaryDefinitionTask, {
    entityName,
    assessmentType,
    organizationalBoundary,
    scope3Categories,
    outputDir
  });

  artifacts.push(...boundaryDefinition.artifacts);

  // ============================================================================
  // PHASE 2: ACTIVITY DATA COLLECTION
  // ============================================================================

  ctx.log('info', 'Phase 2: Activity Data Collection');

  const activityData = await ctx.task(cfActivityDataTask, {
    entityName,
    boundaryDefinition,
    reportingYear,
    outputDir
  });

  artifacts.push(...activityData.artifacts);

  // ============================================================================
  // PHASE 3: SCOPE 1 EMISSIONS
  // ============================================================================

  ctx.log('info', 'Phase 3: Scope 1 Emissions Calculation');

  const scope1Emissions = await ctx.task(scope1CalculationTask, {
    entityName,
    activityData,
    reportingYear,
    outputDir
  });

  artifacts.push(...scope1Emissions.artifacts);

  // ============================================================================
  // PHASE 4: SCOPE 2 EMISSIONS
  // ============================================================================

  ctx.log('info', 'Phase 4: Scope 2 Emissions Calculation');

  const scope2Emissions = await ctx.task(scope2CalculationTask, {
    entityName,
    activityData,
    reportingYear,
    outputDir
  });

  artifacts.push(...scope2Emissions.artifacts);

  // ============================================================================
  // PHASE 5: SCOPE 3 EMISSIONS
  // ============================================================================

  ctx.log('info', 'Phase 5: Scope 3 Emissions Calculation');

  const scope3Emissions = await ctx.task(scope3CalculationTask, {
    entityName,
    activityData,
    scope3Categories,
    reportingYear,
    outputDir
  });

  artifacts.push(...scope3Emissions.artifacts);

  // Breakpoint: Emissions Review
  await ctx.breakpoint({
    question: `Carbon footprint calculated for ${entityName}. Total: ${scope1Emissions.total + scope2Emissions.total + scope3Emissions.total} tCO2e. Review results?`,
    title: 'Carbon Footprint Review',
    context: {
      runId: ctx.runId,
      scope1: scope1Emissions.total,
      scope2: scope2Emissions.total,
      scope3: scope3Emissions.total,
      files: scope3Emissions.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 6: DATA QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 6: Data Quality Assessment');

  const dataQuality = await ctx.task(cfDataQualityTask, {
    entityName,
    scope1Emissions,
    scope2Emissions,
    scope3Emissions,
    activityData,
    outputDir
  });

  artifacts.push(...dataQuality.artifacts);

  // ============================================================================
  // PHASE 7: REDUCTION OPPORTUNITIES
  // ============================================================================

  ctx.log('info', 'Phase 7: Reduction Opportunities Analysis');

  const reductionAnalysis = await ctx.task(cfReductionTask, {
    entityName,
    scope1Emissions,
    scope2Emissions,
    scope3Emissions,
    outputDir
  });

  artifacts.push(...reductionAnalysis.artifacts);

  // ============================================================================
  // PHASE 8: CARBON FOOTPRINT REPORT
  // ============================================================================

  ctx.log('info', 'Phase 8: Carbon Footprint Report');

  const footprintReport = await ctx.task(cfReportTask, {
    entityName,
    reportingYear,
    boundaryDefinition,
    scope1Emissions,
    scope2Emissions,
    scope3Emissions,
    dataQuality,
    reductionAnalysis,
    outputDir
  });

  artifacts.push(...footprintReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  const totalEmissions = scope1Emissions.total + scope2Emissions.total + scope3Emissions.total;

  return {
    success: true,
    entityName,
    carbonFootprint: {
      reportingYear,
      totalEmissions,
      scope1: scope1Emissions.total,
      scope2: scope2Emissions.total,
      scope3: scope3Emissions.total,
      unit: 'tCO2e'
    },
    emissionSources: {
      scope1Sources: scope1Emissions.sources,
      scope2Sources: scope2Emissions.sources,
      scope3Sources: scope3Emissions.sources
    },
    reductionOpportunities: reductionAnalysis.opportunities,
    dataQualityScore: dataQuality.overallScore,
    artifacts,
    duration,
    metadata: {
      processId: 'environmental-engineering/carbon-footprint-assessment',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const boundaryDefinitionTask = defineTask('boundary-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Boundary Definition',
  agent: {
    name: 'ghg-sustainability-specialist',
    prompt: {
      role: 'GHG Inventory Specialist',
      task: 'Define organizational and operational boundaries',
      context: args,
      instructions: [
        '1. Define organizational boundary approach',
        '2. Identify all facilities/operations',
        '3. Define operational boundaries (Scope 1, 2, 3)',
        '4. Identify Scope 3 categories to include',
        '5. Document boundary exclusions',
        '6. Define base year if applicable',
        '7. Document consolidation approach',
        '8. Identify joint ventures and subsidiaries',
        '9. Document boundary justification',
        '10. Prepare boundary documentation'
      ],
      outputFormat: 'JSON with boundaries, facilities, scope 3 categories'
    },
    outputSchema: {
      type: 'object',
      required: ['organizationalBoundary', 'operationalBoundary', 'scope3Included', 'artifacts'],
      properties: {
        organizationalBoundary: { type: 'object' },
        consolidationApproach: { type: 'string' },
        facilitiesIncluded: { type: 'array' },
        operationalBoundary: { type: 'object' },
        scope3Included: { type: 'array' },
        exclusions: { type: 'array' },
        baseYear: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'carbon-footprint', 'boundary']
}));

export const cfActivityDataTask = defineTask('cf-activity-data', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Activity Data Collection',
  agent: {
    name: 'ghg-sustainability-specialist',
    prompt: {
      role: 'GHG Data Analyst',
      task: 'Collect activity data for emissions calculation',
      context: args,
      instructions: [
        '1. Collect fuel consumption data',
        '2. Collect electricity consumption data',
        '3. Collect fleet/vehicle data',
        '4. Collect process emissions data',
        '5. Collect refrigerant data',
        '6. Collect purchased goods data',
        '7. Collect transportation data',
        '8. Collect waste data',
        '9. Validate data completeness',
        '10. Document data sources'
      ],
      outputFormat: 'JSON with activity data by category, data sources'
    },
    outputSchema: {
      type: 'object',
      required: ['activityData', 'dataSources', 'dataGaps', 'artifacts'],
      properties: {
        activityData: { type: 'object' },
        fuelData: { type: 'object' },
        electricityData: { type: 'object' },
        vehicleData: { type: 'object' },
        processData: { type: 'object' },
        purchasedGoodsData: { type: 'object' },
        dataSources: { type: 'object' },
        dataGaps: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'carbon-footprint', 'data']
}));

export const scope1CalculationTask = defineTask('scope1-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Scope 1 Emissions Calculation',
  agent: {
    name: 'ghg-sustainability-specialist',
    prompt: {
      role: 'GHG Calculator',
      task: 'Calculate Scope 1 direct emissions',
      context: args,
      instructions: [
        '1. Calculate stationary combustion emissions',
        '2. Calculate mobile combustion emissions',
        '3. Calculate process emissions',
        '4. Calculate fugitive emissions (refrigerants)',
        '5. Apply appropriate emission factors',
        '6. Convert to CO2 equivalent',
        '7. Apply GWP values',
        '8. Summarize by source category',
        '9. Document calculation methodology',
        '10. Prepare Scope 1 summary'
      ],
      outputFormat: 'JSON with total, by source, by gas'
    },
    outputSchema: {
      type: 'object',
      required: ['total', 'sources', 'byGas', 'artifacts'],
      properties: {
        total: { type: 'number' },
        stationaryCombustion: { type: 'object' },
        mobileCombustion: { type: 'object' },
        processEmissions: { type: 'object' },
        fugitiveEmissions: { type: 'object' },
        sources: { type: 'array' },
        byGas: { type: 'object' },
        calculationMethods: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'carbon-footprint', 'scope1']
}));

export const scope2CalculationTask = defineTask('scope2-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Scope 2 Emissions Calculation',
  agent: {
    name: 'ghg-sustainability-specialist',
    prompt: {
      role: 'GHG Calculator',
      task: 'Calculate Scope 2 indirect emissions',
      context: args,
      instructions: [
        '1. Calculate location-based emissions',
        '2. Calculate market-based emissions',
        '3. Apply grid emission factors',
        '4. Account for renewable energy',
        '5. Apply RECs and PPAs',
        '6. Calculate steam/heat emissions',
        '7. Calculate cooling emissions',
        '8. Document dual reporting',
        '9. Document methodology',
        '10. Prepare Scope 2 summary'
      ],
      outputFormat: 'JSON with total, location-based, market-based'
    },
    outputSchema: {
      type: 'object',
      required: ['total', 'locationBased', 'marketBased', 'sources', 'artifacts'],
      properties: {
        total: { type: 'number' },
        locationBased: { type: 'object' },
        marketBased: { type: 'object' },
        electricityEmissions: { type: 'object' },
        steamEmissions: { type: 'object' },
        sources: { type: 'array' },
        renewableEnergy: { type: 'object' },
        gridFactors: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'carbon-footprint', 'scope2']
}));

export const scope3CalculationTask = defineTask('scope3-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Scope 3 Emissions Calculation',
  agent: {
    name: 'ghg-sustainability-specialist',
    prompt: {
      role: 'Scope 3 Specialist',
      task: 'Calculate Scope 3 value chain emissions',
      context: args,
      instructions: [
        '1. Screen all 15 Scope 3 categories',
        '2. Calculate purchased goods and services',
        '3. Calculate capital goods',
        '4. Calculate upstream transportation',
        '5. Calculate waste generated',
        '6. Calculate business travel',
        '7. Calculate employee commuting',
        '8. Calculate downstream emissions',
        '9. Document calculation methods',
        '10. Prepare Scope 3 summary'
      ],
      outputFormat: 'JSON with total, by category'
    },
    outputSchema: {
      type: 'object',
      required: ['total', 'byCategory', 'sources', 'artifacts'],
      properties: {
        total: { type: 'number' },
        byCategory: { type: 'object' },
        category1: { type: 'object' },
        category2: { type: 'object' },
        category3: { type: 'object' },
        category4: { type: 'object' },
        category5: { type: 'object' },
        category6: { type: 'object' },
        category7: { type: 'object' },
        sources: { type: 'array' },
        screeningResults: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'carbon-footprint', 'scope3']
}));

export const cfDataQualityTask = defineTask('cf-data-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Data Quality Assessment',
  agent: {
    name: 'ghg-sustainability-specialist',
    prompt: {
      role: 'GHG Data Quality Analyst',
      task: 'Assess data quality of GHG inventory',
      context: args,
      instructions: [
        '1. Assess data completeness',
        '2. Assess data accuracy',
        '3. Assess data consistency',
        '4. Assess data transparency',
        '5. Evaluate emission factor quality',
        '6. Identify uncertainty sources',
        '7. Calculate uncertainty ranges',
        '8. Identify improvement opportunities',
        '9. Score overall data quality',
        '10. Document data quality assessment'
      ],
      outputFormat: 'JSON with overall score, quality indicators, uncertainties'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'qualityIndicators', 'uncertainties', 'artifacts'],
      properties: {
        overallScore: { type: 'number' },
        qualityIndicators: { type: 'object' },
        completeness: { type: 'object' },
        accuracy: { type: 'object' },
        consistency: { type: 'object' },
        uncertainties: { type: 'object' },
        uncertaintyRange: { type: 'object' },
        improvementOpportunities: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'carbon-footprint', 'data-quality']
}));

export const cfReductionTask = defineTask('cf-reduction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Reduction Opportunities Analysis',
  agent: {
    name: 'ghg-sustainability-specialist',
    prompt: {
      role: 'Carbon Reduction Analyst',
      task: 'Identify carbon reduction opportunities',
      context: args,
      instructions: [
        '1. Identify hotspots in footprint',
        '2. Evaluate energy efficiency opportunities',
        '3. Evaluate renewable energy options',
        '4. Evaluate electrification opportunities',
        '5. Evaluate supply chain opportunities',
        '6. Estimate reduction potential',
        '7. Assess implementation costs',
        '8. Prioritize by cost-effectiveness',
        '9. Develop reduction pathway',
        '10. Document reduction opportunities'
      ],
      outputFormat: 'JSON with opportunities, reduction potential, costs'
    },
    outputSchema: {
      type: 'object',
      required: ['opportunities', 'reductionPotential', 'costs', 'artifacts'],
      properties: {
        hotspots: { type: 'array' },
        opportunities: { type: 'array' },
        energyEfficiency: { type: 'array' },
        renewableEnergy: { type: 'array' },
        supplyChain: { type: 'array' },
        reductionPotential: { type: 'object' },
        costs: { type: 'object' },
        reductionPathway: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'carbon-footprint', 'reduction']
}));

export const cfReportTask = defineTask('cf-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Carbon Footprint Report',
  agent: {
    name: 'ghg-sustainability-specialist',
    prompt: {
      role: 'GHG Report Writer',
      task: 'Generate carbon footprint report',
      context: args,
      instructions: [
        '1. Prepare executive summary',
        '2. Document boundary and methodology',
        '3. Present Scope 1 results',
        '4. Present Scope 2 results',
        '5. Present Scope 3 results',
        '6. Document data quality',
        '7. Present reduction opportunities',
        '8. Create visualizations',
        '9. Prepare verification-ready documentation',
        '10. Generate final report'
      ],
      outputFormat: 'JSON with report path, executive summary, key visuals'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'keyVisuals', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyVisuals: { type: 'array' },
        verificationDocumentation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'carbon-footprint', 'reporting']
}));
