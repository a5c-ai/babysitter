/**
 * Type definitions for Pi secure sandbox.
 * Extracted from piSecureSandbox.ts for max-lines compliance.
 */

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

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface SandboxAdapterLike {
  exec(cmd: string, args?: string[], opts?: { cwd?: string; sudo?: boolean; detached?: boolean; env?: Record<string, string> }): Promise<ExecResult>;
  writeFile(path: string, content: string | Buffer, opts?: { sudo?: boolean }): Promise<void>;
  readFile(path: string): Promise<string>;
  stop?(): Promise<void>;
  fileExists?(path: string): Promise<boolean>;
}

export interface SecuredSandboxLike {
  exec(command: string, opts?: { cwd?: string; timeout?: number }): Promise<ExecResult>;
  stop(): Promise<void>;
  readonly sessionId: string;
  readonly securityMode: string;
}

export interface AgentSHModule {
  secureSandbox(adapter: SandboxAdapterLike, config?: Record<string, unknown>): Promise<SecuredSandboxLike>;
}

export interface SecureBashBackend {
  operations: PiBashOperations;
  dispose(): Promise<void>;
  promptNote: string;
}
