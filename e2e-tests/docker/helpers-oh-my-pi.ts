import { execSync, ExecSyncOptions } from "child_process";

export const OH_MY_PI_IMAGE = "babysitter-oh-my-pi-e2e:test";
export const OH_MY_PI_CONTAINER = "babysitter-oh-my-pi-e2e-container";
export const OH_MY_PI_PACKAGE_ROOT = "/home/omp/.local/lib/node_modules/@a5c-ai/babysitter-omp";
export const OH_MY_PI_SKILL_DIR = `${OH_MY_PI_PACKAGE_ROOT}/skills/babysit`;

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
  return exec(`docker exec -i ${OH_MY_PI_CONTAINER} bash`, {
    ...opts,
    input: cmd + "\n",
  });
}

export function buildOhMyPiImage(contextDir: string): void {
  exec(`docker build -f ${contextDir}/e2e-tests/docker/Dockerfile.oh-my-pi -t ${OH_MY_PI_IMAGE} --load ${contextDir}`, {
    timeout: 900_000,
    stdio: ["pipe", "pipe", "pipe"],
  });
}

export function startOhMyPiContainer(): void {
  try {
    exec(`docker rm -f ${OH_MY_PI_CONTAINER}`, { stdio: "pipe" });
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

  exec(`docker run -d --name ${OH_MY_PI_CONTAINER} ${envArgs} --entrypoint tail ${OH_MY_PI_IMAGE} -f /dev/null`, {
    timeout: 120_000,
  });
}

export function stopOhMyPiContainer(): void {
  try {
    exec(`docker rm -f ${OH_MY_PI_CONTAINER}`, { stdio: "pipe" });
  } catch {
    // ignore
  }
  try {
    exec(`docker image rm -f ${OH_MY_PI_IMAGE}`, { stdio: "pipe", timeout: 120_000 });
  } catch {
    // ignore
  }
  try {
    exec("docker builder prune -af", { stdio: "pipe", timeout: 120_000 });
  } catch {
    // ignore
  }
}
