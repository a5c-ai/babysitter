/**
 * @process music-album-creation/song-composition
 * @description Creates a complete song with full lyrics (production notes), ultra-detailed style specification, and text-to-image cover art prompt
 * @inputs { persona?: object, albumConcept?: object, trackConcept?: object, songIdea?: string, outputDir?: string }
 * @outputs { success: boolean, song: object, lyricsPath: string, stylePath: string, coverPromptPath: string, artifacts: array }
 * @recommendedSkills SK-MAC-001 (lyric-writing), SK-MAC-002 (style-specification), SK-MAC-003 (cover-art-prompting), SK-MAC-010 (music-prompt-engineering)
 * @recommendedAgents AG-MAC-001 (lyricist-agent), AG-MAC-002 (music-producer-agent), AG-MAC-003 (visual-director-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    persona,
    albumConcept,
    trackConcept,
    songIdea,
    outputDir = 'song-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  const artistName = persona?.identity?.artistName || 'Unknown Artist';
  const songTitle = trackConcept?.title || 'New Song';
  const trackNumber = trackConcept?.trackNumber || 1;

  // Task 1: Develop Song Concept (if not provided or needs expansion)
  ctx.log('info', `Developing song concept for "${songTitle}"`);
  const conceptResult = await ctx.task(songConceptTask, {
    persona,
    albumConcept,
    trackConcept,
    songIdea,
    outputDir
  });

  if (!conceptResult.success) {
    return {
      success: false,
      error: 'Song concept development failed',
      details: conceptResult,
      metadata: { processId: 'music-album-creation/song-composition', timestamp: startTime }
    };
  }

  artifacts.push(...(conceptResult.artifacts || []));

  // Task 2: Write Full Lyrics with Production Notes
  ctx.log('info', 'Writing full lyrics with production annotations');
  const lyricsResult = await ctx.task(lyricsCompositionTask, {
    persona,
    albumConcept,
    songConcept: conceptResult.concept,
    outputDir
  });

  artifacts.push(...(lyricsResult.artifacts || []));

  // Task 3: Create Ultra-Detailed Style Specification
  ctx.log('info', 'Creating ultra-detailed style specification');
  const styleResult = await ctx.task(styleSpecificationTask, {
    persona,
    albumConcept,
    songConcept: conceptResult.concept,
    lyrics: lyricsResult.lyrics,
    outputDir
  });

  artifacts.push(...(styleResult.artifacts || []));

  // Task 4: Generate Cover Art Prompt
  ctx.log('info', 'Generating cover art prompt for text-to-image');
  const coverResult = await ctx.task(coverArtPromptTask, {
    persona,
    albumConcept,
    songConcept: conceptResult.concept,
    lyrics: lyricsResult.lyrics,
    style: styleResult.style,
    outputDir
  });

  artifacts.push(...(coverResult.artifacts || []));

  // Task 5: Compile Song Package
  ctx.log('info', 'Compiling complete song package');
  const packageResult = await ctx.task(compileSongPackageTask, {
    persona,
    albumConcept,
    songConcept: conceptResult.concept,
    lyrics: lyricsResult.lyrics,
    style: styleResult.style,
    coverPrompt: coverResult.coverPrompt,
    trackNumber,
    outputDir
  });

  artifacts.push(...(packageResult.artifacts || []));

  // Breakpoint: Review song
  await ctx.breakpoint({
    question: `Song "${conceptResult.concept.title}" complete. Lyrics, style spec, and cover art prompt generated. Review and approve?`,
    title: 'Song Composition Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        songTitle: conceptResult.concept.title,
        artistName,
        genre: styleResult.style?.primaryGenre,
        bpm: styleResult.style?.bpm,
        lyricWordCount: lyricsResult.lyrics?.wordCount,
        structureSections: lyricsResult.lyrics?.sections?.length
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    song: {
      concept: conceptResult.concept,
      lyrics: lyricsResult.lyrics,
      style: styleResult.style,
      coverPrompt: coverResult.coverPrompt
    },
    lyricsPath: packageResult.lyricsPath,
    stylePath: packageResult.stylePath,
    coverPromptPath: packageResult.coverPromptPath,
    aiGenerationPrompt: packageResult.aiGenerationPrompt,
    artifacts,
    duration,
    metadata: {
      processId: 'music-album-creation/song-composition',
      timestamp: startTime,
      outputDir,
      trackNumber
    }
  };
}

// Task 1: Song Concept
export const songConceptTask = defineTask('song-concept', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop detailed song concept',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'songwriter and song concept developer',
      task: 'Develop a detailed concept for the song that will guide lyrics and production',
      context: args,
      instructions: [
        'Expand or create the song concept with full detail',
        'Define the songs core message or story',
        'Identify the emotional journey within the song',
        'Define the songs perspective (first person, third person, etc.)',
        'Identify any characters or subjects in the song',
        'Define the setting or world of the song',
        'Identify key imagery and metaphors to use',
        'Define the songs tone (ironic, sincere, playful, heavy, etc.)',
        'Consider how this song fits in the album context if applicable',
        'Define what makes this song unique',
        'Finalize the song title'
      ],
      outputFormat: 'JSON with success boolean, concept object containing title, coreMessage, emotionalJourney, perspective, characters array if any, setting, keyImagery array, metaphors array, tone, albumFit, uniqueAngle, artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'concept'],
      properties: {
        success: { type: 'boolean' },
        concept: {
          type: 'object',
          required: ['title', 'coreMessage', 'emotionalJourney'],
          properties: {
            title: { type: 'string' },
            coreMessage: { type: 'string' },
            emotionalJourney: { type: 'string' },
            perspective: { type: 'string' },
            characters: { type: 'array', items: { type: 'string' } },
            setting: { type: 'string' },
            keyImagery: { type: 'array', items: { type: 'string' } },
            metaphors: { type: 'array', items: { type: 'string' } },
            tone: { type: 'string' },
            albumFit: { type: 'string' },
            uniqueAngle: { type: 'string' }
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
  labels: ['agent', 'song', 'concept', 'development']
}));

// Task 2: Lyrics Composition
export const lyricsCompositionTask = defineTask('lyrics-composition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write full lyrics with production notes',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'professional lyricist who writes for AI music generation platforms',
      task: 'Write complete song lyrics with detailed structural and production annotations',
      context: args,
      instructions: [
        'Write full lyrics for the song based on the concept',
        'Use structural markers: [Intro], [Verse 1], [Pre-Chorus], [Chorus], [Verse 2], [Bridge], [Outro], etc.',
        'Embed production/performance notes in brackets throughout:',
        '  - [whispered] - for soft, intimate delivery',
        '  - [spoken word] - for spoken rather than sung sections',
        '  - [belt] - for powerful, full-voice delivery',
        '  - [falsetto] - for higher register singing',
        '  - [building] or [crescendo] - for building intensity',
        '  - [soft] or [gentle] - for tender moments',
        '  - [raw] or [emotional] - for vulnerable delivery',
        '  - [ad-lib] - for improvised/free sections',
        '  - [harmony] - where harmonies should enter',
        '  - [call and response] - for interactive sections',
        '  - [fade] - for fading sections',
        'Maintain the artists voice and persona throughout',
        'Incorporate album motifs and imagery where appropriate',
        'Create memorable hooks and phrases',
        'Ensure rhyme scheme is intentional (can be loose or tight based on style)',
        'Map emotional dynamics through the lyrics',
        'Consider how lyrics will sound when sung (syllables, flow)',
        'Include any relevant notes for specific lines'
      ],
      outputFormat: 'JSON with lyrics object containing fullText (complete lyrics as string with all markers), sections array (each with name, lineCount, keyLines), hooks array, wordCount number, rhymeScheme string, emotionalArc string, productionNotes string summarizing key directions, artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['lyrics'],
      properties: {
        lyrics: {
          type: 'object',
          required: ['fullText', 'sections'],
          properties: {
            fullText: { type: 'string' },
            sections: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  lineCount: { type: 'number' },
                  keyLines: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            hooks: { type: 'array', items: { type: 'string' } },
            wordCount: { type: 'number' },
            rhymeScheme: { type: 'string' },
            emotionalArc: { type: 'string' },
            productionNotes: { type: 'string' }
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
  labels: ['agent', 'song', 'lyrics', 'composition']
}));

// Task 3: Style Specification
export const styleSpecificationTask = defineTask('style-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create ultra-detailed style specification',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'music producer and AI music generation prompt engineer',
      task: 'Create an ultra-detailed style specification for the song optimized for AI music platforms like Suno and Udio',
      context: args,
      instructions: [
        'GENRES: Define primary genre, secondary genres, and specific subgenres',
        'TEMPO: Specify exact or range BPM, tempo feel (driving, laid-back, swung, straight)',
        'KEY/MODE: Suggest key and mode if relevant (major, minor, mixolydian, etc.)',
        'INSTRUMENTATION: List all instruments in detail:',
        '  - Drums/percussion specifics (808s, live drums, electronic, brushes, etc.)',
        '  - Bass type (synth bass, upright, picked electric, etc.)',
        '  - Keys/synths (analog, digital, specific synth references)',
        '  - Guitars (acoustic, electric clean, distorted, specific pedals)',
        '  - Additional instruments (strings, brass, etc.)',
        'VOCALS: Ultra-detailed vocal direction:',
        '  - Vocal style (breathy, raspy, clear, nasal, etc.)',
        '  - Register (bass, baritone, tenor, alto, soprano)',
        '  - Techniques used (vibrato, runs, growls, whisper, etc.)',
        '  - Emotional quality (vulnerable, confident, aggressive, etc.)',
        '  - Influence references (sounds like X meets Y)',
        'PRODUCTION: Detailed production aesthetic:',
        '  - Era reference (2020s, 90s, 80s, etc.)',
        '  - Mix character (wet/dry, wide/narrow, bright/dark)',
        '  - Effects (reverb type, delay, distortion, etc.)',
        '  - Lo-fi vs polished, bedroom vs studio sound',
        'REFERENCE TRACKS: Provide 3-5 specific songs that exemplify different elements',
        '  - Include song name, artist, and what element to reference',
        'MOOD/ENERGY: Define overall mood, energy level 1-10, dynamics',
        'AI PLATFORM PROMPT: Create a condensed single-paragraph prompt optimized for Suno/Udio'
      ],
      outputFormat: 'JSON with style object containing primaryGenre, secondaryGenres array, subgenres array, bpm (number or range), tempoFeel, key, mode, instrumentation object (drums, bass, keys, guitars, additional array), vocals object (style, register, techniques array, emotionalQuality, influenceRefs array), production object (era, mixCharacter, effects array, overallSound), referenceTracks array (each with song, artist, forElement), mood, energyLevel 1-10, dynamics, aiPlatformPrompt string, artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['style'],
      properties: {
        style: {
          type: 'object',
          required: ['primaryGenre', 'bpm', 'instrumentation', 'vocals', 'referenceTracks', 'aiPlatformPrompt'],
          properties: {
            primaryGenre: { type: 'string' },
            secondaryGenres: { type: 'array', items: { type: 'string' } },
            subgenres: { type: 'array', items: { type: 'string' } },
            bpm: { type: ['number', 'string'] },
            tempoFeel: { type: 'string' },
            key: { type: 'string' },
            mode: { type: 'string' },
            instrumentation: {
              type: 'object',
              properties: {
                drums: { type: 'string' },
                bass: { type: 'string' },
                keys: { type: 'string' },
                guitars: { type: 'string' },
                additional: { type: 'array', items: { type: 'string' } }
              }
            },
            vocals: {
              type: 'object',
              properties: {
                style: { type: 'string' },
                register: { type: 'string' },
                techniques: { type: 'array', items: { type: 'string' } },
                emotionalQuality: { type: 'string' },
                influenceRefs: { type: 'array', items: { type: 'string' } }
              }
            },
            production: {
              type: 'object',
              properties: {
                era: { type: 'string' },
                mixCharacter: { type: 'string' },
                effects: { type: 'array', items: { type: 'string' } },
                overallSound: { type: 'string' }
              }
            },
            referenceTracks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  song: { type: 'string' },
                  artist: { type: 'string' },
                  forElement: { type: 'string' }
                }
              }
            },
            mood: { type: 'string' },
            energyLevel: { type: 'number' },
            dynamics: { type: 'string' },
            aiPlatformPrompt: { type: 'string' }
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
  labels: ['agent', 'song', 'style', 'specification', 'production']
}));

// Task 4: Cover Art Prompt
export const coverArtPromptTask = defineTask('cover-art-prompt', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate cover art prompt',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'visual prompt engineer specializing in Midjourney and DALL-E for music artwork',
      task: 'Create a detailed text-to-image prompt for the song cover artwork',
      context: args,
      instructions: [
        'Create a visual concept that captures the songs essence',
        'Translate the sonic and lyrical mood into visual language',
        'Use the artists visual aesthetic as a foundation',
        'Structure the prompt for Midjourney/DALL-E optimization:',
        '  1. Subject/Scene - what is depicted',
        '  2. Art Style - photography, illustration, painting, 3D, etc.',
        '  3. Art Movement/Influence - if applicable',
        '  4. Lighting - type, direction, quality',
        '  5. Color palette - specific colors or mood',
        '  6. Composition - framing, perspective',
        '  7. Atmosphere/Mood - emotional quality',
        '  8. Technical modifiers - 4K, detailed, cinematic, etc.',
        'Create the main prompt as a single optimized paragraph',
        'Provide 2-3 alternative variations',
        'Include negative prompts (what to avoid)',
        'Specify aspect ratio (1:1 for standard single cover)',
        'Consider how it will look as a small thumbnail',
        'Ensure visual-sonic alignment'
      ],
      outputFormat: 'JSON with coverPrompt object containing concept (brief description), mainPrompt (full optimized prompt string), artStyle, artInfluences array, lighting, colorPalette, composition, atmosphere, technicalModifiers array, variations array (2-3 alternative prompts), negativePrompt, aspectRatio, thumbnailNotes, artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['coverPrompt'],
      properties: {
        coverPrompt: {
          type: 'object',
          required: ['concept', 'mainPrompt'],
          properties: {
            concept: { type: 'string' },
            mainPrompt: { type: 'string' },
            artStyle: { type: 'string' },
            artInfluences: { type: 'array', items: { type: 'string' } },
            lighting: { type: 'string' },
            colorPalette: { type: 'array', items: { type: 'string' } },
            composition: { type: 'string' },
            atmosphere: { type: 'string' },
            technicalModifiers: { type: 'array', items: { type: 'string' } },
            variations: { type: 'array', items: { type: 'string' } },
            negativePrompt: { type: 'string' },
            aspectRatio: { type: 'string' },
            thumbnailNotes: { type: 'string' }
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
  labels: ['agent', 'song', 'cover', 'visual', 'prompt']
}));

// Task 5: Compile Song Package
export const compileSongPackageTask = defineTask('compile-song-package', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compile complete song package',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'documentation specialist for music production',
      task: 'Compile all song elements into properly formatted markdown files',
      context: args,
      instructions: [
        'Create three markdown files:',
        '',
        '1. LYRICS FILE (track-XX-song-title.md):',
        '   - Header with song title, artist, album, track number',
        '   - Full lyrics with all structural and production annotations',
        '   - Production notes section at the end',
        '',
        '2. STYLE FILE (track-XX-song-title-style.md):',
        '   - Header with song title',
        '   - Genre classification section',
        '   - Technical specifications section (BPM, key, etc.)',
        '   - Instrumentation section',
        '   - Vocal direction section',
        '   - Production aesthetics section',
        '   - Reference tracks section',
        '   - Mood and energy section',
        '   - AI generation prompt at the end (ready to copy-paste)',
        '',
        '3. COVER PROMPT FILE (track-XX-song-title-cover.md):',
        '   - Header with song title',
        '   - Concept description',
        '   - Main prompt (in code block for easy copy)',
        '   - Style elements breakdown',
        '   - Variations section',
        '   - Negative prompts',
        '   - Technical notes',
        '',
        'Use the track number for file naming (e.g., track-01-song-name.md)',
        'Save all files to the output directory',
        'Return paths to all created files',
        'Also create a condensed AI generation prompt that combines style + lyrics direction'
      ],
      outputFormat: 'JSON with lyricsPath string, stylePath string, coverPromptPath string, aiGenerationPrompt string (ready-to-use Suno/Udio prompt), artifacts array containing all created files'
    },
    outputSchema: {
      type: 'object',
      required: ['lyricsPath', 'stylePath', 'coverPromptPath', 'aiGenerationPrompt', 'artifacts'],
      properties: {
        lyricsPath: { type: 'string' },
        stylePath: { type: 'string' },
        coverPromptPath: { type: 'string' },
        aiGenerationPrompt: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'documentation', 'song', 'compilation', 'files']
}));
