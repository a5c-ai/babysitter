/**
 * @process methodologies/superpowers/using-superpowers
 * @description Using Superpowers - Meta-skill for skill discovery: scan available skills, match to task, invoke before any response
 * @inputs { task: string, skillsDir?: string, forceSkill?: string }
 * @outputs { success: boolean, matchedSkills: array, selectedSkill: object, invoked: boolean }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// AGENT TASK DEFINITIONS
// ============================================================================

const agentScanSkillsTask = defineTask('superpowers-scan-skills', async (args, ctx) => {
  return { skills: args };
}, {
  kind: 'agent',
  title: 'Scan Available Skills',
  labels: ['superpowers', 'meta-skill', 'discovery'],
  io: {
    inputs: { skillsDir: 'string', projectRoot: 'string' },
    outputs: { skills: 'array', totalSkills: 'number', categories: 'object' }
  }
});

const agentMatchSkillsTask = defineTask('superpowers-match-skills', async (args, ctx) => {
  return { matches: args };
}, {
  kind: 'agent',
  title: 'Match Task to Available Skills',
  labels: ['superpowers', 'meta-skill', 'matching'],
  io: {
    inputs: { task: 'string', skills: 'array' },
    outputs: { matchedSkills: 'array', primarySkill: 'object', confidence: 'number', reasoning: 'string' }
  }
});

const agentClassifySkillTypeTask = defineTask('superpowers-classify-skill', async (args, ctx) => {
  return { classification: args };
}, {
  kind: 'agent',
  title: 'Classify Skill Type (Rigid vs Flexible)',
  labels: ['superpowers', 'meta-skill', 'classification'],
  io: {
    inputs: { skill: 'object', task: 'string' },
    outputs: { type: 'string', followExactly: 'boolean', adaptationNotes: 'string' }
  }
});

const agentPrepareInvocationTask = defineTask('superpowers-prepare-invocation', async (args, ctx) => {
  return { invocation: args };
}, {
  kind: 'agent',
  title: 'Prepare Skill Invocation',
  labels: ['superpowers', 'meta-skill', 'invocation'],
  io: {
    inputs: { skill: 'object', task: 'string', classification: 'object' },
    outputs: { processPath: 'string', inputs: 'object', instructions: 'string', invoked: 'boolean' }
  }
});

// ============================================================================
// MAIN PROCESS
// ============================================================================

/**
 * Using Superpowers Process (Meta-Skill)
 *
 * The Rule: Check for applicable skills before any task.
 * Skills are mandatory workflows, not suggestions.
 *
 * Skill Priority:
 * 1. Process skills first (brainstorming, debugging) - determine HOW to approach
 * 2. Implementation skills second - guide execution
 *
 * Skill Types:
 * - Rigid (TDD, debugging) - Follow exactly
 * - Flexible (patterns) - Adapt principles to context
 *
 * Red Flags:
 * - "This is just a simple question" - questions are tasks, check for skills
 * - "I need more context first" - skill check comes BEFORE clarifying questions
 * - "The skill is overkill" - simple things become complex, use it
 *
 * Attribution: Adapted from https://github.com/pcvelz/superpowers
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.task - The task or question to find skills for
 * @param {string} inputs.skillsDir - Directory containing skills (auto-detected if not provided)
 * @param {string} inputs.forceSkill - Force a specific skill by name
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Skill discovery and invocation results
 */
export async function process(inputs, ctx) {
  const {
    task,
    skillsDir = null,
    forceSkill = null
  } = inputs;

  ctx.log('Starting Using Superpowers (Meta-Skill)', { task });
  ctx.log('RULE: Check for applicable skills BEFORE any response or action.');

  // ============================================================================
  // STEP 1: SCAN AVAILABLE SKILLS
  // ============================================================================

  ctx.log('Step 1: Scanning available skills');

  const scanResult = await ctx.task(agentScanSkillsTask, {
    skillsDir: skillsDir || 'skills',
    projectRoot: ctx.runDir
  });

  ctx.log('Skills found', { totalSkills: scanResult.totalSkills });

  // ============================================================================
  // STEP 2: MATCH TASK TO SKILLS
  // ============================================================================

  ctx.log('Step 2: Matching task to available skills');

  let matchResult;

  if (forceSkill) {
    const forcedSkill = (scanResult.skills || []).find(s => s.name === forceSkill);
    matchResult = {
      matchedSkills: forcedSkill ? [forcedSkill] : [],
      primarySkill: forcedSkill || null,
      confidence: forcedSkill ? 1.0 : 0,
      reasoning: forcedSkill ? `Forced skill: ${forceSkill}` : `Skill "${forceSkill}" not found`
    };
  } else {
    matchResult = await ctx.task(agentMatchSkillsTask, {
      task,
      skills: scanResult.skills || []
    });
  }

  if (!matchResult.primarySkill) {
    ctx.log('No matching skill found', { task });
    return {
      success: false,
      task,
      matchedSkills: [],
      selectedSkill: null,
      invoked: false,
      reason: 'No matching skill found for this task',
      metadata: {
        processId: 'methodologies/superpowers/using-superpowers',
        attribution: 'https://github.com/pcvelz/superpowers',
        timestamp: ctx.now()
      }
    };
  }

  // ============================================================================
  // STEP 3: CLASSIFY SKILL TYPE
  // ============================================================================

  ctx.log('Step 3: Classifying skill type', { skill: matchResult.primarySkill.name });

  const classification = await ctx.task(agentClassifySkillTypeTask, {
    skill: matchResult.primarySkill,
    task
  });

  // ============================================================================
  // STEP 4: PREPARE AND INVOKE
  // ============================================================================

  ctx.log('Step 4: Preparing skill invocation', {
    type: classification.type,
    followExactly: classification.followExactly
  });

  const invocation = await ctx.task(agentPrepareInvocationTask, {
    skill: matchResult.primarySkill,
    task,
    classification
  });

  return {
    success: true,
    task,
    matchedSkills: matchResult.matchedSkills || [],
    selectedSkill: {
      name: matchResult.primarySkill.name,
      confidence: matchResult.confidence,
      type: classification.type,
      followExactly: classification.followExactly,
      adaptationNotes: classification.adaptationNotes
    },
    invoked: invocation.invoked,
    processPath: invocation.processPath,
    instructions: invocation.instructions,
    metadata: {
      processId: 'methodologies/superpowers/using-superpowers',
      attribution: 'https://github.com/pcvelz/superpowers',
      timestamp: ctx.now()
    }
  };
}
