/**
 * @process business-analysis/stakeholder-communication-planning
 * @description Develop comprehensive communication plans addressing stakeholder information needs, preferred channels, frequency, and messaging. Support change initiatives and project governance.
 * @inputs { projectName: string, stakeholders: array, communicationContext: object, changeInitiatives: array }
 * @outputs { success: boolean, communicationPlan: object, messageTemplates: array, channelMatrix: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName = 'Project',
    stakeholders = [],
    communicationContext = {},
    changeInitiatives = [],
    outputDir = 'communication-plan-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Stakeholder Communication Planning for ${projectName}`);

  // ============================================================================
  // PHASE 1: COMMUNICATION NEEDS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing communication needs');
  const needsAnalysis = await ctx.task(communicationNeedsTask, {
    projectName,
    stakeholders,
    communicationContext,
    outputDir
  });

  artifacts.push(...needsAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: CHANNEL SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 2: Selecting communication channels');
  const channelSelection = await ctx.task(channelSelectionTask, {
    projectName,
    stakeholders,
    needsAnalysis,
    communicationContext,
    outputDir
  });

  artifacts.push(...channelSelection.artifacts);

  // ============================================================================
  // PHASE 3: MESSAGE DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Developing key messages');
  const messageDevelopment = await ctx.task(messageDevelopmentTask, {
    projectName,
    stakeholders,
    needsAnalysis,
    changeInitiatives,
    outputDir
  });

  artifacts.push(...messageDevelopment.artifacts);

  // ============================================================================
  // PHASE 4: FREQUENCY AND TIMING
  // ============================================================================

  ctx.log('info', 'Phase 4: Defining frequency and timing');
  const frequencyPlanning = await ctx.task(frequencyPlanningTask, {
    projectName,
    stakeholders,
    channelSelection,
    communicationContext,
    outputDir
  });

  artifacts.push(...frequencyPlanning.artifacts);

  // ============================================================================
  // PHASE 5: COMMUNICATION PLAN CREATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Creating communication plan');
  const communicationPlan = await ctx.task(communicationPlanTask, {
    projectName,
    stakeholders,
    needsAnalysis,
    channelSelection,
    messageDevelopment,
    frequencyPlanning,
    outputDir
  });

  artifacts.push(...communicationPlan.artifacts);

  // ============================================================================
  // PHASE 6: TEMPLATE CREATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating message templates');
  const templateCreation = await ctx.task(templateCreationTask, {
    projectName,
    messageDevelopment,
    channelSelection,
    outputDir
  });

  artifacts.push(...templateCreation.artifacts);

  // Breakpoint: Review communication plan
  await ctx.breakpoint({
    question: `Communication plan complete for ${projectName}. ${communicationPlan.communicationItems?.length || 0} communication items defined. Review and approve?`,
    title: 'Communication Plan Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        projectName,
        totalCommunicationItems: communicationPlan.communicationItems?.length || 0,
        channelsUsed: channelSelection.selectedChannels?.length || 0,
        templatesCreated: templateCreation.templates?.length || 0
      }
    }
  });

  // ============================================================================
  // PHASE 7: GOVERNANCE AND APPROVAL
  // ============================================================================

  ctx.log('info', 'Phase 7: Setting up communication governance');
  const governance = await ctx.task(communicationGovernanceTask, {
    projectName,
    communicationPlan,
    stakeholders,
    outputDir
  });

  artifacts.push(...governance.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    communicationPlan: {
      planPath: communicationPlan.planPath,
      communicationItems: communicationPlan.communicationItems,
      schedule: frequencyPlanning.schedule
    },
    messageTemplates: templateCreation.templates,
    channelMatrix: {
      channels: channelSelection.selectedChannels,
      stakeholderChannelMap: channelSelection.stakeholderChannelMap
    },
    governance: {
      approvalProcess: governance.approvalProcess,
      reviewCadence: governance.reviewCadence
    },
    artifacts,
    duration,
    metadata: {
      processId: 'business-analysis/stakeholder-communication-planning',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const communicationNeedsTask = defineTask('communication-needs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze communication needs',
  agent: {
    name: 'communication-analyst',
    prompt: {
      role: 'communication planning specialist with Prosci certification',
      task: 'Analyze stakeholder communication needs and preferences',
      context: args,
      instructions: [
        'Identify information needs for each stakeholder group',
        'Assess current awareness and understanding levels',
        'Determine desired awareness and understanding levels',
        'Identify preferred communication styles',
        'Assess communication channel preferences',
        'Identify communication barriers and concerns',
        'Determine feedback and two-way communication needs',
        'Assess timing preferences (morning, weekly, etc.)',
        'Identify language and accessibility requirements',
        'Create communication needs matrix'
      ],
      outputFormat: 'JSON with needsMatrix, preferences, barriers, gaps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['needsMatrix', 'artifacts'],
      properties: {
        needsMatrix: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholder: { type: 'string' },
              informationNeeds: { type: 'array', items: { type: 'string' } },
              currentAwareness: { type: 'string', enum: ['none', 'low', 'medium', 'high'] },
              targetAwareness: { type: 'string', enum: ['low', 'medium', 'high'] },
              preferredChannels: { type: 'array', items: { type: 'string' } },
              preferredFrequency: { type: 'string' }
            }
          }
        },
        preferences: { type: 'object' },
        barriers: { type: 'array', items: { type: 'string' } },
        gaps: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'communication', 'needs-analysis']
}));

export const channelSelectionTask = defineTask('channel-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select communication channels',
  agent: {
    name: 'communication-specialist',
    prompt: {
      role: 'corporate communications specialist',
      task: 'Select appropriate communication channels for each stakeholder group',
      context: args,
      instructions: [
        'Evaluate available communication channels',
        'Match channels to stakeholder preferences',
        'Consider channel reach and effectiveness',
        'Assess channel richness (ability to convey nuance)',
        'Consider interactive vs broadcast channels',
        'Evaluate formal vs informal channels',
        'Consider digital vs in-person channels',
        'Assess cost and resource requirements',
        'Create stakeholder-channel matrix',
        'Document channel selection rationale'
      ],
      outputFormat: 'JSON with selectedChannels, stakeholderChannelMap, channelEvaluation, rationale, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['selectedChannels', 'stakeholderChannelMap', 'artifacts'],
      properties: {
        selectedChannels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              channel: { type: 'string' },
              type: { type: 'string', enum: ['digital', 'in-person', 'print', 'hybrid'] },
              reach: { type: 'string', enum: ['broad', 'targeted', 'individual'] },
              richness: { type: 'string', enum: ['high', 'medium', 'low'] },
              cost: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        stakeholderChannelMap: { type: 'object' },
        channelEvaluation: { type: 'array', items: { type: 'object' } },
        rationale: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'communication', 'channels']
}));

export const messageDevelopmentTask = defineTask('message-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop key messages',
  agent: {
    name: 'message-developer',
    prompt: {
      role: 'strategic communications writer',
      task: 'Develop key messages for different stakeholder groups',
      context: args,
      instructions: [
        'Develop overarching project/change messages',
        'Tailor messages for each stakeholder group',
        'Address "What is it?" questions',
        'Address "Why is it happening?" questions',
        'Address "What does it mean for me?" questions',
        'Address "What do I need to do?" questions',
        'Develop messages for different phases',
        'Create positive framing for changes',
        'Address anticipated concerns proactively',
        'Ensure message consistency across channels'
      ],
      outputFormat: 'JSON with keyMessages, stakeholderMessages, messageFramework, concernResponses, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['keyMessages', 'stakeholderMessages', 'artifacts'],
      properties: {
        keyMessages: {
          type: 'object',
          properties: {
            whatIsIt: { type: 'string' },
            whyChange: { type: 'string' },
            benefits: { type: 'array', items: { type: 'string' } },
            timeline: { type: 'string' }
          }
        },
        stakeholderMessages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholder: { type: 'string' },
              keyMessage: { type: 'string' },
              whatItMeans: { type: 'string' },
              callToAction: { type: 'string' }
            }
          }
        },
        messageFramework: { type: 'object' },
        concernResponses: { type: 'array', items: { type: 'object' } },
        phaseMessages: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'communication', 'messaging']
}));

export const frequencyPlanningTask = defineTask('frequency-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan communication frequency',
  agent: {
    name: 'communication-planner',
    prompt: {
      role: 'project communications planner',
      task: 'Define communication frequency and timing',
      context: args,
      instructions: [
        'Define communication frequency per stakeholder',
        'Create communication calendar',
        'Align with project milestones',
        'Plan for launch/go-live communications',
        'Schedule regular update cadence',
        'Plan for ad-hoc communications',
        'Consider organizational calendar (holidays, busy periods)',
        'Define timing for different channels',
        'Create communication schedule',
        'Plan feedback collection timing'
      ],
      outputFormat: 'JSON with schedule, calendar, milestoneComms, cadence, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['schedule', 'artifacts'],
      properties: {
        schedule: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholder: { type: 'string' },
              frequency: { type: 'string' },
              preferredDay: { type: 'string' },
              preferredTime: { type: 'string' },
              channel: { type: 'string' }
            }
          }
        },
        calendar: { type: 'array', items: { type: 'object' } },
        milestoneComms: { type: 'array', items: { type: 'object' } },
        cadence: {
          type: 'object',
          properties: {
            weekly: { type: 'array', items: { type: 'string' } },
            biweekly: { type: 'array', items: { type: 'string' } },
            monthly: { type: 'array', items: { type: 'string' } },
            asNeeded: { type: 'array', items: { type: 'string' } }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'communication', 'scheduling']
}));

export const communicationPlanTask = defineTask('communication-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create communication plan',
  agent: {
    name: 'communication-planner',
    prompt: {
      role: 'senior communication strategist',
      task: 'Create comprehensive communication plan document',
      context: args,
      instructions: [
        'Consolidate all communication planning elements',
        'Create communication matrix (who, what, when, how)',
        'Define communication objectives',
        'Document target audiences',
        'Include key messages',
        'Define channels and frequency',
        'Include success metrics',
        'Define feedback mechanisms',
        'Include escalation paths',
        'Create plan document'
      ],
      outputFormat: 'JSON with planPath, communicationItems, objectives, metrics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['planPath', 'communicationItems', 'artifacts'],
      properties: {
        planPath: { type: 'string' },
        communicationItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              audience: { type: 'string' },
              message: { type: 'string' },
              channel: { type: 'string' },
              frequency: { type: 'string' },
              owner: { type: 'string' },
              timing: { type: 'string' }
            }
          }
        },
        objectives: { type: 'array', items: { type: 'string' } },
        metrics: { type: 'array', items: { type: 'string' } },
        feedbackMechanisms: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'communication', 'planning']
}));

export const templateCreationTask = defineTask('template-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create message templates',
  agent: {
    name: 'content-creator',
    prompt: {
      role: 'corporate communications content creator',
      task: 'Create reusable message templates for communications',
      context: args,
      instructions: [
        'Create email templates for different purposes',
        'Create meeting agenda templates',
        'Create presentation templates',
        'Create newsletter templates',
        'Create FAQ templates',
        'Create announcement templates',
        'Include placeholders for customization',
        'Ensure brand consistency',
        'Include call-to-action elements',
        'Create template usage guide'
      ],
      outputFormat: 'JSON with templates, templateGuide, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['templates', 'artifacts'],
      properties: {
        templates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              purpose: { type: 'string' },
              content: { type: 'string' },
              placeholders: { type: 'array', items: { type: 'string' } },
              usageGuidance: { type: 'string' }
            }
          }
        },
        templateGuide: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'communication', 'templates']
}));

export const communicationGovernanceTask = defineTask('communication-governance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Setup communication governance',
  agent: {
    name: 'governance-specialist',
    prompt: {
      role: 'communication governance specialist',
      task: 'Setup governance for communication plan execution',
      context: args,
      instructions: [
        'Define communication approval process',
        'Establish review and approval levels',
        'Define content review cadence',
        'Establish feedback review process',
        'Define metrics tracking process',
        'Create escalation procedures',
        'Define plan update process',
        'Establish communication ownership',
        'Define quality standards',
        'Create governance documentation'
      ],
      outputFormat: 'JSON with approvalProcess, reviewCadence, ownership, qualityStandards, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['approvalProcess', 'reviewCadence', 'artifacts'],
      properties: {
        approvalProcess: {
          type: 'object',
          properties: {
            levels: { type: 'array', items: { type: 'object' } },
            approvers: { type: 'array', items: { type: 'string' } },
            turnaround: { type: 'string' }
          }
        },
        reviewCadence: {
          type: 'object',
          properties: {
            frequency: { type: 'string' },
            participants: { type: 'array', items: { type: 'string' } },
            agenda: { type: 'array', items: { type: 'string' } }
          }
        },
        ownership: { type: 'object' },
        qualityStandards: { type: 'array', items: { type: 'string' } },
        escalationProcedures: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'communication', 'governance']
}));
