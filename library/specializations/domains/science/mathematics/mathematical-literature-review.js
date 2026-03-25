/**
 * @process specializations/domains/science/mathematics/mathematical-literature-review
 * @description Conduct systematic literature review for mathematical research. Searches arXiv, MathSciNet,
 * and other databases to identify relevant prior work and open problems.
 * @inputs { researchTopic: string, searchScope?: string, dateRange?: object, databases?: array }
 * @outputs { success: boolean, relevantPapers: array, openProblems: array, annotatedBibliography: object, gaps: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/mathematics/mathematical-literature-review', {
 *   researchTopic: 'Stability analysis of neural network optimization algorithms',
 *   searchScope: 'convergence proofs and rate bounds',
 *   dateRange: { start: 2019, end: 2024 },
 *   databases: ['arXiv', 'MathSciNet', 'SIAM']
 * });
 *
 * @references
 * - arXiv: https://arxiv.org/
 * - MathSciNet: https://mathscinet.ams.org/
 * - zbMATH: https://zbmath.org/
 * - Google Scholar: https://scholar.google.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    researchTopic,
    searchScope = 'comprehensive',
    dateRange = { start: 2015, end: 2024 },
    databases = ['arXiv', 'MathSciNet']
  } = inputs;

  // Phase 1: Formulate Search Queries
  const queryFormulation = await ctx.task(queryFormulationTask, {
    researchTopic,
    searchScope,
    dateRange,
    databases
  });

  // Quality Gate: Queries must be formulated
  if (!queryFormulation.queries || queryFormulation.queries.length === 0) {
    return {
      success: false,
      error: 'Unable to formulate search queries',
      phase: 'query-formulation',
      relevantPapers: null
    };
  }

  // Breakpoint: Review search queries
  await ctx.breakpoint({
    question: `Formulated ${queryFormulation.queries.length} search queries across ${databases.length} databases. Proceed with search?`,
    title: 'Search Query Review',
    context: {
      runId: ctx.runId,
      researchTopic,
      queries: queryFormulation.queries,
      files: [{
        path: `artifacts/phase1-queries.json`,
        format: 'json',
        content: queryFormulation
      }]
    }
  });

  // Phase 2: Search Mathematical Databases
  const databaseSearch = await ctx.task(databaseSearchTask, {
    queries: queryFormulation.queries,
    databases,
    dateRange
  });

  // Phase 3: Categorize Relevant Papers
  const paperCategorization = await ctx.task(paperCategorizationTask, {
    searchResults: databaseSearch.results,
    researchTopic,
    searchScope
  });

  // Phase 4: Identify Gaps and Open Problems
  const gapIdentification = await ctx.task(gapIdentificationTask, {
    categorizedPapers: paperCategorization.papers,
    researchTopic
  });

  // Phase 5: Generate Annotated Bibliography
  const bibliographyGeneration = await ctx.task(bibliographyGenerationTask, {
    categorizedPapers: paperCategorization.papers,
    gaps: gapIdentification.gaps,
    openProblems: gapIdentification.openProblems,
    researchTopic
  });

  // Final Breakpoint: Review Complete
  await ctx.breakpoint({
    question: `Literature review complete. Found ${paperCategorization.papers.length} relevant papers and ${gapIdentification.openProblems.length} open problems. Review results?`,
    title: 'Literature Review Complete',
    context: {
      runId: ctx.runId,
      researchTopic,
      paperCount: paperCategorization.papers.length,
      openProblems: gapIdentification.openProblems,
      files: [
        { path: `artifacts/literature-review.json`, format: 'json', content: { paperCategorization, gapIdentification } },
        { path: `artifacts/bibliography.bib`, format: 'bibtex', content: bibliographyGeneration.bibtex }
      ]
    }
  });

  return {
    success: true,
    researchTopic,
    searchSummary: {
      queriesExecuted: queryFormulation.queries.length,
      databasesSearched: databases,
      dateRange,
      totalResults: databaseSearch.totalResults
    },
    relevantPapers: paperCategorization.papers,
    openProblems: gapIdentification.openProblems,
    annotatedBibliography: bibliographyGeneration.bibliography,
    gaps: gapIdentification.gaps,
    keyAuthors: paperCategorization.keyAuthors,
    metadata: {
      processId: 'specializations/domains/science/mathematics/mathematical-literature-review',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const queryFormulationTask = defineTask('query-formulation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Formulate Search Queries`,
  agent: {
    name: 'literature-reviewer',
    skills: ['arxiv-search-interface', 'scientific-literature-search', 'bibtex-reference-manager'],
    prompt: {
      role: 'Mathematical Literature Search Expert',
      task: 'Formulate effective search queries for mathematical databases',
      context: {
        researchTopic: args.researchTopic,
        searchScope: args.searchScope,
        dateRange: args.dateRange,
        databases: args.databases
      },
      instructions: [
        '1. Analyze the research topic for key concepts',
        '2. Identify relevant mathematical subject classifications (MSC)',
        '3. Generate primary keyword queries',
        '4. Generate author-based queries if known contributors',
        '5. Create Boolean query combinations',
        '6. Adapt queries for each database syntax',
        '7. Include synonyms and alternative terminology',
        '8. Consider related subfields',
        '9. Generate citation-based queries',
        '10. Document query strategy'
      ],
      outputFormat: 'JSON object with search queries'
    },
    outputSchema: {
      type: 'object',
      required: ['queries', 'mscCodes', 'keywords'],
      properties: {
        queries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              query: { type: 'string' },
              database: { type: 'string' },
              type: { type: 'string' },
              expected: { type: 'string' }
            }
          }
        },
        mscCodes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        keywords: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              keyword: { type: 'string' },
              synonyms: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        knownAuthors: { type: 'array', items: { type: 'string' } },
        relatedTopics: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'literature-review', 'search']
}));

export const databaseSearchTask = defineTask('database-search', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Search Mathematical Databases`,
  agent: {
    name: 'literature-reviewer',
    skills: ['arxiv-search-interface', 'scientific-literature-search', 'bibtex-reference-manager'],
    prompt: {
      role: 'Mathematical Database Search Specialist',
      task: 'Execute searches across mathematical databases',
      context: {
        queries: args.queries,
        databases: args.databases,
        dateRange: args.dateRange
      },
      instructions: [
        '1. Execute queries on each database',
        '2. Filter results by date range',
        '3. Remove duplicates across databases',
        '4. Rank results by relevance',
        '5. Identify highly cited papers',
        '6. Note survey and review papers',
        '7. Identify foundational papers',
        '8. Record citation counts',
        '9. Note access availability',
        '10. Document search results'
      ],
      outputFormat: 'JSON object with search results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'totalResults'],
      properties: {
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              authors: { type: 'array', items: { type: 'string' } },
              year: { type: 'number' },
              database: { type: 'string' },
              doi: { type: 'string' },
              arxivId: { type: 'string' },
              abstract: { type: 'string' },
              citations: { type: 'number' },
              relevanceScore: { type: 'number' }
            }
          }
        },
        totalResults: { type: 'number' },
        resultsByDatabase: { type: 'object' },
        highlyCited: { type: 'array', items: { type: 'string' } },
        surveyPapers: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'literature-review', 'database-search']
}));

export const paperCategorizationTask = defineTask('paper-categorization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Categorize Relevant Papers`,
  agent: {
    name: 'literature-reviewer',
    skills: ['arxiv-search-interface', 'scientific-literature-search', 'bibtex-reference-manager'],
    prompt: {
      role: 'Mathematical Research Categorization Expert',
      task: 'Categorize and prioritize relevant papers',
      context: {
        searchResults: args.searchResults,
        researchTopic: args.researchTopic,
        searchScope: args.searchScope
      },
      instructions: [
        '1. Assess relevance of each paper to research topic',
        '2. Categorize by methodology (theoretical, computational, applied)',
        '3. Identify foundational vs recent contributions',
        '4. Group by subtopic',
        '5. Identify key authors and research groups',
        '6. Note methodological innovations',
        '7. Identify conflicting results or approaches',
        '8. Prioritize papers for detailed reading',
        '9. Create reading order recommendation',
        '10. Document categorization rationale'
      ],
      outputFormat: 'JSON object with categorized papers'
    },
    outputSchema: {
      type: 'object',
      required: ['papers', 'categories', 'keyAuthors'],
      properties: {
        papers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              authors: { type: 'array', items: { type: 'string' } },
              year: { type: 'number' },
              category: { type: 'string' },
              relevance: { type: 'string', enum: ['high', 'medium', 'low'] },
              contribution: { type: 'string' },
              methodology: { type: 'string' },
              readingPriority: { type: 'number' }
            }
          }
        },
        categories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              paperCount: { type: 'number' },
              description: { type: 'string' }
            }
          }
        },
        keyAuthors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              affiliation: { type: 'string' },
              contributions: { type: 'number' }
            }
          }
        },
        foundationalPapers: { type: 'array', items: { type: 'string' } },
        readingOrder: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'literature-review', 'categorization']
}));

export const gapIdentificationTask = defineTask('gap-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Identify Gaps and Open Problems`,
  agent: {
    name: 'literature-reviewer',
    skills: ['arxiv-search-interface', 'scientific-literature-search', 'sympy-computer-algebra'],
    prompt: {
      role: 'Mathematical Research Gap Analyst',
      task: 'Identify research gaps and open problems in the literature',
      context: {
        categorizedPapers: args.categorizedPapers,
        researchTopic: args.researchTopic
      },
      instructions: [
        '1. Identify explicit open problems mentioned in papers',
        '2. Identify implicit gaps from missing results',
        '3. Find areas with limited coverage',
        '4. Identify methodological gaps',
        '5. Note unresolved conjectures',
        '6. Identify computational vs theoretical gaps',
        '7. Find opportunities for generalization',
        '8. Identify interdisciplinary opportunities',
        '9. Assess tractability of open problems',
        '10. Prioritize gaps by impact potential'
      ],
      outputFormat: 'JSON object with gaps and open problems'
    },
    outputSchema: {
      type: 'object',
      required: ['gaps', 'openProblems'],
      properties: {
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gap: { type: 'string' },
              type: { type: 'string' },
              evidence: { type: 'string' },
              importance: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        openProblems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              problem: { type: 'string' },
              source: { type: 'string' },
              difficulty: { type: 'string' },
              impact: { type: 'string' },
              relatedWork: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        conjectures: { type: 'array', items: { type: 'object' } },
        generalizationOpportunities: { type: 'array', items: { type: 'string' } },
        interdisciplinaryOpportunities: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'literature-review', 'gaps']
}));

export const bibliographyGenerationTask = defineTask('bibliography-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Generate Annotated Bibliography`,
  agent: {
    name: 'literature-reviewer',
    skills: ['bibtex-reference-manager', 'latex-math-formatter', 'arxiv-search-interface'],
    prompt: {
      role: 'Mathematical Bibliography Expert',
      task: 'Generate comprehensive annotated bibliography',
      context: {
        categorizedPapers: args.categorizedPapers,
        gaps: args.gaps,
        openProblems: args.openProblems,
        researchTopic: args.researchTopic
      },
      instructions: [
        '1. Generate BibTeX entries for all papers',
        '2. Write annotations summarizing each paper',
        '3. Note key contributions of each paper',
        '4. Indicate relevance to research topic',
        '5. Cross-reference related papers',
        '6. Create thematic groupings',
        '7. Note methodological details',
        '8. Include DOI and arXiv links',
        '9. Generate summary narrative',
        '10. Create citation network description'
      ],
      outputFormat: 'JSON object with annotated bibliography'
    },
    outputSchema: {
      type: 'object',
      required: ['bibliography', 'bibtex'],
      properties: {
        bibliography: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              citeKey: { type: 'string' },
              fullCitation: { type: 'string' },
              annotation: { type: 'string' },
              keyContributions: { type: 'array', items: { type: 'string' } },
              relevance: { type: 'string' },
              relatedPapers: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        bibtex: { type: 'string' },
        summaryNarrative: { type: 'string' },
        thematicGroups: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              theme: { type: 'string' },
              papers: { type: 'array', items: { type: 'string' } },
              summary: { type: 'string' }
            }
          }
        },
        citationNetwork: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'literature-review', 'bibliography']
}));
