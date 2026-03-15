/**
 * @process digital-marketing/technical-seo-audit
 * @description Process for conducting comprehensive technical SEO audits and implementing improvements to enhance crawlability, indexability, and site performance
 * @inputs { websiteAccess: object, crawlingTools: object, searchConsoleData: object, outputDir: string }
 * @outputs { success: boolean, auditReport: object, prioritizedIssueList: array, implementationRoadmap: object, progressTracking: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    websiteAccess = {},
    crawlingTools = {},
    searchConsoleData = {},
    outputDir = 'technical-seo-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Technical SEO Audit and Implementation process');

  // Task 1: Crawl Website
  ctx.log('info', 'Phase 1: Crawling website to identify technical issues');
  const crawlResult = await ctx.task(websiteCrawlTask, {
    websiteAccess,
    crawlingTools,
    outputDir
  });
  artifacts.push(...crawlResult.artifacts);

  // Task 2: Analyze Site Architecture
  ctx.log('info', 'Phase 2: Analyzing site architecture and URL structure');
  const architectureAnalysis = await ctx.task(architectureAnalysisTask, {
    crawlResult,
    outputDir
  });
  artifacts.push(...architectureAnalysis.artifacts);

  // Task 3: Assess Core Web Vitals
  ctx.log('info', 'Phase 3: Assessing Core Web Vitals and page speed');
  const coreWebVitals = await ctx.task(coreWebVitalsTask, {
    crawlResult,
    searchConsoleData,
    outputDir
  });
  artifacts.push(...coreWebVitals.artifacts);

  // Task 4: Review Mobile-Friendliness
  ctx.log('info', 'Phase 4: Reviewing mobile-friendliness and responsive design');
  const mobileReview = await ctx.task(mobileReviewTask, {
    crawlResult,
    searchConsoleData,
    outputDir
  });
  artifacts.push(...mobileReview.artifacts);

  // Task 5: Check Robots and Sitemaps
  ctx.log('info', 'Phase 5: Checking robots.txt and XML sitemaps');
  const robotsSitemaps = await ctx.task(robotsSitemapsTask, {
    websiteAccess,
    crawlResult,
    outputDir
  });
  artifacts.push(...robotsSitemaps.artifacts);

  // Task 6: Audit Indexation Status
  ctx.log('info', 'Phase 6: Auditing indexation status and coverage');
  const indexationAudit = await ctx.task(indexationAuditTask, {
    searchConsoleData,
    crawlResult,
    outputDir
  });
  artifacts.push(...indexationAudit.artifacts);

  // Task 7: Validate Structured Data
  ctx.log('info', 'Phase 7: Validating structured data and schema markup');
  const structuredData = await ctx.task(structuredDataTask, {
    crawlResult,
    outputDir
  });
  artifacts.push(...structuredData.artifacts);

  // Task 8: Identify Duplicate Content
  ctx.log('info', 'Phase 8: Identifying and fixing duplicate content issues');
  const duplicateContent = await ctx.task(duplicateContentTask, {
    crawlResult,
    outputDir
  });
  artifacts.push(...duplicateContent.artifacts);

  // Task 9: Prioritize Issues
  ctx.log('info', 'Phase 9: Prioritizing issues by impact and effort');
  const prioritization = await ctx.task(issuePrioritizationTask, {
    crawlResult,
    architectureAnalysis,
    coreWebVitals,
    mobileReview,
    robotsSitemaps,
    indexationAudit,
    structuredData,
    duplicateContent,
    outputDir
  });
  artifacts.push(...prioritization.artifacts);

  // Breakpoint: Review audit findings
  await ctx.breakpoint({
    question: `Technical SEO audit complete. ${prioritization.criticalIssues} critical issues, ${prioritization.highIssues} high priority issues found. Review findings?`,
    title: 'Technical SEO Audit Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        totalIssues: prioritization.totalIssues,
        criticalIssues: prioritization.criticalIssues,
        highIssues: prioritization.highIssues,
        coreWebVitalsScore: coreWebVitals.overallScore,
        indexedPages: indexationAudit.indexedPages
      }
    }
  });

  // Task 10: Create Implementation Roadmap
  ctx.log('info', 'Phase 10: Creating implementation roadmap');
  const implementationRoadmap = await ctx.task(implementationRoadmapTask, {
    prioritization,
    outputDir
  });
  artifacts.push(...implementationRoadmap.artifacts);

  // Task 11: Set Up Progress Tracking
  ctx.log('info', 'Phase 11: Setting up progress tracking and monitoring');
  const progressTracking = await ctx.task(progressTrackingTask, {
    implementationRoadmap,
    searchConsoleData,
    outputDir
  });
  artifacts.push(...progressTracking.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    auditReport: {
      crawlSummary: crawlResult.summary,
      architectureFindings: architectureAnalysis.findings,
      coreWebVitals: coreWebVitals.metrics,
      mobileFindings: mobileReview.findings,
      indexationStatus: indexationAudit.status,
      structuredDataStatus: structuredData.status
    },
    prioritizedIssueList: prioritization.prioritizedList,
    implementationRoadmap: implementationRoadmap.roadmap,
    progressTracking: progressTracking.setup,
    artifacts,
    duration,
    metadata: {
      processId: 'digital-marketing/technical-seo-audit',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task definitions
export const websiteCrawlTask = defineTask('website-crawl', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Crawl website to identify technical issues',
  agent: {
    name: 'seo-crawler',
    prompt: {
      role: 'technical SEO specialist',
      task: 'Conduct comprehensive website crawl to identify technical issues',
      context: args,
      instructions: [
        'Configure crawl parameters and scope',
        'Execute comprehensive site crawl',
        'Identify HTTP status code issues (4xx, 5xx)',
        'Find broken links and redirects',
        'Detect slow-loading pages',
        'Identify missing meta tags',
        'Find orphan pages',
        'Document crawl summary and statistics'
      ],
      outputFormat: 'JSON with summary, issues, statistics, crawlData, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'issues', 'artifacts'],
      properties: {
        summary: { type: 'object' },
        issues: { type: 'array', items: { type: 'object' } },
        statistics: { type: 'object' },
        crawlData: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'technical-seo', 'crawl', 'audit']
}));

export const architectureAnalysisTask = defineTask('architecture-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze site architecture and URL structure',
  agent: {
    name: 'architecture-analyst',
    prompt: {
      role: 'site architecture specialist',
      task: 'Analyze site architecture and URL structure for SEO optimization',
      context: args,
      instructions: [
        'Map site hierarchy and structure',
        'Analyze URL patterns and consistency',
        'Assess click depth from homepage',
        'Review internal linking structure',
        'Identify siloed content',
        'Evaluate navigation effectiveness',
        'Check URL parameter handling',
        'Document architecture recommendations'
      ],
      outputFormat: 'JSON with findings, siteMap, urlAnalysis, internalLinking, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['findings', 'artifacts'],
      properties: {
        findings: { type: 'object' },
        siteMap: { type: 'object' },
        urlAnalysis: { type: 'object' },
        internalLinking: { type: 'object' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'technical-seo', 'architecture', 'url-structure']
}));

export const coreWebVitalsTask = defineTask('core-web-vitals', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess Core Web Vitals and page speed',
  agent: {
    name: 'performance-analyst',
    prompt: {
      role: 'web performance specialist',
      task: 'Assess Core Web Vitals and page speed performance',
      context: args,
      instructions: [
        'Measure LCP (Largest Contentful Paint)',
        'Measure FID/INP (First Input Delay/Interaction to Next Paint)',
        'Measure CLS (Cumulative Layout Shift)',
        'Analyze page speed scores',
        'Identify performance bottlenecks',
        'Review server response times (TTFB)',
        'Assess resource loading optimization',
        'Create performance improvement recommendations'
      ],
      outputFormat: 'JSON with metrics, overallScore, bottlenecks, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'overallScore', 'artifacts'],
      properties: {
        metrics: { type: 'object' },
        overallScore: { type: 'number' },
        bottlenecks: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'technical-seo', 'core-web-vitals', 'performance']
}));

export const mobileReviewTask = defineTask('mobile-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review mobile-friendliness and responsive design',
  agent: {
    name: 'mobile-specialist',
    prompt: {
      role: 'mobile SEO specialist',
      task: 'Review mobile-friendliness and responsive design implementation',
      context: args,
      instructions: [
        'Test mobile-friendliness across devices',
        'Check viewport configuration',
        'Assess touch target sizes',
        'Review font readability on mobile',
        'Check mobile page speed',
        'Verify mobile-first indexing readiness',
        'Test mobile usability issues',
        'Document mobile optimization recommendations'
      ],
      outputFormat: 'JSON with findings, mobileScore, usabilityIssues, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['findings', 'artifacts'],
      properties: {
        findings: { type: 'object' },
        mobileScore: { type: 'number' },
        usabilityIssues: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'technical-seo', 'mobile', 'responsive']
}));

export const robotsSitemapsTask = defineTask('robots-sitemaps', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Check robots.txt and XML sitemaps',
  agent: {
    name: 'crawl-specialist',
    prompt: {
      role: 'crawl optimization specialist',
      task: 'Audit robots.txt and XML sitemap configuration',
      context: args,
      instructions: [
        'Analyze robots.txt directives',
        'Check for blocking critical resources',
        'Validate XML sitemap structure',
        'Verify sitemap coverage',
        'Check sitemap submission status',
        'Identify missing pages in sitemap',
        'Review sitemap file size limits',
        'Document crawl directive recommendations'
      ],
      outputFormat: 'JSON with robotsAnalysis, sitemapAnalysis, issues, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['robotsAnalysis', 'sitemapAnalysis', 'artifacts'],
      properties: {
        robotsAnalysis: { type: 'object' },
        sitemapAnalysis: { type: 'object' },
        issues: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'technical-seo', 'robots', 'sitemap']
}));

export const indexationAuditTask = defineTask('indexation-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Audit indexation status and coverage',
  agent: {
    name: 'indexation-analyst',
    prompt: {
      role: 'search indexation specialist',
      task: 'Audit website indexation status and coverage in search engines',
      context: args,
      instructions: [
        'Review Google Search Console coverage report',
        'Identify indexation errors and warnings',
        'Check pages excluded from index',
        'Analyze crawled vs indexed ratio',
        'Identify canonical issues',
        'Check noindex directives',
        'Review index bloat issues',
        'Document indexation improvements'
      ],
      outputFormat: 'JSON with status, indexedPages, errors, excludedPages, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'indexedPages', 'artifacts'],
      properties: {
        status: { type: 'object' },
        indexedPages: { type: 'number' },
        errors: { type: 'array', items: { type: 'object' } },
        excludedPages: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'technical-seo', 'indexation', 'coverage']
}));

export const structuredDataTask = defineTask('structured-data', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate structured data and schema markup',
  agent: {
    name: 'schema-specialist',
    prompt: {
      role: 'structured data specialist',
      task: 'Validate and audit structured data and schema markup',
      context: args,
      instructions: [
        'Identify existing schema markup',
        'Validate schema syntax and structure',
        'Check for schema errors and warnings',
        'Identify missing schema opportunities',
        'Review rich result eligibility',
        'Assess schema coverage across page types',
        'Check organization and site schema',
        'Document schema implementation recommendations'
      ],
      outputFormat: 'JSON with status, existingSchema, errors, opportunities, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'artifacts'],
      properties: {
        status: { type: 'object' },
        existingSchema: { type: 'array', items: { type: 'object' } },
        errors: { type: 'array', items: { type: 'object' } },
        opportunities: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'technical-seo', 'structured-data', 'schema']
}));

export const duplicateContentTask = defineTask('duplicate-content', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify and fix duplicate content issues',
  agent: {
    name: 'content-deduplication-specialist',
    prompt: {
      role: 'duplicate content specialist',
      task: 'Identify and resolve duplicate content issues',
      context: args,
      instructions: [
        'Identify exact duplicate pages',
        'Find near-duplicate content',
        'Check canonical tag implementation',
        'Identify thin content pages',
        'Review URL parameter duplicates',
        'Check HTTP/HTTPS and www/non-www variants',
        'Assess pagination handling',
        'Document deduplication recommendations'
      ],
      outputFormat: 'JSON with duplicates, canonicalIssues, thinContent, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['duplicates', 'artifacts'],
      properties: {
        duplicates: { type: 'array', items: { type: 'object' } },
        canonicalIssues: { type: 'array', items: { type: 'object' } },
        thinContent: { type: 'array', items: { type: 'object' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'technical-seo', 'duplicate-content', 'canonical']
}));

export const issuePrioritizationTask = defineTask('issue-prioritization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prioritize issues by impact and effort',
  agent: {
    name: 'issue-prioritizer',
    prompt: {
      role: 'SEO project manager',
      task: 'Prioritize technical SEO issues by impact and implementation effort',
      context: args,
      instructions: [
        'Compile all identified issues',
        'Assess impact of each issue on SEO',
        'Estimate implementation effort',
        'Calculate priority score (impact/effort)',
        'Categorize by issue type',
        'Identify quick wins',
        'Flag critical issues requiring immediate attention',
        'Create prioritized issue list'
      ],
      outputFormat: 'JSON with prioritizedList, totalIssues, criticalIssues, highIssues, quickWins, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['prioritizedList', 'totalIssues', 'criticalIssues', 'highIssues', 'artifacts'],
      properties: {
        prioritizedList: { type: 'array', items: { type: 'object' } },
        totalIssues: { type: 'number' },
        criticalIssues: { type: 'number' },
        highIssues: { type: 'number' },
        quickWins: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'technical-seo', 'prioritization']
}));

export const implementationRoadmapTask = defineTask('implementation-roadmap', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create implementation roadmap',
  agent: {
    name: 'roadmap-planner',
    prompt: {
      role: 'SEO implementation planner',
      task: 'Create detailed implementation roadmap for technical SEO fixes',
      context: args,
      instructions: [
        'Group related fixes together',
        'Create phased implementation plan',
        'Assign timelines to each phase',
        'Define dependencies between fixes',
        'Create implementation tickets/tasks',
        'Define success metrics per fix',
        'Plan for testing and validation',
        'Document roadmap and milestones'
      ],
      outputFormat: 'JSON with roadmap, phases, milestones, dependencies, successMetrics, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['roadmap', 'artifacts'],
      properties: {
        roadmap: { type: 'object' },
        phases: { type: 'array', items: { type: 'object' } },
        milestones: { type: 'array', items: { type: 'object' } },
        dependencies: { type: 'array', items: { type: 'object' } },
        successMetrics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'technical-seo', 'roadmap', 'implementation']
}));

export const progressTrackingTask = defineTask('progress-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up progress tracking and monitoring',
  agent: {
    name: 'progress-tracker',
    prompt: {
      role: 'SEO progress analyst',
      task: 'Set up tracking for implementation progress and SEO improvements',
      context: args,
      instructions: [
        'Define tracking metrics',
        'Set up monitoring dashboards',
        'Create progress reporting templates',
        'Configure alerts for regressions',
        'Plan regular audit cadence',
        'Set up competitive benchmarking',
        'Define success thresholds',
        'Document tracking procedures'
      ],
      outputFormat: 'JSON with setup, dashboards, reportingTemplates, alerts, auditCadence, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['setup', 'artifacts'],
      properties: {
        setup: { type: 'object' },
        dashboards: { type: 'array', items: { type: 'object' } },
        reportingTemplates: { type: 'array', items: { type: 'object' } },
        alerts: { type: 'array', items: { type: 'object' } },
        auditCadence: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'technical-seo', 'tracking', 'monitoring']
}));
