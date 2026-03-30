/**
 * @process specializations/sdk-platform-development/package-distribution
 * @description Package Distribution - Publish SDKs to language-specific package repositories including npm, PyPI,
 * Maven, NuGet with package signing and CDN distribution.
 * @inputs { projectName: string, targetRegistries?: array, signing?: boolean, cdnDistribution?: boolean }
 * @outputs { success: boolean, publishingConfig: object, registries: array, verificationTests: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/sdk-platform-development/package-distribution', {
 *   projectName: 'CloudAPI SDK',
 *   targetRegistries: ['npm', 'pypi', 'maven', 'nuget'],
 *   signing: true,
 *   cdnDistribution: true
 * });
 *
 * @references
 * - npm Publishing: https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry
 * - PyPI Publishing: https://packaging.python.org/tutorials/packaging-projects/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    targetRegistries = ['npm', 'pypi'],
    signing = true,
    cdnDistribution = false,
    outputDir = 'package-distribution'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Package Distribution: ${projectName}`);
  ctx.log('info', `Target Registries: ${targetRegistries.join(', ')}`);

  // ============================================================================
  // PHASE 1: DISTRIBUTION STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining distribution strategy');

  const distributionStrategy = await ctx.task(distributionStrategyTask, {
    projectName,
    targetRegistries,
    signing,
    cdnDistribution,
    outputDir
  });

  artifacts.push(...distributionStrategy.artifacts);

  // ============================================================================
  // PHASE 2: REGISTRY CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Configuring package registry publishing');

  const registryTasks = targetRegistries.map(registry =>
    () => ctx.task(registryConfigTask, {
      projectName,
      registry,
      signing,
      outputDir
    })
  );

  const registryConfigs = await ctx.parallel.all(registryTasks);
  artifacts.push(...registryConfigs.flatMap(r => r.artifacts));

  // ============================================================================
  // PHASE 3: PACKAGE SIGNING
  // ============================================================================

  if (signing) {
    ctx.log('info', 'Phase 3: Implementing package signing and verification');

    const packageSigning = await ctx.task(packageSigningTask, {
      projectName,
      targetRegistries,
      outputDir
    });

    artifacts.push(...packageSigning.artifacts);
  }

  // ============================================================================
  // PHASE 4: CDN DISTRIBUTION
  // ============================================================================

  if (cdnDistribution) {
    ctx.log('info', 'Phase 4: Setting up CDN distribution');

    const cdnSetup = await ctx.task(cdnDistributionTask, {
      projectName,
      distributionStrategy,
      outputDir
    });

    artifacts.push(...cdnSetup.artifacts);
  }

  // Quality Gate: Distribution Review
  await ctx.breakpoint({
    question: `Package distribution configured for ${projectName}. Registries: ${targetRegistries.length}, Signing: ${signing}. Approve distribution configuration?`,
    title: 'Distribution Configuration Review',
    context: {
      runId: ctx.runId,
      projectName,
      targetRegistries,
      signing,
      files: artifacts.slice(-3).map(a => ({ path: a.path, format: a.format || 'yaml' }))
    }
  });

  // ============================================================================
  // PHASE 5: VERIFICATION TESTS
  // ============================================================================

  ctx.log('info', 'Phase 5: Creating installation verification tests');

  const verificationTests = await ctx.task(verificationTestsTask, {
    projectName,
    targetRegistries,
    registryConfigs,
    outputDir
  });

  artifacts.push(...verificationTests.artifacts);

  // ============================================================================
  // PHASE 6: PUBLISHING AUTOMATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Setting up publishing automation');

  const publishingAutomation = await ctx.task(publishingAutomationTask, {
    projectName,
    registryConfigs,
    verificationTests,
    outputDir
  });

  artifacts.push(...publishingAutomation.artifacts);

  // ============================================================================
  // PHASE 7: MONITORING AND ANALYTICS
  // ============================================================================

  ctx.log('info', 'Phase 7: Configuring distribution monitoring');

  const distributionMonitoring = await ctx.task(distributionMonitoringTask, {
    projectName,
    targetRegistries,
    outputDir
  });

  artifacts.push(...distributionMonitoring.artifacts);

  // ============================================================================
  // PHASE 8: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating distribution documentation');

  const documentation = await ctx.task(distributionDocumentationTask, {
    projectName,
    distributionStrategy,
    registryConfigs,
    verificationTests,
    publishingAutomation,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    publishingConfig: distributionStrategy.config,
    registries: registryConfigs.map(r => ({
      name: r.registry,
      config: r.config
    })),
    signing: signing ? { enabled: true } : { enabled: false },
    cdnDistribution: cdnDistribution ? { enabled: true } : { enabled: false },
    verificationTests: verificationTests.tests,
    documentation: documentation.paths,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/sdk-platform-development/package-distribution',
      timestamp: startTime,
      targetRegistries
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const distributionStrategyTask = defineTask('distribution-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Distribution Strategy - ${args.projectName}`,
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'Release Engineer',
      task: 'Define package distribution strategy',
      context: {
        projectName: args.projectName,
        targetRegistries: args.targetRegistries,
        signing: args.signing,
        cdnDistribution: args.cdnDistribution,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define distribution channels',
        '2. Plan registry prioritization',
        '3. Design package naming strategy',
        '4. Plan version synchronization',
        '5. Design metadata standards',
        '6. Plan license distribution',
        '7. Design README generation',
        '8. Plan asset bundling',
        '9. Design rollback strategy',
        '10. Generate distribution strategy document'
      ],
      outputFormat: 'JSON with distribution strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'channels', 'artifacts'],
      properties: {
        config: { type: 'object' },
        channels: { type: 'array', items: { type: 'string' } },
        namingStrategy: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'distribution', 'strategy']
}));

export const registryConfigTask = defineTask('registry-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Registry Config - ${args.registry}`,
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'Package Engineer',
      task: `Configure ${args.registry} publishing`,
      context: {
        projectName: args.projectName,
        registry: args.registry,
        signing: args.signing,
        outputDir: args.outputDir
      },
      instructions: [
        `1. Configure ${args.registry} authentication`,
        '2. Set up package manifest',
        '3. Configure scoped packages if applicable',
        '4. Set up publish scripts',
        '5. Configure access control',
        '6. Set up deprecation handling',
        '7. Configure unpublish policy',
        '8. Set up package tags',
        '9. Configure provenance',
        '10. Generate registry configuration'
      ],
      outputFormat: 'JSON with registry configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['registry', 'config', 'artifacts'],
      properties: {
        registry: { type: 'string' },
        config: { type: 'object' },
        authentication: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'distribution', args.registry]
}));

export const packageSigningTask = defineTask('package-signing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Package Signing - ${args.projectName}`,
  agent: {
    name: 'security-review-agent',
    prompt: {
      role: 'Security Engineer',
      task: 'Implement package signing and verification',
      context: {
        projectName: args.projectName,
        targetRegistries: args.targetRegistries,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Set up GPG/PGP signing',
        '2. Configure Sigstore integration',
        '3. Set up code signing certificates',
        '4. Configure signature verification',
        '5. Set up key management',
        '6. Configure SLSA provenance',
        '7. Set up transparency logs',
        '8. Configure reproducible builds',
        '9. Set up signature documentation',
        '10. Generate signing configuration'
      ],
      outputFormat: 'JSON with signing configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'methods', 'artifacts'],
      properties: {
        config: { type: 'object' },
        methods: { type: 'array', items: { type: 'string' } },
        keyManagement: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'distribution', 'signing', 'security']
}));

export const cdnDistributionTask = defineTask('cdn-distribution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: CDN Distribution - ${args.projectName}`,
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'Platform Engineer',
      task: 'Set up CDN distribution for browser SDKs',
      context: {
        projectName: args.projectName,
        distributionStrategy: args.distributionStrategy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure CDN provider',
        '2. Set up versioned URLs',
        '3. Configure cache policies',
        '4. Set up integrity hashes (SRI)',
        '5. Configure compression',
        '6. Set up geographic distribution',
        '7. Configure CORS headers',
        '8. Set up monitoring',
        '9. Configure purge automation',
        '10. Generate CDN configuration'
      ],
      outputFormat: 'JSON with CDN configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'urls', 'artifacts'],
      properties: {
        config: { type: 'object' },
        urls: { type: 'object' },
        caching: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'distribution', 'cdn']
}));

export const verificationTestsTask = defineTask('verification-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Verification Tests - ${args.projectName}`,
  agent: {
    name: 'test-coverage-analyzer',
    prompt: {
      role: 'QA Engineer',
      task: 'Create installation verification tests',
      context: {
        projectName: args.projectName,
        targetRegistries: args.targetRegistries,
        registryConfigs: args.registryConfigs,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create installation smoke tests',
        '2. Build import verification tests',
        '3. Create version verification',
        '4. Build dependency resolution tests',
        '5. Create signature verification tests',
        '6. Build basic functionality tests',
        '7. Create cross-platform tests',
        '8. Build CI/CD integration',
        '9. Create monitoring for failures',
        '10. Generate verification test suite'
      ],
      outputFormat: 'JSON with verification tests'
    },
    outputSchema: {
      type: 'object',
      required: ['tests', 'config', 'artifacts'],
      properties: {
        tests: { type: 'array', items: { type: 'object' } },
        config: { type: 'object' },
        cicd: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'distribution', 'verification']
}));

export const publishingAutomationTask = defineTask('publishing-automation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Publishing Automation - ${args.projectName}`,
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'DevOps Engineer',
      task: 'Set up publishing automation',
      context: {
        projectName: args.projectName,
        registryConfigs: args.registryConfigs,
        verificationTests: args.verificationTests,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create publish workflow',
        '2. Configure multi-registry publishing',
        '3. Set up publish gates',
        '4. Configure rollback automation',
        '5. Set up notification on publish',
        '6. Configure publish scheduling',
        '7. Set up dry-run mode',
        '8. Configure publish retry',
        '9. Set up publish metrics',
        '10. Generate publishing automation'
      ],
      outputFormat: 'JSON with publishing automation'
    },
    outputSchema: {
      type: 'object',
      required: ['workflow', 'gates', 'artifacts'],
      properties: {
        workflow: { type: 'object' },
        gates: { type: 'array', items: { type: 'object' } },
        scripts: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'distribution', 'automation']
}));

export const distributionMonitoringTask = defineTask('distribution-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Distribution Monitoring - ${args.projectName}`,
  agent: {
    name: 'telemetry-privacy-auditor',
    prompt: {
      role: 'Monitoring Engineer',
      task: 'Configure distribution monitoring',
      context: {
        projectName: args.projectName,
        targetRegistries: args.targetRegistries,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Set up download metrics',
        '2. Configure version adoption tracking',
        '3. Set up error monitoring',
        '4. Configure dependency tracking',
        '5. Set up security alerts',
        '6. Configure performance monitoring',
        '7. Set up availability monitoring',
        '8. Configure usage analytics',
        '9. Set up alerting rules',
        '10. Generate monitoring configuration'
      ],
      outputFormat: 'JSON with monitoring configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'metrics', 'artifacts'],
      properties: {
        config: { type: 'object' },
        metrics: { type: 'array', items: { type: 'string' } },
        alerts: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'distribution', 'monitoring']
}));

export const distributionDocumentationTask = defineTask('distribution-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Distribution Documentation - ${args.projectName}`,
  agent: {
    name: 'technical-writer-agent',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate distribution documentation',
      context: {
        projectName: args.projectName,
        distributionStrategy: args.distributionStrategy,
        registryConfigs: args.registryConfigs,
        verificationTests: args.verificationTests,
        publishingAutomation: args.publishingAutomation,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create installation guides per registry',
        '2. Document package verification',
        '3. Write signing documentation',
        '4. Document CDN usage',
        '5. Create publishing guide',
        '6. Document troubleshooting',
        '7. Write contributor guide',
        '8. Document rollback procedures',
        '9. Create FAQ section',
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
            installation: { type: 'string' },
            publishing: { type: 'string' },
            verification: { type: 'string' }
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
  labels: ['sdk', 'distribution', 'documentation']
}));
