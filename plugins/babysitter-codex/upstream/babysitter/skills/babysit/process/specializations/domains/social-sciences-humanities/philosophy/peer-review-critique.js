/**
 * @process philosophy/peer-review-critique
 * @description Conduct systematic evaluation of philosophical manuscripts, providing constructive criticism on arguments, clarity, originality, and scholarly contribution
 * @inputs { manuscriptContent: string, manuscriptType: string, reviewDepth: string, outputDir: string }
 * @outputs { success: boolean, peerReview: object, assessmentCategories: object, recommendations: object, artifacts: array }
 * @recommendedSkills SK-PHIL-010 (philosophical-writing-argumentation), SK-PHIL-013 (scholarly-literature-synthesis), SK-PHIL-011 (fallacy-detection-analysis)
 * @recommendedAgents AG-PHIL-006 (academic-philosophy-writer-agent), AG-PHIL-001 (logic-analyst-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    manuscriptContent,
    manuscriptType = 'research-article',
    reviewDepth = 'comprehensive',
    outputDir = 'peer-review-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Manuscript Overview
  ctx.log('info', 'Starting peer review: Developing manuscript overview');
  const manuscriptOverview = await ctx.task(manuscriptOverviewTask, {
    manuscriptContent,
    manuscriptType,
    outputDir
  });

  if (!manuscriptOverview.success) {
    return {
      success: false,
      error: 'Manuscript overview failed',
      details: manuscriptOverview,
      metadata: { processId: 'philosophy/peer-review-critique', timestamp: startTime }
    };
  }

  artifacts.push(...manuscriptOverview.artifacts);

  // Task 2: Argument Assessment
  ctx.log('info', 'Assessing arguments');
  const argumentAssessment = await ctx.task(argumentAssessmentTask, {
    manuscript: manuscriptOverview.overview,
    manuscriptContent,
    outputDir
  });

  artifacts.push(...argumentAssessment.artifacts);

  // Task 3: Clarity and Presentation Assessment
  ctx.log('info', 'Assessing clarity and presentation');
  const clarityAssessment = await ctx.task(clarityAssessmentTask, {
    manuscriptContent,
    manuscriptType,
    outputDir
  });

  artifacts.push(...clarityAssessment.artifacts);

  // Task 4: Originality and Contribution Assessment
  ctx.log('info', 'Assessing originality and contribution');
  const originalityAssessment = await ctx.task(originalityAssessmentTask, {
    manuscript: manuscriptOverview.overview,
    manuscriptContent,
    outputDir
  });

  artifacts.push(...originalityAssessment.artifacts);

  // Task 5: Scholarly Engagement Assessment
  ctx.log('info', 'Assessing scholarly engagement');
  const scholarlyAssessment = await ctx.task(scholarlyAssessmentTask, {
    manuscriptContent,
    manuscriptType,
    outputDir
  });

  artifacts.push(...scholarlyAssessment.artifacts);

  // Task 6: Overall Evaluation and Recommendations
  ctx.log('info', 'Developing overall evaluation');
  const overallEvaluation = await ctx.task(overallEvaluationTask, {
    manuscriptOverview,
    argumentAssessment,
    clarityAssessment,
    originalityAssessment,
    scholarlyAssessment,
    outputDir
  });

  artifacts.push(...overallEvaluation.artifacts);

  // Breakpoint: Review peer review
  await ctx.breakpoint({
    question: `Peer review complete. Recommendation: ${overallEvaluation.recommendation}. Review the assessment?`,
    title: 'Peer Review Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        manuscriptType,
        recommendation: overallEvaluation.recommendation,
        majorConcerns: overallEvaluation.majorConcerns.length,
        minorConcerns: overallEvaluation.minorConcerns.length
      }
    }
  });

  // Task 7: Generate Peer Review Report
  ctx.log('info', 'Generating peer review report');
  const reviewReport = await ctx.task(reviewReportTask, {
    manuscriptOverview,
    argumentAssessment,
    clarityAssessment,
    originalityAssessment,
    scholarlyAssessment,
    overallEvaluation,
    outputDir
  });

  artifacts.push(...reviewReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    peerReview: {
      overview: manuscriptOverview.overview,
      recommendation: overallEvaluation.recommendation,
      summary: overallEvaluation.summary
    },
    assessmentCategories: {
      arguments: argumentAssessment.assessment,
      clarity: clarityAssessment.assessment,
      originality: originalityAssessment.assessment,
      scholarship: scholarlyAssessment.assessment
    },
    recommendations: {
      majorRevisions: overallEvaluation.majorConcerns,
      minorRevisions: overallEvaluation.minorConcerns,
      suggestions: overallEvaluation.suggestions
    },
    artifacts,
    duration,
    metadata: {
      processId: 'philosophy/peer-review-critique',
      timestamp: startTime,
      manuscriptType,
      outputDir
    }
  };
}

// Task definitions
export const manuscriptOverviewTask = defineTask('manuscript-overview', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop manuscript overview',
  agent: {
    name: 'reviewer',
    prompt: {
      role: 'philosophical peer reviewer',
      task: 'Develop an overview of the manuscript',
      context: args,
      instructions: [
        'Identify the main thesis or claim',
        'Identify the paper\'s scope and aims',
        'Summarize the main arguments',
        'Note the paper\'s structure',
        'Identify the target audience',
        'Note the philosophical tradition engaged',
        'Identify initial impressions',
        'Save manuscript overview to output directory'
      ],
      outputFormat: 'JSON with success, overview (thesis, aims, arguments, structure), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'overview', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        overview: {
          type: 'object',
          properties: {
            thesis: { type: 'string' },
            aims: { type: 'array', items: { type: 'string' } },
            mainArguments: { type: 'array', items: { type: 'string' } },
            structure: { type: 'string' },
            tradition: { type: 'string' },
            initialImpressions: { type: 'string' }
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
  labels: ['agent', 'philosophy', 'peer-review', 'overview']
}));

export const argumentAssessmentTask = defineTask('argument-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess arguments',
  agent: {
    name: 'argument-reviewer',
    prompt: {
      role: 'philosophical peer reviewer',
      task: 'Assess the quality of arguments in the manuscript',
      context: args,
      instructions: [
        'Evaluate the validity of main arguments',
        'Assess premise plausibility',
        'Check for logical fallacies',
        'Evaluate handling of objections',
        'Assess argument completeness',
        'Identify argumentative gaps',
        'Note strengths and weaknesses',
        'Save argument assessment to output directory'
      ],
      outputFormat: 'JSON with assessment (validity, premises, fallacies, gaps, strengths, weaknesses), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assessment', 'artifacts'],
      properties: {
        assessment: {
          type: 'object',
          properties: {
            validity: { type: 'string' },
            premisePlausibility: { type: 'string' },
            fallacies: { type: 'array', items: { type: 'string' } },
            objectionHandling: { type: 'string' },
            gaps: { type: 'array', items: { type: 'string' } },
            strengths: { type: 'array', items: { type: 'string' } },
            weaknesses: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'philosophy', 'peer-review', 'arguments']
}));

export const clarityAssessmentTask = defineTask('clarity-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess clarity and presentation',
  agent: {
    name: 'clarity-reviewer',
    prompt: {
      role: 'philosophical peer reviewer',
      task: 'Assess the clarity and presentation of the manuscript',
      context: args,
      instructions: [
        'Evaluate prose clarity',
        'Assess argument presentation',
        'Check organizational structure',
        'Evaluate use of examples',
        'Assess terminology and definitions',
        'Check for unnecessary jargon',
        'Evaluate overall readability',
        'Save clarity assessment to output directory'
      ],
      outputFormat: 'JSON with assessment (prose, organization, examples, terminology, readability), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assessment', 'artifacts'],
      properties: {
        assessment: {
          type: 'object',
          properties: {
            prose: { type: 'string' },
            argumentPresentation: { type: 'string' },
            organization: { type: 'string' },
            examples: { type: 'string' },
            terminology: { type: 'string' },
            jargon: { type: 'array', items: { type: 'string' } },
            readability: { type: 'string' }
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
  labels: ['agent', 'philosophy', 'peer-review', 'clarity']
}));

export const originalityAssessmentTask = defineTask('originality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess originality and contribution',
  agent: {
    name: 'originality-reviewer',
    prompt: {
      role: 'philosophical peer reviewer',
      task: 'Assess the originality and contribution of the manuscript',
      context: args,
      instructions: [
        'Evaluate originality of thesis',
        'Assess novelty of arguments',
        'Evaluate significance of contribution',
        'Consider impact on the field',
        'Compare to existing literature',
        'Assess whether it advances the debate',
        'Note innovative elements',
        'Save originality assessment to output directory'
      ],
      outputFormat: 'JSON with assessment (originality, novelty, significance, impact, innovation), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assessment', 'artifacts'],
      properties: {
        assessment: {
          type: 'object',
          properties: {
            originality: { type: 'string' },
            novelty: { type: 'string' },
            significance: { type: 'string' },
            impact: { type: 'string' },
            comparedToLiterature: { type: 'string' },
            advancesDebate: { type: 'boolean' },
            innovations: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'philosophy', 'peer-review', 'originality']
}));

export const scholarlyAssessmentTask = defineTask('scholarly-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess scholarly engagement',
  agent: {
    name: 'scholarly-reviewer',
    prompt: {
      role: 'philosophical peer reviewer',
      task: 'Assess the scholarly engagement of the manuscript',
      context: args,
      instructions: [
        'Evaluate engagement with relevant literature',
        'Check for missing important references',
        'Assess accuracy of citations',
        'Evaluate fairness to opposing views',
        'Check appropriate attribution',
        'Assess scholarly conventions compliance',
        'Note any scholarship concerns',
        'Save scholarly assessment to output directory'
      ],
      outputFormat: 'JSON with assessment (literature, missing, accuracy, fairness, conventions), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assessment', 'artifacts'],
      properties: {
        assessment: {
          type: 'object',
          properties: {
            literatureEngagement: { type: 'string' },
            missingReferences: { type: 'array', items: { type: 'string' } },
            citationAccuracy: { type: 'string' },
            fairnessToOpponents: { type: 'string' },
            attribution: { type: 'string' },
            conventionsCompliance: { type: 'string' },
            concerns: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'philosophy', 'peer-review', 'scholarly']
}));

export const overallEvaluationTask = defineTask('overall-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop overall evaluation',
  agent: {
    name: 'evaluation-synthesizer',
    prompt: {
      role: 'philosophical peer reviewer',
      task: 'Synthesize all assessments into overall evaluation',
      context: args,
      instructions: [
        'Synthesize all assessment categories',
        'Determine overall quality',
        'Identify major concerns requiring revision',
        'Identify minor concerns',
        'Formulate constructive suggestions',
        'Determine publication recommendation',
        'Write summary assessment',
        'Save overall evaluation to output directory'
      ],
      outputFormat: 'JSON with recommendation, summary, majorConcerns, minorConcerns, suggestions, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendation', 'summary', 'artifacts'],
      properties: {
        recommendation: { type: 'string' },
        summary: { type: 'string' },
        overallQuality: { type: 'string' },
        majorConcerns: { type: 'array', items: { type: 'string' } },
        minorConcerns: { type: 'array', items: { type: 'string' } },
        suggestions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'peer-review', 'evaluation']
}));

export const reviewReportTask = defineTask('review-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate peer review report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'philosophical peer reviewer',
      task: 'Generate formal peer review report',
      context: args,
      instructions: [
        'Format as standard peer review report',
        'Include summary of the paper',
        'Present overall recommendation',
        'Detail major concerns',
        'Detail minor concerns',
        'Provide constructive suggestions',
        'Maintain constructive and professional tone',
        'Save review report to output directory'
      ],
      outputFormat: 'JSON with reportPath, summary, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'summary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        summary: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'philosophy', 'peer-review', 'reporting']
}));
