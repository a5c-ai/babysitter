import { execSync, ExecSyncOptions } from "child_process";

export const CURSOR_IMAGE = "babysitter-cursor-e2e:test";
export const CURSOR_CONTAINER = "babysitter-cursor-e2e-container";
export const CURSOR_PLUGIN_DIR = "/home/cursor/.cursor/plugins/local/babysitter";

const DEFAULT_OPTS: ExecSyncOptions = {
  encoding: "utf-8" as BufferEncoding,
  timeout: 30_000,
  stdio: ["pipe", "pipe", "pipe"],
  env: { ...process.env, MSYS_NO_PATHCONV: "1" },
};

export function exec(cmd: string, opts?: ExecSyncOptions): string {
  return execSync(cmd, { ...DEFAULT_OPTS, ...opts }) as unknown as string;
}

export function dockerExec(cmd: string, opts?: ExecSyncOptions): string {
  return exec(`docker exec -i ${CURSOR_CONTAINER} bash`, {
    ...opts,
    input: cmd + "\n",
  });
}

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

export function buildCursorImage(contextDir: string): void {
  exec(
    `docker build -f ${contextDir}/e2e-tests/docker/Dockerfile.cursor -t ${CURSOR_IMAGE} --load ${contextDir}`,
    {
      timeout: 900_000,
      stdio: ["pipe", "pipe", "pipe"],
    },
  );
}

export function startCursorContainer(): void {
  try {
    exec(`docker rm -f ${CURSOR_CONTAINER}`, { stdio: "pipe" });
  } catch {
    // ignore
  }

  exec(
    `docker run -d --name ${CURSOR_CONTAINER} --entrypoint tail ${CURSOR_IMAGE} -f /dev/null`,
    { timeout: 120_000 },
  );
}

export function stopCursorContainer(): void {
  try {
    exec(`docker rm -f ${CURSOR_CONTAINER}`, { stdio: "pipe" });
  } catch {
    // ignore
  }
  try {
    exec(`docker image rm -f ${CURSOR_IMAGE}`, { stdio: "pipe", timeout: 120_000 });
  } catch {
    // ignore
  }
  try {
    exec("docker builder prune -af", { stdio: "pipe", timeout: 120_000 });
  } catch {
    // ignore
  }
}
