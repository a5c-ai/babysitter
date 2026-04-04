/**
 * @process specializations/domains/business/project-management/agile-metrics-velocity
 * @description Agile Metrics and Velocity Tracking - Track and analyze Agile metrics including velocity,
 * burndown/burnup charts, cycle time, lead time, and team capacity for accurate forecasting and
 * continuous improvement.
 * @inputs { teamName: string, sprintData: array, projectBacklog: object, teamCapacity: object, reportingPeriod?: string }
 * @outputs { success: boolean, velocityAnalysis: object, burndownMetrics: object, flowMetrics: object, forecasts: object, recommendations: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/project-management/agile-metrics-velocity', {
 *   teamName: 'Platform Team',
 *   sprintData: [{ sprintId: 1, committed: 45, completed: 42, startDate: '2024-01-01', endDate: '2024-01-14' }],
 *   projectBacklog: { totalStoryPoints: 500, epics: [...], prioritizedItems: [...] },
 *   teamCapacity: { teamSize: 6, availabilityFactor: 0.8 },
 *   reportingPeriod: 'Q1 2024'
 * });
 *
 * @references
 * - Scrum Guide: https://scrumguides.org/
 * - Agile Metrics - Mountain Goat Software: https://www.mountaingoatsoftware.com/blog/measuring-agile-team-performance
 * - Kanban Guide: https://kanbanguides.org/
 * - Flow Metrics - ActionableAgile: https://actionableagile.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    teamName,
    sprintData = [],
    projectBacklog,
    teamCapacity,
    reportingPeriod = 'Current',
    sprintLengthDays = 14,
    velocityWindow = 6
  } = inputs;

  // Phase 1: Sprint Data Validation
  const dataValidation = await ctx.task(sprintDataValidationTask, {
    teamName,
    sprintData,
    projectBacklog,
    teamCapacity
  });

  // Quality Gate: Sprint data must be valid
  if (!dataValidation.isValid) {
    return {
      success: false,
      error: 'Sprint data validation failed',
      issues: dataValidation.issues,
      phase: 'data-validation',
      velocityAnalysis: null
    };
  }

  // Phase 2: Velocity Calculation
  const velocityCalculation = await ctx.task(velocityCalculationTask, {
    teamName,
    sprintData,
    velocityWindow
  });

  // Phase 3: Velocity Trend Analysis
  const velocityTrend = await ctx.task(velocityTrendAnalysisTask, {
    teamName,
    velocityCalculation,
    sprintData
  });

  // Breakpoint: Review velocity trends
  if (velocityTrend.trendStatus === 'declining') {
    await ctx.breakpoint({
      question: `${teamName}'s velocity shows declining trend (${velocityTrend.trendPercentage}% over ${velocityWindow} sprints). Review potential causes and improvement actions?`,
      title: 'Velocity Trend Alert',
      context: {
        runId: ctx.runId,
        teamName,
        currentVelocity: velocityCalculation.currentVelocity,
        averageVelocity: velocityCalculation.averageVelocity,
        trendStatus: velocityTrend.trendStatus,
        recommendation: 'Investigate root causes and consider team improvement initiatives'
      }
    });
  }

  // Phase 4: Sprint Burndown Analysis
  const burndownAnalysis = await ctx.task(burndownAnalysisTask, {
    teamName,
    sprintData,
    velocityCalculation
  });

  // Phase 5: Release Burnup Analysis
  const burnupAnalysis = await ctx.task(burnupAnalysisTask, {
    teamName,
    projectBacklog,
    velocityCalculation,
    sprintData
  });

  // Phase 6: Flow Metrics Calculation (Cycle Time, Lead Time)
  const flowMetrics = await ctx.task(flowMetricsCalculationTask, {
    teamName,
    sprintData,
    projectBacklog
  });

  // Phase 7: Team Capacity Analysis
  const capacityAnalysis = await ctx.task(capacityAnalysisTask, {
    teamName,
    teamCapacity,
    sprintData,
    velocityCalculation
  });

  // Phase 8: Commitment Reliability Analysis
  const commitmentAnalysis = await ctx.task(commitmentReliabilityTask, {
    teamName,
    sprintData,
    velocityCalculation
  });

  // Quality Gate: Commitment reliability below threshold
  if (commitmentAnalysis.reliabilityRate < 70) {
    await ctx.breakpoint({
      question: `${teamName}'s commitment reliability is ${commitmentAnalysis.reliabilityRate}% (threshold: 70%). This affects forecasting accuracy. Review sprint planning practices?`,
      title: 'Commitment Reliability Warning',
      context: {
        runId: ctx.runId,
        reliabilityRate: commitmentAnalysis.reliabilityRate,
        averageOvercommit: commitmentAnalysis.averageOvercommit,
        recommendation: 'Consider implementing commitment-based planning improvements'
      }
    });
  }

  // Phase 9: Predictability Analysis
  const predictabilityAnalysis = await ctx.task(predictabilityAnalysisTask, {
    teamName,
    velocityCalculation,
    velocityTrend,
    commitmentAnalysis
  });

  // Phase 10: Release Forecasting
  const releaseForecasting = await ctx.task(releaseForecastingTask, {
    teamName,
    projectBacklog,
    velocityCalculation,
    capacityAnalysis,
    predictabilityAnalysis,
    sprintLengthDays
  });

  // Phase 11: Quality Metrics Integration
  const qualityMetrics = await ctx.task(qualityMetricsIntegrationTask, {
    teamName,
    sprintData,
    velocityCalculation
  });

  // Phase 12: Improvement Recommendations
  const improvementRecommendations = await ctx.task(improvementRecommendationsTask, {
    teamName,
    velocityCalculation,
    velocityTrend,
    burndownAnalysis,
    flowMetrics,
    commitmentAnalysis,
    predictabilityAnalysis,
    qualityMetrics
  });

  // Phase 13: Metrics Dashboard Generation
  const metricsDashboard = await ctx.task(metricsDashboardTask, {
    teamName,
    reportingPeriod,
    velocityCalculation,
    velocityTrend,
    burndownAnalysis,
    burnupAnalysis,
    flowMetrics,
    capacityAnalysis,
    commitmentAnalysis,
    predictabilityAnalysis,
    releaseForecasting,
    qualityMetrics,
    improvementRecommendations
  });

  // Final Breakpoint: Metrics Review
  await ctx.breakpoint({
    question: `Agile metrics analysis complete for ${teamName}. Average Velocity: ${velocityCalculation.averageVelocity} SP, Predictability: ${predictabilityAnalysis.predictabilityScore}%. Approve metrics report?`,
    title: 'Agile Metrics Review',
    context: {
      runId: ctx.runId,
      teamName,
      reportingPeriod,
      files: [
        { path: `artifacts/agile-metrics-dashboard.json`, format: 'json', content: metricsDashboard },
        { path: `artifacts/agile-metrics-report.md`, format: 'markdown', content: metricsDashboard.markdown }
      ]
    }
  });

  return {
    success: true,
    teamName,
    reportingPeriod,
    velocityAnalysis: {
      currentVelocity: velocityCalculation.currentVelocity,
      averageVelocity: velocityCalculation.averageVelocity,
      velocityRange: velocityCalculation.velocityRange,
      trendStatus: velocityTrend.trendStatus,
      trendPercentage: velocityTrend.trendPercentage,
      stabilityIndex: velocityTrend.stabilityIndex
    },
    burndownMetrics: {
      sprintBurndownHealth: burndownAnalysis.healthScore,
      burndownPattern: burndownAnalysis.pattern,
      releaseBurnupProgress: burnupAnalysis.progressPercentage,
      scopeChangeImpact: burnupAnalysis.scopeChangeImpact
    },
    flowMetrics: {
      averageCycleTime: flowMetrics.averageCycleTime,
      averageLeadTime: flowMetrics.averageLeadTime,
      throughput: flowMetrics.throughput,
      wipTrend: flowMetrics.wipTrend
    },
    capacityMetrics: {
      utilizationRate: capacityAnalysis.utilizationRate,
      availableCapacity: capacityAnalysis.availableCapacity,
      focusFactor: capacityAnalysis.focusFactor
    },
    commitmentMetrics: {
      reliabilityRate: commitmentAnalysis.reliabilityRate,
      averageCommitment: commitmentAnalysis.averageCommitment,
      completionRate: commitmentAnalysis.completionRate
    },
    forecasts: {
      releaseForecast: releaseForecasting.forecastDate,
      confidenceRange: releaseForecasting.confidenceRange,
      sprintsRemaining: releaseForecasting.sprintsRemaining,
      riskAssessment: releaseForecasting.riskAssessment
    },
    qualityIndicators: {
      defectEscapeRate: qualityMetrics.defectEscapeRate,
      technicalDebtTrend: qualityMetrics.technicalDebtTrend,
      testCoverage: qualityMetrics.testCoverage
    },
    recommendations: improvementRecommendations.recommendations,
    dashboard: metricsDashboard.document,
    metadata: {
      processId: 'specializations/domains/business/project-management/agile-metrics-velocity',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const sprintDataValidationTask = defineTask('sprint-data-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Sprint Data Validation - ${args.teamName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Agile Coach with expertise in metrics and data quality',
      task: 'Validate sprint data completeness and quality for metrics analysis',
      context: {
        teamName: args.teamName,
        sprintData: args.sprintData,
        projectBacklog: args.projectBacklog,
        teamCapacity: args.teamCapacity
      },
      instructions: [
        '1. Verify sprint data completeness (dates, committed, completed)',
        '2. Check for data consistency across sprints',
        '3. Validate story point values are reasonable',
        '4. Verify team capacity data availability',
        '5. Check backlog data completeness',
        '6. Identify missing or incomplete sprints',
        '7. Validate date ranges and sprint duration consistency',
        '8. Check for data anomalies and outliers',
        '9. Verify sufficient data for trend analysis',
        '10. Provide data quality score and recommendations'
      ],
      outputFormat: 'JSON object with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['isValid', 'validationChecks', 'dataQualityScore'],
      properties: {
        isValid: { type: 'boolean' },
        validationChecks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              check: { type: 'string' },
              status: { type: 'string', enum: ['pass', 'fail', 'warning'] },
              details: { type: 'string' }
            }
          }
        },
        issues: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } },
        dataQualityScore: { type: 'number' },
        sprintsAnalyzable: { type: 'number' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agile-metrics', 'validation', 'data-quality']
}));

export const velocityCalculationTask = defineTask('velocity-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Velocity Calculation - ${args.teamName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Agile Metrics Analyst',
      task: 'Calculate team velocity metrics from sprint data',
      context: {
        teamName: args.teamName,
        sprintData: args.sprintData,
        velocityWindow: args.velocityWindow
      },
      instructions: [
        '1. Calculate velocity for each sprint (completed story points)',
        '2. Calculate running average velocity over specified window',
        '3. Calculate velocity range (min, max, median)',
        '4. Calculate standard deviation for variability',
        '5. Identify velocity outliers and normalize if needed',
        '6. Calculate weighted average (recent sprints weighted higher)',
        '7. Determine current sprint velocity',
        '8. Calculate velocity per team member',
        '9. Track velocity by story type if available',
        '10. Provide velocity summary statistics'
      ],
      outputFormat: 'JSON object with velocity calculations'
    },
    outputSchema: {
      type: 'object',
      required: ['currentVelocity', 'averageVelocity', 'velocityRange'],
      properties: {
        currentVelocity: { type: 'number' },
        averageVelocity: { type: 'number' },
        weightedAverageVelocity: { type: 'number' },
        velocityRange: {
          type: 'object',
          properties: {
            min: { type: 'number' },
            max: { type: 'number' },
            median: { type: 'number' }
          }
        },
        standardDeviation: { type: 'number' },
        variabilityCoefficient: { type: 'number' },
        velocityHistory: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sprint: { type: 'string' },
              velocity: { type: 'number' },
              runningAverage: { type: 'number' }
            }
          }
        },
        velocityPerMember: { type: 'number' },
        outliers: { type: 'array' },
        notes: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agile-metrics', 'velocity', 'sprint-metrics']
}));

export const velocityTrendAnalysisTask = defineTask('velocity-trend-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Velocity Trend Analysis - ${args.teamName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Agile Performance Analyst',
      task: 'Analyze velocity trends and predict future performance',
      context: {
        teamName: args.teamName,
        velocityCalculation: args.velocityCalculation,
        sprintData: args.sprintData
      },
      instructions: [
        '1. Analyze velocity trend direction (increasing, stable, declining)',
        '2. Calculate trend percentage change over time',
        '3. Identify trend inflection points',
        '4. Calculate velocity stability index',
        '5. Identify seasonal or cyclical patterns',
        '6. Correlate velocity changes with team events',
        '7. Project future velocity based on trend',
        '8. Calculate trend confidence level',
        '9. Identify factors affecting velocity',
        '10. Provide trend assessment and insights'
      ],
      outputFormat: 'JSON object with velocity trend analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['trendStatus', 'trendPercentage', 'stabilityIndex'],
      properties: {
        trendStatus: { type: 'string', enum: ['increasing', 'stable', 'declining'] },
        trendPercentage: { type: 'number' },
        trendDirection: { type: 'number' },
        stabilityIndex: { type: 'number' },
        trendLine: {
          type: 'object',
          properties: {
            slope: { type: 'number' },
            intercept: { type: 'number' },
            rSquared: { type: 'number' }
          }
        },
        inflectionPoints: { type: 'array' },
        seasonalPatterns: { type: 'array' },
        projectedVelocity: {
          type: 'object',
          properties: {
            nextSprint: { type: 'number' },
            next3Sprints: { type: 'number' },
            confidence: { type: 'number' }
          }
        },
        factorsIdentified: { type: 'array', items: { type: 'string' } },
        insights: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agile-metrics', 'velocity-trend', 'forecasting']
}));

export const burndownAnalysisTask = defineTask('burndown-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Sprint Burndown Analysis - ${args.teamName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Agile Coach with expertise in sprint execution',
      task: 'Analyze sprint burndown patterns and health indicators',
      context: {
        teamName: args.teamName,
        sprintData: args.sprintData,
        velocityCalculation: args.velocityCalculation
      },
      instructions: [
        '1. Analyze burndown pattern for recent sprints',
        '2. Identify common burndown shapes (ideal, late, scope change)',
        '3. Calculate burndown health score',
        '4. Identify scope creep patterns during sprints',
        '5. Analyze work completion distribution across sprint',
        '6. Calculate average daily burn rate',
        '7. Identify sprint completion confidence indicators',
        '8. Compare actual vs. ideal burndown',
        '9. Identify burndown anti-patterns',
        '10. Provide sprint execution recommendations'
      ],
      outputFormat: 'JSON object with burndown analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['healthScore', 'pattern', 'averageBurnRate'],
      properties: {
        healthScore: { type: 'number' },
        pattern: { type: 'string', enum: ['ideal', 'late-start', 'scope-change', 'cliff', 'flat', 'erratic'] },
        averageBurnRate: { type: 'number' },
        burndownByDay: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              day: { type: 'number' },
              idealRemaining: { type: 'number' },
              actualRemaining: { type: 'number' }
            }
          }
        },
        scopeChangeImpact: {
          type: 'object',
          properties: {
            addedDuringSprint: { type: 'number' },
            removedDuringSprint: { type: 'number' },
            netChange: { type: 'number' }
          }
        },
        completionDistribution: {
          type: 'object',
          properties: {
            firstHalf: { type: 'number' },
            secondHalf: { type: 'number' }
          }
        },
        antiPatterns: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agile-metrics', 'burndown', 'sprint-health']
}));

export const burnupAnalysisTask = defineTask('burnup-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Release Burnup Analysis - ${args.teamName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Release Manager with expertise in Agile delivery',
      task: 'Analyze release burnup progress and scope trends',
      context: {
        teamName: args.teamName,
        projectBacklog: args.projectBacklog,
        velocityCalculation: args.velocityCalculation,
        sprintData: args.sprintData
      },
      instructions: [
        '1. Calculate total scope completed to date',
        '2. Track scope line changes over time',
        '3. Calculate scope change rate and impact',
        '4. Determine progress percentage toward release',
        '5. Identify scope creep trends',
        '6. Calculate work completed vs. scope growth rate',
        '7. Project scope completion based on velocity',
        '8. Identify scope management issues',
        '9. Calculate scope volatility index',
        '10. Provide scope management recommendations'
      ],
      outputFormat: 'JSON object with burnup analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['progressPercentage', 'totalCompleted', 'currentScope'],
      properties: {
        totalCompleted: { type: 'number' },
        currentScope: { type: 'number' },
        progressPercentage: { type: 'number' },
        burnupHistory: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sprint: { type: 'string' },
              completed: { type: 'number' },
              cumulativeCompleted: { type: 'number' },
              scope: { type: 'number' }
            }
          }
        },
        scopeChangeImpact: {
          type: 'object',
          properties: {
            totalAdded: { type: 'number' },
            totalRemoved: { type: 'number' },
            netChange: { type: 'number' },
            changeRate: { type: 'number' }
          }
        },
        scopeVolatilityIndex: { type: 'number' },
        completionVsScopeGrowth: { type: 'string' },
        scopeManagementHealth: { type: 'string', enum: ['healthy', 'concerning', 'critical'] },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agile-metrics', 'burnup', 'release-progress']
}));

export const flowMetricsCalculationTask = defineTask('flow-metrics-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Flow Metrics Calculation - ${args.teamName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Kanban Coach with expertise in flow metrics',
      task: 'Calculate cycle time, lead time, throughput and WIP metrics',
      context: {
        teamName: args.teamName,
        sprintData: args.sprintData,
        projectBacklog: args.projectBacklog
      },
      instructions: [
        '1. Calculate average cycle time (development start to done)',
        '2. Calculate average lead time (created to done)',
        '3. Calculate throughput (items completed per period)',
        '4. Track WIP (work in progress) levels',
        '5. Analyze cycle time distribution (percentiles)',
        '6. Identify cycle time outliers',
        '7. Calculate flow efficiency',
        '8. Track WIP aging',
        '9. Identify bottlenecks in flow',
        '10. Provide flow optimization recommendations'
      ],
      outputFormat: 'JSON object with flow metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['averageCycleTime', 'averageLeadTime', 'throughput'],
      properties: {
        averageCycleTime: { type: 'number' },
        averageLeadTime: { type: 'number' },
        throughput: {
          type: 'object',
          properties: {
            itemsPerSprint: { type: 'number' },
            pointsPerSprint: { type: 'number' },
            trend: { type: 'string' }
          }
        },
        cycleTimeDistribution: {
          type: 'object',
          properties: {
            p50: { type: 'number' },
            p85: { type: 'number' },
            p95: { type: 'number' }
          }
        },
        wipMetrics: {
          type: 'object',
          properties: {
            averageWip: { type: 'number' },
            currentWip: { type: 'number' },
            wipLimit: { type: 'number' }
          }
        },
        wipTrend: { type: 'string', enum: ['increasing', 'stable', 'decreasing'] },
        flowEfficiency: { type: 'number' },
        wipAging: { type: 'array' },
        bottlenecks: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agile-metrics', 'flow-metrics', 'cycle-time', 'lead-time']
}));

export const capacityAnalysisTask = defineTask('capacity-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Team Capacity Analysis - ${args.teamName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Agile Resource Manager',
      task: 'Analyze team capacity utilization and availability',
      context: {
        teamName: args.teamName,
        teamCapacity: args.teamCapacity,
        sprintData: args.sprintData,
        velocityCalculation: args.velocityCalculation
      },
      instructions: [
        '1. Calculate team capacity in story points',
        '2. Calculate capacity utilization rate',
        '3. Determine focus factor (velocity / available hours)',
        '4. Track capacity variations over time',
        '5. Identify capacity constraints and bottlenecks',
        '6. Calculate sustainable pace indicators',
        '7. Analyze impact of team changes on capacity',
        '8. Project future capacity availability',
        '9. Identify capacity optimization opportunities',
        '10. Provide capacity planning recommendations'
      ],
      outputFormat: 'JSON object with capacity analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['utilizationRate', 'availableCapacity', 'focusFactor'],
      properties: {
        totalCapacity: { type: 'number' },
        availableCapacity: { type: 'number' },
        utilizationRate: { type: 'number' },
        focusFactor: { type: 'number' },
        capacityHistory: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sprint: { type: 'string' },
              capacity: { type: 'number' },
              utilized: { type: 'number' }
            }
          }
        },
        teamComposition: {
          type: 'object',
          properties: {
            totalMembers: { type: 'number' },
            averageAvailability: { type: 'number' }
          }
        },
        sustainablePace: {
          type: 'object',
          properties: {
            isSustainable: { type: 'boolean' },
            burnoutRisk: { type: 'string', enum: ['low', 'medium', 'high'] }
          }
        },
        constraints: { type: 'array', items: { type: 'string' } },
        projectedCapacity: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agile-metrics', 'capacity', 'resource-planning']
}));

export const commitmentReliabilityTask = defineTask('commitment-reliability', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Commitment Reliability Analysis - ${args.teamName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Agile Coach with expertise in sprint planning',
      task: 'Analyze team commitment reliability and planning accuracy',
      context: {
        teamName: args.teamName,
        sprintData: args.sprintData,
        velocityCalculation: args.velocityCalculation
      },
      instructions: [
        '1. Calculate sprint commitment vs. completion ratio',
        '2. Calculate commitment reliability rate (sprints hitting commitment)',
        '3. Analyze overcommitment and undercommitment patterns',
        '4. Identify factors affecting commitment accuracy',
        '5. Calculate average commitment variance',
        '6. Track commitment reliability trend',
        '7. Analyze commitment by story size',
        '8. Identify planning improvement opportunities',
        '9. Calculate Say/Do ratio',
        '10. Provide sprint planning recommendations'
      ],
      outputFormat: 'JSON object with commitment analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['reliabilityRate', 'averageCommitment', 'completionRate'],
      properties: {
        reliabilityRate: { type: 'number' },
        averageCommitment: { type: 'number' },
        averageCompleted: { type: 'number' },
        completionRate: { type: 'number' },
        sayDoRatio: { type: 'number' },
        commitmentHistory: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sprint: { type: 'string' },
              committed: { type: 'number' },
              completed: { type: 'number' },
              variance: { type: 'number' }
            }
          }
        },
        averageOvercommit: { type: 'number' },
        averageUndercommit: { type: 'number' },
        overcommitSprints: { type: 'number' },
        undercommitSprints: { type: 'number' },
        reliabilityTrend: { type: 'string', enum: ['improving', 'stable', 'declining'] },
        planningIssues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agile-metrics', 'commitment', 'sprint-planning']
}));

export const predictabilityAnalysisTask = defineTask('predictability-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Predictability Analysis - ${args.teamName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Agile Forecasting Specialist',
      task: 'Assess team predictability for delivery forecasting',
      context: {
        teamName: args.teamName,
        velocityCalculation: args.velocityCalculation,
        velocityTrend: args.velocityTrend,
        commitmentAnalysis: args.commitmentAnalysis
      },
      instructions: [
        '1. Calculate predictability score based on velocity stability',
        '2. Assess forecast confidence level',
        '3. Calculate velocity confidence interval',
        '4. Determine predictability factors',
        '5. Analyze historical forecast accuracy',
        '6. Identify predictability improvement areas',
        '7. Calculate prediction accuracy metrics',
        '8. Assess risk to predictions',
        '9. Provide forecast reliability assessment',
        '10. Recommend predictability improvements'
      ],
      outputFormat: 'JSON object with predictability analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['predictabilityScore', 'forecastConfidence', 'velocityConfidenceInterval'],
      properties: {
        predictabilityScore: { type: 'number' },
        forecastConfidence: { type: 'string', enum: ['high', 'medium', 'low'] },
        velocityConfidenceInterval: {
          type: 'object',
          properties: {
            lower: { type: 'number' },
            expected: { type: 'number' },
            upper: { type: 'number' },
            confidenceLevel: { type: 'number' }
          }
        },
        predictabilityFactors: {
          type: 'object',
          properties: {
            velocityStability: { type: 'number' },
            commitmentReliability: { type: 'number' },
            scopeStability: { type: 'number' }
          }
        },
        historicalAccuracy: {
          type: 'object',
          properties: {
            meanAbsoluteError: { type: 'number' },
            forecastHitRate: { type: 'number' }
          }
        },
        predictionRisks: { type: 'array', items: { type: 'string' } },
        improvementAreas: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agile-metrics', 'predictability', 'forecasting']
}));

export const releaseForecastingTask = defineTask('release-forecasting', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Release Forecasting - ${args.teamName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Release Planning Specialist',
      task: 'Forecast release completion based on velocity and backlog',
      context: {
        teamName: args.teamName,
        projectBacklog: args.projectBacklog,
        velocityCalculation: args.velocityCalculation,
        capacityAnalysis: args.capacityAnalysis,
        predictabilityAnalysis: args.predictabilityAnalysis,
        sprintLengthDays: args.sprintLengthDays
      },
      instructions: [
        '1. Calculate remaining work in backlog',
        '2. Project completion date using average velocity',
        '3. Calculate sprints remaining to complete backlog',
        '4. Provide confidence range (optimistic, realistic, pessimistic)',
        '5. Account for capacity variations',
        '6. Consider scope change trends in forecast',
        '7. Calculate Monte Carlo style probability distribution',
        '8. Identify forecast risks and uncertainties',
        '9. Provide date range at different confidence levels',
        '10. Recommend release planning approach'
      ],
      outputFormat: 'JSON object with release forecasts'
    },
    outputSchema: {
      type: 'object',
      required: ['forecastDate', 'sprintsRemaining', 'confidenceRange'],
      properties: {
        remainingWork: { type: 'number' },
        sprintsRemaining: { type: 'number' },
        forecastDate: { type: 'string' },
        confidenceRange: {
          type: 'object',
          properties: {
            optimistic: { type: 'string' },
            realistic: { type: 'string' },
            pessimistic: { type: 'string' }
          }
        },
        probabilityDistribution: {
          type: 'object',
          properties: {
            p50: { type: 'string' },
            p75: { type: 'string' },
            p90: { type: 'string' }
          }
        },
        forecastAssumptions: { type: 'array', items: { type: 'string' } },
        riskAssessment: {
          type: 'object',
          properties: {
            level: { type: 'string', enum: ['low', 'medium', 'high'] },
            factors: { type: 'array', items: { type: 'string' } }
          }
        },
        scenarioAnalysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              velocity: { type: 'number' },
              completionDate: { type: 'string' }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agile-metrics', 'release-forecasting', 'planning']
}));

export const qualityMetricsIntegrationTask = defineTask('quality-metrics-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Quality Metrics Integration - ${args.teamName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Quality Analyst with Agile expertise',
      task: 'Integrate quality metrics with velocity and delivery metrics',
      context: {
        teamName: args.teamName,
        sprintData: args.sprintData,
        velocityCalculation: args.velocityCalculation
      },
      instructions: [
        '1. Calculate defect escape rate to production',
        '2. Track technical debt trends',
        '3. Analyze test coverage metrics',
        '4. Calculate defect density per story point',
        '5. Track bug fix velocity vs. feature velocity',
        '6. Analyze quality vs. velocity tradeoffs',
        '7. Calculate rework rate',
        '8. Track escaped defect resolution time',
        '9. Assess sustainable quality indicators',
        '10. Provide quality improvement recommendations'
      ],
      outputFormat: 'JSON object with quality metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['defectEscapeRate', 'technicalDebtTrend', 'testCoverage'],
      properties: {
        defectEscapeRate: { type: 'number' },
        defectDensity: { type: 'number' },
        technicalDebtTrend: { type: 'string', enum: ['increasing', 'stable', 'decreasing'] },
        technicalDebtPoints: { type: 'number' },
        testCoverage: { type: 'number' },
        reworkRate: { type: 'number' },
        bugFixVelocity: { type: 'number' },
        qualityVelocityRatio: { type: 'number' },
        defectHistory: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sprint: { type: 'string' },
              defectsFound: { type: 'number' },
              defectsEscaped: { type: 'number' }
            }
          }
        },
        qualityHealth: { type: 'string', enum: ['healthy', 'concerning', 'critical'] },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agile-metrics', 'quality-metrics', 'technical-debt']
}));

export const improvementRecommendationsTask = defineTask('improvement-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Improvement Recommendations - ${args.teamName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Agile Coach with expertise in team improvement',
      task: 'Generate actionable improvement recommendations based on metrics analysis',
      context: {
        teamName: args.teamName,
        velocityCalculation: args.velocityCalculation,
        velocityTrend: args.velocityTrend,
        burndownAnalysis: args.burndownAnalysis,
        flowMetrics: args.flowMetrics,
        commitmentAnalysis: args.commitmentAnalysis,
        predictabilityAnalysis: args.predictabilityAnalysis,
        qualityMetrics: args.qualityMetrics
      },
      instructions: [
        '1. Analyze all metrics for improvement opportunities',
        '2. Identify top 5 priority improvement areas',
        '3. Provide specific, actionable recommendations',
        '4. Link recommendations to metrics evidence',
        '5. Estimate impact of each improvement',
        '6. Prioritize by effort vs. impact',
        '7. Suggest experiments to test improvements',
        '8. Recommend retrospective focus areas',
        '9. Identify team strengths to leverage',
        '10. Create improvement roadmap suggestions'
      ],
      outputFormat: 'JSON object with improvement recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'prioritizedAreas', 'experiments'],
      properties: {
        prioritizedAreas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              priority: { type: 'number' },
              evidence: { type: 'string' },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              category: { type: 'string' },
              effort: { type: 'string', enum: ['low', 'medium', 'high'] },
              impact: { type: 'string', enum: ['low', 'medium', 'high'] },
              metrics: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        experiments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              experiment: { type: 'string' },
              hypothesis: { type: 'string' },
              successMetric: { type: 'string' },
              duration: { type: 'string' }
            }
          }
        },
        retrospectiveFocus: { type: 'array', items: { type: 'string' } },
        strengths: { type: 'array', items: { type: 'string' } },
        improvementRoadmap: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agile-metrics', 'continuous-improvement', 'coaching']
}));

export const metricsDashboardTask = defineTask('metrics-dashboard', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Metrics Dashboard Generation - ${args.teamName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Agile Metrics Reporting Specialist',
      task: 'Generate comprehensive Agile metrics dashboard and report',
      context: {
        teamName: args.teamName,
        reportingPeriod: args.reportingPeriod,
        velocityCalculation: args.velocityCalculation,
        velocityTrend: args.velocityTrend,
        burndownAnalysis: args.burndownAnalysis,
        burnupAnalysis: args.burnupAnalysis,
        flowMetrics: args.flowMetrics,
        capacityAnalysis: args.capacityAnalysis,
        commitmentAnalysis: args.commitmentAnalysis,
        predictabilityAnalysis: args.predictabilityAnalysis,
        releaseForecasting: args.releaseForecasting,
        qualityMetrics: args.qualityMetrics,
        improvementRecommendations: args.improvementRecommendations
      },
      instructions: [
        '1. Create executive summary with key metrics',
        '2. Design velocity section with charts and trends',
        '3. Include burndown/burnup visualizations',
        '4. Present flow metrics and cycle time analysis',
        '5. Show capacity and utilization metrics',
        '6. Display commitment reliability trends',
        '7. Present predictability and forecasting',
        '8. Include quality metrics integration',
        '9. Summarize improvement recommendations',
        '10. Generate both JSON and markdown formats',
        '11. Include data for chart generation',
        '12. Provide stakeholder-appropriate summaries'
      ],
      outputFormat: 'JSON object with complete metrics dashboard'
    },
    outputSchema: {
      type: 'object',
      required: ['document', 'markdown'],
      properties: {
        document: {
          type: 'object',
          properties: {
            executiveSummary: { type: 'string' },
            teamName: { type: 'string' },
            reportingPeriod: { type: 'string' },
            velocitySection: { type: 'object' },
            burndownSection: { type: 'object' },
            burnupSection: { type: 'object' },
            flowMetricsSection: { type: 'object' },
            capacitySection: { type: 'object' },
            commitmentSection: { type: 'object' },
            forecastSection: { type: 'object' },
            qualitySection: { type: 'object' },
            recommendations: { type: 'array' }
          }
        },
        markdown: { type: 'string' },
        chartData: {
          type: 'object',
          properties: {
            velocityChart: { type: 'object' },
            burndownChart: { type: 'object' },
            burnupChart: { type: 'object' },
            flowChart: { type: 'object' }
          }
        },
        keyMetricsSummary: {
          type: 'object',
          properties: {
            velocity: { type: 'number' },
            predictability: { type: 'number' },
            reliability: { type: 'number' },
            quality: { type: 'number' }
          }
        },
        stakeholderSummary: { type: 'string' },
        nextReportDate: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agile-metrics', 'dashboard', 'reporting']
}));
