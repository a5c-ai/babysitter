/**
 * @process customer-experience/knowledge-base-development
 * @description Process for creating, structuring, and maintaining self-service knowledge content with quality controls
 * @inputs { contentRequirements: array, existingArticles: array, audienceProfiles: object, styleGuide: object }
 * @outputs { success: boolean, contentPlan: object, articles: array, qualityReport: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    contentRequirements = [],
    existingArticles = [],
    audienceProfiles = {},
    styleGuide = {},
    outputDir = 'kb-development-output',
    targetArticleCount = 50
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Knowledge Base Development Workflow');

  // ============================================================================
  // PHASE 1: CONTENT GAP ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing content gaps');
  const gapAnalysis = await ctx.task(gapAnalysisTask, {
    contentRequirements,
    existingArticles,
    outputDir
  });

  artifacts.push(...gapAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: CONTENT ARCHITECTURE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 2: Designing content architecture');
  const architectureDesign = await ctx.task(architectureDesignTask, {
    gapAnalysis,
    existingArticles,
    audienceProfiles,
    outputDir
  });

  artifacts.push(...architectureDesign.artifacts);

  // ============================================================================
  // PHASE 3: ARTICLE PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 3: Planning article creation');
  const articlePlanning = await ctx.task(articlePlanningTask, {
    gapAnalysis,
    architectureDesign,
    contentRequirements,
    targetArticleCount,
    outputDir
  });

  artifacts.push(...articlePlanning.artifacts);

  // ============================================================================
  // PHASE 4: CONTENT CREATION GUIDELINES
  // ============================================================================

  ctx.log('info', 'Phase 4: Defining content creation guidelines');
  const creationGuidelines = await ctx.task(creationGuidelinesTask, {
    styleGuide,
    audienceProfiles,
    architectureDesign,
    outputDir
  });

  artifacts.push(...creationGuidelines.artifacts);

  // ============================================================================
  // PHASE 5: ARTICLE TEMPLATE DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Developing article templates');
  const templateDevelopment = await ctx.task(templateDevelopmentTask, {
    creationGuidelines,
    architectureDesign,
    articlePlanning,
    outputDir
  });

  artifacts.push(...templateDevelopment.artifacts);

  // ============================================================================
  // PHASE 6: QUALITY CRITERIA DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 6: Defining quality criteria');
  const qualityCriteria = await ctx.task(qualityCriteriaTask, {
    creationGuidelines,
    styleGuide,
    outputDir
  });

  artifacts.push(...qualityCriteria.artifacts);

  // ============================================================================
  // PHASE 7: REVIEW WORKFLOW SETUP
  // ============================================================================

  ctx.log('info', 'Phase 7: Setting up review workflow');
  const reviewWorkflow = await ctx.task(reviewWorkflowTask, {
    qualityCriteria,
    articlePlanning,
    outputDir
  });

  artifacts.push(...reviewWorkflow.artifacts);

  // ============================================================================
  // PHASE 8: DEVELOPMENT PLAN QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 8: Assessing development plan quality');
  const qualityAssessment = await ctx.task(qualityAssessmentTask, {
    gapAnalysis,
    architectureDesign,
    articlePlanning,
    creationGuidelines,
    templateDevelopment,
    qualityCriteria,
    reviewWorkflow,
    outputDir
  });

  artifacts.push(...qualityAssessment.artifacts);

  const qualityScore = qualityAssessment.overallScore;
  const qualityMet = qualityScore >= 85;

  await ctx.breakpoint({
    question: `Knowledge base development plan complete. Articles planned: ${articlePlanning.articleCount}. Gaps identified: ${gapAnalysis.gaps?.length || 0}. Quality score: ${qualityScore}/100. ${qualityMet ? 'Plan meets standards!' : 'May need refinement.'} Review and execute?`,
    title: 'KB Development Plan Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        qualityScore,
        qualityMet,
        gapsIdentified: gapAnalysis.gaps?.length || 0,
        articlesPlanned: articlePlanning.articleCount,
        templatesCreated: templateDevelopment.templates?.length || 0,
        categories: architectureDesign.categories?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    qualityScore,
    qualityMet,
    contentPlan: {
      gaps: gapAnalysis.gaps,
      architecture: architectureDesign.structure,
      articlePlan: articlePlanning.articles
    },
    guidelines: creationGuidelines.guidelines,
    templates: templateDevelopment.templates,
    qualityCriteria: qualityCriteria.criteria,
    reviewWorkflow: reviewWorkflow.workflow,
    artifacts,
    duration,
    metadata: {
      processId: 'customer-experience/knowledge-base-development',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const gapAnalysisTask = defineTask('gap-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze content gaps',
  agent: {
    name: 'content-analyst',
    prompt: {
      role: 'knowledge management analyst',
      task: 'Analyze gaps in current knowledge base content',
      context: args,
      instructions: [
        'Review content requirements',
        'Inventory existing articles',
        'Identify missing topic coverage',
        'Identify outdated content',
        'Analyze search queries without results',
        'Review support ticket topics',
        'Identify content depth gaps',
        'Prioritize gap filling',
        'Generate gap analysis report'
      ],
      outputFormat: 'JSON with gaps, missingTopics, outdatedContent, searchGaps, priorities, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['gaps', 'priorities', 'artifacts'],
      properties: {
        gaps: { type: 'array', items: { type: 'object' } },
        missingTopics: { type: 'array', items: { type: 'string' } },
        outdatedContent: { type: 'array', items: { type: 'object' } },
        searchGaps: { type: 'array', items: { type: 'object' } },
        priorities: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-base', 'gap-analysis']
}));

export const architectureDesignTask = defineTask('architecture-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design content architecture',
  agent: {
    name: 'information-architect',
    prompt: {
      role: 'information architecture specialist',
      task: 'Design knowledge base content architecture and taxonomy',
      context: args,
      instructions: [
        'Design category hierarchy',
        'Create content taxonomy',
        'Define navigation structure',
        'Plan cross-linking strategy',
        'Design search optimization approach',
        'Create audience-based views',
        'Define content relationships',
        'Plan metadata schema',
        'Generate architecture documentation'
      ],
      outputFormat: 'JSON with structure, categories, taxonomy, navigation, crossLinking, metadata, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['structure', 'categories', 'artifacts'],
      properties: {
        structure: { type: 'object' },
        categories: { type: 'array', items: { type: 'object' } },
        taxonomy: { type: 'object' },
        navigation: { type: 'object' },
        crossLinking: { type: 'object' },
        metadata: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-base', 'architecture']
}));

export const articlePlanningTask = defineTask('article-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan article creation',
  agent: {
    name: 'content-planner',
    prompt: {
      role: 'content planning specialist',
      task: 'Plan knowledge base article creation roadmap',
      context: args,
      instructions: [
        'Create article inventory list',
        'Prioritize by customer impact',
        'Assign article types (how-to, reference, troubleshooting)',
        'Estimate creation effort',
        'Plan creation timeline',
        'Assign content owners',
        'Define review requirements',
        'Schedule publication dates',
        'Generate article planning document'
      ],
      outputFormat: 'JSON with articles, articleCount, timeline, assignments, schedule, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['articles', 'articleCount', 'artifacts'],
      properties: {
        articles: { type: 'array', items: { type: 'object' } },
        articleCount: { type: 'number' },
        timeline: { type: 'object' },
        assignments: { type: 'array', items: { type: 'object' } },
        schedule: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-base', 'planning']
}));

export const creationGuidelinesTask = defineTask('creation-guidelines', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define content creation guidelines',
  agent: {
    name: 'guidelines-developer',
    prompt: {
      role: 'content standards specialist',
      task: 'Define comprehensive content creation guidelines',
      context: args,
      instructions: [
        'Define writing style standards',
        'Create tone and voice guidelines',
        'Define readability requirements',
        'Create formatting standards',
        'Define multimedia usage guidelines',
        'Create accessibility requirements',
        'Define SEO best practices',
        'Create localization guidelines',
        'Generate creation guidelines document'
      ],
      outputFormat: 'JSON with guidelines, style, formatting, accessibility, seo, localization, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['guidelines', 'artifacts'],
      properties: {
        guidelines: { type: 'object' },
        style: { type: 'object' },
        formatting: { type: 'object' },
        accessibility: { type: 'object' },
        seo: { type: 'object' },
        localization: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-base', 'guidelines']
}));

export const templateDevelopmentTask = defineTask('template-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop article templates',
  agent: {
    name: 'template-developer',
    prompt: {
      role: 'content template specialist',
      task: 'Develop reusable article templates for different content types',
      context: args,
      instructions: [
        'Create how-to article template',
        'Create troubleshooting template',
        'Create reference documentation template',
        'Create FAQ template',
        'Create getting started template',
        'Include placeholder guidance',
        'Add metadata fields',
        'Include quality checklist',
        'Generate template package'
      ],
      outputFormat: 'JSON with templates, howTo, troubleshooting, reference, faq, gettingStarted, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['templates', 'artifacts'],
      properties: {
        templates: { type: 'array', items: { type: 'object' } },
        howTo: { type: 'object' },
        troubleshooting: { type: 'object' },
        reference: { type: 'object' },
        faq: { type: 'object' },
        gettingStarted: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-base', 'templates']
}));

export const qualityCriteriaTask = defineTask('quality-criteria', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define quality criteria',
  agent: {
    name: 'quality-specialist',
    prompt: {
      role: 'content quality specialist',
      task: 'Define quality criteria and scoring for knowledge base content',
      context: args,
      instructions: [
        'Define accuracy criteria',
        'Define completeness criteria',
        'Define clarity and readability criteria',
        'Define searchability criteria',
        'Define visual quality criteria',
        'Create quality scoring rubric',
        'Define minimum quality thresholds',
        'Create quality checklist',
        'Generate quality criteria document'
      ],
      outputFormat: 'JSON with criteria, rubric, thresholds, checklist, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['criteria', 'rubric', 'artifacts'],
      properties: {
        criteria: { type: 'array', items: { type: 'object' } },
        rubric: { type: 'object' },
        thresholds: { type: 'object' },
        checklist: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-base', 'quality']
}));

export const reviewWorkflowTask = defineTask('review-workflow', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up review workflow',
  agent: {
    name: 'workflow-designer',
    prompt: {
      role: 'content workflow specialist',
      task: 'Design content review and approval workflow',
      context: args,
      instructions: [
        'Define review stages',
        'Assign reviewer roles',
        'Create review checklists',
        'Define approval criteria',
        'Set review SLAs',
        'Design feedback loops',
        'Plan revision process',
        'Define publication gates',
        'Generate workflow documentation'
      ],
      outputFormat: 'JSON with workflow, stages, roles, checklists, slas, feedbackLoops, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['workflow', 'stages', 'artifacts'],
      properties: {
        workflow: { type: 'object' },
        stages: { type: 'array', items: { type: 'object' } },
        roles: { type: 'array', items: { type: 'object' } },
        checklists: { type: 'array', items: { type: 'object' } },
        slas: { type: 'object' },
        feedbackLoops: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'knowledge-base', 'workflow']
}));

export const qualityAssessmentTask = defineTask('quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess development plan quality',
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'knowledge base quality specialist',
      task: 'Assess overall quality of knowledge base development plan',
      context: args,
      instructions: [
        'Evaluate gap analysis completeness (weight: 15%)',
        'Assess architecture design quality (weight: 20%)',
        'Review article planning thoroughness (weight: 20%)',
        'Evaluate guidelines comprehensiveness (weight: 15%)',
        'Assess template quality (weight: 15%)',
        'Review quality criteria adequacy (weight: 10%)',
        'Evaluate workflow design (weight: 5%)',
        'Calculate overall quality score',
        'Generate quality assessment report'
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
  labels: ['agent', 'knowledge-base', 'quality-assessment']
}));
