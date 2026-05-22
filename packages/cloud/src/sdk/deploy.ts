import * as fs from "node:fs/promises";
import * as path from "node:path";
import { spawn } from "node:child_process";

import type {
  CloudConfig,
  CommandExecution,
  DeploymentPlan,
  EnvironmentStatus,
  InstallOptions,
  InstallResult,
  StatusResource,
} from "../types.js";
import { renderHelmValuesYaml } from "../helm/krate-values.js";
import { renderKubernetes } from "../kubernetes/render.js";
import { renderTerraform } from "../terraform/root.js";
import { buildDeploymentPlan } from "./plans.js";
import { installAgents } from "./agents.js";
import { applyProviderConfiguration } from "./providers.js";

function execCommand(
  command: string,
  args: readonly string[],
  options: { readonly cwd?: string } = {},
): Promise<CommandExecution> {
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
      resolve({
        command,
        args,
        ...(options.cwd ? { cwd: options.cwd } : {}),
        exitCode: code ?? 1,
        stdout,
        stderr,
      });
    });
  });
}

async function commandExists(command: string): Promise<boolean> {
  const result = await execCommand("bash", ["-lc", `command -v ${command}`]);
  return result.exitCode === 0;
}

async function ensureDirectory(directory: string): Promise<void> {
  await fs.mkdir(directory, { recursive: true });
}

async function writeFiles(directory: string, files: ReadonlyArray<{ readonly path: string; readonly content: string }>): Promise<void> {
  await ensureDirectory(directory);
  await Promise.all(files.map(async (file) => {
    const filePath = path.join(directory, file.path);
    await ensureDirectory(path.dirname(filePath));
    await fs.writeFile(filePath, file.content, "utf8");
  }));
}

function workingDirectoryFor(config: CloudConfig, requestedDirectory?: string): string {
  return path.resolve(requestedDirectory ?? config.execution?.stateDir ?? ".cloud", config.environment);
}

async function applyTerraform(plan: DeploymentPlan, terraformDirectory: string): Promise<readonly CommandExecution[]> {
  if (!(await commandExists("terraform"))) {
    throw new Error("terraform is not installed or not available on PATH.");
  }
  const executions: CommandExecution[] = [];
  executions.push(await execCommand("terraform", ["init", "-input=false"], { cwd: terraformDirectory }));
  executions.push(await execCommand("terraform", ["apply", "-auto-approve", "-input=false"], { cwd: terraformDirectory }));
  return executions;
}

async function applyHelm(plan: DeploymentPlan, valuesPath: string): Promise<readonly CommandExecution[]> {
  if (!(await commandExists("helm"))) {
    throw new Error("helm is not installed or not available on PATH.");
  }
  const args = [
    "upgrade", "--install",
    plan.helm.releaseName,
    plan.helm.chartPath,
    "-n", plan.helm.namespace,
    "-f", valuesPath,
    "--create-namespace",
  ];
  return [await execCommand("helm", args)];
}

function parseResources(payload: string): readonly StatusResource[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload) as unknown;
  } catch {
    return [];
  }
  if (typeof parsed !== "object" || parsed === null || !("items" in parsed) || !Array.isArray((parsed as { items?: unknown }).items)) {
    return [];
  }
  return ((parsed as { items: unknown[] }).items).flatMap((item) => {
    if (typeof item !== "object" || item === null) return [];
    const entry = item as Record<string, unknown>;
    const metadata = entry.metadata as Record<string, unknown> | undefined;
    const kind = typeof entry.kind === "string" ? entry.kind : "Unknown";
    const name = typeof metadata?.name === "string" ? metadata.name : "unknown";
    const namespace = typeof metadata?.namespace === "string" ? metadata.namespace : "default";
    const status = typeof (entry.status as Record<string, unknown> | undefined)?.phase === "string"
      ? String((entry.status as Record<string, unknown>).phase)
      : undefined;
    const ready = (() => {
      const entryStatus = entry.status as Record<string, unknown> | undefined;
      const readyReplicas = typeof entryStatus?.readyReplicas === "number" ? entryStatus.readyReplicas : undefined;
      const replicas = typeof entryStatus?.replicas === "number" ? entryStatus.replicas : undefined;
      return readyReplicas !== undefined || replicas !== undefined ? `${readyReplicas ?? 0}/${replicas ?? 0}` : undefined;
    })();
    return [{
      kind,
      name,
      namespace,
      ...(ready ? { ready } : {}),
      ...(status ? { status } : {}),
    }];
  });
}

export async function getEnvironmentStatus(config: CloudConfig): Promise<EnvironmentStatus> {
  const commands = [
    `kubectl get deploy,svc,ingress,pvc -n ${config.namespace} -o json`,
  ];
  if (!(await commandExists("kubectl"))) {
    return {
      namespace: config.namespace,
      resources: [],
      commands,
    };
  }

  const args = ["get", "deploy,svc,ingress,pvc", "-n", config.namespace, "-o", "json"];
  if (config.target.type === "existing") {
    args.push("--context", config.target.kubeContext);
  }
  const result = await execCommand("kubectl", args);
  return {
    namespace: config.namespace,
    resources: parseResources(result.stdout),
    commands,
  };
}

export async function installEnvironment(config: CloudConfig, options: InstallOptions = {}): Promise<InstallResult> {
  const plan = buildDeploymentPlan(config);
  const terraform = renderTerraform(plan);
  const kubernetes = renderKubernetes(plan);
  const rootDir = workingDirectoryFor(config, options.workingDirectory);
  const terraformDirectory = path.join(rootDir, terraform.directoryName);
  const kubernetesDirectory = path.join(rootDir, "kubernetes");
  const valuesPath = path.join(rootDir, "krate-values.yaml");

  await writeFiles(terraformDirectory, terraform.files);
  await writeFiles(kubernetesDirectory, [{ path: kubernetes.fileName, content: kubernetes.content }]);

  // Write helm values YAML
  const helmValuesContent = renderHelmValuesYaml(plan.helm);
  await ensureDirectory(path.dirname(valuesPath));
  await fs.writeFile(valuesPath, helmValuesContent, "utf8");

  if (options.dryRun || options.renderOnly) {
    return {
      plan,
      terraform,
      kubernetes,
    };
  }

  const terraformApply = config.execution?.autoApplyTerraform === false ? [] : await applyTerraform(plan, terraformDirectory);
  const kubernetesApply = config.execution?.autoApplyKubernetes === false ? [] : await applyHelm(plan, valuesPath);
  const providerConfiguration = config.execution?.configureProvidersOnApply
    ? applyProviderConfiguration(config, { cwd: rootDir })
    : undefined;
  const agentInstalls = config.agents?.install && config.execution?.installAgentsOnApply
    ? await installAgents(config, { cwd: rootDir, execute: true })
    : undefined;
  const status = await getEnvironmentStatus(config);

  return {
    plan,
    terraform,
    kubernetes,
    ...(terraformApply.length > 0 ? { terraformApply } : {}),
    ...(kubernetesApply.length > 0 ? { kubernetesApply } : {}),
    ...(providerConfiguration ? { providerConfiguration } : {}),
    ...(agentInstalls ? { agentInstalls } : {}),
    status,
  };
}
