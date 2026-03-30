/**
 * @process domains/science/scientific-discovery/literature-review-synthesis
 * @description Systematically search, evaluate, and synthesize existing research - Guides researchers through
 * comprehensive literature review following PRISMA guidelines, including search strategy, screening, quality
 * assessment, and synthesis of findings.
 * @inputs { researchQuestion: string, scope: object, databases?: array, dateRange?: object, inclusionCriteria?: array }
 * @outputs { success: boolean, searchStrategy: object, screeningResults: object, qualityAssessment: object, synthesis: object, gaps: array }
 *
 * @example
 * const result = await orchestrate('domains/science/scientific-discovery/literature-review-synthesis', {
 *   researchQuestion: 'What is the effectiveness of mindfulness interventions for anxiety?',
 *   scope: { type: 'systematic-review', focus: 'RCTs' },
 *   databases: ['PubMed', 'PsycINFO', 'Cochrane'],
 *   dateRange: { start: '2010', end: '2024' }
 * });
 *
 * @references
 * - Page, M.J. et al. (2021). PRISMA 2020 Statement
 * - Higgins, J.P.T. et al. (2019). Cochrane Handbook for Systematic Reviews
 * - Grant, M.J. & Booth, A. (2009). A typology of reviews
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    researchQuestion,
    scope = { type: 'systematic-review' },
    databases = ['PubMed', 'Scopus', 'Web of Science'],
    dateRange = {},
    inclusionCriteria = [],
    exclusionCriteria = [],
    outputDir = 'literature-review-output',
    minimumQualityScore = 80
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Literature Review for: ${researchQuestion}`);

  // ============================================================================
  // PHASE 1: REVIEW PROTOCOL DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 1: Developing review protocol');
  const reviewProtocol = await ctx.task(reviewProtocolTask, {
    researchQuestion,
    scope,
    databases,
    dateRange,
    inclusionCriteria,
    exclusionCriteria,
    outputDir
  });

  artifacts.push(...reviewProtocol.artifacts);

  // ============================================================================
  // PHASE 2: SEARCH STRATEGY DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Developing comprehensive search strategy');
  const searchStrategy = await ctx.task(searchStrategyTask, {
    researchQuestion,
    reviewProtocol,
    databases,
    outputDir
  });

  artifacts.push(...searchStrategy.artifacts);

  // Breakpoint: Review search strategy
  await ctx.breakpoint({
    question: `Search strategy developed with ${searchStrategy.searchStrings?.length || 0} database-specific queries. Total estimated results: ${searchStrategy.estimatedResults}. Review and approve before execution?`,
    title: 'Search Strategy Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        databases: databases.length,
        searchTerms: searchStrategy.keyTerms?.length || 0,
        estimatedResults: searchStrategy.estimatedResults
      }
    }
  });

  // ============================================================================
  // PHASE 3: TITLE/ABSTRACT SCREENING
  // ============================================================================

  ctx.log('info', 'Phase 3: Conducting title and abstract screening');
  const titleAbstractScreening = await ctx.task(titleAbstractScreeningTask, {
    searchStrategy,
    reviewProtocol,
    inclusionCriteria,
    exclusionCriteria,
    outputDir
  });

  artifacts.push(...titleAbstractScreening.artifacts);

  // ============================================================================
  // PHASE 4: FULL-TEXT SCREENING
  // ============================================================================

  ctx.log('info', 'Phase 4: Conducting full-text screening');
  const fullTextScreening = await ctx.task(fullTextScreeningTask, {
    titleAbstractScreening,
    reviewProtocol,
    inclusionCriteria,
    exclusionCriteria,
    outputDir
  });

  artifacts.push(...fullTextScreening.artifacts);

  // ============================================================================
  // PHASE 5: QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Assessing study quality');
  const qualityAssessment = await ctx.task(studyQualityAssessmentTask, {
    includedStudies: fullTextScreening.includedStudies,
    scope,
    outputDir
  });

  artifacts.push(...qualityAssessment.artifacts);

  // ============================================================================
  // PHASE 6: DATA EXTRACTION
  // ============================================================================

  ctx.log('info', 'Phase 6: Extracting data from included studies');
  const dataExtraction = await ctx.task(dataExtractionTask, {
    includedStudies: fullTextScreening.includedStudies,
    qualityAssessment,
    reviewProtocol,
    outputDir
  });

  artifacts.push(...dataExtraction.artifacts);

  // ============================================================================
  // PHASE 7: SYNTHESIS AND ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 7: Synthesizing findings');
  const synthesis = await ctx.task(synthesisFindingsTask, {
    dataExtraction,
    qualityAssessment,
    researchQuestion,
    scope,
    outputDir
  });

  artifacts.push(...synthesis.artifacts);

  // ============================================================================
  // PHASE 8: GAP IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Identifying research gaps');
  const gapAnalysis = await ctx.task(gapIdentificationTask, {
    synthesis,
    dataExtraction,
    researchQuestion,
    outputDir
  });

  artifacts.push(...gapAnalysis.artifacts);

  // ============================================================================
  // PHASE 9: PRISMA REPORTING
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating PRISMA-compliant report');
  const prismaReport = await ctx.task(prismaReportingTask, {
    reviewProtocol,
    searchStrategy,
    titleAbstractScreening,
    fullTextScreening,
    qualityAssessment,
    dataExtraction,
    synthesis,
    gapAnalysis,
    outputDir
  });

  artifacts.push(...prismaReport.artifacts);

  // ============================================================================
  // PHASE 10: QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Phase 10: Scoring review quality');
  const reviewQuality = await ctx.task(reviewQualityScoringTask, {
    reviewProtocol,
    searchStrategy,
    screeningResults: { titleAbstract: titleAbstractScreening, fullText: fullTextScreening },
    qualityAssessment,
    synthesis,
    prismaReport,
    minimumQualityScore,
    outputDir
  });

  artifacts.push(...reviewQuality.artifacts);

  const qualityMet = reviewQuality.overallScore >= minimumQualityScore;

  // Final breakpoint
  await ctx.breakpoint({
    question: `Literature review complete. ${fullTextScreening.includedCount} studies included. Quality score: ${reviewQuality.overallScore}/100. Approve final review?`,
    title: 'Literature Review Approval',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        studiesScreened: titleAbstractScreening.totalScreened,
        studiesIncluded: fullTextScreening.includedCount,
        qualityScore: reviewQuality.overallScore,
        qualityMet,
        gapsIdentified: gapAnalysis.gaps?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    researchQuestion,
    searchStrategy: {
      databases: searchStrategy.databases,
      keyTerms: searchStrategy.keyTerms,
      searchStrings: searchStrategy.searchStrings,
      totalResults: searchStrategy.estimatedResults
    },
    screeningResults: {
      titleAbstract: {
        screened: titleAbstractScreening.totalScreened,
        included: titleAbstractScreening.includedCount,
        excluded: titleAbstractScreening.excludedCount
      },
      fullText: {
        screened: fullTextScreening.totalScreened,
        included: fullTextScreening.includedCount,
        excluded: fullTextScreening.excludedCount,
        exclusionReasons: fullTextScreening.exclusionReasons
      }
    },
    qualityAssessment: {
      tool: qualityAssessment.assessmentTool,
      highQuality: qualityAssessment.highQualityCount,
      moderateQuality: qualityAssessment.moderateQualityCount,
      lowQuality: qualityAssessment.lowQualityCount,
      riskOfBias: qualityAssessment.riskOfBias
    },
    synthesis: {
      narrativeSynthesis: synthesis.narrativeSynthesis,
      keyFindings: synthesis.keyFindings,
      effectSizes: synthesis.effectSizes,
      heterogeneity: synthesis.heterogeneity,
      certaintyOfEvidence: synthesis.certaintyOfEvidence
    },
    gaps: gapAnalysis.gaps,
    futureDirections: gapAnalysis.futureDirections,
    reviewQuality: {
      overallScore: reviewQuality.overallScore,
      qualityMet,
      prismaCompliance: reviewQuality.prismaCompliance
    },
    artifacts,
    duration,
    metadata: {
      processId: 'domains/science/scientific-discovery/literature-review-synthesis',
      timestamp: startTime,
      scope: scope.type,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const reviewProtocolTask = defineTask('review-protocol', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop review protocol',
  skill: { name: 'statistical-test-selector' },
  agent: {
    name: 'research-analyst',
    skills: ['statistical-test-selector', 'hypothesis-generator'],
    prompt: {
      role: 'Systematic review methodologist',
      task: 'Develop a comprehensive review protocol following PRISMA-P guidelines',
      context: args,
      instructions: [
        'Define review objectives and research questions (PICO format if applicable)',
        'Specify eligibility criteria (inclusion and exclusion)',
        'Plan information sources and search strategy',
        'Define study selection process',
        'Plan data extraction approach',
        'Select quality assessment tools (RoB 2, ROBINS-I, etc.)',
        'Plan synthesis methods (narrative, meta-analysis)',
        'Address potential biases in review process',
        'Create protocol registration plan (PROSPERO)',
        'Document deviations handling procedures'
      ],
      outputFormat: 'JSON with objectives, eligibilityCriteria, informationSources, selectionProcess, dataExtractionPlan, qualityTools, synthesisMethod, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['objectives', 'eligibilityCriteria', 'artifacts'],
      properties: {
        objectives: { type: 'array', items: { type: 'string' } },
        picoFramework: {
          type: 'object',
          properties: {
            population: { type: 'string' },
            intervention: { type: 'string' },
            comparator: { type: 'string' },
            outcome: { type: 'string' }
          }
        },
        eligibilityCriteria: {
          type: 'object',
          properties: {
            inclusion: { type: 'array', items: { type: 'string' } },
            exclusion: { type: 'array', items: { type: 'string' } }
          }
        },
        informationSources: { type: 'array', items: { type: 'string' } },
        selectionProcess: { type: 'string' },
        dataExtractionPlan: { type: 'object' },
        qualityTools: { type: 'array', items: { type: 'string' } },
        synthesisMethod: { type: 'string' },
        registrationPlan: { type: 'string' },
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

export const searchStrategyTask = defineTask('search-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop comprehensive search strategy',
  skill: { name: 'statistical-test-selector' },
  agent: {
    name: 'research-analyst',
    skills: ['statistical-test-selector', 'hypothesis-generator'],
    prompt: {
      role: 'Information specialist and librarian',
      task: 'Develop comprehensive, reproducible search strategies for each database',
      context: args,
      instructions: [
        'Identify key concepts from research question',
        'Develop controlled vocabulary terms (MeSH, Emtree)',
        'Develop free-text search terms and synonyms',
        'Combine terms with Boolean operators',
        'Apply appropriate filters (date, language, study type)',
        'Adapt search syntax for each database',
        'Test and refine search strategy',
        'Document search strings for reproducibility',
        'Plan grey literature and hand searching',
        'Estimate number of results per database'
      ],
      outputFormat: 'JSON with databases, keyTerms, controlledVocabulary, searchStrings, filters, estimatedResults, greyLiteraturePlan, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['databases', 'keyTerms', 'searchStrings', 'estimatedResults', 'artifacts'],
      properties: {
        databases: { type: 'array', items: { type: 'string' } },
        keyTerms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              concept: { type: 'string' },
              terms: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        controlledVocabulary: { type: 'object' },
        searchStrings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              database: { type: 'string' },
              searchString: { type: 'string' }
            }
          }
        },
        filters: { type: 'array', items: { type: 'string' } },
        estimatedResults: { type: 'number' },
        greyLiteraturePlan: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'literature-review', 'search-strategy']
}));

export const titleAbstractScreeningTask = defineTask('title-abstract-screening', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct title and abstract screening',
  skill: { name: 'statistical-test-selector' },
  agent: {
    name: 'research-analyst',
    skills: ['statistical-test-selector', 'hypothesis-generator'],
    prompt: {
      role: 'Systematic reviewer',
      task: 'Screen titles and abstracts against eligibility criteria',
      context: args,
      instructions: [
        'Remove duplicate records',
        'Apply inclusion/exclusion criteria to titles and abstracts',
        'Use screening tool (Rayyan, Covidence, etc.)',
        'Document screening decisions and reasons',
        'Calculate inter-rater reliability if dual screening',
        'Resolve disagreements through discussion or third reviewer',
        'Track records through screening process',
        'Prepare list for full-text retrieval',
        'Document reasons for exclusion at this stage',
        'Generate PRISMA flow diagram data'
      ],
      outputFormat: 'JSON with totalScreened, duplicatesRemoved, includedCount, excludedCount, screeningDecisions, interRaterReliability, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalScreened', 'includedCount', 'excludedCount', 'artifacts'],
      properties: {
        totalScreened: { type: 'number' },
        duplicatesRemoved: { type: 'number' },
        includedCount: { type: 'number' },
        excludedCount: { type: 'number' },
        excludedByReason: { type: 'object' },
        interRaterReliability: { type: 'number' },
        disagreementsResolved: { type: 'number' },
        uncertainRecords: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'literature-review', 'screening']
}));

export const fullTextScreeningTask = defineTask('full-text-screening', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct full-text screening',
  skill: { name: 'statistical-test-selector' },
  agent: {
    name: 'research-analyst',
    skills: ['statistical-test-selector', 'hypothesis-generator'],
    prompt: {
      role: 'Systematic reviewer',
      task: 'Screen full-text articles against eligibility criteria',
      context: args,
      instructions: [
        'Retrieve full-text articles',
        'Apply detailed eligibility criteria',
        'Document reasons for exclusion with specificity',
        'Handle articles not retrievable',
        'Contact authors if needed for missing information',
        'Resolve disagreements between reviewers',
        'Finalize included studies list',
        'Check reference lists of included studies',
        'Check citing articles',
        'Update PRISMA flow diagram data'
      ],
      outputFormat: 'JSON with totalScreened, includedCount, excludedCount, exclusionReasons, includedStudies, notRetrievable, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['totalScreened', 'includedCount', 'excludedCount', 'includedStudies', 'artifacts'],
      properties: {
        totalScreened: { type: 'number' },
        includedCount: { type: 'number' },
        excludedCount: { type: 'number' },
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
        includedStudies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              citation: { type: 'string' },
              year: { type: 'number' }
            }
          }
        },
        notRetrievable: { type: 'number' },
        fromReferenceLists: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'literature-review', 'full-text-screening']
}));

export const studyQualityAssessmentTask = defineTask('study-quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess study quality',
  skill: { name: 'statistical-test-selector' },
  agent: {
    name: 'research-analyst',
    skills: ['statistical-test-selector', 'hypothesis-generator'],
    prompt: {
      role: 'Methodological quality assessor',
      task: 'Assess the quality and risk of bias of included studies',
      context: args,
      instructions: [
        'Select appropriate quality assessment tool',
        'For RCTs: Use Cochrane RoB 2 tool',
        'For observational studies: Use ROBINS-I or Newcastle-Ottawa',
        'For qualitative studies: Use CASP or JBI tools',
        'Assess each domain of the tool',
        'Provide overall risk of bias judgment',
        'Document supporting evidence for judgments',
        'Calculate inter-rater agreement',
        'Create risk of bias summary figure',
        'Categorize studies by quality level'
      ],
      outputFormat: 'JSON with assessmentTool, studyAssessments, highQualityCount, moderateQualityCount, lowQualityCount, riskOfBias, interRaterAgreement, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assessmentTool', 'highQualityCount', 'riskOfBias', 'artifacts'],
      properties: {
        assessmentTool: { type: 'string' },
        studyAssessments: { type: 'array' },
        highQualityCount: { type: 'number' },
        moderateQualityCount: { type: 'number' },
        lowQualityCount: { type: 'number' },
        riskOfBias: {
          type: 'object',
          properties: {
            low: { type: 'number' },
            someConcerns: { type: 'number' },
            high: { type: 'number' }
          }
        },
        interRaterAgreement: { type: 'number' },
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

export const dataExtractionTask = defineTask('data-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Extract data from included studies',
  skill: { name: 'statistical-test-selector' },
  agent: {
    name: 'research-analyst',
    skills: ['statistical-test-selector', 'hypothesis-generator'],
    prompt: {
      role: 'Data extraction specialist',
      task: 'Systematically extract relevant data from included studies',
      context: args,
      instructions: [
        'Design data extraction form',
        'Extract study characteristics (design, setting, participants)',
        'Extract intervention/exposure details',
        'Extract outcome data and results',
        'Extract effect sizes and confidence intervals',
        'Handle missing data appropriately',
        'Contact authors for missing information',
        'Verify extracted data through double extraction',
        'Resolve discrepancies in extraction',
        'Organize data for synthesis'
      ],
      outputFormat: 'JSON with extractionForm, studyCharacteristics, interventionData, outcomeData, effectSizes, missingData, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['studyCharacteristics', 'outcomeData', 'artifacts'],
      properties: {
        extractionForm: { type: 'object' },
        studyCharacteristics: { type: 'array' },
        interventionData: { type: 'array' },
        outcomeData: { type: 'array' },
        effectSizes: { type: 'array' },
        missingData: {
          type: 'object',
          properties: {
            count: { type: 'number' },
            handlingMethod: { type: 'string' }
          }
        },
        authorContacts: { type: 'number' },
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

export const synthesisFindingsTask = defineTask('synthesis-findings', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize findings',
  skill: { name: 'statistical-test-selector' },
  agent: {
    name: 'research-analyst',
    skills: ['statistical-test-selector', 'hypothesis-generator'],
    prompt: {
      role: 'Evidence synthesis specialist',
      task: 'Synthesize extracted data to answer the research question',
      context: args,
      instructions: [
        'Determine appropriate synthesis method',
        'For quantitative: Assess suitability for meta-analysis',
        'If meta-analysis: Select model (fixed/random effects)',
        'Calculate pooled effect sizes and confidence intervals',
        'Assess statistical heterogeneity (I-squared, Q statistic)',
        'Conduct subgroup analyses if planned',
        'Conduct sensitivity analyses',
        'For narrative synthesis: Use structured approach',
        'Assess certainty of evidence (GRADE)',
        'Present findings in summary of findings table'
      ],
      outputFormat: 'JSON with synthesisMethod, narrativeSynthesis, keyFindings, effectSizes, heterogeneity, subgroupAnalyses, certaintyOfEvidence, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['synthesisMethod', 'keyFindings', 'artifacts'],
      properties: {
        synthesisMethod: { type: 'string' },
        narrativeSynthesis: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        effectSizes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              outcome: { type: 'string' },
              pooledEffect: { type: 'string' },
              ci: { type: 'string' },
              studies: { type: 'number' }
            }
          }
        },
        heterogeneity: {
          type: 'object',
          properties: {
            iSquared: { type: 'number' },
            interpretation: { type: 'string' }
          }
        },
        subgroupAnalyses: { type: 'array' },
        sensitivityAnalyses: { type: 'array' },
        certaintyOfEvidence: { type: 'string' },
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

export const gapIdentificationTask = defineTask('gap-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify research gaps',
  skill: { name: 'statistical-test-selector' },
  agent: {
    name: 'research-analyst',
    skills: ['statistical-test-selector', 'hypothesis-generator'],
    prompt: {
      role: 'Research strategist',
      task: 'Identify gaps in the literature and directions for future research',
      context: args,
      instructions: [
        'Identify unanswered questions from the review',
        'Note methodological limitations across studies',
        'Identify understudied populations or settings',
        'Note gaps in outcome measurement',
        'Identify inconsistencies requiring resolution',
        'Suggest methodological improvements',
        'Prioritize research gaps by importance',
        'Recommend study designs for addressing gaps',
        'Consider practical and theoretical implications',
        'Formulate specific research recommendations'
      ],
      outputFormat: 'JSON with gaps, methodologicalLimitations, understudiedAreas, futureDirections, prioritizedRecommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['gaps', 'futureDirections', 'artifacts'],
      properties: {
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gap: { type: 'string' },
              type: { type: 'string' },
              priority: { type: 'string' }
            }
          }
        },
        methodologicalLimitations: { type: 'array', items: { type: 'string' } },
        understudiedAreas: { type: 'array', items: { type: 'string' } },
        futureDirections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              direction: { type: 'string' },
              suggestedDesign: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        prioritizedRecommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'literature-review', 'gap-analysis']
}));

export const prismaReportingTask = defineTask('prisma-reporting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate PRISMA-compliant report',
  skill: { name: 'statistical-test-selector' },
  agent: {
    name: 'research-analyst',
    skills: ['statistical-test-selector', 'hypothesis-generator'],
    prompt: {
      role: 'Systematic review reporting specialist',
      task: 'Generate comprehensive PRISMA-compliant systematic review report',
      context: args,
      instructions: [
        'Create PRISMA flow diagram with all numbers',
        'Write structured abstract (background, methods, results, conclusions)',
        'Document methods following PRISMA checklist',
        'Present results with forest plots if meta-analysis',
        'Include risk of bias figures',
        'Present summary of findings tables',
        'Write discussion addressing limitations',
        'Provide clear conclusions',
        'Complete PRISMA checklist',
        'Prepare supplementary materials'
      ],
      outputFormat: 'JSON with prismaFlowDiagram, abstract, methodsSection, resultsSection, discussionSection, conclusions, prismaChecklist, supplementaryMaterials, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['prismaFlowDiagram', 'prismaChecklist', 'artifacts'],
      properties: {
        prismaFlowDiagram: { type: 'object' },
        abstract: { type: 'string' },
        methodsSection: { type: 'string' },
        resultsSection: { type: 'string' },
        discussionSection: { type: 'string' },
        conclusions: { type: 'string' },
        prismaChecklist: {
          type: 'object',
          properties: {
            itemsCompleted: { type: 'number' },
            totalItems: { type: 'number' }
          }
        },
        supplementaryMaterials: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'literature-review', 'prisma-reporting']
}));

export const reviewQualityScoringTask = defineTask('review-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score review quality',
  skill: { name: 'statistical-test-selector' },
  agent: {
    name: 'research-analyst',
    skills: ['statistical-test-selector', 'hypothesis-generator'],
    prompt: {
      role: 'Systematic review methodologist and auditor',
      task: 'Assess the methodological quality of the systematic review',
      context: args,
      instructions: [
        'Assess search comprehensiveness (weight: 20%)',
        'Assess screening rigor (weight: 15%)',
        'Assess quality assessment adequacy (weight: 20%)',
        'Assess data extraction completeness (weight: 15%)',
        'Assess synthesis appropriateness (weight: 20%)',
        'Assess PRISMA compliance (weight: 10%)',
        'Calculate overall quality score',
        'Compare against AMSTAR 2 criteria',
        'Identify critical weaknesses',
        'Provide recommendations for improvement'
      ],
      outputFormat: 'JSON with overallScore, componentScores, prismaCompliance, amstar2Rating, criticalWeaknesses, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'prismaCompliance', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            searchComprehensiveness: { type: 'number' },
            screeningRigor: { type: 'number' },
            qualityAssessment: { type: 'number' },
            dataExtraction: { type: 'number' },
            synthesisAppropriateness: { type: 'number' },
            prismaCompliance: { type: 'number' }
          }
        },
        prismaCompliance: { type: 'number' },
        amstar2Rating: { type: 'string' },
        criticalWeaknesses: { type: 'array', items: { type: 'string' } },
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
