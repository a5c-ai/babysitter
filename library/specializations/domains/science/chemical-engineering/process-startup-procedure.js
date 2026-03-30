/**
 * @process chemical-engineering/process-startup-procedure
 * @description Develop comprehensive procedures for safe and efficient process startup including PSSR and commissioning
 * @inputs { processName: string, processDescription: object, equipmentList: array, safetyRequirements: object, outputDir: string }
 * @outputs { success: boolean, startupProcedure: object, pssrChecklist: object, trainingPlan: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    processName,
    processDescription,
    equipmentList,
    safetyRequirements,
    operatingParameters = {},
    outputDir = 'startup-procedure-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Define Startup Sequence and Milestones
  ctx.log('info', 'Starting startup procedure development: Defining sequence');
  const sequenceResult = await ctx.task(startupSequenceTask, {
    processName,
    processDescription,
    equipmentList,
    outputDir
  });

  if (!sequenceResult.success) {
    return {
      success: false,
      error: 'Startup sequence definition failed',
      details: sequenceResult,
      metadata: { processId: 'chemical-engineering/process-startup-procedure', timestamp: startTime }
    };
  }

  artifacts.push(...sequenceResult.artifacts);

  // Task 2: Develop Pre-Startup Safety Review Items
  ctx.log('info', 'Developing PSSR checklist');
  const pssrResult = await ctx.task(pssrDevelopmentTask, {
    processName,
    processDescription,
    equipmentList,
    safetyRequirements,
    outputDir
  });

  artifacts.push(...pssrResult.artifacts);

  // Task 3: Develop Detailed Operating Procedures
  ctx.log('info', 'Developing detailed operating procedures');
  const procedureResult = await ctx.task(operatingProceduresTask, {
    processName,
    startupSequence: sequenceResult.sequence,
    operatingParameters,
    equipmentList,
    outputDir
  });

  artifacts.push(...procedureResult.artifacts);

  // Task 4: Define Startup Parameters and Limits
  ctx.log('info', 'Defining startup parameters and limits');
  const parametersResult = await ctx.task(startupParametersTask, {
    processName,
    operatingParameters,
    startupSequence: sequenceResult.sequence,
    safetyRequirements,
    outputDir
  });

  artifacts.push(...parametersResult.artifacts);

  // Task 5: Plan Staffing and Training
  ctx.log('info', 'Planning staffing and training');
  const staffingResult = await ctx.task(staffingTrainingTask, {
    processName,
    startupProcedure: procedureResult.procedure,
    equipmentList,
    outputDir
  });

  artifacts.push(...staffingResult.artifacts);

  // Breakpoint: Review startup procedure
  await ctx.breakpoint({
    question: `Startup procedure developed for ${processName}. Steps: ${sequenceResult.sequence.steps.length}. PSSR items: ${pssrResult.checklist.items.length}. Estimated duration: ${sequenceResult.sequence.estimatedDuration} hours. Review procedure?`,
    title: 'Process Startup Procedure Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        startupSteps: sequenceResult.sequence.steps.length,
        pssrItems: pssrResult.checklist.items.length,
        estimatedDuration: sequenceResult.sequence.estimatedDuration,
        criticalSteps: sequenceResult.sequence.criticalSteps
      }
    }
  });

  // Task 6: Prepare Startup Troubleshooting Guide
  ctx.log('info', 'Preparing troubleshooting guide');
  const troubleshootingResult = await ctx.task(troubleshootingGuideTask, {
    processName,
    startupProcedure: procedureResult.procedure,
    parametersLimits: parametersResult.parameters,
    outputDir
  });

  artifacts.push(...troubleshootingResult.artifacts);

  // Task 7: Create Startup Timeline
  ctx.log('info', 'Creating startup timeline');
  const timelineResult = await ctx.task(startupTimelineTask, {
    processName,
    startupSequence: sequenceResult.sequence,
    pssrChecklist: pssrResult.checklist,
    staffingPlan: staffingResult.plan,
    outputDir
  });

  artifacts.push(...timelineResult.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    processName,
    startupProcedure: procedureResult.procedure,
    pssrChecklist: pssrResult.checklist,
    trainingPlan: staffingResult.trainingPlan,
    troubleshootingGuide: troubleshootingResult.guide,
    startupTimeline: timelineResult.timeline,
    artifacts,
    duration,
    metadata: {
      processId: 'chemical-engineering/process-startup-procedure',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Startup Sequence Definition
export const startupSequenceTask = defineTask('startup-sequence', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define startup sequence and milestones',
  agent: {
    name: 'startup-commissioning-engineer',
    prompt: {
      role: 'process startup engineer',
      task: 'Define startup sequence and key milestones',
      context: args,
      instructions: [
        'Define overall startup philosophy',
        'Identify startup phases (preparation, utilities, process)',
        'Define step-by-step sequence for each unit',
        'Identify critical path activities',
        'Define hold points and verification steps',
        'Identify parallel activities',
        'Estimate duration for each step',
        'Document startup sequence'
      ],
      outputFormat: 'JSON with startup sequence, phases, milestones, duration, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'sequence', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        sequence: {
          type: 'object',
          properties: {
            phases: { type: 'array' },
            steps: { type: 'array' },
            milestones: { type: 'array' },
            criticalSteps: { type: 'array' },
            estimatedDuration: { type: 'number' }
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
  labels: ['agent', 'chemical-engineering', 'startup-procedure', 'sequence']
}));

// Task 2: PSSR Development
export const pssrDevelopmentTask = defineTask('pssr-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop pre-startup safety review items',
  agent: {
    name: 'startup-commissioning-engineer',
    prompt: {
      role: 'pre-startup safety review engineer',
      task: 'Develop comprehensive PSSR checklist',
      context: args,
      instructions: [
        'Review OSHA PSM PSSR requirements',
        'Verify construction meets design specs',
        'Verify safety systems are operational',
        'Verify procedures are complete',
        'Verify training is complete',
        'Verify MOC items are closed',
        'Verify inspection/testing complete',
        'Create PSSR checklist'
      ],
      outputFormat: 'JSON with PSSR checklist, categories, sign-off requirements, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'checklist', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        checklist: {
          type: 'object',
          properties: {
            items: { type: 'array' },
            categories: { type: 'array' },
            signOffRequirements: { type: 'array' },
            criticalItems: { type: 'array' }
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
  labels: ['agent', 'chemical-engineering', 'startup-procedure', 'pssr']
}));

// Task 3: Operating Procedures Development
export const operatingProceduresTask = defineTask('operating-procedures', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop detailed operating procedures',
  agent: {
    name: 'startup-commissioning-engineer',
    prompt: {
      role: 'operating procedure developer',
      task: 'Develop detailed startup operating procedures',
      context: args,
      instructions: [
        'Create step-by-step procedures',
        'Include equipment preparations',
        'Define valve line-up procedures',
        'Include utility startup procedures',
        'Define process introduction steps',
        'Include safety interlocks verification',
        'Define communication protocols',
        'Document procedures in standard format'
      ],
      outputFormat: 'JSON with operating procedures, steps, verifications, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'procedure', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        procedure: {
          type: 'object',
          properties: {
            sections: { type: 'array' },
            steps: { type: 'array' },
            verifications: { type: 'array' },
            safetyNotes: { type: 'array' }
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
  labels: ['agent', 'chemical-engineering', 'startup-procedure', 'procedures']
}));

// Task 4: Startup Parameters
export const startupParametersTask = defineTask('startup-parameters', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define startup parameters and limits',
  agent: {
    name: 'startup-commissioning-engineer',
    prompt: {
      role: 'startup parameters engineer',
      task: 'Define startup parameters, limits, and ramp rates',
      context: args,
      instructions: [
        'Define initial operating conditions',
        'Define ramp rates for temperature',
        'Define ramp rates for pressure',
        'Define flow rate adjustments',
        'Define startup limits vs. normal limits',
        'Define hold points and criteria',
        'Define transition to normal operations',
        'Document all parameters'
      ],
      outputFormat: 'JSON with startup parameters, limits, ramp rates, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'parameters', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        parameters: {
          type: 'object',
          properties: {
            initialConditions: { type: 'object' },
            rampRates: { type: 'object' },
            startupLimits: { type: 'object' },
            holdPoints: { type: 'array' },
            transitionCriteria: { type: 'object' }
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
  labels: ['agent', 'chemical-engineering', 'startup-procedure', 'parameters']
}));

// Task 5: Staffing and Training
export const staffingTrainingTask = defineTask('staffing-training', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan staffing and training',
  agent: {
    name: 'startup-commissioning-engineer',
    prompt: {
      role: 'startup training planner',
      task: 'Plan staffing and training for startup',
      context: args,
      instructions: [
        'Determine startup staffing requirements',
        'Define roles and responsibilities',
        'Identify training requirements',
        'Develop training curriculum',
        'Plan tabletop exercises',
        'Plan hands-on training',
        'Define competency verification',
        'Create training plan'
      ],
      outputFormat: 'JSON with staffing plan, training plan, competency requirements, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'plan', 'trainingPlan', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        plan: {
          type: 'object',
          properties: {
            staffingRequirements: { type: 'object' },
            roles: { type: 'array' },
            shifts: { type: 'object' }
          }
        },
        trainingPlan: {
          type: 'object',
          properties: {
            curriculum: { type: 'array' },
            exercises: { type: 'array' },
            competencies: { type: 'array' }
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
  labels: ['agent', 'chemical-engineering', 'startup-procedure', 'training']
}));

// Task 6: Troubleshooting Guide
export const troubleshootingGuideTask = defineTask('troubleshooting-guide', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare startup troubleshooting guide',
  agent: {
    name: 'startup-commissioning-engineer',
    prompt: {
      role: 'startup troubleshooting developer',
      task: 'Prepare troubleshooting guide for startup issues',
      context: args,
      instructions: [
        'Identify common startup problems',
        'Develop diagnostic flowcharts',
        'Define corrective actions',
        'Include equipment-specific troubleshooting',
        'Address interlock/trip recovery',
        'Include abnormal situation guidance',
        'Define escalation procedures',
        'Create troubleshooting guide'
      ],
      outputFormat: 'JSON with troubleshooting guide, flowcharts, corrective actions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'guide', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        guide: {
          type: 'object',
          properties: {
            commonProblems: { type: 'array' },
            diagnosticFlowcharts: { type: 'array' },
            correctiveActions: { type: 'array' },
            escalationProcedures: { type: 'object' }
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
  labels: ['agent', 'chemical-engineering', 'startup-procedure', 'troubleshooting']
}));

// Task 7: Startup Timeline
export const startupTimelineTask = defineTask('startup-timeline', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create startup timeline',
  agent: {
    name: 'startup-commissioning-engineer',
    prompt: {
      role: 'startup timeline developer',
      task: 'Create detailed startup timeline',
      context: args,
      instructions: [
        'Develop detailed Gantt chart',
        'Include PSSR completion',
        'Include all startup phases',
        'Identify critical path',
        'Include resource assignments',
        'Define dependencies',
        'Include contingency time',
        'Create timeline documentation'
      ],
      outputFormat: 'JSON with startup timeline, Gantt data, critical path, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'timeline', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        timeline: {
          type: 'object',
          properties: {
            ganttData: { type: 'array' },
            criticalPath: { type: 'array' },
            milestones: { type: 'array' },
            totalDuration: { type: 'number' },
            contingency: { type: 'number' }
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
  labels: ['agent', 'chemical-engineering', 'startup-procedure', 'timeline']
}));
