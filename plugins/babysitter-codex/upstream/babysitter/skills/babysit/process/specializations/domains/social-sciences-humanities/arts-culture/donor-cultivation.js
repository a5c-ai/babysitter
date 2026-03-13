/**
 * @process arts-culture/donor-cultivation
 * @description Systematic approach to identifying, cultivating, soliciting, and stewarding individual donors including major gift strategies and planned giving programs
 * @inputs { organizationName: string, donorSegment: string, campaignGoal: number, donorData: object }
 * @outputs { success: boolean, cultivationPlan: object, solicitationStrategy: object, stewardshipProgram: object, artifacts: array }
 * @recommendedSkills SK-AC-009 (donor-relationship-management), SK-AC-002 (grant-proposal-writing), SK-AC-013 (stakeholder-facilitation)
 * @recommendedAgents AG-AC-003 (development-officer-agent), AG-AC-002 (arts-administrator-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationName,
    donorSegment = 'major-gifts',
    campaignGoal = 1000000,
    donorData = {},
    fiscalYear = new Date().getFullYear(),
    outputDir = 'donor-cultivation-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Donor Prospect Research
  ctx.log('info', 'Conducting donor prospect research and identification');
  const prospectResearch = await ctx.task(prospectResearchTask, {
    organizationName,
    donorSegment,
    campaignGoal,
    donorData,
    outputDir
  });

  if (!prospectResearch.success) {
    return {
      success: false,
      error: 'Prospect research failed',
      details: prospectResearch,
      metadata: { processId: 'arts-culture/donor-cultivation', timestamp: startTime }
    };
  }

  artifacts.push(...prospectResearch.artifacts);

  // Task 2: Donor Segmentation and Qualification
  ctx.log('info', 'Segmenting and qualifying donor prospects');
  const donorSegmentation = await ctx.task(donorSegmentationTask, {
    prospects: prospectResearch.prospects,
    campaignGoal,
    organizationName,
    outputDir
  });

  artifacts.push(...donorSegmentation.artifacts);

  // Task 3: Cultivation Strategy Development
  ctx.log('info', 'Developing cultivation strategies');
  const cultivationStrategy = await ctx.task(cultivationStrategyTask, {
    segmentedDonors: donorSegmentation.segments,
    organizationName,
    donorSegment,
    outputDir
  });

  artifacts.push(...cultivationStrategy.artifacts);

  // Task 4: Major Gift Strategy
  ctx.log('info', 'Creating major gift strategy');
  const majorGiftStrategy = await ctx.task(majorGiftStrategyTask, {
    majorDonorProspects: donorSegmentation.majorGiftProspects,
    campaignGoal,
    organizationName,
    outputDir
  });

  artifacts.push(...majorGiftStrategy.artifacts);

  // Task 5: Planned Giving Program
  ctx.log('info', 'Developing planned giving program');
  const plannedGiving = await ctx.task(plannedGivingTask, {
    organizationName,
    donorData,
    outputDir
  });

  artifacts.push(...plannedGiving.artifacts);

  // Task 6: Solicitation Planning
  ctx.log('info', 'Planning solicitation approaches');
  const solicitationPlan = await ctx.task(solicitationPlanTask, {
    cultivationStrategy: cultivationStrategy.strategies,
    majorGiftStrategy: majorGiftStrategy.approach,
    campaignGoal,
    outputDir
  });

  artifacts.push(...solicitationPlan.artifacts);

  // Breakpoint: Review fundraising strategy
  await ctx.breakpoint({
    question: `Donor cultivation strategy for ${organizationName} complete. Campaign goal: $${campaignGoal.toLocaleString()}. ${donorSegmentation.totalProspects} prospects identified. Review and approve?`,
    title: 'Donor Cultivation Strategy Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        organizationName,
        campaignGoal,
        totalProspects: donorSegmentation.totalProspects,
        majorGiftProspects: donorSegmentation.majorGiftProspects.length,
        estimatedPotential: donorSegmentation.estimatedPotential
      }
    }
  });

  // Task 7: Stewardship Program Design
  ctx.log('info', 'Designing donor stewardship program');
  const stewardshipProgram = await ctx.task(stewardshipProgramTask, {
    organizationName,
    donorSegments: donorSegmentation.segments,
    outputDir
  });

  artifacts.push(...stewardshipProgram.artifacts);

  // Task 8: Recognition Program
  ctx.log('info', 'Creating donor recognition program');
  const recognitionProgram = await ctx.task(recognitionProgramTask, {
    organizationName,
    donorSegments: donorSegmentation.segments,
    campaignGoal,
    outputDir
  });

  artifacts.push(...recognitionProgram.artifacts);

  // Task 9: Generate Development Plan Document
  ctx.log('info', 'Generating comprehensive development plan');
  const developmentPlan = await ctx.task(developmentPlanDocumentTask, {
    organizationName,
    fiscalYear,
    prospectResearch,
    donorSegmentation,
    cultivationStrategy,
    majorGiftStrategy,
    plannedGiving,
    solicitationPlan,
    stewardshipProgram,
    recognitionProgram,
    outputDir
  });

  artifacts.push(...developmentPlan.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    cultivationPlan: {
      prospects: donorSegmentation.segments,
      strategies: cultivationStrategy.strategies,
      timeline: cultivationStrategy.timeline
    },
    solicitationStrategy: {
      approach: solicitationPlan.approach,
      askAmounts: solicitationPlan.askAmounts,
      timeline: solicitationPlan.timeline
    },
    majorGifts: {
      strategy: majorGiftStrategy.approach,
      topProspects: majorGiftStrategy.topProspects,
      pipeline: majorGiftStrategy.pipeline
    },
    plannedGiving: {
      program: plannedGiving.program,
      vehicles: plannedGiving.vehicles,
      prospects: plannedGiving.prospects
    },
    stewardshipProgram: {
      levels: stewardshipProgram.levels,
      activities: stewardshipProgram.activities,
      calendar: stewardshipProgram.calendar
    },
    recognition: recognitionProgram.program,
    artifacts,
    duration,
    metadata: {
      processId: 'arts-culture/donor-cultivation',
      timestamp: startTime,
      organizationName,
      campaignGoal
    }
  };
}

// Task 1: Prospect Research
export const prospectResearchTask = defineTask('prospect-research', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct prospect research',
  agent: {
    name: 'prospect-researcher',
    prompt: {
      role: 'development prospect researcher',
      task: 'Research and identify donor prospects for cultural organization',
      context: args,
      instructions: [
        'Review current donor database for upgrade potential',
        'Research wealth indicators and giving capacity',
        'Identify affinity and connection to organization',
        'Assess giving history and philanthropic interests',
        'Research board and volunteer connections',
        'Identify corporate and foundation relationships',
        'Create prospect profiles with key information',
        'Prioritize prospects by capacity, affinity, and propensity'
      ],
      outputFormat: 'JSON with success, prospects, profiles, priorities, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'prospects', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        prospects: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              capacity: { type: 'string' },
              affinity: { type: 'string' },
              propensity: { type: 'string' },
              score: { type: 'number' }
            }
          }
        },
        profiles: { type: 'array' },
        priorities: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fundraising', 'prospect-research', 'development']
}));

// Task 2: Donor Segmentation
export const donorSegmentationTask = defineTask('donor-segmentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Segment donor prospects',
  agent: {
    name: 'donor-analyst',
    prompt: {
      role: 'donor segmentation analyst',
      task: 'Segment and qualify donor prospects by giving level and potential',
      context: args,
      instructions: [
        'Define giving level segments (major, mid-level, annual)',
        'Qualify prospects by capacity and readiness',
        'Identify major gift prospects ($10K+)',
        'Segment mid-level donors ($1K-$10K)',
        'Identify planned giving prospects',
        'Calculate estimated giving potential',
        'Create donor pyramid visualization',
        'Assign prospect managers and moves'
      ],
      outputFormat: 'JSON with segments, majorGiftProspects, estimatedPotential, totalProspects, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['segments', 'majorGiftProspects', 'artifacts'],
      properties: {
        segments: { type: 'array' },
        majorGiftProspects: { type: 'array' },
        midLevelProspects: { type: 'array' },
        plannedGivingProspects: { type: 'array' },
        totalProspects: { type: 'number' },
        estimatedPotential: { type: 'number' },
        donorPyramid: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fundraising', 'segmentation', 'analysis']
}));

// Task 3: Cultivation Strategy
export const cultivationStrategyTask = defineTask('cultivation-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop cultivation strategies',
  agent: {
    name: 'cultivation-strategist',
    prompt: {
      role: 'donor cultivation specialist',
      task: 'Develop personalized cultivation strategies for donor segments',
      context: args,
      instructions: [
        'Design cultivation moves for each segment',
        'Create touchpoint calendar and timeline',
        'Plan engagement activities (tours, events, meetings)',
        'Develop personalized communication strategies',
        'Design involvement opportunities (committees, councils)',
        'Plan relationship-building activities',
        'Create moves management tracking approach',
        'Establish cultivation milestones and metrics'
      ],
      outputFormat: 'JSON with strategies, timeline, moves, activities, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'artifacts'],
      properties: {
        strategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segment: { type: 'string' },
              moves: { type: 'array' },
              touchpoints: { type: 'array' },
              timeline: { type: 'object' }
            }
          }
        },
        timeline: { type: 'object' },
        activities: { type: 'array' },
        metrics: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fundraising', 'cultivation', 'strategy']
}));

// Task 4: Major Gift Strategy
export const majorGiftStrategyTask = defineTask('major-gift-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create major gift strategy',
  agent: {
    name: 'major-gift-officer',
    prompt: {
      role: 'major gifts officer',
      task: 'Develop comprehensive major gift fundraising strategy',
      context: args,
      instructions: [
        'Define major gift threshold and levels',
        'Create individualized strategies for top prospects',
        'Design gift opportunities and naming rights',
        'Plan principal gift cultivation ($100K+)',
        'Develop board member giving strategy',
        'Create case for support messaging',
        'Plan solicitation teams and volunteer involvement',
        'Develop major gift pipeline projections'
      ],
      outputFormat: 'JSON with approach, topProspects, pipeline, giftOpportunities, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['approach', 'topProspects', 'artifacts'],
      properties: {
        approach: {
          type: 'object',
          properties: {
            threshold: { type: 'number' },
            levels: { type: 'array' },
            process: { type: 'object' }
          }
        },
        topProspects: { type: 'array' },
        pipeline: {
          type: 'object',
          properties: {
            identification: { type: 'number' },
            cultivation: { type: 'number' },
            solicitation: { type: 'number' },
            stewardship: { type: 'number' }
          }
        },
        giftOpportunities: { type: 'array' },
        namingRights: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fundraising', 'major-gifts', 'strategy']
}));

// Task 5: Planned Giving Program
export const plannedGivingTask = defineTask('planned-giving', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop planned giving program',
  agent: {
    name: 'planned-giving-specialist',
    prompt: {
      role: 'planned giving specialist',
      task: 'Design comprehensive planned giving program for cultural organization',
      context: args,
      instructions: [
        'Define planned giving vehicles to offer',
        'Create legacy society structure and benefits',
        'Develop bequest marketing materials',
        'Design donor education program on planned giving',
        'Create planned giving prospect identification criteria',
        'Develop gift acceptance policies',
        'Plan stewardship for planned giving donors',
        'Create planned giving marketing calendar'
      ],
      outputFormat: 'JSON with program, vehicles, legacySociety, prospects, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['program', 'vehicles', 'artifacts'],
      properties: {
        program: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            structure: { type: 'object' },
            benefits: { type: 'array' }
          }
        },
        vehicles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              description: { type: 'string' },
              minimumGift: { type: 'number' }
            }
          }
        },
        legacySociety: { type: 'object' },
        prospects: { type: 'array' },
        marketingPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fundraising', 'planned-giving', 'legacy']
}));

// Task 6: Solicitation Planning
export const solicitationPlanTask = defineTask('solicitation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan solicitation approaches',
  agent: {
    name: 'solicitation-strategist',
    prompt: {
      role: 'fundraising solicitation specialist',
      task: 'Plan effective solicitation strategies and approaches',
      context: args,
      instructions: [
        'Determine appropriate ask amounts by prospect',
        'Design solicitation approaches by segment',
        'Plan face-to-face solicitation meetings',
        'Create proposal templates for major gifts',
        'Develop written solicitation materials',
        'Plan volunteer solicitor training and involvement',
        'Create objection handling guidelines',
        'Develop follow-up and negotiation strategies'
      ],
      outputFormat: 'JSON with approach, askAmounts, timeline, proposals, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['approach', 'askAmounts', 'artifacts'],
      properties: {
        approach: {
          type: 'object',
          properties: {
            faceToFace: { type: 'object' },
            written: { type: 'object' },
            phone: { type: 'object' }
          }
        },
        askAmounts: { type: 'array' },
        timeline: { type: 'object' },
        proposals: { type: 'array' },
        training: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fundraising', 'solicitation', 'planning']
}));

// Task 7: Stewardship Program
export const stewardshipProgramTask = defineTask('stewardship-program', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design stewardship program',
  agent: {
    name: 'stewardship-manager',
    prompt: {
      role: 'donor stewardship manager',
      task: 'Design comprehensive donor stewardship program',
      context: args,
      instructions: [
        'Define stewardship levels by giving amount',
        'Create thank you and acknowledgment protocols',
        'Design impact reporting for donors',
        'Plan donor communication calendar',
        'Create stewardship event programming',
        'Design behind-the-scenes access opportunities',
        'Develop donor anniversary and milestone recognition',
        'Create donor retention strategies'
      ],
      outputFormat: 'JSON with levels, activities, calendar, communications, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['levels', 'activities', 'artifacts'],
      properties: {
        levels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              threshold: { type: 'number' },
              benefits: { type: 'array' }
            }
          }
        },
        activities: { type: 'array' },
        calendar: { type: 'object' },
        communications: { type: 'object' },
        retention: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fundraising', 'stewardship', 'retention']
}));

// Task 8: Recognition Program
export const recognitionProgramTask = defineTask('recognition-program', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create recognition program',
  agent: {
    name: 'donor-recognition-specialist',
    prompt: {
      role: 'donor recognition specialist',
      task: 'Design donor recognition program and giving societies',
      context: args,
      instructions: [
        'Design giving society levels and names',
        'Create recognition benefits by level',
        'Plan donor wall and physical recognition',
        'Design digital recognition opportunities',
        'Create annual recognition events',
        'Develop publication recognition guidelines',
        'Design cumulative giving recognition',
        'Create special recognition for leadership donors'
      ],
      outputFormat: 'JSON with program, societies, benefits, events, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['program', 'artifacts'],
      properties: {
        program: {
          type: 'object',
          properties: {
            societies: { type: 'array' },
            levels: { type: 'array' },
            benefits: { type: 'object' }
          }
        },
        physicalRecognition: { type: 'object' },
        digitalRecognition: { type: 'object' },
        events: { type: 'array' },
        guidelines: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fundraising', 'recognition', 'societies']
}));

// Task 9: Development Plan Document
export const developmentPlanDocumentTask = defineTask('development-plan-document', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate development plan',
  agent: {
    name: 'development-plan-writer',
    prompt: {
      role: 'development planning writer',
      task: 'Compile comprehensive development and fundraising plan',
      context: args,
      instructions: [
        'Create executive summary of development strategy',
        'Document prospect research findings',
        'Present cultivation and solicitation strategies',
        'Include major gift and planned giving programs',
        'Document stewardship and recognition programs',
        'Create fundraising projections and goals',
        'Include implementation timeline',
        'Create board-ready presentation'
      ],
      outputFormat: 'JSON with documentPath, executiveSummary, projections, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentPath', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        projections: {
          type: 'object',
          properties: {
            year1: { type: 'number' },
            year2: { type: 'number' },
            year3: { type: 'number' }
          }
        },
        presentationPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fundraising', 'documentation', 'planning']
}));
