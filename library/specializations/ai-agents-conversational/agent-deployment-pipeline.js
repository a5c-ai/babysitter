/**
 * @process specializations/ai-agents-conversational/agent-deployment-pipeline
 * @description Agent Deployment Pipeline - Process for deploying AI agents to production including
 * containerization, API endpoint setup, auto-scaling configuration, and continuous deployment workflows.
 * @inputs { agentName?: string, deploymentTarget?: string, scalingConfig?: object, outputDir?: string }
 * @outputs { success: boolean, containerConfig: object, apiEndpoints: array, scalingSetup: object, cicdPipeline: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ai-agents-conversational/agent-deployment-pipeline', {
 *   agentName: 'customer-support-agent',
 *   deploymentTarget: 'kubernetes',
 *   scalingConfig: { minReplicas: 2, maxReplicas: 10 }
 * });
 *
 * @references
 * - Docker: https://docs.docker.com/
 * - Kubernetes: https://kubernetes.io/docs/
 * - Modal: https://modal.com/docs
 * - BentoML: https://docs.bentoml.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    agentName = 'deployed-agent',
    deploymentTarget = 'kubernetes',
    scalingConfig = { minReplicas: 2, maxReplicas: 10 },
    outputDir = 'agent-deployment-output',
    enableMonitoring = true,
    enableAutoScaling = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Agent Deployment Pipeline for ${agentName}`);

  // ============================================================================
  // PHASE 1: CONTAINERIZATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Setting up containerization');

  const containerization = await ctx.task(containerizationTask, {
    agentName,
    deploymentTarget,
    outputDir
  });

  artifacts.push(...containerization.artifacts);

  // ============================================================================
  // PHASE 2: API ENDPOINT SETUP
  // ============================================================================

  ctx.log('info', 'Phase 2: Configuring API endpoints');

  const apiEndpoints = await ctx.task(apiEndpointSetupTask, {
    agentName,
    containerConfig: containerization.config,
    outputDir
  });

  artifacts.push(...apiEndpoints.artifacts);

  // ============================================================================
  // PHASE 3: AUTO-SCALING CONFIGURATION
  // ============================================================================

  let scalingSetup = null;
  if (enableAutoScaling) {
    ctx.log('info', 'Phase 3: Configuring auto-scaling');

    scalingSetup = await ctx.task(autoScalingTask, {
      agentName,
      scalingConfig,
      deploymentTarget,
      outputDir
    });

    artifacts.push(...scalingSetup.artifacts);
  }

  // ============================================================================
  // PHASE 4: INFRASTRUCTURE AS CODE
  // ============================================================================

  ctx.log('info', 'Phase 4: Setting up infrastructure as code');

  const iacSetup = await ctx.task(infrastructureSetupTask, {
    agentName,
    deploymentTarget,
    containerConfig: containerization.config,
    scalingConfig: scalingSetup ? scalingSetup.config : null,
    outputDir
  });

  artifacts.push(...iacSetup.artifacts);

  // ============================================================================
  // PHASE 5: CI/CD PIPELINE
  // ============================================================================

  ctx.log('info', 'Phase 5: Setting up CI/CD pipeline');

  const cicdPipeline = await ctx.task(cicdPipelineTask, {
    agentName,
    deploymentTarget,
    outputDir
  });

  artifacts.push(...cicdPipeline.artifacts);

  // ============================================================================
  // PHASE 6: MONITORING AND OBSERVABILITY
  // ============================================================================

  let monitoring = null;
  if (enableMonitoring) {
    ctx.log('info', 'Phase 6: Setting up monitoring');

    monitoring = await ctx.task(deploymentMonitoringTask, {
      agentName,
      deploymentTarget,
      outputDir
    });

    artifacts.push(...monitoring.artifacts);
  }

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Agent ${agentName} deployment pipeline ready. Target: ${deploymentTarget}, Auto-scaling: ${enableAutoScaling}. Review deployment configuration?`,
    title: 'Deployment Pipeline Review',
    context: {
      runId: ctx.runId,
      summary: {
        agentName,
        deploymentTarget,
        enableAutoScaling,
        enableMonitoring,
        containerImage: containerization.config.imageName
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'yaml' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    agentName,
    containerConfig: containerization.config,
    apiEndpoints: apiEndpoints.endpoints,
    scalingSetup: scalingSetup ? scalingSetup.config : null,
    cicdPipeline: cicdPipeline.pipeline,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/ai-agents-conversational/agent-deployment-pipeline',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const containerizationTask = defineTask('containerization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Containerization - ${args.agentName}`,
  agent: {
    name: 'agent-deployment-engineer',  // AG-OPS-001: Configures containerization and deployment pipelines
    prompt: {
      role: 'Container Developer',
      task: 'Setup containerization for agent deployment',
      context: args,
      instructions: [
        '1. Create Dockerfile for agent',
        '2. Configure dependencies and runtime',
        '3. Setup multi-stage build',
        '4. Configure health checks',
        '5. Add security hardening',
        '6. Setup image registry',
        '7. Create build scripts',
        '8. Save container configuration'
      ],
      outputFormat: 'JSON with container configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'artifacts'],
      properties: {
        config: {
          type: 'object',
          properties: {
            imageName: { type: 'string' },
            dockerfile: { type: 'string' },
            registry: { type: 'string' }
          }
        },
        dockerfilePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'deployment', 'container']
}));

export const apiEndpointSetupTask = defineTask('api-endpoint-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup API Endpoints - ${args.agentName}`,
  agent: {
    name: 'api-developer',
    prompt: {
      role: 'API Developer',
      task: 'Setup API endpoints for agent',
      context: args,
      instructions: [
        '1. Design REST/gRPC API',
        '2. Create API server code',
        '3. Add authentication/authorization',
        '4. Configure rate limiting',
        '5. Add request validation',
        '6. Setup streaming endpoints',
        '7. Create API documentation',
        '8. Save API configuration'
      ],
      outputFormat: 'JSON with API endpoints'
    },
    outputSchema: {
      type: 'object',
      required: ['endpoints', 'artifacts'],
      properties: {
        endpoints: { type: 'array' },
        apiServerPath: { type: 'string' },
        documentation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'deployment', 'api']
}));

export const autoScalingTask = defineTask('auto-scaling', (args, taskCtx) => ({
  kind: 'agent',
  title: `Configure Auto-Scaling - ${args.agentName}`,
  agent: {
    name: 'scaling-developer',
    prompt: {
      role: 'Scaling Developer',
      task: 'Configure auto-scaling for agent deployment',
      context: args,
      instructions: [
        '1. Define scaling metrics',
        '2. Configure HPA/VPA',
        '3. Set min/max replicas',
        '4. Configure scaling triggers',
        '5. Add scale-down policies',
        '6. Setup load balancing',
        '7. Test scaling behavior',
        '8. Save scaling configuration'
      ],
      outputFormat: 'JSON with scaling configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'artifacts'],
      properties: {
        config: { type: 'object' },
        scalingPolicies: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'deployment', 'scaling']
}));

export const infrastructureSetupTask = defineTask('infrastructure-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Infrastructure - ${args.agentName}`,
  agent: {
    name: 'infra-developer',
    prompt: {
      role: 'Infrastructure Developer',
      task: 'Setup infrastructure as code',
      context: args,
      instructions: [
        '1. Create Terraform/Pulumi configs',
        '2. Define Kubernetes manifests',
        '3. Configure networking',
        '4. Setup secrets management',
        '5. Configure storage',
        '6. Add resource quotas',
        '7. Create deployment scripts',
        '8. Save infrastructure config'
      ],
      outputFormat: 'JSON with infrastructure setup'
    },
    outputSchema: {
      type: 'object',
      required: ['infrastructure', 'artifacts'],
      properties: {
        infrastructure: { type: 'object' },
        manifestsPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'deployment', 'infrastructure']
}));

export const cicdPipelineTask = defineTask('cicd-pipeline', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup CI/CD Pipeline - ${args.agentName}`,
  agent: {
    name: 'cicd-developer',
    prompt: {
      role: 'CI/CD Developer',
      task: 'Setup CI/CD pipeline for agent deployment',
      context: args,
      instructions: [
        '1. Create GitHub Actions workflow',
        '2. Add build and test stages',
        '3. Configure container builds',
        '4. Setup deployment stages',
        '5. Add environment promotion',
        '6. Configure rollback procedures',
        '7. Add deployment notifications',
        '8. Save CI/CD configuration'
      ],
      outputFormat: 'JSON with CI/CD pipeline'
    },
    outputSchema: {
      type: 'object',
      required: ['pipeline', 'artifacts'],
      properties: {
        pipeline: { type: 'object' },
        workflowPath: { type: 'string' },
        stages: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'deployment', 'cicd']
}));

export const deploymentMonitoringTask = defineTask('deployment-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Deployment Monitoring - ${args.agentName}`,
  agent: {
    name: 'monitoring-developer',
    prompt: {
      role: 'Monitoring Developer',
      task: 'Setup deployment monitoring and alerting',
      context: args,
      instructions: [
        '1. Configure health checks',
        '2. Setup metrics collection',
        '3. Create deployment dashboards',
        '4. Configure alerts',
        '5. Add log aggregation',
        '6. Setup tracing',
        '7. Configure SLOs',
        '8. Save monitoring configuration'
      ],
      outputFormat: 'JSON with monitoring setup'
    },
    outputSchema: {
      type: 'object',
      required: ['monitoring', 'artifacts'],
      properties: {
        monitoring: { type: 'object' },
        dashboardPath: { type: 'string' },
        alerts: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'deployment', 'monitoring']
}));
