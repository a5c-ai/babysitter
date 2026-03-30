/**
 * @process specializations/sdk-platform-development/sdk-code-generation-pipeline
 * @description SDK Code Generation Pipeline - Build automated pipeline for generating SDK code from API specifications
 * using OpenAPI Generator or custom tooling with language-specific templates and CI/CD integration.
 * @inputs { projectName: string, apiSpecPath: string, targetLanguages: array, generatorTool?: string, customTemplates?: boolean }
 * @outputs { success: boolean, pipeline: object, templates: array, automationScripts: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/sdk-platform-development/sdk-code-generation-pipeline', {
 *   projectName: 'CloudAPI SDK',
 *   apiSpecPath: './openapi.yaml',
 *   targetLanguages: ['typescript', 'python', 'go'],
 *   generatorTool: 'openapi-generator',
 *   customTemplates: true
 * });
 *
 * @references
 * - OpenAPI Generator: https://openapi-generator.tech/
 * - Smithy: https://smithy.io/
 * - TypeSpec: https://typespec.io/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    apiSpecPath,
    targetLanguages = ['typescript', 'python'],
    generatorTool = 'openapi-generator',
    customTemplates = true,
    postProcessing = true,
    outputDir = 'sdk-codegen-pipeline'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting SDK Code Generation Pipeline: ${projectName}`);
  ctx.log('info', `API Spec: ${apiSpecPath}`);
  ctx.log('info', `Generator Tool: ${generatorTool}`);

  // ============================================================================
  // PHASE 1: API SPECIFICATION ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing API specification');

  const specAnalysis = await ctx.task(specAnalysisTask, {
    projectName,
    apiSpecPath,
    generatorTool,
    outputDir
  });

  artifacts.push(...specAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: GENERATOR CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Configuring code generator');

  const generatorConfig = await ctx.task(generatorConfigTask, {
    projectName,
    targetLanguages,
    generatorTool,
    specAnalysis,
    outputDir
  });

  artifacts.push(...generatorConfig.artifacts);

  // ============================================================================
  // PHASE 3: TEMPLATE CUSTOMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Creating language-specific templates');

  const templateTasks = targetLanguages.map(lang =>
    () => ctx.task(templateCustomizationTask, {
      projectName,
      language: lang,
      generatorTool,
      customTemplates,
      outputDir
    })
  );

  const templates = await ctx.parallel.all(templateTasks);
  artifacts.push(...templates.flatMap(t => t.artifacts));

  // ============================================================================
  // PHASE 4: POST-GENERATION PROCESSING
  // ============================================================================

  ctx.log('info', 'Phase 4: Implementing post-generation processing');

  const postProcessConfig = await ctx.task(postProcessingTask, {
    projectName,
    targetLanguages,
    postProcessing,
    templates,
    outputDir
  });

  artifacts.push(...postProcessConfig.artifacts);

  // Quality Gate: Pipeline Configuration Review
  await ctx.breakpoint({
    question: `Code generation pipeline configured for ${projectName}. Languages: ${targetLanguages.length}, Generator: ${generatorTool}. Approve configuration?`,
    title: 'Code Generation Pipeline Review',
    context: {
      runId: ctx.runId,
      projectName,
      generatorTool,
      targetLanguages,
      files: artifacts.slice(-5).map(a => ({ path: a.path, format: a.format || 'yaml' }))
    }
  });

  // ============================================================================
  // PHASE 5: CI/CD INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Setting up CI/CD integration');

  const cicdIntegration = await ctx.task(cicdIntegrationTask, {
    projectName,
    targetLanguages,
    generatorConfig,
    postProcessConfig,
    outputDir
  });

  artifacts.push(...cicdIntegration.artifacts);

  // ============================================================================
  // PHASE 6: VALIDATION AND LINTING
  // ============================================================================

  ctx.log('info', 'Phase 6: Configuring validation and linting');

  const validationConfig = await ctx.task(validationConfigTask, {
    projectName,
    targetLanguages,
    generatorTool,
    outputDir
  });

  artifacts.push(...validationConfig.artifacts);

  // ============================================================================
  // PHASE 7: BREAKING CHANGE DETECTION
  // ============================================================================

  ctx.log('info', 'Phase 7: Setting up breaking change detection');

  const breakingChangeDetection = await ctx.task(breakingChangeTask, {
    projectName,
    apiSpecPath,
    generatorTool,
    outputDir
  });

  artifacts.push(...breakingChangeDetection.artifacts);

  // ============================================================================
  // PHASE 8: DOCUMENTATION GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating pipeline documentation');

  const documentation = await ctx.task(pipelineDocumentationTask, {
    projectName,
    specAnalysis,
    generatorConfig,
    templates,
    postProcessConfig,
    cicdIntegration,
    validationConfig,
    breakingChangeDetection,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    pipeline: {
      generatorTool,
      stages: cicdIntegration.stages,
      triggers: cicdIntegration.triggers
    },
    templates: templates.map(t => ({
      language: t.language,
      templatePath: t.templatePath,
      customizations: t.customizations
    })),
    postProcessing: postProcessConfig.processors,
    validation: validationConfig.validators,
    breakingChangeDetection: breakingChangeDetection.config,
    automationScripts: cicdIntegration.scripts,
    documentation: {
      pipelineDoc: documentation.pipelineDocPath,
      templateGuide: documentation.templateGuidePath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/sdk-platform-development/sdk-code-generation-pipeline',
      timestamp: startTime,
      generatorTool,
      targetLanguages
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const specAnalysisTask = defineTask('spec-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: API Specification Analysis - ${args.projectName}`,
  agent: {
    name: 'api-design-reviewer',
    prompt: {
      role: 'API Specification Analyst',
      task: 'Analyze API specification for code generation',
      context: {
        projectName: args.projectName,
        apiSpecPath: args.apiSpecPath,
        generatorTool: args.generatorTool,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Parse and validate API specification',
        '2. Identify API resources and operations',
        '3. Analyze request/response schemas',
        '4. Identify authentication requirements',
        '5. Assess complexity for code generation',
        '6. Identify custom extensions and annotations',
        '7. Validate generator compatibility',
        '8. Identify potential generation challenges',
        '9. Document API surface area',
        '10. Generate specification analysis report'
      ],
      outputFormat: 'JSON with API specification analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['resources', 'operations', 'artifacts'],
      properties: {
        resources: { type: 'array', items: { type: 'string' } },
        operations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              method: { type: 'string' },
              path: { type: 'string' }
            }
          }
        },
        schemas: { type: 'number' },
        complexity: { type: 'string', enum: ['low', 'medium', 'high'] },
        challenges: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'code-generation', 'api-analysis']
}));

export const generatorConfigTask = defineTask('generator-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Generator Configuration - ${args.projectName}`,
  agent: {
    name: 'template-customization-agent',
    prompt: {
      role: 'Code Generation Engineer',
      task: 'Configure code generator for SDK generation',
      context: {
        projectName: args.projectName,
        targetLanguages: args.targetLanguages,
        generatorTool: args.generatorTool,
        specAnalysis: args.specAnalysis,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure generator global settings',
        '2. Set up language-specific generator options',
        '3. Configure naming conventions mapping',
        '4. Set up package/module naming',
        '5. Configure authentication generation',
        '6. Set up model generation options',
        '7. Configure API client generation',
        '8. Set up documentation generation',
        '9. Configure output directory structure',
        '10. Generate configuration files'
      ],
      outputFormat: 'JSON with generator configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['globalConfig', 'languageConfigs', 'artifacts'],
      properties: {
        globalConfig: {
          type: 'object',
          properties: {
            generator: { type: 'string' },
            inputSpec: { type: 'string' },
            outputDir: { type: 'string' }
          }
        },
        languageConfigs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              language: { type: 'string' },
              generatorName: { type: 'string' },
              options: { type: 'object' }
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
  labels: ['sdk', 'code-generation', 'configuration']
}));

export const templateCustomizationTask = defineTask('template-customization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Template Customization - ${args.language}`,
  agent: {
    name: 'template-customization-agent',
    prompt: {
      role: 'SDK Template Engineer',
      task: `Create custom templates for ${args.language} SDK generation`,
      context: {
        projectName: args.projectName,
        language: args.language,
        generatorTool: args.generatorTool,
        customTemplates: args.customTemplates,
        outputDir: args.outputDir
      },
      instructions: [
        `1. Create base client template for ${args.language}`,
        '2. Customize model/schema templates',
        '3. Create API operation templates',
        '4. Customize authentication templates',
        '5. Create error handling templates',
        '6. Customize documentation templates',
        '7. Create utility function templates',
        '8. Add language-specific idioms',
        '9. Configure template inheritance',
        '10. Document template customizations'
      ],
      outputFormat: 'JSON with template configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['language', 'templatePath', 'customizations', 'artifacts'],
      properties: {
        language: { type: 'string' },
        templatePath: { type: 'string' },
        customizations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              template: { type: 'string' },
              purpose: { type: 'string' }
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
  labels: ['sdk', 'code-generation', 'templates', args.language]
}));

export const postProcessingTask = defineTask('post-processing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Post-Generation Processing - ${args.projectName}`,
  agent: {
    name: 'template-customization-agent',
    prompt: {
      role: 'Code Generation Engineer',
      task: 'Implement post-generation processing for idiomatic code',
      context: {
        projectName: args.projectName,
        targetLanguages: args.targetLanguages,
        postProcessing: args.postProcessing,
        templates: args.templates,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design code formatting processors',
        '2. Implement import organization',
        '3. Create code cleanup processors',
        '4. Implement documentation enhancement',
        '5. Add license header injection',
        '6. Create test file generation',
        '7. Implement example code generation',
        '8. Add changelog entry generation',
        '9. Create version stamping',
        '10. Document post-processing pipeline'
      ],
      outputFormat: 'JSON with post-processing configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['processors', 'artifacts'],
      properties: {
        processors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              languages: { type: 'array', items: { type: 'string' } },
              order: { type: 'number' }
            }
          }
        },
        scripts: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'code-generation', 'post-processing']
}));

export const cicdIntegrationTask = defineTask('cicd-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: CI/CD Integration - ${args.projectName}`,
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'DevOps Engineer',
      task: 'Set up CI/CD integration for SDK code generation',
      context: {
        projectName: args.projectName,
        targetLanguages: args.targetLanguages,
        generatorConfig: args.generatorConfig,
        postProcessConfig: args.postProcessConfig,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create CI/CD workflow for SDK generation',
        '2. Configure API spec change triggers',
        '3. Set up multi-language generation jobs',
        '4. Configure artifact publishing',
        '5. Set up version management',
        '6. Configure PR creation for SDK updates',
        '7. Set up testing in CI/CD pipeline',
        '8. Configure notification on generation',
        '9. Set up rollback procedures',
        '10. Document CI/CD pipeline'
      ],
      outputFormat: 'JSON with CI/CD configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['stages', 'triggers', 'scripts', 'artifacts'],
      properties: {
        stages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              steps: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        triggers: { type: 'array', items: { type: 'string' } },
        scripts: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'code-generation', 'cicd']
}));

export const validationConfigTask = defineTask('validation-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Validation Configuration - ${args.projectName}`,
  agent: {
    name: 'test-coverage-analyzer',
    prompt: {
      role: 'SDK Quality Engineer',
      task: 'Configure validation and linting for generated code',
      context: {
        projectName: args.projectName,
        targetLanguages: args.targetLanguages,
        generatorTool: args.generatorTool,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure linters per language',
        '2. Set up type checking validation',
        '3. Configure API contract validation',
        '4. Set up generated code compilation checks',
        '5. Configure documentation validation',
        '6. Set up naming convention checks',
        '7. Configure security scanning',
        '8. Set up license compliance checks',
        '9. Configure quality gates',
        '10. Document validation configuration'
      ],
      outputFormat: 'JSON with validation configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['validators', 'artifacts'],
      properties: {
        validators: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              languages: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        qualityGates: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'code-generation', 'validation']
}));

export const breakingChangeTask = defineTask('breaking-change-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Breaking Change Detection - ${args.projectName}`,
  agent: {
    name: 'compatibility-auditor',
    prompt: {
      role: 'API Compatibility Analyst',
      task: 'Set up breaking change detection for API specifications',
      context: {
        projectName: args.projectName,
        apiSpecPath: args.apiSpecPath,
        generatorTool: args.generatorTool,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure API diff tool (optic, oasdiff, etc.)',
        '2. Define breaking change categories',
        '3. Set up CI/CD integration for diff checks',
        '4. Configure severity levels for changes',
        '5. Set up change report generation',
        '6. Configure notification on breaking changes',
        '7. Set up versioning recommendations',
        '8. Configure migration guide generation',
        '9. Set up changelog automation',
        '10. Document breaking change detection'
      ],
      outputFormat: 'JSON with breaking change detection configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'artifacts'],
      properties: {
        config: {
          type: 'object',
          properties: {
            tool: { type: 'string' },
            breakingCategories: { type: 'array', items: { type: 'string' } },
            severityLevels: { type: 'object' }
          }
        },
        integrations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'code-generation', 'breaking-changes']
}));

export const pipelineDocumentationTask = defineTask('pipeline-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Pipeline Documentation - ${args.projectName}`,
  agent: {
    name: 'technical-writer-agent',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate code generation pipeline documentation',
      context: {
        projectName: args.projectName,
        specAnalysis: args.specAnalysis,
        generatorConfig: args.generatorConfig,
        templates: args.templates,
        postProcessConfig: args.postProcessConfig,
        cicdIntegration: args.cicdIntegration,
        validationConfig: args.validationConfig,
        breakingChangeDetection: args.breakingChangeDetection,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create pipeline overview documentation',
        '2. Document generator configuration',
        '3. Create template customization guide',
        '4. Document post-processing steps',
        '5. Create CI/CD workflow documentation',
        '6. Document validation and quality gates',
        '7. Create troubleshooting guide',
        '8. Document breaking change detection',
        '9. Create contributor guide',
        '10. Generate all documentation artifacts'
      ],
      outputFormat: 'JSON with documentation file paths'
    },
    outputSchema: {
      type: 'object',
      required: ['pipelineDocPath', 'templateGuidePath', 'artifacts'],
      properties: {
        pipelineDocPath: { type: 'string' },
        templateGuidePath: { type: 'string' },
        cicdDocPath: { type: 'string' },
        troubleshootingPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'code-generation', 'documentation']
}));
