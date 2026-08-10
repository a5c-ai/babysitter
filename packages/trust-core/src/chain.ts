import { verifySignature } from './signing.js';
import type { SignedEnvelope } from './types.js';

export interface TrustChainLink {
  step: string;
  envelope: SignedEnvelope;
  publicKey: string;
  parentSignature?: string;
}

export interface ChainVerificationResult {
  valid: boolean;
  brokenAt?: number;
  brokenStep?: string;
  reason?: string;
  verifiedLinks: number;
  totalLinks: number;
}

export function verifyTrustChain(chain: TrustChainLink[]): ChainVerificationResult {
  for (let i = 0; i < chain.length; i++) {
    const link = chain[i];

    if (!verifySignature(link.publicKey, link.envelope)) {
      return {
        valid: false,
        brokenAt: i,
        brokenStep: link.step,
        reason: `Signature verification failed at step ${i}: ${link.step}`,
        verifiedLinks: i,
        totalLinks: chain.length,
      };
    }

    if (i > 0 && link.parentSignature) {
      const parentEnvelope = chain[i - 1].envelope;
      if (link.parentSignature !== parentEnvelope.signature) {
        return {
          valid: false,
          brokenAt: i,
          brokenStep: link.step,
          reason: `Parent signature mismatch at step ${i}: ${link.step}`,
          verifiedLinks: i,
          totalLinks: chain.length,
        };
      }
    }
  }

  return {
    valid: true,
    verifiedLinks: chain.length,
    totalLinks: chain.length,
  };
}
