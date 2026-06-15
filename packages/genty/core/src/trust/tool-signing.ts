import { signPayload, verifySignature } from './signing.js';
import type { IdentityKeyPair, SignedEnvelope } from './types.js';

export interface ToolResultPayload {
  toolName: string;
  inputParams: unknown;
  output: unknown;
  timestamp: string;
  requestSignature?: string;
  upstreamSignatures?: string[];
}

export interface PermissionEvidencePayload {
  action: string;
  scope: string;
  approvedBy: string;
  approvedAt: string;
  expiresAt?: string;
  conditions?: Record<string, unknown>;
}

export function signToolResult(
  toolKeyPair: IdentityKeyPair,
  result: ToolResultPayload,
): SignedEnvelope<ToolResultPayload> {
  return signPayload(toolKeyPair.privateKey, toolKeyPair.fingerprint, result);
}

export function verifyToolResult(
  toolPublicKey: string,
  envelope: SignedEnvelope<ToolResultPayload>,
): boolean {
  return verifySignature(toolPublicKey, envelope);
}

export function signPermissionEvidence(
  approverKeyPair: IdentityKeyPair,
  permission: PermissionEvidencePayload,
): SignedEnvelope<PermissionEvidencePayload> {
  return signPayload(approverKeyPair.privateKey, approverKeyPair.fingerprint, permission);
}

export function verifyPermissionEvidence(
  approverPublicKey: string,
  envelope: SignedEnvelope<PermissionEvidencePayload>,
): boolean {
  return verifySignature(approverPublicKey, envelope);
}

export function isPermissionValid(envelope: SignedEnvelope<PermissionEvidencePayload>): boolean {
  if (envelope.payload.expiresAt) {
    return new Date(envelope.payload.expiresAt) > new Date();
  }
  return true;
}
