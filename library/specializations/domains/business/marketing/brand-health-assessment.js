/**
 * @process marketing/brand-health-assessment
 * @description Measure brand equity using Keller's CBBE model (salience, performance, imagery, judgments, feelings, resonance) through surveys and tracking studies.
 * @inputs { brandName: string, industry: string, competitors: array, existingData: object, researchBudget: string, targetMarkets: array }
 * @outputs { success: boolean, brandHealthScore: number, cbbeAnalysis: object, trackingMetrics: object, recommendations: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    brandName = 'Brand',
    industry = '',
    competitors = [],
    existingData = {},
    researchBudget = '',
    targetMarkets = [],
    outputDir = 'brand-health-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Brand Health Assessment for ${brandName}`);

  // ============================================================================
  // PHASE 1: RESEARCH DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 1: Designing brand health research methodology');
  const researchDesign = await ctx.task(brandResearchDesignTask, {
    brandName,
    industry,
    competitors,
    existingData,
    researchBudget,
    targetMarkets,
    outputDir
  });

  artifacts.push(...researchDesign.artifacts);

  // ============================================================================
  // PHASE 2: BRAND SALIENCE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Analyzing brand salience (awareness and recognition)');
  const salienceAnalysis = await ctx.task(brandSalienceAnalysisTask, {
    brandName,
    competitors,
    existingData,
    researchDesign,
    outputDir
  });

  artifacts.push(...salienceAnalysis.artifacts);

  // ============================================================================
  // PHASE 3: BRAND PERFORMANCE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 3: Analyzing brand performance perceptions');
  const performanceAnalysis = await ctx.task(brandPerformanceAnalysisTask, {
    brandName,
    industry,
    competitors,
    existingData,
    researchDesign,
    outputDir
  });

  artifacts.push(...performanceAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: BRAND IMAGERY ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 4: Analyzing brand imagery and associations');
  const imageryAnalysis = await ctx.task(brandImageryAnalysisTask, {
    brandName,
    competitors,
    existingData,
    researchDesign,
    outputDir
  });

  artifacts.push(...imageryAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: BRAND JUDGMENTS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing brand judgments (quality, credibility)');
  const judgmentsAnalysis = await ctx.task(brandJudgmentsAnalysisTask, {
    brandName,
    competitors,
    existingData,
    performanceAnalysis,
    imageryAnalysis,
    outputDir
  });

  artifacts.push(...judgmentsAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: BRAND FEELINGS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Analyzing brand feelings and emotional responses');
  const feelingsAnalysis = await ctx.task(brandFeelingsAnalysisTask, {
    brandName,
    competitors,
    existingData,
    imageryAnalysis,
    outputDir
  });

  artifacts.push(...feelingsAnalysis.artifacts);

  // ============================================================================
  // PHASE 7: BRAND RESONANCE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 7: Analyzing brand resonance (loyalty, attachment)');
  const resonanceAnalysis = await ctx.task(brandResonanceAnalysisTask, {
    brandName,
    competitors,
    existingData,
    judgmentsAnalysis,
    feelingsAnalysis,
    outputDir
  });

  artifacts.push(...resonanceAnalysis.artifacts);

  // ============================================================================
  // PHASE 8: COMPREHENSIVE CBBE SCORING
  // ============================================================================

  ctx.log('info', 'Phase 8: Calculating comprehensive CBBE brand equity score');
  const cbbeScoring = await ctx.task(cbbeScoringTask, {
    brandName,
    salienceAnalysis,
    performanceAnalysis,
    imageryAnalysis,
    judgmentsAnalysis,
    feelingsAnalysis,
    resonanceAnalysis,
    outputDir
  });

  artifacts.push(...cbbeScoring.artifacts);

  // ============================================================================
  // PHASE 9: TRACKING METRICS DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 9: Defining brand tracking metrics and KPIs');
  const trackingMetrics = await ctx.task(trackingMetricsDefinitionTask, {
    brandName,
    cbbeScoring,
    researchDesign,
    targetMarkets,
    outputDir
  });

  artifacts.push(...trackingMetrics.artifacts);

  // ============================================================================
  // PHASE 10: RECOMMENDATIONS AND ACTION PLAN
  // ============================================================================

  ctx.log('info', 'Phase 10: Developing recommendations and action plan');
  const recommendationsReport = await ctx.task(brandHealthRecommendationsTask, {
    brandName,
    salienceAnalysis,
    performanceAnalysis,
    imageryAnalysis,
    judgmentsAnalysis,
    feelingsAnalysis,
    resonanceAnalysis,
    cbbeScoring,
    competitors,
    outputDir
  });

  artifacts.push(...recommendationsReport.artifacts);

  const brandHealthScore = cbbeScoring.overallScore;
  const qualityMet = brandHealthScore >= 70;

  // Breakpoint: Review brand health assessment
  await ctx.breakpoint({
    question: `Brand health assessment complete. Overall score: ${brandHealthScore}/100. ${qualityMet ? 'Brand health is strong!' : 'Brand health needs attention.'} Review and approve?`,
    title: 'Brand Health Assessment Review & Approval',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        brandHealthScore,
        qualityMet,
        brandName,
        totalArtifacts: artifacts.length,
        salienceScore: salienceAnalysis.score || 0,
        performanceScore: performanceAnalysis.score || 0,
        imageryScore: imageryAnalysis.score || 0,
        judgmentsScore: judgmentsAnalysis.score || 0,
        feelingsScore: feelingsAnalysis.score || 0,
        resonanceScore: resonanceAnalysis.score || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    brandName,
    brandHealthScore,
    qualityMet,
    cbbeAnalysis: {
      salience: salienceAnalysis,
      performance: performanceAnalysis,
      imagery: imageryAnalysis,
      judgments: judgmentsAnalysis,
      feelings: feelingsAnalysis,
      resonance: resonanceAnalysis,
      overallScore: cbbeScoring.overallScore,
      pyramid: cbbeScoring.brandPyramid
    },
    trackingMetrics: {
      kpis: trackingMetrics.kpis,
      trackingFrequency: trackingMetrics.frequency,
      benchmarks: trackingMetrics.benchmarks
    },
    competitiveComparison: cbbeScoring.competitiveComparison,
    recommendations: recommendationsReport.recommendations,
    actionPlan: recommendationsReport.actionPlan,
    artifacts,
    duration,
    metadata: {
      processId: 'marketing/brand-health-assessment',
      timestamp: startTime,
      brandName,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Brand Research Design
export const brandResearchDesignTask = defineTask('brand-research-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design brand health research methodology',
  agent: {
    name: 'research-designer',
    prompt: {
      role: 'market research director and brand measurement expert',
      task: 'Design comprehensive brand health research methodology using Keller\'s CBBE framework',
      context: args,
      instructions: [
        'Define research objectives aligned with CBBE model dimensions',
        'Design quantitative survey methodology for brand tracking',
        'Design qualitative research components (focus groups, interviews)',
        'Define sample sizes and recruitment criteria',
        'Create survey instruments for each CBBE dimension',
        'Define competitor benchmarking approach',
        'Plan data collection timeline and frequency',
        'Define analysis methods and statistical approaches',
        'Budget allocation across research components',
        'Generate research design document'
      ],
      outputFormat: 'JSON with methodology (object), surveyDesign (object), qualitativeDesign (object), samplePlan (object), timeline (object), budget (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['methodology', 'surveyDesign', 'samplePlan', 'artifacts'],
      properties: {
        methodology: {
          type: 'object',
          properties: {
            approach: { type: 'string' },
            dimensions: { type: 'array', items: { type: 'string' } },
            methods: { type: 'array', items: { type: 'string' } }
          }
        },
        surveyDesign: {
          type: 'object',
          properties: {
            questions: { type: 'number' },
            scales: { type: 'array', items: { type: 'string' } },
            duration: { type: 'string' }
          }
        },
        qualitativeDesign: { type: 'object' },
        samplePlan: {
          type: 'object',
          properties: {
            totalSample: { type: 'number' },
            segments: { type: 'array' }
          }
        },
        timeline: { type: 'object' },
        budget: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'brand-health', 'research-design']
}));

// Task 2: Brand Salience Analysis
export const brandSalienceAnalysisTask = defineTask('brand-salience-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze brand salience',
  agent: {
    name: 'salience-analyst',
    prompt: {
      role: 'brand research analyst specializing in brand awareness',
      task: 'Analyze brand salience including awareness, recognition, and recall metrics',
      context: args,
      instructions: [
        'Measure unaided brand awareness (top-of-mind and spontaneous)',
        'Measure aided brand awareness levels',
        'Assess brand recognition across touchpoints',
        'Analyze category purchase drivers and brand associations',
        'Compare awareness metrics against competitors',
        'Identify awareness gaps by segment and market',
        'Assess brand visibility and mental availability',
        'Analyze share of voice and media presence',
        'Calculate salience score and benchmark',
        'Generate salience analysis report'
      ],
      outputFormat: 'JSON with score (number 0-100), unaided (object), aided (object), recognition (object), competitorComparison (array), gaps (array), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'unaided', 'aided', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        unaided: {
          type: 'object',
          properties: {
            topOfMind: { type: 'number' },
            spontaneous: { type: 'number' }
          }
        },
        aided: {
          type: 'object',
          properties: {
            awareness: { type: 'number' },
            familiarity: { type: 'number' }
          }
        },
        recognition: { type: 'object' },
        competitorComparison: { type: 'array' },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'brand-health', 'salience']
}));

// Task 3: Brand Performance Analysis
export const brandPerformanceAnalysisTask = defineTask('brand-performance-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze brand performance perceptions',
  agent: {
    name: 'performance-analyst',
    prompt: {
      role: 'brand research analyst specializing in functional brand equity',
      task: 'Analyze brand performance perceptions including functional attributes and reliability',
      context: args,
      instructions: [
        'Measure perceptions of product/service quality',
        'Assess reliability and durability perceptions',
        'Analyze service effectiveness ratings',
        'Measure style and design perceptions',
        'Assess price-value relationship perceptions',
        'Compare performance against category expectations',
        'Benchmark against key competitors',
        'Identify performance strengths and weaknesses',
        'Calculate performance score',
        'Generate performance analysis report'
      ],
      outputFormat: 'JSON with score (number 0-100), qualityPerception (object), reliability (object), effectiveness (object), valuePerception (object), competitorBenchmark (array), strengths (array), weaknesses (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'qualityPerception', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        qualityPerception: {
          type: 'object',
          properties: {
            overall: { type: 'number' },
            attributes: { type: 'array' }
          }
        },
        reliability: { type: 'object' },
        effectiveness: { type: 'object' },
        valuePerception: { type: 'object' },
        competitorBenchmark: { type: 'array' },
        strengths: { type: 'array', items: { type: 'string' } },
        weaknesses: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'brand-health', 'performance']
}));

// Task 4: Brand Imagery Analysis
export const brandImageryAnalysisTask = defineTask('brand-imagery-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze brand imagery and associations',
  agent: {
    name: 'imagery-analyst',
    prompt: {
      role: 'brand research analyst specializing in brand image and associations',
      task: 'Analyze brand imagery including user profiles, purchase/usage situations, and brand personality',
      context: args,
      instructions: [
        'Map brand user profile perceptions (who uses the brand)',
        'Analyze purchase and usage situation associations',
        'Assess brand personality traits and character',
        'Measure brand values and heritage perceptions',
        'Analyze brand visual and sensory associations',
        'Compare imagery against desired positioning',
        'Benchmark imagery against competitors',
        'Identify imagery strengths and gaps',
        'Calculate imagery score',
        'Generate imagery analysis report'
      ],
      outputFormat: 'JSON with score (number 0-100), userProfile (object), usageSituations (array), personality (array), values (array), associations (array), competitorComparison (array), gaps (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'userProfile', 'personality', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        userProfile: {
          type: 'object',
          properties: {
            demographics: { type: 'object' },
            psychographics: { type: 'object' }
          }
        },
        usageSituations: { type: 'array', items: { type: 'string' } },
        personality: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              trait: { type: 'string' },
              strength: { type: 'number' }
            }
          }
        },
        values: { type: 'array', items: { type: 'string' } },
        associations: { type: 'array' },
        competitorComparison: { type: 'array' },
        gaps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'brand-health', 'imagery']
}));

// Task 5: Brand Judgments Analysis
export const brandJudgmentsAnalysisTask = defineTask('brand-judgments-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze brand judgments',
  agent: {
    name: 'judgments-analyst',
    prompt: {
      role: 'brand research analyst specializing in brand credibility and judgments',
      task: 'Analyze brand judgments including quality perceptions, credibility, consideration, and superiority',
      context: args,
      instructions: [
        'Measure overall brand quality judgments',
        'Assess brand credibility (expertise, trustworthiness, likability)',
        'Analyze brand consideration and purchase intent',
        'Measure perceived brand superiority vs competitors',
        'Assess brand relevance to customer needs',
        'Analyze satisfaction and loyalty indicators',
        'Compare judgments across customer segments',
        'Benchmark against competitors',
        'Calculate judgments score',
        'Generate judgments analysis report'
      ],
      outputFormat: 'JSON with score (number 0-100), qualityJudgment (object), credibility (object), consideration (object), superiority (object), relevance (object), competitorBenchmark (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'qualityJudgment', 'credibility', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        qualityJudgment: {
          type: 'object',
          properties: {
            overall: { type: 'number' },
            dimensions: { type: 'array' }
          }
        },
        credibility: {
          type: 'object',
          properties: {
            expertise: { type: 'number' },
            trustworthiness: { type: 'number' },
            likability: { type: 'number' }
          }
        },
        consideration: {
          type: 'object',
          properties: {
            inConsideration: { type: 'number' },
            purchaseIntent: { type: 'number' }
          }
        },
        superiority: { type: 'object' },
        relevance: { type: 'object' },
        competitorBenchmark: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'brand-health', 'judgments']
}));

// Task 6: Brand Feelings Analysis
export const brandFeelingsAnalysisTask = defineTask('brand-feelings-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze brand feelings',
  agent: {
    name: 'feelings-analyst',
    prompt: {
      role: 'brand research analyst specializing in emotional brand equity',
      task: 'Analyze brand feelings and emotional responses evoked by the brand',
      context: args,
      instructions: [
        'Measure warmth and comfort associations',
        'Assess fun and excitement feelings',
        'Analyze security and trust emotions',
        'Measure social approval feelings',
        'Assess self-respect and accomplishment emotions',
        'Analyze overall emotional connection strength',
        'Map emotional response triggers',
        'Compare emotional equity against competitors',
        'Identify emotional equity gaps',
        'Calculate feelings score',
        'Generate feelings analysis report'
      ],
      outputFormat: 'JSON with score (number 0-100), warmth (object), excitement (object), security (object), socialApproval (object), selfRespect (object), emotionalConnection (object), competitorComparison (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'warmth', 'emotionalConnection', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        warmth: {
          type: 'object',
          properties: {
            score: { type: 'number' },
            drivers: { type: 'array', items: { type: 'string' } }
          }
        },
        excitement: { type: 'object' },
        security: { type: 'object' },
        socialApproval: { type: 'object' },
        selfRespect: { type: 'object' },
        emotionalConnection: {
          type: 'object',
          properties: {
            strength: { type: 'number' },
            triggers: { type: 'array', items: { type: 'string' } }
          }
        },
        competitorComparison: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'brand-health', 'feelings']
}));

// Task 7: Brand Resonance Analysis
export const brandResonanceAnalysisTask = defineTask('brand-resonance-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze brand resonance',
  agent: {
    name: 'resonance-analyst',
    prompt: {
      role: 'brand research analyst specializing in brand loyalty and relationships',
      task: 'Analyze brand resonance including loyalty, attachment, community, and engagement',
      context: args,
      instructions: [
        'Measure behavioral loyalty (repeat purchase, share of wallet)',
        'Assess attitudinal attachment and brand love',
        'Analyze sense of community among brand users',
        'Measure active engagement (advocacy, participation)',
        'Calculate Net Promoter Score (NPS)',
        'Assess willingness to pay premium',
        'Analyze brand relationship strength',
        'Compare resonance metrics against competitors',
        'Identify loyalty drivers and barriers',
        'Calculate resonance score',
        'Generate resonance analysis report'
      ],
      outputFormat: 'JSON with score (number 0-100), behavioralLoyalty (object), attachment (object), community (object), engagement (object), nps (number), premiumWillingness (object), competitorComparison (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['score', 'behavioralLoyalty', 'attachment', 'engagement', 'artifacts'],
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        behavioralLoyalty: {
          type: 'object',
          properties: {
            repeatPurchase: { type: 'number' },
            shareOfWallet: { type: 'number' }
          }
        },
        attachment: {
          type: 'object',
          properties: {
            brandLove: { type: 'number' },
            emotionalBond: { type: 'number' }
          }
        },
        community: {
          type: 'object',
          properties: {
            belonging: { type: 'number' },
            identification: { type: 'number' }
          }
        },
        engagement: {
          type: 'object',
          properties: {
            advocacy: { type: 'number' },
            participation: { type: 'number' }
          }
        },
        nps: { type: 'number' },
        premiumWillingness: { type: 'object' },
        competitorComparison: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'brand-health', 'resonance']
}));

// Task 8: CBBE Scoring
export const cbbeScoringTask = defineTask('cbbe-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Calculate comprehensive CBBE brand equity score',
  agent: {
    name: 'cbbe-scorer',
    prompt: {
      role: 'brand equity measurement specialist',
      task: 'Calculate comprehensive brand equity score using Keller\'s CBBE pyramid model',
      context: args,
      instructions: [
        'Weight CBBE dimensions appropriately (salience 15%, meaning 35%, response 30%, relationships 20%)',
        'Calculate overall brand equity index',
        'Create brand pyramid visualization',
        'Compare scores against competitors',
        'Identify strongest and weakest pyramid levels',
        'Analyze dimension interactions and dependencies',
        'Benchmark against industry standards',
        'Calculate brand equity value indicators',
        'Generate comprehensive CBBE scorecard',
        'Document scoring methodology and assumptions'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), dimensionScores (object), brandPyramid (object), competitiveComparison (array), strengths (array), weaknesses (array), benchmarks (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'dimensionScores', 'brandPyramid', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        dimensionScores: {
          type: 'object',
          properties: {
            salience: { type: 'number' },
            performance: { type: 'number' },
            imagery: { type: 'number' },
            judgments: { type: 'number' },
            feelings: { type: 'number' },
            resonance: { type: 'number' }
          }
        },
        brandPyramid: {
          type: 'object',
          properties: {
            identity: { type: 'object' },
            meaning: { type: 'object' },
            response: { type: 'object' },
            relationships: { type: 'object' }
          }
        },
        competitiveComparison: { type: 'array' },
        strengths: { type: 'array', items: { type: 'string' } },
        weaknesses: { type: 'array', items: { type: 'string' } },
        benchmarks: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'brand-health', 'cbbe-scoring']
}));

// Task 9: Tracking Metrics Definition
export const trackingMetricsDefinitionTask = defineTask('tracking-metrics-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define brand tracking metrics and KPIs',
  agent: {
    name: 'metrics-designer',
    prompt: {
      role: 'brand measurement and analytics specialist',
      task: 'Define brand health tracking metrics and KPIs for ongoing measurement',
      context: args,
      instructions: [
        'Define core brand health KPIs for each CBBE dimension',
        'Establish tracking frequency (monthly, quarterly, annually)',
        'Set benchmark targets for each metric',
        'Define alert thresholds for metric changes',
        'Create dashboard specifications',
        'Define data collection methods and sources',
        'Establish competitor tracking approach',
        'Create trend analysis framework',
        'Define reporting templates and formats',
        'Generate tracking metrics documentation'
      ],
      outputFormat: 'JSON with kpis (array), frequency (object), benchmarks (object), alertThresholds (object), dashboard (object), dataCollection (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['kpis', 'frequency', 'benchmarks', 'artifacts'],
      properties: {
        kpis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              metric: { type: 'string' },
              dimension: { type: 'string' },
              target: { type: 'number' },
              frequency: { type: 'string' }
            }
          }
        },
        frequency: {
          type: 'object',
          properties: {
            awareness: { type: 'string' },
            consideration: { type: 'string' },
            loyalty: { type: 'string' },
            comprehensive: { type: 'string' }
          }
        },
        benchmarks: { type: 'object' },
        alertThresholds: { type: 'object' },
        dashboard: {
          type: 'object',
          properties: {
            sections: { type: 'array' },
            visualizations: { type: 'array' }
          }
        },
        dataCollection: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'brand-health', 'tracking-metrics']
}));

// Task 10: Brand Health Recommendations
export const brandHealthRecommendationsTask = defineTask('brand-health-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop recommendations and action plan',
  agent: {
    name: 'brand-strategist',
    prompt: {
      role: 'chief brand strategist and consultant',
      task: 'Develop strategic recommendations and action plan based on brand health assessment',
      context: args,
      instructions: [
        'Prioritize brand health improvement opportunities',
        'Develop recommendations for each weak CBBE dimension',
        'Create quick wins for immediate impact',
        'Develop long-term brand building initiatives',
        'Align recommendations with business objectives',
        'Estimate investment requirements and ROI',
        'Create implementation timeline',
        'Define success metrics for each initiative',
        'Identify risks and mitigation strategies',
        'Generate comprehensive recommendations report'
      ],
      outputFormat: 'JSON with recommendations (array), actionPlan (object), quickWins (array), longTermInitiatives (array), investment (object), timeline (object), successMetrics (array), risks (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'actionPlan', 'artifacts'],
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              dimension: { type: 'string' },
              recommendation: { type: 'string' },
              priority: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        actionPlan: {
          type: 'object',
          properties: {
            phases: { type: 'array' },
            milestones: { type: 'array' }
          }
        },
        quickWins: { type: 'array', items: { type: 'string' } },
        longTermInitiatives: { type: 'array' },
        investment: {
          type: 'object',
          properties: {
            total: { type: 'string' },
            byPhase: { type: 'object' }
          }
        },
        timeline: { type: 'object' },
        successMetrics: { type: 'array' },
        risks: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'brand-health', 'recommendations']
}));
