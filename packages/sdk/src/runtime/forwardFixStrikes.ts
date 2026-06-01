import type { JsonRecord } from "../storage/types";
import type { ForwardFixAttemptMetadata, ForwardFixDiagnostic } from "./types";

export function normalizeForwardFixMetadata(metadata: JsonRecord | undefined): JsonRecord | undefined {
  if (!metadata) return undefined;

  const normalized: JsonRecord = { ...metadata };
  const nested = asForwardFixMetadata(metadata["forwardFix"]);

  const bugClass = normalizeString(metadata["bugClass"]) ?? nested?.bugClass;
  const attemptStatus = normalizeAttemptStatus(metadata["attemptStatus"]) ?? nested?.attemptStatus;
  const instrumentationOnly = normalizeBoolean(metadata["instrumentation_only"]) ?? nested?.instrumentation_only;

  if (bugClass !== undefined) normalized["bugClass"] = bugClass;
  if (attemptStatus !== undefined) normalized["attemptStatus"] = attemptStatus;
  if (instrumentationOnly !== undefined) normalized["instrumentation_only"] = instrumentationOnly;

  return normalized;
}

export function collectForwardFixDiagnostics(metadata: JsonRecord | undefined): ForwardFixDiagnostic[] {
  if (!metadata) return [];

  const normalized = normalizeForwardFixMetadata(metadata);
  if (!normalized) return [];

  const intendsForwardFix = hasOwn(metadata, "forwardFix")
    || hasOwn(metadata, "attemptStatus")
    || hasOwn(metadata, "instrumentation_only")
    || hasOwn(metadata, "bugClass");

  if (!intendsForwardFix || typeof normalized["bugClass"] === "string") {
    return [];
  }

  return [
    {
      code: "missing_bugClass",
      message: "Forward-fix metadata requires an explicit bugClass for strike tracking.",
    },
  ];
}

export interface ForwardFixStrikeAttempt {
  bugClass?: string;
  attemptStatus?: ForwardFixAttemptMetadata["attemptStatus"];
  instrumentation_only?: boolean;
}

export interface ForwardFixStrikeState {
  strikesByBugClass: Record<string, number>;
}

export interface ForwardFixClassification {
  bugClass: string;
  strikeCount: number;
  instrumentation_only: boolean;
}

export type ForwardFixAllowedChangeType = "log-emission" | "env-flag" | "no-op-guard" | "revert-only";

export interface ForwardFixGateInput {
  bugClass?: string;
  strikeCount: number;
  instrumentation_only: boolean;
  changedFiles: string[];
  algorithmChangePatterns?: string[];
  changeType?: ForwardFixAllowedChangeType;
  strike3Override?: ForwardFixStrike3Override;
}

export interface ForwardFixGateResult {
  allowed: boolean;
  matchedFiles: string[];
  diagnostics: string[];
  overrideAudit?: ForwardFixStrike3OverrideAudit;
}

export interface ForwardFixStrike3Override {
  actor?: string;
  reason?: string;
  timestamp?: string;
}

export interface ForwardFixStrike3OverrideAudit {
  actor: string;
  reason: string;
  bugClass: string;
  strikeCount: number;
  matchedFiles: string[];
  timestamp: string;
}

export const DEFAULT_ALGORITHM_CHANGE_PATTERNS = [
  "packages/sdk/src/runtime/**",
  "packages/sdk/src/storage/**",
] as const;

export function deriveForwardFixStrikeState(attempts: ForwardFixStrikeAttempt[]): ForwardFixStrikeState {
  const strikesByBugClass: Record<string, number> = {};

  for (const attempt of attempts) {
    const bugClass = normalizeString(attempt.bugClass);
    if (!bugClass || attempt.attemptStatus !== "failed") continue;
    strikesByBugClass[bugClass] = (strikesByBugClass[bugClass] ?? 0) + 1;
  }

  return { strikesByBugClass };
}

export function classifyForwardFixAttempt(
  attempt: ForwardFixStrikeAttempt,
  state: ForwardFixStrikeState,
): ForwardFixClassification | undefined {
  const bugClass = normalizeString(attempt.bugClass);
  if (!bugClass) return undefined;

  const strikeCount = state.strikesByBugClass[bugClass] ?? 0;
  return {
    bugClass,
    strikeCount,
    instrumentation_only: attempt.instrumentation_only ?? strikeCount >= 2,
  };
}

export function evaluateForwardFixGate(input: ForwardFixGateInput): ForwardFixGateResult {
  const bugClass = normalizeString(input.bugClass);
  const patterns = input.algorithmChangePatterns?.length
    ? input.algorithmChangePatterns
    : Array.from(DEFAULT_ALGORITHM_CHANGE_PATTERNS);
  const diagnostics: string[] = [];

  if (!bugClass) {
    return {
      allowed: false,
      matchedFiles: [],
      diagnostics: ["[gate] missing bugClass for instrumentation-only forward-fix gate."],
    };
  }

  if (!input.instrumentation_only) {
    return {
      allowed: true,
      matchedFiles: [],
      diagnostics: [`[gate] ${bugClass}: not instrumentation_only; deploy-block gate skipped.`],
    };
  }

  if (input.changeType && isAllowedInstrumentationChangeType(input.changeType)) {
    return {
      allowed: true,
      matchedFiles: [],
      diagnostics: [`[gate] ${bugClass}: allowed instrumentation-only ${input.changeType} change.`],
    };
  }

  const matchedFiles = input.changedFiles.filter((file) => (
    !isAlwaysAllowedPath(file) && patterns.some((pattern) => matchPattern(file, pattern))
  ));

  if (matchedFiles.length === 0) {
    return {
      allowed: true,
      matchedFiles,
      diagnostics: [`[gate] ${bugClass}: no algorithm-change files matched at strike ${input.strikeCount}.`],
    };
  }

  if (input.strike3Override) {
    const actor = normalizeString(input.strike3Override.actor);
    const reason = normalizeString(input.strike3Override.reason);
    const timestamp = normalizeString(input.strike3Override.timestamp);

    if (!actor || !reason || !timestamp) {
      return {
        allowed: false,
        matchedFiles,
        diagnostics: [
          `[gate] ${bugClass}: invalid --strike3-override.`,
          "[gate] --strike3-override reason, actor, and timestamp are required for audit.",
          `[gate] matched algorithm files: ${matchedFiles.join(", ")}`,
        ],
      };
    }

    return {
      allowed: true,
      matchedFiles,
      diagnostics: [
        `[gate] strike-3 override applied for ${bugClass} at strike ${input.strikeCount}.`,
        `[gate] override actor: ${actor}`,
        `[gate] override reason: ${reason}`,
        `[gate] matched algorithm files: ${matchedFiles.join(", ")}`,
      ],
      overrideAudit: {
        actor,
        reason,
        bugClass,
        strikeCount: input.strikeCount,
        matchedFiles,
        timestamp,
      },
    };
  }

  return {
    allowed: false,
    matchedFiles,
    diagnostics: [
      `[gate] ${bugClass}: strike ${input.strikeCount} instrumentation_only deploy block.`,
      `[gate] matched algorithm files: ${matchedFiles.join(", ")}`,
      "[gate] remediation: keep only logs/env flags/no-op guards/reverts or use audited --strike3-override.",
    ],
  };
}

function asForwardFixMetadata(value: unknown): ForwardFixAttemptMetadata | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const record = value as JsonRecord;
  const metadata: ForwardFixAttemptMetadata = {};

  const bugClass = normalizeString(record["bugClass"]);
  const attemptStatus = normalizeAttemptStatus(record["attemptStatus"]);
  const instrumentationOnly = normalizeBoolean(record["instrumentation_only"]);

  if (bugClass !== undefined) metadata.bugClass = bugClass;
  if (attemptStatus !== undefined) metadata.attemptStatus = attemptStatus;
  if (instrumentationOnly !== undefined) metadata.instrumentation_only = instrumentationOnly;

  return metadata;
}

function normalizeString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function normalizeBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function normalizeAttemptStatus(value: unknown): ForwardFixAttemptMetadata["attemptStatus"] | undefined {
  return value === "failed" || value === "succeeded" || value === "cancelled" ? value : undefined;
}

function hasOwn(record: JsonRecord, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function isAllowedInstrumentationChangeType(value: string): value is ForwardFixAllowedChangeType {
  return value === "log-emission" || value === "env-flag" || value === "no-op-guard" || value === "revert-only";
}

function isAlwaysAllowedPath(path: string): boolean {
  return path.startsWith("docs/") || path.includes("/__tests__/") || path.endsWith(".test.ts") || path.endsWith(".test.mjs");
}

function matchPattern(path: string, pattern: string): boolean {
  if (pattern.endsWith("/**")) {
    return path.startsWith(pattern.slice(0, -3));
  }
  if (pattern.includes("**")) {
    const [prefix, suffix] = pattern.split("**", 2);
    return path.startsWith(prefix) && (!suffix || path.endsWith(suffix));
  }
  if (pattern.endsWith("*")) {
    return path.startsWith(pattern.slice(0, -1));
  }
  return path === pattern || path.startsWith(`${pattern}/`);
}
