/**
 * @process digital-marketing/influencer-relationship
 * @description Ongoing process for building and nurturing long-term relationships with influencers and brand ambassadors, ensuring sustained partnerships and authentic advocacy
 * @inputs { influencerDatabase: object, partnershipHistory: object, brandUpdates: array, productInformation: object, outputDir: string }
 * @outputs { success: boolean, updatedInfluencerProfiles: array, communicationLogs: array, ambassadorProgramDocumentation: object, renewalRecommendations: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    influencerDatabase = {},
    partnershipHistory = {},
    brandUpdates = [],
    productInformation = {},
    outputDir = 'influencer-relationship-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Influencer Relationship Management process');

  // Task 1: Maintain Influencer Database
  ctx.log('info', 'Phase 1: Maintaining influencer database and profiles');
  const databaseMaintenance = await ctx.task(databaseMaintenanceTask, {
    influencerDatabase,
    outputDir
  });
  artifacts.push(...databaseMaintenance.artifacts);

  // Task 2: Track Partnership History
  ctx.log('info', 'Phase 2: Tracking partnership history and performance');
  const historyTracking = await ctx.task(partnershipHistoryTask, {
    partnershipHistory,
    influencerDatabase,
    outputDir
  });
  artifacts.push(...historyTracking.artifacts);

  // Task 3: Regular Partner Communication
  ctx.log('info', 'Phase 3: Setting up regular partner communication');
  const communicationSetup = await ctx.task(partnerCommunicationTask, {
    influencerDatabase,
    brandUpdates,
    outputDir
  });
  artifacts.push(...communicationSetup.artifacts);

  // Task 4: Share Brand Updates
  ctx.log('info', 'Phase 4: Sharing brand updates and opportunities');
  const brandUpdatesSharing = await ctx.task(brandUpdatesSharingTask, {
    brandUpdates,
    influencerDatabase,
    communicationSetup,
    outputDir
  });
  artifacts.push(...brandUpdatesSharing.artifacts);

  // Task 5: Product Seeding and Gifting
  ctx.log('info', 'Phase 5: Facilitating product seeding and gifting');
  const productSeeding = await ctx.task(productSeedingTask, {
    productInformation,
    influencerDatabase,
    outputDir
  });
  artifacts.push(...productSeeding.artifacts);

  // Task 6: Recognize Top Performers
  ctx.log('info', 'Phase 6: Recognizing and rewarding top performers');
  const recognition = await ctx.task(performerRecognitionTask, {
    partnershipHistory,
    influencerDatabase,
    outputDir
  });
  artifacts.push(...recognition.artifacts);

  // Task 7: Gather Feedback and Insights
  ctx.log('info', 'Phase 7: Gathering partner feedback and insights');
  const feedbackGathering = await ctx.task(feedbackGatheringTask, {
    influencerDatabase,
    outputDir
  });
  artifacts.push(...feedbackGathering.artifacts);

  // Task 8: Plan Ambassador Program
  ctx.log('info', 'Phase 8: Planning ambassador program activities');
  const ambassadorProgram = await ctx.task(ambassadorProgramTask, {
    influencerDatabase,
    partnershipHistory,
    recognition,
    outputDir
  });
  artifacts.push(...ambassadorProgram.artifacts);

  // Breakpoint: Review relationship health
  await ctx.breakpoint({
    question: `Influencer relationship management update complete. ${databaseMaintenance.activePartners} active partners tracked. Ambassador program activities planned. Review?`,
    title: 'Influencer Relationship Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        activePartners: databaseMaintenance.activePartners,
        topPerformers: recognition.topPerformerCount,
        pendingRenewals: historyTracking.pendingRenewals
      }
    }
  });

  // Task 9: Monitor Compliance
  ctx.log('info', 'Phase 9: Monitoring compliance and disclosure');
  const complianceMonitoring = await ctx.task(complianceMonitoringTask, {
    influencerDatabase,
    partnershipHistory,
    outputDir
  });
  artifacts.push(...complianceMonitoring.artifacts);

  // Task 10: Evaluate Renewals
  ctx.log('info', 'Phase 10: Evaluating partnership renewals');
  const renewalEvaluation = await ctx.task(renewalEvaluationTask, {
    partnershipHistory,
    influencerDatabase,
    recognition,
    complianceMonitoring,
    outputDir
  });
  artifacts.push(...renewalEvaluation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    updatedInfluencerProfiles: databaseMaintenance.profiles,
    communicationLogs: communicationSetup.logs,
    ambassadorProgramDocumentation: ambassadorProgram.documentation,
    renewalRecommendations: renewalEvaluation.recommendations,
    topPerformers: recognition.topPerformers,
    complianceStatus: complianceMonitoring.status,
    productSeedingPlan: productSeeding.plan,
    artifacts,
    duration,
    metadata: {
      processId: 'digital-marketing/influencer-relationship',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task definitions
export const databaseMaintenanceTask = defineTask('database-maintenance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Maintain influencer database and profiles',
  agent: {
    name: 'database-manager',
    prompt: {
      role: 'influencer database manager',
      task: 'Maintain and update influencer database and profiles',
      context: args,
      instructions: [
        'Audit current database completeness',
        'Update influencer contact information',
        'Refresh follower counts and metrics',
        'Update content categories and niches',
        'Tag and categorize influencers',
        'Archive inactive relationships',
        'Add new potential partners',
        'Document database health metrics'
      ],
      outputFormat: 'JSON with profiles, activePartners, databaseHealth, updates, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['profiles', 'activePartners', 'artifacts'],
      properties: {
        profiles: { type: 'array', items: { type: 'object' } },
        activePartners: { type: 'number' },
        databaseHealth: { type: 'object' },
        updates: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'influencer-relationship', 'database', 'profiles']
}));

export const partnershipHistoryTask = defineTask('partnership-history', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Track partnership history and performance',
  agent: {
    name: 'history-tracker',
    prompt: {
      role: 'partnership history analyst',
      task: 'Track and document partnership history and performance',
      context: args,
      instructions: [
        'Document all campaign participations',
        'Track performance metrics per partnership',
        'Calculate lifetime value per influencer',
        'Track payment history',
        'Document content produced',
        'Identify partnership trends',
        'Flag upcoming renewals',
        'Create partnership scorecards'
      ],
      outputFormat: 'JSON with history, lifetimeValues, pendingRenewals, scorecards, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['history', 'pendingRenewals', 'artifacts'],
      properties: {
        history: { type: 'object' },
        lifetimeValues: { type: 'object' },
        pendingRenewals: { type: 'number' },
        scorecards: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'influencer-relationship', 'history', 'performance']
}));

export const partnerCommunicationTask = defineTask('partner-communication', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up regular partner communication',
  agent: {
    name: 'communication-manager',
    prompt: {
      role: 'influencer communications manager',
      task: 'Establish and maintain regular communication with influencer partners',
      context: args,
      instructions: [
        'Create communication calendar',
        'Draft newsletter templates',
        'Set up communication channels',
        'Plan check-in cadence',
        'Create personalized outreach templates',
        'Plan exclusive previews and announcements',
        'Set up automated touchpoints',
        'Document communication protocols'
      ],
      outputFormat: 'JSON with communicationPlan, templates, logs, cadence, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['communicationPlan', 'logs', 'artifacts'],
      properties: {
        communicationPlan: { type: 'object' },
        templates: { type: 'array', items: { type: 'object' } },
        logs: { type: 'array', items: { type: 'object' } },
        cadence: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'influencer-relationship', 'communication']
}));

export const brandUpdatesSharingTask = defineTask('brand-updates-sharing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Share brand updates and opportunities',
  agent: {
    name: 'updates-coordinator',
    prompt: {
      role: 'brand updates coordinator',
      task: 'Share brand updates and campaign opportunities with partners',
      context: args,
      instructions: [
        'Compile relevant brand updates',
        'Segment updates by partner relevance',
        'Create update communications',
        'Share upcoming campaign opportunities',
        'Announce product launches',
        'Share industry news and trends',
        'Track update engagement',
        'Document sharing activities'
      ],
      outputFormat: 'JSON with updates, communications, opportunities, engagement, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['updates', 'artifacts'],
      properties: {
        updates: { type: 'array', items: { type: 'object' } },
        communications: { type: 'array', items: { type: 'object' } },
        opportunities: { type: 'array', items: { type: 'object' } },
        engagement: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'influencer-relationship', 'brand-updates']
}));

export const productSeedingTask = defineTask('product-seeding', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Facilitate product seeding and gifting',
  agent: {
    name: 'seeding-coordinator',
    prompt: {
      role: 'product seeding coordinator',
      task: 'Plan and execute product seeding and gifting programs',
      context: args,
      instructions: [
        'Identify seeding opportunities',
        'Select products for gifting',
        'Create seeding tiers and criteria',
        'Plan gifting calendar',
        'Coordinate shipping logistics',
        'Track gifting and unboxing',
        'Monitor organic mentions',
        'Document seeding effectiveness'
      ],
      outputFormat: 'JSON with plan, seedingCalendar, shipments, tracking, effectiveness, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        seedingCalendar: { type: 'object' },
        shipments: { type: 'array', items: { type: 'object' } },
        tracking: { type: 'object' },
        effectiveness: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'influencer-relationship', 'product-seeding', 'gifting']
}));

export const performerRecognitionTask = defineTask('performer-recognition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Recognize and reward top performers',
  agent: {
    name: 'recognition-manager',
    prompt: {
      role: 'partner recognition manager',
      task: 'Recognize and reward top-performing influencer partners',
      context: args,
      instructions: [
        'Identify top performers by metrics',
        'Create recognition tiers',
        'Plan rewards and incentives',
        'Design recognition program',
        'Create appreciation communications',
        'Plan exclusive perks and access',
        'Track recognition activities',
        'Document recognition program'
      ],
      outputFormat: 'JSON with topPerformers, topPerformerCount, recognitionProgram, rewards, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['topPerformers', 'topPerformerCount', 'artifacts'],
      properties: {
        topPerformers: { type: 'array', items: { type: 'object' } },
        topPerformerCount: { type: 'number' },
        recognitionProgram: { type: 'object' },
        rewards: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'influencer-relationship', 'recognition', 'rewards']
}));

export const feedbackGatheringTask = defineTask('feedback-gathering', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Gather partner feedback and insights',
  agent: {
    name: 'feedback-collector',
    prompt: {
      role: 'partner feedback analyst',
      task: 'Gather and analyze feedback from influencer partners',
      context: args,
      instructions: [
        'Design feedback surveys',
        'Conduct partner interviews',
        'Gather campaign feedback',
        'Collect product feedback',
        'Analyze feedback themes',
        'Identify improvement areas',
        'Share insights with teams',
        'Document feedback and actions'
      ],
      outputFormat: 'JSON with feedback, surveys, insights, improvements, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['feedback', 'insights', 'artifacts'],
      properties: {
        feedback: { type: 'array', items: { type: 'object' } },
        surveys: { type: 'array', items: { type: 'object' } },
        insights: { type: 'array', items: { type: 'string' } },
        improvements: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'influencer-relationship', 'feedback', 'insights']
}));

export const ambassadorProgramTask = defineTask('ambassador-program', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan ambassador program activities',
  agent: {
    name: 'ambassador-manager',
    prompt: {
      role: 'brand ambassador program manager',
      task: 'Plan and manage brand ambassador program activities',
      context: args,
      instructions: [
        'Define ambassador program structure',
        'Set ambassador criteria and benefits',
        'Plan ambassador-exclusive activities',
        'Create ambassador content calendar',
        'Plan ambassador events',
        'Design ambassador perks package',
        'Set up ambassador community',
        'Document program guidelines'
      ],
      outputFormat: 'JSON with documentation, programStructure, activities, perks, community, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentation', 'artifacts'],
      properties: {
        documentation: { type: 'object' },
        programStructure: { type: 'object' },
        activities: { type: 'array', items: { type: 'object' } },
        perks: { type: 'array', items: { type: 'object' } },
        community: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'influencer-relationship', 'ambassador-program']
}));

export const complianceMonitoringTask = defineTask('compliance-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Monitor compliance and disclosure',
  agent: {
    name: 'compliance-monitor',
    prompt: {
      role: 'influencer compliance specialist',
      task: 'Monitor influencer compliance with regulations and brand guidelines',
      context: args,
      instructions: [
        'Monitor FTC disclosure compliance',
        'Check sponsored content labeling',
        'Verify brand guideline adherence',
        'Track contract compliance',
        'Flag compliance issues',
        'Provide compliance education',
        'Document compliance status',
        'Create compliance reports'
      ],
      outputFormat: 'JSON with status, complianceChecks, issues, education, reports, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'artifacts'],
      properties: {
        status: { type: 'object' },
        complianceChecks: { type: 'array', items: { type: 'object' } },
        issues: { type: 'array', items: { type: 'object' } },
        education: { type: 'array', items: { type: 'object' } },
        reports: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'influencer-relationship', 'compliance', 'monitoring']
}));

export const renewalEvaluationTask = defineTask('renewal-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate partnership renewals',
  agent: {
    name: 'renewal-evaluator',
    prompt: {
      role: 'partnership renewal analyst',
      task: 'Evaluate influencer partnerships for renewal decisions',
      context: args,
      instructions: [
        'Identify partnerships due for renewal',
        'Analyze partnership performance',
        'Calculate partnership ROI',
        'Assess audience fit and growth',
        'Review compliance history',
        'Evaluate relationship health',
        'Make renewal recommendations',
        'Plan renewal negotiations'
      ],
      outputFormat: 'JSON with recommendations, renewalCandidates, evaluations, roiAnalysis, negotiationPlans, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'artifacts'],
      properties: {
        recommendations: { type: 'array', items: { type: 'object' } },
        renewalCandidates: { type: 'array', items: { type: 'object' } },
        evaluations: { type: 'array', items: { type: 'object' } },
        roiAnalysis: { type: 'object' },
        negotiationPlans: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'influencer-relationship', 'renewal', 'evaluation']
}));
