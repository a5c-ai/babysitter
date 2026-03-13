/**
 * @process methodologies/cc10x/cc10x-router
 * @description CC10X Router - Single entry point that detects user intent and dispatches to BUILD, DEBUG, REVIEW, or PLAN workflows with memory persistence and evidence-first validation
 * @inputs { request: string, projectRoot?: string, memoryDir?: string, maxRemediationCycles?: number }
 * @outputs { success: boolean, workflow: string, agentResults: array, memoryUpdated: boolean, evidence: object, summary: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

const loadMemoryTask = defineTask('cc10x-load-memory', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Load Session Memory',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CC10X Memory Manager',
      task: 'Load and parse all three memory surfaces from the CC10X memory directory. If files do not exist, initialize them with empty structures.',
      context: { ...args },
      instructions: [
        'Read .claude/cc10x/activeContext.md for current focus, decisions, and learnings',
        'Read .claude/cc10x/patterns.md for project conventions and gotchas',
        'Read .claude/cc10x/progress.md for completed work and remaining tasks',
        'If any file is missing, create it with default section headers',
        'Return parsed memory as structured JSON'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cc10x', 'memory', 'session']
}));

const detectIntentTask = defineTask('cc10x-detect-intent', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Detect User Intent and Route Workflow',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CC10X Intent Router',
      task: 'Analyze the user request and determine which CC10X workflow to execute. Priority order: ERROR/DEBUG > PLAN > REVIEW > BUILD (default).',
      context: { ...args },
      instructions: [
        'Check for error/debug signals: error, bug, fix, broken, troubleshoot, debug, crash, exception',
        'Check for plan signals: plan, design, architect, roadmap, strategy, blueprint',
        'Check for review signals: review, audit, check, analyze, assess, inspect',
        'Default to BUILD for: build, implement, create, make, write, add, or any other request',
        'Return the detected workflow (BUILD|DEBUG|REVIEW|PLAN) with confidence score',
        'Include any clarification questions if intent is ambiguous (confidence < 80%)'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cc10x', 'router', 'intent-detection']
}));

const updateMemoryTask = defineTask('cc10x-update-memory', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Persist Memory Updates',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CC10X Memory Updater',
      task: 'Update all three CC10X memory surfaces with results from the completed workflow execution.',
      context: { ...args },
      instructions: [
        'Update activeContext.md with current focus, decisions made, and learnings from this run',
        'Update patterns.md with any new conventions, gotchas, or architectural decisions discovered',
        'Update progress.md with completed tasks, verification results, and remaining work',
        'Use Read-Edit-Verify pattern: read file, edit with exact anchors, read back to confirm',
        'Never overwrite existing content - append to appropriate sections',
        'Use stable section anchors: ## Recent Changes, ## Learnings, ## Common Gotchas, ## Completed'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cc10x', 'memory', 'persistence']
}));

const validateContractTask = defineTask('cc10x-validate-contract', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Router Contract from Agent Output',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CC10X Contract Validator',
      task: 'Validate the machine-readable Router Contract section from the agent output. Check STATUS, BLOCKING flag, REQUIRES_REMEDIATION flag, and issue counts.',
      context: { ...args },
      instructions: [
        'Parse the Router Contract from agent output',
        'Validate STATUS is one of: PASS, FAIL, APPROVE, REJECT, NEEDS_REMEDIATION',
        'Check if BLOCKING flag is set - if true, workflow cannot proceed',
        'Check REQUIRES_REMEDIATION flag - if true, a REM-FIX task is needed',
        'Count critical and high-severity issues',
        'Extract memory notes for persistence',
        'Return structured validation result with proceed/block recommendation'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cc10x', 'router', 'contract-validation']
}));

const remediationTask = defineTask('cc10x-remediation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Execute REM-FIX Remediation',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'CC10X Remediation Agent',
      task: 'Fix issues identified by contract validation. Apply targeted fixes and re-verify.',
      context: { ...args },
      instructions: [
        'Review all issues from the contract validation',
        'Apply minimal targeted fixes for each critical/high issue',
        'Run verification to confirm fixes resolve the issues',
        'Produce evidence (test results, exit codes) for each fix',
        'Return remediation report with before/after status'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['cc10x', 'router', 'remediation']
}));

// ============================================================================
// MAIN PROCESS
// ============================================================================

/**
 * CC10X Router Process
 *
 * Single entry point for all CC10X development workflows. Detects intent,
 * loads persistent memory, dispatches to the appropriate workflow (BUILD,
 * DEBUG, REVIEW, PLAN), validates agent contracts, handles remediation loops,
 * and persists learnings.
 *
 * Workflow DAG (forward-only, no cycles):
 * loadMemory -> detectIntent -> [workflow execution] -> validateContract -> updateMemory
 *
 * Attribution: Adapted from https://github.com/romiluz13/cc10x by Rom Iluz
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.request - The user's development request
 * @param {string} inputs.projectRoot - Project root directory
 * @param {string} inputs.memoryDir - Memory directory (default: .claude/cc10x)
 * @param {number} inputs.maxRemediationCycles - Max remediation attempts (default: 2)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Routing and execution results
 */
export async function process(inputs, ctx) {
  const {
    request,
    projectRoot = '.',
    memoryDir = '.claude/cc10x',
    maxRemediationCycles = 2
  } = inputs;

  ctx.log('CC10X Router: Initializing workflow orchestration', { request });

  // ========================================================================
  // STEP 1: LOAD MEMORY
  // ========================================================================

  ctx.log('Step 1: Loading session memory');

  const memory = await ctx.task(loadMemoryTask, {
    projectRoot,
    memoryDir
  });

  // ========================================================================
  // STEP 2: DETECT INTENT
  // ========================================================================

  ctx.log('Step 2: Detecting intent from user request');

  const intent = await ctx.task(detectIntentTask, {
    request,
    memory,
    projectRoot
  });

  const workflow = intent.workflow || 'BUILD';
  ctx.log(`Intent detected: ${workflow} (confidence: ${intent.confidence || 'N/A'})`);

  // If low confidence, ask for clarification
  if (intent.confidence && intent.confidence < 80 && intent.clarificationQuestions) {
    await ctx.breakpoint({
      question: `Intent detection confidence is ${intent.confidence}%. Clarification needed: ${intent.clarificationQuestions.join('; ')}. Detected workflow: ${workflow}. Approve to proceed or provide clarification.`,
      title: 'CC10X Intent Clarification',
      context: { runId: ctx.runId }
    });
  }

  // ========================================================================
  // STEP 3: DISPATCH TO WORKFLOW
  // ========================================================================

  ctx.log(`Step 3: Dispatching to ${workflow} workflow`);

  let workflowResult;

  if (workflow === 'BUILD') {
    workflowResult = await ctx.task(
      defineTask('cc10x-build-workflow-dispatch', (args, taskCtx) => ({
        kind: 'orchestrator_task',
        title: 'CC10X BUILD Workflow',
        agent: {
          name: 'general-purpose',
          prompt: {
            role: 'CC10X Build Orchestrator',
            task: 'Execute the BUILD workflow: requirement clarification -> TDD cycle -> parallel code review + silent failure hunting -> E2E verification',
            context: { ...args },
            instructions: [
              'Clarify requirements before any coding',
              'Follow strict TDD: RED (failing test) -> GREEN (minimal pass) -> REFACTOR',
              'Never skip or defer tests',
              'Run code-reviewer and silent-failure-hunter in parallel after implementation',
              'Verify with integration-verifier using exit codes as evidence',
              'All claims must be backed by logs, test results, or exit codes'
            ],
            outputFormat: 'JSON'
          }
        },
        io: {
          inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
          outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
        },
        labels: ['cc10x', 'build', 'workflow']
      })),
      { request, memory, projectRoot }
    );
  } else if (workflow === 'DEBUG') {
    workflowResult = await ctx.task(
      defineTask('cc10x-debug-workflow-dispatch', (args, taskCtx) => ({
        kind: 'orchestrator_task',
        title: 'CC10X DEBUG Workflow',
        agent: {
          name: 'general-purpose',
          prompt: {
            role: 'CC10X Debug Orchestrator',
            task: 'Execute the DEBUG workflow: log-first investigation -> fix implementation -> code review -> verification',
            context: { ...args },
            instructions: [
              'Start with log-first investigation - read logs and error output before hypothesizing',
              'Identify root cause with evidence (stack traces, error messages, exit codes)',
              'Implement targeted fix with minimal changes',
              'Run code-reviewer to validate the fix',
              'Verify with integration-verifier using exit codes as evidence',
              'Document the bug pattern in memory for future reference'
            ],
            outputFormat: 'JSON'
          }
        },
        io: {
          inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
          outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
        },
        labels: ['cc10x', 'debug', 'workflow']
      })),
      { request, memory, projectRoot }
    );
  } else if (workflow === 'REVIEW') {
    workflowResult = await ctx.task(
      defineTask('cc10x-review-workflow-dispatch', (args, taskCtx) => ({
        kind: 'orchestrator_task',
        title: 'CC10X REVIEW Workflow',
        agent: {
          name: 'general-purpose',
          prompt: {
            role: 'CC10X Review Orchestrator',
            task: 'Execute the REVIEW workflow: multi-dimensional analysis with confidence scoring (>=80% only)',
            context: { ...args },
            instructions: [
              'Perform multi-dimensional code analysis: security, quality, performance, maintainability',
              'Only report issues with >=80% confidence threshold',
              'Reject vague or unsubstantiated feedback',
              'Provide actionable remediation suggestions for each issue',
              'Include severity classification: critical, high, medium, low',
              'Generate machine-readable Router Contract in output'
            ],
            outputFormat: 'JSON'
          }
        },
        io: {
          inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
          outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
        },
        labels: ['cc10x', 'review', 'workflow']
      })),
      { request, memory, projectRoot }
    );
  } else {
    // PLAN workflow
    workflowResult = await ctx.task(
      defineTask('cc10x-plan-workflow-dispatch', (args, taskCtx) => ({
        kind: 'orchestrator_task',
        title: 'CC10X PLAN Workflow',
        agent: {
          name: 'general-purpose',
          prompt: {
            role: 'CC10X Plan Orchestrator',
            task: 'Execute the PLAN workflow: comprehensive planning with external research, saved to docs/plans/',
            context: { ...args },
            instructions: [
              'Research existing solutions and patterns before planning',
              'Create comprehensive plan with phases, milestones, and dependencies',
              'Include risk assessment and mitigation strategies',
              'Save plan to docs/plans/ for BUILD workflow continuity',
              'Reference plan in memory so component-builder can follow it',
              'Include brainstorming phase for alternative approaches'
            ],
            outputFormat: 'JSON'
          }
        },
        io: {
          inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
          outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
        },
        labels: ['cc10x', 'plan', 'workflow']
      })),
      { request, memory, projectRoot }
    );
  }

  // ========================================================================
  // STEP 4: VALIDATE CONTRACT
  // ========================================================================

  ctx.log('Step 4: Validating Router Contract');

  const contractValidation = await ctx.task(validateContractTask, {
    agentOutput: workflowResult,
    workflow
  });

  // ========================================================================
  // STEP 5: REMEDIATION LOOP (if needed)
  // ========================================================================

  let remediationCount = 0;
  let finalResult = workflowResult;

  if (contractValidation.requiresRemediation) {
    while (remediationCount < maxRemediationCycles && contractValidation.requiresRemediation) {
      ctx.log(`Step 5: Remediation cycle ${remediationCount + 1}/${maxRemediationCycles}`);

      const remResult = await ctx.task(remediationTask, {
        issues: contractValidation.issues,
        workflow,
        projectRoot,
        previousResult: finalResult
      });

      // Re-validate after remediation
      const reValidation = await ctx.task(validateContractTask, {
        agentOutput: remResult,
        workflow
      });

      finalResult = remResult;
      remediationCount++;

      if (!reValidation.requiresRemediation) {
        ctx.log('Remediation successful');
        break;
      }
    }

    if (remediationCount >= maxRemediationCycles) {
      await ctx.breakpoint({
        question: `Remediation cap reached (${maxRemediationCycles} cycles). ${contractValidation.issues?.length || 0} issues remain. Choose: research patterns for resolution or accept known issues and proceed.`,
        title: 'CC10X Remediation Cap Reached',
        context: { runId: ctx.runId }
      });
    }
  }

  // ========================================================================
  // STEP 6: UPDATE MEMORY
  // ========================================================================

  ctx.log('Step 6: Persisting memory updates');

  const memoryUpdate = await ctx.task(updateMemoryTask, {
    workflow,
    request,
    result: finalResult,
    contractValidation,
    remediationCount,
    memoryDir
  });

  return {
    success: true,
    workflow,
    agentResults: [finalResult],
    memoryUpdated: memoryUpdate.success !== false,
    evidence: {
      contractValidation,
      remediationCycles: remediationCount
    },
    summary: {
      request,
      detectedWorkflow: workflow,
      confidence: intent.confidence,
      remediationCycles: remediationCount,
      memoryPersisted: memoryUpdate.success !== false
    },
    metadata: {
      processId: 'methodologies/cc10x/cc10x-router',
      attribution: 'https://github.com/romiluz13/cc10x',
      author: 'Rom Iluz',
      timestamp: ctx.now()
    }
  };
}
