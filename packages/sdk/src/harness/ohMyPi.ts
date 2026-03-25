/**
 * Oh-My-Pi harness adapter.
 *
 * Oh-my-pi (omp) is a fork of pi that shares the same environment variables,
 * session conventions, and hook mechanisms. This adapter wraps the pi adapter
 * with a different name so the registry can distinguish between the two when
 * both are installed.
 */

import { createPiAdapter, installPiFamilyPlugin } from "./pi";
import type {
  HarnessAdapter,
  HarnessInstallOptions,
  HarnessInstallResult,
} from "./types";
import { installCliViaNpm } from "./installSupport";

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
      // if OMP_PLUGIN_ROOT or OMP_SESSION_ID is set (not PI_* variants)
      return !!(process.env.OMP_SESSION_ID || process.env.OMP_PLUGIN_ROOT);
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
      return installPiFamilyPlugin({
        harness: "oh-my-pi",
        options,
      });
    },
  };
}
