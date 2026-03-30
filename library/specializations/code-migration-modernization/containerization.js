/**
 * @process specializations/code-migration-modernization/containerization
 * @description Containerization - Process for containerizing legacy applications using Docker and
 * Kubernetes, implementing best practices for image creation, orchestration, and production readiness.
 * @inputs { projectName: string, applicationStack?: object, targetPlatform?: string, scalingRequirements?: object }
 * @outputs { success: boolean, containerAnalysis: object, dockerFiles: array, kubernetesManifests: array, deploymentReady: boolean, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/code-migration-modernization/containerization', {
 *   projectName: 'Legacy App Containerization',
 *   applicationStack: { runtime: 'Java', framework: 'Spring Boot' },
 *   targetPlatform: 'Kubernetes',
 *   scalingRequirements: { minReplicas: 2, maxReplicas: 10 }
 * });
 *
 * @references
 * - Docker Best Practices: https://docs.docker.com/develop/develop-images/dockerfile_best-practices/
 * - Kubernetes Patterns: https://k8spatterns.io/
 * - 12-Factor App: https://12factor.net/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    applicationStack = {},
    targetPlatform = 'Kubernetes',
    scalingRequirements = {},
    outputDir = 'containerization-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Containerization for ${projectName}`);

  // ============================================================================
  // PHASE 1: CONTAINERIZATION ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Assessing containerization readiness');
  const assessment = await ctx.task(containerizationAssessmentTask, {
    projectName,
    applicationStack,
    outputDir
  });

  artifacts.push(...assessment.artifacts);

  // ============================================================================
  // PHASE 2: DOCKERFILE CREATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Creating Dockerfiles');
  const dockerfiles = await ctx.task(dockerfileCreationTask, {
    projectName,
    assessment,
    applicationStack,
    outputDir
  });

  artifacts.push(...dockerfiles.artifacts);

  // Breakpoint: Dockerfile review
  await ctx.breakpoint({
    question: `Dockerfiles created for ${projectName}. Image count: ${dockerfiles.imageCount}. Base images: ${dockerfiles.baseImages.join(', ')}. Review before build?`,
    title: 'Dockerfile Review',
    context: {
      runId: ctx.runId,
      projectName,
      dockerfiles,
      recommendation: 'Review Dockerfiles for security and optimization'
    }
  });

  // ============================================================================
  // PHASE 3: IMAGE BUILD AND OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Building and optimizing images');
  const imageBuild = await ctx.task(imageBuildOptimizationTask, {
    projectName,
    dockerfiles,
    outputDir
  });

  artifacts.push(...imageBuild.artifacts);

  // ============================================================================
  // PHASE 4: KUBERNETES MANIFEST CREATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Creating Kubernetes manifests');
  const k8sManifests = await ctx.task(kubernetesManifestCreationTask, {
    projectName,
    imageBuild,
    scalingRequirements,
    outputDir
  });

  artifacts.push(...k8sManifests.artifacts);

  // ============================================================================
  // PHASE 5: CONFIGURATION EXTERNALIZATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Externalizing configuration');
  const configExternalization = await ctx.task(configurationExternalizationTask, {
    projectName,
    k8sManifests,
    outputDir
  });

  artifacts.push(...configExternalization.artifacts);

  // ============================================================================
  // PHASE 6: HEALTH AND READINESS
  // ============================================================================

  ctx.log('info', 'Phase 6: Implementing health checks');
  const healthChecks = await ctx.task(healthReadinessImplementationTask, {
    projectName,
    k8sManifests,
    outputDir
  });

  artifacts.push(...healthChecks.artifacts);

  // ============================================================================
  // PHASE 7: DEPLOYMENT TESTING
  // ============================================================================

  ctx.log('info', 'Phase 7: Testing deployment');
  const deploymentTesting = await ctx.task(deploymentTestingTask, {
    projectName,
    k8sManifests,
    healthChecks,
    outputDir
  });

  artifacts.push(...deploymentTesting.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Containerization complete for ${projectName}. Images: ${imageBuild.imageCount}. Manifests: ${k8sManifests.manifestCount}. Deployment tests: ${deploymentTesting.allPassed ? 'passed' : 'failed'}. Approve?`,
    title: 'Containerization Complete',
    context: {
      runId: ctx.runId,
      projectName,
      summary: {
        images: imageBuild.imageCount,
        manifests: k8sManifests.manifestCount,
        testsPass: deploymentTesting.allPassed
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    containerAnalysis: assessment,
    dockerFiles: dockerfiles.files,
    kubernetesManifests: k8sManifests.files,
    imageDetails: imageBuild,
    configExternalization,
    healthChecks,
    deploymentReady: deploymentTesting.allPassed,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/code-migration-modernization/containerization',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const containerizationAssessmentTask = defineTask('containerization-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Containerization Assessment - ${args.projectName}`,
  agent: {
    name: 'cloud-migration-planner',
    prompt: {
      role: 'Container Architect',
      task: 'Assess application for containerization',
      context: args,
      instructions: [
        '1. Analyze application architecture',
        '2. Identify stateful components',
        '3. Review external dependencies',
        '4. Assess configuration management',
        '5. Identify logging requirements',
        '6. Review storage needs',
        '7. Assess 12-factor compliance',
        '8. Identify containerization challenges',
        '9. Plan component separation',
        '10. Generate assessment report'
      ],
      outputFormat: 'JSON with readinessScore, statefulComponents, dependencies, challenges, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['readinessScore', 'challenges', 'artifacts'],
      properties: {
        readinessScore: { type: 'number' },
        statefulComponents: { type: 'array', items: { type: 'object' } },
        dependencies: { type: 'array', items: { type: 'object' } },
        challenges: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['containerization', 'assessment', 'analysis']
}));

export const dockerfileCreationTask = defineTask('dockerfile-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Dockerfile Creation - ${args.projectName}`,
  agent: {
    name: 'iac-generator',
    prompt: {
      role: 'Docker Developer',
      task: 'Create optimized Dockerfiles',
      context: args,
      instructions: [
        '1. Select appropriate base images',
        '2. Create multi-stage builds',
        '3. Optimize layer caching',
        '4. Minimize image size',
        '5. Set up non-root user',
        '6. Configure health checks',
        '7. Set environment variables',
        '8. Configure entry points',
        '9. Document build process',
        '10. Generate Dockerfiles'
      ],
      outputFormat: 'JSON with imageCount, baseImages, files, multiStage, optimizations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['imageCount', 'baseImages', 'files', 'artifacts'],
      properties: {
        imageCount: { type: 'number' },
        baseImages: { type: 'array', items: { type: 'string' } },
        files: { type: 'array', items: { type: 'object' } },
        multiStage: { type: 'boolean' },
        optimizations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['containerization', 'dockerfile', 'creation']
}));

export const imageBuildOptimizationTask = defineTask('image-build-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Image Build and Optimization - ${args.projectName}`,
  agent: {
    name: 'iac-generator',
    prompt: {
      role: 'Container Engineer',
      task: 'Build and optimize container images',
      context: args,
      instructions: [
        '1. Build container images',
        '2. Run security scans',
        '3. Check for vulnerabilities',
        '4. Optimize image layers',
        '5. Tag images properly',
        '6. Push to registry',
        '7. Document image sizes',
        '8. Set up image signing',
        '9. Create build pipeline',
        '10. Generate build report'
      ],
      outputFormat: 'JSON with imageCount, imageSizes, vulnerabilities, registryPushed, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['imageCount', 'imageSizes', 'artifacts'],
      properties: {
        imageCount: { type: 'number' },
        imageSizes: { type: 'array', items: { type: 'object' } },
        vulnerabilities: { type: 'array', items: { type: 'object' } },
        registryPushed: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['containerization', 'build', 'optimization']
}));

export const kubernetesManifestCreationTask = defineTask('kubernetes-manifest-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Kubernetes Manifest Creation - ${args.projectName}`,
  agent: {
    name: 'iac-generator',
    prompt: {
      role: 'Kubernetes Developer',
      task: 'Create Kubernetes manifests',
      context: args,
      instructions: [
        '1. Create Deployment manifests',
        '2. Create Service manifests',
        '3. Configure HPA for scaling',
        '4. Set up Ingress',
        '5. Create ConfigMaps',
        '6. Create Secrets',
        '7. Set resource limits',
        '8. Configure pod disruption budgets',
        '9. Set up network policies',
        '10. Generate manifest files'
      ],
      outputFormat: 'JSON with manifestCount, files, resources, scaling, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['manifestCount', 'files', 'artifacts'],
      properties: {
        manifestCount: { type: 'number' },
        files: { type: 'array', items: { type: 'object' } },
        resources: { type: 'array', items: { type: 'object' } },
        scaling: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['containerization', 'kubernetes', 'manifests']
}));

export const configurationExternalizationTask = defineTask('configuration-externalization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Configuration Externalization - ${args.projectName}`,
  agent: {
    name: 'cloud-migration-planner',
    prompt: {
      role: 'Configuration Engineer',
      task: 'Externalize application configuration',
      context: args,
      instructions: [
        '1. Identify configuration items',
        '2. Create ConfigMaps',
        '3. Create Secrets',
        '4. Set up environment variables',
        '5. Configure volume mounts',
        '6. Integrate with config servers',
        '7. Set up secret management',
        '8. Document configuration',
        '9. Test configuration loading',
        '10. Generate configuration report'
      ],
      outputFormat: 'JSON with configMaps, secrets, envVars, volumeMounts, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['configMaps', 'secrets', 'artifacts'],
      properties: {
        configMaps: { type: 'array', items: { type: 'object' } },
        secrets: { type: 'array', items: { type: 'object' } },
        envVars: { type: 'array', items: { type: 'object' } },
        volumeMounts: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['containerization', 'configuration', 'externalization']
}));

export const healthReadinessImplementationTask = defineTask('health-readiness-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Health and Readiness Implementation - ${args.projectName}`,
  agent: {
    name: 'cloud-migration-planner',
    prompt: {
      role: 'SRE Engineer',
      task: 'Implement health and readiness probes',
      context: args,
      instructions: [
        '1. Implement liveness probes',
        '2. Implement readiness probes',
        '3. Implement startup probes',
        '4. Configure probe settings',
        '5. Test probe endpoints',
        '6. Set appropriate thresholds',
        '7. Document probe behavior',
        '8. Test failure scenarios',
        '9. Validate recovery',
        '10. Generate health report'
      ],
      outputFormat: 'JSON with livenessProbe, readinessProbe, startupProbe, endpoints, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['livenessProbe', 'readinessProbe', 'artifacts'],
      properties: {
        livenessProbe: { type: 'object' },
        readinessProbe: { type: 'object' },
        startupProbe: { type: 'object' },
        endpoints: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['containerization', 'health', 'readiness']
}));

export const deploymentTestingTask = defineTask('deployment-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Deployment Testing - ${args.projectName}`,
  agent: {
    name: 'regression-detector',
    prompt: {
      role: 'QA Engineer',
      task: 'Test containerized deployment',
      context: args,
      instructions: [
        '1. Deploy to test cluster',
        '2. Verify pod startup',
        '3. Test health endpoints',
        '4. Test scaling',
        '5. Test rolling updates',
        '6. Test rollback',
        '7. Validate networking',
        '8. Test persistence',
        '9. Validate configuration',
        '10. Generate test report'
      ],
      outputFormat: 'JSON with allPassed, passedTests, failedTests, deploymentStatus, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['allPassed', 'passedTests', 'failedTests', 'artifacts'],
      properties: {
        allPassed: { type: 'boolean' },
        passedTests: { type: 'number' },
        failedTests: { type: 'number' },
        deploymentStatus: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['containerization', 'deployment', 'testing']
}));
