/**
 * @process customer-experience/customer-onboarding
 * @description Comprehensive process for guiding new customers through implementation, training, and time-to-value acceleration with milestone tracking and success metrics
 * @inputs { customerName: string, productTier: string, implementationPlan: object, stakeholders: array, objectives: array }
 * @outputs { success: boolean, onboardingPlan: object, trainingSchedule: object, successMilestones: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    customerName = 'Customer',
    productTier = 'standard',
    implementationPlan = {},
    stakeholders = [],
    objectives = [],
    outputDir = 'onboarding-output',
    targetTimeToValue = 30,
    successCriteria = {}
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Customer Onboarding Orchestration for ${customerName}`);

  // ============================================================================
  // PHASE 1: CUSTOMER DISCOVERY AND NEEDS ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Conducting customer discovery and needs assessment');
  const discoveryAssessment = await ctx.task(discoveryAssessmentTask, {
    customerName,
    productTier,
    stakeholders,
    objectives,
    outputDir
  });

  artifacts.push(...discoveryAssessment.artifacts);

  // ============================================================================
  // PHASE 2: ONBOARDING PLAN DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Developing customized onboarding plan');
  const onboardingPlan = await ctx.task(onboardingPlanTask, {
    customerName,
    productTier,
    discoveryAssessment,
    implementationPlan,
    targetTimeToValue,
    outputDir
  });

  artifacts.push(...onboardingPlan.artifacts);

  // ============================================================================
  // PHASE 3: TRAINING PROGRAM DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 3: Designing customized training program');
  const trainingProgram = await ctx.task(trainingProgramTask, {
    customerName,
    stakeholders,
    discoveryAssessment,
    onboardingPlan,
    outputDir
  });

  artifacts.push(...trainingProgram.artifacts);

  // ============================================================================
  // PHASE 4: SUCCESS MILESTONES DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 4: Defining success milestones and checkpoints');
  const successMilestones = await ctx.task(successMilestonesTask, {
    customerName,
    objectives,
    onboardingPlan,
    trainingProgram,
    successCriteria,
    targetTimeToValue,
    outputDir
  });

  artifacts.push(...successMilestones.artifacts);

  // ============================================================================
  // PHASE 5: RESOURCE ALLOCATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Allocating customer success resources');
  const resourceAllocation = await ctx.task(resourceAllocationTask, {
    customerName,
    productTier,
    onboardingPlan,
    stakeholders,
    outputDir
  });

  artifacts.push(...resourceAllocation.artifacts);

  // ============================================================================
  // PHASE 6: COMMUNICATION PLAN
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating stakeholder communication plan');
  const communicationPlan = await ctx.task(communicationPlanTask, {
    customerName,
    stakeholders,
    onboardingPlan,
    successMilestones,
    resourceAllocation,
    outputDir
  });

  artifacts.push(...communicationPlan.artifacts);

  // ============================================================================
  // PHASE 7: ONBOARDING QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 7: Assessing onboarding plan quality');
  const qualityAssessment = await ctx.task(qualityAssessmentTask, {
    customerName,
    discoveryAssessment,
    onboardingPlan,
    trainingProgram,
    successMilestones,
    resourceAllocation,
    communicationPlan,
    outputDir
  });

  artifacts.push(...qualityAssessment.artifacts);

  const qualityScore = qualityAssessment.overallScore;
  const qualityMet = qualityScore >= 85;

  // Breakpoint: Review onboarding plan
  await ctx.breakpoint({
    question: `Customer onboarding plan complete for ${customerName}. Quality score: ${qualityScore}/100. ${qualityMet ? 'Plan meets quality standards!' : 'Plan may need refinement.'} Review and approve?`,
    title: 'Customer Onboarding Plan Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        qualityScore,
        qualityMet,
        customerName,
        productTier,
        totalArtifacts: artifacts.length,
        milestoneCount: successMilestones.milestones?.length || 0,
        trainingModules: trainingProgram.modules?.length || 0,
        estimatedTimeToValue: onboardingPlan.estimatedTimeToValue || targetTimeToValue
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    customerName,
    qualityScore,
    qualityMet,
    discoveryAssessment: {
      customerNeeds: discoveryAssessment.customerNeeds,
      technicalRequirements: discoveryAssessment.technicalRequirements,
      successDefinition: discoveryAssessment.successDefinition
    },
    onboardingPlan: {
      phases: onboardingPlan.phases,
      estimatedTimeToValue: onboardingPlan.estimatedTimeToValue,
      keyActivities: onboardingPlan.keyActivities
    },
    trainingSchedule: {
      modules: trainingProgram.modules,
      deliveryMethod: trainingProgram.deliveryMethod,
      totalDuration: trainingProgram.totalDuration
    },
    successMilestones: successMilestones.milestones,
    resourceAllocation: {
      csm: resourceAllocation.csm,
      supportTeam: resourceAllocation.supportTeam,
      specialists: resourceAllocation.specialists
    },
    communicationPlan: communicationPlan.schedule,
    artifacts,
    duration,
    metadata: {
      processId: 'customer-experience/customer-onboarding',
      timestamp: startTime,
      customerName,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const discoveryAssessmentTask = defineTask('discovery-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct customer discovery and needs assessment',
  agent: {
    name: 'customer-analyst',
    prompt: {
      role: 'senior customer success manager and business analyst',
      task: 'Conduct comprehensive customer discovery to understand needs, technical requirements, success criteria, and potential challenges',
      context: args,
      instructions: [
        'Review customer profile, industry, and business context',
        'Identify key stakeholders and their roles in the implementation',
        'Document customer objectives and expected outcomes',
        'Assess technical readiness and integration requirements',
        'Identify potential risks and implementation challenges',
        'Define customer success criteria and KPIs',
        'Document current processes that will be impacted',
        'Identify quick wins for early value demonstration',
        'Create customer journey map for onboarding',
        'Generate discovery assessment report'
      ],
      outputFormat: 'JSON with customerNeeds, technicalRequirements, successDefinition, risks, quickWins, journeyMap, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['customerNeeds', 'technicalRequirements', 'successDefinition', 'artifacts'],
      properties: {
        customerNeeds: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              need: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              category: { type: 'string' }
            }
          }
        },
        technicalRequirements: {
          type: 'object',
          properties: {
            integrations: { type: 'array', items: { type: 'string' } },
            dataRequirements: { type: 'array', items: { type: 'string' } },
            securityRequirements: { type: 'array', items: { type: 'string' } }
          }
        },
        successDefinition: {
          type: 'object',
          properties: {
            primaryGoals: { type: 'array', items: { type: 'string' } },
            kpis: { type: 'array', items: { type: 'string' } },
            timeframe: { type: 'string' }
          }
        },
        risks: { type: 'array', items: { type: 'object' } },
        quickWins: { type: 'array', items: { type: 'string' } },
        journeyMap: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'customer-onboarding', 'discovery']
}));

export const onboardingPlanTask = defineTask('onboarding-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop customized onboarding plan',
  agent: {
    name: 'onboarding-planner',
    prompt: {
      role: 'customer onboarding specialist and implementation manager',
      task: 'Create detailed, customized onboarding plan with phases, activities, dependencies, and timelines',
      context: args,
      instructions: [
        'Design phased onboarding approach based on customer tier and needs',
        'Define kickoff activities and stakeholder alignment steps',
        'Plan technical setup and configuration activities',
        'Define data migration or import procedures if needed',
        'Create integration implementation timeline',
        'Plan user provisioning and access management',
        'Define go-live checklist and criteria',
        'Include contingency plans for common challenges',
        'Align activities with target time-to-value',
        'Generate comprehensive onboarding plan document'
      ],
      outputFormat: 'JSON with phases, keyActivities, dependencies, estimatedTimeToValue, goLiveCriteria, contingencyPlans, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'keyActivities', 'estimatedTimeToValue', 'artifacts'],
      properties: {
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              duration: { type: 'string' },
              activities: { type: 'array', items: { type: 'string' } },
              deliverables: { type: 'array', items: { type: 'string' } },
              successCriteria: { type: 'string' }
            }
          }
        },
        keyActivities: { type: 'array', items: { type: 'object' } },
        dependencies: { type: 'array', items: { type: 'object' } },
        estimatedTimeToValue: { type: 'number' },
        goLiveCriteria: { type: 'array', items: { type: 'string' } },
        contingencyPlans: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'customer-onboarding', 'planning']
}));

export const trainingProgramTask = defineTask('training-program', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design customized training program',
  agent: {
    name: 'training-designer',
    prompt: {
      role: 'customer education specialist and training program designer',
      task: 'Design comprehensive training program tailored to customer stakeholders and use cases',
      context: args,
      instructions: [
        'Assess training needs for different stakeholder personas',
        'Design role-based training modules (admin, power user, end user)',
        'Select appropriate delivery methods (live, self-paced, hybrid)',
        'Create training schedule aligned with onboarding phases',
        'Define hands-on exercises and practical workshops',
        'Plan train-the-trainer sessions for internal champions',
        'Design knowledge assessments and certification paths',
        'Create training materials and resource guides',
        'Plan ongoing education and advanced training',
        'Generate training program documentation'
      ],
      outputFormat: 'JSON with modules, deliveryMethod, schedule, assessments, materials, totalDuration, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['modules', 'deliveryMethod', 'totalDuration', 'artifacts'],
      properties: {
        modules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              module: { type: 'string' },
              audience: { type: 'string' },
              duration: { type: 'string' },
              format: { type: 'string' },
              objectives: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        deliveryMethod: { type: 'string' },
        schedule: { type: 'array', items: { type: 'object' } },
        assessments: { type: 'array', items: { type: 'object' } },
        materials: { type: 'array', items: { type: 'string' } },
        totalDuration: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'customer-onboarding', 'training']
}));

export const successMilestonesTask = defineTask('success-milestones', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define success milestones and checkpoints',
  agent: {
    name: 'success-architect',
    prompt: {
      role: 'customer success strategist and outcomes specialist',
      task: 'Define measurable success milestones, checkpoints, and early warning indicators throughout onboarding',
      context: args,
      instructions: [
        'Define first value milestone (time to first meaningful outcome)',
        'Create adoption milestones (user activation, feature usage)',
        'Define engagement milestones (login frequency, session depth)',
        'Establish outcome milestones aligned with customer objectives',
        'Create health score indicators for onboarding progress',
        'Define escalation triggers and intervention points',
        'Plan milestone celebration and recognition moments',
        'Create milestone tracking dashboard specifications',
        'Define success criteria for onboarding completion',
        'Generate milestone tracking documentation'
      ],
      outputFormat: 'JSON with milestones, healthIndicators, escalationTriggers, trackingDashboard, completionCriteria, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['milestones', 'healthIndicators', 'completionCriteria', 'artifacts'],
      properties: {
        milestones: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              milestone: { type: 'string' },
              targetDay: { type: 'number' },
              criteria: { type: 'string' },
              measurement: { type: 'string' },
              category: { type: 'string' }
            }
          }
        },
        healthIndicators: { type: 'array', items: { type: 'object' } },
        escalationTriggers: { type: 'array', items: { type: 'object' } },
        trackingDashboard: { type: 'object' },
        completionCriteria: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'customer-onboarding', 'milestones']
}));

export const resourceAllocationTask = defineTask('resource-allocation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Allocate customer success resources',
  agent: {
    name: 'resource-manager',
    prompt: {
      role: 'customer success operations manager',
      task: 'Allocate appropriate customer success resources based on customer tier, complexity, and strategic importance',
      context: args,
      instructions: [
        'Assign primary Customer Success Manager (CSM)',
        'Allocate technical implementation resources',
        'Assign training and enablement specialists',
        'Define support tier and escalation contacts',
        'Allocate executive sponsor for strategic accounts',
        'Define resource engagement schedule and touchpoints',
        'Plan handoff procedures between teams',
        'Create RACI matrix for onboarding activities',
        'Define backup resources and coverage plan',
        'Generate resource allocation documentation'
      ],
      outputFormat: 'JSON with csm, supportTeam, specialists, executiveSponsor, engagementSchedule, raci, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['csm', 'supportTeam', 'artifacts'],
      properties: {
        csm: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            role: { type: 'string' },
            responsibilities: { type: 'array', items: { type: 'string' } }
          }
        },
        supportTeam: { type: 'array', items: { type: 'object' } },
        specialists: { type: 'array', items: { type: 'object' } },
        executiveSponsor: { type: 'object' },
        engagementSchedule: { type: 'array', items: { type: 'object' } },
        raci: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'customer-onboarding', 'resources']
}));

export const communicationPlanTask = defineTask('communication-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create stakeholder communication plan',
  agent: {
    name: 'communication-planner',
    prompt: {
      role: 'customer success communication specialist',
      task: 'Create comprehensive communication plan for all stakeholders throughout onboarding journey',
      context: args,
      instructions: [
        'Define communication cadence for each stakeholder group',
        'Plan kickoff meeting agenda and participants',
        'Schedule regular check-in calls and status updates',
        'Create milestone celebration communication templates',
        'Design escalation communication protocols',
        'Plan executive business review touchpoints',
        'Create onboarding newsletter or update series',
        'Define preferred communication channels per stakeholder',
        'Plan internal team communication and alignment',
        'Generate communication plan documentation'
      ],
      outputFormat: 'JSON with schedule, templates, channels, escalationProtocols, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['schedule', 'channels', 'artifacts'],
      properties: {
        schedule: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              event: { type: 'string' },
              frequency: { type: 'string' },
              audience: { type: 'array', items: { type: 'string' } },
              channel: { type: 'string' },
              owner: { type: 'string' }
            }
          }
        },
        templates: { type: 'array', items: { type: 'object' } },
        channels: { type: 'object' },
        escalationProtocols: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'customer-onboarding', 'communication']
}));

export const qualityAssessmentTask = defineTask('quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess onboarding plan quality',
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'customer success quality assurance specialist',
      task: 'Assess overall quality and completeness of onboarding plan against best practices',
      context: args,
      instructions: [
        'Evaluate discovery assessment completeness (weight: 15%)',
        'Assess onboarding plan alignment with customer needs (weight: 25%)',
        'Review training program comprehensiveness (weight: 20%)',
        'Evaluate milestone definitions and measurability (weight: 15%)',
        'Assess resource allocation adequacy (weight: 15%)',
        'Review communication plan effectiveness (weight: 10%)',
        'Calculate weighted overall score (0-100)',
        'Identify gaps and areas for improvement',
        'Provide specific recommendations',
        'Generate quality assessment report'
      ],
      outputFormat: 'JSON with overallScore, componentScores, gaps, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            discovery: { type: 'number' },
            onboardingPlan: { type: 'number' },
            training: { type: 'number' },
            milestones: { type: 'number' },
            resources: { type: 'number' },
            communication: { type: 'number' }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'customer-onboarding', 'quality-assessment']
}));
