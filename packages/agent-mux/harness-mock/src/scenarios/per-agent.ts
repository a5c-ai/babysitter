import type { HarnessScenario, HarnessType } from '../types.js';
import {
  agentCost,
  agentMessageStop,
  agentTextDelta,
  agentToolCallReady,
  agentToolCallStart,
  agentToolResult,
  claudeError,
  claudeMessageStop,
  claudeResult,
  claudeStreamEventText,
  claudeStreamEventThinking,
  claudeStreamEventToolInput,
  claudeStreamEventToolStop,
  claudeStreamEventToolUse,
  claudeSystemInit,
  claudeUserToolResult,
  codexItemCompleted,
  codexItemStarted,
  codexThreadStarted,
  codexTurnCompleted,
  codexTurnFailed,
  codexTurnStarted,
  geminiError,
  geminiText,
  geminiToolCall,
  geminiToolResult,
  genericError,
  genericSessionEnd,
  genericSessionStart,
  genericText,
  genericToolCall,
  stdoutChunk,
} from './wire-format.js';

export interface HarnessScenarioProfile {
  harnessKey: string;
  harness: HarnessType;
  executionType: 'subprocess';
  scenarios: string[];
  notes: string;
}

export interface SubprocessScenarioExpectation {
  agent: string;
  exitCode: number;
  parsedEventTypes: string[];
  notes: string;
}

function scenario(
  harness: HarnessScenario['harness'],
  name: string,
  output: HarnessScenario['output'],
  process: HarnessScenario['process'] = { exitCode: 0 },
): HarnessScenario {
  return {
    harness,
    executionType: 'subprocess',
    name,
    process,
    output,
  };
}

const claudeScenarios: HarnessScenario[] = [
  scenario('claude-code', 'claude:stream-json', [
    stdoutChunk(claudeSystemInit('sess_claude_stream', ['Read', 'Write']), 5),
    stdoutChunk(claudeStreamEventThinking('I should inspect the workspace first.'), 10),
    stdoutChunk(claudeStreamEventText('Hello '), 10),
    stdoutChunk(claudeStreamEventText('from Claude Code.'), 10),
    stdoutChunk(claudeMessageStop(), 10),
    stdoutChunk(claudeResult('sess_claude_stream', 'Completed.', {
      total_usd: 0.0012,
      input_tokens: 120,
      output_tokens: 45,
      cache_creation_tokens: 10,
      cache_read_tokens: 20,
    }), 10),
  ]),
  scenario('claude-code', 'claude:tool-call', [
    stdoutChunk(claudeSystemInit('sess_claude_tool', ['Read']), 5),
    stdoutChunk(claudeStreamEventText('Reading the requested file.'), 10),
    stdoutChunk(claudeStreamEventToolUse({ id: 'claude-tool-1', name: 'Read', input: {} }, 1), 10),
    stdoutChunk(claudeStreamEventToolInput('{"file_path":"/tmp/x.txt"}', 1), 10),
    stdoutChunk(claudeStreamEventToolStop(1), 10),
    stdoutChunk(claudeUserToolResult('claude-tool-1', 'file contents'), 10),
    stdoutChunk(claudeResult('sess_claude_tool', 'Done.'), 10),
  ]),
  scenario('claude-code', 'claude:error', [
    stdoutChunk(claudeSystemInit('sess_claude_error', ['Read']), 5),
    stdoutChunk(claudeError('Claude Code approval denied the requested write.'), 10),
  ], { exitCode: 1 }),
];

const codexScenarios: HarnessScenario[] = [
  scenario('codex', 'codex:exec-turn', [
    stdoutChunk(codexThreadStarted('thread_codex_exec'), 5),
    stdoutChunk(codexTurnStarted('turn_codex_exec'), 10),
    stdoutChunk(codexItemStarted({ id: 'msg_1', type: 'message', content: 'Planning the answer.' }), 10),
    stdoutChunk(codexItemCompleted({ id: 'msg_1', type: 'agent_message', text: 'Here is the answer.' }), 10),
    stdoutChunk(codexTurnCompleted('Completed', {
      total_usd: 0.0008,
      input_tokens: 90,
      output_tokens: 30,
    }), 10),
  ]),
  scenario('codex', 'codex:code-generation', [
    stdoutChunk(codexThreadStarted('thread_codex_codegen'), 5),
    stdoutChunk(codexTurnStarted('turn_codex_codegen'), 10),
    stdoutChunk(codexItemStarted({ id: 'call_1', type: 'function_call', name: 'apply_patch', arguments: { patch: '+const x = 1;' } }), 10),
    stdoutChunk(codexItemCompleted({ id: 'call_1', type: 'function_call', call_id: 'call_1', name: 'apply_patch', arguments: { patch: '+const x = 1;' } }), 10),
    stdoutChunk(codexItemCompleted({ id: 'out_1', type: 'function_call_output', call_id: 'call_1', name: 'apply_patch', output: 'patch applied' }), 10),
    stdoutChunk(codexTurnCompleted('Patch applied'), 10),
  ]),
  scenario('codex', 'codex:error', [
    stdoutChunk(codexTurnFailed('Codex failed to execute the turn.'), 10),
  ], { exitCode: 1 }),
];

const geminiScenarios: HarnessScenario[] = [
  scenario('gemini', 'gemini:thinking-stream', [
    stdoutChunk(JSON.stringify({ type: 'thinking', content: 'Evaluating options.' }) + '\n', 5),
    stdoutChunk(geminiText('Gemini says hi.'), 10),
    stdoutChunk(geminiText('Streaming piece by piece.'), 10),
  ]),
  scenario('gemini', 'gemini:tool-call', [
    stdoutChunk(geminiText('Calling a tool.'), 5),
    stdoutChunk(geminiToolCall({ id: 'g1', name: 'search', input: { q: 'agent mux' } }), 10),
    stdoutChunk(geminiToolResult('g1', 'search results'), 10),
  ]),
  scenario('gemini', 'gemini:error', [
    stdoutChunk(geminiError('Gemini request exceeded the configured budget.'), 10),
  ], { exitCode: 1 }),
];

const copilotScenarios: HarnessScenario[] = [
  scenario('copilot', 'copilot:plain-text', [
    stdoutChunk('Suggested command: npm test\n', 5),
  ]),
  scenario('copilot', 'copilot:error', [
    stdoutChunk(genericError('Authentication required.'), 5),
  ], { exitCode: 1 }),
];

const cursorScenarios: HarnessScenario[] = [
  scenario('cursor', 'cursor:session-text', [
    stdoutChunk(genericSessionStart('cursor-session'), 5),
    stdoutChunk(genericText('Cursor opened the workspace and drafted a reply.'), 10),
    stdoutChunk(genericSessionEnd('Cursor finished the turn.'), 10),
  ]),
  scenario('cursor', 'cursor:tool-call', [
    stdoutChunk(genericSessionStart('cursor-tool-session'), 5),
    stdoutChunk(genericText('Cursor is invoking a workspace tool.'), 10),
    stdoutChunk(genericToolCall({ id: 'cursor-t1', name: 'edit_file', input: { path: 'src/app.ts', changes: 2 } }), 10),
    stdoutChunk(genericSessionEnd('Tool call emitted.'), 10),
  ]),
  scenario('cursor', 'cursor:error', [
    stdoutChunk(genericSessionStart('cursor-error-session'), 5),
    stdoutChunk(genericError('Cursor refused the command because approval was denied.'), 10),
  ], { exitCode: 1 }),
];
const opencodeScenarios: HarnessScenario[] = [
  scenario('opencode', 'opencode:session', [
    stdoutChunk(genericSessionStart('opencode-session'), 5),
    stdoutChunk(genericText('OpenCode started.'), 10),
    stdoutChunk(genericSessionEnd('OpenCode finished.', {
      total_usd: 0.0015,
      input_tokens: 100,
      output_tokens: 35,
    }), 10),
  ]),
  scenario('opencode', 'opencode:tool-call', [
    stdoutChunk(genericSessionStart('opencode-tool'), 5),
    stdoutChunk(genericToolCall({ id: 'opencode-t1', name: 'write_file', input: { path: '/tmp/out.ts' } }), 10),
    stdoutChunk(JSON.stringify({ type: 'tool_result', id: 'opencode-t1', name: 'write_file', result: 'written', duration: 12 }) + '\n', 10),
    stdoutChunk(genericSessionEnd(), 10),
  ]),
  scenario('opencode', 'opencode:error', [
    stdoutChunk(genericSessionStart('opencode-error'), 5),
    stdoutChunk(genericError('OpenCode lost its upstream provider session.'), 10),
  ], { exitCode: 1 }),
];
const piScenarios: HarnessScenario[] = [
  scenario('pi', 'pi:session-text', [
    stdoutChunk(genericSessionStart('pi-session'), 5),
    stdoutChunk(JSON.stringify({ type: 'message', text: 'Pi planned the next edit.' }) + '\n', 10),
    stdoutChunk(genericSessionEnd('Pi completed the turn.'), 10),
  ]),
  scenario('pi', 'pi:tool-call', [
    stdoutChunk(genericSessionStart('pi-tool-session'), 5),
    stdoutChunk(JSON.stringify({ type: 'message', text: 'Pi is calling a tool.' }) + '\n', 10),
    stdoutChunk(genericToolCall({ id: 'pi-t1', name: 'read_file', input: { path: 'README.md' } }), 10),
    stdoutChunk(genericSessionEnd('Tool request emitted.'), 10),
  ]),
  scenario('pi', 'pi:error', [
    stdoutChunk(genericSessionStart('pi-error-session'), 5),
    stdoutChunk(genericError('Pi provider returned an authentication failure.'), 10),
  ], { exitCode: 1 }),
];
const ompScenarios: HarnessScenario[] = [
  scenario('omp', 'omp:session-text', [
    stdoutChunk(genericSessionStart('omp-session'), 5),
    stdoutChunk(JSON.stringify({ type: 'message', content: 'OMP prepared a follow-up patch.' }) + '\n', 10),
    stdoutChunk(genericSessionEnd('OMP completed the turn.'), 10),
  ]),
  scenario('omp', 'omp:tool-call', [
    stdoutChunk(genericSessionStart('omp-tool-session'), 5),
    stdoutChunk(genericText('OMP is invoking an MCP-style tool.'), 10),
    stdoutChunk(genericToolCall({ id: 'omp-t1', name: 'search_repo', input: { pattern: 'MockProcess' } }), 10),
    stdoutChunk(genericSessionEnd('Tool request emitted.'), 10),
  ]),
  scenario('omp', 'omp:error', [
    stdoutChunk(genericSessionStart('omp-error-session'), 5),
    stdoutChunk(genericError('OMP hit a provider-side rate limit.'), 10),
  ], { exitCode: 1 }),
];
const openclawScenarios: HarnessScenario[] = [
  scenario('openclaw', 'openclaw:session-text', [
    stdoutChunk(genericSessionStart('openclaw-session'), 5),
    stdoutChunk(genericText('OpenClaw prepared a plugin response.'), 10),
    stdoutChunk(genericSessionEnd('OpenClaw finished the turn.'), 10),
  ]),
  scenario('openclaw', 'openclaw:tool-call', [
    stdoutChunk(genericSessionStart('openclaw-tool-session'), 5),
    stdoutChunk(genericText('OpenClaw is dispatching a tool call.'), 10),
    stdoutChunk(genericToolCall({ id: 'openclaw-t1', name: 'open_plugin_channel', input: { channel: 'filesystem' } }), 10),
    stdoutChunk(genericSessionEnd('Tool request emitted.'), 10),
  ]),
  scenario('openclaw', 'openclaw:error', [
    stdoutChunk(genericSessionStart('openclaw-error-session'), 5),
    stdoutChunk(genericError('OpenClaw plugin negotiation failed.'), 10),
  ], { exitCode: 1 }),
];
const hermesScenarios: HarnessScenario[] = [
  scenario('hermes', 'hermes:session-text', [
    stdoutChunk(genericSessionStart('hermes-session'), 5),
    stdoutChunk(genericText('Hermes drafted the final response.'), 10),
    stdoutChunk(genericSessionEnd('Hermes finished the session.'), 10),
  ]),
  scenario('hermes', 'hermes:tool-call', [
    stdoutChunk(genericSessionStart('hermes-tool-session'), 5),
    stdoutChunk(genericText('Hermes is invoking a coding tool.'), 10),
    stdoutChunk(genericToolCall({ id: 'hermes-t1', name: 'apply_patch', input: { file: 'src/main.ts', hunks: 1 } }), 10),
    stdoutChunk(genericSessionEnd('Tool request emitted.'), 10),
  ]),
  scenario('hermes', 'hermes:error', [
    stdoutChunk(genericSessionStart('hermes-error-session'), 5),
    stdoutChunk(genericError('Hermes provider session expired.'), 10),
  ], { exitCode: 1 }),
];

const ampScenarios: HarnessScenario[] = [
  scenario('amp', 'amp:session', [
    stdoutChunk(JSON.stringify({ type: 'session_start', sessionId: 'amp-session' }) + '\n', 5),
    stdoutChunk(agentTextDelta('Amp started.', 'Amp started.'), 10),
    stdoutChunk(agentCost(0.0011, 140, 55), 10),
    stdoutChunk(JSON.stringify({ type: 'session_end', sessionId: 'amp-session', reason: 'completed', turnCount: 1 }) + '\n', 10),
  ]),
  scenario('amp', 'amp:tool-call', [
    stdoutChunk(JSON.stringify({ type: 'session_start', sessionId: 'amp-tool-session' }) + '\n', 5),
    stdoutChunk(agentToolCallStart('amp-t1', 'grep_codebase', { pattern: 'MockProcess' }), 10),
    stdoutChunk(agentToolResult('amp-t1', 'grep_codebase', 'packages/agent-mux/harness-mock/src/mock-process.ts', 8), 10),
  ]),
  scenario('amp', 'amp:error', [
    stdoutChunk(JSON.stringify({ type: 'session_start', sessionId: 'amp-error-session' }) + '\n', 5),
    stdoutChunk(JSON.stringify({ type: 'error', code: 'RATE_LIMIT', message: 'Amp exceeded the provider rate limit.', recoverable: false }) + '\n', 10),
  ], { exitCode: 1 }),
];

const droidScenarios: HarnessScenario[] = [
  scenario('droid', 'droid:session', [
    stdoutChunk(JSON.stringify({ type: 'session_start', sessionId: 'droid-session' }) + '\n', 5),
    stdoutChunk(agentTextDelta('Droid started.', 'Droid started.'), 10),
    stdoutChunk(agentMessageStop('Finished.'), 10),
    stdoutChunk(agentCost(0.0021, 210, 88), 10),
  ]),
  scenario('droid', 'droid:tool-call', [
    stdoutChunk(JSON.stringify({ type: 'session_start', sessionId: 'droid-tool' }) + '\n', 5),
    stdoutChunk(agentToolCallStart('droid-t1', 'bash', { command: 'npm test' }), 10),
    stdoutChunk(agentToolCallReady('droid-t1', 'bash', { command: 'npm test' }), 10),
    stdoutChunk(agentToolResult('droid-t1', 'bash', 'tests passed', 42), 10),
  ]),
  scenario('droid', 'droid:error', [
    stdoutChunk(JSON.stringify({ type: 'session_start', sessionId: 'droid-error' }) + '\n', 5),
    stdoutChunk(JSON.stringify({ type: 'error', code: 'PERMISSION_DENIED', message: 'Droid denied the requested shell tool.', recoverable: false }) + '\n', 10),
  ], { exitCode: 1 }),
];

const qwenScenarios: HarnessScenario[] = [
  scenario('qwen', 'qwen:basic-text', [
    stdoutChunk(geminiText('Hello from qwen.'), 5),
  ]),
  scenario('qwen', 'qwen:tool-call', [
    stdoutChunk(geminiText('Using a tool.'), 5),
    stdoutChunk(geminiToolCall({ id: 'q1', name: 'read_file', input: { path: '/tmp/qwen.txt' } }), 10),
    stdoutChunk(geminiToolResult('q1', 'file contents'), 10),
  ]),
  scenario('qwen', 'qwen:error', [
    stdoutChunk(geminiError('Qwen rejected the upstream request.'), 10),
  ], { exitCode: 1 }),
];

const ALL_SCENARIOS = [
  ...claudeScenarios,
  ...codexScenarios,
  ...geminiScenarios,
  ...copilotScenarios,
  ...cursorScenarios,
  ...opencodeScenarios,
  ...piScenarios,
  ...ompScenarios,
  ...openclawScenarios,
  ...hermesScenarios,
  ...ampScenarios,
  ...droidScenarios,
  ...qwenScenarios,
];

export const SUBPROCESS_HARNESS_PROFILES: Record<string, HarnessScenarioProfile> = {
  claude: {
    harnessKey: 'claude',
    harness: 'claude-code',
    executionType: 'subprocess',
    scenarios: claudeScenarios.map((entry) => entry.name!),
    notes: 'Claude Code stream-json output with session, thinking, tool, and result envelopes.',
  },
  codex: {
    harnessKey: 'codex',
    harness: 'codex',
    executionType: 'subprocess',
    scenarios: codexScenarios.map((entry) => entry.name!),
    notes: 'Codex exec JSON events including thread/turn/item envelopes.',
  },
  gemini: {
    harnessKey: 'gemini',
    harness: 'gemini',
    executionType: 'subprocess',
    scenarios: geminiScenarios.map((entry) => entry.name!),
    notes: 'Gemini CLI JSON event stream with thinking and tool events.',
  },
  copilot: {
    harnessKey: 'copilot',
    harness: 'copilot',
    executionType: 'subprocess',
    scenarios: copilotScenarios.map((entry) => entry.name!),
    notes: 'Copilot primarily emits plain text, with JSON error fallback coverage.',
  },
  cursor: {
    harnessKey: 'cursor',
    harness: 'cursor',
    executionType: 'subprocess',
    scenarios: cursorScenarios.map((entry) => entry.name!),
    notes: 'Cursor session-lifecycle, tool-call, and nonzero-exit error fixtures using the adapter’s generic JSONL parse path.',
  },
  opencode: {
    harnessKey: 'opencode',
    harness: 'opencode',
    executionType: 'subprocess',
    scenarios: opencodeScenarios.map((entry) => entry.name!),
    notes: 'OpenCode event/session envelopes with tool execution, final message/cost, and explicit error coverage.',
  },
  pi: {
    harnessKey: 'pi',
    harness: 'pi',
    executionType: 'subprocess',
    scenarios: piScenarios.map((entry) => entry.name!),
    notes: 'Pi session lifecycle, message/text, tool, and error fixtures through the current JSONL parser.',
  },
  omp: {
    harnessKey: 'omp',
    harness: 'omp',
    executionType: 'subprocess',
    scenarios: ompScenarios.map((entry) => entry.name!),
    notes: 'OMP session lifecycle, tool, and nonzero-exit error fixtures through the current JSONL parser.',
  },
  openclaw: {
    harnessKey: 'openclaw',
    harness: 'openclaw',
    executionType: 'subprocess',
    scenarios: openclawScenarios.map((entry) => entry.name!),
    notes: 'OpenClaw session lifecycle, tool, and explicit plugin/error fixtures through the current JSONL parser.',
  },
  hermes: {
    harnessKey: 'hermes',
    harness: 'hermes',
    executionType: 'subprocess',
    scenarios: hermesScenarios.map((entry) => entry.name!),
    notes: 'Hermes session lifecycle, tool, and nonzero-exit error fixtures through the current JSONL parser.',
  },
  amp: {
    harnessKey: 'amp',
    harness: 'amp',
    executionType: 'subprocess',
    scenarios: ampScenarios.map((entry) => entry.name!),
    notes: 'Amp-specific session, cost, and tool-call events.',
  },
  droid: {
    harnessKey: 'droid',
    harness: 'droid',
    executionType: 'subprocess',
    scenarios: droidScenarios.map((entry) => entry.name!),
    notes: 'Droid-specific session/tool ready/message stop events.',
  },
  qwen: {
    harnessKey: 'qwen',
    harness: 'qwen',
    executionType: 'subprocess',
    scenarios: qwenScenarios.map((entry) => entry.name!),
    notes: 'Qwen-compatible JSON text/tool/error fixtures matching adapter parse paths.',
  },
};

const LEGACY_ALIASES: Record<string, string> = {
  'claude:basic-text': 'claude:stream-json',
  'claude:multi-turn': 'claude:stream-json',
  'codex:basic-text': 'codex:exec-turn',
  'gemini:basic-text': 'gemini:thinking-stream',
  'gemini:streaming': 'gemini:thinking-stream',
  'cursor:basic-text': 'cursor:session-text',
  'opencode:basic-text': 'opencode:session',
  'pi:basic-text': 'pi:session-text',
  'omp:basic-text': 'omp:session-text',
  'openclaw:basic-text': 'openclaw:session-text',
  'hermes:basic-text': 'hermes:session-text',
};

const scenarioByName = Object.fromEntries(
  ALL_SCENARIOS.map((entry) => [entry.name!, entry] as const),
) as Record<string, HarnessScenario>;

export const AGENT_SCENARIOS: Record<string, HarnessScenario> = {
  ...scenarioByName,
  ...Object.fromEntries(
    Object.entries(LEGACY_ALIASES).map(([alias, target]) => [alias, scenarioByName[target]!]),
  ),
};

export const SUBPROCESS_SCENARIO_EXPECTATIONS: Record<string, SubprocessScenarioExpectation> = {
  'claude:stream-json': {
    agent: 'claude',
    exitCode: 0,
    parsedEventTypes: ['session_start', 'thinking_delta', 'text_delta', 'message_stop', 'cost'],
    notes: 'Claude stream-json session lifecycle with thinking/text/result envelopes.',
  },
  'claude:tool-call': {
    agent: 'claude',
    exitCode: 0,
    parsedEventTypes: ['session_start', 'text_delta', 'tool_call_start', 'tool_result', 'message_stop'],
    notes: 'Claude tool_use and user tool_result round-trip.',
  },
  'claude:error': {
    agent: 'claude',
    exitCode: 1,
    parsedEventTypes: ['session_start', 'error'],
    notes: 'Claude error envelope with nonzero exit.',
  },
  'codex:exec-turn': {
    agent: 'codex',
    exitCode: 0,
    parsedEventTypes: ['session_start', 'thinking_delta', 'text_delta', 'message_stop', 'cost'],
    notes: 'Codex thread/turn/item lifecycle.',
  },
  'codex:code-generation': {
    agent: 'codex',
    exitCode: 0,
    parsedEventTypes: ['session_start', 'thinking_delta', 'tool_call_start', 'tool_result', 'message_stop'],
    notes: 'Codex function call and function_call_output mapping.',
  },
  'codex:error': {
    agent: 'codex',
    exitCode: 1,
    parsedEventTypes: ['error'],
    notes: 'Codex turn.failed envelope.',
  },
  'gemini:thinking-stream': {
    agent: 'gemini',
    exitCode: 0,
    parsedEventTypes: ['thinking_delta', 'text_delta'],
    notes: 'Gemini thinking and text streaming.',
  },
  'gemini:tool-call': {
    agent: 'gemini',
    exitCode: 0,
    parsedEventTypes: ['text_delta', 'tool_call_start', 'tool_result'],
    notes: 'Gemini tool call/result lifecycle.',
  },
  'gemini:error': {
    agent: 'gemini',
    exitCode: 1,
    parsedEventTypes: ['error'],
    notes: 'Gemini error envelope.',
  },
  'copilot:plain-text': {
    agent: 'copilot',
    exitCode: 0,
    parsedEventTypes: ['text_delta'],
    notes: 'Copilot plain-text fallback.',
  },
  'copilot:error': {
    agent: 'copilot',
    exitCode: 1,
    parsedEventTypes: ['error'],
    notes: 'Copilot JSON error fallback.',
  },
  'cursor:session-text': {
    agent: 'cursor',
    exitCode: 0,
    parsedEventTypes: ['text_delta'],
    notes: 'Cursor text output with ignored session lifecycle envelopes.',
  },
  'cursor:tool-call': {
    agent: 'cursor',
    exitCode: 0,
    parsedEventTypes: ['text_delta', 'tool_call_start'],
    notes: 'Cursor text plus tool_call envelope.',
  },
  'cursor:error': {
    agent: 'cursor',
    exitCode: 1,
    parsedEventTypes: ['error'],
    notes: 'Cursor nonzero-exit error envelope.',
  },
  'opencode:session': {
    agent: 'opencode',
    exitCode: 0,
    parsedEventTypes: ['session_start', 'text_delta', 'message_stop', 'cost'],
    notes: 'OpenCode session start/end and usage mapping.',
  },
  'opencode:tool-call': {
    agent: 'opencode',
    exitCode: 0,
    parsedEventTypes: ['session_start', 'tool_call_start', 'tool_result'],
    notes: 'OpenCode tool start/result mapping.',
  },
  'opencode:error': {
    agent: 'opencode',
    exitCode: 1,
    parsedEventTypes: ['session_start', 'error'],
    notes: 'OpenCode error envelope with bound session.',
  },
  'pi:session-text': {
    agent: 'pi',
    exitCode: 0,
    parsedEventTypes: ['text_delta'],
    notes: 'Pi message/text output with ignored session lifecycle envelopes.',
  },
  'pi:tool-call': {
    agent: 'pi',
    exitCode: 0,
    parsedEventTypes: ['text_delta', 'tool_call_start'],
    notes: 'Pi message plus tool_call envelope.',
  },
  'pi:error': {
    agent: 'pi',
    exitCode: 1,
    parsedEventTypes: ['error'],
    notes: 'Pi nonzero-exit error envelope.',
  },
  'omp:session-text': {
    agent: 'omp',
    exitCode: 0,
    parsedEventTypes: ['text_delta'],
    notes: 'OMP message/text output with ignored session lifecycle envelopes.',
  },
  'omp:tool-call': {
    agent: 'omp',
    exitCode: 0,
    parsedEventTypes: ['text_delta', 'tool_call_start'],
    notes: 'OMP text plus tool_call envelope.',
  },
  'omp:error': {
    agent: 'omp',
    exitCode: 1,
    parsedEventTypes: ['error'],
    notes: 'OMP nonzero-exit error envelope.',
  },
  'openclaw:session-text': {
    agent: 'openclaw',
    exitCode: 0,
    parsedEventTypes: ['text_delta'],
    notes: 'OpenClaw text output with ignored session lifecycle envelopes.',
  },
  'openclaw:tool-call': {
    agent: 'openclaw',
    exitCode: 0,
    parsedEventTypes: ['text_delta', 'tool_call_start'],
    notes: 'OpenClaw text plus tool_call envelope.',
  },
  'openclaw:error': {
    agent: 'openclaw',
    exitCode: 1,
    parsedEventTypes: ['error'],
    notes: 'OpenClaw nonzero-exit error envelope.',
  },
  'hermes:session-text': {
    agent: 'hermes',
    exitCode: 0,
    parsedEventTypes: ['text_delta'],
    notes: 'Hermes text output with ignored session lifecycle envelopes.',
  },
  'hermes:tool-call': {
    agent: 'hermes',
    exitCode: 0,
    parsedEventTypes: ['text_delta', 'tool_call_start'],
    notes: 'Hermes text plus tool_call envelope.',
  },
  'hermes:error': {
    agent: 'hermes',
    exitCode: 1,
    parsedEventTypes: ['error'],
    notes: 'Hermes nonzero-exit error envelope.',
  },
  'amp:session': {
    agent: 'amp',
    exitCode: 0,
    parsedEventTypes: ['session_start', 'text_delta', 'cost', 'session_end'],
    notes: 'Amp session start/text/cost/session_end lifecycle.',
  },
  'amp:tool-call': {
    agent: 'amp',
    exitCode: 0,
    parsedEventTypes: ['session_start', 'tool_call_start', 'tool_result'],
    notes: 'Amp tool_call_start and tool_result mapping.',
  },
  'amp:error': {
    agent: 'amp',
    exitCode: 1,
    parsedEventTypes: ['session_start', 'error'],
    notes: 'Amp error envelope with bound session.',
  },
  'droid:session': {
    agent: 'droid',
    exitCode: 0,
    parsedEventTypes: ['session_start', 'text_delta', 'message_stop', 'cost'],
    notes: 'Droid session/message/cost lifecycle.',
  },
  'droid:tool-call': {
    agent: 'droid',
    exitCode: 0,
    parsedEventTypes: ['session_start', 'tool_call_start', 'tool_call_ready', 'tool_result'],
    notes: 'Droid tool start/ready/result mapping.',
  },
  'droid:error': {
    agent: 'droid',
    exitCode: 1,
    parsedEventTypes: ['session_start', 'error'],
    notes: 'Droid error envelope with nonzero exit.',
  },
  'qwen:basic-text': {
    agent: 'qwen',
    exitCode: 0,
    parsedEventTypes: ['text_delta'],
    notes: 'Qwen text output.',
  },
  'qwen:tool-call': {
    agent: 'qwen',
    exitCode: 0,
    parsedEventTypes: ['text_delta', 'tool_call_start', 'tool_result'],
    notes: 'Qwen tool call/result mapping.',
  },
  'qwen:error': {
    agent: 'qwen',
    exitCode: 1,
    parsedEventTypes: ['error'],
    notes: 'Qwen error envelope.',
  },
};
