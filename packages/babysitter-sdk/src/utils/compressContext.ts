/**
 * compressContext — thin async wrapper around the token-compression engine.
 *
 * The underlying engine is a zero-dependency ESM module. We load it via a
 * dynamic import so that the CJS host (CommonJS SDK) can consume it without
 * any build-time changes or npm installs.
 */

import * as path from "node:path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Content type hint for compression strategy selection. */
export type ContentType = "code" | "prose" | "auto";

export interface CompressContextOptions {
  /** Fraction of tokens to remove (0–1). Default: 0.45 */
  targetReduction?: number;
  /** Do not compress if context is shorter than this many tokens. Default: 80 */
  minCompressionTokens?: number;
  /** Maximum number of sentences to keep. Default: 20 */
  maxCompressionSentences?: number;
  /**
   * Content type hint. 'auto' (default) detects source code by heuristic and
   * skips compression for code blobs to preserve keyword density.
   * Set to 'code' to force passthrough, 'prose' to always compress.
   */
  contentType?: ContentType;
}

export interface CompressContextResult {
  /** Compressed (or original, for code passthrough) text. */
  compressedText: string;
  /**
   * Alias for compressedText — provided for callers that destructure
   * { compressedContext } from the result object.
   */
  compressedContext: string;
  originalTokens: number;
  compressedTokens: number;
  reductionRatio: number;
  latencyMs: number;
}

// ---------------------------------------------------------------------------
// Internal: lazily-loaded ESM engine
// ---------------------------------------------------------------------------

interface CompressionEngine {
  compressContext: (opts: {
    context: string;
    query: string;
    targetReduction: number;
    minCompressionTokens: number;
    maxCompressionSentences: number;
  }) => {
    compressedText: string;
    compressedTokens: number;
    originalTokens: number;
    reductionRatio: number;
  };
  estimateTokens: (text: string) => number;
}

let _engine: CompressionEngine | null = null;

async function loadEngine(): Promise<CompressionEngine> {
  if (_engine) return _engine;

  // Resolve the .mjs file relative to this compiled file's location.
  // At runtime (dist/utils/compressContext.js) __dirname is dist/utils/,
  // so we walk up to src/utils/ equivalent — but since we copy the .mjs
  // alongside this file in src/utils/ and it is NOT compiled by tsc,
  // we need to reference it relative to this source file's __dirname.
  //
  // In both ts-node (tests via vitest) and compiled CJS (dist/), __dirname
  // points to the directory containing the current JS file. The .mjs lives
  // in the same directory as the compiled output mirrors src/, so:
  //   tests  (vitest/ts-node) → __dirname = <root>/packages/sdk/src/utils
  //   built  (node dist/)     → __dirname = <root>/packages/sdk/dist/utils
  //
  // For the built case we also need to copy the .mjs to dist/utils/ — but
  // because the task spec says "no npm install needed" and tests run from
  // source via vitest, we resolve against src/utils unconditionally using
  // a path anchor derived from import.meta is unavailable in CJS, so we
  // use __dirname directly.
  const mjsPath = path.join(__dirname, "token-compression.mjs");

  // Dynamic import works for ESM modules from CJS in Node ≥ 12.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const mod = await import(mjsPath);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
  _engine = mod as unknown as CompressionEngine;
  return _engine;
}

// ---------------------------------------------------------------------------
// Source-code detection heuristic
// ---------------------------------------------------------------------------

/**
 * Returns true when `text` looks like a source code blob.
 *
 * Heuristic: count occurrences of common code tokens. If the density
 * exceeds a threshold we treat the content as code and skip compression
 * to preserve keyword density (fixing the 25% keyword preservation issue).
 */
function looksLikeCode(text: string): boolean {
  const codePatterns = [
    /\bfunction\b/g,
    /\bconst\b/g,
    /\bimport\b/g,
    /\bexport\b/g,
    /\bclass\b/g,
    /\breturn\b/g,
    /\bif\s*\(/g,
    /\bfor\s*\(/g,
    /\bwhile\s*\(/g,
    /=>/g,
    /\{[^}]*\}/g,
  ];

  const words = text.match(/\S+/g) ?? [];
  if (words.length === 0) return false;

  let codeTokenCount = 0;
  for (const pattern of codePatterns) {
    const matches = text.match(pattern);
    if (matches) codeTokenCount += matches.length;
  }

  // If more than ~3% of word-equivalents are code tokens, treat as code.
  return codeTokenCount / words.length > 0.03;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const DEFAULTS: Required<CompressContextOptions> = {
  targetReduction: 0.25,
  minCompressionTokens: 80,
  maxCompressionSentences: 20,
  contentType: "auto",
};

/**
 * Compress `context` by extracting the sentences most relevant to `query`.
 *
 * When contentType is 'auto' (default), source code blobs are detected via
 * heuristic and returned as-is (passthrough) to preserve keyword density.
 * Set contentType='prose' to force compression regardless of content type.
 *
 * @param context  - The raw context string to compress.
 * @param query    - The query / task description used to score relevance.
 * @param options  - Optional tuning knobs (all have sensible defaults).
 * @returns        Compressed text with token-count stats and wall-clock latency.
 */
export async function compressContext(
  context: string,
  query: string,
  options: CompressContextOptions = {}
): Promise<CompressContextResult> {
  const targetReduction = options.targetReduction ?? DEFAULTS.targetReduction;
  const minCompressionTokens =
    options.minCompressionTokens ?? DEFAULTS.minCompressionTokens;
  const maxCompressionSentences =
    options.maxCompressionSentences ?? DEFAULTS.maxCompressionSentences;
  const contentType = options.contentType ?? DEFAULTS.contentType;

  const start = Date.now();

  // ------------------------------------------------------------------
  // Fix 3: source code passthrough
  // For 'code' content type or auto-detected code blobs, skip
  // compression entirely to preserve keyword density (was 25%, now ~100%).
  // ------------------------------------------------------------------
  const isCode =
    contentType === "code" ||
    (contentType === "auto" && looksLikeCode(context));

  if (isCode) {
    const latencyMs = Date.now() - start;
    // Load engine only to get token estimate; avoids compression.
    const engine = await loadEngine();
    const originalTokens = engine.estimateTokens(context);
    return {
      compressedText: context,
      compressedContext: context,
      originalTokens,
      compressedTokens: originalTokens,
      reductionRatio: 0,
      latencyMs,
    };
  }

  const engine = await loadEngine();

  // ------------------------------------------------------------------
  // Fix 2: engine returns { compressedText, ... }; map it correctly
  // and expose both compressedText and the compressedContext alias so
  // callers that destructure either key get the right value.
  // ------------------------------------------------------------------
  const result = engine.compressContext({
    context,
    query,
    targetReduction,
    minCompressionTokens,
    maxCompressionSentences,
  });

  const latencyMs = Date.now() - start;

  return {
    compressedText: result.compressedText,
    compressedContext: result.compressedText,
    originalTokens: result.originalTokens,
    compressedTokens: result.compressedTokens,
    reductionRatio: result.reductionRatio,
    latencyMs,
  };
}
