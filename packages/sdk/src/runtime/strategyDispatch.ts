import type { JsonRecord } from "../storage/types";
import type { TaskDef } from "../tasks/types";
import { resolveExecutionStrategy } from "./executionStrategy";

export interface DispatchEnvelope {
  mode: "local" | "subagent" | "cloud";
  promptTemplate: "standard" | "subagent";
  parallelism?: number;
  subtasks?: JsonRecord[];
  fallbackReason?: string;
}

export function createDispatchEnvelope(options: {
  taskDef: TaskDef;
  harness?: string;
  env?: NodeJS.ProcessEnv;
}): DispatchEnvelope {
  const strategy = resolveExecutionStrategy(options);
  const subtasks = normalizeSubtasks(options.taskDef.orchestratorTask?.subtasks);

  if (strategy.effectiveMode === "subagent") {
    return {
      mode: "subagent",
      promptTemplate: "subagent",
      parallelism: strategy.parallelism,
      subtasks,
    };
  }

  return {
    mode: strategy.effectiveMode,
    promptTemplate: "standard",
    parallelism: strategy.parallelism,
    fallbackReason:
      strategy.requestedMode !== strategy.effectiveMode ? strategy.reason : undefined,
  };
}

function normalizeSubtasks(subtasks: JsonRecord[] | undefined): JsonRecord[] | undefined {
  if (!Array.isArray(subtasks) || subtasks.length === 0) {
    return undefined;
  }
  return subtasks.map((subtask) => ({ ...subtask }));
}
