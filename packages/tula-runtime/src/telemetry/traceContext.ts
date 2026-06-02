import { randomBytes } from "node:crypto";
import type { TraceContext } from "./types";

const TRACEPARENT_PATTERN = /^([0-9a-f]{2})-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/;

function allZero(value: string): boolean {
  return /^0+$/.test(value);
}

export function parseTraceParent(header: string): TraceContext | null {
  const match = TRACEPARENT_PATTERN.exec(header.trim());
  if (!match) return null;
  const [, version, traceId, spanId, traceFlags] = match;
  if (version !== "00" || allZero(traceId) || allZero(spanId)) {
    return null;
  }
  return { version, traceId, spanId, traceFlags };
}

export function serializeTraceParent(context: TraceContext): string {
  return `${context.version}-${context.traceId}-${context.spanId}-${context.traceFlags}`;
}

export interface CreateTraceContextOptions {
  parent?: TraceContext;
  correlationId?: string;
  sampled?: boolean;
}

export function createTraceContext(options?: CreateTraceContextOptions): TraceContext {
  const traceId = options?.parent?.traceId ?? randomHex(16);
  const spanId = randomHex(8);
  const traceFlags = options?.sampled === false ? "00" : options?.parent?.traceFlags ?? "01";
  return {
    version: "00",
    traceId,
    spanId,
    traceFlags,
    parentSpanId: options?.parent?.spanId,
    correlationId: options?.correlationId ?? options?.parent?.correlationId,
  };
}

function randomHex(bytes: number): string {
  let value = randomBytes(bytes).toString("hex");
  while (allZero(value)) {
    value = randomBytes(bytes).toString("hex");
  }
  return value;
}
