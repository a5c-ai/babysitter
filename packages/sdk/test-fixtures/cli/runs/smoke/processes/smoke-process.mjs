import crypto from "node:crypto";

const TASK_ID = "cli-smoke.node.echo";
const DEFAULT_ENTRY = "../processes/smoke-node-runner.mjs";
const DEFAULT_SECRET_ENV = {
  SECRET_TOKEN: "cli-smoke-secret-token",
  INTERNAL_API_KEY: "cli-smoke-internal-key",
};

const smokeNodeTask = {
  id: TASK_ID,
  async build(args, ctx) {
    const entry = resolveEntry(args.entry);
    const payload = resolvePayload(args.payload, args.requestId);
    const secretEnv = normalizeSecrets(args.secretEnv);
    const metadata = {
      requestId: args.requestId ?? "cli-smoke",
      payloadDigest: digestPayload(payload),
      redactedEnvKeys: Object.keys(secretEnv),
    };

    return {
      kind: "node",
      title: args.title ?? "CLI smoke node",
      description: "Pending node task exercised by the babysitter CLI smoke harness.",
      labels: ["cli-smoke", "pending-node"],
      metadata,
      node: {
        entry,
        args: ["--payload", JSON.stringify(payload)],
        env: {
          PUBLIC_FLAG: args.publicFlag ?? "cli-smoke",
          ...secretEnv,
        },
        timeoutMs: 60_000,
      },
    };
  },
};

export async function process(inputs = {}, ctx) {
  const taskInputs = {
    entry: inputs.taskEntry,
    payload: inputs.payload,
    publicFlag: inputs.publicFlag,
    secretEnv: inputs.secretEnv,
    requestId: inputs.requestId,
    title: inputs.title,
  };

  const first = await ctx.task(smokeNodeTask, taskInputs, { label: "cli-smoke-node-1" });
  const second = await ctx.task(
    smokeNodeTask,
    {
      ...taskInputs,
      payload: {
        ...(taskInputs.payload && typeof taskInputs.payload === "object" && !Array.isArray(taskInputs.payload)
          ? taskInputs.payload
          : {}),
        attempt: 2,
      },
      title: taskInputs.title ? `${taskInputs.title} (2)` : "CLI smoke node (2)",
    },
    { label: "cli-smoke-node-2" }
  );
  return { status: "ok", first, second };
}

function resolveEntry(value) {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  return DEFAULT_ENTRY;
}

function resolvePayload(payload, requestId) {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return payload;
  }
  return {
    requestId: requestId ?? "cli-smoke",
    correlationId: "cli-smoke-correlation",
    attempt: 1,
  };
}

function normalizeSecrets(value) {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_SECRET_ENV };
  }
  const normalized = { ...DEFAULT_SECRET_ENV };
  for (const key of Object.keys(DEFAULT_SECRET_ENV)) {
    const provided = value[key];
    if (typeof provided === "string" && provided.trim()) {
      normalized[key] = provided;
    }
  }
  return normalized;
}

function digestPayload(payload) {
  const serialized = JSON.stringify(payload);
  return crypto.createHash("sha1").update(serialized).digest("hex");
}
