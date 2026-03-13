/**
 * @process marketing/brand-positioning-development
 * @description Define brand's unique market position using target audience, frame of reference, points of differentiation, and reasons to believe. Create positioning statement and validate with target customers.
 * @inputs { brandName: string, industry: string, targetMarket: object, competitors: array, currentPerception: object, businessGoals: object }
 * @outputs { success: boolean, positioningStatement: string, positioningFramework: object, validationPlan: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    brandName = 'Brand',
    industry = '',
    targetMarket = {},
    competitors = [],
    currentPerception = {},
    businessGoals = {},
    outputDir = 'brand-positioning-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Brand Positioning Development for ${brandName}`);

  // ============================================================================
  // PHASE 1: MARKET LANDSCAPE ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing market landscape and competitive positioning');
  const marketAnalysis = await ctx.task(marketLandscapeAnalysisTask, {
    brandName,
    industry,
    competitors,
    targetMarket,
    outputDir
  });

  artifacts.push(...marketAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: TARGET AUDIENCE DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 2: Defining target audience segments and needs');
  const audienceDefinition = await ctx.task(targetAudienceDefinitionTask, {
    brandName,
    targetMarket,
    marketAnalysis,
    businessGoals,
    outputDir
  });

  artifacts.push(...audienceDefinition.artifacts);

  // ============================================================================
  // PHASE 3: FRAME OF REFERENCE ESTABLISHMENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Establishing frame of reference and competitive set');
  const frameOfReference = await ctx.task(frameOfReferenceTask, {
    brandName,
    industry,
    competitors,
    marketAnalysis,
    audienceDefinition,
    outputDir
  });

  artifacts.push(...frameOfReference.artifacts);

  // ============================================================================
  // PHASE 4: POINTS OF DIFFERENTIATION IDENTIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Identifying points of differentiation');
  const differentiationAnalysis = await ctx.task(differentiationAnalysisTask, {
    brandName,
    currentPerception,
    competitors,
    marketAnalysis,
    frameOfReference,
    audienceDefinition,
    outputDir
  });

  artifacts.push(...differentiationAnalysis.artifacts);

  // ============================================================================
  // PHASE 5: REASONS TO BELIEVE DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 5: Developing reasons to believe');
  const reasonsToBelieve = await ctx.task(reasonsToBelieveTask, {
    brandName,
    differentiationAnalysis,
    currentPerception,
    businessGoals,
    outputDir
  });

  artifacts.push(...reasonsToBelieve.artifacts);

  // ============================================================================
  // PHASE 6: POSITIONING STATEMENT CREATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Creating positioning statement');
  const positioningStatement = await ctx.task(positioningStatementTask, {
    brandName,
    audienceDefinition,
    frameOfReference,
    differentiationAnalysis,
    reasonsToBelieve,
    outputDir
  });

  artifacts.push(...positioningStatement.artifacts);

  // ============================================================================
  // PHASE 7: VALIDATION PLAN DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 7: Developing customer validation plan');
  const validationPlan = await ctx.task(validationPlanTask, {
    brandName,
    positioningStatement,
    audienceDefinition,
    targetMarket,
    outputDir
  });

  artifacts.push(...validationPlan.artifacts);

  // ============================================================================
  // PHASE 8: POSITIONING QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 8: Assessing positioning quality and completeness');
  const qualityAssessment = await ctx.task(positioningQualityAssessmentTask, {
    brandName,
    marketAnalysis,
    audienceDefinition,
    frameOfReference,
    differentiationAnalysis,
    reasonsToBelieve,
    positioningStatement,
    validationPlan,
    outputDir
  });

  artifacts.push(...qualityAssessment.artifacts);

  const positioningScore = qualityAssessment.overallScore;
  const qualityMet = positioningScore >= 80;

  // Breakpoint: Review brand positioning
  await ctx.breakpoint({
    question: `Brand positioning complete. Quality score: ${positioningScore}/100. ${qualityMet ? 'Positioning meets quality standards!' : 'Positioning may need refinement.'} Review and approve?`,
    title: 'Brand Positioning Review & Approval',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        positioningScore,
        qualityMet,
        brandName,
        totalArtifacts: artifacts.length,
        primaryDifferentiator: differentiationAnalysis.primaryDifferentiator || 'N/A',
        targetSegments: audienceDefinition.segments?.length || 0,
        validationMethods: validationPlan.methods?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    brandName,
    positioningScore,
    qualityMet,
    positioningStatement: positioningStatement.statement,
    positioningFramework: {
      targetAudience: audienceDefinition.primaryAudience,
      frameOfReference: frameOfReference.categoryDefinition,
      pointsOfDifferentiation: differentiationAnalysis.keyDifferentiators,
      reasonsToBelieve: reasonsToBelieve.proofPoints
    },
    marketAnalysis: {
      marketSize: marketAnalysis.marketSize,
      competitorCount: marketAnalysis.competitorCount,
      marketTrends: marketAnalysis.keyTrends
    },
    audienceDefinition: {
      segments: audienceDefinition.segments,
      primaryAudience: audienceDefinition.primaryAudience,
      needs: audienceDefinition.keyNeeds
    },
    differentiationAnalysis: {
      primaryDifferentiator: differentiationAnalysis.primaryDifferentiator,
      supportingDifferentiators: differentiationAnalysis.supportingDifferentiators,
      competitiveAdvantage: differentiationAnalysis.competitiveAdvantage
    },
    validationPlan: {
      methods: validationPlan.methods,
      timeline: validationPlan.timeline,
      successCriteria: validationPlan.successCriteria
    },
    artifacts,
    duration,
    metadata: {
      processId: 'marketing/brand-positioning-development',
      timestamp: startTime,
      brandName,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Market Landscape Analysis
export const marketLandscapeAnalysisTask = defineTask('market-landscape-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze market landscape and competitive positioning',
  agent: {
    name: 'market-analyst',
    prompt: {
      role: 'senior brand strategist and market research analyst',
      task: 'Analyze the market landscape, competitive positioning, and identify strategic opportunities for brand differentiation',
      context: args,
      instructions: [
        'Research and document the total addressable market size and growth trends',
        'Map the competitive landscape including direct and indirect competitors',
        'Analyze competitor positioning strategies and messaging',
        'Identify market gaps and whitespace opportunities',
        'Document industry trends affecting brand positioning',
        'Analyze customer expectations and evolving preferences',
        'Identify barriers to entry and competitive moats',
        'Create competitive positioning map visualization',
        'Generate market landscape analysis report'
      ],
      outputFormat: 'JSON with marketSize, competitorCount, competitors (array with positioning details), keyTrends (array), marketGaps (array), positioningMap (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['marketSize', 'competitorCount', 'competitors', 'keyTrends', 'artifacts'],
      properties: {
        marketSize: { type: 'string' },
        competitorCount: { type: 'number' },
        competitors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              positioning: { type: 'string' },
              strengths: { type: 'array', items: { type: 'string' } },
              weaknesses: { type: 'array', items: { type: 'string' } },
              marketShare: { type: 'string' }
            }
          }
        },
        keyTrends: { type: 'array', items: { type: 'string' } },
        marketGaps: { type: 'array', items: { type: 'string' } },
        positioningMap: {
          type: 'object',
          properties: {
            xAxis: { type: 'string' },
            yAxis: { type: 'string' },
            positions: { type: 'array' }
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
  labels: ['agent', 'brand-positioning', 'market-analysis']
}));

// Task 2: Target Audience Definition
export const targetAudienceDefinitionTask = defineTask('target-audience-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define target audience segments and needs',
  agent: {
    name: 'audience-strategist',
    prompt: {
      role: 'consumer insights specialist and brand strategist',
      task: 'Define and prioritize target audience segments with detailed profiles, needs, and motivations',
      context: args,
      instructions: [
        'Segment the target market using demographic, psychographic, and behavioral criteria',
        'Prioritize segments based on size, accessibility, and strategic fit',
        'Create detailed profiles for primary and secondary audiences',
        'Identify key needs, pain points, and jobs-to-be-done for each segment',
        'Map customer motivations and decision-making factors',
        'Analyze media consumption and channel preferences',
        'Identify influencers and decision-makers in the purchase process',
        'Document customer language and terminology',
        'Generate audience definition document'
      ],
      outputFormat: 'JSON with segments (array), primaryAudience (object), secondaryAudiences (array), keyNeeds (array), motivations (object), channelPreferences (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['segments', 'primaryAudience', 'keyNeeds', 'artifacts'],
      properties: {
        segments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              size: { type: 'string' },
              demographics: { type: 'object' },
              psychographics: { type: 'object' },
              priority: { type: 'string', enum: ['primary', 'secondary', 'tertiary'] }
            }
          }
        },
        primaryAudience: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            demographics: { type: 'object' },
            psychographics: { type: 'object' },
            needs: { type: 'array', items: { type: 'string' } },
            painPoints: { type: 'array', items: { type: 'string' } }
          }
        },
        secondaryAudiences: { type: 'array' },
        keyNeeds: { type: 'array', items: { type: 'string' } },
        motivations: {
          type: 'object',
          properties: {
            functional: { type: 'array', items: { type: 'string' } },
            emotional: { type: 'array', items: { type: 'string' } },
            social: { type: 'array', items: { type: 'string' } }
          }
        },
        channelPreferences: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'brand-positioning', 'audience-definition']
}));

// Task 3: Frame of Reference Establishment
export const frameOfReferenceTask = defineTask('frame-of-reference', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish frame of reference and competitive set',
  agent: {
    name: 'positioning-strategist',
    prompt: {
      role: 'brand positioning expert',
      task: 'Establish the frame of reference that defines the category and competitive context for the brand',
      context: args,
      instructions: [
        'Define the category or market the brand competes in',
        'Identify the competitive set customers consider',
        'Analyze category conventions and expectations',
        'Determine if the brand should compete within or reframe the category',
        'Identify points of parity required for category membership',
        'Analyze category benefits and attributes customers expect',
        'Consider alternative frames of reference for differentiation',
        'Document category definition and rationale',
        'Generate frame of reference analysis document'
      ],
      outputFormat: 'JSON with categoryDefinition (string), competitiveSet (array), pointsOfParity (array), categoryConventions (array), alternativeFrames (array), rationale (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['categoryDefinition', 'competitiveSet', 'pointsOfParity', 'artifacts'],
      properties: {
        categoryDefinition: { type: 'string' },
        competitiveSet: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              competitor: { type: 'string' },
              relevance: { type: 'string' },
              overlap: { type: 'string' }
            }
          }
        },
        pointsOfParity: { type: 'array', items: { type: 'string' } },
        categoryConventions: { type: 'array', items: { type: 'string' } },
        categoryBenefits: { type: 'array', items: { type: 'string' } },
        alternativeFrames: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              frame: { type: 'string' },
              advantages: { type: 'array', items: { type: 'string' } },
              risks: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        rationale: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'brand-positioning', 'frame-of-reference']
}));

// Task 4: Differentiation Analysis
export const differentiationAnalysisTask = defineTask('differentiation-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify points of differentiation',
  agent: {
    name: 'differentiation-analyst',
    prompt: {
      role: 'competitive strategy and brand differentiation expert',
      task: 'Identify and prioritize unique points of differentiation that create competitive advantage',
      context: args,
      instructions: [
        'Analyze brand assets, capabilities, and unique attributes',
        'Identify functional differentiators (features, quality, performance)',
        'Identify emotional differentiators (values, personality, experience)',
        'Identify symbolic differentiators (status, self-expression, belonging)',
        'Evaluate differentiators against criteria: desirable, deliverable, differentiating',
        'Assess sustainability and defensibility of each differentiator',
        'Prioritize differentiators based on customer importance and competitive uniqueness',
        'Identify primary and supporting differentiators',
        'Document competitive advantage and moat',
        'Generate differentiation analysis report'
      ],
      outputFormat: 'JSON with primaryDifferentiator (object), supportingDifferentiators (array), keyDifferentiators (array), competitiveAdvantage (string), sustainabilityAssessment (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['primaryDifferentiator', 'keyDifferentiators', 'competitiveAdvantage', 'artifacts'],
      properties: {
        primaryDifferentiator: {
          type: 'object',
          properties: {
            differentiator: { type: 'string' },
            type: { type: 'string', enum: ['functional', 'emotional', 'symbolic'] },
            rationale: { type: 'string' },
            sustainability: { type: 'string' }
          }
        },
        supportingDifferentiators: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              differentiator: { type: 'string' },
              type: { type: 'string' },
              importance: { type: 'string' }
            }
          }
        },
        keyDifferentiators: { type: 'array', items: { type: 'string' } },
        competitiveAdvantage: { type: 'string' },
        sustainabilityAssessment: {
          type: 'object',
          properties: {
            shortTerm: { type: 'string' },
            longTerm: { type: 'string' },
            threats: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'brand-positioning', 'differentiation']
}));

// Task 5: Reasons to Believe Development
export const reasonsToBelieveTask = defineTask('reasons-to-believe', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop reasons to believe',
  agent: {
    name: 'brand-credibility-specialist',
    prompt: {
      role: 'brand strategy and marketing communications expert',
      task: 'Develop compelling reasons to believe that substantiate the brand positioning claims',
      context: args,
      instructions: [
        'Identify proof points that support each differentiator',
        'Document tangible evidence: features, specifications, certifications',
        'Document heritage and track record proof points',
        'Identify testimonials, endorsements, and social proof',
        'Document awards, recognition, and third-party validation',
        'Identify demonstration and experiential proof points',
        'Prioritize reasons to believe by persuasiveness and relevance',
        'Map proof points to target audience concerns',
        'Identify gaps in credibility that need addressing',
        'Generate reasons to believe documentation'
      ],
      outputFormat: 'JSON with proofPoints (array), tangibleEvidence (array), socialProof (array), thirdPartyValidation (array), credibilityGaps (array), recommendedActions (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['proofPoints', 'tangibleEvidence', 'artifacts'],
      properties: {
        proofPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              claim: { type: 'string' },
              evidence: { type: 'string' },
              type: { type: 'string' },
              strength: { type: 'string', enum: ['strong', 'moderate', 'weak'] }
            }
          }
        },
        tangibleEvidence: { type: 'array', items: { type: 'string' } },
        socialProof: { type: 'array', items: { type: 'string' } },
        thirdPartyValidation: { type: 'array', items: { type: 'string' } },
        heritageProof: { type: 'array', items: { type: 'string' } },
        credibilityGaps: { type: 'array', items: { type: 'string' } },
        recommendedActions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'brand-positioning', 'reasons-to-believe']
}));

// Task 6: Positioning Statement Creation
export const positioningStatementTask = defineTask('positioning-statement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create positioning statement',
  agent: {
    name: 'positioning-writer',
    prompt: {
      role: 'senior brand strategist and copywriter',
      task: 'Create a compelling positioning statement that synthesizes all positioning elements into a clear, memorable articulation',
      context: args,
      instructions: [
        'Review all positioning inputs: audience, frame of reference, differentiators, RTBs',
        'Draft positioning statement using standard format: For [target], [brand] is the [frame of reference] that [key benefit] because [reason to believe]',
        'Create alternative positioning statement formats for different uses',
        'Develop elevator pitch version (30 seconds)',
        'Create tagline options that capture positioning essence',
        'Ensure statement is clear, credible, and differentiated',
        'Test statement against positioning criteria: relevant, distinctive, credible, sustainable',
        'Document internal positioning statement vs external messaging',
        'Generate positioning statement document with rationale'
      ],
      outputFormat: 'JSON with statement (string), alternativeStatements (array), elevatorPitch (string), taglineOptions (array), positioningCriteria (object), internalStatement (string), externalMessaging (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['statement', 'elevatorPitch', 'taglineOptions', 'artifacts'],
      properties: {
        statement: { type: 'string' },
        alternativeStatements: { type: 'array', items: { type: 'string' } },
        elevatorPitch: { type: 'string' },
        taglineOptions: { type: 'array', items: { type: 'string' } },
        positioningCriteria: {
          type: 'object',
          properties: {
            relevance: { type: 'number', minimum: 1, maximum: 10 },
            distinctiveness: { type: 'number', minimum: 1, maximum: 10 },
            credibility: { type: 'number', minimum: 1, maximum: 10 },
            sustainability: { type: 'number', minimum: 1, maximum: 10 }
          }
        },
        internalStatement: { type: 'string' },
        externalMessaging: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'brand-positioning', 'positioning-statement']
}));

// Task 7: Validation Plan Development
export const validationPlanTask = defineTask('validation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop customer validation plan',
  agent: {
    name: 'research-planner',
    prompt: {
      role: 'market research director and brand strategist',
      task: 'Develop a comprehensive plan to validate brand positioning with target customers',
      context: args,
      instructions: [
        'Design qualitative research methods: focus groups, in-depth interviews',
        'Design quantitative research methods: surveys, concept testing',
        'Define sample sizes and recruitment criteria for each method',
        'Create discussion guides and survey instruments',
        'Define success criteria and metrics for validation',
        'Plan competitive positioning testing',
        'Identify key hypotheses to test',
        'Develop timeline and budget for validation research',
        'Plan internal stakeholder alignment sessions',
        'Generate validation research plan document'
      ],
      outputFormat: 'JSON with methods (array), timeline (object), budget (string), successCriteria (array), hypotheses (array), sampleSize (object), researchInstruments (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['methods', 'timeline', 'successCriteria', 'artifacts'],
      properties: {
        methods: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              method: { type: 'string' },
              purpose: { type: 'string' },
              sampleSize: { type: 'number' },
              duration: { type: 'string' }
            }
          }
        },
        timeline: {
          type: 'object',
          properties: {
            totalDuration: { type: 'string' },
            phases: { type: 'array' }
          }
        },
        budget: { type: 'string' },
        successCriteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              metric: { type: 'string' },
              target: { type: 'string' }
            }
          }
        },
        hypotheses: { type: 'array', items: { type: 'string' } },
        sampleSize: {
          type: 'object',
          properties: {
            qualitative: { type: 'number' },
            quantitative: { type: 'number' }
          }
        },
        researchInstruments: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'brand-positioning', 'validation-plan']
}));

// Task 8: Positioning Quality Assessment
export const positioningQualityAssessmentTask = defineTask('positioning-quality-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess positioning quality and completeness',
  agent: {
    name: 'positioning-validator',
    prompt: {
      role: 'chief brand officer and positioning expert',
      task: 'Assess overall brand positioning quality, completeness, and readiness for implementation',
      context: args,
      instructions: [
        'Evaluate market analysis completeness and accuracy (weight: 15%)',
        'Assess target audience definition clarity (weight: 15%)',
        'Review frame of reference appropriateness (weight: 15%)',
        'Evaluate differentiation strength and sustainability (weight: 20%)',
        'Assess reasons to believe credibility (weight: 15%)',
        'Review positioning statement clarity and memorability (weight: 15%)',
        'Evaluate validation plan comprehensiveness (weight: 5%)',
        'Calculate weighted overall score (0-100)',
        'Identify gaps and areas for improvement',
        'Provide specific recommendations',
        'Assess readiness for stakeholder presentation'
      ],
      outputFormat: 'JSON with overallScore (number 0-100), componentScores (object), gaps (array), recommendations (array), strengths (array), readinessLevel (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            marketAnalysis: { type: 'number' },
            audienceDefinition: { type: 'number' },
            frameOfReference: { type: 'number' },
            differentiation: { type: 'number' },
            reasonsToBelieve: { type: 'number' },
            positioningStatement: { type: 'number' },
            validationPlan: { type: 'number' }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        strengths: { type: 'array', items: { type: 'string' } },
        readinessLevel: { type: 'string', enum: ['ready', 'minor-revisions', 'major-revisions'] },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'brand-positioning', 'quality-assessment']
}));
