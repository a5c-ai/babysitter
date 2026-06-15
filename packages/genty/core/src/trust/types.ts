export interface SignedEnvelope<T = unknown> {
  payload: T;
  signature: string;
  publicKeyFingerprint: string;
  signedAt: string;
  signedFields: string[];
  algorithm: 'Ed25519';
}

export interface IdentityKeyPair {
  publicKey: string;
  privateKey: string;
  fingerprint: string;
}

export interface AgentIdentity {
  kind: 'agent';
  agentId: string;
  sessionId: string;
  keyPair: IdentityKeyPair;
}

export interface ToolIdentity {
  kind: 'tool';
  toolName: string;
  keyPair: IdentityKeyPair;
}

export interface DelegationChainLink {
  delegatorFingerprint: string;
  delegatorSignature: string;
  delegatedAt: string;
}

export type Identity = AgentIdentity | ToolIdentity;
