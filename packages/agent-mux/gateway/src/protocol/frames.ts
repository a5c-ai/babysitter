import { z } from 'zod';

import type { GatewayFrame } from './v1.js';
import { GATEWAY_CLOSE_CODES, GatewayProtocolError } from './errors.js';

const authFrameSchema = z.object({
  type: z.literal('auth'),
  token: z.string().min(1),
});

const helloFrameSchema = z.object({
  type: z.literal('hello'),
  protocolVersions: z.array(z.literal('1')).min(1),
  serverVersion: z.string().min(1),
  serverTime: z.string().min(1),
});

const errorFrameSchema = z.object({
  type: z.literal('error'),
  code: z.string().min(1),
  message: z.string().min(1),
  runId: z.string().optional(),
  tailSeq: z.number().int().nonnegative().optional(),
});

const subscribeFrameSchema = z.object({
  type: z.literal('subscribe'),
  runId: z.string().min(1),
  sinceSeq: z.number().int().nonnegative().optional(),
});

const unsubscribeFrameSchema = z.object({
  type: z.literal('unsubscribe'),
  runId: z.string().min(1),
});

const sessionSubscribeFrameSchema = z.object({
  type: z.literal('session.subscribe'),
  sessionId: z.string().min(1),
});

const sessionUnsubscribeFrameSchema = z.object({
  type: z.literal('session.unsubscribe'),
  sessionId: z.string().min(1),
});

const sessionStartFrameSchema = z.object({
  type: z.literal('session.start'),
  agent: z.string().min(1),
  prompt: z.string(),
  model: z.string().optional(),
  attachments: z.array(z.record(z.string(), z.unknown())).optional(),
  approvalMode: z.enum(['yolo', 'prompt', 'deny']).optional(),
  sessionId: z.string().optional(),
  runId: z.string().optional(),
  cwd: z.string().optional(),
  workspaceId: z.string().optional(),
  forkSessionId: z.string().optional(),
});

const sessionMessageFrameSchema = z.object({
  type: z.literal('session.message'),
  sessionId: z.string().min(1),
  prompt: z.string(),
  agent: z.string().optional(),
  model: z.string().optional(),
  attachments: z.array(z.record(z.string(), z.unknown())).optional(),
  approvalMode: z.enum(['yolo', 'prompt', 'deny']).optional(),
});

const pingFrameSchema = z.object({
  type: z.literal('ping'),
});

const pongFrameSchema = z.object({
  type: z.literal('pong'),
});

const runEventFrameSchema = z.object({
  type: z.literal('run.event'),
  runId: z.string().min(1),
  seq: z.number().int().nonnegative(),
  source: z.string().min(1),
  event: z.record(z.string(), z.unknown()),
});

const hookRequestFrameSchema = z.object({
  type: z.literal('hook.request'),
  hookRequestId: z.string().min(1),
  runId: z.string().min(1),
  hookKind: z.string().min(1),
  payload: z.record(z.string(), z.unknown()),
  deadlineTs: z.number().int(),
});

const hookDecisionFrameSchema = z.object({
  type: z.literal('hook.decision'),
  hookRequestId: z.string().min(1),
  decision: z.enum(['allow', 'deny']),
  reason: z.string().optional(),
});

const hookResolvedFrameSchema = z.object({
  type: z.literal('hook.resolved'),
  hookRequestId: z.string().min(1),
  resolvedBy: z.string().min(1),
  decision: z.enum(['allow', 'deny']),
});

const pairingRegisterFrameSchema = z.object({
  type: z.literal('pairing.register'),
  code: z.string().min(1),
  url: z.string().min(1),
  token: z.string().min(1),
});

const pairingConsumeFrameSchema = z.object({
  type: z.literal('pairing.consume'),
  code: z.string().min(1),
});

const pairingConsumedFrameSchema = z.object({
  type: z.literal('pairing.consumed'),
  code: z.string().min(1),
  url: z.string().min(1),
  token: z.string().min(1),
  expiresAt: z.number().int().positive(),
});

export const gatewayFrameSchema = z.discriminatedUnion('type', [
  authFrameSchema,
  helloFrameSchema,
  errorFrameSchema,
  subscribeFrameSchema,
  unsubscribeFrameSchema,
  sessionSubscribeFrameSchema,
  sessionUnsubscribeFrameSchema,
  sessionStartFrameSchema,
  sessionMessageFrameSchema,
  pingFrameSchema,
  pongFrameSchema,
  runEventFrameSchema,
  hookRequestFrameSchema,
  hookDecisionFrameSchema,
  hookResolvedFrameSchema,
  pairingRegisterFrameSchema,
  pairingConsumeFrameSchema,
  pairingConsumedFrameSchema,
]);

export function encodeFrame(frame: GatewayFrame): string {
  return JSON.stringify(gatewayFrameSchema.parse(frame));
}

export function decodeFrame(input: string): GatewayFrame {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch (error) {
    throw new GatewayProtocolError(
      error instanceof Error ? error.message : 'Invalid JSON frame',
      GATEWAY_CLOSE_CODES.invalidFrame,
    );
  }

  const result = gatewayFrameSchema.safeParse(parsed);
  if (!result.success) {
    throw new GatewayProtocolError(result.error.message, GATEWAY_CLOSE_CODES.invalidFrame);
  }
  return result.data;
}
