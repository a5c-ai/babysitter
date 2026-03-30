/**
 * @process arts-culture/cultural-planning
 * @description Cultural planning process for municipalities and regions - integrating arts and culture into urban development, placemaking, and community identity building
 * @inputs {
 *   jurisdiction: { name: string, type: 'municipality' | 'region' | 'state', population: number },
 *   planningScope: { timeframe: string, geographicArea: string, sectors: string[] },
 *   existingPolicies: { culturalPlan: string, comprehensivePlan: string, economicDevPlan: string },
 *   stakeholderGroups: string[],
 *   budgetConstraints: { annualCulturalBudget: number, capitalFundsAvailable: number },
 *   priorityAreas: string[]
 * }
 * @outputs {
 *   culturalMappingReport: object,
 *   communityEngagementSummary: object,
 *   culturalAssetInventory: object,
 *   needsAssessment: object,
 *   visionAndGoals: object,
 *   strategicFramework: object,
 *   implementationPlan: object,
 *   culturalPlanDocument: object
 * }
 * @recommendedSkills SK-AC-010 (cultural-policy-analysis), SK-AC-013 (stakeholder-facilitation), SK-AC-015 (arts-advocacy-communication)
 * @recommendedAgents AG-AC-009 (cultural-policy-agent), AG-AC-002 (arts-administrator-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  // Phase 1: Cultural Mapping and Asset Inventory
  const culturalMapping = await ctx.task(culturalMappingTask, {
    jurisdiction: inputs.jurisdiction,
    planningScope: inputs.planningScope,
    sectors: inputs.planningScope.sectors
  });

  // Phase 2: Stakeholder Engagement Planning
  const engagementPlan = await ctx.task(stakeholderEngagementPlanTask, {
    jurisdiction: inputs.jurisdiction,
    stakeholderGroups: inputs.stakeholderGroups,
    culturalMapping: culturalMapping
  });

  // Phase 3: Community Consultation and Input
  const communityInput = await ctx.task(communityConsultationTask, {
    engagementPlan: engagementPlan,
    stakeholderGroups: inputs.stakeholderGroups,
    priorityAreas: inputs.priorityAreas
  });

  // Phase 4: Needs Assessment and Gap Analysis
  const needsAssessment = await ctx.task(needsAssessmentTask, {
    culturalMapping: culturalMapping,
    communityInput: communityInput,
    existingPolicies: inputs.existingPolicies
  });

  // Phase 5: Vision and Goals Development
  const visionGoals = await ctx.task(visionGoalsDevelopmentTask, {
    jurisdiction: inputs.jurisdiction,
    communityInput: communityInput,
    needsAssessment: needsAssessment,
    priorityAreas: inputs.priorityAreas
  });

  // Breakpoint: Vision and Strategic Direction Review
  await ctx.breakpoint('vision-review', {
    title: 'Cultural Plan Vision and Goals Review',
    description: 'Review proposed vision, goals, and strategic direction for cultural plan',
    context: {
      jurisdiction: inputs.jurisdiction,
      visionGoals: visionGoals,
      communityInput: communityInput,
      needsAssessment: needsAssessment
    }
  });

  // Phase 6: Strategic Framework Development
  const strategicFramework = await ctx.task(strategicFrameworkTask, {
    visionGoals: visionGoals,
    needsAssessment: needsAssessment,
    budgetConstraints: inputs.budgetConstraints,
    existingPolicies: inputs.existingPolicies
  });

  // Phase 7: Implementation Planning
  const implementationPlan = await ctx.task(implementationPlanTask, {
    strategicFramework: strategicFramework,
    budgetConstraints: inputs.budgetConstraints,
    timeframe: inputs.planningScope.timeframe
  });

  // Phase 8: Cultural Plan Document Assembly
  const culturalPlan = await ctx.task(planDocumentAssemblyTask, {
    jurisdiction: inputs.jurisdiction,
    culturalMapping: culturalMapping,
    communityInput: communityInput,
    needsAssessment: needsAssessment,
    visionGoals: visionGoals,
    strategicFramework: strategicFramework,
    implementationPlan: implementationPlan
  });

  // Final Breakpoint: Cultural Plan Approval
  await ctx.breakpoint('plan-approval', {
    title: 'Cultural Plan Final Approval',
    description: 'Review and approve final cultural plan document for adoption',
    context: {
      culturalPlan: culturalPlan,
      implementationPlan: implementationPlan
    }
  });

  return {
    culturalMappingReport: culturalMapping,
    communityEngagementSummary: communityInput,
    culturalAssetInventory: culturalMapping.assetInventory,
    needsAssessment: needsAssessment,
    visionAndGoals: visionGoals,
    strategicFramework: strategicFramework,
    implementationPlan: implementationPlan,
    culturalPlanDocument: culturalPlan
  };
}

export const culturalMappingTask = defineTask('cultural-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Cultural Mapping and Asset Inventory',
  agent: {
    name: 'cultural-planning-specialist',
    prompt: {
      role: 'Cultural planning specialist with expertise in cultural mapping, asset inventories, and creative economy analysis',
      task: 'Conduct comprehensive cultural mapping for the jurisdiction',
      context: args,
      instructions: [
        'Map all cultural facilities: museums, galleries, theaters, libraries, cultural centers',
        'Inventory public art, monuments, and heritage sites',
        'Identify creative industries and cultural enterprises',
        'Document festivals, events, and cultural programming',
        'Map cultural organizations and artist communities',
        'Analyze cultural participation data and demographics',
        'Identify cultural districts and creative corridors',
        'Assess cultural workforce and employment',
        'Document intangible cultural heritage and traditions',
        'Create GIS-compatible cultural asset database'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['assetInventory', 'culturalDistricts', 'creativeEconomy', 'participationAnalysis'],
      properties: {
        assetInventory: {
          type: 'object',
          properties: {
            facilities: { type: 'array' },
            publicArt: { type: 'array' },
            heritageSites: { type: 'array' },
            organizations: { type: 'array' }
          }
        },
        culturalDistricts: { type: 'array' },
        creativeEconomy: {
          type: 'object',
          properties: {
            enterprises: { type: 'number' },
            employment: { type: 'number' },
            economicImpact: { type: 'number' }
          }
        },
        participationAnalysis: { type: 'object' },
        gapAreas: { type: 'array' },
        mappingMethodology: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['planning', 'mapping', 'inventory']
}));

export const stakeholderEngagementPlanTask = defineTask('stakeholder-engagement-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Stakeholder Engagement Planning',
  agent: {
    name: 'community-engagement-specialist',
    prompt: {
      role: 'Community engagement specialist with expertise in participatory planning and stakeholder facilitation',
      task: 'Design comprehensive stakeholder engagement plan for cultural planning process',
      context: args,
      instructions: [
        'Identify all stakeholder groups and their interests',
        'Design engagement methods appropriate for each group',
        'Plan public forums, town halls, and community meetings',
        'Develop online engagement and survey strategies',
        'Create focus group protocols for specific sectors',
        'Design youth and underrepresented community outreach',
        'Plan artist and creative industry consultations',
        'Develop engagement timeline and milestones',
        'Create accessibility and language access plan',
        'Design feedback synthesis methodology'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['engagementMethods', 'timeline', 'outreachStrategies'],
      properties: {
        engagementMethods: { type: 'array' },
        timeline: { type: 'object' },
        outreachStrategies: { type: 'object' },
        accessibilityPlan: { type: 'object' },
        feedbackProcessing: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['engagement', 'planning', 'stakeholders']
}));

export const communityConsultationTask = defineTask('community-consultation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Community Consultation and Input Synthesis',
  agent: {
    name: 'community-engagement-specialist',
    prompt: {
      role: 'Community engagement specialist with expertise in qualitative analysis and participatory planning',
      task: 'Synthesize community input and consultation findings',
      context: args,
      instructions: [
        'Compile input from all engagement activities',
        'Analyze themes and patterns in community feedback',
        'Identify priority issues and opportunities',
        'Document diverse perspectives and viewpoints',
        'Highlight equity and access concerns',
        'Synthesize artist and creative sector input',
        'Analyze geographic variations in input',
        'Document demographic representation in engagement',
        'Identify areas of consensus and divergence',
        'Create community voice documentation'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['themes', 'priorities', 'equityConcerns', 'recommendations'],
      properties: {
        themes: { type: 'array' },
        priorities: { type: 'array' },
        equityConcerns: { type: 'array' },
        recommendations: { type: 'array' },
        participationMetrics: { type: 'object' },
        communityVoices: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['consultation', 'community', 'synthesis']
}));

export const needsAssessmentTask = defineTask('needs-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Cultural Needs Assessment and Gap Analysis',
  agent: {
    name: 'cultural-planning-specialist',
    prompt: {
      role: 'Cultural planning specialist with expertise in needs assessment and gap analysis',
      task: 'Conduct comprehensive cultural needs assessment and gap analysis',
      context: args,
      instructions: [
        'Analyze cultural facility needs by geography and population',
        'Assess programming gaps across art forms and demographics',
        'Evaluate cultural access and equity issues',
        'Identify workforce development needs',
        'Assess funding and resource gaps',
        'Analyze infrastructure and space needs',
        'Evaluate marketing and awareness gaps',
        'Assess capacity building needs for organizations',
        'Identify policy and regulatory barriers',
        'Benchmark against comparable jurisdictions'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['facilityNeeds', 'programmingGaps', 'equityIssues', 'prioritizedNeeds'],
      properties: {
        facilityNeeds: { type: 'array' },
        programmingGaps: { type: 'array' },
        equityIssues: { type: 'array' },
        workforceNeeds: { type: 'array' },
        fundingGaps: { type: 'object' },
        policyBarriers: { type: 'array' },
        prioritizedNeeds: { type: 'array' },
        benchmarkAnalysis: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['assessment', 'gaps', 'analysis']
}));

export const visionGoalsDevelopmentTask = defineTask('vision-goals-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Vision and Goals Development',
  agent: {
    name: 'cultural-planning-specialist',
    prompt: {
      role: 'Cultural planning specialist with expertise in strategic visioning and goal setting',
      task: 'Develop cultural plan vision, goals, and guiding principles',
      context: args,
      instructions: [
        'Craft inspiring and inclusive vision statement',
        'Develop mission statement for cultural development',
        'Establish guiding principles and values',
        'Create goal areas aligned with community priorities',
        'Develop SMART objectives for each goal area',
        'Ensure alignment with comprehensive plan',
        'Integrate equity and inclusion commitments',
        'Connect to economic development goals',
        'Address sustainability and resilience',
        'Create outcomes framework for measurement'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['vision', 'mission', 'goals', 'objectives'],
      properties: {
        vision: { type: 'string' },
        mission: { type: 'string' },
        guidingPrinciples: { type: 'array' },
        goals: { type: 'array' },
        objectives: { type: 'array' },
        equityCommitments: { type: 'array' },
        outcomesFramework: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['vision', 'goals', 'strategic']
}));

export const strategicFrameworkTask = defineTask('strategic-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Strategic Framework Development',
  agent: {
    name: 'cultural-planning-specialist',
    prompt: {
      role: 'Cultural planning specialist with expertise in strategic planning and policy development',
      task: 'Develop strategic framework with strategies and initiatives',
      context: args,
      instructions: [
        'Develop strategies for each goal area',
        'Design specific initiatives and programs',
        'Create policy recommendations',
        'Develop funding strategies and mechanisms',
        'Design partnership frameworks',
        'Create cultural district strategies',
        'Develop public art and placemaking approaches',
        'Design creative economy development strategies',
        'Create equity and access strategies',
        'Develop organizational capacity building approaches'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'initiatives', 'policies', 'fundingStrategies'],
      properties: {
        strategies: { type: 'array' },
        initiatives: { type: 'array' },
        policies: { type: 'array' },
        fundingStrategies: { type: 'object' },
        partnershipFramework: { type: 'object' },
        culturalDistrictStrategies: { type: 'array' },
        equityStrategies: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['strategy', 'framework', 'initiatives']
}));

export const implementationPlanTask = defineTask('implementation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implementation Planning',
  agent: {
    name: 'cultural-planning-specialist',
    prompt: {
      role: 'Cultural planning specialist with expertise in implementation planning and project management',
      task: 'Develop detailed implementation plan for cultural plan',
      context: args,
      instructions: [
        'Create phased implementation timeline',
        'Develop detailed action plans for each strategy',
        'Assign roles and responsibilities',
        'Create budget projections and resource allocation',
        'Develop performance metrics and KPIs',
        'Design monitoring and evaluation framework',
        'Create governance and oversight structure',
        'Develop partnership and collaboration mechanisms',
        'Create communication and engagement plan',
        'Design annual review and update process'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['phasing', 'actionPlans', 'budgetProjections', 'metrics'],
      properties: {
        phasing: { type: 'object' },
        actionPlans: { type: 'array' },
        rolesResponsibilities: { type: 'object' },
        budgetProjections: { type: 'object' },
        metrics: { type: 'array' },
        evaluationFramework: { type: 'object' },
        governanceStructure: { type: 'object' },
        reviewProcess: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['implementation', 'timeline', 'budget']
}));

export const planDocumentAssemblyTask = defineTask('plan-document-assembly', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Cultural Plan Document Assembly',
  agent: {
    name: 'cultural-planning-specialist',
    prompt: {
      role: 'Cultural planning specialist with expertise in plan writing and document development',
      task: 'Assemble comprehensive cultural plan document',
      context: args,
      instructions: [
        'Write executive summary',
        'Compile introduction and planning context',
        'Document community engagement process and findings',
        'Present cultural mapping and needs assessment',
        'Articulate vision, goals, and strategic framework',
        'Detail implementation plan and timeline',
        'Include appendices with supporting data',
        'Create visual presentations and infographics',
        'Develop summary versions for different audiences',
        'Prepare adoption resolution language'
      ],
      outputFormat: 'JSON'
    },
    outputSchema: {
      type: 'object',
      required: ['executiveSummary', 'chapters', 'appendices'],
      properties: {
        executiveSummary: { type: 'string' },
        chapters: { type: 'array' },
        appendices: { type: 'array' },
        visualElements: { type: 'array' },
        summaryVersions: { type: 'object' },
        adoptionResolution: { type: 'string' },
        documentMetadata: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['document', 'assembly', 'final']
}));
