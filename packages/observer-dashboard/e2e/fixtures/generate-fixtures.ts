/**
 * E2E Fixture Generator
 *
 * Generates 50 realistic run directories for performance testing the observer dashboard.
 * Each run directory mirrors the exact filesystem layout used by babysitter:
 *
 *   <runId>/
 *     run.json
 *     inputs.json
 *     journal/
 *       000001.<ulid>.json   (RUN_CREATED)
 *       000002.<ulid>.json   (EFFECT_REQUESTED)
 *       000003.<ulid>.json   (EFFECT_RESOLVED)
 *       ...
 *     tasks/
 *       <effectId>/
 *         task.json
 *         result.json
 *
 * The generated run set is fully DETERMINISTIC (seeded PRNG, fixed clock):
 * every invocation on every machine produces byte-identical run dirs and
 * manifest, so specs may pin generated run/effect IDs. Generated dirs are NOT
 * committed — they are (re)created at test time by Playwright's globalSetup
 * (see e2e/global-setup.ts). Hand-authored fixtures (01KTEST*) ARE committed
 * and are never touched by generation; the manifest merges both sets.
 *
 * Usage:
 *   npx tsx e2e/fixtures/generate-fixtures.ts        # force a full regeneration
 *   import { generateFixtures } from "./generate-fixtures";  // programmatic (idempotent)
 */

import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const RUN_COUNT = 50;
const RUNS_DIR = path.join(__dirname, "runs");

const PROJECT_NAMES = [
  "demo-project",
  "sample-project",
  "sales-pipeline",
  "content-scheduler",
];

const PROCESS_IDS: Record<string, string[]> = {
  "demo-project": [
    "demo-project/transcribe",
    "demo-project/summarize",
    "demo-project/publish",
  ],
  "sample-project": [
    "sample/schedule-sync",
    "sample/roster-update",
    "sample/stats-ingest",
  ],
  "sales-pipeline": [
    "sales/lead-scoring",
    "sales/outreach-gen",
    "sales/deal-sync",
  ],
  "content-scheduler": [
    "content/draft-review",
    "content/publish-queue",
    "content/analytics-roll",
  ],
};

const TASK_LABELS: Record<string, string[]> = {
  agent: [
    "Generate executive summary",
    "Draft outreach email",
    "Analyze competitor data",
    "Review pull request",
    "Write test specifications",
    "Synthesize user feedback",
    "Create architecture spec",
    "Research market trends",
    "Draft release notes",
    "Generate API documentation",
  ],
  node: [
    "Transform CSV to JSON",
    "Validate schema",
    "Merge datasets",
    "Filter duplicates",
    "Compute aggregates",
    "Normalize timestamps",
    "Enrich metadata",
    "Deduplicate records",
    "Parse XML feed",
    "Index search documents",
  ],
  shell: [
    "Run database migration",
    "Execute test suite",
    "Build Docker image",
    "Deploy to staging",
    "Sync S3 bucket",
    "Run lint checks",
    "Generate coverage report",
    "Compress assets",
    "Restart service",
    "Clear cache",
  ],
  breakpoint: [
    "Approve deployment to production?",
    "Review generated content before publishing?",
    "Confirm data migration changes?",
    "Verify outreach email before sending?",
    "Approve budget allocation?",
  ],
  skill: [
    "Invoke web scraper",
    "Call translation API",
    "Run sentiment analysis",
    "Execute OCR pipeline",
    "Process payment webhook",
  ],
  sleep: [
    "Wait for rate limit cooldown",
    "Pause before retry",
    "Delay for webhook callback",
  ],
};

const TASK_KINDS: Array<"agent" | "node" | "shell" | "breakpoint" | "skill" | "sleep"> = [
  "agent",
  "node",
  "shell",
  "breakpoint",
  "skill",
  "sleep",
];

// Weighted distribution: agent and node tasks are more common
const KIND_WEIGHTS: Record<string, number> = {
  agent: 35,
  node: 30,
  shell: 15,
  breakpoint: 5,
  skill: 10,
  sleep: 5,
};

const ERROR_MESSAGES = [
  { name: "TimeoutError", message: "Task exceeded 120s timeout" },
  { name: "ValidationError", message: "Schema validation failed: missing required field 'email'" },
  { name: "NetworkError", message: "ECONNREFUSED: Connection refused to upstream API" },
  { name: "RateLimitError", message: "429 Too Many Requests: retry after 60s" },
  { name: "AuthenticationError", message: "Invalid API key: token expired" },
  { name: "ProcessError", message: "Process exited with code 1" },
];

// ---------------------------------------------------------------------------
// ULID-like ID generation (monotonic, sortable)
// ---------------------------------------------------------------------------

const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford Base32

function encodeTime(ts: number, len: number): string {
  let result = "";
  let t = ts;
  for (let i = len; i > 0; i--) {
    result = ENCODING[t % 32] + result;
    t = Math.floor(t / 32);
  }
  return result;
}

// NOTE: the "random" tail is drawn from the seeded PRNG below (not crypto)
// so ULIDs are reproducible across invocations and machines.
function encodeRandom(len: number): string {
  let result = "";
  for (let i = 0; i < len; i++) {
    result += ENCODING[Math.floor(seededRandom() * 32) % 32];
  }
  return result;
}

function generateUlid(ts: number): string {
  return encodeTime(Math.floor(ts), 10) + encodeRandom(16);
}

// ---------------------------------------------------------------------------
// Deterministic random helpers (seeded via simple LCG for reproducibility)
// ---------------------------------------------------------------------------

const INITIAL_SEED = 42;
let seed = INITIAL_SEED;

function seededRandom(): number {
  seed = (seed * 1664525 + 1013904223) & 0x7fffffff;
  return seed / 0x7fffffff;
}

function randInt(min: number, max: number): number {
  return Math.floor(seededRandom() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(seededRandom() * arr.length)];
}

function weightedPick(): string {
  const total = Object.values(KIND_WEIGHTS).reduce((a, b) => a + b, 0);
  let r = seededRandom() * total;
  for (const [kind, weight] of Object.entries(KIND_WEIGHTS)) {
    r -= weight;
    if (r <= 0) return kind;
  }
  return "node";
}

/** Deterministic hex string (replaces crypto.randomBytes for reproducibility). */
function seededHex(byteLen: number): string {
  let out = "";
  for (let i = 0; i < byteLen; i++) {
    out += Math.floor(seededRandom() * 256)
      .toString(16)
      .padStart(2, "0");
  }
  return out;
}

function sha256(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

// ---------------------------------------------------------------------------
// Timestamp helpers
// ---------------------------------------------------------------------------

const NOW = new Date("2026-02-17T12:00:00.000Z").getTime();
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function randomStartTime(): number {
  // Spread runs across last 7 days with slight clustering toward recent
  const age = Math.pow(seededRandom(), 1.5) * SEVEN_DAYS_MS;
  return Math.floor(NOW - age);
}

function toISO(ts: number): string {
  return new Date(ts).toISOString();
}

// ---------------------------------------------------------------------------
// Run generation
// ---------------------------------------------------------------------------

interface GeneratedTask {
  effectId: string;
  kind: string;
  label: string;
  taskId: string;
  stepId: string;
  invocationKey: string;
  status: "resolved" | "error" | "requested";
  requestedAt: number;
  resolvedAt?: number;
  startedAt?: number;
  finishedAt?: number;
  error?: { name: string; message: string; stack?: string };
}

interface GeneratedRun {
  runId: string;
  processId: string;
  projectName: string;
  status: "completed" | "failed" | "waiting" | "pending";
  createdAt: number;
  completedAt?: number;
  tasks: GeneratedTask[];
}

function generateRun(index: number): GeneratedRun {
  const projectName = pick(PROJECT_NAMES);
  const processId = pick(PROCESS_IDS[projectName]);
  const createdAt = randomStartTime();
  const runId = generateUlid(createdAt);

  // Determine run status with realistic distribution
  const statusRoll = seededRandom();
  let runStatus: GeneratedRun["status"];
  if (statusRoll < 0.55) runStatus = "completed";
  else if (statusRoll < 0.75) runStatus = "failed";
  else if (statusRoll < 0.90) runStatus = "waiting";
  else runStatus = "pending";

  // Stress test: make ~20% of runs have many tasks (20-25)
  const isHeavy = seededRandom() < 0.20;
  const taskCount = isHeavy ? randInt(20, 25) : randInt(5, 15);

  const tasks: GeneratedTask[] = [];
  let cursor = createdAt + randInt(500, 3000); // first task starts shortly after run

  for (let t = 0; t < taskCount; t++) {
    const kind = weightedPick();
    const labels = TASK_LABELS[kind] || TASK_LABELS["node"];
    const label = pick(labels);
    const effectId = generateUlid(cursor);
    const stepNum = String(t + 1).padStart(6, "0");
    const stepId = `S${stepNum}`;
    const taskIdSlug = label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 30);
    const invocationKey = `${processId}:${stepId}:${taskIdSlug}`;

    let taskStatus: GeneratedTask["status"];
    let resolvedAt: number | undefined;
    let startedAt: number | undefined;
    let finishedAt: number | undefined;
    let error: GeneratedTask["error"] | undefined;

    if (runStatus === "pending" && t === 0) {
      // Pending runs have no completed tasks — first task is requested, rest don't exist
      taskStatus = "requested";
    } else if (runStatus === "waiting" && t === taskCount - 1) {
      // Last task in waiting run is still requested (possibly a breakpoint)
      taskStatus = "requested";
    } else if (runStatus === "failed" && t === taskCount - 1) {
      // Last task in failed run is the one that errored
      taskStatus = "error";
      const duration = randInt(500, 30000);
      startedAt = cursor + randInt(100, 2000);
      finishedAt = startedAt + duration;
      resolvedAt = finishedAt + randInt(50, 500);
      const errDef = pick(ERROR_MESSAGES);
      error = {
        name: errDef.name,
        message: errDef.message,
        stack: `${errDef.name}: ${errDef.message}\n    at processTask (tasks/${effectId}/handler.js:42:11)\n    at async runStep (lib/runner.js:187:5)`,
      };
    } else if (runStatus === "pending" && t > 0) {
      // Skip remaining tasks for pending runs
      break;
    } else {
      // Completed task
      taskStatus = "resolved";
      const duration = randInt(200, 60000);
      startedAt = cursor + randInt(100, 2000);
      finishedAt = startedAt + duration;
      resolvedAt = finishedAt + randInt(50, 500);
    }

    tasks.push({
      effectId,
      kind,
      label,
      taskId: taskIdSlug,
      stepId,
      invocationKey,
      status: taskStatus,
      requestedAt: cursor,
      resolvedAt,
      startedAt,
      finishedAt,
      error,
    });

    // Advance cursor for next task
    cursor = (resolvedAt || cursor) + randInt(200, 5000);
  }

  // Determine completedAt for the run
  let completedAt: number | undefined;
  if (runStatus === "completed" || runStatus === "failed") {
    const lastTask = tasks[tasks.length - 1];
    completedAt = (lastTask.resolvedAt || lastTask.requestedAt) + randInt(100, 2000);
  }

  return {
    runId,
    processId,
    projectName,
    status: runStatus,
    createdAt,
    completedAt,
    tasks,
  };
}

// ---------------------------------------------------------------------------
// Filesystem writers
// ---------------------------------------------------------------------------

async function writeRunDir(run: GeneratedRun): Promise<void> {
  const runDir = path.join(RUNS_DIR, run.runId);
  const journalDir = path.join(runDir, "journal");
  const tasksDir = path.join(runDir, "tasks");

  await fs.mkdir(journalDir, { recursive: true });
  await fs.mkdir(tasksDir, { recursive: true });

  // --- run.json ---
  const runJson = {
    runId: run.runId,
    request: run.processId,
    processId: run.processId,
    projectName: run.projectName,
    entrypoint: {
      importPath: `../../processes/${run.processId.replace("/", "-")}.js`,
      exportName: "process",
    },
    processPath: `../../processes/${run.processId.replace("/", "-")}.js`,
    layoutVersion: "2026.01-storage-preview",
    createdAt: toISO(run.createdAt),
    completionSecret: seededHex(16),
  };
  await fs.writeFile(path.join(runDir, "run.json"), JSON.stringify(runJson, null, 2) + "\n");

  // --- inputs.json ---
  const inputsJson = generateRunInputs(run);
  await fs.writeFile(path.join(runDir, "inputs.json"), JSON.stringify(inputsJson, null, 2) + "\n");

  // --- journal events ---
  let seq = 0;

  // Event 1: RUN_CREATED
  seq++;
  const runCreatedId = generateUlid(run.createdAt);
  const runCreatedEvent = {
    type: "RUN_CREATED",
    recordedAt: toISO(run.createdAt),
    data: {
      runId: run.runId,
      processId: run.processId,
      entrypoint: runJson.entrypoint,
      inputsRef: "inputs.json",
    },
    checksum: sha256(`RUN_CREATED:${run.runId}`),
  };
  await writeJournalEvent(journalDir, seq, runCreatedId, runCreatedEvent);

  // Events for each task: EFFECT_REQUESTED + EFFECT_RESOLVED
  for (const task of run.tasks) {
    // EFFECT_REQUESTED
    seq++;
    const reqId = generateUlid(task.requestedAt);
    const reqEvent = {
      type: "EFFECT_REQUESTED",
      recordedAt: toISO(task.requestedAt),
      data: {
        effectId: task.effectId,
        invocationKey: task.invocationKey,
        invocationHash: sha256(task.invocationKey),
        stepId: task.stepId,
        taskId: task.taskId,
        kind: task.kind,
        label: task.label,
        taskDefRef: `tasks/${task.effectId}/task.json`,
      },
      checksum: sha256(`EFFECT_REQUESTED:${task.effectId}`),
    };
    await writeJournalEvent(journalDir, seq, reqId, reqEvent);

    // EFFECT_RESOLVED (only for resolved/error tasks)
    if (task.status !== "requested" && task.resolvedAt) {
      seq++;
      const resId = generateUlid(task.resolvedAt);
      const resEvent: Record<string, unknown> = {
        type: "EFFECT_RESOLVED",
        recordedAt: toISO(task.resolvedAt),
        data: {
          effectId: task.effectId,
          status: task.status === "error" ? "error" : "ok",
          resultRef: `tasks/${task.effectId}/result.json`,
          startedAt: task.startedAt ? toISO(task.startedAt) : undefined,
          finishedAt: task.finishedAt ? toISO(task.finishedAt) : undefined,
          ...(task.error
            ? {
                error: {
                  name: task.error.name,
                  message: task.error.message,
                  stack: task.error.stack,
                },
              }
            : {}),
        },
        checksum: sha256(`EFFECT_RESOLVED:${task.effectId}`),
      };
      await writeJournalEvent(journalDir, seq, resId, resEvent);
    }
  }

  // Terminal event: RUN_COMPLETED or RUN_FAILED
  if (run.status === "completed" && run.completedAt) {
    seq++;
    const compId = generateUlid(run.completedAt);
    const compEvent = {
      type: "RUN_COMPLETED",
      recordedAt: toISO(run.completedAt),
      data: {
        runId: run.runId,
        status: "completed",
      },
      checksum: sha256(`RUN_COMPLETED:${run.runId}`),
    };
    await writeJournalEvent(journalDir, seq, compId, compEvent);
  } else if (run.status === "failed" && run.completedAt) {
    seq++;
    const failId = generateUlid(run.completedAt);
    const failEvent = {
      type: "RUN_FAILED",
      recordedAt: toISO(run.completedAt),
      data: {
        runId: run.runId,
        status: "failed",
        error: run.tasks[run.tasks.length - 1]?.error || {
          name: "UnknownError",
          message: "Run failed",
        },
      },
      checksum: sha256(`RUN_FAILED:${run.runId}`),
    };
    await writeJournalEvent(journalDir, seq, failId, failEvent);
  }

  // --- task directories ---
  for (const task of run.tasks) {
    const taskDir = path.join(tasksDir, task.effectId);
    await fs.mkdir(taskDir, { recursive: true });

    // task.json
    const taskJson = generateTaskJson(task, run);
    await fs.writeFile(path.join(taskDir, "task.json"), JSON.stringify(taskJson, null, 2) + "\n");

    // result.json (only for resolved/error tasks)
    if (task.status !== "requested") {
      const resultJson = generateResultJson(task, run);
      await fs.writeFile(
        path.join(taskDir, "result.json"),
        JSON.stringify(resultJson, null, 2) + "\n"
      );
    }
  }
}

async function writeJournalEvent(
  journalDir: string,
  seq: number,
  id: string,
  event: Record<string, unknown>
): Promise<void> {
  const filename = `${String(seq).padStart(6, "0")}.${id}.json`;
  await fs.writeFile(path.join(journalDir, filename), JSON.stringify(event, null, 2) + "\n");
}

// ---------------------------------------------------------------------------
// Data generators
// ---------------------------------------------------------------------------

function generateRunInputs(run: GeneratedRun): Record<string, unknown> {
  const templates: Record<string, () => Record<string, unknown>> = {
    "demo-project": () => ({
      feedUrl: `https://feeds.example.com/${pick(["tech-talks", "startup-stories", "dev-diaries"])}/rss`,
      maxEpisodes: randInt(5, 50),
      language: pick(["en", "es", "fr"]),
      outputFormat: pick(["markdown", "html", "json"]),
    }),
    "sample-project": () => ({
      teamId: `team-${randInt(100, 999)}`,
      season: "2025-2026",
      syncMode: pick(["full", "incremental", "delta"]),
      includeMinors: seededRandom() > 0.5,
    }),
    "sales-pipeline": () => ({
      crmInstance: `https://${pick(["acme", "globex", "initech"])}.crm.example.com`,
      pipeline: pick(["enterprise", "mid-market", "smb"]),
      dateRange: {
        start: "2026-02-10",
        end: "2026-02-17",
      },
      threshold: randInt(50, 95),
    }),
    "content-scheduler": () => ({
      channels: pick([["blog", "twitter"], ["blog", "linkedin", "newsletter"], ["twitter"]]),
      timezone: pick(["America/Toronto", "America/New_York", "Europe/London"]),
      draftCount: randInt(3, 20),
      autoPublish: seededRandom() > 0.7,
    }),
  };

  return (templates[run.projectName] || templates["sales-pipeline"])();
}

function generateTaskJson(task: GeneratedTask, run: GeneratedRun): Record<string, unknown> {
  const base: Record<string, unknown> = {
    schemaVersion: "2026.01.tasks-v1",
    effectId: task.effectId,
    taskId: task.taskId,
    invocationKey: task.invocationKey,
    stepId: task.stepId,
    kind: task.kind,
    title: task.label,
    io: {
      inputJsonPath: `tasks/${task.effectId}/input.json`,
      outputJsonPath: `tasks/${task.effectId}/result.json`,
    },
    inputs: generateTaskInputs(task, run),
  };

  if (task.kind === "agent") {
    base.agent = {
      name: task.taskId,
      prompt: {
        role: pick(["analyst", "writer", "reviewer", "architect", "researcher"]),
        task: task.label,
        instructions: [
          `Analyze the provided data for ${run.projectName}`,
          "Follow the project coding standards",
          "Return structured JSON output",
          pick([
            "Use chain-of-thought reasoning",
            "Prioritize accuracy over speed",
            "Include confidence scores",
            "Cite sources where applicable",
          ]),
        ],
      },
    };
  }

  if (task.kind === "breakpoint") {
    base.inputs = {
      question: task.label,
      title: `Approval: ${task.label.replace("?", "")}`,
      context: {
        files: [
          {
            path: `reports/${task.taskId}-preview.md`,
            format: "markdown",
            language: "markdown",
          },
          {
            path: `data/${task.taskId}-changes.json`,
            format: "json",
          },
        ],
        metadata: {
          requestedBy: pick(["system", "user", "scheduler"]),
          priority: pick(["low", "medium", "high", "critical"]),
        },
      },
    };
  }

  return base;
}

function generateTaskInputs(task: GeneratedTask, run: GeneratedRun): Record<string, unknown> {
  if (task.kind === "shell") {
    return {
      command: pick(["npm", "docker", "aws", "psql", "redis-cli"]),
      args: [pick(["run", "build", "exec", "sync", "migrate"]), `--env=${pick(["staging", "prod", "dev"])}`],
      cwd: `/workspace/${run.projectName}`,
      timeout: randInt(30, 300) * 1000,
    };
  }

  if (task.kind === "node") {
    return {
      records: randInt(100, 10000),
      batchSize: randInt(50, 500),
      source: pick(["postgres", "redis", "s3", "api", "csv"]),
      destination: pick(["postgres", "elasticsearch", "s3", "webhook"]),
    };
  }

  if (task.kind === "agent") {
    return {
      context: `Process ${run.processId} step ${task.stepId}`,
      maxTokens: randInt(1000, 8000),
      temperature: +(seededRandom() * 0.8 + 0.1).toFixed(2),
      model: pick(["claude-sonnet-4-20250514", "claude-opus-4-20250514", "claude-haiku-235-20250227"]),
    };
  }

  if (task.kind === "skill") {
    return {
      skillName: task.taskId,
      version: `${randInt(1, 5)}.${randInt(0, 9)}.${randInt(0, 20)}`,
      config: {
        retries: randInt(1, 5),
        backoff: pick(["linear", "exponential"]),
      },
    };
  }

  if (task.kind === "sleep") {
    return {
      durationMs: randInt(1000, 60000),
      reason: task.label,
    };
  }

  return { data: "generic-input" };
}

function generateResultJson(task: GeneratedTask, run: GeneratedRun): Record<string, unknown> {
  const base: Record<string, unknown> = {
    schemaVersion: "2026.01.results-v1",
    effectId: task.effectId,
    taskId: task.taskId,
    invocationKey: task.invocationKey,
    status: task.status === "error" ? "error" : "ok",
    startedAt: task.startedAt ? toISO(task.startedAt) : undefined,
    finishedAt: task.finishedAt ? toISO(task.finishedAt) : undefined,
  };

  if (task.status === "error" && task.error) {
    base.error = task.error;
  } else {
    base.result = generateTaskResult(task, run);
    base.value = base.result; // babysitter stores result in both fields
  }

  return base;
}

function generateTaskResult(task: GeneratedTask, _run: GeneratedRun): Record<string, unknown> {
  if (task.kind === "agent") {
    return {
      summary: `Generated ${pick(["analysis", "report", "specification", "draft", "review"])} for ${task.label}`,
      sections: randInt(2, 8),
      wordCount: randInt(200, 5000),
      confidence: +(seededRandom() * 0.3 + 0.7).toFixed(3),
      recommendations: Array.from({ length: randInt(1, 5) }, () =>
        pick([
          "Increase test coverage for edge cases",
          "Add input validation for user-facing fields",
          "Consider caching for frequently accessed data",
          "Implement retry logic for external API calls",
          "Add structured logging for debugging",
          "Review error handling in async paths",
        ])
      ),
    };
  }

  if (task.kind === "node") {
    const processed = randInt(100, 10000);
    return {
      processed,
      failed: randInt(0, Math.floor(processed * 0.05)),
      skipped: randInt(0, Math.floor(processed * 0.02)),
      duration_ms: task.finishedAt && task.startedAt ? task.finishedAt - task.startedAt : 0,
      outputPath: `output/${task.taskId}-${task.effectId.slice(-6)}.json`,
    };
  }

  if (task.kind === "shell") {
    return {
      exitCode: 0,
      stdout: `[OK] Command completed successfully\nProcessed ${randInt(1, 200)} items`,
      stderr: "",
      duration_ms: task.finishedAt && task.startedAt ? task.finishedAt - task.startedAt : 0,
    };
  }

  if (task.kind === "skill") {
    return {
      invocations: randInt(1, 20),
      successRate: +(seededRandom() * 0.2 + 0.8).toFixed(3),
      resultCount: randInt(5, 500),
    };
  }

  if (task.kind === "breakpoint") {
    return {
      approved: true,
      approvedBy: "user",
      approvedAt: task.finishedAt ? toISO(task.finishedAt) : undefined,
    };
  }

  if (task.kind === "sleep") {
    return {
      sleptMs: randInt(1000, 60000),
      reason: task.label,
    };
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Hand-authored fixtures (committed 01KTEST* dirs)
// ---------------------------------------------------------------------------

/** Committed, hand-authored fixture dirs — generation must NEVER touch these. */
const HAND_AUTHORED_PREFIX = "01KTEST";

const MANIFEST_PATH = path.join(RUNS_DIR, "_manifest.json");
const REGISTRY_PATH = path.join(__dirname, ".observer-test.json");

interface ManifestEntry {
  runId: string;
  processId: string;
  projectName: string;
  status: "completed" | "failed" | "waiting" | "pending";
  taskCount: number;
  createdAt: string;
}

interface JournalEvent {
  type?: string;
  data?: { effectId?: string; kind?: string };
}

/** Read a run's journal events in sequence order. */
async function readJournal(runDirPath: string): Promise<JournalEvent[]> {
  const journalDir = path.join(runDirPath, "journal");
  let files: string[];
  try {
    files = (await fs.readdir(journalDir)).filter((f) => f.endsWith(".json")).sort();
  } catch {
    return [];
  }
  const events: JournalEvent[] = [];
  for (const file of files) {
    events.push(JSON.parse(await fs.readFile(path.join(journalDir, file), "utf-8")));
  }
  return events;
}

/**
 * Derive a manifest entry (and pending-breakpoint flag) for a hand-authored
 * run dir from its committed run.json + journal — no data is invented.
 */
async function deriveAuthoredEntry(
  dirName: string
): Promise<{ entry: ManifestEntry; hasPendingBreakpoint: boolean }> {
  const runDirPath = path.join(RUNS_DIR, dirName);
  const runJson = JSON.parse(await fs.readFile(path.join(runDirPath, "run.json"), "utf-8"));
  const events = await readJournal(runDirPath);

  const requested = events.filter((e) => e.type === "EFFECT_REQUESTED");
  const resolvedIds = new Set(
    events.filter((e) => e.type === "EFFECT_RESOLVED").map((e) => e.data?.effectId)
  );
  const unresolved = requested.filter((e) => !resolvedIds.has(e.data?.effectId));

  let status: ManifestEntry["status"];
  if (events.some((e) => e.type === "RUN_COMPLETED")) status = "completed";
  else if (events.some((e) => e.type === "RUN_FAILED")) status = "failed";
  else if (requested.length === 0) status = "pending";
  else status = "waiting";

  return {
    entry: {
      runId: runJson.runId,
      processId: runJson.processId,
      projectName: runJson.projectName,
      status,
      taskCount: requested.length,
      createdAt: runJson.createdAt,
    },
    hasPendingBreakpoint: unresolved.some((e) => e.data?.kind === "breakpoint"),
  };
}

/** Projects hidden from the dashboard grid per the test registry. */
async function readHiddenProjects(): Promise<Set<string>> {
  try {
    const registry = JSON.parse(await fs.readFile(REGISTRY_PATH, "utf-8"));
    return new Set<string>(registry.hiddenProjects || []);
  } catch {
    return new Set();
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export interface GenerateResult {
  skipped: boolean;
  generatedCount: number;
  manifestRunCount: number;
}

/**
 * (Re)create the generated fixture runs + merged manifest.
 *
 * - Idempotent: with `force: false`, generation is skipped when a manifest
 *   exists and every run it lists is present on disk.
 * - Hand-authored `01KTEST*` dirs are never deleted or rewritten; their
 *   manifest entries are derived from their committed run.json + journal.
 * - Manifest aggregates follow the dashboard rules the specs assert on:
 *   statusCounts/projectCounts/totalTasks cover GRID-visible runs only
 *   (registry-hidden projects excluded); runCount additionally counts a
 *   hidden project's needs-you (unresolved breakpoint) runs, which surface
 *   on the alarm even when the project is hidden from the grid.
 */
export async function generateFixtures(
  options: { force?: boolean } = {}
): Promise<GenerateResult> {
  const force = options.force ?? false;
  await fs.mkdir(RUNS_DIR, { recursive: true });

  // Fast path: fixtures already present and consistent — nothing to do.
  if (!force) {
    try {
      const manifest = JSON.parse(await fs.readFile(MANIFEST_PATH, "utf-8"));
      const entries: ManifestEntry[] = manifest.runs || [];
      const checks = await Promise.all(
        entries.map((r) =>
          fs
            .access(path.join(RUNS_DIR, r.runId, "run.json"))
            .then(() => true)
            .catch(() => false)
        )
      );
      if (entries.length > 0 && checks.every(Boolean)) {
        return { skipped: true, generatedCount: 0, manifestRunCount: manifest.runCount };
      }
    } catch {
      // Missing/unreadable manifest -> regenerate below.
    }
  }

  console.log(`Generating ${RUN_COUNT} fixture runs in ${RUNS_DIR}...`);

  // Reset the PRNG so every invocation yields the identical canonical set.
  seed = INITIAL_SEED;

  // Clean ONLY previously generated content. Hand-authored 01KTEST* dirs are
  // committed and must survive regeneration.
  const existing = await fs.readdir(RUNS_DIR, { withFileTypes: true });
  for (const dirent of existing) {
    if (dirent.name.startsWith(HAND_AUTHORED_PREFIX)) continue;
    await fs.rm(path.join(RUNS_DIR, dirent.name), { recursive: true, force: true });
  }

  const runs: GeneratedRun[] = [];
  let generatedTasks = 0;

  for (let i = 0; i < RUN_COUNT; i++) {
    const run = generateRun(i);
    runs.push(run);
    generatedTasks += run.tasks.length;
  }

  // Sort by createdAt ascending so directory listing looks natural
  runs.sort((a, b) => a.createdAt - b.createdAt);

  // Write all run directories
  for (const run of runs) {
    await writeRunDir(run);
  }

  // Manifest entries: generated runs + derived hand-authored runs.
  const generatedEntries = runs.map((r) => ({
    entry: {
      runId: r.runId,
      processId: r.processId,
      projectName: r.projectName,
      status: r.status,
      taskCount: r.tasks.length,
      createdAt: toISO(r.createdAt),
    } satisfies ManifestEntry,
    hasPendingBreakpoint: r.tasks.some(
      (t) => t.status === "requested" && t.kind === "breakpoint"
    ),
  }));

  const authoredDirs = existing
    .filter((d) => d.isDirectory() && d.name.startsWith(HAND_AUTHORED_PREFIX))
    .map((d) => d.name)
    .sort();
  const authoredEntries = [];
  for (const dirName of authoredDirs) {
    authoredEntries.push(await deriveAuthoredEntry(dirName));
  }

  const allEntries = [...generatedEntries, ...authoredEntries];
  const hiddenProjects = await readHiddenProjects();
  const gridEntries = allEntries.filter((e) => !hiddenProjects.has(e.entry.projectName));
  const hiddenNeedsYou = allEntries.filter(
    (e) => hiddenProjects.has(e.entry.projectName) && e.hasPendingBreakpoint
  );

  const statusCounts: Record<string, number> = {};
  const projectCounts: Record<string, number> = {};
  let totalTasks = 0;
  for (const { entry } of gridEntries) {
    statusCounts[entry.status] = (statusCounts[entry.status] || 0) + 1;
    projectCounts[entry.projectName] = (projectCounts[entry.projectName] || 0) + 1;
    totalTasks += entry.taskCount;
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    // Dashboard-surfaced total: grid-visible runs PLUS hidden needs-you runs
    // (the alarm surface still shows those) — kanban headerSum asserts this.
    runCount: gridEntries.length + hiddenNeedsYou.length,
    totalTasks,
    statusCounts,
    projectCounts,
    runs: allEntries.map((e) => e.entry),
  };
  await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");

  console.log(`\nGeneration complete!`);
  console.log(`  Generated runs: ${runs.length} (${generatedTasks} tasks)`);
  console.log(`  Hand-authored runs (untouched): ${authoredDirs.length}`);
  console.log(`  Manifest runCount: ${manifest.runCount}`);
  console.log(`  Status distribution (grid): ${JSON.stringify(statusCounts)}`);
  console.log(`  Project distribution (grid): ${JSON.stringify(projectCounts)}`);
  console.log(`  Manifest written to ${MANIFEST_PATH}`);

  return {
    skipped: false,
    generatedCount: runs.length,
    manifestRunCount: manifest.runCount,
  };
}

// CLI entrypoint: `npx tsx e2e/fixtures/generate-fixtures.ts` forces a full
// regeneration. Programmatic callers (playwright globalSetup) import
// generateFixtures() instead, which is idempotent.
if (require.main === module) {
  generateFixtures({ force: true }).catch((err) => {
    console.error("Fixture generation failed:", err);
    process.exit(1);
  });
}
