/**
 * @process specializations/domains/business/operations/quality-audit
 * @description Quality Audit Management Process - Plan, conduct, and follow up on internal quality audits with
 * findings documentation and corrective action tracking for continuous quality improvement.
 * @inputs { auditType: string, auditScope?: string, auditCriteria?: string, auditee?: string }
 * @outputs { success: boolean, auditFindings: array, nonconformities: array, correctiveActions: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/operations/quality-audit', {
 *   auditType: 'internal',
 *   auditScope: 'Production Process',
 *   auditCriteria: 'ISO 9001:2015',
 *   auditee: 'Production Department'
 * });
 *
 * @references
 * - ISO 19011:2018 Guidelines for auditing management systems
 * - ISO 9001:2015 Clause 9.2 Internal Audit
 * - ASQ CQA Body of Knowledge
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    auditType = 'internal',
    auditScope = '',
    auditCriteria = 'ISO 9001:2015',
    auditee = '',
    auditors = [],
    outputDir = 'audit-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const auditId = `AUD-${Date.now()}`;

  ctx.log('info', `Starting Quality Audit ${auditId} - Type: ${auditType}, Scope: ${auditScope}`);

  // Phase 1: Audit Planning
  ctx.log('info', 'Phase 1: Audit Planning');
  const planning = await ctx.task(auditPlanningTask, {
    auditId,
    auditType,
    auditScope,
    auditCriteria,
    auditee,
    auditors,
    outputDir
  });

  artifacts.push(...planning.artifacts);

  // Phase 2: Audit Preparation
  ctx.log('info', 'Phase 2: Audit Preparation');
  const preparation = await ctx.task(auditPreparationTask, {
    auditId,
    planning,
    outputDir
  });

  artifacts.push(...preparation.artifacts);

  // Quality Gate: Audit Plan Review
  await ctx.breakpoint({
    question: `Audit plan prepared. Scope: ${auditScope}. Criteria: ${auditCriteria}. Auditors assigned: ${planning.auditTeam.length}. Checklist items: ${preparation.checklistItems}. Approve audit plan?`,
    title: 'Audit Plan Review',
    context: {
      runId: ctx.runId,
      auditId,
      auditPlan: planning.auditPlan,
      schedule: planning.schedule,
      checklist: preparation.checklist,
      files: [...planning.artifacts, ...preparation.artifacts].map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 3: Opening Meeting
  ctx.log('info', 'Phase 3: Opening Meeting');
  const openingMeeting = await ctx.task(openingMeetingTask, {
    auditId,
    planning,
    outputDir
  });

  artifacts.push(...openingMeeting.artifacts);

  // Phase 4: Audit Execution
  ctx.log('info', 'Phase 4: Audit Execution - Evidence Collection');
  const execution = await ctx.task(auditExecutionTask, {
    auditId,
    preparation,
    planning,
    outputDir
  });

  artifacts.push(...execution.artifacts);

  // Phase 5: Finding Classification
  ctx.log('info', 'Phase 5: Finding Classification');
  const classification = await ctx.task(findingClassificationTask, {
    auditId,
    execution,
    auditCriteria,
    outputDir
  });

  artifacts.push(...classification.artifacts);

  // Quality Gate: Findings Review
  await ctx.breakpoint({
    question: `Audit findings classified. Total findings: ${classification.totalFindings}. Major NCs: ${classification.majorNCs}. Minor NCs: ${classification.minorNCs}. Observations: ${classification.observations}. Review before closing meeting?`,
    title: 'Audit Findings Review',
    context: {
      runId: ctx.runId,
      auditId,
      findings: classification.findings,
      nonconformities: classification.nonconformities,
      files: classification.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 6: Closing Meeting
  ctx.log('info', 'Phase 6: Closing Meeting');
  const closingMeeting = await ctx.task(closingMeetingTask, {
    auditId,
    classification,
    planning,
    outputDir
  });

  artifacts.push(...closingMeeting.artifacts);

  // Phase 7: Audit Report
  ctx.log('info', 'Phase 7: Audit Report Generation');
  const auditReport = await ctx.task(auditReportTask, {
    auditId,
    planning,
    execution,
    classification,
    outputDir
  });

  artifacts.push(...auditReport.artifacts);

  // Phase 8: Corrective Action Request
  ctx.log('info', 'Phase 8: Corrective Action Requests');
  const correctiveActions = await ctx.task(correctiveActionTask, {
    auditId,
    classification,
    auditee,
    outputDir
  });

  artifacts.push(...correctiveActions.artifacts);

  // Phase 9: Follow-up Planning
  ctx.log('info', 'Phase 9: Follow-up Planning');
  const followUp = await ctx.task(followUpPlanningTask, {
    auditId,
    correctiveActions,
    outputDir
  });

  artifacts.push(...followUp.artifacts);

  // Phase 10: Audit Closeout
  ctx.log('info', 'Phase 10: Audit Closeout');
  const closeout = await ctx.task(auditCloseoutTask, {
    auditId,
    auditReport,
    correctiveActions,
    followUp,
    outputDir
  });

  artifacts.push(...closeout.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    auditId,
    auditType,
    auditScope,
    auditCriteria,
    auditFindings: classification.findings,
    nonconformities: classification.nonconformities,
    summary: {
      totalFindings: classification.totalFindings,
      majorNCs: classification.majorNCs,
      minorNCs: classification.minorNCs,
      observations: classification.observations,
      opportunities: classification.opportunities
    },
    correctiveActions: correctiveActions.cars,
    followUpPlan: followUp.plan,
    auditConclusion: auditReport.conclusion,
    reportPath: auditReport.reportPath,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/business/operations/quality-audit',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Audit Planning
export const auditPlanningTask = defineTask('audit-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Audit Planning - ${args.auditId}`,
  agent: {
    name: 'lead-auditor',
    prompt: {
      role: 'Lead Auditor',
      task: 'Plan the quality audit',
      context: args,
      instructions: [
        '1. Define audit objectives',
        '2. Confirm audit scope and criteria',
        '3. Select audit team members',
        '4. Assign auditor responsibilities',
        '5. Review previous audit results',
        '6. Review relevant documentation',
        '7. Create audit schedule',
        '8. Identify resources needed',
        '9. Communicate with auditee',
        '10. Create audit plan document'
      ],
      outputFormat: 'JSON with audit plan'
    },
    outputSchema: {
      type: 'object',
      required: ['auditPlan', 'auditTeam', 'schedule', 'artifacts'],
      properties: {
        auditPlan: { type: 'object' },
        objectives: { type: 'array', items: { type: 'string' } },
        auditTeam: { type: 'array', items: { type: 'object' } },
        schedule: { type: 'object' },
        previousFindings: { type: 'array', items: { type: 'object' } },
        resourcesNeeded: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'audit', 'planning']
}));

// Task 2: Audit Preparation
export const auditPreparationTask = defineTask('audit-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Audit Preparation - ${args.auditId}`,
  agent: {
    name: 'auditor',
    prompt: {
      role: 'Quality Auditor',
      task: 'Prepare for audit execution',
      context: args,
      instructions: [
        '1. Review applicable standards/requirements',
        '2. Review process documentation',
        '3. Review previous audit findings',
        '4. Prepare audit checklist',
        '5. Prepare sampling plan',
        '6. Prepare interview questions',
        '7. Prepare working documents',
        '8. Coordinate logistics',
        '9. Confirm audit schedule with auditee',
        '10. Finalize preparation'
      ],
      outputFormat: 'JSON with preparation details'
    },
    outputSchema: {
      type: 'object',
      required: ['checklist', 'checklistItems', 'samplingPlan', 'artifacts'],
      properties: {
        checklist: { type: 'array', items: { type: 'object' } },
        checklistItems: { type: 'number' },
        samplingPlan: { type: 'object' },
        interviewQuestions: { type: 'array', items: { type: 'object' } },
        documentsReviewed: { type: 'array', items: { type: 'string' } },
        logisticsConfirmed: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'audit', 'preparation']
}));

// Task 3: Opening Meeting
export const openingMeetingTask = defineTask('audit-opening', (args, taskCtx) => ({
  kind: 'agent',
  title: `Audit Opening Meeting - ${args.auditId}`,
  agent: {
    name: 'lead-auditor',
    prompt: {
      role: 'Lead Auditor',
      task: 'Conduct audit opening meeting',
      context: args,
      instructions: [
        '1. Introduce audit team',
        '2. Confirm audit scope and objectives',
        '3. Confirm audit schedule',
        '4. Explain audit methodology',
        '5. Confirm confidentiality requirements',
        '6. Explain finding classification',
        '7. Explain nonconformity handling',
        '8. Confirm resources and guides',
        '9. Address questions from auditee',
        '10. Document meeting minutes'
      ],
      outputFormat: 'JSON with opening meeting details'
    },
    outputSchema: {
      type: 'object',
      required: ['meetingCompleted', 'attendees', 'artifacts'],
      properties: {
        meetingCompleted: { type: 'boolean' },
        attendees: { type: 'array', items: { type: 'object' } },
        scopeConfirmed: { type: 'boolean' },
        scheduleConfirmed: { type: 'boolean' },
        questionsAddressed: { type: 'array', items: { type: 'string' } },
        meetingMinutes: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'audit', 'opening-meeting']
}));

// Task 4: Audit Execution
export const auditExecutionTask = defineTask('audit-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Audit Execution - ${args.auditId}`,
  agent: {
    name: 'auditor',
    prompt: {
      role: 'Quality Auditor',
      task: 'Execute audit and collect evidence',
      context: args,
      instructions: [
        '1. Follow audit checklist',
        '2. Conduct interviews with personnel',
        '3. Review documents and records',
        '4. Observe processes and activities',
        '5. Collect objective evidence',
        '6. Document findings in real-time',
        '7. Trace processes against requirements',
        '8. Verify effectiveness of previous CAs',
        '9. Identify positive observations',
        '10. Maintain audit trail'
      ],
      outputFormat: 'JSON with audit evidence'
    },
    outputSchema: {
      type: 'object',
      required: ['evidenceCollected', 'interviews', 'observations', 'artifacts'],
      properties: {
        checklistResults: { type: 'array', items: { type: 'object' } },
        evidenceCollected: { type: 'array', items: { type: 'object' } },
        interviews: { type: 'array', items: { type: 'object' } },
        documentsReviewed: { type: 'array', items: { type: 'object' } },
        observations: { type: 'array', items: { type: 'object' } },
        positiveFindings: { type: 'array', items: { type: 'string' } },
        previousCAsVerified: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'audit', 'execution']
}));

// Task 5: Finding Classification
export const findingClassificationTask = defineTask('audit-classification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Finding Classification - ${args.auditId}`,
  agent: {
    name: 'lead-auditor',
    prompt: {
      role: 'Lead Auditor',
      task: 'Classify audit findings',
      context: args,
      instructions: [
        '1. Review all evidence and observations',
        '2. Evaluate against audit criteria',
        '3. Classify as NC (major/minor) or observation',
        '4. Identify opportunities for improvement',
        '5. Write finding statements clearly',
        '6. Reference specific requirement clause',
        '7. Document objective evidence for each finding',
        '8. Review classification with audit team',
        '9. Prepare findings summary',
        '10. Document classification results'
      ],
      outputFormat: 'JSON with classified findings'
    },
    outputSchema: {
      type: 'object',
      required: ['findings', 'nonconformities', 'totalFindings', 'majorNCs', 'minorNCs', 'observations', 'artifacts'],
      properties: {
        findings: { type: 'array', items: { type: 'object' } },
        nonconformities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string', enum: ['major', 'minor'] },
              requirement: { type: 'string' },
              statement: { type: 'string' },
              evidence: { type: 'string' }
            }
          }
        },
        totalFindings: { type: 'number' },
        majorNCs: { type: 'number' },
        minorNCs: { type: 'number' },
        observations: { type: 'number' },
        opportunities: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'audit', 'classification']
}));

// Task 6: Closing Meeting
export const closingMeetingTask = defineTask('audit-closing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Audit Closing Meeting - ${args.auditId}`,
  agent: {
    name: 'lead-auditor',
    prompt: {
      role: 'Lead Auditor',
      task: 'Conduct audit closing meeting',
      context: args,
      instructions: [
        '1. Thank auditee for cooperation',
        '2. Summarize audit process',
        '3. Present audit findings',
        '4. Clarify any misunderstandings',
        '5. Explain corrective action requirements',
        '6. Explain report timeline',
        '7. Explain follow-up process',
        '8. Address questions from auditee',
        '9. Obtain acknowledgment of findings',
        '10. Document closing meeting'
      ],
      outputFormat: 'JSON with closing meeting details'
    },
    outputSchema: {
      type: 'object',
      required: ['meetingCompleted', 'findingsAcknowledged', 'artifacts'],
      properties: {
        meetingCompleted: { type: 'boolean' },
        attendees: { type: 'array', items: { type: 'object' } },
        findingsPresented: { type: 'boolean' },
        findingsAcknowledged: { type: 'boolean' },
        disagreements: { type: 'array', items: { type: 'object' } },
        meetingMinutes: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'audit', 'closing-meeting']
}));

// Task 7: Audit Report
export const auditReportTask = defineTask('audit-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Audit Report - ${args.auditId}`,
  agent: {
    name: 'lead-auditor',
    prompt: {
      role: 'Lead Auditor',
      task: 'Generate formal audit report',
      context: args,
      instructions: [
        '1. Create report header (audit ID, date, scope)',
        '2. Document audit objectives',
        '3. List audit team and auditee',
        '4. Document audit scope and criteria',
        '5. Summarize audit methodology',
        '6. Document all findings with evidence',
        '7. Include positive observations',
        '8. State audit conclusion',
        '9. Provide recommendation',
        '10. Obtain report approval'
      ],
      outputFormat: 'JSON with audit report'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'conclusion', 'recommendation', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        reportSummary: { type: 'object' },
        conclusion: { type: 'string' },
        recommendation: { type: 'string' },
        reportApproved: { type: 'boolean' },
        distributionList: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'audit', 'report']
}));

// Task 8: Corrective Action Request
export const correctiveActionTask = defineTask('audit-car', (args, taskCtx) => ({
  kind: 'agent',
  title: `Corrective Action Requests - ${args.auditId}`,
  agent: {
    name: 'ca-coordinator',
    prompt: {
      role: 'Corrective Action Coordinator',
      task: 'Generate corrective action requests',
      context: args,
      instructions: [
        '1. Create CAR for each nonconformity',
        '2. Include finding details and evidence',
        '3. Assign responsible person',
        '4. Set due dates for root cause analysis',
        '5. Set due dates for corrective action',
        '6. Set due dates for verification',
        '7. Communicate CARs to auditee',
        '8. Enter into CA tracking system',
        '9. Explain CA process requirements',
        '10. Document all CARs issued'
      ],
      outputFormat: 'JSON with corrective action requests'
    },
    outputSchema: {
      type: 'object',
      required: ['cars', 'totalCars', 'artifacts'],
      properties: {
        cars: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              carId: { type: 'string' },
              findingId: { type: 'string' },
              type: { type: 'string' },
              responsible: { type: 'string' },
              rcaDueDate: { type: 'string' },
              caDueDate: { type: 'string' },
              verificationDueDate: { type: 'string' }
            }
          }
        },
        totalCars: { type: 'number' },
        majorCars: { type: 'number' },
        minorCars: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'audit', 'corrective-action']
}));

// Task 9: Follow-up Planning
export const followUpPlanningTask = defineTask('audit-followup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Follow-up Planning - ${args.auditId}`,
  agent: {
    name: 'audit-coordinator',
    prompt: {
      role: 'Audit Coordinator',
      task: 'Plan audit follow-up activities',
      context: args,
      instructions: [
        '1. Define follow-up audit requirements',
        '2. Schedule CA verification activities',
        '3. Plan on-site verification if needed',
        '4. Define effectiveness review criteria',
        '5. Set milestones for CA completion',
        '6. Plan progress monitoring',
        '7. Define escalation process',
        '8. Schedule follow-up meetings',
        '9. Plan final verification audit if needed',
        '10. Document follow-up plan'
      ],
      outputFormat: 'JSON with follow-up plan'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'verificationSchedule', 'milestones', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        followUpAuditRequired: { type: 'boolean' },
        verificationSchedule: { type: 'array', items: { type: 'object' } },
        milestones: { type: 'array', items: { type: 'object' } },
        monitoringPlan: { type: 'object' },
        escalationProcess: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'audit', 'follow-up']
}));

// Task 10: Audit Closeout
export const auditCloseoutTask = defineTask('audit-closeout', (args, taskCtx) => ({
  kind: 'agent',
  title: `Audit Closeout - ${args.auditId}`,
  agent: {
    name: 'lead-auditor',
    prompt: {
      role: 'Lead Auditor',
      task: 'Close out audit',
      context: args,
      instructions: [
        '1. Verify all deliverables complete',
        '2. Confirm report distributed',
        '3. Confirm CARs issued',
        '4. Confirm follow-up plan in place',
        '5. Archive audit records',
        '6. Update audit program status',
        '7. Capture lessons learned',
        '8. Evaluate auditor performance',
        '9. Update audit metrics',
        '10. Formally close audit'
      ],
      outputFormat: 'JSON with closeout details'
    },
    outputSchema: {
      type: 'object',
      required: ['auditClosed', 'recordsArchived', 'lessonsLearned', 'artifacts'],
      properties: {
        auditClosed: { type: 'boolean' },
        closureDate: { type: 'string' },
        deliverablesComplete: { type: 'boolean' },
        recordsArchived: { type: 'boolean' },
        archiveLocation: { type: 'string' },
        lessonsLearned: { type: 'array', items: { type: 'string' } },
        auditorFeedback: { type: 'object' },
        auditMetrics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'audit', 'closeout']
}));
