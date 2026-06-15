import { createHash } from 'node:crypto';
import { signPayload, verifySignature } from './signing.js';
import type { DelegationChainLink, IdentityKeyPair, SignedEnvelope } from './types.js';

export interface AgentRequestPayload {
  agentId: string;
  sessionId: string;
  turnNumber: number;
  requestType: 'tool_call' | 'model_request' | 'delegation';
  content: unknown;
  timestamp: string;
  delegationChain?: DelegationChainLink[];
}

export interface PromptPayload {
  promptType: 'initial' | 'followup' | 'steering';
  content: string;
  authorId: string;
  timestamp: string;
  instructionHashes?: { agentsMd?: string; systemMd?: string };
}

export function signAgentRequest(
  agentKeyPair: IdentityKeyPair,
  request: AgentRequestPayload,
): SignedEnvelope<AgentRequestPayload> {
  return signPayload(agentKeyPair.privateKey, agentKeyPair.fingerprint, request);
}

export function verifyAgentRequest(
  agentPublicKey: string,
  envelope: SignedEnvelope<AgentRequestPayload>,
): boolean {
  return verifySignature(agentPublicKey, envelope);
}

export function signPrompt(
  authorKeyPair: IdentityKeyPair,
  prompt: PromptPayload,
): SignedEnvelope<PromptPayload> {
  return signPayload(authorKeyPair.privateKey, authorKeyPair.fingerprint, prompt);
}

export function verifyPrompt(
  authorPublicKey: string,
  envelope: SignedEnvelope<PromptPayload>,
): boolean {
  return verifySignature(authorPublicKey, envelope);
}

export function hashContent(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}
