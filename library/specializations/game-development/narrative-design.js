/**
 * @process specializations/game-development/narrative-design
 * @description Narrative Design and Integration Process - Create compelling narrative that integrates seamlessly with
 * gameplay including story structure, branching paths, character development, dialogue systems, cutscenes, and
 * interactive storytelling that enhances player engagement.
 * @inputs { gameName: string, narrativeType?: string, storyStructure?: string, branchingLevel?: string, outputDir?: string }
 * @outputs { success: boolean, narrativeDocPath: string, dialogueScripts: array, characterProfiles: array, storyBeats: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/game-development/narrative-design', {
 *   gameName: 'Stellar Odyssey',
 *   narrativeType: 'epic-journey',
 *   storyStructure: 'three-act',
 *   branchingLevel: 'moderate'
 * });
 *
 * @references
 * - The Hero with a Thousand Faces by Joseph Campbell
 * - Procedural Storytelling in Game Design
 * - Story by Robert McKee
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    gameName,
    narrativeType = 'linear',
    storyStructure = 'three-act',
    branchingLevel = 'none',
    genre = 'fantasy',
    tone = 'serious',
    playerAgency = 'moderate',
    dialogueStyle = 'voiced',
    estimatedWordCount = 50000,
    outputDir = 'narrative-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Narrative Design Process: ${gameName}`);
  ctx.log('info', `Type: ${narrativeType}, Structure: ${storyStructure}, Branching: ${branchingLevel}`);

  // ============================================================================
  // PHASE 1: NARRATIVE FOUNDATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Narrative Foundation and Story Bible');

  const narrativeFoundation = await ctx.task(narrativeFoundationTask, {
    gameName,
    narrativeType,
    storyStructure,
    genre,
    tone,
    outputDir
  });

  artifacts.push(...narrativeFoundation.artifacts);

  // ============================================================================
  // PHASE 2: CHARACTER DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Character Development and Profiles');

  const characterDevelopment = await ctx.task(characterDevelopmentTask, {
    gameName,
    narrativeFoundation,
    genre,
    tone,
    outputDir
  });

  artifacts.push(...characterDevelopment.artifacts);

  // Quality Gate: Character review
  await ctx.breakpoint({
    question: `${characterDevelopment.characterCount} characters created for ${gameName}. Main characters: ${characterDevelopment.mainCharacters.map(c => c.name).join(', ')}. Review character profiles?`,
    title: 'Character Development Review',
    context: {
      runId: ctx.runId,
      characterCount: characterDevelopment.characterCount,
      mainCharacters: characterDevelopment.mainCharacters,
      supportingCharacters: characterDevelopment.supportingCharacters,
      files: [{ path: characterDevelopment.profilesPath, format: 'markdown', label: 'Character Profiles' }]
    }
  });

  // ============================================================================
  // PHASE 3: STORY STRUCTURE AND BEATS
  // ============================================================================

  ctx.log('info', 'Phase 3: Story Structure and Beat Sheet');

  const storyBeats = await ctx.task(storyBeatsTask, {
    gameName,
    narrativeFoundation,
    characterDevelopment,
    storyStructure,
    outputDir
  });

  artifacts.push(...storyBeats.artifacts);

  // ============================================================================
  // PHASE 4: BRANCHING NARRATIVE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 4: Branching Narrative Paths');

  const branchingDesign = await ctx.task(branchingDesignTask, {
    gameName,
    storyBeats,
    branchingLevel,
    playerAgency,
    outputDir
  });

  artifacts.push(...branchingDesign.artifacts);

  // ============================================================================
  // PHASE 5: DIALOGUE SYSTEM DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 5: Dialogue System and Conversation Design');

  const dialogueDesign = await ctx.task(dialogueDesignTask, {
    gameName,
    characterDevelopment,
    branchingDesign,
    dialogueStyle,
    tone,
    outputDir
  });

  artifacts.push(...dialogueDesign.artifacts);

  // ============================================================================
  // PHASE 6: DIALOGUE WRITING
  // ============================================================================

  ctx.log('info', 'Phase 6: Dialogue Script Writing');

  const dialogueWriting = await ctx.task(dialogueWritingTask, {
    gameName,
    characterDevelopment,
    storyBeats,
    dialogueDesign,
    estimatedWordCount,
    outputDir
  });

  artifacts.push(...dialogueWriting.artifacts);

  // ============================================================================
  // PHASE 7: CUTSCENE DESIGN
  // ============================================================================

  ctx.log('info', 'Phase 7: Cutscene and Cinematic Design');

  const cutsceneDesign = await ctx.task(cutsceneDesignTask, {
    gameName,
    storyBeats,
    dialogueWriting,
    outputDir
  });

  artifacts.push(...cutsceneDesign.artifacts);

  // ============================================================================
  // PHASE 8: GAMEPLAY INTEGRATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Narrative-Gameplay Integration');

  const gameplayIntegration = await ctx.task(narrativeIntegrationTask, {
    gameName,
    storyBeats,
    branchingDesign,
    dialogueDesign,
    cutsceneDesign,
    playerAgency,
    outputDir
  });

  artifacts.push(...gameplayIntegration.artifacts);

  // Quality Gate: Integration review
  await ctx.breakpoint({
    question: `Narrative-gameplay integration designed for ${gameName}. ${gameplayIntegration.integrationPoints} integration points. Player agency moments: ${gameplayIntegration.agencyMoments}. Review integration plan?`,
    title: 'Narrative Integration Review',
    context: {
      runId: ctx.runId,
      integrationPoints: gameplayIntegration.integrationPoints,
      agencyMoments: gameplayIntegration.agencyMoments,
      pacingNotes: gameplayIntegration.pacingNotes,
      files: gameplayIntegration.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // ============================================================================
  // PHASE 9: NARRATIVE PLAYTESTING
  // ============================================================================

  ctx.log('info', 'Phase 9: Narrative Playtesting and Feedback');

  const narrativePlaytest = await ctx.task(narrativePlaytestTask, {
    gameName,
    storyBeats,
    dialogueWriting,
    gameplayIntegration,
    outputDir
  });

  artifacts.push(...narrativePlaytest.artifacts);

  // ============================================================================
  // PHASE 10: NARRATIVE DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 10: Narrative Design Documentation');

  const narrativeDocumentation = await ctx.task(narrativeDocumentationTask, {
    gameName,
    narrativeFoundation,
    characterDevelopment,
    storyBeats,
    branchingDesign,
    dialogueWriting,
    cutsceneDesign,
    gameplayIntegration,
    narrativePlaytest,
    outputDir
  });

  artifacts.push(...narrativeDocumentation.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Narrative Design complete for ${gameName}. Total word count: ${dialogueWriting.totalWordCount}. Story satisfaction: ${narrativePlaytest.storySatisfaction}/10. Ready for implementation?`,
    title: 'Narrative Design Complete',
    context: {
      runId: ctx.runId,
      summary: {
        gameName,
        narrativeType,
        characterCount: characterDevelopment.characterCount,
        storyBeatsCount: storyBeats.beatsCount,
        branchingPaths: branchingDesign.totalPaths,
        totalWordCount: dialogueWriting.totalWordCount,
        cutsceneCount: cutsceneDesign.cutsceneCount,
        storySatisfaction: narrativePlaytest.storySatisfaction
      },
      files: [
        { path: narrativeDocumentation.narrativeDocPath, format: 'markdown', label: 'Narrative Bible' },
        { path: characterDevelopment.profilesPath, format: 'markdown', label: 'Character Profiles' },
        { path: dialogueWriting.scriptsPath, format: 'folder', label: 'Dialogue Scripts' }
      ]
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    gameName,
    narrativeDocPath: narrativeDocumentation.narrativeDocPath,
    dialogueScripts: dialogueWriting.scripts,
    characterProfiles: characterDevelopment.mainCharacters,
    storyBeats: storyBeats.beats,
    branching: {
      level: branchingLevel,
      totalPaths: branchingDesign.totalPaths,
      majorChoices: branchingDesign.majorChoices
    },
    metrics: {
      totalWordCount: dialogueWriting.totalWordCount,
      cutsceneCount: cutsceneDesign.cutsceneCount,
      characterCount: characterDevelopment.characterCount,
      storyBeatsCount: storyBeats.beatsCount
    },
    playtestResults: {
      storySatisfaction: narrativePlaytest.storySatisfaction,
      characterConnection: narrativePlaytest.characterConnection,
      pacingFeedback: narrativePlaytest.pacingFeedback
    },
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/game-development/narrative-design',
      timestamp: startTime,
      gameName,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const narrativeFoundationTask = defineTask('narrative-foundation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Narrative Foundation - ${args.gameName}`,
  agent: {
    name: 'narrative-designer-agent',
    prompt: {
      role: 'Lead Narrative Designer',
      task: 'Create narrative foundation and story bible',
      context: args,
      instructions: [
        '1. Define world and setting (lore, history, rules)',
        '2. Establish tone, themes, and motifs',
        '3. Create story premise and central conflict',
        '4. Define narrative pillars and goals',
        '5. Establish the players role in the story',
        '6. Define narrative constraints from gameplay',
        '7. Create story synopsis',
        '8. Identify key narrative questions',
        '9. Define emotional journey for player',
        '10. Document story bible foundation'
      ],
      outputFormat: 'JSON with narrative foundation'
    },
    outputSchema: {
      type: 'object',
      required: ['worldSetting', 'themes', 'premise', 'storyBiblePath', 'artifacts'],
      properties: {
        worldSetting: { type: 'object' },
        themes: { type: 'array', items: { type: 'string' } },
        premise: { type: 'string' },
        centralConflict: { type: 'string' },
        narrativePillars: { type: 'array', items: { type: 'string' } },
        playerRole: { type: 'string' },
        storyBiblePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-development', 'narrative', 'foundation']
}));

export const characterDevelopmentTask = defineTask('character-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Character Development - ${args.gameName}`,
  agent: {
    name: 'narrative-designer-agent',
    prompt: {
      role: 'Character Writer',
      task: 'Create detailed character profiles and arcs',
      context: args,
      instructions: [
        '1. Create protagonist profile and arc',
        '2. Design antagonist and motivations',
        '3. Create supporting character profiles',
        '4. Define character relationships and dynamics',
        '5. Design character voice and speech patterns',
        '6. Create backstories and secrets',
        '7. Define character growth and change',
        '8. Design memorable character moments',
        '9. Create character reference sheets',
        '10. Document all character profiles'
      ],
      outputFormat: 'JSON with character development'
    },
    outputSchema: {
      type: 'object',
      required: ['characterCount', 'mainCharacters', 'supportingCharacters', 'profilesPath', 'artifacts'],
      properties: {
        characterCount: { type: 'number' },
        mainCharacters: { type: 'array', items: { type: 'object' } },
        supportingCharacters: { type: 'array', items: { type: 'object' } },
        relationships: { type: 'array', items: { type: 'object' } },
        profilesPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-development', 'narrative', 'characters']
}));

export const storyBeatsTask = defineTask('story-beats', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Story Beats - ${args.gameName}`,
  agent: {
    name: 'narrative-designer-agent',
    prompt: {
      role: 'Story Architect',
      task: 'Create story structure and beat sheet',
      context: args,
      instructions: [
        '1. Define story acts and major turning points',
        '2. Create beat sheet with all story moments',
        '3. Map emotional arc through story',
        '4. Define inciting incident and climax',
        '5. Plan character arc intersections',
        '6. Create tension and release rhythm',
        '7. Plan revelations and twists',
        '8. Design resolution and denouement',
        '9. Map beats to game progression',
        '10. Document story beat sheet'
      ],
      outputFormat: 'JSON with story beats'
    },
    outputSchema: {
      type: 'object',
      required: ['beats', 'beatsCount', 'actStructure', 'artifacts'],
      properties: {
        beats: { type: 'array', items: { type: 'object' } },
        beatsCount: { type: 'number' },
        actStructure: { type: 'array', items: { type: 'object' } },
        emotionalArc: { type: 'array', items: { type: 'object' } },
        turningPoints: { type: 'array', items: { type: 'object' } },
        beatSheetPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-development', 'narrative', 'story-beats']
}));

export const branchingDesignTask = defineTask('branching-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Branching Design - ${args.gameName}`,
  agent: {
    name: 'narrative-designer-agent',
    prompt: {
      role: 'Systems Narrative Designer',
      task: 'Design branching narrative paths',
      context: args,
      instructions: [
        '1. Identify major choice points',
        '2. Design branch consequences',
        '3. Create narrative flowchart',
        '4. Plan convergence points',
        '5. Design meaningful vs cosmetic choices',
        '6. Plan multiple endings if applicable',
        '7. Design relationship branching',
        '8. Create branch tracking system',
        '9. Estimate content multiplication',
        '10. Document branching structure'
      ],
      outputFormat: 'JSON with branching design'
    },
    outputSchema: {
      type: 'object',
      required: ['totalPaths', 'majorChoices', 'branchingFlowPath', 'artifacts'],
      properties: {
        totalPaths: { type: 'number' },
        majorChoices: { type: 'array', items: { type: 'object' } },
        minorChoices: { type: 'array', items: { type: 'object' } },
        convergencePoints: { type: 'array', items: { type: 'string' } },
        endings: { type: 'array', items: { type: 'object' } },
        branchingFlowPath: { type: 'string' },
        contentMultiplier: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-development', 'narrative', 'branching']
}));

export const dialogueDesignTask = defineTask('dialogue-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Dialogue Design - ${args.gameName}`,
  agent: {
    name: 'narrative-designer-agent',
    prompt: {
      role: 'Dialogue Systems Designer',
      task: 'Design dialogue system and conversation structure',
      context: args,
      instructions: [
        '1. Define dialogue system type (tree, hub, etc.)',
        '2. Design conversation flow patterns',
        '3. Create dialogue UI/UX guidelines',
        '4. Define response types and options',
        '5. Design bark and ambient dialogue',
        '6. Plan voiced vs text dialogue',
        '7. Create dialogue state tracking',
        '8. Design interruption and urgency',
        '9. Plan localization considerations',
        '10. Document dialogue system design'
      ],
      outputFormat: 'JSON with dialogue design'
    },
    outputSchema: {
      type: 'object',
      required: ['systemType', 'conversationPatterns', 'artifacts'],
      properties: {
        systemType: { type: 'string' },
        conversationPatterns: { type: 'array', items: { type: 'object' } },
        responseTypes: { type: 'array', items: { type: 'string' } },
        barkSystem: { type: 'object' },
        voiceGuidelines: { type: 'object' },
        localizationNotes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-development', 'narrative', 'dialogue-design']
}));

export const dialogueWritingTask = defineTask('dialogue-writing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Dialogue Writing - ${args.gameName}`,
  agent: {
    name: 'gdd-writer-agent',
    prompt: {
      role: 'Game Writer',
      task: 'Write dialogue scripts for all conversations',
      context: args,
      instructions: [
        '1. Write main story dialogue',
        '2. Write character-specific conversations',
        '3. Create ambient and bark dialogue',
        '4. Write tutorial and hint text',
        '5. Create item and lore descriptions',
        '6. Write branching dialogue variations',
        '7. Create emotional range in dialogue',
        '8. Ensure consistent character voice',
        '9. Format for implementation',
        '10. Track total word count'
      ],
      outputFormat: 'JSON with dialogue writing details'
    },
    outputSchema: {
      type: 'object',
      required: ['scripts', 'totalWordCount', 'scriptsPath', 'artifacts'],
      properties: {
        scripts: { type: 'array', items: { type: 'object' } },
        totalWordCount: { type: 'number' },
        scriptsPath: { type: 'string' },
        mainStoryWords: { type: 'number' },
        barkWords: { type: 'number' },
        loreWords: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-development', 'narrative', 'dialogue-writing']
}));

export const cutsceneDesignTask = defineTask('cutscene-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 7: Cutscene Design - ${args.gameName}`,
  agent: {
    name: 'animator-agent',
    prompt: {
      role: 'Cinematic Designer',
      task: 'Design cutscenes and cinematics',
      context: args,
      instructions: [
        '1. Identify cutscene moments in story',
        '2. Determine cutscene types (in-engine, pre-rendered)',
        '3. Write cutscene scripts with action lines',
        '4. Plan camera work and staging',
        '5. Design transitions in/out of gameplay',
        '6. Plan character performances',
        '7. Create shot lists for key scenes',
        '8. Design skip and pause behavior',
        '9. Plan accessibility features',
        '10. Document cutscene designs'
      ],
      outputFormat: 'JSON with cutscene design'
    },
    outputSchema: {
      type: 'object',
      required: ['cutsceneCount', 'cutsceneList', 'artifacts'],
      properties: {
        cutsceneCount: { type: 'number' },
        cutsceneList: { type: 'array', items: { type: 'object' } },
        totalCutsceneLength: { type: 'string' },
        inEngineCutscenes: { type: 'number' },
        preRenderedCutscenes: { type: 'number' },
        shotLists: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-development', 'narrative', 'cutscenes']
}));

export const narrativeIntegrationTask = defineTask('narrative-integration', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 8: Narrative Integration - ${args.gameName}`,
  agent: {
    name: 'narrative-designer-agent',
    prompt: {
      role: 'Narrative Systems Designer',
      task: 'Integrate narrative with gameplay systems',
      context: args,
      instructions: [
        '1. Map story beats to game progression',
        '2. Design trigger points for narrative',
        '3. Plan player agency moments',
        '4. Design environmental storytelling hooks',
        '5. Create narrative pacing guidelines',
        '6. Plan interruption handling',
        '7. Design fail-state narratives',
        '8. Integrate with quest/objective system',
        '9. Plan save/load narrative state',
        '10. Document integration specification'
      ],
      outputFormat: 'JSON with integration details'
    },
    outputSchema: {
      type: 'object',
      required: ['integrationPoints', 'agencyMoments', 'pacingNotes', 'artifacts'],
      properties: {
        integrationPoints: { type: 'number' },
        agencyMoments: { type: 'number' },
        triggerDesigns: { type: 'array', items: { type: 'object' } },
        pacingNotes: { type: 'array', items: { type: 'string' } },
        questIntegration: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-development', 'narrative', 'integration']
}));

export const narrativePlaytestTask = defineTask('narrative-playtest', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 9: Narrative Playtest - ${args.gameName}`,
  agent: {
    name: 'playtest-coordinator-agent',
    prompt: {
      role: 'Narrative UX Researcher',
      task: 'Playtest narrative elements and gather feedback',
      context: args,
      instructions: [
        '1. Conduct story comprehension tests',
        '2. Measure character connection and likability',
        '3. Test dialogue readability and flow',
        '4. Evaluate pacing and story fatigue',
        '5. Test branching clarity and satisfaction',
        '6. Gather emotional response data',
        '7. Test cutscene engagement',
        '8. Evaluate story satisfaction',
        '9. Identify confusion points',
        '10. Synthesize narrative feedback'
      ],
      outputFormat: 'JSON with playtest results'
    },
    outputSchema: {
      type: 'object',
      required: ['storySatisfaction', 'characterConnection', 'pacingFeedback', 'artifacts'],
      properties: {
        storySatisfaction: { type: 'number', minimum: 1, maximum: 10 },
        characterConnection: { type: 'number', minimum: 1, maximum: 10 },
        pacingFeedback: { type: 'string' },
        comprehensionScore: { type: 'number' },
        emotionalHighlights: { type: 'array', items: { type: 'object' } },
        confusionPoints: { type: 'array', items: { type: 'string' } },
        dialogueFeedback: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-development', 'narrative', 'playtesting']
}));

export const narrativeDocumentationTask = defineTask('narrative-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 10: Narrative Documentation - ${args.gameName}`,
  agent: {
    name: 'technical-documentation-agent',
    prompt: {
      role: 'Technical Writer',
      task: 'Create comprehensive narrative documentation',
      context: args,
      instructions: [
        '1. Compile complete story bible',
        '2. Include all character profiles',
        '3. Document complete story beats',
        '4. Include branching documentation',
        '5. Compile dialogue scripts',
        '6. Include cutscene documentation',
        '7. Document integration specifications',
        '8. Include playtest findings',
        '9. Create implementation guide',
        '10. Create living narrative document'
      ],
      outputFormat: 'JSON with documentation details'
    },
    outputSchema: {
      type: 'object',
      required: ['narrativeDocPath', 'artifacts'],
      properties: {
        narrativeDocPath: { type: 'string' },
        storyBiblePath: { type: 'string' },
        characterDocsPath: { type: 'string' },
        dialogueDocsPath: { type: 'string' },
        implementationGuidePath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-development', 'narrative', 'documentation']
}));
