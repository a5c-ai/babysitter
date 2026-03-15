/**
 * @process sales/lead-qualification-scoring
 * @description Structured process for qualifying inbound leads using BANT criteria and assigning lead scores based on fit and engagement.
 * @inputs { leadInfo: object, source: string, engagementHistory?: array, companyData?: object, behavioralSignals?: array }
 * @outputs { success: boolean, leadScore: number, qualificationStatus: string, bantAnalysis: object, routingRecommendation: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('sales/lead-qualification-scoring', {
 *   leadInfo: { name: 'John Doe', email: 'john@company.com', title: 'VP Engineering', company: 'Tech Corp' },
 *   source: 'Website Demo Request',
 *   engagementHistory: [{ type: 'webinar', date: '2024-01-15' }],
 *   companyData: { size: 500, industry: 'Technology', revenue: '50M' }
 * });
 *
 * @references
 * - HubSpot Academy Inbound Sales: https://academy.hubspot.com/courses/inbound-sales
 * - BANT Qualification: https://blog.hubspot.com/sales/bant
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    leadInfo,
    source,
    engagementHistory = [],
    companyData = {},
    behavioralSignals = [],
    idealCustomerProfile = {},
    scoringModel = 'default',
    outputDir = 'lead-scoring-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Lead Qualification for ${leadInfo.name || 'Unknown Lead'}`);

  // ============================================================================
  // PHASE 1: COMPANY FIT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing Company Fit');
  const companyFitAnalysis = await ctx.task(companyFitAnalysisTask, {
    leadInfo,
    companyData,
    idealCustomerProfile,
    outputDir
  });

  artifacts.push(...(companyFitAnalysis.artifacts || []));

  // ============================================================================
  // PHASE 2: CONTACT FIT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing Contact Fit');
  const contactFitAnalysis = await ctx.task(contactFitAnalysisTask, {
    leadInfo,
    companyData,
    outputDir
  });

  artifacts.push(...(contactFitAnalysis.artifacts || []));

  // ============================================================================
  // PHASE 3: BANT QUALIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 3: BANT Qualification');
  const bantAnalysis = await ctx.task(bantQualificationTask, {
    leadInfo,
    companyData,
    source,
    engagementHistory,
    outputDir
  });

  artifacts.push(...(bantAnalysis.artifacts || []));

  // ============================================================================
  // PHASE 4: ENGAGEMENT SCORING
  // ============================================================================

  ctx.log('info', 'Phase 4: Scoring Engagement');
  const engagementScoring = await ctx.task(engagementScoringTask, {
    leadInfo,
    engagementHistory,
    behavioralSignals,
    source,
    outputDir
  });

  artifacts.push(...(engagementScoring.artifacts || []));

  // ============================================================================
  // PHASE 5: INTENT SIGNAL ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing Intent Signals');
  const intentAnalysis = await ctx.task(intentSignalAnalysisTask, {
    leadInfo,
    engagementHistory,
    behavioralSignals,
    source,
    outputDir
  });

  artifacts.push(...(intentAnalysis.artifacts || []));

  // ============================================================================
  // PHASE 6: COMPOSITE SCORE CALCULATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Calculating Composite Score');
  const compositeScore = await ctx.task(compositeScoreCalculationTask, {
    leadInfo,
    companyFitAnalysis,
    contactFitAnalysis,
    bantAnalysis,
    engagementScoring,
    intentAnalysis,
    scoringModel,
    outputDir
  });

  artifacts.push(...(compositeScore.artifacts || []));

  // ============================================================================
  // PHASE 7: LEAD ROUTING RECOMMENDATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Generating Routing Recommendation');
  const routingRecommendation = await ctx.task(leadRoutingTask, {
    leadInfo,
    companyData,
    compositeScore,
    bantAnalysis,
    outputDir
  });

  artifacts.push(...(routingRecommendation.artifacts || []));

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    leadInfo: {
      name: leadInfo.name,
      company: leadInfo.company || companyData.name,
      source
    },
    leadScore: compositeScore.totalScore,
    qualificationStatus: compositeScore.qualificationStatus,
    scoreBreakdown: {
      fitScore: compositeScore.fitScore,
      engagementScore: compositeScore.engagementScore,
      intentScore: compositeScore.intentScore
    },
    bantAnalysis: {
      budget: bantAnalysis.budget,
      authority: bantAnalysis.authority,
      need: bantAnalysis.need,
      timeline: bantAnalysis.timeline,
      bantScore: bantAnalysis.overallScore
    },
    routingRecommendation: {
      action: routingRecommendation.action,
      assignTo: routingRecommendation.assignTo,
      priority: routingRecommendation.priority,
      nextSteps: routingRecommendation.nextSteps
    },
    enrichmentData: {
      companyInsights: companyFitAnalysis.insights,
      contactInsights: contactFitAnalysis.insights
    },
    artifacts,
    duration,
    metadata: {
      processId: 'sales/lead-qualification-scoring',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const companyFitAnalysisTask = defineTask('company-fit-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Company Fit Analysis`,
  agent: {
    name: 'lead-analyst',
    prompt: {
      role: 'Lead qualification specialist and ICP analyst',
      task: 'Analyze company fit against Ideal Customer Profile',
      context: args,
      instructions: [
        'Evaluate company size and employee count',
        'Assess industry and vertical alignment',
        'Check geographic fit',
        'Evaluate revenue and budget potential',
        'Assess technology stack compatibility',
        'Check for existing relationships or references',
        'Identify fit score and gaps',
        'Flag any disqualifying factors'
      ],
      outputFormat: 'JSON with fitScore, fitFactors, insights, disqualifiers, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['fitScore', 'fitFactors', 'artifacts'],
      properties: {
        fitScore: { type: 'number', minimum: 0, maximum: 100 },
        fitFactors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              factor: { type: 'string' },
              value: { type: 'string' },
              score: { type: 'number' },
              weight: { type: 'number' }
            }
          }
        },
        insights: { type: 'array', items: { type: 'string' } },
        disqualifiers: { type: 'array', items: { type: 'string' } },
        enrichmentSuggestions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'lead-scoring', 'company-fit']
}));

export const contactFitAnalysisTask = defineTask('contact-fit-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Contact Fit Analysis`,
  agent: {
    name: 'lead-analyst',
    prompt: {
      role: 'Lead qualification specialist',
      task: 'Analyze contact role and persona fit',
      context: args,
      instructions: [
        'Evaluate job title and seniority',
        'Assess department alignment',
        'Check decision-making authority indicators',
        'Evaluate persona match',
        'Assess professional background',
        'Identify potential buying role',
        'Score contact quality',
        'Flag data quality issues'
      ],
      outputFormat: 'JSON with contactScore, roleAnalysis, insights, dataQuality, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['contactScore', 'roleAnalysis', 'artifacts'],
      properties: {
        contactScore: { type: 'number', minimum: 0, maximum: 100 },
        roleAnalysis: {
          type: 'object',
          properties: {
            seniority: { type: 'string', enum: ['executive', 'director', 'manager', 'individual-contributor', 'unknown'] },
            department: { type: 'string' },
            buyingRole: { type: 'string', enum: ['decision-maker', 'influencer', 'champion', 'user', 'unknown'] },
            personaMatch: { type: 'string' }
          }
        },
        insights: { type: 'array', items: { type: 'string' } },
        dataQuality: {
          type: 'object',
          properties: {
            completeness: { type: 'number' },
            accuracy: { type: 'string' },
            missingFields: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'sales', 'lead-scoring', 'contact-fit']
}));

export const bantQualificationTask = defineTask('bant-qualification', (args, taskCtx) => ({
  kind: 'agent',
  title: `BANT Qualification`,
  agent: {
    name: 'lead-analyst',
    prompt: {
      role: 'Sales qualification expert specializing in BANT methodology',
      task: 'Qualify lead using BANT criteria based on available information',
      context: args,
      instructions: [
        'Assess Budget indicators (company size, funding, stated budget)',
        'Evaluate Authority signals (title, role, decision-making indicators)',
        'Analyze Need indicators (pain signals, use case alignment)',
        'Determine Timeline urgency (stated timeline, trigger events)',
        'Score each BANT component',
        'Identify information gaps',
        'Suggest qualification questions',
        'Provide overall BANT assessment'
      ],
      outputFormat: 'JSON with budget, authority, need, timeline, overallScore, gaps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['budget', 'authority', 'need', 'timeline', 'overallScore', 'artifacts'],
      properties: {
        budget: {
          type: 'object',
          properties: {
            score: { type: 'number', minimum: 0, maximum: 100 },
            indicators: { type: 'array', items: { type: 'string' } },
            confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
            notes: { type: 'string' }
          }
        },
        authority: {
          type: 'object',
          properties: {
            score: { type: 'number', minimum: 0, maximum: 100 },
            indicators: { type: 'array', items: { type: 'string' } },
            confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
            notes: { type: 'string' }
          }
        },
        need: {
          type: 'object',
          properties: {
            score: { type: 'number', minimum: 0, maximum: 100 },
            indicators: { type: 'array', items: { type: 'string' } },
            confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
            notes: { type: 'string' }
          }
        },
        timeline: {
          type: 'object',
          properties: {
            score: { type: 'number', minimum: 0, maximum: 100 },
            indicators: { type: 'array', items: { type: 'string' } },
            confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
            notes: { type: 'string' }
          }
        },
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        gaps: { type: 'array', items: { type: 'string' } },
        qualificationQuestions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'lead-scoring', 'bant']
}));

export const engagementScoringTask = defineTask('engagement-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Engagement Scoring`,
  agent: {
    name: 'lead-analyst',
    prompt: {
      role: 'Marketing analytics specialist',
      task: 'Score lead engagement based on interaction history',
      context: args,
      instructions: [
        'Score each engagement type (webinar, content, email, etc.)',
        'Apply recency weighting',
        'Calculate frequency score',
        'Assess engagement depth',
        'Identify high-value interactions',
        'Calculate overall engagement score',
        'Identify engagement trends',
        'Flag disengagement risks'
      ],
      outputFormat: 'JSON with engagementScore, engagementBreakdown, trends, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['engagementScore', 'engagementBreakdown', 'artifacts'],
      properties: {
        engagementScore: { type: 'number', minimum: 0, maximum: 100 },
        engagementBreakdown: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              activity: { type: 'string' },
              date: { type: 'string' },
              score: { type: 'number' },
              weight: { type: 'number' }
            }
          }
        },
        trends: {
          type: 'object',
          properties: {
            direction: { type: 'string', enum: ['increasing', 'stable', 'decreasing'] },
            velocity: { type: 'string' },
            recentActivity: { type: 'string' }
          }
        },
        highValueInteractions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'lead-scoring', 'engagement']
}));

export const intentSignalAnalysisTask = defineTask('intent-signal-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Intent Signal Analysis`,
  agent: {
    name: 'lead-analyst',
    prompt: {
      role: 'Intent data analyst and buying signal expert',
      task: 'Analyze buying intent signals',
      context: args,
      instructions: [
        'Identify explicit intent signals (demo request, pricing inquiry)',
        'Analyze implicit intent signals (content consumption patterns)',
        'Assess source quality and intent level',
        'Identify buying stage indicators',
        'Score overall intent',
        'Identify competitive research signals',
        'Assess urgency indicators',
        'Predict buying timeframe'
      ],
      outputFormat: 'JSON with intentScore, signals, buyingStage, urgency, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['intentScore', 'signals', 'artifacts'],
      properties: {
        intentScore: { type: 'number', minimum: 0, maximum: 100 },
        signals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              signal: { type: 'string' },
              type: { type: 'string', enum: ['explicit', 'implicit'] },
              strength: { type: 'string', enum: ['strong', 'moderate', 'weak'] },
              recency: { type: 'string' }
            }
          }
        },
        buyingStage: {
          type: 'object',
          properties: {
            stage: { type: 'string', enum: ['awareness', 'consideration', 'decision', 'unknown'] },
            confidence: { type: 'string' },
            indicators: { type: 'array', items: { type: 'string' } }
          }
        },
        urgency: { type: 'string', enum: ['high', 'medium', 'low', 'unknown'] },
        competitiveSignals: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'lead-scoring', 'intent']
}));

export const compositeScoreCalculationTask = defineTask('composite-score-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Composite Score Calculation`,
  agent: {
    name: 'lead-analyst',
    prompt: {
      role: 'Lead scoring model specialist',
      task: 'Calculate composite lead score from all components',
      context: args,
      instructions: [
        'Apply scoring model weights',
        'Calculate weighted fit score',
        'Calculate weighted engagement score',
        'Calculate weighted intent score',
        'Determine total composite score',
        'Apply scoring thresholds',
        'Determine qualification status',
        'Identify score drivers and detractors'
      ],
      outputFormat: 'JSON with totalScore, qualificationStatus, scoreComponents, drivers, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalScore', 'qualificationStatus', 'artifacts'],
      properties: {
        totalScore: { type: 'number', minimum: 0, maximum: 100 },
        fitScore: { type: 'number' },
        engagementScore: { type: 'number' },
        intentScore: { type: 'number' },
        qualificationStatus: {
          type: 'string',
          enum: ['MQL', 'SQL', 'SAL', 'Nurture', 'Disqualified', 'Needs Review']
        },
        scoreDrivers: { type: 'array', items: { type: 'string' } },
        scoreDetractors: { type: 'array', items: { type: 'string' } },
        confidence: { type: 'number', minimum: 0, maximum: 100 },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'lead-scoring', 'composite-score']
}));

export const leadRoutingTask = defineTask('lead-routing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Lead Routing Recommendation`,
  agent: {
    name: 'lead-analyst',
    prompt: {
      role: 'Sales operations specialist',
      task: 'Generate lead routing and follow-up recommendations',
      context: args,
      instructions: [
        'Determine appropriate routing action',
        'Recommend assignment (SDR, AE, territory)',
        'Set priority level',
        'Define SLA requirements',
        'Suggest immediate next steps',
        'Recommend follow-up cadence',
        'Identify nurture track if applicable',
        'Flag any special handling requirements'
      ],
      outputFormat: 'JSON with action, assignTo, priority, nextSteps, sla, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['action', 'priority', 'nextSteps', 'artifacts'],
      properties: {
        action: {
          type: 'string',
          enum: ['immediate-contact', 'schedule-outreach', 'nurture', 'disqualify', 'enrich-data', 'manual-review']
        },
        assignTo: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['SDR', 'AE', 'territory-owner', 'round-robin', 'nurture-program'] },
            criteria: { type: 'string' }
          }
        },
        priority: { type: 'string', enum: ['urgent', 'high', 'medium', 'low'] },
        sla: {
          type: 'object',
          properties: {
            responseTime: { type: 'string' },
            followUpCadence: { type: 'string' }
          }
        },
        nextSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              timing: { type: 'string' },
              channel: { type: 'string' }
            }
          }
        },
        specialHandling: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'lead-scoring', 'routing']
}));
