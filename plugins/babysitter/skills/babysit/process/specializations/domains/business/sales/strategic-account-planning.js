/**
 * @process sales/strategic-account-planning
 * @description Comprehensive framework for developing account plans including stakeholder mapping, opportunity identification, and coordinated engagement strategies.
 * @inputs { accountName: string, accountData: object, currentRevenue?: number, targetRevenue?: number, industry: string, strategicPriority?: string }
 * @outputs { success: boolean, accountPlan: object, stakeholderMap: object, opportunityPipeline: array, engagementStrategy: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('sales/strategic-account-planning', {
 *   accountName: 'Global Enterprise Corp',
 *   accountData: { contacts: [], opportunities: [], products: [] },
 *   currentRevenue: 500000,
 *   targetRevenue: 1000000,
 *   industry: 'Financial Services',
 *   strategicPriority: 'Tier 1'
 * });
 *
 * @references
 * - Miller Heiman Strategic Selling: https://www.amazon.com/New-Strategic-Selling-Successful-Complex/dp/0446695190
 * - RAIN Group Key Account Management: https://www.rainsalestraining.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    accountName,
    accountData = {},
    currentRevenue = 0,
    targetRevenue = 0,
    industry,
    strategicPriority = 'Standard',
    planningHorizon = '12 months',
    outputDir = 'account-planning-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Strategic Account Planning for ${accountName}`);

  // ============================================================================
  // PHASE 1: ACCOUNT PROFILE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing Account Profile');
  const accountProfile = await ctx.task(accountProfileAnalysisTask, {
    accountName,
    accountData,
    industry,
    currentRevenue,
    outputDir
  });

  artifacts.push(...(accountProfile.artifacts || []));

  // ============================================================================
  // PHASE 2: STAKEHOLDER MAPPING
  // ============================================================================

  ctx.log('info', 'Phase 2: Mapping Stakeholders');
  const stakeholderMapping = await ctx.task(stakeholderMappingTask, {
    accountName,
    accountData,
    industry,
    outputDir
  });

  artifacts.push(...(stakeholderMapping.artifacts || []));

  // ============================================================================
  // PHASE 3: RELATIONSHIP ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Assessing Relationships');
  const relationshipAssessment = await ctx.task(relationshipAssessmentTask, {
    accountName,
    stakeholderMapping,
    accountData,
    outputDir
  });

  artifacts.push(...(relationshipAssessment.artifacts || []));

  // ============================================================================
  // PHASE 4: WHITESPACE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing Whitespace');
  const whitespaceAnalysis = await ctx.task(whitespaceAnalysisTask, {
    accountName,
    accountProfile,
    accountData,
    targetRevenue,
    currentRevenue,
    outputDir
  });

  artifacts.push(...(whitespaceAnalysis.artifacts || []));

  // ============================================================================
  // PHASE 5: COMPETITIVE LANDSCAPE
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing Competitive Landscape');
  const competitiveLandscape = await ctx.task(accountCompetitiveTask, {
    accountName,
    accountData,
    industry,
    outputDir
  });

  artifacts.push(...(competitiveLandscape.artifacts || []));

  // ============================================================================
  // PHASE 6: OPPORTUNITY IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Identifying Opportunities');
  const opportunityIdentification = await ctx.task(opportunityIdentificationTask, {
    accountName,
    whitespaceAnalysis,
    accountProfile,
    stakeholderMapping,
    targetRevenue,
    outputDir
  });

  artifacts.push(...(opportunityIdentification.artifacts || []));

  // ============================================================================
  // PHASE 7: ENGAGEMENT STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 7: Developing Engagement Strategy');
  const engagementStrategy = await ctx.task(engagementStrategyTask, {
    accountName,
    stakeholderMapping,
    relationshipAssessment,
    opportunityIdentification,
    strategicPriority,
    outputDir
  });

  artifacts.push(...(engagementStrategy.artifacts || []));

  // ============================================================================
  // PHASE 8: ACCOUNT PLAN COMPILATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Compiling Account Plan');
  const accountPlan = await ctx.task(accountPlanCompilationTask, {
    accountName,
    accountProfile,
    stakeholderMapping,
    relationshipAssessment,
    whitespaceAnalysis,
    competitiveLandscape,
    opportunityIdentification,
    engagementStrategy,
    currentRevenue,
    targetRevenue,
    planningHorizon,
    outputDir
  });

  artifacts.push(...(accountPlan.artifacts || []));

  // Breakpoint: Review account plan
  await ctx.breakpoint({
    question: `Strategic Account Plan complete for ${accountName}. Target: $${targetRevenue}. Review and approve?`,
    title: 'Strategic Account Plan Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        label: a.label || undefined
      })),
      summary: {
        accountName,
        currentRevenue,
        targetRevenue,
        growthTarget: targetRevenue - currentRevenue,
        opportunitiesIdentified: opportunityIdentification.opportunities?.length || 0,
        stakeholdersCovered: stakeholderMapping.stakeholders?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    accountName,
    accountPlan: accountPlan.plan,
    stakeholderMap: stakeholderMapping.stakeholderMap,
    relationshipScorecard: relationshipAssessment.scorecard,
    whitespace: whitespaceAnalysis.opportunities,
    opportunityPipeline: opportunityIdentification.opportunities,
    engagementStrategy: engagementStrategy.strategy,
    competitiveLandscape: competitiveLandscape.landscape,
    financials: {
      currentRevenue,
      targetRevenue,
      growthTarget: targetRevenue - currentRevenue,
      growthPercentage: currentRevenue > 0 ? ((targetRevenue - currentRevenue) / currentRevenue * 100).toFixed(1) : 0
    },
    artifacts,
    duration,
    metadata: {
      processId: 'sales/strategic-account-planning',
      timestamp: startTime,
      accountName,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const accountProfileAnalysisTask = defineTask('account-profile-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Account Profile Analysis - ${args.accountName}`,
  agent: {
    name: 'account-strategist',
    prompt: {
      role: 'Strategic account manager and business analyst',
      task: 'Analyze comprehensive account profile and business context',
      context: args,
      instructions: [
        'Analyze company overview and business model',
        'Identify strategic initiatives and priorities',
        'Assess financial health and growth trajectory',
        'Map organizational structure',
        'Identify key business challenges',
        'Understand technology landscape',
        'Assess our current footprint and penetration',
        'Identify account potential score'
      ],
      outputFormat: 'JSON with profile object, strategicInitiatives, challenges, footprint, potential, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['profile', 'strategicInitiatives', 'artifacts'],
      properties: {
        profile: {
          type: 'object',
          properties: {
            overview: { type: 'string' },
            industry: { type: 'string' },
            size: { type: 'string' },
            financialHealth: { type: 'string' },
            growthStage: { type: 'string' }
          }
        },
        strategicInitiatives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              initiative: { type: 'string' },
              priority: { type: 'string' },
              relevance: { type: 'string' }
            }
          }
        },
        challenges: { type: 'array', items: { type: 'string' } },
        footprint: {
          type: 'object',
          properties: {
            currentProducts: { type: 'array', items: { type: 'string' } },
            departments: { type: 'array', items: { type: 'string' } },
            penetrationLevel: { type: 'string' }
          }
        },
        potential: {
          type: 'object',
          properties: {
            score: { type: 'number', minimum: 0, maximum: 100 },
            rationale: { type: 'string' }
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
  labels: ['agent', 'sales', 'account-planning', 'profile']
}));

export const stakeholderMappingTask = defineTask('stakeholder-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: `Stakeholder Mapping - ${args.accountName}`,
  agent: {
    name: 'account-strategist',
    prompt: {
      role: 'Stakeholder relationship strategist',
      task: 'Map all relevant stakeholders and their influence',
      context: args,
      instructions: [
        'Identify all key stakeholders by function',
        'Map decision-making authority',
        'Assess influence levels',
        'Identify buying committee for typical purchases',
        'Map political relationships',
        'Identify champions and detractors',
        'Assess access levels',
        'Create org chart with influence overlay'
      ],
      outputFormat: 'JSON with stakeholders array, stakeholderMap, buyingCenter, gaps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['stakeholders', 'stakeholderMap', 'artifacts'],
      properties: {
        stakeholders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              title: { type: 'string' },
              function: { type: 'string' },
              influence: { type: 'string', enum: ['executive', 'high', 'medium', 'low'] },
              buyingRole: { type: 'string', enum: ['decision-maker', 'influencer', 'champion', 'user', 'blocker', 'unknown'] },
              sentiment: { type: 'string', enum: ['advocate', 'supporter', 'neutral', 'skeptic', 'opponent'] },
              accessLevel: { type: 'string' }
            }
          }
        },
        stakeholderMap: {
          type: 'object',
          properties: {
            executives: { type: 'array', items: { type: 'string' } },
            decisionMakers: { type: 'array', items: { type: 'string' } },
            influencers: { type: 'array', items: { type: 'string' } },
            champions: { type: 'array', items: { type: 'string' } }
          }
        },
        buyingCenter: {
          type: 'object',
          properties: {
            economicBuyer: { type: 'string' },
            technicalBuyer: { type: 'string' },
            userBuyer: { type: 'string' },
            coach: { type: 'string' }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'account-planning', 'stakeholder-mapping']
}));

export const relationshipAssessmentTask = defineTask('relationship-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Relationship Assessment - ${args.accountName}`,
  agent: {
    name: 'account-strategist',
    prompt: {
      role: 'Relationship management expert',
      task: 'Assess current relationship strength and develop scorecard',
      context: args,
      instructions: [
        'Score relationship with each key stakeholder',
        'Assess executive relationship strength',
        'Evaluate champion effectiveness',
        'Identify relationship risks',
        'Assess competitive relationship threats',
        'Calculate overall relationship score',
        'Identify relationship building priorities',
        'Create relationship development roadmap'
      ],
      outputFormat: 'JSON with scorecard object, stakeholderScores, risks, priorities, roadmap, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['scorecard', 'stakeholderScores', 'artifacts'],
      properties: {
        scorecard: {
          type: 'object',
          properties: {
            overallScore: { type: 'number', minimum: 0, maximum: 100 },
            executiveAccess: { type: 'number' },
            championStrength: { type: 'number' },
            breadth: { type: 'number' },
            depth: { type: 'number' }
          }
        },
        stakeholderScores: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholder: { type: 'string' },
              score: { type: 'number' },
              trend: { type: 'string', enum: ['improving', 'stable', 'declining'] },
              priority: { type: 'string' }
            }
          }
        },
        risks: { type: 'array', items: { type: 'string' } },
        priorities: { type: 'array', items: { type: 'string' } },
        roadmap: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholder: { type: 'string' },
              action: { type: 'string' },
              timing: { type: 'string' }
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
  labels: ['agent', 'sales', 'account-planning', 'relationship']
}));

export const whitespaceAnalysisTask = defineTask('whitespace-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Whitespace Analysis - ${args.accountName}`,
  agent: {
    name: 'account-strategist',
    prompt: {
      role: 'Account expansion strategist',
      task: 'Identify whitespace opportunities for expansion',
      context: args,
      instructions: [
        'Map current product penetration',
        'Identify product gaps (solutions not yet sold)',
        'Identify department gaps (teams not yet engaged)',
        'Identify use case gaps',
        'Assess expansion potential for each gap',
        'Prioritize whitespace by revenue potential',
        'Identify entry points for each whitespace',
        'Calculate total addressable market within account'
      ],
      outputFormat: 'JSON with opportunities array, productGaps, departmentGaps, tam, priorities, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['opportunities', 'productGaps', 'artifacts'],
      properties: {
        opportunities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['product', 'department', 'use-case', 'geographic'] },
              description: { type: 'string' },
              revenuePotential: { type: 'number' },
              difficulty: { type: 'string', enum: ['low', 'medium', 'high'] },
              timeframe: { type: 'string' },
              entryPoint: { type: 'string' }
            }
          }
        },
        productGaps: { type: 'array', items: { type: 'string' } },
        departmentGaps: { type: 'array', items: { type: 'string' } },
        tam: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            captured: { type: 'number' },
            whitespace: { type: 'number' }
          }
        },
        priorities: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'account-planning', 'whitespace']
}));

export const accountCompetitiveTask = defineTask('account-competitive', (args, taskCtx) => ({
  kind: 'agent',
  title: `Competitive Landscape - ${args.accountName}`,
  agent: {
    name: 'competitive-analyst',
    prompt: {
      role: 'Competitive intelligence specialist',
      task: 'Analyze competitive landscape within the account',
      context: args,
      instructions: [
        'Identify all competitors present in account',
        'Map competitor footprint and relationships',
        'Assess competitor strengths in this account',
        'Identify competitive threats',
        'Analyze displacement opportunities',
        'Assess vendor consolidation trends',
        'Identify competitive differentiators',
        'Develop competitive strategy'
      ],
      outputFormat: 'JSON with landscape object, competitors array, threats, opportunities, strategy, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['landscape', 'competitors', 'artifacts'],
      properties: {
        landscape: {
          type: 'object',
          properties: {
            intensity: { type: 'string', enum: ['high', 'medium', 'low'] },
            primaryThreat: { type: 'string' },
            ourPosition: { type: 'string' }
          }
        },
        competitors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              footprint: { type: 'string' },
              relationships: { type: 'array', items: { type: 'string' } },
              strengths: { type: 'array', items: { type: 'string' } },
              vulnerabilities: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        threats: { type: 'array', items: { type: 'string' } },
        displacementOpportunities: { type: 'array', items: { type: 'string' } },
        strategy: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'account-planning', 'competitive']
}));

export const opportunityIdentificationTask = defineTask('opportunity-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Opportunity Identification - ${args.accountName}`,
  agent: {
    name: 'account-strategist',
    prompt: {
      role: 'Opportunity development specialist',
      task: 'Identify and prioritize specific opportunities for the account',
      context: args,
      instructions: [
        'Convert whitespace into specific opportunities',
        'Identify near-term opportunities (0-6 months)',
        'Identify medium-term opportunities (6-12 months)',
        'Identify long-term opportunities (12+ months)',
        'Estimate value for each opportunity',
        'Assess probability and timeline',
        'Identify required actions to develop each',
        'Create opportunity pipeline'
      ],
      outputFormat: 'JSON with opportunities array, pipeline, totalPotential, prioritization, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['opportunities', 'pipeline', 'artifacts'],
      properties: {
        opportunities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              value: { type: 'number' },
              probability: { type: 'number' },
              timeframe: { type: 'string', enum: ['near-term', 'medium-term', 'long-term'] },
              stage: { type: 'string' },
              nextAction: { type: 'string' },
              keyStakeholder: { type: 'string' }
            }
          }
        },
        pipeline: {
          type: 'object',
          properties: {
            nearTerm: { type: 'number' },
            mediumTerm: { type: 'number' },
            longTerm: { type: 'number' },
            total: { type: 'number' },
            weighted: { type: 'number' }
          }
        },
        totalPotential: { type: 'number' },
        prioritization: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'account-planning', 'opportunities']
}));

export const engagementStrategyTask = defineTask('engagement-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Engagement Strategy - ${args.accountName}`,
  agent: {
    name: 'account-strategist',
    prompt: {
      role: 'Account engagement strategist',
      task: 'Develop comprehensive engagement strategy for the account',
      context: args,
      instructions: [
        'Define engagement model and cadence',
        'Develop stakeholder-specific engagement plans',
        'Create executive engagement strategy',
        'Plan marketing and event engagement',
        'Define success metrics and milestones',
        'Allocate team resources',
        'Create communication plan',
        'Define escalation protocols'
      ],
      outputFormat: 'JSON with strategy object, stakeholderPlans, executiveStrategy, resourceAllocation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'stakeholderPlans', 'artifacts'],
      properties: {
        strategy: {
          type: 'object',
          properties: {
            engagementModel: { type: 'string' },
            cadence: { type: 'string' },
            primaryObjectives: { type: 'array', items: { type: 'string' } },
            keyThemes: { type: 'array', items: { type: 'string' } }
          }
        },
        stakeholderPlans: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholder: { type: 'string' },
              engagementTactics: { type: 'array', items: { type: 'string' } },
              frequency: { type: 'string' },
              owner: { type: 'string' }
            }
          }
        },
        executiveStrategy: {
          type: 'object',
          properties: {
            executives: { type: 'array', items: { type: 'string' } },
            tactics: { type: 'array', items: { type: 'string' } },
            events: { type: 'array', items: { type: 'string' } }
          }
        },
        resourceAllocation: {
          type: 'object',
          properties: {
            accountOwner: { type: 'string' },
            teamMembers: { type: 'array', items: { type: 'string' } },
            executiveSponsors: { type: 'array', items: { type: 'string' } }
          }
        },
        milestones: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'account-planning', 'engagement']
}));

export const accountPlanCompilationTask = defineTask('account-plan-compilation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Account Plan Compilation - ${args.accountName}`,
  agent: {
    name: 'account-strategist',
    prompt: {
      role: 'Strategic account planning expert',
      task: 'Compile comprehensive account plan document',
      context: args,
      instructions: [
        'Create executive summary',
        'Compile account overview section',
        'Document stakeholder map and strategy',
        'Present opportunity pipeline',
        'Summarize competitive strategy',
        'Detail engagement plan',
        'Define metrics and milestones',
        'Create action plan with owners and dates'
      ],
      outputFormat: 'JSON with plan object, executiveSummary, actionPlan, metrics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'executiveSummary', 'artifacts'],
      properties: {
        plan: {
          type: 'object',
          properties: {
            accountOverview: { type: 'string' },
            strategicObjectives: { type: 'array', items: { type: 'string' } },
            revenueTargets: { type: 'object' },
            keyInitiatives: { type: 'array', items: { type: 'string' } }
          }
        },
        executiveSummary: { type: 'string' },
        actionPlan: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              owner: { type: 'string' },
              deadline: { type: 'string' },
              priority: { type: 'string' }
            }
          }
        },
        metrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              current: { type: 'string' },
              target: { type: 'string' },
              timeline: { type: 'string' }
            }
          }
        },
        reviewCadence: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'account-planning', 'compilation']
}));
