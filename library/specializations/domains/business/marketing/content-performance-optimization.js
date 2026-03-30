/**
 * @process marketing/content-performance-optimization
 * @description Analyze content engagement metrics, refresh underperforming content, update evergreen pieces, and implement content scoring for continuous improvement.
 * @inputs { contentInventory: array, performanceData: object, benchmarks: object, seoMetrics: object, conversionData: object }
 * @outputs { success: boolean, performanceAnalysis: object, refreshList: array, optimizationPlan: object, contentScores: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    contentInventory = [],
    performanceData = {},
    benchmarks = {},
    seoMetrics = {},
    conversionData = {},
    outputDir = 'content-optimization-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Content Performance Optimization');

  // ============================================================================
  // PHASE 1: PERFORMANCE DATA COLLECTION
  // ============================================================================

  ctx.log('info', 'Phase 1: Collecting content performance data');
  const dataCollection = await ctx.task(performanceDataCollectionTask, {
    contentInventory,
    performanceData,
    seoMetrics,
    conversionData,
    outputDir
  });

  artifacts.push(...dataCollection.artifacts);

  // ============================================================================
  // PHASE 2: CONTENT SCORING MODEL
  // ============================================================================

  ctx.log('info', 'Phase 2: Implementing content scoring model');
  const contentScoring = await ctx.task(contentScoringModelTask, {
    contentInventory,
    dataCollection,
    benchmarks,
    outputDir
  });

  artifacts.push(...contentScoring.artifacts);

  // ============================================================================
  // PHASE 3: ENGAGEMENT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing engagement metrics');
  const engagementAnalysis = await ctx.task(engagementAnalysisTask, {
    dataCollection,
    contentScoring,
    benchmarks,
    outputDir
  });

  artifacts.push(...engagementAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: SEO PERFORMANCE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing SEO performance');
  const seoAnalysis = await ctx.task(seoPerformanceAnalysisTask, {
    contentInventory,
    seoMetrics,
    dataCollection,
    outputDir
  });

  artifacts.push(...seoAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: CONVERSION ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing conversion performance');
  const conversionAnalysis = await ctx.task(conversionAnalysisTask, {
    contentInventory,
    conversionData,
    dataCollection,
    outputDir
  });

  artifacts.push(...conversionAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: UNDERPERFORMER IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Identifying underperforming content');
  const underperformerAnalysis = await ctx.task(underperformerIdentificationTask, {
    contentScoring,
    engagementAnalysis,
    seoAnalysis,
    conversionAnalysis,
    benchmarks,
    outputDir
  });

  artifacts.push(...underperformerAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: EVERGREEN CONTENT AUDIT
  // ============================================================================

  ctx.log('info', 'Phase 7: Auditing evergreen content');
  const evergreenAudit = await ctx.task(evergreenContentAuditTask, {
    contentInventory,
    contentScoring,
    seoAnalysis,
    outputDir
  });

  artifacts.push(...evergreenAudit.artifacts);

  // ============================================================================
  // PHASE 8: REFRESH PRIORITIZATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Prioritizing content for refresh');
  const refreshPrioritization = await ctx.task(refreshPrioritizationTask, {
    underperformerAnalysis,
    evergreenAudit,
    contentScoring,
    seoAnalysis,
    outputDir
  });

  artifacts.push(...refreshPrioritization.artifacts);

  // ============================================================================
  // PHASE 9: OPTIMIZATION RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 9: Developing optimization recommendations');
  const optimizationRecommendations = await ctx.task(optimizationRecommendationsTask, {
    underperformerAnalysis,
    evergreenAudit,
    refreshPrioritization,
    seoAnalysis,
    conversionAnalysis,
    outputDir
  });

  artifacts.push(...optimizationRecommendations.artifacts);

  // ============================================================================
  // PHASE 10: OPTIMIZATION QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 10: Assessing optimization quality');
  const qualityAssessment = await ctx.task(optimizationQualityAssessmentTask, {
    dataCollection,
    contentScoring,
    engagementAnalysis,
    seoAnalysis,
    conversionAnalysis,
    refreshPrioritization,
    optimizationRecommendations,
    outputDir
  });

  artifacts.push(...qualityAssessment.artifacts);

  const optimizationScore = qualityAssessment.overallScore;
  const qualityMet = optimizationScore >= 80;

  // Breakpoint: Review optimization plan
  await ctx.breakpoint({
    question: `Content optimization complete. Quality score: ${optimizationScore}/100. ${qualityMet ? 'Plan meets quality standards!' : 'Plan may need refinement.'} Review and approve?`,
    title: 'Content Optimization Review & Approval',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        optimizationScore,
        qualityMet,
        totalArtifacts: artifacts.length,
        contentAnalyzed: contentInventory.length,
        underperformers: underperformerAnalysis.underperformers?.length || 0,
        refreshCandidates: refreshPrioritization.prioritizedList?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    optimizationScore,
    qualityMet,
    performanceAnalysis: {
      engagement: engagementAnalysis.summary,
      seo: seoAnalysis.summary,
      conversion: conversionAnalysis.summary
    },
    refreshList: refreshPrioritization.prioritizedList,
    optimizationPlan: {
      recommendations: optimizationRecommendations.recommendations,
      quickWins: optimizationRecommendations.quickWins,
      timeline: optimizationRecommendations.timeline
    },
    contentScores: {
      model: contentScoring.model,
      scores: contentScoring.scores,
      distribution: contentScoring.distribution
    },
    underperformers: underperformerAnalysis.underperformers,
    evergreenAudit: evergreenAudit.audit,
    artifacts,
    duration,
    metadata: {
      processId: 'marketing/content-performance-optimization',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Performance Data Collection
export const performanceDataCollectionTask = defineTask('performance-data-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Collect content performance data',
  agent: {
    name: 'data-collector',
    prompt: {
      role: 'marketing analytics specialist',
      task: 'Collect and consolidate content performance data from all sources',
      context: args,
      instructions: [
        'Aggregate traffic data for all content',
        'Collect engagement metrics (time on page, scroll depth)',
        'Gather social sharing data',
        'Collect SEO ranking data',
        'Aggregate conversion data by content',
        'Collect backlink data',
        'Gather content age and update history',
        'Validate data quality',
        'Generate data collection report'
      ],
      outputFormat: 'JSON with data (object), metrics (object), dataQuality (object), sources (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['data', 'metrics', 'dataQuality', 'artifacts'],
      properties: {
        data: { type: 'object' },
        metrics: {
          type: 'object',
          properties: {
            traffic: { type: 'object' },
            engagement: { type: 'object' },
            social: { type: 'object' },
            conversions: { type: 'object' }
          }
        },
        dataQuality: {
          type: 'object',
          properties: {
            completeness: { type: 'number' },
            accuracy: { type: 'string' }
          }
        },
        sources: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'content-optimization', 'data-collection']
}));

// Task 2: Content Scoring Model
export const contentScoringModelTask = defineTask('content-scoring-model', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement content scoring model',
  agent: {
    name: 'scoring-analyst',
    prompt: {
      role: 'content analytics strategist',
      task: 'Develop and apply content scoring model',
      context: args,
      instructions: [
        'Define scoring dimensions (traffic, engagement, SEO, conversion)',
        'Weight dimensions based on business goals',
        'Normalize metrics for fair comparison',
        'Calculate composite score for each piece',
        'Create score distribution analysis',
        'Define score thresholds and categories',
        'Identify scoring anomalies',
        'Document scoring methodology',
        'Generate content scorecard'
      ],
      outputFormat: 'JSON with model (object), scores (array), distribution (object), methodology (object), thresholds (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['model', 'scores', 'distribution', 'artifacts'],
      properties: {
        model: {
          type: 'object',
          properties: {
            dimensions: { type: 'array' },
            weights: { type: 'object' }
          }
        },
        scores: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              content: { type: 'string' },
              score: { type: 'number' },
              category: { type: 'string' }
            }
          }
        },
        distribution: {
          type: 'object',
          properties: {
            high: { type: 'number' },
            medium: { type: 'number' },
            low: { type: 'number' }
          }
        },
        methodology: { type: 'object' },
        thresholds: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'content-optimization', 'scoring']
}));

// Task 3: Engagement Analysis
export const engagementAnalysisTask = defineTask('engagement-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze engagement metrics',
  agent: {
    name: 'engagement-analyst',
    prompt: {
      role: 'user engagement analyst',
      task: 'Analyze content engagement patterns and metrics',
      context: args,
      instructions: [
        'Analyze time on page patterns',
        'Assess scroll depth metrics',
        'Review bounce rate by content',
        'Analyze social engagement',
        'Review comment and interaction data',
        'Identify high-engagement content',
        'Identify low-engagement content',
        'Analyze engagement by content type',
        'Generate engagement analysis report'
      ],
      outputFormat: 'JSON with summary (object), highEngagement (array), lowEngagement (array), patterns (object), byType (object), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'highEngagement', 'lowEngagement', 'artifacts'],
      properties: {
        summary: {
          type: 'object',
          properties: {
            averageTimeOnPage: { type: 'string' },
            averageBounceRate: { type: 'number' },
            socialShares: { type: 'number' }
          }
        },
        highEngagement: { type: 'array' },
        lowEngagement: { type: 'array' },
        patterns: { type: 'object' },
        byType: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'content-optimization', 'engagement']
}));

// Task 4: SEO Performance Analysis
export const seoPerformanceAnalysisTask = defineTask('seo-performance-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze SEO performance',
  agent: {
    name: 'seo-analyst',
    prompt: {
      role: 'SEO performance analyst',
      task: 'Analyze content SEO performance and rankings',
      context: args,
      instructions: [
        'Analyze keyword rankings by content',
        'Review organic traffic trends',
        'Assess ranking position changes',
        'Identify keyword cannibalization',
        'Review backlink profile by content',
        'Analyze featured snippet opportunities',
        'Identify declining content',
        'Assess technical SEO issues',
        'Generate SEO analysis report'
      ],
      outputFormat: 'JSON with summary (object), rankings (array), declining (array), opportunities (array), cannibalization (array), technicalIssues (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'rankings', 'declining', 'artifacts'],
      properties: {
        summary: {
          type: 'object',
          properties: {
            totalKeywords: { type: 'number' },
            top10Keywords: { type: 'number' },
            organicTraffic: { type: 'number' }
          }
        },
        rankings: { type: 'array' },
        declining: { type: 'array' },
        opportunities: { type: 'array' },
        cannibalization: { type: 'array' },
        technicalIssues: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'content-optimization', 'seo-analysis']
}));

// Task 5: Conversion Analysis
export const conversionAnalysisTask = defineTask('conversion-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze conversion performance',
  agent: {
    name: 'conversion-analyst',
    prompt: {
      role: 'conversion optimization specialist',
      task: 'Analyze content conversion performance',
      context: args,
      instructions: [
        'Calculate conversion rate by content',
        'Identify high-converting content',
        'Identify low-converting content',
        'Analyze conversion by content type',
        'Review assisted conversions',
        'Analyze conversion paths',
        'Identify CTA performance',
        'Calculate content ROI',
        'Generate conversion analysis report'
      ],
      outputFormat: 'JSON with summary (object), highConverting (array), lowConverting (array), byType (object), ctaPerformance (object), roi (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'highConverting', 'lowConverting', 'artifacts'],
      properties: {
        summary: {
          type: 'object',
          properties: {
            averageConversionRate: { type: 'number' },
            totalConversions: { type: 'number' },
            conversionValue: { type: 'number' }
          }
        },
        highConverting: { type: 'array' },
        lowConverting: { type: 'array' },
        byType: { type: 'object' },
        ctaPerformance: { type: 'object' },
        roi: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'content-optimization', 'conversion']
}));

// Task 6: Underperformer Identification
export const underperformerIdentificationTask = defineTask('underperformer-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify underperforming content',
  agent: {
    name: 'performance-analyst',
    prompt: {
      role: 'content performance specialist',
      task: 'Identify and categorize underperforming content',
      context: args,
      instructions: [
        'Define underperformance criteria',
        'Identify content below benchmarks',
        'Categorize underperformance reasons',
        'Assess refresh vs retire decision',
        'Identify quick fix opportunities',
        'Analyze underperformance patterns',
        'Calculate improvement potential',
        'Prioritize underperformers',
        'Generate underperformer report'
      ],
      outputFormat: 'JSON with underperformers (array), criteria (object), categories (object), refreshCandidates (array), retireCandidates (array), patterns (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['underperformers', 'criteria', 'artifacts'],
      properties: {
        underperformers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              content: { type: 'string' },
              score: { type: 'number' },
              reason: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        criteria: { type: 'object' },
        categories: { type: 'object' },
        refreshCandidates: { type: 'array' },
        retireCandidates: { type: 'array' },
        patterns: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'content-optimization', 'underperformers']
}));

// Task 7: Evergreen Content Audit
export const evergreenContentAuditTask = defineTask('evergreen-content-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Audit evergreen content',
  agent: {
    name: 'evergreen-auditor',
    prompt: {
      role: 'content lifecycle specialist',
      task: 'Audit evergreen content for update opportunities',
      context: args,
      instructions: [
        'Identify evergreen content in inventory',
        'Assess content freshness and accuracy',
        'Check for outdated statistics',
        'Review for broken links',
        'Assess competitive positioning changes',
        'Identify expansion opportunities',
        'Check for visual refresh needs',
        'Prioritize update queue',
        'Generate evergreen audit report'
      ],
      outputFormat: 'JSON with audit (object), evergreenContent (array), updateNeeds (array), expansionOpportunities (array), refreshPriority (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['audit', 'evergreenContent', 'updateNeeds', 'artifacts'],
      properties: {
        audit: {
          type: 'object',
          properties: {
            totalEvergreen: { type: 'number' },
            needsUpdate: { type: 'number' },
            upToDate: { type: 'number' }
          }
        },
        evergreenContent: { type: 'array' },
        updateNeeds: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              content: { type: 'string' },
              issues: { type: 'array', items: { type: 'string' } },
              priority: { type: 'string' }
            }
          }
        },
        expansionOpportunities: { type: 'array' },
        refreshPriority: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'content-optimization', 'evergreen']
}));

// Task 8: Refresh Prioritization
export const refreshPrioritizationTask = defineTask('refresh-prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prioritize content for refresh',
  agent: {
    name: 'prioritization-specialist',
    prompt: {
      role: 'content operations strategist',
      task: 'Prioritize content refresh queue based on impact and effort',
      context: args,
      instructions: [
        'Score content by improvement potential',
        'Estimate refresh effort for each piece',
        'Calculate ROI of refresh',
        'Apply prioritization matrix',
        'Create tiered refresh queue',
        'Identify quick wins',
        'Plan resource allocation',
        'Set refresh timeline',
        'Generate prioritization document'
      ],
      outputFormat: 'JSON with prioritizedList (array), matrix (object), quickWins (array), timeline (object), resourcePlan (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['prioritizedList', 'matrix', 'quickWins', 'artifacts'],
      properties: {
        prioritizedList: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              content: { type: 'string' },
              priority: { type: 'number' },
              potentialImpact: { type: 'string' },
              effort: { type: 'string' },
              timeline: { type: 'string' }
            }
          }
        },
        matrix: { type: 'object' },
        quickWins: { type: 'array' },
        timeline: { type: 'object' },
        resourcePlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'content-optimization', 'prioritization']
}));

// Task 9: Optimization Recommendations
export const optimizationRecommendationsTask = defineTask('optimization-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop optimization recommendations',
  agent: {
    name: 'optimization-strategist',
    prompt: {
      role: 'content optimization director',
      task: 'Develop actionable optimization recommendations',
      context: args,
      instructions: [
        'Create specific recommendations per content',
        'Define SEO optimization actions',
        'Recommend engagement improvements',
        'Define conversion optimization actions',
        'Create content consolidation recommendations',
        'Plan content retirement',
        'Identify quick wins',
        'Create implementation timeline',
        'Generate optimization plan document'
      ],
      outputFormat: 'JSON with recommendations (array), quickWins (array), timeline (object), seoActions (array), engagementActions (array), conversionActions (array), consolidation (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'quickWins', 'timeline', 'artifacts'],
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              content: { type: 'string' },
              recommendation: { type: 'string' },
              expectedImpact: { type: 'string' },
              effort: { type: 'string' }
            }
          }
        },
        quickWins: { type: 'array', items: { type: 'string' } },
        timeline: {
          type: 'object',
          properties: {
            immediate: { type: 'array' },
            shortTerm: { type: 'array' },
            longTerm: { type: 'array' }
          }
        },
        seoActions: { type: 'array' },
        engagementActions: { type: 'array' },
        conversionActions: { type: 'array' },
        consolidation: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'content-optimization', 'recommendations']
}));

// Task 10: Optimization Quality Assessment
export const optimizationQualityAssessmentTask = defineTask('optimization-quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess optimization quality',
  agent: {
    name: 'optimization-validator',
    prompt: {
      role: 'content optimization director',
      task: 'Assess overall optimization analysis quality',
      context: args,
      instructions: [
        'Evaluate data completeness (weight: 15%)',
        'Assess scoring model validity (weight: 15%)',
        'Review engagement analysis depth (weight: 15%)',
        'Evaluate SEO analysis comprehensiveness (weight: 15%)',
        'Assess conversion analysis quality (weight: 10%)',
        'Review prioritization logic (weight: 15%)',
        'Evaluate recommendations actionability (weight: 15%)',
        'Calculate weighted overall score (0-100)',
        'Identify gaps and recommendations'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), componentScores (object), gaps (array), recommendations (array), strengths (array), readinessLevel (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            dataCompleteness: { type: 'number' },
            scoringModel: { type: 'number' },
            engagementAnalysis: { type: 'number' },
            seoAnalysis: { type: 'number' },
            conversionAnalysis: { type: 'number' },
            prioritizationLogic: { type: 'number' },
            recommendationsQuality: { type: 'number' }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        strengths: { type: 'array', items: { type: 'string' } },
        readinessLevel: { type: 'string', enum: ['ready', 'minor-revisions', 'major-revisions'] },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'content-optimization', 'quality-assessment']
}));
