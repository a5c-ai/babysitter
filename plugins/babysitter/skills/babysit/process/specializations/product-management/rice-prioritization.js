/**
 * @process product-management/rice-prioritization
 * @description RICE Prioritization Framework - Structured process for prioritizing features and initiatives
 * using Reach, Impact, Confidence, and Effort scoring to calculate data-driven priority scores and create
 * strategic roadmaps aligned with business goals
 * @inputs { productName: string, features?: array, timeframe?: string, strategicGoals?: array, stakeholders?: array }
 * @outputs { success: boolean, prioritizedBacklog: object, riceScores: array, roadmap: object, stakeholderReport: object }
 *
 * @example
 * const result = await orchestrate('product-management/rice-prioritization', {
 *   productName: 'Customer Portal',
 *   features: [
 *     { id: 'FEAT-001', name: 'Self-service password reset', description: '...' },
 *     { id: 'FEAT-002', name: 'Invoice download', description: '...' }
 *   ],
 *   timeframe: 'Q2 2026',
 *   strategicGoals: ['Reduce support tickets', 'Increase customer satisfaction'],
 *   stakeholders: ['Product Manager', 'Engineering Lead', 'Customer Success']
 * });
 *
 * @references
 * - RICE Framework by Intercom: https://www.intercom.com/blog/rice-simple-prioritization-for-product-managers/
 * - Product Roadmapping Best Practices: https://www.productplan.com/learn/product-roadmap-best-practices/
 * - Prioritization Frameworks Guide: https://www.mindtheproduct.com/prioritization-frameworks/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    productName,
    features = [],
    timeframe = 'Next Quarter',
    strategicGoals = [],
    stakeholders = [],
    minimumConfidence = 50,
    outputDir = 'rice-prioritization-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting RICE Prioritization for ${productName}`);

  // ============================================================================
  // PHASE 1: FEATURE COLLECTION AND PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Collecting and preparing features for prioritization');
  const featureCollection = await ctx.task(featureCollectionTask, {
    productName,
    initialFeatures: features,
    timeframe,
    strategicGoals,
    outputDir
  });

  artifacts.push(...featureCollection.artifacts);

  // Quality Gate: Must have at least 3 features to prioritize
  if (featureCollection.features.length < 3) {
    return {
      success: false,
      error: `Insufficient features for prioritization. Found: ${featureCollection.features.length}, minimum: 3`,
      phase: 'feature-collection',
      recommendation: 'Add more features to the backlog before prioritization'
    };
  }

  // ============================================================================
  // PHASE 2: STRATEGIC ALIGNMENT ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Assessing strategic alignment of features');
  const strategicAlignment = await ctx.task(strategicAlignmentTask, {
    productName,
    features: featureCollection.features,
    strategicGoals,
    timeframe,
    outputDir
  });

  artifacts.push(...strategicAlignment.artifacts);

  // Breakpoint: Review strategic alignment before scoring
  await ctx.breakpoint({
    question: `Strategic alignment complete for ${productName}. ${featureCollection.features.length} features assessed against ${strategicGoals.length} strategic goals. Review alignment before RICE scoring?`,
    title: 'Strategic Alignment Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        productName,
        featureCount: featureCollection.features.length,
        strategicGoalCount: strategicGoals.length,
        highAlignmentFeatures: strategicAlignment.highAlignmentCount || 0,
        timeframe
      }
    }
  });

  // ============================================================================
  // PHASE 3: REACH ESTIMATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Estimating reach for each feature');
  const reachEstimation = await ctx.task(reachEstimationTask, {
    productName,
    features: featureCollection.features,
    strategicAlignment,
    timeframe,
    outputDir
  });

  artifacts.push(...reachEstimation.artifacts);

  // ============================================================================
  // PHASE 4: IMPACT SCORING
  // ============================================================================

  ctx.log('info', 'Phase 4: Scoring impact for each feature');
  const impactScoring = await ctx.task(impactScoringTask, {
    productName,
    features: featureCollection.features,
    strategicAlignment,
    reachEstimation,
    strategicGoals,
    outputDir
  });

  artifacts.push(...impactScoring.artifacts);

  // ============================================================================
  // PHASE 5: CONFIDENCE ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Assessing confidence levels for estimates');
  const confidenceAssessment = await ctx.task(confidenceAssessmentTask, {
    productName,
    features: featureCollection.features,
    reachEstimation,
    impactScoring,
    strategicAlignment,
    outputDir
  });

  artifacts.push(...confidenceAssessment.artifacts);

  // Quality Gate: Flag features with low confidence
  const lowConfidenceFeatures = confidenceAssessment.confidenceScores.filter(
    f => f.confidencePercent < minimumConfidence
  );

  if (lowConfidenceFeatures.length > 0) {
    await ctx.breakpoint({
      question: `${lowConfidenceFeatures.length} features have confidence below ${minimumConfidence}%. These may need additional research. Continue with prioritization or refine estimates?`,
      title: 'Low Confidence Warning',
      context: {
        runId: ctx.runId,
        productName,
        lowConfidenceFeatures: lowConfidenceFeatures.map(f => ({
          id: f.featureId,
          name: f.featureName,
          confidence: f.confidencePercent
        })),
        recommendation: 'Consider gathering more data for low-confidence features'
      }
    });
  }

  // ============================================================================
  // PHASE 6: EFFORT ESTIMATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Estimating effort for each feature');
  const effortEstimation = await ctx.task(effortEstimationTask, {
    productName,
    features: featureCollection.features,
    strategicAlignment,
    confidenceAssessment,
    outputDir
  });

  artifacts.push(...effortEstimation.artifacts);

  // ============================================================================
  // PHASE 7: RICE SCORE CALCULATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Calculating RICE scores');
  const riceCalculation = await ctx.task(riceCalculationTask, {
    productName,
    features: featureCollection.features,
    reachEstimation,
    impactScoring,
    confidenceAssessment,
    effortEstimation,
    outputDir
  });

  artifacts.push(...riceCalculation.artifacts);

  // ============================================================================
  // PHASE 8: RANKING AND ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 8: Ranking features and analyzing results');
  const rankingAnalysis = await ctx.task(rankingAnalysisTask, {
    productName,
    riceCalculation,
    strategicAlignment,
    timeframe,
    outputDir
  });

  artifacts.push(...rankingAnalysis.artifacts);

  // Breakpoint: Review RICE scores and rankings
  await ctx.breakpoint({
    question: `RICE scoring complete for ${productName}. ${rankingAnalysis.rankedFeatures.length} features ranked. Top priority: ${rankingAnalysis.topFeature.name} (RICE: ${rankingAnalysis.topFeature.riceScore.toFixed(2)}). Review rankings?`,
    title: 'RICE Scores Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        productName,
        totalFeatures: rankingAnalysis.rankedFeatures.length,
        topFeature: rankingAnalysis.topFeature.name,
        topRiceScore: rankingAnalysis.topFeature.riceScore,
        averageRiceScore: rankingAnalysis.averageRiceScore,
        timeframe
      }
    }
  });

  // ============================================================================
  // PHASE 9: STRATEGIC FILTERING
  // ============================================================================

  ctx.log('info', 'Phase 9: Applying strategic filters and constraints');
  const strategicFiltering = await ctx.task(strategicFilteringTask, {
    productName,
    rankingAnalysis,
    strategicGoals,
    strategicAlignment,
    confidenceAssessment,
    minimumConfidence,
    outputDir
  });

  artifacts.push(...strategicFiltering.artifacts);

  // ============================================================================
  // PHASE 10: DEPENDENCY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 10: Analyzing feature dependencies');
  const dependencyAnalysis = await ctx.task(dependencyAnalysisTask, {
    productName,
    strategicFiltering,
    features: featureCollection.features,
    outputDir
  });

  artifacts.push(...dependencyAnalysis.artifacts);

  // ============================================================================
  // PHASE 11: ROADMAP CREATION
  // ============================================================================

  ctx.log('info', 'Phase 11: Creating prioritized roadmap');
  const roadmapCreation = await ctx.task(roadmapCreationTask, {
    productName,
    strategicFiltering,
    dependencyAnalysis,
    timeframe,
    effortEstimation,
    outputDir
  });

  artifacts.push(...roadmapCreation.artifacts);

  // ============================================================================
  // PHASE 12: SENSITIVITY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 12: Performing sensitivity analysis on rankings');
  const sensitivityAnalysis = await ctx.task(sensitivityAnalysisTask, {
    productName,
    riceCalculation,
    rankingAnalysis,
    roadmapCreation,
    outputDir
  });

  artifacts.push(...sensitivityAnalysis.artifacts);

  // ============================================================================
  // PHASE 13: STAKEHOLDER COMMUNICATION PACKAGE
  // ============================================================================

  ctx.log('info', 'Phase 13: Creating stakeholder communication package');
  const stakeholderCommunication = await ctx.task(stakeholderCommunicationTask, {
    productName,
    strategicAlignment,
    rankingAnalysis,
    roadmapCreation,
    sensitivityAnalysis,
    stakeholders,
    timeframe,
    outputDir
  });

  artifacts.push(...stakeholderCommunication.artifacts);

  // ============================================================================
  // PHASE 14: PRIORITIZATION QUALITY VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 14: Validating prioritization quality');
  const qualityValidation = await ctx.task(qualityValidationTask, {
    productName,
    featureCollection,
    riceCalculation,
    rankingAnalysis,
    strategicFiltering,
    confidenceAssessment,
    minimumConfidence,
    outputDir
  });

  artifacts.push(...qualityValidation.artifacts);

  const prioritizationScore = qualityValidation.overallScore;
  const qualityMet = prioritizationScore >= 80;

  // Final Breakpoint: Approve prioritization
  await ctx.breakpoint({
    question: `RICE Prioritization complete for ${productName}. Quality score: ${prioritizationScore}/100. ${qualityMet ? 'Prioritization meets quality standards!' : 'Prioritization may need refinement.'} Approve and communicate results?`,
    title: 'Final Prioritization Approval',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        productName,
        prioritizationScore,
        qualityMet,
        totalFeatures: rankingAnalysis.rankedFeatures.length,
        topFeature: rankingAnalysis.topFeature.name,
        roadmapPhases: roadmapCreation.phases.length,
        stakeholderCount: stakeholders.length,
        duration: ctx.now() - startTime
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    productName,
    timeframe,
    prioritizationScore,
    qualityMet,
    featureCollection: {
      totalFeatures: featureCollection.features.length,
      collectionCompleteness: featureCollection.completeness
    },
    strategicAlignment: {
      strategicGoals: strategicGoals.length,
      highAlignmentFeatures: strategicAlignment.highAlignmentCount,
      alignmentScore: strategicAlignment.averageAlignmentScore
    },
    riceScores: {
      rankedFeatures: rankingAnalysis.rankedFeatures.map(f => ({
        rank: f.rank,
        id: f.featureId,
        name: f.featureName,
        riceScore: f.riceScore,
        reach: f.reach,
        impact: f.impact,
        confidence: f.confidence,
        effort: f.effort
      })),
      topFeature: {
        id: rankingAnalysis.topFeature.featureId,
        name: rankingAnalysis.topFeature.name,
        riceScore: rankingAnalysis.topFeature.riceScore
      },
      averageRiceScore: rankingAnalysis.averageRiceScore,
      scoreDistribution: rankingAnalysis.scoreDistribution
    },
    prioritizedBacklog: {
      highPriority: strategicFiltering.highPriorityFeatures.length,
      mediumPriority: strategicFiltering.mediumPriorityFeatures.length,
      lowPriority: strategicFiltering.lowPriorityFeatures.length,
      deferred: strategicFiltering.deferredFeatures.length
    },
    roadmap: {
      phases: roadmapCreation.phases,
      estimatedDuration: roadmapCreation.estimatedDuration,
      capacity: roadmapCreation.capacity,
      milestones: roadmapCreation.milestones
    },
    sensitivityAnalysis: {
      stable: sensitivityAnalysis.rankingStability,
      criticalFactors: sensitivityAnalysis.criticalFactors,
      riskFeatures: sensitivityAnalysis.riskFeatures
    },
    stakeholderReport: {
      executiveSummary: stakeholderCommunication.executiveSummary,
      keyInsights: stakeholderCommunication.keyInsights,
      recommendations: stakeholderCommunication.recommendations,
      presentationPath: stakeholderCommunication.presentationPath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'product-management/rice-prioritization',
      timestamp: startTime,
      productName,
      timeframe,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Feature Collection
export const featureCollectionTask = defineTask('feature-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Collect and prepare features for prioritization',
  agent: {
    name: 'product-manager',
    prompt: {
      role: 'senior product manager with expertise in backlog management and feature planning',
      task: 'Collect, validate, and prepare features for RICE prioritization',
      context: args,
      instructions: [
        'Review initial feature list provided',
        'Validate each feature has clear description, value proposition, and acceptance criteria',
        'Identify missing features by analyzing strategic goals and market needs',
        'Categorize features by type (new capability, enhancement, technical debt, bug fix)',
        'Ensure features are sized appropriately (not too large, not too small)',
        'Break down epics into smaller features if needed',
        'Tag features with relevant categories (user experience, performance, security, etc.)',
        'Document assumptions and dependencies for each feature',
        'Assess feature completeness score (0-100)',
        'Generate comprehensive feature catalog ready for RICE scoring'
      ],
      outputFormat: 'JSON with features (array), completeness (0-100), featuresByCategory (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['features', 'completeness', 'artifacts'],
      properties: {
        features: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              valueProposition: { type: 'string' },
              type: { type: 'string', enum: ['new-capability', 'enhancement', 'technical-debt', 'bug-fix', 'research'] },
              categories: { type: 'array', items: { type: 'string' } },
              assumptions: { type: 'array', items: { type: 'string' } },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        completeness: { type: 'number', minimum: 0, maximum: 100 },
        featuresByCategory: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        featuresByType: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'rice-prioritization', 'feature-collection']
}));

// Task 2: Strategic Alignment
export const strategicAlignmentTask = defineTask('strategic-alignment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess strategic alignment of features',
  agent: {
    name: 'strategy-analyst',
    prompt: {
      role: 'product strategy analyst specializing in strategic alignment and goal mapping',
      task: 'Assess how well each feature aligns with strategic goals and business objectives',
      context: args,
      instructions: [
        'Review strategic goals and business objectives',
        'For each feature, identify which strategic goals it supports',
        'Score alignment strength (0-10) for each feature-goal pairing',
        'Calculate overall strategic alignment score per feature',
        'Identify must-have features that are critical for strategic goals',
        'Flag features with weak strategic alignment',
        'Document strategic rationale for each feature',
        'Create strategic alignment matrix (features vs goals)',
        'Identify goal gaps (goals with no supporting features)',
        'Generate strategic alignment report'
      ],
      outputFormat: 'JSON with alignmentScores (array), highAlignmentCount (number), strategicRationale (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['alignmentScores', 'averageAlignmentScore', 'artifacts'],
      properties: {
        alignmentScores: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              featureId: { type: 'string' },
              featureName: { type: 'string' },
              alignmentScore: { type: 'number', minimum: 0, maximum: 10 },
              supportedGoals: { type: 'array', items: { type: 'string' } },
              strategicRationale: { type: 'string' },
              criticalToStrategy: { type: 'boolean' }
            }
          }
        },
        highAlignmentCount: { type: 'number' },
        mediumAlignmentCount: { type: 'number' },
        lowAlignmentCount: { type: 'number' },
        averageAlignmentScore: { type: 'number' },
        alignmentMatrix: { type: 'object' },
        goalGaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              goal: { type: 'string' },
              supportingFeatures: { type: 'number' },
              recommendation: { type: 'string' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'rice-prioritization', 'strategic-alignment']
}));

// Task 3: Reach Estimation
export const reachEstimationTask = defineTask('reach-estimation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Estimate reach for each feature',
  agent: {
    name: 'data-analyst',
    prompt: {
      role: 'product data analyst specializing in user impact estimation and metrics',
      task: 'Estimate how many users/customers will be reached by each feature within the timeframe',
      context: args,
      instructions: [
        'Define reach metric (users per month, customers per quarter, transactions per year)',
        'For each feature, estimate number of users/customers affected in the timeframe',
        'Use data sources: user analytics, customer segmentation, usage patterns, market research',
        'Consider feature scope: all users, specific segment, power users only',
        'Account for adoption curve (not 100% immediate adoption)',
        'Document assumptions behind each reach estimate',
        'Flag estimates with high uncertainty',
        'Compare reach across features to validate relative sizing',
        'Generate reach estimation summary with methodology',
        'Create reach distribution visualization'
      ],
      outputFormat: 'JSON with reachEstimates (array), totalPotentialReach (number), reachMetric (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reachEstimates', 'reachMetric', 'artifacts'],
      properties: {
        reachEstimates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              featureId: { type: 'string' },
              featureName: { type: 'string' },
              reach: { type: 'number' },
              reachSegment: { type: 'string' },
              assumptions: { type: 'array', items: { type: 'string' } },
              dataSource: { type: 'string' },
              uncertainty: { type: 'string', enum: ['low', 'medium', 'high'] }
            }
          }
        },
        reachMetric: { type: 'string' },
        totalPotentialReach: { type: 'number' },
        reachDistribution: {
          type: 'object',
          properties: {
            high: { type: 'number' },
            medium: { type: 'number' },
            low: { type: 'number' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'rice-prioritization', 'reach-estimation']
}));

// Task 4: Impact Scoring
export const impactScoringTask = defineTask('impact-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score impact for each feature',
  agent: {
    name: 'product-strategist',
    prompt: {
      role: 'product strategist specializing in impact assessment and value measurement',
      task: 'Score the impact each feature will have on users using RICE impact scale',
      context: args,
      instructions: [
        'Use RICE impact scoring scale: 3 = massive impact, 2 = high impact, 1 = medium impact, 0.5 = low impact, 0.25 = minimal impact',
        'For each feature, assess impact on key metrics: user satisfaction, revenue, efficiency, strategic goals',
        'Consider impact dimensions: magnitude of benefit, frequency of benefit, breadth of benefit',
        'Massive impact (3): transformative change, major pain point solved, significant competitive advantage',
        'High impact (2): substantial improvement, important problem solved, clear competitive benefit',
        'Medium impact (1): noticeable improvement, problem partially solved, incremental advantage',
        'Low impact (0.5): small improvement, minor problem solved, marginal benefit',
        'Minimal impact (0.25): barely noticeable improvement, nice-to-have',
        'Document rationale for each impact score',
        'Validate consistency across features',
        'Generate impact scoring report with justifications'
      ],
      outputFormat: 'JSON with impactScores (array), impactDistribution (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['impactScores', 'artifacts'],
      properties: {
        impactScores: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              featureId: { type: 'string' },
              featureName: { type: 'string' },
              impact: { type: 'number', enum: [0.25, 0.5, 1, 2, 3] },
              impactLabel: { type: 'string', enum: ['minimal', 'low', 'medium', 'high', 'massive'] },
              impactRationale: { type: 'string' },
              impactDimensions: {
                type: 'object',
                properties: {
                  userSatisfaction: { type: 'string' },
                  revenue: { type: 'string' },
                  efficiency: { type: 'string' },
                  strategicValue: { type: 'string' }
                }
              }
            }
          }
        },
        impactDistribution: {
          type: 'object',
          properties: {
            massive: { type: 'number' },
            high: { type: 'number' },
            medium: { type: 'number' },
            low: { type: 'number' },
            minimal: { type: 'number' }
          }
        },
        averageImpact: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'rice-prioritization', 'impact-scoring']
}));

// Task 5: Confidence Assessment
export const confidenceAssessmentTask = defineTask('confidence-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess confidence levels for estimates',
  agent: {
    name: 'estimation-expert',
    prompt: {
      role: 'estimation expert specializing in uncertainty quantification and confidence assessment',
      task: 'Assess confidence level in Reach, Impact, and Effort estimates for each feature',
      context: args,
      instructions: [
        'Use RICE confidence scale: 100% = high confidence (strong data), 80% = medium confidence (some data), 50% = low confidence (assumptions)',
        'For each feature, evaluate data quality supporting reach estimate',
        'Assess certainty around impact assessment',
        'Review basis for strategic alignment scores',
        'High confidence (100%): backed by analytics, user research, proven patterns, similar past features',
        'Medium confidence (80%): some supporting data, reasonable assumptions, partial validation',
        'Low confidence (50%): mostly assumptions, no validation, high uncertainty, new territory',
        'Document evidence supporting confidence level',
        'Identify features requiring additional research',
        'Flag confidence gaps that could affect prioritization',
        'Generate confidence assessment report'
      ],
      outputFormat: 'JSON with confidenceScores (array), lowConfidenceFeatures (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['confidenceScores', 'artifacts'],
      properties: {
        confidenceScores: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              featureId: { type: 'string' },
              featureName: { type: 'string' },
              confidencePercent: { type: 'number', enum: [50, 80, 100] },
              confidenceLevel: { type: 'string', enum: ['low', 'medium', 'high'] },
              confidenceRationale: { type: 'string' },
              evidenceQuality: {
                type: 'object',
                properties: {
                  reachDataQuality: { type: 'string' },
                  impactDataQuality: { type: 'string' },
                  alignmentCertainty: { type: 'string' }
                }
              },
              researchNeeded: { type: 'boolean' },
              researchRecommendations: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        confidenceDistribution: {
          type: 'object',
          properties: {
            high: { type: 'number' },
            medium: { type: 'number' },
            low: { type: 'number' }
          }
        },
        lowConfidenceFeatures: {
          type: 'array',
          items: { type: 'string' }
        },
        averageConfidence: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'rice-prioritization', 'confidence-assessment']
}));

// Task 6: Effort Estimation
export const effortEstimationTask = defineTask('effort-estimation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Estimate effort for each feature',
  agent: {
    name: 'engineering-lead',
    prompt: {
      role: 'engineering lead with expertise in estimation and capacity planning',
      task: 'Estimate development effort for each feature in person-months',
      context: args,
      instructions: [
        'For each feature, estimate effort in person-months (total team time)',
        'Consider all phases: design, development, testing, deployment, documentation',
        'Include effort for: frontend, backend, infrastructure, QA, design, product management',
        'Account for complexity factors: technical complexity, unknowns, dependencies, risk',
        'Use historical data from similar features if available',
        'Apply estimation techniques: planning poker, t-shirt sizing converted to hours',
        'Document effort breakdown by discipline',
        'Include assumptions behind estimates',
        'Flag high-uncertainty estimates',
        'Validate estimates against team capacity',
        'Generate comprehensive effort estimation report'
      ],
      outputFormat: 'JSON with effortEstimates (array), totalEffort (number), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['effortEstimates', 'artifacts'],
      properties: {
        effortEstimates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              featureId: { type: 'string' },
              featureName: { type: 'string' },
              effortPersonMonths: { type: 'number' },
              effortBreakdown: {
                type: 'object',
                properties: {
                  design: { type: 'number' },
                  development: { type: 'number' },
                  testing: { type: 'number' },
                  deployment: { type: 'number' },
                  documentation: { type: 'number' }
                }
              },
              complexityFactors: { type: 'array', items: { type: 'string' } },
              assumptions: { type: 'array', items: { type: 'string' } },
              uncertainty: { type: 'string', enum: ['low', 'medium', 'high'] },
              historicalReference: { type: 'string' }
            }
          }
        },
        totalEffort: { type: 'number' },
        effortDistribution: {
          type: 'object',
          properties: {
            low: { type: 'number' },
            medium: { type: 'number' },
            high: { type: 'number' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'rice-prioritization', 'effort-estimation']
}));

// Task 7: RICE Score Calculation
export const riceCalculationTask = defineTask('rice-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate RICE scores',
  agent: {
    name: 'analytics-specialist',
    prompt: {
      role: 'product analytics specialist with expertise in prioritization scoring',
      task: 'Calculate RICE scores using formula: (Reach × Impact × Confidence) / Effort',
      context: args,
      instructions: [
        'For each feature, gather: Reach (number), Impact (0.25-3), Confidence (0.5-1.0), Effort (person-months)',
        'Convert confidence percentage to decimal: 100% = 1.0, 80% = 0.8, 50% = 0.5',
        'Calculate RICE score: (Reach × Impact × Confidence) / Effort',
        'Validate calculations for accuracy',
        'Document score components for each feature',
        'Identify features with extreme scores (very high or very low)',
        'Calculate score statistics: mean, median, standard deviation',
        'Flag potential scoring anomalies',
        'Generate RICE score calculation report with detailed breakdown',
        'Create score visualization data'
      ],
      outputFormat: 'JSON with riceScores (array), scoreStatistics (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['riceScores', 'artifacts'],
      properties: {
        riceScores: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              featureId: { type: 'string' },
              featureName: { type: 'string' },
              reach: { type: 'number' },
              impact: { type: 'number' },
              confidence: { type: 'number' },
              effort: { type: 'number' },
              riceScore: { type: 'number' },
              scoreComponents: {
                type: 'object',
                properties: {
                  reachImpactProduct: { type: 'number' },
                  adjustedForConfidence: { type: 'number' },
                  finalScore: { type: 'number' }
                }
              }
            }
          }
        },
        scoreStatistics: {
          type: 'object',
          properties: {
            mean: { type: 'number' },
            median: { type: 'number' },
            standardDeviation: { type: 'number' },
            min: { type: 'number' },
            max: { type: 'number' }
          }
        },
        anomalies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              featureId: { type: 'string' },
              anomalyType: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'rice-prioritization', 'score-calculation']
}));

// Task 8: Ranking Analysis
export const rankingAnalysisTask = defineTask('ranking-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Rank features and analyze results',
  agent: {
    name: 'prioritization-analyst',
    prompt: {
      role: 'product prioritization analyst specializing in ranking and portfolio optimization',
      task: 'Rank features by RICE score and analyze prioritization results',
      context: args,
      instructions: [
        'Sort features by RICE score in descending order (highest to lowest)',
        'Assign ranking numbers (1, 2, 3, ...)',
        'Identify natural score tiers (high, medium, low priority)',
        'Analyze score distribution: are scores clustered or spread?',
        'Identify top 10 features by RICE score',
        'Calculate average RICE score',
        'Analyze correlation between strategic alignment and RICE score',
        'Identify surprising rankings (low-effort high-impact, or vice versa)',
        'Document key insights from ranking analysis',
        'Generate ranking report with commentary',
        'Create ranking visualization data'
      ],
      outputFormat: 'JSON with rankedFeatures (array), topFeature (object), averageRiceScore (number), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['rankedFeatures', 'topFeature', 'averageRiceScore', 'artifacts'],
      properties: {
        rankedFeatures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rank: { type: 'number' },
              featureId: { type: 'string' },
              featureName: { type: 'string' },
              riceScore: { type: 'number' },
              reach: { type: 'number' },
              impact: { type: 'number' },
              confidence: { type: 'number' },
              effort: { type: 'number' },
              tier: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        topFeature: {
          type: 'object',
          properties: {
            featureId: { type: 'string' },
            name: { type: 'string' },
            riceScore: { type: 'number' },
            scoreAdvantage: { type: 'number' }
          }
        },
        topTenFeatures: { type: 'array', items: { type: 'string' } },
        averageRiceScore: { type: 'number' },
        scoreDistribution: {
          type: 'object',
          properties: {
            highTier: { type: 'number' },
            mediumTier: { type: 'number' },
            lowTier: { type: 'number' }
          }
        },
        keyInsights: { type: 'array', items: { type: 'string' } },
        surprisingRankings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              featureId: { type: 'string' },
              insight: { type: 'string' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'rice-prioritization', 'ranking']
}));

// Task 9: Strategic Filtering
export const strategicFilteringTask = defineTask('strategic-filtering', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply strategic filters and constraints',
  agent: {
    name: 'product-director',
    prompt: {
      role: 'product director with expertise in strategic portfolio management',
      task: 'Apply strategic filters, business constraints, and portfolio balancing to ranked features',
      context: args,
      instructions: [
        'Review ranked features from RICE scoring',
        'Apply strategic filters: must-have strategically, minimum confidence threshold, effort constraints',
        'Promote must-have strategic features regardless of RICE score',
        'Flag features below confidence threshold for deferral or research',
        'Balance portfolio: mix of quick wins (low effort, high impact) and strategic bets',
        'Apply resource constraints: team capacity, budget limits',
        'Consider dependencies: prerequisite features must come first',
        'Categorize into priority tiers: high (do now), medium (do next), low (backlog), deferred (needs research)',
        'Document rationale for any deviations from pure RICE ranking',
        'Generate strategic filtering report with final prioritized backlog'
      ],
      outputFormat: 'JSON with highPriorityFeatures, mediumPriorityFeatures, lowPriorityFeatures, deferredFeatures, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['highPriorityFeatures', 'mediumPriorityFeatures', 'lowPriorityFeatures', 'artifacts'],
      properties: {
        highPriorityFeatures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              featureId: { type: 'string' },
              featureName: { type: 'string' },
              riceScore: { type: 'number' },
              priorityRationale: { type: 'string' }
            }
          }
        },
        mediumPriorityFeatures: { type: 'array' },
        lowPriorityFeatures: { type: 'array' },
        deferredFeatures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              featureId: { type: 'string' },
              featureName: { type: 'string' },
              deferralReason: { type: 'string' },
              prerequisiteActions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        promotedFeatures: {
          type: 'array',
          description: 'Features promoted above their RICE ranking for strategic reasons',
          items: { type: 'string' }
        },
        portfolioBalance: {
          type: 'object',
          properties: {
            quickWins: { type: 'number' },
            strategicBets: { type: 'number' },
            incrementalImprovements: { type: 'number' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'rice-prioritization', 'strategic-filtering']
}));

// Task 10: Dependency Analysis
export const dependencyAnalysisTask = defineTask('dependency-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze feature dependencies',
  agent: {
    name: 'technical-architect',
    prompt: {
      role: 'technical architect with expertise in dependency management and sequencing',
      task: 'Analyze dependencies between features and determine optimal sequencing',
      context: args,
      instructions: [
        'Review features and their documented dependencies',
        'Identify technical dependencies: feature A requires feature B',
        'Identify business dependencies: feature needs certain conditions or data',
        'Identify resource dependencies: features competing for same resources',
        'Create dependency graph showing relationships',
        'Identify blocking dependencies that affect sequencing',
        'Find circular dependencies and resolve conflicts',
        'Determine prerequisite features that must be built first',
        'Identify features that can be built in parallel',
        'Generate dependency sequencing recommendations',
        'Create dependency visualization'
      ],
      outputFormat: 'JSON with dependencies (array), blockingDependencies, parallelGroups, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['dependencies', 'sequencingRecommendations', 'artifacts'],
      properties: {
        dependencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              featureId: { type: 'string' },
              dependsOn: { type: 'array', items: { type: 'string' } },
              blockedBy: { type: 'array', items: { type: 'string' } },
              dependencyType: { type: 'string', enum: ['technical', 'business', 'resource'] }
            }
          }
        },
        blockingDependencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              blockedBy: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        parallelGroups: {
          type: 'array',
          description: 'Groups of features that can be developed in parallel',
          items: {
            type: 'object',
            properties: {
              groupId: { type: 'string' },
              features: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        prerequisiteFeatures: { type: 'array', items: { type: 'string' } },
        sequencingRecommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sequence: { type: 'number' },
              featureId: { type: 'string' },
              featureName: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'rice-prioritization', 'dependency-analysis']
}));

// Task 11: Roadmap Creation
export const roadmapCreationTask = defineTask('roadmap-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create prioritized roadmap',
  agent: {
    name: 'roadmap-planner',
    prompt: {
      role: 'product roadmap planner specializing in timeline and capacity planning',
      task: 'Create time-phased roadmap with prioritized features sequenced by priority and dependencies',
      context: args,
      instructions: [
        'Define roadmap timeframe and phases (e.g., Q2: Phase 1, 2, 3)',
        'Estimate team capacity per phase (person-months available)',
        'Starting with high-priority features, allocate to phases based on: priority tier, effort estimate, dependencies, capacity constraints',
        'Respect dependency sequencing: prerequisites must be in earlier phases',
        'Balance phases: avoid overloading one phase, maintain steady flow',
        'Identify features that fit vs features deferred to future',
        'Define milestones: key deliverables at phase boundaries',
        'Calculate cumulative effort and validate against capacity',
        'Flag capacity issues and over-allocation',
        'Generate visual roadmap (timeline with features)',
        'Create roadmap document with phase details'
      ],
      outputFormat: 'JSON with phases (array), capacity (object), milestones (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'capacity', 'artifacts'],
      properties: {
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phaseNumber: { type: 'number' },
              phaseName: { type: 'string' },
              startDate: { type: 'string' },
              endDate: { type: 'string' },
              features: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    featureId: { type: 'string' },
                    featureName: { type: 'string' },
                    effort: { type: 'number' },
                    priority: { type: 'string' }
                  }
                }
              },
              totalEffort: { type: 'number' },
              capacityUtilization: { type: 'number' }
            }
          }
        },
        capacity: {
          type: 'object',
          properties: {
            totalCapacity: { type: 'number' },
            allocatedCapacity: { type: 'number' },
            remainingCapacity: { type: 'number' },
            utilizationPercent: { type: 'number' }
          }
        },
        milestones: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              milestoneId: { type: 'string' },
              milestoneName: { type: 'string' },
              targetDate: { type: 'string' },
              deliverables: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        estimatedDuration: { type: 'string' },
        deferredFeatures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              featureId: { type: 'string' },
              reason: { type: 'string' }
            }
          }
        },
        capacityIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              issue: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'rice-prioritization', 'roadmap']
}));

// Task 12: Sensitivity Analysis
export const sensitivityAnalysisTask = defineTask('sensitivity-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform sensitivity analysis',
  agent: {
    name: 'risk-analyst',
    prompt: {
      role: 'quantitative analyst specializing in sensitivity analysis and scenario planning',
      task: 'Test how rankings change under different assumptions and identify critical factors',
      context: args,
      instructions: [
        'Test scenario: increase all Impact scores by 1 level, recalculate rankings',
        'Test scenario: reduce all Confidence to 50%, recalculate rankings',
        'Test scenario: double all Effort estimates, recalculate rankings',
        'Test scenario: increase Reach for top features by 50%',
        'Identify features with stable rankings (same rank across scenarios)',
        'Identify features with volatile rankings (rank changes significantly)',
        'Determine critical factors: which component (R, I, C, E) most affects rankings',
        'Identify risk features: high rank but sensitive to assumption changes',
        'Test strategic overrides: what if strategic alignment weighted 2x',
        'Document ranking stability analysis',
        'Generate sensitivity analysis report with recommendations'
      ],
      outputFormat: 'JSON with scenarios (array), rankingStability (boolean), criticalFactors (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['scenarios', 'rankingStability', 'artifacts'],
      properties: {
        scenarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenarioName: { type: 'string' },
              description: { type: 'string' },
              topFeature: { type: 'string' },
              rankingChanges: { type: 'number' },
              significantChanges: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        rankingStability: { type: 'boolean' },
        stableFeatures: {
          type: 'array',
          description: 'Features with consistent rankings across scenarios',
          items: { type: 'string' }
        },
        volatileFeatures: {
          type: 'array',
          description: 'Features with highly variable rankings',
          items: {
            type: 'object',
            properties: {
              featureId: { type: 'string' },
              rankVariance: { type: 'number' },
              risk: { type: 'string' }
            }
          }
        },
        criticalFactors: {
          type: 'array',
          description: 'RICE components that most affect rankings',
          items: {
            type: 'object',
            properties: {
              factor: { type: 'string', enum: ['reach', 'impact', 'confidence', 'effort'] },
              sensitivity: { type: 'string', enum: ['low', 'medium', 'high'] },
              recommendation: { type: 'string' }
            }
          }
        },
        riskFeatures: {
          type: 'array',
          items: { type: 'string' }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'rice-prioritization', 'sensitivity-analysis']
}));

// Task 13: Stakeholder Communication
export const stakeholderCommunicationTask = defineTask('stakeholder-communication', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create stakeholder communication package',
  agent: {
    name: 'product-communicator',
    prompt: {
      role: 'product communications specialist with expertise in executive communication',
      task: 'Create comprehensive communication package for stakeholders with prioritization results',
      context: args,
      instructions: [
        'Create executive summary: key decisions, top priorities, strategic alignment',
        'Document prioritization methodology: RICE framework explained, scoring criteria, process followed',
        'Present prioritization results: top 10 features, roadmap phases, key milestones',
        'Highlight strategic insights: quick wins, strategic bets, deferred items',
        'Prepare supporting data: RICE score tables, ranking charts, roadmap timeline',
        'Address potential questions: why certain features ranked high/low, what about feature X',
        'Create stakeholder-specific views: executive summary, detailed analysis, technical deep-dive',
        'Prepare presentation deck: slides for stakeholder review meeting',
        'Generate FAQ document: common questions and answers',
        'Create one-pager: single page summary for broad distribution',
        'Generate comprehensive communication package'
      ],
      outputFormat: 'JSON with executiveSummary, keyInsights, recommendations, presentationPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['executiveSummary', 'keyInsights', 'presentationPath', 'artifacts'],
      properties: {
        executiveSummary: { type: 'string' },
        keyInsights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              insight: { type: 'string' },
              category: { type: 'string' },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              rationale: { type: 'string' },
              action: { type: 'string' }
            }
          }
        },
        presentationPath: { type: 'string' },
        faqDocument: { type: 'string' },
        onePager: { type: 'string' },
        stakeholderViews: {
          type: 'object',
          properties: {
            executive: { type: 'string' },
            detailed: { type: 'string' },
            technical: { type: 'string' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'rice-prioritization', 'communication']
}));

// Task 14: Quality Validation
export const qualityValidationTask = defineTask('quality-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate prioritization quality',
  agent: {
    name: 'quality-auditor',
    prompt: {
      role: 'product process auditor and quality assurance specialist',
      task: 'Validate quality and completeness of RICE prioritization process and outputs',
      context: args,
      instructions: [
        'Evaluate feature collection completeness (weight: 10%)',
        'Assess reach estimation quality: data-backed vs assumptions (weight: 15%)',
        'Review impact scoring consistency: appropriate use of scale (weight: 15%)',
        'Validate confidence assessment: realistic confidence levels (weight: 10%)',
        'Check effort estimation quality: detailed and realistic (weight: 15%)',
        'Verify RICE calculation accuracy (weight: 10%)',
        'Assess strategic alignment integration (weight: 15%)',
        'Review roadmap feasibility: capacity constraints respected (weight: 10%)',
        'Calculate weighted overall quality score (0-100)',
        'Identify quality gaps and improvement opportunities',
        'Validate methodology adherence to RICE framework',
        'Generate quality assessment report'
      ],
      outputFormat: 'JSON with overallScore (0-100), componentScores (object), qualityGaps (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            featureCollectionCompleteness: { type: 'number' },
            reachEstimationQuality: { type: 'number' },
            impactScoringConsistency: { type: 'number' },
            confidenceAssessmentRealism: { type: 'number' },
            effortEstimationQuality: { type: 'number' },
            calculationAccuracy: { type: 'number' },
            strategicAlignmentIntegration: { type: 'number' },
            roadmapFeasibility: { type: 'number' }
          }
        },
        qualityGaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gap: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              improvement: { type: 'string' }
            }
          }
        },
        strengths: { type: 'array', items: { type: 'string' } },
        methodologyAdherence: {
          type: 'object',
          properties: {
            followedRICEFramework: { type: 'boolean' },
            usedCorrectScales: { type: 'boolean' },
            documentedAssumptions: { type: 'boolean' },
            stakeholderInvolvement: { type: 'boolean' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'rice-prioritization', 'quality-validation']
}));
