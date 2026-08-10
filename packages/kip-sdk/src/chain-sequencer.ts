/**
 * chain-sequencer.ts — the `seq` half of ADR-B4 ("...plus a fully separate `ChainSequencer` per
 * `(replicaId,key)` minting the `seq` field"). This is deliberately independent of hlc.ts: `seq`
 * is `seq=0` at genesis, strictly `previous+1`, durably persisted, NEVER advanced by receipt
 * (docs/22 §2.1 step 3 / m7-1: the receive-advance rule touches only the local HLC, never the
 * per-key chain sequence), and never reset by wall-clock rollover.
 *
 * `ChainId` (index.ts) = `"<replicaId>/<keyFpr>"` — keyed on the AUTHOR's signing-key fingerprint
 * and stamped replicaId, per docs/22 §7 ("§4b.1/m7-1"). One `ChainSequencer` instance is meant to
 * be scoped to one repo/replica and durably persisted alongside the git substrate (T1.2.5's
 * "durable seq-tip persistence").
 */
import type { ChainId } from "./index";

export interface ChainSequencerSnapshot {
  [chainId: string]: number;
}

export class ChainSequencer {
  private readonly tips = new Map<ChainId, number>();

  constructor(initial?: ChainSequencerSnapshot) {
    if (initial) {
      for (const [chainId, seq] of Object.entries(initial)) {
        this.tips.set(chainId, seq);
      }
    }
  }

  /** Mint the next `seq` for `chainId` — genesis is 0, else strictly `previous + 1`. */
  next(chainId: ChainId): number {
    const previous = this.tips.get(chainId);
    const seq = previous === undefined ? 0 : previous + 1;
    this.tips.set(chainId, seq);
    return seq;
  }

  /** A durable, JSON-serializable snapshot of every chain tip this sequencer has minted. */
  snapshot(): ChainSequencerSnapshot {
    return Object.fromEntries(this.tips.entries());
  }
}

/** `ChainId = "<replicaId>/<keyFpr>"` (docs/22 §7, index.ts `ChainId` doc comment). */
export function chainIdFor(replicaId: string, keyFpr: string): ChainId {
  return `${replicaId}/${keyFpr}`;
}
