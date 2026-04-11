/**
 * @process specializations/data-science-ml/experiment-planning
 * @description Experiment Planning and Hypothesis Testing - Design ML experiments with clear hypotheses,
 * establish statistical test criteria, plan A/B test configurations, and define success metrics with iterative learning loops.
 * @inputs { projectName: string, experimentGoal: string, baselineModel?: string, targetMetric?: string, confidenceLevel?: number }
 * @outputs { success: boolean, hypothesis: object, experimentDesign: object, statisticalPlan: object, implementationPlan: object, abTestConfig: object }
 *
 * @example
 * const result = await orchestrate('specializations/data-science-ml/experiment-planning', {
 *   projectName: 'Recommendation Engine Improvement',
 *   experimentGoal: 'Improve click-through rate by introducing collaborative filtering',
 *   baselineModel: 'content-based-recommender-v1',
 *   targetMetric: 'click_through_rate',
 *   confidenceLevel: 0.95
 * });
 *
 * @references
 * - Rules of Machine Learning - Google: https://developers.google.com/machine-learning/guides/rules-of-ml
 * - Experimentation Best Practices: https://developers.google.com/machine-learning/guides/rules-of-ml
 * - A/B Testing Guidelines - Microsoft: https://exp-platform.com/
 * - Statistical Power Analysis: https://www.stat.ubc.ca/~rollin/stats/ssize/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    experimentGoal,
    baselineModel = 'current-production-model',
    targetMetric = 'primary_success_metric',
    confidenceLevel = 0.95,
    minimumDetectableEffect = null,
    experimentDuration = 14,
    trafficAllocation = { control: 50, treatment: 50 }
  } = inputs;

  // Phase 1: Hypothesis Formulation
  const hypothesisFormulation = await ctx.task(hypothesisFormulationTask, {
    projectName,
    experimentGoal,
    baselineModel,
    targetMetric,
    context: inputs.context || {}
  });

  // Quality Gate: Hypothesis must be testable and measurable
  if (!hypothesisFormulation.testable || !hypothesisFormulation.measurable) {
    return {
      success: false,
      error: 'Hypothesis is not testable or measurable',
      phase: 'hypothesis-formulation',
      hypothesis: hypothesisFormulation
    };
  }

  // Breakpoint: Review hypothesis with stakeholders
  await ctx.breakpoint({
    question: `Review hypothesis for ${projectName}: "${hypothesisFormulation.hypothesisStatement}". Is this hypothesis clear, testable, and aligned with business goals?`,
    title: 'Hypothesis Review',
    context: {
      runId: ctx.runId,
      projectName,
      hypothesis: hypothesisFormulation.hypothesisStatement,
      nullHypothesis: hypothesisFormulation.nullHypothesis,
      alternativeHypothesis: hypothesisFormulation.alternativeHypothesis,
      files: [{
        path: 'artifacts/phase1-hypothesis.json',
        format: 'json',
        content: hypothesisFormulation
      }]
    }
  });

  // Phase 2: Statistical Test Planning
  const statisticalPlan = await ctx.task(statisticalTestPlanningTask, {
    projectName,
    hypothesis: hypothesisFormulation,
    targetMetric,
    confidenceLevel,
    minimumDetectableEffect,
    baselineModel
  });

  // Phase 3: Sample Size Calculation
  const sampleSizeCalculation = await ctx.task(sampleSizeCalculationTask, {
    projectName,
    hypothesis: hypothesisFormulation,
    statisticalPlan,
    targetMetric,
    confidenceLevel,
    minimumDetectableEffect: minimumDetectableEffect || statisticalPlan.recommendedMDE,
    expectedVariance: statisticalPlan.expectedVariance
  });

  // Quality Gate: Sample size must be achievable
  const requiredSampleSize = sampleSizeCalculation.totalSampleSize || 0;
  const expectedDailyTraffic = inputs.expectedDailyTraffic || sampleSizeCalculation.estimatedDailyTraffic || 0;
  const estimatedDuration = requiredSampleSize / expectedDailyTraffic;

  if (estimatedDuration > experimentDuration * 2) {
    await ctx.breakpoint({
      question: `Estimated experiment duration (${Math.ceil(estimatedDuration)} days) exceeds 2x the target duration (${experimentDuration} days). Adjust parameters or proceed?`,
      title: 'Sample Size Warning',
      context: {
        runId: ctx.runId,
        requiredSampleSize,
        expectedDailyTraffic,
        estimatedDuration: Math.ceil(estimatedDuration),
        recommendation: 'Consider increasing MDE, reducing confidence level, or extending experiment duration'
      }
    });
  }

  // Phase 4: A/B Test Configuration Design
  const abTestConfig = await ctx.task(abTestConfigurationTask, {
    projectName,
    hypothesis: hypothesisFormulation,
    statisticalPlan,
    sampleSizeCalculation,
    baselineModel,
    trafficAllocation,
    experimentDuration
  });

  // Phase 5: Metric Definition and Instrumentation
  const metricDefinition = await ctx.task(metricDefinitionTask, {
    projectName,
    hypothesis: hypothesisFormulation,
    targetMetric,
    abTestConfig,
    statisticalPlan
  });

  // Breakpoint: Review metrics and instrumentation
  await ctx.breakpoint({
    question: `Review metrics definition for ${projectName}. Primary metric: ${targetMetric}. Secondary metrics: ${metricDefinition.secondaryMetrics.length}. Guardrail metrics: ${metricDefinition.guardrailMetrics.length}. Is instrumentation complete?`,
    title: 'Metrics Review',
    context: {
      runId: ctx.runId,
      primaryMetric: metricDefinition.primaryMetric,
      secondaryMetrics: metricDefinition.secondaryMetrics,
      guardrailMetrics: metricDefinition.guardrailMetrics,
      files: [{
        path: 'artifacts/phase5-metrics-definition.json',
        format: 'json',
        content: metricDefinition
      }]
    }
  });

  // Phase 6: Randomization Strategy
  const randomizationStrategy = await ctx.task(randomizationStrategyTask, {
    projectName,
    abTestConfig,
    hypothesis: hypothesisFormulation,
    sampleSizeCalculation
  });

  // Phase 7: Guardrail and Monitoring Plan
  const monitoringPlan = await ctx.task(monitoringPlanTask, {
    projectName,
    hypothesis: hypothesisFormulation,
    abTestConfig,
    metricDefinition,
    statisticalPlan
  });

  // Phase 8: Data Quality and Validation Checks
  const dataQualityPlan = await ctx.task(dataQualityPlanTask, {
    projectName,
    metricDefinition,
    abTestConfig,
    randomizationStrategy
  });

  // Phase 9: Analysis Plan
  const analysisPlan = await ctx.task(analysisPlanTask, {
    projectName,
    hypothesis: hypothesisFormulation,
    statisticalPlan,
    metricDefinition,
    sampleSizeCalculation,
    abTestConfig
  });

  // Phase 10: Implementation Roadmap
  const implementationPlan = await ctx.task(implementationPlanTask, {
    projectName,
    hypothesis: hypothesisFormulation,
    abTestConfig,
    metricDefinition,
    randomizationStrategy,
    monitoringPlan,
    dataQualityPlan,
    analysisPlan
  });

  // Phase 11: Risk Assessment and Mitigation
  const riskAssessment = await ctx.task(riskAssessmentTask, {
    projectName,
    hypothesis: hypothesisFormulation,
    abTestConfig,
    implementationPlan,
    guardrailMetrics: metricDefinition.guardrailMetrics
  });

  // Quality Gate: High-severity risks must have mitigation plans
  const highSeverityRisks = riskAssessment.risks.filter(r => r.severity === 'high');
  if (highSeverityRisks.length > 0) {
    const unmitigatedRisks = highSeverityRisks.filter(r => !r.mitigationPlan || r.mitigationPlan.trim() === '');
    if (unmitigatedRisks.length > 0) {
      await ctx.breakpoint({
        question: `Found ${unmitigatedRisks.length} high-severity risks without mitigation plans. Review and approve risk mitigation strategies?`,
        title: 'Risk Mitigation Review',
        context: {
          runId: ctx.runId,
          highSeverityRisks: unmitigatedRisks,
          recommendation: 'Ensure all high-severity risks have documented mitigation plans before proceeding'
        }
      });
    }
  }

  // Phase 12: Experiment Documentation Generation
  const experimentDoc = await ctx.task(experimentDocumentationTask, {
    projectName,
    hypothesisFormulation,
    statisticalPlan,
    sampleSizeCalculation,
    abTestConfig,
    metricDefinition,
    randomizationStrategy,
    monitoringPlan,
    dataQualityPlan,
    analysisPlan,
    implementationPlan,
    riskAssessment,
    experimentDuration,
    confidenceLevel
  });

  // Final Breakpoint: Experiment Approval
  await ctx.breakpoint({
    question: `Experiment planning complete for ${projectName}. Review final experiment design and approve to proceed with implementation?`,
    title: 'Experiment Planning Approval',
    context: {
      runId: ctx.runId,
      projectName,
      hypothesis: hypothesisFormulation.hypothesisStatement,
      sampleSize: requiredSampleSize,
      duration: experimentDuration,
      confidenceLevel,
      files: [
        { path: 'artifacts/final-experiment-plan.json', format: 'json', content: experimentDoc.json },
        { path: 'artifacts/final-experiment-plan.md', format: 'markdown', content: experimentDoc.markdown }
      ]
    }
  });

  return {
    success: true,
    projectName,
    hypothesis: {
      statement: hypothesisFormulation.hypothesisStatement,
      nullHypothesis: hypothesisFormulation.nullHypothesis,
      alternativeHypothesis: hypothesisFormulation.alternativeHypothesis,
      testable: hypothesisFormulation.testable,
      measurable: hypothesisFormulation.measurable,
      assumptions: hypothesisFormulation.assumptions
    },
    experimentDesign: {
      type: abTestConfig.experimentType,
      duration: experimentDuration,
      trafficAllocation: abTestConfig.trafficAllocation,
      variants: abTestConfig.variants,
      randomizationUnit: randomizationStrategy.randomizationUnit
    },
    statisticalPlan: {
      testType: statisticalPlan.statisticalTest,
      confidenceLevel,
      alpha: statisticalPlan.alpha,
      power: statisticalPlan.power,
      minimumDetectableEffect: statisticalPlan.recommendedMDE,
      expectedVariance: statisticalPlan.expectedVariance,
      corrections: statisticalPlan.multipleTestingCorrections
    },
    sampleSize: {
      perVariant: sampleSizeCalculation.sampleSizePerVariant,
      total: sampleSizeCalculation.totalSampleSize,
      estimatedDuration: Math.ceil(estimatedDuration)
    },
    metrics: {
      primary: metricDefinition.primaryMetric,
      secondary: metricDefinition.secondaryMetrics,
      guardrails: metricDefinition.guardrailMetrics,
      instrumentation: metricDefinition.instrumentationRequirements
    },
    abTestConfig: {
      framework: abTestConfig.recommendedFramework,
      configuration: abTestConfig.configurationDetails,
      rolloutStrategy: abTestConfig.rolloutStrategy
    },
    implementationPlan: {
      phases: implementationPlan.phases,
      timeline: implementationPlan.timeline,
      dependencies: implementationPlan.dependencies,
      rollbackPlan: implementationPlan.rollbackPlan
    },
    monitoringPlan: {
      realTimeMetrics: monitoringPlan.realTimeMetrics,
      alerting: monitoringPlan.alertingRules,
      dashboards: monitoringPlan.dashboardLinks,
      earlyStoppingCriteria: monitoringPlan.earlyStoppingCriteria
    },
    analysisPlan: {
      primaryAnalysis: analysisPlan.primaryAnalysisMethod,
      segmentations: analysisPlan.plannedSegmentations,
      sensitivityAnalyses: analysisPlan.sensitivityAnalyses,
      decisionCriteria: analysisPlan.decisionCriteria
    },
    risks: riskAssessment.risks,
    dataQualityChecks: dataQualityPlan.validationChecks,
    nextSteps: implementationPlan.nextSteps,
    metadata: {
      processId: 'specializations/data-science-ml/experiment-planning',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const hypothesisFormulationTask = defineTask('hypothesis-formulation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Hypothesis Formulation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior Data Scientist specializing in experimental design and hypothesis testing',
      task: 'Formulate a rigorous, testable hypothesis for an ML experiment',
      context: {
        projectName: args.projectName,
        experimentGoal: args.experimentGoal,
        baselineModel: args.baselineModel,
        targetMetric: args.targetMetric,
        additionalContext: args.context
      },
      instructions: [
        '1. Analyze the experiment goal and translate it into a clear, testable hypothesis',
        '2. Formulate the null hypothesis (H0) - typically that there is no difference between baseline and treatment',
        '3. Formulate the alternative hypothesis (H1) - the expected improvement or change',
        '4. Ensure the hypothesis is specific, measurable, and falsifiable',
        '5. Define the direction of the test (one-tailed or two-tailed)',
        '6. List all assumptions underlying the hypothesis',
        '7. Identify potential confounding factors that could affect the experiment',
        '8. Define success criteria in clear, quantifiable terms',
        '9. Document the rationale for why you expect this change to improve the metric',
        '10. Validate that the hypothesis is aligned with business objectives'
      ],
      outputFormat: 'JSON object with structured hypothesis formulation'
    },
    outputSchema: {
      type: 'object',
      required: ['hypothesisStatement', 'nullHypothesis', 'alternativeHypothesis', 'testable', 'measurable'],
      properties: {
        hypothesisStatement: {
          type: 'string',
          description: 'Clear, concise statement of what we are testing'
        },
        nullHypothesis: {
          type: 'string',
          description: 'H0: Statement of no effect or no difference'
        },
        alternativeHypothesis: {
          type: 'string',
          description: 'H1: Statement of expected effect or difference'
        },
        testDirection: {
          type: 'string',
          enum: ['one-tailed-positive', 'one-tailed-negative', 'two-tailed'],
          description: 'Whether we expect improvement, degradation, or any difference'
        },
        testable: {
          type: 'boolean',
          description: 'Can this hypothesis be tested through an experiment?'
        },
        measurable: {
          type: 'boolean',
          description: 'Can we measure the outcome quantitatively?'
        },
        assumptions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Underlying assumptions for the hypothesis'
        },
        confoundingFactors: {
          type: 'array',
          items: { type: 'string' },
          description: 'Potential factors that could confound results'
        },
        successCriteria: {
          type: 'object',
          properties: {
            metric: { type: 'string' },
            expectedChange: { type: 'string' },
            minimumMeaningfulChange: { type: 'string' }
          }
        },
        rationale: {
          type: 'string',
          description: 'Why we expect this change to improve the metric'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'experiment-planning', 'hypothesis']
}));

export const statisticalTestPlanningTask = defineTask('statistical-test-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Statistical Test Planning - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Statistician specializing in A/B testing and experimental design',
      task: 'Design the statistical testing approach for the ML experiment',
      context: {
        projectName: args.projectName,
        hypothesis: args.hypothesis,
        targetMetric: args.targetMetric,
        confidenceLevel: args.confidenceLevel,
        baselineModel: args.baselineModel
      },
      instructions: [
        '1. Determine the appropriate statistical test based on the metric type (continuous, binary, count, etc.)',
        '2. Calculate the significance level (alpha) from the confidence level',
        '3. Recommend statistical power (typically 0.8 or 80%)',
        '4. Determine if a parametric or non-parametric test is appropriate',
        '5. Specify the test statistic to be used (t-test, z-test, chi-square, etc.)',
        '6. Define the minimum detectable effect (MDE) that is practically significant',
        '7. Estimate the expected variance based on historical data or assumptions',
        '8. Recommend corrections for multiple testing if needed (Bonferroni, FDR, etc.)',
        '9. Specify whether sequential testing should be used',
        '10. Document the statistical assumptions and their validity'
      ],
      outputFormat: 'JSON object with complete statistical test plan'
    },
    outputSchema: {
      type: 'object',
      required: ['statisticalTest', 'alpha', 'power', 'recommendedMDE'],
      properties: {
        statisticalTest: {
          type: 'string',
          description: 'Type of statistical test to use (e.g., two-sample t-test, Mann-Whitney U, chi-square)'
        },
        testFamily: {
          type: 'string',
          enum: ['parametric', 'non-parametric'],
          description: 'Whether the test assumes a parametric distribution'
        },
        alpha: {
          type: 'number',
          description: 'Significance level (typically 0.05 for 95% confidence)'
        },
        power: {
          type: 'number',
          description: 'Statistical power (typically 0.8 or 80%)'
        },
        recommendedMDE: {
          type: 'string',
          description: 'Recommended minimum detectable effect (e.g., 5% relative improvement)'
        },
        expectedVariance: {
          type: 'string',
          description: 'Expected variance in the metric (from historical data or estimates)'
        },
        multipleTestingCorrections: {
          type: 'array',
          items: { type: 'string' },
          description: 'Corrections needed if testing multiple hypotheses'
        },
        sequentialTesting: {
          type: 'boolean',
          description: 'Whether sequential testing methodology should be used'
        },
        statisticalAssumptions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Assumptions required for the chosen test'
        },
        validationChecks: {
          type: 'array',
          items: { type: 'string' },
          description: 'Checks to validate statistical assumptions during analysis'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'experiment-planning', 'statistics']
}));

export const sampleSizeCalculationTask = defineTask('sample-size-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Sample Size Calculation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Quantitative Analyst specializing in statistical power analysis',
      task: 'Calculate required sample size for the experiment',
      context: {
        projectName: args.projectName,
        hypothesis: args.hypothesis,
        statisticalPlan: args.statisticalPlan,
        targetMetric: args.targetMetric,
        confidenceLevel: args.confidenceLevel,
        minimumDetectableEffect: args.minimumDetectableEffect,
        expectedVariance: args.expectedVariance
      },
      instructions: [
        '1. Use the statistical test type, alpha, power, and MDE to calculate required sample size',
        '2. Calculate sample size per variant (control and treatment groups)',
        '3. Calculate total sample size across all variants',
        '4. Account for expected data quality issues (missing data, invalid samples)',
        '5. Add buffer for dropout or exclusions (typically 10-20%)',
        '6. Estimate daily traffic volume to determine experiment duration',
        '7. Calculate the sensitivity of sample size to different MDE values',
        '8. Provide sample size recommendations for different scenarios (conservative, moderate, aggressive)',
        '9. Document the formulas and assumptions used in calculations',
        '10. Validate that the sample size is practically achievable'
      ],
      outputFormat: 'JSON object with sample size calculations'
    },
    outputSchema: {
      type: 'object',
      required: ['sampleSizePerVariant', 'totalSampleSize'],
      properties: {
        sampleSizePerVariant: {
          type: 'number',
          description: 'Required sample size for each variant (control/treatment)'
        },
        totalSampleSize: {
          type: 'number',
          description: 'Total sample size across all variants'
        },
        bufferPercentage: {
          type: 'number',
          description: 'Buffer added for data quality issues (as percentage)'
        },
        estimatedDailyTraffic: {
          type: 'number',
          description: 'Estimated daily traffic eligible for experiment'
        },
        calculationMethod: {
          type: 'string',
          description: 'Method used for sample size calculation'
        },
        sensitivityAnalysis: {
          type: 'object',
          properties: {
            conservativeMDE: { type: 'object' },
            moderateMDE: { type: 'object' },
            aggressiveMDE: { type: 'object' }
          },
          description: 'Sample sizes under different MDE assumptions'
        },
        assumptions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Assumptions used in sample size calculation'
        },
        feasibility: {
          type: 'string',
          enum: ['feasible', 'challenging', 'not-feasible'],
          description: 'Assessment of whether sample size is achievable'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'experiment-planning', 'sample-size']
}));

export const abTestConfigurationTask = defineTask('ab-test-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: A/B Test Configuration Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Engineer specializing in A/B testing infrastructure',
      task: 'Design the A/B test configuration and variant definitions',
      context: {
        projectName: args.projectName,
        hypothesis: args.hypothesis,
        statisticalPlan: args.statisticalPlan,
        sampleSizeCalculation: args.sampleSizeCalculation,
        baselineModel: args.baselineModel,
        trafficAllocation: args.trafficAllocation,
        experimentDuration: args.experimentDuration
      },
      instructions: [
        '1. Define the experiment type (A/B test, multivariate, multi-armed bandit, etc.)',
        '2. Specify the control variant (baseline model/experience)',
        '3. Specify the treatment variant(s) (new model/experience)',
        '4. Define traffic allocation percentages for each variant',
        '5. Design the rollout strategy (immediate full rollout, gradual ramp, staged rollout)',
        '6. Specify the randomization unit (user ID, session ID, request ID, etc.)',
        '7. Define inclusion/exclusion criteria for experiment participants',
        '8. Recommend an A/B testing framework or platform',
        '9. Specify configuration details (feature flags, experiment keys, etc.)',
        '10. Document variant consistency requirements (how to ensure users see same variant)'
      ],
      outputFormat: 'JSON object with complete A/B test configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['experimentType', 'variants', 'trafficAllocation', 'rolloutStrategy'],
      properties: {
        experimentType: {
          type: 'string',
          enum: ['ab-test', 'multivariate', 'multi-armed-bandit', 'factorial'],
          description: 'Type of experiment design'
        },
        variants: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              type: { type: 'string', enum: ['control', 'treatment'] },
              configuration: { type: 'object' }
            }
          },
          description: 'Definitions of control and treatment variants'
        },
        trafficAllocation: {
          type: 'object',
          description: 'Percentage allocation for each variant',
          additionalProperties: { type: 'number' }
        },
        rolloutStrategy: {
          type: 'string',
          enum: ['immediate', 'gradual-ramp', 'staged', 'canary'],
          description: 'How to roll out the experiment'
        },
        rolloutSchedule: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stage: { type: 'string' },
              trafficPercentage: { type: 'number' },
              duration: { type: 'string' }
            }
          },
          description: 'Staged rollout schedule if applicable'
        },
        inclusionCriteria: {
          type: 'array',
          items: { type: 'string' },
          description: 'Criteria for including users in the experiment'
        },
        exclusionCriteria: {
          type: 'array',
          items: { type: 'string' },
          description: 'Criteria for excluding users from the experiment'
        },
        recommendedFramework: {
          type: 'string',
          description: 'Recommended A/B testing platform or framework'
        },
        configurationDetails: {
          type: 'object',
          description: 'Platform-specific configuration (feature flags, experiment IDs, etc.)'
        },
        consistencyRequirements: {
          type: 'string',
          description: 'How to ensure users consistently see the same variant'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'experiment-planning', 'ab-test-config']
}));

export const metricDefinitionTask = defineTask('metric-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Metric Definition and Instrumentation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Analytics Engineer specializing in experiment instrumentation',
      task: 'Define comprehensive metrics and instrumentation requirements',
      context: {
        projectName: args.projectName,
        hypothesis: args.hypothesis,
        targetMetric: args.targetMetric,
        abTestConfig: args.abTestConfig,
        statisticalPlan: args.statisticalPlan
      },
      instructions: [
        '1. Define the primary metric (the main success metric from hypothesis)',
        '2. Define secondary metrics (supporting metrics that provide additional insights)',
        '3. Define guardrail metrics (metrics to monitor for negative side effects)',
        '4. Specify how each metric is calculated (formula, aggregation method)',
        '5. Define the logging events required to compute each metric',
        '6. Specify the properties that must be logged with each event',
        '7. Document data retention requirements for experiment data',
        '8. Define metric computation frequency (real-time, batch, etc.)',
        '9. Specify data quality checks for each metric',
        '10. Create instrumentation implementation guide for engineers'
      ],
      outputFormat: 'JSON object with complete metric definitions and instrumentation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['primaryMetric', 'secondaryMetrics', 'guardrailMetrics', 'instrumentationRequirements'],
      properties: {
        primaryMetric: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            calculation: { type: 'string' },
            unit: { type: 'string' },
            aggregation: { type: 'string' }
          },
          required: ['name', 'description', 'calculation']
        },
        secondaryMetrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              calculation: { type: 'string' },
              purpose: { type: 'string' }
            }
          },
          description: 'Supporting metrics for deeper insights'
        },
        guardrailMetrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              threshold: { type: 'string' },
              alertCondition: { type: 'string' }
            }
          },
          description: 'Metrics to monitor for negative impacts'
        },
        instrumentationRequirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              eventName: { type: 'string' },
              trigger: { type: 'string' },
              requiredProperties: { type: 'array', items: { type: 'string' } },
              optionalProperties: { type: 'array', items: { type: 'string' } },
              sampleRate: { type: 'number' }
            }
          },
          description: 'Events that must be logged'
        },
        dataRetention: {
          type: 'string',
          description: 'How long to retain experiment data'
        },
        computationFrequency: {
          type: 'string',
          enum: ['real-time', 'hourly', 'daily', 'on-demand'],
          description: 'How frequently metrics are computed'
        },
        dataQualityChecks: {
          type: 'array',
          items: { type: 'string' },
          description: 'Validations to ensure data quality'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'experiment-planning', 'metrics']
}));

export const randomizationStrategyTask = defineTask('randomization-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Randomization Strategy - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Experimental Design Specialist',
      task: 'Design the randomization strategy for the experiment',
      context: {
        projectName: args.projectName,
        abTestConfig: args.abTestConfig,
        hypothesis: args.hypothesis,
        sampleSizeCalculation: args.sampleSizeCalculation
      },
      instructions: [
        '1. Determine the randomization unit (user, session, device, request, etc.)',
        '2. Specify the hashing algorithm for deterministic assignment',
        '3. Define the seed or salt for the hash function',
        '4. Specify variant assignment logic (how hash maps to variant)',
        '5. Design stratification strategy if needed (balance by user segments)',
        '6. Define re-randomization policy (when users can switch variants)',
        '7. Specify handling of edge cases (new users, anonymous users, etc.)',
        '8. Document procedures to validate randomization quality',
        '9. Define procedures to detect and handle Sample Ratio Mismatch (SRM)',
        '10. Create implementation pseudocode for assignment logic'
      ],
      outputFormat: 'JSON object with complete randomization strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['randomizationUnit', 'assignmentAlgorithm'],
      properties: {
        randomizationUnit: {
          type: 'string',
          enum: ['user-id', 'session-id', 'device-id', 'request-id', 'other'],
          description: 'The unit at which randomization occurs'
        },
        assignmentAlgorithm: {
          type: 'string',
          description: 'Algorithm used for variant assignment (e.g., MD5 hash modulo)'
        },
        hashFunction: {
          type: 'string',
          description: 'Hash function to use (MD5, SHA256, MurmurHash, etc.)'
        },
        seed: {
          type: 'string',
          description: 'Seed or salt for the hash function'
        },
        assignmentLogic: {
          type: 'string',
          description: 'How hash values map to variants (e.g., 0-49 -> control, 50-99 -> treatment)'
        },
        stratificationStrategy: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            strata: { type: 'array', items: { type: 'string' } }
          },
          description: 'Whether and how to stratify randomization'
        },
        reRandomizationPolicy: {
          type: 'string',
          enum: ['never', 'on-new-session', 'on-new-device', 'custom'],
          description: 'When users can be re-randomized'
        },
        edgeCaseHandling: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              handling: { type: 'string' }
            }
          },
          description: 'How to handle edge cases in randomization'
        },
        qualityValidation: {
          type: 'array',
          items: { type: 'string' },
          description: 'Checks to validate randomization quality'
        },
        srmDetection: {
          type: 'object',
          properties: {
            method: { type: 'string' },
            threshold: { type: 'number' },
            alerting: { type: 'string' }
          },
          description: 'How to detect Sample Ratio Mismatch'
        },
        implementationPseudocode: {
          type: 'string',
          description: 'Pseudocode for variant assignment implementation'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'experiment-planning', 'randomization']
}));

export const monitoringPlanTask = defineTask('monitoring-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Guardrail and Monitoring Plan - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SRE Engineer specializing in ML system monitoring',
      task: 'Design comprehensive monitoring and alerting for the experiment',
      context: {
        projectName: args.projectName,
        hypothesis: args.hypothesis,
        abTestConfig: args.abTestConfig,
        metricDefinition: args.metricDefinition,
        statisticalPlan: args.statisticalPlan
      },
      instructions: [
        '1. Define real-time metrics to monitor during the experiment',
        '2. Specify alerting rules for guardrail metric violations',
        '3. Define early stopping criteria (when to halt experiment)',
        '4. Design dashboards for experiment monitoring',
        '5. Specify log levels and diagnostic logging requirements',
        '6. Define incident response procedures for experiment issues',
        '7. Create runbook for common experiment problems',
        '8. Specify data quality monitoring (completeness, correctness, timeliness)',
        '9. Define Sample Ratio Mismatch (SRM) detection and alerting',
        '10. Document escalation procedures for critical issues'
      ],
      outputFormat: 'JSON object with monitoring and alerting plan'
    },
    outputSchema: {
      type: 'object',
      required: ['realTimeMetrics', 'alertingRules', 'earlyStoppingCriteria'],
      properties: {
        realTimeMetrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              updateFrequency: { type: 'string' },
              visualization: { type: 'string' }
            }
          },
          description: 'Metrics to monitor in real-time'
        },
        alertingRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              condition: { type: 'string' },
              threshold: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'warning', 'info'] },
              notificationChannels: { type: 'array', items: { type: 'string' } }
            }
          },
          description: 'Alerting rules for anomalies'
        },
        earlyStoppingCriteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              reason: { type: 'string' },
              condition: { type: 'string' },
              action: { type: 'string' }
            }
          },
          description: 'Conditions under which to stop the experiment early'
        },
        dashboardLinks: {
          type: 'array',
          items: { type: 'string' },
          description: 'Links to monitoring dashboards'
        },
        loggingRequirements: {
          type: 'object',
          properties: {
            logLevel: { type: 'string' },
            diagnosticLogs: { type: 'array', items: { type: 'string' } }
          },
          description: 'Logging configuration for experiment'
        },
        incidentResponse: {
          type: 'object',
          properties: {
            procedures: { type: 'array', items: { type: 'string' } },
            escalationPath: { type: 'array', items: { type: 'string' } },
            rollbackProcedure: { type: 'string' }
          },
          description: 'Incident response procedures'
        },
        runbook: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              problem: { type: 'string' },
              symptoms: { type: 'array', items: { type: 'string' } },
              diagnosis: { type: 'string' },
              resolution: { type: 'string' }
            }
          },
          description: 'Runbook for common issues'
        },
        dataQualityMonitoring: {
          type: 'array',
          items: { type: 'string' },
          description: 'Data quality checks to run'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'experiment-planning', 'monitoring']
}));

export const dataQualityPlanTask = defineTask('data-quality-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Data Quality and Validation Plan - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Quality Engineer',
      task: 'Define data quality checks and validation procedures',
      context: {
        projectName: args.projectName,
        metricDefinition: args.metricDefinition,
        abTestConfig: args.abTestConfig,
        randomizationStrategy: args.randomizationStrategy
      },
      instructions: [
        '1. Define pre-experiment validation checks (before launching)',
        '2. Define in-flight validation checks (during experiment)',
        '3. Define post-experiment validation checks (before analysis)',
        '4. Specify completeness checks (missing data detection)',
        '5. Specify correctness checks (data value validation)',
        '6. Specify consistency checks (cross-metric validation)',
        '7. Specify timeliness checks (data delay detection)',
        '8. Define data schema validation procedures',
        '9. Specify outlier detection and handling',
        '10. Document procedures for handling invalid data'
      ],
      outputFormat: 'JSON object with comprehensive data quality plan'
    },
    outputSchema: {
      type: 'object',
      required: ['validationChecks'],
      properties: {
        preExperimentChecks: {
          type: 'array',
          items: { type: 'string' },
          description: 'Validation checks before launching experiment'
        },
        inflightChecks: {
          type: 'array',
          items: { type: 'string' },
          description: 'Validation checks during experiment'
        },
        postExperimentChecks: {
          type: 'array',
          items: { type: 'string' },
          description: 'Validation checks before analysis'
        },
        validationChecks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              checkName: { type: 'string' },
              checkType: { type: 'string', enum: ['completeness', 'correctness', 'consistency', 'timeliness'] },
              description: { type: 'string' },
              validationRule: { type: 'string' },
              failureAction: { type: 'string' }
            }
          },
          description: 'All validation checks to perform'
        },
        schemaValidation: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            schema: { type: 'object' }
          },
          description: 'Data schema validation'
        },
        outlierDetection: {
          type: 'object',
          properties: {
            method: { type: 'string' },
            threshold: { type: 'string' },
            handling: { type: 'string' }
          },
          description: 'How to detect and handle outliers'
        },
        invalidDataHandling: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              procedure: { type: 'string' }
            }
          },
          description: 'Procedures for handling invalid data'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'experiment-planning', 'data-quality']
}));

export const analysisPlanTask = defineTask('analysis-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Analysis Plan - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Scientist specializing in causal inference and experiment analysis',
      task: 'Design the statistical analysis plan for experiment results',
      context: {
        projectName: args.projectName,
        hypothesis: args.hypothesis,
        statisticalPlan: args.statisticalPlan,
        metricDefinition: args.metricDefinition,
        sampleSizeCalculation: args.sampleSizeCalculation,
        abTestConfig: args.abTestConfig
      },
      instructions: [
        '1. Specify the primary analysis method (statistical test, confidence intervals)',
        '2. Define decision criteria (when to declare success, neutral, or failure)',
        '3. Specify planned segmentations (analyze by user segments, time periods, etc.)',
        '4. Define sensitivity analyses to validate robustness of results',
        '5. Specify how to handle missing data or outliers in analysis',
        '6. Define procedures to check for Simpson\'s paradox',
        '7. Specify procedures to check statistical assumptions',
        '8. Define visualization and reporting requirements',
        '9. Document the analysis timeline (when analysis will be conducted)',
        '10. Create analysis code template or pseudocode'
      ],
      outputFormat: 'JSON object with complete analysis plan'
    },
    outputSchema: {
      type: 'object',
      required: ['primaryAnalysisMethod', 'decisionCriteria'],
      properties: {
        primaryAnalysisMethod: {
          type: 'object',
          properties: {
            method: { type: 'string' },
            testStatistic: { type: 'string' },
            confidenceIntervals: { type: 'boolean' },
            multipleTestingCorrection: { type: 'string' }
          },
          description: 'Primary statistical analysis approach'
        },
        decisionCriteria: {
          type: 'object',
          properties: {
            successCondition: { type: 'string' },
            neutralCondition: { type: 'string' },
            failureCondition: { type: 'string' },
            practicalSignificance: { type: 'string' }
          },
          description: 'Criteria for making go/no-go decisions'
        },
        plannedSegmentations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segmentName: { type: 'string' },
              segmentDefinition: { type: 'string' },
              rationale: { type: 'string' }
            }
          },
          description: 'Planned subgroup analyses'
        },
        sensitivityAnalyses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              analysis: { type: 'string' },
              purpose: { type: 'string' }
            }
          },
          description: 'Sensitivity analyses to validate results'
        },
        missingDataHandling: {
          type: 'string',
          description: 'How to handle missing data in analysis'
        },
        outlierHandling: {
          type: 'string',
          description: 'How to handle outliers in analysis'
        },
        assumptionChecks: {
          type: 'array',
          items: { type: 'string' },
          description: 'Checks to validate statistical assumptions'
        },
        visualizations: {
          type: 'array',
          items: { type: 'string' },
          description: 'Planned visualizations for results'
        },
        analysisTimeline: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              milestone: { type: 'string' },
              timing: { type: 'string' }
            }
          },
          description: 'When different analyses will be conducted'
        },
        analysisCodeTemplate: {
          type: 'string',
          description: 'Pseudocode or template for analysis implementation'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'experiment-planning', 'analysis']
}));

export const implementationPlanTask = defineTask('implementation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Implementation Roadmap - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Engineering Lead',
      task: 'Create detailed implementation plan for the experiment',
      context: {
        projectName: args.projectName,
        hypothesis: args.hypothesis,
        abTestConfig: args.abTestConfig,
        metricDefinition: args.metricDefinition,
        randomizationStrategy: args.randomizationStrategy,
        monitoringPlan: args.monitoringPlan,
        dataQualityPlan: args.dataQualityPlan,
        analysisPlan: args.analysisPlan
      },
      instructions: [
        '1. Break down implementation into phases (instrumentation, randomization, deployment, monitoring, analysis)',
        '2. Define tasks and subtasks for each phase',
        '3. Estimate effort for each task',
        '4. Identify dependencies between tasks',
        '5. Create timeline with milestones',
        '6. Assign ownership or skill requirements for each task',
        '7. Define rollback plan in case of critical issues',
        '8. Specify testing requirements (unit tests, integration tests, validation tests)',
        '9. Document deployment procedures',
        '10. Define next steps and handoff procedures'
      ],
      outputFormat: 'JSON object with implementation roadmap'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'timeline', 'rollbackPlan'],
      properties: {
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phaseName: { type: 'string' },
              description: { type: 'string' },
              tasks: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    taskName: { type: 'string' },
                    description: { type: 'string' },
                    estimatedEffort: { type: 'string' },
                    skillsRequired: { type: 'array', items: { type: 'string' } }
                  }
                }
              }
            }
          },
          description: 'Implementation phases'
        },
        dependencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              task: { type: 'string' },
              dependsOn: { type: 'array', items: { type: 'string' } }
            }
          },
          description: 'Task dependencies'
        },
        timeline: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              milestone: { type: 'string' },
              targetDate: { type: 'string' },
              deliverables: { type: 'array', items: { type: 'string' } }
            }
          },
          description: 'Project timeline with milestones'
        },
        rollbackPlan: {
          type: 'object',
          properties: {
            triggers: { type: 'array', items: { type: 'string' } },
            procedure: { type: 'string' },
            timeToRollback: { type: 'string' }
          },
          description: 'Plan for rolling back experiment if needed'
        },
        testingRequirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testType: { type: 'string' },
              coverage: { type: 'string' },
              criteria: { type: 'string' }
            }
          },
          description: 'Testing requirements'
        },
        deploymentProcedure: {
          type: 'string',
          description: 'Step-by-step deployment procedure'
        },
        nextSteps: {
          type: 'array',
          items: { type: 'string' },
          description: 'Immediate next steps to begin implementation'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'experiment-planning', 'implementation']
}));

export const riskAssessmentTask = defineTask('risk-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Risk Assessment and Mitigation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Risk Management Specialist',
      task: 'Identify and assess risks associated with the experiment',
      context: {
        projectName: args.projectName,
        hypothesis: args.hypothesis,
        abTestConfig: args.abTestConfig,
        implementationPlan: args.implementationPlan,
        guardrailMetrics: args.guardrailMetrics
      },
      instructions: [
        '1. Identify technical risks (implementation bugs, performance issues, data quality)',
        '2. Identify business risks (negative user impact, revenue loss, brand damage)',
        '3. Identify operational risks (monitoring failures, incident response delays)',
        '4. Identify statistical risks (insufficient power, confounding factors, bias)',
        '5. Assess severity and likelihood for each risk',
        '6. Develop mitigation strategies for each risk',
        '7. Define contingency plans for high-severity risks',
        '8. Specify early warning indicators for each risk',
        '9. Document acceptance criteria for residual risks',
        '10. Create risk monitoring and review schedule'
      ],
      outputFormat: 'JSON object with comprehensive risk assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['risks'],
      properties: {
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              riskId: { type: 'string' },
              category: { type: 'string', enum: ['technical', 'business', 'operational', 'statistical'] },
              description: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              likelihood: { type: 'string', enum: ['high', 'medium', 'low'] },
              impact: { type: 'string' },
              mitigationPlan: { type: 'string' },
              contingencyPlan: { type: 'string' },
              earlyWarningIndicators: { type: 'array', items: { type: 'string' } }
            },
            required: ['riskId', 'category', 'description', 'severity', 'likelihood']
          },
          description: 'Identified risks'
        },
        riskMatrix: {
          type: 'object',
          properties: {
            criticalRisks: { type: 'number' },
            highRisks: { type: 'number' },
            mediumRisks: { type: 'number' },
            lowRisks: { type: 'number' }
          },
          description: 'Summary of risk distribution'
        },
        acceptanceCriteria: {
          type: 'array',
          items: { type: 'string' },
          description: 'Criteria for accepting residual risks'
        },
        reviewSchedule: {
          type: 'string',
          description: 'Schedule for risk monitoring and review'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'experiment-planning', 'risk']
}));

export const experimentDocumentationTask = defineTask('experiment-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Experiment Documentation Generation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Documentation Specialist',
      task: 'Generate comprehensive experiment design documentation',
      context: {
        projectName: args.projectName,
        hypothesisFormulation: args.hypothesisFormulation,
        statisticalPlan: args.statisticalPlan,
        sampleSizeCalculation: args.sampleSizeCalculation,
        abTestConfig: args.abTestConfig,
        metricDefinition: args.metricDefinition,
        randomizationStrategy: args.randomizationStrategy,
        monitoringPlan: args.monitoringPlan,
        dataQualityPlan: args.dataQualityPlan,
        analysisPlan: args.analysisPlan,
        implementationPlan: args.implementationPlan,
        riskAssessment: args.riskAssessment,
        experimentDuration: args.experimentDuration,
        confidenceLevel: args.confidenceLevel
      },
      instructions: [
        '1. Create executive summary of the experiment',
        '2. Document the hypothesis and rationale',
        '3. Summarize the experiment design and configuration',
        '4. Document statistical methodology and sample size',
        '5. List all metrics (primary, secondary, guardrails) with definitions',
        '6. Describe randomization and assignment logic',
        '7. Summarize monitoring and alerting plan',
        '8. Document analysis plan and decision criteria',
        '9. Outline implementation phases and timeline',
        '10. Document risks and mitigation strategies',
        '11. Create both JSON (machine-readable) and Markdown (human-readable) formats',
        '12. Include quick reference tables and diagrams where helpful'
      ],
      outputFormat: 'JSON object with both structured JSON and formatted Markdown documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['json', 'markdown'],
      properties: {
        json: {
          type: 'object',
          description: 'Complete experiment design in structured JSON format'
        },
        markdown: {
          type: 'string',
          description: 'Human-readable experiment design documentation in Markdown'
        },
        summary: {
          type: 'object',
          properties: {
            projectName: { type: 'string' },
            hypothesis: { type: 'string' },
            experimentType: { type: 'string' },
            duration: { type: 'number' },
            sampleSize: { type: 'number' },
            confidenceLevel: { type: 'number' }
          },
          description: 'Quick reference summary'
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'experiment-planning', 'documentation']
}));
