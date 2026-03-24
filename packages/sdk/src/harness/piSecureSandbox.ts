import * as path from "node:path";
import { spawn } from "node:child_process";

const AGENTSH_MODULE_ID = "@agentsh/secure-sandbox";
const DEFAULT_SANDBOX_IMAGE = process.env.BABYSITTER_PI_SANDBOX_IMAGE || "node:22-bookworm";
const CONTAINER_WORKSPACE = "/workspace";

export interface PiBashOperations {
  exec: (
    command: string,
    cwd: string,
    options: {
      onData: (data: Buffer) => void;
      signal?: AbortSignal;
      timeout?: number;
      env?: NodeJS.ProcessEnv;
    },
  ) => Promise<{ exitCode: number | null }>;
}

interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

interface SandboxAdapterLike {
  exec(
    cmd: string,
    args?: string[],
    opts?: {
      cwd?: string;
      sudo?: boolean;
      detached?: boolean;
      env?: Record<string, string>;
    },
  ): Promise<ExecResult>;
  writeFile(path: string, content: string | Buffer, opts?: { sudo?: boolean }): Promise<void>;
  readFile(path: string): Promise<string>;
  stop?(): Promise<void>;
  fileExists?(path: string): Promise<boolean>;
}

interface SecuredSandboxLike {
  exec(
    command: string,
    opts?: {
      cwd?: string;
      timeout?: number;
    },
  ): Promise<ExecResult>;
  stop(): Promise<void>;
  readonly sessionId: string;
  readonly securityMode: string;
}

interface AgentSHModule {
  secureSandbox(
    adapter: SandboxAdapterLike,
    config?: Record<string, unknown>,
  ): Promise<SecuredSandboxLike>;
}

export interface SecureBashBackend {
  operations: PiBashOperations;
  dispose(): Promise<void>;
  promptNote: string;
}

const dynamicImportAgentSH: (specifier: string) => Promise<unknown> = (() => {
  if (process.env.VITEST) {
    return (specifier: string) => import(specifier);
  }
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  return new Function("id", "return import(id)") as (id: string) => Promise<unknown>;
})();

async function loadAgentSHModule(): Promise<AgentSHModule> {
  const mod = await dynamicImportAgentSH(AGENTSH_MODULE_ID);
  return mod as AgentSHModule;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error &&
    (error.name === "AbortError" || error.message.toLowerCase().includes("aborted"));
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'"'"'`)}'`;
}

function buildEnvPrefix(env?: NodeJS.ProcessEnv): string {
  if (!env) return "";
  const parts = Object.entries(env)
    .filter((entry): entry is [string, string] => typeof entry[1] === "string")
    .map(([key, value]) => `${key}=${shellQuote(value)}`);
  return parts.length > 0 ? `${parts.join(" ")} ` : "";
}

function toDockerExecArgs(
  containerName: string,
  options?: {
    cwd?: string;
    env?: Record<string, string>;
    detached?: boolean;
    sudo?: boolean;
  },
): string[] {
  const args = ["exec"];
  if (options?.detached) args.push("-d");
  if (options?.cwd) args.push("-w", options.cwd);
  if (options?.sudo) args.push("--user", "root");
  if (options?.env) {
    for (const [key, value] of Object.entries(options.env)) {
      args.push("-e", `${key}=${value}`);
    }
  }
  args.push(containerName);
  return args;
}

function mapHostPathToContainer(workspaceHost: string, targetPath?: string): string {
  if (!targetPath) return CONTAINER_WORKSPACE;
  const base = path.resolve(workspaceHost);
  const target = path.resolve(targetPath);
  const relative = path.relative(base, target);
  if (!relative || relative === ".") return CONTAINER_WORKSPACE;
  if (relative.startsWith("..") || path.isAbsolute(relative)) return CONTAINER_WORKSPACE;
  return path.posix.join(CONTAINER_WORKSPACE, ...relative.split(path.sep).filter(Boolean));
}

function normalizeContainerPath(workspaceHost: string, targetPath?: string): string {
  if (!targetPath) {
    return CONTAINER_WORKSPACE;
  }
  if (targetPath.startsWith("/")) {
    return targetPath;
  }
  return mapHostPathToContainer(workspaceHost, targetPath);
}

function createContainerName(): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `babysitter-pi-${process.pid}-${random}`;
}

function runCommand(
  command: string,
  args: string[],
  options?: {
    cwd?: string;
    env?: NodeJS.ProcessEnv;
    input?: string | Buffer;
    timeout?: number;
  },
): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options?.cwd,
      env: options?.env,
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    });

    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    let timedOut = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (options?.timeout && options.timeout > 0) {
      timer = setTimeout(() => {
        timedOut = true;
        child.kill("SIGTERM");
      }, options.timeout);
    }

    child.stdout.on("data", (chunk: Buffer) => stdout.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      if (timer) clearTimeout(timer);
      if (timedOut) {
        reject(new Error(`${command} timed out after ${options?.timeout}ms`));
        return;
      }
      resolve({
        stdout: Buffer.concat(stdout).toString("utf8"),
        stderr: Buffer.concat(stderr).toString("utf8"),
        exitCode: code ?? 1,
      });
    });

    if (options?.input !== undefined) {
      child.stdin.write(options.input);
    }
    child.stdin.end();
  });
}

class DockerSandboxAdapter implements SandboxAdapterLike {
  constructor(
    private readonly containerName: string,
    private readonly workspaceHost: string,
  ) {}

  async exec(
    cmd: string,
    args?: string[],
    opts?: {
      cwd?: string;
      sudo?: boolean;
      detached?: boolean;
      env?: Record<string, string>;
    },
  ): Promise<ExecResult> {
    const dockerArgs = [
      ...toDockerExecArgs(this.containerName, {
        cwd: normalizeContainerPath(this.workspaceHost, opts?.cwd),
        env: opts?.env,
        detached: opts?.detached,
        sudo: opts?.sudo,
      }),
      cmd,
      ...(args ?? []),
    ];

    const result = await runCommand("docker", dockerArgs);
    if (opts?.detached) {
      return { stdout: "", stderr: "", exitCode: result.exitCode };
    }
    return result;
  }

  async writeFile(filePath: string, content: string | Buffer, opts?: { sudo?: boolean }): Promise<void> {
    const dockerArgs = [
      ...toDockerExecArgs(this.containerName, {
        cwd: CONTAINER_WORKSPACE,
        sudo: opts?.sudo,
      }),
      "sh",
      "-lc",
      "mkdir -p \"$(dirname \"$1\")\" && cat > \"$1\"",
      "--",
      filePath,
    ];
    const result = await runCommand("docker", dockerArgs, { input: content });
    if (result.exitCode !== 0) {
      throw new Error(result.stderr || result.stdout || `writeFile failed for ${filePath}`);
    }
  }

  async readFile(filePath: string): Promise<string> {
    const result = await runCommand("docker", [
      ...toDockerExecArgs(this.containerName, { cwd: CONTAINER_WORKSPACE }),
      "sh",
      "-lc",
      "cat \"$1\"",
      "--",
      filePath,
    ]);
    if (result.exitCode !== 0) {
      throw new Error(result.stderr || result.stdout || `readFile failed for ${filePath}`);
    }
    return result.stdout;
  }

  async fileExists(filePath: string): Promise<boolean> {
    const result = await runCommand("docker", [
      ...toDockerExecArgs(this.containerName, { cwd: CONTAINER_WORKSPACE }),
      "sh",
      "-lc",
      "test -f \"$1\"",
      "--",
      filePath,
    ]);
    return result.exitCode === 0;
  }

  async stop(): Promise<void> {
    await runCommand("docker", ["rm", "-f", this.containerName]).catch(() => undefined);
  }
}

class DockerSecureBashBackend implements SecureBashBackend {
  private readonly containerName = createContainerName();
  private readonly adapter: DockerSandboxAdapter;
  private securedSandbox: SecuredSandboxLike | null = null;
  private containerStarted = false;

  constructor(
    private readonly workspaceHost: string,
    private readonly image: string,
  ) {
    this.adapter = new DockerSandboxAdapter(this.containerName, this.workspaceHost);
  }

  get promptNote(): string {
    return [
      "The bash tool runs inside a secure Docker sandbox protected by AgentSH.",
      `The project workspace is mounted inside that sandbox at ${CONTAINER_WORKSPACE}.`,
      "Filesystem tools operate on the host mirror of the same workspace files.",
    ].join(" ");
  }

  get operations(): PiBashOperations {
    return {
      exec: async (command, cwd, options) => {
        if (options.signal?.aborted) {
          return { exitCode: null };
        }

        const sandbox = await this.initialize();
        const sandboxCommand = `${buildEnvPrefix(options.env)}${command}`;

        try {
          const result = await sandbox.exec(sandboxCommand, {
            cwd: mapHostPathToContainer(this.workspaceHost, cwd),
            timeout: options.timeout,
          });
          if (result.stdout) options.onData(Buffer.from(result.stdout));
          if (result.stderr) options.onData(Buffer.from(result.stderr));
          if (options.signal?.aborted) {
            return { exitCode: null };
          }
          return { exitCode: result.exitCode };
        } catch (error: unknown) {
          if (isAbortError(error) || options.signal?.aborted) {
            return { exitCode: null };
          }
          throw error;
        }
      },
    };
  }

  async dispose(): Promise<void> {
    if (this.securedSandbox) {
      await this.securedSandbox.stop().catch(() => undefined);
      this.securedSandbox = null;
      this.containerStarted = false;
      return;
    }
    if (this.containerStarted) {
      await this.adapter.stop?.();
      this.containerStarted = false;
    }
  }

  async ensureReady(): Promise<void> {
    await this.initialize();
  }

  private async initialize(): Promise<SecuredSandboxLike> {
    if (this.securedSandbox) return this.securedSandbox;

    await this.startContainer();
    try {
      const mod = await loadAgentSHModule();
      this.securedSandbox = await mod.secureSandbox(this.adapter, {
        workspace: CONTAINER_WORKSPACE,
        realPaths: true,
        installStrategy: "upload",
      });
      return this.securedSandbox;
    } catch (error: unknown) {
      await this.adapter.stop?.();
      throw error;
    }
  }

  private async startContainer(): Promise<void> {
    if (this.containerStarted) {
      return;
    }
    const result = await runCommand("docker", [
      "run",
      "-d",
      "--rm",
      "--name",
      this.containerName,
      "-v",
      `${path.resolve(this.workspaceHost)}:${CONTAINER_WORKSPACE}`,
      "-w",
      CONTAINER_WORKSPACE,
      this.image,
      "tail",
      "-f",
      "/dev/null",
    ]);
    if (result.exitCode !== 0) {
      throw new Error(result.stderr || result.stdout || "Failed to start PI secure sandbox container.");
    }
    this.containerStarted = true;
  }
}

export async function createSecureBashBackend(options: {
  workspace: string;
  mode: "auto" | "secure" | "local";
  image?: string;
}): Promise<SecureBashBackend | null> {
  if (options.mode === "local") {
    return null;
  }

  const backend = new DockerSecureBashBackend(
    path.resolve(options.workspace),
    options.image || DEFAULT_SANDBOX_IMAGE,
  );

  try {
    await backend.ensureReady();
  } catch (error: unknown) {
    await backend.dispose().catch(() => undefined);
    if (options.mode === "auto") {
      return null;
    }
    throw error;
  }

  return backend;
}
