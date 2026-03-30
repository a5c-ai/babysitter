/**
 * @process specializations/domains/business/public-relations/crisis-simulation-training
 * @description Design and conduct tabletop exercises and crisis simulations to test response plans, train spokespersons, and identify gaps in preparedness
 * @specialization Public Relations and Communications
 * @category Crisis Communications
 * @inputs { crisisPlan: object, participants: object[], scenario: object, objectives: string[] }
 * @outputs { success: boolean, simulation: object, evaluation: object, gaps: object[], quality: number }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    crisisPlan,
    participants = [],
    scenario = {},
    objectives = [],
    simulationType = 'tabletop',
    duration = '4 hours',
    targetQuality = 85
  } = inputs;

  // Phase 1: Simulation Design
  await ctx.breakpoint({
    question: 'Starting crisis simulation design. Define scenario and objectives?',
    title: 'Phase 1: Simulation Design',
    context: {
      runId: ctx.runId,
      phase: 'simulation-design',
      simulationType,
      participantCount: participants.length
    }
  });

  const simulationDesign = await ctx.task(designSimulationTask, {
    crisisPlan,
    scenario,
    objectives,
    simulationType,
    duration
  });

  // Phase 2: Scenario Development
  await ctx.breakpoint({
    question: 'Simulation designed. Develop detailed scenario and injects?',
    title: 'Phase 2: Scenario Development',
    context: {
      runId: ctx.runId,
      phase: 'scenario-development'
    }
  });

  const [scenarioDetails, injects] = await Promise.all([
    ctx.task(developScenarioTask, {
      scenario,
      simulationDesign,
      crisisPlan
    }),
    ctx.task(developInjectsTask, {
      scenario,
      simulationDesign,
      crisisPlan,
      duration
    })
  ]);

  // Phase 3: Participant Preparation
  await ctx.breakpoint({
    question: 'Scenario ready. Prepare participants and materials?',
    title: 'Phase 3: Participant Preparation',
    context: {
      runId: ctx.runId,
      phase: 'participant-prep',
      participants: participants.length
    }
  });

  const [participantBriefing, materials] = await Promise.all([
    ctx.task(prepareParticipantBriefingTask, {
      participants,
      simulationDesign,
      scenarioDetails
    }),
    ctx.task(prepareMaterialsTask, {
      simulationDesign,
      scenarioDetails,
      injects,
      crisisPlan
    })
  ]);

  // Phase 4: Facilitation Guide
  await ctx.breakpoint({
    question: 'Materials prepared. Create facilitation guide?',
    title: 'Phase 4: Facilitation Guide',
    context: {
      runId: ctx.runId,
      phase: 'facilitation-guide',
      injectCount: injects.injectList.length
    }
  });

  const facilitationGuide = await ctx.task(createFacilitationGuideTask, {
    simulationDesign,
    scenarioDetails,
    injects,
    objectives,
    duration
  });

  // Phase 5: Evaluation Framework
  await ctx.breakpoint({
    question: 'Facilitation planned. Define evaluation framework?',
    title: 'Phase 5: Evaluation Framework',
    context: {
      runId: ctx.runId,
      phase: 'evaluation-framework'
    }
  });

  const evaluationFramework = await ctx.task(defineEvaluationFrameworkTask, {
    objectives,
    crisisPlan,
    simulationDesign
  });

  // Phase 6: Simulation Execution Support
  await ctx.breakpoint({
    question: 'Framework ready. Prepare simulation execution support?',
    title: 'Phase 6: Execution Support',
    context: {
      runId: ctx.runId,
      phase: 'execution-support'
    }
  });

  const executionSupport = await ctx.task(prepareExecutionSupportTask, {
    facilitationGuide,
    injects,
    evaluationFramework,
    participants
  });

  // Phase 7: Post-Exercise Analysis Design
  await ctx.breakpoint({
    question: 'Execution support ready. Design post-exercise analysis?',
    title: 'Phase 7: Analysis Design',
    context: {
      runId: ctx.runId,
      phase: 'analysis-design'
    }
  });

  const analysisDesign = await ctx.task(designPostExerciseAnalysisTask, {
    objectives,
    evaluationFramework,
    crisisPlan
  });

  // Phase 8: Quality Validation
  await ctx.breakpoint({
    question: 'Validate simulation design quality?',
    title: 'Phase 8: Quality Validation',
    context: {
      runId: ctx.runId,
      phase: 'quality-validation',
      targetQuality
    }
  });

  const qualityResult = await ctx.task(validateSimulationQualityTask, {
    simulationDesign,
    scenarioDetails,
    injects,
    facilitationGuide,
    evaluationFramework,
    targetQuality
  });

  const quality = qualityResult.score;

  if (quality >= targetQuality) {
    return {
      success: true,
      simulation: {
        design: simulationDesign,
        scenario: scenarioDetails,
        injects: injects.injectList,
        facilitationGuide,
        materials,
        participantBriefing,
        executionSupport
      },
      evaluation: {
        framework: evaluationFramework,
        analysisDesign
      },
      gaps: qualityResult.identifiedGaps,
      quality,
      targetQuality,
      recommendations: qualityResult.recommendations,
      metadata: {
        processId: 'specializations/domains/business/public-relations/crisis-simulation-training',
        timestamp: ctx.now(),
        simulationType,
        participantCount: participants.length,
        duration
      }
    };
  } else {
    return {
      success: false,
      qualityGateFailed: true,
      quality,
      targetQuality,
      gaps: qualityResult.identifiedGaps,
      recommendations: qualityResult.recommendations,
      metadata: {
        processId: 'specializations/domains/business/public-relations/crisis-simulation-training',
        timestamp: ctx.now()
      }
    };
  }
}

// Task Definitions

export const designSimulationTask = defineTask('design-simulation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Crisis Simulation',
  agent: {
    name: 'simulation-designer',
    prompt: {
      role: 'Crisis management training specialist designing exercises',
      task: 'Design crisis simulation exercise structure and objectives',
      context: args,
      instructions: [
        'Define simulation type (tabletop, functional, full-scale)',
        'Establish clear learning objectives',
        'Define scope and boundaries of exercise',
        'Plan exercise timeline and phases',
        'Identify roles and responsibilities for exercise',
        'Define rules of engagement and artificialities',
        'Plan communication and coordination approach',
        'Establish success criteria for exercise'
      ],
      outputFormat: 'JSON with type, objectives, scope, timeline, phases, roles, rules, successCriteria'
    },
    outputSchema: {
      type: 'object',
      required: ['type', 'objectives', 'timeline', 'phases'],
      properties: {
        type: { type: 'string' },
        objectives: { type: 'array', items: { type: 'string' } },
        scope: { type: 'object' },
        timeline: { type: 'object' },
        phases: { type: 'array', items: { type: 'object' } },
        roles: { type: 'array', items: { type: 'object' } },
        rules: { type: 'array', items: { type: 'string' } },
        successCriteria: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'simulation-design']
}));

export const developScenarioTask = defineTask('develop-scenario', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Detailed Scenario',
  agent: {
    name: 'scenario-developer',
    prompt: {
      role: 'Crisis scenario writer creating realistic exercise scenarios',
      task: 'Develop detailed, realistic crisis scenario for simulation',
      context: args,
      instructions: [
        'Create compelling scenario narrative and backstory',
        'Define triggering event and timeline',
        'Develop realistic stakeholder reactions',
        'Include media and social media elements',
        'Create escalation pathways in scenario',
        'Include complicating factors and twists',
        'Ensure scenario tests crisis plan elements',
        'Make scenario challenging but achievable'
      ],
      outputFormat: 'JSON with narrative, triggerEvent, timeline, stakeholderReactions, mediaElements, escalationPaths, complications, planElementsTested'
    },
    outputSchema: {
      type: 'object',
      required: ['narrative', 'triggerEvent', 'timeline'],
      properties: {
        narrative: { type: 'string' },
        triggerEvent: { type: 'object' },
        timeline: { type: 'array', items: { type: 'object' } },
        stakeholderReactions: { type: 'array', items: { type: 'object' } },
        mediaElements: { type: 'array', items: { type: 'object' } },
        escalationPaths: { type: 'array', items: { type: 'object' } },
        complications: { type: 'array', items: { type: 'object' } },
        planElementsTested: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'scenario-development']
}));

export const developInjectsTask = defineTask('develop-injects', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Scenario Injects',
  agent: {
    name: 'inject-developer',
    prompt: {
      role: 'Crisis exercise specialist creating simulation injects',
      task: 'Develop timed injects to drive scenario progression',
      context: args,
      instructions: [
        'Create timed information injects for scenario progression',
        'Develop simulated media inquiries and news reports',
        'Create social media post injects',
        'Develop stakeholder communication injects',
        'Include curveball injects for challenge',
        'Create decision-point injects',
        'Develop resolution pathway injects',
        'Time injects appropriately across exercise'
      ],
      outputFormat: 'JSON with injectList array (time, type, content, expectedResponse, deliveryMethod), timeline, contingencyInjects'
    },
    outputSchema: {
      type: 'object',
      required: ['injectList', 'timeline'],
      properties: {
        injectList: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              time: { type: 'string' },
              type: { type: 'string' },
              content: { type: 'string' },
              expectedResponse: { type: 'string' },
              deliveryMethod: { type: 'string' }
            }
          }
        },
        timeline: { type: 'array', items: { type: 'object' } },
        contingencyInjects: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'inject-development']
}));

export const prepareParticipantBriefingTask = defineTask('prepare-participant-briefing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare Participant Briefing',
  agent: {
    name: 'participant-briefer',
    prompt: {
      role: 'Training coordinator preparing exercise participants',
      task: 'Prepare briefing materials and instructions for participants',
      context: args,
      instructions: [
        'Create pre-exercise briefing document',
        'Define participant roles and expectations',
        'Explain exercise rules and constraints',
        'Provide background information and setup',
        'Explain evaluation criteria',
        'Clarify what is in scope vs. artificialities',
        'Provide logistics information',
        'Create role-specific briefings where needed'
      ],
      outputFormat: 'JSON with generalBriefing, roleSpecificBriefings, expectations, logistics, preReadMaterials'
    },
    outputSchema: {
      type: 'object',
      required: ['generalBriefing', 'expectations'],
      properties: {
        generalBriefing: { type: 'object' },
        roleSpecificBriefings: { type: 'array', items: { type: 'object' } },
        expectations: { type: 'array', items: { type: 'string' } },
        logistics: { type: 'object' },
        preReadMaterials: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'participant-briefing']
}));

export const prepareMaterialsTask = defineTask('prepare-materials', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare Exercise Materials',
  agent: {
    name: 'materials-preparer',
    prompt: {
      role: 'Exercise logistics coordinator preparing materials',
      task: 'Prepare all materials needed for crisis simulation',
      context: args,
      instructions: [
        'Prepare scenario briefing documents',
        'Create inject cards or digital delivery system',
        'Prepare simulated media materials (articles, tweets)',
        'Create message templates for participant use',
        'Prepare evaluation forms and checklists',
        'Create room setup and technology requirements',
        'Prepare observer guide and forms',
        'Create participant handouts and reference materials'
      ],
      outputFormat: 'JSON with documents, injectMaterials, simulatedMedia, templates, evaluationForms, logisticsRequirements, observerGuide, handouts'
    },
    outputSchema: {
      type: 'object',
      required: ['documents', 'injectMaterials', 'evaluationForms'],
      properties: {
        documents: { type: 'array', items: { type: 'object' } },
        injectMaterials: { type: 'array', items: { type: 'object' } },
        simulatedMedia: { type: 'array', items: { type: 'object' } },
        templates: { type: 'array', items: { type: 'object' } },
        evaluationForms: { type: 'array', items: { type: 'object' } },
        logisticsRequirements: { type: 'object' },
        observerGuide: { type: 'object' },
        handouts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'materials-preparation']
}));

export const createFacilitationGuideTask = defineTask('create-facilitation-guide', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Facilitation Guide',
  agent: {
    name: 'facilitation-guide-creator',
    prompt: {
      role: 'Experienced exercise facilitator creating guidance documents',
      task: 'Create comprehensive facilitation guide for exercise',
      context: args,
      instructions: [
        'Create detailed exercise agenda with timing',
        'Develop facilitator script for key transitions',
        'Define inject delivery schedule and method',
        'Create discussion prompts for each phase',
        'Develop contingency plans for exercise issues',
        'Include techniques for managing group dynamics',
        'Define criteria for adjusting pace or difficulty',
        'Create closing and hotwash facilitation guide'
      ],
      outputFormat: 'JSON with agenda, script, injectSchedule, discussionPrompts, contingencyPlans, groupDynamics, pacingGuidance, closingGuide'
    },
    outputSchema: {
      type: 'object',
      required: ['agenda', 'script', 'injectSchedule'],
      properties: {
        agenda: { type: 'array', items: { type: 'object' } },
        script: { type: 'array', items: { type: 'object' } },
        injectSchedule: { type: 'array', items: { type: 'object' } },
        discussionPrompts: { type: 'array', items: { type: 'object' } },
        contingencyPlans: { type: 'array', items: { type: 'object' } },
        groupDynamics: { type: 'object' },
        pacingGuidance: { type: 'object' },
        closingGuide: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'facilitation-guide']
}));

export const defineEvaluationFrameworkTask = defineTask('define-evaluation-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define Evaluation Framework',
  agent: {
    name: 'evaluation-framework-designer',
    prompt: {
      role: 'Exercise evaluation specialist designing assessment framework',
      task: 'Define comprehensive evaluation framework for exercise',
      context: args,
      instructions: [
        'Define evaluation criteria aligned with objectives',
        'Create performance metrics for each crisis plan element',
        'Develop observation checklist for evaluators',
        'Define scoring rubric for key activities',
        'Create participant self-assessment tools',
        'Define hotwash discussion questions',
        'Establish improvement identification framework',
        'Create after-action report template'
      ],
      outputFormat: 'JSON with criteria, metrics, observationChecklist, scoringRubric, selfAssessment, hotwashQuestions, improvementFramework, reportTemplate'
    },
    outputSchema: {
      type: 'object',
      required: ['criteria', 'metrics', 'observationChecklist'],
      properties: {
        criteria: { type: 'array', items: { type: 'object' } },
        metrics: { type: 'array', items: { type: 'object' } },
        observationChecklist: { type: 'array', items: { type: 'object' } },
        scoringRubric: { type: 'object' },
        selfAssessment: { type: 'object' },
        hotwashQuestions: { type: 'array', items: { type: 'string' } },
        improvementFramework: { type: 'object' },
        reportTemplate: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'evaluation-framework']
}));

export const prepareExecutionSupportTask = defineTask('prepare-execution-support', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare Execution Support',
  agent: {
    name: 'execution-support-preparer',
    prompt: {
      role: 'Exercise operations specialist preparing execution support',
      task: 'Prepare all execution support elements for simulation',
      context: args,
      instructions: [
        'Finalize all logistics and setup requirements',
        'Prepare technology and communication tools',
        'Brief support staff and observers',
        'Create inject delivery assignments',
        'Prepare real-time tracking tools',
        'Create exercise control room setup',
        'Prepare participant support resources',
        'Develop day-of execution checklist'
      ],
      outputFormat: 'JSON with logistics, technology, staffBriefings, injectAssignments, trackingTools, controlRoomSetup, supportResources, executionChecklist'
    },
    outputSchema: {
      type: 'object',
      required: ['logistics', 'executionChecklist'],
      properties: {
        logistics: { type: 'object' },
        technology: { type: 'array', items: { type: 'object' } },
        staffBriefings: { type: 'array', items: { type: 'object' } },
        injectAssignments: { type: 'array', items: { type: 'object' } },
        trackingTools: { type: 'array', items: { type: 'object' } },
        controlRoomSetup: { type: 'object' },
        supportResources: { type: 'array', items: { type: 'object' } },
        executionChecklist: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'execution-support']
}));

export const designPostExerciseAnalysisTask = defineTask('design-post-exercise-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Post-Exercise Analysis',
  agent: {
    name: 'analysis-designer',
    prompt: {
      role: 'Exercise analysis specialist designing post-exercise review',
      task: 'Design comprehensive post-exercise analysis approach',
      context: args,
      instructions: [
        'Design hotwash session agenda and facilitation',
        'Create participant feedback collection approach',
        'Define data analysis methodology',
        'Create gap identification framework',
        'Design improvement recommendation process',
        'Define crisis plan update requirements',
        'Create after-action report structure',
        'Plan follow-up actions and accountability'
      ],
      outputFormat: 'JSON with hotwashAgenda, feedbackApproach, analysisMethodology, gapFramework, recommendationProcess, planUpdateRequirements, reportStructure, followUpPlan'
    },
    outputSchema: {
      type: 'object',
      required: ['hotwashAgenda', 'gapFramework', 'reportStructure'],
      properties: {
        hotwashAgenda: { type: 'object' },
        feedbackApproach: { type: 'object' },
        analysisMethodology: { type: 'object' },
        gapFramework: { type: 'object' },
        recommendationProcess: { type: 'object' },
        planUpdateRequirements: { type: 'array', items: { type: 'string' } },
        reportStructure: { type: 'object' },
        followUpPlan: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'analysis-design']
}));

export const validateSimulationQualityTask = defineTask('validate-simulation-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Simulation Quality',
  agent: {
    name: 'simulation-quality-validator',
    prompt: {
      role: 'Crisis exercise quality assessor',
      task: 'Validate crisis simulation design quality and readiness',
      context: args,
      instructions: [
        'Assess scenario realism and appropriateness',
        'Evaluate inject quality and timing',
        'Review facilitation guide completeness',
        'Assess evaluation framework robustness',
        'Check alignment with stated objectives',
        'Identify potential gaps in crisis plan testing',
        'Verify logistics and materials readiness',
        'Provide overall quality score (0-100)'
      ],
      outputFormat: 'JSON with score, passed, scenarioScore, injectScore, facilitationScore, evaluationScore, identifiedGaps, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'passed', 'identifiedGaps'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        passed: { type: 'boolean' },
        scenarioScore: { type: 'number' },
        injectScore: { type: 'number' },
        facilitationScore: { type: 'number' },
        evaluationScore: { type: 'number' },
        identifiedGaps: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'quality-validation']
}));
