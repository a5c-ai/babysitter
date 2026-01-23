/**
 * @process specializations/software-architecture/microservices-decomposition
 * @description Microservices Decomposition Strategy - Analyze monolithic applications and design optimal microservices architecture
 * using domain-driven design, bounded contexts, service boundaries, API contracts, data decomposition strategies, and migration roadmap
 * @inputs { projectName: string, currentArchitecture?: object, businessDomain?: object, constraints?: object, teamStructure?: object }
 * @outputs { success: boolean, decompositionStrategy: object, serviceInventory: array, migrationRoadmap: object, qualityScore: number, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/software-architecture/microservices-decomposition', {
 *   projectName: 'E-Commerce Platform',
 *   currentArchitecture: { type: 'monolith', technology: 'Java Spring', linesOfCode: 500000 },
 *   businessDomain: { industry: 'retail', capabilities: ['inventory', 'orders', 'payments', 'shipping'] },
 *   constraints: { budget: '$200K', timeline: '6 months', teamSize: 8 }
 * });
 *
 * @references
 * - Building Microservices by Sam Newman: https://www.oreilly.com/library/view/building-microservices-2nd/9781492034018/
 * - Domain-Driven Design by Eric Evans: https://www.domainlanguage.com/ddd/
 * - Monolith to Microservices by Sam Newman: https://www.oreilly.com/library/view/monolith-to-microservices/9781492047834/
 * - Microservices Patterns by Chris Richardson: https://microservices.io/patterns/
 * - The Art of Scalability by Martin Abbott: https://theartofscalability.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    currentArchitecture = {},
    businessDomain = {},
    constraints = {},
    teamStructure = {},
    outputDir = 'microservices-decomposition-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Microservices Decomposition for ${projectName}`);

  // ============================================================================
  // PHASE 1: DOMAIN ANALYSIS AND BOUNDED CONTEXTS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing business domain and identifying bounded contexts');
  const domainAnalysis = await ctx.task(domainAnalysisTask, {
    projectName,
    currentArchitecture,
    businessDomain,
    outputDir
  });

  artifacts.push(...domainAnalysis.artifacts);

  // Quality Gate: Must identify at least 2 bounded contexts
  if (domainAnalysis.boundedContexts.length < 2) {
    return {
      success: false,
      error: 'Insufficient bounded contexts identified. Microservices decomposition may not be appropriate for this system.',
      phase: 'domain-analysis',
      recommendation: 'Consider modular monolith or wait for system complexity to increase',
      domainAnalysis
    };
  }

  // ============================================================================
  // PHASE 2: SERVICE BOUNDARY IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Identifying optimal service boundaries and capabilities');
  const serviceBoundaries = await ctx.task(serviceBoundaryTask, {
    projectName,
    domainAnalysis,
    currentArchitecture,
    constraints,
    outputDir
  });

  artifacts.push(...serviceBoundaries.artifacts);

  // ============================================================================
  // PHASE 3: DEPENDENCY ANALYSIS AND DECOUPLING STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing dependencies and designing decoupling strategies');
  const dependencyAnalysis = await ctx.task(dependencyAnalysisTask, {
    projectName,
    currentArchitecture,
    serviceBoundaries,
    domainAnalysis,
    outputDir
  });

  artifacts.push(...dependencyAnalysis.artifacts);

  // Breakpoint: Review service boundaries and dependencies
  await ctx.breakpoint({
    question: `Domain analysis complete. Identified ${domainAnalysis.boundedContexts.length} bounded contexts and ${serviceBoundaries.services.length} potential services. Review service boundaries and dependencies before proceeding?`,
    title: 'Service Boundary Review',
    context: {
      runId: ctx.runId,
      projectName,
      boundedContexts: domainAnalysis.boundedContexts,
      services: serviceBoundaries.services,
      dependencies: dependencyAnalysis.dependencyGraph,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        label: a.label
      }))
    }
  });

  // ============================================================================
  // PHASE 4: DATA DECOMPOSITION STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 4: Designing data decomposition and database-per-service strategy');
  const dataDecomposition = await ctx.task(dataDecompositionTask, {
    projectName,
    currentArchitecture,
    serviceBoundaries,
    dependencyAnalysis,
    constraints,
    outputDir
  });

  artifacts.push(...dataDecomposition.artifacts);

  // ============================================================================
  // PHASE 5: API CONTRACT DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 5: Designing inter-service API contracts and communication patterns');
  const apiContracts = await ctx.task(apiContractDesignTask, {
    projectName,
    serviceBoundaries,
    dependencyAnalysis,
    dataDecomposition,
    outputDir
  });

  artifacts.push(...apiContracts.artifacts);

  // ============================================================================
  // PHASE 6: CROSS-CUTTING CONCERNS
  // ============================================================================

  ctx.log('info', 'Phase 6: Designing cross-cutting concerns and infrastructure patterns');
  const crossCuttingConcerns = await ctx.task(crossCuttingConcernsTask, {
    projectName,
    serviceBoundaries,
    currentArchitecture,
    constraints,
    outputDir
  });

  artifacts.push(...crossCuttingConcerns.artifacts);

  // ============================================================================
  // PHASE 7: STRANGLER FIG MIGRATION STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 7: Designing incremental migration strategy using Strangler Fig pattern');
  const migrationStrategy = await ctx.task(migrationStrategyTask, {
    projectName,
    currentArchitecture,
    serviceBoundaries,
    dependencyAnalysis,
    dataDecomposition,
    constraints,
    teamStructure,
    outputDir
  });

  artifacts.push(...migrationStrategy.artifacts);

  // ============================================================================
  // PHASE 8: SERVICE PRIORITIZATION AND SEQUENCING
  // ============================================================================

  ctx.log('info', 'Phase 8: Prioritizing services for extraction and sequencing migration waves');
  const servicePrioritization = await ctx.task(servicePrioritizationTask, {
    projectName,
    serviceBoundaries,
    dependencyAnalysis,
    migrationStrategy,
    constraints,
    businessDomain,
    outputDir
  });

  artifacts.push(...servicePrioritization.artifacts);

  // ============================================================================
  // PHASE 9: DEPLOYMENT AND INFRASTRUCTURE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 9: Designing deployment architecture and infrastructure requirements');
  const deploymentArchitecture = await ctx.task(deploymentArchitectureTask, {
    projectName,
    serviceBoundaries,
    crossCuttingConcerns,
    constraints,
    teamStructure,
    outputDir
  });

  artifacts.push(...deploymentArchitecture.artifacts);

  // ============================================================================
  // PHASE 10: OBSERVABILITY AND MONITORING STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 10: Designing observability, monitoring, and operational strategy');
  const observabilityStrategy = await ctx.task(observabilityStrategyTask, {
    projectName,
    serviceBoundaries,
    deploymentArchitecture,
    crossCuttingConcerns,
    outputDir
  });

  artifacts.push(...observabilityStrategy.artifacts);

  // ============================================================================
  // PHASE 11: MIGRATION ROADMAP AND TIMELINE
  // ============================================================================

  ctx.log('info', 'Phase 11: Creating detailed migration roadmap with phases and milestones');
  const migrationRoadmap = await ctx.task(migrationRoadmapTask, {
    projectName,
    servicePrioritization,
    migrationStrategy,
    dataDecomposition,
    constraints,
    teamStructure,
    outputDir
  });

  artifacts.push(...migrationRoadmap.artifacts);

  // ============================================================================
  // PHASE 12: RISK ASSESSMENT AND MITIGATION
  // ============================================================================

  ctx.log('info', 'Phase 12: Conducting comprehensive risk assessment and mitigation planning');
  const riskAssessment = await ctx.task(riskAssessmentTask, {
    projectName,
    currentArchitecture,
    serviceBoundaries,
    migrationStrategy,
    migrationRoadmap,
    constraints,
    outputDir
  });

  artifacts.push(...riskAssessment.artifacts);

  // Quality Gate: Critical risks must have mitigation plans
  const criticalRisksWithoutMitigation = riskAssessment.risks.filter(
    risk => risk.severity === 'critical' && !risk.mitigationPlan
  );

  if (criticalRisksWithoutMitigation.length > 0) {
    await ctx.breakpoint({
      question: `${criticalRisksWithoutMitigation.length} critical risks lack mitigation plans. Should we develop mitigation strategies before proceeding?`,
      title: 'Critical Risk Warning',
      context: {
        runId: ctx.runId,
        projectName,
        criticalRisks: criticalRisksWithoutMitigation,
        recommendation: 'Develop mitigation strategies for all critical risks before proceeding'
      }
    });
  }

  // ============================================================================
  // PHASE 13: DECOMPOSITION QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Phase 13: Evaluating decomposition strategy quality and completeness');
  const qualityScore = await ctx.task(decompositionQualityScoringTask, {
    projectName,
    domainAnalysis,
    serviceBoundaries,
    dependencyAnalysis,
    dataDecomposition,
    apiContracts,
    migrationStrategy,
    migrationRoadmap,
    riskAssessment,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const overallScore = qualityScore.overallScore;
  const qualityMet = overallScore >= 75;

  // ============================================================================
  // PHASE 14: COMPREHENSIVE STRATEGY DOCUMENT
  // ============================================================================

  ctx.log('info', 'Phase 14: Generating comprehensive decomposition strategy document');
  const strategyDocument = await ctx.task(strategyDocumentTask, {
    projectName,
    currentArchitecture,
    businessDomain,
    constraints,
    domainAnalysis,
    serviceBoundaries,
    dependencyAnalysis,
    dataDecomposition,
    apiContracts,
    crossCuttingConcerns,
    migrationStrategy,
    servicePrioritization,
    deploymentArchitecture,
    observabilityStrategy,
    migrationRoadmap,
    riskAssessment,
    qualityScore,
    outputDir
  });

  artifacts.push(...strategyDocument.artifacts);

  // Final Breakpoint: Review complete decomposition strategy
  await ctx.breakpoint({
    question: `Microservices decomposition strategy complete for ${projectName}. Overall quality score: ${overallScore}/100. ${qualityMet ? 'Strategy meets quality standards!' : 'Strategy may need refinement.'} Total services identified: ${serviceBoundaries.services.length}. Estimated migration duration: ${migrationRoadmap.timeline.totalDuration}. Approve to proceed with implementation?`,
    title: 'Decomposition Strategy Approval',
    context: {
      runId: ctx.runId,
      projectName,
      overallScore,
      qualityMet,
      totalServices: serviceBoundaries.services.length,
      migrationWaves: migrationRoadmap.waves.length,
      estimatedDuration: migrationRoadmap.timeline.totalDuration,
      estimatedCost: migrationRoadmap.cost.total,
      criticalRisks: riskAssessment.criticalRisks.length,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        boundedContexts: domainAnalysis.boundedContexts.length,
        services: serviceBoundaries.services.length,
        migrationWaves: migrationRoadmap.waves.length,
        estimatedDuration: migrationRoadmap.timeline.totalDuration,
        estimatedCost: migrationRoadmap.cost.total,
        qualityScore: overallScore
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    qualityScore: overallScore,
    qualityMet,
    decompositionStrategy: {
      domainAnalysis: {
        boundedContexts: domainAnalysis.boundedContexts,
        domainEvents: domainAnalysis.domainEvents,
        ubiquitousLanguage: domainAnalysis.ubiquitousLanguage
      },
      serviceBoundaries: {
        services: serviceBoundaries.services,
        totalCount: serviceBoundaries.services.length,
        serviceTypes: serviceBoundaries.serviceTypes
      },
      dependencyAnalysis: {
        dependencyGraph: dependencyAnalysis.dependencyGraph,
        couplingScore: dependencyAnalysis.couplingScore,
        cohesionScore: dependencyAnalysis.cohesionScore
      },
      dataDecomposition: {
        strategy: dataDecomposition.strategy,
        databases: dataDecomposition.databases,
        dataConsistencyPatterns: dataDecomposition.consistencyPatterns
      },
      apiContracts: {
        contracts: apiContracts.contracts,
        communicationPatterns: apiContracts.communicationPatterns,
        apiGatewayStrategy: apiContracts.apiGatewayStrategy
      },
      crossCuttingConcerns: {
        patterns: crossCuttingConcerns.patterns,
        infrastructure: crossCuttingConcerns.infrastructure
      }
    },
    serviceInventory: serviceBoundaries.services.map(s => ({
      name: s.name,
      boundedContext: s.boundedContext,
      capabilities: s.capabilities,
      priority: s.priority,
      complexity: s.complexity,
      estimatedEffort: s.estimatedEffort
    })),
    migrationRoadmap: {
      strategy: migrationStrategy.approach,
      waves: migrationRoadmap.waves,
      timeline: migrationRoadmap.timeline,
      cost: migrationRoadmap.cost,
      phases: migrationRoadmap.phases,
      milestones: migrationRoadmap.milestones
    },
    deployment: {
      architecture: deploymentArchitecture.architecture,
      infrastructure: deploymentArchitecture.infrastructure,
      cicdPipeline: deploymentArchitecture.cicdPipeline
    },
    observability: {
      monitoring: observabilityStrategy.monitoring,
      logging: observabilityStrategy.logging,
      tracing: observabilityStrategy.tracing,
      alerting: observabilityStrategy.alerting
    },
    riskAssessment: {
      totalRisks: riskAssessment.risks.length,
      criticalRisks: riskAssessment.criticalRisks,
      overallRiskLevel: riskAssessment.overallRiskLevel,
      mitigationPlan: riskAssessment.mitigationPlan
    },
    strategyDocument: strategyDocument.documentPath,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/software-architecture/microservices-decomposition',
      timestamp: startTime,
      projectName,
      outputDir,
      version: '1.0.0'
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Domain Analysis and Bounded Contexts
export const domainAnalysisTask = defineTask('domain-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Domain Analysis - ${args.projectName}`,
  agent: {
    name: 'domain-architect',
    prompt: {
      role: 'Domain-Driven Design expert and enterprise architect',
      task: 'Analyze business domain and identify bounded contexts for microservices decomposition',
      context: args,
      instructions: [
        '1. Analyze business capabilities and subdomain structure',
        '2. Identify core, supporting, and generic subdomains',
        '3. Define bounded contexts with clear boundaries and responsibilities',
        '4. Map ubiquitous language for each bounded context',
        '5. Identify domain events and aggregate roots',
        '6. Analyze context mapping relationships (shared kernel, customer-supplier, conformist, anti-corruption layer)',
        '7. Identify strategic patterns (partnership, published language, open host service)',
        '8. Map bounded contexts to potential service boundaries',
        '9. Assess domain complexity and technical complexity for each context',
        '10. Generate domain model diagram and context map'
      ],
      outputFormat: 'JSON with boundedContexts (array), domainEvents (array), ubiquitousLanguage (object), contextMap (object), subdomains (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['boundedContexts', 'domainEvents', 'ubiquitousLanguage', 'artifacts'],
      properties: {
        boundedContexts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['core', 'supporting', 'generic'] },
              description: { type: 'string' },
              capabilities: { type: 'array', items: { type: 'string' } },
              aggregates: { type: 'array', items: { type: 'string' } },
              domainEvents: { type: 'array', items: { type: 'string' } },
              relationships: { type: 'array', items: { type: 'object' } },
              complexity: { type: 'string', enum: ['low', 'medium', 'high', 'very-high'] }
            }
          }
        },
        domainEvents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              event: { type: 'string' },
              context: { type: 'string' },
              triggers: { type: 'array', items: { type: 'string' } },
              consumers: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        ubiquitousLanguage: {
          type: 'object',
          additionalProperties: {
            type: 'array',
            items: { type: 'string' }
          }
        },
        contextMap: {
          type: 'object',
          properties: {
            relationships: { type: 'array', items: { type: 'object' } },
            strategicPatterns: { type: 'array', items: { type: 'string' } }
          }
        },
        subdomains: {
          type: 'object',
          properties: {
            core: { type: 'array', items: { type: 'string' } },
            supporting: { type: 'array', items: { type: 'string' } },
            generic: { type: 'array', items: { type: 'string' } }
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
  labels: ['microservices', 'domain-analysis', 'ddd', 'bounded-contexts']
}));

// Task 2: Service Boundary Identification
export const serviceBoundaryTask = defineTask('service-boundary', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Service Boundary Identification - ${args.projectName}`,
  agent: {
    name: 'service-architect',
    prompt: {
      role: 'Microservices architect specializing in service boundary design',
      task: 'Define optimal service boundaries aligned with bounded contexts and business capabilities',
      context: args,
      instructions: [
        '1. Map bounded contexts to candidate microservices',
        '2. Apply single responsibility principle to service definition',
        '3. Define service capabilities and responsibilities',
        '4. Ensure high cohesion within services and low coupling between services',
        '5. Identify service types (business capability, entity, utility, gateway)',
        '6. Define service interfaces and contracts',
        '7. Assess service granularity (not too fine, not too coarse)',
        '8. Consider team topology and Conway\'s Law alignment',
        '9. Identify potential service composition patterns',
        '10. Generate service catalog with detailed specifications'
      ],
      outputFormat: 'JSON with services (array), serviceTypes (object), granularityAssessment (object), teamAlignment (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['services', 'serviceTypes', 'granularityAssessment', 'artifacts'],
      properties: {
        services: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              boundedContext: { type: 'string' },
              type: { type: 'string', enum: ['business-capability', 'entity', 'utility', 'gateway', 'bff'] },
              capabilities: { type: 'array', items: { type: 'string' } },
              responsibilities: { type: 'array', items: { type: 'string' } },
              aggregates: { type: 'array', items: { type: 'string' } },
              apis: { type: 'array', items: { type: 'object' } },
              dependencies: { type: 'array', items: { type: 'string' } },
              dataOwnership: { type: 'array', items: { type: 'string' } },
              estimatedComplexity: { type: 'string', enum: ['low', 'medium', 'high', 'very-high'] },
              estimatedSize: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        serviceTypes: {
          type: 'object',
          properties: {
            businessCapability: { type: 'number' },
            entity: { type: 'number' },
            utility: { type: 'number' },
            gateway: { type: 'number' },
            bff: { type: 'number' }
          }
        },
        granularityAssessment: {
          type: 'object',
          properties: {
            averageServiceSize: { type: 'string' },
            serviceSizeDistribution: { type: 'object' },
            granularityLevel: { type: 'string', enum: ['too-fine', 'optimal', 'too-coarse'] },
            recommendations: { type: 'array', items: { type: 'string' } }
          }
        },
        teamAlignment: {
          type: 'object',
          properties: {
            alignedWithConwaysLaw: { type: 'boolean' },
            suggestedTeamStructure: { type: 'array', items: { type: 'object' } },
            teamOwnership: { type: 'array', items: { type: 'object' } }
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
  labels: ['microservices', 'service-boundaries', 'architecture-design']
}));

// Task 3: Dependency Analysis
export const dependencyAnalysisTask = defineTask('dependency-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Dependency Analysis - ${args.projectName}`,
  agent: {
    name: 'dependency-analyst',
    prompt: {
      role: 'Software architect specializing in dependency analysis and decoupling strategies',
      task: 'Analyze inter-service dependencies and design decoupling strategies',
      context: args,
      instructions: [
        '1. Map all inter-service dependencies (synchronous, asynchronous, data)',
        '2. Identify circular dependencies and cyclic coupling',
        '3. Calculate coupling metrics (afferent, efferent, instability)',
        '4. Calculate cohesion metrics within each service',
        '5. Identify shared libraries and common code patterns',
        '6. Design decoupling strategies (API gateway, event bus, saga pattern, CQRS)',
        '7. Recommend anti-corruption layers where needed',
        '8. Identify opportunities for eventual consistency vs strong consistency',
        '9. Generate dependency graph visualization',
        '10. Provide decoupling roadmap with prioritized actions'
      ],
      outputFormat: 'JSON with dependencyGraph (object), couplingMetrics (object), cohesionMetrics (object), decouplingStrategies (array), circularDependencies (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['dependencyGraph', 'couplingScore', 'cohesionScore', 'decouplingStrategies', 'artifacts'],
      properties: {
        dependencyGraph: {
          type: 'object',
          properties: {
            nodes: { type: 'array', items: { type: 'object' } },
            edges: { type: 'array', items: { type: 'object' } },
            clusters: { type: 'array', items: { type: 'object' } }
          }
        },
        couplingMetrics: {
          type: 'object',
          properties: {
            afferentCoupling: { type: 'object' },
            efferentCoupling: { type: 'object' },
            instability: { type: 'object' }
          }
        },
        couplingScore: {
          type: 'number',
          minimum: 0,
          maximum: 100,
          description: 'Overall coupling score (lower is better)'
        },
        cohesionMetrics: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              cohesionScore: { type: 'number' },
              assessment: { type: 'string' }
            }
          }
        },
        cohesionScore: {
          type: 'number',
          minimum: 0,
          maximum: 100,
          description: 'Overall cohesion score (higher is better)'
        },
        circularDependencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              cycle: { type: 'array', items: { type: 'string' } },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              resolutionStrategy: { type: 'string' }
            }
          }
        },
        decouplingStrategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              services: { type: 'array', items: { type: 'string' } },
              currentCoupling: { type: 'string' },
              strategy: { type: 'string' },
              pattern: { type: 'string' },
              expectedImprovement: { type: 'string' },
              effort: { type: 'string' }
            }
          }
        },
        sharedComponents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              component: { type: 'string' },
              usedBy: { type: 'array', items: { type: 'string' } },
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
  labels: ['microservices', 'dependency-analysis', 'decoupling']
}));

// Task 4: Data Decomposition Strategy
export const dataDecompositionTask = defineTask('data-decomposition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Data Decomposition - ${args.projectName}`,
  agent: {
    name: 'data-architect',
    prompt: {
      role: 'Data architect specializing in distributed data management for microservices',
      task: 'Design data decomposition strategy implementing database-per-service pattern',
      context: args,
      instructions: [
        '1. Analyze current data model and schema structure',
        '2. Map data ownership to service boundaries',
        '3. Identify shared data entities and decomposition candidates',
        '4. Design database-per-service strategy (separate schemas, separate databases)',
        '5. Handle foreign key relationships across service boundaries',
        '6. Design data consistency patterns (eventual consistency, saga pattern, 2PC, outbox pattern)',
        '7. Identify reference data and shared dimension tables strategy',
        '8. Plan data migration from monolithic database to service databases',
        '9. Design data synchronization mechanisms',
        '10. Address reporting and analytics across distributed data'
      ],
      outputFormat: 'JSON with strategy (object), databases (array), consistencyPatterns (array), referenceDataStrategy (object), migrationPlan (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'databases', 'consistencyPatterns', 'migrationPlan', 'artifacts'],
      properties: {
        strategy: {
          type: 'object',
          properties: {
            approach: { type: 'string', enum: ['database-per-service', 'schema-per-service', 'hybrid'] },
            rationale: { type: 'string' },
            tradeoffs: { type: 'array', items: { type: 'string' } }
          }
        },
        databases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              service: { type: 'string' },
              databaseType: { type: 'string' },
              databaseName: { type: 'string' },
              entities: { type: 'array', items: { type: 'string' } },
              estimatedSize: { type: 'string' },
              technology: { type: 'string' },
              justification: { type: 'string' }
            }
          }
        },
        consistencyPatterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              services: { type: 'array', items: { type: 'string' } },
              pattern: { type: 'string', enum: ['eventual-consistency', 'saga', 'two-phase-commit', 'outbox', 'cqrs'] },
              description: { type: 'string' },
              tradeoffs: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        referenceDataStrategy: {
          type: 'object',
          properties: {
            approach: { type: 'string' },
            sharedEntities: { type: 'array', items: { type: 'string' } },
            replicationStrategy: { type: 'string' }
          }
        },
        migrationPlan: {
          type: 'object',
          properties: {
            phases: { type: 'array', items: { type: 'object' } },
            dataMovementStrategy: { type: 'string' },
            rollbackStrategy: { type: 'string' },
            estimatedDuration: { type: 'string' }
          }
        },
        reportingStrategy: {
          type: 'object',
          properties: {
            approach: { type: 'string' },
            tools: { type: 'array', items: { type: 'string' } },
            dataWarehouse: { type: 'boolean' }
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
  labels: ['microservices', 'data-decomposition', 'database-per-service']
}));

// Task 5: API Contract Design
export const apiContractDesignTask = defineTask('api-contract-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: API Contract Design - ${args.projectName}`,
  agent: {
    name: 'api-architect',
    prompt: {
      role: 'API architect specializing in microservices communication patterns',
      task: 'Design comprehensive API contracts and inter-service communication patterns',
      context: args,
      instructions: [
        '1. Define API contracts for each service (REST, GraphQL, gRPC)',
        '2. Design synchronous communication patterns (request-response)',
        '3. Design asynchronous communication patterns (event-driven, message queues)',
        '4. Specify API versioning strategy',
        '5. Design API gateway and BFF (Backend for Frontend) patterns',
        '6. Define service mesh architecture for service-to-service communication',
        '7. Specify authentication and authorization strategies',
        '8. Design circuit breaker and retry patterns',
        '9. Define API documentation and contract testing approach',
        '10. Generate OpenAPI/AsyncAPI specifications'
      ],
      outputFormat: 'JSON with contracts (array), communicationPatterns (object), apiGatewayStrategy (object), versioningStrategy (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['contracts', 'communicationPatterns', 'apiGatewayStrategy', 'artifacts'],
      properties: {
        contracts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              service: { type: 'string' },
              apiType: { type: 'string', enum: ['REST', 'GraphQL', 'gRPC', 'WebSocket'] },
              endpoints: { type: 'array', items: { type: 'object' } },
              events: { type: 'array', items: { type: 'object' } },
              versioningApproach: { type: 'string' },
              documentation: { type: 'string' }
            }
          }
        },
        communicationPatterns: {
          type: 'object',
          properties: {
            synchronous: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  from: { type: 'string' },
                  to: { type: 'string' },
                  protocol: { type: 'string' },
                  pattern: { type: 'string' }
                }
              }
            },
            asynchronous: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  event: { type: 'string' },
                  publisher: { type: 'string' },
                  subscribers: { type: 'array', items: { type: 'string' } },
                  broker: { type: 'string' }
                }
              }
            }
          }
        },
        apiGatewayStrategy: {
          type: 'object',
          properties: {
            pattern: { type: 'string', enum: ['single-gateway', 'bff', 'micro-gateway', 'service-mesh'] },
            technology: { type: 'string' },
            capabilities: { type: 'array', items: { type: 'string' } },
            rationale: { type: 'string' }
          }
        },
        versioningStrategy: {
          type: 'object',
          properties: {
            approach: { type: 'string' },
            deprecationPolicy: { type: 'string' },
            backwardCompatibility: { type: 'string' }
          }
        },
        resiliencePatterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string', enum: ['circuit-breaker', 'retry', 'timeout', 'bulkhead', 'rate-limiting'] },
              services: { type: 'array', items: { type: 'string' } },
              configuration: { type: 'object' }
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
  labels: ['microservices', 'api-design', 'communication-patterns']
}));

// Task 6: Cross-Cutting Concerns
export const crossCuttingConcernsTask = defineTask('cross-cutting-concerns', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Cross-Cutting Concerns - ${args.projectName}`,
  agent: {
    name: 'infrastructure-architect',
    prompt: {
      role: 'Infrastructure architect specializing in microservices cross-cutting concerns',
      task: 'Design infrastructure patterns for cross-cutting concerns',
      context: args,
      instructions: [
        '1. Design authentication and authorization (OAuth2, JWT, API keys)',
        '2. Design centralized logging strategy (ELK, Splunk, CloudWatch)',
        '3. Design distributed tracing (Jaeger, Zipkin, OpenTelemetry)',
        '4. Design service discovery mechanism (Consul, Eureka, Kubernetes DNS)',
        '5. Design configuration management (Spring Cloud Config, Consul KV, ConfigMaps)',
        '6. Design secrets management (Vault, AWS Secrets Manager)',
        '7. Design circuit breaker and resilience patterns',
        '8. Design rate limiting and throttling',
        '9. Design caching strategies (distributed cache, CDN)',
        '10. Design health check and readiness probe patterns'
      ],
      outputFormat: 'JSON with patterns (array), infrastructure (object), tools (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['patterns', 'infrastructure', 'tools', 'artifacts'],
      properties: {
        patterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              concern: { type: 'string' },
              pattern: { type: 'string' },
              implementation: { type: 'string' },
              technology: { type: 'string' }
            }
          }
        },
        infrastructure: {
          type: 'object',
          properties: {
            authentication: { type: 'object' },
            logging: { type: 'object' },
            tracing: { type: 'object' },
            serviceDiscovery: { type: 'object' },
            configManagement: { type: 'object' },
            secretsManagement: { type: 'object' },
            caching: { type: 'object' }
          }
        },
        tools: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              tool: { type: 'string' },
              purpose: { type: 'string' },
              justification: { type: 'string' }
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
  labels: ['microservices', 'cross-cutting-concerns', 'infrastructure']
}));

// Task 7: Migration Strategy
export const migrationStrategyTask = defineTask('migration-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Migration Strategy - ${args.projectName}`,
  agent: {
    name: 'migration-strategist',
    prompt: {
      role: 'Migration architect specializing in monolith-to-microservices transformation',
      task: 'Design incremental migration strategy using Strangler Fig and other proven patterns',
      context: args,
      instructions: [
        '1. Analyze migration approach options (Strangler Fig, Big Bang, Parallel Run)',
        '2. Recommend Strangler Fig pattern for incremental migration',
        '3. Design anti-corruption layer between monolith and microservices',
        '4. Plan routing strategy to gradually shift traffic',
        '5. Design data synchronization during migration period',
        '6. Plan dual-write and eventual cutover strategies',
        '7. Define rollback procedures for each migration step',
        '8. Design testing strategy during migration (smoke tests, integration tests)',
        '9. Plan for feature flags and canary releases',
        '10. Identify migration quick wins and pilot services'
      ],
      outputFormat: 'JSON with approach (string), stranglerFigStrategy (object), antiCorruptionLayer (object), routingStrategy (object), rollbackPlan (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['approach', 'stranglerFigStrategy', 'routingStrategy', 'rollbackPlan', 'artifacts'],
      properties: {
        approach: {
          type: 'string',
          enum: ['strangler-fig', 'big-bang', 'parallel-run', 'hybrid']
        },
        stranglerFigStrategy: {
          type: 'object',
          properties: {
            phases: { type: 'array', items: { type: 'string' } },
            extractionSequence: { type: 'array', items: { type: 'string' } },
            incrementalApproach: { type: 'string' }
          }
        },
        antiCorruptionLayer: {
          type: 'object',
          properties: {
            pattern: { type: 'string' },
            implementation: { type: 'string' },
            components: { type: 'array', items: { type: 'object' } }
          }
        },
        routingStrategy: {
          type: 'object',
          properties: {
            mechanism: { type: 'string' },
            trafficSplitting: { type: 'string' },
            featureFlags: { type: 'boolean' },
            canaryReleases: { type: 'boolean' }
          }
        },
        dataSynchronization: {
          type: 'object',
          properties: {
            dualWriteStrategy: { type: 'string' },
            syncMechanism: { type: 'string' },
            cutoverStrategy: { type: 'string' }
          }
        },
        rollbackPlan: {
          type: 'object',
          properties: {
            strategy: { type: 'string' },
            triggers: { type: 'array', items: { type: 'string' } },
            procedures: { type: 'array', items: { type: 'object' } }
          }
        },
        testingStrategy: {
          type: 'object',
          properties: {
            approaches: { type: 'array', items: { type: 'string' } },
            contractTesting: { type: 'boolean' },
            chaosEngineering: { type: 'boolean' }
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
  labels: ['microservices', 'migration-strategy', 'strangler-fig']
}));

// Task 8: Service Prioritization
export const servicePrioritizationTask = defineTask('service-prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Service Prioritization - ${args.projectName}`,
  agent: {
    name: 'prioritization-analyst',
    prompt: {
      role: 'Technical product manager specializing in migration prioritization',
      task: 'Prioritize services for extraction and sequence migration waves',
      context: args,
      instructions: [
        '1. Score services on business value (revenue impact, strategic importance)',
        '2. Score services on technical feasibility (low coupling, clear boundaries)',
        '3. Assess risk for each service extraction (complexity, dependencies)',
        '4. Identify quick wins (high value, low effort)',
        '5. Identify pilot candidate (moderate complexity, valuable learning)',
        '6. Consider dependency graph for sequencing',
        '7. Plan migration waves with logical groupings',
        '8. Balance team capacity across waves',
        '9. Incorporate feedback loops between waves',
        '10. Generate prioritization matrix and recommended sequence'
      ],
      outputFormat: 'JSON with prioritizedServices (array), migrationWaves (array), quickWins (array), pilotCandidate (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['prioritizedServices', 'migrationWaves', 'quickWins', 'pilotCandidate', 'artifacts'],
      properties: {
        prioritizedServices: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              service: { type: 'string' },
              businessValueScore: { type: 'number' },
              technicalFeasibilityScore: { type: 'number' },
              riskScore: { type: 'number' },
              overallPriority: { type: 'number' },
              rationale: { type: 'string' },
              wave: { type: 'number' }
            }
          }
        },
        migrationWaves: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              wave: { type: 'number' },
              name: { type: 'string' },
              services: { type: 'array', items: { type: 'string' } },
              objectives: { type: 'array', items: { type: 'string' } },
              estimatedDuration: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        quickWins: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              service: { type: 'string' },
              benefit: { type: 'string' },
              effort: { type: 'string' },
              justification: { type: 'string' }
            }
          }
        },
        pilotCandidate: {
          type: 'object',
          properties: {
            service: { type: 'string' },
            rationale: { type: 'string' },
            learningObjectives: { type: 'array', items: { type: 'string' } },
            successCriteria: { type: 'array', items: { type: 'string' } }
          }
        },
        prioritizationCriteria: {
          type: 'object',
          properties: {
            businessValue: { type: 'object' },
            technicalFeasibility: { type: 'object' },
            risk: { type: 'object' }
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
  labels: ['microservices', 'prioritization', 'migration-planning']
}));

// Task 9: Deployment Architecture
export const deploymentArchitectureTask = defineTask('deployment-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Deployment Architecture - ${args.projectName}`,
  agent: {
    name: 'devops-architect',
    prompt: {
      role: 'DevOps architect specializing in microservices deployment',
      task: 'Design deployment architecture and infrastructure for microservices',
      context: args,
      instructions: [
        '1. Select container orchestration platform (Kubernetes, ECS, Docker Swarm)',
        '2. Design deployment topology (multi-region, multi-AZ, edge)',
        '3. Design CI/CD pipelines for each service',
        '4. Plan infrastructure as code (Terraform, CloudFormation, Pulumi)',
        '5. Design auto-scaling policies (horizontal pod autoscaling, cluster autoscaling)',
        '6. Plan resource allocation and capacity planning',
        '7. Design blue-green and canary deployment strategies',
        '8. Plan service mesh implementation (Istio, Linkerd, Consul Connect)',
        '9. Design network policies and security groups',
        '10. Estimate infrastructure costs and optimization opportunities'
      ],
      outputFormat: 'JSON with architecture (object), orchestration (object), cicdPipeline (object), infrastructure (object), estimatedCost (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['architecture', 'orchestration', 'cicdPipeline', 'infrastructure', 'artifacts'],
      properties: {
        architecture: {
          type: 'object',
          properties: {
            topology: { type: 'string' },
            regions: { type: 'array', items: { type: 'string' } },
            availabilityZones: { type: 'number' },
            diagram: { type: 'string' }
          }
        },
        orchestration: {
          type: 'object',
          properties: {
            platform: { type: 'string' },
            justification: { type: 'string' },
            namespaceStrategy: { type: 'string' },
            resourceQuotas: { type: 'object' }
          }
        },
        cicdPipeline: {
          type: 'object',
          properties: {
            tool: { type: 'string' },
            stages: { type: 'array', items: { type: 'string' } },
            deploymentStrategy: { type: 'string', enum: ['blue-green', 'canary', 'rolling', 'recreate'] },
            automationLevel: { type: 'string' }
          }
        },
        infrastructure: {
          type: 'object',
          properties: {
            iacTool: { type: 'string' },
            compute: { type: 'object' },
            networking: { type: 'object' },
            storage: { type: 'object' },
            serviceMesh: { type: 'object' }
          }
        },
        scaling: {
          type: 'object',
          properties: {
            horizontalPodAutoscaling: { type: 'boolean' },
            clusterAutoscaling: { type: 'boolean' },
            policies: { type: 'array', items: { type: 'object' } }
          }
        },
        estimatedCost: {
          type: 'object',
          properties: {
            monthly: { type: 'string' },
            breakdown: { type: 'object' },
            optimizationOpportunities: { type: 'array', items: { type: 'string' } }
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
  labels: ['microservices', 'deployment', 'infrastructure', 'devops']
}));

// Task 10: Observability Strategy
export const observabilityStrategyTask = defineTask('observability-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Observability Strategy - ${args.projectName}`,
  agent: {
    name: 'sre-architect',
    prompt: {
      role: 'SRE architect specializing in microservices observability',
      task: 'Design comprehensive observability, monitoring, and operational strategy',
      context: args,
      instructions: [
        '1. Design distributed tracing strategy (end-to-end request tracing)',
        '2. Design centralized logging with correlation IDs',
        '3. Define metrics and KPIs per service (RED/USE/Four Golden Signals)',
        '4. Design service-level objectives (SLOs) and error budgets',
        '5. Design alerting strategy with escalation policies',
        '6. Plan dashboards for each service and system-wide views',
        '7. Design health check and readiness probe patterns',
        '8. Plan chaos engineering and resilience testing',
        '9. Design incident response and on-call procedures',
        '10. Define operational runbooks for common scenarios'
      ],
      outputFormat: 'JSON with monitoring (object), logging (object), tracing (object), alerting (object), slos (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['monitoring', 'logging', 'tracing', 'alerting', 'slos', 'artifacts'],
      properties: {
        monitoring: {
          type: 'object',
          properties: {
            tool: { type: 'string' },
            metricsFramework: { type: 'string', enum: ['RED', 'USE', 'Four-Golden-Signals'] },
            metrics: { type: 'array', items: { type: 'object' } },
            dashboards: { type: 'array', items: { type: 'object' } }
          }
        },
        logging: {
          type: 'object',
          properties: {
            centralized: { type: 'boolean' },
            tool: { type: 'string' },
            correlationIdStrategy: { type: 'string' },
            retentionPolicy: { type: 'string' },
            logLevels: { type: 'array', items: { type: 'string' } }
          }
        },
        tracing: {
          type: 'object',
          properties: {
            tool: { type: 'string' },
            samplingStrategy: { type: 'string' },
            propagationStrategy: { type: 'string' }
          }
        },
        alerting: {
          type: 'object',
          properties: {
            tool: { type: 'string' },
            alerts: { type: 'array', items: { type: 'object' } },
            escalationPolicy: { type: 'string' },
            oncallRotation: { type: 'string' }
          }
        },
        slos: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              service: { type: 'string' },
              sli: { type: 'string' },
              target: { type: 'string' },
              errorBudget: { type: 'string' }
            }
          }
        },
        healthChecks: {
          type: 'object',
          properties: {
            livenessProbes: { type: 'array', items: { type: 'object' } },
            readinessProbes: { type: 'array', items: { type: 'object' } }
          }
        },
        chaosEngineering: {
          type: 'object',
          properties: {
            tool: { type: 'string' },
            experiments: { type: 'array', items: { type: 'string' } }
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
  labels: ['microservices', 'observability', 'monitoring', 'sre']
}));

// Task 11: Migration Roadmap
export const migrationRoadmapTask = defineTask('migration-roadmap', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Migration Roadmap - ${args.projectName}`,
  agent: {
    name: 'program-manager',
    prompt: {
      role: 'Technical program manager specializing in large-scale migrations',
      task: 'Create detailed migration roadmap with phases, milestones, and resource allocation',
      context: args,
      instructions: [
        '1. Break down migration into detailed phases aligned with service waves',
        '2. Define milestones and success criteria for each phase',
        '3. Estimate effort and duration for each service migration',
        '4. Identify critical path and dependencies',
        '5. Allocate team resources across migration waves',
        '6. Plan for parallel workstreams (infrastructure, services, data)',
        '7. Include buffer for risks and learning curve',
        '8. Define gates and decision points',
        '9. Estimate total project cost (development, infrastructure, training)',
        '10. Generate Gantt chart and timeline visualization'
      ],
      outputFormat: 'JSON with waves (array), phases (array), milestones (array), timeline (object), cost (object), resourceAllocation (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['waves', 'phases', 'milestones', 'timeline', 'cost', 'artifacts'],
      properties: {
        waves: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              wave: { type: 'number' },
              name: { type: 'string' },
              services: { type: 'array', items: { type: 'string' } },
              startDate: { type: 'string' },
              endDate: { type: 'string' },
              duration: { type: 'string' },
              objectives: { type: 'array', items: { type: 'string' } },
              deliverables: { type: 'array', items: { type: 'string' } }
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
              activities: { type: 'array', items: { type: 'string' } },
              successCriteria: { type: 'array', items: { type: 'string' } },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        milestones: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              milestone: { type: 'string' },
              phase: { type: 'string' },
              targetDate: { type: 'string' },
              criteria: { type: 'string' },
              criticalPath: { type: 'boolean' }
            }
          }
        },
        timeline: {
          type: 'object',
          properties: {
            totalDuration: { type: 'string' },
            startDate: { type: 'string' },
            endDate: { type: 'string' },
            buffer: { type: 'string' }
          }
        },
        cost: {
          type: 'object',
          properties: {
            development: { type: 'string' },
            infrastructure: { type: 'string' },
            training: { type: 'string' },
            contingency: { type: 'string' },
            total: { type: 'string' },
            breakdown: { type: 'array', items: { type: 'object' } }
          }
        },
        resourceAllocation: {
          type: 'object',
          properties: {
            teams: { type: 'array', items: { type: 'object' } },
            allocation: { type: 'array', items: { type: 'object' } }
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
  labels: ['microservices', 'roadmap', 'program-management', 'planning']
}));

// Task 12: Risk Assessment
export const riskAssessmentTask = defineTask('risk-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Risk Assessment - ${args.projectName}`,
  agent: {
    name: 'risk-analyst',
    prompt: {
      role: 'Enterprise architect specializing in migration risk analysis',
      task: 'Conduct comprehensive risk assessment for microservices migration',
      context: args,
      instructions: [
        '1. Identify technical risks (data consistency, distributed transactions, network latency)',
        '2. Identify organizational risks (team skills, resistance to change, Conway\'s Law)',
        '3. Identify operational risks (increased complexity, debugging difficulty, cost overruns)',
        '4. Assess business risks (service disruption, timeline delays, ROI uncertainty)',
        '5. Evaluate each risk: severity (critical/high/medium/low) and probability (high/medium/low)',
        '6. Prioritize critical and high-severity risks',
        '7. Develop mitigation strategies for each significant risk',
        '8. Plan contingency actions for critical risks',
        '9. Define risk monitoring and early warning indicators',
        '10. Assign risk owners and accountability'
      ],
      outputFormat: 'JSON with risks (array), criticalRisks (array), overallRiskLevel (string), mitigationPlan (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['risks', 'criticalRisks', 'overallRiskLevel', 'mitigationPlan', 'artifacts'],
      properties: {
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              riskId: { type: 'string' },
              category: { type: 'string', enum: ['technical', 'organizational', 'operational', 'business'] },
              description: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              probability: { type: 'string', enum: ['high', 'medium', 'low'] },
              impact: { type: 'string' },
              mitigationPlan: { type: 'string' },
              contingencyPlan: { type: 'string' },
              owner: { type: 'string' },
              monitoringIndicators: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        criticalRisks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              mitigation: { type: 'string' },
              status: { type: 'string' }
            }
          }
        },
        overallRiskLevel: {
          type: 'string',
          enum: ['high', 'medium', 'low']
        },
        mitigationPlan: {
          type: 'object',
          properties: {
            strategies: { type: 'array', items: { type: 'object' } },
            timeline: { type: 'array', items: { type: 'object' } },
            budget: { type: 'string' }
          }
        },
        riskMatrix: {
          type: 'object',
          description: 'Visual risk matrix categorizing risks by severity and probability'
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['microservices', 'risk-assessment', 'risk-management']
}));

// Task 13: Decomposition Quality Scoring
export const decompositionQualityScoringTask = defineTask('decomposition-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Decomposition Quality Scoring - ${args.projectName}`,
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'Principal architect specializing in microservices quality assessment',
      task: 'Evaluate overall decomposition strategy quality and completeness',
      context: args,
      instructions: [
        '1. Assess bounded context clarity and domain alignment (weight: 15%)',
        '2. Evaluate service boundary quality and cohesion (weight: 20%)',
        '3. Assess coupling and dependency management (weight: 15%)',
        '4. Evaluate data decomposition strategy (weight: 15%)',
        '5. Assess API contract completeness and design (weight: 10%)',
        '6. Evaluate migration strategy feasibility (weight: 15%)',
        '7. Assess risk mitigation completeness (weight: 10%)',
        '8. Calculate weighted overall score (0-100)',
        '9. Identify gaps and areas for improvement',
        '10. Provide specific recommendations for quality enhancement'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), componentScores (object), gaps (array), recommendations (array), readinessAssessment (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'recommendations', 'readinessAssessment', 'artifacts'],
      properties: {
        overallScore: {
          type: 'number',
          minimum: 0,
          maximum: 100
        },
        componentScores: {
          type: 'object',
          properties: {
            boundedContexts: { type: 'number' },
            serviceBoundaries: { type: 'number' },
            couplingManagement: { type: 'number' },
            dataDecomposition: { type: 'number' },
            apiContracts: { type: 'number' },
            migrationStrategy: { type: 'number' },
            riskMitigation: { type: 'number' }
          }
        },
        qualityMetrics: {
          type: 'object',
          properties: {
            serviceGranularity: { type: 'string', enum: ['too-fine', 'optimal', 'too-coarse'] },
            couplingLevel: { type: 'string', enum: ['low', 'medium', 'high'] },
            cohesionLevel: { type: 'string', enum: ['high', 'medium', 'low'] },
            domainAlignment: { type: 'string', enum: ['excellent', 'good', 'fair', 'poor'] }
          }
        },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              gap: { type: 'string' },
              impact: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              recommendation: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              effort: { type: 'string' }
            }
          }
        },
        readinessAssessment: {
          type: 'string',
          enum: ['ready-to-proceed', 'minor-refinements-needed', 'major-refinements-needed', 'not-ready']
        },
        strengths: {
          type: 'array',
          items: { type: 'string' }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['microservices', 'quality-scoring', 'assessment']
}));

// Task 14: Strategy Document Generation
export const strategyDocumentTask = defineTask('strategy-document', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 14: Strategy Document - ${args.projectName}`,
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Senior technical writer and enterprise architect',
      task: 'Generate comprehensive microservices decomposition strategy document',
      context: args,
      instructions: [
        '1. Create executive summary with key recommendations',
        '2. Document current state analysis and motivation for microservices',
        '3. Present domain analysis and bounded context design',
        '4. Detail service inventory with boundaries and responsibilities',
        '5. Explain data decomposition strategy',
        '6. Document API contracts and communication patterns',
        '7. Present migration strategy and roadmap',
        '8. Include deployment and infrastructure architecture',
        '9. Document observability and operational strategy',
        '10. Present risk assessment and mitigation plans',
        '11. Include appendices (diagrams, API specs, cost analysis)',
        '12. Format as professional Markdown document ready for stakeholder presentation'
      ],
      outputFormat: 'JSON with documentPath (string), executiveSummary (string), keyRecommendations (array), nextSteps (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentPath', 'executiveSummary', 'keyRecommendations', 'nextSteps', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyRecommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              rationale: { type: 'string' },
              priority: { type: 'string' }
            }
          }
        },
        nextSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              owner: { type: 'string' },
              timeline: { type: 'string' }
            }
          }
        },
        criticalDecisions: {
          type: 'array',
          items: { type: 'string' }
        },
        successCriteria: {
          type: 'array',
          items: { type: 'string' }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['microservices', 'documentation', 'strategy-document']
}));
