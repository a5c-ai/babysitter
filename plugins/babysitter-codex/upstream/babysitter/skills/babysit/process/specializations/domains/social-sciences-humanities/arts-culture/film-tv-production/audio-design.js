/**
 * @process film-tv-production/audio-design
 * @description Creates comprehensive audio design including music cues, sound design notes, and score direction. Integrates with music-album-creation specialization for original score composition.
 * @inputs { screenplay: object, scenes: array, genre: string, tone: string, createOriginalScore?: boolean, outputDir?: string }
 * @outputs { success: boolean, audioDesign: object, artifacts: array }
 * @recommendedSkills SK-FTV-010 (sound-design-direction)
 * @recommendedAgents AG-FTV-006 (production-coordinator-agent)
 * @crossSpecialization music-album-creation (for original score)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    screenplay,
    scenes,
    genre,
    tone,
    createOriginalScore = false,
    outputDir = 'audio-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Audio Approach
  ctx.log('info', 'Establishing audio design approach');
  const approachResult = await ctx.task(audioApproach, {
    storyContext: screenplay,
    genre,
    tone,
    format: screenplay.format
  });
  artifacts.push(...(approachResult.artifacts || []));

  // Task 2: Music Spotting
  ctx.log('info', 'Spotting music cues');
  const musicResult = await ctx.task(musicSpotting, {
    scenes,
    musicDirection: approachResult.musicDirection,
    genre,
    format: screenplay.format
  });
  artifacts.push(...(musicResult.artifacts || []));

  // Task 3: Sound Design Spotting
  ctx.log('info', 'Spotting sound design elements');
  const soundResult = await ctx.task(soundDesignSpotting, {
    scenes,
    soundDesignStyle: approachResult.soundDesign,
    locations: screenplay.locations,
    genre
  });
  artifacts.push(...(soundResult.artifacts || []));

  // Task 4: Score Composition Request (if original score requested)
  let scoreResult = null;
  if (createOriginalScore) {
    ctx.log('info', 'Generating score composition request for music-album-creation');
    scoreResult = await ctx.task(scoreCompositionRequest, {
      musicCues: musicResult.musicCues,
      musicDirection: approachResult.musicDirection,
      themes: approachResult.musicDirection?.themes,
      genre
    });
    artifacts.push(...(scoreResult.artifacts || []));
  }

  // Task 5: Compile Audio Package
  ctx.log('info', 'Compiling audio design package');
  const compileResult = await ctx.task(compileAudioPackage, {
    audioApproach: approachResult,
    musicCues: musicResult.musicCues,
    soundDesign: soundResult.sceneSoundDesign,
    scoreRequest: scoreResult,
    outputDir
  });
  artifacts.push(...(compileResult.artifacts || []));

  // Breakpoint: Audio Review
  await ctx.breakpoint({
    question: `Audio design complete with ${musicResult.summary?.totalCues || 0} music cues and ${soundResult.sceneSoundDesign?.length || 0} scenes with sound design. ${createOriginalScore ? 'Score composition request ready for music-album-creation. ' : ''}Review and approve?`,
    title: 'Audio Design Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        musicCues: musicResult.summary?.totalCues,
        totalMusicDuration: musicResult.summary?.totalMusicDuration,
        scenesWithSoundDesign: soundResult.sceneSoundDesign?.length,
        originalScoreRequested: createOriginalScore
      }
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    audioDesign: {
      approach: approachResult,
      musicCues: musicResult.musicCues,
      soundDesign: soundResult.sceneSoundDesign,
      scoreRequest: scoreResult
    },
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'film-tv-production/audio-design',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task Definitions

export const audioApproach = defineTask('audio-approach', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish audio design approach',
  agent: {
    name: 'production-coordinator-agent',
    skills: ['SK-FTV-010'],
    prompt: {
      role: 'Sound Designer / Music Supervisor',
      task: 'Establish comprehensive audio design philosophy for the production',
      context: args,
      instructions: [
        'Define the complete audio approach:',
        '',
        '1. OVERALL SOUND PHILOSOPHY:',
        '- Naturalistic vs. stylized',
        '- Diegetic/non-diegetic balance',
        '- Silence as a tool',
        '- Audio POV approach',
        '',
        '2. MUSIC DIRECTION:',
        '- Score style (orchestral, electronic, hybrid, etc.)',
        '- Musical themes and leitmotifs',
        '- Source music approach',
        '- Music density (wall-to-wall vs. selective)',
        '- Temp track references',
        '',
        '3. SOUND DESIGN STYLE:',
        '- Environmental ambience approach',
        '- Sound effects style (realistic vs. hyperreal)',
        '- Signature sounds',
        '- Sonic palette',
        '',
        '4. DIALOGUE:',
        '- ADR/loop approach',
        '- Vocalization style',
        '- Voice-over treatment',
        '',
        '5. MIXING PHILOSOPHY:',
        '- Frequency spectrum priorities',
        '- Dynamic range approach',
        '- Surround/spatial audio',
        '',
        'Include references to films/shows for audio approach'
      ],
      outputFormat: 'JSON with audioPhilosophy object, musicDirection object, soundDesign object, dialogue object, mixingPhilosophy object, artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['audioPhilosophy', 'musicDirection', 'soundDesign'],
      properties: {
        audioPhilosophy: { type: 'object' },
        musicDirection: { type: 'object' },
        soundDesign: { type: 'object' },
        dialogue: { type: 'object' },
        mixingPhilosophy: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'audio', 'approach']
}));

export const musicSpotting = defineTask('music-spotting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Spot music cues',
  agent: {
    name: 'production-coordinator-agent',
    skills: ['SK-FTV-010'],
    prompt: {
      role: 'Music Supervisor / Composer',
      task: 'Create comprehensive music cue sheet spotting all musical moments',
      context: args,
      instructions: [
        'Spot music throughout the production:',
        '',
        'FOR EACH CUE:',
        '- Cue number (M1, M2, etc.)',
        '- Scene reference',
        '- Timecode in/out',
        '- Duration',
        '- Cue name',
        '- Type: Score, Source, Source-Score',
        '- Mood/emotion',
        '- Thematic material to use',
        '- Instrumentation',
        '- Dynamic arc',
        '- Hit points (sync moments)',
        '- Transition in/out',
        '',
        'CONSIDER:',
        '- When music should enter/exit',
        '- Music-free scenes (why?)',
        '- Scene transitions',
        '- Montages',
        '- Action sequences',
        '- Emotional peaks',
        '- Establishing moments',
        '',
        'Note source music needs (songs, radio, etc.)',
        'Flag cues that need special attention',
        '',
        'Include AI music prompts (Suno/Udio) for each cue'
      ],
      outputFormat: 'JSON with musicCues array, sourceMusicNeeds array, summary object, artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['musicCues', 'summary'],
      properties: {
        musicCues: { type: 'array' },
        sourceMusicNeeds: { type: 'array' },
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'audio', 'music']
}));

export const soundDesignSpotting = defineTask('sound-design-spotting', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Spot sound design elements',
  agent: {
    name: 'production-coordinator-agent',
    skills: ['SK-FTV-010'],
    prompt: {
      role: 'Sound Designer',
      task: 'Create comprehensive sound design spotting for all scenes',
      context: args,
      instructions: [
        'For each scene, specify:',
        '',
        '1. AMBIENCE/BACKGROUNDS:',
        '- Environmental bed (location atmosphere)',
        '- Room tone',
        '- Weather',
        '- Crowd/walla',
        '',
        '2. SOUND EFFECTS:',
        '- Hard effects (doors, impacts, etc.)',
        '- Vehicles',
        '- Weapons',
        '- Props',
        '- Technology',
        '',
        '3. FOLEY:',
        '- Footsteps (surface type)',
        '- Cloth/movement',
        '- Props handling',
        '',
        '4. DESIGNED SOUNDS:',
        '- Stylized/surreal elements',
        '- Transitions',
        '- Emotional punctuation',
        '- Genre-specific (horror stingers, sci-fi tech, etc.)',
        '',
        '5. SPECIAL REQUIREMENTS:',
        '- Silence moments',
        '- Subjective audio (POV)',
        '- Slow motion audio',
        '- Flashback treatment',
        '',
        'Note sync points and intensity levels'
      ],
      outputFormat: 'JSON with sceneSoundDesign array, signatureSounds array, artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['sceneSoundDesign'],
      properties: {
        sceneSoundDesign: { type: 'array' },
        signatureSounds: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'audio', 'sound-design']
}));

export const scoreCompositionRequest = defineTask('score-composition-request', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate score composition request',
  agent: {
    name: 'production-coordinator-agent',
    skills: ['SK-FTV-010'],
    prompt: {
      role: 'Music Supervisor',
      task: 'Generate a request package for the music-album-creation specialization to compose an original score',
      context: args,
      instructions: [
        'Create a score composition request package compatible with',
        'the music-album-creation specialization:',
        '',
        '1. SCORE ALBUM CONCEPT:',
        '- Album title (score title)',
        '- Overall style and genre',
        '- Instrumentation palette',
        '- Emotional arc of the score',
        '',
        '2. TRACK LIST (from music cues):',
        '- Each cue becomes a "song" in the album',
        '- Track name from cue name',
        '- Duration from cue duration',
        '- Style specification per track',
        '- Mood and tempo',
        '',
        '3. THEMATIC MATERIAL:',
        '- Main theme requirements',
        '- Character themes',
        '- Motifs and their usage',
        '- How themes develop/transform',
        '',
        '4. SUNO/UDIO PROMPTS:',
        '- Create AI music generation prompts per cue',
        '- Style tags',
        '- Genre tags',
        '- Instrumentation tags',
        '- Mood descriptors',
        '',
        'Format for direct handoff to music-album-creation process'
      ],
      outputFormat: 'JSON with scoreAlbum object, themes array, tracks array, musicAlbumCreationInputs object, artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['scoreAlbum', 'tracks'],
      properties: {
        scoreAlbum: { type: 'object' },
        themes: { type: 'array' },
        tracks: { type: 'array' },
        musicAlbumCreationInputs: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'audio', 'score', 'integration']
}));

export const compileAudioPackage = defineTask('compile-audio-package', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compile audio design package',
  agent: {
    name: 'production-coordinator-agent',
    skills: ['SK-FTV-010'],
    prompt: {
      role: 'Audio Package Compiler',
      task: 'Compile all audio design materials into organized deliverables',
      context: args,
      instructions: [
        'Create the following structure:',
        '',
        'audio/',
        '├── audio-approach.md',
        '├── music-cues.md',
        '├── sound-design.md',
        '└── score/ (if original score)',
        '    └── score-request.json',
        '',
        'Each file should:',
        '- Be production-ready',
        '- Include all spotting notes',
        '- Be formatted for audio team use',
        '- Include AI music prompts where applicable'
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
  labels: ['agent', 'documentation', 'audio', 'compilation']
}));
