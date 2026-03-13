/**
 * effect-mapper.js
 *
 * Mapping layer between babysitter effect kinds and Codex tool execution.
 * Translates babysitter task definitions into Codex CLI prompts, arguments,
 * and result formats.
 */

'use strict';

const { fireHook } = require('./hook-dispatcher.js');

// ---------------------------------------------------------------------------
// 1. mapEffectToCodexPrompt
// ---------------------------------------------------------------------------

/**
 * Takes a babysitter task definition and returns a prompt string suitable for
 * `codex exec`, or null when the effect is handled outside of Codex (e.g.
 * breakpoint, sleep).
 *
 * @param {object} taskDef - Babysitter task definition
 * @returns {string|null}
 */
function mapEffectToCodexPrompt(taskDef) {
  const kind = taskDef?.effect?.kind ?? taskDef?.kind;

  switch (kind) {
    case 'agent': {
      const agent = taskDef.agent ?? taskDef.effect?.agent ?? {};
      const parts = [];

      if (agent.role) {
        parts.push(`You are ${agent.role}.`);
      }

      if (agent.task) {
        parts.push(`Task: ${agent.task}`);
      }

      if (agent.context) {
        const ctx =
          typeof agent.context === 'string'
            ? agent.context
            : JSON.stringify(agent.context, null, 2);
        parts.push(`Context:\n${ctx}`);
      }

      if (agent.instructions) {
        const instructions = Array.isArray(agent.instructions)
          ? agent.instructions.map((inst, i) => `${i + 1}. ${inst}`).join('\n')
          : agent.instructions;
        parts.push(`Instructions:\n${instructions}`);
      }

      if (agent.outputFormat) {
        const fmt =
          typeof agent.outputFormat === 'string'
            ? agent.outputFormat
            : JSON.stringify(agent.outputFormat, null, 2);
        parts.push(`Output format:\n${fmt}`);
      }

      return parts.join('\n\n');
    }

    case 'node': {
      const script =
        taskDef.node?.script ??
        taskDef.effect?.node?.script ??
        taskDef.script;
      const args =
        taskDef.node?.args ??
        taskDef.effect?.node?.args ??
        taskDef.args ??
        [];
      const argStr = Array.isArray(args) ? args.join(' ') : args;
      return `node ${script}${argStr ? ' ' + argStr : ''}`.trim();
    }

    case 'shell': {
      const command =
        taskDef.shell?.command ??
        taskDef.effect?.shell?.command ??
        taskDef.command;
      return command ?? null;
    }

    case 'breakpoint': {
      // Breakpoints are handled separately by the babysitter runtime.
      // Fire the on-breakpoint hook so listeners can react before the pause.
      const bpPayload = taskDef.breakpoint ?? taskDef.effect?.breakpoint ?? taskDef.payload ?? {};
      fireHook('on-breakpoint', bpPayload);
      return null;
    }

    case 'sleep':
      // Sleep/wait is handled by the babysitter runtime wait logic.
      return null;

    case 'skill': {
      // Discovery integration available via ../discovery.js for dynamic skill resolution.
      const skill = taskDef.skill ?? taskDef.effect?.skill ?? {};
      const parts = [];

      if (skill.name) {
        parts.push(`Skill: ${skill.name}`);
      }

      if (skill.description) {
        parts.push(`Description: ${skill.description}`);
      }

      if (skill.input) {
        const input =
          typeof skill.input === 'string'
            ? skill.input
            : JSON.stringify(skill.input, null, 2);
        parts.push(`Input:\n${input}`);
      }

      if (skill.parameters) {
        parts.push(
          `Parameters:\n${JSON.stringify(skill.parameters, null, 2)}`
        );
      }

      if (skill.expectedOutput) {
        parts.push(`Expected output: ${skill.expectedOutput}`);
      }

      return parts.join('\n\n');
    }

    case 'hook': {
      // Fires a named hook via the hook dispatcher.
      const hookPayload = taskDef.hook ?? taskDef.effect?.hook ?? taskDef.payload ?? {};
      const { hookType, payload: hookData } = hookPayload;
      return fireHook(hookType, hookData);
    }

    case 'parallel': {
      // Groups multiple effects for concurrent execution.
      const parallelPayload = taskDef.parallel ?? taskDef.effect?.parallel ?? taskDef.payload ?? {};
      const subEffects = parallelPayload.effects ?? [];
      const subPrompts = subEffects
        .map((subEffect) => mapEffectToCodexPrompt(subEffect))
        .filter((p) => p != null);
      if (subPrompts.length === 0) return null;
      return subPrompts.join('\n\n---\n\n');
    }

    case 'orchestrator_task': {
      // Delegates structured decision-making to a sub-orchestrator.
      const ot = taskDef.orchestrator_task ?? taskDef.effect?.orchestrator_task ?? taskDef.payload ?? {};
      const parts = [];

      if (ot.objective) {
        parts.push(`Objective: ${ot.objective}`);
      }

      if (ot.role) {
        parts.push(`Orchestrator role: ${ot.role}`);
      }

      if (ot.context) {
        const ctx =
          typeof ot.context === 'string'
            ? ot.context
            : JSON.stringify(ot.context, null, 2);
        parts.push(`Context:\n${ctx}`);
      }

      if (ot.subtasks) {
        const subtasks = Array.isArray(ot.subtasks)
          ? ot.subtasks.map((t, i) => `${i + 1}. ${typeof t === 'string' ? t : JSON.stringify(t)}`).join('\n')
          : JSON.stringify(ot.subtasks, null, 2);
        parts.push(`Subtasks:\n${subtasks}`);
      }

      if (ot.constraints) {
        const constraints = Array.isArray(ot.constraints)
          ? ot.constraints.map((c, i) => `${i + 1}. ${c}`).join('\n')
          : ot.constraints;
        parts.push(`Constraints:\n${constraints}`);
      }

      if (ot.outputFormat) {
        const fmt =
          typeof ot.outputFormat === 'string'
            ? ot.outputFormat
            : JSON.stringify(ot.outputFormat, null, 2);
        parts.push(`Output format:\n${fmt}`);
      }

      return parts.join('\n\n');
    }

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// 2. parseCodexOutput
// ---------------------------------------------------------------------------

/**
 * Codex error code → babysitter error category mapping.
 */
const CODEX_ERROR_MAP = {
  1: 'execution_error',
  2: 'invalid_input',
  3: 'timeout',
  4: 'rate_limit',
  5: 'model_error',
  126: 'permission_denied',
  127: 'command_not_found',
  130: 'interrupted',
  137: 'killed',
};

/**
 * Parse raw codex exec output into babysitter result format.
 *
 * @param {string} rawOutput - Raw stdout string from codex exec
 * @param {object} taskDef   - Original babysitter task definition
 * @returns {object} Babysitter-compatible result object
 */
function parseCodexOutput(rawOutput, taskDef) {
  const outputSchema =
    taskDef?.outputSchema ?? taskDef?.agent?.outputSchema ?? null;

  // Attempt JSON extraction when a schema is expected or output looks like JSON.
  if (outputSchema || looksLikeJson(rawOutput)) {
    const extracted = extractJson(rawOutput);
    if (extracted !== null) {
      return {
        success: true,
        kind: 'structured',
        data: extracted,
        raw: rawOutput,
      };
    }
  }

  // Plain text output
  return {
    success: true,
    kind: 'text',
    data: rawOutput.trim(),
    raw: rawOutput,
  };
}

/**
 * Map a codex process exit code to a babysitter error result.
 *
 * @param {number} exitCode
 * @param {string} [stderr]
 * @returns {object}
 */
function mapCodexError(exitCode, stderr) {
  if (stderr === undefined) stderr = '';
  const category = CODEX_ERROR_MAP[exitCode] ?? 'unknown_error';
  return {
    success: false,
    kind: 'error',
    errorCategory: category,
    exitCode,
    message: stderr.trim() || `Codex exited with code ${exitCode}`,
  };
}

// ---------------------------------------------------------------------------
// 3. buildCodexArgs
// ---------------------------------------------------------------------------

/**
 * Build the CLI argument array for `codex exec`.
 *
 * @param {object} taskDef  - Babysitter task definition
 * @param {object} [options] - Additional runtime options
 * @param {boolean} [options.fullAuto]       - Force --full-auto (default: true)
 * @param {boolean} [options.jsonOutput]     - Force --json flag
 * @param {string}  [options.workdir]        - Working directory override
 * @returns {string[]} Argument array (not including the `codex exec` command itself)
 */
function buildCodexArgs(taskDef, options) {
  if (!options) options = {};
  const args = [];

  // --full-auto: suppress interactive prompts; default to true
  const fullAuto = options.fullAuto !== false;
  if (fullAuto) {
    args.push('--full-auto');
  }

  // --json: emit structured JSON output when a schema is present or explicitly requested
  const hasSchema =
    taskDef?.outputSchema ??
    taskDef?.agent?.outputSchema ??
    taskDef?.orchestrator_task?.outputFormat ??
    false;
  const wantJson = options.jsonOutput ?? Boolean(hasSchema);
  if (wantJson) {
    args.push('--json');
  }

  // --model: prefer taskDef model, then options model
  const model =
    taskDef?.model ??
    taskDef?.agent?.model ??
    taskDef?.skill?.model ??
    taskDef?.orchestrator_task?.model ??
    options.model ??
    null;
  if (model) {
    args.push('--model', model);
  }

  // --workdir: optional working directory
  const workdir = taskDef?.workdir ?? options.workdir ?? null;
  if (workdir) {
    args.push('--workdir', workdir);
  }

  // --timeout: optional timeout in seconds
  const timeout = taskDef?.timeout ?? options.timeout ?? null;
  if (timeout != null) {
    args.push('--timeout', String(timeout));
  }

  return args;
}

// ---------------------------------------------------------------------------
// 4. batchEffects
// ---------------------------------------------------------------------------

/**
 * Group independent effects for parallel execution.
 *
 * Effects that carry explicit dependencies (via `dependsOn` or `after` fields)
 * are placed into sequenced batches; effects with no declared dependencies are
 * grouped together so they can run concurrently.
 *
 * Returns an array of batches, where each batch is an array of effects that
 * may execute in parallel. Batches themselves must be executed sequentially.
 *
 * @param {object[]} effects - Array of babysitter effect objects
 * @returns {object[][]} Ordered list of parallel batches
 */
function batchEffects(effects) {
  if (!Array.isArray(effects) || effects.length === 0) {
    return [];
  }

  // Build an id → effect index map for dependency resolution.
  const idToIndex = new Map();
  effects.forEach((effect, idx) => {
    const id = effect.id ?? effect.taskId ?? String(idx);
    idToIndex.set(id, idx);
  });

  // Group effects that share a schedulerHints.parallelGroupId into the same
  // synthetic parallel batch before normal dependency-level processing.
  // Effects with the same parallelGroupId are treated as having no inter-
  // dependencies and are placed at the same level.
  const parallelGroupLevels = new Map(); // groupId -> assigned level
  let nextParallelLevel = 0; // will be re-anchored after dep resolution

  // Compute the batch level for each effect (longest dependency chain).
  const levels = new Array(effects.length).fill(null);

  function getLevel(idx) {
    if (levels[idx] !== null) return levels[idx];

    const effect = effects[idx];

    // Honour explicit parallelGroupId: all effects sharing a group run together.
    const groupId = effect.schedulerHints?.parallelGroupId ?? null;
    if (groupId !== null) {
      if (!parallelGroupLevels.has(groupId)) {
        parallelGroupLevels.set(groupId, nextParallelLevel++);
      }
      levels[idx] = parallelGroupLevels.get(groupId);
      return levels[idx];
    }

    const deps = [
      ...(effect.dependsOn ?? []),
      ...(effect.after ?? []),
    ];

    if (deps.length === 0) {
      levels[idx] = 0;
      return 0;
    }

    let maxDepLevel = -1;
    for (const depId of deps) {
      const depIdx = idToIndex.get(depId);
      if (depIdx === undefined) {
        // Unknown dependency — treat as resolved (level 0)
        continue;
      }
      const depLevel = getLevel(depIdx);
      if (depLevel > maxDepLevel) {
        maxDepLevel = depLevel;
      }
    }

    levels[idx] = maxDepLevel + 1;
    return levels[idx];
  }

  effects.forEach((_, idx) => getLevel(idx));

  // Group effects by level into batches.
  const batches = [];
  effects.forEach((effect, idx) => {
    const level = levels[idx];
    if (!batches[level]) {
      batches[level] = [];
    }
    batches[level].push(effect);
  });

  // Filter out any empty slots (sparse array artefacts).
  return batches.filter(Boolean);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Heuristically check whether a string starts with JSON.
 * @param {string} str
 * @returns {boolean}
 */
function looksLikeJson(str) {
  const trimmed = (str ?? '').trim();
  return trimmed.startsWith('{') || trimmed.startsWith('[');
}

/**
 * Extract the first valid JSON value from a string that may contain
 * surrounding prose (e.g. markdown code fences).
 *
 * @param {string} str
 * @returns {any|null} Parsed value or null if none found
 */
function extractJson(str) {
  if (!str) return null;

  // 1. Try the whole string first.
  try {
    return JSON.parse(str.trim());
  } catch (_) {
    // Continue to heuristic extraction.
  }

  // 2. Extract from markdown code fences.
  const fenceMatch = str.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch (_) {
      // Continue.
    }
  }

  // 3. Scan for the first '{' or '[' and attempt balanced extraction.
  const openers = [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
  ];

  for (const { open, close } of openers) {
    const start = str.indexOf(open);
    if (start === -1) continue;

    let depth = 0;
    let inString = false;
    let escape = false;

    for (let i = start; i < str.length; i++) {
      const ch = str[i];

      if (escape) {
        escape = false;
        continue;
      }
      if (ch === '\\' && inString) {
        escape = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;

      if (ch === open) depth++;
      else if (ch === close) {
        depth--;
        if (depth === 0) {
          try {
            return JSON.parse(str.slice(start, i + 1));
          } catch (_) {
            break;
          }
        }
      }
    }
  }

  return null;
}

module.exports = {
  mapEffectToCodexPrompt,
  parseCodexOutput,
  mapCodexError,
  buildCodexArgs,
  batchEffects,
};
