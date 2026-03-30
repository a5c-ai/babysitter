/**
 * @process business-strategy/three-horizons-growth-planning
 * @description Time-phased strategic initiative portfolio using McKinsey Three Horizons framework
 * @inputs { organizationName: string, currentBusiness: object, emergingOpportunities: array, futureVision: object }
 * @outputs { success: boolean, horizonPortfolio: object, resourceAllocation: object, governanceFramework: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationName = 'Organization',
    currentBusiness = {},
    emergingOpportunities = [],
    futureVision = {},
    outputDir = 'three-horizons-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Three Horizons Growth Planning for ${organizationName}`);

  // ============================================================================
  // PHASE 1: HORIZON 1 - CORE BUSINESS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing Horizon 1 - Defend and extend core business');
  const horizon1Analysis = await ctx.task(horizon1AnalysisTask, {
    organizationName,
    currentBusiness,
    outputDir
  });

  artifacts.push(...horizon1Analysis.artifacts);

  // ============================================================================
  // PHASE 2: HORIZON 2 - EMERGING BUSINESS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing Horizon 2 - Emerging business development');
  const horizon2Analysis = await ctx.task(horizon2AnalysisTask, {
    organizationName,
    emergingOpportunities,
    currentBusiness,
    outputDir
  });

  artifacts.push(...horizon2Analysis.artifacts);

  // ============================================================================
  // PHASE 3: HORIZON 3 - FUTURE OPTIONS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing Horizon 3 - Future growth options');
  const horizon3Analysis = await ctx.task(horizon3AnalysisTask, {
    organizationName,
    futureVision,
    emergingOpportunities,
    outputDir
  });

  artifacts.push(...horizon3Analysis.artifacts);

  // ============================================================================
  // PHASE 4: PORTFOLIO BALANCE ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Assessing portfolio balance across horizons');
  const portfolioBalance = await ctx.task(horizonPortfolioBalanceTask, {
    organizationName,
    horizon1Analysis,
    horizon2Analysis,
    horizon3Analysis,
    outputDir
  });

  artifacts.push(...portfolioBalance.artifacts);

  // ============================================================================
  // PHASE 5: RESOURCE ALLOCATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Allocating resources across horizons');
  const resourceAllocation = await ctx.task(horizonResourceAllocationTask, {
    organizationName,
    horizon1Analysis,
    horizon2Analysis,
    horizon3Analysis,
    portfolioBalance,
    outputDir
  });

  artifacts.push(...resourceAllocation.artifacts);

  // ============================================================================
  // PHASE 6: GOVERNANCE FRAMEWORK
  // ============================================================================

  ctx.log('info', 'Phase 6: Establishing governance for each horizon');
  const governanceFramework = await ctx.task(horizonGovernanceTask, {
    organizationName,
    horizon1Analysis,
    horizon2Analysis,
    horizon3Analysis,
    outputDir
  });

  artifacts.push(...governanceFramework.artifacts);

  // ============================================================================
  // PHASE 7: INTEGRATED ROADMAP
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating integrated horizons roadmap');
  const integratedRoadmap = await ctx.task(integratedRoadmapTask, {
    organizationName,
    horizon1Analysis,
    horizon2Analysis,
    horizon3Analysis,
    resourceAllocation,
    governanceFramework,
    outputDir
  });

  artifacts.push(...integratedRoadmap.artifacts);

  // ============================================================================
  // PHASE 8: GENERATE COMPREHENSIVE REPORT
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating comprehensive Three Horizons report');
  const threeHorizonsReport = await ctx.task(threeHorizonsReportTask, {
    organizationName,
    horizon1Analysis,
    horizon2Analysis,
    horizon3Analysis,
    portfolioBalance,
    resourceAllocation,
    governanceFramework,
    integratedRoadmap,
    outputDir
  });

  artifacts.push(...threeHorizonsReport.artifacts);

  // Breakpoint: Review Three Horizons analysis
  await ctx.breakpoint({
    question: `Three Horizons planning complete for ${organizationName}. Portfolio balance score: ${portfolioBalance.balanceScore}/100. Review and approve?`,
    title: 'Three Horizons Growth Planning Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        organizationName,
        initiativesByHorizon: {
          horizon1: horizon1Analysis.initiatives?.length || 0,
          horizon2: horizon2Analysis.initiatives?.length || 0,
          horizon3: horizon3Analysis.initiatives?.length || 0
        },
        resourceAllocation: resourceAllocation.allocation,
        portfolioBalanceScore: portfolioBalance.balanceScore
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    organizationName,
    horizonPortfolio: {
      horizon1: horizon1Analysis.initiatives,
      horizon2: horizon2Analysis.initiatives,
      horizon3: horizon3Analysis.initiatives
    },
    portfolioBalance: portfolioBalance.assessment,
    resourceAllocation: resourceAllocation.allocation,
    governanceFramework: governanceFramework.framework,
    integratedRoadmap: integratedRoadmap.roadmap,
    reportPath: threeHorizonsReport.reportPath,
    artifacts,
    duration,
    metadata: {
      processId: 'business-strategy/three-horizons-growth-planning',
      timestamp: startTime,
      organizationName,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Horizon 1 Analysis
export const horizon1AnalysisTask = defineTask('horizon-1-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Horizon 1 - Core business defense and optimization',
  agent: {
    name: 'h1-analyst',
    prompt: {
      role: 'core business strategist',
      task: 'Analyze and plan Horizon 1 initiatives (0-2 years, core business)',
      context: args,
      instructions: [
        'Identify initiatives to defend current market position',
        'Develop operational excellence improvements',
        'Plan margin optimization initiatives',
        'Identify customer retention and expansion strategies',
        'Develop competitive response strategies',
        'Plan technology refresh and maintenance',
        'Estimate revenue and profit impact',
        'Define timeline (0-12 months typical execution)',
        'Generate Horizon 1 analysis report'
      ],
      outputFormat: 'JSON with initiatives (array with name, type, impact, timeline), defenseStrategies, optimizationPlans, financialImpact, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['initiatives', 'artifacts'],
      properties: {
        initiatives: { type: 'array', items: { type: 'object' } },
        defenseStrategies: { type: 'array', items: { type: 'object' } },
        optimizationPlans: { type: 'array', items: { type: 'object' } },
        financialImpact: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'three-horizons', 'horizon-1']
}));

// Task 2: Horizon 2 Analysis
export const horizon2AnalysisTask = defineTask('horizon-2-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Horizon 2 - Emerging business development',
  agent: {
    name: 'h2-analyst',
    prompt: {
      role: 'emerging business strategist',
      task: 'Analyze and plan Horizon 2 initiatives (2-5 years, emerging businesses)',
      context: args,
      instructions: [
        'Identify emerging business opportunities',
        'Evaluate adjacency expansion options',
        'Assess new market entry opportunities',
        'Plan new product/service development',
        'Identify M&A and partnership opportunities',
        'Develop business model innovations',
        'Estimate scaling requirements and timelines',
        'Define transition path from H2 to H1',
        'Generate Horizon 2 analysis report'
      ],
      outputFormat: 'JSON with initiatives (array), adjacencies, newMarkets, partnerships, scalingRequirements, transitionPaths, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['initiatives', 'artifacts'],
      properties: {
        initiatives: { type: 'array', items: { type: 'object' } },
        adjacencies: { type: 'array', items: { type: 'object' } },
        newMarkets: { type: 'array', items: { type: 'object' } },
        partnerships: { type: 'array', items: { type: 'object' } },
        scalingRequirements: { type: 'object' },
        transitionPaths: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'three-horizons', 'horizon-2']
}));

// Task 3: Horizon 3 Analysis
export const horizon3AnalysisTask = defineTask('horizon-3-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Horizon 3 - Future growth options',
  agent: {
    name: 'h3-analyst',
    prompt: {
      role: 'future business strategist and innovation specialist',
      task: 'Analyze and plan Horizon 3 initiatives (5+ years, future options)',
      context: args,
      instructions: [
        'Identify breakthrough innovation opportunities',
        'Explore disruptive technology applications',
        'Develop future scenario options',
        'Plan research and experimentation programs',
        'Identify venture and startup investments',
        'Develop moonshot initiatives',
        'Create options portfolio with real options approach',
        'Define option exercise triggers and criteria',
        'Generate Horizon 3 analysis report'
      ],
      outputFormat: 'JSON with initiatives (array), innovations, ventures, experiments, optionsPortfolio, triggers, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['initiatives', 'artifacts'],
      properties: {
        initiatives: { type: 'array', items: { type: 'object' } },
        innovations: { type: 'array', items: { type: 'object' } },
        ventures: { type: 'array', items: { type: 'object' } },
        experiments: { type: 'array', items: { type: 'object' } },
        optionsPortfolio: { type: 'array', items: { type: 'object' } },
        triggers: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'three-horizons', 'horizon-3']
}));

// Task 4: Portfolio Balance Assessment
export const horizonPortfolioBalanceTask = defineTask('horizon-portfolio-balance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess portfolio balance across horizons',
  agent: {
    name: 'portfolio-balancer',
    prompt: {
      role: 'portfolio strategy specialist',
      task: 'Assess balance of initiative portfolio across three horizons',
      context: args,
      instructions: [
        'Assess distribution of initiatives across horizons',
        'Evaluate resource allocation balance',
        'Assess risk-return balance across horizons',
        'Identify portfolio gaps and overconcentrations',
        'Evaluate succession pipeline (H3 -> H2 -> H1)',
        'Calculate portfolio balance score (0-100)',
        'Recommend rebalancing actions',
        'Generate portfolio balance assessment report'
      ],
      outputFormat: 'JSON with assessment, balanceScore, distribution, gaps, successionPipeline, rebalancingRecommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assessment', 'balanceScore', 'artifacts'],
      properties: {
        assessment: { type: 'object' },
        balanceScore: { type: 'number', minimum: 0, maximum: 100 },
        distribution: { type: 'object' },
        gaps: { type: 'array', items: { type: 'string' } },
        successionPipeline: { type: 'object' },
        rebalancingRecommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'three-horizons', 'portfolio-balance']
}));

// Task 5: Resource Allocation
export const horizonResourceAllocationTask = defineTask('horizon-resource-allocation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Allocate resources across horizons',
  agent: {
    name: 'resource-allocator',
    prompt: {
      role: 'strategic resource allocation specialist',
      task: 'Develop resource allocation plan across three horizons',
      context: args,
      instructions: [
        'Recommend capital allocation by horizon (typical: 70/20/10)',
        'Allocate talent and leadership resources',
        'Allocate management attention and time',
        'Plan technology and infrastructure investment',
        'Define funding mechanisms for each horizon',
        'Create resource flow between horizons',
        'Establish resource reallocation triggers',
        'Generate resource allocation plan'
      ],
      outputFormat: 'JSON with allocation (by horizon), capitalAllocation, talentAllocation, fundingMechanisms, reallocationTriggers, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['allocation', 'artifacts'],
      properties: {
        allocation: {
          type: 'object',
          properties: {
            horizon1: { type: 'object' },
            horizon2: { type: 'object' },
            horizon3: { type: 'object' }
          }
        },
        capitalAllocation: { type: 'object' },
        talentAllocation: { type: 'object' },
        fundingMechanisms: { type: 'object' },
        reallocationTriggers: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'three-horizons', 'resource-allocation']
}));

// Task 6: Governance Framework
export const horizonGovernanceTask = defineTask('horizon-governance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish governance for each horizon',
  agent: {
    name: 'governance-architect',
    prompt: {
      role: 'strategic governance specialist',
      task: 'Design governance framework for three horizons portfolio',
      context: args,
      instructions: [
        'Define governance structure for Horizon 1 (operational excellence)',
        'Define governance structure for Horizon 2 (venture board approach)',
        'Define governance structure for Horizon 3 (innovation lab/skunkworks)',
        'Establish decision rights and escalation paths',
        'Define KPIs and success metrics by horizon',
        'Establish review cadence and stage gates',
        'Define graduation criteria between horizons',
        'Generate governance framework documentation'
      ],
      outputFormat: 'JSON with framework (by horizon), decisionRights, kpis, reviewCadence, graduationCriteria, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'artifacts'],
      properties: {
        framework: {
          type: 'object',
          properties: {
            horizon1: { type: 'object' },
            horizon2: { type: 'object' },
            horizon3: { type: 'object' }
          }
        },
        decisionRights: { type: 'object' },
        kpis: { type: 'object' },
        reviewCadence: { type: 'object' },
        graduationCriteria: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'three-horizons', 'governance']
}));

// Task 7: Integrated Roadmap
export const integratedRoadmapTask = defineTask('integrated-roadmap', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create integrated horizons roadmap',
  agent: {
    name: 'roadmap-integrator',
    prompt: {
      role: 'strategic planning specialist',
      task: 'Create integrated roadmap across all three horizons',
      context: args,
      instructions: [
        'Integrate all initiatives into unified timeline',
        'Show horizon transitions and graduations',
        'Highlight dependencies between horizons',
        'Show resource flows and allocations over time',
        'Identify critical milestones and decision points',
        'Show expected revenue/value contribution by horizon',
        'Create visual roadmap spanning 5+ years',
        'Generate integrated roadmap documentation'
      ],
      outputFormat: 'JSON with roadmap, timeline, milestones, dependencies, valueContribution, visualization, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['roadmap', 'artifacts'],
      properties: {
        roadmap: { type: 'object' },
        timeline: { type: 'array', items: { type: 'object' } },
        milestones: { type: 'array', items: { type: 'object' } },
        dependencies: { type: 'array', items: { type: 'object' } },
        valueContribution: { type: 'object' },
        visualization: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'three-horizons', 'integrated-roadmap']
}));

// Task 8: Three Horizons Report Generation
export const threeHorizonsReportTask = defineTask('three-horizons-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive Three Horizons report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'strategy consultant and report author',
      task: 'Generate comprehensive Three Horizons growth planning report',
      context: args,
      instructions: [
        'Create executive summary with key findings',
        'Present Three Horizons framework overview',
        'Document each horizon analysis in detail',
        'Include portfolio balance assessment',
        'Present resource allocation plan',
        'Document governance framework',
        'Include integrated roadmap visualization',
        'Add implementation recommendations',
        'Format as professional Markdown report',
        'Save report to output directory'
      ],
      outputFormat: 'JSON with reportPath, executiveSummary, keyFindings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'keyFindings', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'three-horizons', 'reporting']
}));
