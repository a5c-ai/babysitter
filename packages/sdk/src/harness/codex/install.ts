import * as path from "node:path";
import type {
  HarnessInstallOptions,
  HarnessInstallResult,
} from "../types";
import {
  getInstalledCodexSkillDir,
  installCliViaNpm,
  isCodexPluginInstalled,
  runPackageBinaryViaNpx,
} from "../installSupport";

async function runCodexWorkspaceOnboarding(
  options: HarnessInstallOptions,
): Promise<HarnessInstallResult> {
  const workspace = path.resolve(options.workspace ?? process.cwd());
  return runPackageBinaryViaNpx({
    harness: "codex",
    packageName: "@a5c-ai/babysitter-codex",
    packageArgs: ["install", "--workspace", workspace],
    summary:
      "Run the published Babysitter Codex workspace installer for the target repo.",
    options,
    cwd: workspace,
    env: process.env,
    location: workspace,
  });
}

export async function installCodexHarness(
  options: HarnessInstallOptions,
): Promise<HarnessInstallResult> {
  return installCliViaNpm({
    harness: "codex",
    cliCommand: "codex",
    packageName: "@openai/codex@latest",
    summary: "Install the Codex CLI globally via npm.",
    options,
  });
}

export async function installCodexPlugin(
  options: HarnessInstallOptions,
): Promise<HarnessInstallResult> {
  const installedSkillDir = getInstalledCodexSkillDir();
  if (isCodexPluginInstalled()) {
    if (options.workspace) {
      return runCodexWorkspaceOnboarding(options);
    }
    return {
      harness: "codex",
      warning:
        "babysit is already installed in CODEX_HOME; skipping reinstall.",
      location: installedSkillDir,
    };
  }

  const globalInstall = await runPackageBinaryViaNpx({
    harness: "codex",
    packageName: "@a5c-ai/babysitter-codex",
    packageArgs: ["install", "--global"],
    summary:
      "Install the published Babysitter Codex package and materialize the global Codex skill/hooks/config.",
    options,
    env: process.env,
    location: installedSkillDir,
  });

  if (options.workspace) {
    const onboarding = await runCodexWorkspaceOnboarding({
      ...options,
      dryRun: false,
    });
    return {
      harness: "codex",
      summary:
        "Ran the published Babysitter Codex installer for global Codex setup and then the published workspace installer for the target repo.",
      location: onboarding.location ?? installedSkillDir,
      output: [globalInstall.output?.trim() ?? "", onboarding.output?.trim() ?? ""]
        .filter(Boolean)
        .join("\n"),
    };
  }

  return {
    harness: "codex",
    summary:
      "Ran the published Babysitter Codex installer for global Codex skill/hooks/config and the global process-library binding.",
    location: globalInstall.location ?? installedSkillDir,
    output: globalInstall.output,
  };
}
