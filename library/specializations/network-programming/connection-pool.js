/**
 * @process specializations/network-programming/connection-pool
 * @description Connection Pool Implementation - Build a connection pool for efficient client-side connection reuse
 * with health checking, automatic recovery, connection lifecycle management, and metrics collection.
 * @inputs { projectName: string, language: string, poolConfig?: object, healthCheckConfig?: object }
 * @outputs { success: boolean, poolConfig: object, implementation: object, testResults: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/network-programming/connection-pool', {
 *   projectName: 'Database Connection Pool',
 *   language: 'Go',
 *   poolConfig: {
 *     minConnections: 5,
 *     maxConnections: 100,
 *     idleTimeout: 300000,
 *     acquireTimeout: 5000
 *   },
 *   healthCheckConfig: {
 *     interval: 30000,
 *     timeout: 5000
 *   }
 * });
 *
 * @references
 * - HikariCP: https://github.com/brettwooldridge/HikariCP
 * - Go sql/database: https://pkg.go.dev/database/sql
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    language = 'Go',
    poolConfig = {
      minConnections: 5,
      maxConnections: 100,
      idleTimeout: 300000,
      acquireTimeout: 5000,
      maxLifetime: 1800000
    },
    healthCheckConfig = {
      enabled: true,
      interval: 30000,
      timeout: 5000
    },
    outputDir = 'connection-pool'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Connection Pool Implementation: ${projectName}`);
  ctx.log('info', `Language: ${language}, Max Connections: ${poolConfig.maxConnections}`);

  // ============================================================================
  // PHASE 1: REQUIREMENTS AND DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing requirements and designing pool');

  const poolDesign = await ctx.task(poolDesignTask, {
    projectName,
    language,
    poolConfig,
    healthCheckConfig,
    outputDir
  });

  artifacts.push(...poolDesign.artifacts);

  await ctx.breakpoint({
    question: `Phase 1 Complete: Pool design created for ${poolConfig.maxConnections} max connections. Proceed with implementation?`,
    title: 'Pool Design Review',
    context: {
      runId: ctx.runId,
      poolDesign: poolDesign.design,
      files: poolDesign.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 2: CONNECTION LIFECYCLE
  // ============================================================================

  ctx.log('info', 'Phase 2: Implementing connection lifecycle management');

  const connectionLifecycle = await ctx.task(connectionLifecycleTask, {
    projectName,
    language,
    poolConfig,
    poolDesign,
    outputDir
  });

  artifacts.push(...connectionLifecycle.artifacts);

  // ============================================================================
  // PHASE 3: CHECKOUT/CHECKIN MECHANISM
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing checkout/checkin mechanism');

  const checkoutCheckin = await ctx.task(checkoutCheckinTask, {
    projectName,
    language,
    poolConfig,
    poolDesign,
    outputDir
  });

  artifacts.push(...checkoutCheckin.artifacts);

  // ============================================================================
  // PHASE 4: HEALTH CHECKING
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing connection health checking');

  const healthChecking = await ctx.task(healthCheckingTask, {
    projectName,
    language,
    healthCheckConfig,
    poolDesign,
    outputDir
  });

  artifacts.push(...healthChecking.artifacts);

  // ============================================================================
  // PHASE 5: AUTOMATIC RECOVERY
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing automatic recovery');

  const automaticRecovery = await ctx.task(automaticRecoveryTask, {
    projectName,
    language,
    poolConfig,
    healthChecking,
    outputDir
  });

  artifacts.push(...automaticRecovery.artifacts);

  // ============================================================================
  // PHASE 6: METRICS AND MONITORING
  // ============================================================================

  ctx.log('info', 'Phase 6: Adding metrics and monitoring');

  const metrics = await ctx.task(metricsTask, {
    projectName,
    language,
    poolConfig,
    outputDir
  });

  artifacts.push(...metrics.artifacts);

  // ============================================================================
  // PHASE 7: TESTING
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating comprehensive tests');

  const testSuite = await ctx.task(testSuiteTask, {
    projectName,
    language,
    poolConfig,
    connectionLifecycle,
    checkoutCheckin,
    healthChecking,
    automaticRecovery,
    outputDir
  });

  artifacts.push(...testSuite.artifacts);

  // ============================================================================
  // PHASE 8: DOCUMENTATION AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating documentation and validation');

  const [documentation, validation] = await ctx.parallel.all([
    () => ctx.task(documentationTask, {
      projectName,
      poolDesign,
      connectionLifecycle,
      checkoutCheckin,
      healthChecking,
      automaticRecovery,
      metrics,
      outputDir
    }),
    () => ctx.task(validationTask, {
      projectName,
      poolConfig,
      testSuite,
      outputDir
    })
  ]);

  artifacts.push(...documentation.artifacts);
  artifacts.push(...validation.artifacts);

  await ctx.breakpoint({
    question: `Connection Pool Implementation Complete for ${projectName}! Validation score: ${validation.overallScore}/100. Tests: ${testSuite.passedTests}/${testSuite.totalTests} passed. Review deliverables?`,
    title: 'Connection Pool Complete - Final Review',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        language,
        poolConfig,
        validationScore: validation.overallScore,
        testsPassed: testSuite.passedTests
      },
      files: [
        { path: documentation.readmePath, format: 'markdown', label: 'README' },
        { path: documentation.apiDocPath, format: 'markdown', label: 'API Documentation' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: validation.overallScore >= 80,
    projectName,
    poolConfig: {
      ...poolConfig,
      healthCheckConfig
    },
    implementation: {
      connectionLifecycle: connectionLifecycle.features,
      checkoutCheckin: checkoutCheckin.mechanism,
      healthChecking: healthChecking.strategy,
      automaticRecovery: automaticRecovery.strategies,
      metrics: metrics.metricsCollected
    },
    testResults: {
      totalTests: testSuite.totalTests,
      passedTests: testSuite.passedTests,
      failedTests: testSuite.failedTests
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/network-programming/connection-pool',
      timestamp: startTime,
      language
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const poolDesignTask = defineTask('pool-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Pool Design - ${args.projectName}`,
  skill: { name: 'socket-programming' },
  agent: {
    name: 'hpc-network-expert',
    prompt: {
      role: 'Connection Pool Architect',
      task: 'Design connection pool architecture',
      context: args,
      instructions: [
        '1. Design pool data structure (ring buffer, linked list, etc.)',
        '2. Define connection states (idle, in-use, invalid)',
        '3. Design thread-safe access patterns',
        '4. Plan connection acquisition strategy',
        '5. Design overflow handling',
        '6. Plan idle connection management',
        '7. Design for high concurrency',
        '8. Document design decisions'
      ],
      outputFormat: 'JSON with pool design'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'dataStructures', 'artifacts'],
      properties: {
        design: { type: 'object' },
        dataStructures: { type: 'array' },
        concurrencyModel: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'connection-pool', 'design']
}));

export const connectionLifecycleTask = defineTask('connection-lifecycle', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Connection Lifecycle - ${args.projectName}`,
  skill: { name: 'socket-programming' },
  agent: {
    name: 'hpc-network-expert',
    prompt: {
      role: 'Connection Lifecycle Engineer',
      task: 'Implement connection creation and initialization',
      context: args,
      instructions: [
        '1. Implement connection factory',
        '2. Implement connection initialization',
        '3. Add connection validation on creation',
        '4. Implement max lifetime enforcement',
        '5. Add connection destruction',
        '6. Implement lazy vs eager initialization',
        '7. Handle connection creation errors',
        '8. Add lifecycle event hooks'
      ],
      outputFormat: 'JSON with lifecycle implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['features', 'lifecycleStates', 'artifacts'],
      properties: {
        features: { type: 'array' },
        lifecycleStates: { type: 'array' },
        factory: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'connection-pool', 'lifecycle']
}));

export const checkoutCheckinTask = defineTask('checkout-checkin', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Checkout/Checkin - ${args.projectName}`,
  skill: { name: 'event-loop' },
  agent: {
    name: 'hpc-network-expert',
    prompt: {
      role: 'Pool Operations Engineer',
      task: 'Implement checkout/checkin mechanism',
      context: args,
      instructions: [
        '1. Implement connection checkout with timeout',
        '2. Implement blocking vs non-blocking acquire',
        '3. Implement connection checkin',
        '4. Add connection validation on checkin',
        '5. Implement fair queuing for waiters',
        '6. Add leak detection',
        '7. Implement auto-reclaim for forgotten connections',
        '8. Add checkout/checkin metrics'
      ],
      outputFormat: 'JSON with checkout/checkin implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['mechanism', 'operations', 'artifacts'],
      properties: {
        mechanism: { type: 'object' },
        operations: { type: 'array' },
        waitStrategy: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'connection-pool', 'checkout-checkin']
}));

export const healthCheckingTask = defineTask('health-checking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Health Checking - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: {
    name: 'network-testing-expert',
    prompt: {
      role: 'Health Check Engineer',
      task: 'Implement connection health checking',
      context: args,
      instructions: [
        '1. Implement health check protocol',
        '2. Add periodic background health checks',
        '3. Implement check-on-borrow validation',
        '4. Add check-on-return validation',
        '5. Implement custom health check support',
        '6. Add health check timeout handling',
        '7. Implement connection eviction on failure',
        '8. Add health check metrics'
      ],
      outputFormat: 'JSON with health checking implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'healthCheckTypes', 'artifacts'],
      properties: {
        strategy: { type: 'object' },
        healthCheckTypes: { type: 'array' },
        evictionPolicy: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'connection-pool', 'health-check']
}));

export const automaticRecoveryTask = defineTask('automatic-recovery', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Automatic Recovery - ${args.projectName}`,
  skill: { name: 'socket-programming' },
  agent: {
    name: 'hpc-network-expert',
    prompt: {
      role: 'Connection Recovery Engineer',
      task: 'Implement automatic reconnection and recovery',
      context: args,
      instructions: [
        '1. Implement automatic reconnection on failure',
        '2. Add exponential backoff for retries',
        '3. Implement pool replenishment',
        '4. Add circuit breaker for persistent failures',
        '5. Implement graceful degradation',
        '6. Add recovery event notifications',
        '7. Implement warm-up after recovery',
        '8. Document recovery procedures'
      ],
      outputFormat: 'JSON with recovery implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'recoveryMechanisms', 'artifacts'],
      properties: {
        strategies: { type: 'array' },
        recoveryMechanisms: { type: 'array' },
        circuitBreaker: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'connection-pool', 'recovery']
}));

export const metricsTask = defineTask('metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Metrics - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: {
    name: 'network-testing-expert',
    prompt: {
      role: 'Observability Engineer',
      task: 'Implement pool metrics and monitoring',
      context: args,
      instructions: [
        '1. Implement pool size metrics (total, idle, in-use)',
        '2. Add acquisition time metrics',
        '3. Implement wait time metrics',
        '4. Add connection creation/destruction metrics',
        '5. Implement health check metrics',
        '6. Add timeout and error metrics',
        '7. Implement metrics export (Prometheus, etc.)',
        '8. Create dashboard templates'
      ],
      outputFormat: 'JSON with metrics implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['metricsCollected', 'exportFormats', 'artifacts'],
      properties: {
        metricsCollected: { type: 'array' },
        exportFormats: { type: 'array' },
        dashboardTemplates: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'connection-pool', 'metrics']
}));

export const testSuiteTask = defineTask('test-suite', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Test Suite - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: {
    name: 'network-testing-expert',
    prompt: {
      role: 'Test Engineer',
      task: 'Create comprehensive pool tests',
      context: args,
      instructions: [
        '1. Create unit tests for pool operations',
        '2. Test concurrent checkout/checkin',
        '3. Test pool exhaustion scenarios',
        '4. Test health check functionality',
        '5. Test recovery mechanisms',
        '6. Test leak detection',
        '7. Create stress tests',
        '8. Document test scenarios'
      ],
      outputFormat: 'JSON with test results'
    },
    outputSchema: {
      type: 'object',
      required: ['totalTests', 'passedTests', 'failedTests', 'artifacts'],
      properties: {
        totalTests: { type: 'number' },
        passedTests: { type: 'number' },
        failedTests: { type: 'number' },
        testCategories: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'connection-pool', 'testing']
}));

export const documentationTask = defineTask('documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Documentation - ${args.projectName}`,
  agent: {
    name: 'network-architect',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate pool documentation',
      context: args,
      instructions: [
        '1. Create README with overview',
        '2. Document API and usage examples',
        '3. Document configuration options',
        '4. Create troubleshooting guide',
        '5. Document metrics and monitoring',
        '6. Create tuning guide',
        '7. Document best practices',
        '8. Create integration examples'
      ],
      outputFormat: 'JSON with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['readmePath', 'apiDocPath', 'artifacts'],
      properties: {
        readmePath: { type: 'string' },
        apiDocPath: { type: 'string' },
        configDocPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'connection-pool', 'documentation']
}));

export const validationTask = defineTask('validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Validation - ${args.projectName}`,
  skill: { name: 'network-testing' },
  agent: {
    name: 'network-testing-expert',
    prompt: {
      role: 'QA Engineer',
      task: 'Validate pool implementation',
      context: args,
      instructions: [
        '1. Verify all features implemented',
        '2. Validate thread safety',
        '3. Check resource cleanup',
        '4. Verify test coverage',
        '5. Validate documentation',
        '6. Calculate validation score',
        '7. Generate validation report'
      ],
      outputFormat: 'JSON with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'passedChecks', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        passedChecks: { type: 'array' },
        failedChecks: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['network', 'connection-pool', 'validation']
}));
