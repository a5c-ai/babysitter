/**
 * @process technical-documentation/runbook-docs
 * @description Runbook and Operational Procedure Documentation process with service overview, deployment procedures, incident response, troubleshooting guides, monitoring setup, and maintenance procedures
 * @inputs { serviceName: string, serviceType: string, environment: string, outputDir: string, existingRunbook: string, includeSections: array, requireReview: boolean }
 * @outputs { success: boolean, runbookPath: string, sections: object, qualityScore: number, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    serviceName = '',
    serviceType = 'microservice', // microservice, monolith, database, infrastructure, api
    environment = 'production',
    outputDir = 'runbook-output',
    existingRunbook = null,
    includeSections = ['all'], // all, service-overview, deployment, incident-response, troubleshooting, monitoring, maintenance, access
    requireReview = true,
    teamContacts = [],
    dependencies = [],
    slaTargets = {}
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Runbook and Operational Procedure Documentation Process');

  // ============================================================================
  // PHASE 1: SERVICE DISCOVERY AND CONTEXT GATHERING
  // ============================================================================

  ctx.log('info', 'Phase 1: Gathering service information and operational context');
  const serviceDiscovery = await ctx.task(serviceDiscoveryTask, {
    serviceName,
    serviceType,
    environment,
    dependencies,
    slaTargets,
    outputDir
  });

  artifacts.push(...serviceDiscovery.artifacts);

  // ============================================================================
  // PHASE 2: SERVICE OVERVIEW DOCUMENTATION
  // ============================================================================

  const shouldInclude = (section) => includeSections.includes('all') || includeSections.includes(section);

  let serviceOverview = null;
  if (shouldInclude('service-overview')) {
    ctx.log('info', 'Phase 2: Documenting service overview and architecture');
    serviceOverview = await ctx.task(serviceOverviewTask, {
      serviceName,
      serviceType,
      serviceContext: serviceDiscovery.serviceContext,
      dependencies,
      slaTargets,
      outputDir
    });

    artifacts.push(...serviceOverview.artifacts);
  }

  // ============================================================================
  // PHASE 3: DEPLOYMENT PROCEDURES DOCUMENTATION
  // ============================================================================

  let deploymentProcedures = null;
  if (shouldInclude('deployment')) {
    ctx.log('info', 'Phase 3: Documenting deployment and rollback procedures');
    deploymentProcedures = await ctx.task(deploymentProceduresTask, {
      serviceName,
      serviceType,
      environment,
      serviceContext: serviceDiscovery.serviceContext,
      outputDir
    });

    artifacts.push(...deploymentProcedures.artifacts);
  }

  // ============================================================================
  // PHASE 4: INCIDENT RESPONSE DOCUMENTATION
  // ============================================================================

  let incidentResponse = null;
  if (shouldInclude('incident-response')) {
    ctx.log('info', 'Phase 4: Documenting incident response procedures');
    incidentResponse = await ctx.task(incidentResponseTask, {
      serviceName,
      serviceType,
      slaTargets,
      teamContacts,
      serviceContext: serviceDiscovery.serviceContext,
      outputDir
    });

    artifacts.push(...incidentResponse.artifacts);
  }

  // ============================================================================
  // PHASE 5: TROUBLESHOOTING GUIDES DOCUMENTATION
  // ============================================================================

  let troubleshootingGuides = null;
  if (shouldInclude('troubleshooting')) {
    ctx.log('info', 'Phase 5: Creating troubleshooting guides and diagnostic procedures');
    troubleshootingGuides = await ctx.task(troubleshootingGuidesTask, {
      serviceName,
      serviceType,
      serviceContext: serviceDiscovery.serviceContext,
      commonIssues: serviceDiscovery.commonIssues || [],
      outputDir
    });

    artifacts.push(...troubleshootingGuides.artifacts);
  }

  // ============================================================================
  // PHASE 6: MONITORING AND ALERTING DOCUMENTATION
  // ============================================================================

  let monitoringDocs = null;
  if (shouldInclude('monitoring')) {
    ctx.log('info', 'Phase 6: Documenting monitoring dashboards and alert definitions');
    monitoringDocs = await ctx.task(monitoringDocumentationTask, {
      serviceName,
      serviceType,
      slaTargets,
      serviceContext: serviceDiscovery.serviceContext,
      outputDir
    });

    artifacts.push(...monitoringDocs.artifacts);
  }

  // ============================================================================
  // PHASE 7: MAINTENANCE PROCEDURES DOCUMENTATION
  // ============================================================================

  let maintenanceProcedures = null;
  if (shouldInclude('maintenance')) {
    ctx.log('info', 'Phase 7: Documenting routine maintenance and operational tasks');
    maintenanceProcedures = await ctx.task(maintenanceProceduresTask, {
      serviceName,
      serviceType,
      serviceContext: serviceDiscovery.serviceContext,
      outputDir
    });

    artifacts.push(...maintenanceProcedures.artifacts);
  }

  // ============================================================================
  // PHASE 8: ACCESS AND PERMISSIONS DOCUMENTATION
  // ============================================================================

  let accessDocs = null;
  if (shouldInclude('access')) {
    ctx.log('info', 'Phase 8: Documenting access procedures and permissions');
    accessDocs = await ctx.task(accessDocumentationTask, {
      serviceName,
      environment,
      teamContacts,
      serviceContext: serviceDiscovery.serviceContext,
      outputDir
    });

    artifacts.push(...accessDocs.artifacts);
  }

  // ============================================================================
  // PHASE 9: ASSEMBLE COMPLETE RUNBOOK
  // ============================================================================

  ctx.log('info', 'Phase 9: Assembling complete runbook document');
  const runbookAssembly = await ctx.task(runbookAssemblyTask, {
    serviceName,
    serviceType,
    environment,
    sections: {
      serviceOverview,
      deploymentProcedures,
      incidentResponse,
      troubleshootingGuides,
      monitoringDocs,
      maintenanceProcedures,
      accessDocs
    },
    teamContacts,
    outputDir
  });

  artifacts.push(...runbookAssembly.artifacts);

  // Breakpoint: Review assembled runbook
  await ctx.breakpoint({
    question: `Complete runbook for ${serviceName} assembled. Review the runbook structure and content?`,
    title: 'Runbook Assembly Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        serviceName,
        serviceType,
        environment,
        sectionsIncluded: Object.keys(runbookAssembly.sections).length,
        totalPages: runbookAssembly.estimatedPages,
        checklistItems: runbookAssembly.checklistCount
      }
    }
  });

  // ============================================================================
  // PHASE 10: QUALITY VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Validating runbook quality and completeness');
  const qualityValidation = await ctx.task(runbookQualityValidationTask, {
    serviceName,
    runbookDocument: runbookAssembly.runbookDocument,
    sections: runbookAssembly.sections,
    includeSections,
    outputDir
  });

  artifacts.push(...qualityValidation.artifacts);

  const qualityMet = qualityValidation.overallScore >= 80;

  // ============================================================================
  // PHASE 11: OPERATIONAL READINESS CHECKLIST
  // ============================================================================

  ctx.log('info', 'Phase 11: Generating operational readiness checklist');
  const readinessChecklist = await ctx.task(operationalReadinessTask, {
    serviceName,
    serviceType,
    runbookSections: runbookAssembly.sections,
    qualityScore: qualityValidation.overallScore,
    outputDir
  });

  artifacts.push(...readinessChecklist.artifacts);

  // Breakpoint: Review quality and readiness
  await ctx.breakpoint({
    question: `Runbook quality score: ${qualityValidation.overallScore}/100. ${qualityMet ? 'Quality standards met!' : 'May need improvements.'} Operational readiness: ${readinessChecklist.readinessPercentage}%. Proceed with finalization?`,
    title: 'Quality and Readiness Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        qualityScore: qualityValidation.overallScore,
        qualityMet,
        readinessPercentage: readinessChecklist.readinessPercentage,
        missingItems: readinessChecklist.missingItems.length,
        recommendations: qualityValidation.recommendations.length
      }
    }
  });

  // ============================================================================
  // PHASE 12: TEAM REVIEW (IF REQUIRED)
  // ============================================================================

  let reviewResult = null;
  if (requireReview && teamContacts.length > 0) {
    ctx.log('info', 'Phase 12: Conducting team review');
    reviewResult = await ctx.task(runbookReviewTask, {
      serviceName,
      runbookDocument: runbookAssembly.runbookDocument,
      teamContacts,
      qualityScore: qualityValidation.overallScore,
      outputDir
    });

    artifacts.push(...reviewResult.artifacts);

    // Breakpoint: Review approval gate
    await ctx.breakpoint({
      question: `Runbook review complete. ${reviewResult.approved ? 'Approved by team!' : 'Requires revisions.'} Finalize and publish?`,
      title: 'Runbook Review Approval',
      context: {
        runId: ctx.runId,
        files: artifacts.map(a => ({
          path: a.path,
          format: a.format || 'markdown',
          language: a.language || undefined,
          label: a.label || undefined
        })),
        summary: {
          approved: reviewResult.approved,
          reviewersCount: reviewResult.reviewers.length,
          feedbackItems: reviewResult.feedback.length,
          criticalIssues: reviewResult.criticalIssues
        }
      }
    });
  }

  // ============================================================================
  // PHASE 13: FINALIZE AND PUBLISH RUNBOOK
  // ============================================================================

  ctx.log('info', 'Phase 13: Finalizing and publishing runbook');
  const publishResult = await ctx.task(runbookPublishingTask, {
    serviceName,
    runbookDocument: runbookAssembly.runbookDocument,
    environment,
    qualityScore: qualityValidation.overallScore,
    readinessChecklist: readinessChecklist,
    outputDir
  });

  artifacts.push(...publishResult.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    serviceName,
    serviceType,
    environment,
    runbookPath: publishResult.publishedPath,
    sections: runbookAssembly.sections,
    qualityScore: qualityValidation.overallScore,
    operationalReadiness: readinessChecklist.readinessPercentage,
    approved: reviewResult ? reviewResult.approved : true,
    checklistItems: {
      total: readinessChecklist.totalItems,
      completed: readinessChecklist.completedItems,
      missing: readinessChecklist.missingItems.length
    },
    artifacts,
    duration,
    metadata: {
      processId: 'technical-documentation/runbook-docs',
      timestamp: startTime,
      outputDir,
      includedSections: includeSections
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Service Discovery
export const serviceDiscoveryTask = defineTask('service-discovery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Discover service information and operational context',
  agent: {
    name: 'sre-analyst',
    prompt: {
      role: 'site reliability engineer and service analyst',
      task: 'Gather comprehensive information about the service for runbook documentation',
      context: args,
      instructions: [
        'Analyze service architecture and technology stack',
        'Identify service boundaries and responsibilities',
        'Document critical dependencies (databases, APIs, external services)',
        'Identify data stores and state management',
        'Analyze deployment configuration and infrastructure',
        'Review existing monitoring and alerting setup',
        'Identify common operational issues from logs/metrics',
        'Document service criticality and business impact',
        'Gather SLA/SLO information',
        'Identify key service metrics and health indicators',
        'Document service owners and stakeholders',
        'Save service context analysis to output directory'
      ],
      outputFormat: 'JSON with serviceContext (object with architecture, tech stack, dependencies, criticality), commonIssues (array), healthIndicators (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['serviceContext', 'artifacts'],
      properties: {
        serviceContext: {
          type: 'object',
          properties: {
            architecture: { type: 'string' },
            techStack: { type: 'array', items: { type: 'string' } },
            criticality: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
            businessImpact: { type: 'string' },
            scalability: { type: 'object' },
            performanceCharacteristics: { type: 'object' }
          }
        },
        dependencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              criticality: { type: 'string' },
              fallbackStrategy: { type: 'string' }
            }
          }
        },
        commonIssues: { type: 'array', items: { type: 'string' } },
        healthIndicators: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'runbook', 'service-discovery', 'sre']
}));

// Task 2: Service Overview Documentation
export const serviceOverviewTask = defineTask('service-overview', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document service overview and architecture',
  agent: {
    name: 'technical-writer-sre',
    prompt: {
      role: 'technical writer specializing in operational documentation',
      task: 'Create comprehensive service overview section for runbook',
      context: args,
      instructions: [
        'Write clear service description (what it does, why it exists)',
        'Document service purpose and business context',
        'Describe high-level architecture with component diagram',
        'List technology stack (languages, frameworks, infrastructure)',
        'Document service boundaries and scope',
        'Identify and describe critical dependencies',
        'Document data flow and integration points',
        'Specify SLA targets (availability, latency, throughput)',
        'Document capacity and scaling characteristics',
        'List key service metrics and KPIs',
        'Identify service owners and team contacts',
        'Include service repository and documentation links',
        'Save service overview documentation to output directory'
      ],
      outputFormat: 'JSON with overviewDocument (markdown content), componentDiagram (description), slaTable (markdown table), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overviewDocument', 'artifacts'],
      properties: {
        overviewDocument: { type: 'string' },
        componentDiagram: { type: 'string' },
        slaTable: { type: 'string' },
        serviceMetrics: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'runbook', 'service-overview', 'documentation']
}));

// Task 3: Deployment Procedures Documentation
export const deploymentProceduresTask = defineTask('deployment-procedures', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document deployment and rollback procedures',
  agent: {
    name: 'devops-engineer',
    prompt: {
      role: 'DevOps engineer and deployment specialist',
      task: 'Create detailed deployment and rollback procedures',
      context: args,
      instructions: [
        'Document pre-deployment checklist (prerequisites, validations)',
        'Create step-by-step deployment procedure:',
        '  - Environment preparation',
        '  - Configuration updates',
        '  - Database migrations (if applicable)',
        '  - Service deployment steps',
        '  - Health check verification',
        '  - Traffic shifting/canary deployment',
        '  - Post-deployment validation',
        'Document rollback procedure:',
        '  - Rollback decision criteria',
        '  - Step-by-step rollback steps',
        '  - Database rollback (if applicable)',
        '  - Verification after rollback',
        'Include deployment timings and maintenance windows',
        'Document zero-downtime deployment strategies',
        'List deployment tools and access requirements',
        'Include common deployment issues and solutions',
        'Add deployment communication templates',
        'Save deployment procedures to output directory'
      ],
      outputFormat: 'JSON with deploymentProcedure (markdown checklist), rollbackProcedure (markdown checklist), deploymentDiagram (description), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['deploymentProcedure', 'rollbackProcedure', 'artifacts'],
      properties: {
        deploymentProcedure: { type: 'string' },
        rollbackProcedure: { type: 'string' },
        deploymentDiagram: { type: 'string' },
        preDeploymentChecklist: { type: 'array', items: { type: 'string' } },
        postDeploymentChecklist: { type: 'array', items: { type: 'string' } },
        estimatedDuration: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'runbook', 'deployment', 'devops']
}));

// Task 4: Incident Response Documentation
export const incidentResponseTask = defineTask('incident-response', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document incident response procedures',
  agent: {
    name: 'incident-commander',
    prompt: {
      role: 'incident commander and SRE specialist',
      task: 'Create comprehensive incident response procedures and playbooks',
      context: args,
      instructions: [
        'Document incident severity levels and classification',
        'Create incident response workflow:',
        '  - Detection and alerting',
        '  - Initial response and triage',
        '  - Investigation and diagnosis',
        '  - Mitigation and resolution',
        '  - Communication and escalation',
        '  - Post-incident review',
        'Document on-call procedures and rotation',
        'List escalation paths and contact information',
        'Create communication templates:',
        '  - Initial incident notification',
        '  - Status updates',
        '  - Resolution notification',
        '  - Post-mortem summary',
        'Document incident command roles (commander, scribe, liaison)',
        'Include common incident scenarios and response playbooks',
        'Document service degradation vs. outage criteria',
        'List tools for incident management (PagerDuty, Slack, etc.)',
        'Include SLA breach response procedures',
        'Save incident response documentation to output directory'
      ],
      outputFormat: 'JSON with incidentResponseDoc (markdown), severityLevels (table), escalationPath (diagram), playbooks (array), communicationTemplates (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['incidentResponseDoc', 'severityLevels', 'artifacts'],
      properties: {
        incidentResponseDoc: { type: 'string' },
        severityLevels: { type: 'string' },
        escalationPath: { type: 'string' },
        playbooks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              symptoms: { type: 'array', items: { type: 'string' } },
              steps: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        communicationTemplates: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'runbook', 'incident-response', 'sre']
}));

// Task 5: Troubleshooting Guides Documentation
export const troubleshootingGuidesTask = defineTask('troubleshooting-guides', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create troubleshooting guides and diagnostic procedures',
  agent: {
    name: 'sre-troubleshooter',
    prompt: {
      role: 'senior SRE and troubleshooting expert',
      task: 'Create comprehensive troubleshooting guides for common and critical issues',
      context: args,
      instructions: [
        'Identify common service issues and failure modes',
        'For each issue, document:',
        '  - Symptom description (what users/operators see)',
        '  - Impact and severity',
        '  - Diagnostic steps (how to confirm the issue)',
        '  - Root cause analysis guidance',
        '  - Resolution steps (detailed procedures)',
        '  - Prevention measures',
        'Create decision trees for complex troubleshooting scenarios',
        'Document diagnostic commands and tools:',
        '  - Log queries and analysis',
        '  - Metrics to check',
        '  - Health check commands',
        '  - Database queries for investigation',
        'Include troubleshooting by symptom (high latency, errors, etc.)',
        'Document emergency procedures (circuit breakers, feature flags)',
        'Add known issues and workarounds',
        'Include when to escalate vs. resolve independently',
        'Save troubleshooting documentation to output directory'
      ],
      outputFormat: 'JSON with troubleshootingDoc (markdown), commonIssues (array of issue objects), diagnosticCommands (object), decisionTrees (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['troubleshootingDoc', 'commonIssues', 'artifacts'],
      properties: {
        troubleshootingDoc: { type: 'string' },
        commonIssues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              symptoms: { type: 'array', items: { type: 'string' } },
              diagnostics: { type: 'array', items: { type: 'string' } },
              resolution: { type: 'array', items: { type: 'string' } },
              prevention: { type: 'string' }
            }
          }
        },
        diagnosticCommands: { type: 'object' },
        decisionTrees: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'runbook', 'troubleshooting', 'sre']
}));

// Task 6: Monitoring and Alerting Documentation
export const monitoringDocumentationTask = defineTask('monitoring-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document monitoring dashboards and alert definitions',
  agent: {
    name: 'observability-engineer',
    prompt: {
      role: 'observability engineer and monitoring specialist',
      task: 'Create comprehensive monitoring and alerting documentation',
      context: args,
      instructions: [
        'Document key service metrics and their meanings:',
        '  - Request rate, error rate, latency (RED metrics)',
        '  - Resource utilization (CPU, memory, disk, network)',
        '  - Business metrics and KPIs',
        '  - Dependency health metrics',
        'Document monitoring dashboards:',
        '  - Dashboard URLs and access instructions',
        '  - Description of each dashboard and its purpose',
        '  - Key panels and visualizations to watch',
        '  - Interpretation guidance (what is normal vs. abnormal)',
        'Document alert definitions:',
        '  - Alert name and description',
        '  - Triggering conditions and thresholds',
        '  - Severity level and escalation',
        '  - Expected response time',
        '  - Investigation and resolution guidance',
        'Include log aggregation and querying:',
        '  - Log locations and formats',
        '  - Common log queries',
        '  - Error pattern identification',
        'Document tracing and profiling tools',
        'Include SLI/SLO monitoring and error budget tracking',
        'List monitoring tools and access procedures',
        'Save monitoring documentation to output directory'
      ],
      outputFormat: 'JSON with monitoringDoc (markdown), dashboards (array), alerts (array), logQueries (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['monitoringDoc', 'dashboards', 'alerts', 'artifacts'],
      properties: {
        monitoringDoc: { type: 'string' },
        dashboards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              url: { type: 'string' },
              purpose: { type: 'string' },
              keyMetrics: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        alerts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              severity: { type: 'string' },
              threshold: { type: 'string' },
              responseGuidance: { type: 'string' }
            }
          }
        },
        logQueries: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'runbook', 'monitoring', 'observability']
}));

// Task 7: Maintenance Procedures Documentation
export const maintenanceProceduresTask = defineTask('maintenance-procedures', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document routine maintenance and operational tasks',
  agent: {
    name: 'operations-engineer',
    prompt: {
      role: 'operations engineer and maintenance specialist',
      task: 'Create documentation for routine maintenance and operational procedures',
      context: args,
      instructions: [
        'Document scheduled maintenance procedures:',
        '  - Database maintenance (vacuuming, reindexing, backups)',
        '  - Log rotation and cleanup',
        '  - Certificate renewal',
        '  - Dependency updates and patching',
        '  - Performance tuning and optimization',
        'Document backup and restore procedures:',
        '  - Backup schedule and retention policy',
        '  - Backup verification procedures',
        '  - Restore procedure and testing',
        '  - Disaster recovery steps',
        'Document capacity management:',
        '  - Resource monitoring and forecasting',
        '  - Scaling procedures (horizontal and vertical)',
        '  - Capacity planning guidelines',
        'Document configuration management:',
        '  - Configuration change procedures',
        '  - Configuration backup and versioning',
        '  - Rollback procedures',
        'Include routine operational tasks:',
        '  - Health check procedures',
        '  - Performance baseline collection',
        '  - Security scanning and updates',
        'Document maintenance windows and scheduling',
        'Include validation and verification steps',
        'Save maintenance procedures to output directory'
      ],
      outputFormat: 'JSON with maintenanceDoc (markdown), scheduledTasks (array), backupProcedures (object), capacityGuidance (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['maintenanceDoc', 'scheduledTasks', 'artifacts'],
      properties: {
        maintenanceDoc: { type: 'string' },
        scheduledTasks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              task: { type: 'string' },
              frequency: { type: 'string' },
              procedure: { type: 'array', items: { type: 'string' } },
              owner: { type: 'string' }
            }
          }
        },
        backupProcedures: { type: 'object' },
        capacityGuidance: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'runbook', 'maintenance', 'operations']
}));

// Task 8: Access and Permissions Documentation
export const accessDocumentationTask = defineTask('access-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document access procedures and permissions',
  agent: {
    name: 'security-operations',
    prompt: {
      role: 'security operations specialist',
      task: 'Create documentation for access management and permissions',
      context: args,
      instructions: [
        'Document access requirements for operations:',
        '  - Production access (who needs it, approval process)',
        '  - Database access (read-only vs. write access)',
        '  - Infrastructure access (cloud console, Kubernetes)',
        '  - Monitoring and logging access',
        '  - Deployment tool access',
        'Create access request procedures:',
        '  - How to request access',
        '  - Approval workflow',
        '  - Access provisioning steps',
        '  - Access review and revocation',
        'Document authentication and authorization:',
        '  - SSO and identity provider setup',
        '  - Service accounts and API keys',
        '  - Role-based access control (RBAC)',
        '  - Least privilege principles',
        'Document emergency access procedures:',
        '  - Break-glass access for incidents',
        '  - Emergency access logging and auditing',
        '  - Post-incident access review',
        'List required tools and credentials:',
        '  - VPN access',
        '  - Bastion hosts and jump boxes',
        '  - Secret management (vault, parameter store)',
        'Include security best practices',
        'Document compliance requirements (SOC2, GDPR, etc.)',
        'Save access documentation to output directory'
      ],
      outputFormat: 'JSON with accessDoc (markdown), accessMatrix (table), requestProcedure (steps), emergencyAccess (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['accessDoc', 'artifacts'],
      properties: {
        accessDoc: { type: 'string' },
        accessMatrix: { type: 'string' },
        requestProcedure: { type: 'array', items: { type: 'string' } },
        emergencyAccess: { type: 'object' },
        requiredTools: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'runbook', 'access', 'security']
}));

// Task 9: Runbook Assembly
export const runbookAssemblyTask = defineTask('runbook-assembly', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assemble complete runbook document',
  agent: {
    name: 'documentation-engineer',
    prompt: {
      role: 'documentation engineer and technical writer',
      task: 'Assemble all sections into a cohesive runbook document',
      context: args,
      instructions: [
        'Create runbook structure with table of contents',
        'Add runbook header with metadata:',
        '  - Service name and version',
        '  - Last updated date',
        '  - Document owner and contacts',
        '  - Runbook version',
        'Assemble sections in logical order:',
        '  1. Service Overview',
        '  2. Deployment Procedures',
        '  3. Incident Response',
        '  4. Troubleshooting Guides',
        '  5. Monitoring and Alerting',
        '  6. Maintenance Procedures',
        '  7. Access and Permissions',
        '  8. Appendices (links, references, glossary)',
        'Ensure consistent formatting and style',
        'Add cross-references between sections',
        'Include quick reference cards for common tasks',
        'Add visual elements (diagrams, flowcharts, tables)',
        'Create executive summary for management',
        'Include document changelog',
        'Add links to related documentation',
        'Generate PDF and HTML versions',
        'Save complete runbook to output directory'
      ],
      outputFormat: 'JSON with runbookDocument (complete markdown), sections (object with section metadata), tableOfContents (markdown), estimatedPages (number), checklistCount (number), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['runbookDocument', 'sections', 'artifacts'],
      properties: {
        runbookDocument: { type: 'string' },
        sections: { type: 'object' },
        tableOfContents: { type: 'string' },
        estimatedPages: { type: 'number' },
        checklistCount: { type: 'number' },
        wordCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'runbook', 'assembly', 'documentation']
}));

// Task 10: Runbook Quality Validation
export const runbookQualityValidationTask = defineTask('runbook-quality-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate runbook quality and completeness',
  agent: {
    name: 'quality-auditor',
    prompt: {
      role: 'documentation quality auditor and SRE principal',
      task: 'Assess runbook quality, completeness, and operational effectiveness',
      context: args,
      instructions: [
        'Evaluate completeness (weight: 30%):',
        '  - Are all required sections present?',
        '  - Is critical information documented?',
        '  - Are procedures complete and actionable?',
        'Evaluate clarity and usability (weight: 25%):',
        '  - Are procedures clear and unambiguous?',
        '  - Can operators follow them without confusion?',
        '  - Is technical jargon explained?',
        '  - Are checklists easy to follow?',
        'Evaluate accuracy and currency (weight: 20%):',
        '  - Is information up-to-date?',
        '  - Are links and references valid?',
        '  - Are contact details current?',
        '  - Are procedures tested?',
        'Evaluate operational readiness (weight: 15%):',
        '  - Can new team members use this runbook?',
        '  - Are incident response procedures adequate?',
        '  - Is troubleshooting guidance sufficient?',
        'Evaluate structure and navigation (weight: 10%):',
        '  - Is document well-organized?',
        '  - Is table of contents comprehensive?',
        '  - Are cross-references helpful?',
        'Calculate weighted overall score (0-100)',
        'Identify gaps and missing elements',
        'Provide specific improvement recommendations',
        'Assess operational readiness level'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), componentScores (object), completeness (object), gaps (array), recommendations (array), readinessLevel (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            completeness: { type: 'number' },
            clarity: { type: 'number' },
            accuracy: { type: 'number' },
            operationalReadiness: { type: 'number' },
            structureNavigation: { type: 'number' }
          }
        },
        completeness: {
          type: 'object',
          properties: {
            hasServiceOverview: { type: 'boolean' },
            hasDeployment: { type: 'boolean' },
            hasIncidentResponse: { type: 'boolean' },
            hasTroubleshooting: { type: 'boolean' },
            hasMonitoring: { type: 'boolean' },
            hasMaintenance: { type: 'boolean' },
            hasAccess: { type: 'boolean' }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        readinessLevel: { type: 'string', enum: ['excellent', 'good', 'fair', 'needs-improvement'] },
        strengths: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'runbook', 'quality-validation', 'audit']
}));

// Task 11: Operational Readiness Checklist
export const operationalReadinessTask = defineTask('operational-readiness', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate operational readiness checklist',
  agent: {
    name: 'sre-lead',
    prompt: {
      role: 'SRE team lead and operational readiness expert',
      task: 'Generate comprehensive operational readiness checklist',
      context: args,
      instructions: [
        'Create operational readiness checklist covering:',
        '  - Documentation completeness (runbook, architecture docs)',
        '  - Monitoring and alerting setup',
        '  - Incident response preparedness',
        '  - Deployment automation and procedures',
        '  - Backup and disaster recovery',
        '  - Security and compliance',
        '  - Team training and knowledge transfer',
        '  - On-call rotation setup',
        '  - Capacity planning and scaling',
        '  - SLA/SLO definitions and tracking',
        'For each item, indicate:',
        '  - Requirement description',
        '  - Status (complete, in-progress, missing)',
        '  - Priority (critical, high, medium, low)',
        '  - Owner/responsible party',
        '  - Dependencies and blockers',
        'Calculate overall readiness percentage',
        'Identify critical missing items',
        'Provide recommendations for achieving readiness',
        'Create timeline for completing missing items',
        'Save operational readiness report to output directory'
      ],
      outputFormat: 'JSON with checklistItems (array), readinessPercentage (number), missingItems (array), criticalGaps (array), recommendations (array), timeline (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['checklistItems', 'readinessPercentage', 'missingItems', 'artifacts'],
      properties: {
        checklistItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              item: { type: 'string' },
              status: { type: 'string', enum: ['complete', 'in-progress', 'missing'] },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        readinessPercentage: { type: 'number', minimum: 0, maximum: 100 },
        totalItems: { type: 'number' },
        completedItems: { type: 'number' },
        missingItems: { type: 'array', items: { type: 'string' } },
        criticalGaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        timeline: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'runbook', 'operational-readiness', 'checklist']
}));

// Task 12: Runbook Review
export const runbookReviewTask = defineTask('runbook-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct team review of runbook',
  agent: {
    name: 'sre-team-lead',
    prompt: {
      role: 'SRE team lead facilitating runbook review',
      task: 'Facilitate team review and gather feedback on runbook',
      context: args,
      instructions: [
        'Simulate review meeting with team members',
        'Review runbook completeness and accuracy',
        'Evaluate operational effectiveness:',
        '  - Can team members execute procedures?',
        '  - Are troubleshooting guides helpful?',
        '  - Is information easy to find?',
        'Check for missing procedures or information',
        'Verify contact information and links',
        'Test sample procedures (if possible)',
        'Gather feedback from reviewers:',
        '  - SREs and operations engineers',
        '  - On-call engineers',
        '  - Service owners and developers',
        'Document concerns and suggestions',
        'Identify critical issues requiring fixes',
        'Determine if runbook is ready for production use',
        'Recommend approval or revisions needed',
        'Document review outcome and action items'
      ],
      outputFormat: 'JSON with approved (boolean), reviewers (array), feedback (array), criticalIssues (array), suggestions (array), actionItems (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'reviewers', 'feedback', 'artifacts'],
      properties: {
        approved: { type: 'boolean' },
        reviewers: { type: 'array', items: { type: 'string' } },
        feedback: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              reviewer: { type: 'string' },
              comment: { type: 'string' },
              category: { type: 'string' },
              severity: { type: 'string', enum: ['minor', 'major', 'critical'] }
            }
          }
        },
        criticalIssues: { type: 'array', items: { type: 'string' } },
        suggestions: { type: 'array', items: { type: 'string' } },
        actionItems: { type: 'array', items: { type: 'string' } },
        approvalConditions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'runbook', 'review', 'team-collaboration']
}));

// Task 13: Runbook Publishing
export const runbookPublishingTask = defineTask('runbook-publishing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Finalize and publish runbook',
  agent: {
    name: 'documentation-publisher',
    prompt: {
      role: 'documentation publisher and operations coordinator',
      task: 'Finalize runbook and publish to accessible location',
      context: args,
      instructions: [
        'Finalize runbook document with approval stamps',
        'Add publication metadata:',
        '  - Publication date',
        '  - Runbook version',
        '  - Approval status',
        '  - Next review date',
        'Generate multiple formats:',
        '  - Markdown (source)',
        '  - HTML (web viewing)',
        '  - PDF (printable)',
        '  - Searchable wiki format (if applicable)',
        'Publish to documentation repository:',
        '  - Commit to version control',
        '  - Update documentation index',
        '  - Deploy to documentation site',
        'Create quick reference card (one-pager)',
        'Notify team members of publication:',
        '  - Email notification',
        '  - Slack/Teams announcement',
        '  - Add to team wiki/knowledge base',
        'Schedule first review date (3-6 months)',
        'Create runbook maintenance plan',
        'Document publication details and location',
        'Save publication report to output directory'
      ],
      outputFormat: 'JSON with publishedPath (string), formats (array), version (string), publicationDate (string), reviewDate (string), notificationsSent (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['publishedPath', 'formats', 'version', 'publicationDate', 'artifacts'],
      properties: {
        publishedPath: { type: 'string' },
        formats: { type: 'array', items: { type: 'string' } },
        version: { type: 'string' },
        publicationDate: { type: 'string' },
        reviewDate: { type: 'string' },
        notificationsSent: { type: 'array', items: { type: 'string' } },
        quickReferenceCard: { type: 'string' },
        maintenancePlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'runbook', 'publishing', 'documentation']
}));
