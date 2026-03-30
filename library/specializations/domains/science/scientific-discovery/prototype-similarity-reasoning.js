/**
 * @process scientific-discovery/prototype-similarity-reasoning
 * @description Categorize items by similarity to prototypes rather than strict definitions
 * @inputs { prototypes: array, instances: array, features: array, similarityMetric: string, outputDir: string }
 * @outputs { success: boolean, categorizations: array, typicalityScores: object, categoryStructure: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    prototypes = [],
    instances = [],
    features = [],
    similarityMetric = 'weighted-euclidean',
    outputDir = 'prototype-reasoning-output',
    typicalityThreshold = 0.5
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Prototype-Similarity Reasoning Process');

  // ============================================================================
  // PHASE 1: PROTOTYPE REPRESENTATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Representing prototypes');
  const prototypeRep = await ctx.task(prototypeRepresentationTask, {
    prototypes,
    features,
    outputDir
  });

  artifacts.push(...prototypeRep.artifacts);

  // ============================================================================
  // PHASE 2: FEATURE WEIGHT DETERMINATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Determining feature weights');
  const featureWeights = await ctx.task(featureWeightTask, {
    prototypes: prototypeRep.prototypes,
    features,
    outputDir
  });

  artifacts.push(...featureWeights.artifacts);

  // ============================================================================
  // PHASE 3: SIMILARITY COMPUTATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Computing similarities between instances and prototypes');
  const similarityComputation = await ctx.task(similarityComputationTask, {
    prototypes: prototypeRep.prototypes,
    instances,
    featureWeights: featureWeights.weights,
    similarityMetric,
    outputDir
  });

  artifacts.push(...similarityComputation.artifacts);

  // ============================================================================
  // PHASE 4: TYPICALITY SCORING
  // ============================================================================

  ctx.log('info', 'Phase 4: Computing typicality scores');
  const typicalityScoring = await ctx.task(typicalityScoringTask, {
    similarityMatrix: similarityComputation.similarities,
    prototypes: prototypeRep.prototypes,
    instances,
    outputDir
  });

  artifacts.push(...typicalityScoring.artifacts);

  // ============================================================================
  // PHASE 5: CATEGORIZATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Categorizing instances');
  const categorization = await ctx.task(categorizationTask, {
    typicalityScores: typicalityScoring.scores,
    similarityMatrix: similarityComputation.similarities,
    prototypes: prototypeRep.prototypes,
    instances,
    typicalityThreshold,
    outputDir
  });

  artifacts.push(...categorization.artifacts);

  // ============================================================================
  // PHASE 6: GRADED MEMBERSHIP ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing graded category membership');
  const gradedMembership = await ctx.task(gradedMembershipTask, {
    categorizations: categorization.categorizations,
    typicalityScores: typicalityScoring.scores,
    outputDir
  });

  artifacts.push(...gradedMembership.artifacts);

  // ============================================================================
  // PHASE 7: CATEGORY STRUCTURE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 7: Analyzing category structure');
  const categoryStructure = await ctx.task(categoryStructureTask, {
    prototypes: prototypeRep.prototypes,
    categorizations: categorization.categorizations,
    typicalityScores: typicalityScoring.scores,
    outputDir
  });

  artifacts.push(...categoryStructure.artifacts);

  // ============================================================================
  // PHASE 8: QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 8: Assessing reasoning quality');
  const qualityScore = await ctx.task(prototypeQualityTask, {
    prototypeRep,
    similarityComputation,
    typicalityScoring,
    categorization,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const qualityMet = qualityScore.overallScore >= 75;

  // Breakpoint: Review prototype reasoning results
  await ctx.breakpoint({
    question: `Prototype reasoning complete. Quality score: ${qualityScore.overallScore}/100. Categorized ${categorization.categorizedCount}/${instances.length} instances. ${qualityMet ? 'Quality meets standards!' : 'Review similarity metrics and thresholds.'} Review results?`,
    title: 'Prototype Reasoning Results Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'json',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        prototypesCount: prototypes.length,
        instancesCount: instances.length,
        categorizedCount: categorization.categorizedCount,
        uncategorizedCount: categorization.uncategorizedCount,
        averageTypicality: typicalityScoring.averageTypicality,
        qualityScore: qualityScore.overallScore
      }
    }
  });

  // ============================================================================
  // PHASE 9: REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating comprehensive report');
  const report = await ctx.task(prototypeReportTask, {
    prototypeRep,
    featureWeights,
    similarityComputation,
    typicalityScoring,
    categorization,
    gradedMembership,
    categoryStructure,
    qualityScore: qualityScore.overallScore,
    outputDir
  });

  artifacts.push(...report.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    categorizations: categorization.categorizations,
    typicalityScores: typicalityScoring.scores,
    categoryStructure: categoryStructure.structure,
    gradedMemberships: gradedMembership.memberships,
    qualityScore: qualityScore.overallScore,
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/prototype-similarity-reasoning',
      timestamp: startTime,
      outputDir,
      similarityMetric,
      typicalityThreshold
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Prototype Representation
export const prototypeRepresentationTask = defineTask('prototype-representation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Represent category prototypes',
  agent: {
    name: 'prototype-representation-agent',
    prompt: {
      role: 'cognitive categorization specialist',
      task: 'Create formal representations of category prototypes',
      context: args,
      instructions: [
        'Represent each prototype as feature vector',
        'Identify central/typical features for each prototype',
        'Specify feature values (numeric, categorical, or mixed)',
        'Handle multi-prototype categories if present',
        'Document prototype origins (exemplar-based vs abstract)',
        'Identify core vs peripheral features',
        'Validate prototype completeness',
        'Save prototype representations to output directory'
      ],
      outputFormat: 'JSON with prototypes (array), featureVectors (object), coreFeatures (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['prototypes', 'featureVectors', 'artifacts'],
      properties: {
        prototypes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              category: { type: 'string' },
              features: { type: 'object' },
              description: { type: 'string' }
            }
          }
        },
        featureVectors: {
          type: 'object',
          additionalProperties: { type: 'array' }
        },
        coreFeatures: {
          type: 'object',
          additionalProperties: { type: 'array' }
        },
        prototypeType: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'prototype-reasoning', 'representation']
}));

// Task 2: Feature Weight Determination
export const featureWeightTask = defineTask('feature-weight', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Determine feature weights for similarity',
  agent: {
    name: 'feature-weight-agent',
    prompt: {
      role: 'feature importance analyst',
      task: 'Determine weights for features in similarity computation',
      context: args,
      instructions: [
        'Assign weights reflecting feature importance for categorization',
        'Consider feature diagnosticity (how well it distinguishes categories)',
        'Consider feature salience (perceptual prominence)',
        'Handle feature correlations',
        'Normalize weights to sum to 1',
        'Allow for context-dependent weighting',
        'Document weight assignment rationale',
        'Save feature weights to output directory'
      ],
      outputFormat: 'JSON with weights (object), weightRationale (object), diagnosticity (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['weights', 'artifacts'],
      properties: {
        weights: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        weightRationale: {
          type: 'object',
          additionalProperties: { type: 'string' }
        },
        diagnosticity: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        salience: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        totalWeight: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'prototype-reasoning', 'features']
}));

// Task 3: Similarity Computation
export const similarityComputationTask = defineTask('similarity-computation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compute similarities between instances and prototypes',
  agent: {
    name: 'similarity-computation-agent',
    prompt: {
      role: 'similarity measurement specialist',
      task: 'Compute similarity between each instance and each prototype',
      context: args,
      instructions: [
        'Apply specified similarity metric:',
        '- Weighted Euclidean distance (convert to similarity)',
        '- Cosine similarity',
        '- Tversky contrast model (feature-based)',
        '- Hybrid geometric-featural similarity',
        'Handle missing feature values',
        'Handle mixed feature types (numeric, categorical)',
        'Normalize similarities to [0, 1] range',
        'Create similarity matrix (instances x prototypes)',
        'Save similarity computations to output directory'
      ],
      outputFormat: 'JSON with similarities (object), similarityMatrix (array), metric (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['similarities', 'similarityMatrix', 'artifacts'],
      properties: {
        similarities: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            additionalProperties: { type: 'number' }
          }
        },
        similarityMatrix: {
          type: 'array',
          items: {
            type: 'array',
            items: { type: 'number' }
          }
        },
        metric: { type: 'string' },
        missingValueHandling: { type: 'string' },
        averageSimilarity: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'prototype-reasoning', 'similarity']
}));

// Task 4: Typicality Scoring
export const typicalityScoringTask = defineTask('typicality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compute typicality scores',
  agent: {
    name: 'typicality-scoring-agent',
    prompt: {
      role: 'typicality assessment specialist',
      task: 'Compute typicality scores reflecting how good an example each instance is',
      context: args,
      instructions: [
        'Typicality = similarity to own category prototype',
        'Consider family resemblance (similarity to all category members)',
        'Account for contrast with other categories',
        'Higher typicality = more representative of category',
        'Identify highly typical instances (potential new prototypes)',
        'Identify atypical instances (borderline cases)',
        'Compute average typicality per category',
        'Save typicality scores to output directory'
      ],
      outputFormat: 'JSON with scores (object), averageTypicality (number), highlyTypical (array), atypical (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['scores', 'averageTypicality', 'artifacts'],
      properties: {
        scores: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              typicality: { type: 'number' },
              category: { type: 'string' },
              rank: { type: 'number' }
            }
          }
        },
        averageTypicality: { type: 'number' },
        highlyTypical: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              instance: { type: 'string' },
              category: { type: 'string' },
              typicality: { type: 'number' }
            }
          }
        },
        atypical: { type: 'array' },
        categoryAverages: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'prototype-reasoning', 'typicality']
}));

// Task 5: Categorization
export const categorizationTask = defineTask('categorization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Categorize instances based on prototype similarity',
  agent: {
    name: 'categorization-agent',
    prompt: {
      role: 'category assignment specialist',
      task: 'Assign instances to categories based on prototype similarity',
      context: args,
      instructions: [
        'Assign each instance to most similar prototype category',
        'Apply typicality threshold for uncertain cases',
        'Handle instances similar to multiple prototypes',
        'Mark uncategorizable instances (below threshold)',
        'Compute categorization confidence',
        'Handle novel instances not fitting any category',
        'Track categorization reasoning',
        'Save categorizations to output directory'
      ],
      outputFormat: 'JSON with categorizations (array), categorizedCount (number), uncategorizedCount (number), ambiguousCases (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['categorizations', 'categorizedCount', 'uncategorizedCount', 'artifacts'],
      properties: {
        categorizations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              instance: { type: 'string' },
              assignedCategory: { type: 'string' },
              similarity: { type: 'number' },
              confidence: { type: 'number' },
              alternativeCategories: { type: 'array' }
            }
          }
        },
        categorizedCount: { type: 'number' },
        uncategorizedCount: { type: 'number' },
        ambiguousCases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              instance: { type: 'string' },
              competingCategories: { type: 'array' }
            }
          }
        },
        categoryDistribution: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'prototype-reasoning', 'categorization']
}));

// Task 6: Graded Membership Analysis
export const gradedMembershipTask = defineTask('graded-membership', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze graded category membership',
  agent: {
    name: 'graded-membership-agent',
    prompt: {
      role: 'graded categorization analyst',
      task: 'Analyze graded membership where category boundaries are fuzzy',
      context: args,
      instructions: [
        'Compute membership degree for each instance in each category',
        'Membership based on similarity to prototype',
        'Allow partial membership in multiple categories',
        'Identify clear members (high membership)',
        'Identify borderline members (medium membership)',
        'Identify non-members (low membership)',
        'Analyze membership gradient structure',
        'Save graded memberships to output directory'
      ],
      outputFormat: 'JSON with memberships (object), clearMembers (object), borderlineMembers (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['memberships', 'artifacts'],
      properties: {
        memberships: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            additionalProperties: { type: 'number' }
          }
        },
        clearMembers: {
          type: 'object',
          additionalProperties: { type: 'array' }
        },
        borderlineMembers: {
          type: 'object',
          additionalProperties: { type: 'array' }
        },
        nonMembers: {
          type: 'object',
          additionalProperties: { type: 'array' }
        },
        membershipDistribution: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'prototype-reasoning', 'membership']
}));

// Task 7: Category Structure Analysis
export const categoryStructureTask = defineTask('category-structure', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze category structure',
  agent: {
    name: 'category-structure-agent',
    prompt: {
      role: 'category theory analyst',
      task: 'Analyze the internal structure of categories',
      context: args,
      instructions: [
        'Identify category coherence (internal similarity)',
        'Identify category distinctiveness (separation from others)',
        'Analyze typicality gradient within categories',
        'Identify subcategories or clusters',
        'Detect overlapping category regions',
        'Assess category naturalness',
        'Identify potential prototype refinements',
        'Save category structure to output directory'
      ],
      outputFormat: 'JSON with structure (object), coherence (object), distinctiveness (object), overlaps (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['structure', 'artifacts'],
      properties: {
        structure: {
          type: 'object',
          properties: {
            categories: { type: 'array' },
            hierarchy: { type: 'object' },
            relationships: { type: 'array' }
          }
        },
        coherence: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        distinctiveness: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        overlaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              categories: { type: 'array' },
              overlapDegree: { type: 'number' }
            }
          }
        },
        subcategories: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'prototype-reasoning', 'structure']
}));

// Task 8: Quality Assessment
export const prototypeQualityTask = defineTask('prototype-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess quality of prototype reasoning',
  agent: {
    name: 'prototype-quality-agent',
    prompt: {
      role: 'prototype methodology reviewer',
      task: 'Assess quality and validity of prototype-based reasoning',
      context: args,
      instructions: [
        'Evaluate prototype representation quality (weight: 25%)',
        'Assess similarity computation appropriateness (weight: 25%)',
        'Check typicality scoring validity (weight: 20%)',
        'Evaluate categorization quality (weight: 20%)',
        'Assess overall reasoning coherence (weight: 10%)',
        'Verify prototype coverage of category',
        'Check for similarity metric appropriateness',
        'Calculate weighted overall quality score (0-100)',
        'Save quality assessment to output directory'
      ],
      outputFormat: 'JSON with overallScore (number), componentScores (object), issues (array), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            prototypeRepresentation: { type: 'number' },
            similarityComputation: { type: 'number' },
            typicalityScoring: { type: 'number' },
            categorization: { type: 'number' },
            overallCoherence: { type: 'number' }
          }
        },
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
  labels: ['agent', 'scientific-discovery', 'prototype-reasoning', 'quality']
}));

// Task 9: Report Generation
export const prototypeReportTask = defineTask('prototype-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate prototype reasoning report',
  agent: {
    name: 'prototype-report-agent',
    prompt: {
      role: 'scientific report writer',
      task: 'Generate comprehensive report on prototype-based reasoning',
      context: args,
      instructions: [
        'Create executive summary of categorization results',
        'Document prototype representations',
        'Present feature weights and rationale',
        'Show similarity computations',
        'Present typicality scores and rankings',
        'Document categorization decisions',
        'Analyze graded membership patterns',
        'Describe category structure',
        'Include visualizations (similarity space, typicality gradients)',
        'List assumptions and limitations',
        'Save report to output directory'
      ],
      outputFormat: 'JSON with reportPath (string), executiveSummary (string), keyFindings (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'keyFindings', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        visualizations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'prototype-reasoning', 'reporting']
}));
