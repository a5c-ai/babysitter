/**
 * @process specializations/qa-testing-automation/automation-framework
 * @description Test Automation Framework Setup - Establish a robust, maintainable test automation framework with
 * proper architecture, design patterns, reporting capabilities, and CI/CD integration following industry best practices.
 * @inputs { projectName: string, techStack: object, testTypes?: array, cicdPlatform?: string, reportingTools?: array, codingStandards?: object }
 * @outputs { success: boolean, frameworkSetup: object, documentation: object, sampleTests: array, cicdIntegration: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/qa-testing-automation/automation-framework', {
 *   projectName: 'E-Commerce Platform',
 *   techStack: {
 *     frontend: 'React',
 *     backend: 'Node.js',
 *     database: 'PostgreSQL',
 *     language: 'TypeScript'
 *   },
 *   testTypes: ['e2e', 'api', 'unit', 'integration'],
 *   cicdPlatform: 'GitHub Actions',
 *   reportingTools: ['Allure', 'HTML Reporter'],
 *   codingStandards: {
 *     linter: 'ESLint',
 *     formatter: 'Prettier'
 *   }
 * });
 *
 * @references
 * - Test Automation Frameworks: https://martinfowler.com/bliki/TestAutomation.html
 * - Page Object Model: https://playwright.dev/docs/pom
 * - Testing Best Practices: https://testingjavascript.com/
 * - CI/CD Integration: https://docs.github.com/en/actions/automating-builds-and-tests
 * - Allure Reporting: https://docs.qameta.io/allure/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    techStack,
    testTypes = ['e2e', 'api', 'unit', 'integration'],
    cicdPlatform = 'GitHub Actions',
    reportingTools = ['Allure', 'HTML Reporter'],
    codingStandards = { linter: 'ESLint', formatter: 'Prettier' },
    environmentDetails = {},
    parallelExecution = true,
    outputDir = 'test-automation-framework'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Test Automation Framework Setup: ${projectName}`);
  ctx.log('info', `Test Types: ${testTypes.join(', ')}`);
  ctx.log('info', `CI/CD Platform: ${cicdPlatform}`);

  // ============================================================================
  // PHASE 1: TOOL SELECTION AND EVALUATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Evaluating and selecting testing tools');

  const toolSelectionResult = await ctx.task(toolSelectionTask, {
    projectName,
    techStack,
    testTypes,
    cicdPlatform,
    reportingTools,
    outputDir
  });

  artifacts.push(...toolSelectionResult.artifacts);

  // Quality Gate: Tool selection must be approved
  await ctx.breakpoint({
    question: `Phase 1 Complete: Tool selection recommendations ready. Framework: ${toolSelectionResult.recommendations.testFramework}, E2E: ${toolSelectionResult.recommendations.e2eFramework}, API: ${toolSelectionResult.recommendations.apiFramework}. Review and approve tool selection?`,
    title: 'Tool Selection Review',
    context: {
      runId: ctx.runId,
      recommendations: toolSelectionResult.recommendations,
      rationale: toolSelectionResult.rationale,
      files: toolSelectionResult.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 2: PROJECT STRUCTURE CREATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Creating modular directory structure');

  const projectStructureResult = await ctx.task(projectStructureTask, {
    projectName,
    testTypes,
    selectedTools: toolSelectionResult.recommendations,
    codingStandards,
    outputDir
  });

  artifacts.push(...projectStructureResult.artifacts);

  if (!projectStructureResult.success) {
    return {
      success: false,
      error: 'Project structure creation failed',
      details: projectStructureResult,
      metadata: { processId: 'specializations/qa-testing-automation/automation-framework', timestamp: startTime }
    };
  }

  // ============================================================================
  // PHASE 3: FRAMEWORK ARCHITECTURE IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Implementing framework architecture patterns');

  const architectureResult = await ctx.task(frameworkArchitectureTask, {
    projectName,
    techStack,
    testTypes,
    selectedTools: toolSelectionResult.recommendations,
    projectStructure: projectStructureResult.structure,
    outputDir
  });

  artifacts.push(...architectureResult.artifacts);

  // Quality Gate: Architecture must support extensibility and maintainability
  await ctx.breakpoint({
    question: `Phase 3 Complete: Framework architecture implemented with ${architectureResult.patterns.join(', ')} patterns. Architecture supports parallel execution: ${architectureResult.supportsParallel}. Review architecture and approve?`,
    title: 'Framework Architecture Review',
    context: {
      runId: ctx.runId,
      patterns: architectureResult.patterns,
      layers: architectureResult.layers,
      supportsParallel: architectureResult.supportsParallel,
      files: architectureResult.artifacts.map(a => ({ path: a.path, format: a.format || 'code' }))
    }
  });

  // ============================================================================
  // PHASE 4: CONFIGURATION MANAGEMENT SETUP
  // ============================================================================

  ctx.log('info', 'Phase 4: Setting up configuration management');

  const configResult = await ctx.task(configurationManagementTask, {
    projectName,
    environmentDetails,
    testTypes,
    selectedTools: toolSelectionResult.recommendations,
    outputDir
  });

  artifacts.push(...configResult.artifacts);

  // ============================================================================
  // PHASE 5: PAGE OBJECT MODEL / DESIGN PATTERN IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing Page Object Model and design patterns');

  const designPatternResult = await ctx.task(designPatternImplementationTask, {
    projectName,
    techStack,
    selectedTools: toolSelectionResult.recommendations,
    architectureResult,
    outputDir
  });

  artifacts.push(...designPatternResult.artifacts);

  // ============================================================================
  // PHASE 6: TEST UTILITIES AND HELPERS
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating test utilities and helper functions');

  const utilitiesResult = await ctx.task(testUtilitiesTask, {
    projectName,
    testTypes,
    selectedTools: toolSelectionResult.recommendations,
    outputDir
  });

  artifacts.push(...utilitiesResult.artifacts);

  // ============================================================================
  // PHASE 7: REPORTING SETUP
  // ============================================================================

  ctx.log('info', 'Phase 7: Integrating test reporting capabilities');

  const reportingResult = await ctx.task(reportingSetupTask, {
    projectName,
    reportingTools,
    selectedTools: toolSelectionResult.recommendations,
    testTypes,
    cicdPlatform,
    outputDir
  });

  artifacts.push(...reportingResult.artifacts);

  // Quality Gate: Reporting must provide actionable insights
  await ctx.breakpoint({
    question: `Phase 7 Complete: Test reporting configured with ${reportingTools.join(', ')}. Reports include: ${reportingResult.reportTypes.join(', ')}. Verify reporting provides sufficient insights?`,
    title: 'Test Reporting Review',
    context: {
      runId: ctx.runId,
      reportingTools,
      reportTypes: reportingResult.reportTypes,
      sampleReportPath: reportingResult.sampleReportPath,
      files: reportingResult.artifacts.map(a => ({ path: a.path, format: a.format || 'code' }))
    }
  });

  // ============================================================================
  // PHASE 8: CI/CD INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Configuring CI/CD pipeline integration');

  const cicdResult = await ctx.task(cicdIntegrationTask, {
    projectName,
    cicdPlatform,
    testTypes,
    selectedTools: toolSelectionResult.recommendations,
    reportingResult,
    parallelExecution,
    outputDir
  });

  artifacts.push(...cicdResult.artifacts);

  // ============================================================================
  // PHASE 9: SAMPLE TEST CREATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Creating reference test examples');

  const sampleTestTasks = testTypes.map(testType =>
    () => ctx.task(sampleTestCreationTask, {
      projectName,
      testType,
      techStack,
      selectedTools: toolSelectionResult.recommendations,
      architectureResult,
      designPatternResult,
      outputDir
    })
  );

  const sampleTestResults = await ctx.parallel.all(sampleTestTasks);

  artifacts.push(...sampleTestResults.flatMap(r => r.artifacts));

  // Execute sample tests to verify framework works
  ctx.log('info', 'Executing sample tests to verify framework');

  const sampleTestExecutionResult = await ctx.task(executeSampleTestsTask, {
    projectName,
    sampleTests: sampleTestResults,
    selectedTools: toolSelectionResult.recommendations,
    outputDir
  });

  artifacts.push(...sampleTestExecutionResult.artifacts);

  // Quality Gate: Sample tests must pass
  if (!sampleTestExecutionResult.allPassed) {
    await ctx.breakpoint({
      question: `Phase 9 Warning: ${sampleTestExecutionResult.failedTests.length} sample test(s) failed. This indicates potential framework issues. Review failures and fix before proceeding?`,
      title: 'Sample Test Execution Failures',
      context: {
        runId: ctx.runId,
        failedTests: sampleTestExecutionResult.failedTests,
        passedTests: sampleTestExecutionResult.passedTests,
        files: sampleTestExecutionResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 10: DOCUMENTATION GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Generating comprehensive framework documentation');

  const documentationResult = await ctx.task(documentationGenerationTask, {
    projectName,
    toolSelectionResult,
    projectStructureResult,
    architectureResult,
    configResult,
    designPatternResult,
    reportingResult,
    cicdResult,
    sampleTestResults,
    codingStandards,
    outputDir
  });

  artifacts.push(...documentationResult.artifacts);

  // ============================================================================
  // PHASE 11: CODE QUALITY SETUP
  // ============================================================================

  ctx.log('info', 'Phase 11: Configuring code quality tools');

  const codeQualityResult = await ctx.task(codeQualitySetupTask, {
    projectName,
    codingStandards,
    selectedTools: toolSelectionResult.recommendations,
    outputDir
  });

  artifacts.push(...codeQualityResult.artifacts);

  // ============================================================================
  // PHASE 12: PARALLEL EXECUTION CONFIGURATION
  // ============================================================================

  if (parallelExecution) {
    ctx.log('info', 'Phase 12: Configuring parallel test execution');

    const parallelConfigResult = await ctx.task(parallelExecutionConfigTask, {
      projectName,
      testTypes,
      selectedTools: toolSelectionResult.recommendations,
      cicdPlatform,
      outputDir
    });

    artifacts.push(...parallelConfigResult.artifacts);

    // Quality Gate: Parallel execution must work correctly
    await ctx.breakpoint({
      question: `Phase 12 Complete: Parallel execution configured. Max workers: ${parallelConfigResult.maxWorkers}. Estimated speedup: ${parallelConfigResult.estimatedSpeedup}x. Test parallel execution?`,
      title: 'Parallel Execution Review',
      context: {
        runId: ctx.runId,
        maxWorkers: parallelConfigResult.maxWorkers,
        estimatedSpeedup: parallelConfigResult.estimatedSpeedup,
        shardingStrategy: parallelConfigResult.shardingStrategy,
        files: parallelConfigResult.artifacts.map(a => ({ path: a.path, format: a.format || 'code' }))
      }
    });
  }

  // ============================================================================
  // PHASE 13: FRAMEWORK VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 13: Validating framework against quality criteria');

  const validationResult = await ctx.task(frameworkValidationTask, {
    projectName,
    toolSelectionResult,
    projectStructureResult,
    architectureResult,
    configResult,
    reportingResult,
    cicdResult,
    sampleTestExecutionResult,
    documentationResult,
    codeQualityResult,
    outputDir
  });

  artifacts.push(...validationResult.artifacts);

  const validationScore = validationResult.overallScore;
  const qualityGatesMet = validationResult.qualityGatesMet;

  // Quality Gate: Framework must meet quality criteria
  if (!qualityGatesMet) {
    await ctx.breakpoint({
      question: `Phase 13 Warning: Framework validation score: ${validationScore}/100. ${validationResult.failedCriteria.length} quality gate(s) not met: ${validationResult.failedCriteria.join(', ')}. Address issues before finalizing?`,
      title: 'Framework Validation Issues',
      context: {
        runId: ctx.runId,
        validationScore,
        passedCriteria: validationResult.passedCriteria,
        failedCriteria: validationResult.failedCriteria,
        recommendations: validationResult.recommendations,
        files: validationResult.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
      }
    });
  }

  // ============================================================================
  // PHASE 14: FINAL REVIEW AND HANDOFF
  // ============================================================================

  ctx.log('info', 'Phase 14: Final framework review and team handoff');

  const finalReviewResult = await ctx.task(finalReviewTask, {
    projectName,
    toolSelectionResult,
    projectStructureResult,
    architectureResult,
    reportingResult,
    cicdResult,
    sampleTestResults,
    documentationResult,
    validationResult,
    outputDir
  });

  artifacts.push(...finalReviewResult.artifacts);

  // Final Breakpoint: Framework approval and handoff
  await ctx.breakpoint({
    question: `Test Automation Framework Setup Complete! Validation score: ${validationScore}/100. All quality gates met: ${qualityGatesMet}. ${sampleTestResults.length} test type(s) with sample tests. Framework ready for team adoption. Review deliverables and approve for production use?`,
    title: 'Framework Setup Complete - Final Approval',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        frameworkScore: validationScore,
        qualityGatesMet,
        testTypes,
        toolsSelected: toolSelectionResult.recommendations,
        cicdIntegrated: cicdResult.success,
        parallelExecutionEnabled: parallelExecution,
        documentationComplete: documentationResult.complete
      },
      nextSteps: finalReviewResult.nextSteps,
      trainingResources: finalReviewResult.trainingResources,
      files: [
        { path: documentationResult.readmePath, format: 'markdown', label: 'Getting Started Guide' },
        { path: documentationResult.architecturePath, format: 'markdown', label: 'Architecture Overview' },
        { path: documentationResult.contributingPath, format: 'markdown', label: 'Contributing Guidelines' },
        { path: validationResult.reportPath, format: 'markdown', label: 'Validation Report' },
        { path: finalReviewResult.handoffPath, format: 'markdown', label: 'Team Handoff Document' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: qualityGatesMet && validationScore >= 70,
    projectName,
    frameworkSetup: {
      toolSelection: toolSelectionResult.recommendations,
      projectStructure: projectStructureResult.structure,
      architecture: {
        patterns: architectureResult.patterns,
        layers: architectureResult.layers,
        supportsParallel: architectureResult.supportsParallel
      },
      configuration: configResult.environments,
      designPatterns: designPatternResult.patternsImplemented,
      utilities: utilitiesResult.utilities,
      reporting: reportingResult.reportTypes,
      codeQuality: codeQualityResult.toolsConfigured
    },
    cicdIntegration: {
      platform: cicdPlatform,
      pipelineConfigured: cicdResult.success,
      stages: cicdResult.stages,
      parallelExecution: parallelExecution
    },
    sampleTests: {
      testTypes: testTypes,
      totalTests: sampleTestResults.reduce((sum, r) => sum + r.testCount, 0),
      allPassed: sampleTestExecutionResult.allPassed,
      executionResults: sampleTestExecutionResult
    },
    documentation: {
      complete: documentationResult.complete,
      readmePath: documentationResult.readmePath,
      architecturePath: documentationResult.architecturePath,
      contributingPath: documentationResult.contributingPath,
      apiDocsPath: documentationResult.apiDocsPath
    },
    validation: {
      overallScore: validationScore,
      qualityGatesMet,
      passedCriteria: validationResult.passedCriteria,
      failedCriteria: validationResult.failedCriteria,
      recommendations: validationResult.recommendations
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/qa-testing-automation/automation-framework',
      timestamp: startTime,
      cicdPlatform,
      testTypes,
      parallelExecution
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Tool Selection and Evaluation
export const toolSelectionTask = defineTask('tool-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Tool Selection - ${args.projectName}`,
  agent: {
    name: 'test-automation-architect',
    prompt: {
      role: 'Senior Test Automation Architect',
      task: 'Evaluate and recommend testing tools based on project requirements',
      context: {
        projectName: args.projectName,
        techStack: args.techStack,
        testTypes: args.testTypes,
        cicdPlatform: args.cicdPlatform,
        reportingTools: args.reportingTools,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze tech stack and project requirements',
        '2. Evaluate test frameworks for unit/integration testing (Jest, Vitest, Mocha)',
        '3. Evaluate E2E testing frameworks (Playwright, Cypress, Selenium)',
        '4. Evaluate API testing tools (Supertest, REST Assured, Postman/Newman)',
        '5. Consider framework features: parallel execution, reporting, debugging, maintenance',
        '6. Assess tool compatibility with CI/CD platform',
        '7. Evaluate community support, documentation, and ecosystem',
        '8. Consider learning curve and team expertise',
        '9. Provide recommendations with detailed rationale',
        '10. Document pros/cons for each tool selection',
        '11. Create tool comparison matrix',
        '12. Save recommendations to output directory'
      ],
      outputFormat: 'JSON with tool recommendations, rationale, comparison matrix, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'rationale', 'artifacts'],
      properties: {
        recommendations: {
          type: 'object',
          properties: {
            testFramework: { type: 'string', description: 'Unit/integration test framework' },
            e2eFramework: { type: 'string', description: 'End-to-end testing framework' },
            apiFramework: { type: 'string', description: 'API testing framework' },
            assertionLibrary: { type: 'string' },
            mockingLibrary: { type: 'string' },
            testRunner: { type: 'string' }
          }
        },
        rationale: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              reason: { type: 'string' },
              pros: { type: 'array', items: { type: 'string' } },
              cons: { type: 'array', items: { type: 'string' } },
              alternatives: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        comparisonMatrix: {
          type: 'object',
          description: 'Comparison of evaluated tools'
        },
        dependencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              version: { type: 'string' },
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
  labels: ['agent', 'qa-automation', 'tool-selection', 'framework-setup']
}));

// Phase 2: Project Structure Creation
export const projectStructureTask = defineTask('project-structure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Project Structure - ${args.projectName}`,
  agent: {
    name: 'framework-architect',
    prompt: {
      role: 'Test Framework Architect',
      task: 'Create modular, scalable project directory structure for test automation',
      context: {
        projectName: args.projectName,
        testTypes: args.testTypes,
        selectedTools: args.selectedTools,
        codingStandards: args.codingStandards,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design directory structure with clear separation of concerns',
        '2. Create directories for each test type: tests/e2e, tests/api, tests/unit, tests/integration',
        '3. Create directories: fixtures, utils, config, page-objects, reporters, screenshots',
        '4. Set up configuration files: package.json, tsconfig.json (if TypeScript)',
        '5. Create .gitignore for test artifacts',
        '6. Set up environment-specific config directories',
        '7. Create base directory for shared utilities and helpers',
        '8. Organize by feature or layer (depending on architecture)',
        '9. Document directory structure and purpose of each folder',
        '10. Create README.md with structure overview',
        '11. Initialize npm/yarn project',
        '12. Return structure map'
      ],
      outputFormat: 'JSON with directory structure, config files, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'structure', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        structure: {
          type: 'object',
          properties: {
            rootDir: { type: 'string' },
            directories: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  path: { type: 'string' },
                  purpose: { type: 'string' }
                }
              }
            },
            configFiles: { type: 'array', items: { type: 'string' } }
          }
        },
        packageJson: { type: 'object' },
        gitignore: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qa-automation', 'project-structure', 'framework-setup']
}));

// Phase 3: Framework Architecture Implementation
export const frameworkArchitectureTask = defineTask('framework-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Framework Architecture - ${args.projectName}`,
  agent: {
    name: 'architecture-designer',
    prompt: {
      role: 'Software Architecture Designer specializing in test frameworks',
      task: 'Implement framework architecture with design patterns and best practices',
      context: {
        projectName: args.projectName,
        techStack: args.techStack,
        testTypes: args.testTypes,
        selectedTools: args.selectedTools,
        projectStructure: args.projectStructure,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Implement Page Object Model (POM) architecture for E2E tests',
        '2. Create base classes: BasePage, BaseTest, BaseAPI',
        '3. Implement Factory pattern for test data generation',
        '4. Use Builder pattern for complex test scenarios',
        '5. Implement Singleton pattern for browser/driver management',
        '6. Create abstraction layers: UI layer, API layer, data layer',
        '7. Implement dependency injection for utilities',
        '8. Design for parallel execution support',
        '9. Create extensible plugin architecture',
        '10. Implement logging and error handling framework',
        '11. Design retry mechanism for flaky tests',
        '12. Document architecture decisions and patterns',
        '13. Create architecture diagram'
      ],
      outputFormat: 'JSON with architecture components, patterns, base classes, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['patterns', 'layers', 'baseClasses', 'supportsParallel', 'artifacts'],
      properties: {
        patterns: {
          type: 'array',
          items: { type: 'string', enum: ['Page Object Model', 'Factory', 'Builder', 'Singleton', 'Strategy', 'Observer'] }
        },
        layers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              purpose: { type: 'string' },
              components: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        baseClasses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              className: { type: 'string' },
              purpose: { type: 'string' },
              filePath: { type: 'string' }
            }
          }
        },
        supportsParallel: { type: 'boolean' },
        extensibilityPoints: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qa-automation', 'architecture', 'framework-setup']
}));

// Phase 4: Configuration Management Setup
export const configurationManagementTask = defineTask('configuration-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Configuration Management - ${args.projectName}`,
  agent: {
    name: 'config-engineer',
    prompt: {
      role: 'DevOps Configuration Engineer',
      task: 'Set up comprehensive configuration management for test environments',
      context: {
        projectName: args.projectName,
        environmentDetails: args.environmentDetails,
        testTypes: args.testTypes,
        selectedTools: args.selectedTools,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create environment-specific config files: dev, staging, prod',
        '2. Configure base URLs, API endpoints, database connections',
        '3. Set up test user credentials management (use secrets/env vars)',
        '4. Configure timeout settings, retry policies',
        '5. Create test data configuration files',
        '6. Set up browser/device configurations',
        '7. Configure parallel execution settings',
        '8. Create environment variable templates (.env.example)',
        '9. Implement config loader utility',
        '10. Add config validation',
        '11. Document all configuration options',
        '12. Create config switching mechanism'
      ],
      outputFormat: 'JSON with environment configs, config loader, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['environments', 'configLoader', 'artifacts'],
      properties: {
        environments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              configFile: { type: 'string' },
              baseUrl: { type: 'string' },
              settings: { type: 'object' }
            }
          }
        },
        configLoader: {
          type: 'object',
          properties: {
            filePath: { type: 'string' },
            features: { type: 'array', items: { type: 'string' } }
          }
        },
        envVarTemplate: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qa-automation', 'configuration', 'framework-setup']
}));

// Phase 5: Design Pattern Implementation
export const designPatternImplementationTask = defineTask('design-pattern-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Design Pattern Implementation - ${args.projectName}`,
  agent: {
    name: 'pattern-implementer',
    prompt: {
      role: 'Senior Software Engineer specializing in design patterns',
      task: 'Implement Page Object Model and other design patterns for test framework',
      context: {
        projectName: args.projectName,
        techStack: args.techStack,
        selectedTools: args.selectedTools,
        architectureResult: args.architectureResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create Page Object base class with common methods',
        '2. Implement sample page objects (LoginPage, HomePage, etc.)',
        '3. Use element locator strategy (CSS, XPath, data-testid)',
        '4. Implement fluent interface pattern for chaining actions',
        '5. Create API client base class with common HTTP methods',
        '6. Implement request/response interceptors',
        '7. Create test data factory pattern',
        '8. Implement builder pattern for complex objects',
        '9. Add validation methods to page objects',
        '10. Create reusable component objects',
        '11. Document pattern usage with examples',
        '12. Return implemented patterns'
      ],
      outputFormat: 'JSON with implemented patterns, sample classes, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['patternsImplemented', 'sampleClasses', 'artifacts'],
      properties: {
        patternsImplemented: {
          type: 'array',
          items: { type: 'string' }
        },
        sampleClasses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              className: { type: 'string' },
              pattern: { type: 'string' },
              filePath: { type: 'string' },
              purpose: { type: 'string' }
            }
          }
        },
        locatorStrategy: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qa-automation', 'design-patterns', 'pom', 'framework-setup']
}));

// Phase 6: Test Utilities and Helpers
export const testUtilitiesTask = defineTask('test-utilities', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Test Utilities - ${args.projectName}`,
  agent: {
    name: 'utility-developer',
    prompt: {
      role: 'Test Automation Developer',
      task: 'Create comprehensive test utilities and helper functions',
      context: {
        projectName: args.projectName,
        testTypes: args.testTypes,
        selectedTools: args.selectedTools,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create wait utilities (explicit waits, custom wait conditions)',
        '2. Implement retry logic for flaky operations',
        '3. Create screenshot capture utilities',
        '4. Implement logging utilities with levels',
        '5. Create date/time manipulation helpers',
        '6. Implement random data generators',
        '7. Create assertion helpers with custom messages',
        '8. Implement file I/O utilities',
        '9. Create browser utilities (cookies, local storage)',
        '10. Implement API helpers (auth, request builders)',
        '11. Create database utilities if needed',
        '12. Document all utilities with JSDoc'
      ],
      outputFormat: 'JSON with utility categories, helper functions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['utilities', 'artifacts'],
      properties: {
        utilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              filePath: { type: 'string' },
              functions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    purpose: { type: 'string' }
                  }
                }
              }
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
  labels: ['agent', 'qa-automation', 'utilities', 'helpers', 'framework-setup']
}));

// Phase 7: Reporting Setup
export const reportingSetupTask = defineTask('reporting-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Reporting Setup - ${args.projectName}`,
  agent: {
    name: 'reporting-engineer',
    prompt: {
      role: 'QA Reporting Engineer',
      task: 'Integrate comprehensive test reporting capabilities',
      context: {
        projectName: args.projectName,
        reportingTools: args.reportingTools,
        selectedTools: args.selectedTools,
        testTypes: args.testTypes,
        cicdPlatform: args.cicdPlatform,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Install and configure reporting tools (Allure, HTML Reporter)',
        '2. Set up test result aggregation',
        '3. Configure screenshots/videos on failure',
        '4. Implement custom reporters if needed',
        '5. Add test execution metadata (duration, environment, user)',
        '6. Create report generation scripts',
        '7. Configure report hosting/serving',
        '8. Add trend analysis capabilities',
        '9. Integrate with CI/CD for automatic report publishing',
        '10. Create sample report with dummy data',
        '11. Document report interpretation guide',
        '12. Configure report retention policies'
      ],
      outputFormat: 'JSON with reporting config, report types, sample report path, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportTypes', 'configuration', 'artifacts'],
      properties: {
        reportTypes: {
          type: 'array',
          items: { type: 'string' }
        },
        configuration: {
          type: 'object',
          properties: {
            outputPath: { type: 'string' },
            retentionDays: { type: 'number' },
            screenshotsEnabled: { type: 'boolean' },
            videosEnabled: { type: 'boolean' }
          }
        },
        sampleReportPath: { type: 'string' },
        reportingScripts: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qa-automation', 'reporting', 'framework-setup']
}));

// Phase 8: CI/CD Integration
export const cicdIntegrationTask = defineTask('cicd-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: CI/CD Integration - ${args.projectName}`,
  agent: {
    name: 'cicd-engineer',
    prompt: {
      role: 'DevOps CI/CD Engineer',
      task: 'Configure CI/CD pipeline integration for automated test execution',
      context: {
        projectName: args.projectName,
        cicdPlatform: args.cicdPlatform,
        testTypes: args.testTypes,
        selectedTools: args.selectedTools,
        reportingResult: args.reportingResult,
        parallelExecution: args.parallelExecution,
        outputDir: args.outputDir
      },
      instructions: [
        `1. Create ${args.cicdPlatform} workflow/pipeline configuration`,
        '2. Define pipeline stages: install, lint, unit, integration, e2e',
        '3. Configure test execution commands for each stage',
        '4. Set up environment variables and secrets',
        '5. Configure artifact upload (reports, screenshots, videos)',
        '6. Add test result publishing',
        '7. Configure parallel job execution if enabled',
        '8. Add failure notifications (Slack, email)',
        '9. Configure scheduled test runs (nightly, weekly)',
        '10. Add PR checks and quality gates',
        '11. Create deployment pipeline integration',
        '12. Document pipeline configuration and customization'
      ],
      outputFormat: 'JSON with pipeline config, stages, integration details, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'pipelineFile', 'stages', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        pipelineFile: { type: 'string' },
        stages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              commands: { type: 'array', items: { type: 'string' } },
              estimatedDuration: { type: 'string' }
            }
          }
        },
        parallelJobs: { type: 'number' },
        notifications: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qa-automation', 'cicd', 'pipeline', 'framework-setup']
}));

// Phase 9: Sample Test Creation (per test type)
export const sampleTestCreationTask = defineTask('sample-test-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Sample ${args.testType.toUpperCase()} Tests - ${args.projectName}`,
  agent: {
    name: 'test-developer',
    prompt: {
      role: 'Senior QA Automation Engineer',
      task: `Create reference sample tests for ${args.testType} testing`,
      context: {
        projectName: args.projectName,
        testType: args.testType,
        techStack: args.techStack,
        selectedTools: args.selectedTools,
        architectureResult: args.architectureResult,
        designPatternResult: args.designPatternResult,
        outputDir: args.outputDir
      },
      instructions: [
        `1. Create 3-5 sample ${args.testType} tests demonstrating best practices`,
        '2. Follow framework architecture and design patterns',
        '3. Include positive and negative test scenarios',
        '4. Demonstrate proper use of page objects/API clients',
        '5. Show proper assertions and error handling',
        '6. Include test documentation and comments',
        '7. Use meaningful test names and descriptions',
        '8. Add test data setup and teardown',
        '9. Demonstrate utility function usage',
        '10. Include examples of different assertion styles',
        '11. Show async/await patterns correctly',
        '12. Return runnable sample test files'
      ],
      outputFormat: 'JSON with sample test files, test count, coverage areas, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['testType', 'testFiles', 'testCount', 'artifacts'],
      properties: {
        testType: { type: 'string' },
        testFiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              filePath: { type: 'string' },
              testName: { type: 'string' },
              description: { type: 'string' },
              scenario: { type: 'string' }
            }
          }
        },
        testCount: { type: 'number' },
        coverageAreas: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qa-automation', 'sample-tests', args.testType, 'framework-setup']
}));

// Phase 9b: Execute Sample Tests
export const executeSampleTestsTask = defineTask('execute-sample-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute Sample Tests - ${args.projectName}`,
  agent: {
    name: 'test-runner',
    prompt: {
      role: 'Test Execution Engineer',
      task: 'Execute all sample tests to verify framework functionality',
      context: {
        projectName: args.projectName,
        sampleTests: args.sampleTests,
        selectedTools: args.selectedTools,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Execute all sample tests across all test types',
        '2. Capture test execution results',
        '3. Verify tests run successfully',
        '4. Check test output and logs',
        '5. Verify reporting is working',
        '6. Capture screenshots/videos if generated',
        '7. Identify any failing tests',
        '8. Analyze failure root causes',
        '9. Generate test execution summary',
        '10. Return pass/fail status with details'
      ],
      outputFormat: 'JSON with execution results, pass/fail status, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['allPassed', 'totalTests', 'passedTests', 'failedTests', 'artifacts'],
      properties: {
        allPassed: { type: 'boolean' },
        totalTests: { type: 'number' },
        passedTests: { type: 'array', items: { type: 'string' } },
        failedTests: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testName: { type: 'string' },
              error: { type: 'string' },
              stackTrace: { type: 'string' }
            }
          }
        },
        executionTime: { type: 'number' },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qa-automation', 'test-execution', 'sample-tests', 'framework-setup']
}));

// Phase 10: Documentation Generation
export const documentationGenerationTask = defineTask('documentation-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Documentation - ${args.projectName}`,
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Technical Writer specializing in test automation',
      task: 'Generate comprehensive framework documentation',
      context: {
        projectName: args.projectName,
        toolSelectionResult: args.toolSelectionResult,
        projectStructureResult: args.projectStructureResult,
        architectureResult: args.architectureResult,
        configResult: args.configResult,
        designPatternResult: args.designPatternResult,
        reportingResult: args.reportingResult,
        cicdResult: args.cicdResult,
        sampleTestResults: args.sampleTestResults,
        codingStandards: args.codingStandards,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create comprehensive README.md with getting started guide',
        '2. Document framework architecture with diagrams',
        '3. Write contributing guidelines (CONTRIBUTING.md)',
        '4. Document all utilities and helpers (API docs)',
        '5. Create test writing guidelines',
        '6. Document page object pattern usage',
        '7. Write configuration guide',
        '8. Document CI/CD pipeline setup',
        '9. Create troubleshooting guide',
        '10. Document best practices',
        '11. Add examples and code snippets',
        '12. Create FAQ section',
        '13. Document reporting and result interpretation',
        '14. Add changelog template'
      ],
      outputFormat: 'JSON with documentation files, completeness status, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['complete', 'readmePath', 'architecturePath', 'contributingPath', 'artifacts'],
      properties: {
        complete: { type: 'boolean' },
        readmePath: { type: 'string' },
        architecturePath: { type: 'string' },
        contributingPath: { type: 'string' },
        apiDocsPath: { type: 'string' },
        guidelinesPath: { type: 'string' },
        troubleshootingPath: { type: 'string' },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              filePath: { type: 'string' }
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
  labels: ['agent', 'qa-automation', 'documentation', 'framework-setup']
}));

// Phase 11: Code Quality Setup
export const codeQualitySetupTask = defineTask('code-quality-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Code Quality - ${args.projectName}`,
  agent: {
    name: 'quality-engineer',
    prompt: {
      role: 'Code Quality Engineer',
      task: 'Configure code quality tools and standards',
      context: {
        projectName: args.projectName,
        codingStandards: args.codingStandards,
        selectedTools: args.selectedTools,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure linter (ESLint) with appropriate rules',
        '2. Set up code formatter (Prettier)',
        '3. Configure pre-commit hooks (Husky)',
        '4. Add TypeScript type checking if applicable',
        '5. Configure import organization',
        '6. Set up code complexity analysis',
        '7. Add test file naming conventions',
        '8. Configure editor configs (.editorconfig)',
        '9. Create code review checklist',
        '10. Add git hooks for quality checks',
        '11. Document code quality standards',
        '12. Return configured tools'
      ],
      outputFormat: 'JSON with configured tools, config files, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['toolsConfigured', 'configFiles', 'artifacts'],
      properties: {
        toolsConfigured: {
          type: 'array',
          items: { type: 'string' }
        },
        configFiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tool: { type: 'string' },
              filePath: { type: 'string' }
            }
          }
        },
        preCommitHooks: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qa-automation', 'code-quality', 'framework-setup']
}));

// Phase 12: Parallel Execution Configuration
export const parallelExecutionConfigTask = defineTask('parallel-execution-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Parallel Execution - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: {
      role: 'Test Performance Engineer',
      task: 'Configure parallel test execution for faster feedback',
      context: {
        projectName: args.projectName,
        testTypes: args.testTypes,
        selectedTools: args.selectedTools,
        cicdPlatform: args.cicdPlatform,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure test runner for parallel execution',
        '2. Determine optimal number of workers',
        '3. Set up test sharding strategy',
        '4. Configure isolated browser contexts',
        '5. Set up test data isolation for parallel runs',
        '6. Configure resource management (ports, databases)',
        '7. Add parallel execution to CI/CD',
        '8. Configure test result aggregation',
        '9. Set up parallel execution monitoring',
        '10. Calculate estimated speedup',
        '11. Document parallel execution setup',
        '12. Return configuration'
      ],
      outputFormat: 'JSON with parallel config, max workers, speedup estimate, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['maxWorkers', 'shardingStrategy', 'estimatedSpeedup', 'artifacts'],
      properties: {
        maxWorkers: { type: 'number' },
        shardingStrategy: { type: 'string' },
        estimatedSpeedup: { type: 'number', description: 'Speed improvement multiplier' },
        isolationStrategy: { type: 'string' },
        resourceManagement: {
          type: 'object',
          properties: {
            ports: { type: 'string' },
            testData: { type: 'string' }
          }
        },
        configFiles: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qa-automation', 'parallel-execution', 'framework-setup']
}));

// Phase 13: Framework Validation
export const frameworkValidationTask = defineTask('framework-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Framework Validation - ${args.projectName}`,
  agent: {
    name: 'qa-auditor',
    prompt: {
      role: 'Senior QA Auditor and Quality Assurance Lead',
      task: 'Validate framework against quality criteria and best practices',
      context: {
        projectName: args.projectName,
        toolSelectionResult: args.toolSelectionResult,
        projectStructureResult: args.projectStructureResult,
        architectureResult: args.architectureResult,
        configResult: args.configResult,
        reportingResult: args.reportingResult,
        cicdResult: args.cicdResult,
        sampleTestExecutionResult: args.sampleTestExecutionResult,
        documentationResult: args.documentationResult,
        codeQualityResult: args.codeQualityResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Verify framework supports parallel execution',
        '2. Check clear separation of concerns (test logic, data, config)',
        '3. Validate reporting provides actionable insights',
        '4. Verify CI/CD integration works with sample tests',
        '5. Check code follows quality standards',
        '6. Validate documentation completeness',
        '7. Verify all test types have samples',
        '8. Check error handling and logging',
        '9. Validate extensibility and maintainability',
        '10. Score framework on 10 quality criteria (0-10 each)',
        '11. Calculate overall score (0-100)',
        '12. Provide recommendations for improvements',
        '13. Generate validation report'
      ],
      outputFormat: 'JSON with validation score, passed/failed criteria, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'qualityGatesMet', 'passedCriteria', 'failedCriteria', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        qualityGatesMet: { type: 'boolean' },
        criteriaScores: {
          type: 'object',
          properties: {
            parallelExecution: { type: 'number' },
            separationOfConcerns: { type: 'number' },
            reporting: { type: 'number' },
            cicdIntegration: { type: 'number' },
            codeQuality: { type: 'number' },
            documentation: { type: 'number' },
            testCoverage: { type: 'number' },
            errorHandling: { type: 'number' },
            extensibility: { type: 'number' },
            maintainability: { type: 'number' }
          }
        },
        passedCriteria: { type: 'array', items: { type: 'string' } },
        failedCriteria: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qa-automation', 'validation', 'quality-gates', 'framework-setup']
}));

// Phase 14: Final Review and Handoff
export const finalReviewTask = defineTask('final-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 14: Final Review - ${args.projectName}`,
  agent: {
    name: 'project-lead',
    prompt: {
      role: 'QA Project Lead and Team Manager',
      task: 'Conduct final framework review and prepare team handoff',
      context: {
        projectName: args.projectName,
        toolSelectionResult: args.toolSelectionResult,
        projectStructureResult: args.projectStructureResult,
        architectureResult: args.architectureResult,
        reportingResult: args.reportingResult,
        cicdResult: args.cicdResult,
        sampleTestResults: args.sampleTestResults,
        documentationResult: args.documentationResult,
        validationResult: args.validationResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Review all framework components and deliverables',
        '2. Verify framework is production-ready',
        '3. Create team onboarding checklist',
        '4. Prepare training materials and resources',
        '5. Define next steps for team adoption',
        '6. Create framework maintenance plan',
        '7. Identify knowledge transfer sessions needed',
        '8. Prepare demo scenarios for team',
        '9. Create quick reference guides',
        '10. Define framework evolution roadmap',
        '11. Prepare handoff documentation',
        '12. Return handoff package'
      ],
      outputFormat: 'JSON with handoff document, next steps, training resources, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['nextSteps', 'trainingResources', 'handoffPath', 'artifacts'],
      properties: {
        nextSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              owner: { type: 'string' },
              timeline: { type: 'string' }
            }
          }
        },
        trainingResources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              type: { type: 'string' },
              link: { type: 'string' }
            }
          }
        },
        onboardingChecklist: { type: 'array', items: { type: 'string' } },
        maintenancePlan: { type: 'string' },
        handoffPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qa-automation', 'final-review', 'handoff', 'framework-setup']
}));
