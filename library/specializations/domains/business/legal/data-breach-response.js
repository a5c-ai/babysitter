/**
 * @process specializations/domains/business/legal/data-breach-response
 * @description Data Breach Response - Establish incident detection, assessment, containment, notification,
 * and remediation procedures for data breaches.
 * @inputs { incidentId?: string, action?: string, incidentDetails?: object, outputDir?: string }
 * @outputs { success: boolean, incident: object, assessment: object, notifications: array, remediation: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/legal/data-breach-response', {
 *   incidentId: 'BRE-2024-001',
 *   action: 'respond',
 *   incidentDetails: { type: 'unauthorized-access', affectedRecords: 5000, personalData: true },
 *   outputDir: 'breach-response'
 * });
 *
 * @references
 * - OneTrust Breach Management: https://www.onetrust.com/
 * - GDPR Art 33/34: https://gdpr.eu/article-33-notification-of-a-personal-data-breach/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    incidentId = `BRE-${Date.now()}`,
    action = 'respond', // 'respond', 'assess', 'notify', 'remediate'
    incidentDetails = {},
    outputDir = 'breach-response-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Data Breach Response - Incident: ${incidentId}`);

  // Phase 1: Incident Detection and Logging
  const detection = await ctx.task(incidentDetectionTask, {
    incidentId,
    incidentDetails,
    outputDir
  });
  artifacts.push(...detection.artifacts);

  // Phase 2: Containment
  const containment = await ctx.task(breachContainmentTask, {
    incidentId,
    incidentDetails,
    outputDir
  });
  artifacts.push(...containment.artifacts);

  // Phase 3: Impact Assessment
  const assessment = await ctx.task(breachAssessmentTask, {
    incidentId,
    incidentDetails,
    containment,
    outputDir
  });
  artifacts.push(...assessment.artifacts);

  // Quality Gate: High severity breach
  if (assessment.severity === 'high' || assessment.severity === 'critical') {
    await ctx.breakpoint({
      question: `High severity breach ${incidentId}. ${assessment.affectedIndividuals} individuals affected. Regulatory notification likely required. Proceed with notification assessment?`,
      title: 'High Severity Breach Alert',
      context: {
        runId: ctx.runId,
        incidentId,
        severity: assessment.severity,
        affectedIndividuals: assessment.affectedIndividuals,
        files: assessment.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // Phase 4: Notification Assessment
  const notificationAssessment = await ctx.task(notificationAssessmentTask, {
    incidentId,
    assessment,
    outputDir
  });
  artifacts.push(...notificationAssessment.artifacts);

  // Phase 5: DPA Notification (if required)
  let dpaNotification = null;
  if (notificationAssessment.dpaNotificationRequired) {
    dpaNotification = await ctx.task(dpaNotificationTask, {
      incidentId,
      assessment,
      outputDir
    });
    artifacts.push(...dpaNotification.artifacts);
  }

  // Phase 6: Individual Notification (if required)
  let individualNotification = null;
  if (notificationAssessment.individualNotificationRequired) {
    individualNotification = await ctx.task(individualNotificationTask, {
      incidentId,
      assessment,
      outputDir
    });
    artifacts.push(...individualNotification.artifacts);
  }

  // Phase 7: Remediation
  const remediation = await ctx.task(breachRemediationTask, {
    incidentId,
    assessment,
    containment,
    outputDir
  });
  artifacts.push(...remediation.artifacts);

  // Phase 8: Post-Incident Review
  const postIncident = await ctx.task(postIncidentReviewTask, {
    incidentId,
    detection,
    containment,
    assessment,
    remediation,
    outputDir
  });
  artifacts.push(...postIncident.artifacts);

  await ctx.breakpoint({
    question: `Breach response for ${incidentId} complete. Severity: ${assessment.severity}. DPA notified: ${dpaNotification ? 'Yes' : 'No'}. Review post-incident report?`,
    title: 'Breach Response Review',
    context: {
      runId: ctx.runId,
      incidentId,
      severity: assessment.severity,
      notificationsSent: (dpaNotification ? 1 : 0) + (individualNotification ? 1 : 0),
      files: [{ path: postIncident.reportPath, format: 'markdown', label: 'Post-Incident Report' }]
    }
  });

  return {
    success: true,
    incidentId,
    incident: {
      detectedAt: detection.detectedAt,
      type: incidentDetails.type,
      containedAt: containment.containedAt
    },
    assessment: {
      severity: assessment.severity,
      affectedIndividuals: assessment.affectedIndividuals,
      dataCategories: assessment.dataCategories,
      riskLevel: assessment.riskLevel
    },
    notifications: [
      ...(dpaNotification ? [{ type: 'dpa', notifiedAt: dpaNotification.notifiedAt }] : []),
      ...(individualNotification ? [{ type: 'individuals', notifiedAt: individualNotification.notifiedAt }] : [])
    ],
    remediation: {
      actions: remediation.actions,
      completedAt: remediation.completedAt
    },
    postIncidentReport: postIncident.reportPath,
    artifacts,
    metadata: { processId: 'specializations/domains/business/legal/data-breach-response', timestamp: startTime }
  };
}

export const incidentDetectionTask = defineTask('incident-detection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Detect and log incident',
  agent: {
    name: 'privacy-specialist',
    prompt: {
      role: 'Incident Detection Specialist',
      task: 'Log and document breach incident',
      context: args,
      instructions: ['Record incident details', 'Start incident timeline', 'Alert incident response team', 'Begin 72-hour clock'],
      outputFormat: 'JSON with detectedAt, incidentLog, artifacts'
    },
    outputSchema: { type: 'object', required: ['detectedAt', 'artifacts'], properties: { detectedAt: { type: 'string' }, incidentLog: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'breach-response']
}));

export const breachContainmentTask = defineTask('breach-containment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Contain breach',
  agent: {
    name: 'privacy-specialist',
    prompt: {
      role: 'Breach Containment Specialist',
      task: 'Contain data breach',
      context: args,
      instructions: ['Stop ongoing breach', 'Secure affected systems', 'Preserve evidence', 'Document containment actions'],
      outputFormat: 'JSON with containedAt, actions, artifacts'
    },
    outputSchema: { type: 'object', required: ['containedAt', 'artifacts'], properties: { containedAt: { type: 'string' }, actions: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'breach-response']
}));

export const breachAssessmentTask = defineTask('breach-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess breach impact',
  agent: {
    name: 'privacy-specialist',
    prompt: {
      role: 'Breach Assessment Specialist',
      task: 'Assess breach impact',
      context: args,
      instructions: ['Determine scope', 'Count affected individuals', 'Identify data categories', 'Assess risk level', 'Determine severity'],
      outputFormat: 'JSON with severity, affectedIndividuals, dataCategories, riskLevel, artifacts'
    },
    outputSchema: { type: 'object', required: ['severity', 'affectedIndividuals', 'riskLevel', 'artifacts'], properties: { severity: { type: 'string' }, affectedIndividuals: { type: 'number' }, dataCategories: { type: 'array' }, riskLevel: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'breach-response']
}));

export const notificationAssessmentTask = defineTask('notification-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess notification requirements',
  agent: {
    name: 'privacy-specialist',
    prompt: {
      role: 'Notification Assessment Specialist',
      task: 'Assess notification requirements',
      context: args,
      instructions: ['Determine DPA notification required', 'Determine individual notification required', 'Identify applicable regulations', 'Calculate deadlines'],
      outputFormat: 'JSON with dpaNotificationRequired, individualNotificationRequired, deadlines, artifacts'
    },
    outputSchema: { type: 'object', required: ['dpaNotificationRequired', 'individualNotificationRequired', 'artifacts'], properties: { dpaNotificationRequired: { type: 'boolean' }, individualNotificationRequired: { type: 'boolean' }, deadlines: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'breach-response']
}));

export const dpaNotificationTask = defineTask('dpa-notification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Notify DPA',
  agent: {
    name: 'privacy-specialist',
    prompt: {
      role: 'DPA Notification Specialist',
      task: 'Prepare and submit DPA notification',
      context: args,
      instructions: ['Prepare notification form', 'Include required details', 'Submit within 72 hours', 'Document submission'],
      outputFormat: 'JSON with notifiedAt, notificationId, artifacts'
    },
    outputSchema: { type: 'object', required: ['notifiedAt', 'artifacts'], properties: { notifiedAt: { type: 'string' }, notificationId: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'breach-response']
}));

export const individualNotificationTask = defineTask('individual-notification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Notify individuals',
  agent: {
    name: 'privacy-specialist',
    prompt: {
      role: 'Individual Notification Specialist',
      task: 'Notify affected individuals',
      context: args,
      instructions: ['Draft notification letter', 'Include required information', 'Send notifications', 'Document delivery'],
      outputFormat: 'JSON with notifiedAt, notificationCount, artifacts'
    },
    outputSchema: { type: 'object', required: ['notifiedAt', 'artifacts'], properties: { notifiedAt: { type: 'string' }, notificationCount: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'breach-response']
}));

export const breachRemediationTask = defineTask('breach-remediation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Remediate breach',
  agent: {
    name: 'privacy-specialist',
    prompt: {
      role: 'Breach Remediation Specialist',
      task: 'Implement remediation measures',
      context: args,
      instructions: ['Implement security fixes', 'Address root cause', 'Enhance controls', 'Document remediation'],
      outputFormat: 'JSON with actions array, completedAt, artifacts'
    },
    outputSchema: { type: 'object', required: ['actions', 'completedAt', 'artifacts'], properties: { actions: { type: 'array' }, completedAt: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'breach-response']
}));

export const postIncidentReviewTask = defineTask('post-incident-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct post-incident review',
  agent: {
    name: 'privacy-specialist',
    prompt: {
      role: 'Post-Incident Review Specialist',
      task: 'Conduct post-incident review',
      context: args,
      instructions: ['Analyze incident timeline', 'Identify lessons learned', 'Recommend improvements', 'Generate report'],
      outputFormat: 'JSON with reportPath, lessonsLearned, recommendations, artifacts'
    },
    outputSchema: { type: 'object', required: ['reportPath', 'artifacts'], properties: { reportPath: { type: 'string' }, lessonsLearned: { type: 'array' }, recommendations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'breach-response']
}));
