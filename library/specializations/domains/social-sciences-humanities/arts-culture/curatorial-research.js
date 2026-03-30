/**
 * @process arts-culture/curatorial-research
 * @description Methodology for conducting art historical research, primary source analysis, provenance research, and scholarly interpretation to inform exhibitions and publications
 * @inputs { researchTopic: string, researchType: string, artworkIds: array, publicationIntent: boolean }
 * @outputs { success: boolean, researchFindings: object, bibliography: array, provenanceReport: object, artifacts: array }
 * @recommendedSkills SK-AC-001 (curatorial-research), SK-AC-008 (interpretive-writing)
 * @recommendedAgents AG-AC-001 (curator-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    researchTopic,
    researchType = 'exhibition',
    artworkIds = [],
    publicationIntent = false,
    institutionName = '',
    outputDir = 'research-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Research Question Development
  ctx.log('info', 'Starting curatorial research: Developing research questions');
  const researchQuestions = await ctx.task(researchQuestionTask, {
    researchTopic,
    researchType,
    artworkIds,
    outputDir
  });

  if (!researchQuestions.success) {
    return {
      success: false,
      error: 'Research question development failed',
      details: researchQuestions,
      metadata: { processId: 'arts-culture/curatorial-research', timestamp: startTime }
    };
  }

  artifacts.push(...researchQuestions.artifacts);

  // Task 2: Literature Review
  ctx.log('info', 'Conducting literature review');
  const literatureReview = await ctx.task(literatureReviewTask, {
    researchTopic,
    researchQuestions: researchQuestions.questions,
    outputDir
  });

  artifacts.push(...literatureReview.artifacts);

  // Task 3: Primary Source Analysis
  ctx.log('info', 'Analyzing primary sources');
  const primarySourceAnalysis = await ctx.task(primarySourceTask, {
    researchTopic,
    artworkIds,
    researchQuestions: researchQuestions.questions,
    outputDir
  });

  artifacts.push(...primarySourceAnalysis.artifacts);

  // Task 4: Provenance Research
  ctx.log('info', 'Conducting provenance research');
  const provenanceResearch = await ctx.task(provenanceResearchTask, {
    artworkIds,
    institutionName,
    outputDir
  });

  artifacts.push(...provenanceResearch.artifacts);

  // Task 5: Visual Analysis
  ctx.log('info', 'Conducting visual and formal analysis');
  const visualAnalysis = await ctx.task(visualAnalysisTask, {
    artworkIds,
    researchTopic,
    outputDir
  });

  artifacts.push(...visualAnalysis.artifacts);

  // Task 6: Interpretive Synthesis
  ctx.log('info', 'Synthesizing interpretive findings');
  const interpretiveSynthesis = await ctx.task(interpretiveSynthesisTask, {
    researchQuestions,
    literatureReview,
    primarySourceAnalysis,
    provenanceResearch,
    visualAnalysis,
    outputDir
  });

  artifacts.push(...interpretiveSynthesis.artifacts);

  // Breakpoint: Review research findings
  await ctx.breakpoint({
    question: `Curatorial research on "${researchTopic}" complete. ${literatureReview.sourcesReviewed} sources reviewed, ${provenanceResearch.gapsIdentified} provenance gaps. Review findings?`,
    title: 'Curatorial Research Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        researchTopic,
        questionsAddressed: researchQuestions.questions.length,
        sourcesReviewed: literatureReview.sourcesReviewed,
        primarySources: primarySourceAnalysis.sourcesAnalyzed,
        provenanceGaps: provenanceResearch.gapsIdentified
      }
    }
  });

  // Task 7: Generate Research Documentation
  ctx.log('info', 'Generating research documentation');
  const documentation = await ctx.task(researchDocumentationTask, {
    researchTopic,
    researchType,
    publicationIntent,
    researchQuestions,
    literatureReview,
    primarySourceAnalysis,
    provenanceResearch,
    visualAnalysis,
    interpretiveSynthesis,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    researchFindings: {
      topic: researchTopic,
      questions: researchQuestions.questions,
      keyFindings: interpretiveSynthesis.keyFindings,
      interpretation: interpretiveSynthesis.interpretation
    },
    bibliography: literatureReview.bibliography,
    provenanceReport: provenanceResearch.report,
    artifacts,
    duration,
    metadata: {
      processId: 'arts-culture/curatorial-research',
      timestamp: startTime,
      researchType,
      outputDir
    }
  };
}

// Task 1: Research Question Development
export const researchQuestionTask = defineTask('research-questions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop research questions',
  agent: {
    name: 'research-curator',
    prompt: {
      role: 'curatorial researcher',
      task: 'Develop focused research questions for art historical inquiry',
      context: args,
      instructions: [
        'Analyze the research topic scope',
        'Identify gaps in existing scholarship',
        'Formulate primary research questions',
        'Develop secondary supporting questions',
        'Define methodological approach',
        'Identify key artists, movements, periods',
        'Establish research parameters and scope',
        'Create research plan document'
      ],
      outputFormat: 'JSON with success, questions, methodology, scope, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'questions', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              type: { type: 'string' },
              approach: { type: 'string' }
            }
          }
        },
        methodology: { type: 'string' },
        scope: { type: 'object' },
        researchPlan: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'research', 'curatorial', 'methodology']
}));

// Task 2: Literature Review
export const literatureReviewTask = defineTask('literature-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct literature review',
  agent: {
    name: 'art-historian',
    prompt: {
      role: 'art historian',
      task: 'Conduct comprehensive literature review of relevant scholarship',
      context: args,
      instructions: [
        'Search art historical databases and catalogs',
        'Review monographs and exhibition catalogs',
        'Analyze journal articles and essays',
        'Examine dissertations and theses',
        'Review archival finding aids',
        'Identify key scholarly debates',
        'Note historiographic trends',
        'Create annotated bibliography'
      ],
      outputFormat: 'JSON with sourcesReviewed, bibliography, keyDebates, gaps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['sourcesReviewed', 'bibliography', 'artifacts'],
      properties: {
        sourcesReviewed: { type: 'number' },
        bibliography: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              citation: { type: 'string' },
              type: { type: 'string' },
              annotation: { type: 'string' },
              relevance: { type: 'string' }
            }
          }
        },
        keyDebates: { type: 'array' },
        gaps: { type: 'array' },
        historiography: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'research', 'literature-review', 'art-history']
}));

// Task 3: Primary Source Analysis
export const primarySourceTask = defineTask('primary-source-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze primary sources',
  agent: {
    name: 'archival-researcher',
    prompt: {
      role: 'archival researcher',
      task: 'Identify and analyze primary source materials',
      context: args,
      instructions: [
        'Identify relevant archives and repositories',
        'Review artist correspondence and writings',
        'Analyze contemporary criticism and reviews',
        'Examine institutional records',
        'Study photographs and visual documentation',
        'Review sales records and inventories',
        'Transcribe and translate documents',
        'Document source citations and locations'
      ],
      outputFormat: 'JSON with sourcesAnalyzed, primarySources, transcriptions, insights, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['sourcesAnalyzed', 'primarySources', 'artifacts'],
      properties: {
        sourcesAnalyzed: { type: 'number' },
        primarySources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              repository: { type: 'string' },
              type: { type: 'string' },
              significance: { type: 'string' }
            }
          }
        },
        transcriptions: { type: 'array' },
        insights: { type: 'array' },
        archivalGaps: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'research', 'primary-sources', 'archives']
}));

// Task 4: Provenance Research
export const provenanceResearchTask = defineTask('provenance-research', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct provenance research',
  agent: {
    name: 'provenance-researcher',
    prompt: {
      role: 'provenance researcher',
      task: 'Research ownership history and provenance of artworks',
      context: args,
      instructions: [
        'Trace ownership from creation to present',
        'Research dealers and auction records',
        'Check Nazi-era provenance databases',
        'Review export and import documentation',
        'Identify provenance gaps',
        'Research collector histories',
        'Document exhibition history',
        'Flag potential restitution concerns'
      ],
      outputFormat: 'JSON with report, provenanceChains, gapsIdentified, flags, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['report', 'gapsIdentified', 'artifacts'],
      properties: {
        report: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            objectsResearched: { type: 'number' },
            completeProvenance: { type: 'number' }
          }
        },
        provenanceChains: { type: 'array' },
        gapsIdentified: { type: 'number' },
        gaps: { type: 'array' },
        flags: { type: 'array' },
        exhibitionHistory: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'research', 'provenance', 'ownership']
}));

// Task 5: Visual Analysis
export const visualAnalysisTask = defineTask('visual-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct visual and formal analysis',
  agent: {
    name: 'art-analyst',
    prompt: {
      role: 'art historian',
      task: 'Conduct visual and formal analysis of artworks',
      context: args,
      instructions: [
        'Analyze composition and structure',
        'Examine color, line, form, texture',
        'Study iconography and symbolism',
        'Compare with related works',
        'Identify stylistic characteristics',
        'Note technical observations',
        'Document condition observations',
        'Develop formal descriptions'
      ],
      outputFormat: 'JSON with analyses, comparisons, iconography, stylistic findings, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analyses', 'artifacts'],
      properties: {
        analyses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              objectId: { type: 'string' },
              formalAnalysis: { type: 'string' },
              iconography: { type: 'string' },
              style: { type: 'string' }
            }
          }
        },
        comparisons: { type: 'array' },
        iconographicThemes: { type: 'array' },
        stylisticFindings: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'research', 'visual-analysis', 'art-history']
}));

// Task 6: Interpretive Synthesis
export const interpretiveSynthesisTask = defineTask('interpretive-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize interpretive findings',
  agent: {
    name: 'senior-curator',
    prompt: {
      role: 'senior curator',
      task: 'Synthesize research findings into coherent interpretation',
      context: args,
      instructions: [
        'Integrate findings from all research strands',
        'Develop overarching interpretation',
        'Address research questions',
        'Identify new contributions to scholarship',
        'Note limitations and areas for further research',
        'Develop curatorial argument',
        'Create interpretive framework',
        'Draft key messages and themes'
      ],
      outputFormat: 'JSON with keyFindings, interpretation, argument, themes, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['keyFindings', 'interpretation', 'artifacts'],
      properties: {
        keyFindings: { type: 'array', items: { type: 'string' } },
        interpretation: { type: 'string' },
        curatorialArgument: { type: 'string' },
        themes: { type: 'array' },
        newContributions: { type: 'array' },
        furtherResearch: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'research', 'synthesis', 'interpretation']
}));

// Task 7: Research Documentation
export const researchDocumentationTask = defineTask('research-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate research documentation',
  agent: {
    name: 'research-writer',
    prompt: {
      role: 'scholarly writer',
      task: 'Compile comprehensive research documentation',
      context: args,
      instructions: [
        'Compile research report with all findings',
        'Format bibliography per Chicago Manual of Style',
        'Create appendices with primary sources',
        'Document provenance research results',
        'Include visual analysis documentation',
        'Prepare publication-ready text if needed',
        'Create research file for archives',
        'Generate executive summary'
      ],
      outputFormat: 'JSON with researchReport, bibliography, appendices, publicationDraft, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['researchReport', 'artifacts'],
      properties: {
        researchReport: { type: 'string' },
        bibliography: { type: 'string' },
        appendices: { type: 'array' },
        publicationDraft: { type: 'string' },
        archiveFile: { type: 'string' },
        executiveSummary: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'documentation', 'research', 'publication']
}));
