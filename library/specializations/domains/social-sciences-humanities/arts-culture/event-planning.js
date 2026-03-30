/**
 * @process arts-culture/event-planning
 * @description Comprehensive approach to planning cultural events including venue selection, vendor coordination, logistics management, risk assessment, and day-of execution
 * @inputs { eventName: string, eventType: string, expectedAttendance: number, eventDate: string, budget: number }
 * @outputs { success: boolean, eventPlan: object, logistics: object, riskAssessment: object, artifacts: array }
 * @recommendedSkills SK-AC-005 (production-coordination), SK-AC-011 (risk-mitigation-planning), SK-AC-013 (stakeholder-facilitation)
 * @recommendedAgents AG-AC-005 (production-manager-agent), AG-AC-008 (marketing-communications-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    eventName,
    eventType = 'gala',
    expectedAttendance = 200,
    eventDate,
    budget = 75000,
    venuePreferences = {},
    outputDir = 'event-planning-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Event Concept and Objectives
  ctx.log('info', 'Defining event concept and objectives');
  const eventConcept = await ctx.task(eventConceptTask, {
    eventName,
    eventType,
    expectedAttendance,
    eventDate,
    budget,
    outputDir
  });

  if (!eventConcept.success) {
    return {
      success: false,
      error: 'Event concept development failed',
      details: eventConcept,
      metadata: { processId: 'arts-culture/event-planning', timestamp: startTime }
    };
  }

  artifacts.push(...eventConcept.artifacts);

  // Task 2: Venue Selection and Contracting
  ctx.log('info', 'Selecting and contracting venue');
  const venueSelection = await ctx.task(venueSelectionTask, {
    eventName,
    eventType,
    expectedAttendance,
    eventDate,
    venuePreferences,
    budget,
    outputDir
  });

  artifacts.push(...venueSelection.artifacts);

  // Task 3: Vendor Coordination
  ctx.log('info', 'Coordinating vendors and suppliers');
  const vendorCoordination = await ctx.task(vendorCoordinationTask, {
    eventName,
    eventType,
    expectedAttendance,
    venueSelection: venueSelection.venue,
    budget,
    outputDir
  });

  artifacts.push(...vendorCoordination.artifacts);

  // Task 4: Program and Entertainment
  ctx.log('info', 'Planning program and entertainment');
  const programPlanning = await ctx.task(programPlanningTask, {
    eventName,
    eventType,
    eventConcept: eventConcept.concept,
    venueSelection: venueSelection.venue,
    outputDir
  });

  artifacts.push(...programPlanning.artifacts);

  // Task 5: Logistics Management
  ctx.log('info', 'Planning event logistics');
  const logisticsManagement = await ctx.task(logisticsManagementTask, {
    eventName,
    eventDate,
    expectedAttendance,
    venueSelection: venueSelection.venue,
    vendorCoordination: vendorCoordination.vendors,
    outputDir
  });

  artifacts.push(...logisticsManagement.artifacts);

  // Task 6: Risk Assessment
  ctx.log('info', 'Conducting risk assessment');
  const riskAssessment = await ctx.task(riskAssessmentTask, {
    eventName,
    eventType,
    expectedAttendance,
    venueSelection: venueSelection.venue,
    outputDir
  });

  artifacts.push(...riskAssessment.artifacts);

  // Breakpoint: Review event plan
  await ctx.breakpoint({
    question: `Event plan for "${eventName}" complete. Expected attendance: ${expectedAttendance}. Budget: $${budget.toLocaleString()}. Review and approve?`,
    title: 'Event Planning Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        eventName,
        eventType,
        eventDate,
        expectedAttendance,
        venue: venueSelection.venue.name,
        vendorCount: vendorCoordination.vendors.length,
        riskLevel: riskAssessment.overallRisk
      }
    }
  });

  // Task 7: Budget and Financial Planning
  ctx.log('info', 'Finalizing event budget');
  const budgetPlanning = await ctx.task(eventBudgetTask, {
    eventName,
    budget,
    venueSelection,
    vendorCoordination,
    programPlanning,
    outputDir
  });

  artifacts.push(...budgetPlanning.artifacts);

  // Task 8: Day-of Execution Plan
  ctx.log('info', 'Creating day-of execution plan');
  const executionPlan = await ctx.task(executionPlanTask, {
    eventName,
    eventDate,
    venueSelection: venueSelection.venue,
    vendorCoordination: vendorCoordination.vendors,
    programPlanning: programPlanning.program,
    logisticsManagement,
    outputDir
  });

  artifacts.push(...executionPlan.artifacts);

  // Task 9: Post-Event Procedures
  ctx.log('info', 'Planning post-event procedures');
  const postEventPlan = await ctx.task(postEventTask, {
    eventName,
    eventType,
    vendorCoordination: vendorCoordination.vendors,
    outputDir
  });

  artifacts.push(...postEventPlan.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    eventPlan: {
      name: eventName,
      type: eventType,
      date: eventDate,
      concept: eventConcept.concept,
      program: programPlanning.program
    },
    venue: venueSelection.venue,
    vendors: vendorCoordination.vendors,
    logistics: {
      timeline: logisticsManagement.timeline,
      floorPlan: logisticsManagement.floorPlan,
      runOfShow: executionPlan.runOfShow
    },
    riskAssessment: {
      risks: riskAssessment.risks,
      mitigations: riskAssessment.mitigations,
      overallRisk: riskAssessment.overallRisk
    },
    budget: budgetPlanning,
    execution: executionPlan,
    postEvent: postEventPlan,
    artifacts,
    duration,
    metadata: {
      processId: 'arts-culture/event-planning',
      timestamp: startTime,
      eventName
    }
  };
}

// Task 1: Event Concept
export const eventConceptTask = defineTask('event-concept', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define event concept',
  agent: {
    name: 'event-planner',
    prompt: {
      role: 'cultural event planner',
      task: 'Define comprehensive event concept and objectives',
      context: args,
      instructions: [
        'Define event purpose and objectives',
        'Identify target audience and stakeholders',
        'Develop event theme and creative direction',
        'Establish success metrics and KPIs',
        'Create preliminary event timeline',
        'Define brand guidelines for event',
        'Identify key partnerships and sponsors',
        'Document preliminary requirements'
      ],
      outputFormat: 'JSON with success, concept, objectives, theme, timeline, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'concept', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        concept: {
          type: 'object',
          properties: {
            purpose: { type: 'string' },
            theme: { type: 'string' },
            audience: { type: 'array' },
            objectives: { type: 'array' }
          }
        },
        timeline: { type: 'object' },
        metrics: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'event-planning', 'concept', 'objectives']
}));

// Task 2: Venue Selection
export const venueSelectionTask = defineTask('venue-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select and contract venue',
  agent: {
    name: 'venue-coordinator',
    prompt: {
      role: 'event venue coordinator',
      task: 'Select and evaluate venues for cultural event',
      context: args,
      instructions: [
        'Identify venue requirements (capacity, amenities)',
        'Research and shortlist potential venues',
        'Evaluate venues against criteria',
        'Assess accessibility and parking',
        'Review venue contracts and policies',
        'Negotiate terms and pricing',
        'Confirm availability and hold dates',
        'Document venue specifications and contacts'
      ],
      outputFormat: 'JSON with venue, alternatives, contract, specifications, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['venue', 'artifacts'],
      properties: {
        venue: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            address: { type: 'string' },
            capacity: { type: 'number' },
            cost: { type: 'number' },
            amenities: { type: 'array' }
          }
        },
        alternatives: { type: 'array' },
        contract: { type: 'object' },
        specifications: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'event-planning', 'venue', 'selection']
}));

// Task 3: Vendor Coordination
export const vendorCoordinationTask = defineTask('vendor-coordination', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Coordinate vendors',
  agent: {
    name: 'vendor-manager',
    prompt: {
      role: 'event vendor manager',
      task: 'Coordinate and manage event vendors and suppliers',
      context: args,
      instructions: [
        'Identify required vendor categories',
        'Research and solicit vendor proposals',
        'Evaluate vendor proposals and references',
        'Negotiate contracts and pricing',
        'Coordinate catering and food service',
        'Arrange rentals (furniture, linens, AV)',
        'Coordinate florist and decor vendors',
        'Establish vendor communication protocols'
      ],
      outputFormat: 'JSON with vendors, contracts, timeline, coordination, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['vendors', 'artifacts'],
      properties: {
        vendors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              category: { type: 'string' },
              contact: { type: 'string' },
              cost: { type: 'number' },
              deliverables: { type: 'array' }
            }
          }
        },
        contracts: { type: 'array' },
        timeline: { type: 'object' },
        coordination: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'event-planning', 'vendors', 'coordination']
}));

// Task 4: Program Planning
export const programPlanningTask = defineTask('program-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan event program',
  agent: {
    name: 'program-director',
    prompt: {
      role: 'event program director',
      task: 'Develop event program and entertainment elements',
      context: args,
      instructions: [
        'Create event program flow and timeline',
        'Plan entertainment and performances',
        'Coordinate speakers and presenters',
        'Design ceremony or program moments',
        'Plan interactive or participatory elements',
        'Coordinate with honorees or VIPs',
        'Create program book or materials',
        'Plan audiovisual presentations'
      ],
      outputFormat: 'JSON with program, entertainment, speakers, timeline, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['program', 'artifacts'],
      properties: {
        program: {
          type: 'object',
          properties: {
            flow: { type: 'array' },
            timeline: { type: 'object' },
            elements: { type: 'array' }
          }
        },
        entertainment: { type: 'array' },
        speakers: { type: 'array' },
        materials: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'event-planning', 'program', 'entertainment']
}));

// Task 5: Logistics Management
export const logisticsManagementTask = defineTask('logistics-management', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan event logistics',
  agent: {
    name: 'logistics-coordinator',
    prompt: {
      role: 'event logistics coordinator',
      task: 'Plan comprehensive event logistics and operations',
      context: args,
      instructions: [
        'Create detailed event timeline',
        'Develop floor plan and room layout',
        'Plan guest flow and registration',
        'Coordinate transportation and parking',
        'Plan setup and breakdown schedule',
        'Arrange staffing and volunteers',
        'Coordinate load-in and load-out',
        'Plan signage and wayfinding'
      ],
      outputFormat: 'JSON with timeline, floorPlan, staffing, transportation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['timeline', 'floorPlan', 'artifacts'],
      properties: {
        timeline: {
          type: 'object',
          properties: {
            setup: { type: 'array' },
            event: { type: 'array' },
            breakdown: { type: 'array' }
          }
        },
        floorPlan: { type: 'object' },
        staffing: { type: 'object' },
        transportation: { type: 'object' },
        signage: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'event-planning', 'logistics', 'operations']
}));

// Task 6: Risk Assessment
export const riskAssessmentTask = defineTask('risk-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct risk assessment',
  agent: {
    name: 'risk-manager',
    prompt: {
      role: 'event risk manager',
      task: 'Assess and mitigate event risks',
      context: args,
      instructions: [
        'Identify potential event risks',
        'Assess weather and outdoor contingencies',
        'Plan for medical emergencies',
        'Develop security protocols',
        'Create evacuation procedures',
        'Assess liability and insurance needs',
        'Develop contingency plans',
        'Create emergency contact protocols'
      ],
      outputFormat: 'JSON with risks, mitigations, overallRisk, contingencies, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['risks', 'mitigations', 'overallRisk', 'artifacts'],
      properties: {
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              likelihood: { type: 'string' },
              impact: { type: 'string' },
              mitigation: { type: 'string' }
            }
          }
        },
        mitigations: { type: 'array' },
        overallRisk: { type: 'string', enum: ['low', 'medium', 'high'] },
        contingencies: { type: 'object' },
        emergencyPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'event-planning', 'risk', 'assessment']
}));

// Task 7: Event Budget
export const eventBudgetTask = defineTask('event-budget', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop event budget',
  agent: {
    name: 'event-accountant',
    prompt: {
      role: 'event budget manager',
      task: 'Develop comprehensive event budget and financial tracking',
      context: args,
      instructions: [
        'Create detailed line-item budget',
        'Track vendor costs and contracts',
        'Budget for contingencies (10-15%)',
        'Project revenue from tickets/sponsorships',
        'Create payment schedule',
        'Establish expense approval process',
        'Create budget tracking spreadsheet',
        'Plan final reconciliation process'
      ],
      outputFormat: 'JSON with totalBudget, breakdown, revenue, tracking, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalBudget', 'breakdown', 'artifacts'],
      properties: {
        totalBudget: { type: 'number' },
        breakdown: {
          type: 'object',
          properties: {
            venue: { type: 'number' },
            catering: { type: 'number' },
            entertainment: { type: 'number' },
            decor: { type: 'number' },
            rentals: { type: 'number' },
            staffing: { type: 'number' },
            marketing: { type: 'number' },
            contingency: { type: 'number' }
          }
        },
        revenue: { type: 'object' },
        tracking: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'event-planning', 'budget', 'finance']
}));

// Task 8: Day-of Execution Plan
export const executionPlanTask = defineTask('execution-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create day-of execution plan',
  agent: {
    name: 'event-director',
    prompt: {
      role: 'event director',
      task: 'Create comprehensive day-of execution plan',
      context: args,
      instructions: [
        'Create minute-by-minute run of show',
        'Assign staff and volunteer roles',
        'Create contact sheet with all parties',
        'Develop cue sheets for key moments',
        'Plan check-in and registration process',
        'Create setup and breakdown checklists',
        'Establish communication protocols',
        'Plan VIP and speaker management'
      ],
      outputFormat: 'JSON with runOfShow, staffAssignments, checklists, contacts, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['runOfShow', 'artifacts'],
      properties: {
        runOfShow: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              time: { type: 'string' },
              activity: { type: 'string' },
              responsible: { type: 'string' },
              notes: { type: 'string' }
            }
          }
        },
        staffAssignments: { type: 'array' },
        checklists: { type: 'array' },
        contacts: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'event-planning', 'execution', 'day-of']
}));

// Task 9: Post-Event Procedures
export const postEventTask = defineTask('post-event', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan post-event procedures',
  agent: {
    name: 'post-event-coordinator',
    prompt: {
      role: 'event wrap coordinator',
      task: 'Plan post-event procedures and evaluation',
      context: args,
      instructions: [
        'Plan venue cleanup and restoration',
        'Coordinate vendor breakdown and returns',
        'Create thank you communication plan',
        'Design post-event survey',
        'Plan final financial reconciliation',
        'Create event documentation and photos',
        'Plan debrief meeting',
        'Document lessons learned'
      ],
      outputFormat: 'JSON with procedures, evaluation, communications, documentation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['procedures', 'artifacts'],
      properties: {
        procedures: {
          type: 'object',
          properties: {
            breakdown: { type: 'object' },
            returns: { type: 'array' },
            cleanup: { type: 'object' }
          }
        },
        evaluation: { type: 'object' },
        communications: { type: 'object' },
        documentation: { type: 'object' },
        lessonsLearned: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'event-planning', 'post-event', 'evaluation']
}));
