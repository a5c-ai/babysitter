/**
 * @process arts-culture/preventive-conservation
 * @description Systematic approach to collection preservation including environmental monitoring, integrated pest management, storage protocols, and emergency preparedness following AIC standards
 * @inputs { collectionName: string, collectionType: string, facilityInfo: object, currentConditions: object }
 * @outputs { success: boolean, preservationPlan: object, monitoringProtocols: object, emergencyPlan: object, artifacts: array }
 * @recommendedSkills SK-AC-006 (conservation-assessment), SK-AC-011 (risk-mitigation-planning), SK-AC-003 (collection-documentation)
 * @recommendedAgents AG-AC-004 (conservator-agent), AG-AC-006 (registrar-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    collectionName,
    collectionType = 'mixed-media',
    facilityInfo = {},
    currentConditions = {},
    outputDir = 'preventive-conservation-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Collection Assessment
  ctx.log('info', 'Assessing collection preservation needs');
  const collectionAssessment = await ctx.task(collectionAssessmentTask, {
    collectionName,
    collectionType,
    facilityInfo,
    outputDir
  });

  if (!collectionAssessment.success) {
    return {
      success: false,
      error: 'Collection assessment failed',
      details: collectionAssessment,
      metadata: { processId: 'arts-culture/preventive-conservation', timestamp: startTime }
    };
  }

  artifacts.push(...collectionAssessment.artifacts);

  // Task 2: Environmental Monitoring Program
  ctx.log('info', 'Developing environmental monitoring program');
  const environmentalMonitoring = await ctx.task(environmentalMonitoringTask, {
    collectionType,
    facilityInfo,
    currentConditions,
    outputDir
  });

  artifacts.push(...environmentalMonitoring.artifacts);

  // Task 3: Integrated Pest Management
  ctx.log('info', 'Developing integrated pest management program');
  const pestManagement = await ctx.task(pestManagementTask, {
    collectionType,
    facilityInfo,
    currentConditions,
    outputDir
  });

  artifacts.push(...pestManagement.artifacts);

  // Task 4: Storage Protocols
  ctx.log('info', 'Developing storage protocols');
  const storageProtocols = await ctx.task(storageProtocolsTask, {
    collectionName,
    collectionType,
    facilityInfo,
    outputDir
  });

  artifacts.push(...storageProtocols.artifacts);

  // Task 5: Handling and Transport
  ctx.log('info', 'Developing handling and transport guidelines');
  const handlingTransport = await ctx.task(handlingTransportTask, {
    collectionType,
    outputDir
  });

  artifacts.push(...handlingTransport.artifacts);

  // Task 6: Light and UV Management
  ctx.log('info', 'Developing light exposure management');
  const lightManagement = await ctx.task(lightManagementTask, {
    collectionType,
    facilityInfo,
    outputDir
  });

  artifacts.push(...lightManagement.artifacts);

  // Breakpoint: Review preservation plan
  await ctx.breakpoint({
    question: `Preventive conservation plan for "${collectionName}" complete. Environmental targets and protocols established. Review and approve?`,
    title: 'Preventive Conservation Plan Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        collectionName,
        collectionType,
        environmentalTargets: environmentalMonitoring.targets,
        storageAreas: storageProtocols.areas
      }
    }
  });

  // Task 7: Emergency Preparedness
  ctx.log('info', 'Developing emergency preparedness plan');
  const emergencyPreparedness = await ctx.task(emergencyPreparednessTask, {
    collectionName,
    facilityInfo,
    collectionAssessment: collectionAssessment.assessment,
    outputDir
  });

  artifacts.push(...emergencyPreparedness.artifacts);

  // Task 8: Staff Training Program
  ctx.log('info', 'Developing staff training program');
  const staffTraining = await ctx.task(staffTrainingTask, {
    collectionType,
    storageProtocols: storageProtocols.protocols,
    handlingTransport: handlingTransport.guidelines,
    emergencyPreparedness: emergencyPreparedness.plan,
    outputDir
  });

  artifacts.push(...staffTraining.artifacts);

  // Task 9: Documentation and Reporting
  ctx.log('info', 'Creating documentation and reporting system');
  const documentationSystem = await ctx.task(documentationSystemTask, {
    collectionName,
    environmentalMonitoring,
    pestManagement,
    emergencyPreparedness,
    outputDir
  });

  artifacts.push(...documentationSystem.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    preservationPlan: {
      assessment: collectionAssessment.assessment,
      storage: storageProtocols.protocols,
      handling: handlingTransport.guidelines,
      light: lightManagement.guidelines
    },
    monitoringProtocols: {
      environmental: environmentalMonitoring.program,
      targets: environmentalMonitoring.targets,
      pest: pestManagement.program
    },
    emergencyPlan: emergencyPreparedness.plan,
    training: staffTraining.program,
    documentation: documentationSystem.system,
    artifacts,
    duration,
    metadata: {
      processId: 'arts-culture/preventive-conservation',
      timestamp: startTime,
      collectionName
    }
  };
}

// Task 1: Collection Assessment
export const collectionAssessmentTask = defineTask('collection-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess collection preservation needs',
  agent: {
    name: 'preventive-conservator',
    prompt: {
      role: 'preventive conservator',
      task: 'Assess collection preservation needs and vulnerabilities',
      context: args,
      instructions: [
        'Survey collection materials and media types',
        'Identify high-risk and vulnerable objects',
        'Assess current storage conditions',
        'Document preservation priorities',
        'Evaluate collection access patterns',
        'Identify immediate preservation needs',
        'Assess housekeeping and cleaning needs',
        'Document baseline conditions'
      ],
      outputFormat: 'JSON with success, assessment, priorities, risks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'assessment', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        assessment: {
          type: 'object',
          properties: {
            materials: { type: 'array' },
            vulnerabilities: { type: 'array' },
            conditions: { type: 'object' }
          }
        },
        priorities: { type: 'array' },
        risks: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'conservation', 'assessment', 'collection']
}));

// Task 2: Environmental Monitoring
export const environmentalMonitoringTask = defineTask('environmental-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop environmental monitoring program',
  agent: {
    name: 'environmental-specialist',
    prompt: {
      role: 'conservation environmental specialist',
      task: 'Develop comprehensive environmental monitoring program',
      context: args,
      instructions: [
        'Establish temperature and RH targets by collection type',
        'Design monitoring equipment placement',
        'Create data logging and analysis protocols',
        'Develop alarm and alert thresholds',
        'Plan HVAC coordination and management',
        'Create seasonal adjustment procedures',
        'Design reporting templates',
        'Establish response protocols for excursions'
      ],
      outputFormat: 'JSON with program, targets, monitoring, alerts, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['program', 'targets', 'artifacts'],
      properties: {
        program: {
          type: 'object',
          properties: {
            equipment: { type: 'array' },
            locations: { type: 'array' },
            frequency: { type: 'string' }
          }
        },
        targets: {
          type: 'object',
          properties: {
            temperature: { type: 'object' },
            relativeHumidity: { type: 'object' },
            lightLevels: { type: 'object' }
          }
        },
        monitoring: { type: 'object' },
        alerts: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'conservation', 'environmental', 'monitoring']
}));

// Task 3: Integrated Pest Management
export const pestManagementTask = defineTask('pest-management', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop integrated pest management',
  agent: {
    name: 'ipm-specialist',
    prompt: {
      role: 'integrated pest management specialist',
      task: 'Develop comprehensive IPM program for cultural collections',
      context: args,
      instructions: [
        'Identify pest risks for collection types',
        'Design monitoring and trapping program',
        'Establish inspection protocols and schedules',
        'Develop quarantine procedures for incoming objects',
        'Create treatment decision matrix',
        'Plan non-chemical and chemical treatment options',
        'Develop staff awareness training',
        'Create documentation and reporting system'
      ],
      outputFormat: 'JSON with program, monitoring, treatment, protocols, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['program', 'artifacts'],
      properties: {
        program: {
          type: 'object',
          properties: {
            risks: { type: 'array' },
            monitoring: { type: 'object' },
            prevention: { type: 'array' }
          }
        },
        monitoring: { type: 'object' },
        treatment: { type: 'object' },
        protocols: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'conservation', 'ipm', 'pest-management']
}));

// Task 4: Storage Protocols
export const storageProtocolsTask = defineTask('storage-protocols', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop storage protocols',
  agent: {
    name: 'collections-care-specialist',
    prompt: {
      role: 'collections care specialist',
      task: 'Develop comprehensive storage protocols for collection preservation',
      context: args,
      instructions: [
        'Assess current storage furniture and materials',
        'Recommend archival storage materials by object type',
        'Design storage configurations and layouts',
        'Create housing and mounting specifications',
        'Develop storage labeling and organization system',
        'Plan space utilization improvements',
        'Create storage materials acquisition plan',
        'Document storage standards and procedures'
      ],
      outputFormat: 'JSON with protocols, areas, materials, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['protocols', 'artifacts'],
      properties: {
        protocols: {
          type: 'object',
          properties: {
            byMaterial: { type: 'object' },
            bySize: { type: 'object' },
            general: { type: 'array' }
          }
        },
        areas: { type: 'array' },
        materials: { type: 'array' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'conservation', 'storage', 'protocols']
}));

// Task 5: Handling and Transport
export const handlingTransportTask = defineTask('handling-transport', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop handling guidelines',
  agent: {
    name: 'handling-specialist',
    prompt: {
      role: 'collections handling specialist',
      task: 'Develop handling and transport guidelines for collections',
      context: args,
      instructions: [
        'Create general handling principles and rules',
        'Develop object-specific handling procedures',
        'Design packing and crating specifications',
        'Create internal transport procedures',
        'Develop courier and loan handling protocols',
        'Plan equipment and supplies needs',
        'Create handling training materials',
        'Document risk assessment for handling'
      ],
      outputFormat: 'JSON with guidelines, procedures, packing, training, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['guidelines', 'artifacts'],
      properties: {
        guidelines: {
          type: 'object',
          properties: {
            general: { type: 'array' },
            byObjectType: { type: 'object' },
            equipment: { type: 'array' }
          }
        },
        procedures: { type: 'object' },
        packing: { type: 'object' },
        training: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'conservation', 'handling', 'transport']
}));

// Task 6: Light Management
export const lightManagementTask = defineTask('light-management', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop light exposure management',
  agent: {
    name: 'light-specialist',
    prompt: {
      role: 'conservation lighting specialist',
      task: 'Develop light exposure management program',
      context: args,
      instructions: [
        'Establish light level targets by material sensitivity',
        'Assess current lighting conditions',
        'Recommend UV filtration measures',
        'Design rotation and rest schedules',
        'Plan lighting modifications for galleries',
        'Create exposure monitoring protocols',
        'Develop cumulative exposure tracking',
        'Document lighting standards and guidelines'
      ],
      outputFormat: 'JSON with guidelines, targets, monitoring, rotation, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['guidelines', 'artifacts'],
      properties: {
        guidelines: {
          type: 'object',
          properties: {
            levels: { type: 'object' },
            uvLimits: { type: 'object' },
            recommendations: { type: 'array' }
          }
        },
        targets: { type: 'object' },
        monitoring: { type: 'object' },
        rotation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'conservation', 'light', 'management']
}));

// Task 7: Emergency Preparedness
export const emergencyPreparednessTask = defineTask('emergency-preparedness', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop emergency preparedness plan',
  agent: {
    name: 'emergency-preparedness-specialist',
    prompt: {
      role: 'museum emergency preparedness specialist',
      task: 'Develop comprehensive emergency preparedness plan',
      context: args,
      instructions: [
        'Identify potential emergency scenarios',
        'Create collection priority lists for salvage',
        'Develop response procedures by emergency type',
        'Plan emergency supplies and equipment',
        'Create communication and notification protocols',
        'Develop salvage and recovery procedures',
        'Plan mutual aid and resource agreements',
        'Create training and drill schedules'
      ],
      outputFormat: 'JSON with plan, priorities, procedures, supplies, training, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'artifacts'],
      properties: {
        plan: {
          type: 'object',
          properties: {
            scenarios: { type: 'array' },
            priorities: { type: 'array' },
            response: { type: 'object' }
          }
        },
        priorities: { type: 'array' },
        procedures: { type: 'object' },
        supplies: { type: 'array' },
        training: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'conservation', 'emergency', 'preparedness']
}));

// Task 8: Staff Training
export const staffTrainingTask = defineTask('staff-training', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop staff training program',
  agent: {
    name: 'training-specialist',
    prompt: {
      role: 'museum training specialist',
      task: 'Develop collections care staff training program',
      context: args,
      instructions: [
        'Identify training needs by staff role',
        'Create handling training curriculum',
        'Develop environmental monitoring training',
        'Plan IPM awareness training',
        'Create emergency response training',
        'Develop assessment tools and checklists',
        'Plan refresher training schedule',
        'Create training documentation and records'
      ],
      outputFormat: 'JSON with program, curriculum, schedule, assessment, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['program', 'artifacts'],
      properties: {
        program: {
          type: 'object',
          properties: {
            modules: { type: 'array' },
            audiences: { type: 'array' },
            schedule: { type: 'object' }
          }
        },
        curriculum: { type: 'array' },
        schedule: { type: 'object' },
        assessment: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'conservation', 'training', 'staff']
}));

// Task 9: Documentation System
export const documentationSystemTask = defineTask('documentation-system', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create documentation system',
  agent: {
    name: 'documentation-specialist',
    prompt: {
      role: 'conservation documentation specialist',
      task: 'Create comprehensive preservation documentation system',
      context: args,
      instructions: [
        'Design environmental data reporting',
        'Create IPM monitoring reports',
        'Develop incident documentation',
        'Create preservation metrics dashboard',
        'Design annual preservation assessment report',
        'Plan digital file organization',
        'Create record retention schedule',
        'Establish documentation standards'
      ],
      outputFormat: 'JSON with system, templates, reports, standards, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['system', 'artifacts'],
      properties: {
        system: {
          type: 'object',
          properties: {
            components: { type: 'array' },
            workflow: { type: 'object' },
            storage: { type: 'object' }
          }
        },
        templates: { type: 'array' },
        reports: { type: 'array' },
        standards: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'conservation', 'documentation', 'reporting']
}));
