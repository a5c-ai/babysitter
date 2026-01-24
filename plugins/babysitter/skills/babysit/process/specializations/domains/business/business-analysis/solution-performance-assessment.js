/**
 * @process business-analysis/solution-performance-assessment
 * @description Measure and evaluate deployed solution performance against defined success criteria and KPIs. Identify improvement opportunities and provide recommendations for optimization.
 * @inputs { projectName: string, solution: object, successCriteria: array, kpis: array, performanceData: object }
 * @outputs { success: boolean, performanceReport: object, kpiDashboard: object, recommendations: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName = 'Project',
    solution = {},
    successCriteria = [],
    kpis = [],
    performanceData = {},
    outputDir = 'performance-assessment-output',
    assessmentPeriod = '3 months'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Solution Performance Assessment for ${projectName}`);

  // ============================================================================
  // PHASE 1: BASELINE ESTABLISHMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Establishing performance baselines');
  const baselineEstablishment = await ctx.task(baselineEstablishmentTask, {
    projectName,
    solution,
    successCriteria,
    kpis,
    outputDir
  });

  artifacts.push(...baselineEstablishment.artifacts);

  // ============================================================================
  // PHASE 2: DATA COLLECTION
  // ============================================================================

  ctx.log('info', 'Phase 2: Collecting performance data');
  const dataCollection = await ctx.task(dataCollectionTask, {
    projectName,
    solution,
    kpis,
    performanceData,
    assessmentPeriod,
    outputDir
  });

  artifacts.push(...dataCollection.artifacts);

  // ============================================================================
  // PHASE 3: KPI ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing KPI performance');
  const kpiAnalysis = await ctx.task(kpiAnalysisTask, {
    projectName,
    kpis,
    dataCollection,
    baselineEstablishment,
    outputDir
  });

  artifacts.push(...kpiAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: SUCCESS CRITERIA EVALUATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Evaluating against success criteria');
  const criteriaEvaluation = await ctx.task(criteriaEvaluationTask, {
    projectName,
    successCriteria,
    kpiAnalysis,
    dataCollection,
    outputDir
  });

  artifacts.push(...criteriaEvaluation.artifacts);

  // ============================================================================
  // PHASE 5: GAP IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Identifying performance gaps');
  const gapIdentification = await ctx.task(gapIdentificationTask, {
    projectName,
    kpiAnalysis,
    criteriaEvaluation,
    baselineEstablishment,
    outputDir
  });

  artifacts.push(...gapIdentification.artifacts);

  // ============================================================================
  // PHASE 6: ROOT CAUSE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing root causes of gaps');
  const rootCauseAnalysis = await ctx.task(rootCauseAnalysisTask, {
    projectName,
    gapIdentification,
    dataCollection,
    outputDir
  });

  artifacts.push(...rootCauseAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: IMPROVEMENT RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 7: Developing improvement recommendations');
  const improvementRecommendations = await ctx.task(improvementRecommendationsTask, {
    projectName,
    gapIdentification,
    rootCauseAnalysis,
    kpiAnalysis,
    outputDir
  });

  artifacts.push(...improvementRecommendations.artifacts);

  // ============================================================================
  // PHASE 8: PERFORMANCE REPORT
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating performance report');
  const performanceReport = await ctx.task(performanceReportTask, {
    projectName,
    baselineEstablishment,
    kpiAnalysis,
    criteriaEvaluation,
    gapIdentification,
    rootCauseAnalysis,
    improvementRecommendations,
    assessmentPeriod,
    outputDir
  });

  artifacts.push(...performanceReport.artifacts);

  // Breakpoint: Review performance assessment
  await ctx.breakpoint({
    question: `Performance assessment complete for ${projectName}. Overall score: ${criteriaEvaluation.overallScore}/100. Review recommendations?`,
    title: 'Performance Assessment Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        projectName,
        overallScore: criteriaEvaluation.overallScore,
        criteriaMetCount: criteriaEvaluation.criteriaMet,
        gapsIdentified: gapIdentification.gaps?.length || 0,
        recommendations: improvementRecommendations.recommendations?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    performanceReport: {
      reportPath: performanceReport.reportPath,
      executiveSummary: performanceReport.executiveSummary,
      overallScore: criteriaEvaluation.overallScore
    },
    kpiDashboard: {
      kpiResults: kpiAnalysis.kpiResults,
      trends: kpiAnalysis.trends,
      dashboardPath: kpiAnalysis.dashboardPath
    },
    criteriaEvaluation: {
      criteriaMet: criteriaEvaluation.criteriaMet,
      criteriaNotMet: criteriaEvaluation.criteriaNotMet,
      evaluationDetails: criteriaEvaluation.evaluationDetails
    },
    gaps: {
      identified: gapIdentification.gaps,
      rootCauses: rootCauseAnalysis.rootCauses
    },
    recommendations: improvementRecommendations.recommendations,
    artifacts,
    duration,
    metadata: {
      processId: 'business-analysis/solution-performance-assessment',
      timestamp: startTime,
      assessmentPeriod,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const baselineEstablishmentTask = defineTask('baseline-establishment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish performance baselines',
  agent: {
    name: 'performance-analyst',
    prompt: {
      role: 'performance measurement specialist',
      task: 'Establish baseline performance metrics for assessment',
      context: args,
      instructions: [
        'Document pre-implementation baseline metrics',
        'Define target values for each KPI',
        'Establish acceptable performance ranges',
        'Document measurement methodology',
        'Identify data sources for baselines',
        'Define comparison benchmarks',
        'Document baseline assumptions',
        'Create baseline documentation',
        'Validate baselines with stakeholders',
        'Create baseline summary'
      ],
      outputFormat: 'JSON with baselines, targets, ranges, methodology, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['baselines', 'targets', 'artifacts'],
      properties: {
        baselines: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              kpi: { type: 'string' },
              baselineValue: { type: 'string' },
              targetValue: { type: 'string' },
              acceptableRange: { type: 'object' },
              unit: { type: 'string' }
            }
          }
        },
        targets: { type: 'object' },
        ranges: { type: 'object' },
        methodology: { type: 'object' },
        dataSources: { type: 'array', items: { type: 'string' } },
        assumptions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'performance', 'baseline']
}));

export const dataCollectionTask = defineTask('data-collection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Collect performance data',
  agent: {
    name: 'data-analyst',
    prompt: {
      role: 'performance data analyst',
      task: 'Collect and validate performance data for assessment',
      context: args,
      instructions: [
        'Identify data sources for each KPI',
        'Collect quantitative performance data',
        'Collect qualitative feedback data',
        'Validate data accuracy and completeness',
        'Handle missing or incomplete data',
        'Normalize data for comparison',
        'Document data collection period',
        'Identify data quality issues',
        'Create data collection summary',
        'Prepare data for analysis'
      ],
      outputFormat: 'JSON with collectedData, dataSources, dataQuality, period, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['collectedData', 'dataSources', 'artifacts'],
      properties: {
        collectedData: { type: 'object' },
        dataSources: { type: 'array', items: { type: 'object' } },
        dataQuality: {
          type: 'object',
          properties: {
            completeness: { type: 'number' },
            accuracy: { type: 'string' },
            issues: { type: 'array', items: { type: 'string' } }
          }
        },
        period: {
          type: 'object',
          properties: {
            start: { type: 'string' },
            end: { type: 'string' },
            duration: { type: 'string' }
          }
        },
        qualitativeFeedback: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'performance', 'data-collection']
}));

export const kpiAnalysisTask = defineTask('kpi-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze KPI performance',
  agent: {
    name: 'kpi-analyst',
    prompt: {
      role: 'KPI analysis specialist',
      task: 'Analyze KPI performance against targets and baselines',
      context: args,
      instructions: [
        'Calculate current KPI values',
        'Compare against baseline values',
        'Compare against target values',
        'Calculate variance and percentage change',
        'Identify trends over time',
        'Categorize KPIs (met/not met/at risk)',
        'Calculate overall KPI health score',
        'Create KPI visualizations',
        'Identify leading and lagging indicators',
        'Create KPI dashboard'
      ],
      outputFormat: 'JSON with kpiResults, trends, dashboardPath, healthScore, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['kpiResults', 'healthScore', 'artifacts'],
      properties: {
        kpiResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              kpi: { type: 'string' },
              currentValue: { type: 'string' },
              baseline: { type: 'string' },
              target: { type: 'string' },
              variance: { type: 'string' },
              status: { type: 'string', enum: ['met', 'not-met', 'at-risk'] },
              trend: { type: 'string', enum: ['improving', 'stable', 'declining'] }
            }
          }
        },
        trends: { type: 'array', items: { type: 'object' } },
        dashboardPath: { type: 'string' },
        healthScore: { type: 'number' },
        kpiCategories: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'performance', 'kpi-analysis']
}));

export const criteriaEvaluationTask = defineTask('criteria-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate success criteria',
  agent: {
    name: 'evaluation-specialist',
    prompt: {
      role: 'solution evaluation specialist',
      task: 'Evaluate solution against defined success criteria',
      context: args,
      instructions: [
        'Evaluate each success criterion',
        'Determine pass/fail status',
        'Calculate overall success score',
        'Document evidence for each evaluation',
        'Identify partially met criteria',
        'Calculate criteria achievement percentage',
        'Prioritize unmet criteria',
        'Document evaluation methodology',
        'Create evaluation summary',
        'Validate with stakeholders'
      ],
      outputFormat: 'JSON with overallScore, criteriaMet, criteriaNotMet, evaluationDetails, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'criteriaMet', 'criteriaNotMet', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        criteriaMet: { type: 'number' },
        criteriaNotMet: { type: 'number' },
        criteriaPartial: { type: 'number' },
        evaluationDetails: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              status: { type: 'string', enum: ['met', 'not-met', 'partial'] },
              evidence: { type: 'string' },
              score: { type: 'number' }
            }
          }
        },
        achievementPercentage: { type: 'number' },
        methodology: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'performance', 'evaluation']
}));

export const gapIdentificationTask = defineTask('gap-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify performance gaps',
  agent: {
    name: 'gap-analyst',
    prompt: {
      role: 'performance gap analyst',
      task: 'Identify and analyze performance gaps',
      context: args,
      instructions: [
        'Identify gaps between actual and target performance',
        'Categorize gaps by severity',
        'Quantify gap magnitude',
        'Identify gap patterns',
        'Assess gap impact on business',
        'Prioritize gaps by importance',
        'Identify quick-win gap closures',
        'Document gap dependencies',
        'Create gap analysis summary',
        'Visualize gaps'
      ],
      outputFormat: 'JSON with gaps, gapsByPriority, gapImpact, quickWins, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['gaps', 'artifacts'],
      properties: {
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              area: { type: 'string' },
              currentValue: { type: 'string' },
              targetValue: { type: 'string' },
              gapMagnitude: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              impact: { type: 'string' }
            }
          }
        },
        gapsByPriority: { type: 'object' },
        gapImpact: { type: 'object' },
        quickWins: { type: 'array', items: { type: 'string' } },
        patterns: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'performance', 'gap-analysis']
}));

export const rootCauseAnalysisTask = defineTask('root-cause-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze root causes',
  agent: {
    name: 'root-cause-analyst',
    prompt: {
      role: 'root cause analysis specialist',
      task: 'Analyze root causes of performance gaps',
      context: args,
      instructions: [
        'Apply 5 Whys technique',
        'Create fishbone diagrams for major gaps',
        'Categorize causes (People, Process, Technology)',
        'Identify systemic vs isolated causes',
        'Assess cause-effect relationships',
        'Identify contributing factors',
        'Document evidence for root causes',
        'Prioritize root causes',
        'Validate with stakeholders',
        'Create root cause summary'
      ],
      outputFormat: 'JSON with rootCauses, fishboneDiagrams, causeCategories, systemicIssues, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['rootCauses', 'artifacts'],
      properties: {
        rootCauses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gapId: { type: 'string' },
              rootCause: { type: 'string' },
              category: { type: 'string' },
              evidence: { type: 'string' },
              frequency: { type: 'string' }
            }
          }
        },
        fishboneDiagrams: { type: 'array', items: { type: 'object' } },
        causeCategories: { type: 'object' },
        systemicIssues: { type: 'array', items: { type: 'string' } },
        contributingFactors: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'performance', 'root-cause']
}));

export const improvementRecommendationsTask = defineTask('improvement-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop recommendations',
  agent: {
    name: 'improvement-specialist',
    prompt: {
      role: 'continuous improvement specialist',
      task: 'Develop improvement recommendations',
      context: args,
      instructions: [
        'Develop recommendations for each root cause',
        'Prioritize recommendations by impact',
        'Estimate effort and cost',
        'Identify quick wins',
        'Create implementation roadmap',
        'Define success metrics for improvements',
        'Identify resource requirements',
        'Assess risks of recommendations',
        'Document expected benefits',
        'Create recommendation summary'
      ],
      outputFormat: 'JSON with recommendations, quickWins, roadmap, resourceRequirements, expectedBenefits, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'artifacts'],
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              gapId: { type: 'string' },
              recommendation: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] },
              effort: { type: 'string', enum: ['high', 'medium', 'low'] },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] },
              expectedBenefit: { type: 'string' },
              timeframe: { type: 'string' }
            }
          }
        },
        quickWins: { type: 'array', items: { type: 'string' } },
        roadmap: { type: 'array', items: { type: 'object' } },
        resourceRequirements: { type: 'object' },
        expectedBenefits: { type: 'object' },
        risks: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'performance', 'recommendations']
}));

export const performanceReportTask = defineTask('performance-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate performance report',
  agent: {
    name: 'report-writer',
    prompt: {
      role: 'performance reporting specialist',
      task: 'Generate comprehensive performance assessment report',
      context: args,
      instructions: [
        'Create executive summary',
        'Document assessment methodology',
        'Present KPI analysis results',
        'Present success criteria evaluation',
        'Document identified gaps',
        'Present root cause analysis',
        'Present recommendations',
        'Include visualizations and charts',
        'Create action plan summary',
        'Add appendices with detailed data'
      ],
      outputFormat: 'JSON with reportPath, executiveSummary, sections, visualizations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        sections: { type: 'array', items: { type: 'object' } },
        visualizations: { type: 'array', items: { type: 'string' } },
        keyFindings: { type: 'array', items: { type: 'string' } },
        actionPlan: { type: 'object' },
        nextSteps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'performance', 'reporting']
}));
