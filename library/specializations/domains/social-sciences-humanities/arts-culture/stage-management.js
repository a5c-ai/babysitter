/**
 * @process arts-culture/stage-management
 * @description Protocol for coordinating rehearsals and performances including scheduling, communication, prompt book management, show calling, and production documentation
 * @inputs { productionTitle: string, productionType: string, rehearsalStart: string, openingDate: string, castSize: number }
 * @outputs { success: boolean, promptBook: object, rehearsalReports: array, showDocumentation: object, artifacts: array }
 * @recommendedSkills SK-AC-005 (production-coordination)
 * @recommendedAgents AG-AC-005 (production-manager-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    productionTitle,
    productionType = 'theatrical',
    rehearsalStart,
    openingDate,
    castSize = 10,
    crewSize = 15,
    outputDir = 'stage-management-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Pre-Production Preparation
  ctx.log('info', 'Preparing stage management pre-production materials');
  const preProduction = await ctx.task(smPreProductionTask, {
    productionTitle,
    productionType,
    rehearsalStart,
    openingDate,
    outputDir
  });

  if (!preProduction.success) {
    return {
      success: false,
      error: 'Stage management pre-production failed',
      details: preProduction,
      metadata: { processId: 'arts-culture/stage-management', timestamp: startTime }
    };
  }

  artifacts.push(...preProduction.artifacts);

  // Task 2: Prompt Book Development
  ctx.log('info', 'Developing prompt book structure');
  const promptBook = await ctx.task(promptBookTask, {
    productionTitle,
    productionType,
    preProduction: preProduction.materials,
    outputDir
  });

  artifacts.push(...promptBook.artifacts);

  // Task 3: Scheduling and Calendar
  ctx.log('info', 'Creating rehearsal schedule and calendar');
  const scheduling = await ctx.task(schedulingTask, {
    productionTitle,
    rehearsalStart,
    openingDate,
    castSize,
    crewSize,
    outputDir
  });

  artifacts.push(...scheduling.artifacts);

  // Task 4: Communication Protocols
  ctx.log('info', 'Establishing communication protocols');
  const communicationProtocols = await ctx.task(communicationProtocolsTask, {
    productionTitle,
    castSize,
    crewSize,
    outputDir
  });

  artifacts.push(...communicationProtocols.artifacts);

  // Task 5: Rehearsal Report System
  ctx.log('info', 'Setting up rehearsal report system');
  const rehearsalReports = await ctx.task(rehearsalReportTask, {
    productionTitle,
    productionType,
    outputDir
  });

  artifacts.push(...rehearsalReports.artifacts);

  // Task 6: Technical Rehearsal Planning
  ctx.log('info', 'Planning technical rehearsals');
  const techRehearsals = await ctx.task(techRehearsalTask, {
    productionTitle,
    openingDate,
    crewSize,
    outputDir
  });

  artifacts.push(...techRehearsals.artifacts);

  // Breakpoint: Review stage management documentation
  await ctx.breakpoint({
    question: `Stage management documentation for "${productionTitle}" complete. Rehearsal period: ${rehearsalStart} to ${openingDate}. Review and approve?`,
    title: 'Stage Management Documentation Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        productionTitle,
        rehearsalStart,
        openingDate,
        castSize,
        crewSize
      }
    }
  });

  // Task 7: Show Calling Documentation
  ctx.log('info', 'Developing show calling documentation');
  const showCalling = await ctx.task(showCallingTask, {
    productionTitle,
    productionType,
    promptBook: promptBook.structure,
    outputDir
  });

  artifacts.push(...showCalling.artifacts);

  // Task 8: Performance Reports
  ctx.log('info', 'Creating performance report system');
  const performanceReports = await ctx.task(performanceReportTask, {
    productionTitle,
    outputDir
  });

  artifacts.push(...performanceReports.artifacts);

  // Task 9: Production Archive
  ctx.log('info', 'Planning production archive and documentation');
  const productionArchive = await ctx.task(productionArchiveTask, {
    productionTitle,
    promptBook,
    rehearsalReports,
    performanceReports,
    outputDir
  });

  artifacts.push(...productionArchive.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    promptBook: {
      structure: promptBook.structure,
      sections: promptBook.sections,
      callingScript: showCalling.callingScript
    },
    rehearsalReports: {
      template: rehearsalReports.template,
      system: rehearsalReports.system
    },
    scheduling: {
      calendar: scheduling.calendar,
      conflicts: scheduling.conflicts
    },
    communication: communicationProtocols.protocols,
    techRehearsals: techRehearsals.plan,
    showDocumentation: {
      calling: showCalling,
      reports: performanceReports,
      archive: productionArchive
    },
    artifacts,
    duration,
    metadata: {
      processId: 'arts-culture/stage-management',
      timestamp: startTime,
      productionTitle
    }
  };
}

// Task 1: Pre-Production Preparation
export const smPreProductionTask = defineTask('sm-pre-production', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare stage management materials',
  agent: {
    name: 'stage-manager',
    prompt: {
      role: 'professional stage manager',
      task: 'Prepare comprehensive pre-production stage management materials',
      context: args,
      instructions: [
        'Analyze script for stage management requirements',
        'Create character/scene breakdown',
        'Develop props tracking list',
        'Create costume plot matrix',
        'Document scenic requirements by scene',
        'Identify special effects and cues',
        'Create preliminary blocking notation system',
        'Prepare first rehearsal materials'
      ],
      outputFormat: 'JSON with success, materials, breakdown, tracking, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'materials', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        materials: {
          type: 'object',
          properties: {
            scriptAnalysis: { type: 'object' },
            characterBreakdown: { type: 'array' },
            sceneBreakdown: { type: 'array' }
          }
        },
        breakdown: { type: 'object' },
        tracking: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'stage-management', 'pre-production', 'preparation']
}));

// Task 2: Prompt Book Development
export const promptBookTask = defineTask('prompt-book', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop prompt book',
  agent: {
    name: 'prompt-book-specialist',
    prompt: {
      role: 'stage management specialist',
      task: 'Develop comprehensive prompt book structure and content',
      context: args,
      instructions: [
        'Create prompt book layout and organization',
        'Design blocking notation pages',
        'Create cue sheet templates',
        'Develop tracking sheet formats',
        'Create contact sheet section',
        'Design rehearsal schedule section',
        'Create production calendar section',
        'Establish update and maintenance procedures'
      ],
      outputFormat: 'JSON with structure, sections, templates, procedures, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['structure', 'sections', 'artifacts'],
      properties: {
        structure: {
          type: 'object',
          properties: {
            layout: { type: 'string' },
            organization: { type: 'array' },
            indexing: { type: 'object' }
          }
        },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              purpose: { type: 'string' },
              format: { type: 'string' }
            }
          }
        },
        templates: { type: 'array' },
        procedures: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'stage-management', 'prompt-book', 'documentation']
}));

// Task 3: Scheduling
export const schedulingTask = defineTask('sm-scheduling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create rehearsal schedule',
  agent: {
    name: 'scheduling-coordinator',
    prompt: {
      role: 'production scheduling coordinator',
      task: 'Create comprehensive rehearsal and production schedule',
      context: args,
      instructions: [
        'Create master production calendar',
        'Develop daily rehearsal schedules',
        'Track actor conflicts and availability',
        'Schedule design and production meetings',
        'Plan fittings and special calls',
        'Schedule technical rehearsals',
        'Create dress rehearsal schedule',
        'Plan call times and breaks'
      ],
      outputFormat: 'JSON with calendar, dailySchedules, conflicts, calls, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['calendar', 'artifacts'],
      properties: {
        calendar: {
          type: 'object',
          properties: {
            overview: { type: 'array' },
            milestones: { type: 'array' },
            deadlines: { type: 'array' }
          }
        },
        dailySchedules: { type: 'array' },
        conflicts: { type: 'array' },
        calls: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'stage-management', 'scheduling', 'calendar']
}));

// Task 4: Communication Protocols
export const communicationProtocolsTask = defineTask('communication-protocols', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish communication protocols',
  agent: {
    name: 'communication-coordinator',
    prompt: {
      role: 'production communication coordinator',
      task: 'Establish comprehensive communication protocols for production',
      context: args,
      instructions: [
        'Create contact sheet with all personnel',
        'Establish daily communication channels',
        'Design schedule distribution system',
        'Create change notification procedures',
        'Establish emergency communication plan',
        'Design meeting notes distribution',
        'Create digital communication guidelines',
        'Establish chain of command'
      ],
      outputFormat: 'JSON with protocols, contacts, channels, procedures, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['protocols', 'artifacts'],
      properties: {
        protocols: {
          type: 'object',
          properties: {
            daily: { type: 'object' },
            emergency: { type: 'object' },
            changes: { type: 'object' }
          }
        },
        contacts: { type: 'array' },
        channels: { type: 'array' },
        procedures: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'stage-management', 'communication', 'protocols']
}));

// Task 5: Rehearsal Reports
export const rehearsalReportTask = defineTask('rehearsal-reports', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up rehearsal report system',
  agent: {
    name: 'rehearsal-report-specialist',
    prompt: {
      role: 'stage management documentation specialist',
      task: 'Develop rehearsal report system and templates',
      context: args,
      instructions: [
        'Design rehearsal report template',
        'Create sections for all departments',
        'Establish distribution protocol',
        'Design daily call information format',
        'Create notes categorization system',
        'Establish photo/video documentation',
        'Create digital filing system',
        'Design archive procedures'
      ],
      outputFormat: 'JSON with template, system, distribution, archive, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['template', 'system', 'artifacts'],
      properties: {
        template: {
          type: 'object',
          properties: {
            sections: { type: 'array' },
            fields: { type: 'array' },
            format: { type: 'string' }
          }
        },
        system: {
          type: 'object',
          properties: {
            workflow: { type: 'string' },
            distribution: { type: 'array' },
            timing: { type: 'string' }
          }
        },
        distribution: { type: 'object' },
        archive: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'stage-management', 'rehearsal-reports', 'documentation']
}));

// Task 6: Technical Rehearsals
export const techRehearsalTask = defineTask('tech-rehearsals', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan technical rehearsals',
  agent: {
    name: 'tech-rehearsal-planner',
    prompt: {
      role: 'technical rehearsal coordinator',
      task: 'Plan comprehensive technical rehearsal process',
      context: args,
      instructions: [
        'Create tech week schedule and timeline',
        'Plan dry tech procedures',
        'Schedule cue-to-cue rehearsals',
        'Plan tech run-throughs',
        'Schedule dress rehearsals',
        'Create tech table setup and communications',
        'Plan shift rehearsals',
        'Establish tech notes distribution'
      ],
      outputFormat: 'JSON with plan, schedule, procedures, notes, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'artifacts'],
      properties: {
        plan: {
          type: 'object',
          properties: {
            timeline: { type: 'array' },
            sessions: { type: 'array' },
            goals: { type: 'array' }
          }
        },
        schedule: { type: 'object' },
        procedures: { type: 'object' },
        notes: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'stage-management', 'tech-rehearsals', 'planning']
}));

// Task 7: Show Calling
export const showCallingTask = defineTask('show-calling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop show calling documentation',
  agent: {
    name: 'show-caller',
    prompt: {
      role: 'calling stage manager',
      task: 'Develop comprehensive show calling documentation and procedures',
      context: args,
      instructions: [
        'Create cue script with all departments',
        'Develop calling notation system',
        'Document standby and go procedures',
        'Create backup calling procedures',
        'Document cue timing and sequencing',
        'Create hold and resume procedures',
        'Develop emergency stop procedures',
        'Document headset protocol'
      ],
      outputFormat: 'JSON with callingScript, procedures, cues, backup, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['callingScript', 'artifacts'],
      properties: {
        callingScript: {
          type: 'object',
          properties: {
            notation: { type: 'string' },
            cues: { type: 'array' },
            timing: { type: 'object' }
          }
        },
        procedures: { type: 'object' },
        cues: { type: 'array' },
        backup: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'stage-management', 'show-calling', 'cues']
}));

// Task 8: Performance Reports
export const performanceReportTask = defineTask('performance-reports', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create performance report system',
  agent: {
    name: 'performance-report-specialist',
    prompt: {
      role: 'performance documentation specialist',
      task: 'Develop performance report system and maintenance procedures',
      context: args,
      instructions: [
        'Design performance report template',
        'Create show timing tracking',
        'Document injury and incident reporting',
        'Create maintenance call system',
        'Establish understudry/swing tracking',
        'Design audience count reporting',
        'Create photo call documentation',
        'Establish closing night procedures'
      ],
      outputFormat: 'JSON with template, tracking, reporting, maintenance, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['template', 'artifacts'],
      properties: {
        template: {
          type: 'object',
          properties: {
            sections: { type: 'array' },
            metrics: { type: 'array' },
            distribution: { type: 'array' }
          }
        },
        tracking: { type: 'object' },
        reporting: { type: 'object' },
        maintenance: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'stage-management', 'performance-reports', 'tracking']
}));

// Task 9: Production Archive
export const productionArchiveTask = defineTask('production-archive', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan production archive',
  agent: {
    name: 'archive-specialist',
    prompt: {
      role: 'production archivist',
      task: 'Plan comprehensive production archive and documentation',
      context: args,
      instructions: [
        'Create archive checklist and inventory',
        'Plan prompt book preservation',
        'Document video/photo archive',
        'Create production bible compilation',
        'Plan digital file organization',
        'Document costume and prop archive',
        'Create revival documentation',
        'Establish long-term storage procedures'
      ],
      outputFormat: 'JSON with archive, checklist, preservation, storage, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['archive', 'artifacts'],
      properties: {
        archive: {
          type: 'object',
          properties: {
            contents: { type: 'array' },
            organization: { type: 'object' },
            preservation: { type: 'object' }
          }
        },
        checklist: { type: 'array' },
        preservation: { type: 'object' },
        storage: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'stage-management', 'archive', 'documentation']
}));
