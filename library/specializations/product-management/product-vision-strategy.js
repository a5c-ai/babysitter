/**
 * @process product-management/product-vision-strategy
 * @description Product Vision and Strategy Development process with vision statement crafting, strategic pillars definition, 3-year roadmap planning, target segment identification, competitive moat analysis, and success criteria establishment
 * @inputs { productName: string, industry: string, currentState: object, stakeholders: array, outputDir: string, timeHorizon: number, marketContext: object, existingVision: string }
 * @outputs { success: boolean, visionStatement: string, strategicPillars: array, roadmap: object, targetSegments: array, competitiveMoats: array, successCriteria: array, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    productName = '',
    industry = '',
    currentState = {},
    stakeholders = [],
    outputDir = 'vision-strategy-output',
    timeHorizon = 3, // years
    marketContext = {},
    existingVision = '',
    includeFinancialProjections = true,
    requireAlignment = true,
    competitorAnalysisDepth = 'comprehensive' // 'basic', 'moderate', 'comprehensive'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Product Vision and Strategy Development for: ${productName}`);
  ctx.log('info', `Time Horizon: ${timeHorizon} years, Industry: ${industry}`);

  // ============================================================================
  // PHASE 1: MARKET AND COMPETITIVE LANDSCAPE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing market and competitive landscape');

  const marketAnalysis = await ctx.task(marketLandscapeAnalysisTask, {
    productName,
    industry,
    marketContext,
    currentState,
    competitorAnalysisDepth,
    outputDir
  });

  artifacts.push(...marketAnalysis.artifacts);

  ctx.log('info', `Market analysis complete. Market size: ${marketAnalysis.marketSize}, Growth rate: ${marketAnalysis.growthRate}`);

  // ============================================================================
  // PHASE 2: CUSTOMER SEGMENT IDENTIFICATION AND ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Identifying and analyzing target customer segments');

  const segmentAnalysis = await ctx.task(customerSegmentAnalysisTask, {
    productName,
    industry,
    marketAnalysis,
    currentState,
    outputDir
  });

  artifacts.push(...segmentAnalysis.artifacts);

  const targetSegments = segmentAnalysis.segments;
  ctx.log('info', `Identified ${targetSegments.length} primary target segments`);

  // ============================================================================
  // PHASE 3: PRODUCT POSITIONING AND DIFFERENTIATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Defining product positioning and differentiation');

  const positioning = await ctx.task(productPositioningTask, {
    productName,
    industry,
    targetSegments,
    marketAnalysis,
    currentState,
    outputDir
  });

  artifacts.push(...positioning.artifacts);

  // Breakpoint: Review market analysis and positioning
  await ctx.breakpoint({
    question: `Market analysis complete. ${targetSegments.length} segments identified. Positioning: "${positioning.positioningStatement}". Review before vision crafting?`,
    title: 'Market Analysis Review',
    context: {
      runId: ctx.runId,
      productName,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        label: a.label || undefined
      })),
      summary: {
        marketSize: marketAnalysis.marketSize,
        competitorsCount: marketAnalysis.competitors.length,
        segmentsCount: targetSegments.length,
        positioningStatement: positioning.positioningStatement
      }
    }
  });

  // ============================================================================
  // PHASE 4: VISION STATEMENT CRAFTING
  // ============================================================================

  ctx.log('info', 'Phase 4: Crafting compelling product vision statement');

  const visionCrafting = await ctx.task(visionStatementCraftingTask, {
    productName,
    industry,
    targetSegments,
    positioning,
    marketAnalysis,
    currentState,
    existingVision,
    outputDir
  });

  artifacts.push(...visionCrafting.artifacts);

  const visionStatement = visionCrafting.visionStatement;
  ctx.log('info', `Vision statement crafted: "${visionStatement.substring(0, 100)}..."`);

  // ============================================================================
  // PHASE 5: STRATEGIC PILLARS DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 5: Defining strategic pillars');

  const strategicPillarsDefinition = await ctx.task(strategicPillarsDefinitionTask, {
    productName,
    visionStatement,
    targetSegments,
    positioning,
    marketAnalysis,
    timeHorizon,
    outputDir
  });

  artifacts.push(...strategicPillarsDefinition.artifacts);

  const strategicPillars = strategicPillarsDefinition.pillars;
  ctx.log('info', `Defined ${strategicPillars.length} strategic pillars`);

  // ============================================================================
  // PHASE 6: COMPETITIVE MOATS IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Identifying and defining competitive moats');

  const competitiveMoatsAnalysis = await ctx.task(competitiveMoatsAnalysisTask, {
    productName,
    visionStatement,
    strategicPillars,
    positioning,
    marketAnalysis,
    currentState,
    outputDir
  });

  artifacts.push(...competitiveMoatsAnalysis.artifacts);

  const competitiveMoats = competitiveMoatsAnalysis.moats;
  ctx.log('info', `Identified ${competitiveMoats.length} competitive moats`);

  // Breakpoint: Review vision and strategic foundation
  await ctx.breakpoint({
    question: `Vision statement and strategic foundation complete. ${strategicPillars.length} pillars, ${competitiveMoats.length} competitive moats. Review before roadmap planning?`,
    title: 'Strategic Foundation Review',
    context: {
      runId: ctx.runId,
      productName,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        label: a.label || undefined
      })),
      summary: {
        visionStatement: visionStatement.substring(0, 200),
        pillarsCount: strategicPillars.length,
        moatsCount: competitiveMoats.length,
        pillars: strategicPillars.map(p => p.title)
      }
    }
  });

  // ============================================================================
  // PHASE 7: THREE-YEAR ROADMAP PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 7: Planning three-year strategic roadmap');

  const roadmapPlanning = await ctx.task(threeYearRoadmapPlanningTask, {
    productName,
    visionStatement,
    strategicPillars,
    targetSegments,
    competitiveMoats,
    currentState,
    timeHorizon,
    outputDir
  });

  artifacts.push(...roadmapPlanning.artifacts);

  const roadmap = roadmapPlanning.roadmap;
  ctx.log('info', `${timeHorizon}-year roadmap created with ${roadmap.phases.length} phases`);

  // ============================================================================
  // PHASE 8: SUCCESS CRITERIA AND KPI FRAMEWORK
  // ============================================================================

  ctx.log('info', 'Phase 8: Defining success criteria and KPI framework');

  const successCriteriaDefinition = await ctx.task(successCriteriaDefinitionTask, {
    productName,
    visionStatement,
    strategicPillars,
    roadmap,
    targetSegments,
    timeHorizon,
    outputDir
  });

  artifacts.push(...successCriteriaDefinition.artifacts);

  const successCriteria = successCriteriaDefinition.criteria;
  ctx.log('info', `Defined ${successCriteria.length} success criteria with KPIs`);

  // ============================================================================
  // PHASE 9: FINANCIAL PROJECTIONS AND RESOURCE PLANNING (IF ENABLED)
  // ============================================================================

  let financialProjections = null;
  if (includeFinancialProjections) {
    ctx.log('info', 'Phase 9: Creating financial projections and resource plans');

    financialProjections = await ctx.task(financialProjectionsTask, {
      productName,
      visionStatement,
      roadmap,
      targetSegments,
      marketAnalysis,
      timeHorizon,
      outputDir
    });

    artifacts.push(...financialProjections.artifacts);
  }

  // ============================================================================
  // PHASE 10: STRATEGIC RISK ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 10: Assessing strategic risks and mitigation strategies');

  const strategicRiskAssessment = await ctx.task(strategicRiskAssessmentTask, {
    productName,
    visionStatement,
    strategicPillars,
    roadmap,
    competitiveMoats,
    marketAnalysis,
    outputDir
  });

  artifacts.push(...strategicRiskAssessment.artifacts);

  // ============================================================================
  // PHASE 11: STRATEGY DOCUMENT ASSEMBLY
  // ============================================================================

  ctx.log('info', 'Phase 11: Assembling comprehensive strategy document');

  const strategyAssembly = await ctx.task(strategyDocumentAssemblyTask, {
    productName,
    visionStatement,
    strategicPillars,
    roadmap,
    targetSegments,
    competitiveMoats,
    successCriteria,
    positioning,
    marketAnalysis,
    financialProjections,
    strategicRiskAssessment,
    stakeholders,
    timeHorizon,
    outputDir
  });

  artifacts.push(...strategyAssembly.artifacts);

  // ============================================================================
  // PHASE 12: STRATEGY QUALITY VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 12: Validating strategy quality and completeness');

  const qualityValidation = await ctx.task(strategyQualityValidationTask, {
    productName,
    strategyDocument: strategyAssembly.strategyDocument,
    visionStatement,
    strategicPillars,
    roadmap,
    successCriteria,
    competitiveMoats,
    outputDir
  });

  artifacts.push(...qualityValidation.artifacts);

  const qualityScore = qualityValidation.overallScore;
  const qualityMet = qualityScore >= 85;

  // Breakpoint: Review strategy quality
  await ctx.breakpoint({
    question: `Strategy quality score: ${qualityScore}/100. ${qualityMet ? 'Quality meets standards!' : 'Quality may need improvement.'} Review strategy?`,
    title: 'Strategy Quality Review',
    context: {
      runId: ctx.runId,
      productName,
      qualityScore,
      qualityMet,
      componentScores: qualityValidation.componentScores,
      strengths: qualityValidation.strengths,
      gaps: qualityValidation.gaps,
      files: [{
        path: strategyAssembly.strategyPath,
        format: 'markdown',
        label: 'Product Vision and Strategy Document'
      }, {
        path: qualityValidation.reportPath,
        format: 'markdown',
        label: 'Quality Validation Report'
      }]
    }
  });

  // ============================================================================
  // PHASE 13: STAKEHOLDER ALIGNMENT AND APPROVAL (IF ENABLED)
  // ============================================================================

  let stakeholderAlignment = null;
  let finalStrategy = strategyAssembly;

  if (requireAlignment) {
    ctx.log('info', 'Phase 13: Conducting stakeholder alignment and approval');

    stakeholderAlignment = await ctx.task(stakeholderAlignmentTask, {
      productName,
      strategyDocument: strategyAssembly.strategyDocument,
      strategyPath: strategyAssembly.strategyPath,
      visionStatement,
      stakeholders,
      qualityValidation,
      outputDir
    });

    artifacts.push(...stakeholderAlignment.artifacts);

    // Breakpoint: Alignment gate
    await ctx.breakpoint({
      question: `Stakeholder alignment complete. ${stakeholderAlignment.aligned ? 'Strategy approved!' : 'Alignment issues identified.'} Proceed?`,
      title: 'Strategy Alignment Gate',
      context: {
        runId: ctx.runId,
        productName,
        aligned: stakeholderAlignment.aligned,
        stakeholdersCount: stakeholderAlignment.reviewers.length,
        consensusLevel: stakeholderAlignment.consensusLevel,
        concerns: stakeholderAlignment.concerns,
        files: artifacts.map(a => ({
          path: a.path,
          format: a.format || 'markdown',
          label: a.label || undefined
        }))
      }
    });

    // If revisions needed, incorporate feedback
    if (stakeholderAlignment.revisionsNeeded) {
      ctx.log('info', 'Incorporating stakeholder feedback');

      const revision = await ctx.task(strategyRevisionTask, {
        productName,
        strategyDocument: strategyAssembly.strategyDocument,
        strategyPath: strategyAssembly.strategyPath,
        feedback: stakeholderAlignment.feedback,
        concerns: stakeholderAlignment.concerns,
        outputDir
      });

      finalStrategy = revision;
      artifacts.push(...revision.artifacts);
    }
  }

  // ============================================================================
  // PHASE 14: COMMUNICATION PLAN DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 14: Developing strategy communication and rollout plan');

  const communicationPlan = await ctx.task(communicationPlanTask, {
    productName,
    visionStatement,
    strategicPillars,
    roadmap,
    stakeholders,
    targetAudiences: ['executives', 'employees', 'investors', 'customers', 'partners'],
    outputDir
  });

  artifacts.push(...communicationPlan.artifacts);

  // ============================================================================
  // PHASE 15: STRATEGY PUBLISHING AND DISTRIBUTION
  // ============================================================================

  ctx.log('info', 'Phase 15: Publishing strategy and distributing to stakeholders');

  const publishing = await ctx.task(strategyPublishingTask, {
    productName,
    strategyDocument: finalStrategy.strategyDocument,
    strategyPath: finalStrategy.strategyPath,
    visionStatement,
    communicationPlan,
    stakeholders,
    outputDir
  });

  artifacts.push(...publishing.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    productName,
    visionStatement,
    strategicPillars: strategicPillars.map(p => ({
      title: p.title,
      description: p.description,
      objectives: p.objectives.length
    })),
    roadmap: {
      timeHorizon: roadmap.timeHorizon,
      phases: roadmap.phases.length,
      milestones: roadmap.milestones.length,
      themes: roadmap.themes
    },
    targetSegments: targetSegments.map(s => ({
      name: s.name,
      size: s.size,
      priority: s.priority
    })),
    competitiveMoats: competitiveMoats.map(m => ({
      type: m.type,
      strength: m.strength,
      timeToReplicate: m.timeToReplicate
    })),
    successCriteria: successCriteria.map(c => ({
      category: c.category,
      kpis: c.kpis.length,
      targets: c.targets
    })),
    qualityScore,
    aligned: stakeholderAlignment ? stakeholderAlignment.aligned : true,
    consensusLevel: stakeholderAlignment ? stakeholderAlignment.consensusLevel : 'high',
    strategyDocument: publishing.publishedPath,
    financialProjections: financialProjections ? {
      revenue: financialProjections.revenueProjections,
      investmentRequired: financialProjections.investmentRequired
    } : null,
    artifacts,
    duration,
    metadata: {
      processId: 'product-management/product-vision-strategy',
      timestamp: startTime,
      outputDir,
      timeHorizon,
      industry
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Market Landscape Analysis
export const marketLandscapeAnalysisTask = defineTask('market-landscape-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze market and competitive landscape',
  agent: {
    name: 'market-analyst',
    prompt: {
      role: 'senior market analyst and competitive intelligence expert',
      task: 'Conduct comprehensive market and competitive landscape analysis',
      context: args,
      instructions: [
        'Analyze total addressable market (TAM), serviceable addressable market (SAM), and serviceable obtainable market (SOM)',
        'Identify market size, growth rate, and key trends',
        'Map competitive landscape: direct competitors, indirect competitors, substitutes',
        'For each major competitor, analyze:',
        '  - Market position and share',
        '  - Product offerings and capabilities',
        '  - Strengths and weaknesses',
        '  - Strategic focus and recent moves',
        '  - Pricing and go-to-market strategy',
        'Identify white space opportunities',
        'Analyze market forces: technology trends, regulatory changes, economic factors, social shifts',
        'Assess market maturity and growth stage',
        'Document key market insights and implications',
        'Create competitive positioning map',
        'Save comprehensive market analysis to output directory'
      ],
      outputFormat: 'JSON with marketSize (object with TAM/SAM/SOM), growthRate (string), trends (array), competitors (array), whitespace (array), marketForces (object), maturity (string), insights (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['marketSize', 'growthRate', 'competitors', 'insights', 'artifacts'],
      properties: {
        marketSize: {
          type: 'object',
          properties: {
            TAM: { type: 'string' },
            SAM: { type: 'string' },
            SOM: { type: 'string' }
          }
        },
        growthRate: { type: 'string' },
        trends: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] },
              timeframe: { type: 'string' }
            }
          }
        },
        competitors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              marketShare: { type: 'string' },
              strengths: { type: 'array', items: { type: 'string' } },
              weaknesses: { type: 'array', items: { type: 'string' } },
              positioning: { type: 'string' }
            }
          }
        },
        whitespace: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              opportunity: { type: 'string' },
              description: { type: 'string' },
              potential: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        marketForces: {
          type: 'object',
          properties: {
            technology: { type: 'array', items: { type: 'string' } },
            regulatory: { type: 'array', items: { type: 'string' } },
            economic: { type: 'array', items: { type: 'string' } },
            social: { type: 'array', items: { type: 'string' } }
          }
        },
        maturity: { type: 'string', enum: ['emerging', 'growth', 'mature', 'declining'] },
        insights: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'product-strategy', 'market-analysis']
}));

// Task 2: Customer Segment Analysis
export const customerSegmentAnalysisTask = defineTask('customer-segment-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify and analyze target customer segments',
  agent: {
    name: 'customer-insights-analyst',
    prompt: {
      role: 'customer insights analyst and segmentation expert',
      task: 'Identify and deeply analyze target customer segments',
      context: args,
      instructions: [
        'Identify 3-5 primary customer segments based on:',
        '  - Demographics (company size, industry, location for B2B; age, income, location for B2C)',
        '  - Psychographics (values, attitudes, lifestyle)',
        '  - Behavioral patterns (usage, purchase behavior)',
        '  - Needs and pain points',
        'For each segment, document:',
        '  - Segment name and description',
        '  - Size and growth potential',
        '  - Key characteristics and attributes',
        '  - Primary needs and pain points',
        '  - Current solutions and alternatives used',
        '  - Buying behavior and decision criteria',
        '  - Willingness to pay',
        '  - Acquisition channels and touchpoints',
        'Prioritize segments using attractiveness criteria:',
        '  - Market size and growth',
        '  - Accessibility and reachability',
        '  - Strategic fit with capabilities',
        '  - Competitive intensity',
        '  - Profitability potential',
        'Define primary, secondary, and tertiary target segments',
        'Create detailed personas for top segments',
        'Save segment analysis to output directory'
      ],
      outputFormat: 'JSON with segments (array), primarySegment (object), secondarySegments (array), personas (array), segmentationCriteria (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['segments', 'primarySegment', 'personas', 'artifacts'],
      properties: {
        segments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              size: { type: 'string' },
              growth: { type: 'string' },
              priority: { type: 'string', enum: ['primary', 'secondary', 'tertiary'] },
              characteristics: { type: 'array', items: { type: 'string' } },
              painPoints: { type: 'array', items: { type: 'string' } },
              currentSolutions: { type: 'array', items: { type: 'string' } },
              willingnessToPayLevel: { type: 'string', enum: ['high', 'medium', 'low'] },
              acquisitionChannels: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        primarySegment: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            rationale: { type: 'string' }
          }
        },
        secondarySegments: {
          type: 'array',
          items: { type: 'string' }
        },
        personas: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              segment: { type: 'string' },
              description: { type: 'string' },
              goals: { type: 'array', items: { type: 'string' } },
              challenges: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        segmentationCriteria: {
          type: 'object',
          properties: {
            demographic: { type: 'array', items: { type: 'string' } },
            psychographic: { type: 'array', items: { type: 'string' } },
            behavioral: { type: 'array', items: { type: 'string' } }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'product-strategy', 'segmentation']
}));

// Task 3: Product Positioning
export const productPositioningTask = defineTask('product-positioning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define product positioning and differentiation',
  agent: {
    name: 'positioning-strategist',
    prompt: {
      role: 'product positioning strategist and brand expert',
      task: 'Define compelling product positioning and differentiation strategy',
      context: args,
      instructions: [
        'Craft positioning statement using formula: For [target segment] who [need/opportunity], [product name] is a [category] that [key benefit]. Unlike [alternatives], our product [differentiation].',
        'Define product category and frame of reference',
        'Identify key points of differentiation (unique value props)',
        'Articulate competitive advantages',
        'Define reasons to believe (proof points)',
        'Create positioning perceptual map',
        'Validate positioning against criteria:',
        '  - Relevant to target segments',
        '  - Differentiated from competitors',
        '  - Credible and defensible',
        '  - Sustainable over time',
        '  - Inspiring internally',
        'Document key messages for different audiences',
        'Save positioning strategy to output directory'
      ],
      outputFormat: 'JSON with positioningStatement (string), category (string), differentiation (array), competitiveAdvantages (array), proofsPoints (array), keyMessages (object), perceptualMap (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['positioningStatement', 'differentiation', 'competitiveAdvantages', 'artifacts'],
      properties: {
        positioningStatement: { type: 'string' },
        category: { type: 'string' },
        differentiation: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              point: { type: 'string' },
              description: { type: 'string' },
              importance: { type: 'string', enum: ['critical', 'high', 'medium'] }
            }
          }
        },
        competitiveAdvantages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              advantage: { type: 'string' },
              sustainability: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        proofPoints: { type: 'array', items: { type: 'string' } },
        keyMessages: {
          type: 'object',
          properties: {
            customers: { type: 'string' },
            investors: { type: 'string' },
            employees: { type: 'string' },
            partners: { type: 'string' }
          }
        },
        perceptualMap: {
          type: 'object',
          properties: {
            xAxis: { type: 'string' },
            yAxis: { type: 'string' },
            position: { type: 'string' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'product-strategy', 'positioning']
}));

// Task 4: Vision Statement Crafting
export const visionStatementCraftingTask = defineTask('vision-statement-crafting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Craft compelling product vision statement',
  agent: {
    name: 'vision-architect',
    prompt: {
      role: 'product vision architect and strategic storyteller',
      task: 'Craft an inspiring, clear, and actionable product vision statement',
      context: args,
      instructions: [
        'Review existing vision statement if provided',
        'Craft vision statement following best practices:',
        '  - Aspirational and inspiring (paints picture of desired future)',
        '  - Clear and concise (easily understood and remembered)',
        '  - Future-oriented (3-5+ years)',
        '  - Customer-centric (focused on customer value)',
        '  - Differentiated (unique to this product)',
        '  - Actionable (provides direction for decisions)',
        '  - Achievable yet ambitious (stretch goal)',
        'Create 3-5 alternative vision statements',
        'Evaluate each against criteria: inspiration, clarity, differentiation, actionability',
        'Select strongest vision statement',
        'Develop supporting narrative that explains:',
        '  - Current state and challenge',
        '  - Desired future state',
        '  - Why this vision matters',
        '  - How it serves customers',
        '  - Impact on market/world',
        'Create visual representation of vision',
        'Test vision against different stakeholder perspectives',
        'Save vision statement and supporting materials to output directory'
      ],
      outputFormat: 'JSON with visionStatement (string), alternatives (array), supportingNarrative (string), visualConcept (string), stakeholderResonance (object), evaluationScores (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['visionStatement', 'supportingNarrative', 'evaluationScores', 'artifacts'],
      properties: {
        visionStatement: { type: 'string' },
        alternatives: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              statement: { type: 'string' },
              score: { type: 'number' }
            }
          }
        },
        supportingNarrative: { type: 'string' },
        visualConcept: { type: 'string' },
        stakeholderResonance: {
          type: 'object',
          properties: {
            customers: { type: 'string' },
            employees: { type: 'string' },
            investors: { type: 'string' },
            partners: { type: 'string' }
          }
        },
        evaluationScores: {
          type: 'object',
          properties: {
            inspiration: { type: 'number', minimum: 0, maximum: 10 },
            clarity: { type: 'number', minimum: 0, maximum: 10 },
            differentiation: { type: 'number', minimum: 0, maximum: 10 },
            actionability: { type: 'number', minimum: 0, maximum: 10 }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'product-strategy', 'vision']
}));

// Task 5: Strategic Pillars Definition
export const strategicPillarsDefinitionTask = defineTask('strategic-pillars-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define strategic pillars',
  agent: {
    name: 'strategy-architect',
    prompt: {
      role: 'chief strategy officer and strategic planning expert',
      task: 'Define 3-5 strategic pillars that support the product vision',
      context: args,
      instructions: [
        'Define 3-5 strategic pillars (core strategic themes)',
        'Each pillar should:',
        '  - Support achievement of the vision',
        '  - Address a critical success factor',
        '  - Be mutually exclusive and collectively exhaustive (MECE)',
        '  - Span the time horizon',
        'For each pillar, document:',
        '  - Pillar title (clear and memorable)',
        '  - Description (what it means)',
        '  - Strategic rationale (why it matters)',
        '  - Key objectives (3-5 per pillar)',
        '  - Success indicators',
        '  - Key initiatives and focus areas',
        '  - Dependencies and relationships to other pillars',
        'Common pillar themes: Product Excellence, Market Leadership, Customer Success, Operational Excellence, Innovation, Ecosystem/Platform',
        'Ensure pillars are balanced across:',
        '  - Product capabilities',
        '  - Market and customer focus',
        '  - Operational and organizational capabilities',
        'Validate pillars address competitive moats and market opportunities',
        'Save strategic pillars framework to output directory'
      ],
      outputFormat: 'JSON with pillars (array), framework (object), relationships (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['pillars', 'framework', 'artifacts'],
      properties: {
        pillars: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              rationale: { type: 'string' },
              objectives: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    objective: { type: 'string' },
                    timeframe: { type: 'string' },
                    priority: { type: 'string', enum: ['critical', 'high', 'medium'] }
                  }
                }
              },
              successIndicators: { type: 'array', items: { type: 'string' } },
              keyInitiatives: { type: 'array', items: { type: 'string' } },
              dependencies: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        framework: {
          type: 'object',
          properties: {
            overview: { type: 'string' },
            integration: { type: 'string' },
            prioritization: { type: 'string' }
          }
        },
        relationships: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              pillar1: { type: 'string' },
              pillar2: { type: 'string' },
              relationship: { type: 'string' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'product-strategy', 'pillars']
}));

// Task 6: Competitive Moats Analysis
export const competitiveMoatsAnalysisTask = defineTask('competitive-moats-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify and define competitive moats',
  agent: {
    name: 'competitive-strategist',
    prompt: {
      role: 'competitive strategy expert and business model analyst',
      task: 'Identify and analyze competitive moats (sustainable competitive advantages)',
      context: args,
      instructions: [
        'Identify competitive moats using classic frameworks:',
        '  - Network effects (value increases with users)',
        '  - Economies of scale (cost advantage from size)',
        '  - Brand/reputation (customer loyalty and recognition)',
        '  - Technology/IP (patents, proprietary tech)',
        '  - Switching costs (hard for customers to leave)',
        '  - Regulatory barriers (licenses, compliance)',
        '  - Data moat (unique data assets)',
        '  - Distribution/channel control',
        'For each moat, analyze:',
        '  - Type and description',
        '  - Current strength (nascent, emerging, established, dominant)',
        '  - Sustainability (how long it can be maintained)',
        '  - Defensibility (how hard to replicate)',
        '  - Time for competitor to replicate',
        '  - Investment required to build/maintain',
        '  - Key activities to strengthen',
        '  - Risks and vulnerabilities',
        'Prioritize moats by strategic importance',
        'Map moats to strategic pillars',
        'Create moat development roadmap',
        'Save competitive moats analysis to output directory'
      ],
      outputFormat: 'JSON with moats (array), prioritization (array), roadmap (object), vulnerabilities (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['moats', 'prioritization', 'artifacts'],
      properties: {
        moats: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              strength: { type: 'string', enum: ['nascent', 'emerging', 'established', 'dominant'] },
              sustainability: { type: 'string', enum: ['high', 'medium', 'low'] },
              defensibility: { type: 'string', enum: ['high', 'medium', 'low'] },
              timeToReplicate: { type: 'string' },
              investmentRequired: { type: 'string' },
              strengtheningActivities: { type: 'array', items: { type: 'string' } },
              risks: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        prioritization: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              moat: { type: 'string' },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              rationale: { type: 'string' }
            }
          }
        },
        roadmap: {
          type: 'object',
          properties: {
            year1: { type: 'array', items: { type: 'string' } },
            year2: { type: 'array', items: { type: 'string' } },
            year3: { type: 'array', items: { type: 'string' } }
          }
        },
        vulnerabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              vulnerability: { type: 'string' },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] },
              mitigation: { type: 'string' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'product-strategy', 'competitive-moats']
}));

// Task 7: Three-Year Roadmap Planning
export const threeYearRoadmapPlanningTask = defineTask('three-year-roadmap-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan three-year strategic roadmap',
  agent: {
    name: 'roadmap-strategist',
    prompt: {
      role: 'product roadmap strategist and portfolio planner',
      task: 'Create comprehensive three-year strategic product roadmap',
      context: args,
      instructions: [
        'Structure roadmap by time phases: Year 1, Year 2, Year 3 (or by quarters/half-years)',
        'For each phase, define:',
        '  - Strategic themes and focus areas',
        '  - Major capabilities and features',
        '  - Market expansion and segment targeting',
        '  - Platform and infrastructure investments',
        '  - Partnership and ecosystem development',
        '  - Expected business outcomes',
        'Map roadmap items to strategic pillars',
        'Identify key milestones and decision points',
        'Define dependencies between roadmap items',
        'Consider sequencing and prioritization:',
        '  - Foundation building (Year 1)',
        '  - Market expansion (Year 2)',
        '  - Market leadership (Year 3)',
        'Build optionality and flexibility into roadmap',
        'Identify assumptions and decision triggers',
        'Create visual roadmap representation',
        'Document "now, next, later" framework',
        'Include innovation horizons (Horizon 1: core business, Horizon 2: emerging opportunities, Horizon 3: future bets)',
        'Save roadmap to output directory'
      ],
      outputFormat: 'JSON with roadmap (object with phases array), milestones (array), themes (array), dependencies (array), assumptions (array), horizons (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['roadmap', 'milestones', 'themes', 'artifacts'],
      properties: {
        roadmap: {
          type: 'object',
          properties: {
            timeHorizon: { type: 'string' },
            phases: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  timeframe: { type: 'string' },
                  strategicThemes: { type: 'array', items: { type: 'string' } },
                  capabilities: { type: 'array', items: { type: 'string' } },
                  segments: { type: 'array', items: { type: 'string' } },
                  investments: { type: 'array', items: { type: 'string' } },
                  expectedOutcomes: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        milestones: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              timeframe: { type: 'string' },
              description: { type: 'string' },
              successCriteria: { type: 'array', items: { type: 'string' } },
              pillar: { type: 'string' }
            }
          }
        },
        themes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              theme: { type: 'string' },
              description: { type: 'string' },
              timeframe: { type: 'string' }
            }
          }
        },
        dependencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              item: { type: 'string' },
              dependsOn: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        assumptions: { type: 'array', items: { type: 'string' } },
        horizons: {
          type: 'object',
          properties: {
            horizon1: { type: 'array', items: { type: 'string' } },
            horizon2: { type: 'array', items: { type: 'string' } },
            horizon3: { type: 'array', items: { type: 'string' } }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'product-strategy', 'roadmap']
}));

// Task 8: Success Criteria Definition
export const successCriteriaDefinitionTask = defineTask('success-criteria-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define success criteria and KPI framework',
  agent: {
    name: 'metrics-strategist',
    prompt: {
      role: 'metrics and KPI strategist, data-driven decision expert',
      task: 'Define comprehensive success criteria and KPI framework for strategy',
      context: args,
      instructions: [
        'Define success criteria across key dimensions:',
        '  - Customer success (adoption, satisfaction, retention, NPS)',
        '  - Business success (revenue, market share, profitability)',
        '  - Product success (usage, engagement, feature adoption)',
        '  - Competitive position (win rate, brand awareness)',
        '  - Innovation (new capabilities, time to market)',
        'For each success criterion, define:',
        '  - Category and dimension',
        '  - Specific KPIs (2-3 per criterion)',
        '  - Baseline (current state)',
        '  - Target by year (Year 1, Year 2, Year 3)',
        '  - Measurement method',
        '  - Frequency of measurement',
        '  - Owner/accountable party',
        'Use SMART criteria for KPIs (Specific, Measurable, Achievable, Relevant, Time-bound)',
        'Include leading and lagging indicators',
        'Create balanced scorecard view',
        'Define relationship between KPIs and strategic pillars',
        'Identify critical KPIs that signal strategy success',
        'Document data sources and measurement methodology',
        'Save success criteria framework to output directory'
      ],
      outputFormat: 'JSON with criteria (array), kpiFramework (object), balancedScorecard (object), criticalKPIs (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['criteria', 'kpiFramework', 'criticalKPIs', 'artifacts'],
      properties: {
        criteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              criterion: { type: 'string' },
              kpis: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    definition: { type: 'string' },
                    baseline: { type: 'string' },
                    year1Target: { type: 'string' },
                    year2Target: { type: 'string' },
                    year3Target: { type: 'string' },
                    measurementMethod: { type: 'string' },
                    frequency: { type: 'string' },
                    owner: { type: 'string' }
                  }
                }
              },
              targets: {
                type: 'object',
                properties: {
                  year1: { type: 'string' },
                  year2: { type: 'string' },
                  year3: { type: 'string' }
                }
              },
              pillar: { type: 'string' }
            }
          }
        },
        kpiFramework: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            dimensions: { type: 'array', items: { type: 'string' } },
            totalKPIs: { type: 'number' }
          }
        },
        balancedScorecard: {
          type: 'object',
          properties: {
            customer: { type: 'array', items: { type: 'string' } },
            financial: { type: 'array', items: { type: 'string' } },
            internal: { type: 'array', items: { type: 'string' } },
            learning: { type: 'array', items: { type: 'string' } }
          }
        },
        criticalKPIs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              kpi: { type: 'string' },
              rationale: { type: 'string' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'product-strategy', 'kpis']
}));

// Task 9: Financial Projections
export const financialProjectionsTask = defineTask('financial-projections', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create financial projections and resource plans',
  agent: {
    name: 'financial-analyst',
    prompt: {
      role: 'financial analyst and resource planning expert',
      task: 'Create financial projections and resource requirements for strategy',
      context: args,
      instructions: [
        'Project revenue by time period (quarterly/yearly):',
        '  - By segment',
        '  - By product line',
        '  - By revenue stream (subscriptions, usage, services, etc.)',
        'Project customer metrics:',
        '  - Customer acquisition (by segment)',
        '  - Retention and churn',
        '  - Customer lifetime value (CLV)',
        '  - Customer acquisition cost (CAC)',
        '  - CAC payback period',
        'Estimate investment required:',
        '  - Product development',
        '  - Sales and marketing',
        '  - Customer success',
        '  - Infrastructure',
        '  - Partnerships',
        'Project unit economics and profitability timeline',
        'Calculate key financial metrics:',
        '  - Gross margin',
        '  - Contribution margin',
        '  - Rule of 40 (growth + profitability)',
        'Scenario analysis: base case, optimistic, pessimistic',
        'Identify key financial assumptions and sensitivities',
        'Document resource requirements by function and period',
        'Save financial projections to output directory'
      ],
      outputFormat: 'JSON with revenueProjections (object), customerMetrics (object), investmentRequired (object), unitEconomics (object), scenarios (object), assumptions (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['revenueProjections', 'customerMetrics', 'investmentRequired', 'artifacts'],
      properties: {
        revenueProjections: {
          type: 'object',
          properties: {
            year1: { type: 'string' },
            year2: { type: 'string' },
            year3: { type: 'string' },
            bySegment: { type: 'object' },
            growthRate: { type: 'string' }
          }
        },
        customerMetrics: {
          type: 'object',
          properties: {
            acquisitionRate: { type: 'string' },
            retentionRate: { type: 'string' },
            churnRate: { type: 'string' },
            clv: { type: 'string' },
            cac: { type: 'string' },
            cacPayback: { type: 'string' }
          }
        },
        investmentRequired: {
          type: 'object',
          properties: {
            total: { type: 'string' },
            byYear: {
              type: 'object',
              properties: {
                year1: { type: 'string' },
                year2: { type: 'string' },
                year3: { type: 'string' }
              }
            },
            byFunction: { type: 'object' }
          }
        },
        unitEconomics: {
          type: 'object',
          properties: {
            grossMargin: { type: 'string' },
            contributionMargin: { type: 'string' },
            profitabilityTimeline: { type: 'string' }
          }
        },
        scenarios: {
          type: 'object',
          properties: {
            baseCase: { type: 'object' },
            optimistic: { type: 'object' },
            pessimistic: { type: 'object' }
          }
        },
        assumptions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              assumption: { type: 'string' },
              impact: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'product-strategy', 'financials']
}));

// Task 10: Strategic Risk Assessment
export const strategicRiskAssessmentTask = defineTask('strategic-risk-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess strategic risks and mitigation strategies',
  agent: {
    name: 'risk-analyst',
    prompt: {
      role: 'strategic risk analyst and contingency planner',
      task: 'Assess strategic risks and develop mitigation strategies',
      context: args,
      instructions: [
        'Identify strategic risks across categories:',
        '  - Market risks (demand, competition, disruption)',
        '  - Execution risks (delivery, quality, resources)',
        '  - Technology risks (feasibility, obsolescence, dependencies)',
        '  - Financial risks (funding, unit economics, market conditions)',
        '  - Organizational risks (capabilities, culture, leadership)',
        '  - External risks (regulatory, economic, geopolitical)',
        'For each risk, document:',
        '  - Risk description',
        '  - Probability (low, medium, high)',
        '  - Impact (low, medium, high, critical)',
        '  - Risk score (probability × impact)',
        '  - Time horizon (when risk could materialize)',
        '  - Early warning indicators',
        '  - Mitigation strategies',
        '  - Contingency plans',
        '  - Owner',
        'Create risk matrix (probability vs. impact)',
        'Prioritize top 5-10 risks',
        'Define risk monitoring cadence',
        'Document decision triggers and contingency thresholds',
        'Save risk assessment to output directory'
      ],
      outputFormat: 'JSON with risks (array), riskMatrix (object), topRisks (array), monitoringPlan (object), contingencies (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['risks', 'topRisks', 'artifacts'],
      properties: {
        risks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              description: { type: 'string' },
              probability: { type: 'string', enum: ['low', 'medium', 'high'] },
              impact: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
              riskScore: { type: 'number' },
              timeHorizon: { type: 'string' },
              earlyWarnings: { type: 'array', items: { type: 'string' } },
              mitigationStrategies: { type: 'array', items: { type: 'string' } },
              contingencyPlan: { type: 'string' },
              owner: { type: 'string' }
            }
          }
        },
        riskMatrix: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            quadrants: { type: 'object' }
          }
        },
        topRisks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rank: { type: 'number' },
              risk: { type: 'string' },
              priorityActions: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        monitoringPlan: {
          type: 'object',
          properties: {
            cadence: { type: 'string' },
            reviewProcess: { type: 'string' },
            escalationCriteria: { type: 'array', items: { type: 'string' } }
          }
        },
        contingencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              trigger: { type: 'string' },
              response: { type: 'string' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'product-strategy', 'risk-assessment']
}));

// Task 11: Strategy Document Assembly
export const strategyDocumentAssemblyTask = defineTask('strategy-document-assembly', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assemble comprehensive strategy document',
  agent: {
    name: 'strategy-documenter',
    prompt: {
      role: 'strategic planning expert and business writer',
      task: 'Assemble comprehensive product vision and strategy document',
      context: args,
      instructions: [
        'Create comprehensive strategy document with sections:',
        '1. Executive Summary',
        '   - Vision statement',
        '   - Strategic pillars overview',
        '   - Key objectives and outcomes',
        '2. Market Context',
        '   - Market analysis and trends',
        '   - Competitive landscape',
        '   - Market opportunities',
        '3. Target Segments',
        '   - Segment descriptions and priorities',
        '   - Personas',
        '   - Positioning statement',
        '4. Product Vision',
        '   - Vision statement and narrative',
        '   - How we serve customers',
        '   - Impact and outcomes',
        '5. Strategic Pillars',
        '   - Detailed pillar descriptions',
        '   - Objectives and initiatives per pillar',
        '6. Competitive Moats',
        '   - Moat descriptions and development plans',
        '   - Sustainable advantages',
        '7. Three-Year Roadmap',
        '   - Phased roadmap with milestones',
        '   - Key capabilities and investments',
        '   - Innovation horizons',
        '8. Success Criteria',
        '   - KPI framework',
        '   - Targets by year',
        '   - Critical success factors',
        '9. Financial Projections (if included)',
        '   - Revenue projections',
        '   - Investment requirements',
        '   - Unit economics',
        '10. Strategic Risks',
        '    - Top risks and mitigations',
        '    - Contingency plans',
        '11. Appendices',
        '    - Detailed analyses',
        '    - Assumptions',
        '    - Glossary',
        'Use clear, compelling language',
        'Include visual diagrams and charts',
        'Target length: 15-25 pages',
        'Save strategy document to output directory'
      ],
      outputFormat: 'JSON with strategyDocument (string - full markdown), strategyPath (string), executiveSummary (string), pageCount (number), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategyDocument', 'strategyPath', 'executiveSummary', 'artifacts'],
      properties: {
        strategyDocument: { type: 'string' },
        strategyPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        pageCount: { type: 'number' },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              wordCount: { type: 'number' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'product-strategy', 'documentation']
}));

// Task 12: Strategy Quality Validation
export const strategyQualityValidationTask = defineTask('strategy-quality-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate strategy quality and completeness',
  agent: {
    name: 'strategy-validator',
    prompt: {
      role: 'chief strategy officer and strategic planning auditor',
      task: 'Validate strategy quality, completeness, and strategic soundness',
      context: args,
      instructions: [
        'Evaluate strategy document across dimensions:',
        '1. Vision Quality (20%):',
        '   - Inspiring and aspirational',
        '   - Clear and memorable',
        '   - Customer-centric',
        '   - Differentiated',
        '2. Strategic Clarity (20%):',
        '   - Pillars are clear and actionable',
        '   - Objectives are specific and measurable',
        '   - Prioritization is evident',
        '3. Market Alignment (15%):',
        '   - Based on solid market analysis',
        '   - Addresses real customer needs',
        '   - Considers competitive dynamics',
        '4. Roadmap Quality (15%):',
        '   - Logical sequencing',
        '   - Realistic and achievable',
        '   - Aligned with pillars',
        '   - Includes milestones',
        '5. Competitive Positioning (15%):',
        '   - Defensible moats identified',
        '   - Differentiation is clear',
        '   - Sustainable advantages',
        '6. Success Metrics (10%):',
        '   - KPIs are SMART',
        '   - Targets are ambitious yet achievable',
        '   - Balanced across dimensions',
        '7. Risk Management (5%):',
        '   - Key risks identified',
        '   - Mitigation strategies defined',
        'Calculate weighted overall score (0-100)',
        'Identify strengths and gaps',
        'Provide improvement recommendations',
        'Assess readiness for stakeholder review'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), componentScores (object), strengths (array), gaps (array), recommendations (array), reviewReadiness (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'strengths', 'gaps', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            visionQuality: { type: 'number' },
            strategicClarity: { type: 'number' },
            marketAlignment: { type: 'number' },
            roadmapQuality: { type: 'number' },
            competitivePositioning: { type: 'number' },
            successMetrics: { type: 'number' },
            riskManagement: { type: 'number' }
          }
        },
        strengths: { type: 'array', items: { type: 'string' } },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        reviewReadiness: { type: 'string', enum: ['ready', 'minor-improvements', 'major-revisions'] },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'product-strategy', 'validation']
}));

// Task 13: Stakeholder Alignment
export const stakeholderAlignmentTask = defineTask('stakeholder-alignment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Conduct stakeholder alignment and approval',
  agent: {
    name: 'stakeholder-facilitator',
    prompt: {
      role: 'executive facilitator and stakeholder alignment expert',
      task: 'Facilitate stakeholder review and achieve alignment on strategy',
      context: args,
      instructions: [
        'Simulate stakeholder review sessions',
        'For each stakeholder group (executives, board, leadership team):',
        '  - Present key strategy elements',
        '  - Gather feedback and concerns',
        '  - Assess alignment level',
        'Document stakeholder perspectives:',
        '  - Areas of strong agreement',
        '  - Areas of concern or disagreement',
        '  - Questions and clarifications needed',
        'Assess overall consensus level:',
        '  - High: 80%+ aligned, minor concerns',
        '  - Medium: 60-80% aligned, some concerns',
        '  - Low: <60% aligned, major concerns',
        'Identify required revisions:',
        '  - Critical changes (blockers to approval)',
        '  - Important improvements',
        '  - Nice-to-have enhancements',
        'Determine if strategy is approved or needs revision',
        'Document approval conditions',
        'Save stakeholder alignment report to output directory'
      ],
      outputFormat: 'JSON with aligned (boolean), consensusLevel (string), reviewers (array), feedback (array), concerns (array), revisionsNeeded (boolean), approvalConditions (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['aligned', 'consensusLevel', 'reviewers', 'feedback', 'artifacts'],
      properties: {
        aligned: { type: 'boolean' },
        consensusLevel: { type: 'string', enum: ['high', 'medium', 'low'] },
        reviewers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              role: { type: 'string' },
              alignmentLevel: { type: 'string', enum: ['strong', 'moderate', 'weak'] }
            }
          }
        },
        feedback: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              stakeholder: { type: 'string' },
              comment: { type: 'string' },
              type: { type: 'string', enum: ['concern', 'question', 'suggestion', 'endorsement'] },
              priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] }
            }
          }
        },
        concerns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              concern: { type: 'string' },
              severity: { type: 'string', enum: ['blocker', 'major', 'minor'] },
              suggestedResolution: { type: 'string' }
            }
          }
        },
        revisionsNeeded: { type: 'boolean' },
        approvalConditions: { type: 'array', items: { type: 'string' } },
        agreements: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'product-strategy', 'stakeholder-alignment']
}));

// Task 14: Strategy Revision
export const strategyRevisionTask = defineTask('strategy-revision', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Incorporate stakeholder feedback and revise strategy',
  agent: {
    name: 'strategy-writer',
    prompt: {
      role: 'strategic planning expert and business writer',
      task: 'Revise strategy document based on stakeholder feedback',
      context: args,
      instructions: [
        'Review all stakeholder feedback and concerns',
        'Prioritize critical and high-priority feedback',
        'Address blocker and major concerns',
        'Revise affected sections of strategy:',
        '  - Vision statement (if needed)',
        '  - Strategic pillars',
        '  - Roadmap',
        '  - Success criteria',
        '  - Risk assessment',
        'Incorporate suggestions and clarifications',
        'Maintain document consistency and flow',
        'Document changes made and rationale',
        'Highlight revisions for easy review',
        'Save revised strategy to output directory'
      ],
      outputFormat: 'JSON with strategyDocument (string - revised markdown), strategyPath (string), changesApplied (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['strategyDocument', 'strategyPath', 'changesApplied', 'artifacts'],
      properties: {
        strategyDocument: { type: 'string' },
        strategyPath: { type: 'string' },
        changesApplied: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              section: { type: 'string' },
              change: { type: 'string' },
              reason: { type: 'string' },
              feedbackAddressed: { type: 'string' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'product-strategy', 'revision']
}));

// Task 15: Communication Plan
export const communicationPlanTask = defineTask('communication-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop strategy communication and rollout plan',
  agent: {
    name: 'communications-strategist',
    prompt: {
      role: 'corporate communications strategist and change management expert',
      task: 'Develop comprehensive communication plan for strategy rollout',
      context: args,
      instructions: [
        'Define target audiences: executives, employees, investors, customers, partners',
        'For each audience, tailor message:',
        '  - Key messages and talking points',
        '  - Level of detail appropriate',
        '  - Emphasis areas (what they care about)',
        '  - Call to action',
        'Design communication cascade:',
        '  - Leadership announcement',
        '  - Company-wide rollout',
        '  - Team-level sessions',
        '  - Individual alignment',
        'Select communication channels:',
        '  - Town halls / all-hands',
        '  - Email campaigns',
        '  - Internal wiki / knowledge base',
        '  - Team meetings',
        '  - 1-on-1 discussions',
        '  - External channels (if applicable)',
        'Create communication timeline and milestones',
        'Develop supporting materials:',
        '  - Executive presentation deck',
        '  - Employee FAQ',
        '  - Manager toolkit',
        '  - Visual one-pagers',
        'Plan feedback mechanisms and listening sessions',
        'Define success metrics for communication',
        'Save communication plan to output directory'
      ],
      outputFormat: 'JSON with audienceMessages (object), cascade (array), channels (array), timeline (array), materials (array), feedbackMechanisms (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['audienceMessages', 'cascade', 'timeline', 'materials', 'artifacts'],
      properties: {
        audienceMessages: {
          type: 'object',
          properties: {
            executives: { type: 'object' },
            employees: { type: 'object' },
            investors: { type: 'object' },
            customers: { type: 'object' },
            partners: { type: 'object' }
          }
        },
        cascade: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              phase: { type: 'string' },
              audience: { type: 'string' },
              method: { type: 'string' },
              timing: { type: 'string' }
            }
          }
        },
        channels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              channel: { type: 'string' },
              purpose: { type: 'string' },
              frequency: { type: 'string' }
            }
          }
        },
        timeline: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              milestone: { type: 'string' },
              date: { type: 'string' },
              owner: { type: 'string' }
            }
          }
        },
        materials: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              material: { type: 'string' },
              description: { type: 'string' },
              audience: { type: 'string' }
            }
          }
        },
        feedbackMechanisms: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              mechanism: { type: 'string' },
              purpose: { type: 'string' }
            }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'product-strategy', 'communications']
}));

// Task 16: Strategy Publishing
export const strategyPublishingTask = defineTask('strategy-publishing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Publish strategy and distribute to stakeholders',
  agent: {
    name: 'strategy-publisher',
    prompt: {
      role: 'strategy operations manager and distribution coordinator',
      task: 'Publish strategy document and distribute to stakeholders',
      context: args,
      instructions: [
        'Finalize strategy document formatting',
        'Create version control and document metadata',
        'Publish to designated repository (e.g., company wiki, shared drive)',
        'Generate distribution list based on stakeholders and communication plan',
        'Create announcement communications',
        'Simulate distribution to stakeholders',
        'Set up access controls and permissions',
        'Schedule follow-up sessions and reviews',
        'Establish governance and review cadence:',
        '  - Quarterly strategy reviews',
        '  - Annual strategy refresh',
        '  - Regular KPI reporting',
        'Document publication details and access information',
        'Save publishing report to output directory'
      ],
      outputFormat: 'JSON with publishedPath (string), version (string), publishDate (string), distributionList (array), accessUrl (string), governancePlan (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['publishedPath', 'version', 'publishDate', 'distributionList', 'artifacts'],
      properties: {
        publishedPath: { type: 'string' },
        version: { type: 'string' },
        publishDate: { type: 'string' },
        distributionList: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              role: { type: 'string' },
              accessLevel: { type: 'string', enum: ['full', 'summary', 'view-only'] }
            }
          }
        },
        accessUrl: { type: 'string' },
        governancePlan: {
          type: 'object',
          properties: {
            reviewCadence: { type: 'string' },
            owner: { type: 'string' },
            nextReviewDate: { type: 'string' }
          }
        },
        notificationsSent: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'product-strategy', 'publishing']
}));
