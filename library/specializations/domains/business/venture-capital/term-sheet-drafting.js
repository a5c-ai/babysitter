/**
 * @process venture-capital/term-sheet-drafting
 * @description Structuring key economic and governance terms including valuation, liquidation preferences, anti-dilution provisions, board composition, and protective provisions
 * @inputs { companyName: string, roundDetails: object, investorRequirements: object, existingTerms: object }
 * @outputs { success: boolean, termSheet: object, economicTerms: object, governanceTerms: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    companyName,
    roundDetails = {},
    investorRequirements = {},
    existingTerms = {},
    outputDir = 'term-sheet-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Economic Terms Structuring
  ctx.log('info', 'Structuring economic terms');
  const economicTerms = await ctx.task(economicTermsTask, {
    companyName,
    roundDetails,
    investorRequirements,
    outputDir
  });

  if (!economicTerms.success) {
    return {
      success: false,
      error: 'Economic terms structuring failed',
      details: economicTerms,
      metadata: { processId: 'venture-capital/term-sheet-drafting', timestamp: startTime }
    };
  }

  artifacts.push(...economicTerms.artifacts);

  // Task 2: Liquidation Preference Design
  ctx.log('info', 'Designing liquidation preferences');
  const liquidationPreference = await ctx.task(liquidationPreferenceDesignTask, {
    roundDetails,
    existingTerms,
    investorRequirements,
    outputDir
  });

  artifacts.push(...liquidationPreference.artifacts);

  // Task 3: Anti-Dilution Provisions
  ctx.log('info', 'Structuring anti-dilution provisions');
  const antiDilution = await ctx.task(antiDilutionTask, {
    roundDetails,
    existingTerms,
    investorRequirements,
    outputDir
  });

  artifacts.push(...antiDilution.artifacts);

  // Task 4: Board Composition
  ctx.log('info', 'Designing board composition');
  const boardComposition = await ctx.task(boardCompositionTask, {
    companyName,
    roundDetails,
    existingTerms,
    investorRequirements,
    outputDir
  });

  artifacts.push(...boardComposition.artifacts);

  // Task 5: Protective Provisions
  ctx.log('info', 'Structuring protective provisions');
  const protectiveProvisions = await ctx.task(protectiveProvisionsTask, {
    roundDetails,
    existingTerms,
    investorRequirements,
    outputDir
  });

  artifacts.push(...protectiveProvisions.artifacts);

  // Task 6: Investor Rights
  ctx.log('info', 'Defining investor rights');
  const investorRights = await ctx.task(investorRightsTask, {
    roundDetails,
    existorTerms: existingTerms,
    investorRequirements,
    outputDir
  });

  artifacts.push(...investorRights.artifacts);

  // Task 7: Founder Terms
  ctx.log('info', 'Structuring founder terms');
  const founderTerms = await ctx.task(founderTermsTask, {
    companyName,
    roundDetails,
    existingTerms,
    outputDir
  });

  artifacts.push(...founderTerms.artifacts);

  // Breakpoint: Review term sheet structure
  await ctx.breakpoint({
    question: `Term sheet structure complete for ${companyName}. Pre-money: $${economicTerms.preMoney}M. Review terms?`,
    title: 'Term Sheet Drafting Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        preMoney: economicTerms.preMoney,
        investmentAmount: economicTerms.investmentAmount,
        liquidationPref: liquidationPreference.multiple,
        antiDilution: antiDilution.type,
        boardSeats: boardComposition.structure
      }
    }
  });

  // Task 8: Generate Term Sheet Document
  ctx.log('info', 'Generating term sheet document');
  const termSheetDoc = await ctx.task(termSheetDocumentTask, {
    companyName,
    economicTerms,
    liquidationPreference,
    antiDilution,
    boardComposition,
    protectiveProvisions,
    investorRights,
    founderTerms,
    roundDetails,
    outputDir
  });

  artifacts.push(...termSheetDoc.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    termSheet: {
      documentPath: termSheetDoc.documentPath,
      version: termSheetDoc.version,
      status: 'draft'
    },
    economicTerms: {
      preMoney: economicTerms.preMoney,
      postMoney: economicTerms.postMoney,
      investmentAmount: economicTerms.investmentAmount,
      pricePerShare: economicTerms.pricePerShare,
      ownership: economicTerms.ownership
    },
    governanceTerms: {
      boardComposition: boardComposition.structure,
      protectiveProvisions: protectiveProvisions.provisions,
      votingRights: investorRights.votingRights
    },
    liquidationTerms: {
      preference: liquidationPreference.multiple,
      participating: liquidationPreference.participating,
      cap: liquidationPreference.cap
    },
    antiDilution: antiDilution.terms,
    artifacts,
    duration,
    metadata: {
      processId: 'venture-capital/term-sheet-drafting',
      timestamp: startTime,
      companyName
    }
  };
}

// Task 1: Economic Terms Structuring
export const economicTermsTask = defineTask('economic-terms', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Structure economic terms',
  agent: {
    name: 'deal-structurer',
    prompt: {
      role: 'VC deal partner',
      task: 'Structure key economic terms for the investment',
      context: args,
      instructions: [
        'Determine pre-money valuation',
        'Calculate investment amount and ownership',
        'Structure price per share',
        'Define share class and rights',
        'Model option pool requirements',
        'Structure pay-to-play provisions',
        'Define dividend rights',
        'Document economic term rationale'
      ],
      outputFormat: 'JSON with economic terms and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'preMoney', 'investmentAmount', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        preMoney: { type: 'number' },
        postMoney: { type: 'number' },
        investmentAmount: { type: 'number' },
        pricePerShare: { type: 'number' },
        ownership: { type: 'number' },
        optionPool: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'term-sheet', 'economics']
}));

// Task 2: Liquidation Preference Design
export const liquidationPreferenceDesignTask = defineTask('liquidation-preference-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design liquidation preferences',
  agent: {
    name: 'preference-designer',
    prompt: {
      role: 'VC legal specialist',
      task: 'Design liquidation preference structure',
      context: args,
      instructions: [
        'Determine preference multiple (1x, 1.5x, 2x)',
        'Structure participating vs non-participating',
        'Design participation caps if applicable',
        'Determine seniority vs pari passu',
        'Analyze impact on founder returns',
        'Model various exit scenarios',
        'Ensure consistency with existing terms',
        'Document preference rationale'
      ],
      outputFormat: 'JSON with liquidation preference terms and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['multiple', 'participating', 'artifacts'],
      properties: {
        multiple: { type: 'number' },
        participating: { type: 'boolean' },
        cap: { type: 'number' },
        seniority: { type: 'string' },
        scenarios: { type: 'array' },
        rationale: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'term-sheet', 'liquidation']
}));

// Task 3: Anti-Dilution Provisions
export const antiDilutionTask = defineTask('anti-dilution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Structure anti-dilution',
  agent: {
    name: 'anti-dilution-specialist',
    prompt: {
      role: 'VC legal specialist',
      task: 'Structure anti-dilution provisions',
      context: args,
      instructions: [
        'Determine anti-dilution type (weighted average vs full ratchet)',
        'Structure broad vs narrow-based weighted average',
        'Define carve-outs and exceptions',
        'Model down-round scenarios',
        'Ensure consistency with existing preferences',
        'Analyze founder impact',
        'Document provision mechanics',
        'Include pay-to-play interaction'
      ],
      outputFormat: 'JSON with anti-dilution terms and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['type', 'terms', 'artifacts'],
      properties: {
        type: { type: 'string' },
        weightedAverageType: { type: 'string' },
        carveOuts: { type: 'array' },
        terms: { type: 'object' },
        scenarios: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'term-sheet', 'anti-dilution']
}));

// Task 4: Board Composition
export const boardCompositionTask = defineTask('board-composition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design board composition',
  agent: {
    name: 'governance-designer',
    prompt: {
      role: 'corporate governance specialist',
      task: 'Design board composition and governance',
      context: args,
      instructions: [
        'Determine board size',
        'Allocate founder/common seats',
        'Allocate investor seats',
        'Include independent director provisions',
        'Define board observer rights',
        'Structure board meeting requirements',
        'Define committee composition',
        'Document governance rationale'
      ],
      outputFormat: 'JSON with board composition and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['structure', 'seats', 'artifacts'],
      properties: {
        structure: { type: 'object' },
        seats: { type: 'array' },
        boardSize: { type: 'number' },
        observers: { type: 'array' },
        committees: { type: 'array' },
        meetingRequirements: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'term-sheet', 'governance']
}));

// Task 5: Protective Provisions
export const protectiveProvisionsTask = defineTask('protective-provisions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Structure protective provisions',
  agent: {
    name: 'provisions-specialist',
    prompt: {
      role: 'VC legal specialist',
      task: 'Structure investor protective provisions',
      context: args,
      instructions: [
        'Define actions requiring investor consent',
        'Structure approval thresholds',
        'Include charter amendment protections',
        'Define new securities issuance controls',
        'Include M&A transaction approvals',
        'Structure debt and lien restrictions',
        'Define dividend and redemption controls',
        'Document standard vs enhanced protections'
      ],
      outputFormat: 'JSON with protective provisions and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['provisions', 'thresholds', 'artifacts'],
      properties: {
        provisions: { type: 'array' },
        thresholds: { type: 'object' },
        consentRequired: { type: 'array' },
        majorityRequired: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'term-sheet', 'protections']
}));

// Task 6: Investor Rights
export const investorRightsTask = defineTask('investor-rights', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define investor rights',
  agent: {
    name: 'rights-specialist',
    prompt: {
      role: 'VC legal specialist',
      task: 'Define investor rights and privileges',
      context: args,
      instructions: [
        'Define information rights',
        'Structure pro-rata participation rights',
        'Include registration rights',
        'Define drag-along and tag-along rights',
        'Structure right of first refusal',
        'Include co-sale rights',
        'Define voting agreements',
        'Document rights thresholds'
      ],
      outputFormat: 'JSON with investor rights and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['informationRights', 'proRata', 'votingRights', 'artifacts'],
      properties: {
        informationRights: { type: 'object' },
        proRata: { type: 'object' },
        registrationRights: { type: 'object' },
        dragAlong: { type: 'object' },
        tagAlong: { type: 'object' },
        rofr: { type: 'object' },
        votingRights: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'term-sheet', 'rights']
}));

// Task 7: Founder Terms
export const founderTermsTask = defineTask('founder-terms', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Structure founder terms',
  agent: {
    name: 'founder-terms-specialist',
    prompt: {
      role: 'VC deal specialist',
      task: 'Structure founder-specific terms',
      context: args,
      instructions: [
        'Review founder vesting requirements',
        'Structure vesting acceleration triggers',
        'Define non-compete and non-solicit',
        'Include PIIA requirements',
        'Structure founder employment terms',
        'Define key person provisions',
        'Include founder repurchase rights',
        'Document founder protections'
      ],
      outputFormat: 'JSON with founder terms and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['vesting', 'acceleration', 'artifacts'],
      properties: {
        vesting: { type: 'object' },
        acceleration: { type: 'object' },
        nonCompete: { type: 'object' },
        piia: { type: 'object' },
        keyPerson: { type: 'object' },
        repurchase: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'term-sheet', 'founders']
}));

// Task 8: Term Sheet Document Generation
export const termSheetDocumentTask = defineTask('term-sheet-document', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate term sheet document',
  agent: {
    name: 'document-generator',
    prompt: {
      role: 'VC legal document specialist',
      task: 'Generate comprehensive term sheet document',
      context: args,
      instructions: [
        'Create term sheet header and parties',
        'Document all economic terms',
        'Include governance structure',
        'Document protective provisions',
        'Include investor rights',
        'Add founder provisions',
        'Include conditions and exclusivity',
        'Format as NVCA-style term sheet'
      ],
      outputFormat: 'JSON with document path, version, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentPath', 'version', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        version: { type: 'string' },
        summary: { type: 'object' },
        keyTerms: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'term-sheet', 'document']
}));
