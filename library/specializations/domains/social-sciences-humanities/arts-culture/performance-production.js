/**
 * @process arts-culture/performance-production
 * @description End-to-end workflow for producing concerts, theatrical productions, and live events including pre-production planning, creative development, rehearsal management, technical production, and closing procedures
 * @inputs { productionTitle: string, productionType: string, venueInfo: object, performanceDates: array, budget: number }
 * @outputs { success: boolean, productionPlan: object, technicalRequirements: object, rehearsalSchedule: object, artifacts: array }
 * @recommendedSkills SK-AC-005 (production-coordination), SK-AC-011 (risk-mitigation-planning), SK-AC-013 (stakeholder-facilitation)
 * @recommendedAgents AG-AC-005 (production-manager-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    productionTitle,
    productionType = 'theatrical',
    venueInfo = {},
    performanceDates = [],
    budget = 50000,
    creativeTeam = [],
    outputDir = 'performance-production-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Pre-Production Planning
  ctx.log('info', 'Starting pre-production planning');
  const preProduction = await ctx.task(preProductionTask, {
    productionTitle,
    productionType,
    venueInfo,
    performanceDates,
    budget,
    outputDir
  });

  if (!preProduction.success) {
    return {
      success: false,
      error: 'Pre-production planning failed',
      details: preProduction,
      metadata: { processId: 'arts-culture/performance-production', timestamp: startTime }
    };
  }

  artifacts.push(...preProduction.artifacts);

  // Task 2: Creative Development
  ctx.log('info', 'Developing creative vision and design');
  const creativeDevelopment = await ctx.task(creativeDevelopmentTask, {
    productionTitle,
    productionType,
    preProductionPlan: preProduction.plan,
    creativeTeam,
    outputDir
  });

  artifacts.push(...creativeDevelopment.artifacts);

  // Task 3: Technical Production Planning
  ctx.log('info', 'Planning technical production requirements');
  const technicalPlanning = await ctx.task(technicalPlanningTask, {
    productionTitle,
    productionType,
    venueInfo,
    creativeDesign: creativeDevelopment.design,
    budget,
    outputDir
  });

  artifacts.push(...technicalPlanning.artifacts);

  // Task 4: Casting and Personnel
  ctx.log('info', 'Planning casting and personnel');
  const castingPersonnel = await ctx.task(castingPersonnelTask, {
    productionTitle,
    productionType,
    technicalRequirements: technicalPlanning.requirements,
    performanceDates,
    outputDir
  });

  artifacts.push(...castingPersonnel.artifacts);

  // Task 5: Rehearsal Management
  ctx.log('info', 'Developing rehearsal schedule and management plan');
  const rehearsalManagement = await ctx.task(rehearsalManagementTask, {
    productionTitle,
    performanceDates,
    castingPersonnel: castingPersonnel.personnel,
    venueInfo,
    outputDir
  });

  artifacts.push(...rehearsalManagement.artifacts);

  // Task 6: Production Budget and Timeline
  ctx.log('info', 'Finalizing production budget and timeline');
  const budgetTimeline = await ctx.task(productionBudgetTask, {
    productionTitle,
    preProduction,
    technicalPlanning,
    castingPersonnel,
    rehearsalManagement,
    budget,
    outputDir
  });

  artifacts.push(...budgetTimeline.artifacts);

  // Breakpoint: Review production plan
  await ctx.breakpoint({
    question: `Production plan for "${productionTitle}" complete. Budget: $${budget.toLocaleString()}. ${performanceDates.length} performance dates scheduled. Review and approve?`,
    title: 'Performance Production Plan Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        productionTitle,
        productionType,
        performanceCount: performanceDates.length,
        estimatedBudget: budgetTimeline.totalBudget,
        rehearsalWeeks: rehearsalManagement.rehearsalWeeks
      }
    }
  });

  // Task 7: Marketing and Promotion
  ctx.log('info', 'Developing marketing and promotional plan');
  const marketingPlan = await ctx.task(marketingPromotionTask, {
    productionTitle,
    productionType,
    performanceDates,
    venueInfo,
    creativeDevelopment,
    outputDir
  });

  artifacts.push(...marketingPlan.artifacts);

  // Task 8: Run of Show Planning
  ctx.log('info', 'Creating run of show documentation');
  const runOfShow = await ctx.task(runOfShowTask, {
    productionTitle,
    technicalPlanning,
    performanceDates,
    castingPersonnel,
    outputDir
  });

  artifacts.push(...runOfShow.artifacts);

  // Task 9: Closing and Wrap Procedures
  ctx.log('info', 'Planning closing and wrap procedures');
  const closingProcedures = await ctx.task(closingProceduresTask, {
    productionTitle,
    technicalPlanning,
    venueInfo,
    outputDir
  });

  artifacts.push(...closingProcedures.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    productionPlan: {
      title: productionTitle,
      type: productionType,
      preProduction: preProduction.plan,
      creative: creativeDevelopment.design,
      timeline: budgetTimeline.timeline
    },
    technicalRequirements: {
      lighting: technicalPlanning.requirements.lighting,
      sound: technicalPlanning.requirements.sound,
      scenic: technicalPlanning.requirements.scenic,
      equipment: technicalPlanning.equipment
    },
    rehearsalSchedule: {
      schedule: rehearsalManagement.schedule,
      rehearsalWeeks: rehearsalManagement.rehearsalWeeks,
      techWeek: rehearsalManagement.techWeek
    },
    personnel: castingPersonnel.personnel,
    budget: budgetTimeline,
    marketing: marketingPlan.plan,
    runOfShow: runOfShow.documentation,
    closing: closingProcedures.procedures,
    artifacts,
    duration,
    metadata: {
      processId: 'arts-culture/performance-production',
      timestamp: startTime,
      productionTitle
    }
  };
}

// Task 1: Pre-Production Planning
export const preProductionTask = defineTask('pre-production', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan pre-production',
  agent: {
    name: 'production-manager',
    prompt: {
      role: 'theatrical production manager',
      task: 'Develop comprehensive pre-production plan for performance',
      context: args,
      instructions: [
        'Analyze script or program requirements',
        'Assess venue capabilities and limitations',
        'Create production calendar and milestones',
        'Identify key production positions needed',
        'Establish production meeting schedule',
        'Define communication protocols',
        'Create document management system',
        'Establish safety and compliance requirements'
      ],
      outputFormat: 'JSON with success, plan, calendar, requirements, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'plan', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        plan: {
          type: 'object',
          properties: {
            overview: { type: 'string' },
            milestones: { type: 'array' },
            positions: { type: 'array' },
            meetings: { type: 'object' }
          }
        },
        calendar: { type: 'object' },
        requirements: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'production', 'pre-production', 'planning']
}));

// Task 2: Creative Development
export const creativeDevelopmentTask = defineTask('creative-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop creative vision',
  agent: {
    name: 'creative-director',
    prompt: {
      role: 'creative director',
      task: 'Develop creative vision and design concept for production',
      context: args,
      instructions: [
        'Articulate directorial vision and concept',
        'Develop scenic design approach',
        'Plan lighting design concept',
        'Design costume and makeup approach',
        'Develop sound design concept',
        'Plan projection or multimedia elements',
        'Create mood boards and visual references',
        'Document design timeline and deliverables'
      ],
      outputFormat: 'JSON with design, concepts, moodBoards, timeline, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'artifacts'],
      properties: {
        design: {
          type: 'object',
          properties: {
            directorialVision: { type: 'string' },
            scenic: { type: 'object' },
            lighting: { type: 'object' },
            costume: { type: 'object' },
            sound: { type: 'object' }
          }
        },
        concepts: { type: 'array' },
        moodBoards: { type: 'array' },
        timeline: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'production', 'creative', 'design']
}));

// Task 3: Technical Production Planning
export const technicalPlanningTask = defineTask('technical-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan technical production',
  agent: {
    name: 'technical-director',
    prompt: {
      role: 'technical director',
      task: 'Plan technical production requirements and logistics',
      context: args,
      instructions: [
        'Develop technical requirements from designs',
        'Create lighting plot and equipment list',
        'Plan sound system and equipment needs',
        'Develop scenic construction and load-in plan',
        'Plan rigging and automation requirements',
        'Create prop and furniture requirements',
        'Develop special effects planning',
        'Establish technical rehearsal schedule'
      ],
      outputFormat: 'JSON with requirements, equipment, loadIn, techSchedule, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['requirements', 'artifacts'],
      properties: {
        requirements: {
          type: 'object',
          properties: {
            lighting: { type: 'object' },
            sound: { type: 'object' },
            scenic: { type: 'object' },
            rigging: { type: 'object' },
            props: { type: 'array' }
          }
        },
        equipment: { type: 'array' },
        loadInPlan: { type: 'object' },
        techSchedule: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'production', 'technical', 'planning']
}));

// Task 4: Casting and Personnel
export const castingPersonnelTask = defineTask('casting-personnel', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan casting and personnel',
  agent: {
    name: 'casting-director',
    prompt: {
      role: 'casting director and company manager',
      task: 'Plan casting process and production personnel needs',
      context: args,
      instructions: [
        'Define casting requirements and character breakdowns',
        'Plan audition process and timeline',
        'Identify production staff positions',
        'Plan crew hiring and scheduling',
        'Create personnel contracts and agreements',
        'Develop company policies and handbook',
        'Plan understudy and swing coverage',
        'Establish call times and reporting procedures'
      ],
      outputFormat: 'JSON with personnel, casting, crew, contracts, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['personnel', 'artifacts'],
      properties: {
        personnel: {
          type: 'object',
          properties: {
            cast: { type: 'array' },
            crew: { type: 'array' },
            production: { type: 'array' }
          }
        },
        casting: { type: 'object' },
        contracts: { type: 'array' },
        handbook: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'production', 'casting', 'personnel']
}));

// Task 5: Rehearsal Management
export const rehearsalManagementTask = defineTask('rehearsal-management', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan rehearsal management',
  agent: {
    name: 'stage-manager',
    prompt: {
      role: 'stage manager',
      task: 'Develop rehearsal schedule and management plan',
      context: args,
      instructions: [
        'Create master rehearsal schedule',
        'Plan table read and early rehearsals',
        'Schedule blocking and staging rehearsals',
        'Plan run-throughs and work calls',
        'Schedule technical rehearsals and dress rehearsals',
        'Create daily rehearsal reports template',
        'Plan costume fittings and build schedule',
        'Establish rehearsal room requirements'
      ],
      outputFormat: 'JSON with schedule, rehearsalWeeks, techWeek, reports, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['schedule', 'artifacts'],
      properties: {
        schedule: {
          type: 'object',
          properties: {
            overview: { type: 'array' },
            daily: { type: 'array' },
            conflicts: { type: 'array' }
          }
        },
        rehearsalWeeks: { type: 'number' },
        techWeek: { type: 'object' },
        reports: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'production', 'rehearsal', 'scheduling']
}));

// Task 6: Production Budget
export const productionBudgetTask = defineTask('production-budget', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop production budget',
  agent: {
    name: 'production-accountant',
    prompt: {
      role: 'production accountant',
      task: 'Develop comprehensive production budget and financial tracking',
      context: args,
      instructions: [
        'Create detailed line-item budget',
        'Estimate scenic and technical costs',
        'Budget for personnel and payroll',
        'Include marketing and promotional costs',
        'Plan for contingencies and overages',
        'Create cash flow projections',
        'Establish expense tracking procedures',
        'Create weekly cost reporting templates'
      ],
      outputFormat: 'JSON with totalBudget, breakdown, timeline, tracking, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalBudget', 'breakdown', 'artifacts'],
      properties: {
        totalBudget: { type: 'number' },
        breakdown: {
          type: 'object',
          properties: {
            scenic: { type: 'number' },
            costumes: { type: 'number' },
            lighting: { type: 'number' },
            sound: { type: 'number' },
            personnel: { type: 'number' },
            marketing: { type: 'number' },
            contingency: { type: 'number' }
          }
        },
        timeline: { type: 'object' },
        tracking: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'production', 'budget', 'finance']
}));

// Task 7: Marketing and Promotion
export const marketingPromotionTask = defineTask('marketing-promotion', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop marketing plan',
  agent: {
    name: 'marketing-manager',
    prompt: {
      role: 'arts marketing manager',
      task: 'Develop marketing and promotional plan for production',
      context: args,
      instructions: [
        'Create marketing timeline and milestones',
        'Develop key messaging and positioning',
        'Plan graphic design and collateral',
        'Develop digital marketing strategy',
        'Plan media relations and press',
        'Create social media content plan',
        'Plan opening night and special events',
        'Develop ticket sales projections and pricing'
      ],
      outputFormat: 'JSON with plan, messaging, timeline, projections, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'artifacts'],
      properties: {
        plan: {
          type: 'object',
          properties: {
            strategy: { type: 'string' },
            channels: { type: 'array' },
            timeline: { type: 'object' }
          }
        },
        messaging: { type: 'object' },
        collateral: { type: 'array' },
        projections: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'production', 'marketing', 'promotion']
}));

// Task 8: Run of Show
export const runOfShowTask = defineTask('run-of-show', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create run of show documentation',
  agent: {
    name: 'run-coordinator',
    prompt: {
      role: 'production coordinator',
      task: 'Create comprehensive run of show documentation',
      context: args,
      instructions: [
        'Create daily performance schedule',
        'Develop pre-show procedures and checklists',
        'Document intermission procedures',
        'Create post-show procedures',
        'Develop emergency procedures',
        'Create crew track sheets',
        'Document cue sheets and calling script',
        'Plan front-of-house coordination'
      ],
      outputFormat: 'JSON with documentation, schedules, procedures, checklists, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentation', 'artifacts'],
      properties: {
        documentation: {
          type: 'object',
          properties: {
            overview: { type: 'string' },
            preShow: { type: 'object' },
            intermission: { type: 'object' },
            postShow: { type: 'object' }
          }
        },
        schedules: { type: 'array' },
        procedures: { type: 'object' },
        checklists: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'production', 'run-of-show', 'operations']
}));

// Task 9: Closing Procedures
export const closingProceduresTask = defineTask('closing-procedures', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan closing procedures',
  agent: {
    name: 'closing-coordinator',
    prompt: {
      role: 'production closing coordinator',
      task: 'Plan closing and wrap procedures for production',
      context: args,
      instructions: [
        'Create load-out schedule and procedures',
        'Plan equipment return and rental closeout',
        'Develop costume and prop disposition plan',
        'Create scenic strike procedures',
        'Plan archive and documentation storage',
        'Develop final financial reconciliation',
        'Create production evaluation process',
        'Plan wrap party and closing events'
      ],
      outputFormat: 'JSON with procedures, schedule, disposition, evaluation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['procedures', 'artifacts'],
      properties: {
        procedures: {
          type: 'object',
          properties: {
            loadOut: { type: 'object' },
            returns: { type: 'array' },
            archive: { type: 'object' }
          }
        },
        schedule: { type: 'object' },
        disposition: { type: 'object' },
        evaluation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'production', 'closing', 'wrap']
}));
