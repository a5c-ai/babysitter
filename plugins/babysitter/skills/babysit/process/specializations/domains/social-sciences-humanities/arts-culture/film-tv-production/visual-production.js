/**
 * @process film-tv-production/visual-production
 * @description Creates visual production package including shot lists, storyboard prompts for AI image generation, and video prompts for AI video generation (platform-agnostic: Sora, Runway, Pika, Kling).
 * @inputs { screenplay: object, scenes: array, worldBible: object, genre: string, visualStyle?: object, outputDir?: string }
 * @outputs { success: boolean, visualPackage: object, artifacts: array }
 * @recommendedSkills SK-FTV-005 (storyboard-prompting), SK-FTV-006 (video-prompt-engineering), SK-FTV-009 (shot-composition)
 * @recommendedAgents AG-FTV-002 (visual-director-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    screenplay,
    scenes,
    worldBible,
    genre,
    visualStyle,
    outputDir = 'visual-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Visual Style Guide
  ctx.log('info', 'Creating visual style guide');
  const styleResult = await ctx.task(visualStyleGuide, {
    genre,
    existingStyle: visualStyle,
    worldBible,
    scenes: scenes.slice(0, 5)
  });
  artifacts.push(...(styleResult.artifacts || []));

  // Task 2: Shot Design
  ctx.log('info', 'Designing shots for all scenes');
  const shotResult = await ctx.task(shotDesign, {
    scenes,
    visualStyle: styleResult.styleGuide,
    genre,
    worldBible
  });
  artifacts.push(...(shotResult.artifacts || []));

  // Task 3: Storyboard Frame Prompts
  ctx.log('info', 'Creating storyboard frame prompts');
  const storyboardResult = await ctx.task(storyboardFrames, {
    sceneShotLists: shotResult.sceneShotLists,
    visualStyle: styleResult.styleGuide,
    promptKeywords: styleResult.promptKeywords
  });
  artifacts.push(...(storyboardResult.artifacts || []));

  // Task 4: Video Generation Prompts
  ctx.log('info', 'Creating video generation prompts');
  const videoResult = await ctx.task(videoPrompts, {
    scenes,
    sceneShotLists: shotResult.sceneShotLists,
    visualStyle: styleResult.styleGuide,
    worldBible
  });
  artifacts.push(...(videoResult.artifacts || []));

  // Task 5: Lookbook Creation
  ctx.log('info', 'Creating visual lookbook');
  const lookbookResult = await ctx.task(lookbookCreation, {
    styleGuide: styleResult.styleGuide,
    storyboardFrames: storyboardResult.storyboardFrames,
    genre,
    worldBible
  });
  artifacts.push(...(lookbookResult.artifacts || []));

  // Task 6: Compile Visual Package
  ctx.log('info', 'Compiling visual production package');
  const compileResult = await ctx.task(compileVisualPackage, {
    styleGuide: styleResult.styleGuide,
    shotLists: shotResult.sceneShotLists,
    storyboards: storyboardResult.storyboardFrames,
    videoPrompts: videoResult.sceneVideoPrompts,
    lookbook: lookbookResult.lookbook,
    outputDir
  });
  artifacts.push(...(compileResult.artifacts || []));

  // Breakpoint: Visual Review
  await ctx.breakpoint({
    question: `Visual package complete with ${shotResult.statistics?.totalShots || 0} shots, ${storyboardResult.frameCount || 0} storyboard frames, and ${videoResult.sceneVideoPrompts?.length || 0} scene video prompts. Review and approve?`,
    title: 'Visual Production Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        totalShots: shotResult.statistics?.totalShots,
        storyboardFrames: storyboardResult.frameCount,
        videoPrompts: videoResult.sceneVideoPrompts?.length,
        visualStyle: styleResult.styleGuide?.overallLook
      }
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    visualPackage: {
      styleGuide: styleResult.styleGuide,
      shotLists: shotResult.sceneShotLists,
      storyboards: storyboardResult.storyboardFrames,
      videoPrompts: videoResult.sceneVideoPrompts,
      lookbook: lookbookResult.lookbook,
      statistics: shotResult.statistics
    },
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'film-tv-production/visual-production',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task Definitions

export const visualStyleGuide = defineTask('visual-style-guide', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create visual style guide',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Director of Photography / Visual Director',
      task: 'Establish comprehensive visual style guide for the production',
      context: args,
      instructions: [
        'Create detailed visual style guide:',
        '',
        '1. OVERALL LOOK:',
        '- Visual concept/approach',
        '- Reference films/shows',
        '- Mood and atmosphere',
        '',
        '2. COLOR PALETTE:',
        '- Primary colors',
        '- Accent colors',
        '- Color psychology for story',
        '- Color shifts throughout narrative',
        '',
        '3. LIGHTING APPROACH:',
        '- Key light style',
        '- Natural vs. artificial preference',
        '- Contrast ratio',
        '- Time of day treatments',
        '- Character-specific lighting',
        '',
        '4. CAMERA PHILOSOPHY:',
        '- Movement philosophy (static vs. dynamic)',
        '- Preferred shot sizes',
        '- Lens choices (wide vs. long)',
        '- POV approach',
        '- Steadicam/handheld preferences',
        '',
        '5. COMPOSITION:',
        '- Framing style',
        '- Aspect ratio',
        '- Depth preferences',
        '- Visual motifs',
        '',
        '6. AI PROMPT KEYWORDS:',
        '- Style keywords for consistency',
        '- Lighting keywords',
        '- Camera keywords',
        '- Quality keywords'
      ],
      outputFormat: 'JSON with styleGuide object, promptKeywords object, colorPalette array, references array, artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['styleGuide', 'promptKeywords'],
      properties: {
        styleGuide: { type: 'object' },
        promptKeywords: { type: 'object' },
        colorPalette: { type: 'array', items: { type: 'string' } },
        references: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'visual', 'style']
}));

export const shotDesign = defineTask('shot-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design shots for all scenes',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Director / Cinematographer',
      task: 'Create detailed shot lists for every scene in the screenplay',
      context: args,
      instructions: [
        'For each scene, create comprehensive shot list:',
        '',
        'FOR EACH SHOT:',
        '1. Shot number (Scene.Shot format)',
        '2. Shot size: ECU, CU, MCU, MS, MLS, LS, WS, EWS',
        '3. Angle: Eye level, High, Low, Dutch, Bird\'s eye, Worm\'s eye',
        '4. Movement: Static, Pan, Tilt, Dolly, Track, Steadicam, Handheld, Crane, Drone',
        '5. Lens suggestion: Wide (14-35mm), Normal (40-60mm), Long (70mm+)',
        '6. Subject/Action: What we see and what happens',
        '7. Duration estimate (seconds)',
        '8. Notes: Special requirements, emotion, importance',
        '',
        'INCLUDE:',
        '- Master shots for geography',
        '- Coverage (over-shoulders, singles)',
        '- Insert shots',
        '- Establishing shots',
        '- Transitional shots',
        '',
        'For AI video generation, flag:',
        '- Complex movements needing attention',
        '- VFX integration points',
        '- Character consistency requirements'
      ],
      outputFormat: 'JSON with sceneShotLists array, statistics object (totalShots, averageShotsPerScene), artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['sceneShotLists'],
      properties: {
        sceneShotLists: { type: 'array' },
        statistics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'visual', 'shots']
}));

export const storyboardFrames = defineTask('storyboard-frames', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create storyboard frame prompts',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Storyboard Artist / AI Prompt Engineer',
      task: 'Create detailed image generation prompts for key storyboard frames',
      context: args,
      instructions: [
        'Select key moments for storyboarding:',
        '- Every major scene transition',
        '- Key dramatic moments',
        '- Action sequences (multiple frames)',
        '- Character introductions',
        '- Establishing shots',
        '- Climactic moments',
        '',
        'FOR EACH FRAME, create prompt with:',
        '',
        '1. SCENE CONTEXT:',
        '- Scene number, shot reference',
        '- What happens in this moment',
        '',
        '2. COMPOSITION:',
        '- Camera angle and height',
        '- Shot size',
        '- Subject placement (rule of thirds, etc.)',
        '- Depth of field',
        '',
        '3. TECHNICAL:',
        '- Lighting setup',
        '- Color temperature',
        '- Lens distortion (if any)',
        '',
        '4. AI PROMPTS (multiple platforms):',
        '- Midjourney prompt (with parameters)',
        '- DALL-E prompt (natural language)',
        '- Stable Diffusion prompt (with negative)',
        '',
        '5. STYLE ANCHORS:',
        '- Reference to style guide',
        '- Consistent style tokens',
        '- Quality modifiers'
      ],
      outputFormat: 'JSON with storyboardFrames array, frameCount number, artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['storyboardFrames'],
      properties: {
        storyboardFrames: { type: 'array' },
        frameCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'visual', 'storyboard']
}));

export const videoPrompts = defineTask('video-prompts', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create video generation prompts',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'AI Video Prompt Engineer',
      task: 'Create platform-agnostic video generation prompts for each scene',
      context: args,
      instructions: [
        'For each scene, create video generation prompts:',
        '',
        'PROMPT STRUCTURE:',
        '',
        '1. SCENE SETUP:',
        '- Environment/location description',
        '- Time of day, weather, atmosphere',
        '- Characters present (described)',
        '',
        '2. ACTION SEQUENCE:',
        '- What happens (step by step)',
        '- Character movements',
        '- Camera movement',
        '',
        '3. CAMERA DIRECTION:',
        '- Camera angle and movement',
        '- Shot transitions',
        '- Focal points',
        '',
        '4. TECHNICAL SPECS:',
        '- Aspect ratio (16:9, 2.39:1, etc.)',
        '- Duration (seconds)',
        '- Style (cinematic, documentary, etc.)',
        '',
        '5. PLATFORM-SPECIFIC VERSIONS:',
        '- Universal prompt (works across platforms)',
        '- Sora-optimized prompt',
        '- Runway-optimized prompt',
        '- Pika-optimized prompt',
        '- Kling-optimized prompt',
        '',
        'Include:',
        '- Style keywords for consistency',
        '- Negative prompts where applicable',
        '- Quality and aesthetic modifiers',
        '- Motion descriptions',
        '- Continuity notes for multi-shot scenes'
      ],
      outputFormat: 'JSON with sceneVideoPrompts array, totalDuration number, platformNotes object, artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['sceneVideoPrompts'],
      properties: {
        sceneVideoPrompts: { type: 'array' },
        totalDuration: { type: 'number' },
        platformNotes: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'visual', 'video']
}));

export const lookbookCreation = defineTask('lookbook-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create visual lookbook',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Visual Designer',
      task: 'Create comprehensive lookbook documenting the visual approach',
      context: args,
      instructions: [
        'Create a lookbook document that serves as:',
        '- Visual pitch document',
        '- Reference for production',
        '- Style guide for AI generation',
        '',
        'SECTIONS:',
        '',
        '1. VISUAL CONCEPT:',
        '- Opening statement of visual approach',
        '- Core visual themes',
        '- Color story',
        '',
        '2. MOOD BOARDS:',
        '- Overall film/show mood',
        '- Per-act mood progression',
        '- Key sequence moods',
        '',
        '3. CHARACTER LOOKS:',
        '- Visual approach per character',
        '- Wardrobe boards',
        '- Character color associations',
        '',
        '4. WORLD LOOKS:',
        '- Location mood boards',
        '- Environmental textures',
        '- Prop aesthetics',
        '',
        '5. KEY FRAMES:',
        '- Select storyboard frames organized by sequence',
        '- Visual progression through story',
        '',
        '6. REFERENCE IMAGES:',
        '- Film references with notes',
        '- Art/photo references',
        '- What we\'re NOT going for'
      ],
      outputFormat: 'JSON with lookbook object, markdownContent string, artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['lookbook'],
      properties: {
        lookbook: { type: 'object' },
        markdownContent: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'visual', 'lookbook']
}));

export const compileVisualPackage = defineTask('compile-visual-package', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compile visual production package',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Visual Package Compiler',
      task: 'Compile all visual materials into organized deliverable files',
      context: args,
      instructions: [
        'Create the following structure:',
        '',
        'visual/',
        '├── lookbook.md (style guide with references)',
        '├── style-guide.md',
        '├── shot-lists/',
        '│   ├── master-shot-list.md',
        '│   └── scene-XXX-shots.md',
        '├── storyboards/',
        '│   ├── storyboard-index.md',
        '│   └── act-X/',
        '│       └── scene-XXX-storyboard.md',
        '└── video-prompts/',
        '    ├── video-prompts-index.md',
        '    └── scene-XXX-video.md',
        '',
        'Each file should include:',
        '- Clear organization',
        '- All prompts ready for copy/paste',
        '- Reference to style guide',
        '- Platform-specific notes',
        '- Continuity annotations'
      ],
      outputFormat: 'JSON with files array, summary object, artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['files', 'summary', 'artifacts'],
      properties: {
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
  labels: ['agent', 'documentation', 'visual', 'compilation']
}));
