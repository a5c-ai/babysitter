/**
 * @process methodologies/claudekit/claudekit-orchestrator
 * @description ClaudeKit Orchestrator - Main entry point that sets up the safety pipeline (hooks, file-guard), executes slash commands, dispatches code review or spec workflows, and manages checkpoints with session-scoped hook control
 * @inputs { request: string, projectRoot?: string, hookConfig?: object, enableFileGuard?: boolean, thinkingLevel?: number, maxCheckpoints?: number }
 * @outputs { success: boolean, pipelineStatus: object, commandResults: array, checkpoints: array, hookProfile: object, summary: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

const initCodebaseMapTask = defineTask('claudekit-init-codebase-map', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Initialize Codebase Map',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ClaudeKit Codebase Mapper',
      task: 'Auto-index the project structure to build a codebase map for invisible context injection. Catalog file types, entry points, key modules, and dependency graph.',
      context: { ...args },
      instructions: [
        'Scan the project root for directory structure and key files',
        'Identify entry points (main, index, app files)',
        'Catalog file type distribution (ts, js, py, etc.)',
        'Map module dependencies and import graph',
        'Identify test directories and configuration files',
        'Build a concise project summary for context injection',
        'Return structured map as JSON'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['claudekit', 'codebase-map', 'context-engineering']
}));

const configureHooksTask = defineTask('claudekit-configure-hooks', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure Hook Pipeline',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ClaudeKit Hook Manager',
      task: 'Set up the full hook pipeline: PreToolUse (file-guard), PostToolUse (typecheck, lint, test), UserPromptSubmit (codebase-map, thinking-level), and Stop hooks (checkpoint, project checks, self-review).',
      context: { ...args },
      instructions: [
        'Configure PreToolUse file-guard with 195+ sensitive file patterns across 12 categories',
        'Set up PostToolUse hooks: typecheck-changed, lint-changed, test-changed, check-comment-replacement, check-unused-parameters',
        'Configure UserPromptSubmit: codebase-map context injection, thinking-level reasoning enhancement',
        'Set up Stop hooks: create-checkpoint, typecheck-project, lint-project, test-project, self-review',
        'Apply session-scoped isolation so changes do not persist beyond current session',
        'Enable hook profiling with color-coded alerts for hooks exceeding 5s',
        'Return hook configuration status and any warnings'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['claudekit', 'hooks', 'pipeline-setup']
}));

const configureFileGuardTask = defineTask('claudekit-configure-file-guard', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure File Guard Protection',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ClaudeKit File Guard Specialist',
      task: 'Initialize file-guard with 195+ patterns across 12 categories. Configure bash pipeline analysis and multi-tool ignore support.',
      context: { ...args },
      instructions: [
        'Load all 12 file guard categories: secrets, credentials, SSH keys, certificates, environment files, auth tokens, database configs, cloud configs, CI/CD secrets, private keys, API keys, sensitive configs',
        'Register 195+ file access patterns for blocking',
        'Enable bash pipeline analysis to detect indirect file access attempts',
        'Configure multi-tool ignore support for approved exceptions',
        'Set up real-time alerting for blocked access attempts',
        'Return guard configuration with pattern count per category'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['claudekit', 'file-guard', 'security']
}));

const setThinkingLevelTask = defineTask('claudekit-set-thinking-level', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Configure Thinking Level',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ClaudeKit Reasoning Enhancer',
      task: 'Set the reasoning enhancement level (1-4) for subsequent operations. Higher levels inject more detailed chain-of-thought prompts.',
      context: { ...args },
      instructions: [
        'Level 1: Standard reasoning - no additional prompts',
        'Level 2: Enhanced reasoning - add step-by-step decomposition',
        'Level 3: Deep reasoning - add alternative analysis and edge cases',
        'Level 4: Maximum reasoning - add adversarial self-questioning and proof obligations',
        'Apply the selected level to the UserPromptSubmit hook',
        'Return the configured thinking level and its description'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['claudekit', 'thinking-level', 'context-engineering']
}));

const createCheckpointTask = defineTask('claudekit-create-checkpoint', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create Git-Backed Checkpoint',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ClaudeKit Checkpoint Manager',
      task: 'Create a git-backed checkpoint of current state for safe rollback. Tag with descriptive label and timestamp.',
      context: { ...args },
      instructions: [
        'Stage all current changes (git add -A)',
        'Create a checkpoint commit with prefix [CHECKPOINT] and descriptive message',
        'Tag the commit with claudekit-checkpoint-{timestamp}',
        'Record checkpoint metadata: files changed, insertions, deletions',
        'Maintain checkpoint history for restoration',
        'Return checkpoint ID, tag name, and summary of captured state'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['claudekit', 'checkpoint', 'git']
}));

const dispatchCommandTask = defineTask('claudekit-dispatch-command', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Dispatch Slash Command',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ClaudeKit Command Dispatcher',
      task: 'Parse and dispatch the requested slash command to the appropriate workflow. Supported: checkpoint, git, code-review, validate-and-fix, research, spec, hook, create-subagent, agents-md.',
      context: { ...args },
      instructions: [
        'Parse the slash command from the request',
        'Route /checkpoint:create and /checkpoint:restore to checkpoint management',
        'Route /git:commit, /git:status, /git:checkout, /git:ignore-init to git operations',
        'Route /code-review to 6-agent parallel review orchestration',
        'Route /validate-and-fix to full quality check pipeline',
        'Route /research to parallel research agent dispatch',
        'Route /spec:create and /spec:execute to specification workflows',
        'Route /hook:disable, /hook:enable, /hook:status to session hook control',
        'Route /create-subagent and /create-command to meta-creation tools',
        'Route /agents-md:init to AI assistant configuration',
        'Return routing decision and dispatched workflow ID'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['claudekit', 'command', 'dispatch']
}));

const runSafetyChecksTask = defineTask('claudekit-run-safety-checks', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run Stop-Hook Safety Checks',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ClaudeKit Safety Validator',
      task: 'Execute all stop-hook safety checks: typecheck-project, lint-project, test-project, and self-review before completing the session.',
      context: { ...args },
      instructions: [
        'Run project-wide type checking and collect results',
        'Run project-wide linting and collect results',
        'Run full test suite and collect results',
        'Perform self-review of all changes made in this session',
        'Create a final checkpoint if all checks pass',
        'Aggregate results with pass/fail status per check',
        'Return comprehensive safety report'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['claudekit', 'safety', 'stop-hooks']
}));

const profileHooksTask = defineTask('claudekit-profile-hooks', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Profile Hook Execution',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ClaudeKit Hook Profiler',
      task: 'Analyze hook execution times and output sizes. Flag hooks exceeding 5s with color-coded alerts. Generate performance report.',
      context: { ...args },
      instructions: [
        'Collect execution time for each hook invocation',
        'Measure output size for each hook',
        'Flag hooks exceeding 5s threshold (red alert)',
        'Flag hooks exceeding 3s threshold (yellow warning)',
        'Identify hooks with excessive output (>10KB)',
        'Suggest optimizations for slow hooks',
        'Return profiling report with timing breakdown'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['claudekit', 'profiling', 'hooks']
}));

// ============================================================================
// PROCESS FUNCTION
// ============================================================================

export async function process(inputs, ctx) {
  const {
    request,
    projectRoot = '.',
    hookConfig = {},
    enableFileGuard = true,
    thinkingLevel = 2,
    maxCheckpoints = 10
  } = inputs;

  ctx.log('Starting ClaudeKit Orchestrator');

  // Phase 1: Initialize codebase map and configure hooks in parallel
  ctx.log('Phase 1: Initializing codebase map and hook pipeline');
  const [codebaseMap, hookStatus] = await ctx.parallel.all([
    ctx.task(initCodebaseMapTask, { projectRoot }),
    ctx.task(configureHooksTask, { hookConfig, projectRoot })
  ]);

  // Phase 2: Configure file guard and thinking level in parallel
  ctx.log('Phase 2: Configuring safety layers');
  const [fileGuardStatus, thinkingConfig] = await ctx.parallel.all([
    ctx.task(configureFileGuardTask, { projectRoot, enabled: enableFileGuard }),
    ctx.task(setThinkingLevelTask, { level: thinkingLevel })
  ]);

  // Phase 3: Create initial checkpoint
  ctx.log('Phase 3: Creating initial checkpoint');
  const initialCheckpoint = await ctx.task(createCheckpointTask, {
    projectRoot,
    label: 'claudekit-session-start',
    codebaseMap: codebaseMap
  });

  // Phase 4: Human review of setup before proceeding
  ctx.log('Phase 4: Awaiting human review of pipeline configuration');
  await ctx.breakpoint({
    title: 'ClaudeKit Pipeline Configuration Review',
    description: 'Review the configured hook pipeline, file guard patterns, and thinking level before processing the request.',
    context: {
      hookStatus,
      fileGuardStatus,
      thinkingConfig,
      codebaseMap: { fileCount: codebaseMap.fileCount, entryPoints: codebaseMap.entryPoints },
      initialCheckpoint
    }
  });

  // Phase 5: Dispatch the user command
  ctx.log('Phase 5: Dispatching user command');
  const commandResult = await ctx.task(dispatchCommandTask, {
    request,
    projectRoot,
    codebaseMap,
    hookConfig: hookStatus,
    thinkingLevel: thinkingConfig
  });

  // Phase 6: Run safety checks and profile hooks
  ctx.log('Phase 6: Running safety checks and hook profiling');
  const [safetyReport, hookProfile] = await ctx.parallel.all([
    ctx.task(runSafetyChecksTask, {
      projectRoot,
      changesFromCommand: commandResult
    }),
    ctx.task(profileHooksTask, {
      hookConfig: hookStatus,
      sessionActivity: commandResult
    })
  ]);

  // Phase 7: Quality-gated convergence -- retry if safety checks fail
  let convergenceAttempts = 0;
  const maxConvergence = 3;
  let finalSafetyReport = safetyReport;

  while (!finalSafetyReport.allPassed && convergenceAttempts < maxConvergence) {
    convergenceAttempts++;
    ctx.log(`Convergence attempt ${convergenceAttempts}/${maxConvergence}: Addressing safety check failures`);

    await ctx.breakpoint({
      title: `Safety Check Failures - Convergence Attempt ${convergenceAttempts}`,
      description: 'Some safety checks failed. Review failures and approve remediation.',
      context: { failures: finalSafetyReport.failures, attempt: convergenceAttempts }
    });

    finalSafetyReport = await ctx.task(runSafetyChecksTask, {
      projectRoot,
      changesFromCommand: commandResult,
      previousFailures: finalSafetyReport.failures
    });
  }

  // Phase 8: Create final checkpoint
  ctx.log('Phase 8: Creating final checkpoint');
  const finalCheckpoint = await ctx.task(createCheckpointTask, {
    projectRoot,
    label: 'claudekit-session-end',
    safetyReport: finalSafetyReport
  });

  ctx.log('ClaudeKit Orchestrator complete');

  return {
    success: finalSafetyReport.allPassed || convergenceAttempts < maxConvergence,
    pipelineStatus: {
      codebaseMap: { indexed: true, fileCount: codebaseMap.fileCount },
      hooks: hookStatus,
      fileGuard: fileGuardStatus,
      thinkingLevel: thinkingConfig
    },
    commandResults: [commandResult],
    checkpoints: [initialCheckpoint, finalCheckpoint],
    hookProfile,
    safetyReport: finalSafetyReport,
    convergenceAttempts,
    summary: {
      request,
      dispatched: commandResult.workflow,
      safetyPassed: finalSafetyReport.allPassed,
      checkpointCount: 2,
      hookAlerts: hookProfile.alerts || []
    }
  };
}
