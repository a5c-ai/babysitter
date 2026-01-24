/**
 * @process marketing/seo-strategy-implementation
 * @description Conduct keyword research, optimize on-page elements, build technical SEO foundation, develop link building strategy, and track organic search performance.
 * @inputs { website: string, targetKeywords: array, competitors: array, currentMetrics: object, businessGoals: object }
 * @outputs { success: boolean, seoStrategy: object, keywordPlan: object, technicalAudit: object, linkBuildingPlan: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    website = '',
    targetKeywords = [],
    competitors = [],
    currentMetrics = {},
    businessGoals = {},
    outputDir = 'seo-strategy-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting SEO Strategy Implementation for ${website}`);

  // Phase 1-10: Keyword Research, Technical Audit, On-Page Optimization, Content Gap Analysis,
  // Link Building Strategy, Local SEO (if applicable), Performance Tracking, Competitive Analysis,
  // Implementation Roadmap, Quality Assessment

  const keywordResearch = await ctx.task(keywordResearchTask, { website, targetKeywords, competitors, businessGoals, outputDir });
  artifacts.push(...keywordResearch.artifacts);

  const technicalAudit = await ctx.task(technicalSeoAuditTask, { website, currentMetrics, outputDir });
  artifacts.push(...technicalAudit.artifacts);

  const onPageOptimization = await ctx.task(onPageOptimizationTask, { website, keywordResearch, technicalAudit, outputDir });
  artifacts.push(...onPageOptimization.artifacts);

  const contentGapAnalysis = await ctx.task(contentGapAnalysisTask, { website, keywordResearch, competitors, outputDir });
  artifacts.push(...contentGapAnalysis.artifacts);

  const linkBuildingStrategy = await ctx.task(linkBuildingStrategyTask, { website, competitors, keywordResearch, outputDir });
  artifacts.push(...linkBuildingStrategy.artifacts);

  const performanceTracking = await ctx.task(seoPerformanceTrackingTask, { website, keywordResearch, businessGoals, outputDir });
  artifacts.push(...performanceTracking.artifacts);

  const implementationRoadmap = await ctx.task(seoImplementationRoadmapTask, { technicalAudit, onPageOptimization, contentGapAnalysis, linkBuildingStrategy, outputDir });
  artifacts.push(...implementationRoadmap.artifacts);

  const qualityAssessment = await ctx.task(seoStrategyQualityTask, { keywordResearch, technicalAudit, onPageOptimization, linkBuildingStrategy, implementationRoadmap, outputDir });
  artifacts.push(...qualityAssessment.artifacts);

  const strategyScore = qualityAssessment.overallScore;

  await ctx.breakpoint({
    question: `SEO strategy complete. Quality score: ${strategyScore}/100. Review and approve?`,
    title: 'SEO Strategy Review',
    context: { runId: ctx.runId, files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })) }
  });

  return {
    success: true,
    website,
    strategyScore,
    seoStrategy: { keywordPlan: keywordResearch.plan, technicalPriorities: technicalAudit.priorities, onPagePlan: onPageOptimization.plan },
    keywordPlan: keywordResearch.plan,
    technicalAudit: technicalAudit.audit,
    linkBuildingPlan: linkBuildingStrategy.plan,
    contentGaps: contentGapAnalysis.gaps,
    implementationRoadmap: implementationRoadmap.roadmap,
    trackingFramework: performanceTracking.framework,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'marketing/seo-strategy-implementation', timestamp: startTime, website, outputDir }
  };
}

export const keywordResearchTask = defineTask('keyword-research', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct keyword research',
  agent: {
    name: 'seo-researcher',
    prompt: {
      role: 'SEO keyword research specialist',
      task: 'Conduct comprehensive keyword research and develop keyword targeting plan',
      context: args,
      instructions: ['Identify seed keywords', 'Expand keyword list using tools', 'Analyze search volume and difficulty', 'Map keywords to search intent', 'Prioritize keywords by business value', 'Create keyword clusters', 'Map keywords to content', 'Generate keyword research document']
    },
    outputSchema: { type: 'object', required: ['plan', 'keywords', 'artifacts'], properties: { plan: { type: 'object' }, keywords: { type: 'array' }, clusters: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'seo', 'keyword-research']
}));

export const technicalSeoAuditTask = defineTask('technical-seo-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct technical SEO audit',
  agent: {
    name: 'technical-seo-auditor',
    prompt: {
      role: 'Technical SEO specialist',
      task: 'Conduct comprehensive technical SEO audit',
      context: args,
      instructions: ['Audit site crawlability', 'Check indexation status', 'Analyze site speed', 'Review mobile-friendliness', 'Check structured data', 'Audit URL structure', 'Review internal linking', 'Identify technical issues', 'Prioritize fixes']
    },
    outputSchema: { type: 'object', required: ['audit', 'priorities', 'artifacts'], properties: { audit: { type: 'object' }, issues: { type: 'array' }, priorities: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'seo', 'technical-audit']
}));

export const onPageOptimizationTask = defineTask('on-page-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop on-page optimization plan',
  agent: {
    name: 'on-page-optimizer',
    prompt: {
      role: 'On-page SEO specialist',
      task: 'Develop comprehensive on-page optimization plan',
      context: args,
      instructions: ['Optimize title tags', 'Optimize meta descriptions', 'Plan heading structure', 'Optimize content for keywords', 'Plan image optimization', 'Optimize internal linking', 'Create optimization templates']
    },
    outputSchema: { type: 'object', required: ['plan', 'artifacts'], properties: { plan: { type: 'object' }, optimizations: { type: 'array' }, templates: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'seo', 'on-page']
}));

export const contentGapAnalysisTask = defineTask('content-gap-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze content gaps',
  agent: {
    name: 'content-gap-analyst',
    prompt: {
      role: 'SEO content strategist',
      task: 'Identify content gaps and opportunities',
      context: args,
      instructions: ['Compare keyword coverage vs competitors', 'Identify missing topics', 'Find content opportunities', 'Prioritize content creation', 'Plan content calendar']
    },
    outputSchema: { type: 'object', required: ['gaps', 'opportunities', 'artifacts'], properties: { gaps: { type: 'array' }, opportunities: { type: 'array' }, contentPlan: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'seo', 'content-gap']
}));

export const linkBuildingStrategyTask = defineTask('link-building-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop link building strategy',
  agent: {
    name: 'link-builder',
    prompt: {
      role: 'Link building strategist',
      task: 'Develop comprehensive link building strategy',
      context: args,
      instructions: ['Audit current backlink profile', 'Analyze competitor backlinks', 'Identify link opportunities', 'Plan outreach strategy', 'Define link building tactics', 'Set link acquisition targets']
    },
    outputSchema: { type: 'object', required: ['plan', 'tactics', 'artifacts'], properties: { plan: { type: 'object' }, tactics: { type: 'array' }, targets: { type: 'object' }, opportunities: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'seo', 'link-building']
}));

export const seoPerformanceTrackingTask = defineTask('seo-performance-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define SEO performance tracking',
  agent: {
    name: 'seo-analyst',
    prompt: {
      role: 'SEO analytics specialist',
      task: 'Define SEO performance tracking framework',
      context: args,
      instructions: ['Define key SEO KPIs', 'Set up ranking tracking', 'Configure traffic monitoring', 'Plan reporting cadence', 'Create dashboard specifications']
    },
    outputSchema: { type: 'object', required: ['framework', 'kpis', 'artifacts'], properties: { framework: { type: 'object' }, kpis: { type: 'array' }, dashboard: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'seo', 'tracking']
}));

export const seoImplementationRoadmapTask = defineTask('seo-implementation-roadmap', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create SEO implementation roadmap',
  agent: {
    name: 'seo-project-manager',
    prompt: {
      role: 'SEO program manager',
      task: 'Create phased SEO implementation roadmap',
      context: args,
      instructions: ['Prioritize all SEO initiatives', 'Create phased implementation plan', 'Define milestones', 'Allocate resources', 'Set timeline']
    },
    outputSchema: { type: 'object', required: ['roadmap', 'phases', 'artifacts'], properties: { roadmap: { type: 'object' }, phases: { type: 'array' }, milestones: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'seo', 'roadmap']
}));

export const seoStrategyQualityTask = defineTask('seo-strategy-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess SEO strategy quality',
  agent: {
    name: 'seo-validator',
    prompt: {
      role: 'SEO director',
      task: 'Assess overall SEO strategy quality',
      context: args,
      instructions: ['Evaluate keyword research depth', 'Assess technical audit completeness', 'Review on-page optimization plan', 'Evaluate link building strategy', 'Assess implementation feasibility', 'Calculate overall score']
    },
    outputSchema: { type: 'object', required: ['overallScore', 'componentScores', 'artifacts'], properties: { overallScore: { type: 'number' }, componentScores: { type: 'object' }, recommendations: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'seo', 'quality-assessment']
}));
