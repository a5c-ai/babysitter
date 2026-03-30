/**
 * @process marketing/content-production-workflow
 * @description Establish end-to-end content creation process from briefing through writing, editing, SEO optimization, approval, and publication.
 * @inputs { contentBrief: object, contentType: string, brandGuidelines: object, seoRequirements: object, approvers: array, publishingPlatform: string }
 * @outputs { success: boolean, content: object, seoOptimization: object, approvalStatus: object, publishingDetails: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    contentBrief = {},
    contentType = 'blog',
    brandGuidelines = {},
    seoRequirements = {},
    approvers = [],
    publishingPlatform = 'website',
    outputDir = 'content-production-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Content Production Workflow for ${contentType} content`);

  // ============================================================================
  // PHASE 1: BRIEF ANALYSIS AND PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing content brief');
  const briefAnalysis = await ctx.task(briefAnalysisTask, {
    contentBrief,
    contentType,
    seoRequirements,
    outputDir
  });

  artifacts.push(...briefAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: RESEARCH AND OUTLINE
  // ============================================================================

  ctx.log('info', 'Phase 2: Conducting research and creating outline');
  const researchOutline = await ctx.task(researchOutlineTask, {
    briefAnalysis,
    contentBrief,
    contentType,
    seoRequirements,
    outputDir
  });

  artifacts.push(...researchOutline.artifacts);

  // ============================================================================
  // PHASE 3: CONTENT DRAFTING
  // ============================================================================

  ctx.log('info', 'Phase 3: Drafting content');
  const contentDraft = await ctx.task(contentDraftingTask, {
    briefAnalysis,
    researchOutline,
    brandGuidelines,
    contentType,
    outputDir
  });

  artifacts.push(...contentDraft.artifacts);

  // ============================================================================
  // PHASE 4: EDITORIAL REVIEW
  // ============================================================================

  ctx.log('info', 'Phase 4: Conducting editorial review');
  const editorialReview = await ctx.task(editorialReviewTask, {
    contentDraft,
    brandGuidelines,
    contentType,
    outputDir
  });

  artifacts.push(...editorialReview.artifacts);

  // ============================================================================
  // PHASE 5: SEO OPTIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Optimizing for SEO');
  const seoOptimization = await ctx.task(seoOptimizationTask, {
    contentDraft,
    editorialReview,
    seoRequirements,
    outputDir
  });

  artifacts.push(...seoOptimization.artifacts);

  // ============================================================================
  // PHASE 6: VISUAL ASSET CREATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating visual assets');
  const visualAssets = await ctx.task(visualAssetCreationTask, {
    contentDraft,
    brandGuidelines,
    contentType,
    publishingPlatform,
    outputDir
  });

  artifacts.push(...visualAssets.artifacts);

  // ============================================================================
  // PHASE 7: FINAL EDITING AND POLISH
  // ============================================================================

  ctx.log('info', 'Phase 7: Final editing and polish');
  const finalEdit = await ctx.task(finalEditingTask, {
    contentDraft,
    editorialReview,
    seoOptimization,
    visualAssets,
    brandGuidelines,
    outputDir
  });

  artifacts.push(...finalEdit.artifacts);

  // ============================================================================
  // PHASE 8: APPROVAL WORKFLOW
  // ============================================================================

  ctx.log('info', 'Phase 8: Managing approval workflow');
  const approvalWorkflow = await ctx.task(approvalWorkflowTask, {
    finalEdit,
    approvers,
    contentType,
    outputDir
  });

  artifacts.push(...approvalWorkflow.artifacts);

  // ============================================================================
  // PHASE 9: PUBLISHING PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Preparing for publication');
  const publishingPrep = await ctx.task(publishingPreparationTask, {
    finalEdit,
    approvalWorkflow,
    visualAssets,
    seoOptimization,
    publishingPlatform,
    outputDir
  });

  artifacts.push(...publishingPrep.artifacts);

  // ============================================================================
  // PHASE 10: PRODUCTION QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 10: Assessing production quality');
  const qualityAssessment = await ctx.task(productionQualityAssessmentTask, {
    briefAnalysis,
    contentDraft,
    editorialReview,
    seoOptimization,
    finalEdit,
    approvalWorkflow,
    publishingPrep,
    outputDir
  });

  artifacts.push(...qualityAssessment.artifacts);

  const productionScore = qualityAssessment.overallScore;
  const qualityMet = productionScore >= 80;

  // Breakpoint: Review content production
  await ctx.breakpoint({
    question: `Content production complete. Quality score: ${productionScore}/100. ${qualityMet ? 'Content meets quality standards!' : 'Content may need refinement.'} Review and approve?`,
    title: 'Content Production Review & Approval',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        productionScore,
        qualityMet,
        contentType,
        totalArtifacts: artifacts.length,
        wordCount: finalEdit.wordCount || 0,
        seoScore: seoOptimization.score || 0,
        approvalStatus: approvalWorkflow.status || 'pending'
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    contentType,
    productionScore,
    qualityMet,
    content: {
      title: finalEdit.title,
      body: finalEdit.body,
      wordCount: finalEdit.wordCount,
      readingTime: finalEdit.readingTime
    },
    seoOptimization: {
      score: seoOptimization.score,
      primaryKeyword: seoOptimization.primaryKeyword,
      metaTitle: seoOptimization.metaTitle,
      metaDescription: seoOptimization.metaDescription
    },
    approvalStatus: {
      status: approvalWorkflow.status,
      approvers: approvalWorkflow.approvers,
      feedback: approvalWorkflow.feedback
    },
    publishingDetails: {
      platform: publishingPrep.platform,
      scheduledDate: publishingPrep.scheduledDate,
      assets: publishingPrep.assets
    },
    visualAssets: visualAssets.assets,
    artifacts,
    duration,
    metadata: {
      processId: 'marketing/content-production-workflow',
      timestamp: startTime,
      contentType,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Brief Analysis
export const briefAnalysisTask = defineTask('brief-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze content brief',
  agent: {
    name: 'brief-analyst',
    prompt: {
      role: 'content strategist and project manager',
      task: 'Analyze content brief and define production requirements',
      context: args,
      instructions: [
        'Review and interpret content brief objectives',
        'Identify target audience and intent',
        'Define content scope and depth',
        'Identify key messages and takeaways',
        'Review SEO requirements and keywords',
        'Define content structure requirements',
        'Identify research needs',
        'Set quality criteria',
        'Generate brief analysis document'
      ],
      outputFormat: 'JSON with analysis (object), objectives (array), audience (object), scope (object), seoRequirements (object), qualityCriteria (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'objectives', 'audience', 'artifacts'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            type: { type: 'string' },
            priority: { type: 'string' }
          }
        },
        objectives: { type: 'array', items: { type: 'string' } },
        audience: {
          type: 'object',
          properties: {
            primary: { type: 'string' },
            intent: { type: 'string' }
          }
        },
        scope: { type: 'object' },
        seoRequirements: { type: 'object' },
        qualityCriteria: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'content-production', 'brief-analysis']
}));

// Task 2: Research and Outline
export const researchOutlineTask = defineTask('research-outline', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct research and create outline',
  agent: {
    name: 'content-researcher',
    prompt: {
      role: 'content researcher and strategist',
      task: 'Research topic thoroughly and create detailed content outline',
      context: args,
      instructions: [
        'Research topic from authoritative sources',
        'Identify key facts and statistics',
        'Research competitor content',
        'Create detailed content outline',
        'Define section headings and subheadings',
        'Identify expert quotes and citations',
        'Plan internal and external links',
        'Note unique angles and insights',
        'Generate research and outline document'
      ],
      outputFormat: 'JSON with research (object), outline (array), sources (array), statistics (array), uniqueAngles (array), linkOpportunities (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['research', 'outline', 'sources', 'artifacts'],
      properties: {
        research: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            keyFindings: { type: 'array', items: { type: 'string' } }
          }
        },
        outline: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              section: { type: 'string' },
              subsections: { type: 'array', items: { type: 'string' } },
              keyPoints: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        sources: { type: 'array', items: { type: 'string' } },
        statistics: { type: 'array' },
        uniqueAngles: { type: 'array', items: { type: 'string' } },
        linkOpportunities: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'content-production', 'research']
}));

// Task 3: Content Drafting
export const contentDraftingTask = defineTask('content-drafting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Draft content',
  agent: {
    name: 'content-writer',
    prompt: {
      role: 'senior content writer',
      task: 'Write first draft of content following outline and brand guidelines',
      context: args,
      instructions: [
        'Write compelling title and introduction',
        'Develop each section per outline',
        'Maintain brand voice throughout',
        'Include relevant examples and stories',
        'Incorporate research and statistics',
        'Write clear, engaging prose',
        'Include appropriate CTAs',
        'Write meta description draft',
        'Generate first draft document'
      ],
      outputFormat: 'JSON with draft (object), title (string), introduction (string), sections (array), conclusion (string), ctas (array), wordCount (number), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['draft', 'title', 'sections', 'wordCount', 'artifacts'],
      properties: {
        draft: {
          type: 'object',
          properties: {
            fullText: { type: 'string' },
            format: { type: 'string' }
          }
        },
        title: { type: 'string' },
        introduction: { type: 'string' },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              heading: { type: 'string' },
              content: { type: 'string' }
            }
          }
        },
        conclusion: { type: 'string' },
        ctas: { type: 'array', items: { type: 'string' } },
        wordCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'content-production', 'drafting']
}));

// Task 4: Editorial Review
export const editorialReviewTask = defineTask('editorial-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct editorial review',
  agent: {
    name: 'editor',
    prompt: {
      role: 'senior editor and content quality specialist',
      task: 'Review content for quality, clarity, and brand alignment',
      context: args,
      instructions: [
        'Review for grammar and spelling',
        'Check sentence structure and flow',
        'Verify brand voice consistency',
        'Assess clarity and readability',
        'Check factual accuracy',
        'Verify source citations',
        'Review structure and organization',
        'Provide specific feedback and suggestions',
        'Generate editorial review document'
      ],
      outputFormat: 'JSON with review (object), issues (array), suggestions (array), readabilityScore (number), brandAlignment (number), feedback (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['review', 'issues', 'suggestions', 'artifacts'],
      properties: {
        review: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            overallQuality: { type: 'string' }
          }
        },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              location: { type: 'string' },
              issue: { type: 'string' },
              suggestion: { type: 'string' }
            }
          }
        },
        suggestions: { type: 'array', items: { type: 'string' } },
        readabilityScore: { type: 'number' },
        brandAlignment: { type: 'number' },
        feedback: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'content-production', 'editorial']
}));

// Task 5: SEO Optimization
export const seoOptimizationTask = defineTask('seo-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Optimize for SEO',
  agent: {
    name: 'seo-specialist',
    prompt: {
      role: 'SEO specialist and content optimizer',
      task: 'Optimize content for search engines',
      context: args,
      instructions: [
        'Optimize title for primary keyword',
        'Review and optimize headings (H1, H2, H3)',
        'Check keyword density and placement',
        'Optimize meta title and description',
        'Review internal linking opportunities',
        'Check for featured snippet optimization',
        'Verify URL structure',
        'Add schema markup recommendations',
        'Generate SEO optimization report'
      ],
      outputFormat: 'JSON with score (number 0-100), primaryKeyword (string), metaTitle (string), metaDescription (string), optimizations (array), internalLinks (array), schemaRecommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'primaryKeyword', 'metaTitle', 'metaDescription', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        primaryKeyword: { type: 'string' },
        secondaryKeywords: { type: 'array', items: { type: 'string' } },
        metaTitle: { type: 'string' },
        metaDescription: { type: 'string' },
        optimizations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              element: { type: 'string' },
              recommendation: { type: 'string' }
            }
          }
        },
        internalLinks: { type: 'array' },
        schemaRecommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'content-production', 'seo']
}));

// Task 6: Visual Asset Creation
export const visualAssetCreationTask = defineTask('visual-asset-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create visual assets',
  agent: {
    name: 'visual-designer',
    prompt: {
      role: 'visual content designer',
      task: 'Plan and specify visual assets needed for content',
      context: args,
      instructions: [
        'Identify visual asset needs',
        'Specify featured image requirements',
        'Plan in-content images and graphics',
        'Define infographic requirements',
        'Specify social media image variants',
        'Define image alt text',
        'Specify video thumbnail if applicable',
        'Create asset brief for designers',
        'Generate visual asset specification'
      ],
      outputFormat: 'JSON with assets (array), featuredImage (object), inContentImages (array), socialImages (array), altTexts (object), assetBriefs (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assets', 'featuredImage', 'artifacts'],
      properties: {
        assets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              description: { type: 'string' },
              dimensions: { type: 'string' },
              placement: { type: 'string' }
            }
          }
        },
        featuredImage: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            dimensions: { type: 'string' },
            altText: { type: 'string' }
          }
        },
        inContentImages: { type: 'array' },
        socialImages: { type: 'array' },
        altTexts: { type: 'object' },
        assetBriefs: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'content-production', 'visual-assets']
}));

// Task 7: Final Editing
export const finalEditingTask = defineTask('final-editing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final editing and polish',
  agent: {
    name: 'final-editor',
    prompt: {
      role: 'executive editor and quality controller',
      task: 'Perform final edit incorporating all feedback and optimizations',
      context: args,
      instructions: [
        'Incorporate editorial feedback',
        'Apply SEO optimizations',
        'Final grammar and spell check',
        'Verify all links work',
        'Check image placements and alt texts',
        'Verify formatting consistency',
        'Final brand voice check',
        'Create final version',
        'Generate final content package'
      ],
      outputFormat: 'JSON with title (string), body (string), wordCount (number), readingTime (string), metadata (object), finalChecklist (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['title', 'body', 'wordCount', 'artifacts'],
      properties: {
        title: { type: 'string' },
        body: { type: 'string' },
        wordCount: { type: 'number' },
        readingTime: { type: 'string' },
        metadata: {
          type: 'object',
          properties: {
            metaTitle: { type: 'string' },
            metaDescription: { type: 'string' },
            keywords: { type: 'array', items: { type: 'string' } }
          }
        },
        finalChecklist: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              item: { type: 'string' },
              status: { type: 'string' }
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
  labels: ['agent', 'content-production', 'final-edit']
}));

// Task 8: Approval Workflow
export const approvalWorkflowTask = defineTask('approval-workflow', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Manage approval workflow',
  agent: {
    name: 'approval-coordinator',
    prompt: {
      role: 'content operations coordinator',
      task: 'Manage content approval workflow and consolidate feedback',
      context: args,
      instructions: [
        'Route content to approvers',
        'Track approval status',
        'Consolidate feedback from approvers',
        'Identify required changes',
        'Manage revision requests',
        'Document approval history',
        'Obtain final sign-off',
        'Create approval record',
        'Generate approval status document'
      ],
      outputFormat: 'JSON with status (string), approvers (array), feedback (array), changes (array), signOff (object), history (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'approvers', 'feedback', 'artifacts'],
      properties: {
        status: { type: 'string', enum: ['pending', 'approved', 'changes-requested', 'rejected'] },
        approvers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              role: { type: 'string' },
              status: { type: 'string' },
              date: { type: 'string' }
            }
          }
        },
        feedback: { type: 'array', items: { type: 'string' } },
        changes: { type: 'array', items: { type: 'string' } },
        signOff: { type: 'object' },
        history: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'content-production', 'approval']
}));

// Task 9: Publishing Preparation
export const publishingPreparationTask = defineTask('publishing-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare for publication',
  agent: {
    name: 'publishing-coordinator',
    prompt: {
      role: 'content publishing specialist',
      task: 'Prepare all elements for content publication',
      context: args,
      instructions: [
        'Format content for publishing platform',
        'Upload and position images',
        'Configure SEO settings',
        'Set categories and tags',
        'Configure featured image',
        'Set publication date/time',
        'Create social sharing snippets',
        'Final pre-publish check',
        'Generate publishing checklist'
      ],
      outputFormat: 'JSON with platform (string), scheduledDate (string), assets (array), seoSettings (object), categories (array), tags (array), socialSnippets (object), checklist (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['platform', 'assets', 'seoSettings', 'artifacts'],
      properties: {
        platform: { type: 'string' },
        scheduledDate: { type: 'string' },
        assets: { type: 'array', items: { type: 'string' } },
        seoSettings: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            canonicalUrl: { type: 'string' }
          }
        },
        categories: { type: 'array', items: { type: 'string' } },
        tags: { type: 'array', items: { type: 'string' } },
        socialSnippets: { type: 'object' },
        checklist: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'content-production', 'publishing']
}));

// Task 10: Production Quality Assessment
export const productionQualityAssessmentTask = defineTask('production-quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess production quality',
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'content quality director',
      task: 'Assess overall content production quality',
      context: args,
      instructions: [
        'Evaluate brief alignment (weight: 15%)',
        'Assess research quality (weight: 10%)',
        'Review content quality (weight: 20%)',
        'Evaluate editorial polish (weight: 15%)',
        'Assess SEO optimization (weight: 15%)',
        'Review visual assets (weight: 10%)',
        'Evaluate approval process (weight: 5%)',
        'Assess publishing readiness (weight: 10%)',
        'Calculate weighted overall score (0-100)',
        'Identify improvements'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), componentScores (object), gaps (array), recommendations (array), strengths (array), readinessLevel (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            briefAlignment: { type: 'number' },
            researchQuality: { type: 'number' },
            contentQuality: { type: 'number' },
            editorialPolish: { type: 'number' },
            seoOptimization: { type: 'number' },
            visualAssets: { type: 'number' },
            approvalProcess: { type: 'number' },
            publishingReadiness: { type: 'number' }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        strengths: { type: 'array', items: { type: 'string' } },
        readinessLevel: { type: 'string', enum: ['ready', 'minor-revisions', 'major-revisions'] },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'content-production', 'quality-assessment']
}));
