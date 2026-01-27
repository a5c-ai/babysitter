/**
 * @process film-tv-production/story-development
 * @description Develops a complete story from initial concept through detailed outline. Creates logline, treatment, beat sheet, and scene-by-scene outline for any format (feature, TV, short, commercial).
 * @inputs { concept: string, format: string, genre: string, targetDuration?: number, tone?: string, themes?: string[], outputDir?: string }
 * @outputs { success: boolean, story: object, artifacts: array }
 * @recommendedSkills SK-FTV-001 (logline-writing), SK-FTV-002 (treatment-writing), SK-FTV-012 (genre-analysis-film)
 * @recommendedAgents AG-FTV-005 (story-developer-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    concept,
    format,
    genre,
    targetDuration,
    tone,
    themes,
    outputDir = 'story-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Concept Refinement
  ctx.log('info', 'Refining concept into workable premise');
  const conceptResult = await ctx.task(conceptRefinementTask, {
    concept,
    format,
    genre,
    targetDuration,
    tone,
    themes
  });

  if (!conceptResult.success) {
    return {
      success: false,
      error: 'Concept refinement failed',
      details: conceptResult,
      metadata: { processId: 'film-tv-production/story-development', timestamp: startTime }
    };
  }
  artifacts.push(...(conceptResult.artifacts || []));

  // Task 2: Logline Creation
  ctx.log('info', 'Creating compelling logline');
  const loglineResult = await ctx.task(loglineCreationTask, {
    refinedPremise: conceptResult.premise,
    protagonist: conceptResult.protagonist,
    conflict: conceptResult.conflict,
    stakes: conceptResult.stakes,
    genre,
    format
  });
  artifacts.push(...(loglineResult.artifacts || []));

  // Task 3: Treatment Writing
  ctx.log('info', 'Writing narrative treatment');
  const treatmentResult = await ctx.task(treatmentWritingTask, {
    logline: loglineResult.primaryLogline,
    premise: conceptResult.premise,
    protagonist: conceptResult.protagonist,
    conflict: conceptResult.conflict,
    stakes: conceptResult.stakes,
    structure: conceptResult.structure,
    format,
    genre,
    tone,
    targetDuration
  });
  artifacts.push(...(treatmentResult.artifacts || []));

  // Task 4: Beat Sheet Creation
  ctx.log('info', 'Creating detailed beat sheet');
  const beatSheetResult = await ctx.task(beatSheetCreationTask, {
    treatment: treatmentResult.treatment,
    structure: conceptResult.structure,
    format,
    genre,
    targetDuration
  });
  artifacts.push(...(beatSheetResult.artifacts || []));

  // Task 5: Scene Outline
  ctx.log('info', 'Creating scene-by-scene outline');
  const outlineResult = await ctx.task(sceneOutlineTask, {
    beats: beatSheetResult.beats,
    treatment: treatmentResult.treatment,
    format,
    genre
  });
  artifacts.push(...(outlineResult.artifacts || []));

  // Task 6: Compile Story Package
  ctx.log('info', 'Compiling story development package');
  const packageResult = await ctx.task(compileStoryPackageTask, {
    concept,
    refinedPremise: conceptResult.premise,
    logline: loglineResult,
    treatment: treatmentResult.treatment,
    beats: beatSheetResult.beats,
    sceneOutline: outlineResult.scenes,
    format,
    genre,
    outputDir
  });
  artifacts.push(...(packageResult.artifacts || []));

  // Breakpoint: Story Review
  await ctx.breakpoint({
    question: `Story development complete for "${conceptResult.premise?.title || concept}". Logline, treatment, beat sheet, and outline generated. Review and approve?`,
    title: 'Story Development Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        logline: loglineResult.primaryLogline,
        sceneCount: outlineResult.sceneCount,
        estimatedPages: outlineResult.estimatedTotalPages,
        format,
        genre
      }
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    story: {
      premise: conceptResult.premise,
      protagonist: conceptResult.protagonist,
      logline: loglineResult,
      treatment: treatmentResult.treatment,
      beatSheet: beatSheetResult,
      outline: outlineResult
    },
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'film-tv-production/story-development',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task Definitions

export const conceptRefinementTask = defineTask('concept-refinement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Refine and expand initial concept',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Story Development Executive',
      task: 'Analyze and refine the story concept into a workable premise',
      context: args,
      instructions: [
        'Analyze the core concept for dramatic potential',
        'Identify the protagonist and their goal',
        'Define the central conflict and stakes',
        'Determine the appropriate structure for the format',
        'Identify genre conventions to embrace or subvert',
        'Define the emotional journey',
        'Propose the thematic through-line',
        'Suggest the world/setting requirements',
        'Note any format-specific considerations'
      ],
      outputFormat: 'JSON with success boolean, premise object, protagonist object, conflict object, stakes object, structure object, thematicCore string, genreElements array, artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'premise', 'protagonist', 'conflict', 'stakes', 'structure'],
      properties: {
        success: { type: 'boolean' },
        premise: { type: 'object' },
        protagonist: { type: 'object' },
        conflict: { type: 'object' },
        stakes: { type: 'object' },
        structure: { type: 'object' },
        thematicCore: { type: 'string' },
        genreElements: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'story', 'concept']
}));

export const loglineCreationTask = defineTask('logline-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create compelling logline',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Logline Specialist',
      task: 'Create a compelling, marketable logline that captures the story essence',
      context: args,
      instructions: [
        'Craft a single sentence (25-50 words) that hooks the reader',
        'Include: protagonist + inciting incident + goal + stakes + antagonist/obstacle',
        'Make it specific, not generic',
        'Convey the tone and genre',
        'Create urgency and intrigue',
        'Avoid clichés and vague language',
        'Provide 3 variations: punchy, descriptive, and high-concept',
        'Include the irony or unique hook'
      ],
      outputFormat: 'JSON with primaryLogline string, variations object (punchy, descriptive, highConcept), hookElement string, genreSignals array, artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['primaryLogline', 'variations'],
      properties: {
        primaryLogline: { type: 'string' },
        variations: { type: 'object' },
        hookElement: { type: 'string' },
        genreSignals: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'story', 'logline']
}));

export const treatmentWritingTask = defineTask('treatment-writing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write narrative treatment',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Treatment Writer',
      task: 'Write a compelling narrative treatment that tells the complete story',
      context: args,
      instructions: [
        'Write in present tense, third person',
        'Tell the story cinematically—show, dont tell',
        'Include major plot points, turning points, and climax',
        'Convey the emotional journey of the protagonist',
        'Describe key visual moments and set pieces',
        'Include important dialogue snippets where impactful',
        'Maintain the tone and genre throughout',
        'Structure by acts (or episodes for TV)',
        'Length: 2-3 pages for shorts, 5-10 pages for features',
        'End each act on a hook or turning point'
      ],
      outputFormat: 'JSON with treatment string (full markdown treatment), actBreakdowns array, setpieces array, wordCount number, artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['treatment', 'actBreakdowns'],
      properties: {
        treatment: { type: 'string' },
        actBreakdowns: { type: 'array' },
        setpieces: { type: 'array' },
        wordCount: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'story', 'treatment']
}));

export const beatSheetCreationTask = defineTask('beat-sheet-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create detailed beat sheet',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Story Structuralist',
      task: 'Create a comprehensive beat sheet with all major story beats',
      context: args,
      instructions: [
        'Use the appropriate beat sheet structure for the format',
        'Features: Save the Cat or three-act structure',
        'TV: Cold open, teaser, act structure with commercial breaks',
        'Number each beat with estimated page/time placement',
        'Include beat name, description, and function',
        'Note the emotional state of the protagonist at each beat',
        'Identify turning points and their impact',
        'Include B-story beats and how they intersect',
        'Note pacing: fast, slow, building',
        'Map the protagonists internal arc against external events'
      ],
      outputFormat: 'JSON with beats array (each with number, name, pageRange, description, function, protagonistState, pacing), structure object, turningPoints array, bStoryBeats array, artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['beats', 'structure'],
      properties: {
        beats: { type: 'array' },
        structure: { type: 'object' },
        turningPoints: { type: 'array' },
        bStoryBeats: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'story', 'beatsheet']
}));

export const sceneOutlineTask = defineTask('scene-outline', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create scene-by-scene outline',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Scene Architect',
      task: 'Break down the beat sheet into individual scenes with full detail',
      context: args,
      instructions: [
        'Break each beat into individual scenes',
        'For each scene define:',
        '- Scene number and slugline (INT/EXT, LOCATION, TIME)',
        '- Scene goal: What must be accomplished',
        '- Characters present',
        '- Key action/events',
        '- Conflict in the scene',
        '- Scene outcome: How does situation change',
        '- Emotional tone',
        '- Estimated length (pages/minutes)',
        'Ensure cause and effect between scenes',
        'Check for scene necessity',
        'Note any visual setpieces or important imagery',
        'Flag scenes that need special production considerations'
      ],
      outputFormat: 'JSON with scenes array (each with sceneNumber, slugline, beatReference, goal, characters array, keyEvents array, conflict, outcome, emotionalTone, estimatedPages, visualNotes, productionFlags array), sceneCount number, estimatedTotalPages number, locationSummary array, artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['scenes', 'sceneCount'],
      properties: {
        scenes: { type: 'array' },
        sceneCount: { type: 'number' },
        estimatedTotalPages: { type: 'number' },
        locationSummary: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'story', 'outline']
}));

export const compileStoryPackageTask = defineTask('compile-story-package', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compile story development package',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Story Package Compiler',
      task: 'Compile all story development materials into organized deliverable files',
      context: args,
      instructions: [
        'Create the following markdown files:',
        '1. logline.md - The primary logline and variations',
        '2. treatment.md - Full narrative treatment formatted for reading',
        '3. beat-sheet.md - Visual beat sheet with structure diagram',
        '4. outline.md - Complete scene-by-scene outline',
        'Each file should be:',
        '- Well-formatted with headers and sections',
        '- Include metadata (title, genre, format, version)',
        '- Be readable as standalone documents',
        'Also create a summary JSON with all key data',
        'Save all files to the output directory'
      ],
      outputFormat: 'JSON with files array (each with filename, path, content, description), summary object, artifacts array'
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
  labels: ['agent', 'documentation', 'story', 'compilation']
}));
