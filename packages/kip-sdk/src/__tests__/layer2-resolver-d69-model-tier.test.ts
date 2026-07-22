/**
 * D-69 (ADR-B12d) — the model-assisted Layer-2 resolver's `same`→quarantine RECALL must not depend on
 * the operator remembering `--model sonnet`. The Layer-2 live demo showed the GLOBAL default tier
 * (`haiku`) does not reliably honour `claude --json-schema` (it returns correct reasoning as PROSE
 * rather than the strict verdict object), so `parseResolverVerdict` correctly N5-ABSTAINS and a true
 * `same` never becomes a quarantined `kip:same_as?` candidate — recall silently under-fires.
 *
 * The fix gives `kip resolve` its OWN structured-output-reliable default ({@link RESOLVER_DEFAULT_MODEL})
 * via the pure {@link resolverEffectiveModel} selector, used ONLY when `--model` is unset. These tests
 * pin the SELECTOR's contract (the CLI wires the result into the `--model` argv + the honest `--json`
 * `model` field; the live behaviour is proven by the opt-in live demo, not here):
 *
 *   - unset / empty / whitespace `--model` ⇒ the resolver default (NOT the global `haiku`);
 *   - an explicit `--model` override passes through VERBATIM (operator intent wins);
 *   - the default is a concrete, non-empty, non-sentinel id (never an empty `--model`);
 *   - the selector is pure/total and never returns the global graph-QA default.
 *
 * N5 is untouched by this change: it is purely a DEFAULT-tier selection. A malformed verdict on any
 * tier still ABSTAINS (that invariant is covered by `layer2-resolver.test.ts` /
 * `layer2-resolver-round2-critic-fixes.test.ts` and is not weakened here).
 */
import { describe, expect, it } from "vitest";
import {
  RESOLVER_DEFAULT_MODEL,
  resolverEffectiveModel,
} from "../linker/entity-resolver";
import { resolveHarnessModel } from "../cli/ask";

describe("D-69 / ADR-B12d — kip resolve default model tier (structured-output reliable)", () => {
  it("defaults an UNSET --model to the resolver default, NOT the global graph-QA (haiku) default", () => {
    expect(resolverEffectiveModel(undefined)).toBe(RESOLVER_DEFAULT_MODEL);
    // The whole point of the debt: the resolver default must DIFFER from the global ask default that
    // under-fires on --json-schema. If someone "simplifies" the resolver back onto resolveHarnessModel,
    // this pins the regression.
    expect(resolverEffectiveModel(undefined)).not.toBe(resolveHarnessModel(undefined));
  });

  it("treats an empty / whitespace-only --model as UNSET (never emits an empty --model)", () => {
    expect(resolverEffectiveModel("")).toBe(RESOLVER_DEFAULT_MODEL);
    expect(resolverEffectiveModel("   ")).toBe(RESOLVER_DEFAULT_MODEL);
    expect(resolverEffectiveModel("\t\n")).toBe(RESOLVER_DEFAULT_MODEL);
  });

  it("passes an EXPLICIT --model override through VERBATIM (operator intent wins)", () => {
    expect(resolverEffectiveModel("haiku")).toBe("haiku"); // operator may still opt into haiku knowingly
    expect(resolverEffectiveModel("sonnet")).toBe("sonnet");
    expect(resolverEffectiveModel("claude-opus-4-8")).toBe("claude-opus-4-8");
  });

  it("honours the KIP_RESOLVE_MODEL deployment default when --model is unset (precedence: env > built-in)", () => {
    expect(resolverEffectiveModel(undefined, "claude-opus-4-8")).toBe("claude-opus-4-8");
    // an empty / whitespace env value is treated as unset ⇒ built-in default (never an empty --model).
    expect(resolverEffectiveModel(undefined, "")).toBe(RESOLVER_DEFAULT_MODEL);
    expect(resolverEffectiveModel(undefined, "   ")).toBe(RESOLVER_DEFAULT_MODEL);
    expect(resolverEffectiveModel(undefined, "  haiku  ")).toBe("haiku"); // trimmed
  });

  it("an explicit --model OUTRANKS KIP_RESOLVE_MODEL (precedence: flag > env)", () => {
    expect(resolverEffectiveModel("sonnet", "haiku")).toBe("sonnet");
    expect(resolverEffectiveModel("claude-opus-4-8", "haiku")).toBe("claude-opus-4-8");
    // a blank flag falls through to the env default (the flag must be a REAL value to win).
    expect(resolverEffectiveModel("  ", "haiku")).toBe("haiku");
  });

  it("trims surrounding whitespace on an explicit override (a valid id survives, no empty --model)", () => {
    expect(resolverEffectiveModel("  sonnet  ")).toBe("sonnet");
  });

  it("the resolver default is a concrete, non-empty, non-sentinel model id", () => {
    expect(typeof RESOLVER_DEFAULT_MODEL).toBe("string");
    expect(RESOLVER_DEFAULT_MODEL.trim().length).toBeGreaterThan(0);
    // NOT the graph-QA sentinel and NOT the global default the sentinel maps to (the tier D-69 flagged).
    expect(RESOLVER_DEFAULT_MODEL).not.toBe("kip-graph-qa-default");
    expect(RESOLVER_DEFAULT_MODEL).not.toBe(resolveHarnessModel(undefined));
  });

  it("is pure and total — the same input always yields the same concrete, non-empty id", () => {
    for (const input of [undefined, "", "  ", "sonnet", "haiku", "x"]) {
      const out = resolverEffectiveModel(input);
      expect(out).toBe(resolverEffectiveModel(input));
      expect(out.trim().length).toBeGreaterThan(0);
    }
  });
});
