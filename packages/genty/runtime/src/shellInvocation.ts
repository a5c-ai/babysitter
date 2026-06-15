export interface ShellInvocation {
  command: string;
  args: string[];
}

export function buildShellInvocation(
  command: string,
  platform: NodeJS.Platform = process.platform,
): ShellInvocation {
  return platform === "win32"
    ? { command: "cmd.exe", args: ["/c", command] }
    : { command: "/bin/bash", args: ["-c", command] };
}
