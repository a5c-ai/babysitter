/**
 * @process digital-marketing/video-content-production
 * @description Process for planning, producing, and distributing video content across platforms including YouTube, social media, and website, from concept through post-production and publishing
 * @inputs { videoBrief: object, script: string, productionResources: object, distributionPlan: object, outputDir: string }
 * @outputs { success: boolean, finalVideoAssets: array, thumbnails: array, metadata: object, publishingDocumentation: object, performanceReports: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    videoBrief = {},
    script = '',
    productionResources = {},
    distributionPlan = {},
    outputDir = 'video-production-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Video Content Production Management process');

  // Task 1: Develop Video Concept and Script
  ctx.log('info', 'Phase 1: Developing video concept and script');
  const conceptScript = await ctx.task(videoConceptScriptTask, {
    videoBrief,
    script,
    outputDir
  });
  artifacts.push(...conceptScript.artifacts);

  // Task 2: Plan Production Requirements
  ctx.log('info', 'Phase 2: Planning production requirements');
  const productionPlan = await ctx.task(productionPlanningTask, {
    conceptScript,
    productionResources,
    outputDir
  });
  artifacts.push(...productionPlan.artifacts);

  // Task 3: Pre-Production Coordination
  ctx.log('info', 'Phase 3: Coordinating pre-production logistics');
  const preProduction = await ctx.task(preProductionTask, {
    productionPlan,
    productionResources,
    outputDir
  });
  artifacts.push(...preProduction.artifacts);

  // Task 4: Filming/Recording Management
  ctx.log('info', 'Phase 4: Managing filming/recording process');
  const filmingMgmt = await ctx.task(filmingManagementTask, {
    preProduction,
    productionPlan,
    outputDir
  });
  artifacts.push(...filmingMgmt.artifacts);

  // Task 5: Post-Production Editing
  ctx.log('info', 'Phase 5: Overseeing post-production editing');
  const postProduction = await ctx.task(postProductionTask, {
    filmingMgmt,
    conceptScript,
    outputDir
  });
  artifacts.push(...postProduction.artifacts);

  // Task 6: Create Thumbnails and Cover Images
  ctx.log('info', 'Phase 6: Creating thumbnails and cover images');
  const thumbnails = await ctx.task(thumbnailCreationTask, {
    postProduction,
    videoBrief,
    outputDir
  });
  artifacts.push(...thumbnails.artifacts);

  // Task 7: Write SEO Metadata
  ctx.log('info', 'Phase 7: Writing titles, descriptions, and tags');
  const seoMetadata = await ctx.task(videoSeoTask, {
    conceptScript,
    videoBrief,
    distributionPlan,
    outputDir
  });
  artifacts.push(...seoMetadata.artifacts);

  // Breakpoint: Review video before publishing
  await ctx.breakpoint({
    question: `Video production complete. Duration: ${postProduction.duration}. ${thumbnails.thumbnailCount} thumbnails created. Ready to publish?`,
    title: 'Video Production Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        videoDuration: postProduction.duration,
        thumbnailCount: thumbnails.thumbnailCount,
        platforms: distributionPlan.platforms?.length || 0,
        seoScore: seoMetadata.seoScore
      }
    }
  });

  // Task 8: Schedule and Publish
  ctx.log('info', 'Phase 8: Scheduling and publishing across platforms');
  const publishing = await ctx.task(videoPublishingTask, {
    postProduction,
    thumbnails,
    seoMetadata,
    distributionPlan,
    outputDir
  });
  artifacts.push(...publishing.artifacts);

  // Task 9: Promotion and Amplification
  ctx.log('info', 'Phase 9: Setting up promotion and amplification');
  const promotion = await ctx.task(videoPromotionTask, {
    publishing,
    distributionPlan,
    outputDir
  });
  artifacts.push(...promotion.artifacts);

  // Task 10: Performance Analysis Setup
  ctx.log('info', 'Phase 10: Setting up performance analysis');
  const performanceSetup = await ctx.task(videoPerformanceTask, {
    publishing,
    videoBrief,
    outputDir
  });
  artifacts.push(...performanceSetup.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    finalVideoAssets: postProduction.assets,
    thumbnails: thumbnails.thumbnailAssets,
    metadata: seoMetadata.metadata,
    publishingDocumentation: publishing.documentation,
    promotionPlan: promotion.plan,
    performanceReports: performanceSetup.reportTemplates,
    artifacts,
    duration,
    metadata: {
      processId: 'digital-marketing/video-content-production',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task definitions
export const videoConceptScriptTask = defineTask('video-concept-script', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop video concept and script',
  agent: {
    name: 'video-creative',
    prompt: {
      role: 'video creative director',
      task: 'Develop video concept and write detailed script',
      context: args,
      instructions: [
        'Define video concept and creative direction',
        'Identify target audience and key messages',
        'Write detailed script with dialogue/narration',
        'Include visual directions and shot descriptions',
        'Plan B-roll and supporting footage',
        'Define video style and tone',
        'Create storyboard outline',
        'Estimate video duration'
      ],
      outputFormat: 'JSON with concept, script, storyboard, duration, visualDirections, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['concept', 'script', 'artifacts'],
      properties: {
        concept: { type: 'object' },
        script: { type: 'string' },
        storyboard: { type: 'array', items: { type: 'object' } },
        duration: { type: 'string' },
        visualDirections: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'video-production', 'concept', 'script']
}));

export const productionPlanningTask = defineTask('production-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan production requirements',
  agent: {
    name: 'production-planner',
    prompt: {
      role: 'video production planner',
      task: 'Plan all production requirements including talent, location, and equipment',
      context: args,
      instructions: [
        'Identify talent requirements (on-camera, voice-over)',
        'Scout and select filming locations',
        'Define equipment requirements',
        'Create production budget',
        'Plan crew requirements',
        'Create production timeline',
        'Identify permits and releases needed',
        'Document production plan'
      ],
      outputFormat: 'JSON with plan, talentRequirements, locations, equipment, budget, timeline, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        talentRequirements: { type: 'array', items: { type: 'object' } },
        locations: { type: 'array', items: { type: 'object' } },
        equipment: { type: 'array', items: { type: 'object' } },
        budget: { type: 'object' },
        timeline: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'video-production', 'planning']
}));

export const preProductionTask = defineTask('pre-production', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Coordinate pre-production logistics',
  agent: {
    name: 'pre-production-coordinator',
    prompt: {
      role: 'pre-production coordinator',
      task: 'Coordinate all pre-production logistics',
      context: args,
      instructions: [
        'Book talent and confirm schedules',
        'Reserve locations and equipment',
        'Coordinate crew assignments',
        'Prepare call sheets',
        'Organize props and wardrobe',
        'Confirm permits and releases',
        'Create shot list',
        'Conduct pre-production meeting'
      ],
      outputFormat: 'JSON with logistics, callSheets, shotList, confirmations, checklist, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['logistics', 'artifacts'],
      properties: {
        logistics: { type: 'object' },
        callSheets: { type: 'array', items: { type: 'object' } },
        shotList: { type: 'array', items: { type: 'object' } },
        confirmations: { type: 'object' },
        checklist: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'video-production', 'pre-production']
}));

export const filmingManagementTask = defineTask('filming-management', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Manage filming/recording process',
  agent: {
    name: 'filming-manager',
    prompt: {
      role: 'production manager',
      task: 'Manage the filming/recording production process',
      context: args,
      instructions: [
        'Execute shot list systematically',
        'Monitor quality during filming',
        'Manage talent performance',
        'Track footage captured vs. planned',
        'Handle on-set issues and adjustments',
        'Ensure backup of all footage',
        'Document any script changes',
        'Create production wrap report'
      ],
      outputFormat: 'JSON with productionLog, footageCaptured, qualityNotes, issues, wrapReport, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['productionLog', 'artifacts'],
      properties: {
        productionLog: { type: 'object' },
        footageCaptured: { type: 'array', items: { type: 'object' } },
        qualityNotes: { type: 'array', items: { type: 'string' } },
        issues: { type: 'array', items: { type: 'object' } },
        wrapReport: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'video-production', 'filming']
}));

export const postProductionTask = defineTask('post-production', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Oversee post-production editing',
  agent: {
    name: 'post-production-supervisor',
    prompt: {
      role: 'post-production supervisor',
      task: 'Oversee video editing and post-production process',
      context: args,
      instructions: [
        'Review and organize raw footage',
        'Create rough cut edit',
        'Add graphics, titles, and lower thirds',
        'Incorporate B-roll and stock footage',
        'Color correction and grading',
        'Audio mixing and sound design',
        'Add music and sound effects',
        'Export in multiple formats for distribution'
      ],
      outputFormat: 'JSON with assets, duration, editNotes, formats, qualityChecks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assets', 'duration', 'artifacts'],
      properties: {
        assets: { type: 'array', items: { type: 'object' } },
        duration: { type: 'string' },
        editNotes: { type: 'array', items: { type: 'string' } },
        formats: { type: 'array', items: { type: 'object' } },
        qualityChecks: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'video-production', 'post-production', 'editing']
}));

export const thumbnailCreationTask = defineTask('thumbnail-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create thumbnails and cover images',
  agent: {
    name: 'thumbnail-designer',
    prompt: {
      role: 'video thumbnail designer',
      task: 'Create compelling thumbnails and cover images for video',
      context: args,
      instructions: [
        'Select key frames for thumbnail base',
        'Design attention-grabbing thumbnails',
        'Create multiple variations for A/B testing',
        'Ensure text readability at small sizes',
        'Maintain brand consistency',
        'Optimize for each platform specifications',
        'Create cover images for different placements',
        'Document thumbnail design rationale'
      ],
      outputFormat: 'JSON with thumbnailAssets, thumbnailCount, variations, specifications, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['thumbnailAssets', 'thumbnailCount', 'artifacts'],
      properties: {
        thumbnailAssets: { type: 'array', items: { type: 'object' } },
        thumbnailCount: { type: 'number' },
        variations: { type: 'array', items: { type: 'object' } },
        specifications: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'video-production', 'thumbnails', 'design']
}));

export const videoSeoTask = defineTask('video-seo', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write titles, descriptions, and tags',
  agent: {
    name: 'video-seo-specialist',
    prompt: {
      role: 'video SEO specialist',
      task: 'Optimize video metadata for search and discovery',
      context: args,
      instructions: [
        'Write compelling, keyword-optimized titles',
        'Create detailed descriptions with timestamps',
        'Research and select relevant tags',
        'Create platform-specific metadata',
        'Write YouTube chapters/timestamps',
        'Optimize for YouTube search algorithm',
        'Create hashtag strategy',
        'Document SEO recommendations'
      ],
      outputFormat: 'JSON with metadata, seoScore, titles, descriptions, tags, chapters, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['metadata', 'seoScore', 'artifacts'],
      properties: {
        metadata: { type: 'object' },
        seoScore: { type: 'number' },
        titles: { type: 'array', items: { type: 'string' } },
        descriptions: { type: 'object' },
        tags: { type: 'array', items: { type: 'string' } },
        chapters: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'video-production', 'seo', 'metadata']
}));

export const videoPublishingTask = defineTask('video-publishing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Schedule and publish across platforms',
  agent: {
    name: 'video-publisher',
    prompt: {
      role: 'video publishing specialist',
      task: 'Schedule and publish video across all platforms',
      context: args,
      instructions: [
        'Upload video to each platform',
        'Apply platform-specific metadata',
        'Set optimal publish times',
        'Configure end screens and cards',
        'Set up playlists and series',
        'Configure subtitles/captions',
        'Set monetization options',
        'Document publishing checklist'
      ],
      outputFormat: 'JSON with documentation, publishSchedule, platformConfigs, captions, checklist, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentation', 'artifacts'],
      properties: {
        documentation: { type: 'object' },
        publishSchedule: { type: 'object' },
        platformConfigs: { type: 'array', items: { type: 'object' } },
        captions: { type: 'object' },
        checklist: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'video-production', 'publishing']
}));

export const videoPromotionTask = defineTask('video-promotion', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up promotion and amplification',
  agent: {
    name: 'video-promoter',
    prompt: {
      role: 'video promotion specialist',
      task: 'Plan and execute video promotion and amplification',
      context: args,
      instructions: [
        'Create social media promotion plan',
        'Design teaser content and clips',
        'Plan email promotion',
        'Identify embedding opportunities',
        'Plan paid promotion strategy',
        'Coordinate cross-promotion',
        'Set up community engagement plan',
        'Document promotion playbook'
      ],
      outputFormat: 'JSON with plan, socialPlan, teasers, paidStrategy, crossPromotion, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        socialPlan: { type: 'object' },
        teasers: { type: 'array', items: { type: 'object' } },
        paidStrategy: { type: 'object' },
        crossPromotion: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'video-production', 'promotion', 'amplification']
}));

export const videoPerformanceTask = defineTask('video-performance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up performance analysis',
  agent: {
    name: 'video-analyst',
    prompt: {
      role: 'video performance analyst',
      task: 'Set up video performance tracking and analysis',
      context: args,
      instructions: [
        'Define key performance metrics',
        'Set up YouTube Analytics tracking',
        'Configure cross-platform analytics',
        'Set performance benchmarks',
        'Create reporting dashboards',
        'Set up automated alerts',
        'Plan retention analysis',
        'Create report templates'
      ],
      outputFormat: 'JSON with metrics, dashboards, benchmarks, alerts, reportTemplates, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'reportTemplates', 'artifacts'],
      properties: {
        metrics: { type: 'array', items: { type: 'object' } },
        dashboards: { type: 'array', items: { type: 'object' } },
        benchmarks: { type: 'object' },
        alerts: { type: 'array', items: { type: 'object' } },
        reportTemplates: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'video-production', 'performance', 'analytics']
}));
