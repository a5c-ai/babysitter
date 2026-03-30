/**
 * @process social-sciences/cross-cultural-measurement-adaptation
 * @description Adapt and validate instruments for cross-cultural use including translation, back-translation, cognitive interviewing, and measurement invariance testing
 * @inputs { originalInstrument: object, sourceLanguage: string, targetLanguages: array, targetCultures: array, outputDir: string }
 * @outputs { success: boolean, adaptedInstruments: object, invarianceResults: object, qualityScore: number, artifacts: array }
 * @recommendedSkills SK-SS-009 (psychometric-assessment), SK-SS-003 (survey-design-administration)
 * @recommendedAgents AG-SS-007 (measurement-psychometrics-expert), AG-SS-003 (survey-research-director)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    originalInstrument = {},
    sourceLanguage = 'English',
    targetLanguages = [],
    targetCultures = [],
    outputDir = 'cross-cultural-adaptation-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Cross-Cultural Measurement Adaptation process');

  // ============================================================================
  // PHASE 1: ADAPTATION PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 1: Planning adaptation');
  const adaptationPlanning = await ctx.task(adaptationPlanningTask, {
    originalInstrument,
    sourceLanguage,
    targetLanguages,
    targetCultures,
    outputDir
  });

  artifacts.push(...adaptationPlanning.artifacts);

  // ============================================================================
  // PHASE 2: TRANSLATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Conducting translation');
  const translation = await ctx.task(translationTask, {
    originalInstrument,
    targetLanguages,
    adaptationPlanning,
    outputDir
  });

  artifacts.push(...translation.artifacts);

  // ============================================================================
  // PHASE 3: BACK-TRANSLATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Conducting back-translation');
  const backTranslation = await ctx.task(backTranslationTask, {
    translation,
    sourceLanguage,
    outputDir
  });

  artifacts.push(...backTranslation.artifacts);

  // ============================================================================
  // PHASE 4: EXPERT COMMITTEE REVIEW
  // ============================================================================

  ctx.log('info', 'Phase 4: Expert committee review');
  const expertCommittee = await ctx.task(expertCommitteeReviewTask, {
    translation,
    backTranslation,
    originalInstrument,
    outputDir
  });

  artifacts.push(...expertCommittee.artifacts);

  // ============================================================================
  // PHASE 5: COGNITIVE INTERVIEWING
  // ============================================================================

  ctx.log('info', 'Phase 5: Conducting cognitive interviewing');
  const cognitiveInterviewing = await ctx.task(cognitiveInterviewingTask, {
    expertCommittee,
    targetCultures,
    outputDir
  });

  artifacts.push(...cognitiveInterviewing.artifacts);

  // ============================================================================
  // PHASE 6: MEASUREMENT INVARIANCE TESTING
  // ============================================================================

  ctx.log('info', 'Phase 6: Testing measurement invariance');
  const invarianceTesting = await ctx.task(measurementInvarianceTask, {
    adaptedInstrument: cognitiveInterviewing.finalVersion,
    originalInstrument,
    outputDir
  });

  artifacts.push(...invarianceTesting.artifacts);

  // ============================================================================
  // PHASE 7: QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Phase 7: Scoring adaptation quality');
  const qualityScore = await ctx.task(adaptationQualityScoringTask, {
    adaptationPlanning,
    translation,
    backTranslation,
    expertCommittee,
    cognitiveInterviewing,
    invarianceTesting,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const adaptationScore = qualityScore.overallScore;
  const qualityMet = adaptationScore >= 80;

  // Breakpoint: Review adaptation
  await ctx.breakpoint({
    question: `Cross-cultural adaptation complete. Quality score: ${adaptationScore}/100. ${qualityMet ? 'Adaptation meets quality standards!' : 'Adaptation may need refinement.'} Review and approve?`,
    title: 'Cross-Cultural Adaptation Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        adaptationScore,
        qualityMet,
        targetLanguages,
        invarianceLevel: invarianceTesting.invarianceLevel
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    qualityScore: adaptationScore,
    qualityMet,
    adaptedInstruments: cognitiveInterviewing.finalVersions,
    invarianceResults: {
      invarianceLevel: invarianceTesting.invarianceLevel,
      fitIndices: invarianceTesting.fitIndices,
      dif: invarianceTesting.dif
    },
    artifacts,
    duration,
    metadata: {
      processId: 'social-sciences/cross-cultural-measurement-adaptation',
      timestamp: startTime,
      outputDir
    }
  };
}

export const adaptationPlanningTask = defineTask('adaptation-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan adaptation',
  agent: {
    name: 'adaptation-planner',
    prompt: {
      role: 'cross-cultural measurement specialist',
      task: 'Plan cross-cultural instrument adaptation',
      context: args,
      instructions: [
        'Review original instrument psychometrics',
        'Assess construct equivalence across cultures',
        'Identify potential cultural issues',
        'Select adaptation methodology (ITC guidelines)',
        'Plan translation team composition',
        'Plan pilot testing approach',
        'Plan invariance testing strategy',
        'Generate adaptation protocol'
      ],
      outputFormat: 'JSON with adaptationProtocol, culturalIssues, methodology, teamRequirements, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['adaptationProtocol', 'methodology', 'artifacts'],
      properties: {
        adaptationProtocol: { type: 'object' },
        culturalIssues: { type: 'array', items: { type: 'string' } },
        methodology: { type: 'string' },
        teamRequirements: { type: 'object' },
        constructEquivalence: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cross-cultural', 'planning']
}));

export const translationTask = defineTask('translation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct translation',
  agent: {
    name: 'translation-specialist',
    prompt: {
      role: 'instrument translation specialist',
      task: 'Translate instrument using forward translation',
      context: args,
      instructions: [
        'Recruit qualified translators',
        'Conduct independent forward translations',
        'Synthesize translations',
        'Document translation decisions',
        'Address idiomatic expressions',
        'Maintain conceptual equivalence',
        'Reconcile translator differences',
        'Generate translation documentation'
      ],
      outputFormat: 'JSON with translations, syntheses, translationDecisions, idiomaticIssues, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['translations', 'syntheses', 'artifacts'],
      properties: {
        translations: { type: 'object' },
        syntheses: { type: 'object' },
        translationDecisions: { type: 'array' },
        idiomaticIssues: { type: 'array' },
        translatorInfo: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cross-cultural', 'translation']
}));

export const backTranslationTask = defineTask('back-translation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct back-translation',
  agent: {
    name: 'back-translation-specialist',
    prompt: {
      role: 'back-translation specialist',
      task: 'Conduct back-translation to source language',
      context: args,
      instructions: [
        'Recruit back-translators naive to original',
        'Conduct independent back-translations',
        'Compare back-translation to original',
        'Identify discrepancies',
        'Analyze sources of discrepancy',
        'Document conceptual vs literal issues',
        'Flag items needing revision',
        'Generate back-translation report'
      ],
      outputFormat: 'JSON with backTranslations, comparison, discrepancies, itemsForRevision, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['backTranslations', 'discrepancies', 'artifacts'],
      properties: {
        backTranslations: { type: 'object' },
        comparison: { type: 'object' },
        discrepancies: { type: 'array' },
        itemsForRevision: { type: 'array' },
        conceptualIssues: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cross-cultural', 'back-translation']
}));

export const expertCommitteeReviewTask = defineTask('expert-committee-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Expert committee review',
  agent: {
    name: 'expert-committee-coordinator',
    prompt: {
      role: 'cross-cultural expert committee coordinator',
      task: 'Coordinate expert committee review',
      context: args,
      instructions: [
        'Assemble multilingual expert committee',
        'Review all translation materials',
        'Assess semantic equivalence',
        'Assess idiomatic equivalence',
        'Assess experiential equivalence',
        'Assess conceptual equivalence',
        'Resolve discrepancies',
        'Produce pre-final version',
        'Generate committee review report'
      ],
      outputFormat: 'JSON with preFinalVersion, equivalenceAssessment, resolutions, committeeComposition, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['preFinalVersion', 'equivalenceAssessment', 'artifacts'],
      properties: {
        preFinalVersion: { type: 'object' },
        equivalenceAssessment: {
          type: 'object',
          properties: {
            semantic: { type: 'string' },
            idiomatic: { type: 'string' },
            experiential: { type: 'string' },
            conceptual: { type: 'string' }
          }
        },
        resolutions: { type: 'array' },
        committeeComposition: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cross-cultural', 'expert-committee']
}));

export const cognitiveInterviewingTask = defineTask('cognitive-interviewing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct cognitive interviewing',
  agent: {
    name: 'cognitive-interview-specialist',
    prompt: {
      role: 'cognitive interviewing specialist',
      task: 'Conduct cognitive interviews with target population',
      context: args,
      instructions: [
        'Recruit participants from target cultures',
        'Conduct think-aloud protocols',
        'Probe item comprehension',
        'Identify problematic items',
        'Assess response processes',
        'Document cultural interpretations',
        'Revise items based on findings',
        'Produce final version',
        'Generate cognitive interviewing report'
      ],
      outputFormat: 'JSON with participants, findings, problematicItems, revisions, finalVersions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['findings', 'finalVersions', 'artifacts'],
      properties: {
        participants: { type: 'object' },
        findings: { type: 'array' },
        problematicItems: { type: 'array' },
        culturalInterpretations: { type: 'object' },
        revisions: { type: 'array' },
        finalVersions: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cross-cultural', 'cognitive-interviewing']
}));

export const measurementInvarianceTask = defineTask('measurement-invariance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Test measurement invariance',
  agent: {
    name: 'invariance-analyst',
    prompt: {
      role: 'measurement invariance specialist',
      task: 'Test measurement invariance across cultures',
      context: args,
      instructions: [
        'Collect data from each cultural group',
        'Test configural invariance',
        'Test metric/weak invariance',
        'Test scalar/strong invariance',
        'Test strict/residual invariance',
        'Assess partial invariance if full fails',
        'Conduct DIF analysis',
        'Generate invariance testing report'
      ],
      outputFormat: 'JSON with invarianceLevel, fitIndices, modelComparison, dif, partialInvariance, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['invarianceLevel', 'fitIndices', 'artifacts'],
      properties: {
        invarianceLevel: { type: 'string' },
        fitIndices: { type: 'object' },
        modelComparison: { type: 'array' },
        dif: { type: 'object' },
        partialInvariance: { type: 'object' },
        sampleSizes: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'cross-cultural', 'invariance']
}));

export const adaptationQualityScoringTask = defineTask('adaptation-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score adaptation quality',
  agent: {
    name: 'adaptation-quality-reviewer',
    prompt: {
      role: 'cross-cultural measurement methodologist',
      task: 'Assess cross-cultural adaptation quality',
      context: args,
      instructions: [
        'Evaluate adaptation planning (weight: 10%)',
        'Assess translation quality (weight: 20%)',
        'Evaluate back-translation rigor (weight: 15%)',
        'Assess expert committee process (weight: 15%)',
        'Evaluate cognitive interviewing (weight: 20%)',
        'Assess invariance testing (weight: 20%)',
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
        componentScores: { type: 'object' },
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
  labels: ['agent', 'cross-cultural', 'quality-scoring']
}));
