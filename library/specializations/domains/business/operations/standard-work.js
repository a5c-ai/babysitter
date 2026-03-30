/**
 * @process specializations/domains/business/operations/standard-work
 * @description Standard Work Documentation Process - Document, implement, and maintain standardized work procedures
 * with time observations, work sequence, and standard WIP for consistent, efficient operations.
 * @inputs { processName: string, workStation?: string, includeTimeStudy?: boolean, targetCycleTime?: number }
 * @outputs { success: boolean, standardWorkSheet: object, workInstructions: array, trainingMaterials: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/operations/standard-work', {
 *   processName: 'Assembly Cell 1',
 *   workStation: 'Station A',
 *   includeTimeStudy: true,
 *   targetCycleTime: 60
 * });
 *
 * @references
 * - Toyota Production System (TPS) Standard Work
 * - Liker, J. (2004). The Toyota Way
 * - Rother, M. & Harris, R. (2001). Creating Continuous Flow
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    processName,
    workStation = null,
    includeTimeStudy = true,
    targetCycleTime = null,
    taktTime = null,
    operators = 1,
    outputDir = 'standard-work-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Standard Work Documentation for: ${processName}`);

  // Phase 1: Process Observation
  ctx.log('info', 'Phase 1: Process Observation and Work Element Breakdown');
  const observation = await ctx.task(processObservationTask, {
    processName,
    workStation,
    operators,
    outputDir
  });

  artifacts.push(...observation.artifacts);

  // Phase 2: Time Study
  let timeStudy = null;
  if (includeTimeStudy) {
    ctx.log('info', 'Phase 2: Time Study and Measurement');
    timeStudy = await ctx.task(timeStudyTask, {
      processName,
      observation,
      targetCycleTime,
      outputDir
    });

    artifacts.push(...timeStudy.artifacts);
  }

  // Quality Gate: Time Study Review
  await ctx.breakpoint({
    question: `Process observation complete. ${observation.workElements.length} work elements identified. ${timeStudy ? `Cycle time: ${timeStudy.observedCycleTime}s. Target: ${targetCycleTime || taktTime}s.` : ''} Proceed with standard work documentation?`,
    title: 'Time Study Review',
    context: {
      runId: ctx.runId,
      processName,
      workElements: observation.workElements,
      timeStudy: timeStudy?.summary,
      files: [...observation.artifacts, ...(timeStudy?.artifacts || [])].map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 3: Work Sequence Development
  ctx.log('info', 'Phase 3: Work Sequence Development');
  const workSequence = await ctx.task(workSequenceTask, {
    processName,
    observation,
    timeStudy,
    taktTime,
    outputDir
  });

  artifacts.push(...workSequence.artifacts);

  // Phase 4: Standard WIP Calculation
  ctx.log('info', 'Phase 4: Standard WIP Calculation');
  const standardWip = await ctx.task(standardWipTask, {
    processName,
    workSequence,
    operators,
    taktTime,
    outputDir
  });

  artifacts.push(...standardWip.artifacts);

  // Phase 5: Standard Work Sheet Creation
  ctx.log('info', 'Phase 5: Standard Work Sheet Creation');
  const standardWorkSheet = await ctx.task(standardWorkSheetTask, {
    processName,
    workStation,
    observation,
    timeStudy,
    workSequence,
    standardWip,
    taktTime,
    outputDir
  });

  artifacts.push(...standardWorkSheet.artifacts);

  // Phase 6: Work Instructions
  ctx.log('info', 'Phase 6: Detailed Work Instructions');
  const workInstructions = await ctx.task(workInstructionsTask, {
    processName,
    workSequence,
    standardWorkSheet,
    outputDir
  });

  artifacts.push(...workInstructions.artifacts);

  // Quality Gate: Standard Work Review
  await ctx.breakpoint({
    question: `Standard work documentation complete. Cycle time: ${standardWorkSheet.cycleTime}s. Standard WIP: ${standardWip.standardWipQuantity}. Work instructions: ${workInstructions.instructionCount}. Review and approve?`,
    title: 'Standard Work Document Review',
    context: {
      runId: ctx.runId,
      processName,
      standardWorkSheet: standardWorkSheet.summary,
      workSequence: workSequence.sequence,
      standardWip: standardWip.standardWipQuantity,
      files: [...standardWorkSheet.artifacts, ...workInstructions.artifacts].map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 7: Training Materials
  ctx.log('info', 'Phase 7: Training Materials Development');
  const trainingMaterials = await ctx.task(trainingMaterialsTask, {
    processName,
    standardWorkSheet,
    workInstructions,
    outputDir
  });

  artifacts.push(...trainingMaterials.artifacts);

  // Phase 8: Audit Checklist
  ctx.log('info', 'Phase 8: Standard Work Audit Checklist');
  const auditChecklist = await ctx.task(auditChecklistTask, {
    processName,
    standardWorkSheet,
    workSequence,
    outputDir
  });

  artifacts.push(...auditChecklist.artifacts);

  // Phase 9: Report Generation
  ctx.log('info', 'Phase 9: Report Generation');
  const report = await ctx.task(reportTask, {
    processName,
    workStation,
    observation,
    timeStudy,
    workSequence,
    standardWip,
    standardWorkSheet,
    workInstructions,
    trainingMaterials,
    auditChecklist,
    outputDir
  });

  artifacts.push(...report.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    processName,
    workStation,
    standardWorkSheet: {
      cycleTime: standardWorkSheet.cycleTime,
      taktTime: standardWorkSheet.taktTime,
      workElements: standardWorkSheet.workElements,
      standardWip: standardWip.standardWipQuantity,
      operatorCount: standardWorkSheet.operatorCount
    },
    workSequence: workSequence.sequence,
    workInstructions: workInstructions.instructions,
    trainingMaterials: trainingMaterials.materials,
    auditChecklist: auditChecklist.checklist,
    timeStudy: timeStudy ? {
      observedCycleTime: timeStudy.observedCycleTime,
      standardTime: timeStudy.standardTime,
      observations: timeStudy.observationCount
    } : null,
    artifacts,
    reportPath: report.reportPath,
    duration,
    metadata: {
      processId: 'specializations/domains/business/operations/standard-work',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Process Observation
export const processObservationTask = defineTask('standard-work-observation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Process Observation - ${args.processName}`,
  agent: {
    name: 'work-analyst',
    prompt: {
      role: 'Industrial Engineer / Work Study Analyst',
      task: 'Observe and document work elements',
      context: args,
      instructions: [
        '1. Observe multiple cycles of the work',
        '2. Break down work into discrete elements',
        '3. Identify value-added vs non-value-added elements',
        '4. Document worker movement patterns',
        '5. Note machine cycles and wait times',
        '6. Identify safety considerations',
        '7. Document quality check points',
        '8. Note tools and equipment used',
        '9. Identify potential improvements',
        '10. Create work element list'
      ],
      outputFormat: 'JSON with observation data'
    },
    outputSchema: {
      type: 'object',
      required: ['workElements', 'movementPattern', 'artifacts'],
      properties: {
        workElements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              type: { type: 'string', enum: ['value-added', 'non-value-added', 'required-nva'] },
              toolsRequired: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        movementPattern: { type: 'object' },
        safetyConsiderations: { type: 'array', items: { type: 'string' } },
        qualityCheckPoints: { type: 'array', items: { type: 'object' } },
        improvementOpportunities: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'standard-work', 'observation']
}));

// Task 2: Time Study
export const timeStudyTask = defineTask('standard-work-time-study', (args, taskCtx) => ({
  kind: 'agent',
  title: `Time Study - ${args.processName}`,
  agent: {
    name: 'time-study-engineer',
    prompt: {
      role: 'Time Study Engineer',
      task: 'Conduct time study for each work element',
      context: args,
      instructions: [
        '1. Select representative operator(s)',
        '2. Time each work element (minimum 10 cycles)',
        '3. Record observations systematically',
        '4. Apply rating factor for pace',
        '5. Calculate average time per element',
        '6. Add allowances (personal, fatigue, delay)',
        '7. Calculate standard time',
        '8. Compare to takt time',
        '9. Identify bottleneck elements',
        '10. Document time study results'
      ],
      outputFormat: 'JSON with time study results'
    },
    outputSchema: {
      type: 'object',
      required: ['observedCycleTime', 'standardTime', 'observationCount', 'summary', 'artifacts'],
      properties: {
        observedCycleTime: { type: 'number' },
        standardTime: { type: 'number' },
        observationCount: { type: 'number' },
        elementTimes: { type: 'array', items: { type: 'object' } },
        ratingFactor: { type: 'number' },
        allowances: { type: 'object' },
        bottleneckElement: { type: 'string' },
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'standard-work', 'time-study']
}));

// Task 3: Work Sequence Development
export const workSequenceTask = defineTask('standard-work-sequence', (args, taskCtx) => ({
  kind: 'agent',
  title: `Work Sequence Development - ${args.processName}`,
  agent: {
    name: 'process-engineer',
    prompt: {
      role: 'Process Engineer',
      task: 'Develop optimal work sequence',
      context: args,
      instructions: [
        '1. Analyze current work sequence',
        '2. Identify improvement opportunities',
        '3. Optimize sequence for efficiency',
        '4. Balance work content to takt time',
        '5. Minimize movement and waiting',
        '6. Ensure quality check integration',
        '7. Consider ergonomics',
        '8. Validate with operators',
        '9. Document optimal sequence',
        '10. Create work combination chart'
      ],
      outputFormat: 'JSON with work sequence'
    },
    outputSchema: {
      type: 'object',
      required: ['sequence', 'workCombinationChart', 'artifacts'],
      properties: {
        sequence: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number' },
              element: { type: 'string' },
              time: { type: 'number' },
              type: { type: 'string' }
            }
          }
        },
        workCombinationChart: { type: 'object' },
        totalCycleTime: { type: 'number' },
        waitingTime: { type: 'number' },
        walkingTime: { type: 'number' },
        balanceEfficiency: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'standard-work', 'sequence']
}));

// Task 4: Standard WIP Calculation
export const standardWipTask = defineTask('standard-work-wip', (args, taskCtx) => ({
  kind: 'agent',
  title: `Standard WIP Calculation - ${args.processName}`,
  agent: {
    name: 'lean-engineer',
    prompt: {
      role: 'Lean Manufacturing Engineer',
      task: 'Calculate and document standard work-in-process',
      context: args,
      instructions: [
        '1. Identify WIP locations in process',
        '2. Calculate minimum WIP for flow',
        '3. Consider machine cycle times',
        '4. Account for quality checks',
        '5. Determine buffer requirements',
        '6. Calculate standard WIP quantity',
        '7. Document WIP locations on layout',
        '8. Define min/max levels',
        '9. Create visual WIP indicators',
        '10. Document standard WIP'
      ],
      outputFormat: 'JSON with standard WIP'
    },
    outputSchema: {
      type: 'object',
      required: ['standardWipQuantity', 'wipLocations', 'artifacts'],
      properties: {
        standardWipQuantity: { type: 'number' },
        wipLocations: { type: 'array', items: { type: 'object' } },
        minimumWip: { type: 'number' },
        bufferWip: { type: 'number' },
        wipByStation: { type: 'object' },
        visualIndicators: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'standard-work', 'wip']
}));

// Task 5: Standard Work Sheet Creation
export const standardWorkSheetTask = defineTask('standard-work-sheet', (args, taskCtx) => ({
  kind: 'agent',
  title: `Standard Work Sheet - ${args.processName}`,
  agent: {
    name: 'documentation-specialist',
    prompt: {
      role: 'Standard Work Documentation Specialist',
      task: 'Create standard work sheet (SWS)',
      context: args,
      instructions: [
        '1. Create standard work layout diagram',
        '2. Document work sequence on sheet',
        '3. Add time values for each element',
        '4. Show operator movement path',
        '5. Indicate WIP locations and quantities',
        '6. Mark quality check points',
        '7. Note safety considerations',
        '8. Add takt time and cycle time',
        '9. Include revision control',
        '10. Format for shop floor display'
      ],
      outputFormat: 'JSON with standard work sheet'
    },
    outputSchema: {
      type: 'object',
      required: ['cycleTime', 'taktTime', 'workElements', 'operatorCount', 'summary', 'artifacts'],
      properties: {
        cycleTime: { type: 'number' },
        taktTime: { type: 'number' },
        workElements: { type: 'array', items: { type: 'object' } },
        operatorCount: { type: 'number' },
        layoutDiagram: { type: 'string' },
        movementPath: { type: 'object' },
        qualityCheckPoints: { type: 'array', items: { type: 'object' } },
        safetyNotes: { type: 'array', items: { type: 'string' } },
        summary: { type: 'object' },
        revisionInfo: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'standard-work', 'documentation']
}));

// Task 6: Work Instructions
export const workInstructionsTask = defineTask('standard-work-instructions', (args, taskCtx) => ({
  kind: 'agent',
  title: `Work Instructions - ${args.processName}`,
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Technical Writer',
      task: 'Create detailed work instructions',
      context: args,
      instructions: [
        '1. Write step-by-step instructions',
        '2. Include photos/diagrams for each step',
        '3. Highlight key quality points',
        '4. Note safety requirements',
        '5. Include troubleshooting guidance',
        '6. Add tips and best practices',
        '7. Create one-point lessons for critical steps',
        '8. Format for easy reading',
        '9. Include revision control',
        '10. Get operator validation'
      ],
      outputFormat: 'JSON with work instructions'
    },
    outputSchema: {
      type: 'object',
      required: ['instructions', 'instructionCount', 'artifacts'],
      properties: {
        instructions: { type: 'array', items: { type: 'object' } },
        instructionCount: { type: 'number' },
        onePointLessons: { type: 'array', items: { type: 'object' } },
        troubleshootingGuide: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'standard-work', 'instructions']
}));

// Task 7: Training Materials
export const trainingMaterialsTask = defineTask('standard-work-training', (args, taskCtx) => ({
  kind: 'agent',
  title: `Training Materials - ${args.processName}`,
  agent: {
    name: 'training-developer',
    prompt: {
      role: 'Training Developer',
      task: 'Develop training materials for standard work',
      context: args,
      instructions: [
        '1. Create training outline',
        '2. Develop presentation materials',
        '3. Create hands-on exercises',
        '4. Design competency assessment',
        '5. Create job breakdown sheet',
        '6. Develop skill matrix',
        '7. Plan OJT approach',
        '8. Create quick reference cards',
        '9. Design certification criteria',
        '10. Document training plan'
      ],
      outputFormat: 'JSON with training materials'
    },
    outputSchema: {
      type: 'object',
      required: ['materials', 'trainingPlan', 'artifacts'],
      properties: {
        materials: { type: 'array', items: { type: 'object' } },
        trainingPlan: { type: 'object' },
        jobBreakdownSheet: { type: 'object' },
        skillMatrix: { type: 'object' },
        assessmentCriteria: { type: 'array', items: { type: 'object' } },
        quickReferenceCard: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'standard-work', 'training']
}));

// Task 8: Audit Checklist
export const auditChecklistTask = defineTask('standard-work-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: `Audit Checklist - ${args.processName}`,
  agent: {
    name: 'audit-developer',
    prompt: {
      role: 'Process Audit Developer',
      task: 'Create standard work audit checklist',
      context: args,
      instructions: [
        '1. Define audit criteria',
        '2. Create checklist items for each element',
        '3. Include sequence verification',
        '4. Add time compliance checks',
        '5. Include WIP level checks',
        '6. Add quality verification points',
        '7. Include safety compliance',
        '8. Define scoring system',
        '9. Create audit schedule',
        '10. Document corrective action process'
      ],
      outputFormat: 'JSON with audit checklist'
    },
    outputSchema: {
      type: 'object',
      required: ['checklist', 'scoringSystem', 'artifacts'],
      properties: {
        checklist: { type: 'array', items: { type: 'object' } },
        scoringSystem: { type: 'object' },
        auditSchedule: { type: 'object' },
        correctiveActionProcess: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'standard-work', 'audit']
}));

// Task 9: Report Generation
export const reportTask = defineTask('standard-work-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Standard Work Report - ${args.processName}`,
  agent: {
    name: 'report-writer',
    prompt: {
      role: 'Technical Report Writer',
      task: 'Generate comprehensive standard work report',
      context: args,
      instructions: [
        '1. Write executive summary',
        '2. Document methodology',
        '3. Present time study results',
        '4. Include work sequence analysis',
        '5. Present standard work sheet',
        '6. Include work instructions',
        '7. Present training materials',
        '8. Include audit checklist',
        '9. Add appendices',
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
        keyFindings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'standard-work', 'reporting']
}));
