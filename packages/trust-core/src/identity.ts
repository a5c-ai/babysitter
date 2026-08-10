import { createKeyPair } from './signing.js';
import type { AgentIdentity, ToolIdentity } from './types.js';

export function createAgentIdentity(agentId: string, sessionId: string): AgentIdentity {
  return {
    kind: 'agent',
    agentId,
    sessionId,
    keyPair: createKeyPair(),
  };
}

export function createToolIdentity(toolName: string): ToolIdentity {
  return {
    kind: 'tool',
    toolName,
    keyPair: createKeyPair(),
  };
}
