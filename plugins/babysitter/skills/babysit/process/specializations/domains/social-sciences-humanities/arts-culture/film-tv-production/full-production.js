/**
 * @process film-tv-production/full-production
 * @description Complete film/TV production workflow from concept to production-ready package. Orchestrates: story development -> character creation -> world building -> screenplay -> visual production -> audio design. Produces full scripts, storyboard prompts, video generation prompts, and production bible.
 * @inputs { concept: string, format: string, genre: string, targetDuration?: number, tone?: string, themes?: string[], createOriginalScore?: boolean, outputDir?: string }
 * @outputs { success: boolean, production: object, artifacts: array }
 * @recommendedSkills SK-FTV-001 through SK-FTV-012 (all film-tv-production skills)
 * @recommendedAgents AG-FTV-001 (screenwriter), AG-FTV-002 (visual-director), AG-FTV-003 (character-designer), AG-FTV-004 (world-builder), AG-FTV-005 (story-developer), AG-FTV-006 (production-coordinator)
 * @composedProcesses story-development, character-creation, world-building, screenplay-writing, visual-production, audio-design
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// Import subprocess modules
import { process as storyProcess, conceptRefinementTask, loglineCreationTask, treatmentWritingTask, beatSheetCreationTask, sceneOutlineTask, compileStoryPackageTask } from './story-development.js';
import { process as characterProcess, characterIdentification, protagonistProfile, supportingProfiles, relationshipDynamics, visualCharacterDesign, compileCharacterBible } from './character-creation.js';
import { process as worldProcess, worldOverview, locationDesign, propsDesign, costumeDesign, vfxPlanning, compileWorldBible } from './world-building.js';
import { process as screenplayProcess, scriptSetup, writeAct1, writeAct2A, writeAct2B, writeAct3, dialoguePolish, compileScreenplay } from './screenplay-writing.js';
import { process as visualProcess, visualStyleGuide, shotDesign, storyboardFrames, videoPrompts, lookbookCreation, compileVisualPackage } from './visual-production.js';
import { process as audioProcess, audioApproach, musicSpotting, soundDesignSpotting, scoreCompositionRequest, compileAudioPackage } from './audio-design.js';

export async function process(inputs, ctx) {
  const {
    concept,
    format,
    genre,
    targetDuration,
    tone,
    themes,
    createOriginalScore = false,
    outputDir = 'production-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const phaseResults = {};

  // ========================================================================
  // PHASE 1: STORY DEVELOPMENT
  // ========================================================================
  ctx.log('info', 'Starting Phase 1: Story Development');

  const storyResult = await ctx.task(storyDevelopmentPhase, {
    concept,
    format,
    genre,
    targetDuration,
    tone,
    themes,
    outputDir: `${outputDir}/story`
  });

  if (!storyResult.success) {
    return {
      success: false,
      error: 'Story development failed',
      phase: 'story',
      details: storyResult
    };
  }

  phaseResults.story = storyResult;
  artifacts.push(...(storyResult.artifacts || []));

  // Phase 1 Quality Gate
  await ctx.breakpoint({
    question: `Phase 1 Complete: Story development finished. Logline, treatment, beat sheet, and ${storyResult.story?.outline?.sceneCount || 0} scenes outlined. Ready to proceed to character creation?`,
    title: 'Phase 1: Story Development Complete',
    context: {
      runId: ctx.runId,
      files: storyResult.artifacts?.map(a => ({ path: a.path, format: 'markdown' })) || [],
      summary: {
        logline: storyResult.story?.logline?.primaryLogline,
        sceneCount: storyResult.story?.outline?.sceneCount,
        format,
        genre
      }
    }
  });

  // ========================================================================
  // PHASE 2: CHARACTER CREATION
  // ========================================================================
  ctx.log('info', 'Starting Phase 2: Character Creation');

  const characterResult = await ctx.task(characterCreationPhase, {
    storyContext: storyResult.story,
    format,
    genre,
    outputDir: `${outputDir}/characters`
  });

  if (!characterResult.success) {
    return {
      success: false,
      error: 'Character creation failed',
      phase: 'character',
      details: characterResult,
      previousPhases: { story: phaseResults.story }
    };
  }

  phaseResults.characters = characterResult;
  artifacts.push(...(characterResult.artifacts || []));

  // Phase 2 Quality Gate
  await ctx.breakpoint({
    question: `Phase 2 Complete: ${characterResult.characters?.supporting?.length + 2 || 0} characters profiled with relationships and visual designs. Ready to proceed to world building?`,
    title: 'Phase 2: Character Creation Complete',
    context: {
      runId: ctx.runId,
      files: characterResult.artifacts?.map(a => ({ path: a.path, format: 'markdown' })) || [],
      summary: {
        protagonist: characterResult.characters?.protagonist?.profile?.name,
        antagonist: characterResult.characters?.antagonist?.name,
        supportingCount: characterResult.characters?.supporting?.length || 0
      }
    }
  });

  // ========================================================================
  // PHASE 3: WORLD BUILDING
  // ========================================================================
  ctx.log('info', 'Starting Phase 3: World Building');

  const worldResult = await ctx.task(worldBuildingPhase, {
    storyContext: storyResult.story,
    characters: characterResult.characters,
    format,
    genre,
    outputDir: `${outputDir}/world`
  });

  if (!worldResult.success) {
    return {
      success: false,
      error: 'World building failed',
      phase: 'world',
      details: worldResult,
      previousPhases: { story: phaseResults.story, characters: phaseResults.characters }
    };
  }

  phaseResults.world = worldResult;
  artifacts.push(...(worldResult.artifacts || []));

  // Phase 3 Quality Gate
  await ctx.breakpoint({
    question: `Phase 3 Complete: ${worldResult.world?.locations?.length || 0} locations designed, props and costumes specified, ${worldResult.world?.vfx?.summary?.totalShots || 0} VFX shots planned. Ready to proceed to screenplay?`,
    title: 'Phase 3: World Building Complete',
    context: {
      runId: ctx.runId,
      files: worldResult.artifacts?.map(a => ({ path: a.path, format: 'markdown' })) || [],
      summary: {
        locations: worldResult.world?.locations?.length,
        vfxShots: worldResult.world?.vfx?.summary?.totalShots
      }
    }
  });

  // ========================================================================
  // PHASE 4: SCREENPLAY WRITING
  // ========================================================================
  ctx.log('info', 'Starting Phase 4: Screenplay Writing');

  const screenplayResult = await ctx.task(screenplayWritingPhase, {
    storyContext: storyResult.story,
    characters: characterResult.characters,
    sceneOutline: storyResult.story?.outline?.scenes,
    format,
    genre,
    outputDir: `${outputDir}/screenplay`
  });

  if (!screenplayResult.success) {
    return {
      success: false,
      error: 'Screenplay writing failed',
      phase: 'screenplay',
      details: screenplayResult,
      previousPhases: { story: phaseResults.story, characters: phaseResults.characters, world: phaseResults.world }
    };
  }

  phaseResults.screenplay = screenplayResult;
  artifacts.push(...(screenplayResult.artifacts || []));

  // Phase 4 Quality Gate
  await ctx.breakpoint({
    question: `Phase 4 Complete: Screenplay "${screenplayResult.screenplay?.titlePage?.title || 'Untitled'}" at ${screenplayResult.screenplay?.statistics?.totalPages || 0} pages. Ready to proceed to visual production?`,
    title: 'Phase 4: Screenplay Complete',
    context: {
      runId: ctx.runId,
      files: screenplayResult.artifacts?.map(a => ({ path: a.path, format: 'fountain' })) || [],
      summary: {
        title: screenplayResult.screenplay?.titlePage?.title,
        pageCount: screenplayResult.screenplay?.statistics?.totalPages,
        sceneCount: screenplayResult.screenplay?.statistics?.sceneCount
      }
    }
  });

  // ========================================================================
  // PHASE 5: VISUAL PRODUCTION
  // ========================================================================
  ctx.log('info', 'Starting Phase 5: Visual Production');

  const visualResult = await ctx.task(visualProductionPhase, {
    screenplay: screenplayResult.screenplay,
    scenes: storyResult.story?.outline?.scenes,
    worldBible: worldResult.world,
    genre,
    outputDir: `${outputDir}/visual`
  });

  if (!visualResult.success) {
    return {
      success: false,
      error: 'Visual production failed',
      phase: 'visual',
      details: visualResult,
      previousPhases: { story: phaseResults.story, characters: phaseResults.characters, world: phaseResults.world, screenplay: phaseResults.screenplay }
    };
  }

  phaseResults.visual = visualResult;
  artifacts.push(...(visualResult.artifacts || []));

  // Phase 5 Quality Gate
  await ctx.breakpoint({
    question: `Phase 5 Complete: ${visualResult.visualPackage?.statistics?.totalShots || 0} shots designed, ${visualResult.visualPackage?.storyboards?.length || 0} storyboard frames, video prompts for all scenes. Ready to proceed to audio design?`,
    title: 'Phase 5: Visual Production Complete',
    context: {
      runId: ctx.runId,
      files: visualResult.artifacts?.map(a => ({ path: a.path, format: 'markdown' })) || [],
      summary: {
        totalShots: visualResult.visualPackage?.statistics?.totalShots,
        storyboardFrames: visualResult.visualPackage?.storyboards?.length,
        videoPrompts: visualResult.visualPackage?.videoPrompts?.length
      }
    }
  });

  // ========================================================================
  // PHASE 6: AUDIO DESIGN
  // ========================================================================
  ctx.log('info', 'Starting Phase 6: Audio Design');

  const audioResult = await ctx.task(audioDesignPhase, {
    screenplay: screenplayResult.screenplay,
    scenes: storyResult.story?.outline?.scenes,
    genre,
    tone,
    createOriginalScore,
    outputDir: `${outputDir}/audio`
  });

  if (!audioResult.success) {
    return {
      success: false,
      error: 'Audio design failed',
      phase: 'audio',
      details: audioResult,
      previousPhases: { story: phaseResults.story, characters: phaseResults.characters, world: phaseResults.world, screenplay: phaseResults.screenplay, visual: phaseResults.visual }
    };
  }

  phaseResults.audio = audioResult;
  artifacts.push(...(audioResult.artifacts || []));

  // ========================================================================
  // PHASE 7: FINAL COMPILATION
  // ========================================================================
  ctx.log('info', 'Starting Phase 7: Final Production Bible Compilation');

  const finalResult = await ctx.task(compileProductionBible, {
    story: phaseResults.story,
    characters: phaseResults.characters,
    world: phaseResults.world,
    screenplay: phaseResults.screenplay,
    visual: phaseResults.visual,
    audio: phaseResults.audio,
    format,
    genre,
    outputDir
  });

  artifacts.push(...(finalResult.artifacts || []));

  // Final Quality Gate
  await ctx.breakpoint({
    question: `PRODUCTION COMPLETE! Full production package ready with screenplay, visual package, audio design, and production bible. Review final deliverables?`,
    title: 'Full Production Complete',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        title: screenplayResult.screenplay?.titlePage?.title,
        format,
        genre,
        pageCount: screenplayResult.screenplay?.statistics?.totalPages,
        sceneCount: storyResult.story?.outline?.sceneCount,
        totalShots: visualResult.visualPackage?.statistics?.totalShots,
        musicCues: audioResult.audioDesign?.musicCues?.length,
        originalScore: createOriginalScore
      }
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    production: {
      story: phaseResults.story?.story,
      characters: phaseResults.characters?.characters,
      world: phaseResults.world?.world,
      screenplay: phaseResults.screenplay?.screenplay,
      visual: phaseResults.visual?.visualPackage,
      audio: phaseResults.audio?.audioDesign,
      productionBible: finalResult.productionBible
    },
    artifacts,
    duration: endTime - startTime,
    statistics: {
      phases: 7,
      totalArtifacts: artifacts.length,
      format,
      genre,
      pageCount: screenplayResult.screenplay?.statistics?.totalPages,
      sceneCount: storyResult.story?.outline?.sceneCount,
      characterCount: (characterResult.characters?.supporting?.length || 0) + 2,
      locationCount: worldResult.world?.locations?.length,
      totalShots: visualResult.visualPackage?.statistics?.totalShots,
      musicCues: audioResult.audioDesign?.musicCues?.length
    },
    metadata: {
      processId: 'film-tv-production/full-production',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// PHASE TASK DEFINITIONS
// ============================================================================

export const storyDevelopmentPhase = defineTask('story-development-phase', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 1: Complete Story Development',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Story Developer',
      task: 'Execute complete story development from concept to scene-by-scene outline',
      context: args,
      instructions: [
        'Execute the full story development workflow:',
        '',
        '1. CONCEPT REFINEMENT:',
        '- Analyze concept for dramatic potential',
        '- Identify protagonist, goal, conflict, stakes',
        '- Determine structure for format',
        '- Define thematic through-line',
        '',
        '2. LOGLINE CREATION:',
        '- Craft compelling 25-50 word logline',
        '- Create variations: punchy, descriptive, high-concept',
        '',
        '3. TREATMENT WRITING:',
        '- Write complete narrative treatment',
        '- Present tense, cinematic writing',
        '- All major plot points through climax',
        '',
        '4. BEAT SHEET:',
        '- Create comprehensive beat sheet',
        '- Use appropriate structure for format',
        '- Include all turning points',
        '',
        '5. SCENE OUTLINE:',
        '- Break beats into individual scenes',
        '- Slugline, goal, characters, conflict per scene',
        '- Estimated page counts',
        '',
        '6. COMPILE PACKAGE:',
        '- Create logline.md, treatment.md, beat-sheet.md, outline.md'
      ],
      outputFormat: 'JSON with success boolean, story object (premise, protagonist, logline, treatment, beatSheet, outline), artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'story'],
      properties: {
        success: { type: 'boolean' },
        story: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'phase', 'story']
}));

export const characterCreationPhase = defineTask('character-creation-phase', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 2: Complete Character Creation',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Character Designer',
      task: 'Execute complete character creation with profiles, relationships, and visual designs',
      context: args,
      instructions: [
        'Execute the full character creation workflow:',
        '',
        '1. CHARACTER IDENTIFICATION:',
        '- Identify all characters from story outline',
        '- Categorize: protagonist, antagonist, supporting, minor',
        '- Map initial relationships',
        '',
        '2. PROTAGONIST PROFILE:',
        '- Apply CHARACTER framework (9 dimensions)',
        '- Psychology: want, need, flaw, lie, truth',
        '- Complete arc design',
        '- Voice profile for dialogue',
        '',
        '3. SUPPORTING PROFILES:',
        '- Antagonist as dark mirror/foil',
        '- Each supporting character with distinct voice',
        '- Own goals beyond serving protagonist',
        '',
        '4. RELATIONSHIP DYNAMICS:',
        '- Map all significant relationships',
        '- Evolution through story',
        '- Subtext and tensions',
        '',
        '5. VISUAL DESIGNS:',
        '- Physical descriptions',
        '- Wardrobe/costume concepts',
        '- Image generation prompts',
        '',
        '6. COMPILE BIBLE:',
        '- Character bible and individual profiles'
      ],
      outputFormat: 'JSON with success boolean, characters object (protagonist, antagonist, supporting, relationships, visualDesigns), artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'characters'],
      properties: {
        success: { type: 'boolean' },
        characters: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'phase', 'character']
}));

export const worldBuildingPhase = defineTask('world-building-phase', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 3: Complete World Building',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'World Builder / Production Designer',
      task: 'Execute complete world building with locations, props, costumes, and VFX planning',
      context: args,
      instructions: [
        'Execute the full world building workflow:',
        '',
        '1. WORLD OVERVIEW:',
        '- Define time period, geography, social context',
        '- Establish world rules',
        '- Visual style and color palette',
        '- Sensory world (sound, climate, texture)',
        '',
        '2. LOCATION DESIGN:',
        '- Design all story locations',
        '- Physical description, atmosphere, lighting',
        '- AI image prompts for visualization',
        '',
        '3. PROPS DESIGN:',
        '- Hero props, action props, set dressing',
        '- Master props list by scene',
        '',
        '4. COSTUME DESIGN:',
        '- Wardrobe per character',
        '- Scene-by-scene breakdown',
        '- Image generation prompts',
        '',
        '5. VFX PLANNING:',
        '- Identify all VFX requirements',
        '- Complexity ratings',
        '- AI video prompts for VFX shots',
        '',
        '6. COMPILE BIBLE:',
        '- World bible, location files, production docs'
      ],
      outputFormat: 'JSON with success boolean, world object (parameters, visualStyle, locations, props, costumes, vfx), artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'world'],
      properties: {
        success: { type: 'boolean' },
        world: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'phase', 'world']
}));

export const screenplayWritingPhase = defineTask('screenplay-writing-phase', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 4: Complete Screenplay Writing',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Screenwriter',
      task: 'Execute complete screenplay writing with all acts and dialogue polish',
      context: args,
      instructions: [
        'Execute the full screenplay writing workflow:',
        '',
        '1. SCRIPT SETUP:',
        '- Create title page',
        '- Establish format parameters',
        '- Style guidelines',
        '',
        '2. WRITE ACT 1:',
        '- All Act 1 scenes in Fountain format',
        '- Establish world, characters, tone',
        '- Hook reader, build to inciting incident',
        '',
        '3. WRITE ACT 2:',
        '- Act 2A: fun and games, build to midpoint',
        '- Act 2B: stakes intensify, all is lost',
        '',
        '4. WRITE ACT 3:',
        '- Final push, climax, resolution',
        '- Complete character arcs',
        '- Satisfying ending',
        '',
        '5. DIALOGUE POLISH:',
        '- Ensure distinct character voices',
        '- Subtext over on-the-nose',
        '- Economy and naturalism',
        '',
        '6. COMPILE SCREENPLAY:',
        '- Main screenplay and shooting script',
        '- Proper Fountain formatting'
      ],
      outputFormat: 'JSON with success boolean, screenplay object (titlePage, statistics, fountainContent), artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'screenplay'],
      properties: {
        success: { type: 'boolean' },
        screenplay: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'phase', 'screenplay']
}));

export const visualProductionPhase = defineTask('visual-production-phase', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 5: Complete Visual Production',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Visual Director',
      task: 'Execute complete visual production with shot lists, storyboards, and video prompts',
      context: args,
      instructions: [
        'Execute the full visual production workflow:',
        '',
        '1. VISUAL STYLE GUIDE:',
        '- Overall look, color palette',
        '- Lighting approach',
        '- Camera philosophy',
        '- AI prompt keywords',
        '',
        '2. SHOT DESIGN:',
        '- Detailed shot lists for every scene',
        '- Shot size, angle, movement, lens',
        '- AI video prompt per shot',
        '',
        '3. STORYBOARD FRAMES:',
        '- Select key moments',
        '- Composition, technical, lighting details',
        '- Midjourney/DALL-E/SD prompts',
        '',
        '4. VIDEO PROMPTS:',
        '- Platform-agnostic video prompts per scene',
        '- Sora, Runway, Pika, Kling optimized',
        '- Style consistency',
        '',
        '5. LOOKBOOK:',
        '- Visual concept document',
        '- Mood boards, character looks, world looks',
        '',
        '6. COMPILE PACKAGE:',
        '- Style guide, shot lists, storyboards, video prompts'
      ],
      outputFormat: 'JSON with success boolean, visualPackage object (styleGuide, shotLists, storyboards, videoPrompts, statistics), artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'visualPackage'],
      properties: {
        success: { type: 'boolean' },
        visualPackage: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'phase', 'visual']
}));

export const audioDesignPhase = defineTask('audio-design-phase', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 6: Complete Audio Design',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Sound Designer / Music Supervisor',
      task: 'Execute complete audio design with music cues, sound design, and optional score request',
      context: args,
      instructions: [
        'Execute the full audio design workflow:',
        '',
        '1. AUDIO APPROACH:',
        '- Sound philosophy (naturalistic vs. stylized)',
        '- Music direction and themes',
        '- Sound design style',
        '- Dialogue treatment',
        '',
        '2. MUSIC SPOTTING:',
        '- Spot all music cues',
        '- Cue number, scene, duration, mood',
        '- AI music prompts (Suno/Udio)',
        '',
        '3. SOUND DESIGN SPOTTING:',
        '- Ambience per scene',
        '- Sound effects, Foley',
        '- Designed sounds',
        '',
        '4. SCORE REQUEST (if requested):',
        '- Format for music-album-creation',
        '- Track list from cues',
        '- Theme specifications',
        '',
        '5. COMPILE PACKAGE:',
        '- Audio approach, music cues, sound design docs'
      ],
      outputFormat: 'JSON with success boolean, audioDesign object (approach, musicCues, soundDesign, scoreRequest), artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'audioDesign'],
      properties: {
        success: { type: 'boolean' },
        audioDesign: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'phase', 'audio']
}));

export const compileProductionBible = defineTask('compile-production-bible', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Phase 7: Compile Production Bible',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Production Coordinator',
      task: 'Compile complete production bible with all materials',
      context: args,
      instructions: [
        'Create master production bible:',
        '',
        'production-bible.md with:',
        '- Overview (format, genre, logline)',
        '- Story summary',
        '- Character index',
        '- World overview',
        '- Script summary',
        '- Visual package summary',
        '- Audio package summary',
        '',
        'Create breakdown sheets per scene:',
        '- Scene details',
        '- Cast, extras, locations',
        '- Props, wardrobe',
        '- VFX, SFX notes',
        '- Music cues',
        '',
        'Final directory structure:',
        '[outputDir]/',
        '├── production-bible.md',
        '├── story/',
        '├── characters/',
        '├── world/',
        '├── screenplay/',
        '├── visual/',
        '├── audio/',
        '└── breakdown-sheets/'
      ],
      outputFormat: 'JSON with productionBible object, files array, summary object, artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['productionBible', 'artifacts'],
      properties: {
        productionBible: { type: 'object' },
        files: { type: 'array' },
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'phase', 'compilation', 'final']
}));
