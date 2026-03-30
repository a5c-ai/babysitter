/**
 * @process music-album-creation/full-album-production
 * @description Complete album production workflow: artist persona -> album concept -> all songs with lyrics/style/covers -> album cover. Composes modular processes with quality gates.
 * @inputs { seedIdea?: string, genreDirection?: string, trackCount?: number, existingPersona?: object, outputDir?: string }
 * @outputs { success: boolean, album: object, persona: object, artifacts: array }
 * @recommendedSkills SK-MAC-001 through SK-MAC-010 (all music-album-creation skills)
 * @recommendedAgents AG-MAC-001 (lyricist), AG-MAC-002 (producer), AG-MAC-003 (visual), AG-MAC-004 (persona), AG-MAC-005 (curator)
 * @composedProcesses artist-persona-creation, album-conceptualization, song-composition
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    seedIdea,
    genreDirection,
    eraInfluence,
    moodDirection,
    trackCount = 10,
    existingPersona,
    outputDir = 'album-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  let persona = existingPersona;

  ctx.log('info', '=== FULL ALBUM PRODUCTION WORKFLOW ===');

  // =========================================================================
  // PHASE 1: ARTIST PERSONA
  // =========================================================================

  if (!existingPersona) {
    ctx.log('info', 'PHASE 1: Creating artist persona');

    // Task 1.1: Identity Foundation
    const identityResult = await ctx.task(identityFoundationTask, {
      seedIdea,
      genreDirection,
      eraInfluence,
      moodDirection,
      outputDir
    });

    if (!identityResult.success) {
      return { success: false, error: 'Identity creation failed', details: identityResult };
    }
    artifacts.push(...(identityResult.artifacts || []));

    // Task 1.2: Backstory Development
    const backstoryResult = await ctx.task(backstoryDevelopmentTask, {
      identity: identityResult.identity,
      outputDir
    });
    artifacts.push(...(backstoryResult.artifacts || []));

    // Task 1.3: Artistic Voice
    const voiceResult = await ctx.task(artisticVoiceTask, {
      identity: identityResult.identity,
      backstory: backstoryResult.backstory,
      genreDirection,
      outputDir
    });
    artifacts.push(...(voiceResult.artifacts || []));

    // Task 1.4: Visual Aesthetic
    const visualResult = await ctx.task(visualAestheticTask, {
      identity: identityResult.identity,
      backstory: backstoryResult.backstory,
      voice: voiceResult.voice,
      outputDir
    });
    artifacts.push(...(visualResult.artifacts || []));

    // Task 1.5: Discography Arc
    const discographyResult = await ctx.task(discographyArcTask, {
      identity: identityResult.identity,
      backstory: backstoryResult.backstory,
      voice: voiceResult.voice,
      outputDir
    });
    artifacts.push(...(discographyResult.artifacts || []));

    // Task 1.6: Character Traits
    const traitsResult = await ctx.task(characterTraitsTask, {
      identity: identityResult.identity,
      backstory: backstoryResult.backstory,
      voice: voiceResult.voice,
      outputDir
    });
    artifacts.push(...(traitsResult.artifacts || []));

    // Task 1.7: Compile Persona
    const personaCompileResult = await ctx.task(compilePersonaTask, {
      identity: identityResult.identity,
      backstory: backstoryResult.backstory,
      voice: voiceResult.voice,
      visual: visualResult.visual,
      discography: discographyResult.discography,
      traits: traitsResult.traits,
      outputDir
    });
    artifacts.push(...(personaCompileResult.artifacts || []));

    persona = {
      identity: identityResult.identity,
      backstory: backstoryResult.backstory,
      voice: voiceResult.voice,
      visual: visualResult.visual,
      discography: discographyResult.discography,
      traits: traitsResult.traits
    };

    // Quality Gate: Persona Review
    await ctx.breakpoint({
      question: `Artist persona "${persona.identity.artistName}" created. Genre: ${persona.voice.primaryGenre}. Review and approve to continue to album conceptualization?`,
      title: 'Phase 1 Complete: Persona Review',
      context: {
        runId: ctx.runId,
        files: artifacts.filter(a => a.path?.includes('persona')).map(a => ({ path: a.path, format: 'markdown' })),
        phase: 1
      }
    });
  } else {
    ctx.log('info', `PHASE 1: Using existing persona "${existingPersona.identity?.artistName}"`);
    persona = existingPersona;
  }

  const artistName = persona.identity.artistName;

  // =========================================================================
  // PHASE 2: ALBUM CONCEPTUALIZATION
  // =========================================================================

  ctx.log('info', 'PHASE 2: Conceptualizing album');

  // Task 2.1: Core Concept
  const coreConceptResult = await ctx.task(coreConceptTask, {
    persona,
    trackCount,
    outputDir
  });

  if (!coreConceptResult.success) {
    return { success: false, error: 'Album concept creation failed', details: coreConceptResult };
  }
  artifacts.push(...(coreConceptResult.artifacts || []));

  // Task 2.2: Motifs and Elements
  const motifsResult = await ctx.task(motifsElementsTask, {
    persona,
    coreConcept: coreConceptResult.concept,
    outputDir
  });
  artifacts.push(...(motifsResult.artifacts || []));

  // Task 2.3: Sonic Palette
  const sonicPaletteResult = await ctx.task(sonicPaletteTask, {
    persona,
    coreConcept: coreConceptResult.concept,
    motifs: motifsResult.motifs,
    outputDir
  });
  artifacts.push(...(sonicPaletteResult.artifacts || []));

  // Task 2.4: Narrative Arc
  const narrativeArcResult = await ctx.task(narrativeArcTask, {
    persona,
    coreConcept: coreConceptResult.concept,
    trackCount,
    outputDir
  });
  artifacts.push(...(narrativeArcResult.artifacts || []));

  // Task 2.5: Track Sequencing
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

  // Task 2.6: Visual Direction
  const visualDirectionResult = await ctx.task(visualDirectionTask, {
    persona,
    coreConcept: coreConceptResult.concept,
    motifs: motifsResult.motifs,
    outputDir
  });
  artifacts.push(...(visualDirectionResult.artifacts || []));

  // Task 2.7: Compile Album Concept
  const albumConceptCompileResult = await ctx.task(compileAlbumConceptTask, {
    persona,
    coreConcept: coreConceptResult.concept,
    motifs: motifsResult.motifs,
    sonicPalette: sonicPaletteResult.palette,
    narrativeArc: narrativeArcResult.arc,
    trackSequencing: sequencingResult.sequencing,
    visualDirection: visualDirectionResult.visual,
    outputDir
  });
  artifacts.push(...(albumConceptCompileResult.artifacts || []));

  const albumConcept = {
    coreConcept: coreConceptResult.concept,
    motifs: motifsResult.motifs,
    sonicPalette: sonicPaletteResult.palette,
    narrativeArc: narrativeArcResult.arc,
    trackSequencing: sequencingResult.sequencing,
    visualDirection: visualDirectionResult.visual
  };

  // Quality Gate: Album Concept Review
  await ctx.breakpoint({
    question: `Album "${albumConcept.coreConcept.title}" concept complete with ${trackCount} tracks planned. Review and approve to start song composition?`,
    title: 'Phase 2 Complete: Album Concept Review',
    context: {
      runId: ctx.runId,
      files: artifacts.filter(a => a.path?.includes('album-concept')).map(a => ({ path: a.path, format: 'markdown' })),
      phase: 2,
      trackList: sequencingResult.sequencing.tracks.map(t => `${t.trackNumber}. ${t.title}`)
    }
  });

  // =========================================================================
  // PHASE 3: SONG COMPOSITION (ALL TRACKS)
  // =========================================================================

  ctx.log('info', 'PHASE 3: Composing all songs');

  const tracks = sequencingResult.sequencing.tracks;
  const completedSongs = [];

  for (let i = 0; i < tracks.length; i++) {
    const trackConcept = tracks[i];
    const trackNum = trackConcept.trackNumber;

    ctx.log('info', `Composing track ${trackNum}/${tracks.length}: "${trackConcept.title}"`);

    // Task 3.X.1: Song Concept
    const songConceptResult = await ctx.task(songConceptTask, {
      persona,
      albumConcept,
      trackConcept,
      outputDir
    });
    artifacts.push(...(songConceptResult.artifacts || []));

    // Task 3.X.2: Lyrics Composition
    const lyricsResult = await ctx.task(lyricsCompositionTask, {
      persona,
      albumConcept,
      songConcept: songConceptResult.concept,
      outputDir
    });
    artifacts.push(...(lyricsResult.artifacts || []));

    // Task 3.X.3: Style Specification
    const styleResult = await ctx.task(styleSpecificationTask, {
      persona,
      albumConcept,
      songConcept: songConceptResult.concept,
      lyrics: lyricsResult.lyrics,
      outputDir
    });
    artifacts.push(...(styleResult.artifacts || []));

    // Task 3.X.4: Cover Art Prompt
    const coverResult = await ctx.task(coverArtPromptTask, {
      persona,
      albumConcept,
      songConcept: songConceptResult.concept,
      lyrics: lyricsResult.lyrics,
      style: styleResult.style,
      outputDir
    });
    artifacts.push(...(coverResult.artifacts || []));

    // Task 3.X.5: Compile Song Package
    const packageResult = await ctx.task(compileSongPackageTask, {
      persona,
      albumConcept,
      songConcept: songConceptResult.concept,
      lyrics: lyricsResult.lyrics,
      style: styleResult.style,
      coverPrompt: coverResult.coverPrompt,
      trackNumber: trackNum,
      outputDir
    });
    artifacts.push(...(packageResult.artifacts || []));

    completedSongs.push({
      trackNumber: trackNum,
      title: songConceptResult.concept.title,
      concept: songConceptResult.concept,
      lyrics: lyricsResult.lyrics,
      style: styleResult.style,
      coverPrompt: coverResult.coverPrompt,
      paths: {
        lyrics: packageResult.lyricsPath,
        style: packageResult.stylePath,
        cover: packageResult.coverPromptPath
      },
      aiGenerationPrompt: packageResult.aiGenerationPrompt
    });

    // Progress checkpoint every 3 songs
    if ((i + 1) % 3 === 0 && i < tracks.length - 1) {
      ctx.log('info', `Progress checkpoint: ${i + 1}/${tracks.length} songs complete`);
    }
  }

  // Quality Gate: Songs Review
  await ctx.breakpoint({
    question: `All ${tracks.length} songs composed for "${albumConcept.coreConcept.title}". Review and approve to generate album cover?`,
    title: 'Phase 3 Complete: Songs Review',
    context: {
      runId: ctx.runId,
      phase: 3,
      completedTracks: completedSongs.map(s => ({ track: s.trackNumber, title: s.title, genre: s.style.primaryGenre }))
    }
  });

  // =========================================================================
  // PHASE 4: ALBUM COVER
  // =========================================================================

  ctx.log('info', 'PHASE 4: Creating album cover art prompt');

  // Task 4.1: Album Cover Art Prompt
  const albumCoverResult = await ctx.task(albumCoverPromptTask, {
    persona,
    albumConcept,
    completedSongs,
    outputDir
  });
  artifacts.push(...(albumCoverResult.artifacts || []));

  // =========================================================================
  // PHASE 5: FINAL COMPILATION
  // =========================================================================

  ctx.log('info', 'PHASE 5: Final compilation');

  // Task 5.1: Generate Final Package
  const finalPackageResult = await ctx.task(finalCompilationTask, {
    persona,
    albumConcept,
    completedSongs,
    albumCover: albumCoverResult.coverPrompt,
    outputDir
  });
  artifacts.push(...(finalPackageResult.artifacts || []));

  // Final Review
  await ctx.breakpoint({
    question: `Album "${albumConcept.coreConcept.title}" by ${artistName} is complete! ${tracks.length} songs with lyrics, styles, and covers. Album cover prompt generated. Review final package?`,
    title: 'Production Complete: Final Review',
    context: {
      runId: ctx.runId,
      phase: 5,
      summary: {
        artist: artistName,
        album: albumConcept.coreConcept.title,
        trackCount: tracks.length,
        totalArtifacts: artifacts.length
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    album: {
      concept: albumConcept,
      songs: completedSongs,
      albumCover: albumCoverResult.coverPrompt
    },
    persona,
    masterIndexPath: finalPackageResult.masterIndexPath,
    quickStartPath: finalPackageResult.quickStartPath,
    artifacts,
    duration,
    metadata: {
      processId: 'music-album-creation/full-album-production',
      timestamp: startTime,
      outputDir,
      trackCount: tracks.length
    }
  };
}

// =========================================================================
// TASK DEFINITIONS
// =========================================================================

// --- PHASE 1: PERSONA TASKS ---

export const identityFoundationTask = defineTask('identity-foundation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate artist identity foundation',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'creative artist persona designer',
      task: 'Create the foundational identity for a unique musical artist',
      context: args,
      instructions: [
        'Generate a compelling and memorable artist/stage name',
        'Consider genre direction if provided',
        'Create a brief identity statement (1-2 sentences)',
        'Define the artists core musical identity',
        'Suggest real name and basic demographics',
        'Ensure name is unique and memorable'
      ],
      outputFormat: 'JSON with success boolean, identity object (artistName, realName, ageRange, origin, identityStatement, coreMusicalIdentity), artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'identity'],
      properties: {
        success: { type: 'boolean' },
        identity: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['persona', 'identity']
}));

export const backstoryDevelopmentTask = defineTask('backstory-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop artist backstory',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'creative writer for artist biographies',
      task: 'Create a rich backstory for the musical artist',
      context: args,
      instructions: [
        'Create detailed origin story',
        'Include formative experiences',
        'Define key relationships',
        'Describe pivotal moments',
        'Include struggles and breakthroughs',
        'Document early influences'
      ],
      outputFormat: 'JSON with backstory object (originStory, formativeExperiences, keyRelationships, pivotalMoments, strugglesAndBreakthroughs, earlyInfluences), artifacts array'
    },
    outputSchema: { type: 'object', required: ['backstory'], properties: { backstory: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['persona', 'backstory']
}));

export const artisticVoiceTask = defineTask('artistic-voice', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define artistic voice and style',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'music critic and genre expert',
      task: 'Define the artists unique artistic voice',
      context: args,
      instructions: [
        'Define primary and secondary genres',
        'Describe signature sonic elements',
        'Characterize lyrical themes',
        'Define vocal style',
        'Describe production aesthetic',
        'Identify era influences',
        'List artist influences'
      ],
      outputFormat: 'JSON with voice object (primaryGenre, secondaryGenres, signatureSounds, lyricalThemes, vocalStyle, productionAesthetic, eraInfluence, artistInfluences, uniqueElements), artifacts array'
    },
    outputSchema: { type: 'object', required: ['voice'], properties: { voice: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['persona', 'voice']
}));

export const visualAestheticTask = defineTask('visual-aesthetic', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create visual aesthetic',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'visual artist and brand designer',
      task: 'Create the complete visual aesthetic for the artist',
      context: args,
      instructions: [
        'Define core color palette with hex codes',
        'Describe fashion sense',
        'Create iconography',
        'Define typography style',
        'Describe photographic aesthetic',
        'Define stage presence'
      ],
      outputFormat: 'JSON with visual object (colorPalette, fashionStyle, iconography, typographyStyle, photographicAesthetic, moodAndAtmosphere, stagePresence, visualReferences), artifacts array'
    },
    outputSchema: { type: 'object', required: ['visual'], properties: { visual: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['persona', 'visual']
}));

export const discographyArcTask = defineTask('discography-arc', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map discography arc',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'music historian and career strategist',
      task: 'Map the artists discography arc',
      context: args,
      instructions: [
        'Define distinct career phases',
        'Describe evolution between eras',
        'Identify breakthrough moments',
        'Define current era',
        'Suggest future direction',
        'Define magnum opus'
      ],
      outputFormat: 'JSON with discography object (phases array, breakthroughMoments, currentEra, futureDirection, overallArc, magnumOpus), artifacts array'
    },
    outputSchema: { type: 'object', required: ['discography'], properties: { discography: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['persona', 'discography']
}));

export const characterTraitsTask = defineTask('character-traits', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define character traits',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'psychologist and character designer',
      task: 'Define detailed character traits',
      context: args,
      instructions: [
        'Define core personality traits',
        'Describe public vs private persona',
        'Identify values and beliefs',
        'Define quirks and habits',
        'Describe media presence',
        'Identify contradictions',
        'Define vulnerabilities'
      ],
      outputFormat: 'JSON with traits object (coreTraits, publicVsPrivate, valuesAndBeliefs, quirksAndHabits, mediaPresence, contradictions, vulnerabilities), artifacts array'
    },
    outputSchema: { type: 'object', required: ['traits'], properties: { traits: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['persona', 'traits']
}));

export const compilePersonaTask = defineTask('compile-persona', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compile persona document',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'documentation specialist',
      task: 'Compile all persona elements into markdown document',
      context: args,
      instructions: [
        'Create structured markdown document',
        'Include all sections',
        'Write executive summary',
        'Include quick reference card',
        'Save as persona.md to output directory',
        'Return the file path'
      ],
      outputFormat: 'JSON with personaDocPath string, artifacts array'
    },
    outputSchema: { type: 'object', required: ['personaDocPath', 'artifacts'], properties: { personaDocPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['persona', 'documentation']
}));

// --- PHASE 2: ALBUM CONCEPT TASKS ---

export const coreConceptTask = defineTask('core-concept', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate album core concept',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'album conceptualizer',
      task: 'Create the core concept for a cohesive album',
      context: args,
      instructions: [
        'Generate compelling album title',
        'Define central theme',
        'Create concept statement',
        'Identify albums place in discography',
        'Define emotional impact',
        'Identify inspirations'
      ],
      outputFormat: 'JSON with success boolean, concept object (title, centralTheme, conceptStatement, discographyContext, emotionalImpact, inspirations, thesis), artifacts array'
    },
    outputSchema: { type: 'object', required: ['success', 'concept'], properties: { success: { type: 'boolean' }, concept: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['album', 'concept']
}));

export const motifsElementsTask = defineTask('motifs-elements', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop album motifs',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'thematic analyst',
      task: 'Create motifs and recurring elements for album cohesion',
      context: args,
      instructions: [
        'Identify 4-6 key lyrical motifs',
        'Define 3-4 musical motifs',
        'Create symbol glossary',
        'Define character archetypes if any',
        'Identify sonic signatures',
        'Create album vocabulary'
      ],
      outputFormat: 'JSON with motifs array (each with name, type, description, occurrenceStrategy), musicalMotifs, symbolGlossary, sonicSignatures, artifacts array'
    },
    outputSchema: { type: 'object', required: ['motifs'], properties: { motifs: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['album', 'motifs']
}));

export const sonicPaletteTask = defineTask('sonic-palette', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design sonic palette',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'music producer',
      task: 'Define comprehensive sonic palette for the album',
      context: args,
      instructions: [
        'Define genre fusion',
        'Create instrumentation palette',
        'Define production aesthetic',
        'Specify rhythm approach',
        'Define vocal production approach',
        'Create reference track list',
        'Specify BPM range'
      ],
      outputFormat: 'JSON with palette object (genreFusion, instrumentationCore, productionAesthetic, rhythmApproach, vocalProduction, mixAesthetic, referenceTracks, bpmRange), artifacts array'
    },
    outputSchema: { type: 'object', required: ['palette'], properties: { palette: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['album', 'sonic', 'palette']
}));

export const narrativeArcTask = defineTask('narrative-arc', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map narrative arc',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'storyteller',
      task: 'Map emotional and narrative arc across the album',
      context: args,
      instructions: [
        'Define emotional starting point',
        'Map track-by-track emotions',
        'Identify climax points',
        'Define resolution',
        'Create energy curve',
        'Identify tension/release moments',
        'Define the heart track'
      ],
      outputFormat: 'JSON with arc object (emotionalStart, trackEmotions array, climaxPoints, resolution, energyCurve, tensionReleaseMap, heartTrack), artifacts array'
    },
    outputSchema: { type: 'object', required: ['arc'], properties: { arc: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['album', 'narrative', 'arc']
}));

export const trackSequencingTask = defineTask('track-sequencing', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create track sequencing',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'album sequencer',
      task: 'Create complete track list with song concepts',
      context: args,
      instructions: [
        'Create full track list with titles',
        'For each track: title, concept, role, key motifs',
        'Define opener/closer strategy',
        'Identify interludes',
        'Consider flow between tracks',
        'Define target durations',
        'Identify potential singles'
      ],
      outputFormat: 'JSON with sequencing object (tracks array with trackNumber/title/concept/roleInAlbum/keyMotifs/targetDuration, openerStrategy, closerStrategy, interludes, potentialSingles), artifacts array'
    },
    outputSchema: { type: 'object', required: ['sequencing'], properties: { sequencing: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['album', 'sequencing', 'tracks']
}));

export const visualDirectionTask = defineTask('visual-direction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define visual direction',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'visual art director',
      task: 'Create visual direction for the album',
      context: args,
      instructions: [
        'Define cover concept',
        'Specify art style',
        'Create album color palette',
        'Define mood/atmosphere',
        'Describe typography approach',
        'Create direction for track artwork',
        'Define visual motifs'
      ],
      outputFormat: 'JSON with visual object (coverConcept, artStyle, colorPalette, moodAtmosphere, typography, trackArtworkDirection, visualMotifs), artifacts array'
    },
    outputSchema: { type: 'object', required: ['visual'], properties: { visual: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['album', 'visual']
}));

export const compileAlbumConceptTask = defineTask('compile-album-concept', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compile album concept document',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'documentation specialist',
      task: 'Compile album concept into markdown',
      context: args,
      instructions: [
        'Create structured markdown document',
        'Include all concept sections',
        'Create track list table',
        'Save as album-concept.md',
        'Return file path'
      ],
      outputFormat: 'JSON with albumConceptDocPath string, artifacts array'
    },
    outputSchema: { type: 'object', required: ['albumConceptDocPath', 'artifacts'], properties: { albumConceptDocPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['album', 'documentation']
}));

// --- PHASE 3: SONG TASKS ---

export const songConceptTask = defineTask('song-concept', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop song concept',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'songwriter',
      task: 'Develop detailed song concept',
      context: args,
      instructions: [
        'Expand/create song concept',
        'Define core message',
        'Identify emotional journey',
        'Define perspective',
        'Identify characters/subjects',
        'Define setting',
        'Identify key imagery',
        'Define tone',
        'Finalize title'
      ],
      outputFormat: 'JSON with success boolean, concept object (title, coreMessage, emotionalJourney, perspective, characters, setting, keyImagery, metaphors, tone, albumFit), artifacts array'
    },
    outputSchema: { type: 'object', required: ['success', 'concept'], properties: { success: { type: 'boolean' }, concept: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['song', 'concept']
}));

export const lyricsCompositionTask = defineTask('lyrics-composition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write full lyrics',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'professional lyricist for AI music platforms',
      task: 'Write complete lyrics with production annotations',
      context: args,
      instructions: [
        'Write full lyrics based on concept',
        'Use structural markers: [Intro], [Verse 1], [Pre-Chorus], [Chorus], [Bridge], [Outro]',
        'Embed production notes: [whispered], [spoken word], [belt], [falsetto], [building], [soft], [raw], [ad-lib], [harmony], [fade]',
        'Maintain artist voice',
        'Incorporate album motifs',
        'Create memorable hooks',
        'Map emotional dynamics',
        'Consider syllables and flow'
      ],
      outputFormat: 'JSON with lyrics object (fullText string with all annotations, sections array, hooks array, wordCount, rhymeScheme, emotionalArc, productionNotes summary), artifacts array'
    },
    outputSchema: { type: 'object', required: ['lyrics'], properties: { lyrics: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['song', 'lyrics']
}));

export const styleSpecificationTask = defineTask('style-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create style specification',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'music producer and AI prompt engineer',
      task: 'Create ultra-detailed style specification for Suno/Udio',
      context: args,
      instructions: [
        'GENRES: Primary, secondary, subgenres',
        'TEMPO: BPM, tempo feel',
        'KEY/MODE: Suggested key and mode',
        'INSTRUMENTATION: Detailed breakdown (drums, bass, keys, guitars, additional)',
        'VOCALS: Style, register, techniques, emotion, influence refs',
        'PRODUCTION: Era, mix character, effects, overall sound',
        'REFERENCES: 3-5 specific songs with what element to reference',
        'MOOD: Overall mood, energy 1-10, dynamics',
        'AI PROMPT: Create condensed single-paragraph Suno/Udio prompt'
      ],
      outputFormat: 'JSON with style object (primaryGenre, secondaryGenres, subgenres, bpm, tempoFeel, key, mode, instrumentation, vocals, production, referenceTracks array, mood, energyLevel, dynamics, aiPlatformPrompt), artifacts array'
    },
    outputSchema: { type: 'object', required: ['style'], properties: { style: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['song', 'style', 'production']
}));

export const coverArtPromptTask = defineTask('cover-art-prompt', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate cover art prompt',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'visual prompt engineer for Midjourney/DALL-E',
      task: 'Create detailed text-to-image prompt for song cover',
      context: args,
      instructions: [
        'Create visual concept capturing song essence',
        'Translate sonic mood to visual',
        'Structure for Midjourney/DALL-E:',
        '  1. Subject/Scene',
        '  2. Art Style',
        '  3. Art Movement',
        '  4. Lighting',
        '  5. Color palette',
        '  6. Composition',
        '  7. Atmosphere',
        '  8. Technical modifiers',
        'Create main prompt paragraph',
        'Provide 2-3 variations',
        'Include negative prompts',
        'Specify 1:1 aspect ratio'
      ],
      outputFormat: 'JSON with coverPrompt object (concept, mainPrompt, artStyle, artInfluences, lighting, colorPalette, composition, atmosphere, technicalModifiers, variations array, negativePrompt, aspectRatio), artifacts array'
    },
    outputSchema: { type: 'object', required: ['coverPrompt'], properties: { coverPrompt: { type: 'object' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['song', 'cover', 'visual']
}));

export const compileSongPackageTask = defineTask('compile-song-package', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compile song package',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'documentation specialist',
      task: 'Compile song elements into markdown files',
      context: args,
      instructions: [
        'Create three files:',
        '1. track-XX-song-title.md (lyrics)',
        '2. track-XX-song-title-style.md (style spec)',
        '3. track-XX-song-title-cover.md (cover prompt)',
        'Use track number in filenames',
        'Save to output directory/songs/',
        'Create condensed AI generation prompt',
        'Return all file paths'
      ],
      outputFormat: 'JSON with lyricsPath, stylePath, coverPromptPath, aiGenerationPrompt string, artifacts array'
    },
    outputSchema: { type: 'object', required: ['lyricsPath', 'stylePath', 'coverPromptPath', 'aiGenerationPrompt', 'artifacts'], properties: { lyricsPath: { type: 'string' }, stylePath: { type: 'string' }, coverPromptPath: { type: 'string' }, aiGenerationPrompt: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['song', 'documentation']
}));

// --- PHASE 4: ALBUM COVER ---

export const albumCoverPromptTask = defineTask('album-cover-prompt', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate album cover prompt',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'visual art director for album campaigns',
      task: 'Create comprehensive album cover art prompt',
      context: args,
      instructions: [
        'Create visual concept representing entire album',
        'Consider all songs and their themes',
        'Align with artist visual aesthetic',
        'Align with album visual direction',
        'Create detailed Midjourney/DALL-E prompt',
        'Specify art style, colors, composition',
        'Provide variations',
        'Include negative prompts',
        'Consider how it unifies all tracks',
        'Save prompt to covers/album-cover-prompt.md'
      ],
      outputFormat: 'JSON with coverPrompt object (concept, mainPrompt, artStyle, colorPalette, composition, atmosphere, variations array, negativePrompt, aspectRatio, unifyingElements), coverPromptPath string, artifacts array'
    },
    outputSchema: { type: 'object', required: ['coverPrompt', 'artifacts'], properties: { coverPrompt: { type: 'object' }, coverPromptPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['album', 'cover', 'visual']
}));

// --- PHASE 5: FINAL COMPILATION ---

export const finalCompilationTask = defineTask('final-compilation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate final package',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'project manager and documentation specialist',
      task: 'Create final album package with master index and quick-start guide',
      context: args,
      instructions: [
        'Create master index (README.md) with:',
        '  - Album overview',
        '  - Artist quick reference',
        '  - Complete track list with links',
        '  - File structure guide',
        '  - AI generation quick-start',
        'Create quick-start.md with:',
        '  - All AI prompts in copy-paste format',
        '  - Song-by-song generation guide',
        '  - Cover generation guide',
        'Save to output directory root',
        'Return paths to created files'
      ],
      outputFormat: 'JSON with masterIndexPath string, quickStartPath string, artifacts array'
    },
    outputSchema: { type: 'object', required: ['masterIndexPath', 'quickStartPath', 'artifacts'], properties: { masterIndexPath: { type: 'string' }, quickStartPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['album', 'documentation', 'final']
}));
