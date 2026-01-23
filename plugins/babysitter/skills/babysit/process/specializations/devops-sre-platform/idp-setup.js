/**
 * @process specializations/devops-sre-platform/idp-setup
 * @description Internal Developer Platform (IDP) Setup - Complete workflow for building a self-service
 * internal developer platform that empowers developers with self-service capabilities, standardized templates,
 * golden paths, observability integration, and comprehensive developer experience improvements.
 * @inputs { projectName: string, platformScope?: string, platformType?: string, targetAdoption?: number }
 * @outputs { success: boolean, platformInfo: object, services: array, templates: array, onboarding: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/devops-sre-platform/idp-setup', {
 *   projectName: 'Acme Internal Developer Platform',
 *   platformScope: 'full-stack', // 'backend-only', 'full-stack', 'data-platform'
 *   platformType: 'backstage', // 'backstage', 'custom', 'port'
 *   targetAdoption: 80, // percentage of teams using platform
 *   organization: {
 *     teams: 10,
 *     developers: 50,
 *     existingServices: 30
 *   },
 *   requirements: {
 *     selfServiceProvisioning: true,
 *     serviceCatalog: true,
 *     goldenPaths: true,
 *     observabilityIntegration: true,
 *     costTracking: true,
 *     complianceReporting: true
 *   }
 * });
 *
 * @references
 * - Platform Engineering: https://platformengineering.org/
 * - Backstage: https://backstage.io/
 * - Team Topologies: https://teamtopologies.com/
 * - CNCF Platform Engineering: https://tag-app-delivery.cncf.io/whitepapers/platforms/
 * - Internal Developer Platform: https://internaldeveloperplatform.org/
 * - Golden Paths: https://engineering.atspotify.com/2020/08/how-we-use-golden-paths-to-solve-fragmentation-in-our-software-ecosystem/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    platformScope = 'full-stack', // 'backend-only', 'full-stack', 'data-platform'
    platformType = 'backstage', // 'backstage', 'custom', 'port'
    targetAdoption = 80, // percentage of teams using platform
    organization = {
      teams: 10,
      developers: 50,
      existingServices: 30
    },
    requirements = {
      selfServiceProvisioning: true,
      serviceCatalog: true,
      goldenPaths: true,
      observabilityIntegration: true,
      costTracking: true,
      complianceReporting: true,
      secretsManagement: true,
      cicdIntegration: true,
      documentationPortal: true,
      developerOnboarding: true
    },
    infrastructure = {
      cloudProvider: 'aws', // 'aws', 'gcp', 'azure', 'hybrid'
      kubernetes: true,
      cicdTool: 'github-actions', // 'github-actions', 'gitlab-ci', 'jenkins'
      monitoring: 'prometheus', // 'prometheus', 'datadog', 'newrelic'
      serviceMesh: 'istio' // 'istio', 'linkerd', 'none'
    },
    outputDir = 'idp-setup-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let platformInfo = {};
  const services = [];
  const templates = [];
  let onboarding = {};
  let adoptionScore = 0;

  ctx.log('info', `Starting Internal Developer Platform Setup for ${projectName}`);
  ctx.log('info', `Platform Type: ${platformType}, Scope: ${platformScope}, Target Adoption: ${targetAdoption}%`);
  ctx.log('info', `Organization: ${organization.teams} teams, ${organization.developers} developers, ${organization.existingServices} existing services`);

  // ============================================================================
  // PHASE 1: DEVELOPER NEEDS ASSESSMENT AND DISCOVERY
  // ============================================================================

  ctx.log('info', 'Phase 1: Conducting developer needs assessment and pain point discovery');

  const discoveryResult = await ctx.task(developerNeedsAssessmentTask, {
    projectName,
    organization,
    platformScope,
    requirements,
    outputDir
  });

  if (!discoveryResult.success) {
    return {
      success: false,
      error: 'Failed to complete developer needs assessment',
      details: discoveryResult,
      metadata: {
        processId: 'specializations/devops-sre-platform/idp-setup',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...discoveryResult.artifacts);

  ctx.log('info', `Discovery complete - Identified ${discoveryResult.painPoints.length} pain points, ${discoveryResult.requirements.length} requirements`);

  // Quality Gate: Review discovery findings
  await ctx.breakpoint({
    question: `Phase 1 Review: Developer needs assessment complete. Identified ${discoveryResult.painPoints.length} pain points and ${discoveryResult.requirements.length} requirements. Top pain points: ${discoveryResult.topPainPoints.slice(0, 3).join(', ')}. Approve platform scope?`,
    title: 'Developer Needs Assessment Review',
    context: {
      runId: ctx.runId,
      discovery: {
        painPoints: discoveryResult.painPoints.slice(0, 10),
        requirements: discoveryResult.requirements.slice(0, 10),
        prioritizedFeatures: discoveryResult.prioritizedFeatures
      },
      files: [{
        path: `${outputDir}/phase1-discovery-report.json`,
        format: 'json',
        content: JSON.stringify(discoveryResult, null, 2)
      }]
    }
  });

  // ============================================================================
  // PHASE 2: PLATFORM ARCHITECTURE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing platform architecture and component selection');

  const architectureResult = await ctx.task(platformArchitectureDesignTask, {
    projectName,
    platformType,
    platformScope,
    discoveryResult,
    infrastructure,
    requirements,
    organization,
    outputDir
  });

  if (!architectureResult.success) {
    return {
      success: false,
      error: 'Failed to complete platform architecture design',
      details: architectureResult,
      metadata: {
        processId: 'specializations/devops-sre-platform/idp-setup',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...architectureResult.artifacts);
  platformInfo.architecture = architectureResult;

  ctx.log('info', `Architecture designed - Platform: ${architectureResult.platformTool}, Components: ${architectureResult.components.length}`);

  // Quality Gate: Architecture review
  await ctx.breakpoint({
    question: `Phase 2 Review: Platform architecture designed using ${architectureResult.platformTool}. ${architectureResult.components.length} components selected. Estimated cost: $${architectureResult.estimatedMonthlyCost}/month. Approve architecture?`,
    title: 'Platform Architecture Review',
    context: {
      runId: ctx.runId,
      architecture: {
        platformTool: architectureResult.platformTool,
        components: architectureResult.components,
        integrations: architectureResult.integrations,
        estimatedMonthlyCost: architectureResult.estimatedMonthlyCost
      },
      files: [{
        path: `${outputDir}/phase2-architecture-design.json`,
        format: 'json',
        content: JSON.stringify(architectureResult, null, 2)
      }]
    }
  });

  // ============================================================================
  // PHASE 3: PLATFORM CORE DEPLOYMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Deploying platform core infrastructure');

  const [coreDeployment, databaseSetup, authSetup] = await ctx.parallel.all([
    ctx.task(platformCoreDeploymentTask, {
      projectName,
      platformType,
      architecture: architectureResult,
      infrastructure,
      outputDir
    }),
    ctx.task(platformDatabaseSetupTask, {
      projectName,
      platformType,
      architecture: architectureResult,
      infrastructure,
      outputDir
    }),
    ctx.task(platformAuthenticationSetupTask, {
      projectName,
      platformType,
      organization,
      outputDir
    })
  ]);

  if (!coreDeployment.success || !databaseSetup.success || !authSetup.success) {
    return {
      success: false,
      error: 'Failed to deploy platform core',
      details: { coreDeployment, databaseSetup, authSetup },
      metadata: {
        processId: 'specializations/devops-sre-platform/idp-setup',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...coreDeployment.artifacts, ...databaseSetup.artifacts, ...authSetup.artifacts);
  platformInfo.core = { coreDeployment, databaseSetup, authSetup };

  ctx.log('info', `Platform core deployed - URL: ${coreDeployment.platformUrl}`);

  // Quality Gate: Core deployment verification
  await ctx.breakpoint({
    question: `Phase 3 Review: Platform core deployed at ${coreDeployment.platformUrl}. Database: ${databaseSetup.databaseType}, Auth: ${authSetup.authProvider}. Verify platform is accessible?`,
    title: 'Core Deployment Verification',
    context: {
      runId: ctx.runId,
      core: {
        platformUrl: coreDeployment.platformUrl,
        version: coreDeployment.version,
        databaseType: databaseSetup.databaseType,
        authProvider: authSetup.authProvider
      },
      files: [{
        path: `${outputDir}/phase3-core-deployment.json`,
        format: 'json',
        content: JSON.stringify({ coreDeployment, databaseSetup, authSetup }, null, 2)
      }]
    }
  });

  // ============================================================================
  // PHASE 4: SERVICE CATALOG SETUP
  // ============================================================================

  ctx.log('info', 'Phase 4: Setting up service catalog and discovery');

  const serviceCatalogResult = await ctx.task(serviceCatalogSetupTask, {
    projectName,
    platformType,
    platformInfo: coreDeployment,
    organization,
    discoveryResult,
    outputDir
  });

  if (!serviceCatalogResult.success) {
    return {
      success: false,
      error: 'Failed to set up service catalog',
      details: serviceCatalogResult,
      metadata: {
        processId: 'specializations/devops-sre-platform/idp-setup',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...serviceCatalogResult.artifacts);
  services.push(...serviceCatalogResult.services);
  platformInfo.serviceCatalog = serviceCatalogResult;

  ctx.log('info', `Service catalog configured - ${serviceCatalogResult.services.length} services registered`);

  // ============================================================================
  // PHASE 5: GOLDEN PATHS AND SERVICE TEMPLATES
  // ============================================================================

  ctx.log('info', 'Phase 5: Creating golden paths and service templates');

  const [backendTemplate, frontendTemplate, dataTemplate, workerTemplate] = await ctx.parallel.all([
    ctx.task(goldenPathTemplateTask, {
      projectName,
      templateType: 'backend-api',
      platformInfo: coreDeployment,
      architecture: architectureResult,
      infrastructure,
      outputDir
    }),
    ctx.task(goldenPathTemplateTask, {
      projectName,
      templateType: 'frontend-web',
      platformInfo: coreDeployment,
      architecture: architectureResult,
      infrastructure,
      outputDir
    }),
    ctx.task(goldenPathTemplateTask, {
      projectName,
      templateType: 'data-pipeline',
      platformInfo: coreDeployment,
      architecture: architectureResult,
      infrastructure,
      outputDir
    }),
    ctx.task(goldenPathTemplateTask, {
      projectName,
      templateType: 'background-worker',
      platformInfo: coreDeployment,
      architecture: architectureResult,
      infrastructure,
      outputDir
    })
  ]);

  if (!backendTemplate.success || !frontendTemplate.success) {
    ctx.log('warn', 'Some template creation failed, but continuing with available templates');
  }

  const allTemplates = [backendTemplate, frontendTemplate, dataTemplate, workerTemplate].filter(t => t.success);
  allTemplates.forEach(t => {
    artifacts.push(...t.artifacts);
    templates.push(t);
  });

  ctx.log('info', `Golden paths created - ${allTemplates.length} service templates available`);

  // Quality Gate: Template review
  await ctx.breakpoint({
    question: `Phase 5 Review: ${allTemplates.length} golden path templates created (${allTemplates.map(t => t.templateName).join(', ')}). Review templates?`,
    title: 'Golden Path Templates Review',
    context: {
      runId: ctx.runId,
      templates: allTemplates.map(t => ({
        name: t.templateName,
        type: t.templateType,
        features: t.features,
        cicdIncluded: t.cicdIncluded,
        observabilityIncluded: t.observabilityIncluded
      })),
      files: allTemplates.map(t => ({
        path: t.templatePath,
        format: 'json',
        label: `${t.templateName} Template`
      }))
    }
  });

  // ============================================================================
  // PHASE 6: SELF-SERVICE WORKFLOWS
  // ============================================================================

  ctx.log('info', 'Phase 6: Implementing self-service workflows');

  const [provisioningWorkflow, deploymentWorkflow, monitoringWorkflow] = await ctx.parallel.all([
    ctx.task(selfServiceWorkflowTask, {
      projectName,
      workflowType: 'service-provisioning',
      platformInfo: coreDeployment,
      templates: allTemplates,
      infrastructure,
      outputDir
    }),
    ctx.task(selfServiceWorkflowTask, {
      projectName,
      workflowType: 'deployment-automation',
      platformInfo: coreDeployment,
      templates: allTemplates,
      infrastructure,
      outputDir
    }),
    ctx.task(selfServiceWorkflowTask, {
      projectName,
      workflowType: 'monitoring-setup',
      platformInfo: coreDeployment,
      templates: allTemplates,
      infrastructure,
      outputDir
    })
  ]);

  if (!provisioningWorkflow.success || !deploymentWorkflow.success || !monitoringWorkflow.success) {
    return {
      success: false,
      error: 'Failed to implement self-service workflows',
      details: { provisioningWorkflow, deploymentWorkflow, monitoringWorkflow },
      metadata: {
        processId: 'specializations/devops-sre-platform/idp-setup',
        timestamp: startTime
      }
    };
  }

  artifacts.push(
    ...provisioningWorkflow.artifacts,
    ...deploymentWorkflow.artifacts,
    ...monitoringWorkflow.artifacts
  );
  platformInfo.workflows = { provisioningWorkflow, deploymentWorkflow, monitoringWorkflow };

  ctx.log('info', `Self-service workflows implemented - Provisioning, Deployment, Monitoring`);

  // ============================================================================
  // PHASE 7: OBSERVABILITY AND COST TRACKING INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Integrating observability and cost tracking');

  const [observabilityIntegration, costTracking] = await ctx.parallel.all([
    ctx.task(observabilityIntegrationTask, {
      projectName,
      platformInfo: coreDeployment,
      infrastructure,
      serviceCatalog: serviceCatalogResult,
      outputDir
    }),
    ctx.task(costTrackingSetupTask, {
      projectName,
      platformInfo: coreDeployment,
      infrastructure,
      serviceCatalog: serviceCatalogResult,
      outputDir
    })
  ]);

  if (!observabilityIntegration.success) {
    ctx.log('warn', 'Observability integration failed, but continuing');
  }

  if (!costTracking.success) {
    ctx.log('warn', 'Cost tracking setup failed, but continuing');
  }

  artifacts.push(...observabilityIntegration.artifacts, ...costTracking.artifacts);
  platformInfo.integrations = { observabilityIntegration, costTracking };

  ctx.log('info', `Integrations complete - Observability: ${observabilityIntegration.dashboards.length} dashboards, Cost tracking enabled`);

  // ============================================================================
  // PHASE 8: DEVELOPER PORTAL AND DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Building developer portal and comprehensive documentation');

  const developerPortalResult = await ctx.task(developerPortalSetupTask, {
    projectName,
    platformInfo: coreDeployment,
    serviceCatalog: serviceCatalogResult,
    templates: allTemplates,
    workflows: platformInfo.workflows,
    architecture: architectureResult,
    outputDir
  });

  if (!developerPortalResult.success) {
    ctx.log('warn', 'Developer portal setup failed, but continuing');
  } else {
    artifacts.push(...developerPortalResult.artifacts);
    platformInfo.portal = developerPortalResult;
  }

  ctx.log('info', `Developer portal created - ${developerPortalResult.documentationPages} documentation pages`);

  // ============================================================================
  // PHASE 9: DEVELOPER ONBOARDING PROGRAM
  // ============================================================================

  ctx.log('info', 'Phase 9: Creating developer onboarding program');

  const onboardingResult = await ctx.task(developerOnboardingTask, {
    projectName,
    platformInfo: coreDeployment,
    serviceCatalog: serviceCatalogResult,
    templates: allTemplates,
    workflows: platformInfo.workflows,
    portal: developerPortalResult,
    organization,
    outputDir
  });

  if (!onboardingResult.success) {
    return {
      success: false,
      error: 'Failed to create developer onboarding program',
      details: onboardingResult,
      metadata: {
        processId: 'specializations/devops-sre-platform/idp-setup',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...onboardingResult.artifacts);
  onboarding = onboardingResult;

  ctx.log('info', `Onboarding program created - ${onboardingResult.tutorials.length} tutorials, ${onboardingResult.videos.length} videos`);

  // Quality Gate: Onboarding program review
  await ctx.breakpoint({
    question: `Phase 9 Review: Developer onboarding program created with ${onboardingResult.tutorials.length} tutorials and ${onboardingResult.videos.length} video guides. Estimated time-to-first-deployment: ${onboardingResult.estimatedTimeToFirstDeployment} minutes. Review onboarding materials?`,
    title: 'Developer Onboarding Review',
    context: {
      runId: ctx.runId,
      onboarding: {
        tutorials: onboardingResult.tutorials.length,
        videos: onboardingResult.videos.length,
        sandboxEnvironment: onboardingResult.sandboxEnvironment,
        estimatedTimeToFirstDeployment: onboardingResult.estimatedTimeToFirstDeployment
      },
      files: [{
        path: `${outputDir}/phase9-onboarding-program.json`,
        format: 'json',
        content: JSON.stringify(onboardingResult, null, 2)
      }]
    }
  });

  // ============================================================================
  // PHASE 10: PILOT PROGRAM WITH INITIAL TEAMS
  // ============================================================================

  ctx.log('info', 'Phase 10: Running pilot program with initial teams');

  const pilotResult = await ctx.task(platformPilotProgramTask, {
    projectName,
    platformInfo: coreDeployment,
    serviceCatalog: serviceCatalogResult,
    templates: allTemplates,
    onboarding: onboardingResult,
    organization,
    pilotTeamCount: Math.min(3, Math.ceil(organization.teams * 0.3)),
    outputDir
  });

  if (!pilotResult.success) {
    return {
      success: false,
      error: 'Failed pilot program execution',
      details: pilotResult,
      metadata: {
        processId: 'specializations/devops-sre-platform/idp-setup',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...pilotResult.artifacts);
  platformInfo.pilot = pilotResult;

  ctx.log('info', `Pilot program complete - ${pilotResult.teamsOnboarded} teams, ${pilotResult.servicesCreated} services created`);

  // Quality Gate: Pilot program review
  await ctx.breakpoint({
    question: `Phase 10 Review: Pilot program complete with ${pilotResult.teamsOnboarded} teams. Created ${pilotResult.servicesCreated} services. Satisfaction score: ${pilotResult.satisfactionScore}/10. Issues identified: ${pilotResult.issuesIdentified.length}. Proceed to full rollout?`,
    title: 'Pilot Program Review',
    context: {
      runId: ctx.runId,
      pilot: {
        teamsOnboarded: pilotResult.teamsOnboarded,
        servicesCreated: pilotResult.servicesCreated,
        satisfactionScore: pilotResult.satisfactionScore,
        issuesIdentified: pilotResult.issuesIdentified,
        improvements: pilotResult.improvements
      },
      files: [{
        path: `${outputDir}/phase10-pilot-results.json`,
        format: 'json',
        content: JSON.stringify(pilotResult, null, 2)
      }]
    }
  });

  // ============================================================================
  // PHASE 11: PLATFORM VALIDATION AND TESTING
  // ============================================================================

  ctx.log('info', 'Phase 11: Validating platform functionality and performance');

  const validationResult = await ctx.task(platformValidationTask, {
    projectName,
    platformInfo: coreDeployment,
    serviceCatalog: serviceCatalogResult,
    templates: allTemplates,
    workflows: platformInfo.workflows,
    pilot: pilotResult,
    requirements,
    outputDir
  });

  if (!validationResult.success) {
    ctx.log('error', 'Platform validation failed');

    await ctx.breakpoint({
      question: `Phase 11 Alert: Platform validation failed with ${validationResult.failedTests} failed tests. Issues: ${validationResult.criticalIssues.length} critical. Review issues before proceeding?`,
      title: 'Platform Validation Failed',
      context: {
        runId: ctx.runId,
        validation: validationResult,
        files: [{
          path: `${outputDir}/phase11-validation-report.json`,
          format: 'json',
          content: JSON.stringify(validationResult, null, 2)
        }]
      }
    });
  }

  artifacts.push(...validationResult.artifacts);

  // ============================================================================
  // PHASE 12: SUPPORT CHANNELS AND FEEDBACK MECHANISMS
  // ============================================================================

  ctx.log('info', 'Phase 12: Setting up support channels and feedback mechanisms');

  const supportResult = await ctx.task(platformSupportSetupTask, {
    projectName,
    platformInfo: coreDeployment,
    organization,
    outputDir
  });

  if (!supportResult.success) {
    ctx.log('warn', 'Support channels setup incomplete, but continuing');
  } else {
    artifacts.push(...supportResult.artifacts);
    platformInfo.support = supportResult;
  }

  ctx.log('info', `Support channels configured - ${supportResult.channels.length} channels, SLA: ${supportResult.slaResponse}`);

  // ============================================================================
  // PHASE 13: ADOPTION METRICS AND MONITORING SETUP
  // ============================================================================

  ctx.log('info', 'Phase 13: Setting up adoption metrics and platform monitoring');

  const metricsResult = await ctx.task(adoptionMetricsSetupTask, {
    projectName,
    platformInfo: coreDeployment,
    serviceCatalog: serviceCatalogResult,
    organization,
    targetAdoption,
    outputDir
  });

  if (!metricsResult.success) {
    return {
      success: false,
      error: 'Failed to set up adoption metrics',
      details: metricsResult,
      metadata: {
        processId: 'specializations/devops-sre-platform/idp-setup',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...metricsResult.artifacts);
  adoptionScore = metricsResult.currentAdoptionScore;
  platformInfo.metrics = metricsResult;

  ctx.log('info', `Adoption metrics configured - Current adoption: ${adoptionScore}%, Target: ${targetAdoption}%`);

  // ============================================================================
  // PHASE 14: ROLLOUT PLAN AND COMMUNICATION
  // ============================================================================

  ctx.log('info', 'Phase 14: Creating rollout plan and communication strategy');

  const rolloutPlanResult = await ctx.task(platformRolloutPlanTask, {
    projectName,
    platformInfo: coreDeployment,
    organization,
    pilot: pilotResult,
    targetAdoption,
    outputDir
  });

  if (!rolloutPlanResult.success) {
    return {
      success: false,
      error: 'Failed to create rollout plan',
      details: rolloutPlanResult,
      metadata: {
        processId: 'specializations/devops-sre-platform/idp-setup',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...rolloutPlanResult.artifacts);
  platformInfo.rollout = rolloutPlanResult;

  ctx.log('info', `Rollout plan created - ${rolloutPlanResult.phases.length} phases over ${rolloutPlanResult.estimatedDuration} weeks`);

  // ============================================================================
  // FINAL QUALITY GATE AND LAUNCH APPROVAL
  // ============================================================================

  const overallScore = (
    (validationResult.validationScore || 0) +
    (pilotResult.satisfactionScore * 10 || 0) +
    adoptionScore +
    (onboardingResult.onboardingScore || 0)
  ) / 4;

  const readinessThreshold = 75;

  ctx.log('info', `Overall platform readiness score: ${overallScore.toFixed(1)}/100`);

  await ctx.breakpoint({
    question: `Final Review: Internal Developer Platform ${projectName} is ready for launch. Readiness score: ${overallScore.toFixed(1)}/100 (threshold: ${readinessThreshold}). ${rolloutPlanResult.phases.length}-phase rollout over ${rolloutPlanResult.estimatedDuration} weeks. Approve for launch?`,
    title: 'Final Platform Launch Review',
    context: {
      runId: ctx.runId,
      overallScore,
      readinessThreshold,
      platformInfo: {
        platformUrl: coreDeployment.platformUrl,
        servicesInCatalog: serviceCatalogResult.services.length,
        templatesAvailable: allTemplates.length,
        currentAdoption: adoptionScore,
        targetAdoption,
        pilotTeams: pilotResult.teamsOnboarded,
        pilotSatisfaction: pilotResult.satisfactionScore
      },
      rollout: {
        phases: rolloutPlanResult.phases.length,
        estimatedDuration: rolloutPlanResult.estimatedDuration,
        estimatedCost: architectureResult.estimatedMonthlyCost
      },
      files: [
        {
          path: `${outputDir}/platform-summary.json`,
          format: 'json',
          content: JSON.stringify({
            platformInfo,
            services: services.length,
            templates: templates.length,
            onboarding,
            artifacts: artifacts.length
          }, null, 2)
        },
        {
          path: `${outputDir}/rollout-plan.md`,
          format: 'markdown',
          content: rolloutPlanResult.rolloutPlan || 'Rollout plan generation pending'
        },
        {
          path: `${outputDir}/executive-summary.md`,
          format: 'markdown',
          content: rolloutPlanResult.executiveSummary || 'Executive summary pending'
        }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  ctx.log('info', `Internal Developer Platform setup completed in ${duration}ms`);
  ctx.log('info', `Platform URL: ${coreDeployment.platformUrl}`);
  ctx.log('info', `Service Catalog: ${serviceCatalogResult.services.length} services`);
  ctx.log('info', `Golden Path Templates: ${allTemplates.length}`);
  ctx.log('info', `Readiness Score: ${overallScore.toFixed(1)}/100`);

  return {
    success: true,
    projectName,
    platformInfo,
    services: serviceCatalogResult.services,
    templates: allTemplates,
    onboarding,
    artifacts,
    overallScore,
    readinessThreshold,
    summary: {
      platformUrl: coreDeployment.platformUrl,
      platformType,
      platformScope,
      servicesInCatalog: serviceCatalogResult.services.length,
      goldenPathTemplates: allTemplates.length,
      selfServiceWorkflows: 3,
      pilotTeamsOnboarded: pilotResult.teamsOnboarded,
      pilotServicesCreated: pilotResult.servicesCreated,
      currentAdoption: adoptionScore,
      targetAdoption,
      readinessScore: overallScore,
      rolloutPhases: rolloutPlanResult.phases.length,
      estimatedRolloutDuration: rolloutPlanResult.estimatedDuration,
      estimatedMonthlyCost: architectureResult.estimatedMonthlyCost,
      observabilityIntegrated: observabilityIntegration.success,
      costTrackingEnabled: costTracking.success
    },
    metadata: {
      processId: 'specializations/devops-sre-platform/idp-setup',
      processSlug: 'idp-setup',
      category: 'platform-engineering',
      specializationSlug: 'devops-sre-platform',
      timestamp: startTime,
      duration,
      version: '1.0.0'
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const developerNeedsAssessmentTask = defineTask('developer-needs-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Assess Developer Needs: ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Platform Engineering Lead specialized in developer experience',
      task: 'Conduct comprehensive developer needs assessment to identify pain points and requirements',
      context: args,
      instructions: [
        'Survey developers about current pain points in development workflow',
        'Identify common tasks that are manual and repetitive',
        'Assess time spent on toil (deployment, environment setup, debugging)',
        'Identify inconsistencies across teams (different tools, processes)',
        'Document current onboarding process and time-to-first-deployment',
        'Assess observability and debugging capabilities',
        'Identify compliance and security requirements',
        'Gather requirements for self-service capabilities',
        'Prioritize pain points by impact and frequency',
        'Create requirements document with prioritized feature list'
      ],
      outputFormat: 'JSON with success, painPoints, requirements, topPainPoints, prioritizedFeatures, currentState, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'painPoints', 'requirements', 'topPainPoints', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        painPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              area: { type: 'string' },
              description: { type: 'string' },
              impact: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              frequency: { type: 'string' }
            }
          }
        },
        requirements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              feature: { type: 'string' },
              priority: { type: 'string', enum: ['must-have', 'should-have', 'nice-to-have'] },
              reason: { type: 'string' }
            }
          }
        },
        topPainPoints: { type: 'array', items: { type: 'string' } },
        prioritizedFeatures: { type: 'array', items: { type: 'string' } },
        currentState: {
          type: 'object',
          properties: {
            avgTimeToFirstDeployment: { type: 'string' },
            avgDeploymentTime: { type: 'string' },
            manualStepsCount: { type: 'number' },
            toolsUsed: { type: 'array', items: { type: 'string' } }
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
  labels: ['idp', 'discovery', 'assessment', args.projectName]
}));

export const platformArchitectureDesignTask = defineTask('platform-architecture-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design Platform Architecture: ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior Platform Architect',
      task: 'Design comprehensive internal developer platform architecture',
      context: args,
      instructions: [
        'Select platform tool (Backstage, Port, Kratix, or custom)',
        `Design architecture for ${args.platformScope} scope`,
        'Identify core components (service catalog, templates, workflows)',
        `Select integrations based on infrastructure: ${args.infrastructure.cloudProvider}, ${args.infrastructure.cicdTool}, ${args.infrastructure.monitoring}`,
        'Design authentication and authorization (SSO, RBAC)',
        'Plan service catalog structure and metadata',
        'Design template system for golden paths',
        'Plan observability integration',
        'Design cost tracking and attribution',
        'Plan compliance and security controls',
        'Create architecture diagram and component relationships',
        'Estimate monthly infrastructure costs',
        'Document design decisions and rationale'
      ],
      outputFormat: 'JSON with success, platformTool, components, integrations, designScore, estimatedMonthlyCost, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'platformTool', 'components', 'integrations', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        platformTool: { type: 'string' },
        platformVersion: { type: 'string' },
        components: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              purpose: { type: 'string' },
              technology: { type: 'string' }
            }
          }
        },
        integrations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              system: { type: 'string' },
              purpose: { type: 'string' },
              method: { type: 'string' }
            }
          }
        },
        designScore: { type: 'number', minimum: 0, maximum: 100 },
        estimatedMonthlyCost: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['idp', 'architecture', 'design', args.platformType]
}));

export const platformCoreDeploymentTask = defineTask('platform-core-deployment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Deploy Platform Core: ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps Engineer specialized in platform deployment',
      task: 'Deploy core internal developer platform infrastructure',
      context: args,
      instructions: [
        `Deploy ${args.platformType} platform core`,
        'Configure infrastructure (Kubernetes, compute, networking)',
        'Set up load balancer and ingress',
        'Configure SSL/TLS certificates',
        'Set up container registry integration',
        'Configure backup and disaster recovery',
        'Enable monitoring and logging',
        'Configure resource limits and autoscaling',
        'Test platform accessibility and health',
        'Generate deployment documentation'
      ],
      outputFormat: 'JSON with success, platformUrl, version, deployed, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'platformUrl', 'version', 'deployed', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        platformUrl: { type: 'string' },
        version: { type: 'string' },
        deployed: { type: 'boolean' },
        ingressController: { type: 'string' },
        sslEnabled: { type: 'boolean' },
        healthCheckUrl: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['idp', 'deployment', 'core', args.platformType]
}));

export const platformDatabaseSetupTask = defineTask('platform-database-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Platform Database: ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Database Administrator',
      task: 'Set up database for platform data storage',
      context: args,
      instructions: [
        'Select appropriate database (PostgreSQL, MySQL, MongoDB)',
        'Provision database instance or cluster',
        'Configure high availability and replication',
        'Set up automated backups',
        'Configure connection pooling',
        'Initialize database schema',
        'Set up monitoring and alerting',
        'Test database connectivity and performance',
        'Generate database connection details'
      ],
      outputFormat: 'JSON with success, databaseType, connectionUrl, backupEnabled, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'databaseType', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        databaseType: { type: 'string' },
        databaseVersion: { type: 'string' },
        connectionUrl: { type: 'string' },
        backupEnabled: { type: 'boolean' },
        replicationEnabled: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['idp', 'database', 'setup']
}));

export const platformAuthenticationSetupTask = defineTask('platform-authentication-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Authentication: ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Engineer specialized in authentication',
      task: 'Configure authentication and authorization for platform',
      context: args,
      instructions: [
        'Select authentication provider (OAuth, SAML, LDAP, OIDC)',
        'Configure SSO integration with corporate identity provider',
        'Set up RBAC (Role-Based Access Control)',
        'Define user roles (admin, developer, viewer)',
        'Configure team-based permissions',
        'Set up API authentication (tokens, service accounts)',
        'Enable MFA (Multi-Factor Authentication)',
        'Configure session management',
        'Test authentication flows',
        'Generate authentication documentation'
      ],
      outputFormat: 'JSON with success, authProvider, ssoEnabled, rbacEnabled, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'authProvider', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        authProvider: { type: 'string' },
        ssoEnabled: { type: 'boolean' },
        rbacEnabled: { type: 'boolean' },
        mfaEnabled: { type: 'boolean' },
        roles: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['idp', 'authentication', 'security']
}));

export const serviceCatalogSetupTask = defineTask('service-catalog-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Service Catalog: ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Platform Engineer',
      task: 'Set up service catalog and register existing services',
      context: args,
      instructions: [
        'Design service catalog structure and metadata schema',
        'Configure service discovery mechanisms',
        'Register existing services in catalog',
        'Add service metadata (owner, type, dependencies, SLOs)',
        'Configure API documentation integration',
        'Set up service health status indicators',
        'Configure service relationships and dependencies',
        'Add links to observability dashboards',
        'Test catalog search and navigation',
        'Generate catalog documentation'
      ],
      outputFormat: 'JSON with success, services, catalogUrl, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'services', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        services: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              owner: { type: 'string' },
              status: { type: 'string' }
            }
          }
        },
        catalogUrl: { type: 'string' },
        metadata: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['idp', 'service-catalog', 'setup']
}));

export const goldenPathTemplateTask = defineTask('golden-path-template', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create Golden Path Template: ${args.templateType}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior Software Engineer and Template Developer',
      task: 'Create golden path service template with best practices',
      context: args,
      instructions: [
        `Create ${args.templateType} service template`,
        'Include project structure and boilerplate code',
        'Add CI/CD pipeline configuration',
        'Include Dockerfile and container configuration',
        'Add Kubernetes manifests (Deployment, Service, Ingress)',
        'Include observability instrumentation (metrics, logs, traces)',
        'Add health check endpoints',
        'Include security scanning configuration',
        'Add comprehensive README and documentation',
        'Include example tests (unit, integration)',
        'Add infrastructure as code (Terraform)',
        'Generate template manifest and metadata'
      ],
      outputFormat: 'JSON with success, templateName, templateType, templatePath, features, cicdIncluded, observabilityIncluded, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'templateName', 'templateType', 'templatePath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        templateName: { type: 'string' },
        templateType: { type: 'string' },
        templatePath: { type: 'string' },
        features: { type: 'array', items: { type: 'string' } },
        cicdIncluded: { type: 'boolean' },
        observabilityIncluded: { type: 'boolean' },
        securityIncluded: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['idp', 'golden-path', 'template', args.templateType]
}));

export const selfServiceWorkflowTask = defineTask('self-service-workflow', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement Self-Service Workflow: ${args.workflowType}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Platform Automation Engineer',
      task: 'Implement self-service workflow for developers',
      context: args,
      instructions: [
        `Create ${args.workflowType} workflow`,
        'Design workflow UI and user inputs',
        'Implement workflow automation logic',
        'Add validation and error handling',
        'Configure approval gates if needed',
        'Add progress tracking and notifications',
        'Implement rollback capabilities',
        'Add audit logging',
        'Test workflow end-to-end',
        'Generate workflow documentation'
      ],
      outputFormat: 'JSON with success, workflowName, workflowType, steps, automated, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'workflowName', 'workflowType', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        workflowName: { type: 'string' },
        workflowType: { type: 'string' },
        steps: { type: 'array', items: { type: 'string' } },
        automated: { type: 'boolean' },
        approvalRequired: { type: 'boolean' },
        estimatedDuration: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['idp', 'self-service', 'workflow', args.workflowType]
}));

export const observabilityIntegrationTask = defineTask('observability-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Integrate Observability: ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Observability Engineer',
      task: 'Integrate platform with observability systems',
      context: args,
      instructions: [
        'Configure platform metrics collection',
        'Create platform health dashboards',
        'Add service-level dashboards to catalog',
        'Configure alerting for platform issues',
        'Integrate with existing monitoring stack',
        'Add links from catalog to dashboards',
        'Configure distributed tracing',
        'Set up log aggregation for platform logs',
        'Test observability integration',
        'Generate observability documentation'
      ],
      outputFormat: 'JSON with success, dashboards, alertsConfigured, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'dashboards', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        dashboards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              url: { type: 'string' },
              type: { type: 'string' }
            }
          }
        },
        alertsConfigured: { type: 'number' },
        metricsIntegrated: { type: 'boolean' },
        logsIntegrated: { type: 'boolean' },
        tracesIntegrated: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['idp', 'observability', 'integration']
}));

export const costTrackingSetupTask = defineTask('cost-tracking-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Cost Tracking: ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'FinOps Engineer',
      task: 'Set up cost tracking and attribution for platform',
      context: args,
      instructions: [
        'Configure cloud cost data collection',
        'Set up cost allocation tags',
        'Create cost attribution by service/team',
        'Build cost dashboards',
        'Configure cost anomaly detection',
        'Set up budget alerts',
        'Add cost visibility to service catalog',
        'Create cost optimization recommendations',
        'Test cost tracking accuracy',
        'Generate cost reporting documentation'
      ],
      outputFormat: 'JSON with success, costDashboardUrl, attributionEnabled, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        costDashboardUrl: { type: 'string' },
        attributionEnabled: { type: 'boolean' },
        budgetAlertsEnabled: { type: 'boolean' },
        anomalyDetectionEnabled: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['idp', 'cost-tracking', 'finops']
}));

export const developerPortalSetupTask = defineTask('developer-portal-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Developer Portal: ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Developer Experience Engineer',
      task: 'Build comprehensive developer portal with documentation',
      context: args,
      instructions: [
        'Create developer portal home page',
        'Build getting started guide',
        'Add service template documentation',
        'Create workflow usage guides',
        'Add architecture documentation',
        'Include best practices and guidelines',
        'Create troubleshooting guides',
        'Add API documentation',
        'Include FAQs',
        'Add contact and support information',
        'Test portal navigation and search',
        'Generate portal content'
      ],
      outputFormat: 'JSON with success, portalUrl, documentationPages, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'portalUrl', 'documentationPages', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        portalUrl: { type: 'string' },
        documentationPages: { type: 'number' },
        searchEnabled: { type: 'boolean' },
        apiDocsIncluded: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['idp', 'developer-portal', 'documentation']
}));

export const developerOnboardingTask = defineTask('developer-onboarding', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create Developer Onboarding: ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Developer Advocate and Training Specialist',
      task: 'Create comprehensive developer onboarding program',
      context: args,
      instructions: [
        'Create step-by-step onboarding tutorial',
        'Build interactive walkthrough for first service creation',
        'Create video tutorials for common tasks',
        'Set up sandbox environment for experimentation',
        'Create onboarding checklist',
        'Add hands-on exercises',
        'Create reference card for common operations',
        'Set up feedback mechanism',
        'Measure time-to-first-deployment',
        'Generate onboarding materials'
      ],
      outputFormat: 'JSON with success, tutorials, videos, sandboxEnvironment, estimatedTimeToFirstDeployment, onboardingScore, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'tutorials', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        tutorials: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              duration: { type: 'string' },
              difficulty: { type: 'string' }
            }
          }
        },
        videos: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              duration: { type: 'string' }
            }
          }
        },
        sandboxEnvironment: { type: 'boolean' },
        estimatedTimeToFirstDeployment: { type: 'number', description: 'Minutes' },
        onboardingScore: { type: 'number', minimum: 0, maximum: 100 },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['idp', 'onboarding', 'training']
}));

export const platformPilotProgramTask = defineTask('platform-pilot-program', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run Pilot Program: ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Platform Product Manager',
      task: 'Execute pilot program with initial teams',
      context: args,
      instructions: [
        `Onboard ${args.pilotTeamCount} pilot teams`,
        'Provide hands-on training and support',
        'Guide teams through service creation',
        'Monitor usage and adoption',
        'Collect feedback and identify issues',
        'Measure time-to-first-deployment',
        'Track satisfaction and usability',
        'Document common questions and issues',
        'Implement quick fixes and improvements',
        'Generate pilot program report'
      ],
      outputFormat: 'JSON with success, teamsOnboarded, servicesCreated, satisfactionScore, issuesIdentified, improvements, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'teamsOnboarded', 'servicesCreated', 'satisfactionScore', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        teamsOnboarded: { type: 'number' },
        developersOnboarded: { type: 'number' },
        servicesCreated: { type: 'number' },
        deploymentsExecuted: { type: 'number' },
        satisfactionScore: { type: 'number', minimum: 0, maximum: 10 },
        avgTimeToFirstDeployment: { type: 'number', description: 'Minutes' },
        issuesIdentified: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              severity: { type: 'string' },
              resolved: { type: 'boolean' }
            }
          }
        },
        improvements: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['idp', 'pilot', 'testing']
}));

export const platformValidationTask = defineTask('platform-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validate Platform: ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Platform QA Engineer',
      task: 'Validate platform functionality and performance',
      context: args,
      instructions: [
        'Test service catalog functionality',
        'Validate service template generation',
        'Test self-service workflows end-to-end',
        'Verify authentication and authorization',
        'Test observability integration',
        'Validate cost tracking accuracy',
        'Test platform performance under load',
        'Verify backup and disaster recovery',
        'Test platform scalability',
        'Identify critical issues and blockers',
        'Generate validation report'
      ],
      outputFormat: 'JSON with success, validationScore, testsPassed, testsFailed, criticalIssues, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'validationScore', 'testsPassed', 'testsFailed', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        validationScore: { type: 'number', minimum: 0, maximum: 100 },
        testsPassed: { type: 'number' },
        testsFailed: { type: 'number' },
        testsTotal: { type: 'number' },
        criticalIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              severity: { type: 'string' },
              component: { type: 'string' }
            }
          }
        },
        performanceMetrics: {
          type: 'object',
          properties: {
            avgResponseTime: { type: 'number' },
            maxConcurrentUsers: { type: 'number' }
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
  labels: ['idp', 'validation', 'testing']
}));

export const platformSupportSetupTask = defineTask('platform-support-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Support Channels: ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Developer Support Lead',
      task: 'Set up support channels and feedback mechanisms',
      context: args,
      instructions: [
        'Create Slack/Teams channel for platform support',
        'Set up ticketing system integration',
        'Create support documentation and runbooks',
        'Define SLAs for different support tiers',
        'Set up feedback collection mechanism',
        'Create office hours schedule',
        'Set up status page for platform health',
        'Configure alerting for platform team',
        'Document escalation procedures',
        'Generate support documentation'
      ],
      outputFormat: 'JSON with success, channels, slaResponse, feedbackMechanism, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'channels', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        channels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              name: { type: 'string' },
              url: { type: 'string' }
            }
          }
        },
        slaResponse: { type: 'string' },
        feedbackMechanism: { type: 'string' },
        statusPageUrl: { type: 'string' },
        officeHoursSchedule: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['idp', 'support', 'feedback']
}));

export const adoptionMetricsSetupTask = defineTask('adoption-metrics-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Adoption Metrics: ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Platform Analytics Engineer',
      task: 'Set up adoption metrics and monitoring',
      context: args,
      instructions: [
        'Define key adoption metrics (active users, services created, deployments)',
        'Set up metrics collection and dashboards',
        'Track time-to-first-deployment',
        'Monitor template usage',
        'Track workflow completion rates',
        'Measure developer satisfaction (NPS)',
        'Calculate current adoption percentage',
        'Set up alerts for adoption goals',
        'Create adoption reporting',
        'Generate metrics documentation'
      ],
      outputFormat: 'JSON with success, currentAdoptionScore, metrics, dashboardUrl, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'currentAdoptionScore', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        currentAdoptionScore: { type: 'number', minimum: 0, maximum: 100 },
        metrics: {
          type: 'object',
          properties: {
            activeUsers: { type: 'number' },
            servicesCreated: { type: 'number' },
            deploymentsExecuted: { type: 'number' },
            avgTimeToFirstDeployment: { type: 'number' }
          }
        },
        dashboardUrl: { type: 'string' },
        npsScore: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['idp', 'metrics', 'adoption']
}));

export const platformRolloutPlanTask = defineTask('platform-rollout-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create Rollout Plan: ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Platform Product Manager and Change Management Specialist',
      task: 'Create comprehensive rollout plan and communication strategy',
      context: args,
      instructions: [
        'Design phased rollout approach',
        'Identify rollout phases and team groupings',
        'Create timeline for each phase',
        'Plan training and onboarding sessions',
        'Design communication strategy (announcements, demos, Q&A)',
        'Create rollout checklist',
        'Plan success criteria for each phase',
        'Identify risks and mitigation strategies',
        'Create executive summary',
        'Generate rollout plan document'
      ],
      outputFormat: 'JSON with success, phases, estimatedDuration, rolloutPlan, executiveSummary, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'phases', 'estimatedDuration', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              teams: { type: 'number' },
              duration: { type: 'string' },
              goals: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        estimatedDuration: { type: 'number', description: 'Weeks' },
        rolloutPlan: { type: 'string', description: 'Markdown content' },
        executiveSummary: { type: 'string', description: 'Markdown content' },
        communicationPlan: { type: 'array', items: { type: 'string' } },
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              mitigation: { type: 'string' }
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
  labels: ['idp', 'rollout', 'planning']
}));
