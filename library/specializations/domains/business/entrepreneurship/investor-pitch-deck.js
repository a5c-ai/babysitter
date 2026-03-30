/**
 * @process specializations/domains/business/entrepreneurship/investor-pitch-deck
 * @description Investor Pitch Deck Development Process - Structured process to create compelling investor pitch decks that tell a cohesive story and address investor criteria.
 * @inputs { companyName: string, problemStatement: string, solution: string, businessModel: string, traction?: object, team?: array, fundingAsk?: string, marketData?: object }
 * @outputs { success: boolean, pitchDeck: object, presenterNotes: array, appendixSlides: array, feedbackGuide: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/entrepreneurship/investor-pitch-deck', {
 *   companyName: 'TechStartup Inc',
 *   problemStatement: 'Businesses waste 20 hours/week on manual data entry',
 *   solution: 'AI-powered automation platform',
 *   businessModel: 'SaaS subscription',
 *   fundingAsk: '$2M Seed'
 * });
 *
 * @references
 * - Get Backed: https://www.getbackedbook.com/
 * - Sequoia Pitch Deck Template: https://www.sequoiacap.com/
 * - DocSend Pitch Deck Analysis: https://docsend.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    companyName,
    problemStatement,
    solution,
    businessModel,
    traction = {},
    team = [],
    fundingAsk = '',
    marketData = {}
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Investor Pitch Deck Development for ${companyName}`);

  // Phase 1: Narrative Arc Development
  const narrativeArc = await ctx.task(narrativeArcTask, {
    companyName,
    problemStatement,
    solution,
    businessModel
  });

  artifacts.push(...(narrativeArc.artifacts || []));

  // Phase 2: Problem Slide Development
  const problemSlide = await ctx.task(problemSlideTask, {
    companyName,
    problemStatement,
    narrativeArc
  });

  artifacts.push(...(problemSlide.artifacts || []));

  // Phase 3: Solution Slide Development
  const solutionSlide = await ctx.task(solutionSlideTask, {
    companyName,
    solution,
    problemSlide
  });

  artifacts.push(...(solutionSlide.artifacts || []));

  // Phase 4: Market Opportunity Slide
  const marketSlide = await ctx.task(marketSlideTask, {
    companyName,
    marketData,
    solution
  });

  artifacts.push(...(marketSlide.artifacts || []));

  // Phase 5: Business Model Slide
  const businessModelSlide = await ctx.task(businessModelSlideTask, {
    companyName,
    businessModel,
    solution
  });

  artifacts.push(...(businessModelSlide.artifacts || []));

  // Phase 6: Traction Slide
  const tractionSlide = await ctx.task(tractionSlideTask, {
    companyName,
    traction
  });

  artifacts.push(...(tractionSlide.artifacts || []));

  // Phase 7: Team Slide
  const teamSlide = await ctx.task(teamSlideTask, {
    companyName,
    team
  });

  artifacts.push(...(teamSlide.artifacts || []));

  // Phase 8: Competitive Advantage Slide
  const competitiveSlide = await ctx.task(competitiveSlideTask, {
    companyName,
    solution,
    marketData
  });

  artifacts.push(...(competitiveSlide.artifacts || []));

  // Phase 9: Financials and Ask Slide
  const askSlide = await ctx.task(askSlideTask, {
    companyName,
    fundingAsk,
    businessModel
  });

  artifacts.push(...(askSlide.artifacts || []));

  // Breakpoint: Review deck structure
  await ctx.breakpoint({
    question: `Review pitch deck structure for ${companyName}. Slides complete: Problem, Solution, Market, Business Model, Traction, Team, Competition, Ask. Proceed with assembly?`,
    title: 'Pitch Deck Structure Review',
    context: {
      runId: ctx.runId,
      companyName,
      slideCount: 10,
      files: artifacts
    }
  });

  // Phase 10: Deck Assembly and Flow
  const deckAssembly = await ctx.task(deckAssemblyTask, {
    companyName,
    narrativeArc,
    problemSlide,
    solutionSlide,
    marketSlide,
    businessModelSlide,
    tractionSlide,
    teamSlide,
    competitiveSlide,
    askSlide
  });

  artifacts.push(...(deckAssembly.artifacts || []));

  // Phase 11: Presenter Notes
  const presenterNotes = await ctx.task(presenterNotesTask, {
    companyName,
    deckAssembly
  });

  artifacts.push(...(presenterNotes.artifacts || []));

  // Phase 12: Appendix Slides
  const appendixSlides = await ctx.task(appendixSlidesTask, {
    companyName,
    marketData,
    traction,
    businessModel
  });

  artifacts.push(...(appendixSlides.artifacts || []));

  // Final Breakpoint: Deck approval
  await ctx.breakpoint({
    question: `Pitch deck complete for ${companyName}. Total slides: ${deckAssembly.slideCount}. Ready for practice and feedback?`,
    title: 'Pitch Deck Approval',
    context: {
      runId: ctx.runId,
      companyName,
      slideCount: deckAssembly.slideCount,
      appendixCount: appendixSlides.slides?.length || 0,
      files: artifacts
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    companyName,
    pitchDeck: {
      narrativeArc: narrativeArc,
      slides: deckAssembly.slides,
      flow: deckAssembly.flow
    },
    presenterNotes: presenterNotes.notes,
    appendixSlides: appendixSlides.slides,
    feedbackGuide: presenterNotes.feedbackGuide,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/business/entrepreneurship/investor-pitch-deck',
      timestamp: startTime,
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const narrativeArcTask = defineTask('narrative-arc', (args, taskCtx) => ({
  kind: 'agent',
  title: `Narrative Arc Development - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Pitch Deck Storytelling Expert',
      task: 'Develop compelling narrative arc for investor pitch',
      context: {
        companyName: args.companyName,
        problemStatement: args.problemStatement,
        solution: args.solution,
        businessModel: args.businessModel
      },
      instructions: [
        '1. Define the core story and emotional hook',
        '2. Establish the "why now" urgency factor',
        '3. Create narrative flow from problem to opportunity',
        '4. Define key messages for each section',
        '5. Identify memorable soundbites and quotable moments',
        '6. Create transition statements between sections',
        '7. Define the call-to-action climax',
        '8. Identify the unique insight or contrarian view',
        '9. Plan for investor objection handling in narrative',
        '10. Create elevator pitch summary'
      ],
      outputFormat: 'JSON object with narrative arc'
    },
    outputSchema: {
      type: 'object',
      required: ['coreStory', 'narrativeFlow', 'keyMessages'],
      properties: {
        coreStory: { type: 'string' },
        emotionalHook: { type: 'string' },
        whyNow: { type: 'string' },
        narrativeFlow: { type: 'array', items: { type: 'string' } },
        keyMessages: { type: 'array', items: { type: 'string' } },
        soundbites: { type: 'array', items: { type: 'string' } },
        transitions: { type: 'array', items: { type: 'string' } },
        uniqueInsight: { type: 'string' },
        elevatorPitch: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'pitch-deck', 'narrative']
}));

export const problemSlideTask = defineTask('problem-slide', (args, taskCtx) => ({
  kind: 'agent',
  title: `Problem Slide Development - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Pitch Deck Expert',
      task: 'Create compelling problem slide content',
      context: {
        companyName: args.companyName,
        problemStatement: args.problemStatement,
        narrativeArc: args.narrativeArc
      },
      instructions: [
        '1. Articulate the problem in relatable, vivid terms',
        '2. Include specific data points and statistics',
        '3. Highlight the cost/pain of the problem',
        '4. Show who experiences the problem',
        '5. Explain why existing solutions fail',
        '6. Create visual concepts for the slide',
        '7. Develop presenter talking points',
        '8. Include customer quote if available',
        '9. Make problem feel urgent and widespread',
        '10. Connect problem to market opportunity'
      ],
      outputFormat: 'JSON object with problem slide content'
    },
    outputSchema: {
      type: 'object',
      required: ['headline', 'keyPoints', 'statistics'],
      properties: {
        headline: { type: 'string' },
        keyPoints: { type: 'array', items: { type: 'string' } },
        statistics: { type: 'array', items: { type: 'object' } },
        visualConcept: { type: 'string' },
        talkingPoints: { type: 'array', items: { type: 'string' } },
        customerQuote: { type: 'string' },
        existingSolutionGaps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'pitch-deck', 'problem-slide']
}));

export const solutionSlideTask = defineTask('solution-slide', (args, taskCtx) => ({
  kind: 'agent',
  title: `Solution Slide Development - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Pitch Deck Expert',
      task: 'Create compelling solution slide content',
      context: {
        companyName: args.companyName,
        solution: args.solution,
        problemSlide: args.problemSlide
      },
      instructions: [
        '1. Present solution clearly and simply',
        '2. Show how it directly addresses the problem',
        '3. Highlight key differentiating features',
        '4. Include product screenshot or demo visual',
        '5. Explain the magic/technology briefly',
        '6. Show customer benefit/outcome',
        '7. Keep technical details minimal',
        '8. Create "aha moment" for investors',
        '9. Develop presenter talking points',
        '10. Include proof point or early result'
      ],
      outputFormat: 'JSON object with solution slide content'
    },
    outputSchema: {
      type: 'object',
      required: ['headline', 'solutionStatement', 'keyFeatures'],
      properties: {
        headline: { type: 'string' },
        solutionStatement: { type: 'string' },
        keyFeatures: { type: 'array', items: { type: 'string' } },
        differentiators: { type: 'array', items: { type: 'string' } },
        visualConcept: { type: 'string' },
        customerOutcome: { type: 'string' },
        ahaStatement: { type: 'string' },
        talkingPoints: { type: 'array', items: { type: 'string' } },
        proofPoint: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'pitch-deck', 'solution-slide']
}));

export const marketSlideTask = defineTask('market-slide', (args, taskCtx) => ({
  kind: 'agent',
  title: `Market Opportunity Slide - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Pitch Deck Expert',
      task: 'Create compelling market opportunity slide',
      context: {
        companyName: args.companyName,
        marketData: args.marketData,
        solution: args.solution
      },
      instructions: [
        '1. Present TAM/SAM/SOM clearly',
        '2. Show market size with credible sources',
        '3. Highlight market growth rate',
        '4. Explain "why now" market timing',
        '5. Show market trends supporting growth',
        '6. Make numbers credible and defensible',
        '7. Create visual market size representation',
        '8. Show beachhead market strategy',
        '9. Develop presenter talking points',
        '10. Connect market to revenue potential'
      ],
      outputFormat: 'JSON object with market slide content'
    },
    outputSchema: {
      type: 'object',
      required: ['headline', 'tam', 'sam', 'som'],
      properties: {
        headline: { type: 'string' },
        tam: { type: 'string' },
        sam: { type: 'string' },
        som: { type: 'string' },
        growthRate: { type: 'string' },
        whyNow: { type: 'array', items: { type: 'string' } },
        marketTrends: { type: 'array', items: { type: 'string' } },
        visualConcept: { type: 'string' },
        beachheadStrategy: { type: 'string' },
        talkingPoints: { type: 'array', items: { type: 'string' } },
        sources: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'pitch-deck', 'market-slide']
}));

export const businessModelSlideTask = defineTask('business-model-slide', (args, taskCtx) => ({
  kind: 'agent',
  title: `Business Model Slide - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Pitch Deck Expert',
      task: 'Create compelling business model slide',
      context: {
        companyName: args.companyName,
        businessModel: args.businessModel,
        solution: args.solution
      },
      instructions: [
        '1. Explain how the company makes money',
        '2. Show pricing model and tiers',
        '3. Present unit economics (if available)',
        '4. Show revenue streams',
        '5. Explain customer acquisition strategy',
        '6. Show path to profitability logic',
        '7. Create visual business model diagram',
        '8. Highlight recurring revenue aspects',
        '9. Develop presenter talking points',
        '10. Show expansion revenue potential'
      ],
      outputFormat: 'JSON object with business model slide content'
    },
    outputSchema: {
      type: 'object',
      required: ['headline', 'revenueModel', 'pricing'],
      properties: {
        headline: { type: 'string' },
        revenueModel: { type: 'string' },
        revenueStreams: { type: 'array', items: { type: 'string' } },
        pricing: { type: 'object' },
        unitEconomics: { type: 'object' },
        acquisitionStrategy: { type: 'string' },
        visualConcept: { type: 'string' },
        recurringRevenue: { type: 'string' },
        expansionPotential: { type: 'string' },
        talkingPoints: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'pitch-deck', 'business-model-slide']
}));

export const tractionSlideTask = defineTask('traction-slide', (args, taskCtx) => ({
  kind: 'agent',
  title: `Traction Slide - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Pitch Deck Expert',
      task: 'Create compelling traction slide',
      context: {
        companyName: args.companyName,
        traction: args.traction
      },
      instructions: [
        '1. Highlight key metrics and milestones',
        '2. Show growth trajectory visually',
        '3. Include customer logos if available',
        '4. Present revenue or user growth',
        '5. Show engagement or retention metrics',
        '6. Include testimonials or social proof',
        '7. Present partnerships or notable wins',
        '8. Create growth chart visualization',
        '9. Develop presenter talking points',
        '10. Show momentum and trajectory'
      ],
      outputFormat: 'JSON object with traction slide content'
    },
    outputSchema: {
      type: 'object',
      required: ['headline', 'keyMetrics', 'milestones'],
      properties: {
        headline: { type: 'string' },
        keyMetrics: { type: 'array', items: { type: 'object' } },
        milestones: { type: 'array', items: { type: 'object' } },
        growthRate: { type: 'string' },
        customerLogos: { type: 'array', items: { type: 'string' } },
        testimonials: { type: 'array', items: { type: 'string' } },
        partnerships: { type: 'array', items: { type: 'string' } },
        visualConcept: { type: 'string' },
        talkingPoints: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'pitch-deck', 'traction-slide']
}));

export const teamSlideTask = defineTask('team-slide', (args, taskCtx) => ({
  kind: 'agent',
  title: `Team Slide - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Pitch Deck Expert',
      task: 'Create compelling team slide',
      context: {
        companyName: args.companyName,
        team: args.team
      },
      instructions: [
        '1. Highlight founder credentials and expertise',
        '2. Show relevant experience for this problem',
        '3. Include notable company logos from backgrounds',
        '4. Present team complementarity',
        '5. Show advisor and board members',
        '6. Highlight domain expertise',
        '7. Include photos and titles',
        '8. Show unfair advantage from team',
        '9. Develop presenter talking points',
        '10. Present "why this team wins"'
      ],
      outputFormat: 'JSON object with team slide content'
    },
    outputSchema: {
      type: 'object',
      required: ['headline', 'founders', 'teamStrength'],
      properties: {
        headline: { type: 'string' },
        founders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              role: { type: 'string' },
              background: { type: 'string' },
              relevantExperience: { type: 'string' }
            }
          }
        },
        advisors: { type: 'array', items: { type: 'object' } },
        teamStrength: { type: 'string' },
        complementarity: { type: 'string' },
        unfairAdvantage: { type: 'string' },
        visualConcept: { type: 'string' },
        talkingPoints: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'pitch-deck', 'team-slide']
}));

export const competitiveSlideTask = defineTask('competitive-slide', (args, taskCtx) => ({
  kind: 'agent',
  title: `Competitive Advantage Slide - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Pitch Deck Expert',
      task: 'Create compelling competitive advantage slide',
      context: {
        companyName: args.companyName,
        solution: args.solution,
        marketData: args.marketData
      },
      instructions: [
        '1. Show competitive landscape simply',
        '2. Highlight differentiation clearly',
        '3. Create positioning matrix or comparison',
        '4. Show sustainable competitive advantages',
        '5. Address known competitors investors know',
        '6. Show moats and barriers being built',
        '7. Avoid badmouthing competitors',
        '8. Present unique approach or insight',
        '9. Develop presenter talking points',
        '10. Show why you win against alternatives'
      ],
      outputFormat: 'JSON object with competitive slide content'
    },
    outputSchema: {
      type: 'object',
      required: ['headline', 'competitors', 'differentiation'],
      properties: {
        headline: { type: 'string' },
        competitors: { type: 'array', items: { type: 'string' } },
        positioningMatrix: { type: 'object' },
        differentiation: { type: 'array', items: { type: 'string' } },
        moats: { type: 'array', items: { type: 'string' } },
        whyWeWin: { type: 'string' },
        visualConcept: { type: 'string' },
        talkingPoints: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'pitch-deck', 'competitive-slide']
}));

export const askSlideTask = defineTask('ask-slide', (args, taskCtx) => ({
  kind: 'agent',
  title: `Financials and Ask Slide - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Pitch Deck Expert',
      task: 'Create compelling ask slide',
      context: {
        companyName: args.companyName,
        fundingAsk: args.fundingAsk,
        businessModel: args.businessModel
      },
      instructions: [
        '1. State funding amount clearly',
        '2. Show use of funds breakdown',
        '3. Present milestones funds will achieve',
        '4. Show runway and timeline',
        '5. Present financial projections summary',
        '6. Include valuation context if appropriate',
        '7. Show path to next round',
        '8. Create clear call-to-action',
        '9. Develop presenter talking points',
        '10. End with memorable closing statement'
      ],
      outputFormat: 'JSON object with ask slide content'
    },
    outputSchema: {
      type: 'object',
      required: ['headline', 'fundingAmount', 'useOfFunds'],
      properties: {
        headline: { type: 'string' },
        fundingAmount: { type: 'string' },
        useOfFunds: { type: 'array', items: { type: 'object' } },
        milestones: { type: 'array', items: { type: 'object' } },
        runway: { type: 'string' },
        projectionsSummary: { type: 'object' },
        pathToNextRound: { type: 'string' },
        callToAction: { type: 'string' },
        closingStatement: { type: 'string' },
        talkingPoints: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'pitch-deck', 'ask-slide']
}));

export const deckAssemblyTask = defineTask('deck-assembly', (args, taskCtx) => ({
  kind: 'agent',
  title: `Deck Assembly - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Pitch Deck Expert',
      task: 'Assemble complete pitch deck with optimal flow',
      context: {
        companyName: args.companyName,
        narrativeArc: args.narrativeArc,
        problemSlide: args.problemSlide,
        solutionSlide: args.solutionSlide,
        marketSlide: args.marketSlide,
        businessModelSlide: args.businessModelSlide,
        tractionSlide: args.tractionSlide,
        teamSlide: args.teamSlide,
        competitiveSlide: args.competitiveSlide,
        askSlide: args.askSlide
      },
      instructions: [
        '1. Arrange slides in optimal narrative order',
        '2. Create title slide with logo and tagline',
        '3. Ensure smooth transitions between slides',
        '4. Check for consistent messaging',
        '5. Verify visual design consistency',
        '6. Add slide numbers',
        '7. Create backup slide order',
        '8. Verify timing for each slide',
        '9. Check for information redundancy',
        '10. Finalize deck structure'
      ],
      outputFormat: 'JSON object with assembled deck'
    },
    outputSchema: {
      type: 'object',
      required: ['slides', 'flow', 'slideCount'],
      properties: {
        slides: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              number: { type: 'number' },
              title: { type: 'string' },
              type: { type: 'string' },
              timing: { type: 'string' }
            }
          }
        },
        flow: { type: 'array', items: { type: 'string' } },
        slideCount: { type: 'number' },
        titleSlide: { type: 'object' },
        designGuidelines: { type: 'object' },
        transitionNotes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'pitch-deck', 'assembly']
}));

export const presenterNotesTask = defineTask('presenter-notes', (args, taskCtx) => ({
  kind: 'agent',
  title: `Presenter Notes - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Presentation Coach',
      task: 'Create comprehensive presenter notes and feedback guide',
      context: {
        companyName: args.companyName,
        deckAssembly: args.deckAssembly
      },
      instructions: [
        '1. Create detailed speaker notes for each slide',
        '2. Include timing guidance per slide',
        '3. Add transition phrases between slides',
        '4. Include potential Q&A questions per section',
        '5. Add emphasis points and pauses',
        '6. Create recovery phrases for stumbles',
        '7. Include feedback collection guide',
        '8. Add practice session structure',
        '9. Create common objection responses',
        '10. Include closing and next steps script'
      ],
      outputFormat: 'JSON object with presenter notes'
    },
    outputSchema: {
      type: 'object',
      required: ['notes', 'feedbackGuide'],
      properties: {
        notes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              slide: { type: 'number' },
              speakerNotes: { type: 'string' },
              timing: { type: 'string' },
              emphasis: { type: 'array', items: { type: 'string' } },
              transition: { type: 'string' },
              potentialQuestions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        commonObjections: { type: 'array', items: { type: 'object' } },
        practiceGuide: { type: 'object' },
        feedbackGuide: {
          type: 'object',
          properties: {
            questions: { type: 'array', items: { type: 'string' } },
            metrics: { type: 'array', items: { type: 'string' } }
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
  labels: ['entrepreneurship', 'pitch-deck', 'presenter-notes']
}));

export const appendixSlidesTask = defineTask('appendix-slides', (args, taskCtx) => ({
  kind: 'agent',
  title: `Appendix Slides - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Pitch Deck Expert',
      task: 'Create comprehensive appendix slides for deep-dive questions',
      context: {
        companyName: args.companyName,
        marketData: args.marketData,
        traction: args.traction,
        businessModel: args.businessModel
      },
      instructions: [
        '1. Create detailed financial projections slide',
        '2. Add detailed market sizing methodology',
        '3. Create product roadmap slide',
        '4. Add detailed competitive analysis',
        '5. Create go-to-market detail slide',
        '6. Add customer case study details',
        '7. Create technology architecture overview',
        '8. Add detailed team bios',
        '9. Create cap table overview',
        '10. Add key terms and definitions'
      ],
      outputFormat: 'JSON object with appendix slides'
    },
    outputSchema: {
      type: 'object',
      required: ['slides'],
      properties: {
        slides: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              content: { type: 'object' },
              useCase: { type: 'string' }
            }
          }
        },
        financialDetails: { type: 'object' },
        marketMethodology: { type: 'object' },
        productRoadmap: { type: 'object' },
        competitiveDetail: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'pitch-deck', 'appendix']
}));
