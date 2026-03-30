/**
 * @process culture-assessment-transformation
 * @description Comprehensive process for assessing organizational culture, identifying gaps
 * between current and desired culture, and developing transformation initiatives to evolve
 * culture in alignment with business strategy and values.
 * @inputs {
 *   organizationContext: { industry, size, history, leadership, strategy },
 *   assessmentScope: { businessUnits, locations, populations },
 *   desiredCulture: { values, behaviors, attributes },
 *   changeContext: { drivers, urgency, readiness },
 *   stakeholders: { executiveTeam, hrLeadership, cultureChampions }
 * }
 * @outputs {
 *   cultureAssessment: { current, desired, gaps, strengths },
 *   transformationStrategy: { vision, pillars, initiatives },
 *   implementationPlan: { phases, milestones, resources },
 *   sustainmentFramework: { metrics, governance, reinforcement }
 * }
 * @example
 * const result = await process({
 *   organizationContext: { industry: 'manufacturing', size: 15000 },
 *   desiredCulture: { values: ['innovation', 'collaboration', 'customer-focus'] },
 *   changeContext: { drivers: ['digital-transformation', 'M&A-integration'] }
 * });
 * @references
 * - Denison Organizational Culture Survey
 * - Competing Values Framework (Quinn & Cameron)
 * - Kotter 8-Step Change Model
 * - Organizational Culture Inventory (OCI)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const { organizationContext, assessmentScope, desiredCulture, changeContext, stakeholders } = inputs;

  // Phase 1: Culture Assessment Design
  const assessmentDesign = await ctx.task('design-culture-assessment', {
    organizationContext,
    assessmentScope,
    designElements: [
      'assessment methodology selection',
      'measurement framework and dimensions',
      'data collection methods',
      'sample design and populations',
      'timeline and logistics'
    ]
  });

  // Phase 2: Current Culture Discovery
  const currentCultureDiscovery = await ctx.task('discover-current-culture', {
    assessmentDesign,
    organizationContext,
    discoveryElements: [
      'quantitative survey deployment',
      'focus group facilitation',
      'leadership interviews',
      'artifact and symbol analysis',
      'behavioral observation'
    ]
  });

  // Phase 3: Desired Culture Definition
  const desiredCultureDefinition = await ctx.task('define-desired-culture', {
    desiredCulture,
    organizationContext,
    changeContext,
    definitionElements: [
      'strategic alignment analysis',
      'leadership vision articulation',
      'core values clarification',
      'behavioral expectations definition',
      'success attributes identification'
    ]
  });

  // Phase 4: Culture Gap Analysis
  const gapAnalysis = await ctx.task('analyze-culture-gaps', {
    currentCultureDiscovery,
    desiredCultureDefinition,
    gapElements: [
      'dimension-by-dimension gap mapping',
      'subculture analysis',
      'strength identification',
      'barrier identification',
      'priority gap determination'
    ]
  });

  // Phase 5: Assessment Review
  await ctx.breakpoint('assessment-review', {
    title: 'Culture Assessment Review',
    description: 'Review culture assessment findings and gap analysis',
    artifacts: {
      currentCultureDiscovery,
      desiredCultureDefinition,
      gapAnalysis
    },
    questions: [
      'Is the current culture accurately characterized?',
      'Is the desired culture clearly defined?',
      'Are the priority gaps correctly identified?'
    ]
  });

  // Phase 6: Change Readiness Assessment
  const readinessAssessment = await ctx.task('assess-change-readiness', {
    gapAnalysis,
    changeContext,
    organizationContext,
    readinessElements: [
      'leadership alignment and commitment',
      'change capacity evaluation',
      'historical change success analysis',
      'resistance risk assessment',
      'enabler and barrier mapping'
    ]
  });

  // Phase 7: Transformation Vision Development
  const transformationVision = await ctx.task('develop-transformation-vision', {
    desiredCultureDefinition,
    gapAnalysis,
    readinessAssessment,
    visionElements: [
      'compelling case for change',
      'culture vision statement',
      'transformation themes and pillars',
      'success definition',
      'stakeholder value proposition'
    ]
  });

  // Phase 8: Strategy Development
  const strategyDevelopment = await ctx.task('develop-transformation-strategy', {
    transformationVision,
    gapAnalysis,
    readinessAssessment,
    strategyElements: [
      'strategic initiative identification',
      'lever selection (systems, symbols, behaviors)',
      'sequencing and prioritization',
      'resource requirements',
      'risk mitigation strategies'
    ]
  });

  // Phase 9: Strategy Approval
  await ctx.breakpoint('strategy-approval', {
    title: 'Transformation Strategy Approval',
    description: 'Review and approve culture transformation strategy',
    artifacts: {
      transformationVision,
      strategyDevelopment
    },
    questions: [
      'Is the transformation vision compelling?',
      'Are the strategic initiatives appropriate?',
      'Is the resource commitment sufficient?'
    ]
  });

  // Phase 10: Implementation Planning
  const implementationPlan = await ctx.task('create-implementation-plan', {
    strategyDevelopment,
    readinessAssessment,
    planElements: [
      'phased implementation roadmap',
      'quick wins and long-term initiatives',
      'milestone and checkpoint definition',
      'resource and budget allocation',
      'governance structure'
    ]
  });

  // Phase 11: Change Network Development
  const changeNetwork = await ctx.task('develop-change-network', {
    implementationPlan,
    stakeholders,
    networkElements: [
      'executive sponsor engagement',
      'culture champion identification and development',
      'manager enablement plan',
      'cross-functional change team',
      'communication cascade structure'
    ]
  });

  // Phase 12: Leadership Alignment
  const leadershipAlignment = await ctx.task('align-leadership', {
    transformationVision,
    strategyDevelopment,
    alignmentElements: [
      'executive alignment sessions',
      'leadership behavior expectations',
      'role modeling commitment',
      'accountability framework',
      'leadership development needs'
    ]
  });

  // Phase 13: Enabler Design
  const enablerDesign = await ctx.task('design-culture-enablers', {
    strategyDevelopment,
    gapAnalysis,
    enablerElements: [
      'HR system alignment (hiring, performance, rewards)',
      'organizational structure considerations',
      'process and policy changes',
      'physical environment changes',
      'technology and tools enablement'
    ]
  });

  // Phase 14: Communication Strategy
  const communicationStrategy = await ctx.task('develop-communication-strategy', {
    transformationVision,
    implementationPlan,
    changeNetwork,
    communicationElements: [
      'narrative and messaging framework',
      'stakeholder-specific communications',
      'channel and cadence planning',
      'feedback mechanisms',
      'storytelling and celebration plan'
    ]
  });

  // Phase 15: Sustainment Framework
  const sustainmentFramework = await ctx.task('establish-sustainment-framework', {
    implementationPlan,
    enablerDesign,
    sustainmentElements: [
      'culture metrics and KPIs',
      'measurement cadence',
      'reinforcement mechanisms',
      'course correction process',
      'long-term governance'
    ]
  });

  // Phase 16: Launch Preparation
  const launchPreparation = await ctx.task('prepare-launch', {
    implementationPlan,
    changeNetwork,
    communicationStrategy,
    preparationElements: [
      'launch event planning',
      'initial initiative kickoff',
      'quick win execution',
      'feedback collection setup',
      'early success monitoring'
    ]
  });

  return {
    cultureAssessment: {
      current: currentCultureDiscovery,
      desired: desiredCultureDefinition,
      gaps: gapAnalysis,
      readiness: readinessAssessment
    },
    transformationStrategy: {
      vision: transformationVision,
      strategy: strategyDevelopment,
      enablers: enablerDesign
    },
    implementation: {
      plan: implementationPlan,
      changeNetwork,
      leadershipAlignment,
      communication: communicationStrategy
    },
    sustainment: sustainmentFramework,
    launch: launchPreparation,
    metrics: {
      priorityGaps: gapAnalysis.priorityGapCount,
      initiativeCount: strategyDevelopment.initiativeCount,
      readinessScore: readinessAssessment.overallScore
    }
  };
}

export const designCultureAssessment = defineTask('design-culture-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Culture Assessment',
  agent: {
    name: 'organizational-development-specialist',
    prompt: {
      role: 'Culture Assessment Designer',
      task: 'Design comprehensive culture assessment approach',
      context: args,
      instructions: [
        'Select assessment methodology',
        'Define measurement framework and dimensions',
        'Design data collection methods',
        'Create sample design',
        'Plan timeline and logistics'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        methodology: { type: 'object' },
        framework: { type: 'object' },
        dataCollection: { type: 'array' },
        sampleDesign: { type: 'object' },
        timeline: { type: 'object' }
      },
      required: ['methodology', 'framework']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const discoverCurrentCulture = defineTask('discover-current-culture', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Discover Current Culture',
  agent: {
    name: 'culture-assessment-specialist',
    prompt: {
      role: 'Current Culture Discovery Expert',
      task: 'Discover and document current organizational culture',
      context: args,
      instructions: [
        'Deploy quantitative survey',
        'Facilitate focus groups',
        'Conduct leadership interviews',
        'Analyze artifacts and symbols',
        'Observe behaviors'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        surveyResults: { type: 'object' },
        focusGroupFindings: { type: 'array' },
        leadershipInterviews: { type: 'array' },
        artifactAnalysis: { type: 'object' },
        behaviorObservations: { type: 'array' }
      },
      required: ['surveyResults', 'focusGroupFindings']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const defineDesiredCulture = defineTask('define-desired-culture', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define Desired Culture',
  agent: {
    name: 'culture-strategist',
    prompt: {
      role: 'Desired Culture Definition Expert',
      task: 'Define desired organizational culture',
      context: args,
      instructions: [
        'Analyze strategic alignment requirements',
        'Articulate leadership vision',
        'Clarify core values',
        'Define behavioral expectations',
        'Identify success attributes'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        strategicAlignment: { type: 'object' },
        leadershipVision: { type: 'object' },
        coreValues: { type: 'array' },
        behavioralExpectations: { type: 'array' },
        successAttributes: { type: 'array' }
      },
      required: ['coreValues', 'behavioralExpectations']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const analyzeCultureGaps = defineTask('analyze-culture-gaps', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Culture Gaps',
  agent: {
    name: 'culture-assessment-specialist',
    prompt: {
      role: 'Culture Gap Analyst',
      task: 'Analyze gaps between current and desired culture',
      context: args,
      instructions: [
        'Map dimension-by-dimension gaps',
        'Analyze subcultures',
        'Identify strengths to leverage',
        'Identify barriers to change',
        'Determine priority gaps'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        dimensionGaps: { type: 'object' },
        subcultures: { type: 'array' },
        strengths: { type: 'array' },
        barriers: { type: 'array' },
        priorityGaps: { type: 'array' },
        priorityGapCount: { type: 'number' }
      },
      required: ['dimensionGaps', 'priorityGaps', 'priorityGapCount']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const assessChangeReadiness = defineTask('assess-change-readiness', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess Change Readiness',
  agent: {
    name: 'change-management-specialist',
    prompt: {
      role: 'Change Readiness Assessor',
      task: 'Assess organizational readiness for culture change',
      context: args,
      instructions: [
        'Evaluate leadership alignment',
        'Assess change capacity',
        'Analyze historical change success',
        'Identify resistance risks',
        'Map enablers and barriers'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        leadershipAlignment: { type: 'object' },
        changeCapacity: { type: 'object' },
        historicalSuccess: { type: 'object' },
        resistanceRisks: { type: 'array' },
        enablersBarriers: { type: 'object' },
        overallScore: { type: 'number' }
      },
      required: ['leadershipAlignment', 'resistanceRisks', 'overallScore']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const developTransformationVision = defineTask('develop-transformation-vision', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Transformation Vision',
  agent: {
    name: 'culture-strategist',
    prompt: {
      role: 'Transformation Vision Developer',
      task: 'Develop compelling culture transformation vision',
      context: args,
      instructions: [
        'Create compelling case for change',
        'Craft culture vision statement',
        'Define transformation themes and pillars',
        'Describe success state',
        'Articulate stakeholder value proposition'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        caseForChange: { type: 'object' },
        visionStatement: { type: 'string' },
        transformationPillars: { type: 'array' },
        successDefinition: { type: 'object' },
        valueProposition: { type: 'object' }
      },
      required: ['caseForChange', 'visionStatement', 'transformationPillars']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const developTransformationStrategy = defineTask('develop-transformation-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Transformation Strategy',
  agent: {
    name: 'organizational-development-strategist',
    prompt: {
      role: 'Culture Transformation Strategist',
      task: 'Develop culture transformation strategy',
      context: args,
      instructions: [
        'Identify strategic initiatives',
        'Select transformation levers',
        'Sequence and prioritize initiatives',
        'Define resource requirements',
        'Plan risk mitigation'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        initiatives: { type: 'array' },
        levers: { type: 'object' },
        prioritization: { type: 'array' },
        resources: { type: 'object' },
        riskMitigation: { type: 'array' },
        initiativeCount: { type: 'number' }
      },
      required: ['initiatives', 'prioritization', 'initiativeCount']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const createImplementationPlan = defineTask('create-implementation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Implementation Plan',
  agent: {
    name: 'program-manager',
    prompt: {
      role: 'Culture Implementation Planner',
      task: 'Create culture transformation implementation plan',
      context: args,
      instructions: [
        'Design phased implementation roadmap',
        'Identify quick wins and long-term initiatives',
        'Define milestones and checkpoints',
        'Allocate resources and budget',
        'Establish governance structure'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        phases: { type: 'array' },
        quickWins: { type: 'array' },
        milestones: { type: 'array' },
        resourceAllocation: { type: 'object' },
        governance: { type: 'object' }
      },
      required: ['phases', 'milestones']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const developChangeNetwork = defineTask('develop-change-network', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Change Network',
  agent: {
    name: 'change-management-specialist',
    prompt: {
      role: 'Change Network Developer',
      task: 'Develop culture change network',
      context: args,
      instructions: [
        'Engage executive sponsors',
        'Identify and develop culture champions',
        'Create manager enablement plan',
        'Form cross-functional change team',
        'Design communication cascade'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        executiveSponsors: { type: 'array' },
        cultureChampions: { type: 'array' },
        managerEnablement: { type: 'object' },
        changeTeam: { type: 'object' },
        communicationCascade: { type: 'object' }
      },
      required: ['executiveSponsors', 'cultureChampions']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const alignLeadership = defineTask('align-leadership', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Align Leadership',
  agent: {
    name: 'executive-coach',
    prompt: {
      role: 'Leadership Alignment Facilitator',
      task: 'Align leadership for culture transformation',
      context: args,
      instructions: [
        'Facilitate executive alignment sessions',
        'Define leadership behavior expectations',
        'Secure role modeling commitment',
        'Establish accountability framework',
        'Identify leadership development needs'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        alignmentSessions: { type: 'array' },
        behaviorExpectations: { type: 'array' },
        roleModelingCommitment: { type: 'object' },
        accountabilityFramework: { type: 'object' },
        developmentNeeds: { type: 'array' }
      },
      required: ['behaviorExpectations', 'accountabilityFramework']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const designCultureEnablers = defineTask('design-culture-enablers', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design Culture Enablers',
  agent: {
    name: 'organizational-development-specialist',
    prompt: {
      role: 'Culture Enabler Designer',
      task: 'Design systems and enablers to support culture change',
      context: args,
      instructions: [
        'Align HR systems (hiring, performance, rewards)',
        'Evaluate organizational structure',
        'Identify process and policy changes',
        'Consider physical environment changes',
        'Plan technology and tools enablement'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        hrSystemAlignment: { type: 'object' },
        structureConsiderations: { type: 'object' },
        policyChanges: { type: 'array' },
        environmentChanges: { type: 'array' },
        technologyEnablement: { type: 'object' }
      },
      required: ['hrSystemAlignment', 'policyChanges']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const developCommunicationStrategy = defineTask('develop-communication-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Communication Strategy',
  agent: {
    name: 'change-communications-specialist',
    prompt: {
      role: 'Culture Communication Strategist',
      task: 'Develop culture transformation communication strategy',
      context: args,
      instructions: [
        'Create narrative and messaging framework',
        'Design stakeholder-specific communications',
        'Plan channels and cadence',
        'Establish feedback mechanisms',
        'Plan storytelling and celebration'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        narrative: { type: 'object' },
        stakeholderCommunications: { type: 'object' },
        channelPlan: { type: 'object' },
        feedbackMechanisms: { type: 'array' },
        storytellingPlan: { type: 'object' }
      },
      required: ['narrative', 'channelPlan']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const establishSustainmentFramework = defineTask('establish-sustainment-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish Sustainment Framework',
  agent: {
    name: 'culture-governance-specialist',
    prompt: {
      role: 'Culture Sustainment Expert',
      task: 'Establish culture sustainment framework',
      context: args,
      instructions: [
        'Define culture metrics and KPIs',
        'Establish measurement cadence',
        'Design reinforcement mechanisms',
        'Create course correction process',
        'Establish long-term governance'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        metrics: { type: 'array' },
        measurementCadence: { type: 'object' },
        reinforcementMechanisms: { type: 'array' },
        courseCorrectionProcess: { type: 'object' },
        governance: { type: 'object' }
      },
      required: ['metrics', 'governance']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));

export const prepareLaunch = defineTask('prepare-launch', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare Launch',
  agent: {
    name: 'program-manager',
    prompt: {
      role: 'Culture Launch Coordinator',
      task: 'Prepare culture transformation launch',
      context: args,
      instructions: [
        'Plan launch event',
        'Kick off initial initiatives',
        'Execute quick wins',
        'Set up feedback collection',
        'Establish early success monitoring'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      properties: {
        launchEvent: { type: 'object' },
        initialKickoffs: { type: 'array' },
        quickWinExecution: { type: 'array' },
        feedbackSetup: { type: 'object' },
        successMonitoring: { type: 'object' }
      },
      required: ['launchEvent', 'quickWinExecution']
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  }
}));
