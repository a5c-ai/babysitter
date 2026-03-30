/**
 * @process domains/science/industrial-engineering/five-s-implementation
 * @description 5S Workplace Organization Implementation - Implement 5S methodology (Sort, Set in Order, Shine,
 * Standardize, Sustain) to create organized, efficient, and safe work environments.
 * @inputs { targetArea: string, currentMaturity?: number, implementationScope?: string }
 * @outputs { success: boolean, maturityScore: number, implementedElements: array, auditSystem: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('domains/science/industrial-engineering/five-s-implementation', {
 *   targetArea: 'Machine Shop Area B',
 *   currentMaturity: 2,
 *   implementationScope: 'full'
 * });
 *
 * @references
 * - Hirano, 5 Pillars of the Visual Workplace
 * - Liker, The Toyota Way
 * - Peterson & Smith, The 5S Pocket Guide
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    targetArea,
    currentMaturity = 1,
    implementationScope = 'full',
    outputDir = 'five-s-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting 5S Workplace Organization Implementation process');

  // Task 1: Baseline Assessment
  ctx.log('info', 'Phase 1: Assessing current workplace organization maturity');
  const baselineAssessment = await ctx.task(baselineAssessmentTask, {
    targetArea,
    currentMaturity,
    outputDir
  });

  artifacts.push(...baselineAssessment.artifacts);

  // Breakpoint: Review baseline
  await ctx.breakpoint({
    question: `5S baseline assessment complete. Current score: ${baselineAssessment.totalScore}/50. Ready to begin Sort phase?`,
    title: '5S Baseline Assessment',
    context: {
      runId: ctx.runId,
      scores: baselineAssessment.categoryScores,
      totalScore: baselineAssessment.totalScore,
      files: baselineAssessment.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // Task 2: Sort (Seiri)
  ctx.log('info', 'Phase 2: Implementing Sort - Red Tag process');
  const sortPhase = await ctx.task(sortPhaseTask, {
    baselineAssessment,
    targetArea,
    outputDir
  });

  artifacts.push(...sortPhase.artifacts);

  // Task 3: Set in Order (Seiton)
  ctx.log('info', 'Phase 3: Implementing Set in Order - Organizing items');
  const setInOrderPhase = await ctx.task(setInOrderPhaseTask, {
    sortPhase,
    targetArea,
    outputDir
  });

  artifacts.push(...setInOrderPhase.artifacts);

  // Task 4: Shine (Seiso)
  ctx.log('info', 'Phase 4: Implementing Shine - Cleaning and inspection');
  const shinePhase = await ctx.task(shinePhaseTask, {
    setInOrderPhase,
    targetArea,
    outputDir
  });

  artifacts.push(...shinePhase.artifacts);

  // Task 5: Standardize (Seiketsu)
  ctx.log('info', 'Phase 5: Implementing Standardize - Creating standards');
  const standardizePhase = await ctx.task(standardizePhaseTask, {
    sortPhase,
    setInOrderPhase,
    shinePhase,
    targetArea,
    outputDir
  });

  artifacts.push(...standardizePhase.artifacts);

  // Task 6: Sustain (Shitsuke)
  ctx.log('info', 'Phase 6: Implementing Sustain - Audit and recognition');
  const sustainPhase = await ctx.task(sustainPhaseTask, {
    standardizePhase,
    targetArea,
    outputDir
  });

  artifacts.push(...sustainPhase.artifacts);

  // Task 7: Visual Management Standards
  ctx.log('info', 'Phase 7: Creating visual management standards');
  const visualManagement = await ctx.task(visualManagementTask, {
    setInOrderPhase,
    standardizePhase,
    outputDir
  });

  artifacts.push(...visualManagement.artifacts);

  // Task 8: Final Assessment and Report
  ctx.log('info', 'Phase 8: Conducting final assessment');
  const finalAssessment = await ctx.task(finalAssessmentTask, {
    baselineAssessment,
    sortPhase,
    setInOrderPhase,
    shinePhase,
    standardizePhase,
    sustainPhase,
    outputDir
  });

  artifacts.push(...finalAssessment.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `5S implementation complete. New score: ${finalAssessment.newScore}/50 (was ${baselineAssessment.totalScore}/50). Improvement: ${finalAssessment.improvementPercentage}%. Review results?`,
    title: '5S Implementation Results',
    context: {
      runId: ctx.runId,
      summary: {
        baselineScore: baselineAssessment.totalScore,
        newScore: finalAssessment.newScore,
        improvementPercentage: finalAssessment.improvementPercentage,
        redTagsProcessed: sortPhase.redTagCount,
        visualControlsCreated: visualManagement.controlsCreated
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    maturityScore: finalAssessment.newScore,
    implementedElements: {
      sort: sortPhase.improvements,
      setInOrder: setInOrderPhase.improvements,
      shine: shinePhase.improvements,
      standardize: standardizePhase.standards,
      sustain: sustainPhase.sustainmentElements
    },
    auditSystem: {
      auditForm: sustainPhase.auditForm,
      auditSchedule: sustainPhase.auditSchedule,
      scoringSystem: sustainPhase.scoringSystem
    },
    beforeAfterComparison: finalAssessment.comparison,
    artifacts,
    duration,
    metadata: {
      processId: 'domains/science/industrial-engineering/five-s-implementation',
      timestamp: startTime,
      targetArea,
      outputDir
    }
  };
}

// Task 1: Baseline Assessment
export const baselineAssessmentTask = defineTask('baseline-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess current 5S maturity',
  agent: {
    name: 'five-s-assessor',
    prompt: {
      role: '5S Assessment Specialist',
      task: 'Conduct baseline 5S assessment of target area',
      context: args,
      instructions: [
        '1. Score Sort (1-10): presence of unnecessary items',
        '2. Score Set in Order (1-10): organization and labeling',
        '3. Score Shine (1-10): cleanliness and inspection',
        '4. Score Standardize (1-10): procedures and visual standards',
        '5. Score Sustain (1-10): audit compliance and discipline',
        '6. Take baseline photos',
        '7. Document specific observations',
        '8. Create assessment scorecard'
      ],
      outputFormat: 'JSON with 5S assessment scores and observations'
    },
    outputSchema: {
      type: 'object',
      required: ['categoryScores', 'totalScore', 'observations', 'artifacts'],
      properties: {
        categoryScores: { type: 'object' },
        totalScore: { type: 'number' },
        observations: { type: 'array' },
        baselinePhotos: { type: 'array' },
        improvementOpportunities: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'five-s', 'assessment']
}));

// Task 2: Sort Phase
export const sortPhaseTask = defineTask('sort-phase', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Sort (Seiri)',
  agent: {
    name: 'sort-specialist',
    prompt: {
      role: 'Lean Organization Specialist',
      task: 'Implement Sort phase with red tag process',
      context: args,
      instructions: [
        '1. Define red tag criteria',
        '2. Create red tag forms',
        '3. Tag all unnecessary items',
        '4. Document red tagged items',
        '5. Establish red tag holding area',
        '6. Disposition red tagged items',
        '7. Track disposition results',
        '8. Document Sort improvements'
      ],
      outputFormat: 'JSON with red tag results and Sort improvements'
    },
    outputSchema: {
      type: 'object',
      required: ['redTagCount', 'dispositionResults', 'improvements', 'artifacts'],
      properties: {
        redTagCount: { type: 'number' },
        redTagLog: { type: 'array' },
        dispositionResults: { type: 'object' },
        spaceRecovered: { type: 'string' },
        improvements: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'five-s', 'sort']
}));

// Task 3: Set in Order Phase
export const setInOrderPhaseTask = defineTask('set-in-order-phase', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Set in Order (Seiton)',
  agent: {
    name: 'organization-specialist',
    prompt: {
      role: 'Workplace Organization Specialist',
      task: 'Implement Set in Order phase for efficient organization',
      context: args,
      instructions: [
        '1. Analyze frequency of use for items',
        '2. Design optimal storage locations',
        '3. Create location layout drawings',
        '4. Implement shadow boards for tools',
        '5. Create labeling standards',
        '6. Apply labels and markers',
        '7. Implement floor marking',
        '8. Document new organization system'
      ],
      outputFormat: 'JSON with organization improvements and layouts'
    },
    outputSchema: {
      type: 'object',
      required: ['layoutChanges', 'labelingSystem', 'improvements', 'artifacts'],
      properties: {
        layoutChanges: { type: 'array' },
        storageLocations: { type: 'object' },
        labelingSystem: { type: 'object' },
        floorMarking: { type: 'array' },
        shadowBoards: { type: 'array' },
        improvements: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'five-s', 'set-in-order']
}));

// Task 4: Shine Phase
export const shinePhaseTask = defineTask('shine-phase', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Shine (Seiso)',
  agent: {
    name: 'shine-coordinator',
    prompt: {
      role: 'Workplace Cleanliness Coordinator',
      task: 'Implement Shine phase with cleaning and inspection standards',
      context: args,
      instructions: [
        '1. Conduct initial deep cleaning',
        '2. Identify cleaning tasks by area',
        '3. Create cleaning checklists',
        '4. Define cleaning frequency',
        '5. Assign cleaning responsibilities',
        '6. Integrate inspection with cleaning',
        '7. Document abnormalities found',
        '8. Create shine schedules'
      ],
      outputFormat: 'JSON with cleaning standards and schedules'
    },
    outputSchema: {
      type: 'object',
      required: ['cleaningChecklist', 'inspectionStandards', 'improvements', 'artifacts'],
      properties: {
        cleaningChecklist: { type: 'array' },
        cleaningSchedule: { type: 'object' },
        inspectionStandards: { type: 'array' },
        abnormalitiesFound: { type: 'array' },
        improvements: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'five-s', 'shine']
}));

// Task 5: Standardize Phase
export const standardizePhaseTask = defineTask('standardize-phase', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Standardize (Seiketsu)',
  agent: {
    name: 'standards-developer',
    prompt: {
      role: 'Standards Development Specialist',
      task: 'Create standards to maintain first 3S achievements',
      context: args,
      instructions: [
        '1. Create visual 5S standards',
        '2. Develop 5S checklists',
        '3. Create before/after photo standards',
        '4. Develop color coding standards',
        '5. Create responsibility assignments',
        '6. Develop 5S zone maps',
        '7. Create visual control boards',
        '8. Document all standards'
      ],
      outputFormat: 'JSON with 5S standards documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['standards', 'checklists', 'visualControls', 'artifacts'],
      properties: {
        standards: { type: 'array' },
        checklists: { type: 'array' },
        colorCoding: { type: 'object' },
        zoneMap: { type: 'object' },
        visualControls: { type: 'array' },
        responsibilityMatrix: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'five-s', 'standardize']
}));

// Task 6: Sustain Phase
export const sustainPhaseTask = defineTask('sustain-phase', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Sustain (Shitsuke)',
  agent: {
    name: 'sustain-coordinator',
    prompt: {
      role: '5S Sustainment Coordinator',
      task: 'Create systems to sustain 5S achievements',
      context: args,
      instructions: [
        '1. Develop 5S audit form',
        '2. Create scoring system',
        '3. Establish audit schedule',
        '4. Train auditors',
        '5. Create escalation process',
        '6. Develop recognition program',
        '7. Plan management gemba walks',
        '8. Document sustainment system'
      ],
      outputFormat: 'JSON with sustainment system and audit materials'
    },
    outputSchema: {
      type: 'object',
      required: ['auditForm', 'auditSchedule', 'scoringSystem', 'sustainmentElements', 'artifacts'],
      properties: {
        auditForm: { type: 'object' },
        auditSchedule: { type: 'array' },
        scoringSystem: { type: 'object' },
        recognitionProgram: { type: 'object' },
        escalationProcess: { type: 'object' },
        sustainmentElements: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'five-s', 'sustain']
}));

// Task 7: Visual Management
export const visualManagementTask = defineTask('visual-management', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create visual management standards',
  agent: {
    name: 'visual-management-designer',
    prompt: {
      role: 'Visual Management Designer',
      task: 'Design and implement visual management system',
      context: args,
      instructions: [
        '1. Design visual workplace layout',
        '2. Create visual standards guide',
        '3. Design information boards',
        '4. Create status indicators',
        '5. Implement andon systems if needed',
        '6. Create visual work instructions',
        '7. Design floor marking standards',
        '8. Document visual management system'
      ],
      outputFormat: 'JSON with visual management standards'
    },
    outputSchema: {
      type: 'object',
      required: ['visualStandards', 'controlsCreated', 'artifacts'],
      properties: {
        visualStandards: { type: 'object' },
        controlsCreated: { type: 'number' },
        informationBoards: { type: 'array' },
        statusIndicators: { type: 'array' },
        floorMarkingStandards: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'five-s', 'visual-management']
}));

// Task 8: Final Assessment
export const finalAssessmentTask = defineTask('final-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct final 5S assessment',
  agent: {
    name: 'final-assessor',
    prompt: {
      role: '5S Assessment Specialist',
      task: 'Conduct final assessment and create comparison report',
      context: args,
      instructions: [
        '1. Re-score all 5S categories',
        '2. Take after photos',
        '3. Calculate improvement scores',
        '4. Create before/after comparison',
        '5. Document achievements',
        '6. Identify remaining opportunities',
        '7. Create final report',
        '8. Plan next improvement cycle'
      ],
      outputFormat: 'JSON with final assessment and comparison'
    },
    outputSchema: {
      type: 'object',
      required: ['newScore', 'improvementPercentage', 'comparison', 'artifacts'],
      properties: {
        newScore: { type: 'number' },
        newCategoryScores: { type: 'object' },
        improvementPercentage: { type: 'number' },
        comparison: { type: 'object' },
        afterPhotos: { type: 'array' },
        remainingOpportunities: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'five-s', 'final-assessment']
}));
