/**
 * @process arts-culture/community-engagement
 * @description Framework for building meaningful relationships with diverse communities through participatory programming, outreach initiatives, and inclusive practices
 * @inputs { organizationName: string, targetCommunities: array, engagementGoals: array, existingRelationships: object }
 * @outputs { success: boolean, engagementStrategy: object, programs: array, partnerships: array, artifacts: array }
 * @recommendedSkills SK-AC-012 (accessibility-compliance), SK-AC-013 (stakeholder-facilitation), SK-AC-008 (interpretive-writing)
 * @recommendedAgents AG-AC-007 (education-outreach-agent), AG-AC-009 (cultural-policy-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    organizationName,
    targetCommunities = [],
    engagementGoals = [],
    existingRelationships = {},
    geographicArea = '',
    outputDir = 'community-engagement-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Community Assessment
  ctx.log('info', 'Conducting community assessment');
  const communityAssessment = await ctx.task(communityAssessmentTask, {
    organizationName,
    targetCommunities,
    geographicArea,
    existingRelationships,
    outputDir
  });

  if (!communityAssessment.success) {
    return {
      success: false,
      error: 'Community assessment failed',
      details: communityAssessment,
      metadata: { processId: 'arts-culture/community-engagement', timestamp: startTime }
    };
  }

  artifacts.push(...communityAssessment.artifacts);

  // Task 2: Stakeholder Mapping
  ctx.log('info', 'Mapping community stakeholders');
  const stakeholderMapping = await ctx.task(stakeholderMappingTask, {
    targetCommunities,
    communityAssessment: communityAssessment.assessment,
    existingRelationships,
    outputDir
  });

  artifacts.push(...stakeholderMapping.artifacts);

  // Task 3: Engagement Strategy Development
  ctx.log('info', 'Developing engagement strategy');
  const engagementStrategy = await ctx.task(engagementStrategyTask, {
    organizationName,
    engagementGoals,
    communityAssessment: communityAssessment.assessment,
    stakeholderMapping: stakeholderMapping.map,
    outputDir
  });

  artifacts.push(...engagementStrategy.artifacts);

  // Task 4: Participatory Programming Design
  ctx.log('info', 'Designing participatory programs');
  const participatoryPrograms = await ctx.task(participatoryProgramsTask, {
    organizationName,
    targetCommunities,
    engagementStrategy: engagementStrategy.strategy,
    outputDir
  });

  artifacts.push(...participatoryPrograms.artifacts);

  // Task 5: Outreach Initiatives
  ctx.log('info', 'Planning outreach initiatives');
  const outreachInitiatives = await ctx.task(outreachInitiativesTask, {
    organizationName,
    targetCommunities,
    stakeholderMapping: stakeholderMapping.map,
    engagementStrategy: engagementStrategy.strategy,
    outputDir
  });

  artifacts.push(...outreachInitiatives.artifacts);

  // Task 6: Inclusive Practices Framework
  ctx.log('info', 'Developing inclusive practices framework');
  const inclusivePractices = await ctx.task(inclusivePracticesTask, {
    organizationName,
    targetCommunities,
    communityAssessment: communityAssessment.assessment,
    outputDir
  });

  artifacts.push(...inclusivePractices.artifacts);

  // Breakpoint: Review engagement strategy
  await ctx.breakpoint({
    question: `Community engagement strategy for ${organizationName} complete. ${targetCommunities.length} communities targeted. ${participatoryPrograms.programs.length} programs designed. Review and approve?`,
    title: 'Community Engagement Strategy Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        organizationName,
        communitiesTargeted: targetCommunities.length,
        stakeholders: stakeholderMapping.map.length,
        programs: participatoryPrograms.programs.length,
        initiatives: outreachInitiatives.initiatives.length
      }
    }
  });

  // Task 7: Partnership Development
  ctx.log('info', 'Developing community partnerships');
  const partnershipDevelopment = await ctx.task(partnershipDevelopmentTask, {
    organizationName,
    stakeholderMapping: stakeholderMapping.map,
    engagementStrategy: engagementStrategy.strategy,
    outputDir
  });

  artifacts.push(...partnershipDevelopment.artifacts);

  // Task 8: Evaluation and Impact Measurement
  ctx.log('info', 'Creating evaluation and impact framework');
  const evaluationFramework = await ctx.task(evaluationImpactTask, {
    organizationName,
    engagementGoals,
    programs: participatoryPrograms.programs,
    outputDir
  });

  artifacts.push(...evaluationFramework.artifacts);

  // Task 9: Implementation and Documentation
  ctx.log('info', 'Creating implementation plan and documentation');
  const implementationDocs = await ctx.task(implementationDocsTask, {
    organizationName,
    communityAssessment,
    stakeholderMapping,
    engagementStrategy,
    participatoryPrograms,
    outreachInitiatives,
    inclusivePractices,
    partnershipDevelopment,
    evaluationFramework,
    outputDir
  });

  artifacts.push(...implementationDocs.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    engagementStrategy: {
      strategy: engagementStrategy.strategy,
      framework: inclusivePractices.framework,
      goals: engagementGoals
    },
    communities: {
      assessment: communityAssessment.assessment,
      stakeholders: stakeholderMapping.map
    },
    programs: participatoryPrograms.programs,
    outreach: outreachInitiatives.initiatives,
    partnerships: partnershipDevelopment.partnerships,
    evaluation: evaluationFramework,
    implementation: implementationDocs.plan,
    artifacts,
    duration,
    metadata: {
      processId: 'arts-culture/community-engagement',
      timestamp: startTime,
      organizationName
    }
  };
}

// Task 1: Community Assessment
export const communityAssessmentTask = defineTask('community-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct community assessment',
  agent: {
    name: 'community-researcher',
    prompt: {
      role: 'community engagement researcher',
      task: 'Conduct comprehensive community assessment',
      context: args,
      instructions: [
        'Research community demographics and characteristics',
        'Identify community assets and resources',
        'Assess cultural needs and interests',
        'Identify barriers to participation',
        'Document existing cultural resources',
        'Research community organizations and leaders',
        'Assess historical relationship with institution',
        'Identify opportunities for engagement'
      ],
      outputFormat: 'JSON with success, assessment, demographics, assets, barriers, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'assessment', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        assessment: {
          type: 'object',
          properties: {
            demographics: { type: 'object' },
            assets: { type: 'array' },
            barriers: { type: 'array' },
            opportunities: { type: 'array' }
          }
        },
        demographics: { type: 'object' },
        assets: { type: 'array' },
        barriers: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'community-engagement', 'assessment', 'research']
}));

// Task 2: Stakeholder Mapping
export const stakeholderMappingTask = defineTask('stakeholder-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map community stakeholders',
  agent: {
    name: 'stakeholder-analyst',
    prompt: {
      role: 'community stakeholder analyst',
      task: 'Map and analyze community stakeholders',
      context: args,
      instructions: [
        'Identify key community organizations',
        'Map community leaders and influencers',
        'Identify cultural organizations and groups',
        'Document schools and educational institutions',
        'Identify faith-based organizations',
        'Map social service agencies',
        'Assess stakeholder influence and interest',
        'Document relationship history and status'
      ],
      outputFormat: 'JSON with map, organizations, leaders, relationships, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['map', 'artifacts'],
      properties: {
        map: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              influence: { type: 'string' },
              interest: { type: 'string' },
              relationship: { type: 'string' }
            }
          }
        },
        organizations: { type: 'array' },
        leaders: { type: 'array' },
        relationships: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'community-engagement', 'stakeholder', 'mapping']
}));

// Task 3: Engagement Strategy
export const engagementStrategyTask = defineTask('engagement-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop engagement strategy',
  agent: {
    name: 'engagement-strategist',
    prompt: {
      role: 'community engagement strategist',
      task: 'Develop comprehensive community engagement strategy',
      context: args,
      instructions: [
        'Define engagement goals and objectives',
        'Develop engagement principles and values',
        'Create community-specific strategies',
        'Plan relationship-building approaches',
        'Design two-way communication channels',
        'Plan capacity-building initiatives',
        'Define success metrics and outcomes',
        'Create phased implementation plan'
      ],
      outputFormat: 'JSON with strategy, principles, approaches, timeline, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'artifacts'],
      properties: {
        strategy: {
          type: 'object',
          properties: {
            goals: { type: 'array' },
            principles: { type: 'array' },
            approaches: { type: 'array' },
            phases: { type: 'array' }
          }
        },
        principles: { type: 'array' },
        approaches: { type: 'array' },
        timeline: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'community-engagement', 'strategy', 'development']
}));

// Task 4: Participatory Programs
export const participatoryProgramsTask = defineTask('participatory-programs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design participatory programs',
  agent: {
    name: 'participatory-designer',
    prompt: {
      role: 'participatory program designer',
      task: 'Design participatory programming for community engagement',
      context: args,
      instructions: [
        'Design co-created programming',
        'Plan community advisory processes',
        'Create community curation opportunities',
        'Design community storytelling projects',
        'Plan artist residency programs',
        'Create intergenerational programs',
        'Design cultural celebration events',
        'Plan skill-sharing workshops'
      ],
      outputFormat: 'JSON with programs, coCreation, advisory, events, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['programs', 'artifacts'],
      properties: {
        programs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              community: { type: 'string' },
              description: { type: 'string' },
              outcomes: { type: 'array' }
            }
          }
        },
        coCreation: { type: 'array' },
        advisory: { type: 'object' },
        events: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'community-engagement', 'participatory', 'programs']
}));

// Task 5: Outreach Initiatives
export const outreachInitiativesTask = defineTask('outreach-initiatives', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan outreach initiatives',
  agent: {
    name: 'outreach-planner',
    prompt: {
      role: 'community outreach planner',
      task: 'Plan community outreach initiatives',
      context: args,
      instructions: [
        'Design off-site programming',
        'Plan pop-up experiences',
        'Create mobile programming',
        'Design school partnerships',
        'Plan community center partnerships',
        'Create ambassador programs',
        'Design grassroots marketing',
        'Plan community event participation'
      ],
      outputFormat: 'JSON with initiatives, offsite, mobile, partnerships, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['initiatives', 'artifacts'],
      properties: {
        initiatives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              location: { type: 'string' },
              audience: { type: 'string' }
            }
          }
        },
        offsite: { type: 'array' },
        mobile: { type: 'object' },
        partnerships: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'community-engagement', 'outreach', 'initiatives']
}));

// Task 6: Inclusive Practices
export const inclusivePracticesTask = defineTask('inclusive-practices', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop inclusive practices',
  agent: {
    name: 'inclusion-specialist',
    prompt: {
      role: 'diversity and inclusion specialist',
      task: 'Develop inclusive practices framework',
      context: args,
      instructions: [
        'Assess current accessibility and inclusion',
        'Develop accessibility accommodations',
        'Create multilingual resources',
        'Design culturally responsive practices',
        'Plan staff diversity and training',
        'Create welcoming environment standards',
        'Develop feedback mechanisms',
        'Plan continuous improvement process'
      ],
      outputFormat: 'JSON with framework, accessibility, cultural, training, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'artifacts'],
      properties: {
        framework: {
          type: 'object',
          properties: {
            principles: { type: 'array' },
            practices: { type: 'array' },
            standards: { type: 'array' }
          }
        },
        accessibility: { type: 'object' },
        cultural: { type: 'object' },
        training: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'community-engagement', 'inclusion', 'accessibility']
}));

// Task 7: Partnership Development
export const partnershipDevelopmentTask = defineTask('partnership-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop community partnerships',
  agent: {
    name: 'partnership-developer',
    prompt: {
      role: 'community partnership developer',
      task: 'Develop community partnership strategy and agreements',
      context: args,
      instructions: [
        'Identify priority partnership opportunities',
        'Develop partnership value propositions',
        'Create partnership agreement templates',
        'Plan mutual benefit structures',
        'Design collaboration frameworks',
        'Plan resource sharing arrangements',
        'Create partnership cultivation process',
        'Develop partnership stewardship plan'
      ],
      outputFormat: 'JSON with partnerships, agreements, cultivation, stewardship, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['partnerships', 'artifacts'],
      properties: {
        partnerships: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              partner: { type: 'string' },
              type: { type: 'string' },
              benefits: { type: 'array' },
              activities: { type: 'array' }
            }
          }
        },
        agreements: { type: 'array' },
        cultivation: { type: 'object' },
        stewardship: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'community-engagement', 'partnership', 'development']
}));

// Task 8: Evaluation and Impact
export const evaluationImpactTask = defineTask('evaluation-impact', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create evaluation framework',
  agent: {
    name: 'impact-evaluator',
    prompt: {
      role: 'community impact evaluator',
      task: 'Develop evaluation and impact measurement framework',
      context: args,
      instructions: [
        'Define community engagement outcomes',
        'Develop impact measurement indicators',
        'Create community feedback mechanisms',
        'Design participatory evaluation methods',
        'Plan community voice collection',
        'Create social impact metrics',
        'Design reporting frameworks',
        'Plan continuous improvement process'
      ],
      outputFormat: 'JSON with methods, indicators, feedback, reporting, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['methods', 'indicators', 'artifacts'],
      properties: {
        methods: { type: 'array' },
        indicators: { type: 'array' },
        feedback: { type: 'object' },
        reporting: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'community-engagement', 'evaluation', 'impact']
}));

// Task 9: Implementation Documentation
export const implementationDocsTask = defineTask('implementation-docs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create implementation documentation',
  agent: {
    name: 'implementation-documenter',
    prompt: {
      role: 'community engagement documenter',
      task: 'Create comprehensive implementation plan and documentation',
      context: args,
      instructions: [
        'Compile engagement strategy document',
        'Create program implementation guides',
        'Document partnership agreements',
        'Create staff training materials',
        'Compile evaluation tools',
        'Create community communication materials',
        'Document budget and resource needs',
        'Create timeline and milestones'
      ],
      outputFormat: 'JSON with plan, guides, materials, timeline, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'artifacts'],
      properties: {
        plan: {
          type: 'object',
          properties: {
            overview: { type: 'string' },
            phases: { type: 'array' },
            resources: { type: 'object' }
          }
        },
        guides: { type: 'array' },
        materials: { type: 'array' },
        timeline: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'community-engagement', 'implementation', 'documentation']
}));
