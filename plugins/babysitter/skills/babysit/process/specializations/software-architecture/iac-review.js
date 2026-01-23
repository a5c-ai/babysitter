/**
 * @process specializations/software-architecture/iac-review
 * @description Infrastructure as Code Review - Comprehensive IaC validation ensuring best practices,
 * security compliance, cost optimization, maintainability, and operational excellence across Terraform,
 * CloudFormation, Pulumi, Ansible, and other IaC tools.
 * @inputs { projectName: string, iacTool?: string, iacPath?: string, cloudProvider?: string, reviewScope?: string }
 * @outputs { success: boolean, reviewReport: object, securityFindings: array, costRecommendations: array, qualityScore: number, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/software-architecture/iac-review', {
 *   projectName: 'Production Infrastructure',
 *   iacTool: 'terraform',
 *   iacPath: './infrastructure',
 *   cloudProvider: 'aws',
 *   reviewScope: 'comprehensive',
 *   constraints: {
 *     budget: 10000,
 *     securityCompliance: 'SOC2',
 *     highAvailability: true
 *   }
 * });
 *
 * @references
 * - Terraform Best Practices: https://www.terraform-best-practices.com/
 * - AWS Well-Architected Framework: https://aws.amazon.com/architecture/well-architected/
 * - Azure Architecture Framework: https://learn.microsoft.com/en-us/azure/architecture/framework/
 * - Google Cloud Architecture Framework: https://cloud.google.com/architecture/framework
 * - Infrastructure as Code Patterns: https://infrastructure-as-code.com/patterns/
 * - NIST Cybersecurity Framework: https://www.nist.gov/cyberframework
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    iacTool = 'terraform', // 'terraform', 'cloudformation', 'pulumi', 'ansible', 'cdk', 'bicep'
    iacPath = './infrastructure',
    cloudProvider = 'aws', // 'aws', 'azure', 'gcp', 'multi-cloud'
    reviewScope = 'comprehensive', // 'quick', 'standard', 'comprehensive', 'security-focused', 'cost-focused'
    constraints = {
      budget: 10000,
      securityCompliance: 'SOC2',
      highAvailability: true,
      disasterRecovery: true
    },
    existingInfrastructure = {},
    complianceRequirements = [],
    outputDir = 'iac-review-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let reviewReport = {};
  let securityFindings = [];
  let costRecommendations = [];
  let qualityScore = 0;

  ctx.log('info', `Starting Infrastructure as Code Review for ${projectName}`);
  ctx.log('info', `IaC Tool: ${iacTool}, Cloud Provider: ${cloudProvider}, Review Scope: ${reviewScope}`);

  // ============================================================================
  // PHASE 1: IaC STRUCTURE AND ORGANIZATION REVIEW
  // ============================================================================

  ctx.log('info', 'Phase 1: Reviewing IaC structure and organization');

  const structureReview = await ctx.task(structureReviewTask, {
    projectName,
    iacTool,
    iacPath,
    cloudProvider,
    outputDir
  });

  if (!structureReview.success) {
    return {
      success: false,
      error: 'Failed to complete IaC structure review',
      details: structureReview,
      metadata: {
        processId: 'specializations/software-architecture/iac-review',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...structureReview.artifacts);

  // Quality Gate: Structural organization meets best practices
  const structureIssues = structureReview.findings.filter(f => f.severity === 'high' || f.severity === 'critical');

  if (structureIssues.length > 0) {
    ctx.log('warn', `Found ${structureIssues.length} high/critical structural issues`);

    await ctx.breakpoint({
      question: `Phase 1 Quality Gate: Found ${structureIssues.length} high/critical structural issues. Review and address before continuing?`,
      title: 'IaC Structure Review Gate',
      context: {
        runId: ctx.runId,
        structureScore: structureReview.score,
        criticalIssues: structureIssues.length,
        files: [{
          path: `${outputDir}/phase1-structure-review.json`,
          format: 'json',
          content: JSON.stringify(structureReview, null, 2)
        }]
      }
    });
  }

  reviewReport.structureReview = structureReview;

  // ============================================================================
  // PHASE 2: SECURITY COMPLIANCE AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Conducting security compliance validation');

  // Run security scans in parallel
  const [securityScan, complianceCheck, secretsCheck] = await ctx.parallel.all([
    ctx.task(securityScanTask, {
      projectName,
      iacTool,
      iacPath,
      cloudProvider,
      securityStandards: constraints.securityCompliance || 'CIS',
      outputDir
    }),
    ctx.task(complianceCheckTask, {
      projectName,
      iacPath,
      complianceRequirements: complianceRequirements.length > 0
        ? complianceRequirements
        : [constraints.securityCompliance || 'SOC2'],
      outputDir
    }),
    ctx.task(secretsDetectionTask, {
      projectName,
      iacPath,
      outputDir
    })
  ]);

  if (!securityScan.success || !complianceCheck.success || !secretsCheck.success) {
    return {
      success: false,
      error: 'Failed to complete security compliance validation',
      details: { securityScan, complianceCheck, secretsCheck },
      metadata: {
        processId: 'specializations/software-architecture/iac-review',
        timestamp: startTime
      }
    };
  }

  securityFindings.push(...securityScan.findings, ...complianceCheck.findings, ...secretsCheck.findings);
  artifacts.push(...securityScan.artifacts, ...complianceCheck.artifacts, ...secretsCheck.artifacts);

  // Quality Gate: No critical security vulnerabilities or exposed secrets
  const criticalSecurityIssues = securityFindings.filter(
    f => f.severity === 'critical' || f.type === 'exposed-secret'
  );

  if (criticalSecurityIssues.length > 0) {
    ctx.log('error', `Found ${criticalSecurityIssues.length} critical security issues`);

    await ctx.breakpoint({
      question: `Phase 2 Quality Gate: Found ${criticalSecurityIssues.length} CRITICAL security issues. These MUST be fixed before proceeding. Continue?`,
      title: 'Critical Security Issues Gate',
      context: {
        runId: ctx.runId,
        criticalIssues: criticalSecurityIssues.length,
        exposedSecrets: secretsCheck.exposedSecretsCount,
        complianceScore: complianceCheck.score,
        files: [{
          path: `${outputDir}/phase2-security-report.json`,
          format: 'json',
          content: JSON.stringify({ securityScan, complianceCheck, secretsCheck, criticalSecurityIssues }, null, 2)
        }]
      }
    });
  }

  reviewReport.securityReview = { securityScan, complianceCheck, secretsCheck };

  // ============================================================================
  // PHASE 3: RESOURCE CONFIGURATION VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Validating resource configurations');

  const resourceValidation = await ctx.task(resourceValidationTask, {
    projectName,
    iacTool,
    iacPath,
    cloudProvider,
    constraints,
    outputDir
  });

  if (!resourceValidation.success) {
    return {
      success: false,
      error: 'Failed to complete resource configuration validation',
      details: resourceValidation,
      metadata: {
        processId: 'specializations/software-architecture/iac-review',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...resourceValidation.artifacts);

  // Quality Gate: Resource configurations meet requirements
  const configIssues = resourceValidation.findings.filter(
    f => f.severity === 'high' && f.category === 'availability'
  );

  if (configIssues.length > 0 && constraints.highAvailability) {
    ctx.log('warn', `Found ${configIssues.length} high-severity availability configuration issues`);

    await ctx.breakpoint({
      question: `Phase 3 Quality Gate: Found ${configIssues.length} availability issues, but high availability is required. Review configurations?`,
      title: 'Resource Configuration Gate',
      context: {
        runId: ctx.runId,
        configScore: resourceValidation.score,
        availabilityIssues: configIssues.length,
        files: [{
          path: `${outputDir}/phase3-resource-validation.json`,
          format: 'json',
          content: JSON.stringify(resourceValidation, null, 2)
        }]
      }
    });
  }

  reviewReport.resourceValidation = resourceValidation;

  // ============================================================================
  // PHASE 4: COST ANALYSIS AND OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing costs and identifying optimization opportunities');

  const [costEstimation, costOptimization] = await ctx.parallel.all([
    ctx.task(costEstimationTask, {
      projectName,
      iacTool,
      iacPath,
      cloudProvider,
      budget: constraints.budget,
      outputDir
    }),
    ctx.task(costOptimizationTask, {
      projectName,
      iacPath,
      cloudProvider,
      currentCost: existingInfrastructure.monthlyCost || 0,
      outputDir
    })
  ]);

  if (!costEstimation.success || !costOptimization.success) {
    return {
      success: false,
      error: 'Failed to complete cost analysis',
      details: { costEstimation, costOptimization },
      metadata: {
        processId: 'specializations/software-architecture/iac-review',
        timestamp: startTime
      }
    };
  }

  costRecommendations.push(...costOptimization.recommendations);
  artifacts.push(...costEstimation.artifacts, ...costOptimization.artifacts);

  // Quality Gate: Estimated costs within budget
  const budgetExceeded = constraints.budget &&
    costEstimation.estimatedMonthlyCost > constraints.budget;

  if (budgetExceeded) {
    const overage = costEstimation.estimatedMonthlyCost - constraints.budget;
    const overagePercent = ((overage / constraints.budget) * 100).toFixed(1);

    ctx.log('warn', `Estimated cost exceeds budget by $${overage} (${overagePercent}%)`);

    await ctx.breakpoint({
      question: `Phase 4 Quality Gate: Estimated monthly cost ($${costEstimation.estimatedMonthlyCost}) exceeds budget ($${constraints.budget}) by $${overage}. Review cost optimizations?`,
      title: 'Cost Budget Gate',
      context: {
        runId: ctx.runId,
        estimatedCost: costEstimation.estimatedMonthlyCost,
        budget: constraints.budget,
        overage: overage,
        potentialSavings: costOptimization.totalPotentialSavings,
        files: [{
          path: `${outputDir}/phase4-cost-analysis.json`,
          format: 'json',
          content: JSON.stringify({ costEstimation, costOptimization }, null, 2)
        }]
      }
    });
  }

  reviewReport.costAnalysis = { costEstimation, costOptimization };

  // ============================================================================
  // PHASE 5: STATE MANAGEMENT AND BACKEND REVIEW
  // ============================================================================

  ctx.log('info', 'Phase 5: Reviewing state management and backend configuration');

  const stateManagementReview = await ctx.task(stateManagementReviewTask, {
    projectName,
    iacTool,
    iacPath,
    cloudProvider,
    outputDir
  });

  if (!stateManagementReview.success) {
    return {
      success: false,
      error: 'Failed to complete state management review',
      details: stateManagementReview,
      metadata: {
        processId: 'specializations/software-architecture/iac-review',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...stateManagementReview.artifacts);

  // Quality Gate: State management properly configured
  const stateIssues = stateManagementReview.findings.filter(
    f => f.severity === 'high' || f.severity === 'critical'
  );

  if (stateIssues.length > 0) {
    ctx.log('warn', `Found ${stateIssues.length} high/critical state management issues`);

    await ctx.breakpoint({
      question: `Phase 5 Quality Gate: Found ${stateIssues.length} state management issues. These can lead to data loss or conflicts. Review?`,
      title: 'State Management Gate',
      context: {
        runId: ctx.runId,
        stateScore: stateManagementReview.score,
        issues: stateIssues.length,
        backendConfigured: stateManagementReview.backendConfigured,
        lockingEnabled: stateManagementReview.lockingEnabled,
        files: [{
          path: `${outputDir}/phase5-state-management.json`,
          format: 'json',
          content: JSON.stringify(stateManagementReview, null, 2)
        }]
      }
    });
  }

  reviewReport.stateManagement = stateManagementReview;

  // ============================================================================
  // PHASE 6: DOCUMENTATION AND MAINTAINABILITY REVIEW
  // ============================================================================

  ctx.log('info', 'Phase 6: Reviewing documentation and maintainability');

  const documentationReview = await ctx.task(documentationReviewTask, {
    projectName,
    iacPath,
    iacTool,
    outputDir
  });

  if (!documentationReview.success) {
    return {
      success: false,
      error: 'Failed to complete documentation review',
      details: documentationReview,
      metadata: {
        processId: 'specializations/software-architecture/iac-review',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...documentationReview.artifacts);

  reviewReport.documentation = documentationReview;

  // ============================================================================
  // PHASE 7: IaC TESTING AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Testing IaC changes and validating deployments');

  const [syntaxValidation, planValidation, testingValidation] = await ctx.parallel.all([
    ctx.task(syntaxValidationTask, {
      projectName,
      iacTool,
      iacPath,
      outputDir
    }),
    ctx.task(planValidationTask, {
      projectName,
      iacTool,
      iacPath,
      outputDir
    }),
    ctx.task(iacTestingTask, {
      projectName,
      iacTool,
      iacPath,
      outputDir
    })
  ]);

  if (!syntaxValidation.success || !planValidation.success) {
    return {
      success: false,
      error: 'Failed to complete IaC testing and validation',
      details: { syntaxValidation, planValidation, testingValidation },
      metadata: {
        processId: 'specializations/software-architecture/iac-review',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...syntaxValidation.artifacts, ...planValidation.artifacts, ...testingValidation.artifacts);

  // Quality Gate: IaC passes validation and tests
  const validationErrors = [
    ...syntaxValidation.errors || [],
    ...planValidation.errors || []
  ];

  if (validationErrors.length > 0) {
    ctx.log('error', `Found ${validationErrors.length} validation errors`);

    await ctx.breakpoint({
      question: `Phase 7 Quality Gate: Found ${validationErrors.length} validation errors. IaC cannot be applied until these are fixed. Review?`,
      title: 'Validation Errors Gate',
      context: {
        runId: ctx.runId,
        syntaxValid: syntaxValidation.valid,
        planValid: planValidation.valid,
        testsPassed: testingValidation.testsPassed,
        testsFailed: testingValidation.testsFailed,
        files: [{
          path: `${outputDir}/phase7-validation-report.json`,
          format: 'json',
          content: JSON.stringify({ syntaxValidation, planValidation, testingValidation }, null, 2)
        }]
      }
    });
  }

  reviewReport.testing = { syntaxValidation, planValidation, testingValidation };

  // ============================================================================
  // PHASE 8: COMPREHENSIVE REVIEW REPORT AND RECOMMENDATIONS
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating comprehensive review report and recommendations');

  const finalReport = await ctx.task(finalReportGenerationTask, {
    projectName,
    iacTool,
    cloudProvider,
    reviewScope,
    reviewReport,
    securityFindings,
    costRecommendations,
    constraints,
    outputDir
  });

  if (!finalReport.success) {
    return {
      success: false,
      error: 'Failed to generate final review report',
      details: finalReport,
      metadata: {
        processId: 'specializations/software-architecture/iac-review',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...finalReport.artifacts);
  qualityScore = finalReport.overallQualityScore;

  // Calculate phase scores
  const phaseScores = {
    structure: structureReview.score || 0,
    security: (securityScan.score + complianceCheck.score) / 2 || 0,
    resourceConfig: resourceValidation.score || 0,
    cost: costEstimation.score || 0,
    stateManagement: stateManagementReview.score || 0,
    documentation: documentationReview.score || 0,
    testing: ((syntaxValidation.valid ? 100 : 0) + (planValidation.valid ? 100 : 0)) / 2 || 0
  };

  // Final Quality Gate: Overall quality meets threshold
  const qualityThreshold = reviewScope === 'comprehensive' ? 80 :
                          reviewScope === 'standard' ? 70 : 60;

  if (qualityScore < qualityThreshold) {
    ctx.log('warn', `Overall quality score (${qualityScore}) below threshold (${qualityThreshold})`);

    await ctx.breakpoint({
      question: `Final Quality Gate: Overall quality score (${qualityScore}/100) is below threshold (${qualityThreshold}). Review recommendations and proceed with caution?`,
      title: 'Final Quality Gate',
      context: {
        runId: ctx.runId,
        qualityScore,
        qualityThreshold,
        phaseScores,
        criticalIssues: securityFindings.filter(f => f.severity === 'critical').length,
        highIssues: securityFindings.filter(f => f.severity === 'high').length,
        costOverage: budgetExceeded,
        files: [{
          path: `${outputDir}/final-review-report.json`,
          format: 'json',
          content: JSON.stringify(finalReport, null, 2)
        }, {
          path: `${outputDir}/executive-summary.md`,
          format: 'markdown',
          content: finalReport.executiveSummary
        }]
      }
    });
  }

  // ============================================================================
  // GENERATE IMPLEMENTATION PLAN
  // ============================================================================

  ctx.log('info', 'Generating implementation plan for addressing findings');

  const implementationPlan = await ctx.task(implementationPlanTask, {
    projectName,
    reviewReport,
    securityFindings,
    costRecommendations,
    qualityScore,
    outputDir
  });

  artifacts.push(...implementationPlan.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  ctx.log('info', `Infrastructure as Code Review completed in ${duration}ms`);
  ctx.log('info', `Overall Quality Score: ${qualityScore}/100`);
  ctx.log('info', `Security Findings: ${securityFindings.length} (${securityFindings.filter(f => f.severity === 'critical').length} critical)`);
  ctx.log('info', `Cost Recommendations: ${costRecommendations.length} (potential savings: $${costOptimization.totalPotentialSavings})`);

  return {
    success: true,
    projectName,
    iacTool,
    cloudProvider,
    reviewScope,
    qualityScore,
    phaseScores,
    reviewReport,
    securityFindings,
    costRecommendations,
    implementationPlan: implementationPlan.plan,
    artifacts,
    summary: {
      totalFindings: securityFindings.length + costRecommendations.length,
      criticalFindings: securityFindings.filter(f => f.severity === 'critical').length,
      highFindings: securityFindings.filter(f => f.severity === 'high').length,
      estimatedMonthlyCost: costEstimation.estimatedMonthlyCost,
      potentialSavings: costOptimization.totalPotentialSavings,
      budgetStatus: budgetExceeded ? 'over-budget' : 'within-budget',
      qualityGate: qualityScore >= qualityThreshold ? 'passed' : 'failed'
    },
    metadata: {
      processId: 'specializations/software-architecture/iac-review',
      processSlug: 'iac-review',
      category: 'operational-architecture',
      specializationSlug: 'software-architecture',
      timestamp: startTime,
      duration,
      version: '1.0.0'
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const structureReviewTask = defineTask('structure-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Review IaC Structure: ${args.projectName}`,
  agent: {
    name: 'iac-structure-reviewer',
    prompt: {
      role: 'Senior DevOps Architect specialized in Infrastructure as Code best practices',
      task: 'Review the structure and organization of Infrastructure as Code files',
      context: args,
      instructions: [
        'Analyze directory structure and file organization',
        'Check module organization and reusability',
        'Verify naming conventions and consistency',
        'Assess variable and output management',
        'Review environment separation strategy',
        'Check for proper use of workspaces or environments',
        'Validate module versioning and dependencies',
        'Assess code duplication and DRY principles',
        'Review file size and module complexity',
        'Check for proper use of data sources vs. resources'
      ],
      outputFormat: 'JSON with success, score (0-100), findings (array), artifacts (array), recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'score', 'findings', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        findings: {
          type: 'array',
          items: {
            type: 'object',
            required: ['severity', 'category', 'message', 'location'],
            properties: {
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'info'] },
              category: { type: 'string' },
              message: { type: 'string' },
              location: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        artifacts: {
          type: 'array',
          items: {
            type: 'object',
            required: ['path', 'description'],
            properties: {
              path: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['iac-review', 'structure', 'best-practices', args.iacTool]
}));

export const securityScanTask = defineTask('security-scan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Security Scan: ${args.projectName}`,
  agent: {
    name: 'iac-security-scanner',
    prompt: {
      role: 'Cloud Security Engineer specialized in Infrastructure as Code security',
      task: 'Perform comprehensive security scanning of IaC configurations',
      context: args,
      instructions: [
        'Scan for publicly exposed resources (S3 buckets, databases, etc.)',
        'Check encryption at rest and in transit',
        'Validate IAM roles and policies (principle of least privilege)',
        'Review network security groups and firewall rules',
        'Check for hardcoded credentials or sensitive data',
        'Validate logging and monitoring configurations',
        'Review backup and disaster recovery configurations',
        'Check for vulnerable resource configurations',
        'Validate SSL/TLS configurations',
        'Review API endpoint security',
        `Apply ${args.securityStandards} security benchmarks`,
        'Check for compliance with industry standards'
      ],
      outputFormat: 'JSON with success, score, findings (with severity, type, resource, issue, recommendation)'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'score', 'findings', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        findings: {
          type: 'array',
          items: {
            type: 'object',
            required: ['severity', 'type', 'resource', 'issue', 'recommendation'],
            properties: {
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'info'] },
              type: { type: 'string' },
              resource: { type: 'string' },
              issue: { type: 'string' },
              recommendation: { type: 'string' },
              cve: { type: 'string' },
              references: { type: 'array', items: { type: 'string' } }
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
  labels: ['iac-review', 'security', 'compliance', args.cloudProvider]
}));

export const complianceCheckTask = defineTask('compliance-check', (args, taskCtx) => ({
  kind: 'agent',
  title: `Compliance Check: ${args.projectName}`,
  agent: {
    name: 'iac-compliance-checker',
    prompt: {
      role: 'Compliance Auditor specialized in cloud infrastructure compliance',
      task: 'Verify IaC configurations meet compliance requirements',
      context: args,
      instructions: [
        'Check compliance against specified standards (SOC2, HIPAA, PCI-DSS, GDPR, etc.)',
        'Validate data residency and sovereignty requirements',
        'Review audit logging and monitoring configurations',
        'Check access control and authentication mechanisms',
        'Validate encryption standards',
        'Review data retention and backup policies',
        'Check for compliance with organizational policies',
        'Validate change management and approval workflows',
        'Review incident response configurations',
        'Generate compliance report with gaps and remediation steps'
      ],
      outputFormat: 'JSON with success, score, findings, complianceStatus, gaps'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'score', 'findings', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        complianceStatus: { type: 'string', enum: ['compliant', 'non-compliant', 'partial'] },
        findings: { type: 'array' },
        gaps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['iac-review', 'compliance', 'audit']
}));

export const secretsDetectionTask = defineTask('secrets-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Secrets Detection: ${args.projectName}`,
  agent: {
    name: 'iac-secrets-detector',
    prompt: {
      role: 'Security Engineer specialized in secrets detection and management',
      task: 'Scan IaC files for exposed secrets, credentials, and sensitive data',
      context: args,
      instructions: [
        'Scan for hardcoded passwords, API keys, tokens',
        'Check for AWS access keys, Azure credentials, GCP service account keys',
        'Detect database connection strings with embedded credentials',
        'Identify SSH private keys or certificates',
        'Check for OAuth tokens and secrets',
        'Detect email addresses and personal information',
        'Verify proper use of secret management services (AWS Secrets Manager, Azure Key Vault, etc.)',
        'Check variable files for sensitive data',
        'Review environment variable usage',
        'Generate report with file locations and recommended remediation'
      ],
      outputFormat: 'JSON with success, exposedSecretsCount, findings (with type, location, secretType, recommendation)'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'exposedSecretsCount', 'findings', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        exposedSecretsCount: { type: 'number' },
        findings: {
          type: 'array',
          items: {
            type: 'object',
            required: ['severity', 'type', 'location', 'secretType', 'recommendation'],
            properties: {
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              type: { type: 'string' },
              location: { type: 'string' },
              secretType: { type: 'string' },
              recommendation: { type: 'string' }
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
  labels: ['iac-review', 'security', 'secrets']
}));

export const resourceValidationTask = defineTask('resource-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Resource Validation: ${args.projectName}`,
  agent: {
    name: 'iac-resource-validator',
    prompt: {
      role: 'Cloud Architect specialized in resource configuration and best practices',
      task: 'Validate resource configurations for correctness, availability, and resilience',
      context: args,
      instructions: [
        'Validate compute instance types and sizing',
        'Check high availability configurations (multi-AZ, replication)',
        'Review auto-scaling configurations',
        'Validate load balancer configurations',
        'Check database configurations (backups, maintenance windows)',
        'Review storage configurations (redundancy, lifecycle policies)',
        'Validate network configurations (VPC, subnets, routing)',
        'Check monitoring and alerting configurations',
        'Review disaster recovery and backup strategies',
        'Validate resource tagging for cost allocation and management',
        'Check for proper use of managed services vs. self-managed',
        'Assess performance optimization opportunities'
      ],
      outputFormat: 'JSON with success, score, findings (with category: availability, performance, resilience)'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'score', 'findings', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        findings: {
          type: 'array',
          items: {
            type: 'object',
            required: ['severity', 'category', 'resource', 'issue', 'recommendation'],
            properties: {
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'info'] },
              category: { type: 'string', enum: ['availability', 'performance', 'resilience', 'configuration'] },
              resource: { type: 'string' },
              issue: { type: 'string' },
              recommendation: { type: 'string' }
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
  labels: ['iac-review', 'resources', 'validation', args.cloudProvider]
}));

export const costEstimationTask = defineTask('cost-estimation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Cost Estimation: ${args.projectName}`,
  agent: {
    name: 'iac-cost-estimator',
    prompt: {
      role: 'Cloud FinOps Analyst specialized in infrastructure cost analysis',
      task: 'Estimate infrastructure costs and compare against budget',
      context: args,
      instructions: [
        'Analyze all resources defined in IaC',
        'Estimate monthly costs for compute resources',
        'Calculate storage costs (block, object, database)',
        'Estimate data transfer and bandwidth costs',
        'Calculate costs for managed services',
        'Factor in reserved instances and savings plans',
        'Estimate costs for monitoring and logging',
        'Calculate backup and disaster recovery costs',
        `Compare against budget: $${args.budget}`,
        'Provide cost breakdown by service and environment',
        'Identify cost optimization opportunities',
        'Project annual costs and growth trends'
      ],
      outputFormat: 'JSON with success, estimatedMonthlyCost, costBreakdown, budgetStatus, score'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'estimatedMonthlyCost', 'costBreakdown', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        estimatedMonthlyCost: { type: 'number' },
        estimatedAnnualCost: { type: 'number' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        costBreakdown: {
          type: 'object',
          properties: {
            compute: { type: 'number' },
            storage: { type: 'number' },
            networking: { type: 'number' },
            databases: { type: 'number' },
            managedServices: { type: 'number' },
            monitoring: { type: 'number' },
            other: { type: 'number' }
          }
        },
        budgetStatus: { type: 'string', enum: ['within-budget', 'over-budget', 'no-budget-set'] },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['iac-review', 'cost', 'finops', args.cloudProvider]
}));

export const costOptimizationTask = defineTask('cost-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Cost Optimization: ${args.projectName}`,
  agent: {
    name: 'iac-cost-optimizer',
    prompt: {
      role: 'Cloud FinOps Engineer specialized in cost optimization strategies',
      task: 'Identify cost optimization opportunities in IaC configurations',
      context: args,
      instructions: [
        'Identify oversized resources',
        'Recommend reserved instances or savings plans',
        'Identify unused or idle resources',
        'Recommend auto-scaling configurations',
        'Suggest storage lifecycle policies',
        'Identify opportunities for spot instances',
        'Recommend data transfer optimizations',
        'Suggest using managed services where cost-effective',
        'Identify redundant resources',
        'Recommend cost allocation tagging strategies',
        'Calculate potential monthly savings for each recommendation',
        'Prioritize recommendations by impact and effort'
      ],
      outputFormat: 'JSON with success, recommendations (array with description, estimatedSavings, effort, priority), totalPotentialSavings'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'recommendations', 'totalPotentialSavings', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        totalPotentialSavings: { type: 'number' },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            required: ['description', 'estimatedSavings', 'effort', 'priority'],
            properties: {
              category: { type: 'string' },
              description: { type: 'string' },
              resource: { type: 'string' },
              estimatedSavings: { type: 'number' },
              effort: { type: 'string', enum: ['low', 'medium', 'high'] },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] },
              implementation: { type: 'string' }
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
  labels: ['iac-review', 'cost-optimization', 'finops']
}));

export const stateManagementReviewTask = defineTask('state-management-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `State Management Review: ${args.projectName}`,
  agent: {
    name: 'iac-state-reviewer',
    prompt: {
      role: 'DevOps Engineer specialized in IaC state management and backends',
      task: 'Review state management configuration for safety and best practices',
      context: args,
      instructions: [
        'Verify remote state backend configuration',
        'Check state locking mechanism',
        'Validate state encryption',
        'Review state versioning and backup strategy',
        'Check for local state files (anti-pattern)',
        'Validate workspace usage',
        'Review state access controls and permissions',
        'Check for state file in version control (security risk)',
        'Validate state migration strategy',
        'Review state refresh and drift detection',
        'Check for proper state outputs and data sources',
        'Assess state file organization and structure'
      ],
      outputFormat: 'JSON with success, score, backendConfigured, lockingEnabled, encryptionEnabled, findings'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'score', 'backendConfigured', 'lockingEnabled', 'findings', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        backendConfigured: { type: 'boolean' },
        backendType: { type: 'string' },
        lockingEnabled: { type: 'boolean' },
        encryptionEnabled: { type: 'boolean' },
        findings: {
          type: 'array',
          items: {
            type: 'object',
            required: ['severity', 'category', 'issue', 'recommendation'],
            properties: {
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'info'] },
              category: { type: 'string' },
              issue: { type: 'string' },
              recommendation: { type: 'string' }
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
  labels: ['iac-review', 'state-management', args.iacTool]
}));

export const documentationReviewTask = defineTask('documentation-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Documentation Review: ${args.projectName}`,
  agent: {
    name: 'iac-documentation-reviewer',
    prompt: {
      role: 'Technical Writer specialized in infrastructure documentation',
      task: 'Review IaC documentation for completeness and maintainability',
      context: args,
      instructions: [
        'Check for README.md with project overview',
        'Verify variable documentation',
        'Check output documentation',
        'Review module documentation',
        'Validate inline comments for complex logic',
        'Check for architecture diagrams',
        'Verify deployment instructions',
        'Review troubleshooting guides',
        'Check for change log or version history',
        'Validate examples and usage documentation',
        'Review contributing guidelines',
        'Check for dependency documentation',
        'Assess overall documentation quality and completeness'
      ],
      outputFormat: 'JSON with success, score, documentationQuality, findings, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'score', 'documentationQuality', 'findings', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        documentationQuality: { type: 'string', enum: ['excellent', 'good', 'fair', 'poor'] },
        findings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              severity: { type: 'string' },
              category: { type: 'string' },
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
  labels: ['iac-review', 'documentation', 'maintainability']
}));

export const syntaxValidationTask = defineTask('syntax-validation', (args, taskCtx) => ({
  kind: 'shell',
  title: `Syntax Validation: ${args.iacTool}`,
  shell: {
    command: args.iacTool === 'terraform' ?
      `cd ${args.iacPath} && terraform init -backend=false && terraform validate` :
      args.iacTool === 'cloudformation' ?
      `aws cloudformation validate-template --template-body file://${args.iacPath}/template.yaml` :
      `echo "Syntax validation for ${args.iacTool} not implemented"`
  },
  labels: ['iac-review', 'validation', 'syntax']
}));

export const planValidationTask = defineTask('plan-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Plan Validation: ${args.projectName}`,
  agent: {
    name: 'iac-plan-validator',
    prompt: {
      role: 'DevOps Engineer specialized in infrastructure change validation',
      task: 'Generate and validate infrastructure plan for proposed changes',
      context: args,
      instructions: [
        'Generate infrastructure plan (terraform plan, etc.)',
        'Analyze resource additions, changes, and deletions',
        'Identify potentially destructive changes',
        'Check for data loss risks',
        'Validate resource dependencies',
        'Check for drift from desired state',
        'Assess blast radius of changes',
        'Identify changes requiring downtime',
        'Validate change timing and rollout strategy',
        'Generate plan summary with risk assessment'
      ],
      outputFormat: 'JSON with success, valid, planSummary, risks, errors'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'valid', 'planSummary', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        valid: { type: 'boolean' },
        planSummary: {
          type: 'object',
          properties: {
            additions: { type: 'number' },
            changes: { type: 'number' },
            deletions: { type: 'number' }
          }
        },
        risks: { type: 'array', items: { type: 'string' } },
        errors: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['iac-review', 'plan', 'validation']
}));

export const iacTestingTask = defineTask('iac-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `IaC Testing: ${args.projectName}`,
  agent: {
    name: 'iac-tester',
    prompt: {
      role: 'Test Engineer specialized in infrastructure testing',
      task: 'Validate IaC testing strategy and execute available tests',
      context: args,
      instructions: [
        'Check for unit tests (terratest, kitchen-terraform, etc.)',
        'Validate integration tests',
        'Check for policy-as-code tests (OPA, Sentinel)',
        'Review contract tests for modules',
        'Validate compliance tests',
        'Check for smoke tests',
        'Run available test suites',
        'Generate test coverage report',
        'Identify untested resources or modules',
        'Recommend additional test coverage'
      ],
      outputFormat: 'JSON with success, testsPassed, testsFailed, coverage, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'testsPassed', 'testsFailed', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        testsPassed: { type: 'number' },
        testsFailed: { type: 'number' },
        testsSkipped: { type: 'number' },
        coverage: { type: 'number', minimum: 0, maximum: 100 },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['iac-review', 'testing', args.iacTool]
}));

export const finalReportGenerationTask = defineTask('final-report-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Final Report: ${args.projectName}`,
  agent: {
    name: 'iac-report-generator',
    prompt: {
      role: 'Technical Lead specialized in infrastructure review reporting',
      task: 'Generate comprehensive IaC review report with executive summary',
      context: args,
      instructions: [
        'Synthesize findings from all review phases',
        'Calculate overall quality score (0-100)',
        'Generate executive summary with key findings',
        'Prioritize issues by severity and business impact',
        'Create detailed findings report',
        'Generate actionable recommendations',
        'Create risk matrix',
        'Provide compliance status summary',
        'Include cost analysis and optimization opportunities',
        'Generate metrics and dashboards',
        'Create remediation roadmap',
        'Format report in markdown and JSON'
      ],
      outputFormat: 'JSON with success, overallQualityScore, executiveSummary (markdown), detailedReport, prioritizedIssues, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'overallQualityScore', 'executiveSummary', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        overallQualityScore: { type: 'number', minimum: 0, maximum: 100 },
        executiveSummary: { type: 'string' },
        detailedReport: { type: 'string' },
        prioritizedIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              priority: { type: 'number' },
              severity: { type: 'string' },
              category: { type: 'string' },
              issue: { type: 'string' },
              impact: { type: 'string' },
              recommendation: { type: 'string' }
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
  labels: ['iac-review', 'reporting', 'final']
}));

export const implementationPlanTask = defineTask('implementation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Implementation Plan: ${args.projectName}`,
  agent: {
    name: 'iac-implementation-planner',
    prompt: {
      role: 'DevOps Lead specialized in infrastructure remediation planning',
      task: 'Create actionable implementation plan for addressing review findings',
      context: args,
      instructions: [
        'Categorize findings by effort and impact',
        'Create phased implementation roadmap',
        'Prioritize critical security fixes',
        'Plan cost optimization implementations',
        'Define quick wins for immediate implementation',
        'Schedule long-term improvements',
        'Assign effort estimates',
        'Define success metrics',
        'Create rollback strategies',
        'Generate task breakdown with dependencies',
        'Recommend team assignments',
        'Set realistic timelines'
      ],
      outputFormat: 'JSON with success, plan (phases array with tasks, priorities, estimates), quickWins, longTerm'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'plan', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        plan: {
          type: 'object',
          properties: {
            phases: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  phase: { type: 'string' },
                  description: { type: 'string' },
                  tasks: { type: 'array' },
                  duration: { type: 'string' },
                  priority: { type: 'string' }
                }
              }
            },
            quickWins: { type: 'array' },
            longTerm: { type: 'array' }
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
  labels: ['iac-review', 'implementation', 'planning']
}));
