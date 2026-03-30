/**
 * @process specializations/domains/business/entrepreneurship/pre-seed-fundraising
 * @description Pre-Seed/Seed Fundraising Process - End-to-end process for raising pre-seed or seed funding from angels, angel groups, and seed-stage VCs.
 * @inputs { companyName: string, fundingTarget: number, currentStage: string, traction?: object, team?: array, previousFunding?: string }
 * @outputs { success: boolean, investorCRM: object, pitchMaterials: object, termSheet: object, closingChecklist: array }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/entrepreneurship/pre-seed-fundraising', {
 *   companyName: 'NewCo',
 *   fundingTarget: 1500000,
 *   currentStage: 'pre-seed',
 *   traction: { mrr: 5000, users: 200 }
 * });
 *
 * @references
 * - YC SAFE Documents: https://www.ycombinator.com/documents/
 * - Venture Deals: https://www.venturedeals.com/
 * - Art of Startup Fundraising
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    companyName,
    fundingTarget,
    currentStage,
    traction = {},
    team = [],
    previousFunding = ''
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting ${currentStage} Fundraising Process for ${companyName}`);

  // Phase 1: Fundraising Readiness Assessment
  const readinessAssessment = await ctx.task(readinessAssessmentTask, {
    companyName,
    fundingTarget,
    currentStage,
    traction,
    team
  });

  artifacts.push(...(readinessAssessment.artifacts || []));

  // Quality Gate
  if (readinessAssessment.readinessScore < 50) {
    await ctx.breakpoint({
      question: `Readiness score is ${readinessAssessment.readinessScore}/100. Consider addressing gaps before fundraising. Continue anyway?`,
      title: 'Fundraising Readiness Warning',
      context: { runId: ctx.runId, gaps: readinessAssessment.gaps }
    });
  }

  // Phase 2: Pitch Materials Preparation
  const pitchMaterials = await ctx.task(pitchMaterialsTask, {
    companyName,
    fundingTarget,
    traction,
    team
  });

  artifacts.push(...(pitchMaterials.artifacts || []));

  // Phase 3: Data Room Setup
  const dataRoom = await ctx.task(dataRoomSetupTask, {
    companyName,
    currentStage,
    team,
    previousFunding
  });

  artifacts.push(...(dataRoom.artifacts || []));

  // Phase 4: Investor List Building
  const investorList = await ctx.task(investorListTask, {
    companyName,
    fundingTarget,
    currentStage,
    traction
  });

  artifacts.push(...(investorList.artifacts || []));

  // Breakpoint: Review investor list
  await ctx.breakpoint({
    question: `Review target investor list for ${companyName}. ${investorList.totalInvestors} investors identified. Ready to begin outreach?`,
    title: 'Investor List Review',
    context: {
      runId: ctx.runId,
      totalInvestors: investorList.totalInvestors,
      tiers: investorList.tiers,
      files: artifacts
    }
  });

  // Phase 5: Warm Introduction Strategy
  const introStrategy = await ctx.task(introductionStrategyTask, {
    companyName,
    investorList,
    team
  });

  artifacts.push(...(introStrategy.artifacts || []));

  // Phase 6: Pipeline Management Setup
  const pipelineSetup = await ctx.task(pipelineManagementTask, {
    companyName,
    investorList,
    fundingTarget
  });

  artifacts.push(...(pipelineSetup.artifacts || []));

  // Phase 7: Term Sheet Guidance
  const termSheetGuidance = await ctx.task(termSheetGuidanceTask, {
    companyName,
    fundingTarget,
    currentStage,
    previousFunding
  });

  artifacts.push(...(termSheetGuidance.artifacts || []));

  // Phase 8: Negotiation Preparation
  const negotiationPrep = await ctx.task(negotiationPrepTask, {
    companyName,
    termSheetGuidance,
    fundingTarget
  });

  artifacts.push(...(negotiationPrep.artifacts || []));

  // Phase 9: Closing Process Guide
  const closingGuide = await ctx.task(closingProcessTask, {
    companyName,
    currentStage,
    fundingTarget
  });

  artifacts.push(...(closingGuide.artifacts || []));

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Fundraising process framework complete for ${companyName}. Target: $${fundingTarget.toLocaleString()}. Ready to execute?`,
    title: 'Fundraising Process Ready',
    context: {
      runId: ctx.runId,
      companyName,
      fundingTarget,
      investorCount: investorList.totalInvestors,
      files: artifacts
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    companyName,
    fundingTarget,
    readinessScore: readinessAssessment.readinessScore,
    investorCRM: pipelineSetup,
    pitchMaterials: pitchMaterials,
    dataRoom: dataRoom,
    investorList: investorList,
    introStrategy: introStrategy,
    termSheet: termSheetGuidance,
    negotiation: negotiationPrep,
    closingChecklist: closingGuide.checklist,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/domains/business/entrepreneurship/pre-seed-fundraising',
      timestamp: startTime,
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const readinessAssessmentTask = defineTask('readiness-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fundraising Readiness Assessment - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Startup Fundraising Advisor',
      task: 'Assess fundraising readiness and identify gaps',
      context: {
        companyName: args.companyName,
        fundingTarget: args.fundingTarget,
        currentStage: args.currentStage,
        traction: args.traction,
        team: args.team
      },
      instructions: [
        '1. Evaluate team strength and founder-market fit',
        '2. Assess traction relative to funding stage',
        '3. Evaluate market timing and opportunity',
        '4. Assess product/technology readiness',
        '5. Evaluate narrative and positioning clarity',
        '6. Check legal and corporate readiness',
        '7. Assess runway and timing urgency',
        '8. Identify gaps that need addressing',
        '9. Score overall fundraising readiness (0-100)',
        '10. Provide recommendations for improvement'
      ],
      outputFormat: 'JSON object with readiness assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['readinessScore', 'strengths', 'gaps'],
      properties: {
        readinessScore: { type: 'number', minimum: 0, maximum: 100 },
        strengths: { type: 'array', items: { type: 'string' } },
        gaps: { type: 'array', items: { type: 'string' } },
        teamAssessment: { type: 'object' },
        tractionAssessment: { type: 'object' },
        timingAssessment: { type: 'string' },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'fundraising', 'readiness']
}));

export const pitchMaterialsTask = defineTask('pitch-materials', (args, taskCtx) => ({
  kind: 'agent',
  title: `Pitch Materials Preparation - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Pitch Deck and Fundraising Expert',
      task: 'Prepare comprehensive pitch materials for fundraising',
      context: {
        companyName: args.companyName,
        fundingTarget: args.fundingTarget,
        traction: args.traction,
        team: args.team
      },
      instructions: [
        '1. Create investor pitch deck outline (10-15 slides)',
        '2. Develop one-pager executive summary',
        '3. Create forwardable email blurb',
        '4. Prepare financial model summary',
        '5. Develop FAQ document for common questions',
        '6. Create product demo script',
        '7. Prepare customer references list',
        '8. Design visual assets and screenshots',
        '9. Create different versions for different investors',
        '10. Plan for iteration based on feedback'
      ],
      outputFormat: 'JSON object with pitch materials'
    },
    outputSchema: {
      type: 'object',
      required: ['pitchDeckOutline', 'onePager', 'emailBlurb'],
      properties: {
        pitchDeckOutline: { type: 'object' },
        onePager: { type: 'string' },
        emailBlurb: { type: 'string' },
        financialModelSummary: { type: 'object' },
        faqDocument: { type: 'array', items: { type: 'object' } },
        demoScript: { type: 'string' },
        customerReferences: { type: 'array', items: { type: 'object' } },
        materialVersions: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'fundraising', 'pitch-materials']
}));

export const dataRoomSetupTask = defineTask('data-room-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Data Room Setup - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Startup Operations and Legal Expert',
      task: 'Set up organized data room for due diligence',
      context: {
        companyName: args.companyName,
        currentStage: args.currentStage,
        team: args.team,
        previousFunding: args.previousFunding
      },
      instructions: [
        '1. Create data room folder structure',
        '2. List required corporate documents',
        '3. Identify financial documents needed',
        '4. List product and technology documentation',
        '5. Compile team and HR documents',
        '6. Gather customer and sales documentation',
        '7. Prepare legal and IP documents',
        '8. Set up access controls and tracking',
        '9. Create document checklist',
        '10. Plan for staged access levels'
      ],
      outputFormat: 'JSON object with data room setup'
    },
    outputSchema: {
      type: 'object',
      required: ['folderStructure', 'documentChecklist'],
      properties: {
        folderStructure: { type: 'array', items: { type: 'string' } },
        documentChecklist: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              document: { type: 'string' },
              category: { type: 'string' },
              status: { type: 'string' },
              priority: { type: 'string' }
            }
          }
        },
        accessLevels: { type: 'object' },
        platformRecommendation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'fundraising', 'data-room']
}));

export const investorListTask = defineTask('investor-list', (args, taskCtx) => ({
  kind: 'agent',
  title: `Target Investor List - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Investor Relations Expert',
      task: 'Build comprehensive target investor list',
      context: {
        companyName: args.companyName,
        fundingTarget: args.fundingTarget,
        currentStage: args.currentStage,
        traction: args.traction
      },
      instructions: [
        '1. Identify relevant angel investors in the space',
        '2. List active angel groups in target geography',
        '3. Identify seed-stage VCs with relevant thesis',
        '4. Research recent investments by each investor',
        '5. Tier investors by fit and likelihood',
        '6. Identify potential lead investors',
        '7. Research check size and stage preferences',
        '8. Find connection paths to each investor',
        '9. Note any conflicts or concerns',
        '10. Prioritize outreach order'
      ],
      outputFormat: 'JSON object with investor list'
    },
    outputSchema: {
      type: 'object',
      required: ['investors', 'totalInvestors', 'tiers'],
      properties: {
        investors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              tier: { type: 'string' },
              checkSize: { type: 'string' },
              thesisFit: { type: 'string' },
              connectionPath: { type: 'string' }
            }
          }
        },
        totalInvestors: { type: 'number' },
        tiers: { type: 'object' },
        potentialLeads: { type: 'array', items: { type: 'string' } },
        outreachPriority: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'fundraising', 'investor-list']
}));

export const introductionStrategyTask = defineTask('introduction-strategy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Warm Introduction Strategy - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Networking and Fundraising Strategist',
      task: 'Develop warm introduction strategy for investors',
      context: {
        companyName: args.companyName,
        investorList: args.investorList,
        team: args.team
      },
      instructions: [
        '1. Map network connections to target investors',
        '2. Identify strongest connection paths',
        '3. Create introduction request templates',
        '4. Develop forwardable blurbs for connectors',
        '5. Plan outreach sequence and timing',
        '6. Create follow-up cadence',
        '7. Identify networking events and opportunities',
        '8. Plan social media and content strategy',
        '9. Create cold outreach backup plan',
        '10. Set up tracking for introduction requests'
      ],
      outputFormat: 'JSON object with introduction strategy'
    },
    outputSchema: {
      type: 'object',
      required: ['connectionMap', 'introTemplates', 'outreachSequence'],
      properties: {
        connectionMap: { type: 'object' },
        introTemplates: {
          type: 'object',
          properties: {
            requestTemplate: { type: 'string' },
            forwardableBlurb: { type: 'string' }
          }
        },
        outreachSequence: { type: 'array', items: { type: 'object' } },
        followUpCadence: { type: 'object' },
        networkingEvents: { type: 'array', items: { type: 'string' } },
        coldOutreachPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'fundraising', 'introductions']
}));

export const pipelineManagementTask = defineTask('pipeline-management', (args, taskCtx) => ({
  kind: 'agent',
  title: `Pipeline Management Setup - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Sales and Fundraising Operations Expert',
      task: 'Set up investor pipeline management system',
      context: {
        companyName: args.companyName,
        investorList: args.investorList,
        fundingTarget: args.fundingTarget
      },
      instructions: [
        '1. Design pipeline stages (contacted, meeting, pitch, diligence, term sheet, closed)',
        '2. Create investor CRM structure',
        '3. Define tracking fields and metrics',
        '4. Create follow-up automation rules',
        '5. Design reporting dashboard',
        '6. Set up meeting notes templates',
        '7. Create investor feedback tracking',
        '8. Plan for parallel tracking multiple investors',
        '9. Define conversion targets by stage',
        '10. Set up weekly review process'
      ],
      outputFormat: 'JSON object with pipeline management'
    },
    outputSchema: {
      type: 'object',
      required: ['pipelineStages', 'crmStructure', 'trackingMetrics'],
      properties: {
        pipelineStages: { type: 'array', items: { type: 'object' } },
        crmStructure: { type: 'object' },
        trackingFields: { type: 'array', items: { type: 'string' } },
        trackingMetrics: { type: 'array', items: { type: 'string' } },
        followUpRules: { type: 'object' },
        meetingNotesTemplate: { type: 'object' },
        conversionTargets: { type: 'object' },
        reviewProcess: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'fundraising', 'pipeline']
}));

export const termSheetGuidanceTask = defineTask('term-sheet-guidance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Term Sheet Guidance - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Startup Legal and Fundraising Expert',
      task: 'Provide term sheet guidance and negotiation preparation',
      context: {
        companyName: args.companyName,
        fundingTarget: args.fundingTarget,
        currentStage: args.currentStage,
        previousFunding: args.previousFunding
      },
      instructions: [
        '1. Explain SAFE vs. convertible note vs. priced round options',
        '2. Define key terms and their implications',
        '3. Provide market benchmarks for terms',
        '4. Identify terms to negotiate vs. accept',
        '5. Explain valuation cap and discount mechanics',
        '6. Cover pro-rata rights and participation',
        '7. Explain board composition and voting rights',
        '8. Cover founder vesting and acceleration',
        '9. Identify red flags in term sheets',
        '10. Provide negotiation priorities guidance'
      ],
      outputFormat: 'JSON object with term sheet guidance'
    },
    outputSchema: {
      type: 'object',
      required: ['instrumentRecommendation', 'keyTerms', 'negotiationPriorities'],
      properties: {
        instrumentRecommendation: { type: 'string' },
        instrumentComparison: { type: 'object' },
        keyTerms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              term: { type: 'string' },
              explanation: { type: 'string' },
              marketBenchmark: { type: 'string' },
              negotiability: { type: 'string' }
            }
          }
        },
        valuationGuidance: { type: 'object' },
        redFlags: { type: 'array', items: { type: 'string' } },
        negotiationPriorities: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'fundraising', 'term-sheet']
}));

export const negotiationPrepTask = defineTask('negotiation-prep', (args, taskCtx) => ({
  kind: 'agent',
  title: `Negotiation Preparation - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Negotiation Coach',
      task: 'Prepare for term sheet negotiation',
      context: {
        companyName: args.companyName,
        termSheetGuidance: args.termSheetGuidance,
        fundingTarget: args.fundingTarget
      },
      instructions: [
        '1. Define negotiation objectives and priorities',
        '2. Identify BATNA (best alternative to negotiated agreement)',
        '3. Set walk-away points for key terms',
        '4. Prepare responses to common pushback',
        '5. Develop trade-off strategies',
        '6. Create timeline pressure tactics',
        '7. Prepare for competing term sheets scenario',
        '8. Identify relationship building tactics',
        '9. Plan for multi-party negotiations',
        '10. Prepare post-negotiation follow-up'
      ],
      outputFormat: 'JSON object with negotiation preparation'
    },
    outputSchema: {
      type: 'object',
      required: ['objectives', 'batna', 'walkAwayPoints'],
      properties: {
        objectives: { type: 'array', items: { type: 'string' } },
        batna: { type: 'string' },
        walkAwayPoints: { type: 'object' },
        pushbackResponses: { type: 'array', items: { type: 'object' } },
        tradeOffStrategies: { type: 'array', items: { type: 'object' } },
        timelineTactics: { type: 'array', items: { type: 'string' } },
        competingOfferStrategy: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'fundraising', 'negotiation']
}));

export const closingProcessTask = defineTask('closing-process', (args, taskCtx) => ({
  kind: 'agent',
  title: `Closing Process Guide - ${args.companyName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Startup Legal and Operations Expert',
      task: 'Guide through fundraising closing process',
      context: {
        companyName: args.companyName,
        currentStage: args.currentStage,
        fundingTarget: args.fundingTarget
      },
      instructions: [
        '1. Create closing document checklist',
        '2. Outline legal document review process',
        '3. Define wire transfer procedures',
        '4. Plan for multiple closing scenario',
        '5. Create cap table update process',
        '6. Plan investor communication for closing',
        '7. Prepare board updates and resolutions',
        '8. Create post-close announcement plan',
        '9. Plan for new investor onboarding',
        '10. Define ongoing investor relations setup'
      ],
      outputFormat: 'JSON object with closing process'
    },
    outputSchema: {
      type: 'object',
      required: ['checklist', 'documentList', 'timeline'],
      properties: {
        checklist: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              task: { type: 'string' },
              responsible: { type: 'string' },
              deadline: { type: 'string' },
              status: { type: 'string' }
            }
          }
        },
        documentList: { type: 'array', items: { type: 'string' } },
        timeline: { type: 'object' },
        wireProcess: { type: 'object' },
        capTableUpdate: { type: 'object' },
        announcementPlan: { type: 'object' },
        investorOnboarding: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['entrepreneurship', 'fundraising', 'closing']
}));
