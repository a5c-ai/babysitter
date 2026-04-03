/**
 * Oh-My-Pi harness adapter.
 *
 * Oh-my-pi (omp) is a fork of pi that shares the same environment variables,
 * session conventions, and hook mechanisms. This adapter wraps the pi adapter
 * with a different name so the registry can distinguish between the two when
 * both are installed.
 */

import { existsSync } from "node:fs";
import * as path from "node:path";
import { createPiAdapter, getPiFamilyPluginInstallRoot } from "./pi";
import type {
  HarnessAdapter,
  HarnessInstallOptions,
  HarnessInstallResult,
} from "./types";
import { installCliViaNpm, runPackageBinaryViaNpx } from "./installSupport";

async function installOhMyPiPlugin(
  options: HarnessInstallOptions,
): Promise<HarnessInstallResult> {
  const targetDir = getPiFamilyPluginInstallRoot({
    harness: "oh-my-pi",
    workspace: options.workspace,
  });
  if (existsSync(targetDir)) {
    return {
      harness: "oh-my-pi",
      warning: "The Babysitter oh-my-pi plugin is already installed at the target location; skipping reinstall.",
      location: targetDir,
    };
  }

  const packageArgs = ["install"];
  if (options.workspace) {
    packageArgs.push("--workspace", path.resolve(options.workspace));
  } else {
    packageArgs.push("--global");
  }

  return runPackageBinaryViaNpx({
    harness: "oh-my-pi",
    packageName: "@a5c-ai/babysitter-omp",
    packageArgs,
    summary: options.workspace
      ? "Install the published Babysitter oh-my-pi plugin into the target workspace."
      : "Install the published Babysitter oh-my-pi plugin into the user-level oh-my-pi plugin directory.",
    options,
    env: process.env,
    location: targetDir,
  });
}

/**
 * Create an adapter for oh-my-pi.
 *
 * Reuses the pi adapter's implementation entirely — same env vars, same
 * session binding, same hook handling — but reports `name: "oh-my-pi"`.
 */
export function createOhMyPiAdapter(): HarnessAdapter {
  const piAdapter = createPiAdapter();

  return {
    ...piAdapter,
    name: "oh-my-pi",

    isActive(): boolean {
      // oh-my-pi shares OMP_* env vars with pi, but we only claim active
      // if OMP_PLUGIN_ROOT or OMP_SESSION_ID is set (not PI_* variants).
      // BABYSITTER_SESSION_ID is cross-harness and accepted everywhere.
      return !!(process.env.BABYSITTER_SESSION_ID || process.env.OMP_SESSION_ID || process.env.OMP_PLUGIN_ROOT);
    },

    installHarness(options: HarnessInstallOptions): Promise<HarnessInstallResult> {
      return installCliViaNpm({
        harness: "oh-my-pi",
        cliCommand: "omp",
        packageName: "@oh-my-pi/pi-coding-agent",
        summary: "Install the oh-my-pi CLI globally via npm.",
        options,
      });
    },

    installPlugin(options: HarnessInstallOptions): Promise<HarnessInstallResult> {
      return installOhMyPiPlugin(options);
    },
  };
}
