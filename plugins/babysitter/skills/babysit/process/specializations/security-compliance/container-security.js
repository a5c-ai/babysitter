/**
 * @process security-compliance/container-security
 * @description Container Security Scanning - Comprehensive container security framework covering image scanning,
 * vulnerability detection, registry security, runtime protection, policy enforcement, and compliance validation
 * using industry-leading tools like Trivy, Clair, Grype, and runtime security solutions.
 * @inputs { containerImages: array, registryUrl?: string, scanDepth?: string, severityThreshold?: string, policyEnforcement?: boolean, runtimeProtection?: boolean }
 * @outputs { success: boolean, securityScore: number, vulnerabilities: array, complianceStatus: object, scanResults: object, remediationPlan: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/security-compliance/container-security', {
 *   containerImages: ['myapp:latest', 'myapi:v1.2.3', 'nginx:alpine'],
 *   registryUrl: 'https://registry.example.com',
 *   scanDepth: 'comprehensive',
 *   severityThreshold: 'medium',
 *   policyEnforcement: true,
 *   runtimeProtection: true,
 *   complianceStandards: ['CIS-Docker', 'NIST-800-190', 'PCI-DSS'],
 *   failOnCritical: true,
 *   generateSBOM: true,
 *   signImages: true
 * });
 *
 * @references
 * - NIST 800-190 Container Security: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-190.pdf
 * - CIS Docker Benchmark: https://www.cisecurity.org/benchmark/docker
 * - Trivy Documentation: https://aquasecurity.github.io/trivy/
 * - Clair Project: https://quay.github.io/clair/
 * - Grype Scanner: https://github.com/anchore/grype
 * - OPA Policies: https://www.openpolicyagent.org/
 * - Falco Runtime Security: https://falco.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    containerImages = [],
    registryUrl,
    scanDepth = 'comprehensive',
    severityThreshold = 'medium',
    policyEnforcement = true,
    runtimeProtection = false,
    complianceStandards = ['CIS-Docker', 'NIST-800-190'],
    failOnCritical = true,
    generateSBOM = true,
    signImages = false,
    outputDir = 'container-security-output'
  } = inputs;

  if (!containerImages || containerImages.length === 0) {
    return {
      success: false,
      error: 'No container images provided for scanning',
      metadata: { processId: 'security-compliance/container-security', timestamp: ctx.now() }
    };
  }

  const startTime = ctx.now();
  const artifacts = [];
  const allVulnerabilities = [];
  const scanResultsByImage = {};

  ctx.log('info', `Starting container security scanning for ${containerImages.length} image(s)`);

  // Task 1: Container Image Discovery and Validation
  ctx.log('info', 'Discovering and validating container images');
  const imageDiscovery = await ctx.task(imageDiscoveryTask, {
    containerImages,
    registryUrl,
    outputDir
  });

  if (!imageDiscovery.success) {
    return {
      success: false,
      error: 'Image discovery and validation failed',
      details: imageDiscovery,
      metadata: { processId: 'security-compliance/container-security', timestamp: startTime }
    };
  }

  artifacts.push(...imageDiscovery.artifacts);
  const validatedImages = imageDiscovery.validatedImages;

  // Task 2: Vulnerability Scanning (Trivy)
  ctx.log('info', 'Running vulnerability scanning with Trivy');
  const trivyResults = await ctx.task(trivyVulnerabilityScanTask, {
    images: validatedImages,
    scanDepth,
    severityThreshold,
    generateSBOM,
    outputDir
  });

  artifacts.push(...trivyResults.artifacts);
  allVulnerabilities.push(...trivyResults.vulnerabilities);
  validatedImages.forEach((img, idx) => {
    scanResultsByImage[img.name] = {
      trivy: trivyResults.imageResults[idx]
    };
  });

  // Task 3: Additional Vulnerability Scanning (Grype)
  ctx.log('info', 'Running cross-validation scanning with Grype');
  const grypeResults = await ctx.task(grypeVulnerabilityScanTask, {
    images: validatedImages,
    severityThreshold,
    outputDir
  });

  artifacts.push(...grypeResults.artifacts);
  allVulnerabilities.push(...grypeResults.vulnerabilities);
  validatedImages.forEach((img, idx) => {
    scanResultsByImage[img.name].grype = grypeResults.imageResults[idx];
  });

  // Task 4: Malware and Secret Detection
  ctx.log('info', 'Scanning for malware and exposed secrets');
  const malwareSecretScan = await ctx.task(malwareSecretDetectionTask, {
    images: validatedImages,
    outputDir
  });

  artifacts.push(...malwareSecretScan.artifacts);

  // Task 5: Configuration Security Assessment
  ctx.log('info', 'Assessing container configuration security');
  const configAssessment = await ctx.task(containerConfigurationAssessmentTask, {
    images: validatedImages,
    complianceStandards,
    outputDir
  });

  artifacts.push(...configAssessment.artifacts);

  // Task 6: Base Image and Layer Analysis
  ctx.log('info', 'Analyzing base images and layer security');
  const layerAnalysis = await ctx.task(layerSecurityAnalysisTask, {
    images: validatedImages,
    outputDir
  });

  artifacts.push(...layerAnalysis.artifacts);

  // Task 7: Registry Security Validation
  if (registryUrl) {
    ctx.log('info', 'Validating registry security configuration');
    const registryValidation = await ctx.task(registrySecurityValidationTask, {
      registryUrl,
      images: validatedImages,
      outputDir
    });
    artifacts.push(...registryValidation.artifacts);
  }

  // Task 8: Policy Enforcement
  if (policyEnforcement) {
    ctx.log('info', 'Enforcing security policies');
    const policyCheck = await ctx.task(policyEnforcementTask, {
      images: validatedImages,
      scanResults: scanResultsByImage,
      vulnerabilities: allVulnerabilities,
      configAssessment,
      severityThreshold,
      failOnCritical,
      outputDir
    });

    artifacts.push(...policyCheck.artifacts);

    if (!policyCheck.passed && failOnCritical) {
      ctx.log('error', 'Critical security policy violations detected');
      return {
        success: false,
        policyViolations: policyCheck.violations,
        criticalIssues: policyCheck.criticalIssues,
        vulnerabilities: allVulnerabilities,
        artifacts,
        metadata: { processId: 'security-compliance/container-security', timestamp: startTime }
      };
    }
  }

  // Task 9: Compliance Validation
  ctx.log('info', 'Validating compliance against security standards');
  const complianceValidation = await ctx.task(complianceValidationTask, {
    images: validatedImages,
    scanResults: scanResultsByImage,
    configAssessment,
    layerAnalysis,
    complianceStandards,
    outputDir
  });

  artifacts.push(...complianceValidation.artifacts);

  // Task 10: Image Signing (if requested)
  let signingResults = null;
  if (signImages) {
    ctx.log('info', 'Signing container images');
    signingResults = await ctx.task(imageSigningTask, {
      images: validatedImages,
      registryUrl,
      outputDir
    });
    artifacts.push(...signingResults.artifacts);
  }

  // Task 11: Runtime Protection Setup (if requested)
  let runtimeProtectionSetup = null;
  if (runtimeProtection) {
    ctx.log('info', 'Setting up runtime protection policies');
    runtimeProtectionSetup = await ctx.task(runtimeProtectionSetupTask, {
      images: validatedImages,
      vulnerabilities: allVulnerabilities,
      outputDir
    });
    artifacts.push(...runtimeProtectionSetup.artifacts);
  }

  // Task 12: Security Score Calculation
  ctx.log('info', 'Calculating overall security score');
  const securityScoring = await ctx.task(securityScoringTask, {
    scanResults: scanResultsByImage,
    vulnerabilities: allVulnerabilities,
    configAssessment,
    malwareSecretScan,
    layerAnalysis,
    complianceValidation,
    severityThreshold,
    outputDir
  });

  artifacts.push(...securityScoring.artifacts);
  const securityScore = securityScoring.score;

  // Task 13: Remediation Plan Generation
  ctx.log('info', 'Generating remediation plan');
  const remediationPlan = await ctx.task(remediationPlanGenerationTask, {
    vulnerabilities: allVulnerabilities,
    configAssessment,
    malwareSecretScan,
    layerAnalysis,
    complianceValidation,
    securityScore,
    severityThreshold,
    outputDir
  });

  artifacts.push(...remediationPlan.artifacts);

  // Task 14: Comprehensive Security Report
  ctx.log('info', 'Generating comprehensive security report');
  const securityReport = await ctx.task(securityReportGenerationTask, {
    images: validatedImages,
    scanResults: scanResultsByImage,
    vulnerabilities: allVulnerabilities,
    configAssessment,
    malwareSecretScan,
    layerAnalysis,
    complianceValidation,
    securityScore,
    remediationPlan,
    signingResults,
    runtimeProtectionSetup,
    outputDir
  });

  artifacts.push(...securityReport.artifacts);

  // Breakpoint: Review security findings
  await ctx.breakpoint({
    question: `Container security scan complete. Security score: ${securityScore}/100. ${allVulnerabilities.length} vulnerabilities found. Review findings?`,
    title: 'Container Security Scan Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        securityScore,
        totalImages: containerImages.length,
        totalVulnerabilities: allVulnerabilities.length,
        criticalVulnerabilities: allVulnerabilities.filter(v => v.severity === 'CRITICAL').length,
        highVulnerabilities: allVulnerabilities.filter(v => v.severity === 'HIGH').length,
        mediumVulnerabilities: allVulnerabilities.filter(v => v.severity === 'MEDIUM').length,
        complianceStatus: complianceValidation.overallCompliance,
        secretsDetected: malwareSecretScan.secretsFound,
        malwareDetected: malwareSecretScan.malwareFound
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    securityScore,
    vulnerabilities: allVulnerabilities,
    scanResults: scanResultsByImage,
    complianceStatus: complianceValidation,
    configurationIssues: configAssessment.issues,
    secretsDetected: malwareSecretScan.secrets,
    malwareDetected: malwareSecretScan.malware,
    remediationPlan: remediationPlan.plan,
    signingResults: signingResults?.results,
    runtimeProtection: runtimeProtectionSetup?.policies,
    artifacts,
    duration,
    metadata: {
      processId: 'security-compliance/container-security',
      timestamp: startTime,
      imagesScanned: containerImages.length,
      outputDir
    }
  };
}

// Task 1: Image Discovery and Validation
export const imageDiscoveryTask = defineTask('image-discovery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Discover and validate container images',
  agent: {
    name: 'image-validator',
    prompt: {
      role: 'container security engineer',
      task: 'Discover, pull, and validate container images for security scanning',
      context: args,
      instructions: [
        'Validate image references and tags',
        'Check image accessibility from registry',
        'Pull images if not locally available',
        'Extract image metadata (size, layers, created date, digest)',
        'Verify image integrity using digests',
        'Identify base images and parent layers',
        'Document image architecture and OS',
        'Save image inventory to output directory'
      ],
      outputFormat: 'JSON with success, validatedImages, artifacts, errors'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'validatedImages', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        validatedImages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              tag: { type: 'string' },
              digest: { type: 'string' },
              size: { type: 'string' },
              layers: { type: 'number' },
              architecture: { type: 'string' },
              os: { type: 'string' },
              created: { type: 'string' }
            }
          }
        },
        artifacts: { type: 'array' },
        errors: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'container-security', 'image-discovery', 'validation']
}));

// Task 2: Trivy Vulnerability Scanning
export const trivyVulnerabilityScanTask = defineTask('trivy-vulnerability-scan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Scan vulnerabilities with Trivy',
  agent: {
    name: 'trivy-scanner',
    prompt: {
      role: 'security scanner specialist',
      task: 'Scan container images for vulnerabilities using Trivy',
      context: args,
      instructions: [
        'Run Trivy scanner on each container image',
        'Scan OS packages for known CVEs',
        'Scan application dependencies (npm, pip, go modules, etc.)',
        'Detect outdated and vulnerable packages',
        'Generate SBOM (Software Bill of Materials) if requested',
        'Filter results by severity threshold',
        'Export results in JSON and table formats',
        'Generate vulnerability database with CVE details',
        'Save scan reports to output directory'
      ],
      outputFormat: 'JSON with vulnerabilities, imageResults, SBOM, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'imageResults', 'artifacts'],
      properties: {
        vulnerabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              image: { type: 'string' },
              vulnerabilityId: { type: 'string' },
              packageName: { type: 'string' },
              installedVersion: { type: 'string' },
              fixedVersion: { type: 'string' },
              severity: { type: 'string', enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'UNKNOWN'] },
              title: { type: 'string' },
              description: { type: 'string' },
              references: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        imageResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              image: { type: 'string' },
              critical: { type: 'number' },
              high: { type: 'number' },
              medium: { type: 'number' },
              low: { type: 'number' },
              total: { type: 'number' }
            }
          }
        },
        sbomGenerated: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'container-security', 'trivy', 'vulnerability-scanning', 'sbom']
}));

// Task 3: Grype Vulnerability Scanning
export const grypeVulnerabilityScanTask = defineTask('grype-vulnerability-scan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Cross-validate with Grype scanner',
  agent: {
    name: 'grype-scanner',
    prompt: {
      role: 'security scanner specialist',
      task: 'Scan container images for vulnerabilities using Grype for cross-validation',
      context: args,
      instructions: [
        'Run Grype scanner on each container image',
        'Scan for OS and language-specific vulnerabilities',
        'Cross-reference with Trivy results for validation',
        'Identify discrepancies between scanners',
        'Prioritize vulnerabilities found by both scanners',
        'Export results in JSON format',
        'Generate comparative analysis report',
        'Save scan reports to output directory'
      ],
      outputFormat: 'JSON with vulnerabilities, imageResults, comparison, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['vulnerabilities', 'imageResults', 'artifacts'],
      properties: {
        vulnerabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              image: { type: 'string' },
              vulnerabilityId: { type: 'string' },
              packageName: { type: 'string' },
              installedVersion: { type: 'string' },
              fixedVersion: { type: 'string' },
              severity: { type: 'string' },
              confirmedByMultipleScanners: { type: 'boolean' }
            }
          }
        },
        imageResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              image: { type: 'string' },
              critical: { type: 'number' },
              high: { type: 'number' },
              medium: { type: 'number' },
              low: { type: 'number' }
            }
          }
        },
        comparisonWithTrivy: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'container-security', 'grype', 'vulnerability-scanning', 'cross-validation']
}));

// Task 4: Malware and Secret Detection
export const malwareSecretDetectionTask = defineTask('malware-secret-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Detect malware and exposed secrets',
  agent: {
    name: 'secret-malware-detector',
    prompt: {
      role: 'security analyst',
      task: 'Scan container images for malware and exposed secrets',
      context: args,
      instructions: [
        'Scan for hardcoded secrets (API keys, passwords, tokens)',
        'Detect AWS credentials, GCP keys, Azure secrets',
        'Check for private SSH keys and certificates',
        'Scan for malware signatures and suspicious binaries',
        'Detect cryptocurrency miners',
        'Check for backdoors and rootkits',
        'Validate cryptographic material exposure',
        'Generate secret and malware detection report',
        'Provide remediation steps for each finding',
        'Save results to output directory'
      ],
      outputFormat: 'JSON with secrets, malware, secretsFound, malwareFound, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['secrets', 'malware', 'secretsFound', 'malwareFound', 'artifacts'],
      properties: {
        secrets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              image: { type: 'string' },
              secretType: { type: 'string' },
              location: { type: 'string' },
              severity: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        malware: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              image: { type: 'string' },
              malwareType: { type: 'string' },
              location: { type: 'string' },
              severity: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        secretsFound: { type: 'number' },
        malwareFound: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'container-security', 'secrets', 'malware', 'detection']
}));

// Task 5: Container Configuration Assessment
export const containerConfigurationAssessmentTask = defineTask('container-configuration-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess container configuration security',
  agent: {
    name: 'config-assessor',
    prompt: {
      role: 'container security architect',
      task: 'Assess container configuration against security best practices',
      context: args,
      instructions: [
        'Check if running as root user',
        'Validate security capabilities and privileges',
        'Check for excessive permissions',
        'Validate resource limits (CPU, memory)',
        'Check for health checks and liveness probes',
        'Assess network policies and exposure',
        'Validate filesystem permissions',
        'Check for proper user namespaces',
        'Assess against CIS Docker Benchmark',
        'Generate configuration security report',
        'Save assessment to output directory'
      ],
      outputFormat: 'JSON with issues, passed checks, failed checks, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['issues', 'passedChecks', 'failedChecks', 'artifacts'],
      properties: {
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              image: { type: 'string' },
              category: { type: 'string' },
              severity: { type: 'string' },
              issue: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        passedChecks: { type: 'array', items: { type: 'string' } },
        failedChecks: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'container-security', 'configuration', 'cis-benchmark']
}));

// Task 6: Layer Security Analysis
export const layerSecurityAnalysisTask = defineTask('layer-security-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze image layers and base images',
  agent: {
    name: 'layer-analyst',
    prompt: {
      role: 'container forensics expert',
      task: 'Analyze container layers for security issues and optimization opportunities',
      context: args,
      instructions: [
        'Inspect each image layer for vulnerabilities',
        'Identify vulnerable base images',
        'Check for outdated base images',
        'Analyze layer size and bloat',
        'Detect unnecessary packages and files',
        'Identify secrets or sensitive data in layers',
        'Recommend minimal base images',
        'Suggest layer optimization strategies',
        'Generate layer analysis report',
        'Save analysis to output directory'
      ],
      outputFormat: 'JSON with layerAnalysis, baseImageIssues, optimizations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['layerAnalysis', 'baseImageIssues', 'optimizations', 'artifacts'],
      properties: {
        layerAnalysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              image: { type: 'string' },
              totalLayers: { type: 'number' },
              vulnerableLayersCount: { type: 'number' },
              totalSize: { type: 'string' },
              bloatedLayers: { type: 'array' }
            }
          }
        },
        baseImageIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              image: { type: 'string' },
              baseImage: { type: 'string' },
              issue: { type: 'string' },
              recommendedAlternative: { type: 'string' }
            }
          }
        },
        optimizations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'container-security', 'layer-analysis', 'optimization']
}));

// Task 7: Registry Security Validation
export const registrySecurityValidationTask = defineTask('registry-security-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate container registry security',
  agent: {
    name: 'registry-validator',
    prompt: {
      role: 'registry security specialist',
      task: 'Validate container registry security configuration and policies',
      context: args,
      instructions: [
        'Verify registry authentication mechanisms',
        'Check for TLS/SSL configuration',
        'Validate image signing and verification setup',
        'Check for vulnerability scanning integration',
        'Assess access control policies',
        'Validate retention and lifecycle policies',
        'Check for audit logging configuration',
        'Assess backup and disaster recovery',
        'Generate registry security report',
        'Save assessment to output directory'
      ],
      outputFormat: 'JSON with registrySecurityStatus, issues, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['registrySecurityStatus', 'issues', 'artifacts'],
      properties: {
        registrySecurityStatus: {
          type: 'object',
          properties: {
            tlsEnabled: { type: 'boolean' },
            authenticationConfigured: { type: 'boolean' },
            imageSigningEnabled: { type: 'boolean' },
            vulnerabilityScanningEnabled: { type: 'boolean' },
            auditLoggingEnabled: { type: 'boolean' }
          }
        },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              severity: { type: 'string' },
              issue: { type: 'string' },
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
  labels: ['agent', 'container-security', 'registry', 'validation']
}));

// Task 8: Policy Enforcement
export const policyEnforcementTask = defineTask('policy-enforcement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Enforce security policies',
  agent: {
    name: 'policy-enforcer',
    prompt: {
      role: 'security policy engineer',
      task: 'Enforce container security policies and generate policy violations',
      context: args,
      instructions: [
        'Define security policy rules based on severity threshold',
        'Check for critical vulnerability violations',
        'Enforce configuration security policies',
        'Validate compliance with organizational standards',
        'Check for secret and malware policy violations',
        'Generate list of policy violations',
        'Categorize violations by severity',
        'Determine pass/fail status based on failOnCritical setting',
        'Generate OPA (Open Policy Agent) policies for enforcement',
        'Save policy reports to output directory'
      ],
      outputFormat: 'JSON with passed, violations, criticalIssues, policies, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'violations', 'criticalIssues', 'artifacts'],
      properties: {
        passed: { type: 'boolean' },
        violations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              image: { type: 'string' },
              policyName: { type: 'string' },
              severity: { type: 'string' },
              violation: { type: 'string' },
              remediation: { type: 'string' }
            }
          }
        },
        criticalIssues: { type: 'array', items: { type: 'string' } },
        generatedPolicies: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'container-security', 'policy-enforcement', 'opa']
}));

// Task 9: Compliance Validation
export const complianceValidationTask = defineTask('compliance-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate compliance standards',
  agent: {
    name: 'compliance-validator',
    prompt: {
      role: 'compliance security analyst',
      task: 'Validate container security against compliance standards',
      context: args,
      instructions: [
        'Validate against CIS Docker Benchmark',
        'Check NIST 800-190 container security requirements',
        'Validate PCI-DSS requirements (if applicable)',
        'Check SOC 2 security controls',
        'Validate HIPAA requirements (if applicable)',
        'Generate compliance matrix',
        'Identify compliance gaps',
        'Provide remediation guidance for non-compliant items',
        'Generate compliance report per standard',
        'Save compliance reports to output directory'
      ],
      outputFormat: 'JSON with overallCompliance, standardResults, gaps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallCompliance', 'standardResults', 'gaps', 'artifacts'],
      properties: {
        overallCompliance: {
          type: 'object',
          properties: {
            compliant: { type: 'boolean' },
            compliancePercentage: { type: 'number' },
            totalChecks: { type: 'number' },
            passedChecks: { type: 'number' },
            failedChecks: { type: 'number' }
          }
        },
        standardResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              standard: { type: 'string' },
              compliant: { type: 'boolean' },
              score: { type: 'number' },
              passedControls: { type: 'number' },
              failedControls: { type: 'number' }
            }
          }
        },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              standard: { type: 'string' },
              control: { type: 'string' },
              requirement: { type: 'string' },
              currentStatus: { type: 'string' },
              remediation: { type: 'string' }
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
  labels: ['agent', 'container-security', 'compliance', 'validation']
}));

// Task 10: Image Signing
export const imageSigningTask = defineTask('image-signing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Sign container images',
  agent: {
    name: 'image-signer',
    prompt: {
      role: 'container security engineer',
      task: 'Sign container images using Cosign or Notary',
      context: args,
      instructions: [
        'Generate signing keys if not already available',
        'Sign each validated container image',
        'Upload signatures to registry',
        'Generate signature verification policies',
        'Document signing process and key management',
        'Create signature validation instructions',
        'Generate signing audit log',
        'Save signing results and policies to output directory'
      ],
      outputFormat: 'JSON with results, signedImages, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'signedImages', 'artifacts'],
      properties: {
        results: {
          type: 'object',
          properties: {
            totalSigned: { type: 'number' },
            successfulSigns: { type: 'number' },
            failedSigns: { type: 'number' }
          }
        },
        signedImages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              image: { type: 'string' },
              signed: { type: 'boolean' },
              signatureLocation: { type: 'string' },
              signingMethod: { type: 'string' }
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
  labels: ['agent', 'container-security', 'image-signing', 'cosign']
}));

// Task 11: Runtime Protection Setup
export const runtimeProtectionSetupTask = defineTask('runtime-protection-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up runtime protection',
  agent: {
    name: 'runtime-protector',
    prompt: {
      role: 'runtime security specialist',
      task: 'Set up runtime protection policies using Falco or similar tools',
      context: args,
      instructions: [
        'Generate Falco runtime security rules',
        'Define policies for system call monitoring',
        'Create policies for file access monitoring',
        'Define network activity policies',
        'Set up privilege escalation detection',
        'Configure alerts for suspicious behavior',
        'Generate runtime policy enforcement rules',
        'Create deployment manifests for runtime protection',
        'Document runtime protection setup',
        'Save policies and configuration to output directory'
      ],
      outputFormat: 'JSON with policies, rules, configuration, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['policies', 'rules', 'artifacts'],
      properties: {
        policies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              image: { type: 'string' },
              policyName: { type: 'string' },
              description: { type: 'string' },
              rules: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        rules: { type: 'array', items: { type: 'string' } },
        configuration: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'container-security', 'runtime-protection', 'falco']
}));

// Task 12: Security Scoring
export const securityScoringTask = defineTask('security-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate security score',
  agent: {
    name: 'security-scorer',
    prompt: {
      role: 'security metrics analyst',
      task: 'Calculate comprehensive security score for container images',
      context: args,
      instructions: [
        'Evaluate vulnerability severity distribution',
        'Assess configuration security posture',
        'Factor in secrets and malware findings',
        'Consider base image security',
        'Evaluate layer security',
        'Assess compliance status',
        'Calculate weighted security score 0-100',
        'Provide score breakdown by category',
        'Generate security scorecard',
        'Save scoring report to output directory'
      ],
      outputFormat: 'JSON with score, breakdown, scorecard, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'breakdown', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        breakdown: {
          type: 'object',
          properties: {
            vulnerabilityScore: { type: 'number' },
            configurationScore: { type: 'number' },
            secretsScore: { type: 'number' },
            malwareScore: { type: 'number' },
            layerScore: { type: 'number' },
            complianceScore: { type: 'number' }
          }
        },
        scorecard: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'container-security', 'scoring', 'metrics']
}));

// Task 13: Remediation Plan Generation
export const remediationPlanGenerationTask = defineTask('remediation-plan-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate remediation plan',
  agent: {
    name: 'remediation-planner',
    prompt: {
      role: 'security remediation specialist',
      task: 'Generate prioritized remediation plan for security findings',
      context: args,
      instructions: [
        'Prioritize vulnerabilities by severity and exploitability',
        'Group related vulnerabilities for efficient remediation',
        'Identify quick wins (easy fixes with high impact)',
        'Generate upgrade recommendations for vulnerable packages',
        'Provide alternative base image suggestions',
        'Create Dockerfile improvement recommendations',
        'Generate security hardening checklist',
        'Estimate remediation effort for each item',
        'Create actionable remediation steps',
        'Save remediation plan to output directory'
      ],
      outputFormat: 'JSON with plan, prioritizedActions, quickWins, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'prioritizedActions', 'artifacts'],
      properties: {
        plan: {
          type: 'object',
          properties: {
            totalActions: { type: 'number' },
            criticalActions: { type: 'number' },
            highPriorityActions: { type: 'number' },
            estimatedEffort: { type: 'string' }
          }
        },
        prioritizedActions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              category: { type: 'string' },
              issue: { type: 'string' },
              remediation: { type: 'string' },
              estimatedEffort: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        quickWins: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'container-security', 'remediation', 'planning']
}));

// Task 14: Security Report Generation
export const securityReportGenerationTask = defineTask('security-report-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive security report',
  agent: {
    name: 'security-reporter',
    prompt: {
      role: 'security documentation specialist',
      task: 'Generate comprehensive, executive-ready container security report',
      context: args,
      instructions: [
        'Create executive summary with key findings',
        'Summarize security score and overall posture',
        'Detail vulnerability findings by severity',
        'Document configuration security issues',
        'Report secrets and malware findings',
        'Present layer and base image analysis',
        'Show compliance status per standard',
        'Include remediation plan summary',
        'Add visual charts and graphs for key metrics',
        'Provide detailed appendices with raw data',
        'Format as professional Markdown report with sections',
        'Generate PDF version if possible',
        'Save report to output directory'
      ],
      outputFormat: 'JSON with reportPath, executiveSummary, keyFindings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'keyFindings', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        criticalRecommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'container-security', 'reporting', 'documentation']
}));
