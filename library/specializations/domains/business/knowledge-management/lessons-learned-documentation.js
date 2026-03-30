/**
 * @process domains/business/knowledge-management/lessons-learned-documentation
 * @description Systematically document lessons learned in standardized formats with context, analysis, recommendations, and actionable guidance
 * @specialization Knowledge Management
 * @category Lessons Learned
 * @inputs { lessonSources: array, projectContext: object, documentationStandards: object, targetAudience: string, outputDir: string }
 * @outputs { success: boolean, documentedLessons: array, lessonCatalog: object, qualityScore: number, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    lessonSources = [],
    projectContext = {},
    documentationStandards = {
      format: 'standard',
      includeContext: true,
      includeAnalysis: true,
      includeRecommendations: true,
      includeExamples: true
    },
    targetAudience = 'general',
    existingLessons = [],
    categorization = {
      taxonomy: [],
      tags: []
    },
    outputDir = 'lessons-documentation-output',
    requireApproval = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Lessons Learned Capture and Documentation Process');

  // ============================================================================
  // PHASE 1: LESSON SOURCE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing lesson sources');
  const sourceAnalysis = await ctx.task(sourceAnalysisTask, {
    lessonSources,
    projectContext,
    existingLessons,
    outputDir
  });

  artifacts.push(...sourceAnalysis.artifacts);

  // Breakpoint: Review source analysis
  await ctx.breakpoint({
    question: `Identified ${sourceAnalysis.potentialLessons.length} potential lessons from ${lessonSources.length} sources. Review?`,
    title: 'Source Analysis Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        sourcesAnalyzed: lessonSources.length,
        potentialLessons: sourceAnalysis.potentialLessons.length
      }
    }
  });

  // ============================================================================
  // PHASE 2: LESSON EXTRACTION AND FORMULATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Extracting and formulating lessons');
  const lessonExtraction = await ctx.task(lessonExtractionTask, {
    potentialLessons: sourceAnalysis.potentialLessons,
    projectContext,
    outputDir
  });

  artifacts.push(...lessonExtraction.artifacts);

  // ============================================================================
  // PHASE 3: CONTEXT DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Documenting lesson context');
  const contextDocumentation = await ctx.task(contextDocumentationTask, {
    lessons: lessonExtraction.lessons,
    projectContext,
    documentationStandards,
    outputDir
  });

  artifacts.push(...contextDocumentation.artifacts);

  // ============================================================================
  // PHASE 4: ROOT CAUSE ANALYSIS DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Documenting root cause analysis');
  const rootCauseDocumentation = await ctx.task(rootCauseDocumentationTask, {
    lessons: lessonExtraction.lessons,
    contextDocumentation: contextDocumentation.contexts,
    outputDir
  });

  artifacts.push(...rootCauseDocumentation.artifacts);

  // Breakpoint: Review analysis
  await ctx.breakpoint({
    question: `Documented root causes for ${rootCauseDocumentation.analyzedLessons.length} lessons. Review?`,
    title: 'Root Cause Analysis Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        lessonsAnalyzed: rootCauseDocumentation.analyzedLessons.length,
        rootCausesIdentified: rootCauseDocumentation.totalRootCauses
      }
    }
  });

  // ============================================================================
  // PHASE 5: RECOMMENDATION DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Developing recommendations');
  const recommendationDevelopment = await ctx.task(recommendationDevelopmentTask, {
    lessons: lessonExtraction.lessons,
    rootCauses: rootCauseDocumentation.analyzedLessons,
    targetAudience,
    outputDir
  });

  artifacts.push(...recommendationDevelopment.artifacts);

  // ============================================================================
  // PHASE 6: STANDARDIZED DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating standardized documentation');
  const standardizedDocumentation = await ctx.task(standardizedDocumentationTask, {
    lessons: lessonExtraction.lessons,
    contexts: contextDocumentation.contexts,
    rootCauses: rootCauseDocumentation.analyzedLessons,
    recommendations: recommendationDevelopment.recommendations,
    documentationStandards,
    targetAudience,
    outputDir
  });

  artifacts.push(...standardizedDocumentation.artifacts);

  // ============================================================================
  // PHASE 7: CATEGORIZATION AND TAGGING
  // ============================================================================

  ctx.log('info', 'Phase 7: Categorizing and tagging lessons');
  const categorizationTagging = await ctx.task(categorizationTask, {
    documentedLessons: standardizedDocumentation.documentedLessons,
    categorization,
    existingLessons,
    outputDir
  });

  artifacts.push(...categorizationTagging.artifacts);

  // ============================================================================
  // PHASE 8: EXPERT VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Validating with subject matter experts');
  const expertValidation = await ctx.task(expertValidationTask, {
    documentedLessons: standardizedDocumentation.documentedLessons,
    projectContext,
    outputDir
  });

  artifacts.push(...expertValidation.artifacts);

  // ============================================================================
  // PHASE 9: QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 9: Assessing documentation quality');
  const qualityAssessment = await ctx.task(qualityAssessmentTask, {
    sourceAnalysis,
    lessonExtraction,
    standardizedDocumentation,
    expertValidation,
    outputDir
  });

  artifacts.push(...qualityAssessment.artifacts);

  // ============================================================================
  // PHASE 10: STAKEHOLDER REVIEW (IF REQUIRED)
  // ============================================================================

  let reviewResult = null;
  if (requireApproval) {
    ctx.log('info', 'Phase 10: Conducting stakeholder review');
    reviewResult = await ctx.task(stakeholderReviewTask, {
      documentedLessons: standardizedDocumentation.documentedLessons,
      lessonCatalog: categorizationTagging.catalog,
      qualityScore: qualityAssessment.overallScore,
      expertValidation,
      outputDir
    });

    artifacts.push(...reviewResult.artifacts);

    // Breakpoint: Final approval gate
    await ctx.breakpoint({
      question: `Stakeholder review complete. ${reviewResult.approved ? 'Approved!' : 'Requires revisions.'} Finalize documentation?`,
      title: 'Final Approval Gate',
      context: {
        runId: ctx.runId,
        files: artifacts.map(a => ({
          path: a.path,
          format: a.format || 'markdown',
          language: a.language || undefined,
          label: a.label || undefined
        })),
        summary: {
          approved: reviewResult.approved,
          qualityScore: qualityAssessment.overallScore,
          lessonsDocumented: standardizedDocumentation.documentedLessons.length
        }
      }
    });
  }

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    documentedLessons: standardizedDocumentation.documentedLessons,
    lessonCatalog: categorizationTagging.catalog,
    statistics: {
      sourcesAnalyzed: lessonSources.length,
      lessonsDocumented: standardizedDocumentation.documentedLessons.length,
      recommendationsGenerated: recommendationDevelopment.recommendations.length,
      categoriesAssigned: categorizationTagging.categoriesUsed
    },
    validation: {
      expertValidationScore: expertValidation.overallScore,
      validationPassed: expertValidation.overallScore >= 80
    },
    qualityScore: qualityAssessment.overallScore,
    approved: reviewResult ? reviewResult.approved : true,
    artifacts,
    duration,
    metadata: {
      processId: 'domains/business/knowledge-management/lessons-learned-documentation',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Source Analysis
export const sourceAnalysisTask = defineTask('source-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze lesson sources',
  agent: {
    name: 'source-analyst',
    prompt: {
      role: 'lessons learned source analyst',
      task: 'Analyze sources to identify potential lessons',
      context: args,
      instructions: [
        'Analyze lesson sources:',
        '  - After-action reviews',
        '  - Project retrospectives',
        '  - Incident reports',
        '  - Performance data',
        '  - Stakeholder feedback',
        'Identify potential lessons from each source',
        'Assess lesson significance and applicability',
        'Check for duplicates with existing lessons',
        'Prioritize lessons for documentation',
        'Save source analysis to output directory'
      ],
      outputFormat: 'JSON with potentialLessons (array), sourceQuality (object), duplicates (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['potentialLessons', 'artifacts'],
      properties: {
        potentialLessons: { type: 'array' },
        sourceQuality: { type: 'object' },
        duplicates: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'lessons-learned', 'analysis']
}));

// Task 2: Lesson Extraction
export const lessonExtractionTask = defineTask('lesson-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Extract and formulate lessons',
  agent: {
    name: 'lesson-formulator',
    prompt: {
      role: 'lessons learned formulation specialist',
      task: 'Extract and formulate clear lessons learned',
      context: args,
      instructions: [
        'Formulate lessons learned:',
        '  - Clear, concise lesson statement',
        '  - Actionable guidance',
        '  - Specific not generic',
        '  - Evidence-based',
        'Distinguish between:',
        '  - Sustains (what to continue)',
        '  - Improves (what to change)',
        '  - Starts (what to adopt)',
        '  - Stops (what to discontinue)',
        'Save extracted lessons to output directory'
      ],
      outputFormat: 'JSON with lessons (array), lessonTypes (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['lessons', 'artifacts'],
      properties: {
        lessons: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              type: { type: 'string', enum: ['sustain', 'improve', 'start', 'stop'] },
              statement: { type: 'string' },
              significance: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        lessonTypes: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'lessons-learned', 'extraction']
}));

// Task 3: Context Documentation
export const contextDocumentationTask = defineTask('context-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document lesson context',
  agent: {
    name: 'context-documenter',
    prompt: {
      role: 'lesson context documenter',
      task: 'Document comprehensive context for each lesson',
      context: args,
      instructions: [
        'Document lesson context:',
        '  - Project/event background',
        '  - Situation and circumstances',
        '  - Stakeholders involved',
        '  - Constraints and conditions',
        '  - Timeline and phases',
        'Include sufficient detail for understanding',
        'Document conditions for applicability',
        'Save context documentation to output directory'
      ],
      outputFormat: 'JSON with contexts (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['contexts', 'artifacts'],
      properties: {
        contexts: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'lessons-learned', 'context']
}));

// Task 4: Root Cause Documentation
export const rootCauseDocumentationTask = defineTask('root-cause-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Document root cause analysis',
  agent: {
    name: 'root-cause-documenter',
    prompt: {
      role: 'root cause analysis documenter',
      task: 'Document root cause analysis for lessons',
      context: args,
      instructions: [
        'Document root cause analysis:',
        '  - What happened',
        '  - Why it happened (5 whys)',
        '  - Contributing factors',
        '  - Systemic vs situational causes',
        'Apply appropriate analysis methods',
        'Document evidence supporting analysis',
        'Save root cause documentation to output directory'
      ],
      outputFormat: 'JSON with analyzedLessons (array), totalRootCauses (number), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analyzedLessons', 'totalRootCauses', 'artifacts'],
      properties: {
        analyzedLessons: { type: 'array' },
        totalRootCauses: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'lessons-learned', 'root-cause']
}));

// Task 5: Recommendation Development
export const recommendationDevelopmentTask = defineTask('recommendation-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop recommendations',
  agent: {
    name: 'recommendation-developer',
    prompt: {
      role: 'lessons learned recommendation developer',
      task: 'Develop actionable recommendations from lessons',
      context: args,
      instructions: [
        'Develop recommendations:',
        '  - Specific and actionable',
        '  - Feasible and realistic',
        '  - Measurable outcomes',
        '  - Clear ownership potential',
        'Address root causes',
        'Consider implementation barriers',
        'Prioritize recommendations',
        'Save recommendations to output directory'
      ],
      outputFormat: 'JSON with recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'artifacts'],
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              lessonId: { type: 'string' },
              recommendation: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] },
              feasibility: { type: 'string', enum: ['high', 'medium', 'low'] },
              expectedOutcome: { type: 'string' }
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
  labels: ['agent', 'knowledge-management', 'lessons-learned', 'recommendations']
}));

// Task 6: Standardized Documentation
export const standardizedDocumentationTask = defineTask('standardized-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create standardized documentation',
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'lessons learned documentation specialist',
      task: 'Create standardized lesson documentation',
      context: args,
      instructions: [
        'Create standardized lesson documents:',
        '  - Lesson title and summary',
        '  - Context and background',
        '  - What happened',
        '  - Root cause analysis',
        '  - Recommendations',
        '  - Applicability guidance',
        '  - Related lessons',
        'Apply documentation standards',
        'Ensure clarity for target audience',
        'Save standardized documents to output directory'
      ],
      outputFormat: 'JSON with documentedLessons (array), documentFormat (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentedLessons', 'artifacts'],
      properties: {
        documentedLessons: { type: 'array' },
        documentFormat: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'lessons-learned', 'documentation']
}));

// Task 7: Categorization
export const categorizationTask = defineTask('categorization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Categorize and tag lessons',
  agent: {
    name: 'categorization-specialist',
    prompt: {
      role: 'lessons categorization specialist',
      task: 'Categorize and tag documented lessons',
      context: args,
      instructions: [
        'Categorize and tag lessons:',
        '  - Apply taxonomy categories',
        '  - Add descriptive tags',
        '  - Link related lessons',
        '  - Define applicability domains',
        'Create lesson catalog',
        'Enable discoverability',
        'Save categorization to output directory'
      ],
      outputFormat: 'JSON with catalog (object), categoriesUsed (number), tagsApplied (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['catalog', 'categoriesUsed', 'artifacts'],
      properties: {
        catalog: { type: 'object' },
        categoriesUsed: { type: 'number' },
        tagsApplied: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'lessons-learned', 'categorization']
}));

// Task 8: Expert Validation
export const expertValidationTask = defineTask('expert-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate with subject matter experts',
  agent: {
    name: 'validation-coordinator',
    prompt: {
      role: 'validation coordinator',
      task: 'Validate lesson documentation with experts',
      context: args,
      instructions: [
        'Validate with experts:',
        '  - Accuracy of lesson content',
        '  - Validity of root cause analysis',
        '  - Feasibility of recommendations',
        '  - Completeness of documentation',
        'Collect expert feedback',
        'Calculate validation scores',
        'Document corrections needed',
        'Save validation results to output directory'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), validationResults (array), corrections (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        validationResults: { type: 'array' },
        corrections: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'validation', 'expert-review']
}));

// Task 9: Quality Assessment
export const qualityAssessmentTask = defineTask('quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess documentation quality',
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'documentation quality assessor',
      task: 'Evaluate quality of lesson documentation',
      context: args,
      instructions: [
        'Assess documentation quality:',
        '  - Completeness',
        '  - Clarity and readability',
        '  - Actionability',
        '  - Accuracy',
        '  - Standardization compliance',
        'Calculate overall quality score',
        'Identify improvement areas',
        'Save quality assessment to output directory'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), qualityDimensions (object), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        qualityDimensions: { type: 'object' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'quality', 'assessment']
}));

// Task 10: Stakeholder Review
export const stakeholderReviewTask = defineTask('stakeholder-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct stakeholder review',
  agent: {
    name: 'project-manager',
    prompt: {
      role: 'project manager facilitating stakeholder review',
      task: 'Coordinate stakeholder review and approval',
      context: args,
      instructions: [
        'Present documented lessons to stakeholders',
        'Review lesson catalog',
        'Present quality assessment',
        'Gather stakeholder feedback',
        'Obtain approval or identify changes',
        'Document decisions and action items',
        'Save stakeholder review results to output directory'
      ],
      outputFormat: 'JSON with approved (boolean), stakeholders (array), feedback (array), actionItems (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'stakeholders', 'artifacts'],
      properties: {
        approved: { type: 'boolean' },
        stakeholders: { type: 'array', items: { type: 'string' } },
        feedback: { type: 'array' },
        actionItems: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-management', 'stakeholder-review', 'approval']
}));
