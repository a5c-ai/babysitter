/**
 * @process venture-capital/ipo-process-management
 * @description Supporting portfolio companies through the IPO process including banker selection, S-1 preparation, roadshow coordination, and post-IPO support
 * @inputs { companyName: string, companyData: object, ipoTimeline: object, marketConditions: object }
 * @outputs { success: boolean, ipoReadiness: object, bankerSelection: object, processTimeline: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    companyName,
    companyData = {},
    ipoTimeline = {},
    marketConditions = {},
    outputDir = 'ipo-process-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: IPO Readiness Assessment
  ctx.log('info', 'Assessing IPO readiness');
  const ipoReadiness = await ctx.task(ipoReadinessTask, {
    companyName,
    companyData,
    marketConditions,
    outputDir
  });

  if (!ipoReadiness.success) {
    return {
      success: false,
      error: 'IPO readiness assessment failed',
      details: ipoReadiness,
      metadata: { processId: 'venture-capital/ipo-process-management', timestamp: startTime }
    };
  }

  artifacts.push(...ipoReadiness.artifacts);

  // Task 2: Investment Banker Selection
  ctx.log('info', 'Managing banker selection process');
  const bankerSelection = await ctx.task(bankerSelectionTask, {
    companyName,
    companyData,
    ipoReadiness,
    outputDir
  });

  artifacts.push(...bankerSelection.artifacts);

  // Task 3: S-1 Preparation Support
  ctx.log('info', 'Supporting S-1 preparation');
  const s1Preparation = await ctx.task(s1PreparationTask, {
    companyName,
    companyData,
    outputDir
  });

  artifacts.push(...s1Preparation.artifacts);

  // Task 4: Equity Story Development
  ctx.log('info', 'Developing equity story');
  const equityStory = await ctx.task(equityStoryTask, {
    companyName,
    companyData,
    marketConditions,
    outputDir
  });

  artifacts.push(...equityStory.artifacts);

  // Task 5: Roadshow Preparation
  ctx.log('info', 'Preparing for roadshow');
  const roadshowPrep = await ctx.task(roadshowPrepTask, {
    companyName,
    equityStory,
    bankerSelection,
    outputDir
  });

  artifacts.push(...roadshowPrep.artifacts);

  // Task 6: Pricing and Allocation Strategy
  ctx.log('info', 'Developing pricing strategy');
  const pricingStrategy = await ctx.task(pricingStrategyTask, {
    companyName,
    companyData,
    marketConditions,
    equityStory,
    outputDir
  });

  artifacts.push(...pricingStrategy.artifacts);

  // Breakpoint: Review IPO preparation
  await ctx.breakpoint({
    question: `IPO preparation complete for ${companyName}. Readiness score: ${ipoReadiness.score}/100. Target valuation: $${pricingStrategy.targetValuation}M. Review preparation?`,
    title: 'IPO Process Management',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        readinessScore: ipoReadiness.score,
        selectedBankers: bankerSelection.selected.length,
        targetValuation: pricingStrategy.targetValuation,
        proposedPriceRange: pricingStrategy.priceRange,
        roadshowDuration: roadshowPrep.duration
      }
    }
  });

  // Task 7: Post-IPO Planning
  ctx.log('info', 'Planning post-IPO support');
  const postIPOPlanning = await ctx.task(postIPOTask, {
    companyName,
    companyData,
    pricingStrategy,
    outputDir
  });

  artifacts.push(...postIPOPlanning.artifacts);

  // Task 8: Generate IPO Process Report
  ctx.log('info', 'Generating IPO process report');
  const ipoReport = await ctx.task(ipoReportTask, {
    companyName,
    ipoReadiness,
    bankerSelection,
    s1Preparation,
    equityStory,
    roadshowPrep,
    pricingStrategy,
    postIPOPlanning,
    ipoTimeline,
    outputDir
  });

  artifacts.push(...ipoReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    ipoReadiness: {
      score: ipoReadiness.score,
      gaps: ipoReadiness.gaps,
      timeline: ipoReadiness.timeline
    },
    bankerSelection: {
      selected: bankerSelection.selected,
      roles: bankerSelection.roles,
      fees: bankerSelection.fees
    },
    processTimeline: {
      s1Filing: s1Preparation.filingDate,
      roadshow: roadshowPrep.schedule,
      pricing: pricingStrategy.pricingDate,
      listing: ipoTimeline.listingDate
    },
    equityStory: equityStory.narrative,
    pricingStrategy: {
      targetValuation: pricingStrategy.targetValuation,
      priceRange: pricingStrategy.priceRange,
      shareOffering: pricingStrategy.shareOffering
    },
    postIPOPlan: postIPOPlanning.plan,
    artifacts,
    duration,
    metadata: {
      processId: 'venture-capital/ipo-process-management',
      timestamp: startTime,
      companyName
    }
  };
}

// Task 1: IPO Readiness Assessment
export const ipoReadinessTask = defineTask('ipo-readiness', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess IPO readiness',
  agent: {
    name: 'ipo-readiness-analyst',
    prompt: {
      role: 'IPO readiness consultant',
      task: 'Assess company readiness for IPO',
      context: args,
      instructions: [
        'Evaluate financial reporting readiness',
        'Assess SOX compliance preparation',
        'Review governance and board composition',
        'Evaluate management team readiness',
        'Assess investor relations capabilities',
        'Review public company infrastructure',
        'Evaluate market conditions and timing',
        'Score overall IPO readiness'
      ],
      outputFormat: 'JSON with IPO readiness assessment and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'score', 'gaps', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        gaps: { type: 'array' },
        timeline: { type: 'object' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'ipo', 'readiness']
}));

// Task 2: Banker Selection
export const bankerSelectionTask = defineTask('banker-selection', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Manage banker selection',
  agent: {
    name: 'banker-advisor',
    prompt: {
      role: 'investment banking advisor',
      task: 'Manage investment banker selection process',
      context: args,
      instructions: [
        'Identify candidate investment banks',
        'Evaluate sector expertise and track record',
        'Assess research coverage capabilities',
        'Review distribution capabilities',
        'Analyze fee structures',
        'Evaluate syndicate composition',
        'Manage bake-off process',
        'Recommend banker selection'
      ],
      outputFormat: 'JSON with banker selection and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['selected', 'roles', 'artifacts'],
      properties: {
        selected: { type: 'array' },
        roles: { type: 'object' },
        fees: { type: 'object' },
        evaluation: { type: 'array' },
        syndicate: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'ipo', 'bankers']
}));

// Task 3: S-1 Preparation Support
export const s1PreparationTask = defineTask('s1-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Support S-1 preparation',
  agent: {
    name: 's1-advisor',
    prompt: {
      role: 'securities filing specialist',
      task: 'Support S-1 registration statement preparation',
      context: args,
      instructions: [
        'Coordinate S-1 drafting process',
        'Review business description sections',
        'Coordinate risk factor drafting',
        'Review MD&A preparation',
        'Coordinate financial statement audits',
        'Manage SEC comment response',
        'Track filing timeline',
        'Coordinate legal working groups'
      ],
      outputFormat: 'JSON with S-1 preparation status and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'filingDate', 'artifacts'],
      properties: {
        status: { type: 'object' },
        filingDate: { type: 'string' },
        sections: { type: 'array' },
        issues: { type: 'array' },
        timeline: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'ipo', 's1']
}));

// Task 4: Equity Story Development
export const equityStoryTask = defineTask('equity-story', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop equity story',
  agent: {
    name: 'equity-story-developer',
    prompt: {
      role: 'investor communications specialist',
      task: 'Develop compelling equity story',
      context: args,
      instructions: [
        'Articulate investment thesis',
        'Define key investment highlights',
        'Develop financial narrative',
        'Create competitive positioning',
        'Define growth strategy story',
        'Prepare management messaging',
        'Develop Q&A preparation',
        'Create presentation framework'
      ],
      outputFormat: 'JSON with equity story and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['narrative', 'highlights', 'artifacts'],
      properties: {
        narrative: { type: 'object' },
        highlights: { type: 'array' },
        messaging: { type: 'object' },
        qanda: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'ipo', 'equity-story']
}));

// Task 5: Roadshow Preparation
export const roadshowPrepTask = defineTask('roadshow-prep', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare for roadshow',
  agent: {
    name: 'roadshow-coordinator',
    prompt: {
      role: 'IPO roadshow coordinator',
      task: 'Prepare for IPO roadshow',
      context: args,
      instructions: [
        'Plan roadshow schedule and cities',
        'Coordinate investor meeting schedule',
        'Prepare management presentation',
        'Develop presentation materials',
        'Plan analyst day logistics',
        'Prepare management for Q&A',
        'Coordinate logistics',
        'Plan investor feedback collection'
      ],
      outputFormat: 'JSON with roadshow preparation and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['schedule', 'duration', 'artifacts'],
      properties: {
        schedule: { type: 'object' },
        duration: { type: 'string' },
        cities: { type: 'array' },
        meetings: { type: 'array' },
        materials: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'ipo', 'roadshow']
}));

// Task 6: Pricing and Allocation Strategy
export const pricingStrategyTask = defineTask('pricing-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop pricing strategy',
  agent: {
    name: 'pricing-advisor',
    prompt: {
      role: 'IPO pricing specialist',
      task: 'Develop IPO pricing and allocation strategy',
      context: args,
      instructions: [
        'Analyze comparable IPO valuations',
        'Determine target valuation range',
        'Set price range strategy',
        'Plan share offering size',
        'Develop allocation strategy',
        'Plan stabilization approach',
        'Consider lockup structure',
        'Document pricing rationale'
      ],
      outputFormat: 'JSON with pricing strategy and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['targetValuation', 'priceRange', 'shareOffering', 'artifacts'],
      properties: {
        targetValuation: { type: 'number' },
        priceRange: { type: 'object' },
        shareOffering: { type: 'object' },
        pricingDate: { type: 'string' },
        allocation: { type: 'object' },
        lockup: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'ipo', 'pricing']
}));

// Task 7: Post-IPO Planning
export const postIPOTask = defineTask('post-ipo-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan post-IPO support',
  agent: {
    name: 'post-ipo-planner',
    prompt: {
      role: 'public company transition specialist',
      task: 'Plan post-IPO transition and support',
      context: args,
      instructions: [
        'Plan first earnings call preparation',
        'Develop investor relations strategy',
        'Plan analyst coverage management',
        'Prepare for lockup expiration',
        'Plan ongoing disclosure requirements',
        'Develop shareholder communication',
        'Plan investor day/conferences',
        'Document post-IPO support plan'
      ],
      outputFormat: 'JSON with post-IPO plan and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'timeline', 'artifacts'],
      properties: {
        plan: { type: 'object' },
        timeline: { type: 'object' },
        irStrategy: { type: 'object' },
        disclosureCalendar: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'ipo', 'post-ipo']
}));

// Task 8: IPO Process Report
export const ipoReportTask = defineTask('ipo-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate IPO process report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'IPO process manager',
      task: 'Generate comprehensive IPO process report',
      context: args,
      instructions: [
        'Create executive summary',
        'Present readiness assessment',
        'Document banker selection',
        'Include S-1 preparation status',
        'Present equity story',
        'Document roadshow plan',
        'Include pricing strategy',
        'Present post-IPO plan'
      ],
      outputFormat: 'JSON with report path and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'summary', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        summary: { type: 'object' },
        timeline: { type: 'object' },
        milestones: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'ipo', 'reporting']
}));
