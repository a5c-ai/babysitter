/**
 * @process digital-marketing/email-marketing-campaign
 * @description Process for creating, testing, and deploying email marketing campaigns including newsletters, promotional emails, and triggered messages
 * @inputs { campaignBrief: object, audienceSegments: array, content: object, designAssets: object, outputDir: string }
 * @outputs { success: boolean, emailCampaigns: array, testResults: object, performanceReports: array, optimizationRecommendations: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    campaignBrief = {},
    audienceSegments = [],
    content = {},
    designAssets = {},
    outputDir = 'email-campaign-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Email Marketing Campaign Execution process');

  // Task 1: Define Email Campaign Objectives
  ctx.log('info', 'Phase 1: Defining email campaign objectives');
  const objectivesResult = await ctx.task(emailObjectivesTask, {
    campaignBrief,
    outputDir
  });
  artifacts.push(...objectivesResult.artifacts);

  // Task 2: Segment Target Audience
  ctx.log('info', 'Phase 2: Segmenting target audience');
  const segmentation = await ctx.task(audienceSegmentationTask, {
    audienceSegments,
    campaignBrief,
    outputDir
  });
  artifacts.push(...segmentation.artifacts);

  // Task 3: Develop Email Content and Copy
  ctx.log('info', 'Phase 3: Developing email content and copy');
  const contentDevelopment = await ctx.task(emailContentTask, {
    content,
    campaignBrief,
    segmentation,
    outputDir
  });
  artifacts.push(...contentDevelopment.artifacts);

  // Task 4: Design Email Template
  ctx.log('info', 'Phase 4: Designing email template');
  const templateDesign = await ctx.task(emailTemplateDesignTask, {
    designAssets,
    contentDevelopment,
    campaignBrief,
    outputDir
  });
  artifacts.push(...templateDesign.artifacts);

  // Task 5: Set Up A/B Test Variations
  ctx.log('info', 'Phase 5: Setting up A/B test variations');
  const abTestSetup = await ctx.task(abTestSetupTask, {
    contentDevelopment,
    templateDesign,
    outputDir
  });
  artifacts.push(...abTestSetup.artifacts);

  // Task 6: Configure Personalization and Dynamic Content
  ctx.log('info', 'Phase 6: Configuring personalization and dynamic content');
  const personalization = await ctx.task(personalizationTask, {
    segmentation,
    contentDevelopment,
    outputDir
  });
  artifacts.push(...personalization.artifacts);

  // Task 7: Test Email Rendering
  ctx.log('info', 'Phase 7: Testing email rendering across clients');
  const renderingTest = await ctx.task(emailRenderingTestTask, {
    templateDesign,
    personalization,
    outputDir
  });
  artifacts.push(...renderingTest.artifacts);

  // Breakpoint: Review before sending
  await ctx.breakpoint({
    question: `Email campaign ready. ${renderingTest.passedTests}/${renderingTest.totalTests} rendering tests passed. ${abTestSetup.variationCount} A/B test variations. Approve for sending?`,
    title: 'Email Campaign Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        segments: segmentation.segmentCount,
        abVariations: abTestSetup.variationCount,
        renderingTestsPassed: renderingTest.passedTests,
        totalRenderingTests: renderingTest.totalTests
      }
    }
  });

  // Task 8: Schedule or Trigger Send
  ctx.log('info', 'Phase 8: Scheduling or triggering email send');
  const sendSetup = await ctx.task(emailSendSetupTask, {
    campaignBrief,
    segmentation,
    abTestSetup,
    outputDir
  });
  artifacts.push(...sendSetup.artifacts);

  // Task 9: Monitor Delivery and Engagement
  ctx.log('info', 'Phase 9: Setting up delivery and engagement monitoring');
  const deliveryMonitoring = await ctx.task(deliveryMonitoringTask, {
    sendSetup,
    outputDir
  });
  artifacts.push(...deliveryMonitoring.artifacts);

  // Task 10: Analyze Performance Metrics
  ctx.log('info', 'Phase 10: Creating performance analysis framework');
  const performanceAnalysis = await ctx.task(performanceAnalysisTask, {
    objectivesResult,
    abTestSetup,
    outputDir
  });
  artifacts.push(...performanceAnalysis.artifacts);

  // Task 11: Document Learnings and Optimize
  ctx.log('info', 'Phase 11: Documenting learnings and optimization recommendations');
  const learningsOptimization = await ctx.task(learningsOptimizationTask, {
    performanceAnalysis,
    abTestSetup,
    outputDir
  });
  artifacts.push(...learningsOptimization.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    emailCampaigns: sendSetup.campaigns,
    testResults: {
      abTests: abTestSetup.tests,
      renderingTests: renderingTest.results
    },
    performanceReports: performanceAnalysis.reportTemplates,
    optimizationRecommendations: learningsOptimization.recommendations,
    segmentation: segmentation.segments,
    personalizationSetup: personalization.setup,
    monitoringSetup: deliveryMonitoring.setup,
    artifacts,
    duration,
    metadata: {
      processId: 'digital-marketing/email-marketing-campaign',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task definitions
export const emailObjectivesTask = defineTask('email-objectives', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define email campaign objectives',
  agent: {
    name: 'email-strategist',
    prompt: {
      role: 'email marketing strategist',
      task: 'Define clear objectives and KPIs for email campaign',
      context: args,
      instructions: [
        'Define primary campaign objective',
        'Set measurable KPIs (open rate, CTR, conversion rate)',
        'Establish success benchmarks',
        'Define target audience goals',
        'Plan email sequence structure',
        'Document campaign strategy',
        'Create measurement framework'
      ],
      outputFormat: 'JSON with objectives, kpis, benchmarks, strategy, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['objectives', 'kpis', 'artifacts'],
      properties: {
        objectives: { type: 'object' },
        kpis: { type: 'array', items: { type: 'object' } },
        benchmarks: { type: 'object' },
        strategy: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'email-marketing', 'objectives', 'strategy']
}));

export const audienceSegmentationTask = defineTask('audience-segmentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Segment target audience',
  agent: {
    name: 'segmentation-specialist',
    prompt: {
      role: 'email segmentation specialist',
      task: 'Segment audience for targeted email campaigns',
      context: args,
      instructions: [
        'Analyze available audience data',
        'Create segments based on demographics',
        'Segment by behavioral data',
        'Create engagement-based segments',
        'Define segment-specific messaging',
        'Set segment sizes and targets',
        'Document segmentation strategy',
        'Create exclusion rules'
      ],
      outputFormat: 'JSON with segments, segmentCount, criteria, messaging, exclusions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['segments', 'segmentCount', 'artifacts'],
      properties: {
        segments: { type: 'array', items: { type: 'object' } },
        segmentCount: { type: 'number' },
        criteria: { type: 'object' },
        messaging: { type: 'object' },
        exclusions: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'email-marketing', 'segmentation', 'audience']
}));

export const emailContentTask = defineTask('email-content', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop email content and copy',
  agent: {
    name: 'email-copywriter',
    prompt: {
      role: 'email copywriter',
      task: 'Develop compelling email content and copy',
      context: args,
      instructions: [
        'Write compelling subject lines',
        'Create preheader text',
        'Write email body copy',
        'Develop clear CTAs',
        'Create segment-specific variations',
        'Write alt text for images',
        'Ensure mobile-friendly copy length',
        'Document copy guidelines'
      ],
      outputFormat: 'JSON with content, subjectLines, preheaders, bodyCopy, ctas, variations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['content', 'artifacts'],
      properties: {
        content: { type: 'object' },
        subjectLines: { type: 'array', items: { type: 'string' } },
        preheaders: { type: 'array', items: { type: 'string' } },
        bodyCopy: { type: 'object' },
        ctas: { type: 'array', items: { type: 'object' } },
        variations: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'email-marketing', 'content', 'copywriting']
}));

export const emailTemplateDesignTask = defineTask('email-template-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design email template',
  agent: {
    name: 'email-designer',
    prompt: {
      role: 'email template designer',
      task: 'Design responsive email template',
      context: args,
      instructions: [
        'Create responsive email layout',
        'Design header and footer',
        'Style content blocks',
        'Optimize for mobile devices',
        'Ensure accessibility compliance',
        'Create dark mode compatible design',
        'Document design specifications',
        'Create template variations'
      ],
      outputFormat: 'JSON with template, design, specifications, mobileOptimization, accessibility, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['template', 'design', 'artifacts'],
      properties: {
        template: { type: 'object' },
        design: { type: 'object' },
        specifications: { type: 'object' },
        mobileOptimization: { type: 'object' },
        accessibility: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'email-marketing', 'design', 'template']
}));

export const abTestSetupTask = defineTask('ab-test-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up A/B test variations',
  agent: {
    name: 'ab-test-specialist',
    prompt: {
      role: 'email A/B testing specialist',
      task: 'Set up A/B test variations for email campaign',
      context: args,
      instructions: [
        'Define test hypotheses',
        'Create subject line variations',
        'Create content variations',
        'Set up CTA variations',
        'Define test split percentages',
        'Set statistical significance thresholds',
        'Plan test duration',
        'Document testing methodology'
      ],
      outputFormat: 'JSON with tests, variationCount, hypotheses, splitPercentages, methodology, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['tests', 'variationCount', 'artifacts'],
      properties: {
        tests: { type: 'array', items: { type: 'object' } },
        variationCount: { type: 'number' },
        hypotheses: { type: 'array', items: { type: 'string' } },
        splitPercentages: { type: 'object' },
        methodology: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'email-marketing', 'ab-testing']
}));

export const personalizationTask = defineTask('personalization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure personalization and dynamic content',
  agent: {
    name: 'personalization-specialist',
    prompt: {
      role: 'email personalization specialist',
      task: 'Configure email personalization and dynamic content',
      context: args,
      instructions: [
        'Set up merge tags for personalization',
        'Configure dynamic content blocks',
        'Create segment-specific content',
        'Set up product recommendations',
        'Configure conditional content',
        'Set fallback values',
        'Test personalization logic',
        'Document personalization rules'
      ],
      outputFormat: 'JSON with setup, mergeTags, dynamicContent, conditionalRules, fallbacks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['setup', 'artifacts'],
      properties: {
        setup: { type: 'object' },
        mergeTags: { type: 'array', items: { type: 'object' } },
        dynamicContent: { type: 'array', items: { type: 'object' } },
        conditionalRules: { type: 'array', items: { type: 'object' } },
        fallbacks: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'email-marketing', 'personalization', 'dynamic-content']
}));

export const emailRenderingTestTask = defineTask('email-rendering-test', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Test email rendering across clients',
  agent: {
    name: 'rendering-tester',
    prompt: {
      role: 'email rendering specialist',
      task: 'Test email rendering across email clients and devices',
      context: args,
      instructions: [
        'Test in major email clients (Gmail, Outlook, Apple Mail)',
        'Test mobile rendering (iOS, Android)',
        'Test dark mode rendering',
        'Verify link functionality',
        'Check image loading',
        'Test personalization rendering',
        'Validate spam score',
        'Document test results and issues'
      ],
      outputFormat: 'JSON with results, passedTests, totalTests, issues, spamScore, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'passedTests', 'totalTests', 'artifacts'],
      properties: {
        results: { type: 'array', items: { type: 'object' } },
        passedTests: { type: 'number' },
        totalTests: { type: 'number' },
        issues: { type: 'array', items: { type: 'object' } },
        spamScore: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'email-marketing', 'rendering', 'testing']
}));

export const emailSendSetupTask = defineTask('email-send-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Schedule or trigger email send',
  agent: {
    name: 'send-coordinator',
    prompt: {
      role: 'email send coordinator',
      task: 'Configure and schedule email send',
      context: args,
      instructions: [
        'Determine optimal send time',
        'Configure send schedule',
        'Set up send throttling',
        'Configure trigger conditions if applicable',
        'Set up suppression lists',
        'Configure bounce handling',
        'Document send configuration',
        'Create send checklist'
      ],
      outputFormat: 'JSON with campaigns, schedule, triggers, suppression, bounceHandling, checklist, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['campaigns', 'artifacts'],
      properties: {
        campaigns: { type: 'array', items: { type: 'object' } },
        schedule: { type: 'object' },
        triggers: { type: 'array', items: { type: 'object' } },
        suppression: { type: 'object' },
        bounceHandling: { type: 'object' },
        checklist: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'email-marketing', 'scheduling', 'send']
}));

export const deliveryMonitoringTask = defineTask('delivery-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up delivery and engagement monitoring',
  agent: {
    name: 'delivery-monitor',
    prompt: {
      role: 'email delivery specialist',
      task: 'Set up monitoring for email delivery and engagement',
      context: args,
      instructions: [
        'Set up delivery tracking',
        'Configure bounce monitoring',
        'Track open rates',
        'Monitor click tracking',
        'Set up unsubscribe tracking',
        'Configure complaint monitoring',
        'Set up real-time alerts',
        'Create monitoring dashboard'
      ],
      outputFormat: 'JSON with setup, tracking, alerts, dashboard, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['setup', 'artifacts'],
      properties: {
        setup: { type: 'object' },
        tracking: { type: 'object' },
        alerts: { type: 'array', items: { type: 'object' } },
        dashboard: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'email-marketing', 'delivery', 'monitoring']
}));

export const performanceAnalysisTask = defineTask('performance-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create performance analysis framework',
  agent: {
    name: 'performance-analyst',
    prompt: {
      role: 'email performance analyst',
      task: 'Create framework for analyzing email performance metrics',
      context: args,
      instructions: [
        'Define key performance metrics',
        'Create performance benchmarks',
        'Design analysis dashboard',
        'Create report templates',
        'Set up cohort analysis',
        'Plan A/B test analysis',
        'Define ROI calculation',
        'Document analysis methodology'
      ],
      outputFormat: 'JSON with metrics, reportTemplates, dashboards, methodology, roiCalculation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'reportTemplates', 'artifacts'],
      properties: {
        metrics: { type: 'array', items: { type: 'object' } },
        reportTemplates: { type: 'array', items: { type: 'object' } },
        dashboards: { type: 'array', items: { type: 'object' } },
        methodology: { type: 'object' },
        roiCalculation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'email-marketing', 'performance', 'analysis']
}));

export const learningsOptimizationTask = defineTask('learnings-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document learnings and optimization recommendations',
  agent: {
    name: 'optimization-specialist',
    prompt: {
      role: 'email optimization specialist',
      task: 'Document campaign learnings and optimization recommendations',
      context: args,
      instructions: [
        'Analyze A/B test results',
        'Document what worked/didn\'t work',
        'Create optimization recommendations',
        'Update best practices',
        'Plan future test ideas',
        'Document audience insights',
        'Create learnings database entry',
        'Share insights with team'
      ],
      outputFormat: 'JSON with learnings, recommendations, bestPractices, futureTests, insights, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['learnings', 'recommendations', 'artifacts'],
      properties: {
        learnings: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'object' } },
        bestPractices: { type: 'array', items: { type: 'string' } },
        futureTests: { type: 'array', items: { type: 'object' } },
        insights: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'email-marketing', 'learnings', 'optimization']
}));
