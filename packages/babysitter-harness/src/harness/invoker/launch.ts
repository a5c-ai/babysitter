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

function quotePowerShellArg(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

export function buildLaunchSpec(
  name: string,
  spec: HarnessCliSpec,
  cliPath: string | undefined,
  args: string[],
  promptFilePath?: string,
): LaunchSpec {
  if (process.platform === "win32" && name === "codex") {
    const commandLine = [
      "Get-Content -Raw",
      quotePowerShellArg(promptFilePath ?? ""),
      "|",
      "&",
      quotePowerShellArg(spec.cli),
      ...args.map(quotePowerShellArg),
    ].join(" ");

    return {
      command: "powershell.exe",
      args: ["-NoProfile", "-Command", commandLine],
      shell: false,
    };
  }

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
