/**
 * @process specializations/domains/business/project-management/earned-value-management
 * @description Earned Value Management (EVM) - Implement earned value analysis to track schedule and cost
 * performance (SPI, CPI, EAC, VAC) and forecast project outcomes with comprehensive performance measurement
 * and trend analysis.
 * @inputs { projectName: string, costBaseline: object, scheduleBaseline: object, actualData: object, reportingPeriod: string }
 * @outputs { success: boolean, evmMetrics: object, performanceAnalysis: object, forecasts: object, recommendations: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/project-management/earned-value-management', {
 *   projectName: 'ERP Implementation',
 *   costBaseline: { bac: 5000000, timePhasedPV: [...] },
 *   scheduleBaseline: { totalDuration: 18, milestones: [...] },
 *   actualData: { acwp: 1200000, completedWork: [...], statusDate: '2024-06-30' },
 *   reportingPeriod: 'Q2 2024'
 * });
 *
 * @references
 * - PMI PMBOK Guide - Earned Value Management: https://www.pmi.org/pmbok-guide-standards/foundational/pmbok
 * - EVM Best Practices: https://www.pmi.org/learning/library/earned-value-management-best-practices-6133
 * - ANSI/EIA-748 Standard: https://www.humphreys-assoc.com/evms/ansi-evm-standard-748.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    costBaseline,
    scheduleBaseline,
    actualData,
    reportingPeriod,
    currency = 'USD',
    varianceThresholds = { schedule: 0.1, cost: 0.1 },
    forecastMethod = 'CPI'
  } = inputs;

  // Phase 1: Baseline Data Validation
  const baselineValidation = await ctx.task(baselineValidationTask, {
    projectName,
    costBaseline,
    scheduleBaseline,
    actualData
  });

  // Quality Gate: Baseline data must be valid
  if (!baselineValidation.isValid) {
    return {
      success: false,
      error: 'Baseline data validation failed',
      issues: baselineValidation.issues,
      phase: 'baseline-validation',
      evmMetrics: null
    };
  }

  // Phase 2: Planned Value (PV) Calculation
  const plannedValue = await ctx.task(plannedValueCalculationTask, {
    projectName,
    costBaseline,
    scheduleBaseline,
    statusDate: actualData.statusDate
  });

  // Phase 3: Earned Value (EV) Calculation
  const earnedValue = await ctx.task(earnedValueCalculationTask, {
    projectName,
    costBaseline,
    actualData,
    scheduleBaseline
  });

  // Phase 4: Actual Cost (AC) Analysis
  const actualCost = await ctx.task(actualCostAnalysisTask, {
    projectName,
    actualData,
    costBaseline,
    currency
  });

  // Phase 5: Variance Analysis
  const varianceAnalysis = await ctx.task(varianceAnalysisTask, {
    projectName,
    plannedValue,
    earnedValue,
    actualCost,
    varianceThresholds
  });

  // Quality Gate: Alert on significant variances
  if (varianceAnalysis.alertLevel === 'critical') {
    await ctx.breakpoint({
      question: `Critical variance detected for ${projectName}. SV: ${varianceAnalysis.scheduleVariance}, CV: ${varianceAnalysis.costVariance}. Review root causes and corrective actions?`,
      title: 'Critical EVM Variance Alert',
      context: {
        runId: ctx.runId,
        projectName,
        spi: varianceAnalysis.spi,
        cpi: varianceAnalysis.cpi,
        scheduleVariance: varianceAnalysis.scheduleVariance,
        costVariance: varianceAnalysis.costVariance,
        recommendation: 'Immediate management attention required'
      }
    });
  }

  // Phase 6: Performance Index Calculation
  const performanceIndices = await ctx.task(performanceIndexCalculationTask, {
    projectName,
    plannedValue,
    earnedValue,
    actualCost,
    costBaseline
  });

  // Phase 7: Estimate at Completion (EAC) Forecasting
  const eacForecasting = await ctx.task(eacForecastingTask, {
    projectName,
    costBaseline,
    earnedValue,
    actualCost,
    performanceIndices,
    forecastMethod
  });

  // Phase 8: Schedule Forecasting
  const scheduleForecasting = await ctx.task(scheduleForecastingTask, {
    projectName,
    scheduleBaseline,
    plannedValue,
    earnedValue,
    performanceIndices
  });

  // Phase 9: Trend Analysis
  const trendAnalysis = await ctx.task(trendAnalysisTask, {
    projectName,
    varianceAnalysis,
    performanceIndices,
    eacForecasting,
    reportingPeriod
  });

  // Phase 10: Root Cause Analysis
  const rootCauseAnalysis = await ctx.task(rootCauseAnalysisTask, {
    projectName,
    varianceAnalysis,
    actualData,
    performanceIndices
  });

  // Phase 11: Corrective Action Recommendations
  const correctiveActions = await ctx.task(correctiveActionTask, {
    projectName,
    varianceAnalysis,
    rootCauseAnalysis,
    eacForecasting,
    performanceIndices
  });

  // Phase 12: EVM Report Generation
  const evmReport = await ctx.task(evmReportGenerationTask, {
    projectName,
    reportingPeriod,
    costBaseline,
    scheduleBaseline,
    plannedValue,
    earnedValue,
    actualCost,
    varianceAnalysis,
    performanceIndices,
    eacForecasting,
    scheduleForecasting,
    trendAnalysis,
    rootCauseAnalysis,
    correctiveActions,
    currency
  });

  // Final Breakpoint: EVM Report Review
  await ctx.breakpoint({
    question: `EVM analysis complete for ${projectName}. SPI: ${performanceIndices.spi.toFixed(2)}, CPI: ${performanceIndices.cpi.toFixed(2)}, EAC: ${currency} ${eacForecasting.eac?.toLocaleString()}. Approve report for distribution?`,
    title: 'EVM Report Review',
    context: {
      runId: ctx.runId,
      projectName,
      reportingPeriod,
      performanceStatus: performanceIndices.overallStatus,
      files: [
        { path: `artifacts/evm-report.json`, format: 'json', content: evmReport },
        { path: `artifacts/evm-report.md`, format: 'markdown', content: evmReport.markdown }
      ]
    }
  });

  return {
    success: true,
    projectName,
    reportingPeriod,
    evmMetrics: {
      plannedValue: plannedValue.totalPV,
      earnedValue: earnedValue.totalEV,
      actualCost: actualCost.totalAC,
      budgetAtCompletion: costBaseline.bac,
      scheduleVariance: varianceAnalysis.scheduleVariance,
      costVariance: varianceAnalysis.costVariance,
      scheduleVariancePercent: varianceAnalysis.scheduleVariancePercent,
      costVariancePercent: varianceAnalysis.costVariancePercent
    },
    performanceAnalysis: {
      spi: performanceIndices.spi,
      cpi: performanceIndices.cpi,
      tcpi: performanceIndices.tcpi,
      csi: performanceIndices.csi,
      overallStatus: performanceIndices.overallStatus,
      performanceTrend: trendAnalysis.performanceTrend
    },
    forecasts: {
      eac: eacForecasting.eac,
      etc: eacForecasting.etc,
      vac: eacForecasting.vac,
      forecastMethod: eacForecasting.method,
      estimatedCompletionDate: scheduleForecasting.estimatedCompletionDate,
      scheduleSlippage: scheduleForecasting.scheduleSlippage
    },
    rootCauses: rootCauseAnalysis.identifiedCauses,
    recommendations: correctiveActions.recommendations,
    report: evmReport.document,
    metadata: {
      processId: 'specializations/domains/business/project-management/earned-value-management',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const baselineValidationTask = defineTask('baseline-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Baseline Data Validation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'EVM Analyst with expertise in baseline management',
      task: 'Validate baseline data integrity and completeness for EVM analysis',
      context: {
        projectName: args.projectName,
        costBaseline: args.costBaseline,
        scheduleBaseline: args.scheduleBaseline,
        actualData: args.actualData
      },
      instructions: [
        '1. Validate cost baseline completeness (BAC, time-phased PV)',
        '2. Verify schedule baseline elements (milestones, duration)',
        '3. Check actual data availability and format',
        '4. Validate data date consistency across sources',
        '5. Verify control account structure alignment',
        '6. Check for baseline changes since last period',
        '7. Validate earned value measurement methods defined',
        '8. Identify any data quality issues',
        '9. Verify currency and unit consistency',
        '10. Provide validation summary and recommendations'
      ],
      outputFormat: 'JSON object with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['isValid', 'validationChecks'],
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
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['evm', 'validation', 'baseline-management']
}));

export const plannedValueCalculationTask = defineTask('planned-value-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Planned Value (PV) Calculation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'EVM Analyst with expertise in baseline performance measurement',
      task: 'Calculate planned value (BCWS) through the status date',
      context: {
        projectName: args.projectName,
        costBaseline: args.costBaseline,
        scheduleBaseline: args.scheduleBaseline,
        statusDate: args.statusDate
      },
      instructions: [
        '1. Determine cumulative planned value through status date',
        '2. Calculate PV for current reporting period',
        '3. Break down PV by control account',
        '4. Identify planned milestones through status date',
        '5. Calculate percent complete baseline',
        '6. Verify PV against time-phased budget',
        '7. Document any baseline adjustments',
        '8. Calculate PV forecast through project completion',
        '9. Identify critical path PV elements',
        '10. Generate PV summary by category'
      ],
      outputFormat: 'JSON object with planned value analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['totalPV', 'periodPV'],
      properties: {
        totalPV: { type: 'number' },
        periodPV: { type: 'number' },
        pvByControlAccount: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              accountId: { type: 'string' },
              plannedValue: { type: 'number' },
              percentPlanned: { type: 'number' }
            }
          }
        },
        plannedMilestones: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              milestone: { type: 'string' },
              plannedDate: { type: 'string' },
              value: { type: 'number' }
            }
          }
        },
        baselinePercentComplete: { type: 'number' },
        pvForecast: { type: 'array' },
        notes: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['evm', 'planned-value', 'performance-measurement']
}));

export const earnedValueCalculationTask = defineTask('earned-value-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Earned Value (EV) Calculation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'EVM Analyst with expertise in work measurement',
      task: 'Calculate earned value (BCWP) based on work accomplished',
      context: {
        projectName: args.projectName,
        costBaseline: args.costBaseline,
        actualData: args.actualData,
        scheduleBaseline: args.scheduleBaseline
      },
      instructions: [
        '1. Apply earned value measurement techniques by work package',
        '2. Calculate cumulative earned value through status date',
        '3. Calculate EV for current reporting period',
        '4. Break down EV by control account',
        '5. Identify completed milestones and their earned value',
        '6. Calculate actual percent complete vs. baseline',
        '7. Verify EV measurements against work accomplishment',
        '8. Document measurement technique for each element',
        '9. Identify work packages with measurement issues',
        '10. Generate EV summary by category'
      ],
      outputFormat: 'JSON object with earned value analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['totalEV', 'periodEV'],
      properties: {
        totalEV: { type: 'number' },
        periodEV: { type: 'number' },
        evByControlAccount: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              accountId: { type: 'string' },
              earnedValue: { type: 'number' },
              percentComplete: { type: 'number' },
              measurementMethod: { type: 'string' }
            }
          }
        },
        completedMilestones: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              milestone: { type: 'string' },
              completionDate: { type: 'string' },
              value: { type: 'number' }
            }
          }
        },
        actualPercentComplete: { type: 'number' },
        measurementIssues: { type: 'array', items: { type: 'string' } },
        notes: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['evm', 'earned-value', 'work-measurement']
}));

export const actualCostAnalysisTask = defineTask('actual-cost-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Actual Cost (AC) Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cost Analyst with expertise in project accounting',
      task: 'Analyze actual costs (ACWP) incurred for work performed',
      context: {
        projectName: args.projectName,
        actualData: args.actualData,
        costBaseline: args.costBaseline,
        currency: args.currency
      },
      instructions: [
        '1. Calculate cumulative actual costs through status date',
        '2. Calculate AC for current reporting period',
        '3. Break down AC by control account',
        '4. Analyze AC by cost category (labor, materials, etc.)',
        '5. Identify cost overruns and underruns',
        '6. Verify AC against financial system data',
        '7. Account for committed costs and accruals',
        '8. Identify cost recording timing issues',
        '9. Analyze cost trends by category',
        '10. Generate AC summary and breakdown'
      ],
      outputFormat: 'JSON object with actual cost analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['totalAC', 'periodAC'],
      properties: {
        totalAC: { type: 'number' },
        periodAC: { type: 'number' },
        acByControlAccount: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              accountId: { type: 'string' },
              actualCost: { type: 'number' },
              committedCost: { type: 'number' }
            }
          }
        },
        acByCategory: {
          type: 'object',
          properties: {
            labor: { type: 'number' },
            materials: { type: 'number' },
            equipment: { type: 'number' },
            services: { type: 'number' },
            other: { type: 'number' }
          }
        },
        overruns: { type: 'array' },
        underruns: { type: 'array' },
        accruals: { type: 'number' },
        timingIssues: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['evm', 'actual-cost', 'cost-analysis']
}));

export const varianceAnalysisTask = defineTask('variance-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Variance Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'EVM Analyst with expertise in variance analysis',
      task: 'Analyze schedule and cost variances with threshold assessment',
      context: {
        projectName: args.projectName,
        plannedValue: args.plannedValue,
        earnedValue: args.earnedValue,
        actualCost: args.actualCost,
        varianceThresholds: args.varianceThresholds
      },
      instructions: [
        '1. Calculate Schedule Variance (SV = EV - PV)',
        '2. Calculate Cost Variance (CV = EV - AC)',
        '3. Calculate Schedule Variance Percent (SV%)',
        '4. Calculate Cost Variance Percent (CV%)',
        '5. Assess variances against thresholds',
        '6. Determine alert level (normal, warning, critical)',
        '7. Break down variances by control account',
        '8. Identify largest variance contributors',
        '9. Analyze variance trends',
        '10. Provide variance interpretation and context'
      ],
      outputFormat: 'JSON object with variance analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['scheduleVariance', 'costVariance', 'spi', 'cpi', 'alertLevel'],
      properties: {
        scheduleVariance: { type: 'number' },
        costVariance: { type: 'number' },
        scheduleVariancePercent: { type: 'number' },
        costVariancePercent: { type: 'number' },
        spi: { type: 'number' },
        cpi: { type: 'number' },
        alertLevel: { type: 'string', enum: ['normal', 'warning', 'critical'] },
        varianceByAccount: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              accountId: { type: 'string' },
              sv: { type: 'number' },
              cv: { type: 'number' },
              status: { type: 'string' }
            }
          }
        },
        topContributors: {
          type: 'object',
          properties: {
            scheduleVariance: { type: 'array' },
            costVariance: { type: 'array' }
          }
        },
        interpretation: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['evm', 'variance-analysis', 'performance-measurement']
}));

export const performanceIndexCalculationTask = defineTask('performance-index-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Performance Index Calculation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'EVM Analyst with expertise in performance indices',
      task: 'Calculate comprehensive EVM performance indices',
      context: {
        projectName: args.projectName,
        plannedValue: args.plannedValue,
        earnedValue: args.earnedValue,
        actualCost: args.actualCost,
        costBaseline: args.costBaseline
      },
      instructions: [
        '1. Calculate Schedule Performance Index (SPI = EV / PV)',
        '2. Calculate Cost Performance Index (CPI = EV / AC)',
        '3. Calculate To-Complete Performance Index (TCPI)',
        '4. Calculate Critical Ratio (CR = SPI x CPI)',
        '5. Calculate Cost Schedule Index (CSI)',
        '6. Interpret each index value',
        '7. Determine overall project performance status',
        '8. Compare indices against benchmarks',
        '9. Calculate period-over-period index changes',
        '10. Provide performance summary and assessment'
      ],
      outputFormat: 'JSON object with performance indices'
    },
    outputSchema: {
      type: 'object',
      required: ['spi', 'cpi', 'tcpi', 'overallStatus'],
      properties: {
        spi: { type: 'number' },
        cpi: { type: 'number' },
        tcpi: { type: 'number' },
        tcpiEac: { type: 'number' },
        criticalRatio: { type: 'number' },
        csi: { type: 'number' },
        indexInterpretation: {
          type: 'object',
          properties: {
            spi: { type: 'string' },
            cpi: { type: 'string' },
            tcpi: { type: 'string' }
          }
        },
        overallStatus: { type: 'string', enum: ['green', 'yellow', 'red'] },
        periodChange: {
          type: 'object',
          properties: {
            spiChange: { type: 'number' },
            cpiChange: { type: 'number' }
          }
        },
        benchmarkComparison: { type: 'object' },
        assessment: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['evm', 'performance-indices', 'spi', 'cpi']
}));

export const eacForecastingTask = defineTask('eac-forecasting', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Estimate at Completion (EAC) Forecasting - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'EVM Forecasting Specialist',
      task: 'Develop cost forecasts using multiple EAC calculation methods',
      context: {
        projectName: args.projectName,
        costBaseline: args.costBaseline,
        earnedValue: args.earnedValue,
        actualCost: args.actualCost,
        performanceIndices: args.performanceIndices,
        forecastMethod: args.forecastMethod
      },
      instructions: [
        '1. Calculate EAC using CPI method: EAC = BAC / CPI',
        '2. Calculate EAC using SPI*CPI method: EAC = AC + (BAC - EV) / (CPI * SPI)',
        '3. Calculate EAC using actual + remaining work: EAC = AC + ETC',
        '4. Calculate EAC using management estimate',
        '5. Calculate Estimate to Complete (ETC = EAC - AC)',
        '6. Calculate Variance at Completion (VAC = BAC - EAC)',
        '7. Compare forecasts from different methods',
        '8. Select recommended EAC with rationale',
        '9. Assess forecast confidence level',
        '10. Provide forecast range (optimistic, realistic, pessimistic)'
      ],
      outputFormat: 'JSON object with EAC forecasts'
    },
    outputSchema: {
      type: 'object',
      required: ['eac', 'etc', 'vac', 'method'],
      properties: {
        eacByCpi: { type: 'number' },
        eacBySpiCpi: { type: 'number' },
        eacBottomUp: { type: 'number' },
        eacManagement: { type: 'number' },
        eac: { type: 'number' },
        etc: { type: 'number' },
        vac: { type: 'number' },
        vacPercent: { type: 'number' },
        method: { type: 'string' },
        methodRationale: { type: 'string' },
        forecastRange: {
          type: 'object',
          properties: {
            optimistic: { type: 'number' },
            realistic: { type: 'number' },
            pessimistic: { type: 'number' }
          }
        },
        confidenceLevel: { type: 'number' },
        assumptions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['evm', 'forecasting', 'eac', 'etc']
}));

export const scheduleForecastingTask = defineTask('schedule-forecasting', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Schedule Forecasting - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Schedule Analyst with expertise in EVM-based forecasting',
      task: 'Forecast project completion date based on schedule performance',
      context: {
        projectName: args.projectName,
        scheduleBaseline: args.scheduleBaseline,
        plannedValue: args.plannedValue,
        earnedValue: args.earnedValue,
        performanceIndices: args.performanceIndices
      },
      instructions: [
        '1. Calculate schedule slippage based on SPI',
        '2. Estimate completion date using SPI projection',
        '3. Identify critical path impacts',
        '4. Assess milestone completion forecast',
        '5. Calculate schedule variance in time units',
        '6. Analyze schedule recovery options',
        '7. Project float consumption',
        '8. Forecast schedule confidence range',
        '9. Identify schedule risk factors',
        '10. Provide schedule recovery recommendations'
      ],
      outputFormat: 'JSON object with schedule forecasts'
    },
    outputSchema: {
      type: 'object',
      required: ['estimatedCompletionDate', 'scheduleSlippage'],
      properties: {
        baselineCompletionDate: { type: 'string' },
        estimatedCompletionDate: { type: 'string' },
        scheduleSlippage: { type: 'string' },
        slippageDays: { type: 'number' },
        criticalPathStatus: { type: 'string' },
        milestoneForecasts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              milestone: { type: 'string' },
              baselineDate: { type: 'string' },
              forecastDate: { type: 'string' },
              variance: { type: 'string' }
            }
          }
        },
        floatConsumption: { type: 'number' },
        confidenceRange: {
          type: 'object',
          properties: {
            earliest: { type: 'string' },
            expected: { type: 'string' },
            latest: { type: 'string' }
          }
        },
        recoveryOptions: { type: 'array', items: { type: 'string' } },
        riskFactors: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['evm', 'schedule-forecasting', 'completion-date']
}));

export const trendAnalysisTask = defineTask('trend-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Trend Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'EVM Trend Analyst',
      task: 'Analyze performance trends and predict future performance',
      context: {
        projectName: args.projectName,
        varianceAnalysis: args.varianceAnalysis,
        performanceIndices: args.performanceIndices,
        eacForecasting: args.eacForecasting,
        reportingPeriod: args.reportingPeriod
      },
      instructions: [
        '1. Analyze SPI trend over recent periods',
        '2. Analyze CPI trend over recent periods',
        '3. Identify trend direction (improving, stable, declining)',
        '4. Calculate trend rate of change',
        '5. Project future performance based on trends',
        '6. Identify trend inflection points',
        '7. Correlate trends with project events',
        '8. Assess trend sustainability',
        '9. Identify early warning indicators',
        '10. Provide trend-based recommendations'
      ],
      outputFormat: 'JSON object with trend analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['performanceTrend', 'trendDirection'],
      properties: {
        spiTrend: {
          type: 'object',
          properties: {
            direction: { type: 'string', enum: ['improving', 'stable', 'declining'] },
            rateOfChange: { type: 'number' },
            periods: { type: 'array' }
          }
        },
        cpiTrend: {
          type: 'object',
          properties: {
            direction: { type: 'string', enum: ['improving', 'stable', 'declining'] },
            rateOfChange: { type: 'number' },
            periods: { type: 'array' }
          }
        },
        performanceTrend: { type: 'string' },
        trendDirection: { type: 'string', enum: ['improving', 'stable', 'declining'] },
        inflectionPoints: { type: 'array' },
        projectedPerformance: {
          type: 'object',
          properties: {
            nextPeriodSpi: { type: 'number' },
            nextPeriodCpi: { type: 'number' }
          }
        },
        earlyWarnings: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['evm', 'trend-analysis', 'forecasting']
}));

export const rootCauseAnalysisTask = defineTask('root-cause-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Root Cause Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Performance Analyst with expertise in root cause analysis',
      task: 'Identify root causes of schedule and cost variances',
      context: {
        projectName: args.projectName,
        varianceAnalysis: args.varianceAnalysis,
        actualData: args.actualData,
        performanceIndices: args.performanceIndices
      },
      instructions: [
        '1. Analyze schedule variance root causes',
        '2. Analyze cost variance root causes',
        '3. Categorize causes (scope, resource, technical, external)',
        '4. Assess impact of each root cause',
        '5. Identify controllable vs. uncontrollable factors',
        '6. Link causes to specific work packages',
        '7. Assess cause persistence and recurrence',
        '8. Prioritize causes by impact',
        '9. Document evidence and data supporting analysis',
        '10. Provide cause-effect relationships'
      ],
      outputFormat: 'JSON object with root cause analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['identifiedCauses', 'prioritizedCauses'],
      properties: {
        scheduleVarianceCauses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              cause: { type: 'string' },
              category: { type: 'string' },
              impact: { type: 'number' },
              controllable: { type: 'boolean' },
              workPackages: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        costVarianceCauses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              cause: { type: 'string' },
              category: { type: 'string' },
              impact: { type: 'number' },
              controllable: { type: 'boolean' },
              workPackages: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        identifiedCauses: { type: 'array', items: { type: 'string' } },
        prioritizedCauses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              cause: { type: 'string' },
              priority: { type: 'number' },
              impact: { type: 'string' }
            }
          }
        },
        causeEffectRelationships: { type: 'array' },
        evidence: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['evm', 'root-cause-analysis', 'variance-analysis']
}));

export const correctiveActionTask = defineTask('corrective-action', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Corrective Action Recommendations - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Project Recovery Specialist',
      task: 'Develop corrective actions to address performance issues',
      context: {
        projectName: args.projectName,
        varianceAnalysis: args.varianceAnalysis,
        rootCauseAnalysis: args.rootCauseAnalysis,
        eacForecasting: args.eacForecasting,
        performanceIndices: args.performanceIndices
      },
      instructions: [
        '1. Develop schedule recovery strategies',
        '2. Develop cost reduction/control strategies',
        '3. Prioritize corrective actions by impact',
        '4. Assess feasibility of each action',
        '5. Estimate cost and schedule impact of actions',
        '6. Define action owners and timelines',
        '7. Identify resource requirements for actions',
        '8. Assess risks of corrective actions',
        '9. Define success metrics for actions',
        '10. Create action implementation plan'
      ],
      outputFormat: 'JSON object with corrective action recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'prioritizedActions'],
      properties: {
        scheduleRecoveryActions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              expectedImpact: { type: 'string' },
              owner: { type: 'string' },
              timeline: { type: 'string' },
              resources: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        costControlActions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              expectedSavings: { type: 'number' },
              owner: { type: 'string' },
              timeline: { type: 'string' },
              risks: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        prioritizedActions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              priority: { type: 'number' },
              type: { type: 'string', enum: ['schedule', 'cost', 'both'] },
              feasibility: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        implementationPlan: { type: 'object' },
        successMetrics: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['evm', 'corrective-action', 'recovery-planning']
}));

export const evmReportGenerationTask = defineTask('evm-report-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: EVM Report Generation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'EVM Reporting Specialist',
      task: 'Generate comprehensive EVM status report for stakeholders',
      context: {
        projectName: args.projectName,
        reportingPeriod: args.reportingPeriod,
        costBaseline: args.costBaseline,
        scheduleBaseline: args.scheduleBaseline,
        plannedValue: args.plannedValue,
        earnedValue: args.earnedValue,
        actualCost: args.actualCost,
        varianceAnalysis: args.varianceAnalysis,
        performanceIndices: args.performanceIndices,
        eacForecasting: args.eacForecasting,
        scheduleForecasting: args.scheduleForecasting,
        trendAnalysis: args.trendAnalysis,
        rootCauseAnalysis: args.rootCauseAnalysis,
        correctiveActions: args.correctiveActions,
        currency: args.currency
      },
      instructions: [
        '1. Create executive summary with key metrics',
        '2. Present EVM data table (PV, EV, AC, SV, CV)',
        '3. Display performance indices (SPI, CPI, TCPI)',
        '4. Show S-curve chart representation',
        '5. Present forecasts (EAC, ETC, VAC)',
        '6. Include variance analysis by control account',
        '7. Present trend charts and analysis',
        '8. Document root causes and corrective actions',
        '9. Include schedule forecast and milestone status',
        '10. Generate both JSON and markdown formats',
        '11. Include data visualization recommendations',
        '12. Add management action items and decisions needed'
      ],
      outputFormat: 'JSON object with complete EVM report'
    },
    outputSchema: {
      type: 'object',
      required: ['document', 'markdown'],
      properties: {
        document: {
          type: 'object',
          properties: {
            executiveSummary: { type: 'string' },
            reportingPeriod: { type: 'string' },
            evmDataTable: { type: 'object' },
            performanceIndices: { type: 'object' },
            forecasts: { type: 'object' },
            varianceAnalysis: { type: 'object' },
            trendAnalysis: { type: 'object' },
            rootCauses: { type: 'array' },
            correctiveActions: { type: 'array' },
            milestoneStatus: { type: 'array' },
            actionItems: { type: 'array' }
          }
        },
        markdown: { type: 'string' },
        visualizations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              description: { type: 'string' },
              data: { type: 'object' }
            }
          }
        },
        distributionList: { type: 'array', items: { type: 'string' } },
        nextReportDate: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['evm', 'reporting', 'status-report', 'documentation']
}));
