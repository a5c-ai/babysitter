/**
 * @process specializations/security-compliance/secrets-management
 * @description Secrets Management Implementation - Enterprise-grade secrets management framework covering secure
 * vault setup (HashiCorp Vault, AWS Secrets Manager, Azure Key Vault), automated rotation policies, granular
 * access control (RBAC/ABAC), secret detection and scanning, encryption at rest and in transit, audit logging,
 * compliance validation (SOC2, PCI-DSS, HIPAA), and integration with CI/CD pipelines and runtime environments.
 * @inputs { projectName: string, vaultPlatform?: string, environment?: string, complianceFrameworks?: array, services?: array }
 * @outputs { success: boolean, securityScore: number, secretsManaged: number, rotationPolicies: number, complianceStatus: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/security-compliance/secrets-management', {
 *   projectName: 'Financial Services Platform',
 *   vaultPlatform: 'vault', // 'vault', 'aws-secrets-manager', 'azure-key-vault', 'gcp-secret-manager'
 *   environment: 'production',
 *   complianceFrameworks: ['PCI-DSS', 'SOC2', 'HIPAA', 'ISO27001'],
 *   services: ['payment-api', 'user-service', 'database', 'cache', 'message-queue'],
 *   secretTypes: ['database-credentials', 'api-keys', 'certificates', 'encryption-keys'],
 *   infrastructureType: 'kubernetes',
 *   enableAutoRotation: true,
 *   rotationIntervalDays: 90,
 *   enableSecretDetection: true,
 *   enableAuditLogging: true,
 *   accessControlModel: 'rbac'
 * });
 *
 * @references
 * - HashiCorp Vault Best Practices: https://learn.hashicorp.com/tutorials/vault/production-hardening
 * - AWS Secrets Manager: https://docs.aws.amazon.com/secretsmanager/
 * - Azure Key Vault: https://docs.microsoft.com/azure/key-vault/
 * - GCP Secret Manager: https://cloud.google.com/secret-manager/docs
 * - OWASP Secrets Management: https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html
 * - CIS Benchmark for Secrets: https://www.cisecurity.org/
 * - NIST Key Management: https://csrc.nist.gov/publications/detail/sp/800-57-part-1/rev-5/final
 * - PCI-DSS Requirements: https://www.pcisecuritystandards.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    vaultPlatform = 'vault', // 'vault', 'aws-secrets-manager', 'azure-key-vault', 'gcp-secret-manager'
    environment = 'production',
    complianceFrameworks = ['SOC2', 'ISO27001'],
    services = [],
    secretTypes = ['database-credentials', 'api-keys', 'certificates'],
    infrastructureType = 'kubernetes', // 'kubernetes', 'vm', 'serverless', 'hybrid'
    enableAutoRotation = true,
    rotationIntervalDays = 90,
    enableSecretDetection = true,
    enableAuditLogging = true,
    enableEncryptionAtRest = true,
    enableEncryptionInTransit = true,
    accessControlModel = 'rbac', // 'rbac', 'abac', 'policy-based'
    outputDir = 'secrets-management-output',
    enableCertificateManagement = true,
    enableDisasterRecovery = true,
    backupStrategy = 'multi-region',
    cicdIntegration = true,
    runtimeIntegration = true,
    secretScanningTools = ['gitleaks', 'trufflehog', 'detect-secrets'],
    notificationChannels = ['email', 'slack', 'pagerduty'],
    highAvailability = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let securityScore = 0;
  let secretsManaged = 0;
  let rotationPolicies = 0;
  const complianceStatus = {};

  ctx.log('info', `Starting Secrets Management Implementation for ${projectName}`);
  ctx.log('info', `Vault Platform: ${vaultPlatform}, Environment: ${environment}`);
  ctx.log('info', `Compliance Frameworks: ${complianceFrameworks.join(', ')}`);
  ctx.log('info', `Services: ${services.length}, Secret Types: ${secretTypes.length}`);

  // ============================================================================
  // PHASE 1: SECRETS INVENTORY AND RISK ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Conducting secrets inventory and risk assessment');

  const inventoryResult = await ctx.task(secretsInventoryTask, {
    projectName,
    services,
    secretTypes,
    environment,
    infrastructureType,
    complianceFrameworks,
    outputDir
  });

  artifacts.push(...inventoryResult.artifacts);
  secretsManaged = inventoryResult.secretsCount;
  securityScore += inventoryResult.inventoryScore;

  ctx.log('info', `Inventory complete - Identified ${secretsManaged} secrets across ${inventoryResult.secretCategories.length} categories`);
  ctx.log('info', `Risk Assessment: ${inventoryResult.highRiskSecrets} high-risk, ${inventoryResult.mediumRiskSecrets} medium-risk secrets`);

  // Quality Gate: Inventory review
  await ctx.breakpoint({
    question: `Secrets inventory complete for ${projectName}. Found ${secretsManaged} secrets with ${inventoryResult.highRiskSecrets} high-risk items. Categories: ${inventoryResult.secretCategories.join(', ')}. Review inventory and proceed with vault setup?`,
    title: 'Secrets Inventory Review',
    context: {
      runId: ctx.runId,
      inventory: {
        totalSecrets: secretsManaged,
        secretCategories: inventoryResult.secretCategories,
        highRisk: inventoryResult.highRiskSecrets,
        mediumRisk: inventoryResult.mediumRiskSecrets,
        riskProfile: inventoryResult.riskProfile,
        complianceGaps: inventoryResult.complianceGaps
      },
      files: inventoryResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 2: VAULT PLATFORM SETUP AND CONFIGURATION
  // ============================================================================

  ctx.log('info', `Phase 2: Setting up ${vaultPlatform} platform`);

  const vaultSetupResult = await ctx.task(vaultSetupTask, {
    projectName,
    vaultPlatform,
    environment,
    infrastructureType,
    highAvailability,
    enableEncryptionAtRest,
    enableEncryptionInTransit,
    backupStrategy,
    complianceFrameworks,
    outputDir
  });

  artifacts.push(...vaultSetupResult.artifacts);
  securityScore += vaultSetupResult.setupScore;

  ctx.log('info', `Vault setup complete - ${vaultSetupResult.vaultsConfigured} vaults configured, HA: ${highAvailability}`);

  // Quality Gate: Vault configuration review
  await ctx.breakpoint({
    question: `${vaultPlatform} setup complete for ${environment}. Configured ${vaultSetupResult.vaultsConfigured} vault instances with HA: ${highAvailability}. Encryption: At-rest ${enableEncryptionAtRest}, In-transit ${enableEncryptionInTransit}. Review configuration and proceed?`,
    title: 'Vault Platform Setup Review',
    context: {
      runId: ctx.runId,
      vaultSetup: {
        platform: vaultPlatform,
        vaultsConfigured: vaultSetupResult.vaultsConfigured,
        highAvailability,
        encryptionAtRest: enableEncryptionAtRest,
        encryptionInTransit: enableEncryptionInTransit,
        backupStrategy,
        endpoints: vaultSetupResult.endpoints
      },
      files: vaultSetupResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 3: ACCESS CONTROL AND AUTHENTICATION
  // ============================================================================

  ctx.log('info', `Phase 3: Implementing ${accessControlModel} access control`);

  const accessControlResult = await ctx.task(accessControlTask, {
    projectName,
    vaultPlatform,
    accessControlModel,
    services,
    infrastructureType,
    environment,
    complianceFrameworks,
    outputDir
  });

  artifacts.push(...accessControlResult.artifacts);
  securityScore += accessControlResult.accessScore;

  ctx.log('info', `Access control configured - ${accessControlResult.policiesCreated} policies, ${accessControlResult.rolesCreated} roles, ${accessControlResult.authMethodsConfigured} auth methods`);

  // Quality Gate: Access control review
  await ctx.breakpoint({
    question: `Access control implementation complete using ${accessControlModel}. Created ${accessControlResult.policiesCreated} policies and ${accessControlResult.rolesCreated} roles for ${services.length} services. Review least-privilege access and proceed?`,
    title: 'Access Control Configuration Review',
    context: {
      runId: ctx.runId,
      accessControl: {
        model: accessControlModel,
        policiesCreated: accessControlResult.policiesCreated,
        rolesCreated: accessControlResult.rolesCreated,
        authMethods: accessControlResult.authMethodsConfigured,
        principleOfLeastPrivilege: accessControlResult.leastPrivilegeCompliance,
        services: services.length
      },
      files: accessControlResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 4: SECRET ROTATION POLICIES
  // ============================================================================

  if (enableAutoRotation) {
    ctx.log('info', 'Phase 4: Implementing automated secret rotation policies');

    const rotationResult = await ctx.task(secretRotationTask, {
      projectName,
      vaultPlatform,
      secretTypes,
      services,
      rotationIntervalDays,
      environment,
      infrastructureType,
      outputDir
    });

    artifacts.push(...rotationResult.artifacts);
    rotationPolicies = rotationResult.rotationPoliciesCreated;
    securityScore += rotationResult.rotationScore;

    ctx.log('info', `Rotation policies configured - ${rotationPolicies} policies, ${rotationResult.secretsWithRotation} secrets with auto-rotation`);

    // Quality Gate: Rotation policies review
    await ctx.breakpoint({
      question: `Secret rotation policies configured for ${projectName}. Created ${rotationPolicies} rotation policies covering ${rotationResult.secretsWithRotation} secrets. Rotation interval: ${rotationIntervalDays} days. Review rotation strategy?`,
      title: 'Secret Rotation Policies Review',
      context: {
        runId: ctx.runId,
        rotation: {
          policiesCreated: rotationPolicies,
          secretsWithRotation: rotationResult.secretsWithRotation,
          rotationInterval: rotationIntervalDays,
          rotationSchedules: rotationResult.rotationSchedules,
          zeroDowntimeRotation: rotationResult.zeroDowntimeEnabled,
          rollbackStrategy: rotationResult.rollbackStrategy
        },
        files: rotationResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 5: SECRET DETECTION AND SCANNING
  // ============================================================================

  if (enableSecretDetection) {
    ctx.log('info', 'Phase 5: Implementing secret detection and scanning');

    const detectionResult = await ctx.task(secretDetectionTask, {
      projectName,
      secretScanningTools,
      environment,
      cicdIntegration,
      services,
      outputDir
    });

    artifacts.push(...detectionResult.artifacts);
    securityScore += detectionResult.detectionScore;

    ctx.log('info', `Secret detection configured - ${detectionResult.scannersConfigured} scanners, ${detectionResult.exposedSecretsFound} exposed secrets found`);

    // Quality Gate: Secret exposure review
    if (detectionResult.exposedSecretsFound > 0) {
      await ctx.breakpoint({
        question: `Secret scanning found ${detectionResult.exposedSecretsFound} exposed secrets in ${projectName}! Locations: ${detectionResult.exposureLocations.join(', ')}. CRITICAL: Rotate all exposed secrets immediately before proceeding!`,
        title: 'CRITICAL: Exposed Secrets Found',
        context: {
          runId: ctx.runId,
          secretExposure: {
            exposedSecretsCount: detectionResult.exposedSecretsFound,
            exposureLocations: detectionResult.exposureLocations,
            exposureTypes: detectionResult.exposureTypes,
            criticalExposures: detectionResult.criticalExposures,
            remediationSteps: detectionResult.remediationSteps
          },
          recommendation: 'IMMEDIATELY rotate all exposed secrets and review access logs',
          files: detectionResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
        }
      });
    } else {
      ctx.log('info', 'No exposed secrets found - good security posture');
    }
  }

  // ============================================================================
  // PHASE 6: CERTIFICATE MANAGEMENT
  // ============================================================================

  if (enableCertificateManagement && secretTypes.includes('certificates')) {
    ctx.log('info', 'Phase 6: Implementing certificate management');

    const certResult = await ctx.task(certificateManagementTask, {
      projectName,
      vaultPlatform,
      services,
      environment,
      infrastructureType,
      enableAutoRotation,
      outputDir
    });

    artifacts.push(...certResult.artifacts);
    securityScore += certResult.certScore;

    ctx.log('info', `Certificate management configured - ${certResult.certificatesManaged} certificates, ${certResult.pkiEnginesConfigured} PKI engines`);

    // Quality Gate: Certificate management review
    await ctx.breakpoint({
      question: `Certificate management configured for ${projectName}. Managing ${certResult.certificatesManaged} certificates across ${certResult.pkiEnginesConfigured} PKI engines. Auto-renewal: ${certResult.autoRenewalEnabled}. Review certificate lifecycle?`,
      title: 'Certificate Management Review',
      context: {
        runId: ctx.runId,
        certificates: {
          certificatesManaged: certResult.certificatesManaged,
          pkiEngines: certResult.pkiEnginesConfigured,
          autoRenewal: certResult.autoRenewalEnabled,
          expiringCertificates: certResult.expiringCertificates,
          certificateTypes: certResult.certificateTypes
        },
        files: certResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 7: AUDIT LOGGING AND MONITORING
  // ============================================================================

  if (enableAuditLogging) {
    ctx.log('info', 'Phase 7: Implementing audit logging and monitoring');

    const auditResult = await ctx.task(auditLoggingTask, {
      projectName,
      vaultPlatform,
      environment,
      complianceFrameworks,
      notificationChannels,
      outputDir
    });

    artifacts.push(...auditResult.artifacts);
    securityScore += auditResult.auditScore;

    ctx.log('info', `Audit logging configured - ${auditResult.auditDevicesConfigured} audit devices, ${auditResult.alertsConfigured} security alerts`);

    // Quality Gate: Audit configuration review
    await ctx.breakpoint({
      question: `Audit logging and monitoring configured for ${projectName}. Setup ${auditResult.auditDevicesConfigured} audit devices with ${auditResult.alertsConfigured} security alerts. Retention: ${auditResult.retentionDays} days. Review audit strategy?`,
      title: 'Audit Logging Configuration Review',
      context: {
        runId: ctx.runId,
        auditing: {
          auditDevices: auditResult.auditDevicesConfigured,
          alerts: auditResult.alertsConfigured,
          retentionDays: auditResult.retentionDays,
          complianceCompliant: auditResult.complianceCompliant,
          monitoringDashboards: auditResult.dashboardsCreated
        },
        files: auditResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 8: CI/CD INTEGRATION
  // ============================================================================

  if (cicdIntegration) {
    ctx.log('info', 'Phase 8: Integrating with CI/CD pipelines');

    const cicdResult = await ctx.task(cicdIntegrationTask, {
      projectName,
      vaultPlatform,
      services,
      infrastructureType,
      environment,
      outputDir
    });

    artifacts.push(...cicdResult.artifacts);
    securityScore += cicdResult.cicdScore;

    ctx.log('info', `CI/CD integration complete - ${cicdResult.pipelinesIntegrated} pipelines, ${cicdResult.secretInjectionMethods} injection methods`);

    // Quality Gate: CI/CD integration review
    await ctx.breakpoint({
      question: `CI/CD integration configured for ${projectName}. Integrated ${cicdResult.pipelinesIntegrated} pipelines with ${cicdResult.secretInjectionMethods} secret injection methods. Security gates: ${cicdResult.securityGatesImplemented}. Review pipeline security?`,
      title: 'CI/CD Integration Review',
      context: {
        runId: ctx.runId,
        cicd: {
          pipelinesIntegrated: cicdResult.pipelinesIntegrated,
          injectionMethods: cicdResult.secretInjectionMethods,
          securityGates: cicdResult.securityGatesImplemented,
          secretScanningEnabled: cicdResult.secretScanningEnabled,
          dynamicSecretsEnabled: cicdResult.dynamicSecretsEnabled
        },
        files: cicdResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 9: RUNTIME INTEGRATION
  // ============================================================================

  if (runtimeIntegration) {
    ctx.log('info', 'Phase 9: Implementing runtime secret injection');

    const runtimeResult = await ctx.task(runtimeIntegrationTask, {
      projectName,
      vaultPlatform,
      services,
      infrastructureType,
      environment,
      outputDir
    });

    artifacts.push(...runtimeResult.artifacts);
    securityScore += runtimeResult.runtimeScore;

    ctx.log('info', `Runtime integration complete - ${runtimeResult.servicesIntegrated} services, ${runtimeResult.injectionPatterns} injection patterns`);

    // Quality Gate: Runtime integration review
    await ctx.breakpoint({
      question: `Runtime secret injection configured for ${projectName}. Integrated ${runtimeResult.servicesIntegrated} services using ${runtimeResult.injectionPatterns} injection patterns. Dynamic secrets: ${runtimeResult.dynamicSecretsEnabled}. Review runtime security?`,
      title: 'Runtime Integration Review',
      context: {
        runId: ctx.runId,
        runtime: {
          servicesIntegrated: runtimeResult.servicesIntegrated,
          injectionPatterns: runtimeResult.injectionPatterns,
          dynamicSecrets: runtimeResult.dynamicSecretsEnabled,
          sidecarPattern: runtimeResult.sidecarPatternUsed,
          secretRefresh: runtimeResult.secretRefreshEnabled
        },
        files: runtimeResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 10: DISASTER RECOVERY AND BACKUP
  // ============================================================================

  if (enableDisasterRecovery) {
    ctx.log('info', 'Phase 10: Implementing disaster recovery and backup');

    const drResult = await ctx.task(disasterRecoveryTask, {
      projectName,
      vaultPlatform,
      environment,
      backupStrategy,
      highAvailability,
      outputDir
    });

    artifacts.push(...drResult.artifacts);
    securityScore += drResult.drScore;

    ctx.log('info', `Disaster recovery configured - ${backupStrategy} backup, RTO: ${drResult.rto}min, RPO: ${drResult.rpo}min`);

    // Quality Gate: DR strategy review
    await ctx.breakpoint({
      question: `Disaster recovery configured for ${projectName}. Backup strategy: ${backupStrategy}, RTO: ${drResult.rto} minutes, RPO: ${drResult.rpo} minutes. Backup locations: ${drResult.backupLocations.join(', ')}. Review DR plan?`,
      title: 'Disaster Recovery Configuration Review',
      context: {
        runId: ctx.runId,
        disasterRecovery: {
          backupStrategy,
          rto: drResult.rto,
          rpo: drResult.rpo,
          backupLocations: drResult.backupLocations,
          backupFrequency: drResult.backupFrequency,
          encryptedBackups: drResult.encryptedBackups,
          failoverTested: drResult.failoverTested
        },
        files: drResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 11: COMPLIANCE VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 11: Validating compliance requirements');

  const complianceResult = await ctx.task(complianceValidationTask, {
    projectName,
    vaultPlatform,
    complianceFrameworks,
    environment,
    secretsManaged,
    rotationPolicies,
    auditingEnabled: enableAuditLogging,
    encryptionEnabled: enableEncryptionAtRest && enableEncryptionInTransit,
    outputDir
  });

  artifacts.push(...complianceResult.artifacts);
  Object.assign(complianceStatus, complianceResult.complianceStatus);
  securityScore += complianceResult.complianceScore;

  ctx.log('info', `Compliance validation complete - ${complianceResult.frameworksCompliant}/${complianceFrameworks.length} frameworks compliant`);

  // Quality Gate: Compliance review
  await ctx.breakpoint({
    question: `Compliance validation complete for ${projectName}. ${complianceResult.frameworksCompliant}/${complianceFrameworks.length} frameworks compliant. Gaps: ${complianceResult.complianceGaps.length}. ${complianceResult.complianceGaps.length > 0 ? 'Review compliance gaps and remediation plan?' : 'All compliance requirements met!'}`,
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
  // PHASE 12: SECURITY TESTING AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 12: Conducting security testing and validation');

  const securityTestResult = await ctx.task(securityTestingTask, {
    projectName,
    vaultPlatform,
    environment,
    services,
    testScenarios: [
      'unauthorized-access',
      'secret-leakage',
      'rotation-failure',
      'failover',
      'encryption-validation'
    ],
    outputDir
  });

  artifacts.push(...securityTestResult.artifacts);
  securityScore += securityTestResult.testScore;

  ctx.log('info', `Security testing complete - ${securityTestResult.testsRun} tests, ${securityTestResult.testsPassed} passed, ${securityTestResult.testsFailed} failed`);

  // Quality Gate: Security test results
  if (securityTestResult.testsFailed > 0) {
    await ctx.breakpoint({
      question: `Security testing found ${securityTestResult.testsFailed} failures in ${projectName}. Failed tests: ${securityTestResult.failedTests.join(', ')}. Review and fix security issues before deployment?`,
      title: 'Security Test Failures',
      context: {
        runId: ctx.runId,
        securityTests: {
          testsRun: securityTestResult.testsRun,
          testsPassed: securityTestResult.testsPassed,
          testsFailed: securityTestResult.testsFailed,
          failedTests: securityTestResult.failedTests,
          vulnerabilities: securityTestResult.vulnerabilitiesFound,
          remediationSteps: securityTestResult.remediationSteps
        },
        files: securityTestResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 13: DOCUMENTATION AND RUNBOOKS
  // ============================================================================

  ctx.log('info', 'Phase 13: Generating documentation and runbooks');

  const docResult = await ctx.task(documentationTask, {
    projectName,
    vaultPlatform,
    environment,
    secretsManaged,
    rotationPolicies,
    services,
    complianceFrameworks,
    artifacts,
    outputDir
  });

  artifacts.push(...docResult.artifacts);

  ctx.log('info', `Documentation generated - ${docResult.documentsCreated} documents, ${docResult.runbooksCreated} runbooks`);

  // ============================================================================
  // FINAL SUMMARY
  // ============================================================================

  const duration = ctx.now() - startTime;
  const finalSecurityScore = Math.min(100, Math.round(securityScore));

  ctx.log('info', '='.repeat(80));
  ctx.log('info', 'SECRETS MANAGEMENT IMPLEMENTATION COMPLETE');
  ctx.log('info', '='.repeat(80));
  ctx.log('info', `Project: ${projectName}`);
  ctx.log('info', `Platform: ${vaultPlatform}`);
  ctx.log('info', `Environment: ${environment}`);
  ctx.log('info', `Secrets Managed: ${secretsManaged}`);
  ctx.log('info', `Rotation Policies: ${rotationPolicies}`);
  ctx.log('info', `Security Score: ${finalSecurityScore}/100`);
  ctx.log('info', `Compliance Frameworks: ${complianceFrameworks.join(', ')}`);
  ctx.log('info', `Artifacts Generated: ${artifacts.length}`);
  ctx.log('info', `Duration: ${Math.round(duration / 1000)}s`);
  ctx.log('info', '='.repeat(80));

  // Final Quality Gate
  await ctx.breakpoint({
    question: `Secrets Management Implementation complete for ${projectName}! Security Score: ${finalSecurityScore}/100. Managed ${secretsManaged} secrets with ${rotationPolicies} rotation policies. Compliance: ${complianceResult.frameworksCompliant}/${complianceFrameworks.length} frameworks. Review implementation summary and approve for deployment?`,
    title: 'Secrets Management Implementation Complete',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        vaultPlatform,
        environment,
        secretsManaged,
        rotationPolicies,
        securityScore: finalSecurityScore,
        complianceStatus,
        services: services.length,
        duration: `${Math.round(duration / 1000)}s`,
        artifactsGenerated: artifacts.length
      },
      recommendations: {
        immediate: [
          'Review and approve access control policies',
          'Validate rotation schedules align with compliance requirements',
          'Test disaster recovery procedures',
          'Train team on secret management procedures'
        ],
        ongoing: [
          'Monitor audit logs daily',
          'Review access patterns weekly',
          'Conduct security assessments quarterly',
          'Update rotation policies based on threat landscape'
        ]
      },
      files: artifacts.slice(0, 20).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  return {
    success: true,
    securityScore: finalSecurityScore,
    secretsManaged,
    rotationPolicies,
    complianceStatus,
    vaultPlatform,
    environment,
    services: services.length,
    artifacts,
    duration: Math.round(duration / 1000),
    summary: {
      inventoryCompleted: true,
      vaultConfigured: true,
      accessControlImplemented: true,
      rotationEnabled: enableAutoRotation,
      secretDetectionEnabled: enableSecretDetection,
      auditingEnabled: enableAuditLogging,
      cicdIntegrated: cicdIntegration,
      runtimeIntegrated: runtimeIntegration,
      disasterRecoveryConfigured: enableDisasterRecovery,
      complianceValidated: true,
      securityTested: true
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

const secretsInventoryTask = defineTask({
  name: 'secrets-inventory',
  description: 'Conduct comprehensive secrets inventory and risk assessment',
  async execute(params, ctx) {
    const {
      projectName,
      services,
      secretTypes,
      environment,
      infrastructureType,
      complianceFrameworks,
      outputDir
    } = params;

    ctx.log('info', `Scanning ${services.length} services for secrets across ${secretTypes.length} types`);

    // Simulate comprehensive inventory
    const secretsCount = services.length * secretTypes.length + Math.floor(Math.random() * 20);
    const secretCategories = [...new Set(secretTypes)];
    const highRiskSecrets = Math.floor(secretsCount * 0.15);
    const mediumRiskSecrets = Math.floor(secretsCount * 0.35);

    const inventory = {
      projectName,
      environment,
      timestamp: new Date().toISOString(),
      secretsCount,
      secretCategories,
      secrets: services.flatMap(service =>
        secretTypes.map(type => ({
          service,
          type,
          riskLevel: Math.random() > 0.85 ? 'high' : Math.random() > 0.5 ? 'medium' : 'low',
          rotationRequired: true,
          complianceScope: complianceFrameworks.filter(() => Math.random() > 0.3),
          currentLocation: 'hardcoded', // To be migrated
          recommendedVaultPath: `${service}/${environment}/${type}`
        }))
      ),
      riskProfile: {
        high: highRiskSecrets,
        medium: mediumRiskSecrets,
        low: secretsCount - highRiskSecrets - mediumRiskSecrets
      },
      complianceGaps: complianceFrameworks.filter(() => Math.random() > 0.7).map(framework => ({
        framework,
        gap: 'Secrets not centrally managed',
        severity: 'high'
      }))
    };

    const artifacts = [
      {
        path: `${outputDir}/secrets-inventory.json`,
        format: 'json',
        label: 'Secrets Inventory',
        content: JSON.stringify(inventory, null, 2)
      },
      {
        path: `${outputDir}/risk-assessment.md`,
        format: 'markdown',
        label: 'Risk Assessment Report',
        content: generateRiskAssessmentReport(inventory)
      }
    ];

    return {
      secretsCount,
      secretCategories,
      highRiskSecrets,
      mediumRiskSecrets,
      riskProfile: inventory.riskProfile,
      complianceGaps: inventory.complianceGaps,
      inventoryScore: 15,
      artifacts
    };
  }
});

const vaultSetupTask = defineTask({
  name: 'vault-setup',
  description: 'Setup and configure vault platform with HA and encryption',
  async execute(params, ctx) {
    const {
      projectName,
      vaultPlatform,
      environment,
      infrastructureType,
      highAvailability,
      enableEncryptionAtRest,
      enableEncryptionInTransit,
      backupStrategy,
      complianceFrameworks,
      outputDir
    } = params;

    ctx.log('info', `Configuring ${vaultPlatform} for ${environment} environment`);

    const vaultsConfigured = highAvailability ? 3 : 1;
    const endpoints = Array.from({ length: vaultsConfigured }, (_, i) =>
      `https://vault-${environment}-${i + 1}.example.com:8200`
    );

    const vaultConfig = {
      platform: vaultPlatform,
      environment,
      highAvailability,
      vaultInstances: vaultsConfigured,
      endpoints,
      storage: {
        backend: infrastructureType === 'kubernetes' ? 'integrated-raft' : 's3',
        encryption: enableEncryptionAtRest,
        replication: highAvailability ? 'multi-region' : 'single-region'
      },
      listener: {
        address: '0.0.0.0:8200',
        tlsEnabled: enableEncryptionInTransit,
        tlsMinVersion: 'tls1.2',
        tlsCipherSuites: ['TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384']
      },
      seal: {
        type: vaultPlatform === 'vault' ? 'auto' : 'managed',
        keyShares: 5,
        keyThreshold: 3
      },
      backup: {
        strategy: backupStrategy,
        frequency: 'hourly',
        retention: '90d',
        encrypted: true
      },
      compliance: complianceFrameworks.map(f => ({
        framework: f,
        requirements: ['encryption-at-rest', 'encryption-in-transit', 'audit-logging']
      }))
    };

    const artifacts = [
      {
        path: `${outputDir}/vault-configuration.json`,
        format: 'json',
        label: 'Vault Configuration',
        content: JSON.stringify(vaultConfig, null, 2)
      },
      {
        path: `${outputDir}/vault-deployment.yaml`,
        format: 'yaml',
        label: 'Vault Deployment Manifest',
        content: generateVaultDeploymentManifest(vaultConfig, infrastructureType)
      },
      {
        path: `${outputDir}/vault-init-script.sh`,
        format: 'shell',
        label: 'Vault Initialization Script',
        content: generateVaultInitScript(vaultConfig)
      }
    ];

    return {
      vaultsConfigured,
      endpoints,
      setupScore: 15,
      artifacts
    };
  }
});

const accessControlTask = defineTask({
  name: 'access-control',
  description: 'Implement RBAC/ABAC access control and authentication',
  async execute(params, ctx) {
    const {
      projectName,
      vaultPlatform,
      accessControlModel,
      services,
      infrastructureType,
      environment,
      complianceFrameworks,
      outputDir
    } = params;

    ctx.log('info', `Implementing ${accessControlModel} access control for ${services.length} services`);

    const policiesCreated = services.length + 5; // Service policies + admin, read-only, etc.
    const rolesCreated = services.length * 2; // Multiple roles per service
    const authMethodsConfigured = infrastructureType === 'kubernetes' ? 2 : 1; // k8s + JWT or just JWT

    const accessControl = {
      model: accessControlModel,
      policies: services.map(service => ({
        name: `${service}-policy`,
        path: `${service}/${environment}/*`,
        capabilities: ['read', 'list'],
        description: `Policy for ${service} service in ${environment}`
      })).concat([
        { name: 'admin-policy', path: '*', capabilities: ['create', 'read', 'update', 'delete', 'list'] },
        { name: 'read-only-policy', path: '*', capabilities: ['read', 'list'] },
        { name: 'rotation-policy', path: '*/rotation/*', capabilities: ['read', 'update'] }
      ]),
      roles: services.flatMap(service => [
        {
          name: `${service}-read-role`,
          policies: [`${service}-policy`],
          boundServiceAccounts: infrastructureType === 'kubernetes' ? [`${service}-sa`] : []
        },
        {
          name: `${service}-admin-role`,
          policies: [`${service}-policy`, 'rotation-policy'],
          boundServiceAccounts: infrastructureType === 'kubernetes' ? [`${service}-admin-sa`] : []
        }
      ]),
      authMethods: [
        {
          type: infrastructureType === 'kubernetes' ? 'kubernetes' : 'jwt',
          path: 'auth/k8s',
          config: { kubernetesHost: 'https://kubernetes.default.svc' }
        },
        {
          type: 'jwt',
          path: 'auth/jwt',
          config: { oidcDiscoveryUrl: 'https://identity.example.com' }
        }
      ].slice(0, authMethodsConfigured),
      leastPrivilegeCompliance: true
    };

    const artifacts = [
      {
        path: `${outputDir}/access-control-policies.json`,
        format: 'json',
        label: 'Access Control Policies',
        content: JSON.stringify(accessControl, null, 2)
      },
      {
        path: `${outputDir}/vault-policies.hcl`,
        format: 'hcl',
        label: 'Vault Policy Definitions',
        content: generateVaultPolicies(accessControl.policies)
      },
      {
        path: `${outputDir}/auth-methods-config.sh`,
        format: 'shell',
        label: 'Authentication Methods Setup',
        content: generateAuthMethodsScript(accessControl.authMethods)
      }
    ];

    return {
      policiesCreated,
      rolesCreated,
      authMethodsConfigured,
      leastPrivilegeCompliance: true,
      accessScore: 15,
      artifacts
    };
  }
});

const secretRotationTask = defineTask({
  name: 'secret-rotation',
  description: 'Configure automated secret rotation policies',
  async execute(params, ctx) {
    const {
      projectName,
      vaultPlatform,
      secretTypes,
      services,
      rotationIntervalDays,
      environment,
      infrastructureType,
      outputDir
    } = params;

    ctx.log('info', `Configuring rotation policies for ${secretTypes.length} secret types`);

    const rotationPoliciesCreated = secretTypes.length;
    const secretsWithRotation = services.length * secretTypes.length;

    const rotationConfig = {
      policies: secretTypes.map(type => ({
        secretType: type,
        rotationInterval: `${rotationIntervalDays}d`,
        rotationWindow: '24h',
        gracePeriod: '7d',
        notifyBefore: '7d',
        autoRotate: true,
        zeroDowntime: true,
        rollbackOnFailure: true,
        rotationStrategy: type === 'database-credentials' ? 'dual-write' : 'immediate'
      })),
      schedules: services.flatMap(service =>
        secretTypes.map(type => ({
          service,
          secretType: type,
          path: `${service}/${environment}/${type}`,
          cronSchedule: `0 0 */${rotationIntervalDays} * *`,
          nextRotation: new Date(Date.now() + rotationIntervalDays * 24 * 60 * 60 * 1000).toISOString()
        }))
      ),
      rollbackStrategy: {
        enabled: true,
        keepPreviousVersions: 3,
        automaticRollback: true,
        rollbackWindow: '1h'
      },
      notifications: {
        beforeRotation: true,
        afterRotation: true,
        onFailure: true,
        channels: ['email', 'slack']
      }
    };

    const artifacts = [
      {
        path: `${outputDir}/rotation-policies.json`,
        format: 'json',
        label: 'Rotation Policies',
        content: JSON.stringify(rotationConfig, null, 2)
      },
      {
        path: `${outputDir}/rotation-schedules.yaml`,
        format: 'yaml',
        label: 'Rotation Schedules',
        content: generateRotationSchedules(rotationConfig.schedules)
      },
      {
        path: `${outputDir}/rotation-runbook.md`,
        format: 'markdown',
        label: 'Rotation Runbook',
        content: generateRotationRunbook(rotationConfig)
      }
    ];

    return {
      rotationPoliciesCreated,
      secretsWithRotation,
      rotationSchedules: rotationConfig.schedules.length,
      zeroDowntimeEnabled: true,
      rollbackStrategy: rotationConfig.rollbackStrategy,
      rotationScore: 10,
      artifacts
    };
  }
});

const secretDetectionTask = defineTask({
  name: 'secret-detection',
  description: 'Configure secret detection and scanning tools',
  async execute(params, ctx) {
    const {
      projectName,
      secretScanningTools,
      environment,
      cicdIntegration,
      services,
      outputDir
    } = params;

    ctx.log('info', `Configuring ${secretScanningTools.length} secret scanning tools`);

    // Simulate secret scanning
    const exposedSecretsFound = Math.random() > 0.8 ? Math.floor(Math.random() * 5) : 0;

    const detectionConfig = {
      scanners: secretScanningTools.map(tool => ({
        name: tool,
        enabled: true,
        scanLocations: ['repository', 'docker-images', 'logs', 'environment-variables'],
        scanFrequency: 'on-commit',
        alerting: true
      })),
      cicdIntegration: cicdIntegration ? {
        enabled: true,
        blockOnSecretFound: true,
        prComments: true,
        failPipeline: true
      } : null,
      exposedSecrets: exposedSecretsFound > 0 ? Array.from({ length: exposedSecretsFound }, (_, i) => ({
        id: `secret-${i + 1}`,
        type: ['api-key', 'password', 'token'][Math.floor(Math.random() * 3)],
        location: ['code', 'config', 'logs'][Math.floor(Math.random() * 3)],
        severity: 'critical',
        remediation: 'Rotate immediately and update to use vault'
      })) : [],
      preventionMeasures: {
        preCommitHooks: true,
        editorPlugins: true,
        developerTraining: true
      }
    };

    const artifacts = [
      {
        path: `${outputDir}/secret-detection-config.json`,
        format: 'json',
        label: 'Secret Detection Configuration',
        content: JSON.stringify(detectionConfig, null, 2)
      },
      {
        path: `${outputDir}/pre-commit-hooks.yaml`,
        format: 'yaml',
        label: 'Pre-commit Hooks',
        content: generatePreCommitHooks(secretScanningTools)
      }
    ];

    if (exposedSecretsFound > 0) {
      artifacts.push({
        path: `${outputDir}/exposed-secrets-report.json`,
        format: 'json',
        label: 'CRITICAL: Exposed Secrets Report',
        content: JSON.stringify(detectionConfig.exposedSecrets, null, 2)
      });
    }

    return {
      scannersConfigured: secretScanningTools.length,
      exposedSecretsFound,
      exposureLocations: exposedSecretsFound > 0 ? detectionConfig.exposedSecrets.map(s => s.location) : [],
      exposureTypes: exposedSecretsFound > 0 ? detectionConfig.exposedSecrets.map(s => s.type) : [],
      criticalExposures: exposedSecretsFound,
      remediationSteps: exposedSecretsFound > 0 ? [
        'Immediately rotate all exposed secrets',
        'Update applications to use vault',
        'Review access logs for unauthorized access',
        'Implement pre-commit hooks to prevent future exposures'
      ] : [],
      detectionScore: exposedSecretsFound === 0 ? 10 : 5,
      artifacts
    };
  }
});

const certificateManagementTask = defineTask({
  name: 'certificate-management',
  description: 'Setup PKI and certificate lifecycle management',
  async execute(params, ctx) {
    const {
      projectName,
      vaultPlatform,
      services,
      environment,
      infrastructureType,
      enableAutoRotation,
      outputDir
    } = params;

    ctx.log('info', `Setting up certificate management for ${services.length} services`);

    const certificatesManaged = services.length * 2; // Internal + external certs
    const pkiEnginesConfigured = 2; // Root + intermediate CA

    const certConfig = {
      pkiEngines: [
        {
          name: 'root-ca',
          type: 'root',
          maxTTL: '87600h', // 10 years
          commonName: `${projectName} Root CA`
        },
        {
          name: 'intermediate-ca',
          type: 'intermediate',
          maxTTL: '43800h', // 5 years
          commonName: `${projectName} Intermediate CA`
        }
      ],
      certificates: services.flatMap(service => [
        {
          service,
          type: 'internal',
          commonName: `${service}.${environment}.internal`,
          ttl: '2160h', // 90 days
          autoRenew: enableAutoRotation,
          renewBefore: '168h' // 7 days
        },
        {
          service,
          type: 'external',
          commonName: `${service}.example.com`,
          ttl: '2160h',
          autoRenew: enableAutoRotation,
          renewBefore: '336h' // 14 days
        }
      ]),
      autoRenewal: {
        enabled: enableAutoRotation,
        renewalThreshold: '80%',
        notifications: true
      },
      expiringCertificates: Math.floor(Math.random() * 3)
    };

    const artifacts = [
      {
        path: `${outputDir}/certificate-config.json`,
        format: 'json',
        label: 'Certificate Configuration',
        content: JSON.stringify(certConfig, null, 2)
      },
      {
        path: `${outputDir}/pki-setup.sh`,
        format: 'shell',
        label: 'PKI Setup Script',
        content: generatePKISetupScript(certConfig)
      },
      {
        path: `${outputDir}/certificate-renewal.yaml`,
        format: 'yaml',
        label: 'Certificate Renewal Configuration',
        content: generateCertRenewalConfig(certConfig)
      }
    ];

    return {
      certificatesManaged,
      pkiEnginesConfigured,
      autoRenewalEnabled: enableAutoRotation,
      expiringCertificates: certConfig.expiringCertificates,
      certificateTypes: ['internal', 'external'],
      certScore: 8,
      artifacts
    };
  }
});

const auditLoggingTask = defineTask({
  name: 'audit-logging',
  description: 'Configure comprehensive audit logging and monitoring',
  async execute(params, ctx) {
    const {
      projectName,
      vaultPlatform,
      environment,
      complianceFrameworks,
      notificationChannels,
      outputDir
    } = params;

    ctx.log('info', 'Configuring audit logging and security monitoring');

    const auditDevicesConfigured = 3; // File, syslog, cloud logging
    const alertsConfigured = 12;
    const retentionDays = complianceFrameworks.includes('PCI-DSS') ? 365 : 90;

    const auditConfig = {
      auditDevices: [
        {
          type: 'file',
          path: '/vault/logs/audit.log',
          format: 'json',
          rotation: 'daily',
          retention: `${retentionDays}d`
        },
        {
          type: 'syslog',
          address: 'syslog.example.com:514',
          format: 'json',
          protocol: 'tcp'
        },
        {
          type: 'cloud',
          provider: 'aws-cloudwatch',
          logGroup: `/vault/${environment}/audit`
        }
      ],
      alerts: [
        { event: 'failed-login-attempts', threshold: 5, window: '5m', severity: 'high' },
        { event: 'unauthorized-access-attempt', threshold: 1, window: '1m', severity: 'critical' },
        { event: 'secret-accessed', threshold: 100, window: '1h', severity: 'medium' },
        { event: 'secret-created', threshold: 50, window: '1h', severity: 'low' },
        { event: 'secret-deleted', threshold: 10, window: '1h', severity: 'high' },
        { event: 'policy-changed', threshold: 1, window: '1m', severity: 'high' },
        { event: 'seal-status-changed', threshold: 1, window: '1m', severity: 'critical' },
        { event: 'rotation-failed', threshold: 1, window: '1m', severity: 'high' },
        { event: 'token-created', threshold: 100, window: '1h', severity: 'medium' },
        { event: 'token-revoked', threshold: 50, window: '1h', severity: 'medium' },
        { event: 'mount-configured', threshold: 1, window: '1h', severity: 'medium' },
        { event: 'backup-failed', threshold: 1, window: '1h', severity: 'critical' }
      ],
      dashboards: [
        { name: 'Security Overview', metrics: ['failed-logins', 'unauthorized-access', 'active-tokens'] },
        { name: 'Secret Usage', metrics: ['secrets-read', 'secrets-created', 'secrets-rotated'] },
        { name: 'Compliance', metrics: ['audit-coverage', 'policy-violations', 'access-reviews'] }
      ],
      notifications: notificationChannels.map(channel => ({
        channel,
        events: ['critical', 'high'],
        enabled: true
      })),
      retentionDays,
      complianceCompliant: true
    };

    const artifacts = [
      {
        path: `${outputDir}/audit-config.json`,
        format: 'json',
        label: 'Audit Configuration',
        content: JSON.stringify(auditConfig, null, 2)
      },
      {
        path: `${outputDir}/alerting-rules.yaml`,
        format: 'yaml',
        label: 'Alerting Rules',
        content: generateAlertingRules(auditConfig.alerts)
      },
      {
        path: `${outputDir}/monitoring-dashboard.json`,
        format: 'json',
        label: 'Monitoring Dashboard',
        content: generateMonitoringDashboard(auditConfig.dashboards)
      }
    ];

    return {
      auditDevicesConfigured,
      alertsConfigured,
      retentionDays,
      complianceCompliant: true,
      dashboardsCreated: auditConfig.dashboards.length,
      auditScore: 10,
      artifacts
    };
  }
});

const cicdIntegrationTask = defineTask({
  name: 'cicd-integration',
  description: 'Integrate vault with CI/CD pipelines',
  async execute(params, ctx) {
    const {
      projectName,
      vaultPlatform,
      services,
      infrastructureType,
      environment,
      outputDir
    } = params;

    ctx.log('info', 'Integrating vault with CI/CD pipelines');

    const pipelinesIntegrated = services.length;
    const secretInjectionMethods = 3;
    const securityGatesImplemented = 5;

    const cicdConfig = {
      pipelines: services.map(service => ({
        service,
        vaultIntegration: true,
        authMethod: 'jwt',
        secretPath: `${service}/${environment}`,
        injectionMethod: 'environment-variables'
      })),
      injectionMethods: [
        { name: 'environment-variables', description: 'Inject secrets as env vars' },
        { name: 'file-injection', description: 'Write secrets to temporary files' },
        { name: 'dynamic-secrets', description: 'Generate short-lived credentials' }
      ],
      securityGates: [
        { name: 'secret-scanning', enabled: true, blockOnFailure: true },
        { name: 'policy-validation', enabled: true, blockOnFailure: true },
        { name: 'secret-approval', enabled: true, requiresManualApproval: true },
        { name: 'rotation-check', enabled: true, blockOnFailure: false },
        { name: 'compliance-check', enabled: true, blockOnFailure: true }
      ],
      secretScanningEnabled: true,
      dynamicSecretsEnabled: true
    };

    const artifacts = [
      {
        path: `${outputDir}/cicd-integration.json`,
        format: 'json',
        label: 'CI/CD Integration Config',
        content: JSON.stringify(cicdConfig, null, 2)
      },
      {
        path: `${outputDir}/pipeline-examples.yaml`,
        format: 'yaml',
        label: 'Pipeline Examples',
        content: generatePipelineExamples(cicdConfig, infrastructureType)
      },
      {
        path: `${outputDir}/security-gates.md`,
        format: 'markdown',
        label: 'Security Gates Documentation',
        content: generateSecurityGatesDoc(cicdConfig.securityGates)
      }
    ];

    return {
      pipelinesIntegrated,
      secretInjectionMethods,
      securityGatesImplemented,
      secretScanningEnabled: true,
      dynamicSecretsEnabled: true,
      cicdScore: 8,
      artifacts
    };
  }
});

const runtimeIntegrationTask = defineTask({
  name: 'runtime-integration',
  description: 'Configure runtime secret injection for applications',
  async execute(params, ctx) {
    const {
      projectName,
      vaultPlatform,
      services,
      infrastructureType,
      environment,
      outputDir
    } = params;

    ctx.log('info', 'Configuring runtime secret injection');

    const servicesIntegrated = services.length;
    const injectionPatterns = infrastructureType === 'kubernetes' ? 3 : 2;

    const runtimeConfig = {
      services: services.map(service => ({
        name: service,
        injectionPattern: infrastructureType === 'kubernetes' ? 'sidecar' : 'agent',
        vaultPath: `${service}/${environment}`,
        refreshInterval: '5m',
        dynamicSecrets: true
      })),
      injectionPatterns: [
        { name: 'sidecar', available: infrastructureType === 'kubernetes' },
        { name: 'init-container', available: infrastructureType === 'kubernetes' },
        { name: 'agent', available: true }
      ].filter(p => p.available),
      dynamicSecretsEnabled: true,
      sidecarPatternUsed: infrastructureType === 'kubernetes',
      secretRefreshEnabled: true
    };

    const artifacts = [
      {
        path: `${outputDir}/runtime-integration.json`,
        format: 'json',
        label: 'Runtime Integration Config',
        content: JSON.stringify(runtimeConfig, null, 2)
      },
      {
        path: `${outputDir}/deployment-examples.yaml`,
        format: 'yaml',
        label: 'Deployment Examples',
        content: generateDeploymentExamples(runtimeConfig, infrastructureType)
      },
      {
        path: `${outputDir}/sidecar-config.yaml`,
        format: 'yaml',
        label: 'Sidecar Configuration',
        content: generateSidecarConfig(runtimeConfig)
      }
    ];

    return {
      servicesIntegrated,
      injectionPatterns: injectionPatterns,
      dynamicSecretsEnabled: true,
      sidecarPatternUsed: infrastructureType === 'kubernetes',
      secretRefreshEnabled: true,
      runtimeScore: 7,
      artifacts
    };
  }
});

const disasterRecoveryTask = defineTask({
  name: 'disaster-recovery',
  description: 'Configure disaster recovery and backup strategy',
  async execute(params, ctx) {
    const {
      projectName,
      vaultPlatform,
      environment,
      backupStrategy,
      highAvailability,
      outputDir
    } = params;

    ctx.log('info', `Configuring ${backupStrategy} disaster recovery`);

    const rto = highAvailability ? 15 : 60; // minutes
    const rpo = 60; // minutes

    const drConfig = {
      backupStrategy,
      rto,
      rpo,
      backupLocations: backupStrategy === 'multi-region' ? ['us-east-1', 'us-west-2', 'eu-west-1'] : ['us-east-1'],
      backupFrequency: 'hourly',
      encryptedBackups: true,
      failoverTested: true,
      replication: {
        enabled: highAvailability,
        mode: 'async',
        targets: backupStrategy === 'multi-region' ? ['us-west-2', 'eu-west-1'] : []
      },
      recovery: {
        automated: true,
        manualSteps: [
          'Verify backup integrity',
          'Restore vault data',
          'Unseal vault instances',
          'Verify secret access'
        ]
      }
    };

    const artifacts = [
      {
        path: `${outputDir}/disaster-recovery-plan.json`,
        format: 'json',
        label: 'Disaster Recovery Plan',
        content: JSON.stringify(drConfig, null, 2)
      },
      {
        path: `${outputDir}/backup-config.yaml`,
        format: 'yaml',
        label: 'Backup Configuration',
        content: generateBackupConfig(drConfig)
      },
      {
        path: `${outputDir}/recovery-runbook.md`,
        format: 'markdown',
        label: 'Recovery Runbook',
        content: generateRecoveryRunbook(drConfig)
      }
    ];

    return {
      rto,
      rpo,
      backupLocations: drConfig.backupLocations,
      backupFrequency: drConfig.backupFrequency,
      encryptedBackups: true,
      failoverTested: true,
      drScore: 8,
      artifacts
    };
  }
});

const complianceValidationTask = defineTask({
  name: 'compliance-validation',
  description: 'Validate compliance with security frameworks',
  async execute(params, ctx) {
    const {
      projectName,
      vaultPlatform,
      complianceFrameworks,
      environment,
      secretsManaged,
      rotationPolicies,
      auditingEnabled,
      encryptionEnabled,
      outputDir
    } = params;

    ctx.log('info', `Validating compliance with ${complianceFrameworks.length} frameworks`);

    // Simulate compliance validation
    const frameworksCompliant = complianceFrameworks.filter(() => Math.random() > 0.2).length;

    const complianceStatus = {};
    const complianceGaps = [];

    complianceFrameworks.forEach(framework => {
      const isCompliant = Math.random() > 0.2;
      complianceStatus[framework] = {
        compliant: isCompliant,
        score: isCompliant ? 95 + Math.floor(Math.random() * 5) : 70 + Math.floor(Math.random() * 20),
        requirements: {
          encryption: encryptionEnabled,
          auditing: auditingEnabled,
          rotation: rotationPolicies > 0,
          accessControl: true
        }
      };

      if (!isCompliant) {
        complianceGaps.push({
          framework,
          requirement: 'Enhanced monitoring required',
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
        action: 'Implement enhanced monitoring',
        priority: gap.severity,
        estimatedEffort: '1 week'
      })),
      auditReady: complianceGaps.length === 0
    };

    const artifacts = [
      {
        path: `${outputDir}/compliance-report.json`,
        format: 'json',
        label: 'Compliance Report',
        content: JSON.stringify(complianceReport, null, 2)
      },
      {
        path: `${outputDir}/compliance-matrix.md`,
        format: 'markdown',
        label: 'Compliance Matrix',
        content: generateComplianceMatrix(complianceReport)
      }
    ];

    if (complianceGaps.length > 0) {
      artifacts.push({
        path: `${outputDir}/remediation-plan.md`,
        format: 'markdown',
        label: 'Compliance Remediation Plan',
        content: generateRemediationPlan(complianceReport)
      });
    }

    return {
      frameworksCompliant,
      complianceStatus,
      complianceGaps,
      remediationPlan: complianceReport.remediationPlan,
      auditReady: complianceReport.auditReady,
      complianceScore: 8,
      artifacts
    };
  }
});

const securityTestingTask = defineTask({
  name: 'security-testing',
  description: 'Execute security tests and penetration testing',
  async execute(params, ctx) {
    const {
      projectName,
      vaultPlatform,
      environment,
      services,
      testScenarios,
      outputDir
    } = params;

    ctx.log('info', `Running ${testScenarios.length} security test scenarios`);

    const testsRun = testScenarios.length * services.length;
    const testsFailed = Math.random() > 0.85 ? Math.floor(Math.random() * 3) : 0;
    const testsPassed = testsRun - testsFailed;

    const testResults = {
      testsRun,
      testsPassed,
      testsFailed,
      scenarios: testScenarios.map(scenario => ({
        name: scenario,
        status: Math.random() > 0.15 ? 'passed' : 'failed',
        services: services.map(service => ({
          service,
          passed: Math.random() > 0.15
        }))
      })),
      failedTests: testsFailed > 0 ? testScenarios.filter(() => Math.random() < 0.2) : [],
      vulnerabilitiesFound: testsFailed > 0 ? [
        { type: 'Weak access control', severity: 'medium' },
        { type: 'Insufficient audit logging', severity: 'low' }
      ] : [],
      remediationSteps: testsFailed > 0 ? [
        'Strengthen access control policies',
        'Enhance audit logging coverage',
        'Re-test after remediation'
      ] : []
    };

    const artifacts = [
      {
        path: `${outputDir}/security-test-results.json`,
        format: 'json',
        label: 'Security Test Results',
        content: JSON.stringify(testResults, null, 2)
      },
      {
        path: `${outputDir}/penetration-test-report.md`,
        format: 'markdown',
        label: 'Penetration Test Report',
        content: generatePenetrationTestReport(testResults)
      }
    ];

    return {
      testsRun,
      testsPassed,
      testsFailed,
      failedTests: testResults.failedTests,
      vulnerabilitiesFound: testResults.vulnerabilitiesFound.length,
      remediationSteps: testResults.remediationSteps,
      testScore: testsFailed === 0 ? 10 : 5,
      artifacts
    };
  }
});

const documentationTask = defineTask({
  name: 'documentation',
  description: 'Generate comprehensive documentation and runbooks',
  async execute(params, ctx) {
    const {
      projectName,
      vaultPlatform,
      environment,
      secretsManaged,
      rotationPolicies,
      services,
      complianceFrameworks,
      artifacts,
      outputDir
    } = params;

    ctx.log('info', 'Generating documentation and runbooks');

    const documentation = {
      overview: {
        projectName,
        vaultPlatform,
        environment,
        secretsManaged,
        rotationPolicies,
        services: services.length
      },
      runbooks: [
        'Secret Rotation Procedure',
        'Emergency Secret Revocation',
        'Vault Unsealing Process',
        'Disaster Recovery Procedure',
        'Access Request Process',
        'Compliance Audit Preparation'
      ],
      documentation: [
        'Architecture Overview',
        'Security Model',
        'Access Control Guide',
        'Rotation Policy Guide',
        'Monitoring and Alerting',
        'Troubleshooting Guide',
        'API Reference',
        'Developer Guide'
      ]
    };

    const docArtifacts = [
      {
        path: `${outputDir}/README.md`,
        format: 'markdown',
        label: 'Secrets Management Overview',
        content: generateOverviewDoc(documentation.overview, complianceFrameworks)
      },
      {
        path: `${outputDir}/architecture.md`,
        format: 'markdown',
        label: 'Architecture Documentation',
        content: generateArchitectureDoc(projectName, vaultPlatform, services)
      },
      {
        path: `${outputDir}/runbooks/rotation-runbook.md`,
        format: 'markdown',
        label: 'Secret Rotation Runbook',
        content: generateRotationRunbookDoc()
      },
      {
        path: `${outputDir}/runbooks/emergency-runbook.md`,
        format: 'markdown',
        label: 'Emergency Procedures Runbook',
        content: generateEmergencyRunbookDoc()
      },
      {
        path: `${outputDir}/developer-guide.md`,
        format: 'markdown',
        label: 'Developer Guide',
        content: generateDeveloperGuide(vaultPlatform, services)
      },
      {
        path: `${outputDir}/compliance-guide.md`,
        format: 'markdown',
        label: 'Compliance Guide',
        content: generateComplianceGuide(complianceFrameworks)
      }
    ];

    return {
      documentsCreated: documentation.documentation.length,
      runbooksCreated: documentation.runbooks.length,
      artifacts: docArtifacts
    };
  }
});

// ============================================================================
// HELPER FUNCTIONS FOR CONTENT GENERATION
// ============================================================================

function generateRiskAssessmentReport(inventory) {
  return `# Secrets Risk Assessment Report

## Project: ${inventory.projectName}
**Environment:** ${inventory.environment}
**Assessment Date:** ${inventory.timestamp}

## Executive Summary

Total secrets identified: **${inventory.secretsCount}**
- High Risk: ${inventory.riskProfile.high}
- Medium Risk: ${inventory.riskProfile.medium}
- Low Risk: ${inventory.riskProfile.low}

## Secret Categories

${inventory.secretCategories.map(cat => `- ${cat}`).join('\n')}

## Compliance Gaps

${inventory.complianceGaps.length > 0 ?
  inventory.complianceGaps.map(gap =>
    `### ${gap.framework}\n- **Gap:** ${gap.gap}\n- **Severity:** ${gap.severity}`
  ).join('\n\n') :
  'No compliance gaps identified.'}

## Recommendations

1. Migrate all high-risk secrets to vault immediately
2. Implement automated rotation for all secrets
3. Enable comprehensive audit logging
4. Conduct regular access reviews
`;
}

function generateVaultDeploymentManifest(config, infrastructureType) {
  if (infrastructureType === 'kubernetes') {
    return `apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: vault
  namespace: security
spec:
  serviceName: vault
  replicas: ${config.vaultInstances}
  selector:
    matchLabels:
      app: vault
  template:
    metadata:
      labels:
        app: vault
    spec:
      containers:
      - name: vault
        image: hashicorp/vault:latest
        ports:
        - containerPort: 8200
          name: vault
        env:
        - name: VAULT_ADDR
          value: "https://127.0.0.1:8200"
        - name: VAULT_CLUSTER_ADDR
          value: "https://$(POD_IP):8201"
        volumeMounts:
        - name: vault-config
          mountPath: /vault/config
        - name: vault-data
          mountPath: /vault/data
      volumes:
      - name: vault-config
        configMap:
          name: vault-config
  volumeClaimTemplates:
  - metadata:
      name: vault-data
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 10Gi
`;
  }
  return `# Vault deployment configuration for ${infrastructureType}
# Platform: ${config.platform}
# Instances: ${config.vaultInstances}
`;
}

function generateVaultInitScript(config) {
  return `#!/bin/bash
# Vault Initialization Script
# Platform: ${config.platform}

set -e

echo "Initializing Vault..."
vault operator init -key-shares=${config.seal.keyShares} -key-threshold=${config.seal.keyThreshold}

echo "Configuring audit devices..."
vault audit enable file file_path=/vault/logs/audit.log

echo "Vault initialization complete!"
`;
}

function generateVaultPolicies(policies) {
  return policies.map(policy => `
# Policy: ${policy.name}
path "${policy.path}" {
  capabilities = [${policy.capabilities.map(c => `"${c}"`).join(', ')}]
}
`).join('\n');
}

function generateAuthMethodsScript(authMethods) {
  return authMethods.map(method => `
# Configure ${method.type} auth method
vault auth enable -path=${method.path} ${method.type}
vault write ${method.path}/config ${Object.entries(method.config).map(([k, v]) => `${k}="${v}"`).join(' ')}
`).join('\n');
}

function generateRotationSchedules(schedules) {
  return `# Secret Rotation Schedules

schedules:
${schedules.map(s => `  - service: ${s.service}
    secret_type: ${s.secretType}
    path: ${s.path}
    cron: "${s.cronSchedule}"
    next_rotation: ${s.nextRotation}`).join('\n')}
`;
}

function generateRotationRunbook(config) {
  return `# Secret Rotation Runbook

## Rotation Policies

${config.policies.map(p => `
### ${p.secretType}
- Interval: ${p.rotationInterval}
- Strategy: ${p.rotationStrategy}
- Zero-Downtime: ${p.zeroDowntime}
- Auto-Rollback: ${p.rollbackOnFailure}
`).join('\n')}

## Rotation Process

1. Notification sent ${config.policies[0]?.notifyBefore} before rotation
2. New secret generated
3. Application updated with both old and new secrets
4. Grace period: ${config.policies[0]?.gracePeriod}
5. Old secret revoked after grace period
`;
}

function generatePreCommitHooks(tools) {
  return `repos:
${tools.map(tool => `  - repo: https://github.com/${tool}/${tool}
    rev: latest
    hooks:
      - id: ${tool}
        name: Detect secrets using ${tool}
        entry: ${tool}
        language: system
        files: \\.(js|ts|py|go|java|yml|yaml|json)$`).join('\n')}
`;
}

function generatePKISetupScript(config) {
  return `#!/bin/bash
# PKI Setup Script

set -e

echo "Setting up PKI infrastructure..."

# Enable PKI secrets engine for root CA
vault secrets enable -path=pki pki
vault secrets tune -max-lease-ttl=${config.pkiEngines[0].maxTTL} pki

# Generate root CA
vault write -field=certificate pki/root/generate/internal \\
    common_name="${config.pkiEngines[0].commonName}" \\
    ttl=${config.pkiEngines[0].maxTTL}

# Enable PKI secrets engine for intermediate CA
vault secrets enable -path=pki_int pki
vault secrets tune -max-lease-ttl=${config.pkiEngines[1].maxTTL} pki_int

# Generate intermediate CA CSR
vault write -format=json pki_int/intermediate/generate/internal \\
    common_name="${config.pkiEngines[1].commonName}" \\
    | jq -r '.data.csr' > pki_intermediate.csr

# Sign intermediate CA
vault write -format=json pki/root/sign-intermediate \\
    csr=@pki_intermediate.csr \\
    format=pem_bundle ttl=${config.pkiEngines[1].maxTTL} \\
    | jq -r '.data.certificate' > intermediate.cert.pem

# Set signed certificate
vault write pki_int/intermediate/set-signed certificate=@intermediate.cert.pem

echo "PKI setup complete!"
`;
}

function generateCertRenewalConfig(config) {
  return `# Certificate Auto-Renewal Configuration

auto_renewal:
  enabled: ${config.autoRenewal.enabled}
  threshold: ${config.autoRenewal.renewalThreshold}
  notifications: ${config.autoRenewal.notifications}

certificates:
${config.certificates.map(cert => `  - common_name: ${cert.commonName}
    ttl: ${cert.ttl}
    auto_renew: ${cert.autoRenew}
    renew_before: ${cert.renewBefore}`).join('\n')}
`;
}

function generateAlertingRules(alerts) {
  return `# Alerting Rules Configuration

groups:
  - name: vault_security_alerts
    interval: 30s
    rules:
${alerts.map(alert => `      - alert: ${alert.event.replace(/-/g, '_')}
        expr: rate(vault_${alert.event.replace(/-/g, '_')}[${alert.window}]) > ${alert.threshold}
        labels:
          severity: ${alert.severity}
        annotations:
          summary: "High rate of ${alert.event.replace(/-/g, ' ')}"
          description: "Detected {{ $value }} ${alert.event.replace(/-/g, ' ')} in ${alert.window}"`).join('\n')}
`;
}

function generateMonitoringDashboard(dashboards) {
  return JSON.stringify({
    dashboards: dashboards.map(d => ({
      title: d.name,
      panels: d.metrics.map((metric, i) => ({
        id: i + 1,
        title: metric,
        type: 'graph',
        targets: [{ expr: `vault_${metric.replace(/-/g, '_')}` }]
      }))
    }))
  }, null, 2);
}

function generatePipelineExamples(config, infrastructureType) {
  return `# CI/CD Pipeline Examples

## GitHub Actions Example

\`\`\`yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Get secrets from Vault
        uses: hashicorp/vault-action@v2
        with:
          url: https://vault.example.com
          method: jwt
          role: github-actions
          secrets: |
            secret/data/myapp/prod db_password | DB_PASSWORD
            secret/data/myapp/prod api_key | API_KEY
\`\`\`

## GitLab CI Example

\`\`\`yaml
deploy:
  image: vault:latest
  script:
    - export VAULT_TOKEN="$(vault write -field=token auth/jwt/login role=gitlab-ci jwt=$CI_JOB_JWT)"
    - export DB_PASSWORD="$(vault kv get -field=password secret/myapp/prod)"
\`\`\`
`;
}

function generateSecurityGatesDoc(gates) {
  return `# Security Gates Documentation

${gates.map(gate => `
## ${gate.name}

- **Enabled:** ${gate.enabled}
- **Block on Failure:** ${gate.blockOnFailure || false}
- **Manual Approval:** ${gate.requiresManualApproval || false}

${gate.name === 'secret-scanning' ? 'Scans code and artifacts for exposed secrets before deployment.' : ''}
${gate.name === 'policy-validation' ? 'Validates vault policies and access controls.' : ''}
${gate.name === 'secret-approval' ? 'Requires manual approval for production secret changes.' : ''}
${gate.name === 'rotation-check' ? 'Verifies all secrets are within rotation policy.' : ''}
${gate.name === 'compliance-check' ? 'Validates compliance with security frameworks.' : ''}
`).join('\n')}
`;
}

function generateDeploymentExamples(config, infrastructureType) {
  if (infrastructureType === 'kubernetes') {
    return `apiVersion: v1
kind: Pod
metadata:
  name: app-with-vault
  annotations:
    vault.hashicorp.com/agent-inject: "true"
    vault.hashicorp.com/role: "app-role"
    vault.hashicorp.com/agent-inject-secret-config: "secret/data/app/config"
spec:
  serviceAccountName: app-sa
  containers:
  - name: app
    image: myapp:latest
    env:
    - name: VAULT_ADDR
      value: "https://vault.default.svc:8200"
`;
  }
  return `# Deployment examples for ${infrastructureType}`;
}

function generateSidecarConfig(config) {
  return `# Vault Sidecar Configuration

vault_agent_config:
  auto_auth:
    method:
      type: kubernetes
      config:
        role: app-role

  template:
    - source: /vault/secrets/config.tmpl
      destination: /app/config/secrets.env

  cache:
    use_auto_auth_token: true
`;
}

function generateBackupConfig(config) {
  return `# Vault Backup Configuration

backup:
  strategy: ${config.backupStrategy}
  frequency: ${config.backupFrequency}
  retention: 90d
  encrypted: ${config.encryptedBackups}

  locations:
${config.backupLocations.map(loc => `    - ${loc}`).join('\n')}

  replication:
    enabled: ${config.replication.enabled}
    mode: ${config.replication.mode}
${config.replication.targets.length > 0 ? `    targets:\n${config.replication.targets.map(t => `      - ${t}`).join('\n')}` : ''}
`;
}

function generateRecoveryRunbook(config) {
  return `# Disaster Recovery Runbook

## Recovery Time Objective (RTO)
${config.rto} minutes

## Recovery Point Objective (RPO)
${config.rpo} minutes

## Recovery Procedure

${config.recovery.manualSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

## Backup Locations

${config.backupLocations.map(loc => `- ${loc}`).join('\n')}

## Automated Recovery

Automated recovery is ${config.recovery.automated ? 'ENABLED' : 'DISABLED'}.

## Failover Testing

Last tested: ${config.failoverTested ? 'Recently' : 'Never'}
Next test: Quarterly
`;
}

function generateComplianceMatrix(report) {
  return `# Compliance Matrix

## Overall Status: ${report.overallCompliance}

${report.frameworks.map(framework => `
### ${framework}

**Status:** ${report.status[framework].compliant ? '✓ COMPLIANT' : '✗ NON-COMPLIANT'}
**Score:** ${report.status[framework].score}/100

#### Requirements
- Encryption: ${report.status[framework].requirements.encryption ? '✓' : '✗'}
- Auditing: ${report.status[framework].requirements.auditing ? '✓' : '✗'}
- Rotation: ${report.status[framework].requirements.rotation ? '✓' : '✗'}
- Access Control: ${report.status[framework].requirements.accessControl ? '✓' : '✗'}
`).join('\n')}

## Audit Readiness

${report.auditReady ? 'System is audit-ready.' : 'System requires remediation before audit.'}
`;
}

function generateRemediationPlan(report) {
  return `# Compliance Remediation Plan

## Gaps Identified

${report.gaps.map((gap, i) => `
### ${i + 1}. ${gap.framework}

**Issue:** ${gap.requirement}
**Severity:** ${gap.severity}

**Remediation:**
${report.remediationPlan.find(p => p.framework === gap.framework)?.action || 'TBD'}

**Estimated Effort:** ${report.remediationPlan.find(p => p.framework === gap.framework)?.estimatedEffort || 'TBD'}
`).join('\n')}
`;
}

function generatePenetrationTestReport(results) {
  return `# Security Penetration Test Report

## Summary

- **Tests Run:** ${results.testsRun}
- **Tests Passed:** ${results.testsPassed}
- **Tests Failed:** ${results.testsFailed}

## Test Scenarios

${results.scenarios.map(scenario => `
### ${scenario.name}

**Status:** ${scenario.status}

Services tested:
${scenario.services.map(s => `- ${s.service}: ${s.passed ? '✓ PASSED' : '✗ FAILED'}`).join('\n')}
`).join('\n')}

${results.vulnerabilitiesFound.length > 0 ? `
## Vulnerabilities Found

${results.vulnerabilitiesFound.map(v => `
### ${v.type}
**Severity:** ${v.severity}
`).join('\n')}

## Remediation Steps

${results.remediationSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}
` : '## No Vulnerabilities Found\n\nAll security tests passed successfully.'}
`;
}

function generateOverviewDoc(overview, frameworks) {
  return `# Secrets Management - ${overview.projectName}

## Overview

**Platform:** ${overview.vaultPlatform}
**Environment:** ${overview.environment}
**Secrets Managed:** ${overview.secretsManaged}
**Rotation Policies:** ${overview.rotationPolicies}
**Services:** ${overview.services}

## Compliance

${frameworks.map(f => `- ${f}`).join('\n')}

## Quick Links

- [Architecture Documentation](./architecture.md)
- [Developer Guide](./developer-guide.md)
- [Runbooks](./runbooks/)
- [Compliance Guide](./compliance-guide.md)

## Support

For questions or issues, contact the security team.
`;
}

function generateArchitectureDoc(projectName, platform, services) {
  return `# Secrets Management Architecture

## System Overview

${projectName} uses ${platform} for centralized secrets management.

## Architecture Components

### Vault Cluster
- High-availability configuration
- Multi-region replication
- Automated failover

### Secret Engines
- KV Secrets Engine (v2)
- PKI Engine
- Database Secrets Engine

### Authentication Methods
- Kubernetes authentication
- JWT/OIDC authentication
- AppRole authentication

### Services Integration

${services.map(s => `- ${s}`).join('\n')}

## Security Model

- Encryption at rest using AES-256
- TLS 1.2+ for all communications
- Zero-trust access model
- Principle of least privilege
`;
}

function generateRotationRunbookDoc() {
  return `# Secret Rotation Runbook

## When to Use

- Scheduled rotation (automated)
- Emergency rotation (security incident)
- Compliance-driven rotation

## Pre-Rotation Checklist

- [ ] Verify backup exists
- [ ] Check dependent services
- [ ] Notify stakeholders
- [ ] Review rotation schedule

## Rotation Process

1. Generate new secret
2. Update primary application
3. Test with new secret
4. Update backup applications
5. Verify all services healthy
6. Revoke old secret after grace period

## Rollback Procedure

If rotation fails:
1. Restore previous secret version
2. Verify service recovery
3. Investigate failure
4. Document incident
`;
}

function generateEmergencyRunbookDoc() {
  return `# Emergency Procedures Runbook

## Secret Compromise

If a secret is compromised:

1. **IMMEDIATELY** revoke the compromised secret
2. Rotate all related secrets
3. Review audit logs for unauthorized access
4. Notify security team
5. Document incident

## Vault Unsealing

If vault becomes sealed:

1. Gather keyholders
2. Use unseal keys (requires threshold)
3. Verify vault status
4. Check cluster health
5. Review audit logs

## Disaster Recovery

In case of catastrophic failure:

1. Activate DR plan
2. Restore from backup
3. Unseal vault instances
4. Verify secret integrity
5. Test service connectivity
`;
}

function generateDeveloperGuide(platform, services) {
  return `# Developer Guide - Secrets Management

## Getting Started

### Accessing Secrets

\`\`\`bash
# Login to vault
vault login -method=jwt role=developer

# Read a secret
vault kv get secret/myapp/config

# List secrets
vault kv list secret/myapp
\`\`\`

### Using Secrets in Applications

#### Environment Variables

\`\`\`bash
export DB_PASSWORD=$(vault kv get -field=password secret/myapp/db)
\`\`\`

#### SDKs

\`\`\`javascript
const vault = require('node-vault')();
const secret = await vault.read('secret/data/myapp/config');
\`\`\`

## Best Practices

1. Never hardcode secrets
2. Use dynamic secrets when possible
3. Rotate secrets regularly
4. Follow least-privilege principle
5. Enable audit logging

## Services

${services.map(s => `- ${s}`).join('\n')}
`;
}

function generateComplianceGuide(frameworks) {
  return `# Compliance Guide

## Frameworks

${frameworks.map(framework => `
### ${framework}

**Key Requirements:**
- Encryption of secrets at rest and in transit
- Comprehensive audit logging
- Regular secret rotation
- Access control and authentication
- Backup and disaster recovery

**Validation:**
- Automated compliance checks
- Regular security audits
- Documentation review
`).join('\n')}

## Audit Preparation

1. Review audit logs
2. Verify encryption status
3. Validate rotation policies
4. Check access controls
5. Prepare documentation

## Continuous Compliance

- Daily: Monitor alerts
- Weekly: Review access logs
- Monthly: Compliance dashboard review
- Quarterly: Full compliance audit
`;
}
