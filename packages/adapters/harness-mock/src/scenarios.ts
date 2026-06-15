/**
 * Pre-built scenarios for common harness behaviors.
 *
 * These scenarios model real harness behavior observed via probing,
 * providing ready-made test fixtures for adapter development.
 */

import type { HarnessScenario } from './types.js';

// ---------------------------------------------------------------------------
// Claude Code scenarios
// ---------------------------------------------------------------------------

/** Claude Code: successful run with streaming JSONL output. */
export const claudeCodeSuccess: HarnessScenario = {
  harness: 'claude-code',
  name: 'claude-code-success',
  process: { exitCode: 0 },
  output: [
    { stream: 'stdout', data: '{"type":"system","subtype":"init","session_id":"sess_001","tools":[]}\n', delayMs: 50 },
    { stream: 'stdout', data: '{"type":"assistant","subtype":"text","text":"Hello! "}\n', delayMs: 100 },
    { stream: 'stdout', data: '{"type":"assistant","subtype":"text","text":"How can I help?"}\n', delayMs: 50 },
    { stream: 'stdout', data: '{"type":"result","subtype":"success","session_id":"sess_001","cost_usd":0.003,"duration_ms":450,"num_turns":1}\n', delayMs: 20 },
  ],
};

/** Claude Code: run that requires tool approval. */
export const claudeCodeToolApproval: HarnessScenario = {
  harness: 'claude-code',
  name: 'claude-code-tool-approval',
  process: { exitCode: 0 },
  output: [
    { stream: 'stdout', data: '{"type":"system","subtype":"init","session_id":"sess_002","tools":["Read","Write","Bash"]}\n', delayMs: 50 },
    { stream: 'stdout', data: '{"type":"assistant","subtype":"tool_use","id":"tool_1","name":"Read","input":{"file_path":"/tmp/test.txt"}}\n', delayMs: 100 },
    { stream: 'stderr', data: 'Do you want to allow Read /tmp/test.txt? (y/n)\n', delayMs: 10 },
  ],
  interactions: [
    { triggerPattern: 'Do you want to allow', response: 'y\n', delayMs: 50 },
  ],
};

/** Claude Code: run that times out (hangs). */
export const claudeCodeTimeout: HarnessScenario = {
  harness: 'claude-code',
  name: 'claude-code-timeout',
  process: { exitCode: 0, hang: true },
  output: [
    { stream: 'stdout', data: '{"type":"system","subtype":"init","session_id":"sess_003","tools":[]}\n', delayMs: 50 },
  ],
};

/** Claude Code: run that crashes. */
export const claudeCodeCrash: HarnessScenario = {
  harness: 'claude-code',
  name: 'claude-code-crash',
  process: { exitCode: 1, crashAfterMs: 200, crashSignal: 'SIGTERM' },
  output: [
    { stream: 'stdout', data: '{"type":"system","subtype":"init","session_id":"sess_004","tools":[]}\n', delayMs: 50 },
    { stream: 'stderr', data: 'Error: Connection refused\n', delayMs: 100 },
  ],
};

/** Claude Code: run with file modifications. */
export const claudeCodeFileOps: HarnessScenario = {
  harness: 'claude-code',
  name: 'claude-code-file-ops',
  process: { exitCode: 0 },
  output: [
    { stream: 'stdout', data: '{"type":"system","subtype":"init","session_id":"sess_005","tools":["Write"]}\n', delayMs: 50 },
    { stream: 'stdout', data: '{"type":"assistant","subtype":"tool_use","id":"tool_1","name":"Write","input":{"file_path":"/tmp/output.txt","content":"hello world"}}\n', delayMs: 100 },
    { stream: 'stdout', data: '{"type":"assistant","subtype":"tool_result","id":"tool_1","output":"File written"}\n', delayMs: 20 },
    { stream: 'stdout', data: '{"type":"result","subtype":"success","session_id":"sess_005","cost_usd":0.005}\n', delayMs: 20 },
  ],
  fileOperations: [
    { type: 'create', path: '/tmp/output.txt', content: 'hello world' },
  ],
};

// ---------------------------------------------------------------------------
// Codex scenarios
// ---------------------------------------------------------------------------

/** Codex: successful run with JSONL output. */
export const codexSuccess: HarnessScenario = {
  harness: 'codex',
  name: 'codex-success',
  process: { exitCode: 0 },
  output: [
    { stream: 'stdout', data: '{"type":"message","role":"assistant","content":[{"type":"output_text","text":"Here is the solution."}]}\n', delayMs: 100 },
    { stream: 'stdout', data: '{"type":"completed","status":"completed"}\n', delayMs: 50 },
  ],
};

/** Codex: run that produces file changes. */
export const codexFileOps: HarnessScenario = {
  harness: 'codex',
  name: 'codex-file-ops',
  process: { exitCode: 0 },
  output: [
    { stream: 'stdout', data: '{"type":"message","role":"assistant","content":[{"type":"output_text","text":"I will create a file."}]}\n', delayMs: 100 },
    { stream: 'stdout', data: '{"type":"completed","status":"completed"}\n', delayMs: 50 },
  ],
  fileOperations: [
    { type: 'create', path: '/tmp/codex-output.ts', content: 'export const x = 1;\n' },
  ],
};

/** Codex: run that fails with non-zero exit. */
export const codexFailure: HarnessScenario = {
  harness: 'codex',
  name: 'codex-failure',
  process: { exitCode: 1 },
  output: [
    { stream: 'stderr', data: 'Error: Invalid API key\n', delayMs: 50 },
  ],
};

// ---------------------------------------------------------------------------
// Generic scenarios
// ---------------------------------------------------------------------------

/** Generic: immediate success with no output. */
export const emptySuccess: HarnessScenario = {
  harness: 'custom',
  name: 'empty-success',
  process: { exitCode: 0 },
  output: [],
};

/** Generic: slow startup. */
export const slowStartup: HarnessScenario = {
  harness: 'custom',
  name: 'slow-startup',
  process: { exitCode: 0, startupDelayMs: 500 },
  output: [
    { stream: 'stdout', data: 'ready\n', delayMs: 0 },
  ],
};

/** Generic: large output (for buffer/backpressure testing). */
export function largeOutput(lineCount: number): HarnessScenario {
  const output: Array<{ stream: 'stdout'; data: string; delayMs: number }> = [];
  for (let i = 0; i < lineCount; i++) {
    output.push({
      stream: 'stdout',
      data: `{"line":${i},"data":"${'x'.repeat(200)}"}\n`,
      delayMs: 0,
    });
  }
  return {
    harness: 'custom',
    name: `large-output-${lineCount}`,
    process: { exitCode: 0 },
    output,
  };
}
