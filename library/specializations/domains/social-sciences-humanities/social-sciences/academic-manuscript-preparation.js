/**
 * @process social-sciences/academic-manuscript-preparation
 * @description Prepare research manuscripts for peer-reviewed publication following APA, ASA, or discipline-specific style guidelines with proper reporting standards
 * @inputs { researchProject: object, targetJournal: object, styleGuide: string, outputDir: string }
 * @outputs { success: boolean, manuscript: object, supplementaryMaterials: array, qualityScore: number, artifacts: array }
 * @recommendedSkills SK-SS-011 (academic-writing-publication), SK-SS-014 (research-ethics-irb)
 * @recommendedAgents AG-SS-001 (quantitative-research-methodologist), AG-SS-002 (qualitative-research-specialist)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    researchProject = {},
    targetJournal = {},
    styleGuide = 'APA7',
    outputDir = 'manuscript-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Academic Manuscript Preparation process');

  // ============================================================================
  // PHASE 1: MANUSCRIPT PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 1: Planning manuscript structure');
  const manuscriptPlanning = await ctx.task(manuscriptPlanningTask, {
    researchProject,
    targetJournal,
    styleGuide,
    outputDir
  });

  artifacts.push(...manuscriptPlanning.artifacts);

  // ============================================================================
  // PHASE 2: INTRODUCTION WRITING
  // ============================================================================

  ctx.log('info', 'Phase 2: Writing introduction');
  const introduction = await ctx.task(introductionWritingTask, {
    researchProject,
    manuscriptPlanning,
    outputDir
  });

  artifacts.push(...introduction.artifacts);

  // ============================================================================
  // PHASE 3: METHOD SECTION
  // ============================================================================

  ctx.log('info', 'Phase 3: Writing method section');
  const methodSection = await ctx.task(methodSectionTask, {
    researchProject,
    styleGuide,
    outputDir
  });

  artifacts.push(...methodSection.artifacts);

  // ============================================================================
  // PHASE 4: RESULTS SECTION
  // ============================================================================

  ctx.log('info', 'Phase 4: Writing results section');
  const resultsSection = await ctx.task(resultsSectionTask, {
    researchProject,
    styleGuide,
    outputDir
  });

  artifacts.push(...resultsSection.artifacts);

  // ============================================================================
  // PHASE 5: DISCUSSION SECTION
  // ============================================================================

  ctx.log('info', 'Phase 5: Writing discussion');
  const discussionSection = await ctx.task(discussionSectionTask, {
    researchProject,
    resultsSection,
    outputDir
  });

  artifacts.push(...discussionSection.artifacts);

  // ============================================================================
  // PHASE 6: FORMATTING AND REFERENCES
  // ============================================================================

  ctx.log('info', 'Phase 6: Formatting manuscript');
  const formatting = await ctx.task(manuscriptFormattingTask, {
    introduction,
    methodSection,
    resultsSection,
    discussionSection,
    styleGuide,
    targetJournal,
    outputDir
  });

  artifacts.push(...formatting.artifacts);

  // ============================================================================
  // PHASE 7: QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Phase 7: Scoring manuscript quality');
  const qualityScore = await ctx.task(manuscriptQualityScoringTask, {
    manuscriptPlanning,
    introduction,
    methodSection,
    resultsSection,
    discussionSection,
    formatting,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const manuscriptScore = qualityScore.overallScore;
  const qualityMet = manuscriptScore >= 80;

  // Breakpoint: Review manuscript
  await ctx.breakpoint({
    question: `Manuscript preparation complete. Quality score: ${manuscriptScore}/100. ${qualityMet ? 'Manuscript meets quality standards!' : 'Manuscript may need refinement.'} Review and approve?`,
    title: 'Academic Manuscript Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        manuscriptScore,
        qualityMet,
        targetJournal: targetJournal.name,
        wordCount: formatting.wordCount,
        styleGuide
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    qualityScore: manuscriptScore,
    qualityMet,
    manuscript: {
      title: manuscriptPlanning.title,
      abstract: manuscriptPlanning.abstract,
      wordCount: formatting.wordCount,
      manuscriptPath: formatting.manuscriptPath
    },
    supplementaryMaterials: formatting.supplementaryMaterials,
    artifacts,
    duration,
    metadata: {
      processId: 'social-sciences/academic-manuscript-preparation',
      timestamp: startTime,
      styleGuide,
      outputDir
    }
  };
}

export const manuscriptPlanningTask = defineTask('manuscript-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan manuscript structure',
  agent: {
    name: 'manuscript-planner',
    prompt: {
      role: 'academic writing specialist',
      task: 'Plan manuscript structure and outline',
      context: args,
      instructions: [
        'Draft working title',
        'Draft abstract following journal guidelines',
        'Identify key contributions and novelty',
        'Outline introduction narrative',
        'Plan method section structure',
        'Plan results presentation',
        'Plan discussion themes',
        'Generate manuscript outline'
      ],
      outputFormat: 'JSON with title, abstract, contributions, outline, keyMessages, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['title', 'abstract', 'outline', 'artifacts'],
      properties: {
        title: { type: 'string' },
        abstract: { type: 'string' },
        contributions: { type: 'array', items: { type: 'string' } },
        outline: { type: 'object' },
        keyMessages: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'manuscript', 'planning']
}));

export const introductionWritingTask = defineTask('introduction-writing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write introduction',
  agent: {
    name: 'introduction-writer',
    prompt: {
      role: 'academic writer',
      task: 'Write introduction section',
      context: args,
      instructions: [
        'Open with compelling hook',
        'Establish significance of topic',
        'Review relevant literature',
        'Identify research gap',
        'State research questions/hypotheses',
        'Preview study approach',
        'State contributions',
        'Generate introduction section'
      ],
      outputFormat: 'JSON with introductionText, literatureReview, researchGap, hypotheses, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['introductionText', 'artifacts'],
      properties: {
        introductionText: { type: 'string' },
        literatureReview: { type: 'string' },
        researchGap: { type: 'string' },
        hypotheses: { type: 'array', items: { type: 'string' } },
        wordCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'manuscript', 'introduction']
}));

export const methodSectionTask = defineTask('method-section', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write method section',
  agent: {
    name: 'methods-writer',
    prompt: {
      role: 'academic methods writer',
      task: 'Write method section with appropriate detail',
      context: args,
      instructions: [
        'Describe participants/sample',
        'Describe measures/instruments',
        'Describe procedures',
        'Describe data analysis approach',
        'Follow reporting guidelines (CONSORT, STROBE, etc.)',
        'Address ethical considerations',
        'Include power analysis if applicable',
        'Generate method section'
      ],
      outputFormat: 'JSON with methodText, participants, measures, procedures, dataAnalysis, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['methodText', 'artifacts'],
      properties: {
        methodText: { type: 'string' },
        participants: { type: 'string' },
        measures: { type: 'string' },
        procedures: { type: 'string' },
        dataAnalysis: { type: 'string' },
        wordCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'manuscript', 'methods']
}));

export const resultsSectionTask = defineTask('results-section', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write results section',
  agent: {
    name: 'results-writer',
    prompt: {
      role: 'statistical results writer',
      task: 'Write results section with appropriate statistics',
      context: args,
      instructions: [
        'Present descriptive statistics',
        'Report preliminary analyses',
        'Present main analyses',
        'Report effect sizes and confidence intervals',
        'Create tables and figures',
        'Follow APA statistical reporting',
        'Present results objectively',
        'Generate results section'
      ],
      outputFormat: 'JSON with resultsText, tables, figures, statisticalReporting, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['resultsText', 'artifacts'],
      properties: {
        resultsText: { type: 'string' },
        tables: { type: 'array' },
        figures: { type: 'array' },
        statisticalReporting: { type: 'object' },
        wordCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'manuscript', 'results']
}));

export const discussionSectionTask = defineTask('discussion-section', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write discussion',
  agent: {
    name: 'discussion-writer',
    prompt: {
      role: 'academic discussion writer',
      task: 'Write discussion section',
      context: args,
      instructions: [
        'Summarize key findings',
        'Interpret findings in context of literature',
        'Discuss theoretical implications',
        'Discuss practical implications',
        'Acknowledge limitations',
        'Suggest future research directions',
        'Write compelling conclusion',
        'Generate discussion section'
      ],
      outputFormat: 'JSON with discussionText, keyFindings, implications, limitations, futureDirections, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['discussionText', 'artifacts'],
      properties: {
        discussionText: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        implications: { type: 'object' },
        limitations: { type: 'array', items: { type: 'string' } },
        futureDirections: { type: 'array', items: { type: 'string' } },
        wordCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'manuscript', 'discussion']
}));

export const manuscriptFormattingTask = defineTask('manuscript-formatting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Format manuscript',
  agent: {
    name: 'manuscript-formatter',
    prompt: {
      role: 'manuscript formatting specialist',
      task: 'Format complete manuscript',
      context: args,
      instructions: [
        'Compile all sections',
        'Format according to style guide',
        'Format references in correct style',
        'Format tables and figures',
        'Add title page',
        'Create supplementary materials',
        'Check word count against limits',
        'Generate final manuscript'
      ],
      outputFormat: 'JSON with manuscriptPath, wordCount, references, supplementaryMaterials, formattingChecklist, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['manuscriptPath', 'wordCount', 'artifacts'],
      properties: {
        manuscriptPath: { type: 'string' },
        wordCount: { type: 'number' },
        references: { type: 'number' },
        supplementaryMaterials: { type: 'array' },
        formattingChecklist: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'manuscript', 'formatting']
}));

export const manuscriptQualityScoringTask = defineTask('manuscript-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score manuscript quality',
  agent: {
    name: 'manuscript-reviewer',
    prompt: {
      role: 'academic peer reviewer',
      task: 'Assess manuscript quality',
      context: args,
      instructions: [
        'Evaluate planning and structure (weight: 10%)',
        'Assess introduction quality (weight: 20%)',
        'Evaluate method clarity (weight: 20%)',
        'Assess results presentation (weight: 20%)',
        'Evaluate discussion depth (weight: 20%)',
        'Assess formatting compliance (weight: 10%)',
        'Calculate weighted overall score (0-100)',
        'Identify areas for improvement'
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
  labels: ['agent', 'manuscript', 'quality-scoring']
}));
