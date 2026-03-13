/**
 * @process business-analysis/stakeholder-analysis
 * @description Identify, categorize, and analyze stakeholders using Power-Interest grids, Salience model, and influence mapping. Develop tailored engagement strategies for each stakeholder group.
 * @inputs { projectName: string, projectContext: object, knownStakeholders: array, organizationStructure: object }
 * @outputs { success: boolean, stakeholderRegister: object, powerInterestMatrix: object, engagementStrategy: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName = 'Project',
    projectContext = {},
    knownStakeholders = [],
    organizationStructure = {},
    outputDir = 'stakeholder-analysis-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Stakeholder Analysis for ${projectName}`);

  // ============================================================================
  // PHASE 1: STAKEHOLDER IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Identifying stakeholders');
  const stakeholderIdentification = await ctx.task(stakeholderIdentificationTask, {
    projectName,
    projectContext,
    knownStakeholders,
    organizationStructure,
    outputDir
  });

  artifacts.push(...stakeholderIdentification.artifacts);

  // ============================================================================
  // PHASE 2: STAKEHOLDER CATEGORIZATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Categorizing stakeholders');
  const stakeholderCategorization = await ctx.task(stakeholderCategorizationTask, {
    projectName,
    stakeholders: stakeholderIdentification.stakeholders,
    projectContext,
    outputDir
  });

  artifacts.push(...stakeholderCategorization.artifacts);

  // ============================================================================
  // PHASE 3: POWER-INTEREST ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing power and interest levels');
  const powerInterestAnalysis = await ctx.task(powerInterestAnalysisTask, {
    projectName,
    stakeholders: stakeholderCategorization.categorizedStakeholders,
    projectContext,
    outputDir
  });

  artifacts.push(...powerInterestAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: SALIENCE MODEL ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Applying salience model');
  const salienceAnalysis = await ctx.task(salienceAnalysisTask, {
    projectName,
    stakeholders: stakeholderCategorization.categorizedStakeholders,
    powerInterestAnalysis,
    outputDir
  });

  artifacts.push(...salienceAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: INFLUENCE MAPPING
  // ============================================================================

  ctx.log('info', 'Phase 5: Creating influence map');
  const influenceMapping = await ctx.task(influenceMappingTask, {
    projectName,
    stakeholders: stakeholderCategorization.categorizedStakeholders,
    powerInterestAnalysis,
    salienceAnalysis,
    outputDir
  });

  artifacts.push(...influenceMapping.artifacts);

  // ============================================================================
  // PHASE 6: STAKEHOLDER NEEDS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing stakeholder needs and expectations');
  const needsAnalysis = await ctx.task(needsAnalysisTask, {
    projectName,
    stakeholders: stakeholderCategorization.categorizedStakeholders,
    powerInterestAnalysis,
    projectContext,
    outputDir
  });

  artifacts.push(...needsAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: ENGAGEMENT STRATEGY DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 7: Developing engagement strategies');
  const engagementStrategy = await ctx.task(engagementStrategyTask, {
    projectName,
    stakeholders: stakeholderCategorization.categorizedStakeholders,
    powerInterestAnalysis,
    salienceAnalysis,
    influenceMapping,
    needsAnalysis,
    outputDir
  });

  artifacts.push(...engagementStrategy.artifacts);

  // ============================================================================
  // PHASE 8: STAKEHOLDER REGISTER CREATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Creating stakeholder register');
  const stakeholderRegister = await ctx.task(stakeholderRegisterTask, {
    projectName,
    stakeholders: stakeholderCategorization.categorizedStakeholders,
    powerInterestAnalysis,
    salienceAnalysis,
    needsAnalysis,
    engagementStrategy,
    outputDir
  });

  artifacts.push(...stakeholderRegister.artifacts);

  // Breakpoint: Review stakeholder analysis
  await ctx.breakpoint({
    question: `Stakeholder analysis complete for ${projectName}. ${stakeholderIdentification.stakeholders?.length || 0} stakeholders identified. Review and approve?`,
    title: 'Stakeholder Analysis Review',
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
        totalStakeholders: stakeholderIdentification.stakeholders?.length || 0,
        keyPlayers: powerInterestAnalysis.keyPlayers?.length || 0,
        highPriorityStakeholders: salienceAnalysis.definitiveStakeholders?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    stakeholderRegister: {
      registerPath: stakeholderRegister.registerPath,
      totalStakeholders: stakeholderIdentification.stakeholders?.length || 0,
      stakeholders: stakeholderRegister.register
    },
    powerInterestMatrix: {
      keyPlayers: powerInterestAnalysis.keyPlayers,
      keepSatisfied: powerInterestAnalysis.keepSatisfied,
      keepInformed: powerInterestAnalysis.keepInformed,
      monitor: powerInterestAnalysis.monitor,
      matrixPath: powerInterestAnalysis.matrixPath
    },
    salienceModel: {
      definitiveStakeholders: salienceAnalysis.definitiveStakeholders,
      expectantStakeholders: salienceAnalysis.expectantStakeholders,
      latentStakeholders: salienceAnalysis.latentStakeholders
    },
    influenceMap: {
      influencers: influenceMapping.keyInfluencers,
      networkPath: influenceMapping.networkPath
    },
    engagementStrategy: {
      strategies: engagementStrategy.strategies,
      communicationPlan: engagementStrategy.communicationPlan
    },
    artifacts,
    duration,
    metadata: {
      processId: 'business-analysis/stakeholder-analysis',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const stakeholderIdentificationTask = defineTask('stakeholder-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify stakeholders',
  agent: {
    name: 'business-analyst',
    prompt: {
      role: 'senior business analyst with stakeholder management expertise',
      task: 'Identify all stakeholders for the project',
      context: args,
      instructions: [
        'Identify internal stakeholders (executives, managers, employees)',
        'Identify external stakeholders (customers, partners, regulators)',
        'Review organizational structure for impacted roles',
        'Identify project sponsors and decision-makers',
        'Identify subject matter experts',
        'Identify end users and beneficiaries',
        'Identify potentially resistant stakeholders',
        'Identify indirect stakeholders',
        'Document stakeholder names and roles',
        'Create initial stakeholder list'
      ],
      outputFormat: 'JSON with stakeholders, internalStakeholders, externalStakeholders, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['stakeholders', 'artifacts'],
      properties: {
        stakeholders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              role: { type: 'string' },
              department: { type: 'string' },
              type: { type: 'string', enum: ['internal', 'external'] },
              contact: { type: 'string' }
            }
          }
        },
        internalStakeholders: { type: 'array', items: { type: 'string' } },
        externalStakeholders: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'stakeholder', 'identification']
}));

export const stakeholderCategorizationTask = defineTask('stakeholder-categorization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Categorize stakeholders',
  agent: {
    name: 'business-analyst',
    prompt: {
      role: 'stakeholder management specialist',
      task: 'Categorize stakeholders by role, impact, and relationship to project',
      context: args,
      instructions: [
        'Categorize by role (sponsor, decision-maker, influencer, user, affected party)',
        'Categorize by impact (directly impacted, indirectly impacted)',
        'Categorize by attitude (supportive, neutral, resistant)',
        'Identify primary vs secondary stakeholders',
        'Group stakeholders by department/function',
        'Identify stakeholder groups with common interests',
        'Document stakeholder relationships',
        'Identify coalition potential',
        'Create stakeholder groupings',
        'Document categorization rationale'
      ],
      outputFormat: 'JSON with categorizedStakeholders, byRole, byImpact, byAttitude, groups, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['categorizedStakeholders', 'artifacts'],
      properties: {
        categorizedStakeholders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              role: { type: 'string' },
              category: { type: 'string' },
              impactLevel: { type: 'string', enum: ['direct', 'indirect'] },
              attitude: { type: 'string', enum: ['supportive', 'neutral', 'resistant'] },
              isPrimary: { type: 'boolean' }
            }
          }
        },
        byRole: { type: 'object' },
        byImpact: { type: 'object' },
        byAttitude: { type: 'object' },
        groups: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'stakeholder', 'categorization']
}));

export const powerInterestAnalysisTask = defineTask('power-interest-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze power and interest',
  agent: {
    name: 'stakeholder-analyst',
    prompt: {
      role: 'stakeholder analysis specialist',
      task: 'Analyze stakeholder power and interest levels for Power-Interest grid',
      context: args,
      instructions: [
        'Assess power level (ability to influence project) for each stakeholder',
        'Assess interest level (concern about project outcomes) for each stakeholder',
        'Rate power: High/Low based on authority, resources, expertise',
        'Rate interest: High/Low based on impact on their work, personal stake',
        'Classify into quadrants: Key Players, Keep Satisfied, Keep Informed, Monitor',
        'Key Players (High Power, High Interest): Manage closely',
        'Keep Satisfied (High Power, Low Interest): Keep satisfied',
        'Keep Informed (Low Power, High Interest): Keep informed',
        'Monitor (Low Power, Low Interest): Monitor with minimum effort',
        'Create Power-Interest matrix visualization'
      ],
      outputFormat: 'JSON with matrixPath, keyPlayers, keepSatisfied, keepInformed, monitor, stakeholderRatings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['keyPlayers', 'keepSatisfied', 'keepInformed', 'monitor', 'artifacts'],
      properties: {
        matrixPath: { type: 'string' },
        keyPlayers: { type: 'array', items: { type: 'string' } },
        keepSatisfied: { type: 'array', items: { type: 'string' } },
        keepInformed: { type: 'array', items: { type: 'string' } },
        monitor: { type: 'array', items: { type: 'string' } },
        stakeholderRatings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              power: { type: 'string', enum: ['high', 'low'] },
              interest: { type: 'string', enum: ['high', 'low'] },
              quadrant: { type: 'string' },
              strategy: { type: 'string' }
            }
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
  labels: ['agent', 'business-analysis', 'stakeholder', 'power-interest']
}));

export const salienceAnalysisTask = defineTask('salience-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply salience model',
  agent: {
    name: 'stakeholder-analyst',
    prompt: {
      role: 'stakeholder theory specialist',
      task: 'Apply Mitchell-Agle-Wood Salience Model to prioritize stakeholders',
      context: args,
      instructions: [
        'Assess Power: ability to impose will',
        'Assess Legitimacy: appropriateness of stakeholder claims',
        'Assess Urgency: time-sensitivity and criticality of claims',
        'Classify Definitive stakeholders (all 3 attributes): highest priority',
        'Classify Expectant stakeholders (2 attributes): moderate priority',
        'Classify Latent stakeholders (1 attribute): low priority',
        'Definitive: Dominant, Dependent, Dangerous',
        'Expectant: Discretionary, Demanding',
        'Latent: Dormant, Non-stakeholders',
        'Create salience diagram'
      ],
      outputFormat: 'JSON with definitiveStakeholders, expectantStakeholders, latentStakeholders, salienceRatings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['definitiveStakeholders', 'expectantStakeholders', 'latentStakeholders', 'artifacts'],
      properties: {
        definitiveStakeholders: { type: 'array', items: { type: 'string' } },
        expectantStakeholders: { type: 'array', items: { type: 'string' } },
        latentStakeholders: { type: 'array', items: { type: 'string' } },
        salienceRatings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              power: { type: 'boolean' },
              legitimacy: { type: 'boolean' },
              urgency: { type: 'boolean' },
              classification: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'moderate', 'low'] }
            }
          }
        },
        diagramPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'stakeholder', 'salience']
}));

export const influenceMappingTask = defineTask('influence-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create influence map',
  agent: {
    name: 'network-analyst',
    prompt: {
      role: 'organizational network analyst',
      task: 'Map stakeholder influence relationships and networks',
      context: args,
      instructions: [
        'Identify influence relationships between stakeholders',
        'Map formal reporting relationships',
        'Map informal influence networks',
        'Identify key influencers and opinion leaders',
        'Identify gatekeepers and blockers',
        'Map coalition and alliance potential',
        'Identify communication pathways',
        'Assess influence direction and strength',
        'Create network visualization',
        'Identify leverage points for engagement'
      ],
      outputFormat: 'JSON with keyInfluencers, relationships, networkPath, leveragePoints, coalitions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['keyInfluencers', 'relationships', 'artifacts'],
      properties: {
        keyInfluencers: { type: 'array', items: { type: 'string' } },
        relationships: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              from: { type: 'string' },
              to: { type: 'string' },
              type: { type: 'string' },
              strength: { type: 'string', enum: ['strong', 'moderate', 'weak'] }
            }
          }
        },
        networkPath: { type: 'string' },
        gatekeepers: { type: 'array', items: { type: 'string' } },
        blockers: { type: 'array', items: { type: 'string' } },
        coalitions: { type: 'array', items: { type: 'object' } },
        leveragePoints: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'stakeholder', 'influence']
}));

export const needsAnalysisTask = defineTask('needs-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze stakeholder needs',
  agent: {
    name: 'business-analyst',
    prompt: {
      role: 'stakeholder needs analyst',
      task: 'Analyze stakeholder needs, expectations, and concerns',
      context: args,
      instructions: [
        'Document stated needs for each stakeholder',
        'Identify unstated/implied needs',
        'Document expectations from the project',
        'Identify concerns and fears',
        'Document success criteria per stakeholder',
        'Identify potential conflicts between stakeholders',
        'Document communication preferences',
        'Identify information needs',
        'Document involvement preferences',
        'Create needs matrix'
      ],
      outputFormat: 'JSON with needsMatrix, expectations, concerns, conflicts, communicationPreferences, artifacts'
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
              statedNeeds: { type: 'array', items: { type: 'string' } },
              impliedNeeds: { type: 'array', items: { type: 'string' } },
              expectations: { type: 'array', items: { type: 'string' } },
              concerns: { type: 'array', items: { type: 'string' } },
              successCriteria: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        expectations: { type: 'object' },
        concerns: { type: 'array', items: { type: 'object' } },
        conflicts: { type: 'array', items: { type: 'object' } },
        communicationPreferences: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'stakeholder', 'needs']
}));

export const engagementStrategyTask = defineTask('engagement-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop engagement strategies',
  agent: {
    name: 'engagement-strategist',
    prompt: {
      role: 'stakeholder engagement strategist',
      task: 'Develop tailored engagement strategies for each stakeholder group',
      context: args,
      instructions: [
        'Define engagement approach per quadrant (Power-Interest)',
        'Tailor strategies for definitive stakeholders',
        'Define communication frequency and channels',
        'Specify involvement level (inform, consult, involve, collaborate, empower)',
        'Address identified concerns and needs',
        'Develop resistance management tactics',
        'Create coalition building strategies',
        'Define escalation paths',
        'Create communication plan',
        'Define feedback mechanisms'
      ],
      outputFormat: 'JSON with strategies, communicationPlan, resistanceManagement, feedbackMechanisms, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'communicationPlan', 'artifacts'],
      properties: {
        strategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholder: { type: 'string' },
              engagementLevel: { type: 'string', enum: ['inform', 'consult', 'involve', 'collaborate', 'empower'] },
              communicationChannel: { type: 'array', items: { type: 'string' } },
              frequency: { type: 'string' },
              keyMessages: { type: 'array', items: { type: 'string' } },
              tactics: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        communicationPlan: {
          type: 'object',
          properties: {
            channels: { type: 'array', items: { type: 'string' } },
            frequency: { type: 'object' },
            templates: { type: 'array', items: { type: 'string' } }
          }
        },
        resistanceManagement: { type: 'array', items: { type: 'object' } },
        coalitionStrategies: { type: 'array', items: { type: 'object' } },
        feedbackMechanisms: { type: 'array', items: { type: 'string' } },
        escalationPaths: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'stakeholder', 'engagement']
}));

export const stakeholderRegisterTask = defineTask('stakeholder-register', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create stakeholder register',
  agent: {
    name: 'documentation-specialist',
    prompt: {
      role: 'stakeholder documentation specialist',
      task: 'Create comprehensive stakeholder register document',
      context: args,
      instructions: [
        'Compile all stakeholder information into register',
        'Include identification details',
        'Include categorization and classification',
        'Include power/interest/salience ratings',
        'Include needs and expectations',
        'Include engagement strategy',
        'Include communication plan',
        'Create register template',
        'Define update and maintenance process',
        'Create register visualization'
      ],
      outputFormat: 'JSON with registerPath, register, summary, updateProcess, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['registerPath', 'register', 'artifacts'],
      properties: {
        registerPath: { type: 'string' },
        register: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              role: { type: 'string' },
              category: { type: 'string' },
              power: { type: 'string' },
              interest: { type: 'string' },
              salience: { type: 'string' },
              needs: { type: 'array', items: { type: 'string' } },
              engagementStrategy: { type: 'string' },
              communicationChannel: { type: 'string' },
              frequency: { type: 'string' }
            }
          }
        },
        summary: { type: 'object' },
        updateProcess: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'business-analysis', 'stakeholder', 'register']
}));
