import { execSync, ExecSyncOptions } from "child_process";
import { readFileSync } from "fs";
import path from "path";

export const IMAGE = "babysitter-e2e:test";
export const CONTAINER = "babysitter-e2e-container";

// Read plugin version from plugin.json (single source of truth)
const pluginJsonPath = path.resolve(__dirname, "../../plugins/babysitter/plugin.json");
const PLUGIN_VERSION = JSON.parse(readFileSync(pluginJsonPath, "utf-8")).version as string;
export const PLUGIN_DIR =
  `/home/claude/.claude/plugins/cache/a5c-ai/babysitter/${PLUGIN_VERSION}`;

const DEFAULT_OPTS: ExecSyncOptions = {
  encoding: "utf-8" as BufferEncoding,
  timeout: 30_000,
  stdio: ["pipe", "pipe", "pipe"],
  env: { ...process.env, MSYS_NO_PATHCONV: "1" },
};

/** Run a command on the host and return stdout. Throws on non-zero exit. */
export function exec(cmd: string, opts?: ExecSyncOptions): string {
  return execSync(cmd, { ...DEFAULT_OPTS, ...opts }) as unknown as string;
}

/**
 * Run a command inside the running E2E container.
 * Pipes the command via stdin to avoid shell quoting issues across platforms.
 */
export function dockerExec(cmd: string, opts?: ExecSyncOptions): string {
  return exec(`docker exec -i ${CONTAINER} bash`, {
    ...opts,
    input: cmd + "\n",
  });
}

/**
 * Run a command inside the container, prepending custom stdin after the command.
 * The command reads from a heredoc, and the provided stdin is fed separately.
 */
export function dockerExecStdin(
  cmd: string,
  stdin: string,
  opts?: ExecSyncOptions,
): string {
  // Wrap the command so it reads the provided stdin
  const script = `${cmd} <<'__HOOK_INPUT__'\n${stdin}\n__HOOK_INPUT__\n`;
  return exec(`docker exec -i ${CONTAINER} bash`, {
    ...opts,
    input: script,
  });
}

/** Run a command inside the container, return {stdout, exitCode} without throwing. */
export function dockerExecSafe(cmd: string): {
  stdout: string;
  exitCode: number;
} {
  try {
    const stdout = dockerExec(cmd);
    return { stdout, exitCode: 0 };
  } catch (err: unknown) {
    const e = err as { status?: number; stdout?: string };
    return {
      stdout: (e.stdout ?? "") as string,
      exitCode: (e.status ?? 1) as number,
    };
  }
}

/** Pipe stdin to a command inside the container, return {stdout, exitCode} without throwing. */
export function dockerExecStdinSafe(
  cmd: string,
  stdin: string,
): { stdout: string; exitCode: number } {
  try {
    const stdout = dockerExecStdin(cmd, stdin);
    return { stdout, exitCode: 0 };
  } catch (err: unknown) {
    const e = err as { status?: number; stdout?: string };
    return {
      stdout: (e.stdout ?? "") as string,
      exitCode: (e.status ?? 1) as number,
    };
  }
}

/** Build the Docker image. */
export function buildImage(contextDir: string): void {
  exec(`docker build -t ${IMAGE} --load ${contextDir}`, {
    timeout: 300_000,
    stdio: ["pipe", "pipe", "pipe"],
  });
}

/** Start a detached container for running tests. */
export function startContainer(): void {
  try {
    exec(`docker rm -f ${CONTAINER}`, { stdio: "pipe" });
  } catch {
    // ignore - container may not exist
  }
  exec(
    `docker run -d --name ${CONTAINER} --entrypoint tail ${IMAGE} -f /dev/null`,
  );
}

/** Stop and remove the container. */
export function stopContainer(): void {
  try {
    exec(`docker rm -f ${CONTAINER}`, { stdio: "pipe" });
  } catch {
    // ignore
  }
  try {
    exec(`docker image rm -f ${IMAGE}`, { stdio: "pipe", timeout: 120_000 });
  } catch {
    // ignore
  }
  try {
    exec("docker builder prune -af", { stdio: "pipe", timeout: 120_000 });
  } catch {
    // ignore
  }
}
