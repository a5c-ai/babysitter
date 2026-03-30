/**
 * @process specializations/domains/business/entrepreneurship/investor-update-communication
 * @description Investor Update Communication Process - Regular cadence process for communicating with existing and potential investors to maintain relationships and support.
 * @inputs { companyName: string, period: string, metrics: object, wins?: array, challenges?: array, asks?: array }
 * @outputs { success: boolean, updateTemplate: object, mailingList: object, engagementTracking: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/entrepreneurship/investor-update-communication', {
 *   companyName: 'StartupCo',
 *   period: 'January 2026',
 *   metrics: { mrr: 100000, growth: '15%' },
 *   wins: ['Closed first enterprise deal'],
 *   asks: ['Intros to CFOs at F500']
 * });
 *
 * @references
 * - YC Investor Update Templates: https://www.ycombinator.com/library/
 * - First Round Review: https://review.firstround.com/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    companyName,
    period,
    metrics = {},
    wins = [],
    challenges = [],
    asks = []
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Investor Update for ${companyName} - ${period}`);

  // Phase 1: Update Structure Design
  const updateStructure = await ctx.task(updateStructureTask, {
    companyName,
    period
  });

  artifacts.push(...(updateStructure.artifacts || []));

  // Phase 2: Metrics Summary
  const metricsSummary = await ctx.task(metricsSummaryTask, {
    companyName,
    period,
    metrics
  });

  artifacts.push(...(metricsSummary.artifacts || []));

  // Phase 3: Wins Highlights
  const winsHighlights = await ctx.task(winsHighlightsTask, {
    companyName,
    wins
  });

  artifacts.push(...(winsHighlights.artifacts || []));

  // Phase 4: Challenges Section
  const challengesSection = await ctx.task(challengesSectionTask, {
    companyName,
    challenges
  });

  artifacts.push(...(challengesSection.artifacts || []));

  // Phase 5: Asks and Help Needed
  const asksSection = await ctx.task(asksSectionTask, {
    companyName,
    asks
  });

  artifacts.push(...(asksSection.artifacts || []));

  // Phase 6: Update Assembly
  const updateAssembly = await ctx.task(updateAssemblyTask, {
    companyName,
    period,
    updateStructure,
    metricsSummary,
    winsHighlights,
    challengesSection,
    asksSection
  });

  artifacts.push(...(updateAssembly.artifacts || []));

  // Phase 7: Distribution Strategy
  const distributionStrategy = await ctx.task(distributionStrategyTask, {
    companyName
  });

  artifacts.push(...(distributionStrategy.artifacts || []));

  // Phase 8: Engagement Tracking
  const engagementTracking = await ctx.task(engagementTrackingTask, {
    companyName
  });

  artifacts.push(...(engagementTracking.artifacts || []));

  // Breakpoint: Review update
  await ctx.breakpoint({
    question: `Review investor update for ${companyName} - ${period}. Ready to send to investor list?`,
    title: 'Investor Update Review',
    context: {
      runId: ctx.runId,
      companyName,
      period,
      files: artifacts
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    companyName,
    period,
    updateTemplate: updateAssembly,
    mailingList: distributionStrategy,
    engagementTracking: engagementTracking,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/business/entrepreneurship/investor-update-communication',
      timestamp: startTime,
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const updateStructureTask = defineTask('update-structure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Update Structure Design - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Investor Relations Expert',
      task: 'Design investor update structure and format',
      context: {
        companyName: args.companyName,
        period: args.period
      },
      instructions: [
        '1. Define update frequency (monthly/quarterly)',
        '2. Create consistent section structure',
        '3. Design scannable format for busy investors',
        '4. Include TL;DR summary at top',
        '5. Define metrics to include consistently',
        '6. Create visual elements approach',
        '7. Plan for different investor tiers',
        '8. Design call-to-action placement',
        '9. Set word count targets',
        '10. Create template for consistency'
      ],
      outputFormat: 'JSON object with update structure'
    },
    outputSchema: {
      type: 'object',
      required: ['structure', 'format', 'sections'],
      properties: {
        structure: { type: 'object' },
        format: { type: 'object' },
        sections: { type: 'array', items: { type: 'string' } },
        tldrTemplate: { type: 'string' },
        wordCountTarget: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'investor-updates', 'structure']
}));

export const metricsSummaryTask = defineTask('metrics-summary', (args, taskCtx) => ({
  kind: 'agent',
  title: `Metrics Summary - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Startup Metrics Expert',
      task: 'Create metrics summary for investor update',
      context: {
        companyName: args.companyName,
        period: args.period,
        metrics: args.metrics
      },
      instructions: [
        '1. Present key metrics clearly (MRR, ARR, growth)',
        '2. Show month-over-month changes',
        '3. Include runway and burn rate',
        '4. Show customer metrics (new, churn, NRR)',
        '5. Include team metrics',
        '6. Show metrics vs. targets',
        '7. Use traffic light indicators',
        '8. Add brief commentary on trends',
        '9. Keep format consistent month to month',
        '10. Highlight significant changes'
      ],
      outputFormat: 'JSON object with metrics summary'
    },
    outputSchema: {
      type: 'object',
      required: ['metrics', 'highlights', 'trends'],
      properties: {
        metrics: { type: 'array', items: { type: 'object' } },
        highlights: { type: 'array', items: { type: 'string' } },
        trends: { type: 'object' },
        commentary: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'investor-updates', 'metrics']
}));

export const winsHighlightsTask = defineTask('wins-highlights', (args, taskCtx) => ({
  kind: 'agent',
  title: `Wins Highlights - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Startup Communication Expert',
      task: 'Write compelling wins section for investor update',
      context: {
        companyName: args.companyName,
        wins: args.wins
      },
      instructions: [
        '1. Lead with biggest win',
        '2. Quantify wins where possible',
        '3. Connect wins to strategy and goals',
        '4. Include customer wins and logos',
        '5. Highlight team wins (hires, promotions)',
        '6. Include product milestones',
        '7. Add partnership announcements',
        '8. Keep concise but impactful',
        '9. Use bullet points for scannability',
        '10. Show momentum and progress'
      ],
      outputFormat: 'JSON object with wins highlights'
    },
    outputSchema: {
      type: 'object',
      required: ['wins', 'topWin'],
      properties: {
        wins: { type: 'array', items: { type: 'string' } },
        topWin: { type: 'string' },
        customerWins: { type: 'array', items: { type: 'string' } },
        teamWins: { type: 'array', items: { type: 'string' } },
        productWins: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'investor-updates', 'wins']
}));

export const challengesSectionTask = defineTask('challenges-section', (args, taskCtx) => ({
  kind: 'agent',
  title: `Challenges Section - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Investor Communication Expert',
      task: 'Write honest challenges section for investor update',
      context: {
        companyName: args.companyName,
        challenges: args.challenges
      },
      instructions: [
        '1. Be honest about challenges (builds trust)',
        '2. Frame challenges with context',
        '3. Show awareness and ownership',
        '4. Include mitigation plans',
        '5. Ask for specific help where useful',
        '6. Avoid excessive negativity',
        '7. Show learning from challenges',
        '8. Connect to how investors can help',
        '9. Keep proportionate to wins',
        '10. Update on previous challenges'
      ],
      outputFormat: 'JSON object with challenges section'
    },
    outputSchema: {
      type: 'object',
      required: ['challenges', 'mitigations'],
      properties: {
        challenges: { type: 'array', items: { type: 'string' } },
        mitigations: { type: 'array', items: { type: 'string' } },
        helpNeeded: { type: 'array', items: { type: 'string' } },
        previousChallengesUpdate: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'investor-updates', 'challenges']
}));

export const asksSectionTask = defineTask('asks-section', (args, taskCtx) => ({
  kind: 'agent',
  title: `Asks Section - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Investor Relations Expert',
      task: 'Create specific asks for investor help',
      context: {
        companyName: args.companyName,
        asks: args.asks
      },
      instructions: [
        '1. Make asks specific and actionable',
        '2. Include intro requests with context',
        '3. Ask for expertise and advice',
        '4. Include hiring help requests',
        '5. Make asks easy to fulfill',
        '6. Limit to 2-3 key asks',
        '7. Include clear next steps',
        '8. Thank investors for past help',
        '9. Rotate asks to different investors',
        '10. Track ask fulfillment'
      ],
      outputFormat: 'JSON object with asks section'
    },
    outputSchema: {
      type: 'object',
      required: ['asks', 'priorityAsk'],
      properties: {
        asks: { type: 'array', items: { type: 'object' } },
        priorityAsk: { type: 'string' },
        introRequests: { type: 'array', items: { type: 'string' } },
        expertiseNeeded: { type: 'array', items: { type: 'string' } },
        hiringHelp: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'investor-updates', 'asks']
}));

export const updateAssemblyTask = defineTask('update-assembly', (args, taskCtx) => ({
  kind: 'agent',
  title: `Update Assembly - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Investor Communication Writer',
      task: 'Assemble complete investor update',
      context: {
        companyName: args.companyName,
        period: args.period,
        updateStructure: args.updateStructure,
        metricsSummary: args.metricsSummary,
        winsHighlights: args.winsHighlights,
        challengesSection: args.challengesSection,
        asksSection: args.asksSection
      },
      instructions: [
        '1. Write compelling subject line',
        '2. Create TL;DR summary (3-5 bullets)',
        '3. Assemble sections in order',
        '4. Add personal opening note',
        '5. Include looking ahead section',
        '6. Add closing thank you',
        '7. Include contact information',
        '8. Add unsubscribe option',
        '9. Review for tone and length',
        '10. Create both text and HTML versions'
      ],
      outputFormat: 'JSON object with assembled update'
    },
    outputSchema: {
      type: 'object',
      required: ['fullUpdate', 'subjectLine', 'tldr'],
      properties: {
        fullUpdate: { type: 'string' },
        subjectLine: { type: 'string' },
        tldr: { type: 'array', items: { type: 'string' } },
        openingNote: { type: 'string' },
        lookingAhead: { type: 'string' },
        closing: { type: 'string' },
        htmlVersion: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'investor-updates', 'assembly']
}));

export const distributionStrategyTask = defineTask('distribution-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Distribution Strategy - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Investor Relations Operations Expert',
      task: 'Create investor update distribution strategy',
      context: {
        companyName: args.companyName
      },
      instructions: [
        '1. Segment investor mailing list',
        '2. Define tier-specific content variations',
        '3. Plan send timing (day/time)',
        '4. Set up email delivery platform',
        '5. Create BCC-friendly distribution',
        '6. Plan for bounce handling',
        '7. Set up reply monitoring',
        '8. Plan for new investor additions',
        '9. Create archive for updates',
        '10. Plan for re-engagement of quiet investors'
      ],
      outputFormat: 'JSON object with distribution strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['segments', 'timing', 'platform'],
      properties: {
        segments: { type: 'array', items: { type: 'object' } },
        timing: { type: 'object' },
        platform: { type: 'string' },
        listManagement: { type: 'object' },
        replyHandling: { type: 'object' },
        archiveProcess: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'investor-updates', 'distribution']
}));

export const engagementTrackingTask = defineTask('engagement-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Engagement Tracking - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Investor Relations Analytics Expert',
      task: 'Set up investor engagement tracking',
      context: {
        companyName: args.companyName
      },
      instructions: [
        '1. Track email open rates',
        '2. Monitor reply rates and content',
        '3. Track ask fulfillment',
        '4. Monitor investor activity patterns',
        '5. Flag disengaged investors',
        '6. Track referrals and intros made',
        '7. Monitor investor sentiment',
        '8. Create engagement dashboard',
        '9. Plan for follow-up actions',
        '10. Set alerts for important changes'
      ],
      outputFormat: 'JSON object with engagement tracking'
    },
    outputSchema: {
      type: 'object',
      required: ['trackingMetrics', 'dashboard'],
      properties: {
        trackingMetrics: { type: 'array', items: { type: 'string' } },
        dashboard: { type: 'object' },
        alerts: { type: 'array', items: { type: 'object' } },
        followUpProcess: { type: 'object' },
        disengagementTriggers: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'investor-updates', 'engagement']
}));
