/**
 * @process specializations/domains/business/public-relations/employee-advocacy-program
 * @description Develop programs enabling employees to authentically share company content and stories, extending reach and credibility through trusted voices
 * @specialization Public Relations and Communications
 * @category Internal Communications
 * @inputs { organization: object, employeeBase: object, contentStrategy: object, platformOptions: object[] }
 * @outputs { success: boolean, advocacyProgram: object, contentLibrary: object, trainingPlan: object, quality: number }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organization,
    employeeBase = {},
    contentStrategy = {},
    platformOptions = [],
    socialMediaPolicy = {},
    targetQuality = 85
  } = inputs;

  // Phase 1: Program Strategy
  await ctx.breakpoint({
    question: 'Starting employee advocacy program development. Define program strategy?',
    title: 'Phase 1: Program Strategy',
    context: {
      runId: ctx.runId,
      phase: 'program-strategy',
      organization: organization.name
    }
  });

  const programStrategy = await ctx.task(defineProgramStrategyTask, {
    organization,
    employeeBase,
    contentStrategy
  });

  // Phase 2: Participant Identification
  await ctx.breakpoint({
    question: 'Strategy defined. Identify and segment participants?',
    title: 'Phase 2: Participant Identification',
    context: {
      runId: ctx.runId,
      phase: 'participant-identification'
    }
  });

  const participantSegmentation = await ctx.task(identifyParticipantsTask, {
    employeeBase,
    programStrategy
  });

  // Phase 3: Platform and Tools Selection
  await ctx.breakpoint({
    question: 'Participants identified. Select platforms and tools?',
    title: 'Phase 3: Platform Selection',
    context: {
      runId: ctx.runId,
      phase: 'platform-selection',
      optionCount: platformOptions.length
    }
  });

  const platformSelection = await ctx.task(selectPlatformsTask, {
    platformOptions,
    programStrategy,
    employeeBase
  });

  // Phase 4: Content Library Development
  await ctx.breakpoint({
    question: 'Platforms selected. Develop content library?',
    title: 'Phase 4: Content Library',
    context: {
      runId: ctx.runId,
      phase: 'content-library'
    }
  });

  const contentLibrary = await ctx.task(developContentLibraryTask, {
    contentStrategy,
    programStrategy,
    organization
  });

  // Phase 5: Guidelines and Governance
  await ctx.breakpoint({
    question: 'Content developed. Create guidelines and governance?',
    title: 'Phase 5: Guidelines and Governance',
    context: {
      runId: ctx.runId,
      phase: 'guidelines-governance'
    }
  });

  const guidelines = await ctx.task(createGuidelinesTask, {
    socialMediaPolicy,
    programStrategy,
    organization
  });

  // Phase 6: Training and Enablement
  await ctx.breakpoint({
    question: 'Guidelines created. Develop training program?',
    title: 'Phase 6: Training Program',
    context: {
      runId: ctx.runId,
      phase: 'training-program'
    }
  });

  const trainingPlan = await ctx.task(developTrainingPlanTask, {
    guidelines,
    platformSelection,
    participantSegmentation
  });

  // Phase 7: Recognition and Incentives
  await ctx.breakpoint({
    question: 'Training planned. Design recognition and incentives?',
    title: 'Phase 7: Recognition and Incentives',
    context: {
      runId: ctx.runId,
      phase: 'recognition-incentives'
    }
  });

  const recognitionProgram = await ctx.task(designRecognitionProgramTask, {
    programStrategy,
    participantSegmentation
  });

  // Phase 8: Measurement Framework
  await ctx.breakpoint({
    question: 'Recognition designed. Define measurement framework?',
    title: 'Phase 8: Measurement Framework',
    context: {
      runId: ctx.runId,
      phase: 'measurement-framework'
    }
  });

  const measurementFramework = await ctx.task(defineMeasurementTask, {
    programStrategy,
    platformSelection
  });

  // Phase 9: Quality Validation
  await ctx.breakpoint({
    question: 'Validate employee advocacy program quality?',
    title: 'Phase 9: Quality Validation',
    context: {
      runId: ctx.runId,
      phase: 'quality-validation',
      targetQuality
    }
  });

  const qualityResult = await ctx.task(validateAdvocacyProgramTask, {
    programStrategy,
    participantSegmentation,
    platformSelection,
    contentLibrary,
    guidelines,
    trainingPlan,
    recognitionProgram,
    measurementFramework,
    targetQuality
  });

  const quality = qualityResult.score;

  if (quality >= targetQuality) {
    return {
      success: true,
      advocacyProgram: {
        strategy: programStrategy,
        participants: participantSegmentation,
        platforms: platformSelection,
        guidelines,
        recognition: recognitionProgram,
        measurement: measurementFramework
      },
      contentLibrary,
      trainingPlan,
      quality,
      targetQuality,
      metadata: {
        processId: 'specializations/domains/business/public-relations/employee-advocacy-program',
        timestamp: ctx.now(),
        organization: organization.name
      }
    };
  } else {
    return {
      success: false,
      qualityGateFailed: true,
      quality,
      targetQuality,
      gaps: qualityResult.gaps,
      recommendations: qualityResult.recommendations,
      metadata: {
        processId: 'specializations/domains/business/public-relations/employee-advocacy-program',
        timestamp: ctx.now()
      }
    };
  }
}

// Task Definitions

export const defineProgramStrategyTask = defineTask('define-program-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define Program Strategy',
  agent: {
    name: 'advocacy-strategist',
    prompt: {
      role: 'Employee advocacy program specialist defining strategy',
      task: 'Define employee advocacy program strategy',
      context: args,
      instructions: [
        'Define program objectives and goals',
        'Establish value proposition for employees',
        'Define program scope and boundaries',
        'Identify key content themes',
        'Define participation expectations',
        'Establish authenticity guidelines',
        'Plan phased rollout approach',
        'Define success metrics'
      ],
      outputFormat: 'JSON with objectives, valueProposition, scope, contentThemes, participationExpectations, authenticityGuidelines, rolloutApproach, successMetrics'
    },
    outputSchema: {
      type: 'object',
      required: ['objectives', 'valueProposition', 'scope'],
      properties: {
        objectives: { type: 'array', items: { type: 'object' } },
        valueProposition: { type: 'object' },
        scope: { type: 'object' },
        contentThemes: { type: 'array', items: { type: 'string' } },
        participationExpectations: { type: 'object' },
        authenticityGuidelines: { type: 'array', items: { type: 'string' } },
        rolloutApproach: { type: 'object' },
        successMetrics: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'program-strategy']
}));

export const identifyParticipantsTask = defineTask('identify-participants', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify Participants',
  agent: {
    name: 'participant-identifier',
    prompt: {
      role: 'Employee engagement specialist identifying advocates',
      task: 'Identify and segment advocacy program participants',
      context: args,
      instructions: [
        'Identify potential advocate segments',
        'Define pilot group criteria',
        'Identify executive sponsors',
        'Map social media active employees',
        'Identify department champions',
        'Assess participation readiness',
        'Define onboarding priority',
        'Create recruitment approach'
      ],
      outputFormat: 'JSON with segments, pilotCriteria, executiveSponsors, socialActiveEmployees, departmentChampions, readinessAssessment, onboardingPriority, recruitmentApproach'
    },
    outputSchema: {
      type: 'object',
      required: ['segments', 'pilotCriteria'],
      properties: {
        segments: { type: 'array', items: { type: 'object' } },
        pilotCriteria: { type: 'object' },
        executiveSponsors: { type: 'array', items: { type: 'object' } },
        socialActiveEmployees: { type: 'array', items: { type: 'object' } },
        departmentChampions: { type: 'array', items: { type: 'object' } },
        readinessAssessment: { type: 'object' },
        onboardingPriority: { type: 'array', items: { type: 'string' } },
        recruitmentApproach: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'participant-identification']
}));

export const selectPlatformsTask = defineTask('select-platforms', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Select Platforms',
  agent: {
    name: 'platform-selector',
    prompt: {
      role: 'Social technology specialist selecting advocacy platforms',
      task: 'Select platforms and tools for advocacy program',
      context: args,
      instructions: [
        'Evaluate advocacy platform options',
        'Assess integration requirements',
        'Define social network priorities',
        'Evaluate content curation features',
        'Assess analytics capabilities',
        'Define mobile requirements',
        'Evaluate compliance features',
        'Create implementation recommendation'
      ],
      outputFormat: 'JSON with platformEvaluation, integrationRequirements, socialPriorities, curationFeatures, analyticsCapabilities, mobileRequirements, complianceFeatures, recommendation'
    },
    outputSchema: {
      type: 'object',
      required: ['platformEvaluation', 'recommendation'],
      properties: {
        platformEvaluation: { type: 'array', items: { type: 'object' } },
        integrationRequirements: { type: 'array', items: { type: 'string' } },
        socialPriorities: { type: 'array', items: { type: 'object' } },
        curationFeatures: { type: 'array', items: { type: 'string' } },
        analyticsCapabilities: { type: 'array', items: { type: 'string' } },
        mobileRequirements: { type: 'object' },
        complianceFeatures: { type: 'array', items: { type: 'string' } },
        recommendation: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'platform-selection']
}));

export const developContentLibraryTask = defineTask('develop-content-library', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Content Library',
  agent: {
    name: 'content-library-developer',
    prompt: {
      role: 'Content strategist developing shareable content',
      task: 'Develop content library for employee advocacy',
      context: args,
      instructions: [
        'Define content categories and types',
        'Create shareable content templates',
        'Develop sample social posts',
        'Create image and visual library',
        'Develop thought leadership content',
        'Create industry news curation approach',
        'Define content refresh cadence',
        'Create personalization guidelines'
      ],
      outputFormat: 'JSON with contentCategories, templates, samplePosts, visualLibrary, thoughtLeadership, newsCuration, refreshCadence, personalizationGuidelines'
    },
    outputSchema: {
      type: 'object',
      required: ['contentCategories', 'templates', 'samplePosts'],
      properties: {
        contentCategories: { type: 'array', items: { type: 'object' } },
        templates: { type: 'array', items: { type: 'object' } },
        samplePosts: { type: 'array', items: { type: 'object' } },
        visualLibrary: { type: 'object' },
        thoughtLeadership: { type: 'array', items: { type: 'object' } },
        newsCuration: { type: 'object' },
        refreshCadence: { type: 'string' },
        personalizationGuidelines: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'content-library']
}));

export const createGuidelinesTask = defineTask('create-guidelines', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Guidelines',
  agent: {
    name: 'guidelines-creator',
    prompt: {
      role: 'Policy specialist creating advocacy guidelines',
      task: 'Create guidelines and governance for advocacy program',
      context: args,
      instructions: [
        'Align with social media policy',
        'Define participation guidelines',
        'Create do\'s and don\'ts',
        'Define disclosure requirements',
        'Create crisis response guidelines',
        'Define brand voice guidance',
        'Create compliance guardrails',
        'Define escalation procedures'
      ],
      outputFormat: 'JSON with policyAlignment, participationGuidelines, dosAndDonts, disclosureRequirements, crisisGuidelines, brandVoice, complianceGuardrails, escalationProcedures'
    },
    outputSchema: {
      type: 'object',
      required: ['participationGuidelines', 'dosAndDonts'],
      properties: {
        policyAlignment: { type: 'object' },
        participationGuidelines: { type: 'object' },
        dosAndDonts: { type: 'object' },
        disclosureRequirements: { type: 'array', items: { type: 'string' } },
        crisisGuidelines: { type: 'object' },
        brandVoice: { type: 'object' },
        complianceGuardrails: { type: 'array', items: { type: 'string' } },
        escalationProcedures: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'guidelines-governance']
}));

export const developTrainingPlanTask = defineTask('develop-training-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Training Plan',
  agent: {
    name: 'training-planner',
    prompt: {
      role: 'Learning and development specialist for advocacy',
      task: 'Develop training plan for advocacy program',
      context: args,
      instructions: [
        'Design onboarding program',
        'Create platform training',
        'Develop social media best practices training',
        'Create content creation training',
        'Develop personal branding guidance',
        'Create compliance training',
        'Plan ongoing skill development',
        'Define certification or recognition for completion'
      ],
      outputFormat: 'JSON with onboardingProgram, platformTraining, socialBestPractices, contentCreation, personalBranding, complianceTraining, ongoingDevelopment, completionRecognition'
    },
    outputSchema: {
      type: 'object',
      required: ['onboardingProgram', 'platformTraining'],
      properties: {
        onboardingProgram: { type: 'object' },
        platformTraining: { type: 'object' },
        socialBestPractices: { type: 'object' },
        contentCreation: { type: 'object' },
        personalBranding: { type: 'object' },
        complianceTraining: { type: 'object' },
        ongoingDevelopment: { type: 'object' },
        completionRecognition: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'training-plan']
}));

export const designRecognitionProgramTask = defineTask('design-recognition-program', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Recognition Program',
  agent: {
    name: 'recognition-designer',
    prompt: {
      role: 'Employee recognition specialist designing incentives',
      task: 'Design recognition and incentive program for advocates',
      context: args,
      instructions: [
        'Define recognition categories',
        'Design gamification elements',
        'Create leaderboard approach',
        'Define reward structure',
        'Plan recognition moments',
        'Create executive recognition approach',
        'Define non-monetary incentives',
        'Plan celebration and visibility'
      ],
      outputFormat: 'JSON with recognitionCategories, gamification, leaderboard, rewardStructure, recognitionMoments, executiveRecognition, nonMonetaryIncentives, celebrationVisibility'
    },
    outputSchema: {
      type: 'object',
      required: ['recognitionCategories', 'gamification'],
      properties: {
        recognitionCategories: { type: 'array', items: { type: 'object' } },
        gamification: { type: 'object' },
        leaderboard: { type: 'object' },
        rewardStructure: { type: 'object' },
        recognitionMoments: { type: 'array', items: { type: 'object' } },
        executiveRecognition: { type: 'object' },
        nonMonetaryIncentives: { type: 'array', items: { type: 'string' } },
        celebrationVisibility: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'recognition-program']
}));

export const defineMeasurementTask = defineTask('define-measurement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define Measurement Framework',
  agent: {
    name: 'measurement-definer',
    prompt: {
      role: 'Analytics specialist defining advocacy metrics',
      task: 'Define measurement framework for advocacy program',
      context: args,
      instructions: [
        'Define participation metrics',
        'Establish reach and engagement metrics',
        'Define content performance metrics',
        'Create influence and impact metrics',
        'Define business outcome metrics',
        'Create dashboard and reporting approach',
        'Define benchmarks and targets',
        'Plan ROI calculation approach'
      ],
      outputFormat: 'JSON with participationMetrics, reachEngagement, contentPerformance, influenceMetrics, businessOutcomes, dashboard, benchmarks, roiApproach'
    },
    outputSchema: {
      type: 'object',
      required: ['participationMetrics', 'reachEngagement'],
      properties: {
        participationMetrics: { type: 'array', items: { type: 'object' } },
        reachEngagement: { type: 'array', items: { type: 'object' } },
        contentPerformance: { type: 'array', items: { type: 'object' } },
        influenceMetrics: { type: 'array', items: { type: 'object' } },
        businessOutcomes: { type: 'array', items: { type: 'object' } },
        dashboard: { type: 'object' },
        benchmarks: { type: 'object' },
        roiApproach: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'measurement-framework']
}));

export const validateAdvocacyProgramTask = defineTask('validate-advocacy-program', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Advocacy Program Quality',
  agent: {
    name: 'advocacy-program-validator',
    prompt: {
      role: 'Employee advocacy quality assessor',
      task: 'Validate employee advocacy program quality',
      context: args,
      instructions: [
        'Assess strategy clarity and objectives',
        'Evaluate participant identification',
        'Review platform selection appropriateness',
        'Assess content library quality',
        'Evaluate guidelines completeness',
        'Review training plan adequacy',
        'Assess recognition program appeal',
        'Provide overall quality score (0-100)'
      ],
      outputFormat: 'JSON with score, passed, strategyScore, participantScore, platformScore, contentScore, guidelinesScore, trainingScore, recognitionScore, measurementScore, gaps, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'passed'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        passed: { type: 'boolean' },
        strategyScore: { type: 'number' },
        participantScore: { type: 'number' },
        platformScore: { type: 'number' },
        contentScore: { type: 'number' },
        guidelinesScore: { type: 'number' },
        trainingScore: { type: 'number' },
        recognitionScore: { type: 'number' },
        measurementScore: { type: 'number' },
        gaps: { type: 'array', items: { type: 'string' } },
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
