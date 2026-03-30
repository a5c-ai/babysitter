/**
 * @process specializations/domains/social-sciences-humanities/healthcare/fmea-healthcare
 * @description Failure Mode and Effects Analysis (FMEA) - Proactive risk assessment tool that identifies
 * potential failures in healthcare processes before they occur and develops preventive actions.
 * @inputs { processName: string, processScope?: string, existingControls?: array, teamMembers?: array }
 * @outputs { success: boolean, failureModes: array, prioritizedRisks: array, actionPlan: object, artifacts: array }
 * @recommendedSkills SK-HC-005 (patient-safety-event-analysis), SK-HC-001 (clinical-workflow-analysis)
 * @recommendedAgents AG-HC-004 (patient-safety-officer), AG-HC-001 (quality-improvement-orchestrator)
 *
 * @example
 * const result = await orchestrate('specializations/domains/social-sciences-humanities/healthcare/fmea-healthcare', {
 *   processName: 'Medication Administration Process',
 *   processScope: 'From pharmacy dispensing to patient administration',
 *   existingControls: ['barcode scanning', 'double-check policy'],
 *   teamMembers: ['pharmacist', 'nurse', 'physician', 'quality']
 * });
 *
 * @references
 * - IHI FMEA Tool
 * - VA NCPS HFMEA
 * - Joint Commission Proactive Risk Assessment
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    processName,
    processScope = '',
    existingControls = [],
    teamMembers = [],
    riskThreshold = 8,
    outputDir = 'fmea-healthcare-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Healthcare FMEA for: ${processName}`);

  // Phase 1: Process Selection and Team Formation
  ctx.log('info', 'Phase 1: Process Selection and Team Formation');
  const processSelection = await ctx.task(processSelectionTask, {
    processName,
    processScope,
    teamMembers,
    outputDir
  });

  artifacts.push(...processSelection.artifacts);

  await ctx.breakpoint({
    question: `Process selected: ${processSelection.processName}. Team of ${processSelection.team.length} assembled. Scope defined. Proceed with process mapping?`,
    title: 'Process Selection Review',
    context: {
      runId: ctx.runId,
      processName,
      scope: processSelection.scope,
      team: processSelection.team,
      files: processSelection.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 2: Process Mapping
  ctx.log('info', 'Phase 2: Process Mapping');
  const processMapping = await ctx.task(processMappingTask, {
    processSelection,
    outputDir
  });

  artifacts.push(...processMapping.artifacts);

  // Phase 3: Failure Mode Identification
  ctx.log('info', 'Phase 3: Failure Mode Identification');
  const failureModeIdentification = await ctx.task(failureModeIdentificationTask, {
    processMapping,
    existingControls,
    outputDir
  });

  artifacts.push(...failureModeIdentification.artifacts);

  await ctx.breakpoint({
    question: `${failureModeIdentification.failureModes.length} failure modes identified across ${processMapping.steps.length} process steps. Proceed with hazard scoring?`,
    title: 'Failure Mode Identification Review',
    context: {
      runId: ctx.runId,
      failureModes: failureModeIdentification.failureModes,
      byStep: failureModeIdentification.failuresByStep,
      files: failureModeIdentification.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 4: Hazard Scoring
  ctx.log('info', 'Phase 4: Hazard Scoring (Severity, Occurrence, Detection)');
  const hazardScoring = await ctx.task(hazardScoringTask, {
    failureModeIdentification,
    existingControls,
    outputDir
  });

  artifacts.push(...hazardScoring.artifacts);

  // Phase 5: Risk Prioritization
  ctx.log('info', 'Phase 5: Risk Prioritization');
  const riskPrioritization = await ctx.task(riskPrioritizationTask, {
    hazardScoring,
    riskThreshold,
    outputDir
  });

  artifacts.push(...riskPrioritization.artifacts);

  await ctx.breakpoint({
    question: `Risk prioritization complete. ${riskPrioritization.highPriorityRisks.length} high-priority risks (RPN >= ${riskThreshold}). Top risk: ${riskPrioritization.topRisk.failureMode}. Proceed with action development?`,
    title: 'Risk Prioritization Review',
    context: {
      runId: ctx.runId,
      highPriorityRisks: riskPrioritization.highPriorityRisks,
      rpnDistribution: riskPrioritization.rpnDistribution,
      files: riskPrioritization.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 6: Action Development
  ctx.log('info', 'Phase 6: Action Development');
  const actionDevelopment = await ctx.task(actionDevelopmentTask, {
    riskPrioritization,
    outputDir
  });

  artifacts.push(...actionDevelopment.artifacts);

  // Phase 7: Action Implementation Planning
  ctx.log('info', 'Phase 7: Implementation Planning');
  const implementationPlan = await ctx.task(fmeaImplementationTask, {
    actionDevelopment,
    riskPrioritization,
    outputDir
  });

  artifacts.push(...implementationPlan.artifacts);

  // Phase 8: Outcome Measures
  ctx.log('info', 'Phase 8: Outcome Measures Definition');
  const outcomeMeasures = await ctx.task(fmeaOutcomeMeasuresTask, {
    actionDevelopment,
    riskPrioritization,
    outputDir
  });

  artifacts.push(...outcomeMeasures.artifacts);

  // Phase 9: Re-scoring After Actions
  ctx.log('info', 'Phase 9: Projected Risk Re-scoring');
  const reScoring = await ctx.task(riskReScoringTask, {
    hazardScoring,
    actionDevelopment,
    outputDir
  });

  artifacts.push(...reScoring.artifacts);

  // Phase 10: Final FMEA Report
  ctx.log('info', 'Phase 10: Final FMEA Report');
  const finalReport = await ctx.task(fmeaReportTask, {
    processName,
    processMapping,
    failureModeIdentification,
    hazardScoring,
    riskPrioritization,
    actionDevelopment,
    implementationPlan,
    outcomeMeasures,
    reScoring,
    outputDir
  });

  artifacts.push(...finalReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    processName,
    failureModes: failureModeIdentification.failureModes,
    prioritizedRisks: riskPrioritization.prioritizedRisks,
    highPriorityRisks: riskPrioritization.highPriorityRisks,
    actionPlan: {
      actions: actionDevelopment.actions,
      implementation: implementationPlan.plan,
      measures: outcomeMeasures.measures
    },
    riskReduction: {
      before: hazardScoring.totalRPN,
      after: reScoring.projectedTotalRPN,
      reduction: reScoring.rpnReduction
    },
    artifacts,
    reportPath: finalReport.reportPath,
    duration,
    metadata: {
      processId: 'specializations/domains/social-sciences-humanities/healthcare/fmea-healthcare',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Process Selection
export const processSelectionTask = defineTask('fmea-process-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: `FMEA Process Selection - ${args.processName}`,
  agent: {
    name: 'fmea-facilitator',
    prompt: {
      role: 'FMEA Facilitator',
      task: 'Select and scope process for FMEA',
      context: args,
      instructions: [
        '1. Define process for analysis',
        '2. Establish process boundaries',
        '3. Identify process owner',
        '4. Assemble multidisciplinary team',
        '5. Define team roles',
        '6. Establish meeting schedule',
        '7. Gather existing documentation',
        '8. Review previous incidents',
        '9. Define FMEA objectives',
        '10. Create project charter'
      ],
      outputFormat: 'JSON with process selection'
    },
    outputSchema: {
      type: 'object',
      required: ['processName', 'scope', 'team', 'artifacts'],
      properties: {
        processName: { type: 'string' },
        scope: { type: 'object' },
        boundaries: { type: 'object' },
        processOwner: { type: 'string' },
        team: { type: 'array', items: { type: 'object' } },
        objectives: { type: 'array', items: { type: 'string' } },
        previousIncidents: { type: 'array', items: { type: 'object' } },
        charter: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fmea', 'process-selection', 'healthcare']
}));

// Task 2: Process Mapping
export const processMappingTask = defineTask('fmea-process-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'FMEA Process Mapping',
  agent: {
    name: 'process-mapper',
    prompt: {
      role: 'Process Mapping Specialist',
      task: 'Create detailed process map for FMEA',
      context: args,
      instructions: [
        '1. Create high-level process flow',
        '2. Break down into sub-processes',
        '3. Identify all process steps',
        '4. Document inputs and outputs',
        '5. Identify decision points',
        '6. Map handoffs between roles',
        '7. Document systems/technology used',
        '8. Identify critical steps',
        '9. Validate with process participants',
        '10. Create visual process map'
      ],
      outputFormat: 'JSON with process map'
    },
    outputSchema: {
      type: 'object',
      required: ['steps', 'processFlow', 'criticalSteps', 'artifacts'],
      properties: {
        processFlow: { type: 'object' },
        steps: { type: 'array', items: { type: 'object' } },
        subProcesses: { type: 'array', items: { type: 'object' } },
        decisionPoints: { type: 'array', items: { type: 'object' } },
        handoffs: { type: 'array', items: { type: 'object' } },
        systems: { type: 'array', items: { type: 'string' } },
        criticalSteps: { type: 'array', items: { type: 'string' } },
        visualMap: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fmea', 'process-mapping', 'healthcare']
}));

// Task 3: Failure Mode Identification
export const failureModeIdentificationTask = defineTask('fmea-failure-modes', (args, taskCtx) => ({
  kind: 'agent',
  title: 'FMEA Failure Mode Identification',
  agent: {
    name: 'failure-analyst',
    prompt: {
      role: 'Failure Mode Analyst',
      task: 'Identify failure modes for each process step',
      context: args,
      instructions: [
        '1. Analyze each process step',
        '2. Brainstorm potential failure modes',
        '3. Consider human error modes',
        '4. Consider equipment failures',
        '5. Consider system failures',
        '6. Identify effects of each failure',
        '7. Identify potential causes',
        '8. Document existing controls',
        '9. Consider patient impact',
        '10. Document all failure modes'
      ],
      outputFormat: 'JSON with failure modes'
    },
    outputSchema: {
      type: 'object',
      required: ['failureModes', 'failuresByStep', 'artifacts'],
      properties: {
        failureModes: { type: 'array', items: { type: 'object' } },
        failuresByStep: { type: 'object' },
        humanErrors: { type: 'array', items: { type: 'object' } },
        equipmentFailures: { type: 'array', items: { type: 'object' } },
        systemFailures: { type: 'array', items: { type: 'object' } },
        effects: { type: 'array', items: { type: 'object' } },
        causes: { type: 'array', items: { type: 'object' } },
        existingControls: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fmea', 'failure-modes', 'healthcare']
}));

// Task 4: Hazard Scoring
export const hazardScoringTask = defineTask('fmea-hazard-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'FMEA Hazard Scoring',
  agent: {
    name: 'risk-scorer',
    prompt: {
      role: 'Risk Scoring Specialist',
      task: 'Score failure modes for severity, occurrence, detection',
      context: args,
      instructions: [
        '1. Apply severity scale (1-10) for patient impact',
        '2. Rate occurrence likelihood (1-10)',
        '3. Rate detection capability (1-10)',
        '4. Calculate RPN (S x O x D)',
        '5. Use healthcare-specific criteria',
        '6. Document scoring rationale',
        '7. Achieve team consensus on scores',
        '8. Identify scoring uncertainties',
        '9. Calculate total RPN',
        '10. Create scoring summary'
      ],
      outputFormat: 'JSON with hazard scores'
    },
    outputSchema: {
      type: 'object',
      required: ['scoredFailureModes', 'totalRPN', 'artifacts'],
      properties: {
        scoredFailureModes: { type: 'array', items: { type: 'object' } },
        severityCriteria: { type: 'object' },
        occurrenceCriteria: { type: 'object' },
        detectionCriteria: { type: 'object' },
        totalRPN: { type: 'number' },
        averageRPN: { type: 'number' },
        scoringRationale: { type: 'object' },
        uncertainties: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fmea', 'hazard-scoring', 'healthcare']
}));

// Task 5: Risk Prioritization
export const riskPrioritizationTask = defineTask('fmea-prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'FMEA Risk Prioritization',
  agent: {
    name: 'prioritization-analyst',
    prompt: {
      role: 'Risk Prioritization Analyst',
      task: 'Prioritize failure modes for action',
      context: args,
      instructions: [
        '1. Rank failure modes by RPN',
        '2. Apply hazard threshold for action',
        '3. Consider severity alone for critical items',
        '4. Identify high-priority risks',
        '5. Create Pareto analysis',
        '6. Identify quick wins',
        '7. Group related failure modes',
        '8. Prioritize for action planning',
        '9. Create risk heat map',
        '10. Document prioritization criteria'
      ],
      outputFormat: 'JSON with prioritized risks'
    },
    outputSchema: {
      type: 'object',
      required: ['prioritizedRisks', 'highPriorityRisks', 'topRisk', 'rpnDistribution', 'artifacts'],
      properties: {
        prioritizedRisks: { type: 'array', items: { type: 'object' } },
        highPriorityRisks: { type: 'array', items: { type: 'object' } },
        topRisk: { type: 'object' },
        paretoAnalysis: { type: 'object' },
        quickWins: { type: 'array', items: { type: 'object' } },
        rpnDistribution: { type: 'object' },
        riskHeatMap: { type: 'object' },
        prioritizationCriteria: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fmea', 'prioritization', 'healthcare']
}));

// Task 6: Action Development
export const actionDevelopmentTask = defineTask('fmea-actions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'FMEA Action Development',
  agent: {
    name: 'action-developer',
    prompt: {
      role: 'Risk Mitigation Action Developer',
      task: 'Develop actions for high-priority risks',
      context: args,
      instructions: [
        '1. Develop actions to reduce severity',
        '2. Develop actions to reduce occurrence',
        '3. Develop actions to improve detection',
        '4. Prioritize elimination over detection',
        '5. Consider forcing functions',
        '6. Design error-proofing measures',
        '7. Assign action owners',
        '8. Set target completion dates',
        '9. Estimate resource requirements',
        '10. Document action rationale'
      ],
      outputFormat: 'JSON with actions'
    },
    outputSchema: {
      type: 'object',
      required: ['actions', 'artifacts'],
      properties: {
        actions: { type: 'array', items: { type: 'object' } },
        severityReductions: { type: 'array', items: { type: 'object' } },
        occurrenceReductions: { type: 'array', items: { type: 'object' } },
        detectionImprovements: { type: 'array', items: { type: 'object' } },
        forcingFunctions: { type: 'array', items: { type: 'object' } },
        errorProofing: { type: 'array', items: { type: 'object' } },
        resources: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fmea', 'actions', 'healthcare']
}));

// Task 7: Implementation Planning
export const fmeaImplementationTask = defineTask('fmea-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'FMEA Implementation Planning',
  agent: {
    name: 'implementation-planner',
    prompt: {
      role: 'Implementation Planner',
      task: 'Plan implementation of FMEA actions',
      context: args,
      instructions: [
        '1. Sequence actions by priority',
        '2. Create implementation timeline',
        '3. Identify dependencies',
        '4. Plan pilot testing',
        '5. Identify change management needs',
        '6. Plan communication',
        '7. Define success criteria',
        '8. Plan verification activities',
        '9. Schedule follow-up FMEA',
        '10. Document implementation plan'
      ],
      outputFormat: 'JSON with implementation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'timeline', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        timeline: { type: 'object' },
        dependencies: { type: 'array', items: { type: 'object' } },
        pilotPlan: { type: 'object' },
        changeManagement: { type: 'object' },
        communication: { type: 'object' },
        successCriteria: { type: 'array', items: { type: 'object' } },
        followUpSchedule: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fmea', 'implementation', 'healthcare']
}));

// Task 8: Outcome Measures
export const fmeaOutcomeMeasuresTask = defineTask('fmea-measures', (args, taskCtx) => ({
  kind: 'agent',
  title: 'FMEA Outcome Measures',
  agent: {
    name: 'measures-analyst',
    prompt: {
      role: 'Quality Measures Analyst',
      task: 'Define outcome measures for FMEA actions',
      context: args,
      instructions: [
        '1. Define outcome measures for each action',
        '2. Define process measures',
        '3. Establish baselines',
        '4. Set targets',
        '5. Define data collection methods',
        '6. Establish monitoring frequency',
        '7. Create monitoring dashboard',
        '8. Define reporting requirements',
        '9. Plan effectiveness evaluation',
        '10. Document measurement plan'
      ],
      outputFormat: 'JSON with measures'
    },
    outputSchema: {
      type: 'object',
      required: ['measures', 'targets', 'artifacts'],
      properties: {
        measures: { type: 'array', items: { type: 'object' } },
        outcomeMeasures: { type: 'array', items: { type: 'object' } },
        processMeasures: { type: 'array', items: { type: 'object' } },
        baselines: { type: 'object' },
        targets: { type: 'object' },
        dataCollection: { type: 'object' },
        dashboard: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fmea', 'measures', 'healthcare']
}));

// Task 9: Risk Re-scoring
export const riskReScoringTask = defineTask('fmea-re-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'FMEA Risk Re-scoring',
  agent: {
    name: 'risk-projector',
    prompt: {
      role: 'Risk Projection Analyst',
      task: 'Project risk scores after action implementation',
      context: args,
      instructions: [
        '1. Re-score severity after actions',
        '2. Re-score occurrence after actions',
        '3. Re-score detection after actions',
        '4. Calculate projected RPN',
        '5. Calculate RPN reduction',
        '6. Identify residual risks',
        '7. Verify acceptable risk levels',
        '8. Document assumptions',
        '9. Identify actions needing adjustment',
        '10. Create before/after comparison'
      ],
      outputFormat: 'JSON with re-scoring'
    },
    outputSchema: {
      type: 'object',
      required: ['projectedScores', 'projectedTotalRPN', 'rpnReduction', 'artifacts'],
      properties: {
        projectedScores: { type: 'array', items: { type: 'object' } },
        projectedTotalRPN: { type: 'number' },
        rpnReduction: { type: 'number' },
        reductionPercentage: { type: 'number' },
        residualRisks: { type: 'array', items: { type: 'object' } },
        acceptableRiskVerified: { type: 'boolean' },
        beforeAfterComparison: { type: 'object' },
        assumptions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fmea', 're-scoring', 'healthcare']
}));

// Task 10: Final Report
export const fmeaReportTask = defineTask('fmea-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'FMEA Final Report',
  agent: {
    name: 'report-writer',
    prompt: {
      role: 'Quality Report Writer',
      task: 'Generate comprehensive FMEA report',
      context: args,
      instructions: [
        '1. Write executive summary',
        '2. Document process analyzed',
        '3. Include process map',
        '4. Present failure modes and scores',
        '5. Document prioritized risks',
        '6. Present action plan',
        '7. Include implementation timeline',
        '8. Document measurement plan',
        '9. Show before/after risk comparison',
        '10. Format professionally'
      ],
      outputFormat: 'JSON with report details'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        fmeaWorksheet: { type: 'object' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fmea', 'report', 'healthcare']
}));
