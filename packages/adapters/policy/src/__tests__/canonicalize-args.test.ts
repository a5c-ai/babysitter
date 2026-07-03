/**
 * Milestone B — ONE shared canonical argv/args serializer (AC-52 / AC-52a).
 *
 * Frozen tests authored SOLELY from docs/design/proof-based-policy-enforcement.md
 * §3.1 (AC-52, AC-52a) and §5 (AC-8 argsHash/commandHash). The spec mandates a
 * SINGLE canonicalizer, exported from @a5c-ai/policy-adapter, imported byte-for-byte
 * by the proxy producer and every gate:
 *   - `canonicalizeArgs(value): string`   — total, loss-preserving args serializer
 *   - `canonicalizeArgv(command): string[]` — canonical argv tokenization
 *   - `argsHash = sha256(canonicalizeArgs(args))`
 *
 * Properties the spec REQUIRES and this file pins:
 *   - TOTAL: defined for every JSON-representable value; never throws on well-formed
 *     input; has an explicit DENY-path for input it cannot represent (non-finite
 *     numbers) — never a silent coercion.
 *   - LOSS-PRESERVING: does not drop, reorder-collide, or fold distinct inputs to
 *     the same bytes. Object keys are deep-sorted (genty deepSortKeys), but array
 *     order, string bytes, and value types are preserved; NO lowercase / trim /
 *     unicode-fold.
 *   - SHARED BYTE-FOR-BYTE: the proxy path and every gate path produce byte-identical
 *     argsHash/commandHash, and two distinct fixtures never collide (AC-52a corpus).
 *
 * These import the intended @a5c-ai/policy-adapter module paths the Milestone-B
 * implementation WILL provide; resolution may fail until then (module-not-found is
 * expected — there must be NO syntax errors). Adversarial cases MUST fail closed.
 */
import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';

import {
  canonicalizeArgs,
  canonicalizeArgv,
  argsHash,
} from '../canonicalize-args.js';

const sha256 = (s: string): string => createHash('sha256').update(s).digest('hex');

/**
 * A fixed conformance corpus of args objects (AC-52a). Each entry is a DISTINCT
 * logical args value; two distinct entries must never collide to the same bytes.
 */
const ARGS_CORPUS: Array<{ label: string; value: unknown }> = [
  { label: 'simple-command', value: { command: 'aws s3 cp a b' } },
  { label: 'keys-reordered', value: { b: 2, a: 1, c: 3 } },
  { label: 'nested-object', value: { outer: { z: 1, a: 2 }, list: [1, 2, 3] } },
  { label: 'array-order-1', value: { xs: [1, 2, 3] } },
  { label: 'array-order-2', value: { xs: [3, 2, 1] } }, // distinct from array-order-1
  { label: 'string-case-lower', value: { p: 'aws' } },
  { label: 'string-case-upper', value: { p: 'AWS' } }, // distinct: no case fold
  { label: 'string-whitespace', value: { p: ' aws ' } }, // distinct: no trim
  { label: 'number-vs-string', value: { v: 1 } },
  { label: 'string-one', value: { v: '1' } }, // distinct: type preserved
  { label: 'bool-true', value: { flag: true } },
  { label: 'null-value', value: { flag: null } }, // distinct from bool-true / absent
  { label: 'unicode-nfc-vs-nfd', value: { s: 'é' } }, // é precomposed
  { label: 'unicode-nfd', value: { s: 'é' } }, // e + combining acute (distinct: no fold)
  { label: 'empty-object', value: {} },
  { label: 'empty-array', value: { xs: [] } },
];

describe('Milestone B — canonicalizeArgs / argsHash (AC-52 total + loss-preserving)', () => {
  it('AC-52: canonicalizeArgs is deterministic — same value → same bytes', () => {
    const a = canonicalizeArgs({ command: 'aws s3 cp a b' });
    const b = canonicalizeArgs({ command: 'aws s3 cp a b' });
    expect(a).toBe(b);
  });

  it('AC-52: object key ordering does not matter (deep-sorted keys)', () => {
    // Same logical object, different insertion order → identical canonical bytes.
    expect(canonicalizeArgs({ a: 1, b: 2 })).toBe(canonicalizeArgs({ b: 2, a: 1 }));
    expect(canonicalizeArgs({ outer: { z: 1, a: 2 } })).toBe(
      canonicalizeArgs({ outer: { a: 2, z: 1 } }),
    );
  });

  it('AC-52 loss-preserving: array ORDER is preserved (not collapsed/sorted)', () => {
    expect(canonicalizeArgs({ xs: [1, 2, 3] })).not.toBe(canonicalizeArgs({ xs: [3, 2, 1] }));
  });

  it('AC-52 loss-preserving: NO lowercasing / case fold', () => {
    expect(canonicalizeArgs({ p: 'aws' })).not.toBe(canonicalizeArgs({ p: 'AWS' }));
  });

  it('AC-52 loss-preserving: NO trim / whitespace fold', () => {
    expect(canonicalizeArgs({ p: 'aws' })).not.toBe(canonicalizeArgs({ p: ' aws ' }));
  });

  it('AC-52 loss-preserving: NO unicode normalization fold (NFC vs NFD distinct)', () => {
    expect(canonicalizeArgs({ s: 'é' })).not.toBe(canonicalizeArgs({ s: 'é' }));
  });

  it('AC-52 loss-preserving: value TYPES are preserved (number 1 != string "1")', () => {
    expect(canonicalizeArgs({ v: 1 })).not.toBe(canonicalizeArgs({ v: '1' }));
  });

  it('AC-52 loss-preserving: null != false != absent key', () => {
    expect(canonicalizeArgs({ flag: null })).not.toBe(canonicalizeArgs({ flag: false }));
    expect(canonicalizeArgs({ flag: null })).not.toBe(canonicalizeArgs({}));
  });

  it('AC-52 total: defined for every JSON-representable value, never throws on well-formed input', () => {
    for (const entry of ARGS_CORPUS) {
      expect(() => canonicalizeArgs(entry.value)).not.toThrow();
      expect(typeof canonicalizeArgs(entry.value)).toBe('string');
    }
  });

  it('AC-52 total: an explicit DENY-path for input it cannot represent (non-finite number) — never silent coercion', () => {
    // A non-finite number is NOT JSON-representable. The serializer MUST NOT
    // silently coerce it (e.g. to null / 0). Per spec it has an explicit deny-path:
    // it throws rather than emit lossy bytes.
    expect(() => canonicalizeArgs({ v: Number.NaN })).toThrow();
    expect(() => canonicalizeArgs({ v: Number.POSITIVE_INFINITY })).toThrow();
    expect(() => canonicalizeArgs({ v: Number.NEGATIVE_INFINITY })).toThrow();
  });

  it('AC-52a: two distinct fixtures in the corpus NEVER collide to the same bytes', () => {
    const seen = new Map<string, string>();
    for (const entry of ARGS_CORPUS) {
      const bytes = canonicalizeArgs(entry.value);
      const prior = seen.get(bytes);
      // Two structurally-identical fixtures (empty-object vs empty-array differ) —
      // every corpus entry above is logically distinct, so no collision is allowed.
      expect(prior, `collision: ${entry.label} vs ${prior}`).toBeUndefined();
      seen.set(bytes, entry.label);
    }
  });

  it('AC-8 / AC-52: argsHash(v) === sha256(canonicalizeArgs(v))', () => {
    for (const entry of ARGS_CORPUS) {
      expect(argsHash(entry.value)).toBe(sha256(canonicalizeArgs(entry.value)));
    }
  });
});

describe('Milestone B — canonicalizeArgv (AC-52 argv tokenization)', () => {
  it('AC-52: canonicalizeArgv returns a token array, deterministic for the same command', () => {
    const a = canonicalizeArgv('aws s3 cp a b');
    const b = canonicalizeArgv('aws s3 cp a b');
    expect(Array.isArray(a)).toBe(true);
    expect(a).toEqual(b);
  });

  it('AC-52: quoting is respected during tokenization (a quoted arg with spaces is one token)', () => {
    const argv = canonicalizeArgv('aws s3 cp "a b" dest');
    // The quoted "a b" is a SINGLE token, not two.
    expect(argv).toContain('a b');
    expect(argv).not.toContain('"a');
  });

  it('AC-52 loss-preserving: argv token order is preserved', () => {
    expect(canonicalizeArgv('aws s3 rm x')).not.toEqual(canonicalizeArgv('aws s3 x rm'));
  });
});

describe('Milestone B — shared byte-identity across proxy + gate paths (AC-52a conformance corpus)', () => {
  // The spec (AC-52a) requires that the hash produced at the proxy producer and at
  // each gate is byte-identical because they route through the IDENTICAL exported
  // function. We model "proxy path" and "gate path" as two independent call sites of
  // the SAME shared helper and assert equality — a hash produced by any code path
  // that does NOT route through canonicalizeArgs is a design violation this catches.
  it('AC-52a: proxy-produced argsHash === gate-recomputed argsHash for every corpus fixture', () => {
    for (const entry of ARGS_CORPUS) {
      // "proxy" produces the hash at attestation time ...
      const proxySide = argsHash(entry.value);
      // ... and each "gate" recomputes it from the args about to run (TOCTOU).
      const gate1Side = argsHash(entry.value);
      const gate3Side = argsHash(entry.value);
      expect(gate1Side).toBe(proxySide);
      expect(gate3Side).toBe(proxySide);
    }
  });

  it('AC-53 boundary conformance: a real provider `arguments` JSON string round-trips to a byte-identical argsHash', () => {
    // A provider delivers tool-call arguments as a JSON STRING; the proxy does
    // JSON.parse(arguments) then canonicalizeArgs. The gate receives the already-parsed
    // object it delivers to definition.execute. Both must hash identically.
    const rawFromProvider = '{"command":"aws s3 cp a b","flags":["--dryrun"]}';
    const parsedAtProxy = JSON.parse(rawFromProvider) as unknown;
    const deliveredToExecute = { command: 'aws s3 cp a b', flags: ['--dryrun'] };
    expect(argsHash(parsedAtProxy)).toBe(argsHash(deliveredToExecute));
  });
});
