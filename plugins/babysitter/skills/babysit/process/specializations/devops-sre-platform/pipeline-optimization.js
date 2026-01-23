/**
 * @process specializations/devops-sre-platform/pipeline-optimization
 * @description Pipeline Optimization and Parallelization - Analyze and optimize existing CI/CD pipelines for speed, efficiency,
 * and reliability through bottleneck analysis, parallel execution strategies, caching optimization, incremental builds,
 * and comprehensive performance validation with quality gates and iterative improvement loops.
 * @inputs { projectPath: string, repositoryUrl: string, cicdPlatform?: string, pipelineFile?: string, optimizationGoals?: object }
 * @outputs { success: boolean, optimizationReport: object, performanceMetrics: object, improvements: object, optimizationScore: number }
 *
 * @example
 * const result = await orchestrate('specializations/devops-sre-platform/pipeline-optimization', {
 *   projectPath: '/path/to/project',
 *   repositoryUrl: 'https://github.com/org/repo',
 *   cicdPlatform: 'github-actions',
 *   pipelineFile: '.github/workflows/ci.yml',
 *   optimizationGoals: {
 *     targetBuildTime: 600, // 10 minutes
 *     targetTestTime: 300, // 5 minutes
 *     parallelizationTarget: 80, // 80% of tasks parallelized
 *     cacheHitRate: 90, // 90% cache hit rate
 *     costReduction: 30 // 30% cost reduction
 *   }
 * });
 *
 * @references
 * - Continuous Integration: https://martinfowler.com/articles/continuousIntegration.html
 * - Pipeline Optimization: https://docs.gitlab.com/ee/ci/pipelines/pipeline_efficiency.html
 * - GitHub Actions Best Practices: https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions
 * - Jenkins Pipeline Optimization: https://www.jenkins.io/doc/book/pipeline/pipeline-best-practices/
 * - CircleCI Optimization: https://circleci.com/docs/optimization-cookbook/
 * - Build Caching: https://docs.docker.com/build/cache/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectPath,
    repositoryUrl,
    cicdPlatform = 'github-actions', // 'github-actions', 'gitlab-ci', 'jenkins', 'circleci', 'azure-devops'
    pipelineFile,
    optimizationGoals = {
      targetBuildTime: 600, // seconds (10 minutes)
      targetTestTime: 300, // seconds (5 minutes)
      parallelizationTarget: 80, // percentage
      cacheHitRate: 90, // percentage
      costReduction: 30 // percentage
    },
    currentMetrics = {
      buildTime: null, // Auto-detect if null
      testTime: null,
      deployTime: null,
      totalPipelineTime: null
    },
    constraints = {
      maxParallelJobs: 10,
      budgetLimit: null, // dollars per month
      environmentLimits: {}
    },
    outputDir = 'pipeline-optimization-output',
    maxIterations = 3
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let optimizationScore = 0;
  let iterations = [];

  ctx.log('info', `Starting Pipeline Optimization for ${projectPath}`);
  ctx.log('info', `CI/CD Platform: ${cicdPlatform}, Repository: ${repositoryUrl}`);
  ctx.log('info', `Target Build Time: ${optimizationGoals.targetBuildTime}s, Parallelization Target: ${optimizationGoals.parallelizationTarget}%`);

  // ============================================================================
  // PHASE 1: BASELINE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing current pipeline performance and identifying bottlenecks');

  const baselineAnalysis = await ctx.task(analyzePipelineBaselineTask, {
    projectPath,
    repositoryUrl,
    cicdPlatform,
    pipelineFile,
    currentMetrics,
    outputDir
  });

  if (!baselineAnalysis.success) {
    return {
      success: false,
      error: 'Failed to analyze pipeline baseline',
      details: baselineAnalysis,
      metadata: {
        processId: 'specializations/devops-sre-platform/pipeline-optimization',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...baselineAnalysis.artifacts);

  ctx.log('info', `Baseline Analysis Complete: Total Pipeline Time: ${baselineAnalysis.metrics.totalTime}s`);
  ctx.log('info', `Slowest Stages: ${baselineAnalysis.bottlenecks.slice(0, 3).map(b => `${b.name} (${b.duration}s)`).join(', ')}`);

  // Breakpoint: Review baseline analysis
  await ctx.breakpoint({
    question: `Pipeline baseline analyzed. Current total time: ${baselineAnalysis.metrics.totalTime}s, Target: ${optimizationGoals.targetBuildTime}s. Identified ${baselineAnalysis.bottlenecks.length} bottlenecks. Review and approve optimization plan?`,
    title: 'Pipeline Baseline Analysis Review',
    context: {
      runId: ctx.runId,
      currentMetrics: baselineAnalysis.metrics,
      bottlenecks: baselineAnalysis.bottlenecks,
      parallelizationOpportunities: baselineAnalysis.parallelizationOpportunities,
      files: baselineAnalysis.artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language
      }))
    }
  });

  // ============================================================================
  // PHASE 2: PARALLEL OPTIMIZATION STRATEGY DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing comprehensive optimization strategy');

  const optimizationStrategy = await ctx.task(designOptimizationStrategyTask, {
    projectPath,
    baseline: baselineAnalysis,
    optimizationGoals,
    constraints,
    cicdPlatform,
    outputDir
  });

  artifacts.push(...optimizationStrategy.artifacts);

  ctx.log('info', `Optimization Strategy: ${optimizationStrategy.strategies.length} optimization strategies identified`);
  ctx.log('info', `Estimated Improvement: ${optimizationStrategy.estimatedTimeReduction}s (${optimizationStrategy.estimatedImprovementPercent}%)`);

  // Quality Gate: Strategy validation
  if (optimizationStrategy.estimatedImprovementPercent < 20) {
    await ctx.breakpoint({
      question: `Estimated improvement is only ${optimizationStrategy.estimatedImprovementPercent}%. Below 20% threshold. This may not justify the effort. Review strategy and approve to proceed?`,
      title: 'Low Estimated Improvement Warning',
      context: {
        runId: ctx.runId,
        strategies: optimizationStrategy.strategies,
        estimatedImprovement: optimizationStrategy.estimatedTimeReduction,
        currentTime: baselineAnalysis.metrics.totalTime,
        targetTime: optimizationGoals.targetBuildTime,
        files: optimizationStrategy.artifacts.map(a => ({
          path: a.path,
          format: a.format || 'markdown'
        }))
      }
    });
  }

  // ============================================================================
  // PHASE 3: ITERATIVE OPTIMIZATION LOOP
  // ============================================================================

  ctx.log('info', 'Phase 3: Executing iterative optimization loop');

  let currentScore = 0;
  let targetReached = false;
  let iterationCount = 0;

  while (iterationCount < maxIterations && !targetReached) {
    iterationCount++;
    ctx.log('info', `Starting Optimization Iteration ${iterationCount}/${maxIterations}`);

    // ============================================================================
    // ITERATION STEP 1: PARALLEL OPTIMIZATION IMPLEMENTATION
    // ============================================================================

    ctx.log('info', `Iteration ${iterationCount} - Step 1: Implementing optimizations in parallel`);

    // Parallelize different optimization types
    const [
      cachingOptimization,
      parallelizationOptimization,
      buildOptimization,
      testOptimization
    ] = await ctx.parallel.all([
      () => ctx.task(implementCachingOptimizationTask, {
        projectPath,
        baseline: baselineAnalysis,
        strategy: optimizationStrategy,
        iteration: iterationCount,
        cicdPlatform,
        outputDir
      }),
      () => ctx.task(implementParallelizationOptimizationTask, {
        projectPath,
        baseline: baselineAnalysis,
        strategy: optimizationStrategy,
        constraints,
        iteration: iterationCount,
        cicdPlatform,
        outputDir
      }),
      () => ctx.task(implementBuildOptimizationTask, {
        projectPath,
        baseline: baselineAnalysis,
        strategy: optimizationStrategy,
        iteration: iterationCount,
        cicdPlatform,
        outputDir
      }),
      () => ctx.task(implementTestOptimizationTask, {
        projectPath,
        baseline: baselineAnalysis,
        strategy: optimizationStrategy,
        optimizationGoals,
        iteration: iterationCount,
        cicdPlatform,
        outputDir
      })
    ]);

    artifacts.push(
      ...cachingOptimization.artifacts,
      ...parallelizationOptimization.artifacts,
      ...buildOptimization.artifacts,
      ...testOptimization.artifacts
    );

    ctx.log('info', `Iteration ${iterationCount} - All optimization implementations complete`);

    // ============================================================================
    // ITERATION STEP 2: VALIDATION AND MEASUREMENT
    // ============================================================================

    ctx.log('info', `Iteration ${iterationCount} - Step 2: Validating optimizations and measuring performance`);

    const validationResult = await ctx.task(validateOptimizationsTask, {
      projectPath,
      baseline: baselineAnalysis,
      optimizations: {
        caching: cachingOptimization,
        parallelization: parallelizationOptimization,
        build: buildOptimization,
        test: testOptimization
      },
      iteration: iterationCount,
      cicdPlatform,
      outputDir
    });

    artifacts.push(...validationResult.artifacts);

    ctx.log('info', `Iteration ${iterationCount} - Validation Complete: Success: ${validationResult.success}`);

    if (!validationResult.success) {
      ctx.log('warn', `Iteration ${iterationCount} - Validation failed. Analyzing issues...`);

      await ctx.breakpoint({
        question: `Iteration ${iterationCount} validation failed. ${validationResult.failures.length} failures detected. Review failures and decide: retry, rollback, or continue?`,
        title: `Optimization Validation Failed - Iteration ${iterationCount}`,
        context: {
          runId: ctx.runId,
          iteration: iterationCount,
          failures: validationResult.failures,
          partialSuccess: validationResult.partialSuccess,
          files: validationResult.artifacts.map(a => ({
            path: a.path,
            format: a.format || 'json'
          }))
        }
      });

      // If we continue after breakpoint, rollback this iteration
      continue;
    }

    // ============================================================================
    // ITERATION STEP 3: PERFORMANCE MEASUREMENT
    // ============================================================================

    ctx.log('info', `Iteration ${iterationCount} - Step 3: Running performance benchmarks`);

    const performanceMeasurement = await ctx.task(measurePipelinePerformanceTask, {
      projectPath,
      baseline: baselineAnalysis,
      iteration: iterationCount,
      cicdPlatform,
      outputDir
    });

    artifacts.push(...performanceMeasurement.artifacts);

    ctx.log('info', `Iteration ${iterationCount} - Performance: ${performanceMeasurement.metrics.totalTime}s (was ${baselineAnalysis.metrics.totalTime}s)`);
    ctx.log('info', `Iteration ${iterationCount} - Improvement: ${performanceMeasurement.improvementPercent}%`);

    // ============================================================================
    // ITERATION STEP 4: QUALITY SCORING
    // ============================================================================

    ctx.log('info', `Iteration ${iterationCount} - Step 4: Scoring optimization quality`);

    const qualityScore = await ctx.task(scoreOptimizationQualityTask, {
      projectPath,
      baseline: baselineAnalysis,
      optimizationGoals,
      performanceMetrics: performanceMeasurement,
      optimizations: {
        caching: cachingOptimization,
        parallelization: parallelizationOptimization,
        build: buildOptimization,
        test: testOptimization
      },
      iteration: iterationCount,
      outputDir
    });

    artifacts.push(...qualityScore.artifacts);

    currentScore = qualityScore.overallScore;

    ctx.log('info', `Iteration ${iterationCount} - Quality Score: ${currentScore}/100`);
    ctx.log('info', `Iteration ${iterationCount} - Goals Met: ${qualityScore.goalsMet}/${qualityScore.totalGoals}`);

    // Store iteration results
    iterations.push({
      iteration: iterationCount,
      optimizations: {
        caching: cachingOptimization,
        parallelization: parallelizationOptimization,
        build: buildOptimization,
        test: testOptimization
      },
      validation: validationResult,
      performance: performanceMeasurement,
      qualityScore: qualityScore,
      improvements: {
        timeReduction: baselineAnalysis.metrics.totalTime - performanceMeasurement.metrics.totalTime,
        percentImprovement: performanceMeasurement.improvementPercent,
        parallelizationAchieved: parallelizationOptimization.parallelizationPercent,
        cacheHitRate: cachingOptimization.cacheHitRate,
        costReduction: performanceMeasurement.costReduction
      }
    });

    // Check if target reached
    const goalsMetPercent = (qualityScore.goalsMet / qualityScore.totalGoals) * 100;
    if (goalsMetPercent >= 80 && performanceMeasurement.metrics.totalTime <= optimizationGoals.targetBuildTime) {
      targetReached = true;
      ctx.log('info', `Iteration ${iterationCount} - Target reached! ${goalsMetPercent}% goals met, time: ${performanceMeasurement.metrics.totalTime}s <= ${optimizationGoals.targetBuildTime}s`);
    } else {
      ctx.log('info', `Iteration ${iterationCount} - Target not reached. Goals met: ${goalsMetPercent}%, Time: ${performanceMeasurement.metrics.totalTime}s vs ${optimizationGoals.targetBuildTime}s`);

      // Breakpoint: Review iteration and decide whether to continue
      if (iterationCount < maxIterations) {
        await ctx.breakpoint({
          question: `Iteration ${iterationCount} complete. Quality Score: ${currentScore}/100, Goals Met: ${goalsMetPercent}%, Time: ${performanceMeasurement.metrics.totalTime}s. Continue with iteration ${iterationCount + 1}?`,
          title: `Optimization Iteration ${iterationCount} Review`,
          context: {
            runId: ctx.runId,
            iteration: iterationCount,
            currentScore,
            goalsMetPercent,
            currentTime: performanceMeasurement.metrics.totalTime,
            targetTime: optimizationGoals.targetBuildTime,
            improvements: iterations[iterationCount - 1].improvements,
            recommendations: qualityScore.recommendations,
            files: [
              ...performanceMeasurement.artifacts.map(a => ({ path: a.path, format: a.format || 'json' })),
              ...qualityScore.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
            ]
          }
        });
      }
    }
  }

  optimizationScore = currentScore;

  // ============================================================================
  // PHASE 4: PARALLEL FINAL VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Running comprehensive final validation in parallel');

  const [
    finalPerformanceTest,
    regressionTest,
    securityValidation,
    costAnalysis
  ] = await ctx.parallel.all([
    () => ctx.task(runFinalPerformanceTestTask, {
      projectPath,
      baseline: baselineAnalysis,
      iterations,
      cicdPlatform,
      outputDir
    }),
    () => ctx.task(runRegressionTestTask, {
      projectPath,
      baseline: baselineAnalysis,
      cicdPlatform,
      outputDir
    }),
    () => ctx.task(validateSecurityTask, {
      projectPath,
      iterations,
      cicdPlatform,
      outputDir
    }),
    () => ctx.task(analyzeCostImpactTask, {
      projectPath,
      baseline: baselineAnalysis,
      iterations,
      optimizationGoals,
      constraints,
      outputDir
    })
  ]);

  artifacts.push(
    ...finalPerformanceTest.artifacts,
    ...regressionTest.artifacts,
    ...securityValidation.artifacts,
    ...costAnalysis.artifacts
  );

  ctx.log('info', 'Final validation complete');
  ctx.log('info', `Final Performance: ${finalPerformanceTest.metrics.totalTime}s (Baseline: ${baselineAnalysis.metrics.totalTime}s)`);
  ctx.log('info', `Regression Tests: ${regressionTest.passed}/${regressionTest.total} passed`);
  ctx.log('info', `Cost Impact: ${costAnalysis.monthlySavings} ${costAnalysis.currency}/month (${costAnalysis.savingsPercent}%)`);

  // Quality Gate: Regression test failures
  if (regressionTest.failed > 0) {
    await ctx.breakpoint({
      question: `${regressionTest.failed} regression tests failed. This indicates the optimizations may have broken existing functionality. Review failures and approve or rollback?`,
      title: 'Regression Test Failures Detected',
      context: {
        runId: ctx.runId,
        failedTests: regressionTest.failedTests,
        passed: regressionTest.passed,
        failed: regressionTest.failed,
        recommendation: 'Consider rolling back optimizations or fixing the issues',
        files: regressionTest.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // Quality Gate: Security validation
  if (!securityValidation.passed) {
    await ctx.breakpoint({
      question: `Security validation failed with ${securityValidation.issues.length} issues. Review security concerns and approve or fix?`,
      title: 'Security Validation Failed',
      context: {
        runId: ctx.runId,
        securityIssues: securityValidation.issues,
        severity: securityValidation.maxSeverity,
        recommendation: 'Address security issues before deploying optimizations',
        files: securityValidation.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 5: COMPREHENSIVE FINAL REVIEW
  // ============================================================================

  ctx.log('info', 'Phase 5: Generating comprehensive final review and recommendations');

  const finalReview = await ctx.task(generateFinalReviewTask, {
    projectPath,
    baseline: baselineAnalysis,
    optimizationGoals,
    iterations,
    finalValidation: {
      performance: finalPerformanceTest,
      regression: regressionTest,
      security: securityValidation,
      cost: costAnalysis
    },
    optimizationScore,
    targetReached,
    outputDir
  });

  artifacts.push(...finalReview.artifacts);

  ctx.log('info', 'Final review generated');
  ctx.log('info', `Overall Verdict: ${finalReview.verdict}`);
  ctx.log('info', `Recommendation: ${finalReview.recommendation}`);

  // Final breakpoint for approval
  await ctx.breakpoint({
    question: `Pipeline optimization complete. ${iterationCount} iterations, Final Score: ${optimizationScore}/100, Time Reduction: ${finalReview.totalTimeReduction}s (${finalReview.improvementPercent}%). Verdict: ${finalReview.verdict}. Approve deployment of optimizations?`,
    title: 'Final Pipeline Optimization Review',
    context: {
      runId: ctx.runId,
      iterations: iterationCount,
      optimizationScore,
      targetReached,
      baselineTime: baselineAnalysis.metrics.totalTime,
      finalTime: finalPerformanceTest.metrics.totalTime,
      timeReduction: finalReview.totalTimeReduction,
      improvementPercent: finalReview.improvementPercent,
      costSavings: costAnalysis.monthlySavings,
      verdict: finalReview.verdict,
      strengths: finalReview.strengths,
      concerns: finalReview.concerns,
      nextSteps: finalReview.nextSteps,
      files: [
        ...finalReview.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
        { path: `${outputDir}/final-performance-report.json`, format: 'json' },
        { path: `${outputDir}/optimization-summary.md`, format: 'markdown' }
      ]
    }
  });

  // ============================================================================
  // RETURN RESULTS
  // ============================================================================

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: targetReached || optimizationScore >= 70,
    optimizationScore,
    targetReached,
    iterations: iterationCount,
    baseline: {
      totalTime: baselineAnalysis.metrics.totalTime,
      buildTime: baselineAnalysis.metrics.buildTime,
      testTime: baselineAnalysis.metrics.testTime,
      bottlenecks: baselineAnalysis.bottlenecks
    },
    final: {
      totalTime: finalPerformanceTest.metrics.totalTime,
      buildTime: finalPerformanceTest.metrics.buildTime,
      testTime: finalPerformanceTest.metrics.testTime,
      parallelization: finalPerformanceTest.parallelizationPercent
    },
    improvements: {
      timeReduction: finalReview.totalTimeReduction,
      percentImprovement: finalReview.improvementPercent,
      parallelizationAchieved: finalPerformanceTest.parallelizationPercent,
      cacheHitRate: iterations[iterationCount - 1]?.optimizations.caching.cacheHitRate,
      costSavings: costAnalysis.monthlySavings,
      costSavingsPercent: costAnalysis.savingsPercent
    },
    validation: {
      performanceTests: finalPerformanceTest.success,
      regressionTests: regressionTest.passed === regressionTest.total,
      securityValidation: securityValidation.passed,
      costAnalysis: costAnalysis.success
    },
    optimizationStrategy: {
      strategies: optimizationStrategy.strategies,
      applied: optimizationStrategy.strategies.filter(s => s.applied).length,
      estimatedImprovement: optimizationStrategy.estimatedTimeReduction
    },
    iterationResults: iterations,
    finalReview: {
      verdict: finalReview.verdict,
      recommendation: finalReview.recommendation,
      strengths: finalReview.strengths,
      concerns: finalReview.concerns,
      nextSteps: finalReview.nextSteps
    },
    artifacts: artifacts.map(a => a.path),
    metadata: {
      processId: 'specializations/devops-sre-platform/pipeline-optimization',
      timestamp: startTime,
      duration,
      cicdPlatform,
      iterations: iterationCount,
      maxIterations
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

/**
 * Analyze current pipeline baseline performance
 */
export const analyzePipelineBaselineTask = defineTask('analyze-pipeline-baseline', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze pipeline baseline and identify bottlenecks',
  description: 'Comprehensive analysis of current CI/CD pipeline performance',

  agent: {
    name: 'pipeline-analyzer',
    prompt: {
      role: 'senior DevOps engineer and CI/CD optimization specialist',
      task: 'Analyze the current CI/CD pipeline configuration, execution history, and performance metrics to establish a baseline and identify optimization opportunities',
      context: {
        projectPath: args.projectPath,
        repositoryUrl: args.repositoryUrl,
        cicdPlatform: args.cicdPlatform,
        pipelineFile: args.pipelineFile,
        currentMetrics: args.currentMetrics
      },
      instructions: [
        'Clone or access the repository and locate the CI/CD pipeline configuration',
        'Analyze recent pipeline execution history (last 30 runs if available)',
        'Calculate average execution times for each stage and job',
        'Identify bottlenecks: slowest stages, longest-running jobs, sequential dependencies',
        'Analyze parallelization opportunities: jobs that could run in parallel',
        'Review caching strategies: dependencies, build artifacts, docker layers',
        'Examine resource utilization: CPU, memory, disk I/O',
        'Identify optimization opportunities by category (caching, parallelization, build optimization, test optimization)',
        'Generate comprehensive baseline report with metrics, bottlenecks, and recommendations',
        'Create visualization of pipeline execution timeline'
      ],
      outputFormat: 'JSON with success (boolean), metrics (object with totalTime, buildTime, testTime, deployTime, stageBreakdown array), bottlenecks (array of {name, duration, type, impact}), parallelizationOpportunities (array), cachingOpportunities (array), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'metrics', 'bottlenecks', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        metrics: {
          type: 'object',
          properties: {
            totalTime: { type: 'number' },
            buildTime: { type: 'number' },
            testTime: { type: 'number' },
            deployTime: { type: 'number' },
            stageBreakdown: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  duration: { type: 'number' },
                  percent: { type: 'number' }
                }
              }
            }
          }
        },
        bottlenecks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              duration: { type: 'number' },
              type: { type: 'string', enum: ['build', 'test', 'deploy', 'dependency'] },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        parallelizationOpportunities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              jobs: { type: 'array', items: { type: 'string' } },
              estimatedTimeSaving: { type: 'number' }
            }
          }
        },
        cachingOpportunities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              estimatedTimeSaving: { type: 'number' }
            }
          }
        },
        artifacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              format: { type: 'string' },
              language: { type: 'string' }
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

  labels: ['agent', 'analysis', 'baseline']
}));

/**
 * Design comprehensive optimization strategy
 */
export const designOptimizationStrategyTask = defineTask('design-optimization-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design pipeline optimization strategy',
  description: 'Create comprehensive optimization plan based on baseline analysis',

  agent: {
    name: 'optimization-strategist',
    prompt: {
      role: 'senior DevOps architect and pipeline optimization expert',
      task: 'Design a comprehensive optimization strategy to achieve the target goals based on baseline analysis',
      context: {
        projectPath: args.projectPath,
        baseline: args.baseline,
        optimizationGoals: args.optimizationGoals,
        constraints: args.constraints,
        cicdPlatform: args.cicdPlatform
      },
      instructions: [
        'Review baseline analysis: bottlenecks, parallelization opportunities, caching opportunities',
        'Prioritize optimization strategies by impact and implementation complexity',
        'Design caching strategy: dependency caching, build artifact caching, docker layer caching',
        'Design parallelization strategy: job-level parallelism, test parallelization, matrix builds',
        'Design build optimization: incremental builds, build tool optimization, dependency optimization',
        'Design test optimization: test selection, test splitting, parallel test execution',
        'Estimate time savings for each optimization',
        'Calculate total estimated improvement',
        'Consider constraints: max parallel jobs, budget, environment limits',
        'Create phased implementation plan',
        'Identify risks and mitigation strategies'
      ],
      outputFormat: 'JSON with strategies (array of {name, type, estimatedTimeSaving, complexity, priority}), estimatedTimeReduction (number), estimatedImprovementPercent (number), implementationPlan (array), risks (array), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'estimatedTimeReduction', 'estimatedImprovementPercent', 'artifacts'],
      properties: {
        strategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['caching', 'parallelization', 'build', 'test', 'infrastructure'] },
              estimatedTimeSaving: { type: 'number' },
              complexity: { type: 'string', enum: ['low', 'medium', 'high'] },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        estimatedTimeReduction: { type: 'number' },
        estimatedImprovementPercent: { type: 'number' },
        implementationPlan: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              strategies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        risks: { type: 'array', items: { type: 'string' } },
        artifacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              format: { type: 'string' }
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

  labels: ['agent', 'strategy', 'planning']
}));

/**
 * Implement caching optimizations
 */
export const implementCachingOptimizationTask = defineTask('implement-caching-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement caching optimizations (iteration ${args.iteration})`,
  description: 'Configure and implement comprehensive caching strategies',

  agent: {
    name: 'caching-optimizer',
    prompt: {
      role: 'senior DevOps engineer specializing in CI/CD caching strategies',
      task: 'Implement caching optimizations for dependencies, build artifacts, and docker layers',
      context: {
        projectPath: args.projectPath,
        baseline: args.baseline,
        strategy: args.strategy,
        iteration: args.iteration,
        cicdPlatform: args.cicdPlatform
      },
      instructions: [
        'Implement dependency caching (npm, pip, maven, etc.) with proper cache keys',
        'Configure build artifact caching with cache invalidation strategies',
        'Optimize docker layer caching with multi-stage builds',
        'Implement cache warming strategies for faster cold starts',
        'Configure cache scope: branch-specific vs shared',
        'Set up cache size limits and eviction policies',
        'Add cache hit/miss monitoring',
        'Update pipeline configuration with caching directives',
        'Document caching strategy and maintenance procedures',
        'Generate before/after comparison'
      ],
      outputFormat: 'JSON with success (boolean), cacheTypes (array), cacheHitRate (number estimated), estimatedTimeSaving (number), configChanges (array), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'cacheTypes', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        cacheTypes: { type: 'array', items: { type: 'string' } },
        cacheHitRate: { type: 'number' },
        estimatedTimeSaving: { type: 'number' },
        configChanges: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              file: { type: 'string' },
              changes: { type: 'string' }
            }
          }
        },
        artifacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              format: { type: 'string' }
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

  labels: ['agent', 'optimization', 'caching', `iteration-${args.iteration}`]
}));

/**
 * Implement parallelization optimizations
 */
export const implementParallelizationOptimizationTask = defineTask('implement-parallelization-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement parallelization optimizations (iteration ${args.iteration})`,
  description: 'Configure parallel job execution and test parallelization',

  agent: {
    name: 'parallelization-optimizer',
    prompt: {
      role: 'senior DevOps engineer specializing in CI/CD parallelization',
      task: 'Implement parallelization strategies for jobs, tests, and matrix builds',
      context: {
        projectPath: args.projectPath,
        baseline: args.baseline,
        strategy: args.strategy,
        constraints: args.constraints,
        iteration: args.iteration,
        cicdPlatform: args.cicdPlatform
      },
      instructions: [
        'Identify jobs that can run in parallel without dependencies',
        'Restructure pipeline to maximize parallel execution',
        'Implement test parallelization with proper sharding',
        'Configure matrix builds for multi-platform/version testing',
        'Optimize job dependencies to minimize blocking',
        'Balance parallelization with resource constraints',
        'Configure parallel job limits based on constraints',
        'Add monitoring for parallel execution efficiency',
        'Update pipeline configuration for parallelism',
        'Calculate parallelization percentage achieved'
      ],
      outputFormat: 'JSON with success (boolean), parallelJobs (array), parallelizationPercent (number), testSharding (object), estimatedTimeSaving (number), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'parallelJobs', 'parallelizationPercent', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        parallelJobs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              parallelWith: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        parallelizationPercent: { type: 'number' },
        testSharding: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            shards: { type: 'number' }
          }
        },
        estimatedTimeSaving: { type: 'number' },
        artifacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              format: { type: 'string' }
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

  labels: ['agent', 'optimization', 'parallelization', `iteration-${args.iteration}`]
}));

/**
 * Implement build optimizations
 */
export const implementBuildOptimizationTask = defineTask('implement-build-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement build optimizations (iteration ${args.iteration})`,
  description: 'Optimize build process for speed and efficiency',

  agent: {
    name: 'build-optimizer',
    prompt: {
      role: 'senior DevOps engineer specializing in build optimization',
      task: 'Implement build optimizations including incremental builds, compiler settings, and dependency management',
      context: {
        projectPath: args.projectPath,
        baseline: args.baseline,
        strategy: args.strategy,
        iteration: args.iteration,
        cicdPlatform: args.cicdPlatform
      },
      instructions: [
        'Analyze build configuration and identify optimization opportunities',
        'Implement incremental builds to avoid rebuilding unchanged code',
        'Optimize compiler/build tool settings (parallelism, optimization level)',
        'Reduce docker image layer sizes with multi-stage builds',
        'Optimize dependency resolution and installation',
        'Remove unnecessary build steps or artifacts',
        'Configure build output caching',
        'Implement build time monitoring',
        'Update build configuration files',
        'Measure build time reduction'
      ],
      outputFormat: 'JSON with success (boolean), optimizations (array of {type, description, timeSaving}), dockerImageSizeReduction (number), estimatedTimeSaving (number), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'optimizations', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        optimizations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              description: { type: 'string' },
              timeSaving: { type: 'number' }
            }
          }
        },
        dockerImageSizeReduction: { type: 'number' },
        estimatedTimeSaving: { type: 'number' },
        artifacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              format: { type: 'string' }
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

  labels: ['agent', 'optimization', 'build', `iteration-${args.iteration}`]
}));

/**
 * Implement test optimizations
 */
export const implementTestOptimizationTask = defineTask('implement-test-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement test optimizations (iteration ${args.iteration})`,
  description: 'Optimize test execution for speed and reliability',

  agent: {
    name: 'test-optimizer',
    prompt: {
      role: 'senior QA engineer and test automation specialist',
      task: 'Implement test optimizations including parallel execution, test selection, and flakiness elimination',
      context: {
        projectPath: args.projectPath,
        baseline: args.baseline,
        strategy: args.strategy,
        optimizationGoals: args.optimizationGoals,
        iteration: args.iteration,
        cicdPlatform: args.cicdPlatform
      },
      instructions: [
        'Implement parallel test execution with proper isolation',
        'Configure test sharding across multiple workers',
        'Implement test selection based on changed files',
        'Optimize test data setup and teardown',
        'Reduce test flakiness with proper waits and retries',
        'Separate fast unit tests from slow integration tests',
        'Configure test timeouts appropriately',
        'Implement test result caching for unchanged code',
        'Add test performance monitoring',
        'Update test configuration for optimization'
      ],
      outputFormat: 'JSON with success (boolean), parallelTestWorkers (number), testSelectionEnabled (boolean), estimatedTimeSaving (number), flakinessReduction (number), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'parallelTestWorkers', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        parallelTestWorkers: { type: 'number' },
        testSelectionEnabled: { type: 'boolean' },
        estimatedTimeSaving: { type: 'number' },
        flakinessReduction: { type: 'number' },
        optimizations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        artifacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              format: { type: 'string' }
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

  labels: ['agent', 'optimization', 'testing', `iteration-${args.iteration}`]
}));

/**
 * Validate optimizations
 */
export const validateOptimizationsTask = defineTask('validate-optimizations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate optimizations (iteration ${args.iteration})`,
  description: 'Validate that all optimizations were applied correctly',

  agent: {
    name: 'optimization-validator',
    prompt: {
      role: 'senior DevOps engineer and quality assurance specialist',
      task: 'Validate that all optimizations were implemented correctly without breaking functionality',
      context: {
        projectPath: args.projectPath,
        baseline: args.baseline,
        optimizations: args.optimizations,
        iteration: args.iteration,
        cicdPlatform: args.cicdPlatform
      },
      instructions: [
        'Review all configuration changes for correctness',
        'Validate caching configuration and cache key strategies',
        'Validate parallel job dependencies and execution order',
        'Verify build optimizations do not break builds',
        'Verify test optimizations maintain test coverage',
        'Check for syntax errors in pipeline configuration',
        'Validate resource limits and constraints are respected',
        'Run configuration linter/validator if available',
        'Identify any issues or failures',
        'Generate validation report'
      ],
      outputFormat: 'JSON with success (boolean), validated (array), failures (array of {type, description, severity}), partialSuccess (boolean), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'validated', 'failures', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        validated: { type: 'array', items: { type: 'string' } },
        failures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              description: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        partialSuccess: { type: 'boolean' },
        artifacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              format: { type: 'string' }
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

  labels: ['agent', 'validation', `iteration-${args.iteration}`]
}));

/**
 * Measure pipeline performance after optimizations
 */
export const measurePipelinePerformanceTask = defineTask('measure-pipeline-performance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Measure pipeline performance (iteration ${args.iteration})`,
  description: 'Run performance benchmarks to measure optimization impact',

  agent: {
    name: 'performance-measurer',
    prompt: {
      role: 'senior DevOps engineer and performance analyst',
      task: 'Measure pipeline performance after optimizations and compare with baseline',
      context: {
        projectPath: args.projectPath,
        baseline: args.baseline,
        iteration: args.iteration,
        cicdPlatform: args.cicdPlatform
      },
      instructions: [
        'Trigger multiple pipeline runs (at least 3) to get average performance',
        'Measure total pipeline execution time',
        'Measure individual stage execution times',
        'Calculate cache hit rates',
        'Measure parallel execution efficiency',
        'Compare with baseline metrics',
        'Calculate improvement percentage',
        'Identify any performance regressions',
        'Calculate cost impact based on execution time',
        'Generate performance comparison report'
      ],
      outputFormat: 'JSON with success (boolean), metrics (object with totalTime, buildTime, testTime, stageBreakdown), improvementPercent (number), parallelizationPercent (number), cacheHitRate (number), costReduction (number), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'metrics', 'improvementPercent', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        metrics: {
          type: 'object',
          properties: {
            totalTime: { type: 'number' },
            buildTime: { type: 'number' },
            testTime: { type: 'number' },
            deployTime: { type: 'number' },
            stageBreakdown: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  duration: { type: 'number' }
                }
              }
            }
          }
        },
        improvementPercent: { type: 'number' },
        parallelizationPercent: { type: 'number' },
        cacheHitRate: { type: 'number' },
        costReduction: { type: 'number' },
        artifacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              format: { type: 'string' }
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

  labels: ['agent', 'measurement', 'performance', `iteration-${args.iteration}`]
}));

/**
 * Score optimization quality
 */
export const scoreOptimizationQualityTask = defineTask('score-optimization-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: `Score optimization quality (iteration ${args.iteration})`,
  description: 'Assess optimization quality against goals',

  agent: {
    name: 'quality-scorer',
    prompt: {
      role: 'senior DevOps architect and quality analyst',
      task: 'Assess the quality of optimizations and calculate score based on goals achievement',
      context: {
        projectPath: args.projectPath,
        baseline: args.baseline,
        optimizationGoals: args.optimizationGoals,
        performanceMetrics: args.performanceMetrics,
        optimizations: args.optimizations,
        iteration: args.iteration
      },
      instructions: [
        'Evaluate time reduction against target (weight: 30%)',
        'Evaluate parallelization achievement against target (weight: 25%)',
        'Evaluate cache hit rate against target (weight: 20%)',
        'Evaluate cost reduction against target (weight: 15%)',
        'Evaluate implementation quality and maintainability (weight: 10%)',
        'Calculate weighted overall score (0-100)',
        'Identify which goals were met',
        'Provide specific recommendations for improvement',
        'Assess if target is reachable with more iterations',
        'Generate quality assessment report'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), goalsMet (number), totalGoals (number), scores (object with dimensions), recommendations (array), nextIterationPriorities (array), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'goalsMet', 'totalGoals', 'scores', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        goalsMet: { type: 'number' },
        totalGoals: { type: 'number' },
        scores: {
          type: 'object',
          properties: {
            timeReduction: { type: 'number' },
            parallelization: { type: 'number' },
            caching: { type: 'number' },
            costReduction: { type: 'number' },
            quality: { type: 'number' }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        nextIterationPriorities: { type: 'array', items: { type: 'string' } },
        artifacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              format: { type: 'string' }
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

  labels: ['agent', 'scoring', 'quality', `iteration-${args.iteration}`]
}));

/**
 * Run final comprehensive performance test
 */
export const runFinalPerformanceTestTask = defineTask('run-final-performance-test', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run final comprehensive performance test',
  description: 'Execute final performance benchmarks',

  agent: {
    name: 'final-performance-tester',
    prompt: {
      role: 'senior DevOps engineer and performance testing specialist',
      task: 'Run comprehensive final performance tests to validate optimization results',
      context: {
        projectPath: args.projectPath,
        baseline: args.baseline,
        iterations: args.iterations,
        cicdPlatform: args.cicdPlatform
      },
      instructions: [
        'Run 5-10 pipeline executions for statistical significance',
        'Measure performance across different scenarios (cold cache, warm cache, full build, incremental)',
        'Calculate average, median, p95, p99 execution times',
        'Measure cache hit rates across multiple runs',
        'Measure parallel execution efficiency',
        'Calculate total improvement vs baseline',
        'Identify any performance variability or instability',
        'Generate comprehensive performance report',
        'Create performance comparison charts'
      ],
      outputFormat: 'JSON with success (boolean), metrics (object with totalTime, buildTime, testTime), improvementPercent (number), parallelizationPercent (number), stability (object), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'metrics', 'improvementPercent', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        metrics: {
          type: 'object',
          properties: {
            totalTime: { type: 'number' },
            buildTime: { type: 'number' },
            testTime: { type: 'number' },
            average: { type: 'number' },
            median: { type: 'number' },
            p95: { type: 'number' },
            p99: { type: 'number' }
          }
        },
        improvementPercent: { type: 'number' },
        parallelizationPercent: { type: 'number' },
        stability: {
          type: 'object',
          properties: {
            variance: { type: 'number' },
            stable: { type: 'boolean' }
          }
        },
        artifacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              format: { type: 'string' }
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

  labels: ['agent', 'testing', 'performance', 'final']
}));

/**
 * Run regression tests
 */
export const runRegressionTestTask = defineTask('run-regression-test', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run regression tests',
  description: 'Ensure optimizations did not break functionality',

  agent: {
    name: 'regression-tester',
    prompt: {
      role: 'senior QA engineer',
      task: 'Run comprehensive regression tests to ensure optimizations did not break functionality',
      context: {
        projectPath: args.projectPath,
        baseline: args.baseline,
        cicdPlatform: args.cicdPlatform
      },
      instructions: [
        'Run full test suite (unit, integration, e2e)',
        'Compare test results with baseline',
        'Identify any test failures introduced by optimizations',
        'Verify test coverage is maintained',
        'Check for flaky tests introduced by parallelization',
        'Validate build artifacts are identical',
        'Ensure all deployment steps still work',
        'Generate regression test report'
      ],
      outputFormat: 'JSON with success (boolean), passed (number), failed (number), total (number), failedTests (array), coverageMaintained (boolean), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'passed', 'failed', 'total', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        passed: { type: 'number' },
        failed: { type: 'number' },
        total: { type: 'number' },
        failedTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              reason: { type: 'string' }
            }
          }
        },
        coverageMaintained: { type: 'boolean' },
        artifacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              format: { type: 'string' }
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

  labels: ['agent', 'testing', 'regression', 'final']
}));

/**
 * Validate security
 */
export const validateSecurityTask = defineTask('validate-security', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate security of optimizations',
  description: 'Ensure optimizations do not introduce security vulnerabilities',

  agent: {
    name: 'security-validator',
    prompt: {
      role: 'senior security engineer and DevSecOps specialist',
      task: 'Validate that pipeline optimizations do not introduce security vulnerabilities',
      context: {
        projectPath: args.projectPath,
        iterations: args.iterations,
        cicdPlatform: args.cicdPlatform
      },
      instructions: [
        'Review caching configuration for sensitive data exposure',
        'Validate secrets are not logged or cached',
        'Check parallel jobs do not share sensitive state',
        'Verify security scanning steps are not bypassed',
        'Validate artifact integrity is maintained',
        'Check for privilege escalation risks',
        'Review configuration for security best practices',
        'Run security scanner on pipeline configuration',
        'Generate security validation report'
      ],
      outputFormat: 'JSON with passed (boolean), issues (array of {severity, description, recommendation}), maxSeverity (string), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'issues', 'artifacts'],
      properties: {
        passed: { type: 'boolean' },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              description: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        maxSeverity: { type: 'string', enum: ['none', 'low', 'medium', 'high', 'critical'] },
        artifacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              format: { type: 'string' }
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

  labels: ['agent', 'security', 'validation', 'final']
}));

/**
 * Analyze cost impact
 */
export const analyzeCostImpactTask = defineTask('analyze-cost-impact', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze cost impact of optimizations',
  description: 'Calculate cost savings from reduced pipeline execution time',

  agent: {
    name: 'cost-analyzer',
    prompt: {
      role: 'senior DevOps engineer and cloud cost optimization specialist',
      task: 'Calculate cost impact of pipeline optimizations',
      context: {
        projectPath: args.projectPath,
        baseline: args.baseline,
        iterations: args.iterations,
        optimizationGoals: args.optimizationGoals,
        constraints: args.constraints
      },
      instructions: [
        'Calculate compute minutes saved per pipeline run',
        'Estimate number of pipeline runs per month',
        'Calculate monthly compute cost savings',
        'Consider pricing for CI/CD platform (GitHub Actions, CircleCI, etc.)',
        'Factor in parallel job costs',
        'Calculate ROI on optimization effort',
        'Project annual cost savings',
        'Compare with budget constraints if specified',
        'Generate cost analysis report'
      ],
      outputFormat: 'JSON with success (boolean), monthlySavings (number), annualSavings (number), savingsPercent (number), currency (string), roi (number), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'monthlySavings', 'savingsPercent', 'currency', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        monthlySavings: { type: 'number' },
        annualSavings: { type: 'number' },
        savingsPercent: { type: 'number' },
        currency: { type: 'string' },
        roi: { type: 'number' },
        computeMinutesSaved: { type: 'number' },
        artifacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              format: { type: 'string' }
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

  labels: ['agent', 'analysis', 'cost', 'final']
}));

/**
 * Generate final review and recommendations
 */
export const generateFinalReviewTask = defineTask('generate-final-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive final review',
  description: 'Create final review and recommendations',

  agent: {
    name: 'final-reviewer',
    prompt: {
      role: 'principal DevOps architect and technical reviewer',
      task: 'Conduct comprehensive final review of pipeline optimization and provide verdict',
      context: {
        projectPath: args.projectPath,
        baseline: args.baseline,
        optimizationGoals: args.optimizationGoals,
        iterations: args.iterations,
        finalValidation: args.finalValidation,
        optimizationScore: args.optimizationScore,
        targetReached: args.targetReached
      },
      instructions: [
        'Review all optimization iterations and results',
        'Assess final performance against targets',
        'Evaluate quality and maintainability of optimizations',
        'Review validation results (performance, regression, security, cost)',
        'Calculate total time reduction and improvement percentage',
        'Identify strengths of the optimization work',
        'Identify remaining concerns or risks',
        'Provide deployment recommendation',
        'Suggest next steps and future improvements',
        'Generate executive summary',
        'Create comprehensive final report'
      ],
      outputFormat: 'JSON with verdict (string), recommendation (string), approved (boolean), totalTimeReduction (number), improvementPercent (number), strengths (array), concerns (array), nextSteps (array), executiveSummary (string), artifacts (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['verdict', 'recommendation', 'approved', 'totalTimeReduction', 'improvementPercent', 'artifacts'],
      properties: {
        verdict: { type: 'string' },
        recommendation: { type: 'string' },
        approved: { type: 'boolean' },
        totalTimeReduction: { type: 'number' },
        improvementPercent: { type: 'number' },
        strengths: { type: 'array', items: { type: 'string' } },
        concerns: { type: 'array', items: { type: 'string' } },
        nextSteps: { type: 'array', items: { type: 'string' } },
        executiveSummary: { type: 'string' },
        artifacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              format: { type: 'string' }
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

  labels: ['agent', 'review', 'final']
}));
