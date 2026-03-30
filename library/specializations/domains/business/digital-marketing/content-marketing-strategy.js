/**
 * @process digital-marketing/content-marketing-strategy
 * @description Process for developing a comprehensive content marketing strategy aligned with business objectives, including content audit, topic cluster development, editorial calendar creation, and distribution planning
 * @inputs { businessObjectives: object, seoData: object, audienceResearch: object, competitiveContentAnalysis: object, outputDir: string }
 * @outputs { success: boolean, strategyDocument: string, topicClusterMap: object, editorialCalendar: object, contentBriefTemplates: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    businessObjectives = {},
    seoData = {},
    audienceResearch = {},
    competitiveContentAnalysis = {},
    outputDir = 'content-strategy-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Content Marketing Strategy and Editorial Planning process');

  // Task 1: Audit Existing Content
  ctx.log('info', 'Phase 1: Auditing existing content assets and performance');
  const contentAudit = await ctx.task(contentAuditTask, {
    businessObjectives,
    outputDir
  });
  artifacts.push(...contentAudit.artifacts);

  // Task 2: Define Buyer Personas and Content Journey
  ctx.log('info', 'Phase 2: Defining buyer personas and content journey mapping');
  const personaJourney = await ctx.task(personaJourneyMappingTask, {
    audienceResearch,
    businessObjectives,
    outputDir
  });
  artifacts.push(...personaJourney.artifacts);

  // Task 3: Conduct Keyword and Topic Research
  ctx.log('info', 'Phase 3: Conducting keyword and topic research');
  const topicResearch = await ctx.task(topicResearchTask, {
    seoData,
    personaJourney,
    businessObjectives,
    outputDir
  });
  artifacts.push(...topicResearch.artifacts);

  // Task 4: Develop Content Pillars and Topic Clusters
  ctx.log('info', 'Phase 4: Developing content pillars and topic clusters');
  const topicClusters = await ctx.task(topicClusterDevelopmentTask, {
    topicResearch,
    personaJourney,
    competitiveContentAnalysis,
    outputDir
  });
  artifacts.push(...topicClusters.artifacts);

  // Task 5: Create Editorial Calendar
  ctx.log('info', 'Phase 5: Creating editorial calendar');
  const editorialCalendar = await ctx.task(editorialCalendarTask, {
    topicClusters,
    businessObjectives,
    outputDir
  });
  artifacts.push(...editorialCalendar.artifacts);

  // Task 6: Define Content Formats and Production Requirements
  ctx.log('info', 'Phase 6: Defining content formats and production requirements');
  const contentFormats = await ctx.task(contentFormatsTask, {
    topicClusters,
    personaJourney,
    outputDir
  });
  artifacts.push(...contentFormats.artifacts);

  // Task 7: Plan Distribution and Amplification
  ctx.log('info', 'Phase 7: Planning distribution and amplification strategy');
  const distributionPlan = await ctx.task(distributionPlanningTask, {
    editorialCalendar,
    personaJourney,
    outputDir
  });
  artifacts.push(...distributionPlan.artifacts);

  // Task 8: Establish Content Governance
  ctx.log('info', 'Phase 8: Establishing content governance and workflows');
  const governance = await ctx.task(contentGovernanceTask, {
    editorialCalendar,
    contentFormats,
    outputDir
  });
  artifacts.push(...governance.artifacts);

  // Task 9: Set Up Content Performance Measurement
  ctx.log('info', 'Phase 9: Setting up content performance measurement');
  const measurement = await ctx.task(contentMeasurementTask, {
    businessObjectives,
    topicClusters,
    outputDir
  });
  artifacts.push(...measurement.artifacts);

  // Breakpoint: Review strategy
  await ctx.breakpoint({
    question: `Content marketing strategy complete. ${topicClusters.clusterCount} topic clusters with ${editorialCalendar.contentPieces} planned content pieces. Review and approve?`,
    title: 'Content Strategy Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        topicClusters: topicClusters.clusterCount,
        plannedContent: editorialCalendar.contentPieces,
        contentFormats: contentFormats.formatCount,
        distributionChannels: distributionPlan.channelCount
      }
    }
  });

  // Task 10: Generate Strategy Document
  ctx.log('info', 'Phase 10: Generating comprehensive strategy document');
  const strategyDoc = await ctx.task(strategyDocumentGenerationTask, {
    contentAudit,
    personaJourney,
    topicResearch,
    topicClusters,
    editorialCalendar,
    contentFormats,
    distributionPlan,
    governance,
    measurement,
    outputDir
  });
  artifacts.push(...strategyDoc.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    strategyDocument: strategyDoc.documentPath,
    topicClusterMap: topicClusters.clusterMap,
    editorialCalendar: editorialCalendar.calendar,
    contentBriefTemplates: contentFormats.briefTemplates,
    distributionStrategy: distributionPlan.strategy,
    governanceFramework: governance.framework,
    measurementPlan: measurement.plan,
    artifacts,
    duration,
    metadata: {
      processId: 'digital-marketing/content-marketing-strategy',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task definitions
export const contentAuditTask = defineTask('content-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Audit existing content assets and performance',
  agent: {
    name: 'content-auditor',
    prompt: {
      role: 'content strategist',
      task: 'Conduct comprehensive audit of existing content assets and their performance',
      context: args,
      instructions: [
        'Inventory all existing content assets',
        'Analyze content performance metrics (traffic, engagement, conversions)',
        'Assess content quality and relevance',
        'Identify content gaps and opportunities',
        'Categorize content by topic, format, and funnel stage',
        'Identify top-performing and underperforming content',
        'Document content refresh and update opportunities',
        'Create content audit scorecard'
      ],
      outputFormat: 'JSON with inventory, performanceAnalysis, gaps, opportunities, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['inventory', 'performanceAnalysis', 'artifacts'],
      properties: {
        inventory: { type: 'array', items: { type: 'object' } },
        performanceAnalysis: { type: 'object' },
        gaps: { type: 'array', items: { type: 'string' } },
        opportunities: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'content-marketing', 'audit']
}));

export const personaJourneyMappingTask = defineTask('persona-journey-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define buyer personas and content journey mapping',
  agent: {
    name: 'persona-specialist',
    prompt: {
      role: 'content strategist and buyer persona expert',
      task: 'Define buyer personas and map content needs across the customer journey',
      context: args,
      instructions: [
        'Define 3-5 detailed buyer personas',
        'Map content needs at each journey stage (awareness, consideration, decision)',
        'Identify pain points and questions per stage',
        'Define preferred content formats per persona',
        'Map content channels per persona',
        'Identify content triggers and moments',
        'Create persona journey documentation',
        'Define content personalization opportunities'
      ],
      outputFormat: 'JSON with personas, journeyMaps, contentNeeds, formatPreferences, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['personas', 'journeyMaps', 'artifacts'],
      properties: {
        personas: { type: 'array', items: { type: 'object' } },
        journeyMaps: { type: 'object' },
        contentNeeds: { type: 'object' },
        formatPreferences: { type: 'object' },
        triggers: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'content-marketing', 'personas', 'journey-mapping']
}));

export const topicResearchTask = defineTask('topic-research', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct keyword and topic research',
  agent: {
    name: 'topic-researcher',
    prompt: {
      role: 'SEO and content research specialist',
      task: 'Conduct comprehensive keyword and topic research for content strategy',
      context: args,
      instructions: [
        'Analyze seed keywords and expand topic list',
        'Identify high-value keyword opportunities',
        'Assess search volume and competition',
        'Map keywords to buyer journey stages',
        'Identify trending topics and emerging themes',
        'Analyze competitor content gaps',
        'Prioritize topics by business value and opportunity',
        'Document topic research findings'
      ],
      outputFormat: 'JSON with topics, keywords, opportunities, prioritization, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['topics', 'keywords', 'artifacts'],
      properties: {
        topics: { type: 'array', items: { type: 'object' } },
        keywords: { type: 'array', items: { type: 'object' } },
        opportunities: { type: 'array', items: { type: 'object' } },
        prioritization: { type: 'object' },
        competitorGaps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'content-marketing', 'topic-research', 'keywords']
}));

export const topicClusterDevelopmentTask = defineTask('topic-cluster-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop content pillars and topic clusters',
  agent: {
    name: 'topic-cluster-strategist',
    prompt: {
      role: 'content architecture specialist',
      task: 'Develop content pillars and topic cluster strategy',
      context: args,
      instructions: [
        'Define 5-7 core content pillars',
        'Create topic clusters around each pillar',
        'Map pillar pages and cluster content',
        'Define internal linking strategy',
        'Align clusters with buyer journey',
        'Prioritize clusters by business impact',
        'Create topic cluster visualization',
        'Document cluster development roadmap'
      ],
      outputFormat: 'JSON with pillars, clusterMap, clusterCount, linkingStrategy, prioritization, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['pillars', 'clusterMap', 'clusterCount', 'artifacts'],
      properties: {
        pillars: { type: 'array', items: { type: 'object' } },
        clusterMap: { type: 'object' },
        clusterCount: { type: 'number' },
        linkingStrategy: { type: 'object' },
        prioritization: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'content-marketing', 'topic-clusters', 'pillars']
}));

export const editorialCalendarTask = defineTask('editorial-calendar', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create editorial calendar',
  agent: {
    name: 'editorial-planner',
    prompt: {
      role: 'editorial calendar specialist',
      task: 'Create comprehensive editorial calendar aligned with content strategy',
      context: args,
      instructions: [
        'Create quarterly/monthly editorial calendar',
        'Schedule content across topic clusters',
        'Balance content types and formats',
        'Incorporate seasonal and event-based content',
        'Define publishing frequency',
        'Assign content priorities and deadlines',
        'Plan content series and campaigns',
        'Create calendar visualization'
      ],
      outputFormat: 'JSON with calendar, contentPieces, schedule, publishingFrequency, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['calendar', 'contentPieces', 'artifacts'],
      properties: {
        calendar: { type: 'object' },
        contentPieces: { type: 'number' },
        schedule: { type: 'array', items: { type: 'object' } },
        publishingFrequency: { type: 'object' },
        contentSeries: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'content-marketing', 'editorial-calendar']
}));

export const contentFormatsTask = defineTask('content-formats', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define content formats and production requirements',
  agent: {
    name: 'content-format-specialist',
    prompt: {
      role: 'content production specialist',
      task: 'Define content formats and production requirements',
      context: args,
      instructions: [
        'Define content formats (blog, video, podcast, infographic, etc.)',
        'Create format specifications and guidelines',
        'Document production requirements per format',
        'Define quality standards and checklists',
        'Create content brief templates',
        'Estimate production timelines per format',
        'Identify resource requirements',
        'Document format-specific best practices'
      ],
      outputFormat: 'JSON with formats, formatCount, briefTemplates, productionRequirements, qualityStandards, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['formats', 'formatCount', 'briefTemplates', 'artifacts'],
      properties: {
        formats: { type: 'array', items: { type: 'object' } },
        formatCount: { type: 'number' },
        briefTemplates: { type: 'array', items: { type: 'object' } },
        productionRequirements: { type: 'object' },
        qualityStandards: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'content-marketing', 'formats', 'production']
}));

export const distributionPlanningTask = defineTask('distribution-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan distribution and amplification strategy',
  agent: {
    name: 'distribution-strategist',
    prompt: {
      role: 'content distribution specialist',
      task: 'Plan content distribution and amplification strategy',
      context: args,
      instructions: [
        'Define owned, earned, and paid distribution channels',
        'Create channel-specific distribution plans',
        'Plan content repurposing strategy',
        'Define amplification tactics per content type',
        'Plan email and newsletter distribution',
        'Define social media distribution strategy',
        'Plan influencer and partner amplification',
        'Document distribution playbook'
      ],
      outputFormat: 'JSON with strategy, channels, channelCount, repurposingPlan, amplificationTactics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'channelCount', 'artifacts'],
      properties: {
        strategy: { type: 'object' },
        channels: { type: 'array', items: { type: 'object' } },
        channelCount: { type: 'number' },
        repurposingPlan: { type: 'object' },
        amplificationTactics: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'content-marketing', 'distribution', 'amplification']
}));

export const contentGovernanceTask = defineTask('content-governance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish content governance and workflows',
  agent: {
    name: 'governance-specialist',
    prompt: {
      role: 'content governance specialist',
      task: 'Establish content governance framework and workflows',
      context: args,
      instructions: [
        'Define content creation workflow',
        'Create approval and review process',
        'Define roles and responsibilities (RACI)',
        'Establish style guidelines and brand standards',
        'Create content update and maintenance policies',
        'Define content archival and retirement process',
        'Set up version control and asset management',
        'Document governance policies'
      ],
      outputFormat: 'JSON with framework, workflow, raci, styleGuidelines, policies, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'workflow', 'artifacts'],
      properties: {
        framework: { type: 'object' },
        workflow: { type: 'object' },
        raci: { type: 'object' },
        styleGuidelines: { type: 'object' },
        policies: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'content-marketing', 'governance', 'workflow']
}));

export const contentMeasurementTask = defineTask('content-measurement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up content performance measurement',
  agent: {
    name: 'content-analyst',
    prompt: {
      role: 'content analytics specialist',
      task: 'Set up content performance measurement framework',
      context: args,
      instructions: [
        'Define content KPIs by goal (traffic, engagement, conversion)',
        'Set up tracking and attribution',
        'Create content performance dashboards',
        'Define reporting cadence and formats',
        'Set benchmarks and targets',
        'Create content ROI calculation methodology',
        'Define optimization triggers',
        'Document measurement plan'
      ],
      outputFormat: 'JSON with plan, kpis, dashboards, reportingSchedule, roiMethodology, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'kpis', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        kpis: { type: 'array', items: { type: 'object' } },
        dashboards: { type: 'array', items: { type: 'object' } },
        reportingSchedule: { type: 'object' },
        roiMethodology: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'content-marketing', 'measurement', 'analytics']
}));

export const strategyDocumentGenerationTask = defineTask('strategy-document-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive strategy document',
  agent: {
    name: 'strategy-writer',
    prompt: {
      role: 'content strategy documentation specialist',
      task: 'Generate comprehensive content marketing strategy document',
      context: args,
      instructions: [
        'Create executive summary',
        'Document content audit findings',
        'Present buyer personas and journey maps',
        'Outline topic clusters and content pillars',
        'Include editorial calendar',
        'Detail distribution strategy',
        'Document governance framework',
        'Include measurement plan',
        'Provide implementation roadmap',
        'Format as professional strategy document'
      ],
      outputFormat: 'JSON with documentPath, executiveSummary, keyRecommendations, implementationRoadmap, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentPath', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyRecommendations: { type: 'array', items: { type: 'string' } },
        implementationRoadmap: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'content-marketing', 'strategy', 'documentation']
}));
