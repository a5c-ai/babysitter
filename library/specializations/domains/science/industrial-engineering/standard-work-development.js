/**
 * @process domains/science/industrial-engineering/standard-work-development
 * @description Standard Work Development - Document and implement standard work to establish the current best method,
 * ensure consistent quality, and provide a baseline for improvement.
 * @inputs { processName: string, workArea?: string, operators?: array }
 * @outputs { success: boolean, standardWorkDocs: object, trainingMaterials: array, auditSystem: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('domains/science/industrial-engineering/standard-work-development', {
 *   processName: 'Final Assembly - Station 3',
 *   workArea: 'Assembly Line A',
 *   operators: ['operator1', 'operator2', 'operator3']
 * });
 *
 * @references
 * - Toyota Production System (Ohno)
 * - Liker & Meier, Toyota Talent
 * - Training Within Industry (TWI) methodology
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    processName,
    workArea = '',
    operators = [],
    taktTime = null,
    outputDir = 'standard-work-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Standard Work Development process');

  // Task 1: Process Observation
  ctx.log('info', 'Phase 1: Observing and timing multiple operators');
  const processObservation = await ctx.task(processObservationTask, {
    processName,
    workArea,
    operators,
    outputDir
  });

  artifacts.push(...processObservation.artifacts);

  // Task 2: Time Study Analysis
  ctx.log('info', 'Phase 2: Analyzing time study data');
  const timeStudyAnalysis = await ctx.task(timeStudyAnalysisTask, {
    processObservation,
    taktTime,
    outputDir
  });

  artifacts.push(...timeStudyAnalysis.artifacts);

  // Breakpoint: Review time study
  await ctx.breakpoint({
    question: `Time study complete. Cycle time: ${timeStudyAnalysis.cycleTime} sec. Takt time: ${taktTime || 'Not specified'}. ${timeStudyAnalysis.workElements.length} work elements identified. Review before standardization?`,
    title: 'Time Study Review',
    context: {
      runId: ctx.runId,
      cycleTime: timeStudyAnalysis.cycleTime,
      workElements: timeStudyAnalysis.workElements,
      variation: timeStudyAnalysis.variationAnalysis,
      files: timeStudyAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // Task 3: Best Method Identification
  ctx.log('info', 'Phase 3: Identifying safest and most efficient method');
  const bestMethodIdentification = await ctx.task(bestMethodTask, {
    processObservation,
    timeStudyAnalysis,
    outputDir
  });

  artifacts.push(...bestMethodIdentification.artifacts);

  // Task 4: Standard Work Combination Sheet
  ctx.log('info', 'Phase 4: Creating standard work combination sheet');
  const combinationSheet = await ctx.task(combinationSheetTask, {
    bestMethodIdentification,
    taktTime,
    outputDir
  });

  artifacts.push(...combinationSheet.artifacts);

  // Task 5: Standard Work Layout
  ctx.log('info', 'Phase 5: Creating standard work layout diagram');
  const layoutDiagram = await ctx.task(layoutDiagramTask, {
    bestMethodIdentification,
    workArea,
    outputDir
  });

  artifacts.push(...layoutDiagram.artifacts);

  // Task 6: Job Instruction Breakdown
  ctx.log('info', 'Phase 6: Creating job instruction breakdown sheets');
  const jobInstructions = await ctx.task(jobInstructionTask, {
    bestMethodIdentification,
    outputDir
  });

  artifacts.push(...jobInstructions.artifacts);

  // Task 7: Training Materials
  ctx.log('info', 'Phase 7: Developing training materials');
  const trainingMaterials = await ctx.task(trainingMaterialsTask, {
    jobInstructions,
    combinationSheet,
    layoutDiagram,
    outputDir
  });

  artifacts.push(...trainingMaterials.artifacts);

  // Task 8: Competency Verification
  ctx.log('info', 'Phase 8: Creating competency verification system');
  const competencySystem = await ctx.task(competencySystemTask, {
    jobInstructions,
    operators,
    outputDir
  });

  artifacts.push(...competencySystem.artifacts);

  // Task 9: Audit System
  ctx.log('info', 'Phase 9: Creating audit checklist and schedule');
  const auditSystem = await ctx.task(auditSystemTask, {
    combinationSheet,
    jobInstructions,
    outputDir
  });

  artifacts.push(...auditSystem.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Standard work development complete. ${jobInstructions.instructionCount} job instructions created. Training materials ready. Review documentation?`,
    title: 'Standard Work Development Results',
    context: {
      runId: ctx.runId,
      summary: {
        cycleTime: timeStudyAnalysis.cycleTime,
        workElements: timeStudyAnalysis.workElements.length,
        instructionsCreated: jobInstructions.instructionCount,
        trainingModules: trainingMaterials.moduleCount
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    standardWorkDocs: {
      combinationSheet: combinationSheet.sheetPath,
      layoutDiagram: layoutDiagram.diagramPath,
      jobInstructions: jobInstructions.instructions
    },
    trainingMaterials: trainingMaterials.materials,
    auditSystem: {
      checklist: auditSystem.checklist,
      schedule: auditSystem.schedule
    },
    competencySystem: competencySystem.system,
    artifacts,
    duration,
    metadata: {
      processId: 'domains/science/industrial-engineering/standard-work-development',
      timestamp: startTime,
      processName,
      workArea,
      outputDir
    }
  };
}

// Task 1: Process Observation
export const processObservationTask = defineTask('process-observation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Observe and time operators',
  agent: {
    name: 'work-study-analyst',
    prompt: {
      role: 'Work Study Analyst',
      task: 'Observe and time multiple operators performing the work',
      context: args,
      instructions: [
        '1. Observe multiple operators (minimum 3)',
        '2. Break work into discrete elements',
        '3. Time each element multiple cycles',
        '4. Note variations in methods',
        '5. Identify best practices observed',
        '6. Note safety concerns',
        '7. Document quality checkpoints',
        '8. Create observation forms'
      ],
      outputFormat: 'JSON with observation data and timing'
    },
    outputSchema: {
      type: 'object',
      required: ['observations', 'timingData', 'methodVariations', 'artifacts'],
      properties: {
        observations: { type: 'array' },
        timingData: { type: 'object' },
        methodVariations: { type: 'array' },
        bestPracticesObserved: { type: 'array' },
        safetyConcerns: { type: 'array' },
        qualityCheckpoints: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'standard-work', 'observation']
}));

// Task 2: Time Study Analysis
export const timeStudyAnalysisTask = defineTask('time-study-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze time study data',
  agent: {
    name: 'time-study-analyst',
    prompt: {
      role: 'Time Study Engineer',
      task: 'Analyze time study data and calculate element times',
      context: args,
      instructions: [
        '1. Calculate average element times',
        '2. Identify normal time for each element',
        '3. Apply performance rating',
        '4. Add appropriate allowances',
        '5. Calculate standard time',
        '6. Analyze variation between operators',
        '7. Identify bottleneck elements',
        '8. Compare to takt time'
      ],
      outputFormat: 'JSON with time study analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['workElements', 'cycleTime', 'variationAnalysis', 'artifacts'],
      properties: {
        workElements: { type: 'array' },
        elementTimes: { type: 'object' },
        cycleTime: { type: 'number' },
        standardTime: { type: 'number' },
        variationAnalysis: { type: 'object' },
        performanceRatings: { type: 'object' },
        allowances: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'standard-work', 'time-study']
}));

// Task 3: Best Method Identification
export const bestMethodTask = defineTask('best-method-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify best method',
  agent: {
    name: 'methods-engineer',
    prompt: {
      role: 'Methods Engineer',
      task: 'Identify the safest, highest quality, most efficient method',
      context: args,
      instructions: [
        '1. Compare methods across operators',
        '2. Evaluate safety of each method',
        '3. Evaluate quality outcomes',
        '4. Evaluate efficiency',
        '5. Combine best elements from each operator',
        '6. Test proposed best method',
        '7. Validate with experienced operators',
        '8. Document best method rationale'
      ],
      outputFormat: 'JSON with best method documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['bestMethod', 'methodElements', 'safetyFeatures', 'artifacts'],
      properties: {
        bestMethod: { type: 'object' },
        methodElements: { type: 'array' },
        safetyFeatures: { type: 'array' },
        qualityCheckpoints: { type: 'array' },
        efficiencyFeatures: { type: 'array' },
        validationResults: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'standard-work', 'best-method']
}));

// Task 4: Combination Sheet
export const combinationSheetTask = defineTask('combination-sheet', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create standard work combination sheet',
  agent: {
    name: 'combination-sheet-creator',
    prompt: {
      role: 'Standard Work Specialist',
      task: 'Create standard work combination sheet',
      context: args,
      instructions: [
        '1. List all work elements in sequence',
        '2. Document manual work time',
        '3. Document machine/auto time',
        '4. Document walking/movement time',
        '5. Create time bar chart',
        '6. Show takt time line',
        '7. Identify waiting time',
        '8. Format combination sheet'
      ],
      outputFormat: 'JSON with combination sheet data'
    },
    outputSchema: {
      type: 'object',
      required: ['sheetData', 'sheetPath', 'totalCycleTime', 'artifacts'],
      properties: {
        sheetData: { type: 'object' },
        sheetPath: { type: 'string' },
        totalCycleTime: { type: 'number' },
        manualTime: { type: 'number' },
        autoTime: { type: 'number' },
        walkTime: { type: 'number' },
        waitTime: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'standard-work', 'combination-sheet']
}));

// Task 5: Layout Diagram
export const layoutDiagramTask = defineTask('layout-diagram', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create standard work layout diagram',
  agent: {
    name: 'layout-designer',
    prompt: {
      role: 'Workplace Layout Designer',
      task: 'Create standard work layout showing operator movement',
      context: args,
      instructions: [
        '1. Draw workstation layout to scale',
        '2. Show machine/equipment positions',
        '3. Show parts/material locations',
        '4. Draw operator path (spaghetti diagram)',
        '5. Mark quality check points',
        '6. Mark safety points',
        '7. Show standard WIP locations',
        '8. Add legend and annotations'
      ],
      outputFormat: 'JSON with layout diagram data'
    },
    outputSchema: {
      type: 'object',
      required: ['layoutData', 'diagramPath', 'walkingDistance', 'artifacts'],
      properties: {
        layoutData: { type: 'object' },
        diagramPath: { type: 'string' },
        walkingDistance: { type: 'number' },
        qualityCheckPoints: { type: 'array' },
        safetyPoints: { type: 'array' },
        wipLocations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'standard-work', 'layout']
}));

// Task 6: Job Instruction
export const jobInstructionTask = defineTask('job-instruction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create job instruction breakdown sheets',
  agent: {
    name: 'job-instruction-writer',
    prompt: {
      role: 'Training Development Specialist',
      task: 'Create TWI-style job instruction breakdown sheets',
      context: args,
      instructions: [
        '1. List important steps (WHAT)',
        '2. Document key points (HOW)',
        '3. Explain reasons (WHY)',
        '4. Include safety key points',
        '5. Include quality key points',
        '6. Add visual references',
        '7. Create one-point lessons for critical elements',
        '8. Format for easy trainer use'
      ],
      outputFormat: 'JSON with job instruction sheets'
    },
    outputSchema: {
      type: 'object',
      required: ['instructions', 'instructionCount', 'artifacts'],
      properties: {
        instructions: { type: 'array' },
        instructionCount: { type: 'number' },
        onePointLessons: { type: 'array' },
        visualReferences: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'standard-work', 'job-instruction']
}));

// Task 7: Training Materials
export const trainingMaterialsTask = defineTask('training-materials', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop training materials',
  agent: {
    name: 'training-developer',
    prompt: {
      role: 'Training Development Specialist',
      task: 'Develop comprehensive training materials',
      context: args,
      instructions: [
        '1. Create training plan/curriculum',
        '2. Develop visual training aids',
        '3. Create practice exercises',
        '4. Develop assessment questions',
        '5. Create trainer guide',
        '6. Plan hands-on practice sessions',
        '7. Create quick reference cards',
        '8. Document training delivery method'
      ],
      outputFormat: 'JSON with training materials'
    },
    outputSchema: {
      type: 'object',
      required: ['materials', 'moduleCount', 'trainingPlan', 'artifacts'],
      properties: {
        materials: { type: 'array' },
        moduleCount: { type: 'number' },
        trainingPlan: { type: 'object' },
        trainerGuide: { type: 'object' },
        assessments: { type: 'array' },
        quickReferenceCards: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'standard-work', 'training']
}));

// Task 8: Competency System
export const competencySystemTask = defineTask('competency-system', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create competency verification system',
  agent: {
    name: 'competency-developer',
    prompt: {
      role: 'Competency Assessment Specialist',
      task: 'Create system to verify operator competency',
      context: args,
      instructions: [
        '1. Define competency levels',
        '2. Create skills matrix',
        '3. Develop practical assessment criteria',
        '4. Create verification checklist',
        '5. Define certification requirements',
        '6. Plan recertification frequency',
        '7. Create competency tracking system',
        '8. Document sign-off process'
      ],
      outputFormat: 'JSON with competency system'
    },
    outputSchema: {
      type: 'object',
      required: ['system', 'skillsMatrix', 'assessmentCriteria', 'artifacts'],
      properties: {
        system: { type: 'object' },
        competencyLevels: { type: 'array' },
        skillsMatrix: { type: 'object' },
        assessmentCriteria: { type: 'array' },
        certificationRequirements: { type: 'object' },
        trackingSystem: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'standard-work', 'competency']
}));

// Task 9: Audit System
export const auditSystemTask = defineTask('audit-system', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create audit system',
  agent: {
    name: 'audit-system-designer',
    prompt: {
      role: 'Process Audit Specialist',
      task: 'Create standard work audit system',
      context: args,
      instructions: [
        '1. Create audit checklist aligned to standard',
        '2. Define audit frequency',
        '3. Define auditor qualifications',
        '4. Create scoring/rating system',
        '5. Define corrective action process',
        '6. Create audit schedule',
        '7. Design audit reporting format',
        '8. Plan management review process'
      ],
      outputFormat: 'JSON with audit system'
    },
    outputSchema: {
      type: 'object',
      required: ['checklist', 'schedule', 'scoringSystem', 'artifacts'],
      properties: {
        checklist: { type: 'array' },
        schedule: { type: 'array' },
        scoringSystem: { type: 'object' },
        auditorRequirements: { type: 'array' },
        correctiveActionProcess: { type: 'object' },
        reportingFormat: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'standard-work', 'audit']
}));
