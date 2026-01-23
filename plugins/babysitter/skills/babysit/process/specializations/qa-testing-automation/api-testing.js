/**
 * @process specializations/qa-testing-automation/api-testing
 * @description API Test Automation Suite - Comprehensive API test automation covering REST/GraphQL endpoints,
 * contract testing, schema validation, performance testing, security testing, and integration with CI/CD pipelines
 * following industry best practices for API quality assurance.
 * @inputs { projectName: string, apiBaseUrl: string, apiType?: string, endpoints?: array, authType?: string, testScope?: array, performanceCriteria?: object }
 * @outputs { success: boolean, testSuiteStats: object, apiCoverage: object, performanceResults: object, securityFindings: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/qa-testing-automation/api-testing', {
 *   projectName: 'E-Commerce API',
 *   apiBaseUrl: 'https://api.example.com/v1',
 *   apiType: 'REST',
 *   endpoints: [
 *     { path: '/users', methods: ['GET', 'POST'] },
 *     { path: '/products', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
 *     { path: '/orders', methods: ['GET', 'POST'] }
 *   ],
 *   authType: 'Bearer',
 *   testScope: ['functional', 'contract', 'performance', 'security'],
 *   performanceCriteria: { maxResponseTime: 200, throughput: 1000 },
 *   securityScans: ['authentication', 'authorization', 'injection', 'rate-limiting']
 * });
 *
 * @references
 * - REST API Testing: https://restfulapi.net/rest-api-testing/
 * - Contract Testing: https://docs.pact.io/
 * - API Security: https://owasp.org/www-project-api-security/
 * - Postman Testing: https://learning.postman.com/docs/writing-scripts/test-scripts/
 * - Supertest: https://github.com/ladjs/supertest
 * - Swagger/OpenAPI: https://swagger.io/specification/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    apiBaseUrl,
    apiType = 'REST', // 'REST', 'GraphQL', 'gRPC', 'SOAP'
    endpoints = [],
    authType = 'Bearer', // 'Bearer', 'Basic', 'OAuth2', 'API-Key', 'None'
    testScope = ['functional', 'contract', 'performance', 'security'],
    performanceCriteria = {
      maxResponseTime: 200, // milliseconds
      throughput: 1000, // requests per second
      successRate: 99.5 // percentage
    },
    securityScans = ['authentication', 'authorization', 'injection', 'rate-limiting'],
    contractTestingEnabled = true,
    schemaValidationEnabled = true,
    mockServerEnabled = false,
    outputDir = 'api-test-suite-output',
    cicdPlatform = 'GitHub Actions',
    acceptanceCriteria = {
      testCoverage: 90,
      passRate: 95,
      performancePassRate: 90,
      securityIssues: 0
    }
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let testSuiteStats = {};
  let apiCoverage = {};
  let performanceResults = {};
  let securityFindings = [];

  ctx.log('info', `Starting API Test Automation Suite for ${projectName}`);
  ctx.log('info', `API Base URL: ${apiBaseUrl}, API Type: ${apiType}`);
  ctx.log('info', `Test Scope: ${testScope.join(', ')}`);

  // ============================================================================
  // PHASE 1: API DISCOVERY AND DOCUMENTATION ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Discovering and analyzing API endpoints');

  const apiDiscovery = await ctx.task(apiDiscoveryTask, {
    projectName,
    apiBaseUrl,
    apiType,
    endpoints,
    authType,
    outputDir
  });

  if (!apiDiscovery.success || apiDiscovery.discoveredEndpoints.length === 0) {
    return {
      success: false,
      error: 'Failed to discover API endpoints',
      details: apiDiscovery,
      metadata: {
        processId: 'specializations/qa-testing-automation/api-testing',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...apiDiscovery.artifacts);

  // Quality Gate: Minimum endpoint coverage
  if (apiDiscovery.discoveredEndpoints.length < 5 && endpoints.length === 0) {
    await ctx.breakpoint({
      question: `Only ${apiDiscovery.discoveredEndpoints.length} API endpoints discovered. This may indicate incomplete API discovery. Review and approve to continue?`,
      title: 'API Endpoint Discovery Review',
      context: {
        runId: ctx.runId,
        discoveredEndpoints: apiDiscovery.discoveredEndpoints,
        apiDocumentation: apiDiscovery.apiDocumentation,
        recommendation: 'Verify all critical endpoints are included',
        files: apiDiscovery.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 2: SCHEMA VALIDATION AND CONTRACT DEFINITION
  // ============================================================================

  if (schemaValidationEnabled) {
    ctx.log('info', 'Phase 2: Extracting API schemas and defining contracts');

    const schemaExtraction = await ctx.task(schemaExtractionTask, {
      projectName,
      apiBaseUrl,
      apiType,
      discoveredEndpoints: apiDiscovery.discoveredEndpoints,
      apiDocumentation: apiDiscovery.apiDocumentation,
      outputDir
    });

    artifacts.push(...schemaExtraction.artifacts);

    // Quality Gate: Schema completeness
    const schemaCompleteness = (schemaExtraction.schemasExtracted / apiDiscovery.discoveredEndpoints.length) * 100;
    if (schemaCompleteness < 80) {
      await ctx.breakpoint({
        question: `Schema completeness: ${schemaCompleteness.toFixed(0)}%. ${schemaExtraction.schemasExtracted}/${apiDiscovery.discoveredEndpoints.length} endpoints have schemas. Below 80% threshold. Continue?`,
        title: 'Schema Completeness Review',
        context: {
          runId: ctx.runId,
          schemaCompleteness,
          schemasExtracted: schemaExtraction.schemasExtracted,
          totalEndpoints: apiDiscovery.discoveredEndpoints.length,
          missingSchemas: schemaExtraction.missingSchemas,
          files: schemaExtraction.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
        }
      });
    }
  }

  // ============================================================================
  // PHASE 3: TEST FRAMEWORK SETUP
  // ============================================================================

  ctx.log('info', 'Phase 3: Setting up API test automation framework');

  const frameworkSetup = await ctx.task(apiTestFrameworkSetupTask, {
    projectName,
    apiType,
    authType,
    testScope,
    cicdPlatform,
    outputDir
  });

  artifacts.push(...frameworkSetup.artifacts);

  if (!frameworkSetup.success) {
    return {
      success: false,
      error: 'Failed to set up API test framework',
      details: frameworkSetup,
      metadata: {
        processId: 'specializations/qa-testing-automation/api-testing',
        timestamp: startTime
      }
    };
  }

  // ============================================================================
  // PHASE 4: TEST DATA AND FIXTURES CREATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Creating test data, fixtures, and factories');

  const testDataCreation = await ctx.task(apiTestDataCreationTask, {
    projectName,
    apiType,
    discoveredEndpoints: apiDiscovery.discoveredEndpoints,
    schemas: schemaValidationEnabled ? apiDiscovery.schemas : [],
    authType,
    outputDir
  });

  artifacts.push(...testDataCreation.artifacts);

  // Quality Gate: Test data availability
  if (!testDataCreation.dataReady || testDataCreation.dataGaps.length > 0) {
    await ctx.breakpoint({
      question: `Test data setup completed with ${testDataCreation.dataGaps.length} gaps. Review data gaps and approve to continue?`,
      title: 'Test Data Review',
      context: {
        runId: ctx.runId,
        dataReady: testDataCreation.dataReady,
        dataGaps: testDataCreation.dataGaps,
        availableData: testDataCreation.availableData,
        files: testDataCreation.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 5: FUNCTIONAL TEST IMPLEMENTATION (PARALLEL)
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing functional API tests in parallel');

  // Group endpoints by category for parallel implementation
  const endpointCategories = apiDiscovery.endpointCategories || {
    authentication: [],
    crud: [],
    search: [],
    business: []
  };

  const functionalTestTasks = Object.entries(endpointCategories)
    .filter(([_, endpoints]) => endpoints.length > 0)
    .map(([category, endpoints]) =>
      () => ctx.task(functionalTestImplementationTask, {
        projectName,
        category,
        endpoints,
        apiType,
        authType,
        testData: testDataCreation.testDatasets,
        frameworkSetup,
        outputDir
      })
    );

  const functionalTestResults = await ctx.parallel.all(functionalTestTasks);

  artifacts.push(...functionalTestResults.flatMap(r => r.artifacts));

  const totalFunctionalTests = functionalTestResults.reduce((sum, r) => sum + r.testCount, 0);
  ctx.log('info', `Total functional tests implemented: ${totalFunctionalTests}`);

  // ============================================================================
  // PHASE 6: CONTRACT TESTING IMPLEMENTATION
  // ============================================================================

  let contractTestResults = null;
  if (contractTestingEnabled && testScope.includes('contract')) {
    ctx.log('info', 'Phase 6: Implementing consumer-driven contract tests');

    contractTestResults = await ctx.task(contractTestImplementationTask, {
      projectName,
      apiBaseUrl,
      apiType,
      discoveredEndpoints: apiDiscovery.discoveredEndpoints,
      schemas: schemaValidationEnabled ? apiDiscovery.schemas : [],
      frameworkSetup,
      outputDir
    });

    artifacts.push(...contractTestResults.artifacts);
  }

  // ============================================================================
  // PHASE 7: INITIAL TEST EXECUTION
  // ============================================================================

  ctx.log('info', 'Phase 7: Running initial test execution');

  const initialExecution = await ctx.task(apiTestExecutionTask, {
    projectName,
    apiBaseUrl,
    testScope: ['functional'],
    frameworkSetup,
    outputDir,
    executionType: 'initial'
  });

  artifacts.push(...initialExecution.artifacts);

  // Quality Gate: Initial test pass rate
  const initialPassRate = initialExecution.passRate;
  if (initialPassRate < 50) {
    await ctx.breakpoint({
      question: `Initial test pass rate: ${initialPassRate}%. Below 50% threshold. This is common for initial runs. Review failures and continue debugging?`,
      title: 'Initial Execution Results',
      context: {
        runId: ctx.runId,
        passRate: initialPassRate,
        totalTests: initialExecution.totalTests,
        passed: initialExecution.passed,
        failed: initialExecution.failed,
        failureCategories: initialExecution.failureCategories,
        files: initialExecution.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 8: DEBUGGING AND FIXES
  // ============================================================================

  ctx.log('info', 'Phase 8: Debugging test failures and implementing fixes');

  const debuggingPhase = await ctx.task(apiTestDebuggingTask, {
    projectName,
    executionResults: initialExecution,
    discoveredEndpoints: apiDiscovery.discoveredEndpoints,
    testData: testDataCreation.testDatasets,
    outputDir
  });

  artifacts.push(...debuggingPhase.artifacts);

  // ============================================================================
  // PHASE 9: SCHEMA VALIDATION TESTING
  // ============================================================================

  let schemaValidationResults = null;
  if (schemaValidationEnabled && testScope.includes('schema')) {
    ctx.log('info', 'Phase 9: Implementing schema validation tests');

    schemaValidationResults = await ctx.task(schemaValidationTestTask, {
      projectName,
      apiType,
      discoveredEndpoints: apiDiscovery.discoveredEndpoints,
      schemas: apiDiscovery.schemas,
      frameworkSetup,
      outputDir
    });

    artifacts.push(...schemaValidationResults.artifacts);
  }

  // ============================================================================
  // PHASE 10: PERFORMANCE TESTING
  // ============================================================================

  let performanceTestResults = null;
  if (testScope.includes('performance')) {
    ctx.log('info', 'Phase 10: Executing API performance and load tests');

    performanceTestResults = await ctx.task(apiPerformanceTestTask, {
      projectName,
      apiBaseUrl,
      discoveredEndpoints: apiDiscovery.discoveredEndpoints,
      performanceCriteria,
      testData: testDataCreation.testDatasets,
      outputDir
    });

    artifacts.push(...performanceTestResults.artifacts);

    performanceResults = performanceTestResults.results;

    // Quality Gate: Performance criteria
    const performancePassRate = performanceTestResults.passRate;
    if (performancePassRate < acceptanceCriteria.performancePassRate) {
      await ctx.breakpoint({
        question: `Performance test pass rate: ${performancePassRate}%. Target: ${acceptanceCriteria.performancePassRate}%. Below acceptance criteria. Review performance issues and decide to proceed or optimize?`,
        title: 'Performance Quality Gate',
        context: {
          runId: ctx.runId,
          performancePassRate,
          targetPassRate: acceptanceCriteria.performancePassRate,
          failedEndpoints: performanceTestResults.failedEndpoints,
          performanceMetrics: performanceTestResults.metrics,
          recommendation: 'Consider API optimization or adjust performance criteria',
          files: performanceTestResults.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
        }
      });
    }
  }

  // ============================================================================
  // PHASE 11: SECURITY TESTING
  // ============================================================================

  let securityTestResults = null;
  if (testScope.includes('security')) {
    ctx.log('info', 'Phase 11: Running API security tests and vulnerability scans');

    securityTestResults = await ctx.task(apiSecurityTestTask, {
      projectName,
      apiBaseUrl,
      apiType,
      discoveredEndpoints: apiDiscovery.discoveredEndpoints,
      authType,
      securityScans,
      outputDir
    });

    artifacts.push(...securityTestResults.artifacts);

    securityFindings = securityTestResults.findings;

    // Quality Gate: Security vulnerabilities
    const criticalVulnerabilities = securityFindings.filter(f => f.severity === 'critical').length;
    const highVulnerabilities = securityFindings.filter(f => f.severity === 'high').length;

    if (criticalVulnerabilities > 0 || highVulnerabilities > acceptanceCriteria.securityIssues) {
      await ctx.breakpoint({
        question: `Security scan found ${criticalVulnerabilities} critical and ${highVulnerabilities} high severity vulnerabilities. Target: ${acceptanceCriteria.securityIssues} critical/high issues. Review security findings and address before proceeding?`,
        title: 'Security Quality Gate',
        context: {
          runId: ctx.runId,
          criticalVulnerabilities,
          highVulnerabilities,
          targetSecurityIssues: acceptanceCriteria.securityIssues,
          findings: securityFindings,
          recommendation: 'Address critical and high severity security issues before production',
          files: securityTestResults.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
        }
      });
    }
  }

  // ============================================================================
  // PHASE 12: NEGATIVE TESTING AND ERROR HANDLING
  // ============================================================================

  ctx.log('info', 'Phase 12: Implementing negative tests and error handling validation');

  const negativeTestResults = await ctx.task(negativeTestImplementationTask, {
    projectName,
    discoveredEndpoints: apiDiscovery.discoveredEndpoints,
    apiType,
    frameworkSetup,
    outputDir
  });

  artifacts.push(...negativeTestResults.artifacts);

  // ============================================================================
  // PHASE 13: FINAL TEST EXECUTION
  // ============================================================================

  ctx.log('info', 'Phase 13: Running final comprehensive test execution');

  const finalExecution = await ctx.task(apiTestExecutionTask, {
    projectName,
    apiBaseUrl,
    testScope: ['functional', 'negative', 'schema'],
    frameworkSetup,
    outputDir,
    executionType: 'final'
  });

  artifacts.push(...finalExecution.artifacts);

  const finalPassRate = finalExecution.passRate;

  // Quality Gate: Final test pass rate
  if (finalPassRate < acceptanceCriteria.passRate) {
    await ctx.breakpoint({
      question: `Final test pass rate: ${finalPassRate}%. Target: ${acceptanceCriteria.passRate}%. Below acceptance criteria. Review and decide to proceed or iterate?`,
      title: 'Pass Rate Quality Gate',
      context: {
        runId: ctx.runId,
        finalPassRate,
        targetPassRate: acceptanceCriteria.passRate,
        totalTests: finalExecution.totalTests,
        passed: finalExecution.passed,
        failed: finalExecution.failed,
        recommendation: 'Consider additional debugging iteration or adjust acceptance criteria',
        files: finalExecution.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 14: API COVERAGE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 14: Analyzing API test coverage');

  const coverageAnalysis = await ctx.task(apiCoverageAnalysisTask, {
    projectName,
    discoveredEndpoints: apiDiscovery.discoveredEndpoints,
    functionalTestResults,
    contractTestResults,
    schemaValidationResults,
    performanceTestResults,
    securityTestResults,
    negativeTestResults,
    outputDir
  });

  artifacts.push(...coverageAnalysis.artifacts);

  apiCoverage = coverageAnalysis.coverage;

  // Quality Gate: Test coverage
  const endpointCoverage = coverageAnalysis.endpointCoverage;
  if (endpointCoverage < acceptanceCriteria.testCoverage) {
    await ctx.breakpoint({
      question: `API endpoint coverage: ${endpointCoverage}%. Target: ${acceptanceCriteria.testCoverage}%. Below acceptance criteria. Continue or add more tests?`,
      title: 'Coverage Quality Gate',
      context: {
        runId: ctx.runId,
        endpointCoverage,
        targetCoverage: acceptanceCriteria.testCoverage,
        coveredEndpoints: coverageAnalysis.coveredEndpoints,
        uncoveredEndpoints: coverageAnalysis.uncoveredEndpoints,
        coverageByCategory: coverageAnalysis.coverageByCategory,
        files: coverageAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 15: MOCK SERVER SETUP (if enabled)
  // ============================================================================

  let mockServerSetup = null;
  if (mockServerEnabled) {
    ctx.log('info', 'Phase 15: Setting up API mock server for testing');

    mockServerSetup = await ctx.task(mockServerSetupTask, {
      projectName,
      apiType,
      discoveredEndpoints: apiDiscovery.discoveredEndpoints,
      schemas: apiDiscovery.schemas,
      outputDir
    });

    artifacts.push(...mockServerSetup.artifacts);
  }

  // ============================================================================
  // PHASE 16: DOCUMENTATION GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 16: Generating API test suite documentation');

  const documentation = await ctx.task(apiTestDocumentationTask, {
    projectName,
    apiDiscovery,
    frameworkSetup,
    testDataCreation,
    functionalTestResults,
    contractTestResults,
    schemaValidationResults,
    performanceTestResults,
    securityTestResults,
    negativeTestResults,
    finalExecution,
    coverageAnalysis,
    mockServerSetup,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // ============================================================================
  // PHASE 17: CI/CD INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 17: Configuring CI/CD pipeline integration');

  const cicdIntegration = await ctx.task(apiTestCicdIntegrationTask, {
    projectName,
    cicdPlatform,
    frameworkSetup,
    testScope,
    performanceCriteria,
    outputDir
  });

  artifacts.push(...cicdIntegration.artifacts);

  // ============================================================================
  // PHASE 18: FINAL ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 18: Computing final API test suite metrics and assessment');

  const finalAssessment = await ctx.task(apiFinalAssessmentTask, {
    projectName,
    apiDiscovery,
    functionalTestResults,
    contractTestResults,
    schemaValidationResults,
    performanceTestResults,
    securityTestResults,
    negativeTestResults,
    finalExecution,
    coverageAnalysis,
    acceptanceCriteria,
    outputDir
  });

  testSuiteStats = finalAssessment.testSuiteStats;
  artifacts.push(...finalAssessment.artifacts);

  ctx.log('info', `API test suite quality score: ${finalAssessment.qualityScore}/100`);
  ctx.log('info', `Total tests: ${testSuiteStats.totalTests}, Pass rate: ${testSuiteStats.passRate}%`);

  // Final Breakpoint: API Test Suite Approval
  await ctx.breakpoint({
    question: `API Test Automation Suite Complete for ${projectName}. Quality Score: ${finalAssessment.qualityScore}/100, Pass Rate: ${testSuiteStats.passRate}%, Coverage: ${apiCoverage.endpointCoverage}%. Approve test suite for production use?`,
    title: 'Final API Test Suite Review',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        totalTests: testSuiteStats.totalTests,
        passRate: testSuiteStats.passRate,
        endpointCoverage: apiCoverage.endpointCoverage,
        qualityScore: finalAssessment.qualityScore,
        endpointsTested: apiDiscovery.discoveredEndpoints.length,
        performanceScore: performanceTestResults?.score || 'N/A',
        securityScore: securityTestResults?.score || 'N/A',
        cicdReady: cicdIntegration.ready
      },
      acceptanceCriteria,
      verdict: finalAssessment.verdict,
      recommendation: finalAssessment.recommendation,
      files: [
        { path: documentation.testSuiteDocPath, format: 'markdown', label: 'Test Suite Documentation' },
        { path: finalAssessment.metricsReportPath, format: 'json', label: 'Metrics Report' },
        { path: finalExecution.reportPath, format: 'html', label: 'Test Execution Report' },
        { path: coverageAnalysis.coverageReportPath, format: 'html', label: 'Coverage Report' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    apiBaseUrl,
    apiType,
    testSuiteStats: {
      totalTests: testSuiteStats.totalTests,
      passRate: testSuiteStats.passRate,
      functionalTests: totalFunctionalTests,
      contractTests: contractTestResults?.testCount || 0,
      schemaTests: schemaValidationResults?.testCount || 0,
      performanceTests: performanceTestResults?.testCount || 0,
      securityTests: securityTestResults?.testCount || 0,
      negativeTests: negativeTestResults?.testCount || 0,
      executionTime: testSuiteStats.executionTime
    },
    apiCoverage: {
      endpointCoverage: apiCoverage.endpointCoverage,
      methodCoverage: apiCoverage.methodCoverage,
      totalEndpoints: apiDiscovery.discoveredEndpoints.length,
      coveredEndpoints: coverageAnalysis.coveredEndpoints.length,
      uncoveredEndpoints: coverageAnalysis.uncoveredEndpoints.length
    },
    performanceResults: performanceTestResults ? {
      passRate: performanceTestResults.passRate,
      score: performanceTestResults.score,
      avgResponseTime: performanceTestResults.avgResponseTime,
      maxResponseTime: performanceTestResults.maxResponseTime,
      throughput: performanceTestResults.throughput
    } : null,
    securityFindings: securityTestResults ? {
      totalFindings: securityFindings.length,
      critical: securityFindings.filter(f => f.severity === 'critical').length,
      high: securityFindings.filter(f => f.severity === 'high').length,
      medium: securityFindings.filter(f => f.severity === 'medium').length,
      low: securityFindings.filter(f => f.severity === 'low').length,
      score: securityTestResults.score
    } : null,
    qualityGates: {
      passRateMet: finalPassRate >= acceptanceCriteria.passRate,
      coverageMet: apiCoverage.endpointCoverage >= acceptanceCriteria.testCoverage,
      performanceMet: performanceTestResults ? performanceTestResults.passRate >= acceptanceCriteria.performancePassRate : true,
      securityMet: securityTestResults ? securityFindings.filter(f => f.severity === 'critical').length <= acceptanceCriteria.securityIssues : true
    },
    cicdIntegration: {
      ready: cicdIntegration.ready,
      platform: cicdPlatform,
      pipelineConfigPath: cicdIntegration.pipelineConfigPath
    },
    artifacts,
    documentation: {
      testSuiteDocPath: documentation.testSuiteDocPath,
      apiDocPath: documentation.apiDocPath,
      usageGuidePath: documentation.usageGuidePath
    },
    finalAssessment: {
      qualityScore: finalAssessment.qualityScore,
      verdict: finalAssessment.verdict,
      recommendation: finalAssessment.recommendation,
      productionReady: finalAssessment.productionReady,
      metricsReportPath: finalAssessment.metricsReportPath
    },
    duration,
    metadata: {
      processId: 'specializations/qa-testing-automation/api-testing',
      timestamp: startTime,
      apiType,
      authType,
      testScope,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: API Discovery and Documentation Analysis
export const apiDiscoveryTask = defineTask('api-discovery', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: API Discovery and Documentation Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior API Test Architect and Integration Specialist',
      task: 'Discover and analyze API endpoints, methods, and documentation',
      context: {
        projectName: args.projectName,
        apiBaseUrl: args.apiBaseUrl,
        apiType: args.apiType,
        endpoints: args.endpoints,
        authType: args.authType,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze provided endpoints or discover from OpenAPI/Swagger documentation',
        '2. Identify all REST endpoints, HTTP methods, and parameters',
        '3. Extract authentication and authorization requirements',
        '4. Categorize endpoints (authentication, CRUD, search, business logic)',
        '5. Document request/response schemas from API documentation',
        '6. Identify required headers, query parameters, path parameters',
        '7. Map endpoint dependencies and relationships',
        '8. Document expected status codes and error responses',
        '9. Identify data models and entity relationships',
        '10. Create comprehensive API inventory with metadata',
        '11. Generate endpoint documentation summary',
        '12. Return structured endpoint catalog'
      ],
      outputFormat: 'JSON object with discovered endpoints, categories, and documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'discoveredEndpoints', 'endpointCategories', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        discoveredEndpoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              methods: { type: 'array', items: { type: 'string' } },
              category: { type: 'string', enum: ['authentication', 'crud', 'search', 'business', 'admin'] },
              description: { type: 'string' },
              authRequired: { type: 'boolean' },
              parameters: {
                type: 'object',
                properties: {
                  path: { type: 'array' },
                  query: { type: 'array' },
                  headers: { type: 'array' },
                  body: { type: 'object' }
                }
              },
              responses: { type: 'object' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          },
          minItems: 1
        },
        endpointCategories: {
          type: 'object',
          properties: {
            authentication: { type: 'array' },
            crud: { type: 'array' },
            search: { type: 'array' },
            business: { type: 'array' },
            admin: { type: 'array' }
          }
        },
        apiDocumentation: {
          type: 'object',
          properties: {
            available: { type: 'boolean' },
            format: { type: 'string' },
            version: { type: 'string' },
            documentationUrl: { type: 'string' }
          }
        },
        schemas: { type: 'array' },
        totalEndpoints: { type: 'number' },
        totalMethods: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'api-testing', 'discovery', 'documentation']
}));

// Phase 2: Schema Extraction
export const schemaExtractionTask = defineTask('schema-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Schema Validation and Contract Definition - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'API Schema Specialist and Contract Testing Expert',
      task: 'Extract and define API schemas for request/response validation',
      context: {
        projectName: args.projectName,
        apiBaseUrl: args.apiBaseUrl,
        apiType: args.apiType,
        discoveredEndpoints: args.discoveredEndpoints,
        apiDocumentation: args.apiDocumentation,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Extract JSON schemas from OpenAPI/Swagger documentation',
        '2. Generate JSON schemas for request bodies and responses',
        '3. Define schema validation rules (required fields, types, formats)',
        '4. Create Ajv or Joi schema validators',
        '5. Document schema contracts between consumer and provider',
        '6. Identify common data models and reusable schemas',
        '7. Create schema versioning strategy',
        '8. Define backward compatibility rules',
        '9. Generate schema documentation',
        '10. Create schema validation test fixtures',
        '11. Document schema validation approach',
        '12. Return schemas and validation configuration'
      ],
      outputFormat: 'JSON object with schemas, validation rules, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['schemasExtracted', 'missingSchemas', 'artifacts'],
      properties: {
        schemasExtracted: { type: 'number' },
        schemas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              endpoint: { type: 'string' },
              method: { type: 'string' },
              requestSchema: { type: 'object' },
              responseSchemas: { type: 'object' },
              schemaPath: { type: 'string' }
            }
          }
        },
        missingSchemas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              endpoint: { type: 'string' },
              method: { type: 'string' },
              reason: { type: 'string' }
            }
          }
        },
        validationLibrary: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'api-testing', 'schema', 'validation']
}));

// Phase 3: API Test Framework Setup
export const apiTestFrameworkSetupTask = defineTask('api-test-framework-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: API Test Framework Setup - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Automation Framework Architect',
      task: 'Set up comprehensive API test automation framework',
      context: {
        projectName: args.projectName,
        apiType: args.apiType,
        authType: args.authType,
        testScope: args.testScope,
        cicdPlatform: args.cicdPlatform,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Select API testing framework (Supertest, REST Assured, Postman/Newman)',
        '2. Set up project structure (tests/, utils/, config/, fixtures/)',
        '3. Configure test runner (Jest, Mocha, or Postman)',
        '4. Create base API client with HTTP methods',
        '5. Implement authentication helper utilities',
        '6. Set up request/response interceptors for logging',
        '7. Create assertion helpers and custom matchers',
        '8. Configure test data management',
        '9. Set up environment configuration (dev, staging, prod)',
        '10. Implement retry logic for flaky API calls',
        '11. Configure test reporting (HTML, JSON, Allure)',
        '12. Create framework documentation and examples',
        '13. Return framework setup details'
      ],
      outputFormat: 'JSON object with framework configuration and setup'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'framework', 'projectStructure', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        framework: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            version: { type: 'string' },
            testRunner: { type: 'string' },
            assertionLibrary: { type: 'string' }
          }
        },
        projectStructure: {
          type: 'object',
          properties: {
            rootDir: { type: 'string' },
            testDir: { type: 'string' },
            utilsDir: { type: 'string' },
            configDir: { type: 'string' },
            fixturesDir: { type: 'string' }
          }
        },
        baseApiClient: {
          type: 'object',
          properties: {
            filePath: { type: 'string' },
            features: { type: 'array', items: { type: 'string' } }
          }
        },
        utilities: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'api-testing', 'framework', 'setup']
}));

// Phase 4: Test Data Creation
export const apiTestDataCreationTask = defineTask('api-test-data-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: API Test Data Creation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Data Management Specialist',
      task: 'Create comprehensive test data and fixtures for API testing',
      context: {
        projectName: args.projectName,
        apiType: args.apiType,
        discoveredEndpoints: args.discoveredEndpoints,
        schemas: args.schemas,
        authType: args.authType,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze test data requirements from endpoints and schemas',
        '2. Create authentication test data (users, tokens, credentials)',
        '3. Generate valid request body payloads matching schemas',
        '4. Create invalid payloads for negative testing',
        '5. Generate boundary value test data',
        '6. Create test data factories using Faker.js or similar',
        '7. Set up test data fixtures for static data',
        '8. Implement test data builders for complex objects',
        '9. Create data cleanup strategies',
        '10. Document test data management patterns',
        '11. Identify test data gaps',
        '12. Return test datasets and data management utilities'
      ],
      outputFormat: 'JSON object with test data, fixtures, and factories'
    },
    outputSchema: {
      type: 'object',
      required: ['dataReady', 'testDatasets', 'dataGaps', 'artifacts'],
      properties: {
        dataReady: { type: 'boolean' },
        testDatasets: {
          type: 'object',
          properties: {
            authentication: { type: 'object' },
            validPayloads: { type: 'array' },
            invalidPayloads: { type: 'array' },
            boundaryValues: { type: 'array' }
          }
        },
        dataFactories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              path: { type: 'string' },
              purpose: { type: 'string' }
            }
          }
        },
        fixtures: { type: 'array' },
        availableData: { type: 'object' },
        dataGaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              description: { type: 'string' },
              impact: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
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
  labels: ['agent', 'api-testing', 'test-data', 'fixtures']
}));

// Phase 5: Functional Test Implementation (per category)
export const functionalTestImplementationTask = defineTask('functional-test-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Functional Tests - ${args.category} - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'API Test Automation Engineer',
      task: `Implement functional API tests for ${args.category} endpoints`,
      context: {
        projectName: args.projectName,
        category: args.category,
        endpoints: args.endpoints,
        apiType: args.apiType,
        authType: args.authType,
        testData: args.testData,
        frameworkSetup: args.frameworkSetup,
        outputDir: args.outputDir
      },
      instructions: [
        `1. Implement tests for all ${args.category} endpoints`,
        '2. Test all HTTP methods (GET, POST, PUT, DELETE, PATCH)',
        '3. Verify response status codes (200, 201, 400, 401, 404, etc.)',
        '4. Validate response body structure and data',
        '5. Test authentication and authorization',
        '6. Verify request headers and parameters',
        '7. Test query parameters and filtering',
        '8. Implement pagination testing',
        '9. Test sorting and ordering',
        '10. Add proper assertions and error messages',
        '11. Use test data fixtures and factories',
        '12. Return implemented test files and test count'
      ],
      outputFormat: 'JSON object with test files, test count, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'category', 'testCount', 'testFiles', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        category: { type: 'string' },
        testCount: { type: 'number' },
        testFiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              endpoint: { type: 'string' },
              testsInFile: { type: 'number' }
            }
          }
        },
        endpointsCovered: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'api-testing', 'functional', args.category]
}));

// Phase 6: Contract Testing Implementation
export const contractTestImplementationTask = defineTask('contract-test-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Contract Testing Implementation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Contract Testing Specialist',
      task: 'Implement consumer-driven contract tests using Pact or similar',
      context: {
        projectName: args.projectName,
        apiBaseUrl: args.apiBaseUrl,
        apiType: args.apiType,
        discoveredEndpoints: args.discoveredEndpoints,
        schemas: args.schemas,
        frameworkSetup: args.frameworkSetup,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Set up Pact or similar contract testing framework',
        '2. Define consumer expectations for each endpoint',
        '3. Create contract tests for request/response contracts',
        '4. Implement provider verification tests',
        '5. Document contract versioning strategy',
        '6. Set up Pact Broker or contract repository',
        '7. Test backward compatibility',
        '8. Verify breaking changes detection',
        '9. Implement contract evolution patterns',
        '10. Document contract testing workflow',
        '11. Generate contract files',
        '12. Return contract test implementation'
      ],
      outputFormat: 'JSON object with contract tests and configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'testCount', 'contracts', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        testCount: { type: 'number' },
        contracts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              consumer: { type: 'string' },
              provider: { type: 'string' },
              endpoint: { type: 'string' },
              contractPath: { type: 'string' }
            }
          }
        },
        pactBrokerConfigured: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'api-testing', 'contract-testing', 'pact']
}));

// Phase 7 & 13: API Test Execution
export const apiTestExecutionTask = defineTask('api-test-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `API Test Execution - ${args.executionType} - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Execution Engineer',
      task: 'Execute API test suite and analyze results',
      context: {
        projectName: args.projectName,
        apiBaseUrl: args.apiBaseUrl,
        testScope: args.testScope,
        frameworkSetup: args.frameworkSetup,
        executionType: args.executionType,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure test execution environment',
        '2. Run API test suite for specified test scope',
        '3. Capture test results (passed, failed, skipped)',
        '4. Analyze failure reasons and categorize',
        '5. Capture request/response logs for failures',
        '6. Calculate pass rate and execution time',
        '7. Identify flaky tests',
        '8. Generate HTML test report',
        '9. Categorize failures (network, validation, assertion, timeout)',
        '10. Generate execution summary with recommendations'
      ],
      outputFormat: 'JSON object with test execution results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'totalTests', 'passed', 'failed', 'passRate', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        totalTests: { type: 'number' },
        passed: { type: 'number' },
        failed: { type: 'number' },
        skipped: { type: 'number' },
        passRate: { type: 'number' },
        executionTime: { type: 'number' },
        failureCategories: {
          type: 'object',
          properties: {
            network: { type: 'number' },
            validation: { type: 'number' },
            assertion: { type: 'number' },
            timeout: { type: 'number' },
            authentication: { type: 'number' }
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
  labels: ['agent', 'api-testing', 'execution', args.executionType]
}));

// Phase 8: API Test Debugging
export const apiTestDebuggingTask = defineTask('api-test-debugging', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: API Test Debugging - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'API Test Debugging Expert',
      task: 'Debug API test failures and implement fixes',
      context: {
        projectName: args.projectName,
        executionResults: args.executionResults,
        discoveredEndpoints: args.discoveredEndpoints,
        testData: args.testData,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze all test failures from execution results',
        '2. Categorize failures (API bugs, test issues, environment, data)',
        '3. Fix test data issues (invalid payloads, missing auth)',
        '4. Fix assertion issues (incorrect expectations)',
        '5. Fix timing issues (add waits, handle async)',
        '6. Update test code for API changes',
        '7. Document actual API bugs found',
        '8. Re-run fixed tests to verify resolution',
        '9. Calculate improvement rate',
        '10. Generate debugging report with fixes applied'
      ],
      outputFormat: 'JSON object with debugging results and fixes'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'totalIssuesFixed', 'remainingIssues', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        totalIssuesFixed: { type: 'number' },
        fixedIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testName: { type: 'string' },
              issueType: { type: 'string' },
              fix: { type: 'string' },
              resolved: { type: 'boolean' }
            }
          }
        },
        remainingIssues: { type: 'array' },
        apiBugsFound: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              endpoint: { type: 'string' },
              description: { type: 'string' },
              severity: { type: 'string' }
            }
          }
        },
        improvementRate: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'api-testing', 'debugging', 'fixes']
}));

// Phase 9: Schema Validation Testing
export const schemaValidationTestTask = defineTask('schema-validation-test', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Schema Validation Testing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'API Schema Validation Specialist',
      task: 'Implement comprehensive schema validation tests',
      context: {
        projectName: args.projectName,
        apiType: args.apiType,
        discoveredEndpoints: args.discoveredEndpoints,
        schemas: args.schemas,
        frameworkSetup: args.frameworkSetup,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Implement schema validation tests for all endpoints',
        '2. Validate response structure matches schema',
        '3. Verify required fields are present',
        '4. Validate data types and formats',
        '5. Test enum values and constraints',
        '6. Validate nested objects and arrays',
        '7. Test additional properties handling',
        '8. Verify schema version compatibility',
        '9. Test schema evolution scenarios',
        '10. Generate schema validation report',
        '11. Return validation test results'
      ],
      outputFormat: 'JSON object with schema validation tests and results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'testCount', 'validationResults', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        testCount: { type: 'number' },
        validationResults: {
          type: 'object',
          properties: {
            passed: { type: 'number' },
            failed: { type: 'number' },
            violations: { type: 'array' }
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
  labels: ['agent', 'api-testing', 'schema-validation']
}));

// Phase 10: API Performance Testing
export const apiPerformanceTestTask = defineTask('api-performance-test', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: API Performance Testing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Performance Testing Engineer',
      task: 'Execute API performance and load tests',
      context: {
        projectName: args.projectName,
        apiBaseUrl: args.apiBaseUrl,
        discoveredEndpoints: args.discoveredEndpoints,
        performanceCriteria: args.performanceCriteria,
        testData: args.testData,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Set up performance testing tool (k6, Artillery, JMeter)',
        '2. Create load test scenarios for critical endpoints',
        '3. Execute baseline performance tests',
        '4. Run load tests (gradual increase)',
        '5. Run stress tests (peak load)',
        '6. Run spike tests (sudden load increase)',
        '7. Measure response times (avg, p95, p99, max)',
        '8. Measure throughput (requests/sec)',
        '9. Monitor error rates under load',
        '10. Identify performance bottlenecks',
        '11. Compare results against criteria',
        '12. Generate performance test report'
      ],
      outputFormat: 'JSON object with performance test results and metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'testCount', 'passRate', 'results', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        testCount: { type: 'number' },
        passRate: { type: 'number' },
        score: { type: 'number' },
        results: {
          type: 'object',
          properties: {
            avgResponseTime: { type: 'number' },
            p95ResponseTime: { type: 'number' },
            p99ResponseTime: { type: 'number' },
            maxResponseTime: { type: 'number' },
            throughput: { type: 'number' },
            errorRate: { type: 'number' }
          }
        },
        metrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              endpoint: { type: 'string' },
              avgResponseTime: { type: 'number' },
              passedCriteria: { type: 'boolean' }
            }
          }
        },
        failedEndpoints: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'api-testing', 'performance', 'load-testing']
}));

// Phase 11: API Security Testing
export const apiSecurityTestTask = defineTask('api-security-test', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: API Security Testing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'API Security Testing Specialist',
      task: 'Execute comprehensive API security tests and vulnerability scans',
      context: {
        projectName: args.projectName,
        apiBaseUrl: args.apiBaseUrl,
        apiType: args.apiType,
        discoveredEndpoints: args.discoveredEndpoints,
        authType: args.authType,
        securityScans: args.securityScans,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Test authentication mechanisms (weak passwords, token expiry)',
        '2. Test authorization and access control (privilege escalation)',
        '3. Test for SQL injection vulnerabilities',
        '4. Test for XSS and injection attacks',
        '5. Test rate limiting and throttling',
        '6. Test CORS configuration',
        '7. Test for sensitive data exposure',
        '8. Test API input validation',
        '9. Test for broken authentication',
        '10. Test security headers (CSP, HSTS, X-Frame-Options)',
        '11. Run OWASP API Top 10 security tests',
        '12. Generate security findings report with severity levels'
      ],
      outputFormat: 'JSON object with security test results and findings'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'testCount', 'score', 'findings', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        testCount: { type: 'number' },
        score: { type: 'number', description: 'Security score 0-100' },
        findings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              endpoint: { type: 'string' },
              vulnerability: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'info'] },
              description: { type: 'string' },
              remediation: { type: 'string' },
              cve: { type: 'string' }
            }
          }
        },
        owaspCategories: {
          type: 'object',
          description: 'OWASP API Top 10 coverage'
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'api-testing', 'security', 'owasp']
}));

// Phase 12: Negative Testing Implementation
export const negativeTestImplementationTask = defineTask('negative-test-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Negative Testing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'API Test Engineer specializing in negative testing',
      task: 'Implement comprehensive negative tests and error handling validation',
      context: {
        projectName: args.projectName,
        discoveredEndpoints: args.discoveredEndpoints,
        apiType: args.apiType,
        frameworkSetup: args.frameworkSetup,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Test invalid request payloads',
        '2. Test missing required fields',
        '3. Test invalid data types',
        '4. Test boundary values (max length, min/max numbers)',
        '5. Test malformed JSON/XML',
        '6. Test invalid authentication tokens',
        '7. Test expired tokens',
        '8. Test unauthorized access attempts',
        '9. Test invalid HTTP methods',
        '10. Test invalid endpoints (404 scenarios)',
        '11. Verify proper error messages and status codes',
        '12. Return negative test implementation'
      ],
      outputFormat: 'JSON object with negative tests and results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'testCount', 'testFiles', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        testCount: { type: 'number' },
        testFiles: { type: 'array' },
        negativeScenarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              expectedStatusCode: { type: 'number' },
              testCount: { type: 'number' }
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
  labels: ['agent', 'api-testing', 'negative-testing', 'error-handling']
}));

// Phase 14: API Coverage Analysis
export const apiCoverageAnalysisTask = defineTask('api-coverage-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 14: API Coverage Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'QA Coverage Analyst',
      task: 'Analyze API test coverage across all test types',
      context: {
        projectName: args.projectName,
        discoveredEndpoints: args.discoveredEndpoints,
        functionalTestResults: args.functionalTestResults,
        contractTestResults: args.contractTestResults,
        schemaValidationResults: args.schemaValidationResults,
        performanceTestResults: args.performanceTestResults,
        securityTestResults: args.securityTestResults,
        negativeTestResults: args.negativeTestResults,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate endpoint coverage (% of endpoints tested)',
        '2. Calculate method coverage (GET, POST, PUT, DELETE)',
        '3. Identify uncovered endpoints and methods',
        '4. Calculate coverage by category',
        '5. Analyze coverage by test type',
        '6. Identify coverage gaps and priorities',
        '7. Generate coverage matrix',
        '8. Create coverage visualization',
        '9. Generate coverage report',
        '10. Provide recommendations for coverage improvement'
      ],
      outputFormat: 'JSON object with coverage metrics and analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['endpointCoverage', 'methodCoverage', 'coveredEndpoints', 'uncoveredEndpoints', 'artifacts'],
      properties: {
        endpointCoverage: { type: 'number', description: 'Percentage of endpoints covered' },
        methodCoverage: { type: 'number', description: 'Percentage of methods covered' },
        coverage: {
          type: 'object',
          properties: {
            totalEndpoints: { type: 'number' },
            coveredEndpoints: { type: 'number' },
            uncoveredEndpoints: { type: 'number' },
            totalMethods: { type: 'number' },
            coveredMethods: { type: 'number' }
          }
        },
        coverageByCategory: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        coverageByTestType: {
          type: 'object',
          properties: {
            functional: { type: 'number' },
            contract: { type: 'number' },
            schema: { type: 'number' },
            performance: { type: 'number' },
            security: { type: 'number' },
            negative: { type: 'number' }
          }
        },
        coveredEndpoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              endpoint: { type: 'string' },
              methods: { type: 'array' },
              testTypes: { type: 'array' }
            }
          }
        },
        uncoveredEndpoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              endpoint: { type: 'string' },
              methods: { type: 'array' },
              priority: { type: 'string' }
            }
          }
        },
        coverageReportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'api-testing', 'coverage', 'analysis']
}));

// Phase 15: Mock Server Setup
export const mockServerSetupTask = defineTask('mock-server-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 15: Mock Server Setup - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'API Mocking Specialist',
      task: 'Set up API mock server for testing and development',
      context: {
        projectName: args.projectName,
        apiType: args.apiType,
        discoveredEndpoints: args.discoveredEndpoints,
        schemas: args.schemas,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Select mock server tool (MSW, Prism, WireMock, json-server)',
        '2. Configure mock server with API endpoints',
        '3. Create mock responses from schemas',
        '4. Implement dynamic response generation',
        '5. Configure request matching rules',
        '6. Set up state management for mocks',
        '7. Create mock scenarios (success, error, edge cases)',
        '8. Configure latency simulation',
        '9. Document mock server usage',
        '10. Create mock server startup scripts',
        '11. Return mock server configuration'
      ],
      outputFormat: 'JSON object with mock server setup'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'mockServerTool', 'configPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        mockServerTool: { type: 'string' },
        mockServerUrl: { type: 'string' },
        configPath: { type: 'string' },
        mockedEndpoints: { type: 'number' },
        mockScenarios: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'api-testing', 'mock-server', 'mocking']
}));

// Phase 16: Documentation Generation
export const apiTestDocumentationTask = defineTask('api-test-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 16: API Test Documentation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Documentation Writer',
      task: 'Generate comprehensive API test suite documentation',
      context: args
      instructions: [
        '1. Create test suite overview document',
        '2. Document API inventory and coverage',
        '3. Write test execution guide',
        '4. Document test data management',
        '5. Create troubleshooting guide',
        '6. Document framework architecture',
        '7. Write contribution guidelines',
        '8. Document CI/CD integration',
        '9. Create test report interpretation guide',
        '10. Generate API documentation',
        '11. Document security and performance testing',
        '12. Create README with quick start'
      ],
      outputFormat: 'JSON object with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'testSuiteDocPath', 'apiDocPath', 'usageGuidePath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        testSuiteDocPath: { type: 'string' },
        apiDocPath: { type: 'string' },
        usageGuidePath: { type: 'string' },
        troubleshootingPath: { type: 'string' },
        readmePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'api-testing', 'documentation']
}));

// Phase 17: CI/CD Integration
export const apiTestCicdIntegrationTask = defineTask('api-test-cicd-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 17: CI/CD Integration - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps Engineer',
      task: 'Configure CI/CD pipeline for API test automation',
      context: {
        projectName: args.projectName,
        cicdPlatform: args.cicdPlatform,
        frameworkSetup: args.frameworkSetup,
        testScope: args.testScope,
        performanceCriteria: args.performanceCriteria,
        outputDir: args.outputDir
      },
      instructions: [
        `1. Create ${args.cicdPlatform} pipeline configuration`,
        '2. Configure test stages (functional, contract, performance, security)',
        '3. Set up environment variables and secrets',
        '4. Configure artifact storage (reports, logs)',
        '5. Add test result publishing',
        '6. Configure quality gates',
        '7. Add failure notifications',
        '8. Configure scheduled runs',
        '9. Set up parallel execution',
        '10. Document pipeline configuration'
      ],
      outputFormat: 'JSON object with CI/CD configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['ready', 'pipelineConfigPath', 'artifacts'],
      properties: {
        ready: { type: 'boolean' },
        pipelineConfigPath: { type: 'string' },
        stages: { type: 'array' },
        qualityGates: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'api-testing', 'cicd', 'pipeline']
}));

// Phase 18: Final Assessment
export const apiFinalAssessmentTask = defineTask('api-final-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 18: Final Assessment - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'QA Lead and API Testing Expert',
      task: 'Conduct final assessment of API test suite',
      context: args,
      instructions: [
        '1. Calculate overall test suite quality score (0-100)',
        '2. Assess endpoint coverage completeness',
        '3. Evaluate functional test quality',
        '4. Assess contract testing implementation',
        '5. Evaluate performance testing results',
        '6. Assess security testing coverage',
        '7. Review negative testing completeness',
        '8. Compare results against acceptance criteria',
        '9. Provide production readiness verdict',
        '10. Generate comprehensive metrics report with recommendations'
      ],
      outputFormat: 'JSON object with final assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['qualityScore', 'testSuiteStats', 'productionReady', 'verdict', 'recommendation', 'artifacts'],
      properties: {
        qualityScore: { type: 'number', minimum: 0, maximum: 100 },
        testSuiteStats: {
          type: 'object',
          properties: {
            totalTests: { type: 'number' },
            passRate: { type: 'number' },
            executionTime: { type: 'number' }
          }
        },
        productionReady: { type: 'boolean' },
        acceptanceCriteriaMet: {
          type: 'object',
          properties: {
            passRate: { type: 'boolean' },
            coverage: { type: 'boolean' },
            performance: { type: 'boolean' },
            security: { type: 'boolean' }
          }
        },
        verdict: { type: 'string' },
        recommendation: { type: 'string' },
        strengths: { type: 'array', items: { type: 'string' } },
        improvements: { type: 'array', items: { type: 'string' } },
        metricsReportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'api-testing', 'assessment', 'metrics']
}));
