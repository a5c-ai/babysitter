/**
 * GAP-REMOTE-001: CLI commands for daemon lifecycle management.
 *
 * daemon:start — Start the background daemon
 * daemon:stop — Stop the running daemon
 * daemon:status — Check daemon status
 */

import { startDaemon, stopDaemon, getDaemonStatus, loadDaemonConfig, runDaemonLoop } from "../../daemon";
import * as path from "node:path";
import * as os from "node:os";
import { executeAutomationTrigger } from "../../daemon/automationExecutor";
import { isAutomationTriggerEvent } from "../../daemon/types";

function defaultDaemonDir(): string {
  return path.join(os.homedir(), ".a5c", "daemon");
}

export async function handleDaemonStart(args: {
  daemonDir?: string;
  workspace?: string;
  configPath?: string;
  foreground?: boolean;
  json?: boolean;
}): Promise<number> {
  const daemonDir = args.daemonDir ?? defaultDaemonDir();
  const workspace = args.workspace ?? process.cwd();

  let config;
  if (args.configPath) {
    const configResult = await loadDaemonConfig(args.configPath);
    if (!configResult.ok) {
      const output = args.json
        ? JSON.stringify(configResult)
        : `Error: ${configResult.error.message}`;
      process.stdout.write(output + "\n");
      return 1;
    }
    config = configResult.data;
  }

  const result = await startDaemon({
    daemonDir,
    workspace,
    foreground: args.foreground ?? false,
    config: config ?? { workspace, triggers: [] },
  });

  if (args.json) {
    process.stdout.write(JSON.stringify(result) + "\n");
  } else if (result.ok) {
    process.stdout.write(`Daemon started (PID ${result.data.pid})\n`);
  } else {
    process.stdout.write(`Error: ${result.error.message}\n`);
  }

  return result.ok ? 0 : 1;
}

export async function handleDaemonStop(args: {
  daemonDir?: string;
  gracePeriodMs?: number;
  json?: boolean;
}): Promise<number> {
  const daemonDir = args.daemonDir ?? defaultDaemonDir();

  const result = await stopDaemon({
    daemonDir,
    gracePeriodMs: args.gracePeriodMs,
  });

  if (args.json) {
    process.stdout.write(JSON.stringify(result) + "\n");
  } else if (result.ok) {
    process.stdout.write(`Daemon stopped (PID ${result.data.pid})\n`);
  } else {
    process.stdout.write(`Error: ${result.error.message}\n`);
  }

  return result.ok ? 0 : 1;
}

export async function handleDaemonStatus(args: {
  daemonDir?: string;
  json?: boolean;
}): Promise<number> {
  const daemonDir = args.daemonDir ?? defaultDaemonDir();

  const result = await getDaemonStatus({ daemonDir });

  if (args.json) {
    process.stdout.write(JSON.stringify(result) + "\n");
  } else if (result.ok) {
    if (result.data.running) {
      process.stdout.write(
        `Daemon running (PID ${result.data.pid}, uptime ${result.data.uptime}s, ` +
        `triggers: ${result.data.activeTriggers}, pending: ${result.data.pendingRuns})\n`,
      );
    } else {
      process.stdout.write("Daemon not running\n");
    }
  } else {
    process.stdout.write(`Error: ${result.error.message}\n`);
  }

  return result.ok ? 0 : 1;
}

/**
 * daemon:run — Internal command invoked by the background daemon process.
 * Loads config from daemon.json and runs the daemon loop until SIGTERM.
 */
export async function handleDaemonRun(args: {
  daemonDir?: string;
}): Promise<number> {
  const daemonDir = args.daemonDir ?? defaultDaemonDir();
  const metadataPath = path.join(daemonDir, "daemon.json");

  let config: import("../../daemon").DaemonConfig;
  try {
    const { promises: fsPromises } = await import("node:fs");
    const raw = await fsPromises.readFile(metadataPath, "utf-8");
    const parsed = JSON.parse(raw) as import("../../daemon").DaemonConfig;
    config = parsed;
  } catch {
    process.stderr.write(`daemon:run — failed to read ${metadataPath}\n`);
    return 1;
  }

  const ac = new AbortController();
  process.on("SIGTERM", () => ac.abort());
  process.on("SIGINT", () => ac.abort());

  await runDaemonLoop(config, {
    signal: ac.signal,
    logDir: daemonDir,
    onTrigger: async (trigger) => {
      if (!isAutomationTriggerEvent(trigger)) {
        return;
      }
      await executeAutomationTrigger(trigger);
    },
  });

  return 0;
}
