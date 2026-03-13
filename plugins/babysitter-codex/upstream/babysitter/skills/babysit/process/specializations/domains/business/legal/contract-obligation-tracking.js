/**
 * @process specializations/domains/business/legal/contract-obligation-tracking
 * @description Contract Obligation Tracking - Automated obligation extraction and tracking system to ensure
 * compliance with contractual commitments and deadlines.
 * @inputs { contractId: string, contractPath?: string, action?: string, outputDir?: string }
 * @outputs { success: boolean, obligations: array, upcomingDeadlines: array, complianceStatus: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/legal/contract-obligation-tracking', {
 *   contractId: 'CTR-2024-001',
 *   contractPath: 'contracts/executed/msa-acme-2024.pdf',
 *   action: 'extract-and-track',
 *   outputDir: 'obligation-tracking'
 * });
 *
 * @references
 * - NCMA Contract Management Body of Knowledge: https://www.ncmahq.org/education-certification/cmbok
 * - Contract Obligation Management: https://www.worldcc.com/
 * - Icertis Obligation Management: https://www.icertis.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    contractId,
    contractPath = null,
    action = 'extract-and-track', // 'extract', 'track', 'extract-and-track', 'report', 'update'
    obligationId = null,
    updateData = null,
    reportPeriod = 'monthly',
    alertDays = 30,
    outputDir = 'obligation-tracking-output',
    enableNotifications = true,
    trackingSystem = 'internal'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let obligations = [];
  let upcomingDeadlines = [];
  let complianceStatus = {};

  ctx.log('info', `Starting Obligation Tracking for ${contractId}`);
  ctx.log('info', `Action: ${action}`);

  // ============================================================================
  // ACTION ROUTING
  // ============================================================================

  switch (action) {
    case 'extract':
      return await extractObligations(ctx, contractId, contractPath, outputDir, artifacts);

    case 'track':
      return await trackObligations(ctx, contractId, alertDays, enableNotifications, outputDir, artifacts);

    case 'extract-and-track':
      // Extract then track
      const extractResult = await extractObligations(ctx, contractId, contractPath, outputDir, artifacts);
      if (!extractResult.success) return extractResult;

      obligations = extractResult.obligations;
      return await trackObligations(ctx, contractId, alertDays, enableNotifications, outputDir, artifacts, obligations);

    case 'report':
      return await generateReport(ctx, contractId, reportPeriod, outputDir, artifacts);

    case 'update':
      return await updateObligation(ctx, contractId, obligationId, updateData, outputDir, artifacts);

    default:
      return {
        success: false,
        error: `Unknown action: ${action}`,
        validActions: ['extract', 'track', 'extract-and-track', 'report', 'update']
      };
  }
}

// ============================================================================
// ACTION PROCESSORS
// ============================================================================

async function extractObligations(ctx, contractId, contractPath, outputDir, artifacts) {
  ctx.log('info', 'Phase 1: Extracting obligations from contract');

  // Parse contract document
  const contractParsing = await ctx.task(contractParsingForObligationsTask, {
    contractId,
    contractPath,
    outputDir
  });

  artifacts.push(...contractParsing.artifacts);

  if (!contractParsing.success) {
    return {
      success: false,
      error: 'Failed to parse contract',
      details: contractParsing.error,
      artifacts
    };
  }

  // Extract obligations
  ctx.log('info', 'Phase 2: Identifying obligations');

  const obligationExtraction = await ctx.task(obligationExtractionTask, {
    contractId,
    parsedContract: contractParsing.content,
    outputDir
  });

  artifacts.push(...obligationExtraction.artifacts);

  // Categorize obligations
  ctx.log('info', 'Phase 3: Categorizing obligations');

  const categorization = await ctx.task(obligationCategorizationTask, {
    contractId,
    obligations: obligationExtraction.obligations,
    outputDir
  });

  artifacts.push(...categorization.artifacts);

  // Extract deadlines and milestones
  ctx.log('info', 'Phase 4: Extracting deadlines and milestones');

  const deadlineExtraction = await ctx.task(deadlineExtractionTask, {
    contractId,
    obligations: categorization.categorizedObligations,
    outputDir
  });

  artifacts.push(...deadlineExtraction.artifacts);

  // Assign owners
  ctx.log('info', 'Phase 5: Assigning obligation owners');

  const ownerAssignment = await ctx.task(ownerAssignmentTask, {
    contractId,
    obligations: deadlineExtraction.obligations,
    outputDir
  });

  artifacts.push(...ownerAssignment.artifacts);

  const obligations = ownerAssignment.obligations;

  await ctx.breakpoint({
    question: `Extracted ${obligations.length} obligations from contract ${contractId}. ${deadlineExtraction.upcomingCount} have upcoming deadlines. Review and approve?`,
    title: 'Obligation Extraction Review',
    context: {
      runId: ctx.runId,
      contractId,
      obligationCount: obligations.length,
      categories: categorization.categories,
      upcomingDeadlines: deadlineExtraction.upcomingCount,
      files: artifacts.slice(-2).map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  return {
    success: true,
    contractId,
    action: 'extract',
    obligations,
    categories: categorization.categories,
    upcomingDeadlines: deadlineExtraction.upcomingDeadlines,
    artifacts,
    metadata: {
      processId: 'specializations/domains/business/legal/contract-obligation-tracking',
      timestamp: ctx.now()
    }
  };
}

async function trackObligations(ctx, contractId, alertDays, enableNotifications, outputDir, artifacts, existingObligations = null) {
  ctx.log('info', 'Tracking obligation compliance');

  // Load or use existing obligations
  let obligations = existingObligations;
  if (!obligations) {
    const loadResult = await ctx.task(loadObligationsTask, {
      contractId,
      outputDir
    });
    artifacts.push(...loadResult.artifacts);
    obligations = loadResult.obligations;
  }

  // Check compliance status
  ctx.log('info', 'Checking compliance status');

  const complianceCheck = await ctx.task(complianceCheckTask, {
    contractId,
    obligations,
    outputDir
  });

  artifacts.push(...complianceCheck.artifacts);

  // Identify upcoming deadlines
  ctx.log('info', 'Identifying upcoming deadlines');

  const upcomingDeadlines = await ctx.task(upcomingDeadlinesTask, {
    contractId,
    obligations,
    alertDays,
    outputDir
  });

  artifacts.push(...upcomingDeadlines.artifacts);

  // Send notifications if enabled
  if (enableNotifications && upcomingDeadlines.alerts.length > 0) {
    ctx.log('info', 'Sending notifications');

    const notifications = await ctx.task(notificationTask, {
      contractId,
      alerts: upcomingDeadlines.alerts,
      outputDir
    });

    artifacts.push(...notifications.artifacts);
  }

  // Generate tracking report
  const trackingReport = await ctx.task(trackingReportTask, {
    contractId,
    obligations,
    complianceStatus: complianceCheck.status,
    upcomingDeadlines: upcomingDeadlines.deadlines,
    outputDir
  });

  artifacts.push(...trackingReport.artifacts);

  return {
    success: true,
    contractId,
    action: 'track',
    obligations,
    complianceStatus: complianceCheck.status,
    upcomingDeadlines: upcomingDeadlines.deadlines,
    alerts: upcomingDeadlines.alerts,
    reportPath: trackingReport.reportPath,
    artifacts,
    metadata: {
      processId: 'specializations/domains/business/legal/contract-obligation-tracking',
      timestamp: ctx.now()
    }
  };
}

async function generateReport(ctx, contractId, reportPeriod, outputDir, artifacts) {
  ctx.log('info', `Generating ${reportPeriod} obligation report`);

  // Load obligations
  const loadResult = await ctx.task(loadObligationsTask, {
    contractId,
    outputDir
  });
  artifacts.push(...loadResult.artifacts);

  // Generate comprehensive report
  const report = await ctx.task(comprehensiveReportTask, {
    contractId,
    obligations: loadResult.obligations,
    reportPeriod,
    outputDir
  });

  artifacts.push(...report.artifacts);

  await ctx.breakpoint({
    question: `Obligation report for ${contractId} generated. Compliance rate: ${report.complianceRate}%. Review report?`,
    title: 'Obligation Report Review',
    context: {
      runId: ctx.runId,
      contractId,
      reportPeriod,
      complianceRate: report.complianceRate,
      files: [{ path: report.reportPath, format: 'markdown', label: 'Obligation Report' }]
    }
  });

  return {
    success: true,
    contractId,
    action: 'report',
    reportPath: report.reportPath,
    complianceRate: report.complianceRate,
    summary: report.summary,
    artifacts,
    metadata: {
      processId: 'specializations/domains/business/legal/contract-obligation-tracking',
      timestamp: ctx.now()
    }
  };
}

async function updateObligation(ctx, contractId, obligationId, updateData, outputDir, artifacts) {
  ctx.log('info', `Updating obligation ${obligationId}`);

  const update = await ctx.task(obligationUpdateTask, {
    contractId,
    obligationId,
    updateData,
    outputDir
  });

  artifacts.push(...update.artifacts);

  return {
    success: true,
    contractId,
    obligationId,
    action: 'update',
    previousStatus: update.previousStatus,
    newStatus: update.newStatus,
    artifacts,
    metadata: {
      processId: 'specializations/domains/business/legal/contract-obligation-tracking',
      timestamp: ctx.now()
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const contractParsingForObligationsTask = defineTask('contract-parsing-obligations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Parse contract for obligation extraction',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Contract Parser',
      task: 'Parse contract document to extract content for obligation identification',
      context: args,
      instructions: [
        'Load contract document',
        'Extract all text content',
        'Identify sections and subsections',
        'Parse defined terms',
        'Extract party information',
        'Identify dates and time periods',
        'Structure content for analysis'
      ],
      outputFormat: 'JSON with success, content object, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        content: { type: 'object' },
        parties: { type: 'array', items: { type: 'string' } },
        effectiveDate: { type: 'string' },
        termEndDate: { type: 'string' },
        error: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'obligation-tracking', 'parsing']
}));

export const obligationExtractionTask = defineTask('obligation-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Extract obligations from contract',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Obligation Extraction Specialist',
      task: 'Extract all contractual obligations from parsed contract',
      context: args,
      instructions: [
        'Identify obligation language (shall, must, will, agrees to)',
        'Extract delivery obligations',
        'Extract payment obligations',
        'Extract reporting obligations',
        'Extract compliance obligations',
        'Extract notification obligations',
        'Extract performance obligations',
        'Extract confidentiality obligations',
        'Document obligation source (section/clause)',
        'Identify obligated party for each'
      ],
      outputFormat: 'JSON with obligations array, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['obligations', 'artifacts'],
      properties: {
        obligations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              text: { type: 'string' },
              obligatedParty: { type: 'string' },
              sourceSection: { type: 'string' },
              type: { type: 'string' }
            }
          }
        },
        totalCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'obligation-tracking', 'extraction']
}));

export const obligationCategorizationTask = defineTask('obligation-categorization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Categorize obligations',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Obligation Categorization Specialist',
      task: 'Categorize extracted obligations by type and priority',
      context: args,
      instructions: [
        'Categorize by type (payment, delivery, reporting, compliance)',
        'Assign priority level (critical, high, medium, low)',
        'Identify recurring vs one-time obligations',
        'Flag time-sensitive obligations',
        'Group related obligations',
        'Identify dependencies between obligations'
      ],
      outputFormat: 'JSON with categorizedObligations, categories, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['categorizedObligations', 'categories', 'artifacts'],
      properties: {
        categorizedObligations: { type: 'array', items: { type: 'object' } },
        categories: { type: 'array', items: { type: 'string' } },
        priorityBreakdown: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'obligation-tracking', 'categorization']
}));

export const deadlineExtractionTask = defineTask('deadline-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Extract deadlines and milestones',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Deadline Extraction Specialist',
      task: 'Extract specific deadlines and milestones for each obligation',
      context: args,
      instructions: [
        'Parse date references in obligations',
        'Calculate recurring schedule dates',
        'Identify milestone deadlines',
        'Parse relative date expressions (30 days after)',
        'Create calendar of deadlines',
        'Identify upcoming deadlines (next 90 days)',
        'Flag overdue obligations'
      ],
      outputFormat: 'JSON with obligations (with deadlines), upcomingDeadlines, upcomingCount, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['obligations', 'upcomingDeadlines', 'artifacts'],
      properties: {
        obligations: { type: 'array', items: { type: 'object' } },
        upcomingDeadlines: { type: 'array', items: { type: 'object' } },
        upcomingCount: { type: 'number' },
        overdueCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'obligation-tracking', 'deadlines']
}));

export const ownerAssignmentTask = defineTask('owner-assignment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assign obligation owners',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Obligation Assignment Specialist',
      task: 'Assign appropriate owners to each obligation',
      context: args,
      instructions: [
        'Identify responsible department for each obligation type',
        'Assign primary owner',
        'Assign backup owner',
        'Consider obligation complexity',
        'Document escalation path',
        'Create assignment notifications'
      ],
      outputFormat: 'JSON with obligations (with owners), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['obligations', 'artifacts'],
      properties: {
        obligations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              owner: { type: 'string' },
              backupOwner: { type: 'string' },
              department: { type: 'string' }
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
  labels: ['agent', 'obligation-tracking', 'assignment']
}));

export const loadObligationsTask = defineTask('load-obligations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Load existing obligations',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Obligation Data Specialist',
      task: 'Load existing obligations for contract from tracking system',
      context: args,
      instructions: [
        'Query obligation tracking system',
        'Load all obligations for contract',
        'Include current status',
        'Include compliance history',
        'Return formatted obligations'
      ],
      outputFormat: 'JSON with obligations array, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['obligations', 'artifacts'],
      properties: {
        obligations: { type: 'array', items: { type: 'object' } },
        totalCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'obligation-tracking', 'load']
}));

export const complianceCheckTask = defineTask('compliance-check', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Check compliance status',
  agent: {
    name: 'compliance-specialist',
    prompt: {
      role: 'Compliance Checking Specialist',
      task: 'Check compliance status for all obligations',
      context: args,
      instructions: [
        'Review each obligation status',
        'Check completion evidence',
        'Identify compliant obligations',
        'Identify non-compliant obligations',
        'Calculate compliance rate',
        'Identify at-risk obligations',
        'Document compliance issues'
      ],
      outputFormat: 'JSON with status object, complianceRate, issues, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'artifacts'],
      properties: {
        status: {
          type: 'object',
          properties: {
            compliant: { type: 'number' },
            nonCompliant: { type: 'number' },
            pending: { type: 'number' },
            atRisk: { type: 'number' },
            complianceRate: { type: 'number' }
          }
        },
        issues: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'obligation-tracking', 'compliance']
}));

export const upcomingDeadlinesTask = defineTask('upcoming-deadlines', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify upcoming deadlines',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Deadline Monitoring Specialist',
      task: 'Identify upcoming deadlines within alert period',
      context: args,
      instructions: [
        'Filter obligations by deadline',
        'Identify deadlines within alert period',
        'Prioritize by urgency',
        'Create alerts for upcoming deadlines',
        'Identify overdue obligations',
        'Calculate days until deadline'
      ],
      outputFormat: 'JSON with deadlines array, alerts array, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['deadlines', 'alerts', 'artifacts'],
      properties: {
        deadlines: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              obligationId: { type: 'string' },
              deadline: { type: 'string' },
              daysUntil: { type: 'number' },
              priority: { type: 'string' }
            }
          }
        },
        alerts: { type: 'array', items: { type: 'object' } },
        overdueCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'obligation-tracking', 'deadlines']
}));

export const notificationTask = defineTask('notification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Send notifications',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Notification Specialist',
      task: 'Send notifications for upcoming deadlines and compliance issues',
      context: args,
      instructions: [
        'Prepare notification content',
        'Identify recipients',
        'Send deadline reminders',
        'Send compliance alerts',
        'Log notifications sent'
      ],
      outputFormat: 'JSON with notificationsSent, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['notificationsSent', 'artifacts'],
      properties: {
        notificationsSent: { type: 'number' },
        notifications: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'obligation-tracking', 'notifications']
}));

export const trackingReportTask = defineTask('tracking-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate tracking report',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Report Generator',
      task: 'Generate obligation tracking status report',
      context: args,
      instructions: [
        'Summarize overall compliance status',
        'List upcoming deadlines',
        'Document compliance issues',
        'Include obligation details',
        'Format as report document'
      ],
      outputFormat: 'JSON with reportPath, summary, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'obligation-tracking', 'report']
}));

export const comprehensiveReportTask = defineTask('comprehensive-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive report',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Comprehensive Report Specialist',
      task: 'Generate comprehensive obligation compliance report',
      context: args,
      instructions: [
        'Analyze all obligations for period',
        'Calculate compliance metrics',
        'Document fulfilled obligations',
        'Document compliance gaps',
        'Include trend analysis',
        'Provide recommendations',
        'Format as comprehensive report'
      ],
      outputFormat: 'JSON with reportPath, complianceRate, summary, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'complianceRate', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        complianceRate: { type: 'number' },
        summary: { type: 'object' },
        trends: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'obligation-tracking', 'report']
}));

export const obligationUpdateTask = defineTask('obligation-update', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Update obligation status',
  agent: {
    name: 'legal-analyst',
    prompt: {
      role: 'Obligation Update Specialist',
      task: 'Update obligation status and compliance information',
      context: args,
      instructions: [
        'Load current obligation status',
        'Apply update data',
        'Validate update',
        'Save updated obligation',
        'Log update history',
        'Return previous and new status'
      ],
      outputFormat: 'JSON with previousStatus, newStatus, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['previousStatus', 'newStatus', 'artifacts'],
      properties: {
        previousStatus: { type: 'string' },
        newStatus: { type: 'string' },
        updateTimestamp: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'obligation-tracking', 'update']
}));
