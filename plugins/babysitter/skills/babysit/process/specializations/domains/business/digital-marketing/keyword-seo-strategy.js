/**
 * @process digital-marketing/keyword-seo-strategy
 * @description Process for conducting comprehensive keyword research and developing an SEO content strategy to capture organic search opportunities and build topical authority
 * @inputs { businessPriorities: object, seedKeywords: array, competitiveLandscape: object, outputDir: string }
 * @outputs { success: boolean, keywordDatabase: object, contentGapAnalysis: object, topicClusterMap: object, prioritizedContentRoadmap: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    businessPriorities = {},
    seedKeywords = [],
    competitiveLandscape = {},
    outputDir = 'keyword-seo-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Keyword Research and SEO Content Strategy process');

  // Task 1: Define Seed Keywords and Topics
  ctx.log('info', 'Phase 1: Defining seed keywords and topics');
  const seedDefinition = await ctx.task(seedKeywordsTask, {
    businessPriorities,
    seedKeywords,
    outputDir
  });
  artifacts.push(...seedDefinition.artifacts);

  // Task 2: Conduct Keyword Research and Expansion
  ctx.log('info', 'Phase 2: Conducting keyword research and expansion');
  const keywordResearch = await ctx.task(keywordResearchExpansionTask, {
    seedDefinition,
    outputDir
  });
  artifacts.push(...keywordResearch.artifacts);

  // Task 3: Analyze Search Intent and SERP Features
  ctx.log('info', 'Phase 3: Analyzing search intent and SERP features');
  const intentAnalysis = await ctx.task(searchIntentAnalysisTask, {
    keywordResearch,
    outputDir
  });
  artifacts.push(...intentAnalysis.artifacts);

  // Task 4: Assess Keyword Difficulty and Opportunity
  ctx.log('info', 'Phase 4: Assessing keyword difficulty and opportunity');
  const difficultyAssessment = await ctx.task(difficultyAssessmentTask, {
    keywordResearch,
    intentAnalysis,
    outputDir
  });
  artifacts.push(...difficultyAssessment.artifacts);

  // Task 5: Perform Competitive Gap Analysis
  ctx.log('info', 'Phase 5: Performing competitive gap analysis');
  const competitiveGap = await ctx.task(competitiveGapAnalysisTask, {
    keywordResearch,
    competitiveLandscape,
    outputDir
  });
  artifacts.push(...competitiveGap.artifacts);

  // Task 6: Map Keywords to Existing Content
  ctx.log('info', 'Phase 6: Mapping keywords to existing content');
  const keywordMapping = await ctx.task(keywordMappingTask, {
    keywordResearch,
    outputDir
  });
  artifacts.push(...keywordMapping.artifacts);

  // Task 7: Identify Content Gaps and Opportunities
  ctx.log('info', 'Phase 7: Identifying content gaps and opportunities');
  const contentGaps = await ctx.task(contentGapIdentificationTask, {
    keywordMapping,
    competitiveGap,
    outputDir
  });
  artifacts.push(...contentGaps.artifacts);

  // Task 8: Develop Topic Cluster Strategy
  ctx.log('info', 'Phase 8: Developing topic cluster strategy');
  const topicClusters = await ctx.task(topicClusterStrategyTask, {
    keywordResearch,
    contentGaps,
    intentAnalysis,
    outputDir
  });
  artifacts.push(...topicClusters.artifacts);

  // Breakpoint: Review keyword strategy
  await ctx.breakpoint({
    question: `Keyword research complete. ${keywordResearch.totalKeywords} keywords identified with ${topicClusters.clusterCount} topic clusters. Review strategy?`,
    title: 'Keyword Strategy Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        totalKeywords: keywordResearch.totalKeywords,
        topicClusters: topicClusters.clusterCount,
        contentGaps: contentGaps.gapCount,
        highOpportunityKeywords: difficultyAssessment.highOpportunityCount
      }
    }
  });

  // Task 9: Prioritize Keywords by Business Value
  ctx.log('info', 'Phase 9: Prioritizing keywords by business value');
  const keywordPrioritization = await ctx.task(keywordPrioritizationTask, {
    keywordResearch,
    difficultyAssessment,
    businessPriorities,
    outputDir
  });
  artifacts.push(...keywordPrioritization.artifacts);

  // Task 10: Create Content Briefs
  ctx.log('info', 'Phase 10: Creating content briefs for priority topics');
  const contentBriefs = await ctx.task(contentBriefsTask, {
    keywordPrioritization,
    topicClusters,
    intentAnalysis,
    outputDir
  });
  artifacts.push(...contentBriefs.artifacts);

  // Task 11: Set Up Ranking Tracking
  ctx.log('info', 'Phase 11: Setting up ranking progress tracking');
  const rankingTracking = await ctx.task(rankingTrackingTask, {
    keywordPrioritization,
    outputDir
  });
  artifacts.push(...rankingTracking.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    keywordDatabase: keywordResearch.database,
    contentGapAnalysis: contentGaps.analysis,
    topicClusterMap: topicClusters.clusterMap,
    prioritizedContentRoadmap: keywordPrioritization.roadmap,
    contentBriefs: contentBriefs.briefs,
    rankingSetup: rankingTracking.setup,
    artifacts,
    duration,
    metadata: {
      processId: 'digital-marketing/keyword-seo-strategy',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task definitions
export const seedKeywordsTask = defineTask('seed-keywords', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define seed keywords and topics',
  agent: {
    name: 'keyword-strategist',
    prompt: {
      role: 'SEO keyword strategist',
      task: 'Define seed keywords and core topics based on business priorities',
      context: args,
      instructions: [
        'Analyze business priorities and offerings',
        'Identify core product/service categories',
        'Define seed keyword list',
        'Identify main topics and themes',
        'Consider customer terminology vs. industry terms',
        'Include branded and non-branded keywords',
        'Document seed keyword rationale',
        'Create initial topic taxonomy'
      ],
      outputFormat: 'JSON with seedKeywords, topics, categories, taxonomy, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['seedKeywords', 'topics', 'artifacts'],
      properties: {
        seedKeywords: { type: 'array', items: { type: 'string' } },
        topics: { type: 'array', items: { type: 'object' } },
        categories: { type: 'array', items: { type: 'string' } },
        taxonomy: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'seo', 'keyword-research', 'seed-keywords']
}));

export const keywordResearchExpansionTask = defineTask('keyword-research-expansion', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct keyword research and expansion',
  agent: {
    name: 'keyword-researcher',
    prompt: {
      role: 'SEO keyword research specialist',
      task: 'Expand seed keywords into comprehensive keyword database',
      context: args,
      instructions: [
        'Expand seed keywords using keyword tools',
        'Include long-tail variations',
        'Find question-based keywords',
        'Identify related searches',
        'Include modifier keywords',
        'Gather search volume data',
        'Compile comprehensive keyword list',
        'Create keyword database structure'
      ],
      outputFormat: 'JSON with database, totalKeywords, keywordsByCategory, longTailKeywords, questionKeywords, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['database', 'totalKeywords', 'artifacts'],
      properties: {
        database: { type: 'object' },
        totalKeywords: { type: 'number' },
        keywordsByCategory: { type: 'object' },
        longTailKeywords: { type: 'array', items: { type: 'object' } },
        questionKeywords: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'seo', 'keyword-research', 'expansion']
}));

export const searchIntentAnalysisTask = defineTask('search-intent-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze search intent and SERP features',
  agent: {
    name: 'intent-analyst',
    prompt: {
      role: 'search intent specialist',
      task: 'Analyze search intent and SERP features for keywords',
      context: args,
      instructions: [
        'Classify keywords by intent (informational, navigational, commercial, transactional)',
        'Analyze SERP features presence (featured snippets, PAA, local pack, etc.)',
        'Identify content type expectations',
        'Document SERP competition level',
        'Map intent to content formats',
        'Identify featured snippet opportunities',
        'Create intent-based keyword groups',
        'Document intent analysis'
      ],
      outputFormat: 'JSON with intentMapping, serpFeatures, contentTypeMap, featuredSnippetOpportunities, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['intentMapping', 'artifacts'],
      properties: {
        intentMapping: { type: 'object' },
        serpFeatures: { type: 'object' },
        contentTypeMap: { type: 'object' },
        featuredSnippetOpportunities: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'seo', 'search-intent', 'serp-analysis']
}));

export const difficultyAssessmentTask = defineTask('difficulty-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess keyword difficulty and opportunity',
  agent: {
    name: 'difficulty-assessor',
    prompt: {
      role: 'SEO difficulty analyst',
      task: 'Assess keyword difficulty and identify ranking opportunities',
      context: args,
      instructions: [
        'Analyze keyword difficulty scores',
        'Assess domain authority of ranking pages',
        'Evaluate content quality of competitors',
        'Calculate opportunity scores',
        'Identify low-competition opportunities',
        'Factor in search volume vs. difficulty',
        'Create difficulty/opportunity matrix',
        'Document high-opportunity keywords'
      ],
      outputFormat: 'JSON with difficultyScores, opportunityMatrix, highOpportunityKeywords, highOpportunityCount, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['difficultyScores', 'highOpportunityCount', 'artifacts'],
      properties: {
        difficultyScores: { type: 'object' },
        opportunityMatrix: { type: 'object' },
        highOpportunityKeywords: { type: 'array', items: { type: 'object' } },
        highOpportunityCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'seo', 'keyword-difficulty', 'opportunity']
}));

export const competitiveGapAnalysisTask = defineTask('competitive-gap-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform competitive gap analysis',
  agent: {
    name: 'competitive-analyst',
    prompt: {
      role: 'competitive SEO analyst',
      task: 'Analyze competitor keyword strategies and identify gaps',
      context: args,
      instructions: [
        'Identify competitor keyword rankings',
        'Find keywords competitors rank for but you don\'t',
        'Analyze competitor content strategies',
        'Identify common vs. unique keywords',
        'Calculate share of voice',
        'Find underserved opportunities',
        'Document competitive advantages',
        'Create gap analysis report'
      ],
      outputFormat: 'JSON with gaps, competitorKeywords, uniqueOpportunities, shareOfVoice, gapReport, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['gaps', 'artifacts'],
      properties: {
        gaps: { type: 'array', items: { type: 'object' } },
        competitorKeywords: { type: 'object' },
        uniqueOpportunities: { type: 'array', items: { type: 'object' } },
        shareOfVoice: { type: 'object' },
        gapReport: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'seo', 'competitive-analysis', 'gap-analysis']
}));

export const keywordMappingTask = defineTask('keyword-mapping', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map keywords to existing content',
  agent: {
    name: 'content-mapper',
    prompt: {
      role: 'SEO content mapper',
      task: 'Map keywords to existing website content',
      context: args,
      instructions: [
        'Inventory existing content pages',
        'Match keywords to relevant pages',
        'Identify keyword cannibalization',
        'Find pages without target keywords',
        'Identify over-optimized pages',
        'Map primary and secondary keywords per page',
        'Document optimization opportunities',
        'Create content-keyword matrix'
      ],
      outputFormat: 'JSON with mapping, unmappedKeywords, cannibalization, optimizationOpportunities, contentMatrix, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['mapping', 'artifacts'],
      properties: {
        mapping: { type: 'object' },
        unmappedKeywords: { type: 'array', items: { type: 'string' } },
        cannibalization: { type: 'array', items: { type: 'object' } },
        optimizationOpportunities: { type: 'array', items: { type: 'object' } },
        contentMatrix: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'seo', 'keyword-mapping', 'content']
}));

export const contentGapIdentificationTask = defineTask('content-gap-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify content gaps and opportunities',
  agent: {
    name: 'gap-identifier',
    prompt: {
      role: 'content gap analyst',
      task: 'Identify content gaps and new content opportunities',
      context: args,
      instructions: [
        'Identify keywords without content',
        'Find topics with incomplete coverage',
        'Identify content format gaps',
        'Find funnel stage gaps',
        'Identify seasonal content opportunities',
        'Calculate gap priority by opportunity',
        'Document new content recommendations',
        'Create content gap analysis'
      ],
      outputFormat: 'JSON with analysis, gaps, gapCount, newContentRecommendations, priorities, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'gapCount', 'artifacts'],
      properties: {
        analysis: { type: 'object' },
        gaps: { type: 'array', items: { type: 'object' } },
        gapCount: { type: 'number' },
        newContentRecommendations: { type: 'array', items: { type: 'object' } },
        priorities: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'seo', 'content-gaps', 'opportunities']
}));

export const topicClusterStrategyTask = defineTask('topic-cluster-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop topic cluster strategy',
  agent: {
    name: 'cluster-strategist',
    prompt: {
      role: 'topic cluster strategist',
      task: 'Develop topic cluster strategy for topical authority',
      context: args,
      instructions: [
        'Identify pillar page topics',
        'Group related subtopics into clusters',
        'Map internal linking structure',
        'Define cluster hierarchies',
        'Plan content hub structure',
        'Identify cluster coverage gaps',
        'Create cluster visualization',
        'Document cluster strategy'
      ],
      outputFormat: 'JSON with clusterMap, clusterCount, pillars, linkingStrategy, visualization, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['clusterMap', 'clusterCount', 'artifacts'],
      properties: {
        clusterMap: { type: 'object' },
        clusterCount: { type: 'number' },
        pillars: { type: 'array', items: { type: 'object' } },
        linkingStrategy: { type: 'object' },
        visualization: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'seo', 'topic-clusters', 'authority']
}));

export const keywordPrioritizationTask = defineTask('keyword-prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prioritize keywords by business value',
  agent: {
    name: 'keyword-prioritizer',
    prompt: {
      role: 'SEO prioritization specialist',
      task: 'Prioritize keywords by business value and create content roadmap',
      context: args,
      instructions: [
        'Score keywords by business relevance',
        'Factor in conversion potential',
        'Consider search volume and difficulty',
        'Calculate ROI potential',
        'Create priority tiers',
        'Build content roadmap timeline',
        'Identify quick wins',
        'Document prioritization methodology'
      ],
      outputFormat: 'JSON with roadmap, prioritizedKeywords, quickWins, tiers, methodology, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['roadmap', 'artifacts'],
      properties: {
        roadmap: { type: 'array', items: { type: 'object' } },
        prioritizedKeywords: { type: 'array', items: { type: 'object' } },
        quickWins: { type: 'array', items: { type: 'object' } },
        tiers: { type: 'object' },
        methodology: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'seo', 'prioritization', 'roadmap']
}));

export const contentBriefsTask = defineTask('content-briefs', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create content briefs for priority topics',
  agent: {
    name: 'brief-creator',
    prompt: {
      role: 'SEO content brief specialist',
      task: 'Create detailed content briefs for priority keywords',
      context: args,
      instructions: [
        'Create content brief template',
        'Define target keyword and secondaries',
        'Outline content structure',
        'Specify word count targets',
        'Include SERP analysis insights',
        'Define internal linking requirements',
        'Include competitor content analysis',
        'Generate briefs for top priority topics'
      ],
      outputFormat: 'JSON with briefs, template, totalBriefs, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['briefs', 'artifacts'],
      properties: {
        briefs: { type: 'array', items: { type: 'object' } },
        template: { type: 'object' },
        totalBriefs: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'seo', 'content-briefs']
}));

export const rankingTrackingTask = defineTask('ranking-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up ranking progress tracking',
  agent: {
    name: 'ranking-tracker',
    prompt: {
      role: 'SEO ranking specialist',
      task: 'Set up keyword ranking tracking and monitoring',
      context: args,
      instructions: [
        'Select keywords for tracking',
        'Configure rank tracking tool',
        'Set tracking frequency',
        'Define location settings',
        'Create ranking dashboards',
        'Set up ranking alerts',
        'Define ranking goals',
        'Document tracking procedures'
      ],
      outputFormat: 'JSON with setup, trackedKeywords, dashboards, alerts, goals, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['setup', 'artifacts'],
      properties: {
        setup: { type: 'object' },
        trackedKeywords: { type: 'array', items: { type: 'object' } },
        dashboards: { type: 'array', items: { type: 'object' } },
        alerts: { type: 'array', items: { type: 'object' } },
        goals: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'seo', 'ranking-tracking', 'monitoring']
}));
