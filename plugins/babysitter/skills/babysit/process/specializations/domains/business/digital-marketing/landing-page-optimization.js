/**
 * @process digital-marketing/landing-page-optimization
 * @description Process for creating, testing, and optimizing landing pages to maximize conversion rates for paid campaigns and lead generation initiatives
 * @inputs { campaignBrief: object, valueProposition: object, designAssets: object, trackingRequirements: object, outputDir: string }
 * @outputs { success: boolean, landingPages: array, abTestDocumentation: object, conversionReports: array, optimizationRoadmap: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    campaignBrief = {},
    valueProposition = {},
    designAssets = {},
    trackingRequirements = {},
    outputDir = 'landing-page-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Landing Page Optimization process');

  // Task 1: Define Landing Page Objectives
  ctx.log('info', 'Phase 1: Defining landing page objectives and KPIs');
  const objectivesResult = await ctx.task(landingPageObjectivesTask, {
    campaignBrief,
    outputDir
  });
  artifacts.push(...objectivesResult.artifacts);

  // Task 2: Develop Page Content and Messaging
  ctx.log('info', 'Phase 2: Developing page content and messaging');
  const contentDevelopment = await ctx.task(pageContentTask, {
    campaignBrief,
    valueProposition,
    objectivesResult,
    outputDir
  });
  artifacts.push(...contentDevelopment.artifacts);

  // Task 3: Design Page Layout
  ctx.log('info', 'Phase 3: Designing page layout and visual hierarchy');
  const layoutDesign = await ctx.task(pageLayoutTask, {
    contentDevelopment,
    designAssets,
    outputDir
  });
  artifacts.push(...layoutDesign.artifacts);

  // Task 4: Build Page in Platform
  ctx.log('info', 'Phase 4: Building page in landing page platform');
  const pageBuild = await ctx.task(pageBuildTask, {
    layoutDesign,
    contentDevelopment,
    outputDir
  });
  artifacts.push(...pageBuild.artifacts);

  // Task 5: Configure Forms and Lead Capture
  ctx.log('info', 'Phase 5: Configuring forms and lead capture');
  const formConfig = await ctx.task(formConfigurationTask, {
    pageBuild,
    campaignBrief,
    outputDir
  });
  artifacts.push(...formConfig.artifacts);

  // Task 6: Implement Tracking and Analytics
  ctx.log('info', 'Phase 6: Implementing tracking and analytics');
  const trackingSetup = await ctx.task(trackingImplementationTask, {
    pageBuild,
    trackingRequirements,
    outputDir
  });
  artifacts.push(...trackingSetup.artifacts);

  // Task 7: Set Up A/B Test Variations
  ctx.log('info', 'Phase 7: Setting up A/B test variations');
  const abTestSetup = await ctx.task(abTestSetupTask, {
    pageBuild,
    contentDevelopment,
    layoutDesign,
    outputDir
  });
  artifacts.push(...abTestSetup.artifacts);

  // Task 8: Launch and Drive Traffic
  ctx.log('info', 'Phase 8: Creating launch plan and traffic strategy');
  const launchPlan = await ctx.task(launchTrafficTask, {
    pageBuild,
    abTestSetup,
    campaignBrief,
    outputDir
  });
  artifacts.push(...launchPlan.artifacts);

  // Breakpoint: Review before launch
  await ctx.breakpoint({
    question: `Landing page ready for launch. ${abTestSetup.variationCount} A/B test variations configured. Tracking verified: ${trackingSetup.verified}. Approve launch?`,
    title: 'Landing Page Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        pageCount: pageBuild.pageCount,
        abVariations: abTestSetup.variationCount,
        trackingVerified: trackingSetup.verified,
        formFields: formConfig.fieldCount
      }
    }
  });

  // Task 9: Analyze Conversion Performance
  ctx.log('info', 'Phase 9: Creating conversion performance analysis framework');
  const conversionAnalysis = await ctx.task(conversionAnalysisTask, {
    objectivesResult,
    abTestSetup,
    outputDir
  });
  artifacts.push(...conversionAnalysis.artifacts);

  // Task 10: Implement Winning Variations
  ctx.log('info', 'Phase 10: Creating implementation plan for winning variations');
  const implementationPlan = await ctx.task(winnerImplementationTask, {
    abTestSetup,
    conversionAnalysis,
    outputDir
  });
  artifacts.push(...implementationPlan.artifacts);

  // Task 11: Continuous Optimization
  ctx.log('info', 'Phase 11: Creating continuous testing and optimization roadmap');
  const optimizationRoadmap = await ctx.task(optimizationRoadmapTask, {
    conversionAnalysis,
    implementationPlan,
    outputDir
  });
  artifacts.push(...optimizationRoadmap.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    landingPages: pageBuild.pages,
    abTestDocumentation: abTestSetup.documentation,
    conversionReports: conversionAnalysis.reportTemplates,
    optimizationRoadmap: optimizationRoadmap.roadmap,
    formConfiguration: formConfig.configuration,
    trackingSetup: trackingSetup.setup,
    launchPlan: launchPlan.plan,
    artifacts,
    duration,
    metadata: {
      processId: 'digital-marketing/landing-page-optimization',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task definitions
export const landingPageObjectivesTask = defineTask('landing-page-objectives', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define landing page objectives and KPIs',
  agent: {
    name: 'cro-strategist',
    prompt: {
      role: 'conversion rate optimization strategist',
      task: 'Define landing page objectives and success metrics',
      context: args,
      instructions: [
        'Define primary conversion goal',
        'Set conversion rate targets',
        'Define micro-conversion goals',
        'Establish baseline metrics',
        'Set traffic quality requirements',
        'Define audience segments',
        'Document success criteria',
        'Create measurement plan'
      ],
      outputFormat: 'JSON with objectives, kpis, targets, baseline, measurementPlan, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['objectives', 'kpis', 'artifacts'],
      properties: {
        objectives: { type: 'object' },
        kpis: { type: 'array', items: { type: 'object' } },
        targets: { type: 'object' },
        baseline: { type: 'object' },
        measurementPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'landing-page', 'objectives', 'cro']
}));

export const pageContentTask = defineTask('page-content', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop page content and messaging',
  agent: {
    name: 'landing-page-copywriter',
    prompt: {
      role: 'landing page copywriter',
      task: 'Develop compelling content and messaging for landing page',
      context: args,
      instructions: [
        'Write compelling headline',
        'Develop subheadline and hero copy',
        'Write benefit statements',
        'Create compelling CTA copy',
        'Develop social proof elements',
        'Write form labels and microcopy',
        'Create urgency elements',
        'Document messaging framework'
      ],
      outputFormat: 'JSON with content, headline, benefits, ctas, socialProof, messagingFramework, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['content', 'artifacts'],
      properties: {
        content: { type: 'object' },
        headline: { type: 'string' },
        benefits: { type: 'array', items: { type: 'string' } },
        ctas: { type: 'array', items: { type: 'object' } },
        socialProof: { type: 'array', items: { type: 'object' } },
        messagingFramework: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'landing-page', 'content', 'copywriting']
}));

export const pageLayoutTask = defineTask('page-layout', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design page layout and visual hierarchy',
  agent: {
    name: 'landing-page-designer',
    prompt: {
      role: 'landing page UX designer',
      task: 'Design landing page layout with optimal visual hierarchy',
      context: args,
      instructions: [
        'Design above-the-fold layout',
        'Create visual hierarchy',
        'Design form placement',
        'Plan mobile layout',
        'Design CTA buttons',
        'Create trust signal placement',
        'Design page flow',
        'Document design specifications'
      ],
      outputFormat: 'JSON with design, layout, visualHierarchy, mobileLayout, specifications, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'layout', 'artifacts'],
      properties: {
        design: { type: 'object' },
        layout: { type: 'object' },
        visualHierarchy: { type: 'object' },
        mobileLayout: { type: 'object' },
        specifications: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'landing-page', 'design', 'ux']
}));

export const pageBuildTask = defineTask('page-build', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Build page in landing page platform',
  agent: {
    name: 'landing-page-builder',
    prompt: {
      role: 'landing page developer',
      task: 'Build landing page in landing page platform',
      context: args,
      instructions: [
        'Set up page in platform',
        'Build responsive layout',
        'Add content elements',
        'Configure page settings',
        'Optimize page speed',
        'Set up mobile version',
        'Configure SEO elements',
        'Document page build'
      ],
      outputFormat: 'JSON with pages, pageCount, configuration, seoSettings, documentation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['pages', 'pageCount', 'artifacts'],
      properties: {
        pages: { type: 'array', items: { type: 'object' } },
        pageCount: { type: 'number' },
        configuration: { type: 'object' },
        seoSettings: { type: 'object' },
        documentation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'landing-page', 'build', 'development']
}));

export const formConfigurationTask = defineTask('form-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure forms and lead capture',
  agent: {
    name: 'form-specialist',
    prompt: {
      role: 'form optimization specialist',
      task: 'Configure and optimize forms for lead capture',
      context: args,
      instructions: [
        'Design form fields',
        'Optimize field order',
        'Configure validation',
        'Set up progressive profiling',
        'Configure form submission handling',
        'Set up CRM integration',
        'Design thank you experience',
        'Document form configuration'
      ],
      outputFormat: 'JSON with configuration, fields, fieldCount, validation, integration, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['configuration', 'fieldCount', 'artifacts'],
      properties: {
        configuration: { type: 'object' },
        fields: { type: 'array', items: { type: 'object' } },
        fieldCount: { type: 'number' },
        validation: { type: 'object' },
        integration: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'landing-page', 'forms', 'lead-capture']
}));

export const trackingImplementationTask = defineTask('tracking-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement tracking and analytics',
  agent: {
    name: 'tracking-specialist',
    prompt: {
      role: 'conversion tracking specialist',
      task: 'Implement tracking and analytics for landing page',
      context: args,
      instructions: [
        'Implement analytics tracking',
        'Set up conversion tracking',
        'Configure heatmap tracking',
        'Set up form tracking',
        'Configure ad platform tracking',
        'Set up UTM parameter handling',
        'Test tracking accuracy',
        'Document tracking setup'
      ],
      outputFormat: 'JSON with setup, verified, analytics, conversionTracking, heatmaps, documentation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['setup', 'verified', 'artifacts'],
      properties: {
        setup: { type: 'object' },
        verified: { type: 'boolean' },
        analytics: { type: 'object' },
        conversionTracking: { type: 'object' },
        heatmaps: { type: 'object' },
        documentation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'landing-page', 'tracking', 'analytics']
}));

export const abTestSetupTask = defineTask('ab-test-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up A/B test variations',
  agent: {
    name: 'ab-test-specialist',
    prompt: {
      role: 'A/B testing specialist',
      task: 'Set up A/B test variations for landing page',
      context: args,
      instructions: [
        'Define test hypotheses',
        'Create headline variations',
        'Create CTA variations',
        'Create layout variations',
        'Set traffic split',
        'Configure statistical significance',
        'Plan test duration',
        'Document test setup'
      ],
      outputFormat: 'JSON with variations, variationCount, hypotheses, configuration, documentation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['variations', 'variationCount', 'documentation', 'artifacts'],
      properties: {
        variations: { type: 'array', items: { type: 'object' } },
        variationCount: { type: 'number' },
        hypotheses: { type: 'array', items: { type: 'string' } },
        configuration: { type: 'object' },
        documentation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'landing-page', 'ab-testing']
}));

export const launchTrafficTask = defineTask('launch-traffic', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create launch plan and traffic strategy',
  agent: {
    name: 'launch-planner',
    prompt: {
      role: 'landing page launch specialist',
      task: 'Create launch plan and traffic strategy',
      context: args,
      instructions: [
        'Create launch checklist',
        'Plan traffic sources',
        'Set up campaign links',
        'Plan traffic ramp-up',
        'Configure redirect rules',
        'Set up monitoring alerts',
        'Create launch documentation',
        'Plan QA procedures'
      ],
      outputFormat: 'JSON with plan, checklist, trafficSources, monitoring, documentation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        checklist: { type: 'array', items: { type: 'object' } },
        trafficSources: { type: 'array', items: { type: 'object' } },
        monitoring: { type: 'object' },
        documentation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'landing-page', 'launch', 'traffic']
}));

export const conversionAnalysisTask = defineTask('conversion-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create conversion performance analysis framework',
  agent: {
    name: 'conversion-analyst',
    prompt: {
      role: 'conversion analyst',
      task: 'Create framework for analyzing conversion performance',
      context: args,
      instructions: [
        'Define analysis metrics',
        'Create analysis dashboards',
        'Design report templates',
        'Plan funnel analysis',
        'Configure heatmap analysis',
        'Plan form analytics review',
        'Create benchmarking approach',
        'Document analysis methodology'
      ],
      outputFormat: 'JSON with framework, metrics, dashboards, reportTemplates, methodology, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'reportTemplates', 'artifacts'],
      properties: {
        framework: { type: 'object' },
        metrics: { type: 'array', items: { type: 'object' } },
        dashboards: { type: 'array', items: { type: 'object' } },
        reportTemplates: { type: 'array', items: { type: 'object' } },
        methodology: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'landing-page', 'conversion', 'analysis']
}));

export const winnerImplementationTask = defineTask('winner-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create implementation plan for winning variations',
  agent: {
    name: 'implementation-specialist',
    prompt: {
      role: 'CRO implementation specialist',
      task: 'Plan implementation of winning test variations',
      context: args,
      instructions: [
        'Define winner selection criteria',
        'Plan implementation process',
        'Create rollout strategy',
        'Plan monitoring after implementation',
        'Document learnings',
        'Plan iteration',
        'Create implementation checklist',
        'Document implementation plan'
      ],
      outputFormat: 'JSON with plan, criteria, rolloutStrategy, checklist, learnings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        criteria: { type: 'object' },
        rolloutStrategy: { type: 'object' },
        checklist: { type: 'array', items: { type: 'object' } },
        learnings: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'landing-page', 'implementation', 'winner']
}));

export const optimizationRoadmapTask = defineTask('optimization-roadmap', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create continuous testing and optimization roadmap',
  agent: {
    name: 'optimization-planner',
    prompt: {
      role: 'CRO program manager',
      task: 'Create roadmap for continuous landing page optimization',
      context: args,
      instructions: [
        'Plan testing cadence',
        'Prioritize test ideas',
        'Create test backlog',
        'Plan resource allocation',
        'Define optimization goals',
        'Create review schedule',
        'Plan technology updates',
        'Document optimization roadmap'
      ],
      outputFormat: 'JSON with roadmap, testBacklog, cadence, goals, reviewSchedule, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['roadmap', 'artifacts'],
      properties: {
        roadmap: { type: 'object' },
        testBacklog: { type: 'array', items: { type: 'object' } },
        cadence: { type: 'object' },
        goals: { type: 'array', items: { type: 'object' } },
        reviewSchedule: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'landing-page', 'optimization', 'roadmap']
}));
