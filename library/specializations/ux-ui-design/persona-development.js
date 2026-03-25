/**
 * @process specializations/ux-ui-design/persona-development
 * @description User Persona Development process for creating research-backed user personas with behavioral patterns,
 * goals, pain points, and user journey mapping through comprehensive user research and validation.
 * @inputs { projectName: string, productDomain: string, existingResearch?: object, targetAudience?: string[], researchBudget?: string }
 * @outputs { success: boolean, personas: array, validationScore: number, journeyMaps: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ux-ui-design/persona-development', {
 *   projectName: 'E-Commerce Platform Redesign',
 *   productDomain: 'E-Commerce',
 *   targetAudience: ['Online shoppers', 'Mobile users', 'Frequent buyers'],
 *   researchBudget: 'medium'
 * });
 *
 * @references
 * - UX Research Methods: https://www.nngroup.com/articles/which-ux-research-methods/
 * - Persona Development: https://www.interaction-design.org/literature/article/personas-why-and-how-you-should-use-them
 * - Jobs to Be Done Framework: https://jtbd.info/
 * - User Journey Mapping: https://www.nngroup.com/articles/journey-mapping-101/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    productDomain,
    existingResearch = {},
    targetAudience = [],
    researchBudget = 'medium',
    outputDir = 'persona-development-output',
    minimumValidationScore = 80,
    personaCount = 4
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting User Persona Development for ${projectName}`);

  // ============================================================================
  // PHASE 1: RESEARCH PLANNING AND PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Planning user research approach');
  const researchPlan = await ctx.task(researchPlanningTask, {
    projectName,
    productDomain,
    existingResearch,
    targetAudience,
    researchBudget,
    outputDir
  });

  artifacts.push(...researchPlan.artifacts);

  // ============================================================================
  // PHASE 2: USER RESEARCH SYNTHESIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Synthesizing user research data');
  const researchSynthesis = await ctx.task(researchSynthesisTask, {
    projectName,
    productDomain,
    researchPlan,
    existingResearch,
    targetAudience,
    outputDir
  });

  artifacts.push(...researchSynthesis.artifacts);

  // Quality Gate: Research must provide sufficient insights
  const researchDepth = researchSynthesis.researchDepthScore || 0;
  if (researchDepth < 60) {
    await ctx.breakpoint({
      question: `Research depth score is ${researchDepth}/100 (below threshold of 60). Should we proceed with additional research or continue with current insights?`,
      title: 'Research Depth Warning',
      context: {
        runId: ctx.runId,
        researchSynthesis,
        recommendation: 'Consider conducting additional user interviews or surveys before proceeding'
      }
    });
  }

  // ============================================================================
  // PHASE 3: USER SEGMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Segmenting users into distinct groups');
  const userSegmentation = await ctx.task(userSegmentationTask, {
    projectName,
    researchSynthesis,
    targetAudience,
    personaCount,
    outputDir
  });

  artifacts.push(...userSegmentation.artifacts);

  // ============================================================================
  // PHASE 4: PERSONA DEVELOPMENT (PARALLEL)
  // ============================================================================

  ctx.log('info', 'Phase 4: Developing detailed user personas');

  // Develop personas in parallel for efficiency
  const personaResults = await ctx.parallel.all(
    userSegmentation.segments.slice(0, personaCount).map((segment, index) =>
      () => ctx.task(personaDevelopmentTask, {
        projectName,
        segmentIndex: index + 1,
        segment,
        researchSynthesis,
        productDomain,
        outputDir
      })
    )
  );

  // Combine persona results
  const personas = personaResults.map(result => result.persona);
  personaResults.forEach(result => {
    artifacts.push(...(result.artifacts || []));
  });

  // Breakpoint: Review developed personas
  await ctx.breakpoint({
    question: `${personas.length} personas developed for ${projectName}. Review personas before validation?`,
    title: 'Persona Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        projectName,
        personaCount: personas.length,
        segments: userSegmentation.segments.length,
        researchDepth
      }
    }
  });

  // ============================================================================
  // PHASE 5: GOALS AND PAIN POINTS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing user goals and pain points');
  const goalsAnalysis = await ctx.task(goalsAnalysisTask, {
    projectName,
    personas,
    researchSynthesis,
    productDomain,
    outputDir
  });

  artifacts.push(...goalsAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: BEHAVIORAL PATTERNS AND CONTEXT
  // ============================================================================

  ctx.log('info', 'Phase 6: Mapping behavioral patterns and usage context');
  const behavioralAnalysis = await ctx.task(behavioralAnalysisTask, {
    projectName,
    personas,
    researchSynthesis,
    goalsAnalysis,
    outputDir
  });

  artifacts.push(...behavioralAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: USER JOURNEY MAPPING
  // ============================================================================

  ctx.log('info', 'Phase 7: Creating user journey maps for each persona');

  // Create journey maps in parallel
  const journeyMapResults = await ctx.parallel.all(
    personas.map((persona, index) =>
      () => ctx.task(journeyMappingTask, {
        projectName,
        persona,
        personaIndex: index + 1,
        goalsAnalysis,
        behavioralAnalysis,
        productDomain,
        outputDir
      })
    )
  );

  const journeyMaps = journeyMapResults.map(result => result.journeyMap);
  journeyMapResults.forEach(result => {
    artifacts.push(...(result.artifacts || []));
  });

  // ============================================================================
  // PHASE 8: PERSONA VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Validating personas against research data');
  const validation = await ctx.task(personaValidationTask, {
    projectName,
    personas,
    researchSynthesis,
    goalsAnalysis,
    behavioralAnalysis,
    journeyMaps,
    minimumValidationScore,
    outputDir
  });

  artifacts.push(...validation.artifacts);

  const validationScore = validation.overallValidationScore;
  const validationPassed = validationScore >= minimumValidationScore;

  // ============================================================================
  // PHASE 9: EMPATHY MAP GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Creating empathy maps for personas');
  const empathyMaps = await ctx.task(empathyMapGenerationTask, {
    projectName,
    personas,
    researchSynthesis,
    behavioralAnalysis,
    outputDir
  });

  artifacts.push(...empathyMaps.artifacts);

  // ============================================================================
  // PHASE 10: PERSONA DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Generating comprehensive persona documentation');
  const documentation = await ctx.task(personaDocumentationTask, {
    projectName,
    productDomain,
    personas,
    researchSynthesis,
    userSegmentation,
    goalsAnalysis,
    behavioralAnalysis,
    journeyMaps,
    empathyMaps,
    validation,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  // Final Breakpoint: Persona Approval
  await ctx.breakpoint({
    question: `User Persona Development complete for ${projectName}. Validation Score: ${validationScore}/100. ${validationPassed ? 'Personas meet quality standards!' : 'Personas may need refinement.'} Approve and distribute?`,
    title: 'Persona Documentation Approval',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        projectName,
        validationScore,
        validationPassed,
        totalPersonas: personas.length,
        totalArtifacts: artifacts.length,
        researchDepth,
        journeyMapCount: journeyMaps.length
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    projectName,
    validationScore,
    validationPassed,
    personas: personas.map(p => ({
      name: p.name,
      role: p.role,
      age: p.age,
      quote: p.quote,
      goals: p.goals,
      painPoints: p.painPoints,
      behaviors: p.behaviors,
      techSavviness: p.techSavviness
    })),
    researchSynthesis: {
      researchDepth: researchDepth,
      participantCount: researchSynthesis.participantCount,
      researchMethods: researchSynthesis.researchMethods,
      keyInsights: researchSynthesis.keyInsights
    },
    segmentation: {
      totalSegments: userSegmentation.segments.length,
      segmentationCriteria: userSegmentation.segmentationCriteria,
      primarySegments: userSegmentation.primarySegments
    },
    goalsAnalysis: {
      totalGoals: goalsAnalysis.totalGoals,
      goalsByCategory: goalsAnalysis.goalsByCategory,
      criticalPainPoints: goalsAnalysis.criticalPainPoints
    },
    behavioralPatterns: {
      identifiedPatterns: behavioralAnalysis.identifiedPatterns,
      usageContexts: behavioralAnalysis.usageContexts,
      devicePreferences: behavioralAnalysis.devicePreferences
    },
    journeyMaps: journeyMaps.map(jm => ({
      personaName: jm.personaName,
      stages: jm.stages,
      touchpoints: jm.touchpoints,
      opportunityAreas: jm.opportunityAreas
    })),
    validation: {
      researchAlignment: validation.researchAlignment,
      dataSupport: validation.dataSupport,
      gaps: validation.gaps,
      recommendations: validation.recommendations
    },
    documentation: {
      documentPath: documentation.documentPath,
      personaPosters: documentation.personaPosters,
      distributionFormat: documentation.distributionFormat
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/ux-ui-design/persona-development',
      timestamp: startTime,
      version: '1.0.0',
      projectName,
      productDomain,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Research Planning
export const researchPlanningTask = defineTask('research-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan user research approach',
  agent: {
    name: 'ux-researcher',
    prompt: {
      role: 'Senior UX Researcher with expertise in user research methodologies and persona development',
      task: 'Develop comprehensive user research plan for persona development',
      context: args,
      instructions: [
        'Review existing research data and identify knowledge gaps',
        'Define research objectives aligned with persona development goals',
        'Select appropriate research methods (interviews, surveys, analytics, ethnography)',
        'Based on research budget, recommend optimal research approach (lean, standard, comprehensive)',
        'Define target participant criteria and recruitment strategy',
        'Estimate sample size needed for statistical significance',
        'Create interview guide and survey questions',
        'Define research timeline and milestones',
        'Identify stakeholders and plan research participation',
        'Document expected deliverables from research phase',
        'Generate comprehensive research plan document'
      ],
      outputFormat: 'JSON with researchObjectives, researchMethods (array), participantCriteria, sampleSize, timeline, interviewGuide, surveyQuestions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['researchObjectives', 'researchMethods', 'participantCriteria', 'artifacts'],
      properties: {
        researchObjectives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              objective: { type: 'string' },
              rationale: { type: 'string' },
              successCriteria: { type: 'string' }
            }
          }
        },
        researchMethods: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              method: { type: 'string', enum: ['user-interviews', 'surveys', 'analytics', 'ethnography', 'contextual-inquiry', 'diary-studies', 'usability-testing', 'card-sorting'] },
              purpose: { type: 'string' },
              participantCount: { type: 'number' },
              duration: { type: 'string' }
            }
          }
        },
        participantCriteria: {
          type: 'object',
          properties: {
            demographics: { type: 'array', items: { type: 'string' } },
            behavioralCriteria: { type: 'array', items: { type: 'string' } },
            screeningQuestions: { type: 'array', items: { type: 'string' } }
          }
        },
        sampleSize: {
          type: 'object',
          properties: {
            interviews: { type: 'number' },
            surveys: { type: 'number' },
            rationale: { type: 'string' }
          }
        },
        timeline: {
          type: 'object',
          properties: {
            totalDuration: { type: 'string' },
            phases: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  phase: { type: 'string' },
                  duration: { type: 'string' },
                  deliverable: { type: 'string' }
                }
              }
            }
          }
        },
        interviewGuide: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              section: { type: 'string' },
              questions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        surveyQuestions: { type: 'array', items: { type: 'string' } },
        knowledgeGaps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'persona-development', 'research-planning']
}));

// Task 2: Research Synthesis
export const researchSynthesisTask = defineTask('research-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize user research data',
  agent: {
    name: 'ux-researcher',
    prompt: {
      role: 'UX Research Analyst with expertise in qualitative and quantitative data synthesis',
      task: 'Synthesize user research data into actionable insights for persona development',
      context: args,
      instructions: [
        'Aggregate data from all research methods (interviews, surveys, analytics, existing research)',
        'Use affinity mapping to identify patterns and themes',
        'Extract key user behaviors, motivations, and attitudes',
        'Identify common goals and pain points across users',
        'Document user quotes and verbatim statements that illustrate key findings',
        'Analyze demographics and behavioral characteristics',
        'Identify usage patterns, contexts, and environments',
        'Map user needs to product features and experiences',
        'Assess research depth and confidence in findings (0-100 score)',
        'Highlight contradictions or edge cases in user data',
        'Generate comprehensive research synthesis document with key insights'
      ],
      outputFormat: 'JSON with researchDepthScore (0-100), participantCount, researchMethods, keyInsights (array), userBehaviors, userGoals, painPoints, quotes, demographics, usagePatterns, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['researchDepthScore', 'participantCount', 'keyInsights', 'artifacts'],
      properties: {
        researchDepthScore: { type: 'number', minimum: 0, maximum: 100 },
        participantCount: { type: 'number' },
        researchMethods: { type: 'array', items: { type: 'string' } },
        keyInsights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              insight: { type: 'string' },
              category: { type: 'string', enum: ['behavior', 'motivation', 'goal', 'pain-point', 'need', 'attitude'] },
              evidence: { type: 'array', items: { type: 'string' } },
              frequency: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        userBehaviors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              behavior: { type: 'string' },
              frequency: { type: 'string' },
              context: { type: 'string' }
            }
          }
        },
        userGoals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              goal: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] },
              category: { type: 'string' }
            }
          }
        },
        painPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              painPoint: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              affectedUsers: { type: 'string' }
            }
          }
        },
        quotes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              quote: { type: 'string' },
              theme: { type: 'string' },
              participantContext: { type: 'string' }
            }
          }
        },
        demographics: {
          type: 'object',
          properties: {
            ageRanges: { type: 'array', items: { type: 'string' } },
            professions: { type: 'array', items: { type: 'string' } },
            techSavviness: { type: 'array', items: { type: 'string' } },
            locations: { type: 'array', items: { type: 'string' } }
          }
        },
        usagePatterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              userSegment: { type: 'string' },
              frequency: { type: 'string' }
            }
          }
        },
        contradictions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'persona-development', 'research-synthesis']
}));

// Task 3: User Segmentation
export const userSegmentationTask = defineTask('user-segmentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Segment users into distinct groups',
  agent: {
    name: 'ux-strategist',
    prompt: {
      role: 'UX Strategist with expertise in user segmentation and market analysis',
      task: 'Segment users into distinct, actionable groups for persona development',
      context: args,
      instructions: [
        'Analyze research synthesis to identify natural user groupings',
        'Use behavioral segmentation (goals, tasks, pain points) as primary criteria',
        'Consider demographic segmentation as secondary criteria',
        'Apply psychographic segmentation (attitudes, motivations, values)',
        'Identify 3-6 distinct user segments based on data',
        'Ensure segments are mutually exclusive and collectively exhaustive',
        'Define segment characteristics: size, behaviors, goals, pain points',
        'Prioritize segments by strategic importance and size',
        'Validate that each segment represents a meaningful user group',
        'Document segmentation criteria and rationale',
        'Generate user segmentation analysis document'
      ],
      outputFormat: 'JSON with segments (array), segmentationCriteria, primarySegments (array), segmentationRationale, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['segments', 'segmentationCriteria', 'primarySegments', 'artifacts'],
      properties: {
        segments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segmentId: { type: 'string' },
              segmentName: { type: 'string' },
              description: { type: 'string' },
              size: { type: 'string', enum: ['large', 'medium', 'small'] },
              priority: { type: 'string', enum: ['primary', 'secondary', 'tertiary'] },
              characteristics: {
                type: 'object',
                properties: {
                  behaviors: { type: 'array', items: { type: 'string' } },
                  goals: { type: 'array', items: { type: 'string' } },
                  painPoints: { type: 'array', items: { type: 'string' } },
                  motivations: { type: 'array', items: { type: 'string' } }
                }
              },
              demographics: {
                type: 'object',
                properties: {
                  ageRange: { type: 'string' },
                  professions: { type: 'array', items: { type: 'string' } },
                  techSavviness: { type: 'string' }
                }
              }
            }
          }
        },
        segmentationCriteria: {
          type: 'object',
          properties: {
            primaryCriteria: { type: 'array', items: { type: 'string' } },
            secondaryCriteria: { type: 'array', items: { type: 'string' } },
            approach: { type: 'string', enum: ['behavioral', 'demographic', 'psychographic', 'hybrid'] }
          }
        },
        primarySegments: {
          type: 'array',
          items: { type: 'string' },
          description: 'Segment IDs for primary target segments'
        },
        segmentationRationale: { type: 'string' },
        segmentOverlap: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              segments: { type: 'array', items: { type: 'string' } },
              overlapArea: { type: 'string' },
              resolution: { type: 'string' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'persona-development', 'user-segmentation']
}));

// Task 4: Persona Development
export const personaDevelopmentTask = defineTask('persona-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Develop Persona ${args.segmentIndex}`,
  agent: {
    name: 'persona-designer',
    prompt: {
      role: 'UX Designer with expertise in persona creation and storytelling',
      task: 'Create detailed, empathetic user persona based on research segment',
      context: args,
      instructions: [
        'Create fictional but realistic persona representing the user segment',
        'Give persona a name, photo description, age, occupation, and location',
        'Write compelling persona quote that captures their essence',
        'Document persona background and context (day-to-day life, work environment)',
        'Define 3-5 primary goals related to the product/service',
        'Define 3-5 major pain points and frustrations',
        'Document behaviors, habits, and usage patterns',
        'Include tech savviness and device preferences',
        'Add personality traits and attitudes',
        'Document motivations and values',
        'Include brands they use and influencers they follow',
        'Make persona relatable and memorable with specific details',
        'Ensure all details are grounded in research data',
        'Create persona narrative that brings the user to life'
      ],
      outputFormat: 'JSON with persona object (name, age, occupation, location, quote, background, goals, painPoints, behaviors, techSavviness, personality, motivations, brands, narrative), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['persona', 'artifacts'],
      properties: {
        persona: {
          type: 'object',
          required: ['name', 'role', 'age', 'quote', 'goals', 'painPoints', 'behaviors'],
          properties: {
            name: { type: 'string' },
            role: { type: 'string' },
            age: { type: 'number' },
            location: { type: 'string' },
            photoDescription: { type: 'string' },
            quote: { type: 'string' },
            background: { type: 'string' },
            goals: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  goal: { type: 'string' },
                  priority: { type: 'string', enum: ['high', 'medium', 'low'] },
                  context: { type: 'string' }
                }
              },
              minItems: 3
            },
            painPoints: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  painPoint: { type: 'string' },
                  severity: { type: 'string', enum: ['high', 'medium', 'low'] },
                  frequency: { type: 'string' }
                }
              },
              minItems: 3
            },
            behaviors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  behavior: { type: 'string' },
                  context: { type: 'string' },
                  frequency: { type: 'string' }
                }
              }
            },
            techSavviness: { type: 'string', enum: ['novice', 'intermediate', 'advanced', 'expert'] },
            devices: { type: 'array', items: { type: 'string' } },
            personality: {
              type: 'object',
              properties: {
                traits: { type: 'array', items: { type: 'string' } },
                attitudes: { type: 'array', items: { type: 'string' } }
              }
            },
            motivations: { type: 'array', items: { type: 'string' } },
            values: { type: 'array', items: { type: 'string' } },
            brands: { type: 'array', items: { type: 'string' } },
            influencers: { type: 'array', items: { type: 'string' } },
            narrative: { type: 'string' },
            researchEvidence: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  attribute: { type: 'string' },
                  evidence: { type: 'string' }
                }
              }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'persona-development', 'persona-creation', `persona-${args.segmentIndex}`]
}));

// Task 5: Goals and Pain Points Analysis
export const goalsAnalysisTask = defineTask('goals-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze user goals and pain points',
  agent: {
    name: 'ux-analyst',
    prompt: {
      role: 'UX Analyst with expertise in Jobs to Be Done framework and user needs analysis',
      task: 'Conduct comprehensive analysis of user goals and pain points across personas',
      context: args,
      instructions: [
        'Aggregate all goals from personas and categorize (functional, social, emotional)',
        'Apply Jobs to Be Done framework: what job is the user trying to get done?',
        'Prioritize goals by frequency and importance across personas',
        'Identify shared goals that span multiple personas',
        'Analyze pain points by severity and frequency',
        'Map pain points to product/service gaps',
        'Identify critical pain points requiring immediate attention',
        'Categorize pain points (usability, performance, access, cost, trust)',
        'Link goals to specific user outcomes and success metrics',
        'Identify opportunities where product can enable goals or alleviate pain',
        'Generate goals and pain points analysis report'
      ],
      outputFormat: 'JSON with totalGoals, goalsByCategory, prioritizedGoals, sharedGoals, totalPainPoints, painPointsByCategory, criticalPainPoints, opportunityAreas, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalGoals', 'goalsByCategory', 'criticalPainPoints', 'artifacts'],
      properties: {
        totalGoals: { type: 'number' },
        goalsByCategory: {
          type: 'object',
          properties: {
            functional: { type: 'array', items: { type: 'string' } },
            social: { type: 'array', items: { type: 'string' } },
            emotional: { type: 'array', items: { type: 'string' } }
          }
        },
        prioritizedGoals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              goal: { type: 'string' },
              personas: { type: 'array', items: { type: 'string' } },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              jobToBeDone: { type: 'string' }
            }
          }
        },
        sharedGoals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              goal: { type: 'string' },
              personaCount: { type: 'number' },
              personas: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        totalPainPoints: { type: 'number' },
        painPointsByCategory: {
          type: 'object',
          properties: {
            usability: { type: 'number' },
            performance: { type: 'number' },
            access: { type: 'number' },
            cost: { type: 'number' },
            trust: { type: 'number' }
          }
        },
        criticalPainPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              painPoint: { type: 'string' },
              severity: { type: 'string' },
              affectedPersonas: { type: 'array', items: { type: 'string' } },
              productGap: { type: 'string' }
            }
          }
        },
        opportunityAreas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              opportunity: { type: 'string' },
              relatedGoals: { type: 'array', items: { type: 'string' } },
              relatedPainPoints: { type: 'array', items: { type: 'string' } },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'persona-development', 'goals-analysis', 'jtbd']
}));

// Task 6: Behavioral Analysis
export const behavioralAnalysisTask = defineTask('behavioral-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map behavioral patterns and context',
  agent: {
    name: 'behavioral-analyst',
    prompt: {
      role: 'Behavioral UX Researcher with expertise in usage patterns and context analysis',
      task: 'Analyze and document behavioral patterns, usage contexts, and environmental factors',
      context: args,
      instructions: [
        'Aggregate behavioral data from personas and research',
        'Identify common behavioral patterns across personas',
        'Document usage contexts (where, when, why users interact with product)',
        'Analyze device preferences and multi-device behaviors',
        'Document environmental factors affecting usage (location, time constraints, distractions)',
        'Identify mental models and user expectations',
        'Map decision-making patterns and information-seeking behaviors',
        'Analyze social influences and peer effects on usage',
        'Document barriers and enablers to product adoption',
        'Identify habit formation opportunities',
        'Generate comprehensive behavioral analysis report'
      ],
      outputFormat: 'JSON with identifiedPatterns, usageContexts, devicePreferences, environmentalFactors, mentalModels, barriers, enablers, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['identifiedPatterns', 'usageContexts', 'devicePreferences', 'artifacts'],
      properties: {
        identifiedPatterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              frequency: { type: 'string', enum: ['very-common', 'common', 'occasional', 'rare'] },
              personas: { type: 'array', items: { type: 'string' } },
              triggers: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        usageContexts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              context: { type: 'string' },
              location: { type: 'string' },
              timeOfDay: { type: 'string' },
              socialContext: { type: 'string' },
              typicalDuration: { type: 'string' }
            }
          }
        },
        devicePreferences: {
          type: 'object',
          properties: {
            primaryDevices: { type: 'array', items: { type: 'string' } },
            multiDeviceBehaviors: { type: 'array', items: { type: 'string' } },
            platformPreferences: { type: 'array', items: { type: 'string' } }
          }
        },
        environmentalFactors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              factor: { type: 'string' },
              impact: { type: 'string', enum: ['positive', 'negative', 'neutral'] },
              mitigation: { type: 'string' }
            }
          }
        },
        mentalModels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              concept: { type: 'string' },
              userExpectation: { type: 'string' },
              alignment: { type: 'string', enum: ['aligned', 'partial', 'misaligned'] }
            }
          }
        },
        barriers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              barrier: { type: 'string' },
              type: { type: 'string', enum: ['technical', 'cognitive', 'emotional', 'social', 'economic'] },
              severity: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        enablers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              enabler: { type: 'string' },
              leverageOpportunity: { type: 'string' }
            }
          }
        },
        habitFormationOpportunities: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'persona-development', 'behavioral-analysis']
}));

// Task 7: Journey Mapping
export const journeyMappingTask = defineTask('journey-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create Journey Map for ${args.persona.name}`,
  agent: {
    name: 'journey-mapper',
    prompt: {
      role: 'UX Designer specializing in user journey mapping and service design',
      task: 'Create comprehensive user journey map for persona',
      context: args,
      instructions: [
        'Define primary user journey for this persona (end-to-end experience)',
        'Break journey into stages (awareness, consideration, purchase, usage, loyalty)',
        'For each stage, document: user actions, thoughts, emotions, touchpoints',
        'Map persona goals at each journey stage',
        'Identify pain points and frustrations at each stage',
        'Document opportunities for improvement at each stage',
        'Include channels and devices used at each stage',
        'Add emotional journey line showing ups and downs',
        'Highlight moments of truth (critical experience points)',
        'Identify areas where user might drop off or churn',
        'Document support and resources needed at each stage',
        'Generate visual journey map and detailed documentation'
      ],
      outputFormat: 'JSON with journeyMap object (personaName, journeyName, stages, emotionalCurve, touchpoints, opportunityAreas, momentsOfTruth), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['journeyMap', 'artifacts'],
      properties: {
        journeyMap: {
          type: 'object',
          required: ['personaName', 'journeyName', 'stages'],
          properties: {
            personaName: { type: 'string' },
            journeyName: { type: 'string' },
            stages: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  stageName: { type: 'string' },
                  userActions: { type: 'array', items: { type: 'string' } },
                  thoughts: { type: 'array', items: { type: 'string' } },
                  emotions: { type: 'array', items: { type: 'string' } },
                  emotionalScore: { type: 'number', minimum: -5, maximum: 5 },
                  touchpoints: { type: 'array', items: { type: 'string' } },
                  channels: { type: 'array', items: { type: 'string' } },
                  goals: { type: 'array', items: { type: 'string' } },
                  painPoints: { type: 'array', items: { type: 'string' } },
                  opportunities: { type: 'array', items: { type: 'string' } }
                }
              },
              minItems: 4
            },
            emotionalCurve: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  stage: { type: 'string' },
                  emotionalScore: { type: 'number' }
                }
              }
            },
            touchpoints: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  touchpoint: { type: 'string' },
                  stage: { type: 'string' },
                  type: { type: 'string', enum: ['digital', 'physical', 'human', 'hybrid'] },
                  quality: { type: 'string', enum: ['excellent', 'good', 'poor', 'needs-improvement'] }
                }
              }
            },
            momentsOfTruth: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  moment: { type: 'string' },
                  stage: { type: 'string' },
                  importance: { type: 'string', enum: ['critical', 'high', 'medium'] },
                  currentExperience: { type: 'string' }
                }
              }
            },
            opportunityAreas: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  opportunity: { type: 'string' },
                  stage: { type: 'string' },
                  impact: { type: 'string', enum: ['high', 'medium', 'low'] },
                  effort: { type: 'string', enum: ['high', 'medium', 'low'] }
                }
              }
            },
            dropOffPoints: { type: 'array', items: { type: 'string' } }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'persona-development', 'journey-mapping', `persona-${args.personaIndex}`]
}));

// Task 8: Persona Validation
export const personaValidationTask = defineTask('persona-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate personas against research',
  agent: {
    name: 'persona-validator',
    prompt: {
      role: 'Senior UX Researcher with expertise in research validation and quality assurance',
      task: 'Validate personas against original research data for accuracy and completeness',
      context: args,
      instructions: [
        'Review each persona for research evidence and data support',
        'Verify that persona goals are grounded in user research quotes and data',
        'Verify that pain points are backed by user feedback and observations',
        'Check that behaviors are based on actual observed patterns, not assumptions',
        'Assess persona diversity and representation of user base',
        'Validate that personas avoid stereotypes and biases',
        'Check for overlap or redundancy between personas',
        'Identify gaps: user segments not represented by current personas',
        'Verify journey maps align with actual user behaviors and touchpoints',
        'Calculate overall validation score (0-100) based on research alignment',
        'Provide specific recommendations for improving persona quality',
        'Generate validation report with evidence tracking'
      ],
      outputFormat: 'JSON with overallValidationScore (0-100), researchAlignment, dataSupport, diversityAssessment, gaps, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallValidationScore', 'researchAlignment', 'recommendations', 'artifacts'],
      properties: {
        overallValidationScore: { type: 'number', minimum: 0, maximum: 100 },
        researchAlignment: {
          type: 'object',
          properties: {
            goalsAlignment: { type: 'number', minimum: 0, maximum: 100 },
            painPointsAlignment: { type: 'number', minimum: 0, maximum: 100 },
            behaviorsAlignment: { type: 'number', minimum: 0, maximum: 100 },
            journeyAlignment: { type: 'number', minimum: 0, maximum: 100 }
          }
        },
        dataSupport: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              personaName: { type: 'string' },
              supportScore: { type: 'number', minimum: 0, maximum: 100 },
              strengths: { type: 'array', items: { type: 'string' } },
              weaknesses: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        diversityAssessment: {
          type: 'object',
          properties: {
            representationScore: { type: 'number', minimum: 0, maximum: 100 },
            coverageAreas: { type: 'array', items: { type: 'string' } },
            underrepresentedGroups: { type: 'array', items: { type: 'string' } },
            stereotypeCheck: { type: 'boolean' }
          }
        },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gapType: { type: 'string', enum: ['missing-segment', 'insufficient-data', 'weak-evidence', 'assumption-based'] },
              description: { type: 'string' },
              severity: { type: 'string', enum: ['high', 'medium', 'low'] },
              recommendation: { type: 'string' }
            }
          }
        },
        personaOverlap: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              personas: { type: 'array', items: { type: 'string' } },
              overlapArea: { type: 'string' },
              resolution: { type: 'string' }
            }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] },
              personaAffected: { type: 'string' }
            }
          }
        },
        validationPassed: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'persona-development', 'validation']
}));

// Task 9: Empathy Map Generation
export const empathyMapGenerationTask = defineTask('empathy-map-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create empathy maps for personas',
  agent: {
    name: 'empathy-mapper',
    prompt: {
      role: 'UX Designer with expertise in empathy mapping and emotional design',
      task: 'Create empathy maps to deepen understanding of personas emotional and cognitive state',
      context: args,
      instructions: [
        'For each persona, create empathy map with four quadrants: Says, Thinks, Does, Feels',
        'SAYS: Document actual quotes and statements from research',
        'THINKS: Capture internal thoughts, concerns, and considerations',
        'DOES: Document observable actions and behaviors',
        'FEELS: Capture emotions, fears, anxieties, and aspirations',
        'Add PAINS quadrant: frustrations, obstacles, and fears',
        'Add GAINS quadrant: wants, needs, and success metrics',
        'Ensure empathy maps capture emotional and cognitive dimensions',
        'Link empathy map insights to design opportunities',
        'Make empathy maps visual and easy to reference',
        'Generate empathy map document for each persona'
      ],
      outputFormat: 'JSON with empathyMaps (array of empathy map objects), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['empathyMaps', 'artifacts'],
      properties: {
        empathyMaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              personaName: { type: 'string' },
              says: {
                type: 'array',
                items: { type: 'string' },
                description: 'Actual quotes and statements'
              },
              thinks: {
                type: 'array',
                items: { type: 'string' },
                description: 'Internal thoughts and concerns'
              },
              does: {
                type: 'array',
                items: { type: 'string' },
                description: 'Observable actions and behaviors'
              },
              feels: {
                type: 'array',
                items: { type: 'string' },
                description: 'Emotions and emotional states'
              },
              pains: {
                type: 'array',
                items: { type: 'string' },
                description: 'Frustrations, obstacles, fears'
              },
              gains: {
                type: 'array',
                items: { type: 'string' },
                description: 'Wants, needs, success metrics'
              },
              designOpportunities: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    opportunity: { type: 'string' },
                    linkedQuadrant: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'persona-development', 'empathy-mapping']
}));

// Task 10: Persona Documentation
export const personaDocumentationTask = defineTask('persona-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive persona documentation',
  agent: {
    name: 'persona-documenter',
    prompt: {
      role: 'UX Writer and Documentation Specialist',
      task: 'Create comprehensive, shareable persona documentation for stakeholder distribution',
      context: args,
      instructions: [
        'Generate executive summary of persona development process and outcomes',
        'Create one-page persona posters for each persona (visual format)',
        'Include all persona details: demographics, goals, pain points, behaviors, journey',
        'Add research methodology and validation summary',
        'Document how to use personas in design and decision-making',
        'Create persona comparison matrix showing differences and similarities',
        'Include empathy maps and journey maps as appendices',
        'Add recommendations for product/service improvements based on personas',
        'Create distribution plan: who needs personas and in what format',
        'Generate stakeholder presentation deck',
        'Provide guidelines for keeping personas updated',
        'Save all documentation to output directory in multiple formats (PDF, Markdown, Slides)'
      ],
      outputFormat: 'JSON with documentPath, executiveSummary, personaPosters (array), comparisonMatrix, usageGuidelines, distributionFormat, nextSteps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentPath', 'executiveSummary', 'personaPosters', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        personaPosters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              personaName: { type: 'string' },
              posterPath: { type: 'string' },
              format: { type: 'string' }
            }
          }
        },
        comparisonMatrix: {
          type: 'object',
          properties: {
            dimensions: { type: 'array', items: { type: 'string' } },
            comparisons: { type: 'array', items: { type: 'object' } }
          }
        },
        usageGuidelines: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              howToUse: { type: 'string' },
              example: { type: 'string' }
            }
          }
        },
        distributionFormat: {
          type: 'object',
          properties: {
            formats: { type: 'array', items: { type: 'string' } },
            targetAudiences: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  audience: { type: 'string' },
                  format: { type: 'string' },
                  deliveryMethod: { type: 'string' }
                }
              }
            }
          }
        },
        productRecommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              affectedPersonas: { type: 'array', items: { type: 'string' } },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        updateGuidelines: {
          type: 'object',
          properties: {
            frequency: { type: 'string' },
            triggers: { type: 'array', items: { type: 'string' } },
            process: { type: 'string' }
          }
        },
        nextSteps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'persona-development', 'documentation']
}));
