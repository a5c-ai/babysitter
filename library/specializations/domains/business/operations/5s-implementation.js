/**
 * @process specializations/domains/business/operations/5s-implementation
 * @description 5S Implementation Process - Implement Sort, Set in Order, Shine, Standardize, Sustain workplace organization
 * methodology with audit checklists and sustainability mechanisms for operational excellence.
 * @inputs { workArea: string, teamMembers?: array, includeAudit?: boolean, targetScore?: number }
 * @outputs { success: boolean, implementationResults: object, auditScore: number, sustainabilityPlan: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/operations/5s-implementation', {
 *   workArea: 'Assembly Line 1',
 *   teamMembers: ['supervisor', 'operators', 'maintenance'],
 *   includeAudit: true,
 *   targetScore: 85
 * });
 *
 * @references
 * - Hirano, H. (1995). 5 Pillars of the Visual Workplace
 * - Osada, T. (1991). The 5S's: Five Keys to a Total Quality Environment
 * - Liker, J. (2004). The Toyota Way
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    workArea,
    teamMembers = [],
    includeAudit = true,
    targetScore = 80,
    currentMaturityLevel = null,
    outputDir = '5s-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting 5S Implementation for work area: ${workArea}`);

  // Phase 1: Assessment and Planning
  ctx.log('info', 'Phase 1: Current State Assessment and Planning');
  const assessment = await ctx.task(currentStateAssessmentTask, {
    workArea,
    teamMembers,
    currentMaturityLevel,
    outputDir
  });

  artifacts.push(...assessment.artifacts);

  // Quality Gate: Assessment Review
  await ctx.breakpoint({
    question: `5S assessment complete for ${workArea}. Current score: ${assessment.currentScore}/100. Major issues: ${assessment.majorIssues.length}. Proceed with 5S implementation?`,
    title: '5S Current State Assessment',
    context: {
      runId: ctx.runId,
      workArea,
      currentScore: assessment.currentScore,
      majorIssues: assessment.majorIssues,
      files: assessment.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 2: Sort (Seiri)
  ctx.log('info', 'Phase 2: Sort (Seiri) - Separate needed from unneeded items');
  const sortPhase = await ctx.task(sortImplementationTask, {
    workArea,
    assessment,
    outputDir
  });

  artifacts.push(...sortPhase.artifacts);

  // Phase 3: Set in Order (Seiton)
  ctx.log('info', 'Phase 3: Set in Order (Seiton) - A place for everything');
  const setInOrderPhase = await ctx.task(setInOrderImplementationTask, {
    workArea,
    sortPhase,
    outputDir
  });

  artifacts.push(...setInOrderPhase.artifacts);

  // Phase 4: Shine (Seiso)
  ctx.log('info', 'Phase 4: Shine (Seiso) - Clean and inspect');
  const shinePhase = await ctx.task(shineImplementationTask, {
    workArea,
    setInOrderPhase,
    outputDir
  });

  artifacts.push(...shinePhase.artifacts);

  // Quality Gate: 3S Implementation Review
  await ctx.breakpoint({
    question: `First 3S complete. Sort: ${sortPhase.itemsRemoved} items removed. Set in Order: ${setInOrderPhase.locationsLabeled} locations labeled. Shine: ${shinePhase.cleaningStandards.length} standards established. Proceed with standardization?`,
    title: '3S Implementation Review',
    context: {
      runId: ctx.runId,
      workArea,
      sortResults: sortPhase.summary,
      setInOrderResults: setInOrderPhase.summary,
      shineResults: shinePhase.summary,
      files: [...sortPhase.artifacts, ...setInOrderPhase.artifacts, ...shinePhase.artifacts].map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 5: Standardize (Seiketsu)
  ctx.log('info', 'Phase 5: Standardize (Seiketsu) - Create standards and visual controls');
  const standardizePhase = await ctx.task(standardizeImplementationTask, {
    workArea,
    sortPhase,
    setInOrderPhase,
    shinePhase,
    outputDir
  });

  artifacts.push(...standardizePhase.artifacts);

  // Phase 6: Sustain (Shitsuke)
  ctx.log('info', 'Phase 6: Sustain (Shitsuke) - Maintain discipline and continuous improvement');
  const sustainPhase = await ctx.task(sustainImplementationTask, {
    workArea,
    standardizePhase,
    targetScore,
    outputDir
  });

  artifacts.push(...sustainPhase.artifacts);

  // Phase 7: Audit (if requested)
  let auditResults = null;
  if (includeAudit) {
    ctx.log('info', 'Phase 7: Conducting 5S Audit');
    auditResults = await ctx.task(auditTask, {
      workArea,
      sortPhase,
      setInOrderPhase,
      shinePhase,
      standardizePhase,
      sustainPhase,
      targetScore,
      outputDir
    });

    artifacts.push(...auditResults.artifacts);
  }

  // Phase 8: Generate Implementation Report
  ctx.log('info', 'Phase 8: Generating 5S Implementation Report');
  const report = await ctx.task(reportGenerationTask, {
    workArea,
    assessment,
    sortPhase,
    setInOrderPhase,
    shinePhase,
    standardizePhase,
    sustainPhase,
    auditResults,
    outputDir
  });

  artifacts.push(...report.artifacts);

  // Final Quality Gate
  await ctx.breakpoint({
    question: `5S implementation complete for ${workArea}. ${auditResults ? `Audit score: ${auditResults.totalScore}/${targetScore} target.` : ''} ${auditResults && auditResults.totalScore >= targetScore ? 'Target achieved!' : 'Target not yet achieved.'} Review final results?`,
    title: '5S Implementation Complete',
    context: {
      runId: ctx.runId,
      workArea,
      implementationSummary: {
        itemsRemoved: sortPhase.itemsRemoved,
        locationsOrganized: setInOrderPhase.locationsLabeled,
        standardsCreated: standardizePhase.standardsCreated,
        auditScore: auditResults?.totalScore
      },
      files: report.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    workArea,
    implementationResults: {
      sort: {
        itemsRemoved: sortPhase.itemsRemoved,
        redTagItems: sortPhase.redTagItems,
        spaceRecovered: sortPhase.spaceRecovered
      },
      setInOrder: {
        locationsLabeled: setInOrderPhase.locationsLabeled,
        visualControls: setInOrderPhase.visualControls,
        shadowBoards: setInOrderPhase.shadowBoards
      },
      shine: {
        cleaningStandards: shinePhase.cleaningStandards.length,
        inspectionPoints: shinePhase.inspectionPoints,
        maintenanceItems: shinePhase.maintenanceItems
      },
      standardize: {
        standardsCreated: standardizePhase.standardsCreated,
        checklistsImplemented: standardizePhase.checklistsImplemented,
        visualManagement: standardizePhase.visualManagement
      },
      sustain: {
        auditSchedule: sustainPhase.auditSchedule,
        trainingPlan: sustainPhase.trainingPlan,
        recognitionProgram: sustainPhase.recognitionProgram
      }
    },
    auditScore: auditResults?.totalScore || null,
    targetScore,
    targetAchieved: auditResults ? auditResults.totalScore >= targetScore : null,
    sustainabilityPlan: sustainPhase.sustainabilityPlan,
    artifacts,
    reportPath: report.reportPath,
    duration,
    metadata: {
      processId: 'specializations/domains/business/operations/5s-implementation',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Current State Assessment
export const currentStateAssessmentTask = defineTask('5s-current-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `5S Current State Assessment - ${args.workArea}`,
  agent: {
    name: 'lean-assessor',
    prompt: {
      role: '5S Assessment Specialist',
      task: 'Assess current state of workplace organization',
      context: args,
      instructions: [
        '1. Tour work area and document current conditions',
        '2. Take photos of current state (before pictures)',
        '3. Assess each S dimension (Sort, Set in Order, Shine, Standardize, Sustain)',
        '4. Score current state (0-100 scale)',
        '5. Identify major issues and safety hazards',
        '6. Document clutter and unnecessary items',
        '7. Assess current visual management',
        '8. Review existing standards and procedures',
        '9. Identify quick wins and priorities',
        '10. Create assessment report'
      ],
      outputFormat: 'JSON with assessment results'
    },
    outputSchema: {
      type: 'object',
      required: ['currentScore', 'scoreBreakdown', 'majorIssues', 'artifacts'],
      properties: {
        currentScore: { type: 'number' },
        scoreBreakdown: {
          type: 'object',
          properties: {
            sort: { type: 'number' },
            setInOrder: { type: 'number' },
            shine: { type: 'number' },
            standardize: { type: 'number' },
            sustain: { type: 'number' }
          }
        },
        majorIssues: { type: 'array', items: { type: 'string' } },
        safetyHazards: { type: 'array', items: { type: 'string' } },
        quickWins: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', '5s', 'assessment']
}));

// Task 2: Sort (Seiri) Implementation
export const sortImplementationTask = defineTask('5s-sort', (args, taskCtx) => ({
  kind: 'agent',
  title: `5S Sort (Seiri) - ${args.workArea}`,
  agent: {
    name: 'sort-facilitator',
    prompt: {
      role: '5S Sort Facilitator',
      task: 'Implement Sort phase - separate needed from unneeded items',
      context: args,
      instructions: [
        '1. Define sorting criteria (frequency of use)',
        '2. Conduct red tag campaign for unneeded items',
        '3. Create red tag holding area',
        '4. Categorize items: keep, relocate, dispose, recycle',
        '5. Document all removed items',
        '6. Calculate space recovered',
        '7. Establish disposition timelines',
        '8. Create inventory of remaining items',
        '9. Set rules for future item additions',
        '10. Document Sort phase results'
      ],
      outputFormat: 'JSON with sort results'
    },
    outputSchema: {
      type: 'object',
      required: ['itemsRemoved', 'redTagItems', 'spaceRecovered', 'summary', 'artifacts'],
      properties: {
        itemsRemoved: { type: 'number' },
        redTagItems: { type: 'array', items: { type: 'object' } },
        spaceRecovered: { type: 'string', description: 'e.g., "50 sq ft"' },
        itemsRelocated: { type: 'number' },
        itemsDisposed: { type: 'number' },
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', '5s', 'sort']
}));

// Task 3: Set in Order (Seiton) Implementation
export const setInOrderImplementationTask = defineTask('5s-set-in-order', (args, taskCtx) => ({
  kind: 'agent',
  title: `5S Set in Order (Seiton) - ${args.workArea}`,
  agent: {
    name: 'organization-specialist',
    prompt: {
      role: '5S Organization Specialist',
      task: 'Implement Set in Order phase - a place for everything',
      context: args,
      instructions: [
        '1. Analyze workflow and frequency of use',
        '2. Design optimal layout for efficiency',
        '3. Create designated locations for all items',
        '4. Implement labeling system',
        '5. Create shadow boards for tools',
        '6. Install floor markings and borders',
        '7. Implement visual inventory controls',
        '8. Create address system for locations',
        '9. Establish min/max levels for supplies',
        '10. Document Set in Order results'
      ],
      outputFormat: 'JSON with set in order results'
    },
    outputSchema: {
      type: 'object',
      required: ['locationsLabeled', 'visualControls', 'shadowBoards', 'summary', 'artifacts'],
      properties: {
        locationsLabeled: { type: 'number' },
        visualControls: { type: 'number' },
        shadowBoards: { type: 'number' },
        floorMarkings: { type: 'number' },
        addressSystem: { type: 'object' },
        layoutOptimized: { type: 'boolean' },
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', '5s', 'set-in-order']
}));

// Task 4: Shine (Seiso) Implementation
export const shineImplementationTask = defineTask('5s-shine', (args, taskCtx) => ({
  kind: 'agent',
  title: `5S Shine (Seiso) - ${args.workArea}`,
  agent: {
    name: 'cleaning-specialist',
    prompt: {
      role: '5S Shine Specialist',
      task: 'Implement Shine phase - clean and inspect',
      context: args,
      instructions: [
        '1. Conduct initial deep cleaning',
        '2. Identify cleaning requirements by zone',
        '3. Create cleaning schedules (daily, weekly, monthly)',
        '4. Define cleaning responsibilities',
        '5. Establish inspection points during cleaning',
        '6. Identify maintenance items needing attention',
        '7. Create cleaning supplies storage',
        '8. Document cleaning standards with photos',
        '9. Train team on cleaning procedures',
        '10. Integrate cleaning with autonomous maintenance'
      ],
      outputFormat: 'JSON with shine results'
    },
    outputSchema: {
      type: 'object',
      required: ['cleaningStandards', 'inspectionPoints', 'maintenanceItems', 'summary', 'artifacts'],
      properties: {
        cleaningStandards: { type: 'array', items: { type: 'object' } },
        inspectionPoints: { type: 'number' },
        maintenanceItems: { type: 'number' },
        cleaningSchedule: { type: 'object' },
        responsibilityMatrix: { type: 'object' },
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', '5s', 'shine']
}));

// Task 5: Standardize (Seiketsu) Implementation
export const standardizeImplementationTask = defineTask('5s-standardize', (args, taskCtx) => ({
  kind: 'agent',
  title: `5S Standardize (Seiketsu) - ${args.workArea}`,
  agent: {
    name: 'standards-developer',
    prompt: {
      role: '5S Standards Developer',
      task: 'Implement Standardize phase - create standards and visual controls',
      context: args,
      instructions: [
        '1. Create written standards for Sort, Set in Order, Shine',
        '2. Develop 5S checklists for daily/weekly audits',
        '3. Create visual management boards',
        '4. Establish color coding standards',
        '5. Create one-point lessons for procedures',
        '6. Develop training materials',
        '7. Create before/after photo standards',
        '8. Establish roles and responsibilities',
        '9. Create visual workplace guidelines',
        '10. Document all standards'
      ],
      outputFormat: 'JSON with standardize results'
    },
    outputSchema: {
      type: 'object',
      required: ['standardsCreated', 'checklistsImplemented', 'visualManagement', 'artifacts'],
      properties: {
        standardsCreated: { type: 'number' },
        checklistsImplemented: { type: 'number' },
        visualManagement: { type: 'number' },
        onePointLessons: { type: 'number' },
        colorCodingStandard: { type: 'object' },
        trainingMaterials: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', '5s', 'standardize']
}));

// Task 6: Sustain (Shitsuke) Implementation
export const sustainImplementationTask = defineTask('5s-sustain', (args, taskCtx) => ({
  kind: 'agent',
  title: `5S Sustain (Shitsuke) - ${args.workArea}`,
  agent: {
    name: 'sustainability-planner',
    prompt: {
      role: '5S Sustainability Planner',
      task: 'Implement Sustain phase - maintain discipline and improve',
      context: args,
      instructions: [
        '1. Create audit schedule (weekly, monthly)',
        '2. Develop audit scoring system',
        '3. Establish management review process',
        '4. Create recognition and reward program',
        '5. Plan ongoing training and refresher sessions',
        '6. Set improvement targets',
        '7. Create escalation process for issues',
        '8. Establish communication rhythm',
        '9. Plan for expansion to other areas',
        '10. Document sustainability plan'
      ],
      outputFormat: 'JSON with sustain results'
    },
    outputSchema: {
      type: 'object',
      required: ['auditSchedule', 'trainingPlan', 'recognitionProgram', 'sustainabilityPlan', 'artifacts'],
      properties: {
        auditSchedule: { type: 'object' },
        trainingPlan: { type: 'object' },
        recognitionProgram: { type: 'object' },
        sustainabilityPlan: { type: 'object' },
        improvementTargets: { type: 'array', items: { type: 'object' } },
        managementReview: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', '5s', 'sustain']
}));

// Task 7: 5S Audit
export const auditTask = defineTask('5s-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: `5S Audit - ${args.workArea}`,
  agent: {
    name: 'auditor',
    prompt: {
      role: '5S Auditor',
      task: 'Conduct comprehensive 5S audit',
      context: args,
      instructions: [
        '1. Use standardized audit checklist',
        '2. Score each S dimension (0-20 points each)',
        '3. Document findings with photos',
        '4. Identify non-conformances',
        '5. Note best practices observed',
        '6. Compare to target score',
        '7. Identify areas for improvement',
        '8. Create corrective action recommendations',
        '9. Calculate overall score',
        '10. Generate audit report'
      ],
      outputFormat: 'JSON with audit results'
    },
    outputSchema: {
      type: 'object',
      required: ['totalScore', 'scoreBreakdown', 'findings', 'artifacts'],
      properties: {
        totalScore: { type: 'number' },
        scoreBreakdown: {
          type: 'object',
          properties: {
            sort: { type: 'number' },
            setInOrder: { type: 'number' },
            shine: { type: 'number' },
            standardize: { type: 'number' },
            sustain: { type: 'number' }
          }
        },
        findings: { type: 'array', items: { type: 'object' } },
        nonConformances: { type: 'array', items: { type: 'object' } },
        bestPractices: { type: 'array', items: { type: 'string' } },
        correctiveActions: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', '5s', 'audit']
}));

// Task 8: Report Generation
export const reportGenerationTask = defineTask('5s-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `5S Report - ${args.workArea}`,
  agent: {
    name: 'report-writer',
    prompt: {
      role: 'Technical Report Writer',
      task: 'Generate comprehensive 5S implementation report',
      context: args,
      instructions: [
        '1. Write executive summary',
        '2. Document before/after comparison',
        '3. Detail each S implementation results',
        '4. Include audit findings if applicable',
        '5. Present metrics and improvements',
        '6. Document lessons learned',
        '7. Include sustainability plan',
        '8. Add appendices with checklists and standards',
        '9. Include photos and visual evidence',
        '10. Format as professional report'
      ],
      outputFormat: 'JSON with report details'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyAchievements: { type: 'array', items: { type: 'string' } },
        lessonsLearned: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', '5s', 'reporting']
}));
