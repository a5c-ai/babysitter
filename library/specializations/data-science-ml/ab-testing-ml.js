/**
 * @process specializations/data-science-ml/ab-testing-ml
 * @description A/B Testing Framework for ML Models - Comprehensive framework for designing, executing, and analyzing
 * A/B tests to compare ML model variants with statistical rigor, traffic management, and automated decision-making.
 * @inputs { projectName: string, modelA: object, modelB: object, targetMetric: string, minimumSampleSize?: number, confidenceLevel?: number }
 * @outputs { success: boolean, winner: string, testResults: object, decisionRecommendation: string, statisticalSignificance: boolean }
 *
 * @example
 * const result = await orchestrate('specializations/data-science-ml/ab-testing-ml', {
 *   projectName: 'Recommendation Engine A/B Test',
 *   modelA: {
 *     name: 'content-based-v1',
 *     version: '1.2.0',
 *     endpoint: 'https://api.example.com/models/content-based-v1'
 *   },
 *   modelB: {
 *     name: 'collaborative-filtering-v2',
 *     version: '2.0.0',
 *     endpoint: 'https://api.example.com/models/collaborative-v2'
 *   },
 *   targetMetric: 'click_through_rate',
 *   minimumSampleSize: 10000,
 *   confidenceLevel: 0.95,
 *   trafficSplit: { a: 50, b: 50 }
 * });
 *
 * @references
 * - Trustworthy Online Controlled Experiments: https://experimentguide.com/
 * - Microsoft Experimentation Platform: https://exp-platform.com/
 * - Optimizely Stats Engine: https://www.optimizely.com/insights/blog/stats-engine/
 * - Netflix Experimentation: https://netflixtechblog.com/its-all-a-bout-testing-the-netflix-experimentation-platform-4e1ca458c15
 * - Spotify Experimentation: https://engineering.atspotify.com/2020/10/spotifys-new-experimentation-platform-part-1/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * A/B Testing Framework for ML Models
 *
 * Demonstrates:
 * - Comprehensive A/B test design with statistical planning
 * - Traffic allocation and randomization strategies
 * - Real-time metrics collection and monitoring
 * - Statistical significance testing and analysis
 * - Quality gates for sample size and data quality
 * - Automated winner selection with confidence intervals
 * - Human-in-the-loop approval for critical decisions
 * - Detailed reporting and recommendations
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.projectName - Name of the A/B test project
 * @param {Object} inputs.modelA - Model A (control) configuration
 * @param {Object} inputs.modelB - Model B (treatment) configuration
 * @param {string} inputs.targetMetric - Primary success metric (CTR, conversion_rate, revenue, etc.)
 * @param {number} inputs.minimumSampleSize - Minimum sample size per variant (default: 10000)
 * @param {number} inputs.confidenceLevel - Statistical confidence level (default: 0.95)
 * @param {Object} inputs.trafficSplit - Traffic allocation percentage (default: {a: 50, b: 50})
 * @param {number} inputs.testDuration - Maximum test duration in days (default: 14)
 * @param {Array} inputs.secondaryMetrics - Additional metrics to track
 * @param {Array} inputs.guardrailMetrics - Metrics with threshold constraints
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result with winner, statistics, and recommendations
 */
export async function process(inputs, ctx) {
  const {
    projectName,
    modelA,
    modelB,
    targetMetric,
    minimumSampleSize = 10000,
    confidenceLevel = 0.95,
    trafficSplit = { a: 50, b: 50 },
    testDuration = 14,
    minimumDetectableEffect = 0.05,
    secondaryMetrics = [],
    guardrailMetrics = [],
    earlyStoppingEnabled = true,
    sequentialTestingEnabled = false,
    outputDir = 'ab-test-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting A/B test: ${projectName}`);
  ctx.log('info', `Model A (control): ${modelA.name} v${modelA.version}`);
  ctx.log('info', `Model B (treatment): ${modelB.name} v${modelB.version}`);
  ctx.log('info', `Target metric: ${targetMetric}`);

  // ============================================================================
  // PHASE 1: TEST DESIGN AND STATISTICAL PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 1: A/B Test Design and Statistical Planning');

  // Task 1.1: Validate Test Configuration
  const configValidation = await ctx.task(testConfigurationValidationTask, {
    projectName,
    modelA,
    modelB,
    targetMetric,
    trafficSplit,
    testDuration,
    outputDir
  });

  if (!configValidation.valid) {
    return {
      success: false,
      error: 'Test configuration validation failed',
      details: configValidation.errors,
      phase: 'test-design',
      metadata: {
        processId: 'specializations/data-science-ml/ab-testing-ml',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...configValidation.artifacts);

  // Task 1.2: Statistical Test Design
  const statisticalDesign = await ctx.task(statisticalTestDesignTask, {
    projectName,
    targetMetric,
    minimumSampleSize,
    confidenceLevel,
    minimumDetectableEffect,
    trafficSplit,
    sequentialTestingEnabled,
    outputDir
  });

  artifacts.push(...statisticalDesign.artifacts);

  // Task 1.3: Sample Size Calculation
  const sampleSizeCalc = await ctx.task(sampleSizeCalculationTask, {
    projectName,
    targetMetric,
    confidenceLevel,
    statisticalPower: statisticalDesign.power,
    minimumDetectableEffect,
    expectedBaselineRate: statisticalDesign.expectedBaselineRate,
    testDuration,
    outputDir
  });

  artifacts.push(...sampleSizeCalc.artifacts);

  // Quality Gate: Check if sample size is achievable
  if (!sampleSizeCalc.feasible) {
    await ctx.breakpoint({
      question: `Sample size calculation shows the required sample size (${sampleSizeCalc.requiredSampleSize} per variant) may not be achievable within ${testDuration} days. Expected daily traffic: ${sampleSizeCalc.estimatedDailyTraffic}. Adjust parameters or proceed anyway?`,
      title: 'Sample Size Feasibility Warning',
      context: {
        runId: ctx.runId,
        requiredSampleSize: sampleSizeCalc.requiredSampleSize,
        estimatedDuration: sampleSizeCalc.estimatedDurationDays,
        testDuration,
        files: [
          { path: `${outputDir}/sample-size-analysis.json`, format: 'json' }
        ]
      }
    });
  }

  // Task 1.4: Randomization Strategy Design
  const randomizationStrategy = await ctx.task(randomizationStrategyDesignTask, {
    projectName,
    trafficSplit,
    modelA,
    modelB,
    randomizationUnit: inputs.randomizationUnit || 'user_id',
    stratification: inputs.stratification || null,
    outputDir
  });

  artifacts.push(...randomizationStrategy.artifacts);

  // Task 1.5: Metrics and Guardrails Definition
  const metricsDefinition = await ctx.task(metricsDefinitionTask, {
    projectName,
    targetMetric,
    secondaryMetrics,
    guardrailMetrics,
    statisticalDesign,
    outputDir
  });

  artifacts.push(...metricsDefinition.artifacts);

  // Breakpoint: Review test design before execution
  await ctx.breakpoint({
    question: `A/B test design complete for ${projectName}. Target metric: ${targetMetric}. Required sample size: ${sampleSizeCalc.requiredSampleSize} per variant. Confidence level: ${confidenceLevel}. Approve test design and proceed with execution?`,
    title: 'A/B Test Design Approval',
    context: {
      runId: ctx.runId,
      projectName,
      modelA: modelA.name,
      modelB: modelB.name,
      targetMetric,
      sampleSize: sampleSizeCalc.requiredSampleSize,
      trafficSplit,
      files: [
        { path: `${outputDir}/test-design-summary.md`, format: 'markdown' },
        { path: `${outputDir}/statistical-design.json`, format: 'json' },
        { path: `${outputDir}/metrics-definition.json`, format: 'json' }
      ]
    }
  });

  // ============================================================================
  // PHASE 2: TEST INFRASTRUCTURE SETUP
  // ============================================================================

  ctx.log('info', 'Phase 2: Test Infrastructure Setup');

  // Task 2.1: Setup Traffic Routing
  const trafficSetup = await ctx.task(trafficRoutingSetupTask, {
    projectName,
    modelA,
    modelB,
    trafficSplit,
    randomizationStrategy,
    outputDir
  });

  if (!trafficSetup.success) {
    return {
      success: false,
      error: 'Traffic routing setup failed',
      details: trafficSetup.errors,
      phase: 'infrastructure-setup',
      metadata: {
        processId: 'specializations/data-science-ml/ab-testing-ml',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...trafficSetup.artifacts);

  // Task 2.2: Setup Metrics Collection
  const metricsSetup = await ctx.task(metricsCollectionSetupTask, {
    projectName,
    modelA,
    modelB,
    metricsDefinition,
    targetMetric,
    secondaryMetrics,
    guardrailMetrics,
    outputDir
  });

  artifacts.push(...metricsSetup.artifacts);

  // Task 2.3: Setup Monitoring and Alerts
  const monitoringSetup = await ctx.task(monitoringSetupTask, {
    projectName,
    metricsDefinition,
    guardrailMetrics,
    sampleSizeCalc,
    earlyStoppingEnabled,
    notificationChannels: inputs.notificationChannels || [],
    outputDir
  });

  artifacts.push(...monitoringSetup.artifacts);

  ctx.log('info', 'Test infrastructure setup complete');

  // ============================================================================
  // PHASE 3: TEST EXECUTION AND DATA COLLECTION
  // ============================================================================

  ctx.log('info', 'Phase 3: Test Execution and Data Collection');

  // Task 3.1: Start A/B Test
  const testStart = await ctx.task(testExecutionStartTask, {
    projectName,
    modelA,
    modelB,
    trafficSetup,
    metricsSetup,
    monitoringSetup,
    testDuration,
    outputDir
  });

  artifacts.push(...testStart.artifacts);

  ctx.log('info', `A/B test started at ${testStart.startTimestamp}`);

  // Task 3.2: Monitor Test Progress (iterative)
  let currentSampleSize = 0;
  let testComplete = false;
  let earlyStopTriggered = false;
  let earlyStopReason = null;
  let monitoringResults = null;

  // Monitoring loop
  while (!testComplete) {
    ctx.log('info', 'Collecting test metrics and checking progress...');

    // Task 3.3: Collect Current Metrics
    monitoringResults = await ctx.task(testProgressMonitoringTask, {
      projectName,
      modelA,
      modelB,
      metricsDefinition,
      targetMetric,
      testStart,
      minimumSampleSize: sampleSizeCalc.requiredSampleSize,
      outputDir
    });

    artifacts.push(...monitoringResults.artifacts);

    currentSampleSize = monitoringResults.currentSampleSize;
    const progress = (currentSampleSize / sampleSizeCalc.requiredSampleSize) * 100;

    ctx.log('info', `Test progress: ${progress.toFixed(1)}% (${currentSampleSize}/${sampleSizeCalc.requiredSampleSize} samples)`);

    // Task 3.4: Check Guardrail Metrics
    const guardrailCheck = await ctx.task(guardrailMetricsCheckTask, {
      projectName,
      monitoringResults,
      guardrailMetrics,
      metricsDefinition,
      outputDir
    });

    artifacts.push(...guardrailCheck.artifacts);

    // Quality Gate: Guardrail violations
    if (guardrailCheck.violationsDetected) {
      ctx.log('warn', `Guardrail violations detected: ${guardrailCheck.violations.length}`);

      await ctx.breakpoint({
        question: `GUARDRAIL ALERT: ${guardrailCheck.violations.length} metric(s) violated thresholds. ${guardrailCheck.violations.map(v => `${v.metric}: ${v.description}`).join(', ')}. Should we stop the test early?`,
        title: 'Guardrail Violation Alert',
        context: {
          runId: ctx.runId,
          projectName,
          violations: guardrailCheck.violations,
          currentMetrics: monitoringResults.metrics,
          files: [
            { path: `${outputDir}/guardrail-violations.json`, format: 'json' }
          ]
        }
      });

      // If user wants to stop, break the loop
      if (guardrailCheck.stopRecommended) {
        earlyStopTriggered = true;
        earlyStopReason = 'guardrail_violation';
        testComplete = true;
        continue;
      }
    }

    // Task 3.5: Early Stopping Analysis (if enabled)
    if (earlyStoppingEnabled && currentSampleSize >= minimumSampleSize) {
      const earlyStoppingAnalysis = await ctx.task(earlyStoppingAnalysisTask, {
        projectName,
        monitoringResults,
        targetMetric,
        confidenceLevel,
        statisticalDesign,
        sequentialTestingEnabled,
        outputDir
      });

      artifacts.push(...earlyStoppingAnalysis.artifacts);

      if (earlyStoppingAnalysis.canStop) {
        ctx.log('info', `Early stopping criteria met: ${earlyStoppingAnalysis.reason}`);

        await ctx.breakpoint({
          question: `Early stopping criteria met: ${earlyStoppingAnalysis.reason}. Current sample size: ${currentSampleSize}. Confidence: ${earlyStoppingAnalysis.confidence}. Stop test early?`,
          title: 'Early Stopping Opportunity',
          context: {
            runId: ctx.runId,
            projectName,
            reason: earlyStoppingAnalysis.reason,
            currentSampleSize,
            confidence: earlyStoppingAnalysis.confidence,
            preliminaryWinner: earlyStoppingAnalysis.preliminaryWinner,
            files: [
              { path: `${outputDir}/early-stopping-analysis.json`, format: 'json' }
            ]
          }
        });

        if (earlyStoppingAnalysis.stopApproved) {
          earlyStopTriggered = true;
          earlyStopReason = earlyStoppingAnalysis.reason;
          testComplete = true;
          continue;
        }
      }
    }

    // Check if minimum sample size reached
    if (currentSampleSize >= sampleSizeCalc.requiredSampleSize) {
      ctx.log('info', 'Minimum sample size reached');
      testComplete = true;
    }

    // Check if test duration exceeded
    const daysElapsed = monitoringResults.daysElapsed;
    if (daysElapsed >= testDuration) {
      ctx.log('info', `Test duration limit reached (${testDuration} days)`);
      testComplete = true;
    }

    // If not complete, wait before next check
    if (!testComplete) {
      ctx.log('info', 'Waiting for more data collection...');
      // In real implementation, this would be a sleep task
      // For now, we'll simulate progress
      break; // Exit loop for demo purposes
    }
  }

  ctx.log('info', 'Data collection phase complete');

  // ============================================================================
  // PHASE 4: STATISTICAL ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Statistical Analysis');

  // Task 4.1: Primary Metric Analysis
  const primaryAnalysis = await ctx.task(primaryMetricAnalysisTask, {
    projectName,
    monitoringResults,
    targetMetric,
    confidenceLevel,
    statisticalDesign,
    modelA,
    modelB,
    outputDir
  });

  artifacts.push(...primaryAnalysis.artifacts);

  // Task 4.2: Secondary Metrics Analysis
  const secondaryAnalysis = await ctx.task(secondaryMetricsAnalysisTask, {
    projectName,
    monitoringResults,
    secondaryMetrics,
    confidenceLevel,
    modelA,
    modelB,
    outputDir
  });

  artifacts.push(...secondaryAnalysis.artifacts);

  // Task 4.3: Statistical Significance Testing
  const significanceTest = await ctx.task(statisticalSignificanceTestTask, {
    projectName,
    primaryAnalysis,
    secondaryAnalysis,
    confidenceLevel,
    statisticalDesign,
    multipleTestingCorrection: inputs.multipleTestingCorrection || 'bonferroni',
    outputDir
  });

  artifacts.push(...significanceTest.artifacts);

  // Task 4.4: Effect Size Calculation
  const effectSizeAnalysis = await ctx.task(effectSizeAnalysisTask, {
    projectName,
    primaryAnalysis,
    minimumDetectableEffect,
    targetMetric,
    outputDir
  });

  artifacts.push(...effectSizeAnalysis.artifacts);

  // Task 4.5: Segmentation Analysis
  const segmentationAnalysis = await ctx.task(segmentationAnalysisTask, {
    projectName,
    monitoringResults,
    targetMetric,
    segments: inputs.segments || ['user_type', 'platform', 'region'],
    modelA,
    modelB,
    outputDir
  });

  artifacts.push(...segmentationAnalysis.artifacts);

  ctx.log('info', 'Statistical analysis complete');

  // ============================================================================
  // PHASE 5: DECISION AND RECOMMENDATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Decision and Recommendation');

  // Task 5.1: Winner Selection
  const winnerSelection = await ctx.task(winnerSelectionTask, {
    projectName,
    primaryAnalysis,
    secondaryAnalysis,
    significanceTest,
    effectSizeAnalysis,
    guardrailCheck: guardrailCheck,
    targetMetric,
    confidenceLevel,
    modelA,
    modelB,
    outputDir
  });

  artifacts.push(...winnerSelection.artifacts);

  // Task 5.2: Decision Recommendation
  const decisionRecommendation = await ctx.task(decisionRecommendationTask, {
    projectName,
    winnerSelection,
    primaryAnalysis,
    significanceTest,
    effectSizeAnalysis,
    segmentationAnalysis,
    earlyStopTriggered,
    earlyStopReason,
    targetMetric,
    outputDir
  });

  artifacts.push(...decisionRecommendation.artifacts);

  // Task 5.3: Risk Assessment
  const riskAssessment = await ctx.task(riskAssessmentTask, {
    projectName,
    winnerSelection,
    decisionRecommendation,
    effectSizeAnalysis,
    segmentationAnalysis,
    guardrailCheck,
    outputDir
  });

  artifacts.push(...riskAssessment.artifacts);

  // Breakpoint: Review results before final decision
  await ctx.breakpoint({
    question: `A/B test analysis complete for ${projectName}. Winner: ${winnerSelection.winner}. Statistical significance: ${significanceTest.significant ? 'YES' : 'NO'}. Effect size: ${effectSizeAnalysis.effectSize.toFixed(3)}. Recommendation: ${decisionRecommendation.recommendation}. Approve final decision?`,
    title: 'A/B Test Results Review',
    context: {
      runId: ctx.runId,
      projectName,
      winner: winnerSelection.winner,
      statisticalSignificance: significanceTest.significant,
      pValue: significanceTest.pValue,
      effectSize: effectSizeAnalysis.effectSize,
      recommendation: decisionRecommendation.recommendation,
      files: [
        { path: `${outputDir}/final-results.md`, format: 'markdown' },
        { path: `${outputDir}/statistical-analysis.json`, format: 'json' },
        { path: `${outputDir}/decision-recommendation.json`, format: 'json' }
      ]
    }
  });

  // ============================================================================
  // PHASE 6: REPORTING AND DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Reporting and Documentation');

  // Task 6.1: Generate Comprehensive Report
  const finalReport = await ctx.task(finalReportGenerationTask, {
    projectName,
    modelA,
    modelB,
    configValidation,
    statisticalDesign,
    sampleSizeCalc,
    trafficSetup,
    testStart,
    monitoringResults,
    primaryAnalysis,
    secondaryAnalysis,
    significanceTest,
    effectSizeAnalysis,
    segmentationAnalysis,
    winnerSelection,
    decisionRecommendation,
    riskAssessment,
    earlyStopTriggered,
    earlyStopReason,
    outputDir
  });

  artifacts.push(...finalReport.artifacts);

  // Task 6.2: Generate Executive Summary
  const executiveSummary = await ctx.task(executiveSummaryTask, {
    projectName,
    modelA,
    modelB,
    winnerSelection,
    primaryAnalysis,
    significanceTest,
    decisionRecommendation,
    targetMetric,
    currentSampleSize,
    outputDir
  });

  artifacts.push(...executiveSummary.artifacts);

  // Task 6.3: Generate Rollout Plan (if applicable)
  let rolloutPlan = null;
  if (winnerSelection.winner !== 'inconclusive' && decisionRecommendation.recommendation === 'deploy_winner') {
    rolloutPlan = await ctx.task(rolloutPlanGenerationTask, {
      projectName,
      winner: winnerSelection.winner,
      winningModel: winnerSelection.winner === 'model_a' ? modelA : modelB,
      riskAssessment,
      effectSizeAnalysis,
      outputDir
    });

    artifacts.push(...rolloutPlan.artifacts);
  }

  const endTime = ctx.now();
  const duration = endTime - startTime;

  ctx.log('info', `A/B test complete: ${projectName}`);
  ctx.log('info', `Winner: ${winnerSelection.winner}`);
  ctx.log('info', `Statistical significance: ${significanceTest.significant}`);
  ctx.log('info', `Recommendation: ${decisionRecommendation.recommendation}`);

  // Return comprehensive results
  return {
    success: true,
    projectName,
    winner: winnerSelection.winner,
    statisticalSignificance: significanceTest.significant,
    pValue: significanceTest.pValue,
    confidenceLevel,
    testResults: {
      modelA: {
        name: modelA.name,
        sampleSize: primaryAnalysis.modelA.sampleSize,
        metricValue: primaryAnalysis.modelA.metricValue,
        confidenceInterval: primaryAnalysis.modelA.confidenceInterval
      },
      modelB: {
        name: modelB.name,
        sampleSize: primaryAnalysis.modelB.sampleSize,
        metricValue: primaryAnalysis.modelB.metricValue,
        confidenceInterval: primaryAnalysis.modelB.confidenceInterval
      },
      relativeLift: effectSizeAnalysis.relativeLift,
      effectSize: effectSizeAnalysis.effectSize,
      practicalSignificance: effectSizeAnalysis.practicallySignificant
    },
    decisionRecommendation: decisionRecommendation.recommendation,
    reasoning: decisionRecommendation.reasoning,
    risks: riskAssessment.risks,
    segmentationInsights: segmentationAnalysis.insights,
    guardrailStatus: guardrailCheck.status,
    earlyStopTriggered,
    earlyStopReason,
    artifacts,
    rolloutPlan: rolloutPlan ? rolloutPlan.plan : null,
    reportPaths: {
      comprehensive: finalReport.reportPath,
      executive: executiveSummary.summaryPath
    },
    duration,
    metadata: {
      processId: 'specializations/data-science-ml/ab-testing-ml',
      timestamp: startTime,
      completedAt: endTime,
      targetMetric,
      totalSampleSize: currentSampleSize
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1.1: Test Configuration Validation
export const testConfigurationValidationTask = defineTask('test-configuration-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate A/B test configuration - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ML Experimentation Engineer with expertise in A/B testing and experimental design',
      task: 'Validate A/B test configuration for completeness and correctness',
      context: {
        projectName: args.projectName,
        modelA: args.modelA,
        modelB: args.modelB,
        targetMetric: args.targetMetric,
        trafficSplit: args.trafficSplit,
        testDuration: args.testDuration
      },
      instructions: [
        '1. Validate both models are properly configured with endpoints/identifiers',
        '2. Check that target metric is clearly defined and measurable',
        '3. Verify traffic split percentages sum to 100%',
        '4. Validate test duration is reasonable (typically 1-4 weeks)',
        '5. Check that models are sufficiently different to warrant A/B test',
        '6. Verify model endpoints are accessible and responsive',
        '7. Validate metric collection infrastructure is in place',
        '8. Check for conflicts with other running experiments',
        '9. Verify randomization unit is appropriate (user, session, request)',
        '10. Document any configuration warnings or recommendations'
      ],
      outputFormat: 'JSON object with validation results, errors, warnings, and recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['valid', 'errors', 'warnings', 'artifacts'],
      properties: {
        valid: { type: 'boolean', description: 'Whether configuration is valid' },
        errors: {
          type: 'array',
          items: { type: 'string' },
          description: 'Critical errors that must be fixed'
        },
        warnings: {
          type: 'array',
          items: { type: 'string' },
          description: 'Warnings that should be reviewed'
        },
        recommendations: {
          type: 'array',
          items: { type: 'string' },
          description: 'Recommendations for improvement'
        },
        modelAStatus: {
          type: 'object',
          properties: {
            accessible: { type: 'boolean' },
            version: { type: 'string' },
            responseTime: { type: 'number' }
          }
        },
        modelBStatus: {
          type: 'object',
          properties: {
            accessible: { type: 'boolean' },
            version: { type: 'string' },
            responseTime: { type: 'number' }
          }
        },
        conflicts: {
          type: 'array',
          items: { type: 'string' },
          description: 'Conflicting experiments or issues'
        },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'validation', 'configuration']
}));

// Task 1.2: Statistical Test Design
export const statisticalTestDesignTask = defineTask('statistical-test-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design statistical test - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Statistician specializing in A/B testing and causal inference',
      task: 'Design the statistical testing approach for A/B test',
      context: {
        projectName: args.projectName,
        targetMetric: args.targetMetric,
        minimumSampleSize: args.minimumSampleSize,
        confidenceLevel: args.confidenceLevel,
        minimumDetectableEffect: args.minimumDetectableEffect,
        sequentialTestingEnabled: args.sequentialTestingEnabled
      },
      instructions: [
        '1. Determine metric type (binary, continuous, count, rate)',
        '2. Select appropriate statistical test (z-test, t-test, chi-square, Mann-Whitney)',
        '3. Calculate significance level (alpha) from confidence level',
        '4. Determine statistical power (typically 0.8 or 80%)',
        '5. Specify one-tailed or two-tailed test',
        '6. Design sequential testing strategy if enabled (alpha spending function)',
        '7. Determine minimum detectable effect that is practically meaningful',
        '8. Estimate expected baseline conversion rate or metric value',
        '9. Specify variance estimation method',
        '10. Document statistical assumptions and validity checks'
      ],
      outputFormat: 'JSON object with complete statistical test design'
    },
    outputSchema: {
      type: 'object',
      required: ['testType', 'alpha', 'power', 'artifacts'],
      properties: {
        testType: {
          type: 'string',
          description: 'Statistical test to use (z-test, t-test, etc.)'
        },
        metricType: {
          type: 'string',
          enum: ['binary', 'continuous', 'count', 'rate'],
          description: 'Type of target metric'
        },
        alpha: {
          type: 'number',
          description: 'Significance level (e.g., 0.05 for 95% confidence)'
        },
        power: {
          type: 'number',
          description: 'Statistical power (typically 0.8)'
        },
        testDirection: {
          type: 'string',
          enum: ['one-tailed', 'two-tailed'],
          description: 'Direction of hypothesis test'
        },
        sequentialTesting: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            alphaSpendingFunction: { type: 'string' },
            lookFrequency: { type: 'string' }
          }
        },
        expectedBaselineRate: {
          type: 'number',
          description: 'Expected baseline metric value (from historical data)'
        },
        varianceEstimation: {
          type: 'string',
          description: 'Method for estimating variance'
        },
        assumptions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Statistical assumptions'
        },
        validityChecks: {
          type: 'array',
          items: { type: 'string' },
          description: 'Checks to validate assumptions'
        },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'statistical-design', 'planning']
}));

// Task 1.3: Sample Size Calculation
export const sampleSizeCalculationTask = defineTask('sample-size-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Calculate required sample size - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Quantitative Analyst specializing in statistical power analysis',
      task: 'Calculate required sample size for A/B test to achieve desired statistical power',
      context: {
        projectName: args.projectName,
        targetMetric: args.targetMetric,
        confidenceLevel: args.confidenceLevel,
        statisticalPower: args.statisticalPower,
        minimumDetectableEffect: args.minimumDetectableEffect,
        expectedBaselineRate: args.expectedBaselineRate,
        testDuration: args.testDuration
      },
      instructions: [
        '1. Use alpha, power, and MDE to calculate required sample size',
        '2. Calculate sample size per variant (assumes equal split)',
        '3. Calculate total sample size across both variants',
        '4. Estimate expected daily traffic from historical data',
        '5. Calculate estimated test duration to reach sample size',
        '6. Perform sensitivity analysis for different MDE values',
        '7. Add buffer for data quality issues (5-10%)',
        '8. Check feasibility against test duration constraint',
        '9. Provide sample size for different confidence/power combinations',
        '10. Document calculation methodology and assumptions'
      ],
      outputFormat: 'JSON object with sample size calculations and feasibility assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['requiredSampleSize', 'feasible', 'artifacts'],
      properties: {
        requiredSampleSize: {
          type: 'number',
          description: 'Required sample size per variant'
        },
        totalSampleSize: {
          type: 'number',
          description: 'Total sample size across both variants'
        },
        estimatedDailyTraffic: {
          type: 'number',
          description: 'Expected daily eligible traffic'
        },
        estimatedDurationDays: {
          type: 'number',
          description: 'Estimated days to reach sample size'
        },
        feasible: {
          type: 'boolean',
          description: 'Whether sample size is achievable within test duration'
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
        alternativeScenarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              confidence: { type: 'number' },
              power: { type: 'number' },
              sampleSize: { type: 'number' }
            }
          }
        },
        calculationMethod: {
          type: 'string',
          description: 'Formula/method used for calculation'
        },
        assumptions: {
          type: 'array',
          items: { type: 'string' }
        },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'sample-size', 'statistics']
}));

// Task 1.4: Randomization Strategy Design
export const randomizationStrategyDesignTask = defineTask('randomization-strategy-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design randomization strategy - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Experimental Design Specialist',
      task: 'Design randomization strategy for A/B test',
      context: {
        projectName: args.projectName,
        trafficSplit: args.trafficSplit,
        modelA: args.modelA,
        modelB: args.modelB,
        randomizationUnit: args.randomizationUnit,
        stratification: args.stratification
      },
      instructions: [
        '1. Define randomization unit (user_id, session_id, device_id, etc.)',
        '2. Design hash-based assignment algorithm for deterministic routing',
        '3. Specify hash function and seed for reproducibility',
        '4. Design variant assignment logic based on traffic split',
        '5. Implement stratification strategy if specified (balance by segments)',
        '6. Define consistency guarantees (user always sees same variant)',
        '7. Design Sample Ratio Mismatch (SRM) detection',
        '8. Specify handling of edge cases (new users, anonymous users)',
        '9. Create pseudocode for assignment implementation',
        '10. Document randomization quality validation checks'
      ],
      outputFormat: 'JSON object with complete randomization strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['randomizationUnit', 'assignmentAlgorithm', 'artifacts'],
      properties: {
        randomizationUnit: {
          type: 'string',
          description: 'Unit at which randomization occurs'
        },
        assignmentAlgorithm: {
          type: 'string',
          description: 'Algorithm for variant assignment (e.g., MD5 hash modulo)'
        },
        hashFunction: {
          type: 'string',
          description: 'Hash function to use (MD5, SHA256, MurmurHash)'
        },
        hashSeed: {
          type: 'string',
          description: 'Seed for hash function'
        },
        assignmentLogic: {
          type: 'string',
          description: 'How hash maps to variants'
        },
        stratification: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            strata: { type: 'array', items: { type: 'string' } },
            balancingStrategy: { type: 'string' }
          }
        },
        consistencyGuarantees: {
          type: 'string',
          description: 'How consistency is maintained across sessions'
        },
        srmDetection: {
          type: 'object',
          properties: {
            method: { type: 'string' },
            threshold: { type: 'number' },
            alerting: { type: 'string' }
          }
        },
        edgeCaseHandling: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              handling: { type: 'string' }
            }
          }
        },
        implementationPseudocode: {
          type: 'string',
          description: 'Pseudocode for assignment logic'
        },
        qualityChecks: {
          type: 'array',
          items: { type: 'string' }
        },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'randomization', 'experimental-design']
}));

// Task 1.5: Metrics and Guardrails Definition
export const metricsDefinitionTask = defineTask('metrics-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Define metrics and guardrails - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Analytics Engineer specializing in experimentation metrics',
      task: 'Define comprehensive metrics and guardrails for A/B test',
      context: {
        projectName: args.projectName,
        targetMetric: args.targetMetric,
        secondaryMetrics: args.secondaryMetrics,
        guardrailMetrics: args.guardrailMetrics,
        statisticalDesign: args.statisticalDesign
      },
      instructions: [
        '1. Define primary metric calculation formula',
        '2. Specify data sources and logging events for primary metric',
        '3. Define secondary metrics with calculation formulas',
        '4. Define guardrail metrics with acceptable threshold ranges',
        '5. Specify metric aggregation periods (daily, cumulative)',
        '6. Define data quality checks for each metric',
        '7. Specify handling of missing or invalid data',
        '8. Define metric computation frequency (real-time, batch)',
        '9. Create instrumentation requirements for engineers',
        '10. Document metric interpretation guidelines'
      ],
      outputFormat: 'JSON object with complete metrics definitions'
    },
    outputSchema: {
      type: 'object',
      required: ['primaryMetric', 'artifacts'],
      properties: {
        primaryMetric: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            formula: { type: 'string' },
            unit: { type: 'string' },
            aggregation: { type: 'string' },
            dataSource: { type: 'string' }
          },
          required: ['name', 'formula']
        },
        secondaryMetrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              formula: { type: 'string' },
              unit: { type: 'string' },
              purpose: { type: 'string' }
            }
          }
        },
        guardrailMetrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              formula: { type: 'string' },
              thresholdMin: { type: 'number' },
              thresholdMax: { type: 'number' },
              severity: { type: 'string', enum: ['critical', 'warning'] }
            }
          }
        },
        instrumentationRequirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              eventName: { type: 'string' },
              trigger: { type: 'string' },
              properties: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        dataQualityChecks: {
          type: 'array',
          items: { type: 'string' }
        },
        computationFrequency: {
          type: 'string',
          enum: ['real-time', 'hourly', 'daily']
        },
        interpretationGuidelines: {
          type: 'string'
        },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'metrics', 'guardrails']
}));

// Task 2.1: Traffic Routing Setup
export const trafficRoutingSetupTask = defineTask('traffic-routing-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup traffic routing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps Engineer with expertise in traffic management',
      task: 'Setup traffic routing infrastructure for A/B test',
      context: {
        projectName: args.projectName,
        modelA: args.modelA,
        modelB: args.modelB,
        trafficSplit: args.trafficSplit,
        randomizationStrategy: args.randomizationStrategy
      },
      instructions: [
        '1. Configure load balancer or API gateway for traffic splitting',
        '2. Implement randomization logic based on strategy',
        '3. Setup routing rules to direct traffic to correct model',
        '4. Configure session affinity/stickiness as needed',
        '5. Implement variant assignment caching',
        '6. Setup logging for assignment events',
        '7. Test routing with synthetic traffic',
        '8. Verify traffic distribution matches configuration',
        '9. Implement fallback logic for errors',
        '10. Document routing configuration for audit'
      ],
      outputFormat: 'JSON object with traffic routing setup results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'routingEndpoint', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        routingEndpoint: { type: 'string' },
        loadBalancerConfig: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            configured: { type: 'boolean' }
          }
        },
        assignmentLogic: {
          type: 'object',
          properties: {
            implemented: { type: 'boolean' },
            tested: { type: 'boolean' },
            distributionVerified: { type: 'boolean' }
          }
        },
        sessionAffinity: {
          type: 'boolean',
          description: 'Whether session stickiness is enabled'
        },
        loggingConfigured: { type: 'boolean' },
        fallbackLogic: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            defaultVariant: { type: 'string' }
          }
        },
        verificationTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              test: { type: 'string' },
              passed: { type: 'boolean' }
            }
          }
        },
        errors: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'infrastructure', 'traffic-routing']
}));

// Task 2.2: Metrics Collection Setup
export const metricsCollectionSetupTask = defineTask('metrics-collection-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup metrics collection - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Engineer specializing in real-time analytics',
      task: 'Setup metrics collection pipeline for A/B test',
      context: {
        projectName: args.projectName,
        modelA: args.modelA,
        modelB: args.modelB,
        metricsDefinition: args.metricsDefinition,
        targetMetric: args.targetMetric,
        secondaryMetrics: args.secondaryMetrics,
        guardrailMetrics: args.guardrailMetrics
      },
      instructions: [
        '1. Setup event logging for all required metrics',
        '2. Configure data pipeline to collect and aggregate metrics',
        '3. Implement metric calculations based on definitions',
        '4. Setup data warehouse tables for test results',
        '5. Configure real-time metrics dashboard',
        '6. Implement data quality checks',
        '7. Setup metric computation jobs (batch/streaming)',
        '8. Test metrics collection with sample data',
        '9. Verify metrics match expected values',
        '10. Document data schema and collection process'
      ],
      outputFormat: 'JSON object with metrics collection setup status'
    },
    outputSchema: {
      type: 'object',
      required: ['configured', 'artifacts'],
      properties: {
        configured: { type: 'boolean' },
        eventLogging: {
          type: 'object',
          properties: {
            configured: { type: 'boolean' },
            eventsConfigured: { type: 'array', items: { type: 'string' } }
          }
        },
        dataPipeline: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            configured: { type: 'boolean' },
            tested: { type: 'boolean' }
          }
        },
        dataWarehouse: {
          type: 'object',
          properties: {
            tablesCreated: { type: 'boolean' },
            schema: { type: 'object' }
          }
        },
        dashboardUrl: { type: 'string' },
        dataQualityChecks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              check: { type: 'string' },
              enabled: { type: 'boolean' }
            }
          }
        },
        computationJobs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              jobName: { type: 'string' },
              frequency: { type: 'string' },
              configured: { type: 'boolean' }
            }
          }
        },
        verification: {
          type: 'object',
          properties: {
            testDataProcessed: { type: 'boolean' },
            metricsAccurate: { type: 'boolean' }
          }
        },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'metrics', 'data-pipeline']
}));

// Task 2.3: Monitoring Setup
export const monitoringSetupTask = defineTask('monitoring-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup monitoring and alerts - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SRE with expertise in monitoring and alerting',
      task: 'Setup comprehensive monitoring and alerting for A/B test',
      context: {
        projectName: args.projectName,
        metricsDefinition: args.metricsDefinition,
        guardrailMetrics: args.guardrailMetrics,
        sampleSizeCalc: args.sampleSizeCalc,
        earlyStoppingEnabled: args.earlyStoppingEnabled,
        notificationChannels: args.notificationChannels
      },
      instructions: [
        '1. Create monitoring dashboard for A/B test metrics',
        '2. Setup alerts for guardrail metric violations',
        '3. Configure Sample Ratio Mismatch (SRM) detection',
        '4. Setup alerts for data quality issues',
        '5. Configure early stopping alerts if enabled',
        '6. Setup notification channels (Slack, email, PagerDuty)',
        '7. Create alert for reaching minimum sample size',
        '8. Configure anomaly detection for key metrics',
        '9. Test all alerting rules',
        '10. Document monitoring runbook'
      ],
      outputFormat: 'JSON object with monitoring setup configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['configured', 'dashboardUrl', 'artifacts'],
      properties: {
        configured: { type: 'boolean' },
        dashboardUrl: { type: 'string' },
        alerts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              metric: { type: 'string' },
              condition: { type: 'string' },
              severity: { type: 'string' },
              enabled: { type: 'boolean' }
            }
          }
        },
        srmDetection: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            threshold: { type: 'number' },
            checkFrequency: { type: 'string' }
          }
        },
        notificationChannels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              channel: { type: 'string' },
              type: { type: 'string' },
              configured: { type: 'boolean' },
              tested: { type: 'boolean' }
            }
          }
        },
        anomalyDetection: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            sensitivity: { type: 'string' }
          }
        },
        runbookUrl: { type: 'string' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'monitoring', 'alerting']
}));

// Task 3.1: Test Execution Start
export const testExecutionStartTask = defineTask('test-execution-start', (args, taskCtx) => ({
  kind: 'agent',
  title: `Start A/B test execution - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Execution Coordinator',
      task: 'Start A/B test and verify it is running correctly',
      context: {
        projectName: args.projectName,
        modelA: args.modelA,
        modelB: args.modelB,
        trafficSetup: args.trafficSetup,
        metricsSetup: args.metricsSetup,
        monitoringSetup: args.monitoringSetup,
        testDuration: args.testDuration
      },
      instructions: [
        '1. Enable traffic routing to start directing traffic',
        '2. Verify both model variants are receiving traffic',
        '3. Check traffic split matches configuration',
        '4. Verify metrics are being collected',
        '5. Check monitoring dashboard shows live data',
        '6. Verify no immediate errors or issues',
        '7. Record test start timestamp',
        '8. Send test start notifications',
        '9. Create test execution log',
        '10. Document initial state and configuration'
      ],
      outputFormat: 'JSON object with test start confirmation and status'
    },
    outputSchema: {
      type: 'object',
      required: ['started', 'startTimestamp', 'artifacts'],
      properties: {
        started: { type: 'boolean' },
        startTimestamp: { type: 'string' },
        trafficEnabled: { type: 'boolean' },
        initialTrafficDistribution: {
          type: 'object',
          properties: {
            modelA: { type: 'number' },
            modelB: { type: 'number' }
          }
        },
        metricsFlowing: { type: 'boolean' },
        dashboardActive: { type: 'boolean' },
        initialChecks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              check: { type: 'string' },
              passed: { type: 'boolean' }
            }
          }
        },
        notificationsSent: { type: 'boolean' },
        executionLogPath: { type: 'string' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'execution', 'test-start']
}));

// Task 3.2: Test Progress Monitoring
export const testProgressMonitoringTask = defineTask('test-progress-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Monitor test progress - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Analyst monitoring A/B test execution',
      task: 'Collect current metrics and assess test progress',
      context: {
        projectName: args.projectName,
        modelA: args.modelA,
        modelB: args.modelB,
        metricsDefinition: args.metricsDefinition,
        targetMetric: args.targetMetric,
        testStart: args.testStart,
        minimumSampleSize: args.minimumSampleSize
      },
      instructions: [
        '1. Query current sample size for each variant',
        '2. Calculate progress toward minimum sample size',
        '3. Collect current metric values for both variants',
        '4. Calculate current lift/difference',
        '5. Check Sample Ratio Mismatch (SRM)',
        '6. Verify data quality (completeness, correctness)',
        '7. Calculate days elapsed since test start',
        '8. Estimate time to completion at current rate',
        '9. Check for any anomalies or issues',
        '10. Generate progress summary report'
      ],
      outputFormat: 'JSON object with current test status and metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['currentSampleSize', 'progress', 'metrics', 'artifacts'],
      properties: {
        currentSampleSize: {
          type: 'number',
          description: 'Total samples collected so far'
        },
        sampleSizeByVariant: {
          type: 'object',
          properties: {
            modelA: { type: 'number' },
            modelB: { type: 'number' }
          }
        },
        progress: {
          type: 'number',
          description: 'Progress percentage toward minimum sample size'
        },
        metrics: {
          type: 'object',
          properties: {
            modelA: {
              type: 'object',
              properties: {
                targetMetric: { type: 'number' },
                sampleSize: { type: 'number' },
                standardError: { type: 'number' }
              }
            },
            modelB: {
              type: 'object',
              properties: {
                targetMetric: { type: 'number' },
                sampleSize: { type: 'number' },
                standardError: { type: 'number' }
              }
            }
          }
        },
        currentLift: {
          type: 'number',
          description: 'Current observed lift (B vs A)'
        },
        srmCheck: {
          type: 'object',
          properties: {
            passed: { type: 'boolean' },
            pValue: { type: 'number' },
            expectedRatio: { type: 'object' },
            observedRatio: { type: 'object' }
          }
        },
        dataQuality: {
          type: 'object',
          properties: {
            completeness: { type: 'number' },
            issues: { type: 'array', items: { type: 'string' } }
          }
        },
        daysElapsed: { type: 'number' },
        estimatedDaysRemaining: { type: 'number' },
        anomalies: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'monitoring', 'progress']
}));

// Task 3.3: Guardrail Metrics Check
export const guardrailMetricsCheckTask = defineTask('guardrail-metrics-check', (args, taskCtx) => ({
  kind: 'agent',
  title: `Check guardrail metrics - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Quality Assurance Engineer monitoring test health',
      task: 'Check guardrail metrics for threshold violations',
      context: {
        projectName: args.projectName,
        monitoringResults: args.monitoringResults,
        guardrailMetrics: args.guardrailMetrics,
        metricsDefinition: args.metricsDefinition
      },
      instructions: [
        '1. Retrieve current values for all guardrail metrics',
        '2. Compare each metric against defined thresholds',
        '3. Identify any violations (critical or warning)',
        '4. Assess severity of each violation',
        '5. Determine if violations warrant test stoppage',
        '6. Calculate trend for each guardrail metric',
        '7. Check if violations are transient or persistent',
        '8. Generate violation alerts with context',
        '9. Provide recommendations for each violation',
        '10. Document guardrail check results'
      ],
      outputFormat: 'JSON object with guardrail check results and violations'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'violationsDetected', 'artifacts'],
      properties: {
        status: {
          type: 'string',
          enum: ['healthy', 'warning', 'critical'],
          description: 'Overall guardrail status'
        },
        violationsDetected: { type: 'boolean' },
        violations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              threshold: { type: 'number' },
              currentValue: { type: 'number' },
              severity: { type: 'string', enum: ['critical', 'warning'] },
              description: { type: 'string' },
              trend: { type: 'string', enum: ['improving', 'stable', 'degrading'] },
              persistent: { type: 'boolean' }
            }
          }
        },
        stopRecommended: { type: 'boolean' },
        recommendations: {
          type: 'array',
          items: { type: 'string' }
        },
        guardrailMetricValues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              modelA: { type: 'number' },
              modelB: { type: 'number' },
              withinThreshold: { type: 'boolean' }
            }
          }
        },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'guardrails', 'quality-gate']
}));

// Task 3.4: Early Stopping Analysis
export const earlyStoppingAnalysisTask = defineTask('early-stopping-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Early stopping analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Statistician specializing in sequential testing',
      task: 'Analyze whether test can be stopped early with confidence',
      context: {
        projectName: args.projectName,
        monitoringResults: args.monitoringResults,
        targetMetric: args.targetMetric,
        confidenceLevel: args.confidenceLevel,
        statisticalDesign: args.statisticalDesign,
        sequentialTestingEnabled: args.sequentialTestingEnabled
      },
      instructions: [
        '1. Check if minimum sample size threshold is met',
        '2. Calculate current statistical significance',
        '3. Apply sequential testing correction if enabled',
        '4. Calculate confidence intervals for difference',
        '5. Check if confidence intervals exclude zero (clear winner)',
        '6. Assess practical significance of observed effect',
        '7. Check for futility (no chance of reaching significance)',
        '8. Calculate confidence in current result',
        '9. Determine if stopping criteria are met',
        '10. Provide early stopping recommendation with reasoning'
      ],
      outputFormat: 'JSON object with early stopping analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['canStop', 'reason', 'artifacts'],
      properties: {
        canStop: { type: 'boolean' },
        reason: {
          type: 'string',
          description: 'Reason for stopping or continuing'
        },
        criteria: {
          type: 'object',
          properties: {
            minimumSampleSizeMet: { type: 'boolean' },
            statisticallySignificant: { type: 'boolean' },
            practicallySignificant: { type: 'boolean' },
            confidenceIntervalsExcludeZero: { type: 'boolean' },
            futilityDetected: { type: 'boolean' }
          }
        },
        currentPValue: { type: 'number' },
        adjustedAlpha: {
          type: 'number',
          description: 'Alpha level adjusted for sequential testing'
        },
        confidence: {
          type: 'number',
          description: 'Confidence in current result (0-1)'
        },
        preliminaryWinner: {
          type: 'string',
          enum: ['model_a', 'model_b', 'inconclusive']
        },
        stopApproved: {
          type: 'boolean',
          description: 'Whether stakeholder approved early stop (set after breakpoint)'
        },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'early-stopping', 'statistics']
}));

// Task 4.1: Primary Metric Analysis
export const primaryMetricAnalysisTask = defineTask('primary-metric-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze primary metric - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Scientist specializing in A/B testing analysis',
      task: 'Perform comprehensive analysis of primary metric',
      context: {
        projectName: args.projectName,
        monitoringResults: args.monitoringResults,
        targetMetric: args.targetMetric,
        confidenceLevel: args.confidenceLevel,
        statisticalDesign: args.statisticalDesign,
        modelA: args.modelA,
        modelB: args.modelB
      },
      instructions: [
        '1. Calculate final metric values for both variants',
        '2. Calculate standard errors and confidence intervals',
        '3. Calculate absolute difference between variants',
        '4. Calculate relative lift (percentage improvement)',
        '5. Perform primary statistical test',
        '6. Calculate p-value',
        '7. Generate bootstrap confidence intervals as validation',
        '8. Visualize metric distributions',
        '9. Check statistical assumptions',
        '10. Provide interpretation of results'
      ],
      outputFormat: 'JSON object with primary metric analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['modelA', 'modelB', 'difference', 'artifacts'],
      properties: {
        modelA: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            sampleSize: { type: 'number' },
            metricValue: { type: 'number' },
            standardError: { type: 'number' },
            confidenceInterval: {
              type: 'object',
              properties: {
                lower: { type: 'number' },
                upper: { type: 'number' }
              }
            }
          }
        },
        modelB: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            sampleSize: { type: 'number' },
            metricValue: { type: 'number' },
            standardError: { type: 'number' },
            confidenceInterval: {
              type: 'object',
              properties: {
                lower: { type: 'number' },
                upper: { type: 'number' }
              }
            }
          }
        },
        difference: {
          type: 'object',
          properties: {
            absolute: { type: 'number' },
            relative: { type: 'number' },
            confidenceInterval: {
              type: 'object',
              properties: {
                lower: { type: 'number' },
                upper: { type: 'number' }
              }
            }
          }
        },
        relativeLift: {
          type: 'number',
          description: 'Percentage lift of B over A'
        },
        testStatistic: { type: 'number' },
        pValue: { type: 'number' },
        bootstrapCI: {
          type: 'object',
          properties: {
            lower: { type: 'number' },
            upper: { type: 'number' }
          }
        },
        assumptionsCheck: {
          type: 'object',
          properties: {
            normalityCheck: { type: 'boolean' },
            varianceCheck: { type: 'boolean' }
          }
        },
        interpretation: { type: 'string' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'analysis', 'primary-metric']
}));

// Task 4.2: Secondary Metrics Analysis
export const secondaryMetricsAnalysisTask = defineTask('secondary-metrics-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze secondary metrics - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Analyst',
      task: 'Analyze secondary metrics to understand broader impact',
      context: {
        projectName: args.projectName,
        monitoringResults: args.monitoringResults,
        secondaryMetrics: args.secondaryMetrics,
        confidenceLevel: args.confidenceLevel,
        modelA: args.modelA,
        modelB: args.modelB
      },
      instructions: [
        '1. Calculate values for all secondary metrics',
        '2. Perform statistical tests for each metric',
        '3. Calculate confidence intervals',
        '4. Identify metrics with significant differences',
        '5. Look for unexpected side effects',
        '6. Assess consistency with primary metric results',
        '7. Identify trade-offs between metrics',
        '8. Calculate correlation between metrics',
        '9. Provide holistic interpretation',
        '10. Flag any concerning patterns'
      ],
      outputFormat: 'JSON object with secondary metrics analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'artifacts'],
      properties: {
        metrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              modelA: { type: 'number' },
              modelB: { type: 'number' },
              difference: { type: 'number' },
              relativeLift: { type: 'number' },
              pValue: { type: 'number' },
              significant: { type: 'boolean' },
              direction: { type: 'string', enum: ['positive', 'negative', 'neutral'] }
            }
          }
        },
        significantMetrics: {
          type: 'array',
          items: { type: 'string' }
        },
        unexpectedEffects: {
          type: 'array',
          items: { type: 'string' }
        },
        tradeoffs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric1: { type: 'string' },
              metric2: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        consistencyWithPrimary: {
          type: 'string',
          enum: ['consistent', 'mixed', 'contradictory']
        },
        holistic Interpretation: { type: 'string' },
        concerns: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'analysis', 'secondary-metrics']
}));

// Task 4.3: Statistical Significance Test
export const statisticalSignificanceTestTask = defineTask('statistical-significance-test', (args, taskCtx) => ({
  kind: 'agent',
  title: `Statistical significance testing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Statistician',
      task: 'Determine statistical significance of A/B test results',
      context: {
        projectName: args.projectName,
        primaryAnalysis: args.primaryAnalysis,
        secondaryAnalysis: args.secondaryAnalysis,
        confidenceLevel: args.confidenceLevel,
        statisticalDesign: args.statisticalDesign,
        multipleTestingCorrection: args.multipleTestingCorrection
      },
      instructions: [
        '1. Evaluate primary metric p-value against alpha threshold',
        '2. Apply multiple testing correction (Bonferroni, FDR, etc.)',
        '3. Determine if result is statistically significant',
        '4. Calculate adjusted confidence level',
        '5. Assess Type I and Type II error risks',
        '6. Check power analysis retrospectively',
        '7. Validate statistical assumptions were met',
        '8. Calculate probability of false positive',
        '9. Provide confidence statement',
        '10. Give clear statistical verdict'
      ],
      outputFormat: 'JSON object with statistical significance determination'
    },
    outputSchema: {
      type: 'object',
      required: ['significant', 'pValue', 'artifacts'],
      properties: {
        significant: {
          type: 'boolean',
          description: 'Whether result is statistically significant'
        },
        pValue: { type: 'number' },
        alphaThreshold: { type: 'number' },
        adjustedAlpha: {
          type: 'number',
          description: 'Alpha after multiple testing correction'
        },
        multipleTestingCorrection: { type: 'string' },
        confidenceLevel: { type: 'number' },
        typeIErrorRate: { type: 'number' },
        typeIIErrorRate: { type: 'number' },
        power: { type: 'number' },
        assumptionsValidated: { type: 'boolean' },
        falsePositiveProbability: { type: 'number' },
        confidenceStatement: { type: 'string' },
        verdict: {
          type: 'string',
          description: 'Statistical verdict with confidence'
        },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'statistics', 'significance']
}));

// Task 4.4: Effect Size Analysis
export const effectSizeAnalysisTask = defineTask('effect-size-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Effect size analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Statistical Analyst',
      task: 'Analyze effect size and practical significance',
      context: {
        projectName: args.projectName,
        primaryAnalysis: args.primaryAnalysis,
        minimumDetectableEffect: args.minimumDetectableEffect,
        targetMetric: args.targetMetric
      },
      instructions: [
        '1. Calculate effect size (Cohen\'s d, relative lift, etc.)',
        '2. Compare effect size to minimum detectable effect',
        '3. Assess practical significance vs statistical significance',
        '4. Calculate confidence interval for effect size',
        '5. Estimate business impact (revenue, users, etc.)',
        '6. Assess if effect is meaningful in real-world context',
        '7. Compare to typical effect sizes in domain',
        '8. Calculate required sample size to detect this effect',
        '9. Provide effect size interpretation',
        '10. Recommend if effect is actionable'
      ],
      outputFormat: 'JSON object with effect size analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['effectSize', 'practicallySignificant', 'artifacts'],
      properties: {
        effectSize: {
          type: 'number',
          description: 'Standardized effect size measure'
        },
        effectSizeMeasure: {
          type: 'string',
          description: 'Type of effect size (Cohen\'s d, relative lift, etc.)'
        },
        relativeLift: {
          type: 'number',
          description: 'Percentage improvement'
        },
        absoluteDifference: { type: 'number' },
        confidenceInterval: {
          type: 'object',
          properties: {
            lower: { type: 'number' },
            upper: { type: 'number' }
          }
        },
        minimumDetectableEffect: { type: 'number' },
        exceedsMDE: {
          type: 'boolean',
          description: 'Whether effect exceeds minimum detectable effect'
        },
        practicallySignificant: {
          type: 'boolean',
          description: 'Whether effect is meaningful in practice'
        },
        estimatedBusinessImpact: {
          type: 'object',
          properties: {
            metric: { type: 'string' },
            estimatedValue: { type: 'number' },
            currency: { type: 'string' }
          }
        },
        interpretation: {
          type: 'string',
          enum: ['negligible', 'small', 'medium', 'large'],
          description: 'Interpretation of effect size magnitude'
        },
        actionable: {
          type: 'boolean',
          description: 'Whether effect warrants action'
        },
        reasoning: { type: 'string' },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'effect-size', 'practical-significance']
}));

// Task 4.5: Segmentation Analysis
export const segmentationAnalysisTask = defineTask('segmentation-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Segmentation analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Scientist specializing in cohort analysis',
      task: 'Analyze test results across user segments',
      context: {
        projectName: args.projectName,
        monitoringResults: args.monitoringResults,
        targetMetric: args.targetMetric,
        segments: args.segments,
        modelA: args.modelA,
        modelB: args.modelB
      },
      instructions: [
        '1. Identify key user segments (demographics, behavior, platform, etc.)',
        '2. Calculate metric values for each segment in both variants',
        '3. Perform statistical tests within each segment',
        '4. Identify segments with significant differences',
        '5. Look for heterogeneous treatment effects',
        '6. Check for Simpson\'s paradox',
        '7. Identify segments where B clearly wins or loses',
        '8. Assess sample size adequacy per segment',
        '9. Provide segment-specific recommendations',
        '10. Identify opportunities for personalization'
      ],
      outputFormat: 'JSON object with segmentation analysis results'
    },
    outputSchema: {
      type: 'object',
      required: ['segments', 'insights', 'artifacts'],
      properties: {
        segments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segmentName: { type: 'string' },
              segmentSize: { type: 'number' },
              modelA: { type: 'number' },
              modelB: { type: 'number' },
              difference: { type: 'number' },
              relativeLift: { type: 'number' },
              pValue: { type: 'number' },
              significant: { type: 'boolean' },
              sampleSizeAdequate: { type: 'boolean' }
            }
          }
        },
        heterogeneousTreatmentEffects: {
          type: 'boolean',
          description: 'Whether effects vary significantly across segments'
        },
        simpsonsParadox: {
          type: 'boolean',
          description: 'Whether Simpson\'s paradox is present'
        },
        winningSegments: {
          type: 'array',
          items: { type: 'string' },
          description: 'Segments where B significantly outperforms A'
        },
        losingSegments: {
          type: 'array',
          items: { type: 'string' },
          description: 'Segments where B significantly underperforms A'
        },
        insights: {
          type: 'array',
          items: { type: 'string' },
          description: 'Key insights from segmentation analysis'
        },
        personalizationOpportunities: {
          type: 'array',
          items: { type: 'string' }
        },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'segmentation', 'cohort-analysis']
}));

// Task 5.1: Winner Selection
export const winnerSelectionTask = defineTask('winner-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Select test winner - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Decision Analyst',
      task: 'Determine the winning variant based on comprehensive analysis',
      context: {
        projectName: args.projectName,
        primaryAnalysis: args.primaryAnalysis,
        secondaryAnalysis: args.secondaryAnalysis,
        significanceTest: args.significanceTest,
        effectSizeAnalysis: args.effectSizeAnalysis,
        guardrailCheck: args.guardrailCheck,
        targetMetric: args.targetMetric,
        confidenceLevel: args.confidenceLevel,
        modelA: args.modelA,
        modelB: args.modelB
      },
      instructions: [
        '1. Check if test reached statistical significance',
        '2. Verify effect size is practically meaningful',
        '3. Confirm guardrail metrics are not violated',
        '4. Check secondary metrics for consistency',
        '5. Assess overall evidence quality',
        '6. Determine clear winner if criteria met',
        '7. Declare inconclusive if criteria not met',
        '8. Calculate confidence in decision',
        '9. Identify any concerns or caveats',
        '10. Provide clear winner declaration with reasoning'
      ],
      outputFormat: 'JSON object with winner selection and rationale'
    },
    outputSchema: {
      type: 'object',
      required: ['winner', 'confidence', 'rationale', 'artifacts'],
      properties: {
        winner: {
          type: 'string',
          enum: ['model_a', 'model_b', 'inconclusive'],
          description: 'The winning variant or inconclusive'
        },
        winnerName: { type: 'string' },
        confidence: {
          type: 'number',
          description: 'Confidence in decision (0-1)'
        },
        criteria: {
          type: 'object',
          properties: {
            statisticalSignificance: { type: 'boolean' },
            practicalSignificance: { type: 'boolean' },
            guardrailsPass: { type: 'boolean' },
            secondaryMetricsConsistent: { type: 'boolean' }
          }
        },
        rationale: {
          type: 'string',
          description: 'Detailed reasoning for winner selection'
        },
        evidenceQuality: {
          type: 'string',
          enum: ['strong', 'moderate', 'weak'],
          description: 'Quality of evidence supporting decision'
        },
        caveats: {
          type: 'array',
          items: { type: 'string' },
          description: 'Important caveats or limitations'
        },
        summary: {
          type: 'string',
          description: 'Executive summary of winner selection'
        },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'winner-selection', 'decision']
}));

// Task 5.2: Decision Recommendation
export const decisionRecommendationTask = defineTask('decision-recommendation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate decision recommendation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Product Decision Advisor',
      task: 'Provide actionable recommendation based on test results',
      context: {
        projectName: args.projectName,
        winnerSelection: args.winnerSelection,
        primaryAnalysis: args.primaryAnalysis,
        significanceTest: args.significanceTest,
        effectSizeAnalysis: args.effectSizeAnalysis,
        segmentationAnalysis: args.segmentationAnalysis,
        earlyStopTriggered: args.earlyStopTriggered,
        earlyStopReason: args.earlyStopReason,
        targetMetric: args.targetMetric
      },
      instructions: [
        '1. Assess overall test outcome (clear winner, no difference, inconclusive)',
        '2. Consider statistical and practical significance',
        '3. Evaluate business impact and ROI',
        '4. Consider segmentation insights',
        '5. Assess implementation complexity and risks',
        '6. Recommend action: deploy winner, keep control, run longer, or iterate',
        '7. Provide phased rollout strategy if applicable',
        '8. Identify follow-up experiments needed',
        '9. Document key learnings',
        '10. Provide clear, actionable recommendation with reasoning'
      ],
      outputFormat: 'JSON object with decision recommendation'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendation', 'reasoning', 'artifacts'],
      properties: {
        recommendation: {
          type: 'string',
          enum: ['deploy_winner', 'keep_control', 'run_longer', 'iterate', 'deploy_segmented'],
          description: 'Recommended action'
        },
        reasoning: {
          type: 'string',
          description: 'Detailed reasoning for recommendation'
        },
        outcome: {
          type: 'string',
          enum: ['clear_winner', 'no_significant_difference', 'inconclusive', 'mixed_results'],
          description: 'Overall test outcome'
        },
        estimatedBusinessImpact: {
          type: 'object',
          properties: {
            metric: { type: 'string' },
            annualizedValue: { type: 'number' },
            confidence: { type: 'string' }
          }
        },
        rolloutStrategy: {
          type: 'string',
          description: 'Recommended rollout strategy if deploying'
        },
        segmentedDeployment: {
          type: 'object',
          properties: {
            recommended: { type: 'boolean' },
            deployToSegments: { type: 'array', items: { type: 'string' } },
            keepControlForSegments: { type: 'array', items: { type: 'string' } }
          }
        },
        followUpExperiments: {
          type: 'array',
          items: { type: 'string' },
          description: 'Recommended follow-up experiments'
        },
        keyLearnings: {
          type: 'array',
          items: { type: 'string' }
        },
        nextSteps: {
          type: 'array',
          items: { type: 'string' },
          description: 'Immediate next steps to take'
        },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'recommendation', 'decision']
}));

// Task 5.3: Risk Assessment
export const riskAssessmentTask = defineTask('risk-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Assess deployment risks - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Risk Management Specialist',
      task: 'Assess risks associated with deploying the winning variant',
      context: {
        projectName: args.projectName,
        winnerSelection: args.winnerSelection,
        decisionRecommendation: args.decisionRecommendation,
        effectSizeAnalysis: args.effectSizeAnalysis,
        segmentationAnalysis: args.segmentationAnalysis,
        guardrailCheck: args.guardrailCheck
      },
      instructions: [
        '1. Identify technical risks (performance, reliability, bugs)',
        '2. Identify business risks (negative impact on revenue, users)',
        '3. Assess risks from segmentation insights (subgroup harm)',
        '4. Evaluate long-term vs short-term effects',
        '5. Consider novelty effects and regression to mean',
        '6. Assess external validity (generalization beyond test)',
        '7. Identify mitigation strategies for each risk',
        '8. Calculate risk severity and likelihood',
        '9. Recommend monitoring plan post-deployment',
        '10. Provide overall risk assessment and mitigation plan'
      ],
      outputFormat: 'JSON object with risk assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['overallRisk', 'risks', 'artifacts'],
      properties: {
        overallRisk: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'Overall risk level'
        },
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: {
                type: 'string',
                enum: ['technical', 'business', 'user-experience', 'long-term']
              },
              description: { type: 'string' },
              severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
              likelihood: { type: 'string', enum: ['low', 'medium', 'high'] },
              mitigationStrategy: { type: 'string' }
            }
          }
        },
        segmentationRisks: {
          type: 'array',
          items: { type: 'string' },
          description: 'Risks related to differential impact on segments'
        },
        noveltyEffect: {
          type: 'object',
          properties: {
            likely: { type: 'boolean' },
            description: { type: 'string' }
          }
        },
        externalValidity: {
          type: 'string',
          enum: ['high', 'medium', 'low'],
          description: 'Confidence that results generalize'
        },
        postDeploymentMonitoring: {
          type: 'array',
          items: { type: 'string' },
          description: 'Recommended monitoring plan'
        },
        rollbackPlan: {
          type: 'string',
          description: 'Plan for rolling back if issues arise'
        },
        acceptanceCriteria: {
          type: 'array',
          items: { type: 'string' },
          description: 'Criteria for accepting residual risks'
        },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'risk-assessment', 'mitigation']
}));

// Task 6.1: Final Report Generation
export const finalReportGenerationTask = defineTask('final-report-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate final report - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Writer and Data Analyst',
      task: 'Generate comprehensive A/B test final report',
      context: args,
      instructions: [
        '1. Create executive summary with key findings',
        '2. Document test design and methodology',
        '3. Present test timeline and execution details',
        '4. Present primary metric results with visualizations',
        '5. Present secondary metrics analysis',
        '6. Include statistical significance testing results',
        '7. Present effect size and business impact',
        '8. Include segmentation analysis insights',
        '9. Present winner selection and recommendation',
        '10. Document risks, limitations, and follow-up items',
        '11. Generate both Markdown and JSON formats',
        '12. Include all relevant charts and tables'
      ],
      outputFormat: 'JSON object with report path and summary'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        markdownReportPath: { type: 'string' },
        jsonReportPath: { type: 'string' },
        executiveSummary: {
          type: 'string',
          description: 'Brief executive summary'
        },
        keyFindings: {
          type: 'array',
          items: { type: 'string' }
        },
        testMetadata: {
          type: 'object',
          properties: {
            testName: { type: 'string' },
            startDate: { type: 'string' },
            endDate: { type: 'string' },
            duration: { type: 'number' },
            totalSamples: { type: 'number' }
          }
        },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'reporting', 'documentation']
}));

// Task 6.2: Executive Summary
export const executiveSummaryTask = defineTask('executive-summary', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate executive summary - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Executive Communications Specialist',
      task: 'Create concise executive summary for stakeholders',
      context: {
        projectName: args.projectName,
        modelA: args.modelA,
        modelB: args.modelB,
        winnerSelection: args.winnerSelection,
        primaryAnalysis: args.primaryAnalysis,
        significanceTest: args.significanceTest,
        decisionRecommendation: args.decisionRecommendation,
        targetMetric: args.targetMetric,
        currentSampleSize: args.currentSampleSize
      },
      instructions: [
        '1. Start with clear test outcome (winner, no difference, inconclusive)',
        '2. State the winner and confidence level',
        '3. Quantify the improvement (percentage lift)',
        '4. State statistical significance',
        '5. Provide clear recommendation',
        '6. Summarize business impact',
        '7. List key risks or caveats',
        '8. Provide next steps',
        '9. Keep summary to 1-2 paragraphs',
        '10. Use clear, non-technical language'
      ],
      outputFormat: 'JSON object with executive summary'
    },
    outputSchema: {
      type: 'object',
      required: ['summaryPath', 'summary', 'artifacts'],
      properties: {
        summaryPath: { type: 'string' },
        summary: {
          type: 'string',
          description: 'Executive summary text (1-2 paragraphs)'
        },
        headline: {
          type: 'string',
          description: 'One-line headline summarizing result'
        },
        keyTakeaways: {
          type: 'array',
          items: { type: 'string' },
          description: '3-5 bullet points for executives'
        },
        recommendation: { type: 'string' },
        nextSteps: {
          type: 'array',
          items: { type: 'string' }
        },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'executive-summary', 'documentation']
}));

// Task 6.3: Rollout Plan Generation
export const rolloutPlanGenerationTask = defineTask('rollout-plan-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate rollout plan - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Deployment Planning Specialist',
      task: 'Create detailed rollout plan for deploying winning model',
      context: {
        projectName: args.projectName,
        winner: args.winner,
        winningModel: args.winningModel,
        riskAssessment: args.riskAssessment,
        effectSizeAnalysis: args.effectSizeAnalysis
      },
      instructions: [
        '1. Recommend rollout strategy (immediate, phased, canary)',
        '2. Define rollout stages with traffic percentages and durations',
        '3. Specify monitoring requirements during rollout',
        '4. Define success criteria for each stage',
        '5. Create rollback plan and triggers',
        '6. Specify post-deployment monitoring period',
        '7. Define metrics to track post-rollout',
        '8. Create rollout timeline with milestones',
        '9. Assign responsibilities and stakeholders',
        '10. Document rollout checklist'
      ],
      outputFormat: 'JSON object with detailed rollout plan'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'strategy', 'artifacts'],
      properties: {
        strategy: {
          type: 'string',
          enum: ['immediate', 'phased', 'canary', 'segmented'],
          description: 'Recommended rollout strategy'
        },
        plan: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stage: { type: 'string' },
              trafficPercentage: { type: 'number' },
              duration: { type: 'string' },
              successCriteria: { type: 'array', items: { type: 'string' } },
              monitoringRequirements: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        rollbackPlan: {
          type: 'object',
          properties: {
            triggers: { type: 'array', items: { type: 'string' } },
            procedure: { type: 'string' },
            timeToRollback: { type: 'string' }
          }
        },
        postDeploymentMonitoring: {
          type: 'object',
          properties: {
            duration: { type: 'string' },
            metrics: { type: 'array', items: { type: 'string' } },
            alerting: { type: 'array', items: { type: 'string' } }
          }
        },
        timeline: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              milestone: { type: 'string' },
              date: { type: 'string' },
              responsible: { type: 'string' }
            }
          }
        },
        checklist: {
          type: 'array',
          items: { type: 'string' }
        },
        artifacts: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ab-testing', 'rollout-plan', 'deployment']
}));
