/**
 * @process digital-marketing/programmatic-display
 * @description Process for planning and executing programmatic display advertising campaigns through demand-side platforms (DSPs), including inventory strategy, audience targeting, brand safety configuration, and performance optimization
 * @inputs { strategyBrief: object, audienceData: object, creativeAssets: array, brandSafetyRequirements: object, outputDir: string }
 * @outputs { success: boolean, dspConfiguration: object, audienceDefinitions: array, performanceDashboards: array, optimizationReports: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    strategyBrief = {},
    audienceData = {},
    creativeAssets = [],
    brandSafetyRequirements = {},
    outputDir = 'programmatic-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Programmatic Display Campaign Execution process');

  // Task 1: Develop Programmatic Strategy
  ctx.log('info', 'Phase 1: Developing programmatic strategy and goals');
  const strategyResult = await ctx.task(programmaticStrategyTask, {
    strategyBrief,
    outputDir
  });
  artifacts.push(...strategyResult.artifacts);

  // Task 2: Select DSP Platform and Inventory
  ctx.log('info', 'Phase 2: Selecting DSP platform and inventory sources');
  const dspSelection = await ctx.task(dspSelectionTask, {
    strategyBrief,
    strategy: strategyResult,
    outputDir
  });
  artifacts.push(...dspSelection.artifacts);

  // Task 3: Build Audience Segments
  ctx.log('info', 'Phase 3: Building audience segments');
  const audienceSegments = await ctx.task(audienceSegmentationTask, {
    audienceData,
    strategy: strategyResult,
    outputDir
  });
  artifacts.push(...audienceSegments.artifacts);

  // Task 4: Design Display Creative
  ctx.log('info', 'Phase 4: Designing display creative in multiple formats');
  const creativeDesign = await ctx.task(displayCreativeTask, {
    creativeAssets,
    strategyBrief,
    dspSelection,
    outputDir
  });
  artifacts.push(...creativeDesign.artifacts);

  // Task 5: Configure Brand Safety and Viewability
  ctx.log('info', 'Phase 5: Configuring brand safety and viewability settings');
  const brandSafetyConfig = await ctx.task(brandSafetyTask, {
    brandSafetyRequirements,
    dspSelection,
    outputDir
  });
  artifacts.push(...brandSafetyConfig.artifacts);

  // Task 6: Set Up Fraud Prevention
  ctx.log('info', 'Phase 6: Setting up fraud prevention measures');
  const fraudPrevention = await ctx.task(fraudPreventionTask, {
    dspSelection,
    brandSafetyConfig,
    outputDir
  });
  artifacts.push(...fraudPrevention.artifacts);

  // Task 7: Launch Campaign Configuration
  ctx.log('info', 'Phase 7: Configuring campaign launch with frequency caps');
  const launchConfig = await ctx.task(campaignLaunchTask, {
    strategy: strategyResult,
    dspSelection,
    audienceSegments,
    creativeDesign,
    brandSafetyConfig,
    outputDir
  });
  artifacts.push(...launchConfig.artifacts);

  // Breakpoint: Review campaign before launch
  await ctx.breakpoint({
    question: `Programmatic campaign ready for launch. ${launchConfig.lineItemCount} line items configured across ${dspSelection.selectedDsp}. Proceed?`,
    title: 'Programmatic Campaign Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        dsp: dspSelection.selectedDsp,
        lineItems: launchConfig.lineItemCount,
        audienceSegments: audienceSegments.totalSegments,
        creativeFormats: creativeDesign.formatCount,
        brandSafetyLevel: brandSafetyConfig.safetyLevel
      }
    }
  });

  // Task 8: Optimization and Attribution Plan
  ctx.log('info', 'Phase 8: Creating optimization and attribution measurement plan');
  const optimizationPlan = await ctx.task(optimizationAttributionTask, {
    strategy: strategyResult,
    launchConfig,
    outputDir
  });
  artifacts.push(...optimizationPlan.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    dspConfiguration: dspSelection.configuration,
    audienceDefinitions: audienceSegments.segments,
    performanceDashboards: optimizationPlan.dashboards,
    optimizationReports: optimizationPlan.reportTemplates,
    brandSafetySettings: brandSafetyConfig.settings,
    fraudPreventionMeasures: fraudPrevention.measures,
    launchConfiguration: launchConfig.configuration,
    artifacts,
    duration,
    metadata: {
      processId: 'digital-marketing/programmatic-display',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Programmatic Strategy
export const programmaticStrategyTask = defineTask('programmatic-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop programmatic strategy and goals',
  agent: {
    name: 'programmatic-strategist',
    prompt: {
      role: 'programmatic advertising strategist',
      task: 'Develop comprehensive programmatic display advertising strategy',
      context: args,
      instructions: [
        'Define campaign objectives (awareness, consideration, conversion)',
        'Set KPIs and performance targets',
        'Determine budget allocation and pacing',
        'Plan targeting approach (prospecting vs retargeting)',
        'Define reach and frequency goals',
        'Outline creative strategy and messaging',
        'Plan measurement and attribution approach'
      ],
      outputFormat: 'JSON with objectives, kpis, budgetPlan, targetingApproach, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['objectives', 'kpis', 'artifacts'],
      properties: {
        objectives: { type: 'object' },
        kpis: { type: 'array', items: { type: 'object' } },
        budgetPlan: { type: 'object' },
        targetingApproach: { type: 'object' },
        frequencyGoals: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'programmatic', 'strategy']
}));

// Task 2: DSP Selection
export const dspSelectionTask = defineTask('dsp-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select DSP platform and inventory sources',
  agent: {
    name: 'dsp-specialist',
    prompt: {
      role: 'DSP platform specialist',
      task: 'Select optimal DSP platform and inventory sources for the campaign',
      context: args,
      instructions: [
        'Evaluate DSP options (DV360, The Trade Desk, Amazon DSP)',
        'Assess inventory access and quality',
        'Compare pricing models and fees',
        'Evaluate targeting capabilities',
        'Consider integration requirements',
        'Select PMP deals and preferred inventory',
        'Document DSP configuration requirements'
      ],
      outputFormat: 'JSON with selectedDsp, configuration, inventorySources, pmpDeals, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedDsp', 'configuration', 'artifacts'],
      properties: {
        selectedDsp: { type: 'string' },
        configuration: { type: 'object' },
        inventorySources: { type: 'array', items: { type: 'string' } },
        pmpDeals: { type: 'array', items: { type: 'object' } },
        pricingModel: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'programmatic', 'dsp', 'inventory']
}));

// Task 3: Audience Segmentation
export const audienceSegmentationTask = defineTask('audience-segmentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Build audience segments',
  agent: {
    name: 'audience-segmentation-specialist',
    prompt: {
      role: 'programmatic audience specialist',
      task: 'Build and configure audience segments for targeting',
      context: args,
      instructions: [
        'Onboard first-party data to DSP',
        'Select relevant third-party data segments',
        'Create retargeting segments from site visitors',
        'Build lookalike/similar audiences',
        'Configure contextual targeting segments',
        'Set up cross-device identity resolution',
        'Document audience taxonomy and hierarchy'
      ],
      outputFormat: 'JSON with segments, firstPartyAudiences, thirdPartySegments, totalSegments, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['segments', 'totalSegments', 'artifacts'],
      properties: {
        segments: { type: 'array', items: { type: 'object' } },
        firstPartyAudiences: { type: 'array', items: { type: 'object' } },
        thirdPartySegments: { type: 'array', items: { type: 'object' } },
        retargetingSegments: { type: 'array', items: { type: 'object' } },
        totalSegments: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'programmatic', 'audiences', 'segmentation']
}));

// Task 4: Display Creative Design
export const displayCreativeTask = defineTask('display-creative', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design display creative in multiple formats',
  agent: {
    name: 'display-creative-specialist',
    prompt: {
      role: 'display advertising creative specialist',
      task: 'Design and prepare display creative assets for programmatic',
      context: args,
      instructions: [
        'Define creative specifications for all required sizes',
        'Create static banner variations',
        'Develop HTML5 animated banners',
        'Design native ad formats',
        'Create responsive display ads',
        'Ensure brand consistency across formats',
        'Prepare creative for trafficking',
        'Document creative naming conventions'
      ],
      outputFormat: 'JSON with creativeAssets, specifications, formatCount, traffickingRequirements, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['creativeAssets', 'formatCount', 'artifacts'],
      properties: {
        creativeAssets: { type: 'array', items: { type: 'object' } },
        specifications: { type: 'object' },
        formatCount: { type: 'number' },
        traffickingRequirements: { type: 'object' },
        namingConventions: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'programmatic', 'creative', 'display']
}));

// Task 5: Brand Safety Configuration
export const brandSafetyTask = defineTask('brand-safety', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure brand safety and viewability settings',
  agent: {
    name: 'brand-safety-specialist',
    prompt: {
      role: 'brand safety and viewability specialist',
      task: 'Configure brand safety and viewability settings for programmatic campaign',
      context: args,
      instructions: [
        'Define brand safety tier and requirements',
        'Configure content category exclusions',
        'Set up keyword blocklists',
        'Configure viewability thresholds (MRC, GroupM standards)',
        'Set up verification vendor integration (DV, IAS)',
        'Define site and app inclusion/exclusion lists',
        'Configure contextual targeting safety measures',
        'Document brand safety policies'
      ],
      outputFormat: 'JSON with settings, safetyLevel, exclusions, viewabilityTargets, verificationConfig, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['settings', 'safetyLevel', 'artifacts'],
      properties: {
        settings: { type: 'object' },
        safetyLevel: { type: 'string' },
        exclusions: { type: 'object' },
        viewabilityTargets: { type: 'object' },
        verificationConfig: { type: 'object' },
        blocklists: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'programmatic', 'brand-safety', 'viewability']
}));

// Task 6: Fraud Prevention
export const fraudPreventionTask = defineTask('fraud-prevention', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up fraud prevention measures',
  agent: {
    name: 'fraud-prevention-specialist',
    prompt: {
      role: 'ad fraud prevention specialist',
      task: 'Configure fraud prevention measures for programmatic campaign',
      context: args,
      instructions: [
        'Configure pre-bid fraud filtering',
        'Set up IVT (Invalid Traffic) blocking',
        'Configure SIVT detection and prevention',
        'Set up domain spoofing protection',
        'Configure ads.txt/sellers.json verification',
        'Set up suspicious activity monitoring',
        'Define fraud KPI thresholds and alerts',
        'Document fraud prevention protocols'
      ],
      outputFormat: 'JSON with measures, preBidFilters, ivtSettings, monitoringAlerts, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['measures', 'artifacts'],
      properties: {
        measures: { type: 'array', items: { type: 'object' } },
        preBidFilters: { type: 'object' },
        ivtSettings: { type: 'object' },
        domainVerification: { type: 'object' },
        monitoringAlerts: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'programmatic', 'fraud-prevention', 'verification']
}));

// Task 7: Campaign Launch Configuration
export const campaignLaunchTask = defineTask('campaign-launch', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure campaign launch with frequency caps',
  agent: {
    name: 'campaign-launcher',
    prompt: {
      role: 'programmatic campaign manager',
      task: 'Configure and prepare campaign for launch',
      context: args,
      instructions: [
        'Set up campaign hierarchy in DSP',
        'Configure insertion orders and line items',
        'Set frequency caps (daily, weekly, lifetime)',
        'Configure pacing and budget allocation',
        'Assign creative to line items',
        'Set targeting parameters',
        'Configure tracking and attribution pixels',
        'Create launch QA checklist'
      ],
      outputFormat: 'JSON with configuration, lineItemCount, frequencyCaps, launchChecklist, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['configuration', 'lineItemCount', 'artifacts'],
      properties: {
        configuration: { type: 'object' },
        lineItemCount: { type: 'number' },
        frequencyCaps: { type: 'object' },
        pacingSettings: { type: 'object' },
        launchChecklist: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'programmatic', 'launch', 'configuration']
}));

// Task 8: Optimization and Attribution
export const optimizationAttributionTask = defineTask('optimization-attribution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create optimization and attribution measurement plan',
  agent: {
    name: 'optimization-specialist',
    prompt: {
      role: 'programmatic optimization and measurement specialist',
      task: 'Create optimization strategy and attribution measurement framework',
      context: args,
      instructions: [
        'Define optimization KPIs and thresholds',
        'Create bid optimization strategy',
        'Plan audience optimization approach',
        'Define creative rotation and testing plan',
        'Set up incrementality measurement',
        'Configure attribution model and windows',
        'Create performance dashboards',
        'Document optimization playbook'
      ],
      outputFormat: 'JSON with optimizationPlan, attributionConfig, dashboards, reportTemplates, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizationPlan', 'dashboards', 'artifacts'],
      properties: {
        optimizationPlan: { type: 'object' },
        attributionConfig: { type: 'object' },
        dashboards: { type: 'array', items: { type: 'object' } },
        reportTemplates: { type: 'array', items: { type: 'object' } },
        incrementalityPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'programmatic', 'optimization', 'attribution']
}));
