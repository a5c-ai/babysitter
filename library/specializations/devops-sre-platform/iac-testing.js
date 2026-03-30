/**
 * @process specializations/devops-sre-platform/iac-testing
 * @description IaC Testing and Validation - Comprehensive Infrastructure as Code testing framework covering
 * syntax validation, security scanning, compliance checks, unit testing, integration testing, policy-as-code
 * validation, cost estimation, and deployment simulation with automated quality gates and reporting.
 * @inputs { projectName: string, iacTool: string, iacPath: string, cloudProvider?: string, testingScope?: string, environmentConfig?: object }
 * @outputs { success: boolean, testResults: object, securityFindings: array, complianceStatus: object, qualityScore: number, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/devops-sre-platform/iac-testing', {
 *   projectName: 'Production Infrastructure',
 *   iacTool: 'terraform',
 *   iacPath: './infrastructure',
 *   cloudProvider: 'aws',
 *   testingScope: 'comprehensive',
 *   environmentConfig: {
 *     environment: 'staging',
 *     tfVarsFile: 'staging.tfvars',
 *     backendConfig: 's3://mybucket/terraform.tfstate'
 *   },
 *   testingRequirements: {
 *     syntaxValidation: true,
 *     securityScanning: true,
 *     complianceChecks: ['CIS', 'SOC2'],
 *     unitTesting: true,
 *     integrationTesting: true,
 *     policyValidation: true,
 *     costEstimation: true,
 *     driftDetection: true
 *   },
 *   qualityGates: {
 *     minTestCoverage: 80,
 *     maxCriticalVulnerabilities: 0,
 *     maxHighVulnerabilities: 5,
 *     costBudget: 10000
 *   }
 * });
 *
 * @references
 * - Terraform Testing: https://www.terraform.io/docs/language/tests/
 * - Terratest: https://terratest.gruntwork.io/
 * - Kitchen-Terraform: https://newcontext-oss.github.io/kitchen-terraform/
 * - OPA Policy Testing: https://www.openpolicyagent.org/docs/latest/policy-testing/
 * - Checkov: https://www.checkov.io/
 * - tfsec: https://aquasecurity.github.io/tfsec/
 * - Infracost: https://www.infracost.io/
 * - InSpec: https://www.chef.io/products/chef-inspec
 * - AWS CloudFormation Testing: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-validate-template.html
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    iacTool = 'terraform', // 'terraform', 'cloudformation', 'pulumi', 'ansible', 'cdk', 'bicep'
    iacPath,
    cloudProvider = 'aws', // 'aws', 'azure', 'gcp', 'multi-cloud'
    testingScope = 'comprehensive', // 'quick', 'standard', 'comprehensive', 'security-focused'
    environmentConfig = {
      environment: 'staging',
      tfVarsFile: null,
      backendConfig: null
    },
    testingRequirements = {
      syntaxValidation: true,
      securityScanning: true,
      complianceChecks: ['CIS', 'SOC2'],
      unitTesting: true,
      integrationTesting: true,
      policyValidation: true,
      costEstimation: true,
      driftDetection: true,
      planAnalysis: true
    },
    qualityGates = {
      minTestCoverage: 80,
      maxCriticalVulnerabilities: 0,
      maxHighVulnerabilities: 5,
      costBudget: 10000,
      minComplianceScore: 85
    },
    outputDir = 'iac-testing-output',
    parallelExecutionEnabled = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let testResults = {};
  let securityFindings = [];
  let complianceStatus = {};
  let qualityScore = 0;

  ctx.log('info', `Starting IaC Testing and Validation for ${projectName}`);
  ctx.log('info', `IaC Tool: ${iacTool}, Cloud Provider: ${cloudProvider}, Testing Scope: ${testingScope}`);

  // ============================================================================
  // PHASE 1: PRE-VALIDATION AND ENVIRONMENT SETUP
  // ============================================================================

  ctx.log('info', 'Phase 1: Validating IaC environment and dependencies');

  const environmentSetup = await ctx.task(environmentSetupTask, {
    projectName,
    iacTool,
    iacPath,
    cloudProvider,
    environmentConfig,
    outputDir
  });

  if (!environmentSetup.success) {
    return {
      success: false,
      error: 'Failed to set up IaC testing environment',
      details: environmentSetup,
      metadata: {
        processId: 'specializations/devops-sre-platform/iac-testing',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...environmentSetup.artifacts);

  // Quality Gate: Environment properly configured
  if (!environmentSetup.toolsInstalled || environmentSetup.missingDependencies.length > 0) {
    await ctx.breakpoint({
      question: `Environment setup completed with missing dependencies: ${environmentSetup.missingDependencies.join(', ')}. Install dependencies and continue?`,
      title: 'Environment Setup Gate',
      context: {
        runId: ctx.runId,
        toolsInstalled: environmentSetup.toolsInstalled,
        missingDependencies: environmentSetup.missingDependencies,
        installedVersions: environmentSetup.installedVersions,
        files: [{
          path: `${outputDir}/phase1-environment-setup.json`,
          format: 'json',
          content: JSON.stringify(environmentSetup, null, 2)
        }]
      }
    });
  }

  testResults.environmentSetup = environmentSetup;

  // ============================================================================
  // PHASE 2: SYNTAX VALIDATION AND LINTING
  // ============================================================================

  ctx.log('info', 'Phase 2: Running syntax validation and linting');

  const [syntaxValidation, lintingCheck] = await ctx.parallel.all([
    ctx.task(syntaxValidationTask, {
      projectName,
      iacTool,
      iacPath,
      environmentConfig,
      outputDir
    }),
    ctx.task(iacLintingTask, {
      projectName,
      iacTool,
      iacPath,
      outputDir
    })
  ]);

  if (!syntaxValidation.success) {
    return {
      success: false,
      error: 'IaC syntax validation failed',
      details: { syntaxValidation, lintingCheck },
      metadata: {
        processId: 'specializations/devops-sre-platform/iac-testing',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...syntaxValidation.artifacts, ...lintingCheck.artifacts);

  // Quality Gate: No syntax errors
  if (!syntaxValidation.valid || syntaxValidation.errors.length > 0) {
    ctx.log('error', `Found ${syntaxValidation.errors.length} syntax errors`);

    await ctx.breakpoint({
      question: `Phase 2 Quality Gate: Found ${syntaxValidation.errors.length} syntax errors. IaC cannot proceed until fixed. Review and fix?`,
      title: 'Syntax Validation Failed',
      context: {
        runId: ctx.runId,
        valid: syntaxValidation.valid,
        errors: syntaxValidation.errors,
        warnings: syntaxValidation.warnings,
        lintingIssues: lintingCheck.issues,
        files: [{
          path: `${outputDir}/phase2-syntax-validation.json`,
          format: 'json',
          content: JSON.stringify({ syntaxValidation, lintingCheck }, null, 2)
        }]
      }
    });
  }

  testResults.syntaxValidation = syntaxValidation;
  testResults.linting = lintingCheck;

  // ============================================================================
  // PHASE 3: SECURITY SCANNING
  // ============================================================================

  ctx.log('info', 'Phase 3: Conducting security scanning and vulnerability detection');

  // Run security scans in parallel
  const [tfsecScan, checkovScan, customSecurityPolicies] = await ctx.parallel.all([
    ctx.task(tfsecScanTask, {
      projectName,
      iacTool,
      iacPath,
      cloudProvider,
      outputDir
    }),
    ctx.task(checkovScanTask, {
      projectName,
      iacTool,
      iacPath,
      cloudProvider,
      outputDir
    }),
    ctx.task(customSecurityPoliciesTask, {
      projectName,
      iacTool,
      iacPath,
      outputDir
    })
  ]);

  if (!tfsecScan.success || !checkovScan.success) {
    return {
      success: false,
      error: 'Security scanning failed',
      details: { tfsecScan, checkovScan, customSecurityPolicies },
      metadata: {
        processId: 'specializations/devops-sre-platform/iac-testing',
        timestamp: startTime
      }
    };
  }

  securityFindings.push(
    ...tfsecScan.findings,
    ...checkovScan.findings,
    ...customSecurityPolicies.findings
  );
  artifacts.push(...tfsecScan.artifacts, ...checkovScan.artifacts, ...customSecurityPolicies.artifacts);

  // Quality Gate: Critical vulnerabilities
  const criticalVulns = securityFindings.filter(f => f.severity === 'critical').length;
  const highVulns = securityFindings.filter(f => f.severity === 'high').length;

  if (criticalVulns > qualityGates.maxCriticalVulnerabilities) {
    ctx.log('error', `Found ${criticalVulns} critical vulnerabilities (threshold: ${qualityGates.maxCriticalVulnerabilities})`);

    await ctx.breakpoint({
      question: `Phase 3 Quality Gate: Found ${criticalVulns} CRITICAL security vulnerabilities. These MUST be fixed before proceeding. Continue?`,
      title: 'Critical Security Vulnerabilities Detected',
      context: {
        runId: ctx.runId,
        criticalCount: criticalVulns,
        highCount: highVulns,
        threshold: qualityGates.maxCriticalVulnerabilities,
        criticalFindings: securityFindings.filter(f => f.severity === 'critical'),
        files: [{
          path: `${outputDir}/phase3-security-scan.json`,
          format: 'json',
          content: JSON.stringify({ tfsecScan, checkovScan, customSecurityPolicies, securityFindings }, null, 2)
        }]
      }
    });
  } else if (highVulns > qualityGates.maxHighVulnerabilities) {
    ctx.log('warn', `Found ${highVulns} high-severity vulnerabilities (threshold: ${qualityGates.maxHighVulnerabilities})`);

    await ctx.breakpoint({
      question: `Phase 3 Quality Gate: Found ${highVulns} HIGH security vulnerabilities (threshold: ${qualityGates.maxHighVulnerabilities}). Review and approve?`,
      title: 'High Security Vulnerabilities Warning',
      context: {
        runId: ctx.runId,
        highCount: highVulns,
        threshold: qualityGates.maxHighVulnerabilities,
        highFindings: securityFindings.filter(f => f.severity === 'high'),
        files: [{
          path: `${outputDir}/phase3-security-scan.json`,
          format: 'json',
          content: JSON.stringify({ securityFindings }, null, 2)
        }]
      }
    });
  }

  testResults.securityScanning = { tfsecScan, checkovScan, customSecurityPolicies };

  // ============================================================================
  // PHASE 4: COMPLIANCE VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Validating compliance against industry standards');

  const complianceValidation = await ctx.task(complianceValidationTask, {
    projectName,
    iacTool,
    iacPath,
    cloudProvider,
    complianceStandards: testingRequirements.complianceChecks,
    outputDir
  });

  if (!complianceValidation.success) {
    return {
      success: false,
      error: 'Compliance validation failed',
      details: complianceValidation,
      metadata: {
        processId: 'specializations/devops-sre-platform/iac-testing',
        timestamp: startTime
      }
    };
  }

  complianceStatus = complianceValidation.complianceStatus;
  artifacts.push(...complianceValidation.artifacts);

  // Quality Gate: Compliance score
  const complianceScore = complianceValidation.overallScore;
  if (complianceScore < qualityGates.minComplianceScore) {
    ctx.log('warn', `Compliance score ${complianceScore}% below threshold ${qualityGates.minComplianceScore}%`);

    await ctx.breakpoint({
      question: `Phase 4 Quality Gate: Compliance score (${complianceScore}%) is below required threshold (${qualityGates.minComplianceScore}%). Review compliance gaps?`,
      title: 'Compliance Score Below Threshold',
      context: {
        runId: ctx.runId,
        complianceScore,
        threshold: qualityGates.minComplianceScore,
        complianceStatus,
        gaps: complianceValidation.gaps,
        files: [{
          path: `${outputDir}/phase4-compliance-report.json`,
          format: 'json',
          content: JSON.stringify(complianceValidation, null, 2)
        }]
      }
    });
  }

  testResults.compliance = complianceValidation;

  // ============================================================================
  // PHASE 5: POLICY-AS-CODE VALIDATION (OPA/Sentinel)
  // ============================================================================

  ctx.log('info', 'Phase 5: Running policy-as-code validation');

  const policyValidation = await ctx.task(policyValidationTask, {
    projectName,
    iacTool,
    iacPath,
    cloudProvider,
    policyFramework: 'opa', // 'opa', 'sentinel', 'both'
    outputDir
  });

  if (!policyValidation.success) {
    ctx.log('warn', 'Policy validation encountered issues');
  }

  artifacts.push(...policyValidation.artifacts);

  // Quality Gate: Policy violations
  const hardMandatoryViolations = policyValidation.violations.filter(v => v.enforcementLevel === 'hard-mandatory');
  if (hardMandatoryViolations.length > 0) {
    ctx.log('error', `Found ${hardMandatoryViolations.length} hard-mandatory policy violations`);

    await ctx.breakpoint({
      question: `Phase 5 Quality Gate: Found ${hardMandatoryViolations.length} hard-mandatory policy violations. These must be fixed. Continue?`,
      title: 'Policy Violations Detected',
      context: {
        runId: ctx.runId,
        hardMandatoryCount: hardMandatoryViolations.length,
        violations: hardMandatoryViolations,
        advisoryCount: policyValidation.violations.filter(v => v.enforcementLevel === 'advisory').length,
        files: [{
          path: `${outputDir}/phase5-policy-validation.json`,
          format: 'json',
          content: JSON.stringify(policyValidation, null, 2)
        }]
      }
    });
  }

  testResults.policyValidation = policyValidation;

  // ============================================================================
  // PHASE 6: PLAN GENERATION AND ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Generating and analyzing infrastructure plan');

  const planAnalysis = await ctx.task(planAnalysisTask, {
    projectName,
    iacTool,
    iacPath,
    environmentConfig,
    cloudProvider,
    outputDir
  });

  if (!planAnalysis.success) {
    return {
      success: false,
      error: 'Failed to generate or analyze infrastructure plan',
      details: planAnalysis,
      metadata: {
        processId: 'specializations/devops-sre-platform/iac-testing',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...planAnalysis.artifacts);

  // Quality Gate: Destructive changes
  const destructiveChanges = planAnalysis.destructiveChanges || [];
  if (destructiveChanges.length > 0) {
    ctx.log('warn', `Plan contains ${destructiveChanges.length} potentially destructive changes`);

    await ctx.breakpoint({
      question: `Phase 6 Quality Gate: Infrastructure plan contains ${destructiveChanges.length} potentially destructive changes. Review and approve?`,
      title: 'Destructive Changes Detected',
      context: {
        runId: ctx.runId,
        destructiveCount: destructiveChanges.length,
        destructiveChanges,
        planSummary: planAnalysis.planSummary,
        totalChanges: planAnalysis.planSummary.additions + planAnalysis.planSummary.changes + planAnalysis.planSummary.deletions,
        files: [{
          path: `${outputDir}/phase6-plan-analysis.json`,
          format: 'json',
          content: JSON.stringify(planAnalysis, null, 2)
        }]
      }
    });
  }

  testResults.planAnalysis = planAnalysis;

  // ============================================================================
  // PHASE 7: COST ESTIMATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Estimating infrastructure costs');

  const costEstimation = await ctx.task(costEstimationTask, {
    projectName,
    iacTool,
    iacPath,
    cloudProvider,
    environmentConfig,
    budget: qualityGates.costBudget,
    outputDir
  });

  if (!costEstimation.success) {
    ctx.log('warn', 'Cost estimation failed or unavailable');
  } else {
    artifacts.push(...costEstimation.artifacts);

    // Quality Gate: Cost budget
    const estimatedMonthlyCost = costEstimation.estimatedMonthlyCost;
    if (qualityGates.costBudget && estimatedMonthlyCost > qualityGates.costBudget) {
      const overage = estimatedMonthlyCost - qualityGates.costBudget;
      const overagePercent = ((overage / qualityGates.costBudget) * 100).toFixed(1);

      ctx.log('warn', `Estimated cost $${estimatedMonthlyCost} exceeds budget $${qualityGates.costBudget} by $${overage} (${overagePercent}%)`);

      await ctx.breakpoint({
        question: `Phase 7 Quality Gate: Estimated monthly cost ($${estimatedMonthlyCost}) exceeds budget ($${qualityGates.costBudget}) by $${overage}. Review and approve?`,
        title: 'Cost Budget Exceeded',
        context: {
          runId: ctx.runId,
          estimatedCost: estimatedMonthlyCost,
          budget: qualityGates.costBudget,
          overage,
          overagePercent,
          costBreakdown: costEstimation.costBreakdown,
          files: [{
            path: `${outputDir}/phase7-cost-estimation.json`,
            format: 'json',
            content: JSON.stringify(costEstimation, null, 2)
          }]
        }
      });
    }
  }

  testResults.costEstimation = costEstimation;

  // ============================================================================
  // PHASE 8: UNIT TESTING (Terratest/Kitchen-Terraform)
  // ============================================================================

  if (testingRequirements.unitTesting) {
    ctx.log('info', 'Phase 8: Running IaC unit tests');

    const unitTests = await ctx.task(unitTestingTask, {
      projectName,
      iacTool,
      iacPath,
      cloudProvider,
      outputDir
    });

    artifacts.push(...unitTests.artifacts);

    // Quality Gate: Unit test pass rate
    const unitTestPassRate = unitTests.passRate || 0;
    if (unitTestPassRate < qualityGates.minTestCoverage) {
      ctx.log('warn', `Unit test pass rate ${unitTestPassRate}% below threshold ${qualityGates.minTestCoverage}%`);

      await ctx.breakpoint({
        question: `Phase 8 Quality Gate: Unit test pass rate (${unitTestPassRate}%) is below threshold (${qualityGates.minTestCoverage}%). Review failures?`,
        title: 'Unit Test Pass Rate Low',
        context: {
          runId: ctx.runId,
          passRate: unitTestPassRate,
          threshold: qualityGates.minTestCoverage,
          totalTests: unitTests.totalTests,
          passed: unitTests.passed,
          failed: unitTests.failed,
          failureReasons: unitTests.failures,
          files: [{
            path: `${outputDir}/phase8-unit-tests.json`,
            format: 'json',
            content: JSON.stringify(unitTests, null, 2)
          }]
        }
      });
    }

    testResults.unitTesting = unitTests;
  }

  // ============================================================================
  // PHASE 9: INTEGRATION TESTING (Ephemeral Environment)
  // ============================================================================

  if (testingRequirements.integrationTesting) {
    ctx.log('info', 'Phase 9: Running integration tests in ephemeral environment');

    const integrationTests = await ctx.task(integrationTestingTask, {
      projectName,
      iacTool,
      iacPath,
      cloudProvider,
      environmentConfig,
      outputDir
    });

    artifacts.push(...integrationTests.artifacts);

    // Quality Gate: Integration test results
    if (!integrationTests.success || integrationTests.failed > 0) {
      ctx.log('warn', `Integration tests: ${integrationTests.failed} failures out of ${integrationTests.totalTests}`);

      await ctx.breakpoint({
        question: `Phase 9 Quality Gate: Integration tests completed with ${integrationTests.failed} failures. Review and approve?`,
        title: 'Integration Test Failures',
        context: {
          runId: ctx.runId,
          totalTests: integrationTests.totalTests,
          passed: integrationTests.passed,
          failed: integrationTests.failed,
          failures: integrationTests.failures,
          environmentCleanedUp: integrationTests.environmentCleanedUp,
          files: [{
            path: `${outputDir}/phase9-integration-tests.json`,
            format: 'json',
            content: JSON.stringify(integrationTests, null, 2)
          }]
        }
      });
    }

    testResults.integrationTesting = integrationTests;
  }

  // ============================================================================
  // PHASE 10: DRIFT DETECTION
  // ============================================================================

  if (testingRequirements.driftDetection) {
    ctx.log('info', 'Phase 10: Detecting configuration drift');

    const driftDetection = await ctx.task(driftDetectionTask, {
      projectName,
      iacTool,
      iacPath,
      cloudProvider,
      environmentConfig,
      outputDir
    });

    artifacts.push(...driftDetection.artifacts);

    // Quality Gate: Configuration drift
    if (driftDetection.driftDetected) {
      ctx.log('warn', `Configuration drift detected: ${driftDetection.driftedResources.length} resources`);

      await ctx.breakpoint({
        question: `Phase 10 Quality Gate: Configuration drift detected for ${driftDetection.driftedResources.length} resources. Review drift?`,
        title: 'Configuration Drift Detected',
        context: {
          runId: ctx.runId,
          driftDetected: driftDetection.driftDetected,
          driftedResourceCount: driftDetection.driftedResources.length,
          driftedResources: driftDetection.driftedResources,
          driftSummary: driftDetection.driftSummary,
          files: [{
            path: `${outputDir}/phase10-drift-detection.json`,
            format: 'json',
            content: JSON.stringify(driftDetection, null, 2)
          }]
        }
      });
    }

    testResults.driftDetection = driftDetection;
  }

  // ============================================================================
  // PHASE 11: COMPREHENSIVE TEST REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 11: Generating comprehensive test report');

  const finalReport = await ctx.task(testReportGenerationTask, {
    projectName,
    iacTool,
    cloudProvider,
    testingScope,
    testResults,
    securityFindings,
    complianceStatus,
    qualityGates,
    outputDir
  });

  if (!finalReport.success) {
    return {
      success: false,
      error: 'Failed to generate test report',
      details: finalReport,
      metadata: {
        processId: 'specializations/devops-sre-platform/iac-testing',
        timestamp: startTime
      }
    };
  }

  artifacts.push(...finalReport.artifacts);
  qualityScore = finalReport.overallQualityScore;

  // Calculate phase scores
  const phaseScores = {
    syntaxValidation: syntaxValidation.valid ? 100 : 0,
    linting: lintingCheck.score || 0,
    security: calculateSecurityScore(securityFindings),
    compliance: complianceScore,
    policyValidation: policyValidation.score || 0,
    planAnalysis: planAnalysis.score || 0,
    unitTesting: testResults.unitTesting?.passRate || 0,
    integrationTesting: testResults.integrationTesting?.passRate || 0
  };

  // Final Quality Gate: Overall quality meets threshold
  const qualityThreshold = testingScope === 'comprehensive' ? 85 :
                          testingScope === 'standard' ? 75 : 65;

  if (qualityScore < qualityThreshold) {
    ctx.log('warn', `Overall quality score (${qualityScore}) below threshold (${qualityThreshold})`);

    await ctx.breakpoint({
      question: `Final Quality Gate: Overall quality score (${qualityScore}/100) is below threshold (${qualityThreshold}). Review recommendations and approve deployment?`,
      title: 'Final Quality Gate',
      context: {
        runId: ctx.runId,
        qualityScore,
        qualityThreshold,
        phaseScores,
        criticalIssues: securityFindings.filter(f => f.severity === 'critical').length,
        highIssues: securityFindings.filter(f => f.severity === 'high').length,
        complianceScore,
        costOverage: testResults.costEstimation?.estimatedMonthlyCost > qualityGates.costBudget,
        files: [{
          path: `${outputDir}/final-test-report.json`,
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

  const endTime = ctx.now();
  const duration = endTime - startTime;

  ctx.log('info', `IaC Testing and Validation completed in ${duration}ms`);
  ctx.log('info', `Overall Quality Score: ${qualityScore}/100`);
  ctx.log('info', `Security Findings: ${securityFindings.length} (${securityFindings.filter(f => f.severity === 'critical').length} critical)`);
  ctx.log('info', `Compliance Score: ${complianceScore}%`);

  return {
    success: true,
    projectName,
    iacTool,
    cloudProvider,
    testingScope,
    qualityScore,
    phaseScores,
    testResults,
    securityFindings,
    complianceStatus,
    artifacts,
    summary: {
      totalTests: calculateTotalTests(testResults),
      passedTests: calculatePassedTests(testResults),
      failedTests: calculateFailedTests(testResults),
      securityVulnerabilities: {
        critical: securityFindings.filter(f => f.severity === 'critical').length,
        high: securityFindings.filter(f => f.severity === 'high').length,
        medium: securityFindings.filter(f => f.severity === 'medium').length,
        low: securityFindings.filter(f => f.severity === 'low').length
      },
      complianceScore,
      estimatedMonthlyCost: testResults.costEstimation?.estimatedMonthlyCost || 0,
      qualityGate: qualityScore >= qualityThreshold ? 'passed' : 'failed'
    },
    metadata: {
      processId: 'specializations/devops-sre-platform/iac-testing',
      processSlug: 'iac-testing',
      category: 'devops-sre-platform',
      specializationSlug: 'devops-sre-platform',
      timestamp: startTime,
      duration,
      version: '1.0.0'
    }
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateSecurityScore(findings) {
  if (findings.length === 0) return 100;

  const weights = { critical: 10, high: 5, medium: 2, low: 1 };
  const totalWeight = findings.reduce((sum, f) => sum + (weights[f.severity] || 0), 0);

  // Score decreases as findings increase
  return Math.max(0, 100 - totalWeight);
}

function calculateTotalTests(testResults) {
  let total = 0;
  if (testResults.unitTesting) total += testResults.unitTesting.totalTests || 0;
  if (testResults.integrationTesting) total += testResults.integrationTesting.totalTests || 0;
  return total;
}

function calculatePassedTests(testResults) {
  let passed = 0;
  if (testResults.unitTesting) passed += testResults.unitTesting.passed || 0;
  if (testResults.integrationTesting) passed += testResults.integrationTesting.passed || 0;
  return passed;
}

function calculateFailedTests(testResults) {
  let failed = 0;
  if (testResults.unitTesting) failed += testResults.unitTesting.failed || 0;
  if (testResults.integrationTesting) failed += testResults.integrationTesting.failed || 0;
  return failed;
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const environmentSetupTask = defineTask('environment-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup IaC Testing Environment: ${args.projectName}`,
  agent: {
    name: 'iac-environment-setup-agent',
    prompt: {
      role: 'Senior DevOps Engineer specialized in IaC testing infrastructure',
      task: 'Set up and validate the IaC testing environment with all required tools',
      context: args,
      instructions: [
        'Verify IaC tool installation and version',
        'Check cloud provider CLI tools (aws-cli, az-cli, gcloud)',
        'Validate testing framework installations (Terratest, Kitchen-Terraform, etc.)',
        'Check security scanning tools (tfsec, Checkov, etc.)',
        'Verify policy validation tools (OPA, Sentinel)',
        'Check cost estimation tools (Infracost)',
        'Validate access credentials and permissions',
        'Set up output directory structure',
        'Initialize IaC backend configuration',
        'Document all installed tool versions',
        'Report any missing dependencies or configuration issues'
      ],
      outputFormat: 'JSON with success, toolsInstalled, missingDependencies, installedVersions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'toolsInstalled', 'missingDependencies', 'installedVersions', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        toolsInstalled: { type: 'boolean' },
        missingDependencies: { type: 'array', items: { type: 'string' } },
        installedVersions: {
          type: 'object',
          additionalProperties: { type: 'string' }
        },
        configurationIssues: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['iac-testing', 'environment-setup', args.iacTool]
}));

export const syntaxValidationTask = defineTask('syntax-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Syntax Validation: ${args.iacTool}`,
  agent: {
    name: 'iac-syntax-validator',
    prompt: {
      role: 'Infrastructure Engineer specialized in IaC syntax validation',
      task: 'Validate IaC syntax and configuration correctness',
      context: args,
      instructions: [
        'Run IaC tool native validation (terraform validate, cloudformation validate-template, etc.)',
        'Check for syntax errors in all configuration files',
        'Validate variable definitions and usage',
        'Check output definitions',
        'Validate module references and versions',
        'Check for deprecated syntax or features',
        'Verify provider configuration',
        'Check resource naming conventions',
        'Validate data source references',
        'Report all errors and warnings with file locations'
      ],
      outputFormat: 'JSON with success, valid, errors (array), warnings (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'valid', 'errors', 'warnings', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        valid: { type: 'boolean' },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            required: ['file', 'line', 'message'],
            properties: {
              file: { type: 'string' },
              line: { type: 'number' },
              column: { type: 'number' },
              message: { type: 'string' },
              severity: { type: 'string' }
            }
          }
        },
        warnings: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['iac-testing', 'syntax-validation', args.iacTool]
}));

export const iacLintingTask = defineTask('iac-linting', (args, taskCtx) => ({
  kind: 'agent',
  title: `IaC Linting: ${args.projectName}`,
  agent: {
    name: 'iac-linter',
    prompt: {
      role: 'DevOps Engineer specialized in IaC best practices and code quality',
      task: 'Run linting checks on IaC code for style and best practices',
      context: args,
      instructions: [
        'Run tflint or equivalent linter for the IaC tool',
        'Check code formatting and style consistency',
        'Validate naming conventions',
        'Check for unused variables and outputs',
        'Identify deprecated resource types',
        'Check for best practice violations',
        'Validate documentation and comments',
        'Check for code duplication',
        'Assess module organization',
        'Generate linting report with severity levels'
      ],
      outputFormat: 'JSON with success, score (0-100), issues (array with severity, rule, file, message), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'score', 'issues', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            required: ['severity', 'rule', 'file', 'message'],
            properties: {
              severity: { type: 'string', enum: ['error', 'warning', 'info'] },
              rule: { type: 'string' },
              file: { type: 'string' },
              line: { type: 'number' },
              message: { type: 'string' },
              suggestion: { type: 'string' }
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
  labels: ['iac-testing', 'linting', 'code-quality']
}));

export const tfsecScanTask = defineTask('tfsec-scan', (args, taskCtx) => ({
  kind: 'agent',
  title: `tfsec Security Scan: ${args.projectName}`,
  agent: {
    name: 'iac-tfsec-scanner',
    prompt: {
      role: 'Security Engineer specialized in IaC security scanning with tfsec',
      task: 'Run tfsec security scanner on IaC code',
      context: args,
      instructions: [
        'Execute tfsec scan on IaC directory',
        'Check for publicly exposed resources',
        'Validate encryption configurations',
        'Check network security configurations',
        'Validate IAM and access control policies',
        'Check for secrets in code',
        'Validate logging and monitoring',
        'Check for vulnerable resource configurations',
        'Generate findings with severity levels',
        'Provide remediation recommendations for each finding'
      ],
      outputFormat: 'JSON with success, findings (array with severity, resource, issue, remediation), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'findings', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        findings: {
          type: 'array',
          items: {
            type: 'object',
            required: ['severity', 'resource', 'issue', 'remediation'],
            properties: {
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'info'] },
              resource: { type: 'string' },
              file: { type: 'string' },
              line: { type: 'number' },
              issue: { type: 'string' },
              remediation: { type: 'string' },
              ruleId: { type: 'string' },
              impact: { type: 'string' }
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
  labels: ['iac-testing', 'security', 'tfsec', args.cloudProvider]
}));

export const checkovScanTask = defineTask('checkov-scan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Checkov Security Scan: ${args.projectName}`,
  agent: {
    name: 'iac-checkov-scanner',
    prompt: {
      role: 'Security Engineer specialized in IaC security scanning with Checkov',
      task: 'Run Checkov security and compliance scanner on IaC code',
      context: args,
      instructions: [
        'Execute Checkov scan on IaC directory',
        'Check against CIS benchmarks',
        'Validate security best practices',
        'Check for compliance violations',
        'Identify misconfigurations',
        'Check for secrets and sensitive data',
        'Validate resource policies',
        'Check for public exposure',
        'Generate comprehensive findings report',
        'Provide fix recommendations'
      ],
      outputFormat: 'JSON with success, findings (with severity, check, resource, result, guideline), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'findings', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        findings: {
          type: 'array',
          items: {
            type: 'object',
            required: ['severity', 'check', 'resource', 'result', 'guideline'],
            properties: {
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'info'] },
              check: { type: 'string' },
              resource: { type: 'string' },
              file: { type: 'string' },
              result: { type: 'string', enum: ['passed', 'failed', 'skipped'] },
              guideline: { type: 'string' },
              benchmarks: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        summary: {
          type: 'object',
          properties: {
            passed: { type: 'number' },
            failed: { type: 'number' },
            skipped: { type: 'number' }
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
  labels: ['iac-testing', 'security', 'checkov', 'compliance']
}));

export const customSecurityPoliciesTask = defineTask('custom-security-policies', (args, taskCtx) => ({
  kind: 'agent',
  title: `Custom Security Policies: ${args.projectName}`,
  agent: {
    name: 'iac-custom-policy-validator',
    prompt: {
      role: 'Security Architect specialized in organizational security policies',
      task: 'Validate IaC against custom organizational security policies',
      context: args,
      instructions: [
        'Check for organization-specific security requirements',
        'Validate tagging and labeling standards',
        'Check for required encryption standards',
        'Validate backup and retention policies',
        'Check for required monitoring configurations',
        'Validate network isolation requirements',
        'Check for required security controls',
        'Validate disaster recovery configurations',
        'Check compliance with internal security standards',
        'Generate findings for policy violations'
      ],
      outputFormat: 'JSON with success, findings (with policy, violation, resource, recommendation), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'findings', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        findings: {
          type: 'array',
          items: {
            type: 'object',
            required: ['severity', 'policy', 'violation', 'resource', 'recommendation'],
            properties: {
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'info'] },
              policy: { type: 'string' },
              violation: { type: 'string' },
              resource: { type: 'string' },
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
  labels: ['iac-testing', 'security', 'custom-policies']
}));

export const complianceValidationTask = defineTask('compliance-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Compliance Validation: ${args.projectName}`,
  agent: {
    name: 'iac-compliance-validator',
    prompt: {
      role: 'Compliance Auditor specialized in infrastructure compliance',
      task: 'Validate IaC configurations against compliance standards',
      context: args,
      instructions: [
        `Check compliance against standards: ${args.complianceStandards.join(', ')}`,
        'Validate data residency requirements',
        'Check encryption standards (at rest and in transit)',
        'Validate access control configurations',
        'Check audit logging requirements',
        'Validate backup and retention policies',
        'Check network segmentation',
        'Validate incident response capabilities',
        'Check for compliance gaps',
        'Calculate overall compliance score',
        'Generate compliance report with remediation steps'
      ],
      outputFormat: 'JSON with success, overallScore, complianceStatus (per standard), gaps (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'overallScore', 'complianceStatus', 'gaps', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        complianceStatus: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              compliant: { type: 'boolean' },
              score: { type: 'number' },
              findings: { type: 'array' }
            }
          }
        },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              standard: { type: 'string' },
              requirement: { type: 'string' },
              gap: { type: 'string' },
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
  labels: ['iac-testing', 'compliance', 'audit']
}));

export const policyValidationTask = defineTask('policy-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Policy-as-Code Validation: ${args.projectName}`,
  agent: {
    name: 'iac-policy-validator',
    prompt: {
      role: 'Policy Engineer specialized in OPA/Sentinel policy validation',
      task: 'Validate IaC against policy-as-code rules',
      context: args,
      instructions: [
        'Run OPA policy validation if configured',
        'Run Sentinel policy checks if configured',
        'Validate against organizational policies',
        'Check enforcement levels (advisory, soft-mandatory, hard-mandatory)',
        'Identify policy violations',
        'Check for policy conflicts',
        'Validate policy test coverage',
        'Generate policy compliance report',
        'Provide remediation guidance for violations'
      ],
      outputFormat: 'JSON with success, score, violations (with policy, enforcementLevel, resource, message), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'score', 'violations', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        violations: {
          type: 'array',
          items: {
            type: 'object',
            required: ['policy', 'enforcementLevel', 'resource', 'message'],
            properties: {
              policy: { type: 'string' },
              enforcementLevel: { type: 'string', enum: ['advisory', 'soft-mandatory', 'hard-mandatory'] },
              resource: { type: 'string' },
              message: { type: 'string' },
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
  labels: ['iac-testing', 'policy', 'opa', 'sentinel']
}));

export const planAnalysisTask = defineTask('plan-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Plan Analysis: ${args.projectName}`,
  agent: {
    name: 'iac-plan-analyzer',
    prompt: {
      role: 'Infrastructure Analyst specialized in change impact analysis',
      task: 'Generate and analyze infrastructure plan for risk assessment',
      context: args,
      instructions: [
        'Generate infrastructure plan',
        'Analyze resource additions',
        'Analyze resource modifications',
        'Analyze resource deletions',
        'Identify potentially destructive changes',
        'Assess data loss risks',
        'Check for downtime-causing changes',
        'Validate resource dependencies',
        'Check for breaking changes',
        'Calculate change impact score',
        'Generate plan summary and risk assessment'
      ],
      outputFormat: 'JSON with success, planSummary (additions, changes, deletions), destructiveChanges (array), risks (array), score, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'planSummary', 'destructiveChanges', 'risks', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        planSummary: {
          type: 'object',
          required: ['additions', 'changes', 'deletions'],
          properties: {
            additions: { type: 'number' },
            changes: { type: 'number' },
            deletions: { type: 'number' }
          }
        },
        destructiveChanges: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              resource: { type: 'string' },
              action: { type: 'string' },
              risk: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        risks: { type: 'array', items: { type: 'string' } },
        score: { type: 'number', minimum: 0, maximum: 100 },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['iac-testing', 'plan-analysis', args.iacTool]
}));

export const costEstimationTask = defineTask('cost-estimation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Cost Estimation: ${args.projectName}`,
  agent: {
    name: 'iac-cost-estimator',
    prompt: {
      role: 'FinOps Analyst specialized in infrastructure cost estimation',
      task: 'Estimate monthly infrastructure costs from IaC',
      context: args,
      instructions: [
        'Run Infracost or equivalent cost estimation tool',
        'Analyze all resource definitions',
        'Estimate compute costs',
        'Estimate storage costs',
        'Estimate network transfer costs',
        'Estimate managed service costs',
        'Calculate monthly total',
        'Compare against budget if provided',
        'Generate cost breakdown by service',
        'Identify cost optimization opportunities'
      ],
      outputFormat: 'JSON with success, estimatedMonthlyCost, costBreakdown, budgetStatus, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'estimatedMonthlyCost', 'costBreakdown', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        estimatedMonthlyCost: { type: 'number' },
        estimatedAnnualCost: { type: 'number' },
        costBreakdown: {
          type: 'object',
          properties: {
            compute: { type: 'number' },
            storage: { type: 'number' },
            networking: { type: 'number' },
            databases: { type: 'number' },
            other: { type: 'number' }
          }
        },
        budgetStatus: { type: 'string', enum: ['within-budget', 'over-budget', 'no-budget'] },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['iac-testing', 'cost-estimation', 'finops']
}));

export const unitTestingTask = defineTask('unit-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Unit Testing: ${args.projectName}`,
  agent: {
    name: 'iac-unit-tester',
    prompt: {
      role: 'Test Engineer specialized in IaC unit testing with Terratest/Kitchen-Terraform',
      task: 'Execute IaC unit tests to validate module behavior',
      context: args,
      instructions: [
        'Discover and run existing unit tests',
        'Test module inputs and outputs',
        'Validate resource configurations',
        'Test edge cases and error handling',
        'Validate conditional logic',
        'Test variable validation',
        'Check for proper resource naming',
        'Validate tags and labels',
        'Calculate test coverage',
        'Generate unit test report with pass/fail details'
      ],
      outputFormat: 'JSON with success, totalTests, passed, failed, passRate, failures (array), coverage, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'totalTests', 'passed', 'failed', 'passRate', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        totalTests: { type: 'number' },
        passed: { type: 'number' },
        failed: { type: 'number' },
        passRate: { type: 'number', minimum: 0, maximum: 100 },
        failures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testName: { type: 'string' },
              error: { type: 'string' },
              expected: { type: 'string' },
              actual: { type: 'string' }
            }
          }
        },
        coverage: { type: 'number', minimum: 0, maximum: 100 },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['iac-testing', 'unit-tests', 'terratest']
}));

export const integrationTestingTask = defineTask('integration-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Integration Testing: ${args.projectName}`,
  agent: {
    name: 'iac-integration-tester',
    prompt: {
      role: 'Infrastructure Test Engineer specialized in integration testing',
      task: 'Deploy IaC to ephemeral environment and run integration tests',
      context: args,
      instructions: [
        'Create ephemeral test environment',
        'Apply IaC configuration to test environment',
        'Wait for resources to be fully provisioned',
        'Run integration tests against deployed resources',
        'Test resource connectivity and dependencies',
        'Validate actual cloud resource configurations',
        'Test application functionality on deployed infrastructure',
        'Capture test results and logs',
        'Clean up and destroy test environment',
        'Generate integration test report'
      ],
      outputFormat: 'JSON with success, totalTests, passed, failed, passRate, failures, environmentCleanedUp, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'totalTests', 'passed', 'failed', 'passRate', 'environmentCleanedUp', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        totalTests: { type: 'number' },
        passed: { type: 'number' },
        failed: { type: 'number' },
        passRate: { type: 'number', minimum: 0, maximum: 100 },
        failures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              testName: { type: 'string' },
              error: { type: 'string' },
              resource: { type: 'string' }
            }
          }
        },
        environmentCleanedUp: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['iac-testing', 'integration-tests', 'ephemeral-environment']
}));

export const driftDetectionTask = defineTask('drift-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Drift Detection: ${args.projectName}`,
  agent: {
    name: 'iac-drift-detector',
    prompt: {
      role: 'SRE Engineer specialized in configuration drift detection',
      task: 'Detect configuration drift between IaC and actual infrastructure',
      context: args,
      instructions: [
        'Refresh state from actual infrastructure',
        'Compare IaC configuration with actual state',
        'Identify drifted resources',
        'Classify drift severity (critical, high, medium, low)',
        'Identify manual changes made outside IaC',
        'Check for deleted resources',
        'Check for modified configurations',
        'Generate drift report with details',
        'Recommend remediation actions'
      ],
      outputFormat: 'JSON with success, driftDetected, driftedResources (array), driftSummary, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'driftDetected', 'driftedResources', 'driftSummary', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        driftDetected: { type: 'boolean' },
        driftedResources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              resource: { type: 'string' },
              driftType: { type: 'string', enum: ['modified', 'deleted', 'added'] },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              changes: { type: 'array' },
              remediation: { type: 'string' }
            }
          }
        },
        driftSummary: {
          type: 'object',
          properties: {
            totalDrifted: { type: 'number' },
            modified: { type: 'number' },
            deleted: { type: 'number' },
            added: { type: 'number' }
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
  labels: ['iac-testing', 'drift-detection', 'state-management']
}));

export const testReportGenerationTask = defineTask('test-report-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Test Report: ${args.projectName}`,
  agent: {
    name: 'iac-test-reporter',
    prompt: {
      role: 'Test Lead specialized in comprehensive test reporting',
      task: 'Generate comprehensive IaC testing report with executive summary',
      context: args,
      instructions: [
        'Synthesize all test results from all phases',
        'Calculate overall quality score (0-100)',
        'Generate executive summary with key findings',
        'Create detailed test results breakdown',
        'Summarize security findings by severity',
        'Report compliance status',
        'Summarize policy violations',
        'Include cost analysis summary',
        'Provide actionable recommendations',
        'Generate pass/fail decision with rationale',
        'Create metrics and charts',
        'Format report in markdown and JSON'
      ],
      outputFormat: 'JSON with success, overallQualityScore, executiveSummary (markdown), detailedResults, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'overallQualityScore', 'executiveSummary', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        overallQualityScore: { type: 'number', minimum: 0, maximum: 100 },
        executiveSummary: { type: 'string' },
        detailedResults: { type: 'string' },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              priority: { type: 'string' },
              category: { type: 'string' },
              recommendation: { type: 'string' },
              effort: { type: 'string' }
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
  labels: ['iac-testing', 'reporting', 'final']
}));
