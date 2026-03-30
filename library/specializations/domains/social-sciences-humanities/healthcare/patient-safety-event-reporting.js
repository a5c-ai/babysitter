/**
 * @process specializations/domains/social-sciences-humanities/healthcare/patient-safety-event-reporting
 * @description Patient Safety Event Reporting - Systematic process for capturing, classifying, and analyzing
 * patient safety events including adverse events, near-misses, and unsafe conditions for organizational learning.
 * @inputs { eventDetails: object, reporterRole?: string, immediateActions?: array, eventCategory?: string }
 * @outputs { success: boolean, eventReport: object, classification: object, analysis: object, artifacts: array }
 * @recommendedSkills SK-HC-005 (patient-safety-event-analysis), SK-HC-002 (quality-metrics-measurement)
 * @recommendedAgents AG-HC-004 (patient-safety-officer), AG-HC-002 (compliance-readiness-manager)
 *
 * @example
 * const result = await orchestrate('specializations/domains/social-sciences-humanities/healthcare/patient-safety-event-reporting', {
 *   eventDetails: { description: 'Wrong medication administered', location: 'Med-Surg 2B', time: '14:30' },
 *   reporterRole: 'RN',
 *   immediateActions: ['stopped infusion', 'notified physician', 'monitored patient'],
 *   eventCategory: 'medication'
 * });
 *
 * @references
 * - AHRQ Common Formats
 * - WHO Patient Safety Incident Reporting
 * - ISMP Medication Safety Self Assessment
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    eventDetails,
    reporterRole = 'staff',
    immediateActions = [],
    eventCategory = 'general',
    patientInvolved = true,
    severityEstimate = 'unknown',
    outputDir = 'safety-event-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Processing Patient Safety Event Report: ${eventDetails.description?.substring(0, 50)}...`);

  // Phase 1: Event Capture
  ctx.log('info', 'Phase 1: Event Capture');
  const eventCapture = await ctx.task(eventCaptureTask, {
    eventDetails,
    reporterRole,
    immediateActions,
    eventCategory,
    patientInvolved,
    outputDir
  });

  artifacts.push(...eventCapture.artifacts);

  // Phase 2: Event Classification
  ctx.log('info', 'Phase 2: Event Classification');
  const eventClassification = await ctx.task(eventClassificationTask, {
    eventCapture,
    severityEstimate,
    outputDir
  });

  artifacts.push(...eventClassification.artifacts);

  await ctx.breakpoint({
    question: `Event classified. Category: ${eventClassification.category}. Severity: ${eventClassification.severityLevel}. Harm score: ${eventClassification.harmScore}. Proceed with analysis?`,
    title: 'Event Classification Review',
    context: {
      runId: ctx.runId,
      category: eventClassification.category,
      severity: eventClassification.severityLevel,
      taxonomy: eventClassification.taxonomy,
      files: eventClassification.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 3: Contributing Factor Analysis
  ctx.log('info', 'Phase 3: Contributing Factor Analysis');
  const factorAnalysis = await ctx.task(contributingFactorAnalysisTask, {
    eventCapture,
    eventClassification,
    outputDir
  });

  artifacts.push(...factorAnalysis.artifacts);

  // Phase 4: Trend Analysis
  ctx.log('info', 'Phase 4: Trend Analysis');
  const trendAnalysis = await ctx.task(trendAnalysisTask, {
    eventClassification,
    eventCategory,
    outputDir
  });

  artifacts.push(...trendAnalysis.artifacts);

  // Phase 5: Response Determination
  ctx.log('info', 'Phase 5: Response Determination');
  const responseDetermination = await ctx.task(responseDeterminationTask, {
    eventClassification,
    factorAnalysis,
    trendAnalysis,
    outputDir
  });

  artifacts.push(...responseDetermination.artifacts);

  await ctx.breakpoint({
    question: `Response level: ${responseDetermination.responseLevel}. RCA required: ${responseDetermination.rcaRequired}. Immediate actions: ${responseDetermination.immediateActions.length}. Proceed with action tracking?`,
    title: 'Response Determination Review',
    context: {
      runId: ctx.runId,
      responseLevel: responseDetermination.responseLevel,
      actions: responseDetermination.recommendedActions,
      files: responseDetermination.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 6: Action Tracking Setup
  ctx.log('info', 'Phase 6: Action Tracking Setup');
  const actionTracking = await ctx.task(actionTrackingTask, {
    responseDetermination,
    eventClassification,
    outputDir
  });

  artifacts.push(...actionTracking.artifacts);

  // Phase 7: Feedback to Reporter
  ctx.log('info', 'Phase 7: Feedback Communication');
  const feedbackCommunication = await ctx.task(feedbackCommunicationTask, {
    eventCapture,
    eventClassification,
    responseDetermination,
    outputDir
  });

  artifacts.push(...feedbackCommunication.artifacts);

  // Phase 8: Aggregate Reporting
  ctx.log('info', 'Phase 8: Aggregate Reporting');
  const aggregateReporting = await ctx.task(aggregateReportingTask, {
    eventClassification,
    trendAnalysis,
    outputDir
  });

  artifacts.push(...aggregateReporting.artifacts);

  // Phase 9: Learning Distribution
  ctx.log('info', 'Phase 9: Learning Distribution');
  const learningDistribution = await ctx.task(learningDistributionTask, {
    eventClassification,
    factorAnalysis,
    responseDetermination,
    outputDir
  });

  artifacts.push(...learningDistribution.artifacts);

  // Phase 10: Event Report Finalization
  ctx.log('info', 'Phase 10: Event Report Finalization');
  const eventReportFinal = await ctx.task(eventReportFinalizationTask, {
    eventCapture,
    eventClassification,
    factorAnalysis,
    trendAnalysis,
    responseDetermination,
    actionTracking,
    feedbackCommunication,
    aggregateReporting,
    learningDistribution,
    outputDir
  });

  artifacts.push(...eventReportFinal.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    eventReport: {
      eventId: eventCapture.eventId,
      description: eventDetails.description,
      reporter: reporterRole,
      immediateActions: immediateActions
    },
    classification: {
      category: eventClassification.category,
      severity: eventClassification.severityLevel,
      harmScore: eventClassification.harmScore,
      taxonomy: eventClassification.taxonomy
    },
    analysis: {
      contributingFactors: factorAnalysis.factors,
      trends: trendAnalysis.trends,
      responseLevel: responseDetermination.responseLevel
    },
    actions: actionTracking.actions,
    learnings: learningDistribution.learnings,
    artifacts,
    reportPath: eventReportFinal.reportPath,
    duration,
    metadata: {
      processId: 'specializations/domains/social-sciences-humanities/healthcare/patient-safety-event-reporting',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Event Capture
export const eventCaptureTask = defineTask('pser-capture', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Safety Event Capture',
  agent: {
    name: 'event-intake-specialist',
    prompt: {
      role: 'Patient Safety Event Intake Specialist',
      task: 'Capture patient safety event details',
      context: args,
      instructions: [
        '1. Assign unique event identifier',
        '2. Document event date/time/location',
        '3. Record event description',
        '4. Document patient involvement',
        '5. Record immediate actions taken',
        '6. Document reporter information',
        '7. Capture witness information',
        '8. Document environmental factors',
        '9. Record equipment involved',
        '10. Timestamp event receipt'
      ],
      outputFormat: 'JSON with captured event'
    },
    outputSchema: {
      type: 'object',
      required: ['eventId', 'eventRecord', 'artifacts'],
      properties: {
        eventId: { type: 'string' },
        eventRecord: { type: 'object' },
        dateTime: { type: 'object' },
        location: { type: 'string' },
        patientInfo: { type: 'object' },
        reporterInfo: { type: 'object' },
        witnesses: { type: 'array', items: { type: 'object' } },
        equipment: { type: 'array', items: { type: 'object' } },
        receiptTimestamp: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'patient-safety', 'event-capture', 'healthcare']
}));

// Task 2: Event Classification
export const eventClassificationTask = defineTask('pser-classification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Safety Event Classification',
  agent: {
    name: 'safety-classifier',
    prompt: {
      role: 'Patient Safety Classifier',
      task: 'Classify patient safety event',
      context: args,
      instructions: [
        '1. Apply event taxonomy (AHRQ Common Formats)',
        '2. Classify by event type',
        '3. Assign severity score (NCC MERP or similar)',
        '4. Determine harm level',
        '5. Classify as sentinel/adverse/near-miss',
        '6. Identify patient population affected',
        '7. Classify by care setting',
        '8. Apply ICD codes if applicable',
        '9. Determine reporting requirements',
        '10. Document classification rationale'
      ],
      outputFormat: 'JSON with classification'
    },
    outputSchema: {
      type: 'object',
      required: ['category', 'severityLevel', 'harmScore', 'taxonomy', 'artifacts'],
      properties: {
        category: { type: 'string' },
        eventType: { type: 'string' },
        severityLevel: { type: 'string' },
        harmScore: { type: 'string' },
        taxonomy: { type: 'object' },
        isSentinel: { type: 'boolean' },
        reportingRequired: { type: 'object' },
        classificationRationale: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'patient-safety', 'classification', 'healthcare']
}));

// Task 3: Contributing Factor Analysis
export const contributingFactorAnalysisTask = defineTask('pser-factors', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Contributing Factor Analysis',
  agent: {
    name: 'factor-analyst',
    prompt: {
      role: 'Contributing Factor Analyst',
      task: 'Analyze contributing factors',
      context: args,
      instructions: [
        '1. Identify human factors',
        '2. Identify communication factors',
        '3. Identify environmental factors',
        '4. Identify equipment factors',
        '5. Identify organizational factors',
        '6. Identify patient factors',
        '7. Apply SEIPS model categories',
        '8. Identify mitigating factors',
        '9. Assess factor interactions',
        '10. Document factor analysis'
      ],
      outputFormat: 'JSON with factor analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['factors', 'seipsAnalysis', 'artifacts'],
      properties: {
        factors: { type: 'array', items: { type: 'object' } },
        humanFactors: { type: 'array', items: { type: 'object' } },
        communicationFactors: { type: 'array', items: { type: 'object' } },
        environmentalFactors: { type: 'array', items: { type: 'object' } },
        equipmentFactors: { type: 'array', items: { type: 'object' } },
        organizationalFactors: { type: 'array', items: { type: 'object' } },
        seipsAnalysis: { type: 'object' },
        mitigatingFactors: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'patient-safety', 'factors', 'healthcare']
}));

// Task 4: Trend Analysis
export const trendAnalysisTask = defineTask('pser-trends', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Safety Event Trend Analysis',
  agent: {
    name: 'trend-analyst',
    prompt: {
      role: 'Safety Trend Analyst',
      task: 'Analyze event trends',
      context: args,
      instructions: [
        '1. Compare to historical events',
        '2. Identify similar events',
        '3. Analyze temporal patterns',
        '4. Analyze location patterns',
        '5. Analyze shift/staffing patterns',
        '6. Identify clusters',
        '7. Calculate event rates',
        '8. Compare to benchmarks',
        '9. Identify emerging trends',
        '10. Document trend analysis'
      ],
      outputFormat: 'JSON with trend analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['trends', 'patterns', 'artifacts'],
      properties: {
        trends: { type: 'array', items: { type: 'object' } },
        similarEvents: { type: 'array', items: { type: 'object' } },
        patterns: { type: 'object' },
        clusters: { type: 'array', items: { type: 'object' } },
        eventRates: { type: 'object' },
        benchmarkComparison: { type: 'object' },
        emergingTrends: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'patient-safety', 'trends', 'healthcare']
}));

// Task 5: Response Determination
export const responseDeterminationTask = defineTask('pser-response', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Event Response Determination',
  agent: {
    name: 'response-coordinator',
    prompt: {
      role: 'Patient Safety Response Coordinator',
      task: 'Determine appropriate response level',
      context: args,
      instructions: [
        '1. Determine response level (immediate/standard)',
        '2. Determine if RCA required',
        '3. Identify immediate actions needed',
        '4. Determine leadership notification',
        '5. Assess external reporting requirements',
        '6. Determine patient/family disclosure needs',
        '7. Identify investigation level needed',
        '8. Assign responsible parties',
        '9. Set response timeline',
        '10. Document response determination'
      ],
      outputFormat: 'JSON with response plan'
    },
    outputSchema: {
      type: 'object',
      required: ['responseLevel', 'rcaRequired', 'immediateActions', 'recommendedActions', 'artifacts'],
      properties: {
        responseLevel: { type: 'string' },
        rcaRequired: { type: 'boolean' },
        immediateActions: { type: 'array', items: { type: 'object' } },
        recommendedActions: { type: 'array', items: { type: 'object' } },
        leadershipNotification: { type: 'object' },
        externalReporting: { type: 'object' },
        disclosureRequired: { type: 'boolean' },
        investigationLevel: { type: 'string' },
        responsibleParties: { type: 'array', items: { type: 'object' } },
        timeline: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'patient-safety', 'response', 'healthcare']
}));

// Task 6: Action Tracking
export const actionTrackingTask = defineTask('pser-action-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Safety Action Tracking Setup',
  agent: {
    name: 'action-tracker',
    prompt: {
      role: 'Safety Action Tracker',
      task: 'Set up action tracking',
      context: args,
      instructions: [
        '1. Create action items from response',
        '2. Assign action owners',
        '3. Set due dates',
        '4. Define completion criteria',
        '5. Set up tracking mechanism',
        '6. Define escalation triggers',
        '7. Schedule follow-up reviews',
        '8. Link to event record',
        '9. Configure notifications',
        '10. Document tracking setup'
      ],
      outputFormat: 'JSON with action tracking'
    },
    outputSchema: {
      type: 'object',
      required: ['actions', 'trackingSetup', 'artifacts'],
      properties: {
        actions: { type: 'array', items: { type: 'object' } },
        trackingSetup: { type: 'object' },
        owners: { type: 'array', items: { type: 'object' } },
        dueDates: { type: 'object' },
        completionCriteria: { type: 'object' },
        escalationTriggers: { type: 'array', items: { type: 'object' } },
        followUpSchedule: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'patient-safety', 'action-tracking', 'healthcare']
}));

// Task 7: Feedback Communication
export const feedbackCommunicationTask = defineTask('pser-feedback', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Reporter Feedback Communication',
  agent: {
    name: 'feedback-coordinator',
    prompt: {
      role: 'Safety Feedback Coordinator',
      task: 'Communicate feedback to reporter',
      context: args,
      instructions: [
        '1. Acknowledge report receipt',
        '2. Thank reporter for reporting',
        '3. Summarize classification',
        '4. Describe planned response',
        '5. Explain investigation timeline',
        '6. Provide contact for questions',
        '7. Reinforce non-punitive culture',
        '8. Share lessons learned',
        '9. Document feedback provided',
        '10. Schedule follow-up communication'
      ],
      outputFormat: 'JSON with feedback communication'
    },
    outputSchema: {
      type: 'object',
      required: ['feedbackProvided', 'communication', 'artifacts'],
      properties: {
        feedbackProvided: { type: 'boolean' },
        communication: { type: 'object' },
        acknowledgment: { type: 'object' },
        responsesSummary: { type: 'string' },
        timeline: { type: 'object' },
        contactInfo: { type: 'object' },
        followUpScheduled: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'patient-safety', 'feedback', 'healthcare']
}));

// Task 8: Aggregate Reporting
export const aggregateReportingTask = defineTask('pser-aggregate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Aggregate Safety Reporting',
  agent: {
    name: 'aggregate-analyst',
    prompt: {
      role: 'Safety Data Analyst',
      task: 'Add to aggregate reporting',
      context: args,
      instructions: [
        '1. Add to organizational database',
        '2. Update aggregate statistics',
        '3. Update dashboards',
        '4. Calculate updated rates',
        '5. Update control charts',
        '6. Check for external reporting',
        '7. Prepare PSO submission if required',
        '8. Update quality reports',
        '9. Flag for board reporting',
        '10. Document aggregate updates'
      ],
      outputFormat: 'JSON with aggregate reporting'
    },
    outputSchema: {
      type: 'object',
      required: ['aggregateUpdates', 'dashboardUpdates', 'artifacts'],
      properties: {
        aggregateUpdates: { type: 'object' },
        updatedStatistics: { type: 'object' },
        dashboardUpdates: { type: 'array', items: { type: 'string' } },
        controlChartUpdate: { type: 'object' },
        externalSubmission: { type: 'object' },
        boardReportFlag: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'patient-safety', 'aggregate', 'healthcare']
}));

// Task 9: Learning Distribution
export const learningDistributionTask = defineTask('pser-learning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Safety Learning Distribution',
  agent: {
    name: 'learning-facilitator',
    prompt: {
      role: 'Patient Safety Learning Facilitator',
      task: 'Distribute safety learnings',
      context: args,
      instructions: [
        '1. Extract key learnings',
        '2. Determine distribution scope',
        '3. Create safety alert if needed',
        '4. Prepare educational content',
        '5. Identify target audience',
        '6. Select communication channels',
        '7. Schedule dissemination',
        '8. Plan reinforcement activities',
        '9. Track learning acknowledgment',
        '10. Document learning distribution'
      ],
      outputFormat: 'JSON with learning distribution'
    },
    outputSchema: {
      type: 'object',
      required: ['learnings', 'distributionPlan', 'artifacts'],
      properties: {
        learnings: { type: 'array', items: { type: 'string' } },
        distributionPlan: { type: 'object' },
        safetyAlert: { type: 'object' },
        educationalContent: { type: 'object' },
        targetAudience: { type: 'array', items: { type: 'string' } },
        channels: { type: 'array', items: { type: 'string' } },
        reinforcement: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'patient-safety', 'learning', 'healthcare']
}));

// Task 10: Report Finalization
export const eventReportFinalizationTask = defineTask('pser-finalize', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Safety Event Report Finalization',
  agent: {
    name: 'report-finalizer',
    prompt: {
      role: 'Patient Safety Report Finalizer',
      task: 'Finalize event report',
      context: args,
      instructions: [
        '1. Compile complete event record',
        '2. Verify all fields complete',
        '3. Attach supporting documentation',
        '4. Add classification codes',
        '5. Link to actions and outcomes',
        '6. Set report status',
        '7. Apply retention policy',
        '8. Archive report',
        '9. Generate report summary',
        '10. Close initial processing'
      ],
      outputFormat: 'JSON with finalized report'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'finalStatus', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        finalStatus: { type: 'string' },
        completeRecord: { type: 'object' },
        attachments: { type: 'array', items: { type: 'string' } },
        classificationCodes: { type: 'array', items: { type: 'string' } },
        linkedActions: { type: 'array', items: { type: 'string' } },
        reportSummary: { type: 'object' },
        archiveLocation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'patient-safety', 'finalization', 'healthcare']
}));
