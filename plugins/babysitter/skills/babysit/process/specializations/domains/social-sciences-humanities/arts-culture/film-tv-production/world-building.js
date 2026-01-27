/**
 * @process film-tv-production/world-building
 * @description Creates comprehensive world and production design including locations, props, costumes, and VFX planning for film/TV productions.
 * @inputs { storyContext: object, characters: array, format: string, genre: string, period?: string, outputDir?: string }
 * @outputs { success: boolean, world: object, artifacts: array }
 * @recommendedSkills SK-FTV-008 (world-building), SK-FTV-009 (shot-composition), SK-FTV-012 (genre-analysis-film)
 * @recommendedAgents AG-FTV-004 (world-builder-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    storyContext,
    characters,
    format,
    genre,
    period,
    outputDir = 'world-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: World Overview
  ctx.log('info', 'Establishing world overview and rules');
  const overviewResult = await ctx.task(worldOverview, {
    storyOutline: storyContext.outline,
    genre,
    period,
    format
  });
  artifacts.push(...(overviewResult.artifacts || []));

  // Task 2: Location Design
  ctx.log('info', 'Designing production locations');
  const locationResult = await ctx.task(locationDesign, {
    sceneOutline: storyContext.scenes,
    worldParameters: overviewResult.worldParameters,
    visualStyle: overviewResult.visualStyle,
    genre
  });
  artifacts.push(...(locationResult.artifacts || []));

  // Task 3: Props and Set Dressing
  ctx.log('info', 'Designing props and set dressing');
  const propsResult = await ctx.task(propsDesign, {
    sceneOutline: storyContext.scenes,
    locations: locationResult.locations,
    characters,
    worldParameters: overviewResult.worldParameters,
    genre,
    period
  });
  artifacts.push(...(propsResult.artifacts || []));

  // Task 4: Costume Design
  ctx.log('info', 'Designing character costumes');
  const costumeResult = await ctx.task(costumeDesign, {
    characters,
    sceneOutline: storyContext.scenes,
    worldParameters: overviewResult.worldParameters,
    visualStyle: overviewResult.visualStyle,
    genre,
    period
  });
  artifacts.push(...(costumeResult.artifacts || []));

  // Task 5: VFX Planning
  ctx.log('info', 'Planning visual effects');
  const vfxResult = await ctx.task(vfxPlanning, {
    sceneOutline: storyContext.scenes,
    locations: locationResult.locations,
    worldParameters: overviewResult.worldParameters,
    genre
  });
  artifacts.push(...(vfxResult.artifacts || []));

  // Task 6: Compile World Bible
  ctx.log('info', 'Compiling world bible and production design package');
  const bibleResult = await ctx.task(compileWorldBible, {
    worldOverview: overviewResult,
    locations: locationResult.locations,
    props: propsResult,
    costumes: costumeResult.characterWardrobes,
    vfx: vfxResult,
    outputDir
  });
  artifacts.push(...(bibleResult.artifacts || []));

  // Breakpoint: World Review
  await ctx.breakpoint({
    question: `World building complete with ${locationResult.totalLocations} locations and ${vfxResult.summary?.totalShots || 0} VFX shots planned. Review world bible and production design?`,
    title: 'World Building Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' })),
      summary: {
        totalLocations: locationResult.totalLocations,
        heroProps: propsResult.heroProps?.length || 0,
        characterWardrobes: costumeResult.characterWardrobes?.length || 0,
        vfxShots: vfxResult.summary?.totalShots || 0,
        worldStyle: overviewResult.visualStyle?.overallAesthetic
      }
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    world: {
      parameters: overviewResult.worldParameters,
      visualStyle: overviewResult.visualStyle,
      locations: locationResult.locations,
      props: propsResult,
      costumes: costumeResult.characterWardrobes,
      vfx: vfxResult
    },
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'film-tv-production/world-building',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task Definitions

export const worldOverview = defineTask('world-overview', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Establish world overview and rules',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'World Architect',
      task: 'Establish the comprehensive world overview for the production',
      context: args,
      instructions: [
        'Define the world parameters:',
        '',
        '1. Setting Overview:',
        '- Time period (historical, contemporary, future)',
        '- Geographic location(s)',
        '- Social/political context',
        '- Economic conditions',
        '- Technology level',
        '',
        '2. World Rules (especially for genre pieces):',
        '- What\'s possible/impossible',
        '- Magic/technology systems (if applicable)',
        '- Social hierarchies',
        '- Cultural norms',
        '',
        '3. Visual World:',
        '- Overall aesthetic',
        '- Color palette for the world',
        '- Architecture style',
        '- Environmental mood',
        '',
        '4. Sensory World:',
        '- Soundscape',
        '- Weather/climate',
        '- Textures and materials',
        '',
        'Ensure internal consistency',
        'Note how world reflects/contrasts with theme'
      ],
      outputFormat: 'JSON with worldParameters object, worldRules object, visualStyle object, sensoryWorld object, thematicConnection string, artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['worldParameters', 'visualStyle'],
      properties: {
        worldParameters: { type: 'object' },
        worldRules: { type: 'object' },
        visualStyle: { type: 'object' },
        sensoryWorld: { type: 'object' },
        thematicConnection: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'world', 'overview']
}));

export const locationDesign = defineTask('location-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design production locations',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Production Designer - Locations',
      task: 'Design detailed location descriptions for all settings in the script',
      context: args,
      instructions: [
        'For each unique location in the story:',
        '',
        '1. Location Profile:',
        '- Name and type (INT/EXT)',
        '- Geographic placement in the world',
        '- Purpose in the story',
        '- Scenes using this location',
        '',
        '2. Physical Description:',
        '- Size and scale',
        '- Architecture/structure',
        '- Key features and focal points',
        '- Entry/exit points',
        '- Sight lines and depth',
        '',
        '3. Atmosphere:',
        '- Lighting (natural/artificial)',
        '- Color palette specific to location',
        '- Textures and materials',
        '- Sound environment',
        '- Emotional mood',
        '',
        '4. Production Notes:',
        '- Set vs. location considerations',
        '- Practical effects needed',
        '- VFX requirements',
        '- Day/night variations',
        '',
        '5. AI Image Generation Prompt:',
        '- Detailed prompt for location visualization',
        '- Multiple angles/moods if needed'
      ],
      outputFormat: 'JSON with locations array, locationMap string, totalLocations number, artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['locations'],
      properties: {
        locations: { type: 'array' },
        locationMap: { type: 'string' },
        totalLocations: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'world', 'locations']
}));

export const propsDesign = defineTask('props-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design props and set dressing',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Props Master',
      task: 'Create comprehensive props list and set dressing specifications',
      context: args,
      instructions: [
        'Create three categories of props:',
        '',
        '1. HERO PROPS (featured/important):',
        '- Items crucial to plot',
        '- Character signature items',
        '- MacGuffins',
        '- Detailed description and specifications',
        '- Multiple angle image prompts',
        '',
        '2. ACTION PROPS (used by characters):',
        '- Weapons, tools, devices',
        '- Documents, phones, keys',
        '- Food and beverages',
        '- Personal items',
        '',
        '3. SET DRESSING:',
        '- Background items by location',
        '- Period-appropriate details',
        '- Environmental storytelling elements',
        '- Texture and depth additions',
        '',
        'For each prop:',
        '- Description and specifications',
        '- When/where it appears',
        '- Who interacts with it',
        '- Period accuracy notes',
        '- Image generation prompt',
        '',
        'Create master props list organized by scene'
      ],
      outputFormat: 'JSON with heroProps array, actionProps array, setDressing array, masterPropsList array, artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['heroProps', 'actionProps', 'setDressing'],
      properties: {
        heroProps: { type: 'array' },
        actionProps: { type: 'array' },
        setDressing: { type: 'array' },
        masterPropsList: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'world', 'props']
}));

export const costumeDesign = defineTask('costume-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design character costumes',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Costume Designer',
      task: 'Create comprehensive wardrobe design for all characters',
      context: args,
      instructions: [
        'For each character create:',
        '',
        '1. COSTUME CONCEPT:',
        '- Overall style direction',
        '- Color palette',
        '- Silhouette',
        '- Character expression through clothing',
        '- Arc through wardrobe (if they change)',
        '',
        '2. HERO LOOKS (signature outfits):',
        '- Full description',
        '- Key pieces',
        '- Accessories',
        '- Styling notes',
        '- Image generation prompt',
        '',
        '3. SCENE-BY-SCENE BREAKDOWN:',
        '- What they wear in each scene',
        '- Continuity notes',
        '- Costume changes',
        '- Damage/aging notes',
        '',
        '4. PRODUCTION NOTES:',
        '- Multiples needed',
        '- Special construction',
        '- Period accuracy',
        '- Stunt considerations',
        '',
        'Consider:',
        '- How costumes distinguish characters',
        '- How costumes support story/theme',
        '- Practical movement requirements',
        '- Visual contrast between characters'
      ],
      outputFormat: 'JSON with characterWardrobes array, overallPalette array, visualContrasts array, artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['characterWardrobes'],
      properties: {
        characterWardrobes: { type: 'array' },
        overallPalette: { type: 'array', items: { type: 'string' } },
        visualContrasts: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'world', 'costumes']
}));

export const vfxPlanning = defineTask('vfx-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan visual effects',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'VFX Supervisor',
      task: 'Create comprehensive VFX breakdown and planning',
      context: args,
      instructions: [
        'Identify and plan all VFX requirements:',
        '',
        '1. INVISIBLE VFX:',
        '- Set extensions',
        '- Sky replacements',
        '- Wire/rig removal',
        '- Cleanup work',
        '',
        '2. ENVIRONMENT VFX:',
        '- CG environments',
        '- Weather effects',
        '- Day-for-night',
        '- Period modifications',
        '',
        '3. CREATURE/CHARACTER VFX:',
        '- CG characters',
        '- Digital doubles',
        '- Prosthetic augmentation',
        '- De-aging/aging',
        '',
        '4. ACTION/EFFECTS VFX:',
        '- Explosions, fire, water',
        '- Magic/powers',
        '- Destruction',
        '- Vehicle work',
        '',
        'For each VFX shot:',
        '- Scene and shot number',
        '- Description of effect',
        '- Complexity rating',
        '- Approach recommendation',
        '- Reference images/style',
        '- AI video generation prompt'
      ],
      outputFormat: 'JSON with vfxShots array, summary object, technicalRequirements array, artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['vfxShots', 'summary'],
      properties: {
        vfxShots: { type: 'array' },
        summary: { type: 'object' },
        technicalRequirements: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'world', 'vfx']
}));

export const compileWorldBible = defineTask('compile-world-bible', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compile world bible and production design package',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'World Bible Compiler',
      task: 'Compile all world-building materials into organized deliverable files',
      context: args,
      instructions: [
        'Create the following structure:',
        '',
        'world/',
        '├── world-bible.md (master document)',
        '├── locations/',
        '│   ├── location-master.md',
        '│   └── [location-name].md',
        '├── props/',
        '│   └── props-master-list.md',
        '└── costumes/',
        '    └── wardrobe-breakdown.md',
        '',
        'production/',
        '├── production-bible.md',
        '├── breakdown-sheets/',
        '│   └── ... (per scene)',
        '└── vfx-breakdown.md',
        '',
        'Each file should include:',
        '- Comprehensive information',
        '- AI image generation prompts where applicable',
        '- Production-ready formatting'
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
  labels: ['agent', 'documentation', 'world', 'compilation']
}));
