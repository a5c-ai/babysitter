export interface HarnessCliSpec {
  cli: string;
  workspaceFlag?: string;
  supportsModel: boolean;
  promptStyle?: "positional" | "flag";
  baseArgs?: string[];
}

export interface LaunchSpec {
  command: string;
  args: string[];
  shell: boolean;
}

/**
 * Build a LaunchSpec for spawning a harness CLI.
 *
 * Only Pi uses direct CLI invocation. External harnesses are routed
 * through agent-mux and never reach this function.
 */
export function buildLaunchSpec(
  _name: string,
  spec: HarnessCliSpec,
  cliPath: string | undefined,
  args: string[],
): LaunchSpec {
  if (process.platform === "win32") {
    return {
      command: spec.cli,
      args,
      shell: true,
    };
  }

  return {
    command: cliPath ?? spec.cli,
    args,
    shell: false,
  };
}
