/**
 * @process specializations/software-architecture/devops-architecture-alignment
 * @description DevOps Architecture Alignment - Comprehensive process for aligning software architecture with DevOps practices,
 * ensuring continuous integration, deployment, delivery pipelines, release strategies, zero-downtime deployments, feature flags,
 * rollback mechanisms, and deployment monitoring with industry best practices and quality gates.
 * @inputs { projectName: string, deploymentTarget?: string, releaseFrequency?: string, scalabilityRequirements?: object, constraints?: object }
 * @outputs { success: boolean, cicdArchitecture: object, deploymentStrategy: object, releaseChecklist: array, rollbackProcedures: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/software-architecture/devops-architecture-alignment', {
 *   projectName: 'E-Commerce Platform',
 *   deploymentTarget: 'kubernetes',
 *   releaseFrequency: 'multiple-per-day',
 *   scalabilityRequirements: {
 *     targetLoad: '100K concurrent users',
 *     availability: '99.99%',
 *     regions: ['us-east', 'us-west', 'eu-central']
 *   },
 *   constraints: {
 *     downtime: 'zero',
 *     rollbackTime: '< 5 minutes',
 *     deploymentWindow: 'anytime'
 *   }
 * });
 *
 * @references
 * - DevOps Handbook: https://itrevolution.com/the-devops-handbook/
 * - Continuous Delivery: https://continuousdelivery.com/
 * - Kubernetes Best Practices: https://kubernetes.io/docs/concepts/
 * - Feature Flags: https://martinfowler.com/articles/feature-toggles.html
 * - Blue-Green Deployment: https://martinfowler.com/bliki/BlueGreenDeployment.html
 * - Canary Releases: https://martinfowler.com/bliki/CanaryRelease.html
 * - GitOps: https://www.gitops.tech/
 * - Site Reliability Engineering: https://sre.google/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    deploymentTarget = 'kubernetes', // 'kubernetes', 'aws-ecs', 'docker-swarm', 'vm', 'serverless', 'hybrid'
    releaseFrequency = 'multiple-per-day', // 'multiple-per-day', 'daily', 'weekly', 'on-demand'
    scalabilityRequirements = {
      targetLoad: '50K concurrent users',
      availability: '99.9%',
      regions: ['us-east', 'us-west']
    },
    constraints = {
      downtime: 'zero', // 'zero', 'minimal', 'planned-windows'
      rollbackTime: '< 5 minutes',
      deploymentWindow: 'anytime', // 'anytime', 'business-hours-only', 'off-hours'
      complianceRequirements: []
    },
    currentCICD = {},
    existingInfrastructure = {},
    teamSize = 'medium', // 'small', 'medium', 'large', 'enterprise'
    outputDir = 'devops-architecture-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let cicdArchitecture = {};
  let deploymentStrategy = {};
  let releaseChecklist = [];
  let rollbackProcedures = {};
  let monitoringPlan = {};

  ctx.log('info', `Starting DevOps Architecture Alignment for ${projectName}`);
  ctx.log('info', `Deployment Target: ${deploymentTarget}, Release Frequency: ${releaseFrequency}`);
  ctx.log('info', `Scalability: ${scalabilityRequirements.targetLoad}, Availability: ${scalabilityRequirements.availability}`);

  // ============================================================================
  // PHASE 1: CURRENT STATE ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Assessing current CI/CD and deployment architecture');

  const currentStateAssessment = await ctx.task(currentStateAssessmentTask, {
    projectName,
    currentCICD,
    existingInfrastructure,
    teamSize,
    deploymentTarget,
    outputDir
  });

  if (!currentStateAssessment.success) {
    return {
      success: false,
      error: 'Failed to complete current state assessment',
      details: currentStateAssessment,
      metadata: {
        processId: 'specializations/software-architecture/devops-architecture-alignment',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...currentStateAssessment.artifacts);

  // Quality Gate: Critical pain points and gaps identified
  const criticalGaps = currentStateAssessment.gaps.filter(g => g.severity === 'critical');

  if (criticalGaps.length > 0) {
    await ctx.breakpoint({
      question: `Current state assessment found ${criticalGaps.length} critical gaps: ${criticalGaps.map(g => g.area).join(', ')}. Review assessment and continue?`,
      title: 'Current State Assessment - Critical Gaps Identified',
      context: {
        runId: ctx.runId,
        criticalGaps,
        allGaps: currentStateAssessment.gaps,
        painPoints: currentStateAssessment.painPoints,
        recommendation: 'Review identified gaps and prioritize fixes in upcoming architecture design',
        files: currentStateAssessment.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
      }
    });
  }

  // ============================================================================
  // PHASE 2: CI/CD PIPELINE ARCHITECTURE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing CI/CD pipeline architecture');

  const pipelineDesign = await ctx.task(cicdPipelineDesignTask, {
    projectName,
    deploymentTarget,
    releaseFrequency,
    currentStateAssessment,
    scalabilityRequirements,
    constraints,
    teamSize,
    outputDir
  });

  artifacts.push(...pipelineDesign.artifacts);
  cicdArchitecture = pipelineDesign.architecture;

  // Quality Gate: Pipeline stages completeness
  const requiredStages = ['source-control', 'build', 'test', 'security-scan', 'artifact-storage', 'deployment'];
  const missingStages = requiredStages.filter(stage =>
    !pipelineDesign.architecture.stages.some(s => s.type === stage)
  );

  if (missingStages.length > 0) {
    await ctx.breakpoint({
      question: `CI/CD pipeline missing critical stages: ${missingStages.join(', ')}. Review pipeline design?`,
      title: 'CI/CD Pipeline Completeness Check',
      context: {
        runId: ctx.runId,
        missingStages,
        currentStages: pipelineDesign.architecture.stages.map(s => s.type),
        recommendation: 'Add missing stages to ensure comprehensive CI/CD coverage',
        files: [{
          path: pipelineDesign.pipelineDiagramPath,
          format: 'markdown',
          label: 'Pipeline Architecture Diagram'
        }]
      }
    });
  }

  // Breakpoint: Review CI/CD architecture
  await ctx.breakpoint({
    question: `Review CI/CD pipeline architecture for ${projectName}. Pipeline includes ${pipelineDesign.architecture.stages.length} stages with ${pipelineDesign.automation.level}% automation. Approve to proceed with deployment strategy?`,
    title: 'CI/CD Pipeline Architecture Review',
    context: {
      runId: ctx.runId,
      projectName,
      pipelineArchitecture: pipelineDesign.architecture,
      automationMetrics: pipelineDesign.automation,
      estimatedBuildTime: pipelineDesign.performance.estimatedBuildTime,
      tooling: pipelineDesign.tooling,
      files: [{
        path: pipelineDesign.pipelineDiagramPath,
        format: 'markdown',
        label: 'Pipeline Diagram'
      }, {
        path: pipelineDesign.architectureDocPath,
        format: 'markdown',
        label: 'Architecture Documentation'
      }]
    }
  });

  // ============================================================================
  // PHASE 3: DEPLOYMENT STRATEGY DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 3: Designing deployment strategy and release patterns');

  const deploymentStrategyDesign = await ctx.task(deploymentStrategyDesignTask, {
    projectName,
    deploymentTarget,
    releaseFrequency,
    scalabilityRequirements,
    constraints,
    cicdArchitecture: pipelineDesign.architecture,
    outputDir
  });

  artifacts.push(...deploymentStrategyDesign.artifacts);
  deploymentStrategy = deploymentStrategyDesign.strategy;

  // Quality Gate: Deployment strategy supports zero-downtime if required
  if (constraints.downtime === 'zero' && !deploymentStrategyDesign.strategy.supportsZeroDowntime) {
    await ctx.breakpoint({
      question: `Deployment strategy does not support zero-downtime requirement. Current strategy: ${deploymentStrategyDesign.strategy.pattern}. Revise strategy?`,
      title: 'Zero-Downtime Requirement Not Met',
      context: {
        runId: ctx.runId,
        requiredDowntime: constraints.downtime,
        currentStrategy: deploymentStrategyDesign.strategy,
        recommendation: 'Consider blue-green, canary, or rolling deployment patterns',
        files: deploymentStrategyDesign.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
      }
    });
  }

  // ============================================================================
  // PHASE 4: PARALLEL EXECUTION - FEATURE FLAGS & INFRASTRUCTURE AS CODE
  // ============================================================================

  ctx.log('info', 'Phase 4: Designing feature flags and Infrastructure as Code (parallel)');

  const [featureFlagsDesign, iacDesign] = await ctx.parallel.all([
    ctx.task(featureFlagsDesignTask, {
      projectName,
      deploymentStrategy: deploymentStrategyDesign.strategy,
      releaseFrequency,
      outputDir
    }),
    ctx.task(infrastructureAsCodeDesignTask, {
      projectName,
      deploymentTarget,
      scalabilityRequirements,
      existingInfrastructure,
      outputDir
    })
  ]);

  artifacts.push(...featureFlagsDesign.artifacts);
  artifacts.push(...iacDesign.artifacts);

  // ============================================================================
  // PHASE 5: ROLLBACK PROCEDURES AND DISASTER RECOVERY
  // ============================================================================

  ctx.log('info', 'Phase 5: Designing rollback procedures and disaster recovery');

  const rollbackDesign = await ctx.task(rollbackProceduresDesignTask, {
    projectName,
    deploymentStrategy: deploymentStrategyDesign.strategy,
    constraints,
    deploymentTarget,
    featureFlagsDesign,
    outputDir
  });

  artifacts.push(...rollbackDesign.artifacts);
  rollbackProcedures = rollbackDesign.procedures;

  // Quality Gate: Rollback procedures meet time constraint
  if (rollbackDesign.estimatedRollbackTime > constraints.rollbackTime) {
    await ctx.breakpoint({
      question: `Estimated rollback time (${rollbackDesign.estimatedRollbackTime}) exceeds constraint (${constraints.rollbackTime}). Review procedures?`,
      title: 'Rollback Time Constraint',
      context: {
        runId: ctx.runId,
        estimatedTime: rollbackDesign.estimatedRollbackTime,
        requiredTime: constraints.rollbackTime,
        procedures: rollbackDesign.procedures,
        recommendation: 'Optimize rollback procedures or adjust automation level',
        files: rollbackDesign.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
      }
    });
  }

  // ============================================================================
  // PHASE 6: DEPLOYMENT MONITORING AND OBSERVABILITY
  // ============================================================================

  ctx.log('info', 'Phase 6: Designing deployment monitoring and observability');

  const monitoringDesign = await ctx.task(deploymentMonitoringDesignTask, {
    projectName,
    deploymentTarget,
    deploymentStrategy: deploymentStrategyDesign.strategy,
    scalabilityRequirements,
    outputDir
  });

  artifacts.push(...monitoringDesign.artifacts);
  monitoringPlan = monitoringDesign.plan;

  // Quality Gate: Critical SLIs defined
  const requiredSLIs = ['latency', 'error-rate', 'availability', 'throughput'];
  const missingSLIs = requiredSLIs.filter(sli =>
    !monitoringDesign.plan.slis.some(s => s.type === sli)
  );

  if (missingSLIs.length > 0) {
    await ctx.breakpoint({
      question: `Monitoring plan missing critical SLIs: ${missingSLIs.join(', ')}. Review monitoring design?`,
      title: 'Monitoring Completeness Check',
      context: {
        runId: ctx.runId,
        missingSLIs,
        definedSLIs: monitoringDesign.plan.slis.map(s => s.type),
        recommendation: 'Add missing SLIs to ensure comprehensive monitoring',
        files: monitoringDesign.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
      }
    });
  }

  // ============================================================================
  // PHASE 7: RELEASE CHECKLIST AND RUNBOOKS
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating release checklist and operational runbooks');

  const releaseChecklistCreation = await ctx.task(releaseChecklistCreationTask, {
    projectName,
    cicdArchitecture: pipelineDesign.architecture,
    deploymentStrategy: deploymentStrategyDesign.strategy,
    rollbackProcedures,
    monitoringPlan,
    constraints,
    outputDir
  });

  artifacts.push(...releaseChecklistCreation.artifacts);
  releaseChecklist = releaseChecklistCreation.checklist;

  // ============================================================================
  // PHASE 8: IMPLEMENTATION ROADMAP AND DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Creating implementation roadmap and comprehensive documentation');

  const implementationRoadmap = await ctx.task(implementationRoadmapTask, {
    projectName,
    currentStateAssessment,
    cicdArchitecture: pipelineDesign.architecture,
    deploymentStrategy: deploymentStrategyDesign.strategy,
    featureFlagsDesign,
    iacDesign,
    rollbackProcedures,
    monitoringPlan,
    releaseChecklist,
    teamSize,
    outputDir
  });

  artifacts.push(...implementationRoadmap.artifacts);

  // Final Breakpoint: Review complete DevOps architecture
  await ctx.breakpoint({
    question: `DevOps Architecture Alignment complete for ${projectName}. Review comprehensive architecture including CI/CD pipeline, deployment strategy (${deploymentStrategyDesign.strategy.pattern}), rollback procedures, and monitoring plan. Approve for implementation?`,
    title: 'Final DevOps Architecture Review',
    context: {
      runId: ctx.runId,
      projectName,
      summary: {
        cicdStages: pipelineDesign.architecture.stages.length,
        deploymentPattern: deploymentStrategyDesign.strategy.pattern,
        zeroDowntime: deploymentStrategyDesign.strategy.supportsZeroDowntime,
        rollbackTime: rollbackDesign.estimatedRollbackTime,
        monitoringSLIs: monitoringDesign.plan.slis.length,
        releaseChecklistItems: releaseChecklist.length,
        implementationPhases: implementationRoadmap.phases.length,
        estimatedImplementationTime: implementationRoadmap.estimatedDuration
      },
      artifacts,
      files: [{
        path: implementationRoadmap.executiveSummaryPath,
        format: 'markdown',
        label: 'Executive Summary'
      }, {
        path: implementationRoadmap.roadmapPath,
        format: 'markdown',
        label: 'Implementation Roadmap'
      }]
    }
  });

  // ============================================================================
  // FINAL OUTPUT
  // ============================================================================

  const duration = ctx.now() - startTime;

  ctx.log('info', `DevOps Architecture Alignment completed in ${duration}ms`);
  ctx.log('info', `Generated ${artifacts.length} artifacts`);
  ctx.log('info', `CI/CD Pipeline: ${pipelineDesign.architecture.stages.length} stages`);
  ctx.log('info', `Deployment Strategy: ${deploymentStrategyDesign.strategy.pattern}`);
  ctx.log('info', `Rollback Time: ${rollbackDesign.estimatedRollbackTime}`);
  ctx.log('info', `Monitoring SLIs: ${monitoringDesign.plan.slis.length}`);

  return {
    success: true,
    projectName,
    cicdArchitecture: pipelineDesign.architecture,
    deploymentStrategy: deploymentStrategyDesign.strategy,
    featureFlags: featureFlagsDesign.design,
    infrastructureAsCode: iacDesign.design,
    rollbackProcedures,
    monitoringPlan,
    releaseChecklist,
    implementationRoadmap: implementationRoadmap.roadmap,
    artifacts,
    metrics: {
      totalArtifacts: artifacts.length,
      pipelineStages: pipelineDesign.architecture.stages.length,
      automationLevel: pipelineDesign.automation.level,
      deploymentPattern: deploymentStrategyDesign.strategy.pattern,
      supportsZeroDowntime: deploymentStrategyDesign.strategy.supportsZeroDowntime,
      rollbackTime: rollbackDesign.estimatedRollbackTime,
      monitoringSLIs: monitoringDesign.plan.slis.length,
      releaseChecklistItems: releaseChecklist.length,
      implementationPhases: implementationRoadmap.phases.length,
      estimatedDuration: implementationRoadmap.estimatedDuration,
      processingDuration: duration
    },
    metadata: {
      processId: 'specializations/software-architecture/devops-architecture-alignment',
      processSlug: 'devops-architecture-alignment',
      category: 'Operational Architecture',
      specializationSlug: 'software-architecture',
      timestamp: startTime,
      completedAt: ctx.now(),
      duration
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

/**
 * Phase 1: Current State Assessment Task
 */
export const currentStateAssessmentTask = defineTask('current-state-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Assess current CI/CD and deployment state: ${args.projectName}`,
  agent: {
    name: 'devops-assessor',
    prompt: {
      role: 'DevOps Architect and Site Reliability Engineer',
      task: 'Assess current CI/CD pipelines, deployment practices, infrastructure, and identify gaps and pain points',
      context: {
        projectName: args.projectName,
        currentCICD: args.currentCICD,
        existingInfrastructure: args.existingInfrastructure,
        teamSize: args.teamSize,
        targetDeployment: args.deploymentTarget
      },
      instructions: [
        '1. Analyze current CI/CD pipeline configuration and tooling',
        '2. Evaluate deployment practices and frequency',
        '3. Assess infrastructure setup and scalability',
        '4. Identify automation gaps and manual processes',
        '5. Document pain points (slow builds, flaky tests, deployment failures)',
        '6. Categorize gaps by severity (critical, high, medium, low)',
        '7. Provide recommendations for improvements',
        '8. Create current state assessment report'
      ],
      outputFormat: 'JSON with success, assessment, gaps (array with severity, area, description), painPoints, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'assessment', 'gaps', 'painPoints', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        assessment: {
          type: 'object',
          properties: {
            cicdMaturity: { type: 'string', enum: ['manual', 'basic', 'automated', 'advanced', 'optimized'] },
            deploymentFrequency: { type: 'string' },
            automationLevel: { type: 'number', minimum: 0, maximum: 100 },
            infrastructureAsCode: { type: 'boolean' },
            monitoringInPlace: { type: 'boolean' }
          }
        },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              area: { type: 'string' },
              description: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        painPoints: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              type: { type: 'string' },
              format: { type: 'string' }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `${args.outputDir}/tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `${args.outputDir}/tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'devops', 'assessment', 'phase-1']
}));

/**
 * Phase 2: CI/CD Pipeline Architecture Design Task
 */
export const cicdPipelineDesignTask = defineTask('cicd-pipeline-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design CI/CD pipeline architecture: ${args.projectName}`,
  agent: {
    name: 'pipeline-architect',
    prompt: {
      role: 'CI/CD Pipeline Architect and DevOps Engineer',
      task: 'Design comprehensive CI/CD pipeline architecture with stages, automation, tooling, and quality gates',
      context: {
        projectName: args.projectName,
        deploymentTarget: args.deploymentTarget,
        releaseFrequency: args.releaseFrequency,
        currentState: args.currentStateAssessment,
        scalability: args.scalabilityRequirements,
        constraints: args.constraints
      },
      instructions: [
        '1. Design pipeline stages (source control, build, test, security scan, artifact storage, deployment)',
        '2. Define quality gates and approval points',
        '3. Select tooling for each stage (e.g., GitHub Actions, Jenkins, GitLab CI, CircleCI)',
        '4. Design build optimization strategies (caching, parallel execution)',
        '5. Plan test automation strategy (unit, integration, e2e, performance)',
        '6. Integrate security scanning (SAST, DAST, dependency scanning)',
        '7. Design artifact management and versioning',
        '8. Calculate automation level and estimated build times',
        '9. Create pipeline architecture diagram and documentation',
        '10. Export pipeline configuration templates'
      ],
      outputFormat: 'JSON with architecture (stages array), automation metrics, performance estimates, tooling, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['architecture', 'automation', 'performance', 'tooling', 'artifacts'],
      properties: {
        architecture: {
          type: 'object',
          properties: {
            stages: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  type: { type: 'string' },
                  order: { type: 'number' },
                  parallel: { type: 'boolean' },
                  qualityGate: { type: 'boolean' },
                  tools: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            qualityGates: { type: 'array', items: { type: 'object' } }
          }
        },
        automation: {
          type: 'object',
          properties: {
            level: { type: 'number', minimum: 0, maximum: 100 },
            manualSteps: { type: 'array', items: { type: 'string' } }
          }
        },
        performance: {
          type: 'object',
          properties: {
            estimatedBuildTime: { type: 'string' },
            parallelization: { type: 'boolean' }
          }
        },
        tooling: {
          type: 'object',
          properties: {
            ci: { type: 'string' },
            testing: { type: 'array', items: { type: 'string' } },
            security: { type: 'array', items: { type: 'string' } },
            artifactStorage: { type: 'string' }
          }
        },
        pipelineDiagramPath: { type: 'string' },
        architectureDocPath: { type: 'string' },
        artifacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              type: { type: 'string' },
              format: { type: 'string' }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `${args.outputDir}/tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `${args.outputDir}/tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'devops', 'cicd', 'pipeline', 'phase-2']
}));

/**
 * Phase 3: Deployment Strategy Design Task
 */
export const deploymentStrategyDesignTask = defineTask('deployment-strategy-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design deployment strategy: ${args.projectName}`,
  agent: {
    name: 'deployment-strategist',
    prompt: {
      role: 'Deployment Architect and Release Engineer',
      task: 'Design comprehensive deployment strategy including deployment patterns, release management, and zero-downtime approaches',
      context: {
        projectName: args.projectName,
        deploymentTarget: args.deploymentTarget,
        releaseFrequency: args.releaseFrequency,
        scalability: args.scalabilityRequirements,
        constraints: args.constraints,
        cicdArchitecture: args.cicdArchitecture
      },
      instructions: [
        '1. Select deployment pattern (blue-green, canary, rolling, recreate)',
        '2. Design zero-downtime deployment approach if required',
        '3. Plan progressive delivery strategy (percentage-based rollout)',
        '4. Define deployment environments (dev, staging, production)',
        '5. Design environment promotion workflow',
        '6. Plan release versioning and tagging strategy',
        '7. Design smoke tests and health checks for deployments',
        '8. Create deployment architecture diagram',
        '9. Document deployment procedures and best practices'
      ],
      outputFormat: 'JSON with strategy (pattern, supportsZeroDowntime, progressiveDelivery), environments, versioning, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'environments', 'artifacts'],
      properties: {
        strategy: {
          type: 'object',
          properties: {
            pattern: { type: 'string', enum: ['blue-green', 'canary', 'rolling', 'recreate', 'a-b-testing', 'shadow'] },
            supportsZeroDowntime: { type: 'boolean' },
            progressiveDelivery: { type: 'boolean' },
            rolloutStrategy: { type: 'string' },
            healthCheckStrategy: { type: 'object' }
          }
        },
        environments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              purpose: { type: 'string' },
              promotionCriteria: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        versioning: {
          type: 'object',
          properties: {
            scheme: { type: 'string', enum: ['semver', 'calver', 'git-sha', 'build-number'] },
            taggingStrategy: { type: 'string' }
          }
        },
        artifacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              type: { type: 'string' },
              format: { type: 'string' }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `${args.outputDir}/tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `${args.outputDir}/tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'devops', 'deployment', 'strategy', 'phase-3']
}));

/**
 * Phase 4a: Feature Flags Design Task
 */
export const featureFlagsDesignTask = defineTask('feature-flags-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design feature flags system: ${args.projectName}`,
  agent: {
    name: 'feature-flag-architect',
    prompt: {
      role: 'Feature Management Architect',
      task: 'Design feature flag system for progressive rollouts, A/B testing, and deployment decoupling',
      context: {
        projectName: args.projectName,
        deploymentStrategy: args.deploymentStrategy,
        releaseFrequency: args.releaseFrequency
      },
      instructions: [
        '1. Design feature flag architecture (client-side, server-side, edge)',
        '2. Select feature flag management platform (LaunchDarkly, Unleash, Flagsmith, custom)',
        '3. Define flag types (release flags, experiment flags, ops flags, permission flags)',
        '4. Design flag naming conventions and organization',
        '5. Plan flag lifecycle management (creation, rollout, cleanup)',
        '6. Design targeting rules (user segments, percentage rollouts)',
        '7. Plan integration with CI/CD pipeline',
        '8. Define metrics and monitoring for flags',
        '9. Create feature flag implementation guide'
      ],
      outputFormat: 'JSON with design (architecture, platform, flagTypes), lifecycle, targeting, integration, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'lifecycle', 'artifacts'],
      properties: {
        design: {
          type: 'object',
          properties: {
            architecture: { type: 'string', enum: ['client-side', 'server-side', 'edge', 'hybrid'] },
            platform: { type: 'string' },
            flagTypes: { type: 'array', items: { type: 'string' } },
            namingConvention: { type: 'string' }
          }
        },
        lifecycle: {
          type: 'object',
          properties: {
            stages: { type: 'array', items: { type: 'string' } },
            retentionPolicy: { type: 'string' }
          }
        },
        targeting: {
          type: 'object',
          properties: {
            rules: { type: 'array', items: { type: 'object' } }
          }
        },
        integration: {
          type: 'object',
          properties: {
            cicdIntegration: { type: 'boolean' },
            monitoringIntegration: { type: 'boolean' }
          }
        },
        artifacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              type: { type: 'string' },
              format: { type: 'string' }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `${args.outputDir}/tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `${args.outputDir}/tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'devops', 'feature-flags', 'phase-4']
}));

/**
 * Phase 4b: Infrastructure as Code Design Task
 */
export const infrastructureAsCodeDesignTask = defineTask('infrastructure-as-code-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design Infrastructure as Code: ${args.projectName}`,
  agent: {
    name: 'iac-architect',
    prompt: {
      role: 'Infrastructure as Code Architect',
      task: 'Design Infrastructure as Code (IaC) architecture using tools like Terraform, CloudFormation, Pulumi, or Ansible',
      context: {
        projectName: args.projectName,
        deploymentTarget: args.deploymentTarget,
        scalability: args.scalabilityRequirements,
        existingInfrastructure: args.existingInfrastructure
      },
      instructions: [
        '1. Select IaC tool (Terraform, CloudFormation, Pulumi, Ansible, Kubernetes Helm)',
        '2. Design infrastructure modules and resource organization',
        '3. Plan state management and backend configuration',
        '4. Design environment-specific configurations (dev, staging, prod)',
        '5. Plan secrets management (Vault, AWS Secrets Manager, Azure Key Vault)',
        '6. Design CI/CD integration for IaC (plan, validate, apply)',
        '7. Plan drift detection and remediation',
        '8. Design cost optimization strategies',
        '9. Create IaC templates and documentation'
      ],
      outputFormat: 'JSON with design (tool, modules, stateManagement), environments, secrets, cicdIntegration, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'environments', 'artifacts'],
      properties: {
        design: {
          type: 'object',
          properties: {
            tool: { type: 'string', enum: ['terraform', 'cloudformation', 'pulumi', 'ansible', 'helm', 'cdk'] },
            modules: { type: 'array', items: { type: 'object' } },
            stateManagement: { type: 'object' }
          }
        },
        environments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              config: { type: 'object' }
            }
          }
        },
        secrets: {
          type: 'object',
          properties: {
            management: { type: 'string' },
            tool: { type: 'string' }
          }
        },
        cicdIntegration: {
          type: 'object',
          properties: {
            automated: { type: 'boolean' },
            stages: { type: 'array', items: { type: 'string' } }
          }
        },
        artifacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              type: { type: 'string' },
              format: { type: 'string' }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `${args.outputDir}/tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `${args.outputDir}/tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'devops', 'iac', 'infrastructure', 'phase-4']
}));

/**
 * Phase 5: Rollback Procedures Design Task
 */
export const rollbackProceduresDesignTask = defineTask('rollback-procedures-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design rollback procedures: ${args.projectName}`,
  agent: {
    name: 'rollback-engineer',
    prompt: {
      role: 'Site Reliability Engineer and Rollback Specialist',
      task: 'Design comprehensive rollback procedures and disaster recovery mechanisms',
      context: {
        projectName: args.projectName,
        deploymentStrategy: args.deploymentStrategy,
        constraints: args.constraints,
        deploymentTarget: args.deploymentTarget,
        featureFlags: args.featureFlagsDesign
      },
      instructions: [
        '1. Design rollback triggers (automated and manual)',
        '2. Create rollback procedures for each deployment pattern',
        '3. Plan database rollback strategies (backward-compatible migrations)',
        '4. Design feature flag-based rollback (instant rollback)',
        '5. Plan data consistency checks post-rollback',
        '6. Design automated rollback testing',
        '7. Create rollback runbooks with step-by-step procedures',
        '8. Estimate rollback time for each scenario',
        '9. Plan communication protocols during rollback',
        '10. Document lessons learned and post-mortems'
      ],
      outputFormat: 'JSON with procedures (triggers, steps, databaseStrategy), estimatedRollbackTime, runbooks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['procedures', 'estimatedRollbackTime', 'artifacts'],
      properties: {
        procedures: {
          type: 'object',
          properties: {
            triggers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['automated', 'manual'] },
                  condition: { type: 'string' },
                  action: { type: 'string' }
                }
              }
            },
            steps: { type: 'array', items: { type: 'string' } },
            databaseStrategy: { type: 'string' },
            featureFlagRollback: { type: 'boolean' }
          }
        },
        estimatedRollbackTime: { type: 'string' },
        runbooks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              path: { type: 'string' }
            }
          }
        },
        testing: {
          type: 'object',
          properties: {
            automated: { type: 'boolean' },
            frequency: { type: 'string' }
          }
        },
        artifacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              type: { type: 'string' },
              format: { type: 'string' }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `${args.outputDir}/tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `${args.outputDir}/tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'devops', 'rollback', 'disaster-recovery', 'phase-5']
}));

/**
 * Phase 6: Deployment Monitoring Design Task
 */
export const deploymentMonitoringDesignTask = defineTask('deployment-monitoring-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design deployment monitoring and observability: ${args.projectName}`,
  agent: {
    name: 'observability-architect',
    prompt: {
      role: 'Observability Architect and Monitoring Specialist',
      task: 'Design comprehensive deployment monitoring and observability with SLIs, SLOs, dashboards, and alerting',
      context: {
        projectName: args.projectName,
        deploymentTarget: args.deploymentTarget,
        deploymentStrategy: args.deploymentStrategy,
        scalability: args.scalabilityRequirements
      },
      instructions: [
        '1. Define Service Level Indicators (SLIs): latency, error rate, availability, throughput',
        '2. Define Service Level Objectives (SLOs) based on scalability requirements',
        '3. Design deployment-specific metrics (deployment frequency, lead time, MTTR)',
        '4. Plan monitoring tooling (Prometheus, Grafana, Datadog, New Relic)',
        '5. Design deployment dashboards with key metrics',
        '6. Configure alerting rules and thresholds',
        '7. Plan distributed tracing for microservices',
        '8. Design log aggregation and analysis',
        '9. Plan chaos engineering and failure injection',
        '10. Create monitoring implementation guide'
      ],
      outputFormat: 'JSON with plan (slis, slos, metrics), tooling, dashboards, alerting, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'tooling', 'artifacts'],
      properties: {
        plan: {
          type: 'object',
          properties: {
            slis: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  metric: { type: 'string' },
                  measurement: { type: 'string' }
                }
              }
            },
            slos: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  sli: { type: 'string' },
                  target: { type: 'string' },
                  window: { type: 'string' }
                }
              }
            },
            deploymentMetrics: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        },
        tooling: {
          type: 'object',
          properties: {
            metrics: { type: 'string' },
            logs: { type: 'string' },
            traces: { type: 'string' },
            dashboards: { type: 'string' },
            alerting: { type: 'string' }
          }
        },
        dashboards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              purpose: { type: 'string' },
              metrics: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        alerting: {
          type: 'object',
          properties: {
            rules: { type: 'array', items: { type: 'object' } },
            channels: { type: 'array', items: { type: 'string' } }
          }
        },
        artifacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              type: { type: 'string' },
              format: { type: 'string' }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `${args.outputDir}/tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `${args.outputDir}/tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'devops', 'monitoring', 'observability', 'phase-6']
}));

/**
 * Phase 7: Release Checklist Creation Task
 */
export const releaseChecklistCreationTask = defineTask('release-checklist-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create release checklist: ${args.projectName}`,
  agent: {
    name: 'release-manager',
    prompt: {
      role: 'Release Manager and Quality Assurance Lead',
      task: 'Create comprehensive release checklist covering pre-deployment, deployment, and post-deployment activities',
      context: {
        projectName: args.projectName,
        cicdArchitecture: args.cicdArchitecture,
        deploymentStrategy: args.deploymentStrategy,
        rollbackProcedures: args.rollbackProcedures,
        monitoringPlan: args.monitoringPlan,
        constraints: args.constraints
      },
      instructions: [
        '1. Create pre-deployment checklist (code review, tests, security scans, approvals)',
        '2. Create deployment checklist (backup, feature flags, monitoring, communication)',
        '3. Create post-deployment checklist (smoke tests, monitoring, rollback readiness)',
        '4. Design release communication templates',
        '5. Plan stakeholder notification strategy',
        '6. Create release notes template',
        '7. Design approval workflow for production releases',
        '8. Plan maintenance windows if needed',
        '9. Create runbooks for common release scenarios'
      ],
      outputFormat: 'JSON with checklist (preDeployment, deployment, postDeployment arrays), communication, approvals, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['checklist', 'artifacts'],
      properties: {
        checklist: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string', enum: ['pre-deployment', 'deployment', 'post-deployment'] },
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    task: { type: 'string' },
                    responsible: { type: 'string' },
                    mandatory: { type: 'boolean' },
                    automated: { type: 'boolean' }
                  }
                }
              }
            }
          }
        },
        communication: {
          type: 'object',
          properties: {
            channels: { type: 'array', items: { type: 'string' } },
            templates: { type: 'array', items: { type: 'object' } }
          }
        },
        approvals: {
          type: 'object',
          properties: {
            required: { type: 'boolean' },
            approvers: { type: 'array', items: { type: 'string' } }
          }
        },
        artifacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              type: { type: 'string' },
              format: { type: 'string' }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `${args.outputDir}/tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `${args.outputDir}/tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'devops', 'release', 'checklist', 'phase-7']
}));

/**
 * Phase 8: Implementation Roadmap Task
 */
export const implementationRoadmapTask = defineTask('implementation-roadmap', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create implementation roadmap: ${args.projectName}`,
  agent: {
    name: 'implementation-planner',
    prompt: {
      role: 'DevOps Implementation Lead and Project Manager',
      task: 'Create comprehensive implementation roadmap with phases, tasks, dependencies, timeline, and resource allocation',
      context: {
        projectName: args.projectName,
        currentState: args.currentStateAssessment,
        targetArchitecture: {
          cicd: args.cicdArchitecture,
          deployment: args.deploymentStrategy,
          featureFlags: args.featureFlagsDesign,
          iac: args.iacDesign,
          rollback: args.rollbackProcedures,
          monitoring: args.monitoringPlan,
          release: args.releaseChecklist
        },
        teamSize: args.teamSize
      },
      instructions: [
        '1. Break down implementation into logical phases',
        '2. Define tasks and subtasks for each phase',
        '3. Identify dependencies between tasks',
        '4. Estimate effort and duration for each task',
        '5. Allocate resources based on team size',
        '6. Create implementation timeline (Gantt chart style)',
        '7. Identify risks and mitigation strategies',
        '8. Define success criteria and KPIs for each phase',
        '9. Create executive summary for stakeholders',
        '10. Generate detailed implementation documentation'
      ],
      outputFormat: 'JSON with roadmap (phases array with tasks, dependencies, timeline), risks, successCriteria, executiveSummary, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['roadmap', 'phases', 'estimatedDuration', 'artifacts'],
      properties: {
        roadmap: {
          type: 'object',
          properties: {
            overview: { type: 'string' },
            totalPhases: { type: 'number' }
          }
        },
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              number: { type: 'number' },
              name: { type: 'string' },
              description: { type: 'string' },
              tasks: { type: 'array', items: { type: 'object' } },
              dependencies: { type: 'array', items: { type: 'string' } },
              estimatedDuration: { type: 'string' },
              successCriteria: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        estimatedDuration: { type: 'string' },
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              severity: { type: 'string' },
              mitigation: { type: 'string' }
            }
          }
        },
        successCriteria: { type: 'array', items: { type: 'string' } },
        executiveSummaryPath: { type: 'string' },
        roadmapPath: { type: 'string' },
        artifacts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              type: { type: 'string' },
              format: { type: 'string' }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `${args.outputDir}/tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `${args.outputDir}/tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'devops', 'roadmap', 'implementation', 'phase-8']
}));
