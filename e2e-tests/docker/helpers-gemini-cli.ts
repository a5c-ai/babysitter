import { execSync, ExecSyncOptions } from "child_process";

export const GEMINI_CLI_IMAGE = "babysitter-gemini-cli-e2e:test";
export const GEMINI_CLI_CONTAINER = "babysitter-gemini-cli-e2e-container";
export const GEMINI_CLI_EXTENSION_DIR =
  "/home/gemini/.gemini/extensions/babysitter-gemini";

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
  return exec(`docker exec -i ${GEMINI_CLI_CONTAINER} bash`, {
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

export function buildGeminiCliImage(contextDir: string): void {
  exec(
    `docker build -f ${contextDir}/e2e-tests/docker/Dockerfile.gemini-cli -t ${GEMINI_CLI_IMAGE} --load ${contextDir}`,
    {
      timeout: 900_000,
      stdio: ["pipe", "pipe", "pipe"],
    },
  );
}

export function startGeminiCliContainer(): void {
  try {
    exec(`docker rm -f ${GEMINI_CLI_CONTAINER}`, { stdio: "pipe" });
  } catch {
    // ignore
  }

  exec(
    `docker run -d --name ${GEMINI_CLI_CONTAINER} --entrypoint tail ${GEMINI_CLI_IMAGE} -f /dev/null`,
    { timeout: 120_000 },
  );
}

export function stopGeminiCliContainer(): void {
  try {
    exec(`docker rm -f ${GEMINI_CLI_CONTAINER}`, { stdio: "pipe" });
  } catch {
    // ignore
  }
  try {
    exec(`docker image rm -f ${GEMINI_CLI_IMAGE}`, { stdio: "pipe", timeout: 120_000 });
  } catch {
    // ignore
  }
  try {
    exec("docker builder prune -af", { stdio: "pipe", timeout: 120_000 });
  } catch {
    // ignore
  }
}
