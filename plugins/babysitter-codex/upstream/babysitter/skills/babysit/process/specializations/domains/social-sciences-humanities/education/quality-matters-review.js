/**
 * @process education/quality-matters-review
 * @description Applying QM rubric standards to evaluate and improve online course design across eight general standards
 * @inputs { courseName: string, courseUrl: string, reviewType: string, context: object }
 * @outputs { success: boolean, reviewReport: object, standardScores: object, recommendations: array, artifacts: array }
 * @recommendedSkills SK-EDU-013 (quality-assurance-review), SK-EDU-010 (accessibility-compliance-auditing)
 * @recommendedAgents AG-EDU-009 (quality-assurance-coordinator), AG-EDU-008 (accessibility-udl-specialist)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    courseName = 'Online Course',
    courseUrl = '',
    reviewType = 'self-review',
    context = {},
    outputDir = 'qm-review-output',
    qualityThreshold = 85
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Quality Matters Review for ${courseName}`);

  // ============================================================================
  // STANDARD 1: COURSE OVERVIEW AND INTRODUCTION
  // ============================================================================

  ctx.log('info', 'Reviewing Standard 1: Course Overview and Introduction');
  const standard1Review = await ctx.task(standard1ReviewTask, {
    courseName,
    courseUrl,
    context,
    outputDir
  });

  artifacts.push(...standard1Review.artifacts);

  // ============================================================================
  // STANDARD 2: LEARNING OBJECTIVES
  // ============================================================================

  ctx.log('info', 'Reviewing Standard 2: Learning Objectives');
  const standard2Review = await ctx.task(standard2ReviewTask, {
    courseName,
    courseUrl,
    context,
    outputDir
  });

  artifacts.push(...standard2Review.artifacts);

  // ============================================================================
  // STANDARD 3: ASSESSMENT AND MEASUREMENT
  // ============================================================================

  ctx.log('info', 'Reviewing Standard 3: Assessment and Measurement');
  const standard3Review = await ctx.task(standard3ReviewTask, {
    courseName,
    courseUrl,
    context,
    outputDir
  });

  artifacts.push(...standard3Review.artifacts);

  // ============================================================================
  // STANDARD 4: INSTRUCTIONAL MATERIALS
  // ============================================================================

  ctx.log('info', 'Reviewing Standard 4: Instructional Materials');
  const standard4Review = await ctx.task(standard4ReviewTask, {
    courseName,
    courseUrl,
    context,
    outputDir
  });

  artifacts.push(...standard4Review.artifacts);

  // ============================================================================
  // STANDARD 5: LEARNING ACTIVITIES AND LEARNER INTERACTION
  // ============================================================================

  ctx.log('info', 'Reviewing Standard 5: Learning Activities');
  const standard5Review = await ctx.task(standard5ReviewTask, {
    courseName,
    courseUrl,
    context,
    outputDir
  });

  artifacts.push(...standard5Review.artifacts);

  // ============================================================================
  // STANDARD 6: COURSE TECHNOLOGY
  // ============================================================================

  ctx.log('info', 'Reviewing Standard 6: Course Technology');
  const standard6Review = await ctx.task(standard6ReviewTask, {
    courseName,
    courseUrl,
    context,
    outputDir
  });

  artifacts.push(...standard6Review.artifacts);

  // ============================================================================
  // STANDARD 7: LEARNER SUPPORT
  // ============================================================================

  ctx.log('info', 'Reviewing Standard 7: Learner Support');
  const standard7Review = await ctx.task(standard7ReviewTask, {
    courseName,
    courseUrl,
    context,
    outputDir
  });

  artifacts.push(...standard7Review.artifacts);

  // ============================================================================
  // STANDARD 8: ACCESSIBILITY AND USABILITY
  // ============================================================================

  ctx.log('info', 'Reviewing Standard 8: Accessibility and Usability');
  const standard8Review = await ctx.task(standard8ReviewTask, {
    courseName,
    courseUrl,
    context,
    outputDir
  });

  artifacts.push(...standard8Review.artifacts);

  // ============================================================================
  // COMPREHENSIVE REVIEW REPORT
  // ============================================================================

  ctx.log('info', 'Generating comprehensive review report');
  const comprehensiveReport = await ctx.task(comprehensiveReportTask, {
    courseName,
    standardReviews: {
      standard1: standard1Review,
      standard2: standard2Review,
      standard3: standard3Review,
      standard4: standard4Review,
      standard5: standard5Review,
      standard6: standard6Review,
      standard7: standard7Review,
      standard8: standard8Review
    },
    reviewType,
    outputDir
  });

  artifacts.push(...comprehensiveReport.artifacts);

  const overallScore = comprehensiveReport.overallScore;
  const qualityMet = overallScore >= qualityThreshold;
  const meetsCertification = comprehensiveReport.meetsCertification;

  // Breakpoint: Review QM results
  await ctx.breakpoint({
    question: `Quality Matters review complete. Score: ${overallScore}%. ${meetsCertification ? 'Meets QM certification standards!' : 'Does not meet certification - review recommendations.'} Review and approve?`,
    title: 'Quality Matters Review Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        overallScore,
        qualityMet,
        meetsCertification,
        courseName,
        essentialsMet: comprehensiveReport.essentialsMet,
        totalArtifacts: artifacts.length
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    courseName,
    overallScore,
    qualityMet,
    meetsCertification,
    reviewReport: comprehensiveReport.report,
    standardScores: {
      standard1: standard1Review.score,
      standard2: standard2Review.score,
      standard3: standard3Review.score,
      standard4: standard4Review.score,
      standard5: standard5Review.score,
      standard6: standard6Review.score,
      standard7: standard7Review.score,
      standard8: standard8Review.score
    },
    recommendations: comprehensiveReport.recommendations,
    artifacts,
    duration,
    metadata: {
      processId: 'education/quality-matters-review',
      timestamp: startTime,
      courseName,
      reviewType,
      outputDir
    }
  };
}

// Task 1: Standard 1 Review - Course Overview and Introduction
export const standard1ReviewTask = defineTask('standard1-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review Standard 1: Course Overview and Introduction',
  agent: {
    name: 'qm-reviewer',
    prompt: {
      role: 'Quality Matters certified reviewer',
      task: 'Review course against QM Standard 1: Course Overview and Introduction',
      context: args,
      instructions: [
        '1.1 Clear instructions for getting started',
        '1.2 Learner self-introduction opportunity',
        '1.3 Clear statement of purpose and structure',
        '1.4 Etiquette expectations clearly stated',
        '1.5 Course and institutional policies stated',
        '1.6 Minimum technology requirements stated',
        '1.7 Required prerequisite knowledge stated',
        '1.8 Minimum technical skills stated',
        '1.9 Instructor self-introduction',
        'Rate each specific review standard as Met/Not Met',
        'Generate Standard 1 review document'
      ],
      outputFormat: 'JSON with score, specificStandards, met, notMet, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'specificStandards', 'artifacts'],
      properties: {
        score: { type: 'number' },
        specificStandards: { type: 'array' },
        met: { type: 'array' },
        notMet: { type: 'array' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qm-review', 'standard1', 'overview']
}));

// Task 2-8: Similar structure for Standards 2-8
export const standard2ReviewTask = defineTask('standard2-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review Standard 2: Learning Objectives',
  agent: {
    name: 'qm-reviewer',
    prompt: {
      role: 'Quality Matters certified reviewer',
      task: 'Review course against QM Standard 2: Learning Objectives',
      context: args,
      instructions: [
        '2.1 Course learning objectives clearly stated',
        '2.2 Module/unit objectives describe outcomes',
        '2.3 Learning objectives are measurable',
        '2.4 Relationship between objectives clear',
        '2.5 Learning objectives address content',
        'Rate each specific review standard as Met/Not Met',
        'Generate Standard 2 review document'
      ],
      outputFormat: 'JSON with score, specificStandards, met, notMet, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'specificStandards', 'artifacts'],
      properties: {
        score: { type: 'number' },
        specificStandards: { type: 'array' },
        met: { type: 'array' },
        notMet: { type: 'array' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qm-review', 'standard2', 'objectives']
}));

export const standard3ReviewTask = defineTask('standard3-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review Standard 3: Assessment and Measurement',
  agent: {
    name: 'qm-reviewer',
    prompt: {
      role: 'Quality Matters certified reviewer',
      task: 'Review course against QM Standard 3: Assessment and Measurement',
      context: args,
      instructions: [
        '3.1 Assessments measure stated learning objectives',
        '3.2 Grading policy clearly stated',
        '3.3 Assessment instructions clear',
        '3.4 Assessments are sequenced and varied',
        '3.5 Students can track progress',
        'Rate each specific review standard as Met/Not Met',
        'Generate Standard 3 review document'
      ],
      outputFormat: 'JSON with score, specificStandards, met, notMet, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'specificStandards', 'artifacts'],
      properties: {
        score: { type: 'number' },
        specificStandards: { type: 'array' },
        met: { type: 'array' },
        notMet: { type: 'array' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qm-review', 'standard3', 'assessment']
}));

export const standard4ReviewTask = defineTask('standard4-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review Standard 4: Instructional Materials',
  agent: {
    name: 'qm-reviewer',
    prompt: {
      role: 'Quality Matters certified reviewer',
      task: 'Review course against QM Standard 4: Instructional Materials',
      context: args,
      instructions: [
        '4.1 Instructional materials contribute to objectives',
        '4.2 Purpose of materials clearly explained',
        '4.3 Materials are current',
        '4.4 Materials present variety of perspectives',
        '4.5 Distinction between required/optional clear',
        'Rate each specific review standard as Met/Not Met',
        'Generate Standard 4 review document'
      ],
      outputFormat: 'JSON with score, specificStandards, met, notMet, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'specificStandards', 'artifacts'],
      properties: {
        score: { type: 'number' },
        specificStandards: { type: 'array' },
        met: { type: 'array' },
        notMet: { type: 'array' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qm-review', 'standard4', 'materials']
}));

export const standard5ReviewTask = defineTask('standard5-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review Standard 5: Learning Activities',
  agent: {
    name: 'qm-reviewer',
    prompt: {
      role: 'Quality Matters certified reviewer',
      task: 'Review course against QM Standard 5: Learning Activities and Learner Interaction',
      context: args,
      instructions: [
        '5.1 Activities promote achievement of objectives',
        '5.2 Activities foster interaction',
        '5.3 Instructor involvement clearly stated',
        '5.4 Requirements for interaction clearly stated',
        'Rate each specific review standard as Met/Not Met',
        'Generate Standard 5 review document'
      ],
      outputFormat: 'JSON with score, specificStandards, met, notMet, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'specificStandards', 'artifacts'],
      properties: {
        score: { type: 'number' },
        specificStandards: { type: 'array' },
        met: { type: 'array' },
        notMet: { type: 'array' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qm-review', 'standard5', 'activities']
}));

export const standard6ReviewTask = defineTask('standard6-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review Standard 6: Course Technology',
  agent: {
    name: 'qm-reviewer',
    prompt: {
      role: 'Quality Matters certified reviewer',
      task: 'Review course against QM Standard 6: Course Technology',
      context: args,
      instructions: [
        '6.1 Tools support learning objectives',
        '6.2 Tools promote learner engagement',
        '6.3 Technologies are current and available',
        '6.4 Links are functional',
        '6.5 Privacy policies for external tools',
        'Rate each specific review standard as Met/Not Met',
        'Generate Standard 6 review document'
      ],
      outputFormat: 'JSON with score, specificStandards, met, notMet, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'specificStandards', 'artifacts'],
      properties: {
        score: { type: 'number' },
        specificStandards: { type: 'array' },
        met: { type: 'array' },
        notMet: { type: 'array' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qm-review', 'standard6', 'technology']
}));

export const standard7ReviewTask = defineTask('standard7-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review Standard 7: Learner Support',
  agent: {
    name: 'qm-reviewer',
    prompt: {
      role: 'Quality Matters certified reviewer',
      task: 'Review course against QM Standard 7: Learner Support',
      context: args,
      instructions: [
        '7.1 Technical support information provided',
        '7.2 Academic support information provided',
        '7.3 Student services information provided',
        '7.4 Information on accessibility services',
        'Rate each specific review standard as Met/Not Met',
        'Generate Standard 7 review document'
      ],
      outputFormat: 'JSON with score, specificStandards, met, notMet, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'specificStandards', 'artifacts'],
      properties: {
        score: { type: 'number' },
        specificStandards: { type: 'array' },
        met: { type: 'array' },
        notMet: { type: 'array' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qm-review', 'standard7', 'support']
}));

export const standard8ReviewTask = defineTask('standard8-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review Standard 8: Accessibility and Usability',
  agent: {
    name: 'qm-reviewer',
    prompt: {
      role: 'Quality Matters certified reviewer',
      task: 'Review course against QM Standard 8: Accessibility and Usability',
      context: args,
      instructions: [
        '8.1 Course navigation is logical and consistent',
        '8.2 Information provided about accessibility of technologies',
        '8.3 Alternative means of access provided',
        '8.4 Design facilitates readability',
        '8.5 Multimedia facilitates ease of use',
        '8.6 Course reflects accessibility standards',
        'Rate each specific review standard as Met/Not Met',
        'Generate Standard 8 review document'
      ],
      outputFormat: 'JSON with score, specificStandards, met, notMet, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'specificStandards', 'artifacts'],
      properties: {
        score: { type: 'number' },
        specificStandards: { type: 'array' },
        met: { type: 'array' },
        notMet: { type: 'array' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qm-review', 'standard8', 'accessibility']
}));

// Task 9: Comprehensive Report
export const comprehensiveReportTask = defineTask('comprehensive-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate comprehensive QM review report',
  agent: {
    name: 'qm-report-generator',
    prompt: {
      role: 'Quality Matters review coordinator',
      task: 'Generate comprehensive QM review report',
      context: args,
      instructions: [
        'Compile all standard review results',
        'Calculate overall score',
        'Determine if all essential standards are met',
        'Determine certification eligibility',
        'Prioritize recommendations by impact',
        'Create action plan for improvement',
        'Generate executive summary',
        'Create detailed findings report',
        'Generate comprehensive review document'
      ],
      outputFormat: 'JSON with report, overallScore, essentialsMet, meetsCertification, recommendations, actionPlan, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['report', 'overallScore', 'meetsCertification', 'recommendations', 'artifacts'],
      properties: {
        report: { type: 'object' },
        overallScore: { type: 'number' },
        essentialsMet: { type: 'boolean' },
        meetsCertification: { type: 'boolean' },
        recommendations: { type: 'array' },
        actionPlan: { type: 'array' },
        executiveSummary: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'qm-review', 'report', 'comprehensive']
}));
