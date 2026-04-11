/**
 * @process specializations/devops-sre-platform/cicd-pipeline-setup
 * @description CI/CD Pipeline Setup - Design and implement a complete CI/CD pipeline from code commit to production deployment,
 * including build automation, testing stages, security scanning, artifact management, and multi-environment deployments.
 * @inputs { projectName: string, repositoryUrl?: string, cicdPlatform: string, environments?: array, techStack?: object, testingStrategy?: object }
 * @outputs { success: boolean, pipelineConfig: object, stages: array, securityIntegration: object, deploymentStrategy: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/devops-sre-platform/cicd-pipeline-setup', {
 *   projectName: 'E-Commerce API',
 *   repositoryUrl: 'https://github.com/org/ecommerce-api',
 *   cicdPlatform: 'GitHub Actions',
 *   environments: ['dev', 'staging', 'prod'],
 *   techStack: {
 *     language: 'Node.js',
 *     framework: 'Express',
 *     containerization: 'Docker',
 *     orchestration: 'Kubernetes'
 *   },
 *   testingStrategy: {
 *     unit: true,
 *     integration: true,
 *     e2e: true,
 *     security: true,
 *     performance: false
 *   }
 * });
 *
 * @references
 * - Continuous Delivery: https://continuousdelivery.com/
 * - GitLab CI/CD: https://docs.gitlab.com/ee/ci/
 * - GitHub Actions: https://docs.github.com/en/actions
 * - Jenkins Pipeline: https://www.jenkins.io/doc/book/pipeline/
 * - CI/CD Best Practices: https://martinfowler.com/articles/continuousIntegration.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    repositoryUrl = '',
    cicdPlatform,
    environments = ['dev', 'staging', 'prod'],
    techStack = {},
    testingStrategy = { unit: true, integration: true, e2e: false, security: true, performance: false },
    deploymentTarget = 'kubernetes',
    notificationChannels = ['email'],
    outputDir = 'cicd-pipeline-setup'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting CI/CD Pipeline Setup: ${projectName}`);
  ctx.log('info', `CI/CD Platform: ${cicdPlatform}`);
  ctx.log('info', `Target Environments: ${environments.join(', ')}`);

  // ============================================================================
  // PHASE 1: REQUIREMENTS ANALYSIS AND TOOL SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing requirements and validating tool selection');

  const requirementsAnalysis = await ctx.task(requirementsAnalysisTask, {
    projectName,
    repositoryUrl,
    cicdPlatform,
    environments,
    techStack,
    testingStrategy,
    deploymentTarget,
    outputDir
  });

  artifacts.push(...requirementsAnalysis.artifacts);

  // Quality Gate: Requirements must be clear and tool selection validated
  await ctx.breakpoint({
    question: `Phase 1 Complete: Requirements analyzed for ${cicdPlatform}. Pipeline will include ${requirementsAnalysis.pipelineStages.length} stages across ${environments.length} environments. Proceed with pipeline design?`,
    title: 'Requirements Analysis Review',
    context: {
      runId: ctx.runId,
      cicdPlatform,
      pipelineStages: requirementsAnalysis.pipelineStages,
      estimatedComplexity: requirementsAnalysis.complexity,
      toolCompatibility: requirementsAnalysis.toolCompatibility,
      files: requirementsAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 2: PIPELINE ARCHITECTURE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing pipeline architecture and stage flow');

  const architectureDesign = await ctx.task(pipelineArchitectureTask, {
    projectName,
    cicdPlatform,
    environments,
    techStack,
    testingStrategy,
    requirementsAnalysis,
    outputDir
  });

  artifacts.push(...architectureDesign.artifacts);

  // ============================================================================
  // PHASE 3: BUILD STAGE CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Configuring build automation and dependency management');

  const buildConfig = await ctx.task(buildStageConfigTask, {
    projectName,
    cicdPlatform,
    techStack,
    architectureDesign,
    outputDir
  });

  artifacts.push(...buildConfig.artifacts);

  // ============================================================================
  // PHASE 4: TESTING STAGES SETUP
  // ============================================================================

  ctx.log('info', 'Phase 4: Setting up testing stages (unit, integration, e2e)');

  const testingStagesConfig = await ctx.task(testingStagesTask, {
    projectName,
    cicdPlatform,
    testingStrategy,
    techStack,
    architectureDesign,
    outputDir
  });

  artifacts.push(...testingStagesConfig.artifacts);

  // ============================================================================
  // PHASE 5: SECURITY SCANNING INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Integrating security scanning (SAST, DAST, dependency scan)');

  const securityIntegration = await ctx.task(securityScanningTask, {
    projectName,
    cicdPlatform,
    techStack,
    architectureDesign,
    outputDir
  });

  artifacts.push(...securityIntegration.artifacts);

  // Quality Gate: Security scanning must be properly configured
  await ctx.breakpoint({
    question: `Phase 5 Complete: Security scanning configured with ${securityIntegration.scanTypes.length} scan types. Quality gates: ${securityIntegration.qualityGates.join(', ')}. Approve security configuration?`,
    title: 'Security Integration Review',
    context: {
      runId: ctx.runId,
      scanTypes: securityIntegration.scanTypes,
      qualityGates: securityIntegration.qualityGates,
      vulnerabilityThresholds: securityIntegration.thresholds,
      files: securityIntegration.artifacts.map(a => ({ path: a.path, format: a.format || 'yaml' }))
    }
  });

  // ============================================================================
  // PHASE 6: ARTIFACT MANAGEMENT SETUP
  // ============================================================================

  ctx.log('info', 'Phase 6: Configuring artifact repositories and container registries');

  const artifactManagement = await ctx.task(artifactManagementTask, {
    projectName,
    cicdPlatform,
    techStack,
    architectureDesign,
    outputDir
  });

  artifacts.push(...artifactManagement.artifacts);

  // ============================================================================
  // PHASE 7: DEPLOYMENT STAGES CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Configuring multi-environment deployment stages');

  const deploymentTasks = environments.map(env =>
    () => ctx.task(deploymentStageTask, {
      projectName,
      cicdPlatform,
      environment: env,
      deploymentTarget,
      techStack,
      architectureDesign,
      artifactManagement,
      outputDir
    })
  );

  const deploymentConfigs = await ctx.parallel.all(deploymentTasks);

  artifacts.push(...deploymentConfigs.flatMap(d => d.artifacts));

  // ============================================================================
  // PHASE 8: APPROVAL GATES AND NOTIFICATIONS
  // ============================================================================

  ctx.log('info', 'Phase 8: Setting up approval gates and notification channels');

  const approvalGatesConfig = await ctx.task(approvalGatesTask, {
    projectName,
    cicdPlatform,
    environments,
    notificationChannels,
    architectureDesign,
    outputDir
  });

  artifacts.push(...approvalGatesConfig.artifacts);

  // ============================================================================
  // PHASE 9: ROLLBACK AND RECOVERY STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 9: Implementing rollback mechanisms and failure recovery');

  const rollbackStrategy = await ctx.task(rollbackStrategyTask, {
    projectName,
    cicdPlatform,
    environments,
    deploymentTarget,
    architectureDesign,
    outputDir
  });

  artifacts.push(...rollbackStrategy.artifacts);

  // ============================================================================
  // PHASE 10: PIPELINE OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Optimizing pipeline for speed and efficiency');

  const optimizationConfig = await ctx.task(pipelineOptimizationTask, {
    projectName,
    cicdPlatform,
    architectureDesign,
    buildConfig,
    testingStagesConfig,
    outputDir
  });

  artifacts.push(...optimizationConfig.artifacts);

  // ============================================================================
  // PHASE 11: MONITORING AND METRICS SETUP
  // ============================================================================

  ctx.log('info', 'Phase 11: Setting up pipeline monitoring and metrics collection');

  const monitoringSetup = await ctx.task(pipelineMonitoringTask, {
    projectName,
    cicdPlatform,
    environments,
    architectureDesign,
    outputDir
  });

  artifacts.push(...monitoringSetup.artifacts);

  // ============================================================================
  // PHASE 12: DOCUMENTATION GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 12: Generating comprehensive pipeline documentation');

  const documentation = await ctx.task(documentationGenerationTask, {
    projectName,
    cicdPlatform,
    requirementsAnalysis,
    architectureDesign,
    buildConfig,
    testingStagesConfig,
    securityIntegration,
    artifactManagement,
    deploymentConfigs,
    approvalGatesConfig,
    rollbackStrategy,
    optimizationConfig,
    monitoringSetup,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // ============================================================================
  // PHASE 13: PIPELINE VALIDATION AND TESTING
  // ============================================================================

  ctx.log('info', 'Phase 13: Validating pipeline configuration and running test execution');

  const validationResult = await ctx.task(pipelineValidationTask, {
    projectName,
    cicdPlatform,
    architectureDesign,
    buildConfig,
    testingStagesConfig,
    securityIntegration,
    deploymentConfigs,
    outputDir
  });

  artifacts.push(...validationResult.artifacts);

  const pipelineScore = validationResult.overallScore;
  const validationPassed = pipelineScore >= 75;

  // Quality Gate: Pipeline must meet quality criteria
  if (!validationPassed) {
    await ctx.breakpoint({
      question: `Phase 13 Warning: Pipeline validation score: ${pipelineScore}/100 (below threshold of 75). ${validationResult.failedChecks.length} check(s) failed. Review and fix issues before deployment?`,
      title: 'Pipeline Validation Issues',
      context: {
        runId: ctx.runId,
        validationScore: pipelineScore,
        passedChecks: validationResult.passedChecks,
        failedChecks: validationResult.failedChecks,
        recommendations: validationResult.recommendations,
        files: validationResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 14: FINAL REVIEW AND DEPLOYMENT
  // ============================================================================

  ctx.log('info', 'Phase 14: Final review and pipeline deployment');

  const finalReview = await ctx.task(finalReviewTask, {
    projectName,
    cicdPlatform,
    requirementsAnalysis,
    architectureDesign,
    securityIntegration,
    deploymentConfigs,
    documentation,
    validationResult,
    outputDir
  });

  artifacts.push(...finalReview.artifacts);

  // Final Breakpoint: Pipeline Approval
  await ctx.breakpoint({
    question: `CI/CD Pipeline Setup Complete for ${projectName}! Validation score: ${pipelineScore}/100. Pipeline includes ${architectureDesign.stages.length} stages across ${environments.length} environments. Review deliverables and approve for deployment?`,
    title: 'Pipeline Setup Complete - Final Approval',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        cicdPlatform,
        validationScore: pipelineScore,
        totalStages: architectureDesign.stages.length,
        environments: environments,
        securityScanning: securityIntegration.scanTypes.length > 0,
        approvalGatesConfigured: approvalGatesConfig.gatesConfigured,
        monitoringEnabled: monitoringSetup.metricsEnabled
      },
      nextSteps: finalReview.nextSteps,
      deploymentChecklist: finalReview.deploymentChecklist,
      files: [
        { path: documentation.readmePath, format: 'markdown', label: 'Pipeline Setup Guide' },
        { path: documentation.architecturePath, format: 'markdown', label: 'Pipeline Architecture' },
        { path: documentation.runbookPath, format: 'markdown', label: 'Operations Runbook' },
        { path: validationResult.reportPath, format: 'json', label: 'Validation Report' },
        { path: finalReview.deploymentGuidePath, format: 'markdown', label: 'Deployment Guide' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: validationPassed && pipelineScore >= 75,
    projectName,
    cicdPlatform,
    pipelineConfig: {
      platform: cicdPlatform,
      configFile: architectureDesign.configFilePath,
      stages: architectureDesign.stages,
      estimatedDuration: architectureDesign.estimatedPipelineDuration,
      parallelization: optimizationConfig.parallelizationEnabled
    },
    stages: {
      build: buildConfig.buildStage,
      testing: testingStagesConfig.testStages,
      security: securityIntegration.securityStage,
      deployment: deploymentConfigs.map(d => d.deploymentStage)
    },
    environments: environments,
    securityIntegration: {
      scanTypes: securityIntegration.scanTypes,
      qualityGates: securityIntegration.qualityGates,
      thresholds: securityIntegration.thresholds
    },
    artifactManagement: {
      repositories: artifactManagement.repositories,
      registries: artifactManagement.registries,
      retentionPolicy: artifactManagement.retentionPolicy
    },
    deploymentStrategy: {
      target: deploymentTarget,
      approvalGates: approvalGatesConfig.approvalGates,
      rollbackStrategy: rollbackStrategy.strategy,
      notifications: approvalGatesConfig.notifications
    },
    monitoring: {
      metricsEnabled: monitoringSetup.metricsEnabled,
      dashboardUrl: monitoringSetup.dashboardUrl,
      alerts: monitoringSetup.alerts
    },
    optimization: {
      caching: optimizationConfig.cachingStrategies,
      parallelization: optimizationConfig.parallelJobs,
      estimatedSpeedup: optimizationConfig.estimatedSpeedup
    },
    documentation: {
      readme: documentation.readmePath,
      architecture: documentation.architecturePath,
      runbook: documentation.runbookPath,
      troubleshooting: documentation.troubleshootingPath
    },
    validation: {
      overallScore: pipelineScore,
      passedChecks: validationResult.passedChecks,
      failedChecks: validationResult.failedChecks,
      recommendations: validationResult.recommendations
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/devops-sre-platform/cicd-pipeline-setup',
      timestamp: startTime,
      cicdPlatform,
      environments,
      deploymentTarget
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Requirements Analysis and Tool Selection
export const requirementsAnalysisTask = defineTask('requirements-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Requirements Analysis - ${args.projectName}`,
  agent: {
    name: 'devops-architect',
    prompt: {
      role: 'Senior DevOps Architect with expertise in CI/CD pipeline design',
      task: 'Analyze project requirements and validate CI/CD tool selection',
      context: {
        projectName: args.projectName,
        repositoryUrl: args.repositoryUrl,
        cicdPlatform: args.cicdPlatform,
        environments: args.environments,
        techStack: args.techStack,
        testingStrategy: args.testingStrategy,
        deploymentTarget: args.deploymentTarget,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze project requirements and technology stack',
        '2. Validate CI/CD platform selection for compatibility with tech stack',
        '3. Identify required pipeline stages (build, test, security, deploy)',
        '4. Assess integration requirements with existing tools and systems',
        '5. Evaluate scalability and performance requirements',
        '6. Identify compliance and regulatory requirements',
        '7. Define quality gates and approval criteria',
        '8. Assess team skills and training needs for the selected platform',
        '9. Calculate estimated pipeline complexity (low, medium, high)',
        '10. Document assumptions and constraints',
        '11. Provide tool compatibility assessment',
        '12. Generate requirements analysis report'
      ],
      outputFormat: 'JSON with requirements analysis, pipeline stages, tool compatibility'
    },
    outputSchema: {
      type: 'object',
      required: ['pipelineStages', 'toolCompatibility', 'complexity', 'artifacts'],
      properties: {
        pipelineStages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stage: { type: 'string' },
              purpose: { type: 'string' },
              required: { type: 'boolean' },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        toolCompatibility: {
          type: 'object',
          properties: {
            compatible: { type: 'boolean' },
            integrations: { type: 'array', items: { type: 'string' } },
            limitations: { type: 'array', items: { type: 'string' } },
            alternatives: { type: 'array', items: { type: 'string' } }
          }
        },
        complexity: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'very-high']
        },
        complianceRequirements: {
          type: 'array',
          items: { type: 'string' }
        },
        qualityGates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gate: { type: 'string' },
              criteria: { type: 'string' },
              stage: { type: 'string' }
            }
          }
        },
        assumptions: { type: 'array', items: { type: 'string' } },
        constraints: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['devops', 'cicd', 'requirements-analysis', 'pipeline-setup']
}));

// Phase 2: Pipeline Architecture Design
export const pipelineArchitectureTask = defineTask('pipeline-architecture', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Pipeline Architecture Design - ${args.projectName}`,
  agent: {
    name: 'pipeline-architect',
    prompt: {
      role: 'CI/CD Pipeline Architect',
      task: 'Design comprehensive pipeline architecture and stage flow',
      context: {
        projectName: args.projectName,
        cicdPlatform: args.cicdPlatform,
        environments: args.environments,
        techStack: args.techStack,
        testingStrategy: args.testingStrategy,
        requirementsAnalysis: args.requirementsAnalysis,
        outputDir: args.outputDir
      },
      instructions: [
        `1. Design pipeline architecture for ${args.cicdPlatform}`,
        '2. Define stage execution order and dependencies',
        '3. Design parallel execution strategy for independent stages',
        '4. Configure environment-specific deployment workflows',
        '5. Design artifact propagation between stages',
        '6. Define pipeline triggers (push, PR, schedule, manual)',
        '7. Design branch-specific workflows (main, develop, feature branches)',
        '8. Configure pipeline variables and secrets management',
        '9. Design failure handling and retry logic',
        '10. Estimate pipeline execution duration',
        '11. Create pipeline architecture diagram',
        '12. Generate initial pipeline configuration file'
      ],
      outputFormat: 'JSON with pipeline architecture, stages, configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['stages', 'configFilePath', 'estimatedPipelineDuration', 'artifacts'],
      properties: {
        stages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              executionOrder: { type: 'number' },
              parallel: { type: 'boolean' },
              dependencies: { type: 'array', items: { type: 'string' } },
              environments: { type: 'array', items: { type: 'string' } },
              estimatedDuration: { type: 'string' }
            }
          }
        },
        triggers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              branches: { type: 'array', items: { type: 'string' } },
              schedule: { type: 'string' }
            }
          }
        },
        branchStrategy: {
          type: 'object',
          properties: {
            main: { type: 'object' },
            develop: { type: 'object' },
            feature: { type: 'object' },
            hotfix: { type: 'object' }
          }
        },
        configFilePath: { type: 'string' },
        estimatedPipelineDuration: { type: 'string' },
        parallelizationOpportunities: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['devops', 'cicd', 'architecture', 'pipeline-design']
}));

// Phase 3: Build Stage Configuration
export const buildStageConfigTask = defineTask('build-stage-config', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Build Stage Configuration - ${args.projectName}`,
  agent: {
    name: 'build-engineer',
    prompt: {
      role: 'Build Automation Engineer',
      task: 'Configure build automation and dependency management',
      context: {
        projectName: args.projectName,
        cicdPlatform: args.cicdPlatform,
        techStack: args.techStack,
        architectureDesign: args.architectureDesign,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure dependency installation and caching',
        '2. Set up build tools and compilers',
        '3. Configure build optimization (incremental builds, layer caching)',
        '4. Set up environment variable management',
        '5. Configure code linting and formatting checks',
        '6. Set up version tagging and semantic versioning',
        '7. Configure artifact generation (binaries, packages, containers)',
        '8. Set up build matrix for multiple platforms/versions if needed',
        '9. Configure build failure notifications',
        '10. Optimize build performance with caching strategies',
        '11. Document build process and troubleshooting',
        '12. Generate build stage configuration'
      ],
      outputFormat: 'JSON with build stage configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['buildStage', 'cachingStrategies', 'artifacts'],
      properties: {
        buildStage: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            steps: { type: 'array', items: { type: 'string' } },
            caching: { type: 'object' },
            buildTools: { type: 'array', items: { type: 'string' } },
            estimatedDuration: { type: 'string' }
          }
        },
        cachingStrategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              paths: { type: 'array', items: { type: 'string' } },
              key: { type: 'string' }
            }
          }
        },
        buildOptimizations: { type: 'array', items: { type: 'string' } },
        buildMatrix: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            dimensions: { type: 'array', items: { type: 'string' } }
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
  labels: ['devops', 'cicd', 'build', 'automation']
}));

// Phase 4: Testing Stages Setup
export const testingStagesTask = defineTask('testing-stages', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Testing Stages Setup - ${args.projectName}`,
  agent: {
    name: 'test-automation-engineer',
    prompt: {
      role: 'Test Automation Engineer',
      task: 'Configure comprehensive testing stages in the CI/CD pipeline',
      context: {
        projectName: args.projectName,
        cicdPlatform: args.cicdPlatform,
        testingStrategy: args.testingStrategy,
        techStack: args.techStack,
        architectureDesign: args.architectureDesign,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure unit test execution stage',
        '2. Set up integration testing with test databases/services',
        '3. Configure end-to-end testing if required',
        '4. Set up code coverage collection and reporting',
        '5. Configure test result publishing and visualization',
        '6. Set up test parallelization for faster execution',
        '7. Configure test failure analysis and reporting',
        '8. Set up quality gates based on test results',
        '9. Configure test environment setup and teardown',
        '10. Integrate test reporting tools (JUnit, Allure, etc.)',
        '11. Document testing strategy and coverage requirements',
        '12. Generate testing stages configuration'
      ],
      outputFormat: 'JSON with testing stages configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['testStages', 'coverageThresholds', 'artifacts'],
      properties: {
        testStages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              testType: { type: 'string' },
              commands: { type: 'array', items: { type: 'string' } },
              parallel: { type: 'boolean' },
              services: { type: 'array', items: { type: 'string' } },
              coverageEnabled: { type: 'boolean' },
              estimatedDuration: { type: 'string' }
            }
          }
        },
        coverageThresholds: {
          type: 'object',
          properties: {
            line: { type: 'number' },
            branch: { type: 'number' },
            function: { type: 'number' },
            statement: { type: 'number' }
          }
        },
        testReporting: {
          type: 'object',
          properties: {
            format: { type: 'string' },
            uploadTo: { type: 'string' },
            retainOnFailure: { type: 'boolean' }
          }
        },
        qualityGates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              threshold: { type: 'number' },
              action: { type: 'string' }
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
  labels: ['devops', 'cicd', 'testing', 'quality-assurance']
}));

// Phase 5: Security Scanning Integration
export const securityScanningTask = defineTask('security-scanning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Security Scanning Integration - ${args.projectName}`,
  agent: {
    name: 'security-engineer',
    prompt: {
      role: 'DevSecOps Security Engineer',
      task: 'Integrate security scanning and vulnerability detection into the pipeline',
      context: {
        projectName: args.projectName,
        cicdPlatform: args.cicdPlatform,
        techStack: args.techStack,
        architectureDesign: args.architectureDesign,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure SAST (Static Application Security Testing) tools',
        '2. Set up dependency vulnerability scanning (Snyk, Dependabot, etc.)',
        '3. Configure container image scanning for vulnerabilities',
        '4. Set up secret detection and credential scanning',
        '5. Configure license compliance checking',
        '6. Define vulnerability severity thresholds and quality gates',
        '7. Set up security findings reporting and tracking',
        '8. Configure DAST (Dynamic Application Security Testing) if applicable',
        '9. Integrate with security dashboards and SIEM',
        '10. Configure security approval workflows for critical findings',
        '11. Document security scanning process and remediation workflow',
        '12. Generate security scanning configuration'
      ],
      outputFormat: 'JSON with security scanning configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['scanTypes', 'qualityGates', 'thresholds', 'artifacts'],
      properties: {
        securityStage: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            scans: { type: 'array', items: { type: 'string' } },
            estimatedDuration: { type: 'string' }
          }
        },
        scanTypes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scanType: { type: 'string' },
              tool: { type: 'string' },
              configuration: { type: 'object' },
              failOnSeverity: { type: 'string' }
            }
          }
        },
        thresholds: {
          type: 'object',
          properties: {
            critical: { type: 'number' },
            high: { type: 'number' },
            medium: { type: 'number' },
            low: { type: 'number' }
          }
        },
        qualityGates: {
          type: 'array',
          items: { type: 'string' }
        },
        reportingIntegration: {
          type: 'object',
          properties: {
            dashboards: { type: 'array', items: { type: 'string' } },
            notifications: { type: 'array', items: { type: 'string' } }
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
  labels: ['devops', 'cicd', 'security', 'devsecops']
}));

// Phase 6: Artifact Management Setup
export const artifactManagementTask = defineTask('artifact-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Artifact Management - ${args.projectName}`,
  agent: {
    name: 'artifact-engineer',
    prompt: {
      role: 'Artifact Management Engineer',
      task: 'Configure artifact repositories and container registries',
      context: {
        projectName: args.projectName,
        cicdPlatform: args.cicdPlatform,
        techStack: args.techStack,
        architectureDesign: args.architectureDesign,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Select and configure artifact repository (Artifactory, Nexus, etc.)',
        '2. Set up container registry (Docker Hub, ECR, GCR, ACR)',
        '3. Configure artifact versioning and tagging strategy',
        '4. Set up artifact promotion across environments',
        '5. Configure artifact retention and cleanup policies',
        '6. Set up artifact signing and verification',
        '7. Configure access control and authentication',
        '8. Set up artifact metadata and provenance tracking',
        '9. Configure artifact scanning and validation',
        '10. Integrate artifact management with deployment stages',
        '11. Document artifact management workflow',
        '12. Generate artifact management configuration'
      ],
      outputFormat: 'JSON with artifact management configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['repositories', 'retentionPolicy', 'artifacts'],
      properties: {
        repositories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              name: { type: 'string' },
              url: { type: 'string' },
              authentication: { type: 'string' }
            }
          }
        },
        registries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              name: { type: 'string' },
              url: { type: 'string' },
              namingConvention: { type: 'string' }
            }
          }
        },
        versioningStrategy: {
          type: 'object',
          properties: {
            scheme: { type: 'string' },
            tagging: { type: 'array', items: { type: 'string' } },
            latest: { type: 'boolean' }
          }
        },
        retentionPolicy: {
          type: 'object',
          properties: {
            keepLatest: { type: 'number' },
            keepDays: { type: 'number' },
            keepTags: { type: 'array', items: { type: 'string' } }
          }
        },
        promotionStrategy: {
          type: 'object',
          properties: {
            dev: { type: 'string' },
            staging: { type: 'string' },
            prod: { type: 'string' }
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
  labels: ['devops', 'cicd', 'artifact-management', 'container-registry']
}));

// Phase 7: Deployment Stage Configuration (per environment)
export const deploymentStageTask = defineTask('deployment-stage', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Deployment Stage Configuration - ${args.environment} - ${args.projectName}`,
  agent: {
    name: 'deployment-engineer',
    prompt: {
      role: 'Deployment Automation Engineer',
      task: `Configure deployment stage for ${args.environment} environment`,
      context: {
        projectName: args.projectName,
        cicdPlatform: args.cicdPlatform,
        environment: args.environment,
        deploymentTarget: args.deploymentTarget,
        techStack: args.techStack,
        architectureDesign: args.architectureDesign,
        artifactManagement: args.artifactManagement,
        outputDir: args.outputDir
      },
      instructions: [
        `1. Configure deployment to ${args.environment} environment`,
        `2. Set up deployment target (Kubernetes, ECS, VM, serverless)`,
        '3. Configure environment-specific variables and secrets',
        '4. Set up pre-deployment validation and smoke tests',
        '5. Configure deployment strategy (rolling, blue-green, canary)',
        '6. Set up health checks and readiness probes',
        '7. Configure post-deployment verification tests',
        '8. Set up deployment rollback on failure',
        '9. Configure deployment notifications and status updates',
        '10. Set up deployment approval gates if required',
        '11. Document deployment process and prerequisites',
        '12. Generate deployment stage configuration'
      ],
      outputFormat: 'JSON with deployment stage configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['deploymentStage', 'deploymentStrategy', 'artifacts'],
      properties: {
        deploymentStage: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            environment: { type: 'string' },
            target: { type: 'string' },
            steps: { type: 'array', items: { type: 'string' } },
            estimatedDuration: { type: 'string' }
          }
        },
        deploymentStrategy: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['rolling', 'blue-green', 'canary', 'recreate'] },
            parameters: { type: 'object' }
          }
        },
        environmentConfig: {
          type: 'object',
          properties: {
            variables: { type: 'array', items: { type: 'string' } },
            secrets: { type: 'array', items: { type: 'string' } },
            replicas: { type: 'number' },
            resources: { type: 'object' }
          }
        },
        validation: {
          type: 'object',
          properties: {
            preDeployment: { type: 'array', items: { type: 'string' } },
            postDeployment: { type: 'array', items: { type: 'string' } },
            healthChecks: { type: 'array', items: { type: 'string' } }
          }
        },
        rollbackConfig: {
          type: 'object',
          properties: {
            automatic: { type: 'boolean' },
            conditions: { type: 'array', items: { type: 'string' } },
            retainVersions: { type: 'number' }
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
  labels: ['devops', 'cicd', 'deployment', args.environment]
}));

// Phase 8: Approval Gates and Notifications
export const approvalGatesTask = defineTask('approval-gates', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Approval Gates and Notifications - ${args.projectName}`,
  agent: {
    name: 'workflow-engineer',
    prompt: {
      role: 'CI/CD Workflow Engineer',
      task: 'Configure approval gates and notification channels',
      context: {
        projectName: args.projectName,
        cicdPlatform: args.cicdPlatform,
        environments: args.environments,
        notificationChannels: args.notificationChannels,
        architectureDesign: args.architectureDesign,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure manual approval gates for production deployments',
        '2. Set up automated approval for lower environments',
        '3. Configure approval group assignments and permissions',
        '4. Set up approval timeout and escalation policies',
        '5. Configure notification channels (email, Slack, Teams, PagerDuty)',
        '6. Set up pipeline status notifications',
        '7. Configure failure and success notifications',
        '8. Set up deployment approval notifications',
        '9. Configure notification routing based on stage and severity',
        '10. Integrate with collaboration tools',
        '11. Document approval workflow and responsibilities',
        '12. Generate approval gates configuration'
      ],
      outputFormat: 'JSON with approval gates and notifications configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['approvalGates', 'notifications', 'gatesConfigured', 'artifacts'],
      properties: {
        approvalGates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stage: { type: 'string' },
              environment: { type: 'string' },
              type: { type: 'string', enum: ['manual', 'automatic'] },
              approvers: { type: 'array', items: { type: 'string' } },
              timeout: { type: 'string' },
              conditions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        notifications: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              channel: { type: 'string' },
              events: { type: 'array', items: { type: 'string' } },
              recipients: { type: 'array', items: { type: 'string' } },
              template: { type: 'string' }
            }
          }
        },
        gatesConfigured: { type: 'boolean' },
        escalationPolicies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              condition: { type: 'string' },
              escalateTo: { type: 'string' },
              afterMinutes: { type: 'number' }
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
  labels: ['devops', 'cicd', 'approvals', 'notifications']
}));

// Phase 9: Rollback and Recovery Strategy
export const rollbackStrategyTask = defineTask('rollback-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Rollback and Recovery Strategy - ${args.projectName}`,
  agent: {
    name: 'reliability-engineer',
    prompt: {
      role: 'Site Reliability Engineer',
      task: 'Design and implement rollback mechanisms and failure recovery',
      context: {
        projectName: args.projectName,
        cicdPlatform: args.cicdPlatform,
        environments: args.environments,
        deploymentTarget: args.deploymentTarget,
        architectureDesign: args.architectureDesign,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design automated rollback triggers based on health checks',
        '2. Configure manual rollback procedures',
        '3. Set up version retention for rollback capability',
        '4. Configure database migration rollback if applicable',
        '5. Set up rollback validation and verification',
        '6. Configure rollback notifications and alerts',
        '7. Design partial rollback strategies (canary rollback)',
        '8. Set up disaster recovery procedures',
        '9. Configure backup and restore mechanisms',
        '10. Document rollback procedures and runbooks',
        '11. Set up rollback testing in lower environments',
        '12. Generate rollback strategy documentation'
      ],
      outputFormat: 'JSON with rollback strategy and recovery procedures'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'rollbackProcedures', 'artifacts'],
      properties: {
        strategy: {
          type: 'object',
          properties: {
            automatic: { type: 'boolean' },
            triggers: { type: 'array', items: { type: 'string' } },
            retentionVersions: { type: 'number' },
            verificationRequired: { type: 'boolean' }
          }
        },
        rollbackProcedures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              environment: { type: 'string' },
              type: { type: 'string', enum: ['automatic', 'manual'] },
              steps: { type: 'array', items: { type: 'string' } },
              estimatedDuration: { type: 'string' },
              prerequisites: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        healthCheckConfiguration: {
          type: 'object',
          properties: {
            endpoints: { type: 'array', items: { type: 'string' } },
            thresholds: { type: 'object' },
            frequency: { type: 'string' }
          }
        },
        disasterRecovery: {
          type: 'object',
          properties: {
            backupStrategy: { type: 'string' },
            rto: { type: 'string', description: 'Recovery Time Objective' },
            rpo: { type: 'string', description: 'Recovery Point Objective' },
            procedures: { type: 'array', items: { type: 'string' } }
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
  labels: ['devops', 'cicd', 'rollback', 'disaster-recovery']
}));

// Phase 10: Pipeline Optimization
export const pipelineOptimizationTask = defineTask('pipeline-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Pipeline Optimization - ${args.projectName}`,
  agent: {
    name: 'performance-engineer',
    prompt: {
      role: 'Pipeline Performance Engineer',
      task: 'Optimize pipeline for speed, efficiency, and resource utilization',
      context: {
        projectName: args.projectName,
        cicdPlatform: args.cicdPlatform,
        architectureDesign: args.architectureDesign,
        buildConfig: args.buildConfig,
        testingStagesConfig: args.testingStagesConfig,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Analyze pipeline bottlenecks and execution times',
        '2. Optimize dependency caching strategies',
        '3. Configure parallel job execution',
        '4. Optimize Docker layer caching and multi-stage builds',
        '5. Configure test sharding and parallelization',
        '6. Optimize artifact upload and download',
        '7. Configure conditional stage execution',
        '8. Optimize runner selection and resource allocation',
        '9. Implement incremental builds and testing',
        '10. Configure pipeline concurrency limits',
        '11. Calculate estimated speedup from optimizations',
        '12. Generate optimization recommendations'
      ],
      outputFormat: 'JSON with optimization configuration and metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['parallelizationEnabled', 'cachingStrategies', 'estimatedSpeedup', 'artifacts'],
      properties: {
        parallelizationEnabled: { type: 'boolean' },
        parallelJobs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stageName: { type: 'string' },
              parallelCount: { type: 'number' },
              strategy: { type: 'string' }
            }
          }
        },
        cachingStrategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              scope: { type: 'string' },
              estimatedSavings: { type: 'string' }
            }
          }
        },
        optimizations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              optimization: { type: 'string' },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] },
              implementationEffort: { type: 'string', enum: ['low', 'medium', 'high'] }
            }
          }
        },
        estimatedSpeedup: {
          type: 'string',
          description: 'Estimated pipeline execution time improvement'
        },
        resourceOptimization: {
          type: 'object',
          properties: {
            cpuUtilization: { type: 'string' },
            memoryUtilization: { type: 'string' },
            costSavings: { type: 'string' }
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
  labels: ['devops', 'cicd', 'optimization', 'performance']
}));

// Phase 11: Pipeline Monitoring Setup
export const pipelineMonitoringTask = defineTask('pipeline-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Pipeline Monitoring - ${args.projectName}`,
  agent: {
    name: 'monitoring-engineer',
    prompt: {
      role: 'Monitoring and Observability Engineer',
      task: 'Set up comprehensive pipeline monitoring and metrics collection',
      context: {
        projectName: args.projectName,
        cicdPlatform: args.cicdPlatform,
        environments: args.environments,
        architectureDesign: args.architectureDesign,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Set up pipeline execution metrics (duration, success rate, failure rate)',
        '2. Configure stage-level metrics and performance tracking',
        '3. Set up deployment frequency and lead time metrics',
        '4. Configure DORA metrics (deployment frequency, lead time, MTTR, change failure rate)',
        '5. Set up alerting for pipeline failures and anomalies',
        '6. Create pipeline dashboards with Grafana or similar',
        '7. Configure log aggregation and analysis',
        '8. Set up trend analysis and reporting',
        '9. Configure SLO tracking for pipeline performance',
        '10. Integrate with observability platforms',
        '11. Document monitoring setup and alert procedures',
        '12. Generate monitoring configuration'
      ],
      outputFormat: 'JSON with monitoring configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['metricsEnabled', 'alerts', 'artifacts'],
      properties: {
        metricsEnabled: { type: 'boolean' },
        metrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              aggregation: { type: 'string' },
              dimensions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        doraMetrics: {
          type: 'object',
          properties: {
            deploymentFrequency: { type: 'boolean' },
            leadTime: { type: 'boolean' },
            mttr: { type: 'boolean' },
            changeFailureRate: { type: 'boolean' }
          }
        },
        dashboardUrl: { type: 'string' },
        alerts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              condition: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'warning', 'info'] },
              channels: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        logAggregation: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            platform: { type: 'string' },
            retention: { type: 'string' }
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
  labels: ['devops', 'cicd', 'monitoring', 'observability']
}));

// Phase 12: Documentation Generation
export const documentationGenerationTask = defineTask('documentation-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Documentation Generation - ${args.projectName}`,
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'DevOps Technical Writer',
      task: 'Generate comprehensive CI/CD pipeline documentation',
      context: {
        projectName: args.projectName,
        cicdPlatform: args.cicdPlatform,
        requirementsAnalysis: args.requirementsAnalysis,
        architectureDesign: args.architectureDesign,
        buildConfig: args.buildConfig,
        testingStagesConfig: args.testingStagesConfig,
        securityIntegration: args.securityIntegration,
        artifactManagement: args.artifactManagement,
        deploymentConfigs: args.deploymentConfigs,
        approvalGatesConfig: args.approvalGatesConfig,
        rollbackStrategy: args.rollbackStrategy,
        optimizationConfig: args.optimizationConfig,
        monitoringSetup: args.monitoringSetup,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create comprehensive README with pipeline overview',
        '2. Document pipeline architecture with diagrams',
        '3. Document each pipeline stage and its purpose',
        '4. Create deployment runbook with step-by-step procedures',
        '5. Document environment configurations and variables',
        '6. Create troubleshooting guide for common issues',
        '7. Document rollback procedures',
        '8. Create security scanning guide and remediation workflow',
        '9. Document monitoring and alerting setup',
        '10. Create onboarding guide for new team members',
        '11. Document maintenance procedures',
        '12. Generate all documentation artifacts'
      ],
      outputFormat: 'JSON with documentation file paths'
    },
    outputSchema: {
      type: 'object',
      required: ['readmePath', 'architecturePath', 'runbookPath', 'artifacts'],
      properties: {
        readmePath: { type: 'string' },
        architecturePath: { type: 'string' },
        runbookPath: { type: 'string' },
        troubleshootingPath: { type: 'string' },
        securityGuidePath: { type: 'string' },
        onboardingGuidePath: { type: 'string' },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              filePath: { type: 'string' },
              format: { type: 'string' }
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
  labels: ['devops', 'cicd', 'documentation']
}));

// Phase 13: Pipeline Validation and Testing
export const pipelineValidationTask = defineTask('pipeline-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Pipeline Validation - ${args.projectName}`,
  agent: {
    name: 'qa-engineer',
    prompt: {
      role: 'DevOps QA Engineer',
      task: 'Validate pipeline configuration and run test execution',
      context: {
        projectName: args.projectName,
        cicdPlatform: args.cicdPlatform,
        architectureDesign: args.architectureDesign,
        buildConfig: args.buildConfig,
        testingStagesConfig: args.testingStagesConfig,
        securityIntegration: args.securityIntegration,
        deploymentConfigs: args.deploymentConfigs,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Validate pipeline configuration syntax',
        '2. Check all required variables and secrets are defined',
        '3. Validate stage dependencies and execution order',
        '4. Verify all deployment targets are correctly configured',
        '5. Validate security scanning configuration',
        '6. Check approval gates and notification setup',
        '7. Validate artifact management configuration',
        '8. Run pipeline dry-run or validation mode if supported',
        '9. Verify rollback configuration',
        '10. Check monitoring and alerting setup',
        '11. Calculate overall validation score (0-100)',
        '12. Generate validation report with recommendations'
      ],
      outputFormat: 'JSON with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'passedChecks', 'failedChecks', 'artifacts'],
      properties: {
        overallScore: {
          type: 'number',
          minimum: 0,
          maximum: 100
        },
        passedChecks: {
          type: 'array',
          items: { type: 'string' }
        },
        failedChecks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              check: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              issue: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        warnings: {
          type: 'array',
          items: { type: 'string' }
        },
        recommendations: {
          type: 'array',
          items: { type: 'string' }
        },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['devops', 'cicd', 'validation', 'quality-assurance']
}));

// Phase 14: Final Review and Deployment
export const finalReviewTask = defineTask('final-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 14: Final Review - ${args.projectName}`,
  agent: {
    name: 'devops-lead',
    prompt: {
      role: 'DevOps Team Lead',
      task: 'Conduct final review and prepare for pipeline deployment',
      context: {
        projectName: args.projectName,
        cicdPlatform: args.cicdPlatform,
        requirementsAnalysis: args.requirementsAnalysis,
        architectureDesign: args.architectureDesign,
        securityIntegration: args.securityIntegration,
        deploymentConfigs: args.deploymentConfigs,
        documentation: args.documentation,
        validationResult: args.validationResult,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Review all pipeline components and configurations',
        '2. Verify all quality gates and validation checks passed',
        '3. Review security scanning configuration and thresholds',
        '4. Verify deployment configurations for all environments',
        '5. Review approval gates and notification setup',
        '6. Check documentation completeness',
        '7. Create deployment checklist',
        '8. Define next steps for pipeline activation',
        '9. Identify training needs for the team',
        '10. Create handoff documentation',
        '11. Define success criteria for first deployment',
        '12. Generate final review report'
      ],
      outputFormat: 'JSON with final review and next steps'
    },
    outputSchema: {
      type: 'object',
      required: ['nextSteps', 'deploymentChecklist', 'deploymentGuidePath', 'artifacts'],
      properties: {
        nextSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'string' },
              owner: { type: 'string' },
              priority: { type: 'string', enum: ['immediate', 'high', 'medium', 'low'] },
              estimatedDuration: { type: 'string' }
            }
          }
        },
        deploymentChecklist: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              item: { type: 'string' },
              completed: { type: 'boolean' },
              responsible: { type: 'string' }
            }
          }
        },
        successCriteria: {
          type: 'array',
          items: { type: 'string' }
        },
        trainingNeeds: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              topic: { type: 'string' },
              audience: { type: 'string' },
              duration: { type: 'string' }
            }
          }
        },
        deploymentGuidePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['devops', 'cicd', 'final-review', 'deployment']
}));
