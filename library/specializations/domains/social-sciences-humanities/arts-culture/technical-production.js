/**
 * @process arts-culture/technical-production
 * @description Workflow for managing lighting, sound, set construction, and multimedia elements in performance and exhibition contexts
 * @inputs { projectTitle: string, projectType: string, venueSpecs: object, designRequirements: object, budget: number }
 * @outputs { success: boolean, technicalDesign: object, equipmentList: object, installationPlan: object, artifacts: array }
 * @recommendedSkills SK-AC-005 (production-coordination), SK-AC-004 (exhibition-design)
 * @recommendedAgents AG-AC-005 (production-manager-agent), AG-AC-010 (exhibition-designer-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectTitle,
    projectType = 'theatrical',
    venueSpecs = {},
    designRequirements = {},
    budget = 30000,
    loadInDate,
    outputDir = 'technical-production-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Technical Requirements Analysis
  ctx.log('info', 'Analyzing technical requirements');
  const requirementsAnalysis = await ctx.task(requirementsAnalysisTask, {
    projectTitle,
    projectType,
    venueSpecs,
    designRequirements,
    outputDir
  });

  if (!requirementsAnalysis.success) {
    return {
      success: false,
      error: 'Technical requirements analysis failed',
      details: requirementsAnalysis,
      metadata: { processId: 'arts-culture/technical-production', timestamp: startTime }
    };
  }

  artifacts.push(...requirementsAnalysis.artifacts);

  // Task 2: Lighting Design and Plot
  ctx.log('info', 'Developing lighting design and plot');
  const lightingDesign = await ctx.task(lightingDesignTask, {
    projectTitle,
    projectType,
    venueSpecs,
    designRequirements: designRequirements.lighting || {},
    budget: budget * 0.3,
    outputDir
  });

  artifacts.push(...lightingDesign.artifacts);

  // Task 3: Sound Design and System
  ctx.log('info', 'Developing sound design and system');
  const soundDesign = await ctx.task(soundDesignTask, {
    projectTitle,
    projectType,
    venueSpecs,
    designRequirements: designRequirements.sound || {},
    budget: budget * 0.25,
    outputDir
  });

  artifacts.push(...soundDesign.artifacts);

  // Task 4: Scenic Construction Planning
  ctx.log('info', 'Planning scenic construction');
  const scenicConstruction = await ctx.task(scenicConstructionTask, {
    projectTitle,
    projectType,
    venueSpecs,
    designRequirements: designRequirements.scenic || {},
    budget: budget * 0.3,
    outputDir
  });

  artifacts.push(...scenicConstruction.artifacts);

  // Task 5: Multimedia and Projections
  ctx.log('info', 'Planning multimedia and projection elements');
  const multimediaDesign = await ctx.task(multimediaDesignTask, {
    projectTitle,
    projectType,
    venueSpecs,
    designRequirements: designRequirements.multimedia || {},
    budget: budget * 0.15,
    outputDir
  });

  artifacts.push(...multimediaDesign.artifacts);

  // Task 6: Equipment Procurement
  ctx.log('info', 'Planning equipment procurement and rentals');
  const equipmentProcurement = await ctx.task(equipmentProcurementTask, {
    projectTitle,
    lightingDesign,
    soundDesign,
    multimediaDesign,
    budget,
    outputDir
  });

  artifacts.push(...equipmentProcurement.artifacts);

  // Breakpoint: Review technical design
  await ctx.breakpoint({
    question: `Technical design for "${projectTitle}" complete. Total equipment budget: $${budget.toLocaleString()}. Review and approve technical plans?`,
    title: 'Technical Production Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        projectTitle,
        projectType,
        lightingFixtures: lightingDesign.fixtureCount,
        soundChannels: soundDesign.channelCount,
        scenicPieces: scenicConstruction.pieceCount,
        totalBudget: equipmentProcurement.totalCost
      }
    }
  });

  // Task 7: Load-In and Installation Planning
  ctx.log('info', 'Planning load-in and installation');
  const installationPlan = await ctx.task(installationPlanTask, {
    projectTitle,
    venueSpecs,
    loadInDate,
    lightingDesign,
    soundDesign,
    scenicConstruction,
    multimediaDesign,
    outputDir
  });

  artifacts.push(...installationPlan.artifacts);

  // Task 8: Technical Rehearsal Planning
  ctx.log('info', 'Planning technical rehearsals');
  const techRehearsalPlan = await ctx.task(techRehearsalPlanTask, {
    projectTitle,
    projectType,
    installationPlan: installationPlan.plan,
    outputDir
  });

  artifacts.push(...techRehearsalPlan.artifacts);

  // Task 9: Maintenance and Strike Planning
  ctx.log('info', 'Planning maintenance and strike procedures');
  const maintenanceStrike = await ctx.task(maintenanceStrikeTask, {
    projectTitle,
    lightingDesign,
    soundDesign,
    scenicConstruction,
    venueSpecs,
    outputDir
  });

  artifacts.push(...maintenanceStrike.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    technicalDesign: {
      lighting: lightingDesign.design,
      sound: soundDesign.design,
      scenic: scenicConstruction.design,
      multimedia: multimediaDesign.design
    },
    equipmentList: {
      lighting: lightingDesign.equipment,
      sound: soundDesign.equipment,
      multimedia: multimediaDesign.equipment,
      procurement: equipmentProcurement
    },
    installationPlan: {
      schedule: installationPlan.schedule,
      crew: installationPlan.crew,
      procedures: installationPlan.procedures
    },
    techRehearsals: techRehearsalPlan,
    maintenance: maintenanceStrike,
    artifacts,
    duration,
    metadata: {
      processId: 'arts-culture/technical-production',
      timestamp: startTime,
      projectTitle
    }
  };
}

// Task 1: Requirements Analysis
export const requirementsAnalysisTask = defineTask('requirements-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze technical requirements',
  agent: {
    name: 'technical-director',
    prompt: {
      role: 'technical director',
      task: 'Analyze technical requirements for production or exhibition',
      context: args,
      instructions: [
        'Review design concepts and requirements',
        'Analyze venue technical specifications',
        'Identify power and rigging requirements',
        'Assess safety and code compliance needs',
        'Document special effects requirements',
        'Identify automation needs',
        'Assess crew and labor requirements',
        'Create technical specifications document'
      ],
      outputFormat: 'JSON with success, requirements, specifications, safety, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'requirements', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        requirements: {
          type: 'object',
          properties: {
            power: { type: 'object' },
            rigging: { type: 'object' },
            safety: { type: 'array' },
            crew: { type: 'object' }
          }
        },
        specifications: { type: 'object' },
        safety: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'technical-production', 'requirements', 'analysis']
}));

// Task 2: Lighting Design
export const lightingDesignTask = defineTask('lighting-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop lighting design',
  agent: {
    name: 'lighting-designer',
    prompt: {
      role: 'lighting designer',
      task: 'Develop comprehensive lighting design and documentation',
      context: args,
      instructions: [
        'Create lighting concept and approach',
        'Develop light plot with fixture positions',
        'Create instrument schedule and patch',
        'Design color palette and gel cuts',
        'Document focus notes and positions',
        'Create cue synopsis and timing',
        'Specify control system requirements',
        'Document power distribution needs'
      ],
      outputFormat: 'JSON with design, plot, equipment, fixtureCount, cues, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'equipment', 'artifacts'],
      properties: {
        design: {
          type: 'object',
          properties: {
            concept: { type: 'string' },
            approach: { type: 'string' },
            colorPalette: { type: 'array' }
          }
        },
        plot: { type: 'object' },
        equipment: { type: 'array' },
        fixtureCount: { type: 'number' },
        cues: { type: 'array' },
        power: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'technical-production', 'lighting', 'design']
}));

// Task 3: Sound Design
export const soundDesignTask = defineTask('sound-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop sound design',
  agent: {
    name: 'sound-designer',
    prompt: {
      role: 'sound designer',
      task: 'Develop comprehensive sound design and system',
      context: args,
      instructions: [
        'Create sound design concept',
        'Design speaker system and coverage',
        'Plan microphone placement and types',
        'Design monitor and foldback system',
        'Create input/output patch list',
        'Document playback and effects requirements',
        'Plan communication systems (comms)',
        'Specify console and processing needs'
      ],
      outputFormat: 'JSON with design, system, equipment, channelCount, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'equipment', 'artifacts'],
      properties: {
        design: {
          type: 'object',
          properties: {
            concept: { type: 'string' },
            approach: { type: 'string' },
            effects: { type: 'array' }
          }
        },
        system: { type: 'object' },
        equipment: { type: 'array' },
        channelCount: { type: 'number' },
        patch: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'technical-production', 'sound', 'design']
}));

// Task 4: Scenic Construction
export const scenicConstructionTask = defineTask('scenic-construction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan scenic construction',
  agent: {
    name: 'scenic-technical-director',
    prompt: {
      role: 'scenic technical director',
      task: 'Plan scenic construction and fabrication',
      context: args,
      instructions: [
        'Analyze scenic design for buildability',
        'Create construction drawings',
        'Develop materials list and specifications',
        'Plan scenic painting and finishing',
        'Design rigging and fly systems',
        'Plan scenic automation',
        'Create build schedule',
        'Document transportation and storage needs'
      ],
      outputFormat: 'JSON with design, construction, materials, pieceCount, schedule, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'construction', 'artifacts'],
      properties: {
        design: {
          type: 'object',
          properties: {
            drawings: { type: 'array' },
            specifications: { type: 'object' }
          }
        },
        construction: { type: 'object' },
        materials: { type: 'array' },
        pieceCount: { type: 'number' },
        schedule: { type: 'object' },
        rigging: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'technical-production', 'scenic', 'construction']
}));

// Task 5: Multimedia Design
export const multimediaDesignTask = defineTask('multimedia-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan multimedia elements',
  agent: {
    name: 'multimedia-designer',
    prompt: {
      role: 'multimedia designer',
      task: 'Design multimedia and projection elements',
      context: args,
      instructions: [
        'Design projection system and surfaces',
        'Plan video playback systems',
        'Design LED and video walls',
        'Plan content creation workflow',
        'Document media server requirements',
        'Design live camera and IMAG systems',
        'Plan show control and integration',
        'Document backup and redundancy'
      ],
      outputFormat: 'JSON with design, system, equipment, content, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['design', 'equipment', 'artifacts'],
      properties: {
        design: {
          type: 'object',
          properties: {
            concept: { type: 'string' },
            surfaces: { type: 'array' },
            content: { type: 'object' }
          }
        },
        system: { type: 'object' },
        equipment: { type: 'array' },
        content: { type: 'object' },
        integration: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'technical-production', 'multimedia', 'projection']
}));

// Task 6: Equipment Procurement
export const equipmentProcurementTask = defineTask('equipment-procurement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan equipment procurement',
  agent: {
    name: 'production-manager',
    prompt: {
      role: 'production manager',
      task: 'Plan equipment procurement, rentals, and purchases',
      context: args,
      instructions: [
        'Compile master equipment list',
        'Identify rental vs purchase decisions',
        'Research and compare vendors',
        'Negotiate rental agreements',
        'Schedule delivery and pickup',
        'Plan equipment storage',
        'Track budget and expenditures',
        'Coordinate cross-rentals and shares'
      ],
      outputFormat: 'JSON with equipmentList, rentals, purchases, totalCost, schedule, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['equipmentList', 'totalCost', 'artifacts'],
      properties: {
        equipmentList: { type: 'array' },
        rentals: { type: 'array' },
        purchases: { type: 'array' },
        totalCost: { type: 'number' },
        schedule: { type: 'object' },
        vendors: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'technical-production', 'procurement', 'equipment']
}));

// Task 7: Installation Planning
export const installationPlanTask = defineTask('installation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan load-in and installation',
  agent: {
    name: 'installation-coordinator',
    prompt: {
      role: 'installation coordinator',
      task: 'Plan comprehensive load-in and installation process',
      context: args,
      instructions: [
        'Create load-in schedule and timeline',
        'Plan truck and dock scheduling',
        'Coordinate rigging and hanging order',
        'Schedule department installation sequences',
        'Plan power distribution installation',
        'Coordinate scenic assembly',
        'Plan focus and level sessions',
        'Document safety procedures'
      ],
      outputFormat: 'JSON with plan, schedule, crew, procedures, safety, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'schedule', 'artifacts'],
      properties: {
        plan: {
          type: 'object',
          properties: {
            overview: { type: 'string' },
            sequence: { type: 'array' },
            departments: { type: 'object' }
          }
        },
        schedule: { type: 'object' },
        crew: { type: 'object' },
        procedures: { type: 'object' },
        safety: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'technical-production', 'installation', 'load-in']
}));

// Task 8: Technical Rehearsal Planning
export const techRehearsalPlanTask = defineTask('tech-rehearsal-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan technical rehearsals',
  agent: {
    name: 'tech-coordinator',
    prompt: {
      role: 'technical coordinator',
      task: 'Plan technical rehearsal process and integration',
      context: args,
      instructions: [
        'Create dry tech schedule',
        'Plan paper tech sessions',
        'Schedule cue-to-cue rehearsals',
        'Plan technical run-throughs',
        'Schedule dress rehearsals',
        'Plan spacing and shift rehearsals',
        'Document cue integration process',
        'Create tech notes system'
      ],
      outputFormat: 'JSON with plan, schedule, sessions, notes, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'artifacts'],
      properties: {
        plan: {
          type: 'object',
          properties: {
            overview: { type: 'string' },
            phases: { type: 'array' },
            goals: { type: 'array' }
          }
        },
        schedule: { type: 'object' },
        sessions: { type: 'array' },
        notes: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'technical-production', 'tech-rehearsal', 'planning']
}));

// Task 9: Maintenance and Strike
export const maintenanceStrikeTask = defineTask('maintenance-strike', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan maintenance and strike',
  agent: {
    name: 'maintenance-coordinator',
    prompt: {
      role: 'technical maintenance coordinator',
      task: 'Plan run maintenance and strike procedures',
      context: args,
      instructions: [
        'Create daily maintenance checklists',
        'Document equipment maintenance schedules',
        'Plan consumables tracking and replacement',
        'Create strike schedule and procedures',
        'Plan equipment cleaning and packing',
        'Document return procedures',
        'Plan venue restoration',
        'Create final documentation checklist'
      ],
      outputFormat: 'JSON with maintenance, strike, checklists, procedures, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['maintenance', 'strike', 'artifacts'],
      properties: {
        maintenance: {
          type: 'object',
          properties: {
            daily: { type: 'array' },
            weekly: { type: 'array' },
            consumables: { type: 'array' }
          }
        },
        strike: {
          type: 'object',
          properties: {
            schedule: { type: 'object' },
            procedures: { type: 'array' },
            crew: { type: 'object' }
          }
        },
        checklists: { type: 'array' },
        procedures: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'technical-production', 'maintenance', 'strike']
}));
