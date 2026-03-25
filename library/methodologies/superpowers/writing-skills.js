/**
 * @process methodologies/superpowers/writing-skills
 * @description Writing Skills - TDD for process documentation: write pressure tests, watch agents fail, write the skill, watch them pass
 * @inputs { skillName: string, triggerConditions: string, pressureScenarios?: array, skillsDir?: string }
 * @outputs { success: boolean, skillPath: string, pressureResults: object, loopholesClosed: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// AGENT TASK DEFINITIONS
// ============================================================================

const agentWritePressureTestTask = defineTask('skill-write-pressure-test', async (args, ctx) => {
  return { test: args };
}, {
  kind: 'agent',
  title: 'Write Pressure Test Scenario',
  labels: ['superpowers', 'writing-skills', 'pressure-testing'],
  io: {
    inputs: { skillName: 'string', triggerConditions: 'string', scenario: 'object' },
    outputs: { testPrompt: 'string', expectedViolation: 'string', testId: 'string' }
  }
});

const agentRunRedPhaseTask = defineTask('skill-run-red-phase', async (args, ctx) => {
  return { result: args };
}, {
  kind: 'agent',
  title: 'RED Phase: Verify Agent Fails Without Skill',
  labels: ['superpowers', 'writing-skills', 'red-phase'],
  io: {
    inputs: { testPrompt: 'string', expectedViolation: 'string', skillName: 'string' },
    outputs: { violated: 'boolean', agentOutput: 'string', violationEvidence: 'string' }
  }
});

const agentWriteSkillDocTask = defineTask('skill-write-document', async (args, ctx) => {
  return { skill: args };
}, {
  kind: 'agent',
  title: 'Write SKILL.md Document',
  labels: ['superpowers', 'writing-skills', 'documentation'],
  io: {
    inputs: { skillName: 'string', triggerConditions: 'string', pressureResults: 'array', skillsDir: 'string' },
    outputs: { skillPath: 'string', content: 'string', committed: 'boolean' }
  }
});

const agentRunGreenPhaseTask = defineTask('skill-run-green-phase', async (args, ctx) => {
  return { result: args };
}, {
  kind: 'agent',
  title: 'GREEN Phase: Verify Agent Complies With Skill',
  labels: ['superpowers', 'writing-skills', 'green-phase'],
  io: {
    inputs: { testPrompt: 'string', skillPath: 'string', skillName: 'string' },
    outputs: { complied: 'boolean', agentOutput: 'string', complianceEvidence: 'string' }
  }
});

const agentCloseLoopholesTask = defineTask('skill-close-loopholes', async (args, ctx) => {
  return { refinement: args };
}, {
  kind: 'agent',
  title: 'REFACTOR Phase: Close Loopholes in Skill',
  labels: ['superpowers', 'writing-skills', 'refactoring'],
  io: {
    inputs: { skillPath: 'string', greenResults: 'array', skillName: 'string' },
    outputs: { loopholes: 'array', skillUpdated: 'boolean', updatedContent: 'string' }
  }
});

// ============================================================================
// MAIN PROCESS
// ============================================================================

/**
 * Writing Skills Process
 *
 * Writing skills IS Test-Driven Development applied to process documentation:
 *
 * | TDD Concept    | Skill Creation                       |
 * |----------------|--------------------------------------|
 * | Test case      | Pressure scenario with subagent      |
 * | Production code| Skill document (SKILL.md)            |
 * | RED            | Agent violates rule without skill    |
 * | GREEN          | Agent complies with skill present    |
 * | REFACTOR       | Close loopholes                      |
 *
 * Core principle: If you did not watch an agent fail without the skill,
 * you do not know if the skill teaches the right thing.
 *
 * Skill Structure:
 * - YAML frontmatter: `name` and `description` only
 * - Description: "Use when..." (triggering conditions only)
 * - Flat namespace, separate files only for heavy reference
 *
 * Attribution: Adapted from https://github.com/pcvelz/superpowers
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.skillName - Name for the new skill
 * @param {string} inputs.triggerConditions - "Use when..." description
 * @param {Array} inputs.pressureScenarios - Scenarios to pressure test
 * @param {string} inputs.skillsDir - Directory for skills (default: 'skills')
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Skill creation results with TDD evidence
 */
export async function process(inputs, ctx) {
  const {
    skillName,
    triggerConditions,
    pressureScenarios = [],
    skillsDir = 'skills'
  } = inputs;

  ctx.log('Starting Writing Skills (TDD for Skills)', { skillName });

  // ============================================================================
  // STEP 1: WRITE PRESSURE TESTS
  // ============================================================================

  ctx.log('Step 1: Writing pressure test scenarios');

  const scenarios = pressureScenarios.length > 0 ? pressureScenarios : [
    { description: `Default scenario: task that should trigger ${skillName}`, context: 'general' }
  ];

  const pressureTests = [];

  for (let i = 0; i < scenarios.length; i++) {
    const testResult = await ctx.task(agentWritePressureTestTask, {
      skillName,
      triggerConditions,
      scenario: scenarios[i]
    });

    pressureTests.push(testResult);
  }

  // ============================================================================
  // STEP 2: RED PHASE - Verify agent fails without skill
  // ============================================================================

  ctx.log('Step 2: RED phase - verifying agent violates rule without skill');

  const redResults = [];

  for (let i = 0; i < pressureTests.length; i++) {
    const test = pressureTests[i];

    const redResult = await ctx.task(agentRunRedPhaseTask, {
      testPrompt: test.testPrompt,
      expectedViolation: test.expectedViolation,
      skillName
    });

    redResults.push({
      testId: test.testId,
      violated: redResult.violated,
      evidence: redResult.violationEvidence
    });
  }

  const allViolated = redResults.every(r => r.violated);

  if (!allViolated) {
    await ctx.breakpoint({
      question: `RED phase: Not all pressure tests showed violations without the skill. ${redResults.filter(r => !r.violated).length} tests passed without the skill present. The skill may not be needed, or the pressure tests need adjustment. Continue anyway?`,
      title: 'RED Phase - Incomplete Violations',
      context: { runId: ctx.runId }
    });
  }

  // ============================================================================
  // STEP 3: WRITE THE SKILL DOCUMENT
  // ============================================================================

  ctx.log('Step 3: Writing SKILL.md document');

  const skillDoc = await ctx.task(agentWriteSkillDocTask, {
    skillName,
    triggerConditions,
    pressureResults: redResults,
    skillsDir
  });

  // ============================================================================
  // STEP 4: GREEN PHASE - Verify agent complies with skill
  // ============================================================================

  ctx.log('Step 4: GREEN phase - verifying agent complies with skill present');

  const greenResults = [];

  for (let i = 0; i < pressureTests.length; i++) {
    const test = pressureTests[i];

    const greenResult = await ctx.task(agentRunGreenPhaseTask, {
      testPrompt: test.testPrompt,
      skillPath: skillDoc.skillPath,
      skillName
    });

    greenResults.push({
      testId: test.testId,
      complied: greenResult.complied,
      evidence: greenResult.complianceEvidence
    });
  }

  const allComplied = greenResults.every(r => r.complied);

  if (!allComplied) {
    await ctx.breakpoint({
      question: `GREEN phase: ${greenResults.filter(r => !r.complied).length} tests still failing with the skill present. The skill document needs refinement. Review and adjust.`,
      title: 'GREEN Phase - Skill Not Effective',
      context: { runId: ctx.runId }
    });
  }

  // ============================================================================
  // STEP 5: REFACTOR - Close loopholes
  // ============================================================================

  ctx.log('Step 5: REFACTOR phase - closing loopholes');

  const loopholeResult = await ctx.task(agentCloseLoopholesTask, {
    skillPath: skillDoc.skillPath,
    greenResults,
    skillName
  });

  return {
    success: allViolated && allComplied,
    skillName,
    skillPath: skillDoc.skillPath,
    pressureResults: {
      totalTests: pressureTests.length,
      redPhase: { allViolated, results: redResults },
      greenPhase: { allComplied, results: greenResults }
    },
    loopholesClosed: loopholeResult.loopholes || [],
    metadata: {
      processId: 'methodologies/superpowers/writing-skills',
      attribution: 'https://github.com/pcvelz/superpowers',
      timestamp: ctx.now()
    }
  };
}
