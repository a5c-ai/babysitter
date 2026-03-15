/**
 * @process sales/challenger-sale-teaching
 * @description Process for developing and delivering commercial insights that challenge customer thinking and reframe their perspective using the Challenger Sale methodology.
 * @inputs { accountName: string, industry: string, targetPersona: string, currentAssumptions?: array, competitiveLandscape?: object, businessContext?: string }
 * @outputs { success: boolean, teachingPitch: object, commercialInsights: array, reframingStrategy: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('sales/challenger-sale-teaching', {
 *   accountName: 'Global Manufacturing Corp',
 *   industry: 'Manufacturing',
 *   targetPersona: 'VP of Operations',
 *   currentAssumptions: ['Manual processes are necessary', 'Automation is too expensive'],
 *   competitiveLandscape: { mainCompetitor: 'Legacy Systems Inc' },
 *   businessContext: 'Digital transformation initiative'
 * });
 *
 * @references
 * - The Challenger Sale by Matthew Dixon: https://www.challengerinc.com/
 * - Challenger Customer: https://www.amazon.com/Challenger-Customer-Selling-Hidden-Influencer/dp/1591848156
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    accountName,
    industry,
    targetPersona,
    currentAssumptions = [],
    competitiveLandscape = {},
    businessContext = '',
    outputDir = 'challenger-teaching-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Challenger Sale Teaching Process for ${accountName}`);

  // ============================================================================
  // PHASE 1: COMMERCIAL INSIGHT RESEARCH
  // ============================================================================

  ctx.log('info', 'Phase 1: Researching Commercial Insights');
  const insightResearch = await ctx.task(commercialInsightResearchTask, {
    accountName,
    industry,
    targetPersona,
    businessContext,
    currentAssumptions,
    outputDir
  });

  artifacts.push(...(insightResearch.artifacts || []));

  // ============================================================================
  // PHASE 2: REFRAME DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Developing Reframe Strategy');
  const reframeStrategy = await ctx.task(reframeDevelopmentTask, {
    accountName,
    industry,
    targetPersona,
    currentAssumptions,
    insightResearch,
    outputDir
  });

  artifacts.push(...(reframeStrategy.artifacts || []));

  // ============================================================================
  // PHASE 3: RATIONAL DROWNING CONTENT
  // ============================================================================

  ctx.log('info', 'Phase 3: Creating Rational Drowning Content');
  const rationalDrowning = await ctx.task(rationalDrowningTask, {
    accountName,
    industry,
    reframeStrategy,
    competitiveLandscape,
    outputDir
  });

  artifacts.push(...(rationalDrowning.artifacts || []));

  // ============================================================================
  // PHASE 4: EMOTIONAL IMPACT DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Developing Emotional Impact');
  const emotionalImpact = await ctx.task(emotionalImpactTask, {
    accountName,
    targetPersona,
    reframeStrategy,
    rationalDrowning,
    outputDir
  });

  artifacts.push(...(emotionalImpact.artifacts || []));

  // ============================================================================
  // PHASE 5: VALUE PROPOSITION CONSTRUCTION
  // ============================================================================

  ctx.log('info', 'Phase 5: Constructing Value Proposition');
  const valueProposition = await ctx.task(valuePropositionTask, {
    accountName,
    industry,
    reframeStrategy,
    rationalDrowning,
    emotionalImpact,
    outputDir
  });

  artifacts.push(...(valueProposition.artifacts || []));

  // ============================================================================
  // PHASE 6: TEACHING PITCH ASSEMBLY
  // ============================================================================

  ctx.log('info', 'Phase 6: Assembling Teaching Pitch');
  const teachingPitch = await ctx.task(teachingPitchAssemblyTask, {
    accountName,
    targetPersona,
    insightResearch,
    reframeStrategy,
    rationalDrowning,
    emotionalImpact,
    valueProposition,
    outputDir
  });

  artifacts.push(...(teachingPitch.artifacts || []));

  // Breakpoint: Review teaching pitch
  await ctx.breakpoint({
    question: `Challenger teaching pitch prepared for ${accountName}. Review the commercial insight and reframe strategy?`,
    title: 'Challenger Teaching Pitch Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown',
        label: a.label || undefined
      })),
      summary: {
        accountName,
        targetPersona,
        insightCount: insightResearch.insights?.length || 0,
        reframeApproach: reframeStrategy.approach,
        pitchReadiness: teachingPitch.readinessScore
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    accountName,
    targetPersona,
    teachingPitch: {
      narrative: teachingPitch.narrative,
      keyMessages: teachingPitch.keyMessages,
      deliveryGuide: teachingPitch.deliveryGuide,
      readinessScore: teachingPitch.readinessScore
    },
    commercialInsights: insightResearch.insights,
    reframingStrategy: {
      currentState: reframeStrategy.currentState,
      desiredState: reframeStrategy.desiredState,
      reframeTechnique: reframeStrategy.technique,
      keyShift: reframeStrategy.keyShift
    },
    rationalDrowning: rationalDrowning.evidence,
    emotionalImpact: emotionalImpact.stories,
    valueProposition: valueProposition.proposition,
    artifacts,
    duration,
    metadata: {
      processId: 'sales/challenger-sale-teaching',
      timestamp: startTime,
      accountName,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const commercialInsightResearchTask = defineTask('commercial-insight-research', (args, taskCtx) => ({
  kind: 'agent',
  title: `Commercial Insight Research - ${args.accountName}`,
  agent: {
    name: 'sales-strategist',
    prompt: {
      role: 'Senior commercial strategist specializing in Challenger Sale methodology',
      task: 'Research and develop commercial insights that will challenge customer assumptions',
      context: args,
      instructions: [
        'Analyze industry trends that the prospect may not be aware of',
        'Identify hidden costs and risks in their current approach',
        'Research what top performers in their industry are doing differently',
        'Find data and benchmarks that contradict common assumptions',
        'Identify emerging threats or opportunities they may be missing',
        'Develop insights that connect to your unique solution capabilities',
        'Create teachable moments that reframe how they see their business',
        'Ensure insights are specific enough to be credible'
      ],
      outputFormat: 'JSON with insights array, industryTrends, benchmarkData, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['insights', 'artifacts'],
      properties: {
        insights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              insight: { type: 'string' },
              category: { type: 'string', enum: ['industry-trend', 'hidden-cost', 'best-practice', 'emerging-threat', 'opportunity'] },
              evidence: { type: 'string' },
              impactLevel: { type: 'string', enum: ['high', 'medium', 'low'] },
              solutionConnection: { type: 'string' }
            }
          }
        },
        industryTrends: { type: 'array', items: { type: 'string' } },
        benchmarkData: { type: 'object' },
        researchSources: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'challenger-sale', 'commercial-insight']
}));

export const reframeDevelopmentTask = defineTask('reframe-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Reframe Development - ${args.accountName}`,
  agent: {
    name: 'sales-strategist',
    prompt: {
      role: 'Challenger Sale expert specializing in customer reframing',
      task: 'Develop a reframe strategy to shift customer perspective',
      context: args,
      instructions: [
        'Map current customer assumptions and mental models',
        'Identify the core belief that needs to be challenged',
        'Develop a compelling alternative perspective',
        'Create the "A to B" journey from current to new thinking',
        'Ensure the reframe naturally leads to your solution',
        'Make the reframe defensible with data and logic',
        'Anticipate resistance and prepare responses',
        'Design the "aha moment" for maximum impact'
      ],
      outputFormat: 'JSON with currentState, desiredState, technique, keyShift, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['currentState', 'desiredState', 'technique', 'keyShift', 'artifacts'],
      properties: {
        currentState: {
          type: 'object',
          properties: {
            assumptions: { type: 'array', items: { type: 'string' } },
            beliefs: { type: 'array', items: { type: 'string' } },
            behaviors: { type: 'array', items: { type: 'string' } }
          }
        },
        desiredState: {
          type: 'object',
          properties: {
            newPerspective: { type: 'string' },
            desiredBeliefs: { type: 'array', items: { type: 'string' } },
            targetBehaviors: { type: 'array', items: { type: 'string' } }
          }
        },
        technique: { type: 'string' },
        keyShift: { type: 'string' },
        approach: { type: 'string' },
        resistanceHandling: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              objection: { type: 'string' },
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
  labels: ['agent', 'sales', 'challenger-sale', 'reframe']
}));

export const rationalDrowningTask = defineTask('rational-drowning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Rational Drowning Content - ${args.accountName}`,
  agent: {
    name: 'sales-strategist',
    prompt: {
      role: 'Sales content strategist specializing in evidence-based selling',
      task: 'Create rational drowning content with overwhelming evidence for the reframe',
      context: args,
      instructions: [
        'Compile compelling data points that support the reframe',
        'Create visualizations that make the data undeniable',
        'Include third-party research and analyst reports',
        'Add customer proof points and case studies',
        'Develop comparison frameworks (before/after, us/them)',
        'Create the "so what" connection for each data point',
        'Build a logical progression that leads to inevitable conclusion',
        'Ensure data is specific to their industry and situation'
      ],
      outputFormat: 'JSON with evidence array, visualizations, proofPoints, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['evidence', 'artifacts'],
      properties: {
        evidence: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              point: { type: 'string' },
              source: { type: 'string' },
              dataType: { type: 'string', enum: ['statistic', 'research', 'case-study', 'benchmark', 'analyst-report'] },
              impact: { type: 'string' },
              visualSuggestion: { type: 'string' }
            }
          }
        },
        visualizations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              title: { type: 'string' },
              dataPoints: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        proofPoints: { type: 'array', items: { type: 'string' } },
        logicalProgression: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'challenger-sale', 'rational-drowning']
}));

export const emotionalImpactTask = defineTask('emotional-impact', (args, taskCtx) => ({
  kind: 'agent',
  title: `Emotional Impact Development - ${args.accountName}`,
  agent: {
    name: 'sales-strategist',
    prompt: {
      role: 'Sales storytelling expert and emotional engagement specialist',
      task: 'Develop emotional impact elements to complement rational evidence',
      context: args,
      instructions: [
        'Create stories that personalize the impact of inaction',
        'Develop scenarios showing what could go wrong',
        'Include success stories of those who made the shift',
        'Use language that connects to personal stakes',
        'Identify the emotional hooks for this persona',
        'Create urgency without being manipulative',
        'Develop metaphors and analogies for complex concepts',
        'Build tension and release in the narrative'
      ],
      outputFormat: 'JSON with stories array, emotionalHooks, urgencyDrivers, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['stories', 'emotionalHooks', 'artifacts'],
      properties: {
        stories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              narrative: { type: 'string' },
              emotionalCore: { type: 'string' },
              useCase: { type: 'string', enum: ['opening', 'middle', 'closing', 'objection-handling'] }
            }
          }
        },
        emotionalHooks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              hook: { type: 'string' },
              trigger: { type: 'string' },
              personaRelevance: { type: 'string' }
            }
          }
        },
        urgencyDrivers: { type: 'array', items: { type: 'string' } },
        metaphors: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'challenger-sale', 'emotional-impact']
}));

export const valuePropositionTask = defineTask('value-proposition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Value Proposition Construction - ${args.accountName}`,
  agent: {
    name: 'sales-strategist',
    prompt: {
      role: 'Value proposition strategist and differentiation expert',
      task: 'Construct the unique value proposition that emerges from the reframe',
      context: args,
      instructions: [
        'Connect the reframe to your unique solution capabilities',
        'Articulate why only your solution addresses the new perspective',
        'Create differentiation from competitors',
        'Quantify the value of making the change',
        'Develop proof points for each value claim',
        'Create a compelling "new way" narrative',
        'Build the business case for taking action',
        'Ensure value proposition is specific and measurable'
      ],
      outputFormat: 'JSON with proposition object, differentiation, businessCase, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['proposition', 'differentiation', 'artifacts'],
      properties: {
        proposition: {
          type: 'object',
          properties: {
            statement: { type: 'string' },
            uniqueValue: { type: 'string' },
            targetOutcome: { type: 'string' },
            proofPoints: { type: 'array', items: { type: 'string' } }
          }
        },
        differentiation: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              capability: { type: 'string' },
              competitorGap: { type: 'string' },
              customerBenefit: { type: 'string' }
            }
          }
        },
        businessCase: {
          type: 'object',
          properties: {
            investment: { type: 'string' },
            returns: { type: 'string' },
            timeframe: { type: 'string' },
            riskMitigation: { type: 'string' }
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
  labels: ['agent', 'sales', 'challenger-sale', 'value-proposition']
}));

export const teachingPitchAssemblyTask = defineTask('teaching-pitch-assembly', (args, taskCtx) => ({
  kind: 'agent',
  title: `Teaching Pitch Assembly - ${args.accountName}`,
  agent: {
    name: 'sales-strategist',
    prompt: {
      role: 'Senior sales presenter and pitch development expert',
      task: 'Assemble all elements into a cohesive Challenger teaching pitch',
      context: args,
      instructions: [
        'Structure the pitch following the Challenger teaching conversation flow',
        'Create a compelling opening that hooks attention',
        'Sequence the reframe, rational drowning, and emotional impact',
        'Build to the value proposition naturally',
        'Include pause points for interaction',
        'Add talk tracks and delivery guidance',
        'Create contingency branches for different reactions',
        'Score pitch readiness and identify gaps'
      ],
      outputFormat: 'JSON with narrative, keyMessages, deliveryGuide, readinessScore, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['narrative', 'keyMessages', 'deliveryGuide', 'readinessScore', 'artifacts'],
      properties: {
        narrative: {
          type: 'object',
          properties: {
            opening: { type: 'string' },
            reframe: { type: 'string' },
            evidence: { type: 'string' },
            emotionalImpact: { type: 'string' },
            valueProposition: { type: 'string' },
            callToAction: { type: 'string' }
          }
        },
        keyMessages: { type: 'array', items: { type: 'string' } },
        deliveryGuide: {
          type: 'object',
          properties: {
            timing: { type: 'string' },
            pacing: { type: 'array', items: { type: 'object' } },
            interactionPoints: { type: 'array', items: { type: 'string' } },
            visualAids: { type: 'array', items: { type: 'string' } }
          }
        },
        readinessScore: { type: 'number', minimum: 0, maximum: 100 },
        gaps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'sales', 'challenger-sale', 'teaching-pitch']
}));
