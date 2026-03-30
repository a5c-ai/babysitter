/**
 * @process specializations/domains/business/entrepreneurship/demo-day-presentation
 * @description Demo Day Presentation Preparation Process - Process to prepare founders for high-stakes demo day presentations at accelerators and investor events.
 * @inputs { companyName: string, product: string, keyMetrics: object, demoType: string, timeLimit?: number, eventContext?: string }
 * @outputs { success: boolean, presentationDeck: object, script: string, demoStrategy: object, qaPreparation: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/entrepreneurship/demo-day-presentation', {
 *   companyName: 'InnovateTech',
 *   product: 'AI-powered customer service platform',
 *   keyMetrics: { mrr: 50000, customers: 100, growth: '20% MoM' },
 *   demoType: 'Y Combinator Demo Day',
 *   timeLimit: 120
 * });
 *
 * @references
 * - Y Combinator Demo Day: https://www.ycombinator.com/
 * - Techstars Demo Day: https://www.techstars.com/
 * - Demo Day Best Practices
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    companyName,
    product,
    keyMetrics = {},
    demoType,
    timeLimit = 180,
    eventContext = ''
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Demo Day Preparation for ${companyName}`);

  // Phase 1: Presentation Narrative
  const presentationNarrative = await ctx.task(presentationNarrativeTask, {
    companyName,
    product,
    keyMetrics,
    timeLimit
  });

  artifacts.push(...(presentationNarrative.artifacts || []));

  // Phase 2: Hook Development
  const hookDevelopment = await ctx.task(hookDevelopmentTask, {
    companyName,
    product,
    presentationNarrative
  });

  artifacts.push(...(hookDevelopment.artifacts || []));

  // Phase 3: Demo Strategy
  const demoStrategy = await ctx.task(demoStrategyTask, {
    companyName,
    product,
    demoType,
    timeLimit
  });

  artifacts.push(...(demoStrategy.artifacts || []));

  // Phase 4: Slide Design
  const slideDesign = await ctx.task(slideDesignTask, {
    companyName,
    presentationNarrative,
    keyMetrics,
    timeLimit
  });

  artifacts.push(...(slideDesign.artifacts || []));

  // Phase 5: Script Development
  const scriptDevelopment = await ctx.task(scriptDevelopmentTask, {
    companyName,
    presentationNarrative,
    hookDevelopment,
    slideDesign,
    timeLimit
  });

  artifacts.push(...(scriptDevelopment.artifacts || []));

  // Breakpoint: Review presentation structure
  await ctx.breakpoint({
    question: `Review demo day presentation for ${companyName}. Time: ${timeLimit}s, Hook: "${hookDevelopment.primaryHook}". Ready for rehearsal prep?`,
    title: 'Demo Day Presentation Review',
    context: {
      runId: ctx.runId,
      companyName,
      timeLimit,
      slideCount: slideDesign.slideCount,
      files: artifacts
    }
  });

  // Phase 6: Closing and CTA
  const closingCTA = await ctx.task(closingCTATask, {
    companyName,
    eventContext,
    keyMetrics
  });

  artifacts.push(...(closingCTA.artifacts || []));

  // Phase 7: Rehearsal Plan
  const rehearsalPlan = await ctx.task(rehearsalPlanTask, {
    companyName,
    scriptDevelopment,
    timeLimit,
    demoStrategy
  });

  artifacts.push(...(rehearsalPlan.artifacts || []));

  // Phase 8: Q&A Preparation
  const qaPreparation = await ctx.task(qaPreparationTask, {
    companyName,
    product,
    keyMetrics,
    eventContext
  });

  artifacts.push(...(qaPreparation.artifacts || []));

  // Final Breakpoint: Complete preparation
  await ctx.breakpoint({
    question: `Demo day preparation complete for ${companyName}. Script ready, ${qaPreparation.questionCount} Q&A responses prepared. Ready for rehearsals?`,
    title: 'Demo Day Preparation Complete',
    context: {
      runId: ctx.runId,
      companyName,
      scriptLength: scriptDevelopment.wordCount,
      estimatedTime: scriptDevelopment.estimatedTime,
      qaCount: qaPreparation.questionCount,
      files: artifacts
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    companyName,
    presentationDeck: {
      slides: slideDesign.slides,
      narrative: presentationNarrative,
      hook: hookDevelopment
    },
    script: scriptDevelopment.fullScript,
    demoStrategy: demoStrategy,
    closingCTA: closingCTA,
    qaPreparation: qaPreparation,
    rehearsalPlan: rehearsalPlan,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/business/entrepreneurship/demo-day-presentation',
      timestamp: startTime,
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const presentationNarrativeTask = defineTask('presentation-narrative', (args, taskCtx) => ({
  kind: 'agent',
  title: `Presentation Narrative - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Demo Day Presentation Coach',
      task: 'Craft compelling 2-3 minute presentation narrative',
      context: {
        companyName: args.companyName,
        product: args.product,
        keyMetrics: args.keyMetrics,
        timeLimit: args.timeLimit
      },
      instructions: [
        '1. Create attention-grabbing opening (first 10 seconds)',
        '2. Establish credibility and traction quickly',
        '3. Present problem in relatable, memorable way',
        '4. Show solution with visual impact',
        '5. Highlight key metrics and growth',
        '6. Build to climactic closing',
        '7. End with memorable call-to-action',
        '8. Optimize for time constraint',
        '9. Include emotional beats',
        '10. Create narrative flow map'
      ],
      outputFormat: 'JSON object with presentation narrative'
    },
    outputSchema: {
      type: 'object',
      required: ['narrativeArc', 'keyBeats', 'emotionalFlow'],
      properties: {
        narrativeArc: { type: 'string' },
        keyBeats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              beat: { type: 'string' },
              timing: { type: 'string' },
              purpose: { type: 'string' }
            }
          }
        },
        emotionalFlow: { type: 'array', items: { type: 'string' } },
        openingStatement: { type: 'string' },
        closingStatement: { type: 'string' },
        flowMap: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'demo-day', 'narrative']
}));

export const hookDevelopmentTask = defineTask('hook-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Hook Development - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Demo Day Presentation Expert',
      task: 'Develop memorable hooks and attention grabbers',
      context: {
        companyName: args.companyName,
        product: args.product,
        presentationNarrative: args.presentationNarrative
      },
      instructions: [
        '1. Create 3-5 alternative opening hooks',
        '2. Test hooks for memorability and impact',
        '3. Develop supporting visual for hook',
        '4. Create follow-up statement for each hook',
        '5. Identify best hook for audience type',
        '6. Create backup hooks if primary falls flat',
        '7. Time hook delivery options',
        '8. Add gesture and staging notes',
        '9. Test for clarity and understanding',
        '10. Select primary hook with rationale'
      ],
      outputFormat: 'JSON object with hook options'
    },
    outputSchema: {
      type: 'object',
      required: ['primaryHook', 'alternativeHooks'],
      properties: {
        primaryHook: { type: 'string' },
        primaryHookRationale: { type: 'string' },
        alternativeHooks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              hook: { type: 'string' },
              type: { type: 'string' },
              bestFor: { type: 'string' }
            }
          }
        },
        visualSupport: { type: 'object' },
        deliveryNotes: { type: 'array', items: { type: 'string' } },
        followUpStatement: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'demo-day', 'hook']
}));

export const demoStrategyTask = defineTask('demo-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Demo Strategy - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Product Demo Specialist',
      task: 'Design product demo or visualization strategy',
      context: {
        companyName: args.companyName,
        product: args.product,
        demoType: args.demoType,
        timeLimit: args.timeLimit
      },
      instructions: [
        '1. Determine if live demo or recorded demo',
        '2. Identify key product moments to show',
        '3. Design demo flow for impact',
        '4. Plan backup for demo failures',
        '5. Create visual alternatives if demo not possible',
        '6. Time demo within overall presentation',
        '7. Identify tech setup requirements',
        '8. Plan transitions into and out of demo',
        '9. Create "wow moment" in demo',
        '10. Prepare for technical difficulties'
      ],
      outputFormat: 'JSON object with demo strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['demoApproach', 'keyMoments', 'backupPlan'],
      properties: {
        demoApproach: { type: 'string' },
        liveVsRecorded: { type: 'string' },
        keyMoments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              moment: { type: 'string' },
              timing: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        demoFlow: { type: 'array', items: { type: 'string' } },
        wowMoment: { type: 'string' },
        techRequirements: { type: 'array', items: { type: 'string' } },
        backupPlan: { type: 'object' },
        transitionScript: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'demo-day', 'demo-strategy']
}));

export const slideDesignTask = defineTask('slide-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Slide Design - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Demo Day Visual Designer',
      task: 'Design minimal, high-impact slides for demo day',
      context: {
        companyName: args.companyName,
        presentationNarrative: args.presentationNarrative,
        keyMetrics: args.keyMetrics,
        timeLimit: args.timeLimit
      },
      instructions: [
        '1. Design 5-8 slides maximum for short format',
        '2. Use large fonts and minimal text',
        '3. Create impactful visuals for each slide',
        '4. Design metrics slides for maximum impact',
        '5. Include compelling product visuals',
        '6. Use consistent brand colors',
        '7. Add subtle animations if appropriate',
        '8. Design slides for stage visibility',
        '9. Create speaker cue points',
        '10. Test slides for readability at distance'
      ],
      outputFormat: 'JSON object with slide design'
    },
    outputSchema: {
      type: 'object',
      required: ['slides', 'slideCount', 'designGuidelines'],
      properties: {
        slides: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              number: { type: 'number' },
              title: { type: 'string' },
              content: { type: 'object' },
              visualConcept: { type: 'string' },
              speakerCue: { type: 'string' },
              duration: { type: 'number' }
            }
          }
        },
        slideCount: { type: 'number' },
        designGuidelines: { type: 'object' },
        transitionTypes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'demo-day', 'slide-design']
}));

export const scriptDevelopmentTask = defineTask('script-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Script Development - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Demo Day Script Writer',
      task: 'Write word-for-word presentation script',
      context: {
        companyName: args.companyName,
        presentationNarrative: args.presentationNarrative,
        hookDevelopment: args.hookDevelopment,
        slideDesign: args.slideDesign,
        timeLimit: args.timeLimit
      },
      instructions: [
        '1. Write complete script with timing markers',
        '2. Include pause and emphasis notations',
        '3. Write natural, conversational language',
        '4. Add slide transition cues',
        '5. Include demo narration if applicable',
        '6. Time script to fit time limit',
        '7. Add recovery phrases for mistakes',
        '8. Include gesture and movement notes',
        '9. Write alternative phrases for key points',
        '10. Optimize for delivery clarity'
      ],
      outputFormat: 'JSON object with full script'
    },
    outputSchema: {
      type: 'object',
      required: ['fullScript', 'wordCount', 'estimatedTime'],
      properties: {
        fullScript: { type: 'string' },
        scriptBySlide: { type: 'array', items: { type: 'object' } },
        wordCount: { type: 'number' },
        estimatedTime: { type: 'number' },
        timingMarkers: { type: 'array', items: { type: 'object' } },
        emphasisPoints: { type: 'array', items: { type: 'string' } },
        recoveryPhrases: { type: 'array', items: { type: 'string' } },
        gestureNotes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'demo-day', 'script']
}));

export const closingCTATask = defineTask('closing-cta', (args, taskCtx) => ({
  kind: 'agent',
  title: `Closing and CTA - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Demo Day Closing Expert',
      task: 'Develop memorable closing and call-to-action',
      context: {
        companyName: args.companyName,
        eventContext: args.eventContext,
        keyMetrics: args.keyMetrics
      },
      instructions: [
        '1. Create memorable closing statement',
        '2. Design clear call-to-action',
        '3. Include specific next step for investors',
        '4. Create urgency without desperation',
        '5. Reinforce key value proposition',
        '6. End on emotional high note',
        '7. Include company name prominently',
        '8. Design visual for closing slide',
        '9. Plan post-presentation availability',
        '10. Create follow-up mechanism'
      ],
      outputFormat: 'JSON object with closing and CTA'
    },
    outputSchema: {
      type: 'object',
      required: ['closingStatement', 'callToAction'],
      properties: {
        closingStatement: { type: 'string' },
        callToAction: { type: 'string' },
        urgencyElement: { type: 'string' },
        valueReinforcement: { type: 'string' },
        closingVisual: { type: 'object' },
        postPresentationPlan: { type: 'object' },
        followUpMechanism: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'demo-day', 'closing']
}));

export const rehearsalPlanTask = defineTask('rehearsal-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Rehearsal Plan - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Presentation Coach',
      task: 'Create structured rehearsal plan for demo day',
      context: {
        companyName: args.companyName,
        scriptDevelopment: args.scriptDevelopment,
        timeLimit: args.timeLimit,
        demoStrategy: args.demoStrategy
      },
      instructions: [
        '1. Create rehearsal schedule leading to event',
        '2. Design progressive practice approach',
        '3. Include feedback collection methods',
        '4. Plan video recording sessions',
        '5. Create timing drills',
        '6. Plan audience practice sessions',
        '7. Include tech rehearsal requirements',
        '8. Design stress inoculation exercises',
        '9. Create performance benchmarks',
        '10. Plan final dress rehearsal'
      ],
      outputFormat: 'JSON object with rehearsal plan'
    },
    outputSchema: {
      type: 'object',
      required: ['schedule', 'practiceApproach', 'benchmarks'],
      properties: {
        schedule: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              day: { type: 'string' },
              focus: { type: 'string' },
              activities: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        practiceApproach: { type: 'object' },
        feedbackMethods: { type: 'array', items: { type: 'string' } },
        timingDrills: { type: 'array', items: { type: 'object' } },
        stressExercises: { type: 'array', items: { type: 'string' } },
        benchmarks: {
          type: 'object',
          properties: {
            timing: { type: 'string' },
            delivery: { type: 'string' },
            impact: { type: 'string' }
          }
        },
        dressRehearsalChecklist: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'demo-day', 'rehearsal']
}));

export const qaPreparationTask = defineTask('qa-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Q&A Preparation - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Investor Q&A Coach',
      task: 'Prepare for post-presentation Q&A and follow-up conversations',
      context: {
        companyName: args.companyName,
        product: args.product,
        keyMetrics: args.keyMetrics,
        eventContext: args.eventContext
      },
      instructions: [
        '1. Anticipate top 20 likely questions',
        '2. Prepare concise, compelling answers',
        '3. Identify tough questions and prepare responses',
        '4. Create bridging techniques for difficult questions',
        '5. Prepare supporting data points',
        '6. Practice answer delivery',
        '7. Prepare "I don\'t know" responses',
        '8. Create follow-up conversation starters',
        '9. Prepare for technical deep-dives',
        '10. Design investor meeting conversion strategy'
      ],
      outputFormat: 'JSON object with Q&A preparation'
    },
    outputSchema: {
      type: 'object',
      required: ['likelyQuestions', 'toughQuestions', 'questionCount'],
      properties: {
        likelyQuestions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              answer: { type: 'string' },
              supportingData: { type: 'string' }
            }
          }
        },
        toughQuestions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              answer: { type: 'string' },
              bridgingTechnique: { type: 'string' }
            }
          }
        },
        questionCount: { type: 'number' },
        idkResponses: { type: 'array', items: { type: 'string' } },
        conversationStarters: { type: 'array', items: { type: 'string' } },
        meetingConversionStrategy: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'demo-day', 'qa-preparation']
}));
