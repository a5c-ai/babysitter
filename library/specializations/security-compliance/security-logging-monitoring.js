/**
 * @process security-compliance/security-logging-monitoring
 * @description Security Logging and Monitoring - Comprehensive SIEM implementation and security log management framework covering
 * log aggregation, correlation rules, threat detection, incident alerting, compliance logging, retention policies, and automated
 * response to security events using industry-leading SIEM platforms.
 * @inputs { environment?: string, siemPlatform?: string, logSources?: array, complianceFrameworks?: array, retentionPeriod?: number, threatDetection?: boolean, automatedResponse?: boolean }
 * @outputs { success: boolean, siemConfigured: boolean, logSourcesIntegrated: number, correlationRules: number, alertsConfigured: number, retentionPolicies: object, complianceStatus: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/security-compliance/security-logging-monitoring', {
 *   environment: 'production',
 *   siemPlatform: 'splunk',
 *   logSources: ['aws-cloudtrail', 'kubernetes', 'application-logs', 'firewall', 'ids-ips'],
 *   complianceFrameworks: ['SOC2', 'PCI-DSS', 'HIPAA', 'GDPR'],
 *   retentionPeriod: 365,
 *   threatDetection: true,
 *   automatedResponse: true,
 *   alertingChannels: ['email', 'slack', 'pagerduty'],
 *   dashboardsRequired: true
 * });
 *
 * @references
 * - NIST SP 800-92 Guide to Computer Security Log Management: https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-92.pdf
 * - CIS Critical Security Controls - Log Management: https://www.cisecurity.org/controls/
 * - OWASP Logging Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
 * - Splunk Security Best Practices: https://docs.splunk.com/Documentation/Splunk/latest/Security/
 * - Elastic Security: https://www.elastic.co/security
 * - Azure Sentinel: https://azure.microsoft.com/en-us/services/azure-sentinel/
 * - AWS Security Hub: https://aws.amazon.com/security-hub/
 * - MITRE ATT&CK Detection: https://attack.mitre.org/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    environment = 'production',
    siemPlatform = 'splunk', // splunk, elastic, sentinel, sumologic, datadog
    logSources = [],
    complianceFrameworks = ['SOC2'],
    retentionPeriod = 365, // days
    threatDetection = true,
    automatedResponse = false,
    alertingChannels = ['email', 'slack'],
    dashboardsRequired = true,
    encryptionRequired = true,
    outputDir = 'security-logging-monitoring-output'
  } = inputs;

  if (logSources.length === 0) {
    return {
      success: false,
      error: 'No log sources provided for SIEM integration',
      metadata: { processId: 'security-compliance/security-logging-monitoring', timestamp: ctx.now() }
    };
  }

  const startTime = ctx.now();
  const artifacts = [];
  let siemConfigured = false;

  ctx.log('info', `Starting Security Logging and Monitoring setup for ${environment} environment`);
  ctx.log('info', `SIEM Platform: ${siemPlatform}, Log Sources: ${logSources.length}, Compliance: ${complianceFrameworks.join(', ')}`);

  // ============================================================================
  // PHASE 1: SIEM INFRASTRUCTURE SETUP
  // ============================================================================

  ctx.log('info', 'Phase 1: SIEM Infrastructure Setup and Configuration');

  const siemSetup = await ctx.task(siemInfrastructureSetupTask, {
    environment,
    siemPlatform,
    encryptionRequired,
    complianceFrameworks,
    outputDir
  });

  artifacts.push(...siemSetup.artifacts);
  siemConfigured = siemSetup.configured;

  if (!siemConfigured) {
    return {
      success: false,
      error: 'SIEM infrastructure setup failed',
      details: siemSetup.errors,
      artifacts,
      metadata: { processId: 'security-compliance/security-logging-monitoring', timestamp: startTime }
    };
  }

  ctx.log('info', `SIEM Infrastructure Setup Complete - Platform: ${siemPlatform}, Status: ${siemSetup.status}`);

  // ============================================================================
  // PHASE 2: LOG SOURCE INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Integrating Log Sources with SIEM');

  const logSourceIntegration = await ctx.task(logSourceIntegrationTask, {
    logSources,
    siemPlatform,
    siemSetup,
    environment,
    outputDir
  });

  artifacts.push(...logSourceIntegration.artifacts);

  const integratedSources = logSourceIntegration.integratedSources.length;
  const failedSources = logSourceIntegration.failedSources;

  ctx.log('info', `Log Source Integration Complete - Integrated: ${integratedSources}/${logSources.length}`);

  if (failedSources.length > 0) {
    await ctx.breakpoint({
      question: `Log source integration incomplete. ${failedSources.length} source(s) failed: ${failedSources.join(', ')}. Continue without these sources or retry?`,
      title: 'Log Source Integration Issues',
      context: {
        runId: ctx.runId,
        integratedSources,
        totalSources: logSources.length,
        failedSources,
        failureReasons: logSourceIntegration.failureReasons,
        recommendation: 'Review integration errors and ensure proper authentication and network connectivity',
        files: logSourceIntegration.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 3: LOG PARSING AND NORMALIZATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Configuring Log Parsing and Normalization');

  const logParsing = await ctx.task(logParsingNormalizationTask, {
    integratedSources: logSourceIntegration.integratedSources,
    siemPlatform,
    outputDir
  });

  artifacts.push(...logParsing.artifacts);

  ctx.log('info', `Log Parsing Configuration Complete - Parsers: ${logParsing.parsersConfigured}, Field Extractions: ${logParsing.fieldExtractions}`);

  // ============================================================================
  // PHASE 4: LOG ENRICHMENT CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Configuring Log Enrichment and Context');

  const logEnrichment = await ctx.task(logEnrichmentTask, {
    integratedSources: logSourceIntegration.integratedSources,
    siemPlatform,
    outputDir
  });

  artifacts.push(...logEnrichment.artifacts);

  ctx.log('info', `Log Enrichment Complete - Enrichment Rules: ${logEnrichment.enrichmentRules}, Threat Intel Feeds: ${logEnrichment.threatIntelFeeds}`);

  // ============================================================================
  // PHASE 5: CORRELATION RULES AND DETECTION LOGIC
  // ============================================================================

  ctx.log('info', 'Phase 5: Creating Correlation Rules and Detection Logic');

  const correlationRules = await ctx.task(correlationRulesTask, {
    logSources,
    complianceFrameworks,
    threatDetection,
    siemPlatform,
    outputDir
  });

  artifacts.push(...correlationRules.artifacts);

  const totalRules = correlationRules.rulesCreated;

  ctx.log('info', `Correlation Rules Created - Total: ${totalRules}, Critical: ${correlationRules.criticalRules}, High: ${correlationRules.highPriorityRules}`);

  // Quality Gate: Review critical detection rules
  await ctx.breakpoint({
    question: `${totalRules} correlation rules created (${correlationRules.criticalRules} critical, ${correlationRules.highPriorityRules} high priority). Review detection logic before enabling?`,
    title: 'Correlation Rules Review',
    context: {
      runId: ctx.runId,
      totalRules,
      criticalRules: correlationRules.criticalRules,
      highPriorityRules: correlationRules.highPriorityRules,
      categories: correlationRules.ruleCategories,
      mitreAttackCoverage: correlationRules.mitreAttackCoverage,
      recommendation: 'Review and tune rules to minimize false positives',
      files: correlationRules.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // PHASE 6: THREAT DETECTION AND BEHAVIORAL ANALYTICS
  // ============================================================================

  let threatDetectionSetup = null;

  if (threatDetection) {
    ctx.log('info', 'Phase 6: Configuring Advanced Threat Detection');

    threatDetectionSetup = await ctx.task(threatDetectionTask, {
      logSources,
      correlationRules,
      siemPlatform,
      outputDir
    });

    artifacts.push(...threatDetectionSetup.artifacts);

    ctx.log('info', `Threat Detection Configured - UEBA: ${threatDetectionSetup.uebaEnabled}, ML Models: ${threatDetectionSetup.mlModelsDeployed}`);
  } else {
    ctx.log('info', 'Phase 6: Advanced threat detection disabled, using basic correlation rules only');
  }

  // ============================================================================
  // PHASE 7: ALERTING AND NOTIFICATION CONFIGURATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Configuring Alerting and Notifications');

  const alertingSetup = await ctx.task(alertingNotificationTask, {
    correlationRules,
    threatDetectionSetup,
    alertingChannels,
    siemPlatform,
    outputDir
  });

  artifacts.push(...alertingSetup.artifacts);

  const alertsConfigured = alertingSetup.alertsConfigured;

  ctx.log('info', `Alerting Configured - Total Alerts: ${alertsConfigured}, Channels: ${alertingChannels.join(', ')}`);

  // ============================================================================
  // PHASE 8: AUTOMATED RESPONSE AND ORCHESTRATION
  // ============================================================================

  let automatedResponseSetup = null;

  if (automatedResponse) {
    ctx.log('info', 'Phase 8: Configuring Automated Response and SOAR Integration');

    automatedResponseSetup = await ctx.task(automatedResponseTask, {
      correlationRules,
      alertingSetup,
      siemPlatform,
      environment,
      outputDir
    });

    artifacts.push(...automatedResponseSetup.artifacts);

    ctx.log('info', `Automated Response Configured - Playbooks: ${automatedResponseSetup.playbooksCreated}, Actions: ${automatedResponseSetup.automatedActions}`);

    // Quality Gate: Review automated response actions
    await ctx.breakpoint({
      question: `Automated response configured with ${automatedResponseSetup.playbooksCreated} playbooks and ${automatedResponseSetup.automatedActions} automated actions. Review actions before enabling in production?`,
      title: 'Automated Response Review',
      context: {
        runId: ctx.runId,
        playbooksCreated: automatedResponseSetup.playbooksCreated,
        automatedActions: automatedResponseSetup.automatedActions,
        actionTypes: automatedResponseSetup.actionTypes,
        recommendation: 'Test automated responses in non-production environment first',
        files: automatedResponseSetup.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  } else {
    ctx.log('info', 'Phase 8: Automated response disabled, manual incident response required');
  }

  // ============================================================================
  // PHASE 9: COMPLIANCE LOGGING AND AUDIT TRAILS
  // ============================================================================

  ctx.log('info', 'Phase 9: Configuring Compliance Logging and Audit Trails');

  const complianceLogging = await ctx.task(complianceLoggingTask, {
    complianceFrameworks,
    logSources,
    siemPlatform,
    outputDir
  });

  artifacts.push(...complianceLogging.artifacts);

  ctx.log('info', `Compliance Logging Configured - Frameworks: ${complianceFrameworks.join(', ')}, Audit Logs: ${complianceLogging.auditLogsConfigured}`);

  // ============================================================================
  // PHASE 10: LOG RETENTION AND ARCHIVAL POLICIES
  // ============================================================================

  ctx.log('info', 'Phase 10: Configuring Log Retention and Archival Policies');

  const retentionPolicies = await ctx.task(retentionArchivalTask, {
    retentionPeriod,
    complianceFrameworks,
    logSources,
    siemPlatform,
    encryptionRequired,
    outputDir
  });

  artifacts.push(...retentionPolicies.artifacts);

  ctx.log('info', `Retention Policies Configured - Hot Storage: ${retentionPolicies.hotStorageDays} days, Cold Storage: ${retentionPolicies.coldStorageDays} days`);

  // ============================================================================
  // PHASE 11: SECURITY DASHBOARDS AND VISUALIZATION
  // ============================================================================

  let dashboards = null;

  if (dashboardsRequired) {
    ctx.log('info', 'Phase 11: Creating Security Dashboards and Visualizations');

    dashboards = await ctx.task(dashboardVisualizationTask, {
      logSources,
      correlationRules,
      complianceFrameworks,
      siemPlatform,
      outputDir
    });

    artifacts.push(...dashboards.artifacts);

    ctx.log('info', `Dashboards Created - Total: ${dashboards.dashboardsCreated}, Executive: ${dashboards.executiveDashboards}, Operational: ${dashboards.operationalDashboards}`);
  } else {
    ctx.log('info', 'Phase 11: Dashboard creation skipped');
  }

  // ============================================================================
  // PHASE 12: LOG INTEGRITY AND TAMPER DETECTION
  // ============================================================================

  ctx.log('info', 'Phase 12: Configuring Log Integrity and Tamper Detection');

  const logIntegrity = await ctx.task(logIntegrityTask, {
    logSources,
    siemPlatform,
    encryptionRequired,
    outputDir
  });

  artifacts.push(...logIntegrity.artifacts);

  ctx.log('info', `Log Integrity Configured - Signatures: ${logIntegrity.signingEnabled}, Immutability: ${logIntegrity.immutableLogging}`);

  // ============================================================================
  // PHASE 13: INCIDENT RESPONSE WORKFLOW INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 13: Integrating with Incident Response Workflow');

  const incidentWorkflow = await ctx.task(incidentResponseIntegrationTask, {
    alertingSetup,
    automatedResponseSetup,
    siemPlatform,
    outputDir
  });

  artifacts.push(...incidentWorkflow.artifacts);

  ctx.log('info', `Incident Response Integration Complete - Ticketing: ${incidentWorkflow.ticketingIntegrated}, Runbooks: ${incidentWorkflow.runbooksLinked}`);

  // ============================================================================
  // PHASE 14: PERFORMANCE OPTIMIZATION AND TUNING
  // ============================================================================

  ctx.log('info', 'Phase 14: Performance Optimization and Index Tuning');

  const performanceOptimization = await ctx.task(performanceOptimizationTask, {
    logSources,
    siemPlatform,
    logSourceIntegration,
    outputDir
  });

  artifacts.push(...performanceOptimization.artifacts);

  ctx.log('info', `Performance Optimization Complete - Optimizations Applied: ${performanceOptimization.optimizationsApplied}`);

  // ============================================================================
  // PHASE 15: COMPLIANCE VALIDATION AND REPORTING
  // ============================================================================

  ctx.log('info', 'Phase 15: Validating Compliance and Generating Reports');

  const complianceValidation = await ctx.task(complianceValidationTask, {
    complianceFrameworks,
    complianceLogging,
    retentionPolicies,
    logIntegrity,
    logSourceIntegration,
    outputDir
  });

  artifacts.push(...complianceValidation.artifacts);

  const complianceStatus = complianceValidation.overallCompliance;

  ctx.log('info', `Compliance Validation Complete - Status: ${complianceStatus.compliant ? 'COMPLIANT' : 'NON-COMPLIANT'}, Score: ${complianceStatus.complianceScore}%`);

  // ============================================================================
  // PHASE 16: TESTING AND VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 16: Testing Security Logging and Monitoring');

  const testing = await ctx.task(testingValidationTask, {
    logSources,
    correlationRules,
    alertingSetup,
    automatedResponseSetup,
    siemPlatform,
    outputDir
  });

  artifacts.push(...testing.artifacts);

  const testResults = testing.testResults;

  ctx.log('info', `Testing Complete - Total Tests: ${testResults.totalTests}, Passed: ${testResults.passed}, Failed: ${testResults.failed}`);

  if (testResults.failed > 0) {
    await ctx.breakpoint({
      question: `Security logging testing identified ${testResults.failed} failed test(s). Review failures: ${testing.failedTests.join(', ')}. Address issues before deployment?`,
      title: 'Testing Validation Issues',
      context: {
        runId: ctx.runId,
        totalTests: testResults.totalTests,
        passed: testResults.passed,
        failed: testResults.failed,
        failedTests: testing.failedTests,
        failureDetails: testing.failureDetails,
        recommendation: 'Address critical failures before production deployment',
        files: testing.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 17: OPERATIONAL RUNBOOKS AND DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 17: Generating Operational Runbooks and Documentation');

  const documentation = await ctx.task(documentationRunbooksTask, {
    siemPlatform,
    logSources,
    correlationRules,
    alertingSetup,
    retentionPolicies,
    complianceFrameworks,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  ctx.log('info', `Documentation Generated - Runbooks: ${documentation.runbooksCreated}, SOPs: ${documentation.sopsCreated}`);

  // ============================================================================
  // PHASE 18: COMPREHENSIVE SECURITY REPORT
  // ============================================================================

  ctx.log('info', 'Phase 18: Generating Comprehensive Security Logging Report');

  const securityReport = await ctx.task(securityReportGenerationTask, {
    siemSetup,
    logSourceIntegration,
    correlationRules,
    alertingSetup,
    automatedResponseSetup,
    complianceValidation,
    retentionPolicies,
    dashboards,
    testResults,
    outputDir
  });

  artifacts.push(...securityReport.artifacts);

  // Final Breakpoint: Review complete setup
  await ctx.breakpoint({
    question: `Security Logging and Monitoring setup complete. SIEM configured: ${siemConfigured}, Log sources: ${integratedSources}, Correlation rules: ${totalRules}, Alerts: ${alertsConfigured}. Compliance: ${complianceStatus.compliant ? 'COMPLIANT' : 'NON-COMPLIANT'}. Deploy to production?`,
    title: 'Security Logging and Monitoring Complete',
    context: {
      runId: ctx.runId,
      files: [
        { path: securityReport.reportPath, format: 'markdown', label: 'Security Logging Report' },
        { path: complianceValidation.complianceReportPath, format: 'markdown', label: 'Compliance Report' },
        { path: documentation.operationalGuidePath, format: 'markdown', label: 'Operational Guide' }
      ],
      summary: {
        siemPlatform,
        environment,
        siemConfigured,
        logSourcesIntegrated: integratedSources,
        totalLogSources: logSources.length,
        correlationRules: totalRules,
        alertsConfigured,
        threatDetectionEnabled: threatDetection,
        automatedResponseEnabled: automatedResponse,
        complianceFrameworks,
        complianceStatus: complianceStatus.compliant ? 'COMPLIANT' : 'NON-COMPLIANT',
        complianceScore: `${complianceStatus.complianceScore}%`,
        retentionPeriod: `${retentionPeriod} days`,
        dashboards: dashboards?.dashboardsCreated || 0,
        testsPassed: testResults.passed,
        testsFailed: testResults.failed
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    siemConfigured,
    siemPlatform,
    environment,
    logSourcesIntegrated: integratedSources,
    totalLogSources: logSources.length,
    failedLogSources: failedSources,
    correlationRules: totalRules,
    criticalRules: correlationRules.criticalRules,
    highPriorityRules: correlationRules.highPriorityRules,
    alertsConfigured,
    alertingChannels,
    threatDetection: threatDetectionSetup ? {
      enabled: true,
      uebaEnabled: threatDetectionSetup.uebaEnabled,
      mlModels: threatDetectionSetup.mlModelsDeployed,
      threatIntelFeeds: logEnrichment.threatIntelFeeds
    } : { enabled: false },
    automatedResponse: automatedResponseSetup ? {
      enabled: true,
      playbooks: automatedResponseSetup.playbooksCreated,
      automatedActions: automatedResponseSetup.automatedActions
    } : { enabled: false },
    retentionPolicies: {
      retentionPeriod,
      hotStorageDays: retentionPolicies.hotStorageDays,
      coldStorageDays: retentionPolicies.coldStorageDays,
      archivalEnabled: retentionPolicies.archivalEnabled
    },
    complianceStatus: {
      compliant: complianceStatus.compliant,
      complianceScore: complianceStatus.complianceScore,
      frameworks: complianceFrameworks,
      gaps: complianceValidation.gaps,
      auditLogsConfigured: complianceLogging.auditLogsConfigured
    },
    logIntegrity: {
      signingEnabled: logIntegrity.signingEnabled,
      immutableLogging: logIntegrity.immutableLogging,
      encryptionEnabled: encryptionRequired
    },
    dashboards: dashboards ? {
      created: dashboards.dashboardsCreated,
      executive: dashboards.executiveDashboards,
      operational: dashboards.operationalDashboards,
      compliance: dashboards.complianceDashboards
    } : null,
    testing: {
      totalTests: testResults.totalTests,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: `${((testResults.passed / testResults.totalTests) * 100).toFixed(1)}%`
    },
    documentation: {
      runbooks: documentation.runbooksCreated,
      sops: documentation.sopsCreated,
      operationalGuidePath: documentation.operationalGuidePath
    },
    artifacts,
    duration,
    metadata: {
      processId: 'security-compliance/security-logging-monitoring',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: SIEM Infrastructure Setup
export const siemInfrastructureSetupTask = defineTask('siem-infrastructure-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure SIEM infrastructure and platform',
  agent: {
    name: 'siem-architect',
    prompt: {
      role: 'SIEM infrastructure architect',
      task: 'Set up and configure SIEM platform infrastructure',
      context: args,
      instructions: [
        'Deploy SIEM platform infrastructure (Splunk, Elastic, Sentinel, etc.)',
        'Configure high availability and redundancy',
        'Set up indexers, search heads, and forwarders',
        'Configure storage and retention infrastructure',
        'Enable encryption in transit and at rest',
        'Configure authentication and access controls',
        'Set up administrative roles and permissions',
        'Enable audit logging for SIEM itself',
        'Configure network connectivity and firewall rules',
        'Set up license and capacity management',
        'Configure backup and disaster recovery',
        'Optimize performance and resource allocation',
        'Generate SIEM infrastructure configuration documentation',
        'Save configuration files to output directory'
      ],
      outputFormat: 'JSON with configured, status, configuration, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['configured', 'status', 'configuration', 'artifacts'],
      properties: {
        configured: { type: 'boolean' },
        status: { type: 'string', enum: ['configured', 'partial', 'failed'] },
        configuration: {
          type: 'object',
          properties: {
            platform: { type: 'string' },
            version: { type: 'string' },
            highAvailability: { type: 'boolean' },
            indexersDeployed: { type: 'number' },
            searchHeadsDeployed: { type: 'number' },
            forwardersDeployed: { type: 'number' },
            storageCapacity: { type: 'string' },
            encryptionEnabled: { type: 'boolean' }
          }
        },
        accessControlConfigured: { type: 'boolean' },
        backupConfigured: { type: 'boolean' },
        errors: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-logging', 'siem', 'infrastructure']
}));

// Task 2: Log Source Integration
export const logSourceIntegrationTask = defineTask('log-source-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Integrate log sources with SIEM',
  agent: {
    name: 'log-integration-specialist',
    prompt: {
      role: 'log integration specialist',
      task: 'Integrate all security log sources with SIEM platform',
      context: args,
      instructions: [
        'Identify all log sources to integrate (cloud, infrastructure, applications, security tools)',
        'Configure log forwarders and agents for each source',
        'Set up AWS CloudTrail, CloudWatch, VPC Flow Logs integration',
        'Integrate Azure Monitor and Activity Logs',
        'Configure Google Cloud Logging integration',
        'Set up Kubernetes audit logs and container logs',
        'Integrate application logs (web servers, databases, APIs)',
        'Configure security tool logs (firewall, IDS/IPS, WAF, antivirus)',
        'Set up authentication logs (Active Directory, IAM, SSO)',
        'Configure network device logs (routers, switches, load balancers)',
        'Establish secure log forwarding channels',
        'Verify log ingestion and data flow',
        'Configure log source metadata and tagging',
        'Document integration configuration for each source',
        'Generate integration status report',
        'Save integration configurations to output directory'
      ],
      outputFormat: 'JSON with integratedSources, failedSources, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['integratedSources', 'failedSources', 'artifacts'],
      properties: {
        integratedSources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string', enum: ['cloud', 'infrastructure', 'application', 'security-tool', 'network', 'authentication'] },
              status: { type: 'string', enum: ['active', 'configured', 'testing'] },
              eventsPerSecond: { type: 'number' },
              dataVolume: { type: 'string' }
            }
          }
        },
        failedSources: { type: 'array', items: { type: 'string' } },
        failureReasons: { type: 'object' },
        totalDataIngestion: { type: 'string', description: 'GB per day' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-logging', 'log-integration']
}));

// Task 3: Log Parsing and Normalization
export const logParsingNormalizationTask = defineTask('log-parsing-normalization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure log parsing and normalization',
  agent: {
    name: 'log-parser-engineer',
    prompt: {
      role: 'log parsing engineer',
      task: 'Configure log parsing, field extraction, and normalization',
      context: args,
      instructions: [
        'Create parsers for each log format (JSON, syslog, CEF, LEEF, custom)',
        'Configure field extraction patterns (regex, delimiters, KV pairs)',
        'Normalize timestamps to standard format (ISO 8601)',
        'Standardize field names across all log sources',
        'Extract common fields (timestamp, source, severity, user, IP, action)',
        'Parse authentication events (login, logout, failed attempts)',
        'Parse security events (alerts, blocks, allows)',
        'Extract network information (src_ip, dst_ip, port, protocol)',
        'Parse HTTP access logs (method, URL, status, user agent)',
        'Configure data type conversions',
        'Handle multiline log events',
        'Validate parsing accuracy and coverage',
        'Generate parsing rules documentation',
        'Save parser configurations to output directory'
      ],
      outputFormat: 'JSON with parsersConfigured, fieldExtractions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['parsersConfigured', 'fieldExtractions', 'artifacts'],
      properties: {
        parsersConfigured: { type: 'number' },
        fieldExtractions: { type: 'number' },
        parsersBySource: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              format: { type: 'string' },
              fieldsExtracted: { type: 'array', items: { type: 'string' } },
              parseSuccess: { type: 'number', description: 'Percentage' }
            }
          }
        },
        normalizedFields: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-logging', 'parsing', 'normalization']
}));

// Task 4: Log Enrichment
export const logEnrichmentTask = defineTask('log-enrichment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure log enrichment and context',
  agent: {
    name: 'log-enrichment-specialist',
    prompt: {
      role: 'log enrichment specialist',
      task: 'Configure log enrichment with threat intelligence and context',
      context: args,
      instructions: [
        'Integrate threat intelligence feeds (IP reputation, domain reputation, file hashes)',
        'Configure GeoIP lookups for IP addresses',
        'Add asset context (hostname, owner, criticality, environment)',
        'Enrich with user context (department, role, title)',
        'Add vulnerability context from scanners',
        'Integrate with CMDB for asset information',
        'Configure DNS lookups and reverse DNS',
        'Add malware analysis results',
        'Integrate with threat intelligence platforms (MISP, ThreatConnect)',
        'Configure WHOIS lookups for domains',
        'Add CVE information for vulnerabilities',
        'Enrich with business context',
        'Generate enrichment rules documentation',
        'Save enrichment configurations to output directory'
      ],
      outputFormat: 'JSON with enrichmentRules, threatIntelFeeds, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['enrichmentRules', 'threatIntelFeeds', 'artifacts'],
      properties: {
        enrichmentRules: { type: 'number' },
        threatIntelFeeds: { type: 'number' },
        enrichmentTypes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              source: { type: 'string' },
              fieldsAdded: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        geoipEnabled: { type: 'boolean' },
        assetContextEnabled: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-logging', 'enrichment', 'threat-intel']
}));

// Task 5: Correlation Rules
export const correlationRulesTask = defineTask('correlation-rules', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create correlation rules and detection logic',
  agent: {
    name: 'detection-engineer',
    prompt: {
      role: 'security detection engineer',
      task: 'Create correlation rules and security detection logic',
      context: args,
      instructions: [
        'Create authentication attack detection rules (brute force, credential stuffing, impossible travel)',
        'Build malware detection rules (execution, persistence, lateral movement)',
        'Create data exfiltration detection rules (large transfers, unusual destinations)',
        'Build privilege escalation detection rules',
        'Create network scanning and reconnaissance detection',
        'Build web application attack detection (SQL injection, XSS, LFI)',
        'Create insider threat detection rules',
        'Build compliance violation detection (PCI-DSS, HIPAA, SOC2)',
        'Create anomaly detection rules (unusual login times, new processes)',
        'Build command and control detection',
        'Map rules to MITRE ATT&CK framework',
        'Set appropriate severity levels and priorities',
        'Configure rule thresholds and timeframes',
        'Add false positive suppression logic',
        'Generate detection rules documentation',
        'Save correlation rules to output directory'
      ],
      outputFormat: 'JSON with rulesCreated, criticalRules, ruleCategories, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['rulesCreated', 'criticalRules', 'highPriorityRules', 'artifacts'],
      properties: {
        rulesCreated: { type: 'number' },
        criticalRules: { type: 'number' },
        highPriorityRules: { type: 'number' },
        mediumPriorityRules: { type: 'number' },
        ruleCategories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              rulesCount: { type: 'number' },
              examples: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        mitreAttackCoverage: {
          type: 'object',
          properties: {
            tacticsC covered: { type: 'number' },
            techniquesCovered: { type: 'number' },
            coveragePercentage: { type: 'number' }
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
  labels: ['agent', 'security-logging', 'correlation', 'detection']
}));

// Task 6: Threat Detection
export const threatDetectionTask = defineTask('threat-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure advanced threat detection',
  agent: {
    name: 'threat-detection-specialist',
    prompt: {
      role: 'advanced threat detection specialist',
      task: 'Configure UEBA, machine learning, and behavioral analytics',
      context: args,
      instructions: [
        'Enable User and Entity Behavior Analytics (UEBA)',
        'Configure baseline learning for normal behavior',
        'Set up anomaly detection for users and entities',
        'Deploy machine learning models for threat detection',
        'Configure peer group analysis',
        'Set up risk scoring for users and assets',
        'Enable behavioral profiling',
        'Configure outlier detection',
        'Set up lateral movement detection',
        'Enable insider threat detection',
        'Configure advanced persistent threat (APT) detection',
        'Set up zero-day attack detection',
        'Configure adaptive thresholds',
        'Generate threat detection configuration documentation',
        'Save ML models and UEBA configurations to output directory'
      ],
      outputFormat: 'JSON with uebaEnabled, mlModelsDeployed, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['uebaEnabled', 'mlModelsDeployed', 'artifacts'],
      properties: {
        uebaEnabled: { type: 'boolean' },
        mlModelsDeployed: { type: 'number' },
        behavioralProfilingEnabled: { type: 'boolean' },
        riskScoringEnabled: { type: 'boolean' },
        models: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              modelName: { type: 'string' },
              modelType: { type: 'string' },
              trainedOn: { type: 'string' },
              accuracy: { type: 'number' }
            }
          }
        },
        baselinePeriod: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-logging', 'threat-detection', 'ueba', 'ml']
}));

// Task 7: Alerting and Notification
export const alertingNotificationTask = defineTask('alerting-notification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure alerting and notifications',
  agent: {
    name: 'alert-engineer',
    prompt: {
      role: 'security alerting engineer',
      task: 'Configure alerting, notifications, and escalation workflows',
      context: args,
      instructions: [
        'Configure alert generation from correlation rules',
        'Set up email notifications for security alerts',
        'Integrate with Slack for real-time notifications',
        'Configure PagerDuty for incident escalation',
        'Set up Microsoft Teams integration',
        'Configure alert severity levels and priorities',
        'Create alert templates with rich context',
        'Configure alert aggregation and deduplication',
        'Set up escalation policies',
        'Configure on-call schedules',
        'Enable alert suppression rules',
        'Set up alert routing based on type and severity',
        'Configure webhook integrations',
        'Generate alerting configuration documentation',
        'Save alerting configurations to output directory'
      ],
      outputFormat: 'JSON with alertsConfigured, channels, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['alertsConfigured', 'channels', 'artifacts'],
      properties: {
        alertsConfigured: { type: 'number' },
        channels: { type: 'array', items: { type: 'string' } },
        alertsBySeverity: {
          type: 'object',
          properties: {
            critical: { type: 'number' },
            high: { type: 'number' },
            medium: { type: 'number' },
            low: { type: 'number' }
          }
        },
        escalationPolicies: { type: 'number' },
        deduplicationEnabled: { type: 'boolean' },
        onCallScheduleConfigured: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-logging', 'alerting', 'notifications']
}));

// Task 8: Automated Response
export const automatedResponseTask = defineTask('automated-response', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure automated response and SOAR',
  agent: {
    name: 'soar-engineer',
    prompt: {
      role: 'security orchestration and automation engineer',
      task: 'Configure automated response playbooks and SOAR integration',
      context: args,
      instructions: [
        'Create automated response playbooks for common threats',
        'Configure automatic account disabling for compromised users',
        'Set up automatic IP blocking at firewall',
        'Configure automated malware isolation',
        'Create playbook for suspicious login blocking',
        'Set up automated file quarantine',
        'Configure automatic email blocking for phishing',
        'Create incident ticket auto-generation',
        'Set up automated enrichment actions',
        'Configure SOAR platform integration (Phantom, Demisto, Swimlane)',
        'Create approval workflows for high-risk actions',
        'Configure rollback procedures',
        'Set up automated evidence collection',
        'Generate playbook documentation',
        'Save automation playbooks to output directory'
      ],
      outputFormat: 'JSON with playbooksCreated, automatedActions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['playbooksCreated', 'automatedActions', 'artifacts'],
      properties: {
        playbooksCreated: { type: 'number' },
        automatedActions: { type: 'number' },
        actionTypes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              actionType: { type: 'string' },
              triggerConditions: { type: 'array', items: { type: 'string' } },
              requiresApproval: { type: 'boolean' }
            }
          }
        },
        soarIntegrated: { type: 'boolean' },
        soarPlatform: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-logging', 'automation', 'soar']
}));

// Task 9: Compliance Logging
export const complianceLoggingTask = defineTask('compliance-logging', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure compliance logging and audit trails',
  agent: {
    name: 'compliance-engineer',
    prompt: {
      role: 'compliance logging engineer',
      task: 'Configure compliance-specific logging and audit trails',
      context: args,
      instructions: [
        'Configure logging for SOC 2 compliance requirements',
        'Set up PCI-DSS required logging (access logs, change logs)',
        'Configure HIPAA audit logging for PHI access',
        'Set up GDPR data access logging',
        'Configure administrative action logging',
        'Enable privileged user activity logging',
        'Set up data access audit trails',
        'Configure configuration change logging',
        'Enable authentication and authorization logging',
        'Set up system security event logging',
        'Configure failed access attempt logging',
        'Generate compliance mapping documentation',
        'Create audit log retention policies per regulation',
        'Save compliance configurations to output directory'
      ],
      outputFormat: 'JSON with auditLogsConfigured, complianceMapping, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['auditLogsConfigured', 'complianceMapping', 'artifacts'],
      properties: {
        auditLogsConfigured: { type: 'number' },
        complianceMapping: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              framework: { type: 'string' },
              requirementsAddressed: { type: 'array', items: { type: 'string' } },
              logsConfigured: { type: 'number' }
            }
          }
        },
        privilegedUserMonitoring: { type: 'boolean' },
        dataAccessAuditing: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-logging', 'compliance', 'audit']
}));

// Task 10: Retention and Archival
export const retentionArchivalTask = defineTask('retention-archival', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure log retention and archival policies',
  agent: {
    name: 'retention-specialist',
    prompt: {
      role: 'log retention specialist',
      task: 'Configure log retention, archival, and lifecycle management',
      context: args,
      instructions: [
        'Define hot storage retention period (fast searchable logs)',
        'Configure warm storage tier (slower searchable logs)',
        'Set up cold storage archival (long-term retention)',
        'Configure retention periods based on compliance requirements',
        'Set up automated archival workflows',
        'Configure log compression for archived data',
        'Enable encryption for archived logs',
        'Set up cloud storage for long-term retention (S3 Glacier, Azure Blob)',
        'Configure log deletion policies after retention expiry',
        'Set up retention policy exceptions for critical logs',
        'Configure archival restoration procedures',
        'Implement chain of custody for archived logs',
        'Generate retention policy documentation',
        'Save retention configurations to output directory'
      ],
      outputFormat: 'JSON with hotStorageDays, coldStorageDays, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['hotStorageDays', 'coldStorageDays', 'artifacts'],
      properties: {
        hotStorageDays: { type: 'number' },
        warmStorageDays: { type: 'number' },
        coldStorageDays: { type: 'number' },
        archivalEnabled: { type: 'boolean' },
        archivalDestination: { type: 'string' },
        compressionEnabled: { type: 'boolean' },
        archivalEncryption: { type: 'boolean' },
        retentionByLogType: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              logType: { type: 'string' },
              retentionDays: { type: 'number' },
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
  labels: ['agent', 'security-logging', 'retention', 'archival']
}));

// Task 11: Dashboard Visualization
export const dashboardVisualizationTask = defineTask('dashboard-visualization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create security dashboards and visualizations',
  agent: {
    name: 'dashboard-designer',
    prompt: {
      role: 'security dashboard designer',
      task: 'Create comprehensive security dashboards and visualizations',
      context: args,
      instructions: [
        'Create executive security dashboard (high-level KPIs)',
        'Build SOC operational dashboard (alerts, incidents, response times)',
        'Create compliance dashboard (audit logs, policy violations)',
        'Build threat intelligence dashboard (IOCs, threat feeds)',
        'Create authentication dashboard (logins, failures, geo-distribution)',
        'Build network security dashboard (traffic, blocks, anomalies)',
        'Create application security dashboard (WAF events, attacks)',
        'Build cloud security dashboard (AWS, Azure, GCP events)',
        'Create vulnerability dashboard',
        'Build incident response dashboard',
        'Add real-time event streams',
        'Configure drill-down capabilities',
        'Set up automated reporting schedules',
        'Generate dashboard documentation',
        'Export dashboard definitions to output directory'
      ],
      outputFormat: 'JSON with dashboardsCreated, executiveDashboards, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['dashboardsCreated', 'executiveDashboards', 'operationalDashboards', 'artifacts'],
      properties: {
        dashboardsCreated: { type: 'number' },
        executiveDashboards: { type: 'number' },
        operationalDashboards: { type: 'number' },
        complianceDashboards: { type: 'number' },
        dashboardList: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              purpose: { type: 'string' },
              audience: { type: 'string' },
              visualizations: { type: 'number' }
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
  labels: ['agent', 'security-logging', 'dashboards', 'visualization']
}));

// Task 12: Log Integrity
export const logIntegrityTask = defineTask('log-integrity', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure log integrity and tamper detection',
  agent: {
    name: 'integrity-specialist',
    prompt: {
      role: 'log integrity specialist',
      task: 'Configure log integrity protection and tamper detection',
      context: args,
      instructions: [
        'Enable log signing with cryptographic signatures',
        'Configure write-once-read-many (WORM) storage',
        'Set up blockchain-based log integrity',
        'Enable immutable log storage',
        'Configure log hash verification',
        'Set up tamper detection alerts',
        'Enable forward integrity sealing',
        'Configure log replication for integrity',
        'Set up audit trail for log access',
        'Configure log deletion prevention',
        'Enable log modification detection',
        'Set up periodic integrity checks',
        'Generate integrity verification reports',
        'Save integrity configurations to output directory'
      ],
      outputFormat: 'JSON with signingEnabled, immutableLogging, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['signingEnabled', 'immutableLogging', 'artifacts'],
      properties: {
        signingEnabled: { type: 'boolean' },
        immutableLogging: { type: 'boolean' },
        wormStorageEnabled: { type: 'boolean' },
        blockchainIntegrity: { type: 'boolean' },
        tamperDetectionEnabled: { type: 'boolean' },
        integrityCheckFrequency: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-logging', 'integrity', 'tamper-detection']
}));

// Task 13: Incident Response Integration
export const incidentResponseIntegrationTask = defineTask('incident-response-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Integrate with incident response workflow',
  agent: {
    name: 'incident-integration-specialist',
    prompt: {
      role: 'incident response integration specialist',
      task: 'Integrate SIEM with incident response workflows and ticketing systems',
      context: args,
      instructions: [
        'Integrate with incident ticketing system (Jira, ServiceNow)',
        'Configure automatic incident creation from alerts',
        'Set up bidirectional sync between SIEM and ticketing',
        'Link to incident response runbooks',
        'Configure case management workflows',
        'Set up evidence collection automation',
        'Integrate with forensics tools',
        'Configure incident timeline generation',
        'Set up communication templates',
        'Enable incident metrics tracking',
        'Configure post-incident reporting',
        'Generate integration documentation',
        'Save integration configurations to output directory'
      ],
      outputFormat: 'JSON with ticketingIntegrated, runbooksLinked, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['ticketingIntegrated', 'runbooksLinked', 'artifacts'],
      properties: {
        ticketingIntegrated: { type: 'boolean' },
        ticketingSystem: { type: 'string' },
        runbooksLinked: { type: 'number' },
        caseManagementEnabled: { type: 'boolean' },
        evidenceCollectionAutomated: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-logging', 'incident-response', 'integration']
}));

// Task 14: Performance Optimization
export const performanceOptimizationTask = defineTask('performance-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Optimize SIEM performance and indexing',
  agent: {
    name: 'performance-engineer',
    prompt: {
      role: 'SIEM performance engineer',
      task: 'Optimize SIEM performance, indexing, and resource utilization',
      context: args,
      instructions: [
        'Optimize index configurations for query performance',
        'Configure data model acceleration',
        'Set up summary indexing for common searches',
        'Optimize field extractions for performance',
        'Configure index parallelization',
        'Set up bucket optimization',
        'Configure search head clustering',
        'Optimize forwarder queues',
        'Set up data compression',
        'Configure index replication',
        'Optimize resource allocation',
        'Tune query performance',
        'Generate performance optimization report',
        'Save optimization configurations to output directory'
      ],
      outputFormat: 'JSON with optimizationsApplied, performanceGains, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizationsApplied', 'artifacts'],
      properties: {
        optimizationsApplied: { type: 'number' },
        performanceGains: {
          type: 'object',
          properties: {
            searchSpeedImprovement: { type: 'string' },
            indexingThroughput: { type: 'string' },
            storageEfficiency: { type: 'string' }
          }
        },
        accelerationEnabled: { type: 'boolean' },
        compressionRatio: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-logging', 'performance', 'optimization']
}));

// Task 15: Compliance Validation
export const complianceValidationTask = defineTask('compliance-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate compliance requirements',
  agent: {
    name: 'compliance-validator',
    prompt: {
      role: 'security compliance validator',
      task: 'Validate logging configuration against compliance requirements',
      context: args,
      instructions: [
        'Validate SOC 2 logging requirements are met',
        'Check PCI-DSS logging and monitoring requirements',
        'Verify HIPAA audit log requirements',
        'Validate GDPR data processing logging',
        'Check log retention meets compliance requirements',
        'Verify audit trail completeness',
        'Validate log integrity protection',
        'Check access control for logs',
        'Verify log encryption requirements',
        'Validate monitoring and alerting coverage',
        'Check incident response integration',
        'Identify compliance gaps',
        'Generate compliance validation report',
        'Save compliance evidence to output directory'
      ],
      outputFormat: 'JSON with overallCompliance, gaps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallCompliance', 'gaps', 'complianceReportPath', 'artifacts'],
      properties: {
        overallCompliance: {
          type: 'object',
          properties: {
            compliant: { type: 'boolean' },
            complianceScore: { type: 'number', minimum: 0, maximum: 100 }
          }
        },
        frameworkResults: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              framework: { type: 'string' },
              compliant: { type: 'boolean' },
              requirementsMet: { type: 'number' },
              totalRequirements: { type: 'number' },
              score: { type: 'number' }
            }
          }
        },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              framework: { type: 'string' },
              requirement: { type: 'string' },
              gap: { type: 'string' },
              remediation: { type: 'string' }
            }
          }
        },
        complianceReportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-logging', 'compliance', 'validation']
}));

// Task 16: Testing and Validation
export const testingValidationTask = defineTask('testing-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Test security logging and monitoring',
  agent: {
    name: 'security-tester',
    prompt: {
      role: 'security logging tester',
      task: 'Test and validate security logging and monitoring functionality',
      context: args,
      instructions: [
        'Test log ingestion from all sources',
        'Validate log parsing and field extraction',
        'Test correlation rule triggering',
        'Validate alert generation and delivery',
        'Test automated response playbooks',
        'Verify dashboard functionality',
        'Test search and query performance',
        'Validate retention and archival',
        'Test log integrity protection',
        'Verify compliance logging',
        'Test incident response integration',
        'Validate threat detection accuracy',
        'Test failover and redundancy',
        'Generate testing report',
        'Save test results to output directory'
      ],
      outputFormat: 'JSON with testResults, failedTests, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['testResults', 'failedTests', 'artifacts'],
      properties: {
        testResults: {
          type: 'object',
          properties: {
            totalTests: { type: 'number' },
            passed: { type: 'number' },
            failed: { type: 'number' },
            warnings: { type: 'number' }
          }
        },
        testsByCategory: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              passed: { type: 'number' },
              failed: { type: 'number' }
            }
          }
        },
        failedTests: { type: 'array', items: { type: 'string' } },
        failureDetails: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-logging', 'testing', 'validation']
}));

// Task 17: Documentation and Runbooks
export const documentationRunbooksTask = defineTask('documentation-runbooks', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate documentation and runbooks',
  agent: {
    name: 'documentation-specialist',
    prompt: {
      role: 'security documentation specialist',
      task: 'Generate comprehensive documentation and operational runbooks',
      context: args,
      instructions: [
        'Create SIEM architecture documentation',
        'Document log source integration procedures',
        'Generate correlation rule catalog',
        'Create alert response runbooks',
        'Document retention and archival procedures',
        'Generate compliance audit procedures',
        'Create incident response integration guide',
        'Document troubleshooting procedures',
        'Generate operational procedures (SOPs)',
        'Create training materials for SOC analysts',
        'Document backup and recovery procedures',
        'Generate maintenance procedures',
        'Create comprehensive operational guide',
        'Save all documentation to output directory'
      ],
      outputFormat: 'JSON with runbooksCreated, sopsCreated, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['runbooksCreated', 'sopsCreated', 'operationalGuidePath', 'artifacts'],
      properties: {
        runbooksCreated: { type: 'number' },
        sopsCreated: { type: 'number' },
        trainingMaterialsCreated: { type: 'number' },
        operationalGuidePath: { type: 'string' },
        architectureDocPath: { type: 'string' },
        troubleshootingGuidePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-logging', 'documentation', 'runbooks']
}));

// Task 18: Security Report Generation
export const securityReportGenerationTask = defineTask('security-report-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive security report',
  agent: {
    name: 'security-reporter',
    prompt: {
      role: 'security reporting specialist',
      task: 'Generate comprehensive security logging and monitoring report',
      context: args,
      instructions: [
        'Create executive summary of SIEM implementation',
        'Document log source coverage',
        'Summarize correlation rules and detection capabilities',
        'Report on alerting and notification configuration',
        'Document compliance status',
        'Summarize automated response capabilities',
        'Report on retention and archival configuration',
        'Document performance metrics',
        'Include testing results',
        'Provide operational recommendations',
        'Add visual diagrams and architecture',
        'Include next steps and future enhancements',
        'Format as professional Markdown report',
        'Save report to output directory'
      ],
      outputFormat: 'JSON with reportPath, executiveSummary, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        detectionCoverage: { type: 'number', description: 'Percentage' },
        complianceScore: { type: 'number', description: 'Percentage' },
        securityPosture: { type: 'string', enum: ['excellent', 'good', 'fair', 'poor'] },
        recommendations: { type: 'array', items: { type: 'string' } },
        nextSteps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'security-logging', 'reporting', 'documentation']
}));
