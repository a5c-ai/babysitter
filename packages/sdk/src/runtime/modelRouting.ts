import type { TaskDef } from "../tasks/types";

export type ModelPhase = "plan" | "interactive" | "execute" | "review" | "fix";

export interface ModelRoute {
  phase: ModelPhase;
  model: string;
  source: "default" | "env";
}

const DEFAULT_MODEL = "gpt-5.3-codex";
const DEFAULT_INTERACTIVE_MODEL = "gpt-5.3-codex-spark";
const VALID_PHASES: ModelPhase[] = ["plan", "interactive", "execute", "review", "fix"];

export function resolveModelPhase(taskDef: TaskDef): ModelPhase {
  const candidates = [
    taskDef.orchestratorTask?.modelPhase,
    getString(taskDef.metadata, "modelPhase"),
    getString(taskDef.metadata, "phase"),
  ];
  const matched = candidates.find((value): value is ModelPhase => isModelPhase(value));
  return matched ?? "execute";
}

export function resolveModelRoute(
  phase: ModelPhase,
  env: NodeJS.ProcessEnv = process.env
): ModelRoute {
  const phaseKey = phase.toUpperCase();
  const phaseOverride = env[`BABYSITTER_MODEL_${phaseKey}`];
  if (phaseOverride) {
    return { phase, model: phaseOverride, source: "env" };
  }
  if (phase === "interactive") {
    const interactiveOverride = env.BABYSITTER_INTERACTIVE_MODEL;
    if (interactiveOverride) {
      return { phase, model: interactiveOverride, source: "env" };
    }
  }
  if (env.BABYSITTER_MODEL) {
    return { phase, model: env.BABYSITTER_MODEL, source: "env" };
  }
  return {
    phase,
    model: phase === "interactive" ? DEFAULT_INTERACTIVE_MODEL : DEFAULT_MODEL,
    source: "default",
  };
}

export function summarizeModelRoutes(routes: ModelRoute[]): Record<ModelPhase, string> | undefined {
  const summary = {} as Record<ModelPhase, string>;
  let added = false;
  for (const phase of VALID_PHASES) {
    const match = routes.find((route) => route.phase === phase);
    if (!match) continue;
    summary[phase] = match.model;
    added = true;
  }
  return added ? summary : undefined;
}

function isModelPhase(value: string | undefined): value is ModelPhase {
  return Boolean(value && VALID_PHASES.includes(value as ModelPhase));
}

function getString(record: unknown, key: string): string | undefined {
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    return undefined;
  }
  const value = (record as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}
