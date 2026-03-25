/**
 * @process specializations/sdk-platform-development/platform-api-gateway-design
 * @description Platform API Gateway Design - Design and implement API gateway with routing, security, rate limiting,
 * and traffic management capabilities.
 * @inputs { projectName: string, gatewayType?: string, features?: array, trafficManagement?: object }
 * @outputs { success: boolean, gatewayConfig: object, securityRules: array, rateLimiting: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/sdk-platform-development/platform-api-gateway-design', {
 *   projectName: 'CloudAPI Gateway',
 *   gatewayType: 'kong',
 *   features: ['rate-limiting', 'auth', 'routing', 'circuit-breaker'],
 *   trafficManagement: { loadBalancing: 'round-robin', retries: 3 }
 * });
 *
 * @references
 * - Kong Gateway: https://docs.konghq.com/
 * - AWS API Gateway: https://docs.aws.amazon.com/apigateway/
 * - Envoy Proxy: https://www.envoyproxy.io/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    gatewayType = 'kong',
    features = ['rate-limiting', 'authentication', 'routing'],
    trafficManagement = { loadBalancing: 'round-robin', retries: 3 },
    outputDir = 'platform-api-gateway-design'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Platform API Gateway Design: ${projectName}`);
  ctx.log('info', `Gateway Type: ${gatewayType}`);

  // ============================================================================
  // PHASE 1: GATEWAY ARCHITECTURE
  // ============================================================================

  ctx.log('info', 'Phase 1: Designing gateway architecture');

  const architecture = await ctx.task(gatewayArchitectureTask, {
    projectName,
    gatewayType,
    features,
    outputDir
  });

  artifacts.push(...architecture.artifacts);

  // ============================================================================
  // PHASE 2: ROUTING CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Configuring request routing and load balancing');

  const routingConfig = await ctx.task(routingConfigTask, {
    projectName,
    gatewayType,
    trafficManagement,
    architecture,
    outputDir
  });

  artifacts.push(...routingConfig.artifacts);

  // ============================================================================
  // PHASE 3: RATE LIMITING SETUP
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing rate limiting policies');

  const rateLimiting = await ctx.task(rateLimitingTask, {
    projectName,
    gatewayType,
    architecture,
    outputDir
  });

  artifacts.push(...rateLimiting.artifacts);

  // ============================================================================
  // PHASE 4: AUTHENTICATION AND AUTHORIZATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Setting up authentication and authorization');

  const authConfig = await ctx.task(gatewayAuthTask, {
    projectName,
    gatewayType,
    architecture,
    outputDir
  });

  artifacts.push(...authConfig.artifacts);

  // Quality Gate: Security Configuration Review
  await ctx.breakpoint({
    question: `Gateway security configured for ${projectName}. Auth methods: ${authConfig.methods.length}, Rate limiting tiers: ${rateLimiting.tiers.length}. Approve configuration?`,
    title: 'Gateway Security Review',
    context: {
      runId: ctx.runId,
      projectName,
      authMethods: authConfig.methods,
      rateLimitingTiers: rateLimiting.tiers,
      files: artifacts.slice(-3).map(a => ({ path: a.path, format: a.format || 'yaml' }))
    }
  });

  // ============================================================================
  // PHASE 5: CIRCUIT BREAKER AND RETRY
  // ============================================================================

  ctx.log('info', 'Phase 5: Designing circuit breaker and retry policies');

  const resilienceConfig = await ctx.task(resilienceConfigTask, {
    projectName,
    gatewayType,
    trafficManagement,
    architecture,
    outputDir
  });

  artifacts.push(...resilienceConfig.artifacts);

  // ============================================================================
  // PHASE 6: CACHING CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Configuring response caching');

  const cachingConfig = await ctx.task(cachingConfigTask, {
    projectName,
    gatewayType,
    architecture,
    outputDir
  });

  artifacts.push(...cachingConfig.artifacts);

  // ============================================================================
  // PHASE 7: MONITORING AND LOGGING
  // ============================================================================

  ctx.log('info', 'Phase 7: Setting up gateway monitoring and logging');

  const monitoringConfig = await ctx.task(gatewayMonitoringTask, {
    projectName,
    gatewayType,
    architecture,
    outputDir
  });

  artifacts.push(...monitoringConfig.artifacts);

  // ============================================================================
  // PHASE 8: GATEWAY DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating gateway documentation');

  const documentation = await ctx.task(gatewayDocumentationTask, {
    projectName,
    architecture,
    routingConfig,
    rateLimiting,
    authConfig,
    resilienceConfig,
    cachingConfig,
    monitoringConfig,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    gatewayConfig: {
      type: gatewayType,
      architecture: architecture.design,
      routing: routingConfig.config
    },
    securityRules: authConfig.rules,
    rateLimiting: {
      tiers: rateLimiting.tiers,
      policies: rateLimiting.policies
    },
    resilience: {
      circuitBreaker: resilienceConfig.circuitBreaker,
      retry: resilienceConfig.retry
    },
    caching: cachingConfig.config,
    monitoring: monitoringConfig.config,
    documentation: documentation.paths,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/sdk-platform-development/platform-api-gateway-design',
      timestamp: startTime,
      gatewayType
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const gatewayArchitectureTask = defineTask('gateway-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Gateway Architecture - ${args.projectName}`,
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'Platform Architect',
      task: 'Design API gateway architecture',
      context: {
        projectName: args.projectName,
        gatewayType: args.gatewayType,
        features: args.features,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define gateway topology (single, distributed)',
        '2. Design plugin/middleware architecture',
        '3. Plan upstream service integration',
        '4. Design request/response transformation',
        '5. Plan high availability setup',
        '6. Design admin API access',
        '7. Plan configuration management',
        '8. Design plugin ordering',
        '9. Plan upgrade and migration strategy',
        '10. Generate architecture documentation'
      ],
      outputFormat: 'JSON with gateway architecture'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'topology', 'plugins', 'artifacts'],
      properties: {
        design: { type: 'object' },
        topology: { type: 'string' },
        plugins: { type: 'array', items: { type: 'string' } },
        upstreams: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'api-gateway', 'architecture']
}));

export const routingConfigTask = defineTask('routing-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Routing Configuration - ${args.projectName}`,
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'Gateway Engineer',
      task: 'Configure request routing and load balancing',
      context: {
        projectName: args.projectName,
        gatewayType: args.gatewayType,
        trafficManagement: args.trafficManagement,
        architecture: args.architecture,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define route matching rules',
        '2. Configure path-based routing',
        '3. Set up header-based routing',
        '4. Configure load balancing algorithm',
        '5. Set up health checks',
        '6. Configure service discovery integration',
        '7. Set up canary deployments',
        '8. Configure A/B testing routes',
        '9. Design traffic mirroring',
        '10. Generate routing configuration'
      ],
      outputFormat: 'JSON with routing configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'routes', 'artifacts'],
      properties: {
        config: { type: 'object' },
        routes: { type: 'array', items: { type: 'object' } },
        loadBalancing: { type: 'object' },
        healthChecks: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'api-gateway', 'routing']
}));

export const rateLimitingTask = defineTask('rate-limiting', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Rate Limiting - ${args.projectName}`,
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'Platform Engineer',
      task: 'Implement rate limiting policies',
      context: {
        projectName: args.projectName,
        gatewayType: args.gatewayType,
        architecture: args.architecture,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design rate limiting tiers',
        '2. Configure token bucket algorithm',
        '3. Set up sliding window limits',
        '4. Configure per-consumer limits',
        '5. Design global vs route limits',
        '6. Set up quota management',
        '7. Configure rate limit headers',
        '8. Design burst handling',
        '9. Plan distributed rate limiting',
        '10. Generate rate limiting configuration'
      ],
      outputFormat: 'JSON with rate limiting configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['tiers', 'policies', 'artifacts'],
      properties: {
        tiers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              requestsPerMinute: { type: 'number' },
              burstSize: { type: 'number' }
            }
          }
        },
        policies: { type: 'array', items: { type: 'object' } },
        headers: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'api-gateway', 'rate-limiting']
}));

export const gatewayAuthTask = defineTask('gateway-auth', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Gateway Authentication - ${args.projectName}`,
  agent: {
    name: 'security-review-agent',
    prompt: {
      role: 'Security Engineer',
      task: 'Set up gateway authentication and authorization',
      context: {
        projectName: args.projectName,
        gatewayType: args.gatewayType,
        architecture: args.architecture,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure API key authentication',
        '2. Set up JWT validation',
        '3. Configure OAuth 2.0 integration',
        '4. Set up mTLS for service-to-service',
        '5. Configure CORS policies',
        '6. Set up IP whitelisting',
        '7. Design permission policies',
        '8. Configure token introspection',
        '9. Set up security logging',
        '10. Generate authentication configuration'
      ],
      outputFormat: 'JSON with authentication configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['methods', 'rules', 'artifacts'],
      properties: {
        methods: { type: 'array', items: { type: 'string' } },
        rules: { type: 'array', items: { type: 'object' } },
        cors: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'api-gateway', 'authentication', 'security']
}));

export const resilienceConfigTask = defineTask('resilience-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Resilience Configuration - ${args.projectName}`,
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'Reliability Engineer',
      task: 'Design circuit breaker and retry policies',
      context: {
        projectName: args.projectName,
        gatewayType: args.gatewayType,
        trafficManagement: args.trafficManagement,
        architecture: args.architecture,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure circuit breaker thresholds',
        '2. Design fallback responses',
        '3. Set up retry policies',
        '4. Configure exponential backoff',
        '5. Design timeout policies',
        '6. Configure bulkhead patterns',
        '7. Set up outlier detection',
        '8. Design graceful degradation',
        '9. Configure panic mode',
        '10. Generate resilience configuration'
      ],
      outputFormat: 'JSON with resilience configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['circuitBreaker', 'retry', 'artifacts'],
      properties: {
        circuitBreaker: {
          type: 'object',
          properties: {
            threshold: { type: 'number' },
            timeout: { type: 'number' },
            halfOpenRequests: { type: 'number' }
          }
        },
        retry: {
          type: 'object',
          properties: {
            maxRetries: { type: 'number' },
            backoffMs: { type: 'number' }
          }
        },
        fallbacks: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'api-gateway', 'resilience']
}));

export const cachingConfigTask = defineTask('caching-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Caching Configuration - ${args.projectName}`,
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'Performance Engineer',
      task: 'Configure response caching',
      context: {
        projectName: args.projectName,
        gatewayType: args.gatewayType,
        architecture: args.architecture,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design caching strategy',
        '2. Configure cache key generation',
        '3. Set up TTL policies',
        '4. Configure cache invalidation',
        '5. Design cache partitioning',
        '6. Set up cache backends (Redis, etc.)',
        '7. Configure vary headers',
        '8. Design cache warming',
        '9. Set up cache metrics',
        '10. Generate caching configuration'
      ],
      outputFormat: 'JSON with caching configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'policies', 'artifacts'],
      properties: {
        config: {
          type: 'object',
          properties: {
            backend: { type: 'string' },
            defaultTTL: { type: 'number' }
          }
        },
        policies: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'api-gateway', 'caching']
}));

export const gatewayMonitoringTask = defineTask('gateway-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Gateway Monitoring - ${args.projectName}`,
  agent: {
    name: 'telemetry-privacy-auditor',
    prompt: {
      role: 'Observability Engineer',
      task: 'Set up gateway monitoring and logging',
      context: {
        projectName: args.projectName,
        gatewayType: args.gatewayType,
        architecture: args.architecture,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure access logging',
        '2. Set up metrics collection',
        '3. Configure distributed tracing',
        '4. Design alerting rules',
        '5. Set up health check endpoints',
        '6. Configure log aggregation',
        '7. Design dashboards',
        '8. Set up anomaly detection',
        '9. Configure audit logging',
        '10. Generate monitoring configuration'
      ],
      outputFormat: 'JSON with monitoring configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'metrics', 'artifacts'],
      properties: {
        config: { type: 'object' },
        metrics: { type: 'array', items: { type: 'string' } },
        alerts: { type: 'array', items: { type: 'object' } },
        dashboards: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'api-gateway', 'monitoring', 'observability']
}));

export const gatewayDocumentationTask = defineTask('gateway-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Gateway Documentation - ${args.projectName}`,
  agent: {
    name: 'technical-writer-agent',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate gateway documentation',
      context: {
        projectName: args.projectName,
        architecture: args.architecture,
        routingConfig: args.routingConfig,
        rateLimiting: args.rateLimiting,
        authConfig: args.authConfig,
        resilienceConfig: args.resilienceConfig,
        cachingConfig: args.cachingConfig,
        monitoringConfig: args.monitoringConfig,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create gateway architecture overview',
        '2. Document routing configuration',
        '3. Write rate limiting guide',
        '4. Document authentication setup',
        '5. Create resilience patterns guide',
        '6. Document caching configuration',
        '7. Write monitoring and alerting guide',
        '8. Create operations runbook',
        '9. Document troubleshooting procedures',
        '10. Generate all documentation'
      ],
      outputFormat: 'JSON with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['paths', 'artifacts'],
      properties: {
        paths: {
          type: 'object',
          properties: {
            architecture: { type: 'string' },
            configuration: { type: 'string' },
            operations: { type: 'string' }
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
  labels: ['sdk', 'api-gateway', 'documentation']
}));
