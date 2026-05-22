#!/usr/bin/env node

import * as fs from "node:fs/promises";
import * as path from "node:path";

import {
  applyProviderConfiguration,
  bootstrapAuth,
  buildAgentInstallPlan,
  buildDeploymentPlan,
  configureProviders,
  getEnvironmentStatus,
  installAgents,
  installEnvironment,
  loadCloudConfig,
  renderKubernetes,
  renderTerraform,
  upgradeEnvironment,
  validateCloudConfig,
} from "./index.js";
import type {
  AgentInstallPlan,
  AgentInstallResult,
  CloudConfig,
  CommandExecution,
  DeploymentEnvironment,
  InstallOptions,
} from "./types.js";

interface ParsedCli {
  readonly command: readonly string[];
  readonly flags: Readonly<Record<string, string[]>>;
}

interface CliIo {
  readonly cwd: string;
  stdout(message: string): void;
  stderr(message: string): void;
}

function createDefaultIo(): CliIo {
  return {
    cwd: process.cwd(),
    stdout(message: string) {
      process.stdout.write(message);
    },
    stderr(message: string) {
      process.stderr.write(message);
    },
  };
}

function parseArgv(argv: readonly string[]): ParsedCli {
  const command: string[] = [];
  const flags = new Map<string, string[]>();

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      command.push(token);
      continue;
    }
    const name = token.slice(2);
    if (name.includes("=")) {
      const [key, value] = name.split("=", 2);
      flags.set(key, [...(flags.get(key) ?? []), value]);
      continue;
    }
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      flags.set(name, [...(flags.get(name) ?? []), "true"]);
      continue;
    }
    flags.set(name, [...(flags.get(name) ?? []), next]);
    index += 1;
  }

  return {
    command,
    flags: Object.fromEntries(flags.entries()),
  };
}

function flag(parsed: ParsedCli, name: string): string | undefined {
  return parsed.flags[name]?.[parsed.flags[name].length - 1];
}

function flagAll(parsed: ParsedCli, name: string): readonly string[] {
  return parsed.flags[name] ?? [];
}

function flagBool(parsed: ParsedCli, name: string): boolean {
  const value = flag(parsed, name);
  return value === "true";
}

function usage(): string {
  return [
    "cloud - deployment CLI for Babysitter Kubernetes environments",
    "",
    "Usage:",
    "  cloud init [--env <minikube|staging|prod|custom>] [--output <path>]",
    "  cloud plan [--config <path>] [--env <env>] [--set key=value]",
    "  cloud render terraform [--config <path>] [--env <env>] [--output-dir <path>]",
    "  cloud render kubernetes [--config <path>] [--env <env>] [--output <path>]",
    "  cloud install [--config <path>] [--env <env>] [--dry-run] [--render-only]",
    "  cloud upgrade [--config <path>] [--env <env>] [--dry-run] [--render-only]",
    "  cloud status [--config <path>] [--env <env>]",
    "  cloud auth bootstrap [--config <path>] [--env <env>]",
    "  cloud providers configure [--config <path>] [--env <env>] [--execute] [--scope <project|global>]",
    "  cloud agents install [--config <path>] [--env <env>] [--execute]",
    "  cloud cluster create [--config <path>] [--env <env>] [--dry-run]",
    "  cloud cluster destroy [--config <path>] [--env <env>]",
    "",
    "Flags:",
    "  --config <path>      Load config from JSON or YAML file",
    "  --env <name>         Environment preset",
    "  --set key=value      Override config values; may be repeated",
    "  --output <path>      Write single rendered output file",
    "  --output-dir <path>  Write rendered files into a directory",
    "  --dry-run            Render without applying",
    "  --render-only        Render files only",
    "  --execute            Execute agent install commands",
    "  --scope <name>       Provider config scope: project or global",
    "  --json               Emit JSON",
  ].join("\n");
}

async function resolvedConfig(parsed: ParsedCli): Promise<CloudConfig> {
  const environment = flag(parsed, "env") as DeploymentEnvironment | undefined;
  return await loadCloudConfig({
    ...(flag(parsed, "config") ? { configPath: flag(parsed, "config") } : {}),
    ...(environment ? { environment } : {}),
    ...(flagAll(parsed, "set").length > 0 ? { set: flagAll(parsed, "set") } : {}),
  });
}

function printJson(io: CliIo, value: unknown): void {
  io.stdout(`${JSON.stringify(value, null, 2)}\n`);
}

function printExecutions(io: CliIo, executions: readonly CommandExecution[] | undefined): void {
  if (!executions || executions.length === 0) {
    return;
  }
  for (const execution of executions) {
    io.stdout(`$ ${execution.command} ${execution.args.join(" ")}\n`);
    if (execution.stdout) io.stdout(execution.stdout);
    if (execution.stderr) io.stderr(execution.stderr);
  }
}

function printAgentInstallResult(io: CliIo, result: AgentInstallPlan | AgentInstallResult | undefined): void {
  if (!result) {
    return;
  }

  if ("executed" in result) {
    for (const step of result.steps) {
      io.stdout(`${step.target}: ${step.harness.status ?? "unknown"}\n`);
      if (step.plugin) {
        io.stdout(`${step.target} plugin: ${step.plugin.status ?? "unknown"}\n`);
      }
    }
    return;
  }

  for (const step of result.steps) {
    io.stdout(`${step.target}: agent-mux`);
    if (step.pluginInstall) {
      io.stdout(` + plugin (${step.pluginInstall.scope})`);
    }
    io.stdout("\n");
  }
}

async function handleInit(parsed: ParsedCli, io: CliIo): Promise<number> {
  const config = await resolvedConfig(parsed);
  const outputPath = flag(parsed, "output");
  const rendered = JSON.stringify(config, null, 2);
  if (outputPath) {
    const filePath = path.resolve(io.cwd, outputPath);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, `${rendered}\n`, "utf8");
    io.stdout(`Wrote ${filePath}\n`);
    return 0;
  }
  io.stdout(`${rendered}\n`);
  return 0;
}

async function handlePlan(parsed: ParsedCli, io: CliIo): Promise<number> {
  const config = await resolvedConfig(parsed);
  const validation = validateCloudConfig(config);
  const plan = buildDeploymentPlan(config);
  if (flagBool(parsed, "json")) {
    printJson(io, { validation, plan });
    return validation.ok ? 0 : 1;
  }
  io.stdout(`Environment: ${config.environment}\n`);
  io.stdout(`Namespace: ${config.namespace}\n`);
  io.stdout(`Target: ${config.target.type}\n`);
  io.stdout(`Helm release: ${plan.helm.releaseName}\n`);
  for (const line of plan.helm.summary) {
    io.stdout(`  ${line}\n`);
  }
  if (!validation.ok) {
    for (const entry of validation.errors) {
      io.stderr(`error ${entry.path}: ${entry.message}\n`);
    }
  }
  for (const warning of validation.warnings) {
    io.stderr(`warning ${warning.path}: ${warning.message}\n`);
  }
  return validation.ok ? 0 : 1;
}

async function handleRender(parsed: ParsedCli, io: CliIo): Promise<number> {
  const config = await resolvedConfig(parsed);
  const plan = buildDeploymentPlan(config);
  const renderType = parsed.command[1];
  if (renderType === "terraform") {
    const rendered = renderTerraform(plan);
    const outputDir = flag(parsed, "output-dir");
    if (outputDir) {
      const directory = path.resolve(io.cwd, outputDir);
      await fs.mkdir(directory, { recursive: true });
      await Promise.all(rendered.files.map((file) => fs.writeFile(path.join(directory, file.path), file.content, "utf8")));
      io.stdout(`Wrote Terraform files to ${directory}\n`);
      return 0;
    }
    printJson(io, rendered);
    return 0;
  }
  if (renderType === "kubernetes") {
    const rendered = renderKubernetes(plan);
    const output = flag(parsed, "output");
    if (output) {
      const filePath = path.resolve(io.cwd, output);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, rendered.content, "utf8");
      io.stdout(`Wrote ${filePath}\n`);
      return 0;
    }
    io.stdout(`${rendered.content}\n`);
    return 0;
  }
  io.stderr("Unknown render target.\n");
  return 1;
}

async function handleInstallLike(parsed: ParsedCli, io: CliIo, mode: "install" | "upgrade"): Promise<number> {
  const config = await resolvedConfig(parsed);
  const options: InstallOptions = {
    dryRun: flagBool(parsed, "dry-run"),
    renderOnly: flagBool(parsed, "render-only"),
  };
  const result = mode === "install"
    ? await installEnvironment(config, options)
    : await upgradeEnvironment(config, options);
  if (flagBool(parsed, "json")) {
    printJson(io, result);
    return 0;
  }
  io.stdout(`${mode} complete for namespace ${result.plan.namespace}\n`);
  io.stdout(`Terraform files: ${result.terraform.files.length}\n`);
  io.stdout(`Kubernetes manifests: ${result.kubernetes.manifests.length}\n`);
  printExecutions(io, result.terraformApply);
  printExecutions(io, result.kubernetesApply);
  if (result.providerConfiguration) {
    io.stdout(`Provider config: ${result.providerConfiguration.filePath}\n`);
  }
  printAgentInstallResult(io, result.agentInstalls);
  return 0;
}

async function handleStatus(parsed: ParsedCli, io: CliIo): Promise<number> {
  const config = await resolvedConfig(parsed);
  const status = await getEnvironmentStatus(config);
  if (flagBool(parsed, "json")) {
    printJson(io, status);
    return 0;
  }
  io.stdout(`Namespace: ${status.namespace}\n`);
  if (status.resources.length === 0) {
    io.stdout("No live resources detected.\n");
  } else {
    for (const resource of status.resources) {
      io.stdout(`${resource.kind}/${resource.name} ${resource.ready ?? resource.status ?? ""}\n`);
    }
  }
  return 0;
}

async function handleAuth(parsed: ParsedCli, io: CliIo): Promise<number> {
  const config = await resolvedConfig(parsed);
  const auth = bootstrapAuth(config);
  printJson(io, auth);
  return 0;
}

async function handleProviders(parsed: ParsedCli, io: CliIo): Promise<number> {
  const config = await resolvedConfig(parsed);
  if (flagBool(parsed, "execute")) {
    const scope = flag(parsed, "scope");
    printJson(io, applyProviderConfiguration(config, {
      cwd: io.cwd,
      ...(scope === "project" || scope === "global" ? { scope } : {}),
    }));
    return 0;
  }
  printJson(io, configureProviders(config));
  return 0;
}

async function handleAgents(parsed: ParsedCli, io: CliIo): Promise<number> {
  const config = await resolvedConfig(parsed);
  if (flagBool(parsed, "execute")) {
    const executions = await installAgents(config, { cwd: io.cwd, execute: true });
    if (flagBool(parsed, "json")) {
      printJson(io, executions);
      return executions.success ? 0 : 1;
    }
    printAgentInstallResult(io, executions);
    return executions.success ? 0 : 1;
  }
  const plan = buildAgentInstallPlan(config);
  if (flagBool(parsed, "json")) {
    printJson(io, plan);
    return 0;
  }
  printAgentInstallResult(io, plan);
  return 0;
}

async function handleCluster(parsed: ParsedCli, io: CliIo): Promise<number> {
  if (parsed.command[1] === "create") {
    return await handleInstallLike(parsed, io, "install");
  }
  if (parsed.command[1] === "destroy") {
    io.stderr("Cluster destroy is not implemented yet; use the rendered Terraform files directly.\n");
    return 1;
  }
  io.stderr("Unknown cluster subcommand.\n");
  return 1;
}

export async function runCli(argv: readonly string[] = process.argv.slice(2), io: CliIo = createDefaultIo()): Promise<number> {
  const parsed = parseArgv(argv);
  if (parsed.command.length === 0 || flagBool(parsed, "help")) {
    io.stdout(`${usage()}\n`);
    return 0;
  }

  const [first, second] = parsed.command;
  switch (first) {
    case "init":
      return await handleInit(parsed, io);
    case "plan":
      return await handlePlan(parsed, io);
    case "render":
      return await handleRender(parsed, io);
    case "install":
      return await handleInstallLike(parsed, io, "install");
    case "upgrade":
      return await handleInstallLike(parsed, io, "upgrade");
    case "status":
      return await handleStatus(parsed, io);
    case "auth":
      if (second === "bootstrap") return await handleAuth(parsed, io);
      break;
    case "providers":
      if (second === "configure") return await handleProviders(parsed, io);
      break;
    case "agents":
      if (second === "install") return await handleAgents(parsed, io);
      break;
    case "cluster":
      return await handleCluster(parsed, io);
    default:
      break;
  }

  io.stderr("Unknown command.\n");
  io.stdout(`${usage()}\n`);
  return 1;
}

const executedDirectly = (() => {
  const entry = process.argv[1];
  if (!entry) return false;
  return entry.endsWith("/cloud") || entry.endsWith("/cloud.js") || entry.endsWith("\\cloud") || entry.endsWith("\\cloud.js");
})();

if (executedDirectly) {
  void runCli().then((exitCode) => {
    process.exitCode = exitCode;
  });
}
