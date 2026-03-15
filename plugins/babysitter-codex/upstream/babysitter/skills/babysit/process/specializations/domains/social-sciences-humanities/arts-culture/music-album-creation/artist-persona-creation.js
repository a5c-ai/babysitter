/**
 * @process music-album-creation/artist-persona-creation
 * @description Creates a complete artist persona including name, backstory, influences, signature style, visual aesthetic, discography arc, and character traits for AI music generation
 * @inputs { seedIdea?: string, genreDirection?: string, eraInfluence?: string, moodDirection?: string, outputDir?: string }
 * @outputs { success: boolean, persona: object, artifacts: array }
 * @recommendedSkills SK-MAC-004 (persona-development), SK-MAC-006 (genre-analysis)
 * @recommendedAgents AG-MAC-004 (persona-designer-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    seedIdea = 'Create a unique and compelling artist',
    genreDirection,
    eraInfluence,
    moodDirection,
    outputDir = 'artist-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Generate Artist Identity Foundation
  ctx.log('info', 'Generating artist identity foundation');
  const identityResult = await ctx.task(identityFoundationTask, {
    seedIdea,
    genreDirection,
    eraInfluence,
    moodDirection,
    outputDir
  });

  if (!identityResult.success) {
    return {
      success: false,
      error: 'Identity foundation generation failed',
      details: identityResult,
      metadata: { processId: 'music-album-creation/artist-persona-creation', timestamp: startTime }
    };
  }

  artifacts.push(...(identityResult.artifacts || []));

  // Task 2: Develop Backstory and Origin
  ctx.log('info', 'Developing artist backstory and origin narrative');
  const backstoryResult = await ctx.task(backstoryDevelopmentTask, {
    identity: identityResult.identity,
    outputDir
  });

  artifacts.push(...(backstoryResult.artifacts || []));

  // Task 3: Define Artistic Voice and Style
  ctx.log('info', 'Defining artistic voice and signature style');
  const voiceResult = await ctx.task(artisticVoiceTask, {
    identity: identityResult.identity,
    backstory: backstoryResult.backstory,
    genreDirection,
    outputDir
  });

  artifacts.push(...(voiceResult.artifacts || []));

  // Task 4: Create Visual Aesthetic
  ctx.log('info', 'Creating visual aesthetic and iconography');
  const visualResult = await ctx.task(visualAestheticTask, {
    identity: identityResult.identity,
    backstory: backstoryResult.backstory,
    voice: voiceResult.voice,
    outputDir
  });

  artifacts.push(...(visualResult.artifacts || []));

  // Task 5: Map Discography Arc
  ctx.log('info', 'Mapping discography arc and career trajectory');
  const discographyResult = await ctx.task(discographyArcTask, {
    identity: identityResult.identity,
    backstory: backstoryResult.backstory,
    voice: voiceResult.voice,
    outputDir
  });

  artifacts.push(...(discographyResult.artifacts || []));

  // Task 6: Define Character Traits
  ctx.log('info', 'Defining character traits and personality profile');
  const traitsResult = await ctx.task(characterTraitsTask, {
    identity: identityResult.identity,
    backstory: backstoryResult.backstory,
    voice: voiceResult.voice,
    outputDir
  });

  artifacts.push(...(traitsResult.artifacts || []));

  // Task 7: Compile Complete Persona Document
  ctx.log('info', 'Compiling complete persona document');
  const personaResult = await ctx.task(compilePersonaTask, {
    identity: identityResult.identity,
    backstory: backstoryResult.backstory,
    voice: voiceResult.voice,
    visual: visualResult.visual,
    discography: discographyResult.discography,
    traits: traitsResult.traits,
    outputDir
  });

  artifacts.push(...(personaResult.artifacts || []));

  // Breakpoint: Review persona
  await ctx.breakpoint({
    question: `Artist persona "${identityResult.identity.artistName}" created. Review the complete persona and approve to continue?`,
    title: 'Artist Persona Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        artistName: identityResult.identity.artistName,
        genre: voiceResult.voice.primaryGenre,
        era: voiceResult.voice.eraInfluence,
        discographyPhases: discographyResult.discography.phases?.length || 0
      }
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    persona: {
      identity: identityResult.identity,
      backstory: backstoryResult.backstory,
      voice: voiceResult.voice,
      visual: visualResult.visual,
      discography: discographyResult.discography,
      traits: traitsResult.traits
    },
    personaDocPath: personaResult.personaDocPath,
    artifacts,
    duration,
    metadata: {
      processId: 'music-album-creation/artist-persona-creation',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task 1: Identity Foundation
export const identityFoundationTask = defineTask('identity-foundation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate artist identity foundation',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'creative artist persona designer specializing in music industry identities',
      task: 'Create the foundational identity elements for a unique musical artist',
      context: args,
      instructions: [
        'Generate a compelling and memorable artist/stage name',
        'Consider genre direction if provided, otherwise choose something fitting',
        'Create a brief identity statement (1-2 sentences capturing essence)',
        'Define the artists core musical identity',
        'Suggest real name and basic demographics (age range, origin)',
        'Consider how the name sounds, looks, and feels',
        'Ensure the name is unique and not too similar to existing major artists',
        'Consider era influences if provided',
        'The identity should feel authentic and three-dimensional'
      ],
      outputFormat: 'JSON with success, identity object containing artistName, realName, ageRange, origin, identityStatement, coreMusicalIdentity, artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['success', 'identity'],
      properties: {
        success: { type: 'boolean' },
        identity: {
          type: 'object',
          required: ['artistName', 'identityStatement'],
          properties: {
            artistName: { type: 'string' },
            realName: { type: 'string' },
            ageRange: { type: 'string' },
            origin: { type: 'string' },
            identityStatement: { type: 'string' },
            coreMusicalIdentity: { type: 'string' }
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
  labels: ['agent', 'persona', 'identity', 'music']
}));

// Task 2: Backstory Development
export const backstoryDevelopmentTask = defineTask('backstory-development', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Develop artist backstory',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'creative writer specializing in artist biographies and origin stories',
      task: 'Create a rich, compelling backstory for the musical artist',
      context: args,
      instructions: [
        'Create a detailed origin story for the artist',
        'Include formative experiences that shaped their music',
        'Define key relationships (mentors, collaborators, rivals)',
        'Describe pivotal moments that changed their trajectory',
        'Include struggles, setbacks, and breakthroughs',
        'Add specific details that make the story feel real',
        'Consider how their background informs their artistic voice',
        'Create believable but compelling narrative elements',
        'Include early musical influences and first exposure to music',
        'Describe the journey from aspiring artist to current state'
      ],
      outputFormat: 'JSON with backstory object containing originStory, formativeExperiences array, keyRelationships array, pivotalMoments array, strugglesAndBreakthroughs, earlyInfluences, artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['backstory'],
      properties: {
        backstory: {
          type: 'object',
          properties: {
            originStory: { type: 'string' },
            formativeExperiences: { type: 'array', items: { type: 'string' } },
            keyRelationships: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  role: { type: 'string' },
                  significance: { type: 'string' }
                }
              }
            },
            pivotalMoments: { type: 'array', items: { type: 'string' } },
            strugglesAndBreakthroughs: { type: 'string' },
            earlyInfluences: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'persona', 'backstory', 'narrative']
}));

// Task 3: Artistic Voice
export const artisticVoiceTask = defineTask('artistic-voice', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define artistic voice and style',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'music critic and genre expert with deep knowledge of musical styles',
      task: 'Define the artists unique artistic voice and signature style',
      context: args,
      instructions: [
        'Define the primary genre and secondary genre influences',
        'Describe the signature sonic elements',
        'Characterize the lyrical themes and preoccupations',
        'Define vocal style and delivery characteristics',
        'Describe the production aesthetic preferences',
        'Identify era influences (decades, movements)',
        'List specific artist influences and how they manifest',
        'Define what makes this artist unique in their genre',
        'Describe typical song structures they favor',
        'Identify signature production techniques or sounds'
      ],
      outputFormat: 'JSON with voice object containing primaryGenre, secondaryGenres, signatureSounds, lyricalThemes, vocalStyle, productionAesthetic, eraInfluence, artistInfluences, uniqueElements, typicalStructures, artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['voice'],
      properties: {
        voice: {
          type: 'object',
          properties: {
            primaryGenre: { type: 'string' },
            secondaryGenres: { type: 'array', items: { type: 'string' } },
            signatureSounds: { type: 'array', items: { type: 'string' } },
            lyricalThemes: { type: 'array', items: { type: 'string' } },
            vocalStyle: { type: 'string' },
            productionAesthetic: { type: 'string' },
            eraInfluence: { type: 'string' },
            artistInfluences: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  artist: { type: 'string' },
                  howItManifests: { type: 'string' }
                }
              }
            },
            uniqueElements: { type: 'array', items: { type: 'string' } },
            typicalStructures: { type: 'string' }
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
  labels: ['agent', 'persona', 'voice', 'style', 'music']
}));

// Task 4: Visual Aesthetic
export const visualAestheticTask = defineTask('visual-aesthetic', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create visual aesthetic',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'visual artist and brand designer specializing in musician aesthetics',
      task: 'Create the complete visual aesthetic and iconography for the artist',
      context: args,
      instructions: [
        'Define the core color palette (3-5 colors with hex codes)',
        'Describe the fashion sense and typical attire',
        'Create iconography and visual symbols associated with the artist',
        'Define typography style preferences for branding',
        'Describe the photographic/video aesthetic',
        'Define mood and atmosphere of visual content',
        'Describe stage presence and live visual elements',
        'Create visual references (art movements, photographers, designers)',
        'Define what visual elements are never used (anti-aesthetic)',
        'Describe how visual identity evolved or might evolve'
      ],
      outputFormat: 'JSON with visual object containing colorPalette, fashionStyle, iconography, typographyStyle, photographicAesthetic, moodAndAtmosphere, stagePresence, visualReferences, antiAesthetic, evolutionNotes, artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['visual'],
      properties: {
        visual: {
          type: 'object',
          properties: {
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
            fashionStyle: { type: 'string' },
            iconography: { type: 'array', items: { type: 'string' } },
            typographyStyle: { type: 'string' },
            photographicAesthetic: { type: 'string' },
            moodAndAtmosphere: { type: 'string' },
            stagePresence: { type: 'string' },
            visualReferences: { type: 'array', items: { type: 'string' } },
            antiAesthetic: { type: 'array', items: { type: 'string' } },
            evolutionNotes: { type: 'string' }
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
  labels: ['agent', 'persona', 'visual', 'aesthetic', 'branding']
}));

// Task 5: Discography Arc
export const discographyArcTask = defineTask('discography-arc', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map discography arc',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'music historian and career strategist for musicians',
      task: 'Map the artists discography arc and career trajectory',
      context: args,
      instructions: [
        'Define distinct eras/phases in the artists career (3-5 phases)',
        'For each era: name, time period, sonic characteristics, key themes',
        'Describe the evolution from one era to the next',
        'Identify breakthrough moments in the discography',
        'Define current era and where the artist is now',
        'Suggest future direction and next era possibilities',
        'Note any side projects, collaborations, or departures',
        'Define the overall narrative arc of the career',
        'Identify the magnum opus or defining work',
        'Note commercial vs critical reception patterns'
      ],
      outputFormat: 'JSON with discography object containing phases array (each with name, timePeriod, sonicCharacteristics, keyThemes, transitionNotes), breakthroughMoments, currentEra, futureDirection, sideProjects, overallArc, magnumOpus, receptionPattern, artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['discography'],
      properties: {
        discography: {
          type: 'object',
          properties: {
            phases: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  timePeriod: { type: 'string' },
                  sonicCharacteristics: { type: 'string' },
                  keyThemes: { type: 'array', items: { type: 'string' } },
                  transitionNotes: { type: 'string' }
                }
              }
            },
            breakthroughMoments: { type: 'array', items: { type: 'string' } },
            currentEra: { type: 'string' },
            futureDirection: { type: 'string' },
            sideProjects: { type: 'array', items: { type: 'string' } },
            overallArc: { type: 'string' },
            magnumOpus: { type: 'string' },
            receptionPattern: { type: 'string' }
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
  labels: ['agent', 'persona', 'discography', 'career', 'music']
}));

// Task 6: Character Traits
export const characterTraitsTask = defineTask('character-traits', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define character traits',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'psychologist and character designer specializing in public personas',
      task: 'Define the detailed character traits and personality profile',
      context: args,
      instructions: [
        'Define core personality traits (Big Five or similar framework)',
        'Describe public persona vs private self (if different)',
        'Identify values and beliefs that drive the artist',
        'Define quirks, habits, and idiosyncrasies',
        'Describe interview style and media presence',
        'Identify contradictions and complexities',
        'Define fears, insecurities, and vulnerabilities',
        'Describe sense of humor and how they handle criticism',
        'Define relationships with fans and the industry',
        'Note any personas or characters they embody'
      ],
      outputFormat: 'JSON with traits object containing coreTraits, publicVsPrivate, valuesAndBeliefs, quirksAndHabits, mediaPresence, contradictions, vulnerabilities, humorStyle, fanRelationship, alterEgos, artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['traits'],
      properties: {
        traits: {
          type: 'object',
          properties: {
            coreTraits: { type: 'array', items: { type: 'string' } },
            publicVsPrivate: { type: 'string' },
            valuesAndBeliefs: { type: 'array', items: { type: 'string' } },
            quirksAndHabits: { type: 'array', items: { type: 'string' } },
            mediaPresence: { type: 'string' },
            contradictions: { type: 'array', items: { type: 'string' } },
            vulnerabilities: { type: 'array', items: { type: 'string' } },
            humorStyle: { type: 'string' },
            fanRelationship: { type: 'string' },
            alterEgos: { type: 'array', items: { type: 'string' } }
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
  labels: ['agent', 'persona', 'character', 'personality', 'psychology']
}));

// Task 7: Compile Persona Document
export const compilePersonaTask = defineTask('compile-persona', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compile complete persona document',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'technical writer and documentation specialist',
      task: 'Compile all persona elements into a comprehensive markdown document',
      context: args,
      instructions: [
        'Create a well-structured markdown document',
        'Include all sections: Identity, Backstory, Voice, Visual, Discography, Traits',
        'Write an executive summary at the top',
        'Include a quick reference card for key details',
        'Format for easy scanning and reference',
        'Save the document to the output directory as persona.md',
        'Ensure all details from each section are included',
        'Add cross-references between related elements',
        'Include a changelog/version section at the bottom',
        'Return the path to the created file'
      ],
      outputFormat: 'JSON with personaDocPath string, summaryCard object with key quick-reference info, artifacts array containing the created file'
    },
    outputSchema: {
      type: 'object',
      required: ['personaDocPath', 'artifacts'],
      properties: {
        personaDocPath: { type: 'string' },
        summaryCard: {
          type: 'object',
          properties: {
            artistName: { type: 'string' },
            genre: { type: 'string' },
            era: { type: 'string' },
            signature: { type: 'string' },
            colorPalette: { type: 'array' },
            currentPhase: { type: 'string' }
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
  labels: ['agent', 'documentation', 'persona', 'compilation']
}));
