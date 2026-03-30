/**
 * @process digital-marketing/social-media-strategy
 * @description Comprehensive process for developing a social media strategy across platforms, including audit, audience research, platform prioritization, content pillars, and measurement framework definition
 * @inputs { businessObjectives: object, brandGuidelines: object, competitiveLandscape: object, audienceResearch: object, outputDir: string }
 * @outputs { success: boolean, strategyDocument: string, platformPriorities: array, contentPillarFramework: object, measurementPlan: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    businessObjectives = {},
    brandGuidelines = {},
    competitiveLandscape = {},
    audienceResearch = {},
    outputDir = 'social-strategy-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Social Media Strategy Development process');

  // Task 1: Conduct Social Media Audit
  ctx.log('info', 'Phase 1: Conducting social media audit');
  const auditResult = await ctx.task(socialMediaAuditTask, {
    businessObjectives,
    outputDir
  });
  artifacts.push(...auditResult.artifacts);

  // Task 2: Competitive Analysis
  ctx.log('info', 'Phase 2: Performing competitive analysis');
  const competitiveAnalysis = await ctx.task(competitiveAnalysisTask, {
    competitiveLandscape,
    auditResult,
    outputDir
  });
  artifacts.push(...competitiveAnalysis.artifacts);

  // Task 3: Define Target Audience Personas
  ctx.log('info', 'Phase 3: Defining target audience personas and platform preferences');
  const audiencePersonas = await ctx.task(audiencePersonasTask, {
    audienceResearch,
    businessObjectives,
    competitiveAnalysis,
    outputDir
  });
  artifacts.push(...audiencePersonas.artifacts);

  // Task 4: Select Priority Platforms
  ctx.log('info', 'Phase 4: Selecting priority platforms');
  const platformSelection = await ctx.task(platformSelectionTask, {
    businessObjectives,
    audiencePersonas,
    auditResult,
    outputDir
  });
  artifacts.push(...platformSelection.artifacts);

  // Task 5: Establish Content Pillars
  ctx.log('info', 'Phase 5: Establishing content pillars and themes');
  const contentPillars = await ctx.task(contentPillarsTask, {
    brandGuidelines,
    businessObjectives,
    audiencePersonas,
    platformSelection,
    outputDir
  });
  artifacts.push(...contentPillars.artifacts);

  // Task 6: Define Brand Voice and Visual Guidelines
  ctx.log('info', 'Phase 6: Defining brand voice and visual guidelines for social');
  const brandVoice = await ctx.task(brandVoiceTask, {
    brandGuidelines,
    platformSelection,
    contentPillars,
    outputDir
  });
  artifacts.push(...brandVoice.artifacts);

  // Task 7: Create Content Calendar Framework
  ctx.log('info', 'Phase 7: Creating content calendar framework');
  const calendarFramework = await ctx.task(calendarFrameworkTask, {
    contentPillars,
    platformSelection,
    outputDir
  });
  artifacts.push(...calendarFramework.artifacts);

  // Task 8: Develop Community Engagement Protocols
  ctx.log('info', 'Phase 8: Developing community engagement protocols');
  const engagementProtocols = await ctx.task(engagementProtocolsTask, {
    brandVoice,
    platformSelection,
    outputDir
  });
  artifacts.push(...engagementProtocols.artifacts);

  // Task 9: Establish KPIs and Measurement Approach
  ctx.log('info', 'Phase 9: Establishing KPIs and measurement approach');
  const measurementPlan = await ctx.task(measurementPlanTask, {
    businessObjectives,
    platformSelection,
    contentPillars,
    outputDir
  });
  artifacts.push(...measurementPlan.artifacts);

  // Breakpoint: Review strategy
  await ctx.breakpoint({
    question: `Social media strategy complete. ${platformSelection.priorityPlatforms.length} priority platforms identified with ${contentPillars.pillarCount} content pillars. Review and approve?`,
    title: 'Social Media Strategy Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        platformCount: platformSelection.priorityPlatforms.length,
        pillarCount: contentPillars.pillarCount,
        personaCount: audiencePersonas.personaCount,
        kpiCount: measurementPlan.kpiCount
      }
    }
  });

  // Task 10: Generate Strategy Document
  ctx.log('info', 'Phase 10: Generating comprehensive strategy document');
  const strategyDoc = await ctx.task(strategyDocumentTask, {
    auditResult,
    competitiveAnalysis,
    audiencePersonas,
    platformSelection,
    contentPillars,
    brandVoice,
    calendarFramework,
    engagementProtocols,
    measurementPlan,
    outputDir
  });
  artifacts.push(...strategyDoc.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    strategyDocument: strategyDoc.documentPath,
    platformPriorities: platformSelection.priorityPlatforms,
    contentPillarFramework: contentPillars.framework,
    measurementPlan: measurementPlan.plan,
    audiencePersonas: audiencePersonas.personas,
    brandVoiceGuidelines: brandVoice.guidelines,
    engagementProtocols: engagementProtocols.protocols,
    calendarFramework: calendarFramework.framework,
    artifacts,
    duration,
    metadata: {
      processId: 'digital-marketing/social-media-strategy',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task definitions
export const socialMediaAuditTask = defineTask('social-media-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct social media audit',
  agent: {
    name: 'social-auditor',
    prompt: {
      role: 'social media strategist',
      task: 'Conduct comprehensive audit of current social media presence and performance',
      context: args,
      instructions: [
        'Audit all existing social media accounts',
        'Analyze follower counts and growth trends',
        'Evaluate engagement rates by platform',
        'Review content performance (top/bottom performers)',
        'Assess posting frequency and consistency',
        'Identify gaps in profile optimization',
        'Document current strengths and weaknesses',
        'Generate audit scorecard'
      ],
      outputFormat: 'JSON with auditFindings, platformScores, topContent, gaps, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['auditFindings', 'artifacts'],
      properties: {
        auditFindings: { type: 'object' },
        platformScores: { type: 'object' },
        topContent: { type: 'array', items: { type: 'object' } },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'social-media', 'audit']
}));

export const competitiveAnalysisTask = defineTask('competitive-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform competitive analysis',
  agent: {
    name: 'competitive-analyst',
    prompt: {
      role: 'social media competitive analyst',
      task: 'Analyze competitor social media strategies and performance',
      context: args,
      instructions: [
        'Identify key competitors on social media',
        'Analyze competitor content strategies',
        'Evaluate competitor engagement levels',
        'Identify successful competitor tactics',
        'Document competitor posting frequency',
        'Analyze competitor audience sentiment',
        'Identify content gaps and opportunities',
        'Create competitive benchmark report'
      ],
      outputFormat: 'JSON with competitors, analysis, benchmarks, opportunities, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['competitors', 'analysis', 'artifacts'],
      properties: {
        competitors: { type: 'array', items: { type: 'object' } },
        analysis: { type: 'object' },
        benchmarks: { type: 'object' },
        opportunities: { type: 'array', items: { type: 'string' } },
        threats: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'social-media', 'competitive-analysis']
}));

export const audiencePersonasTask = defineTask('audience-personas', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define target audience personas',
  agent: {
    name: 'audience-researcher',
    prompt: {
      role: 'social media audience researcher',
      task: 'Define target audience personas and their platform preferences',
      context: args,
      instructions: [
        'Analyze audience demographics and psychographics',
        'Define 3-5 distinct audience personas',
        'Map persona platform preferences',
        'Identify content preferences by persona',
        'Document peak engagement times',
        'Define persona pain points and motivations',
        'Map customer journey touchpoints',
        'Create persona profile cards'
      ],
      outputFormat: 'JSON with personas, personaCount, platformPreferences, contentPreferences, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['personas', 'personaCount', 'artifacts'],
      properties: {
        personas: { type: 'array', items: { type: 'object' } },
        personaCount: { type: 'number' },
        platformPreferences: { type: 'object' },
        contentPreferences: { type: 'object' },
        engagementTimes: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'social-media', 'personas', 'audience']
}));

export const platformSelectionTask = defineTask('platform-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select priority platforms',
  agent: {
    name: 'platform-strategist',
    prompt: {
      role: 'social media platform strategist',
      task: 'Select and prioritize social media platforms based on objectives and audience',
      context: args,
      instructions: [
        'Evaluate platform alignment with business objectives',
        'Assess audience presence on each platform',
        'Consider resource requirements per platform',
        'Analyze platform-specific opportunities',
        'Prioritize platforms (primary, secondary, experimental)',
        'Define platform-specific goals',
        'Document rationale for selections',
        'Create platform prioritization matrix'
      ],
      outputFormat: 'JSON with priorityPlatforms, platformGoals, resourceRequirements, rationale, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['priorityPlatforms', 'artifacts'],
      properties: {
        priorityPlatforms: { type: 'array', items: { type: 'object' } },
        platformGoals: { type: 'object' },
        resourceRequirements: { type: 'object' },
        rationale: { type: 'object' },
        prioritizationMatrix: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'social-media', 'platform-selection']
}));

export const contentPillarsTask = defineTask('content-pillars', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish content pillars and themes',
  agent: {
    name: 'content-strategist',
    prompt: {
      role: 'social media content strategist',
      task: 'Establish content pillars and thematic framework',
      context: args,
      instructions: [
        'Define 4-6 content pillars aligned with brand',
        'Create content themes under each pillar',
        'Map pillars to business objectives',
        'Define content ratio across pillars',
        'Create content type guidelines per pillar',
        'Document pillar-to-platform mapping',
        'Develop example content ideas per pillar',
        'Create content pillar visual framework'
      ],
      outputFormat: 'JSON with framework, pillars, pillarCount, contentRatio, examples, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'pillarCount', 'artifacts'],
      properties: {
        framework: { type: 'object' },
        pillars: { type: 'array', items: { type: 'object' } },
        pillarCount: { type: 'number' },
        contentRatio: { type: 'object' },
        examples: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'social-media', 'content-pillars']
}));

export const brandVoiceTask = defineTask('brand-voice', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define brand voice and visual guidelines',
  agent: {
    name: 'brand-specialist',
    prompt: {
      role: 'brand and social media specialist',
      task: 'Define brand voice and visual guidelines for social media',
      context: args,
      instructions: [
        'Define brand voice attributes (tone, personality)',
        'Create voice do\'s and don\'ts',
        'Adapt voice for each platform',
        'Define visual style guidelines',
        'Create color and typography rules',
        'Document imagery guidelines',
        'Create template examples',
        'Develop brand voice cheat sheet'
      ],
      outputFormat: 'JSON with guidelines, voiceAttributes, visualStyle, platformAdaptations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['guidelines', 'artifacts'],
      properties: {
        guidelines: { type: 'object' },
        voiceAttributes: { type: 'array', items: { type: 'string' } },
        visualStyle: { type: 'object' },
        platformAdaptations: { type: 'object' },
        templates: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'social-media', 'brand-voice', 'visual-guidelines']
}));

export const calendarFrameworkTask = defineTask('calendar-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create content calendar framework',
  agent: {
    name: 'calendar-planner',
    prompt: {
      role: 'social media calendar planner',
      task: 'Create content calendar framework and posting schedule',
      context: args,
      instructions: [
        'Define posting frequency by platform',
        'Create content mix guidelines',
        'Plan recurring content series',
        'Incorporate key dates and events',
        'Define content lead times',
        'Create approval workflow',
        'Design calendar template',
        'Document calendar management process'
      ],
      outputFormat: 'JSON with framework, postingFrequency, contentMix, recurringContent, calendarTemplate, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'artifacts'],
      properties: {
        framework: { type: 'object' },
        postingFrequency: { type: 'object' },
        contentMix: { type: 'object' },
        recurringContent: { type: 'array', items: { type: 'object' } },
        calendarTemplate: { type: 'object' },
        approvalWorkflow: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'social-media', 'calendar', 'planning']
}));

export const engagementProtocolsTask = defineTask('engagement-protocols', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop community engagement protocols',
  agent: {
    name: 'community-manager',
    prompt: {
      role: 'social media community manager',
      task: 'Develop community engagement protocols and response guidelines',
      context: args,
      instructions: [
        'Define response time targets by platform',
        'Create response templates for common scenarios',
        'Develop escalation procedures',
        'Define proactive engagement tactics',
        'Create crisis response protocol',
        'Document community guidelines',
        'Define moderation policies',
        'Create engagement playbook'
      ],
      outputFormat: 'JSON with protocols, responseTemplates, escalationProcedures, crisisProtocol, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['protocols', 'artifacts'],
      properties: {
        protocols: { type: 'object' },
        responseTemplates: { type: 'array', items: { type: 'object' } },
        escalationProcedures: { type: 'object' },
        crisisProtocol: { type: 'object' },
        moderationPolicies: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'social-media', 'community', 'engagement']
}));

export const measurementPlanTask = defineTask('measurement-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish KPIs and measurement approach',
  agent: {
    name: 'measurement-specialist',
    prompt: {
      role: 'social media measurement specialist',
      task: 'Establish KPIs and measurement framework for social media',
      context: args,
      instructions: [
        'Define KPIs aligned with business objectives',
        'Set benchmarks and targets for each KPI',
        'Map metrics to funnel stages',
        'Define reporting frequency and format',
        'Create measurement dashboard design',
        'Document data sources and tools',
        'Define attribution approach',
        'Create measurement playbook'
      ],
      outputFormat: 'JSON with plan, kpis, kpiCount, benchmarks, dashboardDesign, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'kpiCount', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        kpis: { type: 'array', items: { type: 'object' } },
        kpiCount: { type: 'number' },
        benchmarks: { type: 'object' },
        dashboardDesign: { type: 'object' },
        reportingSchedule: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'social-media', 'measurement', 'kpis']
}));

export const strategyDocumentTask = defineTask('strategy-document', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive strategy document',
  agent: {
    name: 'strategy-writer',
    prompt: {
      role: 'social media strategy writer',
      task: 'Generate comprehensive social media strategy document',
      context: args,
      instructions: [
        'Create executive summary',
        'Document audit findings and competitive analysis',
        'Present audience personas',
        'Detail platform priorities and rationale',
        'Outline content pillar framework',
        'Include brand voice guidelines',
        'Present content calendar framework',
        'Document engagement protocols',
        'Include measurement plan',
        'Provide implementation roadmap',
        'Format as professional strategy document'
      ],
      outputFormat: 'JSON with documentPath, executiveSummary, keyRecommendations, artifacts'
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
  labels: ['agent', 'social-media', 'strategy', 'documentation']
}));
