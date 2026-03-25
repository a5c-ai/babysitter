/**
 * @process marketing/content-strategy-development
 * @description Define content pillars, themes, and editorial mission aligned with business objectives and audience needs. Create content matrix mapping content types to funnel stages.
 * @inputs { brandName: string, businessObjectives: object, targetAudience: object, competitors: array, existingContent: object }
 * @outputs { success: boolean, contentStrategy: object, contentPillars: array, contentMatrix: object, editorialMission: string, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    brandName = 'Brand',
    businessObjectives = {},
    targetAudience = {},
    competitors = [],
    existingContent = {},
    outputDir = 'content-strategy-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Content Strategy Development for ${brandName}`);

  // ============================================================================
  // PHASE 1: CONTENT AUDIT
  // ============================================================================

  ctx.log('info', 'Phase 1: Auditing existing content');
  const contentAudit = await ctx.task(contentAuditTask, {
    brandName,
    existingContent,
    businessObjectives,
    outputDir
  });

  artifacts.push(...contentAudit.artifacts);

  // ============================================================================
  // PHASE 2: AUDIENCE CONTENT NEEDS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing audience content needs');
  const audienceAnalysis = await ctx.task(audienceContentNeedsTask, {
    brandName,
    targetAudience,
    contentAudit,
    outputDir
  });

  artifacts.push(...audienceAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: COMPETITIVE CONTENT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing competitor content');
  const competitiveAnalysis = await ctx.task(competitiveContentAnalysisTask, {
    brandName,
    competitors,
    audienceAnalysis,
    outputDir
  });

  artifacts.push(...competitiveAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: EDITORIAL MISSION DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Developing editorial mission');
  const editorialMission = await ctx.task(editorialMissionTask, {
    brandName,
    businessObjectives,
    audienceAnalysis,
    competitiveAnalysis,
    outputDir
  });

  artifacts.push(...editorialMission.artifacts);

  // ============================================================================
  // PHASE 5: CONTENT PILLARS DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 5: Defining content pillars');
  const contentPillars = await ctx.task(contentPillarsTask, {
    brandName,
    editorialMission,
    audienceAnalysis,
    businessObjectives,
    outputDir
  });

  artifacts.push(...contentPillars.artifacts);

  // ============================================================================
  // PHASE 6: CONTENT MATRIX CREATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating content matrix');
  const contentMatrix = await ctx.task(contentMatrixTask, {
    brandName,
    contentPillars,
    audienceAnalysis,
    outputDir
  });

  artifacts.push(...contentMatrix.artifacts);

  // ============================================================================
  // PHASE 7: CONTENT TYPES AND FORMATS
  // ============================================================================

  ctx.log('info', 'Phase 7: Defining content types and formats');
  const contentTypes = await ctx.task(contentTypesFormatsTask, {
    brandName,
    contentPillars,
    contentMatrix,
    audienceAnalysis,
    outputDir
  });

  artifacts.push(...contentTypes.artifacts);

  // ============================================================================
  // PHASE 8: DISTRIBUTION STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 8: Developing distribution strategy');
  const distributionStrategy = await ctx.task(distributionStrategyTask, {
    brandName,
    contentTypes,
    audienceAnalysis,
    outputDir
  });

  artifacts.push(...distributionStrategy.artifacts);

  // ============================================================================
  // PHASE 9: SUCCESS METRICS DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 9: Defining success metrics');
  const successMetrics = await ctx.task(contentMetricsTask, {
    brandName,
    businessObjectives,
    contentPillars,
    contentMatrix,
    outputDir
  });

  artifacts.push(...successMetrics.artifacts);

  // ============================================================================
  // PHASE 10: STRATEGY QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 10: Assessing content strategy quality');
  const qualityAssessment = await ctx.task(contentStrategyQualityTask, {
    brandName,
    contentAudit,
    audienceAnalysis,
    editorialMission,
    contentPillars,
    contentMatrix,
    contentTypes,
    distributionStrategy,
    successMetrics,
    outputDir
  });

  artifacts.push(...qualityAssessment.artifacts);

  const strategyScore = qualityAssessment.overallScore;
  const qualityMet = strategyScore >= 80;

  // Breakpoint: Review content strategy
  await ctx.breakpoint({
    question: `Content strategy complete. Quality score: ${strategyScore}/100. ${qualityMet ? 'Strategy meets quality standards!' : 'Strategy may need refinement.'} Review and approve?`,
    title: 'Content Strategy Review & Approval',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        strategyScore,
        qualityMet,
        brandName,
        totalArtifacts: artifacts.length,
        pillarCount: contentPillars.pillars?.length || 0,
        contentTypesCount: contentTypes.types?.length || 0,
        channelCount: distributionStrategy.channels?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    brandName,
    strategyScore,
    qualityMet,
    contentStrategy: {
      editorialMission: editorialMission.mission,
      pillars: contentPillars.pillars,
      matrix: contentMatrix.matrix,
      types: contentTypes.types
    },
    contentPillars: contentPillars.pillars,
    contentMatrix: contentMatrix.matrix,
    editorialMission: editorialMission.mission,
    contentTypes: contentTypes.types,
    distributionStrategy: distributionStrategy.strategy,
    successMetrics: successMetrics.metrics,
    artifacts,
    duration,
    metadata: {
      processId: 'marketing/content-strategy-development',
      timestamp: startTime,
      brandName,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Content Audit
export const contentAuditTask = defineTask('content-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Audit existing content',
  agent: {
    name: 'content-auditor',
    prompt: {
      role: 'content strategist and SEO analyst',
      task: 'Conduct comprehensive audit of existing content assets',
      context: args,
      instructions: [
        'Inventory all existing content assets',
        'Categorize content by type, topic, and format',
        'Assess content performance metrics',
        'Identify content gaps',
        'Evaluate content quality scores',
        'Identify evergreen vs dated content',
        'Flag content for refresh, consolidation, or removal',
        'Assess SEO performance of content',
        'Generate content audit report'
      ],
      outputFormat: 'JSON with inventory (array), performance (object), gaps (array), recommendations (object), seoAnalysis (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['inventory', 'performance', 'gaps', 'artifacts'],
      properties: {
        inventory: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              type: { type: 'string' },
              url: { type: 'string' },
              performance: { type: 'string' }
            }
          }
        },
        performance: {
          type: 'object',
          properties: {
            topPerformers: { type: 'array' },
            underperformers: { type: 'array' }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: {
          type: 'object',
          properties: {
            keep: { type: 'array' },
            refresh: { type: 'array' },
            consolidate: { type: 'array' },
            remove: { type: 'array' }
          }
        },
        seoAnalysis: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'content-strategy', 'audit']
}));

// Task 2: Audience Content Needs
export const audienceContentNeedsTask = defineTask('audience-content-needs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze audience content needs',
  agent: {
    name: 'audience-researcher',
    prompt: {
      role: 'content researcher and audience analyst',
      task: 'Analyze target audience content needs and preferences',
      context: args,
      instructions: [
        'Map audience journey stages to content needs',
        'Identify key questions and pain points',
        'Analyze preferred content formats',
        'Identify consumption patterns and channels',
        'Map information needs by buyer stage',
        'Identify trusted information sources',
        'Analyze search behavior and queries',
        'Define content preferences by segment',
        'Generate audience content needs document'
      ],
      outputFormat: 'JSON with needs (array), journeyMapping (object), preferences (object), searchBehavior (object), segments (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['needs', 'journeyMapping', 'preferences', 'artifacts'],
      properties: {
        needs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              need: { type: 'string' },
              stage: { type: 'string' },
              priority: { type: 'string' }
            }
          }
        },
        journeyMapping: {
          type: 'object',
          properties: {
            awareness: { type: 'array', items: { type: 'string' } },
            consideration: { type: 'array', items: { type: 'string' } },
            decision: { type: 'array', items: { type: 'string' } },
            retention: { type: 'array', items: { type: 'string' } }
          }
        },
        preferences: {
          type: 'object',
          properties: {
            formats: { type: 'array', items: { type: 'string' } },
            channels: { type: 'array', items: { type: 'string' } },
            frequency: { type: 'string' }
          }
        },
        searchBehavior: { type: 'object' },
        segments: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'content-strategy', 'audience-needs']
}));

// Task 3: Competitive Content Analysis
export const competitiveContentAnalysisTask = defineTask('competitive-content-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze competitor content',
  agent: {
    name: 'competitive-analyst',
    prompt: {
      role: 'competitive intelligence analyst',
      task: 'Analyze competitor content strategies and identify opportunities',
      context: args,
      instructions: [
        'Audit competitor content portfolios',
        'Analyze competitor content themes and pillars',
        'Assess competitor content quality',
        'Identify competitor content gaps',
        'Analyze competitor SEO strategies',
        'Evaluate competitor distribution channels',
        'Identify differentiation opportunities',
        'Benchmark content frequency and volume',
        'Generate competitive analysis report'
      ],
      outputFormat: 'JSON with competitors (array), themes (object), gaps (array), opportunities (array), benchmarks (object), differentiation (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['competitors', 'gaps', 'opportunities', 'artifacts'],
      properties: {
        competitors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              contentStrength: { type: 'string' },
              keyThemes: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        themes: { type: 'object' },
        gaps: { type: 'array', items: { type: 'string' } },
        opportunities: { type: 'array', items: { type: 'string' } },
        benchmarks: { type: 'object' },
        differentiation: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'content-strategy', 'competitive-analysis']
}));

// Task 4: Editorial Mission
export const editorialMissionTask = defineTask('editorial-mission', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop editorial mission',
  agent: {
    name: 'editorial-strategist',
    prompt: {
      role: 'editorial director and content strategist',
      task: 'Develop compelling editorial mission statement and content positioning',
      context: args,
      instructions: [
        'Define core audience for content',
        'Articulate unique value proposition of content',
        'Define content differentiation',
        'Create editorial mission statement',
        'Define content brand voice',
        'Establish editorial principles',
        'Define content promise to audience',
        'Create editorial positioning',
        'Generate editorial mission document'
      ],
      outputFormat: 'JSON with mission (string), valueProposition (string), differentiation (array), brandVoice (object), principles (array), promise (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['mission', 'valueProposition', 'principles', 'artifacts'],
      properties: {
        mission: { type: 'string' },
        valueProposition: { type: 'string' },
        differentiation: { type: 'array', items: { type: 'string' } },
        brandVoice: {
          type: 'object',
          properties: {
            attributes: { type: 'array', items: { type: 'string' } },
            tone: { type: 'string' }
          }
        },
        principles: { type: 'array', items: { type: 'string' } },
        promise: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'content-strategy', 'editorial-mission']
}));

// Task 5: Content Pillars
export const contentPillarsTask = defineTask('content-pillars', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define content pillars',
  agent: {
    name: 'pillar-strategist',
    prompt: {
      role: 'content strategist and SEO expert',
      task: 'Define strategic content pillars that organize content topics',
      context: args,
      instructions: [
        'Identify 3-5 core content pillars',
        'Define pillar themes and topics',
        'Map pillars to business objectives',
        'Map pillars to audience needs',
        'Define cluster topics under each pillar',
        'Create pillar content hierarchy',
        'Identify pillar page topics',
        'Define pillar-cluster linking strategy',
        'Generate content pillars document'
      ],
      outputFormat: 'JSON with pillars (array), hierarchy (object), clusterTopics (object), linkingStrategy (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['pillars', 'hierarchy', 'artifacts'],
      properties: {
        pillars: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              businessAlignment: { type: 'string' },
              audienceAlignment: { type: 'string' },
              clusters: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        hierarchy: { type: 'object' },
        clusterTopics: { type: 'object' },
        linkingStrategy: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'content-strategy', 'pillars']
}));

// Task 6: Content Matrix
export const contentMatrixTask = defineTask('content-matrix', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create content matrix',
  agent: {
    name: 'matrix-designer',
    prompt: {
      role: 'content strategist and funnel expert',
      task: 'Create content matrix mapping content types to funnel stages',
      context: args,
      instructions: [
        'Map content types to buyer journey stages',
        'Define content purpose by funnel stage',
        'Identify content formats for each stage',
        'Map content to audience segments',
        'Define conversion paths through content',
        'Identify content handoffs between stages',
        'Create content-to-CTA mapping',
        'Define content volume by stage',
        'Generate content matrix document'
      ],
      outputFormat: 'JSON with matrix (object), stageContent (object), formatMapping (object), conversionPaths (array), ctaMapping (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['matrix', 'stageContent', 'artifacts'],
      properties: {
        matrix: {
          type: 'object',
          properties: {
            awareness: { type: 'array' },
            consideration: { type: 'array' },
            decision: { type: 'array' },
            retention: { type: 'array' },
            advocacy: { type: 'array' }
          }
        },
        stageContent: { type: 'object' },
        formatMapping: { type: 'object' },
        conversionPaths: { type: 'array' },
        ctaMapping: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'content-strategy', 'matrix']
}));

// Task 7: Content Types and Formats
export const contentTypesFormatsTask = defineTask('content-types-formats', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define content types and formats',
  agent: {
    name: 'format-specialist',
    prompt: {
      role: 'content format specialist',
      task: 'Define content types and formats to produce',
      context: args,
      instructions: [
        'Define blog/article specifications',
        'Define video content types',
        'Specify podcast/audio content',
        'Define interactive content types',
        'Specify visual content formats',
        'Define long-form content (ebooks, guides)',
        'Specify social media content types',
        'Define email content formats',
        'Generate content types specification'
      ],
      outputFormat: 'JSON with types (array), specifications (object), productionRequirements (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['types', 'specifications', 'artifacts'],
      properties: {
        types: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              purpose: { type: 'string' },
              format: { type: 'string' },
              frequency: { type: 'string' }
            }
          }
        },
        specifications: {
          type: 'object',
          properties: {
            blog: { type: 'object' },
            video: { type: 'object' },
            social: { type: 'object' },
            longForm: { type: 'object' }
          }
        },
        productionRequirements: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'content-strategy', 'formats']
}));

// Task 8: Distribution Strategy
export const distributionStrategyTask = defineTask('distribution-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop distribution strategy',
  agent: {
    name: 'distribution-strategist',
    prompt: {
      role: 'content distribution specialist',
      task: 'Develop comprehensive content distribution strategy',
      context: args,
      instructions: [
        'Define owned media channels',
        'Plan earned media opportunities',
        'Define paid content distribution',
        'Plan social media distribution',
        'Define email distribution strategy',
        'Plan syndication opportunities',
        'Define SEO distribution approach',
        'Plan influencer and partnership distribution',
        'Generate distribution strategy document'
      ],
      outputFormat: 'JSON with strategy (object), channels (array), ownedMedia (object), earnedMedia (object), paidMedia (object), syndication (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'channels', 'artifacts'],
      properties: {
        strategy: {
          type: 'object',
          properties: {
            approach: { type: 'string' },
            priorities: { type: 'array', items: { type: 'string' } }
          }
        },
        channels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              channel: { type: 'string' },
              purpose: { type: 'string' },
              contentTypes: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        ownedMedia: { type: 'object' },
        earnedMedia: { type: 'object' },
        paidMedia: { type: 'object' },
        syndication: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'content-strategy', 'distribution']
}));

// Task 9: Content Success Metrics
export const contentMetricsTask = defineTask('content-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define success metrics',
  agent: {
    name: 'metrics-specialist',
    prompt: {
      role: 'content analytics specialist',
      task: 'Define content marketing success metrics and measurement framework',
      context: args,
      instructions: [
        'Define awareness metrics (traffic, reach)',
        'Define engagement metrics (time, shares)',
        'Define conversion metrics (leads, sales)',
        'Define retention metrics (return visits, subscriptions)',
        'Set targets for each metric',
        'Define measurement tools and approach',
        'Create content scoring methodology',
        'Define reporting cadence',
        'Generate metrics framework document'
      ],
      outputFormat: 'JSON with metrics (array), targets (object), measurement (object), scoring (object), reporting (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'targets', 'measurement', 'artifacts'],
      properties: {
        metrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              category: { type: 'string' },
              target: { type: 'string' },
              measurement: { type: 'string' }
            }
          }
        },
        targets: { type: 'object' },
        measurement: {
          type: 'object',
          properties: {
            tools: { type: 'array', items: { type: 'string' } },
            frequency: { type: 'string' }
          }
        },
        scoring: { type: 'object' },
        reporting: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'content-strategy', 'metrics']
}));

// Task 10: Content Strategy Quality
export const contentStrategyQualityTask = defineTask('content-strategy-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess content strategy quality',
  agent: {
    name: 'strategy-validator',
    prompt: {
      role: 'chief content officer',
      task: 'Assess overall content strategy quality and readiness',
      context: args,
      instructions: [
        'Evaluate content audit completeness (weight: 10%)',
        'Assess audience analysis depth (weight: 15%)',
        'Review editorial mission clarity (weight: 15%)',
        'Evaluate content pillars alignment (weight: 15%)',
        'Assess content matrix comprehensiveness (weight: 15%)',
        'Review content types coverage (weight: 10%)',
        'Evaluate distribution strategy (weight: 10%)',
        'Assess metrics framework (weight: 10%)',
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
            contentAudit: { type: 'number' },
            audienceAnalysis: { type: 'number' },
            editorialMission: { type: 'number' },
            contentPillars: { type: 'number' },
            contentMatrix: { type: 'number' },
            contentTypes: { type: 'number' },
            distribution: { type: 'number' },
            metrics: { type: 'number' }
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
  labels: ['agent', 'content-strategy', 'quality-assessment']
}));
