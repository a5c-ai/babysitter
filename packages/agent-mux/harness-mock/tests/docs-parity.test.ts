import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { SUBPROCESS_HARNESS_PROFILES } from '../src/scenarios/per-agent.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, '..');
const readmePath = path.join(packageRoot, 'README.md');
const referenceDocPath = path.resolve(packageRoot, '../../../docs/agent-mux/reference/14-harness-mock.md');

const DOC_CONTRACT = {
  sourceOfTruthPath: 'packages/agent-mux/harness-mock/README.md',
  packagePath: 'packages/agent-mux/harness-mock/',
  forbiddenPaths: ['packages/harness-mock/src/'],
  requiredSymbols: [
    'MockProcess',
    'WorkspaceSandbox',
    'AGENT_SCENARIOS',
    'SUBPROCESS_HARNESS_PROFILES',
    'SUBPROCESS_SCENARIO_EXPECTATIONS',
    'resolveScenario',
    'listScenarioNames',
    'HttpServerMock',
    'WebSocketServerMock',
    'createProgrammaticMockBuilder',
    'createRemoteMockBuilder',
    'createScriptableTransportBuilder',
    'ClaudeAgentSdkMock',
    'CodexSdkMock',
    'PiSdkMock',
    'OpenCodeHttpMock',
    'CodexWebSocketMock',
    'AdapterMockFactory',
    'adapterMocks',
    'mockScenarios',
    'probeHarness',
    'probeAllHarnesses',
    'compareProfiles',
    'PROBE_CONFIGS',
  ],
  executionShapes: ['subprocess', 'sdk', 'http', 'websocket'],
} as const;

function loadDoc(filePath: string) {
  return fs.readFileSync(filePath, 'utf8');
}

describe('harness-mock docs parity', () => {
  const docs = [
    ['README', loadDoc(readmePath)],
    ['reference doc', loadDoc(referenceDocPath)],
  ] as const;

  it('keeps the README as the declared canonical package doc and uses the current package path', () => {
    for (const [label, text] of docs) {
      expect(text, `${label} source-of-truth path`).toContain(DOC_CONTRACT.sourceOfTruthPath);
      expect(text, `${label} package path`).toContain(DOC_CONTRACT.packagePath);
      for (const forbiddenPath of DOC_CONTRACT.forbiddenPaths) {
        expect(text, `${label} stale path`).not.toContain(forbiddenPath);
      }
    }
  });

  it('mentions the current public API groups in both docs', () => {
    for (const [label, text] of docs) {
      for (const symbol of DOC_CONTRACT.requiredSymbols) {
        expect(text, `${label} symbol ${symbol}`).toContain(symbol);
      }
    }
  });

  it('documents the current subprocess harness matrix and execution shapes', () => {
    const harnesses = Object.keys(SUBPROCESS_HARNESS_PROFILES);

    for (const [label, text] of docs) {
      for (const harness of harnesses) {
        expect(text, `${label} harness ${harness}`).toContain(`\`${harness}\``);
      }
      for (const executionShape of DOC_CONTRACT.executionShapes) {
        expect(text, `${label} execution shape ${executionShape}`).toContain(executionShape);
      }
    }
  });
});
