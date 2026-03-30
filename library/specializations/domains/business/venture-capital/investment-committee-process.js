/**
 * @process venture-capital/investment-committee-process
 * @description Structured IC preparation including investment memo writing, IC presentation, deal scoring framework application, risk assessment, and decision documentation
 * @inputs { companyName: string, dealData: object, dueDiligenceResults: object, fundStrategy: object }
 * @outputs { success: boolean, investmentMemo: object, icPresentation: object, riskAssessment: object, decision: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    companyName,
    dealData = {},
    dueDiligenceResults = {},
    fundStrategy = {},
    outputDir = 'ic-process-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Investment Thesis Development
  ctx.log('info', 'Developing investment thesis');
  const investmentThesis = await ctx.task(investmentThesisTask, {
    companyName,
    dealData,
    dueDiligenceResults,
    fundStrategy,
    outputDir
  });

  if (!investmentThesis.success) {
    return {
      success: false,
      error: 'Investment thesis development failed',
      details: investmentThesis,
      metadata: { processId: 'venture-capital/investment-committee-process', timestamp: startTime }
    };
  }

  artifacts.push(...investmentThesis.artifacts);

  // Task 2: Deal Scoring
  ctx.log('info', 'Applying deal scoring framework');
  const dealScoring = await ctx.task(dealScoringTask, {
    companyName,
    dealData,
    dueDiligenceResults,
    fundStrategy,
    outputDir
  });

  artifacts.push(...dealScoring.artifacts);

  // Task 3: Risk Assessment
  ctx.log('info', 'Conducting risk assessment');
  const riskAssessment = await ctx.task(icRiskAssessmentTask, {
    companyName,
    dealData,
    dueDiligenceResults,
    dealScoring,
    outputDir
  });

  artifacts.push(...riskAssessment.artifacts);

  // Task 4: Investment Memo Writing
  ctx.log('info', 'Writing investment memo');
  const investmentMemo = await ctx.task(investmentMemoTask, {
    companyName,
    dealData,
    investmentThesis,
    dueDiligenceResults,
    dealScoring,
    riskAssessment,
    outputDir
  });

  artifacts.push(...investmentMemo.artifacts);

  // Task 5: IC Presentation Preparation
  ctx.log('info', 'Preparing IC presentation');
  const icPresentation = await ctx.task(icPresentationTask, {
    companyName,
    investmentMemo,
    dealScoring,
    riskAssessment,
    outputDir
  });

  artifacts.push(...icPresentation.artifacts);

  // Task 6: Comparable Deal Analysis
  ctx.log('info', 'Analyzing comparable portfolio deals');
  const comparableDeals = await ctx.task(comparableDealTask, {
    companyName,
    dealData,
    fundStrategy,
    outputDir
  });

  artifacts.push(...comparableDeals.artifacts);

  // Breakpoint: Review IC materials
  await ctx.breakpoint({
    question: `IC materials complete for ${companyName}. Deal score: ${dealScoring.overallScore}/100. Risk level: ${riskAssessment.overallRisk}. Review materials?`,
    title: 'Investment Committee Materials',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        dealScore: dealScoring.overallScore,
        riskLevel: riskAssessment.overallRisk,
        recommendation: investmentThesis.recommendation,
        proposedCheck: dealData.proposedInvestment
      }
    }
  });

  // Task 7: Decision Documentation
  ctx.log('info', 'Preparing decision documentation');
  const decisionDoc = await ctx.task(decisionDocumentationTask, {
    companyName,
    investmentMemo,
    dealScoring,
    riskAssessment,
    comparableDeals,
    outputDir
  });

  artifacts.push(...decisionDoc.artifacts);

  // Task 8: Generate IC Package
  ctx.log('info', 'Generating complete IC package');
  const icPackage = await ctx.task(icPackageTask, {
    companyName,
    investmentThesis,
    investmentMemo,
    icPresentation,
    dealScoring,
    riskAssessment,
    comparableDeals,
    decisionDoc,
    outputDir
  });

  artifacts.push(...icPackage.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    investmentMemo: {
      memoPath: investmentMemo.memoPath,
      thesis: investmentThesis.thesis,
      recommendation: investmentThesis.recommendation
    },
    icPresentation: {
      presentationPath: icPresentation.presentationPath,
      keySlides: icPresentation.keySlides
    },
    dealScoring: {
      overallScore: dealScoring.overallScore,
      categoryScores: dealScoring.categoryScores,
      rank: dealScoring.rank
    },
    riskAssessment: {
      overallRisk: riskAssessment.overallRisk,
      keyRisks: riskAssessment.keyRisks,
      mitigations: riskAssessment.mitigations
    },
    decision: {
      documentPath: decisionDoc.documentPath,
      votingItems: decisionDoc.votingItems
    },
    artifacts,
    duration,
    metadata: {
      processId: 'venture-capital/investment-committee-process',
      timestamp: startTime,
      companyName
    }
  };
}

// Task 1: Investment Thesis Development
export const investmentThesisTask = defineTask('investment-thesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop investment thesis',
  agent: {
    name: 'thesis-developer',
    prompt: {
      role: 'VC investment partner',
      task: 'Develop compelling investment thesis',
      context: args,
      instructions: [
        'Articulate why this investment fits fund strategy',
        'Define the key investment hypothesis',
        'Identify what makes this opportunity unique',
        'Articulate the path to outsized returns',
        'Define key milestones and value inflection points',
        'Identify key beliefs required for success',
        'Articulate competitive advantage of the company',
        'Summarize recommendation (invest/pass)'
      ],
      outputFormat: 'JSON with investment thesis and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'thesis', 'recommendation', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        thesis: { type: 'string' },
        recommendation: { type: 'string', enum: ['strong-invest', 'invest', 'conditional', 'pass'] },
        keyBeliefs: { type: 'array' },
        milestones: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'ic', 'thesis']
}));

// Task 2: Deal Scoring
export const dealScoringTask = defineTask('deal-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply deal scoring framework',
  agent: {
    name: 'deal-scorer',
    prompt: {
      role: 'VC analyst',
      task: 'Apply standardized deal scoring framework',
      context: args,
      instructions: [
        'Score team quality (0-100)',
        'Score market opportunity (0-100)',
        'Score product/technology (0-100)',
        'Score business model (0-100)',
        'Score traction/metrics (0-100)',
        'Score valuation/terms (0-100)',
        'Calculate weighted overall score',
        'Rank against recent opportunities'
      ],
      outputFormat: 'JSON with deal scores and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'categoryScores', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        categoryScores: { type: 'object' },
        weights: { type: 'object' },
        rank: { type: 'string' },
        benchmarks: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'ic', 'scoring']
}));

// Task 3: IC Risk Assessment
export const icRiskAssessmentTask = defineTask('ic-risk-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct IC risk assessment',
  agent: {
    name: 'risk-assessor',
    prompt: {
      role: 'VC risk analyst',
      task: 'Conduct comprehensive risk assessment for IC',
      context: args,
      instructions: [
        'Identify key investment risks',
        'Categorize risks by type (market, execution, team, etc)',
        'Assess probability and impact of each risk',
        'Identify risk mitigants and monitoring',
        'Define deal-breaker vs manageable risks',
        'Assess portfolio concentration risk',
        'Create risk matrix',
        'Rate overall risk level'
      ],
      outputFormat: 'JSON with risk assessment and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallRisk', 'keyRisks', 'mitigations', 'artifacts'],
      properties: {
        overallRisk: { type: 'string', enum: ['low', 'medium', 'high', 'very-high'] },
        keyRisks: { type: 'array' },
        mitigations: { type: 'array' },
        riskMatrix: { type: 'object' },
        dealBreakers: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'ic', 'risk']
}));

// Task 4: Investment Memo Writing
export const investmentMemoTask = defineTask('investment-memo', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write investment memo',
  agent: {
    name: 'memo-writer',
    prompt: {
      role: 'VC investment analyst',
      task: 'Write comprehensive investment memorandum',
      context: args,
      instructions: [
        'Write executive summary',
        'Describe company and product',
        'Present market opportunity',
        'Analyze competitive landscape',
        'Evaluate team and organization',
        'Review financials and projections',
        'Present deal terms and valuation',
        'Summarize risks and mitigations',
        'State investment recommendation'
      ],
      outputFormat: 'JSON with memo path, sections, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['memoPath', 'sections', 'artifacts'],
      properties: {
        memoPath: { type: 'string' },
        sections: { type: 'array' },
        executiveSummary: { type: 'string' },
        recommendation: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'ic', 'memo']
}));

// Task 5: IC Presentation Preparation
export const icPresentationTask = defineTask('ic-presentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare IC presentation',
  agent: {
    name: 'presentation-creator',
    prompt: {
      role: 'VC deal team lead',
      task: 'Prepare IC presentation materials',
      context: args,
      instructions: [
        'Create deal overview slide',
        'Summarize investment thesis',
        'Present key metrics and traction',
        'Show market opportunity',
        'Present team assessment',
        'Include valuation analysis',
        'Present risks and mitigations',
        'Include Q&A preparation',
        'Format for IC meeting'
      ],
      outputFormat: 'JSON with presentation path, slides, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['presentationPath', 'keySlides', 'artifacts'],
      properties: {
        presentationPath: { type: 'string' },
        keySlides: { type: 'array' },
        talkingPoints: { type: 'array' },
        anticipatedQuestions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'ic', 'presentation']
}));

// Task 6: Comparable Deal Analysis
export const comparableDealTask = defineTask('comparable-deals', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze comparable deals',
  agent: {
    name: 'comparable-analyst',
    prompt: {
      role: 'VC portfolio analyst',
      task: 'Analyze comparable portfolio and market deals',
      context: args,
      instructions: [
        'Identify comparable portfolio investments',
        'Compare entry valuation metrics',
        'Analyze portfolio performance patterns',
        'Compare traction at similar stages',
        'Identify lessons from similar investments',
        'Analyze market deal activity',
        'Position deal vs fund benchmarks',
        'Document relevant patterns'
      ],
      outputFormat: 'JSON with comparable analysis and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['comparables', 'positioning', 'artifacts'],
      properties: {
        comparables: { type: 'array' },
        positioning: { type: 'object' },
        portfolioLessons: { type: 'array' },
        marketActivity: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'ic', 'comparables']
}));

// Task 7: Decision Documentation
export const decisionDocumentationTask = defineTask('decision-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Prepare decision documentation',
  agent: {
    name: 'decision-documenter',
    prompt: {
      role: 'VC operations specialist',
      task: 'Prepare IC decision documentation',
      context: args,
      instructions: [
        'Create IC decision template',
        'Document voting items and conditions',
        'Include investment amount and terms',
        'Document key conditions to close',
        'Include post-IC action items',
        'Create follow-up monitoring plan',
        'Document dissenting views if any',
        'Prepare LP reporting summary'
      ],
      outputFormat: 'JSON with decision documentation and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['documentPath', 'votingItems', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        votingItems: { type: 'array' },
        conditions: { type: 'array' },
        actionItems: { type: 'array' },
        monitoringPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'ic', 'decision']
}));

// Task 8: IC Package Generation
export const icPackageTask = defineTask('ic-package', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate IC package',
  agent: {
    name: 'package-generator',
    prompt: {
      role: 'VC deal team coordinator',
      task: 'Generate complete IC package',
      context: args,
      instructions: [
        'Compile all IC materials',
        'Create table of contents',
        'Include investment memo',
        'Add presentation materials',
        'Include due diligence summaries',
        'Add supporting documents',
        'Create distribution checklist',
        'Format for IC distribution'
      ],
      outputFormat: 'JSON with package path, contents, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['packagePath', 'contents', 'artifacts'],
      properties: {
        packagePath: { type: 'string' },
        contents: { type: 'array' },
        distributionList: { type: 'array' },
        timing: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'ic', 'package']
}));
