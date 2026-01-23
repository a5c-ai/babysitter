/**
 * @process specializations/qa-testing-automation/environment-management
 * @description Test Environment Management - Establish robust test environment management with
 * infrastructure as code, containerization, environment provisioning automation, and environment
 * parity with production. Includes automated provisioning, monitoring, data seeding, and service mocking.
 * @inputs { projectName: string, infrastructurePlatform: string, applicationArchitecture: object, securityRequirements?: object, costConstraints?: object }
 * @outputs { success: boolean, environmentsProvisioned: number, infrastructureTemplates: object, provisioningTime: number, monitoringConfigured: boolean }
 *
 * @example
 * const result = await orchestrate('specializations/qa-testing-automation/environment-management', {
 *   projectName: 'ecommerce-platform',
 *   infrastructurePlatform: 'aws',
 *   applicationArchitecture: {
 *     services: ['api', 'frontend', 'worker', 'database', 'cache'],
 *     dependencies: ['auth-service', 'payment-gateway', 'email-service']
 *   },
 *   securityRequirements: {
 *     encryption: true,
 *     accessControl: 'rbac',
 *     networkIsolation: true
 *   },
 *   costConstraints: {
 *     maxMonthlyCost: 5000,
 *     autoShutdown: true
 *   }
 * });
 *
 * @references
 * - Infrastructure as Code: https://www.terraform.io/intro
 * - Test Environment Best Practices: https://martinfowler.com/articles/continuousIntegration.html
 * - Environment Parity: https://12factor.net/dev-prod-parity
 * - Docker Best Practices: https://docs.docker.com/develop/dev-best-practices/
 * - Environment Monitoring: https://sre.google/workbook/monitoring/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    infrastructurePlatform = 'aws',
    applicationArchitecture = {},
    securityRequirements = {
      encryption: true,
      accessControl: 'rbac',
      networkIsolation: false
    },
    costConstraints = {
      maxMonthlyCost: 10000,
      autoShutdown: false,
      useSpotInstances: false
    },
    environments = ['development', 'staging', 'qa', 'integration'],
    targetProvisioningTime = 900 // 15 minutes in seconds
  } = inputs;

  const startTime = ctx.now();
  const provisionedEnvironments = [];

  ctx.log('info', `Starting test environment management for ${projectName}`);

  // ============================================================================
  // PHASE 1: REQUIREMENTS AND ARCHITECTURE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Requirements and architecture analysis');

  // Task 1.1: Environment Requirements Definition
  const environmentRequirements = await ctx.task(environmentRequirementsTask, {
    projectName,
    applicationArchitecture,
    environments,
    securityRequirements,
    costConstraints
  });

  // Task 1.2: Infrastructure Platform Assessment
  const platformAssessment = await ctx.task(platformAssessmentTask, {
    infrastructurePlatform,
    environmentRequirements: environmentRequirements.requirements,
    applicationArchitecture,
    costConstraints
  });

  // Task 1.3: Environment Architecture Design
  const architectureDesign = await ctx.task(architectureDesignTask, {
    projectName,
    platformAssessment,
    environmentRequirements: environmentRequirements.requirements,
    applicationArchitecture,
    securityRequirements
  });

  // Breakpoint: Review environment architecture
  await ctx.breakpoint({
    question: `Environment architecture designed for ${projectName}. ${environments.length} environments planned on ${infrastructurePlatform}. Review and approve architecture?`,
    title: 'Environment Architecture Review',
    context: {
      runId: ctx.runId,
      projectName,
      environments,
      platform: infrastructurePlatform,
      files: [
        { path: `artifacts/environment-requirements.json`, format: 'json' },
        { path: `artifacts/architecture-design.json`, format: 'json' },
        { path: `artifacts/architecture-diagram.md`, format: 'markdown' }
      ]
    }
  });

  // ============================================================================
  // PHASE 2: INFRASTRUCTURE AS CODE IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Infrastructure as Code implementation');

  // Task 2.1: IaC Template Generation
  const iacTemplates = await ctx.task(iacTemplateGenerationTask, {
    projectName,
    infrastructurePlatform,
    architectureDesign,
    environmentRequirements: environmentRequirements.requirements,
    environments
  });

  // Task 2.2: Network Configuration
  const networkConfig = await ctx.task(networkConfigurationTask, {
    projectName,
    infrastructurePlatform,
    securityRequirements,
    architectureDesign,
    environments
  });

  // Task 2.3: Security Configuration
  const securityConfig = await ctx.task(securityConfigurationTask, {
    projectName,
    securityRequirements,
    networkConfig,
    infrastructurePlatform,
    environments
  });

  // Task 2.4: IaC Validation and Testing
  const iacValidation = await ctx.task(iacValidationTask, {
    projectName,
    iacTemplates,
    networkConfig,
    securityConfig,
    infrastructurePlatform
  });

  if (!iacValidation.valid) {
    ctx.log('error', 'IaC validation failed. Cannot proceed with provisioning.');
    return {
      success: false,
      error: 'Infrastructure as Code validation failed',
      validationErrors: iacValidation.errors,
      phase: 'iac-implementation',
      metadata: {
        processId: 'specializations/qa-testing-automation/environment-management',
        timestamp: startTime,
        projectName
      }
    };
  }

  // Breakpoint: Review IaC templates before provisioning
  await ctx.breakpoint({
    question: `Infrastructure as Code templates created and validated for ${projectName}. Review templates before environment provisioning?`,
    title: 'IaC Templates Review',
    context: {
      runId: ctx.runId,
      projectName,
      platform: infrastructurePlatform,
      validation: iacValidation,
      files: [
        { path: `artifacts/iac-templates.zip`, format: 'archive', label: 'IaC Templates' },
        { path: `artifacts/network-config.json`, format: 'json' },
        { path: `artifacts/security-config.json`, format: 'json' },
        { path: `artifacts/iac-validation-report.md`, format: 'markdown' }
      ]
    }
  });

  // ============================================================================
  // PHASE 3: CONTAINERIZATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Application containerization');

  // Task 3.1: Docker Configuration
  const dockerConfig = await ctx.task(dockerConfigurationTask, {
    projectName,
    applicationArchitecture,
    environmentRequirements: environmentRequirements.requirements
  });

  // Task 3.2: Docker Compose Setup
  const dockerComposeConfig = await ctx.task(dockerComposeSetupTask, {
    projectName,
    applicationArchitecture,
    dockerConfig,
    environments
  });

  // Task 3.3: Container Registry Setup
  const containerRegistry = await ctx.task(containerRegistrySetupTask, {
    projectName,
    infrastructurePlatform,
    dockerConfig,
    securityRequirements
  });

  // Task 3.4: Container Image Build and Push
  const containerImages = await ctx.task(containerImageBuildTask, {
    projectName,
    dockerConfig,
    containerRegistry,
    applicationArchitecture
  });

  ctx.log('info', `Container images built and pushed: ${containerImages.imagesBuilt} images`);

  // ============================================================================
  // PHASE 4: ENVIRONMENT PROVISIONING
  // ============================================================================

  ctx.log('info', 'Phase 4: Automated environment provisioning');

  for (let i = 0; i < environments.length; i++) {
    const environmentName = environments[i];
    ctx.log('info', `Provisioning environment: ${environmentName}`);

    const provisionStartTime = ctx.now();

    // Task 4.1: Environment Provisioning
    const provisionResult = await ctx.task(environmentProvisioningTask, {
      projectName,
      environmentName,
      iacTemplates,
      networkConfig,
      securityConfig,
      containerImages,
      infrastructurePlatform
    });

    if (!provisionResult.success) {
      ctx.log('error', `Failed to provision ${environmentName} environment`);

      // Breakpoint: Provisioning failure
      await ctx.breakpoint({
        question: `Failed to provision ${environmentName} environment. Review errors and retry or skip?`,
        title: `Environment Provisioning Failed - ${environmentName}`,
        context: {
          runId: ctx.runId,
          environmentName,
          errors: provisionResult.errors,
          files: [
            { path: `artifacts/${environmentName}-provisioning-error.json`, format: 'json' }
          ]
        }
      });

      continue;
    }

    const provisionDuration = ctx.now() - provisionStartTime;

    // Task 4.2: Environment Health Check
    const healthCheck = await ctx.task(environmentHealthCheckTask, {
      projectName,
      environmentName,
      provisionResult,
      applicationArchitecture
    });

    provisionedEnvironments.push({
      name: environmentName,
      provisionDuration,
      endpoints: provisionResult.endpoints,
      healthStatus: healthCheck.status,
      resources: provisionResult.resources
    });

    ctx.log('info', `Environment ${environmentName} provisioned in ${provisionDuration}ms. Health: ${healthCheck.status}`);

    // Check if provisioning time meets target
    if (provisionDuration > targetProvisioningTime * 1000) {
      ctx.log('warn', `Provisioning time ${provisionDuration}ms exceeds target ${targetProvisioningTime * 1000}ms`);
    }
  }

  // Breakpoint: Review provisioned environments
  await ctx.breakpoint({
    question: `${provisionedEnvironments.length}/${environments.length} environments provisioned successfully. Review environment details and proceed?`,
    title: 'Environment Provisioning Complete',
    context: {
      runId: ctx.runId,
      projectName,
      provisionedCount: provisionedEnvironments.length,
      totalCount: environments.length,
      environments: provisionedEnvironments,
      files: [
        { path: `artifacts/provisioned-environments.json`, format: 'json' },
        { path: `artifacts/provisioning-summary.md`, format: 'markdown' }
      ]
    }
  });

  // ============================================================================
  // PHASE 5: TEST DATA MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Test data management setup');

  // Task 5.1: Test Data Strategy Definition
  const dataStrategy = await ctx.task(testDataStrategyTask, {
    projectName,
    applicationArchitecture,
    environments: provisionedEnvironments
  });

  // Task 5.2: Data Generation Scripts
  const dataGeneration = await ctx.task(dataGenerationScriptsTask, {
    projectName,
    dataStrategy,
    applicationArchitecture
  });

  // Task 5.3: Data Seeding Automation
  const dataSeedingResults = await ctx.task(dataSeedingAutomationTask, {
    projectName,
    environments: provisionedEnvironments,
    dataGeneration,
    dataStrategy
  });

  ctx.log('info', `Test data seeded in ${dataSeedingResults.environmentsSeeded} environments`);

  // ============================================================================
  // PHASE 6: SERVICE MOCKING SETUP
  // ============================================================================

  ctx.log('info', 'Phase 6: Service mocking setup');

  // Task 6.1: Dependency Analysis
  const dependencyAnalysis = await ctx.task(dependencyAnalysisTask, {
    projectName,
    applicationArchitecture,
    environments: provisionedEnvironments
  });

  // Task 6.2: Mock Service Implementation
  const mockServices = await ctx.task(mockServiceImplementationTask, {
    projectName,
    dependencyAnalysis,
    environments: provisionedEnvironments
  });

  // Task 6.3: Mock Service Deployment
  const mockDeployment = await ctx.task(mockServiceDeploymentTask, {
    projectName,
    mockServices,
    environments: provisionedEnvironments,
    infrastructurePlatform
  });

  ctx.log('info', `Mock services deployed: ${mockDeployment.servicesDeployed} services across environments`);

  // ============================================================================
  // PHASE 7: MONITORING AND OBSERVABILITY
  // ============================================================================

  ctx.log('info', 'Phase 7: Monitoring and observability setup');

  // Task 7.1: Monitoring Configuration
  const monitoringConfig = await ctx.task(monitoringConfigurationTask, {
    projectName,
    environments: provisionedEnvironments,
    infrastructurePlatform,
    applicationArchitecture
  });

  // Task 7.2: Logging Setup
  const loggingSetup = await ctx.task(loggingSetupTask, {
    projectName,
    environments: provisionedEnvironments,
    infrastructurePlatform,
    monitoringConfig
  });

  // Task 7.3: Alerting Configuration
  const alertingConfig = await ctx.task(alertingConfigurationTask, {
    projectName,
    environments: provisionedEnvironments,
    monitoringConfig,
    loggingSetup
  });

  // Task 7.4: Monitoring Validation
  const monitoringValidation = await ctx.task(monitoringValidationTask, {
    projectName,
    environments: provisionedEnvironments,
    monitoringConfig,
    loggingSetup,
    alertingConfig
  });

  ctx.log('info', `Monitoring configured and validated for all environments`);

  // ============================================================================
  // PHASE 8: ACCESS CONTROL AND SECURITY
  // ============================================================================

  ctx.log('info', 'Phase 8: Access control and security implementation');

  // Task 8.1: Access Control Setup
  const accessControl = await ctx.task(accessControlSetupTask, {
    projectName,
    environments: provisionedEnvironments,
    securityRequirements,
    infrastructurePlatform
  });

  // Task 8.2: Security Hardening
  const securityHardening = await ctx.task(securityHardeningTask, {
    projectName,
    environments: provisionedEnvironments,
    securityRequirements,
    accessControl
  });

  // Task 8.3: Security Audit
  const securityAudit = await ctx.task(securityAuditTask, {
    projectName,
    environments: provisionedEnvironments,
    securityRequirements,
    securityHardening,
    accessControl
  });

  if (securityAudit.criticalIssues > 0) {
    await ctx.breakpoint({
      question: `Security audit found ${securityAudit.criticalIssues} critical issues. Review and remediate before proceeding?`,
      title: 'Security Audit - Critical Issues Found',
      context: {
        runId: ctx.runId,
        projectName,
        criticalIssues: securityAudit.criticalIssues,
        findings: securityAudit.findings,
        files: [
          { path: `artifacts/security-audit-report.json`, format: 'json' },
          { path: `artifacts/security-audit-report.md`, format: 'markdown' }
        ]
      }
    });
  }

  // ============================================================================
  // PHASE 9: ENVIRONMENT PARITY VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Environment parity validation');

  // Task 9.1: Parity Check
  const parityCheck = await ctx.task(environmentParityCheckTask, {
    projectName,
    environments: provisionedEnvironments,
    applicationArchitecture,
    infrastructurePlatform
  });

  // Task 9.2: Configuration Drift Detection
  const driftDetection = await ctx.task(configurationDriftDetectionTask, {
    projectName,
    environments: provisionedEnvironments,
    iacTemplates,
    parityCheck
  });

  if (driftDetection.driftDetected) {
    ctx.log('warn', `Configuration drift detected in ${driftDetection.driftedEnvironments.length} environments`);

    await ctx.breakpoint({
      question: `Configuration drift detected. Review drift and remediate?`,
      title: 'Configuration Drift Detected',
      context: {
        runId: ctx.runId,
        projectName,
        driftedEnvironments: driftDetection.driftedEnvironments,
        files: [
          { path: `artifacts/drift-report.json`, format: 'json' }
        ]
      }
    });
  }

  // ============================================================================
  // PHASE 10: AUTOMATION AND DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Automation scripts and documentation');

  // Task 10.1: Provisioning Scripts
  const provisioningScripts = await ctx.task(provisioningScriptsTask, {
    projectName,
    iacTemplates,
    environments: provisionedEnvironments,
    infrastructurePlatform
  });

  // Task 10.2: Environment Management Scripts
  const managementScripts = await ctx.task(environmentManagementScriptsTask, {
    projectName,
    environments: provisionedEnvironments,
    provisioningScripts,
    costConstraints
  });

  // Task 10.3: Documentation Generation
  const documentation = await ctx.task(documentationGenerationTask, {
    projectName,
    environments: provisionedEnvironments,
    iacTemplates,
    architectureDesign,
    monitoringConfig,
    accessControl,
    provisioningScripts,
    managementScripts
  });

  // Task 10.4: Runbook Creation
  const runbook = await ctx.task(runbookCreationTask, {
    projectName,
    environments: provisionedEnvironments,
    documentation,
    managementScripts,
    troubleshootingGuides: securityAudit.remediationGuide
  });

  // ============================================================================
  // PHASE 11: FINAL VALIDATION AND HANDOFF
  // ============================================================================

  ctx.log('info', 'Phase 11: Final validation and handoff');

  // Task 11.1: End-to-End Environment Test
  const e2eTest = await ctx.task(endToEndEnvironmentTestTask, {
    projectName,
    environments: provisionedEnvironments,
    applicationArchitecture,
    mockServices: mockDeployment
  });

  // Task 11.2: Performance Baseline
  const performanceBaseline = await ctx.task(performanceBaselineTask, {
    projectName,
    environments: provisionedEnvironments,
    targetProvisioningTime
  });

  // Task 11.3: Cost Analysis
  const costAnalysis = await ctx.task(costAnalysisTask, {
    projectName,
    environments: provisionedEnvironments,
    infrastructurePlatform,
    costConstraints
  });

  if (costAnalysis.projectedMonthlyCost > costConstraints.maxMonthlyCost) {
    await ctx.breakpoint({
      question: `Projected monthly cost (${costAnalysis.projectedMonthlyCost}) exceeds budget (${costConstraints.maxMonthlyCost}). Review and optimize?`,
      title: 'Cost Budget Exceeded',
      context: {
        runId: ctx.runId,
        projectName,
        projected: costAnalysis.projectedMonthlyCost,
        budget: costConstraints.maxMonthlyCost,
        breakdown: costAnalysis.costBreakdown,
        files: [
          { path: `artifacts/cost-analysis.json`, format: 'json' }
        ]
      }
    });
  }

  // Task 11.4: Final Report Generation
  const finalReport = await ctx.task(finalReportGenerationTask, {
    projectName,
    environments: provisionedEnvironments,
    e2eTest,
    performanceBaseline,
    costAnalysis,
    monitoringValidation,
    securityAudit,
    parityCheck,
    documentation,
    runbook
  });

  // Final Breakpoint: Environment management complete
  await ctx.breakpoint({
    question: `Test environment management complete for ${projectName}. ${provisionedEnvironments.length} environments provisioned and validated. Review final report and approve for team handoff?`,
    title: 'Environment Management Complete',
    context: {
      runId: ctx.runId,
      projectName,
      environmentCount: provisionedEnvironments.length,
      avgProvisioningTime: provisionedEnvironments.reduce((sum, env) => sum + env.provisionDuration, 0) / provisionedEnvironments.length,
      monitoringConfigured: monitoringValidation.allSystemsOperational,
      securityCompliant: securityAudit.criticalIssues === 0,
      costProjection: costAnalysis.projectedMonthlyCost,
      files: [
        { path: `artifacts/final-report.md`, format: 'markdown' },
        { path: `artifacts/final-report.json`, format: 'json' },
        { path: `artifacts/environment-runbook.md`, format: 'markdown' },
        { path: `artifacts/cost-analysis.json`, format: 'json' }
      ]
    }
  });

  const endTime = ctx.now();
  const totalDuration = endTime - startTime;

  return {
    success: true,
    projectName,
    environmentsProvisioned: provisionedEnvironments.length,
    environments: provisionedEnvironments,
    infrastructureTemplates: {
      iacTemplates: iacTemplates.templatesGenerated,
      dockerfiles: dockerConfig.dockerfilesCreated,
      dockerCompose: dockerComposeConfig.composeFilesCreated
    },
    averageProvisioningTime: provisionedEnvironments.reduce((sum, env) => sum + env.provisionDuration, 0) / provisionedEnvironments.length,
    targetMet: provisionedEnvironments.every(env => env.provisionDuration <= targetProvisioningTime * 1000),
    monitoringConfigured: monitoringValidation.allSystemsOperational,
    securityCompliant: securityAudit.criticalIssues === 0,
    parityValidated: !driftDetection.driftDetected,
    testDataSeeded: dataSeedingResults.environmentsSeeded,
    mockServicesDeployed: mockDeployment.servicesDeployed,
    costProjection: {
      monthlyCost: costAnalysis.projectedMonthlyCost,
      withinBudget: costAnalysis.projectedMonthlyCost <= costConstraints.maxMonthlyCost,
      breakdown: costAnalysis.costBreakdown
    },
    documentation: {
      mainDocumentation: documentation.documentationPath,
      runbook: runbook.runbookPath,
      provisioningScripts: provisioningScripts.scriptsPath,
      managementScripts: managementScripts.scriptsPath
    },
    performance: {
      avgProvisioningTime: performanceBaseline.avgProvisioningTime,
      e2eTestsPassed: e2eTest.testsPassed,
      e2eTestsFailed: e2eTest.testsFailed
    },
    duration: totalDuration,
    metadata: {
      processId: 'specializations/qa-testing-automation/environment-management',
      timestamp: startTime,
      completedAt: endTime,
      infrastructurePlatform,
      environmentsRequested: environments.length
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1.1: Environment Requirements Definition
export const environmentRequirementsTask = defineTask('environment-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Define environment requirements - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'QA Infrastructure Engineer with expertise in test environment management',
      task: 'Define comprehensive environment requirements for test automation',
      context: {
        projectName: args.projectName,
        applicationArchitecture: args.applicationArchitecture,
        environments: args.environments,
        securityRequirements: args.securityRequirements,
        costConstraints: args.costConstraints
      },
      instructions: [
        '1. Analyze application architecture and identify all components (services, databases, caches, queues)',
        '2. Define compute requirements (CPU, memory, storage) for each environment tier',
        '3. Identify external dependencies and integration points',
        '4. Define network requirements (VPC, subnets, load balancers, DNS)',
        '5. Specify data requirements (volume, characteristics, refresh frequency)',
        '6. Define monitoring and observability requirements',
        '7. Document security requirements (encryption, access control, compliance)',
        '8. Define scalability and availability requirements',
        '9. Estimate cost for each environment tier',
        '10. Create environment specification document'
      ],
      outputFormat: 'JSON object with detailed environment requirements and specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements', 'estimatedCost'],
      properties: {
        requirements: {
          type: 'object',
          properties: {
            compute: {
              type: 'object',
              properties: {
                cpu: { type: 'number' },
                memoryGB: { type: 'number' },
                storageGB: { type: 'number' }
              }
            },
            services: { type: 'array', items: { type: 'string' } },
            dependencies: { type: 'array', items: { type: 'string' } },
            network: {
              type: 'object',
              properties: {
                vpcRequired: { type: 'boolean' },
                subnets: { type: 'number' },
                loadBalancer: { type: 'boolean' }
              }
            },
            data: {
              type: 'object',
              properties: {
                volumeGB: { type: 'number' },
                refreshFrequency: { type: 'string' }
              }
            },
            monitoring: { type: 'array', items: { type: 'string' } },
            security: { type: 'object' },
            scalability: {
              type: 'object',
              properties: {
                autoScaling: { type: 'boolean' },
                minInstances: { type: 'number' },
                maxInstances: { type: 'number' }
              }
            }
          }
        },
        estimatedCost: {
          type: 'object',
          properties: {
            perEnvironment: { type: 'number' },
            total: { type: 'number' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['environment-management', 'requirements', 'planning']
}));

// Task 1.2: Infrastructure Platform Assessment
export const platformAssessmentTask = defineTask('platform-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Assess infrastructure platform - ${args.infrastructurePlatform}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cloud Infrastructure Architect',
      task: 'Assess infrastructure platform capabilities and suitability',
      context: {
        infrastructurePlatform: args.infrastructurePlatform,
        environmentRequirements: args.environmentRequirements,
        applicationArchitecture: args.applicationArchitecture,
        costConstraints: args.costConstraints
      },
      instructions: [
        '1. Evaluate platform support for required services and resources',
        '2. Assess IaC tooling options (Terraform, CloudFormation, Pulumi)',
        '3. Evaluate container orchestration options (ECS, EKS, GKE, AKS)',
        '4. Review platform-specific networking capabilities',
        '5. Assess monitoring and logging integrations',
        '6. Evaluate security features and compliance certifications',
        '7. Compare pricing models and cost optimization options',
        '8. Assess availability and reliability SLAs',
        '9. Review platform limitations and workarounds',
        '10. Provide platform-specific recommendations'
      ],
      outputFormat: 'JSON object with platform assessment and recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['suitable', 'recommendations'],
      properties: {
        suitable: { type: 'boolean' },
        platformName: { type: 'string' },
        capabilities: {
          type: 'object',
          properties: {
            computeOptions: { type: 'array', items: { type: 'string' } },
            containerSupport: { type: 'boolean' },
            networkingFeatures: { type: 'array', items: { type: 'string' } },
            monitoringTools: { type: 'array', items: { type: 'string' } },
            securityFeatures: { type: 'array', items: { type: 'string' } }
          }
        },
        recommendedIaC: { type: 'string' },
        recommendedOrchestration: { type: 'string' },
        costEstimate: {
          type: 'object',
          properties: {
            monthlyEstimate: { type: 'number' },
            optimizationOpportunities: { type: 'array', items: { type: 'string' } }
          }
        },
        limitations: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['environment-management', 'platform', 'assessment']
}));

// Task 1.3: Environment Architecture Design
export const architectureDesignTask = defineTask('architecture-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design environment architecture - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Solutions Architect with DevOps expertise',
      task: 'Design comprehensive test environment architecture',
      context: {
        projectName: args.projectName,
        platformAssessment: args.platformAssessment,
        environmentRequirements: args.environmentRequirements,
        applicationArchitecture: args.applicationArchitecture,
        securityRequirements: args.securityRequirements
      },
      instructions: [
        '1. Design network topology (VPCs, subnets, routing)',
        '2. Define compute architecture (containers, VMs, serverless)',
        '3. Design data tier (databases, caches, storage)',
        '4. Plan service mesh and API gateway architecture',
        '5. Design CI/CD integration points',
        '6. Plan monitoring and logging architecture',
        '7. Design security controls (IAM, network policies, encryption)',
        '8. Plan disaster recovery and backup strategy',
        '9. Define environment lifecycle management approach',
        '10. Create architecture diagrams and documentation'
      ],
      outputFormat: 'JSON object with detailed architecture design'
    },
    outputSchema: {
      type: 'object',
      required: ['architecture', 'components'],
      properties: {
        architecture: {
          type: 'object',
          properties: {
            network: { type: 'object' },
            compute: { type: 'object' },
            data: { type: 'object' },
            security: { type: 'object' },
            monitoring: { type: 'object' }
          }
        },
        components: { type: 'array', items: { type: 'object' } },
        integrationPoints: { type: 'array', items: { type: 'string' } },
        architectureDiagram: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['environment-management', 'architecture', 'design']
}));

// Task 2.1: IaC Template Generation
export const iacTemplateGenerationTask = defineTask('iac-template-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate IaC templates - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps Engineer specializing in Infrastructure as Code',
      task: 'Generate Infrastructure as Code templates for all environments',
      context: {
        projectName: args.projectName,
        infrastructurePlatform: args.infrastructurePlatform,
        architectureDesign: args.architectureDesign,
        environmentRequirements: args.environmentRequirements,
        environments: args.environments
      },
      instructions: [
        '1. Choose IaC tool (Terraform, CloudFormation, Pulumi) based on platform',
        '2. Create modular template structure (network, compute, data, security modules)',
        '3. Generate templates for VPC, subnets, routing tables',
        '4. Create compute resource templates (ECS/EKS clusters, EC2, Lambda)',
        '5. Generate database and storage templates',
        '6. Create load balancer and API gateway templates',
        '7. Generate IAM roles and security group templates',
        '8. Create monitoring and logging resource templates',
        '9. Parameterize templates for multiple environments',
        '10. Add documentation and usage examples'
      ],
      outputFormat: 'JSON object with IaC template details and file paths'
    },
    outputSchema: {
      type: 'object',
      required: ['templatesGenerated', 'templateFiles'],
      properties: {
        templatesGenerated: { type: 'number' },
        iacTool: { type: 'string' },
        templateFiles: { type: 'array', items: { type: 'string' } },
        modules: { type: 'array', items: { type: 'string' } },
        parameters: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['environment-management', 'iac', 'templates']
}));

// Task 2.2: Network Configuration
export const networkConfigurationTask = defineTask('network-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure network infrastructure - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Network Engineer with cloud networking expertise',
      task: 'Configure network infrastructure for test environments',
      context: {
        projectName: args.projectName,
        infrastructurePlatform: args.infrastructurePlatform,
        securityRequirements: args.securityRequirements,
        architectureDesign: args.architectureDesign,
        environments: args.environments
      },
      instructions: [
        '1. Design VPC/VNet structure with appropriate CIDR blocks',
        '2. Configure public and private subnets',
        '3. Setup internet gateways and NAT gateways',
        '4. Configure route tables and routing',
        '5. Setup security groups and network ACLs',
        '6. Configure VPC peering or transit gateway if needed',
        '7. Setup DNS and service discovery',
        '8. Configure load balancers (ALB/NLB)',
        '9. Setup VPN or private connectivity if required',
        '10. Document network architecture and IP allocation'
      ],
      outputFormat: 'JSON object with network configuration details'
    },
    outputSchema: {
      type: 'object',
      required: ['networkConfigured', 'vpcId'],
      properties: {
        networkConfigured: { type: 'boolean' },
        vpcId: { type: 'string' },
        cidrBlock: { type: 'string' },
        subnets: { type: 'array', items: { type: 'object' } },
        securityGroups: { type: 'array', items: { type: 'object' } },
        loadBalancers: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['environment-management', 'network', 'infrastructure']
}));

// Task 2.3: Security Configuration
export const securityConfigurationTask = defineTask('security-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure security controls - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Engineer with cloud security expertise',
      task: 'Configure security controls for test environments',
      context: {
        projectName: args.projectName,
        securityRequirements: args.securityRequirements,
        networkConfig: args.networkConfig,
        infrastructurePlatform: args.infrastructurePlatform,
        environments: args.environments
      },
      instructions: [
        '1. Configure IAM roles and policies with least privilege',
        '2. Setup encryption at rest and in transit',
        '3. Configure security groups with minimal required access',
        '4. Setup secrets management (AWS Secrets Manager, Azure Key Vault)',
        '5. Configure logging and audit trails',
        '6. Setup WAF rules if web-facing',
        '7. Configure vulnerability scanning',
        '8. Setup compliance monitoring (CIS benchmarks)',
        '9. Configure backup and disaster recovery',
        '10. Document security controls and compliance posture'
      ],
      outputFormat: 'JSON object with security configuration details'
    },
    outputSchema: {
      type: 'object',
      required: ['securityConfigured', 'iamRoles'],
      properties: {
        securityConfigured: { type: 'boolean' },
        iamRoles: { type: 'array', items: { type: 'object' } },
        encryptionEnabled: { type: 'boolean' },
        secretsManager: { type: 'string' },
        loggingEnabled: { type: 'boolean' },
        wafConfigured: { type: 'boolean' },
        complianceControls: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['environment-management', 'security', 'configuration']
}));

// Task 2.4: IaC Validation
export const iacValidationTask = defineTask('iac-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate IaC templates - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps Engineer with IaC expertise',
      task: 'Validate Infrastructure as Code templates',
      context: {
        projectName: args.projectName,
        iacTemplates: args.iacTemplates,
        networkConfig: args.networkConfig,
        securityConfig: args.securityConfig,
        infrastructurePlatform: args.infrastructurePlatform
      },
      instructions: [
        '1. Run IaC syntax validation (terraform validate, cfn-lint)',
        '2. Perform static analysis with security scanning (tfsec, checkov)',
        '3. Validate template parameters and variables',
        '4. Check for common misconfigurations',
        '5. Validate resource naming conventions',
        '6. Check for cost optimization opportunities',
        '7. Validate network configuration consistency',
        '8. Verify security best practices compliance',
        '9. Perform dry-run/plan to check for errors',
        '10. Generate validation report with findings'
      ],
      outputFormat: 'JSON object with validation results and any errors'
    },
    outputSchema: {
      type: 'object',
      required: ['valid', 'errors'],
      properties: {
        valid: { type: 'boolean' },
        syntaxValid: { type: 'boolean' },
        securityIssues: { type: 'array', items: { type: 'object' } },
        warnings: { type: 'array', items: { type: 'string' } },
        errors: { type: 'array', items: { type: 'string' } },
        suggestions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['environment-management', 'iac', 'validation']
}));

// Task 3.1: Docker Configuration
export const dockerConfigurationTask = defineTask('docker-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create Docker configurations - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps Engineer with containerization expertise',
      task: 'Create Docker configurations for all application services',
      context: {
        projectName: args.projectName,
        applicationArchitecture: args.applicationArchitecture,
        environmentRequirements: args.environmentRequirements
      },
      instructions: [
        '1. Analyze application services and dependencies',
        '2. Create optimized Dockerfiles for each service',
        '3. Use multi-stage builds for size optimization',
        '4. Configure health checks in Dockerfiles',
        '5. Set appropriate base images and versions',
        '6. Configure environment variables and secrets',
        '7. Optimize layer caching for build speed',
        '8. Add security scanning in build process',
        '9. Create .dockerignore files',
        '10. Document Docker build and run instructions'
      ],
      outputFormat: 'JSON object with Docker configuration details'
    },
    outputSchema: {
      type: 'object',
      required: ['dockerfilesCreated', 'services'],
      properties: {
        dockerfilesCreated: { type: 'number' },
        services: { type: 'array', items: { type: 'object' } },
        baseImages: { type: 'object' },
        optimizations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['environment-management', 'docker', 'containerization']
}));

// Task 3.2: Docker Compose Setup
export const dockerComposeSetupTask = defineTask('docker-compose-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Docker Compose - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps Engineer',
      task: 'Create Docker Compose configurations for local and CI environments',
      context: {
        projectName: args.projectName,
        applicationArchitecture: args.applicationArchitecture,
        dockerConfig: args.dockerConfig,
        environments: args.environments
      },
      instructions: [
        '1. Create docker-compose.yml for all services',
        '2. Configure service networking and dependencies',
        '3. Setup volume mounts for persistent data',
        '4. Configure environment-specific overrides',
        '5. Add health checks and restart policies',
        '6. Configure resource limits (CPU, memory)',
        '7. Setup development hot-reload capabilities',
        '8. Create separate compose files for different environments',
        '9. Document compose usage and commands',
        '10. Test compose configurations locally'
      ],
      outputFormat: 'JSON object with Docker Compose configuration details'
    },
    outputSchema: {
      type: 'object',
      required: ['composeFilesCreated', 'services'],
      properties: {
        composeFilesCreated: { type: 'number' },
        services: { type: 'array', items: { type: 'string' } },
        networks: { type: 'array', items: { type: 'string' } },
        volumes: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['environment-management', 'docker-compose', 'containerization']
}));

// Task 3.3: Container Registry Setup
export const containerRegistrySetupTask = defineTask('container-registry-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup container registry - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps Engineer',
      task: 'Setup and configure container registry',
      context: {
        projectName: args.projectName,
        infrastructurePlatform: args.infrastructurePlatform,
        dockerConfig: args.dockerConfig,
        securityRequirements: args.securityRequirements
      },
      instructions: [
        '1. Create container registry (ECR, ACR, GCR, or Docker Hub)',
        '2. Configure registry access policies and IAM',
        '3. Setup image scanning for vulnerabilities',
        '4. Configure image lifecycle policies (retention)',
        '5. Setup image signing and verification',
        '6. Configure registry replication if needed',
        '7. Setup CI/CD integration for pushing images',
        '8. Create repository for each service',
        '9. Configure image tagging strategy',
        '10. Document registry usage and access'
      ],
      outputFormat: 'JSON object with container registry details'
    },
    outputSchema: {
      type: 'object',
      required: ['registryUrl', 'repositories'],
      properties: {
        registryUrl: { type: 'string' },
        registryType: { type: 'string' },
        repositories: { type: 'array', items: { type: 'string' } },
        scanningEnabled: { type: 'boolean' },
        lifecyclePolicies: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['environment-management', 'container-registry', 'infrastructure']
}));

// Task 3.4: Container Image Build
export const containerImageBuildTask = defineTask('container-image-build', (args, taskCtx) => ({
  kind: 'agent',
  title: `Build and push container images - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps Engineer',
      task: 'Build container images and push to registry',
      context: {
        projectName: args.projectName,
        dockerConfig: args.dockerConfig,
        containerRegistry: args.containerRegistry,
        applicationArchitecture: args.applicationArchitecture
      },
      instructions: [
        '1. Build Docker images for all services',
        '2. Tag images with version and environment labels',
        '3. Run security scanning on built images',
        '4. Authenticate with container registry',
        '5. Push images to registry',
        '6. Verify images are accessible',
        '7. Create image manifest',
        '8. Tag images for different environments',
        '9. Generate build report with sizes and layers',
        '10. Document image versions and tags'
      ],
      outputFormat: 'JSON object with container image build results'
    },
    outputSchema: {
      type: 'object',
      required: ['imagesBuilt', 'imageDetails'],
      properties: {
        imagesBuilt: { type: 'number' },
        imageDetails: { type: 'array', items: { type: 'object' } },
        scanResults: { type: 'object' },
        totalSize: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['environment-management', 'docker', 'build']
}));

// Task 4.1: Environment Provisioning
export const environmentProvisioningTask = defineTask('environment-provisioning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Provision environment - ${args.environmentName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps Engineer with cloud provisioning expertise',
      task: 'Provision test environment using IaC templates',
      context: {
        projectName: args.projectName,
        environmentName: args.environmentName,
        iacTemplates: args.iacTemplates,
        networkConfig: args.networkConfig,
        securityConfig: args.securityConfig,
        containerImages: args.containerImages,
        infrastructurePlatform: args.infrastructurePlatform
      },
      instructions: [
        '1. Initialize IaC working directory',
        '2. Set environment-specific variables and parameters',
        '3. Execute IaC plan to preview changes',
        '4. Apply IaC templates to provision infrastructure',
        '5. Deploy container images to compute resources',
        '6. Configure service networking and load balancing',
        '7. Setup DNS records for services',
        '8. Configure environment variables and secrets',
        '9. Wait for all resources to become healthy',
        '10. Record provisioned resource IDs and endpoints'
      ],
      outputFormat: 'JSON object with provisioning results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'resources'],
      properties: {
        success: { type: 'boolean' },
        environmentName: { type: 'string' },
        resources: { type: 'array', items: { type: 'object' } },
        endpoints: { type: 'object' },
        errors: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['environment-management', 'provisioning', 'execution']
}));

// Task 4.2: Environment Health Check
export const environmentHealthCheckTask = defineTask('environment-health-check', (args, taskCtx) => ({
  kind: 'agent',
  title: `Health check - ${args.environmentName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SRE with monitoring expertise',
      task: 'Perform comprehensive health check on provisioned environment',
      context: {
        projectName: args.projectName,
        environmentName: args.environmentName,
        provisionResult: args.provisionResult,
        applicationArchitecture: args.applicationArchitecture
      },
      instructions: [
        '1. Check all services are running and responsive',
        '2. Verify health check endpoints return success',
        '3. Test database connectivity',
        '4. Verify cache and queue connectivity',
        '5. Check load balancer health',
        '6. Test service-to-service communication',
        '7. Verify DNS resolution',
        '8. Check resource utilization is normal',
        '9. Test external integrations if applicable',
        '10. Generate health check report'
      ],
      outputFormat: 'JSON object with health check results'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'servicesHealthy'],
      properties: {
        status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
        servicesHealthy: { type: 'number' },
        servicesTotal: { type: 'number' },
        checks: { type: 'array', items: { type: 'object' } },
        issues: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['environment-management', 'health-check', 'validation']
}));

// Task 5.1: Test Data Strategy
export const testDataStrategyTask = defineTask('test-data-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Define test data strategy - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'QA Engineer with test data management expertise',
      task: 'Define comprehensive test data strategy',
      context: {
        projectName: args.projectName,
        applicationArchitecture: args.applicationArchitecture,
        environments: args.environments
      },
      instructions: [
        '1. Identify all data entities and relationships',
        '2. Define data volume requirements per environment',
        '3. Determine data characteristics (valid, invalid, edge cases)',
        '4. Define data privacy and masking requirements',
        '5. Plan data generation vs subsetting approach',
        '6. Define data refresh frequency',
        '7. Plan data versioning and lineage',
        '8. Define data validation rules',
        '9. Plan data cleanup and reset procedures',
        '10. Document test data strategy'
      ],
      outputFormat: 'JSON object with test data strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['entities', 'approach'],
      properties: {
        entities: { type: 'array', items: { type: 'object' } },
        approach: { type: 'string', enum: ['generation', 'subsetting', 'hybrid'] },
        volumeRequirements: { type: 'object' },
        privacyRequirements: { type: 'object' },
        refreshFrequency: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['environment-management', 'test-data', 'strategy']
}));

// Task 5.2: Data Generation Scripts
export const dataGenerationScriptsTask = defineTask('data-generation-scripts', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create data generation scripts - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'QA Automation Engineer',
      task: 'Create test data generation scripts',
      context: {
        projectName: args.projectName,
        dataStrategy: args.dataStrategy,
        applicationArchitecture: args.applicationArchitecture
      },
      instructions: [
        '1. Create data factory classes for each entity',
        '2. Implement data generators using libraries (Faker, Factory Boy)',
        '3. Create scripts for bulk data generation',
        '4. Implement data relationship management',
        '5. Add data validation in generation',
        '6. Create configurable data scenarios',
        '7. Implement data masking for sensitive fields',
        '8. Add performance optimization for large datasets',
        '9. Create data export/import utilities',
        '10. Document data generation usage'
      ],
      outputFormat: 'JSON object with data generation script details'
    },
    outputSchema: {
      type: 'object',
      required: ['scriptsCreated', 'entities'],
      properties: {
        scriptsCreated: { type: 'number' },
        entities: { type: 'array', items: { type: 'string' } },
        scenarios: { type: 'array', items: { type: 'string' } },
        scriptsPath: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['environment-management', 'test-data', 'generation']
}));

// Task 5.3: Data Seeding Automation
export const dataSeedingAutomationTask = defineTask('data-seeding-automation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Automate data seeding - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'QA Automation Engineer',
      task: 'Automate test data seeding for all environments',
      context: {
        projectName: args.projectName,
        environments: args.environments,
        dataGeneration: args.dataGeneration,
        dataStrategy: args.dataStrategy
      },
      instructions: [
        '1. Create data seeding pipeline for each environment',
        '2. Integrate data generation scripts',
        '3. Implement database seeding procedures',
        '4. Create API-based seeding for services',
        '5. Add data validation after seeding',
        '6. Implement idempotent seeding (reset capability)',
        '7. Add progress tracking and logging',
        '8. Create rollback procedures',
        '9. Integrate with CI/CD pipeline',
        '10. Document seeding procedures'
      ],
      outputFormat: 'JSON object with data seeding results'
    },
    outputSchema: {
      type: 'object',
      required: ['environmentsSeeded', 'recordsCreated'],
      properties: {
        environmentsSeeded: { type: 'number' },
        recordsCreated: { type: 'object' },
        seedingDuration: { type: 'number' },
        errors: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['environment-management', 'test-data', 'seeding']
}));

// Task 6.1: Dependency Analysis
export const dependencyAnalysisTask = defineTask('dependency-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze external dependencies - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Software Architect',
      task: 'Analyze external dependencies that need mocking',
      context: {
        projectName: args.projectName,
        applicationArchitecture: args.applicationArchitecture,
        environments: args.environments
      },
      instructions: [
        '1. Identify all external service dependencies',
        '2. Categorize dependencies (APIs, databases, message queues)',
        '3. Analyze dependency interfaces and contracts',
        '4. Determine which dependencies should be mocked vs real',
        '5. Identify dependency behaviors to simulate',
        '6. Define mock response scenarios',
        '7. Plan for failure scenario simulation',
        '8. Document dependency contracts',
        '9. Prioritize mocking requirements',
        '10. Create dependency map'
      ],
      outputFormat: 'JSON object with dependency analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['dependencies', 'mockingRequired'],
      properties: {
        dependencies: { type: 'array', items: { type: 'object' } },
        mockingRequired: { type: 'number' },
        contracts: { type: 'object' },
        scenarios: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['environment-management', 'mocking', 'analysis']
}));

// Task 6.2: Mock Service Implementation
export const mockServiceImplementationTask = defineTask('mock-service-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement mock services - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Test Automation Engineer',
      task: 'Implement mock services for external dependencies',
      context: {
        projectName: args.projectName,
        dependencyAnalysis: args.dependencyAnalysis,
        environments: args.environments
      },
      instructions: [
        '1. Choose mocking frameworks (WireMock, MockServer, Mountebank)',
        '2. Implement mock servers for each dependency',
        '3. Create stub responses for happy path scenarios',
        '4. Implement error and edge case scenarios',
        '5. Add latency simulation',
        '6. Create stateful mocks where needed',
        '7. Implement mock configuration API',
        '8. Add logging and observability to mocks',
        '9. Create mock testing utilities',
        '10. Document mock service usage'
      ],
      outputFormat: 'JSON object with mock service implementation details'
    },
    outputSchema: {
      type: 'object',
      required: ['mocksImplemented', 'mockServices'],
      properties: {
        mocksImplemented: { type: 'number' },
        mockServices: { type: 'array', items: { type: 'object' } },
        framework: { type: 'string' },
        scenarios: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['environment-management', 'mocking', 'implementation']
}));

// Task 6.3: Mock Service Deployment
export const mockServiceDeploymentTask = defineTask('mock-service-deployment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Deploy mock services - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps Engineer',
      task: 'Deploy mock services to test environments',
      context: {
        projectName: args.projectName,
        mockServices: args.mockServices,
        environments: args.environments,
        infrastructurePlatform: args.infrastructurePlatform
      },
      instructions: [
        '1. Containerize mock services',
        '2. Deploy mocks to each environment',
        '3. Configure service discovery for mocks',
        '4. Setup mock endpoints and routing',
        '5. Verify mock services are accessible',
        '6. Test mock responses',
        '7. Configure mock service monitoring',
        '8. Setup mock configuration management',
        '9. Verify application can connect to mocks',
        '10. Document mock endpoints'
      ],
      outputFormat: 'JSON object with mock deployment results'
    },
    outputSchema: {
      type: 'object',
      required: ['servicesDeployed', 'endpoints'],
      properties: {
        servicesDeployed: { type: 'number' },
        endpoints: { type: 'object' },
        environmentsConfigured: { type: 'number' },
        errors: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['environment-management', 'mocking', 'deployment']
}));

// Task 7.1: Monitoring Configuration
export const monitoringConfigurationTask = defineTask('monitoring-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure monitoring - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SRE with monitoring and observability expertise',
      task: 'Configure comprehensive monitoring for test environments',
      context: {
        projectName: args.projectName,
        environments: args.environments,
        infrastructurePlatform: args.infrastructurePlatform,
        applicationArchitecture: args.applicationArchitecture
      },
      instructions: [
        '1. Choose monitoring stack (Prometheus, CloudWatch, Datadog)',
        '2. Configure metrics collection for infrastructure',
        '3. Setup application performance monitoring (APM)',
        '4. Configure service health checks',
        '5. Setup custom metrics for business logic',
        '6. Configure resource utilization monitoring',
        '7. Setup distributed tracing',
        '8. Create monitoring dashboards',
        '9. Configure metrics retention policies',
        '10. Document monitoring setup'
      ],
      outputFormat: 'JSON object with monitoring configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['monitoringConfigured', 'dashboards'],
      properties: {
        monitoringConfigured: { type: 'boolean' },
        monitoringStack: { type: 'string' },
        metricsCollected: { type: 'array', items: { type: 'string' } },
        dashboards: { type: 'array', items: { type: 'object' } },
        tracingEnabled: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['environment-management', 'monitoring', 'observability']
}));

// Task 7.2: Logging Setup
export const loggingSetupTask = defineTask('logging-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup centralized logging - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps Engineer with logging expertise',
      task: 'Setup centralized logging for test environments',
      context: {
        projectName: args.projectName,
        environments: args.environments,
        infrastructurePlatform: args.infrastructurePlatform,
        monitoringConfig: args.monitoringConfig
      },
      instructions: [
        '1. Choose logging stack (ELK, Loki, CloudWatch Logs)',
        '2. Configure log aggregation from all services',
        '3. Setup log parsing and structuring',
        '4. Configure log retention policies',
        '5. Create log search and filtering capabilities',
        '6. Setup log correlation with traces',
        '7. Configure log-based metrics',
        '8. Create log analysis dashboards',
        '9. Setup log archiving',
        '10. Document logging standards'
      ],
      outputFormat: 'JSON object with logging configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['loggingConfigured', 'loggingStack'],
      properties: {
        loggingConfigured: { type: 'boolean' },
        loggingStack: { type: 'string' },
        logSources: { type: 'array', items: { type: 'string' } },
        retentionDays: { type: 'number' },
        searchEnabled: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['environment-management', 'logging', 'observability']
}));

// Task 7.3: Alerting Configuration
export const alertingConfigurationTask = defineTask('alerting-configuration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure alerting - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SRE',
      task: 'Configure alerting for test environments',
      context: {
        projectName: args.projectName,
        environments: args.environments,
        monitoringConfig: args.monitoringConfig,
        loggingSetup: args.loggingSetup
      },
      instructions: [
        '1. Define alert rules for critical metrics',
        '2. Configure alert thresholds',
        '3. Setup alert routing and notification channels',
        '4. Configure alert severity levels',
        '5. Setup alert aggregation and deduplication',
        '6. Configure on-call rotations if applicable',
        '7. Create runbooks for common alerts',
        '8. Setup alert testing',
        '9. Configure alert acknowledgment workflow',
        '10. Document alerting policies'
      ],
      outputFormat: 'JSON object with alerting configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['alertsConfigured', 'alertRules'],
      properties: {
        alertsConfigured: { type: 'number' },
        alertRules: { type: 'array', items: { type: 'object' } },
        notificationChannels: { type: 'array', items: { type: 'string' } },
        runbooksCreated: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['environment-management', 'alerting', 'observability']
}));

// Task 7.4: Monitoring Validation
export const monitoringValidationTask = defineTask('monitoring-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate monitoring setup - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SRE',
      task: 'Validate monitoring and observability setup',
      context: {
        projectName: args.projectName,
        environments: args.environments,
        monitoringConfig: args.monitoringConfig,
        loggingSetup: args.loggingSetup,
        alertingConfig: args.alertingConfig
      },
      instructions: [
        '1. Verify metrics are being collected',
        '2. Verify logs are being aggregated',
        '3. Test alert rules trigger correctly',
        '4. Verify dashboards display data',
        '5. Test notification channels',
        '6. Verify trace collection',
        '7. Test log search functionality',
        '8. Verify data retention policies',
        '9. Check monitoring performance overhead',
        '10. Generate validation report'
      ],
      outputFormat: 'JSON object with monitoring validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['allSystemsOperational', 'validationResults'],
      properties: {
        allSystemsOperational: { type: 'boolean' },
        validationResults: { type: 'object' },
        metricsCollecting: { type: 'boolean' },
        logsAggregating: { type: 'boolean' },
        alertsTested: { type: 'number' },
        issues: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['environment-management', 'monitoring', 'validation']
}));

// Task 8.1: Access Control Setup
export const accessControlSetupTask = defineTask('access-control-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup access control - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Engineer',
      task: 'Setup access control for test environments',
      context: {
        projectName: args.projectName,
        environments: args.environments,
        securityRequirements: args.securityRequirements,
        infrastructurePlatform: args.infrastructurePlatform
      },
      instructions: [
        '1. Define user roles and permissions (RBAC)',
        '2. Create IAM policies for environment access',
        '3. Setup authentication mechanisms',
        '4. Configure authorization rules',
        '5. Setup VPN or bastion hosts for secure access',
        '6. Configure service accounts for CI/CD',
        '7. Setup MFA for privileged access',
        '8. Configure audit logging for access',
        '9. Create access request workflows',
        '10. Document access procedures'
      ],
      outputFormat: 'JSON object with access control configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['accessControlConfigured', 'roles'],
      properties: {
        accessControlConfigured: { type: 'boolean' },
        roles: { type: 'array', items: { type: 'object' } },
        authenticationMethods: { type: 'array', items: { type: 'string' } },
        mfaEnabled: { type: 'boolean' },
        auditLogging: { type: 'boolean' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['environment-management', 'security', 'access-control']
}));

// Task 8.2: Security Hardening
export const securityHardeningTask = defineTask('security-hardening', (args, taskCtx) => ({
  kind: 'agent',
  title: `Security hardening - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Engineer',
      task: 'Perform security hardening on test environments',
      context: {
        projectName: args.projectName,
        environments: args.environments,
        securityRequirements: args.securityRequirements,
        accessControl: args.accessControl
      },
      instructions: [
        '1. Disable unnecessary services and ports',
        '2. Apply OS and application security patches',
        '3. Configure secure defaults',
        '4. Implement network segmentation',
        '5. Enable encryption in transit and at rest',
        '6. Configure secure secrets management',
        '7. Implement input validation',
        '8. Setup rate limiting and DDoS protection',
        '9. Configure security headers',
        '10. Document security hardening steps'
      ],
      outputFormat: 'JSON object with security hardening results'
    },
    outputSchema: {
      type: 'object',
      required: ['hardeningComplete', 'controlsImplemented'],
      properties: {
        hardeningComplete: { type: 'boolean' },
        controlsImplemented: { type: 'array', items: { type: 'string' } },
        encryptionEnabled: { type: 'boolean' },
        patchesApplied: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['environment-management', 'security', 'hardening']
}));

// Task 8.3: Security Audit
export const securityAuditTask = defineTask('security-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: `Security audit - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Auditor',
      task: 'Perform security audit on test environments',
      context: {
        projectName: args.projectName,
        environments: args.environments,
        securityRequirements: args.securityRequirements,
        securityHardening: args.securityHardening,
        accessControl: args.accessControl
      },
      instructions: [
        '1. Run vulnerability scanning tools',
        '2. Check compliance with security standards (CIS, OWASP)',
        '3. Review IAM policies and permissions',
        '4. Audit network security configurations',
        '5. Review encryption implementations',
        '6. Check for exposed secrets or credentials',
        '7. Review access logs for anomalies',
        '8. Test authentication and authorization',
        '9. Categorize findings by severity',
        '10. Generate audit report with remediation guidance'
      ],
      outputFormat: 'JSON object with security audit results'
    },
    outputSchema: {
      type: 'object',
      required: ['criticalIssues', 'findings'],
      properties: {
        criticalIssues: { type: 'number' },
        highIssues: { type: 'number' },
        mediumIssues: { type: 'number' },
        lowIssues: { type: 'number' },
        findings: { type: 'array', items: { type: 'object' } },
        complianceScore: { type: 'number' },
        remediationGuide: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['environment-management', 'security', 'audit']
}));

// Task 9.1: Environment Parity Check
export const environmentParityCheckTask = defineTask('environment-parity-check', (args, taskCtx) => ({
  kind: 'agent',
  title: `Check environment parity - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps Engineer',
      task: 'Validate parity across test environments',
      context: {
        projectName: args.projectName,
        environments: args.environments,
        applicationArchitecture: args.applicationArchitecture,
        infrastructurePlatform: args.infrastructurePlatform
      },
      instructions: [
        '1. Compare infrastructure configurations across environments',
        '2. Verify consistent service versions',
        '3. Check configuration consistency',
        '4. Validate network topology similarity',
        '5. Compare security configurations',
        '6. Verify monitoring consistency',
        '7. Check data schema consistency',
        '8. Validate environment variables consistency',
        '9. Compare resource allocations',
        '10. Generate parity report'
      ],
      outputFormat: 'JSON object with parity check results'
    },
    outputSchema: {
      type: 'object',
      required: ['parityAchieved', 'differences'],
      properties: {
        parityAchieved: { type: 'boolean' },
        differences: { type: 'array', items: { type: 'object' } },
        consistencyScore: { type: 'number' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['environment-management', 'parity', 'validation']
}));

// Task 9.2: Configuration Drift Detection
export const configurationDriftDetectionTask = defineTask('configuration-drift-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Detect configuration drift - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps Engineer',
      task: 'Detect configuration drift from IaC templates',
      context: {
        projectName: args.projectName,
        environments: args.environments,
        iacTemplates: args.iacTemplates,
        parityCheck: args.parityCheck
      },
      instructions: [
        '1. Run IaC drift detection (terraform plan, cloudformation drift)',
        '2. Compare actual vs expected configurations',
        '3. Identify manual changes outside IaC',
        '4. Categorize drift by severity',
        '5. Identify drift root causes',
        '6. Recommend remediation actions',
        '7. Update IaC to reflect intentional changes',
        '8. Generate drift report',
        '9. Setup continuous drift detection',
        '10. Document drift prevention procedures'
      ],
      outputFormat: 'JSON object with drift detection results'
    },
    outputSchema: {
      type: 'object',
      required: ['driftDetected', 'driftedResources'],
      properties: {
        driftDetected: { type: 'boolean' },
        driftedResources: { type: 'number' },
        driftedEnvironments: { type: 'array', items: { type: 'string' } },
        driftDetails: { type: 'array', items: { type: 'object' } },
        remediationActions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['environment-management', 'drift', 'validation']
}));

// Task 10.1: Provisioning Scripts
export const provisioningScriptsTask = defineTask('provisioning-scripts', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create provisioning scripts - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps Engineer',
      task: 'Create automated provisioning scripts',
      context: {
        projectName: args.projectName,
        iacTemplates: args.iacTemplates,
        environments: args.environments,
        infrastructurePlatform: args.infrastructurePlatform
      },
      instructions: [
        '1. Create environment provisioning scripts',
        '2. Add validation and error handling',
        '3. Implement idempotency',
        '4. Add progress tracking and logging',
        '5. Create rollback capabilities',
        '6. Add pre-flight checks',
        '7. Implement parallel provisioning',
        '8. Create dry-run mode',
        '9. Add cost estimation',
        '10. Document script usage'
      ],
      outputFormat: 'JSON object with provisioning script details'
    },
    outputSchema: {
      type: 'object',
      required: ['scriptsCreated', 'scriptsPath'],
      properties: {
        scriptsCreated: { type: 'number' },
        scriptsPath: { type: 'string' },
        features: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['environment-management', 'automation', 'scripts']
}));

// Task 10.2: Environment Management Scripts
export const environmentManagementScriptsTask = defineTask('environment-management-scripts', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create management scripts - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps Engineer',
      task: 'Create environment lifecycle management scripts',
      context: {
        projectName: args.projectName,
        environments: args.environments,
        provisioningScripts: args.provisioningScripts,
        costConstraints: args.costConstraints
      },
      instructions: [
        '1. Create environment start/stop scripts',
        '2. Create environment reset scripts',
        '3. Create environment backup scripts',
        '4. Create environment cloning scripts',
        '5. Create cost optimization scripts (auto-shutdown)',
        '6. Create environment health check scripts',
        '7. Create environment upgrade scripts',
        '8. Create disaster recovery scripts',
        '9. Create environment inventory scripts',
        '10. Document all management operations'
      ],
      outputFormat: 'JSON object with management script details'
    },
    outputSchema: {
      type: 'object',
      required: ['scriptsCreated', 'scriptsPath'],
      properties: {
        scriptsCreated: { type: 'number' },
        scriptsPath: { type: 'string' },
        operations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['environment-management', 'automation', 'lifecycle']
}));

// Task 10.3: Documentation Generation
export const documentationGenerationTask = defineTask('documentation-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate documentation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Writer and DevOps Engineer',
      task: 'Generate comprehensive environment documentation',
      context: {
        projectName: args.projectName,
        environments: args.environments,
        iacTemplates: args.iacTemplates,
        architectureDesign: args.architectureDesign,
        monitoringConfig: args.monitoringConfig,
        accessControl: args.accessControl,
        provisioningScripts: args.provisioningScripts,
        managementScripts: args.managementScripts
      },
      instructions: [
        '1. Create environment overview documentation',
        '2. Document architecture and design decisions',
        '3. Create environment access guide',
        '4. Document provisioning procedures',
        '5. Create environment management guide',
        '6. Document monitoring and alerting',
        '7. Create troubleshooting guide',
        '8. Document security procedures',
        '9. Create developer quick start guide',
        '10. Generate API documentation for environment services'
      ],
      outputFormat: 'JSON object with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['documentationPath', 'sections'],
      properties: {
        documentationPath: { type: 'string' },
        sections: { type: 'array', items: { type: 'string' } },
        format: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['environment-management', 'documentation', 'knowledge-transfer']
}));

// Task 10.4: Runbook Creation
export const runbookCreationTask = defineTask('runbook-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create operational runbook - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SRE and Technical Writer',
      task: 'Create operational runbook for test environments',
      context: {
        projectName: args.projectName,
        environments: args.environments,
        documentation: args.documentation,
        managementScripts: args.managementScripts,
        troubleshootingGuides: args.troubleshootingGuides
      },
      instructions: [
        '1. Create standard operating procedures (SOPs)',
        '2. Document common operational tasks',
        '3. Create incident response procedures',
        '4. Document troubleshooting steps',
        '5. Create escalation procedures',
        '6. Document backup and recovery procedures',
        '7. Create environment refresh procedures',
        '8. Document cost management procedures',
        '9. Create maintenance procedures',
        '10. Add runbook automation references'
      ],
      outputFormat: 'JSON object with runbook details'
    },
    outputSchema: {
      type: 'object',
      required: ['runbookPath', 'procedures'],
      properties: {
        runbookPath: { type: 'string' },
        procedures: { type: 'array', items: { type: 'string' } },
        automatedProcedures: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['environment-management', 'runbook', 'operations']
}));

// Task 11.1: End-to-End Environment Test
export const endToEndEnvironmentTestTask = defineTask('e2e-environment-test', (args, taskCtx) => ({
  kind: 'agent',
  title: `E2E environment test - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'QA Engineer',
      task: 'Perform end-to-end testing of environment setup',
      context: {
        projectName: args.projectName,
        environments: args.environments,
        applicationArchitecture: args.applicationArchitecture,
        mockServices: args.mockServices
      },
      instructions: [
        '1. Test full application deployment',
        '2. Verify all services are communicating',
        '3. Test data flow through system',
        '4. Verify mock services respond correctly',
        '5. Test authentication and authorization',
        '6. Verify monitoring and logging working',
        '7. Test environment access',
        '8. Verify CI/CD integration',
        '9. Test disaster recovery procedures',
        '10. Generate E2E test report'
      ],
      outputFormat: 'JSON object with E2E test results'
    },
    outputSchema: {
      type: 'object',
      required: ['testsPassed', 'testsFailed'],
      properties: {
        testsPassed: { type: 'number' },
        testsFailed: { type: 'number' },
        testsSkipped: { type: 'number' },
        testResults: { type: 'array', items: { type: 'object' } },
        overallStatus: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['environment-management', 'e2e-testing', 'validation']
}));

// Task 11.2: Performance Baseline
export const performanceBaselineTask = defineTask('performance-baseline', (args, taskCtx) => ({
  kind: 'agent',
  title: `Establish performance baseline - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Performance Engineer',
      task: 'Establish performance baseline for environments',
      context: {
        projectName: args.projectName,
        environments: args.environments,
        targetProvisioningTime: args.targetProvisioningTime
      },
      instructions: [
        '1. Measure environment provisioning time',
        '2. Measure application startup time',
        '3. Measure service response times',
        '4. Measure resource utilization',
        '5. Establish baseline metrics',
        '6. Compare against targets',
        '7. Identify performance bottlenecks',
        '8. Recommend optimizations',
        '9. Document baseline metrics',
        '10. Setup performance monitoring'
      ],
      outputFormat: 'JSON object with performance baseline'
    },
    outputSchema: {
      type: 'object',
      required: ['avgProvisioningTime', 'baselineMetrics'],
      properties: {
        avgProvisioningTime: { type: 'number' },
        targetMet: { type: 'boolean' },
        baselineMetrics: { type: 'object' },
        bottlenecks: { type: 'array', items: { type: 'string' } },
        optimizations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['environment-management', 'performance', 'baseline']
}));

// Task 11.3: Cost Analysis
export const costAnalysisTask = defineTask('cost-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze infrastructure costs - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Cloud Financial Analyst and DevOps Engineer',
      task: 'Analyze and optimize infrastructure costs',
      context: {
        projectName: args.projectName,
        environments: args.environments,
        infrastructurePlatform: args.infrastructurePlatform,
        costConstraints: args.costConstraints
      },
      instructions: [
        '1. Calculate actual resource costs per environment',
        '2. Project monthly costs',
        '3. Compare against budget constraints',
        '4. Identify cost optimization opportunities',
        '5. Analyze cost by resource type',
        '6. Recommend right-sizing',
        '7. Identify unused resources',
        '8. Calculate cost per test execution',
        '9. Recommend auto-shutdown policies',
        '10. Generate cost analysis report'
      ],
      outputFormat: 'JSON object with cost analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['projectedMonthlyCost', 'costBreakdown'],
      properties: {
        projectedMonthlyCost: { type: 'number' },
        budgetStatus: { type: 'string' },
        costBreakdown: { type: 'object' },
        optimizationOpportunities: { type: 'array', items: { type: 'object' } },
        potentialSavings: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['environment-management', 'cost', 'analysis']
}));

// Task 11.4: Final Report Generation
export const finalReportGenerationTask = defineTask('final-report-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate final report - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Lead and Project Manager',
      task: 'Generate comprehensive final report',
      context: {
        projectName: args.projectName,
        environments: args.environments,
        e2eTest: args.e2eTest,
        performanceBaseline: args.performanceBaseline,
        costAnalysis: args.costAnalysis,
        monitoringValidation: args.monitoringValidation,
        securityAudit: args.securityAudit,
        parityCheck: args.parityCheck,
        documentation: args.documentation,
        runbook: args.runbook
      },
      instructions: [
        '1. Create executive summary',
        '2. Document environments provisioned',
        '3. Include performance metrics',
        '4. Include cost analysis',
        '5. Include security audit results',
        '6. Include parity validation',
        '7. Include E2E test results',
        '8. Document known issues and limitations',
        '9. Include next steps and recommendations',
        '10. Generate both JSON and Markdown reports'
      ],
      outputFormat: 'JSON object with report paths and summary'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'summary'],
      properties: {
        reportPath: { type: 'string' },
        markdownReportPath: { type: 'string' },
        summary: {
          type: 'object',
          properties: {
            environmentsProvisioned: { type: 'number' },
            avgProvisioningTime: { type: 'string' },
            testsPassed: { type: 'number' },
            securityCompliant: { type: 'boolean' },
            costProjection: { type: 'number' }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        nextSteps: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['environment-management', 'reporting', 'final']
}));
