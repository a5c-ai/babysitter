/**
 * @process sales/pipeline-review-forecast
 * @description Weekly cadence for reviewing pipeline health, validating opportunity data, and submitting accurate revenue forecasts.
 * @inputs { salesRep?: string, team?: string, pipeline: array, forecastPeriod: string, previousForecast?: object, targets?: object }
 * @outputs { success: boolean, pipelineHealth: object, forecastSubmission: object, riskAnalysis: object, actionItems: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('sales/pipeline-review-forecast', {
 *   salesRep: 'John Smith',
 *   pipeline: [{ id: '1', name: 'Deal A', value: 50000, stage: 'Negotiation' }],
 *   forecastPeriod: 'Q1 2024',
 *   targets: { quota: 500000, committed: 300000 }
 * });
 *
 * @references
 * - Clari Revenue Operations: https://www.clari.com/
 * - Gartner Sales Forecasting: https://www.gartner.com/en/sales/topics/sales-forecasting
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    salesRep = 'Team',
    team,
    pipeline,
    forecastPeriod,
    previousForecast = {},
    targets = {},
    outputDir = 'pipeline-forecast-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Pipeline Review and Forecast for ${salesRep}`);

  // ============================================================================
  // PHASE 1: PIPELINE DATA VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Validating Pipeline Data');
  const dataValidation = await ctx.task(pipelineDataValidationTask, {
    salesRep,
    pipeline,
    outputDir
  });

  artifacts.push(...(dataValidation.artifacts || []));

  // ============================================================================
  // PHASE 2: PIPELINE HEALTH ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing Pipeline Health');
  const healthAnalysis = await ctx.task(pipelineHealthAnalysisTask, {
    salesRep,
    pipeline,
    dataValidation,
    targets,
    outputDir
  });

  artifacts.push(...(healthAnalysis.artifacts || []));

  // ============================================================================
  // PHASE 3: DEAL-BY-DEAL INSPECTION
  // ============================================================================

  ctx.log('info', 'Phase 3: Inspecting Individual Deals');
  const dealInspection = await ctx.task(dealInspectionTask, {
    salesRep,
    pipeline,
    healthAnalysis,
    outputDir
  });

  artifacts.push(...(dealInspection.artifacts || []));

  // ============================================================================
  // PHASE 4: FORECAST CATEGORY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing Forecast Categories');
  const forecastCategories = await ctx.task(forecastCategoryAnalysisTask, {
    salesRep,
    pipeline,
    dealInspection,
    forecastPeriod,
    outputDir
  });

  artifacts.push(...(forecastCategories.artifacts || []));

  // ============================================================================
  // PHASE 5: RISK AND UPSIDE IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Identifying Risks and Upsides');
  const riskUpside = await ctx.task(riskUpsideIdentificationTask, {
    salesRep,
    pipeline,
    dealInspection,
    forecastCategories,
    outputDir
  });

  artifacts.push(...(riskUpside.artifacts || []));

  // ============================================================================
  // PHASE 6: FORECAST CALCULATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Calculating Forecast');
  const forecastCalculation = await ctx.task(forecastCalculationTask, {
    salesRep,
    pipeline,
    forecastCategories,
    riskUpside,
    targets,
    previousForecast,
    forecastPeriod,
    outputDir
  });

  artifacts.push(...(forecastCalculation.artifacts || []));

  // ============================================================================
  // PHASE 7: GAP ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 7: Analyzing Gaps');
  const gapAnalysis = await ctx.task(gapAnalysisTask, {
    salesRep,
    forecastCalculation,
    targets,
    pipeline,
    outputDir
  });

  artifacts.push(...(gapAnalysis.artifacts || []));

  // ============================================================================
  // PHASE 8: ACTION ITEM GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating Action Items');
  const actionItems = await ctx.task(actionItemGenerationTask, {
    salesRep,
    healthAnalysis,
    dealInspection,
    riskUpside,
    gapAnalysis,
    outputDir
  });

  artifacts.push(...(actionItems.artifacts || []));

  // Breakpoint: Review forecast before submission
  await ctx.breakpoint({
    question: `Pipeline review complete for ${salesRep}. Forecast: ${forecastCalculation.totalForecast}. Submit forecast?`,
    title: 'Pipeline Review and Forecast Submission',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        label: a.label || undefined
      })),
      summary: {
        salesRep,
        pipelineValue: healthAnalysis.totalPipelineValue,
        forecastAmount: forecastCalculation.totalForecast,
        quota: targets.quota,
        coverage: healthAnalysis.coverageRatio,
        riskDeals: riskUpside.atRiskDeals?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    salesRep,
    forecastPeriod,
    pipelineHealth: {
      totalValue: healthAnalysis.totalPipelineValue,
      dealCount: healthAnalysis.dealCount,
      coverageRatio: healthAnalysis.coverageRatio,
      healthScore: healthAnalysis.healthScore,
      averageDealSize: healthAnalysis.averageDealSize,
      stageDistribution: healthAnalysis.stageDistribution
    },
    forecastSubmission: {
      commit: forecastCalculation.commit,
      bestCase: forecastCalculation.bestCase,
      pipeline: forecastCalculation.pipeline,
      totalForecast: forecastCalculation.totalForecast,
      confidence: forecastCalculation.confidence
    },
    riskAnalysis: {
      atRiskDeals: riskUpside.atRiskDeals,
      upsideDeals: riskUpside.upsideDeals,
      slippageRisk: riskUpside.slippageRisk
    },
    gapAnalysis: {
      gapToQuota: gapAnalysis.gapToQuota,
      gapToCommit: gapAnalysis.gapToCommit,
      coverageNeeded: gapAnalysis.coverageNeeded
    },
    actionItems: actionItems.items,
    artifacts,
    duration,
    metadata: {
      processId: 'sales/pipeline-review-forecast',
      timestamp: startTime,
      salesRep,
      forecastPeriod,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const pipelineDataValidationTask = defineTask('pipeline-data-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Pipeline Data Validation - ${args.salesRep}`,
  agent: {
    name: 'sales-analyst',
    prompt: {
      role: 'Sales operations data analyst',
      task: 'Validate pipeline data quality and completeness',
      context: args,
      instructions: [
        'Check for missing required fields',
        'Validate close date reasonableness',
        'Check for stale opportunities',
        'Validate stage-to-value relationships',
        'Identify duplicate or conflicting data',
        'Check probability assignments',
        'Validate contact and account associations',
        'Generate data quality score'
      ],
      outputFormat: 'JSON with validationResults, dataQualityScore, issues, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['validationResults', 'dataQualityScore', 'artifacts'],
      properties: {
        validationResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dealId: { type: 'string' },
              issues: { type: 'array', items: { type: 'string' } },
              severity: { type: 'string', enum: ['critical', 'warning', 'info'] }
            }
          }
        },
        dataQualityScore: { type: 'number', minimum: 0, maximum: 100 },
        issues: {
          type: 'object',
          properties: {
            critical: { type: 'number' },
            warning: { type: 'number' },
            info: { type: 'number' }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'pipeline-review', 'data-validation']
}));

export const pipelineHealthAnalysisTask = defineTask('pipeline-health-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Pipeline Health Analysis - ${args.salesRep}`,
  agent: {
    name: 'sales-analyst',
    prompt: {
      role: 'Pipeline analytics specialist',
      task: 'Analyze overall pipeline health metrics',
      context: args,
      instructions: [
        'Calculate total pipeline value',
        'Analyze stage distribution',
        'Calculate pipeline coverage ratio',
        'Assess pipeline velocity',
        'Compare to historical benchmarks',
        'Identify pipeline shape issues',
        'Calculate average deal size',
        'Generate pipeline health score'
      ],
      outputFormat: 'JSON with totalPipelineValue, dealCount, coverageRatio, healthScore, stageDistribution, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalPipelineValue', 'dealCount', 'healthScore', 'artifacts'],
      properties: {
        totalPipelineValue: { type: 'number' },
        dealCount: { type: 'number' },
        coverageRatio: { type: 'number' },
        healthScore: { type: 'number', minimum: 0, maximum: 100 },
        averageDealSize: { type: 'number' },
        stageDistribution: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stage: { type: 'string' },
              count: { type: 'number' },
              value: { type: 'number' },
              percentage: { type: 'number' }
            }
          }
        },
        velocityMetrics: {
          type: 'object',
          properties: {
            averageCycleTime: { type: 'number' },
            conversionRates: { type: 'object' }
          }
        },
        healthIndicators: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              indicator: { type: 'string' },
              status: { type: 'string', enum: ['healthy', 'warning', 'critical'] },
              value: { type: 'string' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'pipeline-review', 'health-analysis']
}));

export const dealInspectionTask = defineTask('deal-inspection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Deal-by-Deal Inspection - ${args.salesRep}`,
  agent: {
    name: 'sales-analyst',
    prompt: {
      role: 'Deal inspection specialist',
      task: 'Inspect each deal for accuracy and identify concerns',
      context: args,
      instructions: [
        'Review each deal close date',
        'Validate deal value accuracy',
        'Assess stage appropriateness',
        'Check for recent activity',
        'Identify stalled deals',
        'Flag deals with missing information',
        'Assess deal qualification status',
        'Prioritize deals for review'
      ],
      outputFormat: 'JSON with dealReviews array, flaggedDeals, stalledDeals, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['dealReviews', 'artifacts'],
      properties: {
        dealReviews: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dealId: { type: 'string' },
              dealName: { type: 'string' },
              value: { type: 'number' },
              stage: { type: 'string' },
              closeDate: { type: 'string' },
              healthStatus: { type: 'string', enum: ['healthy', 'at-risk', 'stalled'] },
              concerns: { type: 'array', items: { type: 'string' } },
              lastActivity: { type: 'string' }
            }
          }
        },
        flaggedDeals: { type: 'array', items: { type: 'string' } },
        stalledDeals: { type: 'array', items: { type: 'string' } },
        priorityReviews: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'pipeline-review', 'deal-inspection']
}));

export const forecastCategoryAnalysisTask = defineTask('forecast-category-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Forecast Category Analysis - ${args.salesRep}`,
  agent: {
    name: 'sales-analyst',
    prompt: {
      role: 'Forecast analyst',
      task: 'Categorize deals into forecast categories',
      context: args,
      instructions: [
        'Categorize deals into Commit, Best Case, Pipeline',
        'Validate category assignments',
        'Check for over-optimistic categorization',
        'Ensure commit deals meet criteria',
        'Identify category movement candidates',
        'Calculate category totals',
        'Compare to historical accuracy',
        'Provide category recommendations'
      ],
      outputFormat: 'JSON with categories object, categoryTotals, movements, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['categories', 'categoryTotals', 'artifacts'],
      properties: {
        categories: {
          type: 'object',
          properties: {
            commit: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  dealId: { type: 'string' },
                  dealName: { type: 'string' },
                  value: { type: 'number' },
                  confidence: { type: 'number' }
                }
              }
            },
            bestCase: { type: 'array' },
            pipeline: { type: 'array' }
          }
        },
        categoryTotals: {
          type: 'object',
          properties: {
            commit: { type: 'number' },
            bestCase: { type: 'number' },
            pipeline: { type: 'number' }
          }
        },
        categoryChanges: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dealId: { type: 'string' },
              from: { type: 'string' },
              to: { type: 'string' },
              reason: { type: 'string' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'pipeline-review', 'forecast-categories']
}));

export const riskUpsideIdentificationTask = defineTask('risk-upside-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Risk and Upside Identification - ${args.salesRep}`,
  agent: {
    name: 'sales-analyst',
    prompt: {
      role: 'Deal risk analyst',
      task: 'Identify at-risk deals and upside opportunities',
      context: args,
      instructions: [
        'Identify deals at risk of slipping',
        'Identify deals at risk of loss',
        'Quantify risk exposure',
        'Identify upside opportunities',
        'Assess pull-in possibilities',
        'Calculate net risk/upside',
        'Prioritize risk mitigation',
        'Flag competitive threats'
      ],
      outputFormat: 'JSON with atRiskDeals, upsideDeals, slippageRisk, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['atRiskDeals', 'upsideDeals', 'artifacts'],
      properties: {
        atRiskDeals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dealId: { type: 'string' },
              dealName: { type: 'string' },
              value: { type: 'number' },
              riskType: { type: 'string', enum: ['slip', 'loss', 'value-reduction'] },
              riskLevel: { type: 'string', enum: ['high', 'medium', 'low'] },
              reason: { type: 'string' }
            }
          }
        },
        upsideDeals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dealId: { type: 'string' },
              dealName: { type: 'string' },
              currentValue: { type: 'number' },
              upsideType: { type: 'string', enum: ['pull-in', 'value-increase', 'new-deal'] },
              potentialValue: { type: 'number' },
              likelihood: { type: 'string' }
            }
          }
        },
        slippageRisk: {
          type: 'object',
          properties: {
            totalAtRisk: { type: 'number' },
            highRiskValue: { type: 'number' },
            slipProbability: { type: 'number' }
          }
        },
        netRiskUpside: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'pipeline-review', 'risk-upside']
}));

export const forecastCalculationTask = defineTask('forecast-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Forecast Calculation - ${args.salesRep}`,
  agent: {
    name: 'sales-analyst',
    prompt: {
      role: 'Revenue forecast specialist',
      task: 'Calculate final forecast numbers',
      context: args,
      instructions: [
        'Calculate commit forecast',
        'Calculate best case forecast',
        'Calculate total pipeline',
        'Apply risk adjustments',
        'Compare to previous forecast',
        'Calculate forecast change',
        'Assess forecast confidence',
        'Validate against historical accuracy'
      ],
      outputFormat: 'JSON with commit, bestCase, pipeline, totalForecast, confidence, changes, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['commit', 'bestCase', 'pipeline', 'totalForecast', 'artifacts'],
      properties: {
        commit: { type: 'number' },
        bestCase: { type: 'number' },
        pipeline: { type: 'number' },
        totalForecast: { type: 'number' },
        confidence: { type: 'number', minimum: 0, maximum: 100 },
        riskAdjustedForecast: { type: 'number' },
        changes: {
          type: 'object',
          properties: {
            vsLastWeek: { type: 'number' },
            vsLastMonth: { type: 'number' },
            changeReasons: { type: 'array', items: { type: 'string' } }
          }
        },
        historicalAccuracy: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'pipeline-review', 'forecast-calculation']
}));

export const gapAnalysisTask = defineTask('gap-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Gap Analysis - ${args.salesRep}`,
  agent: {
    name: 'sales-analyst',
    prompt: {
      role: 'Sales performance analyst',
      task: 'Analyze gaps between forecast and targets',
      context: args,
      instructions: [
        'Calculate gap to quota',
        'Calculate gap to commit target',
        'Assess pipeline coverage needed',
        'Identify sources to close gap',
        'Project end-of-period outcome',
        'Identify acceleration opportunities',
        'Calculate required win rate',
        'Recommend gap-closing strategies'
      ],
      outputFormat: 'JSON with gapToQuota, gapToCommit, coverageNeeded, strategies, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['gapToQuota', 'artifacts'],
      properties: {
        gapToQuota: { type: 'number' },
        gapToCommit: { type: 'number' },
        coverageNeeded: { type: 'number' },
        projectedAttainment: { type: 'number' },
        gapSources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              potential: { type: 'number' },
              likelihood: { type: 'string' }
            }
          }
        },
        strategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              strategy: { type: 'string' },
              impact: { type: 'number' },
              effort: { type: 'string' }
            }
          }
        },
        requiredWinRate: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'pipeline-review', 'gap-analysis']
}));

export const actionItemGenerationTask = defineTask('action-item-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Action Item Generation - ${args.salesRep}`,
  agent: {
    name: 'sales-analyst',
    prompt: {
      role: 'Sales execution coach',
      task: 'Generate prioritized action items from pipeline review',
      context: args,
      instructions: [
        'Compile all required actions from analysis',
        'Prioritize by revenue impact',
        'Assign owners and deadlines',
        'Include data hygiene items',
        'Include risk mitigation actions',
        'Include pipeline building actions',
        'Set follow-up checkpoints',
        'Create accountability structure'
      ],
      outputFormat: 'JSON with items array, priorities, timeline, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['items', 'artifacts'],
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              dealId: { type: 'string' },
              category: { type: 'string', enum: ['risk-mitigation', 'data-hygiene', 'pipeline-building', 'deal-acceleration'] },
              priority: { type: 'string', enum: ['immediate', 'this-week', 'this-month'] },
              owner: { type: 'string' },
              deadline: { type: 'string' },
              revenueImpact: { type: 'number' }
            }
          }
        },
        summary: {
          type: 'object',
          properties: {
            totalActions: { type: 'number' },
            immediateActions: { type: 'number' },
            revenueAtStake: { type: 'number' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'pipeline-review', 'action-items']
}));
