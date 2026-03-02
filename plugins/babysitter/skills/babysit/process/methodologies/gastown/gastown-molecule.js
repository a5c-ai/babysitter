/**
 * @process methodologies/gastown/gastown-molecule
 * @description Gas Town Molecule Workflow - Multi-step durable workflow execution from TOML-based Formulas through Protomolecules to active Molecules
 * @inputs { formulaId?: string, formulaSpec?: object, variables?: object, checkpointInterval?: number }
 * @outputs { success: boolean, moleculeId: string, stepsCompleted: number, checkpoints: array, result: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// AGENT TASK DEFINITIONS
// ============================================================================

const defineFormulaTask = defineTask('gastown-define-formula', async (args, _ctx) => {
  return { formula: args };
}, {
  kind: 'agent',
  title: 'Define or Load TOML-Based Formula',
  labels: ['gastown', 'molecule', 'formula'],
  io: {
    inputs: { formulaId: 'string', formulaSpec: 'object', templateLibrary: 'array' },
    outputs: { formula: 'object', steps: 'array', variables: 'object', hooks: 'array', validationResult: 'object' }
  }
});

const cookProtomoleculeTask = defineTask('gastown-cook-protomolecule', async (args, _ctx) => {
  return { proto: args };
}, {
  kind: 'agent',
  title: 'Cook Protomolecule - Freeze Template for Instantiation',
  labels: ['gastown', 'molecule', 'protomolecule'],
  io: {
    inputs: { formula: 'object', variables: 'object', context: 'object' },
    outputs: { protomolecule: 'object', resolvedSteps: 'array', frozenVariables: 'object', hash: 'string' }
  }
});

const instantiateMoleculeTask = defineTask('gastown-instantiate-molecule', async (args, _ctx) => {
  return { molecule: args };
}, {
  kind: 'agent',
  title: 'Instantiate Active Molecule from Protomolecule',
  labels: ['gastown', 'molecule', 'instantiation'],
  io: {
    inputs: { protomolecule: 'object', moleculeId: 'string', durabilityConfig: 'object' },
    outputs: { moleculeId: 'string', state: 'object', currentStep: 'number', totalSteps: 'number', recoverable: 'boolean' }
  }
});

const executeStepTask = defineTask('gastown-execute-step', async (args, _ctx) => {
  return { stepResult: args };
}, {
  kind: 'agent',
  title: 'Execute Single Molecule Step',
  labels: ['gastown', 'molecule', 'execution'],
  io: {
    inputs: { moleculeId: 'string', stepIndex: 'number', stepDef: 'object', previousResults: 'array', variables: 'object' },
    outputs: { success: 'boolean', output: 'object', sideEffects: 'array', duration: 'number', nextStepOverride: 'number' }
  }
});

const checkpointProgressTask = defineTask('gastown-checkpoint', async (args, _ctx) => {
  return { checkpoint: args };
}, {
  kind: 'agent',
  title: 'Checkpoint Molecule Progress for Durability',
  labels: ['gastown', 'molecule', 'checkpoint'],
  io: {
    inputs: { moleculeId: 'string', completedSteps: 'array', state: 'object', stepIndex: 'number' },
    outputs: { checkpointId: 'string', savedAt: 'string', stateHash: 'string', recoveryPoint: 'number' }
  }
});

const completeWorkflowTask = defineTask('gastown-complete-workflow', async (args, _ctx) => {
  return { completion: args };
}, {
  kind: 'agent',
  title: 'Complete Molecule Workflow and Collect Results',
  labels: ['gastown', 'molecule', 'completion'],
  io: {
    inputs: { moleculeId: 'string', allStepResults: 'array', checkpoints: 'array', formula: 'object' },
    outputs: { result: 'object', summary: 'string', artifacts: 'array', duration: 'number', attribution: 'object' }
  }
});

// ============================================================================
// MAIN PROCESS
// ============================================================================

/**
 * Gas Town Molecule Workflow Process
 *
 * Implements the Formula -> Protomolecule -> Molecule lifecycle from Gas Town.
 * Formulas are TOML-based workflow templates. Protomolecules are frozen,
 * instantiation-ready templates. Molecules are active, durable chained
 * workflows that survive restarts via checkpointing.
 *
 * NDI (Nondeterministic Idempotence) ensures useful outcomes through
 * orchestration of unreliable processes - molecules can recover from
 * any checkpoint.
 *
 * Workflow:
 * 1. Define or load a TOML formula
 * 2. Cook protomolecule (resolve variables, freeze template)
 * 3. Instantiate active molecule
 * 4. Execute steps sequentially with checkpoints
 * 5. Checkpoint progress at configured intervals
 * 6. Complete workflow and collect results
 *
 * Attribution: Adapted from https://github.com/steveyegge/gastown by Steve Yegge
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.formulaId - ID of a pre-existing formula to load
 * @param {Object} inputs.formulaSpec - Inline formula specification
 * @param {Object} inputs.variables - Variables to bind into the formula
 * @param {number} inputs.checkpointInterval - Steps between checkpoints (default: 1)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Molecule execution results
 */
export async function process(inputs, ctx) {
  const {
    formulaId = null,
    formulaSpec = null,
    variables = {},
    checkpointInterval = 1
  } = inputs;

  const moleculeId = `mol-${Date.now()}`;
  ctx.log('Starting molecule workflow', { moleculeId, formulaId });

  // ============================================================================
  // STEP 1: DEFINE FORMULA
  // ============================================================================

  ctx.log('Step 1: Defining formula');

  const formulaResult = await ctx.task(defineFormulaTask, {
    formulaId: formulaId || 'inline',
    formulaSpec: formulaSpec || {},
    templateLibrary: inputs.templateLibrary || []
  });

  // ============================================================================
  // STEP 2: COOK PROTOMOLECULE
  // ============================================================================

  ctx.log('Step 2: Cooking protomolecule');

  const protoResult = await ctx.task(cookProtomoleculeTask, {
    formula: formulaResult.formula,
    variables,
    context: { moleculeId, projectRoot: inputs.projectRoot || '.' }
  });

  // ============================================================================
  // STEP 3: INSTANTIATE MOLECULE
  // ============================================================================

  ctx.log('Step 3: Instantiating active molecule');

  const moleculeResult = await ctx.task(instantiateMoleculeTask, {
    protomolecule: protoResult.protomolecule,
    moleculeId,
    durabilityConfig: { checkpointInterval, recoverable: true }
  });

  // ============================================================================
  // STEP 4-5: EXECUTE STEPS WITH CHECKPOINTS
  // ============================================================================

  const stepResults = [];
  const checkpoints = [];
  const totalSteps = protoResult.resolvedSteps.length;

  for (let stepIndex = 0; stepIndex < totalSteps; stepIndex++) {
    ctx.log(`Executing step ${stepIndex + 1}/${totalSteps}`);

    const stepResult = await ctx.task(executeStepTask, {
      moleculeId,
      stepIndex,
      stepDef: protoResult.resolvedSteps[stepIndex],
      previousResults: stepResults,
      variables: protoResult.frozenVariables
    });

    stepResults.push({
      stepIndex,
      success: stepResult.success,
      output: stepResult.output,
      duration: stepResult.duration
    });

    if (!stepResult.success) {
      await ctx.breakpoint({
        question: `Molecule ${moleculeId} step ${stepIndex + 1} failed. Review the failure and decide: retry, skip, or abort.`,
        title: `Molecule Step Failure: ${moleculeId}`,
        context: { runId: ctx.runId }
      });
    }

    // Checkpoint at configured intervals
    if ((stepIndex + 1) % checkpointInterval === 0) {
      const checkpoint = await ctx.task(checkpointProgressTask, {
        moleculeId,
        completedSteps: stepResults,
        state: moleculeResult.state,
        stepIndex
      });

      checkpoints.push(checkpoint);
    }

    // Handle step override (formula can redirect flow)
    if (stepResult.nextStepOverride !== undefined && stepResult.nextStepOverride !== null) {
      ctx.log(`Step override: jumping to step ${stepResult.nextStepOverride}`);
      // Note: In a real implementation this would adjust the loop counter
    }
  }

  // ============================================================================
  // STEP 6: COMPLETE WORKFLOW
  // ============================================================================

  ctx.log('Step 6: Completing molecule workflow');

  const completionResult = await ctx.task(completeWorkflowTask, {
    moleculeId,
    allStepResults: stepResults,
    checkpoints,
    formula: formulaResult.formula
  });

  return {
    success: stepResults.every(s => s.success),
    moleculeId,
    stepsCompleted: stepResults.filter(s => s.success).length,
    totalSteps,
    checkpoints: checkpoints.map(c => ({ id: c.checkpointId, savedAt: c.savedAt })),
    result: completionResult.result,
    metadata: {
      processId: 'methodologies/gastown/gastown-molecule',
      attribution: 'https://github.com/steveyegge/gastown',
      author: 'Steve Yegge',
      timestamp: ctx.now()
    }
  };
}
