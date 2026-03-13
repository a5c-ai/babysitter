/**
 * @process specializations/domains/business/public-relations/press-release-development
 * @description Draft newsworthy releases following AP style with compelling headlines, strong leads, quotes, and boilerplate, then coordinate distribution
 * @specialization Public Relations and Communications
 * @category Media Relations
 * @inputs { announcement: object, spokespersons: object[], targetAudience: object, distributionChannels: string[], embargoed: boolean }
 * @outputs { success: boolean, pressRelease: object, distributionPlan: object, quality: number, artifacts: string[] }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    announcement,
    spokespersons = [],
    targetAudience = {},
    distributionChannels = ['wire', 'targeted', 'owned'],
    embargoed = false,
    embargoDate = null,
    boilerplate,
    mediaContacts = [],
    targetQuality = 90
  } = inputs;

  // Phase 1: News Assessment and Angle Development
  await ctx.breakpoint({
    question: 'Starting press release development. Analyze news value and develop angle?',
    title: 'Phase 1: News Assessment',
    context: {
      runId: ctx.runId,
      phase: 'news-assessment',
      announcement
    }
  });

  const newsAssessment = await ctx.task(assessNewsValueTask, {
    announcement,
    targetAudience
  });

  if (newsAssessment.newsValue < 3) {
    await ctx.breakpoint({
      question: `News value assessed as low (${newsAssessment.newsValue}/10). Consider alternative communications approach?`,
      title: 'Low News Value Warning',
      context: {
        runId: ctx.runId,
        newsValue: newsAssessment.newsValue,
        alternatives: newsAssessment.alternatives
      }
    });
  }

  // Phase 2: Headline and Lead Development
  await ctx.breakpoint({
    question: 'News assessment complete. Develop headlines and lead paragraph?',
    title: 'Phase 2: Headline Development',
    context: {
      runId: ctx.runId,
      phase: 'headline-development',
      newsAngle: newsAssessment.primaryAngle
    }
  });

  const headlineOptions = await ctx.task(developHeadlinesTask, {
    announcement,
    newsAssessment,
    targetAudience
  });

  // Phase 3: Full Press Release Draft
  await ctx.breakpoint({
    question: 'Headlines developed. Draft full press release following AP style?',
    title: 'Phase 3: Press Release Draft',
    context: {
      runId: ctx.runId,
      phase: 'draft-release',
      selectedHeadline: headlineOptions.recommended
    }
  });

  const [draftRelease, quotesDeveloped] = await Promise.all([
    ctx.task(draftPressReleaseTask, {
      announcement,
      headline: headlineOptions.recommended,
      newsAssessment,
      boilerplate
    }),
    ctx.task(developQuotesTask, {
      announcement,
      spokespersons,
      newsAssessment
    })
  ]);

  // Phase 4: Quote Integration and Refinement
  await ctx.breakpoint({
    question: 'Draft and quotes ready. Integrate quotes and refine release?',
    title: 'Phase 4: Quote Integration',
    context: {
      runId: ctx.runId,
      phase: 'quote-integration',
      quoteCount: quotesDeveloped.quotes.length
    }
  });

  const refinedRelease = await ctx.task(integrateAndRefineTask, {
    draftRelease,
    quotes: quotesDeveloped.quotes,
    boilerplate
  });

  // Phase 5: AP Style and Quality Review
  await ctx.breakpoint({
    question: 'Release refined. Conduct AP style review and quality check?',
    title: 'Phase 5: Style Review',
    context: {
      runId: ctx.runId,
      phase: 'style-review'
    }
  });

  const styleReview = await ctx.task(reviewApStyleTask, {
    pressRelease: refinedRelease
  });

  // Phase 6: Distribution Planning
  await ctx.breakpoint({
    question: 'Style review complete. Develop distribution plan?',
    title: 'Phase 6: Distribution Planning',
    context: {
      runId: ctx.runId,
      phase: 'distribution-planning',
      channels: distributionChannels,
      embargoed
    }
  });

  const [distributionPlan, targetedOutreach] = await Promise.all([
    ctx.task(developDistributionPlanTask, {
      pressRelease: styleReview.finalRelease,
      distributionChannels,
      embargoed,
      embargoDate,
      targetAudience
    }),
    ctx.task(planTargetedOutreachTask, {
      pressRelease: styleReview.finalRelease,
      mediaContacts,
      newsAssessment
    })
  ]);

  // Phase 7: Final Quality Validation
  await ctx.breakpoint({
    question: 'Validate press release quality and distribution readiness?',
    title: 'Phase 7: Final Validation',
    context: {
      runId: ctx.runId,
      phase: 'final-validation',
      targetQuality
    }
  });

  const qualityResult = await ctx.task(validatePressReleaseQualityTask, {
    pressRelease: styleReview.finalRelease,
    styleReview,
    distributionPlan,
    targetedOutreach,
    targetQuality
  });

  const quality = qualityResult.score;

  if (quality >= targetQuality) {
    return {
      success: true,
      pressRelease: {
        headline: styleReview.finalRelease.headline,
        subheadline: styleReview.finalRelease.subheadline,
        body: styleReview.finalRelease.body,
        quotes: quotesDeveloped.quotes,
        boilerplate: styleReview.finalRelease.boilerplate,
        mediaContact: styleReview.finalRelease.mediaContact,
        wordCount: styleReview.finalRelease.wordCount
      },
      headlineOptions: headlineOptions.options,
      newsAssessment: newsAssessment.summary,
      distributionPlan: {
        wireService: distributionPlan.wireService,
        targetedOutreach: targetedOutreach.outreachList,
        timing: distributionPlan.timing,
        embargoed,
        embargoDate
      },
      quality,
      targetQuality,
      styleIssuesResolved: styleReview.issuesResolved,
      artifacts: [
        'press-release-final.docx',
        'media-list.xlsx',
        'distribution-timeline.pdf'
      ],
      metadata: {
        processId: 'specializations/domains/business/public-relations/press-release-development',
        timestamp: ctx.now(),
        newsValue: newsAssessment.newsValue
      }
    };
  } else {
    return {
      success: false,
      qualityGateFailed: true,
      quality,
      targetQuality,
      issues: qualityResult.issues,
      recommendations: qualityResult.recommendations,
      metadata: {
        processId: 'specializations/domains/business/public-relations/press-release-development',
        timestamp: ctx.now()
      }
    };
  }
}

// Task Definitions

export const assessNewsValueTask = defineTask('assess-news-value', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess News Value and Develop Angle',
  agent: {
    name: 'news-value-assessor',
    prompt: {
      role: 'Veteran journalist and PR strategist assessing newsworthiness',
      task: 'Evaluate announcement newsworthiness and develop compelling angles',
      context: args,
      instructions: [
        'Apply news value criteria: timeliness, impact, prominence, proximity, conflict, novelty',
        'Score newsworthiness on 1-10 scale with justification',
        'Identify primary and secondary news angles',
        'Determine target publications most likely to cover',
        'Suggest timing considerations for maximum impact',
        'Identify potential concerns or sensitivities',
        'Recommend alternative communication approaches if news value is low',
        'Define key messages that resonate with news angle'
      ],
      outputFormat: 'JSON with newsValue score, primaryAngle, secondaryAngles, targetPublications, timing, concerns, alternatives, summary'
    },
    outputSchema: {
      type: 'object',
      required: ['newsValue', 'primaryAngle'],
      properties: {
        newsValue: { type: 'number', minimum: 1, maximum: 10 },
        primaryAngle: { type: 'string' },
        secondaryAngles: { type: 'array', items: { type: 'string' } },
        targetPublications: { type: 'array', items: { type: 'string' } },
        timing: { type: 'object' },
        concerns: { type: 'array', items: { type: 'string' } },
        alternatives: { type: 'array', items: { type: 'string' } },
        summary: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'news-assessment']
}));

export const developHeadlinesTask = defineTask('develop-headlines', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Headlines and Subheadlines',
  agent: {
    name: 'headline-writer',
    prompt: {
      role: 'Award-winning headline writer and press release specialist',
      task: 'Develop compelling headlines and subheadlines for press release',
      context: args,
      instructions: [
        'Create 5-7 headline options following AP style guidelines',
        'Ensure headlines are specific, action-oriented, and newsworthy',
        'Avoid promotional language and superlatives',
        'Include company name or key identifier appropriately',
        'Create supporting subheadlines for each option',
        'Optimize for search and digital discoverability',
        'Test headlines against newsworthiness criteria',
        'Recommend top headline with rationale'
      ],
      outputFormat: 'JSON with options array (headline, subheadline, rationale), recommended, optimizationNotes'
    },
    outputSchema: {
      type: 'object',
      required: ['options', 'recommended'],
      properties: {
        options: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              headline: { type: 'string' },
              subheadline: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        recommended: { type: 'object' },
        optimizationNotes: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'headline-writing']
}));

export const draftPressReleaseTask = defineTask('draft-press-release', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Draft Press Release Body',
  agent: {
    name: 'press-release-writer',
    prompt: {
      role: 'Senior PR writer with extensive news writing experience',
      task: 'Draft complete press release following AP style and journalistic standards',
      context: args,
      instructions: [
        'Write strong lead paragraph with who, what, when, where, why, how',
        'Structure using inverted pyramid (most important first)',
        'Include supporting details and context in body paragraphs',
        'Maintain objective, third-person news style',
        'Avoid promotional language, jargon, and superlatives',
        'Include relevant data, statistics, or research',
        'Add background/context paragraph',
        'Include call-to-action or next steps if appropriate',
        'Keep total length 400-600 words ideal',
        'Leave quote placeholders for integration'
      ],
      outputFormat: 'JSON with headline, lead, bodyParagraphs array, backgroundContext, callToAction, wordCount'
    },
    outputSchema: {
      type: 'object',
      required: ['headline', 'lead', 'bodyParagraphs'],
      properties: {
        headline: { type: 'string' },
        lead: { type: 'string' },
        bodyParagraphs: { type: 'array', items: { type: 'string' } },
        backgroundContext: { type: 'string' },
        callToAction: { type: 'string' },
        wordCount: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'press-release-writing']
}));

export const developQuotesTask = defineTask('develop-quotes', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Spokesperson Quotes',
  agent: {
    name: 'quote-developer',
    prompt: {
      role: 'Communications specialist crafting executive quotes',
      task: 'Develop compelling quotes from spokespersons for press release',
      context: args,
      instructions: [
        'Create 2-3 quotes from designated spokespersons',
        'Ensure quotes add value beyond what body text says',
        'Include perspective, vision, or emotional resonance',
        'Write in natural speaking voice of each spokesperson',
        'Align quotes with key messages and news angle',
        'Include proper attribution with name and title',
        'Ensure quotes are approval-ready for spokespersons',
        'Create primary quote (lead executive) and supporting quotes'
      ],
      outputFormat: 'JSON with quotes array (text, spokesperson, title, placement), primaryQuote, supportingQuotes'
    },
    outputSchema: {
      type: 'object',
      required: ['quotes', 'primaryQuote'],
      properties: {
        quotes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              text: { type: 'string' },
              spokesperson: { type: 'string' },
              title: { type: 'string' },
              placement: { type: 'string' }
            }
          }
        },
        primaryQuote: { type: 'object' },
        supportingQuotes: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'quote-development']
}));

export const integrateAndRefineTask = defineTask('integrate-and-refine', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Integrate Quotes and Refine Release',
  agent: {
    name: 'release-refiner',
    prompt: {
      role: 'Senior editor specializing in press release optimization',
      task: 'Integrate quotes and refine press release for publication',
      context: args,
      instructions: [
        'Integrate quotes at optimal positions in release',
        'Ensure smooth transitions between paragraphs',
        'Refine language for clarity and impact',
        'Tighten prose and eliminate redundancy',
        'Add boilerplate and media contact information',
        'Format according to press release standards',
        'Include dateline (city, date)',
        'Add ### or -30- end marker',
        'Ensure proper paragraph spacing and structure'
      ],
      outputFormat: 'JSON with complete press release object (headline, subheadline, dateline, body, boilerplate, mediaContact, wordCount)'
    },
    outputSchema: {
      type: 'object',
      required: ['headline', 'body', 'boilerplate'],
      properties: {
        headline: { type: 'string' },
        subheadline: { type: 'string' },
        dateline: { type: 'string' },
        body: { type: 'string' },
        boilerplate: { type: 'string' },
        mediaContact: { type: 'object' },
        wordCount: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'release-refinement']
}));

export const reviewApStyleTask = defineTask('review-ap-style', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review AP Style Compliance',
  agent: {
    name: 'ap-style-reviewer',
    prompt: {
      role: 'Copy editor expert in AP Stylebook standards',
      task: 'Review press release for AP style compliance and quality',
      context: args,
      instructions: [
        'Check all AP style conventions (dates, numbers, titles, abbreviations)',
        'Verify proper capitalization and punctuation',
        'Review quote attribution formatting',
        'Check dateline format and placement',
        'Verify company name usage and trademark handling',
        'Review for grammar, spelling, and syntax errors',
        'Check for passive voice and wordiness',
        'Ensure consistent tense usage',
        'Validate contact information completeness',
        'Provide corrected final version'
      ],
      outputFormat: 'JSON with finalRelease object, issuesFound, issuesResolved, styleNotes'
    },
    outputSchema: {
      type: 'object',
      required: ['finalRelease', 'issuesResolved'],
      properties: {
        finalRelease: { type: 'object' },
        issuesFound: { type: 'array', items: { type: 'string' } },
        issuesResolved: { type: 'number' },
        styleNotes: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'ap-style-review']
}));

export const developDistributionPlanTask = defineTask('develop-distribution-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop Distribution Plan',
  agent: {
    name: 'distribution-planner',
    prompt: {
      role: 'PR distribution specialist expert in wire services and media outreach',
      task: 'Develop comprehensive press release distribution plan',
      context: args,
      instructions: [
        'Recommend wire service options (PR Newswire, Business Wire, GlobeNewswire)',
        'Define distribution circuit based on target audience',
        'Plan timing for optimal coverage (day of week, time of day)',
        'Coordinate embargo logistics if applicable',
        'Plan owned channel distribution (newsroom, social, email)',
        'Define geographic and industry targeting',
        'Plan multimedia asset distribution (images, video)',
        'Create distribution timeline and checklist',
        'Estimate reach and impressions by channel'
      ],
      outputFormat: 'JSON with wireService, circuit, timing, ownedChannels, multimedia, timeline, reachEstimate'
    },
    outputSchema: {
      type: 'object',
      required: ['wireService', 'timing', 'timeline'],
      properties: {
        wireService: { type: 'object' },
        circuit: { type: 'string' },
        timing: { type: 'object' },
        ownedChannels: { type: 'array', items: { type: 'object' } },
        multimedia: { type: 'object' },
        timeline: { type: 'array', items: { type: 'object' } },
        reachEstimate: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'distribution-planning']
}));

export const planTargetedOutreachTask = defineTask('plan-targeted-outreach', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan Targeted Media Outreach',
  agent: {
    name: 'targeted-outreach-planner',
    prompt: {
      role: 'Media relations specialist planning journalist outreach',
      task: 'Plan targeted outreach to key journalists and outlets',
      context: args,
      instructions: [
        'Identify priority journalists for personalized outreach',
        'Draft personalized pitch notes for top contacts',
        'Plan exclusive or advance briefing offers',
        'Define outreach sequence and timing',
        'Create follow-up protocol and timeline',
        'Plan spokesperson availability for interviews',
        'Prepare supporting materials for media requests',
        'Define success metrics for outreach campaign'
      ],
      outputFormat: 'JSON with outreachList, pitchNotes, exclusiveStrategy, followUpPlan, metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['outreachList', 'pitchNotes'],
      properties: {
        outreachList: { type: 'array', items: { type: 'object' } },
        pitchNotes: { type: 'array', items: { type: 'object' } },
        exclusiveStrategy: { type: 'object' },
        followUpPlan: { type: 'object' },
        metrics: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'targeted-outreach']
}));

export const validatePressReleaseQualityTask = defineTask('validate-press-release-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Press Release Quality',
  agent: {
    name: 'press-release-quality-validator',
    prompt: {
      role: 'PR quality assurance specialist',
      task: 'Validate press release quality and distribution readiness',
      context: args,
      instructions: [
        'Evaluate headline effectiveness and newsworthiness',
        'Assess lead paragraph impact and completeness',
        'Review quote quality and spokesperson representation',
        'Validate AP style compliance score',
        'Assess distribution plan completeness',
        'Check for factual accuracy indicators',
        'Review call-to-action clarity',
        'Provide overall quality score (0-100)',
        'Identify issues and recommendations'
      ],
      outputFormat: 'JSON with score, passed, headlineScore, leadScore, quoteScore, styleScore, issues, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'passed'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        passed: { type: 'boolean' },
        headlineScore: { type: 'number' },
        leadScore: { type: 'number' },
        quoteScore: { type: 'number' },
        styleScore: { type: 'number' },
        issues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'public-relations', 'quality-validation']
}));
