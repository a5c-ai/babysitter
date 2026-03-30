/**
 * @process venture-capital/commercial-due-diligence
 * @description Comprehensive market analysis including TAM/SAM/SOM sizing, competitive landscape mapping, customer validation interviews, and go-to-market assessment
 * @inputs { companyName: string, industry: string, productDescription: string, targetMarkets: array }
 * @outputs { success: boolean, marketAnalysis: object, competitiveLandscape: object, customerValidation: object, gtmAssessment: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    companyName,
    industry,
    productDescription,
    targetMarkets = [],
    outputDir = 'commercial-dd-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Market Size Analysis (TAM/SAM/SOM)
  ctx.log('info', 'Analyzing market size - TAM/SAM/SOM');
  const marketSizeAnalysis = await ctx.task(marketSizeTask, {
    companyName,
    industry,
    productDescription,
    targetMarkets,
    outputDir
  });

  if (!marketSizeAnalysis.success) {
    return {
      success: false,
      error: 'Market size analysis failed',
      details: marketSizeAnalysis,
      metadata: { processId: 'venture-capital/commercial-due-diligence', timestamp: startTime }
    };
  }

  artifacts.push(...marketSizeAnalysis.artifacts);

  // Task 2: Competitive Landscape Mapping
  ctx.log('info', 'Mapping competitive landscape');
  const competitiveAnalysis = await ctx.task(competitiveLandscapeTask, {
    companyName,
    industry,
    productDescription,
    marketData: marketSizeAnalysis.marketData,
    outputDir
  });

  artifacts.push(...competitiveAnalysis.artifacts);

  // Task 3: Customer Validation Framework
  ctx.log('info', 'Designing customer validation approach');
  const customerValidation = await ctx.task(customerValidationTask, {
    companyName,
    productDescription,
    targetMarkets,
    competitorInsights: competitiveAnalysis.insights,
    outputDir
  });

  artifacts.push(...customerValidation.artifacts);

  // Task 4: Go-to-Market Assessment
  ctx.log('info', 'Assessing go-to-market strategy');
  const gtmAssessment = await ctx.task(gtmAssessmentTask, {
    companyName,
    productDescription,
    marketData: marketSizeAnalysis.marketData,
    competitivePosition: competitiveAnalysis.positioning,
    outputDir
  });

  artifacts.push(...gtmAssessment.artifacts);

  // Task 5: Market Trends and Dynamics
  ctx.log('info', 'Analyzing market trends and dynamics');
  const marketTrends = await ctx.task(marketTrendsTask, {
    industry,
    targetMarkets,
    timeHorizon: '5-year',
    outputDir
  });

  artifacts.push(...marketTrends.artifacts);

  // Task 6: Risk Assessment
  ctx.log('info', 'Assessing commercial risks');
  const riskAssessment = await ctx.task(commercialRiskTask, {
    marketSizeAnalysis,
    competitiveAnalysis,
    gtmAssessment,
    marketTrends,
    outputDir
  });

  artifacts.push(...riskAssessment.artifacts);

  // Breakpoint: Review commercial DD findings
  await ctx.breakpoint({
    question: `Commercial DD complete for ${companyName}. TAM: $${marketSizeAnalysis.tam}B, SAM: $${marketSizeAnalysis.sam}B. Review findings?`,
    title: 'Commercial Due Diligence Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        tam: marketSizeAnalysis.tam,
        sam: marketSizeAnalysis.sam,
        som: marketSizeAnalysis.som,
        competitorCount: competitiveAnalysis.competitorCount,
        gtmScore: gtmAssessment.score,
        riskLevel: riskAssessment.overallRisk
      }
    }
  });

  // Task 7: Generate Commercial DD Report
  ctx.log('info', 'Generating commercial due diligence report');
  const ddReport = await ctx.task(commercialDDReportTask, {
    companyName,
    marketSizeAnalysis,
    competitiveAnalysis,
    customerValidation,
    gtmAssessment,
    marketTrends,
    riskAssessment,
    outputDir
  });

  artifacts.push(...ddReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    marketAnalysis: {
      tam: marketSizeAnalysis.tam,
      sam: marketSizeAnalysis.sam,
      som: marketSizeAnalysis.som,
      methodology: marketSizeAnalysis.methodology,
      growthRate: marketSizeAnalysis.cagr
    },
    competitiveLandscape: {
      competitors: competitiveAnalysis.competitors,
      positioning: competitiveAnalysis.positioning,
      moatAssessment: competitiveAnalysis.moatAssessment,
      competitorCount: competitiveAnalysis.competitorCount
    },
    customerValidation: {
      framework: customerValidation.framework,
      keyQuestions: customerValidation.keyQuestions,
      targetCustomers: customerValidation.targetCustomers
    },
    gtmAssessment: {
      score: gtmAssessment.score,
      strategy: gtmAssessment.strategy,
      channelAnalysis: gtmAssessment.channels,
      recommendations: gtmAssessment.recommendations
    },
    marketTrends: marketTrends.trends,
    risks: riskAssessment.risks,
    overallRisk: riskAssessment.overallRisk,
    artifacts,
    duration,
    metadata: {
      processId: 'venture-capital/commercial-due-diligence',
      timestamp: startTime,
      companyName,
      industry
    }
  };
}

// Task 1: Market Size Analysis
export const marketSizeTask = defineTask('market-size-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze market size (TAM/SAM/SOM)',
  agent: {
    name: 'market-analyst',
    prompt: {
      role: 'market research analyst',
      task: 'Conduct comprehensive market size analysis',
      context: args,
      instructions: [
        'Calculate Total Addressable Market (TAM) using top-down and bottom-up approaches',
        'Define Serviceable Addressable Market (SAM) based on company capabilities',
        'Estimate Serviceable Obtainable Market (SOM) with realistic assumptions',
        'Document methodology and data sources',
        'Analyze market CAGR and growth drivers',
        'Identify market segments and their sizes',
        'Compare to third-party market research',
        'Highlight key assumptions and sensitivities'
      ],
      outputFormat: 'JSON with market sizes, methodology, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'tam', 'sam', 'som', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        tam: { type: 'number' },
        sam: { type: 'number' },
        som: { type: 'number' },
        cagr: { type: 'number' },
        methodology: { type: 'object' },
        marketData: { type: 'object' },
        segments: { type: 'array' },
        assumptions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'market-analysis', 'tam-sam-som']
}));

// Task 2: Competitive Landscape Mapping
export const competitiveLandscapeTask = defineTask('competitive-landscape', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map competitive landscape',
  agent: {
    name: 'competitive-analyst',
    prompt: {
      role: 'competitive intelligence analyst',
      task: 'Map and analyze competitive landscape',
      context: args,
      instructions: [
        'Identify direct and indirect competitors',
        'Analyze competitor funding, traction, and positioning',
        'Create competitive positioning map',
        'Assess competitive moats and barriers to entry',
        'Analyze pricing and business model comparisons',
        'Evaluate technology and product differentiation',
        'Identify potential acquirers and strategic threats',
        'Assess competitive dynamics and market share trends'
      ],
      outputFormat: 'JSON with competitors, positioning, moat assessment, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['competitors', 'positioning', 'moatAssessment', 'artifacts'],
      properties: {
        competitors: { type: 'array' },
        competitorCount: { type: 'number' },
        positioning: { type: 'object' },
        moatAssessment: { type: 'object' },
        insights: { type: 'array' },
        threats: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'competitive-analysis', 'landscape']
}));

// Task 3: Customer Validation Framework
export const customerValidationTask = defineTask('customer-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design customer validation',
  agent: {
    name: 'customer-researcher',
    prompt: {
      role: 'customer research specialist',
      task: 'Design and execute customer validation framework',
      context: args,
      instructions: [
        'Define target customer segments for validation',
        'Create customer interview guide and questions',
        'Identify key validation hypotheses to test',
        'Plan reference call approach with existing customers',
        'Design win/loss analysis framework',
        'Create NPS and satisfaction assessment',
        'Plan churned customer outreach',
        'Document validation findings template'
      ],
      outputFormat: 'JSON with validation framework, questions, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'keyQuestions', 'targetCustomers', 'artifacts'],
      properties: {
        framework: { type: 'object' },
        keyQuestions: { type: 'array' },
        targetCustomers: { type: 'array' },
        hypotheses: { type: 'array' },
        interviewGuide: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'customer-validation', 'research']
}));

// Task 4: Go-to-Market Assessment
export const gtmAssessmentTask = defineTask('gtm-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess go-to-market strategy',
  agent: {
    name: 'gtm-analyst',
    prompt: {
      role: 'go-to-market strategist',
      task: 'Assess company go-to-market strategy and execution',
      context: args,
      instructions: [
        'Evaluate current GTM strategy and channels',
        'Analyze sales motion (PLG, sales-led, hybrid)',
        'Assess marketing effectiveness and CAC',
        'Review pricing strategy and optimization',
        'Evaluate channel partner strategy',
        'Analyze international expansion approach',
        'Assess GTM team and capabilities',
        'Provide recommendations for GTM optimization'
      ],
      outputFormat: 'JSON with GTM score, strategy analysis, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'strategy', 'channels', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        strategy: { type: 'object' },
        channels: { type: 'array' },
        pricing: { type: 'object' },
        team: { type: 'object' },
        recommendations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'gtm', 'strategy']
}));

// Task 5: Market Trends and Dynamics
export const marketTrendsTask = defineTask('market-trends', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze market trends',
  agent: {
    name: 'trends-analyst',
    prompt: {
      role: 'market trends analyst',
      task: 'Analyze market trends and dynamics affecting the business',
      context: args,
      instructions: [
        'Identify key market trends and drivers',
        'Analyze technology trends impacting the market',
        'Assess regulatory and policy trends',
        'Evaluate macro-economic factors',
        'Identify emerging opportunities and threats',
        'Analyze buyer behavior shifts',
        'Project market evolution scenarios',
        'Assess timing and market readiness'
      ],
      outputFormat: 'JSON with trends, dynamics, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['trends', 'dynamics', 'artifacts'],
      properties: {
        trends: { type: 'array' },
        dynamics: { type: 'object' },
        opportunities: { type: 'array' },
        threats: { type: 'array' },
        scenarios: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'market-trends', 'analysis']
}));

// Task 6: Commercial Risk Assessment
export const commercialRiskTask = defineTask('commercial-risk', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess commercial risks',
  agent: {
    name: 'risk-analyst',
    prompt: {
      role: 'commercial risk analyst',
      task: 'Assess commercial risks from due diligence findings',
      context: args,
      instructions: [
        'Identify market size and growth risks',
        'Assess competitive and displacement risks',
        'Evaluate customer concentration risks',
        'Analyze pricing and margin pressure risks',
        'Assess GTM execution risks',
        'Evaluate regulatory and compliance risks',
        'Rate risks by likelihood and impact',
        'Propose risk mitigation strategies'
      ],
      outputFormat: 'JSON with risks, ratings, mitigations, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['risks', 'overallRisk', 'artifacts'],
      properties: {
        risks: { type: 'array' },
        overallRisk: { type: 'string', enum: ['low', 'medium', 'high'] },
        riskMatrix: { type: 'object' },
        mitigations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'risk-assessment', 'commercial']
}));

// Task 7: Commercial DD Report Generation
export const commercialDDReportTask = defineTask('commercial-dd-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate commercial DD report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'VC investment analyst',
      task: 'Generate comprehensive commercial due diligence report',
      context: args,
      instructions: [
        'Create executive summary of findings',
        'Present market size analysis with visuals',
        'Document competitive landscape mapping',
        'Include customer validation findings',
        'Present GTM assessment and recommendations',
        'Document market trends and dynamics',
        'Include risk assessment and mitigations',
        'Format as investment committee ready document'
      ],
      outputFormat: 'JSON with report path, key findings, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'keyFindings', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
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
  labels: ['agent', 'venture-capital', 'due-diligence', 'reporting']
}));
