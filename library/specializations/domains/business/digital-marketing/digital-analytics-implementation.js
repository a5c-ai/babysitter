/**
 * @process digital-marketing/digital-analytics-implementation
 * @description Process for implementing and maintaining digital analytics infrastructure including tracking, tagging, and data collection across digital properties
 * @inputs { measurementPlan: object, websiteAccess: object, trackingRequirements: object, outputDir: string }
 * @outputs { success: boolean, configuredAnalytics: object, gtmContainer: object, trackingDocumentation: object, validationReports: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    measurementPlan = {},
    websiteAccess = {},
    trackingRequirements = {},
    outputDir = 'analytics-implementation-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Digital Analytics Implementation process');

  // Task 1: Define Measurement Requirements
  ctx.log('info', 'Phase 1: Defining measurement requirements');
  const measurementReqs = await ctx.task(measurementRequirementsTask, {
    measurementPlan,
    trackingRequirements,
    outputDir
  });
  artifacts.push(...measurementReqs.artifacts);

  // Task 2: Design Tracking Architecture
  ctx.log('info', 'Phase 2: Designing tracking architecture');
  const trackingArchitecture = await ctx.task(trackingArchitectureTask, {
    measurementReqs,
    outputDir
  });
  artifacts.push(...trackingArchitecture.artifacts);

  // Task 3: Configure Analytics Platform (GA4)
  ctx.log('info', 'Phase 3: Configuring analytics platform');
  const analyticsConfig = await ctx.task(analyticsConfigurationTask, {
    trackingArchitecture,
    measurementReqs,
    outputDir
  });
  artifacts.push(...analyticsConfig.artifacts);

  // Task 4: Implement Tag Management (GTM)
  ctx.log('info', 'Phase 4: Implementing tag management');
  const tagManagement = await ctx.task(tagManagementTask, {
    analyticsConfig,
    trackingArchitecture,
    outputDir
  });
  artifacts.push(...tagManagement.artifacts);

  // Task 5: Set Up Conversion and Event Tracking
  ctx.log('info', 'Phase 5: Setting up conversion and event tracking');
  const conversionTracking = await ctx.task(conversionEventTrackingTask, {
    analyticsConfig,
    tagManagement,
    measurementReqs,
    outputDir
  });
  artifacts.push(...conversionTracking.artifacts);

  // Task 6: Configure Enhanced Measurement
  ctx.log('info', 'Phase 6: Configuring enhanced measurement');
  const enhancedMeasurement = await ctx.task(enhancedMeasurementTask, {
    analyticsConfig,
    trackingArchitecture,
    outputDir
  });
  artifacts.push(...enhancedMeasurement.artifacts);

  // Task 7: Implement Cross-Domain Tracking
  ctx.log('info', 'Phase 7: Implementing cross-domain tracking');
  const crossDomainTracking = await ctx.task(crossDomainTrackingTask, {
    analyticsConfig,
    tagManagement,
    trackingRequirements,
    outputDir
  });
  artifacts.push(...crossDomainTracking.artifacts);

  // Task 8: Set Up E-commerce Tracking
  ctx.log('info', 'Phase 8: Setting up e-commerce tracking (if applicable)');
  const ecommerceTracking = await ctx.task(ecommerceTrackingTask, {
    analyticsConfig,
    tagManagement,
    trackingRequirements,
    outputDir
  });
  artifacts.push(...ecommerceTracking.artifacts);

  // Task 9: Validate Data Collection
  ctx.log('info', 'Phase 9: Validating data collection accuracy');
  const dataValidation = await ctx.task(dataValidationTask, {
    analyticsConfig,
    tagManagement,
    conversionTracking,
    outputDir
  });
  artifacts.push(...dataValidation.artifacts);

  // Breakpoint: Review implementation
  await ctx.breakpoint({
    question: `Analytics implementation complete. ${dataValidation.passedTests}/${dataValidation.totalTests} validation tests passed. Approve implementation?`,
    title: 'Analytics Implementation Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        eventsConfigured: conversionTracking.eventCount,
        conversionsConfigured: conversionTracking.conversionCount,
        validationPassed: dataValidation.passedTests,
        totalValidationTests: dataValidation.totalTests
      }
    }
  });

  // Task 10: Document Tracking Implementation
  ctx.log('info', 'Phase 10: Documenting tracking implementation');
  const documentation = await ctx.task(trackingDocumentationTask, {
    trackingArchitecture,
    analyticsConfig,
    tagManagement,
    conversionTracking,
    outputDir
  });
  artifacts.push(...documentation.artifacts);

  // Task 11: Set Up Maintenance Plan
  ctx.log('info', 'Phase 11: Setting up maintenance and update plan');
  const maintenancePlan = await ctx.task(maintenancePlanTask, {
    documentation,
    analyticsConfig,
    outputDir
  });
  artifacts.push(...maintenancePlan.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    configuredAnalytics: analyticsConfig.configuration,
    gtmContainer: tagManagement.container,
    trackingDocumentation: documentation.documentation,
    validationReports: dataValidation.reports,
    conversionConfiguration: conversionTracking.configuration,
    crossDomainSetup: crossDomainTracking.setup,
    maintenancePlan: maintenancePlan.plan,
    artifacts,
    duration,
    metadata: {
      processId: 'digital-marketing/digital-analytics-implementation',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task definitions
export const measurementRequirementsTask = defineTask('measurement-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define measurement requirements',
  agent: {
    name: 'measurement-analyst',
    prompt: {
      role: 'digital measurement strategist',
      task: 'Define comprehensive measurement requirements',
      context: args,
      instructions: [
        'Document business questions to answer',
        'Define KPIs and metrics needed',
        'Identify data collection requirements',
        'Map user interactions to track',
        'Define conversion events',
        'Document data layer requirements',
        'Create measurement plan document',
        'Define data governance needs'
      ],
      outputFormat: 'JSON with requirements, kpis, events, dataLayerSpec, measurementPlan, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements', 'artifacts'],
      properties: {
        requirements: { type: 'object' },
        kpis: { type: 'array', items: { type: 'object' } },
        events: { type: 'array', items: { type: 'object' } },
        dataLayerSpec: { type: 'object' },
        measurementPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'analytics', 'measurement', 'requirements']
}));

export const trackingArchitectureTask = defineTask('tracking-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design tracking architecture',
  agent: {
    name: 'tracking-architect',
    prompt: {
      role: 'analytics architect',
      task: 'Design comprehensive tracking architecture',
      context: args,
      instructions: [
        'Design data layer structure',
        'Plan event naming conventions',
        'Define parameter standards',
        'Design tag firing sequence',
        'Plan consent management integration',
        'Design custom dimensions/metrics',
        'Create architecture diagram',
        'Document technical specifications'
      ],
      outputFormat: 'JSON with architecture, dataLayer, eventSchema, namingConventions, specifications, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['architecture', 'artifacts'],
      properties: {
        architecture: { type: 'object' },
        dataLayer: { type: 'object' },
        eventSchema: { type: 'object' },
        namingConventions: { type: 'object' },
        specifications: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'analytics', 'architecture', 'tracking']
}));

export const analyticsConfigurationTask = defineTask('analytics-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure analytics platform',
  agent: {
    name: 'analytics-configurator',
    prompt: {
      role: 'Google Analytics specialist',
      task: 'Configure GA4 analytics platform',
      context: args,
      instructions: [
        'Set up GA4 property',
        'Configure data streams',
        'Set up custom events',
        'Configure custom dimensions',
        'Set up audiences',
        'Configure data retention',
        'Set up user properties',
        'Document configuration'
      ],
      outputFormat: 'JSON with configuration, property, dataStreams, customDimensions, audiences, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['configuration', 'artifacts'],
      properties: {
        configuration: { type: 'object' },
        property: { type: 'object' },
        dataStreams: { type: 'array', items: { type: 'object' } },
        customDimensions: { type: 'array', items: { type: 'object' } },
        audiences: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'analytics', 'ga4', 'configuration']
}));

export const tagManagementTask = defineTask('tag-management', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement tag management',
  agent: {
    name: 'gtm-specialist',
    prompt: {
      role: 'Google Tag Manager specialist',
      task: 'Implement tag management with GTM',
      context: args,
      instructions: [
        'Set up GTM container',
        'Configure GA4 tags',
        'Set up conversion tags',
        'Create triggers and variables',
        'Implement data layer push events',
        'Configure consent mode',
        'Set up tag sequencing',
        'Document GTM configuration'
      ],
      outputFormat: 'JSON with container, tags, triggers, variables, documentation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['container', 'artifacts'],
      properties: {
        container: { type: 'object' },
        tags: { type: 'array', items: { type: 'object' } },
        triggers: { type: 'array', items: { type: 'object' } },
        variables: { type: 'array', items: { type: 'object' } },
        documentation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'analytics', 'gtm', 'tag-management']
}));

export const conversionEventTrackingTask = defineTask('conversion-event-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up conversion and event tracking',
  agent: {
    name: 'conversion-specialist',
    prompt: {
      role: 'conversion tracking specialist',
      task: 'Implement conversion and event tracking',
      context: args,
      instructions: [
        'Define conversion events',
        'Configure event parameters',
        'Set up goal tracking',
        'Implement micro-conversions',
        'Configure attribution settings',
        'Set up conversion values',
        'Test conversion tracking',
        'Document conversion setup'
      ],
      outputFormat: 'JSON with configuration, events, eventCount, conversions, conversionCount, documentation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['configuration', 'eventCount', 'conversionCount', 'artifacts'],
      properties: {
        configuration: { type: 'object' },
        events: { type: 'array', items: { type: 'object' } },
        eventCount: { type: 'number' },
        conversions: { type: 'array', items: { type: 'object' } },
        conversionCount: { type: 'number' },
        documentation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'analytics', 'conversions', 'events']
}));

export const enhancedMeasurementTask = defineTask('enhanced-measurement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure enhanced measurement',
  agent: {
    name: 'enhanced-measurement-specialist',
    prompt: {
      role: 'GA4 enhanced measurement specialist',
      task: 'Configure enhanced measurement features',
      context: args,
      instructions: [
        'Configure scroll tracking',
        'Set up outbound click tracking',
        'Configure site search tracking',
        'Set up video engagement tracking',
        'Configure file download tracking',
        'Set up form interaction tracking',
        'Test enhanced measurement',
        'Document configuration'
      ],
      outputFormat: 'JSON with configuration, features, testResults, documentation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['configuration', 'artifacts'],
      properties: {
        configuration: { type: 'object' },
        features: { type: 'array', items: { type: 'object' } },
        testResults: { type: 'object' },
        documentation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'analytics', 'enhanced-measurement']
}));

export const crossDomainTrackingTask = defineTask('cross-domain-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement cross-domain tracking',
  agent: {
    name: 'cross-domain-specialist',
    prompt: {
      role: 'cross-domain tracking specialist',
      task: 'Implement cross-domain tracking configuration',
      context: args,
      instructions: [
        'Identify domains to link',
        'Configure cross-domain measurement',
        'Set up linker parameters',
        'Configure referral exclusions',
        'Test cross-domain tracking',
        'Handle edge cases',
        'Document configuration',
        'Create testing procedures'
      ],
      outputFormat: 'JSON with setup, domains, configuration, testResults, documentation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['setup', 'artifacts'],
      properties: {
        setup: { type: 'object' },
        domains: { type: 'array', items: { type: 'string' } },
        configuration: { type: 'object' },
        testResults: { type: 'object' },
        documentation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'analytics', 'cross-domain']
}));

export const ecommerceTrackingTask = defineTask('ecommerce-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up e-commerce tracking',
  agent: {
    name: 'ecommerce-analyst',
    prompt: {
      role: 'e-commerce analytics specialist',
      task: 'Implement e-commerce tracking (if applicable)',
      context: args,
      instructions: [
        'Configure product impressions',
        'Set up product click tracking',
        'Implement add to cart tracking',
        'Configure checkout tracking',
        'Set up purchase tracking',
        'Implement refund tracking',
        'Configure product lists',
        'Document e-commerce setup'
      ],
      outputFormat: 'JSON with configuration, events, dataLayerSpec, documentation, applicable, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['configuration', 'applicable', 'artifacts'],
      properties: {
        configuration: { type: 'object' },
        events: { type: 'array', items: { type: 'object' } },
        dataLayerSpec: { type: 'object' },
        documentation: { type: 'object' },
        applicable: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'analytics', 'ecommerce']
}));

export const dataValidationTask = defineTask('data-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate data collection accuracy',
  agent: {
    name: 'data-validator',
    prompt: {
      role: 'analytics QA specialist',
      task: 'Validate data collection accuracy and completeness',
      context: args,
      instructions: [
        'Test all tracking events',
        'Validate parameter accuracy',
        'Check data layer population',
        'Verify conversion tracking',
        'Test cross-device tracking',
        'Validate real-time reports',
        'Check data accuracy',
        'Document validation results'
      ],
      outputFormat: 'JSON with results, passedTests, totalTests, issues, reports, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'passedTests', 'totalTests', 'reports', 'artifacts'],
      properties: {
        results: { type: 'array', items: { type: 'object' } },
        passedTests: { type: 'number' },
        totalTests: { type: 'number' },
        issues: { type: 'array', items: { type: 'object' } },
        reports: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'analytics', 'validation', 'qa']
}));

export const trackingDocumentationTask = defineTask('tracking-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document tracking implementation',
  agent: {
    name: 'documentation-specialist',
    prompt: {
      role: 'analytics documentation specialist',
      task: 'Create comprehensive tracking documentation',
      context: args,
      instructions: [
        'Document tracking architecture',
        'Create event reference guide',
        'Document data layer specification',
        'Create GTM documentation',
        'Document custom dimensions',
        'Create troubleshooting guide',
        'Document governance procedures',
        'Create onboarding materials'
      ],
      outputFormat: 'JSON with documentation, eventGuide, dataLayerDocs, gtmDocs, troubleshooting, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentation', 'artifacts'],
      properties: {
        documentation: { type: 'object' },
        eventGuide: { type: 'object' },
        dataLayerDocs: { type: 'object' },
        gtmDocs: { type: 'object' },
        troubleshooting: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'analytics', 'documentation']
}));

export const maintenancePlanTask = defineTask('maintenance-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up maintenance and update plan',
  agent: {
    name: 'maintenance-planner',
    prompt: {
      role: 'analytics maintenance specialist',
      task: 'Create plan for ongoing tracking maintenance',
      context: args,
      instructions: [
        'Define maintenance schedule',
        'Plan regular audits',
        'Create update procedures',
        'Plan for platform changes',
        'Set up monitoring alerts',
        'Create change management process',
        'Plan training updates',
        'Document maintenance plan'
      ],
      outputFormat: 'JSON with plan, schedule, auditPlan, procedures, changeManagement, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        schedule: { type: 'object' },
        auditPlan: { type: 'object' },
        procedures: { type: 'object' },
        changeManagement: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'analytics', 'maintenance']
}));
