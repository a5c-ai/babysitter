/** Type guard for plain objects */
export function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/** Format a camelCase or snake_case key into a readable label */
export function formatLabel(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Known array keys that represent "findings"-style lists of strings */
export const FINDINGS_KEYS = new Set([
  "findings",
  "issues",
  "recommendations",
  "errors",
  "warnings",
  "notes",
  "suggestions",
  "problems",
  "improvements",
  "todos",
  "comments",
  "messages",
]);

export interface CategorizedData {
  status: string | null;
  score: number | null;
  passesQuality: boolean | null;
  booleans: Array<{ key: string; value: boolean }>;
  findings: Array<{ key: string; items: string[] }>;
  summary: string | null;
  taskId: string | null;
  metadata: Array<{ key: string; value: unknown }>;
}

export function categorizeData(data: unknown): CategorizedData {
  const result: CategorizedData = {
    status: null,
    score: null,
    passesQuality: null,
    booleans: [],
    findings: [],
    summary: null,
    taskId: null,
    metadata: [],
  };

  if (!isRecord(data)) {
    return result;
  }

  const obj = data;
  const consumed = new Set<string>();

  // Status
  if ("status" in obj && typeof obj.status === "string") {
    result.status = obj.status;
    consumed.add("status");
  }

  // Score
  if ("score" in obj && typeof obj.score === "number") {
    result.score = obj.score;
    consumed.add("score");
  }

  // passesQuality
  if ("passesQuality" in obj && typeof obj.passesQuality === "boolean") {
    result.passesQuality = obj.passesQuality;
    consumed.add("passesQuality");
  }

  // Summary
  if ("summary" in obj && typeof obj.summary === "string") {
    result.summary = obj.summary;
    consumed.add("summary");
  }

  // TaskId
  if ("taskId" in obj && typeof obj.taskId === "string") {
    result.taskId = obj.taskId;
    consumed.add("taskId");
  }

  // Collect booleans and findings
  for (const [key, val] of Object.entries(obj)) {
    if (consumed.has(key)) continue;

    // Boolean fields (excluding passesQuality already consumed)
    if (typeof val === "boolean") {
      result.booleans.push({ key, value: val });
      consumed.add(key);
      continue;
    }

    // Findings: arrays of strings with recognized key names
    if (
      Array.isArray(val) &&
      val.length > 0 &&
      val.every((item) => typeof item === "string") &&
      FINDINGS_KEYS.has(key.toLowerCase())
    ) {
      result.findings.push({ key, items: val as string[] });
      consumed.add(key);
      continue;
    }
  }

  // If fewer than 2 booleans, move them back to metadata
  if (result.booleans.length < 2) {
    // Don't render boolean grid -- push to metadata
    for (const b of result.booleans) {
      result.metadata.push({ key: b.key, value: b.value });
    }
    result.booleans = [];
  }

  // Everything else goes to metadata
  for (const [key, val] of Object.entries(obj)) {
    if (!consumed.has(key)) {
      result.metadata.push({ key, value: val });
    }
  }

  return result;
}
