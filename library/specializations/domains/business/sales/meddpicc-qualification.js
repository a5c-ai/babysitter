/**
 * @process sales/meddpicc-qualification
 * @description Comprehensive opportunity qualification using Metrics, Economic Buyer, Decision Criteria, Decision Process, Identify Pain, Champion, Paper Process, and Competition analysis.
 * @inputs { opportunityName: string, accountName: string, dealValue: number, currentStage?: string, knownContacts?: array, competitorIntel?: object }
 * @outputs { success: boolean, qualificationScore: number, meddpiccAnalysis: object, riskAssessment: object, actionPlan: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('sales/meddpicc-qualification', {
 *   opportunityName: 'Enterprise Platform Deal',
 *   accountName: 'Fortune 500 Corp',
 *   dealValue: 500000,
 *   currentStage: 'Discovery',
 *   knownContacts: [{ name: 'Jane Doe', title: 'VP IT' }],
 *   competitorIntel: { mainCompetitor: 'Competitor A', status: 'Also evaluating' }
 * });
 *
 * @references
 * - MEDDIC Academy: https://meddic.academy/
 * - MEDDICC - The Book: https://www.amazon.com/MEDDICC-enterprise-salespeople-qualifying-opportunities/dp/1838231951
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    opportunityName,
    accountName,
    dealValue,
    currentStage = 'Unknown',
    knownContacts = [],
    competitorIntel = {},
    outputDir = 'meddpicc-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting MEDDPICC Qualification for ${opportunityName}`);

  // ============================================================================
  // PHASE 1: METRICS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing Metrics');
  const metricsAnalysis = await ctx.task(metricsAnalysisTask, {
    opportunityName,
    accountName,
    dealValue,
    outputDir
  });

  artifacts.push(...(metricsAnalysis.artifacts || []));

  // ============================================================================
  // PHASE 2: ECONOMIC BUYER IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Identifying Economic Buyer');
  const economicBuyer = await ctx.task(economicBuyerTask, {
    opportunityName,
    accountName,
    dealValue,
    knownContacts,
    outputDir
  });

  artifacts.push(...(economicBuyer.artifacts || []));

  // ============================================================================
  // PHASE 3: DECISION CRITERIA MAPPING
  // ============================================================================

  ctx.log('info', 'Phase 3: Mapping Decision Criteria');
  const decisionCriteria = await ctx.task(decisionCriteriaTask, {
    opportunityName,
    accountName,
    metricsAnalysis,
    economicBuyer,
    outputDir
  });

  artifacts.push(...(decisionCriteria.artifacts || []));

  // ============================================================================
  // PHASE 4: DECISION PROCESS MAPPING
  // ============================================================================

  ctx.log('info', 'Phase 4: Mapping Decision Process');
  const decisionProcess = await ctx.task(decisionProcessTask, {
    opportunityName,
    accountName,
    economicBuyer,
    knownContacts,
    outputDir
  });

  artifacts.push(...(decisionProcess.artifacts || []));

  // ============================================================================
  // PHASE 5: IDENTIFY PAIN
  // ============================================================================

  ctx.log('info', 'Phase 5: Identifying Pain Points');
  const painAnalysis = await ctx.task(identifyPainTask, {
    opportunityName,
    accountName,
    metricsAnalysis,
    outputDir
  });

  artifacts.push(...(painAnalysis.artifacts || []));

  // ============================================================================
  // PHASE 6: CHAMPION ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 6: Assessing Champion');
  const championAssessment = await ctx.task(championAssessmentTask, {
    opportunityName,
    accountName,
    knownContacts,
    economicBuyer,
    painAnalysis,
    outputDir
  });

  artifacts.push(...(championAssessment.artifacts || []));

  // ============================================================================
  // PHASE 7: PAPER PROCESS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 7: Analyzing Paper Process');
  const paperProcess = await ctx.task(paperProcessTask, {
    opportunityName,
    accountName,
    dealValue,
    decisionProcess,
    outputDir
  });

  artifacts.push(...(paperProcess.artifacts || []));

  // ============================================================================
  // PHASE 8: COMPETITION ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 8: Analyzing Competition');
  const competitionAnalysis = await ctx.task(competitionAnalysisTask, {
    opportunityName,
    accountName,
    competitorIntel,
    decisionCriteria,
    outputDir
  });

  artifacts.push(...(competitionAnalysis.artifacts || []));

  // ============================================================================
  // PHASE 9: QUALIFICATION SCORING
  // ============================================================================

  ctx.log('info', 'Phase 9: Calculating Qualification Score');
  const qualificationScore = await ctx.task(qualificationScoringTask, {
    opportunityName,
    dealValue,
    metricsAnalysis,
    economicBuyer,
    decisionCriteria,
    decisionProcess,
    painAnalysis,
    championAssessment,
    paperProcess,
    competitionAnalysis,
    outputDir
  });

  artifacts.push(...(qualificationScore.artifacts || []));

  // Breakpoint: Review qualification
  await ctx.breakpoint({
    question: `MEDDPICC qualification complete for ${opportunityName}. Score: ${qualificationScore.overallScore}/100. Review and approve action plan?`,
    title: 'MEDDPICC Qualification Review',
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
        overallScore: qualificationScore.overallScore,
        componentScores: qualificationScore.componentScores,
        recommendation: qualificationScore.recommendation
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    opportunityName,
    accountName,
    dealValue,
    qualificationScore: qualificationScore.overallScore,
    meddpiccAnalysis: {
      metrics: metricsAnalysis,
      economicBuyer: economicBuyer,
      decisionCriteria: decisionCriteria,
      decisionProcess: decisionProcess,
      identifiedPain: painAnalysis,
      champion: championAssessment,
      paperProcess: paperProcess,
      competition: competitionAnalysis
    },
    riskAssessment: qualificationScore.risks,
    componentScores: qualificationScore.componentScores,
    recommendation: qualificationScore.recommendation,
    actionPlan: qualificationScore.actionPlan,
    artifacts,
    duration,
    metadata: {
      processId: 'sales/meddpicc-qualification',
      timestamp: startTime,
      opportunityName,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const metricsAnalysisTask = defineTask('metrics-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `MEDDPICC Metrics - ${args.opportunityName}`,
  agent: {
    name: 'sales-analyst',
    prompt: {
      role: 'Senior sales analyst specializing in MEDDPICC qualification',
      task: 'Analyze and document the quantifiable business metrics the customer wants to achieve',
      context: args,
      instructions: [
        'Identify the key business metrics the customer is trying to improve',
        'Document specific, measurable goals (revenue increase, cost reduction, etc.)',
        'Quantify the business impact in dollars where possible',
        'Understand the timeline for achieving these metrics',
        'Connect metrics to executive-level priorities',
        'Assess confidence level in metric understanding',
        'Identify gaps in metric knowledge',
        'Suggest questions to uncover missing metrics'
      ],
      outputFormat: 'JSON with metrics array, businessImpact, confidence, gaps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'businessImpact', 'confidence', 'artifacts'],
      properties: {
        metrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              currentValue: { type: 'string' },
              targetValue: { type: 'string' },
              timeline: { type: 'string' },
              dollarImpact: { type: 'string' }
            }
          }
        },
        businessImpact: {
          type: 'object',
          properties: {
            totalValue: { type: 'string' },
            roiPotential: { type: 'string' },
            paybackPeriod: { type: 'string' }
          }
        },
        confidence: { type: 'number', minimum: 0, maximum: 100 },
        gaps: { type: 'array', items: { type: 'string' } },
        discoveryQuestions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'meddpicc', 'metrics']
}));

export const economicBuyerTask = defineTask('economic-buyer', (args, taskCtx) => ({
  kind: 'agent',
  title: `MEDDPICC Economic Buyer - ${args.opportunityName}`,
  agent: {
    name: 'sales-analyst',
    prompt: {
      role: 'Enterprise sales strategist specializing in executive engagement',
      task: 'Identify and analyze the Economic Buyer who has final budget authority',
      context: args,
      instructions: [
        'Identify the person with budget authority for this deal size',
        'Understand their business priorities and personal wins',
        'Assess current level of access to the Economic Buyer',
        'Map the Economic Buyer relationship to our champion',
        'Identify what will get the EB to say yes',
        'Document any competing priorities for budget',
        'Assess risk of EB change during sales cycle',
        'Create engagement strategy for EB access'
      ],
      outputFormat: 'JSON with economicBuyer object, accessLevel, engagementStrategy, risks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['economicBuyer', 'accessLevel', 'artifacts'],
      properties: {
        economicBuyer: {
          type: 'object',
          properties: {
            identified: { type: 'boolean' },
            name: { type: 'string' },
            title: { type: 'string' },
            priorities: { type: 'array', items: { type: 'string' } },
            personalWin: { type: 'string' },
            budgetAuthority: { type: 'string' }
          }
        },
        accessLevel: { type: 'string', enum: ['direct', 'indirect', 'none'] },
        accessPath: { type: 'string' },
        engagementStrategy: {
          type: 'object',
          properties: {
            approach: { type: 'string' },
            messaging: { type: 'string' },
            proofPoints: { type: 'array', items: { type: 'string' } }
          }
        },
        risks: { type: 'array', items: { type: 'string' } },
        confidence: { type: 'number', minimum: 0, maximum: 100 },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'meddpicc', 'economic-buyer']
}));

export const decisionCriteriaTask = defineTask('decision-criteria', (args, taskCtx) => ({
  kind: 'agent',
  title: `MEDDPICC Decision Criteria - ${args.opportunityName}`,
  agent: {
    name: 'sales-analyst',
    prompt: {
      role: 'Sales strategist specializing in competitive positioning',
      task: 'Map and influence the technical and business decision criteria',
      context: args,
      instructions: [
        'Identify all formal and informal decision criteria',
        'Separate technical criteria from business criteria',
        'Assess our strength against each criterion',
        'Identify which criteria favor us vs competitors',
        'Develop strategies to add favorable criteria',
        'Identify how to de-emphasize unfavorable criteria',
        'Document must-have vs nice-to-have criteria',
        'Assess who owns each criterion'
      ],
      outputFormat: 'JSON with criteria array, strengthAssessment, influenceStrategy, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['criteria', 'strengthAssessment', 'artifacts'],
      properties: {
        criteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              type: { type: 'string', enum: ['technical', 'business', 'financial', 'cultural'] },
              importance: { type: 'string', enum: ['must-have', 'important', 'nice-to-have'] },
              owner: { type: 'string' },
              ourStrength: { type: 'string', enum: ['strong', 'neutral', 'weak'] },
              competitorStrength: { type: 'string', enum: ['strong', 'neutral', 'weak'] }
            }
          }
        },
        strengthAssessment: {
          type: 'object',
          properties: {
            strongAreas: { type: 'array', items: { type: 'string' } },
            weakAreas: { type: 'array', items: { type: 'string' } },
            overallFit: { type: 'string' }
          }
        },
        influenceStrategy: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              action: { type: 'string' },
              owner: { type: 'string' }
            }
          }
        },
        confidence: { type: 'number', minimum: 0, maximum: 100 },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'meddpicc', 'decision-criteria']
}));

export const decisionProcessTask = defineTask('decision-process', (args, taskCtx) => ({
  kind: 'agent',
  title: `MEDDPICC Decision Process - ${args.opportunityName}`,
  agent: {
    name: 'sales-analyst',
    prompt: {
      role: 'Enterprise sales process expert',
      task: 'Map the customer decision-making process and timeline',
      context: args,
      instructions: [
        'Document each step in the buying process',
        'Identify all stakeholders involved at each stage',
        'Map the approval workflow and sign-off requirements',
        'Understand the timeline for each decision step',
        'Identify potential blockers or delays',
        'Document any formal evaluation processes (RFP, POC)',
        'Assess where we are in the process',
        'Identify next steps and owners'
      ],
      outputFormat: 'JSON with processSteps array, timeline, stakeholders, currentPosition, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['processSteps', 'timeline', 'artifacts'],
      properties: {
        processSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              description: { type: 'string' },
              stakeholders: { type: 'array', items: { type: 'string' } },
              duration: { type: 'string' },
              status: { type: 'string', enum: ['completed', 'current', 'upcoming', 'unknown'] }
            }
          }
        },
        timeline: {
          type: 'object',
          properties: {
            expectedClose: { type: 'string' },
            nextMilestone: { type: 'string' },
            keyDates: { type: 'array', items: { type: 'object' } }
          }
        },
        stakeholders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              role: { type: 'string' },
              influence: { type: 'string' },
              sentiment: { type: 'string' }
            }
          }
        },
        currentPosition: { type: 'string' },
        blockers: { type: 'array', items: { type: 'string' } },
        confidence: { type: 'number', minimum: 0, maximum: 100 },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'meddpicc', 'decision-process']
}));

export const identifyPainTask = defineTask('identify-pain', (args, taskCtx) => ({
  kind: 'agent',
  title: `MEDDPICC Identify Pain - ${args.opportunityName}`,
  agent: {
    name: 'sales-analyst',
    prompt: {
      role: 'Sales discovery expert specializing in pain identification',
      task: 'Identify and quantify the customer pain points driving this initiative',
      context: args,
      instructions: [
        'Document explicit pain points the customer has shared',
        'Identify implicit pains they may not have articulated',
        'Quantify the cost of each pain point',
        'Understand who owns each pain point',
        'Assess urgency level for addressing each pain',
        'Connect pains to business metrics',
        'Identify what happens if pains are not addressed',
        'Map pains to your solution capabilities'
      ],
      outputFormat: 'JSON with pains array, painHierarchy, urgencyAssessment, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['pains', 'urgencyAssessment', 'artifacts'],
      properties: {
        pains: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pain: { type: 'string' },
              type: { type: 'string', enum: ['explicit', 'implicit'] },
              owner: { type: 'string' },
              quantifiedCost: { type: 'string' },
              urgency: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              solutionMapping: { type: 'string' }
            }
          }
        },
        painHierarchy: {
          type: 'object',
          properties: {
            primaryPain: { type: 'string' },
            secondaryPains: { type: 'array', items: { type: 'string' } },
            consequenceOfInaction: { type: 'string' }
          }
        },
        urgencyAssessment: {
          type: 'object',
          properties: {
            overallUrgency: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
            compellingEvent: { type: 'string' },
            timelineDriver: { type: 'string' }
          }
        },
        confidence: { type: 'number', minimum: 0, maximum: 100 },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'meddpicc', 'identify-pain']
}));

export const championAssessmentTask = defineTask('champion-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `MEDDPICC Champion - ${args.opportunityName}`,
  agent: {
    name: 'sales-analyst',
    prompt: {
      role: 'Enterprise sales relationship strategist',
      task: 'Assess and develop internal champion for the opportunity',
      context: args,
      instructions: [
        'Identify potential champion candidates',
        'Assess champion criteria: power, influence, personal win, selling ability',
        'Test champion commitment through actions',
        'Understand champion personal motivation',
        'Assess champion access to Economic Buyer',
        'Evaluate champion willingness to sell internally',
        'Identify champion development needs',
        'Create champion enablement plan'
      ],
      outputFormat: 'JSON with champion object, assessment, developmentPlan, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['champion', 'assessment', 'artifacts'],
      properties: {
        champion: {
          type: 'object',
          properties: {
            identified: { type: 'boolean' },
            name: { type: 'string' },
            title: { type: 'string' },
            personalWin: { type: 'string' },
            accessToEB: { type: 'string' },
            sellingAbility: { type: 'string' }
          }
        },
        assessment: {
          type: 'object',
          properties: {
            power: { type: 'number', minimum: 0, maximum: 10 },
            influence: { type: 'number', minimum: 0, maximum: 10 },
            commitment: { type: 'number', minimum: 0, maximum: 10 },
            sellingSkill: { type: 'number', minimum: 0, maximum: 10 },
            overallScore: { type: 'number', minimum: 0, maximum: 100 }
          }
        },
        commitmentTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              test: { type: 'string' },
              result: { type: 'string', enum: ['passed', 'failed', 'pending'] }
            }
          }
        },
        developmentPlan: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              objective: { type: 'string' },
              timing: { type: 'string' }
            }
          }
        },
        confidence: { type: 'number', minimum: 0, maximum: 100 },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'meddpicc', 'champion']
}));

export const paperProcessTask = defineTask('paper-process', (args, taskCtx) => ({
  kind: 'agent',
  title: `MEDDPICC Paper Process - ${args.opportunityName}`,
  agent: {
    name: 'sales-analyst',
    prompt: {
      role: 'Sales operations and contracting expert',
      task: 'Map the procurement, legal, and contracting process',
      context: args,
      instructions: [
        'Document the procurement workflow',
        'Identify legal and security review requirements',
        'Understand contract approval requirements',
        'Map vendor onboarding process',
        'Identify typical timeline for paper process',
        'Document standard terms and common redlines',
        'Identify who owns procurement relationship',
        'Assess potential paper process risks'
      ],
      outputFormat: 'JSON with paperProcess object, timeline, stakeholders, risks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['paperProcess', 'timeline', 'artifacts'],
      properties: {
        paperProcess: {
          type: 'object',
          properties: {
            procurementRequired: { type: 'boolean' },
            legalReviewRequired: { type: 'boolean' },
            securityReviewRequired: { type: 'boolean' },
            contractVehicle: { type: 'string' },
            standardTerms: { type: 'boolean' }
          }
        },
        processSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              owner: { type: 'string' },
              duration: { type: 'string' },
              status: { type: 'string' }
            }
          }
        },
        timeline: {
          type: 'object',
          properties: {
            estimatedDuration: { type: 'string' },
            parallelActivities: { type: 'array', items: { type: 'string' } },
            criticalPath: { type: 'array', items: { type: 'string' } }
          }
        },
        potentialIssues: { type: 'array', items: { type: 'string' } },
        mitigations: { type: 'array', items: { type: 'string' } },
        confidence: { type: 'number', minimum: 0, maximum: 100 },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'meddpicc', 'paper-process']
}));

export const competitionAnalysisTask = defineTask('competition-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `MEDDPICC Competition - ${args.opportunityName}`,
  agent: {
    name: 'sales-analyst',
    prompt: {
      role: 'Competitive intelligence analyst',
      task: 'Analyze competitive landscape and develop winning strategy',
      context: args,
      instructions: [
        'Identify all competitors in the deal',
        'Assess competitor strengths and weaknesses',
        'Understand competitor relationships in account',
        'Map competitor strategy and positioning',
        'Identify competitive traps and landmines',
        'Develop counter-positioning strategies',
        'Assess win probability vs each competitor',
        'Create competitive battle plan'
      ],
      outputFormat: 'JSON with competitors array, competitivePosition, battlePlan, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['competitors', 'competitivePosition', 'artifacts'],
      properties: {
        competitors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              status: { type: 'string', enum: ['active', 'incumbent', 'potential', 'eliminated'] },
              strengths: { type: 'array', items: { type: 'string' } },
              weaknesses: { type: 'array', items: { type: 'string' } },
              relationship: { type: 'string' },
              strategy: { type: 'string' }
            }
          }
        },
        competitivePosition: {
          type: 'object',
          properties: {
            primaryThreat: { type: 'string' },
            differentiators: { type: 'array', items: { type: 'string' } },
            vulnerabilities: { type: 'array', items: { type: 'string' } },
            winProbability: { type: 'number', minimum: 0, maximum: 100 }
          }
        },
        battlePlan: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              competitor: { type: 'string' },
              strategy: { type: 'string' },
              tactics: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        traps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'meddpicc', 'competition']
}));

export const qualificationScoringTask = defineTask('qualification-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `MEDDPICC Qualification Score - ${args.opportunityName}`,
  agent: {
    name: 'sales-analyst',
    prompt: {
      role: 'Sales qualification and forecasting expert',
      task: 'Calculate overall qualification score and generate action plan',
      context: args,
      instructions: [
        'Score each MEDDPICC component (0-100)',
        'Weight scores based on deal stage and value',
        'Calculate overall qualification score',
        'Identify highest risk areas',
        'Generate prioritized action plan',
        'Provide go/no-go recommendation',
        'Estimate win probability',
        'Define next milestone criteria'
      ],
      outputFormat: 'JSON with componentScores, overallScore, risks, actionPlan, recommendation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['componentScores', 'overallScore', 'actionPlan', 'recommendation', 'artifacts'],
      properties: {
        componentScores: {
          type: 'object',
          properties: {
            metrics: { type: 'number' },
            economicBuyer: { type: 'number' },
            decisionCriteria: { type: 'number' },
            decisionProcess: { type: 'number' },
            identifyPain: { type: 'number' },
            champion: { type: 'number' },
            paperProcess: { type: 'number' },
            competition: { type: 'number' }
          }
        },
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        winProbability: { type: 'number', minimum: 0, maximum: 100 },
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              risk: { type: 'string' },
              severity: { type: 'string', enum: ['high', 'medium', 'low'] },
              mitigation: { type: 'string' }
            }
          }
        },
        actionPlan: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              area: { type: 'string' },
              owner: { type: 'string' },
              dueDate: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        recommendation: {
          type: 'object',
          properties: {
            decision: { type: 'string', enum: ['pursue', 'qualify-further', 'deprioritize', 'no-go'] },
            rationale: { type: 'string' },
            conditions: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'sales', 'meddpicc', 'qualification-scoring']
}));
