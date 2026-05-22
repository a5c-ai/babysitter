import { spawn } from "node:child_process";

import type {
  AgentInstallPlan,
  AgentInstallResult,
  AgentInstallStep,
  CanonicalHarnessTarget,
  CloudConfig,
  HarnessInstallOperationResult,
  HarnessTarget,
  SupportedHarnessInstallTarget,
} from "../types.js";

const HARNESS_PLUGIN_PACKAGES: Partial<Record<CanonicalHarnessTarget, string>> = {
  "codex": "@a5c-ai/babysitter-codex",
  "cursor": "@a5c-ai/babysitter-cursor",
  "gemini-cli": "@a5c-ai/babysitter-gemini",
  "github-copilot": "@a5c-ai/babysitter-github",
  "oh-my-pi": "@a5c-ai/babysitter-omp",
  "openclaw": "@a5c-ai/babysitter-openclaw",
  "opencode": "@a5c-ai/babysitter-opencode",
  "pi": "@a5c-ai/babysitter-pi",
};

export const SUPPORTED_AGENT_INSTALL_TARGETS: readonly SupportedHarnessInstallTarget[] = [
  { target: "claude-code", harnessInstaller: "agent-mux", pluginScopes: [] },
  { target: "codex", harnessInstaller: "agent-mux", pluginScopes: ["global", "workspace"], pluginInstallerPackage: HARNESS_PLUGIN_PACKAGES.codex },
  { target: "cursor", harnessInstaller: "agent-mux", pluginScopes: ["global", "workspace"], pluginInstallerPackage: HARNESS_PLUGIN_PACKAGES.cursor },
  { target: "gemini-cli", harnessInstaller: "agent-mux", pluginScopes: ["global", "workspace"], pluginInstallerPackage: HARNESS_PLUGIN_PACKAGES["gemini-cli"] },
  { target: "github-copilot", aliases: ["copilot"], harnessInstaller: "agent-mux", pluginScopes: ["global", "workspace"], pluginInstallerPackage: HARNESS_PLUGIN_PACKAGES["github-copilot"] },
  { target: "oh-my-pi", harnessInstaller: "agent-mux", pluginScopes: ["global", "workspace"], pluginInstallerPackage: HARNESS_PLUGIN_PACKAGES["oh-my-pi"] },
  { target: "openclaw", harnessInstaller: "agent-mux", pluginScopes: ["global", "workspace"], pluginInstallerPackage: HARNESS_PLUGIN_PACKAGES.openclaw },
  { target: "opencode", harnessInstaller: "agent-mux", pluginScopes: ["global", "workspace"], pluginInstallerPackage: HARNESS_PLUGIN_PACKAGES.opencode },
  { target: "pi", harnessInstaller: "agent-mux", pluginScopes: ["global", "workspace"], pluginInstallerPackage: HARNESS_PLUGIN_PACKAGES.pi },
];

function normalizeHarnessTarget(target: HarnessTarget): CanonicalHarnessTarget {
  return target === "copilot" ? "github-copilot" : target;
}

function buildStep(target: HarnessTarget, installPlugin: boolean, scope: "global" | "workspace"): AgentInstallStep {
  const canonicalTarget = normalizeHarnessTarget(target);
  const installerPackage = HARNESS_PLUGIN_PACKAGES[canonicalTarget];

  return {
    requestedTarget: target,
    target: canonicalTarget,
    harnessInstaller: "agent-mux",
    ...(installPlugin && installerPackage ? {
      pluginInstall: {
        installerPackage,
        scope,
      },
    } : {}),
  };
}

export function buildAgentInstallPlan(config: CloudConfig): AgentInstallPlan | undefined {
  if (!config.agents || !config.agents.install) {
    return undefined;
  }

  const scope = config.agents.scope ?? "workspace";
  const steps = config.agents.targets.map((target) => buildStep(target, config.agents?.installBabysitterPlugins === true, scope));
  return {
    enabled: true,
    scope,
    supportedTargets: SUPPORTED_AGENT_INSTALL_TARGETS,
    steps,
    summary: steps.map((step) => `install ${step.target}${step.pluginInstall ? ` + babysitter plugin (${step.pluginInstall.scope})` : ""}`),
  };
}

function runJsonCli(
  command: string,
  args: readonly string[],
  options: { readonly cwd?: string },
): Promise<HarnessInstallOperationResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer | string) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code: number | null) => {
      const exitCode = code ?? 1;
      try {
        const payload = JSON.parse(stdout) as HarnessInstallOperationResult;
        resolve({
          ...payload,
          exitCode: payload.exitCode ?? exitCode,
          output: payload.output ?? (stderr.trim() || undefined),
        });
      } catch {
        resolve({
          harness: args[args.length - 1] ?? command,
          success: exitCode === 0,
          status: exitCode === 0 ? "installed" : "failed",
          command,
          output: stdout.trim() || undefined,
          error: stderr.trim() || undefined,
          exitCode,
        });
      }
    });
  });
}

function commandForInstall(
  target: CanonicalHarnessTarget,
  execute: boolean,
  scope: "global" | "workspace",
  cwd?: string,
): readonly string[] {
  return [
    "harness:install",
    target,
    "--json",
    ...(execute ? [] : ["--dry-run"]),
    ...(scope === "workspace" && cwd ? ["--workspace", cwd] : []),
  ];
}

function commandForPluginInstall(
  target: CanonicalHarnessTarget,
  execute: boolean,
  scope: "global" | "workspace",
  cwd?: string,
): readonly string[] {
  return [
    "harness:install-plugin",
    target,
    "--json",
    ...(execute ? [] : ["--dry-run"]),
    ...(scope === "workspace" && cwd ? ["--workspace", cwd] : []),
  ];
}

export async function installAgents(
  config: CloudConfig,
  options: { readonly cwd?: string; readonly execute?: boolean } = {},
): Promise<AgentInstallResult> {
  const plan = buildAgentInstallPlan(config);
  if (!plan) {
    return {
      executed: options.execute === true,
      success: true,
      scope: config.agents?.scope ?? "workspace",
      steps: [],
      summary: [],
    };
  }

  const steps: Array<AgentInstallResult["steps"][number]> = [];
  const execute = options.execute === true;

  for (const step of plan.steps) {
    const harness = await runJsonCli("babysitter", commandForInstall(step.target, execute, plan.scope, options.cwd), { cwd: options.cwd });
    const plugin = step.pluginInstall
      ? await runJsonCli("babysitter", commandForPluginInstall(step.target, execute, step.pluginInstall.scope, options.cwd), { cwd: options.cwd })
      : undefined;
    steps.push({
      requestedTarget: step.requestedTarget,
      target: step.target,
      harness,
      ...(plugin ? { plugin } : {}),
      success: harness.success !== false && plugin?.success !== false,
    });
  }

  return {
    executed: execute,
    success: steps.every((step) => step.success),
    scope: plan.scope,
    steps,
    summary: steps.flatMap((step) => {
      const lines = [step.harness.summary ?? `install ${step.target}`];
      if (step.plugin?.summary) {
        lines.push(step.plugin.summary);
      }
      return lines;
    }),
  };
}
