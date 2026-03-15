/**
 * @process specializations/domains/business/decision-intelligence/voice-of-customer-integration
 * @description Voice of Customer Integration - Aggregation and analysis of customer feedback from multiple
 * sources to inform product, service, and experience improvements.
 * @inputs { projectName: string, feedbackSources: array, analysisObjectives: array, stakeholders?: array, integrationRequirements?: object }
 * @outputs { success: boolean, vocFramework: object, insightsAnalysis: object, actionPrioritization: object, integrationPlan: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/decision-intelligence/voice-of-customer-integration', {
 *   projectName: 'Enterprise VoC Program',
 *   feedbackSources: ['NPS Surveys', 'Support Tickets', 'App Reviews', 'Social Media'],
 *   analysisObjectives: ['Product Improvement', 'Churn Prevention', 'Experience Enhancement']
 * });
 *
 * @references
 * - Digital Analytics Association: https://www.digitalanalyticsassociation.org/
 * - VoC Best Practices: Qualtrics, Medallia
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    feedbackSources = [],
    analysisObjectives = [],
    stakeholders = [],
    integrationRequirements = {},
    outputDir = 'voc-output'
  } = inputs;

  // Phase 1: VoC Source Inventory and Assessment
  const sourceAssessment = await ctx.task(sourceAssessmentTask, {
    projectName,
    feedbackSources,
    analysisObjectives
  });

  // Phase 2: Data Integration Architecture
  const integrationArchitecture = await ctx.task(integrationArchitectureTask, {
    projectName,
    sourceAssessment,
    integrationRequirements
  });

  // Phase 3: Feedback Taxonomy Development
  const feedbackTaxonomy = await ctx.task(feedbackTaxonomyTask, {
    projectName,
    sourceAssessment,
    analysisObjectives
  });

  // Phase 4: Sentiment and Text Analytics
  const textAnalytics = await ctx.task(textAnalyticsTask, {
    projectName,
    feedbackTaxonomy,
    sourceAssessment
  });

  // Phase 5: Insights Synthesis
  const insightsSynthesis = await ctx.task(insightsSynthesisTask, {
    projectName,
    textAnalytics,
    feedbackTaxonomy,
    analysisObjectives
  });

  // Breakpoint: Review VoC insights
  await ctx.breakpoint({
    question: `Review VoC insights for ${projectName}. Are the customer themes accurately captured?`,
    title: 'VoC Insights Review',
    context: {
      runId: ctx.runId,
      projectName,
      sourceCount: feedbackSources.length,
      themeCount: insightsSynthesis.themes?.length || 0
    }
  });

  // Phase 6: Action Prioritization Framework
  const actionPrioritization = await ctx.task(actionPrioritizationTask, {
    projectName,
    insightsSynthesis,
    stakeholders,
    analysisObjectives
  });

  // Phase 7: Closed-Loop Process Design
  const closedLoopProcess = await ctx.task(closedLoopProcessTask, {
    projectName,
    actionPrioritization,
    stakeholders
  });

  // Phase 8: Reporting and Dissemination
  const reportingPlan = await ctx.task(vocReportingTask, {
    projectName,
    insightsSynthesis,
    actionPrioritization,
    stakeholders
  });

  return {
    success: true,
    projectName,
    vocFramework: {
      sourceAssessment,
      integrationArchitecture,
      feedbackTaxonomy
    },
    textAnalytics,
    insightsAnalysis: insightsSynthesis,
    actionPrioritization,
    closedLoopProcess,
    integrationPlan: integrationArchitecture,
    reportingPlan,
    metadata: {
      processId: 'specializations/domains/business/decision-intelligence/voice-of-customer-integration',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const sourceAssessmentTask = defineTask('source-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `VoC Source Inventory and Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Voice of Customer Analyst',
      task: 'Inventory and assess customer feedback sources',
      context: args,
      instructions: [
        '1. Catalog all customer feedback sources',
        '2. Assess data volume and velocity per source',
        '3. Evaluate data quality and completeness',
        '4. Identify structured vs unstructured data',
        '5. Assess customer journey coverage',
        '6. Identify feedback gaps',
        '7. Evaluate source reliability and bias',
        '8. Prioritize sources for integration'
      ],
      outputFormat: 'JSON object with source assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['sources', 'assessment', 'gaps'],
      properties: {
        sources: { type: 'array' },
        assessment: { type: 'object' },
        volume: { type: 'object' },
        quality: { type: 'object' },
        gaps: { type: 'array' },
        priorities: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'voc', 'sources']
}));

export const integrationArchitectureTask = defineTask('integration-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Data Integration Architecture - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'VoC Data Integration Architect',
      task: 'Design data integration architecture for VoC',
      context: args,
      instructions: [
        '1. Design data collection pipelines',
        '2. Define data normalization approach',
        '3. Plan customer identity resolution',
        '4. Design data storage architecture',
        '5. Plan real-time vs batch processing',
        '6. Define API integration requirements',
        '7. Design data quality monitoring',
        '8. Plan data governance controls'
      ],
      outputFormat: 'JSON object with integration architecture'
    },
    outputSchema: {
      type: 'object',
      required: ['architecture', 'pipelines', 'storage'],
      properties: {
        architecture: { type: 'object' },
        pipelines: { type: 'array' },
        normalization: { type: 'object' },
        identity: { type: 'object' },
        storage: { type: 'object' },
        governance: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'voc', 'integration']
}));

export const feedbackTaxonomyTask = defineTask('feedback-taxonomy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Feedback Taxonomy Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'VoC Taxonomy Specialist',
      task: 'Develop feedback categorization taxonomy',
      context: args,
      instructions: [
        '1. Define top-level feedback categories',
        '2. Create subcategory hierarchies',
        '3. Define topic and theme classifications',
        '4. Create sentiment classification scheme',
        '5. Define urgency and impact categories',
        '6. Create product/feature mapping',
        '7. Design customer journey stage mapping',
        '8. Document taxonomy maintenance process'
      ],
      outputFormat: 'JSON object with feedback taxonomy'
    },
    outputSchema: {
      type: 'object',
      required: ['categories', 'hierarchy', 'sentiment'],
      properties: {
        categories: { type: 'array' },
        hierarchy: { type: 'object' },
        topics: { type: 'array' },
        sentiment: { type: 'object' },
        mapping: { type: 'object' },
        maintenance: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'voc', 'taxonomy']
}));

export const textAnalyticsTask = defineTask('text-analytics', (args, taskCtx) => ({
  kind: 'agent',
  title: `Sentiment and Text Analytics - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Text Analytics Specialist',
      task: 'Design text analytics approach for VoC analysis',
      context: args,
      instructions: [
        '1. Design sentiment analysis approach',
        '2. Plan topic modeling methodology',
        '3. Define entity extraction requirements',
        '4. Design intent classification',
        '5. Plan trend detection algorithms',
        '6. Design anomaly detection',
        '7. Plan multi-language support',
        '8. Define model training and tuning approach'
      ],
      outputFormat: 'JSON object with text analytics design'
    },
    outputSchema: {
      type: 'object',
      required: ['sentiment', 'topics', 'entities'],
      properties: {
        sentiment: { type: 'object' },
        topics: { type: 'object' },
        entities: { type: 'object' },
        intent: { type: 'object' },
        trends: { type: 'object' },
        models: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'voc', 'analytics']
}));

export const insightsSynthesisTask = defineTask('insights-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Insights Synthesis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'VoC Insights Analyst',
      task: 'Synthesize customer insights from feedback analysis',
      context: args,
      instructions: [
        '1. Identify major customer themes',
        '2. Quantify theme prevalence and trends',
        '3. Analyze sentiment by theme',
        '4. Identify customer pain points',
        '5. Discover improvement opportunities',
        '6. Analyze segment-specific insights',
        '7. Identify competitive mentions',
        '8. Create insight narratives'
      ],
      outputFormat: 'JSON object with insights synthesis'
    },
    outputSchema: {
      type: 'object',
      required: ['themes', 'painPoints', 'opportunities'],
      properties: {
        themes: { type: 'array' },
        sentiment: { type: 'object' },
        painPoints: { type: 'array' },
        opportunities: { type: 'array' },
        segmentInsights: { type: 'object' },
        narratives: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'voc', 'insights']
}));

export const actionPrioritizationTask = defineTask('action-prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Action Prioritization Framework - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'VoC Action Planning Specialist',
      task: 'Develop action prioritization framework',
      context: args,
      instructions: [
        '1. Define prioritization criteria',
        '2. Score insights by impact',
        '3. Assess implementation feasibility',
        '4. Calculate business value potential',
        '5. Create prioritization matrix',
        '6. Map actions to owners',
        '7. Define quick wins vs strategic initiatives',
        '8. Create action roadmap'
      ],
      outputFormat: 'JSON object with action prioritization'
    },
    outputSchema: {
      type: 'object',
      required: ['criteria', 'prioritization', 'roadmap'],
      properties: {
        criteria: { type: 'array' },
        scores: { type: 'object' },
        matrix: { type: 'object' },
        prioritization: { type: 'array' },
        owners: { type: 'object' },
        roadmap: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'voc', 'prioritization']
}));

export const closedLoopProcessTask = defineTask('closed-loop-process', (args, taskCtx) => ({
  kind: 'agent',
  title: `Closed-Loop Process Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'VoC Process Designer',
      task: 'Design closed-loop feedback process',
      context: args,
      instructions: [
        '1. Define action tracking workflow',
        '2. Design customer follow-up process',
        '3. Create resolution notification system',
        '4. Plan impact measurement',
        '5. Design feedback loop closure',
        '6. Create accountability mechanisms',
        '7. Plan continuous improvement process',
        '8. Design success storytelling'
      ],
      outputFormat: 'JSON object with closed-loop process'
    },
    outputSchema: {
      type: 'object',
      required: ['workflow', 'followUp', 'measurement'],
      properties: {
        workflow: { type: 'object' },
        followUp: { type: 'object' },
        notifications: { type: 'object' },
        measurement: { type: 'object' },
        accountability: { type: 'object' },
        improvement: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'voc', 'closed-loop']
}));

export const vocReportingTask = defineTask('voc-reporting', (args, taskCtx) => ({
  kind: 'agent',
  title: `Reporting and Dissemination - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'VoC Reporting Specialist',
      task: 'Design VoC reporting and dissemination plan',
      context: args,
      instructions: [
        '1. Design executive dashboard',
        '2. Create stakeholder-specific reports',
        '3. Design real-time alerting',
        '4. Create trend reports',
        '5. Design action tracking reports',
        '6. Plan distribution and access',
        '7. Create self-service capabilities',
        '8. Design feedback request process'
      ],
      outputFormat: 'JSON object with reporting plan'
    },
    outputSchema: {
      type: 'object',
      required: ['dashboards', 'reports', 'distribution'],
      properties: {
        dashboards: { type: 'array' },
        reports: { type: 'array' },
        alerts: { type: 'object' },
        distribution: { type: 'object' },
        selfService: { type: 'object' },
        feedback: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'voc', 'reporting']
}));
