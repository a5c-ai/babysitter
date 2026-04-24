import { spawn } from "node:child_process";

import type {
  AgentInstallPlan,
  AgentInstallStep,
  CloudConfig,
  CommandExecution,
  HarnessTarget,
} from "../types.js";

function pluginCommandForTarget(target: HarnessTarget): string {
  return `babysitter harness:install-plugin ${target}`;
}

function buildStep(target: HarnessTarget, installPlugin: boolean): AgentInstallStep {
  return {
    target,
    command: `amux install ${target}`,
    ...(installPlugin ? { pluginCommand: pluginCommandForTarget(target) } : {}),
  };
}

export function buildAgentInstallPlan(config: CloudConfig): AgentInstallPlan | undefined {
  if (!config.agents || !config.agents.install) {
    return undefined;
  }

  const steps = config.agents.targets.map((target) => buildStep(target, config.agents?.installBabysitterPlugins === true));
  return {
    enabled: true,
    steps,
    summary: steps.map((step) => `install ${step.target}${step.pluginCommand ? " + babysitter plugin" : ""}`),
  };
}

function runShellCommand(command: string, cwd?: string): Promise<CommandExecution> {
  return new Promise((resolve, reject) => {
    const child = spawn("bash", ["-lc", command], {
      cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: ChunkLike | string) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: ChunkLike | string) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code: number | null) => {
      resolve({
        command: "bash",
        args: ["-lc", command],
        ...(cwd ? { cwd } : {}),
        exitCode: code ?? 1,
        stdout,
        stderr,
      });
    });
  });
}

export async function installAgents(
  config: CloudConfig,
  options: { readonly cwd?: string; readonly execute?: boolean } = {},
): Promise<readonly CommandExecution[]> {
  const plan = buildAgentInstallPlan(config);
  if (!plan || plan.steps.length === 0) {
    return [];
  }
  if (options.execute === false) {
    return plan.steps.flatMap((step) => [
      {
        command: "bash",
        args: ["-lc", step.command],
        ...(options.cwd ? { cwd: options.cwd } : {}),
        exitCode: 0,
        stdout: "",
        stderr: "",
      },
      ...(step.pluginCommand ? [{
        command: "bash",
        args: ["-lc", step.pluginCommand],
        ...(options.cwd ? { cwd: options.cwd } : {}),
        exitCode: 0,
        stdout: "",
        stderr: "",
      }] : []),
    ]);
  }

  const executions: CommandExecution[] = [];
  for (const step of plan.steps) {
    executions.push(await runShellCommand(step.command, options.cwd));
    if (step.pluginCommand) {
      executions.push(await runShellCommand(step.pluginCommand, options.cwd));
    }
  }
  return executions;
}
