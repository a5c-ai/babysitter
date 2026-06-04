import {
  BabysitterRuntimeError,
  ErrorCategory,
  type OrchestrationState,
} from "../utils";

export type PendingEffectResult = OrchestrationState["pendingEffectResults"] extends Map<string, infer T>
  ? T
  : never;

export function applyExplicitEffectResult(args: {
  params: Record<string, unknown>;
  effectId: string;
  status: "ok" | "error";
  effectResult: PendingEffectResult | undefined;
}): PendingEffectResult {
  const explicitValueProvided = args.params.valueJson !== undefined || args.params.valueText !== undefined;
  const explicitValue = explicitValueProvided
    ? parseExplicitToolResultValue({
      valueJson: typeof args.params.valueJson === "string" ? args.params.valueJson : undefined,
      valueText: typeof args.params.valueText === "string" ? args.params.valueText : undefined,
    })
    : undefined;
  const hasExplicitPayload = explicitValueProvided
    || args.params.error !== undefined
    || args.params.stdout !== undefined
    || args.params.stderr !== undefined;

  if (!args.effectResult || hasExplicitPayload) {
    const nextValue = explicitValueProvided ? explicitValue : args.effectResult?.value;
    if (args.status === "ok" && nextValue === undefined) {
      throw new BabysitterRuntimeError(
        "EffectResultValueMissing",
        `Explicit ok result for ${args.effectId} is missing a value payload.`,
        { category: ErrorCategory.Validation },
      );
    }
    return {
      status: args.status,
      value: nextValue,
      error: args.status === "error"
        ? new Error(
          typeof args.params.error === "string"
            ? args.params.error
            : args.effectResult?.error instanceof Error
              ? args.effectResult.error.message
              : "Effect failed",
        )
        : undefined,
      stdout: typeof args.params.stdout === "string" ? args.params.stdout : args.effectResult?.stdout,
      stderr: typeof args.params.stderr === "string" ? args.params.stderr : args.effectResult?.stderr,
    };
  }

  if (args.status !== args.effectResult.status) {
    return {
      ...args.effectResult,
      status: args.status,
      error: args.status === "error"
        ? new Error(
          typeof args.params.error === "string"
            ? args.params.error
            : args.effectResult.error instanceof Error
              ? args.effectResult.error.message
              : "Effect failed",
        )
        : undefined,
    };
  }

  return args.effectResult;
}

export function coerceStatus(value: unknown): "ok" | "error" | undefined {
  return value === "ok" || value === "error" ? value : undefined;
}

function parseExplicitToolResultValue(args: {
  valueJson?: string;
  valueText?: string;
}): unknown {
  if (typeof args.valueJson === "string" && args.valueJson.trim().length > 0) {
    try {
      return JSON.parse(args.valueJson);
    } catch (error: unknown) {
      throw new BabysitterRuntimeError(
        "InvalidToolResultValueJson",
        error instanceof Error
          ? `valueJson is not valid JSON: ${error.message}`
          : "valueJson is not valid JSON",
        { category: ErrorCategory.Validation },
      );
    }
  }
  return typeof args.valueText === "string" ? args.valueText : undefined;
}
