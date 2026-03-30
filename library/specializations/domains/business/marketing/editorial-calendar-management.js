/**
 * @process marketing/editorial-calendar-management
 * @description Plan, schedule, and coordinate content production across formats (blog, video, podcast, social) with topic clusters and SEO integration.
 * @inputs { contentStrategy: object, contentPillars: array, targetKeywords: array, teamResources: object, publishingChannels: array, planningPeriod: string }
 * @outputs { success: boolean, editorialCalendar: object, topicPlan: array, productionSchedule: object, seoIntegration: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    contentStrategy = {},
    contentPillars = [],
    targetKeywords = [],
    teamResources = {},
    publishingChannels = [],
    planningPeriod = 'quarterly',
    outputDir = 'editorial-calendar-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Editorial Calendar Management for ${planningPeriod} period`);

  // ============================================================================
  // PHASE 1: TOPIC IDEATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Generating topic ideas');
  const topicIdeation = await ctx.task(topicIdeationTask, {
    contentStrategy,
    contentPillars,
    targetKeywords,
    planningPeriod,
    outputDir
  });

  artifacts.push(...topicIdeation.artifacts);

  // ============================================================================
  // PHASE 2: SEO KEYWORD MAPPING
  // ============================================================================

  ctx.log('info', 'Phase 2: Mapping topics to SEO keywords');
  const seoMapping = await ctx.task(seoKeywordMappingTask, {
    topicIdeation,
    targetKeywords,
    contentPillars,
    outputDir
  });

  artifacts.push(...seoMapping.artifacts);

  // ============================================================================
  // PHASE 3: TOPIC CLUSTER ORGANIZATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Organizing topics into clusters');
  const topicClusters = await ctx.task(topicClusterOrganizationTask, {
    topicIdeation,
    seoMapping,
    contentPillars,
    outputDir
  });

  artifacts.push(...topicClusters.artifacts);

  // ============================================================================
  // PHASE 4: CONTENT FORMAT ASSIGNMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Assigning content formats');
  const formatAssignment = await ctx.task(contentFormatAssignmentTask, {
    topicClusters,
    contentStrategy,
    publishingChannels,
    outputDir
  });

  artifacts.push(...formatAssignment.artifacts);

  // ============================================================================
  // PHASE 5: PUBLICATION SCHEDULE CREATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Creating publication schedule');
  const publicationSchedule = await ctx.task(publicationScheduleTask, {
    formatAssignment,
    topicClusters,
    publishingChannels,
    planningPeriod,
    outputDir
  });

  artifacts.push(...publicationSchedule.artifacts);

  // ============================================================================
  // PHASE 6: RESOURCE ALLOCATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Allocating production resources');
  const resourceAllocation = await ctx.task(resourceAllocationTask, {
    publicationSchedule,
    formatAssignment,
    teamResources,
    outputDir
  });

  artifacts.push(...resourceAllocation.artifacts);

  // ============================================================================
  // PHASE 7: PRODUCTION WORKFLOW SETUP
  // ============================================================================

  ctx.log('info', 'Phase 7: Setting up production workflows');
  const productionWorkflow = await ctx.task(productionWorkflowTask, {
    publicationSchedule,
    resourceAllocation,
    formatAssignment,
    outputDir
  });

  artifacts.push(...productionWorkflow.artifacts);

  // ============================================================================
  // PHASE 8: PROMOTION PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 8: Planning content promotion');
  const promotionPlan = await ctx.task(promotionPlanningTask, {
    publicationSchedule,
    publishingChannels,
    topicClusters,
    outputDir
  });

  artifacts.push(...promotionPlan.artifacts);

  // ============================================================================
  // PHASE 9: CALENDAR INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Creating integrated calendar view');
  const calendarIntegration = await ctx.task(calendarIntegrationTask, {
    publicationSchedule,
    resourceAllocation,
    productionWorkflow,
    promotionPlan,
    planningPeriod,
    outputDir
  });

  artifacts.push(...calendarIntegration.artifacts);

  // ============================================================================
  // PHASE 10: CALENDAR QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 10: Assessing calendar quality');
  const qualityAssessment = await ctx.task(calendarQualityAssessmentTask, {
    topicIdeation,
    seoMapping,
    topicClusters,
    publicationSchedule,
    resourceAllocation,
    productionWorkflow,
    calendarIntegration,
    outputDir
  });

  artifacts.push(...qualityAssessment.artifacts);

  const calendarScore = qualityAssessment.overallScore;
  const qualityMet = calendarScore >= 80;

  // Breakpoint: Review editorial calendar
  await ctx.breakpoint({
    question: `Editorial calendar complete. Quality score: ${calendarScore}/100. ${qualityMet ? 'Calendar meets quality standards!' : 'Calendar may need refinement.'} Review and approve?`,
    title: 'Editorial Calendar Review & Approval',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        calendarScore,
        qualityMet,
        planningPeriod,
        totalArtifacts: artifacts.length,
        topicCount: topicIdeation.topics?.length || 0,
        clusterCount: topicClusters.clusters?.length || 0,
        scheduledPieces: publicationSchedule.scheduledContent?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    planningPeriod,
    calendarScore,
    qualityMet,
    editorialCalendar: calendarIntegration.calendar,
    topicPlan: topicClusters.clusters,
    productionSchedule: {
      schedule: publicationSchedule.schedule,
      resources: resourceAllocation.allocation,
      workflow: productionWorkflow.workflow
    },
    seoIntegration: {
      keywordMapping: seoMapping.mapping,
      topicClusters: topicClusters.clusters
    },
    promotionPlan: promotionPlan.plan,
    artifacts,
    duration,
    metadata: {
      processId: 'marketing/editorial-calendar-management',
      timestamp: startTime,
      planningPeriod,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Topic Ideation
export const topicIdeationTask = defineTask('topic-ideation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate topic ideas',
  agent: {
    name: 'topic-ideator',
    prompt: {
      role: 'content strategist and ideation specialist',
      task: 'Generate comprehensive topic ideas aligned with content strategy',
      context: args,
      instructions: [
        'Generate topic ideas for each content pillar',
        'Identify trending topics in the industry',
        'Create seasonal and timely content ideas',
        'Generate evergreen topic ideas',
        'Identify FAQ and how-to topics',
        'Create thought leadership topics',
        'Generate content series ideas',
        'Prioritize topics by value and feasibility',
        'Generate topic ideation document'
      ],
      outputFormat: 'JSON with topics (array), byPillar (object), trending (array), evergreen (array), series (array), prioritization (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['topics', 'byPillar', 'prioritization', 'artifacts'],
      properties: {
        topics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              topic: { type: 'string' },
              pillar: { type: 'string' },
              type: { type: 'string' },
              priority: { type: 'string' }
            }
          }
        },
        byPillar: { type: 'object' },
        trending: { type: 'array', items: { type: 'string' } },
        evergreen: { type: 'array', items: { type: 'string' } },
        series: { type: 'array' },
        prioritization: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'editorial-calendar', 'ideation']
}));

// Task 2: SEO Keyword Mapping
export const seoKeywordMappingTask = defineTask('seo-keyword-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map topics to SEO keywords',
  agent: {
    name: 'seo-mapper',
    prompt: {
      role: 'SEO specialist and content strategist',
      task: 'Map content topics to target keywords for SEO optimization',
      context: args,
      instructions: [
        'Assign primary keywords to each topic',
        'Identify secondary and related keywords',
        'Analyze keyword search volume and difficulty',
        'Map keywords to search intent',
        'Identify keyword gaps and opportunities',
        'Create keyword clustering strategy',
        'Define keyword priority by business value',
        'Plan internal linking keywords',
        'Generate SEO keyword mapping document'
      ],
      outputFormat: 'JSON with mapping (array), keywordMetrics (object), gaps (array), priorities (object), internalLinking (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['mapping', 'keywordMetrics', 'artifacts'],
      properties: {
        mapping: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              topic: { type: 'string' },
              primaryKeyword: { type: 'string' },
              secondaryKeywords: { type: 'array', items: { type: 'string' } },
              searchIntent: { type: 'string' }
            }
          }
        },
        keywordMetrics: { type: 'object' },
        gaps: { type: 'array', items: { type: 'string' } },
        priorities: { type: 'object' },
        internalLinking: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'editorial-calendar', 'seo']
}));

// Task 3: Topic Cluster Organization
export const topicClusterOrganizationTask = defineTask('topic-cluster-organization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Organize topics into clusters',
  agent: {
    name: 'cluster-organizer',
    prompt: {
      role: 'content architect and SEO strategist',
      task: 'Organize topics into pillar-cluster structure for SEO authority',
      context: args,
      instructions: [
        'Group topics into thematic clusters',
        'Identify pillar page topics',
        'Map cluster topics to pillar pages',
        'Define internal linking structure',
        'Sequence cluster content logically',
        'Identify content dependencies',
        'Plan cluster publishing order',
        'Define cluster completion milestones',
        'Generate topic cluster document'
      ],
      outputFormat: 'JSON with clusters (array), pillarPages (array), linkingStructure (object), sequence (object), dependencies (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['clusters', 'pillarPages', 'linkingStructure', 'artifacts'],
      properties: {
        clusters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              cluster: { type: 'string' },
              pillarPage: { type: 'string' },
              clusterTopics: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        pillarPages: { type: 'array' },
        linkingStructure: { type: 'object' },
        sequence: { type: 'object' },
        dependencies: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'editorial-calendar', 'clusters']
}));

// Task 4: Content Format Assignment
export const contentFormatAssignmentTask = defineTask('content-format-assignment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assign content formats',
  agent: {
    name: 'format-planner',
    prompt: {
      role: 'content production manager',
      task: 'Assign appropriate content formats to topics',
      context: args,
      instructions: [
        'Match topics to optimal content formats',
        'Consider audience preferences by format',
        'Balance content mix across formats',
        'Identify repurposing opportunities',
        'Plan multi-format content packages',
        'Consider production complexity',
        'Align formats to publishing channels',
        'Plan format experiments',
        'Generate format assignment document'
      ],
      outputFormat: 'JSON with assignments (array), formatMix (object), repurposing (array), packages (array), channelAlignment (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assignments', 'formatMix', 'artifacts'],
      properties: {
        assignments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              topic: { type: 'string' },
              primaryFormat: { type: 'string' },
              secondaryFormats: { type: 'array', items: { type: 'string' } },
              channels: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        formatMix: {
          type: 'object',
          properties: {
            blog: { type: 'number' },
            video: { type: 'number' },
            podcast: { type: 'number' },
            social: { type: 'number' },
            other: { type: 'number' }
          }
        },
        repurposing: { type: 'array' },
        packages: { type: 'array' },
        channelAlignment: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'editorial-calendar', 'formats']
}));

// Task 5: Publication Schedule
export const publicationScheduleTask = defineTask('publication-schedule', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create publication schedule',
  agent: {
    name: 'schedule-planner',
    prompt: {
      role: 'editorial calendar manager',
      task: 'Create detailed publication schedule with dates and cadence',
      context: args,
      instructions: [
        'Define publishing frequency by format',
        'Schedule content across the planning period',
        'Balance content across pillars',
        'Account for seasonal and event content',
        'Schedule pillar pages before cluster content',
        'Plan buffer for flexibility',
        'Identify key publishing dates',
        'Create weekly and monthly views',
        'Generate publication schedule document'
      ],
      outputFormat: 'JSON with schedule (array), frequency (object), scheduledContent (array), keyDates (array), calendarView (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['schedule', 'frequency', 'scheduledContent', 'artifacts'],
      properties: {
        schedule: { type: 'array' },
        frequency: {
          type: 'object',
          properties: {
            blog: { type: 'string' },
            video: { type: 'string' },
            podcast: { type: 'string' },
            social: { type: 'string' }
          }
        },
        scheduledContent: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              topic: { type: 'string' },
              format: { type: 'string' },
              publishDate: { type: 'string' },
              channel: { type: 'string' }
            }
          }
        },
        keyDates: { type: 'array' },
        calendarView: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'editorial-calendar', 'schedule']
}));

// Task 6: Resource Allocation
export const resourceAllocationTask = defineTask('resource-allocation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Allocate production resources',
  agent: {
    name: 'resource-manager',
    prompt: {
      role: 'content production manager',
      task: 'Allocate team resources to content production',
      context: args,
      instructions: [
        'Map content to team roles',
        'Allocate writers to topics',
        'Assign designers and video producers',
        'Balance workload across team',
        'Identify resource gaps',
        'Plan for freelance or agency support',
        'Create assignment schedule',
        'Define deadlines and milestones',
        'Generate resource allocation document'
      ],
      outputFormat: 'JSON with allocation (array), roleAssignments (object), workloadBalance (object), gaps (array), freelanceNeeds (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['allocation', 'roleAssignments', 'artifacts'],
      properties: {
        allocation: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              content: { type: 'string' },
              writer: { type: 'string' },
              designer: { type: 'string' },
              deadline: { type: 'string' }
            }
          }
        },
        roleAssignments: { type: 'object' },
        workloadBalance: { type: 'object' },
        gaps: { type: 'array', items: { type: 'string' } },
        freelanceNeeds: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'editorial-calendar', 'resources']
}));

// Task 7: Production Workflow
export const productionWorkflowTask = defineTask('production-workflow', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up production workflows',
  agent: {
    name: 'workflow-designer',
    prompt: {
      role: 'content operations specialist',
      task: 'Design content production workflows for each format',
      context: args,
      instructions: [
        'Define workflow stages by content type',
        'Set SLAs for each stage',
        'Define review and approval process',
        'Create brief templates',
        'Define feedback loops',
        'Plan quality checkpoints',
        'Create status tracking approach',
        'Define escalation process',
        'Generate workflow documentation'
      ],
      outputFormat: 'JSON with workflow (object), stages (array), slas (object), approvalProcess (object), templates (array), qualityCheckpoints (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['workflow', 'stages', 'slas', 'artifacts'],
      properties: {
        workflow: {
          type: 'object',
          properties: {
            blog: { type: 'array' },
            video: { type: 'array' },
            social: { type: 'array' }
          }
        },
        stages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stage: { type: 'string' },
              owner: { type: 'string' },
              sla: { type: 'string' }
            }
          }
        },
        slas: { type: 'object' },
        approvalProcess: { type: 'object' },
        templates: { type: 'array', items: { type: 'string' } },
        qualityCheckpoints: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'editorial-calendar', 'workflow']
}));

// Task 8: Promotion Planning
export const promotionPlanningTask = defineTask('promotion-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan content promotion',
  agent: {
    name: 'promotion-planner',
    prompt: {
      role: 'content distribution specialist',
      task: 'Plan promotion activities for published content',
      context: args,
      instructions: [
        'Define promotion channels per content type',
        'Create social media promotion schedule',
        'Plan email newsletter inclusions',
        'Identify paid promotion opportunities',
        'Plan influencer and partner sharing',
        'Create promotion templates',
        'Schedule promotional activities',
        'Define promotion metrics',
        'Generate promotion plan document'
      ],
      outputFormat: 'JSON with plan (object), socialSchedule (object), emailPlan (object), paidPromotion (array), partnerSharing (array), templates (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'socialSchedule', 'artifacts'],
      properties: {
        plan: {
          type: 'object',
          properties: {
            strategy: { type: 'string' },
            channels: { type: 'array', items: { type: 'string' } }
          }
        },
        socialSchedule: { type: 'object' },
        emailPlan: { type: 'object' },
        paidPromotion: { type: 'array' },
        partnerSharing: { type: 'array' },
        templates: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'editorial-calendar', 'promotion']
}));

// Task 9: Calendar Integration
export const calendarIntegrationTask = defineTask('calendar-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create integrated calendar view',
  agent: {
    name: 'calendar-integrator',
    prompt: {
      role: 'editorial operations manager',
      task: 'Create integrated editorial calendar with all activities',
      context: args,
      instructions: [
        'Consolidate all content into single view',
        'Create monthly calendar view',
        'Create weekly calendar view',
        'Include production milestones',
        'Include promotion activities',
        'Add resource assignments',
        'Create filtering and sorting views',
        'Generate exportable formats',
        'Create calendar documentation'
      ],
      outputFormat: 'JSON with calendar (object), monthlyView (object), weeklyView (object), filters (array), exportFormats (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['calendar', 'monthlyView', 'weeklyView', 'artifacts'],
      properties: {
        calendar: {
          type: 'object',
          properties: {
            entries: { type: 'array' },
            totalContent: { type: 'number' },
            period: { type: 'string' }
          }
        },
        monthlyView: { type: 'object' },
        weeklyView: { type: 'object' },
        filters: { type: 'array', items: { type: 'string' } },
        exportFormats: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'editorial-calendar', 'integration']
}));

// Task 10: Calendar Quality Assessment
export const calendarQualityAssessmentTask = defineTask('calendar-quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess calendar quality',
  agent: {
    name: 'calendar-validator',
    prompt: {
      role: 'content operations director',
      task: 'Assess overall editorial calendar quality and readiness',
      context: args,
      instructions: [
        'Evaluate topic quality and variety (weight: 15%)',
        'Assess SEO integration (weight: 15%)',
        'Review cluster organization (weight: 15%)',
        'Evaluate schedule feasibility (weight: 15%)',
        'Assess resource allocation (weight: 15%)',
        'Review workflow completeness (weight: 10%)',
        'Evaluate promotion planning (weight: 10%)',
        'Assess calendar usability (weight: 5%)',
        'Calculate weighted overall score (0-100)',
        'Identify gaps and recommendations'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), componentScores (object), gaps (array), recommendations (array), strengths (array), readinessLevel (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            topicQuality: { type: 'number' },
            seoIntegration: { type: 'number' },
            clusterOrganization: { type: 'number' },
            scheduleFeasibility: { type: 'number' },
            resourceAllocation: { type: 'number' },
            workflowCompleteness: { type: 'number' },
            promotionPlanning: { type: 'number' },
            calendarUsability: { type: 'number' }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        strengths: { type: 'array', items: { type: 'string' } },
        readinessLevel: { type: 'string', enum: ['ready', 'minor-revisions', 'major-revisions'] },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'editorial-calendar', 'quality-assessment']
}));
