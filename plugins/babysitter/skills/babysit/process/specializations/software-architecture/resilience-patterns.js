/**
 * @process software-architecture/resilience-patterns
 * @description Resilience pattern implementation process with failure point analysis, pattern selection, circuit breaker design, bulkhead implementation, retry logic, timeout configuration, chaos testing, and monitoring setup
 * @inputs { system: string, components: array, slas: object, outputDir: string, chaosTestingEnabled: boolean }
 * @outputs { success: boolean, patternsImplemented: array, resilienceScore: number, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    system = '',
    components = [],
    slas = {},
    outputDir = 'resilience-output',
    chaosTestingEnabled = true,
    monitoringIntegration = true,
    autoRemediation = false
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const patternsImplemented = [];

  ctx.log('info', 'Starting Resilience Pattern Implementation Process');

  // ============================================================================
  // PHASE 1: IDENTIFY FAILURE POINTS
  // ============================================================================

  ctx.log('info', 'Phase 1: Identifying failure points and vulnerabilities');
  const failureAnalysis = await ctx.task(failurePointAnalysisTask, {
    system,
    components,
    slas,
    outputDir
  });

  artifacts.push(...failureAnalysis.artifacts);

  if (failureAnalysis.failurePoints.length === 0) {
    ctx.log('warn', 'No significant failure points identified');
    return {
      success: true,
      reason: 'No failure points requiring resilience patterns',
      recommendation: 'Continue monitoring for emerging issues',
      metadata: {
        processId: 'software-architecture/resilience-patterns',
        timestamp: startTime
      }
    };
  }

  // Breakpoint for failure point review
  await ctx.breakpoint({
    question: `Identified ${failureAnalysis.failurePoints.length} failure points. Review and approve pattern strategy?`,
    title: 'Failure Point Analysis Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: `${outputDir}/failure-analysis.md`, format: 'markdown' },
        { path: `${outputDir}/failure-points.json`, format: 'json' }
      ],
      summary: `Critical: ${failureAnalysis.criticalCount}, High: ${failureAnalysis.highCount}, Medium: ${failureAnalysis.mediumCount}`
    }
  });

  // ============================================================================
  // PHASE 2: SELECT RESILIENCE PATTERNS
  // ============================================================================

  ctx.log('info', 'Phase 2: Selecting appropriate resilience patterns');
  const patternSelection = await ctx.task(resiliencePatternSelectionTask, {
    failurePoints: failureAnalysis.failurePoints,
    components,
    slas,
    systemConstraints: failureAnalysis.constraints,
    outputDir
  });

  artifacts.push(...patternSelection.artifacts);

  // ============================================================================
  // PHASE 3: DESIGN AND IMPLEMENT PATTERNS IN PARALLEL
  // ============================================================================

  ctx.log('info', 'Phase 3: Designing and implementing resilience patterns');

  const patternImplementations = await ctx.parallel.all({
    // Circuit Breaker Implementation
    circuitBreakers: patternSelection.patterns.includes('circuit-breaker')
      ? ctx.task(circuitBreakerDesignTask, {
          failurePoints: failureAnalysis.failurePoints.filter(fp => fp.recommendedPattern === 'circuit-breaker'),
          components,
          slas,
          configuration: patternSelection.circuitBreakerConfig,
          outputDir
        })
      : Promise.resolve({ implemented: false, reason: 'Not selected' }),

    // Bulkhead Implementation
    bulkheads: patternSelection.patterns.includes('bulkhead')
      ? ctx.task(bulkheadImplementationTask, {
          failurePoints: failureAnalysis.failurePoints.filter(fp => fp.recommendedPattern === 'bulkhead'),
          components,
          resourceLimits: patternSelection.resourceLimits,
          isolationStrategy: patternSelection.isolationStrategy,
          outputDir
        })
      : Promise.resolve({ implemented: false, reason: 'Not selected' }),

    // Retry Logic Implementation
    retryLogic: patternSelection.patterns.includes('retry')
      ? ctx.task(retryLogicConfigurationTask, {
          failurePoints: failureAnalysis.failurePoints.filter(fp => fp.recommendedPattern === 'retry'),
          components,
          retryPolicies: patternSelection.retryPolicies,
          backoffStrategies: patternSelection.backoffStrategies,
          outputDir
        })
      : Promise.resolve({ implemented: false, reason: 'Not selected' }),

    // Timeout Configuration
    timeouts: patternSelection.patterns.includes('timeout')
      ? ctx.task(timeoutConfigurationTask, {
          failurePoints: failureAnalysis.failurePoints.filter(fp => fp.recommendedPattern === 'timeout'),
          components,
          slas,
          timeoutStrategy: patternSelection.timeoutStrategy,
          outputDir
        })
      : Promise.resolve({ implemented: false, reason: 'Not selected' }),

    // Rate Limiting (if needed)
    rateLimiting: patternSelection.patterns.includes('rate-limiter')
      ? ctx.task(rateLimitingImplementationTask, {
          failurePoints: failureAnalysis.failurePoints.filter(fp => fp.recommendedPattern === 'rate-limiter'),
          components,
          rateLimits: patternSelection.rateLimits,
          outputDir
        })
      : Promise.resolve({ implemented: false, reason: 'Not selected' }),

    // Fallback Mechanisms
    fallbacks: patternSelection.patterns.includes('fallback')
      ? ctx.task(fallbackImplementationTask, {
          failurePoints: failureAnalysis.failurePoints.filter(fp => fp.recommendedPattern === 'fallback'),
          components,
          fallbackStrategies: patternSelection.fallbackStrategies,
          outputDir
        })
      : Promise.resolve({ implemented: false, reason: 'Not selected' })
  });

  // Collect implemented patterns
  Object.entries(patternImplementations).forEach(([pattern, result]) => {
    if (result.implemented) {
      patternsImplemented.push(pattern);
      artifacts.push(...(result.artifacts || []));
    }
  });

  // Breakpoint for pattern implementation review
  await ctx.breakpoint({
    question: `Implemented ${patternsImplemented.length} resilience patterns. Review implementations before testing?`,
    title: 'Pattern Implementation Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: `${outputDir}/implementation-summary.md`, format: 'markdown' },
        { path: `${outputDir}/pattern-configurations.json`, format: 'json' }
      ],
      summary: `Patterns: ${patternsImplemented.join(', ')}`
    }
  });

  // ============================================================================
  // PHASE 4: INTEGRATION AND TESTING
  // ============================================================================

  ctx.log('info', 'Phase 4: Integrating patterns and running integration tests');
  const integration = await ctx.task(patternIntegrationTask, {
    implementations: patternImplementations,
    components,
    system,
    outputDir
  });

  artifacts.push(...integration.artifacts);

  // ============================================================================
  // PHASE 5: CHAOS ENGINEERING TESTS
  // ============================================================================

  if (chaosTestingEnabled) {
    ctx.log('info', 'Phase 5: Running chaos engineering tests');
    const chaosTests = await ctx.task(chaosEngineeringTestTask, {
      system,
      components,
      patternsImplemented,
      failurePoints: failureAnalysis.failurePoints,
      testScenarios: patternSelection.chaosScenarios,
      outputDir
    });

    artifacts.push(...chaosTests.artifacts);

    // Breakpoint for chaos test review
    await ctx.breakpoint({
      question: `Chaos tests completed with ${chaosTests.passedTests}/${chaosTests.totalTests} passing. Review results?`,
      title: 'Chaos Testing Results',
      context: {
        runId: ctx.runId,
        files: [
          { path: `${outputDir}/chaos-test-report.md`, format: 'markdown' },
          { path: `${outputDir}/chaos-test-results.json`, format: 'json' }
        ],
        summary: `Pass rate: ${Math.round((chaosTests.passedTests / chaosTests.totalTests) * 100)}%`
      }
    });

    // If tests failed, run remediation
    if (chaosTests.failedTests > 0 && autoRemediation) {
      ctx.log('info', 'Running auto-remediation for failed chaos tests');
      const remediation = await ctx.task(autoRemediationTask, {
        failedTests: chaosTests.failures,
        implementations: patternImplementations,
        outputDir
      });
      artifacts.push(...remediation.artifacts);
    }
  }

  // ============================================================================
  // PHASE 6: MONITORING AND ALERTING SETUP
  // ============================================================================

  if (monitoringIntegration) {
    ctx.log('info', 'Phase 6: Setting up monitoring and alerting');
    const monitoring = await ctx.task(monitoringSetupTask, {
      system,
      components,
      patternsImplemented,
      implementations: patternImplementations,
      slas,
      outputDir
    });

    artifacts.push(...monitoring.artifacts);
  }

  // ============================================================================
  // PHASE 7: RESILIENCE SCORING AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Calculating resilience score and validating implementation');
  const validation = await ctx.task(resilienceValidationTask, {
    system,
    components,
    patternsImplemented,
    failureAnalysis,
    patternSelection,
    chaosTestResults: chaosTestingEnabled ? patternImplementations : null,
    slas,
    outputDir
  });

  artifacts.push(...validation.artifacts);

  // ============================================================================
  // PHASE 8: DOCUMENTATION AND RUNBOOK GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating documentation and operational runbooks');
  const documentation = await ctx.task(resilienceDocumentationTask, {
    system,
    components,
    patternsImplemented,
    implementations: patternImplementations,
    validation,
    failureAnalysis,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  const duration = ctx.now() - startTime;

  ctx.log('info', `Resilience Pattern Implementation completed in ${duration}ms`);

  return {
    success: true,
    system,
    patternsImplemented,
    resilienceScore: validation.resilienceScore,
    improvement: validation.improvement,
    failurePointsCovered: failureAnalysis.failurePoints.length,
    artifacts,
    documentation: documentation.documents,
    monitoring: monitoringIntegration ? documentation.monitoringDashboards : [],
    runbooks: documentation.runbooks,
    metadata: {
      processId: 'software-architecture/resilience-patterns',
      timestamp: startTime,
      duration,
      chaosTestingEnabled,
      monitoringIntegration
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const failurePointAnalysisTask = defineTask('failure-point-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze system failure points and vulnerabilities',
  agent: {
    name: 'resilience-analyst',
    prompt: {
      role: 'reliability engineer and chaos engineering specialist',
      task: 'Analyze system architecture to identify potential failure points, single points of failure, and resilience gaps',
      context: args,
      instructions: [
        'Analyze system components and dependencies',
        'Identify external service dependencies and integration points',
        'Assess network communication patterns and failure modes',
        'Identify database and data store vulnerabilities',
        'Evaluate resource exhaustion scenarios',
        'Analyze cascading failure risks',
        'Identify timeout and latency issues',
        'Assess error handling and recovery mechanisms',
        'Prioritize failure points by impact and likelihood',
        'Recommend resilience patterns for each failure point',
        'Create failure mode analysis document',
        'Generate dependency graph with failure risks'
      ],
      outputFormat: 'JSON with failurePoints array, criticalCount, highCount, mediumCount, constraints, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['failurePoints', 'criticalCount', 'artifacts'],
      properties: {
        failurePoints: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'component', 'type', 'severity', 'impact', 'likelihood', 'recommendedPattern'],
            properties: {
              id: { type: 'string' },
              component: { type: 'string' },
              type: { type: 'string' },
              description: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              impact: { type: 'string' },
              likelihood: { type: 'string' },
              currentHandling: { type: 'string' },
              recommendedPattern: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        criticalCount: { type: 'number' },
        highCount: { type: 'number' },
        mediumCount: { type: 'number' },
        constraints: { type: 'object' },
        artifacts: {
          type: 'array',
          items: {
            type: 'object',
            required: ['path', 'type'],
            properties: {
              path: { type: 'string' },
              type: { type: 'string' }
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
  labels: ['agent', 'resilience', 'analysis', 'failure-points']
}));

export const resiliencePatternSelectionTask = defineTask('resilience-pattern-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select and configure appropriate resilience patterns',
  agent: {
    name: 'pattern-architect',
    prompt: {
      role: 'resilience architecture specialist',
      task: 'Select optimal resilience patterns for identified failure points and configure pattern parameters',
      context: args,
      instructions: [
        'Review failure points and their characteristics',
        'Select appropriate patterns: Circuit Breaker, Bulkhead, Retry, Timeout, Rate Limiter, Fallback',
        'Design circuit breaker thresholds and reset strategies',
        'Configure bulkhead resource limits and isolation strategies',
        'Define retry policies with exponential backoff',
        'Set timeout thresholds based on SLAs',
        'Configure rate limiting policies',
        'Design fallback mechanisms and degradation strategies',
        'Plan chaos engineering test scenarios',
        'Create pattern configuration matrix',
        'Document pattern selection rationale'
      ],
      outputFormat: 'JSON with patterns array, configurations, chaosScenarios, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['patterns', 'artifacts'],
      properties: {
        patterns: { type: 'array', items: { type: 'string' } },
        circuitBreakerConfig: { type: 'object' },
        resourceLimits: { type: 'object' },
        isolationStrategy: { type: 'string' },
        retryPolicies: { type: 'object' },
        backoffStrategies: { type: 'object' },
        timeoutStrategy: { type: 'object' },
        rateLimits: { type: 'object' },
        fallbackStrategies: { type: 'object' },
        chaosScenarios: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'resilience', 'pattern-selection']
}));

export const circuitBreakerDesignTask = defineTask('circuit-breaker-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design and implement circuit breaker patterns',
  agent: {
    name: 'circuit-breaker-engineer',
    prompt: {
      role: 'circuit breaker implementation specialist',
      task: 'Design and implement circuit breaker patterns with threshold configuration, state management, and fallback handling',
      context: args,
      instructions: [
        'Design circuit breaker state machine (Closed, Open, Half-Open)',
        'Configure failure thresholds and success thresholds',
        'Set timeout periods for open state',
        'Define half-open test request strategy',
        'Implement fallback responses',
        'Add circuit breaker metrics and logging',
        'Design circuit breaker dashboard',
        'Create implementation code or configuration',
        'Document circuit breaker behavior',
        'Define operational procedures'
      ],
      outputFormat: 'JSON with implemented true, circuitBreakers array, code, configuration, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['implemented', 'circuitBreakers', 'artifacts'],
      properties: {
        implemented: { type: 'boolean' },
        circuitBreakers: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name', 'component', 'failureThreshold', 'timeout'],
            properties: {
              name: { type: 'string' },
              component: { type: 'string' },
              failureThreshold: { type: 'number' },
              successThreshold: { type: 'number' },
              timeout: { type: 'number' },
              halfOpenRequests: { type: 'number' }
            }
          }
        },
        code: { type: 'array' },
        configuration: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'resilience', 'circuit-breaker', 'implementation']
}));

export const bulkheadImplementationTask = defineTask('bulkhead-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement bulkhead isolation patterns',
  agent: {
    name: 'bulkhead-engineer',
    prompt: {
      role: 'resource isolation specialist',
      task: 'Implement bulkhead patterns to isolate resources and prevent cascading failures',
      context: args,
      instructions: [
        'Design thread pool or connection pool isolation',
        'Configure resource limits per bulkhead',
        'Implement queue size limits',
        'Design reject policies for overload',
        'Configure bulkhead per service or operation',
        'Add bulkhead metrics and monitoring',
        'Create implementation code or configuration',
        'Document resource allocation strategy',
        'Define capacity planning guidelines'
      ],
      outputFormat: 'JSON with implemented true, bulkheads array, configuration, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['implemented', 'bulkheads', 'artifacts'],
      properties: {
        implemented: { type: 'boolean' },
        bulkheads: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name', 'component', 'maxConcurrent', 'maxQueue'],
            properties: {
              name: { type: 'string' },
              component: { type: 'string' },
              maxConcurrent: { type: 'number' },
              maxQueue: { type: 'number' },
              rejectPolicy: { type: 'string' }
            }
          }
        },
        configuration: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'resilience', 'bulkhead', 'implementation']
}));

export const retryLogicConfigurationTask = defineTask('retry-logic-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure retry logic with backoff strategies',
  agent: {
    name: 'retry-engineer',
    prompt: {
      role: 'retry policy specialist',
      task: 'Configure intelligent retry logic with exponential backoff, jitter, and retry budgets',
      context: args,
      instructions: [
        'Define retry conditions (which errors to retry)',
        'Configure retry counts per operation',
        'Implement exponential backoff with jitter',
        'Set maximum backoff intervals',
        'Define retry budgets to prevent retry storms',
        'Implement idempotency checks',
        'Add retry metrics and logging',
        'Create implementation code or configuration',
        'Document retry behavior',
        'Define operational guidelines for retry tuning'
      ],
      outputFormat: 'JSON with implemented true, retryPolicies array, configuration, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['implemented', 'retryPolicies', 'artifacts'],
      properties: {
        implemented: { type: 'boolean' },
        retryPolicies: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name', 'component', 'maxRetries', 'backoffStrategy'],
            properties: {
              name: { type: 'string' },
              component: { type: 'string' },
              maxRetries: { type: 'number' },
              backoffStrategy: { type: 'string' },
              initialDelay: { type: 'number' },
              maxDelay: { type: 'number' },
              jitter: { type: 'boolean' },
              retryableErrors: { type: 'array' }
            }
          }
        },
        configuration: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'resilience', 'retry', 'implementation']
}));

export const timeoutConfigurationTask = defineTask('timeout-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure timeout policies for operations',
  agent: {
    name: 'timeout-engineer',
    prompt: {
      role: 'timeout policy specialist',
      task: 'Configure timeout policies for all operations based on SLAs and performance requirements',
      context: args,
      instructions: [
        'Analyze operation SLAs and latency requirements',
        'Set appropriate timeout values per operation',
        'Configure connection timeouts',
        'Configure read/write timeouts',
        'Define timeout handling and logging',
        'Implement timeout metrics',
        'Create timeout configuration',
        'Document timeout rationale',
        'Define timeout tuning procedures'
      ],
      outputFormat: 'JSON with implemented true, timeouts array, configuration, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['implemented', 'timeouts', 'artifacts'],
      properties: {
        implemented: { type: 'boolean' },
        timeouts: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name', 'component', 'timeout'],
            properties: {
              name: { type: 'string' },
              component: { type: 'string' },
              timeout: { type: 'number' },
              connectionTimeout: { type: 'number' },
              readTimeout: { type: 'number' },
              writeTimeout: { type: 'number' }
            }
          }
        },
        configuration: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'resilience', 'timeout', 'implementation']
}));

export const rateLimitingImplementationTask = defineTask('rate-limiting-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement rate limiting patterns',
  agent: {
    name: 'rate-limiter-engineer',
    prompt: {
      role: 'rate limiting specialist',
      task: 'Implement rate limiting patterns to prevent overload and protect system resources',
      context: args,
      instructions: [
        'Design rate limiting strategy (token bucket, leaky bucket, fixed window)',
        'Configure rate limits per endpoint or user',
        'Implement distributed rate limiting if needed',
        'Configure rate limit headers (X-RateLimit-*)',
        'Define rate limit exceeded responses',
        'Add rate limiting metrics',
        'Create implementation code or configuration',
        'Document rate limiting policies',
        'Define procedures for rate limit adjustments'
      ],
      outputFormat: 'JSON with implemented true, rateLimiters array, configuration, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['implemented', 'rateLimiters', 'artifacts'],
      properties: {
        implemented: { type: 'boolean' },
        rateLimiters: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name', 'component', 'limit', 'window'],
            properties: {
              name: { type: 'string' },
              component: { type: 'string' },
              limit: { type: 'number' },
              window: { type: 'string' },
              strategy: { type: 'string' }
            }
          }
        },
        configuration: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'resilience', 'rate-limiting', 'implementation']
}));

export const fallbackImplementationTask = defineTask('fallback-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement fallback and degradation mechanisms',
  agent: {
    name: 'fallback-engineer',
    prompt: {
      role: 'graceful degradation specialist',
      task: 'Implement fallback mechanisms and graceful degradation strategies',
      context: args,
      instructions: [
        'Design fallback strategies per failure point',
        'Implement cached responses as fallbacks',
        'Configure default values and stub responses',
        'Design feature degradation paths',
        'Implement fallback chain (primary -> fallback -> default)',
        'Add fallback metrics and monitoring',
        'Create implementation code or configuration',
        'Document fallback behavior',
        'Define operational procedures for fallback management'
      ],
      outputFormat: 'JSON with implemented true, fallbacks array, configuration, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['implemented', 'fallbacks', 'artifacts'],
      properties: {
        implemented: { type: 'boolean' },
        fallbacks: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name', 'component', 'strategy'],
            properties: {
              name: { type: 'string' },
              component: { type: 'string' },
              strategy: { type: 'string' },
              cacheEnabled: { type: 'boolean' },
              defaultValue: { type: 'string' }
            }
          }
        },
        configuration: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'resilience', 'fallback', 'implementation']
}));

export const patternIntegrationTask = defineTask('pattern-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Integrate resilience patterns and run integration tests',
  agent: {
    name: 'integration-engineer',
    prompt: {
      role: 'system integration specialist',
      task: 'Integrate all resilience patterns into the system and verify integration through testing',
      context: args,
      instructions: [
        'Review all implemented patterns',
        'Ensure patterns work together correctly',
        'Verify pattern configurations',
        'Run integration tests',
        'Test pattern interactions (e.g., circuit breaker with retry)',
        'Validate fallback chains',
        'Check monitoring integration',
        'Document integration approach',
        'Create integration test report'
      ],
      outputFormat: 'JSON with integrated true, testResults, issues, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['integrated', 'testResults', 'artifacts'],
      properties: {
        integrated: { type: 'boolean' },
        testResults: {
          type: 'object',
          properties: {
            totalTests: { type: 'number' },
            passedTests: { type: 'number' },
            failedTests: { type: 'number' }
          }
        },
        issues: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'resilience', 'integration', 'testing']
}));

export const chaosEngineeringTestTask = defineTask('chaos-engineering-test', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run chaos engineering tests to validate resilience',
  agent: {
    name: 'chaos-engineer',
    prompt: {
      role: 'chaos engineering specialist',
      task: 'Execute chaos engineering experiments to validate resilience patterns under failure conditions',
      context: args,
      instructions: [
        'Design chaos experiments based on failure points',
        'Test service failures (kill service, network partition)',
        'Test latency injection',
        'Test resource exhaustion',
        'Test cascading failures',
        'Verify circuit breakers trip correctly',
        'Verify fallbacks activate correctly',
        'Verify system recovers gracefully',
        'Measure blast radius of failures',
        'Document test results and observations',
        'Create chaos test report with pass/fail results'
      ],
      outputFormat: 'JSON with totalTests, passedTests, failedTests, failures array, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalTests', 'passedTests', 'failedTests', 'artifacts'],
      properties: {
        totalTests: { type: 'number' },
        passedTests: { type: 'number' },
        failedTests: { type: 'number' },
        failures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              test: { type: 'string' },
              reason: { type: 'string' },
              pattern: { type: 'string' },
              recommendation: { type: 'string' }
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
  labels: ['agent', 'resilience', 'chaos-engineering', 'testing']
}));

export const autoRemediationTask = defineTask('auto-remediation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Auto-remediate failed chaos tests',
  agent: {
    name: 'remediation-engineer',
    prompt: {
      role: 'resilience remediation specialist',
      task: 'Analyze failed chaos tests and automatically adjust resilience configurations to fix issues',
      context: args,
      instructions: [
        'Analyze failed test scenarios',
        'Identify root causes of failures',
        'Adjust circuit breaker thresholds if needed',
        'Tune retry policies',
        'Adjust timeout values',
        'Improve fallback strategies',
        'Re-run failed tests to verify fixes',
        'Document changes made',
        'Create remediation report'
      ],
      outputFormat: 'JSON with remediated true, changes array, reTestResults, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['remediated', 'changes', 'artifacts'],
      properties: {
        remediated: { type: 'boolean' },
        changes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              parameter: { type: 'string' },
              oldValue: {},
              newValue: {},
              reason: { type: 'string' }
            }
          }
        },
        reTestResults: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'resilience', 'remediation']
}));

export const monitoringSetupTask = defineTask('monitoring-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up monitoring and alerting for resilience patterns',
  agent: {
    name: 'monitoring-engineer',
    prompt: {
      role: 'observability specialist',
      task: 'Configure comprehensive monitoring, metrics, and alerting for all resilience patterns',
      context: args,
      instructions: [
        'Define metrics for each pattern (circuit breaker state, retry counts, timeout rates)',
        'Create monitoring dashboards',
        'Configure alerting rules for pattern failures',
        'Set up SLA violation alerts',
        'Configure anomaly detection',
        'Implement distributed tracing for failure paths',
        'Create runbook links in alerts',
        'Document monitoring setup',
        'Export dashboard configurations'
      ],
      outputFormat: 'JSON with configured true, dashboards array, alerts array, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['configured', 'dashboards', 'alerts', 'artifacts'],
      properties: {
        configured: { type: 'boolean' },
        dashboards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              url: { type: 'string' },
              panels: { type: 'array' }
            }
          }
        },
        alerts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              condition: { type: 'string' },
              severity: { type: 'string' },
              runbook: { type: 'string' }
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
  labels: ['agent', 'resilience', 'monitoring', 'observability']
}));

export const resilienceValidationTask = defineTask('resilience-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate resilience score and validate implementation',
  agent: {
    name: 'resilience-validator',
    prompt: {
      role: 'resilience assessment specialist',
      task: 'Calculate overall system resilience score and validate implementation against best practices',
      context: args,
      instructions: [
        'Assess pattern coverage across failure points',
        'Calculate resilience score (0-100)',
        'Validate pattern configurations against best practices',
        'Assess monitoring coverage',
        'Evaluate chaos test results',
        'Compare to SLA requirements',
        'Identify remaining gaps',
        'Provide recommendations for improvement',
        'Create resilience scorecard',
        'Document validation results'
      ],
      outputFormat: 'JSON with resilienceScore, improvement, gaps array, recommendations, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['resilienceScore', 'improvement', 'artifacts'],
      properties: {
        resilienceScore: { type: 'number', minimum: 0, maximum: 100 },
        improvement: { type: 'string' },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              severity: { type: 'string' },
              description: { type: 'string' }
            }
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
  labels: ['agent', 'resilience', 'validation', 'scoring']
}));

export const resilienceDocumentationTask = defineTask('resilience-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive resilience documentation and runbooks',
  agent: {
    name: 'documentation-specialist',
    prompt: {
      role: 'technical writer and SRE specialist',
      task: 'Create comprehensive documentation, architecture diagrams, and operational runbooks for resilience implementation',
      context: args,
      instructions: [
        'Create resilience architecture diagram',
        'Document each implemented pattern',
        'Write operational runbooks for each pattern',
        'Document troubleshooting procedures',
        'Create incident response guides',
        'Document monitoring and alerting setup',
        'Create pattern configuration reference',
        'Write tuning guidelines',
        'Document testing procedures',
        'Create executive summary report',
        'Generate all documentation artifacts'
      ],
      outputFormat: 'JSON with documents array, runbooks array, diagrams array, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documents', 'runbooks', 'artifacts'],
      properties: {
        documents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              path: { type: 'string' },
              type: { type: 'string' }
            }
          }
        },
        runbooks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              pattern: { type: 'string' },
              path: { type: 'string' }
            }
          }
        },
        diagrams: { type: 'array' },
        monitoringDashboards: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'resilience', 'documentation', 'runbooks']
}));
