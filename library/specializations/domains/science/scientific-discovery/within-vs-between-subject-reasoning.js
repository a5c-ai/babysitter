/**
 * @process scientific-discovery/within-vs-between-subject-reasoning
 * @description Differentiate within-individual vs cross-individual effects in psychological and social science research
 * @inputs { researchQuestion: string, data: object, variables: array, designType: string, outputDir: string }
 * @outputs { success: boolean, analysis: object, withinEffects: array, betweenEffects: array, partitionedVariance: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    researchQuestion = '',
    data = {},
    variables = [],
    designType = '', // longitudinal, multilevel, cross-sectional
    outputDir = 'within-between-output',
    targetClarity = 80
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Within vs. Between Subject Reasoning Process');

  // ============================================================================
  // PHASE 1: RESEARCH QUESTION DECOMPOSITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Decomposing research question');
  const questionDecomposition = await ctx.task(questionDecompositionTask, {
    researchQuestion,
    variables,
    outputDir
  });

  artifacts.push(...questionDecomposition.artifacts);

  // ============================================================================
  // PHASE 2: VARIANCE STRUCTURE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing variance structure');
  const varianceAnalysis = await ctx.task(varianceStructureAnalysisTask, {
    data,
    variables,
    designType,
    outputDir
  });

  artifacts.push(...varianceAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: WITHIN-PERSON EFFECT IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Identifying within-person effects');
  const withinPersonAnalysis = await ctx.task(withinPersonEffectsTask, {
    researchQuestion,
    data,
    variables,
    varianceStructure: varianceAnalysis.structure,
    outputDir
  });

  artifacts.push(...withinPersonAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: BETWEEN-PERSON EFFECT IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Identifying between-person effects');
  const betweenPersonAnalysis = await ctx.task(betweenPersonEffectsTask, {
    researchQuestion,
    data,
    variables,
    varianceStructure: varianceAnalysis.structure,
    outputDir
  });

  artifacts.push(...betweenPersonAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: ECOLOGICAL FALLACY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Assessing ecological fallacy risks');
  const ecologicalAssessment = await ctx.task(ecologicalFallacyAssessmentTask, {
    withinEffects: withinPersonAnalysis.effects,
    betweenEffects: betweenPersonAnalysis.effects,
    designType,
    outputDir
  });

  artifacts.push(...ecologicalAssessment.artifacts);

  // ============================================================================
  // PHASE 6: DISAGGREGATION STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 6: Developing disaggregation strategy');
  const disaggregationStrategy = await ctx.task(disaggregationStrategyTask, {
    variables,
    varianceStructure: varianceAnalysis.structure,
    designType,
    outputDir
  });

  artifacts.push(...disaggregationStrategy.artifacts);

  // ============================================================================
  // PHASE 7: MULTILEVEL MODEL SPECIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Specifying multilevel model');
  const multilevelSpec = await ctx.task(multilevelModelSpecificationTask, {
    withinEffects: withinPersonAnalysis.effects,
    betweenEffects: betweenPersonAnalysis.effects,
    disaggregation: disaggregationStrategy.strategy,
    variables,
    outputDir
  });

  artifacts.push(...multilevelSpec.artifacts);

  // ============================================================================
  // PHASE 8: SYNTHESIS AND INTERPRETATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Synthesizing analysis');
  const synthesis = await ctx.task(withinBetweenSynthesisTask, {
    questionDecomposition,
    varianceAnalysis,
    withinPersonAnalysis,
    betweenPersonAnalysis,
    ecologicalAssessment,
    disaggregationStrategy,
    multilevelSpec,
    targetClarity,
    outputDir
  });

  artifacts.push(...synthesis.artifacts);

  const clarityMet = synthesis.clarityScore >= targetClarity;

  // Breakpoint: Review within-between analysis
  await ctx.breakpoint({
    question: `Within-between analysis complete. Clarity: ${synthesis.clarityScore}/${targetClarity}. ${clarityMet ? 'Clarity target met!' : 'Additional specification may be needed.'} Review analysis?`,
    title: 'Within vs. Between Subject Analysis Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        researchQuestion,
        withinVariance: varianceAnalysis.structure.withinProportion,
        betweenVariance: varianceAnalysis.structure.betweenProportion,
        withinEffects: withinPersonAnalysis.effects.length,
        betweenEffects: betweenPersonAnalysis.effects.length,
        ecologicalFallacyRisk: ecologicalAssessment.riskLevel,
        clarityScore: synthesis.clarityScore,
        clarityMet
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    researchQuestion,
    analysis: {
      questionType: questionDecomposition.questionType,
      varianceStructure: varianceAnalysis.structure,
      multilevelModel: multilevelSpec.model
    },
    withinEffects: withinPersonAnalysis.effects,
    betweenEffects: betweenPersonAnalysis.effects,
    partitionedVariance: varianceAnalysis.structure,
    ecologicalFallacyAssessment: ecologicalAssessment.assessment,
    disaggregationStrategy: disaggregationStrategy.strategy,
    interpretation: synthesis.interpretation,
    clarityScore: synthesis.clarityScore,
    clarityMet,
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/within-vs-between-subject-reasoning',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Question Decomposition
export const questionDecompositionTask = defineTask('question-decomposition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Decompose research question',
  agent: {
    name: 'research-methodologist',
    prompt: {
      role: 'quantitative methodologist specializing in multilevel research',
      task: 'Decompose the research question into within and between components',
      context: args,
      instructions: [
        'Identify the level of the research question:',
        '  - Within-person (intraindividual)',
        '  - Between-person (interindividual)',
        '  - Cross-level',
        '  - Mixed',
        'Clarify what the question asks about:',
        '  - Stability vs. change within individuals?',
        '  - Differences between individuals?',
        '  - How individual-level processes vary across people?',
        'Identify implicit assumptions about level',
        'Reformulate question to explicitly address levels',
        'Identify potential Simpson\'s paradox scenarios',
        'Save question decomposition to output directory'
      ],
      outputFormat: 'JSON with questionType, withinComponent, betweenComponent, crossLevelComponent, assumptions, reformulation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['questionType', 'withinComponent', 'betweenComponent', 'artifacts'],
      properties: {
        questionType: { type: 'string', enum: ['within', 'between', 'cross-level', 'mixed'] },
        withinComponent: {
          type: 'object',
          properties: {
            question: { type: 'string' },
            variables: { type: 'array', items: { type: 'string' } },
            present: { type: 'boolean' }
          }
        },
        betweenComponent: {
          type: 'object',
          properties: {
            question: { type: 'string' },
            variables: { type: 'array', items: { type: 'string' } },
            present: { type: 'boolean' }
          }
        },
        crossLevelComponent: { type: 'object' },
        assumptions: { type: 'array', items: { type: 'string' } },
        reformulation: { type: 'string' },
        simpsonParadoxRisk: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'within-between', 'question-decomposition']
}));

// Task 2: Variance Structure Analysis
export const varianceStructureAnalysisTask = defineTask('variance-structure-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze variance structure',
  agent: {
    name: 'variance-analyst',
    prompt: {
      role: 'multilevel modeling specialist',
      task: 'Partition variance into within and between components',
      context: args,
      instructions: [
        'Calculate intraclass correlation (ICC) for each variable:',
        '  - ICC(1): proportion of variance between clusters',
        '  - ICC(2): reliability of cluster means',
        'Partition total variance:',
        '  - Within-person (Level 1) variance',
        '  - Between-person (Level 2) variance',
        '  - Higher levels if applicable',
        'Assess variance distribution:',
        '  - High ICC (>0.25): substantial between-person variance',
        '  - Low ICC (<0.05): mostly within-person variance',
        'Identify variables with different variance structures',
        'Calculate design effect for sample size implications',
        'Save variance analysis to output directory'
      ],
      outputFormat: 'JSON with structure (ICCs, withinProportion, betweenProportion), variableBreakdown, designEffect, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['structure', 'variableBreakdown', 'artifacts'],
      properties: {
        structure: {
          type: 'object',
          properties: {
            overallICC: { type: 'number' },
            withinProportion: { type: 'number' },
            betweenProportion: { type: 'number' }
          }
        },
        variableBreakdown: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variable: { type: 'string' },
              ICC: { type: 'number' },
              withinVariance: { type: 'number' },
              betweenVariance: { type: 'number' }
            }
          }
        },
        designEffect: { type: 'number' },
        interpretation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'within-between', 'variance-structure']
}));

// Task 3: Within-Person Effects
export const withinPersonEffectsTask = defineTask('within-person-effects', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify within-person effects',
  agent: {
    name: 'within-person-analyst',
    prompt: {
      role: 'intraindividual variability specialist',
      task: 'Identify and characterize within-person (intraindividual) effects',
      context: args,
      instructions: [
        'Define within-person effects:',
        '  - How does Y change within a person as X changes within that person?',
        '  - Time-varying relationships',
        '  - State-like associations',
        'Identify within-person predictors:',
        '  - Variables that fluctuate within individuals',
        '  - Time-varying covariates',
        '  - Occasion-specific measures',
        'Characterize within-person processes:',
        '  - Coupling (concurrent within-person association)',
        '  - Lagged effects (time-delayed within-person effects)',
        '  - Trend effects (individual change over time)',
        'Consider person-specific effects (random slopes)',
        'Identify within-person mediation and moderation',
        'Save within-person analysis to output directory'
      ],
      outputFormat: 'JSON with effects (array), predictors, processes, randomSlopes, mediationModeration, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['effects', 'predictors', 'artifacts'],
      properties: {
        effects: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              predictor: { type: 'string' },
              outcome: { type: 'string' },
              type: { type: 'string', enum: ['concurrent', 'lagged', 'trend'] },
              description: { type: 'string' }
            }
          }
        },
        predictors: { type: 'array', items: { type: 'string' } },
        processes: { type: 'array', items: { type: 'object' } },
        randomSlopes: { type: 'array', items: { type: 'string' } },
        mediationModeration: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'within-between', 'within-person']
}));

// Task 4: Between-Person Effects
export const betweenPersonEffectsTask = defineTask('between-person-effects', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify between-person effects',
  agent: {
    name: 'between-person-analyst',
    prompt: {
      role: 'individual differences specialist',
      task: 'Identify and characterize between-person (interindividual) effects',
      context: args,
      instructions: [
        'Define between-person effects:',
        '  - How does Y differ between people who differ in X?',
        '  - Stable individual differences',
        '  - Trait-like associations',
        'Identify between-person predictors:',
        '  - Time-invariant characteristics',
        '  - Person-level means of time-varying variables',
        '  - Demographic and trait variables',
        'Characterize between-person processes:',
        '  - Level effects (person-mean associations)',
        '  - Composition effects (aggregated within-person effects)',
        '  - Contextual effects (group-level influences)',
        'Consider random intercepts',
        'Identify between-person moderators',
        'Save between-person analysis to output directory'
      ],
      outputFormat: 'JSON with effects (array), predictors, processes, randomIntercepts, moderators, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['effects', 'predictors', 'artifacts'],
      properties: {
        effects: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              predictor: { type: 'string' },
              outcome: { type: 'string' },
              type: { type: 'string', enum: ['level', 'composition', 'contextual'] },
              description: { type: 'string' }
            }
          }
        },
        predictors: { type: 'array', items: { type: 'string' } },
        processes: { type: 'array', items: { type: 'object' } },
        randomIntercepts: { type: 'array', items: { type: 'string' } },
        moderators: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'within-between', 'between-person']
}));

// Task 5: Ecological Fallacy Assessment
export const ecologicalFallacyAssessmentTask = defineTask('ecological-fallacy-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess ecological fallacy risks',
  agent: {
    name: 'fallacy-assessor',
    prompt: {
      role: 'methodologist specializing in aggregation bias',
      task: 'Assess risks of ecological fallacy and related biases',
      context: args,
      instructions: [
        'Assess ecological fallacy risk:',
        '  - Are between-person effects being interpreted as within-person?',
        '  - Could aggregate relationships differ from individual relationships?',
        'Assess atomistic fallacy risk:',
        '  - Are within-person effects being generalized to between-person?',
        '  - Could individual processes differ from group patterns?',
        'Identify potential Simpson\'s paradox:',
        '  - Could direction of effect reverse across levels?',
        '  - Are there suppression effects?',
        'Evaluate effect heterogeneity:',
        '  - Do within-person effects vary between persons?',
        '  - Are there subgroup differences?',
        'Recommend safeguards',
        'Save fallacy assessment to output directory'
      ],
      outputFormat: 'JSON with assessment (ecological, atomistic, simpson), riskLevel, heterogeneity, safeguards, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assessment', 'riskLevel', 'artifacts'],
      properties: {
        assessment: {
          type: 'object',
          properties: {
            ecologicalFallacy: {
              type: 'object',
              properties: {
                risk: { type: 'string', enum: ['high', 'medium', 'low'] },
                explanation: { type: 'string' }
              }
            },
            atomisticFallacy: {
              type: 'object',
              properties: {
                risk: { type: 'string', enum: ['high', 'medium', 'low'] },
                explanation: { type: 'string' }
              }
            },
            simpsonParadox: {
              type: 'object',
              properties: {
                risk: { type: 'string', enum: ['high', 'medium', 'low'] },
                explanation: { type: 'string' }
              }
            }
          }
        },
        riskLevel: { type: 'string', enum: ['high', 'medium', 'low'] },
        heterogeneity: { type: 'object' },
        safeguards: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'within-between', 'ecological-fallacy']
}));

// Task 6: Disaggregation Strategy
export const disaggregationStrategyTask = defineTask('disaggregation-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop disaggregation strategy',
  agent: {
    name: 'disaggregation-specialist',
    prompt: {
      role: 'multilevel modeling methodologist',
      task: 'Develop strategy to separate within and between effects',
      context: args,
      instructions: [
        'Design variable centering strategy:',
        '  - Person-mean centering for within-person effects',
        '  - Grand-mean centering for between-person effects',
        '  - Include person means as between-person predictors',
        'Apply Curran and Bauer decomposition:',
        '  - Xij = Xij_within + X_j_between',
        '  - Xij_within = Xij - X_j (person-mean centered)',
        '  - X_j_between = X_j (person mean)',
        'Consider contextual effect model:',
        '  - Includes both within and between effects',
        '  - Contextual effect = between effect - within effect',
        'Address aggregation for time-varying predictors',
        'Handle missing data at each level',
        'Save disaggregation strategy to output directory'
      ],
      outputFormat: 'JSON with strategy (centering, decomposition, contextualModel), variableTransformations, missingDataHandling, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'variableTransformations', 'artifacts'],
      properties: {
        strategy: {
          type: 'object',
          properties: {
            centering: { type: 'string' },
            decomposition: { type: 'string' },
            contextualModel: { type: 'boolean' }
          }
        },
        variableTransformations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              original: { type: 'string' },
              withinComponent: { type: 'string' },
              betweenComponent: { type: 'string' },
              transformation: { type: 'string' }
            }
          }
        },
        missingDataHandling: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'within-between', 'disaggregation']
}));

// Task 7: Multilevel Model Specification
export const multilevelModelSpecificationTask = defineTask('multilevel-model-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Specify multilevel model',
  agent: {
    name: 'multilevel-modeler',
    prompt: {
      role: 'multilevel modeling specialist',
      task: 'Specify a multilevel model that separates within and between effects',
      context: args,
      instructions: [
        'Specify Level 1 (within-person) model:',
        '  - Within-person outcome',
        '  - Person-mean centered predictors',
        '  - Within-person residual',
        'Specify Level 2 (between-person) model:',
        '  - Random intercept (person mean of outcome)',
        '  - Person means as predictors',
        '  - Random slopes (if theoretically relevant)',
        'Write combined model equation',
        'Specify variance components:',
        '  - Within-person residual variance',
        '  - Between-person intercept variance',
        '  - Slope variances and covariances',
        'Consider model building sequence',
        'Save model specification to output directory'
      ],
      outputFormat: 'JSON with model (level1, level2, combined), varianceComponents, modelEquation, buildingSequence, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['model', 'varianceComponents', 'artifacts'],
      properties: {
        model: {
          type: 'object',
          properties: {
            level1: { type: 'string' },
            level2: { type: 'string' },
            combined: { type: 'string' }
          }
        },
        varianceComponents: {
          type: 'object',
          properties: {
            residual: { type: 'string' },
            interceptVariance: { type: 'string' },
            slopeVariances: { type: 'array', items: { type: 'string' } }
          }
        },
        modelEquation: { type: 'string' },
        buildingSequence: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'within-between', 'multilevel-model']
}));

// Task 8: Within-Between Synthesis
export const withinBetweenSynthesisTask = defineTask('within-between-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize analysis',
  agent: {
    name: 'synthesis-specialist',
    prompt: {
      role: 'senior quantitative methodologist',
      task: 'Synthesize within-between subject analysis',
      context: args,
      instructions: [
        'Summarize findings by level:',
        '  - Within-person effects and their meaning',
        '  - Between-person effects and their meaning',
        '  - Cross-level interactions',
        'Compare within vs. between effects:',
        '  - Same direction or different?',
        '  - Same magnitude or different?',
        '  - What does the difference mean substantively?',
        'Assess clarity of level separation (0-100):',
        '  - Variance properly partitioned?',
        '  - Effects clearly separated?',
        '  - Fallacy risks addressed?',
        'Provide interpretation guidelines',
        'Identify limitations and future directions',
        'Save synthesis to output directory'
      ],
      outputFormat: 'JSON with interpretation, clarityScore, effectComparison, guidelines, limitations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['interpretation', 'clarityScore', 'artifacts'],
      properties: {
        interpretation: {
          type: 'object',
          properties: {
            withinFindings: { type: 'string' },
            betweenFindings: { type: 'string' },
            crossLevel: { type: 'string' }
          }
        },
        clarityScore: { type: 'number', minimum: 0, maximum: 100 },
        effectComparison: {
          type: 'object',
          properties: {
            directionMatch: { type: 'boolean' },
            magnitudeComparison: { type: 'string' },
            substantiveImplications: { type: 'string' }
          }
        },
        guidelines: { type: 'array', items: { type: 'string' } },
        limitations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'within-between', 'synthesis']
}));
