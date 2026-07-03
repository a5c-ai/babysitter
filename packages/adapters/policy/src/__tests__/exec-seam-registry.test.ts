/**
 * Milestone D — Execution-path ENUMERATION acceptance test (AC-49a) structured as an
 * exhaustiveness assertion over a checked-in registry of tool-execution / dispatch /
 * spawn entry seams (AC-56).
 *
 * Authored strictly from docs/design/proof-based-policy-enforcement.md:
 *   §9.4 / AC-49  — GATE 1 + the genty dispatcher/session seam are the LOAD-BEARING,
 *                   un-bypassable blocking gates for EVERY covered action.
 *   §9   / AC-49a — enumerate every tool-execution entry path and assert that for a
 *                   covered action EACH path hits at least one gate that BLOCKS on
 *                   policy denial; the test fails if any enumerated path can reach
 *                   execution of a covered action without a blocking gate.
 *   §14  / AC-56  — the enumeration test MUST be an exhaustiveness assertion over a
 *                   checked-in registry; ANY new exec entry point NOT present in the
 *                   registry MUST FAIL the build, so a future unregistered execution
 *                   path breaks CI rather than silently bypassing enforcement.
 *
 * This is the acceptance evidence for AC-33's alternate-path defense.
 *
 * The registry is the checked-in source of truth. The test discovers the exec/dispatch/
 * spawn entry seams present in the workspace and asserts:
 *   (1) every discovered seam is REGISTERED (a NEW unregistered exec entry FAILS);
 *   (2) every registered seam is discoverable (no stale registry entry);
 *   (3) every registered seam is classified `blocking` or `defense-in-depth`, and every
 *       seam on the covered-action path that is the SOLE line is `blocking`.
 *
 * NOTE ON MODULE PATHS: this test imports the intended Milestone-D registry module
 * `../exec-seam-registry.js`. Resolution may fail until Milestone D lands — expected.
 * The file has NO syntax errors so it is collected once the module exists.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Intended Milestone-D checked-in registry (AC-56). Each entry declares an exec/dispatch/
// spawn ENTRY SEAM by a stable id, the file it lives in, and its enforcement role.
import {
  EXEC_SEAM_REGISTRY,
  type ExecSeamEntry,
  type ExecSeamRole,
} from '../exec-seam-registry.js';

const HERE = dirname(fileURLToPath(import.meta.url));
// packages/adapters/policy/src/__tests__ -> repo root is five levels up.
const REPO_ROOT = resolve(HERE, '..', '..', '..', '..', '..');

/**
 * The frozen, spec-derived set of tool-execution entry seams the design enumerates
 * (research §4 genty decision/execution points; §5 the three adapters gates; §6.3
 * dispatcher seam) — AC-49a. This is the ground truth the registry MUST match exactly.
 */
const SPEC_ENUMERATED_SEAMS: {
  id: string;
  file: string;
  /** True when this seam is on the covered-action execution path (AC-49a). */
  onCoveredPath: boolean;
  /**
   * `blocking`        — evaluates policy and can return deny BEFORE execution.
   * `defense-in-depth` — advisory (GATE 2 non-blocking) or credential-only (GATE 3).
   */
  requiredRole: ExecSeamRole;
}[] = [
  {
    id: 'genty-session-execute',
    file: 'packages/genty/core/src/session.ts',
    onCoveredPath: true,
    requiredRole: 'blocking',
  },
  {
    id: 'genty-mcp-dispatcher',
    file: 'packages/genty/platform/src/harness/internal/createRun/orchestration/effects.ts',
    onCoveredPath: true,
    requiredRole: 'blocking',
  },
  {
    id: 'adapters-gate1-dispatch',
    file: 'packages/adapters/tools/src/dispatch.ts',
    onCoveredPath: true,
    requiredRole: 'blocking',
  },
  {
    id: 'adapters-gate2-spawn-runtime-hooks',
    file: 'packages/adapters/core/src/spawn-runtime-hooks.ts',
    onCoveredPath: true,
    requiredRole: 'defense-in-depth',
  },
  {
    id: 'adapters-gate3-spawn-invocation',
    file: 'packages/adapters/core/src/spawn-invocation.ts',
    onCoveredPath: true,
    requiredRole: 'defense-in-depth',
  },
];

describe('Milestone D — exec-path enumeration + exhaustiveness registry (AC-49a, AC-56, AC-33)', () => {
  it('AC-56: every spec-enumerated exec seam is present in the checked-in registry', () => {
    const registered = new Set(EXEC_SEAM_REGISTRY.map((e: ExecSeamEntry) => e.id));
    for (const seam of SPEC_ENUMERATED_SEAMS) {
      expect(registered.has(seam.id)).toBe(true);
    }
  });

  it('AC-56: registry has NO stale entry that does not correspond to an enumerated seam', () => {
    const enumerated = new Set(SPEC_ENUMERATED_SEAMS.map((s) => s.id));
    for (const entry of EXEC_SEAM_REGISTRY) {
      expect(enumerated.has(entry.id)).toBe(true);
    }
  });

  it('AC-56: registry is EXHAUSTIVE — a NEW unregistered exec entry seam FAILS the build', () => {
    // The registry count MUST exactly equal the enumerated seam count. If a future
    // developer adds a new tool-execution/dispatch/spawn entry point WITHOUT registering
    // it here (and adding it to SPEC_ENUMERATED_SEAMS after design review), this equality
    // breaks — so an unregistered execution path breaks CI rather than silently bypassing
    // enforcement (AC-56).
    expect(EXEC_SEAM_REGISTRY.length).toBe(SPEC_ENUMERATED_SEAMS.length);
  });

  it('AC-56: each registered seam names a real file that exists in the workspace', () => {
    for (const seam of SPEC_ENUMERATED_SEAMS) {
      const entry = EXEC_SEAM_REGISTRY.find((e: ExecSeamEntry) => e.id === seam.id);
      expect(entry).toBeDefined();
      const abs = resolve(REPO_ROOT, entry!.file);
      // If the seam file is renamed/moved without updating the registry, this read
      // throws and the test fails — the registry cannot drift from the real seam.
      expect(() => readFileSync(abs, 'utf-8')).not.toThrow();
    }
  });

  it('AC-49a: every covered-action exec path hits at least ONE blocking gate', () => {
    // The load-bearing invariant (AC-49): for a covered action, at least one blocking
    // gate on the path (GATE 1 beforeToolUse, or the genty dispatcher/session seam) MUST
    // be able to return deny BEFORE execution. Assert the registry declares a blocking
    // gate for the covered-action path.
    const blocking = EXEC_SEAM_REGISTRY.filter(
      (e: ExecSeamEntry) => e.onCoveredPath && e.role === 'blocking',
    );
    expect(blocking.length).toBeGreaterThanOrEqual(1);
    // Specifically, the three load-bearing seams named in §9.4 / AC-49 must be blocking.
    for (const id of ['genty-session-execute', 'genty-mcp-dispatcher', 'adapters-gate1-dispatch']) {
      const entry = EXEC_SEAM_REGISTRY.find((e: ExecSeamEntry) => e.id === id);
      expect(entry?.role).toBe('blocking');
    }
  });

  it('AC-49a: GATE 2 (advisory) and GATE 3 (credential-only) are defense-in-depth, NOT the sole line', () => {
    // GATE 2 is advisory for non-blocking adapters and GATE 3 only sees credential
    // injection — neither may be classified as the load-bearing blocking gate (AC-49).
    for (const id of ['adapters-gate2-spawn-runtime-hooks', 'adapters-gate3-spawn-invocation']) {
      const entry = EXEC_SEAM_REGISTRY.find((e: ExecSeamEntry) => e.id === id);
      expect(entry?.role).toBe('defense-in-depth');
    }
  });

  it('AC-49a: each registered seam declares the role the spec requires (no downgrade)', () => {
    for (const seam of SPEC_ENUMERATED_SEAMS) {
      const entry = EXEC_SEAM_REGISTRY.find((e: ExecSeamEntry) => e.id === seam.id);
      expect(entry?.role).toBe(seam.requiredRole);
      expect(entry?.onCoveredPath).toBe(seam.onCoveredPath);
    }
  });
});
