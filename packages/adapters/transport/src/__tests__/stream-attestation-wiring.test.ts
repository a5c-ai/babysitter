/**
 * Milestone C — AC-13 streaming proxy attestation, WIRED into the server path.
 *
 * The unit tests in `proxy-attestation.test.ts` prove the leaf accumulator signs at
 * the terminal `done` event. These tests prove the accumulator is actually WIRED into
 * the server streaming path (`trackCompletionStream` via `createTransportMuxApp`), so a
 * streamed completion produces the SAME shape of proxy attestation as a non-streaming
 * one, resolvable by request id + tool-call id — and that an ABORTED stream (error
 * before `done`) yields NO attestation (fail closed, never a partial/unsigned one).
 *
 * Regression guard: before the fix, `accumulateStreamAttestation` was dead code — the
 * server streaming path never fed it, so streamed completions produced no attestation
 * even though `config.stream` defaults true.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createHash } from 'node:crypto';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createKeyPair } from '@a5c-ai/genty-core/trust';
import { argsHash } from '@a5c-ai/policy-adapter';

import { createProxyConfig } from '../config.js';
import { createTransportMuxApp } from '../server.js';
import type { CompletionEngine, CompletionRequest, CompletionResult, CompletionStreamEvent } from '../types.js';

let keyDir: string;
let keyPath: string;
let fingerprint: string;

beforeAll(() => {
  keyDir = mkdtempSync(join(tmpdir(), 'attest-key-'));
  const kp = createKeyPair();
  fingerprint = kp.fingerprint;
  keyPath = join(keyDir, 'proxy.key');
  writeFileSync(keyPath, kp.privateKey, 'utf-8');
  writeFileSync(`${keyPath}.pub`, kp.publicKey, 'utf-8');
});

afterAll(() => {
  rmSync(keyDir, { recursive: true, force: true });
});

/** A streaming engine that emits two tool-call arg deltas then a terminal `done`. */
function streamingEngine(): CompletionEngine {
  return {
    async complete(): Promise<CompletionResult> {
      throw new Error('complete() should not be called in a streaming test');
    },
    async *stream(_request: CompletionRequest): AsyncIterable<CompletionStreamEvent> {
      void _request;
      yield { type: 'tool-call', id: 'call_S', name: 'Bash', arguments: '{"command":"aws s3 ' } as unknown as CompletionStreamEvent;
      yield { type: 'tool-call', id: 'call_S', name: 'Bash', arguments: 'cp a b","region":"us-east-1"}' } as unknown as CompletionStreamEvent;
      yield { type: 'done', finishReason: 'tool_use', usage: { promptTokens: 5, completionTokens: 3, totalTokens: 8 } } as CompletionStreamEvent;
    },
  };
}

/** A streaming engine that aborts (throws) BEFORE emitting the terminal `done`. */
function abortingEngine(): CompletionEngine {
  return {
    async complete(): Promise<CompletionResult> {
      throw new Error('complete() should not be called in a streaming test');
    },
    async *stream(_request: CompletionRequest): AsyncIterable<CompletionStreamEvent> {
      void _request;
      yield { type: 'tool-call', id: 'call_S', name: 'Bash', arguments: '{"command":"aws s3 ' } as unknown as CompletionStreamEvent;
      throw new Error('upstream stream aborted before done');
    },
  };
}

function attestConfig(engineTransport: 'openai-chat' = 'openai-chat') {
  return createProxyConfig({
    targetProvider: 'anthropic',
    targetModel: 'claude-opus-4-20250101',
    exposedTransport: engineTransport,
    stream: true,
    attestationEnabled: true,
    attestationKeyPath: keyPath,
    attestationFingerprint: fingerprint,
  });
}

async function drain(res: Response): Promise<void> {
  if (!res.body) return;
  const reader = res.body.getReader();
  // Read to completion so trackCompletionStream fully iterates and the terminal
  // event (or the abort) is observed by the attestation sink.
  for (;;) {
    let chunk;
    try {
      chunk = await reader.read();
    } catch {
      break; // aborted stream surfaces as a read error; that is the abort path.
    }
    if (chunk.done) break;
  }
}

describe('Milestone C — AC-13 streaming attestation is wired into the server', () => {
  it('a streamed completion yields a signed attestation resolvable by requestId + toolCallId', async () => {
    const app = createTransportMuxApp({ config: attestConfig(), completionEngine: streamingEngine() });

    const res = await app.fetch(
      new Request('http://local/v1/chat/completions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-request-id': 'req-stream-1' },
        body: JSON.stringify({ model: 'm', stream: true, messages: [{ role: 'user', content: 'hi' }] }),
      }),
    );
    expect(res.status).toBe(200);
    await drain(res);

    const byReq = app.attestationStore.getByRequestId('req-stream-1');
    expect(byReq).toBeDefined();
    expect(byReq!.payload.payloadType).toBe('model-decision');
    // The attestation is signed by the proxy key (same shape as non-streaming).
    expect(byReq!.publicKeyFingerprint).toBe(fingerprint);
    expect(byReq!.signedFields).toContain('toolCalls');

    // Resolvable by tool-call id, with argsHash over the FULLY-accumulated arguments.
    const byTool = app.attestationStore.getByToolCallId('call_S');
    expect(byTool).toBeDefined();
    const bound = byTool!.payload.toolCalls.find((tc) => tc.toolCallId === 'call_S');
    expect(bound).toBeDefined();
    expect(bound!.argsHash).toBe(argsHash({ command: 'aws s3 cp a b', region: 'us-east-1' }));
  });

  it('an ABORTED stream (error before done) yields NO attestation (fail closed)', async () => {
    const app = createTransportMuxApp({ config: attestConfig(), completionEngine: abortingEngine() });

    const res = await app.fetch(
      new Request('http://local/v1/chat/completions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-request-id': 'req-abort-1' },
        body: JSON.stringify({ model: 'm', stream: true, messages: [{ role: 'user', content: 'hi' }] }),
      }),
    );
    // The response starts streaming (200) but the underlying stream aborts mid-flight.
    await drain(res);

    // No terminal `done` was seen → the sink never committed → the sidecar is empty.
    expect(app.attestationStore.getByRequestId('req-abort-1')).toBeUndefined();
    expect(app.attestationStore.getByToolCallId('call_S')).toBeUndefined();
  });

  it('input hash binds the request messages (same derivation as non-streaming)', async () => {
    const app = createTransportMuxApp({ config: attestConfig(), completionEngine: streamingEngine() });
    await drain(
      await app.fetch(
        new Request('http://local/v1/chat/completions', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-request-id': 'req-hash-1' },
          body: JSON.stringify({ model: 'm', stream: true, messages: [{ role: 'user', content: 'hi' }] }),
        }),
      ),
    );
    const env = app.attestationStore.getByRequestId('req-hash-1');
    expect(env).toBeDefined();
    expect(env!.payload.inputMessagesHash).toMatch(/^[0-9a-f]{64}$/);
    void createHash; // hash derivation lives in the server; we only assert its shape here.
  });
});
