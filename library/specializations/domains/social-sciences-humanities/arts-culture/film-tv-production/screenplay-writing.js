/**
 * @process film-tv-production/screenplay-writing
 * @description Creates full screenplay with proper industry formatting, dialogue with direction, action lines, and transitions. Outputs in Fountain format.
 * @inputs { storyContext: object, characters: array, sceneOutline: array, format: string, genre: string, outputDir?: string }
 * @outputs { success: boolean, screenplay: object, artifacts: array }
 * @recommendedSkills SK-FTV-003 (scene-writing), SK-FTV-004 (dialogue-crafting), SK-FTV-011 (screenplay-formatting)
 * @recommendedAgents AG-FTV-001 (screenwriter-agent)
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    storyContext,
    characters,
    sceneOutline,
    format,
    genre,
    outputDir = 'screenplay-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  // Task 1: Script Setup
  ctx.log('info', 'Setting up screenplay parameters');
  const setupResult = await ctx.task(scriptSetup, {
    storyContext,
    format,
    genre,
    characters
  });
  artifacts.push(...(setupResult.artifacts || []));

  // Task 2: Write Act 1
  ctx.log('info', 'Writing Act 1 scenes');
  const act1Scenes = sceneOutline.filter(s => s.act === 1 || s.beatReference?.startsWith('1'));
  const act1Result = await ctx.task(writeAct1, {
    actScenes: act1Scenes,
    characters,
    styleGuidelines: setupResult.styleGuidelines,
    genre,
    previousContext: null
  });
  artifacts.push(...(act1Result.artifacts || []));

  // Task 3: Write Act 2A
  ctx.log('info', 'Writing Act 2A scenes');
  const act2aScenes = sceneOutline.filter(s => s.act === '2a' || (s.act === 2 && s.half === 'a'));
  const act2aResult = await ctx.task(writeAct2A, {
    actScenes: act2aScenes.length > 0 ? act2aScenes : sceneOutline.filter(s => s.act === 2).slice(0, Math.ceil(sceneOutline.filter(s => s.act === 2).length / 2)),
    characters,
    styleGuidelines: setupResult.styleGuidelines,
    genre,
    act1Summary: act1Result.actSummary
  });
  artifacts.push(...(act2aResult.artifacts || []));

  // Task 4: Write Act 2B
  ctx.log('info', 'Writing Act 2B scenes');
  const act2bScenes = sceneOutline.filter(s => s.act === '2b' || (s.act === 2 && s.half === 'b'));
  const act2bResult = await ctx.task(writeAct2B, {
    actScenes: act2bScenes.length > 0 ? act2bScenes : sceneOutline.filter(s => s.act === 2).slice(Math.ceil(sceneOutline.filter(s => s.act === 2).length / 2)),
    characters,
    styleGuidelines: setupResult.styleGuidelines,
    genre,
    act2ASummary: act2aResult.actSummary
  });
  artifacts.push(...(act2bResult.artifacts || []));

  // Task 5: Write Act 3
  ctx.log('info', 'Writing Act 3 scenes');
  const act3Scenes = sceneOutline.filter(s => s.act === 3 || s.beatReference?.startsWith('3'));
  const act3Result = await ctx.task(writeAct3, {
    actScenes: act3Scenes,
    characters,
    styleGuidelines: setupResult.styleGuidelines,
    genre,
    act2BSummary: act2bResult.actSummary
  });
  artifacts.push(...(act3Result.artifacts || []));

  // Task 6: Dialogue Polish
  ctx.log('info', 'Polishing dialogue');
  const allScenes = [
    ...act1Result.scenes,
    ...act2aResult.scenes,
    ...act2bResult.scenes,
    ...act3Result.scenes
  ];
  const dialogueResult = await ctx.task(dialoguePolish, {
    screenplay: allScenes,
    characters,
    genre
  });
  artifacts.push(...(dialogueResult.artifacts || []));

  // Task 7: Compile Screenplay
  ctx.log('info', 'Compiling final screenplay');
  const compileResult = await ctx.task(compileScreenplay, {
    titlePage: setupResult.titlePage,
    act1: act1Result,
    act2a: act2aResult,
    act2b: act2bResult,
    act3: act3Result,
    dialogueRevisions: dialogueResult.revisions,
    format,
    outputDir
  });
  artifacts.push(...(compileResult.artifacts || []));

  // Breakpoint: Screenplay Review
  await ctx.breakpoint({
    question: `Screenplay "${setupResult.titlePage?.title || 'Untitled'}" complete at ${compileResult.statistics?.totalPages || 0} pages with ${compileResult.statistics?.sceneCount || 0} scenes. Review and approve?`,
    title: 'Screenplay Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'fountain' })),
      summary: {
        title: setupResult.titlePage?.title,
        pageCount: compileResult.statistics?.totalPages,
        sceneCount: compileResult.statistics?.sceneCount,
        format,
        genre
      }
    }
  });

  const endTime = ctx.now();

  return {
    success: true,
    screenplay: {
      titlePage: setupResult.titlePage,
      statistics: compileResult.statistics,
      fountainContent: compileResult.screenplay?.fountainContent
    },
    artifacts,
    duration: endTime - startTime,
    metadata: {
      processId: 'film-tv-production/screenplay-writing',
      timestamp: startTime,
      outputDir
    }
  };
}

// Task Definitions

export const scriptSetup = defineTask('script-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Set up screenplay parameters',
  agent: {
    name: 'screenwriter-agent',
    skills: ['SK-FTV-003', 'SK-FTV-004', 'SK-FTV-011'],
    prompt: {
      role: 'Script Supervisor',
      task: 'Establish screenplay parameters and create title page',
      context: args,
      instructions: [
        'Create screenplay parameters:',
        '',
        '1. TITLE PAGE:',
        '- Title',
        '- Credit line',
        '- Based on (if applicable)',
        '- Draft date and version',
        '- Contact information placeholder',
        '',
        '2. FORMAT PARAMETERS:',
        '- Format: Feature/TV Pilot/Episode/Short',
        '- Target page count',
        '- Act structure',
        '- Scene numbering scheme',
        '',
        '3. STYLE GUIDELINES:',
        '- Action line voice (active, present tense)',
        '- Dialogue density preferences',
        '- Visual writing approach',
        '- Transition usage',
        '',
        '4. CHARACTER CAPS:',
        '- List all character names as they\'ll appear in ALL CAPS',
        '- Note any nicknames or variations',
        '',
        '5. LOCATION STANDARDIZATION:',
        '- Standardize location names for sluglines',
        '- Note day/night variations'
      ],
      outputFormat: 'JSON with titlePage object, formatParameters object, styleGuidelines object, characterNames array, locations array, artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['titlePage', 'formatParameters', 'styleGuidelines'],
      properties: {
        titlePage: { type: 'object' },
        formatParameters: { type: 'object' },
        styleGuidelines: { type: 'object' },
        characterNames: { type: 'array' },
        locations: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'screenplay', 'setup']
}));

export const writeAct1 = defineTask('write-act-1', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write Act 1 scenes',
  agent: {
    name: 'screenwriter-agent',
    skills: ['SK-FTV-003', 'SK-FTV-004', 'SK-FTV-011'],
    prompt: {
      role: 'Screenwriter',
      task: 'Write all scenes in Act 1 with proper screenplay format',
      context: args,
      instructions: [
        'Write each scene in proper Fountain format:',
        '',
        '1. SLUGLINE (Scene Heading):',
        '- INT. or EXT.',
        '- LOCATION NAME in caps',
        '- Time of day (DAY, NIGHT, CONTINUOUS, LATER)',
        '',
        '2. ACTION LINES:',
        '- Present tense, active voice',
        '- Visual writing—describe what we SEE and HEAR',
        '- Keep paragraphs to 3-4 lines max',
        '- CHARACTER NAMES in CAPS on first appearance',
        '- Use white space for pacing',
        '',
        '3. DIALOGUE:',
        '- CHARACTER NAME centered',
        '- (parentheticals) for tone/direction when necessary',
        '- Don\'t overuse parentheticals',
        '- Dialogue should reveal character and advance plot',
        '- Subtext over on-the-nose',
        '',
        '4. TRANSITIONS:',
        '- Use sparingly: CUT TO:, SMASH CUT TO:, etc.',
        '- Most scene changes are implied cuts',
        '',
        'ACT 1 GOALS:',
        '- Establish world, characters, tone',
        '- Hook the reader in first 10 pages',
        '- Build to inciting incident',
        '- End with protagonist committed to journey',
        '',
        'Output each scene as a separate object in the array'
      ],
      outputFormat: 'JSON with scenes array, actSummary object, artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['scenes', 'actSummary'],
      properties: {
        scenes: { type: 'array' },
        actSummary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'screenplay', 'act1']
}));

export const writeAct2A = defineTask('write-act-2a', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write Act 2A scenes',
  agent: {
    name: 'screenwriter-agent',
    skills: ['SK-FTV-003', 'SK-FTV-004', 'SK-FTV-011'],
    prompt: {
      role: 'Screenwriter',
      task: 'Write all scenes in Act 2A (first half of Act 2) with proper screenplay format',
      context: args,
      instructions: [
        'Continue screenplay in Fountain format',
        '',
        'ACT 2A GOALS:',
        '- "Fun and games" - explore the premise',
        '- Protagonist attempts solutions (and fails)',
        '- Build relationships, stakes, world',
        '- Develop B-story',
        '- Rising action and complications',
        '- Build toward midpoint',
        '',
        'MAINTAIN:',
        '- Consistent character voices',
        '- Visual writing style',
        '- Pacing appropriate to genre',
        '- Scene variety (dialogue vs action)',
        '',
        'Write each scene complete with:',
        '- Slugline',
        '- Action',
        '- Dialogue with parentheticals where needed',
        '- Transitions where appropriate'
      ],
      outputFormat: 'JSON with scenes array, actSummary object, artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['scenes', 'actSummary'],
      properties: {
        scenes: { type: 'array' },
        actSummary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'screenplay', 'act2a']
}));

export const writeAct2B = defineTask('write-act-2b', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write Act 2B scenes',
  agent: {
    name: 'screenwriter-agent',
    skills: ['SK-FTV-003', 'SK-FTV-004', 'SK-FTV-011'],
    prompt: {
      role: 'Screenwriter',
      task: 'Write all scenes in Act 2B (second half of Act 2) with proper screenplay format',
      context: args,
      instructions: [
        'Continue screenplay in Fountain format',
        '',
        'ACT 2B GOALS:',
        '- Post-midpoint consequences',
        '- Stakes intensify',
        '- "Bad guys close in"',
        '- Relationships tested',
        '- Protagonist faces harder choices',
        '- Build to "All Is Lost" moment',
        '- "Dark night of the soul"',
        '',
        'EMOTIONAL ARC:',
        '- Things get worse before they get better',
        '- Strip away false solutions',
        '- Force protagonist toward truth/change',
        '',
        'Maintain pace and tension building toward Act 3'
      ],
      outputFormat: 'JSON with scenes array, actSummary object, artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['scenes', 'actSummary'],
      properties: {
        scenes: { type: 'array' },
        actSummary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'screenplay', 'act2b']
}));

export const writeAct3 = defineTask('write-act-3', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write Act 3 scenes',
  agent: {
    name: 'screenwriter-agent',
    skills: ['SK-FTV-003', 'SK-FTV-004', 'SK-FTV-011'],
    prompt: {
      role: 'Screenwriter',
      task: 'Write all scenes in Act 3 with proper screenplay format',
      context: args,
      instructions: [
        'Continue screenplay in Fountain format',
        '',
        'ACT 3 GOALS:',
        '- Break into three: protagonist commits to final push',
        '- Gathering the team/resources',
        '- Executing the plan',
        '- Climax - final confrontation',
        '- Resolution - new equilibrium',
        '',
        'CLIMAX REQUIREMENTS:',
        '- Protagonist must be active, not passive',
        '- Internal and external conflicts resolve',
        '- Theme crystallizes',
        '- Emotional payoff for journey',
        '',
        'ENDING:',
        '- Satisfy genre expectations',
        '- Complete character arcs',
        '- Final image echoes/contrasts opening',
        '- Leave audience with intended emotion',
        '',
        'Include FADE OUT. and THE END'
      ],
      outputFormat: 'JSON with scenes array, actSummary object, artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['scenes', 'actSummary'],
      properties: {
        scenes: { type: 'array' },
        actSummary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'screenplay', 'act3']
}));

export const dialoguePolish = defineTask('dialogue-polish', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Polish dialogue',
  agent: {
    name: 'screenwriter-agent',
    skills: ['SK-FTV-003', 'SK-FTV-004', 'SK-FTV-011'],
    prompt: {
      role: 'Dialogue Specialist',
      task: 'Review and polish all dialogue for voice, subtext, and impact',
      context: args,
      instructions: [
        'Review all dialogue for:',
        '',
        '1. CHARACTER VOICE:',
        '- Does each character sound distinct?',
        '- Is vocabulary consistent with character?',
        '- Are speech patterns maintained?',
        '- Could you identify speaker without attribution?',
        '',
        '2. SUBTEXT:',
        '- Is meaning conveyed under the surface?',
        '- Are characters saying what they mean directly? (usually bad)',
        '- Is there tension between what\'s said and meant?',
        '',
        '3. ECONOMY:',
        '- Can any lines be cut?',
        '- Is every line earning its place?',
        '- Are any speeches too long?',
        '',
        '4. NATURALISM:',
        '- Does dialogue sound speakable?',
        '- Are there appropriate interruptions, fragments?',
        '- Is it too "written"?',
        '',
        '5. IMPACT:',
        '- Do key lines land?',
        '- Are there memorable lines?',
        '- Does dialogue reveal character under pressure?',
        '',
        'Output revised dialogue with changes noted'
      ],
      outputFormat: 'JSON with revisions array, summary object, artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['revisions', 'summary'],
      properties: {
        revisions: { type: 'array' },
        summary: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'screenplay', 'dialogue']
}));

export const compileScreenplay = defineTask('compile-screenplay', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compile final screenplay',
  agent: {
    name: 'screenwriter-agent',
    skills: ['SK-FTV-003', 'SK-FTV-004', 'SK-FTV-011'],
    prompt: {
      role: 'Script Compiler',
      task: 'Compile all scenes into complete screenplay document',
      context: args,
      instructions: [
        'Compile complete screenplay:',
        '',
        '1. TITLE PAGE (Fountain format)',
        '2. All scenes in order with scene numbers',
        '3. Apply dialogue revisions',
        '4. Ensure consistent formatting',
        '5. Add act breaks for TV format',
        '',
        'Output files:',
        '- [title]-screenplay.fountain (main script)',
        '- [title]-shooting-script.fountain (with scene numbers)',
        '- scenes/scene-XXX.md (individual scenes for reference)',
        '',
        'Include in shooting script:',
        '- Scene numbers',
        '- Page breaks noted',
        '- Revision marks if applicable',
        '',
        'Verify:',
        '- Page count is appropriate for format',
        '- All scenes are present',
        '- Continuity is maintained',
        '- Formatting is industry standard'
      ],
      outputFormat: 'JSON with files array, statistics object, screenplay object, artifacts array'
    },
    outputSchema: {
      type: 'object',
      required: ['files', 'statistics'],
      properties: {
        files: { type: 'array' },
        statistics: { type: 'object' },
        screenplay: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'screenplay', 'compilation']
}));
