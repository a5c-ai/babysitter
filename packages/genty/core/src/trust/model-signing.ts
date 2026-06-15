import { signPayload, verifySignature } from './signing.js';
import type { IdentityKeyPair, SignedEnvelope } from './types.js';

export interface ModelResponsePayload {
  modelId: string;
  provider: string;
  inputMessagesHash: string;
  outputContent: string;
  thinkingContent?: string;
  tokenUsage?: { input: number; output: number };
  timestamp: string;
}

export function signModelResponse(
  adapterKeyPair: IdentityKeyPair,
  response: ModelResponsePayload,
): SignedEnvelope<ModelResponsePayload> {
  return signPayload(adapterKeyPair.privateKey, adapterKeyPair.fingerprint, response);
}

export function verifyModelResponse(
  adapterPublicKey: string,
  envelope: SignedEnvelope<ModelResponsePayload>,
): boolean {
  return verifySignature(adapterPublicKey, envelope);
}
