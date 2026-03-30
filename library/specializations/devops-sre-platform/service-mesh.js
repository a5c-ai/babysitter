/**
 * @process specializations/devops-sre-platform/service-mesh
 * @description Service Mesh Implementation - Complete workflow for implementing a production-ready service mesh
 * with traffic management, security (mTLS), observability, resilience patterns, and policy enforcement. Supports
 * multiple service mesh implementations (Istio, Linkerd, Consul Connect) with installation, configuration,
 * progressive traffic migration, observability integration, and operational runbooks.
 * @inputs { projectName: string, serviceMeshType?: string, clusterInfo?: object, services?: array, environment?: string }
 * @outputs { success: boolean, serviceMeshInfo: object, policies: array, observability: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/devops-sre-platform/service-mesh', {
 *   projectName: 'E-commerce Microservices',
 *   serviceMeshType: 'istio', // 'istio', 'linkerd', 'consul'
 *   clusterInfo: {
 *     clusterName: 'production-k8s',
 *     kubernetesVersion: '1.28'
 *   },
 *   services: [
 *     { name: 'api-gateway', namespace: 'default' },
 *     { name: 'order-service', namespace: 'default' },
 *     { name: 'payment-service', namespace: 'default' }
 *   ],
 *   environment: 'production',
 *   requirements: {
 *     mtls: true,
 *     trafficManagement: true,
 *     observability: true,
 *     resilience: true,
 *     multiCluster: false,
 *     egressControl: true
 *   }
 * });
 *
 * @references
 * - Istio Documentation: https://istio.io/latest/docs/
 * - Linkerd Documentation: https://linkerd.io/2/overview/
 * - Consul Service Mesh: https://www.consul.io/docs/connect
 * - Service Mesh Comparison: https://servicemesh.es/
 * - Service Mesh Patterns: https://www.oreilly.com/library/view/the-enterprise-path/9781492041795/
 * - CNCF Service Mesh Landscape: https://landscape.cncf.io/card-mode?category=service-mesh
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    serviceMeshType = 'istio', // 'istio', 'linkerd', 'consul'
    clusterInfo = {
      clusterName: 'kubernetes-cluster',
      kubernetesVersion: '1.28'
    },
    services = [],
    environment = 'production',
    requirements = {
      mtls: true,
      trafficManagement: true,
      observability: true,
      resilience: true,
      multiCluster: false,
      egressControl: true,
      rateLimiting: true,
      circuitBreaker: true,
      retryPolicy: true
    },
    migrationStrategy = 'progressive', // 'progressive', 'all-at-once'
    outputDir = 'service-mesh-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let serviceMeshInfo = {};
  const policies = [];
  let observability = {};
  let migrationStatus = {};

  ctx.log('info', `Starting Service Mesh Implementation for ${projectName}`);
  ctx.log('info', `Service Mesh: ${serviceMeshType}, Environment: ${environment}`);
  ctx.log('info', `Services to mesh: ${services.length}`);

  // ============================================================================
  // PHASE 1: SERVICE MESH ASSESSMENT AND PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 1: Assessing service mesh requirements and planning implementation');

  const assessmentResult = await ctx.task(assessServiceMeshRequirementsTask, {
    projectName,
    serviceMeshType,
    clusterInfo,
    services,
    environment,
    requirements,
    outputDir
  });

  if (!assessmentResult.success) {
    return {
      success: false,
      error: 'Failed to complete service mesh assessment',
      details: assessmentResult,
      metadata: {
        processId: 'specializations/devops-sre-platform/service-mesh',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...assessmentResult.artifacts);
  serviceMeshInfo.assessment = assessmentResult;

  ctx.log('info', `Assessment complete - ${assessmentResult.servicesAnalyzed} services analyzed, readiness score: ${assessmentResult.readinessScore}/100`);

  // Quality Gate: Assessment review
  await ctx.breakpoint({
    question: `Service mesh assessment complete for ${projectName}. Readiness score: ${assessmentResult.readinessScore}/100. ${assessmentResult.servicesAnalyzed} services analyzed. Proceed with ${serviceMeshType} implementation?`,
    title: 'Service Mesh Assessment Review',
    context: {
      runId: ctx.runId,
      assessment: {
        serviceMeshType,
        readinessScore: assessmentResult.readinessScore,
        servicesAnalyzed: assessmentResult.servicesAnalyzed,
        compatibilityIssues: assessmentResult.compatibilityIssues,
        recommendations: assessmentResult.recommendations
      },
      files: assessmentResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 2: SERVICE MESH INSTALLATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Installing service mesh control plane and data plane');

  const installationResult = await ctx.task(installServiceMeshTask, {
    projectName,
    serviceMeshType,
    clusterInfo,
    environment,
    requirements,
    outputDir
  });

  if (!installationResult.success) {
    return {
      success: false,
      error: 'Failed to install service mesh',
      details: installationResult,
      metadata: {
        processId: 'specializations/devops-sre-platform/service-mesh',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...installationResult.artifacts);
  serviceMeshInfo.installation = installationResult;

  ctx.log('info', `Service mesh installed - Control plane: ${installationResult.controlPlane.status}, Version: ${installationResult.version}`);

  // Quality Gate: Installation verification
  await ctx.breakpoint({
    question: `${serviceMeshType} service mesh installed successfully. Control plane status: ${installationResult.controlPlane.status}. Verify installation before proceeding with sidecar injection?`,
    title: 'Service Mesh Installation Verification',
    context: {
      runId: ctx.runId,
      installation: {
        serviceMeshType,
        version: installationResult.version,
        controlPlane: installationResult.controlPlane,
        components: installationResult.components,
        namespaces: installationResult.namespaces
      },
      files: installationResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 3: SIDECAR INJECTION SETUP
  // ============================================================================

  ctx.log('info', 'Phase 3: Configuring sidecar injection for services');

  const sidecarResult = await ctx.task(configureSidecarInjectionTask, {
    projectName,
    serviceMeshType,
    clusterInfo,
    services,
    migrationStrategy,
    outputDir
  });

  if (!sidecarResult.success) {
    return {
      success: false,
      error: 'Failed to configure sidecar injection',
      details: sidecarResult,
      metadata: {
        processId: 'specializations/devops-sre-platform/service-mesh',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...sidecarResult.artifacts);
  serviceMeshInfo.sidecar = sidecarResult;

  ctx.log('info', `Sidecar injection configured - ${sidecarResult.namespacesEnabled.length} namespaces enabled, ${sidecarResult.servicesInjected} services injected`);

  // ============================================================================
  // PHASE 4: MTLS SECURITY CONFIGURATION
  // ============================================================================

  if (requirements.mtls) {
    ctx.log('info', 'Phase 4: Configuring mutual TLS (mTLS) for service-to-service encryption');

    const mtlsResult = await ctx.task(configureMtlsTask, {
      projectName,
      serviceMeshType,
      clusterInfo,
      services,
      environment,
      outputDir
    });

    if (!mtlsResult.success) {
      return {
        success: false,
        error: 'Failed to configure mTLS',
        details: mtlsResult,
        metadata: {
          processId: 'specializations/devops-sre-platform/service-mesh',
          timestamp: startTime
        }
      };
    }

    artifacts.push(...mtlsResult.artifacts);
    policies.push(...mtlsResult.policies);
    serviceMeshInfo.mtls = mtlsResult;

    ctx.log('info', `mTLS configured - Mode: ${mtlsResult.mode}, Certificates: ${mtlsResult.certificateManagement}`);

    // Quality Gate: mTLS verification
    await ctx.breakpoint({
      question: `mTLS configured with mode: ${mtlsResult.mode}. ${mtlsResult.servicesSecured} services secured. Verify secure communication is working?`,
      title: 'mTLS Security Verification',
      context: {
        runId: ctx.runId,
        mtls: {
          enabled: mtlsResult.enabled,
          mode: mtlsResult.mode,
          servicesSecured: mtlsResult.servicesSecured,
          certificateManagement: mtlsResult.certificateManagement
        },
        files: mtlsResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 5: TRAFFIC MANAGEMENT CONFIGURATION
  // ============================================================================

  if (requirements.trafficManagement) {
    ctx.log('info', 'Phase 5: Configuring traffic management (routing, splitting, mirroring)');

    const trafficResult = await ctx.task(configureTrafficManagementTask, {
      projectName,
      serviceMeshType,
      services,
      requirements,
      outputDir
    });

    if (!trafficResult.success) {
      return {
        success: false,
        error: 'Failed to configure traffic management',
        details: trafficResult,
        metadata: {
          processId: 'specializations/devops-sre-platform/service-mesh',
          timestamp: startTime
        }
      };
    }

    artifacts.push(...trafficResult.artifacts);
    policies.push(...trafficResult.policies);
    serviceMeshInfo.trafficManagement = trafficResult;

    ctx.log('info', `Traffic management configured - Routes: ${trafficResult.virtualServices.length}, Gateways: ${trafficResult.gateways.length}`);
  }

  // ============================================================================
  // PHASE 6: RESILIENCE PATTERNS IMPLEMENTATION
  // ============================================================================

  if (requirements.resilience) {
    ctx.log('info', 'Phase 6: Implementing resilience patterns (circuit breaker, retry, timeout)');

    const [circuitBreakerResult, retryResult, timeoutResult] = await ctx.parallel.all([
      requirements.circuitBreaker ? ctx.task(configureCircuitBreakerTask, {
        projectName,
        serviceMeshType,
        services,
        outputDir
      }) : Promise.resolve({ success: true, policies: [], artifacts: [] }),
      requirements.retryPolicy ? ctx.task(configureRetryPolicyTask, {
        projectName,
        serviceMeshType,
        services,
        outputDir
      }) : Promise.resolve({ success: true, policies: [], artifacts: [] }),
      ctx.task(configureTimeoutPolicyTask, {
        projectName,
        serviceMeshType,
        services,
        outputDir
      })
    ]);

    if (!circuitBreakerResult.success || !retryResult.success || !timeoutResult.success) {
      return {
        success: false,
        error: 'Failed to configure resilience patterns',
        details: { circuitBreakerResult, retryResult, timeoutResult },
        metadata: {
          processId: 'specializations/devops-sre-platform/service-mesh',
          timestamp: startTime
        }
      };
    }

    artifacts.push(...circuitBreakerResult.artifacts, ...retryResult.artifacts, ...timeoutResult.artifacts);
    policies.push(...circuitBreakerResult.policies, ...retryResult.policies, ...timeoutResult.policies);
    serviceMeshInfo.resilience = { circuitBreakerResult, retryResult, timeoutResult };

    ctx.log('info', `Resilience patterns configured - Circuit breakers: ${circuitBreakerResult.policies.length}, Retries: ${retryResult.policies.length}, Timeouts: ${timeoutResult.policies.length}`);
  }

  // ============================================================================
  // PHASE 7: OBSERVABILITY INTEGRATION
  // ============================================================================

  if (requirements.observability) {
    ctx.log('info', 'Phase 7: Integrating observability (metrics, traces, logs)');

    const observabilityResult = await ctx.task(integrateObservabilityTask, {
      projectName,
      serviceMeshType,
      clusterInfo,
      services,
      outputDir
    });

    if (!observabilityResult.success) {
      ctx.log('warn', 'Observability integration had issues, but continuing');
    } else {
      artifacts.push(...observabilityResult.artifacts);
      observability = observabilityResult;
      ctx.log('info', `Observability integrated - Metrics: ${observabilityResult.metricsEnabled}, Traces: ${observabilityResult.tracingEnabled}, Dashboards: ${observabilityResult.dashboards.length}`);
    }

    // Quality Gate: Observability verification
    await ctx.breakpoint({
      question: `Observability integration complete. Metrics: ${observabilityResult.metricsEnabled}, Tracing: ${observabilityResult.tracingEnabled}. ${observabilityResult.dashboards.length} dashboards created. Verify telemetry data is being collected?`,
      title: 'Observability Integration Review',
      context: {
        runId: ctx.runId,
        observability: {
          metricsEnabled: observabilityResult.metricsEnabled,
          tracingEnabled: observabilityResult.tracingEnabled,
          loggingEnabled: observabilityResult.loggingEnabled,
          dashboards: observabilityResult.dashboards.length
        },
        files: observabilityResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 8: EGRESS CONTROL AND EXTERNAL SERVICES
  // ============================================================================

  if (requirements.egressControl) {
    ctx.log('info', 'Phase 8: Configuring egress control for external services');

    const egressResult = await ctx.task(configureEgressControlTask, {
      projectName,
      serviceMeshType,
      services,
      outputDir
    });

    if (!egressResult.success) {
      ctx.log('warn', 'Egress control configuration had issues, but continuing');
    } else {
      artifacts.push(...egressResult.artifacts);
      policies.push(...egressResult.policies);
      serviceMeshInfo.egress = egressResult;
      ctx.log('info', `Egress control configured - ${egressResult.serviceEntries.length} external services registered`);
    }
  }

  // ============================================================================
  // PHASE 9: RATE LIMITING AND QUOTAS
  // ============================================================================

  if (requirements.rateLimiting) {
    ctx.log('info', 'Phase 9: Configuring rate limiting and quotas');

    const rateLimitResult = await ctx.task(configureRateLimitingTask, {
      projectName,
      serviceMeshType,
      services,
      outputDir
    });

    if (!rateLimitResult.success) {
      ctx.log('warn', 'Rate limiting configuration had issues, but continuing');
    } else {
      artifacts.push(...rateLimitResult.artifacts);
      policies.push(...rateLimitResult.policies);
      serviceMeshInfo.rateLimiting = rateLimitResult;
      ctx.log('info', `Rate limiting configured - ${rateLimitResult.policies.length} policies created`);
    }
  }

  // ============================================================================
  // PHASE 10: PROGRESSIVE TRAFFIC MIGRATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Executing progressive traffic migration to service mesh');

  const migrationResult = await ctx.task(executeTrafficMigrationTask, {
    projectName,
    serviceMeshType,
    services,
    migrationStrategy,
    outputDir
  });

  if (!migrationResult.success) {
    return {
      success: false,
      error: 'Failed to migrate traffic to service mesh',
      details: migrationResult,
      metadata: {
        processId: 'specializations/devops-sre-platform/service-mesh',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...migrationResult.artifacts);
  migrationStatus = migrationResult;

  ctx.log('info', `Traffic migration ${migrationResult.status} - ${migrationResult.servicesMigrated}/${services.length} services migrated`);

  // Quality Gate: Migration verification
  await ctx.breakpoint({
    question: `Traffic migration ${migrationResult.status}. ${migrationResult.servicesMigrated}/${services.length} services migrated. Current traffic percentage: ${migrationResult.currentTrafficPercentage}%. Verify migration is successful before proceeding to 100%?`,
    title: 'Traffic Migration Verification',
    context: {
      runId: ctx.runId,
      migration: {
        status: migrationResult.status,
        servicesMigrated: migrationResult.servicesMigrated,
        totalServices: services.length,
        currentTrafficPercentage: migrationResult.currentTrafficPercentage,
        issues: migrationResult.issues
      },
      files: migrationResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 11: SERVICE MESH VALIDATION AND TESTING
  // ============================================================================

  ctx.log('info', 'Phase 11: Validating service mesh functionality');

  const validationResult = await ctx.task(validateServiceMeshTask, {
    projectName,
    serviceMeshType,
    clusterInfo,
    services,
    serviceMeshInfo,
    requirements,
    outputDir
  });

  if (!validationResult.success) {
    ctx.log('error', 'Service mesh validation failed');

    await ctx.breakpoint({
      question: `Service mesh validation failed with ${validationResult.failedTests} failed tests. Issues: ${validationResult.issues.length}. Review and fix issues?`,
      title: 'Service Mesh Validation Failed',
      context: {
        runId: ctx.runId,
        validation: validationResult,
        files: validationResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  artifacts.push(...validationResult.artifacts);

  ctx.log('info', `Validation complete - ${validationResult.testsPassed}/${validationResult.testsTotal} tests passed, Score: ${validationResult.validationScore}/100`);

  // ============================================================================
  // PHASE 12: OPERATIONAL RUNBOOKS AND DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 12: Creating operational runbooks and documentation');

  const documentationResult = await ctx.task(generateServiceMeshDocumentationTask, {
    projectName,
    serviceMeshType,
    serviceMeshInfo,
    policies,
    observability,
    migrationStatus,
    validationResult,
    outputDir
  });

  if (!documentationResult.success) {
    ctx.log('warn', 'Documentation generation had issues, but continuing');
  } else {
    artifacts.push(...documentationResult.artifacts);
  }

  // ============================================================================
  // FINAL QUALITY GATE AND HANDOFF
  // ============================================================================

  const overallScore = validationResult.validationScore;
  const qualityThreshold = environment === 'production' ? 85 : 75;

  ctx.log('info', `Overall service mesh quality score: ${overallScore}/100`);

  await ctx.breakpoint({
    question: `Service mesh implementation complete for ${projectName}. Overall quality score: ${overallScore}/100 (threshold: ${qualityThreshold}). ${migrationResult.servicesMigrated} services migrated. Ready to handoff?`,
    title: 'Final Service Mesh Review and Handoff',
    context: {
      runId: ctx.runId,
      overallScore,
      qualityThreshold,
      summary: {
        serviceMeshType,
        version: installationResult.version,
        servicesMigrated: migrationResult.servicesMigrated,
        totalServices: services.length,
        mtlsEnabled: requirements.mtls,
        observabilityIntegrated: requirements.observability,
        policiesCreated: policies.length,
        validationScore: validationResult.validationScore
      },
      files: [
        { path: documentationResult.operationalGuidePath, format: 'markdown', label: 'Operational Guide' },
        { path: documentationResult.architecturePath, format: 'markdown', label: 'Architecture Documentation' },
        { path: `${outputDir}/service-mesh-summary.json`, format: 'json', label: 'Summary Report' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  ctx.log('info', `Service mesh implementation completed in ${duration}ms`);
  ctx.log('info', `Service Mesh: ${serviceMeshType} v${installationResult.version}`);
  ctx.log('info', `Services Migrated: ${migrationResult.servicesMigrated}/${services.length}`);
  ctx.log('info', `Quality Score: ${overallScore}/100`);

  return {
    success: true,
    projectName,
    serviceMeshType,
    version: installationResult.version,
    serviceMeshInfo,
    policies,
    observability,
    migrationStatus,
    validationResult,
    artifacts,
    overallScore,
    qualityThreshold,
    summary: {
      serviceMeshType,
      version: installationResult.version,
      controlPlaneStatus: installationResult.controlPlane.status,
      servicesMigrated: migrationResult.servicesMigrated,
      totalServices: services.length,
      migrationPercentage: (migrationResult.servicesMigrated / services.length) * 100,
      mtlsEnabled: requirements.mtls,
      mtlsMode: serviceMeshInfo.mtls?.mode,
      trafficManagementEnabled: requirements.trafficManagement,
      observabilityIntegrated: requirements.observability,
      resiliencePatternsEnabled: requirements.resilience,
      policiesCreated: policies.length,
      dashboardsCreated: observability.dashboards?.length || 0,
      validationScore: overallScore,
      testsPassed: validationResult.testsPassed,
      testsFailed: validationResult.failedTests,
      artifactsGenerated: artifacts.length
    },
    metadata: {
      processId: 'specializations/devops-sre-platform/service-mesh',
      processSlug: 'service-mesh',
      category: 'platform-engineering',
      specializationSlug: 'devops-sre-platform',
      timestamp: startTime,
      duration,
      version: '1.0.0'
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const assessServiceMeshRequirementsTask = defineTask('assess-service-mesh-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Assess Service Mesh Requirements: ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Service Mesh Architect specialized in microservices networking',
      task: 'Assess service mesh requirements and readiness for implementation',
      context: args,
      instructions: [
        'Analyze the microservices architecture and communication patterns',
        'Assess service mesh readiness:',
        '  - Number of services and their communication patterns',
        '  - Current service discovery mechanism',
        '  - Existing load balancing and traffic management',
        '  - Security requirements (mTLS, authorization)',
        '  - Observability gaps (tracing, metrics)',
        'Evaluate service mesh options:',
        '  - Istio: Feature-rich, extensive capabilities, more complex',
        '  - Linkerd: Lightweight, simple, focused on core features',
        '  - Consul: HashiCorp ecosystem integration, multi-cloud',
        'Identify services that will benefit most from service mesh',
        'Assess compatibility with existing infrastructure',
        'Identify potential migration challenges and risks',
        'Calculate readiness score (0-100)',
        'Provide recommendations for implementation approach',
        'Create assessment report with findings'
      ],
      outputFormat: 'JSON with success, readinessScore, servicesAnalyzed, compatibilityIssues, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'readinessScore', 'servicesAnalyzed', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        readinessScore: { type: 'number', minimum: 0, maximum: 100 },
        servicesAnalyzed: { type: 'number' },
        serviceDetails: { type: 'array' },
        compatibilityIssues: { type: 'array' },
        recommendations: { type: 'array' },
        estimatedComplexity: { type: 'string', enum: ['low', 'medium', 'high', 'very-high'] },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['service-mesh', 'assessment', args.serviceMeshType]
}));

export const installServiceMeshTask = defineTask('install-service-mesh', (args, taskCtx) => ({
  kind: 'agent',
  title: `Install Service Mesh: ${args.serviceMeshType}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Platform Engineer specialized in service mesh deployment',
      task: `Install and configure ${args.serviceMeshType} service mesh`,
      context: args,
      instructions: [
        `Install ${args.serviceMeshType} control plane components`,
        'For Istio:',
        '  - Install istiod (control plane)',
        '  - Install ingress gateway',
        '  - Install egress gateway (if required)',
        '  - Configure IstioOperator custom resource',
        'For Linkerd:',
        '  - Install linkerd control plane',
        '  - Install linkerd-viz for observability',
        '  - Install linkerd-jaeger for distributed tracing',
        'For Consul:',
        '  - Install Consul server',
        '  - Install Consul Connect',
        '  - Configure service mesh features',
        'Configure resource limits and requests',
        'Set up high availability (multiple replicas)',
        'Enable telemetry collection',
        'Configure certificate management (cert-manager or built-in CA)',
        'Validate control plane installation',
        'Test control plane health and readiness',
        'Generate installation manifests and configuration'
      ],
      outputFormat: 'JSON with success, version, controlPlane, components, namespaces, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'version', 'controlPlane', 'components', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        version: { type: 'string' },
        controlPlane: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
            replicas: { type: 'number' },
            namespace: { type: 'string' }
          }
        },
        components: { type: 'array' },
        namespaces: { type: 'array' },
        ingressGateway: { type: 'object' },
        egressGateway: { type: 'object' },
        certificateManagement: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['service-mesh', 'installation', args.serviceMeshType]
}));

export const configureSidecarInjectionTask = defineTask('configure-sidecar-injection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure Sidecar Injection: ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Service Mesh Engineer',
      task: 'Configure automatic sidecar injection for services',
      context: args,
      instructions: [
        'Enable namespace-level sidecar injection',
        'Label namespaces for automatic injection',
        'For progressive migration:',
        '  - Start with non-production namespace',
        '  - Enable annotation-based injection for specific pods',
        '  - Gradually increase coverage',
        'For all-at-once migration:',
        '  - Enable injection for all target namespaces',
        'Configure sidecar proxy resources (CPU, memory)',
        'Set sidecar proxy configuration (concurrency, access logging)',
        'Configure traffic interception rules',
        'Restart deployments to inject sidecars',
        'Verify sidecar containers are running',
        'Check sidecar proxy version matches control plane',
        'Generate sidecar configuration manifests'
      ],
      outputFormat: 'JSON with success, namespacesEnabled, servicesInjected, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'namespacesEnabled', 'servicesInjected', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        namespacesEnabled: { type: 'array', items: { type: 'string' } },
        servicesInjected: { type: 'number' },
        injectionMode: { type: 'string', enum: ['automatic', 'manual', 'hybrid'] },
        sidecarConfiguration: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['service-mesh', 'sidecar-injection', args.serviceMeshType]
}));

export const configureMtlsTask = defineTask('configure-mtls', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure mTLS: ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Engineer specialized in service mesh security',
      task: 'Configure mutual TLS for service-to-service encryption',
      context: args,
      instructions: [
        'Configure mesh-wide mTLS policy',
        'Set mTLS mode:',
        '  - PERMISSIVE: Allow both plaintext and mTLS (for migration)',
        '  - STRICT: Require mTLS for all traffic (production)',
        'Configure certificate authority (CA)',
        'Set certificate rotation policy',
        'Configure peer authentication policies',
        'Set up authorization policies based on service identity',
        'Configure mTLS for specific services/namespaces',
        'Test mTLS connectivity between services',
        'Verify certificates are valid and properly distributed',
        'Monitor certificate expiration',
        'Generate security policies and manifests'
      ],
      outputFormat: 'JSON with success, enabled, mode, servicesSecured, certificateManagement, policies, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'enabled', 'mode', 'servicesSecured', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        enabled: { type: 'boolean' },
        mode: { type: 'string', enum: ['PERMISSIVE', 'STRICT'] },
        servicesSecured: { type: 'number' },
        certificateManagement: { type: 'string' },
        certificateRotation: { type: 'string' },
        policies: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['service-mesh', 'mtls', 'security', args.serviceMeshType]
}));

export const configureTrafficManagementTask = defineTask('configure-traffic-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure Traffic Management: ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Traffic Engineering Specialist',
      task: 'Configure advanced traffic management policies',
      context: args,
      instructions: [
        'Create VirtualServices for traffic routing',
        'Configure DestinationRules for load balancing',
        'Implement traffic splitting for canary deployments',
        'Set up traffic mirroring for testing',
        'Configure ingress gateway for external traffic',
        'Set up egress gateway for controlled external access',
        'Implement header-based routing',
        'Configure URL rewriting and redirects',
        'Set up fault injection for chaos testing',
        'Configure traffic policies (connection pool, outlier detection)',
        'Test traffic routing rules',
        'Generate traffic management manifests'
      ],
      outputFormat: 'JSON with success, virtualServices, destinationRules, gateways, policies, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'virtualServices', 'destinationRules', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        virtualServices: { type: 'array' },
        destinationRules: { type: 'array' },
        gateways: { type: 'array' },
        policies: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['service-mesh', 'traffic-management', args.serviceMeshType]
}));

export const configureCircuitBreakerTask = defineTask('configure-circuit-breaker', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure Circuit Breaker: ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Resilience Engineering Specialist',
      task: 'Configure circuit breaker patterns for fault tolerance',
      context: args,
      instructions: [
        'Identify services that need circuit breakers',
        'Configure outlier detection in DestinationRules',
        'Set consecutive errors threshold',
        'Set time interval for error detection',
        'Configure ejection time for unhealthy instances',
        'Set minimum health percentage',
        'Configure connection pool limits',
        'Test circuit breaker behavior under failure',
        'Generate circuit breaker policies'
      ],
      outputFormat: 'JSON with success, policies, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'policies', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        policies: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['service-mesh', 'circuit-breaker', 'resilience']
}));

export const configureRetryPolicyTask = defineTask('configure-retry-policy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure Retry Policy: ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Resilience Engineering Specialist',
      task: 'Configure retry policies for transient failures',
      context: args,
      instructions: [
        'Configure retry attempts per service',
        'Set per-try timeout',
        'Configure retry conditions (5xx, gateway-error, reset)',
        'Set exponential backoff parameters',
        'Configure retry budget to prevent retry storms',
        'Test retry behavior',
        'Generate retry policy manifests'
      ],
      outputFormat: 'JSON with success, policies, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'policies', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        policies: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['service-mesh', 'retry-policy', 'resilience']
}));

export const configureTimeoutPolicyTask = defineTask('configure-timeout-policy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure Timeout Policy: ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Resilience Engineering Specialist',
      task: 'Configure timeout policies for request handling',
      context: args,
      instructions: [
        'Set request timeout per service',
        'Configure connection timeout',
        'Set idle timeout',
        'Test timeout behavior',
        'Generate timeout policy manifests'
      ],
      outputFormat: 'JSON with success, policies, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'policies', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        policies: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['service-mesh', 'timeout-policy', 'resilience']
}));

export const integrateObservabilityTask = defineTask('integrate-observability', (args, taskCtx) => ({
  kind: 'agent',
  title: `Integrate Observability: ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Observability Engineer',
      task: 'Integrate service mesh with observability stack',
      context: args,
      instructions: [
        'Configure Prometheus for service mesh metrics collection',
        'Set up Grafana dashboards for service mesh',
        'Create dashboards:',
        '  - Service mesh overview (control plane health)',
        '  - Service dashboard (traffic, latency, errors)',
        '  - Workload dashboard (pod-level metrics)',
        'Integrate distributed tracing (Jaeger, Zipkin, Tempo)',
        'Configure trace sampling rate',
        'Enable access logging for traffic analysis',
        'Configure log format (JSON)',
        'Test metrics collection and visualization',
        'Test trace collection and visualization',
        'Generate observability configuration'
      ],
      outputFormat: 'JSON with success, metricsEnabled, tracingEnabled, loggingEnabled, dashboards, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'metricsEnabled', 'tracingEnabled', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        metricsEnabled: { type: 'boolean' },
        tracingEnabled: { type: 'boolean' },
        loggingEnabled: { type: 'boolean' },
        dashboards: { type: 'array' },
        prometheusIntegration: { type: 'object' },
        tracingBackend: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['service-mesh', 'observability', args.serviceMeshType]
}));

export const configureEgressControlTask = defineTask('configure-egress-control', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure Egress Control: ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Network Security Engineer',
      task: 'Configure egress control for external service access',
      context: args,
      instructions: [
        'Identify external services accessed by mesh services',
        'Create ServiceEntry resources for external services',
        'Configure egress gateway for centralized external traffic',
        'Set up TLS origination for external HTTPS services',
        'Configure timeout and retry for external calls',
        'Implement access policies for external services',
        'Test external service connectivity',
        'Generate egress configuration manifests'
      ],
      outputFormat: 'JSON with success, serviceEntries, policies, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'serviceEntries', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        serviceEntries: { type: 'array' },
        egressGatewayEnabled: { type: 'boolean' },
        policies: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['service-mesh', 'egress-control', args.serviceMeshType]
}));

export const configureRateLimitingTask = defineTask('configure-rate-limiting', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure Rate Limiting: ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'API Gateway Specialist',
      task: 'Configure rate limiting and quotas',
      context: args,
      instructions: [
        'Identify services that need rate limiting',
        'Configure local rate limiting in Envoy',
        'Set up global rate limiting (if needed)',
        'Define rate limit descriptors',
        'Set requests per second/minute limits',
        'Configure rate limit actions (deny, log, delay)',
        'Test rate limiting behavior',
        'Generate rate limiting policies'
      ],
      outputFormat: 'JSON with success, policies, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'policies', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        policies: { type: 'array' },
        globalRateLimitEnabled: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['service-mesh', 'rate-limiting', args.serviceMeshType]
}));

export const executeTrafficMigrationTask = defineTask('execute-traffic-migration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute Traffic Migration: ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Platform Migration Specialist',
      task: 'Execute progressive traffic migration to service mesh',
      context: args,
      instructions: [
        'For progressive migration:',
        '  - Phase 1: Migrate 10% of services (non-critical)',
        '  - Monitor metrics and errors',
        '  - Phase 2: Migrate 30% of services',
        '  - Monitor metrics and errors',
        '  - Phase 3: Migrate 60% of services',
        '  - Monitor metrics and errors',
        '  - Phase 4: Migrate remaining 100% of services',
        'For all-at-once migration:',
        '  - Migrate all services simultaneously',
        '  - Have rollback plan ready',
        'Monitor key metrics during migration:',
        '  - Request latency (p50, p95, p99)',
        '  - Error rate',
        '  - Success rate',
        '  - CPU and memory usage',
        'Validate traffic is flowing through mesh',
        'Check mTLS is working',
        'Verify observability data is being collected',
        'Document migration status and any issues'
      ],
      outputFormat: 'JSON with success, status, servicesMigrated, currentTrafficPercentage, issues, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'status', 'servicesMigrated', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        status: { type: 'string', enum: ['in-progress', 'completed', 'rolled-back'] },
        servicesMigrated: { type: 'number' },
        currentTrafficPercentage: { type: 'number' },
        phases: { type: 'array' },
        issues: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['service-mesh', 'migration', args.serviceMeshType]
}));

export const validateServiceMeshTask = defineTask('validate-service-mesh', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate Service Mesh: ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'QA Engineer specialized in service mesh validation',
      task: 'Validate service mesh functionality and performance',
      context: args,
      instructions: [
        'Test control plane health',
        'Validate sidecar injection is working',
        'Test mTLS connectivity between services',
        'Validate traffic routing rules',
        'Test circuit breaker behavior',
        'Test retry policies',
        'Test timeout policies',
        'Validate observability data collection',
        'Test ingress gateway functionality',
        'Test egress gateway and external service access',
        'Measure latency overhead introduced by mesh',
        'Measure CPU/memory overhead of sidecars',
        'Run conformance tests',
        'Generate validation report with test results'
      ],
      outputFormat: 'JSON with success, validationScore, testsPassed, failedTests, testsTotal, issues, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'validationScore', 'testsPassed', 'failedTests', 'testsTotal', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        validationScore: { type: 'number', minimum: 0, maximum: 100 },
        testsPassed: { type: 'number' },
        failedTests: { type: 'number' },
        testsTotal: { type: 'number' },
        testResults: { type: 'object' },
        performanceOverhead: { type: 'object' },
        issues: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['service-mesh', 'validation', args.serviceMeshType]
}));

export const generateServiceMeshDocumentationTask = defineTask('generate-service-mesh-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Documentation: ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Writer specialized in service mesh documentation',
      task: 'Generate comprehensive service mesh documentation',
      context: args,
      instructions: [
        'Create architecture documentation:',
        '  - Service mesh topology diagram',
        '  - Control plane and data plane architecture',
        '  - Traffic flow diagrams',
        'Document operational procedures:',
        '  - Adding new services to mesh',
        '  - Updating traffic policies',
        '  - Certificate rotation',
        '  - Troubleshooting common issues',
        'Create runbooks:',
        '  - Control plane failure',
        '  - Sidecar proxy issues',
        '  - mTLS certificate problems',
        '  - Traffic routing issues',
        '  - Performance degradation',
        'Document monitoring and alerting:',
        '  - Key metrics to monitor',
        '  - Grafana dashboard usage',
        '  - Alert definitions',
        'Create developer guide:',
        '  - How to onboard services',
        '  - How to configure traffic policies',
        '  - How to debug mesh issues',
        'Generate reference documentation',
        'Format as professional Markdown'
      ],
      outputFormat: 'JSON with success, operationalGuidePath, architecturePath, runbooksPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'operationalGuidePath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        operationalGuidePath: { type: 'string' },
        architecturePath: { type: 'string' },
        runbooksPath: { type: 'string' },
        developerGuidePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['service-mesh', 'documentation', args.serviceMeshType]
}));
