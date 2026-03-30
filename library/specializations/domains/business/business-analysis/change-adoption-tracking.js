/**
 * @process ba-change-adoption-tracking
 * @description Comprehensive change adoption tracking process measuring adoption, utilization,
 * and proficiency metrics to ensure sustainable change implementation and benefits realization.
 * @inputs {
 *   changeContext: { initiative: string, scope: string, objectives: object[] },
 *   adoptionTargets: { metrics: object[], thresholds: object },
 *   stakeholderGroups: object[],
 *   timeline: { phases: object[], milestones: object[] },
 *   dataSource: { systems: string[], surveys: object[], observations: object[] }
 * }
 * @outputs {
 *   adoptionDashboard: object,
 *   adoptionMetrics: object,
 *   utilizationAnalysis: object,
 *   proficiencyAssessment: object,
 *   interventionRecommendations: object[],
 *   sustainmentPlan: object
 * }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// Task definitions
export const adoptionFrameworkTask = defineTask('adoption-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish Adoption Measurement Framework',
  agent: {
    name: 'adoption-framework-designer',
    prompt: {
      role: 'Change Adoption Measurement Specialist',
      task: 'Establish comprehensive adoption measurement framework with metrics and targets',
      context: args,
      instructions: [
        'Define adoption success criteria',
        'Establish adoption metrics (AUP model)',
        'Define measurement methodology',
        'Set baseline measurements',
        'Define targets by stakeholder group',
        'Create adoption maturity model',
        'Define data collection approach',
        'Create measurement schedule'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        adoptionFramework: {
          type: 'object',
          properties: {
            successCriteria: { type: 'array', items: { type: 'object' } },
            adoptionMetrics: {
              type: 'object',
              properties: {
                adoption: { type: 'array', items: { type: 'object' } },
                utilization: { type: 'array', items: { type: 'object' } },
                proficiency: { type: 'array', items: { type: 'object' } }
              }
            },
            methodology: { type: 'object' },
            baselines: { type: 'object' },
            targets: { type: 'object' }
          }
        },
        maturityModel: { type: 'object' },
        measurementSchedule: { type: 'object' }
      },
      required: ['adoptionFramework', 'maturityModel']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const dataCollectionTask = defineTask('adoption-data-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Data Collection Approach',
  agent: {
    name: 'data-collection-designer',
    prompt: {
      role: 'Change Analytics Data Specialist',
      task: 'Design comprehensive data collection approach for adoption tracking',
      context: args,
      instructions: [
        'Identify data sources by metric',
        'Design survey instruments',
        'Create observation protocols',
        'Define system data extraction',
        'Create sampling approach',
        'Design data quality checks',
        'Plan data integration',
        'Create data collection timeline'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        dataCollectionPlan: {
          type: 'object',
          properties: {
            dataSources: { type: 'array', items: { type: 'object' } },
            surveyInstruments: { type: 'array', items: { type: 'object' } },
            observationProtocols: { type: 'array', items: { type: 'object' } },
            systemDataExtraction: { type: 'object' },
            samplingApproach: { type: 'object' },
            qualityChecks: { type: 'array', items: { type: 'object' } }
          }
        },
        dataIntegration: { type: 'object' },
        collectionTimeline: { type: 'object' }
      },
      required: ['dataCollectionPlan', 'collectionTimeline']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const adoptionMeasurementTask = defineTask('adoption-measurement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Measure Adoption Metrics',
  agent: {
    name: 'adoption-measurer',
    prompt: {
      role: 'Change Adoption Analyst',
      task: 'Measure and analyze adoption metrics across stakeholder groups',
      context: args,
      instructions: [
        'Calculate adoption rates by group',
        'Measure awareness levels',
        'Track usage initiation',
        'Analyze adoption patterns',
        'Compare against targets',
        'Identify adoption leaders and laggards',
        'Analyze adoption barriers',
        'Create adoption scorecard'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        adoptionMetrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholderGroup: { type: 'string' },
              adoptionRate: { type: 'number' },
              target: { type: 'number' },
              variance: { type: 'number' },
              trend: { type: 'string' },
              barriers: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        adoptionPatterns: { type: 'object' },
        leadersAndLaggards: { type: 'object' },
        adoptionScorecard: { type: 'object' }
      },
      required: ['adoptionMetrics', 'adoptionScorecard']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const utilizationAnalysisTask = defineTask('utilization-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Utilization Metrics',
  agent: {
    name: 'utilization-analyst',
    prompt: {
      role: 'Usage Analytics Specialist',
      task: 'Analyze utilization patterns and depth of use',
      context: args,
      instructions: [
        'Measure usage frequency',
        'Analyze feature utilization',
        'Track process compliance',
        'Measure depth of use',
        'Identify usage patterns',
        'Compare actual vs expected use',
        'Analyze usage by function',
        'Create utilization dashboard'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        utilizationAnalysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholderGroup: { type: 'string' },
              usageFrequency: { type: 'object' },
              featureUtilization: { type: 'array', items: { type: 'object' } },
              processCompliance: { type: 'number' },
              depthOfUse: { type: 'string' },
              usagePattern: { type: 'string' }
            }
          }
        },
        utilizationPatterns: { type: 'object' },
        utilizationGaps: { type: 'array', items: { type: 'object' } },
        utilizationDashboard: { type: 'object' }
      },
      required: ['utilizationAnalysis', 'utilizationGaps']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const proficiencyAssessmentTask = defineTask('proficiency-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess Proficiency Levels',
  agent: {
    name: 'proficiency-assessor',
    prompt: {
      role: 'Competency Assessment Specialist',
      task: 'Assess proficiency levels and skill development progress',
      context: args,
      instructions: [
        'Measure skill proficiency levels',
        'Assess performance quality',
        'Track error rates and accuracy',
        'Measure productivity impacts',
        'Assess behavioral changes',
        'Compare to proficiency targets',
        'Identify skill gaps',
        'Create proficiency heat map'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        proficiencyAssessment: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholderGroup: { type: 'string' },
              proficiencyLevel: { type: 'string' },
              skillScores: { type: 'array', items: { type: 'object' } },
              performanceQuality: { type: 'number' },
              errorRate: { type: 'number' },
              productivityImpact: { type: 'string' },
              behavioralChanges: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        skillGaps: { type: 'array', items: { type: 'object' } },
        proficiencyHeatMap: { type: 'object' },
        developmentNeeds: { type: 'array', items: { type: 'object' } }
      },
      required: ['proficiencyAssessment', 'skillGaps']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const dashboardCreationTask = defineTask('adoption-dashboard', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Adoption Dashboard',
  agent: {
    name: 'dashboard-designer',
    prompt: {
      role: 'Analytics Dashboard Designer',
      task: 'Create comprehensive adoption tracking dashboard',
      context: args,
      instructions: [
        'Design executive summary view',
        'Create AUP metrics display',
        'Design trend visualizations',
        'Create stakeholder group views',
        'Design drill-down capabilities',
        'Add comparison to targets',
        'Include leading indicators',
        'Create alert mechanisms'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        adoptionDashboard: {
          type: 'object',
          properties: {
            executiveSummary: { type: 'object' },
            aupMetricsDisplay: { type: 'object' },
            trendCharts: { type: 'array', items: { type: 'object' } },
            groupViews: { type: 'array', items: { type: 'object' } },
            drillDowns: { type: 'array', items: { type: 'object' } },
            targetComparisons: { type: 'object' },
            alerts: { type: 'array', items: { type: 'object' } }
          }
        },
        refreshSchedule: { type: 'object' },
        accessControls: { type: 'object' }
      },
      required: ['adoptionDashboard']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const interventionRecommendationsTask = defineTask('intervention-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Intervention Recommendations',
  agent: {
    name: 'intervention-advisor',
    prompt: {
      role: 'Change Intervention Specialist',
      task: 'Develop targeted intervention recommendations based on adoption data',
      context: args,
      instructions: [
        'Analyze adoption gaps',
        'Identify intervention opportunities',
        'Design targeted interventions',
        'Prioritize interventions',
        'Define intervention owners',
        'Plan intervention timing',
        'Define success criteria',
        'Create intervention roadmap'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        interventionRecommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              interventionId: { type: 'string' },
              targetGroup: { type: 'string' },
              gap: { type: 'string' },
              intervention: { type: 'string' },
              type: { type: 'string' },
              priority: { type: 'string' },
              owner: { type: 'string' },
              timing: { type: 'string' },
              successCriteria: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        interventionRoadmap: { type: 'object' },
        resourceRequirements: { type: 'object' }
      },
      required: ['interventionRecommendations', 'interventionRoadmap']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const sustainmentPlanTask = defineTask('adoption-sustainment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Sustainment Plan',
  agent: {
    name: 'sustainment-planner',
    prompt: {
      role: 'Change Sustainment Specialist',
      task: 'Create plan to sustain and improve adoption over time',
      context: args,
      instructions: [
        'Define sustainment approach',
        'Plan reinforcement activities',
        'Design continuous improvement process',
        'Plan ongoing monitoring',
        'Define escalation triggers',
        'Plan refresher activities',
        'Create success celebration plan',
        'Define handoff to operations'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        sustainmentPlan: {
          type: 'object',
          properties: {
            approach: { type: 'object' },
            reinforcementActivities: { type: 'array', items: { type: 'object' } },
            continuousImprovement: { type: 'object' },
            ongoingMonitoring: { type: 'object' },
            escalationTriggers: { type: 'array', items: { type: 'object' } },
            refresherPlan: { type: 'object' },
            celebrationPlan: { type: 'object' }
          }
        },
        operationsHandoff: { type: 'object' },
        longTermTargets: { type: 'object' }
      },
      required: ['sustainmentPlan', 'operationsHandoff']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const reportingTask = defineTask('adoption-reporting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Adoption Reports',
  agent: {
    name: 'adoption-reporter',
    prompt: {
      role: 'Change Reporting Analyst',
      task: 'Create comprehensive adoption status reports for stakeholders',
      context: args,
      instructions: [
        'Create executive adoption summary',
        'Develop detailed status report',
        'Create stakeholder-specific views',
        'Document key findings',
        'Highlight risks and issues',
        'Present recommendations',
        'Show trend analysis',
        'Create action items'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        adoptionReport: {
          type: 'object',
          properties: {
            executiveSummary: { type: 'object' },
            overallStatus: { type: 'string' },
            aupSummary: { type: 'object' },
            keyFindings: { type: 'array', items: { type: 'object' } },
            risksAndIssues: { type: 'array', items: { type: 'object' } },
            recommendations: { type: 'array', items: { type: 'object' } },
            trendAnalysis: { type: 'object' },
            actionItems: { type: 'array', items: { type: 'object' } }
          }
        },
        stakeholderViews: { type: 'array', items: { type: 'object' } },
        nextReportDate: { type: 'string' }
      },
      required: ['adoptionReport']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

// Main process function
export async function process(inputs, ctx) {
  ctx.log('Starting Change Adoption Tracking process');

  const artifacts = {
    adoptionFramework: null,
    dataCollectionPlan: null,
    adoptionMetrics: null,
    utilizationAnalysis: null,
    proficiencyAssessment: null,
    adoptionDashboard: null,
    interventionRecommendations: null,
    sustainmentPlan: null,
    adoptionReport: null
  };

  // Phase 1: Adoption Framework
  ctx.log('Phase 1: Establishing adoption measurement framework');
  const frameworkResult = await ctx.task(adoptionFrameworkTask, {
    changeContext: inputs.changeContext,
    adoptionTargets: inputs.adoptionTargets,
    stakeholderGroups: inputs.stakeholderGroups,
    timeline: inputs.timeline
  });
  artifacts.adoptionFramework = frameworkResult;

  // Phase 2: Data Collection Design
  ctx.log('Phase 2: Designing data collection approach');
  const dataCollectionResult = await ctx.task(dataCollectionTask, {
    adoptionFramework: artifacts.adoptionFramework,
    dataSource: inputs.dataSource,
    stakeholderGroups: inputs.stakeholderGroups
  });
  artifacts.dataCollectionPlan = dataCollectionResult;

  // Phase 3: Adoption Measurement
  ctx.log('Phase 3: Measuring adoption metrics');
  const adoptionResult = await ctx.task(adoptionMeasurementTask, {
    adoptionFramework: artifacts.adoptionFramework,
    dataCollectionPlan: artifacts.dataCollectionPlan,
    adoptionTargets: inputs.adoptionTargets
  });
  artifacts.adoptionMetrics = adoptionResult;

  // Phase 4: Utilization Analysis
  ctx.log('Phase 4: Analyzing utilization metrics');
  const utilizationResult = await ctx.task(utilizationAnalysisTask, {
    adoptionFramework: artifacts.adoptionFramework,
    adoptionMetrics: artifacts.adoptionMetrics,
    stakeholderGroups: inputs.stakeholderGroups
  });
  artifacts.utilizationAnalysis = utilizationResult;

  // Phase 5: Proficiency Assessment
  ctx.log('Phase 5: Assessing proficiency levels');
  const proficiencyResult = await ctx.task(proficiencyAssessmentTask, {
    adoptionFramework: artifacts.adoptionFramework,
    adoptionMetrics: artifacts.adoptionMetrics,
    utilizationAnalysis: artifacts.utilizationAnalysis
  });
  artifacts.proficiencyAssessment = proficiencyResult;

  // Phase 6: Dashboard Creation
  ctx.log('Phase 6: Creating adoption dashboard');
  const dashboardResult = await ctx.task(dashboardCreationTask, {
    adoptionFramework: artifacts.adoptionFramework,
    adoptionMetrics: artifacts.adoptionMetrics,
    utilizationAnalysis: artifacts.utilizationAnalysis,
    proficiencyAssessment: artifacts.proficiencyAssessment
  });
  artifacts.adoptionDashboard = dashboardResult;

  // Breakpoint for metrics review
  await ctx.breakpoint('adoption-metrics-review', {
    question: 'Review the adoption tracking metrics and dashboard. Are the measurements accurate and useful?',
    artifacts: {
      adoptionMetrics: artifacts.adoptionMetrics,
      utilizationAnalysis: artifacts.utilizationAnalysis,
      proficiencyAssessment: artifacts.proficiencyAssessment,
      adoptionDashboard: artifacts.adoptionDashboard
    }
  });

  // Phase 7: Intervention Recommendations
  ctx.log('Phase 7: Developing intervention recommendations');
  const interventionResult = await ctx.task(interventionRecommendationsTask, {
    adoptionMetrics: artifacts.adoptionMetrics,
    utilizationAnalysis: artifacts.utilizationAnalysis,
    proficiencyAssessment: artifacts.proficiencyAssessment,
    adoptionTargets: inputs.adoptionTargets
  });
  artifacts.interventionRecommendations = interventionResult;

  // Phase 8: Sustainment Plan
  ctx.log('Phase 8: Creating sustainment plan');
  const sustainmentResult = await ctx.task(sustainmentPlanTask, {
    adoptionMetrics: artifacts.adoptionMetrics,
    interventionRecommendations: artifacts.interventionRecommendations,
    changeContext: inputs.changeContext
  });
  artifacts.sustainmentPlan = sustainmentResult;

  // Phase 9: Adoption Reporting
  ctx.log('Phase 9: Creating adoption reports');
  const reportingResult = await ctx.task(reportingTask, {
    adoptionFramework: artifacts.adoptionFramework,
    adoptionMetrics: artifacts.adoptionMetrics,
    utilizationAnalysis: artifacts.utilizationAnalysis,
    proficiencyAssessment: artifacts.proficiencyAssessment,
    interventionRecommendations: artifacts.interventionRecommendations,
    sustainmentPlan: artifacts.sustainmentPlan
  });
  artifacts.adoptionReport = reportingResult;

  ctx.log('Change Adoption Tracking process completed');

  return {
    success: true,
    adoptionDashboard: artifacts.adoptionDashboard.adoptionDashboard,
    adoptionMetrics: artifacts.adoptionMetrics,
    utilizationAnalysis: artifacts.utilizationAnalysis.utilizationAnalysis,
    proficiencyAssessment: artifacts.proficiencyAssessment.proficiencyAssessment,
    interventionRecommendations: artifacts.interventionRecommendations.interventionRecommendations,
    sustainmentPlan: artifacts.sustainmentPlan.sustainmentPlan,
    adoptionReport: artifacts.adoptionReport.adoptionReport,
    artifacts
  };
}
