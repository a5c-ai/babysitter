/**
 * @process specializations/domains/social-sciences-humanities/healthcare/root-cause-analysis-healthcare
 * @description Root Cause Analysis (RCA) - Structured method for identifying underlying causes of adverse
 * events and near-misses in healthcare using systematic investigation to prevent recurrence.
 * @inputs { eventDescription: string, eventType?: string, severity?: string, patientHarm?: boolean }
 * @outputs { success: boolean, rootCauses: array, contributingFactors: array, actionPlan: object, artifacts: array }
 * @recommendedSkills SK-HC-005 (patient-safety-event-analysis), SK-HC-002 (quality-metrics-measurement)
 * @recommendedAgents AG-HC-004 (patient-safety-officer), AG-HC-001 (quality-improvement-orchestrator)
 *
 * @example
 * const result = await orchestrate('specializations/domains/social-sciences-humanities/healthcare/root-cause-analysis-healthcare', {
 *   eventDescription: 'Wrong-site surgery performed on patient',
 *   eventType: 'sentinel event',
 *   severity: 'critical',
 *   patientHarm: true
 * });
 *
 * @references
 * - Joint Commission RCA Framework
 * - VA National Center for Patient Safety RCA Tools
 * - AHRQ Root Cause Analysis Resources
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    eventDescription,
    eventType = 'adverse event',
    severity = 'moderate',
    patientHarm = false,
    eventDate = null,
    location = '',
    involvedStaff = [],
    outputDir = 'rca-healthcare-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Healthcare RCA for: ${eventDescription}`);

  // Phase 1: Event Discovery and Initial Response
  ctx.log('info', 'Phase 1: Event Discovery and Initial Response');
  const initialResponse = await ctx.task(initialResponseTask, {
    eventDescription,
    eventType,
    severity,
    patientHarm,
    eventDate,
    location,
    outputDir
  });

  artifacts.push(...initialResponse.artifacts);

  await ctx.breakpoint({
    question: `Initial response complete. Event classified as: ${initialResponse.classification}. Immediate actions: ${initialResponse.immediateActions.length}. Team assembled: ${initialResponse.teamAssembled}. Proceed with investigation?`,
    title: 'Initial Response Review',
    context: {
      runId: ctx.runId,
      eventDescription,
      classification: initialResponse.classification,
      immediateActions: initialResponse.immediateActions,
      files: initialResponse.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 2: Information Gathering
  ctx.log('info', 'Phase 2: Information Gathering');
  const informationGathering = await ctx.task(informationGatheringTask, {
    initialResponse,
    involvedStaff,
    outputDir
  });

  artifacts.push(...informationGathering.artifacts);

  // Phase 3: Timeline Reconstruction
  ctx.log('info', 'Phase 3: Timeline Reconstruction');
  const timelineReconstruction = await ctx.task(timelineReconstructionTask, {
    informationGathering,
    eventDescription,
    outputDir
  });

  artifacts.push(...timelineReconstruction.artifacts);

  await ctx.breakpoint({
    question: `Timeline reconstructed with ${timelineReconstruction.events.length} events. ${timelineReconstruction.criticalPoints.length} critical points identified. Proceed with cause analysis?`,
    title: 'Timeline Review',
    context: {
      runId: ctx.runId,
      timeline: timelineReconstruction.timeline,
      criticalPoints: timelineReconstruction.criticalPoints,
      files: timelineReconstruction.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 4: Cause and Effect Analysis
  ctx.log('info', 'Phase 4: Cause and Effect Analysis');
  const causeEffectAnalysis = await ctx.task(causeEffectAnalysisTask, {
    timelineReconstruction,
    informationGathering,
    outputDir
  });

  artifacts.push(...causeEffectAnalysis.artifacts);

  // Phase 5: Contributing Factor Identification
  ctx.log('info', 'Phase 5: Contributing Factor Identification');
  const contributingFactors = await ctx.task(contributingFactorsTask, {
    causeEffectAnalysis,
    informationGathering,
    outputDir
  });

  artifacts.push(...contributingFactors.artifacts);

  await ctx.breakpoint({
    question: `${contributingFactors.humanFactors.length} human factors, ${contributingFactors.systemFactors.length} system factors identified. Proceed with root cause determination?`,
    title: 'Contributing Factors Review',
    context: {
      runId: ctx.runId,
      humanFactors: contributingFactors.humanFactors,
      systemFactors: contributingFactors.systemFactors,
      environmentalFactors: contributingFactors.environmentalFactors,
      files: contributingFactors.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 6: Root Cause Determination
  ctx.log('info', 'Phase 6: Root Cause Determination');
  const rootCauseDetermination = await ctx.task(rootCauseDeterminationTask, {
    causeEffectAnalysis,
    contributingFactors,
    outputDir
  });

  artifacts.push(...rootCauseDetermination.artifacts);

  // Phase 7: Action Plan Development
  ctx.log('info', 'Phase 7: Action Plan Development');
  const actionPlan = await ctx.task(actionPlanDevelopmentTask, {
    rootCauseDetermination,
    contributingFactors,
    outputDir
  });

  artifacts.push(...actionPlan.artifacts);

  await ctx.breakpoint({
    question: `${rootCauseDetermination.rootCauses.length} root causes identified. ${actionPlan.actions.length} corrective actions proposed. ${actionPlan.strongActions} strong actions. Approve action plan?`,
    title: 'Root Causes and Action Plan Review',
    context: {
      runId: ctx.runId,
      rootCauses: rootCauseDetermination.rootCauses,
      actions: actionPlan.actions,
      files: [...rootCauseDetermination.artifacts, ...actionPlan.artifacts].map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 8: Measurement Plan
  ctx.log('info', 'Phase 8: Measurement Plan Development');
  const measurementPlan = await ctx.task(measurementPlanTask, {
    actionPlan,
    rootCauseDetermination,
    outputDir
  });

  artifacts.push(...measurementPlan.artifacts);

  // Phase 9: Risk Reduction Assessment
  ctx.log('info', 'Phase 9: Risk Reduction Assessment');
  const riskAssessment = await ctx.task(riskReductionAssessmentTask, {
    actionPlan,
    rootCauseDetermination,
    contributingFactors,
    outputDir
  });

  artifacts.push(...riskAssessment.artifacts);

  // Phase 10: Final RCA Report
  ctx.log('info', 'Phase 10: Final RCA Report Generation');
  const finalReport = await ctx.task(rcaReportGenerationTask, {
    eventDescription,
    eventType,
    initialResponse,
    informationGathering,
    timelineReconstruction,
    causeEffectAnalysis,
    contributingFactors,
    rootCauseDetermination,
    actionPlan,
    measurementPlan,
    riskAssessment,
    outputDir
  });

  artifacts.push(...finalReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    eventDescription,
    eventType,
    rootCauses: rootCauseDetermination.rootCauses,
    contributingFactors: {
      human: contributingFactors.humanFactors,
      system: contributingFactors.systemFactors,
      environmental: contributingFactors.environmentalFactors
    },
    actionPlan: {
      actions: actionPlan.actions,
      strongActions: actionPlan.strongActions,
      timeline: actionPlan.timeline,
      responsibilities: actionPlan.responsibilities
    },
    measurementPlan: measurementPlan.plan,
    riskReduction: riskAssessment.estimatedReduction,
    timeline: timelineReconstruction.timeline,
    artifacts,
    reportPath: finalReport.reportPath,
    duration,
    metadata: {
      processId: 'specializations/domains/social-sciences-humanities/healthcare/root-cause-analysis-healthcare',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Initial Response
export const initialResponseTask = defineTask('rca-hc-initial', (args, taskCtx) => ({
  kind: 'agent',
  title: 'RCA Initial Response',
  agent: {
    name: 'patient-safety-officer',
    prompt: {
      role: 'Patient Safety Officer',
      task: 'Complete initial response to safety event',
      context: args,
      instructions: [
        '1. Document event notification details',
        '2. Classify event type (sentinel, adverse, near-miss)',
        '3. Assess immediate patient safety needs',
        '4. Implement immediate containment actions',
        '5. Preserve evidence and documentation',
        '6. Notify leadership per policy',
        '7. Determine if meets criteria for full RCA',
        '8. Assemble RCA team',
        '9. Establish investigation timeline',
        '10. Begin event documentation'
      ],
      outputFormat: 'JSON with initial response'
    },
    outputSchema: {
      type: 'object',
      required: ['classification', 'immediateActions', 'teamAssembled', 'artifacts'],
      properties: {
        classification: { type: 'string' },
        notificationDetails: { type: 'object' },
        immediateActions: { type: 'array', items: { type: 'object' } },
        evidencePreserved: { type: 'array', items: { type: 'string' } },
        leadershipNotified: { type: 'boolean' },
        teamAssembled: { type: 'boolean' },
        teamMembers: { type: 'array', items: { type: 'object' } },
        investigationTimeline: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'rca', 'initial-response', 'patient-safety']
}));

// Task 2: Information Gathering
export const informationGatheringTask = defineTask('rca-hc-info-gather', (args, taskCtx) => ({
  kind: 'agent',
  title: 'RCA Information Gathering',
  agent: {
    name: 'rca-investigator',
    prompt: {
      role: 'RCA Investigator',
      task: 'Gather all relevant information for RCA',
      context: args,
      instructions: [
        '1. Review medical records',
        '2. Conduct staff interviews (non-punitive)',
        '3. Review policies and procedures',
        '4. Examine equipment involved',
        '5. Review environmental factors',
        '6. Collect physical evidence',
        '7. Review staffing patterns',
        '8. Examine training records',
        '9. Review previous similar events',
        '10. Document all findings'
      ],
      outputFormat: 'JSON with gathered information'
    },
    outputSchema: {
      type: 'object',
      required: ['medicalRecordReview', 'interviews', 'policyReview', 'artifacts'],
      properties: {
        medicalRecordReview: { type: 'object' },
        interviews: { type: 'array', items: { type: 'object' } },
        policyReview: { type: 'object' },
        equipmentExamination: { type: 'object' },
        environmentalFactors: { type: 'object' },
        physicalEvidence: { type: 'array', items: { type: 'object' } },
        staffingData: { type: 'object' },
        trainingRecords: { type: 'object' },
        previousEvents: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'rca', 'information-gathering', 'healthcare']
}));

// Task 3: Timeline Reconstruction
export const timelineReconstructionTask = defineTask('rca-hc-timeline', (args, taskCtx) => ({
  kind: 'agent',
  title: 'RCA Timeline Reconstruction',
  agent: {
    name: 'timeline-analyst',
    prompt: {
      role: 'RCA Timeline Analyst',
      task: 'Reconstruct event timeline',
      context: args,
      instructions: [
        '1. Establish event sequence chronologically',
        '2. Document timestamps for each event',
        '3. Identify decision points',
        '4. Map care processes involved',
        '5. Identify deviations from expected',
        '6. Mark critical failure points',
        '7. Note handoffs and transitions',
        '8. Document communication events',
        '9. Create visual timeline',
        '10. Validate timeline with participants'
      ],
      outputFormat: 'JSON with timeline'
    },
    outputSchema: {
      type: 'object',
      required: ['timeline', 'events', 'criticalPoints', 'artifacts'],
      properties: {
        timeline: { type: 'object' },
        events: { type: 'array', items: { type: 'object' } },
        decisionPoints: { type: 'array', items: { type: 'object' } },
        deviations: { type: 'array', items: { type: 'object' } },
        criticalPoints: { type: 'array', items: { type: 'object' } },
        handoffs: { type: 'array', items: { type: 'object' } },
        communicationEvents: { type: 'array', items: { type: 'object' } },
        visualTimeline: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'rca', 'timeline', 'healthcare']
}));

// Task 4: Cause and Effect Analysis
export const causeEffectAnalysisTask = defineTask('rca-hc-cause-effect', (args, taskCtx) => ({
  kind: 'agent',
  title: 'RCA Cause and Effect Analysis',
  agent: {
    name: 'causal-analyst',
    prompt: {
      role: 'Causal Analysis Specialist',
      task: 'Analyze causes and effects',
      context: args,
      instructions: [
        '1. Create fishbone/Ishikawa diagram',
        '2. Apply 5 Whys analysis',
        '3. Analyze each critical point',
        '4. Identify proximal causes',
        '5. Identify distal/latent causes',
        '6. Map cause chains',
        '7. Identify failure modes',
        '8. Apply HFACS framework',
        '9. Document cause relationships',
        '10. Prioritize causal factors'
      ],
      outputFormat: 'JSON with cause analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['fishboneDiagram', 'fiveWhys', 'causeChains', 'artifacts'],
      properties: {
        fishboneDiagram: { type: 'object' },
        fiveWhys: { type: 'array', items: { type: 'object' } },
        proximalCauses: { type: 'array', items: { type: 'object' } },
        distalCauses: { type: 'array', items: { type: 'object' } },
        causeChains: { type: 'array', items: { type: 'object' } },
        failureModes: { type: 'array', items: { type: 'object' } },
        hfacsAnalysis: { type: 'object' },
        prioritizedFactors: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'rca', 'cause-effect', 'healthcare']
}));

// Task 5: Contributing Factors
export const contributingFactorsTask = defineTask('rca-hc-contributing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'RCA Contributing Factors',
  agent: {
    name: 'systems-analyst',
    prompt: {
      role: 'Healthcare Systems Analyst',
      task: 'Identify contributing factors',
      context: args,
      instructions: [
        '1. Identify human factors (fatigue, distraction)',
        '2. Analyze communication factors',
        '3. Assess training factors',
        '4. Evaluate environmental factors',
        '5. Analyze equipment factors',
        '6. Assess organizational factors',
        '7. Evaluate supervision factors',
        '8. Analyze patient factors',
        '9. Assess task factors',
        '10. Categorize by VA NCPS taxonomy'
      ],
      outputFormat: 'JSON with contributing factors'
    },
    outputSchema: {
      type: 'object',
      required: ['humanFactors', 'systemFactors', 'environmentalFactors', 'artifacts'],
      properties: {
        humanFactors: { type: 'array', items: { type: 'object' } },
        communicationFactors: { type: 'array', items: { type: 'object' } },
        trainingFactors: { type: 'array', items: { type: 'object' } },
        environmentalFactors: { type: 'array', items: { type: 'object' } },
        equipmentFactors: { type: 'array', items: { type: 'object' } },
        organizationalFactors: { type: 'array', items: { type: 'object' } },
        systemFactors: { type: 'array', items: { type: 'object' } },
        patientFactors: { type: 'array', items: { type: 'object' } },
        ncpsTaxonomy: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'rca', 'contributing-factors', 'healthcare']
}));

// Task 6: Root Cause Determination
export const rootCauseDeterminationTask = defineTask('rca-hc-root-causes', (args, taskCtx) => ({
  kind: 'agent',
  title: 'RCA Root Cause Determination',
  agent: {
    name: 'root-cause-analyst',
    prompt: {
      role: 'Root Cause Analyst',
      task: 'Determine root causes',
      context: args,
      instructions: [
        '1. Apply root cause criteria',
        '2. Test each potential root cause',
        '3. Verify cause is actionable',
        '4. Verify elimination prevents recurrence',
        '5. Distinguish root from contributing',
        '6. Prioritize root causes',
        '7. Validate with team consensus',
        '8. Document evidence for each root cause',
        '9. Link root causes to events',
        '10. Finalize root cause statements'
      ],
      outputFormat: 'JSON with root causes'
    },
    outputSchema: {
      type: 'object',
      required: ['rootCauses', 'rootCauseStatements', 'artifacts'],
      properties: {
        rootCauses: { type: 'array', items: { type: 'object' } },
        rootCauseStatements: { type: 'array', items: { type: 'string' } },
        criteriaApplied: { type: 'object' },
        evidenceLinks: { type: 'array', items: { type: 'object' } },
        teamConsensus: { type: 'boolean' },
        prioritization: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'rca', 'root-causes', 'healthcare']
}));

// Task 7: Action Plan Development
export const actionPlanDevelopmentTask = defineTask('rca-hc-action-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'RCA Action Plan Development',
  agent: {
    name: 'action-planner',
    prompt: {
      role: 'Patient Safety Action Planner',
      task: 'Develop corrective action plan',
      context: args,
      instructions: [
        '1. Develop action for each root cause',
        '2. Prioritize strong vs weak actions',
        '3. Prefer system changes over individual',
        '4. Include forcing functions where possible',
        '5. Define action owner and timeline',
        '6. Assess feasibility of each action',
        '7. Identify resource requirements',
        '8. Plan for resistance/barriers',
        '9. Define success criteria',
        '10. Create implementation timeline'
      ],
      outputFormat: 'JSON with action plan'
    },
    outputSchema: {
      type: 'object',
      required: ['actions', 'strongActions', 'timeline', 'responsibilities', 'artifacts'],
      properties: {
        actions: { type: 'array', items: { type: 'object' } },
        strongActions: { type: 'number' },
        weakActions: { type: 'number' },
        systemChanges: { type: 'array', items: { type: 'object' } },
        forcingFunctions: { type: 'array', items: { type: 'object' } },
        timeline: { type: 'object' },
        responsibilities: { type: 'array', items: { type: 'object' } },
        resources: { type: 'object' },
        barriers: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'rca', 'action-plan', 'healthcare']
}));

// Task 8: Measurement Plan
export const measurementPlanTask = defineTask('rca-hc-measurement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'RCA Measurement Plan',
  agent: {
    name: 'measurement-specialist',
    prompt: {
      role: 'Quality Measurement Specialist',
      task: 'Develop measurement plan for actions',
      context: args,
      instructions: [
        '1. Define outcome measures',
        '2. Define process measures',
        '3. Establish measurement frequency',
        '4. Define data collection method',
        '5. Establish baseline metrics',
        '6. Set target performance levels',
        '7. Define monitoring duration',
        '8. Plan effectiveness evaluation',
        '9. Create monitoring dashboard',
        '10. Define escalation triggers'
      ],
      outputFormat: 'JSON with measurement plan'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'measures', 'targets', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        outcomeMeasures: { type: 'array', items: { type: 'object' } },
        processMeasures: { type: 'array', items: { type: 'object' } },
        measures: { type: 'array', items: { type: 'object' } },
        targets: { type: 'object' },
        baselines: { type: 'object' },
        frequency: { type: 'object' },
        dataCollection: { type: 'object' },
        monitoringDuration: { type: 'string' },
        dashboard: { type: 'object' },
        escalationTriggers: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'rca', 'measurement', 'healthcare']
}));

// Task 9: Risk Reduction Assessment
export const riskReductionAssessmentTask = defineTask('rca-hc-risk-reduction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'RCA Risk Reduction Assessment',
  agent: {
    name: 'risk-analyst',
    prompt: {
      role: 'Healthcare Risk Analyst',
      task: 'Assess risk reduction from actions',
      context: args,
      instructions: [
        '1. Calculate initial risk score',
        '2. Estimate risk reduction per action',
        '3. Calculate cumulative risk reduction',
        '4. Identify residual risk',
        '5. Assess sustainability of reduction',
        '6. Identify potential new risks',
        '7. Calculate risk-benefit ratio',
        '8. Prioritize by risk reduction',
        '9. Document risk assumptions',
        '10. Create risk summary'
      ],
      outputFormat: 'JSON with risk assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['initialRisk', 'estimatedReduction', 'residualRisk', 'artifacts'],
      properties: {
        initialRisk: { type: 'number' },
        estimatedReduction: { type: 'number' },
        reductionByAction: { type: 'array', items: { type: 'object' } },
        cumulativeReduction: { type: 'number' },
        residualRisk: { type: 'number' },
        sustainabilityAssessment: { type: 'object' },
        newRisks: { type: 'array', items: { type: 'object' } },
        riskBenefitRatio: { type: 'number' },
        assumptions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'rca', 'risk-reduction', 'healthcare']
}));

// Task 10: Final Report
export const rcaReportGenerationTask = defineTask('rca-hc-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'RCA Final Report Generation',
  agent: {
    name: 'report-writer',
    prompt: {
      role: 'Patient Safety Report Writer',
      task: 'Generate comprehensive RCA report',
      context: args,
      instructions: [
        '1. Write executive summary',
        '2. Document event description',
        '3. Include timeline',
        '4. Present cause analysis',
        '5. Document root causes',
        '6. Present action plan',
        '7. Include measurement plan',
        '8. Document risk assessment',
        '9. Add appendices',
        '10. Format per regulatory requirements'
      ],
      outputFormat: 'JSON with report details'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        sections: { type: 'array', items: { type: 'string' } },
        appendices: { type: 'array', items: { type: 'string' } },
        regulatoryCompliance: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'rca', 'report', 'healthcare']
}));
