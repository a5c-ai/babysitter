/**
 * @process specializations/devops-sre-platform/container-image-management
 * @description Container Image Build and Registry Management - Comprehensive container image lifecycle management
 * including multi-architecture builds, security scanning, vulnerability remediation, image optimization, registry
 * management, signing, SBOM generation, and deployment readiness validation.
 * @inputs { projectName: string, containerRegistry?: string, imageName?: string, buildContext?: string, dockerfilePath?: string, targetArchitectures?: array }
 * @outputs { success: boolean, imageDigests: object, securityReport: object, optimizationMetrics: object, registryStatus: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/devops-sre-platform/container-image-management', {
 *   projectName: 'Production API Service',
 *   containerRegistry: 'ghcr.io/myorg',
 *   imageName: 'api-service',
 *   buildContext: './services/api',
 *   dockerfilePath: './services/api/Dockerfile',
 *   targetArchitectures: ['linux/amd64', 'linux/arm64'],
 *   targetEnvironments: ['production', 'staging'],
 *   securityCompliance: 'high',
 *   optimizationGoals: { maxSizeMB: 200, maxLayers: 15 },
 *   registryConfig: { retention: 30, autoCleanup: true }
 * });
 *
 * @references
 * - Docker Best Practices: https://docs.docker.com/develop/dev-best-practices/
 * - Multi-arch Images: https://docs.docker.com/build/building/multi-platform/
 * - Container Security: https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html
 * - SLSA Framework: https://slsa.dev/
 * - Sigstore Cosign: https://docs.sigstore.dev/cosign/overview/
 * - Trivy Scanner: https://aquasecurity.github.io/trivy/
 * - SBOM Generation: https://www.cisa.gov/sbom
 * - Harbor Registry: https://goharbor.io/docs/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    containerRegistry = 'docker.io',
    imageName,
    buildContext = '.',
    dockerfilePath = './Dockerfile',
    targetArchitectures = ['linux/amd64', 'linux/arm64'],
    targetEnvironments = ['production', 'staging', 'development'],
    baseImage,
    buildArgs = {},
    securityCompliance = 'high', // 'low', 'medium', 'high', 'critical-only'
    optimizationGoals = {
      maxSizeMB: 500,
      maxLayers: 20,
      targetReduction: 30
    },
    registryConfig = {
      retention: 30,
      autoCleanup: true,
      replicationEnabled: false,
      immutableTags: true
    },
    signingRequired = true,
    sbomRequired = true,
    cicdIntegration = true,
    outputDir = 'container-image-management-output'
  } = inputs;

  if (!imageName) {
    return {
      success: false,
      error: 'imageName is required',
      metadata: {
        processId: 'specializations/devops-sre-platform/container-image-management',
        timestamp: ctx.now()
      }
    };
  }

  const startTime = ctx.now();
  const artifacts = [];
  let imageDigests = {};
  let securityReport = {};
  let optimizationMetrics = {};
  let registryStatus = {};

  ctx.log('info', `Starting Container Image Build and Registry Management for ${projectName}`);
  ctx.log('info', `Image: ${containerRegistry}/${imageName}, Architectures: ${targetArchitectures.join(', ')}`);

  // ============================================================================
  // PHASE 1: DOCKERFILE ANALYSIS AND BEST PRACTICES REVIEW
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing Dockerfile and reviewing best practices');

  const dockerfileAnalysis = await ctx.task(dockerfileAnalysisTask, {
    projectName,
    dockerfilePath,
    buildContext,
    baseImage,
    optimizationGoals,
    outputDir
  });

  if (!dockerfileAnalysis.success) {
    return {
      success: false,
      error: 'Failed to analyze Dockerfile',
      details: dockerfileAnalysis,
      metadata: {
        processId: 'specializations/devops-sre-platform/container-image-management',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...dockerfileAnalysis.artifacts);

  // Quality Gate: Dockerfile meets best practices
  const criticalDockerfileIssues = dockerfileAnalysis.findings.filter(
    f => f.severity === 'critical' || f.severity === 'high'
  );

  if (criticalDockerfileIssues.length > 0) {
    ctx.log('warn', `Found ${criticalDockerfileIssues.length} critical/high Dockerfile issues`);

    await ctx.breakpoint({
      question: `Phase 1 Quality Gate: Found ${criticalDockerfileIssues.length} critical/high severity Dockerfile issues. Review and fix before building?`,
      title: 'Dockerfile Best Practices Gate',
      context: {
        runId: ctx.runId,
        dockerfileScore: dockerfileAnalysis.score,
        criticalIssues: criticalDockerfileIssues.length,
        issues: criticalDockerfileIssues.map(i => ({ severity: i.severity, issue: i.issue })),
        files: [{
          path: `${outputDir}/phase1-dockerfile-analysis.json`,
          format: 'json',
          label: 'Dockerfile Analysis Report'
        }]
      }
    });
  }

  // ============================================================================
  // PHASE 2: BASE IMAGE SECURITY SCANNING
  // ============================================================================

  ctx.log('info', 'Phase 2: Scanning base image for vulnerabilities');

  const baseImageScan = await ctx.task(baseImageScanTask, {
    projectName,
    baseImage: dockerfileAnalysis.detectedBaseImage || baseImage,
    securityCompliance,
    outputDir
  });

  if (!baseImageScan.success) {
    return {
      success: false,
      error: 'Failed to scan base image',
      details: baseImageScan,
      metadata: {
        processId: 'specializations/devops-sre-platform/container-image-management',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...baseImageScan.artifacts);

  // Quality Gate: Base image vulnerabilities within acceptable threshold
  const criticalVulnerabilities = baseImageScan.vulnerabilities.filter(
    v => v.severity === 'CRITICAL'
  );
  const highVulnerabilities = baseImageScan.vulnerabilities.filter(
    v => v.severity === 'HIGH'
  );

  if (criticalVulnerabilities.length > 0 || (securityCompliance === 'high' && highVulnerabilities.length > 5)) {
    ctx.log('error', `Base image has ${criticalVulnerabilities.length} CRITICAL and ${highVulnerabilities.length} HIGH vulnerabilities`);

    await ctx.breakpoint({
      question: `Phase 2 Quality Gate: Base image has ${criticalVulnerabilities.length} CRITICAL vulnerabilities. ${securityCompliance === 'high' ? 'High security compliance requires addressing these.' : ''} Review and select alternative base image?`,
      title: 'Base Image Security Gate',
      context: {
        runId: ctx.runId,
        baseImage: baseImageScan.baseImage,
        criticalVulnerabilities: criticalVulnerabilities.length,
        highVulnerabilities: highVulnerabilities.length,
        recommendedAlternatives: baseImageScan.recommendedAlternatives,
        files: [{
          path: `${outputDir}/phase2-base-image-scan.json`,
          format: 'json',
          label: 'Base Image Security Report'
        }]
      }
    });
  }

  // ============================================================================
  // PHASE 3: MULTI-ARCHITECTURE IMAGE BUILD
  // ============================================================================

  ctx.log('info', 'Phase 3: Building container images for multiple architectures');

  const imageBuild = await ctx.task(multiArchBuildTask, {
    projectName,
    containerRegistry,
    imageName,
    buildContext,
    dockerfilePath,
    targetArchitectures,
    buildArgs,
    outputDir
  });

  if (!imageBuild.success) {
    return {
      success: false,
      error: 'Failed to build container images',
      details: imageBuild,
      metadata: {
        processId: 'specializations/devops-sre-platform/container-image-management',
        timestamp: startTime
      }
    };
  }

  imageDigests = imageBuild.imageDigests;
  artifacts.push(...imageBuild.artifacts);

  // Quality Gate: All target architectures built successfully
  const failedBuilds = targetArchitectures.filter(
    arch => !imageBuild.imageDigests[arch]
  );

  if (failedBuilds.length > 0) {
    ctx.log('error', `Failed to build for architectures: ${failedBuilds.join(', ')}`);

    await ctx.breakpoint({
      question: `Phase 3 Quality Gate: Failed to build images for ${failedBuilds.length} architecture(s): ${failedBuilds.join(', ')}. Review build logs and retry?`,
      title: 'Multi-Architecture Build Gate',
      context: {
        runId: ctx.runId,
        successfulBuilds: Object.keys(imageBuild.imageDigests).length,
        failedBuilds: failedBuilds.length,
        failedArchitectures: failedBuilds,
        buildLogs: imageBuild.buildLogs,
        files: [{
          path: `${outputDir}/phase3-build-report.json`,
          format: 'json',
          label: 'Build Report'
        }]
      }
    });
  }

  ctx.log('info', `Successfully built images for ${Object.keys(imageDigests).length} architectures`);

  // ============================================================================
  // PHASE 4: COMPREHENSIVE SECURITY SCANNING
  // ============================================================================

  ctx.log('info', 'Phase 4: Running comprehensive security scans on built images');

  // Run security scans in parallel for all architectures
  const securityScans = await ctx.parallel.all(
    targetArchitectures.map(arch =>
      () => ctx.task(securityScanTask, {
        projectName,
        imageDigest: imageDigests[arch],
        architecture: arch,
        securityCompliance,
        outputDir
      })
    )
  );

  // Aggregate security results
  const allVulnerabilities = [];
  const allMisconfigurations = [];
  const allSecrets = [];

  for (const scan of securityScans) {
    if (scan.success) {
      allVulnerabilities.push(...scan.vulnerabilities);
      allMisconfigurations.push(...scan.misconfigurations);
      allSecrets.push(...scan.secrets);
      artifacts.push(...scan.artifacts);
    }
  }

  securityReport = {
    totalVulnerabilities: allVulnerabilities.length,
    criticalVulnerabilities: allVulnerabilities.filter(v => v.severity === 'CRITICAL').length,
    highVulnerabilities: allVulnerabilities.filter(v => v.severity === 'HIGH').length,
    mediumVulnerabilities: allVulnerabilities.filter(v => v.severity === 'MEDIUM').length,
    lowVulnerabilities: allVulnerabilities.filter(v => v.severity === 'LOW').length,
    misconfigurations: allMisconfigurations.length,
    exposedSecrets: allSecrets.length,
    scansCompleted: securityScans.filter(s => s.success).length
  };

  // Quality Gate: Security scan results within acceptable limits
  const securityThresholds = {
    'critical-only': { critical: 0, high: Infinity },
    'high': { critical: 0, high: 0 },
    'medium': { critical: 0, high: 5 },
    'low': { critical: 2, high: 10 }
  };

  const threshold = securityThresholds[securityCompliance] || securityThresholds['medium'];

  if (securityReport.criticalVulnerabilities > threshold.critical ||
      securityReport.highVulnerabilities > threshold.high ||
      allSecrets.length > 0) {

    ctx.log('error', `Security scan failed quality gate: ${securityReport.criticalVulnerabilities} CRITICAL, ${securityReport.highVulnerabilities} HIGH vulnerabilities, ${allSecrets.length} exposed secrets`);

    await ctx.breakpoint({
      question: `Phase 4 Quality Gate: Security scan identified ${securityReport.criticalVulnerabilities} CRITICAL and ${securityReport.highVulnerabilities} HIGH vulnerabilities${allSecrets.length > 0 ? `, plus ${allSecrets.length} EXPOSED SECRETS` : ''}. Compliance level: ${securityCompliance}. Review and remediate?`,
      title: 'Security Scan Gate',
      context: {
        runId: ctx.runId,
        securityCompliance,
        securityReport,
        exposedSecrets: allSecrets.map(s => ({ type: s.type, location: s.location })),
        topVulnerabilities: allVulnerabilities
          .filter(v => v.severity === 'CRITICAL' || v.severity === 'HIGH')
          .slice(0, 10)
          .map(v => ({ cve: v.cve, severity: v.severity, package: v.package })),
        files: [{
          path: `${outputDir}/phase4-security-report.json`,
          format: 'json',
          label: 'Comprehensive Security Report'
        }]
      }
    });
  }

  // ============================================================================
  // PHASE 5: IMAGE OPTIMIZATION AND SIZE REDUCTION
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing and optimizing image size and layers');

  const imageOptimization = await ctx.task(imageOptimizationTask, {
    projectName,
    imageDigests,
    dockerfilePath,
    optimizationGoals,
    outputDir
  });

  if (!imageOptimization.success) {
    ctx.log('warn', 'Image optimization analysis failed, continuing with current images');
  } else {
    optimizationMetrics = imageOptimization.metrics;
    artifacts.push(...imageOptimization.artifacts);

    // Quality Gate: Image size within acceptable limits
    const oversizedImages = Object.entries(optimizationMetrics.imageSizes || {}).filter(
      ([arch, size]) => size > optimizationGoals.maxSizeMB
    );

    if (oversizedImages.length > 0) {
      ctx.log('warn', `${oversizedImages.length} image(s) exceed size limit of ${optimizationGoals.maxSizeMB}MB`);

      await ctx.breakpoint({
        question: `Phase 5 Quality Gate: ${oversizedImages.length} image(s) exceed size target (${optimizationGoals.maxSizeMB}MB). Review optimization recommendations?`,
        title: 'Image Size Optimization Gate',
        context: {
          runId: ctx.runId,
          targetSizeMB: optimizationGoals.maxSizeMB,
          oversizedImages: oversizedImages.map(([arch, size]) => ({ architecture: arch, sizeMB: size })),
          potentialSavings: imageOptimization.potentialSavings,
          recommendations: imageOptimization.recommendations,
          files: [{
            path: `${outputDir}/phase5-optimization-report.json`,
            format: 'json',
            label: 'Image Optimization Report'
          }]
        }
      });
    }
  }

  // ============================================================================
  // PHASE 6: SBOM GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Generating Software Bill of Materials (SBOM)');

  const sbomGeneration = await ctx.task(sbomGenerationTask, {
    projectName,
    imageName,
    imageDigests,
    sbomRequired,
    outputDir
  });

  if (sbomRequired && !sbomGeneration.success) {
    ctx.log('error', 'SBOM generation failed but is required');

    await ctx.breakpoint({
      question: 'Phase 6 Quality Gate: SBOM generation is required but failed. Retry or proceed without SBOM?',
      title: 'SBOM Generation Gate',
      context: {
        runId: ctx.runId,
        sbomRequired,
        error: sbomGeneration.error,
        files: []
      }
    });
  }

  if (sbomGeneration.success) {
    artifacts.push(...sbomGeneration.artifacts);
    ctx.log('info', `Generated SBOMs for ${Object.keys(sbomGeneration.sboms).length} images`);
  }

  // ============================================================================
  // PHASE 7: IMAGE SIGNING AND ATTESTATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Signing images and generating attestations');

  const imageSigning = await ctx.task(imageSigningTask, {
    projectName,
    imageName,
    containerRegistry,
    imageDigests,
    sboms: sbomGeneration.sboms || {},
    signingRequired,
    outputDir
  });

  if (signingRequired && !imageSigning.success) {
    ctx.log('error', 'Image signing failed but is required');

    await ctx.breakpoint({
      question: 'Phase 7 Quality Gate: Image signing is required but failed. Retry or proceed without signatures?',
      title: 'Image Signing Gate',
      context: {
        runId: ctx.runId,
        signingRequired,
        error: imageSigning.error,
        files: []
      }
    });
  }

  if (imageSigning.success) {
    artifacts.push(...imageSigning.artifacts);
    ctx.log('info', `Signed ${Object.keys(imageSigning.signatures).length} images`);
  }

  // ============================================================================
  // PHASE 8: REGISTRY MANAGEMENT AND PUSH
  // ============================================================================

  ctx.log('info', 'Phase 8: Configuring registry policies and pushing images');

  const registryManagement = await ctx.task(registryManagementTask, {
    projectName,
    containerRegistry,
    imageName,
    imageDigests,
    targetEnvironments,
    registryConfig,
    signatures: imageSigning.signatures || {},
    outputDir
  });

  if (!registryManagement.success) {
    return {
      success: false,
      error: 'Failed to push images to registry',
      details: registryManagement,
      metadata: {
        processId: 'specializations/devops-sre-platform/container-image-management',
        timestamp: startTime
      }
    };
  }

  registryStatus = registryManagement.registryStatus;
  artifacts.push(...registryManagement.artifacts);

  // Quality Gate: All images pushed successfully
  const failedPushes = targetArchitectures.filter(
    arch => !registryManagement.registryStatus.pushedImages[arch]
  );

  if (failedPushes.length > 0) {
    ctx.log('error', `Failed to push ${failedPushes.length} image(s) to registry`);

    await ctx.breakpoint({
      question: `Phase 8 Quality Gate: Failed to push ${failedPushes.length} image(s) to registry. Review errors and retry?`,
      title: 'Registry Push Gate',
      context: {
        runId: ctx.runId,
        containerRegistry,
        successfulPushes: Object.keys(registryManagement.registryStatus.pushedImages).length,
        failedPushes: failedPushes.length,
        failedArchitectures: failedPushes,
        errors: registryManagement.errors,
        files: [{
          path: `${outputDir}/phase8-registry-report.json`,
          format: 'json',
          label: 'Registry Management Report'
        }]
      }
    });
  }

  // ============================================================================
  // PHASE 9: MANIFEST LIST CREATION (Multi-arch)
  // ============================================================================

  ctx.log('info', 'Phase 9: Creating multi-architecture manifest list');

  const manifestCreation = await ctx.task(manifestListTask, {
    projectName,
    containerRegistry,
    imageName,
    imageDigests,
    targetArchitectures,
    targetEnvironments,
    outputDir
  });

  if (!manifestCreation.success) {
    ctx.log('warn', 'Manifest list creation failed, images are available but not as unified multi-arch image');
  } else {
    artifacts.push(...manifestCreation.artifacts);
    ctx.log('info', `Created manifest lists for ${manifestCreation.manifestTags.length} tags`);
  }

  // ============================================================================
  // PHASE 10: RUNTIME TESTING AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Testing images in runtime environment');

  const runtimeTesting = await ctx.task(runtimeTestingTask, {
    projectName,
    containerRegistry,
    imageName,
    imageDigests,
    targetArchitectures,
    outputDir
  });

  if (!runtimeTesting.success) {
    ctx.log('warn', 'Runtime testing encountered issues');
  } else {
    artifacts.push(...runtimeTesting.artifacts);
  }

  // Quality Gate: Runtime tests pass
  if (runtimeTesting.failedTests > 0) {
    ctx.log('warn', `${runtimeTesting.failedTests} runtime test(s) failed`);

    await ctx.breakpoint({
      question: `Phase 10 Quality Gate: ${runtimeTesting.failedTests} runtime test(s) failed. Review failures and fix issues?`,
      title: 'Runtime Testing Gate',
      context: {
        runId: ctx.runId,
        passedTests: runtimeTesting.passedTests,
        failedTests: runtimeTesting.failedTests,
        failures: runtimeTesting.testFailures,
        files: [{
          path: `${outputDir}/phase10-runtime-testing.json`,
          format: 'json',
          label: 'Runtime Test Report'
        }]
      }
    });
  }

  // ============================================================================
  // PHASE 11: CI/CD INTEGRATION SETUP
  // ============================================================================

  if (cicdIntegration) {
    ctx.log('info', 'Phase 11: Setting up CI/CD integration');

    const cicdSetup = await ctx.task(cicdIntegrationTask, {
      projectName,
      containerRegistry,
      imageName,
      buildContext,
      dockerfilePath,
      targetArchitectures,
      securityCompliance,
      signingRequired,
      sbomRequired,
      outputDir
    });

    if (cicdSetup.success) {
      artifacts.push(...cicdSetup.artifacts);
      ctx.log('info', 'CI/CD pipeline configuration generated');
    }
  }

  // ============================================================================
  // PHASE 12: DEPLOYMENT READINESS REPORT
  // ============================================================================

  ctx.log('info', 'Phase 12: Generating deployment readiness report');

  const deploymentReadiness = await ctx.task(deploymentReadinessTask, {
    projectName,
    containerRegistry,
    imageName,
    imageDigests,
    securityReport,
    optimizationMetrics,
    registryStatus,
    sbomGeneration,
    imageSigning,
    runtimeTesting,
    manifestCreation,
    targetEnvironments,
    outputDir
  });

  artifacts.push(...deploymentReadiness.artifacts);

  const deploymentReady = deploymentReadiness.overallScore >= 80 &&
                          securityReport.criticalVulnerabilities === 0 &&
                          (signingRequired ? imageSigning.success : true) &&
                          (sbomRequired ? sbomGeneration.success : true);

  // Final Quality Gate: Deployment readiness
  if (!deploymentReady) {
    await ctx.breakpoint({
      question: `Final Quality Gate: Deployment readiness score is ${deploymentReadiness.overallScore}/100. ${deploymentReady ? 'PASSED' : 'FAILED'}. Review summary and approve for deployment?`,
      title: 'Deployment Readiness Gate',
      context: {
        runId: ctx.runId,
        overallScore: deploymentReadiness.overallScore,
        deploymentReady,
        summary: {
          imagesBuilt: Object.keys(imageDigests).length,
          securityScore: deploymentReadiness.securityScore,
          optimizationScore: deploymentReadiness.optimizationScore,
          qualityScore: deploymentReadiness.qualityScore,
          criticalVulnerabilities: securityReport.criticalVulnerabilities,
          imagesSigned: imageSigning.success,
          sbomsGenerated: sbomGeneration.success,
          runtimeTestsPassed: runtimeTesting.passedTests
        },
        blockers: deploymentReadiness.blockers,
        warnings: deploymentReadiness.warnings,
        files: [{
          path: `${outputDir}/deployment-readiness-report.md`,
          format: 'markdown',
          label: 'Deployment Readiness Report'
        }, {
          path: `${outputDir}/deployment-readiness-report.json`,
          format: 'json',
          label: 'Deployment Readiness Data'
        }]
      }
    });
  }

  const endTime = ctx.now();
  const duration = endTime - startTime;

  ctx.log('info', `Container Image Build and Registry Management completed in ${duration}ms`);
  ctx.log('info', `Images built: ${Object.keys(imageDigests).length}, Registry: ${containerRegistry}/${imageName}`);
  ctx.log('info', `Security: ${securityReport.criticalVulnerabilities} CRITICAL, ${securityReport.highVulnerabilities} HIGH vulnerabilities`);
  ctx.log('info', `Deployment Ready: ${deploymentReady ? 'YES' : 'NO'}`);

  return {
    success: true,
    projectName,
    containerRegistry,
    imageName,
    imageDigests,
    securityReport,
    optimizationMetrics,
    registryStatus,
    sboms: sbomGeneration.sboms || {},
    signatures: imageSigning.signatures || {},
    manifestLists: manifestCreation.manifestTags || [],
    runtimeTestResults: {
      passed: runtimeTesting.passedTests,
      failed: runtimeTesting.failedTests,
      testCoverage: runtimeTesting.testCoverage
    },
    deploymentReadiness: {
      ready: deploymentReady,
      score: deploymentReadiness.overallScore,
      securityScore: deploymentReadiness.securityScore,
      optimizationScore: deploymentReadiness.optimizationScore,
      qualityScore: deploymentReadiness.qualityScore,
      blockers: deploymentReadiness.blockers,
      warnings: deploymentReadiness.warnings,
      recommendations: deploymentReadiness.recommendations
    },
    artifacts,
    imageTags: manifestCreation.manifestTags || [],
    registryUrls: Object.keys(imageDigests).map(arch =>
      `${containerRegistry}/${imageName}@${imageDigests[arch]}`
    ),
    metadata: {
      processId: 'specializations/devops-sre-platform/container-image-management',
      processSlug: 'container-image-management',
      category: 'container-orchestration',
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

export const dockerfileAnalysisTask = defineTask('dockerfile-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze Dockerfile: ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior Container Engineer specialized in Dockerfile best practices and optimization',
      task: 'Analyze Dockerfile for security, efficiency, and best practices compliance',
      context: args,
      instructions: [
        'Review Dockerfile structure and instruction ordering',
        'Check for multi-stage build usage',
        'Analyze layer optimization and caching strategy',
        'Validate base image selection (minimal, security-hardened)',
        'Check for root user usage (should use non-root)',
        'Review COPY vs ADD usage',
        'Validate .dockerignore file presence and contents',
        'Check for hardcoded secrets or sensitive data',
        'Analyze RUN instruction consolidation',
        'Review LABEL usage for metadata',
        'Check HEALTHCHECK configuration',
        'Validate ENTRYPOINT and CMD usage',
        'Assess security best practices (USER, no curl/wget in final stage)',
        'Calculate Dockerfile quality score (0-100)',
        'Generate improvement recommendations'
      ],
      outputFormat: 'JSON with success, score, detectedBaseImage, findings (severity, category, issue, line, recommendation), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'score', 'detectedBaseImage', 'findings', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        detectedBaseImage: { type: 'string' },
        multiStageUsed: { type: 'boolean' },
        layerCount: { type: 'number' },
        findings: {
          type: 'array',
          items: {
            type: 'object',
            required: ['severity', 'category', 'issue', 'recommendation'],
            properties: {
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'info'] },
              category: { type: 'string' },
              issue: { type: 'string' },
              line: { type: 'number' },
              recommendation: { type: 'string' }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['container', 'dockerfile', 'analysis', 'best-practices']
}));

export const baseImageScanTask = defineTask('base-image-scan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Scan Base Image: ${args.baseImage}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Container Security Engineer specialized in vulnerability scanning',
      task: 'Scan container base image for vulnerabilities and recommend secure alternatives',
      context: args,
      instructions: [
        'Pull and scan base image using Trivy, Grype, or similar scanner',
        'Identify all CVEs (Common Vulnerabilities and Exposures)',
        'Categorize vulnerabilities by severity (CRITICAL, HIGH, MEDIUM, LOW)',
        'Check for outdated packages and available updates',
        'Assess base image age and maintenance status',
        'Identify exploitable vulnerabilities',
        'Check for malware or suspicious files',
        `Apply security compliance level: ${args.securityCompliance}`,
        'Research secure alternative base images (Alpine, Distroless, Chainguard)',
        'Compare vulnerability counts across alternatives',
        'Generate detailed vulnerability report with CVE details',
        'Provide remediation recommendations'
      ],
      outputFormat: 'JSON with success, baseImage, vulnerabilities (array with cve, severity, package, fixedVersion), recommendedAlternatives, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'baseImage', 'vulnerabilities', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        baseImage: { type: 'string' },
        scanTimestamp: { type: 'string' },
        vulnerabilities: {
          type: 'array',
          items: {
            type: 'object',
            required: ['cve', 'severity', 'package'],
            properties: {
              cve: { type: 'string' },
              severity: { type: 'string', enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'UNKNOWN'] },
              package: { type: 'string' },
              installedVersion: { type: 'string' },
              fixedVersion: { type: 'string' },
              description: { type: 'string' },
              exploitable: { type: 'boolean' },
              references: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        recommendedAlternatives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              image: { type: 'string' },
              vulnerabilityCount: { type: 'number' },
              sizeReduction: { type: 'string' },
              reason: { type: 'string' }
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
  labels: ['container', 'security', 'vulnerability-scan', 'base-image']
}));

export const multiArchBuildTask = defineTask('multi-arch-build', (args, taskCtx) => ({
  kind: 'agent',
  title: `Build Multi-Architecture Images: ${args.imageName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps Engineer specialized in container builds and multi-architecture support',
      task: 'Build container images for multiple target architectures using Docker Buildx',
      context: args,
      instructions: [
        'Set up Docker Buildx builder with multi-platform support',
        `Build images for architectures: ${args.targetArchitectures.join(', ')}`,
        'Use BuildKit caching for faster builds',
        'Apply build arguments if provided',
        'Tag images with architecture-specific tags',
        'Capture build logs for each architecture',
        'Measure build time and resource usage',
        'Verify build success for each platform',
        'Capture image digests (SHA256)',
        'Analyze image sizes per architecture',
        'Generate build report with digests and metadata',
        'Save build cache for future builds'
      ],
      outputFormat: 'JSON with success, imageDigests (object mapping arch to digest), buildLogs, buildMetrics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'imageDigests', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        imageDigests: {
          type: 'object',
          additionalProperties: { type: 'string' },
          description: 'Map of architecture to image digest'
        },
        buildLogs: {
          type: 'object',
          additionalProperties: { type: 'string' },
          description: 'Build logs per architecture'
        },
        buildMetrics: {
          type: 'object',
          properties: {
            totalBuildTime: { type: 'number', description: 'seconds' },
            cacheHitRate: { type: 'number', description: 'percentage' },
            averageLayerSize: { type: 'number', description: 'MB' }
          }
        },
        imageSizes: {
          type: 'object',
          additionalProperties: { type: 'number' },
          description: 'Image sizes in MB per architecture'
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['container', 'build', 'multi-arch', 'docker-buildx']
}));

export const securityScanTask = defineTask('security-scan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Security Scan: ${args.architecture}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Container Security Specialist',
      task: 'Perform comprehensive security scanning on built container image',
      context: args,
      instructions: [
        'Scan image for vulnerabilities using Trivy or Grype',
        'Detect misconfigurations (exposed ports, root user, etc.)',
        'Scan for embedded secrets and credentials',
        'Check for malware and suspicious files',
        'Validate security best practices',
        'Check for SUID/SGID binaries',
        'Scan for setcap capabilities',
        'Validate user permissions',
        'Check for unnecessary packages',
        `Apply security compliance: ${args.securityCompliance}`,
        'Generate CVSS scores for vulnerabilities',
        'Prioritize findings by exploitability',
        'Provide remediation guidance'
      ],
      outputFormat: 'JSON with success, vulnerabilities, misconfigurations, secrets, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'vulnerabilities', 'misconfigurations', 'secrets', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        architecture: { type: 'string' },
        vulnerabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              cve: { type: 'string' },
              severity: { type: 'string' },
              package: { type: 'string' },
              installedVersion: { type: 'string' },
              fixedVersion: { type: 'string' },
              cvssScore: { type: 'number' }
            }
          }
        },
        misconfigurations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              severity: { type: 'string' },
              description: { type: 'string' },
              remediation: { type: 'string' }
            }
          }
        },
        secrets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              location: { type: 'string' },
              severity: { type: 'string' }
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
  labels: ['container', 'security', 'vulnerability-scan', args.architecture]
}));

export const imageOptimizationTask = defineTask('image-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Optimize Images: ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Container Optimization Engineer',
      task: 'Analyze image size and layers, provide optimization recommendations',
      context: args,
      instructions: [
        'Analyze image layers and layer sizes',
        'Identify largest layers and their contents',
        'Check for duplicate files across layers',
        'Identify unnecessary files (docs, caches, temp files)',
        'Analyze package installation patterns',
        'Check for build artifacts in final image',
        'Compare against size goals',
        'Calculate potential size reduction',
        'Recommend layer consolidation strategies',
        'Suggest multi-stage build improvements',
        'Recommend base image alternatives for size reduction',
        'Provide specific Dockerfile modifications',
        'Estimate compression improvements'
      ],
      outputFormat: 'JSON with success, metrics, recommendations, potentialSavings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'metrics', 'recommendations', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        metrics: {
          type: 'object',
          properties: {
            imageSizes: { type: 'object', additionalProperties: { type: 'number' } },
            layerCounts: { type: 'object', additionalProperties: { type: 'number' } },
            largestLayers: { type: 'array' },
            duplicateFiles: { type: 'number' }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              description: { type: 'string' },
              estimatedSavingsMB: { type: 'number' },
              effort: { type: 'string' },
              priority: { type: 'string' }
            }
          }
        },
        potentialSavings: { type: 'number', description: 'Total potential size reduction in MB' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['container', 'optimization', 'size-reduction']
}));

export const sbomGenerationTask = defineTask('sbom-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate SBOM: ${args.imageName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Software Supply Chain Security Engineer',
      task: 'Generate Software Bill of Materials (SBOM) for container images',
      context: args,
      instructions: [
        'Generate SBOM using Syft or similar tool',
        'Include all packages and dependencies',
        'Capture package versions and licenses',
        'Generate in SPDX and CycloneDX formats',
        'Include OS packages and application dependencies',
        'Capture file hashes for verification',
        'Add provenance information',
        'Include build metadata',
        'Generate SBOMs for all architectures',
        'Validate SBOM completeness',
        'Store SBOMs in registry as attachments',
        'Generate human-readable SBOM summary'
      ],
      outputFormat: 'JSON with success, sboms (object mapping arch to SBOM path), componentCount, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'sboms', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        sboms: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              spdxPath: { type: 'string' },
              cyclonedxPath: { type: 'string' },
              format: { type: 'string' }
            }
          },
          description: 'SBOM files per architecture'
        },
        componentCount: { type: 'number' },
        licenses: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['container', 'sbom', 'supply-chain', 'compliance']
}));

export const imageSigningTask = defineTask('image-signing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Sign Images: ${args.imageName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Container Security Engineer specialized in image signing and attestation',
      task: 'Sign container images and generate attestations using Cosign',
      context: args,
      instructions: [
        'Set up Cosign keyless signing (if no keys provided)',
        'Sign all image digests',
        'Attach SBOM attestations to images',
        'Generate in-toto attestations',
        'Create SLSA provenance attestations',
        'Sign manifest lists',
        'Store signatures in registry',
        'Generate signature verification commands',
        'Create attestation policy',
        'Validate signatures after creation',
        'Generate signing report',
        'Document signature verification process'
      ],
      outputFormat: 'JSON with success, signatures (object mapping arch to signature details), attestations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'signatures', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        signatures: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              signatureDigest: { type: 'string' },
              publicKey: { type: 'string' },
              timestamp: { type: 'string' }
            }
          },
          description: 'Signatures per architecture'
        },
        attestations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              digest: { type: 'string' }
            }
          }
        },
        verificationCommand: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['container', 'signing', 'cosign', 'attestation']
}));

export const registryManagementTask = defineTask('registry-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Registry Management: ${args.containerRegistry}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Container Registry Administrator',
      task: 'Push images to registry and configure registry policies',
      context: args,
      instructions: [
        'Authenticate to container registry',
        'Configure registry policies (retention, immutability)',
        'Push images for all architectures',
        'Push signatures and attestations',
        'Tag images for different environments',
        'Configure vulnerability scanning in registry',
        'Set up replication if enabled',
        'Configure access controls',
        'Enable audit logging',
        'Set up webhook notifications',
        'Validate successful push',
        'Generate registry access documentation'
      ],
      outputFormat: 'JSON with success, registryStatus (pushedImages, tags, policies), errors, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'registryStatus', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        registryStatus: {
          type: 'object',
          properties: {
            pushedImages: {
              type: 'object',
              additionalProperties: { type: 'boolean' }
            },
            tags: { type: 'array', items: { type: 'string' } },
            retentionPolicy: { type: 'string' },
            immutableTags: { type: 'boolean' },
            replicationEnabled: { type: 'boolean' }
          }
        },
        errors: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['container', 'registry', 'push', args.containerRegistry]
}));

export const manifestListTask = defineTask('manifest-list', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create Manifest List: ${args.imageName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Container Engineer',
      task: 'Create multi-architecture manifest lists for unified image references',
      context: args,
      instructions: [
        'Create manifest list combining all architecture-specific images',
        'Tag manifest list with version tags',
        'Tag with environment-specific tags (prod, staging, dev)',
        'Tag with latest if appropriate',
        'Tag with semantic version tags',
        'Push manifest lists to registry',
        'Verify manifest list integrity',
        'Test pulling manifest list on different architectures',
        'Generate pull commands for different environments',
        'Document manifest list structure'
      ],
      outputFormat: 'JSON with success, manifestTags (array of tag names), pullCommands, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'manifestTags', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        manifestTags: { type: 'array', items: { type: 'string' } },
        pullCommands: {
          type: 'object',
          additionalProperties: { type: 'string' },
          description: 'Pull commands per environment'
        },
        manifestDigest: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['container', 'manifest', 'multi-arch']
}));

export const runtimeTestingTask = defineTask('runtime-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Runtime Testing: ${args.imageName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Container Testing Engineer',
      task: 'Test container images in runtime environment for functionality and performance',
      context: args,
      instructions: [
        'Pull images from registry',
        'Run containers for each architecture',
        'Test container startup and health checks',
        'Verify application functionality',
        'Test resource limits and constraints',
        'Check network connectivity',
        'Test volume mounts and permissions',
        'Validate environment variable handling',
        'Test graceful shutdown',
        'Measure startup time',
        'Check memory and CPU usage',
        'Test under load if applicable',
        'Validate logging output'
      ],
      outputFormat: 'JSON with success, passedTests, failedTests, testFailures, testCoverage, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'passedTests', 'failedTests', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        passedTests: { type: 'number' },
        failedTests: { type: 'number' },
        testFailures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              test: { type: 'string' },
              architecture: { type: 'string' },
              error: { type: 'string' }
            }
          }
        },
        testCoverage: { type: 'number' },
        performanceMetrics: {
          type: 'object',
          properties: {
            startupTime: { type: 'number' },
            memoryUsageMB: { type: 'number' },
            cpuUsage: { type: 'number' }
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
  labels: ['container', 'testing', 'runtime', 'integration']
}));

export const cicdIntegrationTask = defineTask('cicd-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `CI/CD Integration: ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps Engineer specialized in CI/CD pipelines',
      task: 'Generate CI/CD pipeline configuration for automated container builds',
      context: args,
      instructions: [
        'Create GitHub Actions / GitLab CI / Jenkins pipeline configuration',
        'Configure multi-architecture build jobs',
        'Add security scanning steps',
        'Configure SBOM generation',
        'Add image signing steps',
        'Configure registry push',
        'Add manifest list creation',
        'Configure automated testing',
        'Set up deployment triggers',
        'Configure secrets management',
        'Add quality gates',
        'Generate pipeline documentation'
      ],
      outputFormat: 'JSON with success, pipelineConfig, pipelineType, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'pipelineConfig', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        pipelineType: { type: 'string' },
        pipelineConfig: { type: 'string', description: 'Path to generated pipeline file' },
        pipelineStages: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['container', 'cicd', 'automation', 'pipeline']
}));

export const deploymentReadinessTask = defineTask('deployment-readiness', (args, taskCtx) => ({
  kind: 'agent',
  title: `Deployment Readiness: ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Release Manager',
      task: 'Assess deployment readiness and generate comprehensive report',
      context: args,
      instructions: [
        'Calculate overall deployment readiness score (0-100)',
        'Assess security posture',
        'Evaluate image optimization status',
        'Check SBOM and signing compliance',
        'Evaluate runtime test results',
        'Review registry configuration',
        'Identify deployment blockers',
        'List warnings and recommendations',
        'Generate deployment checklist',
        'Create rollback plan',
        'Document deployment process',
        'Generate executive summary'
      ],
      outputFormat: 'JSON with overallScore, securityScore, optimizationScore, qualityScore, blockers, warnings, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'securityScore', 'optimizationScore', 'qualityScore', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        securityScore: { type: 'number', minimum: 0, maximum: 100 },
        optimizationScore: { type: 'number', minimum: 0, maximum: 100 },
        qualityScore: { type: 'number', minimum: 0, maximum: 100 },
        blockers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              description: { type: 'string' },
              severity: { type: 'string' }
            }
          }
        },
        warnings: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        deploymentChecklist: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['container', 'deployment', 'readiness', 'assessment']
}));
