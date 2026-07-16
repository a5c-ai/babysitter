/**
 * @a5c-ai/kip-sdk — public barrel (ADR-B5 "modularize").
 *
 * This file is now a THIN re-export barrel. Per ADR-B5 the former ~7,160-line single module was
 * split, with ZERO behavior change and a byte-identical public surface, into:
 *   - `./types`     — the branded types, fact envelope, views, API + active-knowledge shapes,
 *                     `KipErrorCode`, and the `Repo` interface (pure, erased-at-runtime types).
 *   - `./kip-repo`  — the `KipError` class, the `KipRepo implements Repo` implementation and its
 *                     private helpers, and the `open()` entrypoint.
 *   - `./signing`   — the Ed25519 key helpers (already an M0-extracted sibling; re-exported here
 *                     because this package’s `exports` map only exposes `"."`, D-32).
 *
 * The `src/__tests__/public-surface.test.ts` guard pins that this barrel keeps re-exporting EXACTLY
 * the same value + type names it always has.
 */

// D-32: re-exported (not re-implemented) — the SAME `signing.ts` helpers `KipRepo`/`open` use
// internally, surfaced so a caller following the documented `OpenOptions.keyring` seam can mint or
// import a compatible keyring without reaching into a non-exported internal module.
export { generateEd25519KeyPair, importEd25519KeyPair } from "./signing";
export type { Ed25519KeyPair } from "./signing";

export * from "./types";

export { KipError, KipRepo, open } from "./kip-repo";
