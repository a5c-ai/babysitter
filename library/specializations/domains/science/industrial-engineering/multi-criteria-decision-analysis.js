/**
 * @process domains/science/industrial-engineering/multi-criteria-decision-analysis
 * @description Multi-Criteria Decision Analysis - Apply structured decision analysis methods to evaluate alternatives
 * against multiple conflicting criteria using techniques such as AHP, TOPSIS, or weighted scoring.
 * @inputs { decisionProblem: string, alternatives?: array, criteria?: array, method?: string }
 * @outputs { success: boolean, ranking: array, sensitivityAnalysis: object, recommendation: string, artifacts: array }
 *
 * @example
 * const result = await orchestrate('domains/science/industrial-engineering/multi-criteria-decision-analysis', {
 *   decisionProblem: 'Select manufacturing equipment supplier',
 *   alternatives: ['Supplier A', 'Supplier B', 'Supplier C'],
 *   criteria: ['cost', 'quality', 'delivery', 'service'],
 *   method: 'AHP'
 * });
 *
 * @references
 * - Saaty, The Analytic Hierarchy Process
 * - Hwang & Yoon, Multiple Attribute Decision Making
 * - Keeney & Raiffa, Decisions with Multiple Objectives
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    decisionProblem,
    alternatives = [],
    criteria = [],
    method = 'AHP',
    stakeholders = [],
    outputDir = 'mcda-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Multi-Criteria Decision Analysis process');

  // Task 1: Problem Structuring
  ctx.log('info', 'Phase 1: Structuring decision problem');
  const problemStructure = await ctx.task(problemStructuringTask, {
    decisionProblem,
    alternatives,
    criteria,
    stakeholders,
    outputDir
  });

  artifacts.push(...problemStructure.artifacts);

  // Task 2: Criteria Hierarchy Development
  ctx.log('info', 'Phase 2: Developing criteria hierarchy');
  const criteriaHierarchy = await ctx.task(criteriaHierarchyTask, {
    problemStructure,
    outputDir
  });

  artifacts.push(...criteriaHierarchy.artifacts);

  // Task 3: Weight Elicitation
  ctx.log('info', 'Phase 3: Eliciting criteria weights');
  const weightElicitation = await ctx.task(weightElicitationTask, {
    criteriaHierarchy,
    method,
    outputDir
  });

  artifacts.push(...weightElicitation.artifacts);

  // Breakpoint: Review weights
  await ctx.breakpoint({
    question: `Criteria weights elicited. Consistency ratio: ${weightElicitation.consistencyRatio?.toFixed(3) || 'N/A'}. Top criterion: ${weightElicitation.topCriterion}. Review weights before scoring?`,
    title: 'Criteria Weights Review',
    context: {
      runId: ctx.runId,
      weights: weightElicitation.weights,
      consistencyRatio: weightElicitation.consistencyRatio,
      files: weightElicitation.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // Task 4: Alternative Scoring
  ctx.log('info', 'Phase 4: Scoring alternatives against criteria');
  const alternativeScoring = await ctx.task(alternativeScoringTask, {
    problemStructure,
    criteriaHierarchy,
    weightElicitation,
    method,
    outputDir
  });

  artifacts.push(...alternativeScoring.artifacts);

  // Task 5: Aggregation and Ranking
  ctx.log('info', 'Phase 5: Aggregating scores and ranking alternatives');
  const aggregationRanking = await ctx.task(aggregationRankingTask, {
    alternativeScoring,
    weightElicitation,
    method,
    outputDir
  });

  artifacts.push(...aggregationRanking.artifacts);

  // Task 6: Sensitivity Analysis
  ctx.log('info', 'Phase 6: Performing sensitivity analysis');
  const sensitivityAnalysis = await ctx.task(sensitivityAnalysisTask, {
    aggregationRanking,
    weightElicitation,
    outputDir
  });

  artifacts.push(...sensitivityAnalysis.artifacts);

  // Task 7: Recommendation Report
  ctx.log('info', 'Phase 7: Generating recommendation report');
  const recommendationReport = await ctx.task(recommendationReportTask, {
    problemStructure,
    weightElicitation,
    aggregationRanking,
    sensitivityAnalysis,
    outputDir
  });

  artifacts.push(...recommendationReport.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Decision analysis complete. Top alternative: ${aggregationRanking.topAlternative} (score: ${aggregationRanking.topScore.toFixed(3)}). Ranking stable: ${sensitivityAnalysis.rankingStable}. Review recommendation?`,
    title: 'MCDA Results Review',
    context: {
      runId: ctx.runId,
      summary: {
        topAlternative: aggregationRanking.topAlternative,
        ranking: aggregationRanking.ranking,
        rankingStable: sensitivityAnalysis.rankingStable,
        recommendation: recommendationReport.recommendation
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    ranking: aggregationRanking.ranking,
    sensitivityAnalysis: {
      rankingStable: sensitivityAnalysis.rankingStable,
      criticalWeights: sensitivityAnalysis.criticalWeights,
      breakpoints: sensitivityAnalysis.breakpoints
    },
    recommendation: recommendationReport.recommendation,
    weights: weightElicitation.weights,
    artifacts,
    duration,
    metadata: {
      processId: 'domains/science/industrial-engineering/multi-criteria-decision-analysis',
      timestamp: startTime,
      methodUsed: method,
      outputDir
    }
  };
}

// Task 1: Problem Structuring
export const problemStructuringTask = defineTask('problem-structuring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Structure decision problem',
  agent: {
    name: 'decision-analyst',
    prompt: {
      role: 'Decision Analyst',
      task: 'Structure the multi-criteria decision problem',
      context: args,
      instructions: [
        '1. Define decision context and objectives',
        '2. Identify all stakeholders',
        '3. Define alternatives to evaluate',
        '4. Identify evaluation criteria',
        '5. Define criteria measurement scales',
        '6. Document assumptions and constraints',
        '7. Create problem structure diagram',
        '8. Validate with stakeholders'
      ],
      outputFormat: 'JSON with problem structure, alternatives, and criteria'
    },
    outputSchema: {
      type: 'object',
      required: ['decisionContext', 'alternatives', 'criteria', 'artifacts'],
      properties: {
        decisionContext: { type: 'object' },
        alternatives: { type: 'array' },
        criteria: { type: 'array' },
        stakeholders: { type: 'array' },
        constraints: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'mcda', 'problem-structuring']
}));

// Task 2: Criteria Hierarchy
export const criteriaHierarchyTask = defineTask('criteria-hierarchy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop criteria hierarchy',
  agent: {
    name: 'hierarchy-developer',
    prompt: {
      role: 'Decision Modeling Expert',
      task: 'Develop hierarchical structure of evaluation criteria',
      context: args,
      instructions: [
        '1. Organize criteria into hierarchy',
        '2. Define main criteria categories',
        '3. Define sub-criteria under each category',
        '4. Ensure criteria are independent',
        '5. Ensure criteria are measurable',
        '6. Ensure complete coverage',
        '7. Create criteria tree diagram',
        '8. Document criteria definitions'
      ],
      outputFormat: 'JSON with criteria hierarchy and definitions'
    },
    outputSchema: {
      type: 'object',
      required: ['hierarchy', 'criteriaDefinitions', 'artifacts'],
      properties: {
        hierarchy: { type: 'object' },
        criteriaDefinitions: { type: 'array' },
        measurementScales: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'mcda', 'criteria-hierarchy']
}));

// Task 3: Weight Elicitation
export const weightElicitationTask = defineTask('weight-elicitation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Elicit criteria weights',
  agent: {
    name: 'weight-elicitor',
    prompt: {
      role: 'Decision Analysis Facilitator',
      task: 'Elicit criteria weights from decision makers',
      context: args,
      instructions: [
        '1. Create pairwise comparison matrices (AHP)',
        '2. Conduct pairwise comparisons',
        '3. Calculate eigenvector weights',
        '4. Check consistency ratio (CR < 0.10)',
        '5. Aggregate multiple decision maker weights',
        '6. Normalize final weights',
        '7. Document weight rationale',
        '8. Generate weight report'
      ],
      outputFormat: 'JSON with weights, consistency check, and pairwise matrices'
    },
    outputSchema: {
      type: 'object',
      required: ['weights', 'consistencyRatio', 'topCriterion', 'artifacts'],
      properties: {
        weights: { type: 'object' },
        consistencyRatio: { type: 'number' },
        topCriterion: { type: 'string' },
        pairwiseMatrices: { type: 'object' },
        consistencyCheck: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'mcda', 'weight-elicitation']
}));

// Task 4: Alternative Scoring
export const alternativeScoringTask = defineTask('alternative-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score alternatives against criteria',
  agent: {
    name: 'alternative-scorer',
    prompt: {
      role: 'Evaluation Specialist',
      task: 'Score each alternative against each criterion',
      context: args,
      instructions: [
        '1. Create performance matrix',
        '2. Score alternatives on each criterion',
        '3. Use quantitative data where available',
        '4. Use pairwise comparison for qualitative criteria',
        '5. Normalize scores appropriately',
        '6. Handle benefit vs. cost criteria',
        '7. Document scoring rationale',
        '8. Generate scoring matrix'
      ],
      outputFormat: 'JSON with scoring matrix and rationale'
    },
    outputSchema: {
      type: 'object',
      required: ['scoringMatrix', 'normalizedMatrix', 'artifacts'],
      properties: {
        scoringMatrix: { type: 'object' },
        normalizedMatrix: { type: 'object' },
        scoringRationale: { type: 'object' },
        dataSource: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'mcda', 'alternative-scoring']
}));

// Task 5: Aggregation and Ranking
export const aggregationRankingTask = defineTask('aggregation-ranking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Aggregate scores and rank alternatives',
  agent: {
    name: 'aggregation-analyst',
    prompt: {
      role: 'Decision Analysis Expert',
      task: 'Aggregate scores and produce final ranking',
      context: args,
      instructions: [
        '1. Apply weighted sum method (WSM)',
        '2. Apply weighted product method (WPM) if applicable',
        '3. Apply TOPSIS method if specified',
        '4. Calculate final scores for each alternative',
        '5. Rank alternatives by final score',
        '6. Calculate score differences',
        '7. Identify close alternatives',
        '8. Generate ranking report'
      ],
      outputFormat: 'JSON with final ranking and scores'
    },
    outputSchema: {
      type: 'object',
      required: ['ranking', 'topAlternative', 'topScore', 'artifacts'],
      properties: {
        ranking: { type: 'array' },
        topAlternative: { type: 'string' },
        topScore: { type: 'number' },
        finalScores: { type: 'object' },
        scoreDifferences: { type: 'object' },
        closeAlternatives: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'mcda', 'aggregation']
}));

// Task 6: Sensitivity Analysis
export const sensitivityAnalysisTask = defineTask('sensitivity-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform sensitivity analysis',
  agent: {
    name: 'sensitivity-analyst',
    prompt: {
      role: 'Decision Analyst',
      task: 'Analyze sensitivity of ranking to weight changes',
      context: args,
      instructions: [
        '1. Vary each criterion weight individually',
        '2. Identify weight breakpoints (rank reversal)',
        '3. Calculate critical weights',
        '4. Assess ranking stability',
        '5. Identify most sensitive criteria',
        '6. Create sensitivity charts',
        '7. Test extreme scenarios',
        '8. Document sensitivity findings'
      ],
      outputFormat: 'JSON with sensitivity analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['rankingStable', 'criticalWeights', 'breakpoints', 'artifacts'],
      properties: {
        rankingStable: { type: 'boolean' },
        criticalWeights: { type: 'object' },
        breakpoints: { type: 'array' },
        sensitiveCriteria: { type: 'array' },
        stabilityMargin: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'mcda', 'sensitivity-analysis']
}));

// Task 7: Recommendation Report
export const recommendationReportTask = defineTask('recommendation-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate recommendation report',
  agent: {
    name: 'decision-consultant',
    prompt: {
      role: 'Decision Consultant',
      task: 'Generate comprehensive decision recommendation report',
      context: args,
      instructions: [
        '1. Create executive summary',
        '2. Document decision methodology',
        '3. Present criteria weights justification',
        '4. Present alternative evaluations',
        '5. Present final ranking with explanation',
        '6. Discuss sensitivity analysis implications',
        '7. Make clear recommendation',
        '8. Discuss implementation considerations'
      ],
      outputFormat: 'JSON with recommendation and supporting documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendation', 'rationale', 'reportPath', 'artifacts'],
      properties: {
        recommendation: { type: 'string' },
        rationale: { type: 'string' },
        confidenceLevel: { type: 'string' },
        caveats: { type: 'array' },
        implementationConsiderations: { type: 'array' },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'mcda', 'recommendation']
}));
