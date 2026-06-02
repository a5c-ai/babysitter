/**
 * @process provider-mux-tech-debt
 * @description Complete remaining tech debt for the provider-mux/launcher feature across TypeScript and Python packages.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ──────────────────────────────────────────────────────────────────
// Phase 1: TypeScript quality & robustness
// ──────────────────────────────────────────────────────────────────

const tsQualityTask = defineTask('ts-quality-improvements', (args, taskCtx) => ({
  kind: 'agent',
  title: 'TypeScript quality improvements: Windows signals, PTY, proxy cleanup, adapter method',
  execution: { model: 'claude-sonnet-4-6' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior TypeScript engineer',
      task: 'Implement 4 quality improvements in the agent-mux provider-mux system.',
      context: {
        workspaceRoot: args.workspaceRoot,
        feedback: args.feedback ?? null,
        attempt: args.attempt ?? 1,
      },
      instructions: [
        '## Item 1: Windows signal handling (P4.3)',
        'In packages/agent-mux/cli/src/commands/launch.ts, the forwardSignal function uses child.kill(sig).',
        'On Windows, SIGINT is unreliable. Add a platform check: if process.platform === "win32",',
        'use spawn("taskkill", ["/PID", String(child.pid), "/F"]) as fallback after SIGTERM timeout.',
        '',
        '## Item 2: Proxy process cleanup on crash (P4.4)',
        'In packages/agent-mux/cli/src/commands/launch.ts, register the proxy PID with ProcessTracker',
        '(imported from @a5c-ai/agent-mux-comm) so it gets cleaned up on uncaught exceptions.',
        'Add: processTracker.register(proxyProcess.pid, "amux-proxy") after spawning.',
        'Import processTracker from core.',
        '',
        '## Item 3: translateProvider as adapter method (P4.2)',
        'Add an optional translateProvider method to the adapter interface in packages/agent-mux/core/src/adapter.ts:',
        '  translateProvider?(config: import("./provider-config.js").ProviderConfig): import("./provider-config.js").ProviderConfig;',
        'This is just the interface addition - adapters can optionally implement it.',
        'In packages/agent-mux/adapters/src/translate-for-harness.ts, check if the adapter has translateProvider',
        'before falling back to the switch-case dispatcher. This enables plugin adapters to define their own.',
        '',
        '## Item 4: Config file permissions check (P3.7)',
        'In packages/agent-mux/core/src/provider-profiles.ts, after reading ~/.amux/providers.json,',
        'check file permissions on non-Windows: if mode & 0o077 !== 0, print a warning to stderr.',
        '',
        'Run tests after each change. Commit each item separately.',
        'Return JSON: { items: [{ name: string, status: string, filesModified: string[] }] }',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object', required: ['items'] },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

// ──────────────────────────────────────────────────────────────────
// Phase 2: Python package improvements
// ──────────────────────────────────────────────────────────────────

const pythonImprovementsTask = defineTask('python-improvements', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Python amux-proxy improvements: /v1/models endpoint, Ollama server lifecycle, token count',
  execution: { model: 'claude-sonnet-4-6' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior Python engineer',
      task: 'Implement 3 new features in the amux-proxy Python package.',
      context: {
        workspaceRoot: args.workspaceRoot,
        feedback: args.feedback ?? null,
        attempt: args.attempt ?? 1,
      },
      instructions: [
        '## Item 1: /v1/models endpoint (P3.5)',
        'Add a /v1/models endpoint to packages/agent-mux/amux-proxy/src/amux_proxy/server.py that queries',
        'the target provider for available models using litellm.model_list or provider-specific methods.',
        'Return models in OpenAI-compatible format: { "data": [{ "id": "...", "object": "model" }] }.',
        '',
        '## Item 2: Ollama server lifecycle management (P3.11)',
        'Create packages/agent-mux/amux-proxy/src/amux_proxy/providers/ollama_server.py with OllamaServerManager',
        'that can start/stop the Ollama server as a subprocess when AMUX_PROXY_OLLAMA_MANAGE_SERVER=true.',
        'Start on proxy startup, stop on proxy shutdown. Health-check loop with 30s timeout.',
        '',
        '## Item 3: Token count endpoint (P3.4)',
        'Add POST /v1/count_tokens to server.py that uses litellm.token_counter() to estimate token count.',
        'Accept { "model": "...", "messages": [...] } and return { "count": N }.',
        '',
        'Write tests for each feature. Commit each separately.',
        'Return JSON: { items: [{ name: string, status: string, filesModified: string[] }] }',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object', required: ['items'] },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

// ──────────────────────────────────────────────────────────────────
// Phase 3: CLI extensions
// ──────────────────────────────────────────────────────────────────

const cliExtensionsTask = defineTask('cli-extensions', (args, taskCtx) => ({
  kind: 'agent',
  title: 'CLI extensions: amux models --provider, Ollama model pull in launch, root scripts',
  execution: { model: 'claude-sonnet-4-6' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior TypeScript engineer',
      task: 'Implement 3 CLI improvements for the agent-mux provider-mux system.',
      context: {
        workspaceRoot: args.workspaceRoot,
        feedback: args.feedback ?? null,
        attempt: args.attempt ?? 1,
      },
      instructions: [
        '## Item 1: amux models --provider extension (P3.1)',
        'In packages/agent-mux/cli/src/commands/models.ts, add --provider and --harness flags.',
        'When --provider is given, list models from PROVIDER_DEFAULTS[provider] and MODEL_TRANSLATION_TABLE.',
        'When --harness is given, filter to models the harness can use.',
        'Import from @a5c-ai/agent-mux-comm: PROVIDER_DEFAULTS, MODEL_TRANSLATION_TABLE.',
        '',
        '## Item 2: Ollama model pre-check in amux launch (P3.10)',
        'In packages/agent-mux/cli/src/commands/launch.ts, when the resolved provider is "ollama",',
        'before spawning the harness, check if the model is available locally by running:',
        '  ollama list',
        'If the model is missing and --prompt is NOT set (interactive), prompt the user to pull it.',
        'If --prompt IS set, auto-pull if AMUX_OLLAMA_AUTO_PULL env is set, else error.',
        '',
        '## Item 3: Root package.json scripts for amux-proxy (P2.2)',
        'Add to the root package.json scripts:',
        '  "test:amux-proxy": "cd packages/agent-mux/amux-proxy && python -m pytest tests/ -v"',
        '  "lint:amux-proxy": "cd packages/agent-mux/amux-proxy && ruff check ."',
        '',
        'Run vitest for TS changes. Commit each separately.',
        'Return JSON: { items: [{ name: string, status: string, filesModified: string[] }] }',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object', required: ['items'] },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

// ──────────────────────────────────────────────────────────────────
// Verification gate
// ──────────────────────────────────────────────────────────────────

const verifyAllTask = defineTask('verify-all', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Run full TypeScript and Python test suites',
  shell: {
    command: [
      `cd "${args.workspaceRoot}"`,
      'npx vitest run packages/agent-mux/core/tests/ packages/agent-mux/adapters/tests/ packages/agent-mux/cli/tests/launch-resolution.test.ts --reporter=dot',
      'cd packages/agent-mux/amux-proxy && python -m pytest tests/ -v',
    ].join(' && '),
    expectedExitCode: 0,
    timeout: 300000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

// ──────────────────────────────────────────────────────────────────
// Review gate
// ──────────────────────────────────────────────────────────────────

const reviewTask = defineTask('review-tech-debt', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review all tech debt changes for correctness and completeness',
  execution: { model: 'claude-sonnet-4-6' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Code reviewer',
      task: 'Review the provider-mux tech debt implementation for correctness.',
      context: {
        workspaceRoot: args.workspaceRoot,
        phaseResults: args.phaseResults,
        targetScore: args.targetScore,
      },
      instructions: [
        'Read the git diff for the recent commits on the current branch.',
        'Check: Windows signal handling correctness, proxy cleanup with ProcessTracker,',
        'adapter translateProvider interface, config permissions check,',
        '/v1/models endpoint, Ollama server lifecycle, token count endpoint,',
        'models --provider CLI extension, root package.json scripts.',
        'Score 0-100. Return JSON: { score: number, passesTarget: boolean, findings: string[], feedback: string }',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: { type: 'object', required: ['score', 'passesTarget', 'findings', 'feedback'] },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

// ──────────────────────────────────────────────────────────────────
// Process entry
// ──────────────────────────────────────────────────────────────────

export async function process(inputs = {}, ctx) {
  const workspaceRoot = inputs.workspaceRoot ?? 'C:/work/agent-mux';
  const targetScore = Number(inputs.targetScore ?? 85);
  const maxRefinements = Number(inputs.maxRefinements ?? 2);

  // Phase 1: TypeScript quality
  const tsResult = await ctx.task(tsQualityTask, {
    workspaceRoot,
  });

  // Phase 2: Python improvements
  const pyResult = await ctx.task(pythonImprovementsTask, {
    workspaceRoot,
  });

  // Phase 3: CLI extensions
  const cliResult = await ctx.task(cliExtensionsTask, {
    workspaceRoot,
  });

  // Verification gate
  let verification = await ctx.task(verifyAllTask, { workspaceRoot });

  // Review gate with refinement loop
  let review = null;
  let attempt = 1;

  while (attempt <= maxRefinements) {
    review = await ctx.task(reviewTask, {
      workspaceRoot,
      phaseResults: { ts: tsResult, python: pyResult, cli: cliResult },
      targetScore,
    });

    if (review.passesTarget && Number(review.score) >= targetScore) break;

    // Re-run verification and review with feedback
    const fixResult = await ctx.task(tsQualityTask, {
      workspaceRoot,
      feedback: review.feedback,
      attempt: attempt + 1,
    });

    verification = await ctx.task(verifyAllTask, { workspaceRoot });
    attempt++;
  }

  // Final approval
  await ctx.breakpoint({
    question: `Tech debt batch scored ${review?.score ?? '?'}. Approve?`,
    title: 'Final Tech Debt Review',
    context: { review, verification },
  });

  return {
    status: review?.passesTarget ? 'completed' : 'needs-followup',
    score: review?.score,
    phases: { ts: tsResult, python: pyResult, cli: cliResult },
    review,
  };
}
