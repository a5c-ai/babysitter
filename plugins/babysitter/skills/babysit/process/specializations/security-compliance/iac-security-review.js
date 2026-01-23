/**
 * @process specializations/security-compliance/iac-security-review
 * @description Infrastructure as Code Security Review - Comprehensive security analysis of IaC configurations including
 * Terraform/CloudFormation scanning, policy as code validation (OPA, Sentinel), misconfiguration detection,
 * compliance checks, secrets detection, and automated remediation recommendations for secure infrastructure deployment.
 * @inputs { projectName: string, iacTool?: string, iacPath?: string, cloudProvider?: string, complianceStandards?: array, policyFramework?: string }
 * @outputs { success: boolean, securityScore: number, findings: array, complianceStatus: object, policyViolations: array, remediationPlan: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/security-compliance/iac-security-review', {
 *   projectName: 'Production Infrastructure',
 *   iacTool: 'terraform',
 *   iacPath: './infrastructure',
 *   cloudProvider: 'aws',
 *   complianceStandards: ['CIS', 'PCI-DSS', 'SOC2', 'HIPAA'],
 *   policyFramework: 'opa',
 *   scanDepth: 'comprehensive',
 *   autoRemediation: true,
 *   outputDir: 'security-review-output'
 * });
 *
 * @references
 * - OWASP IaC Security: https://owasp.org/www-project-infrastructure-as-code-security/
 * - CIS Benchmarks: https://www.cisecurity.org/cis-benchmarks/
 * - NIST Cybersecurity Framework: https://www.nist.gov/cyberframework
 * - Terraform Security Best Practices: https://www.terraform.io/docs/cloud/guides/recommended-practices/
 * - AWS Security Best Practices: https://docs.aws.amazon.com/securityhub/latest/userguide/what-is-securityhub.html
 * - Open Policy Agent: https://www.openpolicyagent.org/
 * - Checkov: https://www.checkov.io/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    iacTool = 'terraform', // 'terraform', 'cloudformation', 'pulumi', 'ansible', 'cdk', 'bicep'
    iacPath = './infrastructure',
    cloudProvider = 'aws', // 'aws', 'azure', 'gcp', 'multi-cloud'
    complianceStandards = ['CIS', 'OWASP'], // Array of standards: 'CIS', 'PCI-DSS', 'SOC2', 'HIPAA', 'GDPR', 'ISO27001'
    policyFramework = 'opa', // 'opa', 'sentinel', 'custom'
    scanDepth = 'comprehensive', // 'quick', 'standard', 'comprehensive', 'deep'
    autoRemediation = false,
    severityThreshold = 'medium', // 'critical', 'high', 'medium', 'low'
    outputDir = 'iac-security-review-output',
    customPolicies = [],
    excludePaths = [],
    suppressions = {}
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let findings = [];
  let policyViolations = [];
  let securityScore = 0;
  let complianceStatus = {};

  ctx.log('info', `Starting Infrastructure as Code Security Review for ${projectName}`);
  ctx.log('info', `IaC Tool: ${iacTool}, Cloud Provider: ${cloudProvider}, Scan Depth: ${scanDepth}`);
  ctx.log('info', `Compliance Standards: ${complianceStandards.join(', ')}`);
  ctx.log('info', `Policy Framework: ${policyFramework}`);

  // ============================================================================
  // PHASE 1: INFRASTRUCTURE CODE DISCOVERY AND INVENTORY
  // ============================================================================

  ctx.log('info', 'Phase 1: Discovering and inventorying infrastructure code');

  const codeInventory = await ctx.task(codeInventoryTask, {
    projectName,
    iacTool,
    iacPath,
    cloudProvider,
    excludePaths,
    outputDir
  });

  if (!codeInventory.success) {
    return {
      success: false,
      error: 'Failed to complete IaC code inventory',
      details: codeInventory,
      metadata: {
        processId: 'specializations/security-compliance/iac-security-review',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...codeInventory.artifacts);

  ctx.log('info', `Discovered ${codeInventory.totalFiles} IaC files across ${codeInventory.resourceCount} resources`);

  // ============================================================================
  // PHASE 2: SECURITY MISCONFIGURATION SCANNING
  // ============================================================================

  ctx.log('info', 'Phase 2: Scanning for security misconfigurations');

  // Run multiple security scanners in parallel
  const [misconfigScan, networkSecScan, iamSecScan] = await ctx.parallel.all([
    ctx.task(misconfigurationScanTask, {
      projectName,
      iacTool,
      iacPath,
      cloudProvider,
      codeInventory,
      scanDepth,
      outputDir
    }),
    ctx.task(networkSecurityScanTask, {
      projectName,
      iacPath,
      cloudProvider,
      codeInventory,
      outputDir
    }),
    ctx.task(iamSecurityScanTask, {
      projectName,
      iacPath,
      cloudProvider,
      codeInventory,
      outputDir
    })
  ]);

  if (!misconfigScan.success || !networkSecScan.success || !iamSecScan.success) {
    return {
      success: false,
      error: 'Failed to complete security misconfiguration scanning',
      details: { misconfigScan, networkSecScan, iamSecScan },
      metadata: {
        processId: 'specializations/security-compliance/iac-security-review',
        timestamp: startTime
      }
    };
  }

  findings.push(...misconfigScan.findings, ...networkSecScan.findings, ...iamSecScan.findings);
  artifacts.push(...misconfigScan.artifacts, ...networkSecScan.artifacts, ...iamSecScan.artifacts);

  // Quality Gate: Critical security misconfigurations
  const criticalMisconfigs = findings.filter(f => f.severity === 'critical');

  if (criticalMisconfigs.length > 0) {
    ctx.log('error', `Found ${criticalMisconfigs.length} CRITICAL security misconfigurations`);

    await ctx.breakpoint({
      question: `Phase 2 Quality Gate: Found ${criticalMisconfigs.length} CRITICAL security misconfigurations. These MUST be fixed immediately. Review findings?`,
      title: 'Critical Misconfigurations Gate',
      context: {
        runId: ctx.runId,
        criticalCount: criticalMisconfigs.length,
        misconfigurations: criticalMisconfigs.slice(0, 10), // Show first 10
        files: [{
          path: `${outputDir}/phase2-critical-misconfigurations.json`,
          format: 'json',
          content: JSON.stringify(criticalMisconfigs, null, 2)
        }]
      }
    });
  }

  // ============================================================================
  // PHASE 3: SECRETS AND SENSITIVE DATA DETECTION
  // ============================================================================

  ctx.log('info', 'Phase 3: Detecting secrets and sensitive data in IaC');

  const [secretsScan, sensitiveDataScan] = await ctx.parallel.all([
    ctx.task(secretsDetectionTask, {
      projectName,
      iacPath,
      iacTool,
      outputDir
    }),
    ctx.task(sensitiveDataScanTask, {
      projectName,
      iacPath,
      cloudProvider,
      outputDir
    })
  ]);

  if (!secretsScan.success || !sensitiveDataScan.success) {
    return {
      success: false,
      error: 'Failed to complete secrets and sensitive data detection',
      details: { secretsScan, sensitiveDataScan },
      metadata: {
        processId: 'specializations/security-compliance/iac-security-review',
        timestamp: startTime
      }
    };
  }

  findings.push(...secretsScan.findings, ...sensitiveDataScan.findings);
  artifacts.push(...secretsScan.artifacts, ...sensitiveDataScan.artifacts);

  // Quality Gate: Exposed secrets
  const exposedSecrets = findings.filter(f => f.type === 'exposed-secret');

  if (exposedSecrets.length > 0) {
    ctx.log('error', `Found ${exposedSecrets.length} EXPOSED SECRETS in IaC code`);

    await ctx.breakpoint({
      question: `Phase 3 Quality Gate: Found ${exposedSecrets.length} EXPOSED SECRETS. These are critical security risks. Immediate action required!`,
      title: 'Exposed Secrets Gate',
      context: {
        runId: ctx.runId,
        exposedSecretsCount: exposedSecrets.length,
        secretTypes: [...new Set(exposedSecrets.map(s => s.secretType))],
        files: [{
          path: `${outputDir}/phase3-exposed-secrets.json`,
          format: 'json',
          content: JSON.stringify(exposedSecrets.map(s => ({
            ...s,
            value: '[REDACTED]' // Redact actual secret values
          })), null, 2)
        }]
      }
    });
  }

  // ============================================================================
  // PHASE 4: POLICY AS CODE VALIDATION
  // ============================================================================

  ctx.log('info', `Phase 4: Validating policies using ${policyFramework.toUpperCase()}`);

  const policyValidation = await ctx.task(policyValidationTask, {
    projectName,
    iacTool,
    iacPath,
    cloudProvider,
    policyFramework,
    customPolicies,
    codeInventory,
    complianceStandards,
    outputDir
  });

  if (!policyValidation.success) {
    return {
      success: false,
      error: 'Failed to complete policy validation',
      details: policyValidation,
      metadata: {
        processId: 'specializations/security-compliance/iac-security-review',
        timestamp: startTime
      }
    };
  }

  policyViolations.push(...policyValidation.violations);
  artifacts.push(...policyValidation.artifacts);

  // Quality Gate: Policy violations
  const criticalPolicyViolations = policyViolations.filter(v => v.severity === 'critical' || v.severity === 'high');

  if (criticalPolicyViolations.length > 0) {
    ctx.log('warn', `Found ${criticalPolicyViolations.length} critical/high policy violations`);

    await ctx.breakpoint({
      question: `Phase 4 Quality Gate: Found ${criticalPolicyViolations.length} critical/high policy violations. Review and address?`,
      title: 'Policy Violations Gate',
      context: {
        runId: ctx.runId,
        policyViolationCount: criticalPolicyViolations.length,
        policyScore: policyValidation.policyScore,
        frameworks: policyValidation.frameworksEvaluated,
        files: [{
          path: `${outputDir}/phase4-policy-violations.json`,
          format: 'json',
          content: JSON.stringify(criticalPolicyViolations, null, 2)
        }]
      }
    });
  }

  // ============================================================================
  // PHASE 5: COMPLIANCE STANDARDS ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Assessing compliance with security standards');

  const complianceAssessment = await ctx.task(complianceAssessmentTask, {
    projectName,
    iacPath,
    cloudProvider,
    complianceStandards,
    findings,
    policyViolations,
    codeInventory,
    outputDir
  });

  if (!complianceAssessment.success) {
    return {
      success: false,
      error: 'Failed to complete compliance assessment',
      details: complianceAssessment,
      metadata: {
        processId: 'specializations/security-compliance/iac-security-review',
        timestamp: startTime
      }
    };
  }

  complianceStatus = complianceAssessment.complianceStatus;
  artifacts.push(...complianceAssessment.artifacts);

  // Quality Gate: Compliance failures
  const failedCompliance = Object.values(complianceStatus).filter(
    status => status.status === 'non-compliant' || status.criticalGaps > 0
  );

  if (failedCompliance.length > 0) {
    ctx.log('warn', `Non-compliant with ${failedCompliance.length} standards`);

    await ctx.breakpoint({
      question: `Phase 5 Quality Gate: Non-compliant with ${failedCompliance.length} standards. Review compliance gaps?`,
      title: 'Compliance Assessment Gate',
      context: {
        runId: ctx.runId,
        nonCompliantStandards: failedCompliance.map(s => s.standard),
        overallComplianceScore: complianceAssessment.overallScore,
        files: [{
          path: `${outputDir}/phase5-compliance-report.json`,
          format: 'json',
          content: JSON.stringify(complianceStatus, null, 2)
        }]
      }
    });
  }

  // ============================================================================
  // PHASE 6: ENCRYPTION AND DATA PROTECTION REVIEW
  // ============================================================================

  ctx.log('info', 'Phase 6: Reviewing encryption and data protection configurations');

  const [encryptionReview, dataProtectionReview] = await ctx.parallel.all([
    ctx.task(encryptionReviewTask, {
      projectName,
      iacPath,
      cloudProvider,
      codeInventory,
      outputDir
    }),
    ctx.task(dataProtectionReviewTask, {
      projectName,
      iacPath,
      cloudProvider,
      codeInventory,
      complianceStandards,
      outputDir
    })
  ]);

  if (!encryptionReview.success || !dataProtectionReview.success) {
    return {
      success: false,
      error: 'Failed to complete encryption and data protection review',
      details: { encryptionReview, dataProtectionReview },
      metadata: {
        processId: 'specializations/security-compliance/iac-security-review',
        timestamp: startTime
      }
    };
  }

  findings.push(...encryptionReview.findings, ...dataProtectionReview.findings);
  artifacts.push(...encryptionReview.artifacts, ...dataProtectionReview.artifacts);

  // Quality Gate: Unencrypted sensitive resources
  const unencryptedResources = findings.filter(
    f => f.category === 'encryption' && (f.severity === 'critical' || f.severity === 'high')
  );

  if (unencryptedResources.length > 0) {
    ctx.log('warn', `Found ${unencryptedResources.length} unencrypted sensitive resources`);

    await ctx.breakpoint({
      question: `Phase 6 Quality Gate: Found ${unencryptedResources.length} unencrypted sensitive resources. These may violate compliance requirements. Review?`,
      title: 'Encryption Review Gate',
      context: {
        runId: ctx.runId,
        unencryptedCount: unencryptedResources.length,
        encryptionScore: encryptionReview.encryptionScore,
        dataProtectionScore: dataProtectionReview.dataProtectionScore,
        files: [{
          path: `${outputDir}/phase6-encryption-gaps.json`,
          format: 'json',
          content: JSON.stringify(unencryptedResources, null, 2)
        }]
      }
    });
  }

  // ============================================================================
  // PHASE 7: CONTAINER AND RUNTIME SECURITY VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Validating container and runtime security configurations');

  const runtimeSecurityReview = await ctx.task(runtimeSecurityReviewTask, {
    projectName,
    iacPath,
    cloudProvider,
    codeInventory,
    outputDir
  });

  if (!runtimeSecurityReview.success) {
    return {
      success: false,
      error: 'Failed to complete runtime security review',
      details: runtimeSecurityReview,
      metadata: {
        processId: 'specializations/security-compliance/iac-security-review',
        timestamp: startTime
      }
    };
  }

  findings.push(...runtimeSecurityReview.findings);
  artifacts.push(...runtimeSecurityReview.artifacts);

  // ============================================================================
  // PHASE 8: AUTOMATED REMEDIATION RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating automated remediation recommendations');

  const remediationPlan = await ctx.task(remediationPlanTask, {
    projectName,
    iacTool,
    iacPath,
    findings,
    policyViolations,
    complianceStatus,
    autoRemediation,
    severityThreshold,
    outputDir
  });

  if (!remediationPlan.success) {
    return {
      success: false,
      error: 'Failed to generate remediation plan',
      details: remediationPlan,
      metadata: {
        processId: 'specializations/security-compliance/iac-security-review',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...remediationPlan.artifacts);

  // If auto-remediation is enabled, apply fixes
  if (autoRemediation && remediationPlan.autoFixableCount > 0) {
    ctx.log('info', `Auto-remediation enabled. Applying ${remediationPlan.autoFixableCount} automated fixes`);

    await ctx.breakpoint({
      question: `Auto-remediation is enabled. Apply ${remediationPlan.autoFixableCount} automated fixes? This will modify IaC files.`,
      title: 'Auto-Remediation Confirmation',
      context: {
        runId: ctx.runId,
        autoFixableCount: remediationPlan.autoFixableCount,
        fixesByCategory: remediationPlan.fixesByCategory,
        files: [{
          path: `${outputDir}/phase8-auto-remediation-preview.json`,
          format: 'json',
          content: JSON.stringify(remediationPlan.autoFixableIssues, null, 2)
        }]
      }
    });

    const autoRemediation = await ctx.task(autoRemediationTask, {
      projectName,
      iacPath,
      remediationPlan: remediationPlan.autoFixableIssues,
      outputDir
    });

    artifacts.push(...autoRemediation.artifacts);

    ctx.log('info', `Applied ${autoRemediation.fixesApplied} automated fixes`);
  }

  // ============================================================================
  // PHASE 9: COMPREHENSIVE SECURITY REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating comprehensive security report');

  const securityReport = await ctx.task(securityReportGenerationTask, {
    projectName,
    iacTool,
    cloudProvider,
    complianceStandards,
    policyFramework,
    codeInventory,
    findings,
    policyViolations,
    complianceStatus,
    remediationPlan,
    scanDepth,
    outputDir
  });

  if (!securityReport.success) {
    return {
      success: false,
      error: 'Failed to generate security report',
      details: securityReport,
      metadata: {
        processId: 'specializations/security-compliance/iac-security-review',
        timestamp: startTime
      }
    };
  }

  securityScore = securityReport.overallSecurityScore;
  artifacts.push(...securityReport.artifacts);

  // Calculate summary statistics
  const summaryStats = {
    totalFindings: findings.length,
    criticalFindings: findings.filter(f => f.severity === 'critical').length,
    highFindings: findings.filter(f => f.severity === 'high').length,
    mediumFindings: findings.filter(f => f.severity === 'medium').length,
    lowFindings: findings.filter(f => f.severity === 'low').length,
    exposedSecrets: exposedSecrets.length,
    policyViolations: policyViolations.length,
    complianceScore: complianceAssessment.overallScore,
    securityScore
  };

  // Final Quality Gate: Overall security assessment
  const securityThreshold = scanDepth === 'comprehensive' ? 85 :
                           scanDepth === 'standard' ? 75 : 65;

  if (securityScore < securityThreshold || summaryStats.criticalFindings > 0) {
    ctx.log('warn', `Security score (${securityScore}) below threshold (${securityThreshold}) or critical findings present`);

    await ctx.breakpoint({
      question: `Final Security Gate: Security score is ${securityScore}/100 (threshold: ${securityThreshold}), with ${summaryStats.criticalFindings} critical findings. Review complete report?`,
      title: 'Final Security Assessment Gate',
      context: {
        runId: ctx.runId,
        securityScore,
        securityThreshold,
        summaryStats,
        topIssues: securityReport.topSecurityIssues,
        files: [{
          path: `${outputDir}/final-security-report.json`,
          format: 'json',
          content: JSON.stringify(securityReport, null, 2)
        }, {
          path: `${outputDir}/executive-summary.md`,
          format: 'markdown',
          content: securityReport.executiveSummary
        }]
      }
    });
  }

  const endTime = ctx.now();
  const duration = endTime - startTime;

  ctx.log('info', `Infrastructure as Code Security Review completed in ${duration}ms`);
  ctx.log('info', `Overall Security Score: ${securityScore}/100`);
  ctx.log('info', `Total Findings: ${summaryStats.totalFindings} (${summaryStats.criticalFindings} critical, ${summaryStats.highFindings} high)`);
  ctx.log('info', `Exposed Secrets: ${summaryStats.exposedSecrets}`);
  ctx.log('info', `Policy Violations: ${summaryStats.policyViolations}`);
  ctx.log('info', `Compliance Score: ${summaryStats.complianceScore}/100`);

  return {
    success: true,
    projectName,
    iacTool,
    cloudProvider,
    scanDepth,
    securityScore,
    complianceScore: summaryStats.complianceScore,
    findings,
    policyViolations,
    complianceStatus,
    remediationPlan: remediationPlan.plan,
    artifacts,
    summary: summaryStats,
    recommendations: securityReport.topRecommendations,
    metadata: {
      processId: 'specializations/security-compliance/iac-security-review',
      processSlug: 'iac-security-review',
      category: 'security-compliance',
      specializationSlug: 'security-compliance',
      timestamp: startTime,
      duration,
      version: '1.0.0',
      complianceStandards,
      policyFramework
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const codeInventoryTask = defineTask('code-inventory', (args, taskCtx) => ({
  kind: 'agent',
  title: `IaC Code Inventory: ${args.projectName}`,
  agent: {
    name: 'iac-inventory-agent',
    prompt: {
      role: 'Infrastructure Security Analyst specialized in IaC analysis',
      task: 'Discover and inventory all Infrastructure as Code files, resources, and dependencies',
      context: args,
      instructions: [
        'Scan the specified path for IaC files based on the tool type',
        'Identify all resource types and their configurations',
        'Map resource dependencies and relationships',
        'Identify sensitive resource types (databases, secrets managers, IAM, etc.)',
        'Catalog external module/provider dependencies',
        'Identify workspaces, environments, or deployment contexts',
        'Generate resource inventory with metadata',
        'Identify high-risk resources requiring special attention',
        'Document file structure and organization',
        'Create dependency graph for security analysis'
      ],
      outputFormat: 'JSON with file list, resource inventory, dependencies, sensitive resources'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'totalFiles', 'resourceCount', 'resources', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        totalFiles: { type: 'number' },
        resourceCount: { type: 'number' },
        resources: {
          type: 'array',
          items: {
            type: 'object',
            required: ['type', 'name', 'file', 'sensitive'],
            properties: {
              type: { type: 'string' },
              name: { type: 'string' },
              file: { type: 'string' },
              sensitive: { type: 'boolean' },
              dependencies: { type: 'array', items: { type: 'string' } },
              riskLevel: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        sensitiveResources: { type: 'array' },
        externalDependencies: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['iac-security', 'inventory', args.iacTool, args.cloudProvider]
}));

export const misconfigurationScanTask = defineTask('misconfiguration-scan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Security Misconfiguration Scan: ${args.projectName}`,
  agent: {
    name: 'iac-misconfig-scanner',
    prompt: {
      role: 'Cloud Security Engineer specialized in IaC security scanning',
      task: 'Scan Infrastructure as Code for security misconfigurations and vulnerabilities',
      context: args,
      instructions: [
        'Scan for publicly exposed resources (S3 buckets, databases, storage accounts)',
        'Check for missing encryption configurations',
        'Identify insecure network configurations (wide-open security groups, public IPs)',
        'Detect weak authentication/authorization settings',
        'Check for missing logging and monitoring configurations',
        'Identify resources without backup/DR configurations',
        'Scan for insecure SSL/TLS configurations',
        'Check for deprecated or vulnerable resource versions',
        'Identify missing security features (MFA, versioning, etc.)',
        'Validate resource tagging for security and compliance',
        'Check for hardcoded IPs or configuration values',
        'Identify resources in non-compliant regions'
      ],
      outputFormat: 'JSON with findings array (severity, category, resource, issue, remediation)'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'findings', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        scanScore: { type: 'number', minimum: 0, maximum: 100 },
        findings: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'severity', 'category', 'resource', 'issue', 'remediation'],
            properties: {
              id: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'info'] },
              category: { type: 'string' },
              resource: { type: 'string' },
              file: { type: 'string' },
              line: { type: 'number' },
              issue: { type: 'string' },
              description: { type: 'string' },
              remediation: { type: 'string' },
              references: { type: 'array', items: { type: 'string' } },
              cwe: { type: 'string' },
              autoFixable: { type: 'boolean' }
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
  labels: ['iac-security', 'misconfiguration', 'scanning']
}));

export const networkSecurityScanTask = defineTask('network-security-scan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Network Security Scan: ${args.projectName}`,
  agent: {
    name: 'network-security-scanner',
    prompt: {
      role: 'Network Security Engineer specialized in cloud network security',
      task: 'Analyze network security configurations in Infrastructure as Code',
      context: args,
      instructions: [
        'Scan security groups, NACLs, and firewall rules',
        'Identify overly permissive ingress rules (0.0.0.0/0, ::/0)',
        'Check for unrestricted egress rules',
        'Validate network segmentation and isolation',
        'Check for missing VPC flow logs',
        'Identify unencrypted data flows',
        'Validate load balancer security configurations',
        'Check for exposed management ports (SSH, RDP, databases)',
        'Identify missing DDoS protection',
        'Validate VPN and peering configurations',
        'Check for insecure network protocols',
        'Verify proper use of private subnets'
      ],
      outputFormat: 'JSON with network security findings'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'findings', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        networkSecurityScore: { type: 'number', minimum: 0, maximum: 100 },
        findings: {
          type: 'array',
          items: {
            type: 'object',
            required: ['severity', 'category', 'resource', 'issue', 'remediation'],
            properties: {
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'info'] },
              category: { type: 'string', enum: ['network-exposure', 'firewall-rules', 'segmentation', 'encryption', 'monitoring'] },
              resource: { type: 'string' },
              file: { type: 'string' },
              issue: { type: 'string' },
              remediation: { type: 'string' },
              riskLevel: { type: 'string' },
              autoFixable: { type: 'boolean' }
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
  labels: ['iac-security', 'network-security', 'firewall']
}));

export const iamSecurityScanTask = defineTask('iam-security-scan', (args, taskCtx) => ({
  kind: 'agent',
  title: `IAM Security Scan: ${args.projectName}`,
  agent: {
    name: 'iam-security-scanner',
    prompt: {
      role: 'Identity and Access Management Security Specialist',
      task: 'Analyze IAM and access control configurations for security issues',
      context: args,
      instructions: [
        'Scan IAM policies for overly permissive permissions',
        'Identify wildcard (*) permissions and admin access',
        'Check for missing MFA requirements',
        'Validate least privilege principle adherence',
        'Identify unused or stale IAM users/roles',
        'Check for hardcoded credentials in IAM policies',
        'Validate service account permissions',
        'Check for missing password policies',
        'Identify cross-account access risks',
        'Validate assume role trust relationships',
        'Check for public access to sensitive resources',
        'Identify missing access logging'
      ],
      outputFormat: 'JSON with IAM security findings'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'findings', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        iamSecurityScore: { type: 'number', minimum: 0, maximum: 100 },
        findings: {
          type: 'array',
          items: {
            type: 'object',
            required: ['severity', 'category', 'resource', 'issue', 'remediation'],
            properties: {
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'info'] },
              category: { type: 'string', enum: ['excessive-permissions', 'missing-mfa', 'weak-policies', 'credential-exposure', 'access-control'] },
              resource: { type: 'string' },
              file: { type: 'string' },
              issue: { type: 'string' },
              remediation: { type: 'string' },
              principle: { type: 'string' },
              autoFixable: { type: 'boolean' }
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
  labels: ['iac-security', 'iam', 'access-control']
}));

export const secretsDetectionTask = defineTask('secrets-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Secrets Detection: ${args.projectName}`,
  agent: {
    name: 'secrets-detector',
    prompt: {
      role: 'Security Engineer specialized in secrets detection and prevention',
      task: 'Scan Infrastructure as Code files for exposed secrets, credentials, and sensitive data',
      context: args,
      instructions: [
        'Scan for hardcoded passwords, API keys, and tokens',
        'Detect AWS access keys, Azure credentials, GCP service account keys',
        'Identify database connection strings with embedded credentials',
        'Detect SSH private keys or certificates',
        'Check for OAuth tokens and secrets',
        'Identify cloud provider credentials',
        'Detect encryption keys and secrets',
        'Check for hardcoded URLs with credentials',
        'Identify certificate files and private keys',
        'Scan for Slack tokens, GitHub tokens, etc.',
        'Verify proper use of secrets management services',
        'Check variable files and environment configurations'
      ],
      outputFormat: 'JSON with exposed secrets findings (type, location, secretType, recommendation)'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'findings', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        exposedSecretsCount: { type: 'number' },
        findings: {
          type: 'array',
          items: {
            type: 'object',
            required: ['severity', 'type', 'file', 'secretType', 'remediation'],
            properties: {
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              type: { type: 'string', const: 'exposed-secret' },
              file: { type: 'string' },
              line: { type: 'number' },
              secretType: { type: 'string' },
              description: { type: 'string' },
              remediation: { type: 'string' },
              pattern: { type: 'string' },
              entropy: { type: 'number' }
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
  labels: ['iac-security', 'secrets-detection', 'credentials']
}));

export const sensitiveDataScanTask = defineTask('sensitive-data-scan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Sensitive Data Scan: ${args.projectName}`,
  agent: {
    name: 'sensitive-data-scanner',
    prompt: {
      role: 'Data Security Specialist',
      task: 'Identify resources handling sensitive data without proper protection',
      context: args,
      instructions: [
        'Identify databases, storage, and data resources',
        'Check for PII, PHI, PCI data handling without encryption',
        'Verify proper data classification and tagging',
        'Check for missing data retention policies',
        'Identify resources without data backup configurations',
        'Validate data residency and sovereignty requirements',
        'Check for missing data masking or anonymization',
        'Identify log configurations that might expose sensitive data',
        'Verify proper data disposal configurations',
        'Check for missing data loss prevention (DLP) controls'
      ],
      outputFormat: 'JSON with sensitive data protection findings'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'findings', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        sensitiveResourceCount: { type: 'number' },
        findings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              category: { type: 'string' },
              resource: { type: 'string' },
              dataType: { type: 'string' },
              issue: { type: 'string' },
              remediation: { type: 'string' },
              complianceImpact: { type: 'array', items: { type: 'string' } }
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
  labels: ['iac-security', 'sensitive-data', 'data-protection']
}));

export const policyValidationTask = defineTask('policy-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Policy Validation (${args.policyFramework.toUpperCase()}): ${args.projectName}`,
  agent: {
    name: 'policy-validator',
    prompt: {
      role: 'Policy as Code Engineer specialized in security policy validation',
      task: 'Validate Infrastructure as Code against security policies using policy as code framework',
      context: args,
      instructions: [
        `Validate IaC configurations against ${args.policyFramework.toUpperCase()} policies`,
        'Apply built-in security policies for the cloud provider',
        'Execute custom policies if provided',
        'Check for policy violations and categorize by severity',
        'Validate naming conventions and tagging policies',
        'Check resource quota and limit policies',
        'Validate deployment region policies',
        'Check for required resource properties',
        'Validate dependency and ordering policies',
        'Generate detailed policy evaluation report',
        'Provide specific remediation for each violation',
        'Calculate policy compliance score'
      ],
      outputFormat: 'JSON with policy violations, compliance score, evaluated policies'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'policyScore', 'violations', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        policyScore: { type: 'number', minimum: 0, maximum: 100 },
        violations: {
          type: 'array',
          items: {
            type: 'object',
            required: ['severity', 'policyName', 'resource', 'violation', 'remediation'],
            properties: {
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'info'] },
              policyName: { type: 'string' },
              policyFramework: { type: 'string' },
              resource: { type: 'string' },
              file: { type: 'string' },
              violation: { type: 'string' },
              remediation: { type: 'string' },
              enforcementAction: { type: 'string', enum: ['deny', 'warn', 'audit'] }
            }
          }
        },
        frameworksEvaluated: { type: 'array', items: { type: 'string' } },
        policiesEvaluated: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['iac-security', 'policy-as-code', args.policyFramework]
}));

export const complianceAssessmentTask = defineTask('compliance-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Compliance Assessment: ${args.projectName}`,
  agent: {
    name: 'compliance-assessor',
    prompt: {
      role: 'Compliance Auditor specialized in cloud infrastructure compliance',
      task: 'Assess Infrastructure as Code compliance with specified security standards',
      context: args,
      instructions: [
        'Evaluate compliance against specified standards (CIS, PCI-DSS, SOC2, HIPAA, etc.)',
        'Map findings to specific compliance requirements',
        'Identify compliance gaps and violations',
        'Assess control effectiveness',
        'Calculate compliance scores per standard',
        'Generate compliance gap analysis',
        'Provide remediation priorities based on compliance impact',
        'Document evidence for compliance requirements',
        'Identify compensating controls where applicable',
        'Generate audit-ready compliance report'
      ],
      outputFormat: 'JSON with compliance status per standard, gaps, overall score'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'overallScore', 'complianceStatus', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        complianceStatus: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            required: ['standard', 'status', 'score', 'gaps'],
            properties: {
              standard: { type: 'string' },
              status: { type: 'string', enum: ['compliant', 'partially-compliant', 'non-compliant'] },
              score: { type: 'number', minimum: 0, maximum: 100 },
              requirementsMet: { type: 'number' },
              requirementsTotal: { type: 'number' },
              criticalGaps: { type: 'number' },
              gaps: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    requirement: { type: 'string' },
                    description: { type: 'string' },
                    severity: { type: 'string' },
                    remediation: { type: 'string' }
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
  labels: ['iac-security', 'compliance', 'audit']
}));

export const encryptionReviewTask = defineTask('encryption-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Encryption Review: ${args.projectName}`,
  agent: {
    name: 'encryption-reviewer',
    prompt: {
      role: 'Cryptography and Encryption Specialist',
      task: 'Review encryption configurations for data at rest and in transit',
      context: args,
      instructions: [
        'Identify all data storage resources (databases, object storage, block storage)',
        'Check encryption at rest configurations',
        'Validate encryption algorithms and key strengths',
        'Review key management configurations (KMS, Key Vault, etc.)',
        'Check for encryption in transit (TLS, SSL configurations)',
        'Validate certificate management',
        'Identify unencrypted data flows',
        'Check for proper key rotation policies',
        'Validate backup encryption configurations',
        'Review encryption for logs and monitoring data',
        'Check for deprecated encryption algorithms',
        'Verify proper use of customer-managed vs. provider-managed keys'
      ],
      outputFormat: 'JSON with encryption findings and score'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'encryptionScore', 'findings', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        encryptionScore: { type: 'number', minimum: 0, maximum: 100 },
        encryptionAtRest: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            coverage: { type: 'number' },
            algorithms: { type: 'array', items: { type: 'string' } }
          }
        },
        encryptionInTransit: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            coverage: { type: 'number' },
            protocols: { type: 'array', items: { type: 'string' } }
          }
        },
        findings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              severity: { type: 'string' },
              category: { type: 'string', const: 'encryption' },
              resource: { type: 'string' },
              issue: { type: 'string' },
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
  labels: ['iac-security', 'encryption', 'data-protection']
}));

export const dataProtectionReviewTask = defineTask('data-protection-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Data Protection Review: ${args.projectName}`,
  agent: {
    name: 'data-protection-reviewer',
    prompt: {
      role: 'Data Protection and Privacy Specialist',
      task: 'Review data protection configurations and privacy controls',
      context: args,
      instructions: [
        'Identify resources handling regulated data (PII, PHI, PCI)',
        'Check data retention and lifecycle policies',
        'Validate backup and recovery configurations',
        'Review data residency and sovereignty settings',
        'Check for proper data classification and tagging',
        'Validate access logging and audit trails',
        'Review data deletion and disposal configurations',
        'Check for proper anonymization/pseudonymization',
        'Validate privacy control implementations (GDPR, CCPA)',
        'Review data access controls and permissions',
        'Check for data exfiltration prevention controls'
      ],
      outputFormat: 'JSON with data protection findings and score'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'dataProtectionScore', 'findings', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        dataProtectionScore: { type: 'number', minimum: 0, maximum: 100 },
        findings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              severity: { type: 'string' },
              category: { type: 'string' },
              resource: { type: 'string' },
              dataType: { type: 'string' },
              issue: { type: 'string' },
              remediation: { type: 'string' },
              regulatoryImpact: { type: 'array', items: { type: 'string' } }
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
  labels: ['iac-security', 'data-protection', 'privacy']
}));

export const runtimeSecurityReviewTask = defineTask('runtime-security-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Runtime Security Review: ${args.projectName}`,
  agent: {
    name: 'runtime-security-reviewer',
    prompt: {
      role: 'Container and Runtime Security Engineer',
      task: 'Review container, orchestration, and runtime security configurations',
      context: args,
      instructions: [
        'Review container security configurations (Kubernetes, ECS, etc.)',
        'Check for privileged container configurations',
        'Validate pod security policies/standards',
        'Review service account permissions',
        'Check for missing resource limits and quotas',
        'Validate network policies and service mesh configurations',
        'Review container image configurations',
        'Check for missing security contexts',
        'Validate runtime security monitoring configurations',
        'Review secrets management for containers',
        'Check for admission control policies',
        'Validate workload identity configurations'
      ],
      outputFormat: 'JSON with runtime security findings'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'findings', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        runtimeSecurityScore: { type: 'number', minimum: 0, maximum: 100 },
        findings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              severity: { type: 'string' },
              category: { type: 'string' },
              resource: { type: 'string' },
              issue: { type: 'string' },
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
  labels: ['iac-security', 'runtime-security', 'containers']
}));

export const remediationPlanTask = defineTask('remediation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Remediation Plan: ${args.projectName}`,
  agent: {
    name: 'remediation-planner',
    prompt: {
      role: 'Security Remediation Engineer',
      task: 'Generate prioritized remediation plan with automated fix recommendations',
      context: args,
      instructions: [
        'Consolidate all findings and violations',
        'Prioritize by severity, exploitability, and compliance impact',
        'Identify auto-fixable issues with code snippets',
        'Group related findings for efficient remediation',
        'Provide specific remediation steps for each issue',
        'Estimate effort and complexity for fixes',
        'Generate IaC code patches for auto-fixable issues',
        'Create remediation roadmap with phases (immediate, short-term, long-term)',
        'Identify quick wins (high impact, low effort)',
        'Provide testing recommendations for each fix',
        'Document dependencies between fixes',
        'Generate rollback procedures'
      ],
      outputFormat: 'JSON with prioritized remediation plan, auto-fixable issues, code patches'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'plan', 'autoFixableCount', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        autoFixableCount: { type: 'number' },
        plan: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'priority', 'phase', 'action', 'effort'],
            properties: {
              id: { type: 'string' },
              findingIds: { type: 'array', items: { type: 'string' } },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              phase: { type: 'string', enum: ['immediate', 'short-term', 'long-term'] },
              action: { type: 'string' },
              description: { type: 'string' },
              effort: { type: 'string', enum: ['low', 'medium', 'high'] },
              impact: { type: 'string' },
              autoFixable: { type: 'boolean' },
              codePatch: { type: 'string' },
              testingSteps: { type: 'array', items: { type: 'string' } },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        autoFixableIssues: { type: 'array' },
        fixesByCategory: { type: 'object' },
        quickWins: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['iac-security', 'remediation', 'planning']
}));

export const autoRemediationTask = defineTask('auto-remediation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Auto-Remediation: ${args.projectName}`,
  agent: {
    name: 'auto-remediator',
    prompt: {
      role: 'Infrastructure Security Automation Engineer',
      task: 'Apply automated security fixes to Infrastructure as Code files',
      context: args,
      instructions: [
        'Review auto-fixable issues from remediation plan',
        'Backup original IaC files before modification',
        'Apply code patches to fix security issues',
        'Validate syntax after applying fixes',
        'Generate diff report of changes',
        'Verify fixes do not break dependencies',
        'Document all changes made',
        'Create commit-ready change summary',
        'Generate verification test cases',
        'Provide rollback instructions'
      ],
      outputFormat: 'JSON with fixes applied, modified files, diff report'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'fixesApplied', 'modifiedFiles', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        fixesApplied: { type: 'number' },
        fixesFailed: { type: 'number' },
        modifiedFiles: { type: 'array', items: { type: 'string' } },
        backupPath: { type: 'string' },
        changesSummary: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['iac-security', 'auto-remediation', 'automation']
}));

export const securityReportGenerationTask = defineTask('security-report-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Security Report: ${args.projectName}`,
  agent: {
    name: 'security-report-generator',
    prompt: {
      role: 'Security Documentation and Reporting Specialist',
      task: 'Generate comprehensive Infrastructure as Code security review report',
      context: args,
      instructions: [
        'Synthesize findings from all security scan phases',
        'Calculate overall security score (0-100)',
        'Generate executive summary with key findings',
        'Create detailed findings report by category',
        'Highlight top security risks and critical issues',
        'Generate compliance status summary',
        'Create visual risk matrix and charts',
        'Document remediation priorities',
        'Provide actionable recommendations',
        'Generate metrics and security posture dashboard',
        'Create trend analysis if historical data available',
        'Format report in multiple formats (JSON, Markdown, HTML)'
      ],
      outputFormat: 'JSON with comprehensive security report, executive summary, scores, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'overallSecurityScore', 'executiveSummary', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        overallSecurityScore: { type: 'number', minimum: 0, maximum: 100 },
        executiveSummary: { type: 'string' },
        topSecurityIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              severity: { type: 'string' },
              category: { type: 'string' },
              count: { type: 'number' },
              description: { type: 'string' }
            }
          }
        },
        topRecommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              priority: { type: 'string' },
              recommendation: { type: 'string' },
              impact: { type: 'string' },
              effort: { type: 'string' }
            }
          }
        },
        securityPosture: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['excellent', 'good', 'fair', 'poor', 'critical'] },
            strengths: { type: 'array', items: { type: 'string' } },
            weaknesses: { type: 'array', items: { type: 'string' } },
            trends: { type: 'object' }
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
  labels: ['iac-security', 'reporting', 'documentation']
}));
