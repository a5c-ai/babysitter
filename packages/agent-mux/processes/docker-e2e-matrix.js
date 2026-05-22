/**
 * @process docker-e2e-matrix
 * @description Build+run full docker-based E2E across all harnesses (mock + real credential matrix).
 *
 * Status: scaffold complete (packages/agent-mux/docker/e2e/Dockerfile.mock, Dockerfile.real, docker-compose.yml, --use-mock-harness flag).
 * This process expands the matrix to every adapter and wires CI.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const expandMatrixTask = defineTask('expand-matrix', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Expand docker-compose matrix to all 11 adapters',
  execution: { model: 'claude-opus-4-6' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'DevOps engineer',
      task: 'Extend packages/agent-mux/docker/e2e/docker-compose.yml with one mock-e2e and one real-e2e service per adapter.',
      context: { adapters: args.adapters },
      instructions: [
        'For each adapter add: `mock-e2e-<name>` and (where a CLI exists) `real-e2e-<name>`.',
        'Real services declare their credential env vars with `${VAR:?}` guards.',
        'Update packages/agent-mux/docker/e2e/README.md with the full matrix.',
        'Update .github/workflows/e2e.yml docker-compose-mock job to `up --exit-code-from` every mock service.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyTask = defineTask('verify-matrix', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify mock matrix passes locally',
  execution: { model: 'claude-opus-4-6' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'QA',
      task: 'Run `docker compose -f packages/agent-mux/docker/e2e/docker-compose.yml up --exit-code-from <service>` for every mock-e2e-<name>. Report pass/fail per adapter.',
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export default async function dockerE2eMatrix(ctx) {
  const adapters = ['claude','codex','cursor','gemini','opencode','openclaw','copilot','hermes','pi','omp','agent-mux-remote'];
  await ctx.run(expandMatrixTask, { adapters });
  await ctx.run(verifyTask, {});
  return { ok: true };
}
