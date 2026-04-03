import { execSync, ExecSyncOptions } from "child_process";

export const PI_IMAGE = "babysitter-pi-e2e:test";
export const PI_CONTAINER = "babysitter-pi-e2e-container";
export const PI_PACKAGE_ROOT = "/home/pi/.local/lib/node_modules/@a5c-ai/babysitter-pi";
export const PI_SKILL_DIR = `${PI_PACKAGE_ROOT}/skills/babysit`;

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
  return exec(`docker exec -i ${PI_CONTAINER} bash`, {
    ...opts,
    input: cmd + "\n",
  });
}

export function buildPiImage(contextDir: string): void {
  exec(`docker build -f ${contextDir}/e2e-tests/docker/Dockerfile.pi -t ${PI_IMAGE} --load ${contextDir}`, {
    timeout: 900_000,
    stdio: ["pipe", "pipe", "pipe"],
  });
}

export function startPiContainer(): void {
  try {
    exec(`docker rm -f ${PI_CONTAINER}`, { stdio: "pipe" });
  } catch {
    // ignore
  }

  const forwardedEnvNames = [
    "A5C_PROVIDER_NAME",
    "A5C_SELECTED_CLI_COMMAND",
    "A5C_CLI_TOOL",
    "A5C_SELECTED_MODEL",
  ];
  const envArgs = forwardedEnvNames
    .filter((name) => Boolean(process.env[name]))
    .map((name) => `-e ${name}`)
    .join(" ");

  exec(`docker run -d --name ${PI_CONTAINER} ${envArgs} --entrypoint tail ${PI_IMAGE} -f /dev/null`, {
    timeout: 120_000,
  });
}

export function stopPiContainer(): void {
  try {
    exec(`docker rm -f ${PI_CONTAINER}`, { stdio: "pipe" });
  } catch {
    // ignore
  }
  try {
    exec(`docker image rm -f ${PI_IMAGE}`, { stdio: "pipe", timeout: 120_000 });
  } catch {
    // ignore
  }
  try {
    exec("docker builder prune -af", { stdio: "pipe", timeout: 120_000 });
  } catch {
    // ignore
  }
}
