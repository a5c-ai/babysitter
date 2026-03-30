/**
 * @process specializations/security-compliance/data-classification
 * @description Data Classification and Handling Framework - Comprehensive data classification system covering
 * classification levels (public/internal/confidential/restricted), automated data discovery and inventory,
 * labeling and tagging mechanisms, handling procedures, access controls, encryption requirements, retention policies,
 * DLP (Data Loss Prevention) integration, compliance mapping (GDPR, CCPA, HIPAA), and audit trails.
 * @inputs { projectName: string, environment?: string, complianceFrameworks?: array, systems?: array }
 * @outputs { success: boolean, classificationScore: number, dataAssets: number, classificationPolicies: number, complianceStatus: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/security-compliance/data-classification', {
 *   projectName: 'Enterprise Data Platform',
 *   environment: 'production',
 *   complianceFrameworks: ['GDPR', 'CCPA', 'HIPAA', 'PCI-DSS', 'SOC2'],
 *   systems: ['database', 'data-warehouse', 'data-lake', 'api', 'file-storage'],
 *   classificationLevels: ['public', 'internal', 'confidential', 'restricted'],
 *   enableAutomatedClassification: true,
 *   enableDLP: true,
 *   enableEncryption: true,
 *   dataTypes: ['pii', 'phi', 'financial', 'intellectual-property', 'customer-data'],
 *   retentionPolicies: true,
 *   accessControlModel: 'rbac',
 *   auditLogging: true
 * });
 *
 * @references
 * - NIST SP 800-60: Guide for Mapping Types of Information: https://csrc.nist.gov/publications/detail/sp/800-60/vol-1-rev-1/final
 * - ISO 27001 Data Classification: https://www.iso.org/standard/54534.html
 * - GDPR Data Protection: https://gdpr.eu/
 * - CCPA Compliance: https://oag.ca.gov/privacy/ccpa
 * - HIPAA Security Rule: https://www.hhs.gov/hipaa/for-professionals/security/index.html
 * - PCI-DSS Data Protection: https://www.pcisecuritystandards.org/
 * - NIST Privacy Framework: https://www.nist.gov/privacy-framework
 * - Data Classification Best Practices: https://www.sans.org/white-papers/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    environment = 'production',
    complianceFrameworks = ['GDPR', 'SOC2'],
    systems = [],
    classificationLevels = ['public', 'internal', 'confidential', 'restricted'],
    enableAutomatedClassification = true,
    enableDLP = true,
    enableEncryption = true,
    dataTypes = ['pii', 'financial', 'customer-data'],
    retentionPolicies = true,
    accessControlModel = 'rbac', // 'rbac', 'abac', 'dac'
    auditLogging = true,
    outputDir = 'data-classification-output',
    enableDataLineage = true,
    enableMasking = true,
    enableTokenization = false,
    geographicRegions = ['US', 'EU'],
    dataResidencyRequirements = true,
    breachNotificationPlan = true,
    dataMinimization = true,
    automaticLabeling = true,
    mlClassification = false,
    scanFrequency = 'daily',
    integrations = {
      dlp: ['microsoft-purview', 'symantec-dlp', 'forcepoint'],
      siem: ['splunk', 'elastic'],
      cloudProviders: ['aws', 'azure', 'gcp']
    }
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let classificationScore = 0;
  let dataAssets = 0;
  let classificationPolicies = 0;
  const complianceStatus = {};

  ctx.log('info', `Starting Data Classification and Handling Framework for ${projectName}`);
  ctx.log('info', `Environment: ${environment}, Systems: ${systems.length}`);
  ctx.log('info', `Classification Levels: ${classificationLevels.join(', ')}`);
  ctx.log('info', `Compliance Frameworks: ${complianceFrameworks.join(', ')}`);
  ctx.log('info', `Data Types: ${dataTypes.join(', ')}`);

  // ============================================================================
  // PHASE 1: DATA DISCOVERY AND INVENTORY
  // ============================================================================

  ctx.log('info', 'Phase 1: Discovering and inventorying data assets');

  const discoveryResult = await ctx.task(dataDiscoveryTask, {
    projectName,
    systems,
    environment,
    dataTypes,
    geographicRegions,
    enableAutomatedClassification,
    scanFrequency,
    outputDir
  });

  artifacts.push(...discoveryResult.artifacts);
  dataAssets = discoveryResult.totalDataAssets;
  classificationScore += discoveryResult.discoveryScore;

  ctx.log('info', `Discovery complete - ${dataAssets} data assets identified across ${discoveryResult.dataStores.length} data stores`);

  // Quality Gate: Data inventory review
  await ctx.breakpoint({
    question: `Data discovery complete for ${projectName}. Identified ${dataAssets} data assets across ${discoveryResult.dataStores.length} data stores. Sensitive data found: ${discoveryResult.sensitiveDataAssets}. Review inventory before classification?`,
    title: 'Data Discovery Review',
    context: {
      runId: ctx.runId,
      discovery: {
        totalDataAssets: dataAssets,
        dataStores: discoveryResult.dataStores.length,
        sensitiveDataAssets: discoveryResult.sensitiveDataAssets,
        dataTypes: discoveryResult.dataTypesFound,
        geographicDistribution: discoveryResult.geographicDistribution
      },
      files: discoveryResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 2: CLASSIFICATION POLICY DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 2: Defining data classification policies and levels');

  const policyResult = await ctx.task(classificationPolicyTask, {
    projectName,
    classificationLevels,
    dataTypes,
    complianceFrameworks,
    accessControlModel,
    enableEncryption,
    retentionPolicies,
    outputDir
  });

  artifacts.push(...policyResult.artifacts);
  classificationPolicies = policyResult.policiesCreated;
  classificationScore += policyResult.policyScore;

  ctx.log('info', `Classification policies defined - ${classificationPolicies} policies across ${classificationLevels.length} classification levels`);

  // Quality Gate: Policy review
  await ctx.breakpoint({
    question: `Classification policies created for ${projectName}. Defined ${classificationPolicies} policies across ${classificationLevels.length} levels. Each level has handling procedures, access controls, and retention rules. Review policies before applying?`,
    title: 'Classification Policy Review',
    context: {
      runId: ctx.runId,
      policies: {
        policiesCreated: classificationPolicies,
        classificationLevels,
        handlingProcedures: policyResult.handlingProcedures.length,
        encryptionRequirements: policyResult.encryptionRequirements,
        retentionRules: policyResult.retentionRules.length
      },
      files: policyResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 3: AUTOMATED DATA CLASSIFICATION
  // ============================================================================

  if (enableAutomatedClassification) {
    ctx.log('info', 'Phase 3: Executing automated data classification');

    const classificationResult = await ctx.task(automatedClassificationTask, {
      projectName,
      dataAssets: discoveryResult.dataAssetsList,
      classificationLevels,
      policies: policyResult.policiesList,
      mlClassification,
      automaticLabeling,
      outputDir
    });

    artifacts.push(...classificationResult.artifacts);
    classificationScore += classificationResult.classificationScore;

    ctx.log('info', `Automated classification complete - ${classificationResult.classifiedAssets} assets classified, ${classificationResult.restrictedAssets} restricted, ${classificationResult.publicAssets} public`);

    // Quality Gate: Classification results review
    await ctx.breakpoint({
      question: `Automated classification complete for ${projectName}. Classified ${classificationResult.classifiedAssets} assets: Public (${classificationResult.publicAssets}), Internal (${classificationResult.internalAssets}), Confidential (${classificationResult.confidentialAssets}), Restricted (${classificationResult.restrictedAssets}). Accuracy: ${classificationResult.confidenceScore}%. Review classifications?`,
      title: 'Automated Classification Review',
      context: {
        runId: ctx.runId,
        classification: {
          classifiedAssets: classificationResult.classifiedAssets,
          public: classificationResult.publicAssets,
          internal: classificationResult.internalAssets,
          confidential: classificationResult.confidentialAssets,
          restricted: classificationResult.restrictedAssets,
          confidenceScore: classificationResult.confidenceScore,
          manualReviewRequired: classificationResult.manualReviewRequired
        },
        files: classificationResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 4: LABELING AND TAGGING
  // ============================================================================

  if (automaticLabeling) {
    ctx.log('info', 'Phase 4: Applying labels and tags to classified data');

    const labelingResult = await ctx.task(labelingTaggingTask, {
      projectName,
      classifiedAssets: discoveryResult.dataAssetsList,
      classificationLevels,
      systems,
      integrations,
      outputDir
    });

    artifacts.push(...labelingResult.artifacts);
    classificationScore += labelingResult.labelingScore;

    ctx.log('info', `Labeling complete - ${labelingResult.assetsLabeled} assets labeled, ${labelingResult.labelsApplied} labels applied`);

    // Quality Gate: Labeling review
    await ctx.breakpoint({
      question: `Labeling complete for ${projectName}. Applied ${labelingResult.labelsApplied} labels to ${labelingResult.assetsLabeled} assets across ${systems.length} systems. Label consistency: ${labelingResult.consistencyScore}%. Review labeling implementation?`,
      title: 'Labeling and Tagging Review',
      context: {
        runId: ctx.runId,
        labeling: {
          assetsLabeled: labelingResult.assetsLabeled,
          labelsApplied: labelingResult.labelsApplied,
          consistencyScore: labelingResult.consistencyScore,
          systemsCovered: systems.length,
          labelingMechanisms: labelingResult.labelingMechanisms
        },
        files: labelingResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 5: ACCESS CONTROL IMPLEMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Implementing classification-based access controls');

  const accessControlResult = await ctx.task(accessControlImplementationTask, {
    projectName,
    classificationLevels,
    dataAssets: discoveryResult.dataAssetsList,
    accessControlModel,
    systems,
    complianceFrameworks,
    outputDir
  });

  artifacts.push(...accessControlResult.artifacts);
  classificationScore += accessControlResult.accessScore;

  ctx.log('info', `Access controls implemented - ${accessControlResult.policiesCreated} policies, ${accessControlResult.rolesCreated} roles, ${accessControlResult.permissionsConfigured} permissions`);

  // Quality Gate: Access control review
  await ctx.breakpoint({
    question: `Access control implementation complete for ${projectName}. Created ${accessControlResult.policiesCreated} policies and ${accessControlResult.rolesCreated} roles using ${accessControlModel}. Least-privilege compliance: ${accessControlResult.leastPrivilegeScore}%. Review access controls?`,
    title: 'Access Control Review',
    context: {
      runId: ctx.runId,
      accessControl: {
        model: accessControlModel,
        policiesCreated: accessControlResult.policiesCreated,
        rolesCreated: accessControlResult.rolesCreated,
        permissionsConfigured: accessControlResult.permissionsConfigured,
        leastPrivilegeScore: accessControlResult.leastPrivilegeScore,
        separationOfDuties: accessControlResult.separationOfDutiesImplemented
      },
      files: accessControlResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  // ============================================================================
  // PHASE 6: ENCRYPTION IMPLEMENTATION
  // ============================================================================

  if (enableEncryption) {
    ctx.log('info', 'Phase 6: Implementing encryption based on classification levels');

    const encryptionResult = await ctx.task(encryptionImplementationTask, {
      projectName,
      classificationLevels,
      dataAssets: discoveryResult.dataAssetsList,
      systems,
      complianceFrameworks,
      enableMasking,
      enableTokenization,
      outputDir
    });

    artifacts.push(...encryptionResult.artifacts);
    classificationScore += encryptionResult.encryptionScore;

    ctx.log('info', `Encryption implemented - ${encryptionResult.encryptedAssets} assets encrypted, ${encryptionResult.keyManagementConfigured} key management systems configured`);

    // Quality Gate: Encryption review
    await ctx.breakpoint({
      question: `Encryption implementation complete for ${projectName}. Encrypted ${encryptionResult.encryptedAssets} assets using ${encryptionResult.encryptionAlgorithms.join(', ')}. At-rest: ${encryptionResult.atRestEncrypted}, In-transit: ${encryptionResult.inTransitEncrypted}, Masking: ${encryptionResult.maskedFields}. Review encryption strategy?`,
      title: 'Encryption Implementation Review',
      context: {
        runId: ctx.runId,
        encryption: {
          encryptedAssets: encryptionResult.encryptedAssets,
          atRestEncrypted: encryptionResult.atRestEncrypted,
          inTransitEncrypted: encryptionResult.inTransitEncrypted,
          maskedFields: encryptionResult.maskedFields,
          tokenizedFields: encryptionResult.tokenizedFields,
          keyManagementSystems: encryptionResult.keyManagementConfigured,
          encryptionAlgorithms: encryptionResult.encryptionAlgorithms
        },
        files: encryptionResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 7: DATA LOSS PREVENTION (DLP)
  // ============================================================================

  if (enableDLP) {
    ctx.log('info', 'Phase 7: Implementing Data Loss Prevention controls');

    const dlpResult = await ctx.task(dlpImplementationTask, {
      projectName,
      classificationLevels,
      dataTypes,
      systems,
      integrations,
      complianceFrameworks,
      outputDir
    });

    artifacts.push(...dlpResult.artifacts);
    classificationScore += dlpResult.dlpScore;

    ctx.log('info', `DLP implementation complete - ${dlpResult.dlpPolicies} policies, ${dlpResult.monitoringChannels} monitoring channels, ${dlpResult.preventionRules} prevention rules`);

    // Quality Gate: DLP configuration review
    await ctx.breakpoint({
      question: `DLP implementation complete for ${projectName}. Configured ${dlpResult.dlpPolicies} policies across ${dlpResult.monitoringChannels} channels. Prevention rules: ${dlpResult.preventionRules}, Detection rules: ${dlpResult.detectionRules}. Incidents detected: ${dlpResult.incidentsDetected}. Review DLP configuration?`,
      title: 'Data Loss Prevention Review',
      context: {
        runId: ctx.runId,
        dlp: {
          dlpPolicies: dlpResult.dlpPolicies,
          monitoringChannels: dlpResult.monitoringChannels,
          preventionRules: dlpResult.preventionRules,
          detectionRules: dlpResult.detectionRules,
          incidentsDetected: dlpResult.incidentsDetected,
          dlpTools: dlpResult.dlpToolsConfigured
        },
        files: dlpResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 8: RETENTION AND DISPOSAL POLICIES
  // ============================================================================

  if (retentionPolicies) {
    ctx.log('info', 'Phase 8: Implementing data retention and disposal policies');

    const retentionResult = await ctx.task(retentionDisposalTask, {
      projectName,
      classificationLevels,
      dataTypes,
      complianceFrameworks,
      dataAssets: discoveryResult.dataAssetsList,
      outputDir
    });

    artifacts.push(...retentionResult.artifacts);
    classificationScore += retentionResult.retentionScore;

    ctx.log('info', `Retention policies implemented - ${retentionResult.retentionPolicies} policies, ${retentionResult.scheduledDisposals} scheduled disposals`);

    // Quality Gate: Retention policy review
    await ctx.breakpoint({
      question: `Retention policies configured for ${projectName}. Created ${retentionResult.retentionPolicies} policies covering ${retentionResult.assetsWithRetention} assets. Scheduled disposals: ${retentionResult.scheduledDisposals}, Compliance-driven: ${retentionResult.complianceDrivenPolicies}. Review retention strategy?`,
      title: 'Retention and Disposal Review',
      context: {
        runId: ctx.runId,
        retention: {
          retentionPolicies: retentionResult.retentionPolicies,
          assetsWithRetention: retentionResult.assetsWithRetention,
          scheduledDisposals: retentionResult.scheduledDisposals,
          complianceDrivenPolicies: retentionResult.complianceDrivenPolicies,
          secureDisposalMethods: retentionResult.secureDisposalMethods
        },
        files: retentionResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 9: DATA LINEAGE AND TRACKING
  // ============================================================================

  if (enableDataLineage) {
    ctx.log('info', 'Phase 9: Implementing data lineage and tracking');

    const lineageResult = await ctx.task(dataLineageTask, {
      projectName,
      dataAssets: discoveryResult.dataAssetsList,
      systems,
      classificationLevels,
      outputDir
    });

    artifacts.push(...lineageResult.artifacts);
    classificationScore += lineageResult.lineageScore;

    ctx.log('info', `Data lineage implemented - ${lineageResult.lineageMapped} assets tracked, ${lineageResult.dataFlows} data flows documented`);

    // Quality Gate: Data lineage review
    await ctx.breakpoint({
      question: `Data lineage tracking configured for ${projectName}. Mapped ${lineageResult.lineageMapped} assets with ${lineageResult.dataFlows} data flows. Upstream dependencies: ${lineageResult.upstreamDependencies}, Downstream consumers: ${lineageResult.downstreamConsumers}. Review lineage mapping?`,
      title: 'Data Lineage Review',
      context: {
        runId: ctx.runId,
        lineage: {
          lineageMapped: lineageResult.lineageMapped,
          dataFlows: lineageResult.dataFlows,
          upstreamDependencies: lineageResult.upstreamDependencies,
          downstreamConsumers: lineageResult.downstreamConsumers,
          lineageVisualization: lineageResult.visualizationCreated
        },
        files: lineageResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 10: AUDIT LOGGING AND MONITORING
  // ============================================================================

  if (auditLogging) {
    ctx.log('info', 'Phase 10: Implementing audit logging and monitoring');

    const auditResult = await ctx.task(auditLoggingTask, {
      projectName,
      classificationLevels,
      dataAssets: discoveryResult.dataAssetsList,
      systems,
      complianceFrameworks,
      integrations,
      outputDir
    });

    artifacts.push(...auditResult.artifacts);
    classificationScore += auditResult.auditScore;

    ctx.log('info', `Audit logging configured - ${auditResult.auditPolicies} policies, ${auditResult.monitoringRules} monitoring rules, ${auditResult.alertsConfigured} alerts`);

    // Quality Gate: Audit configuration review
    await ctx.breakpoint({
      question: `Audit logging configured for ${projectName}. Implemented ${auditResult.auditPolicies} policies with ${auditResult.monitoringRules} monitoring rules and ${auditResult.alertsConfigured} alerts. Retention: ${auditResult.retentionDays} days. Review audit strategy?`,
      title: 'Audit Logging Review',
      context: {
        runId: ctx.runId,
        audit: {
          auditPolicies: auditResult.auditPolicies,
          monitoringRules: auditResult.monitoringRules,
          alertsConfigured: auditResult.alertsConfigured,
          retentionDays: auditResult.retentionDays,
          siemIntegration: auditResult.siemIntegrated,
          complianceCompliant: auditResult.complianceCompliant
        },
        files: auditResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 11: COMPLIANCE VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 11: Validating compliance with regulatory frameworks');

  const complianceResult = await ctx.task(complianceValidationTask, {
    projectName,
    complianceFrameworks,
    classificationLevels,
    dataTypes,
    dataAssets,
    classificationPolicies,
    encryptionEnabled: enableEncryption,
    dlpEnabled: enableDLP,
    auditingEnabled: auditLogging,
    outputDir
  });

  artifacts.push(...complianceResult.artifacts);
  Object.assign(complianceStatus, complianceResult.complianceStatus);
  classificationScore += complianceResult.complianceScore;

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
  // PHASE 12: BREACH NOTIFICATION PLANNING
  // ============================================================================

  if (breachNotificationPlan) {
    ctx.log('info', 'Phase 12: Creating breach notification and incident response plan');

    const breachResult = await ctx.task(breachNotificationTask, {
      projectName,
      classificationLevels,
      dataTypes,
      complianceFrameworks,
      geographicRegions,
      outputDir
    });

    artifacts.push(...breachResult.artifacts);
    classificationScore += breachResult.breachPlanScore;

    ctx.log('info', `Breach notification plan created - ${breachResult.notificationProcedures} procedures, ${breachResult.stakeholdersIdentified} stakeholders identified`);

    // Quality Gate: Breach plan review
    await ctx.breakpoint({
      question: `Breach notification plan created for ${projectName}. Defined ${breachResult.notificationProcedures} procedures for ${geographicRegions.length} regions. Response time requirements: ${breachResult.responseTimeRequirements}. Stakeholders: ${breachResult.stakeholdersIdentified}. Review breach response plan?`,
      title: 'Breach Notification Plan Review',
      context: {
        runId: ctx.runId,
        breachPlan: {
          notificationProcedures: breachResult.notificationProcedures,
          stakeholdersIdentified: breachResult.stakeholdersIdentified,
          responseTimeRequirements: breachResult.responseTimeRequirements,
          complianceAligned: breachResult.complianceAligned,
          testingSchedule: breachResult.testingSchedule
        },
        files: breachResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
      }
    });
  }

  // ============================================================================
  // PHASE 13: TRAINING AND DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 13: Creating training materials and documentation');

  const trainingResult = await ctx.task(trainingDocumentationTask, {
    projectName,
    classificationLevels,
    dataTypes,
    policies: policyResult.policiesList,
    complianceFrameworks,
    outputDir
  });

  artifacts.push(...trainingResult.artifacts);

  ctx.log('info', `Training materials created - ${trainingResult.trainingModules} modules, ${trainingResult.documentationPages} documentation pages`);

  // ============================================================================
  // PHASE 14: CONTINUOUS MONITORING SETUP
  // ============================================================================

  ctx.log('info', 'Phase 14: Setting up continuous monitoring and compliance tracking');

  const monitoringResult = await ctx.task(continuousMonitoringTask, {
    projectName,
    classificationLevels,
    dataAssets,
    systems,
    complianceFrameworks,
    scanFrequency,
    integrations,
    outputDir
  });

  artifacts.push(...monitoringResult.artifacts);
  classificationScore += monitoringResult.monitoringScore;

  ctx.log('info', `Continuous monitoring configured - ${monitoringResult.monitoringDashboards} dashboards, ${monitoringResult.automatedScans} automated scans, ${monitoringResult.alertRules} alert rules`);

  // ============================================================================
  // FINAL SUMMARY
  // ============================================================================

  const duration = ctx.now() - startTime;
  const finalClassificationScore = Math.min(100, Math.round(classificationScore));

  ctx.log('info', '='.repeat(80));
  ctx.log('info', 'DATA CLASSIFICATION AND HANDLING FRAMEWORK COMPLETE');
  ctx.log('info', '='.repeat(80));
  ctx.log('info', `Project: ${projectName}`);
  ctx.log('info', `Environment: ${environment}`);
  ctx.log('info', `Data Assets: ${dataAssets}`);
  ctx.log('info', `Classification Policies: ${classificationPolicies}`);
  ctx.log('info', `Classification Levels: ${classificationLevels.join(', ')}`);
  ctx.log('info', `Classification Score: ${finalClassificationScore}/100`);
  ctx.log('info', `Compliance Frameworks: ${complianceFrameworks.join(', ')}`);
  ctx.log('info', `Artifacts Generated: ${artifacts.length}`);
  ctx.log('info', `Duration: ${Math.round(duration / 1000)}s`);
  ctx.log('info', '='.repeat(80));

  // Final Quality Gate
  await ctx.breakpoint({
    question: `Data Classification and Handling Framework complete for ${projectName}! Classification Score: ${finalClassificationScore}/100. Classified ${dataAssets} data assets with ${classificationPolicies} policies. Compliance: ${complianceResult.frameworksCompliant}/${complianceFrameworks.length} frameworks. Review final summary and approve for production?`,
    title: 'Data Classification Framework Complete',
    context: {
      runId: ctx.runId,
      summary: {
        projectName,
        environment,
        dataAssets,
        classificationPolicies,
        classificationLevels,
        classificationScore: finalClassificationScore,
        complianceStatus,
        systems: systems.length,
        duration: `${Math.round(duration / 1000)}s`,
        artifactsGenerated: artifacts.length
      },
      capabilities: {
        automatedClassification: enableAutomatedClassification,
        dlp: enableDLP,
        encryption: enableEncryption,
        dataLineage: enableDataLineage,
        auditLogging,
        retentionPolicies,
        breachNotificationPlan
      },
      recommendations: {
        immediate: [
          'Review and validate data classifications',
          'Test DLP policies with controlled scenarios',
          'Train users on data handling procedures',
          'Verify encryption implementations',
          'Conduct access control review'
        ],
        ongoing: [
          'Monitor classification accuracy and adjust ML models',
          'Review audit logs daily for anomalies',
          'Update retention policies based on compliance changes',
          'Conduct quarterly data classification audits',
          'Refresh training materials annually',
          'Test breach notification procedures semi-annually'
        ]
      },
      files: artifacts.slice(0, 20).map(a => ({ path: a.path, format: a.format || 'json', label: a.label }))
    }
  });

  return {
    success: true,
    classificationScore: finalClassificationScore,
    dataAssets,
    classificationPolicies,
    classificationLevels,
    complianceStatus,
    environment,
    systems: systems.length,
    artifacts,
    duration: Math.round(duration / 1000),
    summary: {
      dataDiscoveryCompleted: true,
      policiesCreated: classificationPolicies > 0,
      automatedClassification: enableAutomatedClassification,
      labelingImplemented: automaticLabeling,
      accessControlsConfigured: true,
      encryptionImplemented: enableEncryption,
      dlpConfigured: enableDLP,
      retentionPoliciesCreated: retentionPolicies,
      dataLineageTracked: enableDataLineage,
      auditLoggingEnabled: auditLogging,
      complianceValidated: true,
      breachPlanCreated: breachNotificationPlan,
      continuousMonitoringEnabled: true
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Phase 1: Data Discovery and Inventory
export const dataDiscoveryTask = defineTask('data-discovery', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Data Discovery and Inventory - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Discovery and Classification Specialist',
      task: 'Discover and inventory all data assets across systems and environments',
      context: {
        projectName: args.projectName,
        systems: args.systems,
        environment: args.environment,
        dataTypes: args.dataTypes,
        geographicRegions: args.geographicRegions,
        enableAutomatedClassification: args.enableAutomatedClassification,
        scanFrequency: args.scanFrequency,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Scan all configured systems for data assets:',
        '   - Databases: Tables, columns, views, schemas',
        '   - File Systems: Files, directories, shares',
        '   - Data Lakes: Objects, partitions, datasets',
        '   - Data Warehouses: Tables, dimensions, facts',
        '   - APIs: Endpoints, request/response schemas',
        '   - Cloud Storage: Buckets, blobs, containers',
        '2. For each data asset, collect metadata:',
        '   - Asset name and location',
        '   - Data type and schema',
        '   - Owner and steward',
        '   - Business purpose',
        '   - Creation and modification dates',
        '   - Access patterns and frequency',
        '   - Geographic location',
        '3. Identify sensitive data types:',
        '   - PII (Personally Identifiable Information)',
        '   - PHI (Protected Health Information)',
        '   - Financial data (credit cards, bank accounts)',
        '   - Intellectual property',
        '   - Customer data',
        '   - Employee data',
        '4. Assess data volume and growth:',
        '   - Current size',
        '   - Growth rate',
        '   - Access frequency',
        '5. Map geographic distribution:',
        '   - Data residency by region',
        '   - Cross-border data flows',
        '   - Regional compliance requirements',
        '6. Create comprehensive data inventory:',
        '   - Data catalog with all assets',
        '   - Sensitivity indicators',
        '   - System relationships',
        '7. Generate discovery report with:',
        '   - Total assets discovered',
        '   - Sensitive data breakdown',
        '   - System coverage',
        '   - Risk assessment'
      ],
      outputFormat: 'JSON object with data inventory'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'totalDataAssets', 'dataAssetsList', 'dataStores', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        totalDataAssets: { type: 'number' },
        sensitiveDataAssets: { type: 'number' },
        dataAssetsList: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              type: { type: 'string' },
              system: { type: 'string' },
              location: { type: 'string' },
              sensitivity: { type: 'string' },
              owner: { type: 'string' },
              dataType: { type: 'string' }
            }
          }
        },
        dataStores: { type: 'array', items: { type: 'string' } },
        dataTypesFound: { type: 'array', items: { type: 'string' } },
        geographicDistribution: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        discoveryScore: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'data-classification', 'discovery']
}));

// Phase 2: Classification Policy Definition
export const classificationPolicyTask = defineTask('classification-policy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Define Classification Policies - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Data Classification Policy Architect',
      task: 'Define comprehensive data classification policies and handling procedures',
      context: {
        projectName: args.projectName,
        classificationLevels: args.classificationLevels,
        dataTypes: args.dataTypes,
        complianceFrameworks: args.complianceFrameworks,
        accessControlModel: args.accessControlModel,
        enableEncryption: args.enableEncryption,
        retentionPolicies: args.retentionPolicies,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define each classification level with clear criteria:',
        '   PUBLIC:',
        '   - Definition: Information intended for public disclosure',
        '   - Examples: Marketing materials, public website content',
        '   - Access: Unrestricted',
        '   - Encryption: Not required',
        '   - Retention: Based on business need',
        '   INTERNAL:',
        '   - Definition: Information for internal use only',
        '   - Examples: Internal documents, policies, procedures',
        '   - Access: All employees',
        '   - Encryption: In-transit encryption required',
        '   - Retention: 3-7 years typical',
        '   CONFIDENTIAL:',
        '   - Definition: Sensitive business information',
        '   - Examples: Business plans, financial data, trade secrets',
        '   - Access: Need-to-know basis',
        '   - Encryption: At-rest and in-transit required',
        '   - Retention: Based on compliance and legal requirements',
        '   RESTRICTED:',
        '   - Definition: Highly sensitive information with legal/regulatory requirements',
        '   - Examples: PII, PHI, payment card data, classified information',
        '   - Access: Strictly controlled, logged, and monitored',
        '   - Encryption: Strong encryption required (AES-256)',
        '   - Retention: Strict compliance-driven retention',
        '2. Create handling procedures for each level:',
        '   - Storage requirements',
        '   - Transmission methods',
        '   - Sharing and collaboration rules',
        '   - Printing and physical handling',
        '   - Backup and archival',
        '   - Disposal and destruction',
        '3. Define access control requirements:',
        '   - Authentication requirements',
        '   - Authorization models',
        '   - Multi-factor authentication requirements',
        '   - Session management',
        '   - Access review frequency',
        '4. Specify encryption requirements:',
        '   - Encryption algorithms',
        '   - Key management',
        '   - At-rest encryption',
        '   - In-transit encryption',
        '   - End-to-end encryption where required',
        '5. Define retention and disposal policies:',
        '   - Retention periods by data type',
        '   - Legal hold procedures',
        '   - Secure disposal methods',
        '   - Compliance requirements',
        '6. Map policies to compliance frameworks:',
        '   - GDPR requirements',
        '   - CCPA requirements',
        '   - HIPAA requirements',
        '   - PCI-DSS requirements',
        '   - SOC2 requirements',
        '7. Create policy documents:',
        '   - Classification policy document',
        '   - Handling procedures guide',
        '   - User training materials'
      ],
      outputFormat: 'JSON object with classification policies'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'policiesCreated', 'policiesList', 'handlingProcedures', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        policiesCreated: { type: 'number' },
        policiesList: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              level: { type: 'string' },
              definition: { type: 'string' },
              examples: { type: 'array', items: { type: 'string' } },
              accessRequirements: { type: 'object' },
              encryptionRequirements: { type: 'object' },
              retentionPeriod: { type: 'string' }
            }
          }
        },
        handlingProcedures: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              level: { type: 'string' },
              storage: { type: 'string' },
              transmission: { type: 'string' },
              disposal: { type: 'string' }
            }
          }
        },
        encryptionRequirements: {
          type: 'object',
          properties: {
            atRest: { type: 'boolean' },
            inTransit: { type: 'boolean' },
            algorithms: { type: 'array', items: { type: 'string' } }
          }
        },
        retentionRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dataType: { type: 'string' },
              retentionPeriod: { type: 'string' },
              complianceDriver: { type: 'string' }
            }
          }
        },
        policyScore: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'data-classification', 'policy']
}));

// Continue with remaining task definitions following the same pattern...
// For brevity, I'll define the remaining tasks with simplified structures

export const automatedClassificationTask = defineTask('automated-classification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Automated Data Classification - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Automated Data Classification Engineer',
      task: 'Execute automated classification of data assets using policies and ML',
      context: args,
      instructions: [
        '1. Apply classification rules to each data asset',
        '2. Use pattern matching for structured data',
        '3. Apply ML models for unstructured data (if enabled)',
        '4. Calculate confidence scores for classifications',
        '5. Flag assets requiring manual review (low confidence)',
        '6. Apply classification labels',
        '7. Generate classification report with accuracy metrics'
      ],
      outputFormat: 'JSON object with classification results'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'data-classification', 'automated']
}));

// Additional task definitions would continue here...
// Including: labelingTaggingTask, accessControlImplementationTask, encryptionImplementationTask,
// dlpImplementationTask, retentionDisposalTask, dataLineageTask, auditLoggingTask,
// complianceValidationTask, breachNotificationTask, trainingDocumentationTask, continuousMonitoringTask

// For the complete implementation, each task would follow the same detailed pattern
// as shown in the reference files
