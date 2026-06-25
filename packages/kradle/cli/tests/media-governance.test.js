import assert from 'node:assert/strict';
import test from 'node:test';
import { createMcpServer, MCP_TOOLS } from '../src/mcp-server.js';
import { evaluateVisualPolicy, createPolicyEngine } from '../src/policy-engine.js';
import { isGovernedVisualTool, getGovernedTool, GOVERNED_VISUAL_TOOLS } from '../src/governed-tools.js';

function rpc(method, params = {}, id = 1) {
  return { jsonrpc: '2.0', id, method, params };
}

function parseToolResult(resp) {
  assert.ok(resp.result, JSON.stringify(resp));
  return JSON.parse(resp.result.content[0].text);
}

const GOVERNED_CONTEXT = {
  roomId: 'daily-room',
  role: 'agent',
  capabilities: { video: 'publish', screenshare: 'share', chat: 'readwrite', audio: 'publish' },
  governedTools: ['draw_canvas', 'share_surface', 'send_video_metadata'],
};

function governedCall(server, name, args, meetingContext = GOVERNED_CONTEXT) {
  return server.handleMessage(rpc('tools/call', { name, arguments: { ...args, meetingContext } }));
}

test('MCP_TOOLS length stays 42 (no tool added by governance routing)', () => {
  assert.equal(MCP_TOOLS.length, 42);
});

test('governed visual tools return a governance descriptor with NO direct command', async () => {
  const server = createMcpServer({ controller: {} });
  const cases = [
    ['kradle_draw_canvas', { content: 'slide deck' }, 'draw_canvas', 'auth.draw-canvas'],
    ['kradle_share_surface', { surface: 'browser', url: 'https://slides.example/x' }, 'share_surface', 'auth.share-surface'],
    ['kradle_send_video_metadata', { metadata: { sink: 'external-crm', external: true } }, 'send_video_metadata', 'destroy.send-video-metadata'],
  ];
  for (const [name, args, action, breakpointId] of cases) {
    const result = parseToolResult(await governedCall(server, name, args));
    assert.equal(result.governed, true, `${name} must be governed`);
    assert.equal(result.tool, action);
    assert.ok(typeof result.correlationId === 'string' && result.correlationId.length > 0, `${name} correlationId`);
    assert.ok(typeof result.filler === 'string' && result.filler.length > 0, `${name} filler`);
    assert.ok(result.policy && typeof result.policy === 'object', `${name} policy object`);
    assert.equal(result.policy.decision, 'require-approval', `${name} decision`);
    assert.equal(result.policy.breakpointId, breakpointId, `${name} breakpointId`);
    assert.ok(typeof result.governedProcess === 'string', `${name} governedProcess ref`);
    assert.ok(result.inputs && result.inputs.action === action, `${name} inputs`);
    assert.ok(!('command' in result), `${name} must NOT carry a direct command`);
  }
});

test('correlationId is deterministic for identical {tool, inputs, nonce}', async () => {
  const server = createMcpServer({ controller: {} });
  const args = { content: 'persistent slide', nonce: 'n-1' };
  const a = parseToolResult(await governedCall(server, 'kradle_draw_canvas', args));
  const b = parseToolResult(await governedCall(server, 'kradle_draw_canvas', args));
  assert.equal(a.correlationId, b.correlationId, 'same inputs => same correlationId');

  // An explicit correlationId override is honored verbatim.
  const c = parseToolResult(await governedCall(server, 'kradle_draw_canvas', { content: 'x', correlationId: 'explicit-corr' }));
  assert.equal(c.correlationId, 'explicit-corr');
});

test('declaration gate: a governed tool NOT in context.governedTools is rejected', async () => {
  const server = createMcpServer({ controller: {} });
  const ctxWithout = { ...GOVERNED_CONTEXT, governedTools: ['draw_canvas'] };
  const denied = await governedCall(server, 'kradle_share_surface', { surface: 'browser' }, ctxWithout);
  assert.equal(denied.result.isError, true, 'undeclared governed tool must error');
  assert.match(JSON.parse(denied.result.content[0].text).error, /not governed for this agent/);
});

test('governed tool still enforces the existing capability gate', async () => {
  const server = createMcpServer({ controller: {} });
  const noVideo = { ...GOVERNED_CONTEXT, capabilities: { ...GOVERNED_CONTEXT.capabilities, video: 'none' } };
  const denied = await governedCall(server, 'kradle_draw_canvas', { content: 'x' }, noVideo);
  assert.equal(denied.result.isError, true);
  assert.match(JSON.parse(denied.result.content[0].text).error, /video publish is not enabled/);
});

test('hard-deny policy returns denied descriptor with NO command and NO socketPath', async () => {
  const server = createMcpServer({ controller: {} });
  const result = parseToolResult(await governedCall(server, 'kradle_share_surface', { surface: 'system' }));
  assert.equal(result.governed, true);
  assert.equal(result.denied, true);
  assert.equal(result.reason, 'surface-not-allowed');
  assert.ok(!('command' in result), 'deny must not carry a command');
  assert.ok(!('socketPath' in result), 'deny must not carry a socketPath');
});

test('fast cosmetic tool returns the exact direct {socketPath, command} (unchanged)', async () => {
  const server = createMcpServer({ controller: {} });
  const meetingContext = { roomId: 'daily-room', role: 'agent', capabilities: { video: 'publish', screenshare: 'share', chat: 'readwrite', audio: 'publish' } };
  const expr = parseToolResult(await server.handleMessage(rpc('tools/call', { name: 'kradle_set_expression', arguments: { mood: 'happy', meetingContext } })));
  assert.equal(expr.socketPath, '/tmp/jitsi-agent.sock');
  assert.deepEqual(expr.command, { action: 'set_expression', mood: 'happy' });
  assert.ok(!('governed' in expr), 'fast tool must not be governed');

  const pub = parseToolResult(await server.handleMessage(rpc('tools/call', { name: 'kradle_publish_video', arguments: { enabled: true, meetingContext } })));
  assert.deepEqual(pub.command, { action: 'publish_video', enabled: true });
});

test('existing meeting tool (send_chat) returns the exact direct command (unchanged)', async () => {
  const server = createMcpServer({ controller: {} });
  const meetingContext = { roomId: 'daily-room', role: 'participant', capabilities: { chat: 'readwrite', audio: 'listen', screenshare: 'share' } };
  const chat = parseToolResult(await server.handleMessage(rpc('tools/call', { name: 'kradle_send_chat_message', arguments: { text: 'hello', meetingContext } })));
  assert.equal(chat.socketPath, '/tmp/jitsi-agent.sock');
  assert.deepEqual(chat.command, { action: 'send_chat', text: 'hello' });
});

test('PolicyEngine: allow / require-approval / deny for representative inputs', () => {
  // allow — internal metadata (no sink, no url, not external)
  const allow = evaluateVisualPolicy('send_video_metadata', { metadata: { caption: 'slide 1' } }, {});
  assert.equal(allow.decision, 'allow');
  assert.equal(allow.breakpointId, null);

  // require-approval — screen-share start
  const share = evaluateVisualPolicy('share_surface', { surface: 'browser', url: 'https://x' }, {});
  assert.equal(share.decision, 'require-approval');
  assert.equal(share.breakpointId, 'auth.share-surface');

  // require-approval — persistent canvas content
  const canvas = evaluateVisualPolicy('draw_canvas', { content: 'persistent' }, {});
  assert.equal(canvas.decision, 'require-approval');
  assert.equal(canvas.breakpointId, 'auth.draw-canvas');

  // require-approval — external metadata sink
  const external = evaluateVisualPolicy('send_video_metadata', { metadata: { sink: 'external-crm', external: true } }, {});
  assert.equal(external.decision, 'require-approval');
  assert.equal(external.breakpointId, 'destroy.send-video-metadata');

  // deny — disallowed surface
  const denySurface = evaluateVisualPolicy('share_surface', { surface: 'system' }, {});
  assert.equal(denySurface.decision, 'deny');
  assert.equal(denySurface.reason, 'surface-not-allowed');

  // deny — denylisted metadata sink
  const denySink = evaluateVisualPolicy('send_video_metadata', { metadata: { sink: 'exfil' } }, {});
  assert.equal(denySink.decision, 'deny');
  assert.equal(denySink.reason, 'metadata-sink-not-allowed');

  // deny — disallowed url scheme on share_surface
  const denyScheme = evaluateVisualPolicy('share_surface', { surface: 'browser', url: 'file:///etc/passwd' }, {});
  assert.equal(denyScheme.decision, 'deny');
});

test('createPolicyEngine honors injected rule overrides', () => {
  const engine = createPolicyEngine({ deniedSurfaces: ['browser'] });
  const denied = engine.evaluate('share_surface', { surface: 'browser' }, {});
  assert.equal(denied.decision, 'deny');
  assert.equal(denied.reason, 'surface-not-allowed');
});

test('governed-tools registry exposes the three visual tools', () => {
  assert.ok(isGovernedVisualTool('draw_canvas'));
  assert.ok(isGovernedVisualTool('share_surface'));
  assert.ok(isGovernedVisualTool('send_video_metadata'));
  assert.ok(!isGovernedVisualTool('set_expression'));
  assert.equal(getGovernedTool('draw_canvas').approvalPosture, 'auth');
  assert.equal(getGovernedTool('send_video_metadata').approvalPosture, 'destroy');
  assert.equal(Object.keys(GOVERNED_VISUAL_TOOLS).length, 3);
});
