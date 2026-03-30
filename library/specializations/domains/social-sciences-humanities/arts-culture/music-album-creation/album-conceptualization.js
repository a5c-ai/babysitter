/**
 * @process music-album-creation/album-conceptualization
 * @description Creates a comprehensive album concept including title, themes, motifs, track sequencing, sonic palette, and visual direction
 * @inputs { persona: object, albumIdea?: string, trackCount?: number, outputDir?: string }
 * @outputs { success: boolean, albumConcept: object, artifacts: array }
 * @recommendedSkills SK-MAC-005 (album-conceptualization), SK-MAC-009 (track-sequencing), SK-MAC-006 (genre-analysis)
 * @recommendedAgents AG-MAC-005 (album-curator-agent), AG-MAC-002 (music-producer-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    persona,
    albumIdea,
    trackCount = 10,
    outputDir = 'album-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  const artistName = persona?.identity?.artistName || 'Unknown Artist';

  // Task 1: Generate Album Core Concept
  ctx.log('info', `Generating album core concept for ${artistName}`);
  const coreConceptResult = await ctx.task(coreConceptTask, {
    persona,
    albumIdea,
    trackCount,
    outputDir
  });

  if (!coreConceptResult.success) {
    return {
      success: false,
      error: 'Core concept generation failed',
      details: coreConceptResult,
      metadata: { processId: 'music-album-creation/album-conceptualization', timestamp: startTime }
    };
  }

  artifacts.push(...(coreConceptResult.artifacts || []));

  // Task 2: Develop Motifs and Recurring Elements
  ctx.log('info', 'Developing album motifs and recurring elements');
  const motifsResult = await ctx.task(motifsElementsTask, {
    persona,
    coreConcept: coreConceptResult.concept,
    outputDir
  });

  artifacts.push(...(motifsResult.artifacts || []));

  // Task 3: Design Sonic Palette
  ctx.log('info', 'Designing sonic palette and production direction');
  const sonicPaletteResult = await ctx.task(sonicPaletteTask, {
    persona,
    coreConcept: coreConceptResult.concept,
    motifs: motifsResult.motifs,
    outputDir
  });

  artifacts.push(...(sonicPaletteResult.artifacts || []));

  // Task 4: Map Narrative Arc and Emotional Journey
  ctx.log('info', 'Mapping narrative arc across the album');
  const narrativeArcResult = await ctx.task(narrativeArcTask, {
    persona,
    coreConcept: coreConceptResult.concept,
    trackCount,
    outputDir
  });

  artifacts.push(...(narrativeArcResult.artifacts || []));

  // Task 5: Create Track Sequencing Plan
  ctx.log('info', 'Creating track sequencing and song concepts');
  const sequencingResult = await ctx.task(trackSequencingTask, {
    persona,
    coreConcept: coreConceptResult.concept,
    motifs: motifsResult.motifs,
    sonicPalette: sonicPaletteResult.palette,
    narrativeArc: narrativeArcResult.arc,
    trackCount,
    outputDir
  });

  artifacts.push(...(sequencingResult.artifacts || []));

  // Task 6: Define Visual Direction
  ctx.log('info', 'Defining album visual direction');
  const visualDirectionResult = await ctx.task(visualDirectionTask, {
    persona,
    coreConcept: coreConceptResult.concept,
    motifs: motifsResult.motifs,
    outputDir
  });

  artifacts.push(...(visualDirectionResult.artifacts || []));

  // Task 7: Compile Album Concept Document
  ctx.log('info', 'Compiling comprehensive album concept document');
  const compiledResult = await ctx.task(compileAlbumConceptTask, {
    persona,
    coreConcept: coreConceptResult.concept,
    motifs: motifsResult.motifs,
    sonicPalette: sonicPaletteResult.palette,
    narrativeArc: narrativeArcResult.arc,
    trackSequencing: sequencingResult.sequencing,
    visualDirection: visualDirectionResult.visual,
    outputDir
  });

  artifacts.push(...(compiledResult.artifacts || []));

  // Breakpoint: Review album concept
  await ctx.breakpoint({
    question: `Album concept "${coreConceptResult.concept.title}" for ${artistName} complete with ${trackCount} tracks planned. Review and approve?`,
    title: 'Album Concept Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        albumTitle: coreConceptResult.concept.title,
        artistName,
        theme: coreConceptResult.concept.centralTheme,
        trackCount,
        motifsCount: motifsResult.motifs?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    albumConcept: {
      coreConcept: coreConceptResult.concept,
      motifs: motifsResult.motifs,
      sonicPalette: sonicPaletteResult.palette,
      narrativeArc: narrativeArcResult.arc,
      trackSequencing: sequencingResult.sequencing,
      visualDirection: visualDirectionResult.visual
    },
    albumConceptDocPath: compiledResult.albumConceptDocPath,
    trackConcepts: sequencingResult.sequencing.tracks,
    artifacts,
    duration,
    metadata: {
      processId: 'music-album-creation/album-conceptualization',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Core Concept
export const coreConceptTask = defineTask('core-concept', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate album core concept',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'album conceptualizer and creative director for musical projects',
      task: 'Create the core concept for a cohesive album',
      context: args,
      instructions: [
        'Generate a compelling album title that fits the artist persona',
        'Define the central theme or message of the album',
        'Create a high-level concept statement (2-3 sentences)',
        'Identify the albums place in the artists discography arc',
        'Define the target emotional impact on listeners',
        'Consider how the concept aligns with the artists voice',
        'Identify inspirations (other albums, films, books, events)',
        'Define what makes this album unique and necessary',
        'Consider the cultural/temporal context of the album',
        'Define the albums "thesis" - the core idea to explore'
      ],
      outputFormat: 'JSON with success boolean, concept object containing title, centralTheme, conceptStatement, discographyContext, emotionalImpact, inspirations, uniqueAngle, culturalContext, thesis, artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'concept'],
      properties: {
        success: { type: 'boolean' },
        concept: {
          type: 'object',
          required: ['title', 'centralTheme', 'conceptStatement'],
          properties: {
            title: { type: 'string' },
            centralTheme: { type: 'string' },
            conceptStatement: { type: 'string' },
            discographyContext: { type: 'string' },
            emotionalImpact: { type: 'string' },
            inspirations: { type: 'array', items: { type: 'string' } },
            uniqueAngle: { type: 'string' },
            culturalContext: { type: 'string' },
            thesis: { type: 'string' }
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
  labels: ['agent', 'album', 'concept', 'music']
}));

// Task 2: Motifs and Elements
export const motifsElementsTask = defineTask('motifs-elements', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop album motifs and recurring elements',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'thematic analyst and music composer focusing on album cohesion',
      task: 'Create the motifs, recurring elements, and thematic building blocks for the album',
      context: args,
      instructions: [
        'Identify 4-6 key lyrical motifs (recurring words, phrases, images)',
        'Define 3-4 musical motifs (melodic phrases, chord progressions, sounds)',
        'Create a symbol glossary for the album (recurring imagery)',
        'Define character archetypes if the album has narrative elements',
        'Identify sonic signatures that tie tracks together',
        'Define production elements that recur throughout',
        'Create a "vocabulary" specific to this album',
        'Identify callbacks and references between tracks',
        'Define atmosphere elements that create cohesion',
        'Note which motifs appear in which track positions'
      ],
      outputFormat: 'JSON with motifs array (each with name, type, description, occurrenceStrategy), musicalMotifs array, symbolGlossary object, characterArchetypes array if any, sonicSignatures array, productionElements array, albumVocabulary array, callbacks array, atmosphereElements array, artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['motifs'],
      properties: {
        motifs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              description: { type: 'string' },
              occurrenceStrategy: { type: 'string' }
            }
          }
        },
        musicalMotifs: { type: 'array' },
        symbolGlossary: { type: 'object' },
        characterArchetypes: { type: 'array' },
        sonicSignatures: { type: 'array' },
        productionElements: { type: 'array' },
        albumVocabulary: { type: 'array' },
        callbacks: { type: 'array' },
        atmosphereElements: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'album', 'motifs', 'elements', 'cohesion']
}));

// Task 3: Sonic Palette
export const sonicPaletteTask = defineTask('sonic-palette', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design sonic palette and production direction',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'music producer and sound designer specializing in album production',
      task: 'Define the comprehensive sonic palette and production direction for the album',
      context: args,
      instructions: [
        'Define the primary genre and genre fusions for the album',
        'Create an instrumentation palette (core instruments, featured instruments)',
        'Define the production aesthetic (lo-fi, polished, raw, etc.)',
        'Specify the drum/rhythm approach across the album',
        'Define synth/electronic elements palette',
        'Specify the vocal production approach',
        'Define the mix aesthetic (wet/dry, wide/narrow, vintage/modern)',
        'Create a reference track list for overall album sound (5-10 tracks)',
        'Define what sounds are intentionally excluded',
        'Specify BPM range and tempo variations across the album',
        'Define key/mode preferences for the album'
      ],
      outputFormat: 'JSON with palette object containing genreFusion, instrumentationCore, instrumentationFeatured, productionAesthetic, rhythmApproach, synthPalette, vocalProduction, mixAesthetic, referenceTracks array, excludedSounds array, bpmRange, keyModePreferences, artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['palette'],
      properties: {
        palette: {
          type: 'object',
          properties: {
            genreFusion: { type: 'string' },
            instrumentationCore: { type: 'array', items: { type: 'string' } },
            instrumentationFeatured: { type: 'array', items: { type: 'string' } },
            productionAesthetic: { type: 'string' },
            rhythmApproach: { type: 'string' },
            synthPalette: { type: 'array', items: { type: 'string' } },
            vocalProduction: { type: 'string' },
            mixAesthetic: { type: 'string' },
            referenceTracks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  track: { type: 'string' },
                  artist: { type: 'string' },
                  forElement: { type: 'string' }
                }
              }
            },
            excludedSounds: { type: 'array', items: { type: 'string' } },
            bpmRange: { type: 'string' },
            keyModePreferences: { type: 'string' }
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
  labels: ['agent', 'album', 'sonic', 'palette', 'production']
}));

// Task 4: Narrative Arc
export const narrativeArcTask = defineTask('narrative-arc', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map narrative arc and emotional journey',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'storyteller and emotional arc designer for musical experiences',
      task: 'Map the complete narrative and emotional arc across the album',
      context: args,
      instructions: [
        'Define the emotional starting point of the album',
        'Map the emotional journey track by track',
        'Identify the climax point(s) in the album',
        'Define the resolution and emotional landing',
        'Create an energy curve across the tracklist',
        'Identify moments of tension and release',
        'Define any narrative story elements if applicable',
        'Map character development if the album has characters',
        'Define the "message delivery" moments',
        'Consider listening experience and pacing',
        'Identify the albums "heart" - the most emotionally core track'
      ],
      outputFormat: 'JSON with arc object containing emotionalStart, trackEmotions array (one per track with trackNumber, emotion, intensity 1-10), climaxPoints array, resolution, energyCurve description, tensionReleaseMap array, narrativeElements if any, characterDevelopment if any, messageDeliveryMoments array, pacingStrategy, heartTrack, artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['arc'],
      properties: {
        arc: {
          type: 'object',
          properties: {
            emotionalStart: { type: 'string' },
            trackEmotions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  trackNumber: { type: 'number' },
                  emotion: { type: 'string' },
                  intensity: { type: 'number' }
                }
              }
            },
            climaxPoints: { type: 'array', items: { type: 'number' } },
            resolution: { type: 'string' },
            energyCurve: { type: 'string' },
            tensionReleaseMap: { type: 'array' },
            narrativeElements: { type: 'object' },
            characterDevelopment: { type: 'object' },
            messageDeliveryMoments: { type: 'array' },
            pacingStrategy: { type: 'string' },
            heartTrack: { type: 'number' }
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
  labels: ['agent', 'album', 'narrative', 'emotional', 'arc']
}));

// Task 5: Track Sequencing
export const trackSequencingTask = defineTask('track-sequencing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create track sequencing and song concepts',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'album sequencer and song concept developer',
      task: 'Create the complete track sequencing with individual song concepts',
      context: args,
      instructions: [
        'Create the full track list with working titles',
        'For each track provide: title, core concept, role in album, key motifs used',
        'Define opener strategy - what makes it the right first track',
        'Define closer strategy - what makes it the right final track',
        'Identify any interlude or transition tracks',
        'Consider flow between adjacent tracks',
        'Define any hidden tracks or bonus content',
        'Identify potential singles or standout tracks',
        'Consider vinyl side breaks if applicable',
        'Define target duration for each track',
        'Note any featured artists or collaborations per track'
      ],
      outputFormat: 'JSON with sequencing object containing tracks array (each with trackNumber, title, concept, roleInAlbum, keyMotifs, adjacentFlow, targetDuration, specialNotes), openerStrategy, closerStrategy, interludes array, potentialSingles array, vinylSideBreaks if any, totalTargetDuration, artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['sequencing'],
      properties: {
        sequencing: {
          type: 'object',
          properties: {
            tracks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  trackNumber: { type: 'number' },
                  title: { type: 'string' },
                  concept: { type: 'string' },
                  roleInAlbum: { type: 'string' },
                  keyMotifs: { type: 'array', items: { type: 'string' } },
                  adjacentFlow: { type: 'string' },
                  targetDuration: { type: 'string' },
                  specialNotes: { type: 'string' }
                }
              }
            },
            openerStrategy: { type: 'string' },
            closerStrategy: { type: 'string' },
            interludes: { type: 'array' },
            potentialSingles: { type: 'array', items: { type: 'number' } },
            vinylSideBreaks: { type: 'array' },
            totalTargetDuration: { type: 'string' }
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
  labels: ['agent', 'album', 'sequencing', 'tracks', 'concepts']
}));

// Task 6: Visual Direction
export const visualDirectionTask = defineTask('visual-direction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define album visual direction',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'visual art director for album campaigns',
      task: 'Create the comprehensive visual direction for the album',
      context: args,
      instructions: [
        'Define the core visual concept for the album artwork',
        'Specify the art style and technique for the cover',
        'Create a color palette specific to this album (may extend persona palette)',
        'Define the mood and atmosphere for all visuals',
        'Describe the typography approach for the album',
        'Create direction for individual track artwork',
        'Define visual motifs that tie to musical motifs',
        'Specify photography/illustration style for promo materials',
        'Create direction for music video aesthetics',
        'Define any recurring visual symbols or iconography',
        'Consider merchandise visual direction'
      ],
      outputFormat: 'JSON with visual object containing coverConcept, artStyle, colorPalette array, moodAtmosphere, typography, trackArtworkDirection, visualMotifs array, promoMaterialsStyle, musicVideoAesthetic, recurringSymbols array, merchandiseDirection, artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['visual'],
      properties: {
        visual: {
          type: 'object',
          properties: {
            coverConcept: { type: 'string' },
            artStyle: { type: 'string' },
            colorPalette: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  hex: { type: 'string' },
                  usage: { type: 'string' }
                }
              }
            },
            moodAtmosphere: { type: 'string' },
            typography: { type: 'string' },
            trackArtworkDirection: { type: 'string' },
            visualMotifs: { type: 'array', items: { type: 'string' } },
            promoMaterialsStyle: { type: 'string' },
            musicVideoAesthetic: { type: 'string' },
            recurringSymbols: { type: 'array', items: { type: 'string' } },
            merchandiseDirection: { type: 'string' }
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
  labels: ['agent', 'album', 'visual', 'direction', 'artwork']
}));

// Task 7: Compile Album Concept Document
export const compileAlbumConceptTask = defineTask('compile-album-concept', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compile album concept document',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'documentation specialist for creative projects',
      task: 'Compile all album concept elements into a comprehensive markdown document',
      context: args,
      instructions: [
        'Create a well-structured markdown document for the album concept',
        'Include executive summary with key details',
        'Structure sections: Core Concept, Motifs, Sonic Palette, Narrative Arc, Track List, Visual Direction',
        'Include a quick reference card at the top',
        'Create a track list table with key info for each song',
        'Save the document to the output directory as album-concept.md',
        'Ensure cross-references between motifs and tracks',
        'Include the full sonic palette for production reference',
        'Format for easy scanning during song creation',
        'Return the path to the created file'
      ],
      outputFormat: 'JSON with albumConceptDocPath string, quickReference object, trackListSummary array, artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['albumConceptDocPath', 'artifacts'],
      properties: {
        albumConceptDocPath: { type: 'string' },
        quickReference: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            artist: { type: 'string' },
            theme: { type: 'string' },
            trackCount: { type: 'number' },
            genreFusion: { type: 'string' },
            targetDuration: { type: 'string' }
          }
        },
        trackListSummary: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'documentation', 'album', 'compilation']
}));
