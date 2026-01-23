/**
 * @process specializations/technical-documentation/api-reference-docs
 * @description API Reference Documentation with Code Examples - Comprehensive process for creating complete API reference
 * documentation with multi-language code examples, authentication flows, error handling, rate limits, SDK integration guides,
 * and interactive API explorers following documentation best practices.
 * @inputs { apiName: string, apiType?: string, specificationPath?: string, endpoints?: array, targetLanguages?: array, targetAudience?: string }
 * @outputs { success: boolean, documentation: object, codeExamples: object, guides: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/technical-documentation/api-reference-docs', {
 *   apiName: 'E-Commerce Platform API',
 *   apiType: 'REST',
 *   specificationPath: 'specs/openapi.yaml',
 *   endpoints: [
 *     { path: '/products', methods: ['GET', 'POST'] },
 *     { path: '/orders', methods: ['GET', 'POST'] }
 *   ],
 *   targetLanguages: ['javascript', 'python', 'java', 'ruby', 'go'],
 *   targetAudience: 'external-developers',
 *   authType: 'OAuth2',
 *   includeInteractiveExplorer: true
 * });
 *
 * @references
 * - Google API Documentation Best Practices: https://cloud.google.com/apis/design
 * - Microsoft API Documentation Guidelines: https://github.com/microsoft/api-guidelines
 * - OpenAPI Specification: https://swagger.io/specification/
 * - Stripe API Documentation: https://stripe.com/docs/api
 * - Twilio API Documentation: https://www.twilio.com/docs/usage/api
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    apiName,
    apiType = 'REST', // 'REST', 'GraphQL', 'gRPC', 'WebSocket'
    specificationPath = null, // Path to OpenAPI/Swagger/GraphQL schema
    endpoints = [],
    targetLanguages = ['javascript', 'python', 'java', 'curl'],
    targetAudience = 'external-developers', // 'internal', 'external-developers', 'public', 'partners'
    authType = 'Bearer', // 'Bearer', 'OAuth2', 'API-Key', 'Basic', 'Custom'
    includeInteractiveExplorer = true,
    includeQuickstart = true,
    includeSDKGuides = true,
    outputDir = 'api-docs-output',
    docPlatform = 'docusaurus', // 'docusaurus', 'mkdocs', 'slate', 'redoc', 'readme'
    qualityCriteria = {
      minimumCodeExamplesPerEndpoint: 3,
      minimumLanguageCoverage: 3,
      requireAuthenticationExamples: true,
      requireErrorHandlingExamples: true,
      requirePaginationExamples: true
    }
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let documentation = {};
  let codeExamples = {};
  let guides = [];

  ctx.log('info', `Starting API Reference Documentation for ${apiName}`);
  ctx.log('info', `API Type: ${apiType}, Target Audience: ${targetAudience}`);
  ctx.log('info', `Target Languages: ${targetLanguages.join(', ')}`);

  // ============================================================================
  // PHASE 1: API SPECIFICATION ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing API specification and endpoints');

  const specAnalysis = await ctx.task(apiSpecificationAnalysisTask, {
    apiName,
    apiType,
    specificationPath,
    endpoints,
    authType,
    outputDir
  });

  if (!specAnalysis.success) {
    return {
      success: false,
      error: 'Failed to analyze API specification',
      details: specAnalysis,
      metadata: {
        processId: 'specializations/technical-documentation/api-reference-docs',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...specAnalysis.artifacts);

  // Quality Gate: Minimum endpoints discovered
  const discoveredEndpointCount = specAnalysis.endpoints.length;
  if (discoveredEndpointCount === 0) {
    return {
      success: false,
      error: 'No API endpoints discovered',
      phase: 'specification-analysis',
      details: specAnalysis
    };
  }

  ctx.log('info', `Discovered ${discoveredEndpointCount} API endpoints`);

  // ============================================================================
  // PHASE 2: DOCUMENTATION STRUCTURE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing documentation structure and information architecture');

  const structureDesign = await ctx.task(documentationStructureDesignTask, {
    apiName,
    apiType,
    endpoints: specAnalysis.endpoints,
    targetAudience,
    docPlatform,
    includeQuickstart,
    includeSDKGuides,
    outputDir
  });

  artifacts.push(...structureDesign.artifacts);

  // Breakpoint: Review documentation structure
  await ctx.breakpoint({
    question: `Documentation structure designed with ${structureDesign.sectionCount} sections. Review structure and navigation?`,
    title: 'Documentation Structure Review',
    context: {
      runId: ctx.runId,
      apiName,
      structure: structureDesign.structure,
      navigation: structureDesign.navigation,
      files: [{
        path: structureDesign.structureDocPath,
        format: 'markdown',
        label: 'Documentation Structure'
      }]
    }
  });

  // ============================================================================
  // PHASE 3: AUTHENTICATION DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Creating authentication and authorization documentation');

  const authDocs = await ctx.task(authenticationDocumentationTask, {
    apiName,
    authType,
    apiType,
    targetLanguages,
    targetAudience,
    specAnalysis,
    outputDir
  });

  artifacts.push(...authDocs.artifacts);

  // Quality Gate: Authentication examples completeness
  const authExamplesCount = authDocs.codeExamples.length;
  const authCoverage = authExamplesCount / targetLanguages.length;

  if (authCoverage < 0.75 && qualityCriteria.requireAuthenticationExamples) {
    await ctx.breakpoint({
      question: `Authentication examples: ${authExamplesCount}/${targetLanguages.length} languages (${(authCoverage * 100).toFixed(0)}% coverage). Below 75% threshold. Review and approve?`,
      title: 'Authentication Documentation Review',
      context: {
        runId: ctx.runId,
        authExamplesCount,
        targetLanguages,
        coverage: authCoverage,
        files: authDocs.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
      }
    });
  }

  // ============================================================================
  // PHASE 4: ENDPOINT REFERENCE DOCUMENTATION (PARALLEL)
  // ============================================================================

  ctx.log('info', 'Phase 4: Generating endpoint reference documentation in parallel');

  // Group endpoints by category for parallel processing
  const endpointCategories = specAnalysis.endpointCategories || {
    core: [],
    auxiliary: [],
    admin: []
  };

  const endpointDocTasks = Object.entries(endpointCategories)
    .filter(([_, endpoints]) => endpoints.length > 0)
    .map(([category, endpoints]) =>
      () => ctx.task(endpointReferenceDocumentationTask, {
        apiName,
        category,
        endpoints,
        apiType,
        authType,
        targetLanguages,
        specAnalysis,
        outputDir
      })
    );

  const endpointDocs = await ctx.parallel.all(endpointDocTasks);

  artifacts.push(...endpointDocs.flatMap(d => d.artifacts));

  const totalEndpointDocuments = endpointDocs.reduce((sum, d) => sum + d.endpointCount, 0);
  ctx.log('info', `Generated ${totalEndpointDocuments} endpoint reference documents`);

  // ============================================================================
  // PHASE 5: CODE EXAMPLES GENERATION (PARALLEL)
  // ============================================================================

  ctx.log('info', 'Phase 5: Generating multi-language code examples in parallel');

  const codeExampleTasks = targetLanguages.map(language =>
    () => ctx.task(codeExamplesGenerationTask, {
      apiName,
      language,
      endpoints: specAnalysis.endpoints,
      authType,
      specAnalysis,
      includeErrorHandling: qualityCriteria.requireErrorHandlingExamples,
      includePagination: qualityCriteria.requirePaginationExamples,
      outputDir
    })
  );

  const codeExampleResults = await ctx.parallel.all(codeExampleTasks);

  artifacts.push(...codeExampleResults.flatMap(r => r.artifacts));

  const totalCodeExamples = codeExampleResults.reduce((sum, r) => sum + r.exampleCount, 0);
  ctx.log('info', `Generated ${totalCodeExamples} code examples across ${targetLanguages.length} languages`);

  // Aggregate code examples by endpoint
  codeExamples = codeExampleResults.reduce((acc, result) => {
    result.examples.forEach(example => {
      if (!acc[example.endpoint]) {
        acc[example.endpoint] = {};
      }
      acc[example.endpoint][result.language] = example;
    });
    return acc;
  }, {});

  // Quality Gate: Code example coverage
  const avgExamplesPerEndpoint = totalCodeExamples / discoveredEndpointCount;
  if (avgExamplesPerEndpoint < qualityCriteria.minimumCodeExamplesPerEndpoint) {
    await ctx.breakpoint({
      question: `Average ${avgExamplesPerEndpoint.toFixed(1)} code examples per endpoint. Below minimum of ${qualityCriteria.minimumCodeExamplesPerEndpoint}. Review coverage?`,
      title: 'Code Example Coverage Review',
      context: {
        runId: ctx.runId,
        totalCodeExamples,
        discoveredEndpointCount,
        avgExamplesPerEndpoint,
        targetLanguages,
        files: codeExampleResults.flatMap(r => r.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })))
      }
    });
  }

  // ============================================================================
  // PHASE 6: ERROR REFERENCE DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating error codes and troubleshooting documentation');

  const errorDocs = await ctx.task(errorReferenceDocumentationTask, {
    apiName,
    apiType,
    specAnalysis,
    targetLanguages,
    outputDir
  });

  artifacts.push(...errorDocs.artifacts);

  // ============================================================================
  // PHASE 7: QUICKSTART GUIDE (IF ENABLED)
  // ============================================================================

  let quickstartGuide = null;
  if (includeQuickstart) {
    ctx.log('info', 'Phase 7: Creating quickstart guide');

    quickstartGuide = await ctx.task(quickstartGuideCreationTask, {
      apiName,
      apiType,
      authType,
      targetLanguages,
      specAnalysis,
      coreEndpoints: endpointCategories.core || specAnalysis.endpoints.slice(0, 3),
      outputDir
    });

    artifacts.push(...quickstartGuide.artifacts);
    guides.push(quickstartGuide);
  }

  // ============================================================================
  // PHASE 8: ADVANCED GUIDES (PARALLEL)
  // ============================================================================

  ctx.log('info', 'Phase 8: Creating advanced usage guides in parallel');

  const advancedGuideTasks = [
    () => ctx.task(rateLimitingGuideTask, {
      apiName,
      specAnalysis,
      targetLanguages: targetLanguages.slice(0, 2), // Top 2 languages
      outputDir
    }),
    () => ctx.task(paginationGuideTask, {
      apiName,
      specAnalysis,
      targetLanguages: targetLanguages.slice(0, 2),
      outputDir
    }),
    () => ctx.task(webhooksGuideTask, {
      apiName,
      specAnalysis,
      targetLanguages: targetLanguages.slice(0, 2),
      outputDir
    }),
    () => ctx.task(bestPracticesGuideTask, {
      apiName,
      apiType,
      specAnalysis,
      targetAudience,
      outputDir
    })
  ];

  const advancedGuides = await ctx.parallel.all(advancedGuideTasks);

  artifacts.push(...advancedGuides.flatMap(g => g.artifacts));
  guides.push(...advancedGuides);

  // ============================================================================
  // PHASE 9: SDK INTEGRATION GUIDES (IF ENABLED)
  // ============================================================================

  let sdkGuides = [];
  if (includeSDKGuides && targetLanguages.length >= qualityCriteria.minimumLanguageCoverage) {
    ctx.log('info', 'Phase 9: Creating SDK integration guides');

    const sdkGuideTasks = targetLanguages.slice(0, 3).map(language => // Top 3 languages
      () => ctx.task(sdkIntegrationGuideTask, {
        apiName,
        language,
        authType,
        specAnalysis,
        coreEndpoints: endpointCategories.core || [],
        outputDir
      })
    );

    sdkGuides = await ctx.parallel.all(sdkGuideTasks);

    artifacts.push(...sdkGuides.flatMap(g => g.artifacts));
    guides.push(...sdkGuides);
  }

  // ============================================================================
  // PHASE 10: INTERACTIVE API EXPLORER (IF ENABLED)
  // ============================================================================

  let apiExplorer = null;
  if (includeInteractiveExplorer && specificationPath) {
    ctx.log('info', 'Phase 10: Setting up interactive API explorer');

    apiExplorer = await ctx.task(interactiveApiExplorerTask, {
      apiName,
      apiType,
      specificationPath,
      authType,
      docPlatform,
      outputDir
    });

    artifacts.push(...apiExplorer.artifacts);
  }

  // ============================================================================
  // PHASE 11: DOCUMENTATION QUALITY VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 11: Validating documentation quality and completeness');

  const qualityValidation = await ctx.task(documentationQualityValidationTask, {
    apiName,
    artifacts,
    endpoints: specAnalysis.endpoints,
    targetLanguages,
    codeExamples,
    guides,
    qualityCriteria,
    outputDir
  });

  artifacts.push(...qualityValidation.artifacts);

  const qualityScore = qualityValidation.overallScore;
  const qualityMet = qualityScore >= 80;

  // Breakpoint: Quality validation review
  await ctx.breakpoint({
    question: `Documentation quality score: ${qualityScore}/100. ${qualityMet ? 'Quality meets standards!' : 'Quality may need improvement.'} Review quality report?`,
    title: 'Documentation Quality Review',
    context: {
      runId: ctx.runId,
      qualityScore,
      qualityMet,
      componentScores: qualityValidation.componentScores,
      gaps: qualityValidation.gaps,
      recommendations: qualityValidation.recommendations,
      files: [{
        path: qualityValidation.reportPath,
        format: 'markdown',
        label: 'Quality Report'
      }]
    }
  });

  // ============================================================================
  // PHASE 12: DOCUMENTATION PACKAGING AND INDEX
  // ============================================================================

  ctx.log('info', 'Phase 12: Packaging documentation and creating index');

  const docPackaging = await ctx.task(documentationPackagingTask, {
    apiName,
    apiType,
    structureDesign,
    artifacts,
    guides,
    docPlatform,
    includeInteractiveExplorer: includeInteractiveExplorer && apiExplorer !== null,
    outputDir
  });

  artifacts.push(...docPackaging.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  documentation = {
    apiName,
    apiType,
    structure: structureDesign.structure,
    endpoints: specAnalysis.endpoints,
    authentication: authDocs,
    errorReference: errorDocs,
    guides: guides.map(g => ({
      title: g.title,
      type: g.type,
      path: g.path
    })),
    codeExamplesCoverage: {
      totalExamples: totalCodeExamples,
      languages: targetLanguages.length,
      averagePerEndpoint: avgExamplesPerEndpoint
    },
    interactiveExplorer: apiExplorer ? {
      enabled: true,
      url: apiExplorer.explorerUrl,
      type: apiExplorer.explorerType
    } : { enabled: false },
    qualityScore: qualityScore,
    indexPath: docPackaging.indexPath,
    deploymentReady: docPackaging.deploymentReady
  };

  return {
    success: true,
    apiName,
    documentation,
    codeExamples: {
      total: totalCodeExamples,
      byLanguage: codeExampleResults.map(r => ({
        language: r.language,
        count: r.exampleCount
      })),
      byEndpoint: Object.keys(codeExamples).length
    },
    guides: guides.map(g => ({
      title: g.title,
      type: g.type,
      path: g.path
    })),
    quality: {
      overallScore: qualityScore,
      componentScores: qualityValidation.componentScores,
      completeness: qualityValidation.completeness,
      meetsStandards: qualityMet
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/technical-documentation/api-reference-docs',
      timestamp: startTime,
      outputDir,
      docPlatform,
      targetAudience
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: API Specification Analysis
export const apiSpecificationAnalysisTask = defineTask('api-specification-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze API specification and discover endpoints',
  agent: {
    name: 'api-analyst',
    prompt: {
      role: 'API documentation specialist and technical analyst',
      task: 'Analyze API specification and discover all endpoints with their details',
      context: args,
      instructions: [
        'If specificationPath provided, parse OpenAPI/Swagger/GraphQL schema',
        'Extract all endpoints with methods, paths, parameters, request/response schemas',
        'Identify authentication requirements per endpoint',
        'Categorize endpoints (core/CRUD, auxiliary/supporting, admin)',
        'Document request parameters (path, query, body)',
        'Document response schemas and status codes',
        'Identify pagination patterns if present',
        'Identify rate limiting information',
        'Extract error response formats',
        'Note deprecated or beta endpoints',
        'If no spec provided, analyze provided endpoints array',
        'Validate endpoint completeness and consistency',
        'Save analysis to output directory'
      ],
      outputFormat: 'JSON with success (boolean), endpoints (array), endpointCategories (object), authRequirements (object), paginationPattern (string), rateLimitInfo (object), errorFormats (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'endpoints', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        endpoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              method: { type: 'string' },
              summary: { type: 'string' },
              description: { type: 'string' },
              category: { type: 'string' },
              authRequired: { type: 'boolean' },
              parameters: { type: 'array' },
              requestSchema: { type: 'object' },
              responseSchema: { type: 'object' },
              statusCodes: { type: 'array' },
              deprecated: { type: 'boolean' }
            }
          }
        },
        endpointCategories: {
          type: 'object',
          properties: {
            core: { type: 'array' },
            auxiliary: { type: 'array' },
            admin: { type: 'array' }
          }
        },
        authRequirements: { type: 'object' },
        paginationPattern: { type: 'string' },
        rateLimitInfo: { type: 'object' },
        errorFormats: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'api-docs', 'specification-analysis']
}));

// Task 2: Documentation Structure Design
export const documentationStructureDesignTask = defineTask('documentation-structure-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design documentation structure and information architecture',
  agent: {
    name: 'information-architect',
    prompt: {
      role: 'technical documentation information architect',
      task: 'Design comprehensive documentation structure and navigation',
      context: args,
      instructions: [
        'Design documentation structure following best practices:',
        '  1. Getting Started',
        '     - Overview and introduction',
        '     - Quickstart guide (5-minute setup)',
        '     - Authentication setup',
        '  2. API Reference',
        '     - Endpoints by category',
        '     - Request/response examples',
        '     - Error codes reference',
        '  3. Guides',
        '     - Authentication guide',
        '     - Pagination guide',
        '     - Rate limiting guide',
        '     - Webhooks guide (if applicable)',
        '     - Best practices',
        '  4. SDKs and Libraries',
        '     - Language-specific integration guides',
        '     - SDK installation and setup',
        '  5. Resources',
        '     - Changelog',
        '     - Versioning policy',
        '     - Support and community',
        'Design navigation hierarchy and sidebar structure',
        'Create URL structure and routing plan',
        'Plan search and discovery features',
        'Design mobile-responsive layout',
        'Consider target audience needs and skill levels',
        'Save structure design document to output directory'
      ],
      outputFormat: 'JSON with structure (object), navigation (array), sectionCount (number), urlStructure (object), searchStrategy (string), structureDocPath (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['structure', 'navigation', 'sectionCount', 'artifacts'],
      properties: {
        structure: {
          type: 'object',
          properties: {
            gettingStarted: { type: 'array' },
            apiReference: { type: 'array' },
            guides: { type: 'array' },
            sdks: { type: 'array' },
            resources: { type: 'array' }
          }
        },
        navigation: { type: 'array' },
        sectionCount: { type: 'number' },
        urlStructure: { type: 'object' },
        searchStrategy: { type: 'string' },
        structureDocPath: { type: 'string' },
        accessibility: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'api-docs', 'information-architecture']
}));

// Task 3: Authentication Documentation
export const authenticationDocumentationTask = defineTask('authentication-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create authentication and authorization documentation',
  agent: {
    name: 'auth-doc-specialist',
    prompt: {
      role: 'API security and authentication documentation specialist',
      task: 'Create comprehensive authentication documentation with code examples',
      context: args,
      instructions: [
        'Document authentication mechanism (OAuth2, API Key, Bearer token, Basic Auth)',
        'Create step-by-step authentication setup guide',
        'Document token acquisition flow with diagrams',
        'Provide code examples in all target languages for authentication',
        'Document token refresh flows (if applicable)',
        'Explain authorization and permission scopes',
        'Document authentication headers and format',
        'Provide troubleshooting guide for common auth errors',
        'Document security best practices (token storage, rotation, expiry)',
        'Include rate limiting tied to authentication',
        'Create authentication testing guide',
        'Save all documentation and examples to output directory'
      ],
      outputFormat: 'JSON with authGuide (object), codeExamples (array - one per language), flowDiagrams (array), troubleshooting (array), bestPractices (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['authGuide', 'codeExamples', 'artifacts'],
      properties: {
        authGuide: {
          type: 'object',
          properties: {
            mechanism: { type: 'string' },
            steps: { type: 'array', items: { type: 'string' } },
            path: { type: 'string' }
          }
        },
        codeExamples: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              language: { type: 'string' },
              code: { type: 'string' },
              path: { type: 'string' }
            }
          }
        },
        flowDiagrams: { type: 'array' },
        troubleshooting: { type: 'array' },
        bestPractices: { type: 'array' },
        scopes: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'api-docs', 'authentication']
}));

// Task 4: Endpoint Reference Documentation
export const endpointReferenceDocumentationTask = defineTask('endpoint-reference-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Document ${args.category} endpoints with complete reference`,
  agent: {
    name: 'endpoint-documenter',
    prompt: {
      role: 'API documentation technical writer',
      task: 'Create comprehensive endpoint reference documentation',
      context: args,
      instructions: [
        'For each endpoint, document:',
        '  - Endpoint path and HTTP method',
        '  - Summary and detailed description',
        '  - Authentication requirements',
        '  - Path parameters (name, type, required, description)',
        '  - Query parameters (name, type, required, description, default)',
        '  - Request headers (name, required, description, example)',
        '  - Request body schema (JSON/XML with field descriptions)',
        '  - Response schema for each status code',
        '  - Example requests in curl format',
        '  - Example responses (success and error cases)',
        '  - Common use cases',
        '  - Rate limiting specific to endpoint (if applicable)',
        '  - Pagination details (if applicable)',
        '  - Related endpoints (cross-references)',
        'Use clear, consistent formatting',
        'Include realistic example values',
        'Document optional vs required fields clearly',
        'Note deprecation warnings if applicable',
        'Save each endpoint documentation to separate file in output directory'
      ],
      outputFormat: 'JSON with endpointCount (number), endpointDocs (array with path, method, docPath), categoryPath (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['endpointCount', 'endpointDocs', 'artifacts'],
      properties: {
        endpointCount: { type: 'number' },
        endpointDocs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              method: { type: 'string' },
              docPath: { type: 'string' },
              title: { type: 'string' }
            }
          }
        },
        categoryPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'api-docs', 'endpoint-documentation']
}));

// Task 5: Code Examples Generation
export const codeExamplesGenerationTask = defineTask('code-examples-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate ${args.language} code examples`,
  agent: {
    name: 'code-example-generator',
    prompt: {
      role: `${args.language} developer and API integration specialist`,
      task: `Generate idiomatic ${args.language} code examples for API endpoints`,
      context: args,
      instructions: [
        `Create production-ready ${args.language} code examples for each endpoint`,
        'Include complete, runnable code (not pseudocode)',
        'Follow language-specific idioms and best practices',
        'Show proper error handling and exception catching',
        'Demonstrate authentication implementation',
        'Include request parameter examples',
        'Show response parsing and data extraction',
        'Add inline comments explaining key steps',
        'Include pagination examples (if includePagination=true)',
        'Show error handling with retry logic (if includeErrorHandling=true)',
        'Use realistic example data',
        'Include import/require statements',
        'Add setup instructions if needed (dependencies, environment variables)',
        'Ensure code is copy-paste ready',
        'Group examples by endpoint',
        'Save all code examples to output directory with proper file extensions'
      ],
      outputFormat: 'JSON with language (string), exampleCount (number), examples (array with endpoint, code, filePath), setupInstructions (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['language', 'exampleCount', 'examples', 'artifacts'],
      properties: {
        language: { type: 'string' },
        exampleCount: { type: 'number' },
        examples: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              endpoint: { type: 'string' },
              method: { type: 'string' },
              code: { type: 'string' },
              filePath: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        setupInstructions: {
          type: 'object',
          properties: {
            dependencies: { type: 'array' },
            environmentVariables: { type: 'array' },
            installCommands: { type: 'array' }
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
  labels: ['agent', 'api-docs', 'code-examples', args.language]
}));

// Task 6: Error Reference Documentation
export const errorReferenceDocumentationTask = defineTask('error-reference-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create error codes and troubleshooting reference',
  agent: {
    name: 'error-doc-specialist',
    prompt: {
      role: 'API documentation specialist focusing on error handling',
      task: 'Create comprehensive error reference and troubleshooting guide',
      context: args,
      instructions: [
        'Document all HTTP status codes used by the API',
        'For each error, document:',
        '  - Error code (HTTP status)',
        '  - Error message format',
        '  - Error response schema',
        '  - What causes this error',
        '  - How to resolve it',
        '  - Example error responses',
        'Create error code reference table',
        'Document common error scenarios and solutions',
        'Provide troubleshooting decision tree',
        'Include code examples showing error handling in key languages',
        'Document rate limit errors specifically',
        'Document authentication/authorization errors',
        'Document validation errors with field-level details',
        'Provide debugging tips',
        'Link to support resources',
        'Save error reference documentation to output directory'
      ],
      outputFormat: 'JSON with errorCodes (array), errorReference (object with docPath), troubleshootingGuide (object), commonScenarios (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['errorCodes', 'errorReference', 'artifacts'],
      properties: {
        errorCodes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              description: { type: 'string' },
              resolution: { type: 'string' },
              example: { type: 'object' }
            }
          }
        },
        errorReference: {
          type: 'object',
          properties: {
            docPath: { type: 'string' },
            count: { type: 'number' }
          }
        },
        troubleshootingGuide: { type: 'object' },
        commonScenarios: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'api-docs', 'error-reference']
}));

// Task 7: Quickstart Guide Creation
export const quickstartGuideCreationTask = defineTask('quickstart-guide-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create quickstart guide for rapid onboarding',
  agent: {
    name: 'quickstart-writer',
    prompt: {
      role: 'developer educator and technical writer',
      task: 'Create concise quickstart guide for 5-10 minute setup',
      context: args,
      instructions: [
        'Create step-by-step quickstart guide targeting 5-10 minutes to first API call',
        'Structure:',
        '  1. Prerequisites (account, API keys)',
        '  2. Installation/setup (if using SDK)',
        '  3. Authentication setup',
        '  4. Make your first API call (simple, successful example)',
        '  5. Next steps (links to detailed docs)',
        'Provide complete code examples in top 2-3 languages',
        'Use most common/simple endpoint for first call',
        'Include expected successful response',
        'Keep explanations brief but clear',
        'Highlight where to get API credentials',
        'Include troubleshooting tips for common setup issues',
        'Add "copy code" friendly formatting',
        'Link to deeper documentation for each step',
        'Save quickstart guide to output directory'
      ],
      outputFormat: 'JSON with title (string), type (string="quickstart"), path (string), steps (array), codeExamples (array), timeEstimate (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['title', 'type', 'path', 'artifacts'],
      properties: {
        title: { type: 'string' },
        type: { type: 'string', enum: ['quickstart'] },
        path: { type: 'string' },
        steps: { type: 'array', items: { type: 'string' } },
        codeExamples: { type: 'array' },
        timeEstimate: { type: 'string' },
        prerequisites: { type: 'array' },
        nextSteps: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'api-docs', 'quickstart']
}));

// Task 8: Rate Limiting Guide
export const rateLimitingGuideTask = defineTask('rate-limiting-guide', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create rate limiting guide',
  agent: {
    name: 'rate-limit-doc-specialist',
    prompt: {
      role: 'API documentation specialist',
      task: 'Create comprehensive rate limiting guide',
      context: args,
      instructions: [
        'Document rate limiting policies and tiers',
        'Explain how rate limits are calculated (per user, per IP, per endpoint)',
        'Document rate limit headers in responses',
        'Show how to check current rate limit status',
        'Provide code examples for handling rate limit errors',
        'Show retry logic and exponential backoff implementation',
        'Document rate limit reset timing',
        'Explain how to request rate limit increases',
        'Provide best practices for staying within limits',
        'Include troubleshooting for 429 errors',
        'Save guide to output directory'
      ],
      outputFormat: 'JSON with title (string), type (string="rate-limiting"), path (string), policies (object), codeExamples (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['title', 'type', 'path', 'artifacts'],
      properties: {
        title: { type: 'string' },
        type: { type: 'string', enum: ['rate-limiting'] },
        path: { type: 'string' },
        policies: { type: 'object' },
        codeExamples: { type: 'array' },
        bestPractices: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'api-docs', 'guide', 'rate-limiting']
}));

// Task 9: Pagination Guide
export const paginationGuideTask = defineTask('pagination-guide', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create pagination guide',
  agent: {
    name: 'pagination-doc-specialist',
    prompt: {
      role: 'API documentation specialist',
      task: 'Create comprehensive pagination guide',
      context: args,
      instructions: [
        'Document pagination strategy (cursor, offset, page-based)',
        'Explain pagination parameters (page, per_page, cursor, limit)',
        'Document pagination metadata in responses (total, has_more, next_cursor)',
        'Provide code examples showing how to iterate through all pages',
        'Show how to handle last page detection',
        'Document maximum page size limits',
        'Include performance considerations',
        'Provide best practices for pagination',
        'Show examples in top target languages',
        'Save guide to output directory'
      ],
      outputFormat: 'JSON with title (string), type (string="pagination"), path (string), strategy (string), codeExamples (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['title', 'type', 'path', 'artifacts'],
      properties: {
        title: { type: 'string' },
        type: { type: 'string', enum: ['pagination'] },
        path: { type: 'string' },
        strategy: { type: 'string' },
        codeExamples: { type: 'array' },
        parameters: { type: 'array' },
        bestPractices: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'api-docs', 'guide', 'pagination']
}));

// Task 10: Webhooks Guide
export const webhooksGuideTask = defineTask('webhooks-guide', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create webhooks guide',
  agent: {
    name: 'webhooks-doc-specialist',
    prompt: {
      role: 'API documentation specialist',
      task: 'Create webhooks integration guide',
      context: args,
      instructions: [
        'Document webhook event types and payloads',
        'Explain webhook setup and configuration',
        'Document webhook URL requirements',
        'Explain webhook signature verification for security',
        'Provide code examples for webhook handlers',
        'Document retry policies and timeouts',
        'Show how to test webhooks locally',
        'Include troubleshooting guide',
        'Document webhook event ordering and idempotency',
        'Provide best practices',
        'If API has no webhooks, create placeholder doc noting this',
        'Save guide to output directory'
      ],
      outputFormat: 'JSON with title (string), type (string="webhooks"), path (string), eventTypes (array), codeExamples (array), hasWebhooks (boolean), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['title', 'type', 'path', 'hasWebhooks', 'artifacts'],
      properties: {
        title: { type: 'string' },
        type: { type: 'string', enum: ['webhooks'] },
        path: { type: 'string' },
        hasWebhooks: { type: 'boolean' },
        eventTypes: { type: 'array' },
        codeExamples: { type: 'array' },
        securityGuidance: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'api-docs', 'guide', 'webhooks']
}));

// Task 11: Best Practices Guide
export const bestPracticesGuideTask = defineTask('best-practices-guide', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create API best practices guide',
  agent: {
    name: 'best-practices-specialist',
    prompt: {
      role: 'senior API architect and developer advocate',
      task: 'Create comprehensive API best practices guide',
      context: args,
      instructions: [
        'Document API usage best practices:',
        '  - Efficient request patterns',
        '  - Caching strategies',
        '  - Error handling and retries',
        '  - Connection pooling and keep-alive',
        '  - Request batching (if supported)',
        '  - Idempotency',
        '  - Security best practices (token management, HTTPS)',
        '  - Performance optimization tips',
        '  - Testing strategies',
        '  - Production readiness checklist',
        'Provide code examples demonstrating best practices',
        'Include common anti-patterns to avoid',
        'Add scalability considerations',
        'Include monitoring and observability recommendations',
        'Save guide to output directory'
      ],
      outputFormat: 'JSON with title (string), type (string="best-practices"), path (string), categories (array), codeExamples (array), antiPatterns (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['title', 'type', 'path', 'categories', 'artifacts'],
      properties: {
        title: { type: 'string' },
        type: { type: 'string', enum: ['best-practices'] },
        path: { type: 'string' },
        categories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              practices: { type: 'array' }
            }
          }
        },
        codeExamples: { type: 'array' },
        antiPatterns: { type: 'array' },
        checklist: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'api-docs', 'guide', 'best-practices']
}));

// Task 12: SDK Integration Guide
export const sdkIntegrationGuideTask = defineTask('sdk-integration-guide', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create ${args.language} SDK integration guide`,
  agent: {
    name: 'sdk-integration-specialist',
    prompt: {
      role: `${args.language} SDK specialist and developer educator`,
      task: `Create comprehensive ${args.language} SDK integration guide`,
      context: args,
      instructions: [
        `Document ${args.language} SDK installation and setup`,
        'Show initialization and configuration',
        'Document SDK authentication setup',
        'Provide examples of common operations using SDK',
        'Document SDK-specific features and helpers',
        'Show error handling with SDK',
        'Document SDK configuration options',
        'Include troubleshooting section',
        'Provide end-to-end integration example',
        'Link to SDK source code repository',
        'Include version compatibility information',
        'Add upgrade guides if SDK is established',
        'Save guide to output directory'
      ],
      outputFormat: 'JSON with title (string), type (string="sdk-integration"), path (string), language (string), installation (object), codeExamples (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['title', 'type', 'path', 'language', 'artifacts'],
      properties: {
        title: { type: 'string' },
        type: { type: 'string', enum: ['sdk-integration'] },
        path: { type: 'string' },
        language: { type: 'string' },
        installation: {
          type: 'object',
          properties: {
            packageManager: { type: 'string' },
            command: { type: 'string' },
            version: { type: 'string' }
          }
        },
        codeExamples: { type: 'array' },
        configuration: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'api-docs', 'sdk', args.language]
}));

// Task 13: Interactive API Explorer
export const interactiveApiExplorerTask = defineTask('interactive-api-explorer', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Setup interactive API explorer',
  agent: {
    name: 'api-explorer-specialist',
    prompt: {
      role: 'API documentation engineer and tooling specialist',
      task: 'Setup interactive API explorer with try-it-out functionality',
      context: args,
      instructions: [
        'Based on docPlatform and apiType, recommend explorer tool:',
        '  - Swagger UI (for OpenAPI/REST)',
        '  - Redoc (for OpenAPI/REST, read-only)',
        '  - GraphQL Playground (for GraphQL)',
        '  - Postman Collection (universal)',
        'Generate configuration for chosen explorer',
        'Setup API specification integration',
        'Configure authentication UI',
        'Setup try-it-out environment (test server URLs)',
        'Configure CORS if needed for try-it-out',
        'Add custom branding/theming configuration',
        'Document how to use the interactive explorer',
        'Include screenshots or walkthrough',
        'Save explorer configuration to output directory'
      ],
      outputFormat: 'JSON with explorerType (string), explorerUrl (string), configuration (object), setupGuide (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['explorerType', 'configuration', 'artifacts'],
      properties: {
        explorerType: { type: 'string' },
        explorerUrl: { type: 'string' },
        configuration: { type: 'object' },
        setupGuide: {
          type: 'object',
          properties: {
            path: { type: 'string' },
            steps: { type: 'array' }
          }
        },
        integrationNotes: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'api-docs', 'interactive-explorer']
}));

// Task 14: Documentation Quality Validation
export const documentationQualityValidationTask = defineTask('documentation-quality-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate documentation quality and completeness',
  agent: {
    name: 'documentation-qa-specialist',
    prompt: {
      role: 'documentation quality assurance specialist',
      task: 'Validate documentation completeness, accuracy, and quality',
      context: args,
      instructions: [
        'Evaluate documentation completeness (weight: 30%):',
        '  - All endpoints documented?',
        '  - Authentication documented?',
        '  - Error codes documented?',
        '  - Code examples for target languages?',
        '  - Guides created?',
        'Evaluate code example quality (weight: 25%):',
        '  - Code is runnable and correct?',
        '  - Examples follow language best practices?',
        '  - Error handling included?',
        '  - Authentication shown?',
        '  - Comments and explanations adequate?',
        'Evaluate structure and navigation (weight: 20%):',
        '  - Logical information architecture?',
        '  - Easy to find information?',
        '  - Consistent formatting?',
        '  - Good navigation design?',
        'Evaluate clarity and writing quality (weight: 15%):',
        '  - Clear, concise language?',
        '  - Technical accuracy?',
        '  - Appropriate for audience?',
        'Evaluate accessibility (weight: 10%):',
        '  - Proper heading hierarchy?',
        '  - Alt text for images?',
        '  - Keyboard navigable?',
        'Calculate weighted overall score (0-100)',
        'Identify gaps and missing elements',
        'Provide specific improvement recommendations',
        'Generate quality report',
        'Save report to output directory'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), componentScores (object), completeness (object), gaps (array), recommendations (array), reportPath (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'completeness', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            completeness: { type: 'number' },
            codeExampleQuality: { type: 'number' },
            structureNavigation: { type: 'number' },
            clarityWriting: { type: 'number' },
            accessibility: { type: 'number' }
          }
        },
        completeness: {
          type: 'object',
          properties: {
            endpointsDocumented: { type: 'number' },
            totalEndpoints: { type: 'number' },
            hasAuthentication: { type: 'boolean' },
            hasErrorReference: { type: 'boolean' },
            hasQuickstart: { type: 'boolean' },
            codeExampleCoverage: { type: 'number' }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        strengths: { type: 'array', items: { type: 'string' } },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'api-docs', 'quality-validation']
}));

// Task 15: Documentation Packaging
export const documentationPackagingTask = defineTask('documentation-packaging', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Package documentation with index and navigation',
  agent: {
    name: 'documentation-publisher',
    prompt: {
      role: 'documentation engineer and technical writer',
      task: 'Package complete documentation with index, navigation, and deployment configuration',
      context: args,
      instructions: [
        'Create comprehensive documentation index (table of contents)',
        'Generate sidebar navigation configuration',
        'Create landing page with overview and quick links',
        'Setup documentation versioning structure (if applicable)',
        'Create search index configuration',
        'Generate sitemap for documentation',
        'Create deployment configuration for docPlatform',
        'Setup redirects for deprecated content',
        'Create 404 page',
        'Add analytics configuration (if applicable)',
        'Generate README for documentation repository',
        'Create contribution guidelines for docs',
        'Validate all internal links',
        'Check for broken cross-references',
        'Generate deployment checklist',
        'Save all packaging files to output directory'
      ],
      outputFormat: 'JSON with indexPath (string), navigationConfig (object), landingPagePath (string), deploymentConfig (object), deploymentReady (boolean), checklist (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['indexPath', 'deploymentReady', 'artifacts'],
      properties: {
        indexPath: { type: 'string' },
        navigationConfig: { type: 'object' },
        landingPagePath: { type: 'string' },
        deploymentConfig: {
          type: 'object',
          properties: {
            platform: { type: 'string' },
            configPath: { type: 'string' }
          }
        },
        deploymentReady: { type: 'boolean' },
        checklist: { type: 'array', items: { type: 'string' } },
        sitemapPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'api-docs', 'packaging', 'deployment']
}));
