#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const HOME = process.env.HOME || "/home/codex";
const WORKSPACE = "/workspace/codex-full-run";
const CODEX_HOME = process.env.CODEX_HOME || path.join(HOME, ".codex");
const SKILL_DIR = path.join(CODEX_HOME, "skills", "babysitter-codex");
const PROCESS_PATH = path.join(WORKSPACE, "ci-codex-process.js");
const AGENTS_PATH = path.join(WORKSPACE, "AGENTS.md");
const CONFIG_PATH = path.join(WORKSPACE, ".codex", "config.toml");
const HOOKS_PATH = path.join(WORKSPACE, ".codex", "hooks.json");
const ENV_FILE_PATH = path.join(WORKSPACE, ".codex", "codex.env.sh");
const ALPHA_PATH = path.join(WORKSPACE, "codex-artifacts", "alpha.txt");
const REPORT_PATH = path.join(WORKSPACE, "codex-artifacts", "final-report.json");

/**
 * Build a plain-text prompt from a task definition's agent fields.
 * Replaces the deleted effect-mapper.js module.
 */
function buildPromptFromTaskDef(taskDef) {
  const effect = taskDef.effect || taskDef;
  if (effect.kind === "breakpoint") return null;

  const agent = effect.agent || {};
  const parts = [];
  if (agent.role) parts.push(`Role: ${agent.role}`);
  if (agent.task) parts.push(`Task: ${agent.task}`);
  if (agent.instructions && Array.isArray(agent.instructions)) {
    parts.push("Instructions:");
    agent.instructions.forEach((inst) => parts.push(`- ${inst}`));
  }
  if (agent.context) {
    parts.push(`Context: ${JSON.stringify(agent.context)}`);
  }
  return parts.join("\n") || effect.title || "Execute the task.";
}

function fail(message, details = {}) {
  const error = new Error(message);
  error.details = details;
  throw error;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(file, contents) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, contents, "utf8");
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function run(cmd, args, options = {}) {
  return spawnSync(cmd, args, {
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
    ...options,
  });
}

function runChecked(cmd, args, options = {}) {
  const result = run(cmd, args, options);
  if (result.status !== 0) {
    fail(`${cmd} ${args.join(" ")} failed`, {
      exitCode: result.status,
      stdout: result.stdout,
      stderr: result.stderr,
    });
  }
  return result;
}

function runJsonChecked(cmd, args, options = {}) {
  const result = runChecked(cmd, args, options);
  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    fail(`Could not parse JSON output from ${cmd} ${args.join(" ")}`, {
      stdout: result.stdout,
      stderr: result.stderr,
      parseError: error.message,
    });
  }
}

function resolveProviderConfig() {
  const providerName = String(process.env.A5C_PROVIDER_NAME || "").trim().toLowerCase();
  const selectedCli = String(process.env.A5C_SELECTED_CLI_COMMAND || process.env.A5C_CLI_TOOL || "").trim().toLowerCase();
  const selectedModel = String(process.env.A5C_SELECTED_MODEL || "").trim();
  const azureKey = String(process.env.AZURE_OPENAI_API_KEY || "").trim();
  const azureProject = String(process.env.AZURE_OPENAI_PROJECT_NAME || "").trim();
  const openAiKey = String(process.env.OPENAI_API_KEY || "").trim();
  const openAiBaseUrl = String(process.env.OPENAI_BASE_URL || "").trim();
  const azureSelected = providerName === "azure_openai" || selectedCli === "azure_codex";
  const azureConfigured = Boolean(azureKey && azureProject);
  const preferAzure = azureConfigured && (azureSelected || !openAiKey);

  if (preferAzure) {
    return {
      kind: "azure",
      model: String(process.env.AZURE_OPENAI_DEPLOYMENT || selectedModel || "gpt-5.4").trim(),
      modelProvider: "azure",
      baseUrl: `https://${azureProject}.openai.azure.com/openai/v1`,
      envKey: "AZURE_OPENAI_API_KEY",
    };
  }

  if (azureSelected && !azureConfigured && !openAiKey) {
    fail("Azure Codex provider is selected but required Azure env is missing", {
      providerName,
      selectedCli,
      hasAzureApiKey: Boolean(azureKey),
      hasAzureProjectName: Boolean(azureProject),
    });
  }

  if (openAiKey) {
    return {
      kind: "openai",
      model: selectedModel || "gpt-5.4",
      baseUrl: openAiBaseUrl,
      envKey: "OPENAI_API_KEY",
    };
  }

  fail("No supported Codex provider credentials found for the Docker E2E test", {
    expected: [
      "AZURE_OPENAI_API_KEY + AZURE_OPENAI_PROJECT_NAME",
      "OPENAI_API_KEY",
    ],
    hasAzureApiKey: Boolean(azureKey),
    hasAzureProjectName: Boolean(azureProject),
    hasOpenAiKey: Boolean(openAiKey),
  });
}

function workspaceConfig(provider) {
  const lines = [
    `model = "${provider.model}"`,
    'approval_policy = "never"',
    'sandbox_mode = "workspace-write"',
    "",
    "[features]",
    "codex_hooks = true",
  ];

  if (provider.kind === "azure") {
    lines.push('model_provider = "azure"');
  } else if (provider.baseUrl) {
    lines.push(`openai_base_url = "${provider.baseUrl}"`);
  }

  lines.push("", "[sandbox_workspace_write]");
  lines.push('writable_roots = [".", ".a5c", ".codex"]');

  if (provider.kind === "azure") {
    lines.push("", "[model_providers.azure]");
    lines.push('name = "Azure OpenAI"');
    lines.push(`base_url = "${provider.baseUrl}"`);
    lines.push(`env_key = "${provider.envKey}"`);
  }

  lines.push("");
  return lines.join("\n");
}

function workspaceAgents() {
  return [
    "# CI instructions",
    "",
    "- Follow the task exactly.",
    "- When asked to create or update a file, do it in the current workspace.",
    "- Keep responses plain text with no markdown unless asked.",
    "",
  ].join("\n");
}

function workspaceHooksConfig(skillDir) {
  const hooksDir = path.join(skillDir, ".codex", "hooks");
  return {
    hooks: {
      SessionStart: [
        {
          matcher: "*",
          hooks: [{ type: "command", command: path.join(hooksDir, "babysitter-session-start.sh") }],
        },
      ],
      UserPromptSubmit: [
        {
          matcher: "*",
          hooks: [{ type: "command", command: path.join(hooksDir, "user-prompt-submit.sh") }],
        },
      ],
      Stop: [
        {
          matcher: "*",
          hooks: [{ type: "command", command: path.join(hooksDir, "babysitter-stop-hook.sh") }],
        },
      ],
    },
  };
}

function processSource() {
  return `const createAlphaArtifact = {
  id: 'create-alpha-artifact',
  async build(args) {
    return {
      kind: 'agent',
      title: 'Create alpha artifact',
      agent: {
        role: 'CI filesystem validation agent',
        task: 'Create codex-artifacts/alpha.txt in the current workspace.',
        context: {
          requiredContents: args.contents,
          requiredPath: 'codex-artifacts/alpha.txt',
        },
        instructions: [
          'Create the file if it does not exist.',
          'Write exactly the required contents followed by a trailing newline.',
          'Respond with exactly "created:codex-artifacts/alpha.txt".',
          'Do not wrap the response in markdown.'
        ],
        outputFormat: 'plain text'
      },
      metadata: {
        stage: 'alpha'
      }
    };
  }
};

const approvalGate = {
  id: 'approval-gate',
  async build() {
    return {
      kind: 'breakpoint',
      title: 'Approval gate',
      breakpoint: {
        question: 'Approval required for Codex E2E continuation',
        questions: ['Release token']
      },
      metadata: {
        stage: 'gate'
      }
    };
  }
};

const createFinalReport = {
  id: 'create-final-report',
  async build(args) {
    return {
      kind: 'agent',
      title: 'Create final report',
      agent: {
        role: 'CI integration validation agent',
        task: 'Read codex-artifacts/alpha.txt and create codex-artifacts/final-report.json in the current workspace.',
        context: {
          alphaPath: 'codex-artifacts/alpha.txt',
          reportPath: 'codex-artifacts/final-report.json',
          expectedAlpha: args.expectedAlpha,
          releaseToken: args.releaseToken,
          gateApproved: args.gateApproved
        },
        instructions: [
          'Read the existing alpha artifact.',
          'Write a JSON object with keys alpha, gateApproved, releaseToken, and validatedAt.',
          'Set alpha to the trimmed contents of codex-artifacts/alpha.txt.',
          'Set gateApproved to the provided boolean value.',
          'Set releaseToken to the provided release token.',
          'Respond with exactly "created:codex-artifacts/final-report.json".',
          'Do not wrap the response in markdown.'
        ],
        outputFormat: 'plain text'
      },
      metadata: {
        stage: 'report'
      }
    };
  }
};

export async function process(_inputs, ctx) {
  const alpha = await ctx.task(createAlphaArtifact, { contents: 'alpha-run-ok' });
  const gate = await ctx.task(approvalGate, {});
  const report = await ctx.task(createFinalReport, {
    expectedAlpha: 'alpha-run-ok',
    releaseToken: gate?.answers?.releaseToken || '',
    gateApproved: Boolean(gate?.approved)
  });

  return {
    completed: true,
    alpha,
    gateApproved: Boolean(gate?.approved),
    releaseToken: gate?.answers?.releaseToken || '',
    report
  };
}
`;
}

function runBabysitterJson(args, options = {}) {
  return runJsonChecked("babysitter", [...args, "--json"], {
    cwd: WORKSPACE,
    env: {
      ...process.env,
      CODEX_HOME,
      REPO_ROOT: WORKSPACE,
      ...options.env,
    },
    input: options.input,
    timeout: options.timeout || 900_000,
  });
}

function runHook(args, payload, options = {}) {
  return runJsonChecked("babysitter", [
    "hook:run",
    ...args,
    "--json",
  ], {
    cwd: WORKSPACE,
    env: {
      ...process.env,
      CODEX_HOME,
      REPO_ROOT: WORKSPACE,
      ...options.env,
    },
    input: payload,
  });
}

function readTaskDefinition(runDir, effectId) {
  const taskPath = path.join(runDir, "tasks", effectId, "task.json");
  if (!fs.existsSync(taskPath)) {
    fail("Task definition missing", { taskPath, effectId, runDir });
  }
  return readJson(taskPath);
}

function writeTaskValue(runDir, effectId, payload) {
  const taskDir = path.join(runDir, "tasks", effectId);
  const valuePath = path.join(taskDir, "value.json");
  writeFile(valuePath, JSON.stringify(payload, null, 2));
  return valuePath;
}

function executeCodexTask(runId, runDir, turnIndex, task) {
  const effectId = task.effectId;
  const taskDef = readTaskDefinition(runDir, effectId);
  const prompt = buildPromptFromTaskDef(taskDef);
  if (!prompt) {
    fail("No Codex prompt could be derived for executable task", { effectId, taskDef });
  }

  const codexArgs = [
    "exec",
    "--approval-policy", "never",
    "--sandbox-mode", "workspace-write",
    prompt,
  ];
  const result = run("codex", codexArgs, {
    cwd: WORKSPACE,
    env: {
      ...process.env,
      CODEX_HOME,
      REPO_ROOT: WORKSPACE,
      BABYSITTER_RUN_ID: runId,
      BABYSITTER_RUN_DIR: runDir,
      CODEX_TURN_INDEX: String(turnIndex),
    },
    timeout: 900_000,
  });

  if (result.status !== 0) {
    fail("codex exec failed during hooks E2E", {
      effectId,
      codexArgs,
      exitCode: result.status,
      stdout: result.stdout,
      stderr: result.stderr,
    });
  }

  const valuePath = writeTaskValue(runDir, effectId, {
    success: true,
    exitCode: result.status,
    completedAt: new Date().toISOString(),
    result: { output: (result.stdout || "").trim() },
  });

  runBabysitterJson([
    "task:post",
    runDir,
    effectId,
    "--status",
    "ok",
    "--value",
    valuePath,
  ]);
}

function approveBreakpoint(runDir, effectId) {
  const valuePath = writeTaskValue(runDir, effectId, {
    approved: true,
    response: "Continue after approval.",
    answers: { releaseToken: "ci-release-token" },
  });
  runBabysitterJson([
    "task:post",
    runDir,
    effectId,
    "--status",
    "ok",
    "--value",
    valuePath,
  ]);
}

function collectTaskSummaries(runDir) {
  const tasksDir = path.join(runDir, "tasks");
  if (!fs.existsSync(tasksDir)) return [];
  return fs.readdirSync(tasksDir).sort().map((effectId) => {
    const taskDir = path.join(tasksDir, effectId);
    const taskDef = fs.existsSync(path.join(taskDir, "task.json"))
      ? readJson(path.join(taskDir, "task.json"))
      : {};
    const output = fs.existsSync(path.join(taskDir, "output.json"))
      ? readJson(path.join(taskDir, "output.json"))
      : null;
    return {
      effectId,
      kind: taskDef.kind || (taskDef.effect && taskDef.effect.kind) || null,
      title: taskDef.title || (taskDef.effect && taskDef.effect.title) || null,
      output,
    };
  });
}

function main() {
  if (!fs.existsSync(path.join(SKILL_DIR, ".codex", "hooks", "babysitter-stop-hook.sh"))) {
    fail("Installed babysitter-codex skill is missing stop hook script", {
      expectedPath: path.join(SKILL_DIR, ".codex", "hooks", "babysitter-stop-hook.sh"),
    });
  }

  const provider = resolveProviderConfig();
  fs.rmSync(WORKSPACE, { recursive: true, force: true });
  ensureDir(WORKSPACE);
  ensureDir(path.dirname(CONFIG_PATH));
  writeFile(CONFIG_PATH, workspaceConfig(provider));
  writeFile(HOOKS_PATH, JSON.stringify(workspaceHooksConfig(SKILL_DIR), null, 2));
  writeFile(AGENTS_PATH, workspaceAgents());
  writeFile(PROCESS_PATH, processSource());
  writeFile(ENV_FILE_PATH, "");

  runChecked("git", ["init", "-q"], { cwd: WORKSPACE });
  runChecked("git", ["config", "user.email", "ci@example.com"], { cwd: WORKSPACE });
  runChecked("git", ["config", "user.name", "CI"], { cwd: WORKSPACE });

  const sessionId = `codex-ci-${Date.now()}`;
  runHook(
    ["--hook-type", "session-start", "--harness", "codex", "--plugin-root", path.join(WORKSPACE, ".codex"), "--state-dir", path.join(WORKSPACE, ".a5c")],
    JSON.stringify({ session_id: sessionId }),
    { env: { CODEX_ENV_FILE: ENV_FILE_PATH } },
  );
  const envFile = fs.readFileSync(ENV_FILE_PATH, "utf8");
  if (!envFile.includes(sessionId)) {
    fail("Session-start hook did not write CODEX env session identity", { envFile, sessionId });
  }

  const created = runBabysitterJson([
    "run:create",
    "--process-id",
    "ci/codex-full-run-hooks",
    "--entry",
    `${PROCESS_PATH}#process`,
    "--prompt",
    "Run the full Codex hook integration validation flow.",
    "--harness",
    "codex",
    "--session-id",
    sessionId,
    "--plugin-root",
    path.join(WORKSPACE, ".codex"),
  ]);

  const runId = created.runId;
  if (!runId) {
    fail("Could not resolve runId from run:create output", { created });
  }

  const runDir = path.join(WORKSPACE, ".a5c", "runs", runId);
  let turns = 0;
  const maxTurns = 16;
  let lastHookDecision = null;

  while (turns < maxTurns) {
    turns += 1;
    const iteration = runBabysitterJson(["run:iterate", runDir, "--iteration", String(turns)]);
    const pending = runBabysitterJson(["task:list", runDir, "--pending"]);
    const tasks = Array.isArray(pending.tasks) ? pending.tasks : [];

    for (const task of tasks) {
      if (task.kind === "breakpoint") {
        approveBreakpoint(runDir, task.effectId);
      } else {
        executeCodexTask(runId, runDir, turns, task);
      }
    }

    const status = runBabysitterJson(["run:status", runDir]);
    if (status.state === "completed") {
      const completionProof = status.completionProof;
      const hookPayload = JSON.stringify({
        session_id: sessionId,
        last_assistant_message: `<promise>${completionProof}</promise>`,
      });
      const hookOutput = runHook(
        ["--hook-type", "stop", "--harness", "codex", "--plugin-root", path.join(WORKSPACE, ".codex"), "--state-dir", path.join(WORKSPACE, ".a5c"), "--runs-dir", path.join(WORKSPACE, ".a5c", "runs")],
        hookPayload,
      );
      if (hookOutput.decision) {
        fail("Stop hook should approve completion when proof is provided", { hookOutput, status });
      }
      lastHookDecision = "approve";
      break;
    }

    const continueOutput = runHook(
      ["--hook-type", "stop", "--harness", "codex", "--plugin-root", path.join(WORKSPACE, ".codex"), "--state-dir", path.join(WORKSPACE, ".a5c"), "--runs-dir", path.join(WORKSPACE, ".a5c", "runs")],
      JSON.stringify({ session_id: sessionId }),
    );
    if (continueOutput.decision !== "block") {
      fail("Stop hook should block when run is still active", {
        continueOutput,
        iteration,
        runId,
      });
    }
    lastHookDecision = "block";
  }

  const finalStatus = runBabysitterJson(["run:status", runDir]);
  if (finalStatus.state !== "completed") {
    fail("Babysitter run did not complete through hook-based flow", { finalStatus, turns });
  }
  if (!fs.existsSync(ALPHA_PATH)) {
    fail("Codex did not create the alpha artifact", { alphaPath: ALPHA_PATH });
  }
  if (!fs.existsSync(REPORT_PATH)) {
    fail("Codex did not create the final report artifact", { reportPath: REPORT_PATH });
  }

  const alphaContents = fs.readFileSync(ALPHA_PATH, "utf8").trim();
  const report = readJson(REPORT_PATH);
  const outputPath = path.join(runDir, "state", "output.json");
  const output = fs.existsSync(outputPath) ? readJson(outputPath) : null;
  const taskSummaries = collectTaskSummaries(runDir);
  const breakpointTask = taskSummaries.find((task) => task.kind === "breakpoint");

  if (alphaContents !== "alpha-run-ok") {
    fail("Alpha artifact contents were not preserved", { alphaContents });
  }
  if (report.alpha !== "alpha-run-ok" || report.gateApproved !== true || report.releaseToken !== "ci-release-token") {
    fail("Final report did not contain the expected integrated values", { report });
  }
  if (!output || output.completed !== true || output.gateApproved !== true || output.releaseToken !== "ci-release-token") {
    fail("Run output.json did not record the completed full-run state", { output, outputPath });
  }
  if (!breakpointTask || !breakpointTask.output || breakpointTask.output.approved !== true) {
    fail("Breakpoint task did not capture an approval result", { breakpointTask, taskSummaries });
  }
  if (!breakpointTask.output.answers || breakpointTask.output.answers.releaseToken !== "ci-release-token") {
    fail("Breakpoint task did not capture the release token answer", { breakpointTask });
  }

  console.log(JSON.stringify({
    ok: true,
    runId,
    runDir,
    installedSkillDir: SKILL_DIR,
    provider,
    hookModel: "codex-hooks",
    hooksConfigPath: HOOKS_PATH,
    sessionId,
    lastHookDecision,
    alphaPath: ALPHA_PATH,
    reportPath: REPORT_PATH,
    alphaContents,
    report,
    finalStatus: finalStatus.state,
    output,
    breakpointTask,
    turns,
    taskCount: taskSummaries.length,
    tasks: taskSummaries.map((task) => ({
      effectId: task.effectId,
      kind: task.kind,
      title: task.title,
    })),
  }, null, 2));
}

try {
  main();
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    message: error.message,
    details: error.details || null,
  }, null, 2));
  process.exit(1);
}
