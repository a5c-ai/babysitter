/**
 * @process environmental-engineering/life-cycle-assessment
 * @description Life Cycle Assessment Methodology - Application of ISO 14040/14044 LCA methodology to evaluate
 * environmental impacts of products, processes, and systems.
 * @inputs { studyName: string, productSystem: object, functionalUnit: string, systemBoundaries: object }
 * @outputs { success: boolean, lcaResults: object, impactAssessment: object, interpretations: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('environmental-engineering/life-cycle-assessment', {
 *   studyName: 'Packaging Material Comparison LCA',
 *   productSystem: { product: 'beverage-container', alternatives: ['glass', 'aluminum', 'PET'] },
 *   functionalUnit: '1000 liters of beverage delivered',
 *   systemBoundaries: { scope: 'cradle-to-grave' }
 * });
 *
 * @references
 * - ISO 14040:2006 - LCA Principles and Framework
 * - ISO 14044:2006 - LCA Requirements and Guidelines
 * - EPA LCA Resources
 * - openLCA Documentation
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    studyName,
    productSystem = {},
    functionalUnit,
    systemBoundaries = {},
    impactCategories = [],
    databases = ['ecoinvent'],
    outputDir = 'lca-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Life Cycle Assessment: ${studyName}`);
  ctx.log('info', `Functional Unit: ${functionalUnit}`);

  // ============================================================================
  // PHASE 1: GOAL AND SCOPE DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Goal and Scope Definition');

  const goalScope = await ctx.task(goalScopeTask, {
    studyName,
    productSystem,
    functionalUnit,
    systemBoundaries,
    impactCategories,
    outputDir
  });

  artifacts.push(...goalScope.artifacts);

  // ============================================================================
  // PHASE 2: LIFE CYCLE INVENTORY
  // ============================================================================

  ctx.log('info', 'Phase 2: Life Cycle Inventory Analysis');

  const inventoryAnalysis = await ctx.task(inventoryAnalysisTask, {
    studyName,
    goalScope,
    productSystem,
    databases,
    outputDir
  });

  artifacts.push(...inventoryAnalysis.artifacts);

  // Breakpoint: Inventory Review
  await ctx.breakpoint({
    question: `LCI analysis complete for ${studyName}. Data quality score: ${inventoryAnalysis.dataQualityScore}. Review inventory data?`,
    title: 'Life Cycle Inventory Review',
    context: {
      runId: ctx.runId,
      dataQuality: inventoryAnalysis.dataQualityScore,
      dataGaps: inventoryAnalysis.dataGaps,
      files: inventoryAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 3: IMPACT ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Life Cycle Impact Assessment');

  const impactAssessment = await ctx.task(impactAssessmentLCATask, {
    studyName,
    inventoryAnalysis,
    impactCategories,
    outputDir
  });

  artifacts.push(...impactAssessment.artifacts);

  // ============================================================================
  // PHASE 4: INTERPRETATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Interpretation');

  const interpretation = await ctx.task(interpretationTask, {
    studyName,
    goalScope,
    inventoryAnalysis,
    impactAssessment,
    outputDir
  });

  artifacts.push(...interpretation.artifacts);

  // ============================================================================
  // PHASE 5: SENSITIVITY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Sensitivity and Uncertainty Analysis');

  const sensitivityAnalysis = await ctx.task(lcaSensitivityTask, {
    studyName,
    inventoryAnalysis,
    impactAssessment,
    outputDir
  });

  artifacts.push(...sensitivityAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: CRITICAL REVIEW
  // ============================================================================

  ctx.log('info', 'Phase 6: Critical Review Preparation');

  const criticalReview = await ctx.task(criticalReviewTask, {
    studyName,
    goalScope,
    inventoryAnalysis,
    impactAssessment,
    interpretation,
    sensitivityAnalysis,
    outputDir
  });

  artifacts.push(...criticalReview.artifacts);

  // ============================================================================
  // PHASE 7: LCA REPORT
  // ============================================================================

  ctx.log('info', 'Phase 7: LCA Report Generation');

  const lcaReport = await ctx.task(lcaReportTask, {
    studyName,
    goalScope,
    inventoryAnalysis,
    impactAssessment,
    interpretation,
    sensitivityAnalysis,
    criticalReview,
    outputDir
  });

  artifacts.push(...lcaReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    studyName,
    lcaResults: {
      functionalUnit,
      systemBoundaries: goalScope.systemBoundaries,
      inventorySummary: inventoryAnalysis.summary,
      dataQuality: inventoryAnalysis.dataQualityScore
    },
    impactAssessment: {
      methodUsed: impactAssessment.method,
      categories: impactAssessment.categories,
      results: impactAssessment.results
    },
    interpretations: {
      keyFindings: interpretation.keyFindings,
      hotspots: interpretation.hotspots,
      recommendations: interpretation.recommendations
    },
    sensitivityResults: sensitivityAnalysis.results,
    artifacts,
    duration,
    metadata: {
      processId: 'environmental-engineering/life-cycle-assessment',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const goalScopeTask = defineTask('goal-scope', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Goal and Scope Definition',
  agent: {
    name: 'sustainability-specialist',
    prompt: {
      role: 'LCA Practitioner',
      task: 'Define LCA goal and scope per ISO 14040',
      context: args,
      instructions: [
        '1. Define study goal and intended application',
        '2. Define functional unit',
        '3. Define system boundaries',
        '4. Identify product system',
        '5. Define allocation procedures',
        '6. Select impact categories',
        '7. Define data quality requirements',
        '8. Define assumptions and limitations',
        '9. Identify critical review requirements',
        '10. Document goal and scope'
      ],
      outputFormat: 'JSON with goal, scope, system boundaries, data requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['goal', 'scope', 'systemBoundaries', 'dataRequirements', 'artifacts'],
      properties: {
        goal: { type: 'object' },
        intendedApplication: { type: 'string' },
        scope: { type: 'object' },
        functionalUnit: { type: 'string' },
        systemBoundaries: { type: 'object' },
        allocationProcedures: { type: 'object' },
        impactCategories: { type: 'array' },
        dataRequirements: { type: 'object' },
        assumptions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'lca', 'goal-scope']
}));

export const inventoryAnalysisTask = defineTask('inventory-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Life Cycle Inventory Analysis',
  agent: {
    name: 'sustainability-specialist',
    prompt: {
      role: 'LCI Data Analyst',
      task: 'Conduct life cycle inventory analysis',
      context: args,
      instructions: [
        '1. Collect primary data',
        '2. Collect secondary data from databases',
        '3. Model unit processes',
        '4. Calculate material and energy flows',
        '5. Apply allocation procedures',
        '6. Validate inventory data',
        '7. Assess data quality',
        '8. Identify data gaps',
        '9. Calculate inventory results',
        '10. Document LCI methodology'
      ],
      outputFormat: 'JSON with summary, flows, data quality score'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'materialFlows', 'energyFlows', 'dataQualityScore', 'artifacts'],
      properties: {
        summary: { type: 'object' },
        unitProcesses: { type: 'array' },
        materialFlows: { type: 'object' },
        energyFlows: { type: 'object' },
        emissions: { type: 'object' },
        dataQualityScore: { type: 'number' },
        dataGaps: { type: 'array' },
        dataSources: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'lca', 'inventory']
}));

export const impactAssessmentLCATask = defineTask('impact-assessment-lca', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Life Cycle Impact Assessment',
  agent: {
    name: 'sustainability-specialist',
    prompt: {
      role: 'LCIA Specialist',
      task: 'Conduct life cycle impact assessment',
      context: args,
      instructions: [
        '1. Select LCIA methodology (TRACI, ReCiPe, etc.)',
        '2. Classify inventory results',
        '3. Characterize impacts',
        '4. Calculate category indicator results',
        '5. Normalize results (optional)',
        '6. Weight results (optional)',
        '7. Calculate single scores if applicable',
        '8. Identify significant impact categories',
        '9. Document LCIA methodology',
        '10. Present impact results'
      ],
      outputFormat: 'JSON with method, categories, results'
    },
    outputSchema: {
      type: 'object',
      required: ['method', 'categories', 'results', 'artifacts'],
      properties: {
        method: { type: 'string' },
        methodDescription: { type: 'object' },
        categories: { type: 'array' },
        classificationResults: { type: 'object' },
        characterizationResults: { type: 'object' },
        results: { type: 'object' },
        normalizedResults: { type: 'object' },
        significantCategories: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'lca', 'impact-assessment']
}));

export const interpretationTask = defineTask('interpretation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Interpretation',
  agent: {
    name: 'sustainability-specialist',
    prompt: {
      role: 'LCA Interpretation Specialist',
      task: 'Interpret LCA results',
      context: args,
      instructions: [
        '1. Identify significant issues',
        '2. Identify environmental hotspots',
        '3. Conduct contribution analysis',
        '4. Evaluate completeness',
        '5. Evaluate consistency',
        '6. Evaluate sensitivity',
        '7. Draw conclusions',
        '8. Identify limitations',
        '9. Develop recommendations',
        '10. Document interpretation'
      ],
      outputFormat: 'JSON with key findings, hotspots, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['keyFindings', 'hotspots', 'recommendations', 'artifacts'],
      properties: {
        significantIssues: { type: 'array' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        hotspots: { type: 'array' },
        contributionAnalysis: { type: 'object' },
        completenessCheck: { type: 'object' },
        consistencyCheck: { type: 'object' },
        conclusions: { type: 'array' },
        limitations: { type: 'array' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'lca', 'interpretation']
}));

export const lcaSensitivityTask = defineTask('lca-sensitivity', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Sensitivity and Uncertainty Analysis',
  agent: {
    name: 'sustainability-specialist',
    prompt: {
      role: 'LCA Uncertainty Analyst',
      task: 'Conduct sensitivity and uncertainty analysis',
      context: args,
      instructions: [
        '1. Identify key parameters for sensitivity',
        '2. Conduct scenario analysis',
        '3. Conduct perturbation analysis',
        '4. Characterize parameter uncertainty',
        '5. Conduct Monte Carlo simulation',
        '6. Calculate confidence intervals',
        '7. Identify critical parameters',
        '8. Assess robustness of conclusions',
        '9. Document uncertainty sources',
        '10. Present sensitivity results'
      ],
      outputFormat: 'JSON with results, key parameters, robustness assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'keyParameters', 'robustnessAssessment', 'artifacts'],
      properties: {
        results: { type: 'object' },
        scenarioAnalysis: { type: 'object' },
        perturbationAnalysis: { type: 'object' },
        monteCarloResults: { type: 'object' },
        confidenceIntervals: { type: 'object' },
        keyParameters: { type: 'array' },
        robustnessAssessment: { type: 'object' },
        uncertaintySources: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'lca', 'sensitivity']
}));

export const criticalReviewTask = defineTask('critical-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Critical Review Preparation',
  agent: {
    name: 'sustainability-specialist',
    prompt: {
      role: 'LCA Critical Review Coordinator',
      task: 'Prepare for critical review per ISO 14044',
      context: args,
      instructions: [
        '1. Assess ISO 14040/14044 compliance',
        '2. Verify methodology consistency',
        '3. Check data quality documentation',
        '4. Verify interpretation conclusions',
        '5. Assess transparency',
        '6. Prepare critical review documentation',
        '7. Identify review panel requirements',
        '8. Prepare response to comments template',
        '9. Document compliance checklist',
        '10. Prepare critical review package'
      ],
      outputFormat: 'JSON with compliance assessment, documentation, review requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['complianceAssessment', 'documentation', 'reviewRequirements', 'artifacts'],
      properties: {
        complianceAssessment: { type: 'object' },
        isoCompliance: { type: 'object' },
        methodologyReview: { type: 'object' },
        dataQualityReview: { type: 'object' },
        documentation: { type: 'array' },
        reviewRequirements: { type: 'object' },
        complianceChecklist: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'lca', 'critical-review']
}));

export const lcaReportTask = defineTask('lca-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'LCA Report Generation',
  agent: {
    name: 'sustainability-specialist',
    prompt: {
      role: 'LCA Report Writer',
      task: 'Generate comprehensive LCA report',
      context: args,
      instructions: [
        '1. Prepare executive summary',
        '2. Document goal and scope',
        '3. Present LCI methodology and results',
        '4. Present LCIA methodology and results',
        '5. Present interpretation',
        '6. Document sensitivity analysis',
        '7. Include critical review statement',
        '8. Prepare data annexes',
        '9. Include visualization of results',
        '10. Finalize LCA report'
      ],
      outputFormat: 'JSON with report path, executive summary, key visualizations'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'keyVisualizations', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyVisualizations: { type: 'array' },
        dataAnnexes: { type: 'array' },
        criticalReviewStatement: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'environmental-engineering', 'lca', 'reporting']
}));
