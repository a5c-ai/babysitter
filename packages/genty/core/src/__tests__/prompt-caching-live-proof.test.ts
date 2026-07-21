/**
 * End-to-end proof that genty-core emits CACHE-FRIENDLY LLM requests AND
 * correctly parses cache telemetry, for BOTH the Anthropic (Claude) and the
 * OpenAI code paths — by driving the REAL public API surface
 * (`createAgentCoreSession(...).prompt(...)`) against a faithful
 * `globalThis.fetch` oracle.
 *
 * WHY THIS IS AN HONEST PROOF (not a rubber stamp):
 *   - The oracle NEVER blindly returns a cache hit. It parses the ACTUAL bytes
 *     genty sends and grants a hit ONLY when those bytes are genuinely
 *     cache-friendly:
 *       * Anthropic: a `cache_control` breakpoint must actually be present, and
 *         the exact `{system, tools}` prefix must have been seen earlier in the
 *         scenario. No `cache_control` ⇒ never a hit, ever, even on repeats.
 *       * OpenAI: the stable prefix (`messages.slice(0, -1)`) must be
 *         byte-identical to a previously-seen request within the scenario.
 *   - Every scenario ships a NEGATIVE control proving the positive was caused by
 *     genty's own behavior (the `cache_control` markers / the stable prefix),
 *     not by the oracle being generous.
 *   - All assertions are on genty's OUTPUT (`result.usage.cacheReadTokens` /
 *     `.cacheWriteTokens`), i.e. the value it PARSED from the telemetry — plus a
 *     few on the oracle's record of what genty actually put on the wire.
 *
 * No product source is modified. The whole proof lives in this test file.
 */
import { Type } from "@sinclair/typebox";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createAgentCoreSession } from "../session";
import type { CustomToolDefinition } from "../types";

// ---------------------------------------------------------------------------
// A large, stable prefix. Only the final user turn differs between call 1 and
// call 2 of a scenario; the system prompt + tools are the cacheable prefix.
// ---------------------------------------------------------------------------
const BIG_SYSTEM_PROMPT =
  "You are a meticulous senior engineering assistant. " +
  "Follow the house style, cite exact file paths, never invent APIs. ".repeat(40);
// A second, DIFFERENT large prefix used to break OpenAI's stable-prefix cache.
const BIG_SYSTEM_PROMPT_ALT =
  "You are a terse reviewer. Answer only with verified facts. " +
  "Prefer smallest diffs, never speculate about unseen code. ".repeat(40);

function makeTool(name: string): CustomToolDefinition {
  return {
    name,
    label: name,
    description: `A ${name} tool used only to fatten the cacheable tool prefix; the oracle never calls it.`,
    parameters: Type.Object({
      query: Type.String({ description: "search query" }),
      limit: Type.Optional(Type.Number({ description: "max results" })),
    }),
    // The oracle returns plain text + a stop with NO tool calls, so execute()
    // never runs. It exists only to satisfy the type.
    execute: () => ({ content: [{ type: "text", text: "unused" }] }),
  };
}

const TOOL = makeTool("search_docs");

// ---------------------------------------------------------------------------
// SSE byte builders — shaped EXACTLY as readAnthropicStream / readOpenAiStream
// parse them (correct event `type`s, `data: ` prefixes, `[DONE]`, and the exact
// usage field names the parsers read).
// ---------------------------------------------------------------------------
function sse(obj: unknown): string {
  return `data: ${JSON.stringify(obj)}\n\n`;
}

function anthropicStreamBytes(startUsage: Record<string, number>): string {
  return (
    sse({ type: "message_start", message: { usage: startUsage } }) +
    sse({ type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "ok" } }) +
    sse({ type: "message_delta", usage: { output_tokens: 3 } }) +
    sse({ type: "message_stop" })
  );
}

function openAiStreamBytes(finalUsage: Record<string, unknown>): string {
  return (
    sse({ choices: [{ delta: { content: "ok" }, finish_reason: null }] }) +
    sse({ choices: [{ delta: {}, finish_reason: "stop" }], usage: finalUsage }) +
    "data: [DONE]\n\n"
  );
}

function streamResponse(bytes: string): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(bytes));
      controller.close();
    },
  });
  return new Response(body, { status: 200, headers: { "content-type": "text/event-stream" } });
}

// ---------------------------------------------------------------------------
// The faithful fetch oracle. It decides cache reads/writes ONLY from the real
// request bytes, and records exactly what it observed so the test can assert on
// genty's wire behavior. State is resettable and MUST be reset per scenario so
// prefixes never collide across scenarios.
// ---------------------------------------------------------------------------
interface AnthropicObservation {
  provider: "anthropic";
  hasCacheControl: boolean;
  sawCacheControlOnSystem: boolean;
  sawCacheControlOnLastTool: boolean;
  prefixKey: string;
  decision: "write" | "read" | "miss";
}
interface OpenAiObservation {
  provider: "openai";
  prefixKey: string;
  promptCacheKey: string | undefined;
  decision: "read" | "miss";
}
type Observation = AnthropicObservation | OpenAiObservation;

function createOracle() {
  const seenPrefixes = new Set<string>();
  const observations: Observation[] = [];

  function reset(): void {
    seenPrefixes.clear();
    observations.length = 0;
  }

  const fetchImpl = async (input: unknown, init?: { body?: unknown }): Promise<Response> => {
    const url = String(input);
    const body = JSON.parse(String(init?.body ?? "{}")) as Record<string, any>;

    // ---- (A) Anthropic /v1/messages -------------------------------------
    if (url.includes("api.anthropic.com") || url.includes("/v1/messages")) {
      const system = body.system;
      const tools: any[] = Array.isArray(body.tools) ? body.tools : [];
      const sawCacheControlOnSystem =
        Array.isArray(system) &&
        system.some((b) => b && typeof b === "object" && "cache_control" in b);
      const lastTool = tools[tools.length - 1];
      const sawCacheControlOnLastTool = Boolean(
        lastTool && typeof lastTool === "object" && "cache_control" in lastTool,
      );
      const anyToolHasCacheControl = tools.some(
        (t) => t && typeof t === "object" && "cache_control" in t,
      );
      const hasCacheControl = sawCacheControlOnSystem || anyToolHasCacheControl;
      const prefixKey = JSON.stringify({ system: body.system, tools: body.tools });

      let decision: AnthropicObservation["decision"];
      let startUsage: Record<string, number>;
      if (hasCacheControl && seenPrefixes.has(prefixKey)) {
        decision = "read";
        startUsage = { input_tokens: 12, cache_read_input_tokens: 1500 };
      } else if (hasCacheControl) {
        decision = "write";
        startUsage = { input_tokens: 1512, cache_creation_input_tokens: 1500 };
        seenPrefixes.add(prefixKey);
      } else {
        // No cache_control anywhere ⇒ NEVER a cache read/write, even on repeats.
        decision = "miss";
        startUsage = { input_tokens: 1512 };
      }

      observations.push({
        provider: "anthropic",
        hasCacheControl,
        sawCacheControlOnSystem,
        sawCacheControlOnLastTool,
        prefixKey,
        decision,
      });
      return streamResponse(anthropicStreamBytes(startUsage));
    }

    // ---- (B) OpenAI /chat/completions -----------------------------------
    if (url.includes("api.openai.com") || url.includes("/chat/completions")) {
      const messages: unknown[] = Array.isArray(body.messages) ? body.messages : [];
      const prefixKey = JSON.stringify(messages.slice(0, -1));
      const promptCacheKey =
        typeof body.prompt_cache_key === "string" ? body.prompt_cache_key : undefined;

      let decision: OpenAiObservation["decision"];
      let finalUsage: Record<string, unknown>;
      if (seenPrefixes.has(prefixKey)) {
        decision = "read";
        finalUsage = {
          prompt_tokens: 1512,
          completion_tokens: 3,
          prompt_tokens_details: { cached_tokens: 1500 },
        };
      } else {
        decision = "miss";
        finalUsage = { prompt_tokens: 1512, completion_tokens: 3 };
        seenPrefixes.add(prefixKey);
      }

      observations.push({ provider: "openai", prefixKey, promptCacheKey, decision });
      return streamResponse(openAiStreamBytes(finalUsage));
    }

    throw new Error(`Oracle received an unexpected URL: ${url}`);
  };

  return { fetchImpl, reset, observations, seenPrefixes };
}

// ---------------------------------------------------------------------------

describe("prompt caching — live proof against a faithful fetch oracle", () => {
  const oracle = createOracle();
  // Accumulated across all scenarios so we can print one evidence table at end.
  const evidence: Array<Record<string, unknown>> = [];

  beforeEach(() => {
    oracle.reset();
    vi.stubGlobal("fetch", oracle.fetchImpl);
    // Neutralize every provider selector so each scenario picks its own.
    vi.stubEnv("AGENT_MUX_PROVIDER", "");
    vi.stubEnv("AGENT_MUX_API_BASE", "");
    vi.stubEnv("AGENT_MUX_API_KEY", "");
    vi.stubEnv("AGENT_MUX_MODEL", "");
    vi.stubEnv("AZURE_API_KEY", "");
    vi.stubEnv("AZURE_OPENAI_API_KEY", "");
    vi.stubEnv("AZURE_OPENAI_PROJECT_NAME", "");
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("OPENAI_MODEL", "");
    vi.stubEnv("ANTHROPIC_API_KEY", "");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  // ------------------------------------------------------------------ (1) ---
  it("Claude POSITIVE: cache_control on system+tools yields a write then a read", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "proof-key");
    const session = createAgentCoreSession({
      model: "claude-sonnet-4-6", // non-gpt id so resolveEndpoint keeps it as-is
      systemPrompt: BIG_SYSTEM_PROMPT,
      customTools: [TOOL],
      promptCaching: {
        enabled: true,
        anthropic: { breakpoints: ["system", "tools"], ttl: "5m" },
      },
    });

    const call1 = await session.prompt("first question");
    const call2 = await session.prompt("second question");

    // genty's PARSED telemetry: call 1 wrote to cache, call 2 read from it.
    expect(call1.usage?.cacheWriteTokens).toBeGreaterThan(0);
    expect(call1.usage?.cacheReadTokens ?? 0).toBe(0);
    expect(call2.usage?.cacheReadTokens).toBeGreaterThan(0);

    // The oracle confirms genty put cache_control on BOTH system and the last
    // tool, on both requests — i.e. the requests were genuinely cache-friendly.
    const anth = oracle.observations.filter(
      (o): o is AnthropicObservation => o.provider === "anthropic",
    );
    expect(anth).toHaveLength(2);
    expect(anth.every((o) => o.sawCacheControlOnSystem)).toBe(true);
    expect(anth.every((o) => o.sawCacheControlOnLastTool)).toBe(true);
    expect(anth[0]!.decision).toBe("write");
    expect(anth[1]!.decision).toBe("read");
    // The system+tools prefix was byte-identical across the two calls.
    expect(anth[0]!.prefixKey).toBe(anth[1]!.prefixKey);

    evidence.push(
      {
        scenario: "1 Claude POSITIVE",
        provider: "anthropic",
        call: 1,
        cacheWriteTokens: call1.usage?.cacheWriteTokens,
        cacheReadTokens: call1.usage?.cacheReadTokens ?? 0,
        sawCacheControl: `${anth[0]!.sawCacheControlOnSystem}+${anth[0]!.sawCacheControlOnLastTool}`,
      },
      {
        scenario: "1 Claude POSITIVE",
        provider: "anthropic",
        call: 2,
        cacheWriteTokens: call2.usage?.cacheWriteTokens ?? 0,
        cacheReadTokens: call2.usage?.cacheReadTokens,
        sawCacheControl: `${anth[1]!.sawCacheControlOnSystem}+${anth[1]!.sawCacheControlOnLastTool}`,
      },
    );
  });

  // ------------------------------------------------------------------ (2) ---
  it("Claude NEGATIVE control: no promptCaching ⇒ no cache_control, no telemetry", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "proof-key");
    const session = createAgentCoreSession({
      model: "claude-sonnet-4-6",
      systemPrompt: BIG_SYSTEM_PROMPT,
      customTools: [TOOL],
      // promptCaching OMITTED — this is the control.
    });

    const call1 = await session.prompt("first question");
    const call2 = await session.prompt("second question");

    const anth = oracle.observations.filter(
      (o): o is AnthropicObservation => o.provider === "anthropic",
    );
    expect(anth).toHaveLength(2);
    // genty emitted NO cache_control anywhere ⇒ the oracle saw none and never
    // granted a hit.
    expect(anth.some((o) => o.hasCacheControl)).toBe(false);
    expect(anth.some((o) => o.sawCacheControlOnSystem)).toBe(false);
    expect(anth.some((o) => o.sawCacheControlOnLastTool)).toBe(false);
    expect(anth.every((o) => o.decision === "miss")).toBe(true);

    // And genty parsed no cache telemetry on either call.
    for (const call of [call1, call2]) {
      expect(call.usage?.cacheReadTokens ?? 0).toBe(0);
      expect(call.usage?.cacheWriteTokens ?? 0).toBe(0);
    }

    evidence.push(
      {
        scenario: "2 Claude NEGATIVE",
        provider: "anthropic",
        call: 1,
        cacheWriteTokens: call1.usage?.cacheWriteTokens ?? 0,
        cacheReadTokens: call1.usage?.cacheReadTokens ?? 0,
        sawCacheControl: "false+false",
      },
      {
        scenario: "2 Claude NEGATIVE",
        provider: "anthropic",
        call: 2,
        cacheWriteTokens: call2.usage?.cacheWriteTokens ?? 0,
        cacheReadTokens: call2.usage?.cacheReadTokens ?? 0,
        sawCacheControl: "false+false",
      },
    );
  });

  // ------------------------------------------------------------------ (3) ---
  it("OpenAI POSITIVE: stable prefix + prompt_cache_key yields a cache read", async () => {
    vi.stubEnv("OPENAI_API_KEY", "proof-key");
    // maxHistoryTurns:0 keeps the request's stable prefix (messages.slice(0,-1))
    // byte-identical across turns — genty genuinely re-emits the same cacheable
    // prefix, which is exactly what OpenAI prompt caching keys on.
    const session = createAgentCoreSession({
      model: "gpt-4o",
      systemPrompt: BIG_SYSTEM_PROMPT,
      customTools: [TOOL],
      maxHistoryTurns: 0,
      promptCaching: { enabled: true, openai: { promptCacheKey: "proof-session" } },
    });

    const call1 = await session.prompt("first question");
    const call2 = await session.prompt("second question");

    // genty's PARSED telemetry: the second call read from the prompt cache.
    expect(call2.usage?.cacheReadTokens).toBeGreaterThan(0);

    const oa = oracle.observations.filter(
      (o): o is OpenAiObservation => o.provider === "openai",
    );
    expect(oa).toHaveLength(2);
    // prompt_cache_key was forwarded on BOTH requests.
    expect(oa.every((o) => o.promptCacheKey === "proof-session")).toBe(true);
    // The stable prefix was byte-identical across the two calls.
    expect(oa[0]!.prefixKey).toBe(oa[1]!.prefixKey);
    expect(oa[0]!.decision).toBe("miss");
    expect(oa[1]!.decision).toBe("read");

    evidence.push(
      {
        scenario: "3 OpenAI POSITIVE",
        provider: "openai",
        call: 1,
        cacheWriteTokens: call1.usage?.cacheWriteTokens ?? 0,
        cacheReadTokens: call1.usage?.cacheReadTokens ?? 0,
        promptCacheKey: oa[0]!.promptCacheKey,
        stablePrefixIdentical: oa[0]!.prefixKey === oa[1]!.prefixKey,
      },
      {
        scenario: "3 OpenAI POSITIVE",
        provider: "openai",
        call: 2,
        cacheWriteTokens: call2.usage?.cacheWriteTokens ?? 0,
        cacheReadTokens: call2.usage?.cacheReadTokens,
        promptCacheKey: oa[1]!.promptCacheKey,
        stablePrefixIdentical: oa[0]!.prefixKey === oa[1]!.prefixKey,
      },
    );
  });

  // ------------------------------------------------------------------ (4) ---
  it("OpenAI NEGATIVE control: a changed prefix defeats the cache even with caching on", async () => {
    vi.stubEnv("OPENAI_API_KEY", "proof-key");
    const commonCaching = {
      enabled: true,
      openai: { promptCacheKey: "proof-session" },
    } as const;

    // Call 1 with one large system prompt.
    const session1 = createAgentCoreSession({
      model: "gpt-4o",
      systemPrompt: BIG_SYSTEM_PROMPT,
      customTools: [TOOL],
      maxHistoryTurns: 0,
      promptCaching: commonCaching,
    });
    const call1 = await session1.prompt("first question");

    // Call 2 with a DIFFERENT large system prompt ⇒ the stable prefix differs,
    // so even with caching enabled + the same key, there is no hit.
    const session2 = createAgentCoreSession({
      model: "gpt-4o",
      systemPrompt: BIG_SYSTEM_PROMPT_ALT,
      customTools: [TOOL],
      maxHistoryTurns: 0,
      promptCaching: commonCaching,
    });
    const call2 = await session2.prompt("second question");

    // genty parsed NO cache read on call 2 — the flag alone was not enough.
    expect(call2.usage?.cacheReadTokens ?? 0).toBe(0);

    const oa = oracle.observations.filter(
      (o): o is OpenAiObservation => o.provider === "openai",
    );
    expect(oa).toHaveLength(2);
    expect(oa[0]!.prefixKey).not.toBe(oa[1]!.prefixKey);
    expect(oa[1]!.decision).toBe("miss");

    evidence.push(
      {
        scenario: "4 OpenAI NEGATIVE",
        provider: "openai",
        call: 1,
        cacheWriteTokens: call1.usage?.cacheWriteTokens ?? 0,
        cacheReadTokens: call1.usage?.cacheReadTokens ?? 0,
        promptCacheKey: oa[0]!.promptCacheKey,
        stablePrefixIdentical: oa[0]!.prefixKey === oa[1]!.prefixKey,
      },
      {
        scenario: "4 OpenAI NEGATIVE",
        provider: "openai",
        call: 2,
        cacheWriteTokens: call2.usage?.cacheWriteTokens ?? 0,
        cacheReadTokens: call2.usage?.cacheReadTokens ?? 0,
        promptCacheKey: oa[1]!.promptCacheKey,
        stablePrefixIdentical: oa[0]!.prefixKey === oa[1]!.prefixKey,
      },
    );
  });

  // Print the human-facing evidence table once, after all scenarios ran.
  // process.stdout.write (not console.table) so it survives vitest's console
  // interception and appears verbatim in the run output.
  afterAll(() => {
    const cols = [
      "scenario",
      "provider",
      "call",
      "cacheWriteTokens",
      "cacheReadTokens",
      "sawCacheControl",
      "promptCacheKey",
      "stablePrefixIdentical",
    ];
    const cell = (v: unknown): string => (v === undefined ? "-" : String(v));
    const widths = cols.map((c) =>
      Math.max(c.length, ...evidence.map((r) => cell(r[c]).length)),
    );
    const line = (vals: string[]): string =>
      "| " + vals.map((v, i) => v.padEnd(widths[i]!)).join(" | ") + " |";
    const sep = "|" + widths.map((w) => "-".repeat(w + 2)).join("|") + "|";
    const out: string[] = [];
    out.push("");
    out.push("=== PROMPT CACHING LIVE PROOF — EVIDENCE TABLE ===");
    out.push(line(cols));
    out.push(sep);
    for (const row of evidence) {
      out.push(line(cols.map((c) => cell(row[c]))));
    }
    out.push("");
    process.stdout.write(out.join("\n") + "\n");
  });
});
