/**
 * Milestone C — ATTRIBUTION: correlation metadata on the effect result.
 *
 * Frozen tests authored from docs/design/proof-based-policy-enforcement.md §6.3/AC-14
 * (correlation: the attestation is keyed by request id; the policy component resolves by
 * requestId and toolCallId) and §6/§4 (session id + model id + attestation requestId
 * recorded for correlation). Milestone C records `{ sessionId, modelId,
 * attestationRequestId }` (and, where present, `toolCallId` + the attestation producer
 * marker) on the effect result metadata (serializer `StoredTaskResult.metadata`) so an
 * auditor can correlate a resolved effect back to the exact model turn that authorized it.
 *
 * This test drives the REAL serializer (`serializeAndWriteTaskResult`) to prove the
 * attribution metadata survives serialization + `stableClone` round-trip and lands on
 * disk, and imports the Milestone-C attribution builder from the intended module path
 * (`../../breakpoints/attestation-attribution`). Module resolution MAY fail until the
 * milestone lands — expected; no syntax errors.
 */
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  serializeAndWriteTaskResult,
  serializeTaskResult,
} from "../serializer";

// The Milestone-C attribution builder that shapes the correlation metadata block.
import {
  buildAttestationAttributionMetadata,
  type AttestationAttribution,
} from "../../breakpoints/attestation-attribution";

const EFFECT_ID = "01HQA4ATTRIB01";

function attribution(overrides?: Partial<AttestationAttribution>): AttestationAttribution {
  return {
    sessionId: "sess-xyz-42",
    modelId: "claude-opus-4-20250101",
    attestationRequestId: "req-abc-123",
    toolCallId: "call_A",
    producer: "proxy",
    ...overrides,
  };
}

describe("Milestone C — attestation attribution metadata (AC-14)", () => {
  let runDir: string;

  beforeEach(async () => {
    runDir = await fs.mkdtemp(path.join(os.tmpdir(), "babysitter-attribution-"));
  });

  afterEach(async () => {
    await fs.rm(runDir, { recursive: true, force: true });
  });

  it("AC-14: builds a correlation metadata block with sessionId, modelId, attestationRequestId", () => {
    const meta = buildAttestationAttributionMetadata(attribution());
    expect(meta.sessionId).toBe("sess-xyz-42");
    expect(meta.modelId).toBe("claude-opus-4-20250101");
    expect(meta.attestationRequestId).toBe("req-abc-123");
    expect(meta.toolCallId).toBe("call_A");
  });

  it("AC-14: attribution metadata round-trips through serializeTaskResult onto StoredTaskResult.metadata", async () => {
    const meta = buildAttestationAttributionMetadata(attribution());
    const serialized = await serializeTaskResult({
      runDir,
      effectId: EFFECT_ID,
      taskId: "__sdk.breakpoint",
      invocationKey: "proc:bp-001",
      payload: { status: "ok", result: { approved: true }, metadata: meta },
    });
    expect(serialized.metadata).toBeDefined();
    expect(serialized.metadata?.sessionId).toBe("sess-xyz-42");
    expect(serialized.metadata?.modelId).toBe("claude-opus-4-20250101");
    expect(serialized.metadata?.attestationRequestId).toBe("req-abc-123");
  });

  it("AC-14: the attribution metadata is persisted to the result file on disk", async () => {
    const meta = buildAttestationAttributionMetadata(attribution());
    const { resultRef } = await serializeAndWriteTaskResult({
      runDir,
      effectId: EFFECT_ID,
      taskId: "__sdk.breakpoint",
      invocationKey: "proc:bp-001",
      payload: { status: "ok", result: { approved: true }, metadata: meta },
    });
    const onDisk = JSON.parse(await fs.readFile(path.join(runDir, resultRef), "utf8"));
    expect(onDisk.metadata.sessionId).toBe("sess-xyz-42");
    expect(onDisk.metadata.modelId).toBe("claude-opus-4-20250101");
    expect(onDisk.metadata.attestationRequestId).toBe("req-abc-123");
    expect(onDisk.metadata.toolCallId).toBe("call_A");
  });

  it("AC-14: the producer marker (proxy vs in-process) is recorded for correlation-grade distinction", () => {
    const proxyMeta = buildAttestationAttributionMetadata(attribution({ producer: "proxy" }));
    const inProcMeta = buildAttestationAttributionMetadata(attribution({ producer: "in-process" }));
    expect(proxyMeta.producer).toBe("proxy");
    expect(inProcMeta.producer).toBe("in-process");
  });
});
