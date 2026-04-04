/**
 * E2E test helpers for the Paperclip babysitter plugin.
 *
 * Builds a Docker image with the babysitter SDK + paperclip plugin installed,
 * and provides execution helpers for running commands inside the container.
 */

import { execSync, ExecSyncOptions } from "child_process";
import path from "path";

export const PAPERCLIP_IMAGE = "babysitter-paperclip-e2e:test";
export const PAPERCLIP_CONTAINER = "babysitter-paperclip-e2e-container";
export const PAPERCLIP_PLUGIN_DIR = "/app/plugins/babysitter-paperclip";

const DEFAULT_OPTS: ExecSyncOptions = {
  encoding: "utf-8" as BufferEncoding,
  timeout: 30_000,
  stdio: ["pipe", "pipe", "pipe"],
  env: { ...process.env, MSYS_NO_PATHCONV: "1" },
};

/** Run a command on the host. */
export function exec(cmd: string, opts?: ExecSyncOptions): string {
  return execSync(cmd, { ...DEFAULT_OPTS, ...opts }) as unknown as string;
}

/** Run a command inside the Paperclip E2E container. */
export function dockerExec(cmd: string, opts?: ExecSyncOptions): string {
  return exec(`docker exec -i ${PAPERCLIP_CONTAINER} bash`, {
    ...opts,
    input: cmd + "\n",
  });
}

/** Run a command inside the container without throwing. */
export function dockerExecSafe(cmd: string): {
  stdout: string;
  exitCode: number;
} {
  try {
    const stdout = dockerExec(cmd);
    return { stdout, exitCode: 0 };
  } catch (err: unknown) {
    const error = err as { stdout?: string; status?: number };
    return {
      stdout: error.stdout ?? "",
      exitCode: error.status ?? 1,
    };
  }
}

/** Build the Paperclip E2E Docker image. */
export function buildPaperclipImage(contextDir: string): void {
  const dockerfile = path.resolve(
    __dirname,
    "Dockerfile.paperclip"
  );
  exec(
    `docker build -t ${PAPERCLIP_IMAGE} -f ${dockerfile} --load ${contextDir}`,
    { timeout: 300_000 }
  );
}

/** Start the Paperclip E2E container. */
export function startPaperclipContainer(): void {
  // Remove any existing container
  try {
    exec(`docker rm -f ${PAPERCLIP_CONTAINER}`, { timeout: 10_000 });
  } catch {
    // Container doesn't exist - fine
  }

  exec(
    `docker run -d --name ${PAPERCLIP_CONTAINER} --entrypoint tail ${PAPERCLIP_IMAGE} -f /dev/null`,
    { timeout: 30_000 }
  );
}

/** Stop and remove the Paperclip E2E container. */
export function stopPaperclipContainer(): void {
  try {
    exec(`docker rm -f ${PAPERCLIP_CONTAINER}`, { timeout: 10_000 });
  } catch {
    // Ignore
  }
  try {
    exec(`docker rmi -f ${PAPERCLIP_IMAGE}`, { timeout: 10_000 });
  } catch {
    // Ignore
  }
}
