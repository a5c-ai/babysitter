/**
 * @process specializations/software-architecture/api-design-specification
 * @description API Design and Specification - Comprehensive API design process covering REST/GraphQL/gRPC APIs,
 * including specification, documentation, contract definition, design patterns, security, versioning, and developer experience
 * with industry best practices and quality gates.
 * @inputs { projectName: string, apiType?: string, apiPurpose?: string, targetAudience?: string, constraints?: object }
 * @outputs { success: boolean, apiSpecification: object, documentation: object, contracts: array, implementationPlan: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/software-architecture/api-design-specification', {
 *   projectName: 'E-Commerce Platform API',
 *   apiType: 'REST',
 *   apiPurpose: 'Public API for third-party integrations',
 *   targetAudience: 'external-developers',
 *   constraints: {
 *     latency: '< 200ms p95',
 *     authentication: 'OAuth2',
 *     rateLimit: '1000 req/min',
 *     versioning: 'URL-based'
 *   }
 * });
 *
 * @references
 * - REST API Best Practices: https://restfulapi.net/
 * - OpenAPI Specification: https://swagger.io/specification/
 * - GraphQL Spec: https://spec.graphql.org/
 * - API Design Patterns: https://microservice-api-patterns.org/
 * - Google API Design Guide: https://cloud.google.com/apis/design
 * - Microsoft REST API Guidelines: https://github.com/microsoft/api-guidelines
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    apiType = 'REST', // 'REST', 'GraphQL', 'gRPC', 'WebSocket', 'Hybrid'
    apiPurpose = 'General API',
    targetAudience = 'internal', // 'internal', 'external-developers', 'public', 'partners'
    constraints = {
      latency: '< 200ms p95',
      authentication: 'OAuth2',
      rateLimit: '1000 req/min',
      versioning: 'URL-based',
      compatibility: 'backward-compatible'
    },
    domainContext = {},
    existingAPIs = [],
    outputDir = 'api-design-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let apiSpecification = {};
  let documentation = {};
  let contracts = [];
  let implementationPlan = {};

  ctx.log('info', `Starting API Design and Specification for ${projectName}`);
  ctx.log('info', `API Type: ${apiType}, Target Audience: ${targetAudience}`);

  // ============================================================================
  // PHASE 1: REQUIREMENTS ANALYSIS AND DOMAIN MODELING
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing requirements and modeling domain');

  const requirementsAnalysis = await ctx.task(requirementsAnalysisTask, {
    projectName,
    apiType,
    apiPurpose,
    targetAudience,
    domainContext,
    existingAPIs,
    constraints,
    outputDir
  });

  if (!requirementsAnalysis.success) {
    return {
      success: false,
      error: 'Failed to complete requirements analysis',
      details: requirementsAnalysis,
      metadata: {
        processId: 'specializations/software-architecture/api-design-specification',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...requirementsAnalysis.artifacts);

  // Quality Gate: Core requirements identified
  const requiredCategories = ['functional', 'non-functional', 'security', 'scalability'];
  const missingCategories = requiredCategories.filter(
    cat => !requirementsAnalysis.requirementCategories[cat] ||
           requirementsAnalysis.requirementCategories[cat].length === 0
  );

  if (missingCategories.length > 0) {
    await ctx.breakpoint({
      question: `Requirements analysis incomplete. Missing: ${missingCategories.join(', ')}. Review and supplement requirements?`,
      title: 'Requirements Completeness Check',
      context: {
        runId: ctx.runId,
        missingCategories,
        identifiedRequirements: requirementsAnalysis.requirementCategories,
        recommendation: 'Ensure all core requirement categories are addressed',
        files: requirementsAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 2: API ARCHITECTURE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing API architecture and selecting patterns');

  const architectureDesign = await ctx.task(apiArchitectureDesignTask, {
    projectName,
    apiType,
    requirementsAnalysis,
    constraints,
    targetAudience,
    outputDir
  });

  artifacts.push(...architectureDesign.artifacts);

  // Breakpoint: Review architecture design
  await ctx.breakpoint({
    question: `Review API architecture for ${projectName}. Architecture pattern: ${architectureDesign.architecturePattern}. Approve to proceed with detailed design?`,
    title: 'API Architecture Review',
    context: {
      runId: ctx.runId,
      projectName,
      architecture: architectureDesign,
      patterns: architectureDesign.designPatterns,
      files: [{
        path: architectureDesign.architectureDiagramPath,
        format: 'markdown',
        label: 'Architecture Diagram'
      }, {
        path: architectureDesign.architectureDocPath,
        format: 'markdown',
        label: 'Architecture Documentation'
      }]
    }
  });

  // ============================================================================
  // PHASE 3: RESOURCE MODELING AND DATA DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 3: Modeling resources and designing data structures');

  const resourceModeling = await ctx.task(resourceModelingTask, {
    projectName,
    apiType,
    requirementsAnalysis,
    architectureDesign,
    domainContext,
    outputDir
  });

  artifacts.push(...resourceModeling.artifacts);

  // Quality Gate: Resource model completeness
  const resourceCount = resourceModeling.resources.length;
  if (resourceCount === 0) {
    return {
      success: false,
      error: 'No resources identified in resource modeling phase',
      phase: 'resource-modeling',
      details: resourceModeling
    };
  }

  // ============================================================================
  // PHASE 4: ENDPOINT DESIGN (PARALLEL)
  // ============================================================================

  ctx.log('info', 'Phase 4: Designing API endpoints in parallel by resource category');

  // Group resources by category for parallel design
  const resourceCategories = {
    core: resourceModeling.resources.filter(r => r.priority === 'critical' || r.priority === 'high'),
    supporting: resourceModeling.resources.filter(r => r.priority === 'medium'),
    auxiliary: resourceModeling.resources.filter(r => r.priority === 'low')
  };

  const endpointDesignTasks = Object.entries(resourceCategories)
    .filter(([_, resources]) => resources.length > 0)
    .map(([category, resources]) =>
      () => ctx.task(endpointDesignTask, {
        projectName,
        category,
        resources,
        apiType,
        architectureDesign,
        constraints,
        outputDir
      })
    );

  const endpointDesigns = await ctx.parallel.all(endpointDesignTasks);

  artifacts.push(...endpointDesigns.flatMap(d => d.artifacts));

  const totalEndpoints = endpointDesigns.reduce((sum, d) => sum + d.endpointCount, 0);
  ctx.log('info', `Total endpoints designed: ${totalEndpoints}`);

  // ============================================================================
  // PHASE 5: REQUEST/RESPONSE SCHEMA DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 5: Designing request and response schemas');

  const schemaDesign = await ctx.task(schemaDesignTask, {
    projectName,
    apiType,
    endpointDesigns,
    resourceModeling,
    architectureDesign,
    outputDir
  });

  artifacts.push(...schemaDesign.artifacts);

  // ============================================================================
  // PHASE 6: ERROR HANDLING AND STATUS CODE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 6: Designing error handling and status code strategy');

  const errorHandlingDesign = await ctx.task(errorHandlingDesignTask, {
    projectName,
    apiType,
    endpointDesigns,
    architectureDesign,
    outputDir
  });

  artifacts.push(...errorHandlingDesign.artifacts);

  // ============================================================================
  // PHASE 7: AUTHENTICATION AND AUTHORIZATION DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 7: Designing authentication and authorization mechanisms');

  const authDesign = await ctx.task(authenticationAuthorizationDesignTask, {
    projectName,
    apiType,
    targetAudience,
    constraints,
    endpointDesigns,
    architectureDesign,
    outputDir
  });

  artifacts.push(...authDesign.artifacts);

  // Quality Gate: Security review
  if (targetAudience !== 'internal' && authDesign.securityScore < 80) {
    await ctx.breakpoint({
      question: `Security score: ${authDesign.securityScore}/100 for ${targetAudience} API. Below recommended threshold of 80. Review and strengthen security measures?`,
      title: 'Security Quality Gate',
      context: {
        runId: ctx.runId,
        securityScore: authDesign.securityScore,
        targetAudience,
        vulnerabilities: authDesign.securityGaps,
        recommendations: authDesign.securityRecommendations,
        files: authDesign.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 8: RATE LIMITING AND THROTTLING DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 8: Designing rate limiting and throttling strategies');

  const rateLimitingDesign = await ctx.task(rateLimitingDesignTask, {
    projectName,
    apiType,
    targetAudience,
    constraints,
    endpointDesigns,
    outputDir
  });

  artifacts.push(...rateLimitingDesign.artifacts);

  // ============================================================================
  // PHASE 9: VERSIONING AND EVOLUTION STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 9: Designing API versioning and evolution strategy');

  const versioningStrategy = await ctx.task(versioningStrategyTask, {
    projectName,
    apiType,
    constraints,
    existingAPIs,
    architectureDesign,
    outputDir
  });

  artifacts.push(...versioningStrategy.artifacts);

  // ============================================================================
  // PHASE 10: OPENAPI/GRAPHQL SCHEMA SPECIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Generating formal API specification');

  const formalSpecification = await ctx.task(formalSpecificationTask, {
    projectName,
    apiType,
    architectureDesign,
    endpointDesigns,
    schemaDesign,
    errorHandlingDesign,
    authDesign,
    rateLimitingDesign,
    versioningStrategy,
    outputDir
  });

  artifacts.push(...formalSpecification.artifacts);

  apiSpecification = formalSpecification.specification;

  // Quality Gate: Specification validation
  if (!formalSpecification.validationPassed) {
    await ctx.breakpoint({
      question: `API specification validation failed with ${formalSpecification.validationErrors.length} errors. Review and fix validation issues?`,
      title: 'Specification Validation',
      context: {
        runId: ctx.runId,
        validationErrors: formalSpecification.validationErrors,
        validationWarnings: formalSpecification.validationWarnings,
        specificationPath: formalSpecification.specificationPath,
        files: formalSpecification.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 11: API DOCUMENTATION GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 11: Generating comprehensive API documentation');

  const apiDocumentation = await ctx.task(apiDocumentationTask, {
    projectName,
    apiType,
    targetAudience,
    formalSpecification,
    architectureDesign,
    endpointDesigns,
    authDesign,
    errorHandlingDesign,
    outputDir
  });

  artifacts.push(...apiDocumentation.artifacts);

  documentation = apiDocumentation.documentation;

  // ============================================================================
  // PHASE 12: API CONTRACT TESTING DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 12: Designing API contract testing strategy');

  const contractTestingDesign = await ctx.task(contractTestingDesignTask, {
    projectName,
    apiType,
    formalSpecification,
    endpointDesigns,
    schemaDesign,
    outputDir
  });

  artifacts.push(...contractTestingDesign.artifacts);

  contracts = contractTestingDesign.contracts;

  // ============================================================================
  // PHASE 13: SDK AND CLIENT LIBRARY DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 13: Designing SDK and client library strategy');

  const sdkDesign = await ctx.task(sdkDesignTask, {
    projectName,
    apiType,
    targetAudience,
    formalSpecification,
    endpointDesigns,
    authDesign,
    outputDir
  });

  artifacts.push(...sdkDesign.artifacts);

  // ============================================================================
  // PHASE 14: DEVELOPER EXPERIENCE OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 14: Optimizing developer experience');

  const dxOptimization = await ctx.task(developerExperienceTask, {
    projectName,
    apiType,
    targetAudience,
    apiDocumentation,
    sdkDesign,
    formalSpecification,
    outputDir
  });

  artifacts.push(...dxOptimization.artifacts);

  // ============================================================================
  // PHASE 15: PERFORMANCE AND CACHING DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 15: Designing performance optimization and caching strategy');

  const performanceDesign = await ctx.task(performanceDesignTask, {
    projectName,
    apiType,
    constraints,
    endpointDesigns,
    architectureDesign,
    outputDir
  });

  artifacts.push(...performanceDesign.artifacts);

  // Quality Gate: Performance requirements
  const performanceMet = performanceDesign.estimatedP95Latency <= parseInt(constraints.latency);
  if (!performanceMet) {
    await ctx.breakpoint({
      question: `Estimated p95 latency: ${performanceDesign.estimatedP95Latency}ms exceeds target: ${constraints.latency}. Review performance design and optimization strategies?`,
      title: 'Performance Quality Gate',
      context: {
        runId: ctx.runId,
        estimatedLatency: performanceDesign.estimatedP95Latency,
        targetLatency: constraints.latency,
        bottlenecks: performanceDesign.bottlenecks,
        optimizations: performanceDesign.optimizationStrategies,
        files: performanceDesign.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 16: MONITORING AND OBSERVABILITY DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 16: Designing monitoring and observability strategy');

  const monitoringDesign = await ctx.task(monitoringObservabilityTask, {
    projectName,
    apiType,
    endpointDesigns,
    performanceDesign,
    constraints,
    outputDir
  });

  artifacts.push(...monitoringDesign.artifacts);

  // ============================================================================
  // PHASE 17: MIGRATION AND BACKWARD COMPATIBILITY DESIGN
  // ============================================================================

  let migrationStrategy = null;
  if (existingAPIs.length > 0) {
    ctx.log('info', 'Phase 17: Designing migration and backward compatibility strategy');

    migrationStrategy = await ctx.task(migrationStrategyTask, {
      projectName,
      existingAPIs,
      formalSpecification,
      versioningStrategy,
      outputDir
    });

    artifacts.push(...migrationStrategy.artifacts);
  }

  // ============================================================================
  // PHASE 18: IMPLEMENTATION ROADMAP
  // ============================================================================

  ctx.log('info', 'Phase 18: Creating implementation roadmap');

  const implementationRoadmap = await ctx.task(implementationRoadmapTask, {
    projectName,
    apiType,
    architectureDesign,
    endpointDesigns,
    formalSpecification,
    sdkDesign,
    performanceDesign,
    monitoringDesign,
    migrationStrategy,
    constraints,
    outputDir
  });

  artifacts.push(...implementationRoadmap.artifacts);

  implementationPlan = implementationRoadmap.roadmap;

  // ============================================================================
  // PHASE 19: DESIGN REVIEW AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 19: Conducting comprehensive design review');

  const designReview = await ctx.task(designReviewTask, {
    projectName,
    apiType,
    targetAudience,
    requirementsAnalysis,
    architectureDesign,
    formalSpecification,
    apiDocumentation,
    performanceDesign,
    authDesign,
    implementationRoadmap,
    constraints,
    outputDir
  });

  artifacts.push(...designReview.artifacts);

  const designQualityScore = designReview.qualityScore;

  // Quality Gate: Overall design quality
  if (designQualityScore < 75) {
    await ctx.breakpoint({
      question: `Design quality score: ${designQualityScore}/100. Below recommended threshold of 75. Review and address design issues?`,
      title: 'Design Quality Gate',
      context: {
        runId: ctx.runId,
        qualityScore: designQualityScore,
        issues: designReview.issues,
        recommendations: designReview.recommendations,
        verdict: designReview.verdict,
        files: designReview.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 20: STAKEHOLDER APPROVAL
  // ============================================================================

  // Final Breakpoint: API Design Approval
  await ctx.breakpoint({
    question: `API Design and Specification complete for ${projectName}. Quality Score: ${designQualityScore}/100, Total Endpoints: ${totalEndpoints}, API Type: ${apiType}. Approve design for implementation?`,
    title: 'Final API Design Review and Approval',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        apiType,
        targetAudience,
        totalEndpoints,
        totalResources: resourceModeling.resources.length,
        qualityScore: designQualityScore,
        securityScore: authDesign.securityScore,
        estimatedLatency: performanceDesign.estimatedP95Latency,
        implementationTimeline: implementationRoadmap.timeline.totalDuration,
        estimatedCost: implementationRoadmap.cost.total
      },
      verdict: designReview.verdict,
      readinessAssessment: designReview.readinessAssessment,
      recommendation: designReview.recommendation,
      files: [
        { path: formalSpecification.specificationPath, format: apiType === 'GraphQL' ? 'graphql' : 'yaml', label: 'API Specification' },
        { path: apiDocumentation.documentationPath, format: 'html', label: 'API Documentation' },
        { path: architectureDesign.architectureDiagramPath, format: 'markdown', label: 'Architecture Diagram' },
        { path: implementationRoadmap.roadmapPath, format: 'markdown', label: 'Implementation Roadmap' },
        { path: designReview.reviewReportPath, format: 'markdown', label: 'Design Review Report' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    apiType,
    targetAudience,
    apiSpecification: {
      specificationPath: formalSpecification.specificationPath,
      format: formalSpecification.format,
      version: formalSpecification.version,
      endpointCount: totalEndpoints,
      resourceCount: resourceModeling.resources.length,
      validationPassed: formalSpecification.validationPassed
    },
    documentation: {
      documentationPath: apiDocumentation.documentationPath,
      interactiveDocsPath: apiDocumentation.interactiveDocsPath,
      gettingStartedPath: apiDocumentation.gettingStartedPath,
      referenceDocsPath: apiDocumentation.referenceDocsPath,
      examplesPath: apiDocumentation.examplesPath
    },
    contracts: {
      contractCount: contracts.length,
      contractsPath: contractTestingDesign.contractsPath,
      testStrategy: contractTestingDesign.testStrategy
    },
    architecture: {
      pattern: architectureDesign.architecturePattern,
      designPatterns: architectureDesign.designPatterns,
      diagramPath: architectureDesign.architectureDiagramPath,
      documentationPath: architectureDesign.architectureDocPath
    },
    security: {
      authenticationMechanism: authDesign.authenticationMechanism,
      authorizationModel: authDesign.authorizationModel,
      securityScore: authDesign.securityScore,
      securityFeaturesPath: authDesign.securityDocPath
    },
    performance: {
      estimatedP95Latency: performanceDesign.estimatedP95Latency,
      cachingStrategy: performanceDesign.cachingStrategy,
      optimizations: performanceDesign.optimizationStrategies,
      performanceMet
    },
    versioning: {
      strategy: versioningStrategy.versioningStrategy,
      initialVersion: versioningStrategy.initialVersion,
      deprecationPolicy: versioningStrategy.deprecationPolicy
    },
    sdk: {
      targetLanguages: sdkDesign.targetLanguages,
      generationStrategy: sdkDesign.generationStrategy,
      sdkDesignPath: sdkDesign.sdkDesignDocPath
    },
    developerExperience: {
      dxScore: dxOptimization.dxScore,
      onboardingTime: dxOptimization.estimatedOnboardingTime,
      improvementAreas: dxOptimization.improvementAreas
    },
    monitoring: {
      metricsStrategy: monitoringDesign.metricsStrategy,
      observabilityTools: monitoringDesign.tools,
      alertingRules: monitoringDesign.alertingRules.length
    },
    implementationPlan: {
      timeline: implementationRoadmap.timeline,
      cost: implementationRoadmap.cost,
      phases: implementationRoadmap.phases,
      roadmapPath: implementationRoadmap.roadmapPath
    },
    migration: migrationStrategy ? {
      required: true,
      strategy: migrationStrategy.migrationStrategy,
      timeline: migrationStrategy.timeline,
      risks: migrationStrategy.risks
    } : { required: false },
    designReview: {
      qualityScore: designQualityScore,
      verdict: designReview.verdict,
      readinessAssessment: designReview.readinessAssessment,
      issues: designReview.issues,
      recommendations: designReview.recommendations,
      reviewReportPath: designReview.reviewReportPath
    },
    qualityGates: {
      requirementsComplete: missingCategories.length === 0,
      specificationValid: formalSpecification.validationPassed,
      securityAdequate: authDesign.securityScore >= (targetAudience === 'internal' ? 70 : 80),
      performanceMet,
      designQualityMet: designQualityScore >= 75
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/software-architecture/api-design-specification',
      timestamp: startTime,
      apiType,
      targetAudience,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Requirements Analysis and Domain Modeling
export const requirementsAnalysisTask = defineTask('requirements-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Requirements Analysis and Domain Modeling - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'API Requirements Analyst and Domain Modeling Expert',
      task: 'Analyze API requirements and create comprehensive domain model',
      context: {
        projectName: args.projectName,
        apiType: args.apiType,
        apiPurpose: args.apiPurpose,
        targetAudience: args.targetAudience,
        domainContext: args.domainContext,
        existingAPIs: args.existingAPIs,
        constraints: args.constraints,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify functional requirements (what the API must do)',
        '2. Identify non-functional requirements (performance, scalability, availability)',
        '3. Define security requirements based on target audience',
        '4. Identify integration requirements with existing systems',
        '5. Model domain entities and relationships',
        '6. Define business capabilities and use cases',
        '7. Identify data requirements and constraints',
        '8. Document stakeholder needs and expectations',
        '9. Prioritize requirements (critical, high, medium, low)',
        '10. Identify potential conflicts or ambiguities',
        '11. Create domain model diagram',
        '12. Return categorized requirements and domain model'
      ],
      outputFormat: 'JSON object with requirements analysis and domain model'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'requirementCategories', 'domainModel', 'useCases', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        requirementCategories: {
          type: 'object',
          properties: {
            functional: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  description: { type: 'string' },
                  priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
                  category: { type: 'string' }
                }
              }
            },
            nonFunctional: { type: 'array' },
            security: { type: 'array' },
            scalability: { type: 'array' },
            integration: { type: 'array' }
          }
        },
        domainModel: {
          type: 'object',
          properties: {
            entities: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  attributes: { type: 'array' },
                  relationships: { type: 'array' }
                }
              }
            },
            relationships: { type: 'array' },
            businessCapabilities: { type: 'array' },
            domainDiagram: { type: 'string' }
          }
        },
        useCases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              actor: { type: 'string' },
              description: { type: 'string' },
              steps: { type: 'array' },
              priority: { type: 'string' }
            }
          }
        },
        stakeholders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string' },
              needs: { type: 'array' },
              concerns: { type: 'array' }
            }
          }
        },
        constraintsAnalysis: {
          type: 'object',
          properties: {
            technical: { type: 'array' },
            business: { type: 'array' },
            regulatory: { type: 'array' }
          }
        },
        totalRequirements: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'api-design', 'requirements', 'domain-modeling']
}));

// Phase 2: API Architecture Design
export const apiArchitectureDesignTask = defineTask('api-architecture-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: API Architecture Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'API Architect specializing in modern API architecture patterns',
      task: 'Design comprehensive API architecture with appropriate patterns and structure',
      context: {
        projectName: args.projectName,
        apiType: args.apiType,
        requirementsAnalysis: args.requirementsAnalysis,
        constraints: args.constraints,
        targetAudience: args.targetAudience,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Select appropriate architecture pattern (RESTful, Resource-oriented, RPC-style, etc.)',
        '2. Design API layer structure (presentation, business logic, data access)',
        '3. Define design patterns (Factory, Repository, Strategy, etc.)',
        '4. Design API gateway and routing strategy',
        '5. Plan for scalability (horizontal scaling, load balancing)',
        '6. Design for resilience (circuit breakers, retries, fallbacks)',
        '7. Plan microservices decomposition if applicable',
        '8. Define service boundaries and responsibilities',
        '9. Design inter-service communication patterns',
        '10. Create architecture diagram (C4 model or similar)',
        '11. Document architecture decisions and rationale',
        '12. Return comprehensive architecture design'
      ],
      outputFormat: 'JSON object with API architecture design'
    },
    outputSchema: {
      type: 'object',
      required: ['architecturePattern', 'designPatterns', 'components', 'artifacts'],
      properties: {
        architecturePattern: {
          type: 'string',
          enum: ['RESTful', 'Resource-Oriented', 'GraphQL', 'gRPC', 'Event-Driven', 'Hybrid']
        },
        designPatterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              purpose: { type: 'string' },
              application: { type: 'string' }
            }
          }
        },
        components: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              responsibility: { type: 'string' },
              interfaces: { type: 'array' }
            }
          }
        },
        layerArchitecture: {
          type: 'object',
          properties: {
            presentation: { type: 'object' },
            business: { type: 'object' },
            dataAccess: { type: 'object' },
            integration: { type: 'object' }
          }
        },
        scalabilityDesign: {
          type: 'object',
          properties: {
            horizontalScaling: { type: 'string' },
            loadBalancing: { type: 'string' },
            caching: { type: 'string' },
            statelessness: { type: 'string' }
          }
        },
        resilienceDesign: {
          type: 'object',
          properties: {
            circuitBreaker: { type: 'string' },
            retryPolicy: { type: 'string' },
            fallbackStrategy: { type: 'string' },
            timeouts: { type: 'object' }
          }
        },
        architectureDiagramPath: { type: 'string' },
        architectureDocPath: { type: 'string' },
        decisionLog: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              decision: { type: 'string' },
              rationale: { type: 'string' },
              alternatives: { type: 'array' },
              tradeoffs: { type: 'string' }
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
  labels: ['agent', 'api-design', 'architecture', 'patterns']
}));

// Phase 3: Resource Modeling
export const resourceModelingTask = defineTask('resource-modeling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Resource Modeling and Data Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'API Resource Modeling Expert',
      task: 'Model API resources based on domain model and requirements',
      context: {
        projectName: args.projectName,
        apiType: args.apiType,
        requirementsAnalysis: args.requirementsAnalysis,
        architectureDesign: args.architectureDesign,
        domainContext: args.domainContext,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify primary resources from domain entities',
        '2. Define resource hierarchies and relationships',
        '3. Design resource representations (fields, data types)',
        '4. Define resource identifiers and URI patterns',
        '5. Model resource relationships (one-to-many, many-to-many)',
        '6. Design sub-resources and nested resources',
        '7. Define resource collections and pagination',
        '8. Design filtering, sorting, and search capabilities',
        '9. Model resource lifecycle (CRUD operations)',
        '10. Identify business operations beyond CRUD',
        '11. Define resource metadata and hypermedia links',
        '12. Return comprehensive resource model'
      ],
      outputFormat: 'JSON object with resource models'
    },
    outputSchema: {
      type: 'object',
      required: ['resources', 'resourceHierarchy', 'artifacts'],
      properties: {
        resources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              uriPattern: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              attributes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    type: { type: 'string' },
                    required: { type: 'boolean' },
                    validation: { type: 'object' }
                  }
                }
              },
              relationships: { type: 'array' },
              operations: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['create', 'read', 'update', 'delete', 'list', 'search', 'custom']
                }
              },
              subResources: { type: 'array' }
            }
          }
        },
        resourceHierarchy: {
          type: 'object',
          description: 'Hierarchical structure of resources'
        },
        resourceRelationships: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              from: { type: 'string' },
              to: { type: 'string' },
              type: { type: 'string', enum: ['one-to-one', 'one-to-many', 'many-to-many'] },
              description: { type: 'string' }
            }
          }
        },
        collectionDesign: {
          type: 'object',
          properties: {
            paginationStrategy: { type: 'string' },
            defaultPageSize: { type: 'number' },
            maxPageSize: { type: 'number' },
            sortingFields: { type: 'array' },
            filteringCapabilities: { type: 'array' }
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
  labels: ['agent', 'api-design', 'resources', 'data-modeling']
}));

// Phase 4: Endpoint Design (per category)
export const endpointDesignTask = defineTask('endpoint-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Endpoint Design - ${args.category} - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'API Endpoint Design Specialist',
      task: `Design detailed API endpoints for ${args.category} resources`,
      context: {
        projectName: args.projectName,
        category: args.category,
        resources: args.resources,
        apiType: args.apiType,
        architectureDesign: args.architectureDesign,
        constraints: args.constraints,
        outputDir: args.outputDir
      },
      instructions: [
        `1. Design endpoints for all ${args.category} resources`,
        '2. Define HTTP methods (GET, POST, PUT, PATCH, DELETE) or GraphQL queries/mutations',
        '3. Design URI structure following REST best practices',
        '4. Define path parameters, query parameters, headers',
        '5. Design request payload structures',
        '6. Design response payload structures',
        '7. Define HTTP status codes for each endpoint',
        '8. Design pagination for list endpoints',
        '9. Design filtering and sorting capabilities',
        '10. Define idempotency requirements',
        '11. Design batch operations if needed',
        '12. Return comprehensive endpoint specifications'
      ],
      outputFormat: 'JSON object with endpoint designs'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'category', 'endpointCount', 'endpoints', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        category: { type: 'string' },
        endpointCount: { type: 'number' },
        endpoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              resource: { type: 'string' },
              operation: { type: 'string' },
              method: { type: 'string' },
              path: { type: 'string' },
              summary: { type: 'string' },
              description: { type: 'string' },
              parameters: {
                type: 'object',
                properties: {
                  path: { type: 'array' },
                  query: { type: 'array' },
                  header: { type: 'array' }
                }
              },
              requestBody: { type: 'object' },
              responses: { type: 'object' },
              authentication: { type: 'boolean' },
              authorization: { type: 'array' },
              rateLimit: { type: 'string' },
              idempotent: { type: 'boolean' }
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
  labels: ['agent', 'api-design', 'endpoints', args.category]
}));

// Phase 5: Schema Design
export const schemaDesignTask = defineTask('schema-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Request/Response Schema Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'API Schema Design Expert',
      task: 'Design comprehensive request and response schemas',
      context: {
        projectName: args.projectName,
        apiType: args.apiType,
        endpointDesigns: args.endpointDesigns,
        resourceModeling: args.resourceModeling,
        architectureDesign: args.architectureDesign,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define JSON schemas for all request bodies',
        '2. Define JSON schemas for all response bodies',
        '3. Create reusable schema components',
        '4. Define data types, formats, and constraints',
        '5. Design validation rules (required, min/max, regex)',
        '6. Define enum values and allowed values',
        '7. Design nested objects and array structures',
        '8. Define common patterns (timestamps, pagination, metadata)',
        '9. Design error response schemas',
        '10. Ensure schema consistency across endpoints',
        '11. Add JSON Schema $refs for reusability',
        '12. Return comprehensive schema definitions'
      ],
      outputFormat: 'JSON object with schema definitions'
    },
    outputSchema: {
      type: 'object',
      required: ['requestSchemas', 'responseSchemas', 'commonSchemas', 'artifacts'],
      properties: {
        requestSchemas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              endpoint: { type: 'string' },
              method: { type: 'string' },
              schema: { type: 'object' },
              examples: { type: 'array' }
            }
          }
        },
        responseSchemas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              endpoint: { type: 'string' },
              statusCode: { type: 'number' },
              schema: { type: 'object' },
              examples: { type: 'array' }
            }
          }
        },
        commonSchemas: {
          type: 'object',
          description: 'Reusable schema components'
        },
        validationRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              field: { type: 'string' },
              rule: { type: 'string' },
              message: { type: 'string' }
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
  labels: ['agent', 'api-design', 'schemas', 'validation']
}));

// Phase 6: Error Handling Design
export const errorHandlingDesignTask = defineTask('error-handling-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Error Handling Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'API Error Handling Specialist',
      task: 'Design comprehensive error handling and status code strategy',
      context: {
        projectName: args.projectName,
        apiType: args.apiType,
        endpointDesigns: args.endpointDesigns,
        architectureDesign: args.architectureDesign,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design error response format (RFC 7807 Problem Details or custom)',
        '2. Define error codes and categories',
        '3. Map HTTP status codes to error scenarios',
        '4. Design error messages (user-friendly and developer-friendly)',
        '5. Define error context and additional details',
        '6. Design validation error responses',
        '7. Design authentication/authorization error responses',
        '8. Design rate limiting error responses',
        '9. Design server error responses (5xx)',
        '10. Create error handling best practices guide',
        '11. Define error logging and monitoring strategy',
        '12. Return comprehensive error handling design'
      ],
      outputFormat: 'JSON object with error handling design'
    },
    outputSchema: {
      type: 'object',
      required: ['errorFormat', 'errorCodes', 'statusCodeMapping', 'artifacts'],
      properties: {
        errorFormat: {
          type: 'object',
          properties: {
            standard: { type: 'string', enum: ['RFC7807', 'Custom', 'JSON:API'] },
            structure: { type: 'object' },
            example: { type: 'object' }
          }
        },
        errorCodes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              httpStatus: { type: 'number' },
              category: { type: 'string' },
              message: { type: 'string' },
              description: { type: 'string' },
              resolution: { type: 'string' }
            }
          }
        },
        statusCodeMapping: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              scenarios: { type: 'array' },
              examples: { type: 'array' }
            }
          }
        },
        validationErrors: {
          type: 'object',
          properties: {
            format: { type: 'object' },
            fieldErrorStructure: { type: 'object' },
            examples: { type: 'array' }
          }
        },
        errorHandlingBestPractices: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'api-design', 'error-handling', 'status-codes']
}));

// Phase 7: Authentication and Authorization Design
export const authenticationAuthorizationDesignTask = defineTask('authentication-authorization-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Authentication and Authorization Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'API Security Architect specializing in authentication and authorization',
      task: 'Design comprehensive authentication and authorization mechanisms',
      context: {
        projectName: args.projectName,
        apiType: args.apiType,
        targetAudience: args.targetAudience,
        constraints: args.constraints,
        endpointDesigns: args.endpointDesigns,
        architectureDesign: args.architectureDesign,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design authentication mechanism (OAuth2, JWT, API Keys, etc.)',
        '2. Design authorization model (RBAC, ABAC, ACL)',
        '3. Define user roles and permissions',
        '4. Design token management (generation, refresh, revocation)',
        '5. Design authentication flow for different client types',
        '6. Define endpoint-level authorization rules',
        '7. Design API key management for external developers',
        '8. Design security headers and CORS policy',
        '9. Design session management strategy',
        '10. Plan for MFA/2FA if required',
        '11. Assess security vulnerabilities (OWASP API Security Top 10)',
        '12. Return comprehensive auth design with security score'
      ],
      outputFormat: 'JSON object with authentication and authorization design'
    },
    outputSchema: {
      type: 'object',
      required: ['authenticationMechanism', 'authorizationModel', 'securityScore', 'artifacts'],
      properties: {
        authenticationMechanism: {
          type: 'string',
          enum: ['OAuth2', 'JWT', 'API-Key', 'Basic-Auth', 'SAML', 'OpenID-Connect', 'Mutual-TLS']
        },
        authenticationFlow: {
          type: 'object',
          properties: {
            flow: { type: 'string' },
            description: { type: 'string' },
            diagram: { type: 'string' },
            tokenLifetime: { type: 'string' },
            refreshStrategy: { type: 'string' }
          }
        },
        authorizationModel: {
          type: 'string',
          enum: ['RBAC', 'ABAC', 'ACL', 'ReBAC', 'Hybrid']
        },
        rolesAndPermissions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string' },
              description: { type: 'string' },
              permissions: { type: 'array', items: { type: 'string' } },
              resources: { type: 'array' }
            }
          }
        },
        endpointAuthorization: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              endpoint: { type: 'string' },
              method: { type: 'string' },
              requiredRoles: { type: 'array' },
              requiredPermissions: { type: 'array' }
            }
          }
        },
        securityHeaders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              header: { type: 'string' },
              value: { type: 'string' },
              purpose: { type: 'string' }
            }
          }
        },
        corsPolicy: {
          type: 'object',
          properties: {
            allowedOrigins: { type: 'array' },
            allowedMethods: { type: 'array' },
            allowedHeaders: { type: 'array' },
            maxAge: { type: 'number' }
          }
        },
        securityScore: {
          type: 'number',
          minimum: 0,
          maximum: 100,
          description: 'Security assessment score based on OWASP API Security Top 10'
        },
        securityGaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gap: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              mitigation: { type: 'string' }
            }
          }
        },
        securityRecommendations: { type: 'array', items: { type: 'string' } },
        securityDocPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'api-design', 'security', 'authentication', 'authorization']
}));

// Phase 8: Rate Limiting Design
export const rateLimitingDesignTask = defineTask('rate-limiting-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Rate Limiting and Throttling Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'API Rate Limiting Expert',
      task: 'Design rate limiting and throttling strategies',
      context: {
        projectName: args.projectName,
        apiType: args.apiType,
        targetAudience: args.targetAudience,
        constraints: args.constraints,
        endpointDesigns: args.endpointDesigns,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design rate limiting strategy (fixed window, sliding window, token bucket)',
        '2. Define rate limits per endpoint or globally',
        '3. Design tier-based rate limits (free, premium, enterprise)',
        '4. Define rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining)',
        '5. Design rate limit exceeded responses (429 status)',
        '6. Design quota management for API keys',
        '7. Design burst handling and throttling',
        '8. Plan for rate limit monitoring and alerts',
        '9. Design bypass mechanisms for internal services',
        '10. Create rate limiting documentation for developers',
        '11. Return comprehensive rate limiting design'
      ],
      outputFormat: 'JSON object with rate limiting design'
    },
    outputSchema: {
      type: 'object',
      required: ['rateLimitingStrategy', 'rateLimits', 'artifacts'],
      properties: {
        rateLimitingStrategy: {
          type: 'string',
          enum: ['fixed-window', 'sliding-window', 'token-bucket', 'leaky-bucket']
        },
        rateLimits: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tier: { type: 'string' },
              requestsPerMinute: { type: 'number' },
              requestsPerHour: { type: 'number' },
              requestsPerDay: { type: 'number' },
              burstLimit: { type: 'number' },
              description: { type: 'string' }
            }
          }
        },
        endpointSpecificLimits: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              endpoint: { type: 'string' },
              limit: { type: 'object' },
              reason: { type: 'string' }
            }
          }
        },
        rateLimitHeaders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              header: { type: 'string' },
              description: { type: 'string' },
              example: { type: 'string' }
            }
          }
        },
        throttlingBehavior: {
          type: 'object',
          properties: {
            onLimitExceeded: { type: 'string' },
            retryAfterHeader: { type: 'boolean' },
            queueingStrategy: { type: 'string' }
          }
        },
        quotaManagement: {
          type: 'object',
          properties: {
            resetPeriod: { type: 'string' },
            quotaHeaders: { type: 'array' },
            overagePolicy: { type: 'string' }
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
  labels: ['agent', 'api-design', 'rate-limiting', 'throttling']
}));

// Phase 9: Versioning Strategy
export const versioningStrategyTask = defineTask('versioning-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: API Versioning Strategy - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'API Versioning Strategist',
      task: 'Design API versioning and evolution strategy',
      context: {
        projectName: args.projectName,
        apiType: args.apiType,
        constraints: args.constraints,
        existingAPIs: args.existingAPIs,
        architectureDesign: args.architectureDesign,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Select versioning strategy (URL, Header, Query param, Content negotiation)',
        '2. Define versioning scheme (semantic versioning, date-based)',
        '3. Design version compatibility rules',
        '4. Define deprecation policy and timeline',
        '5. Design sunset headers for deprecated versions',
        '6. Plan for breaking vs non-breaking changes',
        '7. Define version migration guides',
        '8. Design version negotiation mechanism',
        '9. Plan for supporting multiple versions',
        '10. Define end-of-life procedures',
        '11. Create versioning documentation',
        '12. Return comprehensive versioning strategy'
      ],
      outputFormat: 'JSON object with versioning strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['versioningStrategy', 'initialVersion', 'deprecationPolicy', 'artifacts'],
      properties: {
        versioningStrategy: {
          type: 'string',
          enum: ['URL-based', 'Header-based', 'Query-param', 'Content-negotiation', 'Semantic-versioning']
        },
        versioningScheme: {
          type: 'object',
          properties: {
            format: { type: 'string' },
            example: { type: 'string' },
            description: { type: 'string' }
          }
        },
        initialVersion: { type: 'string' },
        compatibilityRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              changeType: { type: 'string' },
              breaking: { type: 'boolean' },
              versionImpact: { type: 'string' }
            }
          }
        },
        deprecationPolicy: {
          type: 'object',
          properties: {
            noticeperiod: { type: 'string' },
            supportDuration: { type: 'string' },
            deprecationHeaders: { type: 'array' },
            communicationPlan: { type: 'string' }
          }
        },
        versionSupport: {
          type: 'object',
          properties: {
            simultaneousVersions: { type: 'number' },
            minimumSupportDuration: { type: 'string' },
            securityPatchPolicy: { type: 'string' }
          }
        },
        migrationGuidance: {
          type: 'object',
          properties: {
            toolingSupport: { type: 'string' },
            migrationDocumentation: { type: 'string' },
            automatedMigration: { type: 'boolean' }
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
  labels: ['agent', 'api-design', 'versioning', 'evolution']
}));

// Phase 10: Formal Specification
export const formalSpecificationTask = defineTask('formal-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Formal API Specification Generation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'API Specification Expert (OpenAPI/GraphQL Schema)',
      task: 'Generate formal API specification in OpenAPI 3.0 or GraphQL Schema format',
      context: {
        projectName: args.projectName,
        apiType: args.apiType,
        architectureDesign: args.architectureDesign,
        endpointDesigns: args.endpointDesigns,
        schemaDesign: args.schemaDesign,
        errorHandlingDesign: args.errorHandlingDesign,
        authDesign: args.authDesign,
        rateLimitingDesign: args.rateLimitingDesign,
        versioningStrategy: args.versioningStrategy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Generate OpenAPI 3.0 specification or GraphQL schema',
        '2. Include all endpoints with complete definitions',
        '3. Define all schemas and data models',
        '4. Include authentication/authorization schemes',
        '5. Add examples for requests and responses',
        '6. Document all parameters and headers',
        '7. Include error responses',
        '8. Add API metadata (title, version, description)',
        '9. Validate specification against standards',
        '10. Generate specification in YAML and JSON formats',
        '11. Return specification with validation results'
      ],
      outputFormat: 'JSON object with formal specification and validation'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'specification', 'format', 'version', 'specificationPath', 'validationPassed', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        specification: { type: 'object', description: 'The complete API specification object' },
        format: { type: 'string', enum: ['OpenAPI-3.0', 'OpenAPI-3.1', 'GraphQL-Schema', 'AsyncAPI'] },
        version: { type: 'string' },
        specificationPath: { type: 'string' },
        yamlPath: { type: 'string' },
        jsonPath: { type: 'string' },
        validationPassed: { type: 'boolean' },
        validationErrors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              message: { type: 'string' },
              severity: { type: 'string' }
            }
          }
        },
        validationWarnings: { type: 'array' },
        specificationStats: {
          type: 'object',
          properties: {
            totalEndpoints: { type: 'number' },
            totalSchemas: { type: 'number' },
            totalExamples: { type: 'number' }
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
  labels: ['agent', 'api-design', 'specification', 'openapi', 'graphql']
}));

// Phase 11: API Documentation
export const apiDocumentationTask = defineTask('api-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: API Documentation Generation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'API Technical Writer and Documentation Expert',
      task: 'Generate comprehensive API documentation for developers',
      context: {
        projectName: args.projectName,
        apiType: args.apiType,
        targetAudience: args.targetAudience,
        formalSpecification: args.formalSpecification,
        architectureDesign: args.architectureDesign,
        endpointDesigns: args.endpointDesigns,
        authDesign: args.authDesign,
        errorHandlingDesign: args.errorHandlingDesign,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Generate interactive API documentation (Swagger UI, Redoc, GraphiQL)',
        '2. Create getting started guide',
        '3. Write authentication guide with examples',
        '4. Document all endpoints with descriptions and examples',
        '5. Create code examples in multiple languages',
        '6. Document error codes and troubleshooting',
        '7. Create rate limiting guide',
        '8. Write best practices and patterns guide',
        '9. Create tutorials for common use cases',
        '10. Generate API reference documentation',
        '11. Create changelog template',
        '12. Return documentation paths and structure'
      ],
      outputFormat: 'JSON object with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'documentationPath', 'interactiveDocsPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        documentation: {
          type: 'object',
          description: 'Documentation metadata and structure'
        },
        documentationPath: { type: 'string', description: 'Main documentation index' },
        interactiveDocsPath: { type: 'string', description: 'Interactive API explorer' },
        gettingStartedPath: { type: 'string' },
        authenticationGuidePath: { type: 'string' },
        referenceDocsPath: { type: 'string' },
        tutorialsPath: { type: 'string' },
        examplesPath: { type: 'string' },
        bestPracticesPath: { type: 'string' },
        troubleshootingPath: { type: 'string' },
        changelogPath: { type: 'string' },
        codeExamples: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              language: { type: 'string' },
              examplePath: { type: 'string' },
              operations: { type: 'array' }
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
  labels: ['agent', 'api-design', 'documentation', 'developer-experience']
}));

// Phase 12: Contract Testing Design
export const contractTestingDesignTask = defineTask('contract-testing-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: API Contract Testing Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'API Contract Testing Specialist',
      task: 'Design contract testing strategy for API',
      context: {
        projectName: args.projectName,
        apiType: args.apiType,
        formalSpecification: args.formalSpecification,
        endpointDesigns: args.endpointDesigns,
        schemaDesign: args.schemaDesign,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design consumer-driven contract tests (Pact, Spring Cloud Contract)',
        '2. Define contract test coverage for all endpoints',
        '3. Design provider verification tests',
        '4. Create contract examples and matchers',
        '5. Design contract versioning strategy',
        '6. Plan for contract breaking change detection',
        '7. Design contract testing CI/CD integration',
        '8. Create contract test templates',
        '9. Design contract broker setup (Pact Broker)',
        '10. Document contract testing workflow',
        '11. Return contract definitions and test strategy'
      ],
      outputFormat: 'JSON object with contract testing design'
    },
    outputSchema: {
      type: 'object',
      required: ['contracts', 'testStrategy', 'contractsPath', 'artifacts'],
      properties: {
        contracts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              consumer: { type: 'string' },
              provider: { type: 'string' },
              endpoint: { type: 'string' },
              interactions: { type: 'array' },
              contractPath: { type: 'string' }
            }
          }
        },
        testStrategy: {
          type: 'object',
          properties: {
            framework: { type: 'string' },
            consumerTests: { type: 'number' },
            providerTests: { type: 'number' },
            cicdIntegration: { type: 'string' }
          }
        },
        contractsPath: { type: 'string' },
        brokerConfiguration: {
          type: 'object',
          properties: {
            brokerType: { type: 'string' },
            url: { type: 'string' },
            versioningStrategy: { type: 'string' }
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
  labels: ['agent', 'api-design', 'contract-testing', 'quality']
}));

// Phase 13: SDK Design
export const sdkDesignTask = defineTask('sdk-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: SDK and Client Library Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SDK Design Expert',
      task: 'Design SDK and client library strategy',
      context: {
        projectName: args.projectName,
        apiType: args.apiType,
        targetAudience: args.targetAudience,
        formalSpecification: args.formalSpecification,
        endpointDesigns: args.endpointDesigns,
        authDesign: args.authDesign,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify target languages for SDKs (JavaScript, Python, Java, etc.)',
        '2. Design SDK architecture and structure',
        '3. Plan SDK code generation strategy (OpenAPI Generator, custom)',
        '4. Design SDK authentication handling',
        '5. Design error handling and retry logic',
        '6. Plan for pagination and collection handling',
        '7. Design SDK configuration and initialization',
        '8. Plan for SDK versioning and updates',
        '9. Design SDK testing strategy',
        '10. Create SDK documentation plan',
        '11. Plan SDK distribution (npm, PyPI, Maven)',
        '12. Return SDK design and implementation plan'
      ],
      outputFormat: 'JSON object with SDK design'
    },
    outputSchema: {
      type: 'object',
      required: ['targetLanguages', 'generationStrategy', 'sdkDesignDocPath', 'artifacts'],
      properties: {
        targetLanguages: {
          type: 'array',
          items: { type: 'string' }
        },
        generationStrategy: {
          type: 'string',
          enum: ['OpenAPI-Generator', 'Custom-Templates', 'Manual', 'Hybrid']
        },
        sdkArchitecture: {
          type: 'object',
          properties: {
            clientStructure: { type: 'string' },
            authenticationLayer: { type: 'string' },
            errorHandling: { type: 'string' },
            retryLogic: { type: 'string' }
          }
        },
        sdkFeatures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              description: { type: 'string' },
              languages: { type: 'array' }
            }
          }
        },
        distribution: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              language: { type: 'string' },
              registry: { type: 'string' },
              packageName: { type: 'string' }
            }
          }
        },
        sdkDesignDocPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'api-design', 'sdk', 'client-libraries']
}));

// Phase 14: Developer Experience
export const developerExperienceTask = defineTask('developer-experience', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 14: Developer Experience Optimization - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Developer Experience (DX) Specialist',
      task: 'Optimize developer experience for API consumers',
      context: {
        projectName: args.projectName,
        apiType: args.apiType,
        targetAudience: args.targetAudience,
        apiDocumentation: args.apiDocumentation,
        sdkDesign: args.sdkDesign,
        formalSpecification: args.formalSpecification,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Assess developer onboarding flow',
        '2. Design API sandbox/playground environment',
        '3. Create quickstart guides and tutorials',
        '4. Design developer portal with interactive documentation',
        '5. Plan for API key management interface',
        '6. Design code examples and recipes',
        '7. Create Postman collection or similar',
        '8. Design feedback and support channels',
        '9. Plan for developer community (forums, Slack, Discord)',
        '10. Design API change notification system',
        '11. Score developer experience (0-100)',
        '12. Return DX optimization plan'
      ],
      outputFormat: 'JSON object with DX optimization'
    },
    outputSchema: {
      type: 'object',
      required: ['dxScore', 'onboardingFlow', 'improvementAreas', 'artifacts'],
      properties: {
        dxScore: {
          type: 'number',
          minimum: 0,
          maximum: 100,
          description: 'Developer experience score'
        },
        onboardingFlow: {
          type: 'object',
          properties: {
            steps: { type: 'array' },
            estimatedTime: { type: 'string' },
            improvements: { type: 'array' }
          }
        },
        estimatedOnboardingTime: { type: 'string' },
        developerPortal: {
          type: 'object',
          properties: {
            features: { type: 'array' },
            interactiveExplorer: { type: 'boolean' },
            apiKeyManagement: { type: 'boolean' },
            analytics: { type: 'boolean' }
          }
        },
        sandbox: {
          type: 'object',
          properties: {
            available: { type: 'boolean' },
            testDataProvided: { type: 'boolean' },
            resetCapability: { type: 'boolean' }
          }
        },
        communityResources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              platform: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        improvementAreas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              currentScore: { type: 'number' },
              recommendation: { type: 'string' },
              impact: { type: 'string' }
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
  labels: ['agent', 'api-design', 'developer-experience', 'dx']
}));

// Phase 15: Performance Design
export const performanceDesignTask = defineTask('performance-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 15: Performance and Caching Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'API Performance Architect',
      task: 'Design performance optimization and caching strategy',
      context: {
        projectName: args.projectName,
        apiType: args.apiType,
        constraints: args.constraints,
        endpointDesigns: args.endpointDesigns,
        architectureDesign: args.architectureDesign,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design caching strategy (CDN, HTTP caching, application caching)',
        '2. Define cache-control headers for each endpoint',
        '3. Design ETags and conditional requests',
        '4. Plan for compression (gzip, brotli)',
        '5. Design connection pooling and keep-alive',
        '6. Optimize payload sizes (field filtering, pagination)',
        '7. Design database query optimization',
        '8. Plan for asynchronous processing where appropriate',
        '9. Estimate performance metrics (latency, throughput)',
        '10. Identify performance bottlenecks',
        '11. Create performance testing strategy',
        '12. Return performance design with estimates'
      ],
      outputFormat: 'JSON object with performance design'
    },
    outputSchema: {
      type: 'object',
      required: ['cachingStrategy', 'estimatedP95Latency', 'optimizationStrategies', 'artifacts'],
      properties: {
        cachingStrategy: {
          type: 'object',
          properties: {
            levels: { type: 'array', items: { type: 'string' } },
            cdnEnabled: { type: 'boolean' },
            httpCaching: { type: 'boolean' },
            applicationCaching: { type: 'boolean' }
          }
        },
        cacheConfiguration: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              endpoint: { type: 'string' },
              cacheControl: { type: 'string' },
              ttl: { type: 'string' },
              etagEnabled: { type: 'boolean' }
            }
          }
        },
        compressionStrategy: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            algorithms: { type: 'array' },
            minimumSize: { type: 'string' }
          }
        },
        optimizationStrategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              strategy: { type: 'string' },
              description: { type: 'string' },
              expectedImprovement: { type: 'string' }
            }
          }
        },
        estimatedP95Latency: { type: 'string', description: 'Estimated p95 latency in milliseconds' },
        estimatedThroughput: { type: 'string', description: 'Estimated throughput (req/sec)' },
        bottlenecks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              impact: { type: 'string' },
              mitigation: { type: 'string' }
            }
          }
        },
        performanceTestingStrategy: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'api-design', 'performance', 'caching']
}));

// Phase 16: Monitoring and Observability
export const monitoringObservabilityTask = defineTask('monitoring-observability', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 16: Monitoring and Observability Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'API Observability Specialist',
      task: 'Design comprehensive monitoring and observability strategy',
      context: {
        projectName: args.projectName,
        apiType: args.apiType,
        endpointDesigns: args.endpointDesigns,
        performanceDesign: args.performanceDesign,
        constraints: args.constraints,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design metrics collection (requests, latency, errors)',
        '2. Define SLIs and SLOs for API',
        '3. Design logging strategy (structured logging)',
        '4. Plan for distributed tracing (OpenTelemetry)',
        '5. Design alerting rules and thresholds',
        '6. Plan for health check endpoints',
        '7. Design API analytics and usage tracking',
        '8. Plan for error tracking and reporting',
        '9. Design monitoring dashboards',
        '10. Select observability tools (Prometheus, Grafana, Datadog)',
        '11. Create runbooks for common issues',
        '12. Return monitoring and observability design'
      ],
      outputFormat: 'JSON object with monitoring design'
    },
    outputSchema: {
      type: 'object',
      required: ['metricsStrategy', 'tools', 'alertingRules', 'artifacts'],
      properties: {
        metricsStrategy: {
          type: 'object',
          properties: {
            collectionMethod: { type: 'string' },
            metrics: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  type: { type: 'string', enum: ['counter', 'gauge', 'histogram', 'summary'] },
                  description: { type: 'string' }
                }
              }
            }
          }
        },
        slis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              indicator: { type: 'string' },
              measurement: { type: 'string' },
              target: { type: 'string' }
            }
          }
        },
        slos: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              objective: { type: 'string' },
              target: { type: 'string' },
              measurement: { type: 'string' }
            }
          }
        },
        loggingStrategy: {
          type: 'object',
          properties: {
            format: { type: 'string' },
            levels: { type: 'array' },
            retention: { type: 'string' },
            sensitiveDataHandling: { type: 'string' }
          }
        },
        tracingStrategy: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            framework: { type: 'string' },
            samplingRate: { type: 'number' }
          }
        },
        alertingRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rule: { type: 'string' },
              condition: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'warning', 'info'] },
              notification: { type: 'string' }
            }
          }
        },
        tools: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tool: { type: 'string' },
              purpose: { type: 'string' },
              integration: { type: 'string' }
            }
          }
        },
        healthChecks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              endpoint: { type: 'string' },
              checks: { type: 'array' },
              responseFormat: { type: 'object' }
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
  labels: ['agent', 'api-design', 'monitoring', 'observability']
}));

// Phase 17: Migration Strategy
export const migrationStrategyTask = defineTask('migration-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 17: Migration and Backward Compatibility Strategy - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'API Migration Specialist',
      task: 'Design migration strategy from existing APIs',
      context: {
        projectName: args.projectName,
        existingAPIs: args.existingAPIs,
        formalSpecification: args.formalSpecification,
        versioningStrategy: args.versioningStrategy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze differences between existing and new API',
        '2. Identify breaking changes',
        '3. Design migration phases and timeline',
        '4. Create backward compatibility layer if needed',
        '5. Design API gateway routing for migration',
        '6. Plan for dual-running period',
        '7. Create migration scripts and tools',
        '8. Design data migration strategy',
        '9. Create migration guides for API consumers',
        '10. Plan for rollback procedures',
        '11. Identify migration risks',
        '12. Return comprehensive migration strategy'
      ],
      outputFormat: 'JSON object with migration strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['migrationStrategy', 'timeline', 'risks', 'artifacts'],
      properties: {
        migrationStrategy: {
          type: 'string',
          enum: ['Big-Bang', 'Phased', 'Strangler-Fig', 'Parallel-Run']
        },
        breakingChanges: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              change: { type: 'string' },
              impact: { type: 'string' },
              mitigation: { type: 'string' }
            }
          }
        },
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              description: { type: 'string' },
              duration: { type: 'string' },
              deliverables: { type: 'array' }
            }
          }
        },
        timeline: {
          type: 'object',
          properties: {
            totalDuration: { type: 'string' },
            dualRunPeriod: { type: 'string' },
            deprecationDate: { type: 'string' },
            sunsetDate: { type: 'string' }
          }
        },
        backwardCompatibility: {
          type: 'object',
          properties: {
            required: { type: 'boolean' },
            strategy: { type: 'string' },
            duration: { type: 'string' }
          }
        },
        migrationTools: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tool: { type: 'string' },
              purpose: { type: 'string' }
            }
          }
        },
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
        rollbackPlan: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'api-design', 'migration', 'backward-compatibility']
}));

// Phase 18: Implementation Roadmap
export const implementationRoadmapTask = defineTask('implementation-roadmap', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 18: Implementation Roadmap - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'API Implementation Project Manager',
      task: 'Create detailed implementation roadmap',
      context: {
        projectName: args.projectName,
        apiType: args.apiType,
        architectureDesign: args.architectureDesign,
        endpointDesigns: args.endpointDesigns,
        formalSpecification: args.formalSpecification,
        sdkDesign: args.sdkDesign,
        performanceDesign: args.performanceDesign,
        monitoringDesign: args.monitoringDesign,
        migrationStrategy: args.migrationStrategy,
        constraints: args.constraints,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Break down implementation into phases',
        '2. Define deliverables for each phase',
        '3. Estimate effort and timeline',
        '4. Identify dependencies and critical path',
        '5. Define team structure and roles',
        '6. Estimate costs (development, infrastructure)',
        '7. Identify implementation risks',
        '8. Create quality gates and milestones',
        '9. Plan for testing phases',
        '10. Design rollout strategy',
        '11. Create implementation timeline visualization',
        '12. Return comprehensive implementation roadmap'
      ],
      outputFormat: 'JSON object with implementation roadmap'
    },
    outputSchema: {
      type: 'object',
      required: ['roadmap', 'timeline', 'cost', 'phases', 'roadmapPath', 'artifacts'],
      properties: {
        roadmap: { type: 'object' },
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              description: { type: 'string' },
              duration: { type: 'string' },
              effort: { type: 'string' },
              deliverables: { type: 'array' },
              dependencies: { type: 'array' },
              milestones: { type: 'array' }
            }
          }
        },
        timeline: {
          type: 'object',
          properties: {
            totalDuration: { type: 'string' },
            startDate: { type: 'string' },
            estimatedCompletion: { type: 'string' },
            buffer: { type: 'string' }
          }
        },
        cost: {
          type: 'object',
          properties: {
            development: { type: 'string' },
            infrastructure: { type: 'string' },
            testing: { type: 'string' },
            documentation: { type: 'string' },
            contingency: { type: 'string' },
            total: { type: 'string' }
          }
        },
        team: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string' },
              allocation: { type: 'string' },
              skills: { type: 'array' }
            }
          }
        },
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              impact: { type: 'string' },
              probability: { type: 'string' },
              mitigation: { type: 'string' }
            }
          }
        },
        roadmapPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'api-design', 'roadmap', 'project-management']
}));

// Phase 19: Design Review
export const designReviewTask = defineTask('design-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 19: Comprehensive Design Review - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior API Architect and Design Reviewer',
      task: 'Conduct comprehensive review of API design',
      context: {
        projectName: args.projectName,
        apiType: args.apiType,
        targetAudience: args.targetAudience,
        requirementsAnalysis: args.requirementsAnalysis,
        architectureDesign: args.architectureDesign,
        formalSpecification: args.formalSpecification,
        apiDocumentation: args.apiDocumentation,
        performanceDesign: args.performanceDesign,
        authDesign: args.authDesign,
        implementationRoadmap: args.implementationRoadmap,
        constraints: args.constraints,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Review requirements coverage and completeness',
        '2. Assess architecture quality and patterns',
        '3. Review API design consistency and conventions',
        '4. Evaluate security design and vulnerabilities',
        '5. Assess performance design and optimization',
        '6. Review documentation quality and completeness',
        '7. Evaluate developer experience',
        '8. Assess versioning and evolution strategy',
        '9. Review error handling and resilience',
        '10. Calculate overall design quality score (0-100)',
        '11. Identify issues and provide recommendations',
        '12. Provide production readiness verdict'
      ],
      outputFormat: 'JSON object with design review results'
    },
    outputSchema: {
      type: 'object',
      required: ['qualityScore', 'verdict', 'readinessAssessment', 'issues', 'recommendations', 'reviewReportPath', 'artifacts'],
      properties: {
        qualityScore: {
          type: 'number',
          minimum: 0,
          maximum: 100,
          description: 'Overall API design quality score'
        },
        scoreBreakdown: {
          type: 'object',
          properties: {
            requirements: { type: 'number' },
            architecture: { type: 'number' },
            apiDesign: { type: 'number' },
            security: { type: 'number' },
            performance: { type: 'number' },
            documentation: { type: 'number' },
            developerExperience: { type: 'number' }
          }
        },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              category: { type: 'string' },
              description: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              recommendation: { type: 'string' },
              priority: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        verdict: {
          type: 'string',
          enum: ['Production-Ready', 'Ready-with-Minor-Changes', 'Requires-Revision', 'Not-Ready']
        },
        readinessAssessment: {
          type: 'object',
          properties: {
            readyForImplementation: { type: 'boolean' },
            readyForProduction: { type: 'boolean' },
            blockers: { type: 'array' },
            prerequisites: { type: 'array' }
          }
        },
        strengths: { type: 'array', items: { type: 'string' } },
        weaknesses: { type: 'array', items: { type: 'string' } },
        reviewReportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'api-design', 'design-review', 'quality-assessment']
}));
