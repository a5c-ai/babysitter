/**
 * @process film-tv-production/character-creation
 * @description Creates comprehensive character profiles including backstory, psychology, arcs, relationships, voice profiles, and visual design for film/TV productions.
 * @inputs { storyContext: object, mainCharacterCount?: number, format: string, genre: string, outputDir?: string }
 * @outputs { success: boolean, characters: array, artifacts: array }
 * @recommendedSkills SK-FTV-007 (character-development), SK-FTV-004 (dialogue-crafting), SK-FTV-012 (genre-analysis-film)
 * @recommendedAgents AG-FTV-003 (character-designer-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    storyContext,
    mainCharacterCount,
    format,
    genre,
    outputDir = 'character-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Character Identification
  ctx.log('info', 'Identifying all story characters');
  const identificationResult = await ctx.task(characterIdentification, {
    storyOutline: storyContext.outline,
    treatment: storyContext.treatment,
    format,
    genre
  });
  artifacts.push(...(identificationResult.artifacts || []));

  // Task 2: Protagonist Deep Dive
  ctx.log('info', 'Creating detailed protagonist profile');
  const protagonistResult = await ctx.task(protagonistProfile, {
    protagonist: identificationResult.characters.find(c => c.role === 'protagonist'),
    storyContext,
    theme: storyContext.thematicCore,
    format,
    genre
  });
  artifacts.push(...(protagonistResult.artifacts || []));

  // Task 3: Antagonist and Supporting Profiles
  ctx.log('info', 'Creating antagonist and supporting character profiles');
  const supportingResult = await ctx.task(supportingProfiles, {
    characters: identificationResult.characters.filter(c => c.role !== 'protagonist'),
    protagonistProfile: protagonistResult.profile,
    storyContext,
    relationships: identificationResult.relationships,
    format,
    genre
  });
  artifacts.push(...(supportingResult.artifacts || []));

  // Task 4: Relationship Dynamics
  ctx.log('info', 'Mapping character relationship dynamics');
  const relationshipResult = await ctx.task(relationshipDynamics, {
    allCharacters: {
      protagonist: protagonistResult,
      antagonist: supportingResult.antagonist,
      supporting: supportingResult.supportingCharacters
    },
    storyOutline: storyContext.outline,
    format
  });
  artifacts.push(...(relationshipResult.artifacts || []));

  // Task 5: Visual Character Design
  ctx.log('info', 'Creating visual character designs');
  const visualResult = await ctx.task(visualCharacterDesign, {
    characters: {
      protagonist: protagonistResult.profile,
      antagonist: supportingResult.antagonist,
      supporting: supportingResult.supportingCharacters
    },
    genre,
    setting: storyContext.setting,
    period: storyContext.period
  });
  artifacts.push(...(visualResult.artifacts || []));

  // Task 6: Compile Character Bible
  ctx.log('info', 'Compiling character bible');
  const bibleResult = await ctx.task(compileCharacterBible, {
    allCharacters: {
      protagonist: protagonistResult,
      antagonist: supportingResult.antagonist,
      supporting: supportingResult.supportingCharacters
    },
    relationships: relationshipResult,
    visualDesigns: visualResult.characterDesigns,
    format,
    outputDir
  });
  artifacts.push(...(bibleResult.artifacts || []));

  // Breakpoint: Character Review
  await ctx.breakpoint({
    question: `Character bible complete with ${identificationResult.characters.length} characters. Protagonist, antagonist, and supporting characters profiled with visual designs. Review and approve?`,
    title: 'Character Bible Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        totalCharacters: identificationResult.characters.length,
        mainCharacters: [protagonistResult.profile?.name, supportingResult.antagonist?.name].filter(Boolean),
        supportingCount: supportingResult.supportingCharacters?.length || 0,
        keyRelationships: relationshipResult.dynamics?.centralRelationship
      }
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    characters: {
      protagonist: protagonistResult,
      antagonist: supportingResult.antagonist,
      supporting: supportingResult.supportingCharacters,
      relationships: relationshipResult,
      visualDesigns: visualResult.characterDesigns
    },
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'film-tv-production/character-creation',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task Definitions

export const characterIdentification = defineTask('character-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify all story characters',
  agent: {
    name: 'character-designer-agent',
    skills: ['SK-FTV-004', 'SK-FTV-007', 'SK-FTV-012'],
    prompt: {
      role: 'Character Architect',
      task: 'Identify and categorize all characters needed for this story',
      context: args,
      instructions: [
        'Identify the protagonist(s)',
        'Identify the antagonist(s)',
        'List all supporting characters with significant roles',
        'List minor characters needed for specific scenes',
        'Categorize by importance: lead, supporting, recurring, day-player',
        'For TV: note series regulars vs. guest stars',
        'Identify character relationships and dynamics',
        'Note any ensemble dynamics',
        'Flag characters that serve similar functions (potential consolidation)',
        'Consider diversity and representation authentically'
      ],
      outputFormat: 'JSON with characters array, relationships array, ensembleNotes string, consolidationSuggestions array'
    },
    outputSchema: {
      type: 'object',
      required: ['characters', 'relationships'],
      properties: {
        characters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              role: { type: 'string', enum: ['protagonist', 'antagonist', 'supporting', 'minor'] },
              importance: { type: 'string', enum: ['lead', 'supporting', 'recurring', 'guest', 'day-player'] },
              function: { type: 'string' },
              briefDescription: { type: 'string' },
              scenesAppearing: { type: 'array', items: { type: 'number' } },
              estimatedScreenTime: { type: 'string' }
            }
          }
        },
        relationships: { type: 'array' },
        ensembleNotes: { type: 'string' },
        consolidationSuggestions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'character', 'identification']
}));

export const protagonistProfile = defineTask('protagonist-profile', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create detailed protagonist profile',
  agent: {
    name: 'character-designer-agent',
    skills: ['SK-FTV-004', 'SK-FTV-007', 'SK-FTV-012'],
    prompt: {
      role: 'Character Psychologist',
      task: 'Create a comprehensive psychological and biographical profile for the protagonist',
      context: args,
      instructions: [
        'Apply the CHARACTER framework:',
        '',
        'C - Core: Define fundamental nature, values, moral code, worldview',
        'H - History: Create detailed backstory, formative experiences, wounds',
        'A - Ambition: Define conscious goals, unconscious desires, needs vs. wants',
        'R - Relationships: Key relationships, attachment style, trust issues',
        'A - Arc: Character transformation, what they learn, how they change',
        'C - Contradiction: Internal conflicts, flaws, blind spots, complexity',
        'T - Talk: Speech patterns, vocabulary, verbal quirks, silence',
        'E - Exterior: Physical appearance, mannerisms, body language',
        'R - Resonance: Theme embodied, universal truth represented',
        '',
        'Create a three-dimensional character with depth and complexity',
        'Ensure flaws are meaningful to the story, not just quirks',
        'Define the "ghost" - the backstory wound driving behavior',
        'Articulate the character\'s lie they believe vs. truth they\'ll learn'
      ],
      outputFormat: 'JSON with profile object, arc object, voice object, thematicResonance string, artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['profile', 'arc', 'voice'],
      properties: {
        profile: { type: 'object' },
        arc: { type: 'object' },
        voice: { type: 'object' },
        thematicResonance: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'character', 'protagonist']
}));

export const supportingProfiles = defineTask('supporting-profiles', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create supporting character profiles',
  agent: {
    name: 'character-designer-agent',
    skills: ['SK-FTV-004', 'SK-FTV-007', 'SK-FTV-012'],
    prompt: {
      role: 'Character Ensemble Designer',
      task: 'Create detailed profiles for antagonist and supporting characters',
      context: args,
      instructions: [
        'For the ANTAGONIST:',
        '- They should be a dark mirror or foil to protagonist',
        '- Give them understandable (if not sympathetic) motivations',
        '- They should believe they are the hero of their own story',
        '- Create as much depth as the protagonist',
        '',
        'For SUPPORTING CHARACTERS:',
        '- Each should have a distinct function and voice',
        '- Avoid redundant characters',
        '- Give them their own goals (not just serving protagonist)',
        '- Consider archetypes: mentor, ally, love interest, trickster, etc.',
        '',
        'For ALL characters:',
        '- Ensure distinct voices (could you identify speaker without attribution?)',
        '- Create meaningful relationships that evolve',
        '- Consider how they challenge or support protagonist\'s arc',
        '- Apply CHARACTER framework at appropriate depth for importance'
      ],
      outputFormat: 'JSON with antagonist object, supportingCharacters array, artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['antagonist', 'supportingCharacters'],
      properties: {
        antagonist: { type: 'object' },
        supportingCharacters: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'character', 'supporting']
}));

export const relationshipDynamics = defineTask('relationship-dynamics', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Map character relationship dynamics',
  agent: {
    name: 'character-designer-agent',
    skills: ['SK-FTV-004', 'SK-FTV-007', 'SK-FTV-012'],
    prompt: {
      role: 'Relationship Architect',
      task: 'Create detailed relationship maps and dynamics between all characters',
      context: args,
      instructions: [
        'Map all significant character relationships',
        'For each relationship, define:',
        '- Current state at story start',
        '- History between characters',
        '- Source of connection',
        '- Source of conflict/tension',
        '- Power dynamic',
        '- Evolution through the story',
        '- Key relationship scenes',
        '',
        'Consider:',
        '- How relationships pressure character change',
        '- Subtext in interactions',
        '- Unspoken tensions',
        '- Alliances and betrayals',
        '- Love triangles or complex dynamics',
        '',
        'For TV series: note how relationships can sustain ongoing drama'
      ],
      outputFormat: 'JSON with relationships array, dynamics object, seriesPotential string, artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['relationships', 'dynamics'],
      properties: {
        relationships: { type: 'array' },
        dynamics: { type: 'object' },
        seriesPotential: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'character', 'relationships']
}));

export const visualCharacterDesign = defineTask('visual-character-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create visual character designs',
  agent: {
    name: 'character-designer-agent',
    skills: ['SK-FTV-004', 'SK-FTV-007', 'SK-FTV-012'],
    prompt: {
      role: 'Visual Character Designer',
      task: 'Create detailed visual descriptions and image generation prompts for all characters',
      context: args,
      instructions: [
        'For each main character, create:',
        '',
        '1. Physical Description:',
        '- Height, build, body type',
        '- Face shape, features, skin tone',
        '- Hair color, style, texture',
        '- Eye color, distinctive features',
        '- Age appearance, distinguishing marks',
        '',
        '2. Wardrobe/Costume:',
        '- Default/signature look',
        '- Style influences',
        '- Key costume pieces',
        '- Color palette',
        '- Accessories',
        '',
        '3. Image Generation Prompts:',
        '- Character portrait prompt',
        '- Full body reference prompt',
        '- Action pose prompt',
        '- Multiple emotion expressions',
        '',
        'Optimize prompts for Midjourney/DALL-E/Stable Diffusion',
        'Include style references where helpful',
        'Note any VFX requirements (prosthetics, aging, etc.)'
      ],
      outputFormat: 'JSON with characterDesigns array, styleGuide object, artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['characterDesigns'],
      properties: {
        characterDesigns: { type: 'array' },
        styleGuide: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'character', 'visual']
}));

export const compileCharacterBible = defineTask('compile-character-bible', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compile character bible',
  agent: {
    name: 'character-designer-agent',
    skills: ['SK-FTV-004', 'SK-FTV-007', 'SK-FTV-012'],
    prompt: {
      role: 'Character Bible Compiler',
      task: 'Compile all character materials into organized deliverable files',
      context: args,
      instructions: [
        'Create the following structure:',
        '',
        'characters/',
        '├── character-bible.md (master document)',
        '├── relationship-map.md',
        '├── [protagonist-name]/',
        '│   ├── profile.md',
        '│   ├── arc.md',
        '│   └── visual-reference.md (image prompts)',
        '├── [antagonist-name]/',
        '│   └── ...',
        '└── [supporting-character]/',
        '    └── ...',
        '',
        'Each file should be:',
        '- Comprehensive and standalone',
        '- Formatted for easy reference during writing',
        '- Include quick-reference sheets for voice/dialogue',
        '- Include visual prompts for AI generation'
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
  labels: ['agent', 'documentation', 'character', 'compilation']
}));
