/**
 * @process specializations/game-development/game-concept-development
 * @description Game Concept Development Process - Define and validate core game concept from initial idea to pitch-ready
 * documentation including high concept, target audience analysis, market research, core gameplay loop definition,
 * visual references, and initial Game Design Document (GDD) creation.
 * @inputs { conceptName: string, genre?: string, targetPlatforms?: array, targetAudience?: string, inspirations?: array, outputDir?: string }
 * @outputs { success: boolean, gddPath: string, pitchDeckPath: string, marketAnalysis: object, conceptValidation: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/game-development/game-concept-development', {
 *   conceptName: 'Stellar Odyssey',
 *   genre: 'Action RPG',
 *   targetPlatforms: ['PC', 'PlayStation 5', 'Xbox Series X'],
 *   targetAudience: 'Core gamers 18-35',
 *   inspirations: ['Dark Souls', 'Hades', 'Ori and the Blind Forest']
 * });
 *
 * @references
 * - The Art of Game Design: A Book of Lenses by Jesse Schell
 * - Game Design Theory and Practice by Richard Rouse III
 * - GDC Vault: Game Concept Development Talks
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    conceptName,
    genre = 'Action',
    targetPlatforms = ['PC'],
    targetAudience = 'Core gamers',
    inspirations = [],
    uniqueSellingPoints = [],
    budgetRange = 'indie',
    teamSize = 'small',
    developmentTimeline = '12-18 months',
    outputDir = 'game-concept-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Game Concept Development: ${conceptName}`);
  ctx.log('info', `Genre: ${genre}, Platforms: ${targetPlatforms.join(', ')}`);

  // ============================================================================
  // PHASE 1: HIGH CONCEPT DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 1: High Concept and Elevator Pitch Development');

  const highConcept = await ctx.task(highConceptTask, {
    conceptName,
    genre,
    targetPlatforms,
    targetAudience,
    inspirations,
    uniqueSellingPoints,
    outputDir
  });

  artifacts.push(...highConcept.artifacts);

  // ============================================================================
  // PHASE 2: MARKET AND COMPETITOR ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 2: Market Research and Competitor Analysis');

  const marketAnalysis = await ctx.task(marketAnalysisTask, {
    conceptName,
    genre,
    targetPlatforms,
    inspirations,
    highConcept,
    outputDir
  });

  artifacts.push(...marketAnalysis.artifacts);

  // Quality Gate: Market viability check
  if (marketAnalysis.viabilityScore < 0.5) {
    await ctx.breakpoint({
      question: `Market viability score for ${conceptName} is ${marketAnalysis.viabilityScore}. Concerns: ${marketAnalysis.concerns.join(', ')}. Review market analysis and consider pivoting concept?`,
      title: 'Market Viability Review',
      context: {
        runId: ctx.runId,
        conceptName,
        viabilityScore: marketAnalysis.viabilityScore,
        concerns: marketAnalysis.concerns,
        opportunities: marketAnalysis.opportunities,
        recommendation: 'Consider differentiating features or adjusting scope',
        files: marketAnalysis.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // ============================================================================
  // PHASE 3: TARGET AUDIENCE DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 3: Target Audience and Player Persona Definition');

  const audienceAnalysis = await ctx.task(audienceAnalysisTask, {
    conceptName,
    genre,
    targetPlatforms,
    targetAudience,
    marketAnalysis,
    outputDir
  });

  artifacts.push(...audienceAnalysis.artifacts);

  // ============================================================================
  // PHASE 4: CORE GAMEPLAY LOOP DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 4: Core Gameplay Loop and Mechanics Definition');

  const coreGameplay = await ctx.task(coreGameplayTask, {
    conceptName,
    genre,
    highConcept,
    inspirations,
    audienceAnalysis,
    outputDir
  });

  artifacts.push(...coreGameplay.artifacts);

  // Quality Gate: Core loop validation
  await ctx.breakpoint({
    question: `Core gameplay loop defined for ${conceptName}. Primary loop: ${coreGameplay.primaryLoop}. Secondary systems: ${coreGameplay.secondarySystems.length}. Review core mechanics design?`,
    title: 'Core Gameplay Loop Review',
    context: {
      runId: ctx.runId,
      primaryLoop: coreGameplay.primaryLoop,
      secondaryLoops: coreGameplay.secondaryLoops,
      uniqueMechanics: coreGameplay.uniqueMechanics,
      files: coreGameplay.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 5: VISUAL DIRECTION AND MOOD BOARDS
  // ============================================================================

  ctx.log('info', 'Phase 5: Visual Direction and Reference Collection');

  const visualDirection = await ctx.task(visualDirectionTask, {
    conceptName,
    genre,
    highConcept,
    inspirations,
    audienceAnalysis,
    outputDir
  });

  artifacts.push(...visualDirection.artifacts);

  // ============================================================================
  // PHASE 6: INITIAL GDD CREATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Initial Game Design Document Creation');

  const gddCreation = await ctx.task(gddCreationTask, {
    conceptName,
    genre,
    targetPlatforms,
    targetAudience,
    highConcept,
    marketAnalysis,
    audienceAnalysis,
    coreGameplay,
    visualDirection,
    budgetRange,
    teamSize,
    developmentTimeline,
    outputDir
  });

  artifacts.push(...gddCreation.artifacts);

  // ============================================================================
  // PHASE 7: PITCH DECK PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 7: Pitch Deck and Presentation Preparation');

  const pitchDeck = await ctx.task(pitchDeckTask, {
    conceptName,
    genre,
    targetPlatforms,
    highConcept,
    marketAnalysis,
    coreGameplay,
    visualDirection,
    gddCreation,
    outputDir
  });

  artifacts.push(...pitchDeck.artifacts);

  // ============================================================================
  // PHASE 8: CONCEPT VALIDATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Concept Validation and Stakeholder Presentation');

  const conceptValidation = await ctx.task(conceptValidationTask, {
    conceptName,
    highConcept,
    marketAnalysis,
    coreGameplay,
    pitchDeck,
    outputDir
  });

  artifacts.push(...conceptValidation.artifacts);

  // Final Breakpoint: Stakeholder approval
  await ctx.breakpoint({
    question: `Game Concept Development Complete for ${conceptName}. Validation score: ${conceptValidation.validationScore}/100. Ready for stakeholder presentation and approval?`,
    title: 'Concept Development Complete',
    context: {
      runId: ctx.runId,
      summary: {
        conceptName,
        genre,
        targetPlatforms,
        elevatorPitch: highConcept.elevatorPitch,
        marketViability: marketAnalysis.viabilityScore,
        validationScore: conceptValidation.validationScore,
        estimatedScope: gddCreation.estimatedScope
      },
      recommendation: conceptValidation.recommendation,
      files: [
        { path: gddCreation.gddPath, format: 'markdown', label: 'Game Design Document' },
        { path: pitchDeck.pitchDeckPath, format: 'pdf', label: 'Pitch Deck' },
        { path: highConcept.highConceptPath, format: 'markdown', label: 'High Concept' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    conceptName,
    genre,
    targetPlatforms,
    gddPath: gddCreation.gddPath,
    pitchDeckPath: pitchDeck.pitchDeckPath,
    highConcept: {
      elevatorPitch: highConcept.elevatorPitch,
      uniqueSellingPoints: highConcept.uniqueSellingPoints,
      path: highConcept.highConceptPath
    },
    marketAnalysis: {
      viabilityScore: marketAnalysis.viabilityScore,
      competitors: marketAnalysis.competitors,
      opportunities: marketAnalysis.opportunities,
      concerns: marketAnalysis.concerns
    },
    coreGameplay: {
      primaryLoop: coreGameplay.primaryLoop,
      secondarySystems: coreGameplay.secondarySystems,
      uniqueMechanics: coreGameplay.uniqueMechanics
    },
    conceptValidation: {
      validationScore: conceptValidation.validationScore,
      strengths: conceptValidation.strengths,
      risks: conceptValidation.risks,
      recommendation: conceptValidation.recommendation
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/game-development/game-concept-development',
      timestamp: startTime,
      conceptName,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const highConceptTask = defineTask('high-concept', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: High Concept - ${args.conceptName}`,
  agent: {
    name: 'game-designer-agent',
    prompt: {
      role: 'Senior Game Designer',
      task: 'Define high concept and elevator pitch for game',
      context: args,
      instructions: [
        '1. Create compelling elevator pitch (2-3 sentences)',
        '2. Define game genre and sub-genre clearly',
        '3. Identify 3-5 unique selling points (USPs)',
        '4. Describe core fantasy and player experience',
        '5. Define target platforms and technical scope',
        '6. Identify key inspirations and how this game differs',
        '7. Define tone and emotional experience',
        '8. Create "X meets Y" comparison for quick understanding',
        '9. List key features that differentiate from competitors',
        '10. Document high concept in structured format'
      ],
      outputFormat: 'JSON with high concept details'
    },
    outputSchema: {
      type: 'object',
      required: ['elevatorPitch', 'uniqueSellingPoints', 'highConceptPath', 'artifacts'],
      properties: {
        elevatorPitch: { type: 'string' },
        uniqueSellingPoints: { type: 'array', items: { type: 'string' } },
        coreFantasy: { type: 'string' },
        genreDescription: { type: 'string' },
        toneAndMood: { type: 'string' },
        xMeetsY: { type: 'string' },
        keyFeatures: { type: 'array', items: { type: 'string' } },
        highConceptPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-development', 'concept', 'high-concept']
}));

export const marketAnalysisTask = defineTask('market-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Market Analysis - ${args.conceptName}`,
  agent: {
    name: 'game-designer-agent',
    prompt: {
      role: 'Game Market Analyst',
      task: 'Conduct market research and competitor analysis',
      context: args,
      instructions: [
        '1. Research current market trends in the genre',
        '2. Identify top 5-10 competitors in the space',
        '3. Analyze competitor strengths and weaknesses',
        '4. Identify market gaps and opportunities',
        '5. Research target audience size and spending habits',
        '6. Analyze platform-specific market conditions',
        '7. Research pricing strategies in the genre',
        '8. Identify potential risks and market concerns',
        '9. Calculate market viability score (0-1)',
        '10. Create market analysis report'
      ],
      outputFormat: 'JSON with market analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['viabilityScore', 'competitors', 'opportunities', 'concerns', 'artifacts'],
      properties: {
        viabilityScore: { type: 'number', minimum: 0, maximum: 1 },
        competitors: { type: 'array', items: { type: 'object' } },
        opportunities: { type: 'array', items: { type: 'string' } },
        concerns: { type: 'array', items: { type: 'string' } },
        marketSize: { type: 'string' },
        pricingRecommendation: { type: 'string' },
        marketTrends: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-development', 'concept', 'market-analysis']
}));

export const audienceAnalysisTask = defineTask('audience-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Audience Analysis - ${args.conceptName}`,
  agent: {
    name: 'playtest-coordinator-agent',
    prompt: {
      role: 'Game UX Researcher',
      task: 'Define target audience and player personas',
      context: args,
      instructions: [
        '1. Define primary target demographic (age, gender, location)',
        '2. Create 2-3 detailed player personas',
        '3. Identify player motivations (Bartle types, player psychology)',
        '4. Research gaming habits and platform preferences',
        '5. Identify pain points in similar games',
        '6. Define accessibility requirements',
        '7. Research monetization tolerance',
        '8. Identify community and social preferences',
        '9. Define content expectations and session length',
        '10. Document audience profile'
      ],
      outputFormat: 'JSON with audience analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['primaryAudience', 'playerPersonas', 'artifacts'],
      properties: {
        primaryAudience: { type: 'object' },
        playerPersonas: { type: 'array', items: { type: 'object' } },
        playerMotivations: { type: 'array', items: { type: 'string' } },
        accessibilityNeeds: { type: 'array', items: { type: 'string' } },
        sessionLengthExpectation: { type: 'string' },
        monetizationTolerance: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-development', 'concept', 'audience-analysis']
}));

export const coreGameplayTask = defineTask('core-gameplay', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Core Gameplay - ${args.conceptName}`,
  agent: {
    name: 'game-designer-agent',
    prompt: {
      role: 'Senior Game Designer',
      task: 'Design core gameplay loop and mechanics',
      context: args,
      instructions: [
        '1. Define primary gameplay loop (5-30 second cycle)',
        '2. Define secondary gameplay loops (session-level)',
        '3. Define meta loop (progression across sessions)',
        '4. Identify core mechanics and player verbs',
        '5. Design unique mechanics that differentiate the game',
        '6. Define challenge and difficulty systems',
        '7. Design reward and feedback systems',
        '8. Plan progression and player growth',
        '9. Identify systems that create player engagement',
        '10. Document core gameplay design'
      ],
      outputFormat: 'JSON with core gameplay design'
    },
    outputSchema: {
      type: 'object',
      required: ['primaryLoop', 'secondaryLoops', 'secondarySystems', 'uniqueMechanics', 'artifacts'],
      properties: {
        primaryLoop: { type: 'string' },
        secondaryLoops: { type: 'array', items: { type: 'string' } },
        secondarySystems: { type: 'array', items: { type: 'string' } },
        metaLoop: { type: 'string' },
        coreMechanics: { type: 'array', items: { type: 'object' } },
        uniqueMechanics: { type: 'array', items: { type: 'string' } },
        progressionSystems: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-development', 'concept', 'gameplay-design']
}));

export const visualDirectionTask = defineTask('visual-direction', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Visual Direction - ${args.conceptName}`,
  agent: {
    name: 'art-director-agent',
    prompt: {
      role: 'Art Director',
      task: 'Define visual direction and create mood boards',
      context: args,
      instructions: [
        '1. Define art style (realistic, stylized, pixel art, etc.)',
        '2. Create color palette and mood guidelines',
        '3. Identify visual references and inspirations',
        '4. Define character art direction',
        '5. Define environment art direction',
        '6. Define UI/UX visual style',
        '7. Create mood boards for key areas',
        '8. Define animation style and principles',
        '9. Identify technical art requirements',
        '10. Document visual direction guidelines'
      ],
      outputFormat: 'JSON with visual direction'
    },
    outputSchema: {
      type: 'object',
      required: ['artStyle', 'colorPalette', 'moodBoardPath', 'artifacts'],
      properties: {
        artStyle: { type: 'string' },
        colorPalette: { type: 'array', items: { type: 'string' } },
        visualReferences: { type: 'array', items: { type: 'string' } },
        characterDirection: { type: 'object' },
        environmentDirection: { type: 'object' },
        uiDirection: { type: 'object' },
        moodBoardPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-development', 'concept', 'visual-direction']
}));

export const gddCreationTask = defineTask('gdd-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: GDD Creation - ${args.conceptName}`,
  agent: {
    name: 'gdd-writer-agent',
    prompt: {
      role: 'Lead Game Designer',
      task: 'Create initial Game Design Document',
      context: args,
      instructions: [
        '1. Create GDD structure and table of contents',
        '2. Write executive summary and high concept section',
        '3. Document gameplay mechanics in detail',
        '4. Define game flow and player progression',
        '5. Document level design guidelines',
        '6. Define narrative and story elements',
        '7. Specify technical requirements and constraints',
        '8. Include art and audio direction summaries',
        '9. Define scope and feature priorities (MVP vs full)',
        '10. Create living document with version control'
      ],
      outputFormat: 'JSON with GDD details'
    },
    outputSchema: {
      type: 'object',
      required: ['gddPath', 'estimatedScope', 'featurePriorities', 'artifacts'],
      properties: {
        gddPath: { type: 'string' },
        estimatedScope: { type: 'string' },
        featurePriorities: { type: 'object' },
        mvpFeatures: { type: 'array', items: { type: 'string' } },
        stretchFeatures: { type: 'array', items: { type: 'string' } },
        technicalRequirements: { type: 'array', items: { type: 'string' } },
        estimatedDevelopmentTime: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-development', 'concept', 'gdd']
}));

export const pitchDeckTask = defineTask('pitch-deck', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Pitch Deck - ${args.conceptName}`,
  agent: {
    name: 'game-producer-agent',
    prompt: {
      role: 'Game Producer',
      task: 'Create pitch deck for stakeholder presentation',
      context: args,
      instructions: [
        '1. Create compelling title slide with key art direction',
        '2. Present elevator pitch and high concept',
        '3. Show market opportunity and timing',
        '4. Present core gameplay and unique features',
        '5. Show visual direction and art samples',
        '6. Present team and capabilities (if applicable)',
        '7. Show development timeline and milestones',
        '8. Present budget and resource requirements',
        '9. Show comparable titles and success metrics',
        '10. Include call to action and next steps'
      ],
      outputFormat: 'JSON with pitch deck details'
    },
    outputSchema: {
      type: 'object',
      required: ['pitchDeckPath', 'slideCount', 'artifacts'],
      properties: {
        pitchDeckPath: { type: 'string' },
        slideCount: { type: 'number' },
        keySlides: { type: 'array', items: { type: 'string' } },
        talkingPoints: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-development', 'concept', 'pitch-deck']
}));

export const conceptValidationTask = defineTask('concept-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Concept Validation - ${args.conceptName}`,
  agent: {
    name: 'game-producer-agent',
    prompt: {
      role: 'Executive Producer',
      task: 'Validate game concept and provide recommendations',
      context: args,
      instructions: [
        '1. Review all concept documentation',
        '2. Assess market viability and timing',
        '3. Evaluate uniqueness and differentiation',
        '4. Assess technical feasibility',
        '5. Evaluate team capability alignment',
        '6. Identify key strengths of the concept',
        '7. Identify risks and mitigation strategies',
        '8. Score concept on multiple dimensions',
        '9. Provide go/no-go recommendation',
        '10. Document validation results'
      ],
      outputFormat: 'JSON with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['validationScore', 'strengths', 'risks', 'recommendation', 'artifacts'],
      properties: {
        validationScore: { type: 'number', minimum: 0, maximum: 100 },
        strengths: { type: 'array', items: { type: 'string' } },
        risks: { type: 'array', items: { type: 'object' } },
        recommendation: { type: 'string' },
        dimensionScores: { type: 'object' },
        nextSteps: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-development', 'concept', 'validation']
}));
