/**
 * @process domains/business/knowledge-management/search-optimization
 * @description Optimize knowledge base search through metadata, tagging, synonyms, and search tuning to improve knowledge discovery
 * @specialization Knowledge Management
 * @category Knowledge Base Development
 * @inputs { knowledgeBaseName: string, searchPlatform: string, contentInventory: array, userSearchData: object, currentSearchConfig: object, outputDir: string }
 * @outputs { success: boolean, searchConfig: object, optimizations: array, qualityScore: number, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    knowledgeBaseName = '',
    searchPlatform = 'elasticsearch',
    contentInventory = [],
    userSearchData = {},
    currentSearchConfig = {},
    taxonomyStructure = {},
    targetMetrics = {
      relevanceScore: 80,
      findabilityRate: 85,
      zeroResultsRate: 5
    },
    searchFeatures = {
      autocomplete: true,
      synonyms: true,
      facetedSearch: true,
      spellingCorrection: true,
      relatedContent: true
    },
    outputDir = 'search-optimization-output',
    requireApproval = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Search Optimization and Findability Process');

  // ============================================================================
  // PHASE 1: SEARCH ANALYTICS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing search analytics and user behavior');
  const searchAnalysis = await ctx.task(searchAnalysisTask, {
    knowledgeBaseName,
    userSearchData,
    contentInventory,
    currentSearchConfig,
    outputDir
  });

  artifacts.push(...searchAnalysis.artifacts);

  // Breakpoint: Review search analysis
  await ctx.breakpoint({
    question: `Search analysis complete. Found ${searchAnalysis.searchPatterns.length} patterns and ${searchAnalysis.issues.length} issues. Review analysis?`,
    title: 'Search Analysis Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        totalQueries: searchAnalysis.totalQueries,
        uniqueQueries: searchAnalysis.uniqueQueries,
        zeroResultsRate: searchAnalysis.zeroResultsRate,
        topSearchTerms: searchAnalysis.topSearchTerms.slice(0, 5)
      }
    }
  });

  // ============================================================================
  // PHASE 2: CONTENT INDEXING AUDIT
  // ============================================================================

  ctx.log('info', 'Phase 2: Auditing content indexing and coverage');
  const indexingAudit = await ctx.task(indexingAuditTask, {
    knowledgeBaseName,
    searchPlatform,
    contentInventory,
    currentSearchConfig,
    outputDir
  });

  artifacts.push(...indexingAudit.artifacts);

  // ============================================================================
  // PHASE 3: METADATA OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Optimizing content metadata for search');
  const metadataOptimization = await ctx.task(metadataOptimizationTask, {
    knowledgeBaseName,
    contentInventory,
    searchAnalysis,
    taxonomyStructure,
    outputDir
  });

  artifacts.push(...metadataOptimization.artifacts);

  // ============================================================================
  // PHASE 4: SYNONYM AND TERMINOLOGY MANAGEMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Building synonym dictionary and terminology mapping');
  const synonymManagement = await ctx.task(synonymManagementTask, {
    knowledgeBaseName,
    searchAnalysis,
    taxonomyStructure,
    contentInventory,
    outputDir
  });

  artifacts.push(...synonymManagement.artifacts);

  // Breakpoint: Review synonym dictionary
  await ctx.breakpoint({
    question: `Synonym dictionary created with ${synonymManagement.synonymGroups.length} groups and ${synonymManagement.totalSynonyms} synonyms. Review dictionary?`,
    title: 'Synonym Dictionary Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        synonymGroups: synonymManagement.synonymGroups.length,
        totalSynonyms: synonymManagement.totalSynonyms,
        abbreviations: synonymManagement.abbreviations.length,
        misspellings: synonymManagement.commonMisspellings.length
      }
    }
  });

  // ============================================================================
  // PHASE 5: SEARCH RANKING OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Optimizing search ranking and relevance');
  const rankingOptimization = await ctx.task(rankingOptimizationTask, {
    knowledgeBaseName,
    searchPlatform,
    searchAnalysis,
    contentInventory,
    currentSearchConfig,
    outputDir
  });

  artifacts.push(...rankingOptimization.artifacts);

  // ============================================================================
  // PHASE 6: AUTOCOMPLETE AND SUGGESTIONS
  // ============================================================================

  let autocompleteConfig = null;
  if (searchFeatures.autocomplete) {
    ctx.log('info', 'Phase 6: Configuring autocomplete and search suggestions');
    autocompleteConfig = await ctx.task(autocompleteConfigTask, {
      knowledgeBaseName,
      searchPlatform,
      searchAnalysis,
      taxonomyStructure,
      outputDir
    });

    artifacts.push(...autocompleteConfig.artifacts);
  }

  // ============================================================================
  // PHASE 7: FACETED SEARCH DESIGN
  // ============================================================================

  let facetedSearchConfig = null;
  if (searchFeatures.facetedSearch) {
    ctx.log('info', 'Phase 7: Designing faceted search and filters');
    facetedSearchConfig = await ctx.task(facetedSearchTask, {
      knowledgeBaseName,
      taxonomyStructure,
      contentInventory,
      searchAnalysis,
      outputDir
    });

    artifacts.push(...facetedSearchConfig.artifacts);
  }

  // ============================================================================
  // PHASE 8: ZERO RESULTS HANDLING
  // ============================================================================

  ctx.log('info', 'Phase 8: Designing zero results handling strategy');
  const zeroResultsStrategy = await ctx.task(zeroResultsStrategyTask, {
    knowledgeBaseName,
    searchAnalysis,
    synonymManagement,
    contentInventory,
    outputDir
  });

  artifacts.push(...zeroResultsStrategy.artifacts);

  // ============================================================================
  // PHASE 9: SEARCH RESULTS UI/UX OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Optimizing search results presentation');
  const resultsUxOptimization = await ctx.task(resultsUxOptimizationTask, {
    knowledgeBaseName,
    searchAnalysis,
    facetedSearchConfig,
    outputDir
  });

  artifacts.push(...resultsUxOptimization.artifacts);

  // ============================================================================
  // PHASE 10: RELATED CONTENT RECOMMENDATIONS
  // ============================================================================

  let relatedContentConfig = null;
  if (searchFeatures.relatedContent) {
    ctx.log('info', 'Phase 10: Configuring related content recommendations');
    relatedContentConfig = await ctx.task(relatedContentTask, {
      knowledgeBaseName,
      contentInventory,
      taxonomyStructure,
      searchAnalysis,
      outputDir
    });

    artifacts.push(...relatedContentConfig.artifacts);
  }

  // ============================================================================
  // PHASE 11: SEARCH CONFIGURATION COMPILATION
  // ============================================================================

  ctx.log('info', 'Phase 11: Compiling comprehensive search configuration');
  const searchConfigCompilation = await ctx.task(searchConfigCompilationTask, {
    knowledgeBaseName,
    searchPlatform,
    metadataOptimization,
    synonymManagement,
    rankingOptimization,
    autocompleteConfig,
    facetedSearchConfig,
    zeroResultsStrategy,
    relatedContentConfig,
    outputDir
  });

  artifacts.push(...searchConfigCompilation.artifacts);

  // ============================================================================
  // PHASE 12: SEARCH QUALITY TESTING
  // ============================================================================

  ctx.log('info', 'Phase 12: Testing search quality and relevance');
  const searchQualityTest = await ctx.task(searchQualityTestTask, {
    knowledgeBaseName,
    searchConfig: searchConfigCompilation.config,
    searchAnalysis,
    targetMetrics,
    outputDir
  });

  artifacts.push(...searchQualityTest.artifacts);

  const qualityMet = searchQualityTest.overallScore >= targetMetrics.relevanceScore;

  // Breakpoint: Review search quality test
  await ctx.breakpoint({
    question: `Search quality score: ${searchQualityTest.overallScore}/100. ${qualityMet ? 'Quality targets met!' : 'May need improvements.'} Review results?`,
    title: 'Search Quality Test Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        qualityScore: searchQualityTest.overallScore,
        qualityMet,
        relevanceScore: searchQualityTest.componentScores.relevance,
        findabilityRate: searchQualityTest.componentScores.findability,
        testCasesPassed: searchQualityTest.testCasesPassed
      }
    }
  });

  // ============================================================================
  // PHASE 13: SEARCH ANALYTICS SETUP
  // ============================================================================

  ctx.log('info', 'Phase 13: Setting up search analytics and monitoring');
  const analyticsSetup = await ctx.task(analyticsSetupTask, {
    knowledgeBaseName,
    searchPlatform,
    targetMetrics,
    outputDir
  });

  artifacts.push(...analyticsSetup.artifacts);

  // ============================================================================
  // PHASE 14: IMPLEMENTATION PLAN
  // ============================================================================

  ctx.log('info', 'Phase 14: Creating search optimization implementation plan');
  const implementationPlan = await ctx.task(implementationPlanTask, {
    knowledgeBaseName,
    searchPlatform,
    searchConfigCompilation,
    currentSearchConfig,
    outputDir
  });

  artifacts.push(...implementationPlan.artifacts);

  // ============================================================================
  // PHASE 15: STAKEHOLDER REVIEW (IF REQUIRED)
  // ============================================================================

  let reviewResult = null;
  if (requireApproval) {
    ctx.log('info', 'Phase 15: Conducting stakeholder review');
    reviewResult = await ctx.task(stakeholderReviewTask, {
      knowledgeBaseName,
      searchConfigCompilation,
      searchQualityTest,
      implementationPlan,
      outputDir
    });

    artifacts.push(...reviewResult.artifacts);

    // Breakpoint: Final approval gate
    await ctx.breakpoint({
      question: `Stakeholder review complete. ${reviewResult.approved ? 'Approved!' : 'Requires revisions.'} Proceed with implementation?`,
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
          qualityScore: searchQualityTest.overallScore,
          stakeholdersReviewed: reviewResult.stakeholders.length,
          revisionsNeeded: reviewResult.revisionsNeeded
        }
      }
    });
  }

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    knowledgeBaseName,
    searchConfig: searchConfigCompilation.config,
    optimizations: {
      metadata: metadataOptimization.optimizations,
      synonyms: synonymManagement.synonymGroups,
      ranking: rankingOptimization.rankingFactors,
      autocomplete: autocompleteConfig?.configuration,
      facets: facetedSearchConfig?.facets,
      zeroResults: zeroResultsStrategy.strategies
    },
    qualityScore: searchQualityTest.overallScore,
    statistics: {
      synonymGroupsCreated: synonymManagement.synonymGroups.length,
      metadataFieldsOptimized: metadataOptimization.fieldsOptimized,
      facetsConfigured: facetedSearchConfig?.facets.length || 0,
      testCasesPassed: searchQualityTest.testCasesPassed,
      expectedImprovements: searchQualityTest.expectedImprovements
    },
    analytics: {
      metricsTracked: analyticsSetup.metrics,
      dashboards: analyticsSetup.dashboards,
      alertsConfigured: analyticsSetup.alerts
    },
    implementation: {
      phases: implementationPlan.phases,
      timeline: implementationPlan.timeline,
      risks: implementationPlan.risks
    },
    approved: reviewResult ? reviewResult.approved : true,
    artifacts,
    duration,
    metadata: {
      processId: 'domains/business/knowledge-management/search-optimization',
      timestamp: startTime,
      outputDir,
      searchPlatform
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Search Analysis
export const searchAnalysisTask = defineTask('search-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze search analytics and user behavior',
  agent: {
    name: 'search-analyst',
    prompt: {
      role: 'search analytics specialist',
      task: 'Analyze search behavior and identify optimization opportunities',
      context: args,
      instructions: [
        'Analyze search query patterns:',
        '  - Top search terms and frequency',
        '  - Query length distribution',
        '  - Query type classification (navigational, informational)',
        '  - Temporal patterns (peak times, trends)',
        'Analyze search performance:',
        '  - Click-through rates',
        '  - Zero results rate',
        '  - Search refinement patterns',
        '  - Time to first click',
        '  - Search abandonment rate',
        'Identify search behavior patterns:',
        '  - Common search journeys',
        '  - Filter and facet usage',
        '  - Pagination patterns',
        '  - Mobile vs desktop behavior',
        'Identify search issues:',
        '  - High-frequency zero result queries',
        '  - Low click-through queries',
        '  - Frequently refined queries',
        '  - Mismatched expectations',
        'Prioritize optimization opportunities',
        'Save search analysis to output directory'
      ],
      outputFormat: 'JSON with searchPatterns (array), issues (array), totalQueries (number), uniqueQueries (number), zeroResultsRate (number), topSearchTerms (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['searchPatterns', 'issues', 'totalQueries', 'topSearchTerms', 'artifacts'],
      properties: {
        searchPatterns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              frequency: { type: 'number' },
              type: { type: 'string' },
              performance: { type: 'string', enum: ['excellent', 'good', 'fair', 'poor'] }
            }
          }
        },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              frequency: { type: 'number' },
              recommendation: { type: 'string' }
            }
          }
        },
        totalQueries: { type: 'number' },
        uniqueQueries: { type: 'number' },
        zeroResultsRate: { type: 'number' },
        topSearchTerms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              term: { type: 'string' },
              count: { type: 'number' },
              clickThrough: { type: 'number' }
            }
          }
        },
        queryTypeDistribution: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'search', 'analytics']
}));

// Task 2: Indexing Audit
export const indexingAuditTask = defineTask('indexing-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Audit content indexing and coverage',
  agent: {
    name: 'indexing-auditor',
    prompt: {
      role: 'search indexing specialist',
      task: 'Audit content indexing configuration and coverage',
      context: args,
      instructions: [
        'Audit index configuration:',
        '  - Index schema and mappings',
        '  - Field types and analyzers',
        '  - Index settings and parameters',
        '  - Shard and replica configuration',
        'Assess content coverage:',
        '  - Indexed vs total content',
        '  - Missing or incomplete content',
        '  - Stale content in index',
        '  - Indexing lag and freshness',
        'Evaluate field configuration:',
        '  - Searchable fields',
        '  - Boosted fields',
        '  - Facetable fields',
        '  - Stored vs indexed fields',
        'Identify indexing issues:',
        '  - Configuration problems',
        '  - Performance bottlenecks',
        '  - Inconsistencies',
        'Provide optimization recommendations',
        'Save indexing audit to output directory'
      ],
      outputFormat: 'JSON with indexConfig (object), coverageMetrics (object), issues (array), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['indexConfig', 'coverageMetrics', 'artifacts'],
      properties: {
        indexConfig: {
          type: 'object',
          properties: {
            indexName: { type: 'string' },
            documentCount: { type: 'number' },
            schema: { type: 'object' },
            analyzers: { type: 'array', items: { type: 'string' } }
          }
        },
        coverageMetrics: {
          type: 'object',
          properties: {
            totalContent: { type: 'number' },
            indexedContent: { type: 'number' },
            coveragePercentage: { type: 'number' },
            staleContent: { type: 'number' }
          }
        },
        fieldAnalysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              field: { type: 'string' },
              type: { type: 'string' },
              searchable: { type: 'boolean' },
              boost: { type: 'number' },
              recommendation: { type: 'string' }
            }
          }
        },
        issues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'search', 'indexing']
}));

// Task 3: Metadata Optimization
export const metadataOptimizationTask = defineTask('metadata-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Optimize content metadata for search',
  agent: {
    name: 'metadata-optimizer',
    prompt: {
      role: 'metadata and SEO specialist',
      task: 'Optimize content metadata to improve search findability',
      context: args,
      instructions: [
        'Analyze current metadata quality:',
        '  - Title optimization',
        '  - Description completeness',
        '  - Keyword coverage',
        '  - Tag consistency',
        'Optimize metadata fields:',
        '  - Title: Clear, descriptive, keyword-rich',
        '  - Description: Summarize content, include key terms',
        '  - Keywords: Relevant, comprehensive, consistent',
        '  - Tags: Aligned with taxonomy, consistent tagging',
        'Create metadata guidelines:',
        '  - Title format and length',
        '  - Description best practices',
        '  - Keyword selection criteria',
        '  - Tagging standards',
        'Identify metadata gaps:',
        '  - Missing required fields',
        '  - Inconsistent formatting',
        '  - Poor quality metadata',
        'Create metadata improvement plan',
        'Save metadata optimization to output directory'
      ],
      outputFormat: 'JSON with optimizations (array), fieldsOptimized (number), guidelines (object), gaps (array), improvementPlan (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizations', 'fieldsOptimized', 'guidelines', 'artifacts'],
      properties: {
        optimizations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              field: { type: 'string' },
              currentState: { type: 'string' },
              optimization: { type: 'string' },
              expectedImpact: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        fieldsOptimized: { type: 'number' },
        guidelines: {
          type: 'object',
          properties: {
            title: { type: 'object' },
            description: { type: 'object' },
            keywords: { type: 'object' },
            tags: { type: 'object' }
          }
        },
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              contentId: { type: 'string' },
              missingFields: { type: 'array', items: { type: 'string' } },
              priority: { type: 'string' }
            }
          }
        },
        improvementPlan: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'search', 'metadata']
}));

// Task 4: Synonym Management
export const synonymManagementTask = defineTask('synonym-management', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Build synonym dictionary and terminology mapping',
  agent: {
    name: 'terminology-specialist',
    prompt: {
      role: 'terminology and linguistics specialist',
      task: 'Create comprehensive synonym dictionary for search optimization',
      context: args,
      instructions: [
        'Build synonym groups:',
        '  - Product names and variations',
        '  - Technical terms and plain language',
        '  - Industry jargon and common terms',
        '  - Regional variations',
        'Create abbreviation mappings:',
        '  - Acronyms to full forms',
        '  - Common abbreviations',
        '  - Product/feature abbreviations',
        'Map common misspellings:',
        '  - Frequently misspelled terms',
        '  - Typo patterns',
        '  - Phonetic variations',
        'Create terminology hierarchy:',
        '  - Preferred terms',
        '  - Acceptable alternatives',
        '  - Deprecated terms',
        'Define synonym expansion rules:',
        '  - One-way vs two-way synonyms',
        '  - Stemming and lemmatization',
        '  - Phrase synonyms',
        'Save synonym dictionary to output directory'
      ],
      outputFormat: 'JSON with synonymGroups (array), totalSynonyms (number), abbreviations (array), commonMisspellings (array), expansionRules (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['synonymGroups', 'totalSynonyms', 'abbreviations', 'artifacts'],
      properties: {
        synonymGroups: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              preferredTerm: { type: 'string' },
              synonyms: { type: 'array', items: { type: 'string' } },
              type: { type: 'string', enum: ['one-way', 'two-way'] },
              category: { type: 'string' }
            }
          }
        },
        totalSynonyms: { type: 'number' },
        abbreviations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              abbreviation: { type: 'string' },
              fullForm: { type: 'string' }
            }
          }
        },
        commonMisspellings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              correct: { type: 'string' },
              misspellings: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        expansionRules: {
          type: 'object',
          properties: {
            stemming: { type: 'boolean' },
            phraseSynonyms: { type: 'boolean' },
            fuzzyMatching: { type: 'boolean' }
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
  labels: ['agent', 'search', 'synonyms']
}));

// Task 5: Ranking Optimization
export const rankingOptimizationTask = defineTask('ranking-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Optimize search ranking and relevance',
  agent: {
    name: 'ranking-optimizer',
    prompt: {
      role: 'search ranking specialist',
      task: 'Optimize search result ranking for maximum relevance',
      context: args,
      instructions: [
        'Define ranking factors:',
        '  - Text relevance (TF-IDF, BM25)',
        '  - Field boosting (title, description, content)',
        '  - Recency boost',
        '  - Popularity signals (views, ratings)',
        '  - Content quality signals',
        'Configure field boosting:',
        '  - Title field (highest boost)',
        '  - Description/summary field',
        '  - Tags and keywords',
        '  - Body content',
        'Design re-ranking strategy:',
        '  - Business rules for promotion',
        '  - Freshness considerations',
        '  - Personalization factors',
        '  - Click-through optimization',
        'Handle special cases:',
        '  - Exact match boosting',
        '  - Phrase matching',
        '  - Partial matches',
        'Create ranking configuration',
        'Save ranking optimization to output directory'
      ],
      outputFormat: 'JSON with rankingFactors (array), fieldBoosts (array), rerankingStrategy (object), configuration (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['rankingFactors', 'fieldBoosts', 'configuration', 'artifacts'],
      properties: {
        rankingFactors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              factor: { type: 'string' },
              weight: { type: 'number' },
              description: { type: 'string' }
            }
          }
        },
        fieldBoosts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              field: { type: 'string' },
              boost: { type: 'number' },
              rationale: { type: 'string' }
            }
          }
        },
        rerankingStrategy: {
          type: 'object',
          properties: {
            businessRules: { type: 'array' },
            freshnessBoost: { type: 'object' },
            popularitySignals: { type: 'array', items: { type: 'string' } }
          }
        },
        configuration: {
          type: 'object',
          properties: {
            algorithm: { type: 'string' },
            parameters: { type: 'object' }
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
  labels: ['agent', 'search', 'ranking']
}));

// Task 6: Autocomplete Configuration
export const autocompleteConfigTask = defineTask('autocomplete-config', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure autocomplete and search suggestions',
  agent: {
    name: 'autocomplete-designer',
    prompt: {
      role: 'search UX specialist',
      task: 'Design and configure autocomplete and search suggestions',
      context: args,
      instructions: [
        'Design autocomplete behavior:',
        '  - Trigger threshold (characters)',
        '  - Response time requirements',
        '  - Maximum suggestions shown',
        '  - Suggestion types (queries, content, categories)',
        'Configure suggestion sources:',
        '  - Popular queries',
        '  - Content titles',
        '  - Tags and categories',
        '  - Recent searches',
        'Design suggestion ranking:',
        '  - Popularity-based ranking',
        '  - Relevance scoring',
        '  - Personalization (if applicable)',
        'Handle edge cases:',
        '  - Partial matches',
        '  - Typo tolerance',
        '  - Multi-word queries',
        'Design visual presentation:',
        '  - Suggestion grouping',
        '  - Highlighting matches',
        '  - Category indicators',
        'Save autocomplete configuration to output directory'
      ],
      outputFormat: 'JSON with configuration (object), suggestionSources (array), rankingRules (array), visualDesign (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['configuration', 'suggestionSources', 'artifacts'],
      properties: {
        configuration: {
          type: 'object',
          properties: {
            triggerCharacters: { type: 'number' },
            maxSuggestions: { type: 'number' },
            responseTime: { type: 'number' },
            debounceMs: { type: 'number' }
          }
        },
        suggestionSources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              priority: { type: 'number' },
              maxResults: { type: 'number' }
            }
          }
        },
        rankingRules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rule: { type: 'string' },
              weight: { type: 'number' }
            }
          }
        },
        visualDesign: {
          type: 'object',
          properties: {
            grouping: { type: 'string' },
            highlighting: { type: 'boolean' },
            categoryIndicators: { type: 'boolean' }
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
  labels: ['agent', 'search', 'autocomplete']
}));

// Task 7: Faceted Search
export const facetedSearchTask = defineTask('faceted-search', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design faceted search and filters',
  agent: {
    name: 'facet-designer',
    prompt: {
      role: 'information architecture specialist',
      task: 'Design faceted search and filtering capabilities',
      context: args,
      instructions: [
        'Define search facets:',
        '  - Content type facet',
        '  - Category/topic facet',
        '  - Date/time facet',
        '  - Author/owner facet',
        '  - Audience/user type facet',
        '  - Tag facets',
        'Configure facet behavior:',
        '  - Single vs multi-select',
        '  - Hierarchical facets',
        '  - Dynamic facet counts',
        '  - Facet ordering',
        'Design facet presentation:',
        '  - Sidebar vs top filters',
        '  - Expandable/collapsible sections',
        '  - Show more/less patterns',
        '  - Applied filters display',
        'Handle facet combinations:',
        '  - AND vs OR logic',
        '  - Cross-facet dependencies',
        '  - Empty facet handling',
        'Plan facet analytics',
        'Save faceted search design to output directory'
      ],
      outputFormat: 'JSON with facets (array), behavior (object), presentation (object), combinationLogic (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['facets', 'behavior', 'artifacts'],
      properties: {
        facets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              field: { type: 'string' },
              type: { type: 'string', enum: ['single', 'multi', 'range', 'hierarchical'] },
              values: { type: 'array' },
              displayOrder: { type: 'number' },
              defaultExpanded: { type: 'boolean' }
            }
          }
        },
        behavior: {
          type: 'object',
          properties: {
            dynamicCounts: { type: 'boolean' },
            zeroCountHandling: { type: 'string' },
            defaultLogic: { type: 'string', enum: ['AND', 'OR'] }
          }
        },
        presentation: {
          type: 'object',
          properties: {
            layout: { type: 'string' },
            maxVisibleValues: { type: 'number' },
            appliedFiltersDisplay: { type: 'string' }
          }
        },
        combinationLogic: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'search', 'facets']
}));

// Task 8: Zero Results Strategy
export const zeroResultsStrategyTask = defineTask('zero-results-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design zero results handling strategy',
  agent: {
    name: 'zero-results-designer',
    prompt: {
      role: 'search UX specialist',
      task: 'Design comprehensive zero results handling strategy',
      context: args,
      instructions: [
        'Analyze zero results patterns:',
        '  - Common zero result queries',
        '  - Root causes (misspelling, no content, technical)',
        '  - User intent analysis',
        'Design recovery strategies:',
        '  - Spelling suggestions ("Did you mean...")',
        '  - Query relaxation (remove terms)',
        '  - Synonym expansion',
        '  - Alternative suggestions',
        'Create helpful zero results page:',
        '  - Clear messaging',
        '  - Search tips and help',
        '  - Popular/trending content',
        '  - Browse categories option',
        '  - Contact support option',
        'Implement feedback collection:',
        '  - Report missing content',
        '  - Suggest content creation',
        '  - Track for content gaps',
        'Design proactive prevention:',
        '  - Autocomplete guidance',
        '  - Query validation',
        'Save zero results strategy to output directory'
      ],
      outputFormat: 'JSON with strategies (array), zeroResultsPage (object), feedbackMechanism (object), preventionMeasures (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'zeroResultsPage', 'artifacts'],
      properties: {
        strategies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              strategy: { type: 'string' },
              trigger: { type: 'string' },
              implementation: { type: 'string' },
              priority: { type: 'number' }
            }
          }
        },
        zeroResultsPage: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            elements: { type: 'array', items: { type: 'string' } },
            layout: { type: 'string' }
          }
        },
        feedbackMechanism: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            options: { type: 'array', items: { type: 'string' } },
            tracking: { type: 'boolean' }
          }
        },
        preventionMeasures: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'search', 'zero-results']
}));

// Task 9: Results UX Optimization
export const resultsUxOptimizationTask = defineTask('results-ux-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Optimize search results presentation',
  agent: {
    name: 'results-ux-designer',
    prompt: {
      role: 'search results UX designer',
      task: 'Optimize search results page presentation and usability',
      context: args,
      instructions: [
        'Design result card layout:',
        '  - Title prominence',
        '  - Description/snippet display',
        '  - Metadata display (date, author, type)',
        '  - Thumbnail/icon usage',
        '  - Quick actions',
        'Optimize snippet generation:',
        '  - Keyword highlighting',
        '  - Context window size',
        '  - Multiple snippet support',
        'Design sorting options:',
        '  - Relevance (default)',
        '  - Date (newest/oldest)',
        '  - Popularity',
        '  - Custom sorting',
        'Configure pagination:',
        '  - Results per page',
        '  - Infinite scroll vs pages',
        '  - Load more patterns',
        'Design mobile experience:',
        '  - Responsive layout',
        '  - Touch-friendly interactions',
        '  - Compact view options',
        'Save results UX design to output directory'
      ],
      outputFormat: 'JSON with resultCardDesign (object), snippetConfig (object), sortingOptions (array), pagination (object), mobileDesign (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['resultCardDesign', 'snippetConfig', 'artifacts'],
      properties: {
        resultCardDesign: {
          type: 'object',
          properties: {
            layout: { type: 'string' },
            elements: { type: 'array', items: { type: 'string' } },
            maxTitleLength: { type: 'number' },
            maxDescriptionLength: { type: 'number' }
          }
        },
        snippetConfig: {
          type: 'object',
          properties: {
            highlightEnabled: { type: 'boolean' },
            contextWords: { type: 'number' },
            maxSnippets: { type: 'number' }
          }
        },
        sortingOptions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              field: { type: 'string' },
              default: { type: 'boolean' }
            }
          }
        },
        pagination: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['pages', 'infinite', 'load-more'] },
            resultsPerPage: { type: 'number' },
            maxPages: { type: 'number' }
          }
        },
        mobileDesign: {
          type: 'object',
          properties: {
            layout: { type: 'string' },
            touchTargetSize: { type: 'number' }
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
  labels: ['agent', 'search', 'results-ux']
}));

// Task 10: Related Content
export const relatedContentTask = defineTask('related-content', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure related content recommendations',
  agent: {
    name: 'recommendation-designer',
    prompt: {
      role: 'content recommendation specialist',
      task: 'Design related content recommendation system',
      context: args,
      instructions: [
        'Define relatedness signals:',
        '  - Topic/category similarity',
        '  - Tag overlap',
        '  - Content linkage',
        '  - User co-viewing patterns',
        '  - Semantic similarity',
        'Design recommendation algorithm:',
        '  - Content-based filtering',
        '  - Collaborative filtering',
        '  - Hybrid approach',
        'Configure recommendation placement:',
        '  - Article sidebar',
        '  - Article footer',
        '  - Search results enhancement',
        '  - Homepage widgets',
        'Define recommendation rules:',
        '  - Same category preference',
        '  - Cross-category discovery',
        '  - Recency considerations',
        '  - Diversity requirements',
        'Plan recommendation analytics',
        'Save related content configuration to output directory'
      ],
      outputFormat: 'JSON with signals (array), algorithm (object), placement (array), rules (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['signals', 'algorithm', 'placement', 'artifacts'],
      properties: {
        signals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              signal: { type: 'string' },
              weight: { type: 'number' },
              description: { type: 'string' }
            }
          }
        },
        algorithm: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            parameters: { type: 'object' }
          }
        },
        placement: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              location: { type: 'string' },
              maxItems: { type: 'number' },
              displayType: { type: 'string' }
            }
          }
        },
        rules: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rule: { type: 'string' },
              priority: { type: 'number' }
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
  labels: ['agent', 'search', 'recommendations']
}));

// Task 11: Search Config Compilation
export const searchConfigCompilationTask = defineTask('search-config-compilation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compile comprehensive search configuration',
  agent: {
    name: 'search-architect',
    prompt: {
      role: 'search architecture specialist',
      task: 'Compile all search optimizations into comprehensive configuration',
      context: args,
      instructions: [
        'Compile all search configurations:',
        '  - Index configuration',
        '  - Metadata settings',
        '  - Synonym dictionary',
        '  - Ranking configuration',
        '  - Autocomplete settings',
        '  - Facet configuration',
        '  - Zero results handling',
        '  - Related content settings',
        'Create unified configuration document',
        'Validate configuration consistency',
        'Identify dependencies and conflicts',
        'Create configuration versioning',
        'Generate deployment artifacts',
        'Document configuration changes from baseline',
        'Save compiled configuration to output directory'
      ],
      outputFormat: 'JSON with config (object), changes (array), dependencies (array), deploymentArtifacts (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['config', 'changes', 'artifacts'],
      properties: {
        config: {
          type: 'object',
          properties: {
            version: { type: 'string' },
            platform: { type: 'string' },
            indexSettings: { type: 'object' },
            synonyms: { type: 'object' },
            ranking: { type: 'object' },
            autocomplete: { type: 'object' },
            facets: { type: 'object' },
            zeroResults: { type: 'object' },
            relatedContent: { type: 'object' }
          }
        },
        changes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              component: { type: 'string' },
              change: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        dependencies: { type: 'array', items: { type: 'string' } },
        deploymentArtifacts: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'search', 'configuration']
}));

// Task 12: Search Quality Test
export const searchQualityTestTask = defineTask('search-quality-test', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Test search quality and relevance',
  agent: {
    name: 'search-quality-tester',
    prompt: {
      role: 'search quality analyst',
      task: 'Evaluate search quality and measure improvement potential',
      context: args,
      instructions: [
        'Design search quality test cases:',
        '  - Common query scenarios',
        '  - Edge cases and variations',
        '  - Zero result queries',
        '  - Misspelling recovery',
        'Evaluate search relevance:',
        '  - Top-10 relevance for key queries',
        '  - Mean reciprocal rank (MRR)',
        '  - Normalized discounted cumulative gain (NDCG)',
        'Test findability:',
        '  - Can users find target content?',
        '  - Clicks required to find content',
        '  - Alternative path success',
        'Test search features:',
        '  - Autocomplete accuracy',
        '  - Facet functionality',
        '  - Synonym expansion',
        '  - Related content quality',
        'Calculate overall quality score',
        'Identify areas for improvement',
        'Estimate expected improvements',
        'Save quality test results to output directory'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), componentScores (object), testCases (array), testCasesPassed (number), expectedImprovements (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'testCasesPassed', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            relevance: { type: 'number' },
            findability: { type: 'number' },
            autocomplete: { type: 'number' },
            facets: { type: 'number' },
            synonyms: { type: 'number' }
          }
        },
        testCases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              query: { type: 'string' },
              expectedResult: { type: 'string' },
              actualResult: { type: 'string' },
              passed: { type: 'boolean' },
              notes: { type: 'string' }
            }
          }
        },
        testCasesPassed: { type: 'number' },
        expectedImprovements: {
          type: 'object',
          properties: {
            relevanceImprovement: { type: 'number' },
            zeroResultsReduction: { type: 'number' },
            clickThroughImprovement: { type: 'number' }
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
  labels: ['agent', 'search', 'quality-testing']
}));

// Task 13: Analytics Setup
export const analyticsSetupTask = defineTask('analytics-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up search analytics and monitoring',
  agent: {
    name: 'analytics-designer',
    prompt: {
      role: 'search analytics specialist',
      task: 'Design search analytics and monitoring framework',
      context: args,
      instructions: [
        'Define search metrics to track:',
        '  - Query volume and trends',
        '  - Zero results rate',
        '  - Click-through rate',
        '  - Search refinement rate',
        '  - Time to first click',
        '  - Search abandonment rate',
        'Design analytics dashboards:',
        '  - Executive overview',
        '  - Query performance',
        '  - Content findability',
        '  - User behavior',
        'Configure alerts and notifications:',
        '  - Zero results spike',
        '  - Performance degradation',
        '  - Anomaly detection',
        'Plan reporting cadence:',
        '  - Daily operational reports',
        '  - Weekly performance summaries',
        '  - Monthly trend analysis',
        'Design A/B testing framework',
        'Save analytics setup to output directory'
      ],
      outputFormat: 'JSON with metrics (array), dashboards (array), alerts (array), reporting (object), abTestingFramework (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'dashboards', 'alerts', 'artifacts'],
      properties: {
        metrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              calculation: { type: 'string' },
              target: { type: 'string' }
            }
          }
        },
        dashboards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              audience: { type: 'string' },
              metrics: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        alerts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              condition: { type: 'string' },
              threshold: { type: 'string' },
              notification: { type: 'string' }
            }
          }
        },
        reporting: {
          type: 'object',
          properties: {
            daily: { type: 'array', items: { type: 'string' } },
            weekly: { type: 'array', items: { type: 'string' } },
            monthly: { type: 'array', items: { type: 'string' } }
          }
        },
        abTestingFramework: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'search', 'analytics']
}));

// Task 14: Implementation Plan
export const implementationPlanTask = defineTask('implementation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create search optimization implementation plan',
  agent: {
    name: 'implementation-planner',
    prompt: {
      role: 'search implementation specialist',
      task: 'Create detailed implementation plan for search optimizations',
      context: args,
      instructions: [
        'Plan implementation phases:',
        '  - Phase 1: Foundation (index, synonyms)',
        '  - Phase 2: Ranking and relevance',
        '  - Phase 3: UX enhancements',
        '  - Phase 4: Analytics and monitoring',
        'Define implementation tasks:',
        '  - Configuration changes',
        '  - Code deployments',
        '  - Content updates',
        '  - Testing activities',
        'Identify risks and mitigations:',
        '  - Performance impact',
        '  - User disruption',
        '  - Rollback requirements',
        'Plan testing and validation:',
        '  - Unit testing',
        '  - Integration testing',
        '  - User acceptance testing',
        '  - A/B testing',
        'Create timeline and milestones',
        'Define success criteria',
        'Save implementation plan to output directory'
      ],
      outputFormat: 'JSON with phases (array), timeline (object), risks (array), testingPlan (object), successCriteria (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['phases', 'timeline', 'risks', 'artifacts'],
      properties: {
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'number' },
              name: { type: 'string' },
              tasks: { type: 'array', items: { type: 'string' } },
              duration: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        timeline: {
          type: 'object',
          properties: {
            startDate: { type: 'string' },
            endDate: { type: 'string' },
            milestones: { type: 'array' }
          }
        },
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              risk: { type: 'string' },
              likelihood: { type: 'string' },
              impact: { type: 'string' },
              mitigation: { type: 'string' }
            }
          }
        },
        testingPlan: {
          type: 'object',
          properties: {
            unitTesting: { type: 'string' },
            integrationTesting: { type: 'string' },
            uat: { type: 'string' },
            abTesting: { type: 'string' }
          }
        },
        successCriteria: { type: 'array', items: { type: 'string' } },
        rollbackPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'search', 'implementation']
}));

// Task 15: Stakeholder Review
export const stakeholderReviewTask = defineTask('stakeholder-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct stakeholder review',
  agent: {
    name: 'project-manager',
    prompt: {
      role: 'project manager facilitating stakeholder review',
      task: 'Coordinate stakeholder review and approval of search optimizations',
      context: args,
      instructions: [
        'Present search optimization plan:',
        '  - Current search issues',
        '  - Proposed optimizations',
        '  - Expected improvements',
        '  - Implementation timeline',
        '  - Resource requirements',
        'Gather feedback from stakeholders:',
        '  - Search/platform team',
        '  - Content team',
        '  - UX team',
        '  - Business stakeholders',
        'Validate alignment with goals',
        'Review technical feasibility',
        'Identify concerns and objections',
        'Determine if revisions needed',
        'Document approval or changes',
        'Create action plan',
        'Save stakeholder review to output directory'
      ],
      outputFormat: 'JSON with approved (boolean), stakeholders (array), feedback (array), revisionsNeeded (boolean), actionItems (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['approved', 'stakeholders', 'feedback', 'artifacts'],
      properties: {
        approved: { type: 'boolean' },
        stakeholders: { type: 'array', items: { type: 'string' } },
        feedback: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholder: { type: 'string' },
              comment: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
              category: { type: 'string' }
            }
          }
        },
        revisionsNeeded: { type: 'boolean' },
        actionItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              item: { type: 'string' },
              priority: { type: 'string' },
              owner: { type: 'string' }
            }
          }
        },
        approvalConditions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'search', 'stakeholder-review', 'approval']
}));
