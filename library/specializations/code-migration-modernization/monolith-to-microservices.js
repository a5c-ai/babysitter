/**
 * @process specializations/code-migration-modernization/monolith-to-microservices
 * @description Monolith to Microservices - Comprehensive process for decomposing monolithic applications
 * into microservices using domain-driven design principles and strangler fig pattern for incremental
 * migration with independent deployability.
 * @inputs { projectName: string, monolithAccess?: object, domainExperts?: array, targetArchitecture?: object }
 * @outputs { success: boolean, domainModel: object, serviceSpecifications: array, extractedServices: array, infrastructureConfig: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/code-migration-modernization/monolith-to-microservices', {
 *   projectName: 'E-Commerce Decomposition',
 *   monolithAccess: { repository: 'https://github.com/org/monolith', type: 'java' },
 *   domainExperts: ['product-owner@company.com'],
 *   targetArchitecture: { pattern: 'microservices', communication: 'event-driven' }
 * });
 *
 * @references
 * - Building Microservices (Sam Newman): https://www.oreilly.com/library/view/building-microservices-2nd/9781492034018/
 * - Monolith to Microservices (Sam Newman): https://www.oreilly.com/library/view/monolith-to-microservices/9781492047834/
 * - Domain-Driven Design: https://domainlanguage.com/ddd/
 * - Strangler Fig Pattern: https://martinfowler.com/bliki/StranglerFigApplication.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    monolithAccess = {},
    domainExperts = [],
    targetArchitecture = {},
    outputDir = 'microservices-decomposition-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Monolith to Microservices decomposition for ${projectName}`);

  // ============================================================================
  // PHASE 1: DOMAIN ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing business domain');
  const domainAnalysis = await ctx.task(domainAnalysisTask, {
    projectName,
    monolithAccess,
    domainExperts,
    outputDir
  });

  artifacts.push(...domainAnalysis.artifacts);

  // Breakpoint: Domain model review
  await ctx.breakpoint({
    question: `Domain analysis complete for ${projectName}. Bounded contexts: ${domainAnalysis.boundedContexts.length}. Review domain model before service identification?`,
    title: 'Domain Model Review',
    context: {
      runId: ctx.runId,
      projectName,
      domainAnalysis,
      recommendation: 'Validate bounded contexts with domain experts'
    }
  });

  // ============================================================================
  // PHASE 2: SERVICE IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Identifying services');
  const serviceIdentification = await ctx.task(serviceIdentificationTask, {
    projectName,
    domainAnalysis,
    targetArchitecture,
    outputDir
  });

  artifacts.push(...serviceIdentification.artifacts);

  // ============================================================================
  // PHASE 3: DATA DECOMPOSITION PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 3: Planning data decomposition');
  const dataDecomposition = await ctx.task(dataDecompositionPlanningTask, {
    projectName,
    domainAnalysis,
    serviceIdentification,
    monolithAccess,
    outputDir
  });

  artifacts.push(...dataDecomposition.artifacts);

  // ============================================================================
  // PHASE 4: API CONTRACT DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 4: Defining API contracts');
  const apiContracts = await ctx.task(apiContractDefinitionTask, {
    projectName,
    serviceIdentification,
    targetArchitecture,
    outputDir
  });

  artifacts.push(...apiContracts.artifacts);

  // Breakpoint: API contracts review
  await ctx.breakpoint({
    question: `API contracts defined for ${projectName}. Services: ${serviceIdentification.candidateServices.length}. APIs: ${apiContracts.totalApis}. Approve contracts before infrastructure setup?`,
    title: 'API Contracts Review',
    context: {
      runId: ctx.runId,
      projectName,
      apiContracts,
      recommendation: 'Ensure contracts are backward compatible'
    }
  });

  // ============================================================================
  // PHASE 5: INFRASTRUCTURE SETUP
  // ============================================================================

  ctx.log('info', 'Phase 5: Setting up infrastructure');
  const infrastructureSetup = await ctx.task(infrastructureSetupTask, {
    projectName,
    serviceIdentification,
    targetArchitecture,
    outputDir
  });

  artifacts.push(...infrastructureSetup.artifacts);

  // ============================================================================
  // PHASE 6: SERVICE EXTRACTION (Iterative)
  // ============================================================================

  ctx.log('info', 'Phase 6: Extracting services');
  const serviceExtraction = await ctx.task(serviceExtractionTask, {
    projectName,
    serviceIdentification,
    dataDecomposition,
    apiContracts,
    infrastructureSetup,
    outputDir
  });

  artifacts.push(...serviceExtraction.artifacts);

  // ============================================================================
  // PHASE 7: DATA MIGRATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Migrating service data');
  const dataMigration = await ctx.task(serviceDataMigrationTask, {
    projectName,
    dataDecomposition,
    serviceExtraction,
    outputDir
  });

  artifacts.push(...dataMigration.artifacts);

  // ============================================================================
  // PHASE 8: INTEGRATION TESTING
  // ============================================================================

  ctx.log('info', 'Phase 8: Testing integration');
  const integrationTesting = await ctx.task(microservicesIntegrationTestingTask, {
    projectName,
    serviceExtraction,
    apiContracts,
    outputDir
  });

  artifacts.push(...integrationTesting.artifacts);

  // Quality Gate: Integration test results
  if (!integrationTesting.allPassed) {
    await ctx.breakpoint({
      question: `Integration tests failed for ${projectName}. Failed: ${integrationTesting.failedCount}. Review and fix failures?`,
      title: 'Integration Test Failures',
      context: {
        runId: ctx.runId,
        projectName,
        failures: integrationTesting.failures,
        recommendation: 'Fix integration issues before monolith cleanup'
      }
    });
  }

  // ============================================================================
  // PHASE 9: MONOLITH CLEANUP
  // ============================================================================

  ctx.log('info', 'Phase 9: Cleaning up monolith');
  const monolithCleanup = await ctx.task(monolithCleanupTask, {
    projectName,
    serviceExtraction,
    integrationTesting,
    outputDir
  });

  artifacts.push(...monolithCleanup.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Microservices decomposition complete for ${projectName}. Services extracted: ${serviceExtraction.extractedCount}. Monolith reduction: ${monolithCleanup.codeReduction}%. Approve decomposition?`,
    title: 'Microservices Decomposition Complete',
    context: {
      runId: ctx.runId,
      projectName,
      summary: {
        servicesExtracted: serviceExtraction.extractedCount,
        apisCreated: apiContracts.totalApis,
        codeReduction: monolithCleanup.codeReduction,
        integrationTestsPassed: integrationTesting.allPassed
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    domainModel: {
      boundedContexts: domainAnalysis.boundedContexts,
      aggregates: domainAnalysis.aggregates,
      ubiquitousLanguage: domainAnalysis.ubiquitousLanguage
    },
    serviceSpecifications: serviceIdentification.candidateServices,
    extractedServices: serviceExtraction.extractedServices,
    apiContracts: apiContracts,
    dataDecomposition: dataDecomposition,
    infrastructureConfig: infrastructureSetup,
    integrationResults: {
      allPassed: integrationTesting.allPassed,
      passed: integrationTesting.passedCount,
      failed: integrationTesting.failedCount
    },
    monolithStatus: {
      codeReduction: monolithCleanup.codeReduction,
      remainingComponents: monolithCleanup.remainingComponents
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/code-migration-modernization/monolith-to-microservices',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const domainAnalysisTask = defineTask('domain-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Domain Analysis - ${args.projectName}`,
  agent: {
    name: 'ddd-analyst',
    prompt: {
      role: 'Domain-Driven Design Expert',
      task: 'Analyze business domain and identify bounded contexts',
      context: args,
      instructions: [
        '1. Identify business capabilities',
        '2. Map domain boundaries',
        '3. Create ubiquitous language glossary',
        '4. Define bounded contexts',
        '5. Identify aggregates and entities',
        '6. Map domain events',
        '7. Identify shared kernels',
        '8. Document context relationships',
        '9. Create context map',
        '10. Generate domain model document'
      ],
      outputFormat: 'JSON with boundedContexts, aggregates, ubiquitousLanguage, contextMap, domainEvents, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['boundedContexts', 'aggregates', 'artifacts'],
      properties: {
        boundedContexts: { type: 'array', items: { type: 'object' } },
        aggregates: { type: 'array', items: { type: 'object' } },
        ubiquitousLanguage: { type: 'object' },
        contextMap: { type: 'object' },
        domainEvents: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['microservices', 'domain', 'ddd']
}));

export const serviceIdentificationTask = defineTask('service-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Service Identification - ${args.projectName}`,
  agent: {
    name: 'microservices-decomposition-planner',
    prompt: {
      role: 'Microservices Architect',
      task: 'Identify candidate microservices from bounded contexts',
      context: args,
      instructions: [
        '1. Map contexts to services',
        '2. Define service boundaries',
        '3. Identify shared concerns',
        '4. Prioritize extraction order',
        '5. Define service responsibilities',
        '6. Identify service dependencies',
        '7. Plan data ownership',
        '8. Define service APIs',
        '9. Estimate service complexity',
        '10. Generate service catalog'
      ],
      outputFormat: 'JSON with candidateServices, extractionOrder, dependencies, sharedConcerns, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['candidateServices', 'extractionOrder', 'artifacts'],
      properties: {
        candidateServices: { type: 'array', items: { type: 'object' } },
        extractionOrder: { type: 'array', items: { type: 'string' } },
        dependencies: { type: 'array', items: { type: 'object' } },
        sharedConcerns: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['microservices', 'identification', 'architecture']
}));

export const dataDecompositionPlanningTask = defineTask('data-decomposition-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Data Decomposition Planning - ${args.projectName}`,
  agent: {
    name: 'microservices-decomposition-planner',
    prompt: {
      role: 'Data Architect',
      task: 'Plan data decomposition for microservices',
      context: args,
      instructions: [
        '1. Analyze data dependencies',
        '2. Plan database per service',
        '3. Design data synchronization',
        '4. Handle shared data patterns',
        '5. Plan data migration strategy',
        '6. Design eventual consistency',
        '7. Plan saga patterns',
        '8. Design event sourcing if needed',
        '9. Document data ownership',
        '10. Generate data decomposition plan'
      ],
      outputFormat: 'JSON with dataOwnership, migrationStrategy, synchronizationPattern, sagaDesign, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['dataOwnership', 'migrationStrategy', 'artifacts'],
      properties: {
        dataOwnership: { type: 'array', items: { type: 'object' } },
        migrationStrategy: { type: 'object' },
        synchronizationPattern: { type: 'string' },
        sagaDesign: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['microservices', 'data', 'decomposition']
}));

export const apiContractDefinitionTask = defineTask('api-contract-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: API Contract Definition - ${args.projectName}`,
  agent: {
    name: 'api-modernization-architect',
    prompt: {
      role: 'API Architect',
      task: 'Define API contracts between services',
      context: args,
      instructions: [
        '1. Design service APIs',
        '2. Define data contracts',
        '3. Choose communication patterns (REST, gRPC, events)',
        '4. Document API specifications (OpenAPI)',
        '5. Design error handling',
        '6. Plan versioning strategy',
        '7. Define rate limiting',
        '8. Design authentication',
        '9. Plan contract testing',
        '10. Generate API documentation'
      ],
      outputFormat: 'JSON with totalApis, apiSpecs, communicationPattern, versioningStrategy, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalApis', 'apiSpecs', 'artifacts'],
      properties: {
        totalApis: { type: 'number' },
        apiSpecs: { type: 'array', items: { type: 'object' } },
        communicationPattern: { type: 'string' },
        versioningStrategy: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['microservices', 'api', 'contracts']
}));

export const infrastructureSetupTask = defineTask('infrastructure-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Infrastructure Setup - ${args.projectName}`,
  agent: {
    name: 'microservices-decomposition-planner',
    prompt: {
      role: 'Platform Engineer',
      task: 'Set up microservices infrastructure',
      context: args,
      instructions: [
        '1. Set up service mesh',
        '2. Configure API gateway',
        '3. Implement service discovery',
        '4. Set up monitoring and tracing',
        '5. Configure logging aggregation',
        '6. Set up CI/CD pipelines',
        '7. Configure container orchestration',
        '8. Set up configuration management',
        '9. Implement secrets management',
        '10. Generate infrastructure documentation'
      ],
      outputFormat: 'JSON with serviceMesh, apiGateway, serviceDiscovery, monitoring, cicd, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['serviceMesh', 'apiGateway', 'artifacts'],
      properties: {
        serviceMesh: { type: 'object' },
        apiGateway: { type: 'object' },
        serviceDiscovery: { type: 'object' },
        monitoring: { type: 'object' },
        cicd: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['microservices', 'infrastructure', 'platform']
}));

export const serviceExtractionTask = defineTask('service-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Service Extraction - ${args.projectName}`,
  agent: {
    name: 'strangler-pattern-implementer',
    prompt: {
      role: 'Senior Developer',
      task: 'Extract services from monolith using strangler fig',
      context: args,
      instructions: [
        '1. Extract service code',
        '2. Set up service repository',
        '3. Set up service database',
        '4. Implement service API',
        '5. Route traffic via strangler',
        '6. Validate functionality',
        '7. Implement health checks',
        '8. Set up monitoring',
        '9. Test service independently',
        '10. Document extraction'
      ],
      outputFormat: 'JSON with extractedCount, extractedServices, stranglerConfig, healthChecks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['extractedCount', 'extractedServices', 'artifacts'],
      properties: {
        extractedCount: { type: 'number' },
        extractedServices: { type: 'array', items: { type: 'object' } },
        stranglerConfig: { type: 'object' },
        healthChecks: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['microservices', 'extraction', 'strangler']
}));

export const serviceDataMigrationTask = defineTask('service-data-migration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Service Data Migration - ${args.projectName}`,
  agent: {
    name: 'database-migration-orchestrator',
    prompt: {
      role: 'Data Migration Engineer',
      task: 'Migrate data to service-specific databases',
      context: args,
      instructions: [
        '1. Migrate service data',
        '2. Set up data synchronization',
        '3. Validate data integrity',
        '4. Cut over data access',
        '5. Implement CDC if needed',
        '6. Handle data consistency',
        '7. Test data flows',
        '8. Validate queries',
        '9. Monitor replication',
        '10. Document migration'
      ],
      outputFormat: 'JSON with migratedServices, dataIntegrity, synchronizationStatus, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['migratedServices', 'dataIntegrity', 'artifacts'],
      properties: {
        migratedServices: { type: 'array', items: { type: 'string' } },
        dataIntegrity: { type: 'boolean' },
        synchronizationStatus: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['microservices', 'data', 'migration']
}));

export const microservicesIntegrationTestingTask = defineTask('microservices-integration-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Integration Testing - ${args.projectName}`,
  agent: {
    name: 'regression-detector',
    prompt: {
      role: 'QA Engineer',
      task: 'Test service interactions and end-to-end flows',
      context: args,
      instructions: [
        '1. Test service interactions',
        '2. Validate end-to-end flows',
        '3. Test failure scenarios',
        '4. Test circuit breakers',
        '5. Validate data consistency',
        '6. Test performance',
        '7. Test resilience',
        '8. Validate monitoring',
        '9. Test rollback',
        '10. Generate test report'
      ],
      outputFormat: 'JSON with allPassed, passedCount, failedCount, failures, performanceResults, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['allPassed', 'passedCount', 'failedCount', 'artifacts'],
      properties: {
        allPassed: { type: 'boolean' },
        passedCount: { type: 'number' },
        failedCount: { type: 'number' },
        failures: { type: 'array', items: { type: 'object' } },
        performanceResults: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['microservices', 'integration', 'testing']
}));

export const monolithCleanupTask = defineTask('monolith-cleanup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Monolith Cleanup - ${args.projectName}`,
  agent: {
    name: 'strangler-pattern-implementer',
    prompt: {
      role: 'Senior Developer',
      task: 'Clean up monolith after service extraction',
      context: args,
      instructions: [
        '1. Remove extracted code',
        '2. Clean up dependencies',
        '3. Update routing to services',
        '4. Remove dead code',
        '5. Update tests',
        '6. Reduce monolith scope',
        '7. Update documentation',
        '8. Calculate code reduction',
        '9. Verify functionality',
        '10. Document remaining components'
      ],
      outputFormat: 'JSON with codeReduction, remainingComponents, cleanedAreas, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['codeReduction', 'remainingComponents', 'artifacts'],
      properties: {
        codeReduction: { type: 'number' },
        remainingComponents: { type: 'array', items: { type: 'string' } },
        cleanedAreas: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['microservices', 'cleanup', 'monolith']
}));
