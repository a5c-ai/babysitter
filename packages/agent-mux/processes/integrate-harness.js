/**
 * @process integrate-harness
 * @description Research, scaffold, test, and document a new agent-harness adapter for @a5c-ai/agent-mux.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const researchTask = defineTask('research-harness', (args, taskCtx) => ({
  kind: 'agent',
  title: `Research harness: ${args.harness}`,
  execution: { model: 'claude-opus-4-6' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Senior engineer researching a new agent-CLI harness for integration',
      task: `Research the "${args.harness}" harness. Produce comprehensive structured notes covering install, session format, auth, streaming events, hooks, plugins, CLI commands, and limitations.`,
      context: { harness: args.harness, docsUrls: args.docsUrls || [], repoUrl: args.repoUrl || null },
      instructions: [
        'Fetch the harness CLI docs and help output.',
        'Document: install command, version flag, session file path and format (JSONL/JSON/SQLite), auth flow (env var / OAuth / browser), streaming JSONL event types.',
        'Hook system: native hook support, hook events available, hook configuration locations, CLI hook management commands, Claude Code hook compatibility.',
        'Plugin system: native plugin CLI commands (list/install/update/uninstall), marketplace support, plugin vs MCP server distinction, CLI command structure.',
        'CLI capabilities: exact CLI tool name, available commands, marketplace management, update mechanisms.',
        'Integration patterns: MCP server support, third-party tool compatibility, configuration file formats.',
        'Return JSON matching outputSchema.',
      ],
      outputFormat: 'JSON',
    },
    outputSchema: {
      type: 'object',
      required: ['install', 'session', 'auth', 'events', 'hooks', 'plugins', 'cli', 'limitations'],
      properties: {
        install: { type: 'object' },
        session: { type: 'object' },
        auth: { type: 'object' },
        events: { type: 'object' },
        hooks: {
          type: 'object',
          required: ['supported', 'events', 'configLocations', 'cliCommands', 'claudeCompatible'],
        },
        plugins: {
          type: 'object',
          required: ['supported', 'cliCommands', 'marketplace', 'mcpSupport'],
        },
        cli: {
          type: 'object',
          required: ['toolName', 'commands', 'marketplace', 'updateMechanism'],
        },
        limitations: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const scaffoldTask = defineTask('scaffold-adapter', (args, taskCtx) => ({
  kind: 'agent',
  title: `Scaffold ${args.harness}-adapter.ts`,
  execution: { model: 'claude-opus-4-6' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'TypeScript developer implementing a BaseAgentAdapter subclass',
      task: `Create packages/agent-mux/adapters/src/${args.harness}-adapter.ts extending BaseAgentAdapter.`,
      context: { harness: args.harness, research: args.research, projectRoot: args.projectRoot },
      instructions: [
        'Read packages/agent-mux/adapters/src/claude-adapter.ts as the canonical template.',
        'Fill AgentCapabilities from research notes — conservative defaults for unknowns.',
        'Implement buildSpawnArgs, parseEvent, detectAuth, getAuthGuidance, sessionDir, parseSessionFile, listSessionFiles, readConfig, writeConfig.',
        'Hook integration: If harness supports hooks, implement hook config detection, validate hook compatibility with Claude Code format.',
        'Plugin system: Distinguish between native plugin CLI commands vs MCP server support. Use correct CLI tool name and commands from research.',
        'If the harness supports MCP plugins, delegate to mcp-plugins.ts (see cursor-adapter.ts pattern).',
        'CLI capability mapping: Map actual CLI commands (plugin/hook/mcp management) to adapter capabilities accurately.',
        'Keep file under 400 effective lines — split helpers if needed.',
        'Register the adapter in packages/agent-mux/adapters/src/index.ts.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const testTask = defineTask('test-adapter', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test ${args.harness}-adapter`,
  execution: { model: 'claude-opus-4-6' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'TypeScript test engineer writing adapter test coverage',
      task: `Write packages/agent-mux/adapters/tests/${args.harness}-adapter.test.ts with full coverage.`,
      context: { harness: args.harness },
      instructions: [
        'Cover capability shape, buildSpawnArgs for representative RunOptions, parseEvent for every JSONL type, detectAuth authenticated + unauthenticated, session file parsing from a redacted fixture.',
        'Hook testing: If hook support, test hook config detection, validate hook compatibility claims with fixture hook.json files.',
        'Plugin testing: If native plugin support, test CLI command mapping, verify actual CLI tool name usage in spawn args.',
        'CLI capability testing: Validate that reported capabilities match actual CLI commands from research.',
        'If MCP plugin support, add the adapter to packages/agent-mux/adapters/tests/mcp-plugins-parity.test.ts.',
        'Run: npm run typecheck && npm run lint && npm test. Must all pass.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const docsTask = defineTask('document-adapter', (args, taskCtx) => ({
  kind: 'agent',
  title: `Docs + changeset for ${args.harness}`,
  execution: { model: 'claude-opus-4-6' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Docs author',
      task: `Add README matrix row, docs/02-agents/${args.harness}.md, and a changeset entry.`,
      context: { harness: args.harness },
      instructions: [
        'Append a row to the capability matrix in README.md.',
        'Write docs/02-agents/<harness>.md with install, auth, example run, limitations.',
        'Plugin/Hook documentation: Include proper plugin vs MCP server distinction, hook system capabilities, correct CLI command syntax.',
        'CLI accuracy: Use exact CLI tool name and actual commands from research, avoid assumptions about command structure.',
        'Integration guidance: Document hook compatibility with Claude Code, plugin marketplace access patterns, configuration file locations.',
        'npm run changeset — minor — summarize "add <harness> adapter".',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export default async function integrateHarness(ctx) {
  const harness = ctx.inputs.harness;
  const projectRoot = ctx.inputs.projectRoot || process.cwd();

  const research = await ctx.run(researchTask, {
    harness,
    docsUrls: ctx.inputs.docsUrls,
    repoUrl: ctx.inputs.repoUrl,
  });

  await ctx.run(scaffoldTask, { harness, research, projectRoot });
  await ctx.run(testTask, { harness });
  await ctx.run(docsTask, { harness });

  return { ok: true, harness };
}
