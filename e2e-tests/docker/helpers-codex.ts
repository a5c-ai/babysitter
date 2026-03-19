import { execSync, ExecSyncOptions } from "child_process";

export const CODEX_IMAGE = "babysitter-codex-e2e:test";
export const CODEX_CONTAINER = "babysitter-codex-e2e-container";
export const CODEX_SKILL_DIR = "/home/codex/.codex/skills/babysitter-codex";

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
  return exec(`docker exec -i ${CODEX_CONTAINER} bash`, {
    ...opts,
    input: cmd + "\n",
  });
}

export function buildCodexImage(contextDir: string): void {
  exec(`docker build -f ${contextDir}/e2e-tests/docker/Dockerfile.codex -t ${CODEX_IMAGE} --load ${contextDir}`, {
    timeout: 900_000,
    stdio: ["pipe", "pipe", "pipe"],
  });
}

export function startCodexContainer(): void {
  try {
    exec(`docker rm -f ${CODEX_CONTAINER}`, { stdio: "pipe" });
  } catch {
    // ignore
  }

  const openAiKey = process.env.OPENAI_API_KEY || "";
  const openAiBaseUrl = process.env.OPENAI_BASE_URL || "";
  const envArgs = [
    openAiKey ? `-e OPENAI_API_KEY="${openAiKey}"` : "",
    openAiBaseUrl ? `-e OPENAI_BASE_URL="${openAiBaseUrl}"` : "",
  ]
    .filter(Boolean)
    .join(" ");

  exec(
    `docker run -d --name ${CODEX_CONTAINER} ${envArgs} --entrypoint tail ${CODEX_IMAGE} -f /dev/null`,
    { timeout: 120_000 },
  );
}

export function stopCodexContainer(): void {
  try {
    exec(`docker rm -f ${CODEX_CONTAINER}`, { stdio: "pipe" });
  } catch {
    // ignore
  }
}
