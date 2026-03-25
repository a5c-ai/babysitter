/**
 * @process specializations/sdk-platform-development/internal-developer-platform-setup
 * @description Internal Developer Platform (IDP) Setup - Build internal platform for developer self-service,
 * golden paths, service catalog, and environment management.
 * @inputs { projectName: string, platformTool?: string, features?: array, goldenPaths?: array }
 * @outputs { success: boolean, platformConfig: object, serviceCatalog: object, goldenPaths: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/sdk-platform-development/internal-developer-platform-setup', {
 *   projectName: 'Engineering Platform',
 *   platformTool: 'backstage',
 *   features: ['service-catalog', 'templates', 'docs', 'techdocs'],
 *   goldenPaths: ['microservice', 'frontend-app', 'data-pipeline']
 * });
 *
 * @references
 * - Backstage: https://backstage.io/
 * - Platform Engineering: https://platformengineering.org/
 * - Internal Developer Platform: https://internaldeveloperplatform.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    platformTool = 'backstage',
    features = ['service-catalog', 'templates', 'documentation'],
    goldenPaths = ['microservice', 'frontend-app'],
    outputDir = 'internal-developer-platform-setup'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Internal Developer Platform Setup: ${projectName}`);
  ctx.log('info', `Platform Tool: ${platformTool}`);

  // ============================================================================
  // PHASE 1: PLATFORM ARCHITECTURE
  // ============================================================================

  ctx.log('info', 'Phase 1: Designing IDP architecture');

  const architecture = await ctx.task(idpArchitectureTask, {
    projectName,
    platformTool,
    features,
    outputDir
  });

  artifacts.push(...architecture.artifacts);

  // ============================================================================
  // PHASE 2: SERVICE CATALOG IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Implementing service catalog');

  const serviceCatalog = await ctx.task(serviceCatalogSetupTask, {
    projectName,
    platformTool,
    architecture,
    outputDir
  });

  artifacts.push(...serviceCatalog.artifacts);

  // ============================================================================
  // PHASE 3: PROJECT PROVISIONING WORKFLOWS
  // ============================================================================

  ctx.log('info', 'Phase 3: Creating project provisioning workflows');

  const provisioningWorkflows = await ctx.task(provisioningWorkflowsTask, {
    projectName,
    platformTool,
    architecture,
    outputDir
  });

  artifacts.push(...provisioningWorkflows.artifacts);

  // ============================================================================
  // PHASE 4: GOLDEN PATH TEMPLATES
  // ============================================================================

  ctx.log('info', 'Phase 4: Defining golden paths for common architectures');

  const goldenPathTasks = goldenPaths.map(path =>
    () => ctx.task(goldenPathTemplateTask, {
      projectName,
      pathType: path,
      platformTool,
      outputDir
    })
  );

  const goldenPathTemplates = await ctx.parallel.all(goldenPathTasks);
  artifacts.push(...goldenPathTemplates.flatMap(t => t.artifacts));

  // Quality Gate: Platform Review
  await ctx.breakpoint({
    question: `IDP core components configured for ${projectName}. Service catalog: ready, Golden paths: ${goldenPaths.length}. Approve configuration?`,
    title: 'IDP Configuration Review',
    context: {
      runId: ctx.runId,
      projectName,
      platformTool,
      goldenPaths,
      files: artifacts.slice(-3).map(a => ({ path: a.path, format: a.format || 'yaml' }))
    }
  });

  // ============================================================================
  // PHASE 5: ENVIRONMENT MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Building environment management capabilities');

  const environmentManagement = await ctx.task(environmentManagementTask, {
    projectName,
    platformTool,
    architecture,
    outputDir
  });

  artifacts.push(...environmentManagement.artifacts);

  // ============================================================================
  // PHASE 6: TECHDOCS INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Setting up TechDocs integration');

  const techDocsSetup = await ctx.task(techDocsSetupTask, {
    projectName,
    platformTool,
    architecture,
    outputDir
  });

  artifacts.push(...techDocsSetup.artifacts);

  // ============================================================================
  // PHASE 7: PLUGIN CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Configuring platform plugins');

  const pluginConfig = await ctx.task(pluginConfigTask, {
    projectName,
    platformTool,
    features,
    architecture,
    outputDir
  });

  artifacts.push(...pluginConfig.artifacts);

  // ============================================================================
  // PHASE 8: IDP DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating IDP documentation');

  const documentation = await ctx.task(idpDocumentationTask, {
    projectName,
    architecture,
    serviceCatalog,
    goldenPathTemplates,
    environmentManagement,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    platformConfig: {
      tool: platformTool,
      architecture: architecture.design,
      features
    },
    serviceCatalog: serviceCatalog.config,
    goldenPaths: goldenPathTemplates.map(t => ({
      type: t.pathType,
      templatePath: t.templatePath
    })),
    environmentManagement: environmentManagement.config,
    documentation: documentation.paths,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/sdk-platform-development/internal-developer-platform-setup',
      timestamp: startTime,
      platformTool
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const idpArchitectureTask = defineTask('idp-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: IDP Architecture - ${args.projectName}`,
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'Platform Architect',
      task: 'Design Internal Developer Platform architecture',
      context: {
        projectName: args.projectName,
        platformTool: args.platformTool,
        features: args.features,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define IDP component architecture',
        '2. Design integration with existing tools',
        '3. Plan authentication and SSO',
        '4. Design plugin ecosystem',
        '5. Plan scalability and performance',
        '6. Design database schema',
        '7. Plan deployment architecture',
        '8. Design API structure',
        '9. Plan customization approach',
        '10. Generate architecture documentation'
      ],
      outputFormat: 'JSON with IDP architecture'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'components', 'integrations', 'artifacts'],
      properties: {
        design: { type: 'object' },
        components: { type: 'array', items: { type: 'string' } },
        integrations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'idp', 'architecture']
}));

export const serviceCatalogSetupTask = defineTask('service-catalog-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Service Catalog - ${args.projectName}`,
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'Catalog Engineer',
      task: 'Implement service catalog with Backstage or similar',
      context: {
        projectName: args.projectName,
        platformTool: args.platformTool,
        architecture: args.architecture,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design entity model (components, APIs, resources)',
        '2. Configure catalog ingestion',
        '3. Set up GitHub/GitLab integration',
        '4. Design entity relationships',
        '5. Configure search and discovery',
        '6. Set up ownership model',
        '7. Design entity scoring/health',
        '8. Configure lifecycle management',
        '9. Set up catalog validation',
        '10. Generate catalog configuration'
      ],
      outputFormat: 'JSON with service catalog configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'entityModel', 'artifacts'],
      properties: {
        config: { type: 'object' },
        entityModel: { type: 'object' },
        integrations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'idp', 'service-catalog']
}));

export const provisioningWorkflowsTask = defineTask('provisioning-workflows', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Provisioning Workflows - ${args.projectName}`,
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'Automation Engineer',
      task: 'Create project provisioning workflows',
      context: {
        projectName: args.projectName,
        platformTool: args.platformTool,
        architecture: args.architecture,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design scaffolder/template actions',
        '2. Create repository creation workflow',
        '3. Design CI/CD pipeline provisioning',
        '4. Create infrastructure provisioning',
        '5. Design team/ownership assignment',
        '6. Create documentation scaffolding',
        '7. Design secrets provisioning',
        '8. Create monitoring setup workflow',
        '9. Design validation steps',
        '10. Generate provisioning configuration'
      ],
      outputFormat: 'JSON with provisioning workflows'
    },
    outputSchema: {
      type: 'object',
      required: ['workflows', 'actions', 'artifacts'],
      properties: {
        workflows: { type: 'array', items: { type: 'object' } },
        actions: { type: 'array', items: { type: 'string' } },
        integrations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'idp', 'provisioning']
}));

export const goldenPathTemplateTask = defineTask('golden-path-template', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Golden Path - ${args.pathType}`,
  agent: {
    name: 'template-customization-agent',
    prompt: {
      role: 'Template Engineer',
      task: `Create golden path template for ${args.pathType}`,
      context: {
        projectName: args.projectName,
        pathType: args.pathType,
        platformTool: args.platformTool,
        outputDir: args.outputDir
      },
      instructions: [
        `1. Design ${args.pathType} template structure`,
        '2. Include best practices and standards',
        '3. Add CI/CD pipeline configuration',
        '4. Include security configurations',
        '5. Add documentation templates',
        '6. Include testing setup',
        '7. Add observability configuration',
        '8. Include dependency management',
        '9. Add customization options',
        '10. Generate golden path template'
      ],
      outputFormat: 'JSON with golden path template'
    },
    outputSchema: {
      type: 'object',
      required: ['pathType', 'templatePath', 'components', 'artifacts'],
      properties: {
        pathType: { type: 'string' },
        templatePath: { type: 'string' },
        components: { type: 'array', items: { type: 'string' } },
        parameters: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'idp', 'golden-path', args.pathType]
}));

export const environmentManagementTask = defineTask('environment-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Environment Management - ${args.projectName}`,
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'Platform Engineer',
      task: 'Build environment management capabilities',
      context: {
        projectName: args.projectName,
        platformTool: args.platformTool,
        architecture: args.architecture,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design environment types (dev, staging, prod)',
        '2. Create environment provisioning',
        '3. Design resource allocation',
        '4. Configure environment isolation',
        '5. Set up environment promotion',
        '6. Design ephemeral environments',
        '7. Configure cost tracking',
        '8. Set up environment cleanup',
        '9. Design access control',
        '10. Generate environment configuration'
      ],
      outputFormat: 'JSON with environment management configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'environmentTypes', 'artifacts'],
      properties: {
        config: { type: 'object' },
        environmentTypes: { type: 'array', items: { type: 'object' } },
        provisioning: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'idp', 'environment-management']
}));

export const techDocsSetupTask = defineTask('techdocs-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: TechDocs Setup - ${args.projectName}`,
  agent: {
    name: 'dx-content-writer',
    prompt: {
      role: 'Documentation Engineer',
      task: 'Set up TechDocs integration',
      context: {
        projectName: args.projectName,
        platformTool: args.platformTool,
        architecture: args.architecture,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure TechDocs builder',
        '2. Set up documentation storage',
        '3. Configure documentation publishing',
        '4. Design documentation templates',
        '5. Set up search indexing',
        '6. Configure ADR integration',
        '7. Set up API docs generation',
        '8. Configure runbook templates',
        '9. Set up documentation CI/CD',
        '10. Generate TechDocs configuration'
      ],
      outputFormat: 'JSON with TechDocs configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'templates', 'artifacts'],
      properties: {
        config: { type: 'object' },
        templates: { type: 'array', items: { type: 'string' } },
        storage: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'idp', 'techdocs']
}));

export const pluginConfigTask = defineTask('plugin-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Plugin Configuration - ${args.projectName}`,
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'Platform Engineer',
      task: 'Configure platform plugins',
      context: {
        projectName: args.projectName,
        platformTool: args.platformTool,
        features: args.features,
        architecture: args.architecture,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify required plugins',
        '2. Configure CI/CD plugins',
        '3. Set up monitoring plugins',
        '4. Configure cloud provider plugins',
        '5. Set up security plugins',
        '6. Configure cost plugins',
        '7. Set up custom plugins',
        '8. Configure plugin authentication',
        '9. Design plugin ordering',
        '10. Generate plugin configuration'
      ],
      outputFormat: 'JSON with plugin configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['plugins', 'config', 'artifacts'],
      properties: {
        plugins: { type: 'array', items: { type: 'object' } },
        config: { type: 'object' },
        customPlugins: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'idp', 'plugins']
}));

export const idpDocumentationTask = defineTask('idp-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: IDP Documentation - ${args.projectName}`,
  agent: {
    name: 'technical-writer-agent',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate IDP documentation',
      context: {
        projectName: args.projectName,
        architecture: args.architecture,
        serviceCatalog: args.serviceCatalog,
        goldenPathTemplates: args.goldenPathTemplates,
        environmentManagement: args.environmentManagement,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create IDP user guide',
        '2. Document service catalog usage',
        '3. Write golden path guides',
        '4. Document environment management',
        '5. Create template authoring guide',
        '6. Write plugin development guide',
        '7. Document admin operations',
        '8. Create troubleshooting guide',
        '9. Write onboarding guide',
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
            userGuide: { type: 'string' },
            adminGuide: { type: 'string' },
            templateGuide: { type: 'string' }
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
  labels: ['sdk', 'idp', 'documentation']
}));
