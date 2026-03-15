/**
 * @process specializations/web-development/rbac-implementation
 * @description Role-Based Access Control (RBAC) Implementation - Process for implementing RBAC with roles, permissions,
 * hierarchical access control, and dynamic permission checking.
 * @inputs { projectName: string, framework?: string, features?: object }
 * @outputs { success: boolean, roles: array, permissions: array, middleware: array, artifacts: array }
 *
 * @references
 * - RBAC Model: https://csrc.nist.gov/projects/role-based-access-control
 * - CASL Authorization: https://casl.js.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    framework = 'express',
    features = { hierarchy: true, dynamic: true },
    outputDir = 'rbac-implementation'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting RBAC Implementation: ${projectName}`);

  const rbacSetup = await ctx.task(rbacSetupTask, { projectName, framework, outputDir });
  artifacts.push(...rbacSetup.artifacts);

  const rolesSetup = await ctx.task(rolesSetupTask, { projectName, features, outputDir });
  artifacts.push(...rolesSetup.artifacts);

  const permissionsSetup = await ctx.task(permissionsSetupTask, { projectName, outputDir });
  artifacts.push(...permissionsSetup.artifacts);

  const middlewareSetup = await ctx.task(rbacMiddlewareTask, { projectName, outputDir });
  artifacts.push(...middlewareSetup.artifacts);

  const policySetup = await ctx.task(policySetupTask, { projectName, outputDir });
  artifacts.push(...policySetup.artifacts);

  await ctx.breakpoint({
    question: `RBAC implementation complete for ${projectName}. ${rolesSetup.roles.length} roles, ${permissionsSetup.permissions.length} permissions. Approve?`,
    title: 'RBAC Review',
    context: { runId: ctx.runId, roles: rolesSetup.roles, permissions: permissionsSetup.permissions }
  });

  const documentation = await ctx.task(documentationTask, { projectName, rolesSetup, permissionsSetup, outputDir });
  artifacts.push(...documentation.artifacts);

  return {
    success: true,
    projectName,
    roles: rolesSetup.roles,
    permissions: permissionsSetup.permissions,
    middleware: middlewareSetup.middleware,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/web-development/rbac-implementation', timestamp: startTime }
  };
}

export const rbacSetupTask = defineTask('rbac-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `RBAC Setup - ${args.projectName}`,
  agent: {
    name: 'rbac-developer',
    prompt: { role: 'RBAC Developer', task: 'Set up RBAC infrastructure', context: args,
      instructions: ['1. Install RBAC libraries', '2. Configure CASL/similar', '3. Set up database schema', '4. Configure role storage', '5. Set up permission cache', '6. Configure audit logging', '7. Set up role assignment', '8. Configure inheritance', '9. Set up utilities', '10. Document setup'],
      outputFormat: 'JSON with RBAC setup'
    },
    outputSchema: { type: 'object', required: ['config', 'artifacts'], properties: { config: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'auth', 'rbac', 'setup']
}));

export const rolesSetupTask = defineTask('rbac-roles', (args, taskCtx) => ({
  kind: 'agent',
  title: `Roles Setup - ${args.projectName}`,
  agent: {
    name: 'roles-specialist',
    prompt: { role: 'Roles Specialist', task: 'Define roles and hierarchy', context: args,
      instructions: ['1. Define base roles', '2. Create role hierarchy', '3. Configure inheritance', '4. Set up role groups', '5. Create dynamic roles', '6. Implement role validation', '7. Set up default roles', '8. Configure role limits', '9. Create role utilities', '10. Document roles'],
      outputFormat: 'JSON with roles'
    },
    outputSchema: { type: 'object', required: ['roles', 'artifacts'], properties: { roles: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'auth', 'rbac', 'roles']
}));

export const permissionsSetupTask = defineTask('rbac-permissions', (args, taskCtx) => ({
  kind: 'agent',
  title: `Permissions Setup - ${args.projectName}`,
  agent: {
    name: 'permissions-specialist',
    prompt: { role: 'Permissions Specialist', task: 'Define permissions system', context: args,
      instructions: ['1. Define permission types', '2. Create CRUD permissions', '3. Set up resource permissions', '4. Configure field-level access', '5. Create permission groups', '6. Implement wildcards', '7. Set up conditions', '8. Configure negation', '9. Create permission utilities', '10. Document permissions'],
      outputFormat: 'JSON with permissions'
    },
    outputSchema: { type: 'object', required: ['permissions', 'artifacts'], properties: { permissions: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'auth', 'rbac', 'permissions']
}));

export const rbacMiddlewareTask = defineTask('rbac-middleware', (args, taskCtx) => ({
  kind: 'agent',
  title: `RBAC Middleware - ${args.projectName}`,
  agent: {
    name: 'rbac-middleware-developer',
    prompt: { role: 'RBAC Middleware Developer', task: 'Create authorization middleware', context: args,
      instructions: ['1. Create role check middleware', '2. Implement permission guards', '3. Set up resource authorization', '4. Create ability factory', '5. Implement caching', '6. Set up error handling', '7. Create decorators', '8. Implement logging', '9. Set up testing utilities', '10. Document middleware'],
      outputFormat: 'JSON with middleware'
    },
    outputSchema: { type: 'object', required: ['middleware', 'artifacts'], properties: { middleware: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'auth', 'rbac', 'middleware']
}));

export const policySetupTask = defineTask('rbac-policies', (args, taskCtx) => ({
  kind: 'agent',
  title: `Policy Setup - ${args.projectName}`,
  agent: {
    name: 'policy-specialist',
    prompt: { role: 'Policy Specialist', task: 'Create authorization policies', context: args,
      instructions: ['1. Define policy structure', '2. Create resource policies', '3. Implement conditions', '4. Set up policy inheritance', '5. Create policy evaluation', '6. Implement deny rules', '7. Set up policy testing', '8. Create policy editor', '9. Implement versioning', '10. Document policies'],
      outputFormat: 'JSON with policies'
    },
    outputSchema: { type: 'object', required: ['policies', 'artifacts'], properties: { policies: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'auth', 'rbac', 'policies']
}));

export const documentationTask = defineTask('rbac-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Documentation - ${args.projectName}`,
  agent: {
    name: 'technical-writer-agent',
    prompt: { role: 'Technical Writer', task: 'Generate RBAC documentation', context: args,
      instructions: ['1. Create README', '2. Document roles', '3. Create permission matrix', '4. Document middleware', '5. Create policy guide', '6. Document integration', '7. Create testing guide', '8. Document best practices', '9. Create migration guide', '10. Generate examples'],
      outputFormat: 'JSON with documentation'
    },
    outputSchema: { type: 'object', required: ['docs', 'artifacts'], properties: { docs: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['web', 'auth', 'documentation']
}));
