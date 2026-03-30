/**
 * @process digital-marketing/blog-content-production
 * @description End-to-end process for producing blog content from ideation to publication, including research, writing, editing, SEO optimization, and publishing
 * @inputs { contentBrief: object, keywordTargets: array, brandGuidelines: object, visualAssets: array, outputDir: string }
 * @outputs { success: boolean, publishedPost: object, optimizedMetadata: object, visualAssets: array, performanceBaseline: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    contentBrief = {},
    keywordTargets = [],
    brandGuidelines = {},
    visualAssets = [],
    outputDir = 'blog-production-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Blog Content Production Workflow');

  // Task 1: Generate Content Brief
  ctx.log('info', 'Phase 1: Generating content brief from editorial calendar');
  const briefResult = await ctx.task(contentBriefTask, {
    contentBrief,
    keywordTargets,
    outputDir
  });
  artifacts.push(...briefResult.artifacts);

  // Task 2: Topic Research and Outline
  ctx.log('info', 'Phase 2: Conducting topic research and creating outline');
  const researchOutline = await ctx.task(researchOutlineTask, {
    brief: briefResult,
    keywordTargets,
    outputDir
  });
  artifacts.push(...researchOutline.artifacts);

  // Task 3: Write First Draft
  ctx.log('info', 'Phase 3: Writing first draft');
  const firstDraft = await ctx.task(firstDraftTask, {
    brief: briefResult,
    outline: researchOutline,
    brandGuidelines,
    outputDir
  });
  artifacts.push(...firstDraft.artifacts);

  // Task 4: SEO Optimization
  ctx.log('info', 'Phase 4: SEO optimizing content');
  const seoOptimized = await ctx.task(seoOptimizationTask, {
    draft: firstDraft,
    keywordTargets,
    outline: researchOutline,
    outputDir
  });
  artifacts.push(...seoOptimized.artifacts);

  // Task 5: Edit and Proofread
  ctx.log('info', 'Phase 5: Editing and proofreading');
  const editedContent = await ctx.task(editProofreadTask, {
    content: seoOptimized,
    brandGuidelines,
    outputDir
  });
  artifacts.push(...editedContent.artifacts);

  // Task 6: Source/Create Visuals
  ctx.log('info', 'Phase 6: Sourcing and creating visuals');
  const visualsResult = await ctx.task(visualCreationTask, {
    content: editedContent,
    visualAssets,
    brandGuidelines,
    outputDir
  });
  artifacts.push(...visualsResult.artifacts);

  // Task 7: Internal Stakeholder Review
  ctx.log('info', 'Phase 7: Preparing for stakeholder review');
  const reviewPrep = await ctx.task(stakeholderReviewTask, {
    content: editedContent,
    visuals: visualsResult,
    brief: briefResult,
    outputDir
  });
  artifacts.push(...reviewPrep.artifacts);

  // Breakpoint: Content review
  await ctx.breakpoint({
    question: `Blog content ready for review. SEO score: ${seoOptimized.seoScore}/100. Word count: ${editedContent.wordCount}. Approve for publishing?`,
    title: 'Blog Content Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        title: briefResult.title,
        wordCount: editedContent.wordCount,
        seoScore: seoOptimized.seoScore,
        readabilityScore: editedContent.readabilityScore,
        visualCount: visualsResult.visualCount
      }
    }
  });

  // Task 8: Final QA and Formatting
  ctx.log('info', 'Phase 8: Final QA and formatting');
  const finalQA = await ctx.task(finalQATask, {
    content: editedContent,
    visuals: visualsResult,
    seoOptimized,
    outputDir
  });
  artifacts.push(...finalQA.artifacts);

  // Task 9: Publish and Submit for Indexing
  ctx.log('info', 'Phase 9: Preparing publish package and indexing submission');
  const publishPackage = await ctx.task(publishTask, {
    finalContent: finalQA,
    seoOptimized,
    outputDir
  });
  artifacts.push(...publishPackage.artifacts);

  // Task 10: Initial Performance Setup
  ctx.log('info', 'Phase 10: Setting up initial performance monitoring');
  const performanceSetup = await ctx.task(performanceMonitoringTask, {
    publishedContent: publishPackage,
    keywordTargets,
    outputDir
  });
  artifacts.push(...performanceSetup.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    publishedPost: publishPackage.post,
    optimizedMetadata: seoOptimized.metadata,
    visualAssets: visualsResult.assets,
    performanceBaseline: performanceSetup.baseline,
    contentMetrics: {
      wordCount: editedContent.wordCount,
      seoScore: seoOptimized.seoScore,
      readabilityScore: editedContent.readabilityScore
    },
    artifacts,
    duration,
    metadata: {
      processId: 'digital-marketing/blog-content-production',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task definitions
export const contentBriefTask = defineTask('content-brief', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate content brief from editorial calendar',
  agent: {
    name: 'content-planner',
    prompt: {
      role: 'content strategist',
      task: 'Generate detailed content brief for blog post',
      context: args,
      instructions: [
        'Define content objectives and goals',
        'Specify target audience and persona',
        'Outline key messages and takeaways',
        'Define target keywords and search intent',
        'Set word count and format guidelines',
        'Identify competitor content to reference',
        'Define call-to-action requirements',
        'Create comprehensive content brief document'
      ],
      outputFormat: 'JSON with brief, title, objectives, targetAudience, keywords, wordCountTarget, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['brief', 'title', 'artifacts'],
      properties: {
        brief: { type: 'object' },
        title: { type: 'string' },
        objectives: { type: 'array', items: { type: 'string' } },
        targetAudience: { type: 'object' },
        keywords: { type: 'array', items: { type: 'object' } },
        wordCountTarget: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'blog-production', 'content-brief']
}));

export const researchOutlineTask = defineTask('research-outline', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct topic research and create outline',
  agent: {
    name: 'content-researcher',
    prompt: {
      role: 'content researcher and strategist',
      task: 'Conduct thorough research and create detailed outline',
      context: args,
      instructions: [
        'Research topic thoroughly from authoritative sources',
        'Analyze top-ranking competitor content',
        'Identify unique angles and perspectives',
        'Structure outline with H2 and H3 headings',
        'Include key points under each section',
        'Identify data points and statistics to include',
        'Plan internal and external linking opportunities',
        'Create comprehensive research document'
      ],
      outputFormat: 'JSON with outline, research, sources, competitorAnalysis, uniqueAngles, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['outline', 'research', 'artifacts'],
      properties: {
        outline: { type: 'object' },
        research: { type: 'object' },
        sources: { type: 'array', items: { type: 'object' } },
        competitorAnalysis: { type: 'object' },
        uniqueAngles: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'blog-production', 'research', 'outline']
}));

export const firstDraftTask = defineTask('first-draft', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write first draft',
  agent: {
    name: 'content-writer',
    prompt: {
      role: 'professional content writer',
      task: 'Write engaging first draft following the outline',
      context: args,
      instructions: [
        'Write compelling introduction with hook',
        'Follow outline structure',
        'Include relevant examples and case studies',
        'Write in brand voice and tone',
        'Include data points and statistics',
        'Write clear and actionable sections',
        'Create strong conclusion with CTA',
        'Target specified word count'
      ],
      outputFormat: 'JSON with draft, wordCount, sections, introduction, conclusion, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['draft', 'wordCount', 'artifacts'],
      properties: {
        draft: { type: 'string' },
        wordCount: { type: 'number' },
        sections: { type: 'array', items: { type: 'object' } },
        introduction: { type: 'string' },
        conclusion: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'blog-production', 'writing', 'first-draft']
}));

export const seoOptimizationTask = defineTask('seo-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'SEO optimize content',
  agent: {
    name: 'seo-specialist',
    prompt: {
      role: 'SEO content specialist',
      task: 'Optimize content for search engines while maintaining readability',
      context: args,
      instructions: [
        'Optimize title tag with primary keyword',
        'Write compelling meta description',
        'Ensure proper heading hierarchy (H1, H2, H3)',
        'Optimize keyword placement and density',
        'Add internal links to relevant content',
        'Include external links to authoritative sources',
        'Optimize image alt text',
        'Ensure URL slug is SEO-friendly',
        'Generate SEO score and recommendations'
      ],
      outputFormat: 'JSON with optimizedContent, metadata, seoScore, recommendations, internalLinks, externalLinks, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizedContent', 'metadata', 'seoScore', 'artifacts'],
      properties: {
        optimizedContent: { type: 'string' },
        metadata: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            metaDescription: { type: 'string' },
            slug: { type: 'string' },
            focusKeyword: { type: 'string' }
          }
        },
        seoScore: { type: 'number' },
        recommendations: { type: 'array', items: { type: 'string' } },
        internalLinks: { type: 'array', items: { type: 'object' } },
        externalLinks: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'blog-production', 'seo', 'optimization']
}));

export const editProofreadTask = defineTask('edit-proofread', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Edit and proofread content',
  agent: {
    name: 'content-editor',
    prompt: {
      role: 'professional content editor',
      task: 'Edit content for clarity, grammar, and brand consistency',
      context: args,
      instructions: [
        'Check grammar and spelling',
        'Improve sentence structure and flow',
        'Ensure brand voice consistency',
        'Verify factual accuracy',
        'Check readability score',
        'Ensure logical flow between sections',
        'Verify all links work correctly',
        'Document all edits and changes'
      ],
      outputFormat: 'JSON with editedContent, wordCount, readabilityScore, editsLog, brandConsistency, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['editedContent', 'wordCount', 'readabilityScore', 'artifacts'],
      properties: {
        editedContent: { type: 'string' },
        wordCount: { type: 'number' },
        readabilityScore: { type: 'number' },
        editsLog: { type: 'array', items: { type: 'object' } },
        brandConsistency: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'blog-production', 'editing', 'proofreading']
}));

export const visualCreationTask = defineTask('visual-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Source and create visuals',
  agent: {
    name: 'visual-specialist',
    prompt: {
      role: 'visual content specialist',
      task: 'Source and create visual assets for the blog post',
      context: args,
      instructions: [
        'Identify visual needs based on content',
        'Create featured image specifications',
        'Source relevant stock images',
        'Create infographic concepts if needed',
        'Design custom graphics',
        'Optimize images for web',
        'Create alt text for all images',
        'Document visual asset library'
      ],
      outputFormat: 'JSON with assets, visualCount, featuredImage, infographics, altTexts, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assets', 'visualCount', 'artifacts'],
      properties: {
        assets: { type: 'array', items: { type: 'object' } },
        visualCount: { type: 'number' },
        featuredImage: { type: 'object' },
        infographics: { type: 'array', items: { type: 'object' } },
        altTexts: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'blog-production', 'visuals', 'images']
}));

export const stakeholderReviewTask = defineTask('stakeholder-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare for stakeholder review',
  agent: {
    name: 'review-coordinator',
    prompt: {
      role: 'content review coordinator',
      task: 'Prepare content package for stakeholder review',
      context: args,
      instructions: [
        'Compile review package with all assets',
        'Create review checklist',
        'Identify key stakeholders for review',
        'Set review timeline and deadlines',
        'Prepare feedback collection template',
        'Document revision process',
        'Create approval workflow',
        'Generate review summary document'
      ],
      outputFormat: 'JSON with reviewPackage, checklist, stakeholders, timeline, feedbackTemplate, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reviewPackage', 'checklist', 'artifacts'],
      properties: {
        reviewPackage: { type: 'object' },
        checklist: { type: 'array', items: { type: 'object' } },
        stakeholders: { type: 'array', items: { type: 'string' } },
        timeline: { type: 'object' },
        feedbackTemplate: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'blog-production', 'review', 'stakeholder']
}));

export const finalQATask = defineTask('final-qa', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final QA and formatting',
  agent: {
    name: 'qa-specialist',
    prompt: {
      role: 'content QA specialist',
      task: 'Perform final quality assurance and formatting checks',
      context: args,
      instructions: [
        'Verify all content sections are complete',
        'Check all links functionality',
        'Verify image placement and alt text',
        'Check formatting consistency',
        'Verify metadata completeness',
        'Test mobile responsiveness requirements',
        'Final grammar and spelling check',
        'Generate QA report'
      ],
      outputFormat: 'JSON with qaResult, finalContent, issues, formatting, qaScore, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['qaResult', 'finalContent', 'artifacts'],
      properties: {
        qaResult: { type: 'object' },
        finalContent: { type: 'string' },
        issues: { type: 'array', items: { type: 'object' } },
        formatting: { type: 'object' },
        qaScore: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'blog-production', 'qa', 'formatting']
}));

export const publishTask = defineTask('publish', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare publish package and indexing submission',
  agent: {
    name: 'publishing-specialist',
    prompt: {
      role: 'content publishing specialist',
      task: 'Prepare content for publishing and search engine indexing',
      context: args,
      instructions: [
        'Prepare final publish package',
        'Set up CMS configuration',
        'Configure publication date and time',
        'Set up canonical URL',
        'Configure Open Graph and Twitter cards',
        'Prepare sitemap update',
        'Create indexing request documentation',
        'Document publish checklist completion'
      ],
      outputFormat: 'JSON with post, publishConfig, socialCards, sitemapUpdate, indexingRequest, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['post', 'publishConfig', 'artifacts'],
      properties: {
        post: { type: 'object' },
        publishConfig: { type: 'object' },
        socialCards: { type: 'object' },
        sitemapUpdate: { type: 'object' },
        indexingRequest: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'blog-production', 'publishing', 'indexing']
}));

export const performanceMonitoringTask = defineTask('performance-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up initial performance monitoring',
  agent: {
    name: 'performance-analyst',
    prompt: {
      role: 'content performance analyst',
      task: 'Set up monitoring for initial content performance',
      context: args,
      instructions: [
        'Define performance metrics to track',
        'Set up Google Search Console monitoring',
        'Configure analytics tracking',
        'Set keyword ranking tracking',
        'Define performance benchmarks',
        'Set up performance alerts',
        'Create monitoring schedule',
        'Document baseline metrics'
      ],
      outputFormat: 'JSON with baseline, metrics, trackingSetup, alerts, monitoringSchedule, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['baseline', 'artifacts'],
      properties: {
        baseline: { type: 'object' },
        metrics: { type: 'array', items: { type: 'object' } },
        trackingSetup: { type: 'object' },
        alerts: { type: 'array', items: { type: 'object' } },
        monitoringSchedule: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'blog-production', 'performance', 'monitoring']
}));
