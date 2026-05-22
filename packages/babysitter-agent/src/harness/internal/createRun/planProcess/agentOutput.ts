import {
  BabysitterRuntimeError,
  ErrorCategory,
} from "../utils";

export function buildAgentPrompt(taskDef: Record<string, unknown>): string {
  const agent = taskDef.agent as Record<string, unknown> | undefined;
  if (!agent) {
    return (taskDef.title as string) ?? "Execute task";
  }
  const structuredOutputInstructions = buildStructuredAgentOutputInstructions(agent);
  const rawPrompt = agent.prompt;
  if (typeof rawPrompt === "string" && rawPrompt.trim()) {
    return [
      "You are an autonomous agent. PERFORM the task below using your available tools.",
      "Do not just describe what you would do. Execute the work and then summarize what you changed.",
      ...structuredOutputInstructions,
      "",
      "Task:",
      rawPrompt.trim(),
    ].join("\n");
  }
  if (Array.isArray(rawPrompt) && rawPrompt.length > 0) {
    const lines = rawPrompt
      .filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
      .map((entry) => entry.trim());
    if (lines.length > 0) {
      return [
        "You are an autonomous agent. PERFORM the task below using your available tools.",
        "Do not just describe what you would do. Execute the work and then summarize what you changed.",
        ...structuredOutputInstructions,
        "",
        "Task:",
        ...lines,
      ].join("\n");
    }
  }

  const prompt = rawPrompt as Record<string, unknown> | undefined;
  if (!prompt || typeof prompt !== "object") {
    return (taskDef.title as string) ?? "Execute task";
  }

  const parts: string[] = [];
  parts.push(
    "You are an autonomous agent. PERFORM the task below using your available tools.",
    "Do not just describe what you would do. Execute the work and then summarize what you changed.",
    "",
  );
  if (typeof prompt.role === "string") {
    parts.push(`Role: ${prompt.role}`);
  }
  if (typeof prompt.task === "string") {
    parts.push(`\nTask:\n${prompt.task}`);
  }
  if (prompt.context) {
    parts.push(`\nContext:\n${JSON.stringify(prompt.context, null, 2)}`);
  }
  if (Array.isArray(prompt.instructions)) {
    parts.push(`\nInstructions:\n${(prompt.instructions as string[]).map((item, index) => `${index + 1}. ${item}`).join("\n")}`);
  }
  if (typeof prompt.outputFormat === "string") {
    parts.push(`\nOutput format: ${prompt.outputFormat}`);
  }
  if (structuredOutputInstructions.length > 0) {
    parts.push(`\n${structuredOutputInstructions.join("\n")}`);
  }
  return parts.join("\n");
}

export function buildStructuredAgentOutputInstructions(agent: Record<string, unknown>): string[] {
  const outputSchema = agent.outputSchema;
  if (!outputSchema || typeof outputSchema !== "object") {
    return [];
  }
  return [
    "Return ONLY a JSON object that matches the declared output schema.",
    "Do not wrap the JSON in markdown fences, and do not prepend or append prose.",
    `Output schema: ${JSON.stringify(outputSchema, null, 2)}`,
  ];
}

export function extractJsonObjectFromText(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }
  if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
    return trimmed;
  }
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }
  return null;
}

export function coerceAgentResultValue(taskDef: Record<string, unknown>, output: string): unknown {
  const agent = taskDef.agent as Record<string, unknown> | undefined;
  if (!agent?.outputSchema || typeof agent.outputSchema !== "object") {
    return output;
  }
  const candidate = extractJsonObjectFromText(output);
  if (!candidate) {
    throw new BabysitterRuntimeError(
      "AgentOutputSchemaMismatch",
      "Agent task declared outputSchema but did not return JSON output",
      { category: ErrorCategory.External },
    );
  }
  try {
    return JSON.parse(candidate) as unknown;
  } catch (error: unknown) {
    throw new BabysitterRuntimeError(
      "AgentOutputSchemaMismatch",
      error instanceof Error
        ? `Agent task declared outputSchema but returned invalid JSON: ${error.message}`
        : "Agent task declared outputSchema but returned invalid JSON",
      { category: ErrorCategory.External },
    );
  }
}
