/**
 * @process ba-change-management-strategy
 * @description Comprehensive change management strategy development process using Kotter's
 * 8-Step model and Prosci methodology to create holistic change management plans.
 * @inputs {
 *   changeContext: { initiative: string, scope: string, objectives: object[] },
 *   readinessAssessment: object,
 *   impactAnalysis: object,
 *   stakeholderAnalysis: object,
 *   timeline: { startDate: string, endDate: string, keyMilestones: object[] },
 *   constraints: { budget: object, resources: object, dependencies: object[] }
 * }
 * @outputs {
 *   changeStrategy: object,
 *   communicationPlan: object,
 *   sponsorshipRoadmap: object,
 *   trainingStrategy: object,
 *   resistanceManagementPlan: object,
 *   reinforcementPlan: object,
 *   changeMetrics: object
 * }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// Task definitions
export const strategyFoundationTask = defineTask('strategy-foundation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish Strategy Foundation',
  agent: {
    name: 'change-strategy-architect',
    prompt: {
      role: 'Senior Change Management Consultant',
      task: 'Establish change management strategy foundation using Kotter and Prosci frameworks',
      context: args,
      instructions: [
        'Define change vision and case for change',
        'Establish strategic objectives',
        'Define change management approach',
        'Identify key success factors',
        'Define governance structure',
        'Establish principles and guiding values',
        'Create change charter',
        'Define success criteria'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        strategyFoundation: {
          type: 'object',
          properties: {
            changeVision: { type: 'string' },
            caseForChange: { type: 'object' },
            strategicObjectives: { type: 'array', items: { type: 'object' } },
            approach: { type: 'string' },
            keySuccessFactors: { type: 'array', items: { type: 'string' } },
            principles: { type: 'array', items: { type: 'string' } }
          }
        },
        governanceStructure: {
          type: 'object',
          properties: {
            steeringCommittee: { type: 'object' },
            changeNetwork: { type: 'object' },
            decisionRights: { type: 'object' }
          }
        },
        changeCharter: { type: 'object' },
        successCriteria: { type: 'array', items: { type: 'object' } }
      },
      required: ['strategyFoundation', 'governanceStructure', 'successCriteria']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const sponsorshipStrategyTask = defineTask('sponsorship-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Sponsorship Strategy',
  agent: {
    name: 'sponsorship-strategist',
    prompt: {
      role: 'Executive Sponsorship Coach',
      task: 'Develop comprehensive sponsorship strategy and roadmap',
      context: args,
      instructions: [
        'Identify sponsor coalition requirements',
        'Assess current sponsor engagement',
        'Define sponsor roles and expectations',
        'Create sponsor activation plan',
        'Design sponsor communication cadence',
        'Plan sponsor visibility activities',
        'Create sponsor coaching plan',
        'Define sponsor success metrics'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        sponsorshipRoadmap: {
          type: 'object',
          properties: {
            primarySponsor: { type: 'object' },
            sponsorCoalition: { type: 'array', items: { type: 'object' } },
            sponsorRoles: { type: 'array', items: { type: 'object' } },
            activationPlan: { type: 'array', items: { type: 'object' } },
            visibilityActivities: { type: 'array', items: { type: 'object' } }
          }
        },
        sponsorCoachingPlan: { type: 'object' },
        sponsorCommunicationPlan: { type: 'object' },
        sponsorMetrics: { type: 'array', items: { type: 'object' } }
      },
      required: ['sponsorshipRoadmap', 'sponsorCoachingPlan']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const communicationStrategyTask = defineTask('communication-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Communication Strategy',
  agent: {
    name: 'change-communication-strategist',
    prompt: {
      role: 'Change Communication Specialist',
      task: 'Develop comprehensive change communication strategy and plan',
      context: args,
      instructions: [
        'Define communication objectives by phase',
        'Identify key messages by audience',
        'Select communication channels',
        'Create communication calendar',
        'Design feedback mechanisms',
        'Plan two-way communication',
        'Create message templates',
        'Define communication metrics'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        communicationPlan: {
          type: 'object',
          properties: {
            objectives: { type: 'array', items: { type: 'object' } },
            audiences: { type: 'array', items: { type: 'object' } },
            keyMessages: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  audience: { type: 'string' },
                  message: { type: 'string' },
                  timing: { type: 'string' },
                  channel: { type: 'string' }
                }
              }
            },
            channels: { type: 'array', items: { type: 'object' } },
            calendar: { type: 'object' },
            feedbackMechanisms: { type: 'array', items: { type: 'object' } }
          }
        },
        messageTemplates: { type: 'array', items: { type: 'object' } },
        communicationMetrics: { type: 'array', items: { type: 'object' } }
      },
      required: ['communicationPlan', 'messageTemplates']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const trainingStrategyTask = defineTask('training-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Training Strategy',
  agent: {
    name: 'training-strategist',
    prompt: {
      role: 'Learning and Development Strategist',
      task: 'Develop comprehensive training and capability building strategy',
      context: args,
      instructions: [
        'Identify training needs by group',
        'Define learning objectives',
        'Design training approach and methods',
        'Create training curriculum outline',
        'Plan training delivery schedule',
        'Define training resources',
        'Design competency assessment',
        'Create sustainment plan'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        trainingStrategy: {
          type: 'object',
          properties: {
            trainingNeeds: { type: 'array', items: { type: 'object' } },
            learningObjectives: { type: 'array', items: { type: 'object' } },
            deliveryMethods: { type: 'array', items: { type: 'object' } },
            curriculum: { type: 'array', items: { type: 'object' } },
            schedule: { type: 'object' },
            resources: { type: 'object' }
          }
        },
        competencyAssessment: { type: 'object' },
        sustainmentPlan: { type: 'object' },
        trainingMetrics: { type: 'array', items: { type: 'object' } }
      },
      required: ['trainingStrategy', 'competencyAssessment']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const resistanceStrategyTask = defineTask('resistance-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Resistance Management Strategy',
  agent: {
    name: 'resistance-management-specialist',
    prompt: {
      role: 'Resistance Management Expert',
      task: 'Develop proactive and reactive resistance management strategy',
      context: args,
      instructions: [
        'Identify potential resistance sources',
        'Analyze root causes of resistance',
        'Develop proactive mitigation strategies',
        'Create reactive response plans',
        'Design resistance tracking approach',
        'Plan manager engagement for resistance',
        'Create escalation procedures',
        'Define resistance reduction metrics'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        resistanceManagementPlan: {
          type: 'object',
          properties: {
            anticipatedResistance: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  source: { type: 'string' },
                  rootCause: { type: 'string' },
                  severity: { type: 'string' },
                  proactiveMitigation: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            proactiveStrategies: { type: 'array', items: { type: 'object' } },
            reactiveResponses: { type: 'array', items: { type: 'object' } },
            managerToolkit: { type: 'object' },
            escalationProcess: { type: 'object' }
          }
        },
        resistanceTracking: { type: 'object' },
        resistanceMetrics: { type: 'array', items: { type: 'object' } }
      },
      required: ['resistanceManagementPlan', 'resistanceTracking']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const reinforcementStrategyTask = defineTask('reinforcement-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Reinforcement Strategy',
  agent: {
    name: 'reinforcement-strategist',
    prompt: {
      role: 'Behavior Change and Reinforcement Specialist',
      task: 'Develop strategy to reinforce and sustain change adoption',
      context: args,
      instructions: [
        'Design recognition and reward mechanisms',
        'Plan performance management alignment',
        'Create accountability structures',
        'Design feedback and coaching approach',
        'Plan celebration milestones',
        'Create sustainment activities',
        'Design regression prevention',
        'Define reinforcement metrics'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        reinforcementPlan: {
          type: 'object',
          properties: {
            recognitionProgram: { type: 'object' },
            rewardMechanisms: { type: 'array', items: { type: 'object' } },
            performanceAlignment: { type: 'object' },
            accountabilityStructures: { type: 'array', items: { type: 'object' } },
            feedbackMechanisms: { type: 'array', items: { type: 'object' } },
            celebrations: { type: 'array', items: { type: 'object' } }
          }
        },
        sustainmentActivities: { type: 'array', items: { type: 'object' } },
        regressionPrevention: { type: 'object' },
        reinforcementMetrics: { type: 'array', items: { type: 'object' } }
      },
      required: ['reinforcementPlan', 'sustainmentActivities']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const metricsFrameworkTask = defineTask('metrics-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define Change Metrics Framework',
  agent: {
    name: 'change-metrics-specialist',
    prompt: {
      role: 'Change Measurement and Analytics Specialist',
      task: 'Define comprehensive change management metrics and measurement framework',
      context: args,
      instructions: [
        'Define adoption metrics',
        'Define utilization metrics',
        'Define proficiency metrics',
        'Create ADKAR measurement approach',
        'Define leading indicators',
        'Define lagging indicators',
        'Create measurement dashboard',
        'Plan measurement cadence'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        changeMetrics: {
          type: 'object',
          properties: {
            adoptionMetrics: { type: 'array', items: { type: 'object' } },
            utilizationMetrics: { type: 'array', items: { type: 'object' } },
            proficiencyMetrics: { type: 'array', items: { type: 'object' } },
            adkarMetrics: { type: 'object' },
            leadingIndicators: { type: 'array', items: { type: 'object' } },
            laggingIndicators: { type: 'array', items: { type: 'object' } }
          }
        },
        measurementDashboard: { type: 'object' },
        measurementCadence: { type: 'object' },
        reportingStructure: { type: 'object' }
      },
      required: ['changeMetrics', 'measurementDashboard']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const strategyIntegrationTask = defineTask('strategy-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Integrate Change Management Strategy',
  agent: {
    name: 'strategy-integrator',
    prompt: {
      role: 'Change Management Program Lead',
      task: 'Integrate all strategy components into comprehensive change management plan',
      context: args,
      instructions: [
        'Consolidate all strategy components',
        'Align with project timeline',
        'Create integrated roadmap',
        'Define resource requirements',
        'Create risk management plan',
        'Define dependencies and sequencing',
        'Create executive summary',
        'Plan governance and review cadence'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        integratedStrategy: {
          type: 'object',
          properties: {
            executiveSummary: { type: 'object' },
            strategyOverview: { type: 'object' },
            integratedRoadmap: { type: 'object' },
            resourcePlan: { type: 'object' },
            riskManagement: { type: 'object' },
            governancePlan: { type: 'object' }
          }
        },
        implementationPlan: { type: 'object' },
        changeCalendar: { type: 'object' }
      },
      required: ['integratedStrategy', 'implementationPlan']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

// Main process function
export async function process(inputs, ctx) {
  ctx.log('Starting Change Management Strategy process');

  const artifacts = {
    strategyFoundation: null,
    sponsorshipStrategy: null,
    communicationStrategy: null,
    trainingStrategy: null,
    resistanceStrategy: null,
    reinforcementStrategy: null,
    metricsFramework: null,
    integratedStrategy: null
  };

  // Phase 1: Strategy Foundation
  ctx.log('Phase 1: Establishing strategy foundation');
  const foundationResult = await ctx.task(strategyFoundationTask, {
    changeContext: inputs.changeContext,
    readinessAssessment: inputs.readinessAssessment,
    impactAnalysis: inputs.impactAnalysis,
    timeline: inputs.timeline
  });
  artifacts.strategyFoundation = foundationResult;

  // Phase 2: Sponsorship Strategy
  ctx.log('Phase 2: Developing sponsorship strategy');
  const sponsorResult = await ctx.task(sponsorshipStrategyTask, {
    strategyFoundation: artifacts.strategyFoundation,
    stakeholderAnalysis: inputs.stakeholderAnalysis,
    changeContext: inputs.changeContext
  });
  artifacts.sponsorshipStrategy = sponsorResult;

  // Phase 3: Communication Strategy
  ctx.log('Phase 3: Developing communication strategy');
  const commResult = await ctx.task(communicationStrategyTask, {
    strategyFoundation: artifacts.strategyFoundation,
    stakeholderAnalysis: inputs.stakeholderAnalysis,
    impactAnalysis: inputs.impactAnalysis,
    timeline: inputs.timeline
  });
  artifacts.communicationStrategy = commResult;

  // Phase 4: Training Strategy
  ctx.log('Phase 4: Developing training strategy');
  const trainingResult = await ctx.task(trainingStrategyTask, {
    strategyFoundation: artifacts.strategyFoundation,
    impactAnalysis: inputs.impactAnalysis,
    readinessAssessment: inputs.readinessAssessment,
    timeline: inputs.timeline
  });
  artifacts.trainingStrategy = trainingResult;

  // Phase 5: Resistance Strategy
  ctx.log('Phase 5: Developing resistance management strategy');
  const resistanceResult = await ctx.task(resistanceStrategyTask, {
    strategyFoundation: artifacts.strategyFoundation,
    readinessAssessment: inputs.readinessAssessment,
    stakeholderAnalysis: inputs.stakeholderAnalysis,
    impactAnalysis: inputs.impactAnalysis
  });
  artifacts.resistanceStrategy = resistanceResult;

  // Phase 6: Reinforcement Strategy
  ctx.log('Phase 6: Developing reinforcement strategy');
  const reinforcementResult = await ctx.task(reinforcementStrategyTask, {
    strategyFoundation: artifacts.strategyFoundation,
    trainingStrategy: artifacts.trainingStrategy,
    changeContext: inputs.changeContext
  });
  artifacts.reinforcementStrategy = reinforcementResult;

  // Phase 7: Metrics Framework
  ctx.log('Phase 7: Defining change metrics framework');
  const metricsResult = await ctx.task(metricsFrameworkTask, {
    strategyFoundation: artifacts.strategyFoundation,
    communicationStrategy: artifacts.communicationStrategy,
    trainingStrategy: artifacts.trainingStrategy,
    changeContext: inputs.changeContext
  });
  artifacts.metricsFramework = metricsResult;

  // Breakpoint for strategy review
  await ctx.breakpoint('strategy-review', {
    question: 'Review the change management strategy components. Is the approach comprehensive and appropriate?',
    artifacts: artifacts
  });

  // Phase 8: Strategy Integration
  ctx.log('Phase 8: Integrating change management strategy');
  const integrationResult = await ctx.task(strategyIntegrationTask, {
    strategyFoundation: artifacts.strategyFoundation,
    sponsorshipStrategy: artifacts.sponsorshipStrategy,
    communicationStrategy: artifacts.communicationStrategy,
    trainingStrategy: artifacts.trainingStrategy,
    resistanceStrategy: artifacts.resistanceStrategy,
    reinforcementStrategy: artifacts.reinforcementStrategy,
    metricsFramework: artifacts.metricsFramework,
    timeline: inputs.timeline,
    constraints: inputs.constraints
  });
  artifacts.integratedStrategy = integrationResult;

  ctx.log('Change Management Strategy process completed');

  return {
    success: true,
    changeStrategy: artifacts.integratedStrategy.integratedStrategy,
    communicationPlan: artifacts.communicationStrategy.communicationPlan,
    sponsorshipRoadmap: artifacts.sponsorshipStrategy.sponsorshipRoadmap,
    trainingStrategy: artifacts.trainingStrategy.trainingStrategy,
    resistanceManagementPlan: artifacts.resistanceStrategy.resistanceManagementPlan,
    reinforcementPlan: artifacts.reinforcementStrategy.reinforcementPlan,
    changeMetrics: artifacts.metricsFramework.changeMetrics,
    artifacts
  };
}
