/**
 * @process social-sciences/scale-development-validation
 * @description Create and validate measurement instruments through item generation, expert review, pilot testing, exploratory and confirmatory factor analysis, and reliability assessment
 * @inputs { construct: string, conceptualDefinition: object, targetPopulation: object, outputDir: string }
 * @outputs { success: boolean, validatedScale: object, psychometricProperties: object, qualityScore: number, artifacts: array }
 * @recommendedSkills SK-SS-009 (psychometric-assessment), SK-SS-001 (quantitative-methods)
 * @recommendedAgents AG-SS-007 (measurement-psychometrics-expert), AG-SS-001 (quantitative-research-methodologist)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    construct,
    conceptualDefinition = {},
    targetPopulation = {},
    outputDir = 'scale-development-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Scale Development and Validation process');

  // ============================================================================
  // PHASE 1: CONCEPTUALIZATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Conceptualizing construct');
  const conceptualization = await ctx.task(constructConceptualizationTask, {
    construct,
    conceptualDefinition,
    outputDir
  });

  artifacts.push(...conceptualization.artifacts);

  // ============================================================================
  // PHASE 2: ITEM GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Generating items');
  const itemGeneration = await ctx.task(itemGenerationTask, {
    conceptualization,
    targetPopulation,
    outputDir
  });

  artifacts.push(...itemGeneration.artifacts);

  // ============================================================================
  // PHASE 3: EXPERT REVIEW
  // ============================================================================

  ctx.log('info', 'Phase 3: Conducting expert review');
  const expertReview = await ctx.task(expertReviewTask, {
    itemGeneration,
    conceptualization,
    outputDir
  });

  artifacts.push(...expertReview.artifacts);

  // ============================================================================
  // PHASE 4: PILOT TESTING
  // ============================================================================

  ctx.log('info', 'Phase 4: Pilot testing');
  const pilotTesting = await ctx.task(scalePilotTestingTask, {
    expertReview,
    targetPopulation,
    outputDir
  });

  artifacts.push(...pilotTesting.artifacts);

  // ============================================================================
  // PHASE 5: EXPLORATORY FACTOR ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Conducting exploratory factor analysis');
  const efaAnalysis = await ctx.task(efaTask, {
    pilotTesting,
    outputDir
  });

  artifacts.push(...efaAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: CONFIRMATORY FACTOR ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Conducting confirmatory factor analysis');
  const cfaAnalysis = await ctx.task(scaleCfaTask, {
    efaAnalysis,
    outputDir
  });

  artifacts.push(...cfaAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: RELIABILITY AND VALIDITY
  // ============================================================================

  ctx.log('info', 'Phase 7: Assessing reliability and validity');
  const reliabilityValidity = await ctx.task(reliabilityValidityTask, {
    cfaAnalysis,
    outputDir
  });

  artifacts.push(...reliabilityValidity.artifacts);

  // ============================================================================
  // PHASE 8: QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Phase 8: Scoring scale development quality');
  const qualityScore = await ctx.task(scaleQualityScoringTask, {
    conceptualization,
    itemGeneration,
    expertReview,
    pilotTesting,
    efaAnalysis,
    cfaAnalysis,
    reliabilityValidity,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const scaleScore = qualityScore.overallScore;
  const qualityMet = scaleScore >= 80;

  // Breakpoint: Review scale development
  await ctx.breakpoint({
    question: `Scale development complete. Quality score: ${scaleScore}/100. ${qualityMet ? 'Scale meets quality standards!' : 'Scale may need refinement.'} Review and approve?`,
    title: 'Scale Development Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        scaleScore,
        qualityMet,
        construct,
        finalItems: cfaAnalysis.finalItems,
        reliability: reliabilityValidity.reliability
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    qualityScore: scaleScore,
    qualityMet,
    validatedScale: {
      construct,
      finalItems: cfaAnalysis.finalItems,
      factorStructure: cfaAnalysis.factorStructure,
      scoringInstructions: cfaAnalysis.scoringInstructions
    },
    psychometricProperties: {
      reliability: reliabilityValidity.reliability,
      validity: reliabilityValidity.validity,
      factorLoadings: cfaAnalysis.factorLoadings,
      modelFit: cfaAnalysis.modelFit
    },
    artifacts,
    duration,
    metadata: {
      processId: 'social-sciences/scale-development-validation',
      timestamp: startTime,
      outputDir
    }
  };
}

export const constructConceptualizationTask = defineTask('construct-conceptualization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conceptualize construct',
  agent: {
    name: 'construct-specialist',
    prompt: {
      role: 'measurement theorist',
      task: 'Develop comprehensive conceptual definition',
      context: args,
      instructions: [
        'Review literature for existing definitions',
        'Define construct conceptually',
        'Identify dimensions/facets of construct',
        'Distinguish from related constructs',
        'Define construct boundaries',
        'Identify indicators for each dimension',
        'Document nomological network',
        'Generate conceptualization document'
      ],
      outputFormat: 'JSON with definition, dimensions, boundaries, indicators, nomologicalNetwork, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['definition', 'dimensions', 'artifacts'],
      properties: {
        definition: { type: 'string' },
        dimensions: { type: 'array' },
        boundaries: { type: 'array', items: { type: 'string' } },
        relatedConstructs: { type: 'array', items: { type: 'string' } },
        indicators: { type: 'object' },
        nomologicalNetwork: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scale-development', 'conceptualization']
}));

export const itemGenerationTask = defineTask('item-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate items',
  agent: {
    name: 'item-writer',
    prompt: {
      role: 'scale item development specialist',
      task: 'Generate item pool for scale',
      context: args,
      instructions: [
        'Generate items for each dimension/indicator',
        'Follow item writing best practices',
        'Use appropriate reading level',
        'Include positively and negatively worded items',
        'Aim for 3-4x items needed for final scale',
        'Ensure content coverage',
        'Develop response format and anchors',
        'Generate item pool documentation'
      ],
      outputFormat: 'JSON with itemPool, itemsByDimension, responseFormat, itemCount, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['itemPool', 'responseFormat', 'artifacts'],
      properties: {
        itemPool: { type: 'array' },
        itemsByDimension: { type: 'object' },
        responseFormat: { type: 'object' },
        itemCount: { type: 'number' },
        negativeItems: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scale-development', 'item-generation']
}));

export const expertReviewTask = defineTask('expert-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct expert review',
  agent: {
    name: 'expert-review-coordinator',
    prompt: {
      role: 'content validity specialist',
      task: 'Conduct expert review of items',
      context: args,
      instructions: [
        'Recruit content experts for review',
        'Assess content validity (relevance, clarity)',
        'Calculate content validity index (CVI)',
        'Identify items needing revision',
        'Remove low-CVI items',
        'Revise items based on feedback',
        'Document expert panel composition',
        'Generate expert review report'
      ],
      outputFormat: 'JSON with cviScores, itemRetained, itemsRevised, itemsRemoved, expertPanel, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['cviScores', 'itemRetained', 'artifacts'],
      properties: {
        cviScores: { type: 'object' },
        scaleCVI: { type: 'number' },
        itemRetained: { type: 'number' },
        itemsRevised: { type: 'array' },
        itemsRemoved: { type: 'array' },
        expertPanel: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scale-development', 'expert-review']
}));

export const scalePilotTestingTask = defineTask('scale-pilot-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Pilot test scale',
  agent: {
    name: 'pilot-testing-specialist',
    prompt: {
      role: 'scale pilot testing specialist',
      task: 'Conduct pilot testing of scale',
      context: args,
      instructions: [
        'Recruit pilot sample from target population',
        'Administer scale with cognitive interviewing',
        'Assess item comprehension',
        'Examine response distributions',
        'Identify floor/ceiling effects',
        'Calculate initial item statistics',
        'Identify problematic items',
        'Generate pilot testing report'
      ],
      outputFormat: 'JSON with sampleSize, itemStatistics, distributions, problematicItems, cognitiveFindings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['sampleSize', 'itemStatistics', 'artifacts'],
      properties: {
        sampleSize: { type: 'number' },
        itemStatistics: { type: 'object' },
        distributions: { type: 'object' },
        floorCeilingEffects: { type: 'array' },
        problematicItems: { type: 'array' },
        cognitiveFindings: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scale-development', 'pilot-testing']
}));

export const efaTask = defineTask('efa', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct exploratory factor analysis',
  agent: {
    name: 'efa-analyst',
    prompt: {
      role: 'factor analysis specialist',
      task: 'Conduct exploratory factor analysis',
      context: args,
      instructions: [
        'Assess data suitability (KMO, Bartlett)',
        'Determine number of factors (scree, parallel analysis)',
        'Extract factors using appropriate method',
        'Apply rotation (oblique or orthogonal)',
        'Examine factor loadings',
        'Remove cross-loading/low-loading items',
        'Interpret factor structure',
        'Generate EFA report'
      ],
      outputFormat: 'JSON with kmo, factorCount, factorLoadings, itemsRemoved, factorStructure, varianceExplained, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['kmo', 'factorCount', 'factorLoadings', 'artifacts'],
      properties: {
        kmo: { type: 'number' },
        bartlett: { type: 'object' },
        factorCount: { type: 'number' },
        factorLoadings: { type: 'object' },
        itemsRemoved: { type: 'array' },
        factorStructure: { type: 'object' },
        varianceExplained: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scale-development', 'efa']
}));

export const scaleCfaTask = defineTask('scale-cfa', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct confirmatory factor analysis',
  agent: {
    name: 'cfa-analyst',
    prompt: {
      role: 'CFA specialist',
      task: 'Conduct confirmatory factor analysis on new sample',
      context: args,
      instructions: [
        'Collect data from independent sample',
        'Specify CFA model based on EFA structure',
        'Estimate model',
        'Evaluate model fit',
        'Examine factor loadings',
        'Refine model if needed',
        'Finalize item set',
        'Generate CFA report'
      ],
      outputFormat: 'JSON with sampleSize, modelFit, factorLoadings, finalItems, factorStructure, scoringInstructions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['modelFit', 'factorLoadings', 'finalItems', 'artifacts'],
      properties: {
        sampleSize: { type: 'number' },
        modelFit: { type: 'object' },
        factorLoadings: { type: 'object' },
        finalItems: { type: 'number' },
        factorStructure: { type: 'object' },
        scoringInstructions: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scale-development', 'cfa']
}));

export const reliabilityValidityTask = defineTask('reliability-validity', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess reliability and validity',
  agent: {
    name: 'psychometrician',
    prompt: {
      role: 'psychometric specialist',
      task: 'Assess reliability and validity of scale',
      context: args,
      instructions: [
        'Calculate internal consistency (alpha, omega)',
        'Assess test-retest reliability if data available',
        'Evaluate convergent validity (AVE)',
        'Assess discriminant validity (HTMT)',
        'Test criterion validity (concurrent, predictive)',
        'Assess construct validity through known-groups',
        'Document all psychometric properties',
        'Generate reliability/validity report'
      ],
      outputFormat: 'JSON with reliability, validity, psychometricProperties, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reliability', 'validity', 'artifacts'],
      properties: {
        reliability: {
          type: 'object',
          properties: {
            alpha: { type: 'number' },
            omega: { type: 'number' },
            testRetest: { type: 'number' }
          }
        },
        validity: {
          type: 'object',
          properties: {
            convergent: { type: 'object' },
            discriminant: { type: 'object' },
            criterion: { type: 'object' },
            construct: { type: 'object' }
          }
        },
        psychometricProperties: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scale-development', 'psychometrics']
}));

export const scaleQualityScoringTask = defineTask('scale-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score scale development quality',
  agent: {
    name: 'scale-quality-reviewer',
    prompt: {
      role: 'measurement specialist',
      task: 'Assess scale development quality',
      context: args,
      instructions: [
        'Evaluate conceptualization thoroughness (weight: 10%)',
        'Assess item generation quality (weight: 15%)',
        'Evaluate expert review rigor (weight: 10%)',
        'Assess pilot testing adequacy (weight: 10%)',
        'Evaluate EFA rigor (weight: 15%)',
        'Assess CFA quality (weight: 20%)',
        'Evaluate reliability/validity assessment (weight: 20%)',
        'Calculate weighted overall score (0-100)',
        'Identify gaps and recommendations'
      ],
      outputFormat: 'JSON with overallScore, componentScores, gaps, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: { type: 'object' },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scale-development', 'quality-scoring']
}));
