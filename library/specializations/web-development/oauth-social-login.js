/**
 * @process specializations/web-development/oauth-social-login
 * @description OAuth 2.0 and Social Login Integration - Process for implementing OAuth 2.0 authentication with social providers
 * including Google, GitHub, Facebook, and custom OAuth providers.
 * @inputs { projectName: string, providers?: array, framework?: string }
 * @outputs { success: boolean, providers: array, oauthConfig: object, artifacts: array }
 *
 * @references
 * - OAuth 2.0 Specification: https://oauth.net/2/
 * - Passport.js: https://www.passportjs.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    providers = ['google', 'github'],
    framework = 'express',
    outputDir = 'oauth-social-login'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting OAuth Social Login Integration: ${projectName}`);

  const oauthSetup = await ctx.task(oauthSetupTask, { projectName, framework, outputDir });
  artifacts.push(...oauthSetup.artifacts);

  const providersSetup = await ctx.task(providersSetupTask, { projectName, providers, outputDir });
  artifacts.push(...providersSetup.artifacts);

  const callbackHandlers = await ctx.task(callbackHandlersTask, { projectName, providers, outputDir });
  artifacts.push(...callbackHandlers.artifacts);

  const accountLinking = await ctx.task(accountLinkingTask, { projectName, outputDir });
  artifacts.push(...accountLinking.artifacts);

  const sessionSetup = await ctx.task(sessionSetupTask, { projectName, outputDir });
  artifacts.push(...sessionSetup.artifacts);

  await ctx.breakpoint({
    question: `OAuth Social Login setup complete for ${projectName}. ${providers.length} providers configured. Approve?`,
    title: 'OAuth Setup Review',
    context: { runId: ctx.runId, providers: providersSetup.configuredProviders }
  });

  const documentation = await ctx.task(documentationTask, { projectName, providersSetup, outputDir });
  artifacts.push(...documentation.artifacts);

  return {
    success: true,
    projectName,
    providers: providersSetup.configuredProviders,
    oauthConfig: oauthSetup.config,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/web-development/oauth-social-login', timestamp: startTime }
  };
}

export const oauthSetupTask = defineTask('oauth-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `OAuth Setup - ${args.projectName}`,
  agent: {
    name: 'oauth-developer',
    prompt: { role: 'OAuth Developer', task: 'Set up OAuth 2.0 infrastructure', context: args,
      instructions: ['1. Install OAuth libraries', '2. Configure Passport.js', '3. Set up session handling', '4. Configure callback URLs', '5. Set up state management', '6. Configure PKCE', '7. Set up error handling', '8. Configure logging', '9. Set up token handling', '10. Document setup'],
      outputFormat: 'JSON with OAuth setup'
    },
    outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'auth', 'oauth', 'setup']
}));

export const providersSetupTask = defineTask('oauth-providers', (args, taskCtx) => ({
  kind: 'agent',
  title: `Provider Setup - ${args.projectName}`,
  agent: {
    name: 'oauth-provider-specialist',
    prompt: { role: 'OAuth Provider Specialist', task: 'Configure social login providers', context: args,
      instructions: ['1. Configure Google OAuth', '2. Set up GitHub OAuth', '3. Configure Facebook OAuth', '4. Set up Apple Sign-In', '5. Configure Microsoft OAuth', '6. Set up Twitter OAuth', '7. Configure LinkedIn OAuth', '8. Set up custom providers', '9. Configure scopes', '10. Document providers'],
      outputFormat: 'JSON with providers'
    },
    outputSchema: { type: 'object', required: ['configuredProviders', 'artifacts'], properties: { configuredProviders: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'auth', 'oauth', 'providers']
}));

export const callbackHandlersTask = defineTask('oauth-callbacks', (args, taskCtx) => ({
  kind: 'agent',
  title: `Callback Handlers - ${args.projectName}`,
  agent: {
    name: 'callback-handler-developer',
    prompt: { role: 'Callback Handler Developer', task: 'Implement OAuth callbacks', context: args,
      instructions: ['1. Create callback routes', '2. Handle authorization codes', '3. Exchange tokens', '4. Process user info', '5. Handle errors', '6. Implement user creation', '7. Set up redirects', '8. Handle failures', '9. Implement logout', '10. Document callbacks'],
      outputFormat: 'JSON with callbacks'
    },
    outputSchema: { type: 'object', required: ['callbacks', 'artifacts'], properties: { callbacks: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'auth', 'oauth', 'callbacks']
}));

export const accountLinkingTask = defineTask('account-linking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Account Linking - ${args.projectName}`,
  agent: {
    name: 'account-linking-specialist',
    prompt: { role: 'Account Linking Specialist', task: 'Implement account linking', context: args,
      instructions: ['1. Detect existing accounts', '2. Implement email matching', '3. Handle multiple providers', '4. Create linking flow', '5. Handle unlinking', '6. Manage primary provider', '7. Handle conflicts', '8. Create merge logic', '9. Implement notifications', '10. Document linking'],
      outputFormat: 'JSON with account linking'
    },
    outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'auth', 'account-linking']
}));

export const sessionSetupTask = defineTask('oauth-sessions', (args, taskCtx) => ({
  kind: 'agent',
  title: `Session Setup - ${args.projectName}`,
  agent: {
    name: 'session-specialist',
    prompt: { role: 'Session Specialist', task: 'Configure session management', context: args,
      instructions: ['1. Configure session store', '2. Set up serialization', '3. Configure cookies', '4. Implement session rotation', '5. Set up expiration', '6. Configure security', '7. Implement refresh', '8. Set up cleanup', '9. Handle concurrent sessions', '10. Document sessions'],
      outputFormat: 'JSON with session config'
    },
    outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'auth', 'sessions']
}));

export const documentationTask = defineTask('oauth-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Documentation - ${args.projectName}`,
  agent: {
    name: 'technical-writer-agent',
    prompt: { role: 'Technical Writer', task: 'Generate OAuth documentation', context: args,
      instructions: ['1. Create README', '2. Document providers setup', '3. Create flow diagrams', '4. Document callbacks', '5. Create integration guide', '6. Document account linking', '7. Create troubleshooting', '8. Document security', '9. Create frontend guide', '10. Generate examples'],
      outputFormat: 'JSON with documentation'
    },
    outputSchema: { type: 'object', required: ['docs', 'artifacts'], properties: { docs: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'auth', 'documentation']
}));
