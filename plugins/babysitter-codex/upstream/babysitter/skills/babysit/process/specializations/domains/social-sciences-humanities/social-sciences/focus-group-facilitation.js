/**
 * @process social-sciences/focus-group-facilitation
 * @description Moderate focus group discussions including participant recruitment, guide development, group dynamics management, and systematic documentation of group interactions
 * @inputs { researchQuestions: array, targetParticipants: object, groupComposition: object, outputDir: string }
 * @outputs { success: boolean, facilitationGuide: object, recruitmentPlan: object, qualityScore: number, artifacts: array }
 * @recommendedSkills SK-SS-013 (interview-facilitation), SK-SS-002 (qualitative-analysis), SK-SS-014 (research-ethics-irb)
 * @recommendedAgents AG-SS-002 (qualitative-research-specialist), AG-SS-010 (research-ethics-coordinator)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    researchQuestions = [],
    targetParticipants = {},
    groupComposition = {},
    outputDir = 'focus-group-output',
    numberOfGroups = 4,
    participantsPerGroup = 8
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Focus Group Facilitation planning process');

  // ============================================================================
  // PHASE 1: RECRUITMENT PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 1: Planning participant recruitment');
  const recruitmentPlan = await ctx.task(focusGroupRecruitmentTask, {
    targetParticipants,
    groupComposition,
    numberOfGroups,
    participantsPerGroup,
    outputDir
  });

  artifacts.push(...recruitmentPlan.artifacts);

  // ============================================================================
  // PHASE 2: DISCUSSION GUIDE DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Developing discussion guide');
  const discussionGuide = await ctx.task(discussionGuideDevelopmentTask, {
    researchQuestions,
    groupComposition,
    outputDir
  });

  artifacts.push(...discussionGuide.artifacts);

  // ============================================================================
  // PHASE 3: FACILITATION TECHNIQUES
  // ============================================================================

  ctx.log('info', 'Phase 3: Developing facilitation techniques');
  const facilitationTechniques = await ctx.task(facilitationTechniquesTask, {
    discussionGuide,
    groupComposition,
    outputDir
  });

  artifacts.push(...facilitationTechniques.artifacts);

  // ============================================================================
  // PHASE 4: GROUP DYNAMICS MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Developing group dynamics management strategies');
  const dynamicsManagement = await ctx.task(groupDynamicsManagementTask, {
    groupComposition,
    participantsPerGroup,
    outputDir
  });

  artifacts.push(...dynamicsManagement.artifacts);

  // ============================================================================
  // PHASE 5: DOCUMENTATION PROTOCOL
  // ============================================================================

  ctx.log('info', 'Phase 5: Developing documentation protocol');
  const documentationProtocol = await ctx.task(focusGroupDocumentationTask, {
    numberOfGroups,
    outputDir
  });

  artifacts.push(...documentationProtocol.artifacts);

  // ============================================================================
  // PHASE 6: LOGISTICS AND SETUP
  // ============================================================================

  ctx.log('info', 'Phase 6: Planning logistics and setup');
  const logistics = await ctx.task(focusGroupLogisticsTask, {
    numberOfGroups,
    participantsPerGroup,
    groupComposition,
    outputDir
  });

  artifacts.push(...logistics.artifacts);

  // ============================================================================
  // PHASE 7: QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Phase 7: Scoring focus group plan quality');
  const qualityScore = await ctx.task(focusGroupQualityScoringTask, {
    recruitmentPlan,
    discussionGuide,
    facilitationTechniques,
    dynamicsManagement,
    documentationProtocol,
    logistics,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const focusGroupScore = qualityScore.overallScore;
  const qualityMet = focusGroupScore >= 80;

  // Breakpoint: Review focus group plan
  await ctx.breakpoint({
    question: `Focus group plan complete. Quality score: ${focusGroupScore}/100. ${qualityMet ? 'Plan meets quality standards!' : 'Plan may need refinement.'} Review and approve?`,
    title: 'Focus Group Facilitation Plan Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        focusGroupScore,
        qualityMet,
        numberOfGroups,
        participantsPerGroup,
        totalParticipants: numberOfGroups * participantsPerGroup,
        estimatedDuration: discussionGuide.estimatedDuration
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    qualityScore: focusGroupScore,
    qualityMet,
    facilitationGuide: {
      sections: discussionGuide.sections,
      estimatedDuration: discussionGuide.estimatedDuration,
      guidePath: discussionGuide.guidePath
    },
    recruitmentPlan: {
      strategy: recruitmentPlan.strategy,
      screeningCriteria: recruitmentPlan.screeningCriteria,
      incentives: recruitmentPlan.incentives
    },
    facilitationTechniques: facilitationTechniques.techniques,
    dynamicsManagement: dynamicsManagement.strategies,
    documentationProtocol: documentationProtocol.protocol,
    logistics: logistics.plan,
    artifacts,
    duration,
    metadata: {
      processId: 'social-sciences/focus-group-facilitation',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Recruitment Planning
export const focusGroupRecruitmentTask = defineTask('focus-group-recruitment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan participant recruitment',
  agent: {
    name: 'recruitment-specialist',
    prompt: {
      role: 'focus group recruitment specialist',
      task: 'Develop comprehensive participant recruitment plan',
      context: args,
      instructions: [
        'Define participant eligibility criteria',
        'Develop screening questionnaire',
        'Plan recruitment sources and methods',
        'Design group composition for each focus group',
        'Plan for homogeneity vs heterogeneity within groups',
        'Develop over-recruitment strategy (typically 2 extra per group)',
        'Design incentive structure',
        'Plan confirmation and reminder procedures',
        'Generate recruitment protocol'
      ],
      outputFormat: 'JSON with strategy, screeningCriteria, groupComposition, overRecruitment, incentives, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategy', 'screeningCriteria', 'artifacts'],
      properties: {
        strategy: { type: 'object' },
        screeningCriteria: { type: 'array', items: { type: 'string' } },
        groupComposition: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              group: { type: 'string' },
              characteristics: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        overRecruitment: { type: 'number' },
        incentives: { type: 'object' },
        confirmationProcedures: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'focus-group', 'recruitment']
}));

// Task 2: Discussion Guide Development
export const discussionGuideDevelopmentTask = defineTask('discussion-guide-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop discussion guide',
  agent: {
    name: 'discussion-guide-developer',
    prompt: {
      role: 'focus group methodology expert',
      task: 'Develop comprehensive discussion guide for focus groups',
      context: args,
      instructions: [
        'Design opening/ice-breaker questions',
        'Develop introductory questions for topic engagement',
        'Design transition questions between themes',
        'Develop key questions aligned with research objectives',
        'Design ending questions and summary',
        'Include probing questions for each section',
        'Plan timing for each section',
        'Include facilitator notes and instructions',
        'Design activity or stimulus materials if needed',
        'Generate complete discussion guide'
      ],
      outputFormat: 'JSON with sections, keyQuestions, probes, estimatedDuration, guidePath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['sections', 'estimatedDuration', 'artifacts'],
      properties: {
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              section: { type: 'string' },
              questions: { type: 'number' },
              timeAllocation: { type: 'string' }
            }
          }
        },
        keyQuestions: { type: 'array', items: { type: 'string' } },
        probes: { type: 'array', items: { type: 'string' } },
        estimatedDuration: { type: 'string' },
        stimulusMaterials: { type: 'array', items: { type: 'string' } },
        guidePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'focus-group', 'discussion-guide']
}));

// Task 3: Facilitation Techniques
export const facilitationTechniquesTask = defineTask('facilitation-techniques', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop facilitation techniques',
  agent: {
    name: 'facilitation-specialist',
    prompt: {
      role: 'experienced focus group moderator',
      task: 'Develop effective facilitation techniques and strategies',
      context: args,
      instructions: [
        'Develop techniques for encouraging participation',
        'Design strategies for drawing out quiet participants',
        'Develop techniques for managing dominant participants',
        'Design probing and follow-up question strategies',
        'Develop active listening techniques',
        'Design strategies for staying neutral',
        'Develop techniques for managing disagreements',
        'Design time management strategies',
        'Generate facilitation techniques guide'
      ],
      outputFormat: 'JSON with techniques, encouragementStrategies, probing, timeManagement, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['techniques', 'artifacts'],
      properties: {
        techniques: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              technique: { type: 'string' },
              purpose: { type: 'string' },
              whenToUse: { type: 'string' }
            }
          }
        },
        encouragementStrategies: { type: 'array', items: { type: 'string' } },
        probing: { type: 'object' },
        neutrality: { type: 'array', items: { type: 'string' } },
        timeManagement: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'focus-group', 'facilitation']
}));

// Task 4: Group Dynamics Management
export const groupDynamicsManagementTask = defineTask('group-dynamics-management', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop group dynamics management strategies',
  agent: {
    name: 'group-dynamics-specialist',
    prompt: {
      role: 'group dynamics and facilitation expert',
      task: 'Develop strategies for managing group dynamics',
      context: args,
      instructions: [
        'Develop strategies for creating safe environment',
        'Design approaches for handling sensitive topics',
        'Develop strategies for managing groupthink',
        'Design approaches for handling conflict',
        'Develop strategies for dominant participants',
        'Design approaches for shy/quiet participants',
        'Develop strategies for off-topic discussions',
        'Design approaches for emotional responses',
        'Generate group dynamics management guide'
      ],
      outputFormat: 'JSON with strategies, dominantParticipants, shyParticipants, conflictManagement, emotionalResponses, artifacts'
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
              situation: { type: 'string' },
              strategy: { type: 'string' },
              phrases: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        dominantParticipants: { type: 'object' },
        shyParticipants: { type: 'object' },
        conflictManagement: { type: 'object' },
        emotionalResponses: { type: 'object' },
        groupthinkPrevention: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'focus-group', 'dynamics']
}));

// Task 5: Documentation Protocol
export const focusGroupDocumentationTask = defineTask('focus-group-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop documentation protocol',
  agent: {
    name: 'documentation-specialist',
    prompt: {
      role: 'qualitative data documentation expert',
      task: 'Develop comprehensive documentation protocol for focus groups',
      context: args,
      instructions: [
        'Plan audio/video recording setup',
        'Design note-taking protocol for assistant moderator',
        'Develop seating chart template',
        'Design interaction tracking method',
        'Plan transcription approach',
        'Design participant identification system',
        'Develop debriefing protocol post-session',
        'Design summary report template',
        'Generate documentation protocol'
      ],
      outputFormat: 'JSON with protocol, recording, noteTaking, transcription, debriefing, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['protocol', 'artifacts'],
      properties: {
        protocol: { type: 'object' },
        recording: { type: 'object' },
        noteTaking: { type: 'object' },
        seatingChart: { type: 'string' },
        interactionTracking: { type: 'object' },
        transcription: { type: 'object' },
        debriefing: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'focus-group', 'documentation']
}));

// Task 6: Logistics Planning
export const focusGroupLogisticsTask = defineTask('focus-group-logistics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan logistics and setup',
  agent: {
    name: 'logistics-specialist',
    prompt: {
      role: 'focus group operations specialist',
      task: 'Plan comprehensive logistics for focus group sessions',
      context: args,
      instructions: [
        'Select and configure venue/space',
        'Plan room setup and seating arrangement',
        'Arrange equipment (recording, refreshments, etc.)',
        'Develop check-in procedures',
        'Plan consent form administration',
        'Design participant materials distribution',
        'Plan refreshment provision',
        'Develop contingency plans',
        'Generate logistics checklist'
      ],
      outputFormat: 'JSON with plan, venue, equipment, checkinProcedures, contingencies, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        venue: { type: 'object' },
        roomSetup: { type: 'string' },
        equipment: { type: 'array', items: { type: 'string' } },
        checkinProcedures: { type: 'array', items: { type: 'string' } },
        contingencies: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'focus-group', 'logistics']
}));

// Task 7: Quality Scoring
export const focusGroupQualityScoringTask = defineTask('focus-group-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score focus group plan quality',
  agent: {
    name: 'focus-group-reviewer',
    prompt: {
      role: 'senior qualitative researcher',
      task: 'Assess focus group facilitation plan quality',
      context: args,
      instructions: [
        'Evaluate recruitment plan comprehensiveness (weight: 15%)',
        'Assess discussion guide quality (weight: 25%)',
        'Evaluate facilitation techniques (weight: 20%)',
        'Assess group dynamics management (weight: 15%)',
        'Evaluate documentation protocol (weight: 15%)',
        'Assess logistics planning (weight: 10%)',
        'Calculate weighted overall score (0-100)',
        'Identify gaps and recommendations'
      ],
      outputFormat: 'JSON with overallScore, componentScores, gaps, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            recruitmentPlan: { type: 'number' },
            discussionGuide: { type: 'number' },
            facilitationTechniques: { type: 'number' },
            dynamicsManagement: { type: 'number' },
            documentationProtocol: { type: 'number' },
            logistics: { type: 'number' }
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
  labels: ['agent', 'focus-group', 'quality-scoring']
}));
