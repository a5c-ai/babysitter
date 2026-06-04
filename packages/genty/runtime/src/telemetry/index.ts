/**
 * Telemetry module — OpenTelemetry-aligned structured telemetry interfaces
 * and in-memory implementations.
 */
export {
  TelemetrySpanStatus,
  type TelemetryEvent,
  type TelemetrySpan,
  type TelemetryProvider,
  type TelemetryExporter,
  type TelemetryConfig,
  type TraceContext,
  type TelemetrySpanStartOptions,
  type TelemetryExportResult,
} from "./types";

export {
  HttpTelemetryExporter,
  InMemoryTelemetryProvider,
} from "./provider";
export type {
  HttpTelemetrySend,
  InMemoryTelemetryProviderOptions,
} from "./provider";

export {
  AuditLog,
  type AuditEntry,
  type AuditFilter,
} from "./audit-log";

export {
  SpanTree,
  type SpanTreeNode,
  type SerializedSpanTreeNode,
} from "./span-tree";

export {
  createTraceContext,
  parseTraceParent,
  serializeTraceParent,
  type CreateTraceContextOptions,
} from "./traceContext";

export {
  FileTelemetryExporter,
  InMemoryTelemetryExporter,
  NoopTelemetryExporter,
  OtlpHttpTraceExporter,
  type OtlpHttpTraceExporterOptions,
} from "./exporters";
