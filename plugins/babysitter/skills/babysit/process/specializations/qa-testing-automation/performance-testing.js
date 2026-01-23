/**
 * @process specializations/qa-testing-automation/performance-testing
 * @description Performance Testing Implementation - Comprehensive performance testing strategy covering load testing,
 * stress testing, spike testing, soak testing, and scalability testing with workload modeling, performance benchmarking,
 * bottleneck identification, and optimization recommendations.
 * @inputs { projectName: string, applicationUrl: string, performanceGoals?: object, testScenarios?: array, expectedLoad?: object }
 * @outputs { success: boolean, performanceScore: number, testResults: object, bottlenecks: array, recommendations: array }
 *
 * @example
 * const result = await orchestrate('specializations/qa-testing-automation/performance-testing', {
 *   projectName: 'E-commerce API',
 *   applicationUrl: 'https://api.staging.example.com',
 *   performanceGoals: {
 *     responseTime: { p95: 500, p99: 1000 },
 *     throughput: { rps: 1000 },
 *     errorRate: { max: 0.1 },
 *     concurrentUsers: 5000
 *   },
 *   testScenarios: ['User Login', 'Product Search', 'Checkout', 'Order History'],
 *   expectedLoad: { dailyUsers: 100000, peakHourMultiplier: 3 }
 * });
 *
 * @references
 * - k6 Documentation: https://k6.io/docs/
 * - Performance Testing Patterns: https://martinfowler.com/articles/practical-test-pyramid.html
 * - Load Testing Best Practices: https://www.nginx.com/blog/load-testing-best-practices/
 * - Apache JMeter: https://jmeter.apache.org/
 * - Gatling Documentation: https://gatling.io/docs/
 * - Performance Engineering: https://www.infoq.com/articles/performance-engineering/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    applicationUrl,
    performanceGoals = {
      responseTime: { p95: 500, p99: 1000 },
      throughput: { rps: 500 },
      errorRate: { max: 1.0 },
      concurrentUsers: 1000
    },
    testScenarios = [],
    expectedLoad = {},
    testingTool = 'k6', // 'k6', 'jmeter', 'gatling'
    testDuration = {
      load: '5m',
      stress: '10m',
      spike: '3m',
      soak: '30m'
    },
    outputDir = 'performance-testing-output',
    environmentType = 'staging',
    monitoringEnabled = true,
    baselineAvailable = false
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let performanceScore = 0;

  ctx.log('info', `Starting Performance Testing Implementation for ${projectName}`);
  ctx.log('info', `Application URL: ${applicationUrl}, Tool: ${testingTool}`);

  // ============================================================================
  // PHASE 1: PERFORMANCE REQUIREMENTS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing performance requirements and SLAs');

  const requirementsAnalysis = await ctx.task(performanceRequirementsTask, {
    projectName,
    applicationUrl,
    performanceGoals,
    expectedLoad,
    testScenarios,
    environmentType,
    outputDir
  });

  artifacts.push(...requirementsAnalysis.artifacts);

  // Quality Gate: Requirements completeness
  if (!requirementsAnalysis.requirementsComplete) {
    await ctx.breakpoint({
      question: `Performance requirements analysis incomplete. Missing: ${requirementsAnalysis.missingRequirements.join(', ')}. Review and provide missing requirements?`,
      title: 'Performance Requirements Review',
      context: {
        runId: ctx.runId,
        missingRequirements: requirementsAnalysis.missingRequirements,
        definedGoals: requirementsAnalysis.definedGoals,
        recommendation: 'Complete all performance SLAs and acceptance criteria before proceeding',
        files: requirementsAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 2: WORKLOAD MODELING AND USER BEHAVIOR ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Modeling workload patterns and user behavior');

  const workloadModeling = await ctx.task(workloadModelingTask, {
    projectName,
    testScenarios,
    expectedLoad,
    requirementsAnalysis,
    outputDir
  });

  artifacts.push(...workloadModeling.artifacts);

  // Quality Gate: Workload model validation
  if (workloadModeling.scenariosCovered < testScenarios.length * 0.8) {
    await ctx.breakpoint({
      question: `Workload model covers ${workloadModeling.scenariosCovered}/${testScenarios.length} scenarios (${((workloadModeling.scenariosCovered / testScenarios.length) * 100).toFixed(0)}%). Review coverage and approve?`,
      title: 'Workload Model Coverage',
      context: {
        runId: ctx.runId,
        scenariosCovered: workloadModeling.scenariosCovered,
        totalScenarios: testScenarios.length,
        uncoveredScenarios: workloadModeling.uncoveredScenarios,
        files: workloadModeling.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 3: TEST ENVIRONMENT SETUP AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Setting up and validating test environment');

  const environmentSetup = await ctx.task(environmentSetupTask, {
    projectName,
    applicationUrl,
    environmentType,
    testingTool,
    monitoringEnabled,
    outputDir
  });

  artifacts.push(...environmentSetup.artifacts);

  // Quality Gate: Environment readiness
  if (!environmentSetup.environmentReady) {
    await ctx.breakpoint({
      question: `Test environment not ready. Issues: ${environmentSetup.issues.join(', ')}. Resolve issues and continue?`,
      title: 'Environment Readiness Check',
      context: {
        runId: ctx.runId,
        issues: environmentSetup.issues,
        monitoringStatus: environmentSetup.monitoringStatus,
        recommendation: 'Ensure environment is stable and monitoring is configured',
        files: environmentSetup.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 4: BASELINE PERFORMANCE MEASUREMENT (if needed)
  // ============================================================================

  let baselineResults = null;
  if (!baselineAvailable) {
    ctx.log('info', 'Phase 4: Establishing performance baseline');

    baselineResults = await ctx.task(baselineTestTask, {
      projectName,
      applicationUrl,
      workloadModeling,
      testingTool,
      testDuration: '5m',
      outputDir
    });

    artifacts.push(...baselineResults.artifacts);

    ctx.log('info', `Baseline established - P95: ${baselineResults.metrics.p95}ms, RPS: ${baselineResults.metrics.rps}`);
  }

  // ============================================================================
  // PHASE 5: PERFORMANCE TEST SCRIPT DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Developing performance test scripts');

  const testScriptDevelopment = await ctx.task(testScriptDevelopmentTask, {
    projectName,
    applicationUrl,
    workloadModeling,
    requirementsAnalysis,
    testingTool,
    outputDir
  });

  artifacts.push(...testScriptDevelopment.artifacts);

  // Quality Gate: Script validation
  if (testScriptDevelopment.scriptErrors.length > 0) {
    await ctx.breakpoint({
      question: `${testScriptDevelopment.scriptErrors.length} script validation errors found. Review errors and fix?`,
      title: 'Test Script Validation',
      context: {
        runId: ctx.runId,
        scriptErrors: testScriptDevelopment.scriptErrors,
        scriptsCreated: testScriptDevelopment.scriptsCreated,
        files: testScriptDevelopment.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 6: PARALLEL PERFORMANCE TEST EXECUTION
  // ============================================================================

  ctx.log('info', 'Phase 6: Executing performance tests in parallel');

  // Execute different test types in parallel
  const [
    loadTestResults,
    stressTestResults,
    spikeTestResults
  ] = await ctx.parallel.all([
    () => ctx.task(loadTestTask, {
      projectName,
      applicationUrl,
      workloadModeling,
      performanceGoals,
      testScriptDevelopment,
      testingTool,
      testDuration: testDuration.load,
      outputDir
    }),
    () => ctx.task(stressTestTask, {
      projectName,
      applicationUrl,
      workloadModeling,
      performanceGoals,
      testScriptDevelopment,
      testingTool,
      testDuration: testDuration.stress,
      outputDir
    }),
    () => ctx.task(spikeTestTask, {
      projectName,
      applicationUrl,
      workloadModeling,
      performanceGoals,
      testScriptDevelopment,
      testingTool,
      testDuration: testDuration.spike,
      outputDir
    })
  ]);

  artifacts.push(
    ...loadTestResults.artifacts,
    ...stressTestResults.artifacts,
    ...spikeTestResults.artifacts
  );

  ctx.log('info', `Load Test - P95: ${loadTestResults.metrics.p95}ms, Pass: ${loadTestResults.passed}`);
  ctx.log('info', `Stress Test - Max Users: ${stressTestResults.maxConcurrentUsers}, Pass: ${stressTestResults.passed}`);
  ctx.log('info', `Spike Test - Recovery Time: ${spikeTestResults.recoveryTime}s, Pass: ${spikeTestResults.passed}`);

  // Quality Gate: Load test performance
  if (!loadTestResults.passed) {
    await ctx.breakpoint({
      question: `Load test failed to meet performance goals. P95: ${loadTestResults.metrics.p95}ms (target: ${performanceGoals.responseTime.p95}ms). Review results and decide action?`,
      title: 'Load Test Performance Gate',
      context: {
        runId: ctx.runId,
        metrics: loadTestResults.metrics,
        goals: performanceGoals,
        failedChecks: loadTestResults.failedChecks,
        recommendation: 'Analyze bottlenecks and optimize before proceeding',
        files: loadTestResults.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 7: SOAK TEST (ENDURANCE TESTING)
  // ============================================================================

  ctx.log('info', 'Phase 7: Running soak test for memory leaks and stability');

  const soakTestResults = await ctx.task(soakTestTask, {
    projectName,
    applicationUrl,
    workloadModeling,
    performanceGoals,
    testScriptDevelopment,
    testingTool,
    testDuration: testDuration.soak,
    outputDir
  });

  artifacts.push(...soakTestResults.artifacts);

  // Quality Gate: Soak test stability
  if (soakTestResults.memoryLeakDetected || soakTestResults.performanceDegradation) {
    await ctx.breakpoint({
      question: `Soak test detected issues - Memory Leak: ${soakTestResults.memoryLeakDetected}, Performance Degradation: ${soakTestResults.performanceDegradation}. Review and address?`,
      title: 'Soak Test Stability Issues',
      context: {
        runId: ctx.runId,
        memoryTrend: soakTestResults.memoryTrend,
        performanceTrend: soakTestResults.performanceTrend,
        issues: soakTestResults.detectedIssues,
        files: soakTestResults.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 8: BOTTLENECK IDENTIFICATION AND ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 8: Identifying performance bottlenecks');

  const bottleneckAnalysis = await ctx.task(bottleneckAnalysisTask, {
    projectName,
    loadTestResults,
    stressTestResults,
    spikeTestResults,
    soakTestResults,
    environmentSetup,
    monitoringEnabled,
    outputDir
  });

  artifacts.push(...bottleneckAnalysis.artifacts);

  const criticalBottlenecks = bottleneckAnalysis.bottlenecks.filter(b => b.severity === 'critical');

  // Quality Gate: Critical bottlenecks
  if (criticalBottlenecks.length > 0) {
    await ctx.breakpoint({
      question: `${criticalBottlenecks.length} critical performance bottlenecks identified. Review bottlenecks and optimization recommendations?`,
      title: 'Critical Bottleneck Review',
      context: {
        runId: ctx.runId,
        criticalBottlenecks: criticalBottlenecks.map(b => ({
          component: b.component,
          issue: b.issue,
          impact: b.impact
        })),
        allBottlenecks: bottleneckAnalysis.bottlenecks.length,
        files: bottleneckAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 9: SCALABILITY TESTING
  // ============================================================================

  ctx.log('info', 'Phase 9: Running scalability tests');

  const scalabilityTest = await ctx.task(scalabilityTestTask, {
    projectName,
    applicationUrl,
    workloadModeling,
    performanceGoals,
    testScriptDevelopment,
    testingTool,
    outputDir
  });

  artifacts.push(...scalabilityTest.artifacts);

  // ============================================================================
  // PHASE 10: PERFORMANCE OPTIMIZATION RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 10: Generating optimization recommendations');

  const optimizationRecommendations = await ctx.task(optimizationRecommendationsTask, {
    projectName,
    requirementsAnalysis,
    loadTestResults,
    stressTestResults,
    spikeTestResults,
    soakTestResults,
    scalabilityTest,
    bottleneckAnalysis,
    outputDir
  });

  artifacts.push(...optimizationRecommendations.artifacts);

  // ============================================================================
  // PHASE 11: COMPARATIVE ANALYSIS (if baseline exists)
  // ============================================================================

  let comparativeAnalysis = null;
  if (baselineResults) {
    ctx.log('info', 'Phase 11: Performing comparative analysis against baseline');

    comparativeAnalysis = await ctx.task(comparativeAnalysisTask, {
      projectName,
      baselineResults,
      loadTestResults,
      performanceGoals,
      outputDir
    });

    artifacts.push(...comparativeAnalysis.artifacts);

    // Quality Gate: Performance regression
    if (comparativeAnalysis.regressionDetected) {
      await ctx.breakpoint({
        question: `Performance regression detected: ${comparativeAnalysis.regressionPercentage}% slower than baseline. Review regression details?`,
        title: 'Performance Regression Detected',
        context: {
          runId: ctx.runId,
          regressionPercentage: comparativeAnalysis.regressionPercentage,
          regressionDetails: comparativeAnalysis.regressionDetails,
          recommendation: 'Investigate changes causing performance degradation',
          files: comparativeAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
        }
      });
    }
  }

  // ============================================================================
  // PHASE 12: COMPREHENSIVE PERFORMANCE REPORT
  // ============================================================================

  ctx.log('info', 'Phase 12: Generating comprehensive performance report');

  const performanceReport = await ctx.task(performanceReportTask, {
    projectName,
    requirementsAnalysis,
    workloadModeling,
    baselineResults,
    loadTestResults,
    stressTestResults,
    spikeTestResults,
    soakTestResults,
    scalabilityTest,
    bottleneckAnalysis,
    optimizationRecommendations,
    comparativeAnalysis,
    performanceGoals,
    outputDir
  });

  artifacts.push(...performanceReport.artifacts);

  // ============================================================================
  // PHASE 13: PERFORMANCE SCORING AND ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 13: Computing performance score and final assessment');

  const finalAssessment = await ctx.task(performanceAssessmentTask, {
    projectName,
    performanceGoals,
    loadTestResults,
    stressTestResults,
    spikeTestResults,
    soakTestResults,
    scalabilityTest,
    bottleneckAnalysis,
    optimizationRecommendations,
    outputDir
  });

  performanceScore = finalAssessment.performanceScore;
  artifacts.push(...finalAssessment.artifacts);

  ctx.log('info', `Performance Score: ${performanceScore}/100`);

  // Quality Gate: Overall performance score
  const performanceAcceptable = performanceScore >= 70;

  // Final Breakpoint: Performance Testing Review
  await ctx.breakpoint({
    question: `Performance Testing Complete for ${projectName}. Performance Score: ${performanceScore}/100. ${performanceAcceptable ? 'Performance meets acceptable standards!' : 'Performance needs improvement.'} Approve results?`,
    title: 'Final Performance Testing Review',
    context: {
      runId: ctx.runId,
      summary: {
        performanceScore,
        performanceAcceptable,
        loadTestPassed: loadTestResults.passed,
        stressTestPassed: stressTestResults.passed,
        spikeTestPassed: spikeTestResults.passed,
        soakTestPassed: soakTestResults.passed,
        scalabilityScore: scalabilityTest.scalabilityScore,
        criticalBottlenecks: criticalBottlenecks.length,
        optimizationCount: optimizationRecommendations.recommendations.length
      },
      goals: performanceGoals,
      verdict: finalAssessment.verdict,
      recommendation: finalAssessment.recommendation,
      files: [
        { path: performanceReport.reportPath, format: 'markdown', label: 'Performance Test Report' },
        { path: finalAssessment.summaryPath, format: 'json', label: 'Assessment Summary' },
        { path: bottleneckAnalysis.analysisPath, format: 'markdown', label: 'Bottleneck Analysis' },
        { path: optimizationRecommendations.recommendationsPath, format: 'markdown', label: 'Optimization Recommendations' }
      ]
    }
  });

  // ============================================================================
  // PHASE 14: CI/CD INTEGRATION SETUP (if needed)
  // ============================================================================

  let cicdIntegration = null;
  if (performanceAcceptable) {
    ctx.log('info', 'Phase 14: Setting up CI/CD integration for performance testing');

    cicdIntegration = await ctx.task(cicdIntegrationTask, {
      projectName,
      testScriptDevelopment,
      performanceGoals,
      testingTool,
      outputDir
    });

    artifacts.push(...cicdIntegration.artifacts);
  }

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    applicationUrl,
    testingTool,
    performanceScore,
    performanceAcceptable,
    performanceGoals,
    testResults: {
      loadTest: {
        passed: loadTestResults.passed,
        metrics: loadTestResults.metrics,
        duration: loadTestResults.duration
      },
      stressTest: {
        passed: stressTestResults.passed,
        maxConcurrentUsers: stressTestResults.maxConcurrentUsers,
        breakingPoint: stressTestResults.breakingPoint
      },
      spikeTest: {
        passed: spikeTestResults.passed,
        recoveryTime: spikeTestResults.recoveryTime,
        maxSpike: spikeTestResults.maxSpike
      },
      soakTest: {
        passed: soakTestResults.passed,
        memoryLeakDetected: soakTestResults.memoryLeakDetected,
        performanceDegradation: soakTestResults.performanceDegradation,
        duration: soakTestResults.duration
      },
      scalabilityTest: {
        scalabilityScore: scalabilityTest.scalabilityScore,
        linearScaling: scalabilityTest.linearScaling,
        recommendedMaxLoad: scalabilityTest.recommendedMaxLoad
      }
    },
    bottlenecks: bottleneckAnalysis.bottlenecks.map(b => ({
      component: b.component,
      severity: b.severity,
      issue: b.issue,
      impact: b.impact
    })),
    recommendations: optimizationRecommendations.recommendations.map(r => ({
      priority: r.priority,
      category: r.category,
      recommendation: r.recommendation,
      estimatedImpact: r.estimatedImpact
    })),
    baseline: baselineResults ? {
      established: true,
      metrics: baselineResults.metrics
    } : null,
    comparativeAnalysis: comparativeAnalysis ? {
      regressionDetected: comparativeAnalysis.regressionDetected,
      regressionPercentage: comparativeAnalysis.regressionPercentage,
      improvements: comparativeAnalysis.improvements
    } : null,
    cicdIntegration: cicdIntegration ? {
      configured: cicdIntegration.configured,
      pipelineConfigPath: cicdIntegration.pipelineConfigPath,
      thresholds: cicdIntegration.thresholds
    } : null,
    artifacts,
    performanceReport: {
      reportPath: performanceReport.reportPath,
      summaryPath: finalAssessment.summaryPath,
      dashboardUrl: performanceReport.dashboardUrl
    },
    duration,
    metadata: {
      processId: 'specializations/qa-testing-automation/performance-testing',
      timestamp: startTime,
      testingTool,
      environmentType,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Performance Requirements Analysis
export const performanceRequirementsTask = defineTask('performance-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Performance Requirements Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Performance Engineering Architect',
      task: 'Analyze and define comprehensive performance requirements and SLAs',
      context: {
        projectName: args.projectName,
        applicationUrl: args.applicationUrl,
        performanceGoals: args.performanceGoals,
        expectedLoad: args.expectedLoad,
        testScenarios: args.testScenarios,
        environmentType: args.environmentType,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Review and validate provided performance goals',
        '2. Define response time SLAs (p50, p95, p99) for all scenarios',
        '3. Define throughput targets (requests per second, transactions per minute)',
        '4. Define concurrency targets (concurrent users, connections)',
        '5. Define error rate thresholds (acceptable error percentage)',
        '6. Define resource utilization limits (CPU, memory, disk, network)',
        '7. Identify peak load patterns (daily, weekly, seasonal)',
        '8. Define scalability requirements (horizontal, vertical)',
        '9. Identify performance-critical user journeys',
        '10. Document acceptance criteria for each test type',
        '11. Create performance requirements specification document'
      ],
      outputFormat: 'JSON object with performance requirements and analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['requirementsComplete', 'definedGoals', 'missingRequirements', 'artifacts'],
      properties: {
        requirementsComplete: { type: 'boolean' },
        definedGoals: {
          type: 'object',
          properties: {
            responseTime: {
              type: 'object',
              properties: {
                p50: { type: 'number' },
                p95: { type: 'number' },
                p99: { type: 'number' }
              }
            },
            throughput: {
              type: 'object',
              properties: {
                rps: { type: 'number' },
                tpm: { type: 'number' }
              }
            },
            concurrency: {
              type: 'object',
              properties: {
                maxUsers: { type: 'number' },
                maxConnections: { type: 'number' }
              }
            },
            errorRate: {
              type: 'object',
              properties: {
                max: { type: 'number' }
              }
            },
            resources: {
              type: 'object',
              properties: {
                cpuMax: { type: 'number' },
                memoryMax: { type: 'number' }
              }
            }
          }
        },
        criticalScenarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              sla: { type: 'object' }
            }
          }
        },
        loadPatterns: {
          type: 'object',
          properties: {
            averageLoad: { type: 'number' },
            peakLoad: { type: 'number' },
            peakHours: { type: 'array', items: { type: 'string' } }
          }
        },
        missingRequirements: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'performance-testing', 'requirements-analysis']
}));

// Phase 2: Workload Modeling
export const workloadModelingTask = defineTask('workload-modeling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Workload Modeling - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Performance Test Design Specialist',
      task: 'Model realistic workload patterns and user behavior for performance testing',
      context: {
        projectName: args.projectName,
        testScenarios: args.testScenarios,
        expectedLoad: args.expectedLoad,
        requirementsAnalysis: args.requirementsAnalysis,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze user behavior patterns and journey flows',
        '2. Define think time between user actions (realistic pauses)',
        '3. Model ramp-up patterns (gradual load increase)',
        '4. Define steady-state load (constant user load)',
        '5. Model ramp-down patterns (graceful load decrease)',
        '6. Create virtual user profiles with different behaviors',
        '7. Define scenario distribution (% of users per scenario)',
        '8. Model data variation (different test data per virtual user)',
        '9. Include pacing to control request rate',
        '10. Create workload model document with visualizations'
      ],
      outputFormat: 'JSON object with workload model'
    },
    outputSchema: {
      type: 'object',
      required: ['scenariosCovered', 'workloadProfiles', 'artifacts'],
      properties: {
        scenariosCovered: { type: 'number' },
        uncoveredScenarios: { type: 'array', items: { type: 'string' } },
        workloadProfiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              scenario: { type: 'string' },
              distribution: { type: 'number', description: 'Percentage of total load' },
              thinkTime: { type: 'string', description: 'e.g., "2-5s"' },
              steps: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        rampUpStrategy: {
          type: 'object',
          properties: {
            startUsers: { type: 'number' },
            targetUsers: { type: 'number' },
            duration: { type: 'string' },
            pattern: { type: 'string', enum: ['linear', 'exponential', 'stepped'] }
          }
        },
        steadyStateLoad: {
          type: 'object',
          properties: {
            virtualUsers: { type: 'number' },
            duration: { type: 'string' },
            expectedRps: { type: 'number' }
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
  labels: ['agent', 'performance-testing', 'workload-modeling']
}));

// Phase 3: Environment Setup
export const environmentSetupTask = defineTask('environment-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Test Environment Setup - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Performance Testing Infrastructure Engineer',
      task: 'Set up and validate performance testing environment',
      context: {
        projectName: args.projectName,
        applicationUrl: args.applicationUrl,
        environmentType: args.environmentType,
        testingTool: args.testingTool,
        monitoringEnabled: args.monitoringEnabled,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Validate application environment is accessible and stable',
        '2. Install and configure performance testing tool (k6, JMeter, Gatling)',
        '3. Set up monitoring infrastructure (Prometheus, Grafana, CloudWatch)',
        '4. Configure APM tools for application monitoring',
        '5. Set up database monitoring',
        '6. Configure log aggregation',
        '7. Verify network connectivity and bandwidth',
        '8. Set up test data generation infrastructure',
        '9. Configure result collection and storage',
        '10. Validate environment with smoke test'
      ],
      outputFormat: 'JSON object with environment setup status'
    },
    outputSchema: {
      type: 'object',
      required: ['environmentReady', 'issues', 'monitoringStatus', 'artifacts'],
      properties: {
        environmentReady: { type: 'boolean' },
        testingToolInstalled: { type: 'boolean' },
        testingToolVersion: { type: 'string' },
        monitoringStatus: {
          type: 'object',
          properties: {
            applicationMonitoring: { type: 'boolean' },
            databaseMonitoring: { type: 'boolean' },
            infraMonitoring: { type: 'boolean' },
            logAggregation: { type: 'boolean' }
          }
        },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              component: { type: 'string' },
              issue: { type: 'string' },
              severity: { type: 'string' }
            }
          }
        },
        smokeTestPassed: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'performance-testing', 'environment-setup']
}));

// Phase 4: Baseline Test
export const baselineTestTask = defineTask('baseline-test', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Baseline Performance Test - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Performance Test Engineer',
      task: 'Establish performance baseline for future comparison',
      context: {
        projectName: args.projectName,
        applicationUrl: args.applicationUrl,
        workloadModeling: args.workloadModeling,
        testingTool: args.testingTool,
        testDuration: args.testDuration,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Run performance test with moderate load (50% of expected peak)',
        '2. Capture response time metrics (min, max, avg, p95, p99)',
        '3. Capture throughput metrics (RPS, TPM)',
        '4. Measure resource utilization (CPU, memory, disk, network)',
        '5. Record error rates and error types',
        '6. Capture database performance metrics',
        '7. Save baseline metrics for future comparison',
        '8. Generate baseline report with charts',
        '9. Store baseline data in version control',
        '10. Document test conditions and environment state'
      ],
      outputFormat: 'JSON object with baseline results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'metrics', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        metrics: {
          type: 'object',
          properties: {
            responseTime: {
              type: 'object',
              properties: {
                min: { type: 'number' },
                max: { type: 'number' },
                avg: { type: 'number' },
                p50: { type: 'number' },
                p95: { type: 'number' },
                p99: { type: 'number' }
              }
            },
            throughput: {
              type: 'object',
              properties: {
                rps: { type: 'number' },
                totalRequests: { type: 'number' }
              }
            },
            errorRate: { type: 'number' },
            resources: {
              type: 'object',
              properties: {
                cpuAvg: { type: 'number' },
                memoryAvg: { type: 'number' }
              }
            }
          }
        },
        testConditions: {
          type: 'object',
          properties: {
            virtualUsers: { type: 'number' },
            duration: { type: 'string' },
            timestamp: { type: 'string' }
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
  labels: ['agent', 'performance-testing', 'baseline']
}));

// Phase 5: Test Script Development
export const testScriptDevelopmentTask = defineTask('test-script-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Performance Test Script Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Performance Test Automation Engineer',
      task: 'Develop performance test scripts for all test scenarios',
      context: {
        projectName: args.projectName,
        applicationUrl: args.applicationUrl,
        workloadModeling: args.workloadModeling,
        requirementsAnalysis: args.requirementsAnalysis,
        testingTool: args.testingTool,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create test scripts for each workload profile',
        '2. Implement parameterization for dynamic test data',
        '3. Add correlation for dynamic values (tokens, session IDs)',
        '4. Implement think time between requests',
        '5. Add custom metrics and thresholds',
        '6. Implement error handling and assertions',
        '7. Add logging for debugging',
        '8. Implement ramp-up and ramp-down logic',
        '9. Add checks for response validation',
        '10. Validate scripts with dry run'
      ],
      outputFormat: 'JSON object with test scripts'
    },
    outputSchema: {
      type: 'object',
      required: ['scriptsCreated', 'scriptErrors', 'artifacts'],
      properties: {
        scriptsCreated: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scriptName: { type: 'string' },
              scriptPath: { type: 'string' },
              scenario: { type: 'string' },
              validated: { type: 'boolean' }
            }
          }
        },
        scriptErrors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              script: { type: 'string' },
              error: { type: 'string' },
              line: { type: 'number' }
            }
          }
        },
        parametersUsed: { type: 'array', items: { type: 'string' } },
        customMetrics: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'performance-testing', 'test-scripts']
}));

// Phase 6.1: Load Test
export const loadTestTask = defineTask('load-test', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Load Test Execution - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Performance Test Execution Specialist',
      task: 'Execute load test to validate performance under expected load',
      context: {
        projectName: args.projectName,
        applicationUrl: args.applicationUrl,
        workloadModeling: args.workloadModeling,
        performanceGoals: args.performanceGoals,
        testScriptDevelopment: args.testScriptDevelopment,
        testingTool: args.testingTool,
        testDuration: args.testDuration,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Execute load test with expected concurrent users',
        '2. Ramp up to target load gradually',
        '3. Maintain steady state for specified duration',
        '4. Capture all performance metrics (response time, throughput, errors)',
        '5. Monitor resource utilization during test',
        '6. Identify slow transactions and outliers',
        '7. Compare results against performance goals',
        '8. Generate detailed HTML report with charts',
        '9. Capture failed requests for analysis',
        '10. Determine pass/fail status based on thresholds'
      ],
      outputFormat: 'JSON object with load test results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'passed', 'metrics', 'duration', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        passed: { type: 'boolean', description: 'Whether test met performance goals' },
        metrics: {
          type: 'object',
          properties: {
            responseTime: {
              type: 'object',
              properties: {
                min: { type: 'number' },
                max: { type: 'number' },
                avg: { type: 'number' },
                p95: { type: 'number' },
                p99: { type: 'number' }
              }
            },
            throughput: {
              type: 'object',
              properties: {
                rps: { type: 'number' },
                totalRequests: { type: 'number' }
              }
            },
            errorRate: { type: 'number' },
            concurrentUsers: { type: 'number' }
          }
        },
        duration: { type: 'string' },
        failedChecks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              check: { type: 'string' },
              expected: { type: 'string' },
              actual: { type: 'string' }
            }
          }
        },
        slowTransactions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'performance-testing', 'load-test']
}));

// Phase 6.2: Stress Test
export const stressTestTask = defineTask('stress-test', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Stress Test Execution - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Performance Test Execution Specialist',
      task: 'Execute stress test to find system breaking point',
      context: {
        projectName: args.projectName,
        applicationUrl: args.applicationUrl,
        workloadModeling: args.workloadModeling,
        performanceGoals: args.performanceGoals,
        testScriptDevelopment: args.testScriptDevelopment,
        testingTool: args.testingTool,
        testDuration: args.testDuration,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Start with normal load and gradually increase',
        '2. Continue increasing load beyond expected capacity',
        '3. Monitor for system degradation and failures',
        '4. Identify breaking point (where errors spike)',
        '5. Observe system recovery after load reduction',
        '6. Capture maximum concurrent users handled',
        '7. Document error patterns at high load',
        '8. Measure resource exhaustion (CPU, memory, connections)',
        '9. Validate graceful degradation under stress',
        '10. Generate stress test report with breaking point analysis'
      ],
      outputFormat: 'JSON object with stress test results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'passed', 'maxConcurrentUsers', 'breakingPoint', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        passed: { type: 'boolean' },
        maxConcurrentUsers: { type: 'number', description: 'Maximum users before degradation' },
        breakingPoint: {
          type: 'object',
          properties: {
            users: { type: 'number' },
            errorRate: { type: 'number' },
            avgResponseTime: { type: 'number' }
          }
        },
        gracefulDegradation: { type: 'boolean', description: 'System degraded gracefully' },
        recoveryTime: { type: 'number', description: 'Seconds to recover after load reduction' },
        resourceExhaustion: {
          type: 'object',
          properties: {
            cpu: { type: 'boolean' },
            memory: { type: 'boolean' },
            connections: { type: 'boolean' }
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
  labels: ['agent', 'performance-testing', 'stress-test']
}));

// Phase 6.3: Spike Test
export const spikeTestTask = defineTask('spike-test', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Spike Test Execution - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Performance Test Execution Specialist',
      task: 'Execute spike test to validate system behavior under sudden load spikes',
      context: {
        projectName: args.projectName,
        applicationUrl: args.applicationUrl,
        workloadModeling: args.workloadModeling,
        performanceGoals: args.performanceGoals,
        testScriptDevelopment: args.testScriptDevelopment,
        testingTool: args.testingTool,
        testDuration: args.testDuration,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Start with low baseline load',
        '2. Suddenly increase load to 2-3x peak (simulate traffic spike)',
        '3. Maintain spike for short duration (1-2 minutes)',
        '4. Drop back to baseline',
        '5. Repeat spike pattern 2-3 times',
        '6. Measure system response during spike',
        '7. Measure recovery time after spike',
        '8. Check for errors during and after spike',
        '9. Validate auto-scaling response (if applicable)',
        '10. Generate spike test report with recovery analysis'
      ],
      outputFormat: 'JSON object with spike test results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'passed', 'recoveryTime', 'maxSpike', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        passed: { type: 'boolean' },
        maxSpike: { type: 'number', description: 'Maximum spike load tested' },
        recoveryTime: { type: 'number', description: 'Seconds to recover after spike' },
        errorsDuringSpike: { type: 'number' },
        errorsAfterSpike: { type: 'number' },
        autoScalingTriggered: { type: 'boolean' },
        responseTimeDuringSpike: {
          type: 'object',
          properties: {
            p95: { type: 'number' },
            p99: { type: 'number' }
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
  labels: ['agent', 'performance-testing', 'spike-test']
}));

// Phase 7: Soak Test
export const soakTestTask = defineTask('soak-test', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Soak Test Execution - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Performance Test Execution Specialist',
      task: 'Execute soak test to identify memory leaks and long-term stability issues',
      context: {
        projectName: args.projectName,
        applicationUrl: args.applicationUrl,
        workloadModeling: args.workloadModeling,
        performanceGoals: args.performanceGoals,
        testScriptDevelopment: args.testScriptDevelopment,
        testingTool: args.testingTool,
        testDuration: args.testDuration,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Run test with moderate sustained load (70% of peak)',
        '2. Maintain load for extended duration (30+ minutes)',
        '3. Monitor memory usage trend over time',
        '4. Monitor response time trend over time',
        '5. Check for gradual performance degradation',
        '6. Identify memory leaks (continuously increasing memory)',
        '7. Check for connection pool exhaustion',
        '8. Monitor disk space and log file growth',
        '9. Validate garbage collection behavior',
        '10. Generate soak test report with trend analysis'
      ],
      outputFormat: 'JSON object with soak test results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'passed', 'memoryLeakDetected', 'performanceDegradation', 'duration', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        passed: { type: 'boolean' },
        duration: { type: 'string' },
        memoryLeakDetected: { type: 'boolean' },
        performanceDegradation: { type: 'boolean' },
        memoryTrend: {
          type: 'object',
          properties: {
            startMemory: { type: 'number' },
            endMemory: { type: 'number' },
            increase: { type: 'number', description: 'Percentage increase' },
            trend: { type: 'string', enum: ['stable', 'increasing', 'concerning'] }
          }
        },
        performanceTrend: {
          type: 'object',
          properties: {
            startResponseTime: { type: 'number' },
            endResponseTime: { type: 'number' },
            degradation: { type: 'number', description: 'Percentage increase' }
          }
        },
        detectedIssues: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'performance-testing', 'soak-test', 'endurance']
}));

// Phase 8: Bottleneck Analysis
export const bottleneckAnalysisTask = defineTask('bottleneck-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Performance Bottleneck Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Performance Analysis Expert',
      task: 'Identify and analyze performance bottlenecks from test results',
      context: {
        projectName: args.projectName,
        loadTestResults: args.loadTestResults,
        stressTestResults: args.stressTestResults,
        spikeTestResults: args.spikeTestResults,
        soakTestResults: args.soakTestResults,
        environmentSetup: args.environmentSetup,
        monitoringEnabled: args.monitoringEnabled,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze response time distribution to identify slow transactions',
        '2. Identify database query bottlenecks (slow queries, N+1 problems)',
        '3. Analyze CPU utilization patterns',
        '4. Identify memory bottlenecks and allocation issues',
        '5. Analyze network bandwidth and latency issues',
        '6. Identify connection pool saturation',
        '7. Analyze third-party API dependencies',
        '8. Identify caching inefficiencies',
        '9. Analyze thread pool and executor bottlenecks',
        '10. Categorize bottlenecks by severity (critical, high, medium, low)',
        '11. Provide root cause analysis for each bottleneck',
        '12. Generate comprehensive bottleneck analysis report'
      ],
      outputFormat: 'JSON object with bottleneck analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['bottlenecks', 'analysisPath', 'artifacts'],
      properties: {
        bottlenecks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              component: { type: 'string', description: 'Component name (database, API, cache)' },
              issue: { type: 'string', description: 'Description of bottleneck' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              impact: { type: 'string', description: 'Impact on performance' },
              evidence: { type: 'string', description: 'Metrics supporting this finding' },
              rootCause: { type: 'string', description: 'Root cause analysis' }
            }
          }
        },
        topBottlenecks: {
          type: 'array',
          items: { type: 'string' },
          description: 'Top 5 bottlenecks by impact'
        },
        categoryBreakdown: {
          type: 'object',
          properties: {
            database: { type: 'number' },
            application: { type: 'number' },
            network: { type: 'number' },
            external: { type: 'number' }
          }
        },
        analysisPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'performance-testing', 'bottleneck-analysis']
}));

// Phase 9: Scalability Test
export const scalabilityTestTask = defineTask('scalability-test', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Scalability Test - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Scalability Testing Specialist',
      task: 'Test system scalability and capacity limits',
      context: {
        projectName: args.projectName,
        applicationUrl: args.applicationUrl,
        workloadModeling: args.workloadModeling,
        performanceGoals: args.performanceGoals,
        testScriptDevelopment: args.testScriptDevelopment,
        testingTool: args.testingTool,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Test horizontal scalability (adding more instances)',
        '2. Test vertical scalability (increasing resources)',
        '3. Measure throughput increase with additional resources',
        '4. Check for linear vs sub-linear scaling',
        '5. Identify scaling inefficiencies',
        '6. Test database scalability (read replicas, sharding)',
        '7. Test cache layer scalability',
        '8. Measure cost-benefit of scaling',
        '9. Determine recommended maximum load',
        '10. Generate scalability assessment report'
      ],
      outputFormat: 'JSON object with scalability results'
    },
    outputSchema: {
      type: 'object',
      required: ['scalabilityScore', 'linearScaling', 'recommendedMaxLoad', 'artifacts'],
      properties: {
        scalabilityScore: { type: 'number', minimum: 0, maximum: 100 },
        linearScaling: { type: 'boolean', description: 'Whether system scales linearly' },
        horizontalScalability: {
          type: 'object',
          properties: {
            tested: { type: 'boolean' },
            scalingFactor: { type: 'number', description: 'Throughput increase per instance' },
            efficiency: { type: 'number', description: 'Percentage efficiency' }
          }
        },
        verticalScalability: {
          type: 'object',
          properties: {
            tested: { type: 'boolean' },
            scalingFactor: { type: 'number' },
            efficiency: { type: 'number' }
          }
        },
        recommendedMaxLoad: {
          type: 'object',
          properties: {
            concurrentUsers: { type: 'number' },
            rps: { type: 'number' },
            instances: { type: 'number' }
          }
        },
        scalingInefficiencies: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'performance-testing', 'scalability']
}));

// Phase 10: Optimization Recommendations
export const optimizationRecommendationsTask = defineTask('optimization-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Performance Optimization Recommendations - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Performance Optimization Consultant',
      task: 'Generate actionable performance optimization recommendations',
      context: {
        projectName: args.projectName,
        requirementsAnalysis: args.requirementsAnalysis,
        loadTestResults: args.loadTestResults,
        stressTestResults: args.stressTestResults,
        spikeTestResults: args.spikeTestResults,
        soakTestResults: args.soakTestResults,
        scalabilityTest: args.scalabilityTest,
        bottleneckAnalysis: args.bottleneckAnalysis,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Prioritize recommendations by impact and effort',
        '2. Recommend database optimizations (indexing, query optimization, connection pooling)',
        '3. Recommend caching strategies (Redis, CDN, HTTP caching)',
        '4. Recommend code-level optimizations (algorithm improvements, async processing)',
        '5. Recommend infrastructure improvements (auto-scaling, load balancing)',
        '6. Recommend monitoring and alerting improvements',
        '7. Estimate impact of each recommendation (% improvement)',
        '8. Estimate implementation effort (hours/days)',
        '9. Provide implementation guidelines for top recommendations',
        '10. Generate comprehensive optimization roadmap'
      ],
      outputFormat: 'JSON object with optimization recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'recommendationsPath', 'artifacts'],
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              category: { type: 'string', enum: ['database', 'caching', 'code', 'infrastructure', 'monitoring'] },
              recommendation: { type: 'string' },
              rationale: { type: 'string' },
              estimatedImpact: { type: 'string', description: 'e.g., "20-30% improvement in p95"' },
              implementationEffort: { type: 'string', description: 'e.g., "2-3 days"' },
              implementationGuidelines: { type: 'string' }
            }
          }
        },
        quickWins: {
          type: 'array',
          items: { type: 'string' },
          description: 'High impact, low effort recommendations'
        },
        longTermImprovements: { type: 'array', items: { type: 'string' } },
        recommendationsPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'performance-testing', 'optimization']
}));

// Phase 11: Comparative Analysis
export const comparativeAnalysisTask = defineTask('comparative-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Comparative Performance Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Performance Analyst',
      task: 'Compare current performance against baseline',
      context: {
        projectName: args.projectName,
        baselineResults: args.baselineResults,
        loadTestResults: args.loadTestResults,
        performanceGoals: args.performanceGoals,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Compare response times (baseline vs current)',
        '2. Compare throughput metrics',
        '3. Compare error rates',
        '4. Compare resource utilization',
        '5. Identify performance regressions',
        '6. Identify performance improvements',
        '7. Calculate percentage changes for all metrics',
        '8. Determine statistical significance of changes',
        '9. Highlight concerning trends',
        '10. Generate comparative analysis report with visualizations'
      ],
      outputFormat: 'JSON object with comparative analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['regressionDetected', 'artifacts'],
      properties: {
        regressionDetected: { type: 'boolean' },
        regressionPercentage: { type: 'number', description: 'Percentage slower than baseline' },
        regressionDetails: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              baseline: { type: 'number' },
              current: { type: 'number' },
              change: { type: 'number', description: 'Percentage change' }
            }
          }
        },
        improvements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              improvement: { type: 'number', description: 'Percentage improvement' }
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
  labels: ['agent', 'performance-testing', 'comparative-analysis']
}));

// Phase 12: Performance Report
export const performanceReportTask = defineTask('performance-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Performance Test Report Generation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Performance Testing Report Specialist',
      task: 'Generate comprehensive performance testing report',
      context: {
        projectName: args.projectName,
        requirementsAnalysis: args.requirementsAnalysis,
        workloadModeling: args.workloadModeling,
        baselineResults: args.baselineResults,
        loadTestResults: args.loadTestResults,
        stressTestResults: args.stressTestResults,
        spikeTestResults: args.spikeTestResults,
        soakTestResults: args.soakTestResults,
        scalabilityTest: args.scalabilityTest,
        bottleneckAnalysis: args.bottleneckAnalysis,
        optimizationRecommendations: args.optimizationRecommendations,
        comparativeAnalysis: args.comparativeAnalysis,
        performanceGoals: args.performanceGoals,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create executive summary with key findings',
        '2. Document test objectives and scope',
        '3. Present workload model and test scenarios',
        '4. Include detailed results for all test types',
        '5. Present performance metrics with visualizations',
        '6. Document bottlenecks with evidence',
        '7. Include optimization recommendations',
        '8. Add comparative analysis (if baseline exists)',
        '9. Document test environment and conditions',
        '10. Include raw data and detailed logs',
        '11. Format as professional Markdown document',
        '12. Generate interactive dashboard (Grafana, HTML)'
      ],
      outputFormat: 'JSON object with report paths'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'reportPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        reportPath: { type: 'string', description: 'Main performance report path' },
        dashboardUrl: { type: 'string', description: 'Interactive dashboard URL or path' },
        executiveSummary: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'performance-testing', 'reporting']
}));

// Phase 13: Performance Assessment
export const performanceAssessmentTask = defineTask('performance-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Final Performance Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Performance Engineering Lead',
      task: 'Conduct final performance assessment and scoring',
      context: {
        projectName: args.projectName,
        performanceGoals: args.performanceGoals,
        loadTestResults: args.loadTestResults,
        stressTestResults: args.stressTestResults,
        spikeTestResults: args.spikeTestResults,
        soakTestResults: args.soakTestResults,
        scalabilityTest: args.scalabilityTest,
        bottleneckAnalysis: args.bottleneckAnalysis,
        optimizationRecommendations: args.optimizationRecommendations,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Compare all results against performance goals',
        '2. Calculate weighted performance score (0-100)',
        '3. Response time compliance (30% weight)',
        '4. Throughput compliance (20% weight)',
        '5. Error rate compliance (20% weight)',
        '6. Stability and reliability (15% weight)',
        '7. Scalability score (15% weight)',
        '8. Assess production readiness',
        '9. Provide overall verdict (pass/fail/conditional)',
        '10. Generate final assessment document'
      ],
      outputFormat: 'JSON object with performance assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['performanceScore', 'verdict', 'recommendation', 'summaryPath', 'artifacts'],
      properties: {
        performanceScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            responseTime: { type: 'number' },
            throughput: { type: 'number' },
            errorRate: { type: 'number' },
            stability: { type: 'number' },
            scalability: { type: 'number' }
          }
        },
        goalsMetComparison: {
          type: 'object',
          properties: {
            responseTimeP95: { type: 'boolean' },
            responseTimeP99: { type: 'boolean' },
            throughput: { type: 'boolean' },
            errorRate: { type: 'boolean' },
            concurrency: { type: 'boolean' }
          }
        },
        productionReady: { type: 'boolean' },
        verdict: { type: 'string', description: 'Overall verdict' },
        recommendation: { type: 'string', description: 'Recommended next steps' },
        strengths: { type: 'array', items: { type: 'string' } },
        weaknesses: { type: 'array', items: { type: 'string' } },
        criticalIssues: { type: 'array', items: { type: 'string' } },
        summaryPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'performance-testing', 'assessment']
}));

// Phase 14: CI/CD Integration
export const cicdIntegrationTask = defineTask('cicd-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 14: CI/CD Integration Setup - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps Performance Testing Specialist',
      task: 'Configure CI/CD integration for automated performance testing',
      context: {
        projectName: args.projectName,
        testScriptDevelopment: args.testScriptDevelopment,
        performanceGoals: args.performanceGoals,
        testingTool: args.testingTool,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create CI/CD pipeline configuration for performance tests',
        '2. Configure scheduled performance test runs (nightly, weekly)',
        '3. Set up performance test stage in deployment pipeline',
        '4. Configure performance thresholds as quality gates',
        '5. Set up automated alerts for performance regressions',
        '6. Configure test result storage and trending',
        '7. Integrate with monitoring and observability tools',
        '8. Set up automated baseline updates',
        '9. Configure parallel test execution in CI',
        '10. Document CI/CD integration and maintenance'
      ],
      outputFormat: 'JSON object with CI/CD configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['configured', 'pipelineConfigPath', 'thresholds', 'artifacts'],
      properties: {
        configured: { type: 'boolean' },
        pipelineConfigPath: { type: 'string' },
        pipelineType: { type: 'string', enum: ['github-actions', 'gitlab-ci', 'jenkins', 'azure-pipelines'] },
        scheduledRuns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              schedule: { type: 'string', description: 'Cron expression' },
              testType: { type: 'string' }
            }
          }
        },
        thresholds: {
          type: 'object',
          properties: {
            p95ResponseTime: { type: 'number' },
            errorRate: { type: 'number' },
            throughput: { type: 'number' }
          }
        },
        alertingConfigured: { type: 'boolean' },
        trendingEnabled: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'performance-testing', 'cicd', 'devops']
}));
