/**
 * @process sales/customer-health-monitoring
 * @description Framework for tracking customer health indicators, predicting churn risk, and triggering proactive intervention when accounts show warning signs.
 * @inputs { accountName: string, usageMetrics: object, engagementData: object, supportData: object, contractData: object, previousHealth?: object }
 * @outputs { success: boolean, healthScore: number, healthIndicators: object, churnRisk: object, interventions: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('sales/customer-health-monitoring', {
 *   accountName: 'Key Customer',
 *   usageMetrics: { activeUsers: 100, logins: 500, features: 75 },
 *   engagementData: { lastContact: '2024-01-15', nps: 8 },
 *   supportData: { tickets: 5, escalations: 1 },
 *   contractData: { value: 50000, renewalDate: '2024-06-01' }
 * });
 *
 * @references
 * - Totango Customer Health: https://www.totango.com/
 * - ChurnZero Customer Success: https://churnzero.net/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    accountName,
    usageMetrics = {},
    engagementData = {},
    supportData = {},
    contractData = {},
    previousHealth = {},
    outputDir = 'health-monitoring-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Customer Health Monitoring for ${accountName}`);

  // ============================================================================
  // PHASE 1: USAGE HEALTH ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing Usage Health');
  const usageHealth = await ctx.task(usageHealthTask, {
    accountName,
    usageMetrics,
    previousHealth,
    outputDir
  });

  artifacts.push(...(usageHealth.artifacts || []));

  // ============================================================================
  // PHASE 2: ENGAGEMENT HEALTH ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing Engagement Health');
  const engagementHealth = await ctx.task(engagementHealthTask, {
    accountName,
    engagementData,
    previousHealth,
    outputDir
  });

  artifacts.push(...(engagementHealth.artifacts || []));

  // ============================================================================
  // PHASE 3: SUPPORT HEALTH ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing Support Health');
  const supportHealth = await ctx.task(supportHealthTask, {
    accountName,
    supportData,
    previousHealth,
    outputDir
  });

  artifacts.push(...(supportHealth.artifacts || []));

  // ============================================================================
  // PHASE 4: FINANCIAL HEALTH ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing Financial Health');
  const financialHealth = await ctx.task(financialHealthTask, {
    accountName,
    contractData,
    previousHealth,
    outputDir
  });

  artifacts.push(...(financialHealth.artifacts || []));

  // ============================================================================
  // PHASE 5: RELATIONSHIP HEALTH ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing Relationship Health');
  const relationshipHealth = await ctx.task(relationshipHealthTask, {
    accountName,
    engagementData,
    previousHealth,
    outputDir
  });

  artifacts.push(...(relationshipHealth.artifacts || []));

  // ============================================================================
  // PHASE 6: COMPOSITE HEALTH SCORING
  // ============================================================================

  ctx.log('info', 'Phase 6: Calculating Composite Health Score');
  const compositeHealth = await ctx.task(compositeHealthTask, {
    accountName,
    usageHealth,
    engagementHealth,
    supportHealth,
    financialHealth,
    relationshipHealth,
    previousHealth,
    outputDir
  });

  artifacts.push(...(compositeHealth.artifacts || []));

  // ============================================================================
  // PHASE 7: CHURN RISK PREDICTION
  // ============================================================================

  ctx.log('info', 'Phase 7: Predicting Churn Risk');
  const churnPrediction = await ctx.task(churnPredictionTask, {
    accountName,
    compositeHealth,
    contractData,
    previousHealth,
    outputDir
  });

  artifacts.push(...(churnPrediction.artifacts || []));

  // ============================================================================
  // PHASE 8: INTERVENTION RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating Intervention Recommendations');
  const interventions = await ctx.task(interventionRecommendationsTask, {
    accountName,
    compositeHealth,
    churnPrediction,
    contractData,
    outputDir
  });

  artifacts.push(...(interventions.artifacts || []));

  // Breakpoint if high risk
  if (churnPrediction.riskLevel === 'high' || churnPrediction.riskLevel === 'critical') {
    await ctx.breakpoint({
      question: `HIGH CHURN RISK detected for ${accountName}. Health Score: ${compositeHealth.overallScore}/100. Review intervention plan?`,
      title: 'Customer Health Alert',
      context: {
        runId: ctx.runId,
        files: artifacts.map(a => ({
          path: a.path,
          format: a.format || 'markdown',
          label: a.label || undefined
        })),
        summary: {
          accountName,
          healthScore: compositeHealth.overallScore,
          churnRisk: churnPrediction.riskLevel,
          topConcerns: compositeHealth.topConcerns,
          recommendedActions: interventions.priority?.length || 0
        }
      }
    });
  }

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    accountName,
    healthScore: compositeHealth.overallScore,
    healthTrend: compositeHealth.trend,
    healthIndicators: {
      usage: usageHealth.score,
      engagement: engagementHealth.score,
      support: supportHealth.score,
      financial: financialHealth.score,
      relationship: relationshipHealth.score
    },
    churnRisk: {
      riskLevel: churnPrediction.riskLevel,
      riskScore: churnPrediction.riskScore,
      riskFactors: churnPrediction.riskFactors,
      churnProbability: churnPrediction.probability
    },
    alerts: compositeHealth.alerts,
    interventions: interventions.recommendations,
    priorityActions: interventions.priority,
    artifacts,
    duration,
    metadata: {
      processId: 'sales/customer-health-monitoring',
      timestamp: startTime,
      accountName,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const usageHealthTask = defineTask('usage-health', (args, taskCtx) => ({
  kind: 'agent',
  title: `Usage Health Analysis - ${args.accountName}`,
  agent: {
    name: 'health-analyst',
    prompt: {
      role: 'Usage analytics specialist',
      task: 'Analyze usage health indicators',
      context: args,
      instructions: [
        'Analyze active user metrics',
        'Assess feature adoption rates',
        'Track usage trends over time',
        'Identify declining usage patterns',
        'Compare to benchmarks',
        'Identify usage health risks',
        'Calculate usage health score',
        'Flag usage alerts'
      ],
      outputFormat: 'JSON with score, metrics, trends, risks, alerts, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'metrics', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        metrics: {
          type: 'object',
          properties: {
            activeUsers: { type: 'number' },
            adoptionRate: { type: 'number' },
            loginFrequency: { type: 'string' },
            featureUsage: { type: 'number' }
          }
        },
        trends: {
          type: 'object',
          properties: {
            direction: { type: 'string', enum: ['improving', 'stable', 'declining'] },
            velocity: { type: 'string' }
          }
        },
        risks: { type: 'array', items: { type: 'string' } },
        alerts: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'health-monitoring', 'usage']
}));

export const engagementHealthTask = defineTask('engagement-health', (args, taskCtx) => ({
  kind: 'agent',
  title: `Engagement Health Analysis - ${args.accountName}`,
  agent: {
    name: 'health-analyst',
    prompt: {
      role: 'Customer engagement analyst',
      task: 'Analyze engagement health indicators',
      context: args,
      instructions: [
        'Assess communication frequency',
        'Analyze meeting attendance',
        'Track event participation',
        'Evaluate NPS/CSAT scores',
        'Identify engagement decline',
        'Assess responsiveness',
        'Calculate engagement score',
        'Flag engagement alerts'
      ],
      outputFormat: 'JSON with score, metrics, trends, risks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'metrics', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        metrics: {
          type: 'object',
          properties: {
            lastContact: { type: 'string' },
            meetingFrequency: { type: 'string' },
            nps: { type: 'number' },
            responsiveness: { type: 'string' }
          }
        },
        trends: {
          type: 'object',
          properties: {
            direction: { type: 'string' },
            concerns: { type: 'array', items: { type: 'string' } }
          }
        },
        risks: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'health-monitoring', 'engagement']
}));

export const supportHealthTask = defineTask('support-health', (args, taskCtx) => ({
  kind: 'agent',
  title: `Support Health Analysis - ${args.accountName}`,
  agent: {
    name: 'health-analyst',
    prompt: {
      role: 'Support analytics specialist',
      task: 'Analyze support health indicators',
      context: args,
      instructions: [
        'Analyze ticket volume and trends',
        'Track escalation patterns',
        'Assess resolution satisfaction',
        'Identify recurring issues',
        'Monitor critical incidents',
        'Calculate support health score',
        'Compare to historical norms',
        'Flag support alerts'
      ],
      outputFormat: 'JSON with score, metrics, incidents, risks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'metrics', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        metrics: {
          type: 'object',
          properties: {
            openTickets: { type: 'number' },
            ticketTrend: { type: 'string' },
            escalations: { type: 'number' },
            avgResolutionTime: { type: 'string' }
          }
        },
        incidents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              severity: { type: 'string' },
              status: { type: 'string' }
            }
          }
        },
        risks: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'health-monitoring', 'support']
}));

export const financialHealthTask = defineTask('financial-health', (args, taskCtx) => ({
  kind: 'agent',
  title: `Financial Health Analysis - ${args.accountName}`,
  agent: {
    name: 'health-analyst',
    prompt: {
      role: 'Financial health analyst',
      task: 'Analyze financial health indicators',
      context: args,
      instructions: [
        'Assess contract value trends',
        'Track payment history',
        'Monitor renewal proximity',
        'Evaluate expansion history',
        'Assess budget concerns',
        'Calculate financial health score',
        'Identify financial risks',
        'Flag financial alerts'
      ],
      outputFormat: 'JSON with score, metrics, risks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'metrics', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        metrics: {
          type: 'object',
          properties: {
            contractValue: { type: 'number' },
            renewalDate: { type: 'string' },
            daysToRenewal: { type: 'number' },
            paymentStatus: { type: 'string' },
            growthHistory: { type: 'string' }
          }
        },
        risks: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'health-monitoring', 'financial']
}));

export const relationshipHealthTask = defineTask('relationship-health', (args, taskCtx) => ({
  kind: 'agent',
  title: `Relationship Health Analysis - ${args.accountName}`,
  agent: {
    name: 'health-analyst',
    prompt: {
      role: 'Relationship health analyst',
      task: 'Analyze relationship health indicators',
      context: args,
      instructions: [
        'Assess executive relationship strength',
        'Track champion engagement',
        'Monitor stakeholder changes',
        'Evaluate multi-threading depth',
        'Identify relationship risks',
        'Calculate relationship score',
        'Track sentiment changes',
        'Flag relationship alerts'
      ],
      outputFormat: 'JSON with score, relationships, risks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'relationships', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        relationships: {
          type: 'object',
          properties: {
            executiveAccess: { type: 'string' },
            championStrength: { type: 'string' },
            breadth: { type: 'number' },
            recentChanges: { type: 'array', items: { type: 'string' } }
          }
        },
        risks: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'health-monitoring', 'relationship']
}));

export const compositeHealthTask = defineTask('composite-health', (args, taskCtx) => ({
  kind: 'agent',
  title: `Composite Health Score - ${args.accountName}`,
  agent: {
    name: 'health-analyst',
    prompt: {
      role: 'Customer health scoring specialist',
      task: 'Calculate composite health score',
      context: args,
      instructions: [
        'Weight health dimensions appropriately',
        'Calculate composite score',
        'Compare to previous period',
        'Determine health trend',
        'Identify top concerns',
        'Generate health alerts',
        'Classify health status',
        'Create health summary'
      ],
      outputFormat: 'JSON with overallScore, trend, alerts, topConcerns, classification, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'trend', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        trend: { type: 'string', enum: ['improving', 'stable', 'declining'] },
        trendVelocity: { type: 'string' },
        classification: { type: 'string', enum: ['healthy', 'needs-attention', 'at-risk', 'critical'] },
        alerts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alert: { type: 'string' },
              severity: { type: 'string' },
              dimension: { type: 'string' }
            }
          }
        },
        topConcerns: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'health-monitoring', 'composite']
}));

export const churnPredictionTask = defineTask('churn-prediction', (args, taskCtx) => ({
  kind: 'agent',
  title: `Churn Prediction - ${args.accountName}`,
  agent: {
    name: 'health-analyst',
    prompt: {
      role: 'Churn prediction specialist',
      task: 'Predict churn risk and identify factors',
      context: args,
      instructions: [
        'Analyze all health indicators for churn signals',
        'Identify specific churn risk factors',
        'Calculate churn probability',
        'Determine risk level',
        'Identify leading indicators',
        'Compare to known churn patterns',
        'Assess renewal likelihood',
        'Create risk profile'
      ],
      outputFormat: 'JSON with riskLevel, riskScore, riskFactors, probability, indicators, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['riskLevel', 'riskScore', 'riskFactors', 'artifacts'],
      properties: {
        riskLevel: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
        riskScore: { type: 'number', minimum: 0, maximum: 100 },
        probability: { type: 'number', minimum: 0, maximum: 100 },
        riskFactors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              factor: { type: 'string' },
              weight: { type: 'number' },
              evidence: { type: 'string' }
            }
          }
        },
        leadingIndicators: { type: 'array', items: { type: 'string' } },
        renewalLikelihood: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'health-monitoring', 'churn-prediction']
}));

export const interventionRecommendationsTask = defineTask('intervention-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Intervention Recommendations - ${args.accountName}`,
  agent: {
    name: 'customer-success',
    prompt: {
      role: 'Customer intervention specialist',
      task: 'Generate intervention recommendations',
      context: args,
      instructions: [
        'Develop interventions for each risk area',
        'Prioritize by impact and urgency',
        'Assign owners',
        'Define success criteria',
        'Create escalation triggers',
        'Set timelines',
        'Develop monitoring plan',
        'Create intervention playbook'
      ],
      outputFormat: 'JSON with recommendations array, priority array, escalation, monitoring, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'priority', 'artifacts'],
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              intervention: { type: 'string' },
              riskAddressed: { type: 'string' },
              owner: { type: 'string' },
              timeline: { type: 'string' },
              successCriteria: { type: 'string' }
            }
          }
        },
        priority: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              urgency: { type: 'string', enum: ['immediate', 'this-week', 'this-month'] },
              owner: { type: 'string' }
            }
          }
        },
        escalation: {
          type: 'object',
          properties: {
            triggers: { type: 'array', items: { type: 'string' } },
            escalationPath: { type: 'array', items: { type: 'string' } }
          }
        },
        monitoring: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'health-monitoring', 'intervention']
}));
