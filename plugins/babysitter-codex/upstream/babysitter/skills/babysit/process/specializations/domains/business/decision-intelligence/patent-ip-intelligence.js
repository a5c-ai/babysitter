/**
 * @process specializations/domains/business/decision-intelligence/patent-ip-intelligence
 * @description Patent and IP Intelligence Monitoring - Tracking and analysis of competitor patent filings,
 * intellectual property developments, and innovation trajectories.
 * @inputs { projectName: string, competitors: array, technologyDomains: array, monitoringScope?: object, stakeholders?: array }
 * @outputs { success: boolean, patentLandscape: object, competitorAnalysis: object, innovationTrends: object, strategicInsights: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/decision-intelligence/patent-ip-intelligence', {
 *   projectName: 'AI/ML Patent Intelligence Program',
 *   competitors: ['Google', 'Microsoft', 'Amazon'],
 *   technologyDomains: ['Machine Learning', 'Natural Language Processing', 'Computer Vision'],
 *   monitoringScope: { geography: ['US', 'EU', 'CN'], timeframe: '5 years' }
 * });
 *
 * @references
 * - World Intellectual Property Organization: https://www.wipo.int/
 * - Journal of the Association for Information Science and Technology: https://onlinelibrary.wiley.com/journal/15707560
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    competitors = [],
    technologyDomains = [],
    monitoringScope = {},
    stakeholders = [],
    outputDir = 'patent-ip-output'
  } = inputs;

  // Phase 1: Patent Landscape Analysis
  const patentLandscape = await ctx.task(patentLandscapeTask, {
    projectName,
    technologyDomains,
    monitoringScope
  });

  // Phase 2: Competitor Patent Portfolio Analysis
  const competitorPortfolioAnalysis = await ctx.task(competitorPortfolioTask, {
    projectName,
    competitors,
    technologyDomains,
    patentLandscape
  });

  // Phase 3: Technology Cluster Analysis
  const technologyClusters = await ctx.task(technologyClusterTask, {
    projectName,
    patentLandscape,
    technologyDomains
  });

  // Phase 4: Innovation Trajectory Analysis
  const innovationTrajectories = await ctx.task(innovationTrajectoryTask, {
    projectName,
    competitorPortfolioAnalysis,
    technologyClusters,
    competitors
  });

  // Breakpoint: Review patent intelligence
  await ctx.breakpoint({
    question: `Review patent intelligence analysis for ${projectName}. Are the innovation trends identified accurate?`,
    title: 'Patent Intelligence Review',
    context: {
      runId: ctx.runId,
      projectName,
      patentCount: patentLandscape.totalPatents || 0,
      competitorCount: competitors.length
    }
  });

  // Phase 5: Freedom to Operate Assessment
  const ftoAssessment = await ctx.task(ftoAssessmentTask, {
    projectName,
    patentLandscape,
    competitorPortfolioAnalysis,
    technologyDomains
  });

  // Phase 6: Strategic Insights Development
  const strategicInsights = await ctx.task(strategicInsightsTask, {
    projectName,
    patentLandscape,
    competitorPortfolioAnalysis,
    innovationTrajectories,
    ftoAssessment,
    stakeholders
  });

  // Phase 7: Monitoring System Setup
  const monitoringSystem = await ctx.task(ipMonitoringTask, {
    projectName,
    competitors,
    technologyDomains,
    monitoringScope
  });

  // Phase 8: Reporting and Dissemination
  const reportingPlan = await ctx.task(ipReportingTask, {
    projectName,
    strategicInsights,
    stakeholders,
    monitoringSystem
  });

  return {
    success: true,
    projectName,
    patentLandscape,
    competitorAnalysis: competitorPortfolioAnalysis,
    technologyClusters,
    innovationTrends: innovationTrajectories,
    ftoAssessment,
    strategicInsights,
    monitoringSystem,
    reportingPlan,
    metadata: {
      processId: 'specializations/domains/business/decision-intelligence/patent-ip-intelligence',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const patentLandscapeTask = defineTask('patent-landscape', (args, taskCtx) => ({
  kind: 'agent',
  title: `Patent Landscape Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Patent Analyst',
      task: 'Analyze patent landscape for specified technology domains',
      context: args,
      instructions: [
        '1. Define patent search strategy and queries',
        '2. Identify relevant patent classifications (IPC/CPC)',
        '3. Analyze patent filing trends over time',
        '4. Map geographic distribution of patents',
        '5. Identify top patent holders and assignees',
        '6. Analyze patent citation networks',
        '7. Identify white spaces and opportunity areas',
        '8. Create patent landscape visualizations'
      ],
      outputFormat: 'JSON object with patent landscape analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['totalPatents', 'trends', 'topHolders'],
      properties: {
        totalPatents: { type: 'number' },
        trends: { type: 'object' },
        geography: { type: 'object' },
        topHolders: { type: 'array' },
        classifications: { type: 'array' },
        whiteSpaces: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'patent', 'landscape']
}));

export const competitorPortfolioTask = defineTask('competitor-portfolio', (args, taskCtx) => ({
  kind: 'agent',
  title: `Competitor Patent Portfolio Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Competitive IP Analyst',
      task: 'Analyze competitor patent portfolios and strategies',
      context: args,
      instructions: [
        '1. Analyze each competitor\'s patent portfolio size and growth',
        '2. Identify technology focus areas per competitor',
        '3. Assess patent quality metrics (citations, family size)',
        '4. Analyze inventor networks and key inventors',
        '5. Identify acquisition and licensing patterns',
        '6. Assess geographic filing strategies',
        '7. Compare competitive IP strengths and weaknesses',
        '8. Identify recent filing activity and trends'
      ],
      outputFormat: 'JSON object with competitor portfolio analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['portfolios', 'comparison', 'strategies'],
      properties: {
        portfolios: { type: 'object' },
        comparison: { type: 'object' },
        focusAreas: { type: 'object' },
        inventors: { type: 'object' },
        strategies: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'patent', 'competitive']
}));

export const technologyClusterTask = defineTask('technology-cluster', (args, taskCtx) => ({
  kind: 'agent',
  title: `Technology Cluster Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technology Intelligence Analyst',
      task: 'Identify and analyze technology clusters from patent data',
      context: args,
      instructions: [
        '1. Apply text mining to patent claims and abstracts',
        '2. Identify technology clusters and themes',
        '3. Map technology evolution trajectories',
        '4. Identify emerging technology areas',
        '5. Analyze cross-domain technology convergence',
        '6. Assess technology maturity levels',
        '7. Identify disruptive technology signals',
        '8. Create technology cluster visualizations'
      ],
      outputFormat: 'JSON object with technology cluster analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['clusters', 'evolution', 'emerging'],
      properties: {
        clusters: { type: 'array' },
        evolution: { type: 'object' },
        emerging: { type: 'array' },
        convergence: { type: 'array' },
        maturity: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'patent', 'technology']
}));

export const innovationTrajectoryTask = defineTask('innovation-trajectory', (args, taskCtx) => ({
  kind: 'agent',
  title: `Innovation Trajectory Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Innovation Intelligence Analyst',
      task: 'Analyze innovation trajectories and R&D direction',
      context: args,
      instructions: [
        '1. Track R&D investment patterns from patent data',
        '2. Identify innovation velocity and acceleration',
        '3. Analyze patent-to-product timelines',
        '4. Identify strategic technology bets',
        '5. Assess build vs buy vs partner strategies',
        '6. Identify potential M&A targets',
        '7. Predict future technology directions',
        '8. Identify competitive innovation gaps'
      ],
      outputFormat: 'JSON object with innovation trajectory analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['trajectories', 'velocity', 'predictions'],
      properties: {
        trajectories: { type: 'array' },
        velocity: { type: 'object' },
        strategicBets: { type: 'array' },
        maTargets: { type: 'array' },
        predictions: { type: 'array' },
        gaps: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'patent', 'innovation']
}));

export const ftoAssessmentTask = defineTask('fto-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Freedom to Operate Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'IP Risk Analyst',
      task: 'Assess freedom to operate risks and opportunities',
      context: args,
      instructions: [
        '1. Identify blocking patents in target areas',
        '2. Assess patent claim scope and coverage',
        '3. Evaluate design-around opportunities',
        '4. Identify licensing opportunities',
        '5. Assess patent validity and enforceability risks',
        '6. Identify expiring patents creating opportunities',
        '7. Evaluate cross-licensing potential',
        '8. Create FTO risk matrix'
      ],
      outputFormat: 'JSON object with FTO assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['blockingPatents', 'risks', 'opportunities'],
      properties: {
        blockingPatents: { type: 'array' },
        risks: { type: 'array' },
        designArounds: { type: 'array' },
        licensingOpportunities: { type: 'array' },
        expiringPatents: { type: 'array' },
        opportunities: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'patent', 'fto']
}));

export const strategicInsightsTask = defineTask('strategic-insights', (args, taskCtx) => ({
  kind: 'agent',
  title: `Strategic Insights Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'IP Strategy Consultant',
      task: 'Develop strategic insights from patent intelligence',
      context: args,
      instructions: [
        '1. Synthesize key strategic findings',
        '2. Identify IP-driven competitive advantages',
        '3. Recommend IP portfolio priorities',
        '4. Suggest defensive and offensive IP strategies',
        '5. Identify partnership and licensing strategies',
        '6. Recommend technology acquisition targets',
        '7. Define IP investment priorities',
        '8. Create strategic recommendation roadmap'
      ],
      outputFormat: 'JSON object with strategic insights'
    },
    outputSchema: {
      type: 'object',
      required: ['insights', 'recommendations', 'priorities'],
      properties: {
        insights: { type: 'array' },
        competitiveAdvantages: { type: 'array' },
        portfolioPriorities: { type: 'array' },
        strategies: { type: 'object' },
        recommendations: { type: 'array' },
        priorities: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'patent', 'strategy']
}));

export const ipMonitoringTask = defineTask('ip-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `IP Monitoring System Setup - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'IP Monitoring Specialist',
      task: 'Design ongoing IP monitoring system',
      context: args,
      instructions: [
        '1. Define monitoring scope and queries',
        '2. Set up patent database alerts',
        '3. Configure competitor filing alerts',
        '4. Design litigation monitoring',
        '5. Plan publication and grant tracking',
        '6. Define review and analysis cadence',
        '7. Design alert triage workflow',
        '8. Create monitoring dashboard'
      ],
      outputFormat: 'JSON object with monitoring system design'
    },
    outputSchema: {
      type: 'object',
      required: ['alerts', 'queries', 'workflow'],
      properties: {
        alerts: { type: 'array' },
        queries: { type: 'array' },
        databases: { type: 'array' },
        workflow: { type: 'object' },
        cadence: { type: 'object' },
        dashboard: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'patent', 'monitoring']
}));

export const ipReportingTask = defineTask('ip-reporting', (args, taskCtx) => ({
  kind: 'agent',
  title: `IP Reporting and Dissemination - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'IP Communications Specialist',
      task: 'Create IP intelligence reporting and dissemination plan',
      context: args,
      instructions: [
        '1. Design report templates and formats',
        '2. Create stakeholder-specific views',
        '3. Develop executive briefing format',
        '4. Create visualization standards',
        '5. Plan distribution and access control',
        '6. Design alert notification system',
        '7. Plan periodic review meetings',
        '8. Create IP intelligence repository'
      ],
      outputFormat: 'JSON object with reporting plan'
    },
    outputSchema: {
      type: 'object',
      required: ['reports', 'distribution', 'repository'],
      properties: {
        reports: { type: 'array' },
        templates: { type: 'array' },
        visualizations: { type: 'array' },
        distribution: { type: 'object' },
        meetings: { type: 'object' },
        repository: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'patent', 'reporting']
}));
