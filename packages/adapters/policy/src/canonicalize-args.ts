/**
 * Milestone B — ONE shared canonical argv/args serializer (AC-52 / AC-52a / AC-53).
 *
 * The spec mandates a SINGLE canonicalizer, exported from @a5c-ai/policy-adapter and
 * imported byte-for-byte by the proxy producer and every gate:
 *   - `canonicalizeArgs(value): string`   — total, loss-preserving args serializer
 *   - `canonicalizeArgv(command): string[]` — canonical argv tokenization
 *   - `argsHash = sha256(canonicalizeArgs(args))`
 *
 * Properties the spec REQUIRES:
 *   - TOTAL: defined for every JSON-representable value; never throws on well-formed
 *     input; has an explicit DENY-path (throw) for input it cannot represent
 *     (non-finite numbers) — never a silent coercion.
 *   - LOSS-PRESERVING: does not drop, reorder-collide, or fold distinct inputs to the
 *     same bytes. Object keys are deep-sorted (genty deepSortKeys ordering), but array
 *     ORDER, string bytes, and value TYPES are preserved; NO lowercase / trim /
 *     unicode-fold.
 *   - SHARED BYTE-FOR-BYTE: the proxy path and every gate path produce byte-identical
 *     bytes because they route through the IDENTICAL exported function.
 *
 * OVERRIDING RULE: fail closed. The only throw path is the explicit deny for
 * non-representable input (non-finite number); it MUST NOT silently coerce.
 */
import { createHash } from 'node:crypto';

/**
 * Produce the canonical, loss-preserving serialization of an args value.
 *
 * Object keys are deep-sorted so key ORDER does not matter; array order, string
 * bytes, and value types are preserved. Non-finite numbers (NaN / ±Infinity) are
 * NOT JSON-representable — rather than coerce them to `null` (which `JSON.stringify`
 * does silently, a lossy fold), this canonicalizer throws (the explicit deny-path).
 */
export function canonicalizeArgs(value: unknown): string {
  return JSON.stringify(canonicalValue(value));
}

/**
 * Deep-sort object keys and recurse, preserving array order and value types.
 * Throws on any non-finite number (the explicit deny-path — never a silent coercion).
 */
function canonicalValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;

  const t = typeof value;
  if (t === 'number') {
    if (!Number.isFinite(value as number)) {
      throw new Error('canonicalizeArgs: non-finite number is not JSON-representable');
    }
    return value;
  }
  if (t === 'string' || t === 'boolean') return value;

  if (Array.isArray(value)) {
    // Preserve array ORDER; recurse into each element.
    return value.map((el) => canonicalValue(el));
  }

  if (t === 'object') {
    // Deep-sort keys (genty deepSortKeys ordering) so key order does not matter.
    const obj = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(obj).sort()) {
      sorted[key] = canonicalValue(obj[key]);
    }
    return sorted;
  }

  // bigint / function / symbol are not JSON-representable → deny (fail closed).
  throw new Error(`canonicalizeArgs: value of type ${t} is not JSON-representable`);
}

const sha256hex = (data: string): string =>
  createHash('sha256').update(data).digest('hex');

/** `argsHash = sha256(canonicalizeArgs(args))` (AC-8 / AC-52). */
export function argsHash(value: unknown): string {
  return sha256hex(canonicalizeArgs(value));
}

/** `commandHash = sha256(canonicalizeArgv(...).join('|'))` — the shared argv hash. */
export function commandHash(command: string | string[]): string {
  const argv = Array.isArray(command) ? command : canonicalizeArgv(command);
  return sha256hex(argv.join('|'));
}

/**
 * Tokenize a shell command line into a canonical argv array (AC-52). Quoting is
 * respected (single + double quotes), so a quoted argument containing spaces is a
 * SINGLE token. Token ORDER is preserved. Throws on an unterminated quote (the
 * command is not statically tokenizable → the caller must deny).
 */
export function canonicalizeArgv(command: string): string[] {
  if (typeof command !== 'string') {
    throw new Error('canonicalizeArgv: command is not a string');
  }
  return tokenize(command);
}

/**
 * A minimal POSIX-ish tokenizer: splits on unquoted whitespace, honours single and
 * double quotes and backslash escapes. Backticks and `$( )` are NOT treated as
 * quotes — they remain in the token so the matcher can detect and deny them.
 * Throws on an unterminated quote.
 */
function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let hasToken = false;
  let i = 0;
  const n = input.length;

  while (i < n) {
    const ch = input[i];

    if (ch === '"' || ch === "'") {
      hasToken = true;
      const quote = ch;
      i++;
      let closed = false;
      while (i < n) {
        const c = input[i];
        if (c === '\\' && quote === '"' && i + 1 < n) {
          // In double quotes a backslash escapes the next char.
          current += input[i + 1];
          i += 2;
          continue;
        }
        if (c === quote) {
          closed = true;
          i++;
          break;
        }
        current += c;
        i++;
      }
      if (!closed) {
        throw new Error('canonicalizeArgv: unterminated quote');
      }
      continue;
    }

    if (ch === '\\' && i + 1 < n) {
      hasToken = true;
      current += input[i + 1];
      i += 2;
      continue;
    }

    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      if (hasToken) {
        tokens.push(current);
        current = '';
        hasToken = false;
      }
      i++;
      continue;
    }

    hasToken = true;
    current += ch;
    i++;
  }

  if (hasToken) tokens.push(current);
  return tokens;
}
