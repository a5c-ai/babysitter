/**
 * @process education/gagnes-nine-events
 * @description Systematic framework for sequencing instructional activities including attention, objectives, recall, presentation, guidance, practice, feedback, assessment, and transfer
 * @inputs { lessonTopic: string, learningObjectives: array, targetAudience: object, contentMaterials: array, constraints: object }
 * @outputs { success: boolean, instructionalSequence: array, lessonPlan: object, materials: array, artifacts: array }
 * @recommendedSkills SK-EDU-002 (learning-objectives-writing), SK-EDU-014 (learning-transfer-design), SK-EDU-006 (multimedia-learning-design)
 * @recommendedAgents AG-EDU-001 (instructional-design-lead), AG-EDU-010 (learning-experience-designer)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    lessonTopic = 'Lesson',
    learningObjectives = [],
    targetAudience = {},
    contentMaterials = [],
    constraints = {},
    outputDir = 'gagnes-output',
    qualityThreshold = 85
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Gagne's Nine Events of Instruction for: ${lessonTopic}`);

  // ============================================================================
  // EVENT 1: GAIN ATTENTION
  // ============================================================================

  ctx.log('info', 'Event 1: Designing attention-gaining strategies');
  const event1Attention = await ctx.task(gainAttentionTask, {
    lessonTopic,
    targetAudience,
    contentMaterials,
    outputDir
  });

  artifacts.push(...event1Attention.artifacts);

  // ============================================================================
  // EVENT 2: INFORM LEARNERS OF OBJECTIVES
  // ============================================================================

  ctx.log('info', 'Event 2: Formulating learning objectives communication');
  const event2Objectives = await ctx.task(informObjectivesTask, {
    lessonTopic,
    learningObjectives,
    targetAudience,
    outputDir
  });

  artifacts.push(...event2Objectives.artifacts);

  // ============================================================================
  // EVENT 3: STIMULATE RECALL OF PRIOR LEARNING
  // ============================================================================

  ctx.log('info', 'Event 3: Designing prior knowledge activation');
  const event3Recall = await ctx.task(stimulateRecallTask, {
    lessonTopic,
    learningObjectives,
    targetAudience,
    outputDir
  });

  artifacts.push(...event3Recall.artifacts);

  // ============================================================================
  // EVENT 4: PRESENT THE CONTENT
  // ============================================================================

  ctx.log('info', 'Event 4: Designing content presentation');
  const event4Content = await ctx.task(presentContentTask, {
    lessonTopic,
    learningObjectives,
    contentMaterials,
    targetAudience,
    outputDir
  });

  artifacts.push(...event4Content.artifacts);

  // ============================================================================
  // EVENT 5: PROVIDE LEARNING GUIDANCE
  // ============================================================================

  ctx.log('info', 'Event 5: Designing learning guidance');
  const event5Guidance = await ctx.task(provideLearningGuidanceTask, {
    lessonTopic,
    learningObjectives,
    contentPresentation: event4Content.presentation,
    targetAudience,
    outputDir
  });

  artifacts.push(...event5Guidance.artifacts);

  // ============================================================================
  // EVENT 6: ELICIT PERFORMANCE (PRACTICE)
  // ============================================================================

  ctx.log('info', 'Event 6: Designing practice activities');
  const event6Practice = await ctx.task(elicitPerformanceTask, {
    lessonTopic,
    learningObjectives,
    targetAudience,
    constraints,
    outputDir
  });

  artifacts.push(...event6Practice.artifacts);

  // ============================================================================
  // EVENT 7: PROVIDE FEEDBACK
  // ============================================================================

  ctx.log('info', 'Event 7: Designing feedback mechanisms');
  const event7Feedback = await ctx.task(provideFeedbackTask, {
    lessonTopic,
    practiceActivities: event6Practice.activities,
    learningObjectives,
    outputDir
  });

  artifacts.push(...event7Feedback.artifacts);

  // ============================================================================
  // EVENT 8: ASSESS PERFORMANCE
  // ============================================================================

  ctx.log('info', 'Event 8: Designing performance assessment');
  const event8Assessment = await ctx.task(assessPerformanceTask, {
    lessonTopic,
    learningObjectives,
    targetAudience,
    outputDir
  });

  artifacts.push(...event8Assessment.artifacts);

  // ============================================================================
  // EVENT 9: ENHANCE RETENTION AND TRANSFER
  // ============================================================================

  ctx.log('info', 'Event 9: Designing retention and transfer strategies');
  const event9Transfer = await ctx.task(enhanceRetentionTransferTask, {
    lessonTopic,
    learningObjectives,
    targetAudience,
    outputDir
  });

  artifacts.push(...event9Transfer.artifacts);

  // ============================================================================
  // COMPILE LESSON PLAN
  // ============================================================================

  ctx.log('info', 'Compiling comprehensive lesson plan');
  const lessonPlan = await ctx.task(compileLessonPlanTask, {
    lessonTopic,
    learningObjectives,
    events: {
      attention: event1Attention,
      objectives: event2Objectives,
      recall: event3Recall,
      content: event4Content,
      guidance: event5Guidance,
      practice: event6Practice,
      feedback: event7Feedback,
      assessment: event8Assessment,
      transfer: event9Transfer
    },
    constraints,
    outputDir
  });

  artifacts.push(...lessonPlan.artifacts);

  // ============================================================================
  // QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Scoring Gagne\'s Nine Events implementation quality');
  const qualityScore = await ctx.task(gagneQualityScoringTask, {
    lessonTopic,
    events: {
      attention: event1Attention,
      objectives: event2Objectives,
      recall: event3Recall,
      content: event4Content,
      guidance: event5Guidance,
      practice: event6Practice,
      feedback: event7Feedback,
      assessment: event8Assessment,
      transfer: event9Transfer
    },
    lessonPlan,
    qualityThreshold,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const overallScore = qualityScore.overallScore;
  const qualityMet = overallScore >= qualityThreshold;

  // Breakpoint: Review lesson design
  await ctx.breakpoint({
    question: `Gagne's Nine Events design complete. Quality score: ${overallScore}/${qualityThreshold}. ${qualityMet ? 'Quality standards met!' : 'May need refinement.'} Review and approve?`,
    title: 'Gagne\'s Nine Events Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        overallScore,
        qualityMet,
        lessonTopic,
        totalObjectives: learningObjectives.length,
        totalArtifacts: artifacts.length
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    lessonTopic,
    qualityScore: overallScore,
    qualityMet,
    instructionalSequence: [
      { event: 1, name: 'Gain Attention', strategies: event1Attention.strategies },
      { event: 2, name: 'Inform Objectives', communication: event2Objectives.communication },
      { event: 3, name: 'Stimulate Recall', techniques: event3Recall.techniques },
      { event: 4, name: 'Present Content', presentation: event4Content.presentation },
      { event: 5, name: 'Provide Guidance', guidance: event5Guidance.guidance },
      { event: 6, name: 'Elicit Performance', activities: event6Practice.activities },
      { event: 7, name: 'Provide Feedback', feedback: event7Feedback.feedback },
      { event: 8, name: 'Assess Performance', assessment: event8Assessment.assessment },
      { event: 9, name: 'Enhance Transfer', strategies: event9Transfer.strategies }
    ],
    lessonPlan: lessonPlan.plan,
    materials: lessonPlan.materials,
    artifacts,
    duration,
    metadata: {
      processId: 'education/gagnes-nine-events',
      timestamp: startTime,
      lessonTopic,
      outputDir
    }
  };
}

// Task 1: Gain Attention
export const gainAttentionTask = defineTask('gain-attention', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design attention-gaining strategies (Event 1)',
  agent: {
    name: 'engagement-designer',
    prompt: {
      role: 'instructional engagement specialist',
      task: 'Design compelling strategies to gain learner attention at lesson start',
      context: args,
      instructions: [
        'Design hook strategies appropriate for target audience',
        'Create thought-provoking questions or scenarios',
        'Plan multimedia elements to capture interest',
        'Design unexpected or surprising demonstrations',
        'Create relevance connections to learner goals',
        'Plan emotional engagement strategies',
        'Consider timing and pacing for maximum impact',
        'Document multiple attention strategies for flexibility',
        'Generate attention-gaining strategies document'
      ],
      outputFormat: 'JSON with strategies, hooks, multimedia, timing, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'artifacts'],
      properties: {
        strategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              strategy: { type: 'string' },
              type: { type: 'string' },
              description: { type: 'string' },
              resources: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        hooks: { type: 'array', items: { type: 'string' } },
        multimedia: { type: 'array' },
        timing: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'gagne', 'event1', 'attention']
}));

// Task 2: Inform Learners of Objectives
export const informObjectivesTask = defineTask('inform-objectives', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Formulate objectives communication (Event 2)',
  agent: {
    name: 'objectives-communicator',
    prompt: {
      role: 'learning objectives specialist',
      task: 'Design effective communication of learning objectives to learners',
      context: args,
      instructions: [
        'Translate objectives into learner-friendly language',
        'Create clear statements of what learners will achieve',
        'Design visual representation of objectives',
        'Connect objectives to real-world applications',
        'Plan how to communicate success criteria',
        'Create expectation-setting activities',
        'Design objectives overview materials',
        'Plan methods to check learner understanding of objectives',
        'Generate objectives communication document'
      ],
      outputFormat: 'JSON with communication, learnerObjectives, visualRepresentation, successCriteria, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['communication', 'learnerObjectives', 'artifacts'],
      properties: {
        communication: {
          type: 'object',
          properties: {
            method: { type: 'string' },
            timing: { type: 'string' },
            format: { type: 'string' }
          }
        },
        learnerObjectives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              objective: { type: 'string' },
              learnerFriendlyVersion: { type: 'string' },
              realWorldConnection: { type: 'string' }
            }
          }
        },
        visualRepresentation: { type: 'object' },
        successCriteria: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'gagne', 'event2', 'objectives']
}));

// Task 3: Stimulate Recall of Prior Learning
export const stimulateRecallTask = defineTask('stimulate-recall', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design prior knowledge activation (Event 3)',
  agent: {
    name: 'recall-activator',
    prompt: {
      role: 'cognitive learning specialist',
      task: 'Design strategies to activate prior knowledge and connect to new learning',
      context: args,
      instructions: [
        'Identify prerequisite knowledge needed for new learning',
        'Design questions to activate prior knowledge',
        'Create brief review activities',
        'Plan analogies connecting old and new knowledge',
        'Design advance organizers',
        'Create knowledge mapping activities',
        'Plan misconception identification and correction',
        'Design collaborative recall activities',
        'Generate recall stimulation document'
      ],
      outputFormat: 'JSON with techniques, prerequisites, reviewActivities, analogies, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['techniques', 'prerequisites', 'artifacts'],
      properties: {
        techniques: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              technique: { type: 'string' },
              description: { type: 'string' },
              timing: { type: 'string' }
            }
          }
        },
        prerequisites: { type: 'array', items: { type: 'string' } },
        reviewActivities: { type: 'array' },
        analogies: { type: 'array' },
        advanceOrganizers: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'gagne', 'event3', 'recall']
}));

// Task 4: Present the Content
export const presentContentTask = defineTask('present-content', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design content presentation (Event 4)',
  agent: {
    name: 'content-presenter',
    prompt: {
      role: 'instructional content designer',
      task: 'Design effective content presentation strategies',
      context: args,
      instructions: [
        'Organize content in logical, meaningful chunks',
        'Design multiple representation formats (text, visual, audio)',
        'Apply multimedia learning principles (Mayer)',
        'Create examples and non-examples',
        'Design demonstrations and modeling',
        'Plan content sequencing (simple to complex)',
        'Include concrete and abstract representations',
        'Design interactive content elements',
        'Generate content presentation document'
      ],
      outputFormat: 'JSON with presentation, contentChunks, multimedia, examples, demonstrations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['presentation', 'contentChunks', 'artifacts'],
      properties: {
        presentation: {
          type: 'object',
          properties: {
            structure: { type: 'string' },
            sequencing: { type: 'string' },
            pacing: { type: 'string' }
          }
        },
        contentChunks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              chunkId: { type: 'string' },
              title: { type: 'string' },
              content: { type: 'string' },
              format: { type: 'string' },
              duration: { type: 'string' }
            }
          }
        },
        multimedia: { type: 'array' },
        examples: { type: 'array' },
        demonstrations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'gagne', 'event4', 'content']
}));

// Task 5: Provide Learning Guidance
export const provideLearningGuidanceTask = defineTask('provide-learning-guidance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design learning guidance (Event 5)',
  agent: {
    name: 'learning-guide',
    prompt: {
      role: 'learning facilitation specialist',
      task: 'Design scaffolding and guidance strategies for learning',
      context: args,
      instructions: [
        'Design scaffolding strategies for complex content',
        'Create guided examples with think-aloud protocols',
        'Plan coaching and prompting strategies',
        'Design worked examples with fading support',
        'Create hints and cues for problem-solving',
        'Plan elaboration strategies',
        'Design mnemonic devices and memory aids',
        'Create study guides and learning supports',
        'Generate learning guidance document'
      ],
      outputFormat: 'JSON with guidance, scaffolding, workedExamples, hints, studyGuides, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['guidance', 'scaffolding', 'artifacts'],
      properties: {
        guidance: {
          type: 'object',
          properties: {
            strategies: { type: 'array', items: { type: 'string' } },
            timing: { type: 'string' },
            fadingPlan: { type: 'string' }
          }
        },
        scaffolding: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              description: { type: 'string' },
              whenToUse: { type: 'string' }
            }
          }
        },
        workedExamples: { type: 'array' },
        hints: { type: 'array' },
        studyGuides: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'gagne', 'event5', 'guidance']
}));

// Task 6: Elicit Performance (Practice)
export const elicitPerformanceTask = defineTask('elicit-performance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design practice activities (Event 6)',
  agent: {
    name: 'practice-designer',
    prompt: {
      role: 'practice activity designer',
      task: 'Design effective practice activities for skill development',
      context: args,
      instructions: [
        'Design practice activities aligned with each objective',
        'Create varied practice opportunities (guided, independent)',
        'Plan distributed practice schedule',
        'Design problem-solving exercises',
        'Create application scenarios',
        'Plan collaborative practice activities',
        'Design practice with increasing difficulty',
        'Create authentic practice contexts',
        'Generate practice activities document'
      ],
      outputFormat: 'JSON with activities, practiceSchedule, difficultyProgression, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['activities', 'artifacts'],
      properties: {
        activities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              activityId: { type: 'string' },
              objective: { type: 'string' },
              type: { type: 'string' },
              description: { type: 'string' },
              difficulty: { type: 'string' },
              duration: { type: 'string' }
            }
          }
        },
        practiceSchedule: { type: 'object' },
        difficultyProgression: { type: 'array' },
        collaborativeActivities: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'gagne', 'event6', 'practice']
}));

// Task 7: Provide Feedback
export const provideFeedbackTask = defineTask('provide-feedback', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design feedback mechanisms (Event 7)',
  agent: {
    name: 'feedback-designer',
    prompt: {
      role: 'feedback system designer',
      task: 'Design effective feedback mechanisms for practice activities',
      context: args,
      instructions: [
        'Design immediate feedback for practice activities',
        'Create corrective feedback for errors',
        'Plan confirmatory feedback for correct responses',
        'Design elaborated feedback explaining why',
        'Create peer feedback mechanisms',
        'Plan self-assessment feedback tools',
        'Design feedback timing strategies',
        'Create adaptive feedback based on performance',
        'Generate feedback design document'
      ],
      outputFormat: 'JSON with feedback, feedbackTypes, timing, adaptiveFeedback, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['feedback', 'artifacts'],
      properties: {
        feedback: {
          type: 'object',
          properties: {
            immediateStrategy: { type: 'string' },
            delayedStrategy: { type: 'string' },
            adaptiveRules: { type: 'array' }
          }
        },
        feedbackTypes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              whenToUse: { type: 'string' },
              example: { type: 'string' }
            }
          }
        },
        timing: { type: 'object' },
        adaptiveFeedback: { type: 'object' },
        peerFeedback: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'gagne', 'event7', 'feedback']
}));

// Task 8: Assess Performance
export const assessPerformanceTask = defineTask('assess-performance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design performance assessment (Event 8)',
  agent: {
    name: 'assessment-designer',
    prompt: {
      role: 'performance assessment specialist',
      task: 'Design assessments to evaluate learning objective achievement',
      context: args,
      instructions: [
        'Design assessments aligned with each learning objective',
        'Create multiple assessment formats',
        'Develop clear scoring criteria and rubrics',
        'Plan formative check-in assessments',
        'Design summative performance assessments',
        'Create authentic assessment scenarios',
        'Plan assessment accommodations for diverse learners',
        'Design assessment feedback delivery',
        'Generate assessment design document'
      ],
      outputFormat: 'JSON with assessment, assessmentItems, rubrics, accommodations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assessment', 'assessmentItems', 'artifacts'],
      properties: {
        assessment: {
          type: 'object',
          properties: {
            strategy: { type: 'string' },
            timing: { type: 'string' },
            passingCriteria: { type: 'string' }
          }
        },
        assessmentItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              itemId: { type: 'string' },
              objective: { type: 'string' },
              format: { type: 'string' },
              item: { type: 'string' },
              points: { type: 'number' }
            }
          }
        },
        rubrics: { type: 'array' },
        accommodations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'gagne', 'event8', 'assessment']
}));

// Task 9: Enhance Retention and Transfer
export const enhanceRetentionTransferTask = defineTask('enhance-retention-transfer', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design retention and transfer strategies (Event 9)',
  agent: {
    name: 'transfer-designer',
    prompt: {
      role: 'learning transfer specialist',
      task: 'Design strategies to enhance retention and promote transfer',
      context: args,
      instructions: [
        'Design spaced repetition activities',
        'Create job aids and performance support tools',
        'Plan application assignments in real contexts',
        'Design reflection and summarization activities',
        'Create transfer planning worksheets',
        'Plan follow-up reinforcement activities',
        'Design peer teaching opportunities',
        'Create resources for continued learning',
        'Generate retention and transfer document'
      ],
      outputFormat: 'JSON with strategies, spacedRepetition, jobAids, applicationAssignments, followUp, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'artifacts'],
      properties: {
        strategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              strategy: { type: 'string' },
              type: { type: 'string' },
              timing: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        spacedRepetition: { type: 'object' },
        jobAids: { type: 'array' },
        applicationAssignments: { type: 'array' },
        followUp: { type: 'object' },
        continuedLearning: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'gagne', 'event9', 'transfer']
}));

// Task 10: Compile Lesson Plan
export const compileLessonPlanTask = defineTask('compile-lesson-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compile comprehensive lesson plan',
  agent: {
    name: 'lesson-planner',
    prompt: {
      role: 'instructional lesson planner',
      task: 'Compile all nine events into comprehensive lesson plan',
      context: args,
      instructions: [
        'Integrate all nine events into coherent sequence',
        'Create detailed timeline with timing estimates',
        'Compile all required materials list',
        'Create facilitator guide with detailed instructions',
        'Develop learner materials packet',
        'Add transition strategies between events',
        'Include contingency plans for timing adjustments',
        'Create lesson plan overview document',
        'Generate complete lesson package'
      ],
      outputFormat: 'JSON with plan, timeline, materials, facilitatorGuide, learnerMaterials, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'materials', 'artifacts'],
      properties: {
        plan: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            duration: { type: 'string' },
            objectives: { type: 'array' },
            sequence: { type: 'array' },
            transitions: { type: 'array' }
          }
        },
        timeline: { type: 'object' },
        materials: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              material: { type: 'string' },
              type: { type: 'string' },
              event: { type: 'number' },
              quantity: { type: 'string' }
            }
          }
        },
        facilitatorGuide: { type: 'object' },
        learnerMaterials: { type: 'array' },
        contingencyPlans: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'gagne', 'lesson-plan', 'compilation']
}));

// Task 11: Quality Scoring
export const gagneQualityScoringTask = defineTask('gagne-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score Gagne\'s Nine Events implementation quality',
  agent: {
    name: 'gagne-quality-auditor',
    prompt: {
      role: 'instructional design quality auditor',
      task: 'Assess Gagne\'s Nine Events implementation quality and completeness',
      context: args,
      instructions: [
        'Evaluate each event\'s design quality (equal weight)',
        'Assess alignment between events and objectives',
        'Review transitions and flow between events',
        'Evaluate learner engagement strategies',
        'Assess assessment alignment with practice',
        'Calculate weighted overall score (0-100)',
        'Identify missing or weak elements',
        'Provide specific recommendations',
        'Validate against instructional design best practices'
      ],
      outputFormat: 'JSON with overallScore, eventScores, alignmentCheck, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'eventScores', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        eventScores: {
          type: 'object',
          properties: {
            event1: { type: 'number' },
            event2: { type: 'number' },
            event3: { type: 'number' },
            event4: { type: 'number' },
            event5: { type: 'number' },
            event6: { type: 'number' },
            event7: { type: 'number' },
            event8: { type: 'number' },
            event9: { type: 'number' }
          }
        },
        alignmentCheck: { type: 'object' },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        strengths: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'gagne', 'quality-scoring', 'validation']
}));
