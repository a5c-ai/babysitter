/**
 * @process specializations/technical-documentation/api-doc-generation
 * @description Automated process to generate comprehensive API documentation from OpenAPI/Swagger specifications
 * @specialization Technical Documentation
 * @category API Documentation
 * @inputs { specPath: string, outputFormat: string[], includeExamples: boolean, languages: string[], interactive: boolean }
 * @outputs { success: boolean, documentation: object, quality: number, artifacts: string[] }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    specPath,
    outputFormat = ['html', 'markdown'],
    includeExamples = true,
    languages = ['javascript', 'python', 'curl'],
    interactive = true,
    targetQuality = 90
  } = inputs;

  let lastFeedback_finalApproval = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    // No preceding task identified for re-run with feedback
    const finalApproval = await ctx.breakpoint({
    question: 'Starting API documentation generation. Analyze OpenAPI spec?',
    title: 'Phase 1: Specification Analysis',
    context: {
      runId: ctx.runId,
      phase: 'specification-analysis',
      specPath
    },
    expert: 'owner',
    tags: ['approval-gate'],
    previousFeedback: lastFeedback_finalApproval || undefined,
    attempt: attempt > 0 ? attempt + 1 : undefined
    });
    if (finalApproval.approved) break;
    lastFeedback_finalApproval = finalApproval.response || finalApproval.feedback || 'Changes requested';
  }
  let specAnalysis = await ctx.task(analyzeSpecTask, { specPath });

  if (!specAnalysis.valid) {
    return {
      success: false,
      error: 'Invalid OpenAPI specification',
      details: specAnalysis.errors,
      metadata: { processId: 'api-doc-generation', timestamp: ctx.now() }
    };
  }
  let lastFeedback_phase2Review = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (lastFeedback_phase2Review) {
      specAnalysis = await ctx.task(analyzeSpecTask, { ...{ specPath }, feedback: lastFeedback_phase2Review, attempt: attempt + 1 });
    }
  const phase2Review = await ctx.breakpoint({
    question: 'Specification validated. Generate documentation content?',
    title: 'Phase 2: Content Generation',
    context: {
      runId: ctx.runId,
      phase: 'content-generation',
      endpoints: specAnalysis.endpointCount,
      schemas: specAnalysis.schemaCount
    },
    expert: 'owner',
    tags: ['approval-gate'],
    previousFeedback: lastFeedback_phase2Review || undefined,
    attempt: attempt > 0 ? attempt + 1 : undefined
    });
    if (phase2Review.approved) break;
    lastFeedback_phase2Review = phase2Review.response || phase2Review.feedback || 'Changes requested';
  }
  const [apiReference, codeExamples, authGuide] = await Promise.all([
    ctx.task(generateApiReferenceTask, {
      spec: specAnalysis.spec,
      outputFormat,
      interactive
    }),
    includeExamples ? ctx.task(generateCodeExamplesTask, {
      spec: specAnalysis.spec,
      languages
    }) : Promise.resolve({ examples: [] }),
    ctx.task(generateAuthGuideTask, {
      spec: specAnalysis.spec,
      securitySchemes: specAnalysis.securitySchemes
    })
  ]);

  // Phase 3: Interactive Documentation Setup
  let interactiveDocs = null;
      let lastFeedback_phase3Review = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (lastFeedback_phase3Review) {
        specAnalysis = await ctx.task(analyzeSpecTask, { ...{ specPath }, feedback: lastFeedback_phase3Review, attempt: attempt + 1 });
      }
  const phase3Review = await ctx.breakpoint({
      question: 'Setup interactive API explorer (Swagger UI/Redoc)?',
      title: 'Phase 3: Interactive Documentation',
      context: {
        runId: ctx.runId,
        phase: 'interactive-setup'
      },
      expert: 'owner',
      tags: ['approval-gate'],
      previousFeedback: lastFeedback_phase3Review || undefined,
      attempt: attempt > 0 ? attempt + 1 : undefined
      });
      if (phase3Review.approved) break;
      lastFeedback_phase3Review = phase3Review.response || phase3Review.feedback || 'Changes requested';
    }    interactiveDocs = await ctx.task(setupInteractiveDocsTask, {
      spec: specAnalysis.spec,
      specPath,
      outputFormat
    });
  }
  let lastFeedback_phase4Review = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (lastFeedback_phase4Review) {
      specAnalysis = await ctx.task(analyzeSpecTask, { ...{ specPath }, feedback: lastFeedback_phase4Review, attempt: attempt + 1 });
    }
  const phase4Review = await ctx.breakpoint({
    question: 'Generate error reference and SDK integration guides?',
    title: 'Phase 4: Supplementary Documentation',
    context: {
      runId: ctx.runId,
      phase: 'supplementary-docs'
    },
    expert: 'owner',
    tags: ['approval-gate'],
    previousFeedback: lastFeedback_phase4Review || undefined,
    attempt: attempt > 0 ? attempt + 1 : undefined
    });
    if (phase4Review.approved) break;
    lastFeedback_phase4Review = phase4Review.response || phase4Review.feedback || 'Changes requested';
  }
  const [errorReference, sdkGuide] = await Promise.all([
    ctx.task(generateErrorReferenceTask, {
      spec: specAnalysis.spec,
      responses: specAnalysis.responses
    }),
    ctx.task(generateSdkIntegrationTask, {
      spec: specAnalysis.spec,
      languages
    })
  ]);

    let lastFeedback_phase5Review = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (lastFeedback_phase5Review) {
      specAnalysis = await ctx.task(analyzeSpecTask, { ...{ specPath }, feedback: lastFeedback_phase5Review, attempt: attempt + 1 });
    }
  const phase5Review = await ctx.breakpoint({
    question: 'Validate documentation quality and test examples?',
    title: 'Phase 5: Quality Validation',
    context: {
      runId: ctx.runId,
      phase: 'quality-validation',
      targetQuality
    },
    expert: 'owner',
    tags: ['approval-gate'],
    previousFeedback: lastFeedback_phase5Review || undefined,
    attempt: attempt > 0 ? attempt + 1 : undefined
    });
    if (phase5Review.approved) break;
    lastFeedback_phase5Review = phase5Review.response || phase5Review.feedback || 'Changes requested';
  }
  let qualityResult = await ctx.task(validateDocumentationQualityTask, {
    apiReference,
    codeExamples,
    authGuide,
    errorReference,
    sdkGuide,
    interactiveDocs,
    targetQuality
  });

  const quality = qualityResult.score;

  // Phase 6: Example Testing (if examples generated)
  let exampleTests = null;
  if (includeExamples) {
    exampleTests = await ctx.task(testCodeExamplesTask, {
      examples: codeExamples.examples,
      spec: specAnalysis.spec
    });

        let lastFeedback_phase6Review = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        if (lastFeedback_phase6Review) {
          qualityResult = await ctx.task(validateDocumentationQualityTask, { ...{
    apiReference,
    codeExamples,
    authGuide,
    errorReference,
    sdkGuide,
    interactiveDocs,
    targetQuality
  }, feedback: lastFeedback_phase6Review, attempt: attempt + 1 });
        }
  const phase6Review = await ctx.breakpoint({
        question: `${exampleTests.failedCount} code examples failed. Review and fix?`,
        title: 'Example Test Failures',
        context: {
          runId: ctx.runId,
          failures: exampleTests.failures,
          files: [{ path: `artifacts/example-test-results.json`, format: 'json' }]
        },
        expert: 'owner',
        tags: ['approval-gate'],
        previousFeedback: lastFeedback_phase6Review || undefined,
        attempt: attempt > 0 ? attempt + 1 : undefined
        });
        if (phase6Review.approved) break;
        lastFeedback_phase6Review = phase6Review.response || phase6Review.feedback || 'Changes requested';
      }   }
  }
  // Phase 7: Documentation Assembly and Deployment
  const deployReady = quality >= targetQuality && (!exampleTests || exampleTests.failedCount === 0);

      let lastFeedback_phase7Review = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (lastFeedback_phase7Review) {
        qualityResult = await ctx.task(validateDocumentationQualityTask, { ...{
    apiReference,
    codeExamples,
    authGuide,
    errorReference,
    sdkGuide,
    interactiveDocs,
    targetQuality
  }, feedback: lastFeedback_phase7Review, attempt: attempt + 1 });
      }
  const phase7Review = await ctx.breakpoint({
      question: 'Quality standards met. Assemble and deploy documentation?',
      title: 'Phase 7: Assembly and Deployment',
      context: {
        runId: ctx.runId,
        phase: 'deployment',
        quality,
        targetQuality
      },
      expert: 'owner',
      tags: ['approval-gate'],
      previousFeedback: lastFeedback_phase7Review || undefined,
      attempt: attempt > 0 ? attempt + 1 : undefined
      });
      if (phase7Review.approved) break;
      lastFeedback_phase7Review = phase7Review.response || phase7Review.feedback || 'Changes requested';
    }
  let deployment = await ctx.task(assembleAndDeployTask, {
      apiReference,
      codeExamples,
      authGuide,
      errorReference,
      sdkGuide,
      interactiveDocs,
      outputFormat
    });

    return {
      success: true,
      deployed: deployment.deployed,
      documentation: {
        apiReference: apiReference.outputPath,
        codeExamples: codeExamples.exampleCount,
        authGuide: authGuide.outputPath,
        errorReference: errorReference.outputPath,
        sdkGuide: sdkGuide.outputPath,
        interactiveDocs: interactiveDocs?.url || null
      },
      quality,
      targetQuality,
      artifacts: deployment.artifacts,
      endpoints: specAnalysis.endpointCount,
      schemas: specAnalysis.schemaCount,
      exampleTests: exampleTests?.summary || null,
      metadata: {
        processId: 'specializations/technical-documentation/api-doc-generation',
        timestamp: ctx.now(),
        languages,
        outputFormat
      }
    };
      let lastFeedback_finalApproval2 = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (lastFeedback_finalApproval2) {
        deployment = await ctx.task(assembleAndDeployTask, { ...{
      apiReference,
      codeExamples,
      authGuide,
      errorReference,
      sdkGuide,
      interactiveDocs,
      outputFormat
    }, feedback: lastFeedback_finalApproval2, attempt: attempt + 1 });
      }
  const finalApproval2 = await ctx.breakpoint({
      question: `Quality ${quality}/${targetQuality} below threshold${exampleTests ? ` or ${exampleTests.failedCount} examples failed` : ''}. Iterate?`,
      title: 'Quality Gate Failed',
      context: {
        runId: ctx.runId,
        quality,
        targetQuality,
        exampleTests: exampleTests?.summary,
        recommendations: qualityResult.recommendations
      },
      expert: 'owner',
      tags: ['approval-gate'],
      previousFeedback: lastFeedback_finalApproval2 || undefined,
      attempt: attempt > 0 ? attempt + 1 : undefined
      });
      if (finalApproval2.approved) break;
      lastFeedback_finalApproval2 = finalApproval2.response || finalApproval2.feedback || 'Changes requested';
    }
  return {
      success: false,
      qualityGateFailed: true,
      quality,
      targetQuality,
      recommendations: qualityResult.recommendations,
      exampleTests: exampleTests?.summary || null,
      metadata: {
        processId: 'specializations/technical-documentation/api-doc-generation',
        timestamp: ctx.now()
      }
    };
  }
}
  // Task Definitions

export const analyzeSpecTask = defineTask('analyze-spec', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze OpenAPI/Swagger Specification',
  skill: { name: 'openapi-swagger' },
  agent: {
    name: 'api-docs-specialist',
    prompt: {
      role: 'API documentation specialist',
      task: 'Analyze and validate OpenAPI/Swagger specification',
      context: args,
      instructions: [
        'Read and parse OpenAPI specification from specPath',
        'Validate specification against OpenAPI 3.0/3.1 or Swagger 2.0 schema',
        'Extract metadata: version, endpoints, schemas, security schemes',
        'Count total endpoints, operations, request/response schemas',
        'Identify authentication mechanisms and security requirements',
        'Detect potential issues: missing descriptions, incomplete schemas, deprecated endpoints',
        'Assess specification completeness and quality'
      ],
      outputFormat: 'JSON with valid, spec object, endpointCount, schemaCount, securitySchemes, errors, warnings'
    },
    outputSchema: {
      type: 'object',
      required: ['valid', 'endpointCount', 'schemaCount'],
      properties: {
        valid: { type: 'boolean' },
        spec: { type: 'object' },
        endpointCount: { type: 'number' },
        schemaCount: { type: 'number' },
        securitySchemes: { type: 'array', items: { type: 'string' } },
        responses: { type: 'array' },
        errors: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } },
        completeness: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'api-docs', 'spec-analysis']
}));

export const generateApiReferenceTask = defineTask('generate-api-reference', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate API Reference Documentation',
  skill: { name: 'openapi-swagger' },
  agent: {
    name: 'api-docs-specialist',
    prompt: {
      role: 'technical writer specializing in API documentation',
      task: 'Generate comprehensive API reference documentation',
      context: args,
      instructions: [
        'Create complete API reference from OpenAPI specification',
        'Document each endpoint with: description, parameters, request body, responses, examples',
        'Include HTTP methods, URL paths, path parameters, query parameters, headers',
        'Document request and response schemas with data types and constraints',
        'Add status codes with descriptions and example responses',
        'Include rate limiting information if specified',
        'Create navigation structure organized by resource/tag',
        'Generate in requested output formats (HTML, Markdown, etc.)',
        'Add interactive try-it-out functionality if interactive=true',
        'Ensure all descriptions are clear and developer-friendly'
      ],
      outputFormat: 'JSON with outputPath, endpointDocs array, navigationStructure, format'
    },
    outputSchema: {
      type: 'object',
      required: ['outputPath', 'endpointDocs'],
      properties: {
        outputPath: { type: 'string' },
        endpointDocs: { type: 'array', items: { type: 'object' } },
        navigationStructure: { type: 'object' },
        format: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'api-docs', 'reference-generation']
}));

export const generateCodeExamplesTask = defineTask('generate-code-examples', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Code Examples (${args.languages.join(', ')})`,
  skill: { name: 'code-sample-validator' },
  agent: {
    name: 'api-docs-specialist',
    prompt: {
      role: 'developer advocate with expertise in multiple programming languages',
      task: 'Generate working code examples for API endpoints',
      context: args,
      instructions: [
        'Generate code examples for each API endpoint in specified languages',
        'Include examples for: JavaScript/Node.js, Python, cURL, and other requested languages',
        'Show authentication/authorization in examples',
        'Include error handling patterns',
        'Demonstrate request body construction',
        'Show response parsing and data extraction',
        'Add comments explaining key steps',
        'Ensure examples are copy-paste ready and executable',
        'Include package imports and setup code',
        'Show both success and error response handling'
      ],
      outputFormat: 'JSON with examples array (endpoint, language, code, description), exampleCount'
    },
    outputSchema: {
      type: 'object',
      required: ['examples', 'exampleCount'],
      properties: {
        examples: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              endpoint: { type: 'string' },
              method: { type: 'string' },
              language: { type: 'string' },
              code: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        exampleCount: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'api-docs', 'code-examples']
}));

export const generateAuthGuideTask = defineTask('generate-auth-guide', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate Authentication Guide',
  skill: { name: 'openapi-swagger' },
  agent: {
    name: 'api-docs-specialist',
    prompt: {
      role: 'security-focused technical writer',
      task: 'Create comprehensive authentication and authorization guide',
      context: args,
      instructions: [
        'Document all authentication mechanisms from specification',
        'Explain authentication flow step-by-step',
        'Show how to obtain credentials/tokens (API keys, OAuth, JWT)',
        'Document token refresh procedures if applicable',
        'Include authentication code examples in multiple languages',
        'Explain authorization scopes and permissions',
        'Document security best practices (token storage, rotation)',
        'Add troubleshooting section for common auth errors',
        'Include rate limiting and quota information',
        'Show example authentication headers and requests'
      ],
      outputFormat: 'JSON with outputPath, authMechanisms array, examples, troubleshooting'
    },
    outputSchema: {
      type: 'object',
      required: ['outputPath', 'authMechanisms'],
      properties: {
        outputPath: { type: 'string' },
        authMechanisms: { type: 'array', items: { type: 'string' } },
        examples: { type: 'array' },
        troubleshooting: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'api-docs', 'authentication']
}));

export const setupInteractiveDocsTask = defineTask('setup-interactive-docs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Setup Interactive API Explorer',
  skill: { name: 'openapi-swagger' },
  agent: {
    name: 'api-docs-specialist',
    prompt: {
      role: 'DevOps engineer specializing in documentation platforms',
      task: 'Setup interactive API documentation with Swagger UI or Redoc',
      context: args,
      instructions: [
        'Choose appropriate tool: Swagger UI (full interactive), Redoc (clean readable), or both',
        'Configure Swagger UI with spec path and customization options',
        'Enable try-it-out functionality for testing endpoints',
        'Configure CORS and API server URLs',
        'Add custom branding and styling if specified',
        'Setup authentication integration for try-it-out',
        'Generate deployment configuration',
        'Create index.html or hosting setup',
        'Add deep linking to specific endpoints',
        'Configure search and navigation features'
      ],
      outputFormat: 'JSON with url, tool, configPath, deploymentReady, features'
    },
    outputSchema: {
      type: 'object',
      required: ['tool', 'configPath'],
      properties: {
        url: { type: 'string' },
        tool: { type: 'string', enum: ['swagger-ui', 'redoc', 'both'] },
        configPath: { type: 'string' },
        deploymentReady: { type: 'boolean' },
        features: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'api-docs', 'interactive-setup']
}));

export const generateErrorReferenceTask = defineTask('generate-error-reference', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate Error Reference Documentation',
  skill: { name: 'openapi-swagger' },
  agent: {
    name: 'api-docs-specialist',
    prompt: {
      role: 'technical writer specializing in API error documentation',
      task: 'Create comprehensive error code reference',
      context: args,
      instructions: [
        'Extract all error responses from OpenAPI specification',
        'Document each HTTP status code used by the API',
        'Create error code reference with: code, message, description, cause, resolution',
        'Include error response schema and example payloads',
        'Add troubleshooting steps for common errors',
        'Document error handling best practices',
        'Include retry logic recommendations',
        'Add debugging tips and logging guidance',
        'Create error category groupings (authentication, validation, server, rate limit)',
        'Show code examples for error handling in multiple languages'
      ],
      outputFormat: 'JSON with outputPath, errorCodes array, categories, troubleshooting'
    },
    outputSchema: {
      type: 'object',
      required: ['outputPath', 'errorCodes'],
      properties: {
        outputPath: { type: 'string' },
        errorCodes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              httpStatus: { type: 'number' },
              message: { type: 'string' },
              description: { type: 'string' },
              resolution: { type: 'string' }
            }
          }
        },
        categories: { type: 'object' },
        troubleshooting: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'api-docs', 'error-reference']
}));

export const generateSdkIntegrationTask = defineTask('generate-sdk-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate SDK Integration Guide',
  skill: { name: 'jsdoc-tsdoc' },
  agent: {
    name: 'api-docs-specialist',
    prompt: {
      role: 'developer advocate creating SDK integration guides',
      task: 'Create comprehensive SDK integration documentation',
      context: args,
      instructions: [
        'Create quickstart guide for each language SDK',
        'Document installation steps (npm, pip, composer, etc.)',
        'Show SDK initialization and configuration',
        'Include authentication setup with SDK',
        'Document key SDK methods and their usage',
        'Add end-to-end integration examples',
        'Show common use cases and workflows',
        'Include async/await patterns where applicable',
        'Document SDK error handling patterns',
        'Add SDK configuration options and customization',
        'Include migration guide if updating from previous version'
      ],
      outputFormat: 'JSON with outputPath, sdkLanguages array, quickstarts, examples'
    },
    outputSchema: {
      type: 'object',
      required: ['outputPath', 'sdkLanguages'],
      properties: {
        outputPath: { type: 'string' },
        sdkLanguages: { type: 'array', items: { type: 'string' } },
        quickstarts: { type: 'array' },
        examples: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'api-docs', 'sdk-integration']
}));

export const validateDocumentationQualityTask = defineTask('validate-documentation-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Documentation Quality',
  skill: { name: 'tech-writing-lint' },
  agent: {
    name: 'docs-qa-analyst',
    prompt: {
      role: 'documentation quality assurance specialist',
      task: 'Assess documentation quality against best practices',
      context: args,
      instructions: [
        'Evaluate API reference completeness and clarity (0-100 score)',
        'Check all endpoints have descriptions, examples, and schema documentation',
        'Validate code examples are present for all major endpoints',
        'Assess authentication guide clarity and completeness',
        'Verify error reference covers all status codes',
        'Check SDK integration guide has quickstart and examples',
        'Evaluate overall documentation structure and navigation',
        'Check for consistency in terminology and formatting',
        'Validate examples are syntactically correct and follow best practices',
        'Provide overall quality score (0-100) and detailed recommendations'
      ],
      outputFormat: 'JSON with score, passed, completeness, clarity, consistency, recommendations array'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'passed'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        passed: { type: 'boolean' },
        completeness: { type: 'number' },
        clarity: { type: 'number' },
        consistency: { type: 'number' },
        recommendations: { type: 'array', items: { type: 'string' } },
        issues: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'api-docs', 'quality-validation']
}));

export const testCodeExamplesTask = defineTask('test-code-examples', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Test Code Examples',
  skill: { name: 'code-sample-validator' },
  agent: {
    name: 'docs-qa-analyst',
    prompt: {
      role: 'QA engineer testing documentation code examples',
      task: 'Validate and test all code examples for correctness',
      context: args,
      instructions: [
        'Review each code example for syntax correctness',
        'Validate examples match the OpenAPI specification',
        'Check imports and dependencies are correct',
        'Verify authentication patterns are properly implemented',
        'Validate request/response handling',
        'Check error handling is demonstrated',
        'Ensure examples are runnable (syntax-wise)',
        'Identify any deprecated or insecure patterns',
        'Report failed examples with specific issues',
        'Provide fix recommendations for failures'
      ],
      outputFormat: 'JSON with passed, failed, totalCount, failedCount, failures array, summary'
    },
    outputSchema: {
      type: 'object',
      required: ['totalCount', 'failedCount', 'passed'],
      properties: {
        passed: { type: 'boolean' },
        totalCount: { type: 'number' },
        failedCount: { type: 'number' },
        passedCount: { type: 'number' },
        failures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              endpoint: { type: 'string' },
              language: { type: 'string' },
              issue: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'api-docs', 'example-testing']
}));

export const assembleAndDeployTask = defineTask('assemble-and-deploy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assemble and Deploy Documentation',
  skill: { name: 'openapi-swagger' },
  agent: {
    name: 'api-docs-specialist',
    prompt: {
      role: 'documentation engineer managing deployment',
      task: 'Assemble complete documentation package and prepare deployment',
      context: args,
      instructions: [
        'Organize all documentation artifacts into proper structure',
        'Create main navigation and index pages',
        'Link all documentation sections together',
        'Generate table of contents and search index',
        'Bundle interactive documentation assets',
        'Create deployment package with all formats requested',
        'Generate static site if outputFormat includes HTML',
        'Create README with usage instructions',
        'Package code examples as downloadable files',
        'Prepare deployment configuration (hosting, CDN)',
        'Generate artifact manifest with all output files'
      ],
      outputFormat: 'JSON with deployed, artifacts array, deploymentUrl, format, structure'
    },
    outputSchema: {
      type: 'object',
      required: ['deployed', 'artifacts'],
      properties: {
        deployed: { type: 'boolean' },
        artifacts: { type: 'array', items: { type: 'string' } },
        deploymentUrl: { type: 'string' },
        format: { type: 'array', items: { type: 'string' } },
        structure: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'api-docs', 'deployment']
}));
