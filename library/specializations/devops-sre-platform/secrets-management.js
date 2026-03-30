/**
 * @process specializations/devops-sre-platform/secrets-management
 * @description Secrets Management Implementation - Comprehensive framework for implementing enterprise-grade
 * secrets management covering secret storage (Vault, AWS Secrets Manager), rotation policies, access controls,
 * encryption, audit logging, integration with CI/CD pipelines, runtime secret injection, certificate management,
 * disaster recovery, and compliance monitoring to ensure secure handling of sensitive credentials.
 * @inputs { projectName: string, secretsScope: string, platform?: string, environment?: string, services?: array }
 * @outputs { success: boolean, securityScore: number, secretsManaged: number, rotationPolicies: number, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/devops-sre-platform/secrets-management', {
 *   projectName: 'E-commerce Platform',
 *   secretsScope: 'full-stack', // 'application', 'infrastructure', 'full-stack'
 *   platform: 'vault', // 'vault', 'aws-secrets-manager', 'azure-key-vault', 'gcp-secret-manager'
 *   environment: 'production',
 *   services: ['api-gateway', 'payment-service', 'database', 'cache'],
 *   complianceRequirements: ['PCI-DSS', 'SOC2', 'HIPAA'],
 *   infrastructureType: 'kubernetes',
 *   enableAutoRotation: true,
 *   enableAuditLogging: true
 * });
 *
 * @references
 * - HashiCorp Vault Best Practices: https://learn.hashicorp.com/tutorials/vault/production-hardening
 * - AWS Secrets Manager: https://docs.aws.amazon.com/secretsmanager/
 * - OWASP Secrets Management Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html
 * - CIS Benchmark for Secrets Management: https://www.cisecurity.org/
 * - NIST Guidelines for Key Management: https://csrc.nist.gov/publications/detail/sp/800-57-part-1/rev-5/final
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    secretsScope = 'full-stack', // 'application', 'infrastructure', 'full-stack'
    platform = 'vault', // 'vault', 'aws-secrets-manager', 'azure-key-vault', 'gcp-secret-manager'
    environment = 'production',
    services = [],
    complianceRequirements = [],
    infrastructureType = 'kubernetes', // 'kubernetes', 'vm', 'serverless', 'hybrid'
    enableAutoRotation = true,
    enableAuditLogging = true,
    enableEncryptionAtRest = true,
    enableEncryptionInTransit = true,
    rotationIntervalDays = 90,
    outputDir = 'secrets-management-output',
    integrateCICD = true,
    enableCertificateManagement = true,
    accessControlModel = 'rbac', // 'rbac', 'abac', 'policy-based'
    backupStrategy = 'multi-region'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let securityScore = 0;
  let secretsManaged = 0;
  let rotationPolicies = 0;
  const implementations = [];

  ctx.log('info', `Starting Secrets Management Implementation for ${projectName}`);
  ctx.log('info', `Platform: ${platform}, Environment: ${environment}, Scope: ${secretsScope}`);
  ctx.log('info', `Compliance: ${complianceRequirements.join(', ')}`);

  // ============================================================================
  // PHASE 1: ASSESS SECRETS MANAGEMENT REQUIREMENTS
  // ============================================================================

  ctx.log('info', 'Phase 1: Assessing secrets management requirements');

  const assessmentResult = await ctx.task(assessSecretsRequirementsTask, {
    projectName,
    secretsScope,
    environment,
    services,
    infrastructureType,
    complianceRequirements,
    platform,
    outputDir
  });

  artifacts.push(...assessmentResult.artifacts);
  secretsManaged = assessmentResult.secretsInventory.length;

  ctx.log('info', `Assessment complete - Identified ${secretsManaged} secrets across ${assessmentResult.secretTypes.length} types`);

  // Quality Gate: Requirements review
  await ctx.breakpoint({
    question: `Secrets management requirements assessed for ${projectName}. Identified ${secretsManaged} secrets of types: ${assessmentResult.secretTypes.join(', ')}. Review security requirements and compliance needs?`,
    title: 'Secrets Management Requirements Review',
    context: {
      runId: ctx.runId,
      assessment: {
        totalSecrets: secretsManaged,
        secretTypes: assessmentResult.secretTypes,
        complianceRequirements,
        riskLevel: assessmentResult.riskLevel,
        sensitiveDataCategories: assessmentResult.sensitiveDataCategories
      },
      files: assessmentResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 2: DEPLOY SECRETS MANAGEMENT PLATFORM
  // ============================================================================

  ctx.log('info', `Phase 2: Deploying ${platform} secrets management platform`);

  const platformDeployment = await ctx.task(deploySecretsPlatformTask, {
    projectName,
    platform,
    environment,
    infrastructureType,
    enableEncryptionAtRest,
    enableEncryptionInTransit,
    enableAuditLogging,
    backupStrategy,
    outputDir
  });

  implementations.push({
    phase: 'Secrets Platform Deployment',
    result: platformDeployment
  });

  artifacts.push(...platformDeployment.artifacts);

  ctx.log('info', `${platform} deployed - Status: ${platformDeployment.deployed ? 'Active' : 'Failed'}, High Availability: ${platformDeployment.highAvailability}`);

  // Quality Gate: Platform deployment verification
  if (!platformDeployment.deployed || !platformDeployment.initialized) {
    await ctx.breakpoint({
      question: `Secrets management platform deployment issue detected. Deployed: ${platformDeployment.deployed}, Initialized: ${platformDeployment.initialized}. Review deployment logs and fix issues before proceeding?`,
      title: 'Platform Deployment Verification',
      context: {
        runId: ctx.runId,
        deployment: {
          platform,
          deployed: platformDeployment.deployed,
          initialized: platformDeployment.initialized,
          highAvailability: platformDeployment.highAvailability,
          issues: platformDeployment.issues || []
        },
        files: platformDeployment.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 3: CONFIGURE ACCESS CONTROL AND AUTHENTICATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Configuring access control and authentication');

  const accessControlResult = await ctx.task(configureAccessControlTask, {
    projectName,
    platform,
    accessControlModel,
    services,
    infrastructureType,
    environment,
    complianceRequirements,
    outputDir
  });

  implementations.push({
    phase: 'Access Control Configuration',
    result: accessControlResult
  });

  artifacts.push(...accessControlResult.artifacts);

  ctx.log('info', `Access control configured - Policies: ${accessControlResult.policiesCreated}, Roles: ${accessControlResult.rolesCreated}, Auth methods: ${accessControlResult.authMethods.length}`);

  // Quality Gate: Access control review
  await ctx.breakpoint({
    question: `Access control configured with ${accessControlResult.policiesCreated} policies and ${accessControlResult.rolesCreated} roles. Review least-privilege access policies and authentication methods?`,
    title: 'Access Control Review',
    context: {
      runId: ctx.runId,
      accessControl: {
        model: accessControlModel,
        policiesCreated: accessControlResult.policiesCreated,
        rolesCreated: accessControlResult.rolesCreated,
        authMethods: accessControlResult.authMethods,
        leastPrivilegeEnforced: accessControlResult.leastPrivilegeEnforced
      },
      files: accessControlResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 4: MIGRATE SECRETS TO SECURE STORAGE
  // ============================================================================

  ctx.log('info', 'Phase 4: Migrating secrets to secure storage');

  const secretsMigration = await ctx.task(migrateSecretsTask, {
    projectName,
    platform,
    secretsInventory: assessmentResult.secretsInventory,
    platformDeployment,
    accessControlResult,
    environment,
    outputDir
  });

  implementations.push({
    phase: 'Secrets Migration',
    result: secretsMigration
  });

  artifacts.push(...secretsMigration.artifacts);

  ctx.log('info', `Secrets migration - Migrated: ${secretsMigration.secretsMigrated}/${secretsManaged}, Failed: ${secretsMigration.migrationFailures.length}`);

  // Quality Gate: Migration verification
  if (secretsMigration.migrationFailures.length > 0 || secretsMigration.secretsMigrated < secretsManaged) {
    await ctx.breakpoint({
      question: `Secrets migration incomplete. Migrated: ${secretsMigration.secretsMigrated}/${secretsManaged}. Failed migrations: ${secretsMigration.migrationFailures.length}. Review failures: ${secretsMigration.migrationFailures.map(f => f.secret).join(', ')}`,
      title: 'Secrets Migration Review',
      context: {
        runId: ctx.runId,
        migration: {
          totalSecrets: secretsManaged,
          migrated: secretsMigration.secretsMigrated,
          failed: secretsMigration.migrationFailures.length,
          failures: secretsMigration.migrationFailures,
          recommendation: 'Address migration failures before proceeding'
        },
        files: secretsMigration.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 5: IMPLEMENT SECRET ROTATION POLICIES
  // ============================================================================

  if (enableAutoRotation) {
    ctx.log('info', 'Phase 5: Implementing secret rotation policies');

    const rotationResult = await ctx.task(implementRotationPoliciesTask, {
      projectName,
      platform,
      secretsInventory: assessmentResult.secretsInventory,
      rotationIntervalDays,
      services,
      environment,
      outputDir
    });

    implementations.push({
      phase: 'Rotation Policies',
      result: rotationResult
    });

    artifacts.push(...rotationResult.artifacts);
    rotationPolicies = rotationResult.rotationPoliciesCreated;

    ctx.log('info', `Rotation policies implemented - ${rotationPolicies} policies, ${rotationResult.automatedRotations} automated rotations`);

    // Quality Gate: Rotation policy review
    await ctx.breakpoint({
      question: `Secret rotation policies configured. ${rotationPolicies} policies created, ${rotationResult.automatedRotations} automated rotations. Review rotation schedules and manual rotation requirements?`,
      title: 'Rotation Policy Review',
      context: {
        runId: ctx.runId,
        rotation: {
          policiesCreated: rotationPolicies,
          automatedRotations: rotationResult.automatedRotations,
          manualRotations: rotationResult.manualRotations,
          rotationInterval: `${rotationIntervalDays} days`,
          highRiskSecrets: rotationResult.highRiskSecrets
        },
        files: rotationResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 6: INTEGRATE WITH CI/CD PIPELINES
  // ============================================================================

  if (integrateCICD) {
    ctx.log('info', 'Phase 6: Integrating secrets management with CI/CD pipelines');

    const cicdIntegration = await ctx.task(integrateCICDTask, {
      projectName,
      platform,
      platformDeployment,
      services,
      infrastructureType,
      environment,
      outputDir
    });

    implementations.push({
      phase: 'CI/CD Integration',
      result: cicdIntegration
    });

    artifacts.push(...cicdIntegration.artifacts);

    ctx.log('info', `CI/CD integration complete - Pipelines integrated: ${cicdIntegration.pipelinesIntegrated}, Injection method: ${cicdIntegration.injectionMethod}`);

    // Quality Gate: CI/CD integration review
    await ctx.breakpoint({
      question: `CI/CD integration configured. ${cicdIntegration.pipelinesIntegrated} pipelines integrated using ${cicdIntegration.injectionMethod}. Verify secrets are injected securely and not logged in plain text?`,
      title: 'CI/CD Integration Review',
      context: {
        runId: ctx.runId,
        cicd: {
          pipelinesIntegrated: cicdIntegration.pipelinesIntegrated,
          injectionMethod: cicdIntegration.injectionMethod,
          secretsInLogs: cicdIntegration.secretsInLogs,
          maskedInLogs: cicdIntegration.maskedInLogs
        },
        files: cicdIntegration.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 7: IMPLEMENT RUNTIME SECRET INJECTION
  // ============================================================================

  ctx.log('info', 'Phase 7: Implementing runtime secret injection for applications');

  const runtimeInjection = await ctx.task(implementRuntimeInjectionTask, {
    projectName,
    platform,
    platformDeployment,
    services,
    infrastructureType,
    environment,
    outputDir
  });

  implementations.push({
    phase: 'Runtime Secret Injection',
    result: runtimeInjection
  });

  artifacts.push(...runtimeInjection.artifacts);

  ctx.log('info', `Runtime injection implemented - Services: ${runtimeInjection.servicesConfigured}, Method: ${runtimeInjection.injectionMethod}`);

  // Quality Gate: Runtime injection review
  await ctx.breakpoint({
    question: `Runtime secret injection configured for ${runtimeInjection.servicesConfigured} services using ${runtimeInjection.injectionMethod}. Verify secrets are never stored on disk in plain text?`,
    title: 'Runtime Injection Review',
    context: {
      runId: ctx.runId,
      runtime: {
        servicesConfigured: runtimeInjection.servicesConfigured,
        injectionMethod: runtimeInjection.injectionMethod,
        secretsOnDisk: runtimeInjection.secretsOnDisk,
        inMemoryOnly: runtimeInjection.inMemoryOnly,
        encryptedAtRest: runtimeInjection.encryptedAtRest
      },
      files: runtimeInjection.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 8: CONFIGURE AUDIT LOGGING AND MONITORING
  // ============================================================================

  if (enableAuditLogging) {
    ctx.log('info', 'Phase 8: Configuring audit logging and monitoring');

    const auditLogging = await ctx.task(configureAuditLoggingTask, {
      projectName,
      platform,
      platformDeployment,
      complianceRequirements,
      environment,
      outputDir
    });

    implementations.push({
      phase: 'Audit Logging',
      result: auditLogging
    });

    artifacts.push(...auditLogging.artifacts);

    ctx.log('info', `Audit logging configured - Events logged: ${auditLogging.auditEventsCount}, SIEM integrated: ${auditLogging.siemIntegrated}`);

    // Quality Gate: Audit logging review
    await ctx.breakpoint({
      question: `Audit logging configured. ${auditLogging.auditEventsCount} event types monitored. SIEM integration: ${auditLogging.siemIntegrated}. Review audit log retention and alerting thresholds?`,
      title: 'Audit Logging Review',
      context: {
        runId: ctx.runId,
        audit: {
          auditEventsCount: auditLogging.auditEventsCount,
          siemIntegrated: auditLogging.siemIntegrated,
          retentionDays: auditLogging.retentionDays,
          alertsConfigured: auditLogging.alertsConfigured,
          criticalEvents: auditLogging.criticalEvents
        },
        files: auditLogging.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 9: IMPLEMENT CERTIFICATE MANAGEMENT
  // ============================================================================

  if (enableCertificateManagement) {
    ctx.log('info', 'Phase 9: Implementing certificate management');

    const certManagement = await ctx.task(implementCertificateManagementTask, {
      projectName,
      platform,
      platformDeployment,
      services,
      infrastructureType,
      environment,
      outputDir
    });

    implementations.push({
      phase: 'Certificate Management',
      result: certManagement
    });

    artifacts.push(...certManagement.artifacts);

    ctx.log('info', `Certificate management configured - PKI enabled: ${certManagement.pkiEnabled}, Auto-renewal: ${certManagement.autoRenewalEnabled}`);

    // Quality Gate: Certificate management review
    await ctx.breakpoint({
      question: `Certificate management configured. PKI: ${certManagement.pkiEnabled}, Certificates managed: ${certManagement.certificatesManaged}, Auto-renewal: ${certManagement.autoRenewalEnabled}. Review certificate expiration policies?`,
      title: 'Certificate Management Review',
      context: {
        runId: ctx.runId,
        certificates: {
          pkiEnabled: certManagement.pkiEnabled,
          certificatesManaged: certManagement.certificatesManaged,
          autoRenewalEnabled: certManagement.autoRenewalEnabled,
          expirationMonitoring: certManagement.expirationMonitoring
        },
        files: certManagement.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 10: IMPLEMENT BACKUP AND DISASTER RECOVERY
  // ============================================================================

  ctx.log('info', 'Phase 10: Implementing backup and disaster recovery');

  const backupDR = await ctx.task(implementBackupDRTask, {
    projectName,
    platform,
    platformDeployment,
    backupStrategy,
    environment,
    outputDir
  });

  implementations.push({
    phase: 'Backup and Disaster Recovery',
    result: backupDR
  });

  artifacts.push(...backupDR.artifacts);

  ctx.log('info', `Backup and DR configured - Strategy: ${backupDR.strategy}, RPO: ${backupDR.rpo}, RTO: ${backupDR.rto}`);

  // Quality Gate: Backup and DR review
  await ctx.breakpoint({
    question: `Backup and disaster recovery configured. Strategy: ${backupDR.strategy}, RPO: ${backupDR.rpo}, RTO: ${backupDR.rto}. Verify backup encryption and test restore procedures?`,
    title: 'Backup and DR Review',
    context: {
      runId: ctx.runId,
      backupDR: {
        strategy: backupDR.strategy,
        rpo: backupDR.rpo,
        rto: backupDR.rto,
        backupEncrypted: backupDR.backupEncrypted,
        multiRegion: backupDR.multiRegion,
        restoreTested: backupDR.restoreTested
      },
      files: backupDR.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 11: CONDUCT SECURITY TESTING AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 11: Conducting security testing and validation');

  const securityTesting = await ctx.task(conductSecurityTestingTask, {
    projectName,
    platform,
    implementations,
    secretsInventory: assessmentResult.secretsInventory,
    complianceRequirements,
    environment,
    outputDir
  });

  artifacts.push(...securityTesting.artifacts);

  ctx.log('info', `Security testing complete - Tests passed: ${securityTesting.testsPassed}/${securityTesting.testsTotal}, Vulnerabilities: ${securityTesting.vulnerabilities.length}`);

  // Quality Gate: Security testing review
  if (securityTesting.criticalVulnerabilities > 0 || securityTesting.testsFailed > 0) {
    await ctx.breakpoint({
      question: `Security testing found ${securityTesting.criticalVulnerabilities} critical vulnerabilities and ${securityTesting.testsFailed} test failures. Review and remediate before proceeding to production?`,
      title: 'Security Testing Review',
      context: {
        runId: ctx.runId,
        security: {
          testsPassed: securityTesting.testsPassed,
          testsFailed: securityTesting.testsFailed,
          testsTotal: securityTesting.testsTotal,
          criticalVulnerabilities: securityTesting.criticalVulnerabilities,
          vulnerabilities: securityTesting.vulnerabilities.slice(0, 10)
        },
        files: securityTesting.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 12: GENERATE COMPLIANCE REPORTS
  // ============================================================================

  ctx.log('info', 'Phase 12: Generating compliance reports');

  const complianceReporting = await ctx.task(generateComplianceReportsTask, {
    projectName,
    platform,
    complianceRequirements,
    implementations,
    securityTesting,
    environment,
    outputDir
  });

  artifacts.push(...complianceReporting.artifacts);

  ctx.log('info', `Compliance reporting complete - ${complianceReporting.reportsGenerated} reports, Compliant: ${complianceReporting.compliant}`);

  // Quality Gate: Compliance review
  if (!complianceReporting.compliant) {
    await ctx.breakpoint({
      question: `Compliance validation failed. Non-compliant requirements: ${complianceReporting.nonCompliantItems.length}. Address compliance gaps: ${complianceReporting.nonCompliantItems.map(i => i.requirement).join(', ')}`,
      title: 'Compliance Review',
      context: {
        runId: ctx.runId,
        compliance: {
          compliant: complianceReporting.compliant,
          requirements: complianceRequirements,
          nonCompliantItems: complianceReporting.nonCompliantItems,
          recommendation: 'Address all compliance gaps before production deployment'
        },
        files: complianceReporting.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 13: CREATE OPERATIONAL DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 13: Creating operational documentation and runbooks');

  const documentation = await ctx.task(createOperationalDocumentationTask, {
    projectName,
    platform,
    implementations,
    secretsInventory: assessmentResult.secretsInventory,
    rotationPolicies,
    complianceRequirements,
    environment,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  ctx.log('info', `Documentation complete - Runbooks: ${documentation.runbooksCreated}, SOPs: ${documentation.sopsCreated}`);

  // ============================================================================
  // PHASE 14: CALCULATE SECURITY SCORE
  // ============================================================================

  ctx.log('info', 'Phase 14: Calculating security score and final assessment');

  const scoringResult = await ctx.task(calculateSecurityScoreTask, {
    projectName,
    platform,
    implementations,
    secretsManaged,
    rotationPolicies,
    securityTesting,
    complianceReporting,
    complianceRequirements,
    outputDir
  });

  securityScore = scoringResult.securityScore;
  artifacts.push(...scoringResult.artifacts);

  ctx.log('info', `Security Score: ${securityScore}/100 - ${scoringResult.verdict}`);

  // Final Breakpoint: Secrets management implementation complete
  await ctx.breakpoint({
    question: `Secrets Management Implementation Complete for ${projectName}. Security Score: ${securityScore}/100. ${secretsManaged} secrets secured, ${rotationPolicies} rotation policies. Ready for production?`,
    title: 'Final Secrets Management Review',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        platform,
        environment,
        securityScore,
        verdict: scoringResult.verdict,
        secretsManaged,
        rotationPolicies,
        encryptionAtRest: enableEncryptionAtRest,
        encryptionInTransit: enableEncryptionInTransit,
        auditLoggingEnabled: enableAuditLogging,
        complianceRequirements,
        compliant: complianceReporting.compliant
      },
      implementations: implementations.map(impl => ({
        phase: impl.phase,
        success: impl.result.success || impl.result.deployed || false
      })),
      security: {
        testsPassed: securityTesting.testsPassed,
        testsFailed: securityTesting.testsFailed,
        vulnerabilities: securityTesting.vulnerabilities.length,
        criticalVulnerabilities: securityTesting.criticalVulnerabilities
      },
      recommendation: scoringResult.recommendation,
      files: [
        { path: documentation.summaryPath, format: 'markdown', label: 'Secrets Management Summary' },
        { path: scoringResult.scorePath, format: 'json', label: 'Security Score Report' },
        { path: complianceReporting.complianceReportPath, format: 'markdown', label: 'Compliance Report' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    platform,
    environment,
    secretsScope,
    securityScore,
    verdict: scoringResult.verdict,
    productionReady: scoringResult.productionReady,
    secretsManaged,
    rotationPolicies,
    implementations: implementations.map(impl => ({
      phase: impl.phase,
      success: impl.result.success || impl.result.deployed || false,
      details: {
        deployed: impl.result.deployed,
        configured: impl.result.configured || impl.result.policiesCreated > 0 || false
      }
    })),
    security: {
      encryptionAtRest: enableEncryptionAtRest,
      encryptionInTransit: enableEncryptionInTransit,
      auditLoggingEnabled: enableAuditLogging,
      accessControlModel,
      testsPassed: securityTesting.testsPassed,
      testsFailed: securityTesting.testsFailed,
      vulnerabilities: securityTesting.vulnerabilities.length,
      criticalVulnerabilities: securityTesting.criticalVulnerabilities
    },
    compliance: {
      requirements: complianceRequirements,
      compliant: complianceReporting.compliant,
      reportsGenerated: complianceReporting.reportsGenerated,
      nonCompliantItems: complianceReporting.nonCompliantItems.length
    },
    rotation: {
      enabled: enableAutoRotation,
      policiesCreated: rotationPolicies,
      intervalDays: rotationIntervalDays,
      automatedRotations: enableAutoRotation ? implementations.find(i => i.phase === 'Rotation Policies')?.result.automatedRotations || 0 : 0
    },
    integration: {
      cicdIntegrated: integrateCICD,
      runtimeInjection: runtimeInjection.injectionMethod,
      servicesConfigured: runtimeInjection.servicesConfigured
    },
    backup: {
      strategy: backupDR.strategy,
      rpo: backupDR.rpo,
      rto: backupDR.rto,
      encrypted: backupDR.backupEncrypted,
      multiRegion: backupDR.multiRegion
    },
    artifacts,
    documentation: {
      summaryPath: documentation.summaryPath,
      runbooksCreated: documentation.runbooksCreated,
      sopsCreated: documentation.sopsCreated,
      scorePath: scoringResult.scorePath
    },
    duration,
    metadata: {
      processId: 'specializations/devops-sre-platform/secrets-management',
      processSlug: 'secrets-management',
      category: 'Security & Compliance',
      specializationSlug: 'devops-sre-platform',
      timestamp: startTime,
      platform,
      infrastructureType,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Assess Secrets Requirements
export const assessSecretsRequirementsTask = defineTask('assess-secrets-requirements', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Assess Secrets Management Requirements - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Architect and Secrets Management Specialist',
      task: 'Assess secrets management requirements and inventory all secrets',
      context: {
        projectName: args.projectName,
        secretsScope: args.secretsScope,
        environment: args.environment,
        services: args.services,
        infrastructureType: args.infrastructureType,
        complianceRequirements: args.complianceRequirements,
        platform: args.platform,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Conduct comprehensive secrets inventory:',
        '   - Application secrets (API keys, OAuth tokens, service credentials)',
        '   - Database credentials (passwords, connection strings)',
        '   - Infrastructure secrets (SSH keys, cloud credentials, service accounts)',
        '   - Encryption keys (data encryption, TLS certificates)',
        '   - Third-party service credentials',
        '   - CI/CD pipeline secrets',
        '2. Classify secrets by type:',
        '   - Static secrets (long-lived credentials)',
        '   - Dynamic secrets (short-lived, auto-generated)',
        '   - Certificates and keys',
        '   - API tokens and OAuth credentials',
        '3. Assess current secret storage practices:',
        '   - Hardcoded secrets in code',
        '   - Secrets in configuration files',
        '   - Secrets in environment variables',
        '   - Secrets in CI/CD systems',
        '   - Secrets in container images',
        '4. Identify sensitive data categories (PII, payment data, health records)',
        '5. Assess security risks:',
        '   - Secrets exposure risk (high/medium/low)',
        '   - Rotation complexity',
        '   - Access control requirements',
        '   - Compliance obligations (PCI-DSS, HIPAA, SOC2, GDPR)',
        '6. Determine secret lifecycle requirements:',
        '   - Creation and onboarding',
        '   - Rotation frequency',
        '   - Expiration policies',
        '   - Revocation process',
        '7. Identify dependencies and consumers for each secret',
        '8. Document current security gaps and vulnerabilities',
        '9. Create secrets inventory spreadsheet/document',
        '10. Generate requirements assessment report'
      ],
      outputFormat: 'JSON object with secrets assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'secretsInventory', 'secretTypes', 'riskLevel', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        secretsInventory: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['api-key', 'database-password', 'ssh-key', 'certificate', 'token', 'encryption-key', 'service-account', 'other'] },
              service: { type: 'string' },
              currentStorage: { type: 'string', enum: ['hardcoded', 'config-file', 'env-var', 'ci-cd', 'container-image', 'vault', 'unknown'] },
              rotationRequired: { type: 'boolean' },
              rotationComplexity: { type: 'string', enum: ['low', 'medium', 'high'] },
              riskLevel: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              consumers: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        secretTypes: { type: 'array', items: { type: 'string' } },
        totalSecrets: { type: 'number' },
        riskLevel: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
        sensitiveDataCategories: { type: 'array', items: { type: 'string' } },
        currentPractices: {
          type: 'object',
          properties: {
            hardcodedSecrets: { type: 'number' },
            configFileSecrets: { type: 'number' },
            envVarSecrets: { type: 'number' },
            vaultSecrets: { type: 'number' }
          }
        },
        securityGaps: { type: 'array', items: { type: 'string' } },
        complianceGaps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'secrets-management', 'assessment']
}));

// Phase 2: Deploy Secrets Platform
export const deploySecretsPlatformTask = defineTask('deploy-secrets-platform', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Deploy Secrets Management Platform - ${args.platform}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps Engineer specializing in secrets management platforms',
      task: 'Deploy and configure secrets management platform',
      context: {
        projectName: args.projectName,
        platform: args.platform,
        environment: args.environment,
        infrastructureType: args.infrastructureType,
        enableEncryptionAtRest: args.enableEncryptionAtRest,
        enableEncryptionInTransit: args.enableEncryptionInTransit,
        enableAuditLogging: args.enableAuditLogging,
        backupStrategy: args.backupStrategy,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Deploy secrets management platform based on choice:',
        '   - HashiCorp Vault: Deploy in HA mode with Consul/Raft storage',
        '   - AWS Secrets Manager: Configure service and KMS encryption',
        '   - Azure Key Vault: Create vault with HSM backing',
        '   - GCP Secret Manager: Configure project and enable API',
        '2. For HashiCorp Vault deployment:',
        '   - Deploy 3+ Vault servers for HA',
        '   - Configure storage backend (Consul, Raft, Integrated Storage)',
        '   - Initialize and unseal Vault',
        '   - Configure seal/unseal mechanism (auto-unseal with cloud KMS)',
        '   - Set up TLS certificates for Vault API',
        '   - Configure Vault agent for auto-auth',
        '3. For cloud-native platforms:',
        '   - Create service in appropriate region(s)',
        '   - Configure KMS keys for encryption',
        '   - Set up cross-region replication (if required)',
        '   - Configure VPC endpoints for private access',
        '4. Enable encryption at rest using KMS/HSM',
        '5. Enable encryption in transit (TLS 1.2+ only)',
        '6. Configure audit logging:',
        '   - Enable audit device (file, syslog, socket)',
        '   - Configure log rotation and retention',
        '   - Set up log aggregation/SIEM integration',
        '7. Implement high availability:',
        '   - Multi-node cluster',
        '   - Load balancer configuration',
        '   - Health checks and failover',
        '8. Configure backup and snapshot policies',
        '9. Set up monitoring and alerting',
        '10. Document platform architecture and endpoints',
        '11. Create disaster recovery runbook'
      ],
      outputFormat: 'JSON object with platform deployment details'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'deployed', 'initialized', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        deployed: { type: 'boolean' },
        initialized: { type: 'boolean' },
        platformVersion: { type: 'string' },
        endpoint: { type: 'string', description: 'Platform API endpoint' },
        highAvailability: { type: 'boolean' },
        clusterNodes: { type: 'number', description: 'Number of nodes in cluster' },
        encryptionAtRest: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            method: { type: 'string', description: 'KMS, HSM, etc.' },
            keyId: { type: 'string' }
          }
        },
        encryptionInTransit: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            tlsVersion: { type: 'string' }
          }
        },
        auditLogging: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            destination: { type: 'string' },
            retention: { type: 'string' }
          }
        },
        backupConfigured: { type: 'boolean' },
        monitoringEnabled: { type: 'boolean' },
        issues: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'secrets-management', 'deployment']
}));

// Phase 3: Configure Access Control
export const configureAccessControlTask = defineTask('configure-access-control', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Configure Access Control - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Engineer specializing in IAM and access control',
      task: 'Configure access control policies and authentication',
      context: {
        projectName: args.projectName,
        platform: args.platform,
        accessControlModel: args.accessControlModel,
        services: args.services,
        infrastructureType: args.infrastructureType,
        environment: args.environment,
        complianceRequirements: args.complianceRequirements,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure authentication methods:',
        '   - Kubernetes: Service Account tokens, JWT',
        '   - Cloud: IAM roles (AWS IAM, Azure AD, GCP IAM)',
        '   - Applications: AppRole, certificate-based auth',
        '   - Users: LDAP, OIDC, SAML',
        '   - CI/CD: Service accounts, workload identity',
        '2. Implement least-privilege access control:',
        '   - Create granular policies per service/application',
        '   - Separate read vs. write permissions',
        '   - Implement time-based access (TTL)',
        '   - Implement IP-based restrictions',
        '3. For HashiCorp Vault, configure:',
        '   - Policies: Define read/write/list/delete capabilities',
        '   - Roles: Map identities to policies',
        '   - Auth methods: Enable Kubernetes, AWS, Azure, GCP auth',
        '   - AppRole for applications',
        '   - Token TTLs and renewal policies',
        '4. For cloud platforms:',
        '   - IAM roles with minimal permissions',
        '   - Resource-based policies',
        '   - Service Control Policies (SCPs)',
        '5. Implement role-based access control (RBAC):',
        '   - Admin role: Full access',
        '   - Developer role: Read access to dev secrets',
        '   - CI/CD role: Read access to deployment secrets',
        '   - Application role: Read access to runtime secrets',
        '6. Configure multi-factor authentication (MFA) for admin access',
        '7. Implement break-glass procedures for emergency access',
        '8. Set up access request and approval workflows',
        '9. Configure audit trails for all access attempts',
        '10. Document access control matrix and policies',
        '11. Create access control review procedures'
      ],
      outputFormat: 'JSON object with access control configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'policiesCreated', 'rolesCreated', 'authMethods', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        policiesCreated: { type: 'number' },
        rolesCreated: { type: 'number' },
        authMethods: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              method: { type: 'string' },
              enabled: { type: 'boolean' },
              path: { type: 'string' }
            }
          }
        },
        leastPrivilegeEnforced: { type: 'boolean' },
        mfaEnabled: { type: 'boolean' },
        accessMatrix: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string' },
              permissions: { type: 'array', items: { type: 'string' } },
              scope: { type: 'string' }
            }
          }
        },
        breakGlassConfigured: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'secrets-management', 'access-control']
}));

// Phase 4: Migrate Secrets
export const migrateSecretsTask = defineTask('migrate-secrets', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Migrate Secrets to Secure Storage - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Secrets Migration Engineer',
      task: 'Migrate secrets from current storage to secure secrets management platform',
      context: {
        projectName: args.projectName,
        platform: args.platform,
        secretsInventory: args.secretsInventory,
        platformDeployment: args.platformDeployment,
        accessControlResult: args.accessControlResult,
        environment: args.environment,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Plan migration strategy:',
        '   - Prioritize critical secrets first',
        '   - Plan zero-downtime migration',
        '   - Create rollback plan',
        '2. For each secret in inventory:',
        '   - Validate secret format and encoding',
        '   - Remove any hardcoded secrets from code',
        '   - Store secret in secrets management platform',
        '   - Set appropriate ACLs and access policies',
        '   - Add metadata (created date, owner, rotation policy)',
        '3. Organize secrets hierarchically:',
        '   - By environment (prod, staging, dev)',
        '   - By service/application',
        '   - By secret type',
        '   - Example path: /prod/payment-service/database/password',
        '4. Handle special secret types:',
        '   - Database credentials: Store as structured data (username, password, host, port)',
        '   - API keys: Store with expiration date',
        '   - Certificates: Store cert, key, and chain',
        '   - SSH keys: Store private key with passphrase',
        '5. Implement versioning for secret updates',
        '6. For HashiCorp Vault:',
        '   - Enable KV v2 secrets engine',
        '   - Use namespaces for multi-tenancy',
        '   - Configure secret versioning and history',
        '7. Validate secret migration:',
        '   - Verify secret accessibility',
        '   - Test application connectivity with new secrets',
        '   - Verify access controls work',
        '8. Remove secrets from insecure locations:',
        '   - Delete hardcoded secrets in code',
        '   - Remove from configuration files',
        '   - Clean environment variables',
        '   - Revoke old credentials',
        '9. Track migration progress and failures',
        '10. Generate migration report'
      ],
      outputFormat: 'JSON object with migration results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'secretsMigrated', 'migrationFailures', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        secretsMigrated: { type: 'number' },
        totalSecrets: { type: 'number' },
        migrationFailures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              secret: { type: 'string' },
              reason: { type: 'string' },
              severity: { type: 'string' }
            }
          }
        },
        secretPaths: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              path: { type: 'string' },
              version: { type: 'number' }
            }
          }
        },
        insecureSecretsRemoved: { type: 'number' },
        versioningEnabled: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'secrets-management', 'migration']
}));

// Phase 5: Implement Rotation Policies
export const implementRotationPoliciesTask = defineTask('implement-rotation-policies', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Implement Secret Rotation Policies - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Secrets Lifecycle Management Specialist',
      task: 'Implement automated secret rotation policies',
      context: {
        projectName: args.projectName,
        platform: args.platform,
        secretsInventory: args.secretsInventory,
        rotationIntervalDays: args.rotationIntervalDays,
        services: args.services,
        environment: args.environment,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Classify secrets by rotation capability:',
        '   - Automatically rotatable (database passwords, API keys)',
        '   - Semi-automatic (requires app restart)',
        '   - Manual rotation (TLS certificates, SSH keys)',
        '2. Implement automatic rotation for database credentials:',
        '   - Vault database secrets engine',
        '   - Generate dynamic credentials with TTL',
        '   - Automatic credential rotation',
        '   - Zero-downtime rotation',
        '3. Configure rotation schedules:',
        '   - Critical secrets: 30-day rotation',
        '   - High-risk secrets: 90-day rotation',
        '   - Standard secrets: 180-day rotation',
        '   - Low-risk secrets: 365-day rotation',
        '4. Implement rotation workflows:',
        '   - Pre-rotation validation',
        '   - Generate new secret',
        '   - Update consumers with new secret',
        '   - Validate new secret works',
        '   - Revoke old secret after grace period',
        '   - Post-rotation verification',
        '5. For cloud platforms:',
        '   - AWS Secrets Manager: Enable automatic rotation Lambda',
        '   - Azure Key Vault: Configure rotation policies',
        '   - GCP Secret Manager: Set up Cloud Function rotation',
        '6. Implement rotation notifications:',
        '   - Alert before rotation (7 days notice)',
        '   - Notify on rotation completion',
        '   - Alert on rotation failure',
        '7. Configure grace period for old secrets (24-48 hours)',
        '8. Implement rollback mechanism for failed rotations',
        '9. Track rotation history and audit trail',
        '10. Create rotation runbooks for manual secrets',
        '11. Set up monitoring for rotation failures'
      ],
      outputFormat: 'JSON object with rotation policies'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'rotationPoliciesCreated', 'automatedRotations', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        rotationPoliciesCreated: { type: 'number' },
        automatedRotations: { type: 'number', description: 'Number of secrets with automatic rotation' },
        manualRotations: { type: 'number', description: 'Number of secrets requiring manual rotation' },
        rotationSchedules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              secret: { type: 'string' },
              intervalDays: { type: 'number' },
              automated: { type: 'boolean' },
              nextRotation: { type: 'string', description: 'ISO date' }
            }
          }
        },
        highRiskSecrets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              secret: { type: 'string' },
              riskLevel: { type: 'string' },
              lastRotated: { type: 'string' }
            }
          }
        },
        gracePeriodHours: { type: 'number' },
        notificationsConfigured: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'secrets-management', 'rotation']
}));

// Phase 6: Integrate CI/CD
export const integrateCICDTask = defineTask('integrate-cicd', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Integrate with CI/CD Pipelines - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CI/CD and Secrets Integration Specialist',
      task: 'Integrate secrets management with CI/CD pipelines',
      context: {
        projectName: args.projectName,
        platform: args.platform,
        platformDeployment: args.platformDeployment,
        services: args.services,
        infrastructureType: args.infrastructureType,
        environment: args.environment,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Identify CI/CD platforms in use:',
        '   - GitHub Actions',
        '   - GitLab CI',
        '   - Jenkins',
        '   - CircleCI',
        '   - Azure DevOps',
        '   - ArgoCD/Flux (GitOps)',
        '2. Configure authentication from CI/CD to secrets platform:',
        '   - GitHub Actions: OIDC federation with Vault/cloud',
        '   - GitLab CI: JWT authentication',
        '   - Jenkins: AppRole or service account',
        '   - Cloud CI/CD: Use workload identity',
        '3. Implement secret injection in pipelines:',
        '   - Vault Agent for auto-auth and template rendering',
        '   - Cloud provider CLI (aws secretsmanager, gcloud secrets)',
        '   - Kubernetes External Secrets Operator',
        '4. Remove hardcoded secrets from pipeline definitions:',
        '   - Scan .gitlab-ci.yml, .github/workflows, Jenkinsfile',
        '   - Replace with secret references',
        '   - Use secret masking in logs',
        '5. Implement just-in-time secret retrieval:',
        '   - Fetch secrets at pipeline runtime',
        '   - Short-lived credentials (1 hour TTL)',
        '   - Auto-revoke after pipeline completion',
        '6. Configure secret masking in CI/CD logs:',
        '   - Automatically redact secret values',
        '   - Prevent accidental exposure in logs',
        '7. Set up deployment secrets for each environment:',
        '   - Dev, staging, production separation',
        '   - Environment-specific secret paths',
        '8. Implement approval gates for production secrets access',
        '9. Configure audit logging for CI/CD secret access',
        '10. Test secret injection in pipeline',
        '11. Create CI/CD integration documentation'
      ],
      outputFormat: 'JSON object with CI/CD integration details'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'pipelinesIntegrated', 'injectionMethod', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        pipelinesIntegrated: { type: 'number' },
        cicdPlatforms: { type: 'array', items: { type: 'string' } },
        injectionMethod: { type: 'string', description: 'vault-agent, cli, external-secrets, etc.' },
        authenticationMethod: { type: 'string' },
        secretsInLogs: { type: 'boolean', description: 'Whether secrets appear in logs' },
        maskedInLogs: { type: 'boolean', description: 'Whether secrets are masked' },
        shortLivedCredentials: { type: 'boolean' },
        credentialTTL: { type: 'string', description: 'e.g., "1 hour"' },
        approvalGatesConfigured: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'secrets-management', 'cicd']
}));

// Phase 7: Implement Runtime Injection
export const implementRuntimeInjectionTask = defineTask('implement-runtime-injection', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Implement Runtime Secret Injection - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Application Security and Runtime Integration Engineer',
      task: 'Implement runtime secret injection for applications',
      context: {
        projectName: args.projectName,
        platform: args.platform,
        platformDeployment: args.platformDeployment,
        services: args.services,
        infrastructureType: args.infrastructureType,
        environment: args.environment,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Choose runtime injection method based on infrastructure:',
        '   - Kubernetes: Vault Agent Injector, External Secrets Operator, CSI Driver',
        '   - VMs: Vault Agent with templates',
        '   - Serverless: Environment variables from secrets manager',
        '   - Containers: Init container or sidecar pattern',
        '2. For Kubernetes with Vault:',
        '   - Deploy Vault Agent Injector',
        '   - Configure service accounts for pods',
        '   - Add annotations to pod specs for injection',
        '   - Inject secrets as files or env vars',
        '   - Use init container or sidecar mode',
        '3. For Kubernetes with External Secrets Operator:',
        '   - Deploy External Secrets Operator',
        '   - Create SecretStore referencing Vault/cloud',
        '   - Create ExternalSecret CRDs',
        '   - Sync secrets to Kubernetes Secrets',
        '   - Mount secrets in pods',
        '4. For VM-based applications:',
        '   - Install Vault Agent on VM',
        '   - Configure auto-auth with instance identity',
        '   - Use template to render config files',
        '   - Restart application when secrets change',
        '5. Implement secret caching and refresh:',
        '   - Cache secrets in memory (never disk)',
        '   - Refresh secrets before expiration',
        '   - Handle secret rotation gracefully',
        '6. Ensure secrets are never written to disk in plain text:',
        '   - Use tmpfs/memory volumes',
        '   - Encrypt if must write to disk',
        '   - Set strict file permissions (0600)',
        '7. Configure application to read secrets from injection point:',
        '   - Environment variables',
        '   - Mounted files (/vault/secrets)',
        '   - Application-native secret store',
        '8. Implement zero-trust network access:',
        '   - Authenticate every secret request',
        '   - Validate pod/service identity',
        '   - Use mutual TLS',
        '9. Test secret injection and application startup',
        '10. Monitor secret retrieval failures',
        '11. Document runtime injection architecture'
      ],
      outputFormat: 'JSON object with runtime injection details'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'servicesConfigured', 'injectionMethod', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        servicesConfigured: { type: 'number' },
        injectionMethod: { type: 'string', description: 'vault-agent-injector, external-secrets, csi-driver, etc.' },
        secretStorage: { type: 'string', enum: ['memory-only', 'encrypted-disk', 'tmpfs'] },
        secretsOnDisk: { type: 'boolean', description: 'Whether secrets are ever on disk in plain text' },
        inMemoryOnly: { type: 'boolean' },
        encryptedAtRest: { type: 'boolean' },
        secretRefresh: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            intervalSeconds: { type: 'number' }
          }
        },
        zeroTrustEnforced: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'secrets-management', 'runtime']
}));

// Phase 8: Configure Audit Logging
export const configureAuditLoggingTask = defineTask('configure-audit-logging', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Configure Audit Logging and Monitoring - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Operations and SIEM Specialist',
      task: 'Configure comprehensive audit logging and monitoring',
      context: {
        projectName: args.projectName,
        platform: args.platform,
        platformDeployment: args.platformDeployment,
        complianceRequirements: args.complianceRequirements,
        environment: args.environment,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Enable audit logging on secrets platform:',
        '   - Vault: Enable file or socket audit device',
        '   - AWS: CloudTrail for Secrets Manager',
        '   - Azure: Diagnostic settings for Key Vault',
        '   - GCP: Cloud Audit Logs',
        '2. Configure audit events to capture:',
        '   - Secret read/write/delete operations',
        '   - Access denied attempts',
        '   - Authentication events (success/failure)',
        '   - Policy changes',
        '   - Configuration changes',
        '   - Encryption key operations',
        '   - Secret rotation events',
        '3. Set log retention based on compliance:',
        '   - PCI-DSS: 1 year minimum',
        '   - HIPAA: 6 years',
        '   - SOC2: 1 year',
        '   - GDPR: As required by policy',
        '4. Integrate with SIEM/log aggregation:',
        '   - Splunk, ELK, Datadog, Sumo Logic',
        '   - Stream audit logs to SIEM',
        '   - Parse and index logs',
        '5. Create audit log dashboards:',
        '   - Secret access patterns',
        '   - Failed authentication attempts',
        '   - Unusual access patterns',
        '   - Secret modification timeline',
        '6. Configure alerting for security events:',
        '   - Multiple failed auth attempts',
        '   - Access to sensitive secrets',
        '   - Secret deletion',
        '   - Policy modifications',
        '   - Unusual access times/locations',
        '7. Implement anomaly detection:',
        '   - Unusual secret access patterns',
        '   - Access from new IP addresses',
        '   - Bulk secret retrieval',
        '8. Set up periodic audit log reviews',
        '9. Configure tamper-proof audit logs (write-once)',
        '10. Create audit report generation tools',
        '11. Document audit logging procedures'
      ],
      outputFormat: 'JSON object with audit logging configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'auditEventsCount', 'siemIntegrated', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        auditEventsCount: { type: 'number', description: 'Number of event types being logged' },
        auditEnabled: { type: 'boolean' },
        siemIntegrated: { type: 'boolean' },
        siemPlatform: { type: 'string' },
        retentionDays: { type: 'number' },
        tamperProof: { type: 'boolean' },
        alertsConfigured: { type: 'number' },
        criticalEvents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              event: { type: 'string' },
              alerting: { type: 'boolean' },
              severity: { type: 'string' }
            }
          }
        },
        dashboardUrl: { type: 'string' },
        anomalyDetection: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'secrets-management', 'audit']
}));

// Phase 9: Implement Certificate Management
export const implementCertificateManagementTask = defineTask('implement-certificate-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Implement Certificate Management - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'PKI and Certificate Management Specialist',
      task: 'Implement automated certificate lifecycle management',
      context: {
        projectName: args.projectName,
        platform: args.platform,
        platformDeployment: args.platformDeployment,
        services: args.services,
        infrastructureType: args.infrastructureType,
        environment: args.environment,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Set up PKI infrastructure:',
        '   - Vault PKI secrets engine (for Vault)',
        '   - AWS Certificate Manager',
        '   - Let\'s Encrypt with cert-manager (Kubernetes)',
        '   - Internal CA for internal services',
        '2. Configure certificate authorities:',
        '   - Root CA (offline, highly secured)',
        '   - Intermediate CA (operational)',
        '   - CA certificate hierarchy',
        '3. Implement certificate issuance:',
        '   - Automatic certificate generation',
        '   - CSR-based or automated',
        '   - Set appropriate validity periods',
        '   - Define allowed domains/SANs',
        '4. For Kubernetes with cert-manager:',
        '   - Deploy cert-manager',
        '   - Configure Issuer/ClusterIssuer',
        '   - Create Certificate resources',
        '   - Automated ingress TLS',
        '5. Implement certificate rotation:',
        '   - Auto-renew before expiration (30 days)',
        '   - Zero-downtime renewal',
        '   - Automatic deployment of new certs',
        '6. Monitor certificate expiration:',
        '   - Alert 30 days before expiration',
        '   - Alert 7 days before expiration',
        '   - Critical alert 24 hours before',
        '7. Implement certificate revocation:',
        '   - CRL (Certificate Revocation List)',
        '   - OCSP (Online Certificate Status Protocol)',
        '   - Emergency revocation procedures',
        '8. Configure certificate validation:',
        '   - Verify certificate chain',
        '   - Check revocation status',
        '   - Validate expiration dates',
        '9. Secure private key storage:',
        '   - Never export private keys',
        '   - Store in HSM if available',
        '   - Encrypt at rest',
        '10. Create certificate inventory',
        '11. Document PKI architecture and procedures'
      ],
      outputFormat: 'JSON object with certificate management details'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'pkiEnabled', 'certificatesManaged', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        pkiEnabled: { type: 'boolean' },
        pkiPlatform: { type: 'string' },
        certificatesManaged: { type: 'number' },
        autoRenewalEnabled: { type: 'boolean' },
        renewalWindowDays: { type: 'number' },
        expirationMonitoring: { type: 'boolean' },
        certificateAuthorities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['root', 'intermediate', 'issuing'] },
              validityYears: { type: 'number' }
            }
          }
        },
        revocationConfigured: { type: 'boolean' },
        privateKeyStorage: { type: 'string', enum: ['vault', 'hsm', 'kms'] },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'secrets-management', 'certificates']
}));

// Phase 10: Implement Backup and DR
export const implementBackupDRTask = defineTask('implement-backup-dr', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Implement Backup and Disaster Recovery - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Disaster Recovery and Business Continuity Specialist',
      task: 'Implement backup and disaster recovery for secrets',
      context: {
        projectName: args.projectName,
        platform: args.platform,
        platformDeployment: args.platformDeployment,
        backupStrategy: args.backupStrategy,
        environment: args.environment,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Configure automated backups:',
        '   - Vault: Raft snapshots or Consul snapshots',
        '   - Cloud platforms: Automated backups enabled',
        '   - Frequency: Daily full backups, hourly incrementals',
        '2. Implement backup strategy:',
        '   - Multi-region: Replicate to different region',
        '   - Multi-cloud: Backup to different cloud provider',
        '   - On-premises: Backup to separate data center',
        '3. Encrypt backups:',
        '   - Encrypt at rest using KMS',
        '   - Separate encryption keys from primary',
        '   - Store keys in different location',
        '4. Test backup restoration regularly:',
        '   - Monthly full restore test',
        '   - Validate data integrity',
        '   - Measure restore time (RTO)',
        '   - Document restore procedures',
        '5. Configure retention policies:',
        '   - Daily backups: 30 days',
        '   - Weekly backups: 90 days',
        '   - Monthly backups: 1 year',
        '   - Annual backups: 7 years (compliance)',
        '6. Implement high availability:',
        '   - Multi-node cluster',
        '   - Cross-region replication',
        '   - Automatic failover',
        '7. Define recovery objectives:',
        '   - RPO (Recovery Point Objective): < 1 hour',
        '   - RTO (Recovery Time Objective): < 4 hours',
        '8. Create disaster recovery runbook:',
        '   - Failover procedures',
        '   - Restore procedures',
        '   - Communication plan',
        '   - Contact information',
        '9. Implement disaster recovery testing:',
        '   - Quarterly DR drills',
        '   - Simulate complete failure',
        '   - Measure recovery time',
        '10. Configure monitoring for backup health',
        '11. Document backup and DR architecture'
      ],
      outputFormat: 'JSON object with backup and DR configuration'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'strategy', 'rpo', 'rto', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        strategy: { type: 'string', description: 'multi-region, multi-cloud, on-premises' },
        backupFrequency: { type: 'string' },
        rpo: { type: 'string', description: 'Recovery Point Objective (e.g., "1 hour")' },
        rto: { type: 'string', description: 'Recovery Time Objective (e.g., "4 hours")' },
        backupEncrypted: { type: 'boolean' },
        multiRegion: { type: 'boolean' },
        restoreTested: { type: 'boolean' },
        lastRestoreTest: { type: 'string', description: 'ISO date' },
        retentionPolicy: {
          type: 'object',
          properties: {
            dailyDays: { type: 'number' },
            weeklyDays: { type: 'number' },
            monthlyDays: { type: 'number' },
            yearlyYears: { type: 'number' }
          }
        },
        highAvailability: { type: 'boolean' },
        automaticFailover: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'secrets-management', 'backup']
}));

// Phase 11: Conduct Security Testing
export const conductSecurityTestingTask = defineTask('conduct-security-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 11: Conduct Security Testing - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Testing and Penetration Testing Specialist',
      task: 'Conduct comprehensive security testing of secrets management implementation',
      context: {
        projectName: args.projectName,
        platform: args.platform,
        implementations: args.implementations,
        secretsInventory: args.secretsInventory,
        complianceRequirements: args.complianceRequirements,
        environment: args.environment,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Test authentication and authorization:',
        '   - Verify least-privilege access works',
        '   - Test unauthorized access is denied',
        '   - Test role-based access control',
        '   - Test MFA for admin access',
        '   - Attempt privilege escalation',
        '2. Test secret encryption:',
        '   - Verify encryption at rest',
        '   - Verify encryption in transit (TLS 1.2+)',
        '   - Test encryption key rotation',
        '3. Test secret injection security:',
        '   - Verify secrets not in logs',
        '   - Verify secrets not on disk in plain text',
        '   - Verify secrets not in environment dumps',
        '   - Test runtime injection works correctly',
        '4. Test secret rotation:',
        '   - Trigger manual rotation',
        '   - Verify automatic rotation works',
        '   - Test zero-downtime rotation',
        '   - Verify old secrets revoked',
        '5. Test audit logging:',
        '   - Verify all access logged',
        '   - Test log immutability',
        '   - Verify alerting works',
        '6. Test disaster recovery:',
        '   - Perform backup restore',
        '   - Test failover procedures',
        '   - Measure RTO/RPO',
        '7. Scan for vulnerabilities:',
        '   - Secrets in code repositories (git-secrets, truffleHog)',
        '   - Secrets in container images',
        '   - Secrets in configuration files',
        '   - Hardcoded credentials',
        '8. Test compliance requirements:',
        '   - PCI-DSS key management',
        '   - HIPAA encryption requirements',
        '   - SOC2 access controls',
        '9. Penetration testing:',
        '   - Attempt to bypass access controls',
        '   - Test for injection vulnerabilities',
        '   - Test API security',
        '10. Generate security test report with findings',
        '11. Prioritize vulnerabilities by severity'
      ],
      outputFormat: 'JSON object with security testing results'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'testsPassed', 'testsFailed', 'testsTotal', 'vulnerabilities', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        testsPassed: { type: 'number' },
        testsFailed: { type: 'number' },
        testsTotal: { type: 'number' },
        testResults: {
          type: 'object',
          properties: {
            authenticationTests: { type: 'number' },
            encryptionTests: { type: 'number' },
            injectionTests: { type: 'number' },
            rotationTests: { type: 'number' },
            auditTests: { type: 'number' },
            drTests: { type: 'number' },
            complianceTests: { type: 'number' }
          }
        },
        vulnerabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'info'] },
              description: { type: 'string' },
              remediation: { type: 'string' }
            }
          }
        },
        criticalVulnerabilities: { type: 'number' },
        secretsFoundInCode: { type: 'number' },
        secretsFoundInLogs: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'secrets-management', 'security-testing']
}));

// Phase 12: Generate Compliance Reports
export const generateComplianceReportsTask = defineTask('generate-compliance-reports', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 12: Generate Compliance Reports - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Compliance and Governance Specialist',
      task: 'Generate compliance reports for required standards',
      context: {
        projectName: args.projectName,
        platform: args.platform,
        complianceRequirements: args.complianceRequirements,
        implementations: args.implementations,
        securityTesting: args.securityTesting,
        environment: args.environment,
        outputDir: args.outputDir
      },
      instructions: [
        '1. For each compliance requirement, assess implementation:',
        '   - PCI-DSS Requirements:',
        '     * 3.4: Encrypt transmission of cardholder data',
        '     * 3.5: Protect keys used for encryption',
        '     * 3.6: Key management processes',
        '     * 8.2: Unique authentication credentials',
        '     * 10.2: Audit trails for access',
        '   - HIPAA Requirements:',
        '     * 164.312(a)(2)(iv): Encryption and decryption',
        '     * 164.312(c)(1): Integrity controls',
        '     * 164.308(a)(4): Access authorization',
        '   - SOC2 Requirements:',
        '     * CC6.1: Logical and physical access controls',
        '     * CC6.6: Encryption of confidential information',
        '     * CC6.7: Restriction of access to sensitive data',
        '   - GDPR Requirements:',
        '     * Article 32: Security of processing (encryption)',
        '2. Validate each control is implemented:',
        '   - Access controls implemented',
        '   - Encryption at rest configured',
        '   - Encryption in transit configured',
        '   - Audit logging enabled',
        '   - Secret rotation configured',
        '   - Backup and DR implemented',
        '3. Generate compliance matrix:',
        '   - Requirement vs. Implementation mapping',
        '   - Evidence of compliance',
        '   - Gaps and remediation plans',
        '4. Collect evidence:',
        '   - Configuration screenshots',
        '   - Audit log samples',
        '   - Access control policies',
        '   - Encryption certificates',
        '   - Rotation schedules',
        '5. Generate compliance reports for each standard',
        '6. Identify non-compliant items and remediation steps',
        '7. Create executive summary of compliance status',
        '8. Document compliance monitoring procedures',
        '9. Set up continuous compliance monitoring',
        '10. Schedule compliance audits and reviews'
      ],
      outputFormat: 'JSON object with compliance assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'compliant', 'reportsGenerated', 'complianceReportPath', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        compliant: { type: 'boolean', description: 'Overall compliance status' },
        reportsGenerated: { type: 'number' },
        complianceReportPath: { type: 'string' },
        complianceMatrix: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              standard: { type: 'string' },
              requirement: { type: 'string' },
              implemented: { type: 'boolean' },
              evidence: { type: 'string' },
              notes: { type: 'string' }
            }
          }
        },
        nonCompliantItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              requirement: { type: 'string' },
              gap: { type: 'string' },
              remediation: { type: 'string' },
              priority: { type: 'string' }
            }
          }
        },
        complianceScores: {
          type: 'object',
          properties: {
            'pci-dss': { type: 'number' },
            'hipaa': { type: 'number' },
            'soc2': { type: 'number' },
            'gdpr': { type: 'number' }
          }
        },
        executiveSummary: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'secrets-management', 'compliance']
}));

// Phase 13: Create Operational Documentation
export const createOperationalDocumentationTask = defineTask('create-operational-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 13: Create Operational Documentation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical Writer and SRE Documentation Specialist',
      task: 'Create comprehensive operational documentation and runbooks',
      context: {
        projectName: args.projectName,
        platform: args.platform,
        implementations: args.implementations,
        secretsInventory: args.secretsInventory,
        rotationPolicies: args.rotationPolicies,
        complianceRequirements: args.complianceRequirements,
        environment: args.environment,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create secrets management overview document:',
        '   - Architecture diagram',
        '   - Platform components',
        '   - Authentication and authorization flow',
        '   - Secret injection methods',
        '2. Document access procedures:',
        '   - How to request access',
        '   - Access approval workflow',
        '   - Emergency access procedures',
        '   - Access revocation',
        '3. Create operational runbooks:',
        '   - Adding a new secret',
        '   - Rotating a secret',
        '   - Revoking a secret',
        '   - Handling secret compromise',
        '   - Platform backup and restore',
        '   - Disaster recovery procedures',
        '   - Troubleshooting common issues',
        '4. Document integration guides:',
        '   - CI/CD pipeline integration',
        '   - Application integration (SDKs, APIs)',
        '   - Kubernetes integration',
        '   - Cloud integration (AWS, Azure, GCP)',
        '5. Create developer guides:',
        '   - How to use secrets in applications',
        '   - Best practices for secret handling',
        '   - Secret naming conventions',
        '   - Code examples in various languages',
        '6. Document monitoring and alerting:',
        '   - Dashboards and metrics',
        '   - Alert definitions',
        '   - Alert response procedures',
        '7. Create compliance documentation:',
        '   - Compliance controls implemented',
        '   - Audit procedures',
        '   - Evidence collection',
        '8. Document maintenance procedures:',
        '   - Platform upgrades',
        '   - Certificate renewal',
        '   - Key rotation',
        '   - Backup verification',
        '9. Create security incident response plan:',
        '   - Secret compromise detection',
        '   - Incident escalation',
        '   - Remediation steps',
        '10. Generate FAQ and troubleshooting guide',
        '11. Create onboarding guide for new team members'
      ],
      outputFormat: 'JSON object with documentation paths'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'summaryPath', 'runbooksCreated', 'sopsCreated', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        summaryPath: { type: 'string', description: 'Main secrets management documentation' },
        architectureDiagramPath: { type: 'string' },
        runbooksCreated: { type: 'number' },
        sopsCreated: { type: 'number' },
        runbooks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              path: { type: 'string' },
              category: { type: 'string' }
            }
          }
        },
        developerGuidePath: { type: 'string' },
        troubleshootingGuidePath: { type: 'string' },
        complianceDocPath: { type: 'string' },
        incidentResponsePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'secrets-management', 'documentation']
}));

// Phase 14: Calculate Security Score
export const calculateSecurityScoreTask = defineTask('calculate-security-score', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 14: Calculate Security Score - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Security Assessment and Risk Analysis Specialist',
      task: 'Calculate security score and provide final assessment',
      context: {
        projectName: args.projectName,
        platform: args.platform,
        implementations: args.implementations,
        secretsManaged: args.secretsManaged,
        rotationPolicies: args.rotationPolicies,
        securityTesting: args.securityTesting,
        complianceReporting: args.complianceReporting,
        complianceRequirements: args.complianceRequirements,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Calculate weighted security score (0-100):',
        '   - Platform deployment and configuration (15% weight):',
        '     * High availability enabled',
        '     * Encryption at rest configured',
        '     * Encryption in transit enforced',
        '     * Audit logging enabled',
        '   - Access control and authentication (20% weight):',
        '     * Least-privilege policies implemented',
        '     * RBAC/ABAC configured',
        '     * MFA enabled for admin access',
        '     * Authentication methods secure',
        '   - Secret lifecycle management (20% weight):',
        '     * Secrets migrated from insecure storage',
        '     * Secret rotation policies configured',
        '     * Automated rotation enabled',
        '     * Secret versioning enabled',
        '   - Integration security (15% weight):',
        '     * CI/CD integration secure',
        '     * Runtime injection secure',
        '     * Secrets not in logs',
        '     * Secrets not on disk in plain text',
        '   - Monitoring and audit (15% weight):',
        '     * Comprehensive audit logging',
        '     * SIEM integration',
        '     * Security alerting configured',
        '     * Anomaly detection enabled',
        '   - Backup and disaster recovery (10% weight):',
        '     * Automated backups configured',
        '     * Multi-region/multi-cloud backup',
        '     * Backup encryption enabled',
        '     * DR tested regularly',
        '   - Compliance and testing (5% weight):',
        '     * Security testing passed',
        '     * No critical vulnerabilities',
        '     * Compliance requirements met',
        '     * Documentation complete',
        '2. Assess production readiness:',
        '   - Score >= 90: Production ready',
        '   - Score 75-89: Ready with minor improvements',
        '   - Score 60-74: Needs improvements',
        '   - Score < 60: Not ready for production',
        '3. Identify strengths and weaknesses',
        '4. Provide verdict (excellent/good/acceptable/needs-improvement)',
        '5. Generate actionable recommendations',
        '6. Assess security maturity level',
        '7. Identify critical risks and mitigations',
        '8. Create executive summary',
        '9. Generate final security assessment report'
      ],
      outputFormat: 'JSON object with security assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['securityScore', 'verdict', 'productionReady', 'recommendation', 'scorePath', 'artifacts'],
      properties: {
        securityScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            platformDeployment: { type: 'number' },
            accessControl: { type: 'number' },
            lifecycleManagement: { type: 'number' },
            integration: { type: 'number' },
            monitoring: { type: 'number' },
            backupDR: { type: 'number' },
            compliance: { type: 'number' }
          }
        },
        verdict: { type: 'string', enum: ['excellent', 'good', 'acceptable', 'needs-improvement'] },
        productionReady: { type: 'boolean' },
        maturityLevel: { type: 'string', enum: ['basic', 'intermediate', 'advanced', 'expert'] },
        strengths: { type: 'array', items: { type: 'string' } },
        weaknesses: { type: 'array', items: { type: 'string' } },
        criticalRisks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              impact: { type: 'string' },
              mitigation: { type: 'string' }
            }
          }
        },
        recommendation: { type: 'string' },
        executiveSummary: { type: 'string' },
        scorePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'secrets-management', 'assessment']
}));
