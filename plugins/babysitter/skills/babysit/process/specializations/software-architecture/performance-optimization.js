/**
 * @process specializations/software-architecture/performance-optimization
 * @description Performance Optimization Process - Systematic performance improvement through profiling, bottleneck
 * identification, optimization design, implementation, and validation. Covers application, database, and infrastructure
 * performance with data-driven decision making.
 * @inputs { systemName: string, performanceGoals: object, baselineMetrics?: object, optimizationScope?: string }
 * @outputs { success: boolean, performanceScore: number, optimizations: array, validationResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/software-architecture/performance-optimization', {
 *   systemName: 'E-commerce Platform',
 *   performanceGoals: {
 *     latency: { p95: 200, p99: 500 },
 *     throughput: { rps: 1000 },
 *     resourceUsage: { cpu: 70, memory: 80 }
 *   },
 *   optimizationScope: 'full-stack',
 *   targetImprovement: 30
 * });
 *
 * @references
 * - Performance Engineering: https://www.infoq.com/articles/performance-engineering/
 * - Optimization Patterns: https://martinfowler.com/articles/patterns-of-distributed-systems/
 * - APM Best Practices: https://www.datadoghq.com/knowledge-center/apm/
 * - Database Performance: https://use-the-index-luke.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    systemName,
    performanceGoals = {
      latency: { p95: 500, p99: 1000 },
      throughput: { rps: 500 },
      resourceUsage: { cpu: 80, memory: 85 }
    },
    baselineMetrics = null,
    optimizationScope = 'full-stack', // 'application', 'database', 'infrastructure', 'full-stack'
    targetImprovement = 25, // percentage improvement target
    maxIterations = 3,
    outputDir = 'performance-optimization-output',
    profilingTools = ['builtin', 'apm'], // 'builtin', 'apm', 'custom'
    loadTestingEnabled = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let performanceScore = 0;
  let iteration = 0;
  let currentMetrics = null;

  ctx.log('info', `Starting Performance Optimization Process for ${systemName}`);
  ctx.log('info', `Optimization Scope: ${optimizationScope}, Target Improvement: ${targetImprovement}%`);

  // ============================================================================
  // PHASE 1: ESTABLISH PERFORMANCE BASELINES
  // ============================================================================

  ctx.log('info', 'Phase 1: Establishing performance baselines');

  const baselineResult = await ctx.task(establishBaselineTask, {
    systemName,
    performanceGoals,
    existingBaseline: baselineMetrics,
    profilingTools,
    outputDir
  });

  currentMetrics = baselineResult.metrics;
  artifacts.push(...baselineResult.artifacts);

  ctx.log('info', `Baseline established - Latency P95: ${currentMetrics.latency.p95}ms, Throughput: ${currentMetrics.throughput.rps} RPS`);

  // Quality Gate: Baseline validation
  await ctx.breakpoint({
    question: `Performance baseline established for ${systemName}. Review baseline metrics and performance goals before proceeding?`,
    title: 'Baseline Metrics Review',
    context: {
      runId: ctx.runId,
      baseline: currentMetrics,
      goals: performanceGoals,
      gap: baselineResult.gap,
      files: baselineResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 2: PROFILE AND IDENTIFY BOTTLENECKS
  // ============================================================================

  ctx.log('info', 'Phase 2: Profiling system and identifying bottlenecks');

  const profilingResult = await ctx.task(profilingTask, {
    systemName,
    optimizationScope,
    baselineMetrics: currentMetrics,
    profilingTools,
    outputDir
  });

  artifacts.push(...profilingResult.artifacts);

  const criticalBottlenecks = profilingResult.bottlenecks.filter(b => b.severity === 'critical');

  ctx.log('info', `Identified ${profilingResult.bottlenecks.length} bottlenecks (${criticalBottlenecks.length} critical)`);

  // Quality Gate: Bottleneck review
  if (profilingResult.bottlenecks.length === 0) {
    await ctx.breakpoint({
      question: `No performance bottlenecks identified. Current performance may already be optimal or profiling needs adjustment. Proceed with optimization anyway?`,
      title: 'No Bottlenecks Found',
      context: {
        runId: ctx.runId,
        profilingResults: profilingResult,
        recommendation: 'Review profiling configuration or adjust performance goals',
        files: profilingResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 3: PRIORITIZE OPTIMIZATIONS
  // ============================================================================

  ctx.log('info', 'Phase 3: Prioritizing optimization opportunities');

  const prioritizationResult = await ctx.task(prioritizationTask, {
    systemName,
    bottlenecks: profilingResult.bottlenecks,
    performanceGoals,
    currentMetrics,
    targetImprovement,
    outputDir
  });

  artifacts.push(...prioritizationResult.artifacts);

  ctx.log('info', `Prioritized ${prioritizationResult.optimizationBacklog.length} optimization opportunities`);

  // Quality Gate: Prioritization review
  await ctx.breakpoint({
    question: `Optimization backlog created with ${prioritizationResult.optimizationBacklog.length} items. Top priority: ${prioritizationResult.optimizationBacklog[0]?.title}. Review and approve prioritization?`,
    title: 'Optimization Backlog Review',
    context: {
      runId: ctx.runId,
      backlog: prioritizationResult.optimizationBacklog.slice(0, 5),
      estimatedImpact: prioritizationResult.totalEstimatedImpact,
      files: prioritizationResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 4: ITERATIVE OPTIMIZATION LOOP
  // ============================================================================

  const optimizationResults = [];
  let cumulativeImprovement = 0;
  let converged = false;

  while (iteration < maxIterations && !converged) {
    iteration++;
    ctx.log('info', `Phase 4.${iteration}: Optimization iteration ${iteration}`);

    // Step 1: Design optimization strategies
    const optimizationDesign = await ctx.task(optimizationDesignTask, {
      systemName,
      iteration,
      bottlenecks: profilingResult.bottlenecks,
      optimizationBacklog: prioritizationResult.optimizationBacklog,
      currentMetrics,
      performanceGoals,
      optimizationScope,
      previousResults: iteration > 1 ? optimizationResults[iteration - 2] : null,
      outputDir
    });

    artifacts.push(...optimizationDesign.artifacts);

    // Quality Gate: Design review
    await ctx.breakpoint({
      question: `Iteration ${iteration}: Optimization strategy designed. Implementing ${optimizationDesign.strategies.length} optimizations. Review and approve implementation plan?`,
      title: `Iteration ${iteration} - Optimization Design Review`,
      context: {
        runId: ctx.runId,
        iteration,
        strategies: optimizationDesign.strategies,
        estimatedImpact: optimizationDesign.estimatedImpact,
        risks: optimizationDesign.risks,
        files: optimizationDesign.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });

    // Step 2: Implement optimizations
    const implementationResult = await ctx.task(implementationTask, {
      systemName,
      iteration,
      optimizationDesign,
      optimizationScope,
      outputDir
    });

    artifacts.push(...implementationResult.artifacts);

    ctx.log('info', `Iteration ${iteration}: Implemented ${implementationResult.optimizationsApplied.length} optimizations`);

    // Step 3: Validate improvements
    const validationResult = await ctx.task(validationTask, {
      systemName,
      iteration,
      baselineMetrics: currentMetrics,
      performanceGoals,
      implementationResult,
      profilingTools,
      loadTestingEnabled,
      outputDir
    });

    artifacts.push(...validationResult.artifacts);

    const improvement = validationResult.improvementPercentage;
    cumulativeImprovement += improvement;

    ctx.log('info', `Iteration ${iteration}: Achieved ${improvement}% improvement (Cumulative: ${cumulativeImprovement}%)`);

    // Store iteration results
    optimizationResults.push({
      iteration,
      design: optimizationDesign,
      implementation: implementationResult,
      validation: validationResult,
      improvement,
      newMetrics: validationResult.newMetrics
    });

    // Update current metrics
    currentMetrics = validationResult.newMetrics;

    // Check convergence
    if (cumulativeImprovement >= targetImprovement) {
      converged = true;
      ctx.log('info', `Target improvement of ${targetImprovement}% achieved!`);
    } else if (iteration < maxIterations) {
      // Continue to next iteration
      ctx.log('info', `Need ${targetImprovement - cumulativeImprovement}% more improvement. Continuing to iteration ${iteration + 1}`);
    } else {
      ctx.log('warn', `Reached maximum iterations without achieving target improvement`);
    }
  }

  // ============================================================================
  // PHASE 5: LOAD TESTING AND STRESS TESTING (if enabled)
  // ============================================================================

  let loadTestResults = null;
  if (loadTestingEnabled) {
    ctx.log('info', 'Phase 5: Running load tests to validate optimizations under load');

    loadTestResults = await ctx.task(loadTestTask, {
      systemName,
      performanceGoals,
      currentMetrics,
      optimizationScope,
      outputDir
    });

    artifacts.push(...loadTestResults.artifacts);

    // Quality Gate: Load test validation
    if (!loadTestResults.passed) {
      await ctx.breakpoint({
        question: `Load test did not meet performance goals. System performance degraded under load. Review results and decide next steps?`,
        title: 'Load Test Performance Gate',
        context: {
          runId: ctx.runId,
          loadTestMetrics: loadTestResults.metrics,
          goals: performanceGoals,
          failures: loadTestResults.failures,
          recommendation: 'Consider additional optimizations or adjust performance goals',
          files: loadTestResults.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
        }
      });
    }
  }

  // ============================================================================
  // PHASE 6: COMPREHENSIVE PERFORMANCE REPORT
  // ============================================================================

  ctx.log('info', 'Phase 6: Generating comprehensive performance report');

  const reportResult = await ctx.task(reportGenerationTask, {
    systemName,
    baselineMetrics: baselineResult.metrics,
    finalMetrics: currentMetrics,
    performanceGoals,
    profilingResult,
    prioritizationResult,
    optimizationResults,
    loadTestResults,
    targetImprovement,
    cumulativeImprovement,
    converged,
    outputDir
  });

  artifacts.push(...reportResult.artifacts);

  // ============================================================================
  // PHASE 7: PERFORMANCE SCORING AND ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 7: Computing performance score and final assessment');

  const assessmentResult = await ctx.task(performanceAssessmentTask, {
    systemName,
    performanceGoals,
    baselineMetrics: baselineResult.metrics,
    finalMetrics: currentMetrics,
    cumulativeImprovement,
    targetImprovement,
    optimizationResults,
    loadTestResults,
    outputDir
  });

  performanceScore = assessmentResult.performanceScore;
  artifacts.push(...assessmentResult.artifacts);

  ctx.log('info', `Performance Score: ${performanceScore}/100`);

  // Final Breakpoint: Performance Optimization Review
  await ctx.breakpoint({
    question: `Performance Optimization Complete for ${systemName}. Achieved ${cumulativeImprovement}% improvement (Target: ${targetImprovement}%). Performance Score: ${performanceScore}/100. Approve results?`,
    title: 'Final Performance Optimization Review',
    context: {
      runId: ctx.runId,
      summary: {
        performanceScore,
        cumulativeImprovement,
        targetImprovement,
        converged,
        iterations: iteration,
        optimizationsApplied: optimizationResults.reduce((sum, r) => sum + r.implementation.optimizationsApplied.length, 0)
      },
      baselineMetrics: baselineResult.metrics,
      finalMetrics: currentMetrics,
      goals: performanceGoals,
      verdict: assessmentResult.verdict,
      recommendation: assessmentResult.recommendation,
      files: [
        { path: reportResult.reportPath, format: 'markdown', label: 'Performance Optimization Report' },
        { path: assessmentResult.summaryPath, format: 'json', label: 'Assessment Summary' },
        { path: reportResult.metricsHistoryPath, format: 'json', label: 'Metrics History' }
      ]
    }
  });

  // ============================================================================
  // PHASE 8: MONITORING AND ALERTING SETUP
  // ============================================================================

  ctx.log('info', 'Phase 8: Setting up continuous performance monitoring');

  const monitoringSetup = await ctx.task(monitoringSetupTask, {
    systemName,
    performanceGoals,
    finalMetrics: currentMetrics,
    optimizationResults,
    outputDir
  });

  artifacts.push(...monitoringSetup.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    systemName,
    optimizationScope,
    performanceScore,
    converged,
    iterations: iteration,
    cumulativeImprovement,
    targetImprovement,
    baselineMetrics: baselineResult.metrics,
    finalMetrics: currentMetrics,
    performanceGoals,
    bottlenecks: profilingResult.bottlenecks.map(b => ({
      component: b.component,
      severity: b.severity,
      issue: b.issue,
      impact: b.impact
    })),
    optimizations: optimizationResults.map(r => ({
      iteration: r.iteration,
      strategiesCount: r.design.strategies.length,
      optimizationsApplied: r.implementation.optimizationsApplied.length,
      improvement: r.improvement,
      metrics: r.newMetrics
    })),
    validationResults: {
      loadTestPassed: loadTestResults?.passed,
      loadTestMetrics: loadTestResults?.metrics,
      finalValidation: assessmentResult
    },
    monitoring: {
      configured: monitoringSetup.configured,
      dashboardUrl: monitoringSetup.dashboardUrl,
      alerts: monitoringSetup.alerts.length
    },
    artifacts,
    report: {
      reportPath: reportResult.reportPath,
      summaryPath: assessmentResult.summaryPath,
      metricsHistoryPath: reportResult.metricsHistoryPath
    },
    duration,
    metadata: {
      processId: 'specializations/software-architecture/performance-optimization',
      timestamp: startTime,
      optimizationScope,
      profilingTools,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Establish Performance Baseline
export const establishBaselineTask = defineTask('establish-baseline', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Establish Performance Baseline - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Performance Engineering Specialist',
      task: 'Establish comprehensive performance baseline for the system',
      context: {
        systemName: args.systemName,
        performanceGoals: args.performanceGoals,
        existingBaseline: args.existingBaseline,
        profilingTools: args.profilingTools,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define comprehensive performance metrics (latency percentiles, throughput, resource usage)',
        '2. Measure current system performance under normal load',
        '3. Capture response time metrics (min, max, avg, p50, p95, p99)',
        '4. Measure throughput (requests per second, transactions per minute)',
        '5. Monitor resource utilization (CPU, memory, disk I/O, network)',
        '6. Identify current error rates and error patterns',
        '7. Document test conditions and environment state',
        '8. Compare against performance goals to identify gaps',
        '9. Create baseline performance report with visualizations',
        '10. Store baseline data for future comparisons'
      ],
      outputFormat: 'JSON object with baseline metrics and analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'metrics', 'gap', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        metrics: {
          type: 'object',
          properties: {
            latency: {
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
                tpm: { type: 'number' }
              }
            },
            resourceUsage: {
              type: 'object',
              properties: {
                cpu: { type: 'number' },
                memory: { type: 'number' },
                diskIO: { type: 'number' },
                network: { type: 'number' }
              }
            },
            errorRate: { type: 'number' }
          }
        },
        gap: {
          type: 'object',
          properties: {
            latencyGap: { type: 'number', description: 'Percentage over target' },
            throughputGap: { type: 'number' },
            resourceGap: { type: 'number' }
          }
        },
        testConditions: {
          type: 'object',
          properties: {
            timestamp: { type: 'string' },
            environment: { type: 'string' },
            load: { type: 'string' }
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
  labels: ['agent', 'performance-optimization', 'baseline']
}));

// Phase 2: Profiling and Bottleneck Identification
export const profilingTask = defineTask('profiling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Profiling and Bottleneck Analysis - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Performance Analysis Expert',
      task: 'Profile system and identify performance bottlenecks',
      context: {
        systemName: args.systemName,
        optimizationScope: args.optimizationScope,
        baselineMetrics: args.baselineMetrics,
        profilingTools: args.profilingTools,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Run application profiling (CPU profiling, memory profiling, I/O profiling)',
        '2. Analyze database query performance (slow queries, missing indexes)',
        '3. Monitor network latency and bandwidth usage',
        '4. Identify slow endpoints, functions, and code paths',
        '5. Analyze resource contention (locks, thread pools, connection pools)',
        '6. Use APM tools to trace distributed system performance',
        '7. Identify N+1 query problems and inefficient data access',
        '8. Analyze caching effectiveness and cache hit rates',
        '9. Categorize bottlenecks by severity (critical, high, medium, low)',
        '10. Provide root cause analysis for each bottleneck',
        '11. Generate comprehensive bottleneck analysis report'
      ],
      outputFormat: 'JSON object with bottleneck analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'bottlenecks', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        bottlenecks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              component: { type: 'string', description: 'Component name (database, API, cache, etc.)' },
              layer: { type: 'string', enum: ['application', 'database', 'infrastructure', 'network'] },
              issue: { type: 'string', description: 'Description of bottleneck' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              impact: { type: 'string', description: 'Impact on performance' },
              evidence: { type: 'string', description: 'Metrics supporting this finding' },
              rootCause: { type: 'string', description: 'Root cause analysis' }
            }
          }
        },
        profilingData: {
          type: 'object',
          properties: {
            cpuHotspots: { type: 'array' },
            memoryLeaks: { type: 'array' },
            slowQueries: { type: 'array' },
            inefficientEndpoints: { type: 'array' }
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
  labels: ['agent', 'performance-optimization', 'profiling']
}));

// Phase 3: Prioritization
export const prioritizationTask = defineTask('prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Prioritize Optimizations - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Performance Optimization Strategist',
      task: 'Prioritize optimization opportunities by impact and effort',
      context: {
        systemName: args.systemName,
        bottlenecks: args.bottlenecks,
        performanceGoals: args.performanceGoals,
        currentMetrics: args.currentMetrics,
        targetImprovement: args.targetImprovement,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze each bottleneck for potential performance impact',
        '2. Estimate optimization effort (hours/days) for each bottleneck',
        '3. Calculate ROI (performance gain vs. effort) for each optimization',
        '4. Prioritize using impact/effort matrix (high impact, low effort first)',
        '5. Group related optimizations for efficient implementation',
        '6. Identify quick wins (high impact, low effort)',
        '7. Identify long-term improvements (high impact, high effort)',
        '8. Create prioritized optimization backlog',
        '9. Estimate total expected performance improvement',
        '10. Generate prioritization report with justifications'
      ],
      outputFormat: 'JSON object with prioritized optimization backlog'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'optimizationBacklog', 'totalEstimatedImpact', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        optimizationBacklog: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              bottleneckId: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              estimatedImpact: { type: 'number', description: 'Percentage improvement expected' },
              estimatedEffort: { type: 'string', description: 'e.g., "2-3 days"' },
              roi: { type: 'number', description: 'ROI score' },
              category: { type: 'string', enum: ['application', 'database', 'caching', 'infrastructure', 'algorithm'] }
            }
          }
        },
        quickWins: { type: 'array', items: { type: 'string' } },
        longTermImprovements: { type: 'array', items: { type: 'string' } },
        totalEstimatedImpact: { type: 'number', description: 'Total expected improvement %' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'performance-optimization', 'prioritization']
}));

// Phase 4: Optimization Design
export const optimizationDesignTask = defineTask('optimization-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4.${args.iteration}: Design Optimization Strategies - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Performance Optimization Architect',
      task: 'Design specific optimization strategies for identified bottlenecks',
      context: {
        systemName: args.systemName,
        iteration: args.iteration,
        bottlenecks: args.bottlenecks,
        optimizationBacklog: args.optimizationBacklog,
        currentMetrics: args.currentMetrics,
        performanceGoals: args.performanceGoals,
        optimizationScope: args.optimizationScope,
        previousResults: args.previousResults,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Select top priority optimizations from backlog for this iteration',
        '2. Design specific optimization strategies for each selected item:',
        '   - Application-level: Algorithm optimization, caching, lazy loading, async processing',
        '   - Database-level: Index creation, query optimization, connection pooling, denormalization',
        '   - Infrastructure-level: Resource scaling, CDN, load balancing, auto-scaling',
        '   - Architecture-level: Microservices, event-driven, CQRS, caching layers',
        '3. Define implementation approach for each optimization',
        '4. Identify potential risks and side effects',
        '5. Plan rollback strategy for each optimization',
        '6. Estimate expected performance improvement',
        '7. Define validation criteria for each optimization',
        '8. Create detailed optimization plan document'
      ],
      outputFormat: 'JSON object with optimization strategies'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'strategies', 'estimatedImpact', 'risks', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        strategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              category: { type: 'string' },
              approach: { type: 'string', description: 'Implementation approach' },
              expectedImprovement: { type: 'number' },
              implementationSteps: { type: 'array', items: { type: 'string' } },
              validationCriteria: { type: 'array', items: { type: 'string' } },
              rollbackPlan: { type: 'string' }
            }
          }
        },
        estimatedImpact: { type: 'number', description: 'Total expected improvement %' },
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              severity: { type: 'string' },
              mitigation: { type: 'string' }
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
  labels: ['agent', 'performance-optimization', 'design', `iteration-${args.iteration}`]
}));

// Phase 4: Implementation
export const implementationTask = defineTask('implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4.${args.iteration}: Implement Optimizations - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Performance Optimization Engineer',
      task: 'Implement designed optimization strategies',
      context: {
        systemName: args.systemName,
        iteration: args.iteration,
        optimizationDesign: args.optimizationDesign,
        optimizationScope: args.optimizationScope,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Implement each optimization strategy from the design',
        '2. For application optimizations: Refactor code, add caching, optimize algorithms',
        '3. For database optimizations: Create indexes, optimize queries, tune connection pool',
        '4. For infrastructure optimizations: Adjust resource allocation, configure CDN, tune load balancer',
        '5. Use feature flags or canary deployments for controlled rollout',
        '6. Document all changes made',
        '7. Create rollback scripts/procedures',
        '8. Run unit and integration tests to ensure correctness',
        '9. Monitor for errors and regressions during implementation',
        '10. Generate implementation report with changes made'
      ],
      outputFormat: 'JSON object with implementation results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'optimizationsApplied', 'filesModified', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        optimizationsApplied: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              category: { type: 'string' },
              changesApplied: { type: 'array', items: { type: 'string' } },
              rollbackAvailable: { type: 'boolean' }
            }
          }
        },
        filesModified: { type: 'array', items: { type: 'string' } },
        configurationsChanged: { type: 'array', items: { type: 'string' } },
        testsRun: {
          type: 'object',
          properties: {
            unitTestsPassed: { type: 'boolean' },
            integrationTestsPassed: { type: 'boolean' }
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
  labels: ['agent', 'performance-optimization', 'implementation', `iteration-${args.iteration}`]
}));

// Phase 4: Validation
export const validationTask = defineTask('validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4.${args.iteration}: Validate Optimization Improvements - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Performance Testing Specialist',
      task: 'Validate performance improvements after optimizations',
      context: {
        systemName: args.systemName,
        iteration: args.iteration,
        baselineMetrics: args.baselineMetrics,
        performanceGoals: args.performanceGoals,
        implementationResult: args.implementationResult,
        profilingTools: args.profilingTools,
        loadTestingEnabled: args.loadTestingEnabled,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Run performance tests with same conditions as baseline',
        '2. Measure new performance metrics (latency, throughput, resource usage)',
        '3. Compare new metrics against baseline metrics',
        '4. Calculate percentage improvement for each metric',
        '5. Verify no performance regressions in other areas',
        '6. Check error rates have not increased',
        '7. Validate resource usage is within acceptable limits',
        '8. Run micro-benchmarks for optimized components',
        '9. Assess if optimization met expected improvement',
        '10. Document validation results with before/after comparison',
        '11. Generate performance improvement report'
      ],
      outputFormat: 'JSON object with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'newMetrics', 'improvementPercentage', 'validationPassed', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        newMetrics: {
          type: 'object',
          properties: {
            latency: {
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
                tpm: { type: 'number' }
              }
            },
            resourceUsage: {
              type: 'object',
              properties: {
                cpu: { type: 'number' },
                memory: { type: 'number' }
              }
            },
            errorRate: { type: 'number' }
          }
        },
        comparison: {
          type: 'object',
          properties: {
            latencyImprovement: { type: 'number' },
            throughputImprovement: { type: 'number' },
            resourceImprovement: { type: 'number' }
          }
        },
        improvementPercentage: { type: 'number', description: 'Overall improvement %' },
        validationPassed: { type: 'boolean', description: 'Met expected improvement' },
        regressions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'performance-optimization', 'validation', `iteration-${args.iteration}`]
}));

// Phase 5: Load Testing
export const loadTestTask = defineTask('load-test', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Load Testing - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Load Testing Engineer',
      task: 'Execute load tests to validate optimizations under realistic load',
      context: {
        systemName: args.systemName,
        performanceGoals: args.performanceGoals,
        currentMetrics: args.currentMetrics,
        optimizationScope: args.optimizationScope,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design load test scenarios based on expected production load',
        '2. Configure load testing tool (k6, JMeter, Gatling, etc.)',
        '3. Ramp up to target load gradually',
        '4. Maintain steady state load for test duration',
        '5. Monitor system behavior under load (response times, errors, resource usage)',
        '6. Test system at peak load (150-200% of expected)',
        '7. Test sustained load (soak test for stability)',
        '8. Validate auto-scaling behavior (if applicable)',
        '9. Compare load test results against performance goals',
        '10. Identify any performance degradation under load',
        '11. Generate comprehensive load test report'
      ],
      outputFormat: 'JSON object with load test results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'passed', 'metrics', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        passed: { type: 'boolean', description: 'Whether test met performance goals' },
        metrics: {
          type: 'object',
          properties: {
            peakLoad: {
              type: 'object',
              properties: {
                concurrentUsers: { type: 'number' },
                rps: { type: 'number' },
                p95Latency: { type: 'number' },
                errorRate: { type: 'number' }
              }
            },
            sustainedLoad: {
              type: 'object',
              properties: {
                duration: { type: 'string' },
                avgLatency: { type: 'number' },
                errorRate: { type: 'number' }
              }
            }
          }
        },
        failures: { type: 'array', items: { type: 'string' } },
        degradationUnderLoad: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'performance-optimization', 'load-testing']
}));

// Phase 6: Report Generation
export const reportGenerationTask = defineTask('report-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Generate Performance Report - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Performance Report Specialist',
      task: 'Generate comprehensive performance optimization report',
      context: {
        systemName: args.systemName,
        baselineMetrics: args.baselineMetrics,
        finalMetrics: args.finalMetrics,
        performanceGoals: args.performanceGoals,
        profilingResult: args.profilingResult,
        prioritizationResult: args.prioritizationResult,
        optimizationResults: args.optimizationResults,
        loadTestResults: args.loadTestResults,
        targetImprovement: args.targetImprovement,
        cumulativeImprovement: args.cumulativeImprovement,
        converged: args.converged,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create executive summary with key findings',
        '2. Document performance goals and achievement',
        '3. Present baseline vs. final metrics comparison',
        '4. Detail all bottlenecks identified',
        '5. Document all optimizations implemented',
        '6. Show performance improvement trend across iterations',
        '7. Include load test results and analysis',
        '8. Present before/after performance charts',
        '9. Document lessons learned and best practices',
        '10. Provide recommendations for ongoing performance monitoring',
        '11. Format as professional Markdown document',
        '12. Generate metrics history JSON for visualization'
      ],
      outputFormat: 'JSON object with report paths'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'reportPath', 'metricsHistoryPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        reportPath: { type: 'string', description: 'Performance optimization report path' },
        metricsHistoryPath: { type: 'string', description: 'Metrics history JSON path' },
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
  labels: ['agent', 'performance-optimization', 'reporting']
}));

// Phase 7: Performance Assessment
export const performanceAssessmentTask = defineTask('performance-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Final Performance Assessment - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Performance Engineering Lead',
      task: 'Conduct final performance assessment and scoring',
      context: {
        systemName: args.systemName,
        performanceGoals: args.performanceGoals,
        baselineMetrics: args.baselineMetrics,
        finalMetrics: args.finalMetrics,
        cumulativeImprovement: args.cumulativeImprovement,
        targetImprovement: args.targetImprovement,
        optimizationResults: args.optimizationResults,
        loadTestResults: args.loadTestResults,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Compare final metrics against performance goals',
        '2. Calculate weighted performance score (0-100):',
        '   - Latency goal achievement (40% weight)',
        '   - Throughput goal achievement (30% weight)',
        '   - Resource efficiency (20% weight)',
        '   - Stability and error rates (10% weight)',
        '3. Assess overall improvement percentage',
        '4. Evaluate if target improvement was achieved',
        '5. Identify remaining performance gaps',
        '6. Assess production readiness from performance perspective',
        '7. Provide overall verdict (excellent/good/acceptable/needs-work)',
        '8. Generate actionable recommendations for next steps',
        '9. Document strengths and remaining weaknesses',
        '10. Create final assessment summary document'
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
            latency: { type: 'number' },
            throughput: { type: 'number' },
            resourceEfficiency: { type: 'number' },
            stability: { type: 'number' }
          }
        },
        goalsMetComparison: {
          type: 'object',
          properties: {
            latencyGoalMet: { type: 'boolean' },
            throughputGoalMet: { type: 'boolean' },
            resourceGoalMet: { type: 'boolean' }
          }
        },
        productionReady: { type: 'boolean', description: 'Performance ready for production' },
        verdict: { type: 'string', description: 'Overall verdict' },
        recommendation: { type: 'string', description: 'Recommended next steps' },
        strengths: { type: 'array', items: { type: 'string' } },
        weaknesses: { type: 'array', items: { type: 'string' } },
        remainingGaps: { type: 'array', items: { type: 'string' } },
        summaryPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'performance-optimization', 'assessment']
}));

// Phase 8: Monitoring Setup
export const monitoringSetupTask = defineTask('monitoring-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Setup Performance Monitoring - ${args.systemName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Performance Monitoring Specialist',
      task: 'Set up continuous performance monitoring and alerting',
      context: {
        systemName: args.systemName,
        performanceGoals: args.performanceGoals,
        finalMetrics: args.finalMetrics,
        optimizationResults: args.optimizationResults,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure application performance monitoring (APM)',
        '2. Set up key performance metrics dashboards',
        '3. Define performance SLIs (Service Level Indicators)',
        '4. Configure alerts for performance regressions',
        '5. Set up automated performance regression detection',
        '6. Configure performance budgets for CI/CD',
        '7. Document monitoring setup and maintenance',
        '8. Create runbooks for performance incidents',
        '9. Set up performance trend analysis',
        '10. Configure periodic performance reports'
      ],
      outputFormat: 'JSON object with monitoring configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['configured', 'dashboardUrl', 'alerts', 'artifacts'],
      properties: {
        configured: { type: 'boolean' },
        dashboardUrl: { type: 'string', description: 'Performance dashboard URL or path' },
        alerts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              metric: { type: 'string' },
              threshold: { type: 'string' },
              severity: { type: 'string' }
            }
          }
        },
        slis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              target: { type: 'string' }
            }
          }
        },
        performanceBudget: {
          type: 'object',
          properties: {
            configured: { type: 'boolean' },
            budgets: { type: 'array' }
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
  labels: ['agent', 'performance-optimization', 'monitoring']
}));
