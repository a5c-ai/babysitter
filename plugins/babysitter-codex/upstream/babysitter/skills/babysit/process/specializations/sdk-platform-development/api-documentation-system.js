/**
 * @process specializations/sdk-platform-development/api-documentation-system
 * @description API Documentation System - Implement comprehensive API documentation following Diataxis framework
 * including getting started guides, conceptual guides, how-to guides, and interactive API reference.
 * @inputs { projectName: string, apiSpecPath?: string, documentationFramework?: string, interactiveConsole?: boolean }
 * @outputs { success: boolean, portalConfig: object, documentation: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/sdk-platform-development/api-documentation-system', {
 *   projectName: 'CloudAPI',
 *   apiSpecPath: './openapi.yaml',
 *   documentationFramework: 'docusaurus',
 *   interactiveConsole: true
 * });
 *
 * @references
 * - Diataxis Documentation Framework: https://diataxis.fr/
 * - Google Developer Documentation Style Guide: https://developers.google.com/style
 * - Write the Docs: https://www.writethedocs.org/guide/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    apiSpecPath = '',
    documentationFramework = 'docusaurus',
    interactiveConsole = true,
    codeExamples = true,
    outputDir = 'api-documentation-system'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting API Documentation System: ${projectName}`);
  ctx.log('info', `Framework: ${documentationFramework}`);
  ctx.log('info', `Interactive Console: ${interactiveConsole}`);

  // ============================================================================
  // PHASE 1: DOCUMENTATION STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining documentation strategy');

  const strategy = await ctx.task(documentationStrategyTask, {
    projectName,
    apiSpecPath,
    documentationFramework,
    outputDir
  });

  artifacts.push(...strategy.artifacts);

  // ============================================================================
  // PHASE 2: DOCUMENTATION TOOLING SETUP
  // ============================================================================

  ctx.log('info', 'Phase 2: Setting up documentation tooling');

  const toolingSetup = await ctx.task(toolingSetupTask, {
    projectName,
    documentationFramework,
    apiSpecPath,
    outputDir
  });

  artifacts.push(...toolingSetup.artifacts);

  // ============================================================================
  // PHASE 3: GETTING STARTED GUIDE
  // ============================================================================

  ctx.log('info', 'Phase 3: Creating getting started guide (5-minute quick start)');

  const gettingStarted = await ctx.task(gettingStartedTask, {
    projectName,
    apiSpecPath,
    outputDir
  });

  artifacts.push(...gettingStarted.artifacts);

  // ============================================================================
  // PHASE 4: CONCEPTUAL GUIDES
  // ============================================================================

  ctx.log('info', 'Phase 4: Developing conceptual and explanation guides');

  const conceptualGuides = await ctx.task(conceptualGuidesTask, {
    projectName,
    apiSpecPath,
    strategy,
    outputDir
  });

  artifacts.push(...conceptualGuides.artifacts);

  // Quality Gate: Content Review
  await ctx.breakpoint({
    question: `Core documentation created for ${projectName}. Quick start: ready, Conceptual guides: ${conceptualGuides.guides.length}. Approve content?`,
    title: 'Documentation Content Review',
    context: {
      runId: ctx.runId,
      projectName,
      gettingStartedPath: gettingStarted.guidePath,
      conceptualGuides: conceptualGuides.guides,
      files: artifacts.slice(-5).map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 5: HOW-TO GUIDES
  // ============================================================================

  ctx.log('info', 'Phase 5: Building how-to guides for common tasks');

  const howToGuides = await ctx.task(howToGuidesTask, {
    projectName,
    apiSpecPath,
    strategy,
    outputDir
  });

  artifacts.push(...howToGuides.artifacts);

  // ============================================================================
  // PHASE 6: API REFERENCE GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Generating interactive API reference');

  const apiReference = await ctx.task(apiReferenceTask, {
    projectName,
    apiSpecPath,
    interactiveConsole,
    codeExamples,
    outputDir
  });

  artifacts.push(...apiReference.artifacts);

  // ============================================================================
  // PHASE 7: CODE EXAMPLES REPOSITORY
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating code examples repository');

  const codeExamplesRepo = await ctx.task(codeExamplesTask, {
    projectName,
    apiSpecPath,
    codeExamples,
    outputDir
  });

  artifacts.push(...codeExamplesRepo.artifacts);

  // ============================================================================
  // PHASE 8: INTERACTIVE CONSOLE SETUP
  // ============================================================================

  if (interactiveConsole) {
    ctx.log('info', 'Phase 8: Setting up interactive API console');

    const consoleSetup = await ctx.task(interactiveConsoleTask, {
      projectName,
      apiSpecPath,
      outputDir
    });

    artifacts.push(...consoleSetup.artifacts);
  }

  // ============================================================================
  // PHASE 9: SEARCH AND NAVIGATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Configuring search and navigation');

  const searchNav = await ctx.task(searchNavigationTask, {
    projectName,
    documentationFramework,
    strategy,
    outputDir
  });

  artifacts.push(...searchNav.artifacts);

  // ============================================================================
  // PHASE 10: DOCUMENTATION CI/CD
  // ============================================================================

  ctx.log('info', 'Phase 10: Setting up documentation CI/CD pipeline');

  const docsCicd = await ctx.task(docsCicdTask, {
    projectName,
    documentationFramework,
    apiSpecPath,
    outputDir
  });

  artifacts.push(...docsCicd.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `API Documentation System complete for ${projectName}. Review all documentation and approve?`,
    title: 'Documentation System Complete',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        framework: documentationFramework,
        gettingStarted: true,
        conceptualGuides: conceptualGuides.guides.length,
        howToGuides: howToGuides.guides.length,
        interactiveConsole
      },
      files: [
        { path: gettingStarted.guidePath, format: 'markdown', label: 'Getting Started' },
        { path: apiReference.referencePath, format: 'markdown', label: 'API Reference' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    portalConfig: {
      framework: documentationFramework,
      basePath: toolingSetup.basePath,
      searchEnabled: searchNav.searchEnabled,
      interactiveConsole
    },
    documentation: {
      gettingStarted: gettingStarted.guidePath,
      conceptualGuides: conceptualGuides.guides,
      howToGuides: howToGuides.guides,
      apiReference: apiReference.referencePath,
      codeExamples: codeExamplesRepo.examplesPath
    },
    navigation: searchNav.navigation,
    cicd: docsCicd.pipeline,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/sdk-platform-development/api-documentation-system',
      timestamp: startTime,
      documentationFramework
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const documentationStrategyTask = defineTask('documentation-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Documentation Strategy - ${args.projectName}`,
  agent: {
    name: 'dx-content-writer',
    prompt: {
      role: 'Documentation Architect',
      task: 'Define comprehensive documentation strategy using Diataxis framework',
      context: {
        projectName: args.projectName,
        apiSpecPath: args.apiSpecPath,
        documentationFramework: args.documentationFramework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Apply Diataxis framework (tutorials, how-to, reference, explanation)',
        '2. Define target audience personas',
        '3. Map user journeys to documentation',
        '4. Plan documentation information architecture',
        '5. Define content types and templates',
        '6. Establish writing style guidelines',
        '7. Plan documentation versioning',
        '8. Define maintenance and update process',
        '9. Plan feedback and improvement loop',
        '10. Generate documentation strategy document'
      ],
      outputFormat: 'JSON with documentation strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'contentTypes', 'artifacts'],
      properties: {
        framework: { type: 'string' },
        contentTypes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              purpose: { type: 'string' },
              template: { type: 'string' }
            }
          }
        },
        audiences: { type: 'array', items: { type: 'string' } },
        informationArchitecture: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'documentation', 'strategy']
}));

export const toolingSetupTask = defineTask('tooling-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Documentation Tooling - ${args.projectName}`,
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'Documentation Platform Engineer',
      task: 'Set up documentation tooling and platform',
      context: {
        projectName: args.projectName,
        documentationFramework: args.documentationFramework,
        apiSpecPath: args.apiSpecPath,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Initialize documentation framework project',
        '2. Configure theme and branding',
        '3. Set up API spec integration',
        '4. Configure markdown processing',
        '5. Set up syntax highlighting',
        '6. Configure image and asset handling',
        '7. Set up local development server',
        '8. Configure build and deployment',
        '9. Set up documentation linting',
        '10. Generate tooling configuration'
      ],
      outputFormat: 'JSON with tooling configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['basePath', 'configFiles', 'artifacts'],
      properties: {
        basePath: { type: 'string' },
        configFiles: { type: 'array', items: { type: 'string' } },
        devServer: { type: 'object' },
        buildConfig: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'documentation', 'tooling']
}));

export const gettingStartedTask = defineTask('getting-started', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Getting Started Guide - ${args.projectName}`,
  agent: {
    name: 'tutorial-builder-agent',
    prompt: {
      role: 'Developer Experience Writer',
      task: 'Create 5-minute getting started guide',
      context: {
        projectName: args.projectName,
        apiSpecPath: args.apiSpecPath,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create quick start overview',
        '2. Document prerequisites',
        '3. Write installation instructions',
        '4. Create first API call example',
        '5. Show immediate success outcome',
        '6. Add "what\'s next" section',
        '7. Include common pitfalls',
        '8. Add code snippets in multiple languages',
        '9. Test guide end-to-end',
        '10. Generate getting started guide'
      ],
      outputFormat: 'JSON with guide path and structure'
    },
    outputSchema: {
      type: 'object',
      required: ['guidePath', 'sections', 'artifacts'],
      properties: {
        guidePath: { type: 'string' },
        sections: { type: 'array', items: { type: 'string' } },
        estimatedTime: { type: 'string' },
        codeSnippets: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'documentation', 'getting-started']
}));

export const conceptualGuidesTask = defineTask('conceptual-guides', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Conceptual Guides - ${args.projectName}`,
  agent: {
    name: 'dx-content-writer',
    prompt: {
      role: 'Technical Writer',
      task: 'Develop conceptual and explanation guides',
      context: {
        projectName: args.projectName,
        apiSpecPath: args.apiSpecPath,
        strategy: args.strategy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create API architecture overview',
        '2. Explain authentication concepts',
        '3. Document rate limiting and quotas',
        '4. Explain error handling philosophy',
        '5. Document pagination concepts',
        '6. Explain versioning and compatibility',
        '7. Create data model explanations',
        '8. Document best practices guide',
        '9. Create security concepts guide',
        '10. Generate all conceptual guides'
      ],
      outputFormat: 'JSON with guide paths'
    },
    outputSchema: {
      type: 'object',
      required: ['guides', 'artifacts'],
      properties: {
        guides: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              path: { type: 'string' },
              category: { type: 'string' }
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
  labels: ['sdk', 'documentation', 'conceptual-guides']
}));

export const howToGuidesTask = defineTask('how-to-guides', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: How-To Guides - ${args.projectName}`,
  agent: {
    name: 'dx-content-writer',
    prompt: {
      role: 'Technical Writer',
      task: 'Build how-to guides for common tasks',
      context: {
        projectName: args.projectName,
        apiSpecPath: args.apiSpecPath,
        strategy: args.strategy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create authentication setup guide',
        '2. Write CRUD operations guide',
        '3. Document pagination handling',
        '4. Create error handling guide',
        '5. Write webhook integration guide',
        '6. Document batch operations',
        '7. Create testing guide',
        '8. Write debugging guide',
        '9. Document common integrations',
        '10. Generate all how-to guides'
      ],
      outputFormat: 'JSON with guide paths'
    },
    outputSchema: {
      type: 'object',
      required: ['guides', 'artifacts'],
      properties: {
        guides: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              path: { type: 'string' },
              difficulty: { type: 'string' }
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
  labels: ['sdk', 'documentation', 'how-to-guides']
}));

export const apiReferenceTask = defineTask('api-reference', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: API Reference - ${args.projectName}`,
  agent: {
    name: 'dx-content-writer',
    prompt: {
      role: 'API Documentation Engineer',
      task: 'Generate interactive API reference documentation',
      context: {
        projectName: args.projectName,
        apiSpecPath: args.apiSpecPath,
        interactiveConsole: args.interactiveConsole,
        codeExamples: args.codeExamples,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Generate API reference from OpenAPI spec',
        '2. Add interactive try-it-out functionality',
        '3. Include request/response examples',
        '4. Document all parameters and headers',
        '5. Add code snippets per endpoint',
        '6. Document error responses',
        '7. Add authentication requirements',
        '8. Include rate limit information',
        '9. Add deprecation notices',
        '10. Generate complete API reference'
      ],
      outputFormat: 'JSON with reference configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['referencePath', 'endpoints', 'artifacts'],
      properties: {
        referencePath: { type: 'string' },
        endpoints: { type: 'number' },
        interactiveEnabled: { type: 'boolean' },
        codeSnippetLanguages: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'documentation', 'api-reference']
}));

export const codeExamplesTask = defineTask('code-examples', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Code Examples - ${args.projectName}`,
  agent: {
    name: 'tutorial-builder-agent',
    prompt: {
      role: 'Developer Advocate',
      task: 'Create comprehensive code examples repository',
      context: {
        projectName: args.projectName,
        apiSpecPath: args.apiSpecPath,
        codeExamples: args.codeExamples,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create examples in multiple languages',
        '2. Build real-world scenario examples',
        '3. Create integration examples',
        '4. Add authentication examples',
        '5. Create error handling examples',
        '6. Build pagination examples',
        '7. Add webhook handling examples',
        '8. Create SDK usage examples',
        '9. Add testing examples',
        '10. Generate examples repository structure'
      ],
      outputFormat: 'JSON with examples configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['examplesPath', 'languages', 'artifacts'],
      properties: {
        examplesPath: { type: 'string' },
        languages: { type: 'array', items: { type: 'string' } },
        categories: { type: 'array', items: { type: 'string' } },
        exampleCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'documentation', 'code-examples']
}));

export const interactiveConsoleTask = defineTask('interactive-console', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Interactive Console - ${args.projectName}`,
  agent: {
    name: 'dx-content-writer',
    prompt: {
      role: 'Developer Tools Engineer',
      task: 'Set up interactive API console',
      context: {
        projectName: args.projectName,
        apiSpecPath: args.apiSpecPath,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure API explorer component',
        '2. Set up authentication for console',
        '3. Configure request builder UI',
        '4. Set up response viewer',
        '5. Add code generation from requests',
        '6. Configure environment switching',
        '7. Add request history',
        '8. Set up collections/saved requests',
        '9. Configure sharing functionality',
        '10. Generate console configuration'
      ],
      outputFormat: 'JSON with console configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['consolePath', 'features', 'artifacts'],
      properties: {
        consolePath: { type: 'string' },
        features: { type: 'array', items: { type: 'string' } },
        authMethods: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'documentation', 'interactive-console']
}));

export const searchNavigationTask = defineTask('search-navigation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Search and Navigation - ${args.projectName}`,
  agent: {
    name: 'dx-content-writer',
    prompt: {
      role: 'Documentation UX Engineer',
      task: 'Configure search and navigation for documentation',
      context: {
        projectName: args.projectName,
        documentationFramework: args.documentationFramework,
        strategy: args.strategy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure search engine (Algolia, local)',
        '2. Set up search indexing',
        '3. Design navigation structure',
        '4. Configure sidebar navigation',
        '5. Set up breadcrumbs',
        '6. Add version selector',
        '7. Configure "Edit this page" links',
        '8. Set up related content suggestions',
        '9. Add keyboard shortcuts',
        '10. Generate navigation configuration'
      ],
      outputFormat: 'JSON with navigation configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['searchEnabled', 'navigation', 'artifacts'],
      properties: {
        searchEnabled: { type: 'boolean' },
        searchProvider: { type: 'string' },
        navigation: {
          type: 'object',
          properties: {
            sidebar: { type: 'array', items: { type: 'object' } },
            topNav: { type: 'array', items: { type: 'object' } }
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
  labels: ['sdk', 'documentation', 'navigation', 'search']
}));

export const docsCicdTask = defineTask('docs-cicd', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Documentation CI/CD - ${args.projectName}`,
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'DevOps Engineer',
      task: 'Set up documentation CI/CD pipeline',
      context: {
        projectName: args.projectName,
        documentationFramework: args.documentationFramework,
        apiSpecPath: args.apiSpecPath,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure documentation build pipeline',
        '2. Set up documentation testing (links, spelling)',
        '3. Configure preview deployments for PRs',
        '4. Set up production deployment',
        '5. Configure API spec sync triggers',
        '6. Set up changelog generation',
        '7. Configure versioned documentation',
        '8. Set up documentation metrics',
        '9. Configure rollback procedures',
        '10. Generate CI/CD configuration'
      ],
      outputFormat: 'JSON with CI/CD configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['pipeline', 'artifacts'],
      properties: {
        pipeline: {
          type: 'object',
          properties: {
            stages: { type: 'array', items: { type: 'string' } },
            triggers: { type: 'array', items: { type: 'string' } },
            deploymentTarget: { type: 'string' }
          }
        },
        testing: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'documentation', 'cicd']
}));
