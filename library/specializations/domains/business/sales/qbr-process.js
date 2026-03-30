/**
 * @process sales/qbr-process
 * @description Structured process for conducting customer QBRs that demonstrate value delivered, identify expansion opportunities, and strengthen executive relationships.
 * @inputs { accountName: string, quarter: string, customerData: object, contractData?: object, supportData?: object, usageData?: object }
 * @outputs { success: boolean, qbrPresentation: object, valueDelivered: object, expansionOpportunities: array, riskAssessment: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('sales/qbr-process', {
 *   accountName: 'Enterprise Customer',
 *   quarter: 'Q4 2024',
 *   customerData: { contacts: [], products: [] },
 *   contractData: { renewalDate: '2025-06-01', value: 100000 },
 *   usageData: { activeUsers: 500, adoptionRate: 75 }
 * });
 *
 * @references
 * - Gainsight Customer Success: https://www.gainsight.com/
 * - QBR Best Practices: https://www.clientsuccess.com/blog/quarterly-business-review/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    accountName,
    quarter,
    customerData = {},
    contractData = {},
    supportData = {},
    usageData = {},
    previousQBR = {},
    outputDir = 'qbr-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting QBR Process for ${accountName} - ${quarter}`);

  // ============================================================================
  // PHASE 1: VALUE DELIVERED ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing Value Delivered');
  const valueAnalysis = await ctx.task(valueDeliveredTask, {
    accountName,
    quarter,
    customerData,
    usageData,
    previousQBR,
    outputDir
  });

  artifacts.push(...(valueAnalysis.artifacts || []));

  // ============================================================================
  // PHASE 2: USAGE AND ADOPTION ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing Usage and Adoption');
  const usageAnalysis = await ctx.task(usageAdoptionTask, {
    accountName,
    usageData,
    customerData,
    outputDir
  });

  artifacts.push(...(usageAnalysis.artifacts || []));

  // ============================================================================
  // PHASE 3: SUPPORT AND HEALTH REVIEW
  // ============================================================================

  ctx.log('info', 'Phase 3: Reviewing Support and Health');
  const healthReview = await ctx.task(supportHealthReviewTask, {
    accountName,
    supportData,
    usageData,
    outputDir
  });

  artifacts.push(...(healthReview.artifacts || []));

  // ============================================================================
  // PHASE 4: GOAL PROGRESS REVIEW
  // ============================================================================

  ctx.log('info', 'Phase 4: Reviewing Goal Progress');
  const goalReview = await ctx.task(goalProgressReviewTask, {
    accountName,
    previousQBR,
    customerData,
    usageData,
    outputDir
  });

  artifacts.push(...(goalReview.artifacts || []));

  // ============================================================================
  // PHASE 5: EXPANSION OPPORTUNITY IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Identifying Expansion Opportunities');
  const expansionOpportunities = await ctx.task(expansionOpportunityTask, {
    accountName,
    usageAnalysis,
    customerData,
    contractData,
    outputDir
  });

  artifacts.push(...(expansionOpportunities.artifacts || []));

  // ============================================================================
  // PHASE 6: RISK ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 6: Assessing Risks');
  const riskAssessment = await ctx.task(qbrRiskAssessmentTask, {
    accountName,
    healthReview,
    usageAnalysis,
    contractData,
    outputDir
  });

  artifacts.push(...(riskAssessment.artifacts || []));

  // ============================================================================
  // PHASE 7: NEXT QUARTER PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 7: Planning Next Quarter');
  const nextQuarterPlan = await ctx.task(nextQuarterPlanningTask, {
    accountName,
    goalReview,
    expansionOpportunities,
    riskAssessment,
    outputDir
  });

  artifacts.push(...(nextQuarterPlan.artifacts || []));

  // ============================================================================
  // PHASE 8: QBR PRESENTATION COMPILATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Compiling QBR Presentation');
  const qbrPresentation = await ctx.task(qbrPresentationTask, {
    accountName,
    quarter,
    valueAnalysis,
    usageAnalysis,
    healthReview,
    goalReview,
    expansionOpportunities,
    riskAssessment,
    nextQuarterPlan,
    outputDir
  });

  artifacts.push(...(qbrPresentation.artifacts || []));

  // Breakpoint: Review QBR presentation
  await ctx.breakpoint({
    question: `QBR presentation prepared for ${accountName} - ${quarter}. Review before customer meeting?`,
    title: 'QBR Presentation Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        label: a.label || undefined
      })),
      summary: {
        accountName,
        quarter,
        healthScore: healthReview.healthScore,
        adoptionRate: usageAnalysis.adoptionRate,
        expansionPotential: expansionOpportunities.totalPotential,
        riskLevel: riskAssessment.riskLevel
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    accountName,
    quarter,
    qbrPresentation: qbrPresentation.presentation,
    valueDelivered: {
      summary: valueAnalysis.summary,
      metrics: valueAnalysis.metrics,
      highlights: valueAnalysis.highlights,
      roi: valueAnalysis.roi
    },
    usageMetrics: {
      adoptionRate: usageAnalysis.adoptionRate,
      activeUsers: usageAnalysis.activeUsers,
      trends: usageAnalysis.trends
    },
    healthAssessment: {
      healthScore: healthReview.healthScore,
      supportMetrics: healthReview.supportMetrics,
      risks: healthReview.risks
    },
    goalProgress: goalReview.progress,
    expansionOpportunities: expansionOpportunities.opportunities,
    riskAssessment: {
      riskLevel: riskAssessment.riskLevel,
      risks: riskAssessment.risks,
      mitigations: riskAssessment.mitigations
    },
    nextQuarterGoals: nextQuarterPlan.goals,
    actionItems: nextQuarterPlan.actionItems,
    artifacts,
    duration,
    metadata: {
      processId: 'sales/qbr-process',
      timestamp: startTime,
      accountName,
      quarter,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const valueDeliveredTask = defineTask('value-delivered', (args, taskCtx) => ({
  kind: 'agent',
  title: `Value Delivered Analysis - ${args.accountName}`,
  agent: {
    name: 'customer-success',
    prompt: {
      role: 'Customer success manager specializing in value realization',
      task: 'Analyze and document value delivered to the customer',
      context: args,
      instructions: [
        'Identify key value metrics achieved',
        'Calculate ROI based on customer outcomes',
        'Document business impact stories',
        'Highlight wins and achievements',
        'Compare to baseline and goals',
        'Quantify efficiency gains',
        'Document qualitative feedback',
        'Create value summary for presentation'
      ],
      outputFormat: 'JSON with summary, metrics, highlights, roi, stories, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'metrics', 'artifacts'],
      properties: {
        summary: { type: 'string' },
        metrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              value: { type: 'string' },
              vsGoal: { type: 'string' },
              trend: { type: 'string' }
            }
          }
        },
        highlights: { type: 'array', items: { type: 'string' } },
        roi: {
          type: 'object',
          properties: {
            calculated: { type: 'string' },
            methodology: { type: 'string' },
            confidence: { type: 'string' }
          }
        },
        stories: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'qbr', 'value-delivered']
}));

export const usageAdoptionTask = defineTask('usage-adoption', (args, taskCtx) => ({
  kind: 'agent',
  title: `Usage and Adoption Analysis - ${args.accountName}`,
  agent: {
    name: 'customer-success',
    prompt: {
      role: 'Product adoption specialist',
      task: 'Analyze usage patterns and adoption metrics',
      context: args,
      instructions: [
        'Calculate adoption rate metrics',
        'Identify power users and champions',
        'Analyze feature utilization',
        'Identify underutilized features',
        'Track usage trends over time',
        'Benchmark against similar customers',
        'Identify adoption risks',
        'Develop adoption recommendations'
      ],
      outputFormat: 'JSON with adoptionRate, activeUsers, trends, featureUsage, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['adoptionRate', 'activeUsers', 'artifacts'],
      properties: {
        adoptionRate: { type: 'number', minimum: 0, maximum: 100 },
        activeUsers: { type: 'number' },
        trends: {
          type: 'object',
          properties: {
            userGrowth: { type: 'string' },
            engagementTrend: { type: 'string' },
            usageIntensity: { type: 'string' }
          }
        },
        featureUsage: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              adoption: { type: 'number' },
              trend: { type: 'string' }
            }
          }
        },
        underutilized: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'qbr', 'adoption']
}));

export const supportHealthReviewTask = defineTask('support-health-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Support and Health Review - ${args.accountName}`,
  agent: {
    name: 'customer-success',
    prompt: {
      role: 'Customer health analyst',
      task: 'Review support metrics and overall customer health',
      context: args,
      instructions: [
        'Analyze support ticket trends',
        'Review escalation history',
        'Calculate health score',
        'Identify recurring issues',
        'Assess customer satisfaction',
        'Review response and resolution times',
        'Identify health risks',
        'Develop improvement recommendations'
      ],
      outputFormat: 'JSON with healthScore, supportMetrics, risks, improvements, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['healthScore', 'supportMetrics', 'artifacts'],
      properties: {
        healthScore: { type: 'number', minimum: 0, maximum: 100 },
        supportMetrics: {
          type: 'object',
          properties: {
            totalTickets: { type: 'number' },
            avgResolutionTime: { type: 'string' },
            escalations: { type: 'number' },
            csat: { type: 'number' }
          }
        },
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              severity: { type: 'string' },
              mitigation: { type: 'string' }
            }
          }
        },
        improvements: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'qbr', 'health']
}));

export const goalProgressReviewTask = defineTask('goal-progress-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Goal Progress Review - ${args.accountName}`,
  agent: {
    name: 'customer-success',
    prompt: {
      role: 'Goal tracking specialist',
      task: 'Review progress against previously set goals',
      context: args,
      instructions: [
        'Review goals from previous QBR',
        'Assess progress on each goal',
        'Identify achieved goals',
        'Analyze gaps and blockers',
        'Document lessons learned',
        'Adjust goals as needed',
        'Celebrate wins',
        'Create goal progress summary'
      ],
      outputFormat: 'JSON with progress array, achieved, inProgress, atRisk, lessons, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['progress', 'artifacts'],
      properties: {
        progress: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              goal: { type: 'string' },
              status: { type: 'string', enum: ['achieved', 'on-track', 'at-risk', 'missed'] },
              progress: { type: 'number' },
              notes: { type: 'string' }
            }
          }
        },
        achieved: { type: 'array', items: { type: 'string' } },
        inProgress: { type: 'array', items: { type: 'string' } },
        atRisk: { type: 'array', items: { type: 'string' } },
        lessons: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'qbr', 'goals']
}));

export const expansionOpportunityTask = defineTask('expansion-opportunity', (args, taskCtx) => ({
  kind: 'agent',
  title: `Expansion Opportunities - ${args.accountName}`,
  agent: {
    name: 'account-strategist',
    prompt: {
      role: 'Account expansion specialist',
      task: 'Identify expansion and upsell opportunities',
      context: args,
      instructions: [
        'Identify user expansion opportunities',
        'Identify product/feature upsells',
        'Identify new use case opportunities',
        'Assess cross-sell potential',
        'Evaluate department expansion',
        'Estimate expansion value',
        'Identify timing and triggers',
        'Develop expansion recommendations'
      ],
      outputFormat: 'JSON with opportunities array, totalPotential, recommendations, timing, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['opportunities', 'totalPotential', 'artifacts'],
      properties: {
        opportunities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['users', 'product', 'use-case', 'cross-sell'] },
              description: { type: 'string' },
              value: { type: 'number' },
              probability: { type: 'number' },
              timing: { type: 'string' }
            }
          }
        },
        totalPotential: { type: 'number' },
        recommendations: { type: 'array', items: { type: 'string' } },
        timing: {
          type: 'object',
          properties: {
            nearTerm: { type: 'array', items: { type: 'string' } },
            nextQuarter: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'sales', 'qbr', 'expansion']
}));

export const qbrRiskAssessmentTask = defineTask('qbr-risk-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Risk Assessment - ${args.accountName}`,
  agent: {
    name: 'customer-success',
    prompt: {
      role: 'Customer risk analyst',
      task: 'Assess account risks for proactive management',
      context: args,
      instructions: [
        'Identify churn risk factors',
        'Assess renewal risk',
        'Evaluate competitive threats',
        'Identify stakeholder risks',
        'Assess satisfaction risks',
        'Calculate overall risk level',
        'Develop mitigation strategies',
        'Create risk monitoring plan'
      ],
      outputFormat: 'JSON with riskLevel, risks array, mitigations, monitoringPlan, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['riskLevel', 'risks', 'artifacts'],
      properties: {
        riskLevel: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              category: { type: 'string' },
              severity: { type: 'string' },
              indicators: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        mitigations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              mitigation: { type: 'string' },
              owner: { type: 'string' }
            }
          }
        },
        monitoringPlan: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'qbr', 'risk']
}));

export const nextQuarterPlanningTask = defineTask('next-quarter-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Next Quarter Planning - ${args.accountName}`,
  agent: {
    name: 'customer-success',
    prompt: {
      role: 'Success planning specialist',
      task: 'Plan goals and initiatives for next quarter',
      context: args,
      instructions: [
        'Define next quarter goals with customer',
        'Identify key initiatives',
        'Plan adoption improvements',
        'Schedule training and enablement',
        'Plan expansion conversations',
        'Define success metrics',
        'Assign action items',
        'Set review cadence'
      ],
      outputFormat: 'JSON with goals array, initiatives, actionItems, metrics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['goals', 'actionItems', 'artifacts'],
      properties: {
        goals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              goal: { type: 'string' },
              metric: { type: 'string' },
              target: { type: 'string' },
              owner: { type: 'string' }
            }
          }
        },
        initiatives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              initiative: { type: 'string' },
              description: { type: 'string' },
              timing: { type: 'string' }
            }
          }
        },
        actionItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              owner: { type: 'string' },
              dueDate: { type: 'string' }
            }
          }
        },
        metrics: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'qbr', 'planning']
}));

export const qbrPresentationTask = defineTask('qbr-presentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `QBR Presentation - ${args.accountName}`,
  agent: {
    name: 'customer-success',
    prompt: {
      role: 'QBR presentation specialist',
      task: 'Compile comprehensive QBR presentation',
      context: args,
      instructions: [
        'Create executive summary slide',
        'Build value delivered section',
        'Create adoption metrics section',
        'Add health and support summary',
        'Present goal progress',
        'Highlight expansion opportunities',
        'Present next quarter plan',
        'Include appendix materials'
      ],
      outputFormat: 'JSON with presentation object, slides array, talkingPoints, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['presentation', 'slides', 'artifacts'],
      properties: {
        presentation: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            duration: { type: 'string' },
            audience: { type: 'array', items: { type: 'string' } }
          }
        },
        slides: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              content: { type: 'string' },
              talkingPoints: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        talkingPoints: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'qbr', 'presentation']
}));
