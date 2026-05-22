/**
 * Hook payload fixtures — deterministic JSON payloads that each harness
 * would send to a hook script on stdin. Useful in tests for driving
 * parseHookPayload, HookDispatcher, and `amux hooks handle` end-to-end.
 */

import type { HarnessScenario } from '../types.js';

export interface HookPayloadFixture {
  agent: string;
  hookType: string;
  payload: Record<string, unknown>;
}

export const HOOK_PAYLOAD_FIXTURES: HookPayloadFixture[] = [
  {
    agent: 'claude',
    hookType: 'PreToolUse',
    payload: {
      session_id: 'sess-claude-1',
      transcript_path: '/tmp/t.jsonl',
      cwd: '/work/proj',
      tool_name: 'Bash',
      tool_input: { command: 'ls' },
    },
  },
  {
    agent: 'claude',
    hookType: 'PostToolUse',
    payload: {
      session_id: 'sess-claude-1',
      tool_name: 'Bash',
      tool_input: { command: 'ls' },
      tool_output: 'file.txt\n',
    },
  },
  {
    agent: 'claude',
    hookType: 'Stop',
    payload: { session_id: 'sess-claude-1' },
  },
  {
    agent: 'codex',
    hookType: 'OnToolCall',
    payload: {
      session_id: 'sess-codex-1',
      tool_name: 'apply_patch',
      tool_input: { path: 'a.txt' },
    },
  },
  {
    agent: 'codex',
    hookType: 'OnStop',
    payload: { session_id: 'sess-codex-1' },
  },
  {
    agent: 'gemini',
    hookType: 'pre_prompt',
    payload: { session_id: 'g-1', prompt: 'hello' },
  },
  {
    agent: 'copilot',
    hookType: 'preTool',
    payload: { session_id: 'co-1', tool_name: 'edit' },
  },
];

export function getHookFixture(agent: string, hookType: string): HookPayloadFixture | undefined {
  return HOOK_PAYLOAD_FIXTURES.find((f) => f.agent === agent && f.hookType === hookType);
}

export const runtimeHookAllowBash: HarnessScenario = {
  harness: 'claude-code',
  name: 'runtimeHookAllowBash',
  process: { exitCode: 0, shutdownDelayMs: 10 },
  output: [
    { stream: 'stdout', data: '{"type":"system","subtype":"init","session_id":"rh-allow"}\n', delayMs: 10 },
    { stream: 'stdout', data: '{"type":"tool_call","id":"tool-1","name":"Bash","input":{"command":"echo ok"}}\n', delayMs: 10 },
    { stream: 'stdout', data: '{"type":"tool_result","tool_use_id":"tool-1","toolName":"Bash","output":"ok"}\n', delayMs: 10 },
    { stream: 'stdout', data: '{"type":"result","subtype":"success","session_id":"rh-allow"}\n', delayMs: 10 },
  ],
  runtimeHooks: {
    steps: [
      {
        chunkIndex: 1,
        kind: 'preToolUse',
        payload: { toolName: 'Bash', toolInput: { command: 'echo ok' } },
        decision: 'allow',
        delayMs: 20,
      },
    ],
  },
};

export const runtimeHookDenyWrite: HarnessScenario = {
  harness: 'claude-code',
  name: 'runtimeHookDenyWrite',
  process: { exitCode: 0 },
  output: [
    { stream: 'stdout', data: '{"type":"system","subtype":"init","session_id":"rh-deny"}\n', delayMs: 10 },
    { stream: 'stdout', data: '{"type":"tool_call","id":"tool-2","name":"Write","input":{"path":"blocked.txt"}}\n', delayMs: 10 },
    { stream: 'stdout', data: '{"type":"tool_result","tool_use_id":"tool-2","toolName":"Write","output":"blocked"}\n', delayMs: 10 },
  ],
  runtimeHooks: {
    steps: [
      {
        chunkIndex: 1,
        kind: 'preToolUse',
        payload: { toolName: 'Write', toolInput: { path: 'blocked.txt' } },
        decision: 'deny',
        delayMs: 20,
        errorMessage: 'Runtime hook denied Write',
      },
    ],
  },
};

export const runtimeHookTimeout: HarnessScenario = {
  harness: 'claude-code',
  name: 'runtimeHookTimeout',
  process: { exitCode: 0, hang: true },
  output: [
    { stream: 'stdout', data: '{"type":"system","subtype":"init","session_id":"rh-timeout"}\n', delayMs: 10 },
    { stream: 'stdout', data: '{"type":"tool_call","id":"tool-3","name":"Bash","input":{"command":"sleep 1"}}\n', delayMs: 10 },
  ],
  runtimeHooks: {
    steps: [
      {
        chunkIndex: 1,
        kind: 'preToolUse',
        payload: { toolName: 'Bash', toolInput: { command: 'sleep 1' } },
        decision: 'timeout',
      },
    ],
  },
};

export const RUNTIME_HOOK_SCENARIOS: Record<string, HarnessScenario> = {
  [runtimeHookAllowBash.name!]: runtimeHookAllowBash,
  [runtimeHookDenyWrite.name!]: runtimeHookDenyWrite,
  [runtimeHookTimeout.name!]: runtimeHookTimeout,
};
