/**
 * @process humanities/peer-review-evaluation
 * @description Conduct constructive peer review of humanities scholarship evaluating methodology, evidence, argumentation, and contribution to the field
 * @inputs { manuscript: object, reviewCriteria: array, journalGuidelines: object, reviewType: string }
 * @outputs { success: boolean, peerReview: object, recommendations: array, detailedFeedback: object, artifacts: array }
 * @recommendedSkills SK-HUM-010 (citation-scholarly-apparatus), SK-HUM-005 (literary-close-reading), SK-HUM-001 (primary-source-evaluation)
 * @recommendedAgents AG-HUM-009 (grants-publications-advisor), AG-HUM-004 (literary-critic-theorist)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    manuscript,
    reviewCriteria = ['argument', 'evidence', 'methodology', 'contribution'],
    journalGuidelines = {},
    reviewType = 'double-blind',
    outputDir = 'peer-review-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Initial Manuscript Assessment
  ctx.log('info', 'Conducting initial manuscript assessment');
  const initialAssessment = await ctx.task(initialAssessmentTask, {
    manuscript,
    journalGuidelines,
    outputDir
  });

  if (!initialAssessment.success) {
    return {
      success: false,
      error: 'Initial assessment failed',
      details: initialAssessment,
      metadata: { processId: 'humanities/peer-review-evaluation', timestamp: startTime }
    };
  }

  artifacts.push(...initialAssessment.artifacts);

  // Task 2: Argument and Thesis Evaluation
  ctx.log('info', 'Evaluating argument and thesis');
  const argumentEvaluation = await ctx.task(argumentEvaluationTask, {
    manuscript,
    initialAssessment,
    outputDir
  });

  artifacts.push(...argumentEvaluation.artifacts);

  // Task 3: Evidence and Methodology Assessment
  ctx.log('info', 'Assessing evidence and methodology');
  const methodologyAssessment = await ctx.task(methodologyAssessmentTask, {
    manuscript,
    argumentEvaluation,
    outputDir
  });

  artifacts.push(...methodologyAssessment.artifacts);

  // Task 4: Scholarly Contribution Evaluation
  ctx.log('info', 'Evaluating scholarly contribution');
  const contributionEvaluation = await ctx.task(contributionEvaluationTask, {
    manuscript,
    argumentEvaluation,
    methodologyAssessment,
    outputDir
  });

  artifacts.push(...contributionEvaluation.artifacts);

  // Task 5: Writing and Presentation Assessment
  ctx.log('info', 'Assessing writing and presentation');
  const writingAssessment = await ctx.task(writingAssessmentTask, {
    manuscript,
    journalGuidelines,
    outputDir
  });

  artifacts.push(...writingAssessment.artifacts);

  // Task 6: Constructive Feedback Development
  ctx.log('info', 'Developing constructive feedback');
  const feedbackDevelopment = await ctx.task(feedbackDevelopmentTask, {
    argumentEvaluation,
    methodologyAssessment,
    contributionEvaluation,
    writingAssessment,
    outputDir
  });

  artifacts.push(...feedbackDevelopment.artifacts);

  // Task 7: Generate Peer Review Report
  ctx.log('info', 'Generating peer review report');
  const reviewReport = await ctx.task(reviewReportTask, {
    manuscript,
    initialAssessment,
    argumentEvaluation,
    methodologyAssessment,
    contributionEvaluation,
    writingAssessment,
    feedbackDevelopment,
    journalGuidelines,
    outputDir
  });

  artifacts.push(...reviewReport.artifacts);

  // Breakpoint: Review peer review
  await ctx.breakpoint({
    question: `Peer review complete for "${manuscript.title || 'manuscript'}". Recommendation: ${reviewReport.recommendation}. Review feedback?`,
    title: 'Peer Review Evaluation Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        manuscriptTitle: manuscript.title,
        recommendation: reviewReport.recommendation,
        majorConcerns: feedbackDevelopment.majorConcerns?.length || 0,
        minorConcerns: feedbackDevelopment.minorConcerns?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    peerReview: {
      recommendation: reviewReport.recommendation,
      overallAssessment: reviewReport.overallAssessment,
      scores: reviewReport.scores
    },
    recommendations: feedbackDevelopment.recommendations,
    detailedFeedback: {
      argument: argumentEvaluation.feedback,
      methodology: methodologyAssessment.feedback,
      contribution: contributionEvaluation.feedback,
      writing: writingAssessment.feedback
    },
    artifacts,
    duration,
    metadata: {
      processId: 'humanities/peer-review-evaluation',
      timestamp: startTime,
      manuscriptTitle: manuscript.title,
      outputDir
    }
  };
}

// Task 1: Initial Manuscript Assessment
export const initialAssessmentTask = defineTask('initial-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct initial manuscript assessment',
  agent: {
    name: 'initial-reviewer',
    prompt: {
      role: 'peer review assessment specialist',
      task: 'Conduct initial assessment of manuscript',
      context: args,
      instructions: [
        'Assess scope fit with journal',
        'Verify completeness of submission',
        'Identify manuscript type and approach',
        'Note initial impressions',
        'Check formatting compliance',
        'Assess abstract accuracy',
        'Identify key claims',
        'Note areas requiring close attention'
      ],
      outputFormat: 'JSON with success, scopeFit, completeness, impressions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'scopeFit', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        scopeFit: {
          type: 'object',
          properties: {
            fit: { type: 'string' },
            rationale: { type: 'string' }
          }
        },
        completeness: { type: 'object' },
        impressions: {
          type: 'object',
          properties: {
            strengths: { type: 'array', items: { type: 'string' } },
            concerns: { type: 'array', items: { type: 'string' } }
          }
        },
        keyClaims: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'assessment', 'peer-review', 'initial']
}));

// Task 2: Argument and Thesis Evaluation
export const argumentEvaluationTask = defineTask('argument-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate argument and thesis',
  agent: {
    name: 'argument-evaluator',
    prompt: {
      role: 'argumentation evaluation specialist',
      task: 'Evaluate strength and clarity of argument',
      context: args,
      instructions: [
        'Assess thesis clarity and originality',
        'Evaluate argument structure',
        'Assess claim-evidence connections',
        'Evaluate logical consistency',
        'Identify logical fallacies if any',
        'Assess engagement with counterarguments',
        'Evaluate argument scope',
        'Provide constructive feedback'
      ],
      outputFormat: 'JSON with evaluation, strengths, weaknesses, feedback, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['evaluation', 'feedback', 'artifacts'],
      properties: {
        evaluation: {
          type: 'object',
          properties: {
            thesisClarity: { type: 'string' },
            originality: { type: 'string' },
            structure: { type: 'string' },
            logic: { type: 'string' }
          }
        },
        strengths: { type: 'array', items: { type: 'string' } },
        weaknesses: { type: 'array', items: { type: 'string' } },
        feedback: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'argument', 'evaluation', 'thesis']
}));

// Task 3: Evidence and Methodology Assessment
export const methodologyAssessmentTask = defineTask('methodology-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess evidence and methodology',
  agent: {
    name: 'methodology-assessor',
    prompt: {
      role: 'methodology assessment specialist',
      task: 'Assess evidence use and methodological rigor',
      context: args,
      instructions: [
        'Evaluate appropriateness of methodology',
        'Assess evidence quality and selection',
        'Evaluate source coverage',
        'Assess analytical methods',
        'Evaluate handling of limitations',
        'Check for methodological transparency',
        'Assess reproducibility where applicable',
        'Provide methodological recommendations'
      ],
      outputFormat: 'JSON with assessment, evidenceQuality, methodRigor, feedback, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assessment', 'feedback', 'artifacts'],
      properties: {
        assessment: {
          type: 'object',
          properties: {
            methodology: { type: 'string' },
            evidenceQuality: { type: 'string' },
            coverage: { type: 'string' },
            transparency: { type: 'string' }
          }
        },
        evidenceQuality: {
          type: 'object',
          properties: {
            strengths: { type: 'array', items: { type: 'string' } },
            gaps: { type: 'array', items: { type: 'string' } }
          }
        },
        methodRigor: { type: 'string' },
        feedback: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'methodology', 'evidence', 'assessment']
}));

// Task 4: Scholarly Contribution Evaluation
export const contributionEvaluationTask = defineTask('contribution-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Evaluate scholarly contribution',
  agent: {
    name: 'contribution-evaluator',
    prompt: {
      role: 'scholarly contribution specialist',
      task: 'Evaluate contribution to field',
      context: args,
      instructions: [
        'Assess originality of contribution',
        'Evaluate significance to field',
        'Assess engagement with existing scholarship',
        'Evaluate potential impact',
        'Assess timeliness and relevance',
        'Evaluate theoretical contribution',
        'Assess methodological contribution',
        'Provide contribution assessment'
      ],
      outputFormat: 'JSON with evaluation, originality, significance, feedback, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['evaluation', 'feedback', 'artifacts'],
      properties: {
        evaluation: {
          type: 'object',
          properties: {
            originality: { type: 'string' },
            significance: { type: 'string' },
            engagement: { type: 'string' },
            impact: { type: 'string' }
          }
        },
        originality: {
          type: 'object',
          properties: {
            level: { type: 'string' },
            aspects: { type: 'array', items: { type: 'string' } }
          }
        },
        significance: { type: 'string' },
        feedback: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'contribution', 'significance', 'evaluation']
}));

// Task 5: Writing and Presentation Assessment
export const writingAssessmentTask = defineTask('writing-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess writing and presentation',
  agent: {
    name: 'writing-assessor',
    prompt: {
      role: 'scholarly writing assessment specialist',
      task: 'Assess writing quality and presentation',
      context: args,
      instructions: [
        'Evaluate prose clarity',
        'Assess organization and flow',
        'Evaluate scholarly voice',
        'Check citation accuracy and format',
        'Assess abstract quality',
        'Evaluate figure/table quality if applicable',
        'Check length appropriateness',
        'Provide writing recommendations'
      ],
      outputFormat: 'JSON with assessment, clarity, organization, feedback, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assessment', 'feedback', 'artifacts'],
      properties: {
        assessment: {
          type: 'object',
          properties: {
            clarity: { type: 'string' },
            organization: { type: 'string' },
            voice: { type: 'string' },
            citations: { type: 'string' }
          }
        },
        clarity: { type: 'string' },
        organization: { type: 'string' },
        editingNeeds: { type: 'array', items: { type: 'string' } },
        feedback: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'writing', 'presentation', 'assessment']
}));

// Task 6: Constructive Feedback Development
export const feedbackDevelopmentTask = defineTask('feedback-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop constructive feedback',
  agent: {
    name: 'feedback-developer',
    prompt: {
      role: 'constructive feedback specialist',
      task: 'Develop constructive revision recommendations',
      context: args,
      instructions: [
        'Synthesize evaluations into feedback',
        'Distinguish major from minor concerns',
        'Prioritize revision recommendations',
        'Frame feedback constructively',
        'Provide specific suggestions',
        'Identify required vs suggested changes',
        'Balance criticism with encouragement',
        'Create actionable revision list'
      ],
      outputFormat: 'JSON with majorConcerns, minorConcerns, recommendations, tone, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['majorConcerns', 'minorConcerns', 'recommendations', 'artifacts'],
      properties: {
        majorConcerns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              concern: { type: 'string' },
              recommendation: { type: 'string' },
              priority: { type: 'string' }
            }
          }
        },
        minorConcerns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              concern: { type: 'string' },
              suggestion: { type: 'string' }
            }
          }
        },
        recommendations: { type: 'array', items: { type: 'string' } },
        encouragement: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'feedback', 'constructive', 'revision']
}));

// Task 7: Peer Review Report Generation
export const reviewReportTask = defineTask('review-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate peer review report',
  agent: {
    name: 'review-report-writer',
    prompt: {
      role: 'peer review report specialist',
      task: 'Generate comprehensive peer review report',
      context: args,
      instructions: [
        'Compose summary assessment',
        'State publication recommendation',
        'Present detailed feedback by category',
        'Include major and minor concerns',
        'Provide revision checklist',
        'Include confidential editor comments',
        'Follow journal review format',
        'Ensure constructive tone throughout'
      ],
      outputFormat: 'JSON with recommendation, overallAssessment, scores, report, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendation', 'overallAssessment', 'artifacts'],
      properties: {
        recommendation: {
          type: 'string',
          enum: ['accept', 'minor-revisions', 'major-revisions', 'revise-resubmit', 'reject']
        },
        overallAssessment: { type: 'string' },
        scores: {
          type: 'object',
          properties: {
            originality: { type: 'number' },
            significance: { type: 'number' },
            methodology: { type: 'number' },
            presentation: { type: 'number' }
          }
        },
        report: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            detailed: { type: 'string' },
            confidential: { type: 'string' }
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
  labels: ['agent', 'peer-review', 'report', 'recommendation']
}));
