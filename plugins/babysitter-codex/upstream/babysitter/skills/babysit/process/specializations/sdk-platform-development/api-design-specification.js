/**
 * @process specializations/sdk-platform-development/api-design-specification
 * @description API Design Specification - Create comprehensive API design following RESTful, GraphQL, or gRPC best practices
 * including resource-oriented design, URL conventions, request/response schemas, and error handling patterns.
 * @inputs { projectName: string, apiType: string, resources?: array, authMethods?: array, versioningStrategy?: string }
 * @outputs { success: boolean, specification: object, schemas: array, guidelines: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/sdk-platform-development/api-design-specification', {
 *   projectName: 'CloudAPI',
 *   apiType: 'REST',
 *   resources: ['users', 'organizations', 'projects'],
 *   authMethods: ['api-key', 'oauth2'],
 *   versioningStrategy: 'url-path'
 * });
 *
 * @references
 * - OpenAPI Specification: https://spec.openapis.org/oas/latest.html
 * - Google API Design Guide: https://cloud.google.com/apis/design
 * - Microsoft REST API Guidelines: https://github.com/microsoft/api-guidelines
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    apiType = 'REST',
    resources = [],
    authMethods = ['api-key'],
    versioningStrategy = 'url-path',
    pagination = 'cursor',
    outputDir = 'api-design-specification'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting API Design Specification: ${projectName}`);
  ctx.log('info', `API Type: ${apiType}`);
  ctx.log('info', `Resources: ${resources.length > 0 ? resources.join(', ') : 'To be defined'}`);

  // ============================================================================
  // PHASE 1: REQUIREMENTS GATHERING
  // ============================================================================

  ctx.log('info', 'Phase 1: Gathering API requirements');

  const requirements = await ctx.task(requirementsTask, {
    projectName,
    apiType,
    resources,
    authMethods,
    outputDir
  });

  artifacts.push(...requirements.artifacts);

  // ============================================================================
  // PHASE 2: RESOURCE-ORIENTED DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing resource-oriented API structure');

  const resourceDesign = await ctx.task(resourceDesignTask, {
    projectName,
    apiType,
    resources,
    requirements,
    outputDir
  });

  artifacts.push(...resourceDesign.artifacts);

  // ============================================================================
  // PHASE 3: URL CONVENTIONS AND NAMING
  // ============================================================================

  ctx.log('info', 'Phase 3: Establishing URL conventions and naming standards');

  const urlConventions = await ctx.task(urlConventionsTask, {
    projectName,
    apiType,
    versioningStrategy,
    resourceDesign,
    outputDir
  });

  artifacts.push(...urlConventions.artifacts);

  // ============================================================================
  // PHASE 4: REQUEST/RESPONSE SCHEMA DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 4: Designing request/response schemas');

  const schemaDesign = await ctx.task(schemaDesignTask, {
    projectName,
    apiType,
    resourceDesign,
    pagination,
    outputDir
  });

  artifacts.push(...schemaDesign.artifacts);

  // Quality Gate: Schema Review
  await ctx.breakpoint({
    question: `API schema design complete for ${projectName}. Resources: ${resourceDesign.resources.length}, Schemas: ${schemaDesign.schemas.length}. Approve schema design?`,
    title: 'API Schema Design Review',
    context: {
      runId: ctx.runId,
      projectName,
      resources: resourceDesign.resources,
      schemaCount: schemaDesign.schemas.length,
      files: artifacts.slice(-5).map(a => ({ path: a.path, format: a.format || 'yaml' }))
    }
  });

  // ============================================================================
  // PHASE 5: ERROR HANDLING PATTERNS
  // ============================================================================

  ctx.log('info', 'Phase 5: Documenting error handling patterns');

  const errorPatterns = await ctx.task(errorPatternsTask, {
    projectName,
    apiType,
    outputDir
  });

  artifacts.push(...errorPatterns.artifacts);

  // ============================================================================
  // PHASE 6: AUTHENTICATION DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 6: Designing authentication and authorization');

  const authDesign = await ctx.task(authDesignTask, {
    projectName,
    apiType,
    authMethods,
    outputDir
  });

  artifacts.push(...authDesign.artifacts);

  // ============================================================================
  // PHASE 7: PAGINATION AND FILTERING
  // ============================================================================

  ctx.log('info', 'Phase 7: Designing pagination and filtering patterns');

  const paginationDesign = await ctx.task(paginationDesignTask, {
    projectName,
    apiType,
    pagination,
    resourceDesign,
    outputDir
  });

  artifacts.push(...paginationDesign.artifacts);

  // ============================================================================
  // PHASE 8: VERSIONING STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 8: Defining versioning strategy');

  const versioningDesign = await ctx.task(versioningDesignTask, {
    projectName,
    apiType,
    versioningStrategy,
    outputDir
  });

  artifacts.push(...versioningDesign.artifacts);

  // ============================================================================
  // PHASE 9: OPENAPI/SPECIFICATION GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating API specification document');

  const specGeneration = await ctx.task(specGenerationTask, {
    projectName,
    apiType,
    resourceDesign,
    urlConventions,
    schemaDesign,
    errorPatterns,
    authDesign,
    paginationDesign,
    versioningDesign,
    outputDir
  });

  artifacts.push(...specGeneration.artifacts);

  // ============================================================================
  // PHASE 10: API GUIDELINES DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Generating API design guidelines');

  const guidelines = await ctx.task(guidelinesTask, {
    projectName,
    apiType,
    urlConventions,
    schemaDesign,
    errorPatterns,
    authDesign,
    paginationDesign,
    versioningDesign,
    outputDir
  });

  artifacts.push(...guidelines.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `API Design Specification complete for ${projectName}. Review all artifacts and approve?`,
    title: 'API Design Complete',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        apiType,
        resourceCount: resourceDesign.resources.length,
        schemaCount: schemaDesign.schemas.length,
        authMethods: authMethods.length,
        versioningStrategy
      },
      files: [
        { path: specGeneration.specPath, format: 'yaml', label: 'API Specification' },
        { path: guidelines.guidelinesPath, format: 'markdown', label: 'API Guidelines' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    specification: {
      type: apiType,
      specPath: specGeneration.specPath,
      version: versioningDesign.initialVersion,
      baseUrl: urlConventions.baseUrl
    },
    resources: resourceDesign.resources,
    schemas: schemaDesign.schemas,
    errorHandling: errorPatterns.patterns,
    authentication: authDesign.methods,
    pagination: paginationDesign.strategy,
    versioning: versioningDesign.strategy,
    guidelines: {
      path: guidelines.guidelinesPath,
      conventions: urlConventions.conventions
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/sdk-platform-development/api-design-specification',
      timestamp: startTime,
      apiType,
      versioningStrategy
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const requirementsTask = defineTask('requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: API Requirements - ${args.projectName}`,
  agent: {
    name: 'api-design-reviewer',
    prompt: {
      role: 'Senior API Designer',
      task: 'Gather and document API requirements',
      context: {
        projectName: args.projectName,
        apiType: args.apiType,
        resources: args.resources,
        authMethods: args.authMethods,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify API consumers and use cases',
        '2. Define core resources and relationships',
        '3. Document CRUD operations requirements',
        '4. Identify batch and bulk operation needs',
        '5. Document real-time/streaming requirements',
        '6. Assess rate limiting requirements',
        '7. Identify compliance and security requirements',
        '8. Document performance requirements',
        '9. Identify integration requirements',
        '10. Generate requirements document'
      ],
      outputFormat: 'JSON with API requirements'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements', 'useCases', 'artifacts'],
      properties: {
        requirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              requirement: { type: 'string' },
              priority: { type: 'string' }
            }
          }
        },
        useCases: { type: 'array', items: { type: 'string' } },
        constraints: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'api-design', 'requirements']
}));

export const resourceDesignTask = defineTask('resource-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Resource Design - ${args.projectName}`,
  agent: {
    name: 'api-design-reviewer',
    prompt: {
      role: 'API Architect',
      task: 'Design resource-oriented API structure',
      context: {
        projectName: args.projectName,
        apiType: args.apiType,
        resources: args.resources,
        requirements: args.requirements,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define resource hierarchy and relationships',
        '2. Design resource representations',
        '3. Identify sub-resources and nested resources',
        '4. Design collection resources',
        '5. Define singleton resources',
        '6. Plan resource lifecycle and state transitions',
        '7. Design resource links (HATEOAS if applicable)',
        '8. Identify cross-resource operations',
        '9. Document resource dependencies',
        '10. Generate resource design document'
      ],
      outputFormat: 'JSON with resource design'
    },
    outputSchema: {
      type: 'object',
      required: ['resources', 'relationships', 'artifacts'],
      properties: {
        resources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              operations: { type: 'array', items: { type: 'string' } },
              relationships: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        relationships: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'api-design', 'resources']
}));

export const urlConventionsTask = defineTask('url-conventions', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: URL Conventions - ${args.projectName}`,
  agent: {
    name: 'api-design-reviewer',
    prompt: {
      role: 'API Designer',
      task: 'Establish URL conventions and naming standards',
      context: {
        projectName: args.projectName,
        apiType: args.apiType,
        versioningStrategy: args.versioningStrategy,
        resourceDesign: args.resourceDesign,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define base URL structure',
        '2. Establish version path convention',
        '3. Define resource naming conventions (plural nouns)',
        '4. Design nested resource paths',
        '5. Establish query parameter conventions',
        '6. Define path parameter conventions',
        '7. Design action/operation URLs',
        '8. Document URL encoding requirements',
        '9. Establish consistency rules',
        '10. Generate URL conventions guide'
      ],
      outputFormat: 'JSON with URL conventions'
    },
    outputSchema: {
      type: 'object',
      required: ['baseUrl', 'conventions', 'artifacts'],
      properties: {
        baseUrl: { type: 'string' },
        conventions: {
          type: 'object',
          properties: {
            naming: { type: 'object' },
            versioning: { type: 'object' },
            queryParams: { type: 'object' },
            pathParams: { type: 'object' }
          }
        },
        examples: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'api-design', 'url-conventions']
}));

export const schemaDesignTask = defineTask('schema-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Schema Design - ${args.projectName}`,
  agent: {
    name: 'api-design-reviewer',
    prompt: {
      role: 'API Schema Designer',
      task: 'Design request/response schemas',
      context: {
        projectName: args.projectName,
        apiType: args.apiType,
        resourceDesign: args.resourceDesign,
        pagination: args.pagination,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design resource representation schemas',
        '2. Define request body schemas (create, update)',
        '3. Design response envelope structure',
        '4. Define pagination response schema',
        '5. Design partial update (PATCH) schemas',
        '6. Define common field types and formats',
        '7. Design embedded vs linked representations',
        '8. Define schema versioning approach',
        '9. Document nullable and optional fields',
        '10. Generate JSON Schema definitions'
      ],
      outputFormat: 'JSON with schema definitions'
    },
    outputSchema: {
      type: 'object',
      required: ['schemas', 'envelope', 'artifacts'],
      properties: {
        schemas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              properties: { type: 'object' }
            }
          }
        },
        envelope: { type: 'object' },
        commonTypes: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'api-design', 'schemas']
}));

export const errorPatternsTask = defineTask('error-patterns', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Error Handling Patterns - ${args.projectName}`,
  agent: {
    name: 'error-message-reviewer',
    prompt: {
      role: 'API Designer',
      task: 'Document error handling patterns',
      context: {
        projectName: args.projectName,
        apiType: args.apiType,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define error response schema',
        '2. Map HTTP status codes to error types',
        '3. Design error code taxonomy',
        '4. Define error message guidelines',
        '5. Design validation error format',
        '6. Document rate limiting errors',
        '7. Define authentication/authorization errors',
        '8. Design error localization approach',
        '9. Document retry guidance in errors',
        '10. Generate error handling documentation'
      ],
      outputFormat: 'JSON with error patterns'
    },
    outputSchema: {
      type: 'object',
      required: ['patterns', 'statusCodes', 'artifacts'],
      properties: {
        patterns: {
          type: 'object',
          properties: {
            errorSchema: { type: 'object' },
            validationErrors: { type: 'object' },
            errorCodes: { type: 'array', items: { type: 'string' } }
          }
        },
        statusCodes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: { type: 'number' },
              meaning: { type: 'string' },
              usage: { type: 'string' }
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
  labels: ['sdk', 'api-design', 'error-handling']
}));

export const authDesignTask = defineTask('auth-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Authentication Design - ${args.projectName}`,
  agent: {
    name: 'security-review-agent',
    prompt: {
      role: 'API Security Architect',
      task: 'Design authentication and authorization',
      context: {
        projectName: args.projectName,
        apiType: args.apiType,
        authMethods: args.authMethods,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define API key authentication scheme',
        '2. Design OAuth 2.0 flows',
        '3. Define JWT token structure',
        '4. Design scope-based authorization',
        '5. Document authentication headers',
        '6. Design token refresh mechanism',
        '7. Define authentication error responses',
        '8. Document rate limiting per auth method',
        '9. Design API key management',
        '10. Generate authentication documentation'
      ],
      outputFormat: 'JSON with authentication design'
    },
    outputSchema: {
      type: 'object',
      required: ['methods', 'securitySchemes', 'artifacts'],
      properties: {
        methods: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              scheme: { type: 'object' }
            }
          }
        },
        securitySchemes: { type: 'object' },
        scopes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'api-design', 'authentication', 'security']
}));

export const paginationDesignTask = defineTask('pagination-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Pagination Design - ${args.projectName}`,
  agent: {
    name: 'api-design-reviewer',
    prompt: {
      role: 'API Designer',
      task: 'Design pagination and filtering patterns',
      context: {
        projectName: args.projectName,
        apiType: args.apiType,
        pagination: args.pagination,
        resourceDesign: args.resourceDesign,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define pagination strategy (cursor, offset, keyset)',
        '2. Design pagination parameters',
        '3. Define pagination response metadata',
        '4. Design filtering query parameters',
        '5. Define sorting parameters',
        '6. Design field selection (sparse fieldsets)',
        '7. Document pagination limits',
        '8. Design consistent pagination across resources',
        '9. Document pagination performance',
        '10. Generate pagination documentation'
      ],
      outputFormat: 'JSON with pagination design'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'parameters', 'artifacts'],
      properties: {
        strategy: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            defaultLimit: { type: 'number' },
            maxLimit: { type: 'number' }
          }
        },
        parameters: {
          type: 'object',
          properties: {
            pagination: { type: 'array', items: { type: 'string' } },
            filtering: { type: 'array', items: { type: 'string' } },
            sorting: { type: 'array', items: { type: 'string' } }
          }
        },
        responseMetadata: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'api-design', 'pagination']
}));

export const versioningDesignTask = defineTask('versioning-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Versioning Strategy - ${args.projectName}`,
  agent: {
    name: 'compatibility-auditor',
    prompt: {
      role: 'API Architect',
      task: 'Define API versioning strategy',
      context: {
        projectName: args.projectName,
        apiType: args.apiType,
        versioningStrategy: args.versioningStrategy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define versioning method (URL, header, query)',
        '2. Establish version format and naming',
        '3. Define deprecation policy',
        '4. Design version negotiation',
        '5. Plan backward compatibility rules',
        '6. Define breaking change policy',
        '7. Design version sunset process',
        '8. Document migration path requirements',
        '9. Plan version communication',
        '10. Generate versioning documentation'
      ],
      outputFormat: 'JSON with versioning strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'initialVersion', 'artifacts'],
      properties: {
        strategy: {
          type: 'object',
          properties: {
            method: { type: 'string' },
            format: { type: 'string' },
            deprecationPolicy: { type: 'string' }
          }
        },
        initialVersion: { type: 'string' },
        compatibilityRules: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'api-design', 'versioning']
}));

export const specGenerationTask = defineTask('spec-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Specification Generation - ${args.projectName}`,
  agent: {
    name: 'api-design-reviewer',
    prompt: {
      role: 'API Specification Engineer',
      task: 'Generate API specification document',
      context: {
        projectName: args.projectName,
        apiType: args.apiType,
        resourceDesign: args.resourceDesign,
        urlConventions: args.urlConventions,
        schemaDesign: args.schemaDesign,
        errorPatterns: args.errorPatterns,
        authDesign: args.authDesign,
        paginationDesign: args.paginationDesign,
        versioningDesign: args.versioningDesign,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Generate OpenAPI/AsyncAPI/Protobuf specification',
        '2. Include all resource endpoints',
        '3. Document all request/response schemas',
        '4. Include authentication requirements',
        '5. Document error responses',
        '6. Add pagination parameters',
        '7. Include examples for all operations',
        '8. Add tags and grouping',
        '9. Include server definitions',
        '10. Validate specification'
      ],
      outputFormat: 'JSON with specification file path'
    },
    outputSchema: {
      type: 'object',
      required: ['specPath', 'format', 'artifacts'],
      properties: {
        specPath: { type: 'string' },
        format: { type: 'string' },
        endpoints: { type: 'number' },
        schemas: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'api-design', 'specification']
}));

export const guidelinesTask = defineTask('guidelines', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: API Guidelines - ${args.projectName}`,
  agent: {
    name: 'technical-writer-agent',
    prompt: {
      role: 'API Documentation Writer',
      task: 'Generate API design guidelines',
      context: {
        projectName: args.projectName,
        apiType: args.apiType,
        urlConventions: args.urlConventions,
        schemaDesign: args.schemaDesign,
        errorPatterns: args.errorPatterns,
        authDesign: args.authDesign,
        paginationDesign: args.paginationDesign,
        versioningDesign: args.versioningDesign,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create API design principles document',
        '2. Document naming conventions',
        '3. Create schema design guidelines',
        '4. Document error handling guidelines',
        '5. Create authentication usage guide',
        '6. Document pagination best practices',
        '7. Create versioning guidelines',
        '8. Document API review checklist',
        '9. Create examples and anti-patterns',
        '10. Generate comprehensive guidelines'
      ],
      outputFormat: 'JSON with guidelines file path'
    },
    outputSchema: {
      type: 'object',
      required: ['guidelinesPath', 'artifacts'],
      properties: {
        guidelinesPath: { type: 'string' },
        sections: { type: 'array', items: { type: 'string' } },
        checklistPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'api-design', 'guidelines', 'documentation']
}));
