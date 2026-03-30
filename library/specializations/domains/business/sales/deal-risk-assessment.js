/**
 * @process sales/deal-risk-assessment
 * @description Methodology for identifying deal risks, assessing probability of close, and developing mitigation strategies for at-risk opportunities.
 * @inputs { opportunityName: string, dealValue: number, currentStage: string, closeDate: string, dealData: object, competitorInfo?: object }
 * @outputs { success: boolean, riskScore: number, riskCategories: object, mitigationPlan: array, probabilityAssessment: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('sales/deal-risk-assessment', {
 *   opportunityName: 'Enterprise Platform Deal',
 *   dealValue: 250000,
 *   currentStage: 'Negotiation',
 *   closeDate: '2024-03-31',
 *   dealData: { champion: 'VP IT', competition: 'active' }
 * });
 *
 * @references
 * - Gong Deal Intelligence: https://www.gong.io/
 * - Miller Heiman Blue Sheet: https://www.millerheimangroup.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    opportunityName,
    dealValue,
    currentStage,
    closeDate,
    dealData = {},
    competitorInfo = {},
    outputDir = 'deal-risk-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Deal Risk Assessment for ${opportunityName}`);

  // ============================================================================
  // PHASE 1: BUYER ENGAGEMENT RISK ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing Buyer Engagement Risks');
  const buyerEngagementRisk = await ctx.task(buyerEngagementRiskTask, {
    opportunityName,
    dealData,
    outputDir
  });

  artifacts.push(...(buyerEngagementRisk.artifacts || []));

  // ============================================================================
  // PHASE 2: COMPETITIVE RISK ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing Competitive Risks');
  const competitiveRisk = await ctx.task(competitiveRiskTask, {
    opportunityName,
    dealData,
    competitorInfo,
    outputDir
  });

  artifacts.push(...(competitiveRisk.artifacts || []));

  // ============================================================================
  // PHASE 3: TIMELINE RISK ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing Timeline Risks');
  const timelineRisk = await ctx.task(timelineRiskTask, {
    opportunityName,
    currentStage,
    closeDate,
    dealData,
    outputDir
  });

  artifacts.push(...(timelineRisk.artifacts || []));

  // ============================================================================
  // PHASE 4: BUDGET AND APPROVAL RISK
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing Budget and Approval Risks');
  const budgetRisk = await ctx.task(budgetApprovalRiskTask, {
    opportunityName,
    dealValue,
    dealData,
    outputDir
  });

  artifacts.push(...(budgetRisk.artifacts || []));

  // ============================================================================
  // PHASE 5: SOLUTION FIT RISK
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing Solution Fit Risks');
  const solutionFitRisk = await ctx.task(solutionFitRiskTask, {
    opportunityName,
    dealData,
    outputDir
  });

  artifacts.push(...(solutionFitRisk.artifacts || []));

  // ============================================================================
  // PHASE 6: EXECUTION RISK ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing Execution Risks');
  const executionRisk = await ctx.task(executionRiskTask, {
    opportunityName,
    dealData,
    currentStage,
    outputDir
  });

  artifacts.push(...(executionRisk.artifacts || []));

  // ============================================================================
  // PHASE 7: COMPOSITE RISK SCORING
  // ============================================================================

  ctx.log('info', 'Phase 7: Calculating Composite Risk Score');
  const compositeRisk = await ctx.task(compositeRiskScoringTask, {
    opportunityName,
    dealValue,
    buyerEngagementRisk,
    competitiveRisk,
    timelineRisk,
    budgetRisk,
    solutionFitRisk,
    executionRisk,
    outputDir
  });

  artifacts.push(...(compositeRisk.artifacts || []));

  // ============================================================================
  // PHASE 8: MITIGATION PLAN DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 8: Developing Mitigation Plan');
  const mitigationPlan = await ctx.task(mitigationPlanTask, {
    opportunityName,
    compositeRisk,
    buyerEngagementRisk,
    competitiveRisk,
    timelineRisk,
    budgetRisk,
    outputDir
  });

  artifacts.push(...(mitigationPlan.artifacts || []));

  // Breakpoint: Review risk assessment
  await ctx.breakpoint({
    question: `Deal risk assessment complete for ${opportunityName}. Risk Score: ${compositeRisk.overallRiskScore}/100. Review mitigation plan?`,
    title: 'Deal Risk Assessment Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        label: a.label || undefined
      })),
      summary: {
        opportunityName,
        dealValue,
        overallRiskScore: compositeRisk.overallRiskScore,
        riskLevel: compositeRisk.riskLevel,
        topRisks: compositeRisk.topRisks,
        mitigationActionsCount: mitigationPlan.actions?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    opportunityName,
    dealValue,
    riskScore: compositeRisk.overallRiskScore,
    riskLevel: compositeRisk.riskLevel,
    riskCategories: {
      buyerEngagement: buyerEngagementRisk.riskScore,
      competitive: competitiveRisk.riskScore,
      timeline: timelineRisk.riskScore,
      budget: budgetRisk.riskScore,
      solutionFit: solutionFitRisk.riskScore,
      execution: executionRisk.riskScore
    },
    topRisks: compositeRisk.topRisks,
    mitigationPlan: mitigationPlan.actions,
    probabilityAssessment: {
      currentProbability: compositeRisk.adjustedProbability,
      potentialProbability: mitigationPlan.potentialProbability,
      confidenceLevel: compositeRisk.confidenceLevel
    },
    earlyWarningIndicators: compositeRisk.earlyWarnings,
    artifacts,
    duration,
    metadata: {
      processId: 'sales/deal-risk-assessment',
      timestamp: startTime,
      opportunityName,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const buyerEngagementRiskTask = defineTask('buyer-engagement-risk', (args, taskCtx) => ({
  kind: 'agent',
  title: `Buyer Engagement Risk - ${args.opportunityName}`,
  agent: {
    name: 'sales-analyst',
    prompt: {
      role: 'Deal risk analyst specializing in buyer behavior',
      task: 'Assess risks related to buyer engagement and stakeholder dynamics',
      context: args,
      instructions: [
        'Assess champion strength and engagement',
        'Evaluate economic buyer access and sentiment',
        'Identify missing stakeholder relationships',
        'Assess multi-threading coverage',
        'Evaluate recent engagement trends',
        'Identify ghosting or disengagement signals',
        'Assess political risks within buying committee',
        'Score overall buyer engagement risk'
      ],
      outputFormat: 'JSON with riskScore, riskFactors, indicators, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['riskScore', 'riskFactors', 'artifacts'],
      properties: {
        riskScore: { type: 'number', minimum: 0, maximum: 100 },
        riskFactors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              factor: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              evidence: { type: 'string' }
            }
          }
        },
        indicators: {
          type: 'object',
          properties: {
            championStrength: { type: 'string' },
            ebAccess: { type: 'string' },
            stakeholderCoverage: { type: 'string' },
            engagementTrend: { type: 'string' }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'deal-risk', 'buyer-engagement']
}));

export const competitiveRiskTask = defineTask('competitive-risk', (args, taskCtx) => ({
  kind: 'agent',
  title: `Competitive Risk - ${args.opportunityName}`,
  agent: {
    name: 'sales-analyst',
    prompt: {
      role: 'Competitive intelligence analyst',
      task: 'Assess competitive risks threatening deal closure',
      context: args,
      instructions: [
        'Identify all active competitors',
        'Assess competitor positioning and relationships',
        'Evaluate decision criteria alignment',
        'Identify competitive landmines',
        'Assess incumbent advantage risks',
        'Evaluate price competitiveness',
        'Identify feature/function gaps',
        'Score competitive risk level'
      ],
      outputFormat: 'JSON with riskScore, competitors, vulnerabilities, counterStrategies, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['riskScore', 'competitors', 'artifacts'],
      properties: {
        riskScore: { type: 'number', minimum: 0, maximum: 100 },
        competitors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              threatLevel: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              strengths: { type: 'array', items: { type: 'string' } },
              relationship: { type: 'string' }
            }
          }
        },
        vulnerabilities: { type: 'array', items: { type: 'string' } },
        counterStrategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              competitor: { type: 'string' },
              strategy: { type: 'string' }
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
  labels: ['agent', 'sales', 'deal-risk', 'competitive']
}));

export const timelineRiskTask = defineTask('timeline-risk', (args, taskCtx) => ({
  kind: 'agent',
  title: `Timeline Risk - ${args.opportunityName}`,
  agent: {
    name: 'sales-analyst',
    prompt: {
      role: 'Sales cycle analyst',
      task: 'Assess risks related to deal timeline and close date',
      context: args,
      instructions: [
        'Evaluate close date realism',
        'Assess remaining process steps vs time',
        'Identify timeline dependencies',
        'Evaluate compelling event strength',
        'Assess buyer urgency signals',
        'Identify potential delays',
        'Evaluate decision process timeline',
        'Score timeline risk'
      ],
      outputFormat: 'JSON with riskScore, timelineFactors, slipRisk, compellingEvent, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['riskScore', 'timelineFactors', 'artifacts'],
      properties: {
        riskScore: { type: 'number', minimum: 0, maximum: 100 },
        timelineFactors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              factor: { type: 'string' },
              impact: { type: 'string' },
              likelihood: { type: 'string' }
            }
          }
        },
        slipRisk: {
          type: 'object',
          properties: {
            probability: { type: 'number' },
            likelySlipDays: { type: 'number' },
            reasons: { type: 'array', items: { type: 'string' } }
          }
        },
        compellingEvent: {
          type: 'object',
          properties: {
            exists: { type: 'boolean' },
            strength: { type: 'string' },
            description: { type: 'string' }
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
  labels: ['agent', 'sales', 'deal-risk', 'timeline']
}));

export const budgetApprovalRiskTask = defineTask('budget-approval-risk', (args, taskCtx) => ({
  kind: 'agent',
  title: `Budget and Approval Risk - ${args.opportunityName}`,
  agent: {
    name: 'sales-analyst',
    prompt: {
      role: 'Enterprise deal analyst',
      task: 'Assess budget availability and approval process risks',
      context: args,
      instructions: [
        'Verify budget availability and source',
        'Assess approval process complexity',
        'Identify approval chain stakeholders',
        'Evaluate competing budget priorities',
        'Assess procurement involvement',
        'Identify legal/security review requirements',
        'Evaluate pricing sensitivity',
        'Score budget and approval risk'
      ],
      outputFormat: 'JSON with riskScore, budgetStatus, approvalProcess, blockers, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['riskScore', 'budgetStatus', 'artifacts'],
      properties: {
        riskScore: { type: 'number', minimum: 0, maximum: 100 },
        budgetStatus: {
          type: 'object',
          properties: {
            confirmed: { type: 'boolean' },
            amount: { type: 'string' },
            source: { type: 'string' },
            competingPriorities: { type: 'array', items: { type: 'string' } }
          }
        },
        approvalProcess: {
          type: 'object',
          properties: {
            complexity: { type: 'string', enum: ['simple', 'moderate', 'complex'] },
            approversIdentified: { type: 'boolean' },
            estimatedDuration: { type: 'string' }
          }
        },
        blockers: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'deal-risk', 'budget']
}));

export const solutionFitRiskTask = defineTask('solution-fit-risk', (args, taskCtx) => ({
  kind: 'agent',
  title: `Solution Fit Risk - ${args.opportunityName}`,
  agent: {
    name: 'sales-analyst',
    prompt: {
      role: 'Solution consultant',
      task: 'Assess risks related to solution fit and technical requirements',
      context: args,
      instructions: [
        'Evaluate requirements coverage',
        'Identify feature gaps',
        'Assess integration complexity',
        'Evaluate technical proof completion',
        'Identify implementation risks',
        'Assess support requirements',
        'Evaluate customization needs',
        'Score solution fit risk'
      ],
      outputFormat: 'JSON with riskScore, fitAssessment, gaps, technicalRisks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['riskScore', 'fitAssessment', 'artifacts'],
      properties: {
        riskScore: { type: 'number', minimum: 0, maximum: 100 },
        fitAssessment: {
          type: 'object',
          properties: {
            overallFit: { type: 'string', enum: ['excellent', 'good', 'adequate', 'poor'] },
            requirementsCoverage: { type: 'number' },
            criticalRequirementsMet: { type: 'boolean' }
          }
        },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              requirement: { type: 'string' },
              severity: { type: 'string' },
              workaround: { type: 'string' }
            }
          }
        },
        technicalRisks: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'deal-risk', 'solution-fit']
}));

export const executionRiskTask = defineTask('execution-risk', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execution Risk - ${args.opportunityName}`,
  agent: {
    name: 'sales-analyst',
    prompt: {
      role: 'Sales execution analyst',
      task: 'Assess internal execution risks that could impact deal closure',
      context: args,
      instructions: [
        'Evaluate sales team execution quality',
        'Assess resource availability',
        'Identify internal dependencies',
        'Evaluate proposal/pricing readiness',
        'Assess deal desk/legal capacity',
        'Identify handoff risks',
        'Evaluate support commitment',
        'Score execution risk'
      ],
      outputFormat: 'JSON with riskScore, executionFactors, resourceGaps, dependencies, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['riskScore', 'executionFactors', 'artifacts'],
      properties: {
        riskScore: { type: 'number', minimum: 0, maximum: 100 },
        executionFactors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              factor: { type: 'string' },
              status: { type: 'string' },
              risk: { type: 'string' }
            }
          }
        },
        resourceGaps: { type: 'array', items: { type: 'string' } },
        dependencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dependency: { type: 'string' },
              owner: { type: 'string' },
              status: { type: 'string' }
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
  labels: ['agent', 'sales', 'deal-risk', 'execution']
}));

export const compositeRiskScoringTask = defineTask('composite-risk-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Composite Risk Scoring - ${args.opportunityName}`,
  agent: {
    name: 'sales-analyst',
    prompt: {
      role: 'Deal scoring specialist',
      task: 'Calculate composite risk score and adjusted probability',
      context: args,
      instructions: [
        'Weight risk categories by importance',
        'Calculate composite risk score',
        'Determine overall risk level',
        'Identify top 3-5 risks',
        'Calculate adjusted win probability',
        'Identify early warning indicators',
        'Assess confidence in scoring',
        'Provide risk summary'
      ],
      outputFormat: 'JSON with overallRiskScore, riskLevel, topRisks, adjustedProbability, earlyWarnings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallRiskScore', 'riskLevel', 'topRisks', 'artifacts'],
      properties: {
        overallRiskScore: { type: 'number', minimum: 0, maximum: 100 },
        riskLevel: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
        categoryWeights: { type: 'object' },
        topRisks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              category: { type: 'string' },
              severity: { type: 'string' }
            }
          }
        },
        adjustedProbability: { type: 'number', minimum: 0, maximum: 100 },
        confidenceLevel: { type: 'number', minimum: 0, maximum: 100 },
        earlyWarnings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'deal-risk', 'composite-scoring']
}));

export const mitigationPlanTask = defineTask('mitigation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Mitigation Plan - ${args.opportunityName}`,
  agent: {
    name: 'sales-strategist',
    prompt: {
      role: 'Deal strategy consultant',
      task: 'Develop risk mitigation plan to improve win probability',
      context: args,
      instructions: [
        'Prioritize risks for mitigation',
        'Develop specific mitigation actions',
        'Assign owners and deadlines',
        'Estimate impact of mitigation',
        'Create contingency plans',
        'Define escalation triggers',
        'Calculate potential probability improvement',
        'Create mitigation timeline'
      ],
      outputFormat: 'JSON with actions array, contingencies, potentialProbability, timeline, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['actions', 'potentialProbability', 'artifacts'],
      properties: {
        actions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              action: { type: 'string' },
              owner: { type: 'string' },
              deadline: { type: 'string' },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] },
              effort: { type: 'string' }
            }
          }
        },
        contingencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              trigger: { type: 'string' },
              action: { type: 'string' }
            }
          }
        },
        potentialProbability: { type: 'number', minimum: 0, maximum: 100 },
        probabilityImprovementRange: {
          type: 'object',
          properties: {
            minimum: { type: 'number' },
            maximum: { type: 'number' }
          }
        },
        timeline: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'deal-risk', 'mitigation']
}));
