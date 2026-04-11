/**
 * @process specializations/domains/business/entrepreneurship/series-a-fundraising
 * @description Series A Fundraising Process - Comprehensive process for raising Series A institutional venture capital funding.
 * @inputs { companyName: string, fundingTarget: number, metrics: object, previousRounds: array, team: array, boardComposition?: array }
 * @outputs { success: boolean, seriesADeck: object, financialModel: object, dataRoom: object, termSheetGuidance: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/entrepreneurship/series-a-fundraising', {
 *   companyName: 'ScaleUpCo',
 *   fundingTarget: 15000000,
 *   metrics: { arr: 2000000, growth: '15% MoM', ndr: 120 },
 *   previousRounds: [{ round: 'Seed', amount: 3000000 }]
 * });
 *
 * @references
 * - Secrets of Sand Hill Road: https://www.amazon.com/Secrets-Sand-Hill-Road-Venture/dp/059308358X
 * - NVCA Model Documents: https://nvca.org/model-legal-documents/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    companyName,
    fundingTarget,
    metrics = {},
    previousRounds = [],
    team = [],
    boardComposition = []
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Series A Fundraising Process for ${companyName}`);

  // Phase 1: Series A Readiness Validation
  const readinessValidation = await ctx.task(seriesAReadinessTask, {
    companyName,
    metrics,
    previousRounds,
    team
  });

  artifacts.push(...(readinessValidation.artifacts || []));

  // Quality Gate: Check readiness
  if (!readinessValidation.ready) {
    await ctx.breakpoint({
      question: `Series A readiness concerns identified. Score: ${readinessValidation.readinessScore}/100. Address gaps or continue?`,
      title: 'Series A Readiness Check',
      context: {
        runId: ctx.runId,
        concerns: readinessValidation.concerns,
        recommendations: readinessValidation.recommendations
      }
    });
  }

  // Phase 2: Institutional-Grade Pitch Deck
  const institutionalDeck = await ctx.task(institutionalDeckTask, {
    companyName,
    fundingTarget,
    metrics,
    team
  });

  artifacts.push(...(institutionalDeck.artifacts || []));

  // Phase 3: Financial Model Development
  const financialModel = await ctx.task(financialModelTask, {
    companyName,
    metrics,
    fundingTarget
  });

  artifacts.push(...(financialModel.artifacts || []));

  // Phase 4: Comprehensive Data Room
  const dataRoom = await ctx.task(seriesADataRoomTask, {
    companyName,
    metrics,
    previousRounds,
    team,
    boardComposition
  });

  artifacts.push(...(dataRoom.artifacts || []));

  // Breakpoint: Review materials
  await ctx.breakpoint({
    question: `Review Series A materials for ${companyName}. Deck, model, and data room prepared. Ready to build investor list?`,
    title: 'Series A Materials Review',
    context: {
      runId: ctx.runId,
      companyName,
      files: artifacts
    }
  });

  // Phase 5: Tiered Investor List
  const tieredInvestorList = await ctx.task(tieredInvestorListTask, {
    companyName,
    fundingTarget,
    metrics
  });

  artifacts.push(...(tieredInvestorList.artifacts || []));

  // Phase 6: Outreach and Meeting Schedule
  const outreachPlan = await ctx.task(seriesAOutreachTask, {
    companyName,
    tieredInvestorList,
    team
  });

  artifacts.push(...(outreachPlan.artifacts || []));

  // Phase 7: Partner Meeting Preparation
  const partnerMeetingPrep = await ctx.task(partnerMeetingPrepTask, {
    companyName,
    institutionalDeck,
    metrics
  });

  artifacts.push(...(partnerMeetingPrep.artifacts || []));

  // Phase 8: Due Diligence Preparation
  const diligencePrep = await ctx.task(diligencePrepTask, {
    companyName,
    dataRoom,
    metrics,
    team
  });

  artifacts.push(...(diligencePrep.artifacts || []));

  // Phase 9: Series A Term Sheet Negotiation
  const termSheetNegotiation = await ctx.task(seriesATermSheetTask, {
    companyName,
    fundingTarget,
    previousRounds,
    boardComposition
  });

  artifacts.push(...(termSheetNegotiation.artifacts || []));

  // Phase 10: Legal and Closing
  const legalClosing = await ctx.task(seriesAClosingTask, {
    companyName,
    fundingTarget,
    boardComposition
  });

  artifacts.push(...(legalClosing.artifacts || []));

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Series A framework complete for ${companyName}. Target: $${(fundingTarget/1000000).toFixed(1)}M. Ready to execute fundraise?`,
    title: 'Series A Process Ready',
    context: {
      runId: ctx.runId,
      companyName,
      fundingTarget,
      investorCount: tieredInvestorList.totalInvestors,
      files: artifacts
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    companyName,
    fundingTarget,
    readiness: readinessValidation,
    seriesADeck: institutionalDeck,
    financialModel: financialModel,
    dataRoom: dataRoom,
    investorList: tieredInvestorList,
    outreachPlan: outreachPlan,
    partnerMeetingPrep: partnerMeetingPrep,
    diligencePrep: diligencePrep,
    termSheetGuidance: termSheetNegotiation,
    closingGuide: legalClosing,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/business/entrepreneurship/series-a-fundraising',
      timestamp: startTime,
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const seriesAReadinessTask = defineTask('series-a-readiness', (args, taskCtx) => ({
  kind: 'agent',
  title: `Series A Readiness Validation - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Series A Fundraising Expert',
      task: 'Validate Series A readiness metrics and milestones',
      context: {
        companyName: args.companyName,
        metrics: args.metrics,
        previousRounds: args.previousRounds,
        team: args.team
      },
      instructions: [
        '1. Evaluate ARR/MRR against Series A benchmarks ($1-2M+ ARR typical)',
        '2. Assess growth rate (10-20%+ MoM for Series A)',
        '3. Evaluate net dollar retention (>100% ideal)',
        '4. Assess product-market fit signals',
        '5. Evaluate team completeness for scale',
        '6. Review burn and runway',
        '7. Assess market timing and competitive position',
        '8. Evaluate customer concentration risk',
        '9. Score overall Series A readiness (0-100)',
        '10. Identify specific gaps to address'
      ],
      outputFormat: 'JSON object with Series A readiness validation'
    },
    outputSchema: {
      type: 'object',
      required: ['ready', 'readinessScore', 'metricsAssessment'],
      properties: {
        ready: { type: 'boolean' },
        readinessScore: { type: 'number', minimum: 0, maximum: 100 },
        metricsAssessment: {
          type: 'object',
          properties: {
            revenue: { type: 'object' },
            growth: { type: 'object' },
            retention: { type: 'object' },
            pmfSignals: { type: 'object' }
          }
        },
        concerns: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'series-a', 'readiness']
}));

export const institutionalDeckTask = defineTask('institutional-deck', (args, taskCtx) => ({
  kind: 'agent',
  title: `Institutional-Grade Pitch Deck - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Series A Pitch Deck Expert',
      task: 'Create institutional-grade pitch deck for Series A',
      context: {
        companyName: args.companyName,
        fundingTarget: args.fundingTarget,
        metrics: args.metrics,
        team: args.team
      },
      instructions: [
        '1. Create executive summary slide with key metrics',
        '2. Present market opportunity with bottom-up sizing',
        '3. Show product vision and roadmap',
        '4. Present detailed traction and cohort analysis',
        '5. Show competitive moats and differentiation',
        '6. Present go-to-market strategy and expansion',
        '7. Show team with relevant experience',
        '8. Present detailed financials and projections',
        '9. Show use of funds tied to milestones',
        '10. Create appendix with deep-dive materials'
      ],
      outputFormat: 'JSON object with institutional deck'
    },
    outputSchema: {
      type: 'object',
      required: ['deckStructure', 'slideContent', 'appendix'],
      properties: {
        deckStructure: { type: 'array', items: { type: 'string' } },
        slideContent: { type: 'array', items: { type: 'object' } },
        keyMetricsSlide: { type: 'object' },
        cohortAnalysis: { type: 'object' },
        financialSlides: { type: 'object' },
        appendix: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'series-a', 'pitch-deck']
}));

export const financialModelTask = defineTask('financial-model', (args, taskCtx) => ({
  kind: 'agent',
  title: `Financial Model Development - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Startup Financial Modeling Expert',
      task: 'Build comprehensive financial model for Series A',
      context: {
        companyName: args.companyName,
        metrics: args.metrics,
        fundingTarget: args.fundingTarget
      },
      instructions: [
        '1. Build bottoms-up revenue projections (3-5 years)',
        '2. Model customer acquisition and growth',
        '3. Project operating expenses and headcount',
        '4. Calculate unit economics (CAC, LTV, payback)',
        '5. Build scenario analysis (base, bull, bear)',
        '6. Project cash flow and runway',
        '7. Model funding impact on growth',
        '8. Create sensitivity analysis on key assumptions',
        '9. Show path to profitability',
        '10. Build investor-ready summary dashboard'
      ],
      outputFormat: 'JSON object with financial model'
    },
    outputSchema: {
      type: 'object',
      required: ['projections', 'unitEconomics', 'scenarios'],
      properties: {
        projections: {
          type: 'object',
          properties: {
            revenue: { type: 'object' },
            expenses: { type: 'object' },
            headcount: { type: 'object' }
          }
        },
        unitEconomics: {
          type: 'object',
          properties: {
            cac: { type: 'string' },
            ltv: { type: 'string' },
            paybackPeriod: { type: 'string' },
            ltvCacRatio: { type: 'number' }
          }
        },
        scenarios: { type: 'object' },
        sensitivityAnalysis: { type: 'object' },
        cashFlowProjection: { type: 'object' },
        summaryDashboard: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'series-a', 'financial-model']
}));

export const seriesADataRoomTask = defineTask('series-a-data-room', (args, taskCtx) => ({
  kind: 'agent',
  title: `Series A Data Room - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Series A Due Diligence Expert',
      task: 'Build comprehensive data room for Series A due diligence',
      context: {
        companyName: args.companyName,
        metrics: args.metrics,
        previousRounds: args.previousRounds,
        team: args.team,
        boardComposition: args.boardComposition
      },
      instructions: [
        '1. Organize complete corporate document set',
        '2. Prepare detailed financial statements and reports',
        '3. Compile customer contracts and references',
        '4. Gather intellectual property documentation',
        '5. Prepare team background and references',
        '6. Include cap table and previous round docs',
        '7. Prepare product and technology documentation',
        '8. Include market research and competitive analysis',
        '9. Set up tiered access controls',
        '10. Create data room index and navigation'
      ],
      outputFormat: 'JSON object with data room setup'
    },
    outputSchema: {
      type: 'object',
      required: ['structure', 'documentList', 'accessTiers'],
      properties: {
        structure: { type: 'object' },
        documentList: { type: 'array', items: { type: 'object' } },
        accessTiers: { type: 'object' },
        corporateDocs: { type: 'array', items: { type: 'string' } },
        financialDocs: { type: 'array', items: { type: 'string' } },
        customerDocs: { type: 'array', items: { type: 'string' } },
        ipDocs: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'series-a', 'data-room']
}));

export const tieredInvestorListTask = defineTask('tiered-investor-list', (args, taskCtx) => ({
  kind: 'agent',
  title: `Tiered Investor List - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Venture Capital Landscape Expert',
      task: 'Build tiered list of Series A investors aligned with thesis',
      context: {
        companyName: args.companyName,
        fundingTarget: args.fundingTarget,
        metrics: args.metrics
      },
      instructions: [
        '1. Identify Series A funds with relevant thesis',
        '2. Research recent investments and portfolio',
        '3. Identify partner alignment and interests',
        '4. Tier investors by fit and priority',
        '5. Research check sizes and ownership targets',
        '6. Map connection paths to partners',
        '7. Identify potential co-investors',
        '8. Note any conflicts or concerns',
        '9. Research fund lifecycle and dry powder',
        '10. Create outreach priority sequence'
      ],
      outputFormat: 'JSON object with tiered investor list'
    },
    outputSchema: {
      type: 'object',
      required: ['investors', 'totalInvestors', 'tiers'],
      properties: {
        investors: { type: 'array', items: { type: 'object' } },
        totalInvestors: { type: 'number' },
        tiers: {
          type: 'object',
          properties: {
            tier1: { type: 'array', items: { type: 'string' } },
            tier2: { type: 'array', items: { type: 'string' } },
            tier3: { type: 'array', items: { type: 'string' } }
          }
        },
        partnerMapping: { type: 'object' },
        coInvestors: { type: 'array', items: { type: 'string' } },
        outreachSequence: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'series-a', 'investor-list']
}));

export const seriesAOutreachTask = defineTask('series-a-outreach', (args, taskCtx) => ({
  kind: 'agent',
  title: `Series A Outreach Plan - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Fundraising Process Expert',
      task: 'Develop Series A outreach and meeting schedule',
      context: {
        companyName: args.companyName,
        tieredInvestorList: args.tieredInvestorList,
        team: args.team
      },
      instructions: [
        '1. Map warm introduction paths for each target',
        '2. Create outreach timeline and batches',
        '3. Plan for compressed fundraise timeline',
        '4. Create meeting scheduling strategy',
        '5. Plan for parallel tracks with multiple investors',
        '6. Create follow-up cadence',
        '7. Plan for partner meeting scheduling',
        '8. Create momentum communication strategy',
        '9. Plan for term sheet timing optimization',
        '10. Create tracking and reporting system'
      ],
      outputFormat: 'JSON object with outreach plan'
    },
    outputSchema: {
      type: 'object',
      required: ['outreachTimeline', 'introductionMap', 'meetingStrategy'],
      properties: {
        outreachTimeline: { type: 'object' },
        introductionMap: { type: 'object' },
        batchStrategy: { type: 'object' },
        meetingStrategy: { type: 'object' },
        followUpCadence: { type: 'object' },
        momentumCommunication: { type: 'object' },
        trackingSystem: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'series-a', 'outreach']
}));

export const partnerMeetingPrepTask = defineTask('partner-meeting-prep', (args, taskCtx) => ({
  kind: 'agent',
  title: `Partner Meeting Preparation - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'VC Pitch Coach',
      task: 'Prepare for VC partner meetings',
      context: {
        companyName: args.companyName,
        institutionalDeck: args.institutionalDeck,
        metrics: args.metrics
      },
      instructions: [
        '1. Understand partner meeting dynamics and format',
        '2. Prepare for detailed financial questioning',
        '3. Prepare competitive deep-dive responses',
        '4. Prepare for market sizing scrutiny',
        '5. Develop team capability defense',
        '6. Prepare for unit economics questions',
        '7. Create reference customer preparation',
        '8. Plan for multi-stakeholder presentation',
        '9. Prepare for negotiation discussions',
        '10. Plan follow-up actions post-meeting'
      ],
      outputFormat: 'JSON object with partner meeting prep'
    },
    outputSchema: {
      type: 'object',
      required: ['meetingFormat', 'keyQuestions', 'presentationStrategy'],
      properties: {
        meetingFormat: { type: 'object' },
        keyQuestions: { type: 'array', items: { type: 'object' } },
        financialResponses: { type: 'object' },
        competitiveResponses: { type: 'object' },
        presentationStrategy: { type: 'object' },
        referencePrep: { type: 'object' },
        followUpPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'series-a', 'partner-meeting']
}));

export const diligencePrepTask = defineTask('diligence-prep', (args, taskCtx) => ({
  kind: 'agent',
  title: `Due Diligence Preparation - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Due Diligence Expert',
      task: 'Prepare for comprehensive Series A due diligence',
      context: {
        companyName: args.companyName,
        dataRoom: args.dataRoom,
        metrics: args.metrics,
        team: args.team
      },
      instructions: [
        '1. Anticipate financial due diligence questions',
        '2. Prepare customer reference list and coordination',
        '3. Prepare for technical/product diligence',
        '4. Anticipate legal due diligence items',
        '5. Prepare team background verification',
        '6. Create IP documentation summary',
        '7. Prepare market research support',
        '8. Plan for diligence timeline management',
        '9. Identify potential red flags to address',
        '10. Create diligence communication plan'
      ],
      outputFormat: 'JSON object with diligence preparation'
    },
    outputSchema: {
      type: 'object',
      required: ['diligenceAreas', 'customerReferences', 'potentialFlags'],
      properties: {
        diligenceAreas: { type: 'array', items: { type: 'object' } },
        financialDiligence: { type: 'object' },
        customerReferences: { type: 'array', items: { type: 'object' } },
        technicalDiligence: { type: 'object' },
        legalDiligence: { type: 'object' },
        potentialFlags: { type: 'array', items: { type: 'string' } },
        timelineManagement: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'series-a', 'due-diligence']
}));

export const seriesATermSheetTask = defineTask('series-a-term-sheet', (args, taskCtx) => ({
  kind: 'agent',
  title: `Series A Term Sheet Negotiation - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Series A Legal and Negotiation Expert',
      task: 'Guide Series A term sheet negotiation',
      context: {
        companyName: args.companyName,
        fundingTarget: args.fundingTarget,
        previousRounds: args.previousRounds,
        boardComposition: args.boardComposition
      },
      instructions: [
        '1. Explain Series A preferred stock terms',
        '2. Cover valuation and dilution modeling',
        '3. Explain liquidation preferences',
        '4. Cover anti-dilution provisions',
        '5. Explain board composition changes',
        '6. Cover protective provisions',
        '7. Explain pro-rata and participation rights',
        '8. Cover founder vesting adjustments',
        '9. Identify negotiation priorities',
        '10. Create term sheet comparison framework'
      ],
      outputFormat: 'JSON object with term sheet guidance'
    },
    outputSchema: {
      type: 'object',
      required: ['keyTerms', 'negotiationPriorities', 'comparisonFramework'],
      properties: {
        keyTerms: { type: 'array', items: { type: 'object' } },
        valuationGuidance: { type: 'object' },
        liquidationPreference: { type: 'object' },
        antiDilution: { type: 'object' },
        boardComposition: { type: 'object' },
        protectiveProvisions: { type: 'object' },
        negotiationPriorities: { type: 'array', items: { type: 'string' } },
        comparisonFramework: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'series-a', 'term-sheet']
}));

export const seriesAClosingTask = defineTask('series-a-closing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Series A Closing - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Series A Legal and Closing Expert',
      task: 'Guide through Series A legal documentation and closing',
      context: {
        companyName: args.companyName,
        fundingTarget: args.fundingTarget,
        boardComposition: args.boardComposition
      },
      instructions: [
        '1. Explain Series A document set (SPA, IRA, ROFR, Voting Agreement)',
        '2. Guide legal counsel selection and management',
        '3. Create closing checklist and timeline',
        '4. Plan for signing and funding mechanics',
        '5. Prepare board resolutions',
        '6. Plan for cap table updates',
        '7. Create post-close communication plan',
        '8. Plan for new board member onboarding',
        '9. Set up investor reporting cadence',
        '10. Create post-close operational setup'
      ],
      outputFormat: 'JSON object with closing guide'
    },
    outputSchema: {
      type: 'object',
      required: ['documentSet', 'closingChecklist', 'timeline'],
      properties: {
        documentSet: { type: 'array', items: { type: 'object' } },
        legalCounselGuidance: { type: 'object' },
        closingChecklist: { type: 'array', items: { type: 'object' } },
        timeline: { type: 'object' },
        fundingMechanics: { type: 'object' },
        boardSetup: { type: 'object' },
        postCloseComms: { type: 'object' },
        investorReporting: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'series-a', 'closing']
}));
