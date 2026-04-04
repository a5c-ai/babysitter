/**
 * Harness plugin installer for the Paperclip babysitter integration.
 *
 * When the Paperclip plugin detects an underlying harness (e.g., claude_local),
 * it needs the corresponding babysitter harness plugin installed for that
 * harness to handle the stop-hook iteration loop and breakpoint presentation.
 *
 * This module checks whether the babysitter plugin is installed for a given
 * harness and provides installation commands.
 *
 * The underlying harness plugin is what actually drives the orchestration loop:
 *   - Claude Code: stop-hook pauses between iterations, allows exit when only
 *     breakpoints are pending (user must approve externally)
 *   - OpenClaw: agent_end hook fires async iteration, before_prompt_build
 *     injects context
 *
 * The Paperclip plugin SUPPLEMENTS this by:
 *   - Monitoring run state for pending breakpoints via run:status / task:list
 *   - Surfacing breakpoints in the Paperclip dashboard UI
 *   - Allowing approve/reject through Paperclip action handlers
 *   - Posting results via task:post, which the underlying harness picks up
 *     on next iteration
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);

/** Maps babysitter harness names to their plugin install commands. */
const HARNESS_INSTALL_COMMANDS: Record<string, { check: string[]; install: string[] }> = {
  "claude-code": {
    check: ["babysitter", "harness:discover", "--json"],
    install: ["babysitter", "harness:install-plugin", "claude-code"],
  },
  codex: {
    check: ["babysitter", "harness:discover", "--json"],
    install: ["babysitter", "harness:install-plugin", "codex"],
  },
  openclaw: {
    check: ["babysitter", "harness:discover", "--json"],
    install: ["babysitter", "harness:install-plugin", "openclaw"],
  },
  "gemini-cli": {
    check: ["babysitter", "harness:discover", "--json"],
    install: ["babysitter", "harness:install-plugin", "gemini-cli"],
  },
  cursor: {
    check: ["babysitter", "harness:discover", "--json"],
    install: ["babysitter", "harness:install-plugin", "cursor"],
  },
  "github-copilot": {
    check: ["babysitter", "harness:discover", "--json"],
    install: ["babysitter", "harness:install-plugin", "github-copilot"],
  },
};

/** Marketplace name for the a5c.ai babysitter plugins. */
const MARKETPLACE_NAME = "a5c.ai";
const MARKETPLACE_URL = "https://github.com/a5c-ai/babysitter.git";

export interface HarnessPluginStatus {
  harnessName: string;
  cliAvailable: boolean;
  pluginInstalled: boolean;
  installCommand?: string;
}

/**
 * Check if the babysitter CLI is available.
 */
export async function isBabysitterCliAvailable(): Promise<boolean> {
  try {
    await exec("babysitter", ["--version"], { timeout: 10_000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a harness CLI is available and the babysitter plugin is installed.
 */
export async function checkHarnessPluginStatus(
  harnessName: string
): Promise<HarnessPluginStatus> {
  const result: HarnessPluginStatus = {
    harnessName,
    cliAvailable: false,
    pluginInstalled: false,
  };

  // Check if babysitter CLI is available
  if (!(await isBabysitterCliAvailable())) {
    result.installCommand = "npm install -g @a5c-ai/babysitter-sdk";
    return result;
  }

  result.cliAvailable = true;

  // Check harness discovery to see if the harness CLI is available
  try {
    const { stdout } = await exec("babysitter", ["harness:discover", "--json"], {
      timeout: 15_000,
    });
    const discovery = JSON.parse(stdout) as Array<{
      name: string;
      available: boolean;
      pluginInstalled?: boolean;
    }>;

    const harness = discovery.find(
      (h) => h.name === harnessName || h.name === harnessName.replace("-", "_")
    );

    if (harness) {
      result.cliAvailable = harness.available;
      result.pluginInstalled = harness.pluginInstalled ?? false;
    }
  } catch {
    // Discovery failed - assume not installed
  }

  if (!result.pluginInstalled) {
    const cmd = HARNESS_INSTALL_COMMANDS[harnessName];
    result.installCommand = cmd
      ? cmd.install.join(" ")
      : `babysitter harness:install-plugin ${harnessName}`;
  }

  return result;
}

/**
 * Attempt to install the babysitter plugin for a given harness.
 * Returns success/failure and any output.
 */
export async function installHarnessPlugin(
  harnessName: string
): Promise<{ success: boolean; output: string }> {
  const cmd = HARNESS_INSTALL_COMMANDS[harnessName];
  if (!cmd) {
    return {
      success: false,
      output: `No install command known for harness: ${harnessName}`,
    };
  }

  try {
    // First ensure marketplace is added
    try {
      await exec("babysitter", [
        "plugin:add-marketplace",
        "--marketplace-url", MARKETPLACE_URL,
        "--global",
      ], { timeout: 30_000 });
    } catch {
      // Marketplace may already exist - continue
    }

    // Install the plugin
    const [binary, ...args] = cmd.install;
    const { stdout, stderr } = await exec(binary, args, { timeout: 60_000 });
    return { success: true, output: stdout || stderr || "Installed successfully" };
  } catch (err) {
    return {
      success: false,
      output: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Ensure the babysitter SDK CLI is installed.
 * Attempts npm global install, falls back to providing npx instructions.
 */
export async function ensureBabysitterCli(): Promise<{
  available: boolean;
  method: "global" | "npx" | "missing";
}> {
  if (await isBabysitterCliAvailable()) {
    return { available: true, method: "global" };
  }

  // Try installing globally
  try {
    await exec("npm", ["install", "-g", "@a5c-ai/babysitter-sdk"], {
      timeout: 60_000,
    });
    return { available: true, method: "global" };
  } catch {
    // Check npx fallback
    try {
      await exec("npx", ["-y", "@a5c-ai/babysitter-sdk", "--version"], {
        timeout: 30_000,
      });
      return { available: true, method: "npx" };
    } catch {
      return { available: false, method: "missing" };
    }
  }
}
