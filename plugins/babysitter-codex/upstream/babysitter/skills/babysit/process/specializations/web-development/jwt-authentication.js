/**
 * @process specializations/web-development/jwt-authentication
 * @description JWT Authentication Implementation - Process for implementing secure JWT-based authentication with
 * access tokens, refresh tokens, token rotation, and secure storage patterns.
 * @inputs { projectName: string, framework?: string, features?: object }
 * @outputs { success: boolean, authConfig: object, endpoints: array, middleware: array, artifacts: array }
 *
 * @references
 * - JWT Specification: https://jwt.io/
 * - OWASP JWT Security: https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    framework = 'express',
    features = { refreshTokens: true, tokenRotation: true },
    outputDir = 'jwt-authentication'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting JWT Authentication Implementation: ${projectName}`);

  const setupTask = await ctx.task(jwtSetupTask, { projectName, framework, outputDir });
  artifacts.push(...setupTask.artifacts);

  const tokenGenerationTask = await ctx.task(tokenGenerationSetupTask, { projectName, features, outputDir });
  artifacts.push(...tokenGenerationTask.artifacts);

  const authEndpointsTask = await ctx.task(authEndpointsSetupTask, { projectName, features, outputDir });
  artifacts.push(...authEndpointsTask.artifacts);

  const middlewareTask = await ctx.task(authMiddlewareSetupTask, { projectName, outputDir });
  artifacts.push(...middlewareTask.artifacts);

  const securityTask = await ctx.task(securitySetupTask, { projectName, outputDir });
  artifacts.push(...securityTask.artifacts);

  await ctx.breakpoint({
    question: `JWT Authentication setup complete for ${projectName}. Approve configuration?`,
    title: 'JWT Authentication Review',
    context: { runId: ctx.runId, endpoints: authEndpointsTask.endpoints }
  });

  const documentation = await ctx.task(documentationTask, { projectName, authEndpointsTask, outputDir });
  artifacts.push(...documentation.artifacts);

  return {
    success: true,
    projectName,
    authConfig: tokenGenerationTask.config,
    endpoints: authEndpointsTask.endpoints,
    middleware: middlewareTask.middleware,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/web-development/jwt-authentication', timestamp: startTime }
  };
}

export const jwtSetupTask = defineTask('jwt-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `JWT Setup - ${args.projectName}`,
  agent: {
    name: 'auth-specialist-agent',
    prompt: { role: 'Authentication Developer', task: 'Set up JWT authentication infrastructure', context: args,
      instructions: ['1. Install JWT libraries', '2. Configure secret management', '3. Set up token config', '4. Configure expiration', '5. Set up token types', '6. Configure algorithms', '7. Set up validation', '8. Configure storage', '9. Set up utilities', '10. Document setup'],
      outputFormat: 'JSON with JWT setup'
    },
    outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'auth', 'jwt', 'setup']
}));

export const tokenGenerationSetupTask = defineTask('token-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Token Generation - ${args.projectName}`,
  agent: {
    name: 'token-specialist',
    prompt: { role: 'Token Specialist', task: 'Implement token generation and validation', context: args,
      instructions: ['1. Create access token generation', '2. Implement refresh tokens', '3. Set up token rotation', '4. Configure claims', '5. Implement validation', '6. Set up blacklisting', '7. Create token utilities', '8. Implement revocation', '9. Set up token introspection', '10. Document tokens'],
      outputFormat: 'JSON with token configuration'
    },
    outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'auth', 'jwt', 'tokens']
}));

export const authEndpointsSetupTask = defineTask('auth-endpoints', (args, taskCtx) => ({
  kind: 'agent',
  title: `Auth Endpoints - ${args.projectName}`,
  agent: {
    name: 'api-developer',
    prompt: { role: 'API Developer', task: 'Create authentication endpoints', context: args,
      instructions: ['1. Create login endpoint', '2. Implement register', '3. Set up logout', '4. Implement token refresh', '5. Create password reset', '6. Implement email verification', '7. Set up password change', '8. Create account deletion', '9. Implement session listing', '10. Document endpoints'],
      outputFormat: 'JSON with endpoints'
    },
    outputSchema: { type: 'object', required: ['endpoints', 'artifacts'], properties: { endpoints: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'auth', 'endpoints']
}));

export const authMiddlewareSetupTask = defineTask('auth-middleware', (args, taskCtx) => ({
  kind: 'agent',
  title: `Auth Middleware - ${args.projectName}`,
  agent: {
    name: 'middleware-developer',
    prompt: { role: 'Middleware Developer', task: 'Create authentication middleware', context: args,
      instructions: ['1. Create token validation middleware', '2. Implement role checking', '3. Set up permission guards', '4. Create optional auth', '5. Implement rate limiting', '6. Set up token extraction', '7. Create refresh handling', '8. Implement error responses', '9. Set up logging', '10. Document middleware'],
      outputFormat: 'JSON with middleware'
    },
    outputSchema: { type: 'object', required: ['middleware', 'artifacts'], properties: { middleware: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'auth', 'middleware']
}));

export const securitySetupTask = defineTask('auth-security', (args, taskCtx) => ({
  kind: 'agent',
  title: `Security Setup - ${args.projectName}`,
  agent: {
    name: 'security-specialist',
    prompt: { role: 'Security Specialist', task: 'Implement security best practices', context: args,
      instructions: ['1. Secure token storage', '2. Implement HTTPS only', '3. Set up secure cookies', '4. Configure CORS', '5. Implement CSRF protection', '6. Set up brute force protection', '7. Configure secure headers', '8. Implement audit logging', '9. Set up anomaly detection', '10. Document security'],
      outputFormat: 'JSON with security config'
    },
    outputSchema: { type: 'object', required: ['security', 'artifacts'], properties: { security: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'auth', 'security']
}));

export const documentationTask = defineTask('jwt-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Documentation - ${args.projectName}`,
  agent: {
    name: 'technical-writer-agent',
    prompt: { role: 'Technical Writer', task: 'Generate JWT documentation', context: args,
      instructions: ['1. Create README', '2. Document token flow', '3. Create endpoint docs', '4. Document middleware', '5. Create security guide', '6. Document best practices', '7. Create integration guide', '8. Document troubleshooting', '9. Create migration guide', '10. Generate examples'],
      outputFormat: 'JSON with documentation'
    },
    outputSchema: { type: 'object', required: ['docs', 'artifacts'], properties: { docs: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'auth', 'documentation']
}));
