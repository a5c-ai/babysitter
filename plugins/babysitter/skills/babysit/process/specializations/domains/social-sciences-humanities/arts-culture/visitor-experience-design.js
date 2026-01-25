/**
 * @process arts-culture/visitor-experience-design
 * @description Approach to creating engaging visitor journeys including interpretive planning, wayfinding, accessibility accommodations, and experience evaluation
 * @inputs { projectName: string, experienceType: string, visitorProfiles: array, spaceInfo: object, contentFocus: object }
 * @outputs { success: boolean, experienceDesign: object, interpretivePlan: object, wayfinding: object, artifacts: array }
 * @recommendedSkills SK-AC-004 (exhibition-design), SK-AC-007 (audience-analytics), SK-AC-012 (accessibility-compliance), SK-AC-014 (digital-engagement-strategy)
 * @recommendedAgents AG-AC-010 (exhibition-designer-agent), AG-AC-007 (education-outreach-agent), AG-AC-008 (marketing-communications-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    experienceType = 'exhibition',
    visitorProfiles = [],
    spaceInfo = {},
    contentFocus = {},
    accessibilityRequirements = [],
    outputDir = 'visitor-experience-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Visitor Research and Analysis
  ctx.log('info', 'Conducting visitor research and analysis');
  const visitorResearch = await ctx.task(visitorResearchTask, {
    projectName,
    experienceType,
    visitorProfiles,
    outputDir
  });

  if (!visitorResearch.success) {
    return {
      success: false,
      error: 'Visitor research failed',
      details: visitorResearch,
      metadata: { processId: 'arts-culture/visitor-experience-design', timestamp: startTime }
    };
  }

  artifacts.push(...visitorResearch.artifacts);

  // Task 2: Journey Mapping
  ctx.log('info', 'Creating visitor journey maps');
  const journeyMapping = await ctx.task(journeyMappingTask, {
    projectName,
    visitorProfiles,
    visitorResearch: visitorResearch.findings,
    spaceInfo,
    outputDir
  });

  artifacts.push(...journeyMapping.artifacts);

  // Task 3: Interpretive Planning
  ctx.log('info', 'Developing interpretive plan');
  const interpretivePlanning = await ctx.task(interpretivePlanningTask, {
    projectName,
    contentFocus,
    visitorProfiles,
    journeyMapping: journeyMapping.journeys,
    outputDir
  });

  artifacts.push(...interpretivePlanning.artifacts);

  // Task 4: Wayfinding Design
  ctx.log('info', 'Designing wayfinding system');
  const wayfindingDesign = await ctx.task(wayfindingDesignTask, {
    projectName,
    spaceInfo,
    journeyMapping: journeyMapping.journeys,
    outputDir
  });

  artifacts.push(...wayfindingDesign.artifacts);

  // Task 5: Accessibility Design
  ctx.log('info', 'Designing accessibility accommodations');
  const accessibilityDesign = await ctx.task(accessibilityDesignTask, {
    projectName,
    spaceInfo,
    accessibilityRequirements,
    interpretivePlanning: interpretivePlanning.plan,
    outputDir
  });

  artifacts.push(...accessibilityDesign.artifacts);

  // Task 6: Interactive and Digital Experiences
  ctx.log('info', 'Designing interactive and digital experiences');
  const interactiveDesign = await ctx.task(interactiveDesignTask, {
    projectName,
    experienceType,
    visitorProfiles,
    contentFocus,
    interpretivePlanning: interpretivePlanning.plan,
    outputDir
  });

  artifacts.push(...interactiveDesign.artifacts);

  // Breakpoint: Review experience design
  await ctx.breakpoint({
    question: `Visitor experience design for "${projectName}" complete. ${visitorProfiles.length} visitor profiles addressed. Review and approve?`,
    title: 'Visitor Experience Design Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        projectName,
        experienceType,
        visitorProfileCount: visitorProfiles.length,
        journeyCount: journeyMapping.journeys.length,
        interpretiveElements: interpretivePlanning.plan.elements?.length || 0
      }
    }
  });

  // Task 7: Visitor Services Design
  ctx.log('info', 'Designing visitor services');
  const visitorServices = await ctx.task(visitorServicesTask, {
    projectName,
    visitorProfiles,
    spaceInfo,
    journeyMapping: journeyMapping.journeys,
    outputDir
  });

  artifacts.push(...visitorServices.artifacts);

  // Task 8: Evaluation Framework
  ctx.log('info', 'Creating experience evaluation framework');
  const evaluationFramework = await ctx.task(experienceEvaluationTask, {
    projectName,
    visitorProfiles,
    journeyMapping: journeyMapping.journeys,
    interpretivePlanning: interpretivePlanning.plan,
    outputDir
  });

  artifacts.push(...evaluationFramework.artifacts);

  // Task 9: Experience Documentation
  ctx.log('info', 'Generating experience design documentation');
  const experienceDocs = await ctx.task(experienceDocumentationTask, {
    projectName,
    visitorResearch,
    journeyMapping,
    interpretivePlanning,
    wayfindingDesign,
    accessibilityDesign,
    interactiveDesign,
    visitorServices,
    evaluationFramework,
    outputDir
  });

  artifacts.push(...experienceDocs.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    experienceDesign: {
      journeys: journeyMapping.journeys,
      touchpoints: journeyMapping.touchpoints,
      services: visitorServices.services
    },
    interpretivePlan: {
      plan: interpretivePlanning.plan,
      elements: interpretivePlanning.elements,
      narratives: interpretivePlanning.narratives
    },
    wayfinding: {
      system: wayfindingDesign.system,
      signage: wayfindingDesign.signage,
      navigation: wayfindingDesign.navigation
    },
    accessibility: accessibilityDesign.accommodations,
    interactive: interactiveDesign.experiences,
    evaluation: evaluationFramework,
    documentation: experienceDocs,
    artifacts,
    duration,
    metadata: {
      processId: 'arts-culture/visitor-experience-design',
      timestamp: startTime,
      projectName
    }
  };
}

// Task 1: Visitor Research
export const visitorResearchTask = defineTask('visitor-research', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct visitor research',
  agent: {
    name: 'visitor-researcher',
    prompt: {
      role: 'visitor studies researcher',
      task: 'Conduct visitor research and audience analysis',
      context: args,
      instructions: [
        'Analyze visitor demographics and segments',
        'Research visitor motivations and expectations',
        'Identify visitor needs and preferences',
        'Analyze dwell times and behavior patterns',
        'Research accessibility needs and barriers',
        'Identify emotional and cognitive goals',
        'Analyze comparable experiences',
        'Document visitor insights and personas'
      ],
      outputFormat: 'JSON with success, findings, personas, insights, barriers, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'findings', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        findings: {
          type: 'object',
          properties: {
            demographics: { type: 'object' },
            motivations: { type: 'array' },
            needs: { type: 'array' },
            behaviors: { type: 'object' }
          }
        },
        personas: { type: 'array' },
        insights: { type: 'array' },
        barriers: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'visitor-experience', 'research', 'audience']
}));

// Task 2: Journey Mapping
export const journeyMappingTask = defineTask('journey-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create visitor journey maps',
  agent: {
    name: 'journey-designer',
    prompt: {
      role: 'visitor journey designer',
      task: 'Create comprehensive visitor journey maps',
      context: args,
      instructions: [
        'Map pre-visit experience touchpoints',
        'Design arrival and orientation experience',
        'Map in-gallery visitor journey',
        'Identify decision points and pathways',
        'Design emotional journey arc',
        'Map post-visit experience',
        'Identify pain points and opportunities',
        'Create journey maps for each persona'
      ],
      outputFormat: 'JSON with journeys, touchpoints, pathways, emotional, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['journeys', 'touchpoints', 'artifacts'],
      properties: {
        journeys: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              persona: { type: 'string' },
              stages: { type: 'array' },
              touchpoints: { type: 'array' },
              emotions: { type: 'array' }
            }
          }
        },
        touchpoints: { type: 'array' },
        pathways: { type: 'array' },
        emotional: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'visitor-experience', 'journey', 'mapping']
}));

// Task 3: Interpretive Planning
export const interpretivePlanningTask = defineTask('interpretive-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop interpretive plan',
  agent: {
    name: 'interpretive-planner',
    prompt: {
      role: 'interpretive planner',
      task: 'Develop comprehensive interpretive plan',
      context: args,
      instructions: [
        'Define interpretive themes and messages',
        'Create content hierarchy (big idea, themes, stories)',
        'Design interpretive approaches by audience',
        'Plan label writing strategy',
        'Design multimedia interpretation',
        'Plan guided tour narratives',
        'Create interpretive layer structure',
        'Design visitor engagement strategies'
      ],
      outputFormat: 'JSON with plan, elements, themes, narratives, layers, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'artifacts'],
      properties: {
        plan: {
          type: 'object',
          properties: {
            bigIdea: { type: 'string' },
            themes: { type: 'array' },
            stories: { type: 'array' },
            elements: { type: 'array' }
          }
        },
        elements: { type: 'array' },
        themes: { type: 'array' },
        narratives: { type: 'array' },
        layers: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'visitor-experience', 'interpretive', 'planning']
}));

// Task 4: Wayfinding Design
export const wayfindingDesignTask = defineTask('wayfinding-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design wayfinding system',
  agent: {
    name: 'wayfinding-designer',
    prompt: {
      role: 'wayfinding designer',
      task: 'Design comprehensive wayfinding system',
      context: args,
      instructions: [
        'Analyze circulation and flow patterns',
        'Design signage hierarchy and types',
        'Plan orientation points and landmarks',
        'Design directional signage system',
        'Create map and directory design',
        'Plan digital wayfinding integration',
        'Design inclusive wayfinding (tactile, audio)',
        'Create signage specifications'
      ],
      outputFormat: 'JSON with system, signage, navigation, specifications, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['system', 'artifacts'],
      properties: {
        system: {
          type: 'object',
          properties: {
            hierarchy: { type: 'array' },
            zones: { type: 'array' },
            landmarks: { type: 'array' }
          }
        },
        signage: { type: 'array' },
        navigation: { type: 'object' },
        specifications: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'visitor-experience', 'wayfinding', 'signage']
}));

// Task 5: Accessibility Design
export const accessibilityDesignTask = defineTask('accessibility-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design accessibility accommodations',
  agent: {
    name: 'accessibility-specialist',
    prompt: {
      role: 'accessibility specialist',
      task: 'Design comprehensive accessibility accommodations',
      context: args,
      instructions: [
        'Review ADA and accessibility standards',
        'Design physical accessibility features',
        'Plan sensory accommodations (visual, auditory)',
        'Create tactile and hands-on experiences',
        'Design assistive technology integration',
        'Plan cognitive accessibility features',
        'Create accessible content alternatives',
        'Design staff training for accessibility'
      ],
      outputFormat: 'JSON with accommodations, physical, sensory, cognitive, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['accommodations', 'artifacts'],
      properties: {
        accommodations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              description: { type: 'string' },
              audience: { type: 'string' },
              implementation: { type: 'string' }
            }
          }
        },
        physical: { type: 'object' },
        sensory: { type: 'object' },
        cognitive: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'visitor-experience', 'accessibility', 'inclusion']
}));

// Task 6: Interactive Design
export const interactiveDesignTask = defineTask('interactive-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design interactive experiences',
  agent: {
    name: 'interactive-designer',
    prompt: {
      role: 'interactive experience designer',
      task: 'Design interactive and digital visitor experiences',
      context: args,
      instructions: [
        'Design hands-on interactive elements',
        'Plan digital interactive experiences',
        'Design mobile experience integration',
        'Create gamification and challenge elements',
        'Plan social and shareable moments',
        'Design personalization features',
        'Create AR/VR opportunities',
        'Plan interactive technology specifications'
      ],
      outputFormat: 'JSON with experiences, digital, mobile, specifications, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['experiences', 'artifacts'],
      properties: {
        experiences: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              description: { type: 'string' },
              technology: { type: 'string' }
            }
          }
        },
        digital: { type: 'array' },
        mobile: { type: 'object' },
        specifications: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'visitor-experience', 'interactive', 'digital']
}));

// Task 7: Visitor Services
export const visitorServicesTask = defineTask('visitor-services', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design visitor services',
  agent: {
    name: 'services-designer',
    prompt: {
      role: 'visitor services designer',
      task: 'Design comprehensive visitor services',
      context: args,
      instructions: [
        'Design welcome and orientation services',
        'Plan ticketing and admission experience',
        'Design coat check and amenities',
        'Plan retail and shop experience',
        'Design food and beverage services',
        'Create rest areas and comfort stations',
        'Design family and accessibility services',
        'Plan staff service training'
      ],
      outputFormat: 'JSON with services, amenities, retail, training, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['services', 'artifacts'],
      properties: {
        services: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              description: { type: 'string' },
              location: { type: 'string' }
            }
          }
        },
        amenities: { type: 'array' },
        retail: { type: 'object' },
        training: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'visitor-experience', 'services', 'amenities']
}));

// Task 8: Experience Evaluation
export const experienceEvaluationTask = defineTask('experience-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create evaluation framework',
  agent: {
    name: 'evaluation-specialist',
    prompt: {
      role: 'visitor experience evaluator',
      task: 'Create experience evaluation framework',
      context: args,
      instructions: [
        'Define experience success metrics',
        'Design formative evaluation methods',
        'Create visitor observation protocols',
        'Design intercept survey instruments',
        'Plan focus group protocols',
        'Create timing and tracking studies',
        'Design satisfaction measurement',
        'Plan continuous improvement process'
      ],
      outputFormat: 'JSON with methods, metrics, instruments, protocols, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['methods', 'metrics', 'artifacts'],
      properties: {
        methods: { type: 'array' },
        metrics: { type: 'array' },
        instruments: { type: 'array' },
        protocols: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'visitor-experience', 'evaluation', 'measurement']
}));

// Task 9: Experience Documentation
export const experienceDocumentationTask = defineTask('experience-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate experience documentation',
  agent: {
    name: 'experience-documenter',
    prompt: {
      role: 'experience design documenter',
      task: 'Generate comprehensive experience design documentation',
      context: args,
      instructions: [
        'Compile experience design brief',
        'Document journey maps and touchpoints',
        'Create interpretive plan document',
        'Document wayfinding specifications',
        'Compile accessibility guidelines',
        'Document interactive specifications',
        'Create service standards manual',
        'Generate evaluation toolkit'
      ],
      outputFormat: 'JSON with documentation, brief, specifications, manual, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentation', 'artifacts'],
      properties: {
        documentation: {
          type: 'object',
          properties: {
            brief: { type: 'string' },
            journeys: { type: 'array' },
            specifications: { type: 'array' }
          }
        },
        brief: { type: 'string' },
        specifications: { type: 'array' },
        manual: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'visitor-experience', 'documentation', 'design']
}));
