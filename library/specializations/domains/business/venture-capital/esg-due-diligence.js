/**
 * @process venture-capital/esg-due-diligence
 * @description Environmental, social, and governance risk assessment using standardized frameworks including labor practices, environmental impact, and governance structure evaluation
 * @inputs { companyName: string, industry: string, companyData: object, esgFramework: string }
 * @outputs { success: boolean, esgScore: object, riskAssessment: object, recommendations: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    companyName,
    industry,
    companyData = {},
    esgFramework = 'SASB',
    outputDir = 'esg-dd-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Environmental Assessment
  ctx.log('info', 'Assessing environmental factors');
  const environmentalAssessment = await ctx.task(environmentalAssessmentTask, {
    companyName,
    industry,
    companyData,
    outputDir
  });

  if (!environmentalAssessment.success) {
    return {
      success: false,
      error: 'Environmental assessment failed',
      details: environmentalAssessment,
      metadata: { processId: 'venture-capital/esg-due-diligence', timestamp: startTime }
    };
  }

  artifacts.push(...environmentalAssessment.artifacts);

  // Task 2: Social Assessment
  ctx.log('info', 'Assessing social factors');
  const socialAssessment = await ctx.task(socialAssessmentTask, {
    companyName,
    industry,
    companyData,
    outputDir
  });

  artifacts.push(...socialAssessment.artifacts);

  // Task 3: Governance Assessment
  ctx.log('info', 'Assessing governance factors');
  const governanceAssessment = await ctx.task(governanceAssessmentTask, {
    companyName,
    companyData,
    outputDir
  });

  artifacts.push(...governanceAssessment.artifacts);

  // Task 4: Labor Practices Review
  ctx.log('info', 'Reviewing labor practices');
  const laborPractices = await ctx.task(laborPracticesTask, {
    companyName,
    companyData,
    outputDir
  });

  artifacts.push(...laborPractices.artifacts);

  // Task 5: Supply Chain Assessment
  ctx.log('info', 'Assessing supply chain ESG');
  const supplyChainAssessment = await ctx.task(supplyChainESGTask, {
    companyName,
    industry,
    companyData,
    outputDir
  });

  artifacts.push(...supplyChainAssessment.artifacts);

  // Task 6: ESG Risk Scoring
  ctx.log('info', 'Calculating ESG risk scores');
  const esgScoring = await ctx.task(esgScoringTask, {
    environmentalAssessment,
    socialAssessment,
    governanceAssessment,
    laborPractices,
    supplyChainAssessment,
    esgFramework,
    outputDir
  });

  artifacts.push(...esgScoring.artifacts);

  // Breakpoint: Review ESG DD findings
  await ctx.breakpoint({
    question: `ESG DD complete for ${companyName}. Overall ESG score: ${esgScoring.overallScore}/100. Material risks: ${esgScoring.materialRisks.length}. Review findings?`,
    title: 'ESG Due Diligence Results',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        overallScore: esgScoring.overallScore,
        environmentalScore: environmentalAssessment.score,
        socialScore: socialAssessment.score,
        governanceScore: governanceAssessment.score,
        materialRisks: esgScoring.materialRisks.length
      }
    }
  });

  // Task 7: Generate ESG DD Report
  ctx.log('info', 'Generating ESG due diligence report');
  const esgReport = await ctx.task(esgReportTask, {
    companyName,
    environmentalAssessment,
    socialAssessment,
    governanceAssessment,
    laborPractices,
    supplyChainAssessment,
    esgScoring,
    esgFramework,
    outputDir
  });

  artifacts.push(...esgReport.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    esgScore: {
      overall: esgScoring.overallScore,
      environmental: environmentalAssessment.score,
      social: socialAssessment.score,
      governance: governanceAssessment.score,
      framework: esgFramework
    },
    riskAssessment: {
      materialRisks: esgScoring.materialRisks,
      environmentalRisks: environmentalAssessment.risks,
      socialRisks: socialAssessment.risks,
      governanceRisks: governanceAssessment.risks
    },
    laborPractices: laborPractices.assessment,
    supplyChain: supplyChainAssessment.assessment,
    recommendations: esgReport.recommendations,
    artifacts,
    duration,
    metadata: {
      processId: 'venture-capital/esg-due-diligence',
      timestamp: startTime,
      companyName,
      esgFramework
    }
  };
}

// Task 1: Environmental Assessment
export const environmentalAssessmentTask = defineTask('environmental-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess environmental factors',
  agent: {
    name: 'environmental-analyst',
    prompt: {
      role: 'environmental ESG analyst',
      task: 'Assess environmental impact and practices',
      context: args,
      instructions: [
        'Assess carbon footprint and emissions',
        'Evaluate energy usage and efficiency',
        'Review waste management practices',
        'Assess water usage and conservation',
        'Evaluate environmental compliance',
        'Review climate risk exposure',
        'Assess sustainable product practices',
        'Identify environmental improvement opportunities'
      ],
      outputFormat: 'JSON with environmental assessment, score, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'score', 'assessment', 'artifacts'],
      properties: {
        success: { type: 'boolean' },
        score: { type: 'number', minimum: 0, maximum: 100 },
        assessment: { type: 'object' },
        metrics: { type: 'object' },
        risks: { type: 'array' },
        opportunities: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'esg', 'environmental']
}));

// Task 2: Social Assessment
export const socialAssessmentTask = defineTask('social-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess social factors',
  agent: {
    name: 'social-analyst',
    prompt: {
      role: 'social impact analyst',
      task: 'Assess social impact and practices',
      context: args,
      instructions: [
        'Evaluate diversity and inclusion metrics',
        'Assess employee health and safety',
        'Review community engagement',
        'Evaluate customer data protection',
        'Assess product safety and quality',
        'Review human rights practices',
        'Evaluate stakeholder engagement',
        'Identify social impact opportunities'
      ],
      outputFormat: 'JSON with social assessment, score, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'assessment', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        assessment: { type: 'object' },
        metrics: { type: 'object' },
        risks: { type: 'array' },
        opportunities: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'esg', 'social']
}));

// Task 3: Governance Assessment
export const governanceAssessmentTask = defineTask('governance-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess governance factors',
  agent: {
    name: 'governance-analyst',
    prompt: {
      role: 'corporate governance analyst',
      task: 'Assess governance structure and practices',
      context: args,
      instructions: [
        'Evaluate board composition and independence',
        'Assess executive compensation alignment',
        'Review shareholder rights',
        'Evaluate audit and risk oversight',
        'Assess business ethics policies',
        'Review anti-corruption measures',
        'Evaluate transparency and disclosure',
        'Identify governance improvements'
      ],
      outputFormat: 'JSON with governance assessment, score, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'assessment', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        assessment: { type: 'object' },
        boardComposition: { type: 'object' },
        policies: { type: 'array' },
        risks: { type: 'array' },
        improvements: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'esg', 'governance']
}));

// Task 4: Labor Practices Review
export const laborPracticesTask = defineTask('labor-practices', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review labor practices',
  agent: {
    name: 'labor-analyst',
    prompt: {
      role: 'labor practices specialist',
      task: 'Review labor practices and employee treatment',
      context: args,
      instructions: [
        'Evaluate compensation and benefits',
        'Assess working conditions',
        'Review employee development programs',
        'Evaluate work-life balance policies',
        'Assess freedom of association',
        'Review contractor and gig worker treatment',
        'Evaluate dispute resolution processes',
        'Identify labor practice improvements'
      ],
      outputFormat: 'JSON with labor practices assessment and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assessment', 'rating', 'artifacts'],
      properties: {
        assessment: { type: 'object' },
        rating: { type: 'string', enum: ['excellent', 'good', 'adequate', 'poor'] },
        metrics: { type: 'object' },
        concerns: { type: 'array' },
        improvements: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'esg', 'labor']
}));

// Task 5: Supply Chain ESG Assessment
export const supplyChainESGTask = defineTask('supply-chain-esg', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess supply chain ESG',
  agent: {
    name: 'supply-chain-analyst',
    prompt: {
      role: 'supply chain ESG analyst',
      task: 'Assess supply chain ESG risks and practices',
      context: args,
      instructions: [
        'Map key suppliers and vendors',
        'Assess supplier environmental practices',
        'Review supplier labor conditions',
        'Evaluate supplier governance',
        'Assess conflict mineral risks',
        'Review supplier diversity',
        'Evaluate supply chain transparency',
        'Identify supply chain ESG improvements'
      ],
      outputFormat: 'JSON with supply chain assessment and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['assessment', 'risks', 'artifacts'],
      properties: {
        assessment: { type: 'object' },
        keySuppliers: { type: 'array' },
        risks: { type: 'array' },
        transparency: { type: 'object' },
        improvements: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'esg', 'supply-chain']
}));

// Task 6: ESG Scoring
export const esgScoringTask = defineTask('esg-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate ESG scores',
  agent: {
    name: 'esg-scorer',
    prompt: {
      role: 'ESG scoring specialist',
      task: 'Calculate comprehensive ESG scores',
      context: args,
      instructions: [
        'Apply ESG scoring framework methodology',
        'Weight scores by industry materiality',
        'Calculate component scores (E, S, G)',
        'Calculate overall ESG score',
        'Identify material ESG risks',
        'Compare to industry benchmarks',
        'Assess ESG trajectory',
        'Generate ESG scorecard'
      ],
      outputFormat: 'JSON with ESG scores, material risks, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'materialRisks', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: { type: 'object' },
        materialRisks: { type: 'array' },
        benchmarkComparison: { type: 'object' },
        trajectory: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'esg', 'scoring']
}));

// Task 7: ESG Report Generation
export const esgReportTask = defineTask('esg-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate ESG DD report',
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'ESG reporting specialist',
      task: 'Generate comprehensive ESG due diligence report',
      context: args,
      instructions: [
        'Create executive summary of ESG findings',
        'Present environmental assessment',
        'Document social assessment',
        'Include governance assessment',
        'Present labor practices review',
        'Document supply chain assessment',
        'Include ESG scorecard',
        'Provide improvement recommendations',
        'Format per LP ESG reporting standards'
      ],
      outputFormat: 'JSON with report path, recommendations, and artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'recommendations', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        recommendations: { type: 'array' },
        executiveSummary: { type: 'string' },
        scorecard: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'venture-capital', 'esg', 'reporting']
}));
