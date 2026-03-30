/**
 * @process humanities/ethnographic-fieldwork-planning
 * @description Design and prepare for immersive fieldwork including site selection, ethical approval, community engagement protocols, and research methodology framework development
 * @inputs { researchQuestion: string, fieldSite: string, duration: string, communityContext: object }
 * @outputs { success: boolean, fieldworkPlan: object, ethicsProtocol: object, artifacts: array }
 * @recommendedSkills SK-HUM-006 (research-ethics-irb-navigation), SK-HUM-002 (ethnographic-coding-thematics)
 * @recommendedAgents AG-HUM-002 (ethnographic-methods-advisor), AG-HUM-008 (research-ethics-consultant)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    researchQuestion,
    fieldSite,
    duration = '6 months',
    communityContext = {},
    outputDir = 'fieldwork-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Site Selection and Feasibility Assessment
  ctx.log('info', 'Starting fieldwork planning: Site selection and feasibility');
  const siteAssessment = await ctx.task(siteSelectionTask, {
    researchQuestion,
    fieldSite,
    communityContext,
    outputDir
  });

  if (!siteAssessment.success) {
    return {
      success: false,
      error: 'Site assessment failed',
      details: siteAssessment,
      metadata: { processId: 'humanities/ethnographic-fieldwork-planning', timestamp: startTime }
    };
  }

  artifacts.push(...siteAssessment.artifacts);

  // Task 2: Ethics and IRB Protocol Development
  ctx.log('info', 'Developing ethics and IRB protocols');
  const ethicsProtocol = await ctx.task(ethicsProtocolTask, {
    researchQuestion,
    fieldSite,
    communityContext,
    siteAssessment,
    outputDir
  });

  artifacts.push(...ethicsProtocol.artifacts);

  // Task 3: Community Engagement Strategy
  ctx.log('info', 'Developing community engagement strategy');
  const communityEngagement = await ctx.task(communityEngagementTask, {
    fieldSite,
    communityContext,
    ethicsProtocol,
    outputDir
  });

  artifacts.push(...communityEngagement.artifacts);

  // Task 4: Research Methodology Framework
  ctx.log('info', 'Establishing research methodology framework');
  const methodologyFramework = await ctx.task(methodologyFrameworkTask, {
    researchQuestion,
    fieldSite,
    duration,
    siteAssessment,
    outputDir
  });

  artifacts.push(...methodologyFramework.artifacts);

  // Task 5: Logistics and Safety Planning
  ctx.log('info', 'Planning logistics and safety protocols');
  const logisticsPlanning = await ctx.task(logisticsPlanningTask, {
    fieldSite,
    duration,
    communityContext,
    outputDir
  });

  artifacts.push(...logisticsPlanning.artifacts);

  // Task 6: Data Collection Protocols
  ctx.log('info', 'Establishing data collection protocols');
  const dataProtocols = await ctx.task(dataCollectionProtocolTask, {
    researchQuestion,
    methodologyFramework,
    ethicsProtocol,
    outputDir
  });

  artifacts.push(...dataProtocols.artifacts);

  // Task 7: Generate Comprehensive Fieldwork Plan
  ctx.log('info', 'Generating comprehensive fieldwork plan');
  const fieldworkPlan = await ctx.task(fieldworkPlanGenerationTask, {
    researchQuestion,
    fieldSite,
    duration,
    siteAssessment,
    ethicsProtocol,
    communityEngagement,
    methodologyFramework,
    logisticsPlanning,
    dataProtocols,
    outputDir
  });

  artifacts.push(...fieldworkPlan.artifacts);

  // Breakpoint: Review fieldwork plan
  await ctx.breakpoint({
    question: `Fieldwork plan complete for ${fieldSite}. Duration: ${duration}. Ethics protocol: ${ethicsProtocol.irbStatus}. Review plan?`,
    title: 'Ethnographic Fieldwork Planning Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        fieldSite,
        duration,
        ethicsStatus: ethicsProtocol.irbStatus,
        communityPartners: communityEngagement.partners?.length || 0,
        methodologies: methodologyFramework.methods
      }
    }
  });

  const endTime = ctx.now();
  const duration_ms = endTime - startTime;

  return {
    success: true,
    fieldworkPlan: {
      site: fieldSite,
      duration,
      researchQuestion,
      timeline: fieldworkPlan.timeline,
      milestones: fieldworkPlan.milestones
    },
    ethicsProtocol: {
      irbStatus: ethicsProtocol.irbStatus,
      consentProtocols: ethicsProtocol.consentProtocols,
      communityProtocols: ethicsProtocol.communityProtocols
    },
    communityEngagement: {
      partners: communityEngagement.partners,
      engagementStrategies: communityEngagement.strategies
    },
    methodology: {
      methods: methodologyFramework.methods,
      dataCollectionStrategies: dataProtocols.strategies
    },
    logistics: {
      accommodations: logisticsPlanning.accommodations,
      safetyProtocols: logisticsPlanning.safetyProtocols,
      contingencyPlans: logisticsPlanning.contingencyPlans
    },
    artifacts,
    duration: duration_ms,
    metadata: {
      processId: 'humanities/ethnographic-fieldwork-planning',
      timestamp: startTime,
      fieldSite,
      outputDir
    }
  };
}

// Task 1: Site Selection and Feasibility Assessment
export const siteSelectionTask = defineTask('site-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess site selection and feasibility',
  agent: {
    name: 'ethnographer',
    prompt: {
      role: 'cultural anthropologist',
      task: 'Evaluate fieldwork site selection and assess feasibility',
      context: args,
      instructions: [
        'Analyze proposed site in relation to research question',
        'Assess accessibility and logistical considerations',
        'Evaluate existing ethnographic literature on the region/community',
        'Identify key gatekeepers and potential community liaisons',
        'Assess language requirements and translation needs',
        'Evaluate political/safety considerations',
        'Document site characteristics and population',
        'Provide feasibility recommendation with rationale'
      ],
      outputFormat: 'JSON with success, siteAnalysis, feasibility, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'siteAnalysis', 'feasibility', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        siteAnalysis: {
          type: 'object',
          properties: {
            demographics: { type: 'object' },
            accessibility: { type: 'string' },
            languageRequirements: { type: 'array', items: { type: 'string' } },
            existingLiterature: { type: 'array', items: { type: 'string' } }
          }
        },
        feasibility: {
          type: 'object',
          properties: {
            score: { type: 'number' },
            strengths: { type: 'array', items: { type: 'string' } },
            challenges: { type: 'array', items: { type: 'string' } }
          }
        },
        gatekeepers: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ethnography', 'site-selection', 'feasibility']
}));

// Task 2: Ethics and IRB Protocol Development
export const ethicsProtocolTask = defineTask('ethics-protocol', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop ethics and IRB protocols',
  agent: {
    name: 'research-ethics-specialist',
    prompt: {
      role: 'research ethics specialist',
      task: 'Develop comprehensive ethics and IRB protocols for ethnographic research',
      context: args,
      instructions: [
        'Draft IRB application materials',
        'Develop informed consent protocols appropriate for community',
        'Address cultural considerations in consent processes',
        'Create protocols for vulnerable population protections',
        'Develop data privacy and confidentiality safeguards',
        'Address community ownership of data and findings',
        'Create protocols for handling sensitive information',
        'Develop benefit-sharing framework with community'
      ],
      outputFormat: 'JSON with irbStatus, consentProtocols, communityProtocols, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['irbStatus', 'consentProtocols', 'artifacts'],
      properties: {
        irbStatus: { type: 'string' },
        consentProtocols: {
          type: 'object',
          properties: {
            writtenConsent: { type: 'object' },
            oralConsent: { type: 'object' },
            communityConsent: { type: 'object' }
          }
        },
        communityProtocols: {
          type: 'object',
          properties: {
            dataOwnership: { type: 'string' },
            benefitSharing: { type: 'string' },
            dissemination: { type: 'string' }
          }
        },
        vulnerablePopulations: { type: 'object' },
        confidentialityMeasures: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'ethics', 'irb', 'consent-protocols']
}));

// Task 3: Community Engagement Strategy
export const communityEngagementTask = defineTask('community-engagement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop community engagement strategy',
  agent: {
    name: 'community-liaison',
    prompt: {
      role: 'community-based researcher',
      task: 'Develop comprehensive community engagement strategy',
      context: args,
      instructions: [
        'Identify key community stakeholders and leaders',
        'Develop culturally appropriate introduction protocols',
        'Create reciprocity and benefit-sharing frameworks',
        'Design community feedback mechanisms',
        'Establish communication protocols with community',
        'Develop strategies for building trust and rapport',
        'Create plan for ongoing community involvement',
        'Address power dynamics and positionality'
      ],
      outputFormat: 'JSON with partners, strategies, protocols, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['partners', 'strategies', 'artifacts'],
      properties: {
        partners: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              role: { type: 'string' },
              contactStrategy: { type: 'string' }
            }
          }
        },
        strategies: {
          type: 'object',
          properties: {
            introduction: { type: 'string' },
            trustBuilding: { type: 'array', items: { type: 'string' } },
            reciprocity: { type: 'array', items: { type: 'string' } }
          }
        },
        feedbackMechanisms: { type: 'array', items: { type: 'string' } },
        positionality: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'community-engagement', 'stakeholders', 'ethnography']
}));

// Task 4: Research Methodology Framework
export const methodologyFrameworkTask = defineTask('methodology-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish research methodology framework',
  agent: {
    name: 'methodology-specialist',
    prompt: {
      role: 'qualitative research methodologist',
      task: 'Develop comprehensive ethnographic methodology framework',
      context: args,
      instructions: [
        'Design participant observation protocols',
        'Develop interview methodology (structured, semi-structured, life history)',
        'Create field note documentation standards',
        'Establish coding and analysis frameworks',
        'Design mixed methods integration if applicable',
        'Develop reflexivity and positionality protocols',
        'Create validity and trustworthiness measures',
        'Establish theoretical framework alignment'
      ],
      outputFormat: 'JSON with methods, protocols, frameworks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['methods', 'protocols', 'artifacts'],
      properties: {
        methods: {
          type: 'array',
          items: { type: 'string' }
        },
        protocols: {
          type: 'object',
          properties: {
            participantObservation: { type: 'object' },
            interviews: { type: 'object' },
            fieldNotes: { type: 'object' }
          }
        },
        analysisFramework: {
          type: 'object',
          properties: {
            codingApproach: { type: 'string' },
            theoreticalFramework: { type: 'string' }
          }
        },
        validityMeasures: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'methodology', 'ethnography', 'qualitative-research']
}));

// Task 5: Logistics and Safety Planning
export const logisticsPlanningTask = defineTask('logistics-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan logistics and safety protocols',
  agent: {
    name: 'field-coordinator',
    prompt: {
      role: 'field research coordinator',
      task: 'Develop comprehensive logistics and safety plan',
      context: args,
      instructions: [
        'Plan accommodation and living arrangements',
        'Develop transportation logistics',
        'Create equipment and supply lists',
        'Establish communication protocols with home institution',
        'Develop health and safety protocols',
        'Create emergency response procedures',
        'Plan budget and financial logistics',
        'Develop contingency plans for various scenarios'
      ],
      outputFormat: 'JSON with accommodations, safetyProtocols, contingencyPlans, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['accommodations', 'safetyProtocols', 'artifacts'],
      properties: {
        accommodations: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            location: { type: 'string' },
            arrangements: { type: 'string' }
          }
        },
        transportation: { type: 'object' },
        equipment: { type: 'array', items: { type: 'string' } },
        safetyProtocols: {
          type: 'object',
          properties: {
            healthMeasures: { type: 'array', items: { type: 'string' } },
            emergencyContacts: { type: 'array' },
            checkInSchedule: { type: 'string' }
          }
        },
        budget: { type: 'object' },
        contingencyPlans: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'logistics', 'safety', 'fieldwork']
}));

// Task 6: Data Collection Protocols
export const dataCollectionProtocolTask = defineTask('data-collection-protocol', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish data collection protocols',
  agent: {
    name: 'data-management-specialist',
    prompt: {
      role: 'ethnographic data specialist',
      task: 'Develop comprehensive data collection and management protocols',
      context: args,
      instructions: [
        'Design field note templates and formats',
        'Establish audio/video recording protocols',
        'Create transcription and translation workflows',
        'Develop data organization and storage systems',
        'Establish backup and security protocols',
        'Create metadata standards for materials',
        'Design photo documentation protocols',
        'Develop artifact collection procedures'
      ],
      outputFormat: 'JSON with strategies, templates, workflows, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'templates', 'artifacts'],
      properties: {
        strategies: {
          type: 'array',
          items: { type: 'string' }
        },
        templates: {
          type: 'object',
          properties: {
            fieldNotes: { type: 'object' },
            interviewGuide: { type: 'object' },
            observationSheet: { type: 'object' }
          }
        },
        recordingProtocols: { type: 'object' },
        dataManagement: {
          type: 'object',
          properties: {
            storage: { type: 'string' },
            backup: { type: 'string' },
            security: { type: 'string' }
          }
        },
        metadataStandards: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'data-collection', 'ethnography', 'documentation']
}));

// Task 7: Fieldwork Plan Generation
export const fieldworkPlanGenerationTask = defineTask('fieldwork-plan-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive fieldwork plan',
  agent: {
    name: 'fieldwork-planner',
    prompt: {
      role: 'senior ethnographer',
      task: 'Compile comprehensive fieldwork plan document',
      context: args,
      instructions: [
        'Create executive summary of fieldwork plan',
        'Develop detailed timeline with phases',
        'Define milestones and deliverables',
        'Integrate all component plans',
        'Create risk assessment matrix',
        'Develop quality assurance measures',
        'Establish success criteria',
        'Format as professional research proposal'
      ],
      outputFormat: 'JSON with timeline, milestones, deliverables, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['timeline', 'milestones', 'artifacts'],
      properties: {
        timeline: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              duration: { type: 'string' },
              activities: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        milestones: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              date: { type: 'string' },
              criteria: { type: 'string' }
            }
          }
        },
        deliverables: { type: 'array', items: { type: 'string' } },
        riskAssessment: { type: 'array', items: { type: 'object' } },
        successCriteria: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fieldwork-planning', 'ethnography', 'research-proposal']
}));
