import type { TaskDef } from "../tasks/types";
import { detectHarnessCapabilities, type HarnessCapabilityReport } from "./capabilityReport";
import { resolveModelPhase, resolveModelRoute, type ModelRoute } from "./modelRouting";

export type ExecutionMode = "local" | "subagent" | "cloud";

export interface ExecutionStrategy {
  requestedMode: ExecutionMode;
  effectiveMode: ExecutionMode;
  reason: string;
  parallelism?: number;
  subtaskCount?: number;
  modelRoute: ModelRoute;
  capabilities: HarnessCapabilityReport;
}

export function resolveExecutionStrategy(options: {
  taskDef: TaskDef;
  harness?: string;
  capabilities?: HarnessCapabilityReport;
  env?: NodeJS.ProcessEnv;
}): ExecutionStrategy {
  const capabilities = options.capabilities ?? detectHarnessCapabilities(options.harness);
  const requestedMode = resolveRequestedMode(options.taskDef);
  const subtasks = options.taskDef.orchestratorTask?.subtasks ?? [];
  const parallelism = resolveParallelism(options.taskDef);
  const phase = resolveModelPhase(options.taskDef);
  const modelRoute = resolveModelRoute(phase, options.env);

  if (requestedMode === "cloud") {
    return {
      requestedMode,
      effectiveMode: "local",
      reason: "cloud-execution-not-enabled-in-pr1",
      parallelism,
      subtaskCount: subtasks.length || undefined,
      modelRoute,
      capabilities,
    };
  }

  if (requestedMode === "subagent") {
    if (subtasks.length > 0 && capabilities.subagentFanOut) {
      return {
        requestedMode,
        effectiveMode: "subagent",
        reason: "subtasks-available-for-local-fanout",
        parallelism,
        subtaskCount: subtasks.length,
        modelRoute,
        capabilities,
      };
    }
    return {
      requestedMode,
      effectiveMode: "local",
      reason: subtasks.length === 0 ? "subagent-mode-requested-without-subtasks" : "subagent-capability-unavailable",
      parallelism,
      subtaskCount: subtasks.length || undefined,
      modelRoute,
      capabilities,
    };
  }

  return {
    requestedMode,
    effectiveMode: "local",
    reason: "default-local-execution",
    parallelism,
    subtaskCount: subtasks.length || undefined,
    modelRoute,
    capabilities,
  };
}

function resolveRequestedMode(taskDef: TaskDef): ExecutionMode {
  const candidates = [
    taskDef.orchestratorTask?.executionMode,
    getString(taskDef.metadata, "executionMode"),
  ];
  const matched = candidates.find((value): value is ExecutionMode => isExecutionMode(value));
  return matched ?? "local";
}

function resolveParallelism(taskDef: TaskDef): number | undefined {
  const direct = taskDef.orchestratorTask?.parallelism;
  if (typeof direct === "number" && Number.isFinite(direct) && direct > 0) {
    return Math.floor(direct);
  }
  const metadataValue = getNumber(taskDef.metadata, "parallelism");
  if (typeof metadataValue === "number" && Number.isFinite(metadataValue) && metadataValue > 0) {
    return Math.floor(metadataValue);
  }
  return undefined;
}

function isExecutionMode(value: string | undefined): value is ExecutionMode {
  return value === "local" || value === "subagent" || value === "cloud";
}

function getString(record: unknown, key: string): string | undefined {
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    return undefined;
  }
  const value = (record as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}

function getNumber(record: unknown, key: string): number | undefined {
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    return undefined;
  }
  const value = (record as Record<string, unknown>)[key];
  return typeof value === "number" ? value : undefined;
}
