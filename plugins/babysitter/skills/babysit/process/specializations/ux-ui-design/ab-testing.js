/**
 * @process ux-ui-design/ab-testing
 * @description A/B Testing for UX process with experiment design, hypothesis definition, variation creation, success metrics, implementation, statistical analysis, and data-driven recommendations
 * @inputs { projectName: string, featureDescription: string, experimentGoals: array, targetMetrics: array, trafficAllocation: object, duration: string, outputDir: string }
 * @outputs { success: boolean, experimentReport: string, winningVariation: string, statisticalSignificance: boolean, recommendations: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName = 'Project',
    featureDescription = '',
    experimentGoals = [],
    targetMetrics = ['conversion_rate', 'engagement', 'user_satisfaction'],
    targetAudience = {},
    trafficAllocation = { control: 50, variation: 50 },
    duration = '2 weeks',
    sampleSize = 1000,
    confidenceLevel = 95,
    minimumDetectableEffect = 5,
    outputDir = 'ab-testing-output',
    requireStatisticalSignificance = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting A/B Testing Process for ${projectName}`);

  // ============================================================================
  // PHASE 1: EXPERIMENT PLANNING AND SCOPING
  // ============================================================================

  ctx.log('info', 'Phase 1: Planning experiment scope and objectives');
  const experimentPlanning = await ctx.task(experimentPlanningTask, {
    projectName,
    featureDescription,
    experimentGoals,
    targetMetrics,
    targetAudience,
    duration,
    outputDir
  });

  artifacts.push(...experimentPlanning.artifacts);

  if (!experimentPlanning.planApproved) {
    ctx.log('warn', 'Experiment plan needs refinement before proceeding');
    return {
      success: false,
      reason: 'Experiment plan quality insufficient',
      recommendations: experimentPlanning.recommendations,
      metadata: {
        processId: 'ux-ui-design/ab-testing',
        timestamp: startTime
      }
    };
  }

  // ============================================================================
  // PHASE 2: HYPOTHESIS DEFINITION AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Defining testable hypothesis and success criteria');
  const hypothesisDefinition = await ctx.task(hypothesisDefinitionTask, {
    projectName,
    featureDescription,
    experimentGoals: experimentPlanning.refinedGoals,
    targetMetrics: experimentPlanning.primaryMetrics,
    currentBaseline: experimentPlanning.currentBaseline,
    outputDir
  });

  artifacts.push(...hypothesisDefinition.artifacts);

  // ============================================================================
  // PHASE 3: VARIATION DESIGN AND DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Designing and developing test variations');
  const variationDesign = await ctx.task(variationDesignTask, {
    projectName,
    featureDescription,
    hypothesis: hypothesisDefinition.hypothesis,
    designPrinciples: experimentPlanning.designPrinciples,
    userInsights: experimentPlanning.userInsights,
    outputDir
  });

  artifacts.push(...variationDesign.artifacts);

  // Breakpoint: Review variations before implementation
  await ctx.breakpoint({
    question: `Variations designed for ${projectName}. Control: ${variationDesign.control.name}, Treatment: ${variationDesign.treatment.name}. Review and approve variations?`,
    title: 'Variation Design Review',
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
        hypothesis: hypothesisDefinition.hypothesis,
        variationCount: 2,
        controlName: variationDesign.control.name,
        treatmentName: variationDesign.treatment.name,
        keyChanges: variationDesign.treatment.keyChanges
      }
    }
  });

  // ============================================================================
  // PHASE 4: SUCCESS METRICS AND MEASUREMENT PLAN
  // ============================================================================

  ctx.log('info', 'Phase 4: Defining success metrics and measurement framework');
  const metricsDefinition = await ctx.task(metricsDefinitionTask, {
    projectName,
    hypothesis: hypothesisDefinition.hypothesis,
    primaryMetrics: experimentPlanning.primaryMetrics,
    secondaryMetrics: experimentPlanning.secondaryMetrics,
    guardrailMetrics: experimentPlanning.guardrailMetrics,
    minimumDetectableEffect,
    confidenceLevel,
    outputDir
  });

  artifacts.push(...metricsDefinition.artifacts);

  // ============================================================================
  // PHASE 5: SAMPLE SIZE CALCULATION AND POWER ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Calculating required sample size and statistical power');
  const sampleSizeCalculation = await ctx.task(sampleSizeCalculationTask, {
    projectName,
    primaryMetrics: metricsDefinition.primaryMetrics,
    currentBaseline: experimentPlanning.currentBaseline,
    minimumDetectableEffect,
    confidenceLevel,
    statisticalPower: 80,
    trafficAllocation,
    expectedTraffic: experimentPlanning.expectedTraffic,
    duration,
    outputDir
  });

  artifacts.push(...sampleSizeCalculation.artifacts);

  // ============================================================================
  // PHASE 6: EXPERIMENT IMPLEMENTATION PLAN
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating experiment implementation and instrumentation plan');
  const implementationPlan = await ctx.task(implementationPlanTask, {
    projectName,
    variations: {
      control: variationDesign.control,
      treatment: variationDesign.treatment
    },
    metricsDefinition,
    trafficAllocation,
    sampleSizeRequirements: sampleSizeCalculation.requirements,
    targetAudience: experimentPlanning.targetAudience,
    outputDir
  });

  artifacts.push(...implementationPlan.artifacts);

  // ============================================================================
  // PHASE 7: QUALITY ASSURANCE AND PRE-LAUNCH VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Validating experiment setup and conducting pre-launch QA');
  const prelaunchValidation = await ctx.task(prelaunchValidationTask, {
    projectName,
    variations: {
      control: variationDesign.control,
      treatment: variationDesign.treatment
    },
    implementationPlan,
    metricsDefinition,
    trafficAllocation,
    outputDir
  });

  artifacts.push(...prelaunchValidation.artifacts);

  const validationPassed = prelaunchValidation.validationScore >= 90;

  if (!validationPassed) {
    ctx.log('warn', 'Experiment validation failed - issues must be resolved before launch');
    return {
      success: false,
      reason: 'Pre-launch validation failed',
      validationScore: prelaunchValidation.validationScore,
      issues: prelaunchValidation.issues,
      recommendations: prelaunchValidation.recommendations,
      artifacts,
      metadata: {
        processId: 'ux-ui-design/ab-testing',
        timestamp: startTime
      }
    };
  }

  // ============================================================================
  // PHASE 8: EXPERIMENT LAUNCH AND MONITORING SETUP
  // ============================================================================

  ctx.log('info', 'Phase 8: Setting up experiment monitoring and launching test');
  const experimentLaunch = await ctx.task(experimentLaunchTask, {
    projectName,
    experimentSetup: {
      hypothesis: hypothesisDefinition.hypothesis,
      variations: {
        control: variationDesign.control,
        treatment: variationDesign.treatment
      },
      metrics: metricsDefinition,
      trafficAllocation,
      duration
    },
    implementationPlan,
    monitoringChecklist: prelaunchValidation.monitoringChecklist,
    outputDir
  });

  artifacts.push(...experimentLaunch.artifacts);

  // Breakpoint: Confirm experiment launch
  await ctx.breakpoint({
    question: `Experiment ready to launch for ${projectName}. All validations passed. Launch experiment and begin data collection?`,
    title: 'Experiment Launch Confirmation',
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
        hypothesis: hypothesisDefinition.hypothesis,
        requiredSampleSize: sampleSizeCalculation.requirements.totalSampleSize,
        estimatedDuration: sampleSizeCalculation.estimatedDuration,
        validationScore: prelaunchValidation.validationScore,
        launchStatus: experimentLaunch.launchStatus
      }
    }
  });

  // ============================================================================
  // PHASE 9: DATA COLLECTION AND INTERIM MONITORING
  // ============================================================================

  ctx.log('info', 'Phase 9: Monitoring experiment progress and data quality');
  const dataMonitoring = await ctx.task(dataMonitoringTask, {
    projectName,
    experimentId: experimentLaunch.experimentId,
    metrics: metricsDefinition,
    sampleSizeRequirements: sampleSizeCalculation.requirements,
    guardrailMetrics: metricsDefinition.guardrailMetrics,
    duration,
    outputDir
  });

  artifacts.push(...dataMonitoring.artifacts);

  // ============================================================================
  // PHASE 10: STATISTICAL ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 10: Conducting statistical analysis of experiment results');
  const statisticalAnalysis = await ctx.task(statisticalAnalysisTask, {
    projectName,
    experimentId: experimentLaunch.experimentId,
    hypothesis: hypothesisDefinition.hypothesis,
    variations: {
      control: variationDesign.control,
      treatment: variationDesign.treatment
    },
    metrics: metricsDefinition,
    experimentData: dataMonitoring.collectedData,
    confidenceLevel,
    outputDir
  });

  artifacts.push(...statisticalAnalysis.artifacts);

  // ============================================================================
  // PHASE 11: RESULTS INTERPRETATION AND INSIGHTS
  // ============================================================================

  ctx.log('info', 'Phase 11: Interpreting results and generating actionable insights');
  const resultsInterpretation = await ctx.task(resultsInterpretationTask, {
    projectName,
    hypothesis: hypothesisDefinition.hypothesis,
    experimentGoals: experimentPlanning.refinedGoals,
    variations: {
      control: variationDesign.control,
      treatment: variationDesign.treatment
    },
    statisticalAnalysis,
    dataMonitoring,
    outputDir
  });

  artifacts.push(...resultsInterpretation.artifacts);

  // ============================================================================
  // PHASE 12: SEGMENTATION ANALYSIS (if significant data available)
  // ============================================================================

  let segmentationAnalysis = null;
  if (statisticalAnalysis.statisticallySignificant && dataMonitoring.collectedData.segmentDataAvailable) {
    ctx.log('info', 'Phase 12: Conducting segmentation analysis for deeper insights');
    segmentationAnalysis = await ctx.task(segmentationAnalysisTask, {
      projectName,
      experimentData: dataMonitoring.collectedData,
      statisticalAnalysis,
      userSegments: experimentPlanning.targetAudience.segments || [],
      variations: {
        control: variationDesign.control,
        treatment: variationDesign.treatment
      },
      outputDir
    });
    artifacts.push(...segmentationAnalysis.artifacts);
  }

  // ============================================================================
  // PHASE 13: RECOMMENDATIONS AND DECISION FRAMEWORK
  // ============================================================================

  ctx.log('info', 'Phase 13: Generating recommendations and rollout strategy');
  const recommendations = await ctx.task(recommendationsGenerationTask, {
    projectName,
    hypothesis: hypothesisDefinition.hypothesis,
    experimentGoals: experimentPlanning.refinedGoals,
    statisticalAnalysis,
    resultsInterpretation,
    segmentationAnalysis,
    variations: {
      control: variationDesign.control,
      treatment: variationDesign.treatment
    },
    requireStatisticalSignificance,
    outputDir
  });

  artifacts.push(...recommendations.artifacts);

  // ============================================================================
  // PHASE 14: COMPREHENSIVE EXPERIMENT REPORT
  // ============================================================================

  ctx.log('info', 'Phase 14: Generating comprehensive experiment report');
  const experimentReport = await ctx.task(experimentReportGenerationTask, {
    projectName,
    experimentPlanning,
    hypothesisDefinition,
    variationDesign,
    metricsDefinition,
    sampleSizeCalculation,
    experimentLaunch,
    dataMonitoring,
    statisticalAnalysis,
    resultsInterpretation,
    segmentationAnalysis,
    recommendations,
    outputDir
  });

  artifacts.push(...experimentReport.artifacts);

  // ============================================================================
  // PHASE 15: QUALITY SCORING AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 15: Validating experiment quality and rigor');
  const experimentQualityScore = await ctx.task(experimentQualityScoringTask, {
    projectName,
    experimentPlanning,
    hypothesisDefinition,
    variationDesign,
    sampleSizeCalculation,
    dataMonitoring,
    statisticalAnalysis,
    resultsInterpretation,
    outputDir
  });

  artifacts.push(...experimentQualityScore.artifacts);

  const experimentScore = experimentQualityScore.overallScore;
  const qualityMet = experimentScore >= 85;

  // Final breakpoint: Review complete results
  await ctx.breakpoint({
    question: `A/B test complete for ${projectName}. Quality score: ${experimentScore}/100. ${statisticalAnalysis.statisticallySignificant ? 'Statistically significant results!' : 'Results not statistically significant.'} Winner: ${recommendations.winningVariation}. Review and approve?`,
    title: 'Final Experiment Results Review',
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
        experimentScore,
        qualityMet,
        hypothesis: hypothesisDefinition.hypothesis,
        hypothesisValidated: resultsInterpretation.hypothesisValidated,
        statisticallySignificant: statisticalAnalysis.statisticallySignificant,
        winningVariation: recommendations.winningVariation,
        primaryMetricImprovement: statisticalAnalysis.primaryMetricLift,
        confidenceLevel: statisticalAnalysis.confidenceLevel,
        sampleSize: dataMonitoring.collectedData.totalSampleSize,
        recommendation: recommendations.primaryRecommendation
      }
    }
  });

  const endTime = ctx.now();
  const duration_ms = endTime - startTime;

  return {
    success: true,
    projectName,
    experimentScore,
    qualityMet,
    experimentReport: experimentReport.reportPath,
    experimentId: experimentLaunch.experimentId,
    hypothesis: {
      statement: hypothesisDefinition.hypothesis,
      validated: resultsInterpretation.hypothesisValidated,
      confidence: resultsInterpretation.confidence
    },
    variations: {
      control: {
        name: variationDesign.control.name,
        description: variationDesign.control.description
      },
      treatment: {
        name: variationDesign.treatment.name,
        description: variationDesign.treatment.description,
        keyChanges: variationDesign.treatment.keyChanges
      }
    },
    metrics: {
      primary: metricsDefinition.primaryMetrics,
      secondary: metricsDefinition.secondaryMetrics,
      guardrail: metricsDefinition.guardrailMetrics
    },
    sampleSize: {
      required: sampleSizeCalculation.requirements.totalSampleSize,
      collected: dataMonitoring.collectedData.totalSampleSize,
      control: dataMonitoring.collectedData.controlSampleSize,
      treatment: dataMonitoring.collectedData.treatmentSampleSize
    },
    results: {
      statisticallySignificant: statisticalAnalysis.statisticallySignificant,
      confidenceLevel: statisticalAnalysis.confidenceLevel,
      pValue: statisticalAnalysis.pValue,
      winningVariation: recommendations.winningVariation,
      primaryMetricLift: statisticalAnalysis.primaryMetricLift,
      secondaryMetricResults: statisticalAnalysis.secondaryMetricResults,
      guardrailMetricsPassed: statisticalAnalysis.guardrailMetricsPassed
    },
    insights: {
      keyFindings: resultsInterpretation.keyFindings,
      userBehaviorInsights: resultsInterpretation.userBehaviorInsights,
      unexpectedFindings: resultsInterpretation.unexpectedFindings
    },
    segmentation: segmentationAnalysis ? {
      performanceBySegment: segmentationAnalysis.performanceBySegment,
      targetSegments: segmentationAnalysis.targetSegments,
      differentialImpact: segmentationAnalysis.differentialImpact
    } : null,
    recommendations: {
      primaryRecommendation: recommendations.primaryRecommendation,
      rolloutStrategy: recommendations.rolloutStrategy,
      nextSteps: recommendations.nextSteps,
      learnings: recommendations.learnings,
      futureExperiments: recommendations.futureExperiments
    },
    artifacts,
    duration: duration_ms,
    metadata: {
      processId: 'ux-ui-design/ab-testing',
      timestamp: startTime,
      experimentDuration: duration,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Experiment Planning and Scoping
export const experimentPlanningTask = defineTask('experiment-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan experiment scope and objectives',
  agent: {
    name: 'experiment-planner',
    prompt: {
      role: 'senior UX researcher and experimentation strategist',
      task: 'Develop comprehensive A/B test plan with clear objectives, success criteria, and strategic alignment',
      context: args,
      instructions: [
        'Review and clarify the feature/change being tested and its context',
        'Refine experiment goals to be specific, measurable, achievable, relevant, time-bound (SMART)',
        'Understand business objectives and how this experiment supports them',
        'Identify primary metrics most important to business goals',
        'Define secondary metrics that provide additional insights',
        'Define guardrail metrics to ensure no negative side effects (e.g., page load time, error rates)',
        'Research current baseline performance for target metrics',
        'Identify target audience and any segmentation needs',
        'Review existing user research and insights relevant to this test',
        'Identify UX design principles that should guide variations',
        'Estimate available traffic and calculate expected sample size per day',
        'Assess potential risks and mitigation strategies',
        'Validate experiment is worth running (high enough expected impact)',
        'Create experiment planning document with all key details',
        'Approve or flag issues requiring resolution'
      ],
      outputFormat: 'JSON with refinedGoals (array), primaryMetrics (array), secondaryMetrics (array), guardrailMetrics (array), currentBaseline (object), targetAudience (object), userInsights (array), designPrinciples (array), expectedTraffic (number), risks (array), planApproved (boolean), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['refinedGoals', 'primaryMetrics', 'planApproved', 'artifacts'],
      properties: {
        refinedGoals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              goal: { type: 'string' },
              businessValue: { type: 'string' },
              successCriteria: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        primaryMetrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              description: { type: 'string' },
              calculationMethod: { type: 'string' },
              improvementDirection: { type: 'string', enum: ['increase', 'decrease'] }
            }
          }
        },
        secondaryMetrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              description: { type: 'string' },
              purpose: { type: 'string' }
            }
          }
        },
        guardrailMetrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              threshold: { type: 'string' },
              acceptableDegradation: { type: 'string' }
            }
          }
        },
        currentBaseline: {
          type: 'object',
          properties: {
            metrics: { type: 'object' },
            dataSource: { type: 'string' },
            timeframe: { type: 'string' }
          }
        },
        targetAudience: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            segments: { type: 'array', items: { type: 'string' } },
            inclusionCriteria: { type: 'array', items: { type: 'string' } },
            exclusionCriteria: { type: 'array', items: { type: 'string' } }
          }
        },
        userInsights: { type: 'array', items: { type: 'string' } },
        designPrinciples: { type: 'array', items: { type: 'string' } },
        expectedTraffic: { type: 'number' },
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              likelihood: { type: 'string', enum: ['low', 'medium', 'high'] },
              impact: { type: 'string', enum: ['low', 'medium', 'high'] },
              mitigation: { type: 'string' }
            }
          }
        },
        planApproved: { type: 'boolean' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'experiment-planning']
}));

// Task 2: Hypothesis Definition and Validation
export const hypothesisDefinitionTask = defineTask('hypothesis-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define testable hypothesis and success criteria',
  agent: {
    name: 'hypothesis-designer',
    prompt: {
      role: 'UX researcher and experimentation scientist',
      task: 'Create clear, testable hypothesis following scientific method with specific predictions and measurable outcomes',
      context: args,
      instructions: [
        'Review experiment goals and user insights from planning phase',
        'Formulate hypothesis using standard format: "We believe that [change] will result in [outcome] because [rationale]"',
        'Ensure hypothesis is:',
        '  - Specific and unambiguous',
        '  - Testable with available metrics',
        '  - Based on user research or data insights',
        '  - Falsifiable (can be proven wrong)',
        '  - Actionable (leads to clear decision)',
        'Define null hypothesis (no difference between variations)',
        'Define alternative hypothesis (treatment differs from control)',
        'Specify directional expectation (one-tailed) or non-directional (two-tailed)',
        'Ground hypothesis in psychological/behavioral theory or user research',
        'Define specific success criteria for each primary metric',
        'Identify what would constitute a meaningful improvement',
        'Document assumptions underlying the hypothesis',
        'Validate hypothesis quality and clarity',
        'Generate hypothesis document with rationale and predictions'
      ],
      outputFormat: 'JSON with hypothesis (string), nullHypothesis (string), alternativeHypothesis (string), testType (string), rationale (string), theoreticalBasis (string), assumptions (array), successCriteria (object), predictedOutcome (object), hypothesisQuality (number 0-100), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['hypothesis', 'nullHypothesis', 'successCriteria', 'artifacts'],
      properties: {
        hypothesis: { type: 'string' },
        nullHypothesis: { type: 'string' },
        alternativeHypothesis: { type: 'string' },
        testType: { type: 'string', enum: ['one-tailed', 'two-tailed'] },
        rationale: { type: 'string' },
        theoreticalBasis: { type: 'string' },
        assumptions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              assumption: { type: 'string' },
              validation: { type: 'string' }
            }
          }
        },
        successCriteria: {
          type: 'object',
          properties: {
            primaryMetric: { type: 'string' },
            minimumImprovement: { type: 'string' },
            targetImprovement: { type: 'string' },
            statisticalSignificanceRequired: { type: 'boolean' }
          }
        },
        predictedOutcome: {
          type: 'object',
          properties: {
            primaryMetricChange: { type: 'string' },
            secondaryMetricChanges: { type: 'array', items: { type: 'string' } },
            confidence: { type: 'string', enum: ['low', 'medium', 'high'] }
          }
        },
        hypothesisQuality: { type: 'number', minimum: 0, maximum: 100 },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'hypothesis-definition']
}));

// Task 3: Variation Design and Development
export const variationDesignTask = defineTask('variation-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design and develop test variations',
  agent: {
    name: 'variation-designer',
    prompt: {
      role: 'senior UX/UI designer and experimentation specialist',
      task: 'Design control and treatment variations that isolate the variable being tested while maintaining design quality',
      context: args,
      instructions: [
        'Define control variation (baseline/current experience):',
        '  - Document current design/behavior being tested against',
        '  - Capture screenshots or wireframes',
        '  - Document current UX flow',
        'Design treatment variation (experimental change):',
        '  - Apply hypothesis-driven changes',
        '  - Ensure single variable isolation (change one thing at a time for clear attribution)',
        '  - Follow design principles and maintain brand consistency',
        '  - Consider user insights from research',
        '  - Document key changes and rationale',
        'For each variation:',
        '  - Create high-fidelity mockups or prototypes',
        '  - Document interaction patterns and micro-interactions',
        '  - Specify copy changes (if any)',
        '  - Define visual hierarchy and layout',
        '  - Ensure accessibility compliance (WCAG)',
        '  - Document technical implementation requirements',
        'Validate variations:',
        '  - Ensure variations differ only in intended variable',
        '  - Check both variations provide equivalent functionality',
        '  - Verify no confounding variables',
        '  - Get design review approval',
        'Create variation specifications for engineering',
        'Generate visual comparison documentation'
      ],
      outputFormat: 'JSON with control (object with name, description, mockups, specifications), treatment (object with name, description, keyChanges, mockups, specifications, rationale), isolatedVariable (string), confoundingVariablesCheck (boolean), accessibilityValidation (boolean), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['control', 'treatment', 'isolatedVariable', 'artifacts'],
      properties: {
        control: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            userFlow: { type: 'string' },
            keyElements: { type: 'array', items: { type: 'string' } },
            mockupPaths: { type: 'array', items: { type: 'string' } },
            specifications: { type: 'object' }
          }
        },
        treatment: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            keyChanges: { type: 'array', items: { type: 'string' } },
            changeRationale: { type: 'string' },
            userFlow: { type: 'string' },
            keyElements: { type: 'array', items: { type: 'string' } },
            mockupPaths: { type: 'array', items: { type: 'string' } },
            specifications: { type: 'object' },
            implementationNotes: { type: 'array', items: { type: 'string' } }
          }
        },
        isolatedVariable: { type: 'string' },
        confoundingVariablesCheck: { type: 'boolean' },
        accessibilityValidation: {
          type: 'object',
          properties: {
            compliant: { type: 'boolean' },
            wcagLevel: { type: 'string' },
            issues: { type: 'array', items: { type: 'string' } }
          }
        },
        designReviewApproval: { type: 'boolean' },
        technicalFeasibility: { type: 'string', enum: ['straightforward', 'moderate', 'complex'] },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'variation-design']
}));

// Task 4: Success Metrics and Measurement Plan
export const metricsDefinitionTask = defineTask('metrics-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define success metrics and measurement framework',
  agent: {
    name: 'metrics-specialist',
    prompt: {
      role: 'data analyst and experimentation measurement expert',
      task: 'Define comprehensive measurement plan with primary, secondary, and guardrail metrics with clear calculation methods',
      context: args,
      instructions: [
        'For each primary metric:',
        '  - Define precise calculation formula',
        '  - Specify data sources and tracking events',
        '  - Define numerator and denominator clearly',
        '  - Specify time windows for measurement',
        '  - Define minimum detectable effect for power calculation',
        'For each secondary metric:',
        '  - Define calculation method',
        '  - Explain what insights it provides',
        '  - Specify tracking requirements',
        'For each guardrail metric:',
        '  - Define threshold for acceptable degradation',
        '  - Specify alert conditions',
        '  - Define monitoring frequency',
        'Specify metric collection methodology:',
        '  - Event tracking requirements',
        '  - User identification/session tracking',
        '  - Attribution windows',
        '  - Data quality checks',
        'Define metric aggregation:',
        '  - User-level vs session-level vs page-level',
        '  - Outlier handling strategy',
        '  - Statistical method (t-test, chi-square, etc.)',
        'Create instrumentation plan:',
        '  - Event schema definitions',
        '  - Analytics implementation requirements',
        '  - QA testing plan for tracking',
        'Generate comprehensive metrics documentation'
      ],
      outputFormat: 'JSON with primaryMetrics (array with detailed specs), secondaryMetrics (array), guardrailMetrics (array), metricCalculations (object), dataCollection (object), instrumentationPlan (object), statisticalMethods (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['primaryMetrics', 'secondaryMetrics', 'guardrailMetrics', 'artifacts'],
      properties: {
        primaryMetrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              description: { type: 'string' },
              formula: { type: 'string' },
              numerator: { type: 'string' },
              denominator: { type: 'string' },
              aggregationLevel: { type: 'string', enum: ['user', 'session', 'page-view', 'event'] },
              dataSource: { type: 'string' },
              trackingEvents: { type: 'array', items: { type: 'string' } },
              timeWindow: { type: 'string' },
              statisticalTest: { type: 'string' }
            }
          }
        },
        secondaryMetrics: { type: 'array' },
        guardrailMetrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              currentValue: { type: 'string' },
              acceptableThreshold: { type: 'string' },
              alertCondition: { type: 'string' }
            }
          }
        },
        metricCalculations: {
          type: 'object',
          additionalProperties: { type: 'string' }
        },
        dataCollection: {
          type: 'object',
          properties: {
            userIdentification: { type: 'string' },
            sessionTracking: { type: 'string' },
            attributionWindow: { type: 'string' },
            outlierHandling: { type: 'string' }
          }
        },
        instrumentationPlan: {
          type: 'object',
          properties: {
            eventSchemas: { type: 'array' },
            analyticsImplementation: { type: 'array', items: { type: 'string' } },
            qaTestingSteps: { type: 'array', items: { type: 'string' } }
          }
        },
        statisticalMethods: {
          type: 'object',
          properties: {
            primaryTest: { type: 'string' },
            multipleTestingCorrection: { type: 'string' },
            outlierDetection: { type: 'string' }
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
  labels: ['agent', 'ab-testing', 'metrics-definition']
}));

// Task 5: Sample Size Calculation and Power Analysis
export const sampleSizeCalculationTask = defineTask('sample-size-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate required sample size and statistical power',
  agent: {
    name: 'statistician',
    prompt: {
      role: 'statistician and experimentation analyst',
      task: 'Calculate minimum required sample size using statistical power analysis to ensure experiment can detect meaningful effects',
      context: args,
      instructions: [
        'For each primary metric, perform sample size calculation:',
        '  - Use baseline metric value from current data',
        '  - Apply minimum detectable effect (MDE) percentage',
        '  - Use specified confidence level (typically 95%)',
        '  - Use statistical power (typically 80%)',
        '  - Account for traffic allocation split',
        '  - Use appropriate statistical test (z-test for proportions, t-test for continuous)',
        'Calculate sample size per variation',
        'Calculate total sample size needed',
        'Based on expected daily traffic, estimate experiment duration',
        'Assess if duration is practical (2-4 weeks ideal, not too long)',
        'If duration too long:',
        '  - Consider increasing MDE (accept detecting larger effects)',
        '  - Consider increasing traffic allocation',
        '  - Flag if experiment may not be feasible',
        'Perform sensitivity analysis:',
        '  - Show sample size for different MDEs',
        '  - Show duration for different traffic levels',
        'Calculate statistical power curves',
        'Generate power analysis report with recommendations',
        'Create sample size calculator documentation'
      ],
      outputFormat: 'JSON with requirements (object with totalSampleSize, perVariation, confidenceLevel, statisticalPower, mde), estimatedDuration (string), durationFeasible (boolean), sensitivityAnalysis (object), powerAnalysis (object), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements', 'estimatedDuration', 'durationFeasible', 'artifacts'],
      properties: {
        requirements: {
          type: 'object',
          properties: {
            totalSampleSize: { type: 'number' },
            controlSampleSize: { type: 'number' },
            treatmentSampleSize: { type: 'number' },
            perMetricRequirements: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  metric: { type: 'string' },
                  sampleSize: { type: 'number' },
                  baselineValue: { type: 'number' },
                  mde: { type: 'number' }
                }
              }
            },
            confidenceLevel: { type: 'number' },
            statisticalPower: { type: 'number' },
            effectSize: { type: 'number' }
          }
        },
        estimatedDuration: { type: 'string' },
        durationFeasible: { type: 'boolean' },
        sensitivityAnalysis: {
          type: 'object',
          properties: {
            mdeSensitivity: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  mde: { type: 'number' },
                  sampleSize: { type: 'number' },
                  duration: { type: 'string' }
                }
              }
            },
            trafficSensitivity: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  trafficPercentage: { type: 'number' },
                  duration: { type: 'string' }
                }
              }
            }
          }
        },
        powerAnalysis: {
          type: 'object',
          properties: {
            achievedPower: { type: 'number' },
            minimumDetectableEffects: { type: 'object' },
            powerCurves: { type: 'array' }
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
  labels: ['agent', 'ab-testing', 'sample-size-calculation']
}));

// Task 6: Experiment Implementation Plan
export const implementationPlanTask = defineTask('implementation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create experiment implementation and instrumentation plan',
  agent: {
    name: 'implementation-planner',
    prompt: {
      role: 'technical product manager and experimentation engineer',
      task: 'Create detailed implementation plan including technical setup, randomization, tracking, and rollout strategy',
      context: args,
      instructions: [
        'Define experiment configuration:',
        '  - Experiment name and ID',
        '  - Variation names and allocation percentages',
        '  - Target audience rules and filters',
        '  - Start date and planned duration',
        '  - Stopping criteria',
        'Specify randomization approach:',
        '  - User-level vs session-level randomization',
        '  - Randomization algorithm (consistent hashing)',
        '  - Assignment persistence strategy',
        '  - Cross-experiment interference prevention',
        'Define implementation approach:',
        '  - Client-side vs server-side implementation',
        '  - Feature flag configuration',
        '  - Code changes required',
        '  - A/B testing tool setup (Optimizely, VWO, Google Optimize, etc.)',
        'Create tracking implementation plan:',
        '  - Event tracking code placement',
        '  - Data layer updates',
        '  - Analytics tool configuration',
        '  - Custom event definitions',
        'Specify QA requirements:',
        '  - Variation rendering validation',
        '  - Tracking verification steps',
        '  - Cross-browser/device testing',
        '  - Edge case handling',
        'Define rollout strategy:',
        '  - Gradual ramp-up plan (start at 10%, then 50%, then 100%)',
        '  - Monitoring checkpoints',
        '  - Rollback procedures',
        'Create implementation documentation and checklist'
      ],
      outputFormat: 'JSON with experimentConfig (object), randomizationSpec (object), implementationApproach (object), trackingImplementation (array), qaRequirements (array), rolloutStrategy (object), technicalSpecs (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['experimentConfig', 'randomizationSpec', 'implementationApproach', 'artifacts'],
      properties: {
        experimentConfig: {
          type: 'object',
          properties: {
            experimentName: { type: 'string' },
            experimentId: { type: 'string' },
            variations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  variationId: { type: 'string' },
                  name: { type: 'string' },
                  allocation: { type: 'number' }
                }
              }
            },
            targetAudience: { type: 'object' },
            duration: { type: 'string' }
          }
        },
        randomizationSpec: {
          type: 'object',
          properties: {
            randomizationUnit: { type: 'string', enum: ['user', 'session', 'device'] },
            algorithm: { type: 'string' },
            assignmentPersistence: { type: 'string' },
            preventCrossExperimentInterference: { type: 'boolean' }
          }
        },
        implementationApproach: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['client-side', 'server-side', 'hybrid'] },
            platform: { type: 'string' },
            featureFlagIntegration: { type: 'boolean' },
            codeChanges: { type: 'array', items: { type: 'string' } },
            estimatedEffort: { type: 'string' }
          }
        },
        trackingImplementation: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              event: { type: 'string' },
              placement: { type: 'string' },
              parameters: { type: 'array', items: { type: 'string' } },
              implementationCode: { type: 'string' }
            }
          }
        },
        qaRequirements: { type: 'array', items: { type: 'string' } },
        rolloutStrategy: {
          type: 'object',
          properties: {
            phases: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  phase: { type: 'string' },
                  trafficPercentage: { type: 'number' },
                  duration: { type: 'string' },
                  successCriteria: { type: 'string' }
                }
              }
            },
            monitoringCheckpoints: { type: 'array', items: { type: 'string' } },
            rollbackProcedure: { type: 'string' }
          }
        },
        technicalSpecs: { type: 'object' },
        implementationChecklist: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'implementation-planning']
}));

// Task 7: Pre-launch Validation and QA
export const prelaunchValidationTask = defineTask('prelaunch-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate experiment setup and conduct pre-launch QA',
  agent: {
    name: 'qa-specialist',
    prompt: {
      role: 'QA engineer and experimentation quality specialist',
      task: 'Thoroughly validate experiment implementation, tracking, and configuration before launch',
      context: args,
      instructions: [
        'Validate variation rendering:',
        '  - Test control variation displays correctly',
        '  - Test treatment variation displays correctly',
        '  - Verify isolated variable is the only difference',
        '  - Test across browsers (Chrome, Firefox, Safari, Edge)',
        '  - Test across devices (desktop, mobile, tablet)',
        '  - Test responsive behavior',
        'Validate randomization:',
        '  - Verify users consistently see same variation',
        '  - Check allocation percentages are correct',
        '  - Test audience targeting rules',
        '  - Verify no cross-contamination between variations',
        'Validate tracking implementation:',
        '  - Fire test events and verify data collection',
        '  - Check all metrics are being tracked correctly',
        '  - Verify event parameters are correct',
        '  - Test tracking for both variations',
        '  - Validate data appears in analytics dashboard',
        'Validate experiment configuration:',
        '  - Review experiment settings in A/B testing tool',
        '  - Verify traffic allocation settings',
        '  - Check audience targeting configuration',
        '  - Validate metric definitions',
        'Conduct pre-flight checklist:',
        '  - Hypothesis documented',
        '  - Success criteria defined',
        '  - Sample size calculated',
        '  - Variations approved by stakeholders',
        '  - Tracking implemented and tested',
        '  - Monitoring dashboard ready',
        '  - Team notified of launch',
        'Calculate validation score based on checks passed',
        'Flag critical issues blocking launch',
        'Generate pre-launch validation report'
      ],
      outputFormat: 'JSON with validationScore (number 0-100), checksPerformed (array), checksPassed (number), checksTotal (number), variationRenderingValid (boolean), randomizationValid (boolean), trackingValid (boolean), criticalIssues (array), minorIssues (array), readyToLaunch (boolean), monitoringChecklist (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['validationScore', 'checksPerformed', 'readyToLaunch', 'artifacts'],
      properties: {
        validationScore: { type: 'number', minimum: 0, maximum: 100 },
        checksPerformed: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              check: { type: 'string' },
              category: { type: 'string' },
              status: { type: 'string', enum: ['passed', 'failed', 'warning'] },
              details: { type: 'string' }
            }
          }
        },
        checksPassed: { type: 'number' },
        checksTotal: { type: 'number' },
        variationRenderingValid: { type: 'boolean' },
        randomizationValid: { type: 'boolean' },
        trackingValid: { type: 'boolean' },
        crossBrowserTesting: {
          type: 'object',
          properties: {
            chrome: { type: 'boolean' },
            firefox: { type: 'boolean' },
            safari: { type: 'boolean' },
            edge: { type: 'boolean' }
          }
        },
        criticalIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              severity: { type: 'string', enum: ['blocker', 'critical', 'major'] },
              resolution: { type: 'string' }
            }
          }
        },
        minorIssues: { type: 'array', items: { type: 'string' } },
        readyToLaunch: { type: 'boolean' },
        monitoringChecklist: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'validation', 'qa']
}));

// Task 8: Experiment Launch and Monitoring Setup
export const experimentLaunchTask = defineTask('experiment-launch', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Launch experiment and set up monitoring',
  agent: {
    name: 'experiment-launcher',
    prompt: {
      role: 'experimentation platform manager and launch coordinator',
      task: 'Launch A/B test, configure monitoring, and ensure smooth experiment start',
      context: args,
      instructions: [
        'Execute launch sequence:',
        '  - Enable experiment in A/B testing platform',
        '  - Start with conservative traffic allocation (10-20% if ramping)',
        '  - Verify experiment is live and serving variations',
        '  - Confirm randomization working correctly',
        '  - Check initial data collection',
        'Set up real-time monitoring dashboard:',
        '  - Display sample size progress for each variation',
        '  - Show primary metric trends',
        '  - Monitor guardrail metrics',
        '  - Set up alerts for anomalies',
        '  - Track data quality metrics (missing data, outliers)',
        'Configure automated checks:',
        '  - Sample Ratio Mismatch (SRM) detection',
        '  - Traffic allocation verification',
        '  - Metric movement alerts',
        '  - Data collection health checks',
        'Document launch details:',
        '  - Experiment ID',
        '  - Launch timestamp',
        '  - Initial traffic allocation',
        '  - Monitoring dashboard URLs',
        '  - Responsible team members',
        'Notify stakeholders:',
        '  - Send launch notification',
        '  - Share monitoring dashboard',
        '  - Provide experiment overview',
        '  - Set expectations for results timing',
        'Perform post-launch verification:',
        '  - Check first hour of data collection',
        '  - Verify no technical issues',
        '  - Confirm Sample Ratio Mismatch (SRM) is within acceptable range',
        'Generate launch report with status and monitoring links'
      ],
      outputFormat: 'JSON with experimentId (string), launchTimestamp (string), launchStatus (string), trafficAllocation (object), monitoringDashboardUrls (array), dataCollectionStatus (string), srmCheck (object), postLaunchVerification (object), stakeholdersNotified (boolean), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['experimentId', 'launchTimestamp', 'launchStatus', 'artifacts'],
      properties: {
        experimentId: { type: 'string' },
        launchTimestamp: { type: 'string' },
        launchStatus: { type: 'string', enum: ['launched', 'ramping', 'paused', 'failed'] },
        trafficAllocation: {
          type: 'object',
          properties: {
            control: { type: 'number' },
            treatment: { type: 'number' }
          }
        },
        monitoringDashboardUrls: { type: 'array', items: { type: 'string' } },
        dataCollectionStatus: { type: 'string', enum: ['healthy', 'issues-detected', 'failing'] },
        srmCheck: {
          type: 'object',
          properties: {
            passed: { type: 'boolean' },
            expectedRatio: { type: 'string' },
            observedRatio: { type: 'string' },
            pValue: { type: 'number' }
          }
        },
        postLaunchVerification: {
          type: 'object',
          properties: {
            variationsServing: { type: 'boolean' },
            trackingWorking: { type: 'boolean' },
            noTechnicalIssues: { type: 'boolean' },
            dataQualityGood: { type: 'boolean' }
          }
        },
        automatedAlerts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alertType: { type: 'string' },
              condition: { type: 'string' },
              enabled: { type: 'boolean' }
            }
          }
        },
        stakeholdersNotified: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'launch']
}));

// Task 9: Data Collection and Interim Monitoring
export const dataMonitoringTask = defineTask('data-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Monitor experiment progress and data quality',
  agent: {
    name: 'data-monitor',
    prompt: {
      role: 'data analyst and experiment monitoring specialist',
      task: 'Continuously monitor experiment progress, data quality, and detect issues early',
      context: args,
      instructions: [
        'Monitor sample size accumulation:',
        '  - Track daily sample size for control and treatment',
        '  - Calculate progress toward target sample size',
        '  - Estimate completion date',
        '  - Flag if experiment running slower than expected',
        'Monitor Sample Ratio Mismatch (SRM):',
        '  - Daily check that traffic split matches configuration',
        '  - Alert if deviation exceeds threshold (p-value < 0.001)',
        '  - Investigate SRM issues if detected',
        'Monitor data quality:',
        '  - Check for missing data or tracking failures',
        '  - Detect outliers and anomalies',
        '  - Verify metric distributions look normal',
        '  - Check for bot traffic or spam',
        'Monitor guardrail metrics:',
        '  - Continuously check guardrail thresholds',
        '  - Alert if any guardrail violated',
        '  - Recommend early stopping if critical guardrail broken',
        'Interim results monitoring (without peeking bias):',
        '  - Use sequential testing or Bayesian methods if checking early',
        '  - Apply adjusted significance levels if checking multiple times',
        '  - Note: frequent peeking inflates false positive rate',
        'Check for novelty/primacy effects:',
        '  - Monitor if effect changes over time',
        '  - Compare first week vs subsequent weeks',
        'Collect experiment data for final analysis:',
        '  - Aggregate user-level metrics',
        '  - Prepare data exports',
        '  - Document data quality issues encountered',
        'Generate monitoring report with current status and recommendations'
      ],
      outputFormat: 'JSON with collectedData (object), sampleProgress (object), srmChecks (object), dataQualityScore (number 0-100), guardrailStatus (object), interimResults (object), issues (array), earlyStoppingRecommendation (boolean), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['collectedData', 'sampleProgress', 'dataQualityScore', 'artifacts'],
      properties: {
        collectedData: {
          type: 'object',
          properties: {
            totalSampleSize: { type: 'number' },
            controlSampleSize: { type: 'number' },
            treatmentSampleSize: { type: 'number' },
            dateRange: { type: 'string' },
            segmentDataAvailable: { type: 'boolean' },
            dataExportPaths: { type: 'array', items: { type: 'string' } }
          }
        },
        sampleProgress: {
          type: 'object',
          properties: {
            targetSampleSize: { type: 'number' },
            currentSampleSize: { type: 'number' },
            percentComplete: { type: 'number' },
            dailyRate: { type: 'number' },
            estimatedCompletionDate: { type: 'string' }
          }
        },
        srmChecks: {
          type: 'object',
          properties: {
            passed: { type: 'boolean' },
            pValue: { type: 'number' },
            expectedSplit: { type: 'string' },
            observedSplit: { type: 'string' },
            recommendation: { type: 'string' }
          }
        },
        dataQualityScore: { type: 'number', minimum: 0, maximum: 100 },
        dataQualityIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
              impact: { type: 'string' }
            }
          }
        },
        guardrailStatus: {
          type: 'object',
          properties: {
            allPassed: { type: 'boolean' },
            violations: { type: 'array', items: { type: 'string' } }
          }
        },
        interimResults: {
          type: 'object',
          properties: {
            trendsObserved: { type: 'array', items: { type: 'string' } },
            earlySignals: { type: 'string' },
            noveltyEffectDetected: { type: 'boolean' }
          }
        },
        issues: { type: 'array', items: { type: 'string' } },
        earlyStoppingRecommendation: { type: 'boolean' },
        earlyStoppingReason: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'monitoring']
}));

// Task 10: Statistical Analysis
export const statisticalAnalysisTask = defineTask('statistical-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct statistical analysis of experiment results',
  agent: {
    name: 'statistical-analyst',
    prompt: {
      role: 'statistician and experiment analyst',
      task: 'Perform rigorous statistical analysis to determine if treatment effect is real and significant',
      context: args,
      instructions: [
        'For each primary metric:',
        '  - Calculate metric value for control group',
        '  - Calculate metric value for treatment group',
        '  - Calculate absolute difference (treatment - control)',
        '  - Calculate relative lift percentage',
        '  - Perform appropriate statistical test (t-test for continuous, z-test for proportions)',
        '  - Calculate p-value',
        '  - Determine statistical significance (p < 0.05 for 95% confidence)',
        '  - Calculate confidence interval for effect size',
        'For secondary metrics:',
        '  - Perform same analysis',
        '  - Apply multiple testing correction (Bonferroni or Benjamini-Hochberg)',
        '  - Report adjusted significance levels',
        'Check statistical assumptions:',
        '  - Normality of distributions (if using t-test)',
        '  - Independence of observations',
        '  - Sufficient sample size achieved',
        '  - No SRM violations',
        'Calculate effect size measures:',
        '  - Cohen\'s d or similar for practical significance',
        '  - Interpret effect size (small/medium/large)',
        'Perform sensitivity analyses:',
        '  - Analysis without outliers',
        '  - Subgroup analyses if warranted',
        '  - Time-based analysis (early vs late periods)',
        'Check for Simpson\'s paradox or other statistical anomalies',
        'Generate comprehensive statistical report:',
        '  - Summary statistics for all metrics',
        '  - Test results with p-values and confidence intervals',
        '  - Visualizations (distributions, confidence intervals)',
        '  - Statistical significance determination'
      ],
      outputFormat: 'JSON with primaryMetricResults (object), secondaryMetricResults (array), statisticallySignificant (boolean), confidenceLevel (number), pValue (number), primaryMetricLift (string), effectSize (object), confidenceIntervals (object), guardrailMetricsPassed (boolean), statisticalAssumptionsMet (boolean), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['primaryMetricResults', 'statisticallySignificant', 'pValue', 'artifacts'],
      properties: {
        primaryMetricResults: {
          type: 'object',
          properties: {
            metric: { type: 'string' },
            controlValue: { type: 'number' },
            treatmentValue: { type: 'number' },
            absoluteDifference: { type: 'number' },
            relativeLift: { type: 'number' },
            pValue: { type: 'number' },
            statisticallySignificant: { type: 'boolean' },
            confidenceInterval: {
              type: 'object',
              properties: {
                lower: { type: 'number' },
                upper: { type: 'number' },
                level: { type: 'number' }
              }
            }
          }
        },
        secondaryMetricResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              controlValue: { type: 'number' },
              treatmentValue: { type: 'number' },
              relativeLift: { type: 'number' },
              pValue: { type: 'number' },
              adjustedPValue: { type: 'number' },
              statisticallySignificant: { type: 'boolean' }
            }
          }
        },
        statisticallySignificant: { type: 'boolean' },
        confidenceLevel: { type: 'number' },
        pValue: { type: 'number' },
        primaryMetricLift: { type: 'string' },
        effectSize: {
          type: 'object',
          properties: {
            value: { type: 'number' },
            interpretation: { type: 'string', enum: ['negligible', 'small', 'medium', 'large'] },
            practicallySignificant: { type: 'boolean' }
          }
        },
        confidenceIntervals: { type: 'object' },
        guardrailMetricsPassed: { type: 'boolean' },
        guardrailViolations: { type: 'array', items: { type: 'string' } },
        statisticalAssumptionsMet: { type: 'boolean' },
        statisticalTests: {
          type: 'object',
          properties: {
            primaryTest: { type: 'string' },
            multipleTestingCorrection: { type: 'string' }
          }
        },
        sensitivityAnalysis: {
          type: 'object',
          properties: {
            withoutOutliers: { type: 'object' },
            timeBasedAnalysis: { type: 'object' }
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
  labels: ['agent', 'ab-testing', 'statistical-analysis']
}));

// Task 11: Results Interpretation and Insights
export const resultsInterpretationTask = defineTask('results-interpretation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Interpret results and generate actionable insights',
  agent: {
    name: 'insights-analyst',
    prompt: {
      role: 'senior UX researcher and data storyteller',
      task: 'Interpret statistical results in business context, validate hypothesis, and extract actionable insights',
      context: args,
      instructions: [
        'Hypothesis validation:',
        '  - Was hypothesis supported or refuted by data?',
        '  - Did treatment perform as predicted?',
        '  - State confidence level in conclusion',
        'Primary metric interpretation:',
        '  - Translate statistical results to business impact',
        '  - Calculate projected business value of improvement',
        '  - Assess practical significance (is lift meaningful?)',
        'Secondary metric analysis:',
        '  - Identify supporting or contradictory signals',
        '  - Understand holistic impact on user experience',
        '  - Flag unexpected metric movements',
        'Behavioral insights:',
        '  - What did we learn about user behavior?',
        '  - Why did treatment perform better/worse?',
        '  - What user needs were addressed?',
        'Identify unexpected findings:',
        '  - Surprising results that warrant further investigation',
        '  - Counter-intuitive outcomes',
        '  - Confounding factors discovered',
        'Qualitative context:',
        '  - Incorporate any qualitative feedback collected',
        '  - Consider user comments or support tickets',
        '  - Add human context to numbers',
        'Limitations and caveats:',
        '  - Sample composition biases',
        '  - External factors during test period',
        '  - Generalizability concerns',
        '  - Novelty effects or seasonality',
        'Generate key findings summary:',
        '  - Top 3-5 takeaways',
        '  - What worked and why',
        '  - What didn\'t work and why',
        '  - Implications for product strategy'
      ],
      outputFormat: 'JSON with hypothesisValidated (boolean), confidence (string), keyFindings (array), primaryMetricInsight (string), secondaryMetricInsights (array), userBehaviorInsights (array), unexpectedFindings (array), businessImpact (object), limitations (array), qualitativeContext (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['hypothesisValidated', 'confidence', 'keyFindings', 'artifacts'],
      properties: {
        hypothesisValidated: { type: 'boolean' },
        confidence: { type: 'string', enum: ['very-low', 'low', 'medium', 'high', 'very-high'] },
        keyFindings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              finding: { type: 'string' },
              evidence: { type: 'string' },
              implication: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        primaryMetricInsight: { type: 'string' },
        secondaryMetricInsights: { type: 'array', items: { type: 'string' } },
        userBehaviorInsights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              insight: { type: 'string' },
              supportingData: { type: 'string' },
              implication: { type: 'string' }
            }
          }
        },
        unexpectedFindings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              finding: { type: 'string' },
              expectedOutcome: { type: 'string' },
              actualOutcome: { type: 'string' },
              possibleExplanations: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        businessImpact: {
          type: 'object',
          properties: {
            projectedValue: { type: 'string' },
            impactDescription: { type: 'string' },
            timeframe: { type: 'string' },
            assumptions: { type: 'array', items: { type: 'string' } }
          }
        },
        limitations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              limitation: { type: 'string' },
              impact: { type: 'string', enum: ['low', 'medium', 'high'] },
              mitigation: { type: 'string' }
            }
          }
        },
        qualitativeContext: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'insights']
}));

// Task 12: Segmentation Analysis (optional)
export const segmentationAnalysisTask = defineTask('segmentation-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct segmentation analysis for deeper insights',
  agent: {
    name: 'segmentation-analyst',
    prompt: {
      role: 'data scientist and user segmentation specialist',
      task: 'Analyze experiment results across user segments to identify differential treatment effects',
      context: args,
      instructions: [
        'Define segmentation dimensions:',
        '  - Demographics (age, gender, location)',
        '  - Behavioral (new vs returning, high vs low engagement)',
        '  - Device/platform (mobile vs desktop, iOS vs Android)',
        '  - Other relevant segments from experiment planning',
        'For each segment:',
        '  - Calculate treatment effect separately',
        '  - Determine if effect is statistically significant',
        '  - Compare effect size across segments',
        'Identify segments with differential impact:',
        '  - Segments where treatment performed exceptionally well',
        '  - Segments where treatment underperformed',
        '  - Segments with no significant effect',
        'Analyze interaction effects:',
        '  - Do certain segment combinations show unique patterns?',
        '  - Are there synergies or conflicts between segments?',
        'Calculate statistical significance for segment differences:',
        '  - Use interaction terms in regression',
        '  - Test if segment differences are significant',
        'Generate segment performance matrix',
        'Recommend targeted rollout strategy:',
        '  - Segments to prioritize for rollout',
        '  - Segments to exclude or treat differently',
        '  - Opportunities for personalization',
        'Create segmentation insights report with visualizations'
      ],
      outputFormat: 'JSON with performanceBySegment (array), targetSegments (array), segmentsToExclude (array), differentialImpact (object), interactionEffects (array), targetedRolloutStrategy (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['performanceBySegment', 'targetSegments', 'artifacts'],
      properties: {
        performanceBySegment: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segment: { type: 'string' },
              segmentSize: { type: 'number' },
              controlValue: { type: 'number' },
              treatmentValue: { type: 'number' },
              lift: { type: 'number' },
              statisticallySignificant: { type: 'boolean' },
              pValue: { type: 'number' },
              performance: { type: 'string', enum: ['exceptional', 'good', 'neutral', 'poor'] }
            }
          }
        },
        targetSegments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segment: { type: 'string' },
              lift: { type: 'number' },
              rationale: { type: 'string' },
              rolloutRecommendation: { type: 'string' }
            }
          }
        },
        segmentsToExclude: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segment: { type: 'string' },
              reason: { type: 'string' }
            }
          }
        },
        differentialImpact: {
          type: 'object',
          properties: {
            significantDifferences: { type: 'boolean' },
            highestPerformingSegment: { type: 'string' },
            lowestPerformingSegment: { type: 'string' },
            liftVariance: { type: 'number' }
          }
        },
        interactionEffects: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segments: { type: 'array', items: { type: 'string' } },
              interactionEffect: { type: 'string' },
              significance: { type: 'boolean' }
            }
          }
        },
        targetedRolloutStrategy: {
          type: 'object',
          properties: {
            phaseOneSegments: { type: 'array', items: { type: 'string' } },
            phaseTwoSegments: { type: 'array', items: { type: 'string' } },
            holdoutSegments: { type: 'array', items: { type: 'string' } },
            personalizationOpportunities: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'ab-testing', 'segmentation']
}));

// Task 13: Recommendations and Decision Framework
export const recommendationsGenerationTask = defineTask('recommendations-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate recommendations and rollout strategy',
  agent: {
    name: 'decision-strategist',
    prompt: {
      role: 'senior product strategist and experimentation leader',
      task: 'Generate clear, actionable recommendations based on experiment results with rollout strategy',
      context: args,
      instructions: [
        'Determine winning variation:',
        '  - Based on statistical significance and business impact',
        '  - Consider both statistical and practical significance',
        '  - Factor in guardrail metrics',
        '  - Incorporate segmentation insights if available',
        'Generate primary recommendation:',
        '  - Ship treatment to 100%?',
        '  - Ship to specific segments only?',
        '  - Do not ship (keep control)?',
        '  - Run follow-up experiments?',
        '  - Provide clear decision rationale',
        'Define rollout strategy if shipping:',
        '  - Gradual rollout plan (10% → 25% → 50% → 100%)',
        '  - Rollout timeline',
        '  - Monitoring during rollout',
        '  - Rollback criteria',
        '  - Segment-specific rollout if applicable',
        'Define next steps:',
        '  - Immediate actions required',
        '  - Stakeholder communication',
        '  - Implementation tasks',
        '  - Post-rollout monitoring plan',
        'Document learnings:',
        '  - What did we learn about users?',
        '  - What design patterns worked?',
        '  - What hypotheses were validated/invalidated?',
        '  - How to apply learnings to other features?',
        'Recommend future experiments:',
        '  - Follow-up tests to run',
        '  - New hypotheses generated',
        '  - Areas needing further investigation',
        'Calculate expected business impact if shipping',
        'Generate decision framework and rollout plan document'
      ],
      outputFormat: 'JSON with winningVariation (string), primaryRecommendation (string), decisionRationale (string), rolloutStrategy (object), nextSteps (array), learnings (array), futureExperiments (array), expectedImpact (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['winningVariation', 'primaryRecommendation', 'decisionRationale', 'artifacts'],
      properties: {
        winningVariation: { type: 'string', enum: ['control', 'treatment', 'inconclusive'] },
        primaryRecommendation: { type: 'string' },
        decisionRationale: { type: 'string' },
        recommendationConfidence: { type: 'string', enum: ['very-low', 'low', 'medium', 'high', 'very-high'] },
        rolloutStrategy: {
          type: 'object',
          properties: {
            approach: { type: 'string', enum: ['full-rollout', 'gradual-rollout', 'segment-rollout', 'no-rollout', 'further-testing'] },
            phases: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  phase: { type: 'string' },
                  trafficPercentage: { type: 'number' },
                  duration: { type: 'string' },
                  successCriteria: { type: 'string' }
                }
              }
            },
            targetSegments: { type: 'array', items: { type: 'string' } },
            timeline: { type: 'string' },
            monitoringPlan: { type: 'string' },
            rollbackCriteria: { type: 'array', items: { type: 'string' } }
          }
        },
        nextSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              owner: { type: 'string' },
              deadline: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        learnings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              learning: { type: 'string' },
              category: { type: 'string', enum: ['user-behavior', 'design-pattern', 'methodology', 'business-strategy'] },
              applicability: { type: 'string' }
            }
          }
        },
        futureExperiments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              experimentIdea: { type: 'string' },
              rationale: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] },
              estimatedValue: { type: 'string' }
            }
          }
        },
        expectedImpact: {
          type: 'object',
          properties: {
            businessValue: { type: 'string' },
            timeframe: { type: 'string' },
            confidenceLevel: { type: 'string' },
            assumptions: { type: 'array', items: { type: 'string' } }
          }
        },
        stakeholderCommunication: {
          type: 'object',
          properties: {
            executiveSummary: { type: 'string' },
            keyMessages: { type: 'array', items: { type: 'string' } },
            audienceSpecific: { type: 'array' }
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
  labels: ['agent', 'ab-testing', 'recommendations', 'strategy']
}));

// Task 14: Comprehensive Experiment Report Generation
export const experimentReportGenerationTask = defineTask('experiment-report-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive experiment report',
  agent: {
    name: 'report-writer',
    prompt: {
      role: 'senior technical writer and data storyteller',
      task: 'Create comprehensive, stakeholder-ready A/B test report with executive summary, methodology, results, and recommendations',
      context: args,
      instructions: [
        'Create executive summary (1-2 pages):',
        '  - Experiment purpose and hypothesis',
        '  - Key results and statistical significance',
        '  - Winning variation and lift',
        '  - Primary recommendation',
        '  - Business impact projection',
        'Document experiment setup:',
        '  - Feature tested and variations',
        '  - Hypothesis statement',
        '  - Success metrics defined',
        '  - Sample size and duration',
        '  - Target audience',
        'Present methodology section:',
        '  - Experiment design',
        '  - Randomization approach',
        '  - Metric definitions and calculations',
        '  - Statistical methods used',
        '  - Sample size calculation rationale',
        'Present results section:',
        '  - Primary metric results with statistical tests',
        '  - Secondary metric results',
        '  - Guardrail metric status',
        '  - Confidence intervals and p-values',
        '  - Data visualizations (charts, graphs)',
        '  - Segmentation analysis (if available)',
        'Include insights and interpretation:',
        '  - Hypothesis validation',
        '  - Key findings and takeaways',
        '  - User behavior insights',
        '  - Unexpected findings',
        '  - Business implications',
        'Add recommendations section:',
        '  - Primary recommendation with rationale',
        '  - Rollout strategy',
        '  - Next steps',
        '  - Future experiments',
        'Include appendices:',
        '  - Detailed statistical analysis',
        '  - Complete metric definitions',
        '  - Data quality reports',
        '  - Variation mockups',
        'Format as professional, well-designed document:',
        '  - Clear structure with headings',
        '  - Executive-friendly language',
        '  - Visualizations for key data points',
        '  - Technical details in appendix',
        'Ensure report answers: What did we test? Why? What happened? What should we do?'
      ],
      outputFormat: 'JSON with reportPath (string), executiveSummary (string), keyResults (array), recommendation (string), visualizations (array), readinessScore (number 0-100), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'keyResults', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              result: { type: 'string' },
              metric: { type: 'string' },
              value: { type: 'string' },
              significance: { type: 'boolean' }
            }
          }
        },
        recommendation: { type: 'string' },
        reportSections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              section: { type: 'string' },
              summary: { type: 'string' },
              pageCount: { type: 'number' }
            }
          }
        },
        visualizations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              title: { type: 'string' },
              path: { type: 'string' }
            }
          }
        },
        readinessScore: { type: 'number', minimum: 0, maximum: 100 },
        targetAudiences: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'documentation', 'reporting']
}));

// Task 15: Experiment Quality Scoring
export const experimentQualityScoringTask = defineTask('experiment-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score experiment quality and rigor',
  agent: {
    name: 'experiment-auditor',
    prompt: {
      role: 'principal experimentation scientist and quality auditor',
      task: 'Assess overall A/B test quality, rigor, and validity using experimentation best practices',
      context: args,
      instructions: [
        'Evaluate experiment design quality (weight: 20%):',
        '  - Was hypothesis well-formed and testable?',
        '  - Were variations properly isolated (single variable)?',
        '  - Was control group appropriate?',
        '  - Were success metrics well-chosen?',
        'Evaluate statistical rigor (weight: 25%):',
        '  - Was sample size sufficient for statistical power?',
        '  - Were appropriate statistical tests used?',
        '  - Were statistical assumptions validated?',
        '  - Was multiple testing correction applied if needed?',
        '  - Were confidence intervals calculated?',
        'Evaluate implementation quality (weight: 20%):',
        '  - Was randomization properly implemented?',
        '  - Was tracking accurate and complete?',
        '  - Were variations rendered correctly?',
        '  - Was Sample Ratio Mismatch (SRM) absent?',
        'Evaluate data quality (weight: 15%):',
        '  - Was data collection reliable?',
        '  - Were data quality issues identified and addressed?',
        '  - Were outliers handled appropriately?',
        '  - Was missing data minimal?',
        'Evaluate analysis quality (weight: 10%):',
        '  - Was analysis thorough and unbiased?',
        '  - Were results interpreted correctly?',
        '  - Were limitations acknowledged?',
        '  - Was segmentation analysis performed if warranted?',
        'Evaluate decision quality (weight: 10%):',
        '  - Were recommendations clear and actionable?',
        '  - Was rationale well-documented?',
        '  - Were next steps defined?',
        '  - Was learning captured?',
        'Calculate weighted overall score (0-100)',
        'Identify strengths and areas for improvement',
        'Provide recommendations for future experiments',
        'Assess experiment validity and reliability'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), componentScores (object), strengths (array), areasForImprovement (array), validity (object), recommendations (array), experimentRating (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'experimentRating', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            experimentDesign: { type: 'number' },
            statisticalRigor: { type: 'number' },
            implementationQuality: { type: 'number' },
            dataQuality: { type: 'number' },
            analysisQuality: { type: 'number' },
            decisionQuality: { type: 'number' }
          }
        },
        strengths: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              strength: { type: 'string' },
              category: { type: 'string' }
            }
          }
        },
        areasForImprovement: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              suggestion: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        validity: {
          type: 'object',
          properties: {
            internalValidity: { type: 'string', enum: ['high', 'medium', 'low'] },
            externalValidity: { type: 'string', enum: ['high', 'medium', 'low'] },
            constructValidity: { type: 'string', enum: ['high', 'medium', 'low'] },
            statisticalConclusion: { type: 'string', enum: ['high', 'medium', 'low'] },
            threats: { type: 'array', items: { type: 'string' } }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              category: { type: 'string' },
              expectedImprovement: { type: 'string' }
            }
          }
        },
        experimentRating: { type: 'string', enum: ['excellent', 'good', 'acceptable', 'needs-improvement', 'poor'] },
        trustworthiness: { type: 'string', enum: ['very-high', 'high', 'medium', 'low', 'very-low'] },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'quality-scoring', 'validation']
}));
