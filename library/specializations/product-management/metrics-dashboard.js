/**
 * @process specializations/product-management/metrics-dashboard
 * @description Product Metrics Dashboard Setup - Comprehensive dashboard implementation process including
 * KPI identification, metrics instrumentation, dashboard design, data pipeline setup, and alert configuration
 * for product health monitoring and decision-making.
 * @inputs { productName: string, dashboardType: string, stakeholders?: array, metricsScope?: array, dataSources?: array, alertThresholds?: object }
 * @outputs { success: boolean, dashboard: object, kpis: array, instrumentation: object, dataPipeline: object, alerts: array }
 *
 * @example
 * const result = await orchestrate('specializations/product-management/metrics-dashboard', {
 *   productName: 'CloudConnect Platform',
 *   dashboardType: 'executive', // 'executive', 'operational', 'team', 'customer-facing'
 *   stakeholders: ['executives', 'product-team', 'engineering', 'sales'],
 *   metricsScope: ['acquisition', 'activation', 'retention', 'revenue', 'satisfaction'],
 *   dataSources: ['analytics-platform', 'database', 'crm', 'support-system'],
 *   alertThresholds: { critical: 0.8, warning: 0.6 }
 * });
 *
 * @references
 * - Product Metrics Framework: https://www.productplan.com/glossary/product-metrics/
 * - AARRR/Pirate Metrics: https://www.productplan.com/glossary/aarrr-framework/
 * - HEART Framework: https://library.gv.com/how-to-choose-the-right-ux-metrics-for-your-product-5f46359ab5be
 * - North Star Metric: https://amplitude.com/blog/product-north-star-metric
 * - Data Dashboard Design: https://www.nngroup.com/articles/dashboard-design/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    productName,
    dashboardType = 'operational', // 'executive', 'operational', 'team', 'customer-facing'
    stakeholders = [],
    metricsScope = ['acquisition', 'activation', 'retention', 'revenue', 'satisfaction'],
    dataSources = [],
    alertThresholds = { critical: 0.8, warning: 0.6 },
    existingMetrics = [],
    refreshFrequency = 'real-time', // 'real-time', 'hourly', 'daily', 'weekly'
    targetSegments = [],
    complianceRequirements = []
  } = inputs;

  const startTime = ctx.now();

  ctx.log('info', `Starting Product Metrics Dashboard Setup for ${productName}`);
  ctx.log('info', `Dashboard Type: ${dashboardType}, Metrics Scope: ${metricsScope.join(', ')}`);

  // Phase 1: KPI Identification and North Star Metric Definition
  const kpiIdentification = await ctx.task(kpiIdentificationTask, {
    productName,
    dashboardType,
    stakeholders,
    metricsScope,
    existingMetrics,
    targetSegments
  });

  // Quality Gate: North Star Metric and KPIs must be defined
  if (!kpiIdentification.northStarMetric || !kpiIdentification.kpis || kpiIdentification.kpis.length === 0) {
    return {
      success: false,
      error: 'KPI identification incomplete - North Star Metric or KPIs not defined',
      phase: 'kpi-identification',
      dashboard: null
    };
  }

  // Breakpoint: Review KPI Framework
  await ctx.breakpoint({
    question: `KPI framework identified with North Star Metric: "${kpiIdentification.northStarMetric.metric}". Review ${kpiIdentification.kpis.length} KPIs before proceeding with instrumentation?`,
    title: 'KPI Framework Review',
    context: {
      runId: ctx.runId,
      productName,
      dashboardType,
      northStarMetric: kpiIdentification.northStarMetric,
      kpiCategories: kpiIdentification.kpiCategories,
      kpiCount: kpiIdentification.kpis.length,
      files: [{
        path: `artifacts/phase1-kpi-framework.json`,
        format: 'json',
        content: kpiIdentification
      }]
    }
  });

  // Phase 2: Metrics Instrumentation Planning
  const instrumentationPlanning = await ctx.task(instrumentationPlanningTask, {
    productName,
    kpis: kpiIdentification.kpis,
    northStarMetric: kpiIdentification.northStarMetric,
    dataSources,
    existingMetrics
  });

  // Phase 3: Dashboard Design and UX Planning
  const dashboardDesign = await ctx.task(dashboardDesignTask, {
    productName,
    dashboardType,
    kpis: kpiIdentification.kpis,
    northStarMetric: kpiIdentification.northStarMetric,
    stakeholders,
    refreshFrequency
  });

  // Quality Gate: Dashboard must have defined layout and visualizations
  if (!dashboardDesign.layout || !dashboardDesign.visualizations || dashboardDesign.visualizations.length === 0) {
    return {
      success: false,
      error: 'Dashboard design incomplete',
      phase: 'dashboard-design',
      dashboard: null
    };
  }

  // Breakpoint: Review Dashboard Design
  await ctx.breakpoint({
    question: `Dashboard design complete with ${dashboardDesign.visualizations.length} visualizations across ${dashboardDesign.layout.sections.length} sections. Review design before implementing data pipeline?`,
    title: 'Dashboard Design Review',
    context: {
      runId: ctx.runId,
      productName,
      layoutType: dashboardDesign.layout.type,
      sectionCount: dashboardDesign.layout.sections.length,
      visualizationTypes: dashboardDesign.visualizations.map(v => v.type),
      files: [
        { path: `artifacts/phase3-dashboard-design.json`, format: 'json', content: dashboardDesign },
        { path: `artifacts/phase3-dashboard-mockup.md`, format: 'markdown', content: dashboardDesign.mockupMarkdown }
      ]
    }
  });

  // Phase 4: Data Pipeline Architecture
  const dataPipelineSetup = await ctx.task(dataPipelineSetupTask, {
    productName,
    kpis: kpiIdentification.kpis,
    instrumentation: instrumentationPlanning,
    dataSources,
    refreshFrequency,
    complianceRequirements
  });

  // Phase 5: Data Quality and Validation Framework
  const dataQualityFramework = await ctx.task(dataQualityFrameworkTask, {
    productName,
    kpis: kpiIdentification.kpis,
    dataPipeline: dataPipelineSetup,
    instrumentation: instrumentationPlanning
  });

  // Phase 6: Alert and Anomaly Detection Configuration
  const alertConfiguration = await ctx.task(alertConfigurationTask, {
    productName,
    kpis: kpiIdentification.kpis,
    northStarMetric: kpiIdentification.northStarMetric,
    alertThresholds,
    stakeholders,
    dashboardType
  });

  // Quality Gate: Alerts must be configured for critical metrics
  const criticalMetricsWithAlerts = alertConfiguration.alerts.filter(
    a => a.severity === 'critical'
  ).length;

  if (criticalMetricsWithAlerts === 0) {
    await ctx.breakpoint({
      question: `No critical alerts configured. This may result in missing important product issues. Continue without critical alerts?`,
      title: 'Alert Configuration Warning',
      context: {
        runId: ctx.runId,
        totalAlerts: alertConfiguration.alerts.length,
        criticalAlerts: criticalMetricsWithAlerts,
        recommendation: 'Add critical alerts for North Star Metric and key business metrics'
      }
    });
  }

  // Phase 7: Dashboard Implementation Specification
  const implementationSpec = await ctx.task(implementationSpecTask, {
    productName,
    dashboardDesign,
    dataPipeline: dataPipelineSetup,
    instrumentation: instrumentationPlanning,
    dataQuality: dataQualityFramework,
    alerts: alertConfiguration,
    refreshFrequency
  });

  // Phase 8: Testing and Validation Plan
  const testingPlan = await ctx.task(testingPlanTask, {
    productName,
    kpis: kpiIdentification.kpis,
    dashboard: dashboardDesign,
    dataPipeline: dataPipelineSetup,
    alerts: alertConfiguration,
    stakeholders
  });

  // Phase 9: Access Control and Security Configuration
  const securityConfiguration = await ctx.task(securityConfigurationTask, {
    productName,
    dashboardType,
    stakeholders,
    dataSources,
    complianceRequirements,
    kpis: kpiIdentification.kpis
  });

  // Phase 10: Documentation and Enablement Materials
  const documentationPackage = await ctx.task(documentationTask, {
    productName,
    dashboardType,
    kpiFramework: kpiIdentification,
    dashboardDesign,
    implementationSpec,
    dataPipeline: dataPipelineSetup,
    alerts: alertConfiguration,
    security: securityConfiguration,
    stakeholders
  });

  // Phase 11: Rollout and Adoption Plan
  const rolloutPlan = await ctx.task(rolloutPlanTask, {
    productName,
    dashboardType,
    stakeholders,
    implementationSpec,
    documentation: documentationPackage,
    testingPlan
  });

  // Final Quality Gate: Implementation readiness score
  const readinessScore = implementationSpec.readinessScore || 0;
  const implementationReady = readinessScore >= 85;

  // Final Breakpoint: Dashboard Setup Approval
  await ctx.breakpoint({
    question: `Product Metrics Dashboard Setup Complete for ${productName}. Implementation Readiness: ${readinessScore}/100. ${implementationReady ? 'Ready for implementation!' : 'May need additional refinement.'} Approve dashboard specification for implementation?`,
    title: 'Dashboard Setup Approval',
    context: {
      runId: ctx.runId,
      productName,
      dashboardType,
      readinessScore,
      implementationReady,
      northStarMetric: kpiIdentification.northStarMetric.metric,
      kpiCount: kpiIdentification.kpis.length,
      alertCount: alertConfiguration.alerts.length,
      estimatedImplementationTime: implementationSpec.estimatedImplementationTime,
      files: [
        { path: `artifacts/final-dashboard-specification.json`, format: 'json', content: implementationSpec },
        { path: `artifacts/final-implementation-guide.md`, format: 'markdown', content: documentationPackage.implementationGuide },
        { path: `artifacts/final-user-guide.md`, format: 'markdown', content: documentationPackage.userGuide }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    productName,
    dashboardType,
    readinessScore,
    implementationReady,
    northStarMetric: {
      metric: kpiIdentification.northStarMetric.metric,
      definition: kpiIdentification.northStarMetric.definition,
      target: kpiIdentification.northStarMetric.target
    },
    kpis: {
      total: kpiIdentification.kpis.length,
      byCategory: kpiIdentification.kpiCategories,
      list: kpiIdentification.kpis
    },
    dashboard: {
      layout: dashboardDesign.layout,
      visualizations: dashboardDesign.visualizations,
      sections: dashboardDesign.layout.sections.length,
      refreshFrequency
    },
    instrumentation: {
      eventsToTrack: instrumentationPlanning.eventsToTrack.length,
      implementationApproach: instrumentationPlanning.implementationApproach,
      trackingPlan: instrumentationPlanning.trackingPlan,
      estimatedEffort: instrumentationPlanning.estimatedEffort
    },
    dataPipeline: {
      architecture: dataPipelineSetup.architecture,
      dataSources: dataPipelineSetup.dataSources,
      transformations: dataPipelineSetup.transformations.length,
      storageStrategy: dataPipelineSetup.storageStrategy,
      refreshStrategy: dataPipelineSetup.refreshStrategy
    },
    dataQuality: {
      validationRules: dataQualityFramework.validationRules.length,
      qualityMonitoring: dataQualityFramework.qualityMonitoring,
      reconciliationProcess: dataQualityFramework.reconciliationProcess
    },
    alerts: {
      total: alertConfiguration.alerts.length,
      critical: alertConfiguration.alerts.filter(a => a.severity === 'critical').length,
      warning: alertConfiguration.alerts.filter(a => a.severity === 'warning').length,
      channels: alertConfiguration.notificationChannels,
      anomalyDetection: alertConfiguration.anomalyDetection
    },
    implementation: {
      estimatedTime: implementationSpec.estimatedImplementationTime,
      technicalStack: implementationSpec.technicalStack,
      dependencies: implementationSpec.dependencies,
      phases: implementationSpec.implementationPhases
    },
    testing: {
      testScenarios: testingPlan.testScenarios.length,
      validationCriteria: testingPlan.validationCriteria,
      uatPlan: testingPlan.uatPlan
    },
    security: {
      accessControl: securityConfiguration.accessControl,
      dataPrivacy: securityConfiguration.dataPrivacy,
      compliance: securityConfiguration.complianceControls
    },
    documentation: {
      implementationGuide: documentationPackage.implementationGuide,
      userGuide: documentationPackage.userGuide,
      apiDocs: documentationPackage.apiDocumentation,
      troubleshooting: documentationPackage.troubleshootingGuide
    },
    rollout: {
      phases: rolloutPlan.rolloutPhases,
      timeline: rolloutPlan.timeline,
      successCriteria: rolloutPlan.successCriteria,
      adoptionMetrics: rolloutPlan.adoptionMetrics
    },
    duration,
    metadata: {
      processId: 'specializations/product-management/metrics-dashboard',
      timestamp: startTime,
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const kpiIdentificationTask = defineTask('kpi-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: KPI Identification and North Star Metric Definition - ${args.productName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Chief Product Officer and Data Analytics Expert with expertise in product metrics frameworks (AARRR, HEART, NSM)',
      task: 'Identify and define comprehensive KPI framework including North Star Metric for product dashboard',
      context: {
        productName: args.productName,
        dashboardType: args.dashboardType,
        stakeholders: args.stakeholders,
        metricsScope: args.metricsScope,
        existingMetrics: args.existingMetrics,
        targetSegments: args.targetSegments
      },
      instructions: [
        '1. Define the product\'s North Star Metric - the single metric that best captures core value delivered to customers',
        '2. Identify 8-12 key performance indicators (KPIs) aligned with product lifecycle: Acquisition, Activation, Retention, Revenue, Referral (AARRR)',
        '3. For each KPI, define: metric name, definition, calculation formula, data source, target value, and business rationale',
        '4. Apply HEART framework where relevant: Happiness, Engagement, Adoption, Retention, Task Success',
        '5. Categorize KPIs: Health Metrics, Growth Metrics, Engagement Metrics, Business Metrics',
        '6. Define leading indicators (predictive) vs lagging indicators (retrospective)',
        '7. Identify input metrics that drive outcome metrics',
        '8. Define metric ownership and accountability',
        '9. Establish baseline values and aspirational targets for each KPI',
        '10. Map KPIs to business objectives and stakeholder needs',
        '11. Identify segmentation dimensions (cohorts, geography, plan tier, etc.)',
        '12. Define metric refresh requirements (real-time, daily, weekly)',
        '13. Validate metrics can be accurately measured with available data sources',
        '14. Ensure metrics balance: growth vs health, quantity vs quality, short-term vs long-term'
      ],
      outputFormat: 'JSON object with comprehensive KPI framework'
    },
    outputSchema: {
      type: 'object',
      required: ['northStarMetric', 'kpis', 'kpiCategories', 'metricRelationships'],
      properties: {
        northStarMetric: {
          type: 'object',
          required: ['metric', 'definition', 'rationale', 'calculationFormula', 'target'],
          properties: {
            metric: { type: 'string', description: 'North Star Metric name' },
            definition: { type: 'string', description: 'Clear definition of what this metric measures' },
            rationale: { type: 'string', description: 'Why this is the North Star Metric' },
            calculationFormula: { type: 'string', description: 'How to calculate this metric' },
            dataSource: { type: 'string' },
            currentValue: { type: 'string' },
            target: { type: 'string' },
            refreshFrequency: { type: 'string', enum: ['real-time', 'hourly', 'daily', 'weekly'] }
          }
        },
        kpis: {
          type: 'array',
          items: {
            type: 'object',
            required: ['kpiId', 'name', 'definition', 'calculationFormula', 'category'],
            properties: {
              kpiId: { type: 'string' },
              name: { type: 'string' },
              definition: { type: 'string' },
              calculationFormula: { type: 'string' },
              category: {
                type: 'string',
                enum: ['acquisition', 'activation', 'retention', 'revenue', 'referral', 'engagement', 'satisfaction', 'health']
              },
              metricType: { type: 'string', enum: ['leading', 'lagging', 'input', 'outcome'] },
              dataSource: { type: 'string' },
              dataType: { type: 'string', enum: ['count', 'percentage', 'ratio', 'average', 'median', 'sum', 'duration'] },
              unit: { type: 'string' },
              currentValue: { type: 'string' },
              targetValue: { type: 'string' },
              thresholds: {
                type: 'object',
                properties: {
                  excellent: { type: 'string' },
                  good: { type: 'string' },
                  warning: { type: 'string' },
                  critical: { type: 'string' }
                }
              },
              refreshFrequency: { type: 'string', enum: ['real-time', 'hourly', 'daily', 'weekly', 'monthly'] },
              owner: { type: 'string' },
              businessRationale: { type: 'string' },
              segmentationDimensions: { type: 'array', items: { type: 'string' } },
              relatedKpis: { type: 'array', items: { type: 'string' } }
            }
          },
          minItems: 8,
          maxItems: 12
        },
        kpiCategories: {
          type: 'object',
          properties: {
            acquisition: { type: 'array', items: { type: 'string' } },
            activation: { type: 'array', items: { type: 'string' } },
            retention: { type: 'array', items: { type: 'string' } },
            revenue: { type: 'array', items: { type: 'string' } },
            referral: { type: 'array', items: { type: 'string' } },
            engagement: { type: 'array', items: { type: 'string' } },
            satisfaction: { type: 'array', items: { type: 'string' } },
            health: { type: 'array', items: { type: 'string' } }
          }
        },
        metricRelationships: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              inputMetric: { type: 'string' },
              outcomeMetric: { type: 'string' },
              relationship: { type: 'string', enum: ['drives', 'influences', 'correlates-with', 'predicts'] },
              strength: { type: 'string', enum: ['strong', 'moderate', 'weak'] }
            }
          }
        },
        frameworkAlignment: {
          type: 'object',
          properties: {
            aarrr: {
              type: 'object',
              properties: {
                acquisition: { type: 'array', items: { type: 'string' } },
                activation: { type: 'array', items: { type: 'string' } },
                retention: { type: 'array', items: { type: 'string' } },
                revenue: { type: 'array', items: { type: 'string' } },
                referral: { type: 'array', items: { type: 'string' } }
              }
            },
            heart: {
              type: 'object',
              properties: {
                happiness: { type: 'array', items: { type: 'string' } },
                engagement: { type: 'array', items: { type: 'string' } },
                adoption: { type: 'array', items: { type: 'string' } },
                retention: { type: 'array', items: { type: 'string' } },
                taskSuccess: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        },
        segmentationStrategy: {
          type: 'object',
          properties: {
            primaryDimensions: { type: 'array', items: { type: 'string' } },
            secondaryDimensions: { type: 'array', items: { type: 'string' } },
            cohortDefinitions: { type: 'array', items: { type: 'object' } }
          }
        },
        governanceModel: {
          type: 'object',
          properties: {
            reviewFrequency: { type: 'string' },
            ownershipModel: { type: 'string' },
            changeManagementProcess: { type: 'string' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['metrics-dashboard', 'kpi-identification', 'product-analytics']
}));

export const instrumentationPlanningTask = defineTask('instrumentation-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Metrics Instrumentation Planning - ${args.productName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior Data Engineer and Product Analytics Specialist with expertise in event tracking and instrumentation',
      task: 'Create comprehensive instrumentation plan for collecting all required metrics and events',
      context: {
        productName: args.productName,
        kpis: args.kpis,
        northStarMetric: args.northStarMetric,
        dataSources: args.dataSources,
        existingMetrics: args.existingMetrics
      },
      instructions: [
        '1. Map each KPI to specific events, properties, and data points that need to be tracked',
        '2. Define event taxonomy and naming conventions (e.g., Object_Action pattern)',
        '3. Identify all user interactions, system events, and business events to track',
        '4. Define event properties (dimensions) and their data types for each event',
        '5. Create tracking specifications for web, mobile, backend, and third-party integrations',
        '6. Define user identification and session tracking strategy',
        '7. Plan for cross-platform tracking and identity resolution',
        '8. Identify existing instrumentation that can be reused',
        '9. Define gaps in current instrumentation and new tracking requirements',
        '10. Plan event volume estimates and sampling strategies if needed',
        '11. Define data retention policies for different event types',
        '12. Create implementation priority matrix based on KPI importance',
        '13. Estimate implementation effort for each tracking component',
        '14. Define validation and QA approach for instrumentation',
        '15. Plan for GDPR/privacy compliance in data collection'
      ],
      outputFormat: 'JSON object with detailed instrumentation specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['eventsToTrack', 'trackingPlan', 'implementationApproach', 'estimatedEffort'],
      properties: {
        eventsToTrack: {
          type: 'array',
          items: {
            type: 'object',
            required: ['eventName', 'eventDescription', 'triggerCondition', 'properties', 'relatedKpis'],
            properties: {
              eventId: { type: 'string' },
              eventName: { type: 'string' },
              eventDescription: { type: 'string' },
              category: { type: 'string', enum: ['user-interaction', 'system-event', 'business-event', 'lifecycle-event'] },
              triggerCondition: { type: 'string' },
              platform: { type: 'array', items: { type: 'string', enum: ['web', 'mobile-ios', 'mobile-android', 'backend', 'api'] } },
              properties: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    propertyName: { type: 'string' },
                    dataType: { type: 'string', enum: ['string', 'number', 'boolean', 'timestamp', 'array', 'object'] },
                    required: { type: 'boolean' },
                    description: { type: 'string' },
                    exampleValue: { type: 'string' },
                    validationRules: { type: 'array', items: { type: 'string' } }
                  }
                }
              },
              relatedKpis: { type: 'array', items: { type: 'string' } },
              estimatedVolume: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              implementationStatus: { type: 'string', enum: ['existing', 'needs-modification', 'new'] }
            }
          }
        },
        trackingPlan: {
          type: 'object',
          properties: {
            eventNamingConvention: { type: 'string' },
            propertyNamingConvention: { type: 'string' },
            userIdentificationStrategy: {
              type: 'object',
              properties: {
                anonymousId: { type: 'string' },
                userId: { type: 'string' },
                identityResolution: { type: 'string' },
                crossPlatformTracking: { type: 'string' }
              }
            },
            sessionDefinition: {
              type: 'object',
              properties: {
                sessionTimeout: { type: 'string' },
                sessionProperties: { type: 'array', items: { type: 'string' } }
              }
            },
            contextProperties: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  property: { type: 'string' },
                  source: { type: 'string', enum: ['automatic', 'custom'] },
                  description: { type: 'string' }
                }
              }
            }
          }
        },
        implementationApproach: {
          type: 'object',
          properties: {
            trackingLibraries: { type: 'array', items: { type: 'string' } },
            sdkVersions: { type: 'object' },
            serverSideTracking: { type: 'boolean' },
            clientSideTracking: { type: 'boolean' },
            gtmImplementation: { type: 'boolean' },
            cdpIntegration: { type: 'string' },
            queueingStrategy: { type: 'string' },
            offlineTracking: { type: 'boolean' }
          }
        },
        dataGovernance: {
          type: 'object',
          properties: {
            piiHandling: { type: 'string' },
            consentManagement: { type: 'string' },
            retentionPolicies: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  dataType: { type: 'string' },
                  retentionPeriod: { type: 'string' },
                  archivalStrategy: { type: 'string' }
                }
              }
            },
            complianceRequirements: { type: 'array', items: { type: 'string' } }
          }
        },
        validationStrategy: {
          type: 'object',
          properties: {
            validationTools: { type: 'array', items: { type: 'string' } },
            testingApproach: { type: 'string' },
            qaChecklist: { type: 'array', items: { type: 'string' } },
            productionMonitoring: { type: 'string' }
          }
        },
        estimatedEffort: {
          type: 'object',
          properties: {
            totalImplementationDays: { type: 'number' },
            byPlatform: {
              type: 'object',
              properties: {
                web: { type: 'number' },
                mobileIos: { type: 'number' },
                mobileAndroid: { type: 'number' },
                backend: { type: 'number' }
              }
            },
            skillsRequired: { type: 'array', items: { type: 'string' } },
            dependencies: { type: 'array', items: { type: 'string' } }
          }
        },
        migrationStrategy: {
          type: 'object',
          properties: {
            existingInstrumentationHandling: { type: 'string' },
            rolloutApproach: { type: 'string', enum: ['big-bang', 'phased', 'parallel-tracking'] },
            backfillRequirements: { type: 'string' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['metrics-dashboard', 'instrumentation', 'event-tracking']
}));

export const dashboardDesignTask = defineTask('dashboard-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Dashboard Design and UX Planning - ${args.productName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Visualization Expert and UX Designer specializing in dashboard design and information architecture',
      task: 'Design comprehensive dashboard layout with optimal visualizations and user experience',
      context: {
        productName: args.productName,
        dashboardType: args.dashboardType,
        kpis: args.kpis,
        northStarMetric: args.northStarMetric,
        stakeholders: args.stakeholders,
        refreshFrequency: args.refreshFrequency
      },
      instructions: [
        '1. Design information hierarchy - North Star Metric at top, primary KPIs below, supporting metrics in sections',
        '2. Select appropriate visualization types for each metric: line chart, bar chart, gauge, scorecard, table, heatmap, funnel, etc.',
        '3. Apply dashboard design best practices: F-pattern layout, progressive disclosure, 5-second rule',
        '4. Design for the dashboard type: Executive (high-level trends), Operational (actionable details), Team (collaborative), Customer-facing (simplified)',
        '5. Plan dashboard sections/modules: Overview, Acquisition, Engagement, Retention, Revenue, Health',
        '6. Design drill-down capabilities and interactivity patterns',
        '7. Plan filtering and segmentation controls (date range, segments, cohorts)',
        '8. Design comparison views: time-over-time, segment-to-segment, actual vs target',
        '9. Plan trend indicators, sparklines, and micro-visualizations',
        '10. Design color schemes: green for positive, red for negative, neutral for informational',
        '11. Plan responsive design for mobile/tablet viewing',
        '12. Design empty states and error states',
        '13. Plan annotation capabilities for key events and insights',
        '14. Create mockup or wireframe description in markdown',
        '15. Ensure accessibility (WCAG) and color-blind friendly design'
      ],
      outputFormat: 'JSON object with comprehensive dashboard design specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['layout', 'visualizations', 'interactivity', 'mockupMarkdown'],
      properties: {
        layout: {
          type: 'object',
          required: ['type', 'sections'],
          properties: {
            type: { type: 'string', enum: ['single-page', 'tabbed', 'multi-page', 'drill-down'] },
            gridSystem: { type: 'string' },
            responsiveBreakpoints: { type: 'array', items: { type: 'string' } },
            sections: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  sectionId: { type: 'string' },
                  sectionName: { type: 'string' },
                  sectionOrder: { type: 'number' },
                  sectionType: { type: 'string', enum: ['hero', 'primary', 'secondary', 'detail'] },
                  containedMetrics: { type: 'array', items: { type: 'string' } },
                  layoutPattern: { type: 'string' },
                  collapsible: { type: 'boolean' }
                }
              }
            },
            headerElements: {
              type: 'array',
              items: { type: 'string' }
            },
            footerElements: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        },
        visualizations: {
          type: 'array',
          items: {
            type: 'object',
            required: ['vizId', 'kpiId', 'visualizationType', 'section'],
            properties: {
              vizId: { type: 'string' },
              kpiId: { type: 'string' },
              kpiName: { type: 'string' },
              visualizationType: {
                type: 'string',
                enum: ['scorecard', 'line-chart', 'bar-chart', 'area-chart', 'pie-chart', 'gauge', 'table', 'heatmap', 'funnel', 'sankey', 'treemap', 'sparkline']
              },
              section: { type: 'string' },
              size: { type: 'string', enum: ['small', 'medium', 'large', 'full-width'] },
              position: { type: 'object', properties: { row: { type: 'number' }, column: { type: 'number' } } },
              configuration: {
                type: 'object',
                properties: {
                  timeRange: { type: 'string' },
                  comparisonEnabled: { type: 'boolean' },
                  comparisonType: { type: 'string', enum: ['previous-period', 'year-over-year', 'target'] },
                  trendlineEnabled: { type: 'boolean' },
                  goalLineEnabled: { type: 'boolean' },
                  annotations: { type: 'boolean' },
                  drillDownEnabled: { type: 'boolean' },
                  drillDownTarget: { type: 'string' }
                }
              },
              colorScheme: { type: 'string' },
              tooltipContent: { type: 'array', items: { type: 'string' } },
              contextualHelp: { type: 'string' }
            }
          }
        },
        interactivity: {
          type: 'object',
          properties: {
            filters: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  filterName: { type: 'string' },
                  filterType: { type: 'string', enum: ['date-range', 'dropdown', 'multi-select', 'search', 'slider'] },
                  defaultValue: { type: 'string' },
                  affectedVisualizations: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            drillDownPaths: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  fromViz: { type: 'string' },
                  toViz: { type: 'string' },
                  drillDownDimension: { type: 'string' }
                }
              }
            },
            crossFiltering: { type: 'boolean' },
            exportOptions: { type: 'array', items: { type: 'string', enum: ['pdf', 'csv', 'image', 'scheduled-email'] } },
            shareOptions: { type: 'array', items: { type: 'string', enum: ['link', 'embed', 'presentation-mode'] } }
          }
        },
        designSystem: {
          type: 'object',
          properties: {
            colorPalette: {
              type: 'object',
              properties: {
                primary: { type: 'string' },
                success: { type: 'string' },
                warning: { type: 'string' },
                danger: { type: 'string' },
                neutral: { type: 'array', items: { type: 'string' } }
              }
            },
            typography: {
              type: 'object',
              properties: {
                fontFamily: { type: 'string' },
                headingSizes: { type: 'object' },
                bodySize: { type: 'string' }
              }
            },
            spacing: { type: 'string' },
            borderRadius: { type: 'string' },
            shadows: { type: 'string' }
          }
        },
        accessibility: {
          type: 'object',
          properties: {
            wcagLevel: { type: 'string', enum: ['A', 'AA', 'AAA'] },
            colorBlindSafe: { type: 'boolean' },
            keyboardNavigation: { type: 'boolean' },
            screenReaderSupport: { type: 'boolean' },
            altTextStrategy: { type: 'string' }
          }
        },
        performanceTargets: {
          type: 'object',
          properties: {
            initialLoadTime: { type: 'string' },
            dataRefreshTime: { type: 'string' },
            interactionResponseTime: { type: 'string' }
          }
        },
        mockupMarkdown: {
          type: 'string',
          description: 'Dashboard mockup described in markdown format with ASCII layout'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['metrics-dashboard', 'dashboard-design', 'ux-design']
}));

export const dataPipelineSetupTask = defineTask('data-pipeline-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Data Pipeline Architecture - ${args.productName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior Data Engineer and Analytics Architect with expertise in ETL/ELT pipelines and data warehousing',
      task: 'Design comprehensive data pipeline architecture for metrics dashboard',
      context: {
        productName: args.productName,
        kpis: args.kpis,
        instrumentation: args.instrumentation,
        dataSources: args.dataSources,
        refreshFrequency: args.refreshFrequency,
        complianceRequirements: args.complianceRequirements
      },
      instructions: [
        '1. Design end-to-end data flow: ingestion → storage → transformation → aggregation → serving',
        '2. Identify all data sources: analytics platforms, databases, APIs, third-party services',
        '3. Define ingestion strategy: real-time streaming vs batch processing vs hybrid',
        '4. Design data storage architecture: raw data lake, curated data warehouse, metric store',
        '5. Plan transformation logic: data cleaning, enrichment, joining, aggregation',
        '6. Design metric calculation engine and computation strategy',
        '7. Plan pre-aggregation and materialized views for performance',
        '8. Define refresh strategy aligned with dashboard requirements',
        '9. Design caching layer for frequently accessed data',
        '10. Plan for data partitioning and retention policies',
        '11. Design data quality checks and validation gates',
        '12. Plan monitoring and observability for pipeline health',
        '13. Design error handling, retry logic, and dead letter queues',
        '14. Plan for scalability and cost optimization',
        '15. Document data lineage and dependencies between metrics'
      ],
      outputFormat: 'JSON object with detailed data pipeline architecture'
    },
    outputSchema: {
      type: 'object',
      required: ['architecture', 'dataSources', 'transformations', 'storageStrategy', 'refreshStrategy'],
      properties: {
        architecture: {
          type: 'object',
          properties: {
            pattern: { type: 'string', enum: ['ETL', 'ELT', 'streaming', 'lambda', 'kappa'] },
            components: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  component: { type: 'string' },
                  technology: { type: 'string' },
                  purpose: { type: 'string' },
                  dependencies: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            dataFlow: { type: 'string', description: 'High-level data flow description' }
          }
        },
        dataSources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sourceId: { type: 'string' },
              sourceName: { type: 'string' },
              sourceType: { type: 'string', enum: ['analytics-platform', 'database', 'api', 'data-warehouse', 'saas', 'file-storage'] },
              connectionMethod: { type: 'string', enum: ['jdbc', 'api', 'sdk', 'webhook', 'file-transfer'] },
              dataVolume: { type: 'string' },
              updateFrequency: { type: 'string' },
              metricsProvided: { type: 'array', items: { type: 'string' } },
              authenticationMethod: { type: 'string' },
              sla: { type: 'string' }
            }
          }
        },
        ingestionStrategy: {
          type: 'object',
          properties: {
            realtimeIngestion: {
              type: 'object',
              properties: {
                enabled: { type: 'boolean' },
                technology: { type: 'string' },
                sources: { type: 'array', items: { type: 'string' } },
                throughput: { type: 'string' }
              }
            },
            batchIngestion: {
              type: 'object',
              properties: {
                enabled: { type: 'boolean' },
                schedule: { type: 'string' },
                sources: { type: 'array', items: { type: 'string' } },
                batchSize: { type: 'string' }
              }
            },
            incrementalLoading: { type: 'boolean' },
            changeDataCapture: { type: 'boolean' }
          }
        },
        storageStrategy: {
          type: 'object',
          properties: {
            rawDataLayer: {
              type: 'object',
              properties: {
                technology: { type: 'string' },
                format: { type: 'string', enum: ['parquet', 'avro', 'json', 'csv'] },
                partitioningStrategy: { type: 'string' },
                retentionPeriod: { type: 'string' }
              }
            },
            curatedDataLayer: {
              type: 'object',
              properties: {
                technology: { type: 'string' },
                schema: { type: 'string', enum: ['star', 'snowflake', 'denormalized', 'dimensional'] },
                updateStrategy: { type: 'string', enum: ['append', 'merge', 'overwrite'] }
              }
            },
            metricsLayer: {
              type: 'object',
              properties: {
                technology: { type: 'string' },
                aggregationLevel: { type: 'array', items: { type: 'string' } },
                precomputation: { type: 'boolean' }
              }
            }
          }
        },
        transformations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              transformationId: { type: 'string' },
              transformationName: { type: 'string' },
              purpose: { type: 'string' },
              inputTables: { type: 'array', items: { type: 'string' } },
              outputTable: { type: 'string' },
              transformationLogic: { type: 'string' },
              schedule: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } },
              estimatedRuntime: { type: 'string' }
            }
          }
        },
        metricCalculations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              kpiId: { type: 'string' },
              kpiName: { type: 'string' },
              calculationQuery: { type: 'string' },
              sourceTables: { type: 'array', items: { type: 'string' } },
              calculationFrequency: { type: 'string' },
              aggregationDimensions: { type: 'array', items: { type: 'string' } },
              calculationComplexity: { type: 'string', enum: ['simple', 'moderate', 'complex'] }
            }
          }
        },
        refreshStrategy: {
          type: 'object',
          properties: {
            dashboardRefreshMode: { type: 'string', enum: ['real-time', 'scheduled', 'on-demand', 'hybrid'] },
            scheduledRefreshes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  frequency: { type: 'string' },
                  time: { type: 'string' },
                  scope: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            incrementalRefresh: { type: 'boolean' },
            cacheStrategy: {
              type: 'object',
              properties: {
                enabled: { type: 'boolean' },
                cacheTtl: { type: 'string' },
                cachedLayers: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        },
        performanceOptimization: {
          type: 'object',
          properties: {
            indexingStrategy: { type: 'array', items: { type: 'string' } },
            partitioning: { type: 'string' },
            materializedViews: { type: 'array', items: { type: 'string' } },
            queryOptimization: { type: 'array', items: { type: 'string' } },
            compressionEnabled: { type: 'boolean' }
          }
        },
        monitoring: {
          type: 'object',
          properties: {
            pipelineHealthMetrics: { type: 'array', items: { type: 'string' } },
            alertingStrategy: { type: 'string' },
            loggingApproach: { type: 'string' },
            slaMonitoring: { type: 'boolean' }
          }
        },
        dataLineage: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              kpiId: { type: 'string' },
              sourceData: { type: 'array', items: { type: 'string' } },
              transformations: { type: 'array', items: { type: 'string' } },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['metrics-dashboard', 'data-pipeline', 'data-engineering']
}));

export const dataQualityFrameworkTask = defineTask('data-quality-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Data Quality and Validation Framework - ${args.productName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Quality Engineer with expertise in data validation, testing, and observability',
      task: 'Design comprehensive data quality and validation framework for metrics reliability',
      context: {
        productName: args.productName,
        kpis: args.kpis,
        dataPipeline: args.dataPipeline,
        instrumentation: args.instrumentation
      },
      instructions: [
        '1. Define data quality dimensions: Accuracy, Completeness, Consistency, Timeliness, Validity, Uniqueness',
        '2. Create validation rules for each metric and data source',
        '3. Design schema validation for incoming data',
        '4. Plan data profiling and statistical anomaly detection',
        '5. Define acceptable data quality thresholds and SLAs',
        '6. Design reconciliation processes between different data sources',
        '7. Plan data quality monitoring and alerting',
        '8. Create data quality scorecard and reporting',
        '9. Design testing framework for data transformations',
        '10. Plan for handling missing, null, or invalid data',
        '11. Define data quality incident response process',
        '12. Create data quality documentation and runbooks',
        '13. Plan for data quality regression testing',
        '14. Design data audit trails and change tracking',
        '15. Define data quality ownership and accountability'
      ],
      outputFormat: 'JSON object with comprehensive data quality framework'
    },
    outputSchema: {
      type: 'object',
      required: ['validationRules', 'qualityMonitoring', 'reconciliationProcess'],
      properties: {
        validationRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              ruleId: { type: 'string' },
              ruleName: { type: 'string' },
              dataElement: { type: 'string' },
              qualityDimension: { type: 'string', enum: ['accuracy', 'completeness', 'consistency', 'timeliness', 'validity', 'uniqueness'] },
              validationType: { type: 'string', enum: ['schema', 'range', 'format', 'referential-integrity', 'statistical', 'business-logic'] },
              validationLogic: { type: 'string' },
              threshold: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              action: { type: 'string', enum: ['block', 'alert', 'log', 'quarantine'] }
            }
          }
        },
        qualityChecks: {
          type: 'object',
          properties: {
            schemaValidation: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  table: { type: 'string' },
                  expectedSchema: { type: 'object' },
                  checkFrequency: { type: 'string' }
                }
              }
            },
            rangeChecks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  metric: { type: 'string' },
                  expectedRange: { type: 'string' },
                  tolerance: { type: 'string' }
                }
              }
            },
            consistencyChecks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  checkName: { type: 'string' },
                  description: { type: 'string' },
                  elements: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            freshnessChecks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  dataSource: { type: 'string' },
                  maxStaleness: { type: 'string' },
                  checkFrequency: { type: 'string' }
                }
              }
            }
          }
        },
        qualityMonitoring: {
          type: 'object',
          properties: {
            monitoringDashboard: { type: 'string' },
            qualityMetrics: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  metricName: { type: 'string' },
                  definition: { type: 'string' },
                  target: { type: 'string' }
                }
              }
            },
            alertRules: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  trigger: { type: 'string' },
                  severity: { type: 'string' },
                  notificationChannels: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            reportingCadence: { type: 'string' }
          }
        },
        reconciliationProcess: {
          type: 'object',
          properties: {
            reconciliationPoints: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  metric: { type: 'string' },
                  primarySource: { type: 'string' },
                  secondarySource: { type: 'string' },
                  reconciliationLogic: { type: 'string' },
                  acceptableVariance: { type: 'string' },
                  frequency: { type: 'string' }
                }
              }
            },
            discrepancyResolution: { type: 'string' }
          }
        },
        testingFramework: {
          type: 'object',
          properties: {
            unitTests: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  testName: { type: 'string' },
                  scope: { type: 'string' },
                  testCases: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            integrationTests: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  testName: { type: 'string' },
                  endToEndScenario: { type: 'string' }
                }
              }
            },
            regressionTests: { type: 'string' }
          }
        },
        incidentResponse: {
          type: 'object',
          properties: {
            severityLevels: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  level: { type: 'string' },
                  definition: { type: 'string' },
                  responseTime: { type: 'string' },
                  escalationPath: { type: 'string' }
                }
              }
            },
            playbooks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  scenario: { type: 'string' },
                  steps: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        dataQualitySLA: {
          type: 'object',
          properties: {
            availabilityTarget: { type: 'string' },
            accuracyTarget: { type: 'string' },
            freshnessTarget: { type: 'string' },
            measurementMethod: { type: 'string' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['metrics-dashboard', 'data-quality', 'validation']
}));

export const alertConfigurationTask = defineTask('alert-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Alert and Anomaly Detection Configuration - ${args.productName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SRE and Product Operations Specialist with expertise in alerting, monitoring, and anomaly detection',
      task: 'Configure comprehensive alerting system for proactive monitoring of product metrics',
      context: {
        productName: args.productName,
        kpis: args.kpis,
        northStarMetric: args.northStarMetric,
        alertThresholds: args.alertThresholds,
        stakeholders: args.stakeholders,
        dashboardType: args.dashboardType
      },
      instructions: [
        '1. Define alert rules for each critical and high-priority KPI',
        '2. Set threshold-based alerts: absolute thresholds, percentage change, rate of change',
        '3. Design anomaly detection using statistical methods (z-score, IQR, forecasting)',
        '4. Configure multi-condition alerts (e.g., metric A drops AND metric B rises)',
        '5. Define alert severity levels: Critical, High, Medium, Low, Info',
        '6. Map alerts to stakeholder groups and notification channels',
        '7. Configure alert routing: Slack, Email, PagerDuty, Teams, SMS',
        '8. Design alert message templates with context and actionability',
        '9. Plan alert suppression and deduplication strategies',
        '10. Configure alert escalation policies for unacknowledged alerts',
        '11. Design on-call rotation and coverage for critical alerts',
        '12. Plan alert testing and validation process',
        '13. Create alert documentation and runbooks',
        '14. Configure alert history and audit trail',
        '15. Design alert fatigue prevention: meaningful alerts, proper thresholds, aggregation'
      ],
      outputFormat: 'JSON object with comprehensive alert configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['alerts', 'notificationChannels', 'anomalyDetection'],
      properties: {
        alerts: {
          type: 'array',
          items: {
            type: 'object',
            required: ['alertId', 'alertName', 'kpiId', 'condition', 'severity'],
            properties: {
              alertId: { type: 'string' },
              alertName: { type: 'string' },
              kpiId: { type: 'string' },
              kpiName: { type: 'string' },
              alertType: { type: 'string', enum: ['threshold', 'anomaly', 'trend', 'multi-condition', 'missing-data'] },
              condition: { type: 'string' },
              threshold: { type: 'string' },
              evaluationWindow: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'info'] },
              notificationChannels: { type: 'array', items: { type: 'string' } },
              recipients: { type: 'array', items: { type: 'string' } },
              messageTemplate: { type: 'string' },
              actionableSteps: { type: 'array', items: { type: 'string' } },
              runbookLink: { type: 'string' },
              autoResolve: { type: 'boolean' },
              suppressionRules: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        anomalyDetection: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            algorithm: { type: 'string', enum: ['statistical', 'ml-based', 'rule-based', 'hybrid'] },
            sensitivity: { type: 'string', enum: ['high', 'medium', 'low'] },
            learningPeriod: { type: 'string' },
            monitoredMetrics: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  kpiId: { type: 'string' },
                  detectionMethod: { type: 'string' },
                  baselineWindow: { type: 'string' },
                  alertOnAnomaly: { type: 'boolean' }
                }
              }
            }
          }
        },
        notificationChannels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              channelName: { type: 'string' },
              channelType: { type: 'string', enum: ['slack', 'email', 'pagerduty', 'teams', 'sms', 'webhook'] },
              configuration: { type: 'object' },
              severityFilter: { type: 'array', items: { type: 'string' } },
              timeBasedRouting: {
                type: 'object',
                properties: {
                  businessHours: { type: 'object' },
                  afterHours: { type: 'object' }
                }
              }
            }
          }
        },
        escalationPolicies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              policyName: { type: 'string' },
              applicableAlerts: { type: 'array', items: { type: 'string' } },
              escalationLevels: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    level: { type: 'number' },
                    delayMinutes: { type: 'number' },
                    recipients: { type: 'array', items: { type: 'string' } },
                    notificationMethod: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        onCallSchedule: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            rotationType: { type: 'string', enum: ['weekly', 'bi-weekly', 'custom'] },
            coverage: { type: 'string', enum: ['24x7', 'business-hours', 'custom'] },
            schedule: { type: 'array', items: { type: 'object' } }
          }
        },
        alertManagement: {
          type: 'object',
          properties: {
            acknowledgmentRequired: { type: 'boolean' },
            autoAcknowledgmentTimeout: { type: 'string' },
            suppressionWindows: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  reason: { type: 'string' },
                  startTime: { type: 'string' },
                  endTime: { type: 'string' },
                  affectedAlerts: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            maintenanceMode: { type: 'object' }
          }
        },
        intelligentAlerting: {
          type: 'object',
          properties: {
            alertGrouping: { type: 'boolean' },
            dynamicThresholds: { type: 'boolean' },
            contextEnrichment: { type: 'boolean' },
            impactAnalysis: { type: 'boolean' }
          }
        },
        alertPerformance: {
          type: 'object',
          properties: {
            metricsTracked: { type: 'array', items: { type: 'string' } },
            targetMTTD: { type: 'string', description: 'Mean Time To Detect' },
            targetMTTR: { type: 'string', description: 'Mean Time To Resolve' },
            falsePositiveRate: { type: 'string' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['metrics-dashboard', 'alerting', 'monitoring']
}));

export const implementationSpecTask = defineTask('implementation-spec', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Dashboard Implementation Specification - ${args.productName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Full-Stack Engineer and Solutions Architect with expertise in dashboard implementation and BI tools',
      task: 'Create detailed implementation specification with technical architecture and deployment plan',
      context: {
        productName: args.productName,
        dashboardDesign: args.dashboardDesign,
        dataPipeline: args.dataPipeline,
        instrumentation: args.instrumentation,
        dataQuality: args.dataQuality,
        alerts: args.alerts,
        refreshFrequency: args.refreshFrequency
      },
      instructions: [
        '1. Select appropriate technology stack: dashboard platform (Tableau, Looker, Metabase, custom), backend, database',
        '2. Define frontend implementation approach: embedded, standalone, or integrated',
        '3. Design API layer for dashboard data serving',
        '4. Plan component architecture and reusability',
        '5. Define caching strategy for performance optimization',
        '6. Plan authentication and authorization integration',
        '7. Design responsive and mobile implementation approach',
        '8. Define deployment architecture: cloud provider, regions, scalability',
        '9. Break down implementation into phases with deliverables',
        '10. Estimate implementation effort by component',
        '11. Identify technical dependencies and prerequisites',
        '12. Plan for A/B testing or gradual rollout',
        '13. Define performance benchmarks and monitoring',
        '14. Create implementation readiness checklist',
        '15. Calculate implementation readiness score'
      ],
      outputFormat: 'JSON object with detailed implementation specification'
    },
    outputSchema: {
      type: 'object',
      required: ['technicalStack', 'implementationPhases', 'estimatedImplementationTime', 'readinessScore'],
      properties: {
        technicalStack: {
          type: 'object',
          properties: {
            dashboardPlatform: { type: 'string' },
            frontendFramework: { type: 'string' },
            backendFramework: { type: 'string' },
            database: { type: 'string' },
            cachingLayer: { type: 'string' },
            messagingQueue: { type: 'string' },
            cdnProvider: { type: 'string' },
            monitoringTools: { type: 'array', items: { type: 'string' } }
          }
        },
        architecture: {
          type: 'object',
          properties: {
            deploymentModel: { type: 'string', enum: ['cloud', 'on-premise', 'hybrid'] },
            cloudProvider: { type: 'string' },
            scalingStrategy: { type: 'string', enum: ['vertical', 'horizontal', 'auto-scaling'] },
            highAvailability: { type: 'boolean' },
            disasterRecovery: { type: 'string' }
          }
        },
        apiDesign: {
          type: 'object',
          properties: {
            apiStyle: { type: 'string', enum: ['REST', 'GraphQL', 'gRPC'] },
            endpoints: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  endpoint: { type: 'string' },
                  method: { type: 'string' },
                  purpose: { type: 'string' },
                  cacheStrategy: { type: 'string' }
                }
              }
            },
            authentication: { type: 'string' },
            rateLimiting: { type: 'object' }
          }
        },
        implementationPhases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phaseNumber: { type: 'number' },
              phaseName: { type: 'string' },
              objectives: { type: 'array', items: { type: 'string' } },
              deliverables: { type: 'array', items: { type: 'string' } },
              duration: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } },
              successCriteria: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        implementationTasks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              taskId: { type: 'string' },
              taskName: { type: 'string' },
              phase: { type: 'number' },
              description: { type: 'string' },
              estimatedEffort: { type: 'string' },
              skillsRequired: { type: 'array', items: { type: 'string' } },
              dependencies: { type: 'array', items: { type: 'string' } },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        estimatedImplementationTime: { type: 'string' },
        resourceRequirements: {
          type: 'object',
          properties: {
            teamComposition: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  role: { type: 'string' },
                  count: { type: 'number' },
                  allocation: { type: 'string' }
                }
              }
            },
            infrastructure: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  resource: { type: 'string' },
                  specification: { type: 'string' },
                  estimatedCost: { type: 'string' }
                }
              }
            }
          }
        },
        dependencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dependency: { type: 'string' },
              type: { type: 'string', enum: ['technical', 'organizational', 'external'] },
              status: { type: 'string', enum: ['ready', 'in-progress', 'blocked'] },
              mitigationPlan: { type: 'string' }
            }
          }
        },
        performanceBenchmarks: {
          type: 'object',
          properties: {
            loadTimeTarget: { type: 'string' },
            queryPerformanceTarget: { type: 'string' },
            concurrentUsersSupported: { type: 'number' },
            dataFreshnessTarget: { type: 'string' }
          }
        },
        securityImplementation: {
          type: 'object',
          properties: {
            authenticationMethod: { type: 'string' },
            authorizationModel: { type: 'string' },
            dataEncryption: { type: 'object' },
            auditLogging: { type: 'boolean' },
            securityTesting: { type: 'array', items: { type: 'string' } }
          }
        },
        readinessChecklist: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              item: { type: 'string' },
              status: { type: 'string', enum: ['complete', 'in-progress', 'not-started'] },
              weight: { type: 'number' }
            }
          }
        },
        readinessScore: {
          type: 'number',
          minimum: 0,
          maximum: 100,
          description: 'Overall implementation readiness score'
        },
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] },
              probability: { type: 'string', enum: ['high', 'medium', 'low'] },
              mitigation: { type: 'string' }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['metrics-dashboard', 'implementation', 'technical-architecture']
}));

export const testingPlanTask = defineTask('testing-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Testing and Validation Plan - ${args.productName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'QA Engineer and Test Automation Specialist with expertise in dashboard testing and validation',
      task: 'Create comprehensive testing plan covering functional, data accuracy, performance, and user acceptance testing',
      context: {
        productName: args.productName,
        kpis: args.kpis,
        dashboard: args.dashboard,
        dataPipeline: args.dataPipeline,
        alerts: args.alerts,
        stakeholders: args.stakeholders
      },
      instructions: [
        '1. Define functional testing scenarios for all dashboard features',
        '2. Create data accuracy validation test cases for each KPI',
        '3. Plan performance testing: load testing, stress testing, scalability testing',
        '4. Design cross-browser and cross-device compatibility testing',
        '5. Plan accessibility testing (WCAG compliance)',
        '6. Define security testing scenarios',
        '7. Create user acceptance testing (UAT) plan with stakeholders',
        '8. Design alert testing scenarios',
        '9. Plan data pipeline integration testing',
        '10. Define regression testing strategy',
        '11. Create test data and fixtures',
        '12. Plan automated vs manual testing approach',
        '13. Define acceptance criteria and success metrics',
        '14. Create testing timeline and resource allocation',
        '15. Design feedback collection and iteration process'
      ],
      outputFormat: 'JSON object with comprehensive testing plan'
    },
    outputSchema: {
      type: 'object',
      required: ['testScenarios', 'validationCriteria', 'uatPlan'],
      properties: {
        testScenarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenarioId: { type: 'string' },
              scenarioName: { type: 'string' },
              category: { type: 'string', enum: ['functional', 'data-accuracy', 'performance', 'security', 'accessibility', 'integration'] },
              description: { type: 'string' },
              testCases: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    testId: { type: 'string' },
                    testName: { type: 'string' },
                    steps: { type: 'array', items: { type: 'string' } },
                    expectedResult: { type: 'string' },
                    priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
                  }
                }
              },
              testingApproach: { type: 'string', enum: ['manual', 'automated', 'hybrid'] },
              estimatedEffort: { type: 'string' }
            }
          }
        },
        dataValidation: {
          type: 'object',
          properties: {
            validationChecks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  kpiId: { type: 'string' },
                  kpiName: { type: 'string' },
                  validationMethod: { type: 'string' },
                  expectedResult: { type: 'string' },
                  acceptableVariance: { type: 'string' },
                  sourceOfTruth: { type: 'string' }
                }
              }
            },
            reconciliationTests: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  metric: { type: 'string' },
                  dashboardValue: { type: 'string' },
                  sourceSystemValue: { type: 'string' },
                  variance: { type: 'string' },
                  acceptable: { type: 'boolean' }
                }
              }
            }
          }
        },
        performanceTesting: {
          type: 'object',
          properties: {
            loadTesting: {
              type: 'object',
              properties: {
                concurrentUsers: { type: 'number' },
                duration: { type: 'string' },
                acceptableResponseTime: { type: 'string' }
              }
            },
            stressTesting: {
              type: 'object',
              properties: {
                maxLoadScenario: { type: 'string' },
                breakingPoint: { type: 'string' }
              }
            },
            benchmarks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  metric: { type: 'string' },
                  target: { type: 'string' },
                  testMethod: { type: 'string' }
                }
              }
            }
          }
        },
        uatPlan: {
          type: 'object',
          properties: {
            participants: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  stakeholder: { type: 'string' },
                  role: { type: 'string' },
                  focus: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            uatScenarios: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  scenario: { type: 'string' },
                  objective: { type: 'string' },
                  tasks: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            duration: { type: 'string' },
            feedbackMechanism: { type: 'string' },
            successCriteria: { type: 'array', items: { type: 'string' } }
          }
        },
        validationCriteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              measurement: { type: 'string' },
              target: { type: 'string' },
              critical: { type: 'boolean' }
            }
          }
        },
        testAutomation: {
          type: 'object',
          properties: {
            automationFramework: { type: 'string' },
            automatedTestCount: { type: 'number' },
            manualTestCount: { type: 'number' },
            cicdIntegration: { type: 'boolean' }
          }
        },
        testEnvironment: {
          type: 'object',
          properties: {
            environments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  purpose: { type: 'string' },
                  dataSource: { type: 'string' }
                }
              }
            }
          }
        },
        testSchedule: {
          type: 'object',
          properties: {
            phases: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  phase: { type: 'string' },
                  duration: { type: 'string' },
                  activities: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['metrics-dashboard', 'testing', 'qa']
}));

export const securityConfigurationTask = defineTask('security-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Access Control and Security Configuration - ${args.productName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Engineer with expertise in access control, data privacy, and compliance',
      task: 'Design comprehensive security and access control framework for dashboard',
      context: {
        productName: args.productName,
        dashboardType: args.dashboardType,
        stakeholders: args.stakeholders,
        dataSources: args.dataSources,
        complianceRequirements: args.complianceRequirements,
        kpis: args.kpis
      },
      instructions: [
        '1. Design role-based access control (RBAC) model for dashboard',
        '2. Define user roles and permissions matrix',
        '3. Plan row-level security (RLS) for data segmentation',
        '4. Design data masking and PII protection strategies',
        '5. Configure authentication methods: SSO, OAuth, SAML',
        '6. Plan session management and timeout policies',
        '7. Design audit logging for all dashboard access and actions',
        '8. Plan data encryption: at rest and in transit',
        '9. Configure compliance controls: GDPR, HIPAA, SOC2',
        '10. Design data retention and deletion policies',
        '11. Plan security monitoring and threat detection',
        '12. Define vulnerability management process',
        '13. Create security testing requirements',
        '14. Plan incident response for security breaches',
        '15. Document security policies and procedures'
      ],
      outputFormat: 'JSON object with comprehensive security configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['accessControl', 'dataPrivacy', 'complianceControls'],
      properties: {
        accessControl: {
          type: 'object',
          properties: {
            authenticationMethod: { type: 'string', enum: ['sso', 'oauth', 'saml', 'basic', 'multi-factor'] },
            authorizationModel: { type: 'string', enum: ['rbac', 'abac', 'hybrid'] },
            roles: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  roleName: { type: 'string' },
                  description: { type: 'string' },
                  permissions: { type: 'array', items: { type: 'string' } },
                  dataAccess: { type: 'string' },
                  restrictedMetrics: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            rowLevelSecurity: {
              type: 'object',
              properties: {
                enabled: { type: 'boolean' },
                filteringDimensions: { type: 'array', items: { type: 'string' } },
                implementationMethod: { type: 'string' }
              }
            },
            sessionManagement: {
              type: 'object',
              properties: {
                sessionTimeout: { type: 'string' },
                idleTimeout: { type: 'string' },
                concurrentSessions: { type: 'number' }
              }
            }
          }
        },
        dataPrivacy: {
          type: 'object',
          properties: {
            piiProtection: {
              type: 'object',
              properties: {
                piiFields: { type: 'array', items: { type: 'string' } },
                maskingStrategy: { type: 'string', enum: ['redaction', 'hashing', 'tokenization', 'anonymization'] },
                accessControls: { type: 'string' }
              }
            },
            dataEncryption: {
              type: 'object',
              properties: {
                atRest: {
                  type: 'object',
                  properties: {
                    enabled: { type: 'boolean' },
                    algorithm: { type: 'string' },
                    keyManagement: { type: 'string' }
                  }
                },
                inTransit: {
                  type: 'object',
                  properties: {
                    protocol: { type: 'string' },
                    tlsVersion: { type: 'string' }
                  }
                }
              }
            },
            dataRetention: {
              type: 'object',
              properties: {
                policy: { type: 'string' },
                retentionPeriods: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      dataType: { type: 'string' },
                      period: { type: 'string' },
                      deletionMethod: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        complianceControls: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              regulation: { type: 'string', enum: ['GDPR', 'HIPAA', 'SOC2', 'CCPA', 'PCI-DSS'] },
              requirements: { type: 'array', items: { type: 'string' } },
              controls: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    control: { type: 'string' },
                    implementation: { type: 'string' },
                    verificationMethod: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        auditLogging: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            loggedEvents: { type: 'array', items: { type: 'string' } },
            logRetention: { type: 'string' },
            logStorage: { type: 'string' },
            logAnalysis: { type: 'string' }
          }
        },
        securityMonitoring: {
          type: 'object',
          properties: {
            threatDetection: { type: 'boolean' },
            anomalyDetection: { type: 'boolean' },
            alertingRules: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  rule: { type: 'string' },
                  severity: { type: 'string' },
                  response: { type: 'string' }
                }
              }
            }
          }
        },
        vulnerabilityManagement: {
          type: 'object',
          properties: {
            scanningFrequency: { type: 'string' },
            patchingPolicy: { type: 'string' },
            dependencyManagement: { type: 'string' }
          }
        },
        incidentResponse: {
          type: 'object',
          properties: {
            playbooks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  incident: { type: 'string' },
                  steps: { type: 'array', items: { type: 'string' } },
                  escalation: { type: 'string' }
                }
              }
            },
            notificationChannels: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['metrics-dashboard', 'security', 'access-control']
}));

export const documentationTask = defineTask('documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Documentation and Enablement Materials - ${args.productName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Writer and Enablement Specialist with expertise in dashboard documentation',
      task: 'Create comprehensive documentation package for dashboard implementation and usage',
      context: {
        productName: args.productName,
        dashboardType: args.dashboardType,
        kpiFramework: args.kpiFramework,
        dashboardDesign: args.dashboardDesign,
        implementationSpec: args.implementationSpec,
        dataPipeline: args.dataPipeline,
        alerts: args.alerts,
        security: args.security,
        stakeholders: args.stakeholders
      },
      instructions: [
        '1. Create implementation guide for engineering team',
        '2. Write user guide for dashboard consumers',
        '3. Document KPI definitions and business logic',
        '4. Create data dictionary and schema documentation',
        '5. Write API documentation for dashboard data access',
        '6. Create troubleshooting guide and FAQs',
        '7. Document alert runbooks and response procedures',
        '8. Write onboarding guide for new dashboard users',
        '9. Create training materials and video tutorials (outline)',
        '10. Document maintenance procedures and schedules',
        '11. Create architecture diagrams and data flow documentation',
        '12. Write security and compliance documentation',
        '13. Create change management documentation',
        '14. Document best practices for dashboard usage',
        '15. Create feedback and iteration process documentation'
      ],
      outputFormat: 'JSON object with documentation package in markdown format'
    },
    outputSchema: {
      type: 'object',
      required: ['implementationGuide', 'userGuide', 'kpiDefinitions', 'troubleshootingGuide'],
      properties: {
        implementationGuide: {
          type: 'string',
          description: 'Complete implementation guide in markdown format'
        },
        userGuide: {
          type: 'string',
          description: 'End-user guide in markdown format'
        },
        kpiDefinitions: {
          type: 'string',
          description: 'KPI definitions and business logic documentation in markdown'
        },
        dataDictionary: {
          type: 'string',
          description: 'Data dictionary and schema documentation in markdown'
        },
        apiDocumentation: {
          type: 'string',
          description: 'API documentation in markdown format'
        },
        troubleshootingGuide: {
          type: 'string',
          description: 'Troubleshooting guide and FAQs in markdown'
        },
        alertRunbooks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alertName: { type: 'string' },
              runbook: { type: 'string', description: 'Runbook in markdown format' }
            }
          }
        },
        onboardingGuide: {
          type: 'string',
          description: 'User onboarding guide in markdown'
        },
        trainingMaterials: {
          type: 'object',
          properties: {
            overview: { type: 'string' },
            modules: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  moduleName: { type: 'string' },
                  objectives: { type: 'array', items: { type: 'string' } },
                  content: { type: 'string' },
                  duration: { type: 'string' }
                }
              }
            }
          }
        },
        maintenanceDocumentation: {
          type: 'string',
          description: 'Maintenance procedures in markdown'
        },
        architectureDiagrams: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              diagramName: { type: 'string' },
              description: { type: 'string' },
              asciiDiagram: { type: 'string' }
            }
          }
        },
        bestPractices: {
          type: 'string',
          description: 'Best practices guide in markdown'
        },
        changeManagement: {
          type: 'string',
          description: 'Change management process documentation in markdown'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['metrics-dashboard', 'documentation', 'enablement']
}));

export const rolloutPlanTask = defineTask('rollout-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Rollout and Adoption Plan - ${args.productName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Change Management Specialist and Product Operations Lead with expertise in rollout planning',
      task: 'Create comprehensive rollout and adoption plan for dashboard deployment',
      context: {
        productName: args.productName,
        dashboardType: args.dashboardType,
        stakeholders: args.stakeholders,
        implementationSpec: args.implementationSpec,
        documentation: args.documentation,
        testingPlan: args.testingPlan
      },
      instructions: [
        '1. Design phased rollout strategy: pilot, beta, general availability',
        '2. Identify pilot user groups and success criteria',
        '3. Plan communication and announcement strategy',
        '4. Create stakeholder enablement and training plan',
        '5. Design feedback collection mechanisms',
        '6. Plan adoption tracking metrics and monitoring',
        '7. Create support model: office hours, help desk, champions',
        '8. Design iteration and improvement process based on feedback',
        '9. Plan for change management and organizational readiness',
        '10. Create success celebration and milestone recognition plan',
        '11. Define go/no-go criteria for each rollout phase',
        '12. Plan rollback procedures if needed',
        '13. Create timeline with key milestones',
        '14. Design adoption acceleration initiatives',
        '15. Define long-term sustainability and governance model'
      ],
      outputFormat: 'JSON object with comprehensive rollout plan'
    },
    outputSchema: {
      type: 'object',
      required: ['rolloutPhases', 'timeline', 'successCriteria', 'adoptionMetrics'],
      properties: {
        rolloutPhases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phaseNumber: { type: 'number' },
              phaseName: { type: 'string', enum: ['pilot', 'beta', 'limited-release', 'general-availability'] },
              audience: { type: 'array', items: { type: 'string' } },
              audienceSize: { type: 'string' },
              duration: { type: 'string' },
              objectives: { type: 'array', items: { type: 'string' } },
              activities: { type: 'array', items: { type: 'string' } },
              successCriteria: { type: 'array', items: { type: 'string' } },
              goNoGoCriteria: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        timeline: {
          type: 'object',
          properties: {
            startDate: { type: 'string' },
            milestones: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  milestone: { type: 'string' },
                  targetDate: { type: 'string' },
                  deliverables: { type: 'array', items: { type: 'string' } },
                  owner: { type: 'string' }
                }
              }
            }
          }
        },
        communicationPlan: {
          type: 'object',
          properties: {
            announcements: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  timing: { type: 'string' },
                  audience: { type: 'string' },
                  channel: { type: 'string' },
                  message: { type: 'string' }
                }
              }
            },
            ongoingCommunication: { type: 'string' }
          }
        },
        trainingAndEnablement: {
          type: 'object',
          properties: {
            trainingSessions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  sessionName: { type: 'string' },
                  audience: { type: 'string' },
                  format: { type: 'string', enum: ['live', 'recorded', 'documentation', 'hands-on'] },
                  duration: { type: 'string' },
                  schedule: { type: 'string' }
                }
              }
            },
            championProgram: {
              type: 'object',
              properties: {
                enabled: { type: 'boolean' },
                champions: { type: 'array', items: { type: 'string' } },
                responsibilities: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        },
        supportModel: {
          type: 'object',
          properties: {
            supportChannels: { type: 'array', items: { type: 'string' } },
            officeHours: { type: 'string' },
            escalationPath: { type: 'string' },
            faqLocation: { type: 'string' }
          }
        },
        feedbackMechanisms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              mechanism: { type: 'string' },
              frequency: { type: 'string' },
              audience: { type: 'string' },
              actionProcess: { type: 'string' }
            }
          }
        },
        adoptionMetrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              target: { type: 'string' },
              measurementMethod: { type: 'string' },
              trackingFrequency: { type: 'string' }
            }
          }
        },
        successCriteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              measurement: { type: 'string' },
              target: { type: 'string' },
              timeframe: { type: 'string' }
            }
          }
        },
        changeManagement: {
          type: 'object',
          properties: {
            organizationalReadiness: { type: 'string' },
            impactAssessment: { type: 'string' },
            mitigationStrategies: { type: 'array', items: { type: 'string' } }
          }
        },
        rollbackPlan: {
          type: 'object',
          properties: {
            triggers: { type: 'array', items: { type: 'string' } },
            procedure: { type: 'string' },
            communicationPlan: { type: 'string' }
          }
        },
        governanceModel: {
          type: 'object',
          properties: {
            reviewFrequency: { type: 'string' },
            stakeholderForum: { type: 'string' },
            decisionMakingProcess: { type: 'string' },
            continuousImprovement: { type: 'string' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['metrics-dashboard', 'rollout', 'adoption']
}));
