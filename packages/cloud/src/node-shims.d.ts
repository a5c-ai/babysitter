declare namespace NodeJS {
  interface ProcessEnv {
    [key: string]: string | undefined;
  }
}

interface ChunkLike {
  toString(): string;
}

declare const process: {
  argv: string[];
  env: NodeJS.ProcessEnv;
  exitCode?: number;
  cwd(): string;
  stdout: { write(message: string): void };
  stderr: { write(message: string): void };
};

declare module "node:fs/promises" {
  export function readFile(path: string, encoding: string): Promise<string>;
  export function writeFile(path: string, contents: string, encoding: string): Promise<void>;
  export function mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
}

declare module "node:path" {
  export function resolve(...paths: string[]): string;
  export function join(...paths: string[]): string;
  export function dirname(path: string): string;
}

declare module "node:crypto" {
  export function randomBytes(size: number): { toString(encoding: string): string };
}

declare module "node:child_process" {
  interface StreamLike {
    on(event: "data", callback: (chunk: ChunkLike | string) => void): void;
  }

  interface SpawnedChild {
    stdout: StreamLike;
    stderr: StreamLike;
    on(event: "error", callback: (error: Error) => void): void;
    on(event: "close", callback: (code: number | null) => void): void;
  }

  export function spawn(
    command: string,
    args: readonly string[],
    options?: {
      cwd?: string;
      env?: Record<string, string | undefined>;
      stdio?: readonly string[];
    },
  ): SpawnedChild;
}
