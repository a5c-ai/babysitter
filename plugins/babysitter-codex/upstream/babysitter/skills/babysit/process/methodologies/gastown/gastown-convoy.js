/**
 * @process methodologies/gastown/gastown-convoy
 * @description Gas Town Convoy Lifecycle - Create, assign, track, and land convoys of related beads (atomic work units)
 * @inputs { goal: string, beadSpecs?: array, agentPool?: array, trackingMode?: string, landingStrategy?: string }
 * @outputs { success: boolean, convoyId: string, beads: array, completedBeads: array, landingResult: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// AGENT TASK DEFINITIONS
// ============================================================================

const decomposeWorkTask = defineTask('gastown-decompose-work', async (args, _ctx) => {
  return { decomposition: args };
}, {
  kind: 'agent',
  title: 'Decompose Goal into Beads',
  labels: ['gastown', 'convoy', 'decomposition'],
  io: {
    inputs: { goal: 'string', projectContext: 'object', constraints: 'array' },
    outputs: { beads: 'array', wisps: 'array', dependencies: 'object', estimatedEffort: 'object' }
  }
});

const createBeadsTask = defineTask('gastown-create-beads', async (args, _ctx) => {
  return { beads: args };
}, {
  kind: 'agent',
  title: 'Create Git-Backed Bead Work Units',
  labels: ['gastown', 'convoy', 'beads'],
  io: {
    inputs: { beadSpecs: 'array', convoyId: 'string', gitBranch: 'string' },
    outputs: { beads: 'array', hooks: 'array', issueRefs: 'array', branchNames: 'array' }
  }
});

const assignToAgentsTask = defineTask('gastown-assign-agents', async (args, _ctx) => {
  return { assignments: args };
}, {
  kind: 'agent',
  title: 'Assign Beads to Available Agents',
  labels: ['gastown', 'convoy', 'assignment'],
  io: {
    inputs: { beads: 'array', agentPool: 'array', dependencies: 'object', skillRequirements: 'object' },
    outputs: { assignments: 'array', unassigned: 'array', loadBalance: 'object', feedMessages: 'array' }
  }
});

const trackProgressTask = defineTask('gastown-track-progress', async (args, _ctx) => {
  return { tracking: args };
}, {
  kind: 'agent',
  title: 'Track Bead Progress and Agent Status',
  labels: ['gastown', 'convoy', 'tracking'],
  io: {
    inputs: { convoyId: 'string', assignments: 'array', trackingMode: 'string' },
    outputs: { completed: 'array', inProgress: 'array', blocked: 'array', percentComplete: 'number', timeline: 'object' }
  }
});

const verifyCompletionTask = defineTask('gastown-verify-completion', async (args, _ctx) => {
  return { verification: args };
}, {
  kind: 'agent',
  title: 'Verify All Beads Complete and Tests Pass',
  labels: ['gastown', 'convoy', 'verification'],
  io: {
    inputs: { convoyId: 'string', completedBeads: 'array', qualityCriteria: 'object' },
    outputs: { allComplete: 'boolean', testResults: 'object', qualityScore: 'number', blockers: 'array' }
  }
});

const landConvoyTask = defineTask('gastown-land-convoy', async (args, _ctx) => {
  return { landing: args };
}, {
  kind: 'agent',
  title: 'Land Convoy - Merge All Bead Branches',
  labels: ['gastown', 'convoy', 'landing'],
  io: {
    inputs: { convoyId: 'string', beadBranches: 'array', targetBranch: 'string', landingStrategy: 'string' },
    outputs: { landed: 'boolean', mergeCommit: 'string', conflicts: 'array', attribution: 'object', cleanedWisps: 'array' }
  }
});

// ============================================================================
// MAIN PROCESS
// ============================================================================

/**
 * Gas Town Convoy Lifecycle Process
 *
 * Implements the full convoy lifecycle: decompose work into beads (git-backed
 * atomic units), create and assign them to agents, track progress, verify
 * completion, and land (merge) the convoy. Wisps (ephemeral beads) are
 * destroyed after successful landing.
 *
 * Workflow:
 * 1. Decompose goal into beads and wisps
 * 2. Create git-backed bead work units with hooks
 * 3. Assign beads to agents based on skills and load
 * 4. Track progress with continuous status updates
 * 5. Verify all beads complete with quality checks
 * 6. Land convoy by merging all bead branches
 *
 * Attribution: Adapted from https://github.com/steveyegge/gastown by Steve Yegge
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.goal - What this convoy should accomplish
 * @param {Array} inputs.beadSpecs - Pre-defined bead specifications (optional)
 * @param {Array} inputs.agentPool - Available agents for assignment
 * @param {string} inputs.trackingMode - 'active' or 'passive' monitoring (default: 'active')
 * @param {string} inputs.landingStrategy - 'squash', 'merge', 'rebase' (default: 'squash')
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Convoy results with landing status
 */
export async function process(inputs, ctx) {
  const {
    goal,
    beadSpecs = [],
    agentPool = ['polecat', 'crew-lead'],
    trackingMode = 'active',
    landingStrategy = 'squash'
  } = inputs;

  const convoyId = `convoy-${Date.now()}`;
  ctx.log('Creating convoy', { convoyId, goal });

  // ============================================================================
  // STEP 1: DECOMPOSE WORK
  // ============================================================================

  ctx.log('Step 1: Decomposing goal into beads');

  const decomposition = await ctx.task(decomposeWorkTask, {
    goal,
    projectContext: { projectRoot: inputs.projectRoot || '.', beadSpecs },
    constraints: inputs.constraints || []
  });

  await ctx.breakpoint({
    question: `Convoy ${convoyId}: ${decomposition.beads.length} beads and ${decomposition.wisps.length} wisps identified. Review the decomposition and approve to proceed.`,
    title: 'Bead Decomposition Review',
    context: { runId: ctx.runId }
  });

  // ============================================================================
  // STEP 2: CREATE BEADS
  // ============================================================================

  ctx.log('Step 2: Creating git-backed beads');

  const beadsResult = await ctx.task(createBeadsTask, {
    beadSpecs: decomposition.beads,
    convoyId,
    gitBranch: inputs.baseBranch || 'main'
  });

  // ============================================================================
  // STEP 3: ASSIGN TO AGENTS
  // ============================================================================

  ctx.log('Step 3: Assigning beads to agents');

  const assignments = await ctx.task(assignToAgentsTask, {
    beads: beadsResult.beads,
    agentPool,
    dependencies: decomposition.dependencies,
    skillRequirements: inputs.skillRequirements || {}
  });

  // ============================================================================
  // STEP 4: TRACK PROGRESS
  // ============================================================================

  ctx.log('Step 4: Tracking progress');

  const tracking = await ctx.task(trackProgressTask, {
    convoyId,
    assignments: assignments.assignments,
    trackingMode
  });

  // ============================================================================
  // STEP 5: VERIFY COMPLETION
  // ============================================================================

  ctx.log('Step 5: Verifying completion');

  const verification = await ctx.task(verifyCompletionTask, {
    convoyId,
    completedBeads: tracking.completed,
    qualityCriteria: inputs.qualityCriteria || { testsPass: true, lintClean: true }
  });

  if (!verification.allComplete) {
    await ctx.breakpoint({
      question: `Convoy ${convoyId} verification: ${verification.blockers.length} blockers found. Quality score: ${verification.qualityScore}. Review blockers and decide how to proceed.`,
      title: `Convoy Verification: ${convoyId}`,
      context: { runId: ctx.runId }
    });
  }

  // ============================================================================
  // STEP 6: LAND CONVOY
  // ============================================================================

  ctx.log('Step 6: Landing convoy');

  const landingResult = await ctx.task(landConvoyTask, {
    convoyId,
    beadBranches: beadsResult.branchNames,
    targetBranch: inputs.baseBranch || 'main',
    landingStrategy
  });

  return {
    success: landingResult.landed,
    convoyId,
    beads: beadsResult.beads,
    completedBeads: tracking.completed,
    landingResult: {
      landed: landingResult.landed,
      mergeCommit: landingResult.mergeCommit,
      conflicts: landingResult.conflicts,
      cleanedWisps: landingResult.cleanedWisps
    },
    attribution: landingResult.attribution,
    metadata: {
      processId: 'methodologies/gastown/gastown-convoy',
      attribution: 'https://github.com/steveyegge/gastown',
      author: 'Steve Yegge',
      timestamp: ctx.now()
    }
  };
}
