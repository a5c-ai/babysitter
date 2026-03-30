/**
 * @process specializations/sdk-platform-development/authentication-authorization-patterns
 * @description Authentication and Authorization Patterns - Implement secure authentication patterns for SDK and API access
 * including API key management, OAuth 2.0, JWT authentication, and scoped permission models.
 * @inputs { projectName: string, authMethods?: array, oauthFlows?: array, scopeModel?: string }
 * @outputs { success: boolean, authImplementation: object, tokenManagement: object, permissionSystem: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/sdk-platform-development/authentication-authorization-patterns', {
 *   projectName: 'CloudAPI',
 *   authMethods: ['api-key', 'oauth2', 'jwt'],
 *   oauthFlows: ['authorization-code', 'client-credentials'],
 *   scopeModel: 'hierarchical'
 * });
 *
 * @references
 * - OAuth 2.0: https://oauth.net/2/
 * - OpenID Connect: https://openid.net/connect/
 * - JWT: https://jwt.io/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    authMethods = ['api-key', 'oauth2'],
    oauthFlows = ['authorization-code', 'client-credentials'],
    scopeModel = 'flat',
    outputDir = 'authentication-authorization-patterns'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Authentication and Authorization Patterns: ${projectName}`);
  ctx.log('info', `Auth Methods: ${authMethods.join(', ')}`);

  // ============================================================================
  // PHASE 1: AUTHENTICATION STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining authentication strategy');

  const authStrategy = await ctx.task(authStrategyTask, {
    projectName,
    authMethods,
    oauthFlows,
    outputDir
  });

  artifacts.push(...authStrategy.artifacts);

  // ============================================================================
  // PHASE 2: API KEY MANAGEMENT
  // ============================================================================

  if (authMethods.includes('api-key')) {
    ctx.log('info', 'Phase 2: Designing API key management system');

    const apiKeyManagement = await ctx.task(apiKeyManagementTask, {
      projectName,
      authStrategy,
      outputDir
    });

    artifacts.push(...apiKeyManagement.artifacts);
  }

  // ============================================================================
  // PHASE 3: OAUTH 2.0 IMPLEMENTATION
  // ============================================================================

  if (authMethods.includes('oauth2')) {
    ctx.log('info', 'Phase 3: Implementing OAuth 2.0 / OpenID Connect flows');

    const oauthImplementation = await ctx.task(oauthImplementationTask, {
      projectName,
      oauthFlows,
      authStrategy,
      outputDir
    });

    artifacts.push(...oauthImplementation.artifacts);
  }

  // ============================================================================
  // PHASE 4: JWT AUTHENTICATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Creating service account / JWT authentication');

  const jwtAuthentication = await ctx.task(jwtAuthenticationTask, {
    projectName,
    authStrategy,
    outputDir
  });

  artifacts.push(...jwtAuthentication.artifacts);

  // Quality Gate: Authentication Review
  await ctx.breakpoint({
    question: `Authentication patterns designed for ${projectName}. Methods: ${authMethods.length}. Approve authentication design?`,
    title: 'Authentication Design Review',
    context: {
      runId: ctx.runId,
      projectName,
      authMethods,
      oauthFlows,
      files: artifacts.slice(-3).map(a => ({ path: a.path, format: a.format || 'yaml' }))
    }
  });

  // ============================================================================
  // PHASE 5: SCOPED PERMISSION MODEL
  // ============================================================================

  ctx.log('info', 'Phase 5: Building scoped permission model');

  const permissionModel = await ctx.task(permissionModelTask, {
    projectName,
    scopeModel,
    authStrategy,
    outputDir
  });

  artifacts.push(...permissionModel.artifacts);

  // ============================================================================
  // PHASE 6: TOKEN MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 6: Designing token management and refresh');

  const tokenManagement = await ctx.task(tokenManagementTask, {
    projectName,
    authStrategy,
    jwtAuthentication,
    outputDir
  });

  artifacts.push(...tokenManagement.artifacts);

  // ============================================================================
  // PHASE 7: SDK AUTHENTICATION INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Designing SDK authentication integration');

  const sdkAuthIntegration = await ctx.task(sdkAuthIntegrationTask, {
    projectName,
    authMethods,
    authStrategy,
    outputDir
  });

  artifacts.push(...sdkAuthIntegration.artifacts);

  // ============================================================================
  // PHASE 8: AUTHENTICATION DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating authentication documentation');

  const documentation = await ctx.task(authDocumentationTask, {
    projectName,
    authStrategy,
    permissionModel,
    tokenManagement,
    sdkAuthIntegration,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    authImplementation: {
      methods: authMethods,
      strategy: authStrategy.strategy
    },
    tokenManagement: tokenManagement.config,
    permissionSystem: {
      model: scopeModel,
      scopes: permissionModel.scopes,
      roles: permissionModel.roles
    },
    sdkIntegration: sdkAuthIntegration.patterns,
    documentation: documentation.paths,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/sdk-platform-development/authentication-authorization-patterns',
      timestamp: startTime,
      authMethods
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const authStrategyTask = defineTask('auth-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Authentication Strategy - ${args.projectName}`,
  agent: {
    name: 'security-review-agent',
    prompt: {
      role: 'Security Architect',
      task: 'Define comprehensive authentication strategy',
      context: {
        projectName: args.projectName,
        authMethods: args.authMethods,
        oauthFlows: args.oauthFlows,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Evaluate authentication method requirements',
        '2. Design multi-method authentication support',
        '3. Define security levels per method',
        '4. Plan credential lifecycle management',
        '5. Design authentication error handling',
        '6. Plan rate limiting per auth method',
        '7. Design audit logging requirements',
        '8. Plan migration path for auth changes',
        '9. Define compliance requirements',
        '10. Generate authentication strategy document'
      ],
      outputFormat: 'JSON with authentication strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'methods', 'artifacts'],
      properties: {
        strategy: { type: 'object' },
        methods: { type: 'array', items: { type: 'object' } },
        securityLevels: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'authentication', 'strategy', 'security']
}));

export const apiKeyManagementTask = defineTask('api-key-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: API Key Management - ${args.projectName}`,
  agent: {
    name: 'security-review-agent',
    prompt: {
      role: 'Security Engineer',
      task: 'Design API key management system',
      context: {
        projectName: args.projectName,
        authStrategy: args.authStrategy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design API key format and structure',
        '2. Plan key generation algorithm',
        '3. Design key storage and hashing',
        '4. Plan key rotation mechanism',
        '5. Design key scoping and permissions',
        '6. Plan key usage tracking',
        '7. Design key revocation',
        '8. Plan key expiration policies',
        '9. Design key naming conventions',
        '10. Generate API key management configuration'
      ],
      outputFormat: 'JSON with API key management design'
    },
    outputSchema: {
      type: 'object',
      required: ['keyFormat', 'management', 'artifacts'],
      properties: {
        keyFormat: { type: 'object' },
        management: {
          type: 'object',
          properties: {
            generation: { type: 'string' },
            storage: { type: 'string' },
            rotation: { type: 'object' }
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
  labels: ['sdk', 'authentication', 'api-keys', 'security']
}));

export const oauthImplementationTask = defineTask('oauth-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: OAuth 2.0 Implementation - ${args.projectName}`,
  agent: {
    name: 'security-review-agent',
    prompt: {
      role: 'Identity Engineer',
      task: 'Implement OAuth 2.0 / OpenID Connect flows',
      context: {
        projectName: args.projectName,
        oauthFlows: args.oauthFlows,
        authStrategy: args.authStrategy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design authorization code flow',
        '2. Implement client credentials flow',
        '3. Design PKCE support',
        '4. Configure token endpoints',
        '5. Design consent screen flow',
        '6. Implement token introspection',
        '7. Design refresh token handling',
        '8. Configure OIDC claims',
        '9. Design OAuth app management',
        '10. Generate OAuth configuration'
      ],
      outputFormat: 'JSON with OAuth implementation'
    },
    outputSchema: {
      type: 'object',
      required: ['flows', 'endpoints', 'artifacts'],
      properties: {
        flows: { type: 'array', items: { type: 'object' } },
        endpoints: { type: 'object' },
        tokenConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'authentication', 'oauth', 'oidc']
}));

export const jwtAuthenticationTask = defineTask('jwt-authentication', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: JWT Authentication - ${args.projectName}`,
  agent: {
    name: 'security-review-agent',
    prompt: {
      role: 'Security Engineer',
      task: 'Create service account / JWT authentication',
      context: {
        projectName: args.projectName,
        authStrategy: args.authStrategy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design JWT token structure',
        '2. Configure signing algorithm (RS256, ES256)',
        '3. Design claims schema',
        '4. Plan key management (JWK)',
        '5. Design token validation',
        '6. Configure token lifetime',
        '7. Design service account creation',
        '8. Plan key rotation',
        '9. Design JWT debugging tools',
        '10. Generate JWT authentication configuration'
      ],
      outputFormat: 'JSON with JWT authentication design'
    },
    outputSchema: {
      type: 'object',
      required: ['tokenStructure', 'signing', 'artifacts'],
      properties: {
        tokenStructure: { type: 'object' },
        signing: {
          type: 'object',
          properties: {
            algorithm: { type: 'string' },
            keyManagement: { type: 'string' }
          }
        },
        claims: { type: 'array', items: { type: 'string' } },
        validation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'authentication', 'jwt', 'security']
}));

export const permissionModelTask = defineTask('permission-model', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Permission Model - ${args.projectName}`,
  agent: {
    name: 'security-review-agent',
    prompt: {
      role: 'Security Architect',
      task: 'Build scoped permission model',
      context: {
        projectName: args.projectName,
        scopeModel: args.scopeModel,
        authStrategy: args.authStrategy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design scope hierarchy (if hierarchical)',
        '2. Define resource-based permissions',
        '3. Create action-based scopes',
        '4. Design role templates',
        '5. Plan scope grouping',
        '6. Design scope documentation',
        '7. Plan scope evolution strategy',
        '8. Design minimal scope guidance',
        '9. Create scope validation',
        '10. Generate permission model documentation'
      ],
      outputFormat: 'JSON with permission model'
    },
    outputSchema: {
      type: 'object',
      required: ['scopes', 'roles', 'artifacts'],
      properties: {
        scopes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              permissions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        roles: { type: 'array', items: { type: 'object' } },
        hierarchy: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'authorization', 'permissions', 'security']
}));

export const tokenManagementTask = defineTask('token-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Token Management - ${args.projectName}`,
  agent: {
    name: 'security-review-agent',
    prompt: {
      role: 'Security Engineer',
      task: 'Design token management and refresh',
      context: {
        projectName: args.projectName,
        authStrategy: args.authStrategy,
        jwtAuthentication: args.jwtAuthentication,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design token lifecycle',
        '2. Configure access token TTL',
        '3. Design refresh token handling',
        '4. Plan token revocation',
        '5. Design token storage recommendations',
        '6. Configure token rotation',
        '7. Design token family management',
        '8. Plan concurrent session handling',
        '9. Design token debugging',
        '10. Generate token management configuration'
      ],
      outputFormat: 'JSON with token management design'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'lifecycle', 'artifacts'],
      properties: {
        config: {
          type: 'object',
          properties: {
            accessTokenTTL: { type: 'number' },
            refreshTokenTTL: { type: 'number' },
            rotation: { type: 'boolean' }
          }
        },
        lifecycle: { type: 'object' },
        revocation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'authentication', 'token-management']
}));

export const sdkAuthIntegrationTask = defineTask('sdk-auth-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: SDK Auth Integration - ${args.projectName}`,
  agent: {
    name: 'extensibility-architect',
    prompt: {
      role: 'SDK Engineer',
      task: 'Design SDK authentication integration patterns',
      context: {
        projectName: args.projectName,
        authMethods: args.authMethods,
        authStrategy: args.authStrategy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design SDK authentication interfaces',
        '2. Create credential provider patterns',
        '3. Design automatic token refresh',
        '4. Plan credential caching',
        '5. Design multi-auth support',
        '6. Create authentication examples',
        '7. Design secure credential handling',
        '8. Plan authentication debugging',
        '9. Design credential validation',
        '10. Generate SDK auth integration patterns'
      ],
      outputFormat: 'JSON with SDK auth integration'
    },
    outputSchema: {
      type: 'object',
      required: ['patterns', 'interfaces', 'artifacts'],
      properties: {
        patterns: { type: 'array', items: { type: 'object' } },
        interfaces: { type: 'array', items: { type: 'string' } },
        examples: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'authentication', 'sdk-integration']
}));

export const authDocumentationTask = defineTask('auth-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Auth Documentation - ${args.projectName}`,
  agent: {
    name: 'technical-writer-agent',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate authentication documentation',
      context: {
        projectName: args.projectName,
        authStrategy: args.authStrategy,
        permissionModel: args.permissionModel,
        tokenManagement: args.tokenManagement,
        sdkAuthIntegration: args.sdkAuthIntegration,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create authentication overview',
        '2. Document each auth method',
        '3. Write OAuth flow guides',
        '4. Document scope reference',
        '5. Create SDK auth examples',
        '6. Write security best practices',
        '7. Document token management',
        '8. Create troubleshooting guide',
        '9. Write migration guides',
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
            overview: { type: 'string' },
            apiKeys: { type: 'string' },
            oauth: { type: 'string' },
            scopes: { type: 'string' }
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
  labels: ['sdk', 'authentication', 'documentation']
}));
