/**
 * @process specializations/sdk-platform-development/compatibility-testing
 * @description Compatibility Testing - Test SDK compatibility across versions, platforms, and environments
 * including multi-version testing matrix and breaking change detection.
 * @inputs { projectName: string, sdkLanguages?: array, testMatrix?: object, breakingChangeDetection?: boolean }
 * @outputs { success: boolean, compatibilityMatrix: object, testResults: array, breakingChanges: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/sdk-platform-development/compatibility-testing', {
 *   projectName: 'CloudAPI SDK',
 *   sdkLanguages: ['typescript', 'python', 'go'],
 *   testMatrix: { nodeVersions: ['16', '18', '20'], pythonVersions: ['3.9', '3.10', '3.11'] },
 *   breakingChangeDetection: true
 * });
 *
 * @references
 * - API Evolution: https://www.mnot.net/blog/2012/12/04/api-evolution
 * - Semantic Versioning: https://semver.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    sdkLanguages = ['typescript', 'python'],
    testMatrix = {},
    breakingChangeDetection = true,
    outputDir = 'compatibility-testing'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Compatibility Testing: ${projectName}`);
  ctx.log('info', `Languages: ${sdkLanguages.join(', ')}`);

  // ============================================================================
  // PHASE 1: COMPATIBILITY STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining compatibility testing strategy');

  const compatibilityStrategy = await ctx.task(compatibilityStrategyTask, {
    projectName,
    sdkLanguages,
    testMatrix,
    outputDir
  });

  artifacts.push(...compatibilityStrategy.artifacts);

  // ============================================================================
  // PHASE 2: TEST MATRIX SETUP
  // ============================================================================

  ctx.log('info', 'Phase 2: Setting up multi-version testing matrix');

  const matrixSetup = await ctx.task(testMatrixSetupTask, {
    projectName,
    sdkLanguages,
    testMatrix,
    compatibilityStrategy,
    outputDir
  });

  artifacts.push(...matrixSetup.artifacts);

  // ============================================================================
  // PHASE 3: CROSS-PLATFORM TESTING
  // ============================================================================

  ctx.log('info', 'Phase 3: Testing cross-platform compatibility');

  const crossPlatformTests = await ctx.task(crossPlatformTestingTask, {
    projectName,
    sdkLanguages,
    matrixSetup,
    outputDir
  });

  artifacts.push(...crossPlatformTests.artifacts);

  // ============================================================================
  // PHASE 4: DEPENDENCY COMPATIBILITY
  // ============================================================================

  ctx.log('info', 'Phase 4: Validating dependency compatibility');

  const dependencyCompatibility = await ctx.task(dependencyCompatibilityTask, {
    projectName,
    sdkLanguages,
    matrixSetup,
    outputDir
  });

  artifacts.push(...dependencyCompatibility.artifacts);

  // Quality Gate: Compatibility Review
  await ctx.breakpoint({
    question: `Compatibility testing configured for ${projectName}. Test matrix size: ${matrixSetup.matrixSize}. Approve compatibility testing approach?`,
    title: 'Compatibility Testing Review',
    context: {
      runId: ctx.runId,
      projectName,
      matrixSize: matrixSetup.matrixSize,
      files: artifacts.slice(-3).map(a => ({ path: a.path, format: a.format || 'yaml' }))
    }
  });

  // ============================================================================
  // PHASE 5: BREAKING CHANGE DETECTION
  // ============================================================================

  if (breakingChangeDetection) {
    ctx.log('info', 'Phase 5: Implementing breaking change detection');

    const breakingChanges = await ctx.task(breakingChangeDetectionTask, {
      projectName,
      sdkLanguages,
      compatibilityStrategy,
      outputDir
    });

    artifacts.push(...breakingChanges.artifacts);
  }

  // ============================================================================
  // PHASE 6: BACKWARD COMPATIBILITY TESTS
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating backward compatibility tests');

  const backwardCompatibility = await ctx.task(backwardCompatibilityTask, {
    projectName,
    sdkLanguages,
    compatibilityStrategy,
    outputDir
  });

  artifacts.push(...backwardCompatibility.artifacts);

  // ============================================================================
  // PHASE 7: CI/CD INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Integrating compatibility tests with CI/CD');

  const cicdIntegration = await ctx.task(compatibilityCicdTask, {
    projectName,
    matrixSetup,
    backwardCompatibility,
    outputDir
  });

  artifacts.push(...cicdIntegration.artifacts);

  // ============================================================================
  // PHASE 8: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating compatibility documentation');

  const documentation = await ctx.task(compatibilityDocumentationTask, {
    projectName,
    compatibilityStrategy,
    matrixSetup,
    crossPlatformTests,
    dependencyCompatibility,
    backwardCompatibility,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    compatibilityMatrix: matrixSetup.matrix,
    testResults: {
      crossPlatform: crossPlatformTests.results,
      dependencies: dependencyCompatibility.results,
      backward: backwardCompatibility.results
    },
    breakingChanges: breakingChangeDetection ? [] : null,
    cicd: cicdIntegration.config,
    documentation: documentation.paths,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/sdk-platform-development/compatibility-testing',
      timestamp: startTime,
      sdkLanguages
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const compatibilityStrategyTask = defineTask('compatibility-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Compatibility Strategy - ${args.projectName}`,
  agent: {
    name: 'test-coverage-analyzer',
    prompt: {
      role: 'QA Architect',
      task: 'Define compatibility testing strategy',
      context: {
        projectName: args.projectName,
        sdkLanguages: args.sdkLanguages,
        testMatrix: args.testMatrix,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define compatibility scope',
        '2. Identify version support policy',
        '3. Plan platform coverage',
        '4. Define dependency constraints',
        '5. Design test prioritization',
        '6. Plan breaking change policy',
        '7. Define compatibility guarantees',
        '8. Design failure handling',
        '9. Plan communication of issues',
        '10. Generate compatibility strategy'
      ],
      outputFormat: 'JSON with compatibility strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'supportPolicy', 'artifacts'],
      properties: {
        strategy: { type: 'object' },
        supportPolicy: { type: 'object' },
        scope: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'compatibility', 'strategy']
}));

export const testMatrixSetupTask = defineTask('test-matrix-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Test Matrix Setup - ${args.projectName}`,
  agent: {
    name: 'test-coverage-analyzer',
    prompt: {
      role: 'Test Engineer',
      task: 'Set up multi-version testing matrix',
      context: {
        projectName: args.projectName,
        sdkLanguages: args.sdkLanguages,
        testMatrix: args.testMatrix,
        compatibilityStrategy: args.compatibilityStrategy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define language version matrix',
        '2. Configure OS/platform matrix',
        '3. Set up dependency version matrix',
        '4. Design matrix execution strategy',
        '5. Configure parallel execution',
        '6. Set up matrix result aggregation',
        '7. Design matrix visualization',
        '8. Configure matrix pruning',
        '9. Set up matrix caching',
        '10. Generate test matrix configuration'
      ],
      outputFormat: 'JSON with test matrix configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['matrix', 'matrixSize', 'artifacts'],
      properties: {
        matrix: { type: 'object' },
        matrixSize: { type: 'number' },
        execution: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'compatibility', 'test-matrix']
}));

export const crossPlatformTestingTask = defineTask('cross-platform-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Cross-Platform Testing - ${args.projectName}`,
  agent: {
    name: 'test-coverage-analyzer',
    prompt: {
      role: 'Platform Test Engineer',
      task: 'Test cross-platform compatibility',
      context: {
        projectName: args.projectName,
        sdkLanguages: args.sdkLanguages,
        matrixSetup: args.matrixSetup,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure Linux testing',
        '2. Set up macOS testing',
        '3. Configure Windows testing',
        '4. Design container testing',
        '5. Set up serverless environment tests',
        '6. Configure browser testing (if applicable)',
        '7. Design mobile platform tests',
        '8. Set up edge case environments',
        '9. Configure test environment provisioning',
        '10. Generate cross-platform test config'
      ],
      outputFormat: 'JSON with cross-platform testing config'
    },
    outputSchema: {
      type: 'object',
      required: ['platforms', 'results', 'artifacts'],
      properties: {
        platforms: { type: 'array', items: { type: 'string' } },
        results: { type: 'array', items: { type: 'object' } },
        config: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'compatibility', 'cross-platform']
}));

export const dependencyCompatibilityTask = defineTask('dependency-compatibility', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Dependency Compatibility - ${args.projectName}`,
  agent: {
    name: 'compatibility-auditor',
    prompt: {
      role: 'Dependency Analyst',
      task: 'Validate dependency compatibility',
      context: {
        projectName: args.projectName,
        sdkLanguages: args.sdkLanguages,
        matrixSetup: args.matrixSetup,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze direct dependencies',
        '2. Check transitive dependencies',
        '3. Test dependency version ranges',
        '4. Identify peer dependency conflicts',
        '5. Test optional dependencies',
        '6. Validate security updates compatibility',
        '7. Check license compatibility',
        '8. Test bundle size impact',
        '9. Configure dependency scanning',
        '10. Generate dependency compatibility report'
      ],
      outputFormat: 'JSON with dependency compatibility results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'conflicts', 'artifacts'],
      properties: {
        results: { type: 'array', items: { type: 'object' } },
        conflicts: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'compatibility', 'dependencies']
}));

export const breakingChangeDetectionTask = defineTask('breaking-change-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Breaking Change Detection - ${args.projectName}`,
  agent: {
    name: 'compatibility-auditor',
    prompt: {
      role: 'API Analyst',
      task: 'Implement breaking change detection',
      context: {
        projectName: args.projectName,
        sdkLanguages: args.sdkLanguages,
        compatibilityStrategy: args.compatibilityStrategy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure API diff tooling',
        '2. Define breaking change categories',
        '3. Set up signature comparison',
        '4. Configure type compatibility checks',
        '5. Set up behavioral change detection',
        '6. Configure deprecation tracking',
        '7. Set up PR integration',
        '8. Design change notification',
        '9. Configure severity classification',
        '10. Generate breaking change detection config'
      ],
      outputFormat: 'JSON with breaking change detection config'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'categories', 'artifacts'],
      properties: {
        config: { type: 'object' },
        categories: { type: 'array', items: { type: 'string' } },
        tooling: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'compatibility', 'breaking-changes']
}));

export const backwardCompatibilityTask = defineTask('backward-compatibility', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Backward Compatibility Tests - ${args.projectName}`,
  agent: {
    name: 'compatibility-auditor',
    prompt: {
      role: 'Compatibility Engineer',
      task: 'Create backward compatibility tests',
      context: {
        projectName: args.projectName,
        sdkLanguages: args.sdkLanguages,
        compatibilityStrategy: args.compatibilityStrategy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create API signature tests',
        '2. Build behavioral compatibility tests',
        '3. Create serialization compatibility tests',
        '4. Build configuration compatibility tests',
        '5. Create error response compatibility tests',
        '6. Build authentication flow tests',
        '7. Create pagination compatibility tests',
        '8. Build webhook compatibility tests',
        '9. Design upgrade path tests',
        '10. Generate backward compatibility suite'
      ],
      outputFormat: 'JSON with backward compatibility tests'
    },
    outputSchema: {
      type: 'object',
      required: ['tests', 'results', 'artifacts'],
      properties: {
        tests: { type: 'array', items: { type: 'object' } },
        results: { type: 'array', items: { type: 'object' } },
        coverage: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'compatibility', 'backward-compatibility']
}));

export const compatibilityCicdTask = defineTask('compatibility-cicd', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: CI/CD Integration - ${args.projectName}`,
  agent: {
    name: 'platform-architect',
    prompt: {
      role: 'DevOps Engineer',
      task: 'Integrate compatibility tests with CI/CD',
      context: {
        projectName: args.projectName,
        matrixSetup: args.matrixSetup,
        backwardCompatibility: args.backwardCompatibility,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure matrix CI/CD jobs',
        '2. Set up parallel execution',
        '3. Configure result aggregation',
        '4. Set up compatibility gates',
        '5. Configure failure notifications',
        '6. Set up compatibility badges',
        '7. Configure scheduled testing',
        '8. Set up release compatibility checks',
        '9. Configure matrix optimization',
        '10. Generate CI/CD configuration'
      ],
      outputFormat: 'JSON with CI/CD configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'jobs', 'artifacts'],
      properties: {
        config: { type: 'object' },
        jobs: { type: 'array', items: { type: 'object' } },
        gates: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['sdk', 'compatibility', 'cicd']
}));

export const compatibilityDocumentationTask = defineTask('compatibility-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Compatibility Documentation - ${args.projectName}`,
  agent: {
    name: 'technical-writer-agent',
    prompt: {
      role: 'Technical Writer',
      task: 'Generate compatibility documentation',
      context: {
        projectName: args.projectName,
        compatibilityStrategy: args.compatibilityStrategy,
        matrixSetup: args.matrixSetup,
        crossPlatformTests: args.crossPlatformTests,
        dependencyCompatibility: args.dependencyCompatibility,
        backwardCompatibility: args.backwardCompatibility,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create compatibility matrix documentation',
        '2. Document supported versions',
        '3. Write platform compatibility guide',
        '4. Document dependency requirements',
        '5. Create breaking change policy',
        '6. Write upgrade guide template',
        '7. Document testing procedures',
        '8. Create compatibility FAQ',
        '9. Write troubleshooting guide',
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
            matrix: { type: 'string' },
            upgradeGuide: { type: 'string' },
            policy: { type: 'string' }
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
  labels: ['sdk', 'compatibility', 'documentation']
}));
