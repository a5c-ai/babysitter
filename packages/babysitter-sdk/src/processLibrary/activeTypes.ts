/**
 * Type definitions for process library management.
 * Extracted from active.ts for max-lines compliance.
 */

export interface ProcessLibraryBinding {
  dir: string;
  repoUrl?: string;
  ref?: string;
  revision?: string;
  boundAt: string;
}

export interface ProcessLibraryState {
  version: 1;
  updatedAt: string;
  defaultBinding?: ProcessLibraryBinding;
  runBindings?: Record<string, ProcessLibraryBinding>;
  sessionBindings?: Record<string, ProcessLibraryBinding>;
}

export interface CloneProcessLibraryOptions {
  repo: string;
  dir: string;
  ref?: string;
}

export interface CloneProcessLibraryResult {
  dir: string;
  repo: string;
  ref?: string;
  revision: string;
}

export interface UpdateProcessLibraryOptions {
  dir: string;
  ref?: string;
}

export interface UpdateProcessLibraryResult {
  dir: string;
  repo?: string;
  ref?: string;
  revision: string;
}

export interface BindProcessLibraryOptions {
  stateDir?: string;
  dir: string;
  runId?: string;
  sessionId?: string;
  ref?: string;
}

export interface BindProcessLibraryResult {
  stateFile: string;
  bindingScope: "default" | "run" | "session" | "run+session";
  bindingKey?: string;
  binding: ProcessLibraryBinding;
}

export interface ResolveActiveProcessLibraryOptions {
  stateDir?: string;
  runId?: string;
  sessionId?: string;
}

export interface ResolveActiveProcessLibraryResult {
  stateFile: string;
  bindingScope: "default" | "run" | "session" | null;
  bindingKey?: string;
  binding: ProcessLibraryBinding | null;
}

export interface DefaultProcessLibrarySpec {
  stateDir: string;
  repo: string;
  ref?: string;
  cloneDir: string;
  processRoot: string;
  referenceRoot: string;
}

export interface EnsureActiveProcessLibraryOptions
  extends ResolveActiveProcessLibraryOptions {
  repo?: string;
  cloneDir?: string;
  processDir?: string;
  ref?: string;
}

export interface EnsureActiveProcessLibraryResult
  extends ResolveActiveProcessLibraryResult {
  bootstrapped: boolean;
  defaultSpec: DefaultProcessLibrarySpec;
}
