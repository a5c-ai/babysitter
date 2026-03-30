/**
 * @process domains/science/industrial-engineering/fmea
 * @description Failure Mode and Effects Analysis - Conduct systematic FMEA to identify potential failure modes,
 * assess risks, and prioritize actions to prevent failures before they occur.
 * @inputs { scope: string, fmeaType?: string, existingFmea?: object }
 * @outputs { success: boolean, fmeaWorksheet: object, highRiskItems: array, actionPlan: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('domains/science/industrial-engineering/fmea', {
 *   scope: 'New product design - Electric motor assembly',
 *   fmeaType: 'DFMEA',
 *   existingFmea: null
 * });
 *
 * @references
 * - AIAG FMEA Handbook (4th Edition)
 * - SAE J1739 - FMEA Standard
 * - ISO 31000 Risk Management
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    scope,
    fmeaType = 'PFMEA',
    existingFmea = null,
    rpnThreshold = 100,
    outputDir = 'fmea-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Failure Mode and Effects Analysis process');

  // Task 1: FMEA Scope Definition
  ctx.log('info', 'Phase 1: Defining FMEA scope and team');
  const scopeDefinition = await ctx.task(scopeDefinitionTask, {
    scope,
    fmeaType,
    existingFmea,
    outputDir
  });

  artifacts.push(...scopeDefinition.artifacts);

  // Task 2: Process/Design Analysis
  ctx.log('info', 'Phase 2: Analyzing process steps or design components');
  const processAnalysis = await ctx.task(processAnalysisTask, {
    scopeDefinition,
    fmeaType,
    outputDir
  });

  artifacts.push(...processAnalysis.artifacts);

  // Task 3: Failure Mode Identification
  ctx.log('info', 'Phase 3: Identifying potential failure modes');
  const failureModeId = await ctx.task(failureModeTask, {
    processAnalysis,
    outputDir
  });

  artifacts.push(...failureModeId.artifacts);

  // Breakpoint: Review failure modes
  await ctx.breakpoint({
    question: `${failureModeId.failureModeCount} potential failure modes identified across ${processAnalysis.itemCount} items. Review before severity rating?`,
    title: 'Failure Mode Review',
    context: {
      runId: ctx.runId,
      failureModeCount: failureModeId.failureModeCount,
      itemCount: processAnalysis.itemCount,
      files: failureModeId.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // Task 4: Severity Rating
  ctx.log('info', 'Phase 4: Assessing severity of effects');
  const severityRating = await ctx.task(severityRatingTask, {
    failureModeId,
    outputDir
  });

  artifacts.push(...severityRating.artifacts);

  // Task 5: Occurrence Rating
  ctx.log('info', 'Phase 5: Assessing occurrence likelihood');
  const occurrenceRating = await ctx.task(occurrenceRatingTask, {
    failureModeId,
    outputDir
  });

  artifacts.push(...occurrenceRating.artifacts);

  // Task 6: Detection Rating
  ctx.log('info', 'Phase 6: Assessing detection capability');
  const detectionRating = await ctx.task(detectionRatingTask, {
    failureModeId,
    outputDir
  });

  artifacts.push(...detectionRating.artifacts);

  // Task 7: RPN Calculation
  ctx.log('info', 'Phase 7: Calculating Risk Priority Numbers');
  const rpnCalculation = await ctx.task(rpnCalculationTask, {
    severityRating,
    occurrenceRating,
    detectionRating,
    rpnThreshold,
    outputDir
  });

  artifacts.push(...rpnCalculation.artifacts);

  // Task 8: Action Plan Development
  ctx.log('info', 'Phase 8: Developing mitigation actions for high-risk items');
  const actionPlan = await ctx.task(actionPlanTask, {
    rpnCalculation,
    rpnThreshold,
    outputDir
  });

  artifacts.push(...actionPlan.artifacts);

  // Task 9: FMEA Documentation
  ctx.log('info', 'Phase 9: Creating FMEA documentation');
  const fmeaDocumentation = await ctx.task(fmeaDocumentationTask, {
    scopeDefinition,
    processAnalysis,
    rpnCalculation,
    actionPlan,
    outputDir
  });

  artifacts.push(...fmeaDocumentation.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `FMEA complete. ${rpnCalculation.highRiskCount} high-risk items identified (RPN > ${rpnThreshold}). ${actionPlan.actionCount} actions recommended. Review FMEA worksheet?`,
    title: 'FMEA Results Review',
    context: {
      runId: ctx.runId,
      summary: {
        totalFailureModes: failureModeId.failureModeCount,
        highRiskItems: rpnCalculation.highRiskCount,
        maxRPN: rpnCalculation.maxRPN,
        actionsRecommended: actionPlan.actionCount
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    fmeaWorksheet: fmeaDocumentation.worksheet,
    highRiskItems: rpnCalculation.highRiskItems,
    actionPlan: actionPlan.actions,
    rpnSummary: {
      maxRPN: rpnCalculation.maxRPN,
      avgRPN: rpnCalculation.avgRPN,
      highRiskCount: rpnCalculation.highRiskCount
    },
    artifacts,
    duration,
    metadata: {
      processId: 'domains/science/industrial-engineering/fmea',
      timestamp: startTime,
      fmeaType,
      rpnThreshold,
      outputDir
    }
  };
}

// Task 1: Scope Definition
export const scopeDefinitionTask = defineTask('scope-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define FMEA scope and team',
  agent: {
    name: 'fmea-facilitator',
    prompt: {
      role: 'FMEA Facilitator',
      task: 'Define FMEA scope, objectives, and cross-functional team',
      context: args,
      instructions: [
        '1. Define FMEA scope and boundaries',
        '2. Determine FMEA type (DFMEA, PFMEA, SFMEA)',
        '3. Identify cross-functional team members',
        '4. Review customer requirements',
        '5. Review historical data and lessons learned',
        '6. Define rating scales (S, O, D)',
        '7. Establish RPN threshold',
        '8. Create FMEA header information'
      ],
      outputFormat: 'JSON with FMEA scope and setup information'
    },
    outputSchema: {
      type: 'object',
      required: ['fmeaScope', 'fmeaType', 'teamMembers', 'ratingScales', 'artifacts'],
      properties: {
        fmeaScope: { type: 'object' },
        fmeaType: { type: 'string' },
        teamMembers: { type: 'array' },
        ratingScales: { type: 'object' },
        historicalData: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'fmea', 'scope']
}));

// Task 2: Process/Design Analysis
export const processAnalysisTask = defineTask('process-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze process or design',
  agent: {
    name: 'process-analyst',
    prompt: {
      role: 'Process/Design Analyst',
      task: 'Analyze and document process steps or design components',
      context: args,
      instructions: [
        '1. Create process flow diagram or block diagram',
        '2. Identify all process steps or components',
        '3. Define function of each item',
        '4. Identify requirements for each function',
        '5. Link to specifications and tolerances',
        '6. Identify interfaces and dependencies',
        '7. Number items for traceability',
        '8. Document analysis results'
      ],
      outputFormat: 'JSON with process/design breakdown'
    },
    outputSchema: {
      type: 'object',
      required: ['items', 'itemCount', 'functions', 'artifacts'],
      properties: {
        items: { type: 'array' },
        itemCount: { type: 'number' },
        functions: { type: 'object' },
        requirements: { type: 'object' },
        flowDiagram: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'fmea', 'process-analysis']
}));

// Task 3: Failure Mode Identification
export const failureModeTask = defineTask('failure-mode-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify potential failure modes',
  agent: {
    name: 'failure-mode-analyst',
    prompt: {
      role: 'Reliability Engineer',
      task: 'Identify all potential failure modes for each item',
      context: args,
      instructions: [
        '1. Brainstorm failure modes for each item',
        '2. Consider how each function could fail',
        '3. Use "no function, partial, degraded, intermittent, unintended"',
        '4. Review historical failures and complaints',
        '5. Consider environmental and usage conditions',
        '6. Identify effects of each failure mode',
        '7. Identify potential causes',
        '8. Document all failure modes'
      ],
      outputFormat: 'JSON with failure modes, effects, and causes'
    },
    outputSchema: {
      type: 'object',
      required: ['failureModes', 'failureModeCount', 'artifacts'],
      properties: {
        failureModes: { type: 'array' },
        failureModeCount: { type: 'number' },
        effects: { type: 'object' },
        causes: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'fmea', 'failure-modes']
}));

// Task 4: Severity Rating
export const severityRatingTask = defineTask('severity-rating', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess severity of effects',
  agent: {
    name: 'severity-assessor',
    prompt: {
      role: 'Risk Assessment Specialist',
      task: 'Rate severity of failure mode effects',
      context: args,
      instructions: [
        '1. Review severity rating scale (1-10)',
        '2. Assess severity based on effect to customer',
        '3. Consider safety impacts',
        '4. Consider regulatory impacts',
        '5. Rate severity for each failure mode',
        '6. Ensure consistency across ratings',
        '7. Document rating justifications',
        '8. Identify any safety-critical items (S=9,10)'
      ],
      outputFormat: 'JSON with severity ratings and justifications'
    },
    outputSchema: {
      type: 'object',
      required: ['severityRatings', 'safetyCriticalItems', 'artifacts'],
      properties: {
        severityRatings: { type: 'object' },
        safetyCriticalItems: { type: 'array' },
        ratingJustifications: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'fmea', 'severity']
}));

// Task 5: Occurrence Rating
export const occurrenceRatingTask = defineTask('occurrence-rating', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess occurrence likelihood',
  agent: {
    name: 'occurrence-assessor',
    prompt: {
      role: 'Reliability Analyst',
      task: 'Rate occurrence likelihood of failure causes',
      context: args,
      instructions: [
        '1. Review occurrence rating scale (1-10)',
        '2. Review current controls that prevent causes',
        '3. Consider historical occurrence data',
        '4. Rate occurrence for each cause',
        '5. Use PPM or Cpk data if available',
        '6. Consider similar processes/designs',
        '7. Document rating justifications',
        '8. Identify high occurrence items'
      ],
      outputFormat: 'JSON with occurrence ratings and current controls'
    },
    outputSchema: {
      type: 'object',
      required: ['occurrenceRatings', 'currentControls', 'artifacts'],
      properties: {
        occurrenceRatings: { type: 'object' },
        currentControls: { type: 'object' },
        historicalData: { type: 'object' },
        ratingJustifications: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'fmea', 'occurrence']
}));

// Task 6: Detection Rating
export const detectionRatingTask = defineTask('detection-rating', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess detection capability',
  agent: {
    name: 'detection-assessor',
    prompt: {
      role: 'Quality Control Specialist',
      task: 'Rate detection capability of current controls',
      context: args,
      instructions: [
        '1. Review detection rating scale (1-10)',
        '2. Identify current detection controls',
        '3. Assess detection method effectiveness',
        '4. Consider where in process detection occurs',
        '5. Rate detection for each failure mode',
        '6. Lower score = better detection',
        '7. Document current detection methods',
        '8. Identify items with poor detection'
      ],
      outputFormat: 'JSON with detection ratings and methods'
    },
    outputSchema: {
      type: 'object',
      required: ['detectionRatings', 'detectionMethods', 'artifacts'],
      properties: {
        detectionRatings: { type: 'object' },
        detectionMethods: { type: 'object' },
        poorDetectionItems: { type: 'array' },
        ratingJustifications: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'fmea', 'detection']
}));

// Task 7: RPN Calculation
export const rpnCalculationTask = defineTask('rpn-calculation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate Risk Priority Numbers',
  agent: {
    name: 'rpn-calculator',
    prompt: {
      role: 'Risk Analyst',
      task: 'Calculate RPN and prioritize risks',
      context: args,
      instructions: [
        '1. Calculate RPN = Severity x Occurrence x Detection',
        '2. Rank failure modes by RPN',
        '3. Identify items above RPN threshold',
        '4. Identify high severity items regardless of RPN',
        '5. Create Pareto chart of RPNs',
        '6. Calculate RPN statistics',
        '7. Apply AP (Action Priority) method if using new FMEA',
        '8. Document prioritization results'
      ],
      outputFormat: 'JSON with RPN calculations and prioritization'
    },
    outputSchema: {
      type: 'object',
      required: ['rpnValues', 'highRiskItems', 'highRiskCount', 'maxRPN', 'avgRPN', 'artifacts'],
      properties: {
        rpnValues: { type: 'object' },
        highRiskItems: { type: 'array' },
        highRiskCount: { type: 'number' },
        maxRPN: { type: 'number' },
        avgRPN: { type: 'number' },
        rankedList: { type: 'array' },
        paretoChart: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'fmea', 'rpn']
}));

// Task 8: Action Plan
export const actionPlanTask = defineTask('action-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop mitigation actions',
  agent: {
    name: 'action-planner',
    prompt: {
      role: 'Risk Mitigation Specialist',
      task: 'Develop actions to reduce high-risk items',
      context: args,
      instructions: [
        '1. Prioritize actions for high RPN items',
        '2. Focus on reducing severity, occurrence, or detection',
        '3. Design controls to prevent causes',
        '4. Design controls to improve detection',
        '5. Assign responsible persons',
        '6. Set target completion dates',
        '7. Define success criteria',
        '8. Create action tracking log'
      ],
      outputFormat: 'JSON with action plan'
    },
    outputSchema: {
      type: 'object',
      required: ['actions', 'actionCount', 'artifacts'],
      properties: {
        actions: { type: 'array' },
        actionCount: { type: 'number' },
        responsiblePersons: { type: 'object' },
        targetDates: { type: 'object' },
        expectedRPNReduction: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'fmea', 'action-plan']
}));

// Task 9: FMEA Documentation
export const fmeaDocumentationTask = defineTask('fmea-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create FMEA documentation',
  agent: {
    name: 'fmea-documenter',
    prompt: {
      role: 'FMEA Documentation Specialist',
      task: 'Create comprehensive FMEA documentation',
      context: args,
      instructions: [
        '1. Complete FMEA worksheet with all columns',
        '2. Include header information',
        '3. Document all failure modes and ratings',
        '4. Include recommended actions',
        '5. Create summary report',
        '6. Document lessons learned',
        '7. Create revision history',
        '8. Generate FMEA package'
      ],
      outputFormat: 'JSON with FMEA documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['worksheet', 'worksheetPath', 'summaryReport', 'artifacts'],
      properties: {
        worksheet: { type: 'object' },
        worksheetPath: { type: 'string' },
        summaryReport: { type: 'object' },
        lessonsLearned: { type: 'array' },
        revisionHistory: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'fmea', 'documentation']
}));
