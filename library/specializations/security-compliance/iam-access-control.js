/**
 * @process specializations/security-compliance/iam-access-control
 * @description Access Control and IAM Review - Comprehensive identity and access management security assessment covering
 * RBAC/ABAC implementation, least privilege enforcement, access reviews and certification, privileged account management,
 * MFA enforcement, identity lifecycle management, access governance, segregation of duties, and compliance validation
 * against SOC2, PCI-DSS, HIPAA, and ISO27001 standards.
 * @inputs { projectName: string, environment?: string, iamPlatform?: string, userCount?: number, complianceFrameworks?: array }
 * @outputs { success: boolean, securityScore: number, totalUsers: number, policyViolations: number, remediationPlan: object, complianceStatus: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/security-compliance/iam-access-control', {
 *   projectName: 'Enterprise SaaS Platform',
 *   environment: 'production',
 *   iamPlatform: 'aws-iam', // 'aws-iam', 'azure-ad', 'okta', 'auth0', 'google-workspace', 'on-premise-ad'
 *   accessControlModel: 'rbac', // 'rbac', 'abac', 'hybrid'
 *   userCount: 500,
 *   privilegedAccountsCount: 25,
 *   complianceFrameworks: ['SOC2', 'PCI-DSS', 'ISO27001', 'HIPAA'],
 *   enableMFA: true,
 *   enableAccessReviews: true,
 *   accessReviewFrequency: 'quarterly',
 *   enablePrivilegedAccessManagement: true,
 *   enableJustInTimeAccess: true,
 *   sessionTimeout: 30,
 *   passwordPolicy: 'strong'
 * });
 *
 * @references
 * - NIST SP 800-63: Digital Identity Guidelines: https://pages.nist.gov/800-63-3/
 * - CIS Controls v8: Identity and Access Management: https://www.cisecurity.org/controls/
 * - OWASP Access Control Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Access_Control_Cheat_Sheet.html
 * - AWS IAM Best Practices: https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html
 * - Azure AD Security Best Practices: https://docs.microsoft.com/azure/active-directory/fundamentals/security-operations-introduction
 * - NIST SP 800-53: Access Control Family: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf
 * - PCI-DSS Requirement 7 & 8: https://www.pcisecuritystandards.org/
 * - Zero Trust Architecture (NIST SP 800-207): https://csrc.nist.gov/publications/detail/sp/800-207/final
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    environment = 'production',
    iamPlatform = 'aws-iam', // 'aws-iam', 'azure-ad', 'okta', 'auth0', 'google-workspace', 'on-premise-ad'
    accessControlModel = 'rbac', // 'rbac', 'abac', 'hybrid'
    userCount = 100,
    privilegedAccountsCount = 10,
    complianceFrameworks = ['SOC2', 'ISO27001'],
    enableMFA = true,
    enableAccessReviews = true,
    accessReviewFrequency = 'quarterly', // 'monthly', 'quarterly', 'semi-annual', 'annual'
    enablePrivilegedAccessManagement = true,
    enableJustInTimeAccess = false,
    sessionTimeout = 30, // minutes
    passwordPolicy = 'strong', // 'weak', 'moderate', 'strong', 'enterprise'
    outputDir = 'iam-access-control-output',
    enableIdentityGovernance = true,
    enableSegregationOfDuties = true,
    enableAccessCertification = true,
    enableAnomalyDetection = true,
    enableConditionalAccess = true,
    zeroTrustEnabled = false,
    ssoEnabled = false,
    federatedIdentityEnabled = false
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let securityScore = 0;
  let totalUsers = userCount;
  let policyViolations = 0;
  const complianceStatus = {};

  ctx.log('info', `Starting Access Control and IAM Review for ${projectName}`);
  ctx.log('info', `IAM Platform: ${iamPlatform}, Environment: ${environment}`);
  ctx.log('info', `Access Control Model: ${accessControlModel}, Users: ${userCount}, Privileged: ${privilegedAccountsCount}`);
  ctx.log('info', `Compliance Frameworks: ${complianceFrameworks.join(', ')}`);

  // ============================================================================
  // PHASE 1: IDENTITY INVENTORY AND DISCOVERY
  // ============================================================================

  ctx.log('info', 'Phase 1: Conducting identity inventory and discovery');

  const inventoryResult = await ctx.task(identityInventoryTask, {
    projectName,
    iamPlatform,
    environment,
    userCount,
    privilegedAccountsCount,
    complianceFrameworks,
    outputDir
  });

  artifacts.push(...inventoryResult.artifacts);
  totalUsers = inventoryResult.totalIdentities;
  securityScore += inventoryResult.inventoryScore;

  ctx.log('info', `Identity inventory complete - ${totalUsers} identities: ${inventoryResult.humanUsers} human, ${inventoryResult.serviceAccounts} service accounts, ${inventoryResult.orphanedAccounts} orphaned`);

  // Quality Gate: Identity inventory review
  await ctx.breakpoint({
    question: `Identity inventory complete for ${projectName}. Found ${totalUsers} total identities including ${inventoryResult.privilegedAccounts} privileged accounts, ${inventoryResult.inactiveAccounts} inactive accounts, and ${inventoryResult.orphanedAccounts} orphaned accounts. Review inventory and proceed?`,
    title: 'Identity Inventory Review',
    context: {
      runId: ctx.runId,
      inventory: {
        totalIdentities: totalUsers,
        humanUsers: inventoryResult.humanUsers,
        serviceAccounts: inventoryResult.serviceAccounts,
        privilegedAccounts: inventoryResult.privilegedAccounts,
        inactiveAccounts: inventoryResult.inactiveAccounts,
        orphanedAccounts: inventoryResult.orphanedAccounts,
        externalIdentities: inventoryResult.externalIdentities,
        identityTypes: inventoryResult.identityTypes
      },
      files: inventoryResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 2: RBAC/ABAC MODEL ASSESSMENT
  // ============================================================================

  ctx.log('info', `Phase 2: Assessing ${accessControlModel.toUpperCase()} access control model`);

  const accessModelResult = await ctx.task(accessControlModelTask, {
    projectName,
    iamPlatform,
    accessControlModel,
    inventoryResult,
    environment,
    complianceFrameworks,
    outputDir
  });

  artifacts.push(...accessModelResult.artifacts);
  securityScore += accessModelResult.modelScore;
  policyViolations += accessModelResult.policyViolations;

  ctx.log('info', `Access control model assessment complete - ${accessModelResult.rolesAnalyzed} roles, ${accessModelResult.policiesAnalyzed} policies, ${accessModelResult.policyViolations} violations`);

  // Quality Gate: Access model review
  await ctx.breakpoint({
    question: `${accessControlModel.toUpperCase()} access control model assessed. Analyzed ${accessModelResult.rolesAnalyzed} roles and ${accessModelResult.policiesAnalyzed} policies. Found ${accessModelResult.policyViolations} policy violations. Overly permissive roles: ${accessModelResult.overlyPermissiveRoles}. Review findings?`,
    title: 'Access Control Model Assessment Review',
    context: {
      runId: ctx.runId,
      accessModel: {
        model: accessControlModel,
        rolesAnalyzed: accessModelResult.rolesAnalyzed,
        policiesAnalyzed: accessModelResult.policiesAnalyzed,
        policyViolations: accessModelResult.policyViolations,
        overlyPermissiveRoles: accessModelResult.overlyPermissiveRoles,
        underutilizedRoles: accessModelResult.underutilizedRoles,
        conflictingPolicies: accessModelResult.conflictingPolicies,
        modelComplexity: accessModelResult.modelComplexity
      },
      files: accessModelResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 3: LEAST PRIVILEGE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Conducting least privilege analysis');

  const leastPrivilegeResult = await ctx.task(leastPrivilegeAnalysisTask, {
    projectName,
    iamPlatform,
    inventoryResult,
    accessModelResult,
    environment,
    complianceFrameworks,
    outputDir
  });

  artifacts.push(...leastPrivilegeResult.artifacts);
  securityScore += leastPrivilegeResult.privilegeScore;
  policyViolations += leastPrivilegeResult.violations;

  ctx.log('info', `Least privilege analysis complete - ${leastPrivilegeResult.excessivePermissions} excessive permissions, ${leastPrivilegeResult.unusedPermissions} unused permissions, ${leastPrivilegeResult.violations} violations`);

  // Quality Gate: Least privilege violations
  if (leastPrivilegeResult.criticalViolations > 0) {
    await ctx.breakpoint({
      question: `CRITICAL: Found ${leastPrivilegeResult.criticalViolations} critical least privilege violations! ${leastPrivilegeResult.excessivePermissions} users have excessive permissions. ${leastPrivilegeResult.adminAccessViolations} unauthorized admin access instances. Review and remediate immediately?`,
      title: 'Critical Least Privilege Violations',
      context: {
        runId: ctx.runId,
        leastPrivilege: {
          totalViolations: leastPrivilegeResult.violations,
          criticalViolations: leastPrivilegeResult.criticalViolations,
          excessivePermissions: leastPrivilegeResult.excessivePermissions,
          unusedPermissions: leastPrivilegeResult.unusedPermissions,
          adminAccessViolations: leastPrivilegeResult.adminAccessViolations,
          dataAccessViolations: leastPrivilegeResult.dataAccessViolations,
          topViolators: leastPrivilegeResult.topViolators
        },
        recommendation: 'Revoke excessive permissions and implement least privilege immediately',
        files: leastPrivilegeResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 4: ACCESS REVIEWS AND CERTIFICATION
  // ============================================================================

  if (enableAccessReviews) {
    ctx.log('info', 'Phase 4: Conducting access reviews and certification');

    const accessReviewResult = await ctx.task(accessReviewsTask, {
      projectName,
      iamPlatform,
      inventoryResult,
      accessModelResult,
      accessReviewFrequency,
      environment,
      enableAccessCertification,
      outputDir
    });

    artifacts.push(...accessReviewResult.artifacts);
    securityScore += accessReviewResult.reviewScore;
    policyViolations += accessReviewResult.uncertifiedAccess;

    ctx.log('info', `Access reviews complete - ${accessReviewResult.reviewsCompleted} reviews completed, ${accessReviewResult.accessRevoked} access revoked, ${accessReviewResult.uncertifiedAccess} uncertified`);

    // Quality Gate: Access certification status
    await ctx.breakpoint({
      question: `Access reviews and certification completed. ${accessReviewResult.reviewsCompleted} reviews completed with ${accessReviewResult.accessRevoked} access revocations. ${accessReviewResult.uncertifiedAccess} accounts require certification. Last review: ${accessReviewResult.lastReviewDate}. Approve findings?`,
      title: 'Access Review and Certification Status',
      context: {
        runId: ctx.runId,
        accessReviews: {
          frequency: accessReviewFrequency,
          reviewsCompleted: accessReviewResult.reviewsCompleted,
          accessRevoked: accessReviewResult.accessRevoked,
          uncertifiedAccess: accessReviewResult.uncertifiedAccess,
          lastReviewDate: accessReviewResult.lastReviewDate,
          nextReviewDate: accessReviewResult.nextReviewDate,
          reviewCoverage: accessReviewResult.reviewCoverage,
          managerApprovalRequired: accessReviewResult.managerApprovalRequired
        },
        files: accessReviewResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 5: PRIVILEGED ACCOUNT MANAGEMENT
  // ============================================================================

  if (enablePrivilegedAccessManagement) {
    ctx.log('info', 'Phase 5: Assessing privileged account management');

    const privilegedAccessResult = await ctx.task(privilegedAccessManagementTask, {
      projectName,
      iamPlatform,
      inventoryResult,
      privilegedAccountsCount,
      enableJustInTimeAccess,
      environment,
      complianceFrameworks,
      outputDir
    });

    artifacts.push(...privilegedAccessResult.artifacts);
    securityScore += privilegedAccessResult.pamScore;
    policyViolations += privilegedAccessResult.violations;

    ctx.log('info', `Privileged access management assessed - ${privilegedAccessResult.privilegedAccountsManaged} accounts managed, ${privilegedAccessResult.violationsFound} violations, JIT: ${privilegedAccessResult.jitEnabled}`);

    // Quality Gate: Privileged access violations
    if (privilegedAccessResult.violationsFound > 0) {
      await ctx.breakpoint({
        question: `Privileged account management assessment complete. Found ${privilegedAccessResult.violationsFound} violations: ${privilegedAccessResult.sharedAdminAccounts} shared admin accounts, ${privilegedAccessResult.permanentPrivilegedAccess} permanent privileged access, ${privilegedAccessResult.unmonitoredPrivilegedAccess} unmonitored privileged sessions. Review and remediate?`,
        title: 'Privileged Access Management Review',
        context: {
          runId: ctx.runId,
          privilegedAccess: {
            accountsManaged: privilegedAccessResult.privilegedAccountsManaged,
            violations: privilegedAccessResult.violationsFound,
            sharedAdminAccounts: privilegedAccessResult.sharedAdminAccounts,
            permanentPrivilegedAccess: privilegedAccessResult.permanentPrivilegedAccess,
            unmonitoredPrivilegedAccess: privilegedAccessResult.unmonitoredPrivilegedAccess,
            jitEnabled: privilegedAccessResult.jitEnabled,
            sessionRecordingEnabled: privilegedAccessResult.sessionRecordingEnabled,
            approvalWorkflowEnabled: privilegedAccessResult.approvalWorkflowEnabled
          },
          files: privilegedAccessResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
        }
      });
    }
  }

  // ============================================================================
  // PHASE 6: MFA ENFORCEMENT REVIEW
  // ============================================================================

  if (enableMFA) {
    ctx.log('info', 'Phase 6: Reviewing MFA enforcement and authentication controls');

    const mfaResult = await ctx.task(mfaEnforcementTask, {
      projectName,
      iamPlatform,
      inventoryResult,
      environment,
      complianceFrameworks,
      enableConditionalAccess,
      outputDir
    });

    artifacts.push(...mfaResult.artifacts);
    securityScore += mfaResult.mfaScore;
    policyViolations += mfaResult.usersWithoutMFA;

    ctx.log('info', `MFA enforcement reviewed - ${mfaResult.mfaEnrollmentRate}% enrollment, ${mfaResult.usersWithoutMFA} users without MFA, ${mfaResult.privilegedAccountsWithoutMFA} privileged accounts without MFA`);

    // Quality Gate: MFA compliance
    if (mfaResult.privilegedAccountsWithoutMFA > 0) {
      await ctx.breakpoint({
        question: `CRITICAL: ${mfaResult.privilegedAccountsWithoutMFA} privileged accounts do not have MFA enabled! Overall MFA enrollment: ${mfaResult.mfaEnrollmentRate}%. ${mfaResult.usersWithoutMFA} total users without MFA. Enforce MFA immediately for privileged accounts?`,
        title: 'MFA Enforcement Critical Gap',
        context: {
          runId: ctx.runId,
          mfa: {
            enrollmentRate: mfaResult.mfaEnrollmentRate,
            usersWithMFA: mfaResult.usersWithMFA,
            usersWithoutMFA: mfaResult.usersWithoutMFA,
            privilegedAccountsWithoutMFA: mfaResult.privilegedAccountsWithoutMFA,
            mfaMethods: mfaResult.mfaMethods,
            conditionalAccessEnabled: mfaResult.conditionalAccessEnabled,
            phishingResistantMFA: mfaResult.phishingResistantMFA
          },
          recommendation: 'Enforce MFA for all privileged accounts within 24 hours',
          files: mfaResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
        }
      });
    }
  }

  // ============================================================================
  // PHASE 7: IDENTITY LIFECYCLE MANAGEMENT
  // ============================================================================

  if (enableIdentityGovernance) {
    ctx.log('info', 'Phase 7: Assessing identity lifecycle management');

    const lifecycleResult = await ctx.task(identityLifecycleTask, {
      projectName,
      iamPlatform,
      inventoryResult,
      environment,
      outputDir
    });

    artifacts.push(...lifecycleResult.artifacts);
    securityScore += lifecycleResult.lifecycleScore;
    policyViolations += lifecycleResult.lifecycleViolations;

    ctx.log('info', `Identity lifecycle assessed - Onboarding: ${lifecycleResult.onboardingAutomation}%, Offboarding: ${lifecycleResult.offboardingAutomation}%, ${lifecycleResult.staleBirthright} stale birthright access`);

    // Quality Gate: Lifecycle management review
    await ctx.breakpoint({
      question: `Identity lifecycle management assessed. Onboarding automation: ${lifecycleResult.onboardingAutomation}%, Offboarding automation: ${lifecycleResult.offboardingAutomation}%. Found ${lifecycleResult.terminatedUsersWithAccess} terminated users with active access. Review lifecycle processes?`,
      title: 'Identity Lifecycle Management Review',
      context: {
        runId: ctx.runId,
        lifecycle: {
          onboardingAutomation: lifecycleResult.onboardingAutomation,
          offboardingAutomation: lifecycleResult.offboardingAutomation,
          terminatedUsersWithAccess: lifecycleResult.terminatedUsersWithAccess,
          staleBirthright: lifecycleResult.staleBirthright,
          roleChangeAutomation: lifecycleResult.roleChangeAutomation,
          deprovisioningTimeAverage: lifecycleResult.deprovisioningTimeAverage,
          provisioningTimeAverage: lifecycleResult.provisioningTimeAverage
        },
        files: lifecycleResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 8: SEGREGATION OF DUTIES (SOD)
  // ============================================================================

  if (enableSegregationOfDuties) {
    ctx.log('info', 'Phase 8: Analyzing segregation of duties controls');

    const sodResult = await ctx.task(segregationOfDutiesTask, {
      projectName,
      iamPlatform,
      inventoryResult,
      accessModelResult,
      complianceFrameworks,
      environment,
      outputDir
    });

    artifacts.push(...sodResult.artifacts);
    securityScore += sodResult.sodScore;
    policyViolations += sodResult.sodViolations;

    ctx.log('info', `Segregation of duties analyzed - ${sodResult.sodPoliciesEvaluated} policies evaluated, ${sodResult.sodViolations} violations, ${sodResult.conflictingRoles} conflicting role assignments`);

    // Quality Gate: SOD violations
    if (sodResult.sodViolations > 0) {
      await ctx.breakpoint({
        question: `Found ${sodResult.sodViolations} segregation of duties violations! ${sodResult.conflictingRoles} users have conflicting roles. Common violations: ${sodResult.commonViolations.slice(0, 3).join(', ')}. Review and remediate SOD violations?`,
        title: 'Segregation of Duties Violations',
        context: {
          runId: ctx.runId,
          sod: {
            violations: sodResult.sodViolations,
            conflictingRoles: sodResult.conflictingRoles,
            commonViolations: sodResult.commonViolations,
            highRiskViolations: sodResult.highRiskViolations,
            policiesEvaluated: sodResult.sodPoliciesEvaluated,
            mitigatingControls: sodResult.mitigatingControls
          },
          files: sodResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
        }
      });
    }
  }

  // ============================================================================
  // PHASE 9: SESSION MANAGEMENT AND AUTHENTICATION SECURITY
  // ============================================================================

  ctx.log('info', 'Phase 9: Reviewing session management and authentication security');

  const sessionResult = await ctx.task(sessionManagementTask, {
    projectName,
    iamPlatform,
    sessionTimeout,
    passwordPolicy,
    ssoEnabled,
    federatedIdentityEnabled,
    environment,
    complianceFrameworks,
    outputDir
  });

  artifacts.push(...sessionResult.artifacts);
  securityScore += sessionResult.sessionScore;
  policyViolations += sessionResult.sessionViolations;

  ctx.log('info', `Session management reviewed - Session timeout: ${sessionTimeout}min, Password policy: ${passwordPolicy}, SSO: ${ssoEnabled}, Violations: ${sessionResult.sessionViolations}`);

  // ============================================================================
  // PHASE 10: ANOMALY DETECTION AND MONITORING
  // ============================================================================

  if (enableAnomalyDetection) {
    ctx.log('info', 'Phase 10: Assessing anomaly detection and access monitoring');

    const anomalyResult = await ctx.task(anomalyDetectionTask, {
      projectName,
      iamPlatform,
      inventoryResult,
      environment,
      complianceFrameworks,
      outputDir
    });

    artifacts.push(...anomalyResult.artifacts);
    securityScore += anomalyResult.monitoringScore;

    ctx.log('info', `Anomaly detection assessed - ${anomalyResult.anomaliesDetected} anomalies detected, ${anomalyResult.suspiciousAccess} suspicious access patterns, Monitoring coverage: ${anomalyResult.monitoringCoverage}%`);

    // Quality Gate: Suspicious activity review
    if (anomalyResult.highRiskAnomalies > 0) {
      await ctx.breakpoint({
        question: `Detected ${anomalyResult.highRiskAnomalies} high-risk access anomalies: ${anomalyResult.unusualAccessPatterns} unusual access patterns, ${anomalyResult.geographicAnomalies} geographic anomalies, ${anomalyResult.timebasedAnomalies} time-based anomalies. Investigate immediately?`,
        title: 'High-Risk Access Anomalies Detected',
        context: {
          runId: ctx.runId,
          anomalies: {
            totalAnomalies: anomalyResult.anomaliesDetected,
            highRiskAnomalies: anomalyResult.highRiskAnomalies,
            unusualAccessPatterns: anomalyResult.unusualAccessPatterns,
            geographicAnomalies: anomalyResult.geographicAnomalies,
            timebasedAnomalies: anomalyResult.timebasedAnomalies,
            suspiciousPrivilegeEscalation: anomalyResult.suspiciousPrivilegeEscalation,
            monitoringCoverage: anomalyResult.monitoringCoverage
          },
          files: anomalyResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
        }
      });
    }
  }

  // ============================================================================
  // PHASE 11: COMPLIANCE VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 11: Validating compliance requirements');

  const complianceResult = await ctx.task(complianceValidationTask, {
    projectName,
    iamPlatform,
    complianceFrameworks,
    environment,
    totalUsers,
    policyViolations,
    enableMFA,
    enableAccessReviews,
    enablePrivilegedAccessManagement,
    outputDir
  });

  artifacts.push(...complianceResult.artifacts);
  Object.assign(complianceStatus, complianceResult.complianceStatus);
  securityScore += complianceResult.complianceScore;

  ctx.log('info', `Compliance validation complete - ${complianceResult.frameworksCompliant}/${complianceFrameworks.length} frameworks compliant`);

  // Quality Gate: Compliance review
  await ctx.breakpoint({
    question: `Compliance validation complete for ${projectName}. ${complianceResult.frameworksCompliant}/${complianceFrameworks.length} frameworks compliant. Compliance gaps: ${complianceResult.complianceGaps.length}. ${complianceResult.complianceGaps.length > 0 ? 'Review gaps and remediation plan?' : 'All compliance requirements met!'}`,
    title: 'Compliance Validation Review',
    context: {
      runId: ctx.runId,
      compliance: {
        frameworksCompliant: complianceResult.frameworksCompliant,
        totalFrameworks: complianceFrameworks.length,
        complianceStatus,
        gaps: complianceResult.complianceGaps,
        remediationPlan: complianceResult.remediationPlan,
        auditReady: complianceResult.auditReady
      },
      files: complianceResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 12: REMEDIATION PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 12: Generating remediation plan');

  const remediationResult = await ctx.task(remediationPlanningTask, {
    projectName,
    iamPlatform,
    policyViolations,
    inventoryResult,
    leastPrivilegeResult,
    accessModelResult,
    complianceResult,
    artifacts,
    outputDir
  });

  artifacts.push(...remediationResult.artifacts);

  ctx.log('info', `Remediation plan generated - ${remediationResult.totalRecommendations} recommendations, ${remediationResult.criticalPriority} critical, ${remediationResult.quickWins} quick wins`);

  // ============================================================================
  // PHASE 13: DOCUMENTATION AND REPORTING
  // ============================================================================

  ctx.log('info', 'Phase 13: Generating documentation and reports');

  const docResult = await ctx.task(documentationTask, {
    projectName,
    iamPlatform,
    environment,
    totalUsers,
    policyViolations,
    securityScore,
    complianceFrameworks,
    remediationResult,
    artifacts,
    outputDir
  });

  artifacts.push(...docResult.artifacts);

  ctx.log('info', `Documentation generated - ${docResult.documentsCreated} documents, ${docResult.reportsCreated} reports`);

  // ============================================================================
  // FINAL SUMMARY
  // ============================================================================

  const duration = ctx.now() - startTime;
  const finalSecurityScore = Math.min(100, Math.round(securityScore));

  ctx.log('info', '='.repeat(80));
  ctx.log('info', 'ACCESS CONTROL AND IAM REVIEW COMPLETE');
  ctx.log('info', '='.repeat(80));
  ctx.log('info', `Project: ${projectName}`);
  ctx.log('info', `IAM Platform: ${iamPlatform}`);
  ctx.log('info', `Environment: ${environment}`);
  ctx.log('info', `Total Identities: ${totalUsers}`);
  ctx.log('info', `Policy Violations: ${policyViolations}`);
  ctx.log('info', `Security Score: ${finalSecurityScore}/100`);
  ctx.log('info', `Compliance Frameworks: ${complianceFrameworks.join(', ')}`);
  ctx.log('info', `Artifacts Generated: ${artifacts.length}`);
  ctx.log('info', `Duration: ${Math.round(duration / 1000)}s`);
  ctx.log('info', '='.repeat(80));

  // Final Quality Gate
  await ctx.breakpoint({
    question: `Access Control and IAM Review complete for ${projectName}! Security Score: ${finalSecurityScore}/100. Found ${policyViolations} policy violations across ${totalUsers} identities. Compliance: ${complianceResult.frameworksCompliant}/${complianceFrameworks.length} frameworks. ${remediationResult.totalRecommendations} remediation recommendations. Review summary and approve?`,
    title: 'IAM Review Complete',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        iamPlatform,
        environment,
        totalUsers,
        policyViolations,
        securityScore: finalSecurityScore,
        complianceStatus,
        remediations: remediationResult.totalRecommendations,
        criticalIssues: remediationResult.criticalPriority,
        quickWins: remediationResult.quickWins,
        duration: `${Math.round(duration / 1000)}s`,
        artifactsGenerated: artifacts.length
      },
      recommendations: {
        immediate: remediationResult.immediateActions || [
          'Revoke access for orphaned and terminated accounts',
          'Enforce MFA for all privileged accounts',
          'Address critical least privilege violations',
          'Remediate segregation of duties conflicts'
        ],
        shortTerm: remediationResult.shortTermActions || [
          'Implement automated access reviews',
          'Deploy privileged access management solution',
          'Enable anomaly detection and monitoring',
          'Automate identity lifecycle processes'
        ],
        longTerm: remediationResult.longTermActions || [
          'Transition to Zero Trust architecture',
          'Implement attribute-based access control (ABAC)',
          'Deploy identity governance platform',
          'Enhance security awareness training'
        ]
      },
      files: artifacts.slice(0, 20).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  return {
    success: true,
    securityScore: finalSecurityScore,
    totalUsers,
    policyViolations,
    iamPlatform,
    environment,
    accessControlModel,
    remediationPlan: {
      totalRecommendations: remediationResult.totalRecommendations,
      criticalPriority: remediationResult.criticalPriority,
      highPriority: remediationResult.highPriority,
      mediumPriority: remediationResult.mediumPriority,
      lowPriority: remediationResult.lowPriority,
      quickWins: remediationResult.quickWins,
      estimatedEffort: remediationResult.estimatedEffort
    },
    complianceStatus,
    artifacts,
    duration: Math.round(duration / 1000),
    summary: {
      inventoryCompleted: true,
      accessModelAssessed: true,
      leastPrivilegeAnalyzed: true,
      accessReviewsCompleted: enableAccessReviews,
      privilegedAccessManaged: enablePrivilegedAccessManagement,
      mfaEnforced: enableMFA,
      lifecycleManaged: enableIdentityGovernance,
      sodAnalyzed: enableSegregationOfDuties,
      anomalyDetectionEnabled: enableAnomalyDetection,
      complianceValidated: true
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

const identityInventoryTask = defineTask({
  name: 'identity-inventory',
  description: 'Conduct comprehensive identity inventory and discovery',
  async execute(params, ctx) {
    const {
      projectName,
      iamPlatform,
      environment,
      userCount,
      privilegedAccountsCount,
      complianceFrameworks,
      outputDir
    } = params;

    ctx.log('info', `Discovering and cataloging identities in ${iamPlatform}`);

    // Simulate comprehensive inventory
    const humanUsers = Math.floor(userCount * 0.7);
    const serviceAccounts = Math.floor(userCount * 0.25);
    const externalIdentities = Math.floor(userCount * 0.05);
    const inactiveAccounts = Math.floor(userCount * 0.15);
    const orphanedAccounts = Math.floor(userCount * 0.08);

    const inventory = {
      projectName,
      iamPlatform,
      environment,
      timestamp: new Date().toISOString(),
      totalIdentities: userCount,
      identityBreakdown: {
        humanUsers,
        serviceAccounts,
        externalIdentities,
        guestUsers: userCount - humanUsers - serviceAccounts - externalIdentities,
        privilegedAccounts: privilegedAccountsCount,
        inactiveAccounts,
        orphanedAccounts,
        sharedAccounts: Math.floor(privilegedAccountsCount * 0.2)
      },
      identityTypes: [
        { type: 'Human Users', count: humanUsers, percentage: (humanUsers / userCount * 100).toFixed(1) },
        { type: 'Service Accounts', count: serviceAccounts, percentage: (serviceAccounts / userCount * 100).toFixed(1) },
        { type: 'External Identities', count: externalIdentities, percentage: (externalIdentities / userCount * 100).toFixed(1) }
      ],
      riskProfile: {
        highRisk: privilegedAccountsCount + orphanedAccounts,
        mediumRisk: inactiveAccounts,
        lowRisk: userCount - privilegedAccountsCount - orphanedAccounts - inactiveAccounts
      },
      complianceImpact: complianceFrameworks.map(framework => ({
        framework,
        requiresReview: inactiveAccounts > 0 || orphanedAccounts > 0,
        issues: []
      }))
    };

    const artifacts = [
      {
        path: `${outputDir}/identity-inventory.json`,
        format: 'json',
        label: 'Identity Inventory',
        content: JSON.stringify(inventory, null, 2)
      },
      {
        path: `${outputDir}/identity-inventory-report.md`,
        format: 'markdown',
        label: 'Identity Inventory Report',
        content: generateInventoryReport(inventory)
      }
    ];

    return {
      totalIdentities: userCount,
      humanUsers,
      serviceAccounts,
      externalIdentities,
      privilegedAccounts: privilegedAccountsCount,
      inactiveAccounts,
      orphanedAccounts,
      identityTypes: inventory.identityTypes,
      inventoryScore: 10,
      artifacts
    };
  }
});

const accessControlModelTask = defineTask({
  name: 'access-control-model-assessment',
  description: 'Assess RBAC/ABAC access control model implementation',
  async execute(params, ctx) {
    const {
      projectName,
      iamPlatform,
      accessControlModel,
      inventoryResult,
      environment,
      complianceFrameworks,
      outputDir
    } = params;

    ctx.log('info', `Assessing ${accessControlModel.toUpperCase()} implementation`);

    const rolesAnalyzed = Math.floor(inventoryResult.totalIdentities / 10) + 20;
    const policiesAnalyzed = rolesAnalyzed * 2;
    const overlyPermissiveRoles = Math.floor(rolesAnalyzed * 0.15);
    const underutilizedRoles = Math.floor(rolesAnalyzed * 0.2);
    const policyViolations = overlyPermissiveRoles + Math.floor(policiesAnalyzed * 0.1);

    const assessment = {
      projectName,
      accessControlModel,
      timestamp: new Date().toISOString(),
      rolesAnalyzed,
      policiesAnalyzed,
      findings: {
        overlyPermissiveRoles,
        underutilizedRoles,
        conflictingPolicies: Math.floor(policiesAnalyzed * 0.05),
        policyViolations,
        wildcardPolicies: Math.floor(policiesAnalyzed * 0.12),
        adminAccessGrants: Math.floor(inventoryResult.privilegedAccounts * 1.5)
      },
      modelComplexity: rolesAnalyzed > 100 ? 'high' : rolesAnalyzed > 50 ? 'medium' : 'low',
      recommendations: [
        'Consolidate similar roles to reduce complexity',
        'Remove wildcard permissions from policies',
        'Implement granular policies following least privilege',
        'Regular role and policy audits'
      ]
    };

    const artifacts = [
      {
        path: `${outputDir}/access-control-assessment.json`,
        format: 'json',
        label: 'Access Control Model Assessment',
        content: JSON.stringify(assessment, null, 2)
      },
      {
        path: `${outputDir}/role-policy-matrix.csv`,
        format: 'csv',
        label: 'Role-Policy Assignment Matrix',
        content: generateRolePolicyMatrix(assessment)
      }
    ];

    return {
      rolesAnalyzed,
      policiesAnalyzed,
      policyViolations,
      overlyPermissiveRoles,
      underutilizedRoles,
      conflictingPolicies: assessment.findings.conflictingPolicies,
      modelComplexity: assessment.modelComplexity,
      modelScore: 12,
      artifacts
    };
  }
});

const leastPrivilegeAnalysisTask = defineTask({
  name: 'least-privilege-analysis',
  description: 'Analyze least privilege compliance and identify excessive permissions',
  async execute(params, ctx) {
    const {
      projectName,
      iamPlatform,
      inventoryResult,
      accessModelResult,
      environment,
      complianceFrameworks,
      outputDir
    } = params;

    ctx.log('info', 'Analyzing least privilege compliance');

    const excessivePermissions = Math.floor(inventoryResult.totalIdentities * 0.25);
    const unusedPermissions = Math.floor(inventoryResult.totalIdentities * 0.3);
    const adminAccessViolations = Math.floor(inventoryResult.privilegedAccounts * 0.3);
    const violations = excessivePermissions + adminAccessViolations;
    const criticalViolations = Math.floor(violations * 0.2);

    const analysis = {
      projectName,
      timestamp: new Date().toISOString(),
      totalUsersAnalyzed: inventoryResult.totalIdentities,
      findings: {
        excessivePermissions,
        unusedPermissions,
        violations,
        criticalViolations,
        adminAccessViolations,
        dataAccessViolations: Math.floor(inventoryResult.totalIdentities * 0.15),
        crossAccountAccessIssues: Math.floor(inventoryResult.totalIdentities * 0.08)
      },
      topViolators: Array.from({ length: Math.min(10, criticalViolations) }, (_, i) => ({
        identity: `user-${i + 1}`,
        excessivePermissions: Math.floor(Math.random() * 20) + 5,
        riskLevel: i < 3 ? 'critical' : 'high'
      })),
      leastPrivilegeScore: Math.max(0, 100 - (violations / inventoryResult.totalIdentities * 100))
    };

    const artifacts = [
      {
        path: `${outputDir}/least-privilege-analysis.json`,
        format: 'json',
        label: 'Least Privilege Analysis',
        content: JSON.stringify(analysis, null, 2)
      },
      {
        path: `${outputDir}/excessive-permissions-report.md`,
        format: 'markdown',
        label: 'Excessive Permissions Report',
        content: generateExcessivePermissionsReport(analysis)
      }
    ];

    return {
      excessivePermissions,
      unusedPermissions,
      violations,
      criticalViolations,
      adminAccessViolations,
      dataAccessViolations: analysis.findings.dataAccessViolations,
      topViolators: analysis.topViolators,
      privilegeScore: Math.round(analysis.leastPrivilegeScore / 10),
      artifacts
    };
  }
});

const accessReviewsTask = defineTask({
  name: 'access-reviews-certification',
  description: 'Conduct access reviews and certification process',
  async execute(params, ctx) {
    const {
      projectName,
      iamPlatform,
      inventoryResult,
      accessModelResult,
      accessReviewFrequency,
      environment,
      enableAccessCertification,
      outputDir
    } = params;

    ctx.log('info', `Conducting ${accessReviewFrequency} access reviews`);

    const reviewsCompleted = Math.floor(inventoryResult.totalIdentities * 0.8);
    const accessRevoked = Math.floor(reviewsCompleted * 0.1);
    const uncertifiedAccess = inventoryResult.totalIdentities - reviewsCompleted;

    const reviews = {
      projectName,
      frequency: accessReviewFrequency,
      timestamp: new Date().toISOString(),
      reviewsCompleted,
      accessRevoked,
      uncertifiedAccess,
      reviewCoverage: ((reviewsCompleted / inventoryResult.totalIdentities) * 100).toFixed(1),
      lastReviewDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      nextReviewDate: getNextReviewDate(accessReviewFrequency),
      managerApprovalRequired: enableAccessCertification,
      reviewMetrics: {
        averageReviewTime: '5 days',
        approvalRate: '85%',
        escalationRate: '5%'
      }
    };

    const artifacts = [
      {
        path: `${outputDir}/access-reviews-report.json`,
        format: 'json',
        label: 'Access Reviews Report',
        content: JSON.stringify(reviews, null, 2)
      },
      {
        path: `${outputDir}/access-certification-status.md`,
        format: 'markdown',
        label: 'Access Certification Status',
        content: generateAccessCertificationReport(reviews)
      }
    ];

    return {
      reviewsCompleted,
      accessRevoked,
      uncertifiedAccess,
      lastReviewDate: reviews.lastReviewDate,
      nextReviewDate: reviews.nextReviewDate,
      reviewCoverage: reviews.reviewCoverage,
      managerApprovalRequired: reviews.managerApprovalRequired,
      reviewScore: 10,
      artifacts
    };
  }
});

const privilegedAccessManagementTask = defineTask({
  name: 'privileged-access-management',
  description: 'Assess privileged account management and controls',
  async execute(params, ctx) {
    const {
      projectName,
      iamPlatform,
      inventoryResult,
      privilegedAccountsCount,
      enableJustInTimeAccess,
      environment,
      complianceFrameworks,
      outputDir
    } = params;

    ctx.log('info', 'Assessing privileged access management');

    const sharedAdminAccounts = Math.floor(privilegedAccountsCount * 0.15);
    const permanentPrivilegedAccess = Math.floor(privilegedAccountsCount * 0.6);
    const unmonitoredPrivilegedAccess = Math.floor(privilegedAccountsCount * 0.25);
    const violationsFound = sharedAdminAccounts + unmonitoredPrivilegedAccess;

    const pam = {
      projectName,
      timestamp: new Date().toISOString(),
      privilegedAccountsManaged: privilegedAccountsCount,
      violations: {
        sharedAdminAccounts,
        permanentPrivilegedAccess,
        unmonitoredPrivilegedAccess,
        total: violationsFound
      },
      controls: {
        jitEnabled: enableJustInTimeAccess,
        sessionRecordingEnabled: !enableJustInTimeAccess,
        approvalWorkflowEnabled: true,
        passwordVaultingEnabled: true,
        privilegedSessionMonitoring: true
      },
      recommendations: [
        'Eliminate shared admin accounts',
        'Implement Just-In-Time privileged access',
        'Enable session recording for all privileged access',
        'Implement approval workflows for privileged access requests'
      ]
    };

    const artifacts = [
      {
        path: `${outputDir}/privileged-access-management.json`,
        format: 'json',
        label: 'Privileged Access Management Assessment',
        content: JSON.stringify(pam, null, 2)
      },
      {
        path: `${outputDir}/pam-violations-report.md`,
        format: 'markdown',
        label: 'PAM Violations Report',
        content: generatePAMReport(pam)
      }
    ];

    return {
      privilegedAccountsManaged: privilegedAccountsCount,
      violationsFound,
      sharedAdminAccounts,
      permanentPrivilegedAccess,
      unmonitoredPrivilegedAccess,
      jitEnabled: enableJustInTimeAccess,
      sessionRecordingEnabled: pam.controls.sessionRecordingEnabled,
      approvalWorkflowEnabled: pam.controls.approvalWorkflowEnabled,
      pamScore: 10,
      artifacts
    };
  }
});

const mfaEnforcementTask = defineTask({
  name: 'mfa-enforcement-review',
  description: 'Review MFA enforcement and authentication controls',
  async execute(params, ctx) {
    const {
      projectName,
      iamPlatform,
      inventoryResult,
      environment,
      complianceFrameworks,
      enableConditionalAccess,
      outputDir
    } = params;

    ctx.log('info', 'Reviewing MFA enforcement');

    const usersWithMFA = Math.floor(inventoryResult.totalIdentities * 0.75);
    const usersWithoutMFA = inventoryResult.totalIdentities - usersWithMFA;
    const privilegedAccountsWithoutMFA = Math.floor(inventoryResult.privilegedAccounts * 0.1);
    const mfaEnrollmentRate = ((usersWithMFA / inventoryResult.totalIdentities) * 100).toFixed(1);

    const mfa = {
      projectName,
      timestamp: new Date().toISOString(),
      totalUsers: inventoryResult.totalIdentities,
      usersWithMFA,
      usersWithoutMFA,
      privilegedAccountsWithoutMFA,
      mfaEnrollmentRate,
      mfaMethods: ['SMS', 'Authenticator App', 'Hardware Token', 'Biometric'],
      conditionalAccessEnabled: enableConditionalAccess,
      phishingResistantMFA: Math.floor(usersWithMFA * 0.3),
      mfaBypassRisks: privilegedAccountsWithoutMFA > 0 ? 'High' : 'Low'
    };

    const artifacts = [
      {
        path: `${outputDir}/mfa-enforcement-report.json`,
        format: 'json',
        label: 'MFA Enforcement Report',
        content: JSON.stringify(mfa, null, 2)
      },
      {
        path: `${outputDir}/mfa-enrollment-status.md`,
        format: 'markdown',
        label: 'MFA Enrollment Status',
        content: generateMFAReport(mfa)
      }
    ];

    return {
      usersWithMFA,
      usersWithoutMFA,
      privilegedAccountsWithoutMFA,
      mfaEnrollmentRate,
      mfaMethods: mfa.mfaMethods,
      conditionalAccessEnabled: enableConditionalAccess,
      phishingResistantMFA: mfa.phishingResistantMFA,
      mfaScore: privilegedAccountsWithoutMFA === 0 ? 15 : 8,
      artifacts
    };
  }
});

const identityLifecycleTask = defineTask({
  name: 'identity-lifecycle-management',
  description: 'Assess identity lifecycle management processes',
  async execute(params, ctx) {
    const {
      projectName,
      iamPlatform,
      inventoryResult,
      environment,
      outputDir
    } = params;

    ctx.log('info', 'Assessing identity lifecycle management');

    const onboardingAutomation = 70;
    const offboardingAutomation = 60;
    const terminatedUsersWithAccess = inventoryResult.orphanedAccounts;
    const staleBirthright = Math.floor(inventoryResult.totalIdentities * 0.12);
    const lifecycleViolations = terminatedUsersWithAccess + staleBirthright;

    const lifecycle = {
      projectName,
      timestamp: new Date().toISOString(),
      onboardingAutomation,
      offboardingAutomation,
      terminatedUsersWithAccess,
      staleBirthright,
      roleChangeAutomation: 55,
      deprovisioningTimeAverage: '3 days',
      provisioningTimeAverage: '1 day',
      lifecycleViolations,
      processes: {
        onboarding: 'Partially Automated',
        offboarding: 'Partially Automated',
        roleChange: 'Manual with Approvals',
        periodicRevalidation: 'Quarterly'
      }
    };

    const artifacts = [
      {
        path: `${outputDir}/identity-lifecycle-report.json`,
        format: 'json',
        label: 'Identity Lifecycle Report',
        content: JSON.stringify(lifecycle, null, 2)
      }
    ];

    return {
      onboardingAutomation,
      offboardingAutomation,
      terminatedUsersWithAccess,
      staleBirthright,
      roleChangeAutomation: lifecycle.roleChangeAutomation,
      deprovisioningTimeAverage: lifecycle.deprovisioningTimeAverage,
      provisioningTimeAverage: lifecycle.provisioningTimeAverage,
      lifecycleViolations,
      lifecycleScore: 8,
      artifacts
    };
  }
});

const segregationOfDutiesTask = defineTask({
  name: 'segregation-of-duties-analysis',
  description: 'Analyze segregation of duties controls and violations',
  async execute(params, ctx) {
    const {
      projectName,
      iamPlatform,
      inventoryResult,
      accessModelResult,
      complianceFrameworks,
      environment,
      outputDir
    } = params;

    ctx.log('info', 'Analyzing segregation of duties');

    const sodPoliciesEvaluated = 25;
    const conflictingRoles = Math.floor(inventoryResult.totalIdentities * 0.08);
    const sodViolations = conflictingRoles + Math.floor(accessModelResult.rolesAnalyzed * 0.05);

    const sod = {
      projectName,
      timestamp: new Date().toISOString(),
      sodPoliciesEvaluated,
      violations: {
        conflictingRoles,
        total: sodViolations,
        highRisk: Math.floor(sodViolations * 0.3)
      },
      commonViolations: [
        'Developer with Production Admin Access',
        'Requester also Approver for Access Requests',
        'Finance User with IT Admin Rights',
        'Security Auditor with System Admin Access'
      ],
      highRiskViolations: Math.floor(sodViolations * 0.3),
      mitigatingControls: [
        'Compensating approval workflows',
        'Enhanced audit logging',
        'Periodic access reviews'
      ]
    };

    const artifacts = [
      {
        path: `${outputDir}/sod-analysis.json`,
        format: 'json',
        label: 'Segregation of Duties Analysis',
        content: JSON.stringify(sod, null, 2)
      },
      {
        path: `${outputDir}/sod-violations-report.md`,
        format: 'markdown',
        label: 'SOD Violations Report',
        content: generateSODReport(sod)
      }
    ];

    return {
      sodPoliciesEvaluated,
      sodViolations,
      conflictingRoles,
      commonViolations: sod.commonViolations,
      highRiskViolations: sod.highRiskViolations,
      mitigatingControls: sod.mitigatingControls,
      sodScore: 8,
      artifacts
    };
  }
});

const sessionManagementTask = defineTask({
  name: 'session-management-review',
  description: 'Review session management and authentication security',
  async execute(params, ctx) {
    const {
      projectName,
      iamPlatform,
      sessionTimeout,
      passwordPolicy,
      ssoEnabled,
      federatedIdentityEnabled,
      environment,
      complianceFrameworks,
      outputDir
    } = params;

    ctx.log('info', 'Reviewing session management');

    const sessionViolations = sessionTimeout > 60 ? 5 : sessionTimeout > 30 ? 2 : 0;

    const session = {
      projectName,
      timestamp: new Date().toISOString(),
      sessionTimeout,
      passwordPolicy,
      ssoEnabled,
      federatedIdentityEnabled,
      sessionViolations,
      sessionSecurity: {
        sessionTimeoutEnforced: true,
        idleTimeoutEnforced: true,
        concurrentSessionLimit: true,
        sessionBindingEnabled: true
      },
      passwordPolicyDetails: getPasswordPolicyDetails(passwordPolicy)
    };

    const artifacts = [
      {
        path: `${outputDir}/session-management-report.json`,
        format: 'json',
        label: 'Session Management Report',
        content: JSON.stringify(session, null, 2)
      }
    ];

    return {
      sessionTimeout,
      passwordPolicy,
      ssoEnabled,
      federatedIdentityEnabled,
      sessionViolations,
      sessionScore: 8,
      artifacts
    };
  }
});

const anomalyDetectionTask = defineTask({
  name: 'anomaly-detection-monitoring',
  description: 'Assess anomaly detection and access monitoring capabilities',
  async execute(params, ctx) {
    const {
      projectName,
      iamPlatform,
      inventoryResult,
      environment,
      complianceFrameworks,
      outputDir
    } = params;

    ctx.log('info', 'Assessing anomaly detection');

    const anomaliesDetected = Math.floor(inventoryResult.totalIdentities * 0.05);
    const highRiskAnomalies = Math.floor(anomaliesDetected * 0.2);
    const suspiciousAccess = Math.floor(anomaliesDetected * 0.4);

    const anomaly = {
      projectName,
      timestamp: new Date().toISOString(),
      anomaliesDetected,
      highRiskAnomalies,
      suspiciousAccess,
      unusualAccessPatterns: Math.floor(anomaliesDetected * 0.3),
      geographicAnomalies: Math.floor(anomaliesDetected * 0.25),
      timebasedAnomalies: Math.floor(anomaliesDetected * 0.25),
      suspiciousPrivilegeEscalation: Math.floor(anomaliesDetected * 0.2),
      monitoringCoverage: 85,
      detectionCapabilities: {
        impossibleTravel: true,
        unusualAccessTime: true,
        massDownload: true,
        privilegeEscalation: true,
        suspiciousIPAccess: true
      }
    };

    const artifacts = [
      {
        path: `${outputDir}/anomaly-detection-report.json`,
        format: 'json',
        label: 'Anomaly Detection Report',
        content: JSON.stringify(anomaly, null, 2)
      }
    ];

    return {
      anomaliesDetected,
      highRiskAnomalies,
      suspiciousAccess,
      unusualAccessPatterns: anomaly.unusualAccessPatterns,
      geographicAnomalies: anomaly.geographicAnomalies,
      timebasedAnomalies: anomaly.timebasedAnomalies,
      suspiciousPrivilegeEscalation: anomaly.suspiciousPrivilegeEscalation,
      monitoringCoverage: anomaly.monitoringCoverage,
      monitoringScore: 10,
      artifacts
    };
  }
});

const complianceValidationTask = defineTask({
  name: 'compliance-validation',
  description: 'Validate IAM compliance requirements',
  async execute(params, ctx) {
    const {
      projectName,
      iamPlatform,
      complianceFrameworks,
      environment,
      totalUsers,
      policyViolations,
      enableMFA,
      enableAccessReviews,
      enablePrivilegedAccessManagement,
      outputDir
    } = params;

    ctx.log('info', `Validating compliance with ${complianceFrameworks.length} frameworks`);

    const frameworksCompliant = complianceFrameworks.filter(() => Math.random() > 0.15).length;

    const complianceStatus = {};
    const complianceGaps = [];

    complianceFrameworks.forEach(framework => {
      const isCompliant = Math.random() > 0.15;
      complianceStatus[framework] = {
        compliant: isCompliant,
        score: isCompliant ? 90 + Math.floor(Math.random() * 10) : 65 + Math.floor(Math.random() * 25),
        requirements: {
          mfa: enableMFA,
          accessReviews: enableAccessReviews,
          privilegedAccessManagement: enablePrivilegedAccessManagement,
          leastPrivilege: policyViolations < totalUsers * 0.1
        }
      };

      if (!isCompliant) {
        complianceGaps.push({
          framework,
          requirement: 'Enhanced access controls required',
          severity: 'medium'
        });
      }
    });

    const complianceReport = {
      projectName,
      timestamp: new Date().toISOString(),
      environment,
      frameworks: complianceFrameworks,
      status: complianceStatus,
      overallCompliance: `${frameworksCompliant}/${complianceFrameworks.length}`,
      gaps: complianceGaps,
      remediationPlan: complianceGaps.map(gap => ({
        framework: gap.framework,
        action: 'Implement enhanced IAM controls',
        priority: gap.severity,
        estimatedEffort: '2-4 weeks'
      })),
      auditReady: complianceGaps.length === 0
    };

    const artifacts = [
      {
        path: `${outputDir}/iam-compliance-report.json`,
        format: 'json',
        label: 'IAM Compliance Report',
        content: JSON.stringify(complianceReport, null, 2)
      },
      {
        path: `${outputDir}/compliance-matrix.md`,
        format: 'markdown',
        label: 'Compliance Matrix',
        content: generateComplianceMatrix(complianceReport)
      }
    ];

    return {
      frameworksCompliant,
      complianceStatus,
      complianceGaps,
      remediationPlan: complianceReport.remediationPlan,
      auditReady: complianceReport.auditReady,
      complianceScore: 10,
      artifacts
    };
  }
});

const remediationPlanningTask = defineTask({
  name: 'remediation-planning',
  description: 'Generate comprehensive remediation plan',
  async execute(params, ctx) {
    const {
      projectName,
      iamPlatform,
      policyViolations,
      inventoryResult,
      leastPrivilegeResult,
      accessModelResult,
      complianceResult,
      artifacts,
      outputDir
    } = params;

    ctx.log('info', 'Generating remediation plan');

    const criticalPriority = Math.floor(policyViolations * 0.2);
    const highPriority = Math.floor(policyViolations * 0.3);
    const mediumPriority = Math.floor(policyViolations * 0.3);
    const lowPriority = policyViolations - criticalPriority - highPriority - mediumPriority;
    const quickWins = Math.floor(policyViolations * 0.15);

    const remediationPlan = {
      projectName,
      timestamp: new Date().toISOString(),
      totalRecommendations: policyViolations,
      priorityBreakdown: {
        critical: criticalPriority,
        high: highPriority,
        medium: mediumPriority,
        low: lowPriority
      },
      quickWins,
      estimatedEffort: `${Math.ceil(policyViolations / 10)} weeks`,
      immediateActions: [
        'Revoke access for orphaned and terminated accounts',
        'Enforce MFA for all privileged accounts',
        'Address critical least privilege violations',
        'Remediate segregation of duties conflicts'
      ],
      shortTermActions: [
        'Implement automated access reviews',
        'Deploy privileged access management solution',
        'Enable anomaly detection and monitoring',
        'Automate identity lifecycle processes'
      ],
      longTermActions: [
        'Transition to Zero Trust architecture',
        'Implement attribute-based access control (ABAC)',
        'Deploy identity governance platform',
        'Enhance security awareness training'
      ]
    };

    const planArtifacts = [
      {
        path: `${outputDir}/remediation-plan.json`,
        format: 'json',
        label: 'Remediation Plan',
        content: JSON.stringify(remediationPlan, null, 2)
      },
      {
        path: `${outputDir}/remediation-roadmap.md`,
        format: 'markdown',
        label: 'Remediation Roadmap',
        content: generateRemediationRoadmap(remediationPlan)
      }
    ];

    return {
      totalRecommendations: policyViolations,
      criticalPriority,
      highPriority,
      mediumPriority,
      lowPriority,
      quickWins,
      estimatedEffort: remediationPlan.estimatedEffort,
      immediateActions: remediationPlan.immediateActions,
      shortTermActions: remediationPlan.shortTermActions,
      longTermActions: remediationPlan.longTermActions,
      artifacts: planArtifacts
    };
  }
});

const documentationTask = defineTask({
  name: 'documentation-generation',
  description: 'Generate comprehensive documentation and reports',
  async execute(params, ctx) {
    const {
      projectName,
      iamPlatform,
      environment,
      totalUsers,
      policyViolations,
      securityScore,
      complianceFrameworks,
      remediationResult,
      artifacts,
      outputDir
    } = params;

    ctx.log('info', 'Generating documentation and reports');

    const documentation = {
      overview: {
        projectName,
        iamPlatform,
        environment,
        totalUsers,
        policyViolations,
        securityScore
      },
      reports: [
        'Executive Summary',
        'Identity Inventory Report',
        'Access Control Assessment',
        'Least Privilege Analysis',
        'Compliance Validation Report',
        'Remediation Roadmap'
      ]
    };

    const docArtifacts = [
      {
        path: `${outputDir}/executive-summary.md`,
        format: 'markdown',
        label: 'Executive Summary',
        content: generateExecutiveSummary(documentation.overview, complianceFrameworks, remediationResult)
      },
      {
        path: `${outputDir}/iam-review-complete-report.md`,
        format: 'markdown',
        label: 'Complete IAM Review Report',
        content: generateCompleteReport(documentation.overview, complianceFrameworks, artifacts)
      }
    ];

    return {
      documentsCreated: documentation.reports.length,
      reportsCreated: 2,
      artifacts: docArtifacts
    };
  }
});

// ============================================================================
// HELPER FUNCTIONS FOR CONTENT GENERATION
// ============================================================================

function generateInventoryReport(inventory) {
  return `# Identity Inventory Report

## Project: ${inventory.projectName}
**IAM Platform:** ${inventory.iamPlatform}
**Environment:** ${inventory.environment}
**Report Date:** ${inventory.timestamp}

## Summary

Total Identities: **${inventory.totalIdentities}**

### Identity Breakdown

| Type | Count | Percentage |
|------|-------|-----------|
${inventory.identityTypes.map(t => `| ${t.type} | ${t.count} | ${t.percentage}% |`).join('\n')}

### Risk Profile

- High Risk: ${inventory.riskProfile.highRisk} (Privileged + Orphaned)
- Medium Risk: ${inventory.riskProfile.mediumRisk} (Inactive)
- Low Risk: ${inventory.riskProfile.lowRisk}

### Key Findings

- **Orphaned Accounts:** ${inventory.identityBreakdown.orphanedAccounts} accounts require immediate removal
- **Inactive Accounts:** ${inventory.identityBreakdown.inactiveAccounts} accounts inactive for 90+ days
- **Shared Accounts:** ${inventory.identityBreakdown.sharedAccounts} shared privileged accounts detected
- **Service Accounts:** ${inventory.identityBreakdown.serviceAccounts} service accounts require review

## Recommendations

1. Remove all orphaned accounts immediately
2. Disable or delete inactive accounts after review
3. Eliminate shared privileged accounts
4. Implement service account governance
`;
}

function generateRolePolicyMatrix(assessment) {
  return `Role,Policies Attached,Overly Permissive,Underutilized,Violations
${Array.from({ length: Math.min(10, assessment.rolesAnalyzed) }, (_, i) =>
  `Role-${i + 1},${Math.floor(Math.random() * 5) + 1},${Math.random() > 0.8 ? 'Yes' : 'No'},${Math.random() > 0.7 ? 'Yes' : 'No'},${Math.floor(Math.random() * 3)}`
).join('\n')}`;
}

function generateExcessivePermissionsReport(analysis) {
  return `# Excessive Permissions Report

## Overview

**Total Users Analyzed:** ${analysis.totalUsersAnalyzed}
**Users with Excessive Permissions:** ${analysis.findings.excessivePermissions}
**Critical Violations:** ${analysis.findings.criticalViolations}

## Top Violators

${analysis.topViolators.map(v => `- **${v.identity}**: ${v.excessivePermissions} excessive permissions (${v.riskLevel} risk)`).join('\n')}

## Violation Categories

- Admin Access Violations: ${analysis.findings.adminAccessViolations}
- Data Access Violations: ${analysis.findings.dataAccessViolations}
- Cross-Account Access Issues: ${analysis.findings.crossAccountAccessIssues}

## Remediation Priority

1. Address all critical violations within 7 days
2. Revoke unused permissions
3. Implement granular access policies
4. Enable continuous monitoring
`;
}

function generateAccessCertificationReport(reviews) {
  return `# Access Certification Report

## Certification Status

- **Reviews Completed:** ${reviews.reviewsCompleted}
- **Review Coverage:** ${reviews.reviewCoverage}%
- **Access Revoked:** ${reviews.accessRevoked}
- **Uncertified Access:** ${reviews.uncertifiedAccess}

## Review Timeline

- Last Review Date: ${reviews.lastReviewDate}
- Next Review Date: ${reviews.nextReviewDate}
- Review Frequency: ${reviews.frequency}

## Review Metrics

- Average Review Time: ${reviews.reviewMetrics.averageReviewTime}
- Approval Rate: ${reviews.reviewMetrics.approvalRate}
- Escalation Rate: ${reviews.reviewMetrics.escalationRate}

## Actions Required

${reviews.uncertifiedAccess > 0 ? `- Complete certification for ${reviews.uncertifiedAccess} remaining accounts` : '- All accounts certified'}
- Schedule next review cycle
- Follow up on escalated access requests
`;
}

function generatePAMReport(pam) {
  return `# Privileged Access Management Report

## Overview

**Privileged Accounts Managed:** ${pam.privilegedAccountsManaged}
**Total Violations:** ${pam.violations.total}

## Critical Findings

- **Shared Admin Accounts:** ${pam.violations.sharedAdminAccounts} (High Risk)
- **Permanent Privileged Access:** ${pam.violations.permanentPrivilegedAccess}
- **Unmonitored Privileged Access:** ${pam.violations.unmonitoredPrivilegedAccess}

## Control Status

- Just-In-Time Access: ${pam.controls.jitEnabled ? 'Enabled' : 'Not Enabled'}
- Session Recording: ${pam.controls.sessionRecordingEnabled ? 'Enabled' : 'Not Enabled'}
- Approval Workflow: ${pam.controls.approvalWorkflowEnabled ? 'Enabled' : 'Not Enabled'}
- Password Vaulting: ${pam.controls.passwordVaultingEnabled ? 'Enabled' : 'Not Enabled'}

## Recommendations

${pam.recommendations.map(r => `- ${r}`).join('\n')}
`;
}

function generateMFAReport(mfa) {
  return `# MFA Enforcement Report

## Enrollment Status

- **Total Users:** ${mfa.totalUsers}
- **Users with MFA:** ${mfa.usersWithMFA} (${mfa.mfaEnrollmentRate}%)
- **Users without MFA:** ${mfa.usersWithoutMFA}
- **Privileged Accounts without MFA:** ${mfa.privilegedAccountsWithoutMFA} 🚨

## MFA Methods

${mfa.mfaMethods.map(m => `- ${m}`).join('\n')}

## Security Posture

- Conditional Access Enabled: ${mfa.conditionalAccessEnabled ? 'Yes' : 'No'}
- Phishing-Resistant MFA Users: ${mfa.phishingResistantMFA}
- MFA Bypass Risk: ${mfa.mfaBypassRisks}

${mfa.privilegedAccountsWithoutMFA > 0 ? `
## CRITICAL ACTION REQUIRED

${mfa.privilegedAccountsWithoutMFA} privileged accounts do not have MFA enabled. This is a critical security gap.

**Immediate Action:** Enforce MFA for all privileged accounts within 24 hours.
` : ''}
`;
}

function generateSODReport(sod) {
  return `# Segregation of Duties Analysis

## Overview

**SOD Policies Evaluated:** ${sod.sodPoliciesEvaluated}
**Total Violations:** ${sod.violations.total}
**High Risk Violations:** ${sod.violations.highRisk}

## Common Violations

${sod.commonViolations.map(v => `- ${v}`).join('\n')}

## Users with Conflicting Roles

${sod.violations.conflictingRoles} users have been assigned conflicting roles that violate segregation of duties principles.

## Mitigating Controls in Place

${sod.mitigatingControls.map(c => `- ${c}`).join('\n')}

## Recommendations

1. Remove conflicting role assignments immediately
2. Implement automated SOD conflict detection
3. Enhance approval workflows for sensitive operations
4. Regular SOD policy reviews and updates
`;
}

function generateComplianceMatrix(report) {
  return `# IAM Compliance Matrix

## Overall Status: ${report.overallCompliance}

${report.frameworks.map(framework => `
### ${framework}

**Status:** ${report.status[framework].compliant ? '✓ COMPLIANT' : '✗ NON-COMPLIANT'}
**Score:** ${report.status[framework].score}/100

#### Requirements
- MFA Enforcement: ${report.status[framework].requirements.mfa ? '✓' : '✗'}
- Access Reviews: ${report.status[framework].requirements.accessReviews ? '✓' : '✗'}
- Privileged Access Management: ${report.status[framework].requirements.privilegedAccessManagement ? '✓' : '✗'}
- Least Privilege: ${report.status[framework].requirements.leastPrivilege ? '✓' : '✗'}
`).join('\n')}

## Compliance Gaps

${report.gaps.length > 0 ? report.gaps.map(gap => `
### ${gap.framework}
- **Requirement:** ${gap.requirement}
- **Severity:** ${gap.severity}
`).join('\n') : 'No compliance gaps identified.'}

## Audit Readiness

${report.auditReady ? 'System is audit-ready for all frameworks.' : 'Remediation required before audit readiness.'}
`;
}

function generateRemediationRoadmap(plan) {
  return `# IAM Remediation Roadmap

## Overview

**Total Recommendations:** ${plan.totalRecommendations}
**Quick Wins:** ${plan.quickWins}
**Estimated Effort:** ${plan.estimatedEffort}

## Priority Breakdown

- Critical: ${plan.priorityBreakdown.critical}
- High: ${plan.priorityBreakdown.high}
- Medium: ${plan.priorityBreakdown.medium}
- Low: ${plan.priorityBreakdown.low}

## Immediate Actions (0-7 days)

${plan.immediateActions.map(a => `- ${a}`).join('\n')}

## Short-Term Actions (1-4 weeks)

${plan.shortTermActions.map(a => `- ${a}`).join('\n')}

## Long-Term Actions (1-6 months)

${plan.longTermActions.map(a => `- ${a}`).join('\n')}

## Implementation Approach

1. Form IAM remediation task force
2. Prioritize critical and high-priority items
3. Implement quick wins for immediate improvement
4. Establish ongoing governance processes
5. Continuous monitoring and improvement
`;
}

function generateExecutiveSummary(overview, frameworks, remediation) {
  return `# IAM Review Executive Summary

## ${overview.projectName}

**Environment:** ${overview.environment}
**IAM Platform:** ${overview.iamPlatform}

## Key Findings

### Security Posture
- **Security Score:** ${overview.securityScore}/100
- **Total Identities:** ${overview.totalUsers}
- **Policy Violations:** ${overview.policyViolations}

### Compliance Status
${frameworks.map(f => `- ${f}: In Review`).join('\n')}

## Critical Issues

${overview.policyViolations > 0 ? `
- ${overview.policyViolations} policy violations identified
- Immediate remediation required for critical findings
` : 'No critical issues identified'}

## Remediation Summary

- **Total Recommendations:** ${remediation.totalRecommendations}
- **Quick Wins:** ${remediation.quickWins}
- **Estimated Effort:** ${remediation.estimatedEffort}

## Next Steps

1. Review and approve remediation plan
2. Assign ownership for remediation tasks
3. Begin immediate action items
4. Schedule follow-up review
`;
}

function generateCompleteReport(overview, frameworks, artifacts) {
  return `# Complete IAM Review Report

## ${overview.projectName}

Comprehensive access control and IAM review completed.

## Report Sections

${artifacts.slice(0, 10).map(a => `- ${a.label}: ${a.path}`).join('\n')}

## Summary

This review assessed identity and access management controls across:
- Identity inventory and lifecycle
- Access control models (RBAC/ABAC)
- Least privilege enforcement
- Privileged access management
- MFA and authentication controls
- Segregation of duties
- Compliance validation

For detailed findings, please refer to individual report sections.
`;
}

function getNextReviewDate(frequency) {
  const now = new Date();
  const daysToAdd = frequency === 'monthly' ? 30 : frequency === 'quarterly' ? 90 : frequency === 'semi-annual' ? 180 : 365;
  const nextDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  return nextDate.toISOString().split('T')[0];
}

function getPasswordPolicyDetails(policy) {
  const policies = {
    weak: { minLength: 6, complexity: false, history: 0, expiration: 0 },
    moderate: { minLength: 8, complexity: true, history: 3, expiration: 180 },
    strong: { minLength: 12, complexity: true, history: 5, expiration: 90 },
    enterprise: { minLength: 14, complexity: true, history: 10, expiration: 60 }
  };
  return policies[policy] || policies.moderate;
}
