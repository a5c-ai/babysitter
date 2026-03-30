/**
 * @process specializations/domains/business/human-resources/structured-interview-design
 * @description Structured Interview Design Process - Design and implementation of standardized interview processes with
 * competency-based questions, scorecards, and interviewer calibration to improve hiring quality and reduce bias.
 * @inputs { jobFamily: string, roleLevel: string, competencies: array, interviewStages?: array }
 * @outputs { success: boolean, interviewGuide: object, scorecards: array, calibrationResults: object, biasReductionMeasures: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/human-resources/structured-interview-design', {
 *   jobFamily: 'Engineering',
 *   roleLevel: 'Senior',
 *   competencies: ['technical-expertise', 'leadership', 'communication', 'problem-solving'],
 *   interviewStages: ['phone-screen', 'technical', 'behavioral', 'leadership']
 * });
 *
 * @references
 * - Talent Makers by Greenhouse: https://www.amazon.com/Talent-Makers-Organizations-Structured-Inclusive/dp/1119785286
 * - SHRM Structured Interviews: https://www.shrm.org/resourcesandtools/tools-and-samples/toolkits/pages/conductingemploymentinterviews.aspx
 * - Google Re:Work Hiring: https://rework.withgoogle.com/subjects/hiring/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    jobFamily,
    roleLevel,
    competencies,
    interviewStages = ['phone-screen', 'technical', 'behavioral', 'final'],
    existingFramework = null,
    biasReductionFocus = true,
    includeCalibration = true,
    outputDir = 'interview-design-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Structured Interview Design for ${jobFamily} - ${roleLevel}`);

  // Phase 1: Competency Framework Definition
  const competencyFramework = await ctx.task(competencyFrameworkTask, {
    jobFamily,
    roleLevel,
    competencies,
    existingFramework,
    outputDir
  });

  artifacts.push(...competencyFramework.artifacts);

  await ctx.breakpoint({
    question: `Competency framework defined with ${competencyFramework.competencies.length} competencies. Review and approve before designing questions?`,
    title: 'Competency Framework Review',
    context: {
      runId: ctx.runId,
      jobFamily,
      roleLevel,
      competencies: competencyFramework.competencies,
      behavioralIndicators: competencyFramework.behavioralIndicators,
      files: competencyFramework.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 2: Interview Stage Design
  const interviewStageDesign = await ctx.task(interviewStageDesignTask, {
    jobFamily,
    roleLevel,
    competencies: competencyFramework.competencies,
    interviewStages,
    outputDir
  });

  artifacts.push(...interviewStageDesign.artifacts);

  // Phase 3: Question Bank Development
  const questionBank = await ctx.task(questionBankTask, {
    jobFamily,
    roleLevel,
    competencies: competencyFramework.competencies,
    interviewStages: interviewStageDesign.stages,
    behavioralIndicators: competencyFramework.behavioralIndicators,
    outputDir
  });

  artifacts.push(...questionBank.artifacts);

  // Phase 4: Scorecard Development
  const scorecardDesign = await ctx.task(scorecardDesignTask, {
    jobFamily,
    roleLevel,
    competencies: competencyFramework.competencies,
    interviewStages: interviewStageDesign.stages,
    questionBank: questionBank.questions,
    outputDir
  });

  artifacts.push(...scorecardDesign.artifacts);

  await ctx.breakpoint({
    question: `Scorecards designed for ${scorecardDesign.scorecards.length} interview stages. Review scoring criteria and rating scales?`,
    title: 'Scorecard Review',
    context: {
      runId: ctx.runId,
      scorecards: scorecardDesign.scorecards,
      ratingScale: scorecardDesign.ratingScale,
      competencyWeights: scorecardDesign.competencyWeights,
      files: scorecardDesign.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // Phase 5: Bias Reduction Measures
  let biasReduction = null;
  if (biasReductionFocus) {
    biasReduction = await ctx.task(biasReductionTask, {
      jobFamily,
      competencies: competencyFramework.competencies,
      questionBank: questionBank.questions,
      scorecards: scorecardDesign.scorecards,
      outputDir
    });

    artifacts.push(...biasReduction.artifacts);
  }

  // Phase 6: Interview Guide Creation
  const interviewGuide = await ctx.task(interviewGuideTask, {
    jobFamily,
    roleLevel,
    competencies: competencyFramework.competencies,
    interviewStages: interviewStageDesign.stages,
    questionBank: questionBank.questions,
    scorecards: scorecardDesign.scorecards,
    biasReduction: biasReduction?.measures,
    outputDir
  });

  artifacts.push(...interviewGuide.artifacts);

  // Phase 7: Interviewer Training Materials
  const trainingMaterials = await ctx.task(interviewerTrainingTask, {
    jobFamily,
    roleLevel,
    interviewGuide: interviewGuide.guide,
    scorecards: scorecardDesign.scorecards,
    biasReduction: biasReduction?.measures,
    outputDir
  });

  artifacts.push(...trainingMaterials.artifacts);

  // Phase 8: Calibration Session Design
  let calibrationResults = null;
  if (includeCalibration) {
    calibrationResults = await ctx.task(calibrationSessionTask, {
      jobFamily,
      roleLevel,
      scorecards: scorecardDesign.scorecards,
      interviewGuide: interviewGuide.guide,
      outputDir
    });

    artifacts.push(...calibrationResults.artifacts);

    await ctx.breakpoint({
      question: `Calibration session designed. Inter-rater reliability target: ${calibrationResults.reliabilityTarget}. Review calibration approach?`,
      title: 'Calibration Session Review',
      context: {
        runId: ctx.runId,
        calibrationApproach: calibrationResults.approach,
        exercises: calibrationResults.exercises,
        reliabilityTarget: calibrationResults.reliabilityTarget,
        files: calibrationResults.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // Phase 9: Pilot Testing Plan
  const pilotPlan = await ctx.task(pilotTestingTask, {
    jobFamily,
    roleLevel,
    interviewGuide: interviewGuide.guide,
    scorecards: scorecardDesign.scorecards,
    outputDir
  });

  artifacts.push(...pilotPlan.artifacts);

  // Phase 10: Implementation Rollout Plan
  const rolloutPlan = await ctx.task(implementationRolloutTask, {
    jobFamily,
    roleLevel,
    interviewGuide: interviewGuide.guide,
    trainingMaterials: trainingMaterials.materials,
    pilotPlan: pilotPlan.plan,
    outputDir
  });

  artifacts.push(...rolloutPlan.artifacts);

  return {
    success: true,
    jobFamily,
    roleLevel,
    competencyFramework: competencyFramework.competencies,
    interviewStages: interviewStageDesign.stages,
    questionBank: {
      totalQuestions: questionBank.totalQuestions,
      questionsByCompetency: questionBank.questionsByCompetency,
      questionTypes: questionBank.questionTypes
    },
    interviewGuide: interviewGuide.guide,
    scorecards: scorecardDesign.scorecards,
    biasReductionMeasures: biasReduction?.measures || [],
    calibrationResults: calibrationResults ? {
      approach: calibrationResults.approach,
      reliabilityTarget: calibrationResults.reliabilityTarget,
      exercises: calibrationResults.exercises
    } : null,
    trainingMaterials: trainingMaterials.materials,
    pilotPlan: pilotPlan.plan,
    rolloutPlan: rolloutPlan.plan,
    artifacts,
    metadata: {
      processId: 'specializations/domains/business/human-resources/structured-interview-design',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task Definitions

export const competencyFrameworkTask = defineTask('competency-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Competency Framework - ${args.jobFamily}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Organizational Psychologist',
      task: 'Define comprehensive competency framework for structured interviews',
      context: {
        jobFamily: args.jobFamily,
        roleLevel: args.roleLevel,
        competencies: args.competencies,
        existingFramework: args.existingFramework,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define core competencies for the role',
        '2. Create behavioral indicators for each competency',
        '3. Define proficiency levels',
        '4. Align competencies with role requirements',
        '5. Establish competency weights',
        '6. Create competency definitions',
        '7. Map competencies to interview stages',
        '8. Identify critical vs. nice-to-have competencies',
        '9. Document observable behaviors',
        '10. Create competency matrix'
      ],
      outputFormat: 'JSON object with competency framework'
    },
    outputSchema: {
      type: 'object',
      required: ['competencies', 'behavioralIndicators', 'artifacts'],
      properties: {
        competencies: { type: 'array', items: { type: 'object' } },
        behavioralIndicators: { type: 'object' },
        proficiencyLevels: { type: 'array', items: { type: 'object' } },
        competencyWeights: { type: 'object' },
        competencyMatrix: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'interview-design', 'competency-framework']
}));

export const interviewStageDesignTask = defineTask('interview-stage-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Interview Stage Design - ${args.jobFamily}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Interview Process Designer',
      task: 'Design structured interview stages and flow',
      context: {
        jobFamily: args.jobFamily,
        roleLevel: args.roleLevel,
        competencies: args.competencies,
        interviewStages: args.interviewStages,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define interview stages and sequence',
        '2. Assign competencies to each stage',
        '3. Determine stage duration',
        '4. Identify interviewers for each stage',
        '5. Define stage objectives',
        '6. Create stage handoff procedures',
        '7. Design feedback collection points',
        '8. Plan candidate experience touchpoints',
        '9. Establish decision gates',
        '10. Document stage requirements'
      ],
      outputFormat: 'JSON object with interview stage design'
    },
    outputSchema: {
      type: 'object',
      required: ['stages', 'artifacts'],
      properties: {
        stages: { type: 'array', items: { type: 'object' } },
        stageSequence: { type: 'array', items: { type: 'string' } },
        competencyMapping: { type: 'object' },
        decisionGates: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'interview-design', 'stage-design']
}));

export const questionBankTask = defineTask('question-bank', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Question Bank Development - ${args.jobFamily}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Interview Question Designer',
      task: 'Develop comprehensive interview question bank',
      context: {
        jobFamily: args.jobFamily,
        roleLevel: args.roleLevel,
        competencies: args.competencies,
        interviewStages: args.interviewStages,
        behavioralIndicators: args.behavioralIndicators,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create behavioral interview questions (STAR format)',
        '2. Develop situational questions',
        '3. Design technical assessment questions',
        '4. Create follow-up probe questions',
        '5. Include competency-specific questions',
        '6. Add role-playing scenarios',
        '7. Design case study questions',
        '8. Create values alignment questions',
        '9. Include diversity and inclusion questions',
        '10. Document ideal response indicators'
      ],
      outputFormat: 'JSON object with question bank'
    },
    outputSchema: {
      type: 'object',
      required: ['questions', 'totalQuestions', 'artifacts'],
      properties: {
        questions: { type: 'array', items: { type: 'object' } },
        totalQuestions: { type: 'number' },
        questionsByCompetency: { type: 'object' },
        questionTypes: { type: 'object' },
        idealResponses: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'interview-design', 'question-bank']
}));

export const scorecardDesignTask = defineTask('scorecard-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Scorecard Design - ${args.jobFamily}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Assessment Design Specialist',
      task: 'Design interview scorecards with rating criteria',
      context: {
        jobFamily: args.jobFamily,
        roleLevel: args.roleLevel,
        competencies: args.competencies,
        interviewStages: args.interviewStages,
        questionBank: args.questionBank,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design rating scale (1-5 or similar)',
        '2. Create scoring rubrics for each competency',
        '3. Define behavioral anchors for ratings',
        '4. Include evidence capture fields',
        '5. Add overall recommendation section',
        '6. Design strengths/concerns areas',
        '7. Include red flag indicators',
        '8. Create weighted scoring system',
        '9. Design stage-specific scorecards',
        '10. Add calibration guidelines'
      ],
      outputFormat: 'JSON object with scorecard design'
    },
    outputSchema: {
      type: 'object',
      required: ['scorecards', 'ratingScale', 'artifacts'],
      properties: {
        scorecards: { type: 'array', items: { type: 'object' } },
        ratingScale: { type: 'object' },
        scoringRubrics: { type: 'object' },
        competencyWeights: { type: 'object' },
        behavioralAnchors: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'interview-design', 'scorecards']
}));

export const biasReductionTask = defineTask('bias-reduction', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Bias Reduction Measures - ${args.jobFamily}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DEI Interview Specialist',
      task: 'Design bias reduction measures for interview process',
      context: {
        jobFamily: args.jobFamily,
        competencies: args.competencies,
        questionBank: args.questionBank,
        scorecards: args.scorecards,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Review questions for bias indicators',
        '2. Standardize question delivery',
        '3. Design blind resume review process',
        '4. Create diverse interview panels',
        '5. Implement structured evaluation timing',
        '6. Develop bias awareness training',
        '7. Add bias check prompts in scorecards',
        '8. Design equitable candidate experience',
        '9. Create accommodation guidelines',
        '10. Establish bias audit procedures'
      ],
      outputFormat: 'JSON object with bias reduction measures'
    },
    outputSchema: {
      type: 'object',
      required: ['measures', 'artifacts'],
      properties: {
        measures: { type: 'array', items: { type: 'object' } },
        biasIndicators: { type: 'array', items: { type: 'string' } },
        mitigationStrategies: { type: 'array', items: { type: 'object' } },
        trainingTopics: { type: 'array', items: { type: 'string' } },
        auditProcedures: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'interview-design', 'bias-reduction', 'dei']
}));

export const interviewGuideTask = defineTask('interview-guide', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Interview Guide Creation - ${args.jobFamily}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Interview Guide Author',
      task: 'Create comprehensive interview guide for interviewers',
      context: {
        jobFamily: args.jobFamily,
        roleLevel: args.roleLevel,
        competencies: args.competencies,
        interviewStages: args.interviewStages,
        questionBank: args.questionBank,
        scorecards: args.scorecards,
        biasReduction: args.biasReduction,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create interview guide structure',
        '2. Include opening and closing scripts',
        '3. Add question sequencing guidance',
        '4. Include probing techniques',
        '5. Add time management guidelines',
        '6. Include note-taking best practices',
        '7. Add candidate experience tips',
        '8. Include scoring instructions',
        '9. Add bias mitigation reminders',
        '10. Create quick reference cards'
      ],
      outputFormat: 'JSON object with interview guide'
    },
    outputSchema: {
      type: 'object',
      required: ['guide', 'artifacts'],
      properties: {
        guide: { type: 'object' },
        openingScript: { type: 'string' },
        closingScript: { type: 'string' },
        questionSequence: { type: 'array', items: { type: 'object' } },
        probingTechniques: { type: 'array', items: { type: 'string' } },
        quickReferenceCards: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'interview-design', 'interview-guide']
}));

export const interviewerTrainingTask = defineTask('interviewer-training', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Interviewer Training Materials - ${args.jobFamily}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Training Content Developer',
      task: 'Develop interviewer training materials',
      context: {
        jobFamily: args.jobFamily,
        roleLevel: args.roleLevel,
        interviewGuide: args.interviewGuide,
        scorecards: args.scorecards,
        biasReduction: args.biasReduction,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create training curriculum',
        '2. Develop presentation materials',
        '3. Create practice scenarios',
        '4. Include video examples',
        '5. Design role-play exercises',
        '6. Add assessment quizzes',
        '7. Create bias awareness module',
        '8. Include scorecard practice',
        '9. Develop certification criteria',
        '10. Create refresher training'
      ],
      outputFormat: 'JSON object with training materials'
    },
    outputSchema: {
      type: 'object',
      required: ['materials', 'artifacts'],
      properties: {
        materials: { type: 'object' },
        curriculum: { type: 'array', items: { type: 'object' } },
        practiceScenarios: { type: 'array', items: { type: 'object' } },
        assessmentQuizzes: { type: 'array', items: { type: 'object' } },
        certificationCriteria: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'interview-design', 'training']
}));

export const calibrationSessionTask = defineTask('calibration-session', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Calibration Session Design - ${args.jobFamily}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Calibration Facilitator',
      task: 'Design interviewer calibration sessions',
      context: {
        jobFamily: args.jobFamily,
        roleLevel: args.roleLevel,
        scorecards: args.scorecards,
        interviewGuide: args.interviewGuide,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Design calibration session agenda',
        '2. Create calibration exercises',
        '3. Develop sample candidate profiles',
        '4. Include video interview samples',
        '5. Design scoring comparison activities',
        '6. Create discussion facilitation guide',
        '7. Set inter-rater reliability targets',
        '8. Design calibration metrics',
        '9. Create follow-up coaching plan',
        '10. Establish recalibration schedule'
      ],
      outputFormat: 'JSON object with calibration session design'
    },
    outputSchema: {
      type: 'object',
      required: ['approach', 'exercises', 'reliabilityTarget', 'artifacts'],
      properties: {
        approach: { type: 'object' },
        exercises: { type: 'array', items: { type: 'object' } },
        sampleProfiles: { type: 'array', items: { type: 'object' } },
        reliabilityTarget: { type: 'number' },
        calibrationMetrics: { type: 'object' },
        recalibrationSchedule: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'interview-design', 'calibration']
}));

export const pilotTestingTask = defineTask('pilot-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Pilot Testing Plan - ${args.jobFamily}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Process Improvement Specialist',
      task: 'Design pilot testing plan for structured interviews',
      context: {
        jobFamily: args.jobFamily,
        roleLevel: args.roleLevel,
        interviewGuide: args.interviewGuide,
        scorecards: args.scorecards,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Define pilot scope and duration',
        '2. Select pilot roles and teams',
        '3. Identify pilot interviewers',
        '4. Create feedback collection mechanisms',
        '5. Define success metrics',
        '6. Design comparison methodology',
        '7. Plan data collection',
        '8. Create pilot training plan',
        '9. Establish iteration process',
        '10. Define go/no-go criteria'
      ],
      outputFormat: 'JSON object with pilot testing plan'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        pilotScope: { type: 'object' },
        successMetrics: { type: 'array', items: { type: 'object' } },
        feedbackMechanisms: { type: 'array', items: { type: 'string' } },
        goNoGoCriteria: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'interview-design', 'pilot-testing']
}));

export const implementationRolloutTask = defineTask('implementation-rollout', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Implementation Rollout Plan - ${args.jobFamily}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Change Management Specialist',
      task: 'Create implementation and rollout plan',
      context: {
        jobFamily: args.jobFamily,
        roleLevel: args.roleLevel,
        interviewGuide: args.interviewGuide,
        trainingMaterials: args.trainingMaterials,
        pilotPlan: args.pilotPlan,
        outputDir: args.outputDir
      },
      instructions: [
        '1. Create phased rollout plan',
        '2. Define change management approach',
        '3. Identify stakeholder communications',
        '4. Plan training schedule',
        '5. Create support resources',
        '6. Define escalation procedures',
        '7. Plan ATS integration',
        '8. Create monitoring dashboard',
        '9. Establish continuous improvement process',
        '10. Define long-term maintenance plan'
      ],
      outputFormat: 'JSON object with implementation rollout plan'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        rolloutPhases: { type: 'array', items: { type: 'object' } },
        changeManagement: { type: 'object' },
        communicationPlan: { type: 'array', items: { type: 'object' } },
        trainingSchedule: { type: 'array', items: { type: 'object' } },
        supportResources: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['hr', 'interview-design', 'implementation']
}));
