/**
 * @process specializations/sdk-platform-development/telemetry-analytics-integration
 * @description Implements telemetry and analytics integration for SDKs, including
 *              usage tracking, performance metrics, error reporting, and analytics
 *              dashboards while respecting user privacy.
 * @inputs {
 *   sdkName: string,
 *   languages: string[],
 *   telemetryTypes: string[],
 *   analyticsProviders: string[],
 *   privacyRequirements: object
 * }
 * @outputs {
 *   telemetryDesign: object,
 *   analyticsIntegration: object,
 *   privacyControls: object,
 *   dashboards: object
 * }
 * @example
 *   inputs: {
 *     sdkName: "commerce-sdk",
 *     languages: ["typescript", "java", "swift"],
 *     telemetryTypes: ["usage", "performance", "errors", "feature-adoption"],
 *     analyticsProviders: ["segment", "amplitude", "mixpanel"],
 *     privacyRequirements: { gdprCompliant: true, optInRequired: true }
 *   }
 * @references
 *   - https://opentelemetry.io/docs/
 *   - https://segment.com/docs/
 *   - https://gdpr.eu/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { sdkName, languages, telemetryTypes, analyticsProviders, privacyRequirements } = inputs;

  ctx.log.info('Starting telemetry and analytics integration', {
    sdkName,
    languages,
    telemetryTypes
  });

  // Phase 1: Telemetry Architecture Design
  ctx.log.info('Phase 1: Designing telemetry architecture');
  const telemetryArchitecture = await ctx.task(telemetryArchitectureDesignTask, {
    sdkName,
    languages,
    telemetryTypes
  });

  // Phase 2: Privacy Controls Implementation
  ctx.log.info('Phase 2: Implementing privacy controls');
  const privacyControls = await ctx.task(privacyControlsImplementationTask, {
    sdkName,
    languages,
    privacyRequirements
  });

  // Phase 3: Analytics Provider Integration
  ctx.log.info('Phase 3: Integrating analytics providers');
  const analyticsIntegration = await ctx.task(analyticsProviderIntegrationTask, {
    sdkName,
    languages,
    analyticsProviders,
    privacyControls: privacyControls.result
  });

  // Phase 4: Metrics Collection Setup
  ctx.log.info('Phase 4: Setting up metrics collection');
  const metricsCollection = await ctx.task(metricsCollectionSetupTask, {
    sdkName,
    languages,
    telemetryTypes,
    architecture: telemetryArchitecture.result
  });

  // Phase 5: Dashboard and Reporting
  ctx.log.info('Phase 5: Creating dashboards and reports');
  const dashboards = await ctx.task(dashboardCreationTask, {
    sdkName,
    telemetryTypes,
    metricsCollection: metricsCollection.result
  });

  // Quality Gate
  await ctx.breakpoint('telemetry-analytics-review', {
    question: 'Review the telemetry and analytics implementation. Are privacy controls adequate and data collection appropriate?',
    context: {
      telemetryArchitecture: telemetryArchitecture.result,
      privacyControls: privacyControls.result,
      analyticsIntegration: analyticsIntegration.result
    }
  });

  ctx.log.info('Telemetry and analytics integration completed');

  return {
    telemetryDesign: {
      architecture: telemetryArchitecture.result,
      metricsCollection: metricsCollection.result
    },
    analyticsIntegration: analyticsIntegration.result,
    privacyControls: privacyControls.result,
    dashboards: dashboards.result
  };
}

export const telemetryArchitectureDesignTask = defineTask('telemetry-architecture-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design telemetry architecture',
  agent: {
    name: 'telemetry-privacy-auditor',
    prompt: {
      role: 'SDK telemetry architect',
      task: `Design telemetry architecture for ${args.sdkName}`,
      context: {
        languages: args.languages,
        telemetryTypes: args.telemetryTypes
      },
      instructions: [
        'Design telemetry data model and event schema',
        'Define telemetry collection points in SDK lifecycle',
        'Create batching and buffering strategy',
        'Design offline storage and retry mechanisms',
        'Plan data sampling strategies for high-volume events',
        'Define telemetry export protocols',
        'Create telemetry pipeline with filtering and enrichment'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        dataModel: { type: 'object' },
        collectionPoints: { type: 'array' },
        batchingStrategy: { type: 'object' },
        offlineStorage: { type: 'object' },
        samplingStrategies: { type: 'object' },
        exportProtocols: { type: 'array' }
      },
      required: ['dataModel', 'collectionPoints', 'exportProtocols']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'telemetry', 'architecture']
}));

export const privacyControlsImplementationTask = defineTask('privacy-controls-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement privacy controls',
  agent: {
    name: 'telemetry-privacy-auditor',
    prompt: {
      role: 'Privacy engineering specialist',
      task: `Implement privacy controls for ${args.sdkName} telemetry`,
      context: {
        languages: args.languages,
        privacyRequirements: args.privacyRequirements
      },
      instructions: [
        'Design opt-in/opt-out consent mechanisms',
        'Implement data anonymization and pseudonymization',
        'Create PII detection and scrubbing',
        'Design data retention policies',
        'Implement right-to-delete (GDPR Article 17)',
        'Create data export functionality (GDPR Article 20)',
        'Design audit logging for privacy compliance'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        consentMechanisms: { type: 'object' },
        anonymization: { type: 'object' },
        piiScrubbing: { type: 'object' },
        retentionPolicies: { type: 'object' },
        dataSubjectRights: { type: 'object' },
        auditLogging: { type: 'object' }
      },
      required: ['consentMechanisms', 'anonymization', 'piiScrubbing']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'privacy', 'gdpr']
}));

export const analyticsProviderIntegrationTask = defineTask('analytics-provider-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Integrate analytics providers',
  agent: {
    name: 'telemetry-privacy-auditor',
    prompt: {
      role: 'Analytics integration engineer',
      task: `Integrate analytics providers for ${args.sdkName}`,
      context: {
        languages: args.languages,
        analyticsProviders: args.analyticsProviders,
        privacyControls: args.privacyControls
      },
      instructions: [
        'Create adapter interface for analytics providers',
        'Implement Segment integration with identify/track/page',
        'Create Amplitude integration with user properties and events',
        'Implement Mixpanel integration with people and events',
        'Design provider failover and fallback',
        'Create custom provider implementation guide',
        'Add provider-specific privacy compliance'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        adapterInterface: { type: 'object' },
        providerIntegrations: { type: 'object' },
        failoverStrategy: { type: 'object' },
        customProviderGuide: { type: 'object' }
      },
      required: ['adapterInterface', 'providerIntegrations']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'analytics', 'integration']
}));

export const metricsCollectionSetupTask = defineTask('metrics-collection-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Setup metrics collection',
  agent: {
    name: 'telemetry-privacy-auditor',
    prompt: {
      role: 'Observability engineer',
      task: `Setup metrics collection for ${args.sdkName}`,
      context: {
        languages: args.languages,
        telemetryTypes: args.telemetryTypes,
        architecture: args.architecture
      },
      instructions: [
        'Define usage metrics (API calls, features used, sessions)',
        'Create performance metrics (latency, throughput, error rates)',
        'Implement error tracking with stack traces and context',
        'Design feature adoption tracking',
        'Create funnel and conversion tracking',
        'Implement A/B testing instrumentation',
        'Add custom metric definition capabilities'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        usageMetrics: { type: 'object' },
        performanceMetrics: { type: 'object' },
        errorTracking: { type: 'object' },
        featureAdoption: { type: 'object' },
        customMetrics: { type: 'object' }
      },
      required: ['usageMetrics', 'performanceMetrics', 'errorTracking']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'metrics', 'collection']
}));

export const dashboardCreationTask = defineTask('dashboard-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create analytics dashboards',
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'Analytics dashboard designer',
      task: `Create analytics dashboards for ${args.sdkName}`,
      context: {
        telemetryTypes: args.telemetryTypes,
        metricsCollection: args.metricsCollection
      },
      instructions: [
        'Design SDK adoption dashboard (installs, active users, retention)',
        'Create API usage dashboard (endpoints, methods, volumes)',
        'Design performance dashboard (latency percentiles, error rates)',
        'Create error analysis dashboard (top errors, trends)',
        'Design feature adoption dashboard (usage by feature)',
        'Create version distribution dashboard',
        'Add alerting rules and thresholds'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        adoptionDashboard: { type: 'object' },
        apiUsageDashboard: { type: 'object' },
        performanceDashboard: { type: 'object' },
        errorDashboard: { type: 'object' },
        alertingRules: { type: 'array' }
      },
      required: ['adoptionDashboard', 'performanceDashboard']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'dashboards', 'analytics']
}));
