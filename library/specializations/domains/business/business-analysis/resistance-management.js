/**
 * @process ba-resistance-management
 * @description Comprehensive resistance management process for proactive identification,
 * analysis, and mitigation of resistance to organizational change initiatives.
 * @inputs {
 *   changeContext: { initiative: string, scope: string, timeline: string },
 *   stakeholderGroups: object[],
 *   impactAnalysis: object,
 *   readinessAssessment: object,
 *   resistanceIndicators: object[]
 * }
 * @outputs {
 *   resistanceAnalysis: object,
 *   rootCauseAnalysis: object,
 *   mitigationStrategies: object[],
 *   managerToolkit: object,
 *   monitoringPlan: object,
 *   escalationProcedures: object
 * }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// Task definitions
export const resistanceIdentificationTask = defineTask('resistance-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify Resistance Sources',
  agent: {
    name: 'resistance-identifier',
    prompt: {
      role: 'Organizational Change Psychologist',
      task: 'Systematically identify sources and manifestations of resistance',
      context: args,
      instructions: [
        'Identify resistance by stakeholder group',
        'Categorize resistance types (active, passive, covert)',
        'Identify resistance manifestations',
        'Assess resistance intensity levels',
        'Map resistance patterns',
        'Identify resistance influencers',
        'Detect early warning signs',
        'Create resistance heat map'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        resistanceAnalysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholderGroup: { type: 'string' },
              size: { type: 'number' },
              resistanceType: { type: 'string', enum: ['active', 'passive', 'covert', 'minimal'] },
              manifestations: { type: 'array', items: { type: 'string' } },
              intensityLevel: { type: 'string' },
              keyInfluencers: { type: 'array', items: { type: 'object' } },
              earlyWarnings: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        resistanceHeatMap: { type: 'object' },
        highRiskGroups: { type: 'array', items: { type: 'object' } }
      },
      required: ['resistanceAnalysis', 'highRiskGroups']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const rootCauseAnalysisTask = defineTask('resistance-root-cause', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Root Causes of Resistance',
  agent: {
    name: 'root-cause-analyst',
    prompt: {
      role: 'Change Resistance Analyst',
      task: 'Analyze root causes of resistance using multiple diagnostic frameworks',
      context: args,
      instructions: [
        'Apply ADKAR barrier analysis',
        'Identify personal impact concerns',
        'Analyze organizational trust factors',
        'Assess change history influences',
        'Identify capability concerns',
        'Analyze competing priorities',
        'Assess cultural factors',
        'Map root causes to resistance behaviors'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        rootCauseAnalysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholderGroup: { type: 'string' },
              rootCauses: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    cause: { type: 'string' },
                    category: { type: 'string' },
                    adkarBarrier: { type: 'string' },
                    severity: { type: 'string' },
                    addressability: { type: 'string' }
                  }
                }
              },
              primaryBarrier: { type: 'string' },
              underlyingConcerns: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        rootCauseCategories: {
          type: 'object',
          properties: {
            awareness: { type: 'array', items: { type: 'object' } },
            desire: { type: 'array', items: { type: 'object' } },
            knowledge: { type: 'array', items: { type: 'object' } },
            ability: { type: 'array', items: { type: 'object' } },
            reinforcement: { type: 'array', items: { type: 'object' } }
          }
        },
        prioritizedCauses: { type: 'array', items: { type: 'object' } }
      },
      required: ['rootCauseAnalysis', 'prioritizedCauses']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const mitigationStrategyTask = defineTask('mitigation-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Mitigation Strategies',
  agent: {
    name: 'mitigation-strategist',
    prompt: {
      role: 'Resistance Mitigation Specialist',
      task: 'Develop targeted mitigation strategies for identified resistance',
      context: args,
      instructions: [
        'Design proactive mitigation strategies',
        'Create reactive response strategies',
        'Match strategies to root causes',
        'Define intervention timing',
        'Identify strategy owners',
        'Plan resource requirements',
        'Define success indicators',
        'Create strategy playbook'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        mitigationStrategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              strategyId: { type: 'string' },
              targetGroup: { type: 'string' },
              rootCause: { type: 'string' },
              strategyType: { type: 'string', enum: ['proactive', 'reactive'] },
              strategy: { type: 'string' },
              tactics: { type: 'array', items: { type: 'string' } },
              timing: { type: 'string' },
              owner: { type: 'string' },
              resources: { type: 'array', items: { type: 'string' } },
              successIndicators: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        strategyPlaybook: { type: 'object' },
        resourceRequirements: { type: 'object' }
      },
      required: ['mitigationStrategies', 'strategyPlaybook']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const managerToolkitTask = defineTask('manager-toolkit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Manager Resistance Toolkit',
  agent: {
    name: 'manager-toolkit-developer',
    prompt: {
      role: 'People Manager Support Specialist',
      task: 'Create comprehensive toolkit for managers to address resistance',
      context: args,
      instructions: [
        'Create resistance identification guide',
        'Develop conversation frameworks',
        'Create FAQ and objection handling guide',
        'Design coaching conversation scripts',
        'Develop feedback collection tools',
        'Create escalation guidelines',
        'Design team meeting agendas',
        'Create manager quick reference'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        managerToolkit: {
          type: 'object',
          properties: {
            identificationGuide: { type: 'object' },
            conversationFrameworks: { type: 'array', items: { type: 'object' } },
            objectionHandling: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  objection: { type: 'string' },
                  response: { type: 'string' },
                  followUp: { type: 'string' }
                }
              }
            },
            coachingScripts: { type: 'array', items: { type: 'object' } },
            feedbackTools: { type: 'array', items: { type: 'object' } },
            escalationGuidelines: { type: 'object' },
            meetingAgendas: { type: 'array', items: { type: 'object' } }
          }
        },
        quickReferenceCard: { type: 'object' },
        trainingForManagers: { type: 'object' }
      },
      required: ['managerToolkit', 'quickReferenceCard']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const engagementInterventionsTask = defineTask('engagement-interventions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Engagement Interventions',
  agent: {
    name: 'engagement-designer',
    prompt: {
      role: 'Employee Engagement Specialist',
      task: 'Design targeted engagement interventions to convert resistors',
      context: args,
      instructions: [
        'Design involvement opportunities',
        'Create input and feedback mechanisms',
        'Plan pilot participation programs',
        'Design ambassador/champion programs',
        'Create recognition approaches',
        'Plan relationship-building activities',
        'Design win demonstration events',
        'Create success story campaigns'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        engagementInterventions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              interventionId: { type: 'string' },
              name: { type: 'string' },
              targetGroup: { type: 'string' },
              purpose: { type: 'string' },
              description: { type: 'string' },
              timing: { type: 'string' },
              resources: { type: 'array', items: { type: 'string' } },
              expectedOutcome: { type: 'string' }
            }
          }
        },
        ambassadorProgram: { type: 'object' },
        feedbackMechanisms: { type: 'array', items: { type: 'object' } },
        recognitionProgram: { type: 'object' }
      },
      required: ['engagementInterventions']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const monitoringPlanTask = defineTask('resistance-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Resistance Monitoring Plan',
  agent: {
    name: 'resistance-monitor',
    prompt: {
      role: 'Change Analytics Specialist',
      task: 'Create comprehensive resistance monitoring and tracking plan',
      context: args,
      instructions: [
        'Define resistance metrics and KPIs',
        'Create monitoring dashboard design',
        'Plan data collection methods',
        'Define tracking frequency',
        'Create trend analysis approach',
        'Design early warning system',
        'Plan reporting cadence',
        'Create action trigger thresholds'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        monitoringPlan: {
          type: 'object',
          properties: {
            metrics: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  metric: { type: 'string' },
                  description: { type: 'string' },
                  dataSource: { type: 'string' },
                  frequency: { type: 'string' },
                  threshold: { type: 'object' }
                }
              }
            },
            dataCollection: { type: 'object' },
            dashboardDesign: { type: 'object' },
            earlyWarningSystem: { type: 'object' },
            reportingCadence: { type: 'object' }
          }
        },
        actionTriggers: { type: 'array', items: { type: 'object' } },
        trendAnalysis: { type: 'object' }
      },
      required: ['monitoringPlan', 'actionTriggers']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const escalationProceduresTask = defineTask('escalation-procedures', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define Escalation Procedures',
  agent: {
    name: 'escalation-designer',
    prompt: {
      role: 'Issue Resolution Specialist',
      task: 'Design clear escalation procedures for severe resistance situations',
      context: args,
      instructions: [
        'Define escalation levels',
        'Create escalation criteria',
        'Define escalation paths',
        'Identify escalation owners',
        'Create response protocols',
        'Define resolution timeframes',
        'Plan executive involvement',
        'Create documentation requirements'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        escalationProcedures: {
          type: 'object',
          properties: {
            levels: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  level: { type: 'number' },
                  name: { type: 'string' },
                  criteria: { type: 'array', items: { type: 'string' } },
                  owner: { type: 'string' },
                  responseTime: { type: 'string' },
                  actions: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            escalationPath: { type: 'object' },
            responseProtocols: { type: 'array', items: { type: 'object' } },
            executiveInvolvement: { type: 'object' }
          }
        },
        documentationRequirements: { type: 'object' },
        resolutionProcess: { type: 'object' }
      },
      required: ['escalationProcedures', 'resolutionProcess']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const resistancePlanIntegrationTask = defineTask('resistance-plan-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Integrate Resistance Management Plan',
  agent: {
    name: 'plan-integrator',
    prompt: {
      role: 'Resistance Management Program Lead',
      task: 'Integrate all components into comprehensive resistance management plan',
      context: args,
      instructions: [
        'Consolidate all plan components',
        'Create integrated timeline',
        'Define roles and responsibilities',
        'Create resource summary',
        'Define governance structure',
        'Create executive summary',
        'Plan review and update cycle',
        'Create implementation checklist'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        integratedPlan: {
          type: 'object',
          properties: {
            executiveSummary: { type: 'object' },
            planOverview: { type: 'object' },
            timeline: { type: 'object' },
            rolesResponsibilities: { type: 'array', items: { type: 'object' } },
            resourceSummary: { type: 'object' },
            governance: { type: 'object' }
          }
        },
        implementationChecklist: { type: 'object' },
        reviewCycle: { type: 'object' }
      },
      required: ['integratedPlan', 'implementationChecklist']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

// Main process function
export async function process(inputs, ctx) {
  ctx.log('Starting Resistance Management process');

  const artifacts = {
    resistanceAnalysis: null,
    rootCauseAnalysis: null,
    mitigationStrategies: null,
    managerToolkit: null,
    engagementInterventions: null,
    monitoringPlan: null,
    escalationProcedures: null,
    integratedPlan: null
  };

  // Phase 1: Resistance Identification
  ctx.log('Phase 1: Identifying resistance sources');
  const identificationResult = await ctx.task(resistanceIdentificationTask, {
    changeContext: inputs.changeContext,
    stakeholderGroups: inputs.stakeholderGroups,
    impactAnalysis: inputs.impactAnalysis,
    resistanceIndicators: inputs.resistanceIndicators
  });
  artifacts.resistanceAnalysis = identificationResult;

  // Phase 2: Root Cause Analysis
  ctx.log('Phase 2: Analyzing root causes of resistance');
  const rootCauseResult = await ctx.task(rootCauseAnalysisTask, {
    resistanceAnalysis: artifacts.resistanceAnalysis,
    readinessAssessment: inputs.readinessAssessment,
    impactAnalysis: inputs.impactAnalysis
  });
  artifacts.rootCauseAnalysis = rootCauseResult;

  // Phase 3: Mitigation Strategy Development
  ctx.log('Phase 3: Developing mitigation strategies');
  const mitigationResult = await ctx.task(mitigationStrategyTask, {
    resistanceAnalysis: artifacts.resistanceAnalysis,
    rootCauseAnalysis: artifacts.rootCauseAnalysis,
    changeContext: inputs.changeContext
  });
  artifacts.mitigationStrategies = mitigationResult;

  // Phase 4: Manager Toolkit Creation
  ctx.log('Phase 4: Creating manager resistance toolkit');
  const toolkitResult = await ctx.task(managerToolkitTask, {
    resistanceAnalysis: artifacts.resistanceAnalysis,
    rootCauseAnalysis: artifacts.rootCauseAnalysis,
    mitigationStrategies: artifacts.mitigationStrategies
  });
  artifacts.managerToolkit = toolkitResult;

  // Phase 5: Engagement Interventions
  ctx.log('Phase 5: Designing engagement interventions');
  const engagementResult = await ctx.task(engagementInterventionsTask, {
    resistanceAnalysis: artifacts.resistanceAnalysis,
    mitigationStrategies: artifacts.mitigationStrategies,
    stakeholderGroups: inputs.stakeholderGroups
  });
  artifacts.engagementInterventions = engagementResult;

  // Phase 6: Monitoring Plan
  ctx.log('Phase 6: Creating resistance monitoring plan');
  const monitoringResult = await ctx.task(monitoringPlanTask, {
    resistanceAnalysis: artifacts.resistanceAnalysis,
    mitigationStrategies: artifacts.mitigationStrategies,
    changeContext: inputs.changeContext
  });
  artifacts.monitoringPlan = monitoringResult;

  // Phase 7: Escalation Procedures
  ctx.log('Phase 7: Defining escalation procedures');
  const escalationResult = await ctx.task(escalationProceduresTask, {
    resistanceAnalysis: artifacts.resistanceAnalysis,
    mitigationStrategies: artifacts.mitigationStrategies,
    monitoringPlan: artifacts.monitoringPlan
  });
  artifacts.escalationProcedures = escalationResult;

  // Breakpoint for plan review
  await ctx.breakpoint('resistance-plan-review', {
    question: 'Review the resistance management plan components. Is the approach comprehensive?',
    artifacts: artifacts
  });

  // Phase 8: Plan Integration
  ctx.log('Phase 8: Integrating resistance management plan');
  const integrationResult = await ctx.task(resistancePlanIntegrationTask, {
    resistanceAnalysis: artifacts.resistanceAnalysis,
    rootCauseAnalysis: artifacts.rootCauseAnalysis,
    mitigationStrategies: artifacts.mitigationStrategies,
    managerToolkit: artifacts.managerToolkit,
    engagementInterventions: artifacts.engagementInterventions,
    monitoringPlan: artifacts.monitoringPlan,
    escalationProcedures: artifacts.escalationProcedures,
    changeContext: inputs.changeContext
  });
  artifacts.integratedPlan = integrationResult;

  ctx.log('Resistance Management process completed');

  return {
    success: true,
    resistanceAnalysis: artifacts.resistanceAnalysis.resistanceAnalysis,
    rootCauseAnalysis: artifacts.rootCauseAnalysis.rootCauseAnalysis,
    mitigationStrategies: artifacts.mitigationStrategies.mitigationStrategies,
    managerToolkit: artifacts.managerToolkit.managerToolkit,
    monitoringPlan: artifacts.monitoringPlan.monitoringPlan,
    escalationProcedures: artifacts.escalationProcedures.escalationProcedures,
    engagementInterventions: artifacts.engagementInterventions.engagementInterventions,
    artifacts
  };
}
