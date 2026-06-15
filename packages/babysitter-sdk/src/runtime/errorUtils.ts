import { SerializedEffectError } from "./types";

export interface SerializedRuntimeError {
  name: string;
  message: string;
  stack?: string;
  data?: unknown;
}

export function serializeUnknownError(error: unknown): SerializedRuntimeError {
  if (error instanceof Error) {
    return {
      name: error.name ?? "Error",
      message: error.message ?? "Unknown error",
      stack: error.stack,
    };
  }

  if (typeof error === "object" && error) {
    return {
      name: error.constructor?.name ?? "Error",
      message: JSON.stringify(error),
      data: error,
    };
  }

  return {
    name: "Error",
    message: String(error),
  };
}

export function toSerializedEffectError(error: unknown): SerializedEffectError {
  if (error && typeof error === "object" && "name" in (error as Record<string, unknown>)) {
    const err = error as { name?: string; message?: string; stack?: string; data?: unknown };
    return {
      name: err.name ?? "Error",
      message: err.message ?? "Task failed",
      stack: typeof err.stack === "string" ? err.stack : undefined,
      data: err.data,
    };
  }

  const serialized = serializeUnknownError(error);
  return {
    name: serialized.name,
    message: serialized.message,
    stack: serialized.stack,
    data: serialized.data,
  };
}
