/**
 * @process specializations/domains/business/decision-intelligence/multi-criteria-decision-analysis
 * @description Multi-Criteria Decision Analysis (MCDA) - Implementation of quantitative decision frameworks
 * including AHP, TOPSIS, and weighted scoring models for complex multi-stakeholder decisions.
 * @inputs { projectName: string, alternatives: array, criteria: array, stakeholders: array, methodology?: string }
 * @outputs { success: boolean, mcdaModel: object, rankings: array, sensitivityAnalysis: object, recommendation: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/decision-intelligence/multi-criteria-decision-analysis', {
 *   projectName: 'Technology Vendor Selection',
 *   alternatives: ['Vendor A', 'Vendor B', 'Vendor C'],
 *   criteria: ['Cost', 'Features', 'Support', 'Security'],
 *   stakeholders: ['IT', 'Finance', 'Operations'],
 *   methodology: 'AHP'
 * });
 *
 * @references
 * - INFORMS Decision Analysis Society: https://www.informs.org/Community/DAS
 * - AHP by Thomas Saaty
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    alternatives = [],
    criteria = [],
    stakeholders = [],
    methodology = 'AHP',
    outputDir = 'mcda-output'
  } = inputs;

  // Phase 1: MCDA Framework Setup
  const frameworkSetup = await ctx.task(frameworkSetupTask, {
    projectName,
    alternatives,
    criteria,
    stakeholders,
    methodology
  });

  // Phase 2: Criteria Weighting
  const criteriaWeighting = await ctx.task(criteriaWeightingTask, {
    projectName,
    criteria,
    stakeholders,
    methodology,
    frameworkSetup
  });

  // Phase 3: Performance Assessment
  const performanceAssessment = await ctx.task(performanceAssessmentTask, {
    projectName,
    alternatives,
    criteria,
    frameworkSetup
  });

  // Phase 4: MCDA Calculation
  const mcdaCalculation = await ctx.task(mcdaCalculationTask, {
    projectName,
    criteriaWeighting,
    performanceAssessment,
    methodology
  });

  // Breakpoint: Review MCDA results
  await ctx.breakpoint({
    question: `Review MCDA results for ${projectName}. Are the rankings consistent with stakeholder expectations?`,
    title: 'MCDA Results Review',
    context: {
      runId: ctx.runId,
      projectName,
      topAlternative: mcdaCalculation.rankings?.[0] || 'N/A'
    }
  });

  // Phase 5: Sensitivity Analysis
  const sensitivityAnalysis = await ctx.task(sensitivityAnalysisTask, {
    projectName,
    mcdaCalculation,
    criteriaWeighting
  });

  // Phase 6: Consistency Validation
  const consistencyValidation = await ctx.task(consistencyValidationTask, {
    projectName,
    criteriaWeighting,
    mcdaCalculation,
    methodology
  });

  // Phase 7: Stakeholder Aggregation
  const stakeholderAggregation = await ctx.task(stakeholderAggregationTask, {
    projectName,
    mcdaCalculation,
    stakeholders,
    criteriaWeighting
  });

  // Phase 8: Final Recommendation
  const recommendation = await ctx.task(mcdaRecommendationTask, {
    projectName,
    mcdaCalculation,
    sensitivityAnalysis,
    consistencyValidation,
    stakeholderAggregation
  });

  return {
    success: true,
    projectName,
    mcdaModel: {
      framework: frameworkSetup,
      weights: criteriaWeighting,
      performance: performanceAssessment
    },
    calculation: mcdaCalculation,
    rankings: mcdaCalculation.rankings,
    sensitivityAnalysis,
    consistencyValidation,
    stakeholderAggregation,
    recommendation,
    metadata: {
      processId: 'specializations/domains/business/decision-intelligence/multi-criteria-decision-analysis',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const frameworkSetupTask = defineTask('framework-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `MCDA Framework Setup - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'MCDA Methodology Expert',
      task: 'Set up MCDA framework and methodology',
      context: args,
      instructions: [
        '1. Select appropriate MCDA methodology',
        '2. Define decision hierarchy',
        '3. Structure criteria tree',
        '4. Define measurement scales',
        '5. Establish normalization approach',
        '6. Design stakeholder involvement process',
        '7. Define aggregation method',
        '8. Document methodology rationale'
      ],
      outputFormat: 'JSON object with framework setup'
    },
    outputSchema: {
      type: 'object',
      required: ['methodology', 'hierarchy', 'scales'],
      properties: {
        methodology: { type: 'string' },
        hierarchy: { type: 'object' },
        criteriaTree: { type: 'object' },
        scales: { type: 'object' },
        normalization: { type: 'string' },
        aggregation: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'mcda', 'framework']
}));

export const criteriaWeightingTask = defineTask('criteria-weighting', (args, taskCtx) => ({
  kind: 'agent',
  title: `Criteria Weighting - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Criteria Weighting Specialist',
      task: 'Determine criteria weights using selected methodology',
      context: args,
      instructions: [
        '1. Design pairwise comparison matrices (AHP)',
        '2. Conduct stakeholder weighting sessions',
        '3. Calculate local and global weights',
        '4. Check consistency ratios',
        '5. Aggregate stakeholder weights',
        '6. Handle weight conflicts',
        '7. Validate weight reasonableness',
        '8. Document weighting rationale'
      ],
      outputFormat: 'JSON object with criteria weights'
    },
    outputSchema: {
      type: 'object',
      required: ['weights', 'consistency', 'aggregated'],
      properties: {
        pairwiseMatrices: { type: 'object' },
        localWeights: { type: 'object' },
        globalWeights: { type: 'object' },
        weights: { type: 'object' },
        consistency: { type: 'object' },
        aggregated: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'mcda', 'weighting']
}));

export const performanceAssessmentTask = defineTask('performance-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Performance Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Alternative Performance Assessor',
      task: 'Assess alternative performance against criteria',
      context: args,
      instructions: [
        '1. Define performance scales per criterion',
        '2. Collect alternative performance data',
        '3. Rate alternatives on each criterion',
        '4. Handle qualitative assessments',
        '5. Normalize performance scores',
        '6. Validate assessment accuracy',
        '7. Document data sources',
        '8. Create performance matrix'
      ],
      outputFormat: 'JSON object with performance assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['performanceMatrix', 'normalized', 'sources'],
      properties: {
        performanceMatrix: { type: 'object' },
        rawScores: { type: 'object' },
        normalized: { type: 'object' },
        scales: { type: 'object' },
        sources: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'mcda', 'assessment']
}));

export const mcdaCalculationTask = defineTask('mcda-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: `MCDA Calculation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'MCDA Calculation Specialist',
      task: 'Execute MCDA calculation and generate rankings',
      context: args,
      instructions: [
        '1. Apply weighted sum method',
        '2. Calculate TOPSIS if applicable',
        '3. Calculate PROMETHEE if applicable',
        '4. Generate overall scores',
        '5. Rank alternatives',
        '6. Calculate score differences',
        '7. Identify close rankings',
        '8. Generate results summary'
      ],
      outputFormat: 'JSON object with MCDA calculation'
    },
    outputSchema: {
      type: 'object',
      required: ['scores', 'rankings', 'methodology'],
      properties: {
        scores: { type: 'object' },
        weightedScores: { type: 'object' },
        rankings: { type: 'array' },
        scoreDifferences: { type: 'object' },
        methodology: { type: 'string' },
        summary: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'mcda', 'calculation']
}));

export const sensitivityAnalysisTask = defineTask('sensitivity-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Sensitivity Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Sensitivity Analysis Expert',
      task: 'Conduct sensitivity analysis on MCDA results',
      context: args,
      instructions: [
        '1. Vary criteria weights systematically',
        '2. Identify ranking stability ranges',
        '3. Find critical weight thresholds',
        '4. Test performance score variations',
        '5. Identify robust rankings',
        '6. Identify sensitive rankings',
        '7. Create tornado diagrams',
        '8. Document sensitivity insights'
      ],
      outputFormat: 'JSON object with sensitivity analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['weightSensitivity', 'thresholds', 'robustness'],
      properties: {
        weightSensitivity: { type: 'object' },
        thresholds: { type: 'object' },
        robustness: { type: 'object' },
        tornadoData: { type: 'array' },
        insights: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'mcda', 'sensitivity']
}));

export const consistencyValidationTask = defineTask('consistency-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Consistency Validation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'MCDA Consistency Validator',
      task: 'Validate consistency and quality of MCDA inputs',
      context: args,
      instructions: [
        '1. Calculate consistency ratios (AHP)',
        '2. Check logical consistency of preferences',
        '3. Validate transitivity of judgments',
        '4. Identify inconsistent comparisons',
        '5. Recommend consistency improvements',
        '6. Validate against expert benchmarks',
        '7. Check for bias patterns',
        '8. Document validation results'
      ],
      outputFormat: 'JSON object with consistency validation'
    },
    outputSchema: {
      type: 'object',
      required: ['consistencyRatios', 'issues', 'recommendations'],
      properties: {
        consistencyRatios: { type: 'object' },
        transitivity: { type: 'object' },
        issues: { type: 'array' },
        biasPatterns: { type: 'array' },
        recommendations: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'mcda', 'validation']
}));

export const stakeholderAggregationTask = defineTask('stakeholder-aggregation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Stakeholder Aggregation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Stakeholder Aggregation Specialist',
      task: 'Aggregate multi-stakeholder MCDA inputs',
      context: args,
      instructions: [
        '1. Define stakeholder influence weights',
        '2. Aggregate individual rankings',
        '3. Identify consensus areas',
        '4. Identify disagreement areas',
        '5. Apply group aggregation method',
        '6. Test aggregation sensitivity',
        '7. Facilitate conflict resolution',
        '8. Document group decision'
      ],
      outputFormat: 'JSON object with stakeholder aggregation'
    },
    outputSchema: {
      type: 'object',
      required: ['aggregatedRankings', 'consensus', 'disagreements'],
      properties: {
        stakeholderWeights: { type: 'object' },
        individualRankings: { type: 'object' },
        aggregatedRankings: { type: 'array' },
        consensus: { type: 'object' },
        disagreements: { type: 'array' },
        resolution: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'mcda', 'aggregation']
}));

export const mcdaRecommendationTask = defineTask('mcda-recommendation', (args, taskCtx) => ({
  kind: 'agent',
  title: `MCDA Recommendation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'MCDA Recommendation Specialist',
      task: 'Develop final recommendation from MCDA analysis',
      context: args,
      instructions: [
        '1. Synthesize MCDA results',
        '2. Consider sensitivity findings',
        '3. Account for consistency issues',
        '4. Integrate stakeholder views',
        '5. Formulate recommendation',
        '6. Document confidence level',
        '7. Identify key assumptions',
        '8. Create implementation guidance'
      ],
      outputFormat: 'JSON object with recommendation'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendation', 'rationale', 'confidence'],
      properties: {
        recommendation: { type: 'string' },
        alternativeRankings: { type: 'array' },
        rationale: { type: 'string' },
        confidence: { type: 'string' },
        assumptions: { type: 'array' },
        implementation: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'mcda', 'recommendation']
}));
