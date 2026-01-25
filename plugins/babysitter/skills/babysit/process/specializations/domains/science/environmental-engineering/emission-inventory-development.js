/**
 * @process environmental-engineering/emission-inventory-development
 * @description Emission Inventory Development - Systematic approach to identifying, characterizing, and quantifying
 * air emission sources for regulatory compliance and planning purposes.
 * @inputs { facilityName: string, facilityType: string, inventoryPurpose: string, inventoryYear: number }
 * @outputs { success: boolean, emissionInventory: object, sourceCategories: array, complianceStatus: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('environmental-engineering/emission-inventory-development', {
 *   facilityName: 'Chemical Manufacturing Plant',
 *   facilityType: 'chemical',
 *   inventoryPurpose: 'Title V renewal',
 *   inventoryYear: 2024
 * });
 *
 * @references
 * - EPA AP-42 Compilation of Emission Factors
 * - EPA FIRE Database
 * - EPA Emission Inventory Improvement Program (EIIP)
 * - State Emission Inventory Guidelines
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    facilityName,
    facilityType = 'industrial',
    inventoryPurpose = 'compliance',
    inventoryYear,
    processUnits = [],
    outputDir = 'emission-inventory-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Emission Inventory Development: ${facilityName}`);
  ctx.log('info', `Purpose: ${inventoryPurpose}, Year: ${inventoryYear}`);

  // ============================================================================
  // PHASE 1: SOURCE IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Emission Source Identification');

  const sourceIdentification = await ctx.task(sourceIdentificationTask, {
    facilityName,
    facilityType,
    processUnits,
    outputDir
  });

  artifacts.push(...sourceIdentification.artifacts);

  // ============================================================================
  // PHASE 2: EMISSION FACTOR SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 2: Emission Factor Selection');

  const emissionFactors = await ctx.task(emissionFactorSelectionTask, {
    facilityName,
    sourceIdentification,
    inventoryYear,
    outputDir
  });

  artifacts.push(...emissionFactors.artifacts);

  // ============================================================================
  // PHASE 3: ACTIVITY DATA COMPILATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Activity Data Compilation');

  const activityData = await ctx.task(activityDataTask, {
    facilityName,
    sourceIdentification,
    inventoryYear,
    outputDir
  });

  artifacts.push(...activityData.artifacts);

  // ============================================================================
  // PHASE 4: EMISSION CALCULATIONS
  // ============================================================================

  ctx.log('info', 'Phase 4: Emission Calculations');

  const emissionCalcs = await ctx.task(emissionCalculationsTask, {
    facilityName,
    sourceIdentification,
    emissionFactors,
    activityData,
    outputDir
  });

  artifacts.push(...emissionCalcs.artifacts);

  // Breakpoint: Calculation Review
  await ctx.breakpoint({
    question: `Emission calculations complete for ${facilityName}. Total emissions: ${JSON.stringify(emissionCalcs.totalEmissions)}. Review calculations?`,
    title: 'Emission Calculation Review',
    context: {
      runId: ctx.runId,
      totalEmissions: emissionCalcs.totalEmissions,
      emissionsByCategory: emissionCalcs.emissionsByCategory,
      files: emissionCalcs.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 5: QA/QC REVIEW
  // ============================================================================

  ctx.log('info', 'Phase 5: QA/QC Review');

  const qaqcReview = await ctx.task(inventoryQAQCTask, {
    facilityName,
    emissionCalcs,
    activityData,
    emissionFactors,
    outputDir
  });

  artifacts.push(...qaqcReview.artifacts);

  // ============================================================================
  // PHASE 6: COMPLIANCE ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 6: Regulatory Compliance Assessment');

  const complianceAssessment = await ctx.task(inventoryComplianceTask, {
    facilityName,
    emissionCalcs,
    inventoryPurpose,
    outputDir
  });

  artifacts.push(...complianceAssessment.artifacts);

  // ============================================================================
  // PHASE 7: INVENTORY DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Inventory Documentation');

  const inventoryDocs = await ctx.task(inventoryDocumentationTask, {
    facilityName,
    inventoryYear,
    inventoryPurpose,
    sourceIdentification,
    emissionFactors,
    activityData,
    emissionCalcs,
    qaqcReview,
    complianceAssessment,
    outputDir
  });

  artifacts.push(...inventoryDocs.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    facilityName,
    emissionInventory: {
      year: inventoryYear,
      totalEmissions: emissionCalcs.totalEmissions,
      emissionsBySource: emissionCalcs.emissionsBySource,
      emissionsByPollutant: emissionCalcs.emissionsByPollutant
    },
    sourceCategories: sourceIdentification.sourceCategories,
    complianceStatus: complianceAssessment.complianceStatus,
    qaqcResults: qaqcReview.qaqcResults,
    artifacts,
    duration,
    metadata: {
      processId: 'environmental-engineering/emission-inventory-development',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const sourceIdentificationTask = defineTask('source-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Emission Source Identification',
  agent: {
    name: 'air-quality-specialist',
    prompt: {
      role: 'Air Emissions Inventory Specialist',
      task: 'Identify and categorize all emission sources',
      context: args,
      instructions: [
        '1. Conduct facility walkthrough (virtual/records)',
        '2. Identify point sources (stacks, vents)',
        '3. Identify fugitive sources (leaks, material handling)',
        '4. Identify mobile sources (vehicles, equipment)',
        '5. Categorize sources by type (combustion, process, storage)',
        '6. Assign source identification numbers',
        '7. Document source characteristics',
        '8. Identify emission points and controls',
        '9. Create source inventory database',
        '10. Document source identification methodology'
      ],
      outputFormat: 'JSON with source list, categories, characteristics'
    },
    outputSchema: {
      type: 'object',
      required: ['sourceList', 'sourceCategories', 'artifacts'],
      properties: {
        sourceList: { type: 'array' },
        sourceCategories: { type: 'array' },
        pointSources: { type: 'array' },
        fugitiveSources: { type: 'array' },
        mobileSources: { type: 'array' },
        sourceCharacteristics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'emission-inventory', 'identification']
}));

export const emissionFactorSelectionTask = defineTask('emission-factor-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Emission Factor Selection',
  agent: {
    name: 'air-quality-specialist',
    prompt: {
      role: 'Emission Factor Specialist',
      task: 'Select appropriate emission factors for each source',
      context: args,
      instructions: [
        '1. Identify AP-42 emission factors',
        '2. Research source-specific emission factors',
        '3. Evaluate stack test data availability',
        '4. Assess CEMS data availability',
        '5. Apply emission factor hierarchy',
        '6. Document emission factor sources',
        '7. Assess emission factor quality ratings',
        '8. Identify data gaps',
        '9. Document assumptions',
        '10. Create emission factor database'
      ],
      outputFormat: 'JSON with emission factors, sources, quality ratings'
    },
    outputSchema: {
      type: 'object',
      required: ['emissionFactors', 'factorSources', 'qualityRatings', 'artifacts'],
      properties: {
        emissionFactors: { type: 'object' },
        factorSources: { type: 'object' },
        qualityRatings: { type: 'object' },
        dataGaps: { type: 'array', items: { type: 'string' } },
        assumptions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'emission-inventory', 'factors']
}));

export const activityDataTask = defineTask('activity-data', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Activity Data Compilation',
  agent: {
    name: 'air-quality-specialist',
    prompt: {
      role: 'Emission Inventory Data Analyst',
      task: 'Compile activity data for emission calculations',
      context: args,
      instructions: [
        '1. Collect fuel consumption data',
        '2. Collect material throughput data',
        '3. Collect operating hours',
        '4. Collect production data',
        '5. Collect control efficiency data',
        '6. Verify data completeness',
        '7. Identify data sources',
        '8. Document data collection methodology',
        '9. Perform data quality checks',
        '10. Create activity data database'
      ],
      outputFormat: 'JSON with activity data, data sources, data quality'
    },
    outputSchema: {
      type: 'object',
      required: ['activityData', 'dataSources', 'dataQuality', 'artifacts'],
      properties: {
        activityData: { type: 'object' },
        fuelData: { type: 'object' },
        productionData: { type: 'object' },
        operatingHours: { type: 'object' },
        dataSources: { type: 'object' },
        dataQuality: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'emission-inventory', 'activity-data']
}));

export const emissionCalculationsTask = defineTask('emission-calculations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Emission Calculations',
  agent: {
    name: 'air-quality-specialist',
    prompt: {
      role: 'Emission Calculation Engineer',
      task: 'Calculate emissions for all sources and pollutants',
      context: args,
      instructions: [
        '1. Calculate criteria pollutant emissions',
        '2. Calculate HAP emissions',
        '3. Calculate GHG emissions',
        '4. Apply control efficiencies',
        '5. Calculate potential to emit',
        '6. Calculate actual emissions',
        '7. Sum emissions by source category',
        '8. Sum emissions by pollutant',
        '9. Prepare emission summary tables',
        '10. Document calculation methodology'
      ],
      outputFormat: 'JSON with total emissions, by source, by pollutant'
    },
    outputSchema: {
      type: 'object',
      required: ['totalEmissions', 'emissionsBySource', 'emissionsByPollutant', 'emissionsByCategory', 'artifacts'],
      properties: {
        totalEmissions: { type: 'object' },
        emissionsBySource: { type: 'array' },
        emissionsByPollutant: { type: 'object' },
        emissionsByCategory: { type: 'object' },
        potentialToEmit: { type: 'object' },
        actualEmissions: { type: 'object' },
        calculationDetails: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'emission-inventory', 'calculations']
}));

export const inventoryQAQCTask = defineTask('inventory-qaqc', (args, taskCtx) => ({
  kind: 'agent',
  title: 'QA/QC Review',
  agent: {
    name: 'air-quality-specialist',
    prompt: {
      role: 'Quality Assurance Specialist',
      task: 'Perform QA/QC review of emission inventory',
      context: args,
      instructions: [
        '1. Verify calculation accuracy',
        '2. Check unit conversions',
        '3. Review emission factor appropriateness',
        '4. Compare to historical inventories',
        '5. Perform mass balance checks',
        '6. Review data completeness',
        '7. Check for outliers',
        '8. Verify control efficiencies',
        '9. Document QA/QC findings',
        '10. Prepare QA/QC report'
      ],
      outputFormat: 'JSON with QA/QC results, issues, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['qaqcResults', 'issues', 'recommendations', 'artifacts'],
      properties: {
        qaqcResults: { type: 'object' },
        accuracyChecks: { type: 'object' },
        completenessChecks: { type: 'object' },
        issues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'emission-inventory', 'qaqc']
}));

export const inventoryComplianceTask = defineTask('inventory-compliance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Regulatory Compliance Assessment',
  agent: {
    name: 'environmental-compliance-specialist',
    prompt: {
      role: 'Air Quality Compliance Specialist',
      task: 'Assess regulatory compliance based on inventory',
      context: args,
      instructions: [
        '1. Compare emissions to permit limits',
        '2. Assess major source status',
        '3. Evaluate Title V applicability',
        '4. Assess PSD/NSR applicability',
        '5. Evaluate HAP major source status',
        '6. Check emission fee implications',
        '7. Assess reporting requirements',
        '8. Identify compliance issues',
        '9. Recommend corrective actions',
        '10. Document compliance assessment'
      ],
      outputFormat: 'JSON with compliance status, applicability, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['complianceStatus', 'applicability', 'recommendations', 'artifacts'],
      properties: {
        complianceStatus: { type: 'object' },
        permitComparison: { type: 'object' },
        majorSourceStatus: { type: 'object' },
        applicability: { type: 'object' },
        complianceIssues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'emission-inventory', 'compliance']
}));

export const inventoryDocumentationTask = defineTask('inventory-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Inventory Documentation',
  agent: {
    name: 'air-quality-specialist',
    prompt: {
      role: 'Environmental Documentation Specialist',
      task: 'Compile emission inventory documentation',
      context: args,
      instructions: [
        '1. Prepare inventory summary report',
        '2. Compile calculation spreadsheets',
        '3. Document methodology',
        '4. Prepare regulatory submittal forms',
        '5. Create source-specific documentation',
        '6. Compile supporting data',
        '7. Prepare trend analysis',
        '8. Document QA/QC procedures',
        '9. Create inventory database',
        '10. Generate final documentation package'
      ],
      outputFormat: 'JSON with document list, report path, submittal forms'
    },
    outputSchema: {
      type: 'object',
      required: ['documentList', 'reportPath', 'submittalForms', 'artifacts'],
      properties: {
        documentList: { type: 'array' },
        reportPath: { type: 'string' },
        submittalForms: { type: 'array' },
        methodology: { type: 'object' },
        trendAnalysis: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'emission-inventory', 'documentation']
}));
