/**
 * @process digital-marketing/link-building
 * @description Process for developing and executing link building campaigns to improve domain authority and search rankings through high-quality backlink acquisition
 * @inputs { backlinkData: object, competitiveAnalysis: object, contentAssets: array, outreachTargets: array, outputDir: string }
 * @outputs { success: boolean, outreachCampaignDocumentation: object, linkAcquisitionReports: array, disavowFile: object, authorityMetricsTracking: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    backlinkData = {},
    competitiveAnalysis = {},
    contentAssets = [],
    outreachTargets = [],
    outputDir = 'link-building-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Link Building Campaign Management process');

  // Task 1: Analyze Current Backlink Profile
  ctx.log('info', 'Phase 1: Analyzing current backlink profile');
  const profileAnalysis = await ctx.task(backlinkProfileAnalysisTask, {
    backlinkData,
    outputDir
  });
  artifacts.push(...profileAnalysis.artifacts);

  // Task 2: Conduct Competitive Link Analysis
  ctx.log('info', 'Phase 2: Conducting competitive link analysis');
  const competitiveLinkAnalysis = await ctx.task(competitiveLinkAnalysisTask, {
    competitiveAnalysis,
    profileAnalysis,
    outputDir
  });
  artifacts.push(...competitiveLinkAnalysis.artifacts);

  // Task 3: Identify Link Building Opportunities
  ctx.log('info', 'Phase 3: Identifying link building opportunities');
  const opportunityIdentification = await ctx.task(opportunityIdentificationTask, {
    competitiveLinkAnalysis,
    profileAnalysis,
    contentAssets,
    outputDir
  });
  artifacts.push(...opportunityIdentification.artifacts);

  // Task 4: Develop Linkable Content Assets
  ctx.log('info', 'Phase 4: Developing linkable content assets');
  const linkableContent = await ctx.task(linkableContentTask, {
    contentAssets,
    opportunityIdentification,
    outputDir
  });
  artifacts.push(...linkableContent.artifacts);

  // Task 5: Create Outreach Target Lists
  ctx.log('info', 'Phase 5: Creating outreach target lists');
  const targetLists = await ctx.task(outreachTargetListsTask, {
    opportunityIdentification,
    outreachTargets,
    outputDir
  });
  artifacts.push(...targetLists.artifacts);

  // Task 6: Draft Outreach Templates
  ctx.log('info', 'Phase 6: Drafting personalized outreach templates');
  const outreachTemplates = await ctx.task(outreachTemplatesTask, {
    targetLists,
    linkableContent,
    outputDir
  });
  artifacts.push(...outreachTemplates.artifacts);

  // Breakpoint: Review before outreach
  await ctx.breakpoint({
    question: `Link building preparation complete. ${targetLists.totalTargets} outreach targets identified with ${linkableContent.assetCount} linkable assets. Begin outreach?`,
    title: 'Link Building Campaign Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        outreachTargets: targetLists.totalTargets,
        linkableAssets: linkableContent.assetCount,
        opportunities: opportunityIdentification.opportunityCount,
        currentDomainAuthority: profileAnalysis.domainAuthority
      }
    }
  });

  // Task 7: Execute Outreach Campaigns
  ctx.log('info', 'Phase 7: Setting up outreach campaign execution');
  const outreachExecution = await ctx.task(outreachExecutionTask, {
    targetLists,
    outreachTemplates,
    outputDir
  });
  artifacts.push(...outreachExecution.artifacts);

  // Task 8: Follow Up Management
  ctx.log('info', 'Phase 8: Setting up follow-up management');
  const followUpManagement = await ctx.task(followUpManagementTask, {
    outreachExecution,
    outputDir
  });
  artifacts.push(...followUpManagement.artifacts);

  // Task 9: Track Acquired Links
  ctx.log('info', 'Phase 9: Setting up link acquisition tracking');
  const linkTracking = await ctx.task(linkAcquisitionTrackingTask, {
    outreachExecution,
    profileAnalysis,
    outputDir
  });
  artifacts.push(...linkTracking.artifacts);

  // Task 10: Disavow Toxic Backlinks
  ctx.log('info', 'Phase 10: Managing toxic backlinks and disavow file');
  const disavowManagement = await ctx.task(disavowManagementTask, {
    profileAnalysis,
    outputDir
  });
  artifacts.push(...disavowManagement.artifacts);

  // Task 11: Report on Link Metrics
  ctx.log('info', 'Phase 11: Creating link acquisition reporting');
  const metricsReporting = await ctx.task(linkMetricsReportingTask, {
    profileAnalysis,
    linkTracking,
    outputDir
  });
  artifacts.push(...metricsReporting.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    outreachCampaignDocumentation: outreachExecution.documentation,
    linkAcquisitionReports: linkTracking.reports,
    disavowFile: disavowManagement.disavowFile,
    authorityMetricsTracking: metricsReporting.tracking,
    outreachTargets: targetLists.targets,
    linkableAssets: linkableContent.assets,
    followUpSystem: followUpManagement.system,
    artifacts,
    duration,
    metadata: {
      processId: 'digital-marketing/link-building',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task definitions
export const backlinkProfileAnalysisTask = defineTask('backlink-profile-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze current backlink profile',
  agent: {
    name: 'backlink-analyst',
    prompt: {
      role: 'backlink profile analyst',
      task: 'Analyze current backlink profile and domain authority',
      context: args,
      instructions: [
        'Audit total backlink count and referring domains',
        'Analyze domain authority and trust flow',
        'Assess backlink quality distribution',
        'Identify top linking domains',
        'Analyze anchor text distribution',
        'Identify toxic or spammy backlinks',
        'Assess link velocity trends',
        'Create profile health scorecard'
      ],
      outputFormat: 'JSON with profile, domainAuthority, qualityDistribution, topDomains, toxicLinks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['profile', 'domainAuthority', 'artifacts'],
      properties: {
        profile: { type: 'object' },
        domainAuthority: { type: 'number' },
        qualityDistribution: { type: 'object' },
        topDomains: { type: 'array', items: { type: 'object' } },
        toxicLinks: { type: 'array', items: { type: 'object' } },
        anchorTextDistribution: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'link-building', 'backlink-analysis', 'profile']
}));

export const competitiveLinkAnalysisTask = defineTask('competitive-link-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct competitive link analysis',
  agent: {
    name: 'competitive-link-analyst',
    prompt: {
      role: 'competitive link analyst',
      task: 'Analyze competitor backlink profiles and identify opportunities',
      context: args,
      instructions: [
        'Analyze competitor domain authorities',
        'Identify competitor linking domains',
        'Find common competitor backlinks',
        'Identify unique competitor backlinks',
        'Analyze competitor link velocity',
        'Identify successful competitor tactics',
        'Find linkable competitor content',
        'Create competitive gap report'
      ],
      outputFormat: 'JSON with analysis, competitorDomains, commonLinks, uniqueOpportunities, gapReport, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'artifacts'],
      properties: {
        analysis: { type: 'object' },
        competitorDomains: { type: 'array', items: { type: 'object' } },
        commonLinks: { type: 'array', items: { type: 'object' } },
        uniqueOpportunities: { type: 'array', items: { type: 'object' } },
        gapReport: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'link-building', 'competitive-analysis']
}));

export const opportunityIdentificationTask = defineTask('opportunity-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify link building opportunities',
  agent: {
    name: 'opportunity-identifier',
    prompt: {
      role: 'link building opportunity specialist',
      task: 'Identify and categorize link building opportunities',
      context: args,
      instructions: [
        'Identify broken link opportunities',
        'Find unlinked brand mentions',
        'Identify resource page opportunities',
        'Find guest posting opportunities',
        'Identify skyscraper content opportunities',
        'Find HARO and journalist opportunities',
        'Identify directory and listing opportunities',
        'Prioritize opportunities by value'
      ],
      outputFormat: 'JSON with opportunities, opportunityCount, byType, prioritization, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['opportunities', 'opportunityCount', 'artifacts'],
      properties: {
        opportunities: { type: 'array', items: { type: 'object' } },
        opportunityCount: { type: 'number' },
        byType: { type: 'object' },
        prioritization: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'link-building', 'opportunities']
}));

export const linkableContentTask = defineTask('linkable-content', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop linkable content assets',
  agent: {
    name: 'content-developer',
    prompt: {
      role: 'linkable content specialist',
      task: 'Develop and identify linkable content assets',
      context: args,
      instructions: [
        'Audit existing linkable assets',
        'Identify high-performing content',
        'Plan new linkable asset development',
        'Create content upgrade recommendations',
        'Develop data-driven content ideas',
        'Plan infographic and visual assets',
        'Create original research opportunities',
        'Document linkable asset library'
      ],
      outputFormat: 'JSON with assets, assetCount, newAssetPlan, upgrades, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assets', 'assetCount', 'artifacts'],
      properties: {
        assets: { type: 'array', items: { type: 'object' } },
        assetCount: { type: 'number' },
        newAssetPlan: { type: 'array', items: { type: 'object' } },
        upgrades: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'link-building', 'linkable-content', 'assets']
}));

export const outreachTargetListsTask = defineTask('outreach-target-lists', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create outreach target lists',
  agent: {
    name: 'target-list-builder',
    prompt: {
      role: 'outreach target specialist',
      task: 'Build segmented outreach target lists',
      context: args,
      instructions: [
        'Compile target websites list',
        'Find contact information',
        'Segment by opportunity type',
        'Score targets by potential value',
        'Identify decision makers',
        'Verify contact accuracy',
        'Create CRM-ready target lists',
        'Document target research'
      ],
      outputFormat: 'JSON with targets, totalTargets, segments, contacts, scoredTargets, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['targets', 'totalTargets', 'artifacts'],
      properties: {
        targets: { type: 'array', items: { type: 'object' } },
        totalTargets: { type: 'number' },
        segments: { type: 'object' },
        contacts: { type: 'array', items: { type: 'object' } },
        scoredTargets: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'link-building', 'outreach', 'targets']
}));

export const outreachTemplatesTask = defineTask('outreach-templates', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Draft personalized outreach templates',
  agent: {
    name: 'outreach-copywriter',
    prompt: {
      role: 'outreach copywriter',
      task: 'Create personalized outreach email templates',
      context: args,
      instructions: [
        'Create templates for each opportunity type',
        'Write personalization placeholders',
        'Develop compelling subject lines',
        'Include clear value propositions',
        'Create follow-up templates',
        'A/B test variations',
        'Ensure templates avoid spam triggers',
        'Document best practices'
      ],
      outputFormat: 'JSON with templates, subjectLines, followUps, bestPractices, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['templates', 'artifacts'],
      properties: {
        templates: { type: 'array', items: { type: 'object' } },
        subjectLines: { type: 'array', items: { type: 'string' } },
        followUps: { type: 'array', items: { type: 'object' } },
        bestPractices: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'link-building', 'outreach', 'templates']
}));

export const outreachExecutionTask = defineTask('outreach-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up outreach campaign execution',
  agent: {
    name: 'outreach-manager',
    prompt: {
      role: 'outreach campaign manager',
      task: 'Set up and manage outreach campaign execution',
      context: args,
      instructions: [
        'Configure outreach tool/CRM',
        'Set up email sequences',
        'Define send schedules',
        'Personalize outreach emails',
        'Set up tracking and analytics',
        'Configure response management',
        'Create execution checklist',
        'Document campaign setup'
      ],
      outputFormat: 'JSON with documentation, setup, sequences, tracking, checklist, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentation', 'artifacts'],
      properties: {
        documentation: { type: 'object' },
        setup: { type: 'object' },
        sequences: { type: 'array', items: { type: 'object' } },
        tracking: { type: 'object' },
        checklist: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'link-building', 'outreach', 'execution']
}));

export const followUpManagementTask = defineTask('follow-up-management', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up follow-up management',
  agent: {
    name: 'follow-up-manager',
    prompt: {
      role: 'outreach follow-up specialist',
      task: 'Set up follow-up management system for outreach',
      context: args,
      instructions: [
        'Define follow-up sequences',
        'Set timing between follow-ups',
        'Create follow-up templates',
        'Configure automation rules',
        'Set up response categorization',
        'Define escalation triggers',
        'Track follow-up metrics',
        'Document follow-up procedures'
      ],
      outputFormat: 'JSON with system, sequences, automation, metrics, procedures, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['system', 'artifacts'],
      properties: {
        system: { type: 'object' },
        sequences: { type: 'array', items: { type: 'object' } },
        automation: { type: 'object' },
        metrics: { type: 'object' },
        procedures: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'link-building', 'follow-up', 'management']
}));

export const linkAcquisitionTrackingTask = defineTask('link-acquisition-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up link acquisition tracking',
  agent: {
    name: 'acquisition-tracker',
    prompt: {
      role: 'link acquisition specialist',
      task: 'Track and document acquired backlinks',
      context: args,
      instructions: [
        'Set up new link monitoring',
        'Verify acquired link quality',
        'Document link attributes',
        'Track outreach to acquisition rate',
        'Monitor link retention',
        'Calculate acquisition costs',
        'Create acquisition reports',
        'Set up alerts for lost links'
      ],
      outputFormat: 'JSON with tracking, reports, acquisitionRate, costs, alerts, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['tracking', 'reports', 'artifacts'],
      properties: {
        tracking: { type: 'object' },
        reports: { type: 'array', items: { type: 'object' } },
        acquisitionRate: { type: 'number' },
        costs: { type: 'object' },
        alerts: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'link-building', 'tracking', 'acquisition']
}));

export const disavowManagementTask = defineTask('disavow-management', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Manage toxic backlinks and disavow file',
  agent: {
    name: 'disavow-manager',
    prompt: {
      role: 'toxic link specialist',
      task: 'Identify toxic backlinks and manage disavow file',
      context: args,
      instructions: [
        'Identify potentially toxic links',
        'Score link toxicity',
        'Attempt link removal outreach',
        'Create disavow file',
        'Document disavow decisions',
        'Monitor disavow file effectiveness',
        'Update disavow file regularly',
        'Create toxic link report'
      ],
      outputFormat: 'JSON with disavowFile, toxicLinks, removalAttempts, decisions, report, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['disavowFile', 'artifacts'],
      properties: {
        disavowFile: { type: 'object' },
        toxicLinks: { type: 'array', items: { type: 'object' } },
        removalAttempts: { type: 'array', items: { type: 'object' } },
        decisions: { type: 'array', items: { type: 'object' } },
        report: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'link-building', 'disavow', 'toxic-links']
}));

export const linkMetricsReportingTask = defineTask('link-metrics-reporting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create link acquisition reporting',
  agent: {
    name: 'metrics-reporter',
    prompt: {
      role: 'link building analyst',
      task: 'Create comprehensive link acquisition metrics and reporting',
      context: args,
      instructions: [
        'Define key link building KPIs',
        'Track domain authority growth',
        'Monitor referring domain growth',
        'Calculate campaign ROI',
        'Create dashboards',
        'Set up automated reporting',
        'Benchmark against competitors',
        'Document reporting procedures'
      ],
      outputFormat: 'JSON with tracking, kpis, dashboards, reporting, benchmarks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['tracking', 'artifacts'],
      properties: {
        tracking: { type: 'object' },
        kpis: { type: 'array', items: { type: 'object' } },
        dashboards: { type: 'array', items: { type: 'object' } },
        reporting: { type: 'object' },
        benchmarks: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'link-building', 'metrics', 'reporting']
}));
