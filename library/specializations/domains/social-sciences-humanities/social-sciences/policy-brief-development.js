/**
 * @process social-sciences/policy-brief-development
 * @description Translate research findings into accessible policy briefs for decision-makers including key findings, implications, and actionable recommendations
 * @inputs { researchFindings: object, targetAudience: object, policyContext: object, outputDir: string }
 * @outputs { success: boolean, policyBrief: object, visualizations: array, qualityScore: number, artifacts: array }
 * @recommendedSkills SK-SS-012 (policy-communication)
 * @recommendedAgents AG-SS-006 (policy-research-analyst)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    researchFindings = {},
    targetAudience = {},
    policyContext = {},
    outputDir = 'policy-brief-output',
    briefLength = 'standard'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Policy Brief Development process');

  // ============================================================================
  // PHASE 1: AUDIENCE AND CONTEXT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 1: Analyzing audience and context');
  const audienceAnalysis = await ctx.task(audienceAnalysisTask, {
    targetAudience,
    policyContext,
    outputDir
  });

  artifacts.push(...audienceAnalysis.artifacts);

  // ============================================================================
  // PHASE 2: KEY MESSAGE DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Developing key messages');
  const keyMessages = await ctx.task(keyMessageDevelopmentTask, {
    researchFindings,
    audienceAnalysis,
    outputDir
  });

  artifacts.push(...keyMessages.artifacts);

  // ============================================================================
  // PHASE 3: EVIDENCE TRANSLATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Translating evidence');
  const evidenceTranslation = await ctx.task(evidenceTranslationTask, {
    researchFindings,
    keyMessages,
    targetAudience,
    outputDir
  });

  artifacts.push(...evidenceTranslation.artifacts);

  // ============================================================================
  // PHASE 4: RECOMMENDATIONS DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Developing recommendations');
  const recommendations = await ctx.task(policyRecommendationsTask, {
    researchFindings,
    policyContext,
    evidenceTranslation,
    outputDir
  });

  artifacts.push(...recommendations.artifacts);

  // ============================================================================
  // PHASE 5: VISUALIZATION DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 5: Designing visualizations');
  const visualizations = await ctx.task(policyVisualizationsTask, {
    researchFindings,
    keyMessages,
    outputDir
  });

  artifacts.push(...visualizations.artifacts);

  // ============================================================================
  // PHASE 6: BRIEF COMPOSITION
  // ============================================================================

  ctx.log('info', 'Phase 6: Composing policy brief');
  const briefComposition = await ctx.task(briefCompositionTask, {
    audienceAnalysis,
    keyMessages,
    evidenceTranslation,
    recommendations,
    visualizations,
    briefLength,
    outputDir
  });

  artifacts.push(...briefComposition.artifacts);

  // ============================================================================
  // PHASE 7: QUALITY SCORING
  // ============================================================================

  ctx.log('info', 'Phase 7: Scoring policy brief quality');
  const qualityScore = await ctx.task(policyBriefQualityScoringTask, {
    audienceAnalysis,
    keyMessages,
    evidenceTranslation,
    recommendations,
    visualizations,
    briefComposition,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const briefScore = qualityScore.overallScore;
  const qualityMet = briefScore >= 80;

  // Breakpoint: Review policy brief
  await ctx.breakpoint({
    question: `Policy brief complete. Quality score: ${briefScore}/100. ${qualityMet ? 'Brief meets quality standards!' : 'Brief may need refinement.'} Review and approve?`,
    title: 'Policy Brief Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'markdown'
      })),
      summary: {
        briefScore,
        qualityMet,
        targetAudience: audienceAnalysis.audienceType,
        recommendationCount: recommendations.recommendations.length
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    qualityScore: briefScore,
    qualityMet,
    policyBrief: {
      title: briefComposition.title,
      executiveSummary: briefComposition.executiveSummary,
      briefPath: briefComposition.briefPath
    },
    visualizations: visualizations.visuals,
    recommendations: recommendations.recommendations,
    artifacts,
    duration,
    metadata: {
      processId: 'social-sciences/policy-brief-development',
      timestamp: startTime,
      outputDir
    }
  };
}

export const audienceAnalysisTask = defineTask('audience-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze audience and context',
  agent: {
    name: 'audience-analyst',
    prompt: {
      role: 'policy communication specialist',
      task: 'Analyze target audience and policy context',
      context: args,
      instructions: [
        'Identify primary and secondary audiences',
        'Assess audience knowledge level',
        'Identify audience priorities and concerns',
        'Analyze policy decision-making context',
        'Identify policy windows and timing',
        'Assess competing narratives',
        'Determine appropriate tone and language',
        'Generate audience analysis report'
      ],
      outputFormat: 'JSON with audienceType, knowledgeLevel, priorities, policyWindow, tone, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['audienceType', 'priorities', 'artifacts'],
      properties: {
        audienceType: { type: 'string' },
        knowledgeLevel: { type: 'string' },
        priorities: { type: 'array', items: { type: 'string' } },
        concerns: { type: 'array', items: { type: 'string' } },
        policyWindow: { type: 'object' },
        tone: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'policy-brief', 'audience']
}));

export const keyMessageDevelopmentTask = defineTask('key-message-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop key messages',
  agent: {
    name: 'message-developer',
    prompt: {
      role: 'science communication specialist',
      task: 'Develop key messages from research',
      context: args,
      instructions: [
        'Extract main findings from research',
        'Frame findings for target audience',
        'Develop compelling headline message',
        'Create 3-5 supporting key messages',
        'Ensure messages are evidence-based',
        'Make messages actionable',
        'Test messages for clarity',
        'Generate key messages document'
      ],
      outputFormat: 'JSON with headlineMessage, keyMessages, supportingEvidence, framing, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['headlineMessage', 'keyMessages', 'artifacts'],
      properties: {
        headlineMessage: { type: 'string' },
        keyMessages: { type: 'array', items: { type: 'string' } },
        supportingEvidence: { type: 'object' },
        framing: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'policy-brief', 'messages']
}));

export const evidenceTranslationTask = defineTask('evidence-translation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Translate evidence',
  agent: {
    name: 'evidence-translator',
    prompt: {
      role: 'research-to-policy translator',
      task: 'Translate research evidence for policy audience',
      context: args,
      instructions: [
        'Simplify technical language',
        'Convert statistics to meaningful terms',
        'Use analogies and examples',
        'Highlight practical significance',
        'Address "so what" question',
        'Maintain accuracy while simplifying',
        'Include caveats appropriately',
        'Generate translated evidence summary'
      ],
      outputFormat: 'JSON with translatedEvidence, simplifiedStats, analogies, practicalSignificance, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['translatedEvidence', 'artifacts'],
      properties: {
        translatedEvidence: { type: 'string' },
        simplifiedStats: { type: 'array' },
        analogies: { type: 'array', items: { type: 'string' } },
        practicalSignificance: { type: 'string' },
        caveats: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'policy-brief', 'translation']
}));

export const policyRecommendationsTask = defineTask('policy-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop recommendations',
  agent: {
    name: 'policy-recommendations-developer',
    prompt: {
      role: 'policy analyst',
      task: 'Develop actionable policy recommendations',
      context: args,
      instructions: [
        'Derive recommendations from evidence',
        'Make recommendations specific and actionable',
        'Consider implementation feasibility',
        'Address potential barriers',
        'Prioritize recommendations',
        'Include short and long-term options',
        'Consider resource implications',
        'Generate recommendations section'
      ],
      outputFormat: 'JSON with recommendations, implementation, barriers, timeline, resourceImplications, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'artifacts'],
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              priority: { type: 'string' },
              timeline: { type: 'string' },
              evidence: { type: 'string' }
            }
          }
        },
        implementation: { type: 'object' },
        barriers: { type: 'array', items: { type: 'string' } },
        resourceImplications: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'policy-brief', 'recommendations']
}));

export const policyVisualizationsTask = defineTask('policy-visualizations', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design visualizations',
  agent: {
    name: 'policy-visualization-designer',
    prompt: {
      role: 'data visualization specialist',
      task: 'Design effective visualizations for policy brief',
      context: args,
      instructions: [
        'Identify key data points to visualize',
        'Select appropriate chart types',
        'Design clear and simple graphics',
        'Use accessible color schemes',
        'Create infographic elements',
        'Design summary boxes/callouts',
        'Ensure visualizations support key messages',
        'Generate visualization specifications'
      ],
      outputFormat: 'JSON with visuals, chartTypes, infographics, callouts, specifications, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['visuals', 'artifacts'],
      properties: {
        visuals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              description: { type: 'string' },
              data: { type: 'object' }
            }
          }
        },
        chartTypes: { type: 'array', items: { type: 'string' } },
        infographics: { type: 'array' },
        callouts: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'policy-brief', 'visualizations']
}));

export const briefCompositionTask = defineTask('brief-composition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compose policy brief',
  agent: {
    name: 'brief-composer',
    prompt: {
      role: 'policy brief writer',
      task: 'Compose complete policy brief',
      context: args,
      instructions: [
        'Write compelling executive summary',
        'Structure brief for scanning',
        'Use headers and bullet points',
        'Integrate visualizations',
        'Include call to action',
        'Add contact information',
        'Ensure appropriate length',
        'Generate final policy brief'
      ],
      outputFormat: 'JSON with title, executiveSummary, briefPath, wordCount, sections, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['title', 'executiveSummary', 'briefPath', 'artifacts'],
      properties: {
        title: { type: 'string' },
        executiveSummary: { type: 'string' },
        briefPath: { type: 'string' },
        wordCount: { type: 'number' },
        sections: { type: 'array' },
        callToAction: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'policy-brief', 'composition']
}));

export const policyBriefQualityScoringTask = defineTask('policy-brief-quality-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Score policy brief quality',
  agent: {
    name: 'brief-quality-reviewer',
    prompt: {
      role: 'policy communication reviewer',
      task: 'Assess policy brief quality',
      context: args,
      instructions: [
        'Evaluate audience analysis (weight: 10%)',
        'Assess message clarity (weight: 20%)',
        'Evaluate evidence translation (weight: 20%)',
        'Assess recommendations quality (weight: 20%)',
        'Evaluate visualizations (weight: 15%)',
        'Assess overall composition (weight: 15%)',
        'Calculate weighted overall score (0-100)',
        'Identify areas for improvement'
      ],
      outputFormat: 'JSON with overallScore, componentScores, gaps, recommendations, artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: { type: 'object' },
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
  labels: ['agent', 'policy-brief', 'quality-scoring']
}));
