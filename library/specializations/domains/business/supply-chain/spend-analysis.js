/**
 * @process specializations/domains/business/supply-chain/spend-analysis
 * @description Spend Analysis and Savings Identification - Analyze procurement spend by category, supplier,
 * business unit to identify consolidation opportunities, maverick spend, and cost reduction initiatives.
 * @inputs { spendData?: object, categories?: array, timeframe?: string, objectives?: object }
 * @outputs { success: boolean, spendProfile: object, savingsOpportunities: array, recommendations: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/supply-chain/spend-analysis', {
 *   spendData: { source: 'erp', path: '/data/spend.csv' },
 *   categories: ['IT', 'Marketing', 'Facilities'],
 *   timeframe: '12-months',
 *   objectives: { savingsTarget: 10 }
 * });
 *
 * @references
 * - Coupa Spend Analysis: https://www.coupa.com/
 * - GEP Spend Management: https://www.gep.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    spendData = {},
    categories = [],
    timeframe = '12-months',
    objectives = {},
    includeIndirectSpend = true,
    outputDir = 'spend-analysis-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Spend Analysis and Savings Identification Process');

  // ============================================================================
  // PHASE 1: DATA EXTRACTION AND CLEANSING
  // ============================================================================

  ctx.log('info', 'Phase 1: Extracting and cleansing spend data');

  const dataExtraction = await ctx.task(spendDataExtractionTask, {
    spendData,
    timeframe,
    outputDir
  });

  artifacts.push(...dataExtraction.artifacts);

  // ============================================================================
  // PHASE 2: SPEND CLASSIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Classifying spend');

  const spendClassification = await ctx.task(spendClassificationTask, {
    dataExtraction,
    categories,
    outputDir
  });

  artifacts.push(...spendClassification.artifacts);

  // ============================================================================
  // PHASE 3: SUPPLIER ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing supplier spend');

  const supplierAnalysis = await ctx.task(supplierSpendAnalysisTask, {
    dataExtraction,
    spendClassification,
    outputDir
  });

  artifacts.push(...supplierAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: MAVERICK SPEND IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Identifying maverick spend');

  const maverickSpend = await ctx.task(maverickSpendTask, {
    dataExtraction,
    spendClassification,
    outputDir
  });

  artifacts.push(...maverickSpend.artifacts);

  // ============================================================================
  // PHASE 5: CONSOLIDATION OPPORTUNITIES
  // ============================================================================

  ctx.log('info', 'Phase 5: Identifying consolidation opportunities');

  const consolidationOpportunities = await ctx.task(consolidationOpportunitiesTask, {
    supplierAnalysis,
    spendClassification,
    outputDir
  });

  artifacts.push(...consolidationOpportunities.artifacts);

  // Breakpoint: Review spend analysis
  await ctx.breakpoint({
    question: `Spend analysis complete. Total spend: $${dataExtraction.totalSpend}. Maverick spend: ${maverickSpend.maverickPercentage}%. ${consolidationOpportunities.opportunities.length} consolidation opportunities identified. Review analysis?`,
    title: 'Spend Analysis Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'json' })),
      summary: {
        totalSpend: dataExtraction.totalSpend,
        maverickPercentage: maverickSpend.maverickPercentage,
        consolidationOpportunities: consolidationOpportunities.opportunities.length
      }
    }
  });

  // ============================================================================
  // PHASE 6: SAVINGS IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Identifying savings opportunities');

  const savingsIdentification = await ctx.task(savingsIdentificationTask, {
    spendClassification,
    supplierAnalysis,
    maverickSpend,
    consolidationOpportunities,
    objectives,
    outputDir
  });

  artifacts.push(...savingsIdentification.artifacts);

  // ============================================================================
  // PHASE 7: INITIATIVE PRIORITIZATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Prioritizing savings initiatives');

  const initiativePrioritization = await ctx.task(initiativePrioritizationTask, {
    savingsIdentification,
    objectives,
    outputDir
  });

  artifacts.push(...initiativePrioritization.artifacts);

  // ============================================================================
  // PHASE 8: REPORTING
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating spend analysis report');

  const reporting = await ctx.task(spendReportingTask, {
    dataExtraction,
    spendClassification,
    supplierAnalysis,
    maverickSpend,
    savingsIdentification,
    initiativePrioritization,
    outputDir
  });

  artifacts.push(...reporting.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    spendProfile: {
      totalSpend: dataExtraction.totalSpend,
      spendByCategory: spendClassification.spendByCategory,
      spendBySupplier: supplierAnalysis.topSuppliers,
      supplierCount: supplierAnalysis.supplierCount
    },
    maverickSpend: {
      amount: maverickSpend.totalMaverick,
      percentage: maverickSpend.maverickPercentage,
      byCategory: maverickSpend.byCategory
    },
    savingsOpportunities: savingsIdentification.opportunities,
    totalSavingsPotential: savingsIdentification.totalPotential,
    prioritizedInitiatives: initiativePrioritization.initiatives,
    recommendations: initiativePrioritization.recommendations,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/business/supply-chain/spend-analysis',
      timestamp: startTime,
      timeframe,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const spendDataExtractionTask = defineTask('spend-data-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Spend Data Extraction',
  agent: {
    name: 'data-extractor',
    prompt: {
      role: 'Spend Data Analyst',
      task: 'Extract and cleanse spend data',
      context: args,
      instructions: [
        '1. Extract spend data from source systems',
        '2. Cleanse data (remove duplicates, fix errors)',
        '3. Normalize supplier names',
        '4. Standardize categories',
        '5. Validate data completeness',
        '6. Calculate total spend',
        '7. Create data quality report',
        '8. Document extraction process'
      ],
      outputFormat: 'JSON with extracted spend data'
    },
    outputSchema: {
      type: 'object',
      required: ['totalSpend', 'recordCount', 'artifacts'],
      properties: {
        totalSpend: { type: 'number' },
        recordCount: { type: 'number' },
        dataQuality: { type: 'object' },
        cleansedRecords: { type: 'number' },
        duplicatesRemoved: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'spend-analysis', 'extraction']
}));

export const spendClassificationTask = defineTask('spend-classification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Spend Classification',
  agent: {
    name: 'spend-classifier',
    prompt: {
      role: 'Spend Classification Specialist',
      task: 'Classify spend into categories',
      context: args,
      instructions: [
        '1. Apply category taxonomy',
        '2. Classify spend by category',
        '3. Classify spend by business unit',
        '4. Identify unclassified spend',
        '5. Calculate spend by category',
        '6. Identify category trends',
        '7. Create Pareto analysis',
        '8. Document classification results'
      ],
      outputFormat: 'JSON with classified spend'
    },
    outputSchema: {
      type: 'object',
      required: ['spendByCategory', 'classificationRate', 'artifacts'],
      properties: {
        spendByCategory: { type: 'object' },
        spendByBusinessUnit: { type: 'object' },
        classificationRate: { type: 'number' },
        unclassifiedSpend: { type: 'number' },
        paretoAnalysis: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'spend-analysis', 'classification']
}));

export const supplierSpendAnalysisTask = defineTask('supplier-spend-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Supplier Spend Analysis',
  agent: {
    name: 'supplier-analyst',
    prompt: {
      role: 'Supplier Spend Analyst',
      task: 'Analyze spend by supplier',
      context: args,
      instructions: [
        '1. Calculate spend by supplier',
        '2. Identify top suppliers (80/20)',
        '3. Analyze supplier concentration',
        '4. Identify supplier fragmentation',
        '5. Compare pricing across suppliers',
        '6. Analyze payment terms',
        '7. Calculate supplier count by category',
        '8. Document supplier analysis'
      ],
      outputFormat: 'JSON with supplier spend analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['topSuppliers', 'supplierCount', 'artifacts'],
      properties: {
        topSuppliers: { type: 'array' },
        supplierCount: { type: 'number' },
        concentration: { type: 'object' },
        fragmentation: { type: 'object' },
        pricingVariance: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'spend-analysis', 'supplier']
}));

export const maverickSpendTask = defineTask('maverick-spend', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Maverick Spend Identification',
  agent: {
    name: 'maverick-analyst',
    prompt: {
      role: 'Maverick Spend Analyst',
      task: 'Identify off-contract and non-compliant spend',
      context: args,
      instructions: [
        '1. Define maverick spend criteria',
        '2. Identify off-contract purchases',
        '3. Identify non-preferred supplier spend',
        '4. Calculate maverick spend percentage',
        '5. Analyze maverick spend by category',
        '6. Identify root causes',
        '7. Calculate compliance potential savings',
        '8. Document maverick spend analysis'
      ],
      outputFormat: 'JSON with maverick spend analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['totalMaverick', 'maverickPercentage', 'byCategory', 'artifacts'],
      properties: {
        totalMaverick: { type: 'number' },
        maverickPercentage: { type: 'number' },
        byCategory: { type: 'object' },
        rootCauses: { type: 'array' },
        complianceSavings: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'spend-analysis', 'maverick']
}));

export const consolidationOpportunitiesTask = defineTask('consolidation-opportunities', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Consolidation Opportunities',
  agent: {
    name: 'consolidation-analyst',
    prompt: {
      role: 'Spend Consolidation Analyst',
      task: 'Identify supplier and category consolidation opportunities',
      context: args,
      instructions: [
        '1. Identify supplier consolidation opportunities',
        '2. Identify category consolidation opportunities',
        '3. Calculate consolidation savings potential',
        '4. Assess consolidation feasibility',
        '5. Evaluate risk of consolidation',
        '6. Prioritize consolidation opportunities',
        '7. Estimate implementation effort',
        '8. Document consolidation analysis'
      ],
      outputFormat: 'JSON with consolidation opportunities'
    },
    outputSchema: {
      type: 'object',
      required: ['opportunities', 'totalPotential', 'artifacts'],
      properties: {
        opportunities: { type: 'array' },
        totalPotential: { type: 'number' },
        supplierConsolidation: { type: 'array' },
        categoryConsolidation: { type: 'array' },
        feasibilityAssessment: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'spend-analysis', 'consolidation']
}));

export const savingsIdentificationTask = defineTask('savings-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Savings Identification',
  agent: {
    name: 'savings-analyst',
    prompt: {
      role: 'Savings Identification Specialist',
      task: 'Identify all savings opportunities',
      context: args,
      instructions: [
        '1. Consolidate all savings opportunities',
        '2. Categorize savings by lever',
        '3. Estimate savings potential',
        '4. Assess implementation complexity',
        '5. Calculate quick wins',
        '6. Identify demand management savings',
        '7. Identify process improvement savings',
        '8. Document savings opportunities'
      ],
      outputFormat: 'JSON with savings opportunities'
    },
    outputSchema: {
      type: 'object',
      required: ['opportunities', 'totalPotential', 'artifacts'],
      properties: {
        opportunities: { type: 'array' },
        totalPotential: { type: 'number' },
        byLever: { type: 'object' },
        quickWins: { type: 'array' },
        demandManagement: { type: 'array' },
        processImprovement: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'spend-analysis', 'savings']
}));

export const initiativePrioritizationTask = defineTask('initiative-prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Initiative Prioritization',
  agent: {
    name: 'prioritization-analyst',
    prompt: {
      role: 'Initiative Prioritization Specialist',
      task: 'Prioritize savings initiatives',
      context: args,
      instructions: [
        '1. Score initiatives by value',
        '2. Score initiatives by effort',
        '3. Calculate value/effort ratio',
        '4. Create prioritization matrix',
        '5. Identify wave 1 initiatives',
        '6. Create implementation roadmap',
        '7. Define success metrics',
        '8. Document recommendations'
      ],
      outputFormat: 'JSON with prioritized initiatives'
    },
    outputSchema: {
      type: 'object',
      required: ['initiatives', 'recommendations', 'artifacts'],
      properties: {
        initiatives: { type: 'array' },
        recommendations: { type: 'array' },
        prioritizationMatrix: { type: 'object' },
        wave1Initiatives: { type: 'array' },
        implementationRoadmap: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'spend-analysis', 'prioritization']
}));

export const spendReportingTask = defineTask('spend-reporting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 8: Spend Analysis Reporting',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'Spend Analysis Report Generator',
      task: 'Generate comprehensive spend analysis report',
      context: args,
      instructions: [
        '1. Create executive summary',
        '2. Generate spend profile charts',
        '3. Create savings opportunity summary',
        '4. Generate category deep-dives',
        '5. Create supplier analysis views',
        '6. Generate recommendations section',
        '7. Create implementation roadmap',
        '8. Compile final report'
      ],
      outputFormat: 'JSON with report details'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'object' },
        visualizations: { type: 'array' },
        categoryDeepDives: { type: 'array' },
        recommendationsSummary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'supply-chain', 'spend-analysis', 'reporting']
}));
