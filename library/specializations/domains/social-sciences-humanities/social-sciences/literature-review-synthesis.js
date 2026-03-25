/**
 * @process social-sciences/literature-review-synthesis
 * @description Conduct systematic literature reviews including search strategy development, quality assessment, evidence synthesis, and identification of research gaps
 * @inputs { researchTopic: string, researchQuestions: array, databases: array, outputDir: string }
 * @outputs { success: boolean, reviewFindings: object, evidenceSynthesis: object, researchGaps: array, qualityScore: number, artifacts: array }
 * @recommendedSkills SK-SS-008 (systematic-review), SK-SS-011 (academic-writing-publication)
 * @recommendedAgents AG-SS-006 (policy-research-analyst), AG-SS-008 (mixed-methods-research-coordinator)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    researchTopic,
    researchQuestions = [],
    databases = ['Web of Science', 'Scopus', 'PsycINFO'],
    outputDir = 'literature-review-output',
    reviewType = 'systematic'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Literature Review and Synthesis process');

  // ============================================================================
  // PHASE 1: PROTOCOL DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Developing review protocol');
  const protocolDevelopment = await ctx.task(reviewProtocolTask, {
    researchTopic,
    researchQuestions,
    reviewType,
    outputDir
  });

  artifacts.push(...protocolDevelopment.artifacts);

  // ============================================================================
  // PHASE 2: SEARCH STRATEGY
  // ============================================================================

  ctx.log('info', 'Phase 2: Developing search strategy');
  const searchStrategy = await ctx.task(searchStrategyTask, {
    researchTopic,
    researchQuestions,
    databases,
    outputDir
  });

  artifacts.push(...searchStrategy.artifacts);

  // ============================================================================
  // PHASE 3: STUDY SELECTION
  // ============================================================================

  ctx.log('info', 'Phase 3: Conducting study selection');
  const studySelection = await ctx.task(studySelectionTask, {
    searchStrategy,
    protocolDevelopment,
    outputDir
  });

  artifacts.push(...studySelection.artifacts);

  // ============================================================================
  // PHASE 4: QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Assessing study quality');
  const qualityAssessment = await ctx.task(studyQualityAssessmentTask, {
    studySelection,
    reviewType,
    outputDir
  });

  artifacts.push(...qualityAssessment.artifacts);

  // ============================================================================
  // PHASE 5: DATA EXTRACTION
  // ============================================================================

  ctx.log('info', 'Phase 5: Extracting data from studies');
  const dataExtraction = await ctx.task(dataExtractionTask, {
    studySelection,
    researchQuestions,
    outputDir
  });

  artifacts.push(...dataExtraction.artifacts);

  // ============================================================================
  // PHASE 6: EVIDENCE SYNTHESIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Synthesizing evidence');
  const evidenceSynthesis = await ctx.task(evidenceSynthesisTask, {
    dataExtraction,
    qualityAssessment,
    reviewType,
    outputDir
  });

  artifacts.push(...evidenceSynthesis.artifacts);

  // ============================================================================
  // PHASE 7: QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Phase 7: Scoring review quality');
  const qualityScore = await ctx.task(reviewQualityScoringTask, {
    protocolDevelopment,
    searchStrategy,
    studySelection,
    qualityAssessment,
    dataExtraction,
    evidenceSynthesis,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const reviewScore = qualityScore.overallScore;
  const qualityMet = reviewScore >= 80;

  // Breakpoint: Review literature review
  await ctx.breakpoint({
    question: `Literature review complete. Quality score: ${reviewScore}/100. ${qualityMet ? 'Review meets quality standards!' : 'Review may need refinement.'} Review and approve?`,
    title: 'Literature Review Assessment',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        reviewScore,
        qualityMet,
        studiesIncluded: studySelection.includedStudies,
        synthesisApproach: evidenceSynthesis.approach,
        researchGaps: evidenceSynthesis.researchGaps
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    qualityScore: reviewScore,
    qualityMet,
    reviewFindings: {
      studiesIncluded: studySelection.includedStudies,
      studiesExcluded: studySelection.excludedStudies,
      qualityRatings: qualityAssessment.ratings
    },
    evidenceSynthesis: {
      approach: evidenceSynthesis.approach,
      themes: evidenceSynthesis.themes,
      findings: evidenceSynthesis.findings
    },
    researchGaps: evidenceSynthesis.researchGaps,
    artifacts,
    duration,
    metadata: {
      processId: 'social-sciences/literature-review-synthesis',
      timestamp: startTime,
      reviewType,
      outputDir
    }
  };
}

// Task 1: Review Protocol
export const reviewProtocolTask = defineTask('review-protocol', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop review protocol',
  agent: {
    name: 'systematic-review-specialist',
    prompt: {
      role: 'systematic review methodologist',
      task: 'Develop comprehensive review protocol',
      context: args,
      instructions: [
        'Define review objectives and scope',
        'Specify inclusion and exclusion criteria',
        'Define PICO(S) elements if applicable',
        'Plan data extraction approach',
        'Plan quality assessment approach',
        'Plan synthesis approach (narrative, meta-analysis)',
        'Register protocol if appropriate (PROSPERO)',
        'Generate review protocol document'
      ],
      outputFormat: 'JSON with objectives, inclusionCriteria, exclusionCriteria, picos, synthesisApproach, protocolPath, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['objectives', 'inclusionCriteria', 'exclusionCriteria', 'artifacts'],
      properties: {
        objectives: { type: 'array', items: { type: 'string' } },
        inclusionCriteria: { type: 'array', items: { type: 'string' } },
        exclusionCriteria: { type: 'array', items: { type: 'string' } },
        picos: { type: 'object' },
        synthesisApproach: { type: 'string' },
        protocolPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'literature-review', 'protocol']
}));

// Task 2: Search Strategy
export const searchStrategyTask = defineTask('search-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop search strategy',
  agent: {
    name: 'search-strategist',
    prompt: {
      role: 'information specialist',
      task: 'Develop comprehensive search strategy',
      context: args,
      instructions: [
        'Identify key concepts and synonyms',
        'Develop Boolean search strings',
        'Adapt search strings for each database',
        'Plan supplementary search strategies',
        'Include grey literature if appropriate',
        'Plan citation searching (forward/backward)',
        'Document search dates and database versions',
        'Generate search strategy documentation'
      ],
      outputFormat: 'JSON with searchTerms, booleanStrings, databaseStrategies, supplementarySearches, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['searchTerms', 'booleanStrings', 'databaseStrategies', 'artifacts'],
      properties: {
        searchTerms: { type: 'object' },
        booleanStrings: { type: 'object' },
        databaseStrategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              database: { type: 'string' },
              searchString: { type: 'string' },
              resultsCount: { type: 'number' }
            }
          }
        },
        supplementarySearches: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'literature-review', 'search']
}));

// Task 3: Study Selection
export const studySelectionTask = defineTask('study-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct study selection',
  agent: {
    name: 'study-selector',
    prompt: {
      role: 'systematic review analyst',
      task: 'Screen and select studies for inclusion',
      context: args,
      instructions: [
        'Remove duplicates from search results',
        'Screen titles and abstracts against criteria',
        'Screen full texts of potentially relevant studies',
        'Apply inclusion/exclusion criteria systematically',
        'Document reasons for exclusion',
        'Resolve disagreements (if dual screening)',
        'Create PRISMA flow diagram',
        'Generate study selection report'
      ],
      outputFormat: 'JSON with includedStudies, excludedStudies, exclusionReasons, prismaFlow, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['includedStudies', 'excludedStudies', 'artifacts'],
      properties: {
        includedStudies: { type: 'number' },
        excludedStudies: { type: 'number' },
        exclusionReasons: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              reason: { type: 'string' },
              count: { type: 'number' }
            }
          }
        },
        prismaFlow: { type: 'string' },
        studyList: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'literature-review', 'selection']
}));

// Task 4: Study Quality Assessment
export const studyQualityAssessmentTask = defineTask('study-quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess study quality',
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'research quality assessment specialist',
      task: 'Assess quality/risk of bias in included studies',
      context: args,
      instructions: [
        'Select appropriate quality assessment tool',
        'For RCTs: use Cochrane Risk of Bias tool',
        'For observational: use Newcastle-Ottawa Scale',
        'For qualitative: use CASP or JBI tools',
        'Apply tool consistently across studies',
        'Summarize quality ratings',
        'Consider quality in synthesis weighting',
        'Generate quality assessment report'
      ],
      outputFormat: 'JSON with tool, ratings, qualitySummary, highQualityStudies, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['tool', 'ratings', 'artifacts'],
      properties: {
        tool: { type: 'string' },
        ratings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              study: { type: 'string' },
              rating: { type: 'string' },
              domains: { type: 'object' }
            }
          }
        },
        qualitySummary: { type: 'object' },
        highQualityStudies: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'literature-review', 'quality-assessment']
}));

// Task 5: Data Extraction
export const dataExtractionTask = defineTask('data-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Extract data from studies',
  agent: {
    name: 'data-extractor',
    prompt: {
      role: 'systematic review data extractor',
      task: 'Extract relevant data from included studies',
      context: args,
      instructions: [
        'Develop data extraction form',
        'Extract study characteristics (design, sample, etc.)',
        'Extract key findings relevant to research questions',
        'Extract effect sizes and statistical information',
        'Note methodological features',
        'Identify missing data',
        'Create evidence tables',
        'Generate data extraction documentation'
      ],
      outputFormat: 'JSON with extractionForm, studyCharacteristics, findings, evidenceTables, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['studyCharacteristics', 'findings', 'artifacts'],
      properties: {
        extractionForm: { type: 'string' },
        studyCharacteristics: { type: 'array' },
        findings: { type: 'array' },
        effectSizes: { type: 'array' },
        evidenceTables: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'literature-review', 'data-extraction']
}));

// Task 6: Evidence Synthesis
export const evidenceSynthesisTask = defineTask('evidence-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize evidence',
  agent: {
    name: 'evidence-synthesizer',
    prompt: {
      role: 'evidence synthesis specialist',
      task: 'Synthesize evidence from included studies',
      context: args,
      instructions: [
        'Determine appropriate synthesis method',
        'For quantitative: consider meta-analysis if appropriate',
        'For qualitative: use thematic or framework synthesis',
        'Identify consistent patterns across studies',
        'Note inconsistencies and explain variation',
        'Assess strength of evidence (GRADE if appropriate)',
        'Identify research gaps',
        'Generate synthesis report'
      ],
      outputFormat: 'JSON with approach, themes, findings, strengthOfEvidence, researchGaps, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['approach', 'findings', 'researchGaps', 'artifacts'],
      properties: {
        approach: { type: 'string' },
        themes: { type: 'array', items: { type: 'string' } },
        findings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              finding: { type: 'string' },
              supportingStudies: { type: 'number' },
              strengthOfEvidence: { type: 'string' }
            }
          }
        },
        inconsistencies: { type: 'array', items: { type: 'string' } },
        strengthOfEvidence: { type: 'object' },
        researchGaps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'literature-review', 'synthesis']
}));

// Task 7: Quality Scoring
export const reviewQualityScoringTask = defineTask('review-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score review quality',
  agent: {
    name: 'review-quality-assessor',
    prompt: {
      role: 'systematic review methodologist',
      task: 'Assess systematic review quality',
      context: args,
      instructions: [
        'Evaluate protocol completeness (weight: 10%)',
        'Assess search strategy comprehensiveness (weight: 20%)',
        'Evaluate study selection rigor (weight: 15%)',
        'Assess quality assessment thoroughness (weight: 15%)',
        'Evaluate data extraction completeness (weight: 15%)',
        'Assess synthesis appropriateness (weight: 25%)',
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
            protocol: { type: 'number' },
            searchStrategy: { type: 'number' },
            studySelection: { type: 'number' },
            qualityAssessment: { type: 'number' },
            dataExtraction: { type: 'number' },
            synthesis: { type: 'number' }
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
  labels: ['agent', 'literature-review', 'quality-scoring']
}));
