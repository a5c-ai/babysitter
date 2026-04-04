import { execSync, ExecSyncOptions } from "child_process";

export const GITHUB_IMAGE = "babysitter-github-e2e:test";
export const GITHUB_CONTAINER = "babysitter-github-e2e-container";
export const PLUGIN_DIR = "/home/github/.copilot/plugins/babysitter";

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
  return exec(`docker exec -i ${GITHUB_CONTAINER} bash`, {
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

export function buildImage(contextDir: string): void {
  exec(
    `docker build -f ${contextDir}/e2e-tests/docker/Dockerfile.github -t ${GITHUB_IMAGE} --load ${contextDir}`,
    {
      timeout: 900_000,
      stdio: ["pipe", "pipe", "pipe"],
    },
  );
}

export function startContainer(): void {
  try {
    exec(`docker rm -f ${GITHUB_CONTAINER}`, { stdio: "pipe" });
  } catch {
    // ignore - container may not exist
  }
  exec(
    `docker run -d --name ${GITHUB_CONTAINER} --entrypoint tail ${GITHUB_IMAGE} -f /dev/null`,
    { timeout: 120_000 },
  );
}

export function stopContainer(): void {
  try {
    exec(`docker rm -f ${GITHUB_CONTAINER}`, { stdio: "pipe" });
  } catch {
    // ignore
  }
  try {
    exec(`docker image rm -f ${GITHUB_IMAGE}`, { stdio: "pipe", timeout: 120_000 });
  } catch {
    // ignore
  }
  try {
    exec("docker builder prune -af", { stdio: "pipe", timeout: 120_000 });
  } catch {
    // ignore
  }
}
