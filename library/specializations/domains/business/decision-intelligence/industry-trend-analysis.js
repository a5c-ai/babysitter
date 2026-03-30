/**
 * @process specializations/domains/business/decision-intelligence/industry-trend-analysis
 * @description Industry Trend Analysis - Systematic monitoring and analysis of industry trends, emerging
 * technologies, and market forces affecting competitive positioning.
 * @inputs { projectName: string, industryScope: object, analysisHorizon: string, stakeholders: array, focusAreas?: array }
 * @outputs { success: boolean, trendAnalysis: object, emergingTechnologies: array, marketForces: object, strategicImplications: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/decision-intelligence/industry-trend-analysis', {
 *   projectName: 'FinTech Industry Trend Analysis 2025',
 *   industryScope: { primary: 'Financial Services', secondary: ['Technology', 'Regulatory'] },
 *   analysisHorizon: '3-5 years',
 *   stakeholders: ['Strategy', 'Product', 'Innovation']
 * });
 *
 * @references
 * - Forrester Research: https://www.forrester.com/research/data-analytics/
 * - Gartner Hype Cycle: https://www.gartner.com/en/research/methodologies/gartner-hype-cycle
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    industryScope = {},
    analysisHorizon = '3-5 years',
    stakeholders = [],
    focusAreas = [],
    outputDir = 'trend-analysis-output'
  } = inputs;

  // Phase 1: Trend Identification and Scanning
  const trendScanning = await ctx.task(trendScanningTask, {
    projectName,
    industryScope,
    focusAreas,
    analysisHorizon
  });

  // Phase 2: Technology Radar Development
  const technologyRadar = await ctx.task(technologyRadarTask, {
    projectName,
    trendScanning,
    industryScope,
    analysisHorizon
  });

  // Phase 3: Market Forces Analysis
  const marketForcesAnalysis = await ctx.task(marketForcesTask, {
    projectName,
    industryScope,
    trendScanning
  });

  // Phase 4: Trend Prioritization and Timing
  const trendPrioritization = await ctx.task(trendPrioritizationTask, {
    projectName,
    trendScanning,
    technologyRadar,
    marketForcesAnalysis
  });

  // Breakpoint: Review trend analysis
  await ctx.breakpoint({
    question: `Review industry trend analysis for ${projectName}. Are the prioritized trends aligned with business focus?`,
    title: 'Trend Analysis Review',
    context: {
      runId: ctx.runId,
      projectName,
      trendCount: trendScanning.trends?.length || 0,
      prioritizedCount: trendPrioritization.prioritizedTrends?.length || 0
    }
  });

  // Phase 5: Scenario Development
  const scenarioDevelopment = await ctx.task(scenarioDevelopmentTask, {
    projectName,
    trendPrioritization,
    marketForcesAnalysis,
    analysisHorizon
  });

  // Phase 6: Strategic Implications Analysis
  const strategicImplications = await ctx.task(strategicImplicationsTask, {
    projectName,
    trendPrioritization,
    scenarioDevelopment,
    stakeholders
  });

  // Phase 7: Monitoring System Design
  const monitoringSystem = await ctx.task(trendMonitoringTask, {
    projectName,
    trendPrioritization,
    industryScope
  });

  // Phase 8: Deliverables and Dissemination
  const deliverables = await ctx.task(trendDeliverablesTask, {
    projectName,
    trendScanning,
    technologyRadar,
    marketForcesAnalysis,
    trendPrioritization,
    strategicImplications,
    stakeholders
  });

  return {
    success: true,
    projectName,
    trendAnalysis: {
      scanning: trendScanning,
      prioritization: trendPrioritization
    },
    emergingTechnologies: technologyRadar.technologies,
    marketForces: marketForcesAnalysis,
    scenarios: scenarioDevelopment,
    strategicImplications,
    monitoringSystem,
    deliverables,
    metadata: {
      processId: 'specializations/domains/business/decision-intelligence/industry-trend-analysis',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const trendScanningTask = defineTask('trend-scanning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Trend Identification and Scanning - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Industry Trend Analyst',
      task: 'Identify and catalog industry trends across multiple dimensions',
      context: args,
      instructions: [
        '1. Scan multiple trend sources (research, news, patents)',
        '2. Identify macro trends (PESTLE framework)',
        '3. Catalog industry-specific trends',
        '4. Identify consumer/customer behavior trends',
        '5. Document regulatory and policy trends',
        '6. Identify business model innovations',
        '7. Catalog competitive landscape changes',
        '8. Document early signals and weak signals'
      ],
      outputFormat: 'JSON object with trend scanning results'
    },
    outputSchema: {
      type: 'object',
      required: ['trends', 'macroTrends', 'signals'],
      properties: {
        trends: { type: 'array' },
        macroTrends: { type: 'object' },
        industryTrends: { type: 'array' },
        behaviorTrends: { type: 'array' },
        signals: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'trends', 'scanning']
}));

export const technologyRadarTask = defineTask('technology-radar', (args, taskCtx) => ({
  kind: 'agent',
  title: `Technology Radar Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technology Trend Analyst',
      task: 'Develop technology radar for emerging technologies',
      context: args,
      instructions: [
        '1. Identify emerging technologies in scope',
        '2. Assess technology maturity (Gartner Hype Cycle)',
        '3. Evaluate adoption timeline and trajectory',
        '4. Assess relevance to business',
        '5. Identify technology interdependencies',
        '6. Evaluate build vs buy vs partner options',
        '7. Assess required capabilities and investments',
        '8. Create technology radar visualization'
      ],
      outputFormat: 'JSON object with technology radar'
    },
    outputSchema: {
      type: 'object',
      required: ['technologies', 'radar', 'assessments'],
      properties: {
        technologies: { type: 'array' },
        radar: { type: 'object' },
        maturityAssessments: { type: 'object' },
        adoptionTimelines: { type: 'object' },
        assessments: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'trends', 'technology']
}));

export const marketForcesTask = defineTask('market-forces', (args, taskCtx) => ({
  kind: 'agent',
  title: `Market Forces Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Market Analysis Expert',
      task: 'Analyze market forces affecting industry dynamics',
      context: args,
      instructions: [
        '1. Apply Porter\'s Five Forces analysis',
        '2. Analyze supply chain dynamics',
        '3. Assess customer power shifts',
        '4. Evaluate new entrant threats',
        '5. Analyze substitute products/services',
        '6. Assess market consolidation trends',
        '7. Evaluate regulatory impact forces',
        '8. Analyze global market dynamics'
      ],
      outputFormat: 'JSON object with market forces analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['fiveForcesAnalysis', 'dynamics', 'implications'],
      properties: {
        fiveForcesAnalysis: { type: 'object' },
        dynamics: { type: 'array' },
        supplyChain: { type: 'object' },
        consolidation: { type: 'object' },
        implications: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'trends', 'market-forces']
}));

export const trendPrioritizationTask = defineTask('trend-prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Trend Prioritization and Timing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Strategic Foresight Analyst',
      task: 'Prioritize trends by impact and timing',
      context: args,
      instructions: [
        '1. Assess trend impact magnitude',
        '2. Evaluate timing and velocity',
        '3. Assess certainty vs uncertainty',
        '4. Evaluate strategic relevance',
        '5. Create impact-timing matrix',
        '6. Identify convergent trends',
        '7. Assess actionability windows',
        '8. Prioritize for strategic response'
      ],
      outputFormat: 'JSON object with trend prioritization'
    },
    outputSchema: {
      type: 'object',
      required: ['prioritizedTrends', 'impactMatrix', 'timing'],
      properties: {
        prioritizedTrends: { type: 'array' },
        impactMatrix: { type: 'object' },
        timing: { type: 'object' },
        convergentTrends: { type: 'array' },
        actionWindows: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'trends', 'prioritization']
}));

export const scenarioDevelopmentTask = defineTask('scenario-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Scenario Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Scenario Planning Specialist',
      task: 'Develop future scenarios based on trend analysis',
      context: args,
      instructions: [
        '1. Identify critical uncertainties',
        '2. Develop scenario framework axes',
        '3. Create 3-4 distinct scenarios',
        '4. Develop scenario narratives',
        '5. Identify scenario indicators',
        '6. Assess business implications per scenario',
        '7. Identify strategic options per scenario',
        '8. Create scenario monitoring triggers'
      ],
      outputFormat: 'JSON object with scenario development'
    },
    outputSchema: {
      type: 'object',
      required: ['scenarios', 'uncertainties', 'indicators'],
      properties: {
        scenarios: { type: 'array' },
        uncertainties: { type: 'array' },
        framework: { type: 'object' },
        indicators: { type: 'array' },
        implications: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'trends', 'scenarios']
}));

export const strategicImplicationsTask = defineTask('strategic-implications', (args, taskCtx) => ({
  kind: 'agent',
  title: `Strategic Implications Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Strategy Consultant',
      task: 'Analyze strategic implications of trends for the business',
      context: args,
      instructions: [
        '1. Map trends to business functions',
        '2. Assess product/service implications',
        '3. Evaluate operational implications',
        '4. Analyze talent and capability implications',
        '5. Assess investment priorities',
        '6. Identify strategic opportunities',
        '7. Identify strategic threats',
        '8. Develop strategic recommendations'
      ],
      outputFormat: 'JSON object with strategic implications'
    },
    outputSchema: {
      type: 'object',
      required: ['implications', 'opportunities', 'threats', 'recommendations'],
      properties: {
        implications: { type: 'object' },
        opportunities: { type: 'array' },
        threats: { type: 'array' },
        investments: { type: 'array' },
        recommendations: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'trends', 'strategy']
}));

export const trendMonitoringTask = defineTask('trend-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Monitoring System Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Trend Monitoring Specialist',
      task: 'Design ongoing trend monitoring system',
      context: args,
      instructions: [
        '1. Define monitoring sources and feeds',
        '2. Create trend tracking metrics',
        '3. Design alert and trigger system',
        '4. Plan update and refresh cadence',
        '5. Define escalation procedures',
        '6. Design trend database and repository',
        '7. Plan analysis refresh cycles',
        '8. Create monitoring dashboard'
      ],
      outputFormat: 'JSON object with monitoring system design'
    },
    outputSchema: {
      type: 'object',
      required: ['sources', 'metrics', 'alerts'],
      properties: {
        sources: { type: 'array' },
        metrics: { type: 'array' },
        alerts: { type: 'object' },
        cadence: { type: 'object' },
        dashboard: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'trends', 'monitoring']
}));

export const trendDeliverablesTask = defineTask('trend-deliverables', (args, taskCtx) => ({
  kind: 'agent',
  title: `Deliverables and Dissemination - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Trend Communications Specialist',
      task: 'Create trend analysis deliverables and dissemination plan',
      context: args,
      instructions: [
        '1. Create executive summary report',
        '2. Develop detailed trend analysis document',
        '3. Create technology radar visualization',
        '4. Develop scenario planning briefing',
        '5. Create strategic implications presentation',
        '6. Design stakeholder-specific views',
        '7. Plan dissemination schedule',
        '8. Create feedback and update process'
      ],
      outputFormat: 'JSON object with deliverables plan'
    },
    outputSchema: {
      type: 'object',
      required: ['reports', 'presentations', 'dissemination'],
      properties: {
        reports: { type: 'array' },
        visualizations: { type: 'array' },
        presentations: { type: 'array' },
        dissemination: { type: 'object' },
        feedback: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'trends', 'deliverables']
}));
