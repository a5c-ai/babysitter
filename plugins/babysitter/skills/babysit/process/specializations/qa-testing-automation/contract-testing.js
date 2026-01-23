/**
 * @process specializations/qa-testing-automation/contract-testing
 * @description Contract Testing Implementation - Consumer-driven contract testing to enable independent service
 * deployment while maintaining integration confidence between microservices. Implements Pact-based contract testing
 * with provider verification, contract broker setup, and CI/CD integration for both consumer and provider sides.
 * @inputs { projectName: string, services: array, contractTool?: string, brokerUrl?: string, architecture?: string }
 * @outputs { success: boolean, contractsCreated: number, providerVerificationsPassing: boolean, brokerSetup: boolean, cicdIntegrated: boolean }
 *
 * @example
 * const result = await orchestrate('specializations/qa-testing-automation/contract-testing', {
 *   projectName: 'E-commerce Microservices',
 *   services: [
 *     { name: 'order-service', type: 'consumer', dependencies: ['inventory-service', 'payment-service'] },
 *     { name: 'inventory-service', type: 'provider', consumers: ['order-service', 'warehouse-service'] },
 *     { name: 'payment-service', type: 'provider', consumers: ['order-service'] }
 *   ],
 *   contractTool: 'pact',
 *   architecture: 'microservices',
 *   acceptanceCriteria: { contractCoverage: 100, providerVerificationRate: 95, breakingChangeDetection: true }
 * });
 *
 * @references
 * - Pact Documentation: https://docs.pact.io/
 * - Consumer-Driven Contracts: https://martinfowler.com/articles/consumerDrivenContracts.html
 * - Microservices Testing: https://martinfowler.com/articles/microservice-testing/
 * - Contract Testing Best Practices: https://pactflow.io/blog/contract-testing-best-practices/
 * - Spring Cloud Contract: https://spring.io/projects/spring-cloud-contract
 * - Pact Broker: https://github.com/pact-foundation/pact_broker
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    services = [],
    contractTool = 'pact', // 'pact', 'spring-cloud-contract', 'postman'
    brokerUrl = '',
    architecture = 'microservices', // 'microservices', 'api-gateway', 'event-driven'
    acceptanceCriteria = {
      contractCoverage: 100,
      providerVerificationRate: 95,
      breakingChangeDetection: true,
      independentDeploymentVerified: true
    },
    outputDir = 'contract-testing-output',
    versioningStrategy = 'semantic', // 'semantic', 'git-sha', 'timestamp'
    enableCanDeploy = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let contractsCreated = 0;
  let providerVerificationsPassing = false;
  let brokerSetup = false;

  ctx.log('info', `Starting Contract Testing Implementation for ${projectName}`);
  ctx.log('info', `Contract Tool: ${contractTool}, Services: ${services.length}, Architecture: ${architecture}`);

  // ============================================================================
  // PHASE 1: SERVICE DEPENDENCY MAPPING
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing service dependencies and mapping contracts');

  const serviceMappingAnalysis = await ctx.task(serviceMappingTask, {
    projectName,
    services,
    architecture,
    outputDir
  });

  if (!serviceMappingAnalysis.success || serviceMappingAnalysis.contractPairs.length === 0) {
    return {
      success: false,
      error: 'Failed to map service dependencies and contract pairs',
      details: serviceMappingAnalysis,
      metadata: {
        processId: 'specializations/qa-testing-automation/contract-testing',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...serviceMappingAnalysis.artifacts);

  ctx.log('info', `Identified ${serviceMappingAnalysis.contractPairs.length} contract pairs`);

  // Quality Gate: Minimum contract coverage
  if (serviceMappingAnalysis.coveragePercentage < 80) {
    await ctx.breakpoint({
      question: `Contract coverage at ${serviceMappingAnalysis.coveragePercentage}%. Recommended: 90%+. Review service dependencies and approve to continue?`,
      title: 'Contract Coverage Review',
      context: {
        runId: ctx.runId,
        contractPairs: serviceMappingAnalysis.contractPairs,
        uncoveredDependencies: serviceMappingAnalysis.uncoveredDependencies,
        recommendation: 'Add contract definitions for all critical service interactions',
        files: serviceMappingAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 2: CONTRACT TOOL SETUP AND CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Setting up contract testing tool and configuration');

  const toolSetup = await ctx.task(contractToolSetupTask, {
    projectName,
    contractTool,
    services,
    architecture,
    contractPairs: serviceMappingAnalysis.contractPairs,
    outputDir
  });

  artifacts.push(...toolSetup.artifacts);

  // Quality Gate: Tool setup verification
  if (!toolSetup.toolConfigured || toolSetup.configurationIssues.length > 0) {
    await ctx.breakpoint({
      question: `Contract tool setup completed with ${toolSetup.configurationIssues.length} issues. Review and approve to continue?`,
      title: 'Tool Setup Review',
      context: {
        runId: ctx.runId,
        contractTool,
        toolConfigured: toolSetup.toolConfigured,
        configurationIssues: toolSetup.configurationIssues,
        files: toolSetup.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 3: CONSUMER CONTRACT DEFINITIONS
  // ============================================================================

  ctx.log('info', 'Phase 3: Creating consumer contract definitions');

  const consumerContracts = await ctx.task(consumerContractDefinitionTask, {
    projectName,
    contractTool,
    contractPairs: serviceMappingAnalysis.contractPairs,
    services: services.filter(s => s.type === 'consumer' || !s.type),
    toolConfig: toolSetup.configuration,
    outputDir
  });

  artifacts.push(...consumerContracts.artifacts);
  contractsCreated = consumerContracts.contractsCreated;

  ctx.log('info', `Created ${contractsCreated} consumer contracts`);

  // Quality Gate: Consumer contract completeness
  if (contractsCreated < serviceMappingAnalysis.contractPairs.length) {
    await ctx.breakpoint({
      question: `${contractsCreated}/${serviceMappingAnalysis.contractPairs.length} consumer contracts created. Review missing contracts and approve?`,
      title: 'Consumer Contract Completeness',
      context: {
        runId: ctx.runId,
        contractsCreated,
        expectedContracts: serviceMappingAnalysis.contractPairs.length,
        missingContracts: consumerContracts.missingContracts,
        recommendation: 'Complete all critical consumer contracts before provider verification',
        files: consumerContracts.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 4: CONSUMER TESTS EXECUTION
  // ============================================================================

  ctx.log('info', 'Phase 4: Running consumer contract tests');

  const consumerTestExecution = await ctx.task(consumerContractTestsTask, {
    projectName,
    contractTool,
    consumerContracts: consumerContracts.contracts,
    toolConfig: toolSetup.configuration,
    outputDir
  });

  artifacts.push(...consumerTestExecution.artifacts);

  // Quality Gate: Consumer tests passing
  const consumerPassRate = consumerTestExecution.passRate;
  if (consumerPassRate < 100) {
    await ctx.breakpoint({
      question: `Consumer contract tests pass rate: ${consumerPassRate}%. Target: 100%. Review failures and continue?`,
      title: 'Consumer Tests Pass Rate',
      context: {
        runId: ctx.runId,
        passRate: consumerPassRate,
        totalTests: consumerTestExecution.totalTests,
        passed: consumerTestExecution.passed,
        failed: consumerTestExecution.failed,
        failureDetails: consumerTestExecution.failures,
        files: consumerTestExecution.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 5: CONTRACT BROKER SETUP
  // ============================================================================

  ctx.log('info', 'Phase 5: Setting up contract broker for contract sharing');

  const brokerSetupResult = await ctx.task(contractBrokerSetupTask, {
    projectName,
    contractTool,
    brokerUrl,
    services,
    contracts: consumerContracts.contracts,
    versioningStrategy,
    outputDir
  });

  artifacts.push(...brokerSetupResult.artifacts);
  brokerSetup = brokerSetupResult.brokerReady;

  // Quality Gate: Broker setup verification
  if (!brokerSetup) {
    await ctx.breakpoint({
      question: `Contract broker setup encountered issues. Broker ready: ${brokerSetup}. Review and approve to continue?`,
      title: 'Contract Broker Setup Review',
      context: {
        runId: ctx.runId,
        brokerReady: brokerSetup,
        brokerUrl: brokerSetupResult.brokerUrl,
        setupIssues: brokerSetupResult.setupIssues,
        recommendation: 'Ensure broker is accessible and properly configured',
        files: brokerSetupResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 6: CONTRACT PUBLISHING
  // ============================================================================

  ctx.log('info', 'Phase 6: Publishing consumer contracts to broker');

  const contractPublishing = await ctx.task(contractPublishingTask, {
    projectName,
    contractTool,
    brokerUrl: brokerSetupResult.brokerUrl,
    contracts: consumerContracts.contracts,
    consumerTestResults: consumerTestExecution,
    versioningStrategy,
    outputDir
  });

  artifacts.push(...contractPublishing.artifacts);

  // Quality Gate: Publishing success
  if (!contractPublishing.allPublished || contractPublishing.failedPublications.length > 0) {
    await ctx.breakpoint({
      question: `${contractPublishing.publishedCount}/${contractPublishing.totalContracts} contracts published. Review failures and continue?`,
      title: 'Contract Publishing Review',
      context: {
        runId: ctx.runId,
        publishedCount: contractPublishing.publishedCount,
        totalContracts: contractPublishing.totalContracts,
        failedPublications: contractPublishing.failedPublications,
        files: contractPublishing.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 7: PROVIDER VERIFICATION TESTS
  // ============================================================================

  ctx.log('info', 'Phase 7: Implementing provider verification tests');

  const providerVerification = await ctx.task(providerVerificationTask, {
    projectName,
    contractTool,
    brokerUrl: brokerSetupResult.brokerUrl,
    services: services.filter(s => s.type === 'provider' || !s.type),
    contractPairs: serviceMappingAnalysis.contractPairs,
    publishedContracts: contractPublishing.publishedContracts,
    toolConfig: toolSetup.configuration,
    outputDir
  });

  artifacts.push(...providerVerification.artifacts);

  ctx.log('info', `Provider verification tests created for ${providerVerification.providersConfigured} providers`);

  // Quality Gate: Provider verification setup
  if (providerVerification.providersConfigured < serviceMappingAnalysis.providerCount) {
    await ctx.breakpoint({
      question: `Provider verification configured for ${providerVerification.providersConfigured}/${serviceMappingAnalysis.providerCount} providers. Continue?`,
      title: 'Provider Verification Setup Review',
      context: {
        runId: ctx.runId,
        providersConfigured: providerVerification.providersConfigured,
        expectedProviders: serviceMappingAnalysis.providerCount,
        missingProviders: providerVerification.missingProviders,
        files: providerVerification.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 8: PROVIDER VERIFICATION EXECUTION
  // ============================================================================

  ctx.log('info', 'Phase 8: Running provider verification tests');

  const providerTestExecution = await ctx.task(providerVerificationTestsTask, {
    projectName,
    contractTool,
    brokerUrl: brokerSetupResult.brokerUrl,
    providerTests: providerVerification.providerTests,
    services: services.filter(s => s.type === 'provider' || !s.type),
    outputDir
  });

  artifacts.push(...providerTestExecution.artifacts);
  providerVerificationsPassing = providerTestExecution.passRate >= acceptanceCriteria.providerVerificationRate;

  // Quality Gate: Provider verification passing
  const providerPassRate = providerTestExecution.passRate;
  if (providerPassRate < acceptanceCriteria.providerVerificationRate) {
    await ctx.breakpoint({
      question: `Provider verification pass rate: ${providerPassRate}%. Target: ${acceptanceCriteria.providerVerificationRate}%. Review failures and continue?`,
      title: 'Provider Verification Pass Rate',
      context: {
        runId: ctx.runId,
        passRate: providerPassRate,
        targetRate: acceptanceCriteria.providerVerificationRate,
        totalVerifications: providerTestExecution.totalTests,
        passed: providerTestExecution.passed,
        failed: providerTestExecution.failed,
        failureDetails: providerTestExecution.failures,
        recommendation: 'Fix provider contract violations before enabling independent deployment',
        files: providerTestExecution.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 9: VERIFICATION RESULTS PUBLISHING
  // ============================================================================

  ctx.log('info', 'Phase 9: Publishing provider verification results to broker');

  const verificationPublishing = await ctx.task(verificationResultsPublishingTask, {
    projectName,
    contractTool,
    brokerUrl: brokerSetupResult.brokerUrl,
    verificationResults: providerTestExecution.results,
    services: services.filter(s => s.type === 'provider' || !s.type),
    outputDir
  });

  artifacts.push(...verificationPublishing.artifacts);

  // ============================================================================
  // PHASE 10: BREAKING CHANGE DETECTION SETUP
  // ============================================================================

  ctx.log('info', 'Phase 10: Configuring breaking change detection');

  const breakingChangeDetection = await ctx.task(breakingChangeDetectionTask, {
    projectName,
    contractTool,
    brokerUrl: brokerSetupResult.brokerUrl,
    services,
    contractPairs: serviceMappingAnalysis.contractPairs,
    versioningStrategy,
    outputDir
  });

  artifacts.push(...breakingChangeDetection.artifacts);

  // Quality Gate: Breaking change detection functional
  if (!breakingChangeDetection.detectionConfigured) {
    await ctx.breakpoint({
      question: `Breaking change detection setup completed with status: ${breakingChangeDetection.detectionConfigured}. Review configuration and approve?`,
      title: 'Breaking Change Detection Review',
      context: {
        runId: ctx.runId,
        detectionConfigured: breakingChangeDetection.detectionConfigured,
        configurationDetails: breakingChangeDetection.configuration,
        testResults: breakingChangeDetection.testResults,
        files: breakingChangeDetection.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 11: CAN-I-DEPLOY VERIFICATION (if enabled)
  // ============================================================================

  let canDeploySetup = null;
  if (enableCanDeploy) {
    ctx.log('info', 'Phase 11: Setting up can-i-deploy verification');

    canDeploySetup = await ctx.task(canDeploySetupTask, {
      projectName,
      contractTool,
      brokerUrl: brokerSetupResult.brokerUrl,
      services,
      versioningStrategy,
      outputDir
    });

    artifacts.push(...canDeploySetup.artifacts);
  }

  // ============================================================================
  // PHASE 12: PARALLEL CI/CD INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 12: Integrating contract testing into CI/CD pipelines');

  // Parallelize CI/CD integration for consumer and provider pipelines
  const [
    consumerPipelineIntegration,
    providerPipelineIntegration
  ] = await ctx.parallel.all([
    () => ctx.task(consumerCICDIntegrationTask, {
      projectName,
      contractTool,
      brokerUrl: brokerSetupResult.brokerUrl,
      consumers: services.filter(s => s.type === 'consumer' || !s.type),
      toolConfig: toolSetup.configuration,
      enableCanDeploy,
      outputDir
    }),
    () => ctx.task(providerCICDIntegrationTask, {
      projectName,
      contractTool,
      brokerUrl: brokerSetupResult.brokerUrl,
      providers: services.filter(s => s.type === 'provider' || !s.type),
      toolConfig: toolSetup.configuration,
      enableCanDeploy,
      outputDir
    })
  ]);

  artifacts.push(
    ...consumerPipelineIntegration.artifacts,
    ...providerPipelineIntegration.artifacts
  );

  const cicdIntegrated = consumerPipelineIntegration.integrated && providerPipelineIntegration.integrated;

  ctx.log('info', `CI/CD integration: Consumer=${consumerPipelineIntegration.integrated}, Provider=${providerPipelineIntegration.integrated}`);

  // Quality Gate: CI/CD integration verification
  if (!cicdIntegrated) {
    await ctx.breakpoint({
      question: `CI/CD integration: Consumer=${consumerPipelineIntegration.integrated}, Provider=${providerPipelineIntegration.integrated}. Review and approve?`,
      title: 'CI/CD Integration Review',
      context: {
        runId: ctx.runId,
        consumerIntegration: consumerPipelineIntegration,
        providerIntegration: providerPipelineIntegration,
        recommendation: 'Verify CI/CD pipelines execute contract tests and verification',
        files: [
          ...consumerPipelineIntegration.artifacts.map(a => ({ path: a.path, format: a.format || 'yaml', label: 'Consumer Pipeline' })),
          ...providerPipelineIntegration.artifacts.map(a => ({ path: a.path, format: a.format || 'yaml', label: 'Provider Pipeline' }))
        ]
      }
    });
  }

  // ============================================================================
  // PHASE 13: CONTRACT VERSIONING DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 13: Documenting contract versioning strategy');

  const versioningDocumentation = await ctx.task(versioningDocumentationTask, {
    projectName,
    versioningStrategy,
    contractTool,
    brokerUrl: brokerSetupResult.brokerUrl,
    services,
    contractPairs: serviceMappingAnalysis.contractPairs,
    breakingChangeDetection: breakingChangeDetection.configuration,
    outputDir
  });

  artifacts.push(...versioningDocumentation.artifacts);

  // ============================================================================
  // PHASE 14: INDEPENDENT DEPLOYMENT VERIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 14: Verifying independent deployment capability');

  const independentDeploymentVerification = await ctx.task(independentDeploymentVerificationTask, {
    projectName,
    contractTool,
    brokerUrl: brokerSetupResult.brokerUrl,
    services,
    contractPairs: serviceMappingAnalysis.contractPairs,
    consumerTestResults: consumerTestExecution,
    providerTestResults: providerTestExecution,
    canDeploySetup,
    outputDir
  });

  artifacts.push(...independentDeploymentVerification.artifacts);

  const independentDeploymentVerified = independentDeploymentVerification.verified;

  // Quality Gate: Independent deployment verified
  if (!independentDeploymentVerified) {
    await ctx.breakpoint({
      question: `Independent deployment verification: ${independentDeploymentVerified}. Review test results and approve?`,
      title: 'Independent Deployment Verification',
      context: {
        runId: ctx.runId,
        verified: independentDeploymentVerified,
        verificationDetails: independentDeploymentVerification.details,
        blockers: independentDeploymentVerification.blockers,
        recommendation: 'Resolve all contract violations before enabling independent deployment',
        files: independentDeploymentVerification.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 15: COMPREHENSIVE DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 15: Generating comprehensive contract testing documentation');

  const documentation = await ctx.task(contractTestingDocumentationTask, {
    projectName,
    serviceMappingAnalysis,
    toolSetup,
    consumerContracts,
    providerVerification,
    brokerSetupResult,
    breakingChangeDetection,
    canDeploySetup,
    consumerPipelineIntegration,
    providerPipelineIntegration,
    versioningDocumentation,
    independentDeploymentVerification,
    contractTool,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // ============================================================================
  // PHASE 16: FINAL ASSESSMENT AND METRICS
  // ============================================================================

  ctx.log('info', 'Phase 16: Computing final assessment and contract testing metrics');

  const finalAssessment = await ctx.task(finalAssessmentTask, {
    projectName,
    serviceMappingAnalysis,
    consumerContracts,
    consumerTestExecution,
    providerVerification,
    providerTestExecution,
    brokerSetupResult,
    breakingChangeDetection,
    canDeploySetup,
    consumerPipelineIntegration,
    providerPipelineIntegration,
    independentDeploymentVerification,
    acceptanceCriteria,
    outputDir
  });

  artifacts.push(...finalAssessment.artifacts);

  const contractCoverageScore = finalAssessment.contractCoverageScore;
  const productionReady = finalAssessment.productionReady;

  ctx.log('info', `Contract coverage: ${contractCoverageScore}%, Production ready: ${productionReady}`);

  // Final Breakpoint: Contract Testing Implementation Approval
  await ctx.breakpoint({
    question: `Contract Testing Implementation Complete for ${projectName}. Contract Coverage: ${contractCoverageScore}%, Provider Verification: ${providerPassRate}%, Production Ready: ${productionReady}. Approve for production use?`,
    title: 'Final Contract Testing Review',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        contractsCreated,
        contractCoverageScore,
        consumerPassRate: consumerTestExecution.passRate,
        providerPassRate: providerTestExecution.passRate,
        providerVerificationsPassing,
        brokerSetup,
        cicdIntegrated,
        independentDeploymentVerified,
        productionReady
      },
      acceptanceCriteria,
      verdict: finalAssessment.verdict,
      recommendation: finalAssessment.recommendation,
      files: [
        { path: documentation.mainDocPath, format: 'markdown', label: 'Contract Testing Documentation' },
        { path: finalAssessment.metricsReportPath, format: 'json', label: 'Metrics Report' },
        { path: versioningDocumentation.versioningGuidePath, format: 'markdown', label: 'Versioning Guide' },
        { path: independentDeploymentVerification.reportPath, format: 'markdown', label: 'Deployment Verification Report' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    contractTool,
    architecture,
    contractsCreated,
    contractCoverageScore,
    consumerContracts: {
      total: consumerContracts.contractsCreated,
      passRate: consumerTestExecution.passRate,
      contracts: consumerContracts.contracts.map(c => ({
        consumer: c.consumer,
        provider: c.provider,
        interactions: c.interactionCount
      }))
    },
    providerVerification: {
      providersConfigured: providerVerification.providersConfigured,
      passRate: providerTestExecution.passRate,
      passing: providerVerificationsPassing,
      providers: providerVerification.providerTests.map(p => ({
        name: p.providerName,
        consumerCount: p.consumerCount,
        verified: p.verified
      }))
    },
    brokerSetup: {
      configured: brokerSetup,
      url: brokerSetupResult.brokerUrl,
      contractsPublished: contractPublishing.publishedCount,
      verificationResultsPublished: verificationPublishing.publishedCount
    },
    breakingChangeDetection: {
      configured: breakingChangeDetection.detectionConfigured,
      testsPassing: breakingChangeDetection.testResults?.passed || false
    },
    canDeploy: canDeploySetup ? {
      enabled: true,
      configured: canDeploySetup.configured,
      servicesConfigured: canDeploySetup.servicesConfigured
    } : null,
    cicdIntegration: {
      consumer: {
        integrated: consumerPipelineIntegration.integrated,
        pipelinesConfigured: consumerPipelineIntegration.pipelinesConfigured
      },
      provider: {
        integrated: providerPipelineIntegration.integrated,
        pipelinesConfigured: providerPipelineIntegration.pipelinesConfigured
      }
    },
    independentDeployment: {
      verified: independentDeploymentVerified,
      deploymentScenarios: independentDeploymentVerification.scenariosTested,
      blockers: independentDeploymentVerification.blockers
    },
    qualityGates: {
      contractCoverageMet: contractCoverageScore >= acceptanceCriteria.contractCoverage,
      providerVerificationMet: providerPassRate >= acceptanceCriteria.providerVerificationRate,
      breakingChangeDetectionMet: breakingChangeDetection.detectionConfigured,
      independentDeploymentMet: independentDeploymentVerified
    },
    artifacts,
    documentation: {
      mainDocPath: documentation.mainDocPath,
      usageGuidePath: documentation.usageGuidePath,
      versioningGuidePath: versioningDocumentation.versioningGuidePath,
      troubleshootingPath: documentation.troubleshootingPath
    },
    finalAssessment: {
      verdict: finalAssessment.verdict,
      recommendation: finalAssessment.recommendation,
      productionReady: finalAssessment.productionReady,
      metricsReportPath: finalAssessment.metricsReportPath
    },
    duration,
    metadata: {
      processId: 'specializations/qa-testing-automation/contract-testing',
      timestamp: startTime,
      contractTool,
      versioningStrategy,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Service Dependency Mapping
export const serviceMappingTask = defineTask('service-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Service Dependency Mapping - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Microservices Architect and Integration Specialist',
      task: 'Analyze service dependencies and identify consumer-provider contract pairs',
      context: {
        projectName: args.projectName,
        services: args.services,
        architecture: args.architecture,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze provided service list and dependencies',
        '2. Identify all consumer-provider relationships',
        '3. Create contract pairs for each service interaction',
        '4. Map API endpoints and expected interactions',
        '5. Identify critical vs. non-critical service dependencies',
        '6. Calculate contract coverage percentage',
        '7. Identify uncovered dependencies requiring contracts',
        '8. Prioritize contract pairs by business criticality',
        '9. Create service dependency diagram',
        '10. Generate contract mapping documentation'
      ],
      outputFormat: 'JSON object with contract pairs and dependency analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'contractPairs', 'coveragePercentage', 'providerCount', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        contractPairs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              consumer: { type: 'string' },
              provider: { type: 'string' },
              interactionType: { type: 'string', enum: ['REST', 'GraphQL', 'gRPC', 'messaging', 'websocket'] },
              endpoints: { type: 'array', items: { type: 'string' } },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              estimatedInteractions: { type: 'number' }
            }
          }
        },
        uncoveredDependencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              consumer: { type: 'string' },
              provider: { type: 'string' },
              reason: { type: 'string' }
            }
          }
        },
        providerCount: { type: 'number', description: 'Total number of provider services' },
        consumerCount: { type: 'number', description: 'Total number of consumer services' },
        coveragePercentage: { type: 'number', description: 'Percentage of dependencies covered by contracts' },
        dependencyComplexity: { type: 'string', enum: ['low', 'medium', 'high'] },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'contract-testing', 'service-mapping', 'architecture']
}));

// Phase 2: Contract Tool Setup
export const contractToolSetupTask = defineTask('contract-tool-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Contract Tool Setup - ${args.contractTool}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Automation Engineer with Contract Testing expertise',
      task: 'Set up and configure contract testing tool for the project',
      context: {
        projectName: args.projectName,
        contractTool: args.contractTool,
        services: args.services,
        architecture: args.architecture,
        contractPairs: args.contractPairs,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Install contract testing dependencies (Pact, Spring Cloud Contract, etc.)',
        '2. Create base configuration files for the chosen tool',
        '3. Set up project structure for consumer and provider tests',
        '4. Configure test frameworks integration (Jest, JUnit, etc.)',
        '5. Create base test utilities and helpers',
        '6. Set up mock service providers for consumer tests',
        '7. Configure provider state management',
        '8. Create configuration templates for services',
        '9. Verify tool installation and configuration',
        '10. Document tool setup and configuration'
      ],
      outputFormat: 'JSON object with tool setup status and configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['toolConfigured', 'configuration', 'configurationIssues', 'artifacts'],
      properties: {
        toolConfigured: { type: 'boolean' },
        configuration: {
          type: 'object',
          properties: {
            toolVersion: { type: 'string' },
            configFiles: { type: 'array', items: { type: 'string' } },
            testFramework: { type: 'string' },
            mockServerPort: { type: 'number' }
          }
        },
        dependenciesInstalled: { type: 'array', items: { type: 'string' } },
        projectStructureCreated: { type: 'boolean' },
        configurationIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              resolution: { type: 'string' }
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
  labels: ['agent', 'contract-testing', 'tool-setup', 'configuration']
}));

// Phase 3: Consumer Contract Definition
export const consumerContractDefinitionTask = defineTask('consumer-contract-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Consumer Contract Definitions - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Contract Testing Specialist',
      task: 'Create consumer contract definitions based on service expectations',
      context: {
        projectName: args.projectName,
        contractTool: args.contractTool,
        contractPairs: args.contractPairs,
        services: args.services,
        toolConfig: args.toolConfig,
        outputDir: args.outputDir
      },
      instructions: [
        '1. For each consumer service, identify provider interactions',
        '2. Define expected request format (HTTP method, path, headers, body)',
        '3. Define expected response format (status, headers, body schema)',
        '4. Create contract DSL using tool-specific syntax (Pact, etc.)',
        '5. Define provider states required for each interaction',
        '6. Add request/response matchers for flexible matching',
        '7. Document consumer expectations and assumptions',
        '8. Create example interactions for documentation',
        '9. Validate contract syntax and structure',
        '10. Generate contract definition files'
      ],
      outputFormat: 'JSON object with consumer contracts'
    },
    outputSchema: {
      type: 'object',
      required: ['contractsCreated', 'contracts', 'missingContracts', 'artifacts'],
      properties: {
        contractsCreated: { type: 'number' },
        contracts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              consumer: { type: 'string' },
              provider: { type: 'string' },
              contractFilePath: { type: 'string' },
              interactionCount: { type: 'number' },
              interactions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    description: { type: 'string' },
                    providerState: { type: 'string' },
                    request: { type: 'object' },
                    response: { type: 'object' }
                  }
                }
              }
            }
          }
        },
        missingContracts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              consumer: { type: 'string' },
              provider: { type: 'string' },
              reason: { type: 'string' }
            }
          }
        },
        validationErrors: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'contract-testing', 'consumer-contracts', 'contract-definition']
}));

// Phase 4: Consumer Contract Tests
export const consumerContractTestsTask = defineTask('consumer-contract-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Consumer Contract Tests Execution`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Execution Engineer',
      task: 'Execute consumer contract tests and generate contract files',
      context: {
        projectName: args.projectName,
        contractTool: args.contractTool,
        consumerContracts: args.consumerContracts,
        toolConfig: args.toolConfig,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Set up mock provider server for consumer tests',
        '2. Run consumer contract tests for each contract',
        '3. Verify mock provider behaves as specified in contracts',
        '4. Generate Pact files (JSON contract artifacts)',
        '5. Capture test execution results (pass/fail)',
        '6. Identify contract definition errors',
        '7. Validate generated Pact files against schema',
        '8. Calculate pass rate for consumer tests',
        '9. Generate test execution report',
        '10. Store contract files for publishing'
      ],
      outputFormat: 'JSON object with consumer test results'
    },
    outputSchema: {
      type: 'object',
      required: ['totalTests', 'passed', 'failed', 'passRate', 'pactFilesGenerated', 'artifacts'],
      properties: {
        totalTests: { type: 'number' },
        passed: { type: 'number' },
        failed: { type: 'number' },
        passRate: { type: 'number', description: 'Pass rate percentage' },
        pactFilesGenerated: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              consumer: { type: 'string' },
              provider: { type: 'string' },
              pactFilePath: { type: 'string' },
              interactions: { type: 'number' }
            }
          }
        },
        failures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              consumer: { type: 'string' },
              provider: { type: 'string' },
              interaction: { type: 'string' },
              error: { type: 'string' }
            }
          }
        },
        mockServerIssues: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'contract-testing', 'consumer-tests', 'test-execution']
}));

// Phase 5: Contract Broker Setup
export const contractBrokerSetupTask = defineTask('contract-broker-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Contract Broker Setup`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps Engineer with Contract Testing experience',
      task: 'Set up contract broker for contract sharing and verification',
      context: {
        projectName: args.projectName,
        contractTool: args.contractTool,
        brokerUrl: args.brokerUrl,
        services: args.services,
        contracts: args.contracts,
        versioningStrategy: args.versioningStrategy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Set up Pact Broker (hosted or self-hosted)',
        '2. Configure broker authentication and access control',
        '3. Create broker integration in services',
        '4. Configure versioning strategy (tags, branches)',
        '5. Set up webhook notifications for contract changes',
        '6. Configure can-i-deploy checks',
        '7. Create broker API clients for services',
        '8. Test broker connectivity from services',
        '9. Configure broker UI access for team',
        '10. Document broker setup and usage'
      ],
      outputFormat: 'JSON object with broker setup status'
    },
    outputSchema: {
      type: 'object',
      required: ['brokerReady', 'brokerUrl', 'setupIssues', 'artifacts'],
      properties: {
        brokerReady: { type: 'boolean' },
        brokerUrl: { type: 'string' },
        brokerType: { type: 'string', enum: ['pactflow', 'pact-broker-self-hosted', 'spring-cloud-contract'] },
        authenticationConfigured: { type: 'boolean' },
        webhooksConfigured: { type: 'boolean' },
        servicesIntegrated: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              serviceName: { type: 'string' },
              integrated: { type: 'boolean' },
              apiClientPath: { type: 'string' }
            }
          }
        },
        setupIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              resolution: { type: 'string' }
            }
          }
        },
        connectivityTested: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'contract-testing', 'broker-setup', 'infrastructure']
}));

// Phase 6: Contract Publishing
export const contractPublishingTask = defineTask('contract-publishing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Contract Publishing to Broker`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Contract Testing Engineer',
      task: 'Publish consumer contracts to broker with appropriate versioning',
      context: {
        projectName: args.projectName,
        contractTool: args.contractTool,
        brokerUrl: args.brokerUrl,
        contracts: args.contracts,
        consumerTestResults: args.consumerTestResults,
        versioningStrategy: args.versioningStrategy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. For each passing consumer test, retrieve generated Pact file',
        '2. Determine version/tag based on versioning strategy',
        '3. Publish Pact file to broker with metadata',
        '4. Tag contract with appropriate labels (dev, test, prod)',
        '5. Verify successful publication',
        '6. Handle publication failures and retries',
        '7. Create contract version history',
        '8. Notify team of new contracts published',
        '9. Generate publication report',
        '10. Verify contracts visible in broker UI'
      ],
      outputFormat: 'JSON object with publication results'
    },
    outputSchema: {
      type: 'object',
      required: ['allPublished', 'publishedCount', 'totalContracts', 'failedPublications', 'artifacts'],
      properties: {
        allPublished: { type: 'boolean' },
        publishedCount: { type: 'number' },
        totalContracts: { type: 'number' },
        publishedContracts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              consumer: { type: 'string' },
              provider: { type: 'string' },
              version: { type: 'string' },
              tags: { type: 'array', items: { type: 'string' } },
              brokerUrl: { type: 'string' }
            }
          }
        },
        failedPublications: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              consumer: { type: 'string' },
              provider: { type: 'string' },
              error: { type: 'string' },
              reason: { type: 'string' }
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
  labels: ['agent', 'contract-testing', 'contract-publishing', 'broker']
}));

// Phase 7: Provider Verification
export const providerVerificationTask = defineTask('provider-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Provider Verification Tests Implementation`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Provider Verification Specialist',
      task: 'Implement provider verification tests to validate against consumer contracts',
      context: {
        projectName: args.projectName,
        contractTool: args.contractTool,
        brokerUrl: args.brokerUrl,
        services: args.services,
        contractPairs: args.contractPairs,
        publishedContracts: args.publishedContracts,
        toolConfig: args.toolConfig,
        outputDir: args.outputDir
      },
      instructions: [
        '1. For each provider service, identify consumer contracts',
        '2. Create provider verification test suite',
        '3. Configure provider state management',
        '4. Implement provider state setup/teardown hooks',
        '5. Configure broker integration to fetch contracts',
        '6. Set up provider application for testing',
        '7. Configure verification against specific consumer versions',
        '8. Add verification result publishing',
        '9. Create provider verification scripts',
        '10. Document provider verification setup'
      ],
      outputFormat: 'JSON object with provider verification setup'
    },
    outputSchema: {
      type: 'object',
      required: ['providersConfigured', 'providerTests', 'missingProviders', 'artifacts'],
      properties: {
        providersConfigured: { type: 'number' },
        providerTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              providerName: { type: 'string' },
              testFilePath: { type: 'string' },
              consumerCount: { type: 'number' },
              consumers: { type: 'array', items: { type: 'string' } },
              stateHandlers: { type: 'array', items: { type: 'string' } },
              verified: { type: 'boolean' }
            }
          }
        },
        missingProviders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              providerName: { type: 'string' },
              reason: { type: 'string' }
            }
          }
        },
        stateManagementConfigured: { type: 'boolean' },
        brokerIntegrationConfigured: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'contract-testing', 'provider-verification', 'test-implementation']
}));

// Phase 8: Provider Verification Tests Execution
export const providerVerificationTestsTask = defineTask('provider-verification-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Provider Verification Tests Execution`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Execution Engineer',
      task: 'Execute provider verification tests against published contracts',
      context: {
        projectName: args.projectName,
        contractTool: args.contractTool,
        brokerUrl: args.brokerUrl,
        providerTests: args.providerTests,
        services: args.services,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Start provider applications in test mode',
        '2. Fetch contracts from broker for each provider',
        '3. Run provider verification tests',
        '4. Execute provider state setup for each interaction',
        '5. Verify provider responses match contract expectations',
        '6. Capture verification results (pass/fail per interaction)',
        '7. Identify contract violations',
        '8. Generate detailed failure reports',
        '9. Calculate pass rate across all providers',
        '10. Prepare verification results for publishing'
      ],
      outputFormat: 'JSON object with provider verification results'
    },
    outputSchema: {
      type: 'object',
      required: ['totalTests', 'passed', 'failed', 'passRate', 'results', 'artifacts'],
      properties: {
        totalTests: { type: 'number' },
        passed: { type: 'number' },
        failed: { type: 'number' },
        passRate: { type: 'number', description: 'Pass rate percentage' },
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              provider: { type: 'string' },
              consumer: { type: 'string' },
              interactionsPassed: { type: 'number' },
              interactionsFailed: { type: 'number' },
              verified: { type: 'boolean' },
              resultFilePath: { type: 'string' }
            }
          }
        },
        failures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              provider: { type: 'string' },
              consumer: { type: 'string' },
              interaction: { type: 'string' },
              error: { type: 'string' },
              expected: { type: 'object' },
              actual: { type: 'object' }
            }
          }
        },
        contractViolations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              provider: { type: 'string' },
              consumer: { type: 'string' },
              violation: { type: 'string' },
              severity: { type: 'string', enum: ['breaking', 'non-breaking'] }
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
  labels: ['agent', 'contract-testing', 'provider-verification', 'test-execution']
}));

// Phase 9: Verification Results Publishing
export const verificationResultsPublishingTask = defineTask('verification-results-publishing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Verification Results Publishing`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Contract Testing Engineer',
      task: 'Publish provider verification results to broker',
      context: {
        projectName: args.projectName,
        contractTool: args.contractTool,
        brokerUrl: args.brokerUrl,
        verificationResults: args.verificationResults,
        services: args.services,
        outputDir: args.outputDir
      },
      instructions: [
        '1. For each provider verification result, prepare metadata',
        '2. Determine provider version being verified',
        '3. Publish verification results to broker',
        '4. Tag verification with build/deployment identifiers',
        '5. Update contract verification status in broker',
        '6. Handle publishing failures and retries',
        '7. Verify results visible in broker UI',
        '8. Notify team of verification status',
        '9. Update can-i-deploy eligibility',
        '10. Generate publishing report'
      ],
      outputFormat: 'JSON object with publishing results'
    },
    outputSchema: {
      type: 'object',
      required: ['publishedCount', 'totalResults', 'publishingFailures', 'artifacts'],
      properties: {
        publishedCount: { type: 'number' },
        totalResults: { type: 'number' },
        publishedResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              provider: { type: 'string' },
              providerVersion: { type: 'string' },
              consumer: { type: 'string' },
              verified: { type: 'boolean' },
              brokerUrl: { type: 'string' }
            }
          }
        },
        publishingFailures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              provider: { type: 'string' },
              consumer: { type: 'string' },
              error: { type: 'string' }
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
  labels: ['agent', 'contract-testing', 'verification-publishing', 'broker']
}));

// Phase 10: Breaking Change Detection
export const breakingChangeDetectionTask = defineTask('breaking-change-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Breaking Change Detection Setup`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'API Versioning Specialist',
      task: 'Configure breaking change detection for contract evolution',
      context: {
        projectName: args.projectName,
        contractTool: args.contractTool,
        brokerUrl: args.brokerUrl,
        services: args.services,
        contractPairs: args.contractPairs,
        versioningStrategy: args.versioningStrategy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure contract comparison rules',
        '2. Define what constitutes a breaking change',
        '3. Set up automated breaking change detection',
        '4. Configure broker webhook for contract changes',
        '5. Implement breaking change alerts',
        '6. Create breaking change analysis reports',
        '7. Set up version compatibility matrix',
        '8. Test breaking change detection with scenarios',
        '9. Configure rollback procedures',
        '10. Document breaking change policies'
      ],
      outputFormat: 'JSON object with breaking change detection configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['detectionConfigured', 'configuration', 'testResults', 'artifacts'],
      properties: {
        detectionConfigured: { type: 'boolean' },
        configuration: {
          type: 'object',
          properties: {
            comparisonRules: { type: 'array', items: { type: 'string' } },
            breakingChangeDefinition: { type: 'array', items: { type: 'string' } },
            webhooksConfigured: { type: 'boolean' },
            alertChannels: { type: 'array', items: { type: 'string' } }
          }
        },
        testResults: {
          type: 'object',
          properties: {
            scenariosTested: { type: 'number' },
            passed: { type: 'boolean' },
            detectedBreakingChanges: { type: 'array', items: { type: 'string' } }
          }
        },
        compatibilityMatrix: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              consumer: { type: 'string' },
              consumerVersion: { type: 'string' },
              provider: { type: 'string' },
              providerVersion: { type: 'string' },
              compatible: { type: 'boolean' }
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
  labels: ['agent', 'contract-testing', 'breaking-changes', 'versioning']
}));

// Phase 11: Can-I-Deploy Setup
export const canDeploySetupTask = defineTask('can-deploy-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Can-I-Deploy Verification Setup`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps Engineer with Contract Testing experience',
      task: 'Set up can-i-deploy checks for safe deployment verification',
      context: {
        projectName: args.projectName,
        contractTool: args.contractTool,
        brokerUrl: args.brokerUrl,
        services: args.services,
        versioningStrategy: args.versioningStrategy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure can-i-deploy CLI/API integration',
        '2. Define deployment environments (dev, test, prod)',
        '3. Set up environment-specific verification rules',
        '4. Create pre-deployment check scripts',
        '5. Configure deployment gate policies',
        '6. Test can-i-deploy checks with scenarios',
        '7. Create deployment readiness dashboard',
        '8. Set up automated deployment blocking',
        '9. Document can-i-deploy workflow',
        '10. Train team on can-i-deploy usage'
      ],
      outputFormat: 'JSON object with can-i-deploy setup'
    },
    outputSchema: {
      type: 'object',
      required: ['configured', 'servicesConfigured', 'environments', 'artifacts'],
      properties: {
        configured: { type: 'boolean' },
        servicesConfigured: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              serviceName: { type: 'string' },
              canDeployScriptPath: { type: 'string' },
              environments: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        environments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              verificationRules: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        testScenarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              canDeploy: { type: 'boolean' },
              reason: { type: 'string' }
            }
          }
        },
        deploymentGatePolicies: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'contract-testing', 'can-deploy', 'deployment-gates']
}));

// Phase 12: Consumer CI/CD Integration
export const consumerCICDIntegrationTask = defineTask('consumer-cicd-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Consumer CI/CD Pipeline Integration`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps Engineer',
      task: 'Integrate consumer contract testing into CI/CD pipelines',
      context: {
        projectName: args.projectName,
        contractTool: args.contractTool,
        brokerUrl: args.brokerUrl,
        consumers: args.consumers,
        toolConfig: args.toolConfig,
        enableCanDeploy: args.enableCanDeploy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Add contract test execution to consumer build pipeline',
        '2. Configure contract publishing on successful tests',
        '3. Add version tagging based on branch/environment',
        '4. Set up can-i-deploy checks before deployment',
        '5. Configure failure notifications',
        '6. Add contract test reports to build artifacts',
        '7. Set up contract verification badges',
        '8. Test pipeline with sample commits',
        '9. Create pipeline documentation',
        '10. Configure pipeline for multiple consumers'
      ],
      outputFormat: 'JSON object with consumer pipeline integration'
    },
    outputSchema: {
      type: 'object',
      required: ['integrated', 'pipelinesConfigured', 'integrationIssues', 'artifacts'],
      properties: {
        integrated: { type: 'boolean' },
        pipelinesConfigured: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              consumer: { type: 'string' },
              pipelineFilePath: { type: 'string' },
              stages: { type: 'array', items: { type: 'string' } },
              canDeployEnabled: { type: 'boolean' }
            }
          }
        },
        integrationIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              consumer: { type: 'string' },
              issue: { type: 'string' },
              resolution: { type: 'string' }
            }
          }
        },
        pipelineTestResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              consumer: { type: 'string' },
              testPassed: { type: 'boolean' },
              publishedToBroker: { type: 'boolean' }
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
  labels: ['agent', 'contract-testing', 'cicd', 'consumer-pipeline']
}));

// Phase 12: Provider CI/CD Integration
export const providerCICDIntegrationTask = defineTask('provider-cicd-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Provider CI/CD Pipeline Integration`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps Engineer',
      task: 'Integrate provider verification into CI/CD pipelines',
      context: {
        projectName: args.projectName,
        contractTool: args.contractTool,
        brokerUrl: args.brokerUrl,
        providers: args.providers,
        toolConfig: args.toolConfig,
        enableCanDeploy: args.enableCanDeploy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Add provider verification to provider build pipeline',
        '2. Configure fetching contracts from broker',
        '3. Add verification result publishing',
        '4. Set up can-i-deploy checks for providers',
        '5. Configure failure notifications and blocking',
        '6. Add verification reports to build artifacts',
        '7. Set up verification status badges',
        '8. Test pipeline with sample commits',
        '9. Create pipeline documentation',
        '10. Configure pipeline for multiple providers'
      ],
      outputFormat: 'JSON object with provider pipeline integration'
    },
    outputSchema: {
      type: 'object',
      required: ['integrated', 'pipelinesConfigured', 'integrationIssues', 'artifacts'],
      properties: {
        integrated: { type: 'boolean' },
        pipelinesConfigured: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              provider: { type: 'string' },
              pipelineFilePath: { type: 'string' },
              stages: { type: 'array', items: { type: 'string' } },
              canDeployEnabled: { type: 'boolean' }
            }
          }
        },
        integrationIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              provider: { type: 'string' },
              issue: { type: 'string' },
              resolution: { type: 'string' }
            }
          }
        },
        pipelineTestResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              provider: { type: 'string' },
              verificationPassed: { type: 'boolean' },
              resultsPublished: { type: 'boolean' }
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
  labels: ['agent', 'contract-testing', 'cicd', 'provider-pipeline']
}));

// Phase 13: Versioning Documentation
export const versioningDocumentationTask = defineTask('versioning-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Contract Versioning Documentation`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Documentation Specialist',
      task: 'Document contract versioning strategy and guidelines',
      context: {
        projectName: args.projectName,
        versioningStrategy: args.versioningStrategy,
        contractTool: args.contractTool,
        brokerUrl: args.brokerUrl,
        services: args.services,
        contractPairs: args.contractPairs,
        breakingChangeDetection: args.breakingChangeDetection,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Document versioning strategy (semantic, git-sha, timestamp)',
        '2. Explain version tagging conventions',
        '3. Document contract evolution best practices',
        '4. Create guidelines for avoiding breaking changes',
        '5. Document breaking change procedures',
        '6. Explain backward compatibility requirements',
        '7. Create version migration guides',
        '8. Document rollback procedures',
        '9. Create FAQs for versioning questions',
        '10. Provide versioning examples and scenarios'
      ],
      outputFormat: 'JSON object with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['versioningGuidePath', 'evolutionBestPractices', 'artifacts'],
      properties: {
        versioningGuidePath: { type: 'string' },
        evolutionBestPractices: { type: 'array', items: { type: 'string' } },
        breakingChangeProcedures: { type: 'array', items: { type: 'string' } },
        migrationGuides: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              path: { type: 'string' }
            }
          }
        },
        versioningExamples: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'contract-testing', 'documentation', 'versioning']
}));

// Phase 14: Independent Deployment Verification
export const independentDeploymentVerificationTask = defineTask('independent-deployment-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 14: Independent Deployment Verification`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'QA Lead and Deployment Specialist',
      task: 'Verify independent deployment capability using contract testing',
      context: {
        projectName: args.projectName,
        contractTool: args.contractTool,
        brokerUrl: args.brokerUrl,
        services: args.services,
        contractPairs: args.contractPairs,
        consumerTestResults: args.consumerTestResults,
        providerTestResults: args.providerTestResults,
        canDeploySetup: args.canDeploySetup,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create independent deployment test scenarios',
        '2. Scenario 1: Deploy consumer without provider change',
        '3. Scenario 2: Deploy provider without consumer change',
        '4. Scenario 3: Deploy both with compatible changes',
        '5. Scenario 4: Attempt deploy with breaking changes (should fail)',
        '6. Verify can-i-deploy checks work correctly',
        '7. Test rollback scenarios',
        '8. Verify backward compatibility maintained',
        '9. Identify deployment blockers',
        '10. Generate deployment verification report'
      ],
      outputFormat: 'JSON object with verification results'
    },
    outputSchema: {
      type: 'object',
      required: ['verified', 'scenariosTested', 'blockers', 'reportPath', 'artifacts'],
      properties: {
        verified: { type: 'boolean' },
        scenariosTested: { type: 'number' },
        scenarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              passed: { type: 'boolean' },
              details: { type: 'string' }
            }
          }
        },
        details: {
          type: 'object',
          properties: {
            consumerIndependence: { type: 'boolean' },
            providerIndependence: { type: 'boolean' },
            breakingChangesPrevented: { type: 'boolean' },
            rollbackTested: { type: 'boolean' }
          }
        },
        blockers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              service: { type: 'string' },
              blocker: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              resolution: { type: 'string' }
            }
          }
        },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'contract-testing', 'deployment-verification', 'independence']
}));

// Phase 15: Contract Testing Documentation
export const contractTestingDocumentationTask = defineTask('contract-testing-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 15: Contract Testing Documentation`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Documentation Specialist',
      task: 'Generate comprehensive contract testing documentation',
      context: {
        projectName: args.projectName,
        serviceMappingAnalysis: args.serviceMappingAnalysis,
        toolSetup: args.toolSetup,
        consumerContracts: args.consumerContracts,
        providerVerification: args.providerVerification,
        brokerSetupResult: args.brokerSetupResult,
        breakingChangeDetection: args.breakingChangeDetection,
        canDeploySetup: args.canDeploySetup,
        consumerPipelineIntegration: args.consumerPipelineIntegration,
        providerPipelineIntegration: args.providerPipelineIntegration,
        versioningDocumentation: args.versioningDocumentation,
        independentDeploymentVerification: args.independentDeploymentVerification,
        contractTool: args.contractTool,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create contract testing overview document',
        '2. Document architecture and service dependencies',
        '3. Write consumer contract testing guide',
        '4. Write provider verification guide',
        '5. Document broker usage and management',
        '6. Create troubleshooting guide',
        '7. Write contribution guidelines for new contracts',
        '8. Document CI/CD integration steps',
        '9. Create quick start guide',
        '10. Generate README with examples'
      ],
      outputFormat: 'JSON object with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['mainDocPath', 'usageGuidePath', 'troubleshootingPath', 'artifacts'],
      properties: {
        mainDocPath: { type: 'string', description: 'Main contract testing documentation' },
        usageGuidePath: { type: 'string', description: 'How to use contract testing' },
        consumerGuidePath: { type: 'string', description: 'Consumer contract guide' },
        providerGuidePath: { type: 'string', description: 'Provider verification guide' },
        brokerGuidePath: { type: 'string', description: 'Broker usage guide' },
        troubleshootingPath: { type: 'string', description: 'Troubleshooting guide' },
        contributionGuidePath: { type: 'string', description: 'How to add new contracts' },
        cicdGuidePath: { type: 'string', description: 'CI/CD integration guide' },
        quickStartPath: { type: 'string', description: 'Quick start guide' },
        readmePath: { type: 'string', description: 'README with examples' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'contract-testing', 'documentation', 'technical-writing']
}));

// Phase 16: Final Assessment
export const finalAssessmentTask = defineTask('final-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 16: Final Assessment and Metrics`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'QA Lead and Contract Testing Expert',
      task: 'Conduct final assessment of contract testing implementation',
      context: {
        projectName: args.projectName,
        serviceMappingAnalysis: args.serviceMappingAnalysis,
        consumerContracts: args.consumerContracts,
        consumerTestExecution: args.consumerTestExecution,
        providerVerification: args.providerVerification,
        providerTestExecution: args.providerTestExecution,
        brokerSetupResult: args.brokerSetupResult,
        breakingChangeDetection: args.breakingChangeDetection,
        canDeploySetup: args.canDeploySetup,
        consumerPipelineIntegration: args.consumerPipelineIntegration,
        providerPipelineIntegration: args.providerPipelineIntegration,
        independentDeploymentVerification: args.independentDeploymentVerification,
        acceptanceCriteria: args.acceptanceCriteria,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate contract coverage across all services',
        '2. Assess consumer contract quality and completeness',
        '3. Assess provider verification success rate',
        '4. Evaluate broker setup and integration',
        '5. Review breaking change detection effectiveness',
        '6. Assess can-i-deploy functionality',
        '7. Evaluate CI/CD integration completeness',
        '8. Verify independent deployment capability',
        '9. Compare results against acceptance criteria',
        '10. Provide production readiness verdict and recommendations'
      ],
      outputFormat: 'JSON object with final assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['contractCoverageScore', 'productionReady', 'verdict', 'recommendation', 'artifacts'],
      properties: {
        contractCoverageScore: { type: 'number', minimum: 0, maximum: 100 },
        consumerQualityScore: { type: 'number', minimum: 0, maximum: 100 },
        providerVerificationScore: { type: 'number', minimum: 0, maximum: 100 },
        integrationCompletenessScore: { type: 'number', minimum: 0, maximum: 100 },
        productionReady: { type: 'boolean' },
        acceptanceCriteriaMet: {
          type: 'object',
          properties: {
            contractCoverage: { type: 'boolean' },
            providerVerificationRate: { type: 'boolean' },
            breakingChangeDetection: { type: 'boolean' },
            independentDeployment: { type: 'boolean' }
          }
        },
        verdict: { type: 'string' },
        recommendation: { type: 'string' },
        strengths: { type: 'array', items: { type: 'string' } },
        areasForImprovement: { type: 'array', items: { type: 'string' } },
        nextSteps: { type: 'array', items: { type: 'string' } },
        metrics: {
          type: 'object',
          properties: {
            totalContracts: { type: 'number' },
            consumerPassRate: { type: 'number' },
            providerPassRate: { type: 'number' },
            brokerIntegrated: { type: 'boolean' },
            cicdIntegrated: { type: 'boolean' },
            independentDeploymentVerified: { type: 'boolean' }
          }
        },
        metricsReportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'contract-testing', 'assessment', 'metrics']
}));
